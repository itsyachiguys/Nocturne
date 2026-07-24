"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const {
    user,
    profile,
    loading,
  } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Not logged in
    if (!user) {
      router.replace("/login");
      return;
    }

    // Profile still loading
    if (!profile) return;

    // First-time user
    if (
      !profile.onboardingCompleted &&
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding");
      return;
    }

    // Already onboarded
    if (
      profile.onboardingCompleted &&
      pathname === "/onboarding"
    ) {
      router.replace("/dashboard");
    }
  }, [
    loading,
    user,
    profile,
    pathname,
    router,
  ]);

  if (loading || (user && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading your workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}