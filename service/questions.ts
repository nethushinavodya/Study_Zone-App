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
} from "firebase/firestore";
import { auth, db } from "./firebase";

const FIRESTORE_LIMIT = 1048487;

async function tryCompressNative(uri: string) {
  const widths = [1600, 1200, 800, 600, 400];
  const qualities = [0.8, 0.7, 0.6, 0.5];
  for (const w of widths) {
    for (const q of qualities) {
      try {
        const result = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: w } }],
          {
            compress: q,
            format: ImageManipulator.SaveFormat.JPEG,
          },
        );
        const b64 = await FileSystem.readAsStringAsync(result.uri, {
          encoding: "base64",
        });
        const dataUrl = `data:image/jpeg;base64,${b64}`;
        if (dataUrl.length <= FIRESTORE_LIMIT) return dataUrl;
      } catch (e) {
        // ignore and continue
      }
    }
  }
  return null;
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

export async function postQuestion(text: string, imageUri?: string) {
  let imageBase64: string | null = null;

  if (imageUri) {
    if (imageUri.startsWith("data:")) {
      // data URL from web
      if (imageUri.length <= FIRESTORE_LIMIT) {
        imageBase64 = imageUri;
      } else {
        imageBase64 = null;
      }
    } else {
      // native URI: try reading base64 directly and compress if needed
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: "base64",
        });
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        if (dataUrl.length <= FIRESTORE_LIMIT) {
          imageBase64 = dataUrl;
        } else {
          const compressed = await tryCompressNative(imageUri);
          imageBase64 = compressed;
        }
      } catch (e) {
        imageBase64 = null;
      }

      // fallback: try fetch->blob->FileReader (helps on some RN configs and web)
      if (!imageBase64) {
        try {
          const res = await fetch(imageUri);
          const blob = await res.blob();
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl.length <= FIRESTORE_LIMIT) imageBase64 = dataUrl;
        } catch (err) {
          // ignore fallback error
        }
      }
    }
  }

  const dRef = await addDoc(collection(db, "questions"), {
    text,
    imageBase64,
    userId: auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
    likes: 0,
  });
  return dRef.id;
}

export function listenQuestions(
  onUpdate: (items: Array<Record<string, any>>) => void,
) {
  const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, (snap: QuerySnapshot) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    onUpdate(data);
  });
  return unsub;
}

export async function postAnswer(
  questionId: string,
  text?: string,
  imageUri?: string,
) {
  let imageBase64: string | null = null;

  if (imageUri) {
    if (imageUri.startsWith("data:")) {
      if (imageUri.length <= FIRESTORE_LIMIT) {
        imageBase64 = imageUri;
      } else {
        imageBase64 = null;
      }
    } else {
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: "base64",
        });
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        if (dataUrl.length <= FIRESTORE_LIMIT) {
          imageBase64 = dataUrl;
        } else {
          const compressed = await tryCompressNative(imageUri);
          imageBase64 = compressed;
        }
      } catch (e) {
        imageBase64 = null;
      }

      // fallback: try fetch->blob->FileReader
      if (!imageBase64) {
        try {
          const res = await fetch(imageUri);
          const blob = await res.blob();
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl.length <= FIRESTORE_LIMIT) imageBase64 = dataUrl;
        } catch (err) {
          // ignore
        }
      }
    }
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
  return ansRef.id;
}

export function listenAnswers(
  questionId: string,
  onUpdate: (items: Array<Record<string, any>>) => void,
) {
  const q = query(
    collection(db, "questions", questionId, "answers"),
    orderBy("createdAt", "asc"),
  );
  const unsub = onSnapshot(q, (snap: QuerySnapshot) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    onUpdate(data);
  });
  return unsub;
}

export async function likeQuestion(questionId: string) {
  const qDoc = docRef(db, "questions", questionId);
  try {
    await updateDoc(qDoc, { likes: increment(1) });
  } catch (e) {
    try {
      await setDoc(qDoc, { likes: 1 }, { merge: true });
    } catch (err) {
      // ignore
    }
  }
}
