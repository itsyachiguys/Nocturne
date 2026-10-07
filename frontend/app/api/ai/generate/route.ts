import { NextRequest, NextResponse } from "next/server";

import {
  AiError,
  MAX_FILE_BYTES,
  generateStudyOutput,
  type AiSourceInput,
} from "@/lib/ai/gemini";
import type { AiOutputType, AiSourceKind } from "@/types/ai-study";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds (Vercel); lower on plans that cap it

const TYPES: AiOutputType[] = ["summary", "flashcards", "quiz", "exam"];
const KINDS: AiSourceKind[] = ["pdf", "text"];

/* ---------------- Network helper: retry flaky connections ---------------- */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, init: RequestInit, what: string, tries = 3): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(8_000) });
    } catch (e) {
      last = e;
      console.error(`${what}: network error (attempt ${i + 1}/${tries})`, (e as { cause?: unknown })?.cause ?? e);
      if (i < tries - 1) await sleep(500 * (i + 1));
    }
  }
  console.error(`${what}: giving up`, last);
  throw new AiError(
    `Could not reach ${what}. Check your internet connection, VPN or firewall, then try again.`,
    503
  );
}

/* ---------------- Auth: verify the Firebase ID token ---------------- */

async function verifyUid(req: NextRequest): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) throw new AiError("Please sign in again.", 401);

  const res = await fetchWithRetry(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    },
    "Google to verify your sign-in"
  );
  if (!res.ok) throw new AiError("Please sign in again.", 401);

  const json = await res.json();
  const uid = json?.users?.[0]?.localId;
  if (typeof uid !== "string") throw new AiError("Please sign in again.", 401);
  return uid;
}

/* ---------------- Basic per-user rate limit (in memory) ----------------
   Best effort only: each serverless instance keeps its own counter.
   Move to Firestore or Redis before you rely on it for cost control. */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function checkRate(uid: string) {
  const now = Date.now();
  const recent = (hits.get(uid) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    throw new AiError("Hourly AI limit reached. Please try again later.", 429);
  }
  recent.push(now);
  hits.set(uid, recent);
}

/* ---------------- Fetch the file from Cloudinary ---------------- */

async function loadSource(fileUrl: string, kind: AiSourceKind): Promise<AiSourceInput> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  // Only our own Cloudinary account: stops the route being used to fetch arbitrary URLs.
  if (!cloud || !fileUrl.startsWith(`https://res.cloudinary.com/${cloud}/`)) {
    throw new AiError("Invalid file location.", 400);
  }

  const res = await fetchWithRetry(fileUrl, {}, "Cloudinary to download your file");
  if (!res.ok) {
    throw new AiError(
      res.status === 401 || res.status === 403
        ? "Cloudinary refused to serve this file. In Cloudinary settings, allow delivery of PDF files."
        : `Could not download the file (status ${res.status}).`,
      502
    );
  }

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_FILE_BYTES) throw new AiError("File is too large (max 14 MB).", 413);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_FILE_BYTES) throw new AiError("File is too large (max 14 MB).", 413);

  if (kind === "pdf") {
    if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new AiError("That file is not a valid PDF.", 422);
    }
    return { kind: "pdf", data: buf };
  }

  const text = buf.toString("utf8").trim();
  if (text.length < 50) throw new AiError("That file has too little text to work with.", 422);
  return { kind: "text", text };
}

/* ---------------- Handler ---------------- */

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyUid(req);

    const body = await req.json().catch(() => null);
    const type = body?.type as AiOutputType;
    const kind = body?.kind as AiSourceKind;
    const fileUrl = body?.fileUrl;

    if (!TYPES.includes(type) || !KINDS.includes(kind) || typeof fileUrl !== "string") {
      throw new AiError("Invalid request.", 400);
    }

    checkRate(uid);
    const source = await loadSource(fileUrl, kind);
    const data = await generateStudyOutput(type, source);

    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof AiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("ai/generate", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}