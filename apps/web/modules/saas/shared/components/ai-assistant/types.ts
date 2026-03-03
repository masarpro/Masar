// أنواع المساعد الذكي

export interface PageContext {
  route: string;
  section: AssistantSection;
  projectId?: string;
  projectName?: string;
  entityType?: string;
  entityId?: string;
}

export type AssistantSection =
  | "dashboard"
  | "projects"
  | "project-overview"
  | "project-execution"
  | "project-finance"
  | "project-timeline"
  | "project-documents"
  | "project-chat"
  | "project-field"
  | "project-changes"
  | "project-team"
  | "project-insights"
  | "project-owner"
  | "finance"
  | "quantities"
  | "company"
  | "settings"
  | "notifications"
  | "chatbot"
  | "unknown";

export interface QuickAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  prompt: string;
}

export interface AssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  pageContext: PageContext;
  quickActions: QuickAction[];
  organizationSlug: string;
  organizationName: string;
}
