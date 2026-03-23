"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Simple and Fast Setup",
      desc: "Sales teams powered by AI for top-notch decision-making",
    },
    {
      num: "02",
      title: "Work Together Effortlessly",
      desc: "Sales teams enhanced by AI for superior decision-making",
    },
    {
      num: "03",
      title: "Monitor Your Progress",
      desc: "AI-enhanced sales teams for exceptional decision-making.",
    },
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-[#050529] tracking-tight mb-6">
            Get Started in Just 3 Easy Steps
          </h2>
          <p className="text-xl text-[#050529]/70 font-medium max-w-2xl mx-auto">
            Get started in just 3 easy steps with a guided onboarding experience designed for speed and simplicity.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side Visual: Purple Card with Mac Window */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#5B55F9] rounded-[2.5rem] p-10 pb-0 overflow-hidden transform-gpu relative shadow-2xl h-[500px]"
          >
            {/* The Mac Window Representation */}
            <div className="bg-[#FAFBFD] rounded-t-2xl shadow-xl border border-white/20 w-full h-[600px] mt-8 overflow-hidden transform-gpu group-hover:-translate-y-2 transition-transform duration-700">
              <img 
                src="https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/69634907504f28272af29af7_Mask%20group%20(4).png"
                alt="Task Boards App UI" 
                className="w-full h-auto object-cover opacity-90 object-left-top scale-110 origin-top-left ml-4 mt-6 rounded-tl-xl border border-slate-200"
              />
            </div>
          </motion.div>

          {/* Right Side: Step Cards container */}
          <div className="flex flex-col gap-6">
            
            {/* Active Step Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-[#F0F4FF] to-white rounded-3xl p-8 border border-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                <div className="shrink-0 w-14 h-14 bg-[#5B55F9] text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-[#5B55F9]/30">
                  {steps[0].num}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#050529] mb-2">{steps[0].title}</h3>
                  <p className="text-[#050529]/70 text-lg font-medium">{steps[0].desc}</p>
                </div>
              </div>

              {/* Inner Mockup Image inside step 1 */}
              <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/60">
                <img 
                  src="https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/696348cbff60e518c1ce42db_Mask%20group%20(3).png" 
                  alt="Sign in Mockup" 
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            </motion.div>

            {/* Inactive Step Cards */}
            {steps.slice(1).map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * (idx + 1) }}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:bg-slate-50 cursor-pointer flex items-center gap-6"
              >
                <div className="shrink-0 w-14 h-14 bg-[#5B55F9] text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-[#5B55F9]/30">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#050529] mb-2">{step.title}</h3>
                  <p className="text-[#050529]/70 text-lg font-medium">{step.desc}</p>
                </div>
              </motion.div>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}
