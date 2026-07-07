# مرجع نظام الفواتير والقوالب - مسار

> **آخر تحديث:** 2026-02-27
> هذا الملف يوثق البنية الكاملة لنظام الفواتير والقوالب، ويشرح الفجوة بين نظام القوالب القابل للتخصيص وعرض الفواتير الفعلي المُثبّت (hardcoded).

---

## جدول المحتويات

1. [هيكل الملفات وعلاقاتها](#1-هيكل-الملفات-وعلاقاتها)
2. [نظام عرض الفاتورة](#2-نظام-عرض-الفاتورة)
3. [نظام القوالب](#3-نظام-القوالب)
4. [الفجوة بين القوالب والعرض الفعلي](#4-الفجوة-بين-القوالب-والعرض-الفعلي)
5. [كيفية إضافة قوالب جديدة](#5-كيفية-إضافة-قوالب-جديدة)
6. [قاعدة البيانات](#6-قاعدة-البيانات)
7. [API و ORPC](#7-api-و-orpc)
8. [تدفقات العمل الرئيسية](#8-تدفقات-العمل-الرئيسية)
9. [المشاكل والأخطاء المكتشفة مع حلول مقترحة](#9-المشاكل-والأخطاء-المكتشفة-مع-حلول-مقترحة)

---

## 1. هيكل الملفات وعلاقاتها

### خريطة الملفات الكاملة

```
apps/web/
├── app/(saas)/app/(organizations)/[organizationSlug]/finance/invoices/
│   ├── page.tsx                         ← قائمة الفواتير (يستخدم InvoicesList)
│   ├── new/page.tsx                     ← إنشاء فاتورة جديدة (يستخدم CreateInvoiceForm)
│   └── [invoiceId]/
│       ├── page.tsx                     ← عرض الفاتورة (يستخدم InvoiceView)
│       ├── edit/page.tsx                ← تعديل فاتورة مسودة (يستخدم InvoiceEditor)
│       ├── preview/page.tsx             ← معاينة طباعة A4 (يستخدم InvoicePreview)
│       └── credit-note/
│           ├── page.tsx                 ← صفحة إشعار الدائن
│           └── CreditNoteForm.tsx       ← نموذج إشعار الدائن
│
├── modules/saas/finance/
│   ├── components/
│   │   ├── invoices/
│   │   │   ├── InvoicesList.tsx         ← جدول الفواتير مع الفلاتر والأفعال
│   │   │   ├── CreateInvoiceForm.tsx    ← نموذج إنشاء فاتورة (عمودين)
│   │   │   ├── InvoiceEditor.tsx        ← محرر فاتورة المسودة (بطاقات)
│   │   │   ├── InvoicePreview.tsx       ← عرض طباعة A4 ★ تصميم مُثبّت
│   │   │   ├── InvoiceView.tsx          ← عرض تفاصيل + فاتورة + نشاط ★ تصميم مُثبّت
│   │   │   └── InvoicesHeaderActions.tsx ← زر إنشاء فاتورة جديدة
│   │   │
│   │   ├── templates/
│   │   │   ├── TemplateEditor.tsx       ← محرر القوالب (drag & drop)
│   │   │   ├── TemplatePreview.tsx      ← معاينة القالب مع تكبير/تصغير
│   │   │   ├── ComponentsPanel.tsx      ← لوحة العناصر (14 نوع)
│   │   │   └── renderer/
│   │   │       └── TemplateRenderer.tsx ← محرك عرض القوالب الديناميكي
│   │   │
│   │   └── shared/
│   │       ├── Currency.tsx             ← عرض المبالغ بالريال السعودي
│   │       ├── StatusBadge.tsx          ← شارة الحالة الملونة
│   │       ├── AmountSummary.tsx        ← ملخص الحسابات
│   │       ├── ItemsEditor.tsx          ← جدول تعديل البنود
│   │       └── ClientSelector.tsx       ← محدد العميل (dropdown)
│   │
│   └── lib/
│       ├── utils.ts                     ← دوال مساعدة (تنسيق، حسابات)
│       ├── default-templates.ts         ← إعدادات القوالب الافتراضية
│       └── sample-preview-data.ts       ← بيانات نموذجية للمعاينة
│
packages/
├── api/modules/finance/
│   ├── router.ts                        ← جميع مسارات API المالية
│   └── procedures/
│       └── create-invoice.ts            ← إجراءات الفواتير (13 إجراء)
│
└── database/prisma/
    ├── schema.prisma                    ← نماذج قاعدة البيانات
    └── queries/finance.ts               ← استعلامات قاعدة البيانات
```

### مخطط تدفق البيانات

```
┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│   صفحات Next.js  │───→│  مكونات React    │───→│   ORPC Client     │
│  (pages/*.tsx)   │    │  (components/*)  │    │  (orpcClient.*)   │
└─────────────────┘    └──────────────────┘    └───────┬───────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│  Prisma Client   │←──│  Database Queries │←──│   API Procedures   │
│  (PostgreSQL)    │    │  (finance.ts)    │    │  (create-invoice) │
└─────────────────┘    └──────────────────┘    └───────────────────┘
```

### العلاقة بين الملفات الرئيسية

| الملف | يستدعي | يُستدعى من |
|-------|--------|-----------|
| `InvoicePreview.tsx` | `Currency`, `StatusBadge`, `utils.ts`, ORPC query | `preview/page.tsx` |
| `InvoiceView.tsx` | `Currency`, `StatusBadge`, `utils.ts`, ORPC (query + mutations) | `[invoiceId]/page.tsx` |
| `CreateInvoiceForm.tsx` | `ItemsEditor`, `ClientSelector`, `AmountSummary`, `Currency`, ORPC mutations | `new/page.tsx` |
| `InvoiceEditor.tsx` | `ItemsEditor`, `ClientSelector`, `AmountSummary`, `Currency`, ORPC mutations | `edit/page.tsx` |
| `TemplateRenderer.tsx` | `default-templates.ts`, `sample-preview-data.ts` | `TemplateEditor.tsx`, `TemplatePreview.tsx` |
| `TemplateEditor.tsx` | `ComponentsPanel`, `TemplateRenderer`, `PropertiesPanel`, ORPC mutations | صفحة محرر القوالب |

---

## 2. نظام عرض الفاتورة

### InvoicePreview.tsx — عرض الطباعة

**المسار:** `apps/web/modules/saas/finance/components/invoices/InvoicePreview.tsx`

**الغرض:** صفحة معاينة طباعة بحجم A4 احترافي

**البنية الداخلية (من الأعلى إلى الأسفل):**

```
┌─────────────────────────────────────────────┐
│ Sticky Header (مخفي عند الطباعة)             │
│ [← رجوع] المالية > الفواتير > INV-... > معاينة │ [طباعة]
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Header: معلومات البائع + QR Code        │ │
│ │ ─────────────────────────────────────── │ │
│ │ نوع الفاتورة    │    تاريخ الإصدار      │ │
│ │ رقم الفاتورة    │    تاريخ الاستحقاق    │ │
│ │ شارة الحالة     │                       │ │
│ │ ─────────────────────────────────────── │ │
│ │ معلومات العميل (بطاقة ملونة)           │ │
│ │ ─────────────────────────────────────── │ │
│ │ جدول البنود                             │ │
│ │ # │ الوصف │ الوحدة │ الكمية │ السعر │ المجموع │
│ │ ─────────────────────────────────────── │ │
│ │           ملخص المبالغ (يمين)           │ │
│ │           المجموع الفرعي               │ │
│ │           الخصم (إن وجد)               │ │
│ │           ضريبة القيمة المضافة          │ │
│ │           الإجمالي                      │ │
│ │           المدفوع / المتبقي            │ │
│ │ ─────────────────────────────────────── │ │
│ │ جدول المدفوعات (إن وجدت)              │ │
│ │ ─────────────────────────────────────── │ │
│ │ قسم ZATCA QR (إن وجد)                 │ │
│ │ ─────────────────────────────────────── │ │
│ │ شروط الدفع (إن وجدت)                  │ │
│ │ ملاحظات (إن وجدت)                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**حجم الصفحة:** A4 (210mm × 297mm)
- الحاوية الخارجية: `max-w-[210mm]` مع `mx-auto`
- المحتوى الداخلي: `min-h-[297mm]` مع `p-8` (padding)
- عند الطباعة: `print:p-6`, `print:max-w-none`, `print:shadow-none`

**أنماط الطباعة (Print CSS):**
```css
/* يتم إخفاء عناصر الواجهة */
.print:hidden  → Sticky header, أزرار التحكم
/* يتم تعديل الألوان */
.print:text-black → النص الرئيسي
.print:text-gray-600 → النص الثانوي
.print:bg-white → الخلفية
.print:border-gray-400 → الحدود
/* يتم إزالة التأثيرات */
.print:shadow-none, .print:rounded-none, .print:border-none
```

**البيانات المعروضة:**
- معلومات البائع: `sellerName` المُجمّدة أو `orgSettings.companyNameAr` كاحتياط
- رمز QR: يظهر لأي فاتورة بها `qrCode` (ضريبية/مبسطة)
- البنود: ترتيب حسب `sortOrder` من قاعدة البيانات
- المبالغ: `subtotal`, `discountAmount`, `vatAmount`, `totalAmount`, `paidAmount`

**Props:**
```typescript
interface InvoicePreviewProps {
  organizationId: string;
  organizationSlug: string;
  invoiceId: string;
}
```

---

### InvoiceView.tsx — عرض التفاصيل الكامل

**المسار:** `apps/web/modules/saas/finance/components/invoices/InvoiceView.tsx`

**الغرض:** عرض شامل للفاتورة مع إجراءات وتفاصيل وسجل نشاط

**البنية (أقسام الصفحة):**

```
┌────────────────────────────────────────────────┐
│ 1. Sticky Header: رقم الفاتورة + شارة الحالة   │
│    [← رجوع] زر إصدار (للمسودة فقط)            │
├────────────────────────────────────────────────┤
│ 2. شريط الإجراءات (Action Bar):                 │
│    [تعديل] [طباعة] [PDF] | [دفعة] [إشعار دائن] │
│    [ملاحظة] [نسخ]                [حذف]         │
├────────────────────────────────────────────────┤
│ 3. InvoiceTabContent — فاتورة جاهزة للطباعة     │
│    (نفس تصميم InvoicePreview تقريباً)           │
│    + علامة مائية "مسودة" للمسودات               │
├────────────────────────────────────────────────┤
│ 4. DetailsTabContent — بيانات تفصيلية           │
│    ├─ بطاقة المعلومات (metadata)                │
│    ├─ بطاقة المدفوعات                          │
│    ├─ بطاقة إشعارات الدائن                     │
│    └─ بطاقة الفاتورة المرتبطة (لإشعارات الدائن)│
├────────────────────────────────────────────────┤
│ 5. ActivityTabContent — سجل النشاط (timeline)    │
└────────────────────────────────────────────────┘
```

**المكونات الفرعية (داخل InvoiceView.tsx):**

| المكون | الغرض | السطر |
|--------|------|------|
| `InvoiceTabContent` | فاتورة مطبوعة مع watermark | ~595 |
| `DetailsTabContent` | بيانات وصفية + مدفوعات + إشعارات | ~870 |
| `ActivityTabContent` | خط زمني للأحداث | ~1061 |
| `DetailRow` | صف معلومة واحدة (أيقونة + تسمية + قيمة) | ~1169 |

**Mutations (العمليات):**

| العملية | الشرط | الوصف |
|---------|------|------|
| `issueMutation` | المسودة فقط | DRAFT → ISSUED |
| `duplicateMutation` | دائماً | إنشاء نسخة جديدة |
| `addPaymentMutation` | غير مسودة/مدفوعة/ملغاة | تسجيل دفعة |
| `deletePaymentMutation` | غير مسودة/مدفوعة/ملغاة | حذف دفعة |
| `deleteMutation` | المسودة فقط | حذف الفاتورة |
| `updateNotesMutation` | دائماً | تحديث الملاحظات |

**حالات الفاتورة المُشتقة:**
```typescript
const isDraft = invoice?.status === "DRAFT";
const isPaid = invoice?.status === "PAID";
const isCancelled = invoice?.status === "CANCELLED";
const canAddPayment = !isDraft && !isPaid && !isCancelled;
const canCreditNote = !isDraft && !isCancelled;
```

**Dialogs (نوافذ الحوار):**
1. **إصدار الفاتورة** — `AlertDialog` تأكيدي
2. **إضافة دفعة** — `Dialog` مع نموذج (مبلغ، تاريخ، طريقة، مرجع، ملاحظات)
3. **حذف دفعة** — `AlertDialog` تأكيدي
4. **حذف فاتورة** — `AlertDialog` تأكيدي
5. **إضافة ملاحظة** — `Dialog` مع `Textarea`

---

## 3. نظام القوالب

### default-templates.ts — الإعدادات الافتراضية

**المسار:** `apps/web/modules/saas/finance/lib/default-templates.ts`

**الواجهات (Interfaces):**

```typescript
interface TemplateElement {
  id: string;                          // معرف فريد (el_timestamp_random)
  type: ElementType;                   // نوع العنصر
  enabled: boolean;                    // مفعّل/معطّل
  order: number;                       // ترتيب العرض
  settings: Record<string, unknown>;   // إعدادات خاصة بالعنصر
}

interface TemplateSettings {
  backgroundColor: string;   // "#ffffff"
  primaryColor: string;      // "#3b82f6"
  fontFamily: string;        // "Cairo"
  fontSize: string;          // "14px"
  lineHeight: string;        // "1.6"
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  margins: string;           // "20mm"
  vatPercent: number;        // 15
  currency: string;          // "SAR"
}

interface DefaultTemplateConfig {
  name: string;
  nameAr: string;
  nameEn: string;
  description: string;
  descriptionAr: string;
  descriptionEn: string;
  templateType: "QUOTATION" | "INVOICE";
  elements: TemplateElement[];
  settings: TemplateSettings;
}
```

**الإعدادات الافتراضية:**
```typescript
DEFAULT_TEMPLATE_SETTINGS = {
  backgroundColor: "#ffffff",
  primaryColor: "#3b82f6",   // أزرق
  fontFamily: "Cairo",
  fontSize: "14px",
  lineHeight: "1.6",
  pageSize: "A4",
  orientation: "portrait",
  margins: "20mm",
  vatPercent: 15,
  currency: "SAR",
};
```

**العناصر الافتراضية (9 عناصر) — للفواتير:**

| الترتيب | النوع | الإعدادات الرئيسية |
|---------|-------|-------------------|
| 1 | `header` | showLogo, showCompanyName, showAddress, showBilingualName, layout:"modern" |
| 2 | `clientInfo` | showTaxNumber, showEmail, showPhone, showCompanyName |
| 3 | `itemsTable` | showQuantity, showUnit, showUnitPrice, showRowNumbers, alternatingColors |
| 4 | `totals` | showDiscount, showVat, showAmountInWords, highlightTotal |
| 5 | `bankDetails` | showBankName, showIban, showAccountName |
| 6 | `terms` | showPaymentTerms (delivery و warranty معطلة للفواتير) |
| 7 | `signature` | showDate, showStampArea, twoColumns |
| 8 | `qrCode` | size:"medium", showZatcaCompliance |
| 9 | `footer` | showThankYouMessage, showYear |

**ألوان القوالب المتاحة:**
| اللون | القيمة | التسمية |
|------|--------|--------|
| أزرق | `#3b82f6` | Blue |
| أخضر | `#10b981` | Green |
| بنفسجي | `#8b5cf6` | Purple |
| برتقالي | `#f59e0b` | Orange |
| أحمر | `#ef4444` | Red |
| سماوي | `#06b6d4` | Cyan |
| رمادي داكن | `#1e293b` | Slate |

**العملات المدعومة:** SAR, AED, USD, EUR, GBP, KWD, QAR, BHD, OMR

**دوال مساعدة:**
- `numberToArabicWords(amount)` — تحويل رقم إلى كلمات عربية (مع ريال وهللة)
- `numberToEnglishWords(amount)` — تحويل رقم إلى كلمات إنجليزية
- `getAmountInWords(amount, locale)` — اختيار اللغة حسب الإعداد

---

### TemplateRenderer.tsx — محرك العرض

**المسار:** `apps/web/modules/saas/finance/components/templates/renderer/TemplateRenderer.tsx`

**الغرض:** يأخذ إعدادات القالب (عناصر + settings) وبيانات الفاتورة/عرض السعر ويعرضها بشكل ديناميكي.

**Props الرئيسية:**
```typescript
interface TemplateRendererProps {
  elements: TemplateElement[];       // عناصر القالب المُرتبة
  settings: TemplateSettings;        // إعدادات القالب (ألوان، خط، إلخ)
  data: QuotationData | InvoiceData; // بيانات المستند
  organization: OrganizationData;    // بيانات المنشأة
  interactive?: boolean;             // وضع تفاعلي (للمحرر)
  selectedElement?: string;          // العنصر المحدد (للمحرر)
  onSelectElement?: (id: string) => void;
}
```

**آلية العمل:**
1. يستقبل مصفوفة `elements` من القالب
2. يرشّح العناصر المُفعّلة (`enabled: true`)
3. يرتبها حسب `order`
4. لكل عنصر، يعرض المكون المناسب حسب `type`
5. يمرر بيانات المستند والمنشأة لكل مكون
6. في الوضع التفاعلي: يضيف حدود تحديد وتسميات حول العناصر

**أنواع العناصر المدعومة:**

| النوع | المكون | الوصف |
|------|--------|------|
| `header` | HeaderElement | شعار الشركة، الاسم، العنوان |
| `clientInfo` | ClientInfoElement | معلومات العميل والمستند |
| `itemsTable` | ItemsTableElement | جدول البنود مع الأعمدة |
| `totals` | TotalsElement | المجاميع والخصومات والضرائب |
| `terms` | TermsElement | شروط الدفع والتسليم والضمان |
| `signature` | SignatureElement | منطقة التوقيع والختم |
| `bankDetails` | BankDetailsElement | معلومات الحساب البنكي |
| `qrCode` | QrCodeElement | رمز QR لـ ZATCA |
| `footer` | FooterElement | رسالة شكر وتذييل |
| `text` | TextElement | نص حر |
| `image` | ImageElement | صورة |

---

### TemplateEditor.tsx — محرر القوالب

**المسار:** `apps/web/modules/saas/finance/components/templates/TemplateEditor.tsx`

**الغرض:** واجهة سحب وإفلات لتصميم قوالب الفواتير وعروض الأسعار

**التخطيط (ثلاثة أعمدة):**
```
┌──────────────┬────────────────────────┬──────────────┐
│ ComponentsPanel│  InteractivePreview   │ PropertiesPanel│
│ (عناصر للسحب) │  (معاينة مباشرة)      │ (إعدادات العنصر)│
│              │                        │              │
│ أساسي:       │  ┌──────────────────┐  │ اسم العنصر    │
│ □ ترويسة     │  │  Header          │  │ مفعّل ☑       │
│ □ معلومات    │  │  Client Info     │  │ الإعدادات...   │
│ □ جدول       │  │  Items Table     │  │              │
│ □ مجاميع     │  │  Totals          │  │              │
│              │  │  ...             │  │              │
│ متقدم:       │  └──────────────────┘  │              │
│ □ QR         │                        │              │
│ □ بنك        │                        │              │
│ □ صورة       │                        │              │
└──────────────┴────────────────────────┴──────────────┘
```

**القدرات:**
- إضافة/إزالة عناصر بالسحب أو النقر
- إعادة ترتيب العناصر (نقل لأعلى/أسفل)
- تغيير حجم العناصر (بخطوات 20px)
- تبديل رؤية العنصر (مفعّل/معطّل)
- تعديل إعدادات كل عنصر عبر `PropertiesPanel`
- تراجع/إعادة (Undo/Redo)
- حفظ كقالب جديد أو تحديث قالب موجود

---

### TemplatePreview.tsx — معاينة القالب

**المسار:** `apps/web/modules/saas/finance/components/templates/TemplatePreview.tsx`

**الغرض:** عرض معاينة بحجم A4 مع تحكم بالتكبير/التصغير

**الميزات:**
- محاكاة حجم ورقة A4 (794px × 1123px عند 96 DPI)
- تكبير/تصغير من 0.3x إلى 1.5x
- طباعة عبر `window.print()`
- يستخدم `TemplateRenderer` للعرض
- بيانات نموذجية من `sample-preview-data.ts`

**ثابت التحويل:**
```typescript
const MM_TO_PX = 3.7795275591; // مم إلى بكسل (96 DPI)
// A4: 210mm × 297mm → 794px × 1123px
```

---

### ComponentsPanel.tsx — لوحة العناصر

**المسار:** `apps/web/modules/saas/finance/components/templates/ComponentsPanel.tsx`

**أنواع العناصر (14 نوع):**

**عناصر أساسية (8):**
| النوع | الأيقونة | الوصف |
|------|---------|------|
| `header` | Building2 | ترويسة الشركة |
| `clientInfo` | FileText | معلومات العميل |
| `text` | Type | نص حر |
| `itemsTable` | Table | جدول البنود |
| `totals` | Calculator | المجاميع المالية |
| `terms` | ScrollText | الشروط والأحكام |
| `signature` | PenTool | منطقة التوقيع |
| `footer` | Footprints | التذييل |

**عناصر متقدمة (6):**
| النوع | الأيقونة | الوصف |
|------|---------|------|
| `timeline` | Calendar | خط زمني |
| `gallery` | GalleryHorizontalEnd | معرض صور |
| `paymentSchedule` | CreditCard | جدول دفعات |
| `qrCode` | QrCode | رمز QR |
| `image` | Image | صورة |
| `bankDetails` | Landmark | بيانات بنكية |

---

## 4. الفجوة بين القوالب والعرض الفعلي

### المشكلة الجوهرية

```
نظام القوالب (TemplateRenderer)     عرض الفواتير الفعلي
─────────────────────────────────    ─────────────────────────
✓ يدعم ألوان مخصصة                 ✗ ألوان ثابتة (primary + slate)
✓ يدعم خطوط مخصصة                  ✗ خط ثابت (Cairo افتراضي)
✓ يدعم ترتيب عناصر مخصص            ✗ ترتيب ثابت لا يتغير
✓ يدعم إخفاء/إظهار عناصر           ✗ جميع العناصر ثابتة
✓ يدعم 14 نوع عنصر                 ✗ عناصر محددة فقط
✓ يدعم حجم صفحة مختلف              ✗ A4 ثابت فقط
✓ يدعم هوامش مخصصة                 ✗ padding ثابت (p-8)
✓ محرك عرض واحد (TemplateRenderer)  ✗ كود مكرر في ملفين
```

### أين تُستخدم القوالب فعلياً؟

| المكون | يستخدم TemplateRenderer؟ | ملاحظة |
|--------|------------------------|--------|
| `TemplateEditor.tsx` | نعم | عبر InteractivePreview |
| `TemplatePreview.tsx` | نعم | مع بيانات نموذجية |
| `CreateInvoiceForm.tsx` | جزئياً | محدد القالب فقط (لا يؤثر على العرض) |
| **`InvoicePreview.tsx`** | **لا** | **تصميم مُثبّت بالكامل** |
| **`InvoiceView.tsx`** | **لا** | **تصميم مُثبّت بالكامل** |

### التكرار في الكود

`InvoicePreview.tsx` و `InvoiceTabContent` (داخل `InvoiceView.tsx`) يحتويان على نفس التصميم تقريباً مع اختلافات طفيفة:

| الجانب | InvoicePreview | InvoiceTabContent (في InvoiceView) |
|--------|---------------|-----------------------------------|
| علامة مائية DRAFT | لا | نعم |
| Sticky header | نعم (مع breadcrumb) | نعم (مختلف) |
| تنسيق العملة | `Intl.NumberFormat("en-SA")` عبر Currency | `Intl.NumberFormat("ar-SA")` محلي |
| ألوان النص | `text-slate-*` صريحة + `print:text-*` | `text-foreground` / `text-muted-foreground` |
| خلفية العميل | `bg-slate-50` | `bg-gradient-to-br from-primary/5 to-primary/10` |
| شارة الحالة عند الطباعة | `print:hidden` | ظاهرة دائماً |
| عدد الأسطر | ~515 | ~270 (ضمن ملف 1190 سطر) |

### الأثر

1. **تخصيص القالب لا يظهر:** المستخدم يختار قالباً عند إنشاء الفاتورة، لكن ألوان القالب وخطوطه وترتيب عناصره لا تُطبّق أبداً عند عرض/طباعة الفاتورة.
2. **صيانة مضاعفة:** أي تعديل في تصميم الفاتورة يجب تكراره في ملفين.
3. **تجربة مستخدم مضللة:** واجهة محرر القوالب توحي بإمكانية التخصيص، لكن النتيجة الفعلية لا تتغير.

---

## 5. كيفية إضافة قوالب جديدة

### عبر واجهة المحرر

1. افتح محرر القوالب (`TemplateEditor.tsx`)
2. حدد نوع القالب: فاتورة أو عرض سعر
3. أضف عناصر من `ComponentsPanel` بالسحب أو النقر
4. رتب العناصر وعدّل إعداداتها عبر `PropertiesPanel`
5. اختر ألوان القالب والخط من الإعدادات
6. احفظ القالب

> **ملاحظة مهمة:** القالب المحفوظ يعمل في المعاينة (`TemplatePreview`) لكن **لا يُطبّق** عند عرض الفاتورة الفعلية.

### برمجياً عبر API

```typescript
// إنشاء قالب جديد
const template = await orpcClient.finance.templates.create({
  organizationId: "org_xxx",
  name: "قالب مخصص",
  description: "وصف القالب",
  templateType: "INVOICE", // أو "QUOTATION"
  isDefault: false,
  content: [
    {
      id: "el_1",
      type: "header",
      enabled: true,
      order: 1,
      settings: { showLogo: true, showCompanyName: true, layout: "modern" }
    },
    {
      id: "el_2",
      type: "clientInfo",
      enabled: true,
      order: 2,
      settings: { showTaxNumber: true, showEmail: true }
    },
    // ... المزيد من العناصر
  ],
  settings: {
    backgroundColor: "#ffffff",
    primaryColor: "#10b981", // أخضر
    fontFamily: "Cairo",
    fontSize: "14px",
    lineHeight: "1.6",
    pageSize: "A4",
    orientation: "portrait",
    margins: "20mm",
    vatPercent: 15,
    currency: "SAR",
  },
});
```

### API endpoints للقوالب

| الإجراء | المسار | الوصف |
|--------|--------|------|
| `templates.list` | GET | قائمة القوالب مع عدد الاستخدامات |
| `templates.getById` | GET | جلب قالب بالمعرف |
| `templates.getDefault` | GET | القالب الافتراضي حسب النوع |
| `templates.create` | POST | إنشاء قالب جديد |
| `templates.update` | PUT | تحديث قالب |
| `templates.setDefault` | PUT | تعيين كقالب افتراضي |
| `templates.delete` | DELETE | حذف قالب (غير الافتراضي فقط) |
| `templates.seed` | POST | زرع القوالب الافتراضية |

### البنية المطلوبة

```typescript
{
  name: string;                    // اسم القالب
  description?: string;            // وصف القالب
  templateType: "QUOTATION" | "INVOICE";
  isDefault: boolean;              // هل هو الافتراضي لهذا النوع؟
  content: TemplateElement[];      // مصفوفة العناصر (JSON)
  settings: TemplateSettings;      // الإعدادات (JSON)
}
```

---

## 6. قاعدة البيانات

### FinanceInvoice — نموذج الفاتورة

```prisma
model FinanceInvoice {
  id               String   @id @default(cuid())
  organizationId   String
  invoiceNo        String                         // INV-0001 (فريد)

  // النوع والحالة
  invoiceType      FinanceInvoiceType              // STANDARD | TAX | SIMPLIFIED
  status           FinanceInvoiceStatus            // DRAFT | ISSUED | SENT | VIEWED | PARTIALLY_PAID | PAID | OVERDUE | CANCELLED | CREDIT_NOTE

  // معلومات العميل (منسوخة من العميل عند الإنشاء)
  clientId           String?
  clientName         String
  clientCompany      String?
  clientPhone        String?
  clientEmail        String?
  clientAddress      String?
  clientTaxNumber    String?

  // ربط المشروع وعرض السعر
  projectId    String?
  quotationId  String?

  // التواريخ
  issueDate    DateTime   @db.Date
  dueDate      DateTime   @db.Date
  issuedAt     DateTime?                          // طابع زمني لحظة الإصدار الرسمي

  // المبالغ (Decimal 15,2)
  subtotal         Decimal  @db.Decimal(15, 2)
  discountPercent  Decimal  @db.Decimal(5, 2)     @default(0)
  discountAmount   Decimal  @db.Decimal(15, 2)    @default(0)
  vatPercent       Decimal  @db.Decimal(5, 2)     @default(15)
  vatAmount        Decimal  @db.Decimal(15, 2)    @default(0)
  totalAmount      Decimal  @db.Decimal(15, 2)
  paidAmount       Decimal  @db.Decimal(15, 2)    @default(0)

  // معلومات البائع (مُجمّدة عند الإصدار)
  sellerName          String?
  sellerAddress       String?
  sellerPhone         String?
  sellerTaxNumber     String?

  // ZATCA
  qrCode           String?    @db.Text
  zatcaUuid        String?
  zatcaHash        String?
  zatcaSignature   String?

  // إشعار الدائن — ربط بالفاتورة الأصلية
  relatedInvoiceId String?

  // النص
  paymentTerms     String?    @db.Text
  notes            String?    @db.Text

  // القالب
  templateId       String?

  // تتبع
  viewedAt     DateTime?
  sentAt       DateTime?
  createdById  String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // العلاقات
  organization    Organization        @relation(...)
  client          FinanceClient?      @relation(...)
  project         Project?            @relation(...)
  quotation       FinanceQuotation?   @relation(...)
  createdBy       User                @relation(...)
  template        FinanceTemplate?    @relation(...)
  items           FinanceInvoiceItem[]
  payments        FinanceInvoicePayment[]
  creditNotes     FinanceInvoice[]    @relation("InvoiceCreditNotes")
  relatedInvoice  FinanceInvoice?     @relation("InvoiceCreditNotes")

  // الفهارس
  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, clientId])
  @@index([organizationId, projectId])
  @@index([organizationId, invoiceType])
  @@index([organizationId, dueDate])
  @@index([relatedInvoiceId])
}
```

### FinanceInvoiceItem — بند الفاتورة

```prisma
model FinanceInvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  description String   @db.Text
  quantity    Decimal  @db.Decimal(15, 2)
  unitPrice   Decimal  @db.Decimal(15, 2)
  totalPrice  Decimal  @db.Decimal(15, 2)
  unit        String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  invoice     FinanceInvoice @relation(..., onDelete: Cascade)
  @@index([invoiceId, sortOrder])
}
```

### FinanceInvoicePayment — دفعة الفاتورة

```prisma
model FinanceInvoicePayment {
  id             String   @id @default(cuid())
  invoiceId      String
  amount         Decimal  @db.Decimal(15, 2)
  paymentDate    DateTime @db.Date
  paymentMethod  String?                    // CASH | BANK_TRANSFER | CHECK | CREDIT_CARD | OTHER
  referenceNo    String?
  notes          String?  @db.Text
  createdById    String
  createdAt      DateTime @default(now())

  invoice        FinanceInvoice @relation(..., onDelete: Cascade)
  createdBy      User           @relation(...)
  @@index([invoiceId])
}
```

### FinanceTemplate — القالب

```prisma
model FinanceTemplate {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  description     String?
  templateType    FinanceTemplateType          // QUOTATION | INVOICE
  isDefault       Boolean  @default(false)
  content         Json                          // مصفوفة TemplateElement
  settings        Json                          // كائن TemplateSettings
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization        @relation(..., onDelete: Cascade)
  createdBy       User                @relation(...)
  quotations      FinanceQuotation[]
  invoices        FinanceInvoice[]
  documents       OpenDocument[]

  @@index([organizationId])
  @@index([organizationId, templateType])
  @@index([organizationId, templateType, isDefault])
}
```

### الأنواع (Enums)

```prisma
enum FinanceInvoiceType {
  STANDARD     // فاتورة عادية
  TAX          // فاتورة ضريبية
  SIMPLIFIED   // فاتورة مبسطة
}

enum FinanceInvoiceStatus {
  DRAFT           // مسودة
  ISSUED          // صادرة
  SENT            // مرسلة
  VIEWED          // مُشاهَدة
  PARTIALLY_PAID  // مدفوعة جزئياً
  PAID            // مدفوعة بالكامل
  OVERDUE         // متأخرة
  CANCELLED       // ملغاة
  CREDIT_NOTE     // إشعار دائن
}
```

### حساب المبالغ (calculateInvoiceTotals)

```typescript
// packages/database/prisma/queries/finance.ts
function calculateInvoiceTotals(
  items: { quantity: Decimal; unitPrice: Decimal }[],
  discountPercent: Decimal,
  vatPercent: Decimal
) {
  // 1. المجموع الفرعي = مجموع (الكمية × سعر الوحدة) لكل بند
  const subtotal = items.reduce(
    (sum, item) => sum.add(item.quantity.mul(item.unitPrice)),
    new Decimal(0)
  );

  // 2. مبلغ الخصم = المجموع الفرعي × (نسبة الخصم / 100)
  const discountAmount = subtotal.mul(discountPercent.div(100))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 3. المبلغ بعد الخصم
  const afterDiscount = subtotal.sub(discountAmount);

  // 4. مبلغ الضريبة = المبلغ بعد الخصم × (نسبة الضريبة / 100)
  const vatAmount = afterDiscount.mul(vatPercent.div(100))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 5. الإجمالي = المبلغ بعد الخصم + الضريبة
  const totalAmount = afterDiscount.add(vatAmount)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return { subtotal, discountAmount, vatAmount, totalAmount };
}
```

---

## 7. API و ORPC

### جميع endpoints الفواتير

| الإجراء | المسار المنطقي | الحالات المسموحة | الوصف |
|--------|---------------|-----------------|------|
| `invoices.list` | GET | — | قائمة الفواتير مع فلاتر (حالة، بحث، صفحة) |
| `invoices.getById` | GET | — | فاتورة بالمعرف + بنود + مدفوعات + إشعارات |
| `invoices.create` | POST | — | إنشاء فاتورة جديدة (حالة: DRAFT) |
| `invoices.update` | PUT | DRAFT, SENT | تعديل بيانات العميل والتواريخ |
| `invoices.updateItems` | PUT | DRAFT | تعديل بنود الفاتورة وإعادة الحساب |
| `invoices.updateStatus` | PUT | متغير | تغيير الحالة (DRAFT↔SENT, VIEWED, OVERDUE) |
| `invoices.issue` | POST | DRAFT | إصدار الفاتورة (تجميد + QR + تدقيق) |
| `invoices.convertToTax` | POST | STANDARD, SIMPLIFIED | تحويل إلى فاتورة ضريبية |
| `invoices.addPayment` | POST | غير DRAFT/PAID/CANCELLED | تسجيل دفعة جديدة |
| `invoices.deletePayment` | DELETE | غير DRAFT/PAID/CANCELLED | حذف دفعة |
| `invoices.delete` | DELETE | DRAFT | حذف فاتورة مسودة |
| `invoices.duplicate` | POST | — | نسخ فاتورة (مسودة جديدة) |
| `invoices.createCreditNote` | POST | غير DRAFT/CANCELLED | إنشاء إشعار دائن مرتبط |
| `invoices.updateNotes` | PUT | — | تحديث الملاحظات (بدون قيد حالة) |
| `invoices.getActivity` | GET | — | سجل التدقيق (audit trail) |

### تدفق الحالات

```
                    ┌──────────┐
                    │  DRAFT   │ ← إنشاء / نسخ
                    └────┬─────┘
                         │ إصدار (issue)
                    ┌────▼─────┐
                    │  ISSUED  │
                    └────┬─────┘
                         │ إرسال
                    ┌────▼─────┐
                    │   SENT   │
                    └────┬─────┘
                    ┌────▼─────┐
                    │  VIEWED  │ (اختياري)
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼────┐ ┌──▼───┐ ┌───▼────┐
         │PARTIALLY│ │ PAID │ │OVERDUE │
         │  _PAID  │ │      │ │        │
         └────┬────┘ └──────┘ └────────┘
              │
         ┌────▼────┐
         │  PAID   │
         └─────────┘

  في أي وقت: ──→ CANCELLED (إلغاء)
  من ISSUED+: ──→ CREDIT_NOTE (إشعار دائن)
```

### صلاحيات الوصول

جميع الإجراءات تستخدم:
```typescript
// التحقق من تسجيل الدخول
protectedProcedure

// التحقق من صلاحية الوصول للمنشأة
verifyOrganizationAccess(organizationId)

// تسجيل النشاط
orgAuditLog({
  organizationId,
  action: "INVOICE_CREATED" | "INVOICE_ISSUED" | ...,
  entityType: "INVOICE",
  entityId: invoice.id,
  metadata: { ... }
})
```

---

## 8. تدفقات العمل الرئيسية

### إنشاء فاتورة

```
المستخدم → CreateInvoiceForm
  │
  ├─ يختار عميل (ClientSelector أو إدخال يدوي)
  ├─ يضيف بنود (ItemsEditor)
  ├─ يحدد التواريخ والضريبة والخصم
  ├─ يختار قالب (اختياري — لا يؤثر على العرض حالياً)
  │
  ├─ [حفظ كمسودة] → createInvoiceProcedure → DRAFT
  └─ [حفظ وإصدار] → createInvoiceProcedure + issueInvoiceProcedure → ISSUED

الخادم:
  1. التحقق من المدخلات (Zod validation)
  2. حساب المبالغ (calculateInvoiceTotals)
  3. إنشاء الفاتورة + البنود في قاعدة البيانات
  4. تسجيل في سجل التدقيق
  5. إرجاع الفاتورة مع تحويل Decimal → Number
```

### إصدار فاتورة (Issue)

```
المستخدم → InvoiceView → زر "إصدار" → نافذة تأكيد → issueInvoiceProcedure

الخادم (خطوات الإصدار):
  1. التحقق: اسم البائع مطلوب
  2. التحقق: اسم العميل مطلوب
  3. التحقق: الفاتورة الضريبية تتطلب رقم ضريبي للعميل
  4. التحقق: بند واحد على الأقل بكمية > 0 وسعر > 0
  5. التحقق: تاريخ الإصدار مطلوب
  6. جمع معلومات البائع:
     - أولوية: إعدادات المالية (companyNameAr, taxNumber, address, phone)
     - احتياط: بيانات المنشأة (name)
  7. تجميد معلومات البائع في الفاتورة
  8. إنشاء ZATCA QR لجميع أنواع الفواتير (إذا وجد رقم ضريبي صالح)
     - للفواتير الضريبية/المبسطة: خطأ إذا لم يوجد رقم ضريبي
  9. تخزين UUID و QR code والمبالغ المُجمّدة
  10. تغيير الحالة: DRAFT → ISSUED
  11. تسجيل في سجل التدقيق
```

### تسجيل دفعة

```
المستخدم → InvoiceView → "إضافة دفعة" → نافذة حوار:
  - المبلغ (مطلوب، الحد الأقصى = المتبقي)
  - التاريخ (مطلوب)
  - طريقة الدفع (اختياري): CASH | BANK_TRANSFER | CHECK | CREDIT_CARD | OTHER
  - رقم المرجع (اختياري)
  - ملاحظات (اختياري)

الخادم:
  1. إنشاء سجل FinanceInvoicePayment
  2. تحديث paidAmount في الفاتورة
  3. تعديل الحالة تلقائياً:
     - إذا paidAmount >= totalAmount → PAID
     - إذا paidAmount > 0 ولكن < totalAmount → PARTIALLY_PAID
  4. تسجيل في سجل التدقيق
```

### إنشاء إشعار دائن

```
المستخدم → InvoiceView → "إشعار دائن" → CreditNoteForm:
  - يحدد الكميات المُرتجعة لكل بند
  - النظام يحسب المبالغ تلقائياً (بالسالب)

الخادم:
  1. التحقق: الفاتورة الأصلية ليست مسودة أو ملغاة
  2. التحقق: يوجد بنود للإرجاع
  3. إنشاء فاتورة جديدة بنوع CREDIT_NOTE
  4. ربطها عبر relatedInvoiceId
  5. عكس المبالغ (كمية × سعر سالب)
  6. حساب المجاميع السالبة
  7. إنشاء QR إذا كانت الأصلية ضريبية/مبسطة
  8. تجميد بيانات البائع
  9. الحالة: ISSUED مباشرة
  10. تسجيل في سجل التدقيق
```

---

## 9. المشاكل والأخطاء المكتشفة مع حلول مقترحة

### مشكلة 1: عدم ربط القوالب بعرض الفواتير ★ حرجة

**الوصف:** `InvoicePreview.tsx` و `InvoiceView.tsx` لا تستخدمان `TemplateRenderer` إطلاقاً. تصميم الفاتورة مُثبّت (hardcoded) بغض النظر عن القالب المختار.

**الأثر:** تجربة مستخدم مضللة — واجهة اختيار القالب موجودة لكن بلا تأثير فعلي.

**الحل المقترح:**
```
1. إنشاء مكون InvoiceDocument يستخدم TemplateRenderer
2. استبدال التصميم المُثبّت في InvoicePreview بـ:
   <TemplateRenderer
     elements={template.content}
     settings={template.settings}
     data={invoiceData}
     organization={orgData}
   />
3. استخدام نفس المكون في InvoiceTabContent
4. الاحتفاظ بقالب افتراضي للفواتير بدون قالب
```

---

### مشكلة 2: تكرار كود العرض في ملفين ★ مهمة

**الوصف:** `InvoicePreview.tsx` (~515 سطر) و `InvoiceTabContent` (~270 سطر) يحتويان على نفس التصميم مع اختلافات طفيفة.

**الأثر:** أي تعديل يجب تكراره في مكانين، مما يؤدي لتناقضات.

**الحل المقترح:**
```
1. إنشاء مكون مشترك InvoiceDocument.tsx
2. تمرير خيارات: { showWatermark, showStatusBadge, printMode }
3. استخدامه في كلا الملفين
```

---

### مشكلة 3: عدم دعم PDF حقيقي

**الوصف:** زر "PDF" في InvoiceView يوجه إلى صفحة المعاينة نفسها — لا يوجد تحويل فعلي إلى PDF.

**الأثر:** المستخدم يتوقع تنزيل ملف PDF فعلي.

**الحل المقترح:**
```
خيار أ: html2pdf.js أو puppeteer على الخادم
خيار ب: استخدام window.print() مع تعليمات حفظ كـ PDF
خيار ج: مكتبة react-pdf لإنشاء PDF من القالب
```

---

### مشكلة 4: مشاكل الطباعة والوضع الداكن

**الوصف:** عند طباعة فاتورة من الوضع الداكن، بعض الألوان قد لا تظهر بشكل صحيح. `InvoicePreview.tsx` يستخدم `print:text-black` لكن `InvoiceView.tsx` يستخدم `text-foreground` بدون تجاوز طباعة.

**الحل المقترح:**
```css
/* إضافة قواعد طباعة شاملة */
@media print {
  * { color: black !important; background: white !important; }
  .print\\:text-black { color: black; }
}
```

---

### مشكلة 5: تنسيق العملة غير متسق

**الوصف:**
- `InvoicePreview.tsx` يستخدم مكون `Currency` (الذي يستخدم `Intl.NumberFormat("en-SA")`)
- `InvoiceTabContent` يعرّف `formatCurrency` محلياً باستخدام `Intl.NumberFormat("ar-SA")`
- مكون `Currency` المشترك لا يُستخدم دائماً

**الحل المقترح:** توحيد استخدام مكون `Currency` في جميع الأماكن وحذف `formatCurrency` المحلي.

---

### مشكلة 6: عدم ظهور محدد القالب على الموبايل

**الوصف:** في `CreateInvoiceForm.tsx`، محدد القالب يستخدم `Dialog` مع `TemplatePreview` الذي قد لا يعمل بشكل مثالي على الشاشات الصغيرة.

**الحل المقترح:** إضافة responsive design مناسب لمحدد القالب على الموبايل.

---

### مشكلة 7: لا يوجد رقم ضريبي للعميل عند إنشاء الفاتورة

**الوصف:** عند إنشاء فاتورة ضريبية، لا يتم التحقق مبكراً من وجود رقم ضريبي للعميل — الخطأ يظهر فقط عند محاولة الإصدار.

**الحل المقترح:** إضافة تحذير في `CreateInvoiceForm` عند اختيار نوع "ضريبية" بدون رقم ضريبي للعميل.

---

### مشكلة 8: عدم دعم حجم صفحة Letter

**الوصف:** رغم أن `TemplateSettings` يدعم `pageSize: "A4" | "Letter"`، العرض الفعلي في `InvoicePreview` و `InvoiceView` يستخدم `max-w-[210mm]` و `min-h-[297mm]` (A4 فقط).

**الحل المقترح:** قراءة إعدادات القالب وتطبيق الأبعاد المناسبة:
```typescript
const PAGE_SIZES = {
  A4: { width: "210mm", height: "297mm" },
  Letter: { width: "215.9mm", height: "279.4mm" },
};
```

---

### مشكلة 9: عدم وجود معاينة مباشرة أثناء إنشاء الفاتورة

**الوصف:** عند إنشاء فاتورة في `CreateInvoiceForm`، لا توجد معاينة حية للفاتورة كما ستبدو عند الطباعة.

**الحل المقترح:** إضافة تبويب أو جانب معاينة يستخدم `TemplateRenderer` مع البيانات المُدخلة حالياً.

---

### مشكلة 10: عدم التحقق من تجاوز مبلغ الدفعة

**الوصف:** في واجهة إضافة الدفعة، `max={remainingAmount}` موجود على حقل الإدخال لكن لا يوجد تحقق خادم صارم لمنع تجاوز المبلغ المتبقي.

**الحل المقترح:** إضافة تحقق في `addInvoicePaymentProcedure`:
```typescript
if (amount > remainingAmount) {
  throw new ORPCError("VALIDATION_ERROR", "مبلغ الدفعة يتجاوز المتبقي");
}
```

---

### مشكلة 11: عدم دعم إلغاء الفاتورة من الواجهة

**الوصف:** حالة `CANCELLED` موجودة في قاعدة البيانات و `StatusBadge` لكن لا يوجد زر أو إجراء لإلغاء فاتورة من واجهة المستخدم.

**الحل المقترح:** إضافة زر "إلغاء" في `InvoiceView` للفواتير غير المسودة مع نافذة تأكيد وسبب الإلغاء.

---

### مشكلة 12: formatCurrency المحلي في InvoiceTabContent

**الوصف:** `InvoiceTabContent` يُعرّف `formatCurrency` محلياً (سطر 624-629) لكن لا يستخدمه — يستخدم مكون `Currency` بدلاً منه. كود ميت.

**الحل المقترح:** حذف دالة `formatCurrency` من `InvoiceTabContent`.

---

### مشكلة 13: عدم تحديث حالة OVERDUE تلقائياً

**الوصف:** لا يوجد cron job أو آلية تلقائية لتحديث الفواتير المتأخرة إلى حالة `OVERDUE`. يتم فقط حساب `isOverdue` على الواجهة.

**الحل المقترح:**
```
خيار أ: Cron job يومي يحدّث الفواتير المتأخرة
خيار ب: الاكتفاء بالحساب على الواجهة (الوضع الحالي)
خيار ج: Trigger في قاعدة البيانات
```

---

### مشكلة 14: لا يوجد اختلاف بصري بين أنواع الفواتير عند العرض

**الوصف:** الفاتورة العادية والضريبية والمبسطة تُعرض بنفس التصميم تماماً. الفرق الوحيد هو النص والـ QR code.

**الحل المقترح:** تخصيص قالب أو تصميم لكل نوع:
- **ضريبية:** إبراز رقم ZATCA UUID و QR بشكل أوضح
- **مبسطة:** تصميم مبسط بدون بعض الحقول
- **إشعار دائن:** لون مميز (وردي/أحمر) مع إشارة واضحة للفاتورة الأصلية

---

## ملحق: المكونات المشتركة

### Currency.tsx
- **Props:** `amount`, `className`, `showSymbol` (default: true), `symbolClassName`
- **التنسيق:** `Intl.NumberFormat("en-SA")` — أرقام إنجليزية
- **الرمز:** أيقونة ريال سعودي مخصصة (sr font class)
- يوجد variant: `CurrencyBold`

### StatusBadge.tsx
- **Props:** `status`, `type` ("quotation" | "invoice" | "document")
- **ألوان الفواتير:**
  - DRAFT: رمادي
  - ISSUED: أخضر مزرق (teal)
  - SENT: أزرق
  - VIEWED: بنفسجي
  - PARTIALLY_PAID: كهرماني
  - PAID: أخضر
  - OVERDUE: أحمر
  - CANCELLED: رمادي (مع خط يتوسط)
  - CREDIT_NOTE: وردي

### AmountSummary.tsx
- **Props:** `subtotal`, `discountPercent`, `discountAmount`, `vatPercent`, `vatAmount`, `totalAmount`, `paidAmount?`, `remainingAmount?`
- يعرض: المجموع الفرعي، الخصم، المبلغ الخاضع للضريبة، الضريبة، الإجمالي، المدفوع، المتبقي

### ItemsEditor.tsx
- **Props:** `items[]`, `onChange`, `readOnly?`
- **الوحدات (16):** meter, m², m³, ton, kg, liter, piece, lumpsum, workday, workhour, trip, load, roll, carton, set, service
- يدعم إضافة/حذف/ترتيب البنود

### ClientSelector.tsx
- **Props:** `organizationId`, `selectedClientId?`, `onSelect`, `disabled?`
- Command/Popover للبحث واختيار العميل
- خيار إدخال يدوي

---

## ملحق: الدوال المساعدة (utils.ts)

| الدالة | المدخل | المخرج | الوصف |
|--------|--------|--------|------|
| `formatCurrency(amount)` | number | string | تنسيق مبلغ بأرقام إنجليزية |
| `formatNumber(num)` | number | string | تنسيق رقم بأرقام إنجليزية |
| `formatDate(date)` | Date/string | string | DD/MM/YYYY (en-GB) |
| `formatDateArabic(date)` | Date/string | string | تاريخ بأسماء أشهر عربية |
| `formatDateFull(date)` | Date/string | string | تاريخ مع يوم الأسبوع |
| `formatHijriDate(date)` | Date/string | string | تاريخ هجري |
| `formatTime(date)` | Date/string | string | وقت فقط |
| `formatDateTime(date)` | Date/string | string | تاريخ + وقت |
| `formatPercent(value)` | number | string | نسبة مئوية |
| `daysBetween(d1, d2)` | Date, Date | number | عدد الأيام |
| `isOverdue(dueDate)` | Date/string | boolean | هل تجاوز الاستحقاق؟ |
| `calculateTotals(items, disc%, vat%)` | [...] | object | حساب المجاميع |
