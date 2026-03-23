"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Hero() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      tl.from(".hero-title", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      })
        .from(
          ".hero-subtext",
          { y: 25, opacity: 0, duration: 0.6 },
          "-=0.4"
        )
        .from(
          ".hero-buttons",
          { y: 25, opacity: 0, duration: 0.6 },
          "-=0.3"
        )
        .from(
          ".hero-dashboard",
          { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" },
          "-=0.3"
        )
        .from(
          ".hero-bubble",
          {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            stagger: 0.15,
            ease: "back.out(1.7)",
          },
          "-=0.3"
        );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="pt-0 overflow-hidden" ref={sectionRef}>
      <div
        className="rounded-[20px] bg-cover bg-center bg-no-repeat min-h-[700px] lg:min-h-[1027px] overflow-hidden relative"
        style={{ backgroundImage: "url('/images/group-2087329803.svg')" }}
      >
        {/* Cloud decorations */}
        <Image
          src="/images/cloud-2.webp"
          alt=""
          width={1644}
          height={400}
          className="absolute top-0 left-0 w-full pointer-events-none opacity-60"
          style={{ height: "auto" }}
          priority
        />
        <Image
          src="/images/cloud-3.svg"
          alt=""
          width={400}
          height={200}
          className="absolute top-[10%] right-0 pointer-events-none opacity-40"
          style={{ height: "auto" }}
        />

        <div className="max-w-[1350px] mx-auto px-4 pt-[140px] lg:pt-[188px] relative z-10">
          <div className="text-center">
            {/* Hero Title */}
            <h1 className="hero-title text-[40px] md:text-[56px] lg:text-[72px] font-semibold leading-[110%] tracking-[-1.44px] text-dark max-w-[855px] mx-auto">
              Simplify Task Management Boost Productivity
            </h1>

            {/* Subtitle */}
            <p className="hero-subtext text-gray text-[18px] lg:text-[20px] leading-[150%] mt-4 max-w-[500px] mx-auto">
              Easily manage tasks and enhance productivity from start to finish.
            </p>

            {/* Buttons */}
            <div className="hero-buttons flex flex-wrap justify-center gap-5 mt-9">
              <Link
                href="#CTA"
                className="btn-glow relative inline-flex items-center justify-center px-8 py-4 bg-dark text-white text-[18px] rounded-full transition-all duration-300 hover:bg-primary"
              >
                <span className="relative z-10">Get Started Free</span>
              </Link>
              <Link
                href="#CTA"
                className="btn-glow relative inline-flex items-center justify-center px-8 py-4 border border-border-1 text-dark text-[18px] rounded-full transition-all duration-300 hover:bg-light-gray bg-white/50 backdrop-blur-sm"
              >
                <span className="relative z-10">Book a Demo</span>
              </Link>
            </div>

            {/* Hero Dashboard Image */}
            <div className="hero-dashboard mt-[63px] relative max-w-[1100px] mx-auto">
              <Image
                src="/images/group-2087329893.svg"
                alt="TaskGo Dashboard"
                width={1100}
                height={700}
                className="w-full relative z-[1]"
                style={{ height: "auto" }}
                priority
              />

              {/* Floating bubble icons */}
              <Image
                src="/images/frame-36.svg"
                alt=""
                width={60}
                height={60}
                className="hero-bubble absolute top-[10%] left-[5%] hidden lg:block animate-[bounce_3s_ease-in-out_infinite]"
                style={{ width: "auto", height: "auto" }}
              />
              <Image
                src="/images/frame-38.svg"
                alt=""
                width={60}
                height={60}
                className="hero-bubble absolute top-[20%] right-[8%] hidden lg:block animate-[bounce_4s_ease-in-out_infinite_0.5s]"
                style={{ width: "auto", height: "auto" }}
              />
              <Image
                src="/images/frame-37.svg"
                alt=""
                width={60}
                height={60}
                className="hero-bubble absolute bottom-[30%] left-[2%] hidden lg:block animate-[bounce_3.5s_ease-in-out_infinite_1s]"
                style={{ width: "auto", height: "auto" }}
              />
              <Image
                src="/images/frame-35.svg"
                alt=""
                width={60}
                height={60}
                className="hero-bubble absolute bottom-[20%] right-[3%] hidden lg:block animate-[bounce_4.5s_ease-in-out_infinite_1.5s]"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
