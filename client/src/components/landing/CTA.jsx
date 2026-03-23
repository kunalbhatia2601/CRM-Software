"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll(".animate-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section id="CTA" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        <div className="relative rounded-[20px] overflow-hidden bg-dark min-h-[400px] flex items-center justify-center p-8 md:p-16">
          {/* Background decoration */}
          <Image
            src="/images/group-2087329882.svg"
            alt=""
            width={1200}
            height={600}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30"
          />

          {/* Cloud decorations */}
          <Image
            src="/images/cloud-5.webp"
            alt=""
            width={1432}
            height={400}
            className="absolute top-0 left-0 w-full pointer-events-none opacity-20"
          />
          <Image
            src="/images/cloud-6.webp"
            alt=""
            width={1444}
            height={400}
            className="absolute bottom-0 right-0 w-full pointer-events-none opacity-20"
          />

          <div className="relative z-10 text-center max-w-[600px]">
            <h2 className="text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-white animate-on-scroll">
              Let&apos;s create digital
              <br />
              experiences that deliver results.
            </h2>
            <p className="text-white/70 text-[18px] leading-[150%] mt-4 animate-on-scroll">
              Turn your vision into impactful design—faster, clearer, and more effective.
            </p>

            {/* Form */}
            <div className="mt-8 animate-on-scroll">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="flex-1 px-5 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-[16px] outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    className="btn-glow px-8 py-4 bg-primary text-white rounded-full text-[16px] font-medium transition-all duration-300 hover:bg-primary/80"
                  >
                    <span className="relative z-10">Send Request</span>
                  </button>
                </form>
              ) : (
                <div className="bg-white/10 rounded-[12px] p-4">
                  <p className="text-white text-[16px]">Thank you! Your submission has been received!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
