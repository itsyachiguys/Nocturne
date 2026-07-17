import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nocturne",
    template: "%s | Nocturne",
  },

  description:
    "AI-powered learning platform for students. Upload notes, generate AI summaries, quizzes, flashcards, and track academic progress.",

  keywords: [
    "Nocturne",
    "AI Learning",
    "Student Platform",
    "Notes",
    "Quiz",
    "Education",
  ],

  authors: [
    {
      name: "Nocturne Team",
    },
  ],

  icons: {
    icon: "/Logo.png",
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}