"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sliding 30-minute idle timeout.
 *
 * Stamps a `lastActivity` cookie on genuine user interaction only — background
 * work (notification polling, timers) must not keep a session alive. The
 * middleware reads the same cookie and ends the session once it goes stale;
 * this component additionally kicks an open, untouched tab out to /login so an
 * idle screen doesn't sit there looking logged in.
 */

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // keep in sync with middleware.js
const COOKIE = "lastActivity";
const WRITE_THROTTLE_MS = 30 * 1000; // at most one cookie write per 30s
const CHECK_INTERVAL_MS = 30 * 1000;

const EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"];

function readStamp() {
  const match = document.cookie.match(/(?:^|;\s*)lastActivity=([^;]*)/);
  return match ? Number(match[1]) : null;
}

function writeStamp(now) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${now}; path=/; max-age=${IDLE_TIMEOUT_MS / 1000}; SameSite=Lax${secure}`;
}

export default function IdleTracker() {
  const router = useRouter();

  useEffect(() => {
    let lastWrite = 0;

    const touch = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      writeStamp(now);
    };

    // Arriving on the page is itself activity.
    writeStamp(Date.now());
    lastWrite = Date.now();

    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    const timer = setInterval(() => {
      const stamp = readStamp();
      // Cookie gone (aged out) or older than the window → session is over.
      if (stamp === null || Date.now() - stamp > IDLE_TIMEOUT_MS) {
        clearInterval(timer);
        window.location.href = "/login?reason=idle";
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(timer);
    };
  }, [router]);

  return null;
}
