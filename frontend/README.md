# Nocturne — UI skeleton

Real Next.js 15 / React 19 / TypeScript / Tailwind code matching the
landing page and dashboard mockup, using the lavender design system
from the brief.

## What's here

```
app/
  layout.tsx              Root layout, fonts, dark-mode class hook
  globals.css              Tailwind layers + shared component classes
  page.tsx                  Landing page
  dashboard/
    layout.tsx              Shared shell (renders Sidebar once)
    page.tsx                Dashboard home
    subjects/
      page.tsx              Subject grid
      [id]/page.tsx          Subject detail (units, tools)
    materials/page.tsx      Study material / file list
    notes/page.tsx           Pinned + recent notes
    flashcards/page.tsx     Deck grid with mastery bars
    quizzes/page.tsx        Create quiz + history + weak topics
    mock-exams/page.tsx     Mock test list with status
    attendance/page.tsx      Overall + per-subject + trend
    planner/page.tsx        Today's tasks, weekly goal, pomodoro
    timetable/page.tsx      Weekly grid
    analytics/page.tsx      Preparation score, subject strength
    leaderboard/page.tsx    Full ranked list
    profile/page.tsx         Personal + academic + achievements
    settings/page.tsx        Theme, notifications, account
components/
  Sidebar.tsx          Data-driven nav with expandable groups
  Topbar.tsx           Greeting, search, notifications, avatar
  StatCard.tsx         Dashboard metric card
  FeatureCard.tsx      Landing page feature card
  PageHeader.tsx       Shared title/subtitle/action header for subpages
  EmptyState.tsx       Shared empty-state pattern (not yet wired to zero-data cases)
lib/
  dashboard-data.ts    Dashboard home mock data
  academic-data.ts     Subjects, attendance, timetable mock data
  ai-workspace-data.ts Notes, flashcards, quizzes, mock exams, files
  planning-data.ts     Planner, analytics, profile mock data
tailwind.config.ts    Lavender / mint / coral / sky design tokens
```

Every sidebar link now resolves to a real page — no dead ends. All data comes from typed constants in `lib/`, structured so swapping in real API calls later only touches those files, not the components.

## Run it

```
npm install
npm run dev
```

Then open `http://localhost:3000` for the landing page and
`http://localhost:3000/dashboard` for the dashboard.

## Design tokens

Colors, radii, and shadows are all declared once in
`tailwind.config.ts` (`lavender`, `soft-purple`, `sky`, `mint`,
`pastel-orange`, `coral`, plus `surface-*` / `ink-*` pairs for
light/dark mode). Every component reads from these instead of
hardcoding hex values, so re-theming the whole app is a one-file change.

## What's intentionally not here yet

Authentication pages (login/signup/forgot password/OTP), the AI chat
and mind-map tools, and the entire backend/database layer from the
engineering-requirements doc. Happy to build out any of those next,
following the same component + data-file pattern established here.
