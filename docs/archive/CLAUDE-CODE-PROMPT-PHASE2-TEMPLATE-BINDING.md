# المرحلة 2: ربط القوالب بعرض الفواتير الفعلي

## السياق والمشكلة

في المرحلة 1 أضفنا 3 قوالب فواتير احترافية وحدّثنا `TemplateRenderer` ومكوناته لدعم التخطيطات الجديدة. لكن **المشكلة الجوهرية لا تزال قائمة**: عرض الفاتورة الفعلي في `InvoicePreview.tsx` و `InvoiceView.tsx` لا يستخدم `TemplateRenderer` إطلاقاً — التصميم مُثبّت (hardcoded) بغض النظر عن القالب المختار.

**الملفات المتأثرة:**
- `apps/web/modules/saas/finance/components/invoices/InvoicePreview.tsx` (~515 سطر) — صفحة معاينة الطباعة A4
- `apps/web/modules/saas/finance/components/invoices/InvoiceView.tsx` (~1190 سطر) — يحتوي `InvoiceTabContent` (~270 سطر) وهو عرض الفاتورة داخل صفحة التفاصيل

**الهدف:** عندما يختار المستخدم قالباً عند إنشاء الفاتورة، يجب أن يظهر هذا القالب فعلياً عند عرض وطباعة الفاتورة.

---

## خطة التنفيذ (5 مهام)

### المهمة 1: إنشاء مكون مشترك `InvoiceDocument.tsx`

**أنشئ ملف جديد:**
`apps/web/modules/saas/finance/components/invoices/InvoiceDocument.tsx`

هذا المكون يحل مشكلتين: ربط القوالب بالعرض الفعلي + إزالة تكرار الكود بين `InvoicePreview` و `InvoiceTabContent`.

```typescript
// apps/web/modules/saas/finance/components/invoices/InvoiceDocument.tsx

"use client";

import { TemplateRenderer } from "../templates/renderer/TemplateRenderer";
import { DEFAULT_TEMPLATE_SETTINGS } from "../../lib/default-templates";
import type { TemplateElement, TemplateSettings } from "../../lib/default-templates";

interface InvoiceDocumentProps {
  invoice: InvoiceData;               // بيانات الفاتورة من API
  organization: OrganizationData;     // بيانات المنشأة
  orgSettings: OrgFinanceSettings;    // إعدادات المالية
  template?: {                        // القالب (اختياري)
    content: TemplateElement[];
    settings: TemplateSettings;
  } | null;
  options?: {
    showWatermark?: boolean;          // علامة مائية "مسودة"
    showStatusBadge?: boolean;        // شارة الحالة
    printMode?: boolean;              // وضع الطباعة
    showPayments?: boolean;           // عرض جدول المدفوعات
  };
}

export function InvoiceDocument({
  invoice,
  organization,
  orgSettings,
  template,
  options = {},
}: InvoiceDocumentProps) {
  const {
    showWatermark = false,
    showStatusBadge = false,
    printMode = false,
    showPayments = true,
  } = options;

  // === 1. تحديد عناصر وإعدادات القالب ===
  const templateElements = template?.content ?? getDefaultInvoiceElements();
  const templateSettings = template?.settings ?? DEFAULT_TEMPLATE_SETTINGS;

  // === 2. تحويل بيانات الفاتورة إلى الشكل المطلوب من TemplateRenderer ===
  const rendererData = transformInvoiceToRendererData(invoice, orgSettings);

  // === 3. تحويل بيانات المنشأة ===
  const rendererOrg = transformOrganizationData(organization, orgSettings);

  // === 4. حجم الصفحة ===
  const pageWidth = templateSettings.pageSize === "Letter" ? "215.9mm" : "210mm";
  const pageHeight = templateSettings.pageSize === "Letter" ? "279.4mm" : "297mm";
  const margins = templateSettings.margins || "20mm";

  return (
    <div
      className={cn(
        "relative bg-white text-foreground",
        printMode && "print:bg-white print:text-black"
      )}
      style={{
        maxWidth: pageWidth,
        minHeight: pageHeight,
        padding: margins,
        fontFamily: templateSettings.fontFamily || "Cairo",
        fontSize: templateSettings.fontSize || "14px",
        lineHeight: templateSettings.lineHeight || "1.6",
        direction: "rtl",
      }}
      dir="rtl"
    >
      {/* علامة مائية للمسودة */}
      {showWatermark && invoice.status === "DRAFT" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-30deg] text-[80px] font-bold text-muted-foreground/10 select-none">
            مسودة
          </span>
        </div>
      )}

      {/* محرك عرض القالب */}
      <TemplateRenderer
        elements={templateElements}
        settings={templateSettings}
        data={rendererData}
        organization={rendererOrg}
        interactive={false}
      />

      {/* جدول المدفوعات (خارج القالب — لأنه ليس عنصر قالب) */}
      {showPayments && invoice.payments && invoice.payments.length > 0 && (
        <PaymentsTable
          payments={invoice.payments}
          primaryColor={templateSettings.primaryColor}
        />
      )}
    </div>
  );
}
```

#### 1.1 دالة تحويل بيانات الفاتورة

هذه هي الدالة الأهم — تحوّل بيانات الفاتورة من الشكل المستخدم في `InvoicePreview` إلى الشكل الذي يتوقعه `TemplateRenderer`.

```typescript
function transformInvoiceToRendererData(
  invoice: InvoiceData,
  orgSettings: OrgFinanceSettings
): RendererInvoiceData {
  return {
    // === معلومات المستند ===
    documentType: "invoice",
    documentNumber: invoice.invoiceNo,
    invoiceType: invoice.invoiceType, // STANDARD | TAX | SIMPLIFIED
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,

    // === معلومات العميل ===
    clientName: invoice.clientName || "",
    clientCompany: invoice.clientCompany || "",
    clientPhone: invoice.clientPhone || "",
    clientEmail: invoice.clientEmail || "",
    clientAddress: invoice.clientAddress || "",
    clientTaxNumber: invoice.clientTaxNumber || "",

    // === البنود ===
    items: (invoice.items || [])
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item, index) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        unit: item.unit || "",
        sortOrder: item.sortOrder ?? index,
      })),

    // === المبالغ ===
    subtotal: Number(invoice.subtotal ?? 0),
    discountPercent: Number(invoice.discountPercent ?? 0),
    discountAmount: Number(invoice.discountAmount ?? 0),
    vatPercent: Number(invoice.vatPercent ?? 15),
    vatAmount: Number(invoice.vatAmount ?? 0),
    totalAmount: Number(invoice.totalAmount ?? 0),
    paidAmount: Number(invoice.paidAmount ?? 0),
    remainingAmount: Number(invoice.totalAmount ?? 0) - Number(invoice.paidAmount ?? 0),

    // === ZATCA ===
    qrCode: invoice.qrCode || null,
    zatcaUuid: invoice.zatcaUuid || null,

    // === نصوص ===
    paymentTerms: invoice.paymentTerms || "",
    notes: invoice.notes || "",

    // === معلومات البائع (المُجمّدة عند الإصدار أو من الإعدادات) ===
    sellerName: invoice.sellerName || orgSettings?.companyNameAr || "",
    sellerAddress: invoice.sellerAddress || orgSettings?.address || "",
    sellerPhone: invoice.sellerPhone || orgSettings?.phone || "",
    sellerTaxNumber: invoice.sellerTaxNumber || orgSettings?.taxNumber || "",

    // === بيانات بنكية ===
    bankName: orgSettings?.bankName || "",
    iban: orgSettings?.iban || "",
    accountName: orgSettings?.companyNameAr || "",
  };
}
```

#### 1.2 دالة تحويل بيانات المنشأة

```typescript
function transformOrganizationData(
  organization: OrganizationData,
  orgSettings: OrgFinanceSettings
): RendererOrganizationData {
  return {
    name: orgSettings?.companyNameAr || organization.name || "",
    nameEn: orgSettings?.companyNameEn || organization.name || "",
    logo: organization.logo || null,
    address: orgSettings?.address || "",
    phone: orgSettings?.phone || "",
    email: orgSettings?.email || "",
    taxNumber: orgSettings?.taxNumber || "",
    crNumber: orgSettings?.crNumber || "",
    website: orgSettings?.website || "",
    // بيانات بنكية
    bankName: orgSettings?.bankName || "",
    iban: orgSettings?.iban || "",
    accountName: orgSettings?.companyNameAr || "",
  };
}
```

#### 1.3 دالة القالب الافتراضي (fallback)

للفواتير التي أُنشئت بدون قالب أو بالقالب الافتراضي القديم:

```typescript
import { DEFAULT_INVOICE_ELEMENTS } from "../../lib/default-templates";

function getDefaultInvoiceElements(): TemplateElement[] {
  // استخدم عناصر القالب الافتراضي الموجودة في default-templates.ts
  // هذا يضمن أن الفواتير القديمة بدون قالب تعرض بشكل مقبول
  return DEFAULT_INVOICE_ELEMENTS;
}
```

> **ملاحظة مهمة:** ابحث في `default-templates.ts` عن المصفوفة الافتراضية للعناصر. يجب أن تكون موجودة تحت اسم مثل `DEFAULT_INVOICE_ELEMENTS` أو ضمن `defaultInvoiceTemplate`. إذا لم تكن مُصدّرة، صدّرها.

#### 1.4 مكون جدول المدفوعات

```typescript
function PaymentsTable({
  payments,
  primaryColor,
}: {
  payments: PaymentData[];
  primaryColor: string;
}) {
  // جدول المدفوعات ليس جزءاً من عناصر القالب
  // لذا يُعرض بشكل منفصل تحت محتوى القالب
  // استخدم نفس التصميم الحالي من InvoicePreview مع تطبيق اللون الرئيسي
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-bold" style={{ color: primaryColor }}>
        سجل المدفوعات
      </h4>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: primaryColor + "30" }}>
            <th className="py-1.5 text-right text-muted-foreground">التاريخ</th>
            <th className="py-1.5 text-right text-muted-foreground">الطريقة</th>
            <th className="py-1.5 text-right text-muted-foreground">المرجع</th>
            <th className="py-1.5 text-left text-muted-foreground">المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-muted/30">
              <td className="py-1.5">{formatDate(payment.paymentDate)}</td>
              <td className="py-1.5">{getPaymentMethodLabel(payment.paymentMethod)}</td>
              <td className="py-1.5">{payment.referenceNo || "—"}</td>
              <td className="py-1.5 text-left font-medium">
                <Currency amount={Number(payment.amount)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### المهمة 2: تعديل `InvoicePreview.tsx` — استبدال التصميم المُثبّت

**الملف:** `apps/web/modules/saas/finance/components/invoices/InvoicePreview.tsx`

**الخطوات:**

#### 2.1 اقرأ وافهم الكود الحالي بالكامل

قبل أي تعديل، افهم:
- كيف يتم جلب بيانات الفاتورة (ORPC query)
- كيف يتم جلب إعدادات المنشأة
- ما هو الـ sticky header وزر الطباعة
- حالات التحميل والخطأ وعدم العثور

#### 2.2 أضف جلب بيانات القالب

الفاتورة لديها `templateId`. اجلب القالب:

```typescript
// أضف هذا بجانب queries الموجودة
const { data: template } = orpcClient.finance.templates.getById.useQuery(
  { organizationId, templateId: invoice?.templateId! },
  { enabled: !!invoice?.templateId }
);
```

> **ملاحظة:** تحقق من اسم الـ query الصحيح بالبحث في الكود. قد يكون `templates.getById` أو `getTemplate`. ابحث في `packages/api/modules/finance/` عن الإجراء.

#### 2.3 استبدل محتوى الفاتورة

**احذف** كل الـ JSX المُثبّت لعرض الفاتورة (من بداية محتوى A4 إلى نهايته). **أبقِ** على:
- Sticky header مع breadcrumb وزر الطباعة
- حاوية الصفحة الخارجية (`max-w-[210mm]`, `mx-auto`)
- حالات التحميل والخطأ

**استبدل** بمكون `InvoiceDocument`:

```tsx
// بدلاً من ~400 سطر من JSX المُثبّت:
<InvoiceDocument
  invoice={invoice}
  organization={organization}
  orgSettings={orgSettings}
  template={template ? {
    content: template.content as TemplateElement[],
    settings: template.settings as TemplateSettings,
  } : null}
  options={{
    showWatermark: false,          // InvoicePreview لا يعرض watermark
    showStatusBadge: false,
    printMode: true,
    showPayments: true,
  }}
/>
```

#### 2.4 حافظ على حاوية A4 والطباعة

```tsx
{/* Sticky Header — يبقى كما هو */}
<div className="sticky top-0 z-10 print:hidden ...">
  {/* breadcrumb + print button */}
</div>

{/* حاوية A4 */}
<div className="mx-auto max-w-[210mm] print:max-w-none">
  <div className="bg-white shadow-lg print:shadow-none">
    <InvoiceDocument
      invoice={invoice}
      organization={organization}
      orgSettings={orgSettings}
      template={templateData}
      options={{ printMode: true, showPayments: true }}
    />
  </div>
</div>
```

#### 2.5 تأكد من عمل الطباعة

اختبر أن `window.print()` لا يزال يعمل بشكل صحيح. `InvoiceDocument` يطبق أنماط الطباعة عبر CSS classes. تأكد أن:
- `print:hidden` يعمل على sticky header
- الألوان تطبع بشكل صحيح (لا ألوان داكنة على خلفية بيضاء)
- لا page breaks داخل الجدول

---

### المهمة 3: تعديل `InvoiceView.tsx` — استبدال `InvoiceTabContent`

**الملف:** `apps/web/modules/saas/finance/components/invoices/InvoiceView.tsx`

**الخطوات:**

#### 3.1 ابحث عن `InvoiceTabContent` داخل الملف

هذا مكون فرعي داخل نفس الملف (حوالي سطر 595). هو المسؤول عن عرض الفاتورة كمستند مطبوع داخل تبويب "الفاتورة".

#### 3.2 أضف جلب القالب

مثل `InvoicePreview`، أضف query لجلب القالب:

```typescript
const { data: template } = orpcClient.finance.templates.getById.useQuery(
  { organizationId, templateId: invoice?.templateId! },
  { enabled: !!invoice?.templateId }
);
```

#### 3.3 استبدل محتوى `InvoiceTabContent`

`InvoiceTabContent` الحالي يحتوي ~270 سطر من JSX مُثبّت مشابه لـ `InvoicePreview`. استبدله:

```tsx
function InvoiceTabContent({ invoice, organization, orgSettings, template }: Props) {
  const isDraft = invoice.status === "DRAFT";

  return (
    <div className="mx-auto max-w-[210mm]">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <InvoiceDocument
          invoice={invoice}
          organization={organization}
          orgSettings={orgSettings}
          template={template ? {
            content: template.content as TemplateElement[],
            settings: template.settings as TemplateSettings,
          } : null}
          options={{
            showWatermark: isDraft,     // ★ InvoiceView يعرض watermark للمسودات
            showStatusBadge: true,
            printMode: false,
            showPayments: true,
          }}
        />
      </div>
    </div>
  );
}
```

#### 3.4 لا تعدّل الأقسام الأخرى

**لا تمس:**
- `DetailsTabContent` — يبقى كما هو (بيانات وصفية)
- `ActivityTabContent` — يبقى كما هو (سجل النشاط)
- Sticky header وشريط الإجراءات — يبقى كما هو
- جميع الـ Mutations والـ Dialogs — تبقى كما هي

---

### المهمة 4: التأكد من توافق بيانات `TemplateRenderer`

**الملف:** `apps/web/modules/saas/finance/components/templates/renderer/TemplateRenderer.tsx`

#### 4.1 تحقق من interfaces البيانات

`TemplateRenderer` يتوقع `data` بشكل معين. تحقق من الـ interfaces المُعرّفة:

```typescript
// ابحث عن interface مثل:
interface InvoiceData {
  // أو QuotationData أو DocumentData
}
```

تأكد أن `transformInvoiceToRendererData` في `InvoiceDocument.tsx` تُعيد كائناً يطابق هذا الـ interface. إذا كانت هناك حقول ناقصة، أضفها.

#### 4.2 تحقق من بيانات المنشأة

```typescript
// ابحث عن interface:
interface OrganizationData {
  name: string;
  logo?: string;
  // ...
}
```

تأكد أن `transformOrganizationData` تُعيد كائناً متوافقاً.

#### 4.3 أضف الحقول المفقودة إذا لزم

إذا وجدت أن `TemplateRenderer` يحتاج حقولاً غير موجودة في الـ interfaces، أضفها بقيم اختيارية (`?`) مع fallbacks.

**حقول مهمة قد تكون مفقودة:**
- `paidAmount` / `remainingAmount` — أُضيفت في المرحلة 1، تحقق أنها تُمرر
- `sellerName` / `sellerAddress` — معلومات البائع المُجمّدة
- `bankName` / `iban` — بيانات بنكية
- `invoiceType` — نوع الفاتورة (لعرضه في شريط المعلومات)

#### 4.4 تعامل مع بيانات `sample-preview-data.ts` مقابل البيانات الحقيقية

`TemplateRenderer` في وضع المحرر يستخدم بيانات نموذجية من `sample-preview-data.ts`. عند استخدامه مع فاتورة حقيقية، تأكد أن:
- الأرقام حقيقية (ليست صفر)
- البنود موجودة (ليست فارغة)
- التواريخ بالتنسيق الصحيح

---

### المهمة 5: معالجة حالات الحافة (Edge Cases)

#### 5.1 فاتورة بدون قالب (`templateId === null`)

كثير من الفواتير الموجودة أُنشئت بدون اختيار قالب. يجب أن يبقى عرضها يعمل:

```typescript
// في InvoiceDocument.tsx:
const templateElements = template?.content ?? getDefaultInvoiceElements();
const templateSettings = template?.settings ?? DEFAULT_TEMPLATE_SETTINGS;
```

تأكد أن `getDefaultInvoiceElements()` تُعيد عناصر تُنتج تصميماً مقبولاً مشابهاً للتصميم المُثبّت القديم.

#### 5.2 قالب محذوف

إذا حُذف القالب بعد إنشاء الفاتورة:

```typescript
const { data: template, error: templateError } = orpcClient.finance.templates.getById.useQuery(
  { organizationId, templateId: invoice?.templateId! },
  { enabled: !!invoice?.templateId }
);

// إذا فشل جلب القالب، استخدم الافتراضي
const templateData = templateError ? null : template;
```

#### 5.3 حالة التحميل

أثناء تحميل القالب، يجب عرض الفاتورة بالقالب الافتراضي (أو skeleton):

```typescript
const isTemplateLoading = !!invoice?.templateId && !template && !templateError;

// خيار 1: عرض بالقالب الافتراضي أثناء التحميل
// خيار 2: عرض skeleton (مفضل إذا كان سريعاً)
if (isTemplateLoading) {
  return <InvoiceDocumentSkeleton />;
}
```

#### 5.4 الفاتورة من نوع إشعار دائن (CREDIT_NOTE)

إشعارات الدائن لها `status === "CREDIT_NOTE"` ومبالغ سالبة. تأكد أن:
- القالب يعرض المبالغ السالبة بشكل صحيح
- لون مميز لإشعار الدائن (وردي/أحمر)

#### 5.5 التوافق مع الوضع الداكن

`InvoiceDocument` يجب أن يعمل في كلا الوضعين. عند الطباعة، فرض الخلفية البيضاء:

```tsx
<div className="bg-white print:!bg-white" style={{ colorScheme: "light" }}>
  {/* محتوى الفاتورة */}
</div>
```

---

## قواعد التنفيذ الحرجة

### 1. لا تحذف — استبدل بحذر

- **لا تحذف** `InvoicePreview.tsx` أو `InvoiceView.tsx`. عدّل المحتوى الداخلي فقط.
- **لا تحذف** الدوال المساعدة المستخدمة في أماكن أخرى.
- **احتفظ** بجميع الـ imports الموجودة التي تُستخدم في أجزاء أخرى من الملف.

### 2. اقرأ قبل أن تكتب

قبل تعديل أي ملف:
1. اقرأ الملف بالكامل
2. افهم كل الـ queries و mutations المستخدمة
3. حدد بالضبط أي أسطر ستتأثر
4. تأكد أنك لا تكسر شيئاً آخر

### 3. البيانات يجب أن تمر بالكامل

`TemplateRenderer` يحتاج **كل** البيانات التي كان يعرضها التصميم المُثبّت:
- معلومات البائع (المُجمّدة)
- معلومات العميل
- البنود مع الترتيب
- المبالغ بدقة (Decimal → Number)
- QR Code
- المدفوعات
- شروط الدفع والملاحظات

### 4. الأولوية للتوافق

إذا واجهت تعارضاً بين التصميم الجديد والقديم:
- **الفواتير القديمة بدون قالب** يجب أن تبدو مقبولة (ليس بالضرورة مطابقة للتصميم القديم، لكن لا شيء مكسور)
- **الفواتير الجديدة مع قالب** يجب أن تعكس تصميم القالب المختار

### 5. الطباعة يجب أن تعمل

بعد التعديل، اختبر:
- `window.print()` من `InvoicePreview`
- الألوان تظهر في الطباعة
- لا page breaks في منتصف الجدول
- حجم A4 محفوظ
- RTL يعمل في الطباعة

### 6. تنسيق العملة موحّد

استخدم مكون `Currency` من `shared/Currency.tsx` في كل مكان. **احذف** أي `formatCurrency` محلي في `InvoiceTabContent` (كان كود ميت أصلاً — مشكلة 12 في المرجع).

---

## ترتيب التنفيذ

```
الخطوة 1: اقرأ وافهم الملفات
├── اقرأ InvoicePreview.tsx بالكامل
├── اقرأ InvoiceView.tsx بالكامل (ركّز على InvoiceTabContent)
├── اقرأ TemplateRenderer.tsx وافهم الـ interfaces
├── اقرأ sample-preview-data.ts لفهم شكل البيانات
└── اقرأ default-templates.ts (النسخة المحدّثة مع القوالب الجديدة)

الخطوة 2: أنشئ InvoiceDocument.tsx
├── عرّف الـ interfaces
├── اكتب دوال التحويل (transform functions)
├── اكتب المكون الرئيسي
├── اكتب PaymentsTable
└── تأكد من توافق الأنواع (TypeScript)

الخطوة 3: عدّل InvoicePreview.tsx
├── أضف query لجلب القالب
├── احذف JSX المُثبّت لمحتوى الفاتورة
├── أضف <InvoiceDocument /> مكانه
├── حافظ على sticky header وزر الطباعة
└── اختبر TypeScript (tsc --noEmit)

الخطوة 4: عدّل InvoiceView.tsx
├── أضف query لجلب القالب
├── استبدل InvoiceTabContent بـ <InvoiceDocument />
├── مرر template data من المكون الأب
├── حافظ على كل شيء آخر (Details, Activity, Actions)
└── اختبر TypeScript

الخطوة 5: معالجة حالات الحافة
├── اختبر فاتورة بدون قالب
├── اختبر فاتورة مع كل قالب من الثلاثة
├── اختبر الطباعة
├── تحقق من عدم وجود أخطاء TypeScript
└── تحقق من عمل الـ mutations (حذف، دفع، إصدار)
```

---

## ملخص الملفات المعدّلة

| الملف | الإجراء | الحجم التقريبي |
|-------|---------|---------------|
| `InvoiceDocument.tsx` | **جديد** | ~200 سطر |
| `InvoicePreview.tsx` | تعديل (استبدال ~400 سطر JSX بـ ~15 سطر) | ينخفض من ~515 إلى ~130 |
| `InvoiceView.tsx` | تعديل (استبدال InvoiceTabContent ~270 سطر بـ ~20 سطر) | ينخفض من ~1190 إلى ~940 |
| `TemplateRenderer.tsx` | تعديل طفيف (إضافة حقول interfaces إذا لزم) | ~5-10 أسطر |
| `default-templates.ts` | تعديل طفيف (تصدير DEFAULT_INVOICE_ELEMENTS إذا لم يكن مُصدّراً) | ~2 أسطر |

**النتيجة:** حذف ~650 سطر مكرر واستبدالها بمكون واحد مشترك يستخدم `TemplateRenderer`.
