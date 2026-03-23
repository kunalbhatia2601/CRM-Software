import Image from "next/image";
import Link from "next/link";

export default function LoginBranding({ siteData }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0d062d 0%, #1a1145 50%, #2a1a5e 100%)" }}>
      {/* Cloud decorations — reusing landing page assets */}
      <Image
        src="/images/cloud-2.webp"
        alt=""
        width={1644}
        height={400}
        className="absolute top-0 left-0 w-full pointer-events-none opacity-15"
        style={{ height: "auto" }}
      />
      <Image
        src="/images/cloud-3.svg"
        alt=""
        width={400}
        height={200}
        className="absolute bottom-0 right-0 pointer-events-none opacity-10"
        style={{ height: "auto" }}
      />

      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-16 w-72 h-72 rounded-full blur-[120px]"
           style={{ background: "rgba(96, 73, 231, 0.25)" }} />
      <div className="absolute bottom-16 right-10 w-96 h-96 rounded-full blur-[140px]"
           style={{ background: "rgba(147, 211, 250, 0.15)" }} />

      <div className="relative flex flex-col justify-between p-12 xl:p-16 w-full z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          {siteData?.logo ? (
            <img src={siteData.logo} alt={siteData.name} className="h-8 brightness-0 invert" />
          ) : (
            <Image
              src="/images/frame-9.svg"
              alt="TaskGo"
              width={168}
              height={40}
              className="w-[148px] brightness-0 invert"
              style={{ height: "auto" }}
            />
          )}
        </Link>

        {/* Tagline */}
        <div className="max-w-md">
          <h1 className="text-[40px] xl:text-[48px] font-semibold text-white leading-[115%] tracking-[-0.96px]">
            Manage your agency with clarity and control.
          </h1>
          <p className="mt-5 text-white/60 text-[18px] leading-[150%]">
            CRM, projects, teams, finance — all in one platform built
            specifically for agencies.
          </p>

          {/* Mini Stats */}
          <div className="flex gap-8 mt-10">
            {[
              { value: "50+", label: "Agency Partners" },
              { value: "99.9%", label: "Uptime" },
              { value: "85%", label: "Time Saved" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[28px] font-semibold text-white">{stat.value}</p>
                <p className="text-[14px] text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial Card — glassmorphism matching landing */}
        <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-6 max-w-md border border-white/10">
          <div className="flex text-yellow-400 gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
              </svg>
            ))}
          </div>
          <p className="text-white/80 text-[15px] leading-relaxed">
            &ldquo;TaskGo completely transformed our agency operations. We
            went from juggling 5 tools to one unified platform.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                 style={{ background: "rgba(96, 73, 231, 0.6)" }}>
              SM
            </div>
            <div>
              <p className="text-[14px] font-medium text-white">Sarah Mitchell</p>
              <p className="text-[12px] text-white/40">Ops Director, Vertex Digital</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
