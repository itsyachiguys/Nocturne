"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await AuthService.register(name, email, password);

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            setError("An account with this email already exists.");
            break;

          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;

          case "auth/weak-password":
            setError("Password should be at least 6 characters.");
            break;

          default:
            setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setError("");

    try {
      await AuthService.signInWithGoogle();
      router.push("/dashboard");
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
            className="mb-10 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-secondary hover:text-ink-primary dark:text-ink-secondary-dark dark:hover:text-ink-primary-dark"
          >
            <IconArrowLeft size={15} />
            Back to home
          </Link>

          <h1 className="mb-2 text-[28px]">Create your account</h1>

          <p className="mb-8 text-[14px] text-ink-secondary dark:text-ink-secondary-dark">
            Set up your workspace and start your first study streak today.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignup}
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AuthInput
              label="Full name"
              name="name"
              placeholder="Aria Sharma"
              autoComplete="name"
            />

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            <label className="flex items-start gap-2.5 text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-line accent-lavender-dark dark:border-line-dark"
              />
              I agree to the Terms of Service and Privacy Policy
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create account"}
              {!loading && <IconArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-lavender-dark">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}