"use client";

import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  BellRing,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  FileWarning,
  Flag,
  FolderOpen,
  HelpCircle,
  Lightbulb,
  ListChecks,
  type LucideIcon,
  MessageCircle,
  MessageSquare,
  Plus,
  Receipt,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { QuickAction } from "./types";

const iconMap: Record<string, LucideIcon> = {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  BellRing,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  FileWarning,
  Flag,
  FolderOpen,
  HelpCircle,
  Lightbulb,
  ListChecks,
  MessageCircle,
  MessageSquare,
  Plus,
  Receipt,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  Wallet,
};

interface AssistantQuickActionsProps {
  actions: QuickAction[];
  locale: string;
  onAction: (prompt: string) => void;
}

export function AssistantQuickActions({
  actions,
  locale,
  onAction,
}: AssistantQuickActionsProps) {
  const isAr = locale === "ar";

  return (
    <div className="grid w-full grid-cols-2 gap-2.5 p-4">
      {actions.map((action, index) => {
        const Icon = iconMap[action.icon] ?? MessageCircle;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action.prompt)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-3 text-start transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm dark:hover:bg-blue-950/20 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200 dark:bg-blue-900/30">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium leading-tight text-foreground">
              {isAr ? action.labelAr : action.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
}
