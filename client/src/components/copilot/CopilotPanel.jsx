"use client";

import { useState } from "react";
import { useCopilot } from "@/context/CopilotContext";
import { CopilotHeader } from "./CopilotHeader";
import { ConversationList } from "./ConversationList";
import { ChatView } from "./ChatView";
import { AnimatePresence, motion } from "framer-motion";

export function CopilotPanel() {
  const { isOpen, closeCopilot } = useCopilot();
  const [showList, setShowList] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={closeCopilot}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 h-screen w-full sm:w-[480px] max-w-full bg-white dark:bg-slate-950 flex flex-col overflow-hidden"
            style={{ boxShadow: "-4px 0 40px rgba(0,0,0,0.18)" }}
          >
            <CopilotHeader onToggleList={() => setShowList((v) => !v)} listOpen={showList} />

            <div className="flex-1 flex overflow-hidden relative">
              {/* Slide-over conversation list */}
              <AnimatePresence>
                {showList && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 bg-black/20"
                      onClick={() => setShowList(false)}
                    />
                    <motion.div
                      initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                      transition={{ type: "spring", damping: 28, stiffness: 320 }}
                      className="absolute inset-y-0 left-0 z-20 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl"
                    >
                      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Conversations
                      </div>
                      <div className="flex-1 overflow-hidden flex flex-col">
                        <ConversationList onSelect={() => setShowList(false)} />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <ChatView />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
