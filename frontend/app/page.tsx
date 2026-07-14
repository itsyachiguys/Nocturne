import Link from "next/link";
import {
  IconArrowRight,
  IconPlayerPlay,
  IconUpload,
  IconNotes,
  IconHelpCircle,
  IconCalendarCheck,
  IconCalendarEvent,
  IconChartLine,
  IconCards,
  IconShare3,
} from "@tabler/icons-react";
import { FeatureCard } from "@/components/FeatureCard";
import { Logo } from "@/components/common/Logo";

const FEATURES = [
  { icon: IconUpload, bg: "bg-lavender/10", color: "text-lavender-dark", title: "Upload PDFs", description: "Drop lecture slides or textbooks, get structured content instantly." },
  { icon: IconNotes, bg: "bg-mint/10", color: "text-mint", title: "AI notes", description: "Turn dense material into clean, scannable study notes." },
  { icon: IconHelpCircle, bg: "bg-pastel-orange/10", color: "text-pastel-orange", title: "AI quiz", description: "Auto generated quizzes tuned to your weak topics." },
  { icon: IconCalendarCheck, bg: "bg-sky/10", color: "text-sky", title: "Attendance", description: "Live tracking with predictive alerts before it is too late." },
  { icon: IconCalendarEvent, bg: "bg-coral/10", color: "text-coral", title: "Planner", description: "Tasks, deadlines and goals in one calm daily view." },
  { icon: IconChartLine, bg: "bg-lavender/10", color: "text-lavender-dark", title: "Analytics", description: "See preparation score and predicted marks per subject." },
  { icon: IconCards, bg: "bg-mint/10", color: "text-mint", title: "Flashcards", description: "Spaced repetition decks generated straight from your notes." },
  { icon: IconShare3, bg: "bg-pastel-orange/10", color: "text-pastel-orange", title: "Mind maps", description: "Visualize how concepts across a subject connect." },
];

export default function LandingPage() {
  return (
    <div>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-12 py-5">
        <Logo />
        <div className="hidden gap-8 text-sm font-semibold text-ink-secondary dark:text-ink-secondary-dark md:flex">
          <a href="#features">Features</a>
          <a href="#why">Why Nocturne</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-primary">
            Get started <IconArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-12 py-16 md:grid-cols-2 md:py-20">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface-alt px-4 py-2 text-[13px] font-semibold text-lavender-dark dark:bg-surface-alt-dark">
            AI powered student OS
          </span>
          <h1 className="mb-5 text-4xl leading-tight md:text-5xl">
            Run your entire academic life from{" "}
            <span className="gradient-text">one calm workspace</span>
          </h1>
          <p className="mb-8 max-w-md text-[17px] leading-relaxed text-ink-secondary dark:text-ink-secondary-dark">
            Upload material, generate notes and quizzes, track attendance, and
            stay ahead of every deadline — all guided by AI built for students.
          </p>
          <div className="mb-10 flex flex-wrap gap-3.5">
            <Link href="/signup" className="btn-primary">
              Get started free <IconArrowRight size={16} />
            </Link>
            <button className="btn-ghost">
              <IconPlayerPlay size={16} /> Watch demo
            </button>
          </div>
          <div className="flex gap-8">
            {[
              ["40k+", "students onboard"],
              ["2.1M", "notes generated"],
              ["4.9/5", "average rating"],
            ].map(([num, label]) => (
              <div key={label}>
                <p className="font-display text-xl font-extrabold">{num}</p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-[420px]">
          <div className="card absolute inset-0 overflow-hidden p-6 shadow-floating">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold">Good evening, Aria</p>
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky to-soft-purple" />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3.5">
              {[
                ["8.7", "Current CGPA"],
                ["92%", "Attendance"],
                ["14 days", "Study streak"],
                ["76", "AI confidence score"],
              ].map(([num, label]) => (
                <div key={label} className="rounded-md bg-surface-alt p-4 dark:bg-surface-alt-dark">
                  <p className="font-display text-xl font-extrabold">{num}</p>
                  <p className="mt-0.5 text-[11px] text-ink-secondary dark:text-ink-secondary-dark">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex h-32 items-end gap-2">
              {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gradient-to-b from-soft-purple to-lavender-dark" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-12 py-16">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-lavender-dark">Features</p>
          <h2 className="my-3 text-3xl">Everything a student needs, built in</h2>
          <p className="text-ink-secondary dark:text-ink-secondary-dark">
            Ten focused tools that replace a dozen scattered apps.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              iconBgClass={f.bg}
              iconColorClass={f.color}
              title={f.title}
              description={f.description}
            />
          ))}
        </div>
      </section>

      <footer className="bg-surface-alt px-12 py-14 dark:bg-surface-alt-dark">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-line pt-6 text-xs text-ink-muted dark:border-line-dark md:flex-row md:justify-between">
          <span>© 2026 Nocturne. All rights reserved.</span>
          <span>Made for students, by students.</span>
        </div>
      </footer>
    </div>
  );
}
