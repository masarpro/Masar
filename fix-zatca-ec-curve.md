# إصلاح منحنى التشفير في ZATCA CSR — secp256k1 → prime256v1 (P-256)

## المشكلة

عملية `startOnboarding` تفشل مع ZATCA Sandbox بخطأ `400 Invalid Request`.

**السبب الجذري:** الـ CSR يُولَّد باستخدام منحنى `secp256k1` (OID 1.3.132.0.10 — منحنى Bitcoin) بينما مواصفات ZATCA Security Features Implementation Standards v1.2 (القسم 2.2.2) تنص صراحة على:

```
SubjectPublicKeyInfo: Public Key, Key length: P-256
```

المطلوب هو `prime256v1` (P-256 / secp256r1) — OID 1.2.840.10045.3.1.7

**الدليل من اللوج:**
```
CSR PEM يحتوي على:
BgUrgQQACg = OID 1.3.132.0.10 = secp256k1 ❌
```

---

## Phase 0 — قراءة الملفات (إلزامي قبل أي تعديل)

اقرأ هذه الملفات بالكامل قبل كتابة أي كود:

```bash
# 1. ابحث عن كل ملفات ZATCA
find packages/api -path "*zatca*" -type f | head -30
find packages/api -path "*csr*" -o -path "*certificate*" -o -path "*onboarding*" | grep -i zatca | head -20

# 2. ابحث عن secp256k1 في المشروع بالكامل
grep -rn "secp256k1" packages/ --include="*.ts" --include="*.js"
grep -rn "namedCurve" packages/ --include="*.ts" --include="*.js"
grep -rn "generateKeyPair" packages/ --include="*.ts" --include="*.js"
grep -rn "createPrivateKey\|createPublicKey\|generateKey" packages/ --include="*.ts" --include="*.js" | grep -i ec

# 3. ابحث عن CSR generation
grep -rn "PKCS10\|CSR\|CertificateSigningRequest\|createSign\|pkcs10" packages/ --include="*.ts" --include="*.js"

# 4. ابحث عن startOnboarding endpoint
grep -rn "startOnboarding\|start-onboarding\|compliance" packages/api --include="*.ts" -l

# 5. اقرأ ملف الـ router الخاص بـ ZATCA
# (الملف الذي يحتوي على startOnboarding)
```

بعد تحديد الملفات المعنية، اقرأ كل واحد منها بالكامل.

---

## Phase 1 — إصلاح منحنى التشفير

### 1.1 تغيير EC Curve

في الملف الذي يولّد الـ key pair (غالباً في `packages/api/lib/zatca/` أو مشابه):

**ابحث عن أي من هذه الأنماط وغيّرها:**

```typescript
// ❌ أي من هذه الأنماط خاطئ:
namedCurve: 'secp256k1'
namedCurve: "secp256k1"
'secp256k1'

// ✅ استبدل بـ:
namedCurve: 'prime256v1'
```

**تحقق أيضاً من:**
- إذا كان يستخدم `crypto.generateKeyPairSync('ec', ...)` — غيّر `namedCurve`
- إذا كان يستخدم `elliptic` library — غيّر `new EC('secp256k1')` إلى `new EC('p256')`
- إذا كان يستخدم `@noble/curves` — غيّر من `secp256k1` إلى `p256`
- إذا كان يستخدم `node-forge` — غيّر الـ curve name

### 1.2 تحقق من Signature Algorithm

المتطلبات الرسمية (ZATCA Security Features v1.2, Requirement 16):
- **Hashing:** SHA-256
- **Asymmetric key:** ECDSA
- **Key length:** 256 (P-256)

تأكد أن الـ signature algorithm في الـ CSR هو `SHA256withECDSA` وليس شيء آخر.

### 1.3 تحقق من CSR Extensions

الـ CSR يجب أن يحتوي على هذه الحقول في الـ Subject (حسب القسم 2.2.2 من المواصفة):

| CSR Field | OID / x509 Field | القيمة |
|-----------|-----------------|--------|
| Common Name | CN | اسم الجهاز أو رقم الأصل |
| Organization Identifier | 2.5.4.97 | الرقم الضريبي (15 رقم، يبدأ وينتهي بـ 3) |
| Organization Unit | OU | اسم الفرع |
| Organization Name | O | اسم الشركة |
| Country | C | SA |
| Invoice Type | businessCategory (2.5.4.15) | مثل: 1100 (Standard + Simplified) |
| Location | registeredAddress (2.5.4.26) | عنوان الفرع |
| Industry | businessCategory (2.5.4.15) | القطاع |
| EGS Serial Number | SAN (GUID) | بصيغة: `1-Masar|2-001|3-{serialNumber}` |

---

## Phase 2 — تحقق من إرسال الـ CSR

### 2.1 صيغة الإرسال لـ ZATCA API

تأكد أن الـ CSR يُرسل **بدون** PEM headers:

```typescript
// ❌ خطأ — يحتوي على headers
const csrBase64 = Buffer.from(csrPem).toString('base64');
// هذا يعمل base64 على النص الكامل بما فيه "-----BEGIN CERTIFICATE REQUEST-----"

// ✅ صحيح — استخرج المحتوى فقط ثم أرسله
const csrContent = csrPem
  .replace('-----BEGIN CERTIFICATE REQUEST-----', '')
  .replace('-----END CERTIFICATE REQUEST-----', '')
  .replace(/\r?\n/g, '');
// csrContent الآن هو Base64 نقي بدون headers ولا newlines
```

**تحقق من اللوج:**
```
[ZATCA] Has PEM header: false   ← هذا جيد
[ZATCA] Has newlines: false     ← هذا جيد
```

يبدو أن إزالة الـ headers تتم بشكل صحيح. المشكلة فقط في المنحنى.

### 2.2 ZATCA Compliance API

تأكد أن الـ request body صحيح:

```typescript
const response = await fetch(ZATCA_COMPLIANCE_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'OTP': otp,              // ← OTP من بوابة ZATCA
    'Accept-Version': 'V2',  // ← تأكد من وجود هذا الـ header
  },
  body: JSON.stringify({
    csr: csrBase64Content,   // ← بدون PEM headers
  }),
});
```

**تحقق من وجود `Accept-Version: V2`** — بعض implementations تنساه.

---

## Phase 3 — اختبار

### 3.1 تحقق من CSR بعد الإصلاح

أضف هذا اللوج المؤقت بعد توليد الـ CSR:

```typescript
// DEBUG — احذف بعد التأكد
const csrDer = Buffer.from(csrBase64Content, 'base64');
// OID for prime256v1: 06 08 2a 86 48 ce 3d 03 01 07
const p256OID = Buffer.from([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]);
const hasP256 = csrDer.includes(p256OID);
console.log('[ZATCA DEBUG] CSR uses P-256 (prime256v1):', hasP256);

// OID for secp256k1: 06 05 2b 81 04 00 0a
const k1OID = Buffer.from([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a]);
const hasK1 = csrDer.includes(k1OID);
console.log('[ZATCA DEBUG] CSR uses secp256k1 (WRONG):', hasK1);

if (hasK1) throw new Error('CSR still using secp256k1! Fix the curve.');
if (!hasP256) throw new Error('CSR does not contain P-256 OID!');
```

### 3.2 TypeScript Check

```bash
npx tsc --noEmit --pretty
```

---

## قائمة أحمر — لا تلمس هذه الملفات

- `packages/database/prisma/schema.prisma`
- `packages/api/lib/zatca/tlv-encoder.ts` (Phase 1 QR — يعمل)
- `packages/api/lib/zatca/qr-generator.ts` (Phase 1 QR — يعمل)
- `packages/api/lib/zatca/qr-image.ts` (Phase 1 QR — يعمل)
- `packages/i18n/translations/ar.json`
- `packages/i18n/translations/en.json`

---

## ملخص التغييرات المتوقعة

| الملف | التغيير |
|-------|---------|
| ملف توليد Key Pair | `secp256k1` → `prime256v1` |
| ملف توليد CSR (إذا منفصل) | تأكد أن الـ curve صحيح |
| ملف startOnboarding | إضافة `Accept-Version: V2` header إذا مفقود |
| ملف startOnboarding | إضافة debug log مؤقت للتحقق من OID |

---

## التحقق النهائي

```bash
npx tsc --noEmit --pretty
```

ثم اختبر يدوياً من الواجهة: إعدادات ZATCA → بدء التسجيل مع OTP: `123456` (Sandbox)

**النتيجة المتوقعة:** استجابة 200 من ZATCA مع Compliance CSID بدلاً من 400 Invalid Request.
