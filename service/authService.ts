import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    deleteUser,
    GoogleAuthProvider,
    signInWithCredential,
} from "firebase/auth";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, getDoc, serverTimestamp } from "firebase/firestore";
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

// Sign in (or register) a user using Google ID token.
// - idToken: ID token obtained from Google (expo-auth-session)
// Behavior:
// 1. Create Firebase credential and sign in.
// 2. Ensure a Firestore `users/{uid}` document exists (upsert).
// 3. Return the Firebase user object.
export const signInWithGoogle = async (idToken: string) => {
  if (!idToken) throw new Error("Missing Google ID token");
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  if (!user) throw new Error("Failed to sign in with Google");

  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    // Create a minimal user document for new Google sign-ins
    await setDoc(userDocRef, {
      name: user.displayName || user.email || "",
      email: user.email || "",
      role: "student",
      createdAt: serverTimestamp(),
    });
  } else {
    // Optionally update missing fields (don't overwrite custom roles)
    const data = userSnap.data() || {};
    const updates: any = {};
    if (!data.email && user.email) updates.email = user.email;
    if (!data.name && user.displayName) updates.name = user.displayName;
    if (Object.keys(updates).length > 0) {
      await setDoc(userDocRef, { ...data, ...updates });
    }
  }

  return user;
};
