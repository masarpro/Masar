# ZATCA Phase 2 — Prompt 1/5: Schema & Database

## السياق

مسار منصة SaaS لإدارة مشاريع المقاولات. Phase 1 من ZATCA (QR code بسيط) مُنفّذ. نحتاج إضافة Phase 2 (ربط مباشر مع زاتكا). هذا الملف يضيف الحقول والنماذج المطلوبة في قاعدة البيانات.

---

## 🔴 القائمة الحمراء — لا تلمس

- `packages/api/modules/quantities/engines/structural-calculations.ts`
- `packages/api/modules/quantities/engines/derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/structural-calculations.ts`
- `packages/database/prisma/zod/index.ts` (auto-generated)
- لا تحذف أي حقول موجودة في Schema — إضافة فقط

---

## Phase 0: اقرأ أولاً (إجباري)

اقرأ هذه الملفات بالكامل قبل كتابة أي كود:

```bash
# 1. اقرأ schema الفوترة الحالي
find packages/database/prisma/schema -name "*.prisma" | head -20
cat packages/database/prisma/schema/finance.prisma

# 2. اقرأ schema المنظمات
cat packages/database/prisma/schema/organization.prisma

# 3. اقرأ ملفات ZATCA الحالية
ls packages/api/lib/zatca/
cat packages/api/lib/zatca/qr-generator.ts
cat packages/api/lib/zatca/tlv-encoder.ts

# 4. اقرأ enum الحالية
grep -n "enum.*{" packages/database/prisma/schema/*.prisma | head -30

# 5. اقرأ FinanceInvoice model بالكامل
grep -A 100 "model FinanceInvoice " packages/database/prisma/schema/finance.prisma

# 6. اقرأ Organization model
grep -A 80 "model Organization " packages/database/prisma/schema/organization.prisma

# 7. تحقق من الحقول الموجودة
grep -n "zatca" packages/database/prisma/schema/*.prisma
grep -n "qrCode\|qr_code" packages/database/prisma/schema/*.prisma
```

**⚠️ مهم جداً:** تأكد من أسماء الحقول الموجودة فعلياً (`zatcaUuid`, `zatcaHash`, `zatcaSignature`, `qrCode`) قبل الإضافة. لا تُنشئ حقول مكررة.

---

## Phase 1: إضافة Enums الجديدة

أضف هذه الـ enums في ملف `packages/database/prisma/schema/finance.prisma` (أو في ملف منفصل `zatca.prisma` إذا كان المشروع يستخدم ملفات schema منفصلة — تحقق من البنية أولاً):

```prisma
// حالة ربط المنظمة مع زاتكا
enum ZatcaIntegrationStatus {
  DISABLED          // المرحلة 1 فقط (QR بسيط) — الوضع الافتراضي
  ONBOARDING        // بدأ التسجيل، ينتظر OTP أو compliance
  COMPLIANCE        // حصل على Compliance CSID، يختبر
  ACTIVE            // Production CSID نشط — فواتير تُرسل لزاتكا
  EXPIRED           // الشهادة انتهت، تحتاج تجديد
  REVOKED           // ملغاة
}

// نوع الفاتورة حسب زاتكا
enum ZatcaInvoiceType {
  STANDARD          // فاتورة ضريبية B2B — تحتاج Clearance
  SIMPLIFIED        // فاتورة مبسّطة B2C — تحتاج Reporting فقط
}

// حالة إرسال الفاتورة لزاتكا
enum ZatcaSubmissionStatus {
  NOT_APPLICABLE    // المنظمة على Phase 1 فقط
  PENDING           // لم تُرسل بعد
  SUBMITTED         // أُرسلت، تنتظر الرد
  CLEARED           // زاتكا وافقت (B2B clearance)
  REPORTED          // زاتكا استلمت (B2C reporting)
  REJECTED          // زاتكا رفضت — تحتاج تصحيح
  FAILED            // خطأ تقني في الإرسال
}
```

---

## Phase 2: إنشاء نموذج ZatcaDevice

هذا النموذج يمثّل "الجهاز" (EGS Unit) — لكل منظمة قد يكون عندها أكثر من device (واحد لفواتير B2B وواحد لـ B2C):

```prisma
model ZatcaDevice {
  id                    String   @id @default(cuid())
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // --- بيانات التسجيل ---
  deviceName            String   @default("MASAR-EGS-001")   // معرّف الجهاز
  invoiceType           ZatcaInvoiceType                      // STANDARD أو SIMPLIFIED

  // --- الشهادة والمفاتيح (مشفّرة) ---
  csidCertificate       String?  @db.Text                     // Production CSID certificate (Base64)
  csidSecret            String?  @db.Text                     // CSID secret key (مشفّر)
  csidRequestId         String?                               // Request ID من زاتكا
  csidExpiresAt         DateTime?                             // تاريخ انتهاء الشهادة
  privateKey            String?  @db.Text                     // ECDSA private key (مشفّر)
  publicKey             String?  @db.Text                     // ECDSA public key

  // --- Compliance (مرحلة الاختبار) ---
  complianceCsid        String?  @db.Text                     // Compliance CSID (للاختبار)
  complianceSecret      String?  @db.Text                     // Compliance secret

  // --- عدّاد الفواتير وسلسلة Hash ---
  invoiceCounter        Int      @default(0)                  // عدّاد تراكمي
  previousInvoiceHash   String   @default("NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYmUxYjE3ZTExNzA5") // Base64 of SHA-256 of "0" — initial PIH per ZATCA spec

  // --- الحالة ---
  status                ZatcaIntegrationStatus @default(DISABLED)
  lastError             String?  @db.Text                     // آخر خطأ من زاتكا
  onboardedAt           DateTime?
  
  // --- Timestamps ---
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // --- العلاقات ---
  invoiceSubmissions    ZatcaSubmission[]

  @@unique([organizationId, invoiceType])
  @@index([organizationId])
  @@index([organizationId, status])
}
```

---

## Phase 3: إنشاء نموذج ZatcaSubmission

سجل لكل فاتورة أُرسلت لزاتكا:

```prisma
model ZatcaSubmission {
  id                    String   @id @default(cuid())
  organizationId        String
  
  // --- ربط بالفاتورة ---
  invoiceId             String
  invoice               FinanceInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  // --- ربط بالجهاز ---
  deviceId              String
  device                ZatcaDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  // --- بيانات الإرسال ---
  submissionType        String                                // "clearance" أو "reporting"
  invoiceHash           String                                // SHA-256 hash of XML
  xmlContent            String?  @db.Text                     // XML المُرسل (للأرشفة)
  signedXmlContent      String?  @db.Text                     // XML الموقّع

  // --- استجابة زاتكا ---
  status                ZatcaSubmissionStatus @default(PENDING)
  zatcaResponse         Json?                                 // الاستجابة الكاملة من زاتكا
  clearedXml            String?  @db.Text                     // XML المختوم من زاتكا (بعد Clearance)
  zatcaWarnings         Json?                                 // تحذيرات (لا تمنع القبول)
  zatcaErrors           Json?                                 // أخطاء (تمنع القبول)
  
  // --- محاولات ---
  attempts              Int      @default(1)
  lastAttemptAt         DateTime @default(now())

  // --- Timestamps ---
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([organizationId])
  @@index([invoiceId])
  @@index([status])
  @@index([organizationId, status])
}
```

---

## Phase 4: تعديل FinanceInvoice — إضافة حقول Phase 2

أضف هذه الحقول على نموذج `FinanceInvoice` الموجود. **لا تحذف أي حقول موجودة.** تحقق أولاً أن الحقل غير موجود:

```prisma
// أضف هذه الحقول إلى model FinanceInvoice (إذا لم تكن موجودة):

  // --- ZATCA Phase 2 ---
  zatcaInvoiceType      ZatcaInvoiceType?                     // STANDARD (B2B) أو SIMPLIFIED (B2C)
  zatcaSubmissionStatus ZatcaSubmissionStatus @default(NOT_APPLICABLE)
  zatcaCounterValue     Int?                                  // قيمة العدّاد وقت الإصدار
  zatcaPreviousHash     String?                               // PIH — hash الفاتورة السابقة
  zatcaXml              String?  @db.Text                     // UBL 2.1 XML المولّد
  zatcaClearedXml       String?  @db.Text                     // XML المختوم من زاتكا
  zatcaSubmittedAt      DateTime?                             // وقت الإرسال لزاتكا
  zatcaClearedAt        DateTime?                             // وقت القبول من زاتكا

  // --- العلاقة مع ZatcaSubmission ---
  zatcaSubmissions      ZatcaSubmission[]
```

**⚠️ تحقق:** الحقول `zatcaUuid`, `zatcaHash`, `zatcaSignature`, `qrCode` يجب أن تكون موجودة بالفعل. لا تُضفها مرة ثانية.

أضف index:
```prisma
  @@index([organizationId, zatcaSubmissionStatus])
```

---

## Phase 5: إضافة علاقة في Organization

أضف علاقة `zatcaDevices` في model `Organization`:

```prisma
  // أضف داخل model Organization:
  zatcaDevices          ZatcaDevice[]
```

---

## Phase 6: تشغيل Migration

```bash
# 1. ولّد Prisma Client
cd packages/database
pnpm generate

# 2. شغّل fix-zod-decimal بعد generate
node prisma/fix-zod-decimal.mjs

# 3. ادفع التغييرات للقاعدة (development)
pnpm push

# 4. تحقق من TypeScript
cd ../..
npx tsc --noEmit --pretty
```

**⚠️ بعد `pnpm generate`:** لازم تشغّل `fix-zod-decimal.mjs` عشان يصلّح `z.instanceof(Prisma.Decimal)` patterns في الملف المولّد.

---

## Phase 7: إضافة Environment Variables

أضف في `.env.local.example`:

```env
# ZATCA E-Invoicing Phase 2
ZATCA_ENVIRONMENT=sandbox                    # sandbox | simulation | production
ZATCA_API_BASE_URL=https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
ZATCA_DEVICE_ENCRYPTION_KEY=                 # AES-256 key لتشفير المفاتيح الخاصة في DB
```

**ملاحظة:** `ZATCA_DEVICE_ENCRYPTION_KEY` يُستخدم لتشفير `privateKey` و `csidSecret` قبل التخزين. لا نخزّن مفاتيح خاصة بـ plaintext أبداً.

---

## التحقق النهائي

```bash
npx tsc --noEmit --pretty
# يجب أن ينجح بدون أخطاء

# تحقق من وجود النماذج الجديدة
grep "model ZatcaDevice" packages/database/prisma/schema/*.prisma
grep "model ZatcaSubmission" packages/database/prisma/schema/*.prisma
grep "ZatcaIntegrationStatus" packages/database/prisma/schema/*.prisma
```
