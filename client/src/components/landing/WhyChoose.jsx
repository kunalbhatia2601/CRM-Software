"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "40%", desc: "Faster Task Completion and Automated workflows.", hasCorner: true },
  { value: "3×", desc: "Higher Team Alignment and Real-time updates.", hasCorner: false },
  { value: "100%", desc: "Real-Time Insights Across and Track bottlenecks.", hasCorner: true },
  { value: "10k+", desc: "Active Users Startups, agencies growing teams", hasCorner: false },
];

export default function WhyChoose() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(".choose-heading", {
        y: 30, opacity: 0, duration: 0.8,
        scrollTrigger: { trigger: ".choose-heading", start: "top 85%" },
      });
      gsap.from(".choose-subtext", {
        y: 25, opacity: 0, duration: 0.6, delay: 0.2,
        scrollTrigger: { trigger: ".choose-subtext", start: "top 85%" },
      });

      // 3D perspective card reveal
      gsap.from(".stat-card", {
        y: 60,
        opacity: 0,
        rotateX: 15,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: ".stats-grid", start: "top 80%" },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="Choose" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        <div className="text-center mb-[50px] max-w-[730px] mx-auto">
          <h2 className="choose-heading text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Why Teams Choose TaskGo
          </h2>
          <p className="choose-subtext text-gray text-[18px] lg:text-[20px] leading-[150%] mt-5 max-w-[617px] mx-auto">
            Trusted by teams to manage work more efficiently. Designed to help teams do their best work.
          </p>
        </div>

        <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]" style={{ perspective: "50rem" }}>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`stat-card border border-border-1 rounded-[20px] p-[30px] relative overflow-hidden flex flex-col justify-between ${
                idx % 2 !== 0 ? "bg-light-gray" : "bg-white"
              }`}
              style={{ gap: idx % 2 !== 0 ? "109px" : "175px" }}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[40px] font-semibold leading-[120%] tracking-[-0.8px] text-dark">
                    {stat.value}
                  </h3>
                  <Image src="/images/xt2bkip5sqek.svg" alt="" width={40} height={40} className="w-10 h-10" />
                </div>
                <p className="text-gray text-[20px] leading-[150%]">{stat.desc}</p>
              </div>
              {stat.hasCorner && (
                <Image
                  src="/images/mask-group-3.png"
                  alt=""
                  width={614}
                  height={200}
                  className="absolute bottom-0 left-0 w-full pointer-events-none opacity-40"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
