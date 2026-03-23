"use client";

import { motion } from "framer-motion";

export default function Integrations() {
  const apps = [
    { name: "Slack", icon: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/695ca1d28b3c6ebdc9c6d766_Logo.svg" },
    { name: "Jira", icon: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d68307e872060ce4cd69_Logo%20(1).svg" },
    { name: "Notion", icon: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d6831d391483889aee7e_Logo%20(2).svg" },
    { name: "Figma", icon: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d683a800962f3d5ae694_Logo%20(3).svg" },
    { name: "GitHub", icon: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/695ca1d28b3c6ebdc9c6d766_Logo.svg" },
    { name: "Zoom", icon: "https://cdn.prod.website-files.com/695c7d712c7a871e68ae40b0/6964d683f247e0cf44c83f3e_Logo.svg" },
  ];

  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="container mx-auto px-6 text-center">
        
        <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Seamless Integrations</span>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4 mb-16 tracking-tight">
          Connects with your stack.
        </h2>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
          {apps.map((app, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group p-4"
            >
              <img src={app.icon} alt={app.name} className="w-full h-auto max-h-12 opacity-70 group-hover:opacity-100 group-hover:grayscale-0 grayscale transition-all" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
