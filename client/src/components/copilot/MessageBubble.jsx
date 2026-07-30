"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Markdown from "./Markdown";

// Map entity type → route segment.
const SEGMENTS = {
  lead: "leads", deal: "deals", client: "clients", project: "projects",
  task: "tasks", meeting: "meetings", team: "teams", user: "users", service: "services",
};

export function MessageBubble({ message }) {
  const router = useRouter();
  const { user } = useAuth();
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  // Base path from role — copilot is owner/admin only.
  const base = user?.role === "ADMIN" ? "/admin" : "/owner";

  const handleEntityClick = (entity) => {
    const seg = SEGMENTS[entity.entityType];
    if (seg) router.push(`${base}/${seg}/${entity.entityId}`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(message.content || "").replace(/<[^>]*>/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-md bg-[#5542F6] text-white text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex items-start gap-2.5 group">
      <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#5542F6] to-[#4636d4] flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
          <Markdown text={message.content} onEntityClick={handleEntityClick} />
        </div>

        {/* Entity chips (structured) */}
        {Array.isArray(message.entities) && message.entities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.entities.map((e, i) => (
              <button key={i} onClick={() => handleEntityClick(e)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#5542F6] transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5542F6]" />
                {e.name}
                <span className="text-slate-400">· {e.type || e.entityType}</span>
              </button>
            ))}
          </div>
        )}

        {/* Copy — appears on hover */}
        <button onClick={copy}
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
    </div>
  );
}
