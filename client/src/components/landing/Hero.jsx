"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 90, damping: 20 },
    },
  };

  return (
    <section className="relative pt-[180px] pb-24 md:pt-[220px] md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center">
      
      {/* Cloud Decorative Images mimicking the template */}
      <img src="https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/695ca66e9532a5b11136ac59_%E2%80%94Pngtree%E2%80%94white%20cloud%20hd%20transparent%20png_3595697%205-p-1080.webp" 
           alt="Cloud" className="absolute top-[15%] left-[-5%] w-[40vw] max-w-[600px] opacity-60 pointer-events-none -z-10 mix-blend-overlay scale-125" />
      <img src="https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/695ca6903e32e45e6ded5d94_%E2%80%94Pngtree%E2%80%94white%20cloud%20hd%20transparent%20png_3595697%206-p-1080.webp" 
           alt="Cloud" className="absolute top-[30%] right-[-10%] w-[50vw] max-w-[700px] opacity-60 pointer-events-none -z-10 mix-blend-overlay scale-125" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-[1000px] mx-auto text-center relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-[3.5rem] md:text-[6.5rem] font-black tracking-[-0.04em] text-[#050529] leading-[1.05] mb-8 mx-auto max-w-[900px]"
          >
            Simplify Task Management <br className="hidden md:block" />
            Boost Productivity
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl text-[#050529]/70 mb-12 max-w-2xl mx-auto font-medium"
          >
            Easily Manage Tasks And Enhance Productivity From Start To Finish.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24 relative z-20"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-[#5B55F9] hover:bg-[#4338CA] text-white font-semibold rounded-full transition-all text-lg shadow-[0_10px_40px_rgba(91,85,249,0.3)] hover:-translate-y-1"
            >
              Get Started Free
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-black/5 text-[#050529] font-semibold rounded-full border border-[#050529] transition-all text-lg"
            >
              Book A Demo
            </Link>
          </motion.div>

          {/* Floating Avatar 1 -> Analysist */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0, y: [0, -15, 0] }}
            transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut" }, opacity: { delay: 0.8 }, x: { type: "spring" } }}
            className="hidden lg:flex absolute top-[60%] left-[8%] bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg items-center gap-3 z-30 border border-white"
          >
            <div className="w-4 h-4 rounded-full bg-[#5B55F9]" />
            <span className="text-base font-semibold text-[#050529]">Analysist</span>
          </motion.div>

          {/* Floating Avatar 2 -> Programmer */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0, y: [0, 15, 0] }}
            transition={{ y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }, opacity: { delay: 1 }, x: { type: "spring" } }}
            className="hidden lg:flex absolute top-[60%] right-[8%] bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg items-center gap-3 z-30 border border-white"
          >
            <div className="w-4 h-4 rounded-full bg-[#3B82F6]" />
            <span className="text-base font-semibold text-[#050529]">Programmer</span>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup Video/Image */}
        <motion.div
          initial={{ opacity: 0, y: 150 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, type: "spring", stiffness: 40 }}
          className="relative max-w-6xl mx-auto z-10 mt-[-20px] md:mt-[-40px]"
        >
          {/* Floating Avatar 3 -> Web Developer */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
            className="hidden lg:flex absolute top-[30%] -left-16 bg-white px-6 py-3 rounded-full shadow-xl items-center gap-3 z-40 border border-[#050529]/5"
          >
            <div className="w-5 h-5 rounded-full bg-orange-400" />
            <span className="text-base font-semibold text-[#050529]">Web Developer</span>
          </motion.div>

          {/* Floating Avatar 4 -> HR */}
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.5 }}
            className="hidden lg:flex absolute bottom-[30%] -right-16 bg-white px-6 py-3 rounded-full shadow-xl items-center gap-3 z-40 border border-[#050529]/5"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-400" />
            <span className="text-base font-semibold text-[#050529]">Human Resources</span>
          </motion.div>

          {/* Master Layer of Mockup ensuring 0 overflow and tight rounded corners */}
          <div className="relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden transform-gpu shadow-[0_30px_100px_rgba(5,5,41,0.15)] bg-white border border-white">
            <img
              src="https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/69634907504f28272af29af7_Mask%20group%20(4).png"
              alt="Dashboard App Mockup"
              className="w-full h-auto object-cover transform hover:scale-[1.01] transition-transform duration-1000"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
