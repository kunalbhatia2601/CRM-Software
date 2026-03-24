"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#Features", label: "Features" },
  { href: "#Choose", label: "Why Choose" },
  { href: "#Testimonial", label: "Testimonial" },
  { href: "#Pricing", label: "Pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const site = useSite();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 pt-[30px]">
      <div className="max-w-[1350px] mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            {site.logo ? (
              <img src={site.logo} alt={site.name} className="h-[40px]" />
            ) : (
              <Image
                src="/images/frame-9.svg"
                alt={site.name}
                width={168}
                height={40}
                className="w-[168px]"
                style={{ width: "auto", height: "auto" }}
              />
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group relative h-[26px] overflow-hidden text-[18px] leading-[150%] text-gray hover:text-dark transition-colors duration-300"
              >
                <span className="block transition-transform duration-300 group-hover:-translate-y-full">
                  {link.label}
                </span>
                <span className="block text-primary transition-transform duration-300 group-hover:-translate-y-full">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="btn-glow relative inline-flex items-center justify-center px-6 py-3 bg-dark text-white text-[18px] font-normal rounded-full transition-all duration-300 hover:bg-primary"
            >
              <span className="relative z-10">Login</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-2 w-[38px] h-[38px] justify-center items-center"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span
              className={`block w-full h-[2px] bg-dark transition-all duration-300 ${
                mobileOpen ? "rotate-45 translate-y-[5px]" : ""
              }`}
            />
            <span
              className={`block w-full h-[2px] bg-dark transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-full h-[2px] bg-dark transition-all duration-300 ${
                mobileOpen ? "-rotate-45 -translate-y-[5px]" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden mt-4 bg-white rounded-[20px] p-6 shadow-lg">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[18px] text-gray hover:text-dark transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-dark text-white rounded-full mt-2"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
