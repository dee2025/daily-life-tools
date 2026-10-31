import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Free Online Notepad with Tabs & Image Paste",
  description: "Write notes online with multiple tabs, rich text controls, image paste, and local browser storage. Free to use with no account required.",
  path: "/notepad",
  keywords: ["online notepad", "free notepad", "browser notepad", "notes with tabs"],
});

export default function NotepadLayout({ children }) { return children; }
