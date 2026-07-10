import { Sidebar } from "@/components/Sidebar";

// Every /dashboard/* route mounts inside this layout, so the sidebar
// persists across navigation instead of being re-declared per page.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-8 py-6">{children}</main>
    </div>
  );
}
