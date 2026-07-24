import { IconMail, IconId, IconSchool, IconCalendar, IconEdit } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { ACHIEVEMENTS, STUDENT_PROFILE } from "@/lib/planning-data";

export default function ProfilePage() {
  return (
    <>
      <PageHeader 
        title="Profile" 
        subtitle="Your academic identity & achievements"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        
        {/* Profile Card */}
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-lavender to-soft-purple flex items-center justify-center shadow-soft">
            <span className="text-4xl">👩‍🎓</span>
          </div>
          
          <h3 className="text-xl font-semibold text-ink-primary">{STUDENT_PROFILE.name}</h3>
          <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">{STUDENT_PROFILE.program}</p>

          <div className="mt-8 space-y-4 text-left text-sm">
            <div className="flex items-center gap-3">
              <IconId size={18} className="text-lavender-dark" />
              <span>{STUDENT_PROFILE.studentId}</span>
            </div>
            <div className="flex items-center gap-3">
              <IconMail size={18} className="text-lavender-dark" />
              <span>{STUDENT_PROFILE.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <IconCalendar size={18} className="text-lavender-dark" />
              <span>Joined {STUDENT_PROFILE.joined}</span>
            </div>
          </div>

          <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-lavender px-4 py-3 text-sm font-medium hover:bg-lavender/10">
            <IconEdit size={16} />
            Edit Profile
          </button>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Academic Details */}
          <div className="card p-6">
            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Academic Details</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">Current CGPA</p>
                <p className="mt-1 font-display text-3xl font-bold text-lavender-dark">{STUDENT_PROFILE.cgpa}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-ink-secondary dark:text-ink-secondary-dark mb-1">
                  <IconSchool size={16} /> Program
                </p>
                <p className="font-display text-2xl font-semibold">B.Tech Computer Science</p>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card p-6">
            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Achievements</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ACHIEVEMENTS.map((a, idx) => (
                <div 
                  key={idx} 
                  className="rounded-2xl bg-surface-alt p-5 dark:bg-surface-alt-dark hover:shadow-soft transition-all"
                >
                  <div className="text-lg mb-1">🏆</div>
                  <p className="font-semibold text-ink-primary">{a.title}</p>
                  <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark leading-snug">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}