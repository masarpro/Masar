import type { AssistantSection, QuickAction } from "./types";

const quickActionsMap: Record<string, QuickAction[]> = {
  dashboard: [
    { id: "summary", labelAr: "ملخص مشاريعي", labelEn: "My projects summary", icon: "BarChart3", prompt: "أعطني ملخص سريع عن مشاريعي النشطة" },
    { id: "overdue", labelAr: "فواتير متأخرة", labelEn: "Overdue invoices", icon: "AlertTriangle", prompt: "هل عندي فواتير متأخرة؟" },
    { id: "guide", labelAr: "كيف أستخدم المنصة؟", labelEn: "How to use?", icon: "HelpCircle", prompt: "أعطني نظرة عامة على أقسام المنصة وكيف أبدأ" },
  ],
  projects: [
    { id: "active-projects", labelAr: "المشاريع النشطة", labelEn: "Active projects", icon: "FolderOpen", prompt: "أعرض لي المشاريع النشطة حالياً" },
    { id: "delayed-projects", labelAr: "مشاريع متأخرة", labelEn: "Delayed projects", icon: "Clock", prompt: "هل فيه مشاريع متأخرة عن الجدول؟" },
    { id: "new-project-guide", labelAr: "كيف أنشئ مشروع؟", labelEn: "How to create project?", icon: "Plus", prompt: "كيف أنشئ مشروع جديد؟" },
  ],
  "project-overview": [
    { id: "project-summary", labelAr: "ملخص المشروع", labelEn: "Project summary", icon: "FileText", prompt: "أعطني ملخص كامل عن هذا المشروع" },
    { id: "project-issues", labelAr: "مشاكل مفتوحة", labelEn: "Open issues", icon: "AlertCircle", prompt: "هل فيه مشاكل مفتوحة في المشروع؟" },
    { id: "project-budget", labelAr: "حالة الميزانية", labelEn: "Budget status", icon: "Wallet", prompt: "كم باقي من ميزانية المشروع؟" },
  ],
  "project-execution": [
    { id: "execution-progress", labelAr: "تقدم التنفيذ", labelEn: "Execution progress", icon: "TrendingUp", prompt: "ما نسبة تقدم التنفيذ في المشروع؟" },
    { id: "pending-tasks", labelAr: "مهام معلقة", labelEn: "Pending tasks", icon: "ListChecks", prompt: "ما المهام المعلقة حالياً؟" },
    { id: "execution-guide", labelAr: "كيف أتابع التنفيذ؟", labelEn: "How to track?", icon: "HelpCircle", prompt: "كيف أستخدم قسم التنفيذ لمتابعة سير العمل؟" },
  ],
  "project-finance": [
    { id: "project-finance-summary", labelAr: "ملخص مالي", labelEn: "Finance summary", icon: "DollarSign", prompt: "أعطني ملخص مالي لهذا المشروع" },
    { id: "project-invoices", labelAr: "فواتير المشروع", labelEn: "Project invoices", icon: "Receipt", prompt: "ما حالة الفواتير في هذا المشروع؟" },
    { id: "project-expenses", labelAr: "مصروفات المشروع", labelEn: "Project expenses", icon: "CreditCard", prompt: "كم إجمالي المصروفات حتى الآن؟" },
  ],
  "project-timeline": [
    { id: "timeline-status", labelAr: "حالة الجدول", labelEn: "Timeline status", icon: "Calendar", prompt: "هل المشروع ماشي حسب الجدول الزمني؟" },
    { id: "upcoming-milestones", labelAr: "معالم قادمة", labelEn: "Upcoming milestones", icon: "Flag", prompt: "ما المعالم القادمة في المشروع؟" },
    { id: "timeline-guide", labelAr: "كيف أحدث الجدول؟", labelEn: "How to update?", icon: "HelpCircle", prompt: "كيف أحدث الجدول الزمني للمشروع؟" },
  ],
  "project-documents": [
    { id: "recent-docs", labelAr: "ملفات حديثة", labelEn: "Recent files", icon: "FileText", prompt: "ما آخر الملفات المرفوعة؟" },
    { id: "upload-guide", labelAr: "كيف أرفع ملف؟", labelEn: "How to upload?", icon: "Upload", prompt: "كيف أرفع ملف جديد للمشروع؟" },
    { id: "missing-docs", labelAr: "ملفات ناقصة", labelEn: "Missing files", icon: "FileWarning", prompt: "هل فيه ملفات ناقصة أو مطلوبة؟" },
  ],
  "project-chat": [
    { id: "chat-summary", labelAr: "ملخص المحادثات", labelEn: "Chat summary", icon: "MessageSquare", prompt: "أعطني ملخص لآخر المحادثات في المشروع" },
    { id: "chat-guide", labelAr: "كيف أستخدم المحادثة؟", labelEn: "How to use chat?", icon: "HelpCircle", prompt: "كيف أستخدم نظام المحادثات في المشروع؟" },
  ],
  "project-field": [
    { id: "field-reports", labelAr: "تقارير ميدانية", labelEn: "Field reports", icon: "ClipboardList", prompt: "ما آخر التقارير الميدانية؟" },
    { id: "field-issues", labelAr: "ملاحظات ميدانية", labelEn: "Field issues", icon: "AlertCircle", prompt: "هل فيه ملاحظات ميدانية مفتوحة؟" },
    { id: "field-guide", labelAr: "كيف أضيف تقرير؟", labelEn: "How to add report?", icon: "Plus", prompt: "كيف أضيف تقرير ميداني جديد؟" },
  ],
  "project-changes": [
    { id: "change-orders", labelAr: "أوامر التغيير", labelEn: "Change orders", icon: "RefreshCw", prompt: "ما أوامر التغيير الحالية في المشروع؟" },
    { id: "change-impact", labelAr: "تأثير التغييرات", labelEn: "Change impact", icon: "TrendingUp", prompt: "ما تأثير أوامر التغيير على الميزانية والجدول؟" },
    { id: "change-guide", labelAr: "كيف أنشئ أمر تغيير؟", labelEn: "How to create?", icon: "Plus", prompt: "كيف أنشئ أمر تغيير جديد؟" },
  ],
  "project-team": [
    { id: "team-members", labelAr: "أعضاء الفريق", labelEn: "Team members", icon: "Users", prompt: "من أعضاء فريق هذا المشروع؟" },
    { id: "team-roles", labelAr: "الصلاحيات", labelEn: "Roles & permissions", icon: "Shield", prompt: "ما صلاحيات كل عضو في الفريق؟" },
    { id: "add-member-guide", labelAr: "كيف أضيف عضو؟", labelEn: "How to add member?", icon: "UserPlus", prompt: "كيف أضيف عضو جديد للمشروع؟" },
  ],
  "project-insights": [
    { id: "project-analytics", labelAr: "تحليلات المشروع", labelEn: "Project analytics", icon: "BarChart3", prompt: "أعطني تحليلات شاملة عن أداء المشروع" },
    { id: "risk-analysis", labelAr: "تحليل المخاطر", labelEn: "Risk analysis", icon: "AlertTriangle", prompt: "ما المخاطر المحتملة في المشروع؟" },
    { id: "performance-tips", labelAr: "نصائح تحسين", labelEn: "Performance tips", icon: "Lightbulb", prompt: "ما نصائحك لتحسين أداء المشروع؟" },
  ],
  "project-owner": [
    { id: "owner-report", labelAr: "تقرير للمالك", labelEn: "Owner report", icon: "FileText", prompt: "أعد لي تقرير ملخص لمالك المشروع" },
    { id: "owner-payments", labelAr: "مستحقات المالك", labelEn: "Owner payments", icon: "DollarSign", prompt: "ما حالة مستحقات المالك؟" },
    { id: "owner-guide", labelAr: "دليل بوابة المالك", labelEn: "Owner portal guide", icon: "HelpCircle", prompt: "كيف أستخدم بوابة المالك؟" },
  ],
  finance: [
    { id: "finance-summary", labelAr: "ملخص المالية", labelEn: "Finance summary", icon: "DollarSign", prompt: "أعطني ملخص مالي سريع" },
    { id: "unpaid-invoices", labelAr: "فواتير غير مدفوعة", labelEn: "Unpaid invoices", icon: "FileWarning", prompt: "كم فاتورة غير مدفوعة عندي؟" },
    { id: "how-invoice", labelAr: "كيف أنشئ فاتورة؟", labelEn: "How to create invoice?", icon: "Plus", prompt: "كيف أنشئ فاتورة جديدة؟" },
  ],
  quantities: [
    { id: "quantities-overview", labelAr: "نظرة على الكميات", labelEn: "Quantities overview", icon: "Calculator", prompt: "أعطني نظرة عامة على حصر الكميات" },
    { id: "quantities-guide", labelAr: "كيف أحصر الكميات؟", labelEn: "How to survey?", icon: "HelpCircle", prompt: "كيف أستخدم نظام حصر الكميات؟" },
  ],
  company: [
    { id: "company-info", labelAr: "معلومات المنشأة", labelEn: "Company info", icon: "Building2", prompt: "أعرض لي معلومات المنشأة" },
    { id: "company-guide", labelAr: "كيف أحدث البيانات؟", labelEn: "How to update?", icon: "HelpCircle", prompt: "كيف أحدث بيانات المنشأة؟" },
  ],
  settings: [
    { id: "settings-guide", labelAr: "دليل الإعدادات", labelEn: "Settings guide", icon: "Settings", prompt: "ما الإعدادات المتاحة وكيف أستخدمها؟" },
    { id: "account-settings", labelAr: "إعدادات الحساب", labelEn: "Account settings", icon: "User", prompt: "كيف أغير إعدادات حسابي؟" },
  ],
  notifications: [
    { id: "notifications-summary", labelAr: "ملخص الإشعارات", labelEn: "Notifications summary", icon: "Bell", prompt: "أعطني ملخص لآخر الإشعارات" },
    { id: "notifications-guide", labelAr: "إدارة الإشعارات", labelEn: "Manage notifications", icon: "BellRing", prompt: "كيف أتحكم في إعدادات الإشعارات؟" },
  ],
  chatbot: [
    { id: "chatbot-help", labelAr: "مساعدة المحادثة", labelEn: "Chat help", icon: "MessageCircle", prompt: "كيف أستفيد من المحادثة الذكية بأفضل شكل؟" },
    { id: "chatbot-tips", labelAr: "نصائح استخدام", labelEn: "Usage tips", icon: "Lightbulb", prompt: "ما أفضل الطرق لصياغة أسئلتي؟" },
  ],
};

const defaultActions: QuickAction[] = [
  { id: "general-summary", labelAr: "ملخص عام", labelEn: "General summary", icon: "BarChart3", prompt: "أعطني ملخص عام عن حالة المنظمة" },
  { id: "general-help", labelAr: "مساعدة", labelEn: "Help", icon: "HelpCircle", prompt: "كيف أقدر أساعدك؟ أعطني نظرة على إمكانياتك" },
  { id: "general-guide", labelAr: "دليل الاستخدام", labelEn: "User guide", icon: "BookOpen", prompt: "أعطني دليل سريع لاستخدام المنصة" },
];

export function getQuickActions(section: AssistantSection): QuickAction[] {
  return quickActionsMap[section] ?? defaultActions;
}
