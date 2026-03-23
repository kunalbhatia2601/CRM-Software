"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Smart Task Organization",
    desc: "Create, categorize, and prioritize tasks with ease using flexible lists, boards, and timelines.",
    img: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/696346f458a9dbdaa8d87aee_Mask%20group%20(1).png",
    delay: 0,
  },
  {
    title: "Automated Workflows",
    desc: "Streamline your workflow with automation for tasks, updates, and reminders.",
    img: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/696348cbff60e518c1ce42db_Mask%20group%20(3).png",
    delay: 0.1,
  },
  {
    title: "File & Comment Management",
    desc: "Consolidate everything with task comments, file attachments, and feedback threads.",
    img: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/69676053c11132177372a82f_Group%202087329821.png",
    delay: 0.2,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#F2F6FF]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-[#050529] tracking-tight mb-6 mt-16">
            Unlock Premium Benefits With <br className="hidden md:block" /> Our Advanced Features.
          </h2>
          <p className="text-xl text-[#050529]/70 font-medium">
            Unlock premium benefits with advanced features designed to scale.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: feature.delay }}
              className="bg-[#EAECEF] rounded-[2rem] p-10 flex flex-col items-start gap-4 hover:-translate-y-2 transition-transform duration-500 overflow-hidden transform-gpu relative shadow-sm border border-transparent hover:border-white/50"
            >
              <h3 className="text-2xl font-bold text-[#050529] leading-tight mt-4">{feature.title}</h3>
              <p className="text-[#050529]/70 text-[17px] font-medium leading-relaxed max-w-[90%] z-10">
                {feature.desc}
              </p>
              
              <div className="mt-8 relative w-full flex-grow flex items-end justify-center pointer-events-none">
                <img
                  src={feature.img}
                  alt={feature.title}
                  className="w-full object-cover transform translate-y-4 hover:translate-y-0 transition-transform duration-500 rounded-t-xl shadow-xl border border-white/50"
                  onError={(e) => {
                    // Fallback to a placeholder if link breaks
                    e.target.src = "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/69634907504f28272af29af7_Mask%20group%20(4).png";
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
