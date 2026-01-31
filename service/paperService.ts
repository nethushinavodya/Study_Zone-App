import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    QuerySnapshot,
    setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export async function toggleBookmark(paperId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const docRef = doc(db, "users", uid, "bookmarks", paperId);
  // check existence
  const colRef = collection(db, "users", uid, "bookmarks");
  // Try to get the doc
  const snap = await getDocs(colRef);
  const exists = snap.docs.some((d) => d.id === paperId);
  if (exists) {
    await deleteDoc(docRef);
    return false;
  }
  await setDoc(docRef, { paperId, createdAt: new Date() });
  return true;
}

export async function getBookmarks(): Promise<string[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const colRef = collection(db, "users", uid, "bookmarks");
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.id);
}

export function listenBookmarks(onUpdate: (ids: string[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};
  const colRef = collection(db, "users", uid, "bookmarks");
  const unsub = onSnapshot(colRef, (snap: QuerySnapshot) => {
    onUpdate(snap.docs.map((d) => d.id));
  });
  return unsub;
}
