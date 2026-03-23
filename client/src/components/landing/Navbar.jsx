"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ siteData }) {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { label: "Home", href: "#" },
    { label: "Features", href: "#features" },
    { label: "Why Choose", href: "#why-choose" },
    { label: "Testimonial", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <nav className="absolute top-0 left-0 w-full z-50 bg-transparent">
      <div className="container mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          {siteData.logo ? (
            <img src={siteData.logo} alt={siteData.name} className="h-8" />
          ) : (
            <span className="font-bold text-2xl text-[#050529] tracking-tight">
              {siteData.name}
            </span>
          )}
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[17px] font-medium text-[#050529] hover:text-[#5B55F9] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Contact CTA */}
        <div className="hidden lg:block">
          <Link
            href="/contact"
            className="text-[16px] font-semibold bg-[#050529] text-white px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-[0_4px_20px_0_rgba(5,5,41,0.2)]"
          >
            Contact Us
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-[#050529]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Expanded */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-0 w-full bg-white shadow-2xl p-6 flex flex-col gap-4 lg:hidden border-t border-slate-100"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="font-semibold text-lg text-[#050529] py-3 border-b border-slate-100 hover:text-[#5B55F9]"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col pt-4">
            <Link
              href="/contact"
              className="text-center text-lg font-semibold bg-[#050529] text-white py-4 rounded-full"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
