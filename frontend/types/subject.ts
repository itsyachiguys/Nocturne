export interface CreateSubjectData {
  studentId: string;
  name: string;
  code: string;
  semester: number;
  credits: number;
  faculty: string;
  color: string;
}

export interface Subject extends CreateSubjectData {
  id: string;

  progress?: number;
  attendance?: number;

  createdAt?: any;
  updatedAt?: any;
}