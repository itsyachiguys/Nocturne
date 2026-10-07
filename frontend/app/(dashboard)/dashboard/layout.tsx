"use client";

import { ReactNode } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      {/*
        Pinned to the viewport with `fixed inset-0` instead of `h-screen`.
        100vh can be taller than the visible area (browser chrome, zoom, mobile bars),
        which is what pushed the panels against the top edge. `inset-0` always matches
        the real viewport, so `p-4` gives the same gap on top, bottom, left and right.
      */}
      <div className="fixed inset-0 flex gap-4 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-lavender/10 p-3 dark:from-slate-950 dark:via-slate-950 dark:to-lavender/10 sm:p-4">
        {/* Ambient colour glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-lavender/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-sky/15 blur-3xl"
        />

        {/*
          Sidebar slot. The wrapper fixes the height to the padded area and forces the
          Sidebar root to fill it, so a stray h-screen / sticky / mt-* inside Sidebar
          can no longer shift it up or down.
        */}
        <div className="relative h-full shrink-0 [&>*]:!h-full [&>*]:!max-h-full">
          <Sidebar />
        </div>

        {/* Main content: floating glass panel. Only this area scrolls. */}
        <main className="relative h-full min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-3xl border border-line bg-white/60 backdrop-blur-xl dark:border-line-dark dark:bg-slate-900/40 [scrollbar-gutter:stable] [scrollbar-width:thin]">
          <div className="p-6 sm:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}