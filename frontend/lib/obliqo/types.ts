export type ExperienceLevel = "intern" | "entry" | "mid" | "senior" | "lead";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type Decision = "apply" | "wait" | "skip" | "avoid";
export type Priority = "High" | "Medium" | "Low";
export type Popularity = "low" | "medium" | "high";

export interface UserProfile {
  userId: string;
  headline: string;
  summary: string;
  skills: string[];
  yearsExperience: number;
  level: ExperienceLevel;
  goals: string;
  targetRoles: string[];
  preferredModes: WorkMode[];
  preferredLocations: string[];
  updatedAt: number;
}

export interface Job {
  id?: string;
  userId: string;
  title: string;
  company: string;
  location: string;
  mode: WorkMode;
  level: ExperienceLevel;
  description: string;
  requiredSkills: string[];
  postedAt: number; // ms since epoch
  companyPopularity: Popularity;
  applicantsEstimate: number; // 0 = unknown
  url: string;
  createdAt: number;
}

export interface FitBreakdown {
  semantic: number;
  skills: number;
  experience: number;
  preferences: number;
}

export interface LearningResource {
  label: string;
  url: string;
  kind: "docs" | "search";
}

export interface SkillGap {
  skill: string;
  priority: Priority;
  estimatedHours: number;
  resources: LearningResource[];
}

export interface Risk {
  type: "ghost_job" | "career_regression" | "skill_stagnation" | "goal_misalignment";
  severity: "low" | "medium" | "high";
  message: string;
}

export interface Competition {
  level: "low" | "medium" | "high";
  score: number;
  factors: string[];
}

export interface JobAnalysis {
  score: number;
  breakdown: FitBreakdown;
  decision: Decision;
  decisionReason: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  risks: Risk[];
  gaps: SkillGap[];
  competition: Competition;
}

export interface LearningPlanItem {
  skill: string;
  priority: Priority;
  estimatedHours: number;
  resources: LearningResource[];
  done: boolean;
}

export interface LearningPlan {
  id?: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  items: LearningPlanItem[];
  createdAt: number;
}
