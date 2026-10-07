"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// undefined = auth still loading, null = signed out, string = uid.
export function useUid() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(getAuth(), (u) => setUid(u?.uid ?? null)), []);
  return uid;
}