"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { IconArrowRight } from "@tabler/icons-react";
import { FirebaseError } from "firebase/app";

import { AuthInput } from "@/components/AuthInput";
import { AuthPanel } from "@/components/AuthPanel";

import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/user.service";

export default function OnboardingPage() {
  const router = useRouter();

  const {
    user,
    refreshProfile,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user) return;

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      await UserService.completeOnboarding(user.uid, {
        university: formData.get("university") as string,
        degree: formData.get("degree") as string,
        branch: formData.get("branch") as string,
        semester: Number(formData.get("semester")),
        graduationYear: Number(
          formData.get("graduationYear")
        ),
      });

      await refreshProfile();

      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError("Unable to save your profile.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthPanel />

      <div className="flex flex-1 items-center justify-center px-8 py-12 sm:px-16 lg:px-20">
        <div className="w-full max-w-md">

          <h1 className="mb-2 text-[30px]">
            Welcome to Nocturne 👋
          </h1>

          <p className="mb-8 text-[14px] text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
            Let's personalize your workspace before you begin.
          </p>

          {error && (
            <div className="mb-5 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <AuthInput
              label="University"
              name="university"
              placeholder="Indus University"
            />

            <AuthInput
              label="Degree"
              name="degree"
              placeholder="B.Tech"
            />

            <AuthInput
              label="Branch"
              name="branch"
              placeholder="Computer Engineering"
            />

            <div className="grid grid-cols-2 gap-4">
              <AuthInput
                label="Semester"
                name="semester"
                placeholder="7"
              />

              <AuthInput
                label="Graduation Year"
                name="graduationYear"
                placeholder="2027"
              />
            </div>

            <button
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading
                ? "Setting up..."
                : "Continue"}

              {!loading && (
                <IconArrowRight size={16} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}