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
      {/* fallback={null} is deliberate: the assistant panel is a floating,
          lazily-loaded overlay with no layout slot to reserve — there is
          nothing to skeleton, so rendering nothing until it loads is correct. */}
      <Suspense fallback={null}>
        <AssistantPanel />
      </Suspense>
    </AssistantProvider>
  );
}
