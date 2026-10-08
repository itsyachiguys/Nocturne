import type {
  Competition, Decision, ExperienceLevel, FitBreakdown, Job, JobAnalysis,
  Priority, Risk, SkillGap, UserProfile,
} from "./types";
import { countMentions, extractSkills, normalizeSkill, uniqueSkills } from "./skills";
import { estimateHours, getResources } from "./learning";

export const WEIGHTS = { semantic: 0.4, skills: 0.3, experience: 0.2, preferences: 0.1 } as const;

const RANK: Record<ExperienceLevel, number> = { intern: 0, entry: 1, mid: 2, senior: 3, lead: 4 };
const DAY = 86_400_000;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function words(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[^a-z0-9+#]+/).filter((w) => w.length > 2));
}

export function experienceScore(user: ExperienceLevel, job: ExperienceLevel): number {
  const diff = RANK[job] - RANK[user]; // positive = job is more senior than you
  const table: Record<string, number> = { "0": 100, "1": 70, "2": 35, "-1": 80, "-2": 55 };
  if (diff >= 3) return 10;
  if (diff <= -3) return 30;
  return table[String(diff)];
}

export function preferenceScore(p: UserProfile, job: Job): number {
  const mode = p.preferredModes.length ? (p.preferredModes.includes(job.mode) ? 100 : 0) : 70;
  let location = 70;
  if (p.preferredLocations.length) {
    const loc = job.location.toLowerCase();
    const hit = p.preferredLocations.some((l) => loc.includes(l.toLowerCase()));
    location = job.mode === "remote" || hit ? 100 : 0;
  }
  let role = 70;
  if (p.targetRoles.length) {
    const t = words(job.title);
    role = p.targetRoles.some((r) => [...words(r)].some((w) => t.has(w))) ? 100 : 0;
  }
  return Math.round(mode * 0.4 + location * 0.2 + role * 0.4);
}

function detectRisks(
  p: UserProfile, job: Job, b: FitBreakdown, requiredCount: number, matchedRatio: number, now: number
): Risk[] {
  const risks: Risk[] = [];

  // Ghost job: old, vague, or without concrete requirements.
  const ageDays = Math.max(0, Math.floor((now - job.postedAt) / DAY));
  const len = job.description.trim().length;
  let ghost = 0;
  const why: string[] = [];
  if (ageDays > 90) { ghost += 3; why.push(`posted ${ageDays} days ago`); }
  else if (ageDays > 45) { ghost += 2; why.push(`posted ${ageDays} days ago`); }
  else if (ageDays > 30) { ghost += 1; why.push(`posted ${ageDays} days ago`); }
  if (len < 250) { ghost += 2; why.push("very short description"); }
  else if (len < 500) { ghost += 1; why.push("thin description"); }
  if (requiredCount === 0) { ghost += 2; why.push("no concrete skills listed"); }
  if (ghost >= 2) {
    risks.push({
      type: "ghost_job",
      severity: ghost >= 4 ? "high" : "medium",
      message: `May be a ghost or stale posting: ${why.join(", ")}.`,
    });
  }

  // Career regression.
  const diff = RANK[job.level] - RANK[p.level];
  if (diff <= -2) {
    risks.push({ type: "career_regression", severity: "high", message: `This role is ${-diff} levels below your current level.` });
  } else if (diff === -1 && RANK[p.level] >= 3) {
    risks.push({ type: "career_regression", severity: "medium", message: "This role is a step down from your current seniority." });
  }

  // Skill stagnation.
  if (requiredCount >= 3 && matchedRatio >= 0.95 && diff <= 0) {
    risks.push({ type: "skill_stagnation", severity: "low", message: "You already have almost every listed skill, so there may be little new to learn." });
  }

  // Goal misalignment.
  if (p.targetRoles.length) {
    const t = words(job.title);
    const overlap = p.targetRoles.some((r) => [...words(r)].some((w) => t.has(w)));
    if (!overlap) {
      risks.push({
        type: "goal_misalignment",
        severity: b.semantic < 35 ? "high" : "medium",
        message: `The title doesn't match your target roles (${p.targetRoles.join(", ")}).`,
      });
    }
  }
  return risks;
}

function gapPriority(skill: string, job: Job, index: number): Priority {
  const text = `${job.title}\n${job.description}`;
  const inTitle = countMentions(job.title, skill) > 0;
  const mentions = countMentions(text, skill);
  if (inTitle || mentions >= 2 || index < 3) return "High";
  if (mentions >= 1 || index < 6) return "Medium";
  return "Low";
}

export function estimateCompetition(job: Job, fit: number, now = Date.now()): Competition {
  const factors: string[] = [];
  let s = 0;
  const pop = { high: 25, medium: 12, low: 0 }[job.companyPopularity];
  s += pop;
  if (pop >= 25) factors.push("Well-known company draws many applicants");
  const mode = { remote: 25, hybrid: 10, onsite: 0 }[job.mode];
  s += mode;
  if (job.mode === "remote") factors.push("Remote roles attract a wider applicant pool");
  const lvl = { intern: 20, entry: 20, mid: 12, senior: 6, lead: 0 }[job.level];
  s += lvl;
  if (lvl >= 20) factors.push("Entry-level roles are usually the most crowded");
  if (job.applicantsEstimate > 200) { s += 15; factors.push(`Around ${job.applicantsEstimate} applicants reported`); }
  else if (job.applicantsEstimate > 50) { s += 7; }
  const ageDays = (now - job.postedAt) / DAY;
  if (ageDays <= 3) { s += 8; factors.push("Fresh posting, early applications pile up fast"); }
  // A weaker fit means you stand out less against the pool.
  const adj = (50 - fit) * 0.3;
  s += adj;
  if (fit < 50) factors.push("Your fit is below average for this role, so you'd compete harder");
  else if (fit >= 75) factors.push("Your strong fit helps you stand out");
  const score = Math.round(clamp(s));
  return { score, level: score < 35 ? "low" : score < 60 ? "medium" : "high", factors };
}

export function analyzeJob(profile: UserProfile, job: Job, semantic: number, now = Date.now()): JobAnalysis {
  const have = new Set(uniqueSkills(profile.skills));
  const declared = uniqueSkills(job.requiredSkills);
  const required = declared.length ? declared : extractSkills(`${job.title}\n${job.description}`).map(normalizeSkill);
  const matched = required.filter((s) => have.has(s));
  const missing = required.filter((s) => !have.has(s));
  const skillScore = required.length ? Math.round((matched.length / required.length) * 100) : 50;

  const breakdown: FitBreakdown = {
    semantic: clamp(Math.round(semantic)),
    skills: skillScore,
    experience: experienceScore(profile.level, job.level),
    preferences: preferenceScore(profile, job),
  };
  const score = Math.round(
    breakdown.semantic * WEIGHTS.semantic + breakdown.skills * WEIGHTS.skills +
    breakdown.experience * WEIGHTS.experience + breakdown.preferences * WEIGHTS.preferences
  );

  const gaps: SkillGap[] = missing.map((skill, i) => ({
    skill,
    priority: gapPriority(skill, job, i),
    estimatedHours: estimateHours(skill),
    resources: getResources(skill),
  }));
  const order: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
  gaps.sort((a, b) => order[a.priority] - order[b.priority]);

  const risks = detectRisks(profile, job, breakdown, required.length, required.length ? matched.length / required.length : 0, now);
  const highRisk = risks.find((r) => r.severity === "high");
  const highGaps = gaps.filter((g) => g.priority === "High").length;

  let decision: Decision;
  let decisionReason: string;
  if (highRisk) {
    decision = "avoid";
    decisionReason = highRisk.message;
  } else if (score < 35) {
    decision = "avoid";
    decisionReason = `Fit is only ${score}%, too far from your profile to be worth the effort.`;
  } else if (score < 55) {
    decision = "skip";
    decisionReason = `Fit is ${score}%. Your time is better spent on closer matches.`;
  } else if (score >= 75 && highGaps <= 1) {
    decision = "apply";
    decisionReason = `Strong ${score}% fit${missing.length ? ` with only minor gaps (${missing.slice(0, 2).join(", ")})` : ""}.`;
  } else {
    decision = "wait";
    decisionReason = highGaps > 1
      ? `Good ${score}% fit, but close ${highGaps} high-priority skill gaps first (${gaps.filter((g) => g.priority === "High").slice(0, 3).map((g) => g.skill).join(", ")}).`
      : `Decent ${score}% fit. Build a few more relevant skills or evidence before applying.`;
  }

  const strengths: string[] = [];
  if (matched.length) strengths.push(`You already have ${matched.length} of ${required.length} required skills (${matched.slice(0, 4).join(", ")}).`);
  if (breakdown.experience >= 80) strengths.push("Your experience level matches what the role asks for.");
  if (breakdown.semantic >= 70) strengths.push("Your background reads very close to the role description.");
  if (breakdown.preferences >= 80) strengths.push("Work mode, location and title fit your preferences.");

  return {
    score, breakdown, decision, decisionReason,
    requiredSkills: required, matchedSkills: matched, missingSkills: missing,
    strengths, risks, gaps, competition: estimateCompetition(job, score, now),
  };
}

export const DECISION_META: Record<Decision, { label: string; icon: string; classes: string }> = {
  apply: { label: "Apply", icon: "✅", classes: "bg-green-100 text-green-800 border-green-300" },
  wait: { label: "Wait", icon: "⏱", classes: "bg-amber-100 text-amber-800 border-amber-300" },
  skip: { label: "Skip", icon: "➖", classes: "bg-gray-100 text-gray-700 border-gray-300" },
  avoid: { label: "Avoid", icon: "❌", classes: "bg-red-100 text-red-800 border-red-300" },
};
