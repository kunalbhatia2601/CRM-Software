"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Features() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Animate heading
      gsap.from(".features-heading", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: ".features-heading",
          start: "top 85%",
        },
      });

      gsap.from(".features-subtext", {
        y: 25,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        scrollTrigger: {
          trigger: ".features-subtext",
          start: "top 85%",
        },
      });

      // Stagger feature cards
      gsap.from(".feature-card", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        scrollTrigger: {
          trigger: ".feature-grid",
          start: "top 80%",
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="Features" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-[50px] max-w-[730px] mx-auto">
          <h2 className="features-heading text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Unlock Premium Benefits With
            <br />
            Our Advanced Features.
          </h2>
          <p className="features-subtext text-gray text-[18px] lg:text-[20px] leading-[150%] mt-5 max-w-[488px] mx-auto">
            Unlock premium benefits with advanced features designed to scale.
          </p>
        </div>

        {/* Feature Grid: left column (2/3) + right column (1/3) */}
        <div className="feature-grid grid grid-cols-1 lg:grid-cols-[1fr_0.5fr] gap-[30px]">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-[30px]">
            {/* Top Row: 2 cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[30px]">
              {/* Smart Task Organization */}
              <div className="feature-card bg-light-gray rounded-[20px] p-6 pb-0 overflow-hidden flex flex-col">
                <div className="flex-none mb-4">
                  <h3 className="text-[20px] lg:text-[24px] font-semibold leading-[120%] tracking-[-0.48px] text-dark mb-2">
                    Smart Task Organization
                  </h3>
                  <p className="text-gray text-[16px] leading-[150%]">
                    Create, categorize, and prioritize tasks with ease using flexible lists, boards, and timelines.
                  </p>
                </div>
                <div className="flex-1 flex items-end">
                  <Image
                    src="/images/group-2087329807.png"
                    alt="Smart Task Organization"
                    width={768}
                    height={500}
                    className="w-full rounded-t-[20px] object-cover"
                  />
                </div>
              </div>

              {/* Automated Workflows */}
              <div className="feature-card bg-light-gray rounded-[20px] p-6 pb-0 overflow-hidden flex flex-col">
                <div className="flex-none mb-4">
                  <h3 className="text-[20px] lg:text-[24px] font-semibold leading-[120%] tracking-[-0.48px] text-dark mb-2">
                    Automated Workflows
                  </h3>
                  <p className="text-gray text-[16px] leading-[150%]">
                    Streamline your workflow with automation for tasks, updates, and reminders.
                  </p>
                </div>
                <div className="flex-1 flex items-end">
                  <Image
                    src="/images/group-2087329821.png"
                    alt="Automated Workflows"
                    width={768}
                    height={500}
                    className="w-full rounded-t-[20px] object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Bottom: Real-Time Progress Tracking (full width of left column) */}
            <div className="feature-card bg-light-gray rounded-[20px] p-[30px] overflow-hidden relative flex flex-col sm:flex-row gap-6">
              <div className="sm:w-[40%] flex flex-col justify-center z-[1]">
                <h3 className="text-[20px] lg:text-[24px] font-semibold leading-[120%] tracking-[-0.48px] text-dark mb-2">
                  Real-Time Progress Tracking
                </h3>
                <p className="text-gray text-[16px] leading-[150%]">
                  Track deadlines, milestones, and performance with live status updates and visual indicators.
                </p>
              </div>
              <div className="sm:w-[60%] z-[1] flex items-center">
                <div className="bg-white rounded-[20px] p-4 w-full">
                  <Image
                    src="/images/mask-group-3.svg"
                    alt="Progress Tracking"
                    width={600}
                    height={300}
                    className="w-full"
                  />
                </div>
              </div>
              <Image
                src="/images/mask-group-1.png"
                alt=""
                width={1257}
                height={400}
                className="absolute bottom-0 left-0 w-full pointer-events-none opacity-30"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: File & Comment Management (tall card spanning full height) */}
          <div className="feature-card bg-light-gray rounded-[20px] p-6 overflow-hidden relative flex flex-col">
            <div className="flex-none mb-6 z-[1]">
              <h3 className="text-[20px] lg:text-[24px] font-semibold leading-[120%] tracking-[-0.48px] text-dark mb-2">
                File &amp; Comment Management
              </h3>
              <p className="text-gray text-[16px] leading-[150%]">
                Consolidate everything with task comments, file attachments, and feedback threads.
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center z-[1]">
              <div className="bg-white rounded-[20px] p-4 lg:p-[25px_25px_66px]">
                <Image
                  src="/images/group-2087329809.webp"
                  alt="File Management"
                  width={333}
                  height={600}
                  className="w-full max-w-[333px] object-cover mx-auto"
                />
              </div>
            </div>
            <Image
              src="/images/mask-group-1.png"
              alt=""
              width={1257}
              height={400}
              className="absolute bottom-0 left-0 w-full pointer-events-none opacity-30"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
