# ZATCA Phase 2 — مراجعة التطبيق مقابل التوثيق الرسمي للـ APIs

## الهدف
مراجعة تطبيق ZATCA Phase 2 الحالي في مسار ومقارنته بالتوثيق الرسمي لـ ZATCA Sandbox APIs (الإصدار 2.1.0)، وإصلاح أي فجوات أو اختلافات.

---

## Phase 0 — قراءة إلزامية (لا تكتب أي كود قبل إكمال هذه المرحلة)

اقرأ **كل** الملفات التالية بالكامل قبل أي تعديل:

```
# ملفات ZATCA الأساسية
packages/api/lib/zatca/          # اقرأ كل الملفات في هذا المجلد
packages/api/modules/zatca/      # اقرأ كل الملفات في هذا المجلد (إن وجد)

# البحث عن كل ملفات ZATCA في المشروع
find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "zatca\|ZATCA\|csid\|CSID\|clearance\|reporting.*invoice" 2>/dev/null | head -50

# Schema
grep -A 30 "zatca\|Zatca\|CSID\|csid" packages/database/prisma/schema.prisma

# Environment variables
grep -r "ZATCA" .env* packages/ apps/ --include="*.ts" --include="*.env*" 2>/dev/null | head -30

# الترجمات
grep -i "zatca" packages/i18n/translations/ar.json | head -20

# Router
grep -i "zatca" packages/api/orpc/router.ts
```

**اكتب تقرير اكتشاف** يتضمن:
1. قائمة كل ملفات ZATCA الموجودة ومحتواها المختصر
2. حقول Prisma المتعلقة بـ ZATCA (models + fields)
3. الـ environment variables المُستخدمة
4. الـ API endpoints المُنفّذة

---

## Phase 1 — مراجعة Compliance CSID API

### المواصفات الرسمية:
```
POST /compliance
Base URL: https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal

Headers:
  - OTP: integer (required) — أمثلة: 123345, 111111, 222222
  - AcceptVersion: "V2" (required)

Request Body (application/json):
  { "csr": "<base64-encoded-CSR>" }

Response 200:
  {
    "requestID": number,
    "dispositionMessage": "ISSUED",
    "binarySecurityToken": "<base64-X509-certificate>",
    "secret": "<string>"
  }

Errors:
  400: Missing-OTP, Invalid-OTP, Missing-CSR, Invalid-CSR
  406: Version not supported
  500: Internal Server Error
```

### تحقق من:
- [ ] هل endpoint الـ Compliance CSID مُنفَّذ بنفس الـ path والـ headers؟
- [ ] هل `AcceptVersion: V2` يُرسل في كل الطلبات؟
- [ ] هل الـ OTP يُمرر كـ header وليس في الـ body؟
- [ ] هل الـ CSR يُرسل كـ base64 في حقل `csr`؟
- [ ] هل الـ response يُعالج بشكل صحيح: `requestID` + `binarySecurityToken` + `secret`؟
- [ ] هل الـ `binarySecurityToken` يُخزَّن بشكل مُشفَّر (مع `ZATCA_DEVICE_ENCRYPTION_KEY`)؟
- [ ] هل أكواد الأخطاء (400, 406, 500) تُعالَج بشكل صحيح مع رسائل واضحة؟

---

## Phase 2 — مراجعة Compliance Invoice API

### المواصفات الرسمية:
```
POST /compliance/invoices
Base URL: https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal

Headers:
  - Authorization: Basic <base64(binarySecurityToken:secret)>
    (من Compliance CSID response)
  - AcceptLanguage: "en" | "ar" (optional)
  - AcceptVersion: "V2" (required — ملاحظة: في التوثيق مكتوب "Accept-Version")

Request Body (application/json):
  {
    "invoiceHash": "<SHA-256 hash>",
    "uuid": "<UUID>",
    "invoice": "<base64-encoded-XML>"
  }

Response 200:
  {
    "validationResults": {
      "infoMessages": [...],
      "warningMessages": [...],
      "errorMessages": [...],
      "status": "PASS" | "WARNING" | "ERROR"
    },
    "reportingStatus": "REPORTED" | "NOT_REPORTED",
    "clearanceStatus": null,
    "qrSellertStatus": null,
    "qrBuyertStatus": null
  }

أنواع الفواتير للفحص:
  - Standard invoice (InvoiceTypeCode name="0100000")
  - Standard debit note
  - Standard credit note
  - Simplified Invoice (InvoiceTypeCode name="0200000")
  - Simplified credit note
  - Simplified debit note

Errors 400:
  - KSA Rules Violation (BR-KSA-37, BR-KSA-09, etc.)
  - Invalid QR Code / Missing QR Code
  - Invalid Signature / Missing Signature
  - Invalid Authentication Certificate / Missing Authentication Certificate
```

### تحقق من:
- [ ] هل الـ Authorization header يُبنى من `binarySecurityToken:secret` كـ Basic Auth؟
- [ ] هل يُرسل كل أنواع الفواتير الستة أثناء الـ compliance check؟
- [ ] هل الـ `invoiceHash` هو SHA-256 hash فعلي للـ XML (بدون UBLExtensions)؟
- [ ] هل الـ `uuid` يُولَّد كـ UUID v4 فريد لكل فاتورة؟
- [ ] هل الـ invoice XML مُشفَّر كـ base64؟
- [ ] هل أخطاء الـ validation (KSA rules, QR, Signature) تُعرض للمستخدم بشكل مفهوم؟
- [ ] هل يُفرَّق بين `reportingStatus` و `clearanceStatus`؟

---

## Phase 3 — مراجعة Production CSID (Onboarding) API

### المواصفات الرسمية:
```
POST /production/csids
Base URL: https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal

Headers:
  - Authorization: Basic <base64(ComplianceCertificate:secret)>
    (من Compliance CSID response)
  - AcceptVersion: "V2" (required)

Request Body (application/json):
  { "compliance_request_id": "<requestID from compliance CSID>" }

Response 200:
  {
    "requestID": number,
    "dispositionMessage": "ISSUED",
    "binarySecurityToken": "<base64-Production-Certificate>",
    "secret": "<string>"
  }

Errors 400:
  - Missing-ComplianceSteps (الـ compliance checks غير مكتملة)
  - Missing-CurrentCCSID / Invalid-CurrentCCSID
  - Missing-compliance_request_id / Invalid-ComplianceRequestId
  
Error 401: Unauthorized
Error 428: NOT_COMPLIANT — يُعيد compliance certificate مؤقتة مع secret وأخطاء
```

### تحقق من:
- [ ] هل الـ `compliance_request_id` يُحفظ من الـ Compliance CSID response ويُرسل هنا؟
- [ ] هل الـ Authorization يستخدم Compliance Certificate (ليس Production)؟
- [ ] هل الـ Production Certificate يُخزَّن مُشفَّراً مع `ZATCA_DEVICE_ENCRYPTION_KEY`؟
- [ ] هل الـ `secret` الجديد يُخزَّن ويُستخدم في الـ Reporting/Clearance APIs؟
- [ ] هل يُعالج الـ 428 (NOT_COMPLIANT) بشكل صحيح — لأنه يُعيد شهادة مؤقتة وليس خطأ عادي؟
- [ ] هل `Missing-ComplianceSteps` يُعالَج برسالة واضحة (يعني ما كملت فحوصات الامتثال)؟

---

## Phase 4 — مراجعة Production CSID (Renewal) API

### المواصفات الرسمية:
```
PATCH /production/csids   ← ملاحظة: PATCH وليس POST
Base URL: https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal

Headers:
  - OTP: string (required) — من بوابة فاتورة
  - acceptlanguage: "en" | "ar" (optional)
  - AcceptVersion: "V2" (required)
  - Authorization: Basic <base64(currentProductionCertificate:secret)>

Request Body (application/json):
  { "csr": "<base64-encoded-NEW-CSR>" }

Response 200:
  {
    "requestID": number,
    "tokenType": "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3",
    "dispositionMessage": "ISSUED",
    "binarySecurityToken": "<new-base64-Production-Certificate>",
    "secret": "<new-secret>"
  }

Errors 400:
  - Missing-OTP / Invalid-OTP
  - Missing-CSR / Invalid-CSR
  - Missing-currentCSID / Invalid-currentCSID

Error 428: NOT_COMPLIANT (يُعيد compliance certificate + secret + errors)
```

### تحقق من:
- [ ] هل يُستخدم `PATCH` وليس `POST`؟
- [ ] هل الـ Authorization يستخدم الـ **current** Production Certificate (الحالية وليس القديمة)؟
- [ ] هل CSR جديد يُولَّد للتجديد (وليس نفس الـ CSR القديم)؟
- [ ] هل بعد التجديد الناجح: يُحدَّث الـ `binarySecurityToken` و `secret` في قاعدة البيانات؟
- [ ] هل `tokenType` في الـ response يُخزَّن أو على الأقل يُتحقق منه؟
- [ ] هل يوجد آلية لتجديد الشهادة قبل انتهاء صلاحيتها (5 سنوات)؟
- [ ] هل الـ 428 NOT_COMPLIANT يُعالَج بنفس طريقة الـ Onboarding؟

---

## Phase 5 — مراجعة Reporting API

### المواصفات الرسمية:
```
POST /invoices/reporting/single
Base URL: https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal

Headers:
  - Authorization: Basic <base64(ProductionCertificate:secret)>
    (من Production CSID response)
  - acceptlanguage: "en" | "ar" (optional)
  - ClearanceStatus: "0" | "1" (required)
    "0" = clearance معطل (simplified invoices)
    "1" = clearance مُفعّل (standard invoices → clearance endpoint)
  - AcceptVersion: "V2" (required)

Request Body (application/json):
  {
    "invoiceHash": "<SHA-256 hash>",
    "uuid": "<UUID>",
    "invoice": "<base64-encoded-signed-XML>"
  }

Response 200 (PASS):
  {
    "validationResults": {
      "infoMessages": [...],
      "warningMessages": [],
      "errorMessages": [],
      "status": "PASS"
    },
    "reportingStatus": "REPORTED"
  }

Response 202 (WARNING):
  {
    "validationResults": {
      "status": "WARNING",
      "warningMessages": [
        { "code": "BR-CO-17", "category": "EN_16931", "message": "..." },
        { "code": "BR-KSA-98", "category": "KSA", "message": "simplified invoice should be submitted within 24 hours" }
      ]
    },
    "reportingStatus": "REPORTED"
  }

Validations performed:
  1. UBL2 XSD compliance
  2. EN 16931 Rules
  3. KSA Specific Rules (override EN 16931)
  4. QR Code validation
  5. Cryptographic Stamp validation
  6. Previous Invoice Hash (PIH) validation

Errors 400:
  - Invalid Invoice Hash (hash في body لا يتطابق مع hash محسوب من XML)
  - Missing Invoice Hash
  - Missing Invoice
  - XSD Schema Error
  - EN Rules Violation
  - KSA Rules Violation
  - Invalid/Missing QR Code
  - Invalid Signature

Error 401: Unauthorized
Error 406: AcceptVersion غير V2
Error 409: "Invoice was already Reported successfully earlier" — الفاتورة مُبلَّغ عنها مسبقاً
Error 500: Internal Server Error
```

### تحقق من:
- [ ] هل الـ Authorization يستخدم **Production** Certificate (ليس Compliance)؟
- [ ] هل `ClearanceStatus` header يُرسل؟ ويكون "0" للمبسطة و"1" للمعيارية؟
- [ ] هل يُتعامل مع Response 200 (PASS) و 202 (WARNING) بشكل مختلف عن 400 (ERROR)؟
- [ ] **مهم:** هل الـ 202 يُعتبر نجاح (الفاتورة مُبلَّغة رغم التحذيرات)؟
- [ ] هل الـ 409 (already reported) يُعالَج بدون إظهار خطأ للمستخدم (idempotency)؟
- [ ] هل التحذير `BR-KSA-98` (24 ساعة) يُسجَّل في log؟
- [ ] هل `invoiceHash` يتطابق فعلاً مع SHA-256 hash المحسوب من XML بدون UBLExtensions؟
- [ ] هل PIH (Previous Invoice Hash) يُحسب ويُخزَّن بشكل صحيح كسلسلة؟

---

## Phase 6 — مراجعة Clearance API (الفواتير المعيارية B2B)

### المواصفات الرسمية:
```
POST /invoices/clearance/single
Base URL: https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal

Headers:
  - Authorization: Basic <base64(ProductionCertificate:secret)>
    (من Production CSID response)
  - acceptlanguage: "en" | "ar" (optional)
  - ClearanceStatus: "1" (required — يجب أن يكون "1" لتفعيل الـ clearance)
  - AcceptVersion: "V2" (required)

Request Body (application/json):
  {
    "invoiceHash": "<SHA-256 hash>",
    "uuid": "<UUID>",
    "invoice": "<base64-encoded-signed-XML>"
  }

Response 200 (CLEARED):
  {
    "validationResults": {
      "infoMessages": [...],
      "warningMessages": [],
      "errorMessages": [],
      "status": "PASS"
    },
    "clearanceStatus": "CLEARED",
    "clearedInvoice": "<base64-encoded-ZATCA-signed-XML>"  ← مهم: ZATCA يُعيد XML مُوقَّع بختمه
  }

Response 202 (CLEARED with warnings):
  {
    "validationResults": {
      "status": "WARNING",
      "warningMessages": [
        { "code": "BR-KSA-51", "category": "KSA", "message": "..." }
      ]
    },
    "clearanceStatus": "CLEARED",
    "clearedInvoice": "<base64-encoded-ZATCA-signed-XML>"
  }

Response 208 (Already Reported):
  — الفاتورة أُرسلت سابقاً (idempotency)

Response 303 (See Other):
  — عند إرسال فاتورة معيارية بينما ClearanceStatus = "0"
  — الرسالة: "Clearance is deactivated. Please use the /invoices/reporting/single endpoint instead."

Validations performed (نفس الـ Reporting + إضافي):
  1. UBL2 XSD compliance
  2. EN 16931 Rules
  3. KSA Specific Rules
  4. QR Code validation (if any)
  5. Cryptographic Stamp validation (if any)
  6. Previous Invoice Hash (PIH)

بعد النجاح: ZATCA يوقع الفاتورة ويضيف QR code ويعيدها في clearedInvoice

Errors 400:
  - Invalid Invoice Hash (hash لا يتطابق مع XML المحسوب)
  - Invalid Invoice Hash - Invalid Base64
  - Missing Invoice Hash
  - Missing Invoice
  - XSD Schema Error
  - EN Rules Violation (BR-KSA-F-06-C17 مثلاً: حدود أحرف BT-126)
  - KSA Rules Violation (BR-KSA-14: buyer identification مطلوب)

Error 401: Unauthorized
Error 500: Internal Server Error
```

### الفرق الجوهري بين Clearance و Reporting:

| الخاصية | Reporting | Clearance |
|---------|-----------|-----------|
| نوع الفاتورة | مبسطة (B2C) | معيارية (B2B) |
| ClearanceStatus header | "0" | "1" |
| الـ Response يحتوي clearedInvoice | ❌ لا | ✅ نعم (XML مُوقَّع من ZATCA) |
| الـ Status field | `reportingStatus` | `clearanceStatus` |
| القيم الممكنة | REPORTED / NOT_REPORTED | CLEARED / NOT_CLEARED |
| ZATCA يوقع الفاتورة | ❌ لا | ✅ نعم |
| Error 303 | لا يوجد | يظهر إذا ClearanceStatus = "0" |
| Error 208 | لا يوجد (409 بدلاً منه) | يظهر إذا الفاتورة مُرسلة مسبقاً |

### تحقق من:
- [ ] هل الـ Clearance API مُنفَّذ على endpoint `/invoices/clearance/single`؟
- [ ] هل `ClearanceStatus: "1"` يُرسل في الـ header؟
- [ ] **مهم جداً:** هل الـ `clearedInvoice` من الـ response يُحفظ ويُستخدم بدلاً من الـ XML الأصلي؟ (ZATCA يُعيد XML مُوقَّع بختمه — هذا هو الـ XML الرسمي)
- [ ] هل الـ 202 (CLEARED with warnings) يُعتبر نجاح؟
- [ ] هل الـ 208 (Already Reported) يُعالَج كـ idempotent success؟
- [ ] هل الـ 303 (See Other) يُعالَج بتوجيه الفاتورة لـ Reporting endpoint تلقائياً؟
- [ ] هل يُفرَّق بين `clearanceStatus` (CLEARED/NOT_CLEARED) و `reportingStatus` (REPORTED/NOT_REPORTED)؟
- [ ] هل buyer identification (BT-46) يُضمَّن في XML الفاتورة المعيارية؟ (مطلوب إذا المشتري غير مسجل ضريبياً — BR-KSA-14)
- [ ] هل `cac:Delivery` block موجود في الفاتورة المعيارية مع `ActualDeliveryDate`؟

---

## Phase 7 — مراجعة شاملة للتدفق الكامل (End-to-End Flow)

### التدفق الصحيح حسب المواصفات:

```
1. CSR Generation (محلياً — secp256k1 key pair)
       ↓
2. POST /compliance → CCSID + secret + requestID
       ↓
3. POST /compliance/invoices × 6 أنواع (simplified + standard × invoice/credit/debit)
   (Authorization = Compliance Certificate)
       ↓
4. POST /production/csids → PCSID + secret
   (Authorization = Compliance Certificate, body = compliance_request_id)
       ↓
5. POST /invoices/reporting/single (للفواتير المبسطة — B2C)
   (Authorization = Production Certificate, ClearanceStatus = "0")
       ↓
6. POST /invoices/clearance/single (للفواتير المعيارية — B2B)
   (Authorization = Production Certificate, ClearanceStatus = "1")
   ← يجب حفظ clearedInvoice من الـ response كـ XML الرسمي
       ↓
7. PATCH /production/csids (عند انتهاء الصلاحية — كل 5 سنوات)
   (Authorization = Current Production Certificate, OTP from Fatoora Portal)
```

### تحقق من:
- [ ] هل التدفق مُنفَّذ بهذا الترتيب؟
- [ ] هل الخطوة 3 (compliance invoices) تُرسل **6 أنواع** فواتير اختبارية؟
- [ ] هل يوجد فصل واضح بين credentials الـ Compliance و credentials الـ Production؟
- [ ] هل Multi-tenant: كل organization تحصل على CSID خاص بها؟
- [ ] هل يوجد state machine واضح لحالة الـ onboarding per-org؟
- [ ] هل يوجد logic يحدد هل الفاتورة تذهب لـ Reporting أو Clearance بناءً على `InvoiceTypeCode name` (01=standard→clearance, 02=simplified→reporting)؟
- [ ] هل الـ `clearedInvoice` يُحفظ في DB بعد clearance ناجح؟

---

## Phase 8 — فحص الأمان والتشفير

### تحقق من:
- [ ] هل `binarySecurityToken` و `secret` مُشفَّران في DB (ليس plain text)؟
- [ ] هل `ZATCA_DEVICE_ENCRYPTION_KEY` مُستخدم فعلاً في التشفير/فك التشفير؟
- [ ] هل الـ private key لـ CSR مُشفَّر أيضاً؟
- [ ] هل الـ Authorization header يُبنى بشكل صحيح: `Basic ${Buffer.from(cert + ':' + secret).toString('base64')}`؟
- [ ] هل الـ OTP لا يُخزَّن في DB (يُستخدم مرة واحدة فقط)؟
- [ ] هل الـ API calls تذهب للـ URL الصحيح (sandbox vs production) حسب الـ environment؟

---

## Phase 9 — فحص UBL 2.1 XML

### حسب المواصفات، الـ XML يُتحقق منه ضد:
1. **UBL 2.1 XSD** — هيكل XML صحيح
2. **EN 16931** — قواعد أوروبية (BR-CO-17 مثلاً: tax amount = taxable × rate / 100)
3. **KSA Rules** — قواعد سعودية تُلغي EN 16931 عند التعارض

### قواعد KSA المذكورة في التوثيق:
- **BR-KSA-06**: InvoiceTypeCode name must be NNPNESB format (01/02 + 5 flags)
- **BR-KSA-09**: Seller address must have: additional number, street, building, postal, city, neighborhood, country
- **BR-KSA-14**: Buyer identification (BT-46) required if buyer is not VAT registered — scheme IDs: TIN, CRN, MOM, MLS, 700, SAG, NAT, GCC, IQA, PAS, OTH
- **BR-KSA-37**: Building number must be exactly 4 digits
- **BR-KSA-51**: Line amount with VAT (KSA-12) = line net amount (BT-131) + line VAT (KSA-11)
- **BR-KSA-98**: Simplified invoice must be submitted within 24 hours
- **BR-KSA-F-06-C17**: Invoice line identifier (BT-126) must be 1-6 characters

### تحقق من:
- [ ] هل الـ `InvoiceTypeCode name` يتبع الصيغة الصحيحة (0200000 للمبسطة، 0100000 للمعيارية)؟
- [ ] هل عنوان البائع يحتوي على كل الحقول المطلوبة (7 حقول)؟
- [ ] هل `BuildingNumber` بالضبط 4 أرقام؟
- [ ] هل الـ XML يشمل: UBLExtensions (signature)، ProfileID، ICV، PIH، QR؟
- [ ] هل optional fields إذا موجودة (tag present) تحتوي على قيم صحيحة (ليست فارغة)؟
- [ ] هل الـ `cac:Signature` block موجود ويشير لـ `urn:oasis:names:specification:ubl:dsig:enveloped:xades`؟

---

## Phase 10 — إصلاح المشاكل

بعد اكتمال المراجعة، أصلح أي مشاكل مكتشفة. لكل إصلاح:
1. اذكر المشكلة بوضوح
2. اذكر الملف والسطر
3. اعرض الكود القديم والجديد
4. تأكد أن الإصلاح لا يكسر وظائف أخرى

---

## Phase 11 — كتابة التقرير النهائي

اكتب تقرير بالعربية يشمل:

### 1. ملخص النتائج
| الـ API | الحالة | الملاحظات |
|---------|--------|---------|
| Compliance CSID | ✅/⚠️/❌ | ... |
| Compliance Invoice | ✅/⚠️/❌ | ... |
| Production CSID (Onboarding) | ✅/⚠️/❌ | ... |
| Production CSID (Renewal) | ✅/⚠️/❌ | ... |
| Reporting (Simplified/B2C) | ✅/⚠️/❌ | ... |
| Clearance (Standard/B2B) | ✅/⚠️/❌ | ... |

### 2. المشاكل المكتشفة والإصلاحات
### 3. التحذيرات والملاحظات
### 4. ما ينقص للإنتاج (Production readiness)

---

## قائمة الملفات الممنوع تعديلها (Red List)
- `packages/database/prisma/schema.prisma` — لا تعدّل الـ schema بدون إذن صريح
- `packages/api/orpc/router.ts` — لا تضف routes جديدة
- `packages/i18n/translations/ar.json` — لا تعدّل الترجمات (فقط اقرأ)
- `packages/auth/` — لا تعدّل نظام المصادقة
- أي ملف محاسبي (`auto-journal.ts`, `accounting.ts`)

## التحقق النهائي
```bash
npx tsc --noEmit --pretty
```

---

## ملاحظات مهمة

1. **الـ Base URL:** في الـ Sandbox هو `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal`. في الإنتاج سيختلف — تأكد أن الـ URL قابل للتكوين عبر env variable.

2. **AcceptVersion:** التوثيق يذكر `V2` في كل الـ APIs — تأكد أنه يُرسل دائماً.

3. **الفرق بين Reporting و Clearance:**
   - Reporting = الفواتير المبسطة (B2C) — ClearanceStatus: "0" — الـ response يحتوي `reportingStatus`
   - Clearance = الفواتير المعيارية (B2B) — ClearanceStatus: "1" — الـ response يحتوي `clearanceStatus` + `clearedInvoice`
   - **مهم:** في Clearance، ZATCA يوقع الفاتورة ويُعيدها — يجب حفظ `clearedInvoice` كالنسخة الرسمية
   - حالياً Masar يستخدم simplified invoices بشكل أساسي → Reporting هو الأهم، لكن Clearance مطلوب للفواتير المعيارية

4. **الـ 409 Conflict (Reporting):** فاتورة أُبلغ عنها مسبقاً — يجب معالجتها كـ idempotent success، لا كخطأ.

5. **الـ 208 Already Reported (Clearance):** نفس المفهوم — الفاتورة أُرسلت للـ clearance مسبقاً.

6. **الـ 303 See Other (Clearance):** يظهر عند إرسال فاتورة معيارية مع `ClearanceStatus: "0"` — يجب التوجيه لـ Reporting أو تغيير الـ header.

7. **الـ 428 Precondition Required (في Renewal):** يُعيد شهادة compliance مع أخطاء — يعني الشهادة القديمة لا زالت صالحة لكن يجب إكمال الامتثال أولاً.

8. **Optional fields في UBL XSD:** إذا الـ tag موجود لكن القيمة فارغة أو غير صحيحة → يُنتج خطأ XSD. الحل: إما ضع قيمة صحيحة أو احذف الـ tag بالكامل.
