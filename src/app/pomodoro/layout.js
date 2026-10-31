import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Free Pomodoro Timer for Focus & Study",
  description: "Use a free online Pomodoro timer with focused work sessions, short breaks, and long breaks. Stay productive without creating an account.",
  path: "/pomodoro",
  keywords: ["pomodoro timer", "focus timer", "study timer", "online pomodoro"],
});

export default function PomodoroLayout({ children }) { return children; }
