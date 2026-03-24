"use client";

import Image from "next/image";
import { useState } from "react";
import useScrollReveal from "@/hooks/useScrollReveal";

const testimonials = [
  {
    text: "The team delivered exceptional design quality with a clear understanding of our business goals. The final product exceeded expectations and improved user engagement significantly.",
    name: "Milla Ass",
    role: "Marketer",
    rating: "4.9 out of 5.0",
    large: true,
  },
  {
    text: "From concept to execution, everything was handled with precision. Our conversion rate noticeably after launch.",
    name: "Robert Fox",
    role: "Marketer",
    rating: null,
    large: false,
  },
  {
    text: "They transformed our ideas into a clean, modern digital experience. Communication was smooth.",
    name: "Esther Howard",
    role: "Marketer",
    rating: null,
    large: false,
  },
  {
    text: "A reliable partner who truly understands design strategy. Their attention to detail and structured workflow made a real difference. Outstanding UI/UX work.",
    name: "Josh Biler",
    role: "Marketer",
    rating: "4.9 out of 5.0",
    large: true,
  },
];

const sliderTestimonials = [
  [
    {
      text: "The team delivered exceptional design quality with a clear understanding of our business goals.",
      name: "Milla Ass",
      role: "Marketer",
      rating: "4.9 out of 5.0",
    },
    {
      text: "From concept to execution, everything was handled with precision.",
      name: "Robert Fox",
      role: "Marketer",
      rating: null,
    },
  ],
  [
    {
      text: "Reliable, detail-driven partner delivering intuitive, scalable UI/UX aligned with user needs.",
      name: "Assh Onr",
      role: "Marketer",
      rating: "4.9 out of 5.0",
    },
    {
      text: "Handled every stage with precision, from concept to execution.",
      name: "Raj Dip",
      role: "Marketer",
      rating: null,
    },
  ],
  [
    {
      text: "They transformed our ideas into a clean, modern digital experience. Communication was smooth.",
      name: "Luner Fox",
      role: "Marketer",
      rating: "4.9 out of 5.0",
    },
    {
      text: "High-quality design that exceeded expectations and boosted user engagement.",
      name: "Feth Mil",
      role: "Marketer",
      rating: null,
    },
  ],
];

function Stars() {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Image key={i} src="/images/sgwkas6pcbqw.svg" alt="star" width={17} height={17} style={{ width: "auto", height: "auto" }} />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [activeSlide, setActiveSlide] = useState(0);
  const ref = useScrollReveal();

  return (
    <section id="Testimonial" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="reveal text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Real Results, Real Impact.
            <br />
            Our Success Stories
          </h2>
          <p className="reveal text-gray text-[18px] lg:text-[20px] leading-[150%] mt-4 max-w-[542px] mx-auto" style={{ "--delay": "0.15s" }}>
            Real-world success stories showcasing growth, performance, and productivity improvements.
          </p>
        </div>

        {/* Desktop Layout - bento grid */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-[30px]">
            {/* Column 1: large card + small card */}
            <div className="flex flex-col gap-[30px]">
              {/* Large testimonial */}
              <div className="reveal bg-light-gray border border-border-1 rounded-[20px] p-[30px] relative overflow-hidden flex-1" style={{ "--delay": "0.1s" }}>
                <p className="text-gray text-[16px] leading-[150%] mb-6">
                  {testimonials[0].text}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[20px] font-semibold text-dark">{testimonials[0].name}</h3>
                    <span className="text-gray text-[14px]">{testimonials[0].role}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Stars />
                    <span className="text-gray text-[14px]">{testimonials[0].rating}</span>
                  </div>
                </div>
              </div>
              {/* Small card */}
              <div className="reveal bg-light-gray border border-border-1 rounded-[20px] p-[30px] relative overflow-hidden" style={{ "--delay": "0.2s" }}>
                <p className="text-gray text-[16px] leading-[150%] mb-4">
                  {testimonials[1].text}
                </p>
                <div>
                  <h4 className="text-[18px] font-semibold text-dark">{testimonials[1].name}</h4>
                  <span className="text-gray text-[14px]">{testimonials[1].role}</span>
                </div>
                <Image
                  src="/images/mask-group-1.png"
                  alt=""
                  width={1257}
                  height={300}
                  className="absolute bottom-0 left-0 w-full pointer-events-none opacity-20"
                />
              </div>
            </div>

            {/* Column 2: client image + small card */}
            <div className="flex flex-col gap-[30px]">
              <div className="reveal bg-light-gray border border-border-1 rounded-[20px] p-8 flex items-center justify-center flex-1" style={{ "--delay": "0.15s" }}>
                <Image
                  src="/images/mask-group.svg"
                  alt="Client"
                  width={300}
                  height={300}
                  className="w-full max-w-[250px]"
                />
              </div>
              <div className="reveal bg-light-gray border border-border-1 rounded-[20px] p-[30px] relative overflow-hidden" style={{ "--delay": "0.25s" }}>
                <p className="text-gray text-[16px] leading-[150%] mb-4">
                  {testimonials[2].text}
                </p>
                <div>
                  <h5 className="text-[18px] font-semibold text-dark">{testimonials[2].name}</h5>
                  <span className="text-gray text-[14px]">{testimonials[2].role}</span>
                </div>
                <Image
                  src="/images/mask-group-1.png"
                  alt=""
                  width={1257}
                  height={300}
                  className="absolute bottom-0 left-0 w-full pointer-events-none opacity-20"
                />
              </div>
            </div>

            {/* Column 3: client image + big review */}
            <div className="flex flex-col gap-[30px]">
              <div className="reveal bg-light-gray border border-border-1 rounded-[20px] p-8 flex items-center justify-center" style={{ "--delay": "0.2s" }}>
                <Image
                  src="/images/mask-group-1.svg"
                  alt="Client"
                  width={300}
                  height={300}
                  className="w-full max-w-[250px]"
                />
              </div>
              <div className="reveal bg-light-gray border border-border-1 rounded-[20px] p-[30px] relative overflow-hidden flex-1" style={{ "--delay": "0.3s" }}>
                <p className="text-gray text-[16px] leading-[150%] mb-6">
                  {testimonials[3].text}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-[18px] font-semibold text-dark">{testimonials[3].name}</h5>
                    <span className="text-gray text-[14px]">{testimonials[3].role}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Stars />
                    <span className="text-gray text-[14px]">{testimonials[3].rating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Slider */}
        <div className="lg:hidden">
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {sliderTestimonials.map((slide, slideIdx) => (
                <div key={slideIdx} className="min-w-full px-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {slide.map((t, tIdx) => (
                      <div
                        key={tIdx}
                        className="bg-light-gray border border-border-1 rounded-[20px] p-6 relative overflow-hidden"
                      >
                        <p className="text-gray text-[16px] leading-[150%] mb-4">{t.text}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-[18px] font-semibold text-dark">{t.name}</h5>
                            <span className="text-gray text-[14px]">{t.role}</span>
                          </div>
                          {t.rating && (
                            <div className="flex flex-col items-end gap-1">
                              <Stars />
                              <span className="text-gray text-[14px]">{t.rating}</span>
                            </div>
                          )}
                        </div>
                        <Image
                          src="/images/mask-group-1.png"
                          alt=""
                          width={1257}
                          height={300}
                          className="absolute bottom-0 left-0 w-full pointer-events-none opacity-20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slider controls */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setActiveSlide((p) => (p > 0 ? p - 1 : sliderTestimonials.length - 1))}
              className="w-10 h-10 rounded-full border border-border-1 flex items-center justify-center hover:bg-light-gray transition-colors"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              {sliderTestimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    activeSlide === i ? "bg-primary" : "bg-border-1"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveSlide((p) => (p < sliderTestimonials.length - 1 ? p + 1 : 0))}
              className="w-10 h-10 rounded-full border border-border-1 flex items-center justify-center hover:bg-light-gray transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
