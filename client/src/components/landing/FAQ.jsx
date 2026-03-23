"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How does the 14-day free trial work?",
      answer: "You get full access to all Professional tier features for 14 days. No credit card is required to sign up. If you choose not to upgrade after the trial, your account will automatically downgrade to the free Starter plan.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. Your plan will remain active until the end of the current billing cycle, and you won't be charged again.",
    },
    {
      question: "Is there a limit to how many projects I can manage?",
      answer: "On the Starter plan, you can manage up to 10 active projects. The Professional plan allows for unlimited projects and advanced portfolio management.",
    },
    {
      question: "Do you offer discounts for non-profits?",
      answer: "Yes, we offer a 50% lifetime discount for registered non-profit organizations and educational institutions. Contact our support team to apply.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Got Questions?</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-4 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 transition-colors hover:bg-slate-100"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-slate-900 pr-8">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500 shadow-sm'}`}
                  >
                    <Plus className="w-5 h-5" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    >
                      <div className="px-6 pb-6 pt-0 text-slate-600 leading-relaxed text-sm">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
