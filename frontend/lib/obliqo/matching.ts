/**
 * Obliqo v2 matching engine. Pure TypeScript, no React / Firebase, so it can be tested in Node.
 *
 * Data notes (from the 393-listing dataset):
 *  - Job `skills` are the most reliable field. Titles are often wrong (e.g. a "Flutter" title with
 *    data-science skills), so scoring uses the skills and flags title mismatches in `listingCheck`.
 *  - All listings are from Feb-Mar 2024. Age is shown as a warning but does NOT change the decision
 *    (AGE_AFFECTS_DECISION). Turn it on once you have a fresh dataset.
 */

import type { Course } from "./courses";

export const AGE_AFFECTS_DECISION = false;

export type Level = 1 | 2 | 3; // Beginner / Intermediate / Advanced
export const LEVEL_NAMES: Record<Level, string> = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
const LEVEL_WEIGHT: Record<Level, number> = { 1: 0.55, 2: 0.8, 3: 1 };
const RELATED_CREDIT = 0.4; // credit for a related skill (e.g. Django for "Python")

export interface RawJob {
  id: string;
  title: string;
  company: string;
  role: string;
  remote: boolean;
  location: string;
  partTime: boolean;
  skills: string[];
  description: string;
  url: string;
  stipendText: string;
  stipendMin: number | null;
  stipendMax: number | null;
  stipendPeriod: string;
  incentives: boolean;
}
export interface SkillMeta { name: string; count: number; kind: string }
export interface Dataset {
  aliases: Record<string, string[]>;
  skills: SkillMeta[];
  jobs: RawJob[];
}
export interface UserSkill { name: string; level: Level }
/** User changes on top of the suggested plan. `steps` is only set once the user edits a step. */
export interface Schedule { weeks: number; hoursPerDay: number; daysPerWeek: number }
export const DEFAULT_SCHEDULE: Schedule = { weeks: 4, hoursPerDay: 2, daysPerWeek: 5 };
export interface PlanOverride { steps?: PlanStep[]; courses: Course[]; schedule?: Schedule; goal?: Level }
export interface Profile {
  targetRole: string | null;
  skills: UserSkill[];
  planSkills: string[];
  planDone: Record<string, boolean>; // key `${skill}|${stepId}`; suggested steps use ids "0","1",... so old saves still match
  planEdits: Record<string, PlanOverride>; // by skill
}
export const EMPTY_PROFILE: Profile = { targetRole: null, skills: [], planSkills: [], planDone: {}, planEdits: {} };

export const ROLES = [
  "Web", "Frontend", "Backend", "Full Stack", "Mobile", "Software",
  "Data & AI", "Cloud & DevOps", "Security", "Design", "Business & Other",
] as const;

/* ------------------------------------------------------------------ */
/* Skill normalisation                                                 */
/* ------------------------------------------------------------------ */

export interface Index {
  data: Dataset;
  canon: Map<string, string[]>; // lowercase text -> canonical skills
  kind: Map<string, string>;
  jobs: Job[];
}
export interface Job extends RawJob {
  skillsN: string[];        // canonical, deduped
  postedAt: number | null;  // ms
  titleRole: string | null;
  contentRole: string | null;
  titleMismatch: string | null; // explanation, or null when fine
  stipendMonthly: number | null; // best-effort monthly figure (max), null if unknown/lump
}

export function buildIndex(data: Dataset): Index {
  const canon = new Map<string, string[]>();
  const kind = new Map<string, string>();
  for (const s of data.skills) {
    canon.set(s.name.toLowerCase(), [s.name]);
    kind.set(s.name, s.kind);
  }
  for (const [k, v] of Object.entries(data.aliases)) canon.set(k.toLowerCase(), v);
  const idx: Index = { data, canon, kind, jobs: [] };
  idx.jobs = data.jobs.map((j) => prepareJob(idx, j));
  return idx;
}

export function normalizeSkill(idx: Index, text: string): string[] {
  const t = text.trim().toLowerCase();
  if (!t) return [];
  return idx.canon.get(t) ?? [text.trim()];
}

function prepareJob(idx: Index, j: RawJob): Job {
  const skillsN = Array.from(new Set(j.skills.flatMap((s) => normalizeSkill(idx, s))));
  const m = j.url.match(/(\d{10})$/);
  const postedAt = m ? Number(m[1]) * 1000 : null;
  const titleRole = roleFromTitle(j.title) ?? null;
  const contentRole = roleFromSkills(skillsN, idx) ?? titleRole ?? j.role;
  const fam = titleFamily(j.title);
  let titleMismatch: string | null = null;
  if (fam && !skillsN.some((s) => fam.skills.has(s))) {
    titleMismatch = `The title says ${fam.label}, but none of the listed skills are ${fam.label}-related (${skillsN.slice(0, 3).join(", ") || "none listed"}).`;
  }
  let stipendMonthly: number | null = null;
  if (j.stipendPeriod === "month" && j.stipendMax != null) stipendMonthly = j.stipendMax;
  if (j.stipendPeriod === "unpaid") stipendMonthly = 0;
  return { ...j, skillsN, postedAt, titleRole, contentRole, titleMismatch, stipendMonthly };
}

/* ------------------------------------------------------------------ */
/* Related skills (partial credit)                                     */
/* ------------------------------------------------------------------ */

// job skill -> user skills that give partial credit for it
const RELATED: Record<string, string[]> = {
  HTML: ["React", "Angular", "Next.js", "Vue", "WordPress", "Bootstrap", "Webflow"],
  CSS: ["Bootstrap", "Tailwind CSS", "SCSS", "React", "Webflow"],
  JavaScript: ["React", "Node.js", "Angular", "TypeScript", "jQuery", "Next.js", "Vue", "Express.js", "React Native"],
  TypeScript: ["JavaScript"],
  jQuery: ["JavaScript"],
  AJAX: ["JavaScript", "jQuery"],
  React: ["Next.js", "React Native", "Redux"],
  Redux: ["React"],
  "Next.js": ["React"],
  "React Native": ["React", "Flutter"],
  Flutter: ["Dart", "React Native"],
  Dart: ["Flutter"],
  "Node.js": ["Express.js", "JavaScript", "MERN Stack"],
  "Express.js": ["Node.js", "MERN Stack"],
  MongoDB: ["NoSQL", "MERN Stack"],
  NoSQL: ["MongoDB"],
  MySQL: ["SQL", "PostgreSQL", "MS SQL Server"],
  SQL: ["MySQL", "PostgreSQL", "MS SQL Server"],
  PostgreSQL: ["SQL", "MySQL"],
  "MS SQL Server": ["SQL", "MySQL"],
  "REST API": ["Node.js", "Express.js", "Django", "Flask", "FastAPI", "Laravel", "Spring", "Postman"],
  Python: ["Django", "Flask", "FastAPI", "Machine Learning", "Data Science"],
  Django: ["Flask", "Python"],
  Flask: ["Django", "FastAPI"],
  FastAPI: ["Flask", "Django"],
  PHP: ["Laravel", "CodeIgniter", "WordPress"],
  Laravel: ["CodeIgniter", "PHP"],
  CodeIgniter: ["Laravel", "PHP"],
  Yii: ["Laravel", "CodeIgniter", "PHP"],
  WordPress: ["PHP", "Webflow"],
  Webflow: ["WordPress"],
  Java: ["Spring", "Hibernate", "J2EE", "JSP", "Kotlin"],
  Spring: ["Java", "Hibernate"],
  Hibernate: ["Java", "Spring"],
  Kotlin: ["Java", "Android"],
  Android: ["Flutter", "Kotlin", "Java", "React Native"],
  iOS: ["Flutter", "React Native"],
  Firebase: ["Cloud Firestore"],
  "Cloud Firestore": ["Firebase"],
  "Machine Learning": ["Deep Learning", "Data Science", "Neural Networks", "NLP"],
  "Deep Learning": ["Machine Learning", "Neural Networks", "Computer Vision", "NLP"],
  "Neural Networks": ["Deep Learning", "Machine Learning"],
  NLP: ["Machine Learning", "Deep Learning"],
  "Computer Vision": ["Deep Learning", "Image Processing", "OpenCV"],
  "Data Science": ["Machine Learning", "Data Analytics", "Statistics", "Python"],
  "Data Analytics": ["Data Science", "Power BI", "Tableau", "MS Excel", "Advanced Excel", "SQL"],
  "MS Excel": ["Advanced Excel"],
  "Advanced Excel": ["MS Excel"],
  "Power BI": ["Tableau", "Data Analytics"],
  Tableau: ["Power BI", "Data Analytics"],
  Statistics: ["Data Science", "R Programming", "Statistical Modeling"],
  "R Programming": ["Python", "Statistics"],
  Bootstrap: ["Tailwind CSS", "CSS"],
  "Tailwind CSS": ["Bootstrap", "CSS"],
  Git: ["GitHub"],
  GitHub: ["Git"],
  "UI/UX Design": ["Figma", "Wireframing", "Prototyping", "Adobe XD"],
  Figma: ["Adobe XD", "UI/UX Design"],
  Docker: ["Kubernetes", "DevOps"],
  Kubernetes: ["Docker", "DevOps"],
  AWS: ["Azure", "Google Cloud", "Cloud Computing"],
  Azure: ["AWS", "Google Cloud", "Cloud Computing"],
  "Google Cloud": ["AWS", "Azure", "Cloud Computing"],
  Blockchain: ["Ethereum", "Hyperledger"],
  "C++": ["C", "Java"],
  C: ["C++"],
  SEO: ["Digital Marketing", "Content Marketing"],
  "Digital Marketing": ["SEO", "Social Media Marketing", "Email Marketing"],
  "Business Analysis": ["Business Research", "Data Analytics"],
  Angular: ["TypeScript"],
};

const KIND_WEIGHT: Record<string, number> = { technical: 1, soft: 0.35, language: 0.25 };
const NEED_CAP = 7; // long wish-lists only need ~7 skills' worth of match

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */

const ROLE_ADJ: [string, string, number][] = [
  ["Full Stack", "Frontend", 0.7], ["Full Stack", "Backend", 0.7], ["Full Stack", "Web", 0.7], ["Full Stack", "Software", 0.6],
  ["Web", "Frontend", 0.7], ["Web", "Backend", 0.5], ["Frontend", "Mobile", 0.4], ["Frontend", "Design", 0.4],
  ["Backend", "Software", 0.7], ["Backend", "Cloud & DevOps", 0.5], ["Software", "Mobile", 0.5],
  ["Data & AI", "Software", 0.4], ["Data & AI", "Backend", 0.4], ["Data & AI", "Business & Other", 0.5],
  ["Cloud & DevOps", "Security", 0.4], ["Cloud & DevOps", "Software", 0.5], ["Security", "Backend", 0.3], ["Design", "Web", 0.4],
];
const ADJ = new Map<string, number>();
for (const [a, b, v] of ROLE_ADJ) { ADJ.set(`${a}|${b}`, v); ADJ.set(`${b}|${a}`, v); }

export function roleFit(target: string | null, role: string | null): number {
  if (!target || !role) return 0.7;
  if (target === role) return 1;
  return ADJ.get(`${target}|${role}`) ?? 0.15;
}

function roleFromTitle(title: string): string | null {
  const t = title.toLowerCase();
  const rules: [RegExp, string][] = [
    [/full[ -]?stack|mern|mean stack/, "Full Stack"],
    [/flutter|react native|android|ios|mobile|app (developer|development)/, "Mobile"],
    [/front[ -]?end|react|angular|next\.?js|vue|tailwind|three\.js/, "Frontend"],
    [/devops|cloud|azure|kubernetes|aks/, "Cloud & DevOps"],
    [/ethical hacking|security/, "Security"],
    [/ui\/ux|ux design|ui design|designer|design \(wix\)/, "Design"],
    [/machine learning|artificial intelligence|\bai\b|data science|data analy|analytics|deep learning|computer vision|neural|big data|data engineer|\bml\b|llm|language model/, "Data & AI"],
    [/node|php|laravel|django|flask|java\b|backend|back end|python|asp\.net|mvc/, "Backend"],
    [/wordpress|web|website|shopify|wix/, "Web"],
    [/blockchain|software|rust|algorithm|robotic|engineer/, "Software"],
  ];
  for (const [rx, r] of rules) if (rx.test(t)) return r;
  return null;
}

const ROLE_SKILLS: Record<string, string[]> = {
  Mobile: ["Flutter", "Dart", "React Native", "Android", "iOS", "Kotlin", "Firebase Cloud Messaging"],
  Frontend: ["React", "Angular", "Next.js", "Vue", "Redux", "Tailwind CSS", "Bootstrap", "SCSS", "HTML", "CSS", "JavaScript", "jQuery", "TypeScript"],
  Backend: ["Node.js", "Express.js", "PHP", "Laravel", "CodeIgniter", "Yii", "Django", "Flask", "FastAPI", "Java", "Spring", "Hibernate", "J2EE", "JSP", "MySQL", "PostgreSQL", "MongoDB", "REST API", ".NET", "ASP.NET", "C#", "MS SQL Server"],
  Web: ["WordPress", "Webflow", "SEO", "Drupal", "CMS", "Responsive Design"],
  "Data & AI": ["Machine Learning", "Data Science", "NLP", "Deep Learning", "Neural Networks", "Computer Vision", "Data Analytics", "Power BI", "Tableau", "Statistics", "R Programming", "Statistical Modeling", "Artificial Intelligence", "Hadoop", "Image Processing", "OpenCV"],
  "Cloud & DevOps": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "DevOps", "CI/CD", "Jenkins", "Linux"],
  Design: ["Figma", "UI/UX Design", "Adobe XD", "Wireframing", "Prototyping", "Canva"],
  Security: ["Ethical Hacking", "Web Application Security"],
  Software: ["Blockchain", "Ethereum", "Hyperledger", "Rust", "C++", "C", "Go", "Robotics", "Arduino", "Embedded Systems", "Unity", "Algorithms", "Data Structures"],
  "Business & Other": ["Business Analysis", "Business Research", "MS Excel", "Advanced Excel", "Digital Marketing", "Content Writing", "Email Marketing", "Project Management", "Product Management", "Accounting", "Tally", "Social Media Marketing", "Content Marketing"],
};
const SKILL_ROLE = new Map<string, string>();
for (const [r, ss] of Object.entries(ROLE_SKILLS)) for (const s of ss) SKILL_ROLE.set(s, r);

function roleFromSkills(skills: string[], idx: Index): string | null {
  const votes = new Map<string, number>();
  let total = 0;
  for (const s of skills) {
    if ((idx.kind.get(s) ?? "technical") !== "technical") continue;
    const r = SKILL_ROLE.get(s);
    if (!r) continue;
    votes.set(r, (votes.get(r) ?? 0) + 1);
    total += 1;
  }
  if (!total) return null;
  let best: string | null = null, bv = 0;
  for (const [r, v] of votes) if (v > bv) { best = r; bv = v; }
  // Web-ish stacks that mix HTML/CSS/JS with PHP/WordPress/Node: call it Web
  const fe = votes.get("Frontend") ?? 0, be = votes.get("Backend") ?? 0, wb = votes.get("Web") ?? 0;
  if ((fe + be + wb) / total >= 0.8) {
    if (wb > 0 && fe > 0) return "Web"; // HTML/CSS/JS + WordPress/Webflow/SEO
    if (fe >= 2 && be >= 2) return "Full Stack";
  }
  return bv / total >= 0.5 ? best : "Software";
}

/* ------------------------------------------------------------------ */
/* Title / skills consistency                                          */
/* ------------------------------------------------------------------ */

interface Family { key: string; label: string; skills: Set<string> }
const FAMILIES: [RegExp, string, string[]][] = [
  [/flutter/i, "Flutter", ["Flutter", "Dart"]],
  [/react native/i, "React Native", ["React Native"]],
  [/next\.?js/i, "Next.js", ["Next.js"]],
  [/angular/i, "Angular", ["Angular"]],
  [/react/i, "React", ["React", "React Native", "Next.js", "Redux"]],
  [/wordpress|woocommerce/i, "WordPress", ["WordPress"]],
  [/node/i, "Node.js", ["Node.js", "Express.js"]],
  [/laravel|php/i, "PHP", ["PHP", "Laravel", "CodeIgniter", "Yii"]],
  [/django|flask/i, "Python web", ["Django", "Flask", "FastAPI", "Python"]],
  [/java development|java developer|java$|\bjava\b(?! ?script)/i, "Java", ["Java", "Spring", "Hibernate", "J2EE", "JSP"]],
  [/python/i, "Python", ["Python", "Django", "Flask", "FastAPI"]],
  [/blockchain/i, "Blockchain", ["Blockchain", "Ethereum", "Hyperledger", "Rust", "Web3.js"]],
  [/machine learning|artificial intelligence|\bai\b|deep learning|data science|computer vision|neural|\bnlp\b|generative/i, "AI / data science", ["Machine Learning", "Deep Learning", "Data Science", "NLP", "Artificial Intelligence", "Computer Vision", "Neural Networks", "Python", "Data Analytics", "Statistics", "Image Processing"]],
  [/data analy|business analy|analytics|dashboard|power bi|tableau/i, "data analytics", ["Data Analytics", "Power BI", "Tableau", "MS Excel", "Advanced Excel", "SQL", "Business Analysis", "Python", "Google Analytics", "Data Science", "Research and Analytics"]],
  [/devops|kubernetes/i, "DevOps", ["DevOps", "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Jenkins", "Linux", "Google Cloud"]],
  [/ethical hacking|security/i, "security", ["Ethical Hacking", "Web Application Security"]],
  [/webflow/i, "Webflow", ["Webflow"]],
  [/full[ -]?stack|mern|web dev|website|front[ -]?end|frontend/i, "web development", ["HTML", "CSS", "JavaScript", "React", "Angular", "Node.js", "PHP", "WordPress", "Bootstrap", "jQuery", "Next.js", "Webflow", "Vue", "Express.js", "MongoDB", "MySQL", "Python", "Django", "Flask", "Java", "Spring", ".NET", "ASP.NET", "Laravel", "Tailwind CSS", "TypeScript", "Redux", "MERN Stack", "UI/UX Design", "Figma", "Flutter", "React Native"]],
];
function titleFamily(title: string): Family | null {
  for (const [rx, label, skills] of FAMILIES) if (rx.test(title)) return { key: label, label, skills: new Set(skills) };
  return null;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export type Decision = "Apply" | "Wait" | "Skip" | "Avoid";

export interface SkillMatch {
  name: string;
  state: "have" | "related" | "missing";
  level?: Level;       // user's level (have) or the level of the related skill
  via?: string;        // related skill that gave partial credit
  credit: number;      // 0..1
  weight: number;
}
export interface CheckItem { id: string; level: "ok" | "info" | "warn" | "bad"; text: string }
export interface Scored {
  job: Job;
  score: number; // 0-100
  decision: Decision;
  skillScore: number; // 0-100
  roleScore: number | null; // 0-100 or null when no target role
  matches: SkillMatch[];
  have: SkillMatch[];
  related: SkillMatch[];
  missing: SkillMatch[];
  checks: CheckItem[];
  hardRisk: boolean;
  summary: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtPosted(ts: number | null): string {
  if (ts == null) return "date unknown";
  const d = new Date(ts);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function ageDays(ts: number | null, now = Date.now()): number | null {
  return ts == null ? null : Math.floor((now - ts) / 86400000);
}

const EXP_RX = /(\d)\s*(?:-|to|–)?\s*(\d)?\s*\+?\s*years?\W{0,3}\s*(?:of\s+)?(?:hands-on\s+)?(?:commercial\s+)?experience/i;

export function scoreJob(idx: Index, profile: Profile, job: Job, now = Date.now()): Scored {
  const userMap = new Map(profile.skills.map((s) => [s.name, s.level]));
  const matches: SkillMatch[] = [];
  let earned = 0, totalW = 0;
  for (const s of job.skillsN) {
    const w = KIND_WEIGHT[idx.kind.get(s) ?? "technical"] ?? 1;
    totalW += w;
    const lvl = userMap.get(s);
    if (lvl) {
      const credit = LEVEL_WEIGHT[lvl];
      earned += credit * w;
      matches.push({ name: s, state: "have", level: lvl, credit, weight: w });
      continue;
    }
    let best: { name: string; level: Level } | null = null;
    for (const r of RELATED[s] ?? []) {
      const l = userMap.get(r);
      if (l && (!best || l > best.level)) best = { name: r, level: l };
    }
    if (best) {
      const credit = RELATED_CREDIT * LEVEL_WEIGHT[best.level];
      earned += credit * w;
      matches.push({ name: s, state: "related", level: best.level, via: best.name, credit, weight: w });
    } else {
      matches.push({ name: s, state: "missing", credit: 0, weight: w });
    }
  }
  const need = Math.min(totalW, NEED_CAP) || 1;
  let skillFrac = Math.min(1, earned / need);
  const n = job.skillsN.length;
  const thin = n <= 1;
  skillFrac *= 0.75 + 0.25 * Math.min(1, n / 4); // thin listings are less certain

  const hasTarget = !!profile.targetRole;
  const rFit = hasTarget ? roleFit(profile.targetRole, job.contentRole) : null;
  let total = hasTarget ? 0.7 * skillFrac + 0.3 * (rFit as number) : skillFrac;

  /* listing check */
  const checks: CheckItem[] = [];
  let hardRisk = false; // soft: caps Apply at Wait
  let unpaid = false;   // hard: can lead to Avoid
  if (job.titleMismatch) {
    checks.push({ id: "title", level: "bad", text: job.titleMismatch + " The listing may be mislabeled; read the description before applying." });
    total *= 0.88;
    hardRisk = true;
  } else {
    checks.push({ id: "title", level: "ok", text: "The title and the listed skills are consistent." });
  }
  if (hasTarget) {
    if ((rFit as number) >= 0.99) checks.push({ id: "role", level: "ok", text: `Role matches your target (${profile.targetRole}).` });
    else if ((rFit as number) >= 0.5) checks.push({ id: "role", level: "info", text: `Close to your target. This reads as ${job.contentRole}; you target ${profile.targetRole}.` });
    else checks.push({ id: "role", level: "warn", text: `Different direction. This reads as ${job.contentRole}; you target ${profile.targetRole}.` });
  }
  if (job.titleRole && job.contentRole && !job.titleMismatch && roleFit(job.titleRole, job.contentRole) < 0.5) {
    checks.push({ id: "roleTitle", level: "warn", text: `The title reads as ${job.titleRole}, but the skills point to ${job.contentRole}.` });
  }
  if (thin) checks.push({ id: "thin", level: "warn", text: `Only ${n} skill${n === 1 ? "" : "s"} listed, so the match is less certain.` });
  if (job.description.length < 150) checks.push({ id: "short", level: "warn", text: "Very short description." });
  if (EXP_RX.test(job.description)) checks.push({ id: "exp", level: "warn", text: "The description asks for prior years of experience, unusual for an internship." });
  if (/relocate/i.test(job.description)) checks.push({ id: "reloc", level: "info", text: "Mentions relocation." });
  if (job.stipendPeriod === "unpaid" || /unpaid/i.test(job.description)) {
    checks.push({ id: "pay", level: "bad", text: "Unpaid." });
    hardRisk = true;
    unpaid = true;
  } else if (job.stipendMonthly != null && job.stipendMonthly <= 1000) {
    checks.push({ id: "pay", level: "warn", text: `Very low stipend (up to ₹${job.stipendMonthly.toLocaleString("en-IN")}/month).` });
  } else if (job.stipendPeriod === "lump") {
    checks.push({ id: "pay", level: "info", text: "Stipend is a lump sum, not monthly." });
  } else if (job.stipendMax == null) {
    checks.push({ id: "pay", level: "info", text: "Stipend not clearly stated." });
  }
  if (job.incentives) checks.push({ id: "inc", level: "info", text: "Part of the pay is incentive-based." });
  const age = ageDays(job.postedAt, now);
  if (age != null && age > 90) {
    checks.push({ id: "age", level: "warn", text: `Posted ${fmtPosted(job.postedAt)} (about ${Math.round(age / 30)} months ago). Check that it is still open.` });
    if (AGE_AFFECTS_DECISION) { total *= 0.5; hardRisk = true; }
  }

  const score = Math.round(Math.max(0, Math.min(1, total)) * 100);
  const have = matches.filter((m) => m.state === "have");
  const related = matches.filter((m) => m.state === "related");
  const missing = matches.filter((m) => m.state === "missing");
  const missingTech = missing.filter((m) => m.weight >= 1).length;

  let decision: Decision;
  if (score >= 70) decision = "Apply";
  else if (score >= 45 && missingTech <= 4) decision = "Wait";
  else decision = "Skip";
  if (hardRisk && decision === "Apply") decision = "Wait";
  if (unpaid || (job.titleMismatch && job.stipendMonthly != null && job.stipendMonthly <= 1000)) {
    if (score < 60) decision = "Avoid";
  }

  const summary =
    n === 0 ? "This listing doesn't list any skills."
    : have.length === n ? `You have all ${n} listed skills.`
    : `You match ${have.length} of the ${n} skills it lists` +
      (related.length ? `, and ${related.length} more partially through related skills.` : ".");

  return {
    job, score, decision,
    skillScore: Math.round(skillFrac * 100),
    roleScore: rFit == null ? null : Math.round(rFit * 100),
    matches, have, related, missing, checks, hardRisk, summary,
  };
}

export function scoreAll(idx: Index, profile: Profile, now = Date.now()): Scored[] {
  return idx.jobs.map((j) => scoreJob(idx, profile, j, now));
}

/* ------------------------------------------------------------------ */
/* Skill gaps across all listings                                      */
/* ------------------------------------------------------------------ */

export interface Gap { skill: string; listings: number; unlocks: number }
/** Skills you lack. `unlocks` = listings (at your role or close) where this is one of at most 2 missing skills. */
export function skillGaps(idx: Index, profile: Profile, scored: Scored[], limit = 12): Gap[] {
  const freq = new Map<string, number>();
  const unlock = new Map<string, number>();
  for (const s of scored) {
    if (profile.targetRole && roleFit(profile.targetRole, s.job.contentRole) < 0.5) continue;
    const miss = s.missing.filter((m) => m.weight >= 1);
    for (const m of miss) {
      freq.set(m.name, (freq.get(m.name) ?? 0) + 1);
      if (miss.length <= 2 && !s.job.titleMismatch) unlock.set(m.name, (unlock.get(m.name) ?? 0) + 1);
    }
  }
  return Array.from(freq, ([skill, listings]) => ({ skill, listings, unlocks: unlock.get(skill) ?? 0 }))
    .sort((a, b) => b.unlocks - a.unlocks || b.listings - a.listings)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Learning plans                                                      */
/* ------------------------------------------------------------------ */

export interface PlanStep {
  id: string; week: number; title: string; detail: string; hours?: number;
  points?: string[]; resource?: { label: string; url: string }; phase?: string; // phase: Beginner | Intermediate | Advanced
}
export interface Plan { skill: string; weeks: number; steps: PlanStep[]; resources: { label: string; url: string }[]; shortenedBy?: string; courses: Course[]; edited: boolean; schedule?: Schedule; goal?: Level }

const RES: Record<string, { label: string; url: string }[]> = {
  HTML: [{ label: "MDN: Learn web development", url: "https://developer.mozilla.org/en-US/docs/Learn" }],
  CSS: [{ label: "MDN: Learn CSS", url: "https://developer.mozilla.org/en-US/docs/Learn/CSS" }],
  JavaScript: [{ label: "MDN: JavaScript guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" }],
  React: [{ label: "React: Learn", url: "https://react.dev/learn" }],
  "Next.js": [{ label: "Next.js: Learn", url: "https://nextjs.org/learn" }],
  Angular: [{ label: "Angular tutorials", url: "https://angular.dev/tutorials" }],
  TypeScript: [{ label: "TypeScript docs", url: "https://www.typescriptlang.org/docs/" }],
  "Node.js": [{ label: "Node.js: Learn", url: "https://nodejs.org/en/learn" }],
  Python: [{ label: "Python tutorial", url: "https://docs.python.org/3/tutorial/" }],
  Django: [{ label: "Django: Getting started", url: "https://docs.djangoproject.com/en/stable/intro/" }],
  Flutter: [{ label: "Flutter: Learn", url: "https://docs.flutter.dev/get-started/codelab" }],
  Firebase: [{ label: "Firebase docs", url: "https://firebase.google.com/docs" }],
  PHP: [{ label: "PHP manual", url: "https://www.php.net/manual/en/" }],
  Bootstrap: [{ label: "Bootstrap docs", url: "https://getbootstrap.com/docs/" }],
  "Tailwind CSS": [{ label: "Tailwind CSS docs", url: "https://tailwindcss.com/docs" }],
  Git: [{ label: "Git documentation", url: "https://git-scm.com/doc" }],
  Docker: [{ label: "Docker: Get started", url: "https://docs.docker.com/get-started/" }],
  Kubernetes: [{ label: "Kubernetes tutorials", url: "https://kubernetes.io/docs/tutorials/" }],
  "Power BI": [{ label: "Microsoft Learn: Power BI", url: "https://learn.microsoft.com/en-us/power-bi/" }],
};

const PLAN_STEPS: Record<string, [string, string][]> = {
  JavaScript: [["Core syntax", "Variables, functions, arrays, objects, loops."], ["The DOM and events", "Select elements, respond to clicks and input."], ["Async JS", "Promises, async/await, fetch an API."], ["Mini project", "A small app (to-do or weather) that calls a public API."]],
  React: [["Components and props", "Build small reusable components."], ["State and effects", "useState, useEffect, controlled forms."], ["Data fetching and routing", "Call an API, render lists, add routes."], ["Project", "Ship a small app and put it on GitHub."]],
  Python: [["Syntax and data types", "Lists, dicts, functions, files."], ["Modules and packages", "pip, virtual environments, standard library."], ["Practice problems", "20 small exercises."], ["Project", "A script or small API that does something useful."]],
  SQL: [["SELECT basics", "Filtering, sorting, aggregates."], ["Joins", "INNER, LEFT, subqueries."], ["Design", "Tables, keys, normalisation."], ["Project", "Model and query a small database."]],
  "Node.js": [["Runtime basics", "Modules, npm, file system."], ["Express", "Routes, middleware, JSON APIs."], ["Database", "Connect MongoDB or MySQL, CRUD."], ["Project", "A REST API with auth."]],
};
const GENERIC_STEPS = (skill: string): [string, string][] => [
  [`${skill} fundamentals`, `Work through the official getting-started guide for ${skill}.`],
  ["Follow a guided tutorial", `Build along with one tutorial and note what each part does.`],
  ["Build a mini project", `Make something small with ${skill} without a tutorial.`],
  ["Polish and show it", "Write a short README, push to GitHub, add it to your resume."],
];
const BASE_WEEKS: Record<string, number> = { HTML: 2, CSS: 3, JavaScript: 5, React: 5, "Node.js": 4, Python: 5, SQL: 3, Git: 1, MySQL: 3, MongoDB: 3, Flutter: 6, Django: 5, Angular: 6, PHP: 5, "Next.js": 3, TypeScript: 3, Bootstrap: 1, "Tailwind CSS": 1 };

export function buildPlan(skill: string, profile: Profile): Plan {
  const steps = PLAN_STEPS[skill] ?? GENERIC_STEPS(skill);
  let weeks = BASE_WEEKS[skill] ?? 4;
  let shortenedBy: string | undefined;
  const rel = (RELATED[skill] ?? []).find((r) => profile.skills.some((s) => s.name === r && s.level >= 2));
  if (rel) { weeks = Math.max(2, weeks - 1); shortenedBy = rel; }
  const perStep = Math.max(1, Math.round(weeks / steps.length));
  const out: PlanStep[] = steps.map(([title, detail], i) => ({ id: String(i), week: Math.min(weeks, 1 + i * perStep), title, detail }));
  return { skill, weeks, steps: out, resources: RES[skill] ?? [], shortenedBy, courses: [], edited: false };
}

/** The plan the user actually sees: the suggested plan with their edits and pinned courses applied. */
export function resolvePlan(skill: string, profile: Profile): Plan {
  const base = buildPlan(skill, profile);
  const o = profile.planEdits[skill];
  if (!o) return base;
  const steps = o.steps ?? base.steps;
  const weeks = o.steps ? Math.max(1, ...steps.map((s) => s.week)) : base.weeks;
  return { ...base, steps, weeks, courses: o.courses ?? [], edited: !!o.steps, shortenedBy: o.steps ? undefined : base.shortenedBy, schedule: o.schedule, goal: o.goal };
}

/* ---- Time-fit: spread a plan over the weeks and daily hours the user actually has ---- */

const HOURS_PER_BASE_WEEK = 8; // the suggested plans assume a relaxed ~8 h/week
/** Hours the suggested plan normally takes (already shortened if you know a related skill). */
export function baseHoursFor(skill: string, profile: Profile): number {
  return buildPlan(skill, profile).weeks * HOURS_PER_BASE_WEEK;
}

export interface Fit { steps: PlanStep[]; available: number; needed: number; hoursPerWeek: number; minWeeks: number; verdict: "tight" | "ok" | "roomy" }

export function clampSchedule(s: Schedule): Schedule {
  const n = (v: number, lo: number, hi: number, d: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  return {
    weeks: Math.round(n(s.weeks, 1, 52, DEFAULT_SCHEDULE.weeks)),
    hoursPerDay: Math.round(n(s.hoursPerDay, 0.5, 12, DEFAULT_SCHEDULE.hoursPerDay) * 2) / 2,
    daysPerWeek: Math.round(n(s.daysPerWeek, 1, 7, DEFAULT_SCHEDULE.daysPerWeek)),
  };
}

/**
 * Give every step an hour budget out of the time the user has, then place steps on weeks in order.
 * Steps keep their order and text. Weights come from existing hours (so edits are respected), else
 * equal, with a heavier final step (usually the project).
 */
export function fitPlan(steps: PlanStep[], neededHours: number, raw: Schedule): Fit {
  const sch = clampSchedule(raw);
  const hoursPerWeek = sch.daysPerWeek * sch.hoursPerDay;
  const available = hoursPerWeek * sch.weeks;
  const n = steps.length;
  const haveHours = n > 0 && steps.every((s) => typeof s.hours === "number" && s.hours > 0);
  const w = steps.map((s, i) => (haveHours ? (s.hours as number) : i === n - 1 && n > 1 ? 1.5 : 1));
  const wSum = w.reduce((a, b) => a + b, 0) || 1;
  let cum = 0;
  const out = steps.map((s, i) => {
    const hours = Math.max(0.5, Math.round(((available * w[i]) / wSum) * 2) / 2);
    const week = Math.min(sch.weeks, Math.floor(cum / hoursPerWeek + 1e-9) + 1);
    cum += (available * w[i]) / wSum;
    return { ...s, hours, week };
  });
  const ratio = neededHours > 0 ? available / neededHours : 1;
  return { steps: out, available, needed: neededHours, hoursPerWeek, minWeeks: Math.max(1, Math.ceil(neededHours / hoursPerWeek)), verdict: ratio < 0.75 ? "tight" : ratio > 1.5 ? "roomy" : "ok" };
}

export function planAsChecklist(plan: Plan): string {
  const lines = [`${plan.skill} (about ${plan.weeks} weeks)`, ...plan.steps.flatMap((s) => [`- [ ] Week ${s.week}${s.hours ? ` (~${s.hours} h)` : ""}: ${s.title}${s.detail ? `. ${s.detail}` : ""}`, ...(s.points ?? []).map((p) => `    - ${p}`)])];
  if (plan.courses.length) lines.push("", "Courses:", ...plan.courses.map((c) => `- ${c.title} (${c.provider}, ${c.free ? "free" : "paid"}): ${c.url}`));
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Filtering helpers used by the page                                  */
/* ------------------------------------------------------------------ */

export interface Filters {
  decision: Decision | null;
  remote: boolean;
  partTime: "any" | "yes" | "no";
  minStipend: number;
  role: string | null;
  query: string;
  hideMismatched: boolean;
}
export const DEFAULT_FILTERS: Filters = { decision: null, remote: false, partTime: "any", minStipend: 0, role: null, query: "", hideMismatched: false };

export function applyFilters(list: Scored[], f: Filters, skipDecision = false): Scored[] {
  const q = f.query.trim().toLowerCase();
  return list.filter((s) => {
    const j = s.job;
    if (!skipDecision && f.decision && s.decision !== f.decision) return false;
    if (f.remote && !j.remote) return false;
    if (f.partTime === "yes" && !j.partTime) return false;
    if (f.partTime === "no" && j.partTime) return false;
    if (f.minStipend > 0 && (j.stipendMonthly == null || j.stipendMonthly < f.minStipend)) return false;
    if (f.role && j.contentRole !== f.role) return false;
    if (f.hideMismatched && j.titleMismatch) return false;
    if (q && !(`${j.title} ${j.company} ${j.location} ${j.skillsN.join(" ")}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function stipendLabel(j: Job): string {
  return j.stipendText.replace(/\s+/g, " ");
}
