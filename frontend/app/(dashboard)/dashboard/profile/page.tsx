"use client";

import { useEffect, useState } from "react";
import {
  IconMail,
  IconId,
  IconSchool,
  IconCalendar,
  IconEdit,
  IconX,
  IconDeviceFloppy,
  IconUser,
  IconBook,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/PageHeader";
import { UserService } from "@/services/user.service";
import { useAuth } from "@/context/AuthContext";

interface ProfileData {
  name?: string;
  email?: string;
  photoURL?: string;
  provider?: string;

  university?: string;
  degree?: string;
  branch?: string;
  semester?: number;
  graduationYear?: number;

  studentId?: string;
  createdAt?: {
    toDate?: () => Date;
  };

  cgpa?: number;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * Form state
   */
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState(1);
  const [graduationYear, setGraduationYear] = useState(
    new Date().getFullYear()
  );
  const [cgpa, setCgpa] = useState(0);

  /*
   * Load profile
   */
  async function loadProfile() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await UserService.getProfile(user.uid);

      if (!data) {
        setProfile(null);
        return;
      }

      const profileData = data as ProfileData;

      setProfile(profileData);

      /*
       * Populate form
       */
      setName(profileData.name ?? user.displayName ?? "");
      setUniversity(profileData.university ?? "");
      setDegree(profileData.degree ?? "");
      setBranch(profileData.branch ?? "");
      setSemester(profileData.semester ?? 1);
      setGraduationYear(
        profileData.graduationYear ??
          new Date().getFullYear()
      );
      setCgpa(profileData.cgpa ?? 0);
    } catch (err) {
      console.error("Failed to load profile:", err);

      setError(
        "Failed to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
    }
  }, [authLoading, user]);

  /*
   * Save profile
   */
  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      await UserService.updateProfile(user.uid, {
        name: name.trim(),
        university: university.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        semester,
        graduationYear,
        cgpa,
      });

      await loadProfile();

      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);

      setError(
        "Failed to save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Cancel editing
   */
  function handleCancel() {
    if (!profile) return;

    setName(profile.name ?? user?.displayName ?? "");
    setUniversity(profile.university ?? "");
    setDegree(profile.degree ?? "");
    setBranch(profile.branch ?? "");
    setSemester(profile.semester ?? 1);
    setGraduationYear(
      profile.graduationYear ??
        new Date().getFullYear()
    );
    setCgpa(profile.cgpa ?? 0);

    setError(null);
    setEditing(false);
  }

  /*
   * Loading
   */
  if (authLoading || loading) {
    return (
      <>
        <PageHeader
          title="Profile"
          subtitle="Your academic identity & achievements"
        />

        <div className="card p-8">
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Loading profile...
          </p>
        </div>
      </>
    );
  }

  /*
   * Not authenticated
   */
  if (!user) {
    return (
      <>
        <PageHeader
          title="Profile"
          subtitle="Your academic identity & achievements"
        />

        <div className="card p-8">
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Please log in to view your profile.
          </p>
        </div>
      </>
    );
  }

  /*
   * Profile not found
   */
  if (!profile) {
    return (
      <>
        <PageHeader
          title="Profile"
          subtitle="Your academic identity & achievements"
        />

        <div className="card p-8">
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Profile information could not be found.
          </p>
        </div>
      </>
    );
  }

  const displayName =
    profile.name ||
    user.displayName ||
    "Student";

  const displayEmail =
    profile.email ||
    user.email ||
    "No email available";

  const joinedDate = profile.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )
    : "Recently";

  /*
   * ============================================================
   * EDIT MODE
   * ============================================================
   */

  if (editing) {
    return (
      <>
        <PageHeader
          title="Edit Profile"
          subtitle="Update your academic information"
        />

        <div className="max-w-2xl">
          <div className="card p-6">
            {error && (
              <div className="mb-6 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
                {error}
              </div>
            )}

            <div className="space-y-6">

              {/* Name */}
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                >
                  Full Name
                </label>

                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
                  placeholder="Your full name"
                />
              </div>

              {/* Email - read only */}
              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                >
                  Email
                </label>

                <input
                  id="profile-email"
                  value={displayEmail}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-line bg-surface-alt px-4 py-3 text-ink-secondary outline-none
dark:border-line-dark dark:bg-surface-alt-dark dark:text-ink-secondary-dark dark:text-ink-secondary-dark outline-none"
                />

                <p className="mt-2 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  Email is managed by your authentication
                  provider.
                </p>
              </div>

              {/* University */}
              <div>
                <label
                  htmlFor="profile-university"
                  className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                >
                  University
                </label>

                <input
                  id="profile-university"
                  value={university}
                  onChange={(e) =>
                    setUniversity(e.target.value)
                  }
                  className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
                  placeholder="e.g. Indus University"
                />
              </div>

              {/* Degree */}
              <div>
                <label
                  htmlFor="profile-degree"
                  className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                >
                  Degree
                </label>

                <input
                  id="profile-degree"
                  value={degree}
                  onChange={(e) =>
                    setDegree(e.target.value)
                  }
                  className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
                  placeholder="e.g. B.Tech"
                />
              </div>

              {/* Branch */}
              <div>
                <label
                  htmlFor="profile-branch"
                  className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                >
                  Branch
                </label>

                <input
                  id="profile-branch"
                  value={branch}
                  onChange={(e) =>
                    setBranch(e.target.value)
                  }
                  className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
                  placeholder="e.g. Computer Engineering"
                />
              </div>

              {/* Semester + Graduation + CGPA */}
              <div className="grid gap-4 sm:grid-cols-3">

                {/* Semester */}
                <div>
                  <label
                    htmlFor="profile-semester"
                    className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                  >
                    Current Semester
                  </label>

                  <input
                    id="profile-semester"
                    type="number"
                    min={1}
                    max={12}
                    value={semester}
                    onChange={(e) =>
                      setSemester(
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
                  />
                </div>

                {/* Graduation Year */}
                <div>
                  <label
                    htmlFor="profile-graduation"
                    className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                  >
                    Graduation Year
                  </label>

                  <input
                    id="profile-graduation"
                    type="number"
                    min={2020}
                    max={2100}
                    value={graduationYear}
                    onChange={(e) =>
                      setGraduationYear(
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
                  />
                </div>

                {/* CGPA */}
                <div>
                  <label
                    htmlFor="profile-cgpa"
                    className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
                  >
                    Current CGPA
                  </label>

                  <input
                    id="profile-cgpa"
                    type="number"
                    min={0}
                    max={10}
                    step={0.01}
                    value={cgpa}
                    onChange={(e) =>
                      setCgpa(Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
                    placeholder="e.g. 9.70"
                  />

                  <p className="mt-2 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                    Enter your CGPA out of 10.
                  </p>
                </div>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-medium transition hover:bg-surface-alt dark:hover:bg-surface-alt-dark disabled:opacity-50"
                >
                  <IconX size={17} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IconDeviceFloppy size={17} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>
          </div>
        </div>
      </>
    );
  }

  /*
   * ============================================================
   * NORMAL PROFILE VIEW
   * ============================================================
   */

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Your academic identity & achievements"
      />

      {error && (
        <div className="mb-6 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

        {/* Profile Card */}
        <div className="card p-8 text-center">

          {/* Avatar */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-lavender to-soft-purple shadow-soft">

            {profile.photoURL || user.photoURL ? (
              <img
                src={profile.photoURL || user.photoURL || ""}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <IconUser
                size={42}
                className="text-white"
              />
            )}

          </div>

          <h3 className="text-xl font-semibold text-ink-primary dark:text-ink-primary-dark">
            {displayName}
          </h3>

          <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
            {profile.degree || "Student"}
            {profile.branch
              ? ` • ${profile.branch}`
              : ""}
          </p>

          <div className="mt-8 space-y-4 text-left text-sm">

            {/* Student ID */}
            {profile.studentId && (
              <div className="flex items-center gap-3">
                <IconId
                  size={18}
                  className="text-lavender-dark"
                />

                <span>
                  {profile.studentId}
                </span>
              </div>
            )}

            {/* Email */}
            <div className="flex items-center gap-3">
              <IconMail
                size={18}
                className="text-lavender-dark"
              />

              <span className="break-all">
                {displayEmail}
              </span>
            </div>

            {/* Joined */}
            <div className="flex items-center gap-3">
              <IconCalendar
                size={18}
                className="text-lavender-dark"
              />

              <span>
                Joined {joinedDate}
              </span>
            </div>

          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-lavender px-4 py-3 text-sm font-medium transition hover:bg-lavender/10"
          >
            <IconEdit size={16} />
            Edit Profile
          </button>

        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Academic Details */}
          <div className="card p-6">

            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
              Academic Details
            </h4>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">

              {/* University */}
              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  University
                </p>

                <p className="mt-1 font-semibold">
                  {profile.university ||
                    "Not specified"}
                </p>
              </div>

              {/* Degree */}
              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  Degree
                </p>

                <p className="mt-1 font-semibold">
                  {profile.degree ||
                    "Not specified"}
                </p>
              </div>

              {/* Branch */}
              <div>
                <p className="flex items-center gap-1.5 text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  <IconSchool size={16} />
                  Branch
                </p>

                <p className="mt-1 font-semibold">
                  {profile.branch ||
                    "Not specified"}
                </p>
              </div>

              {/* Semester */}
              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  Current Semester
                </p>

                <p className="mt-1 font-display text-2xl font-bold text-lavender-dark">
                  {profile.semester ??
                    "—"}
                </p>
              </div>

              {/* Graduation */}
              <div>
                <p className="flex items-center gap-1.5 text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  <IconCalendar size={16} />
                  Graduation
                </p>

                <p className="mt-1 font-display text-2xl font-bold text-lavender-dark">
                  {profile.graduationYear ??
                    "—"}
                </p>
              </div>

              {/* CGPA */}
              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  Current CGPA
                </p>

                <p className="mt-1 font-display text-2xl font-bold text-lavender-dark">
                  {profile.cgpa ?? "—"}
                </p>
              </div>

            </div>

          </div>

          {/* Account Information */}
          <div className="card p-6">

            <div className="mb-5 flex items-center gap-2">
              <IconBook
                size={19}
                className="text-lavender-dark"
              />

              <h4 className="text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
                Account Information
              </h4>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  Authentication
                </p>

                <p className="mt-1 font-medium capitalize">
                  {profile.provider ||
                    "Email & Password"}
                </p>
              </div>

              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark dark:text-ink-secondary dark:text-ink-secondary-dark-dark">
                  Email
                </p>

                <p className="mt-1 break-all font-medium">
                  {displayEmail}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}