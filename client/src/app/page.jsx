import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import BrandLogos from "@/components/landing/BrandLogos";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import Steps from "@/components/landing/Steps";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Integrations from "@/components/landing/Integrations";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="border border-white">
      <Navbar />
      <Hero />
      <BrandLogos />
      <Features />
      <WhyChoose />
      <Steps />
      <Testimonials />
      <Pricing />
      <Integrations />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}