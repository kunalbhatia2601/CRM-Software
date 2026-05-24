"use client";

import { useCopilot } from "@/context/CopilotContext";
import { CopilotHeader } from "./CopilotHeader";
import { ConversationList } from "./ConversationList";
import { ChatView } from "./ChatView";
import { AnimatePresence, motion } from "framer-motion";

export function CopilotPanel() {
  const { isOpen } = useCopilot();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 z-50 h-screen w-[420px] bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
          style={{
            boxShadow: "-4px 0 30px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Header */}
          <CopilotHeader />

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Conversation List Sidebar */}
            <div className="w-48 border-r border-slate-200 dark:border-slate-800 flex flex-col">
              <ConversationList />
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              <ChatView />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}