import type { LearningResource } from "./types";

const DOCS: Record<string, string> = {
  react: "https://react.dev/learn",
  typescript: "https://www.typescriptlang.org/docs/",
  javascript: "https://javascript.info/",
  python: "https://docs.python.org/3/tutorial/",
  docker: "https://docs.docker.com/get-started/",
  kubernetes: "https://kubernetes.io/docs/tutorials/",
  sql: "https://sqlbolt.com/",
  git: "https://git-scm.com/book",
  "node.js": "https://nodejs.org/en/learn",
  "next.js": "https://nextjs.org/learn",
  postgresql: "https://www.postgresqltutorial.com/",
  firebase: "https://firebase.google.com/docs",
  graphql: "https://graphql.org/learn/",
  go: "https://go.dev/tour/",
  rust: "https://doc.rust-lang.org/book/",
  java: "https://dev.java/learn/",
  css: "https://web.dev/learn/css",
  html: "https://web.dev/learn/html",
  tailwind: "https://tailwindcss.com/docs",
  mongodb: "https://learn.mongodb.com/",
  aws: "https://aws.amazon.com/getting-started/",
};

// Rough hours to reach working (not expert) proficiency for someone already technical.
const HOURS: Record<string, number> = {
  html: 10, css: 15, git: 8, sql: 20, tailwind: 10, rest: 8, jest: 10, testing: 12,
  javascript: 40, typescript: 20, react: 30, "next.js": 25, "node.js": 25, vue: 30,
  angular: 40, python: 40, java: 60, go: 40, rust: 80, docker: 15, kubernetes: 40,
  aws: 40, azure: 40, gcp: 40, terraform: 25, "ci/cd": 15, graphql: 15, firebase: 15,
  postgresql: 20, mongodb: 15, "machine learning": 80, pytorch: 50, tensorflow: 50,
};

export function estimateHours(skill: string): number {
  return HOURS[skill] ?? 25;
}

export function formatHours(h: number): string {
  if (h < 40) return `~${h}h`;
  const weeks = Math.round(h / 10);
  return `~${h}h (about ${weeks} weeks at 10h/week)`;
}

export function getResources(skill: string): LearningResource[] {
  const out: LearningResource[] = [];
  const docs = DOCS[skill];
  if (docs) out.push({ label: `${skill} official/learning guide`, url: docs, kind: "docs" });
  const q = encodeURIComponent(`${skill} tutorial for beginners`);
  out.push({ label: `Search video tutorials`, url: `https://www.youtube.com/results?search_query=${q}`, kind: "search" });
  out.push({ label: `Search free courses`, url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skill)}`, kind: "search" });
  return out;
}
