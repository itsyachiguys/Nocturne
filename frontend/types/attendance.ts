export type AttendanceStatus = "present" | "absent";

export type AttendanceSource = "self";

export interface CreateAttendanceData {
  studentId: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  note?: string;
}

export interface Attendance extends CreateAttendanceData {
  id: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AttendanceSummary {
  subjectId: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  percentage: number;
}