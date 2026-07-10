// Centralized data shapes for the dashboard. In production these
// would be replaced by fetches into `services/` (e.g. getStudentStats()),
// but keeping the shape defined here means the swap only touches
// the page component, never the presentational components.

export interface StatDatum {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative";
}

export const DASHBOARD_STATS: StatDatum[] = [
  { label: "Current CGPA", value: "8.7", delta: "+0.2 this semester", deltaTone: "positive" },
  { label: "Study streak", value: "14 days", delta: "Personal best", deltaTone: "positive" },
  { label: "Attendance", value: "92%", delta: "Safe zone", deltaTone: "positive" },
  { label: "AI confidence score", value: "76", delta: "+4 vs last week", deltaTone: "positive" },
  { label: "Assignments due", value: "3", delta: "2 due tomorrow", deltaTone: "negative" },
];

export interface TaskDatum {
  id: string;
  title: string;
  meta: string;
}

export const UPCOMING_TASKS: TaskDatum[] = [
  { id: "t1", title: "Submit DSA assignment 4", meta: "Due tomorrow, 11:59 PM" },
  { id: "t2", title: "Revise Thermodynamics unit 3", meta: "Exam in 4 days" },
  { id: "t3", title: "Upload OS lecture notes", meta: "For AI note generation" },
  { id: "t4", title: "Complete mock test — DBMS", meta: "Weak topic: normalization" },
];

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: string;
  isCurrentUser?: boolean;
}

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Meera Iyer", points: "2,480 pts" },
  { rank: 2, name: "Daniel Osei", points: "2,310 pts" },
  { rank: 3, name: "You", points: "2,190 pts", isCurrentUser: true },
  { rank: 4, name: "Priya Sharma", points: "2,050 pts" },
];

export const WEEKLY_STUDY_HOURS = [40, 65, 50, 80, 55, 70, 90];
