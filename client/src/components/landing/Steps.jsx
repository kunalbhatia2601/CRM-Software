"use client";

import Image from "next/image";
import { useState } from "react";
import useScrollReveal from "@/hooks/useScrollReveal";

const steps = [
  { num: "01", title: "Simple and Fast Setup", desc: "Sales teams powered by AI for top-notch decision-making" },
  { num: "02", title: "Work Together Effortlessly", desc: "Sales teams enhanced by AI for superior decision-making" },
  { num: "03", title: "Monitor Your Progress", desc: "AI-enhanced sales teams for exceptional decision-making." },
];

export default function Steps() {
  const [activeStep, setActiveStep] = useState(0);
  const ref = useScrollReveal();

  return (
    <section id="Why-Choose" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        <div className="text-center mb-[50px] max-w-[800px] mx-auto">
          <h2 className="reveal text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Get Started in Just 3 Easy Steps
          </h2>
          <p className="reveal text-gray text-[18px] lg:text-[20px] leading-[150%] mt-5 max-w-[627px] mx-auto" style={{ "--delay": "0.15s" }}>
            Get started in just 3 easy steps with a guided onboarding experience designed for speed and simplicity.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-[106px] items-center">
          {/* Left - Image */}
          <div className="reveal-scale w-full lg:max-w-[629px] relative rounded-[20px] overflow-hidden">
            <div className="relative">
              <Image
                src="/images/rectangle-34624183.svg"
                alt=""
                width={600}
                height={586}
                className="w-full h-[400px] lg:h-[586px] object-cover rounded-[20px]"
                style={{ width: "auto", height: "auto" }}
              />
              <div className="absolute inset-0">
                <Image
                  src="/images/mask-group-1.webp"
                  alt="Steps preview"
                  width={2004}
                  height={1200}
                  className="w-full h-full object-cover rounded-[20px]"
                />
              </div>
            </div>
          </div>

          {/* Right - Steps Tabs */}
          <div className="flex-1 w-full">
            <div className="flex flex-col gap-0">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`reveal-right text-left rounded-[20px] p-[30px] pb-0 transition-all duration-300 relative overflow-hidden border ${
                    activeStep === idx
                      ? "bg-light-gray border-border-1"
                      : "bg-white border-transparent hover:border-border-1"
                  }`}
                  style={{ "--delay": `${0.1 + idx * 0.12}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-[16px] font-semibold">
                      {step.num}
                    </div>
                    <div className="pb-[30px]">
                      <h4 className="text-[24px] font-semibold leading-[120%] tracking-[-0.48px] text-dark mb-1">
                        {step.title}
                      </h4>
                      <p className="text-gray text-[16px] leading-[150%]">{step.desc}</p>
                    </div>
                  </div>

                  {/* Expandable image */}
                  <div
                    className="overflow-hidden transition-all duration-500"
                    style={{ height: activeStep === idx ? "auto" : "0px", marginTop: activeStep === idx ? "30px" : "0" }}
                  >
                    <Image
                      src="/images/group-2087329837.webp"
                      alt="Step preview"
                      width={2272}
                      height={1200}
                      className="w-full rounded-t-[12px]"
                    />
                  </div>

                  {activeStep === idx && (
                    <Image
                      src="/images/mask-group-4.webp"
                      alt=""
                      width={1881}
                      height={400}
                      className="absolute bottom-0 left-0 w-full pointer-events-none opacity-20"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
