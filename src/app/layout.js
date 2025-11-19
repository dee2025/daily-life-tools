import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import HomeButton from "@/components/HomeButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Daily Life Tools – Notepad, Productivity Apps & Developer Utilities",
  description:
    "A privacy-first collection of tools including Notepad, Pomodoro Timer, Todo Manager, Habit Tracker, JSON Formatter, Regex Tester and more — no login, no signup, no cloud. Your data stays in your browser only.",

  keywords: [
    "notepad",
    "online notepad",
    "pomodoro timer",
    "todo app",
    "habit tracker",
    "kanban board",
    "json formatter",
    "regex tester",
    "text formatter",
    "image compressor",
    "developer tools",
    "productivity tools",
    "local tools",
    "privacy based tools",
    "daily life tools",
    "no login tools",
    "browser based tools",
    "free online tools",
  ],

  authors: [{ name: "Deepak Singh" }],
  creator: "Deepak Singh",
  publisher: "Deepak Singh",

  metadataBase: new URL("https://daily-life-tools.vercel.app"),

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "Daily Life Tools – Privacy First Productivity & Developer Toolkit",
    description:
      "Premium tools like Notepad, Pomodoro Timer, JSON Formatter, Todo App, and more. 100% offline. No account required. Your data stays in your browser.",
    url: "https://daily-life-tools.vercel.app",
    siteName: "Daily Life Tools",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Daily Life Tools - Premium Productivity Toolset",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Daily Life Tools – Premium Offline Productivity Tools",
    description:
      "Use Notepad, Pomodoro Timer, JSON Formatter & more with total privacy. No signup, no data collection.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "https://daily-life-tools.vercel.app",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

       <HomeButton />
      </body>
    </html>
  );
}
