برومبت المرحلة 1 — بناء المساعد الذكي العائم (UI فقط)

المرحلة الفرعية 1.1 — Types + Context Provider + Hook
## المهمة
أنشئ البنية التحتية للمساعد الذكي العائم: ملف الأنواع، Context Provider، و hook استخراج سياق الصفحة.

## السياق المهم
- المشروع monorepo مع Next.js App Router + React 19 + TypeScript
- RTL-first (العربية)، يدعم الإنجليزية عبر next-intl
- يوجد FloatingChatButton حالياً داخل ProjectShell فقط (لصفحات المشاريع) — نحن نبني مساعد مختلف يظهر في كل صفحات المنظمة
- يوجد مكون AI حالي في: modules/saas/ai/AiChat.tsx — لا تعدله
- MobileBottomNav يستخدم z-50
- Layouts chain: Root → SaaS → App → Organization → [Module/Project]

## الملفات المطلوبة

### 1. `apps/web/modules/saas/shared/components/ai-assistant/types.ts`
```typescript
// أنواع المساعد الذكي

export interface PageContext {
  route: string;               // المسار الحالي الكامل
  section: AssistantSection;   // القسم الرئيسي
  projectId?: string;          // إذا داخل مشروع
  projectName?: string;        // اسم المشروع
  entityType?: string;         // نوع الكيان (invoice, expense, etc.)
  entityId?: string;           // معرف الكيان
}

export type AssistantSection = 
  | 'dashboard'
  | 'projects' 
  | 'project-overview'
  | 'project-execution'
  | 'project-finance'
  | 'project-timeline'
  | 'project-documents'
  | 'project-chat'
  | 'project-field'
  | 'project-changes'
  | 'project-team'
  | 'project-insights'
  | 'project-owner'
  | 'finance'
  | 'quantities'
  | 'company'
  | 'settings'
  | 'notifications'
  | 'chatbot'
  | 'unknown';

export interface QuickAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;       // اسم أيقونة Lucide
  prompt: string;     // النص المرسل كرسالة
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
```

### 2. `apps/web/modules/saas/shared/components/ai-assistant/usePageContext.ts`
```typescript
// Hook يستخرج سياق الصفحة الحالية من الـ URL
// يستخدم usePathname() من next/navigation
// يعتمد useParams() لاستخراج organizationSlug و projectId
//
// المنطق:
// 1. يقرأ pathname ويفصل الأجزاء
// 2. يحدد الـ section بناءً على الأجزاء:
//    - /[org] → 'dashboard'
//    - /[org]/projects → 'projects'
//    - /[org]/projects/[pid] → 'project-overview'
//    - /[org]/projects/[pid]/execution → 'project-execution'
//    - /[org]/projects/[pid]/finance → 'project-finance'
//    - /[org]/projects/[pid]/timeline → 'project-timeline'
//    - /[org]/projects/[pid]/documents → 'project-documents'
//    - /[org]/projects/[pid]/chat → 'project-chat'
//    - /[org]/projects/[pid]/field → 'project-field'
//    - /[org]/projects/[pid]/changes → 'project-changes'
//    - /[org]/projects/[pid]/team → 'project-team'
//    - /[org]/projects/[pid]/insights → 'project-insights'
//    - /[org]/projects/[pid]/owner → 'project-owner'
//    - /[org]/finance → 'finance'
//    - /[org]/quantities → 'quantities'
//    - /[org]/company → 'company'
//    - /[org]/settings → 'settings'
//    - /[org]/notifications → 'notifications'
//    - /[org]/chatbot → 'chatbot'
//    - default → 'unknown'
// 3. يرجع PageContext object
//
// ملاحظة: المسارات الفعلية تبدأ بـ /app/ قبل organizationSlug
// مثال: /app/acme-construction/projects/abc123/execution
// الأجزاء بعد organizationSlug هي المهمة
```

### 3. `apps/web/modules/saas/shared/components/ai-assistant/quick-actions.ts`
```typescript
// دالة getQuickActions(section: AssistantSection, locale: string): QuickAction[]
// ترجع Quick Actions حسب القسم الحالي
//
// القواعد:
// - كل section له 3-4 quick actions مختلفة
// - كل action يحتوي labelAr + labelEn + icon (اسم Lucide) + prompt
//
// أمثلة:
// dashboard: [
//   { id: 'summary', labelAr: 'ملخص مشاريعي', labelEn: 'My projects summary', icon: 'BarChart3', prompt: 'أعطني ملخص سريع عن مشاريعي النشطة' },
//   { id: 'overdue', labelAr: 'فواتير متأخرة', labelEn: 'Overdue invoices', icon: 'AlertTriangle', prompt: 'هل عندي فواتير متأخرة؟' },
//   { id: 'guide', labelAr: 'كيف أستخدم المنصة؟', labelEn: 'How to use?', icon: 'HelpCircle', prompt: 'أعطني نظرة عامة على أقسام المنصة وكيف أبدأ' },
// ]
//
// project-overview: [
//   { id: 'project-summary', labelAr: 'ملخص المشروع', labelEn: 'Project summary', icon: 'FileText', prompt: 'أعطني ملخص كامل عن هذا المشروع' },
//   { id: 'project-issues', labelAr: 'مشاكل مفتوحة', labelEn: 'Open issues', icon: 'AlertCircle', prompt: 'هل فيه مشاكل مفتوحة في المشروع؟' },
//   { id: 'project-budget', labelAr: 'حالة الميزانية', labelEn: 'Budget status', icon: 'Wallet', prompt: 'كم باقي من ميزانية المشروع؟' },
// ]
//
// finance: [
//   { id: 'finance-summary', labelAr: 'ملخص المالية', labelEn: 'Finance summary', icon: 'DollarSign', prompt: 'أعطني ملخص مالي سريع' },
//   { id: 'unpaid-invoices', labelAr: 'فواتير غير مدفوعة', labelEn: 'Unpaid invoices', icon: 'FileWarning', prompt: 'كم فاتورة غير مدفوعة عندي؟' },
//   { id: 'how-invoice', labelAr: 'كيف أنشئ فاتورة؟', labelEn: 'How to create invoice?', icon: 'Plus', prompt: 'كيف أنشئ فاتورة جديدة؟' },
// ]
//
// أكمل لباقي الأقسام بنفس النمط
// للأقسام غير المعرّفة أرجع quick actions عامة (ملخص عام، مساعدة، دليل الاستخدام)
```

### 4. `apps/web/modules/saas/shared/components/ai-assistant/AssistantProvider.tsx`
```typescript
// "use client"
//
// React Context Provider للمساعد الذكي
//
// يستخدم:
// - usePageContext() hook للسياق
// - getQuickActions() للإجراءات السريعة
// - useState لـ isOpen
// - useParams() لاستخراج organizationSlug
//
// يوفر AssistantContextType لكل الأبناء
//
// يستمع لـ keyboard shortcut:
// - Ctrl+K أو Cmd+K → toggle
// - Escape → close (فقط إذا مفتوح)
// استخدم useEffect مع document.addEventListener('keydown', ...)
//
// ملاحظة مهمة: لا تتعارض مع shortcuts أخرى
// إذا كان العنصر النشط input أو textarea، لا تعمل Ctrl+K
//
// التصدير: 
// export const AssistantContext = createContext<AssistantContextType>(...)
// export const useAssistant = () => useContext(AssistantContext)
// export function AssistantProvider({ children, organizationName }: { children: React.ReactNode; organizationName: string })
```

## التحقق بعد الانتهاء
- تأكد أن كل الملفات تمرر TypeScript بدون أخطاء
- تأكد من عدم وجود imports دائرية
- لا تعدل أي ملف موجود في هذه المرحلة

المرحلة الفرعية 1.2 — مكونات UI (الزر العائم + النافذة)
## المهمة
أنشئ مكون الزر العائم ونافذة المحادثة — UI فقط بدون اتصال بـ AI.

## السياق
- المرحلة 1.1 مكتملة — الأنواع و Provider و hooks جاهزة
- استخدم shadcn/ui components الموجودة في المشروع (Button, Input, ScrollArea, Sheet أو Dialog)
- استخدم Lucide React 0.553.0 للأيقونات
- Tailwind CSS مع RTL support
- z-index: يجب أن يكون أعلى من MobileBottomNav (z-50)، استخدم z-[60]
- التصميم: light theme، modern 2025، glassmorphism خفيف، gradient accents
- الخط: IBM Plex Sans Arabic (محمل في المشروع عبر globals.css)

## الملفات المطلوبة

### 1. `apps/web/modules/saas/shared/components/ai-assistant/FloatingAssistantButton.tsx`
```typescript
// "use client"
//
// زر عائم دائري يظهر في الزاوية السفلية اليسرى (RTL = start)
//
// التصميم:
// - position: fixed
// - bottom: 24px (أو 80px على الموبايل لتجنب MobileBottomNav)
// - inset-inline-start: 24px (يعمل مع RTL و LTR)
// - الحجم: w-14 h-14 (56px)
// - rounded-full
// - gradient background: from-blue-600 to-indigo-600
// - shadow-lg hover:shadow-xl
// - transition-all duration-300
// - z-[60]
// - أيقونة: Sparkles من lucide-react (حجم 24)
// - عند الفتح: تتحول لأيقونة X مع rotate animation
// - pulse animation خفيف عند الحالة المغلقة (animate-pulse أو custom)
//
// على الموبايل (md:bottom-6 bottom-20) لتجنب التداخل مع MobileBottomNav
//
// يستخدم useAssistant() للتحكم بـ isOpen
//
// aria-label: "المساعد الذكي" / "AI Assistant"
// title مع shortcut: "المساعد الذكي (Ctrl+K)"
```

### 2. `apps/web/modules/saas/shared/components/ai-assistant/AssistantQuickActions.tsx`
```typescript
// "use client"
//
// شبكة بطاقات الإجراءات السريعة — تظهر عندما لا توجد رسائل
//
// التصميم:
// - grid grid-cols-2 gap-3
// - كل بطاقة: p-3 rounded-xl border bg-muted/50 hover:bg-muted cursor-pointer
// - transition-colors
// - أيقونة Lucide ديناميكية (استخدم dynamic import أو icon map)
// - نص البطاقة حسب اللغة (locale)
//
// عند الضغط: يستدعي onAction(prompt: string) — يرسل النص كرسالة
//
// Props: 
// - actions: QuickAction[]
// - locale: string
// - onAction: (prompt: string) => void
//
// ملاحظة للأيقونات: لا تستخدم dynamic import
// بدلاً من ذلك أنشئ icon map:
// const iconMap: Record<string, LucideIcon> = {
//   BarChart3, AlertTriangle, HelpCircle, FileText, ... 
// }
// ثم: const Icon = iconMap[action.icon] || MessageCircle
```

### 3. `apps/web/modules/saas/shared/components/ai-assistant/AssistantContextBadge.tsx`
```typescript
// "use client"  
//
// شريط صغير يظهر السياق الحالي أعلى المحادثة
//
// التصميم:
// - flex items-center gap-2 px-3 py-1.5 text-xs
// - bg-blue-50 dark:bg-blue-950/30 rounded-lg
// - أيقونة MapPin صغيرة (14px)
// - النص: اسم القسم حسب اللغة
// - إذا فيه projectName: "مشروع: {name} | {section}"
// - إذا ما فيه: "{section}" فقط
//
// Props: pageContext: PageContext, locale: string
//
// helper function: getSectionLabel(section: AssistantSection, locale: string): string
// يرجع الاسم العربي/الإنجليزي للقسم
```

### 4. `apps/web/modules/saas/shared/components/ai-assistant/AssistantInput.tsx`
```typescript
// "use client"
//
// حقل الإدخال مع زر الإرسال
//
// التصميم:
// - flex items-center gap-2 p-3 border-t bg-background
// - Input (shadcn) مع placeholder "اسأل مساعد مسار..." / "Ask Masar Assistant..."
// - زر إرسال: Button variant="ghost" size="icon" مع أيقونة SendHorizontal
// - الزر يتفعل فقط إذا فيه نص
// - dir="auto" على الـ input (يكتشف اتجاه النص تلقائياً)
//
// Events:
// - Enter → إرسال (بشرط ما يكون shift+enter)
// - Shift+Enter → سطر جديد (إذا استخدمت textarea بدل input)
// - onChange + onSubmit props
//
// Props:
// - value: string
// - onChange: (value: string) => void
// - onSubmit: () => void
// - isLoading: boolean
// - locale: string
//
// إذا isLoading: أظهر Loader2 بدل SendHorizontal مع animate-spin
// وعطّل الزر والـ input
```

### 5. `apps/web/modules/saas/shared/components/ai-assistant/AssistantMessages.tsx`
```typescript
// "use client"
//
// عرض قائمة الرسائل
//
// التصميم:
// - ScrollArea (shadcn) مع h-full
// - auto-scroll لآخر رسالة عند إضافة رسالة جديدة (useEffect + scrollIntoView)
// - كل رسالة:
//   - رسالة المستخدم: bg-blue-600 text-white rounded-2xl rounded-bl-sm (RTL: rounded-br-sm) p-3 max-w-[85%] ms-auto
//   - رسالة المساعد: bg-muted rounded-2xl rounded-br-sm (RTL: rounded-bl-sm) p-3 max-w-[85%]
//   - بين الرسائل: gap-3
// - في حالة الفراغ: لا تعرض شيء (QuickActions ستظهر بدلاً عنها)
//
// Props:
// - messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>
// - isLoading: boolean
//
// إذا isLoading وآخر رسالة من المستخدم:
// أظهر "typing indicator" — ثلاث نقاط متحركة في فقاعة المساعد
//
// لعرض محتوى المساعد: في هذه المرحلة اعرض النص كما هو (plain text)
// سنضيف Markdown rendering في مرحلة لاحقة
```

### 6. `apps/web/modules/saas/shared/components/ai-assistant/AssistantPanel.tsx`
```typescript
// "use client"
//
// النافذة الرئيسية للمساعد — تجمع كل المكونات
//
// التصميم:
// - position: fixed
// - bottom: 96px على الموبايل، bottom: 88px على الديسكتوب
// - inset-inline-start: 16px (sm: 24px)
// - العرض: w-[calc(100vw-32px)] sm:w-[400px]
// - الارتفاع: h-[min(70vh,600px)]
// - rounded-2xl
// - border shadow-2xl
// - bg-background
// - z-[60]
// - overflow-hidden
// - flex flex-col
//
// Animation: 
// - عند الفتح: animate in (scale-95 opacity-0 → scale-100 opacity-100)
// - عند الإغلاق: animate out
// - استخدم CSS transition أو framer-motion إذا متوفر
// - أبسط حل: Tailwind transition مع conditional classes
//
// الهيكل:
// ┌─────────────────────────────────┐
// │ Header                          │
// │ [✨ مساعد مسار]  [🔄] [✕]      │
// ├─────────────────────────────────┤
// │ ContextBadge (إذا فيه سياق)    │
// ├─────────────────────────────────┤
// │                                 │
// │ Messages أو QuickActions        │
// │ (flex-1 overflow-hidden)        │
// │                                 │
// ├─────────────────────────────────┤
// │ Input                           │
// └─────────────────────────────────┘
//
// Header:
// - flex items-center justify-between p-3 border-b
// - يسار (RTL: يمين): أيقونة Sparkles + "مساعد مسار" (bold, text-sm)
// - يمين (RTL: يسار): زر محادثة جديدة (RotateCcw icon) + زر إغلاق (X icon)
// - كلاهما Button variant="ghost" size="icon" حجم sm
//
// Body:
// - إذا لا توجد رسائل → AssistantQuickActions
// - إذا توجد رسائل → AssistantMessages
// - flex-1 overflow-hidden
//
// Footer:
// - AssistantInput
//
// State المحلي (في هذه المرحلة — سيتحول لـ useChat لاحقاً):
// - messages: Array<{ id, role, content }> — useState
// - input: string — useState
// - isLoading: boolean — useState
//
// عند الإرسال (مؤقت — سيتغير):
// 1. أضف رسالة المستخدم للـ messages
// 2. setIsLoading(true)
// 3. بعد 1.5 ثانية (setTimeout محاكاة):
//    أضف رسالة من المساعد: "مرحباً! أنا مساعد مسار، سأكون جاهز قريباً لمساعدتك. 🚀"
// 4. setIsLoading(false)
//
// عند "محادثة جديدة":
// - امسح messages
// - امسح input
//
// يستخدم useAssistant() لـ pageContext و quickActions و locale
```

## قواعد مهمة
- كل ملف يبدأ بـ "use client"
- استخدم imports من المكونات الموجودة: '@/modules/ui/' لـ shadcn components
- أو تحقق من المسار الفعلي لـ shadcn في المشروع — قد يكون '@/modules/ui/components/' أو مباشرة '@/components/ui/'
- افحص الملف: apps/web/modules/ui/ لمعرفة المسار الصحيح
- الأيقونات: import { Sparkles, X, SendHorizontal, ... } from 'lucide-react'
- لا تستخدم any — اكتب types صحيحة
- لا تنس dir="auto" على inputs

المرحلة الفرعية 1.3 — التكامل مع Layout
## المهمة
أدمج المساعد الذكي العائم في layout المنظمة ليظهر في كل صفحات المنظمة.

## السياق
- المراحل 1.1 و 1.2 مكتملة
- Layout المنظمة: apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx
- هذا الـ layout يغلف كل صفحات المنظمة (مشاريع، مالية، شركة، إعدادات، إشعارات، chatbot)
- يجب أن يعمل مع MasarSidebarShell الموجود

## الملف المطلوب تعديله

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx`

التعديلات المطلوبة:

1. **أضف imports:**
```typescript
import { AssistantProvider } from '@/modules/saas/shared/components/ai-assistant/AssistantProvider';
import { FloatingAssistantButton } from '@/modules/saas/shared/components/ai-assistant/FloatingAssistantButton';
import { AssistantPanel } from '@/modules/saas/shared/components/ai-assistant/AssistantPanel';
```

2. **غلّف children بـ AssistantProvider:**
- اقرأ الـ layout الحالي أولاً بالكامل
- ابحث عن المكان المناسب لإضافة Provider
- عادةً يكون حول children أو حول المحتوى الرئيسي
- مرر organizationName من البيانات الموجودة في الـ layout (ابحث عن organization.name أو ما يشابه)

3. **أضف FloatingAssistantButton + AssistantPanel:**
- ضعهم كآخر عناصر قبل إغلاق الـ Provider
- مثال:
```tsx
<AssistantProvider organizationName={organization.name}>
  {/* المحتوى الحالي */}
  {children}
  {/* المساعد الذكي */}
  <FloatingAssistantButton />
  <AssistantPanel />
</AssistantProvider>
```

## تعليمات مهمة

- **اقرأ الملف كاملاً أولاً** قبل أي تعديل — افهم الهيكل الحالي
- **لا تغير أي شيء آخر** في الـ layout — فقط أضف Provider + Components
- إذا كان layout يستخدم Server Component:
  - AssistantProvider هو "use client"، لذا قد تحتاج لفصله في client component wrapper
  - أنشئ: `ai-assistant/AssistantWrapper.tsx` (client component) يحتوي Provider + Button + Panel
  - ثم استورده في الـ layout
- تحقق من مسار import الصحيح — قد يكون '@/modules/...' أو '../modules/...' حسب الـ tsconfig paths

## ملف إضافي (إذا لزم)

### `apps/web/modules/saas/shared/components/ai-assistant/AssistantWrapper.tsx`
```typescript
// "use client"
// 
// Client component wrapper يجمع كل مكونات المساعد
// يستخدم فقط إذا كان Organization Layout هو Server Component
//
// Props: { children: React.ReactNode, organizationName: string }
//
// return (
//   <AssistantProvider organizationName={organizationName}>
//     {children}
//     <FloatingAssistantButton />
//     <AssistantPanel />
//   </AssistantProvider>
// )
```

## التحقق
- شغّل `pnpm build` أو `pnpm dev` وتأكد لا توجد أخطاء
- افتح أي صفحة منظمة في المتصفح
- يجب أن يظهر الزر العائم في الزاوية السفلية
- اضغط عليه — يجب أن تفتح النافذة
- اضغط Ctrl+K — يجب أن تفتح/تغلق
- اضغط Escape — يجب أن تغلق
- تنقل بين الصفحات — الزر يبقى ظاهر
- على الموبايل: الزر لا يتداخل مع MobileBottomNav

المرحلة الفرعية 1.4 — الترجمة والتلميع
## المهمة
أضف مفاتيح الترجمة للمساعد الذكي وأصلح أي مشاكل UI.

## الملفات المطلوب تعديلها

### 1. ملف الترجمة العربية
**الملف:** ابحث عن ملف الترجمة — عادةً في `apps/web/messages/ar.json` أو `packages/i18n/messages/ar.json`

أضف مفاتيح جديدة تحت قسم `"assistant"`:
```json
{
  "assistant": {
    "title": "مساعد مسار",
    "placeholder": "اسأل مساعد مسار...",
    "newChat": "محادثة جديدة",
    "close": "إغلاق",
    "send": "إرسال",
    "thinking": "يفكر...",
    "welcome": "مرحباً! كيف أقدر أساعدك؟",
    "contextBadge": {
      "dashboard": "لوحة التحكم",
      "projects": "المشاريع",
      "project-overview": "نظرة عامة",
      "project-execution": "التنفيذ",
      "project-finance": "مالية المشروع",
      "project-timeline": "الجدول الزمني",
      "project-documents": "المستندات",
      "project-chat": "المحادثات",
      "project-field": "العمل الميداني",
      "project-changes": "أوامر التغيير",
      "project-team": "الفريق",
      "project-insights": "التحليلات",
      "project-owner": "بوابة المالك",
      "finance": "المالية",
      "quantities": "حصر الكميات",
      "company": "إدارة المنشأة",
      "settings": "الإعدادات",
      "notifications": "الإشعارات",
      "chatbot": "المحادثة الذكية",
      "unknown": "عام"
    },
    "shortcut": "Ctrl+K"
  }
}
```

### 2. ملف الترجمة الإنجليزية
**الملف:** `apps/web/messages/en.json` أو المسار المقابل

أضف نفس المفاتيح بالإنجليزية:
```json
{
  "assistant": {
    "title": "Masar Assistant",
    "placeholder": "Ask Masar Assistant...",
    "newChat": "New Chat",
    "close": "Close",
    "send": "Send",
    "thinking": "Thinking...",
    "welcome": "Hello! How can I help you?",
    "contextBadge": {
      "dashboard": "Dashboard",
      "projects": "Projects",
      "project-overview": "Overview",
      "project-execution": "Execution",
      "project-finance": "Project Finance",
      "project-timeline": "Timeline",
      "project-documents": "Documents",
      "project-chat": "Chat",
      "project-field": "Field Work",
      "project-changes": "Change Orders",
      "project-team": "Team",
      "project-insights": "Insights",
      "project-owner": "Owner Portal",
      "finance": "Finance",
      "quantities": "Quantity Surveying",
      "company": "Company Management",
      "settings": "Settings",
      "notifications": "Notifications",
      "chatbot": "AI Chat",
      "unknown": "General"
    },
    "shortcut": "Ctrl+K"
  }
}
```

### 3. تحديث المكونات لاستخدام الترجمة

عدّل المكونات التالية لاستخدام `useTranslations('assistant')` من next-intl بدل النصوص الثابتة:
- AssistantPanel.tsx — العنوان، placeholder، أزرار
- AssistantContextBadge.tsx — أسماء الأقسام
- AssistantInput.tsx — placeholder
- FloatingAssistantButton.tsx — aria-label, title

استخدم النمط الموجود في المشروع:
```typescript
import { useTranslations } from 'next-intl';
// ...
const t = useTranslations('assistant');
// ...
<span>{t('title')}</span>
```

### 4. التلميع البصري

تأكد من:
- [ ] الزر العائم يظهر فوق كل المحتوى (z-[60])
- [ ] على الموبايل: الزر لا يتداخل مع MobileBottomNav (bottom-20 على الأقل)
- [ ] النافذة تظهر فوق الزر (bottom أعلى من الزر)
- [ ] الـ animation سلس عند الفتح والإغلاق
- [ ] ScrollArea يعمل بشكل صحيح في المحادثة
- [ ] Quick Actions تظهر بشكل جميل في grid
- [ ] Context Badge يظهر فقط إذا القسم ليس 'unknown'
- [ ] الـ input يعمل مع Enter و Shift+Enter
- [ ] typing indicator (النقاط المتحركة) يظهر أثناء "التحميل"
- [ ] RTL يعمل بشكل كامل (الفقاعات في الاتجاه الصحيح)
- [ ] لا يوجد overflow أو scroll غير مطلوب

## التحقق النهائي للمرحلة 1
- [ ] pnpm build ينجح بدون أخطاء
- [ ] الزر يظهر في كل صفحات المنظمة
- [ ] الزر لا يظهر في صفحات التسويق أو المصادقة
- [ ] Ctrl+K يفتح ويغلق
- [ ] Quick Actions تظهر في الحالة الفارغة
- [ ] إرسال رسالة يعمل (مع الرد المؤقت)
- [ ] Context Badge يتغير عند التنقل بين الصفحات
- [ ] محادثة جديدة تمسح الرسائل
- [ ] التصميم متناسق مع باقي المنصة
