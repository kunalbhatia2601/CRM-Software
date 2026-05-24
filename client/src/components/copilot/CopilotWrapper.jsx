"use client";

import { CopilotProvider } from "@/context/CopilotContext";
import { CopilotButton } from "@/components/copilot/CopilotButton";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";

export function CopilotWrapper({ children }) {
  return (
    <CopilotProvider>
      {children}
      <CopilotButton />
      <CopilotPanel />
    </CopilotProvider>
  );
}