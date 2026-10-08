const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  reactjs: "react",
  "react.js": "react",
  nextjs: "next.js",
  node: "node.js",
  nodejs: "node.js",
  postgres: "postgresql",
  k8s: "kubernetes",
  golang: "go",
  "amazon web services": "aws",
  mongo: "mongodb",
  tailwindcss: "tailwind",
  "machine learning": "machine learning",
  ml: "machine learning",
  vuejs: "vue",
  "vue.js": "vue",
  "ci/cd": "ci/cd",
  cicd: "ci/cd",
};

export function normalizeSkill(s: string): string {
  const k = s.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[k] ?? k;
}

export function uniqueSkills(list: string[]): string[] {
  return Array.from(new Set(list.map(normalizeSkill).filter(Boolean)));
}

export function parseList(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// "go", "r" and "c" are left out on purpose: they match ordinary words.
export const SKILL_VOCAB = [
  "javascript", "typescript", "react", "next.js", "node.js", "vue", "angular", "svelte",
  "html", "css", "tailwind", "python", "java", "kotlin", "swift", "c++", "c#", ".net",
  "rust", "golang", "php", "ruby", "sql", "postgresql", "mysql", "mongodb", "redis",
  "firebase", "graphql", "rest", "docker", "kubernetes", "aws", "azure", "gcp",
  "terraform", "ci/cd", "git", "linux", "django", "flask", "fastapi", "spring",
  "express", "pandas", "numpy", "pytorch", "tensorflow", "machine learning",
  "data analysis", "figma", "testing", "jest", "cypress", "agile", "kafka",
];

const SEARCH_TERMS: Array<[string, string]> = [
  ...SKILL_VOCAB.map((s): [string, string] => [s, normalizeSkill(s)]),
  ...Object.entries(ALIASES).map(([a, c]): [string, string] => [a, c]),
];

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function termRegex(term: string, flags = "i") {
  return new RegExp(`(?<![a-z0-9+#])${escapeRe(term)}(?![a-z0-9+#])`, flags);
}

export function extractSkills(text: string): string[] {
  const found = new Set<string>();
  for (const [term, canonical] of SEARCH_TERMS) {
    if (term.length < 2) continue;
    if (termRegex(term).test(text)) found.add(canonical);
  }
  return Array.from(found);
}

export function countMentions(text: string, skill: string): number {
  const canonical = normalizeSkill(skill);
  const terms = new Set<string>([canonical, skill.toLowerCase()]);
  for (const [alias, c] of Object.entries(ALIASES)) if (c === canonical) terms.add(alias);
  let n = 0;
  for (const t of terms) n += (text.match(termRegex(t, "gi")) ?? []).length;
  return n;
}
