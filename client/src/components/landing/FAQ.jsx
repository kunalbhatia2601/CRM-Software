"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const faqs = [
  {
    question: "What services do you offer?",
    answer:
      "We provide end-to-end digital solutions including UI/UX design, branding, web design, SaaS product design, and ongoing design support.",
  },
  {
    question: "Who are your services best suited for?",
    answer:
      "You can easily book an appointment through our online booking system, by phone, or by visiting our clinic reception.",
  },
  {
    question: "Do you offer custom solutions?",
    answer:
      "You can easily book an appointment through our online booking system, by phone, or by visiting our clinic reception.",
  },
  {
    question: "What is your typical project timeline?",
    answer:
      "You can easily book an appointment through our online booking system, by phone, or by visiting our clinic reception.",
  },
  {
    question: "How does the collaboration process work?",
    answer:
      "You can easily book an appointment through our online booking system, by phone, or by visiting our clinic reception.",
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);
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

  return (
    <section className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Frequently Asked Questions
          </h2>
          <p className="text-gray text-[18px] lg:text-[20px] leading-[150%] mt-4 max-w-[600px] mx-auto">
            Everything you need to know before getting started. Helping teams move forward with confidence.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-[867px] mx-auto flex flex-col gap-5 animate-on-scroll">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-light-gray rounded-[20px] px-[30px] pb-[30px] relative overflow-hidden cursor-pointer"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            >
              {/* Title */}
              <div className="flex items-center gap-5 pt-[30px]">
                <div className="flex-shrink-0 w-5 h-5 relative">
                  {/* Plus/minus icon */}
                  <span className="absolute top-1/2 left-0 w-full h-[2px] bg-dark -translate-y-1/2" />
                  <span
                    className={`absolute top-0 left-1/2 w-[2px] h-full bg-dark -translate-x-1/2 transition-transform duration-300 ${
                      openIdx === idx ? "rotate-90 opacity-0" : ""
                    }`}
                  />
                </div>
                <h4 className="text-[20px] font-semibold leading-[150%] text-dark">
                  {faq.question}
                </h4>
              </div>

              {/* Answer */}
              <div
                className={`faq-answer ${openIdx === idx ? "open" : ""}`}
                style={{ maxHeight: openIdx === idx ? "500px" : "0px" }}
              >
                <p className="text-gray text-[16px] leading-[150%] pt-3 pl-[41px]">
                  {faq.answer}
                </p>
              </div>

              {/* Decorative corner image */}
              <Image
                src="/images/mask-group.webp"
                alt=""
                width={1963}
                height={400}
                className={`absolute bottom-0 left-0 w-full pointer-events-none transition-opacity duration-300 ${
                  openIdx === idx ? "opacity-20" : "opacity-0"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
