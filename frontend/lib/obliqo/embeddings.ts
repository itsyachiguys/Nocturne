const DIM = 512;

const STOP = new Set(
  "a an the and or of to in for with on at by from as is are be this that we you our your will can have has it its their they them who what about into more such also not all any using use work working role team".split(" ")
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^\.+|\.+$/g, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => x / norm);
}

/** Offline fallback: hashed unigram + bigram vector. Lexical, not truly semantic. */
export function localEmbed(text: string): number[] {
  const v = new Array<number>(DIM).fill(0);
  const toks = tokenize(text);
  for (let i = 0; i < toks.length; i++) {
    v[hash(toks[i]) % DIM] += 1;
    if (i + 1 < toks.length) v[hash(toks[i] + " " + toks[i + 1]) % DIM] += 0.5;
  }
  return normalize(v);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export type EmbeddingSource = "api" | "local";

/** Map raw cosine similarity to 0-100. Ranges differ because the two embedders are distributed differently. */
export function semanticScore(cos: number, source: EmbeddingSource): number {
  const [lo, hi] = source === "api" ? [0.2, 0.75] : [0.02, 0.4];
  return Math.round(Math.max(0, Math.min(1, (cos - lo) / (hi - lo))) * 100);
}

export async function embedTexts(
  texts: string[],
  getToken?: () => Promise<string | null>
): Promise<{ vectors: number[][]; source: EmbeddingSource }> {
  try {
    const token = getToken ? await getToken() : null;
    if (token) {
      const res = await fetch("/api/opportunities/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texts }),
      });
      if (res.ok) {
        const data = (await res.json()) as { vectors?: number[][] };
        if (Array.isArray(data.vectors) && data.vectors.length === texts.length) {
          return { vectors: data.vectors, source: "api" };
        }
      }
    }
  } catch {
    // fall through to local embeddings
  }
  return { vectors: texts.map(localEmbed), source: "local" };
}
