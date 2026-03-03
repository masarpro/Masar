"use client";

import { Suspense, lazy, type PropsWithChildren } from "react";
import { AssistantProvider } from "./AssistantProvider";
import { FloatingAssistantButton } from "./FloatingAssistantButton";

const AssistantPanel = lazy(() =>
  import("./AssistantPanel").then((m) => ({ default: m.AssistantPanel })),
);

export function AssistantWrapper({
  children,
  organizationName,
}: PropsWithChildren<{ organizationName: string }>) {
  return (
    <AssistantProvider organizationName={organizationName}>
      {children}
      <FloatingAssistantButton />
      <Suspense fallback={null}>
        <AssistantPanel />
      </Suspense>
    </AssistantProvider>
  );
}
