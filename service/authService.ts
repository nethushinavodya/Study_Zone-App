import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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
