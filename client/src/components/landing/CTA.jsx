"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 bg-white px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative bg-indigo-600 rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden"
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-500 rounded-full blur-[80px] mix-blend-screen opacity-50" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500 rounded-full blur-[80px] mix-blend-screen opacity-50" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              Revolutionize Your Workflow Today.
            </h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join thousands of teams who rely on our platform to get things done faster, smarter, and together.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
              >
                Get Started for Free
              </Link>
              <p className="text-sm font-medium text-indigo-200 mt-4 sm:mt-0 sm:ml-4">
                No credit card required.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
