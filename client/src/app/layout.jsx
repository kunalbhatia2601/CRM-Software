import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteData } from "@/actions/site.action";
import { SiteProvider } from "@/context/SiteContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Public origin, used for canonicals, Open Graph and the sitemap.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://crm.totemservices.org";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  const favicon = siteData?.logo || "/logo.svg";
  const description =
    siteData?.description ||
    `${name} — an agency CRM for managing leads, deals, clients, projects, tasks, invoices and team performance in one place.`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: name,
      // Child pages set only their own title; this keeps the brand on the end.
      template: `%s · ${name}`,
    },
    description,
    applicationName: name,
    keywords: [
      "agency CRM", "project management", "client portal", "task management",
      "invoicing", "team performance", "lead management",
    ],
    authors: [{ name: "Kunal Bhatia", url: "https://kunalbhatia.in" }],
    creator: "Kunal Bhatia",
    publisher: name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: name,
      title: name,
      description,
      images: [{ url: favicon, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [favicon],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    icons: { icon: favicon },
  };
}

export default async function RootLayout({ children }) {
  const siteData = await getSiteData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 transition-colors duration-200">
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
          <SiteProvider siteData={siteData}>
            {children}
          </SiteProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
