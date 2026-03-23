"use client";

import { motion } from "framer-motion";

export default function Testimonials() {
  const reviews = [
    {
      text: "TaskGo has completely transformed how our team operates. It’s intuitive, fast, and exactly what we needed to scale our agency.",
      author: "Sarah Jenkins",
      role: "Operations Director",
    },
    {
      text: "The automated workflows save me at least 10 hours a week. It’s incredible how much mental bandwidth this tool frees up.",
      author: "David Chen",
      role: "Lead Engineer",
    },
    {
      text: "Switching from Jira was the best decision we made this year. The onboarding took less than a day, and everyone loves it.",
      author: "Emily Ross",
      role: "Product Manager",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Success Stories</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 tracking-tight">
            Loved by ambitious teams.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-indigo-50/50 transition-colors"
            >
              <div>
                <div className="flex text-yellow-400 mb-6 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 font-medium mb-8 leading-relaxed">
                  "{review.text}"
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{review.author}</h4>
                  <p className="text-slate-500 text-xs">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
