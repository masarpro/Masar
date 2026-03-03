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
    <div className="grid grid-cols-2 gap-3 p-4">
      {actions.map((action) => {
        const Icon = iconMap[action.icon] ?? MessageCircle;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action.prompt)}
            className="flex flex-col items-start gap-2 rounded-xl border bg-muted/50 p-3 text-start transition-colors hover:bg-muted"
          >
            <Icon size={20} className="text-blue-600" />
            <span className="text-sm font-medium leading-snug">
              {isAr ? action.labelAr : action.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
}
