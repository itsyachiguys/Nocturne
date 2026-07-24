import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export const AuthService = {
  async register(name: string, email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name,
    });

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name,
        email: user.email,
        photoURL: user.photoURL ?? null,

        provider: "password",

        university: null,
        semester: null,
        branch: null,

        onboardingCompleted: false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return user;
  },

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return userCredential.user;
  },

  async logout() {
    await signOut(auth);
  },

  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  },

  async signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name: user.displayName ?? "",
        email: user.email,
        photoURL: user.photoURL ?? null,

        provider: "google",

        university: null,
        semester: null,
        branch: null,

        onboardingCompleted: false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return user;
  },
};