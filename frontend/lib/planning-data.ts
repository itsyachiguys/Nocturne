export interface PlannerTask {
  id: string;
  title: string;
  subject: string;
  due: string;
  done: boolean;
}

export const PLANNER_TASKS: PlannerTask[] = [
  { id: "p1", title: "Submit DSA assignment 4", subject: "DSA", due: "Today, 11:59 PM", done: false },
  { id: "p2", title: "Revise Thermodynamics unit 3", subject: "Thermodynamics", due: "Today", done: false },
  { id: "p3", title: "Read DBMS chapter 7", subject: "DBMS", due: "Tomorrow", done: true },
  { id: "p4", title: "Practice OS scheduling problems", subject: "OS", due: "Tomorrow", done: false },
];

export const WEEKLY_GOAL = { completed: 11, target: 18 };

export interface AnalyticsMetric {
  label: string;
  value: string;
  note: string;
}

export const ANALYTICS_METRICS: AnalyticsMetric[] = [
  { label: "Preparation score", value: "74%", note: "Based on quiz + revision coverage" },
  { label: "Knowledge retention", value: "68%", note: "From spaced-repetition recall rate" },
  { label: "Predicted marks", value: "8.4 CGPA", note: "Projected from current trend" },
  { label: "AI confidence", value: "76", note: "Composite of all subjects" },
];

export const SUBJECT_STRENGTH = [
  { subject: "Networks", score: 88 },
  { subject: "DSA", score: 80 },
  { subject: "DBMS", score: 66 },
  { subject: "OS", score: 58 },
  { subject: "Thermodynamics", score: 46 },
];

export interface ProfileAchievement {
  title: string;
  description: string;
}

export const ACHIEVEMENTS: ProfileAchievement[] = [
  { title: "14-day streak", description: "Studied every day for two weeks straight" },
  { title: "Quiz master", description: "Scored 90%+ on five consecutive quizzes" },
  { title: "Early bird", description: "Completed 10 tasks before their due date" },
];

export const STUDENT_PROFILE = {
  name: "Aria Fernandes",
  program: "B.Tech Computer Science, 3rd year",
  studentId: "21CS1042",
  email: "aria.fernandes@nocturne.edu",
  cgpa: "8.7",
  joined: "August 2023",
};
