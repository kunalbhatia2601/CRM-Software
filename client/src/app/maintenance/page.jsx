"use client";

import { getSiteData } from "@/actions/site.action";
import { Wrench } from "lucide-react";


export default function MaintenancePage() {
  
  async function checkSiteStatus() {
    
    const res = await getSiteData();

    console.log("res", res);

    if(res.isMaintenanceMode){
      window.location.reload();
    }
    else{
      window.location.href = "/login";
    }

  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 p-6">
      <div className="w-full max-w-md text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          We'll be right back!
        </h1>
        <p className="text-[16px] text-slate-600 dark:text-slate-400 leading-relaxed">
          We are currently performing scheduled maintenance to improve your experience. 
          Please check back later.
        </p>
        <div className="pt-4">
          <button
            onClick={() => checkSiteStatus()}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Check Status
          </button>
        </div>
      </div>
      
      {/* Background Decorative Blobs */}
      <div className="fixed top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] -z-10 pointer-events-none" />
    </div>
  );
}
