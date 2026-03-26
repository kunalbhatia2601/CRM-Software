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

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  // favicon
  const favicon = siteData?.logo || "/logo.svg";
  return {
    title: name,
    description: name,
    icons: {
      icon: favicon,
    },
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
