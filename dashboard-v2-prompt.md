# برومبت إعادة تصميم الداشبورد v2 — صفحة واحدة بدون تمرير

## السياق

الداشبورد تم تحديثه في المرحلة السابقة وأصبح يحتوي على مكونات فرعية في:
```
apps/web/modules/saas/dashboard/components/
├── Dashboard.tsx
├── sections/
│   ├── KpiCardsRow.tsx
│   ├── ActiveProjectsSection.tsx
│   ├── QuickActionsGrid.tsx
│   ├── AlertsSection.tsx
│   ├── FinancialOverviewSection.tsx
│   ├── CashFlowSection.tsx
│   ├── CompanyExpensesSection.tsx
│   ├── RecentActivitySection.tsx
│   └── OperationalSection.tsx
└── cards/
```

المطلوب الآن: **إعادة ترتيب وتصميم جذري** ليكون الداشبورد صفحة واحدة بدون تمرير (أو بأقل تمرير ممكن).

## القاعدة الذهبية

- **اقرأ أولاً** كل ملف مذكور قبل أي تعديل
- **لا تلمس** أي ملف خارج نطاق الداشبورد
- **RTL**: استخدم `ms-`/`me-`/`ps-`/`pe-` فقط
- **Decimal**: `Number()` فقط عند العرض
- **Build check**: `tsc --noEmit` بعد كل مرحلة

## القائمة الحمراء — لا تلمس

```
packages/api/ (لا تعديل — الـ backend جاهز من المرحلة السابقة)
packages/database/
apps/web/modules/saas/pricing/
```

---

## التصميم الجديد — خريطة الصفحة

```
┌──────────────────────────────────────────────────────────────┐
│  النصف الأيسر (50%)          │  النصف الأيمن (50%)           │
│                               │                               │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐  │
│  │   المشاريع النشطة       │  │  │ رصيد البنك│صندوق│دفعات  │  │
│  │   (عرض قائمة مفصّل)     │  │  │  (3 mini-cards مدمجة)   │  │
│  │   أو "أضف مشروعك الأول" │  │  ├─────────────────────────┤  │
│  │   إذا لا يوجد مشاريع    │  │  │  التدفق النقدي (شهري)   │  │
│  │                          │  │  │  (مخطط مدمج)            │  │
│  └─────────────────────────┘  │  └─────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  [دراسات] [عملاء] [تسعير] [فواتير] [مقبوضات] [مصروفات]     │
│  ← 6 بطاقات وصول سريع بعرض كامل وارتفاع مُقلّص →           │
├──────────────────────────────────────────────────────────────┤
│  يحتاج انتباهك    │  نظرة تشغيلية    │  هل تعلم؟ (ميزات)   │
│  (تنبيهات)         │  (إحصائيات)       │  (معلومة متغيرة)    │
└──────────────────────────────────────────────────────────────┘
```

---

## المرحلة 0 — التشخيص

اقرأ هذه الملفات:
```
apps/web/modules/saas/dashboard/components/Dashboard.tsx
apps/web/modules/saas/dashboard/components/sections/ (كل الملفات)
```

حدد:
- كيف يتم استدعاء البيانات (أي queries)
- ما هي المكونات المستخدمة حالياً
- أي imports وhooks موجودة

**لا تبدأ التنفيذ حتى تكتب ملخص التشخيص.**

---

## المرحلة 1 — تنظيف: حذف المكونات غير المطلوبة

### احذف هذه الملفات:
```
sections/FinancialOverviewSection.tsx  → يُحذف (دُمج في التصميم الجديد)
sections/CompanyExpensesSection.tsx    → يُحذف
sections/RecentActivitySection.tsx    → يُحذف
sections/KpiCardsRow.tsx              → يُحذف (يُستبدل ببطاقة مالية مدمجة)
sections/CashFlowSection.tsx          → يُحذف (يُدمج في البطاقة المالية)
```

### أبقِ هذه الملفات (مع تعديلات):
```
sections/ActiveProjectsSection.tsx    → إعادة تصميم كامل
sections/QuickActionsGrid.tsx         → تعديل (6 بطاقات بدل 8)
sections/AlertsSection.tsx            → تعديل حجم فقط
sections/OperationalSection.tsx       → تعديل حجم فقط
```

### أضف ملفات جديدة:
```
sections/FinancePanel.tsx             → بطاقة مالية مدمجة + تدفق نقدي شهري
sections/DidYouKnowCard.tsx           → بطاقة "هل تعلم؟"
```

---

## المرحلة 2 — Dashboard.tsx الجديد

```tsx
export default function Dashboard() {
  // ... data fetching queries (نفس الحالية — لا تغيير)
  
  return (
    <div className="flex flex-col gap-3 p-3 md:p-4 lg:p-5">
      
      {/* ═══ الصف العلوي: المشاريع + المالية (نصفين) ═══ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* النصف الأيسر: المشاريع النشطة */}
        <ActiveProjectsSection 
          projects={projectsList}
          organizationSlug={organizationSlug}
        />
        
        {/* النصف الأيمن: بطاقة مالية + تدفق نقدي */}
        <FinancePanel 
          bankBalance={financeData?.balances?.totalBankBalance}
          cashBalance={financeData?.balances?.totalCashBalance}
          upcomingPayments={dashboardData?.upcoming ?? []}
          organizationSlug={organizationSlug}
          // بيانات التدفق النقدي الشهري
          cashFlowData={...}
        />
      </div>
      
      {/* ═══ الصف الثاني: 6 بطاقات وصول سريع ═══ */}
      <QuickActionsGrid organizationSlug={organizationSlug} />
      
      {/* ═══ الصف الثالث: تنبيهات + تشغيلي + هل تعلم ═══ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <AlertsSection ... />
        <OperationalSection ... />
        <DidYouKnowCard organizationSlug={organizationSlug} />
      </div>
      
    </div>
  );
}
```

---

## المرحلة 3 — تفاصيل كل مكون

### 3.1 ActiveProjectsSection.tsx — إعادة تصميم كامل

**عرض: نصف الصفحة. ارتفاع: يطابق البطاقة المالية المقابلة.**

**الحالة أ — يوجد مشاريع: عرض قائمة مفصّل**

التصميم: card واحدة بعنوان "المشاريع النشطة" وبداخلها قائمة عمودية لكل مشروع:

```tsx
// لكل مشروع — صف في القائمة
<div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
  {/* دائرة التقدم */}
  <div className="relative h-11 w-11 shrink-0">
    <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted/30" />
      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" 
        className={healthColor} // أخضر/أصفر/أحمر
        strokeDasharray={`${progress} 100`} strokeLinecap="round" />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
      {progress}%
    </span>
  </div>
  
  {/* معلومات المشروع */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <p className="text-sm font-semibold truncate">{project.name}</p>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${healthBadge}`}>
        {healthLabel} {/* في الموعد / يحتاج متابعة / متأخر */}
      </span>
    </div>
    <p className="text-[11px] text-muted-foreground truncate">{project.clientName}</p>
  </div>
  
  {/* إحصائيات مختصرة */}
  <div className="flex items-center gap-3 shrink-0">
    {project.openIssues > 0 && (
      <div className="flex items-center gap-1 text-red-500">
        <AlertTriangle className="h-3 w-3" />
        <span className="text-[10px] font-bold">{project.openIssues}</span>
      </div>
    )}
    <div className="text-end">
      <p className="text-xs font-bold"><Currency amount={contractValue} /></p>
      <p className="text-[9px] text-muted-foreground">{daysRemaining} {t("dashboard.daysRemaining")}</p>
    </div>
    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
  </div>
</div>
```

أقصى عدد مشاريع في القائمة: **5** (مع overflow-hidden). إذا أكثر من 5، أضف رابط "عرض الكل" في الأسفل.

**الحالة ب — لا يوجد مشاريع: شاشة ترحيبية**

```tsx
// Empty state — أضف مشروعك الأول
<div className="flex flex-col items-center justify-center h-full text-center p-6">
  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
    <FolderPlus className="h-8 w-8 text-primary" />
  </div>
  <h3 className="text-lg font-bold mb-2">{t("dashboard.addFirstProject")}</h3>
  <p className="text-sm text-muted-foreground mb-4 max-w-xs">
    {t("dashboard.addFirstProjectDesc")}
  </p>
  
  {/* ميزات يمكن الحصول عليها */}
  <div className="grid grid-cols-2 gap-2 mb-4 w-full max-w-sm">
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-start">
      <BarChart3 className="h-4 w-4 text-blue-500 shrink-0" />
      <span className="text-[11px]">{t("dashboard.feature.tracking")}</span>
    </div>
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-start">
      <Receipt className="h-4 w-4 text-green-500 shrink-0" />
      <span className="text-[11px]">{t("dashboard.feature.invoicing")}</span>
    </div>
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-start">
      <Users className="h-4 w-4 text-purple-500 shrink-0" />
      <span className="text-[11px]">{t("dashboard.feature.team")}</span>
    </div>
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-start">
      <FileText className="h-4 w-4 text-amber-500 shrink-0" />
      <span className="text-[11px]">{t("dashboard.feature.documents")}</span>
    </div>
  </div>
  
  <Link href={`/app/${orgSlug}/projects/new`} className="btn-primary">
    <Plus className="h-4 w-4" />
    {t("dashboard.createFirstProject")}
  </Link>
</div>
```

### 3.2 FinancePanel.tsx — بطاقة مالية مدمجة (جديد)

**عرض: نصف الصفحة. مكونة من جزئين عمودياً:**

**الجزء العلوي — 3 mini-cards في صف واحد:**

```tsx
<div className="grid grid-cols-3 gap-2 mb-3">
  {/* رصيد البنك */}
  <Link href={`/app/${orgSlug}/finance/banks`} className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
    <div className="flex items-center gap-1.5 mb-1">
      <Building2 className="h-3.5 w-3.5 text-blue-600" />
      <span className="text-[10px] font-medium text-blue-600/80">{t("dashboard.kpi.bankBalance")}</span>
    </div>
    <p className="text-base font-bold text-blue-700 dark:text-blue-300">
      <Currency amount={Number(bankBalance ?? 0)} />
    </p>
  </Link>
  
  {/* الصندوق */}
  <Link href={`/app/${orgSlug}/finance/banks`} className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 hover:bg-emerald-100 transition-colors">
    <div className="flex items-center gap-1.5 mb-1">
      <Banknote className="h-3.5 w-3.5 text-emerald-600" />
      <span className="text-[10px] font-medium text-emerald-600/80">{t("dashboard.kpi.cashBalance")}</span>
    </div>
    <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
      <Currency amount={Number(cashBalance ?? 0)} />
    </p>
  </Link>
  
  {/* دفعات مستحقة قريباً */}
  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20">
    <div className="flex items-center gap-1.5 mb-1">
      <Clock className="h-3.5 w-3.5 text-amber-600" />
      <span className="text-[10px] font-medium text-amber-600/80">{t("dashboard.alerts.upcomingPayments")}</span>
    </div>
    <p className="text-base font-bold text-amber-700 dark:text-amber-300">
      {upcomingPayments.length}
    </p>
    {upcomingPayments.length > 0 && (
      <p className="text-[9px] text-amber-600/60 mt-0.5 truncate">
        {upcomingPayments[0]?.project?.name}
      </p>
    )}
  </div>
</div>
```

**الجزء السفلي — مخطط التدفق النقدي الشهري:**

```tsx
// مخطط التدفق النقدي — شهري (آخر 6 أشهر أو 12 شهر)
// استخدم financialTrend data من dashboard.getAll
// أو أنشئ query جديد إذا لم تكن البيانات الشهرية متاحة

<div className="flex-1 min-h-0">
  <div className="flex items-center justify-between mb-2">
    <span className="text-[11px] font-semibold text-muted-foreground">
      {t("dashboard.cashFlow.title")} {/* غيّر النص ليكون "التدفق النقدي" بدون "آخر 7 أيام" */}
    </span>
    <Link href={`/app/${orgSlug}/finance`} className="text-[10px] text-primary">
      {t("dashboard.cashFlow.goToFinance")}
    </Link>
  </div>
  
  {/* Recharts AreaChart — بيانات شهرية */}
  <ChartContainer config={chartConfig} className="h-[140px] w-full">
    <AreaChart data={monthlyData}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={9} />
      <YAxis hide />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Area type="monotone" dataKey="income" stroke="#0ea5e9" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
      <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={1.5} dot={false} />
    </AreaChart>
  </ChartContainer>
</div>
```

**مصدر بيانات التدفق الشهري:**
- أولاً: تحقق هل `financialTrend` من `dashboard.getAll` يحتوي على بيانات شهرية (income/expense per month)
- إذا نعم: استخدمها مباشرة
- إذا لا: استخدم `finance.reports.cashFlow` endpoint مع `periodType: 'monthly'`
- **لا تستخدم mock/hardcoded data أبداً**

### 3.3 QuickActionsGrid.tsx — 6 بطاقات بدل 8

**احذف** بطاقتين:
1. ~~المنشأة~~ (حُذفت)
2. ~~تقرير يومي~~ (حُذفت)

**أبقِ 6 بطاقات:**
1. العملاء المحتملون (+ عميل محتمل جديد)
2. دراسات الكميات (+ حساب الكميات)
3. التسعير (+ عرض سعر جديد)
4. الفواتير (+ إنشاء فاتورة)
5. المقبوضات (+ إضافة دفعة)
6. المصروفات (+ إضافة مصروف)

**التصميم:**
```tsx
// Grid: 6 أعمدة على الديسكتوب، 3 على التابلت، 2 على الموبايل
<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
```

**تقليل الارتفاع:**
- الارتفاع الحالي فيه padding كبير → قلّل `p-4` إلى `p-2.5`
- الأيقونة: من `p-3` إلى `p-2`، من `h-6 w-6` إلى `h-5 w-5`
- النص: من `text-sm` إلى `text-xs`
- قسم الإجراء السفلي: من `p-3` إلى `p-2`

### 3.4 AlertsSection.tsx — تعديل حجم

**لا تغيير في المنطق** — فقط:
- اجعلها تأخذ `1/3` من العرض (ثلث الصفحة)
- قلّل ارتفاعها ليتناسب مع البطاقتين المجاورتين
- الحد الأقصى للعناصر المعروضة: 3 (بدل عرض الكل)
- إذا لم يكن هناك تنبيهات، اعرض: ✅ "كل شيء على ما يرام"

### 3.5 OperationalSection.tsx — تعديل حجم

**لا تغيير في المنطق** — فقط:
- تأخذ `1/3` من العرض
- قلّل الارتفاع: حجم الخط أصغر، padding أقل
- 4 mini-stats + leads pipeline (إذا وجد) + توزيع أنواع المشاريع
- كل شيء مضغوط ليتناسب مع ارتفاع البطاقتين المجاورتين

### 3.6 DidYouKnowCard.tsx — بطاقة "هل تعلم؟" (جديد)

**المفهوم:** بطاقة جذابة تعرض معلومة واحدة من مكتبة 30 معلومة عن ميزات مسار. تتغير المعلومة كل مرة يفتح المستخدم الداشبورد.

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lightbulb, ArrowLeft, Sparkles } from "lucide-react";

interface Tip {
  key: string;      // مفتاح الترجمة
  icon: string;     // اسم الأيقونة
  href: string;     // الرابط للميزة
  gradient: string; // لون الخلفية
}

const TIPS: Tip[] = [
  { key: "quantitySmart", icon: "Calculator", href: "/pricing/studies", gradient: "from-blue-500/10 to-cyan-500/10" },
  { key: "aiAssistant", icon: "Bot", href: "/chatbot", gradient: "from-purple-500/10 to-pink-500/10" },
  { key: "ownerPortal", icon: "Globe", href: "/projects", gradient: "from-emerald-500/10 to-teal-500/10" },
  { key: "invoiceTemplates", icon: "FileText", href: "/finance/templates", gradient: "from-amber-500/10 to-orange-500/10" },
  { key: "zatcaQr", icon: "QrCode", href: "/finance/invoices", gradient: "from-green-500/10 to-emerald-500/10" },
  { key: "ganttChart", icon: "GanttChart", href: "/projects", gradient: "from-indigo-500/10 to-blue-500/10" },
  { key: "subcontractors", icon: "Users", href: "/projects", gradient: "from-rose-500/10 to-pink-500/10" },
  { key: "dailyReports", icon: "ClipboardCheck", href: "/projects", gradient: "from-sky-500/10 to-blue-500/10" },
  { key: "criticalPath", icon: "Route", href: "/projects", gradient: "from-red-500/10 to-orange-500/10" },
  { key: "leadsTracking", icon: "Target", href: "/pricing/leads", gradient: "from-violet-500/10 to-purple-500/10" },
  { key: "payrollSystem", icon: "Wallet", href: "/company/payroll", gradient: "from-teal-500/10 to-cyan-500/10" },
  { key: "documentVersions", icon: "FolderOpen", href: "/projects", gradient: "from-blue-500/10 to-indigo-500/10" },
  { key: "approvalWorkflow", icon: "CheckCircle", href: "/projects", gradient: "from-green-500/10 to-lime-500/10" },
  { key: "cashFlow", icon: "TrendingUp", href: "/finance/reports", gradient: "from-cyan-500/10 to-blue-500/10" },
  { key: "changeOrders", icon: "RefreshCw", href: "/projects", gradient: "from-amber-500/10 to-yellow-500/10" },
  { key: "buildingConfig", icon: "Building", href: "/pricing/studies", gradient: "from-slate-500/10 to-gray-500/10" },
  { key: "mepEngine", icon: "Zap", href: "/pricing/studies", gradient: "from-yellow-500/10 to-amber-500/10" },
  { key: "finishingCalc", icon: "PaintBucket", href: "/pricing/studies", gradient: "from-pink-500/10 to-rose-500/10" },
  { key: "profitability", icon: "PieChart", href: "/projects", gradient: "from-emerald-500/10 to-green-500/10" },
  { key: "quotationGen", icon: "Send", href: "/pricing/quotations", gradient: "from-blue-500/10 to-sky-500/10" },
  { key: "employeeLeaves", icon: "Calendar", href: "/company/leaves", gradient: "from-indigo-500/10 to-violet-500/10" },
  { key: "assetTracking", icon: "Package", href: "/company/assets", gradient: "from-orange-500/10 to-red-500/10" },
  { key: "bankTransfers", icon: "ArrowLeftRight", href: "/finance/banks", gradient: "from-teal-500/10 to-emerald-500/10" },
  { key: "multiLanguage", icon: "Languages", href: "/settings/general", gradient: "from-purple-500/10 to-indigo-500/10" },
  { key: "darkMode", icon: "Moon", href: "/settings/general", gradient: "from-gray-500/10 to-slate-500/10" },
  { key: "rolePermissions", icon: "Shield", href: "/settings/roles", gradient: "from-red-500/10 to-rose-500/10" },
  { key: "claimsWorkflow", icon: "FileStack", href: "/projects", gradient: "from-sky-500/10 to-cyan-500/10" },
  { key: "boqSummary", icon: "Table", href: "/pricing/studies", gradient: "from-lime-500/10 to-green-500/10" },
  { key: "heightDerivation", icon: "Ruler", href: "/pricing/studies", gradient: "from-blue-500/10 to-purple-500/10" },
  { key: "teamChat", icon: "MessageCircle", href: "/projects", gradient: "from-pink-500/10 to-purple-500/10" },
];

export function DidYouKnowCard({ organizationSlug }: { organizationSlug: string }) {
  const t = useTranslations("dashboard");
  
  // حساب الـ tip index بناءً على اليوم (يتغير كل يوم)
  // أو بناءً على عدد مرات فتح الداشبورد (localStorage)
  const [tipIndex, setTipIndex] = useState(0);
  
  useEffect(() => {
    // استخدم localStorage لتتبع آخر tip تم عرضه
    const stored = localStorage.getItem("masar-tip-index");
    const idx = stored ? (parseInt(stored, 10) + 1) % TIPS.length : 0;
    setTipIndex(idx);
    localStorage.setItem("masar-tip-index", String(idx));
  }, []);
  
  const tip = TIPS[tipIndex];
  const fullHref = `/app/${organizationSlug}${tip.href}`;
  
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${tip.gradient} p-4 flex flex-col`}>
      {/* خلفية زخرفية */}
      <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 start-0 w-20 h-20 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-bold text-primary">
          {t("didYouKnow.title")}
        </span>
        <span className="text-[9px] text-muted-foreground ms-auto">
          {tipIndex + 1}/{TIPS.length}
        </span>
      </div>
      
      {/* المحتوى */}
      <div className="flex-1 relative z-10">
        <p className="text-sm font-medium text-foreground/90 leading-relaxed mb-3">
          {t(`didYouKnow.tips.${tip.key}`)}
        </p>
      </div>
      
      {/* رابط الميزة */}
      <Link 
        href={fullHref} 
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline relative z-10 mt-auto"
      >
        <span>{t("didYouKnow.tryIt")}</span>
        <ArrowLeft className="h-3 w-3" />
      </Link>
    </div>
  );
}
```

---

## المرحلة 4 — الترجمة

### أضف في ar.json:

```json
{
  "dashboard": {
    "addFirstProject": "أضف مشروعك الأول",
    "addFirstProjectDesc": "ابدأ بإضافة مشروعك الأول واستمتع بإدارة كاملة لمشاريعك من مكان واحد",
    "createFirstProject": "إنشاء مشروع",
    "feature": {
      "tracking": "تتبع التقدم والتنفيذ",
      "invoicing": "فواتير ومطالبات",
      "team": "إدارة الفريق",
      "documents": "مستندات وموافقات"
    },
    "daysRemaining": "يوم متبقي",
    "didYouKnow": {
      "title": "هل تعلم؟",
      "tryIt": "جرّبها الآن",
      "tips": {
        "quantitySmart": "يمكنك حساب كميات المشاريع الإنشائية تلقائياً — قواعد، أعمدة، بلاطات، جدران — وتسعيرها بطريقة ذكية من مكان واحد",
        "aiAssistant": "المساعد الذكي في مسار يمكنه الإجابة على أي سؤال عن مشاريعك أو حساباتك المالية فوراً — جرّب أن تسأله!",
        "ownerPortal": "يمكنك إنشاء بوابة خاصة لمالك المشروع يتابع منها التقدم والمدفوعات والجدول الزمني بدون الحاجة لحساب في مسار",
        "invoiceTemplates": "صمّم قوالب فواتيرك وعروض أسعارك بالسحب والإفلات — أضف شعارك وألوانك ورمز QR للضريبة",
        "zatcaQr": "مسار يولّد رمز QR لهيئة الزكاة والدخل تلقائياً على كل فاتورة ضريبية — متوافق مع المرحلة الأولى",
        "ganttChart": "تابع جدولك الزمني بمخطط جانت تفاعلي مع سحب وإفلات — وحلّل المسار الحرج لمشروعك",
        "subcontractors": "أدِر عقود مقاولي الباطن بالكامل — بنود، مطالبات، مدفوعات، نسب احتفاز — من داخل كل مشروع",
        "dailyReports": "وثّق تقارير الموقع اليومية بالصور والملاحظات — الطقس، العمالة، المعوقات، ونسبة الإنجاز",
        "criticalPath": "مسار يحسب المسار الحرج لمشروعك تلقائياً ويُظهر لك الأنشطة التي تؤثر على موعد التسليم",
        "leadsTracking": "تتبع العملاء المحتملين من أول تواصل حتى كسب المشروع — بخط أنابيب بصري واضح",
        "payrollSystem": "أنشئ دورات رواتب شهرية وأضف البدلات والخصومات لكل موظف — ثم اعتمدها بضغطة زر",
        "documentVersions": "ارفع مستندات المشروع مع تتبع الإصدارات — ويمكنك الرجوع لأي إصدار سابق في أي وقت",
        "approvalWorkflow": "أنشئ طلبات موافقة لمستندات المشروع وحدّد المعتمدين — مع إشعارات تلقائية",
        "cashFlow": "تابع التدفق النقدي لمنشأتك بتقارير تفصيلية — يومي، أسبوعي، أو شهري — مع رصيد تراكمي",
        "changeOrders": "سجّل أوامر التغيير على المشاريع مع تأثيرها على القيمة والجدول — واعتمدها إلكترونياً",
        "buildingConfig": "معالج تهيئة المبنى يحسب ارتفاعات الأعمدة والجدران تلقائياً من مناسيب الأدوار — لا حاجة لحساب يدوي",
        "mepEngine": "محرك كميات الكهرباء والسباكة والتكييف يحسب الاحتياجات تلقائياً بناءً على مساحات ونوع المبنى",
        "finishingCalc": "حاسبة التشطيبات الذكية — بلاط، دهان، جبس، رخام — تحسب الكميات والتكاليف مع نسب الهدر",
        "profitability": "تقرير ربحية كل مشروع يقارن الإيرادات بالتكاليف المباشرة ومصاريف الباطن — لتعرف أرباحك الحقيقية",
        "quotationGen": "حوّل دراسة الكميات والتسعير مباشرة إلى عرض سعر احترافي جاهز للإرسال — بضغطة واحدة",
        "employeeLeaves": "نظام إجازات متكامل — 8 أنواع إجازات سعودية افتراضية مع أرصدة وطلبات واعتماد",
        "assetTracking": "تتبع أصول منشأتك — معدات، مركبات، أدوات — مع الاستهلاك وتواريخ انتهاء التأمين",
        "bankTransfers": "حوّل بين حساباتك البنكية وصناديقك النقدية مباشرة — يتم تحديث الأرصدة تلقائياً",
        "multiLanguage": "مسار يدعم العربية والإنجليزية بالكامل — بدّل اللغة في أي وقت بدون إعادة تحميل",
        "darkMode": "فعّل الوضع الداكن لراحة عينيك — مسار يدعم الوضع الفاتح والداكن ووضع النظام",
        "rolePermissions": "أنشئ أدوار مخصصة لفريقك — حدد من يرى المالية، من يُعدّل المشاريع، من يعتمد المستندات",
        "claimsWorkflow": "أنشئ مستخلصات دورية ونهائية لمشاريعك — مع بنود تفصيلية ودورة اعتماد كاملة",
        "boqSummary": "جدول ملخص الكميات يعرض كل مواد المشروع — خرسانة، حديد، بلوك — مفلترة حسب الدور والعنصر",
        "heightDerivation": "أدخل مناسيب الأدوار فقط — مسار يحسب ارتفاعات الأعمدة وجدران البلوك والأعناق تلقائياً",
        "teamChat": "محادثة فورية داخل كل مشروع — تواصل مع فريقك ومع مالك المشروع من مكان واحد"
      }
    }
  }
}
```

### أضف في en.json:

```json
{
  "dashboard": {
    "addFirstProject": "Add Your First Project",
    "addFirstProjectDesc": "Start by adding your first project and enjoy full project management from one place",
    "createFirstProject": "Create Project",
    "feature": {
      "tracking": "Progress & execution tracking",
      "invoicing": "Invoices & claims",
      "team": "Team management",
      "documents": "Documents & approvals"
    },
    "daysRemaining": "days remaining",
    "didYouKnow": {
      "title": "Did you know?",
      "tryIt": "Try it now",
      "tips": {
        "quantitySmart": "You can calculate structural quantities automatically — foundations, columns, slabs, walls — and price them smartly from one place",
        "aiAssistant": "Masar's AI assistant can answer any question about your projects or finances instantly — try asking it!",
        "ownerPortal": "Create a private portal for the project owner to track progress, payments, and timeline without needing a Masar account",
        "invoiceTemplates": "Design your invoice and quotation templates with drag-and-drop — add your logo, colors, and ZATCA QR code",
        "zatcaQr": "Masar auto-generates ZATCA QR codes on every tax invoice — Phase 1 compliant",
        "ganttChart": "Track your timeline with an interactive Gantt chart with drag-and-drop — and analyze your project's critical path",
        "subcontractors": "Manage subcontracts fully — items, claims, payments, retention — all within each project",
        "dailyReports": "Document daily site reports with photos and notes — weather, labor, obstacles, and progress percentage",
        "criticalPath": "Masar calculates your project's critical path automatically and shows activities that affect the delivery date",
        "leadsTracking": "Track potential clients from first contact to winning the project — with a visual pipeline",
        "payrollSystem": "Create monthly payroll runs and add allowances and deductions per employee — then approve with one click",
        "documentVersions": "Upload project documents with version tracking — and revert to any previous version anytime",
        "approvalWorkflow": "Create approval requests for project documents and assign approvers — with automatic notifications",
        "cashFlow": "Monitor your cash flow with detailed reports — daily, weekly, or monthly — with cumulative balance",
        "changeOrders": "Record change orders on projects with their impact on value and schedule — and approve electronically",
        "buildingConfig": "The building config wizard auto-calculates column and wall heights from floor elevations — no manual calculation needed",
        "mepEngine": "The MEP engine calculates electrical, plumbing, and HVAC needs automatically based on areas and building type",
        "finishingCalc": "Smart finishing calculator — tiles, paint, plaster, marble — calculates quantities and costs with waste percentages",
        "profitability": "Per-project profitability report compares revenue to direct costs and subcontractor expenses — know your real profits",
        "quotationGen": "Convert quantity study and pricing directly into a professional quotation ready to send — with one click",
        "employeeLeaves": "Complete leave system — 8 Saudi default leave types with balances, requests, and approval",
        "assetTracking": "Track your assets — equipment, vehicles, tools — with depreciation and insurance expiry dates",
        "bankTransfers": "Transfer between your bank accounts and cash boxes directly — balances update automatically",
        "multiLanguage": "Masar supports Arabic and English fully — switch languages anytime without reloading",
        "darkMode": "Enable dark mode for eye comfort — Masar supports light, dark, and system modes",
        "rolePermissions": "Create custom roles for your team — control who sees finance, who edits projects, who approves documents",
        "claimsWorkflow": "Create interim and final claims for your projects — with detailed items and full approval workflow",
        "boqSummary": "BOQ summary table shows all project materials — concrete, rebar, blocks — filtered by floor and element",
        "heightDerivation": "Just enter floor elevations — Masar auto-calculates column heights, block wall heights, and neck columns",
        "teamChat": "Real-time chat within each project — communicate with your team and the project owner from one place"
      }
    }
  }
}
```

---

## المرحلة 5 — تحديث Skeleton

```tsx
export function HomeDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3 md:p-4 lg:p-5">
      {/* الصف العلوي */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>
      {/* 6 بطاقات وصول سريع */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[80px] rounded-xl" />
        ))}
      </div>
      {/* الصف السفلي */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-[200px] rounded-2xl" />
      </div>
    </div>
  );
}
```

---

## المرحلة 6 — التحقق والبناء

```bash
# 1. Type check
pnpm --filter web type-check

# 2. Build
pnpm build

# 3. تحقق يدوي:
#    - الداشبورد يظهر في صفحة واحدة بدون تمرير (أو بأقل تمرير)
#    - المشاريع النشطة تعرض كقائمة مع تقدم وصحة
#    - البطاقة المالية تعرض 3 أرقام + مخطط شهري
#    - 6 بطاقات وصول سريع بعرض كامل
#    - 3 بطاقات سفلية متساوية الارتفاع
#    - "هل تعلم" تعرض معلومة مختلفة كل مرة
#    - RTL يعمل
#    - Dark mode يعمل
#    - Responsive: الموبايل → التابلت → الديسكتوب
#    - Empty state: إذا لا مشاريع تظهر "أضف مشروعك الأول"
```

---

## ملخص التغييرات

| المكون | الحالة | التفاصيل |
|--------|--------|----------|
| KpiCardsRow | **حُذف** | استُبدل بـ FinancePanel |
| FinancialOverviewSection | **حُذف** | دُمج في FinancePanel |
| CashFlowSection (السفلية) | **حُذف** | دُمج في FinancePanel (شهري) |
| CompanyExpensesSection | **حُذف** | — |
| RecentActivitySection | **حُذف** | — |
| ActiveProjectsSection | **إعادة تصميم** | قائمة مفصّلة + empty state |
| QuickActionsGrid | **تعديل** | 6 بطاقات بدل 8، أصغر |
| AlertsSection | **تعديل حجم** | 1/3 عرض |
| OperationalSection | **تعديل حجم** | 1/3 عرض |
| FinancePanel | **جديد** | 3 mini-cards + تدفق شهري |
| DidYouKnowCard | **جديد** | 30 معلومة متغيرة |
