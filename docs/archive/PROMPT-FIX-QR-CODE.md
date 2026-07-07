# إصلاح عرض QR Code في الفواتير

## المشكلة

دالة `generateZatcaQR()` في `packages/api/lib/zatca/index.ts` تُنتج **Base64 TLV string** فقط — وهذا هو البيانات المشفّرة وفق مواصفات ZATCA (Tags 1-5). لكن هذا **ليس صورة QR Code**.

الفاتورة حاليًا تحفظ الـ TLV string في حقل `qrCode` في قاعدة البيانات، والواجهة تحاول عرضه كصورة لكنه ليس صورة — لذلك يظهر placeholder أو نص بدل QR.

## المطلوب

### الخطوة 1: تثبيت مكتبة `qrcode`

```bash
cd packages/api && pnpm add qrcode && pnpm add -D @types/qrcode
```

### الخطوة 2: تعديل `generateZatcaQR` أو إضافة دالة جديدة

**الملف:** `packages/api/lib/zatca/index.ts`

**اقرأ الملف أولاً** لتفهم الكود الحالي.

المطلوب: بعد توليد TLV Base64 string، حوّله لصورة QR كـ Data URL (Base64 PNG):

```typescript
import QRCode from "qrcode";

// الدالة الحالية تبقى كما هي — تولّد TLV Base64
// أضف دالة جديدة تأخذ TLV وتحوّله لصورة QR

export async function generateZatcaQRImage(tlvBase64: string): Promise<string> {
  // تحويل TLV Base64 إلى صورة QR كـ Data URL (PNG Base64)
  const qrDataUrl = await QRCode.toDataURL(tlvBase64, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 200,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
  return qrDataUrl; // يرجع: "data:image/png;base64,iVBOR..."
}
```

### الخطوة 3: تعديل issue procedure لتوليد صورة QR

**الملف:** ابحث عن الـ issue invoice procedure (الذي يُصدر الفاتورة)

عند الإصدار، بعد توليد TLV:

```typescript
// 1. توليد TLV (الموجود حاليًا)
const tlvBase64 = generateZatcaQR({
  sellerName: organization.name,
  vatNumber: organization.taxNumber,
  timestamp: new Date(),
  totalWithVat: totalAmount,
  vatAmount: vatAmount,
});

// 2. تحويل TLV لصورة QR (الجديد)
const qrImageDataUrl = await generateZatcaQRImage(tlvBase64);

// 3. حفظ صورة QR في قاعدة البيانات (بدل TLV فقط)
// حقل qrCode يحفظ الآن Data URL للصورة
await db.financeInvoice.update({
  where: { id: invoiceId },
  data: {
    qrCode: qrImageDataUrl, // "data:image/png;base64,..."
    // ... باقي الحقول
  },
});
```

**ملاحظة مهمة:** إذا تريد حفظ TLV أيضًا (للتحقق مستقبلاً في Phase 2)، يمكنك:
- حفظ صورة QR في `qrCode`
- حفظ TLV في `zatcaHash` أو إضافة حقل جديد `zatcaTlv`

### الخطوة 4: تعديل الواجهة لعرض QR كصورة

**الملفات:**
- `InvoiceViewTab.tsx` (عرض الفاتورة)
- `InvoicePreview.tsx` (معاينة/طباعة)

ابحث عن المكان الذي يعرض QR Code وتأكد أنه يستخدم `<img>`:

```tsx
{invoice.qrCode && (
  <img
    src={invoice.qrCode}
    alt="ZATCA QR Code"
    className="w-24 h-24"
    // invoice.qrCode الآن = "data:image/png;base64,..."
    // المتصفح يعرضه مباشرة كصورة
  />
)}
```

**لا تستخدم:**
```tsx
// ❌ خطأ — هذا يفترض أن qrCode هو raw Base64 بدون prefix
<img src={`data:image/png;base64,${invoice.qrCode}`} />

// ✅ صحيح — لأن qrCode الآن يحتوي Data URL كامل
<img src={invoice.qrCode} />
```

### الخطوة 5: إصلاح الفواتير المصدرة سابقًا (اختياري)

إذا توجد فواتير مصدرة سابقًا مع TLV فقط (بدون صورة)، يمكنك إضافة fallback في الواجهة:

```tsx
{invoice.qrCode && (
  invoice.qrCode.startsWith("data:image") ? (
    // صورة QR جاهزة
    <img src={invoice.qrCode} alt="ZATCA QR Code" className="w-24 h-24" />
  ) : (
    // TLV قديم — اعرض placeholder أو حوّله client-side
    <QRCodeClientFallback tlv={invoice.qrCode} />
  )
)}
```

أو الأفضل: اكتب script بسيط يحدّث الفواتير القديمة:

```typescript
// one-time migration script
const invoicesWithTlv = await db.financeInvoice.findMany({
  where: {
    qrCode: { not: null },
    NOT: { qrCode: { startsWith: "data:image" } }
  }
});

for (const inv of invoicesWithTlv) {
  const qrImage = await generateZatcaQRImage(inv.qrCode!);
  await db.financeInvoice.update({
    where: { id: inv.id },
    data: { qrCode: qrImage }
  });
}
```

### الخطوة 6: تحقق

بعد التعديل:
1. أنشئ فاتورة جديدة (مسودة)
2. أصدرها (Issue)
3. افتح صفحة العرض → يجب أن يظهر QR Code كصورة فعلية
4. افتح المعاينة/الطباعة → يجب أن يظهر QR Code
5. QR يجب أن يكون قابل للمسح بكاميرا الجوال → يعرض بيانات البائع والضريبة

---

## بخصوص الشعار (Logo)

مشكلة الشعار منفصلة — على الأرجح:
- إذا الشعار مخزن في S3: تأكد أن S3 bucket متاح ورابط الصورة صحيح
- إذا الشعار لم يُرفع أصلاً: ارفعه من إعدادات المنظمة
- للسيرفر المحلي: تأكد أن متغيرات البيئة الخاصة بـ S3 (AWS_ACCESS_KEY, BUCKET_NAME, etc.) مضبوطة في `.env.local`

يمكنك التحقق:
```bash
# افتح إعدادات المنظمة في المتصفح وارفع الشعار
# أو تحقق من console المتصفح لمعرفة رابط الصورة الفاشل
```

---

## ملخص التعديلات

| الملف | التعديل |
|-------|---------|
| `packages/api/lib/zatca/index.ts` | إضافة `generateZatcaQRImage()` |
| `packages/api/package.json` | إضافة `qrcode` + `@types/qrcode` |
| Issue procedure | استدعاء `generateZatcaQRImage` وحفظ النتيجة |
| `InvoiceViewTab.tsx` | التأكد من `<img src={invoice.qrCode}>` |
| `InvoicePreview.tsx` | نفس التأكد |
| `convertToTax` procedure | نفس التعديل إذا يولّد QR |

> **لا تعدّل أي شيء في الـ Schema أو الحقول — فقط أضف دالة التحويل واستخدمها.**
