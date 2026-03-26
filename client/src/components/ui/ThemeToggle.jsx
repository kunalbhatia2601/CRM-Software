"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm shadow-slate-200/50">
        <div className="w-5 h-5" />
      </button>
    );
  }

  const changeTheme = () => {
    console.log(theme);
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={changeTheme}
      className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shadow-sm shadow-slate-200/50 dark:shadow-none"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
