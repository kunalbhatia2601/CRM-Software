"use client";

import { useState, useRef, useEffect } from "react";
import { useCopilot } from "@/context/CopilotContext";
import { MessageBubble } from "./MessageBubble";
import { Send, Sparkles, RotateCcw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function ChatView() {
  const { messages, isLoading, sendMessage, suggestions } = useCopilot();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const submit = async (text) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    try { await sendMessage(content); } catch (e) { console.error(e); }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const autoGrow = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#5542F6] to-[#4636d4] flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">How can I help?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mb-5">
              Ask about your leads, deals, clients, projects, tasks — I can pull live data from your CRM.
            </p>
            {suggestions.length > 0 && (
              <div className="w-full max-w-sm space-y-2">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button key={i} onClick={() => submit(s)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#5542F6] hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <motion.div key={m.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                {m.isError ? (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                        {m.content}
                      </div>
                      {m.failedPrompt && (
                        <button onClick={() => submit(m.failedPrompt)}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                          <RotateCcw className="w-3 h-3" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <MessageBubble message={m} />
                )}
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#5542F6] to-[#4636d4] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions (persist after chat starts) */}
      {!isEmpty && !isLoading && suggestions.length > 0 && (
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {suggestions.slice(0, 4).map((s, i) => (
            <button key={i} onClick={() => submit(s)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl px-3 py-2">
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={autoGrow}
            onKeyDown={onKeyDown}
            placeholder="Ask anything… (Enter to send)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none max-h-[120px] py-1"
            disabled={isLoading}
          />
          <button
            onClick={() => submit()}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              input.trim() && !isLoading ? "bg-[#5542F6] text-white hover:bg-[#4636d4]" : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
