import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import BrandLogos from "@/components/landing/BrandLogos";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import Steps from "@/components/landing/Steps";
import Testimonials from "@/components/landing/Testimonials";
// import Pricing from "@/components/landing/Pricing";
import Integrations from "@/components/landing/Integrations";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { getSiteData } from "@/actions/site.action";

export default async function Home() {
  const site = await getSiteData();
  const name = site?.name || "TaskGo Agency";
  const description =
    site?.description ||
    `${name} — an agency CRM for managing leads, deals, clients, projects, tasks, invoices and team performance in one place.`;

  return (
    <div className="border border-white">
      <SiteJsonLd siteName={name} logo={site?.logo} description={description} />
      <Navbar />
      <Hero />
      <BrandLogos />
      <Features />
      <WhyChoose />
      <Steps />
      <Testimonials />
      {/* <Pricing /> */}
      <Integrations />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}