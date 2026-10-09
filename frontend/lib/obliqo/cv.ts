import { getAuth } from "firebase/auth";
import { cleanDetails, cleanList, type Details } from "./details";

export interface ParsedCv { details: Details; skills: string[] }

/** Sends the CV to /api/obliqo/cv-parse and returns cleaned, structured data. Nothing is saved here. */
export async function parseCv(file: File): Promise<ParsedCv> {
  const token = await getAuth().currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in again and retry.");
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/obliqo/cv-parse", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `CV import failed (${r.status})`);
  return { details: cleanDetails(j.details), skills: cleanList(j.details?.skills, 60, 60) };
}
