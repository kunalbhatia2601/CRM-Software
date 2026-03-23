"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { loginAction } from "@/actions/auth.action";

const initialState = { success: false, message: "" };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Redirect on successful login
  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {/* Error Alert */}
      {state.message && !state.success && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-[12px]">
          <p className="text-sm text-red-600 font-medium">{state.message}</p>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-[14px] font-semibold text-dark mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full pl-11 pr-4 py-3.5 bg-light-gray border border-border-1 rounded-full text-[15px] text-dark placeholder-gray/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-[14px] font-semibold text-dark">
            Password
          </label>
          <a href="#" className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="w-full pl-11 pr-12 py-3.5 bg-light-gray border border-border-1 rounded-full text-[15px] text-dark placeholder-gray/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-dark transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-glow w-full py-3.5 bg-dark hover:bg-primary disabled:opacity-50 text-white font-semibold text-[16px] rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="relative z-10">Signing in...</span>
          </>
        ) : (
          <span className="relative z-10">Sign in</span>
        )}
      </button>
    </form>
  );
}
