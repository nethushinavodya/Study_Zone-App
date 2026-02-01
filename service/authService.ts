import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    deleteUser,
} from "firebase/auth";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";

export const registerUser = async (
  username: string,
  email: string,
  password: string,
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await updateProfile(userCredential.user, {
    displayName: username,
  });
  await setDoc(doc(db, "users", userCredential.user.uid), {
    name: username,
    email: email,
    role: "student",
    createdAt: new Date(),
  });
  return userCredential.user;
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await updateProfile(userCredential.user, {
    displayName: email,
  });
  return userCredential.user;
};

export const logoutUser = async () => {
  await auth.signOut();
  AsyncStorage.clear();
  return;
};

export const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Delete user's bookmarks
  const bookmarksQuery = query(collection(db, "bookmarks"), where("userId", "==", user.uid));
  const bookmarksSnapshot = await getDocs(bookmarksQuery);
  const deleteBookmarksPromises = bookmarksSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deleteBookmarksPromises);

  // Delete user's questions
  const questionsQuery = query(collection(db, "questions"), where("userId", "==", user.uid));
  const questionsSnapshot = await getDocs(questionsQuery);
  const deleteQuestionsPromises = questionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deleteQuestionsPromises);

  // Delete user document
  await deleteDoc(doc(db, "users", user.uid));

  // Delete user authentication
  await deleteUser(user);

  // Clear local storage
  await AsyncStorage.clear();
};

