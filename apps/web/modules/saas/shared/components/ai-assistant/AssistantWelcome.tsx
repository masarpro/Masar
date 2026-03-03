"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import type { QuickAction } from "./types";
import { AssistantQuickActions } from "./AssistantQuickActions";

interface AssistantWelcomeProps {
  userName: string;
  locale: string;
  quickActions: QuickAction[];
  onAction: (prompt: string) => void;
}

export function AssistantWelcome({
  userName,
  locale,
  quickActions,
  onAction,
}: AssistantWelcomeProps) {
  const isAr = locale === "ar";

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto px-4 py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
        <Sparkles className="h-8 w-8 text-blue-600" />
      </div>

      <h3 className="mb-1 text-lg font-bold">
        {isAr ? `مرحباً ${userName}!` : `Hi ${userName}!`}
      </h3>

      <p className="mb-6 max-w-[280px] text-sm text-muted-foreground">
        {isAr
          ? "أنا مساعد مسار الذكي. أقدر أساعدك تتنقل في المنصة وتستعلم عن بياناتك."
          : "I'm Masar's smart assistant. I can help you navigate, query your data, and understand anything."}
      </p>

      <AssistantQuickActions
        actions={quickActions}
        locale={locale}
        onAction={onAction}
      />

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Lightbulb className="h-3 w-3" />
        <span>
          {isAr
            ? "نصيحة: اضغط Ctrl+K للفتح السريع"
            : "Tip: Press Ctrl+K to open quickly"}
        </span>
      </div>
    </div>
  );
}
