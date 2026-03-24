"use client";

import Image from "next/image";
import useScrollReveal from "@/hooks/useScrollReveal";

const logos = [
  { src: "/images/group-91-1.svg", alt: "Brand 1" },
  { src: "/images/olgwzemj8sys.svg", alt: "Brand 2" },
  { src: "/images/group-92.svg", alt: "Brand 3" },
  { src: "/images/group-94.svg", alt: "Brand 4" },
];

export default function BrandLogos() {
  const ref = useScrollReveal();

  return (
    <div className="max-w-[1350px] mx-auto px-4 overflow-hidden py-10" ref={ref}>
      <div className="flex flex-col items-center">
        <p className="reveal text-[18px] text-gray leading-[150%] text-center">
          Endorsed by the globe&apos;s leading innovative enterprises.
        </p>
        <div className="w-full h-px bg-border-1 mt-4 mb-6" />
      </div>

      {/* Scrolling logos */}
      <div className="relative overflow-hidden">
        <div className="flex animate-scroll-left w-max">
          {[...Array(8)].map((_, setIdx) => (
            <div key={setIdx} className="flex">
              {logos.map((logo, i) => (
                <div
                  key={`${setIdx}-${i}`}
                  className="border border-border-1 rounded-[90px] flex items-center justify-center min-w-[238px] px-[50px] py-[39px] mx-1"
                >
                  <Image src={logo.src} alt={logo.alt} width={120} height={30} className="object-contain" style={{ width: "auto", height: "auto" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
