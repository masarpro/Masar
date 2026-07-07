# 📋 Prompt شامل: نظام المستخلصات والدفعات المتكامل في مسار
**النسخة:** v2 — مُصحَّح بناءً على تقرير التوافق (2026-03-04)
**المرجع:** دراسة نظم (Nodhom) + شمول ERP + Procore + Viewpoint + PROJECT_REPORT.md

---

## أولاً: الفهم المفاهيمي — المستخلص vs الدفعة

قبل البدء، يجب أن يفهم Claude Code الفرق الجوهري:

```
المستخلص (Claim / Progress Certificate)
═══════════════════════════════════════
هو وثيقة تثبت إنجاز عمل وتطلب مقابله
مثل: "أنجزنا 40% من البند، نطالب بـ 200,000 ريال"
الطرف المُرسل: المقاول يرسل للعميل / مقاول الباطن يرسل للمقاول
الحالات: مسودة → مقدم → معتمد → مدفوع جزئياً → مدفوع كلياً

الدفعة (Payment)
═══════════════════════════════════════
هو تحويل مال فعلي بعد اعتماد المستخلص
مثل: "دفعنا 180,000 ريال (بعد خصم 10% استقطاع)"
يمكن أن تكون الدفعة جزئية (دفع 50% من المستخلص)
يمكن أن يكون للمستخلص الواحد دفعات متعددة

العلاقة:
المستخلص 1 ──→ اعتمد ──→ دفعة 1 (100,000) + دفعة 2 (80,000) = تسوية كاملة

النوعان في مسار:
1. مستخلص العميل (Client Claim): المقاول يرسل للعميل/المالك
2. مستخلص الباطن (Subcontract Claim): مقاول الباطن يرسل للمقاول
```

---

## ثانياً: تعليمات عامة لـ Claude Code

```
اقرأ هذا الملف بالكامل قبل كتابة أي سطر كود.
اتبع هذه الأولويات:

1. افحص الكود الموجود أولاً:
   - packages/database/prisma/schema.prisma
   - apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/
   - packages/api/orpc/  ← هنا توجد جميع الـ procedures (وليس src/procedures/)
   - packages/api/orpc/router.ts  ← الـ Router الرئيسي
   - packages/api/orpc/procedures.ts  ← إشارات الـ procedures

2. اتبع الأنماط الموجودة:
   - ORPC procedures (protected procedure)
   - organizationId isolation في كل query
   - Decimal لكل الحقول المالية
   - next-intl للترجمة (ar/en)
   - shadcn/ui components
   - React Query للـ cache invalidation

3. لا تكسر الكود الموجود — أضف فقط، لا تحذف

4. كل batch لا يتجاوز 800 سطر (قيد Claude Code)
```

---

## المرحلة الأولى: قاعدة البيانات والبنية التحتية

### الـ Prompt:

```
أنت تعمل على منصة مسار (Masar) — Next.js SaaS لإدارة مشاريع المقاولات.
Tech stack: Prisma 7 + PostgreSQL (Supabase) + ORPC + React Query + shadcn/ui + next-intl (ar/en)

المطلوب: تطوير نظام مستخلصات متكامل من الدرجة العالمية.

═══════════════════════════════════════════════════════
الخطوة 1: افحص الكود الموجود
═══════════════════════════════════════════════════════

افحص أولاً:
- packages/database/prisma/schema.prisma
  → ابحث عن: ProjectClaim, SubcontractContract, SubcontractPayment
- packages/api/orpc/  ← (وليس src/procedures/)
  → ابحث عن ملفات تخص subcontracts و finance
- apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/

ثم أخبرني بما وجدت في هذه الـ models قبل أي تعديل.

═══════════════════════════════════════════════════════
الخطوة 2: تحديث schema.prisma — إضافة models جديدة
═══════════════════════════════════════════════════════

أضف هذه الـ Models الجديدة إلى schema.prisma:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[A] تحديث SubcontractContract (أضف حقول جديدة)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// في model SubcontractContract — أضف هذه الحقول:
advancePaymentAmount    Decimal?    @db.Decimal(15,2)  // مبلغ الدفعة المقدمة
advancePaymentPercent   Decimal?    @db.Decimal(5,2)   // نسبة استرداد الدفعة من كل مستخلص
retentionReleasePercent Decimal?    @db.Decimal(5,2)   // نسبة الإفراج عن الاستقطاع عند الاستلام الابتدائي (عادة 50%)
retentionCapPercent     Decimal?    @db.Decimal(5,2)   // حد أقصى للاستقطاع (عادة 5% من قيمة العقد)
// Relations الجديدة:
items                   SubcontractItem[]
claims                  SubcontractClaim[]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[B] model جديد: SubcontractItem (بنود عقد الباطن)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
model SubcontractItem {
  id              String   @id @default(cuid())
  organizationId  String
  contractId      String
  contract        SubcontractContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  // تعريف البند
  itemCode        String?          // كود البند مثل 2-1-1
  description     String           // وصف البند
  descriptionEn   String?          // وصف بالإنجليزية
  unit            String           // وحدة القياس: م3، م2، طن، قطعة، LS
  
  // الكميات والأسعار
  contractQty     Decimal          @db.Decimal(15,3)  // الكمية في العقد
  unitPrice       Decimal          @db.Decimal(15,2)  // سعر الوحدة
  totalAmount     Decimal          @db.Decimal(15,2)  // محسوب: contractQty × unitPrice
  
  // ترتيب وتصنيف
  sortOrder       Int              @default(0)
  category        String?          // تصنيف: أعمال خرسانية، تشطيبات، كهرباء...
  isLumpSum       Boolean          @default(false)  // بند مقطوع (LS) لا يتتبع كميات
  
  // Audit
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  createdById     String
  // ⚠️ مهم: أضف اسماً صريحاً للـ relation لتجنب تعارض User model
  createdBy       User             @relation("SubcontractItemCreatedBy", fields: [createdById], references: [id])
  
  // Relations
  claimItems      SubcontractClaimItem[]
  
  @@index([contractId])
  @@index([organizationId])
}

// ⚠️ مهم: أضف هذه الـ reverse relations في User model:
// subcontractItemsCreated  SubcontractItem[] @relation("SubcontractItemCreatedBy")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[C] Enum جديد: SubcontractClaimStatus
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
enum SubcontractClaimStatus {
  DRAFT          // مسودة — لم ترسل بعد
  SUBMITTED      // مقدم — أرسله مقاول الباطن
  UNDER_REVIEW   // تحت المراجعة
  APPROVED       // معتمد — وافق عليه المقاول الرئيسي
  PARTIALLY_PAID // مدفوع جزئياً
  PAID           // مدفوع بالكامل
  REJECTED       // مرفوض مع سبب
  CANCELLED      // ملغى
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[D] model جديد: SubcontractClaim (المستخلص)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
model SubcontractClaim {
  id              String   @id @default(cuid())
  organizationId  String
  contractId      String
  contract        SubcontractContract @relation(fields: [contractId], references: [id])
  
  // تعريف المستخلص
  claimNo         Int              // رقم المستخلص: 1، 2، 3...
  title           String           // اسم المستخلص — مثل: "مستخلص خرسانة برج أكتوبر #2"
  periodStart     DateTime         // بداية الفترة
  periodEnd       DateTime         // نهاية الفترة
  submittedAt     DateTime?        // تاريخ التقديم
  approvedAt      DateTime?        // تاريخ الاعتماد
  dueDate         DateTime?        // تاريخ الاستحقاق
  
  // الحالة
  status          SubcontractClaimStatus @default(DRAFT)
  rejectionReason String?          // سبب الرفض
  notes           String?
  
  // المبالغ (كلها محسوبة — لا تُدخل يدوياً)
  grossAmount          Decimal @db.Decimal(15,2) @default(0) // إجمالي المستخلص قبل الخصومات
  retentionAmount      Decimal @db.Decimal(15,2) @default(0) // خصم الاستقطاع
  advanceDeduction     Decimal @db.Decimal(15,2) @default(0) // خصم استرداد الدفعة المقدمة
  vatAmount            Decimal @db.Decimal(15,2) @default(0) // ضريبة القيمة المضافة
  netAmount            Decimal @db.Decimal(15,2) @default(0) // صافي المستحق
  paidAmount           Decimal @db.Decimal(15,2) @default(0) // المدفوع فعلياً (من الدفعات)
  
  // نوع المستخلص
  claimType       SubcontractClaimType @default(INTERIM)
  
  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdById     String
  // ⚠️ مهم: أسماء صريحة للـ relations لتجنب تعارض User model
  createdBy       User @relation("SubcontractClaimCreatedBy", fields: [createdById], references: [id])
  approvedById    String?
  approvedBy      User? @relation("SubcontractClaimApprovedBy", fields: [approvedById], references: [id])
  
  // Relations
  items           SubcontractClaimItem[]
  payments        SubcontractPayment[]   // استخدام SubcontractPayment الموجود مع claimId
  
  @@unique([contractId, claimNo])
  @@index([organizationId])
  @@index([contractId])
  @@index([status])
}

// ⚠️ مهم: أضف هذه الـ reverse relations في User model:
// subcontractClaimsCreated   SubcontractClaim[] @relation("SubcontractClaimCreatedBy")
// subcontractClaimsApproved  SubcontractClaim[] @relation("SubcontractClaimApprovedBy")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[E] Enum جديد: SubcontractClaimType
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
enum SubcontractClaimType {
  INTERIM       // مستخلص جاري (دوري)
  FINAL         // مستخلص ختامي
  RETENTION     // إفراج عن استقطاع
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[F] model جديد: SubcontractClaimItem (بنود المستخلص)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
model SubcontractClaimItem {
  id              String   @id @default(cuid())
  organizationId  String
  claimId         String
  claim           SubcontractClaim @relation(fields: [claimId], references: [id], onDelete: Cascade)
  contractItemId  String
  contractItem    SubcontractItem @relation(fields: [contractItemId], references: [id])
  
  // الكميات — هذا هو قلب النظام
  contractQty     Decimal @db.Decimal(15,3)  // كمية العقد (منسوخة للمرجع)
  unitPrice       Decimal @db.Decimal(15,2)  // سعر الوحدة (منسوخ للمرجع)
  
  prevCumulativeQty  Decimal @db.Decimal(15,3) @default(0) // مجموع المستخلصات السابقة المعتمدة
  thisQty            Decimal @db.Decimal(15,3) @default(0) // كمية هذا المستخلص
  // cumulativeQty = prevCumulativeQty + thisQty (محسوب في الكود)
  // remainingQty = contractQty - cumulativeQty (محسوب في الكود)
  // completionPercent = cumulativeQty / contractQty × 100 (محسوب)
  
  // المبالغ
  thisAmount      Decimal @db.Decimal(15,2) @default(0) // thisQty × unitPrice
  
  // Audit (مطلوب)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([claimId, contractItemId])
  @@index([claimId])
  @@index([contractItemId])
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[G] تحديث SubcontractPayment (ربط بالمستخلص)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// في model SubcontractPayment — أضف:
claimId         String?
claim           SubcontractClaim? @relation(fields: [claimId], references: [id])
description     String?  // ملاحظة على الدفعة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[H] تحديث ProjectClaim (المستخلص للعميل)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// في model ProjectClaim — أضف هذه الحقول:
retentionAmount    Decimal @db.Decimal(15,2) @default(0)
vatAmount          Decimal @db.Decimal(15,2) @default(0)
netAmount          Decimal @db.Decimal(15,2) @default(0)
paidAmount         Decimal @db.Decimal(15,2) @default(0)
claimType          ClientClaimType @default(INTERIM)
// Relations:
items              ProjectClaimItem[]
payments           ProjectClaimPayment[]   // ← model جديد (انظر [H2] أدناه)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[H2] model جديد: ProjectClaimPayment (دفعات المستخلص للعميل)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️ مهم: لا يوجد model اسمه ProjectPayment في مسار
// أنشئ هذا الـ model الجديد بدلاً منه:
model ProjectClaimPayment {
  id              String   @id @default(cuid())
  organizationId  String
  claimId         String
  claim           ProjectClaim @relation(fields: [claimId], references: [id], onDelete: Cascade)

  amount          Decimal  @db.Decimal(15,2)
  date            DateTime
  paymentMethod   PaymentMethod
  sourceAccountId String?  // → OrganizationBank (اختياري)
  note            String?

  createdById     String
  createdBy       User @relation("ProjectClaimPaymentCreatedBy", fields: [createdById], references: [id])
  createdAt       DateTime @default(now())

  @@index([claimId])
  @@index([organizationId])
}

// ⚠️ مهم: أضف في User model:
// projectClaimPaymentsCreated  ProjectClaimPayment[] @relation("ProjectClaimPaymentCreatedBy")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[I] Enum: ClientClaimType
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
enum ClientClaimType {
  INTERIM    // جاري
  FINAL      // ختامي
  RETENTION  // إفراج استقطاع
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[J] model جديد: ProjectContractItem (بنود العقد مع العميل)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
model ProjectContractItem {
  id              String   @id @default(cuid())
  organizationId  String
  contractId      String
  contract        ProjectContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  itemCode        String?
  description     String
  descriptionEn   String?
  unit            String
  contractQty     Decimal @db.Decimal(15,3)
  unitPrice       Decimal @db.Decimal(15,2)
  totalAmount     Decimal @db.Decimal(15,2)
  sortOrder       Int @default(0)
  isLumpSum       Boolean @default(false)
  
  createdAt       DateTime @default(now())
  createdById     String
  // ⚠️ مهم: اسم صريح للـ relation
  createdBy       User @relation("ProjectContractItemCreatedBy", fields: [createdById], references: [id])
  
  claimItems      ProjectClaimItem[]
  
  @@index([contractId])
  @@index([organizationId])
}

// ⚠️ مهم: أضف في User model:
// projectContractItemsCreated  ProjectContractItem[] @relation("ProjectContractItemCreatedBy")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[K] model جديد: ProjectClaimItem (بنود المستخلص للعميل)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
model ProjectClaimItem {
  id                   String   @id @default(cuid())
  organizationId       String
  claimId              String
  claim                ProjectClaim @relation(fields: [claimId], references: [id], onDelete: Cascade)
  contractItemId       String
  contractItem         ProjectContractItem @relation(fields: [contractItemId], references: [id])
  
  contractQty          Decimal @db.Decimal(15,3)
  unitPrice            Decimal @db.Decimal(15,2)
  prevCumulativeQty    Decimal @db.Decimal(15,3) @default(0)
  thisQty              Decimal @db.Decimal(15,3) @default(0)
  thisAmount           Decimal @db.Decimal(15,2) @default(0)
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  @@unique([claimId, contractItemId])
  @@index([claimId])
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[L] تحديث ProjectContract
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// في model ProjectContract — أضف:
advancePaymentAmount   Decimal? @db.Decimal(15,2)
advancePaymentPercent  Decimal? @db.Decimal(5,2)
items                  ProjectContractItem[]

بعد كتابة جميع التغييرات في schema.prisma، شغّل:
// ⚠️ مهم: استخدم الأوامر الصحيحة للـ monorepo:
pnpm --filter database db:push
// ثم:
pnpm --filter database generate
// ملاحظة: fix-zod-decimal.mjs سيعمل تلقائياً (postgenerate script في package.json)
// لا تستخدم npx prisma db push — سيستخدم نسخة Prisma خاطئة
```

---

## المرحلة الثانية: طبقة API — ORPC Procedures

### الـ Prompt:

```
الآن أنشئ ORPC procedures لنظام المستخلصات في مسار.
راجع أولاً: packages/api/orpc/  ← (لا يوجد src/procedures/)
ابحث عن الملف الذي يخدم subcontracts لفهم النمط المتبع.

⚠️ مهم جداً — بنية الملفات:
- كل procedures توجد في: packages/api/orpc/
- الـ Router الرئيسي: packages/api/orpc/router.ts
- لا يوجد src/index.ts أو src/procedures/ في هذا المشروع

═══════════════════════════════════════════════════════
FILE 1: packages/api/orpc/subcontract-items.ts  ← (المسار الصحيح)
═══════════════════════════════════════════════════════
أنشئ procedures التالية (اتبع نمط ORPC الموجود):

export const subcontractItemsProcedures = {

  // جلب بنود العقد
  list: protectedProcedure
    .input(z.object({ contractId: z.string() }))
    .handler(async ({ input, context }) => {
      // تحقق من membership في organization
      // تحقق أن العقد يخص هذه الـ organization
      // جلب البنود مرتبة بـ sortOrder
      // لكل بند احسب: totalCumulativeQty (من كل المستخلصات المعتمدة), remainingQty, completionPercent
      return items with computed fields
    }),

  // إضافة بند
  create: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      itemCode: z.string().optional(),
      description: z.string().min(1),
      descriptionEn: z.string().optional(),
      unit: z.string().min(1),
      contractQty: z.number().positive(),
      unitPrice: z.number().positive(),
      sortOrder: z.number().optional(),
      category: z.string().optional(),
      isLumpSum: z.boolean().default(false),
    }))
    .handler(...),

  // تحديث بند
  update: protectedProcedure...

  // حذف بند (فقط إذا لم تكن له مستخلصات)
  delete: protectedProcedure
    .handler(async ({ input, context }) => {
      // تحقق: هل البند مستخدم في أي مستخلص؟
      // إذا نعم: ارفض الحذف مع رسالة واضحة
    }),

  // نسخ البنود من عقد آخر
  copyFromContract: protectedProcedure
    .input(z.object({ sourceContractId: z.string(), targetContractId: z.string() }))
    .handler(...),
}

═══════════════════════════════════════════════════════
FILE 2: packages/api/orpc/subcontract-claims.ts  ← (المسار الصحيح)
═══════════════════════════════════════════════════════

أنشئ procedures التالية:

export const subcontractClaimsProcedures = {

  // قائمة المستخلصات
  list: protectedProcedure
    .input(z.object({
      contractId: z.string().optional(),
      projectId: z.string().optional(),
      status: z.nativeEnum(SubcontractClaimStatus).optional(),
    }))
    .handler(async ({ input, context }) => {
      // جلب المستخلصات مع البيانات المحسوبة
      // لكل مستخلص: paidAmount (مجموع الدفعات المرتبطة)
      // outstanding = netAmount - paidAmount
    }),

  // تفاصيل مستخلص واحد
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      // جلب المستخلص مع items + payments
      // لكل item: احسب cumulativeQty, remainingQty, completionPercent
      // احسب summary: grossAmount, retentionAmount, advanceDeduction, vatAmount, netAmount
    }),

  // إنشاء مستخلص جديد
  create: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      title: z.string().min(1),
      periodStart: z.string(),  // ISO date
      periodEnd: z.string(),    // ISO date
      claimType: z.nativeEnum(SubcontractClaimType).default('INTERIM'),
      notes: z.string().optional(),
      items: z.array(z.object({
        contractItemId: z.string(),
        thisQty: z.number().min(0),
      })),
    }))
    .handler(async ({ input, context }) => {
      // 1. تحقق من الـ organization
      // 2. جلب العقد مع retentionPercent, advancePaymentPercent, vatPercent
      //
      // ⚠️ مهم — التحقق من المستخلصات المعلقة:
      // 3. تحقق: هل يوجد مستخلص بحالة SUBMITTED أو UNDER_REVIEW؟
      //    إذا نعم: ارفض الإنشاء (لا تمنع إنشاء مستخلص جديد إذا كان السابق APPROVED أو PAID)
      //    throw new Error('يوجد مستخلص بانتظار الاعتماد — اعتمده أو ارفضه أولاً')
      //    ← لاحظ: يُسمح بتعدد المستخلصات المعتمدة/المدفوعة لنفس العقد
      //
      // 4. لكل item: احسب prevCumulativeQty (مجموع كل المستخلصات السابقة بحالة APPROVED أو أعلى فقط)
      // 5. احسب thisAmount = thisQty × unitPrice
      // 6. احسب grossAmount = مجموع thisAmount
      // 7. احسب retentionAmount = grossAmount × retentionPercent / 100
      //    لكن تحقق: هل وصلنا للـ retentionCap؟ إذا نعم لا تخصم أكثر
      // 8. احسب advanceDeduction = grossAmount × advancePaymentPercent / 100
      //    لكن لا تتجاوز ما تبقى من الدفعة المقدمة غير المسترد
      // 9. احسب vatAmount = (grossAmount - retentionAmount - advanceDeduction) × vatPercent / 100
      // 10. احسب netAmount = grossAmount - retentionAmount - advanceDeduction + vatAmount
      // 11. تأكيد: thisQty لكل بند ≤ remainingQty (لا تتجاوز كمية العقد)
      // 12. claimNo = آخر claimNo + 1

      // في transaction واحدة: أنشئ Claim + ClaimItems
    }),

  // تحديث مستخلص (فقط في حالة DRAFT)
  update: protectedProcedure
    .handler(async ({ input, context }) => {
      // تحقق: status === DRAFT فقط
      // إعادة حساب كل المبالغ
    }),

  // تغيير الحالة
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(SubcontractClaimStatus),
      rejectionReason: z.string().optional(),
    }))
    .handler(async ({ input, context }) => {
      // Workflow المسموح به:
      // DRAFT → SUBMITTED (المقاول يقدم)
      // SUBMITTED → UNDER_REVIEW أو APPROVED أو REJECTED
      // UNDER_REVIEW → APPROVED أو REJECTED
      // APPROVED → PARTIALLY_PAID أو PAID (تلقائي من الدفعات)
      // REJECTED → DRAFT (إرجاع للتعديل)
    }),

  // حذف مستخلص (DRAFT فقط)
  delete: protectedProcedure...

  // ملخص مالي للعقد
  contractSummary: protectedProcedure
    .input(z.object({ contractId: z.string() }))
    .handler(async ({ input, context }) => {
      return {
        contractValue: number,
        totalClaimed: number,
        totalNetClaimed: number,
        totalPaid: number,
        totalRetentionHeld: number,
        totalAdvanceRecovered: number,
        totalOutstanding: number,
        completionPercent: number,
        remainingContractValue: number,
      }
    }),

  // إضافة دفعة على مستخلص
  addPayment: protectedProcedure
    .input(z.object({
      claimId: z.string(),
      amount: z.number().positive(),
      date: z.string(),
      paymentMethod: z.nativeEnum(PaymentMethod),
      sourceAccountId: z.string().optional(),
      description: z.string().optional(),
    }))
    .handler(async ({ input, context }) => {
      // 1. جلب المستخلص مع netAmount و paidAmount
      // 2. تحقق: amount ≤ (netAmount - paidAmount)
      // 3. أنشئ SubcontractPayment مع claimId
      // 4. حدّث paidAmount على المستخلص
      // 5. إذا paidAmount >= netAmount: غيّر status إلى PAID
      //    إذا paidAmount > 0 و < netAmount: غيّر إلى PARTIALLY_PAID
      // في transaction واحدة
    }),
}

═══════════════════════════════════════════════════════
تحديث projectFinance router (لا تنشئ ملفاً جديداً)
═══════════════════════════════════════════════════════

// ⚠️ مهم: مسار لديه بالفعل projectFinance router يحتوي على:
//   projectFinance.listClaims, createClaim, updateClaim, updateClaimStatus, deleteClaim
// لا تنشئ ملف project-claims.ts منفصلاً — ستحدث ازدواجية

// بدلاً من ذلك: ابحث عن الملف الذي يخدم projectFinance وأضف إليه:
projectContractItems: {
  list, create, update, delete, bulkImport
}

// حدّث الـ procedures الموجودة لـ ProjectClaim:
// - حدّث create ليقبل items[] كما في subcontract-claims
// - حدّث get ليجلب items مع حسابات تراكمية
// - أضف: summary (ملخص مالي للمشروع)
// - أضف: addPaymentReceived (تسجيل دفعة من العميل — يُنشئ ProjectClaimPayment)

═══════════════════════════════════════════════════════
تحديث packages/api/orpc/router.ts  ← (المسار الصحيح)
═══════════════════════════════════════════════════════

// ⚠️ مهم: الملف الصحيح هو router.ts وليس src/index.ts
// أضف الـ procedures الجديدة ضمن subcontracts router الموجود (nested):

// في router.ts، عدّل subcontracts router ليصبح:
subcontracts: os.router({
  // الـ procedures الموجودة (list, get, create, update, delete, ...)
  ...existingSubcontractsProcedures,
  // الجديد — nested:
  items: subcontractItemsProcedures,    // subcontracts.items.list, .create, ...
  claims: subcontractClaimsProcedures,  // subcontracts.claims.list, .create, ...
})

// النتيجة على الـ client:
// orpc.subcontracts.items.list(...)
// orpc.subcontracts.claims.create(...)
```

---

## المرحلة الثالثة: الواجهة — بنود العقد (BOQ)

### الـ Prompt:

```
الآن أنشئ صفحة إدارة بنود عقد الباطن في مسار.
الفلسفة: بسيطة في الظاهر، كاملة في الجوهر — الإضافة/التعديل في Sheet/Drawer وليس صفحة منفصلة.

═══════════════════════════════════════════════════════
المسار الجديد في الـ App Router:
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/subcontracts/[id]/items/
═══════════════════════════════════════════════════════

أنشئ المكونات التالية:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1] صفحة بنود العقد: page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

التصميم:
┌─────────────────────────────────────────────────┐
│  بنود عقد: [اسم المقاول]                        │
│  قيمة العقد: SAR 1,500,000                     │
├─────────────────────────────────────────────────┤
│  [+ إضافة بند]  [استيراد Excel]  [تصدير]        │
├──────┬──────────────┬────┬────┬──────────┬──────┤
│ الكود│ الوصف        │الوحدة│الكمية│ سعر الوحدة│الإجمالي│
├──────┴──────────────┴────┴────┴──────────┴──────┤
│ 2-1   خرسانة مسلحة  م3   100   3,000    300,000 │
│  ⊞ 2-1-1 خرسانة     م3    60  ...                │
│  ⊞ 2-1-2 حديد       طن    40  ...                │
│ 2-2   بناء حوائط   م2   500   150      75,000  │
└─────────────────────────────────────────────────┘
│ الإجمالي: SAR 1,500,000                         │

الميزات:
- جدول قابل للترتيب drag-and-drop (sortOrder)
- تعديل inline (النقر على خلية يفتح input مباشرة)
- حذف مع تأكيد (يرفض إذا للبند مستخلصات)
- الإجمالي يُحدث تلقائياً
- زر "إضافة بند" يفتح Sheet من اليمين (RTL)
- ألوان: بنود رئيسية (Main) باللون الأفتح، فرعية (Sub) بمسافة بادئة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2] Sheet إضافة/تعديل بند: SubcontractItemSheet.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sheet من الجانب يحتوي:
- كود البند (اختياري) — input نصي
- الوصف (بالعربية) — مطلوب
- الوصف (بالإنجليزية) — اختياري
- وحدة القياس — Select مع خيارات: م3، م2، طن، متر طولي، قطعة، LS، يوم
- الكمية في العقد — number input
- سعر الوحدة — number input مع عرض الإجمالي تلقائياً
- التصنيف — Select: أعمال ترابية، خرسانة، مباني، تشطيبات، كهرباء، سباكة، تكييف، أخرى
- بند مقطوع (LS) — checkbox: إذا فُعّل يخفي حقل الكمية
- الترتيب — number (إذا أراد تخصيصه)

ملاحظة: لا تصمم صفحة منفصلة — Sheet فقط

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3] تحديث صفحة تفاصيل العقد — إضافة Tabs + Navigation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

في صفحة تفاصيل عقد الباطن، أضف Tabs جديدة:
[ التفاصيل | البنود | المستخلصات | الدفعات | الملخص ]

الـ Tab "البنود" يعرض عدد البنود وزر الانتقال لصفحة البنود.

⚠️ مهم — النافيجيشن:
- أنشئ مكون: apps/app/components/subcontract-tabs.tsx
- الـ Tab "المستخلصات" يوجه إلى: .../subcontracts/[id]/claims/
- استخدم useProjectRole() hook لإخفاء/إظهار الـ tabs حسب الصلاحية

الترجمات المطلوبة في messages/ar.json و messages/en.json:
{
  "subcontractItems": {
    "title": "بنود العقد",
    "addItem": "إضافة بند",
    "itemCode": "كود البند",
    "description": "الوصف",
    "unit": "الوحدة",
    "contractQty": "الكمية",
    "unitPrice": "سعر الوحدة",
    "totalAmount": "الإجمالي",
    "category": "التصنيف",
    "isLumpSum": "بند مقطوع (LS)",
    "noItems": "لا توجد بنود — ابدأ بإضافة بنود العقد",
    "deleteConfirm": "هل أنت متأكد من حذف هذا البند؟",
    "cannotDelete": "لا يمكن حذف بند مستخدم في مستخلص",
    "units": {
      "m3": "م³ (متر مكعب)",
      "m2": "م² (متر مربع)", 
      "m": "م (متر طولي)",
      "ton": "طن",
      "piece": "قطعة",
      "ls": "LS (مقطوع)",
      "day": "يوم"
    }
  }
}
```

---

## المرحلة الرابعة: الواجهة — إنشاء المستخلص

### الـ Prompt:

```
الآن أنشئ صفحة إنشاء وعرض مستخلصات الباطن. 
هذه الصفحة هي قلب النظام — يجب أن تكون واضحة وسهلة مع إظهار كل الأرقام بدقة.

═══════════════════════════════════════════════════════
المسار:
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/subcontracts/[id]/claims/
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/subcontracts/[id]/claims/new/
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/subcontracts/[id]/claims/[claimId]/
═══════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1] صفحة قائمة المستخلصات: claims/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

التصميم (بسيط وواضح):

┌─────────────────────────────────────────────────────────┐
│  مستخلصات: [اسم مقاول الباطن]          [+ مستخلص جديد] │
├────────────────────────────────────────────────────────-│
│  ملخص سريع:                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │إجمالي مستخلص│ │  محصّل    │ │  مستحق   │           │
│  │ 800,000 ريال│ │ 600,000   │ │ 200,000   │           │
│  └────────────┘ └────────────┘ └────────────┘           │
├─────────────────────────────────────────────────────────┤
│ م# │ العنوان       │ التاريخ │ الإجمالي │ الصافي  │ الحالة│ ⋮ │
│  1 │ م.خرسانة#1   │ ينا 2025│ 300,000  │ 270,000 │ مدفوع │   │
│  2 │ م.خرسانة#2   │ فبر 2025│ 200,000  │ 180,000 │ معتمد │   │
│  3 │ م.جديد       │ مار 2025│ 300,000  │ 270,000 │ مسودة │   │
└─────────────────────────────────────────────────────────┘

الحالات وألوانها:
- مسودة → رمادي
- مقدم → أزرق
- تحت المراجعة → برتقالي  
- معتمد → أخضر فاتح
- مدفوع جزئياً → أصفر
- مدفوع → أخضر غامق
- مرفوض → أحمر

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2] صفحة إنشاء مستخلص: claims/new/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

خطوتان (Stepper بسيط):

الخطوة 1 — معلومات المستخلص:
- عنوان المستخلص (مثل: "مستخلص خرسانة الدور الثالث")
- نوع المستخلص: جاري / ختامي / إفراج استقطاع
- الفترة: من تاريخ — إلى تاريخ
- ملاحظات (اختياري)

الخطوة 2 — جدول البنود (قلب الصفحة):

┌──────────────────────────────────────────────────────────────────┐
│  البند       │وحدة│كمية العقد│مستخلص سابق│هذا المستخلص│الإجمالي│متبقي│
├──────────────────────────────────────────────────────────────────┤
│خرسانة م/مسلح│ م3 │    100   │     20    │  [___30___]│  50%  │  50 │
│حديد مسلح    │ طن │     15   │      5    │  [____3___]│  53%  │   7 │
│بناء حوائط   │ م2 │    200   │     80    │  [___50___]│  65%  │  70 │
└──────────────────────────────────────────────────────────────────┘

التصميم المطلوب للجدول:
- كمية العقد: نص ثابت (لا يتغير)
- مستخلص سابق: نص ثابت باللون الرمادي (تراكم سابق)
- هذا المستخلص: input number بإطار واضح — هذا الوحيد القابل للتعديل
- الإجمالي: (سابق + حالي) / كمية العقد × 100 = نسبة مئوية — يتحدث لحظياً
- متبقي: كمية العقد - سابق - حالي — يتحدث لحظياً
- التحقق: إذا أدخل المستخدم قيمة أكبر من المتبقي → خطأ فوري

ملخص الخصومات (يظهر أسفل الجدول):
┌──────────────────────────────────────────────────┐
│  إجمالي هذا المستخلص:         SAR 120,000        │
│  (-) استقطاع (10%):           SAR  12,000        │
│  (-) استرداد دفعة مقدمة(15%): SAR  18,000        │
│  (+) ضريبة القيمة المضافة(15%):SAR  13,500        │
│  ─────────────────────────────────────────────── │
│  صافي المستحق:                SAR 103,500        │
└──────────────────────────────────────────────────┘

(جميع الأرقام تتحدث لحظياً عند تغيير أي كمية)

الأزرار: [← رجوع] [حفظ كمسودة] [تقديم المستخلص]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3] صفحة تفاصيل المستخلص: claims/[claimId]/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

قسم 1 — معلومات المستخلص:
مستخلص #2 | معتمد | الفترة: 1-28 فبراير 2025
المقاول: محمد أحمد | قيمة العقد: SAR 1,500,000

قسم 2 — جدول البنود (عرض فقط):
نفس الجدول بكل الحسابات التراكمية — لكن read-only بدون inputs

قسم 3 — ملخص مالي:
الإجمالي + الخصومات + الصافي + المدفوع + المتبقي

قسم 4 — Actions (حسب الحالة):
DRAFT: [تعديل] [تقديم] [حذف]
SUBMITTED: [اعتماد] [رفض] [إلغاء]
APPROVED: [تسجيل دفعة] [طباعة]
PARTIALLY_PAID: [تسجيل دفعة أخرى] [طباعة]
PAID: [طباعة فقط]
REJECTED: [إرجاع للمسودة]

قسم 5 — سجل الدفعات (إذا وجدت):
┌─────────────────────────────────────────────┐
│ الدفعات المسجلة                              │
├──────────┬──────────┬──────────┬────────────┤
│ التاريخ  │ المبلغ   │ الطريقة  │ ملاحظة    │
│ 15/3/25  │ 50,000  │ تحويل   │ دفعة أولى │
│ 1/4/25   │ 53,500  │ تحويل   │ تسوية     │
├──────────┴──────────┴──────────┴────────────┤
│ إجمالي المدفوع: 103,500 ✅ مسدد بالكامل    │
└─────────────────────────────────────────────┘

قسم 6 — Dialog تسجيل دفعة:
Sheet من الجانب يحتوي:
- المبلغ (بحد أقصى = المتبقي)
- التاريخ
- طريقة الدفع
- حساب بنكي (Select من حسابات المنظمة)
- ملاحظة

⚠️ مهم — بعد إنشاء الصفحات:
حدّث Tabs في صفحة تفاصيل العقد (subcontract-tabs.tsx) لتضيف:
[ التفاصيل | البنود | المستخلصات | الدفعات | الملخص ]
حيث كل Tab يعرض عدد السجلات (badge) ويوجه للمسار الصحيح.
```

---

## المرحلة الخامسة: المستخلصات للعميل (Client Claims)

### الـ Prompt:

```
الآن طوّر صفحة مستخلصات العميل (ما يرسله المقاول للمالك).
هذه نسخة مماثلة لمستخلصات الباطن لكن في الاتجاه المعاكس.

═══════════════════════════════════════════════════════
المسار:
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/claims/
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/claims/new/
═══════════════════════════════════════════════════════

الفرق عن مستخلصات الباطن:
1. البنود من ProjectContractItem (عقد المشروع مع العميل)
2. الدفعة هي استلام مال من العميل (ليس دفع) — تُنشئ ProjectClaimPayment
3. الاستقطاع محتجز من العميل
4. نفس منطق الحسابات تماماً

⚠️ مهم — تحديث Navigation في Finance:
أضف tab "المستخلصات" في صفحة:
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/

التبويبات المقترحة (حدّث الـ Finance layout أو nav):
[ نظرة عامة | المستخلصات | الدفعات المستلمة | المصروفات | مقاولو الباطن ]

في نظرة عامة أضف:
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│قيمة العقد│ │إجمالي    │ │محصّل    │ │مستحق   │
│2,000,000│ │مستخلصات │ │1,200,000│ │300,000 │
│         │ │1,500,000 │ │         │ │         │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

وأضف جدول مقارنة:
┌─────────────────────────────────────────────────┐
│           مستخلصات العميل    مستخلصات الباطن    │
│ الإجمالي   1,500,000         1,200,000          │
│ المدفوع    1,200,000           900,000          │
│ الربح      ━━━━━━━━━━━━━━━━━━ 300,000 (20%)    │
└─────────────────────────────────────────────────┘

⚠️ مهم — استخدم useProjectRole() لإخفاء/إظهار الـ tabs حسب الصلاحية.
```

---

## المرحلة السادسة: طباعة المستخلص (PDF)

### الـ Prompt:

```
الآن أنشئ قالب طباعة المستخلص — يجب أن يكون احترافياً ورسمياً.
راجع أولاً: apps/app/app/[locale]/app/[slug]/finance/templates/ لفهم نظام القوالب الموجود.

═══════════════════════════════════════════════════════
المسار:
apps/app/app/[locale]/app/[slug]/projects/[projectId]/finance/subcontracts/[id]/claims/[claimId]/print/
═══════════════════════════════════════════════════════

التصميم المطلوب لـ print page:

[هيدر الشركة — شعار + اسم + رقم ضريبي]
─────────────────────────────────────────
        مستخلص أعمال رقم (2)
    عقد: [اسم العقد] | المقاول: [الاسم]
    الفترة: 1-28 فبراير 2025
─────────────────────────────────────────

┌───┬────────────────┬────┬───────┬───────┬──────────┬──────────┬──────────┐
│ م │    البند       │الوحدة│كمية  │سعر    │ مستخلصات │ هذا      │ إجمالي  │
│   │                │   │العقد  │الوحدة │ سابقة    │ المستخلص │ مراكم   │
├───┼────────────────┼────┼───────┼───────┼──────────┼──────────┼──────────┤
│ 1 │خرسانة م/مسلح  │ م3 │  100  │ 3,000 │    20    │    30    │   50%   │
│ 2 │حديد مسلح      │ طن │   15  │18,000 │     5    │     3    │   53%   │
└───┴────────────────┴────┴───────┴───────┴──────────┴──────────┴──────────┘

───────────────────────────────────────────────
إجمالي أعمال هذا المستخلص:      SAR 120,000.00
الاستقطاع (10%):               SAR  12,000.00
استرداد الدفعة المقدمة (15%):  SAR  18,000.00
ضريبة القيمة المضافة (15%):   SAR  13,500.00
───────────────────────────────────────────────
صافي المستحق:                  SAR 103,500.00
───────────────────────────────────────────────

[توقيع المقاول]          [توقيع المشرف]          [توقيع المالك]
─────────────            ─────────────            ─────────────

متطلبات الطباعة:
- اتجاه: أفقي (landscape) للجدول الكبير
- قابل للطباعة مباشرة من المتصفح (print CSS)
- يعمل على A4
- قابل للتصدير PDF بنفس نظام القوالب الموجود
- يدعم RTL بشكل كامل
```

---

## المرحلة السابعة: الملخص المالي الشامل للمقاول

### الـ Prompt:

```
أنشئ صفحة "كشف حساب المقاول" — ملخص شامل لكل مقاول باطن عبر كل المشاريع.

⚠️ مهم — المسار وبنية الصفحة:
المسار: apps/app/app/[locale]/app/[slug]/finance/contractors/[contractorId]/
← ضع الصفحة داخل finance على مستوى المنظمة (org-level)، وليس كمسار مستقل

بعد إنشاء الصفحة، أضف رابطاً إليها في:
1. صفحة finance على مستوى المنظمة:
   apps/app/app/[locale]/app/[slug]/finance/
   أضف قسم "المقاولون" أو Tab جديد في القائمة الجانبية لـ Finance

2. تأكد أن الصفحة ترث من org layout الموجود (لا تنشئ layout مستقل)

هذه الصفحة تجمع:

القسم 1 — بطاقة المقاول:
┌─────────────────────────────────────────┐
│  محمد أحمد المقاولات                   │
│  رقم السجل التجاري: 1234567890         │
│  الهاتف: 0501234567                    │
└─────────────────────────────────────────┘

القسم 2 — ملخص كل العقود:
┌────────────────────────────────────────────────────────┐
│ المشروع │ قيمة العقد │ إجمالي مستخلص │ مدفوع │ مستحق │
│ برج A   │  500,000   │   350,000     │300,000│ 50,000│
│ فيلا B  │  200,000   │   120,000     │100,000│ 20,000│
├────────────────────────────────────────────────────────┤
│ الإجمالي│  700,000   │   470,000     │400,000│ 70,000│
└────────────────────────────────────────────────────────┘

القسم 3 — كشف الحساب التفصيلي (جدول زمني):
┌──────────────────────────────────────────────────────────────┐
│ التاريخ │ البيان                      │  مدين  │ دائن  │ رصيد│
│ 5/9/23  │ مستخلص#1 برج أكتوبر        │244,800 │       │244,800│
│ 5/9/23  │ استقطاع تأمين م#1          │        │27,200 │217,600│
│ 1/5/24  │ مستخلص#2 برج أكتوبر        │170,000 │       │387,600│
│ 8/5/24  │ دفعة جزئية                 │        │120,000│267,600│
│ 9/6/24  │ دفعة تسوية                 │        │147,600│120,000│
│         │ الرصيد المستحق الحالي      │        │       │120,000│
└──────────────────────────────────────────────────────────────┘

القسم 4 — التأمينات المحتجزة:
إجمالي ما تم اقتطاعه: 44,200 ريال
تم الإفراج عنه: 0
المتبقي المحتجز: 44,200 ريال

الأزرار: [تصدير Excel] [طباعة كشف الحساب]
```

---

## المرحلة الثامنة: الصلاحيات والترجمات

### الـ Prompt:

```
اكمل التطوير بإضافة الصلاحيات والترجمات.

═══════════════════════════════════════════════════════
[1] الصلاحيات — packages/database/prisma/permissions.ts
═══════════════════════════════════════════════════════

⚠️ مهم: الصلاحيات مخزنة في packages/database/prisma/permissions.ts
وليست ملف static في packages/api/src/lib/
الصلاحيات مخزنة كـ JSON في جدول Role، مع قيم افتراضية تُولَّد عند إنشاء المنظمة.

افتح هذا الملف وأضف القيم الافتراضية للأدوار الجديدة
في DEFAULT_PERMISSIONS object لكل دور:

subcontractClaims: {
  view:   ['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT'],
  create: ['OWNER', 'PROJECT_MANAGER'],
  submit: ['OWNER', 'PROJECT_MANAGER'],
  approve:['OWNER', 'PROJECT_MANAGER'],
  reject: ['OWNER', 'PROJECT_MANAGER'],
  addPayment: ['OWNER', 'ACCOUNTANT'],
  delete: ['OWNER'],
  print:  ['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT'],
}

subcontractItems: {
  view:   ['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT', 'ENGINEER'],
  create: ['OWNER', 'PROJECT_MANAGER'],
  update: ['OWNER', 'PROJECT_MANAGER'],
  delete: ['OWNER', 'PROJECT_MANAGER'],
}

projectClaims: {
  view:   ['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT'],
  create: ['OWNER', 'PROJECT_MANAGER'],
  addPaymentReceived: ['OWNER', 'ACCOUNTANT'],
}

حدّث الـ seed function لتُضيف هذه الصلاحيات عند إنشاء منظمة جديدة.

═══════════════════════════════════════════════════════
[2] الترجمات العربية — messages/ar.json
═══════════════════════════════════════════════════════

أضف هذا الـ namespace:

"claims": {
  "clientClaims": "مستخلصات العميل",
  "subcontractClaims": "مستخلصات المقاولين",
  "newClaim": "مستخلص جديد",
  "claimNo": "رقم المستخلص",
  "claimTitle": "عنوان المستخلص",
  "period": "الفترة",
  "periodFrom": "من تاريخ",
  "periodTo": "إلى تاريخ",
  "claimType": "نوع المستخلص",
  "interim": "جاري",
  "final": "ختامي",
  "retentionRelease": "إفراج عن استقطاع",
  "grossAmount": "إجمالي المستخلص",
  "retentionDeduction": "خصم الاستقطاع",
  "advanceDeduction": "استرداد الدفعة المقدمة",
  "vatAmount": "ضريبة القيمة المضافة",
  "netAmount": "صافي المستحق",
  "paidAmount": "المدفوع",
  "outstandingAmount": "المتبقي",
  "status": {
    "DRAFT": "مسودة",
    "SUBMITTED": "مقدم",
    "UNDER_REVIEW": "تحت المراجعة",
    "APPROVED": "معتمد",
    "PARTIALLY_PAID": "مدفوع جزئياً",
    "PAID": "مدفوع",
    "REJECTED": "مرفوض",
    "CANCELLED": "ملغى"
  },
  "actions": {
    "submit": "تقديم المستخلص",
    "approve": "اعتماد",
    "reject": "رفض",
    "addPayment": "تسجيل دفعة",
    "print": "طباعة",
    "backToDraft": "إرجاع للمسودة"
  },
  "items": {
    "contractQty": "كمية العقد",
    "prevCumulative": "مستخلص سابق",
    "thisQty": "هذا المستخلص",
    "cumulative": "الإجمالي المراكم",
    "remaining": "المتبقي",
    "completionPct": "نسبة الإنجاز"
  },
  "payment": {
    "addPayment": "تسجيل دفعة",
    "paymentAmount": "مبلغ الدفعة",
    "maxAllowed": "الحد الأقصى: {amount}",
    "paymentHistory": "سجل الدفعات",
    "fullyPaid": "مسدد بالكامل"
  },
  "summary": {
    "totalClaimed": "إجمالي المستخلصات",
    "totalPaid": "المحصّل",
    "totalOutstanding": "المستحق",
    "retentionHeld": "استقطاع محتجز",
    "advanceRecovered": "دفعة مقدمة مستردة"
  },
  "validation": {
    "qtyExceedsRemaining": "الكمية المدخلة ({qty}) تتجاوز المتبقي ({remaining})",
    "noItemsAdded": "يجب إضافة كميات لبند واحد على الأقل",
    // ⚠️ مهم: التحقق الصحيح هو منع المستخلصات المعلقة (وليس منع التعدد)
    "pendingClaimExists": "يوجد مستخلص بانتظار الاعتماد — اعتمده أو ارفضه أولاً"
  }
}

"subcontractItems": {
  "title": "بنود العقد",
  "addItem": "إضافة بند",
  "editItem": "تعديل البند",
  "deleteItem": "حذف البند",
  "itemCode": "الكود",
  "description": "الوصف",
  "unit": "الوحدة",
  "contractQty": "الكمية",
  "unitPrice": "سعر الوحدة",
  "totalAmount": "الإجمالي",
  "claimedQty": "الكمية المستخلصة",
  "remainingQty": "الكمية المتبقية",
  "cannotDeleteUsed": "لا يمكن حذف البند — مستخدم في {count} مستخلص",
  "importFromExcel": "استيراد من Excel",
  "noItems": "لا توجد بنود — ابدأ بإضافة بنود العقد",
  "contractTotal": "إجمالي العقد"
}

═══════════════════════════════════════════════════════
[3] الترجمات الإنجليزية — messages/en.json
═══════════════════════════════════════════════════════
أضف النظير الإنجليزي لكل مفتاح أعلاه.
```

---

## المرحلة التاسعة: التنبيهات والإشعارات

### الـ Prompt:

```
أضف تنبيهات ذكية لنظام المستخلصات.
راجع أولاً: كيف يعمل نظام الإشعارات الموجود في المشروع
← ابحث عن ملف notifications في packages/api/orpc/ أو packages/api/lib/

أضف هذه الإشعارات:

1. عند تقديم مستخلص (SUBMITTED):
   → أشعر مدير المشروع ومالك المنظمة
   → العنوان: "مستخلص جديد بانتظار الاعتماد"
   → الجسم: "{contractorName} قدم مستخلص #{claimNo} بمبلغ {amount} ريال"

2. عند اعتماد مستخلص (APPROVED):
   → أشعر المحاسب
   → العنوان: "مستخلص معتمد — بانتظار الصرف"
   → الجسم: "مستخلص #{claimNo} لـ {contractorName} معتمد بمبلغ {netAmount} ريال"

3. عند رفض مستخلص (REJECTED):
   → أشعر من أنشأ المستخلص
   → العنوان: "مستخلص مرفوض"
   → الجسم: "تم رفض مستخلص #{claimNo} — السبب: {reason}"

4. تنبيه تلقائي: مستخلص معتمد منذ أكثر من 30 يوم بدون دفعة
   → (يمكن تنفيذه لاحقاً كـ cron job)
```

---

## ملاحظات التنفيذ لـ Claude Code

```
قبل البدء في كل مرحلة:
✅ اقرأ الكود الموجود أولاً
✅ لا تكسر أي schema موجود — أضف فقط
✅ استخدم prisma.$transaction للعمليات المتعددة
✅ كل الحسابات المالية = Decimal وليس float
✅ حساب prevCumulativeQty يجب أن يأخذ فقط المستخلصات بحالة APPROVED أو أعلى
✅ تحقق دائماً من organizationId في كل query
✅ أضف @@index على contractId و organizationId
✅ اتبع نمط try-catch الموجود في الـ procedures
✅ استخدم React Query invalidateQueries بعد كل mutation
✅ الأرقام تُعرض بـ toLocaleString('ar-SA') في الواجهة
✅ كل User relations يجب أن تحمل اسماً صريحاً (string literal) لتجنب تعارض User model

⚠️ مسارات مهمة — تذكيرات:
- API procedures: packages/api/orpc/  (وليس src/procedures/)
- Router الرئيسي: packages/api/orpc/router.ts  (وليس src/index.ts)
- الصلاحيات: packages/database/prisma/permissions.ts
- أوامر Prisma: pnpm --filter database db:push  و  pnpm --filter database generate
- لا تستخدم: npx prisma db push

الترتيب المقترح للتنفيذ:
1. Schema (المرحلة 1) ← أهم خطوة
2. API - Subcontract Items (packages/api/orpc/subcontract-items.ts)
3. API - Subcontract Claims (packages/api/orpc/subcontract-claims.ts)
4. تحديث router.ts — إضافة nested items/claims في subcontracts
5. UI - صفحة البنود (المرحلة 3)
6. UI - Tabs في تفاصيل العقد (مكون subcontract-tabs.tsx)
7. UI - إنشاء المستخلص (المرحلة 4)
8. UI - عرض وإدارة المستخلص (المرحلة 4)
9. Client Claims (المرحلة 5)
10. طباعة (المرحلة 6)
11. كشف حساب المقاول (المرحلة 7) — في /finance/contractors/
12. الصلاحيات والترجمات (المرحلة 8)
13. الإشعارات (المرحلة 9)
```

---

*تم إعداد هذا الـ Prompt بناءً على:*
- *دراسة نظم (Nodhom) + شمول ERP + Procore + Viewpoint Vista*
- *قراءة PROJECT_REPORT.md الكامل لمسار*
- *تقرير التوافق (2026-03-04) — تم تطبيق جميع التصحيحات الحرجة والمهمة*
- *فهم الفرق بين المستخلص (طلب الدفع) والدفعة (تنفيذ الدفع)*
