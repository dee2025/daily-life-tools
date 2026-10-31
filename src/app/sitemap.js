import { SITE_URL } from "@/lib/seo";

const routes = [
  { path: "", priority: 1 },
  { path: "/notepad", priority: 0.9 },
  { path: "/pomodoro", priority: 0.9 },
  { path: "/json-converter", priority: 0.9 },
  { path: "/image-converter", priority: 0.9 },
  { path: "/habit-tracker", priority: 0.9 },
];

export default function sitemap() {
  return routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
