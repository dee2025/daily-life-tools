import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Free Online Habit Tracker",
  description: "Build better routines with a free monthly habit tracker, daily check-ins, progress charts, and private browser storage. No signup required.",
  path: "/habit-tracker",
  keywords: ["habit tracker", "online habit tracker", "daily habit tracker", "routine tracker"],
});

export default function HabitTrackerLayout({ children }) { return children; }
