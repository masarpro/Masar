# برومبت إصلاح واجهة المستخدم وتجربة الاستخدام (UI/UX) — منصة مسار

> **ملاحظة:** هذا البرومبت مقسّم إلى 6 مراحل. نفّذ كل مرحلة بالترتيب.
> استخدم Plan Mode أولاً قبل كل مرحلة.
> **المنصة:** Next.js 16, React 19, Tailwind CSS 4, Radix UI, TanStack Table v8, shadcn/ui, RTL-first (Arabic)

---

## المرحلة 1: إصلاح Accessibility (من 60/100 إلى 80+/100)

### السياق
تقييم الـ accessibility الحالي 60/100. Radix UI يوفر أساس جيد لكن فيه ثغرات كثيرة. الهدف رفعه لـ 80+ بأقل جهد.

### الملفات المرجعية — اقرأها أولاً
```bash
# اعثر على مكون Skip Navigation إذا موجود
find apps/web -name "*skip*" -o -name "*SkipNav*" 2>/dev/null

# اعثر على Root Layout
cat apps/web/app/layout.tsx

# اعثر على مكونات UI الأساسية
ls apps/web/modules/ui/components/ 2>/dev/null || ls apps/web/components/ui/ 2>/dev/null

# اعثر على مكون DataTable
find apps/web -name "*data-table*" -o -name "*DataTable*" | head -10

# اعثر على مكونات الأيقونات
grep -rn "lucide-react" apps/web/modules/ --include="*.tsx" -l | head -10

# اعثر على مكونات Charts
find apps/web -name "*chart*" -o -name "*Chart*" | head -10
```

### المطلوب

#### 1.1 إضافة Skip Navigation Link

أنشئ مكون Skip Navigation وأضفه في Root Layout:

**الملف:** `apps/web/components/skip-nav.tsx` (أو المسار المناسب حسب بنية المشروع)

```tsx
"use client";

export function SkipNavLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none"
    >
      تخطي إلى المحتوى الرئيسي
    </a>
  );
}

export function SkipNavTarget() {
  return <div id="main-content" tabIndex={-1} className="outline-none" />;
}
```

ثم في Root Layout (`apps/web/app/layout.tsx`):
```tsx
import { SkipNavLink } from "@/components/skip-nav";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SkipNavLink />
        {children}
      </body>
    </html>
  );
}
```

وفي كل layout رئيسي (SaaS layout, Organization layout) أضف `<SkipNavTarget />` قبل المحتوى الأساسي (بعد الـ sidebar).

#### 1.2 إضافة aria-label للأيقونات التفاعلية

ابحث عن كل الأيقونات التي تُستخدم كأزرار بدون نص مرئي:

```bash
# أيقونات بدون aria-label في أزرار
grep -rn "Button.*variant.*ghost\|Button.*variant.*icon\|Button.*size.*icon" apps/web/modules/ --include="*.tsx" -l | head -20
```

**القاعدة:** كل `<Button>` يحتوي فقط أيقونة (بدون نص مرئي) يحتاج `aria-label`:

```tsx
// ❌ قبل — بدون aria-label:
<Button variant="ghost" size="icon" onClick={onDelete}>
  <Trash2 className="h-4 w-4" />
</Button>

// ✅ بعد:
<Button variant="ghost" size="icon" onClick={onDelete} aria-label="حذف">
  <Trash2 className="h-4 w-4" />
</Button>
```

**ابحث وأصلح في هذه الأماكن بالذات:**
1. أزرار الـ sidebar (collapse, expand, menu)
2. أزرار الجداول (actions: edit, delete, view, more)
3. أزرار إغلاق الـ dialogs والـ sheets
4. أزرار pagination (previous, next, first, last)
5. أزرار الإشعارات (bell icon)
6. أزرار البحث (search icon)
7. أزرار التصفية (filter icon)
8. أزرار النسخ (copy icon)

ابحث بشكل منهجي:
```bash
grep -rn '<Button' apps/web/modules/ --include="*.tsx" | grep -v "aria-label" | grep "icon\|Icon\|variant=\"ghost\"" | head -40
```

#### 1.3 إضافة نص بديل للرسوم البيانية (Charts)

ابحث عن كل مكونات Recharts:
```bash
grep -rn "ResponsiveContainer\|BarChart\|LineChart\|PieChart\|AreaChart" apps/web/ --include="*.tsx" -l
```

لكل chart، أضف `role="img"` و `aria-label` يصف البيانات:

```tsx
// ❌ قبل:
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>...</BarChart>
</ResponsiveContainer>

// ✅ بعد:
<div role="img" aria-label={`رسم بياني يوضح توزيع المصروفات: ${data.map(d => `${d.name}: ${d.value}`).join(', ')}`}>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>...</BarChart>
  </ResponsiveContainer>
</div>
```

إذا البيانات كبيرة، استخدم وصف مختصر:
```tsx
aria-label={`رسم بياني يوضح توزيع المصروفات لـ ${data.length} فئة. إجمالي: ${total} ريال`}
```

#### 1.4 تحسين ألوان Contrast (WCAG AA)

ابحث عن الألوان المشكلة. الأكثر شيوعاً في Tailwind:

```bash
# ألوان فاتحة على خلفية بيضاء (contrast ضعيف):
grep -rn "text-gray-400\|text-muted\|text-slate-400\|text-zinc-400" apps/web/modules/ --include="*.tsx" | head -20
```

**القاعدة:** أقل contrast ratio مسموح لـ WCAG AA هو 4.5:1 للنص العادي و 3:1 للنص الكبير.

**الإصلاحات الشائعة:**
```
text-gray-400 → text-gray-500 أو text-gray-600 (على خلفية بيضاء)
text-muted-foreground → تأكد أنه يحقق 4.5:1
border-gray-200 → مقبول للحدود (ليست نص)
```

ابحث عن CSS المخصص في `globals.css` أو theme config وتأكد أن:
- `--muted-foreground` يحقق 4.5:1 مع `--background`
- `--primary` يحقق 4.5:1 مع `--primary-foreground`

#### 1.5 إضافة Focus Indicators واضحة

تأكد أن كل العناصر التفاعلية عندها focus ring واضح:

```bash
# ابحث عن outline-none بدون بديل
grep -rn "outline-none" apps/web/ --include="*.tsx" --include="*.css" | grep -v "focus" | head -20
```

إذا فيه `outline-none` بدون `focus-visible:ring-*`، أصلحه:
```tsx
// ❌ يمنع focus indicator:
className="outline-none"

// ✅ يمنع outline الافتراضي لكن يضيف ring عند focus:
className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### معايير النجاح
- [ ] Skip navigation يعمل (Tab → Enter → ينتقل للمحتوى)
- [ ] كل أيقونات الأزرار عندها aria-label
- [ ] Charts عندها نص بديل
- [ ] ألوان النص تحقق WCAG AA (4.5:1)
- [ ] Focus indicators واضحة على كل العناصر

---

## المرحلة 2: إصلاح Responsive Design (من 75/100 إلى 85+/100)

### الملفات المرجعية
```bash
# DataTable component
find apps/web -name "*data-table*" -type f | head -5

# Dialog/Modal components
find apps/web -name "*dialog*" -o -name "*modal*" -o -name "*sheet*" | head -10

# Invoice/Payroll tables
find apps/web -path "*finance*" -name "*table*" -o -path "*payroll*" -name "*table*" | head -10
```

### المطلوب

#### 2.1 إصلاح الجداول المعقدة على Mobile

ابحث عن الجداول اللي فيها 6+ أعمدة:
```bash
grep -rn "columns" apps/web/modules/ --include="*.tsx" -l | head -20
```

**الحل: الأعمدة تختفي تدريجياً على الشاشات الصغيرة.**

في مكون DataTable الأساسي (أو في كل جدول على حدة)، استخدم column visibility:

```tsx
// في تعريف الأعمدة — أضف meta للأعمدة الثانوية:
{
  accessorKey: "createdAt",
  header: "التاريخ",
  meta: { hideOnMobile: true }, // يختفي على mobile
},
{
  accessorKey: "category",
  header: "الفئة",
  meta: { hideOnTablet: true }, // يختفي على tablet وأصغر
}

// في DataTable component:
const isMobile = useMediaQuery("(max-width: 640px)");
const isTablet = useMediaQuery("(max-width: 768px)");

const columnVisibility = useMemo(() => {
  const visibility: Record<string, boolean> = {};
  table.getAllColumns().forEach(col => {
    const meta = col.columnDef.meta as { hideOnMobile?: boolean; hideOnTablet?: boolean } | undefined;
    if (meta?.hideOnMobile && isMobile) visibility[col.id] = false;
    if (meta?.hideOnTablet && isTablet) visibility[col.id] = false;
  });
  return visibility;
}, [isMobile, isTablet]);
```

**إذا الجدول ما عنده `useMediaQuery` hook:**
```bash
find apps/web -name "*useMediaQuery*" -o -name "*use-media-query*" | head -5
```
إذا ما موجود، أنشئه:
```tsx
// apps/web/hooks/use-media-query.ts
"use client";
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}
```

**الجداول الأولى بالإصلاح:**
1. جدول الفواتير (invoices) — 8+ أعمدة
2. جدول الرواتب (payroll) — 7+ أعمدة
3. جدول المصروفات (expenses) — 6+ أعمدة
4. جدول الموظفين (employees) — 6+ أعمدة

#### 2.2 إصلاح Modals/Dialogs الكبيرة على Mobile

ابحث عن الـ dialogs:
```bash
grep -rn "DialogContent\|SheetContent" apps/web/modules/ --include="*.tsx" -l | head -20
```

**الحل: حوّل Dialog الكبيرة لـ Sheet (drawer) على Mobile:**

```tsx
"use client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function ResponsiveDialog({ open, onOpenChange, children, title }: Props) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

أنشئ هذا المكون في `apps/web/components/ui/responsive-dialog.tsx` واستخدمه بدل `Dialog` في:
1. نموذج إنشاء الفاتورة
2. نموذج إنشاء المصروف
3. نموذج إنشاء الموظف
4. أي dialog فيه 10+ حقول

#### 2.3 إصلاح Charts على Mobile

ابحث عن Recharts `ResponsiveContainer`:
```bash
grep -rn "ResponsiveContainer" apps/web/ --include="*.tsx" -l
```

**المشاكل الشائعة:**
- `ResponsiveContainer` بدون `minWidth` → ينكمش لحد ما يصير غير قابل للقراءة
- Labels طويلة على X-axis تتداخل

**الحل:**
```tsx
// لف كل chart بـ container يسمح بالتمرير الأفقي على mobile:
<div className="w-full overflow-x-auto">
  <div className="min-w-[500px]"> {/* يمنع الانكماش الزائد */}
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-45}        // دوّر Labels على mobile
          textAnchor="end"
          height={60}        // مساحة أكبر للـ labels المدوّرة
        />
        {/* ... */}
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
```

### معايير النجاح
- [ ] الجداول المعقدة قابلة للاستخدام على mobile (أعمدة ثانوية تختفي)
- [ ] Dialogs الكبيرة تتحول لـ bottom sheet على mobile
- [ ] Charts قابلة للتمرير أفقياً على mobile
- [ ] لا يوجد overflow أفقي غير مقصود

---

## المرحلة 3: إضافة Bulk Actions للجداول

### السياق
TanStack Table v8 موجود ويدعم row selection أصلاً، لكنه غير مُفعّل. المطلوب إضافة:
1. تحديد صفوف متعددة (checkboxes)
2. شريط أدوات يظهر عند التحديد (حذف جماعي، تحديث حالة، تصدير)

### الملفات المرجعية
```bash
# DataTable الأساسي
find apps/web -name "*data-table*" -type f | head -5
cat $(find apps/web -name "data-table.tsx" -type f | head -1)
```

### المطلوب

#### 3.1 تعديل DataTable لدعم Row Selection

في مكون DataTable الأساسي:

```tsx
// أضف عمود checkbox في بداية الأعمدة:
const selectionColumn: ColumnDef<TData> = {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="تحديد الكل"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label={`تحديد الصف ${row.index + 1}`}
    />
  ),
  enableSorting: false,
  enableHiding: false,
  size: 40,
};

// في useReactTable:
const table = useReactTable({
  // ... الإعدادات الموجودة
  enableRowSelection: true, // ← أضف هذا
  state: {
    // ... الحالة الموجودة
    rowSelection, // ← أضف هذا
  },
  onRowSelectionChange: setRowSelection, // ← أضف هذا
});
```

#### 3.2 إنشاء مكون Bulk Actions Bar

**الملف:** `apps/web/components/data-table/bulk-actions-bar.tsx`

```tsx
"use client";

type BulkAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: "default" | "destructive";
  requireConfirm?: boolean;
};

type BulkActionsBarProps = {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
};

export function BulkActionsBar({ selectedCount, totalCount, actions, onClearSelection }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-lg border bg-background p-3 shadow-lg animate-in slide-in-from-bottom-2">
      {/* الجزء الأيسر: العدد + إلغاء */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{selectedCount} / {totalCount} محدد</Badge>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          إلغاء التحديد
        </Button>
      </div>

      {/* الجزء الأيمن: الإجراءات */}
      <div className="flex items-center gap-2">
        {actions.map((action, i) => (
          <Button
            key={i}
            variant={action.variant ?? "default"}
            size="sm"
            onClick={() => {/* اجمع IDs المحددة واستدعِ action.onClick */}}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

#### 3.3 تطبيق Bulk Actions على الجداول الرئيسية

**أضف bulk actions لهذه الجداول بالترتيب:**

**1. جدول الفواتير:**
```tsx
const bulkActions: BulkAction[] = [
  { label: "حذف المحدد", icon: <Trash2 />, variant: "destructive", requireConfirm: true,
    onClick: (ids) => deleteInvoicesMutation.mutate(ids) },
  { label: "تصدير CSV", icon: <Download />,
    onClick: (ids) => exportInvoicesCsv(ids) },
  { label: "تغيير الحالة", icon: <RefreshCw />,
    onClick: (ids) => openStatusChangeDialog(ids) },
];
```

**2. جدول المصروفات:** حذف جماعي + تصدير
**3. جدول الموظفين:** تصدير + تحديث حالة
**4. جدول المطالبات:** تحديث حالة + تصدير
**5. جدول المستندات:** حذف جماعي + تحميل جماعي

#### 3.4 إضافة Export من الجدول

أنشئ helper function لتصدير بيانات الجدول لـ CSV:

**الملف:** `apps/web/lib/export-table.ts`

```typescript
export function exportTableToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
) {
  // 1. BOM لدعم العربية في Excel
  const BOM = "\uFEFF";
  
  // 2. Headers
  const headers = columns.map(c => c.label).join(",");
  
  // 3. Rows
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      const str = val?.toString() ?? "";
      // Escape commas and quotes
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(",")
  );

  // 4. Download
  const csv = BOM + [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

### معايير النجاح
- [ ] Row selection (checkboxes) يعمل في جداول الفواتير والمصروفات
- [ ] Bulk actions bar يظهر عند التحديد
- [ ] حذف جماعي يعمل مع confirmation dialog
- [ ] Export CSV يدعم العربية (BOM)
- [ ] إلغاء التحديد يعمل

---

## المرحلة 4: تحويل النماذج المعقدة لـ Wizard (Multi-step Forms)

### السياق
بعض النماذج فيها 20+ حقل في صفحة واحدة — مُرهق للمستخدم. المطلوب تقسيمها لخطوات.

### الملفات المرجعية
```bash
# النماذج الأكبر (ابحث عن النماذج اللي فيها حقول كثيرة)
grep -rn "useForm" apps/web/modules/ --include="*.tsx" -l | head -20

# نموذج إنشاء الفاتورة
find apps/web -path "*invoice*" -name "*form*" -o -path "*invoice*" -name "*create*" | head -5

# نموذج إنشاء الموظف
find apps/web -path "*employee*" -name "*form*" -o -path "*employee*" -name "*create*" | head -5

# نموذج إعدادات المنظمة
find apps/web -path "*settings*" -name "*form*" | head -5
```

### المطلوب

#### 4.1 إنشاء مكون FormWizard القابل لإعادة الاستخدام

**الملف:** `apps/web/components/form-wizard.tsx`

```tsx
"use client";

import { useState } from "react";

type WizardStep = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  // validation function اختياري — يُفحص قبل الانتقال للخطوة التالية
  validate?: () => Promise<boolean> | boolean;
};

type FormWizardProps = {
  steps: WizardStep[];
  onComplete: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function FormWizard({ steps, onComplete, isSubmitting, submitLabel = "حفظ" }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    const step = steps[currentStep];
    if (step.validate) {
      const isValid = await step.validate();
      if (!isValid) return;
    }
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <nav aria-label="خطوات النموذج" className="flex items-center justify-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < currentStep && setCurrentStep(i)} // يرجع للخطوات السابقة فقط
              disabled={i > currentStep}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors
                ${i === currentStep ? "bg-primary text-primary-foreground" : ""}
                ${i < currentStep ? "bg-primary/20 text-primary cursor-pointer" : ""}
                ${i > currentStep ? "bg-muted text-muted-foreground" : ""}
              `}
              aria-current={i === currentStep ? "step" : undefined}
            >
              {i < currentStep ? "✓" : i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </nav>

      {/* Step Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
        {steps[currentStep].description && (
          <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
        )}
      </div>

      {/* Step Content */}
      <div className="min-h-[200px]">
        {steps[currentStep].content}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          السابق
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentStep + 1} من {steps.length}
        </span>
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? "جاري الحفظ..." : isLastStep ? submitLabel : "التالي"}
        </Button>
      </div>
    </div>
  );
}
```

#### 4.2 تحويل نموذج إنشاء الفاتورة لـ Wizard

اقرأ نموذج إنشاء الفاتورة الحالي وقسّمه لـ 3-4 خطوات:

```
الخطوة 1: معلومات أساسية
- نوع الفاتورة (STANDARD, TAX, SIMPLIFIED)
- العميل (اختيار من القائمة)
- المشروع (اختياري)
- رقم الفاتورة (تلقائي)
- التاريخ + تاريخ الاستحقاق

الخطوة 2: البنود
- جدول البنود (الوصف، الكمية، سعر الوحدة)
- زر إضافة بند
- المجاميع الفرعية

الخطوة 3: الحسابات والخصومات
- الخصم (نسبة أو مبلغ)
- VAT (15%)
- الاحتفاظ (retention %)
- المجموع النهائي (يُحسب تلقائياً)

الخطوة 4: المراجعة والحفظ
- عرض ملخص الفاتورة
- زر "حفظ كمسودة" أو "إصدار"
```

**المهم:** React Hook Form يبقى واحد يلف كل الخطوات. كل خطوة تعرض جزء من الحقول فقط. الـ validation يتم per-step عبر `trigger()`:

```tsx
const form = useForm<InvoiceFormData>({
  resolver: zodResolver(invoiceSchema),
});

const steps: WizardStep[] = [
  {
    title: "معلومات الفاتورة",
    content: <InvoiceBasicInfo form={form} />,
    validate: () => form.trigger(["type", "clientId", "invoiceDate", "dueDate"]),
  },
  {
    title: "البنود",
    content: <InvoiceLineItems form={form} />,
    validate: () => form.trigger(["items"]),
  },
  // ...
];
```

#### 4.3 تحويل نموذج إنشاء الموظف لـ Wizard

```
الخطوة 1: البيانات الشخصية
- الاسم، البريد، الجوال، رقم الهوية

الخطوة 2: بيانات التوظيف
- المسمى الوظيفي، القسم، تاريخ البدء، نوع العقد

الخطوة 3: البيانات المالية
- الراتب الأساسي، بدل السكن، بدل النقل، التأمينات
```

#### 4.4 تحويل نموذج دراسة الكميات (إذا كبير)

اقرأ نموذج إنشاء بنود الكميات — إذا فيه 15+ حقل، قسّمه لخطوات حسب القسم (إنشائي، تشطيبات، MEP).

### معايير النجاح
- [ ] مكون FormWizard قابل لإعادة الاستخدام
- [ ] نموذج الفاتورة مقسّم لـ 3-4 خطوات
- [ ] نموذج الموظف مقسّم لـ 3 خطوات
- [ ] التنقل بين الخطوات يعمل (تالي/سابق)
- [ ] Validation يتم per-step
- [ ] React Hook Form يعمل عبر كل الخطوات

---

## المرحلة 5: تحسينات RTL والجداول

### المطلوب

#### 5.1 إصلاح Margins/Paddings الثابتة

```bash
# ابحث عن ml-/mr- بدل ms-/me-:
grep -rn "ml-\|mr-\|pl-\|pr-" apps/web/modules/ --include="*.tsx" | grep -v "node_modules" | grep -v "ms-\|me-\|ps-\|pe-" | head -30
```

**قاعدة التحويل (Tailwind CSS 4 / logical properties):**
```
ml-* → ms-*  (margin-inline-start)
mr-* → me-*  (margin-inline-end)
pl-* → ps-*  (padding-inline-start)
pr-* → pe-*  (padding-inline-end)
left-* → start-*
right-* → end-*
text-left → text-start
text-right → text-end
rounded-l-* → rounded-s-*
rounded-r-* → rounded-e-*
border-l-* → border-s-*
border-r-* → border-e-*
```

**لا تغيّر:** `ml-auto`, `mr-auto` → هذي عادةً مقصودة (centering).

**أصلح الأكثر ظهوراً فقط** — لا تحتاج تمسح كل الملفات. ركّز على:
1. مكونات الـ Sidebar
2. مكونات الـ DataTable
3. مكونات الـ Navigation/Breadcrumb
4. مكونات الـ Cards

#### 5.2 إصلاح أيقونات الاتجاه

```bash
# أيقونات أسهم لا تنعكس:
grep -rn "ChevronLeft\|ChevronRight\|ArrowLeft\|ArrowRight" apps/web/modules/ --include="*.tsx" | head -20
```

**الحل:** استخدم `rtl:rotate-180` على الأيقونات الاتجاهية:
```tsx
// ❌ قبل:
<ChevronRight className="h-4 w-4" />

// ✅ بعد:
<ChevronRight className="h-4 w-4 rtl:rotate-180" />
```

**الأيقونات اللي تحتاج انعكاس:**
- `ChevronLeft` / `ChevronRight`
- `ArrowLeft` / `ArrowRight`
- `ChevronsLeft` / `ChevronsRight`

**لا تعكس:** أيقونات غير اتجاهية مثل `ArrowUp`, `ArrowDown`, `Check`, `X`.

#### 5.3 إصلاح Tables Horizontal Scroll في RTL

```bash
# ابحث عن overflow-x-auto في الجداول
grep -rn "overflow-x-auto\|overflow-auto" apps/web/modules/ --include="*.tsx" | head -10
```

تأكد أن الـ scroll direction صحيح في RTL. Tailwind/browsers عادةً يتعاملون مع هذا تلقائياً، لكن أحياناً CSS مخصص يكسره:

```tsx
// تأكد أن wrapper الجدول يحترم الاتجاه:
<div className="w-full overflow-x-auto" dir="auto">
  <table>...</table>
</div>
```

### معايير النجاح
- [ ] أغلب ml-/mr- في المكونات الرئيسية تحوّلت لـ ms-/me-
- [ ] أيقونات الأسهم تنعكس في RTL
- [ ] الجداول scrollable بشكل صحيح في RTL

---

## المرحلة 6: تحسينات UX عامة

### المطلوب

#### 6.1 إضافة Empty States محسّنة

```bash
# ابحث عن empty states الحالية
grep -rn "empty\|no-data\|EmptyState\|لا يوجد\|لا توجد" apps/web/modules/ --include="*.tsx" -l | head -15
```

إذا فيه جداول تعرض "لا توجد بيانات" كنص عادي، حسّنها:

```tsx
// أنشئ مكون EmptyState محسّن (إذا ما موجود):
function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <Button className="mt-4" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
```

#### 6.2 إضافة Confirmation Dialogs للعمليات الحساسة

ابحث عن عمليات حذف بدون تأكيد:
```bash
grep -rn "delete\|حذف\|remove" apps/web/modules/ --include="*.tsx" | grep "onClick\|mutation" | grep -v "confirm\|Confirm\|dialog\|Dialog" | head -15
```

تأكد أن كل عملية حذف تمر عبر confirmation dialog.

#### 6.3 تحسين Loading States

```bash
# ابحث عن loading states
find apps/web/app -name "loading.tsx" | head -20
```

أنشئ `loading.tsx` للمجلدات الرئيسية إذا مفقود:

```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/loading.tsx
```

كل `loading.tsx` يعرض Skeleton مناسب للصفحة.

### معايير النجاح
- [ ] Empty states محسّنة مع أيقونات وأزرار action
- [ ] كل عمليات الحذف تمر عبر confirmation
- [ ] loading.tsx موجود لكل مجلد رئيسي

---

## ملخص المراحل

| المرحلة | المشكلة | الأثر | الوقت التقديري |
|---------|---------|-------|---------------|
| 1 | Accessibility | رفع من 60→80+ | 3-4 ساعات |
| 2 | Responsive Design | رفع من 75→85+ | 4-5 ساعات |
| 3 | Bulk Actions للجداول | ميزة جديدة مهمة | 4-5 ساعات |
| 4 | Wizard Forms | UX أفضل بكثير | 4-5 ساعات |
| 5 | RTL Fixes | polish | 2-3 ساعات |
| 6 | UX General | polish | 2-3 ساعات |
| **المجموع** | | | **~19-25 ساعة** |

---

## تعليمات عامة

1. **استخدم Plan Mode** قبل كل مرحلة — اقرأ الملفات المرجعية
2. **لا تكسر الموجود** — كل تغيير يحافظ على التوافق
3. **اتبع أنماط المشروع:** shadcn/ui, Tailwind, Radix UI, RTL-first
4. **كل تعديل يحتاج `pnpm type-check` و `pnpm build`** بعده
5. **مفاتيح الترجمة:** كل نص جديد يُضاف في `ar.json` و `en.json`
6. **اكتب ≤800 سطر لكل عملية كتابة**
7. **ركّز على المكونات المشتركة أولاً** (DataTable, Dialog, FormWizard) — لأن إصلاحها يُصلح كل الأماكن اللي تستخدمها
8. **RTL:** استخدم Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) بدلاً من physical (`ml-`, `mr-`, `left-`, `right-`)
