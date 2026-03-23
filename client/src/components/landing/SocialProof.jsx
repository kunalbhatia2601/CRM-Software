"use client";

import { motion } from "framer-motion";

export default function SocialProof() {
  const logos = [
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d683f247e0cf44c83f3e_Logo.svg",
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d68307e872060ce4cd69_Logo%20(1).svg",
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d6831d391483889aee7e_Logo%20(2).svg",
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d6831e23501257c11779_Vector%20(2).svg",
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d68325152323f357bc8a_Vector.svg",
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d68338a9f48332a168fa_Group%201000001016.svg",
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d6837133a4bcfb578aa3_Vector%20(1).svg",
    "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d683a800962f3d5ae694_Logo%20(3).svg",
  ];

  // We duplicate the logos array to create a seamless infinite loop
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <section className="py-12 bg-white overflow-hidden relative border-t border-b border-slate-100">
      <div className="container mx-auto px-6 mb-8 text-center">
        <p className="text-lg text-[#050529]/60 font-medium">
          Trusted by 5,000+ leading innovative enterprises.
        </p>
      </div>
      
      {/* Logos Marquee */}
      <div className="relative w-full flex overflow-hidden mask-image-marquee">
        <motion.div
          animate={{ x: [0, -2000] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
          className="flex items-center gap-16 md:gap-24 w-max px-4"
        >
          {duplicatedLogos.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt="Partner Logo"
              className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 filter"
            />
          ))}
        </motion.div>
      </div>

    </section>
  );
}
