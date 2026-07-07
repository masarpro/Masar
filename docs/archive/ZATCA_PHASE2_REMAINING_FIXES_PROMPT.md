# ZATCA Phase 2 — إكمال الإصلاحات المتبقية

## السياق
تم تدقيق ZATCA Phase 2 مقابل التوثيق الرسمي وإصلاح 6 مشاكل حرجة (ClearanceStatus header, cac:Signature, cac:Delivery, compliance invoices count, CSID renewal, idempotent 409/208). الآن نحتاج إكمال 5 نقاط متبقية.

---

## Phase 0 — قراءة إلزامية

اقرأ هذه الملفات قبل أي تعديل:

```bash
# Schema الحالي
cat packages/database/prisma/schema.prisma | grep -A 30 "model ZatcaDevice"
cat packages/database/prisma/schema.prisma | grep -A 25 "model ZatcaSubmission"
cat packages/database/prisma/schema.prisma | grep -B 2 -A 5 "zatca" | head -80

# ZATCA types و xml-builder
cat packages/api/lib/zatca/phase2/types.ts
cat packages/api/lib/zatca/phase2/xml-builder.ts
cat packages/api/lib/zatca/phase2/constants.ts

# Organization model — لفهم حقول العنوان المتوفرة
cat packages/database/prisma/schema.prisma | grep -A 40 "model Organization"

# package.json للتحقق من المكتبات الموجودة
cat packages/api/package.json | grep -E "noble|xmlbuilder"

# الملفات اللي تستخدم بيانات المنظمة في ZATCA
cat packages/api/lib/zatca/phase2/zatca-service.ts
cat packages/api/modules/zatca/procedures/submit-invoice.ts
```

**اكتب تقرير اكتشاف مختصر** يشمل:
1. هل ZatcaDevice و ZatcaSubmission موجودين في schema.prisma؟
2. هل @noble/hashes و @noble/curves و xmlbuilder2 موجودين في package.json؟
3. ما هي حقول العنوان المتوفرة في Organization model؟
4. كيف يُبنى عنوان البائع حالياً في xml-builder.ts؟
5. هل يوجد أي buyer identification logic حالياً؟

---

## Phase 1 — تثبيت المكتبات وتوليد Prisma Client

### 1.1 تثبيت المكتبات المفقودة

```bash
# تحقق أولاً هل موجودة
cat packages/api/package.json | grep -E "noble|xmlbuilder"

# إذا مفقودة، ثبّتها
pnpm --filter @repo/api add @noble/hashes @noble/curves xmlbuilder2
```

**ملاحظة:** إذا كانت المكتبات مُثبّتة مسبقاً، تخطَّ هذه الخطوة.

### 1.2 توليد Prisma Client

```bash
# تأكد أن ZatcaDevice و ZatcaSubmission موجودين في schema
grep -c "model ZatcaDevice" packages/database/prisma/schema.prisma
grep -c "model ZatcaSubmission" packages/database/prisma/schema.prisma

# إذا موجودين:
pnpm --filter database generate

# تشغيل سكربت fix-zod-decimal بعد كل generate
node packages/database/scripts/fix-zod-decimal.mjs
```

**إذا ZatcaDevice أو ZatcaSubmission غير موجودين في schema.prisma:**
- اقرأ الملفات التالية لفهم الـ fields المطلوبة:
  ```bash
  grep -r "ZatcaDevice\|zatcaDevice" packages/api/ --include="*.ts" | head -20
  grep -r "ZatcaSubmission\|zatcaSubmission" packages/api/ --include="*.ts" | head -20
  ```
- أضف الـ models بناءً على ما يتوقعه الكود (اقرأ الملفات أولاً — لا تخمّن)
- ثم `pnpm --filter database generate`

### 1.3 التحقق

```bash
npx tsc --noEmit --pretty 2>&1 | grep -i "zatca" | head -20
```

اكتب عدد الأخطاء المتعلقة بـ ZATCA قبل وبعد.

---

## Phase 2 — التحقق من عنوان البائع (BR-KSA-09 + BR-KSA-37)

### المتطلبات حسب ZATCA:

عنوان البائع يجب أن يحتوي على **7 حقول إلزامية**:

```xml
<cac:PostalAddress>
  <cbc:StreetName>شارع الأمير سلطان</cbc:StreetName>
  <cbc:BuildingNumber>2322</cbc:BuildingNumber>           <!-- بالضبط 4 أرقام -->
  <cbc:CitySubdivisionName>المربع</cbc:CitySubdivisionName>  <!-- الحي -->
  <cbc:CityName>الرياض</cbc:CityName>
  <cbc:PostalZone>23333</cbc:PostalZone>                  <!-- الرمز البريدي -->
  <cbc:CountryIdentificationCode>SA</cbc:CountryIdentificationCode>
  <!-- AdditionalNumber يجب أن يكون موجوداً أيضاً — إما كحقل منفصل أو في DistrictName -->
</cac:PostalAddress>
```

### المطلوب:

**2.1** اقرأ كيف يُبنى عنوان البائع في `xml-builder.ts` — ابحث عن `AccountingSupplierParty` أو `PostalAddress`.

**2.2** تأكد أن:
- [ ] `StreetName` يُملأ من بيانات المنظمة
- [ ] `BuildingNumber` يُملأ — وأضف validation أنه بالضبط 4 أرقام (`/^\d{4}$/`)
- [ ] `CitySubdivisionName` (الحي/District) يُملأ
- [ ] `CityName` يُملأ
- [ ] `PostalZone` يُملأ
- [ ] `CountryIdentificationCode` = "SA"
- [ ] `AdditionalNumber` — إذا مفقود كحقل في Organization، اجعله optional في ZatcaInvoiceData مع تحذير واضح في log إذا كان فارغاً

**2.3** أضف validation في `zatca-service.ts` أو `submit-invoice.ts` **قبل** بناء XML:

```typescript
// Pseudocode — اقرأ الكود الفعلي أولاً
function validateSellerAddress(org: Organization): string[] {
  const errors: string[] = [];
  if (!org.street) errors.push("StreetName مطلوب (BR-KSA-09)");
  if (!org.buildingNumber || !/^\d{4}$/.test(org.buildingNumber)) 
    errors.push("BuildingNumber يجب أن يكون 4 أرقام بالضبط (BR-KSA-37)");
  if (!org.city) errors.push("CityName مطلوب (BR-KSA-09)");
  if (!org.postalCode) errors.push("PostalZone مطلوب (BR-KSA-09)");
  if (!org.district) errors.push("CitySubdivisionName/الحي مطلوب (BR-KSA-09)");
  return errors;
}
```

**إذا كان الحقل غير موجود في Organization model:** لا تعدّل schema.prisma — فقط:
- اجعل الحقل optional في ZatcaAddress type
- أضف console.warn إذا كان فارغاً
- احذف الـ XML tag بالكامل إذا القيمة فارغة (لا ترسل tag فارغ — ZATCA يرفضه)

---

## Phase 3 — إضافة Buyer Identification (BR-KSA-14)

### المتطلب:

للفواتير المعيارية (B2B / Standard — `InvoiceTypeCode name="0100000"`):
- إذا المشتري **غير مسجل ضريبياً** (ما عنده VAT number)، يجب إضافة `cac:PartyIdentification` مع أحد الـ scheme IDs:

```
TIN, CRN, MOM, MLS, 700, SAG, NAT, GCC, IQA, PAS, OTH
```

- إذا المشتري **مسجل ضريبياً** (عنده VAT number)، `PartyTaxScheme/CompanyID` كافي.

### المطلوب:

**3.1** اقرأ كيف يُبنى `AccountingCustomerParty` في `xml-builder.ts`.

**3.2** أضف في `ZatcaInvoiceData` (types.ts):

```typescript
// اقرأ الملف أولاً — هذا pseudocode
buyer?: {
  // الحقول الموجودة...
  identificationId?: string;       // رقم التعريف (CRN, NAT, etc.)
  identificationScheme?: string;   // نوع التعريف: "CRN" | "TIN" | "NAT" | etc.
};
```

**3.3** عدّل `xml-builder.ts` — في بناء `AccountingCustomerParty`:

```typescript
// Pseudocode — اقرأ الكود الفعلي
// إذا الفاتورة معيارية (standard) والمشتري ما عنده VAT:
if (isStandard && buyer?.identificationId && buyer?.identificationScheme) {
  // أضف قبل PostalAddress:
  // <cac:PartyIdentification>
  //   <cbc:ID schemeID="CRN">1234567890</cbc:ID>
  // </cac:PartyIdentification>
}
```

**3.4** عدّل `submit-invoice.ts` — لتمرير بيانات المشتري من FinanceInvoice/Client:

```typescript
// اقرأ كيف يُجلب العميل حالياً
// أضف identificationId و identificationScheme من بيانات العميل
```

**ملاحظة مهمة:** إذا بيانات العميل (Client model) ما تحتوي على `identificationId` أو `identificationScheme`:
- لا تعدّل schema.prisma
- اجعلها optional في ZatcaInvoiceData
- أضف console.warn: "BR-KSA-14: Buyer identification missing for standard invoice — ZATCA may reject"

---

## Phase 4 — إضافة Sandbox Test Script

### المطلوب:

أنشئ أو عدّل `packages/api/lib/zatca/phase2/sandbox-test.ts` ليشمل:

**4.1** اقرأ الملف الحالي أولاً:
```bash
cat packages/api/lib/zatca/phase2/sandbox-test.ts
```

**4.2** تأكد أن الـ test يغطي التدفق الكامل:

```
1. CSR Generation
2. POST /compliance → CCSID
3. POST /compliance/invoices × 3 أنواع (invoice + credit + debit)
4. POST /production/csids → PCSID
5. POST /invoices/reporting/single (simplified)
6. POST /invoices/clearance/single (standard)
```

**4.3** أضف validation checks بعد كل خطوة:

```typescript
// بعد كل API call:
console.log(`Step ${n}: ${response.ok ? '✅' : '❌'} ${endpoint}`);
if (!response.ok) {
  console.error(`  Errors:`, response.data?.validationResults?.errorMessages);
  console.error(`  Warnings:`, response.data?.validationResults?.warningMessages);
}
```

**4.4** أضف npm script في `packages/api/package.json`:
```json
"zatca:test-sandbox": "tsx lib/zatca/phase2/sandbox-test.ts"
```

---

## Phase 5 — التحقق النهائي

```bash
# 1. TypeScript check
npx tsc --noEmit --pretty 2>&1 | tail -5

# 2. تحقق أن كل الـ imports تعمل
grep -r "from.*phase2" packages/api/lib/zatca/ --include="*.ts" | grep -v node_modules | head -20

# 3. تحقق أن الـ exports في index.ts تشمل كل الدوال الجديدة
cat packages/api/lib/zatca/phase2/index.ts

# 4. تحقق أن router يشمل كل الـ endpoints
cat packages/api/modules/zatca/router.ts
```

---

## قائمة الملفات الممنوع تعديلها (Red List)

- `packages/database/prisma/schema.prisma` — **لا تعدّل** إلا إذا ZatcaDevice/ZatcaSubmission مفقودين فعلاً
- `packages/auth/` — لا تعدّل
- `packages/api/lib/zatca/phase2/auto-journal.ts` — لا يوجد لكن لا تنشئ
- `packages/i18n/translations/ar.json` — لا تعدّل
- `packages/api/orpc/router.ts` — لا تضف routes (الـ ZATCA router مسجل مسبقاً)
- أي ملف محاسبي (`auto-journal.ts`, `accounting.ts`, `accounting-reports.ts`)

## ملفات مسموح تعديلها

- `packages/api/lib/zatca/phase2/*.ts` — كل ملفات المكتبة
- `packages/api/modules/zatca/**/*.ts` — كل ملفات الوحدة
- `packages/api/package.json` — لإضافة مكتبات وسكربتات

---

## ملخص التغييرات المتوقعة

| # | المهمة | الملفات المتوقع تعديلها |
|---|--------|----------------------|
| 1 | تثبيت مكتبات + prisma generate | `package.json` فقط (أو لا شيء إذا مُثبّتة) |
| 2 | validation عنوان البائع + BuildingNumber 4 أرقام | `xml-builder.ts`, `zatca-service.ts` أو `submit-invoice.ts` |
| 3 | Buyer Identification (BR-KSA-14) | `types.ts`, `xml-builder.ts`, `submit-invoice.ts` |
| 4 | Sandbox test script | `sandbox-test.ts`, `package.json` |
| 5 | التحقق النهائي | لا تعديلات — فحص فقط |

## التحقق بعد كل Phase

```bash
npx tsc --noEmit --pretty
```
