import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

export interface PaperMetadata {
  title: string;
  grade: string;
  province: string;
  term: string;
  examType: string; // 'AL' or 'OL'
  textbook: string;
  subject: string;
  medium: string;
}

export async function uploadPaperFile(
  metadata: PaperMetadata,
  driveUrl: string
) {

  const docRef = await addDoc(collection(db, "papers"), {
    title: metadata.title,
    grade: metadata.grade,
    province: metadata.province,
    term: metadata.term,
    examType: metadata.examType,
    textbook: metadata.textbook,
    subject: metadata.subject,
    medium: metadata.medium,
    url: driveUrl,
    createdAt: serverTimestamp(),
    authorId: auth.currentUser?.uid ?? null,
  });

  return { id: docRef.id, url: driveUrl };
}

export interface Paper {
  id: string;
  title: string;
  grade: string;
  province: string;
  term: string;
  examType: string;
  textbook: string;
  subject: string;
  medium: string;
  url: string;
  createdAt: any;
  authorId: string | null;
}

export async function getAllPapers(): Promise<Paper[]> {
  const { getDocs, query, orderBy } = await import("firebase/firestore");
  const papersCollection = collection(db, "papers");
  const q = query(papersCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Paper));
}

// Textbook interface and functions
export interface Textbook {
  id: string;
  title: string;
  subject: string;
  grade: string;
  medium: string;
  description?: string;
  url: string;
  coverColor?: string;
  createdAt: any;
  authorId: string | null;
}

export async function uploadTextbook(
  title: string,
  subject: string,
  grade: string,
  medium: string,
  driveUrl: string,
  description?: string,
  coverColor?: string
) {
  const docRef = await addDoc(collection(db, "textbooks"), {
    title,
    subject,
    grade,
    medium,
    url: driveUrl,
    description: description || "",
    coverColor: coverColor || "#4CAF50",
    createdAt: serverTimestamp(),
    authorId: auth.currentUser?.uid ?? null,
  });

  return { id: docRef.id, url: driveUrl };
}

export async function getAllTextbooks(): Promise<Textbook[]> {
  const { getDocs, query, orderBy } = await import("firebase/firestore");
  const textbooksCollection = collection(db, "textbooks");
  const q = query(textbooksCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Textbook));
}

