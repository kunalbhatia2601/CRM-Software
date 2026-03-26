"use client";

import Image from "next/image";
import useScrollReveal from "@/hooks/useScrollReveal";

export default function Features() {
  const ref = useScrollReveal();

  return (
    <section id="Features" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-[50px] max-w-[730px] mx-auto">
          <h2 className="reveal text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Unlock Premium Benefits With
            <br />
            Our Advanced Features.
          </h2>
          <p className="reveal text-gray text-[18px] lg:text-[20px] leading-[150%] mt-5 max-w-[488px] mx-auto" style={{ "--delay": "0.15s" }}>
            Unlock premium benefits with advanced features designed to scale.
          </p>
        </div>

        {/* Feature Grid: left column (2/3) + right column (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.5fr] gap-[30px]">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-[30px]">
            {/* Top Row: 2 cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[30px]">
              {/* Smart Task Organization */}
              <div className="reveal bg-light-gray rounded-[20px] p-6 pb-0 overflow-hidden flex flex-col" style={{ "--delay": "0.1s" }}>
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
              <div className="reveal bg-light-gray rounded-[20px] p-6 pb-0 overflow-hidden flex flex-col" style={{ "--delay": "0.2s" }}>
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
            <div className="reveal bg-light-gray rounded-[20px] p-[30px] overflow-hidden relative flex flex-col sm:flex-row gap-6" style={{ "--delay": "0.3s" }}>
              <div className="sm:w-[50%] flex flex-col justify-center z-10">
                <h3 className="text-[20px] lg:text-[24px] font-semibold leading-[120%] tracking-[-0.48px] text-dark mb-2">
                  Real-Time Progress Tracking
                </h3>
                <p className="text-gray text-[16px] leading-[150%]">
                  Track deadlines, milestones, and performance with live status updates and visual indicators.
                </p>
              </div>
              <div className="sm:w-[60%] z-10 flex items-center">
                <div className="bg-white rounded-[20px] p-4 w-full">
                  <Image
                    src="/images/mask-group-3.svg"
                    alt="Progress Tracking"
                    width={300}
                    height={300}
                    className="w-full"
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
              </div>
              <Image
                src="/images/mask-group-1.png"
                alt="Progress Tracking"
                width={1257}
                height={400}
                className="absolute bottom-0 left-0 w-full pointer-events-none opacity-30"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: File & Comment Management (tall card spanning full height) */}
          <div className="reveal bg-light-gray rounded-[20px] p-6 overflow-hidden relative flex flex-col" style={{ "--delay": "0.25s" }}>
            <div className="flex-none mb-6 z-10">
              <h3 className="text-[20px] lg:text-[24px] font-semibold leading-[120%] tracking-[-0.48px] text-dark mb-2">
                File &amp; Comment Management
              </h3>
              <p className="text-gray text-[16px] leading-[150%]">
                Consolidate everything with task comments, file attachments, and feedback threads.
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center z-10">
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
