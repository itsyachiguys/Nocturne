"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Minimal auth hook for the quiz pages.
 * If your app already has an auth context (e.g. useAuth), swap this out:
 * all you need is the signed-in user's uid.
 */
export function useUid() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setLoading(false);
    });
  }, []);

  return { uid, loading };
}