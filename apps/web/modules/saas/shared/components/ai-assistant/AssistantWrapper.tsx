"use client";

import type { PropsWithChildren } from "react";
import { AssistantPanel } from "./AssistantPanel";
import { AssistantProvider } from "./AssistantProvider";
import { FloatingAssistantButton } from "./FloatingAssistantButton";

export function AssistantWrapper({
  children,
  organizationName,
}: PropsWithChildren<{ organizationName: string }>) {
  return (
    <AssistantProvider organizationName={organizationName}>
      {children}
      <FloatingAssistantButton />
      <AssistantPanel />
    </AssistantProvider>
  );
}
