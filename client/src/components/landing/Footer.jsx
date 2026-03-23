"use client";

import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";

export default function Footer({ siteData }) {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-20 pb-10 border-t border-slate-800">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              {siteData.logo ? (
                <img src={siteData.logo} alt={siteData.name} className="h-8 brightness-0 invert" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                    {siteData.name.charAt(0)}
                  </div>
                  <span className="font-bold text-xl text-white tracking-tight">
                    {siteData.name}
                  </span>
                </div>
              )}
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              Simplifying task management and boosting productivity for modern teams globally. Build the future with absolute clarity.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
            
            {(siteData.contactEmail || siteData.contactPhone) && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-sm font-semibold text-slate-300 mb-2">Contact Us</p>
                {siteData.contactEmail && <p className="text-sm mb-1">{siteData.contactEmail}</p>}
                {siteData.contactPhone && <p className="text-sm">{siteData.contactPhone}</p>}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

        </div>

        <div className="text-center pt-8 border-t border-slate-800 text-sm">
          &copy; {new Date().getFullYear()} {siteData.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
