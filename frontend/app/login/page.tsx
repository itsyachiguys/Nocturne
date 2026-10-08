"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  IconArrowLeft,
  IconArrowRight,
  IconBrandGoogle,
} from "@tabler/icons-react";

import { FirebaseError } from "firebase/app";

import { AuthPanel } from "@/components/AuthPanel";
import { AuthInput } from "@/components/AuthInput";
import { AuthService } from "@/services/auth.service";
import { auth } from "@/lib/firebase";
import { ensureUserProfile, hasPassword } from "@/lib/authHelpers";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Runs after ANY successful sign-in (email or Google).
  // 1. Makes sure users/{uid} exists in Firestore
  // 2. Sends users without a password to /set-password, everyone else to /dashboard
  async function routeAfterLogin() {
    const user = auth.currentUser;

    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      await ensureUserProfile(user);
    } catch (e) {
      // Don't block login if the profile write fails; just log it.
      console.error("ensureUserProfile failed:", e);
    }

    router.replace(hasPassword(user) ? "/dashboard" : "/set-password");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;

    try {
      await AuthService.login(email, password);

      await routeAfterLogin();
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            setError(
              "Invalid email or password. If you signed up with Google, use “Continue with Google”."
            );
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/too-many-requests":
            setError(
              "Too many failed attempts. Please try again later."
            );
            break;

          default:
            setError(err.message);
        }
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      await AuthService.signInWithGoogle();

      await routeAfterLogin();
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Google sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthPanel />

      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-secondary dark:text-ink-secondary-dark hover:text-ink-primary dark:hover:text-ink-primary"
          >
            <IconArrowLeft size={15} />
            Back to home
          </Link>

          <h1 className="mb-2 text-[28px]">
            Welcome back
          </h1>

          <p className="mb-8 text-[14px] text-ink-secondary dark:text-ink-secondary-dark">
            Log in to pick up your streak where you left off.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-ghost mb-6 w-full justify-center disabled:opacity-50"
          >
            <IconBrandGoogle size={17} />
            Continue with Google
          </button>

          <div className="mb-6 flex items-center gap-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
            <div className="h-px flex-1 bg-line dark:bg-line-dark" />
            or continue with email
            <div className="h-px flex-1 bg-line dark:bg-line-dark" />
          </div>

          {error && (
            <div className="mb-4 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <AuthInput
              label="Email"
              type="email"
              name="email"
              placeholder="you@university.edu"
              autoComplete="email"
            />

            <AuthInput
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-ink-secondary dark:text-ink-secondary-dark">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-line accent-lavender-dark dark:border-line-dark"
                />
                Remember me
              </label>

              <button
                type="button"
                className="font-semibold text-lavender-dark"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}

              {!loading && <IconArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
            New to Nocturne?{" "}
            <Link
              href="/signup"
              className="font-semibold text-lavender-dark"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}