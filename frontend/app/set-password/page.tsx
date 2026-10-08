"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithPopup,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { AuthPanel } from "@/components/AuthPanel";
import { AuthInput } from "@/components/AuthInput";
import { auth, db } from "@/lib/firebase";
import { hasPassword } from "@/lib/authHelpers";

export default function SetPasswordPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only Google-only users who are signed in should see this page.
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else if (hasPassword(u)) router.replace("/dashboard");
      else setUser(u);
    });
  }, [router]);

  async function linkPassword(u: User, password: string) {
    await linkWithCredential(
      u,
      EmailAuthProvider.credential(u.email!, password)
    );

    await setDoc(
      doc(db, "users", u.uid),
      { passwordSet: true, updatedAt: serverTimestamp() },
      { merge: true }
    );

    router.replace("/dashboard");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (!user.email) {
      setError("Your Google account has no email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await linkPassword(user, password);
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        try {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
          await linkPassword(user, password);
        } catch {
          setError("Please confirm your Google account and try again.");
        }
      } else if (err?.code === "auth/weak-password") {
        setError("Choose a stronger password.");
      } else if (err?.code === "auth/provider-already-linked") {
        router.replace("/dashboard");
      } else if (
        err?.code === "auth/email-already-in-use" ||
        err?.code === "auth/credential-already-in-use"
      ) {
        setError(
          "An email/password account already exists for this email. Contact support."
        );
      } else {
        setError(err?.message ?? "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    await signOut(auth);
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <AuthPanel />

      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-2 text-[28px]">Set a password</h1>

          <p className="mb-8 text-[14px] text-ink-secondary dark:text-ink-secondary-dark">
            You signed in with Google as{" "}
            <span className="font-semibold">{user.email}</span>. Add a
            password so you can also log in with email on web and the app.
          </p>

          {error && (
            <div className="mb-4 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthInput
              label="New password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            <AuthInput
              label="Confirm password"
              type="password"
              name="confirm"
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"}
              {!loading && <IconArrowRight size={16} />}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="text-[13px] font-semibold text-ink-secondary dark:text-ink-secondary-dark"
            >
              Use a different account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}