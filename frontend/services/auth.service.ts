import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
  } from "firebase/auth";
  
  import { auth } from "@/lib/firebase";
  
  const googleProvider = new GoogleAuthProvider();
  
  export const AuthService = {
    async register(name: string, email: string, password: string) {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
  
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
      }
  
      return userCredential.user;
    },
  
    async login(email: string, password: string) {
      const userCredential =
        await signInWithEmailAndPassword(
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
      const result =
        await signInWithPopup(auth, googleProvider);
  
      return result.user;
    },
  };