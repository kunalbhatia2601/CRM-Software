"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  "Access to core features",
  "Faster turnaround time",
  "Standard design support",
  "Everything in Starter",
  "Standard design support",
  "Automation & workflow",
  "Email support",
  "Premium integrations",
];

const plans = {
  monthly: [
    { name: "Starter Plan", price: "$49", popular: false },
    { name: "Professional Plan", price: "$99", popular: true },
  ],
  yearly: [
    { name: "Starter Plan", price: "$29", popular: false },
    { name: "Professional Plan", price: "$89", popular: true },
  ],
};

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(".pricing-heading", {
        y: 30, opacity: 0, duration: 0.8,
        scrollTrigger: { trigger: ".pricing-heading", start: "top 85%" },
      });
      gsap.from(".pricing-subtext", {
        y: 25, opacity: 0, duration: 0.6, delay: 0.2,
        scrollTrigger: { trigger: ".pricing-subtext", start: "top 85%" },
      });
      gsap.from(".pricing-toggle", {
        y: 25, opacity: 0, duration: 0.5,
        scrollTrigger: { trigger: ".pricing-toggle", start: "top 85%" },
      });
      gsap.from(".pricing-card", {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.2,
        scrollTrigger: { trigger: ".pricing-grid", start: "top 80%" },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const currentPlans = plans[billing];

  return (
    <section id="Pricing" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="pricing-heading text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Flexible Pricing For Every Team
          </h2>
          <p className="pricing-subtext text-gray text-[18px] lg:text-[20px] leading-[150%] mt-4 max-w-[660px] mx-auto">
            Choose a plan that fits your needs—whether you&apos;re just getting started or managing complex projects at scale.
          </p>
        </div>

        {/* Toggle */}
        <div className="pricing-toggle flex justify-center mb-10">
          <div className="inline-flex bg-light-gray rounded-full p-1 border border-border-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2.5 rounded-full text-[16px] font-medium transition-all duration-300 ${
                billing === "monthly"
                  ? "bg-dark text-white shadow-md"
                  : "text-gray hover:text-dark"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-2.5 rounded-full text-[16px] font-medium transition-all duration-300 ${
                billing === "yearly"
                  ? "bg-dark text-white shadow-md"
                  : "text-gray hover:text-dark"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-grid grid grid-cols-1 md:grid-cols-2 gap-[30px] max-w-[900px] mx-auto">
          {currentPlans.map((plan, idx) => (
            <div
              key={`${billing}-${idx}`}
              className="pricing-card bg-light-gray border border-border-1 rounded-[20px] p-[30px] relative overflow-hidden flex flex-col"
            >
              {/* Plan Title */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-[24px] font-semibold text-dark">{plan.name}</h3>
                    {plan.popular && (
                      <span className="bg-primary text-white text-[16px] px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="text-gray text-[16px] leading-[150%] mt-1">
                    Perfect for individuals and small teams.
                  </p>
                </div>
              </div>

              {/* Price */}
              <h3 className="text-[40px] font-semibold text-dark mb-6">
                {plan.price}{" "}
                <span className="text-[16px] font-normal leading-[150%] tracking-normal">
                  / Per Hour
                </span>
              </h3>

              {/* Features */}
              <div className="bg-white rounded-[20px] p-5 flex-1">
                <h4 className="text-[20px] font-semibold text-dark mb-5">Features Included</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-[90px] gap-y-4">
                  {features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <Image
                        src="/images/yayv7awsfftw.svg"
                        alt="check"
                        width={20}
                        height={20}
                        className="w-5 h-5 flex-shrink-0"
                      />
                      <span className="text-gray text-[16px]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button */}
              <div className="mt-6">
                <Link
                  href="#CTA"
                  className="btn-glow relative w-full inline-flex items-center justify-center px-8 py-4 bg-dark text-white text-[18px] rounded-full transition-all duration-300 hover:bg-primary"
                >
                  <span className="relative z-10">Get Started Free</span>
                </Link>
              </div>

              {/* Corner overlay for popular plan */}
              {plan.popular && (
                <Image
                  src="/images/mask-group-1-2.svg"
                  alt=""
                  width={400}
                  height={400}
                  className="absolute bottom-0 right-0 pointer-events-none opacity-30"
                  style={{ height: "auto" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
