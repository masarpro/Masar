# برومبت إكمال قسم الفواتير — مسار × ZATCA Phase 1

> **الوضع:** Plan Mode → ثم التنفيذ على مراحل
> **الهدف:** إكمال قسم الفواتير ليكون متوافقًا بالكامل مع ZATCA المرحلة الأولى (Generation Phase) مع واجهة مستوحاة من نموذج دفترة ومحسّنة لسياق المقاولات

---

## السياق العام

أنت تعمل على منصة "مسار" — نظام إدارة مقاولات SaaS للمقاولين الصغار والمتوسطين في السعودية. المنصة مبنية على:

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** ORPC (type-safe API) + Prisma + PostgreSQL
- **Auth:** Better Auth مع صلاحيات RBAC
- **البنية:** Multi-tenant مع عزل على مستوى المنظمة (organizationId)
- **اللغة:** عربي/إنجليزي مع RTL كامل — كل النصوص تمر عبر `useTranslations`

---

## الوضع الحالي لقسم الفواتير (ما هو موجود فعلاً)

### قاعدة البيانات — FinanceInvoice (موجود):
```
id, organizationId, invoiceNo, invoiceType (STANDARD|TAX|SIMPLIFIED)
clientId → Client, clientName, clientCompany, clientPhone, clientEmail, clientAddress, clientTaxNumber
projectId → Project?, quotationId → Quotation?
status: FinanceInvoiceStatus (DRAFT|SENT|VIEWED|PARTIALLY_PAID|PAID|OVERDUE|CANCELLED)
issueDate, dueDate
subtotal, discountPercent, discountAmount, vatPercent (default 15), vatAmount, totalAmount, paidAmount
sellerTaxNumber, qrCode (Text), zatcaUuid, zatcaHash, zatcaSignature (Text)
paymentTerms, notes, templateId → FinanceTemplate
viewedAt, sentAt, createdById → User
```
- الفهارس: `[organizationId]`, `[organizationId, status]`, `[organizationId, clientId]`, `[organizationId, projectId]`, `[organizationId, invoiceType]`, `[organizationId, dueDate]`

### API الموجود (ORPC procedures):
```
finance.invoices.list        — القائمة مع كشف OVERDUE
finance.invoices.getById     — التفاصيل + البنود + الدفعات
finance.invoices.create      — إنشاء فاتورة
finance.invoices.update      — تحديث
finance.invoices.updateItems — تحديث البنود
finance.invoices.updateStatus — تحديث الحالة
finance.invoices.addPayment  — تسجيل دفعة (يحدث paidAmount + status)
finance.invoices.deletePayment — حذف دفعة (يعيد حساب status)
finance.invoices.convertToTax — تحويل لفاتورة ضريبية مع QR
finance.invoices.delete      — حذف (يمنع حذف المدفوعة)
```

### كود ZATCA الموجود:
```typescript
// packages/api/lib/zatca/index.ts
generateZatcaQR(input: {
  sellerName: string,
  vatNumber: string,
  timestamp: Date,
  totalWithVat: number,
  vatAmount: number
}): string  // Returns Base64 QR — TLV Tags 1..5
```

### الصفحات الموجودة:
```
/finance/invoices                    — قائمة الفواتير
/finance/invoices/new                — إنشاء فاتورة
/finance/invoices/[invoiceId]        — تفاصيل الفاتورة
/finance/invoices/[invoiceId]/preview — معاينة الفاتورة
```

### حسابات الفاتورة الموجودة:
```
subtotal = Σ(quantity × unitPrice)
discountAmount = subtotal × (discountPercent / 100)
vatAmount = (subtotal - discountAmount) × (vatPercent / 100)
totalAmount = subtotal - discountAmount + vatAmount
```

---

## الفجوات التي يجب سدها (حسب تقارير التدقيق + تحليل ZATCA)

### فجوات حرجة (P0):
1. **لا يوجد منطق "إصدار" واضح** — لا يوجد فصل بين Draft و Issued، ولا قفل بعد الإصدار
2. **QR لا يُولّد تلقائيًا لحظة الإصدار** — التنفيذ جزئي
3. **لا يوجد Validation Gate قبل الإصدار** — يمكن إصدار فاتورة بدون بيانات ضريبية
4. **PDF template ناقصة** — لا يوجد قالب فاتورة ضريبية احترافي جاهز للطباعة
5. **الحسابات ليست server-side حصريًا** — خطر أخطاء تقريب

### فجوات عالية (P1):
6. **لا يوجد تحويل تلقائي لـ OVERDUE** — مذكور صراحة في التدقيق
7. **لا يوجد Credit Note / Debit Note** — مطلوب لأن الفواتير لا تُحذف بعد الإصدار
8. **اختبارات Invoice calculations غير موجودة** — مذكورة كأعلى أولوية

### فجوات متوسطة (P2):
9. **إرسال/مشاركة الفاتورة** — نسخ رابط، واتساب (اختياري)
10. **تحويل عرض سعر → فاتورة غير مكتمل** — workflow مقطوع

---

## المطلوب: خطة تنفيذ كاملة ثم تنفيذ على مراحل

### المرجع البصري: نموذج دفترة (Daftra)

ادرس الصور المرفقة بعناية — هذا هو المعيار المتوقع في السوق السعودي:

**صورة 1 — نموذج إنشاء فاتورة (Daftra):**
- قالب الفاتورة (اختيار القالب الافتراضي)
- رقم الفاتورة (تسلسلي تلقائي)
- العميل (اختيار + زر "جديد" بجواره + عملة SAR)
- تاريخ الفاتورة + تاريخ الإصدار
- مسؤول مبيعات (اختيار من الفريق)
- شروط الدفع (بالأيام)
- جدول البنود: البند | الوصف | الوحدة | سعر الوحدة | الكمية | الخصم | الضريبة 1 | الضريبة 2 | الإجمالي
- زر "إضافة" بند جديد
- الإجمالي + الإجمالي بالضريبة
- تبويبات أسفل: الخصم والتسوية | بيانات الشحن | إيداع | إرفاق المستندات

**صورة 2 — خيارات المعاينة:**
- معاينة على المتصفح
- عرض PDF

**صورة 3 — قائمة الفواتير (Daftra):**
- فلاتر: العميل | رقم الفاتورة | الحالة
- بحث متقدم
- تبويبات حالة: الكل | متأخر | مستحقة الدفع | غير مدفوعة | مسودة | مدفوع بالزيادة
- كل فاتورة تعرض: رقم + تاريخ، اسم العميل، الحالة (أنشئت/غير مدفوعة/مدفوعة)، المبلغ

**صورة 4 — قائمة الإجراءات على الفاتورة:**
- عرض | تعديل | PDF | طباعة | إرسال إلى العميل | إضافة عملية دفع | حذف | نسخ

**صورة 5 — عرض الفاتورة (Daftra):**
- رأس: شعار الشركة + اسمها + الرقم الضريبي + العنوان + الهاتف + QR Code
- عنوان: "فاتورة ضريبية" + رقم الفاتورة + تاريخ الفاتورة
- بيانات العميل: "فاتورة إلى" + اسم الشركة + الرقم الضريبي
- جدول البنود: البند | الوصف | الوحدة | الكمية | سعر الوحدة | الإجمالي
- ملخص: الإجمالي → القيمة المضافة (15%) → الإجمالي النهائي → مدفوع → الرصيد المستحق
- ملاحظات بنكية أسفل الفاتورة
- تبويبات: فاتورة | التفاصيل | سجل النشاطات
- أزرار: تعديل | طباعة | PDF | إضافة عملية دفع | قسائم | مرتجع | تعيين مراكز التكلفة | تعيين أمر شغل | إضافة ملاحظة/مرفق

---

## Phase 1A — الامتثال الصلب (ZATCA Phase 1 Generation)

### 1. دورة حياة الفاتورة (Invoice Lifecycle) — **أهم نقطة**

**مسار الحالات المطلوب:**
```
DRAFT → ISSUED → SENT → PARTIALLY_PAID → PAID
                                        → OVERDUE (تلقائي)
        → CANCELLED (من DRAFT فقط)
```

**قواعد حرجة:**
- **DRAFT:** يمكن التعديل بحرية على كل شيء (البنود، العميل، التواريخ، الخصم، الملاحظات)
- **لحظة الإصدار (DRAFT → ISSUED):** هذه لحظة الامتثال:
  1. تشغيل Validation Gate (راجع القسم التالي)
  2. تثبيت رقم الفاتورة + التاريخ + الإجماليات المحسوبة server-side
  3. توليد QR Code (للفاتورة المبسّطة والضريبية) باستخدام `generateZatcaQR` الموجود
  4. توليد `zatcaUuid` (UUID v4)
  5. حفظ snapshot لبيانات البائع والمشتري (حتى لا تتغير لاحقًا لو عدّل المنظمة بياناتها)
  6. قفل الفاتورة — **بعد ISSUED لا يمكن تعديل:** البنود، الأسعار، الضريبة، الخصم، الإجماليات، بيانات البائع/المشتري
- **بعد ISSUED:** يمكن فقط:
  - تغيير الحالة (SENT, إضافة دفعة، إلخ)
  - إضافة/حذف دفعات
  - إنشاء مرتجع (Credit Note) مرتبط بالفاتورة الأصلية
- **لا يمكن حذف فاتورة بعد الإصدار** — فقط إنشاء مرتجع
- **الحذف ممكن فقط في حالة DRAFT**
- **CANCELLED:** يمكن إلغاء فقط من حالة DRAFT

### 2. بوابة التحقق (Validation Gate) — قبل الإصدار

عند محاولة الإصدار (Issue)، يجب التحقق من:

**بيانات المنظمة (Organization):**
- اسم المنشأة (عربي إلزامي) ← من `organization.name`
- الرقم الضريبي (VAT number) ← من `organization.taxNumber` — **إلزامي**
- العنوان (مدينة على الأقل) ← من بيانات المنظمة
- رسالة خطأ واضحة: "يجب إضافة الرقم الضريبي للمنشأة في إعدادات المنظمة قبل إصدار فاتورة ضريبية"

**بيانات العميل (Client):**
- اسم العميل — **إلزامي**
- إذا الفاتورة TAX (ضريبية B2B): الرقم الضريبي للعميل — **إلزامي**
- إذا الفاتورة SIMPLIFIED (مبسّطة B2C): الرقم الضريبي اختياري

**بيانات الفاتورة:**
- بند واحد على الأقل مع كمية > 0 وسعر > 0
- نسبة الضريبة محددة (الافتراضي 15%)
- تاريخ الفاتورة محدد
- العملة SAR (في Phase 1 نثبّتها)

**رسائل الخطأ:** عربية واضحة، كل رسالة تشير للحل المطلوب

### 3. حسابات الفاتورة (Server-side Only)

**مهم جدًا:** كل الحسابات تتم server-side في الـ ORPC procedure، وليس في المتصفح.

```typescript
// الحساب يتم في procedure واحد — مصدر حقيقة واحد
function calculateInvoiceTotals(items: InvoiceItem[], discountPercent: Decimal, vatPercent: Decimal) {
  // 1. حساب إجمالي البنود
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity.mul(item.unitPrice);
    return sum.add(lineTotal);
  }, new Decimal(0));
  
  // 2. حساب الخصم
  const discountAmount = subtotal.mul(discountPercent).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  
  // 3. حساب الضريبة على (الإجمالي - الخصم)
  const taxableAmount = subtotal.sub(discountAmount);
  const vatAmount = taxableAmount.mul(vatPercent).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  
  // 4. الإجمالي النهائي
  const totalAmount = taxableAmount.add(vatAmount);
  
  return { subtotal, discountAmount, vatAmount, totalAmount };
}
```

**قاعدة التقريب:** `Decimal.ROUND_HALF_UP` مع دقة 2 خانات عشرية — ثابتة ولا تتغير.

### 4. توليد QR Code عند الإصدار

عند تحويل الفاتورة من DRAFT → ISSUED:

```typescript
// في issue procedure
const qrCode = generateZatcaQR({
  sellerName: organization.name,           // من بيانات المنظمة
  vatNumber: organization.taxNumber,       // من بيانات المنظمة
  timestamp: new Date(),                   // لحظة الإصدار
  totalWithVat: calculatedTotals.totalAmount.toNumber(),
  vatAmount: calculatedTotals.vatAmount.toNumber(),
});

// حفظ مع الفاتورة
await db.financeInvoice.update({
  where: { id: invoiceId },
  data: {
    status: 'ISSUED',
    qrCode,
    zatcaUuid: crypto.randomUUID(),
    issueDate: new Date(),
    // تثبيت الإجماليات المحسوبة
    subtotal: calculatedTotals.subtotal,
    discountAmount: calculatedTotals.discountAmount,
    vatAmount: calculatedTotals.vatAmount,
    totalAmount: calculatedTotals.totalAmount,
    // snapshot بيانات البائع
    sellerTaxNumber: organization.taxNumber,
  }
});
```

### 5. قفل التعديل بعد الإصدار

في كل procedure تعديل (update, updateItems):
```typescript
// التحقق في بداية كل procedure تعديل
const invoice = await db.financeInvoice.findUnique({ where: { id: invoiceId } });
if (invoice.status !== 'DRAFT') {
  throw new Error('لا يمكن تعديل فاتورة بعد إصدارها. يمكنك إنشاء مرتجع بدلاً من ذلك.');
}
```

### 6. منع الحذف بعد الإصدار

```typescript
// في delete procedure
const invoice = await db.financeInvoice.findUnique({ where: { id: invoiceId } });
if (invoice.status !== 'DRAFT') {
  throw new Error('لا يمكن حذف فاتورة بعد إصدارها. يمكنك إنشاء مرتجع بدلاً من ذلك.');
}
```

### 7. إجراء "إصدار الفاتورة" (Issue Procedure) — **procedure جديد**

```
finance.invoices.issue — POST — invoiceId
```

هذا الإجراء يقوم بكل خطوات الإصدار:
1. جلب الفاتورة مع البنود
2. التحقق أنها DRAFT
3. تشغيل Validation Gate
4. حساب الإجماليات server-side
5. توليد QR + UUID
6. تحديث الحالة لـ ISSUED مع كل البيانات المثبّتة
7. إنشاء سجل Audit Trail

---

## Phase 1B — واجهة المستخدم (UI) مستوحاة من دفترة ومحسّنة لمسار

### 8. صفحة قائمة الفواتير `/finance/invoices`

**المرجع:** صورة 3 (قائمة دفترة)

**التصميم المطلوب:**
- **شريط أعلى:** زر "فاتورة جديدة +" (لون أساسي)
- **فلاتر:** العميل (dropdown) | رقم الفاتورة (text) | الحالة (dropdown)
- **بحث متقدم** (collapsible)
- **تبويبات الحالة:** الكل | متأخرة | مستحقة الدفع | غير مدفوعة | مسودة | مدفوعة
- **كل فاتورة تعرض:**
  - رقم الفاتورة + تاريخ
  - اسم العميل + اسم الشركة
  - الحالة (badge ملون): مسودة (رمادي) | صدرت (أزرق) | أرسلت (بنفسجي) | مدفوعة جزئيًا (برتقالي) | مدفوعة (أخضر) | متأخرة (أحمر) | ملغاة (رمادي مخطط)
  - المبلغ الإجمالي
  - قائمة إجراءات (⋯): عرض | تعديل (فقط لـ DRAFT) | PDF | طباعة | إرسال للعميل | إضافة دفعة | مرتجع | نسخ كفاتورة جديدة
  - **مهم:** زر "حذف" يظهر فقط لفواتير المسودة

### 9. صفحة إنشاء/تعديل الفاتورة `/finance/invoices/new` و `/finance/invoices/[id]/edit`

**المرجع:** صورة 1 (نموذج دفترة)

**التصميم المطلوب — قسم الرأس:**
- **نوع الفاتورة:** selector واضح (ضريبية TAX | مبسّطة SIMPLIFIED | عادية STANDARD)
- **رقم الفاتورة:** تسلسلي تلقائي (read-only، يتولد من النظام)
- **العميل:** dropdown بحث + زر "عميل جديد" inline (يفتح dialog سريع)
  - عند اختيار العميل: يعبّئ تلقائيًا (الاسم، الشركة، الرقم الضريبي، العنوان، الهاتف، الإيميل)
- **العملة:** SAR (ثابتة في Phase 1)
- **تاريخ الفاتورة:** date picker
- **تاريخ الإصدار:** date picker (يتعبأ تلقائيًا عند الإصدار)
- **شروط الدفع:** عدد أيام (يحسب dueDate تلقائيًا)
- **مسؤول المبيعات / المحاسب:** dropdown من أعضاء المنظمة (اختياري)
- **المشروع:** dropdown ربط بمشروع (اختياري)

**التصميم المطلوب — جدول البنود (مهم جدًا):**
- أعمدة: البند | الوصف | الوحدة | سعر الوحدة | الكمية | الخصم % | الضريبة % | الإجمالي
- كل بند يحسب إجماليه تلقائيًا: `quantity × unitPrice - discount + tax`
- زر "إضافة بند" أسفل الجدول
- زر حذف (أيقونة ×) لكل بند
- **الوحدة:** dropdown (م، م²، م³، طن، كجم، لتر، قطعة، مقطوعية، يوم عمل، ساعة عمل — وحدات مقاولات سعودية)

**التصميم المطلوب — الإجماليات:**
```
الإجمالي الفرعي:           _____ ر.س
الخصم (___%):              - _____ ر.س
المبلغ الخاضع للضريبة:     _____ ر.س
ضريبة القيمة المضافة (___%): + _____ ر.س
═══════════════════════════════════
الإجمالي:                  _____ ر.س
```

**التصميم المطلوب — أسفل النموذج (تبويبات):**
- **الملاحظات:** textarea للملاحظات على الفاتورة (تظهر في الطباعة)
- **شروط الدفع:** textarea لشروط إضافية
- **المرفقات:** رفع ملفات مرتبطة

**أزرار الحفظ:**
- "حفظ كمسودة" (أساسي) — يحفظ كـ DRAFT
- "إصدار الفاتورة" (ثانوي بارز) — يحفظ ثم يُصدر (يشغّل Validation Gate + QR + القفل)
- عند الضغط على "إصدار": dialog تأكيد "هل أنت متأكد؟ بعد الإصدار لن يمكنك تعديل الفاتورة."

### 10. صفحة عرض الفاتورة `/finance/invoices/[id]`

**المرجع:** صورة 5 (عرض دفترة)

**التصميم المطلوب — 3 تبويبات:**

**تبويب "فاتورة" (الافتراضي):**
- عرض الفاتورة كمستند جاهز للطباعة (preview) داخل card:
  - **رأس الفاتورة:**
    - يمين: شعار المنظمة + اسمها
    - يسار: QR Code + اسم المنشأة + الرقم الضريبي + العنوان + الهاتف
  - **عنوان:** "فاتورة ضريبية" أو "فاتورة مبسّطة" + رقم الفاتورة + تاريخ الفاتورة + تاريخ الإصدار
  - **بيانات العميل:** "فاتورة إلى:" + اسم الشركة + الرقم الضريبي (إن وجد) + العنوان
  - **جدول البنود:** البند | الوصف | الوحدة | الكمية | سعر الوحدة | الإجمالي
  - **الإجماليات:** الإجمالي → الخصم → القيمة المضافة (15%) → الإجمالي النهائي → المدفوع → الرصيد المستحق
  - **ملاحظات بنكية / شروط الدفع** أسفل الفاتورة

**تبويب "التفاصيل":**
- معلومات إضافية: المشروع المرتبط، عرض السعر المرتبط، تاريخ الإنشاء، الحالة، الدفعات المسجلة

**تبويب "سجل النشاطات":**
- Audit trail: إنشاء، إصدار، إرسال، إضافة دفعة، تعليم متأخرة، مرتجع...

**شريط الإجراءات أعلى الصفحة:**
- badge الحالة (ملون)
- تعديل (فقط لـ DRAFT)
- طباعة
- PDF
- إضافة عملية دفع
- مرتجع (ينشئ Credit Note)
- إرسال (نسخ رابط / واتساب)
- المزيد (⋯): تعيين مشروع، إضافة ملاحظة/مرفق

### 11. معاينة وطباعة PDF

**المرجع:** صورة 2 + صورة 5

**صفحة المعاينة `/finance/invoices/[id]/preview`:**
- عرض الفاتورة كصفحة A4 كاملة (بنفس تصميم العرض)
- زر "طباعة" + زر "تحميل PDF"

**قالب الفاتورة الضريبية (ZATCA Phase 1 compliant):**
- **يجب أن يحتوي على:**
  - اسم البائع (بالعربي)
  - الرقم الضريبي للبائع
  - تاريخ ووقت الإصدار
  - رقم الفاتورة التسلسلي
  - وصف السلع/الخدمات
  - الكمية
  - سعر الوحدة (بدون ضريبة)
  - نسبة الضريبة
  - مبلغ الضريبة لكل بند
  - الإجمالي الفرعي (بدون ضريبة)
  - إجمالي الضريبة
  - الإجمالي (شامل الضريبة)
  - QR Code (TLV Tags 1-5 — الموجود عندك)
  - بيانات المشتري (الاسم، الرقم الضريبي إن وجد)

---

## Phase 1C — التشغيل اليومي للمقاول

### 12. OVERDUE تلقائي

**الخيار الأنسب للإطلاق:** Computed check عند جلب الفواتير (بدون cron job):

```typescript
// في finance.invoices.list — عند جلب القائمة
// تحديث الفواتير المتأخرة تلقائيًا
await db.financeInvoice.updateMany({
  where: {
    organizationId,
    status: { in: ['ISSUED', 'SENT', 'PARTIALLY_PAID'] },
    dueDate: { lt: new Date() },
  },
  data: { status: 'OVERDUE' }
});
```

**بديل أفضل (بعد الإطلاق):** Background job يومي يعمل الفجر.

### 13. Credit Note (مرتجع) — بديل الحذف

**نموذج بيانات جديد مطلوب — CreditNote:**

خيار 1 (الأبسط): استخدام نفس جدول `FinanceInvoice` مع `invoiceType: CREDIT_NOTE` وحقل `relatedInvoiceId`

خيار 2 (الأنظف): جدول منفصل `FinanceCreditNote`

**أنصح بالخيار 1** لتقليل التعقيد:

```prisma
// إضافة على FinanceInvoice:
model FinanceInvoice {
  // ... الحقول الموجودة
  relatedInvoiceId String?  // للمرتجع: يشير للفاتورة الأصلية
  relatedInvoice   FinanceInvoice? @relation("CreditNoteRelation", fields: [relatedInvoiceId], references: [id])
  creditNotes      FinanceInvoice[] @relation("CreditNoteRelation")
}

// إضافة على enum FinanceInvoiceType:
enum FinanceInvoiceType {
  STANDARD
  TAX
  SIMPLIFIED
  CREDIT_NOTE    // ← جديد
  DEBIT_NOTE     // ← جديد (اختياري الآن)
}
```

**Procedure جديد:**
```
finance.invoices.createCreditNote — POST — originalInvoiceId, items[], reason
```
- ينشئ فاتورة بقيم سالبة مرتبطة بالأصلية
- يولّد QR + UUID خاص بالمرتجع
- يحدّث الرصيد المستحق على الفاتورة الأصلية

**في الواجهة:**
- زر "مرتجع" في صفحة عرض الفاتورة (فقط للفواتير المصدرة)
- نموذج مرتجع: يعرض بنود الفاتورة الأصلية، المستخدم يحدد الكميات المرتجعة + السبب
- المرتجع يظهر في قائمة الفواتير مع badge خاص "مرتجع"

### 14. الدفعات (تحسين الموجود)

**الموجود:** `addPayment` و `deletePayment` — يعملون

**المطلوب إضافته:**
- Dialog إضافة دفعة في صفحة عرض الفاتورة (مثل دفترة: المبلغ + التاريخ + طريقة الدفع + المرجع + الحساب البنكي)
- تحديث الحالة تلقائيًا:
  - `paidAmount >= totalAmount` → PAID
  - `paidAmount > 0 && paidAmount < totalAmount` → PARTIALLY_PAID
  - `paidAmount === 0` → يرجع للحالة السابقة
- عرض سجل الدفعات في تبويب "التفاصيل"

---

## Phase 1D — الجودة والاختبارات

### 15. اختبارات حسابات الفواتير (أعلى أولوية حسب التدقيق)

```typescript
// الحالات التي يجب تغطيتها:
describe('Invoice Calculations', () => {
  // أساسي
  test('حساب إجمالي بند واحد بدون خصم')
  test('حساب إجمالي بنود متعددة')
  
  // خصم
  test('خصم نسبة على الإجمالي')
  test('خصم 0%')
  test('خصم 100%')
  
  // ضريبة
  test('ضريبة 15% القياسية')
  test('ضريبة 0% (معفاة)')
  test('ضريبة على مبلغ بعد الخصم')
  
  // تقريب
  test('تقريب لأقرب هللة (0.01)')
  test('حالة تقريب .005 → ROUND_HALF_UP')
  
  // دفعات
  test('دفعة جزئية تحدث paidAmount')
  test('دفعة كاملة تحول لـ PAID')
  test('حذف دفعة يعيد الحساب')
  
  // مرتجع
  test('مرتجع جزئي يخفض الرصيد المستحق')
  test('مرتجع كامل يصفّر الرصيد')
  
  // حالات حافة
  test('بند بكمية 0.5 (نصف متر)')
  test('سعر وحدة بكسور عشرية')
  test('مبلغ إجمالي كبير (ملايين)')
});
```

### 16. Audit Trail للفواتير

استخدام نظام الـ Audit الموجود (الأحداث الموجودة أصلاً):
```
ZATCA_INVOICE_SUBMITTED — عند الإصدار
ZATCA_INVOICE_CLEARED — (للمستقبل Phase 2)
ZATCA_INVOICE_REJECTED — (للمستقبل Phase 2)
```

**إضافة أحداث جديدة:**
```
INVOICE_CREATED — إنشاء مسودة
INVOICE_ISSUED — إصدار (أهم حدث)
INVOICE_SENT — إرسال للعميل
INVOICE_PAYMENT_ADDED — إضافة دفعة
INVOICE_PAYMENT_DELETED — حذف دفعة
INVOICE_OVERDUE — تعليم كمتأخرة
INVOICE_CREDIT_NOTE_CREATED — إنشاء مرتجع
```

---

## ملخص APIs المطلوبة (جديدة أو معدّلة)

### Procedures جديدة:
| Procedure | النوع | الوصف |
|-----------|-------|-------|
| `finance.invoices.issue` | mutation | إصدار الفاتورة (Validation + QR + Lock) |
| `finance.invoices.createCreditNote` | mutation | إنشاء مرتجع مرتبط بفاتورة |
| `finance.invoices.duplicate` | mutation | نسخ فاتورة كمسودة جديدة |
| `finance.invoices.getInvoicePdf` | query | توليد PDF |
| `finance.invoices.sendToClient` | mutation | إرسال رابط للعميل |

### Procedures معدّلة:
| Procedure | التعديل |
|-----------|---------|
| `finance.invoices.update` | منع التعديل إذا status !== DRAFT |
| `finance.invoices.updateItems` | منع التعديل إذا status !== DRAFT |
| `finance.invoices.delete` | منع الحذف إذا status !== DRAFT |
| `finance.invoices.list` | إضافة OVERDUE check تلقائي |
| `finance.invoices.create` | حساب الإجماليات server-side |
| `finance.invoices.addPayment` | تحديث الحالة تلقائيًا |
| `finance.invoices.deletePayment` | إعادة حساب الحالة |

---

## ملخص تعديلات قاعدة البيانات

### إضافات على Prisma Schema:
```prisma
// 1. إضافة حقل المرتجع
model FinanceInvoice {
  relatedInvoiceId String?
  relatedInvoice   FinanceInvoice? @relation("CreditNoteRelation", fields: [relatedInvoiceId], references: [id])
  creditNotes      FinanceInvoice[] @relation("CreditNoteRelation")
  
  // 2. إضافة حقل snapshot للبائع (حتى لا تتغير البيانات بعد الإصدار)
  sellerName       String?
  sellerAddress    String?     @db.Text
  sellerPhone      String?
  
  // 3. إضافة حقل وقت الإصدار (ZATCA يتطلب وقت + تاريخ)
  issuedAt         DateTime?
}

// 4. إضافة أنواع الفواتير
enum FinanceInvoiceType {
  STANDARD
  TAX
  SIMPLIFIED
  CREDIT_NOTE
  DEBIT_NOTE
}
```

---

## ترتيب التنفيذ (الأولويات)

### الأسبوع 1: الأساس (P0)
1. ✅ تعديل Schema (إضافة الحقول الجديدة + migration)
2. ✅ Issue procedure مع Validation Gate + QR + Lock
3. ✅ تعديل update/updateItems/delete لمنع التعديل بعد الإصدار
4. ✅ توحيد الحسابات server-side

### الأسبوع 2: الواجهة (P0)
5. ✅ صفحة إنشاء/تعديل الفاتورة (محسّنة على نمط دفترة)
6. ✅ صفحة عرض الفاتورة (3 تبويبات + preview)
7. ✅ صفحة قائمة الفواتير (فلاتر + تبويبات حالة + إجراءات)
8. ✅ قالب PDF/معاينة الفاتورة الضريبية

### الأسبوع 3: التشغيل (P1)
9. ✅ OVERDUE تلقائي
10. ✅ Credit Note (مرتجع)
11. ✅ تحسين الدفعات (dialog + تحديث تلقائي للحالة)
12. ✅ نسخ فاتورة + إرسال رابط

### الأسبوع 4: الجودة (P1)
13. ✅ اختبارات حسابات الفواتير
14. ✅ Audit trail
15. ✅ مراجعة شاملة + إصلاح أي ثغرات

---

## تعليمات عامة للتنفيذ

### الأنماط المعمارية (يجب اتباعها):
- كل procedure يستخدم `protectedProcedure` مع `verifyMembership(organizationId)`
- كل procedure يتحقق من `organizationId` على كل query/mutation
- استخدام `Zod` للتحقق من المدخلات
- استخدام `useTranslations` لكل النصوص في الواجهة (عربي/إنجليزي)
- RTL layout مع Tailwind (`dir="rtl"`)
- shadcn/ui components كأساس + Tailwind للتخصيص
- **لا تضف مكتبات جديدة** بدون سبب واضح — استخدم ما هو موجود

### ملاحظات مهمة:
- **راجع الملفات الموجودة** قبل كتابة أي كود — لا تكرر ما هو مكتوب
- **اتبع نفس الأنماط** الموجودة في الكود (مثل quotations كمرجع قريب)
- **الفواتير المبسّطة (SIMPLIFIED)** تتطلب QR إلزاميًا في ZATCA Phase 1
- **الفواتير الضريبية (TAX)** QR إلزامي أيضًا
- **الفواتير العادية (STANDARD)** لا تحتاج QR (غير خاضعة لـ ZATCA)
- **الرسائل العربية واضحة ومهنية** — ليست ترجمة حرفية من الإنجليزي

---

## Checklist الامتثال النهائي — "ZATCA Phase 1 Done"

عند الانتهاء، تأكد أن كل النقاط التالية محققة:

- [ ] يمكن إصدار فاتورة مبسّطة فيها QR TLV صحيح (Tags 1-5)
- [ ] يمكن إصدار فاتورة ضريبية فيها QR TLV صحيح + رقم ضريبي للمشتري
- [ ] لا يمكن إصدار فاتورة بدون: اسم المنشأة + الرقم الضريبي للبائع
- [ ] لا يمكن إصدار فاتورة ضريبية بدون رقم ضريبي للعميل
- [ ] لا يمكن إصدار فاتورة بدون بند واحد على الأقل
- [ ] الحسابات تتم server-side فقط مع تقريب ثابت (ROUND_HALF_UP, 2 decimal)
- [ ] QR يتولّد تلقائيًا لحظة الإصدار (ليس يدوي)
- [ ] الفاتورة بعد الإصدار لا تتغير (Immutable) إلا عبر Credit Note
- [ ] لا يمكن حذف فاتورة مصدرة (فقط DRAFT تُحذف)
- [ ] PDF/طباعة تعرض: رقم + تاريخ/وقت + بائع + مشتري + بنود + ضريبة + إجمالي + QR
- [ ] OVERDUE يعمل تلقائيًا عند تجاوز dueDate
- [ ] يمكن إنشاء مرتجع (Credit Note) مرتبط بالفاتورة الأصلية
- [ ] اختبارات الحسابات تغطي: خصم، ضريبة، بنود متعددة، تقريب، دفعات، مرتجعات
- [ ] كل النصوص عربية/إنجليزية عبر i18n
- [ ] الواجهة تدعم RTL بشكل كامل

---

> ابدأ بوضع Plan تفصيلي للملفات المطلوب إنشاؤها/تعديلها، ثم نبدأ التنفيذ ملف بملف.
