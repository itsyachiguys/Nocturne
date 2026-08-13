import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
  } from "firebase/firestore";
  
  import { db } from "@/lib/firebase";
  
  import {
    Attendance,
    AttendanceSummary,
    CreateAttendanceData,
  } from "@/types/attendance";
  
  const COLLECTION = "attendance";
  
  export const AttendanceService = {
    /*
     * ===========================================================
     * CREATE ATTENDANCE RECORD
     * ===========================================================
     */
  
    async create(data: CreateAttendanceData) {
      const ref = await addDoc(
        collection(db, COLLECTION),
        {
          ...data,
  
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
  
      return ref.id;
    },
  
    /*
     * ===========================================================
     * GET ALL ATTENDANCE RECORDS FOR A STUDENT
     * ===========================================================
     */
  
    async getByStudent(studentId: string) {
      const q = query(
        collection(db, COLLECTION),
        where("studentId", "==", studentId)
      );
  
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Attendance[];
    },
  
    /*
     * ===========================================================
     * GET ATTENDANCE RECORDS FOR A SUBJECT
     * ===========================================================
     */
  
    async getBySubject(
      studentId: string,
      subjectId: string
    ) {
      const q = query(
        collection(db, COLLECTION),
        where("studentId", "==", studentId),
        where("subjectId", "==", subjectId)
      );
  
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Attendance[];
    },
  
    /*
     * ===========================================================
     * GET ATTENDANCE SUMMARY FOR A SUBJECT
     * ===========================================================
     */
  
    async getSummary(
      studentId: string,
      subjectId: string
    ): Promise<AttendanceSummary> {
      const records =
        await this.getBySubject(
          studentId,
          subjectId
        );
  
      const totalClasses = records.length;
  
      const presentClasses =
        records.filter(
          (record) =>
            record.status === "present"
        ).length;
  
      const absentClasses =
        records.filter(
          (record) =>
            record.status === "absent"
        ).length;
  
      const percentage =
        totalClasses === 0
          ? 0
          : Number(
              (
                (presentClasses /
                  totalClasses) *
                100
              ).toFixed(2)
            );
  
      return {
        subjectId,
        totalClasses,
        presentClasses,
        absentClasses,
        percentage,
      };
    },
  
    /*
     * ===========================================================
     * UPDATE ATTENDANCE RECORD
     * ===========================================================
     */
  
    async update(
      attendanceId: string,
      data: Partial<CreateAttendanceData>
    ) {
      await updateDoc(
        doc(
          db,
          COLLECTION,
          attendanceId
        ),
        {
          ...data,
          updatedAt: serverTimestamp(),
        }
      );
    },
  
    /*
     * ===========================================================
     * DELETE ATTENDANCE RECORD
     * ===========================================================
     */
  
    async delete(attendanceId: string) {
      await deleteDoc(
        doc(
          db,
          COLLECTION,
          attendanceId
        )
      );
    },
  };