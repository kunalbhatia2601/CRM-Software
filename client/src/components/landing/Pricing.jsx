"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  const tiers = [
    {
      name: "Starter",
      desc: "Perfect for small teams and startups getting off the ground.",
      price: isYearly ? 12 : 15,
      features: [
        "Up to 5 team members",
        "Basic task management",
        "1GB storage per user",
        "Community support",
      ],
      highlighted: false,
    },
    {
      name: "Professional",
      desc: "For growing businesses needing advanced capabilities.",
      price: isYearly ? 29 : 39,
      features: [
        "Unlimited team members",
        "Advanced automated workflows",
        "100GB storage per user",
        "Priority 24/7 support",
        "Custom integrations",
      ],
      highlighted: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#F8FAFC]">
      <div className="container mx-auto px-6 max-w-5xl">
        
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 mb-6 tracking-tight">
            Simple, transparent pricing.
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Choose the plan that fits your team's needs. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-16">
          <div className="relative flex items-center p-1 bg-white border border-slate-200 rounded-full shadow-sm">
            
            {/* Animated Slider Background */}
            <motion.div
              className="absolute top-1 bottom-1 w-1/2 bg-indigo-500 rounded-full shadow-md"
              initial={false}
              animate={{ left: isYearly ? "50%" : "4px", width: "calc(50% - 4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            <button
              onClick={() => setIsYearly(false)}
              className={`relative z-10 w-32 py-2.5 text-sm font-semibold rounded-full transition-colors ${!isYearly ? "text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative z-10 w-32 py-2.5 text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-1 ${isYearly ? "text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Yearly
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isYearly ? 'bg-indigo-400 text-white' : 'bg-green-100 text-green-700'}`}>-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className={`relative rounded-3xl p-8 border ${
                tier.highlighted 
                  ? "bg-slate-900 border-slate-800 shadow-2xl text-white transform md:-translate-y-4" 
                  : "bg-white border-slate-200 shadow-sm text-slate-900"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                  Most Popular
                </div>
              )}
              
              <h3 className={`text-2xl font-bold mb-2 ${tier.highlighted ? "text-white" : "text-slate-900"}`}>{tier.name}</h3>
              <p className={`text-sm mb-8 ${tier.highlighted ? "text-slate-400" : "text-slate-500"}`}>{tier.desc}</p>
              
              <div className="mb-8">
                <span className="text-5xl font-extrabold tracking-tighter">${tier.price}</span>
                <span className={`text-sm ${tier.highlighted ? "text-slate-400" : "text-slate-500"}`}>/mo per user</span>
              </div>

              <button className={`w-full py-4 rounded-xl font-semibold mb-8 transition-colors ${
                tier.highlighted
                  ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}>
                Get Started
              </button>

              <div className="space-y-4">
                {tier.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${tier.highlighted ? "text-indigo-400" : "text-indigo-500"}`} />
                    <span className={`text-sm ${tier.highlighted ? "text-slate-300" : "text-slate-600"}`}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
