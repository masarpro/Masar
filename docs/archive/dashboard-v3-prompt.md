# برومبت تحسين الداشبورد v3 — تكبير الخطوط + تصميم احترافي

## السياق

الداشبورد v2 تم تنفيذه بنجاح. المطلوب الآن تحسينات بصرية وإصلاحات:
1. الخطوط صغيرة جداً في كل الداشبورد
2. إضافة رأس صفحة (ترحيب + اسم المنشأة)
3. بطاقة المشاريع النشطة مملة — تحتاج تصميم احترافي
4. مخطط التدفق النقدي فارغ — يجب أن يظهر حتى بدون بيانات
5. ترتيب بطاقات الوصول السريع + زيادة عرضها
6. ضبط الصفحة لتكون كاملة بدون فراغات أو تمرير

## القواعد

- **اقرأ كل ملف قبل تعديله**
- **RTL**: `ms-`/`me-`/`ps-`/`pe-` فقط
- **لا تلمس الـ backend أبداً**
- `tsc --noEmit` بعد الانتهاء

## القائمة الحمراء
```
packages/api/
packages/database/
apps/web/modules/saas/pricing/
```

---

## المرحلة 0 — اقرأ أولاً

اقرأ هذه الملفات بالكامل:
```
apps/web/modules/saas/dashboard/components/Dashboard.tsx
apps/web/modules/saas/dashboard/components/sections/ActiveProjectsSection.tsx
apps/web/modules/saas/dashboard/components/sections/FinancePanel.tsx
apps/web/modules/saas/dashboard/components/sections/QuickActionsGrid.tsx
apps/web/modules/saas/dashboard/components/sections/AlertsSection.tsx
apps/web/modules/saas/dashboard/components/sections/OperationalSection.tsx
apps/web/modules/saas/dashboard/components/sections/DidYouKnowCard.tsx
```

اكتب ملخصاً بالأحجام الحالية لكل خط في كل مكون قبل التعديل.

---

## المرحلة 1 — إضافة Header ترحيبي

### في Dashboard.tsx — أضف صف header قبل كل شيء:

```tsx
// أول شيء داخل الـ return div
<div className="flex items-center justify-between mb-1">
  {/* يمين: ترحيب + اسم المستخدم */}
  <div>
    <h1 className="text-xl font-bold text-foreground">
      {t("dashboard.welcome.greeting", { name: session?.user?.name?.split(" ")[0] || "" })}
    </h1>
    <p className="text-sm text-muted-foreground">
      {t("dashboard.welcome.subtitle")}
    </p>
  </div>
  
  {/* وسط: اسم المنشأة */}
  <div className="hidden md:flex items-center gap-2">
    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
      <Building2 className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">{activeOrganization?.name}</p>
      <p className="text-xs text-muted-foreground">{activeOrganization?.metadata?.city || ""}</p>
    </div>
  </div>
  
  {/* يسار: التاريخ */}
  <div className="text-start hidden sm:block">
    <p className="text-sm font-medium text-foreground">
      {new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date())}
    </p>
    <p className="text-xs text-muted-foreground">
      {new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
    </p>
  </div>
</div>
```

**ملاحظة:** تحتاج `useSession()` أو `useActiveOrganization()` للحصول على اسم المستخدم. اقرأ الـ hooks الموجودة في الملف وحدد أيها متاح. إذا لم يكن `session` متاحاً مباشرة، ابحث عن hook مثل `useSession` من better-auth أو `useUser`.

### ترجمة:
```json
// ar.json
"welcome": {
  "greeting": "أهلاً {name} 👋",
  "subtitle": "إليك ملخص اليوم",
  "allGood": "كل شيء على ما يرام ✅"
}

// en.json  
"welcome": {
  "greeting": "Hello {name} 👋",
  "subtitle": "Here's your daily summary",
  "allGood": "Everything looks good ✅"
}
```

---

## المرحلة 2 — تكبير الخطوط في كل المكونات

### القاعدة العامة لأحجام الخطوط:

| العنصر | الحجم الحالي (صغير جداً) | الحجم الجديد |
|--------|-------------------------|-------------|
| عناوين البطاقات | `text-[11px]` أو `text-xs` | `text-sm font-semibold` |
| القيم المالية الكبيرة | `text-base` أو `text-lg` | `text-xl font-bold` |
| القيم المالية الثانوية | `text-sm` | `text-base font-bold` |
| نصوص فرعية / labels | `text-[9px]` أو `text-[10px]` | `text-xs` |
| أيقونات labels | `text-[10px]` | `text-xs` |
| روابط | `text-[10px]` | `text-xs font-medium` |
| أرقام badges | `text-[9px]` | `text-xs font-bold` |
| عناوين أقسام | `text-xs font-semibold` | `text-sm font-bold` |

### 2.1 FinancePanel.tsx — تكبير الخطوط

```
تغييرات محددة:
- عنوان كل mini-card: text-[10px] → text-xs
- القيمة المالية: text-base → text-xl font-bold
- عنوان "التدفق النقدي": text-[11px] → text-sm font-semibold
- رابط "المالية": text-[10px] → text-xs
- labels المحاور في المخطط: fontSize={9} → fontSize={11}
```

### 2.2 ActiveProjectsSection.tsx — تكبير

```
- عنوان "المشاريع النشطة": text-sm → text-base font-bold
- اسم المشروع: text-sm → text-base font-semibold
- اسم العميل: text-[11px] → text-sm
- القيمة المالية: text-xs → text-sm font-bold
- "يوم متبقي": text-[9px] → text-xs
- نسبة التقدم داخل الدائرة: text-[10px] → text-xs font-bold
- شارات الصحة: text-[9px] → text-[11px]
- عدد المشاكل: text-[10px] → text-xs
- رابط "عرض الكل": text-[10px] → text-xs
```

### 2.3 QuickActionsGrid.tsx — تكبير

```
- اسم البطاقة: text-xs → text-sm font-medium
- label الإجراء (+): text-[10px] → text-xs
- الأيقونة: h-5 w-5 → h-6 w-6
- padding الأيقونة: p-2 → p-2.5
```

### 2.4 AlertsSection.tsx — تكبير

```
- عنوان القسم: text-xs → text-sm font-bold
- عنوان التنبيه: text-[11px] → text-sm font-medium
- القيمة المالية: text-[10px] → text-xs font-bold
- العدد: text-sm → text-lg font-bold
- أيقونات: h-3.5 w-3.5 → h-4 w-4
- "كل شيء على ما يرام": text-sm → text-base
```

### 2.5 OperationalSection.tsx — تكبير

```
- عنوان القسم: text-xs → text-sm font-bold
- أيقونة العنوان: h-3.5 → h-4
- labels الإحصائيات: text-[9px] → text-xs
- أرقام الإحصائيات: text-xs → text-base font-bold
- عنوان "خط العملاء": text-[10px] → text-xs
- أرقام pipeline: text-[8px] → text-[10px]
- ارتفاع pipeline bar: h-5 → h-6
- عنوان "المشاريع حسب النوع": text-[10px] → text-xs
- أسماء الأنواع: text-[9px] → text-xs
- أعداد/نسب: text-[9px]/text-[8px] → text-xs/text-[10px]
- dots: h-1.5 w-1.5 → h-2 w-2
```

### 2.6 DidYouKnowCard.tsx — تكبير

```
- عنوان "هل تعلم؟": text-xs → text-sm font-bold
- العداد: text-[9px] → text-xs
- نص المعلومة: text-sm → text-base leading-relaxed
- رابط "جرّبها الآن": text-xs → text-sm font-semibold
```

---

## المرحلة 3 — إعادة تصميم بطاقة المشاريع النشطة

### التصميم الجديد — بطاقة احترافية لكل مشروع:

حوّل من قائمة بسيطة إلى بطاقات مصغّرة داخل القائمة:

```tsx
// لكل مشروع
<Link
  href={`/app/${organizationSlug}/projects/${project.id}`}
  className="group relative flex items-center gap-4 p-3 rounded-xl border border-border/30 bg-card/50 hover:bg-card hover:border-border/60 hover:shadow-md transition-all duration-300"
>
  {/* شريط صحة جانبي */}
  <div className={`absolute top-2 bottom-2 start-0 w-1 rounded-full ${
    health === 'ON_TRACK' ? 'bg-emerald-500' : 
    health === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'
  }`} />
  
  {/* دائرة التقدم — أكبر وأوضح */}
  <div className="relative h-14 w-14 shrink-0 ms-2">
    <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" 
        className="stroke-muted/20" />
      <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5"
        className={healthStrokeColor}
        strokeDasharray={`${progress} 100`} 
        strokeLinecap="round" />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
      {progress}%
    </span>
  </div>
  
  {/* معلومات المشروع — مُوسّعة */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-1">
      <p className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
        {project.name}
      </p>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${healthBadgeClasses}`}>
        {healthLabel}
      </span>
    </div>
    <p className="text-sm text-muted-foreground truncate">{project.clientName || t("dashboard.noClient")}</p>
    
    {/* صف معلومات إضافية */}
    <div className="flex items-center gap-4 mt-2">
      <div className="flex items-center gap-1">
        <Banknote className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-sm font-bold text-foreground">
          <Currency amount={contractValue} />
        </span>
      </div>
      
      {project.openIssues > 0 && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-xs font-bold text-red-600">{project.openIssues}</span>
          <span className="text-xs text-red-500/70">{t("dashboard.issues")}</span>
        </div>
      )}
      
      {days !== null && (
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs text-muted-foreground">
            {days > 0 ? `${days} ${t("dashboard.daysRemaining")}` : t("dashboard.projectEnded")}
          </span>
        </div>
      )}
    </div>
  </div>
  
  {/* سهم التنقل */}
  <ChevronLeft className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
</Link>
```

**عنوان القسم:**
```tsx
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-2">
    <div className="p-1.5 rounded-lg bg-primary/10">
      <FolderOpen className="h-4.5 w-4.5 text-primary" />
    </div>
    <h2 className="text-base font-bold text-foreground">{t("dashboard.activeProjects")}</h2>
    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
      {projects.length}
    </span>
  </div>
  <Link href={`/app/${orgSlug}/projects`} className="text-xs font-medium text-primary hover:underline">
    {t("dashboard.viewAll")} ←
  </Link>
</div>
```

**أقصى عدد مشاريع معروضة:** 4 (ليتناسب مع الارتفاع)

---

## المرحلة 4 — إصلاح مخطط التدفق النقدي

### المشكلة: إذا لم تكن هناك بيانات مالية، يظهر "لا توجد بيانات كافية" والمخطط يختفي

### الحل: اعرض المخطط دائماً — حتى لو بخط مستقيم على الصفر

في `FinancePanel.tsx`:

```tsx
// إذا لم تكن هناك بيانات، أنشئ بيانات افتراضية (أصفار) لآخر 6 أشهر
const chartData = useMemo(() => {
  if (financialTrend && financialTrend.length > 0) {
    return financialTrend;
  }
  
  // بيانات افتراضية — آخر 6 أشهر بأصفار
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(d),
      income: 0,
      expense: 0,
    });
  }
  return months;
}, [financialTrend, locale]);

// في الـ JSX — احذف الشرط الذي يُظهر "لا توجد بيانات"
// واعرض المخطط دائماً:
<ChartContainer config={chartConfig} className="h-[160px] w-full">
  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
    {/* ... نفس المخطط الحالي ... */}
  </AreaChart>
</ChartContainer>
```

**احذف** تماماً أي block يعرض "لا توجد بيانات كافية" ويُخفي المخطط.

---

## المرحلة 5 — إعادة ترتيب بطاقات الوصول السريع

### الترتيب الجديد (من اليمين لليسار في RTL):

```
1. المصروفات (أقصى اليمين)
2. المقبوضات
3. عروض الأسعار (بدل التسعير)
4. الفواتير
5. دراسات الكميات
6. العملاء المحتملون (أقصى اليسار)
```

### في QuickActionsGrid.tsx — أعد ترتيب الـ array:

```tsx
const quickActions = [
  // 1. المصروفات
  {
    icon: TrendingDown,
    sectionLabel: t("dashboard.actions.expenses"),
    actionLabel: t("dashboard.actions.addExpense"),
    browsePath: `/app/${organizationSlug}/finance/expenses`,
    createPath: `/app/${organizationSlug}/finance/expenses/new`,
    iconColor: "text-rose-500 dark:text-rose-400",
    bgColor: "bg-rose-50/80 dark:bg-rose-950/30",
    hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-900/50",
    borderColor: "border-rose-200/50 dark:border-rose-800/50",
  },
  // 2. المقبوضات
  {
    icon: TrendingUp,
    sectionLabel: t("dashboard.actions.payments"),
    actionLabel: t("dashboard.actions.addPayment"),
    browsePath: `/app/${organizationSlug}/finance/payments`,
    createPath: `/app/${organizationSlug}/finance/payments/new`,
    iconColor: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50/80 dark:bg-emerald-950/30",
    hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
    borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
  },
  // 3. عروض الأسعار
  {
    icon: FileText, // أو Send
    sectionLabel: t("dashboard.actions.quotations"),
    actionLabel: t("dashboard.actions.newQuotation"),
    browsePath: `/app/${organizationSlug}/pricing/quotations`,
    createPath: `/app/${organizationSlug}/pricing/quotations/new`,
    iconColor: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50/80 dark:bg-blue-950/30",
    hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
    borderColor: "border-blue-200/50 dark:border-blue-800/50",
  },
  // 4. الفواتير
  {
    icon: Receipt,
    sectionLabel: t("dashboard.actions.invoices"),
    actionLabel: t("dashboard.actions.newInvoice"),
    browsePath: `/app/${organizationSlug}/finance/invoices`,
    createPath: `/app/${organizationSlug}/finance/invoices/new`,
    iconColor: "text-sky-500 dark:text-sky-400",
    bgColor: "bg-sky-50/80 dark:bg-sky-950/30",
    hoverBg: "hover:bg-sky-100 dark:hover:bg-sky-900/50",
    borderColor: "border-sky-200/50 dark:border-sky-800/50",
  },
  // 5. دراسات الكميات
  {
    icon: Calculator,
    sectionLabel: t("dashboard.actions.quantities"),
    actionLabel: t("dashboard.actions.newStudy"),
    browsePath: `/app/${organizationSlug}/pricing/studies`,
    createPath: `/app/${organizationSlug}/pricing/studies/new`,
    iconColor: "text-violet-500 dark:text-violet-400",
    bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
    hoverBg: "hover:bg-violet-100 dark:hover:bg-violet-900/50",
    borderColor: "border-violet-200/50 dark:border-violet-800/50",
  },
  // 6. العملاء المحتملون
  {
    icon: Users,
    sectionLabel: t("dashboard.actions.leads"),
    actionLabel: t("dashboard.actions.newLead"),
    browsePath: `/app/${organizationSlug}/pricing/leads`,
    createPath: `/app/${organizationSlug}/pricing/leads/new`,
    iconColor: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50/80 dark:bg-orange-950/30",
    hoverBg: "hover:bg-orange-100 dark:hover:bg-orange-900/50",
    borderColor: "border-orange-200/50 dark:border-orange-800/50",
  },
];
```

### تكبير عرض البطاقات:

```tsx
// تغيير الـ grid — بدل gap-2 اجعلها gap-3، والبطاقات تأخذ عرض أكبر
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
```

### تكبير محتوى البطاقات:

```tsx
// القسم العلوي
<Link className="flex flex-col items-center gap-2 border-b p-3 transition-colors ...">
  <div className="rounded-lg bg-card/60 p-2.5 ...">
    <Icon className="h-6 w-6" />  {/* بدل h-5 w-5 */}
  </div>
  <span className="text-center text-sm font-medium ...">  {/* بدل text-xs */}
    {action.sectionLabel}
  </span>
</Link>

// القسم السفلي (الإجراء)
<Link className="flex items-center justify-center gap-2 bg-card/50 p-2.5 ...">
  <Plus className="h-4 w-4 ..." />  {/* بدل h-3.5 */}
  <span className="text-xs font-medium ...">  {/* بدل text-[10px] */}
    {action.actionLabel}
  </span>
</Link>
```

---

## المرحلة 6 — ضبط الارتفاعات لملء الصفحة

### الهدف: الصفحة تملأ viewport بالكامل بدون تمرير

```tsx
// في Dashboard.tsx — استخدم min-h-screen و flex-1 للتوزيع
<div className="flex min-h-[calc(100vh-64px)] flex-col gap-3 p-3 md:p-4" dir="rtl">
  
  {/* Header — ارتفاع ثابت */}
  {/* ~48px */}
  
  {/* الصف العلوي — يأخذ المساحة المتاحة */}
  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 flex-1 min-h-0">
    {/* المشاريع والمالية */}
  </div>
  
  {/* بطاقات الوصول — ارتفاع ثابت */}
  {/* ~90px */}
  
  {/* الصف السفلي — ارتفاع ثابت */}
  {/* ~220px */}
  
</div>
```

### ارتفاعات محددة:

```
Header:        ~48px
الصف العلوي:   flex-1 (يملأ المتبقي — تقريباً 340-380px)
Quick Actions: ~90px (ارتفاع ثابت)
الصف السفلي:  ~220px (ارتفاع ثابت)
─────────────────
المجموع:       ~viewport height - navbar (64px)
```

### ضبط ارتفاع البطاقات العلوية:

```tsx
// المشاريع النشطة
<div className="flex flex-col h-full overflow-hidden rounded-2xl border ...">
  {/* العنوان */}
  <div className="shrink-0 ...">...</div>
  {/* القائمة — تأخذ المتبقي */}
  <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
    {projects.slice(0, 4).map(...)}
  </div>
</div>

// البطاقة المالية
<div className="flex flex-col h-full overflow-hidden rounded-2xl border ...">
  {/* 3 mini-cards */}
  <div className="shrink-0 ...">...</div>
  {/* المخطط — يأخذ المتبقي */}
  <div className="flex-1 min-h-0">
    <ChartContainer className="h-full w-full">...</ChartContainer>
  </div>
</div>
```

---

## المرحلة 7 — ترجمة إضافية

### أضف/عدّل في ar.json:

```json
{
  "dashboard": {
    "welcome": {
      "greeting": "أهلاً {name} 👋",
      "subtitle": "إليك ملخص اليوم",
      "allGood": "كل شيء على ما يرام ✅"
    },
    "noClient": "بدون عميل",
    "issues": "مشاكل",
    "projectEnded": "انتهى",
    "actions": {
      "quotations": "عروض الأسعار",
      "newQuotation": "عرض سعر جديد"
    }
  }
}
```

### أضف/عدّل في en.json:

```json
{
  "dashboard": {
    "welcome": {
      "greeting": "Hello {name} 👋",
      "subtitle": "Here's your daily summary",
      "allGood": "Everything looks good ✅"
    },
    "noClient": "No client",
    "issues": "issues",
    "projectEnded": "Ended",
    "actions": {
      "quotations": "Quotations",
      "newQuotation": "New Quotation"
    }
  }
}
```

**ملاحظة:** تحقق أولاً من المفاتيح الموجودة فعلاً في الملفين — لا تكرر مفاتيح موجودة. عدّل فقط ما هو مفقود أو يحتاج تغيير.

---

## المرحلة 8 — التحقق

```bash
tsc --noEmit
pnpm build

# تحقق يدوي:
# 1. الخطوط واضحة ومقروءة — لا نص أصغر من 11px
# 2. Header يعرض اسم المستخدم + اسم المنشأة + التاريخ
# 3. المشاريع النشطة — تصميم احترافي مع شريط صحة جانبي ومعلومات إضافية
# 4. مخطط التدفق النقدي يظهر دائماً (حتى بأصفار)
# 5. بطاقات الوصول السريع مرتبة: مصروفات → مقبوضات → عروض أسعار → فواتير → دراسات → عملاء
# 6. الصفحة كاملة بدون تمرير على شاشة 1080p
# 7. RTL يعمل
# 8. Dark mode يعمل
```
