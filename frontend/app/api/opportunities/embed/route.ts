import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Verifies the Firebase ID token with Google's REST endpoint, so no Admin SDK is needed.
async function isSignedIn(idToken: string): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return false;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  const key = process.env.EMBEDDINGS_API_KEY;
  if (!key) return NextResponse.json({ error: "Embeddings not configured" }, { status: 501 });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || !(await isSignedIn(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let texts: unknown;
  try {
    ({ texts } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > 50 || !texts.every((t) => typeof t === "string")) {
    return NextResponse.json({ error: "texts must be 1-50 strings" }, { status: 400 });
  }

  const url = process.env.EMBEDDINGS_API_URL ?? "https://api.openai.com/v1/embeddings";
  const model = process.env.EMBEDDINGS_MODEL ?? "text-embedding-3-small";
  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, input: (texts as string[]).map((t) => t.slice(0, 8000)) }),
  });
  if (!upstream.ok) return NextResponse.json({ error: "Embedding provider error" }, { status: 502 });

  const data = (await upstream.json()) as { data?: { embedding: number[]; index: number }[] };
  const vectors = (data.data ?? []).sort((a, b) => a.index - b.index).map((d) => d.embedding);
  if (vectors.length !== texts.length) return NextResponse.json({ error: "Bad provider response" }, { status: 502 });
  return NextResponse.json({ vectors });
}
