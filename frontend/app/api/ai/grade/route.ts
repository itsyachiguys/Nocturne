import { NextRequest, NextResponse } from "next/server";

import { AiError, gradeExamAnswers } from "@/lib/ai/gemini";
import type { ExamGradeItem } from "@/types/ai-study";

export const runtime = "nodejs";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------- Auth: verify the Firebase ID token ---------------- */

async function verifyUid(req: NextRequest): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) throw new AiError("Please sign in again.", 401);

  let res: Response | null = null;
  for (let i = 0; i < 3 && !res; i++) {
    try {
      res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(8_000),
      });
    } catch (e) {
      console.error(`grade: sign-in check network error (attempt ${i + 1}/3)`, (e as { cause?: unknown })?.cause ?? e);
      if (i < 2) await sleep(500 * (i + 1));
    }
  }
  if (!res) {
    throw new AiError(
      "Could not reach Google to verify your sign-in. Check your internet connection, VPN or firewall, then try again.",
      503
    );
  }
  if (!res.ok) throw new AiError("Please sign in again.", 401);

  const json = await res.json();
  const uid = json?.users?.[0]?.localId;
  if (typeof uid !== "string") throw new AiError("Please sign in again.", 401);
  return uid;
}

/* ---------------- Basic per-user rate limit (in memory) ---------------- */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;
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

/* ---------------- Validate the request body ---------------- */

const str = (v: unknown, max: number): string => {
  if (typeof v !== "string") throw new AiError("Invalid request.", 400);
  return v.slice(0, max);
};

function parseItems(body: unknown): ExamGradeItem[] {
  const raw = (body as { items?: unknown })?.items;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 12) throw new AiError("Invalid request.", 400);

  return raw.map((x) => {
    const o = x as Record<string, unknown>;
    const index = Number(o.index);
    const maxMarks = Number(o.maxMarks);
    if (!Number.isInteger(index) || index < 0 || !Number.isFinite(maxMarks) || maxMarks < 1 || maxMarks > 20) {
      throw new AiError("Invalid request.", 400);
    }
    const points = Array.isArray(o.markingPoints) ? o.markingPoints.slice(0, 10) : [];
    return {
      index,
      maxMarks: Math.round(maxMarks),
      question: str(o.question, 1000),
      modelAnswer: str(o.modelAnswer, 8000),
      markingPoints: points.map((p) => str(p, 400)),
      studentAnswer: str(o.studentAnswer, 6000),
    };
  });
}

/* ---------------- Handler ---------------- */

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyUid(req);
    const body = await req.json().catch(() => null);
    const items = parseItems(body);

    checkRate(uid);
    const grades = await gradeExamAnswers(items);
    return NextResponse.json({ grades });
  } catch (e) {
    if (e instanceof AiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("ai/grade", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}