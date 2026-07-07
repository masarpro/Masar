# برومبت تنفيذ 3 قوالب فواتير احترافية لمنصة مسار

## السياق

نحتاج إلى إضافة 3 قوالب فواتير احترافية جديدة لنظام الفواتير في مسار. هذه القوالب ستكون متاحة للمستخدم عند إنشاء فاتورة جديدة ويمكنه الاختيار بينها.

**المشكلة الحالية:** نظام القوالب (`TemplateRenderer`) موجود ويعمل في المعاينة لكنه **غير مرتبط** بعرض الفاتورة الفعلي. `InvoicePreview.tsx` و `InvoiceView.tsx` يستخدمان تصميم مُثبّت (hardcoded). هذا البرومبت يعالج الجزء الأول: إضافة القوالب نفسها وجعلها متاحة للاختيار.

---

## المهام المطلوبة

### المهمة 1: إضافة 3 قوالب فواتير في `default-templates.ts`

**الملف:** `apps/web/modules/saas/finance/lib/default-templates.ts`

أضف 3 قوالب جديدة بجانب القالب الافتراضي الموجود. كل قالب يجب أن يتبع نفس الهيكل `DefaultTemplateConfig`.

#### القالب 1: الكلاسيكي الفاخر (Classic Luxury)

```typescript
export const INVOICE_TEMPLATE_CLASSIC_LUXURY: DefaultTemplateConfig = {
  name: "الكلاسيكي الفاخر",
  nameAr: "الكلاسيكي الفاخر",
  nameEn: "Classic Luxury",
  description: "تصميم أنيق بأسلوب كلاسيكي مع لمسات ذهبية",
  descriptionAr: "تصميم أنيق بأسلوب كلاسيكي مع لمسات ذهبية — مثالي للشركات التي تريد إظهار الفخامة والاحترافية",
  descriptionEn: "Elegant classic design with gold accents — perfect for companies wanting to project luxury and professionalism",
  templateType: "INVOICE",
  settings: {
    backgroundColor: "#ffffff",
    primaryColor: "#1a1a2e",       // كحلي داكن
    secondaryColor: "#c9a84c",     // ذهبي
    fontFamily: "Cairo",
    fontSize: "14px",
    lineHeight: "1.6",
    pageSize: "A4",
    orientation: "portrait",
    margins: "20mm",
    vatPercent: 15,
    currency: "SAR",
  },
  elements: [
    {
      id: "el_classic_header",
      type: "header",
      enabled: true,
      order: 1,
      settings: {
        showLogo: true,
        showCompanyName: true,
        showAddress: true,
        showBilingualName: true,
        showTaxNumber: true,
        showCrNumber: true,
        showPhone: true,
        showEmail: true,
        layout: "classic",           // تخطيط كلاسيكي: الشعار يمين + عنوان "فاتورة" يسار
        accentStyle: "gradient-line", // خط متدرج أعلى الصفحة (كحلي → ذهبي)
        titleSize: "large",
        subtitleText: "TAX INVOICE",
        subtitleStyle: "gold-caps",   // أحرف كبيرة ذهبية
      },
    },
    {
      id: "el_classic_invoicemeta",
      type: "clientInfo",
      enabled: true,
      order: 2,
      settings: {
        showInvoiceNumber: true,
        showInvoiceType: true,
        showIssueDate: true,
        showDueDate: true,
        showStatus: true,
        showTaxNumber: true,
        showEmail: true,
        showPhone: true,
        showCompanyName: true,
        showAddress: true,
        layout: "bordered-right",     // حدود يمين بلون ذهبي
        clientBackground: "#f8f7f4",  // خلفية بيج فاتحة
        borderColor: "#c9a84c",       // حد ذهبي
        labelStyle: "gold-small",     // تسميات صغيرة ذهبية
      },
    },
    {
      id: "el_classic_items",
      type: "itemsTable",
      enabled: true,
      order: 3,
      settings: {
        showRowNumbers: true,
        showQuantity: true,
        showUnit: true,
        showUnitPrice: true,
        showTotal: true,
        alternatingColors: true,
        headerBackground: "#1a1a2e",  // كحلي داكن
        headerTextColor: "#ffffff",
        alternateRowColor: "#fafaf8",
        rowNumberColor: "#c9a84c",    // أرقام ذهبية
        borderRadius: "4px",          // حواف مستديرة للجدول
      },
    },
    {
      id: "el_classic_totals",
      type: "totals",
      enabled: true,
      order: 4,
      settings: {
        showDiscount: true,
        showVat: true,
        showAmountInWords: false,
        highlightTotal: true,
        totalBackground: "#1a1a2e",   // خلفية كحلية للإجمالي
        totalTextColor: "#ffffff",
        totalAmountColor: "#c9a84c",  // المبلغ ذهبي
        showPaidAmount: true,
        showRemainingAmount: true,
        paidColor: "#16a34a",
        remainingColor: "#dc2626",
        layout: "left-aligned",       // محاذاة يسار
        width: "220px",
      },
    },
    {
      id: "el_classic_bank",
      type: "bankDetails",
      enabled: true,
      order: 5,
      settings: {
        showBankName: true,
        showIban: true,
        showAccountName: true,
        layout: "card",               // بطاقة مع خلفية
        background: "#f8f7f4",
        borderRadius: "6px",
      },
    },
    {
      id: "el_classic_terms",
      type: "terms",
      enabled: true,
      order: 6,
      settings: {
        showPaymentTerms: true,
        showDeliveryTerms: false,
        showWarrantyTerms: false,
        showNotes: true,
        layout: "card",
        background: "#f8f7f4",
        borderRadius: "6px",
      },
    },
    {
      id: "el_classic_qr",
      type: "qrCode",
      enabled: true,
      order: 7,
      settings: {
        size: "medium",
        showZatcaCompliance: true,
        showLabel: true,
        labelText: "رمز الفاتورة الضريبية",
        borderRadius: "6px",
        background: "#f0f0f0",
      },
    },
    {
      id: "el_classic_signature",
      type: "signature",
      enabled: true,
      order: 8,
      settings: {
        showDate: false,
        showStampArea: true,
        twoColumns: false,
        lineColor: "#1a1a2e",
        labelAr: "التوقيع والختم",
        labelEn: "",
      },
    },
    {
      id: "el_classic_footer",
      type: "footer",
      enabled: true,
      order: 9,
      settings: {
        showThankYouMessage: false,
        showYear: false,
        showCompanyInfo: true,
        showPageNumber: true,
        accentStyle: "gradient-line",  // خط متدرج أسفل (ذهبي → كحلي)
        textColor: "#aaaaaa",
      },
    },
  ],
};
```

#### القالب 2: العصري البسيط (Modern Minimal)

```typescript
export const INVOICE_TEMPLATE_MODERN_MINIMAL: DefaultTemplateConfig = {
  name: "العصري البسيط",
  nameAr: "العصري البسيط",
  nameEn: "Modern Minimal",
  description: "تصميم عصري بسيط مع شريط جانبي برتقالي",
  descriptionAr: "تصميم عصري نظيف مع شريط جانبي برتقالي — مثالي للشركات العصرية",
  descriptionEn: "Clean modern design with orange sidebar accent — perfect for contemporary businesses",
  templateType: "INVOICE",
  settings: {
    backgroundColor: "#ffffff",
    primaryColor: "#f97316",       // برتقالي
    secondaryColor: "#0f172a",     // أسود مزرق
    fontFamily: "Cairo",
    fontSize: "14px",
    lineHeight: "1.6",
    pageSize: "A4",
    orientation: "portrait",
    margins: "20mm",
    vatPercent: 15,
    currency: "SAR",
  },
  elements: [
    {
      id: "el_modern_header",
      type: "header",
      enabled: true,
      order: 1,
      settings: {
        showLogo: true,
        showCompanyName: true,
        showAddress: true,
        showBilingualName: true,
        showTaxNumber: true,
        showPhone: true,
        showEmail: true,
        layout: "modern",
        accentStyle: "sidebar",        // شريط جانبي متدرج (برتقالي) على يسار الصفحة بالكامل
        sidebarWidth: "6px",
        sidebarGradient: "linear-gradient(180deg, #f97316, #ea580c)",
        titleSize: "xlarge",           // عنوان "فاتورة" كبير جداً
        showTypeBadge: true,           // شارة نوع الفاتورة (pill shape)
        typeBadgeBackground: "#fff7ed",
        typeBadgeColor: "#ea580c",
      },
    },
    {
      id: "el_modern_invoicemeta",
      type: "clientInfo",
      enabled: true,
      order: 2,
      settings: {
        showInvoiceNumber: true,
        showIssueDate: true,
        showDueDate: true,
        showTaxNumber: true,
        showEmail: false,
        showPhone: true,
        showCompanyName: true,
        showAddress: true,
        layout: "two-cards",           // بطاقتين: بيانات الفاتورة + بيانات العميل
        invoiceCardBackground: "#fafafa",
        clientCardBackground: "#fff7ed",
        clientCardBorder: "3px solid #f97316",
        borderSide: "right",           // الحد على اليمين (RTL)
        labelStyle: "orange-uppercase", // تسميات برتقالية بأحرف كبيرة
        borderRadius: "8px",
      },
    },
    {
      id: "el_modern_items",
      type: "itemsTable",
      enabled: true,
      order: 3,
      settings: {
        showRowNumbers: true,
        showQuantity: true,
        showUnit: true,
        showUnitPrice: true,
        showTotal: true,
        alternatingColors: true,
        headerStyle: "underline",      // لا يوجد خلفية — خط تحت فقط بلون برتقالي
        headerBorderColor: "#f97316",
        headerBorderWidth: "2px",
        headerTextColor: "#94a3b8",
        alternateRowColor: "#fafafa",
        rowNumberStyle: "circle",       // أرقام داخل دائرة برتقالية
        rowNumberBackground: "#fff7ed",
        rowNumberColor: "#f97316",
        borderSpacing: "3px",           // فراغ بين الصفوف
      },
    },
    {
      id: "el_modern_totals",
      type: "totals",
      enabled: true,
      order: 4,
      settings: {
        showDiscount: true,
        showVat: true,
        showAmountInWords: false,
        highlightTotal: true,
        layout: "card",
        background: "#fafafa",
        borderRadius: "8px",
        totalBorderTop: "2px solid #f97316",
        totalFontSize: "13px",
        totalColor: "#f97316",
        showPaidAmount: true,
        showRemainingAmount: true,
        paidColor: "#16a34a",
        remainingColor: "#dc2626",
        width: "230px",
      },
    },
    {
      id: "el_modern_bank",
      type: "bankDetails",
      enabled: true,
      order: 5,
      settings: {
        showBankName: true,
        showIban: true,
        showAccountName: false,
        layout: "bordered",
        borderColor: "#f0f0f0",
        borderRadius: "6px",
      },
    },
    {
      id: "el_modern_terms",
      type: "terms",
      enabled: true,
      order: 6,
      settings: {
        showPaymentTerms: true,
        showDeliveryTerms: false,
        showWarrantyTerms: false,
        showNotes: false,
        layout: "bordered",
        borderColor: "#f0f0f0",
        borderRadius: "6px",
      },
    },
    {
      id: "el_modern_qr",
      type: "qrCode",
      enabled: true,
      order: 7,
      settings: {
        size: "small",
        showZatcaCompliance: false,
        borderRadius: "8px",
        borderStyle: "dashed",
        borderColor: "#e0e0e0",
        background: "#fafafa",
      },
    },
    {
      id: "el_modern_footer",
      type: "footer",
      enabled: true,
      order: 8,
      settings: {
        showThankYouMessage: true,
        thankYouText: "شكراً لتعاملكم معنا",
        showYear: false,
        showCompanyInfo: true,
        showPhone: true,
        showEmail: true,
        accentStyle: "bottom-bar",     // شريط برتقالي سفلي
        barColor: "#f97316",
        barHeight: "3px",
        textColor: "#cbd5e1",
        textAlign: "center",
      },
    },
  ],
};
```

#### القالب 3: الاحترافي الجريء (Bold Professional)

```typescript
export const INVOICE_TEMPLATE_BOLD_PROFESSIONAL: DefaultTemplateConfig = {
  name: "الاحترافي الجريء",
  nameAr: "الاحترافي الجريء",
  nameEn: "Bold Professional",
  description: "تصميم جريء مع هيدر داكن ولمسات خضراء",
  descriptionAr: "تصميم جريء واحترافي مع هيدر داكن ولمسات خضراء — مثالي لشركات المقاولات",
  descriptionEn: "Bold professional design with dark header and green accents — perfect for construction companies",
  templateType: "INVOICE",
  settings: {
    backgroundColor: "#ffffff",
    primaryColor: "#10b981",       // أخضر زمردي
    secondaryColor: "#0f172a",     // أسود مزرق غامق
    fontFamily: "Cairo",
    fontSize: "14px",
    lineHeight: "1.6",
    pageSize: "A4",
    orientation: "portrait",
    margins: "20mm",
    vatPercent: 15,
    currency: "SAR",
  },
  elements: [
    {
      id: "el_bold_header",
      type: "header",
      enabled: true,
      order: 1,
      settings: {
        showLogo: true,
        showCompanyName: true,
        showAddress: true,
        showBilingualName: true,
        showTaxNumber: true,
        showPhone: true,
        layout: "dark-block",          // كتلة داكنة كاملة العرض
        blockBackground: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        blockTextColor: "#ffffff",
        titleSize: "xlarge",
        subtitleText: "TAX INVOICE",
        subtitleColor: "#10b981",
        showInvoiceNumberBadge: true,  // شارة رقم الفاتورة (pill)
        badgeBackground: "rgba(16,185,129,0.15)",
        badgeColor: "#10b981",
      },
    },
    {
      id: "el_bold_metabar",
      type: "text",                    // شريط معلومات أخضر تحت الهيدر
      enabled: true,
      order: 2,
      settings: {
        layout: "info-bar",
        background: "#10b981",
        textColor: "#ffffff",
        fontSize: "9px",
        fields: ["invoiceType", "issueDate", "dueDate"],
        dividerStyle: "vertical-line",
        dividerColor: "rgba(255,255,255,0.3)",
        padding: "8px 28px",
      },
    },
    {
      id: "el_bold_client",
      type: "clientInfo",
      enabled: true,
      order: 3,
      settings: {
        showTaxNumber: true,
        showEmail: true,
        showPhone: true,
        showCompanyName: true,
        showAddress: true,
        layout: "highlight-card",
        background: "#f0fdf4",         // أخضر فاتح جداً
        borderColor: "#bbf7d0",
        borderRadius: "8px",
        labelStyle: "green-dot",       // نقطة خضراء قبل التسمية
        labelColor: "#10b981",
      },
    },
    {
      id: "el_bold_items",
      type: "itemsTable",
      enabled: true,
      order: 4,
      settings: {
        showRowNumbers: true,
        showQuantity: true,
        showUnit: true,
        showUnitPrice: true,
        showTotal: true,
        alternatingColors: false,
        headerBackground: "#0f172a",   // كحلي داكن
        headerTextColor: "#ffffff",
        rowNumberColor: "#10b981",     // أرقام خضراء
        rowBorderColor: "#f1f5f9",
        headerRowNumberColor: "#10b981",
        borderRadius: "6px",
      },
    },
    {
      id: "el_bold_totals",
      type: "totals",
      enabled: true,
      order: 5,
      settings: {
        showDiscount: true,
        showVat: true,
        showAmountInWords: false,
        highlightTotal: true,
        layout: "card",
        background: "#f8fafc",
        borderColor: "#e2e8f0",
        borderRadius: "10px",
        totalDivider: "gradient",
        totalDividerGradient: "linear-gradient(90deg, #10b981, #059669)",
        totalFontSize: "13px",
        totalColor: "#10b981",
        showPaidAmount: true,
        showRemainingAmount: true,
        paidColor: "#16a34a",
        remainingColor: "#ef4444",
        width: "220px",
      },
    },
    {
      id: "el_bold_bank",
      type: "bankDetails",
      enabled: true,
      order: 6,
      settings: {
        showBankName: true,
        showIban: true,
        showAccountName: false,
        layout: "inline",
        fontSize: "8px",
      },
    },
    {
      id: "el_bold_qr",
      type: "qrCode",
      enabled: true,
      order: 7,
      settings: {
        size: "medium",
        showZatcaCompliance: true,
        borderRadius: "10px",
        borderColor: "#e2e8f0",
        background: "#f8fafc",
        position: "left",             // QR على اليسار (بجانب المجاميع)
      },
    },
    {
      id: "el_bold_terms",
      type: "terms",
      enabled: true,
      order: 8,
      settings: {
        showPaymentTerms: true,
        showNotes: true,
        layout: "card",
        background: "#f8fafc",
        borderRadius: "6px",
      },
    },
    {
      id: "el_bold_signature",
      type: "signature",
      enabled: true,
      order: 9,
      settings: {
        showDate: false,
        showStampArea: true,
        twoColumns: false,
        lineColor: "#0f172a",
        lineWidth: "2px",
        labelAr: "التوقيع والختم",
        labelEn: "Authorized Signature",
        showBilingualLabel: true,
      },
    },
    {
      id: "el_bold_footer",
      type: "footer",
      enabled: true,
      order: 10,
      settings: {
        showThankYouMessage: false,
        showYear: false,
        showCompanyInfo: true,
        showPageNumber: true,
        layout: "dark-bar",            // شريط داكن سفلي
        background: "#0f172a",
        textColor: "#64748b",
        pageNumberColor: "#10b981",
      },
    },
  ],
};
```

---

### المهمة 2: تحديث `seed-templates.ts` لزرع القوالب الجديدة

**الملف:** `packages/database/prisma/queries/seed-templates.ts`

أضف القوالب الثلاثة الجديدة إلى دالة الزرع. ابحث عن الدالة الموجودة التي تزرع القوالب الافتراضية وأضف الثلاثة:

```typescript
import {
  INVOICE_TEMPLATE_CLASSIC_LUXURY,
  INVOICE_TEMPLATE_MODERN_MINIMAL,
  INVOICE_TEMPLATE_BOLD_PROFESSIONAL,
} from "@/modules/saas/finance/lib/default-templates";

// داخل دالة الزرع، بعد القالب الافتراضي:
const newTemplates = [
  INVOICE_TEMPLATE_CLASSIC_LUXURY,
  INVOICE_TEMPLATE_MODERN_MINIMAL,
  INVOICE_TEMPLATE_BOLD_PROFESSIONAL,
];

for (const template of newTemplates) {
  await prisma.financeTemplate.upsert({
    where: {
      // استخدم compound unique أو ابحث بالاسم والمنشأة
      organizationId_name: {
        organizationId: orgId,
        name: template.name,
      },
    },
    create: {
      organizationId: orgId,
      name: template.name,
      description: template.descriptionAr,
      templateType: template.templateType,
      isDefault: false,  // القالب الأول يبقى هو الافتراضي
      content: template.elements as any,
      settings: template.settings as any,
      createdById: userId,
    },
    update: {
      content: template.elements as any,
      settings: template.settings as any,
      description: template.descriptionAr,
    },
  });
}
```

> **ملاحظة:** إذا لم يكن هناك compound unique على `organizationId + name`، استخدم `findFirst` + `create/update` بدلاً من `upsert`.

---

### المهمة 3: تحديث `TemplateRenderer.tsx` لدعم أنماط القوالب الجديدة

**الملف:** `apps/web/modules/saas/finance/components/templates/renderer/TemplateRenderer.tsx`

القوالب الجديدة تستخدم إعدادات موسعة لم تكن موجودة سابقاً. يجب تعديل مكونات العرض لدعمها:

#### 3.1 تحديث `TemplateSettings` interface

أضف الحقول الجديدة:

```typescript
interface TemplateSettings {
  // الحقول الموجودة...
  backgroundColor: string;
  primaryColor: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  margins: string;
  vatPercent: number;
  currency: string;

  // حقول جديدة (اختيارية)
  secondaryColor?: string;   // لون ثانوي للتأكيدات
}
```

#### 3.2 تحديث `HeaderElement`

أضف دعم للتخطيطات الجديدة:

- **`classic`**: شعار يمين + عنوان "فاتورة" يسار مع خط متدرج أعلى
- **`modern`** (الموجود): تحسينه بدعم شريط جانبي وشارة النوع
- **`dark-block`**: كتلة داكنة كاملة العرض مع نص أبيض وشارة رقم الفاتورة

```typescript
// في HeaderElement، أضف حالات جديدة:
switch (settings.layout) {
  case "classic":
    return <ClassicHeader settings={settings} data={data} organization={organization} templateSettings={templateSettings} />;
  case "dark-block":
    return <DarkBlockHeader settings={settings} data={data} organization={organization} templateSettings={templateSettings} />;
  default:
    return <ModernHeader settings={settings} data={data} organization={organization} templateSettings={templateSettings} />;
}
```

#### 3.3 تحديث `ClientInfoElement`

أضف دعم للتخطيطات:

- **`bordered-right`**: حدود يمين ملونة مع خلفية
- **`two-cards`**: بطاقتين جنب بعض (بيانات الفاتورة + العميل)
- **`highlight-card`**: بطاقة مميزة بخلفية ملونة وحدود

#### 3.4 تحديث `ItemsTableElement`

أضف دعم:

- **أرقام دائرية**: `rowNumberStyle: "circle"` — الرقم داخل دائرة ملونة
- **هيدر بخط سفلي فقط**: `headerStyle: "underline"` — بدلاً من خلفية كاملة
- **فراغ بين الصفوف**: `borderSpacing`
- **ألوان مخصصة للهيدر والصفوف**

#### 3.5 تحديث `TotalsElement`

أضف دعم:

- **تخطيط بطاقة**: `layout: "card"` — داخل بطاقة بخلفية وحدود
- **خط فاصل متدرج**: `totalDivider: "gradient"` — بدلاً من خط عادي
- **عرض المدفوع والمتبقي**: `showPaidAmount` + `showRemainingAmount` مع ألوان مخصصة

#### 3.6 تحديث `FooterElement`

أضف دعم:

- **شريط داكن**: `layout: "dark-bar"` — خلفية داكنة مع نص رمادي
- **شريط سفلي ملون**: `accentStyle: "bottom-bar"` — خط ملون أسفل
- **خط متدرج**: `accentStyle: "gradient-line"` — خط متدرج بين لونين

---

### المهمة 4: تحديث واجهة اختيار القالب

**الملف:** `apps/web/modules/saas/finance/components/invoices/CreateInvoiceForm.tsx`

عند اختيار القالب، يجب عرض معاينة مصغرة لكل قالب. حدّث `Dialog` محدد القالب ليعرض:

1. **صور مصغرة** (thumbnails) لكل قالب
2. **اسم القالب** بالعربي والإنجليزي
3. **وصف مختصر**
4. **شارة اللون الرئيسي** لكل قالب
5. **تحديد بصري واضح** للقالب المختار

```tsx
// مثال على تحسين عرض القوالب:
<div className="grid grid-cols-2 gap-4">
  {templates.map((template) => (
    <button
      key={template.id}
      onClick={() => setSelectedTemplate(template.id)}
      className={cn(
        "relative rounded-lg border-2 p-3 text-right transition-all",
        selectedTemplate === template.id
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* معاينة مصغرة */}
      <div className="mb-2 aspect-[210/297] w-full overflow-hidden rounded-md bg-muted">
        <TemplatePreviewMini
          elements={template.content}
          settings={template.settings}
        />
      </div>
      {/* اسم القالب */}
      <div className="font-bold text-sm">{template.name}</div>
      <div className="text-xs text-muted-foreground">{template.description}</div>
      {/* شارة اللون */}
      <div
        className="absolute top-2 left-2 h-3 w-3 rounded-full"
        style={{ backgroundColor: template.settings?.primaryColor }}
      />
    </button>
  ))}
</div>
```

---

### المهمة 5: تحديث API لزرع القوالب عند إنشاء منشأة

**الملف:** `packages/api/modules/finance/procedures/` (ابحث عن seed procedure)

عند إنشاء منشأة جديدة أو استدعاء `templates.seed`، يجب زرع القوالب الثلاثة الجديدة:

```typescript
// في seedTemplatesProcedure:
// بعد زرع القالب الافتراضي، أضف:

const additionalTemplates = [
  INVOICE_TEMPLATE_CLASSIC_LUXURY,
  INVOICE_TEMPLATE_MODERN_MINIMAL,
  INVOICE_TEMPLATE_BOLD_PROFESSIONAL,
];

for (const tmpl of additionalTemplates) {
  const existing = await prisma.financeTemplate.findFirst({
    where: {
      organizationId: input.organizationId,
      name: tmpl.name,
      templateType: tmpl.templateType,
    },
  });

  if (!existing) {
    await prisma.financeTemplate.create({
      data: {
        organizationId: input.organizationId,
        name: tmpl.name,
        description: tmpl.descriptionAr,
        templateType: tmpl.templateType as any,
        isDefault: false,
        content: tmpl.elements as any,
        settings: tmpl.settings as any,
        createdById: ctx.user.id,
      },
    });
  }
}
```

---

## تصاميم القوالب الثلاثة — المخطط البصري (A4)

### القالب 1: الكلاسيكي الفاخر

```
╔══════════════════════════════════════════════╗  ← خط متدرج (كحلي → ذهبي) 4px
║                                              ║
║  [فاتورة]           [شعار م]  اسم الشركة     ║  ← هيدر كلاسيكي
║  TAX INVOICE        عنوان | هاتف | ض         ║     عنوان ذهبي صغير
║                                              ║
║  رقم: INV-2026-0042  تاريخ: xx  استحقاق: xx  ║
║                                              ║
║  ┌─╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌─┐  ║
║  ┊  معلومات العميل              bg:#f8f7f4 ┊  ║  ← حد ذهبي يمين
║  ┊  اسم العميل | العنوان | الرقم الضريبي  ┊  ║
║  └─╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌─┘  ║
║                                              ║
║  ┌────────────────────────────────────────┐  ║
║  │# │ الوصف │ الوحدة │ الكمية │ السعر │ المجموع│  ← هيدر كحلي
║  ├────────────────────────────────────────┤  ║
║  │1 │ أعمال حفر...   │ م³  │ 250  │ 45  │ 11,250│  ← # ذهبي
║  │2 │ صب خرسانة...   │ م³  │ 120  │ 850 │102,000│  ← صفوف متبادلة
║  │3 │ حديد T16...    │ طن  │ 15   │3,200│ 48,000│
║  │4 │ بلوك وبناء...  │ م²  │ 800  │ 65  │ 52,000│
║  │5 │ لياسة...       │ م²  │1,200 │ 35  │ 42,000│
║  └────────────────────────────────────────┘  ║
║                                              ║
║                    ┌──────────────────────┐  ║
║                    │ المجموع الفرعي  255,250│  ║
║                    │ الخصم 2%      - 5,105│  ║
║                    │ ضريبة 15%      37,522│  ║
║                    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ║  ← خلفية كحلية
║                    │▓ الإجمالي  287,667 ▓│  ║  ← مبلغ ذهبي
║                    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ║
║                    │ المدفوع     100,000 🟢│  ║
║                    │ المتبقي     187,667 🔴│  ║
║                    └──────────────────────┘  ║
║                                              ║
║  ┌─────────────┐  ┌──────────────────────┐  ║
║  │بيانات بنكية │  │ شروط الدفع           │  ║  ← بطاقتين bg:#f8f7f4
║  │البنك الأهلي │  │ 30 يوماً + غرامة 1.5%│  ║
║  │IBAN: SA03...│  │                      │  ║
║  └─────────────┘  └──────────────────────┘  ║
║                                              ║
║  ┌──────┐             ─────────────────      ║
║  │QR    │                التوقيع والختم      ║  ← QR يسار + توقيع يمين
║  │Code  │                                    ║
║  └──────┘                                    ║
║                                              ║
║  ──────────────────────────────────────────  ║
║  اسم الشركة — العنوان          صفحة 1 من 1  ║  ← تذييل
╚══════════════════════════════════════════════╝  ← خط متدرج (ذهبي → كحلي)
```

### القالب 2: العصري البسيط

```
┃╔════════════════════════════════════════════╗
┃║                                            ║
┃║  [شارة: فاتورة ضريبية]      شعار + اسم    ║  ← هيدر مع شارة pill
┃║                              عنوان | هاتف  ║
┃║  فاتورة                     ض: 300...      ║  ← عنوان كبير جداً
┃║                                            ║
┃║  ┌────────────┐  ┌─────────────────────┐  ║
┃║  │بيانات      │  │ فاتورة إلى      ▐  │  ║  ← حد برتقالي يمين
┃║  │الفاتورة    │  │                  ▐  │  ║
┃║  │رقم: INV-42 │  │ مؤسسة الأفق     ▐  │  ║
┃║  │تاريخ: xx   │  │ جدة، حي الروضة  ▐  │  ║  ← bg:#fff7ed
┃║  │استحقاق: xx │  │ ض: 300987...     ▐  │  ║
┃║  │ bg:#fafafa  │  │                  ▐  │  ║
┃║  └────────────┘  └─────────────────────┘  ║
┃║                                            ║
┃║  # ─── البند ─── الوحدة ─ الكمية ─ السعر ─ المجموع  ║  ← خط برتقالي تحت
┃║                                            ║
┃║  ⓵ أعمال حفر...  م³    250    45   11,250 ║  ← أرقام دائرية
┃║  ⓶ صب خرسانة... م³    120   850  102,000 ║     برتقالية
┃║  ⓷ حديد T16...  طن     15  3,200  48,000 ║
┃║  ⓸ بلوك وبناء...م²    800    65   52,000 ║  ← bg متبادل
┃║  ⓹ لياسة...     م²   1200    35   42,000 ║
┃║                                            ║
┃║                    ┌─────────────────────┐ ║
┃║                    │ المجموع    255,250  │ ║  ← bg:#fafafa
┃║                    │ الخصم     - 5,105   │ ║     rounded
┃║                    │ ضريبة      37,522   │ ║
┃║                    │═══════════════════  │ ║  ← خط برتقالي
┃║                    │ الإجمالي  287,667   │ ║  ← لون برتقالي كبير
┃║                    │ المدفوع   100,000 🟢│ ║
┃║                    │ المتبقي   187,667 🔴│ ║
┃║                    └─────────────────────┘ ║
┃║                                            ║
┃║  ┌──────────┐ ┌──────────┐ ┌────┐         ║
┃║  │ بنكية    │ │ شروط     │ │ QR │         ║  ← 3 أعمدة
┃║  │ الأهلي   │ │ 30 يوماً │ │    │         ║
┃║  │ SA03...  │ │          │ │    │         ║
┃║  └──────────┘ └──────────┘ └────┘         ║
┃║                                            ║
┃║     شكراً لتعاملكم معنا — معلومات الشركة   ║  ← تذييل
┃╚════════════════════════════════════════════╝
┃                                         ← شريط برتقالي 3px
شريط برتقالي 6px على اليسار طوال الصفحة
```

### القالب 3: الاحترافي الجريء

```
╔══════════════════════════════════════════════╗
║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
║▓                                            ▓║  ← هيدر داكن (gradient)
║▓  فاتورة                   شعار + اسم الشركة▓║  ← نص أبيض
║▓  TAX INVOICE               عنوان | هاتف | ض▓║  ← TAX بلون أخضر
║▓                                            ▓║
║▓  ┌──────────────────────┐                  ▓║
║▓  │ INV-2026-0042        │ ← pill أخضر شفاف▓║
║▓  └──────────────────────┘                  ▓║
║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
║████████████████████████████████████████████████║  ← شريط أخضر
║█ فاتورة ضريبية │ 2026/02/15 │ 2026/03/15  █║  ← معلومات على الشريط
║████████████████████████████████████████████████║
║                                              ║
║  ┌──────────────────────────────────────┐   ║
║  │ ● فاتورة إلى              bg:#f0fdf4 │   ║  ← بطاقة خضراء فاتحة
║  │ مؤسسة الأفق للتطوير العقاري          │   ║
║  │ جدة | ض: 300987... | +966 50...      │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  ┌────────────────────────────────────────┐  ║
║  │#│ البند        │وحدة│كمية│ السعر │المجموع│  ║  ← هيدر كحلي
║  │ │              │    │    │       │      │  ║     # أخضر
║  ├────────────────────────────────────────┤  ║
║  │1│ أعمال حفر... │ م³ │250 │  45   │11,250│  ║
║  │2│ صب خرسانة...│ م³ │120 │ 850   │102K  │  ║
║  │3│ حديد T16... │ طن │ 15 │3,200  │48,000│  ║
║  │4│ بلوك...     │ م² │800 │  65   │52,000│  ║
║  │5│ لياسة...    │ م² │1.2K│  35   │42,000│  ║
║  └────────────────────────────────────────┘  ║
║                                              ║
║  ┌──────┐  بنكية    ┌─────────────────────┐ ║
║  │ZATCA │  الأهلي   │ المجموع     255,250 │ ║
║  │  QR  │  SA03...  │ الخصم      - 5,105  │ ║  ← QR + بنك يسار
║  │      │           │ ضريبة       37,522  │ ║     مجاميع يمين
║  └──────┘           │━━━━━━━━━━━━━━━━━━━━│ ║  ← خط متدرج أخضر
║                     │ الإجمالي   287,667  │ ║  ← أخضر كبير
║                     │ المدفوع    100,000🟢│ ║
║                     │ المتبقي    187,667🔴│ ║
║                     └─────────────────────┘ ║
║                                              ║
║  ┌──────────────────────┐   ────────────── ║
║  │ شروط الدفع + ملاحظات│   التوقيع والختم  ║
║  │ bg:#f8fafc           │   Auth. Signature ║
║  └──────────────────────┘                   ║
║                                              ║
║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← تذييل داكن
║▓ الشركة | هاتف | إيميل       صفحة 1 من 1  ▓║
║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
```

---

## قواعد التنفيذ المهمة

1. **حافظ على الأنماط الموجودة**: اقرأ الكود الحالي في `default-templates.ts` و `TemplateRenderer.tsx` جيداً قبل التعديل. اتبع نفس الأنماط.

2. **A4 فقط**: جميع القوالب بحجم A4 (210mm × 297mm). لا تغير هذا.

3. **RTL**: جميع القوالب تدعم RTL. النص العربي يمين، الأرقام والتواريخ يسار.

4. **الألوان الطباعية**: تأكد أن الألوان تعمل في الوضع العادي والطباعة. أضف `print:` classes حيث يلزم.

5. **خط Cairo**: جميع القوالب تستخدم خط Cairo كافتراضي.

6. **ZATCA QR**: جميع القوالب تدعم عرض QR Code لـ ZATCA.

7. **المبالغ**: استخدم `Intl.NumberFormat("en-SA")` لتنسيق الأرقام عبر مكون `Currency`.

8. **لا تكسر الموجود**: القالب الافتراضي يجب أن يبقى يعمل كما هو. أضف القوالب الجديدة بجانبه.

9. **Settings fallbacks**: إذا كانت إعدادات القالب الجديدة غير موجودة، استخدم القيم الافتراضية بدلاً من الخطأ.

10. **الحفاظ على الأداء**: لا تضف مكتبات خارجية جديدة. استخدم Tailwind CSS و inline styles فقط.

---

## ترتيب التنفيذ المقترح

1. ✅ اقرأ وافهم `default-templates.ts` الحالي
2. ✅ اقرأ وافهم `TemplateRenderer.tsx` وجميع مكونات العرض
3. ✅ أضف التعريفات الثلاثة في `default-templates.ts`
4. ✅ حدّث `TemplateSettings` interface لدعم `secondaryColor`
5. ✅ حدّث كل مكون عرض (`HeaderElement`, `ClientInfoElement`, `ItemsTableElement`, `TotalsElement`, `FooterElement`) لدعم الأنماط الجديدة
6. ✅ حدّث `seed-templates.ts` لزرع القوالب الجديدة
7. ✅ حدّث واجهة اختيار القالب في `CreateInvoiceForm.tsx`
8. ✅ اختبر كل قالب عبر معاينة `TemplatePreview`
9. ✅ تأكد من الطباعة الصحيحة لكل قالب

---

## ملاحظات إضافية

- **هذا البرومبت لا يعالج ربط القوالب بعرض الفاتورة الفعلي** (المشكلة 1 في المرجع). ذلك سيكون في مرحلة لاحقة حيث نستبدل التصميم المُثبّت في `InvoicePreview.tsx` و `InvoiceView.tsx` بـ `TemplateRenderer`.

- إذا واجهت إعدادات جديدة في القوالب غير مدعومة بعد في مكونات العرض، أضف دعمها مع fallback للقيم الافتراضية.

- القوالب يجب أن تعمل مع جميع أنواع الفواتير: عادية، ضريبية، ومبسطة.
