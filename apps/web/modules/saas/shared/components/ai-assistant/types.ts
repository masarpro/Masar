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
  | "leads"
  | "pricing"
  | "unknown";

export interface QuickAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  prompt: string;
}

export interface SavedChat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  pageContext: PageContext;
  quickActions: QuickAction[];
  organizationSlug: string;
  organizationName: string;
  userName: string;
  unreadCount: number;
  incrementUnread: () => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  savedChats: SavedChat[];
  refreshChats: () => void;
  isLoadingChats: boolean;
  deleteChat: (id: string) => Promise<void>;
}
