import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import Features from "@/components/landing/Features";
import Impact from "@/components/landing/Impact";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Integrations from "@/components/landing/Integrations";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default async function LandingPage() {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
  let siteData = null;
  
  try {
    const res = await fetch(`${serverUrl}/api/site`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success) {
      siteData = json.data;
    }
  } catch (error) {
    console.error("Failed to fetch site data:", error);
  }

  // Fallback data
  const data = siteData || {
    name: "OmniCore Agency Suite",
    logo: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/696cf4b5e9833d99ee28dae7_625443c1a98275c71d382d31635332d4_TaskGo.svg",
    contactEmail: null,
    contactPhone: null,
  };

  return (
    <div className="relative min-h-screen bg-white text-[#050529] font-sans selection:bg-[#5B55F9] selection:text-white overflow-x-hidden">
      
      {/* Global Background (Clouds + Purple Gradients matching the target) */}
      <div className="fixed inset-0 -z-50 pointer-events-none bg-gradient-to-b from-[#F2F6FF] via-[#F4EBFF] to-white" />
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vh] bg-[#E0E7FE] rounded-full blur-[120px] -z-40 pointer-events-none" />
      <div className="fixed top-[10%] right-[-10%] w-[50vw] h-[50vh] bg-[#F3E8FF] rounded-full blur-[140px] -z-40 pointer-events-none" />

      <Navbar siteData={data} />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Impact />
        <HowItWorks />
        <Integrations />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer siteData={data} />
    </div>
  );
}
