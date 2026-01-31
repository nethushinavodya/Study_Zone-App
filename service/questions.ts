import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import {
  addDoc,
  collection,
  doc as docRef,
  increment,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  runTransaction,
  getDoc,
   getDocs,
} from "firebase/firestore";
import { auth, db, storage } from "./firebase";
import { ref as storageRef, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";

const FIRESTORE_LIMIT = 1048487;

function makeStorageName(ext = "jpg") {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

async function tryCompressNative(uri: string) {
  try {
    const widths = [1200, 800, 600, 400];
    const qualities = [0.8, 0.7, 0.6, 0.5];
    for (const w of widths) {
      for (const q of qualities) {
        try {
          const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: w } }],
            { compress: q, format: ImageManipulator.SaveFormat.JPEG },
          );
          const b64 = await FileSystem.readAsStringAsync(result.uri, { encoding: "base64" });
          const dataUrl = `data:image/jpeg;base64,${b64}`;
          if (dataUrl.length <= FIRESTORE_LIMIT) return dataUrl;
        } catch {
          // ignore and continue
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function tryCompressDataUrlWeb(dataUrl: string) {
  if (typeof document === "undefined") return null;
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const widths = [1200, 800, 600, 400];
        const qualities = [0.9, 0.8, 0.7, 0.6, 0.5];
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        const tryNext = (wIndex = 0, qIndex = 0) => {
          if (wIndex >= widths.length) return resolve(null);
          const targetW = Math.min(widths[wIndex], origW);
          const ratio = targetW / origW;
          const targetH = Math.max(1, Math.round(origH * ratio));
          const canvas = document.createElement("canvas") as HTMLCanvasElement;
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const quality = qualities[qIndex];
          try {
            const out = canvas.toDataURL("image/jpeg", quality);
            if (out.length <= FIRESTORE_LIMIT) return resolve(out);
          } catch {
            // ignore
          }
          let nextW = wIndex;
          let nextQ = qIndex + 1;
          if (nextQ >= qualities.length) {
            nextQ = 0;
            nextW = wIndex + 1;
          }
          tryNext(nextW, nextQ);
        };
        tryNext();
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

export async function postQuestion(text: string, imageUri?: string) {
  console.log('postQuestion called, imageUri:', imageUri);
  // Try to obtain a dataURL and save it directly into Firestore.imageBase64
  let imageBase64: string | null = null;

  if (imageUri) {
    // If it's already a data URL (web), save it directly (compress if too large)
    if (imageUri.startsWith('data:')) {
      if (imageUri.length <= FIRESTORE_LIMIT) {
        imageBase64 = imageUri;
      } else {
        const compressed = await tryCompressDataUrlWeb(imageUri);
        if (compressed) imageBase64 = compressed;
      }
    } else {
      // Non-data URIs: try to upload to Storage and save download URL, else fallback to dataURL
      try {
        // ensure auth for Storage writes
        if (!auth.currentUser) {
          await signInAnonymously(auth).catch(() => {});
        }
        const uid = auth.currentUser?.uid ?? 'anon';
        const name = makeStorageName('jpg');

        // try fetch->blob and upload to storage
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const sref = storageRef(storage, `questions/${uid}/${name}`);
        await uploadBytes(sref, blob as any);
        imageBase64 = await getDownloadURL(sref);
        console.log('Stored storage download URL into imageBase64 (blob path)');
      } catch (storageErr) {
        console.warn('Storage upload failed, falling back to saving data URL into Firestore:', storageErr);

        // fallback: convert to data URL and compress if needed, then save the data URL in Firestore
        try {
          const res2 = await fetch(imageUri);
          const blob2 = await res2.blob();
          const dataUrl = await blobToDataUrl(blob2);
          if (dataUrl.length <= FIRESTORE_LIMIT) imageBase64 = dataUrl;
          else {
            const compressed = await tryCompressDataUrlWeb(dataUrl);
            if (compressed) imageBase64 = compressed;
          }
        } catch (e) {
          console.warn('fetch->blob->dataUrl failed, trying FileSystem fallback', e);
          try {
            const b64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
            const dataUrl = `data:image/jpeg;base64,${b64}`;
            if (dataUrl.length <= FIRESTORE_LIMIT) imageBase64 = dataUrl;
            else {
              const compressed = await tryCompressNative(imageUri);
              if (compressed) imageBase64 = compressed;
            }
          } catch (e2) {
            console.warn('FileSystem fallback failed', e2);
          }
        }
      }
    }
  }

  // final fallback: if nothing succeeded, store the original imageUri so field isn't null
  if (!imageBase64 && imageUri) {
    console.warn('All attempts failed — saving original imageUri into imageBase64 as fallback');
    imageBase64 = imageUri;
  }

  const dRef = await addDoc(collection(db, "questions"), {
    text,
    imageBase64,
    userId: auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
    likes: 0,
  });
  console.log('Created question doc', dRef.id, 'imageBase64:', !!imageBase64);
  return dRef.id;
}

export function listenQuestions(
  onUpdate: (items: Record<string, any>[]) => void,
) {
  const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    onUpdate(data);
  });
}

export async function postAnswer(
  questionId: string,
  text?: string,
  imageUri?: string,
) {
  console.log('postAnswer called for', questionId, 'imageUri:', imageUri);
  let imageBase64: string | null = null;

  if (imageUri) {
    // If data URL, save directly
    if (imageUri.startsWith('data:')) {
      if (imageUri.length <= FIRESTORE_LIMIT) imageBase64 = imageUri;
      else {
        const compressed = await tryCompressDataUrlWeb(imageUri);
        if (compressed) imageBase64 = compressed;
      }
    } else {
      // Non-data URIs: try storage then fallback to dataURL
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth).catch(() => {});
        }
        const uid = auth.currentUser?.uid ?? 'anon';
        const name = makeStorageName('jpg');

        const res = await fetch(imageUri);
        const blob = await res.blob();
        const sref = storageRef(storage, `questions/${questionId}/answers/${uid}-${name}`);
        await uploadBytes(sref, blob as any);
        imageBase64 = await getDownloadURL(sref);
        console.log('Stored storage download URL into imageBase64 for answer (blob)');
      } catch (storageErr) {
        console.warn('Storage upload failed for answer, falling back to data URL:', storageErr);
        try {
          const res2 = await fetch(imageUri);
          const blob2 = await res2.blob();
          const dataUrl = await blobToDataUrl(blob2);
          if (dataUrl.length <= FIRESTORE_LIMIT) imageBase64 = dataUrl;
          else {
            const compressed = await tryCompressDataUrlWeb(dataUrl);
            if (compressed) imageBase64 = compressed;
          }
        } catch (e) {
          console.warn('fetch->blob->dataUrl failed for answer, trying FileSystem fallback', e);
          try {
            const b64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
            const dataUrl = `data:image/jpeg;base64,${b64}`;
            if (dataUrl.length <= FIRESTORE_LIMIT) imageBase64 = dataUrl;
            else {
              const compressed = await tryCompressNative(imageUri);
              if (compressed) imageBase64 = compressed;
            }
          } catch (e2) {
            console.warn('FileSystem fallback failed for answer', e2);
          }
        }
      }
    }
  }

  if (!imageBase64 && imageUri) {
    console.warn('All attempts failed for answer — saving original imageUri into imageBase64 as fallback');
    imageBase64 = imageUri;
  }

  const ansRef = await addDoc(
    collection(db, "questions", questionId, "answers"),
    {
      text: text || null,
      imageBase64,
      userId: auth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
    },
  );
  console.log('Created answer doc', ansRef.id, 'imageBase64:', !!imageBase64);
  return ansRef.id;
}

export function listenAnswers(
  questionId: string,
  onUpdate: (items: Record<string, any>[]) => void,
) {
  const q = query(
    collection(db, "questions", questionId, "answers"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap: QuerySnapshot) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    onUpdate(data);
  });
}

export async function fetchAnswersOnce(questionId: string) {
  const q = query(
    collection(db, "questions", questionId, "answers"),
    orderBy("createdAt", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function likeQuestion(questionId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const likeDocRef = docRef(db, "questions", questionId, "likes", uid);
  const qDocRef = docRef(db, "questions", questionId);
  try {
    await runTransaction(db, async (tx) => {
      const likeSnap = await tx.get(likeDocRef);
      if (likeSnap.exists()) {
        // already liked; nothing to do
        return;
      }
      tx.set(likeDocRef, { userId: uid, createdAt: serverTimestamp() });
      tx.update(qDocRef, { likes: increment(1) });
    });
  } catch (e) {
    // rethrow so caller can handle/log if needed
    throw e;
  }
}

export async function hasLikedQuestion(questionId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  try {
    const likeDocRef = docRef(db, "questions", questionId, "likes", uid);
    const snap = await getDoc(likeDocRef);
    return snap.exists();
  } catch (e) {
    return false;
  }
}
