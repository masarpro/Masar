"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("assistant");

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto px-4 py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
        <Sparkles className="h-8 w-8 text-blue-600" />
      </div>

      <h3 className="mb-1 text-lg font-bold">
        {t("welcomeGreeting", { name: userName })}
      </h3>

      <p className="mb-6 max-w-[280px] text-sm text-muted-foreground">
        {t("welcomeDescription")}
      </p>

      <AssistantQuickActions
        actions={quickActions}
        locale={locale}
        onAction={onAction}
      />

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Lightbulb className="h-3 w-3" />
        <span>
          {t("tip", { shortcut: t("shortcut") })}
        </span>
      </div>
    </div>
  );
}
