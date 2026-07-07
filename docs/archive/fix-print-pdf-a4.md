# إصلاح المعاينة والطباعة وتحميل PDF — صفحة عرض السعر

## استخدم Plan Mode أولاً — اقرأ كل الملفات قبل أي تعديل

---

## المرحلة 0: القراءة الإجبارية

```bash
# 1. صفحة المعاينة الحالية
find apps/web -path "*quotation*preview*" -name "page.tsx" -exec echo "=== {} ===" \; -exec cat {} \;

# 2. QuotationPreview component
find apps/web -name "QuotationPreview*" -exec echo "=== {} ===" \; -exec cat {} \;

# 3. TemplateRenderer — كيف يرسم المستند
cat apps/web/modules/saas/company/components/templates/renderer/TemplateRenderer.tsx

# 4. نظام طباعة الفواتير (المرجع)
find apps/web -path "*invoice*preview*" -name "page.tsx" -exec echo "=== {} ===" \; -exec cat {} \;
find apps/web -name "InvoiceDocument*" -exec echo "=== {} ===" \; -exec cat {} \;
grep -rn "window.print\|@media print\|print:" apps/web/modules/saas/finance/ --include="*.tsx" -l | head -10

# 5. CSS الطباعة الحالية
grep -rn "@media print\|@page\|print-color-adjust\|page-break" apps/web/ --include="*.css" -l
grep -rn "@media print\|@page" apps/web/ --include="*.css" -exec echo "=== {} ===" \; -exec cat {} \;

# 6. مكتبات PDF الموجودة
grep -rn "html2pdf\|jspdf\|html2canvas\|puppeteer\|react-pdf\|pdf-lib" apps/web/package.json packages/*/package.json

# 7. كيف تعمل طباعة الفواتير
grep -rn "handlePrint\|window.print\|onPrint" apps/web/modules/saas/finance/ --include="*.tsx" | head -15

# 8. globals.css أو print styles
cat apps/web/app/globals.css 2>/dev/null | grep -A 20 "print"
find apps/web -name "*.css" -exec grep -l "print" {} \;
```

**اقرأ كل شيء بالكامل قبل أي تعديل.**

---

## المشكلة 1: حجم A4 وتقسيم الصفحات

### الوصف
المعاينة الحالية تعرض المستند كـ div طويل بدون حدود A4. يجب أن يكون:
- عرض A4 ثابت (210mm = 794px عند 96dpi)
- عند الطباعة: المحتوى ينقسم تلقائياً على صفحات A4
- على الشاشة: يمكن أن يكون scroll عادي لكن مع visual indicators لحدود الصفحات

### الإصلاح

**في CSS (globals.css أو ملف CSS مخصص):**

```css
/* === A4 Print Styles === */
@media print {
  /* إخفاء كل شيء ما عدا المستند */
  body > *:not(#quotation-print-area),
  nav, header, aside, footer,
  .no-print,
  [data-no-print] {
    display: none !important;
  }

  body {
    margin: 0;
    padding: 0;
    background: white;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }

  /* السماح بكسر الصفحة داخل المستند */
  #quotation-print-area {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }

  /* منع كسر الصفحة داخل العناصر المهمة */
  .print-no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* كسر الصفحة قبل عنصر */
  .print-break-before {
    page-break-before: always;
    break-before: page;
  }

  /* كسر الصفحة بعد عنصر */
  .print-break-after {
    page-break-after: always;
    break-after: page;
  }

  /* الرأس يبقى في الصفحة الأولى فقط */
  .print-header {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* جدول البنود: header يتكرر + الصفوف لا تنكسر */
  table thead {
    display: table-header-group;
  }
  table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* التذييل يبقى في آخر صفحة */
  .print-footer {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
```

**في TemplateRenderer أو QuotationPreview:**

أضف `id="quotation-print-area"` على الـ container الرئيسي للمستند.
أضف class `print-no-break` على:
- رأس الصفحة (header)
- بيانات العميل
- كل content block (قسم)
- سطر المجاميع
- التذييل

أضف class `print-header` على رأس الصفحة.
أضف class `print-footer` على التذييل.

**في صفحة المعاينة (preview page.tsx):**

أضف `no-print` أو `data-no-print` على:
- شريط الأدوات (رجوع، طباعة، تحميل PDF)
- أي شيء خارج المستند نفسه
- الـ sidebar
- الـ breadcrumb

---

## المشكلة 2: زر تحميل PDF

### الوصف
زر "تحميل PDF" لا يعمل. يجب تنفيذه باستخدام `html2pdf.js` (client-side).

### 2.1 تثبيت المكتبة

```bash
cd apps/web
pnpm add html2pdf.js
```

**إذا لم تتوفر types:**
```bash
# أنشئ ملف types إذا لزم
```

أو استخدم `@types/html2pdf.js` إذا متوفر. إذا لم تتوفر أنشئ declaration:

```typescript
// apps/web/types/html2pdf.d.ts
declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; logging?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
    pagebreak?: { mode?: string | string[]; before?: string[]; after?: string[]; avoid?: string[] };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    save(): Promise<void>;
    toPdf(): Html2PdfInstance;
    get(type: string): Promise<any>;
  }

  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}
```

### 2.2 مكون تحميل PDF مع تسمية مخصصة

**أنشئ أو عدّل في صفحة المعاينة:**

```typescript
const [showFilenameDialog, setShowFilenameDialog] = useState(false);
const [pdfFilename, setPdfFilename] = useState("");
const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

// الاسم الافتراضي
const defaultFilename = `${quotation.quotationNo}-${quotation.clientName || "عرض-سعر"}`;

const handleDownloadPdf = async (filename: string) => {
  const element = document.getElementById("quotation-print-area");
  if (!element) return;

  setIsGeneratingPdf(true);
  try {
    const html2pdf = (await import("html2pdf.js")).default;

    await html2pdf()
      .set({
        margin: [10, 12, 10, 12], // top, left, bottom, right (mm)
        filename: `${filename || defaultFilename}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          before: [".print-break-before"],
          after: [".print-break-after"],
          avoid: [".print-no-break"],
        },
      })
      .from(element)
      .save();
  } catch (error) {
    console.error("PDF generation failed:", error);
    toast.error(t("common.error"));
  } finally {
    setIsGeneratingPdf(false);
    setShowFilenameDialog(false);
  }
};
```

### 2.3 Dialog لتسمية الملف

```tsx
{/* زر PDF */}
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setPdfFilename(defaultFilename);
    setShowFilenameDialog(true);
  }}
  disabled={isGeneratingPdf}
>
  {isGeneratingPdf ? (
    <Loader2 className="h-4 w-4 animate-spin me-2" />
  ) : (
    <Download className="h-4 w-4 me-2" />
  )}
  {t("common.downloadPdf")}
</Button>

{/* Dialog تسمية الملف */}
<Dialog open={showFilenameDialog} onOpenChange={setShowFilenameDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>{t("common.downloadPdf")}</DialogTitle>
    </DialogHeader>
    <div className="space-y-3">
      <div>
        <Label>{t("common.fileName")}</Label>
        <div className="flex items-center gap-2 mt-1.5">
          <Input
            value={pdfFilename}
            onChange={(e) => setPdfFilename(e.target.value)}
            placeholder={defaultFilename}
            dir="auto"
          />
          <span className="text-sm text-muted-foreground shrink-0">.pdf</span>
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setShowFilenameDialog(false)}>
        {t("common.cancel")}
      </Button>
      <Button
        onClick={() => handleDownloadPdf(pdfFilename)}
        disabled={isGeneratingPdf}
      >
        {isGeneratingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin me-2" />
        ) : (
          <Download className="h-4 w-4 me-2" />
        )}
        {t("common.download")}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2.4 مفاتيح الترجمة (إذا غير موجودة)

تحقق أولاً:
```bash
grep -n "downloadPdf\|fileName" packages/i18n/translations/ar.json | head -5
```

أضف إذا مفقودة:
```json
// ar.json تحت common:
"downloadPdf": "تحميل PDF",
"fileName": "اسم الملف",
"download": "تحميل"

// en.json:
"downloadPdf": "Download PDF",
"fileName": "File name",
"download": "Download"
```

---

## المشكلة 3: الطباعة لا تعرض نفس المعاينة

### الوصف
عند الضغط على "طباعة"، نافذة الطباعة لا تعرض نفس التصميم الظاهر في المعاينة.

### السبب المتوقع
- CSS الطباعة لا يخفي عناصر الصفحة الخارجية (sidebar, header, toolbar)
- TemplateRenderer يستخدم classes لا تعمل في print mode
- ألوان وخلفيات لا تظهر بدون `print-color-adjust: exact`

### الإصلاح

**1. زر الطباعة:**

```typescript
const handlePrint = () => {
  window.print();
};
```

**2. CSS print (مغطّى في المشكلة 1 أعلاه) — تأكد من:**

```css
@media print {
  /* إخفاء Sidebar */
  [data-sidebar],
  aside,
  .sidebar,
  nav {
    display: none !important;
  }

  /* إخفاء Header/Breadcrumb */
  .breadcrumb,
  [data-topbar],
  .page-header {
    display: none !important;
  }

  /* إخفاء شريط الأدوات */
  .no-print,
  [data-no-print],
  button,
  .toolbar {
    display: none !important;
  }

  /* المستند يملأ الصفحة */
  #quotation-print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: white;
  }

  /* حفظ الألوان والخلفيات */
  * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
}
```

**3. أضف `no-print` أو `data-no-print` على عناصر الصفحة:**

في صفحة المعاينة (preview page.tsx):

```tsx
{/* شريط الأدوات — يختفي عند الطباعة */}
<div className="no-print flex items-center justify-between mb-6">
  <Button variant="ghost" onClick={() => router.back()}>
    <ArrowRight className="h-4 w-4 me-2" />
    {t("common.back")}
  </Button>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="h-4 w-4 me-2" />
      {t("common.print")}
    </Button>
    <Button variant="outline" size="sm" onClick={() => setShowFilenameDialog(true)}>
      <Download className="h-4 w-4 me-2" />
      {t("common.downloadPdf")}
    </Button>
  </div>
</div>

{/* Breadcrumb — يختفي عند الطباعة */}
<div className="no-print">
  {/* ... breadcrumb ... */}
</div>

{/* المستند — يظهر فقط هو عند الطباعة */}
<div id="quotation-print-area">
  {/* TemplateRenderer أو QuotationPreview */}
</div>
```

**4. تحقق أن TemplateRenderer يحفظ الألوان:**

ابحث عن inline styles في TemplateRenderer (مثل `style={{ backgroundColor: ... }}`) — هذه ستعمل مع `print-color-adjust: exact`.

---

## القائمة الحمراء — لا تعدّل

```
packages/api/lib/structural-calculations.ts
packages/api/lib/accounting/auto-journal.ts
packages/api/lib/zatca/
apps/web/modules/saas/pricing/components/structural/
apps/web/modules/saas/finance/components/invoices/  ← لا تلمس الفواتير
```

---

## ملخص التغييرات المتوقعة

| # | الملف | نوع | الوصف |
|---|-------|-----|-------|
| 1 | `apps/web/app/globals.css` (أو ملف CSS مناسب) | تعديل | إضافة @media print + A4 styles |
| 2 | صفحة preview (page.tsx) | تعديل | no-print classes + PDF logic + print handler |
| 3 | TemplateRenderer.tsx | تعديل طفيف | إضافة id + print classes على العناصر |
| 4 | `apps/web/types/html2pdf.d.ts` | إنشاء (إذا لزم) | Type declarations |
| 5 | `ar.json` + `en.json` | تعديل | مفاتيح ترجمة PDF |
| 6 | `apps/web/package.json` | تعديل | إضافة html2pdf.js |

---

## التحقق النهائي

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

**اختبر يدوياً:**
1. افتح معاينة عرض سعر → اضغط "طباعة" → يجب أن تظهر نفس المعاينة بالضبط في نافذة الطباعة (بدون sidebar/toolbar)
2. اضغط "تحميل PDF" → يظهر dialog لتسمية الملف → غيّر الاسم أو اتركه → اضغط تحميل → يُنزّل PDF بجودة عالية
3. أنشئ عرض سعر طويل (10+ بنود + مقدمة + أقسام + شروط) → في الطباعة يجب أن ينقسم على صفحات A4 بشكل صحيح (الجدول لا ينقطع في منتصف صف)

**أعطني:**
1. هل الطباعة تعرض نفس المعاينة الآن
2. هل PDF يُنزّل بنجاح مع اسم مخصص
3. هل المحتوى الطويل ينقسم على صفحات صحيحة
4. أي مشاكل في الألوان أو الخطوط عند الطباعة
