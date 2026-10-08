"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { OpportunityService } from "@/services/OpportunityService";
import type { UserProfile } from "@/lib/obliqo/types";
import JobsTab from "@/components/opportunities/JobsTab";
import ProfileTab from "@/components/opportunities/ProfileTab";
import LearningPlansTab from "@/components/opportunities/LearningPlansTab";

type Tab = "jobs" | "profile" | "plans";
const TABS: { id: Tab; label: string }[] = [
  { id: "jobs", label: "Jobs" },
  { id: "profile", label: "My Profile" },
  { id: "plans", label: "Learning Plans" },
];

export default function OpportunitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("jobs");
  const [plansVersion, setPlansVersion] = useState(0);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); }), []);

  useEffect(() => {
    if (!user) return;
    OpportunityService.getProfile(user.uid).then((p) => {
      setProfile(p);
      if (!p) setTab("profile");
    });
  }, [user]);

  if (!authReady) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!user) return <div className="p-8">Please sign in to use Opportunities.</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Opportunities</h1>
      <p className="mb-4 text-sm text-gray-600">
        Match jobs to your profile, see why they fit (or don&apos;t), and plan the skills to close the gap.
      </p>
      <div className="mb-6 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.id ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "jobs" && (
        <JobsTab user={user} profile={profile} onEditProfile={() => setTab("profile")} onPlanCreated={() => { setPlansVersion((v) => v + 1); setTab("plans"); }} />
      )}
      {tab === "profile" && <ProfileTab uid={user.uid} profile={profile} onSaved={(p) => { setProfile(p); setTab("jobs"); }} />}
      {tab === "plans" && <LearningPlansTab key={plansVersion} uid={user.uid} />}
    </div>
  );
}
