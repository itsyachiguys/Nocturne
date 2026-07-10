import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Nocturne — Your AI powered student operating system",
  description:
    "Manage academics, generate AI notes and quizzes, track attendance, and plan your entire student life from one workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} font-body bg-surface-bg text-ink-primary dark:bg-surface-bg-dark dark:text-ink-primary-dark transition-colors`}
      >
        {children}
      </body>
    </html>
  );
}
