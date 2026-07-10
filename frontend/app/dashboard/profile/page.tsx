import { IconMail, IconId, IconSchool, IconCalendar } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { ACHIEVEMENTS, STUDENT_PROFILE } from "@/lib/planning-data";

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-sky to-soft-purple" />
          <h4 className="text-[16px]">{STUDENT_PROFILE.name}</h4>
          <p className="mb-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">{STUDENT_PROFILE.program}</p>
          <div className="flex flex-col gap-2 text-left text-[13px]">
            <p className="flex items-center gap-2 text-ink-secondary dark:text-ink-secondary-dark">
              <IconId size={15} /> {STUDENT_PROFILE.studentId}
            </p>
            <p className="flex items-center gap-2 text-ink-secondary dark:text-ink-secondary-dark">
              <IconMail size={15} /> {STUDENT_PROFILE.email}
            </p>
            <p className="flex items-center gap-2 text-ink-secondary dark:text-ink-secondary-dark">
              <IconCalendar size={15} /> Joined {STUDENT_PROFILE.joined}
            </p>
          </div>
        </div>

        <div>
          <div className="card mb-4 p-5">
            <h4 className="mb-4 text-[14.5px]">Academic details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">Current CGPA</p>
                <p className="font-display text-xl font-bold">{STUDENT_PROFILE.cgpa}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  <IconSchool size={13} /> Program
                </p>
                <p className="font-display text-xl font-bold">B.Tech CS</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="mb-4 text-[14.5px]">Achievements</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ACHIEVEMENTS.map((a) => (
                <div key={a.title} className="rounded-md bg-surface-alt p-4 dark:bg-surface-alt-dark">
                  <p className="text-[13px] font-semibold">{a.title}</p>
                  <p className="mt-1 text-[11px] text-ink-secondary dark:text-ink-secondary-dark">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
