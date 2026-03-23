"use client";

import { motion } from "framer-motion";

export default function Impact() {
  const stats = [
    {
      number: "40",
      suffix: "%",
      label: "Faster Task Completion and efficiency.",
      delay: 0,
    },
    {
      number: "3",
      suffix: "x",
      label: "Times ROI for modern remote teams.",
      delay: 0.1,
    },
    {
      number: "10",
      suffix: "k+",
      label: "Thousand Active Users achieving goals.",
      delay: 0.2,
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-[#F2F6FF] to-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 mt-16">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-black text-[#050529] tracking-tight mb-6">
            Why Teams Choose TaskGo
          </h2>
          <p className="text-xl text-[#050529]/70 font-medium">
            Trusted by teams to manage work more efficiently. Designed to help teams do their best work.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: stat.delay }}
              className="relative bg-gradient-to-br from-[#EEF2FC] to-white p-10 pt-16 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-end min-h-[300px] overflow-hidden transform-gpu group hover:shadow-xl transition-shadow duration-500"
            >
              {/* Top Right Decoration */}
              <div className="absolute top-8 right-8 w-4 h-4 rounded-full bg-[#5B55F9] border-4 border-[#5B55F9]/20" />
              
              {/* Background Ghost Number */}
              <div className="absolute top-10 left-10 text-[9rem] font-black text-slate-200/50 leading-none select-none mix-blend-multiply group-hover:-translate-y-2 transition-transform duration-500 pointer-events-none">
                {stat.number}
              </div>

              {/* Real Number */}
              <div className="relative z-10 flex items-baseline gap-1 mb-4">
                <span className="text-[5rem] font-black tracking-tighter text-[#050529] leading-none drop-shadow-md">
                  {stat.number}
                  <span className="text-5xl ml-1">{stat.suffix}</span>
                </span>
              </div>

              <p className="relative z-10 text-[#050529]/70 font-medium text-lg leading-snug pr-8">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
