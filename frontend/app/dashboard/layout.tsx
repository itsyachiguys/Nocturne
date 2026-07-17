"use client";

import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logout = () => {
    alert("Logout will be implemented after backend integration.");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="flex w-72 flex-col border-r border-slate-200 bg-white shadow-lg">

        {/* Logo */}
        <div className="border-b border-slate-200 px-6 py-6">
          <div className="flex items-center gap-4">

            <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-violet-300 shadow-md">
              <Image
                src="/Logo.png"
                alt="Nocturne Logo"
                fill
                priority
                className="object-cover"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-violet-700">
                Nocturne
              </h1>

              <p className="text-xs text-slate-500">
                AI Powered Learning Platform
              </p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-5 py-6">

          <Link
            href="/dashboard"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            🏠 Dashboard
          </Link>

          <Link
            href="/dashboard/subjects"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            📚 Subjects
          </Link>

          <Link
            href="/dashboard/notes"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            📝 Notes
          </Link>

          <Link
            href="/dashboard/tests"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            🧪 Tests
          </Link>

          <Link
            href="/dashboard/planner"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            📅 Planner
          </Link>

          <Link
            href="/dashboard/calendar"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            🗓 Calendar
          </Link>

          <Link
            href="/dashboard/analytics"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            📊 Analytics
          </Link>

          <Link
            href="/dashboard/settings"
            className="block rounded-xl px-4 py-3 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            ⚙️ Settings
          </Link>

        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-5">

          <button
            onClick={logout}
            className="w-full rounded-xl bg-red-50 py-3 font-semibold text-red-600 transition hover:bg-red-100"
          >
            Logout
          </button>

        </div>

      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {children}
      </main>

    </div>
  );
}