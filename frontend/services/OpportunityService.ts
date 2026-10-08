import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, LearningPlan, LearningPlanItem, SkillGap, UserProfile } from "@/lib/obliqo/types";

const PROFILES = "opportunityProfiles"; // doc id = uid
const JOBS = "opportunityJobs";
const PLANS = "opportunityLearningPlans";

export const OpportunityService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, PROFILES, uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(db, PROFILES, profile.userId), { ...profile, updatedAt: Date.now() });
  },

  async listJobs(uid: string): Promise<Job[]> {
    // Sorted client-side so no composite index is required.
    const snap = await getDocs(query(collection(db, JOBS), where("userId", "==", uid)));
    return snap.docs
      .map((d) => ({ ...(d.data() as Job), id: d.id }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async addJob(job: Omit<Job, "id">): Promise<string> {
    const ref = await addDoc(collection(db, JOBS), job);
    return ref.id;
  },

  async deleteJob(id: string): Promise<void> {
    await deleteDoc(doc(db, JOBS, id));
  },

  async listPlans(uid: string): Promise<LearningPlan[]> {
    const snap = await getDocs(query(collection(db, PLANS), where("userId", "==", uid)));
    return snap.docs
      .map((d) => ({ ...(d.data() as LearningPlan), id: d.id }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async createPlan(uid: string, job: Job, gaps: SkillGap[]): Promise<string> {
    const items: LearningPlanItem[] = gaps.map((g) => ({
      skill: g.skill,
      priority: g.priority,
      estimatedHours: g.estimatedHours,
      resources: g.resources,
      done: false,
    }));
    const plan: Omit<LearningPlan, "id"> = {
      userId: uid,
      jobId: job.id ?? "",
      jobTitle: job.title,
      company: job.company,
      items,
      createdAt: Date.now(),
    };
    const ref = await addDoc(collection(db, PLANS), plan);
    return ref.id;
  },

  async setPlanItems(planId: string, items: LearningPlanItem[]): Promise<void> {
    await updateDoc(doc(db, PLANS, planId), { items });
  },

  async deletePlan(id: string): Promise<void> {
    await deleteDoc(doc(db, PLANS, id));
  },
};
