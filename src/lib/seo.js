export const SITE_URL = "https://www.dailylifetools.in";
export const SITE_NAME = "Daily Life Tools";
export const DEFAULT_DESCRIPTION =
  "Free, privacy-first productivity and developer tools that run in your browser, including a notepad, Pomodoro timer, JSON formatter, image converter, and habit tracker.";

export function createPageMetadata({ title, description, path, keywords = [] }) {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_IN",
      images: [{
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — private productivity and developer tools`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ["/og-image.png"],
    },
  };
}
