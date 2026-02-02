import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase";
import { Paper, Textbook } from "./paperService";

export interface Bookmark {
  id: string;
  userId: string;
  paperId: string;
  paper: Paper;
  createdAt: any;
}

export interface TextbookBookmark {
  id: string;
  userId: string;
  textbookId: string;
  textbook: Textbook;
  createdAt: any;
}

export async function addBookmark(paper: Paper) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const bookmarkId = `${user.uid}_${paper.id}`;
  await setDoc(doc(db, "bookmarks", bookmarkId), {
    userId: user.uid,
    paperId: paper.id,
    paper: paper,
    createdAt: new Date(),
  });
}

export async function removeBookmark(paperId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const bookmarkId = `${user.uid}_${paperId}`;
  await deleteDoc(doc(db, "bookmarks", bookmarkId));
}

export async function addTextbookBookmark(textbook: Textbook) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const bookmarkId = `${user.uid}_${textbook.id}`;
  await setDoc(doc(db, "textbookBookmarks", bookmarkId), {
    userId: user.uid,
    textbookId: textbook.id,
    textbook: textbook,
    createdAt: new Date(),
  });
}

export async function removeTextbookBookmark(textbookId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const bookmarkId = `${user.uid}_${textbookId}`;
  await deleteDoc(doc(db, "textbookBookmarks", bookmarkId));
}

export async function getUserBookmarks(): Promise<Paper[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, "bookmarks"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);

    const bookmarks = snapshot.docs
      .map(doc => {
        const data = doc.data();
        console.log("Bookmark data:", data);
        return data.paper as Paper;
      })
      .filter(paper => paper !== undefined && paper !== null && paper.id);

    return bookmarks;
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return [];
  }
}

export async function getUserTextbookBookmarks(): Promise<Textbook[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, "textbookBookmarks"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);

    const bookmarks = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return data.textbook as Textbook;
      })
      .filter(textbook => textbook !== undefined && textbook !== null && textbook.id);

    return bookmarks;
  } catch (error) {
    console.error("Error fetching textbook bookmarks:", error);
    return [];
  }
}

export async function isBookmarked(paperId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const bookmarkId = `${user.uid}_${paperId}`;
  const bookmarkDoc = doc(db, "bookmarks", bookmarkId);

  const { getDoc } = await import("firebase/firestore");
  const docSnap = await getDoc(bookmarkDoc);

  return docSnap.exists();
}

export async function isTextbookBookmarked(textbookId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const bookmarkId = `${user.uid}_${textbookId}`;
  const bookmarkDoc = doc(db, "textbookBookmarks", bookmarkId);

  const { getDoc } = await import("firebase/firestore");
  const docSnap = await getDoc(bookmarkDoc);

  return docSnap.exists();
}

