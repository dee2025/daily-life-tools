import HomeButton from "@/components/HomeButton";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const GA_MEASUREMENT_ID = "G-TCJN8HPNWT";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Daily Life Tools — Free Online Productivity Tools",
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "online notepad", "pomodoro timer", "habit tracker", "json formatter",
    "image converter", "developer tools", "productivity tools",
    "privacy-first tools", "free online tools",
  ],
  authors: [{ name: "Deepak Singh" }],
  creator: "Deepak Singh",
  publisher: "Deepak Singh",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Daily Life Tools — Free Private Browser Tools",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Daily Life Tools — private productivity and developer tools",
    }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Life Tools — Free Private Browser Tools",
    description: DEFAULT_DESCRIPTION,
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
  alternates: { canonical: SITE_URL },
  applicationName: SITE_NAME,
  category: "productivity",
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "DailyLifeTools",
  url: `${SITE_URL}/`,
  description: DEFAULT_DESCRIPTION,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <Analytics />
        {children}
        <HomeButton />
      </body>
    </html>
  );
}
