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
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>

      </div>
    </ProtectedRoute>
  );
}