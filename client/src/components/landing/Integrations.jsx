"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSite } from "@/context/SiteContext";

const innerIcons = [
  { src: "/images/gx0l9noslpoo.svg", pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
  { src: "/images/logo-1.svg", pos: "top-[15%] right-0 translate-x-1/2" },
  { src: "/images/vector-2-2.svg", pos: "bottom-[15%] right-0 translate-x-1/2" },
  { src: "/images/logo-3.svg", pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
];

const outerIcons = [
  { src: "/images/group-1000001016.svg", pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
  { src: "/images/logo-2.svg", pos: "top-[15%] left-0 -translate-x-1/2" },
  { src: "/images/vector-1.svg", pos: "bottom-[15%] left-0 -translate-x-1/2" },
  { src: "/images/flncqldfxpbo.svg", pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
];

export default function Integrations() {
  const ref = useRef(null);
  const site = useSite();

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
        <div className="text-center mb-16">
          <h2 className="text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Effortless Tool Integrations
          </h2>
          <p className="text-gray text-[18px] lg:text-[20px] leading-[150%] mt-4 max-w-[600px] mx-auto animate-on-scroll">
            Add or remove integrations as your needs grow, without slowing down performance.
          </p>
        </div>

        {/* Orbiting icons */}
        <div className="flex justify-center animate-on-scroll">
          <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px]">
            {/* Background shape */}
            <Image
              src="/images/group-2087329898.svg"
              alt=""
              width={550}
              height={550}
              className="absolute inset-0 w-full h-full"
            />

            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Image
                src="/images/frame-55.svg"
                alt={site.name}
                width={80}
                height={80}
                className="w-[50px] md:w-[70px] lg:w-[80px]"
                style={{ width: "auto", height: "auto" }}
              />
            </div>

            {/* Inner orbit */}
            <div className="absolute inset-[15%] orbit-container">
              {innerIcons.map((icon, i) => (
                <div key={i} className={`absolute ${icon.pos}`}>
                  <div className="counter-rotate bg-white rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shadow-lg border border-border-1">
                    <Image src={icon.src} alt="" width={32} height={32} className="w-6 h-6 md:w-8 md:h-8" style={{ width: "auto", height: "auto" }} />
                  </div>
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl -z-10" />
                </div>
              ))}
            </div>

            {/* Outer orbit */}
            <div className="absolute inset-0 orbit-container-reverse">
              {outerIcons.map((icon, i) => (
                <div key={i} className={`absolute ${icon.pos}`}>
                  <div className="counter-rotate-reverse bg-white rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shadow-lg border border-border-1">
                    <Image src={icon.src} alt="" width={32} height={32} className="w-6 h-6 md:w-8 md:h-8" style={{ width: "auto", height: "auto" }} />
                  </div>
                  <div className="absolute inset-0 bg-light-sky/20 rounded-full blur-xl -z-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
