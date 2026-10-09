"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { computeLifeScore, type Breakdown } from "./calculator";
import { subscribeLifeScoreInputs, type LifeScoreInputs } from "./data";

export interface LifeScoreState {
  loading: boolean;
  signedOut: boolean;
  error: string | null;
  inputs: LifeScoreInputs | null;
  result: Breakdown | null;
}

/** Live Life Score for the signed-in student. Missing inputs are left out rather than counted as 0. */
export function useLifeScore(): LifeScoreState {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [inputs, setInputs] = useState<LifeScoreInputs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(getAuth(), (u) => setUid(u ? u.uid : null)), []);
  useEffect(() => {
    if (!uid) return;
    setError(null);
    return subscribeLifeScoreInputs(uid, setInputs, (e) => { console.error("life score", e); setError(e.message); });
  }, [uid]);

  const result = useMemo(() => (inputs ? computeLifeScore(inputs, { skipMissing: true }) : null), [inputs]);
  return { loading: uid === undefined || (uid !== null && !inputs && !error), signedOut: uid === null, error, inputs, result };
}
