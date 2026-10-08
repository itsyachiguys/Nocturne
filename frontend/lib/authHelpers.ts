import { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// True if this account has an email/password provider attached.
// Google-only accounts return false.
export const hasPassword = (user: User) =>
  user.providerData.some((p) => p.providerId === "password");

// Creates users/{uid} if it doesn't exist yet, so every user
// (web-created, app-created, Google, email) has a profile doc.
export async function ensureUserProfile(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: (user.email ?? "").toLowerCase(),
      name: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      createdAt: serverTimestamp(),
    });
  }
}