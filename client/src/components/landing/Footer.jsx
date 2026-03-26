"use client";

import Image from "next/image";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "#Features", label: "Features" },
  { href: "#Choose", label: "Why Choose" },
  { href: "#Pricing", label: "Pricing" },
  { href: "#Testimonial", label: "Testimonial" },
];

const templateLinks = [
  { href: "#", label: "Style Guide" },
  { href: "#", label: "License" },
  { href: "#", label: "Changelog" },
  { href: "#", label: "404" },
  { href: "#", label: "Password" },
];

const socialLinks = [
  { href: "https://facebook.com", icon: "/images/zj1kns4lgbms.svg", hoverIcon: "/images/group-2.webp", label: "Facebook" },
  { href: "https://instagram.com", icon: "/images/group-68.svg", hoverIcon: "/images/group-68.webp", label: "Instagram" },
  { href: "https://x.com", icon: "/images/s0-1.svg", hoverIcon: "/images/s0-1.webp", label: "X" },
  { href: "https://linkedin.com", icon: "/images/vector-2.svg", hoverIcon: "/images/spath-0-1.webp", label: "LinkedIn" },
];

export default function Footer() {
  const site = useSite();

  return (
    <footer className="overflow-hidden">
      <div className="bg-dark-bg">
        <div className="max-w-[1350px] mx-auto px-4 pt-16">
          {/* Top section */}
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Logo & tagline */}
            <div className="lg:max-w-[300px]">
              <Link href="/">
                {site.logo ? (
                  <img src={site.logo} alt={site.name} className="h-[40px] brightness-0 invert" />
                ) : (
                  <Image
                    src="/images/frame-55.svg"
                    alt={site.name}
                    width={168}
                    height={40}
                    className="w-[168px] brightness-0 invert"
                    style={{ width: "auto", height: "auto" }}
                  />
                )}
              </Link>
              <p className="text-gray text-[18px] leading-[150%] mt-6">
                We design experiences that connect, convert, and scale with your business.
              </p>
            </div>

            {/* Links Grid */}
            <div className="flex flex-1 flex-wrap gap-12 lg:gap-20 lg:justify-end">
              {/* Menus */}
              <div>
                <h4 className="text-white text-[24px] font-semibold mb-8">Menus</h4>
                <div className="flex flex-col gap-5">
                  {menuLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="group relative h-[29px] overflow-hidden text-[18px] leading-[150%] text-gray hover:text-white transition-colors duration-300 flex flex-col"
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
              </div>

              {/* Templates */}
              <div>
                <h4 className="text-white text-[24px] font-semibold mb-8">Templates</h4>
                <div className="flex flex-col gap-5">
                  {templateLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="group relative h-[29px] overflow-hidden text-[18px] leading-[150%] text-gray hover:text-white transition-colors duration-300 flex flex-col"
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
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-white text-[24px] font-semibold mb-8">Contact</h4>
                <div className="flex flex-col gap-5 max-w-[253px]">
                  <a
                    href={`mailto:${site.contactEmail}`}
                    className="text-gray text-[18px] leading-[150%] hover:text-primary transition-colors duration-300"
                  >
                    {site.contactEmail}
                  </a>
                  <a
                    href={`tel:${site.contactPhone}`}
                    className="text-gray text-[18px] leading-[150%] hover:text-primary transition-colors duration-300"
                  >
                    {site.contactPhone}
                  </a>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray text-[18px] leading-[150%] hover:text-primary transition-colors duration-300"
                  >
                    {site.address}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray/20 mt-12" />

          {/* Bottom: Social + Footer image + Copyright */}
          <div className="py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-10 h-10 rounded-full bg-light-gray/10 border border-gray/20 flex items-center justify-center hover:bg-primary/20 transition-colors duration-300"
                  >
                    <Image
                      src={social.icon}
                      alt={social.label}
                      width={20}
                      height={20}
                      className="w-5 h-5 brightness-0 invert group-hover:hidden"
                      style={{ width: "auto", height: "auto" }}
                    />
                    <Image
                      src={social.hoverIcon}
                      alt={social.label}
                      width={20}
                      height={20}
                      className="w-5 h-5 hidden group-hover:block"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </a>
                ))}
              </div>

              {/* Footer large text/image */}
              <div className="max-w-[766px] overflow-hidden">
                <img
                  src={site.logo || "/images/podr0aq2t2h4.svg"}
                  alt={site.name}
                  className="w-full opacity-20"
                />
              </div>
            </div>

            {/* Copyright */}
            <div className="flex justify-center mt-8 mb-4" onClick={() => window.open("https://kunalbhatia.dev", "_blank")}>
              <p className="text-gray text-[16px] leading-[150%]">
                ©{" "}
                <span className="hover:text-primary transition-colors cursor-pointer">{site.name}{" "}</span> - Powered by{" "}
                <span className="hover:text-primary transition-colors cursor-pointer">Kunal Bhatia</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
