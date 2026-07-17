export interface Subject {
  id: string;
  name: string;
  faculty: string;
  credits: number;
  attendance: number;
  progress: number;
  colorClass: string;
}

export const SUBJECTS: Subject[] = [
  { id: "cs301", name: "Data Structures & Algorithms", faculty: "Dr. R. Menon", credits: 4, attendance: 94, progress: 72, colorClass: "from-lavender-dark to-soft-purple" },
  { id: "cs302", name: "Database Management Systems", faculty: "Dr. S. Kulkarni", credits: 4, attendance: 88, progress: 60, colorClass: "from-sky to-lavender-dark" },
  { id: "cs303", name: "Operating Systems", faculty: "Prof. A. Verma", credits: 3, attendance: 91, progress: 45, colorClass: "from-mint to-sky" },
  { id: "cs304", name: "Computer Networks", faculty: "Dr. N. Iyer", credits: 3, attendance: 96, progress: 80, colorClass: "from-pastel-orange to-coral" },
  { id: "cs305", name: "Thermodynamics", faculty: "Dr. P. Rao", credits: 3, attendance: 83, progress: 38, colorClass: "from-coral to-soft-purple" },
  { id: "cs306", name: "Engineering Mathematics IV", faculty: "Prof. K. Desai", credits: 4, attendance: 90, progress: 55, colorClass: "from-soft-purple to-sky" },
];

export interface AttendanceRecord {
  subject: string;
  attended: number;
  total: number;
  status: "safe" | "warning" | "danger";
}

export const ATTENDANCE_BY_SUBJECT: AttendanceRecord[] = [
  { subject: "Data Structures & Algorithms", attended: 47, total: 50, status: "safe" },
  { subject: "Database Management Systems", attended: 40, total: 46, status: "safe" },
  { subject: "Operating Systems", attended: 38, total: 44, status: "warning" },
  { subject: "Computer Networks", attended: 45, total: 47, status: "safe" },
  { subject: "Thermodynamics", attended: 30, total: 40, status: "danger" },
];

export const ATTENDANCE_TREND = [88, 90, 87, 91, 89, 92, 92];

export interface TimetableSlot {
  day: string;
  time: string;
  subject: string;
  room: string;
}

export const TIMETABLE: TimetableSlot[] = [
  { day: "Mon", time: "9:00", subject: "DSA", room: "Room 204" },
  { day: "Mon", time: "11:00", subject: "DBMS", room: "Room 118" },
  { day: "Tue", time: "9:00", subject: "OS", room: "Room 204" },
  { day: "Tue", time: "13:00", subject: "Networks", room: "Lab 3" },
  { day: "Wed", time: "10:00", subject: "Thermodynamics", room: "Room 302" },
  { day: "Wed", time: "14:00", subject: "DSA Lab", room: "Lab 1" },
  { day: "Thu", time: "9:00", subject: "Maths IV", room: "Room 204" },
  { day: "Thu", time: "11:00", subject: "DBMS", room: "Room 118" },
  { day: "Fri", time: "10:00", subject: "OS Lab", room: "Lab 2" },
];

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
