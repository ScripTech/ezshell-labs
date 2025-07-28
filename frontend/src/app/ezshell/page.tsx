"use client"

import { InteractiveTerminal } from "@/components/landing/interactive-terminal";
import { sendGAEvent } from "@next/third-parties/google";
import React from "react";

export default function Page() {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sendGAEvent("page_view", "interactive_terminal_ezshell");
      window.location.href = '/user/labs';
    }
  }, []);
  return (
    <div className="flex items-center justify-center h-screen">
      <InteractiveTerminal className="w-full max-w-4xl" />
    </div>
  );
}
