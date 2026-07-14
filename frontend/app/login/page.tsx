"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconArrowRight, IconBrandGoogle } from "@tabler/icons-react";
import { AuthPanel } from "@/components/AuthPanel";
import { AuthInput } from "@/components/AuthInput";

export default function LoginPage() {
  const router = useRouter();
  
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/dashboard");
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
            <IconArrowLeft size={15} /> Back to home
          </Link>

          <h1 className="mb-2 text-[28px]">Welcome back</h1>
          <p className="mb-8 text-[14px] text-ink-secondary dark:text-ink-secondary-dark">
            Log in to pick up your streak where you left off.
          </p>

          <button type="button" className="btn-ghost mb-6 w-full justify-center">
            <IconBrandGoogle size={17} /> Continue with Google
          </button>

          <div className="mb-6 flex items-center gap-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
            <div className="h-px flex-1 bg-line dark:bg-line-dark" />
            or continue with email
            <div className="h-px flex-1 bg-line dark:bg-line-dark" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              <button type="button" className="font-semibold text-lavender-dark">
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn-primary w-full justify-center">
              Log in <IconArrowRight size={16} />
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
            New to Nocturne?{" "}
            <Link href="/signup" className="font-semibold text-lavender-dark">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
