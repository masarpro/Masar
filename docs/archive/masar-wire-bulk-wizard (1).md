# برومبت ربط BulkActionsBar و FormWizard بالجداول والنماذج الفعلية — منصة مسار

> **السياق:** المكونات التالية تم إنشاؤها مسبقاً وجاهزة للاستخدام:
> - `BulkActionsBar` — شريط أدوات يظهر عند تحديد صفوف في الجدول
> - `FormWizard` — مكون نموذج متعدد الخطوات
> - `exportTableToCsv` — دالة تصدير CSV مع دعم العربية (BOM)
> - `useMediaQuery` — hook لفحص حجم الشاشة
>
> **المطلوب:** ربط هذه المكونات بالجداول والنماذج الفعلية في المنصة.
> نفّذ كل مرحلة بالترتيب. استخدم Plan Mode أولاً.

---

## المرحلة 1: ربط Bulk Actions بجدول الفواتير (InvoicesList)

### قبل البدء — اقرأ هذه الملفات:
```bash
# 1. مكون BulkActionsBar الجاهز
find apps/web -name "bulk-actions-bar*" -type f
cat $(find apps/web -name "bulk-actions-bar*" -type f | head -1)

# 2. دالة exportTableToCsv
find apps/web -name "export-table*" -type f
cat $(find apps/web -name "export-table*" -type f | head -1)

# 3. جدول الفواتير الحالي
find apps/web -path "*invoice*" -name "*list*" -o -path "*invoice*" -name "*table*" | grep -i "\.tsx$" | head -5
cat $(find apps/web -path "*invoice*" -name "*list*" -o -path "*invoice*" -name "*table*" | grep -i "\.tsx$" | head -1)

# 4. API endpoints الفواتير (ابحث عن delete endpoint)
find packages/api -path "*finance*invoice*" -name "*.ts" | head -10
grep -rn "delete\|bulkDelete" packages/api/modules/finance/ --include="*.ts" | head -10
```

### المطلوب

#### 1.1 إضافة Row Selection لجدول الفواتير

افتح مكون جدول الفواتير (InvoicesList أو ما يعادله) وعدّله:

**أ. أضف state للتحديد:**
```tsx
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
```

**ب. أضف عمود checkbox كأول عمود:**
```tsx
import { Checkbox } from "@/components/ui/checkbox"; // أو المسار الصحيح

// أضف في بداية مصفوفة columns:
{
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
      aria-label={`تحديد الفاتورة ${row.original.invoiceNo ?? ''}`}
    />
  ),
  enableSorting: false,
  enableHiding: false,
},
```

**ج. فعّل row selection في useReactTable (أو ما يعادله):**
```tsx
// ابحث عن useReactTable أو أي setup لـ TanStack Table وأضف:
enableRowSelection: true,
state: {
  // ... الحالة الموجودة ...
  rowSelection,
},
onRowSelectionChange: setRowSelection,
```

**ملاحظة مهمة:** إذا الجدول يستخدم DataTable wrapper مشترك، قد تحتاج تمرير `enableRowSelection` و `rowSelection` كـ props. اقرأ المكون المشترك وافهم كيف يقبل الإعدادات.

#### 1.2 إضافة BulkActionsBar تحت الجدول

```tsx
import { BulkActionsBar } from "@/components/bulk-actions-bar"; // عدّل المسار
import { exportTableToCsv } from "@/lib/export-table"; // عدّل المسار
import { Download, Send, XCircle } from "lucide-react";

// داخل المكون — بعد الجدول:

// احسب الصفوف المحددة:
const selectedRows = table.getFilteredSelectedRowModel().rows;
const selectedInvoices = selectedRows.map(row => row.original);
const selectedIds = selectedInvoices.map(inv => inv.id);

// أضف الـ JSX بعد الجدول مباشرة:
<BulkActionsBar
  selectedCount={selectedRows.length}
  totalCount={data?.length ?? 0}   // أو total من pagination
  onClearSelection={() => setRowSelection({})}
  actions={[
    {
      label: t("common.export") ?? "تصدير CSV",    // استخدم مفتاح ترجمة موجود أو أضف جديد
      icon: <Download className="h-4 w-4 me-1.5" />,
      onClick: () => {
        exportTableToCsv(
          selectedInvoices,
          [
            { key: "invoiceNo", label: "رقم الفاتورة" },
            { key: "clientName", label: "العميل" },  // عدّل حسب الحقول الفعلية
            { key: "totalAmount", label: "المبلغ" },
            { key: "status", label: "الحالة" },
            { key: "invoiceDate", label: "التاريخ" },
            { key: "dueDate", label: "تاريخ الاستحقاق" },
          ],
          "invoices"
        );
        setRowSelection({});
      },
    },
    {
      label: t("finance.invoices.markAsSent") ?? "تعليم كمُرسلة",
      icon: <Send className="h-4 w-4 me-1.5" />,
      onClick: () => {
        // فقط الفواتير بحالة ISSUED يمكن تعليمها كمُرسلة
        const eligibleIds = selectedInvoices
          .filter(inv => inv.status === "ISSUED")
          .map(inv => inv.id);
        if (eligibleIds.length === 0) {
          toast.error(t("finance.invoices.noEligibleForSent") ?? "لا توجد فواتير مُصدرة قابلة للتعليم كمُرسلة");
          return;
        }
        confirm({
          title: `تعليم ${eligibleIds.length} فاتورة كمُرسلة؟`,
          onConfirm: async () => {
            await Promise.allSettled(
              eligibleIds.map(id => updateInvoiceStatusMutation.mutateAsync({ id, status: "SENT" }))
            );
            setRowSelection({});
          },
        });
      },
    },
    {
      label: t("finance.invoices.cancelSelected") ?? "إلغاء المحدد",
      icon: <XCircle className="h-4 w-4 me-1.5" />,
      variant: "destructive",
      onClick: () => {
        // فقط فواتير DRAFT يمكن إلغاؤها — الفواتير المُصدرة لا تُحذف (متطلب ZATCA)
        const eligibleIds = selectedInvoices
          .filter(inv => inv.status === "DRAFT")
          .map(inv => inv.id);
        if (eligibleIds.length === 0) {
          toast.error(t("finance.invoices.noEligibleForCancel") ?? "لا توجد مسودات قابلة للإلغاء. الفواتير المُصدرة لا يمكن حذفها.");
          return;
        }
        confirm({
          title: `إلغاء ${eligibleIds.length} مسودة فاتورة؟`,
          description: t("finance.invoices.cancelWarning") ?? "سيتم إلغاء المسودات المحددة. الفواتير المُصدرة لا يمكن حذفها أو إلغاؤها.",
          onConfirm: async () => {
            await Promise.allSettled(
              eligibleIds.map(id => updateInvoiceStatusMutation.mutateAsync({ id, status: "CANCELLED" }))
            );
            setRowSelection({});
          },
        });
      },
    },
  ]}
/>
```

**ملاحظة:** الفواتير لا يمكن حذفها (متطلب ZATCA وسلامة السجلات المالية). بدلاً من ذلك:
- فواتير DRAFT → يمكن إلغاؤها (CANCELLED)
- فواتير ISSUED → يمكن تعليمها كمُرسلة (SENT)
- الفواتير المُصدرة لا يمكن حذفها أو إلغاؤها — فقط إنشاء Credit Note

عدّل أسماء الحقول (`invoiceNo`, `clientName`, `totalAmount`, etc.) حسب الشكل الفعلي للبيانات. اقرأ الـ type أو الـ columns الموجودة لمعرفة الأسماء الصحيحة.

### معايير النجاح
- [ ] Checkboxes تظهر في جدول الفواتير
- [ ] تحديد صف واحد أو أكثر يُظهر BulkActionsBar
- [ ] تصدير CSV يعمل ويدعم العربية
- [ ] "تعليم كمُرسلة" يعمل فقط على فواتير ISSUED
- [ ] "إلغاء المحدد" يعمل فقط على مسودات DRAFT
- [ ] رسالة خطأ واضحة إذا لا توجد فواتير مؤهلة للإجراء
- [ ] إلغاء التحديد يخفي الشريط

---

## المرحلة 2: ربط Bulk Actions بجدول المصروفات (ExpenseList)

### قبل البدء:
```bash
# جدول المصروفات
find apps/web -path "*expense*" -name "*list*" -o -path "*expense*" -name "*table*" | grep -i "\.tsx$" | head -5
cat $(find apps/web -path "*expense*" -name "*list*" | grep "\.tsx$" | head -1)

# API المصروفات (ابحث عن delete/deactivate)
grep -rn "delete\|deactivate" packages/api/modules/finance/expenses* --include="*.ts" 2>/dev/null || \
grep -rn "delete\|deactivate" packages/api/modules/company/expenses* --include="*.ts" | head -5
```

### المطلوب

نفس الخطوات بالضبط كالمرحلة 1، لكن على جدول المصروفات:

1. **أضف `rowSelection` state و checkbox column**
2. **فعّل `enableRowSelection` في الجدول**
3. **أضف `BulkActionsBar`** مع هذه الإجراءات:

```tsx
actions={[
  {
    label: "تصدير CSV",
    icon: <Download className="h-4 w-4 me-1.5" />,
    onClick: () => {
      exportTableToCsv(
        selectedExpenses,
        [
          { key: "expenseNo", label: "رقم المصروف" },
          { key: "description", label: "الوصف" },
          { key: "amount", label: "المبلغ" },
          { key: "category", label: "الفئة" },
          { key: "status", label: "الحالة" },
          { key: "date", label: "التاريخ" },
        ],
        "expenses"
      );
      setRowSelection({});
    },
  },
  {
    label: "تعطيل المحدد",   // المصروفات تستخدم deactivate بدل delete
    icon: <XCircle className="h-4 w-4 me-1.5" />,
    variant: "destructive",
    onClick: () => {
      confirm({
        title: `تعطيل ${selectedIds.length} مصروف؟`,
        onConfirm: async () => {
          await Promise.allSettled(
            selectedIds.map(id => deactivateExpenseMutation.mutateAsync({ id }))
          );
          setRowSelection({});
        },
      });
    },
  },
]}
```

**عدّل الحقول والـ mutations** حسب الكود الفعلي.

---

## المرحلة 3: ربط Bulk Actions بجدول الموظفين (EmployeeList)

### قبل البدء:
```bash
find apps/web -path "*employee*" -name "*list*" | grep "\.tsx$" | head -3
cat $(find apps/web -path "*employee*" -name "*list*" | grep "\.tsx$" | head -1)
```

### المطلوب

نفس النمط — أضف row selection + BulkActionsBar مع:

```tsx
actions={[
  {
    label: "تصدير CSV",
    icon: <Download className="h-4 w-4 me-1.5" />,
    onClick: () => {
      exportTableToCsv(
        selectedEmployees,
        [
          { key: "name", label: "الاسم" },
          { key: "position", label: "المسمى الوظيفي" },
          { key: "department", label: "القسم" },
          { key: "salary", label: "الراتب" },
          { key: "status", label: "الحالة" },
          { key: "joinDate", label: "تاريخ الالتحاق" },
        ],
        "employees"
      );
      setRowSelection({});
    },
  },
]}
```

**ملاحظة:** الموظفين عادةً لا يُحذفون جماعياً — فقط تصدير. إذا فيه حاجة لتغيير حالة جماعي أضفه.

---

## المرحلة 4: تحويل نموذج إنشاء الفاتورة لـ FormWizard

### قبل البدء — اقرأ بعناية:
```bash
# 1. مكون FormWizard الجاهز
find apps/web -name "form-wizard*" -type f
cat $(find apps/web -name "form-wizard*" -type f | head -1)

# 2. نموذج إنشاء/تعديل الفاتورة الحالي
find apps/web -path "*invoice*" -name "*form*" -o -path "*invoice*" -name "*create*" -o -path "*invoice*" -name "*add*" | grep "\.tsx$" | head -5
# اقرأ كل ملف من النتائج:
for f in $(find apps/web -path "*invoice*" \( -name "*form*" -o -name "*create*" \) -name "*.tsx" | head -3); do echo "=== $f ==="; cat "$f"; done

# 3. Zod schema الفاتورة (إذا موجود في ملف منفصل)
find apps/web -path "*invoice*" -name "*schema*" -o -path "*invoice*" -name "*validation*" | head -3
```

### المطلوب

#### 4.1 تحليل النموذج الحالي

بعد قراءة نموذج الفاتورة، حدّد:
- ما هي كل الحقول الموجودة؟
- كيف يُستخدم `useForm` و `zodResolver`؟
- كيف تُدار البنود (items) — هل يستخدم `useFieldArray`؟
- ما هو الـ mutation المستخدم للحفظ؟
- هل فيه logic لأنواع الفواتير المختلفة (STANDARD, TAX, etc.)؟

#### 4.2 تقسيم الحقول لخطوات

**لا تعيد كتابة النموذج من الصفر.** بدلاً من ذلك:
1. ابقِ `useForm` و `zodResolver` كما هم
2. قسّم الـ JSX الحالي لمكونات فرعية (أو divs)
3. لف الكل بـ `FormWizard`

**التقسيم المقترح:**

```tsx
import { FormWizard } from "@/components/form-wizard"; // عدّل المسار

// داخل مكون النموذج — بدلاً من عرض كل الحقول دفعة واحدة:

const steps = [
  {
    title: t("finance.invoices.step1Title") ?? "معلومات الفاتورة",
    description: t("finance.invoices.step1Desc") ?? "النوع والعميل والتاريخ",
    content: (
      <div className="space-y-4">
        {/* === انقل هنا حقول: === */}
        {/* - نوع الفاتورة (type) */}
        {/* - العميل (clientId) - select */}
        {/* - المشروع (projectId) - select - اختياري */}
        {/* - رقم الفاتورة (invoiceNo) - تلقائي أو يدوي */}
        {/* - تاريخ الفاتورة (invoiceDate) */}
        {/* - تاريخ الاستحقاق (dueDate) */}
        {/* - الملاحظات (notes) - اختياري */}
      </div>
    ),
    validate: () => form.trigger(["type", "clientId", "invoiceDate", "dueDate"]),
    // ↑ trigger يتحقق من الحقول المحددة فقط
  },
  {
    title: t("finance.invoices.step2Title") ?? "بنود الفاتورة",
    description: t("finance.invoices.step2Desc") ?? "أضف البنود والكميات",
    content: (
      <div className="space-y-4">
        {/* === انقل هنا: === */}
        {/* - جدول/قائمة البنود (items) */}
        {/* - زر إضافة بند */}
        {/* - كل بند: الوصف، الكمية، سعر الوحدة، المجموع */}
        {/* - المجموع الفرعي */}
      </div>
    ),
    validate: () => form.trigger(["items"]),
  },
  {
    title: t("finance.invoices.step3Title") ?? "الحسابات",
    description: t("finance.invoices.step3Desc") ?? "الخصم والضريبة والاحتفاظ",
    content: (
      <div className="space-y-4">
        {/* === انقل هنا: === */}
        {/* - نوع الخصم (نسبة/مبلغ) + قيمة الخصم */}
        {/* - VAT % (عادةً 15%) */}
        {/* - الاحتفاظ % (retention) */}
        {/* - ملخص المبالغ: */}
        {/*   المجموع الفرعي, الخصم, بعد الخصم, VAT, الإجمالي, الاحتفاظ, المستحق */}
      </div>
    ),
    // لا validate هنا — الحسابات تلقائية
  },
];

// بدلاً من الـ JSX القديم:
return (
  <Form {...form}>
    <FormWizard
      steps={steps}
      onComplete={() => form.handleSubmit(onSubmit)()}
      isSubmitting={mutation.isPending}
      submitLabel={t("finance.invoices.saveAsDraft") ?? "حفظ كمسودة"}
    />
  </Form>
);
```

#### 4.3 ملاحظات مهمة عند التنفيذ

1. **`<Form>` wrapper يبقى حول `<FormWizard>`** — لأن React Hook Form يحتاج الـ context
2. **`useFieldArray` للبنود يبقى كما هو** — لا تعدّل logic البنود
3. **لا تنقل code — انقل JSX فقط** — الـ hooks والـ logic تبقى في أعلى المكون
4. **`form.trigger(fields)` يتحقق فقط من الحقول المحددة** — هذا يسمح بالانتقال للخطوة التالية حتى لو باقي الحقول فاضية
5. **إذا النموذج حالياً داخل Dialog** — حوّل الـ Dialog content ليستخدم FormWizard بدلاً من عرض كل الحقول

#### 4.4 مفاتيح الترجمة

أضف في `packages/i18n/ar.json` و `packages/i18n/en.json`:
```json
{
  "finance": {
    "invoices": {
      "step1Title": "معلومات الفاتورة",
      "step1Desc": "حدد النوع والعميل والتاريخ",
      "step2Title": "بنود الفاتورة",
      "step2Desc": "أضف البنود والكميات والأسعار",
      "step3Title": "الحسابات والمبالغ",
      "step3Desc": "الخصم والضريبة والمبلغ النهائي",
      "saveAsDraft": "حفظ كمسودة"
    }
  }
}
```

### معايير النجاح
- [ ] نموذج الفاتورة يعرض 3 خطوات بدل صفحة واحدة طويلة
- [ ] progress indicator يُظهر الخطوة الحالية
- [ ] التنقل بين الخطوات يعمل (تالي/سابق)
- [ ] validation يتم per-step (الخطوة 1 تتحقق من type/client/dates قبل المتابعة)
- [ ] حفظ الفاتورة يعمل كما كان

---

## المرحلة 5: تحويل نموذج إنشاء الموظف لـ FormWizard

### قبل البدء:
```bash
# نموذج إنشاء الموظف
find apps/web -path "*employee*" \( -name "*form*" -o -name "*create*" -o -name "*add*" \) -name "*.tsx" | head -5
for f in $(find apps/web -path "*employee*" \( -name "*form*" -o -name "*create*" \) -name "*.tsx" | head -3); do echo "=== $f ==="; cat "$f"; done
```

### المطلوب

نفس النهج — لا تعيد كتابة النموذج. فقط قسّم الـ JSX لخطوات:

```tsx
const steps = [
  {
    title: "البيانات الشخصية",
    description: "الاسم ومعلومات التواصل",
    content: (
      <div className="space-y-4">
        {/* الاسم الكامل */}
        {/* البريد الإلكتروني */}
        {/* رقم الجوال */}
        {/* رقم الهوية / الإقامة */}
        {/* الجنسية (اختياري) */}
      </div>
    ),
    validate: () => form.trigger(["name", "email", "phone"]),
  },
  {
    title: "بيانات التوظيف",
    description: "المسمى والقسم ونوع العقد",
    content: (
      <div className="space-y-4">
        {/* المسمى الوظيفي (position) */}
        {/* القسم (department) */}
        {/* نوع الموظف (type: MANAGER, ENGINEER, etc.) */}
        {/* تاريخ الالتحاق (joinDate) */}
        {/* نوع العقد/الراتب (salaryType: MONTHLY/DAILY) */}
      </div>
    ),
    validate: () => form.trigger(["position", "type", "joinDate"]),
  },
  {
    title: "البيانات المالية",
    description: "الراتب والبدلات",
    content: (
      <div className="space-y-4">
        {/* الراتب الأساسي (salary) */}
        {/* بدل السكن (housingAllowance) — إذا موجود */}
        {/* بدل النقل (transportAllowance) — إذا موجود */}
        {/* بدلات أخرى (otherAllowances) — إذا موجود */}
        {/* رقم الحساب البنكي (IBAN) — إذا موجود */}
      </div>
    ),
    validate: () => form.trigger(["salary"]),
  },
];

return (
  <Form {...form}>
    <FormWizard
      steps={steps}
      onComplete={() => form.handleSubmit(onSubmit)()}
      isSubmitting={mutation.isPending}
      submitLabel="إضافة الموظف"
    />
  </Form>
);
```

### مفاتيح الترجمة

```json
{
  "company": {
    "employees": {
      "step1Title": "البيانات الشخصية",
      "step1Desc": "الاسم ومعلومات التواصل",
      "step2Title": "بيانات التوظيف",
      "step2Desc": "المسمى والقسم ونوع العقد",
      "step3Title": "البيانات المالية",
      "step3Desc": "الراتب والبدلات"
    }
  }
}
```

### معايير النجاح
- [ ] نموذج الموظف مقسّم لـ 3 خطوات
- [ ] validation per-step يعمل
- [ ] إنشاء الموظف يعمل كما كان

---

## المرحلة 6: ربط Bulk Actions بجدول المطالبات (Claims)

### قبل البدء:
```bash
find apps/web -path "*claim*" -name "*list*" -o -path "*claim*" -name "*table*" | grep "\.tsx$" | head -5
cat $(find apps/web -path "*claim*" -name "*list*" | grep "\.tsx$" | head -1)
```

### المطلوب

أضف row selection + BulkActionsBar مع:

```tsx
actions={[
  {
    label: "تصدير CSV",
    icon: <Download className="h-4 w-4 me-1.5" />,
    onClick: () => {
      exportTableToCsv(
        selectedClaims,
        [
          { key: "claimNo", label: "رقم المطالبة" },
          { key: "description", label: "الوصف" },
          { key: "amount", label: "المبلغ" },
          { key: "status", label: "الحالة" },
          { key: "createdAt", label: "التاريخ" },
        ],
        "claims"
      );
      setRowSelection({});
    },
  },
  {
    label: "تحديث الحالة",
    icon: <RefreshCw className="h-4 w-4 me-1.5" />,
    onClick: () => {
      // افتح dialog يسمح باختيار حالة جديدة (SUBMITTED, APPROVED, etc.)
      // ثم طبّق على كل المحدد
      openBulkStatusDialog(selectedIds);
    },
  },
]}
```

---

## ملخص المراحل

| المرحلة | المكون | الجدول/النموذج | الوقت التقديري |
|---------|--------|--------------|---------------|
| 1 | BulkActionsBar | جدول الفواتير | 1-2 ساعة |
| 2 | BulkActionsBar | جدول المصروفات | 45 دقيقة |
| 3 | BulkActionsBar | جدول الموظفين | 45 دقيقة |
| 4 | FormWizard | نموذج إنشاء الفاتورة | 2-3 ساعات |
| 5 | FormWizard | نموذج إنشاء الموظف | 1-2 ساعة |
| 6 | BulkActionsBar | جدول المطالبات | 45 دقيقة |
| **المجموع** | | | **~6-9 ساعات** |

---

## تعليمات عامة

1. **اقرأ المكونات الجاهزة أولاً** (`BulkActionsBar`, `FormWizard`, `exportTableToCsv`) — افهم الـ props والـ API قبل الربط
2. **اقرأ الجدول/النموذج الحالي بالكامل** قبل أي تعديل — افهم الـ types والـ columns والـ mutations
3. **لا تعيد كتابة الجداول أو النماذج** — أضف row selection وأضف FormWizard حول الـ JSX الموجود
4. **عدّل أسماء الحقول** في `exportTableToCsv` حسب الشكل الفعلي للبيانات (اقرأ الـ type أو الـ columns)
5. **استخدم الـ confirmation dialog الموجود** في المشروع (ابحث عن `useConfirmation` أو `ConfirmationAlert`)
6. **استخدم الـ mutations الموجودة** — لا تنشئ endpoints جديدة. إذا ما فيه `bulkDelete`، استخدم `Promise.allSettled` مع الـ delete الفردي
7. **شغّل بعد كل مرحلة:** `pnpm type-check` ثم `pnpm build`
8. **مفاتيح الترجمة** لكل نص جديد في `ar.json` و `en.json`
