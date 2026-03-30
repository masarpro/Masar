# برومبت 1: إصلاحات أمنية وحرجة — الأولوية القصوى قبل البيتا

> **الهدف:** إغلاق آخر ثغرتين حرجتين (#1, #7) + تقوية أمنية شاملة (15 مشكلة إضافية)
> **الوقت المتوقع:** 45-60 دقيقة
> **عدد المشاكل:** 17 مشكلة

---

## 🚫 القائمة الحمراء — لا تلمس هذه الملفات أبداً

- `packages/api/modules/quantities/engines/structural-calculations.ts`
- `packages/api/modules/quantities/engines/derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/structural-calculations.ts`
- `packages/database/prisma/zod/index.ts`
- `packages/database/prisma/schema/*.prisma` (إلا إذا طُلب صراحةً في المرحلة)

---

## المرحلة 0: اقرأ أولاً — لا تخمّن

اقرأ هذه الملفات بالكامل قبل أي تعديل:

```bash
cat CLAUDE.md
cat packages/payments/index.ts
cat packages/payments/providers/stripe.ts
ls packages/payments/
cat apps/web/next.config.ts
cat packages/api/modules/project-owner/procedures/exchange-token.ts
cat packages/api/modules/shares/procedures/*.ts
cat packages/api/modules/company/procedures/employees.ts | head -100
cat packages/storage/lib/*.ts
grep -rn "dangerouslySetInnerHTML" apps/web/ --include="*.tsx" -l
grep -rn "generateSlug" packages/ --include="*.ts" -l
cat packages/api/modules/project-documents/procedures/*.ts | head -200
cat packages/database/prisma/queries/project-owner-portal.ts
```

---

## المرحلة 1: Stripe Webhook Signature Verification (مشكلة #1 — 🔴 حرج)

**المشكلة:** Stripe webhook handlers لا تتحقق من التوقيع — يمكن لأي شخص إرسال webhook وهمي وإنشاء اشتراكات مزيفة.

**المطلوب:**

1. في ملف webhook handler الخاص بـ Stripe (ابحث عنه):
```bash
grep -rn "webhook\|handleWebhook\|stripe.*event" packages/payments/ --include="*.ts"
grep -rn "rawBody\|raw_body\|getRawBody" packages/payments/ --include="*.ts"
grep -rn "constructEvent" packages/payments/ --include="*.ts"
```

2. أضف التحقق من التوقيع باستخدام `stripe.webhooks.constructEvent()`:
```typescript
const event = stripe.webhooks.constructEvent(
  rawBody,                                    // الـ body الخام (ليس parsed JSON)
  request.headers.get("stripe-signature")!,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

3. إذا كان الـ body يُقرأ كـ JSON تلقائياً، يجب الحصول على الـ raw body أولاً. في Next.js/Hono:
```typescript
const rawBody = await request.text(); // أو request.arrayBuffer()
```

4. أضف try-catch حول `constructEvent` وأرجع 400 عند الفشل:
```typescript
try {
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
} catch (err) {
  console.error("[Stripe] Webhook signature verification failed:", err);
  return new Response("Webhook signature verification failed", { status: 400 });
}
```

5. تحقق أن `STRIPE_WEBHOOK_SECRET` موجود في `.env.example` و environment variables.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "payments" | head -20
```

---

## المرحلة 2: Cache-Control Headers (مشكلة #7 — 🔴 حرج)

**المشكلة:** `Cache-Control: no-store, no-cache` على كل `/app/*` routes يمنع Browser cache بالكامل ويعيد تحميل الصفحة كاملة عند كل تنقل.

**المطلوب:**

1. اقرأ `apps/web/next.config.ts` وابحث عن headers function.
2. غيّر Cache-Control لـ `/app/*` routes من:
```
no-store, no-cache, must-revalidate
```
إلى:
```
private, no-cache, must-revalidate
```

**الفرق:** `no-store` يمنع المتصفح من تخزين أي شيء. `no-cache` يسمح بالتخزين لكن يتطلب revalidation — هذا يسمح بـ 304 Not Modified responses بدل تحميل كامل.

3. **لا تغيّر** headers الـ `/auth/*` أو `/owner/*` أو `/api/*` — تبقى `no-store` للأمان.
4. `/share/*` تبقى كما هي (public cache).

**تحقق:**
```bash
grep -A5 "app/\*" apps/web/next.config.ts
npx tsc --noEmit 2>&1 | grep "next.config" | head -5
```

---

## المرحلة 3: Owner Portal Security Hardening (مشاكل #62, #63, #64, #65, #66)

**المشاكل:**
- #62: لا تنظيف للتوكنات المنتهية
- #63: Cross-project access ممكن نظرياً
- #64: Token في URL يظهر في browser history
- #65: Token لا يُبطل بعد الاستخدام
- #66: مدة session غير واضحة (ملاحظة: الإصلاح السابق أضاف 8 ساعات max — تحقق أولاً)

**المطلوب:**

### 3a: Cross-project access guard (#63)
في كل endpoint في `packages/api/modules/project-owner/procedures/`:
```bash
ls packages/api/modules/project-owner/procedures/
```
- تأكد أن كل procedure تتحقق أن `session.projectId === input.projectId` (أو أن الـ projectId يُحل من الـ session وليس من الـ input).
- إذا المستخدم يرسل projectId في الـ input، يجب مقارنته مع الـ session.

### 3b: Token invalidation بعد exchange (#65)
في `exchange-token.ts`:
- بعد إنشاء الـ session بنجاح، أضف flag لـ token يمنع إعادة استخدامه (one-time use).
- يمكن إضافة حقل `usedAt` في `OwnerPortalToken` أو إضافة check: إذا `usedAt !== null` → reject.
- **انتبه:** هذا يتطلب تعديل في Schema. إذا كان تعديل Schema غير مرغوب، بديل: أنقص مدة صلاحية الـ token لـ 10 دقائق فقط (بدل ما كانت).

### 3c: Token في URL mitigation (#64)
- أضف `Referrer-Policy: no-referrer` في headers الخاصة بـ `/owner/*` routes في `next.config.ts` (إذا لم يكن موجوداً).
- أضف تعليق توثيقي أن الـ token يُستبدل بـ session بعد الـ exchange.

### 3d: Token cleanup (#62)
- أنشئ دالة `cleanupExpiredTokens()` في `project-owner-portal.ts`:
```typescript
export async function cleanupExpiredTokens(db: PrismaClient) {
  const result = await db.ownerPortalToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ]
    }
  });
  return result.count;
}
```
- سيُستدعى لاحقاً من cron job (في برومبت 4).

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "project-owner|owner-portal" | head -20
```

---

## المرحلة 4: Share Links Security (مشكلة #67)

**المشكلة:** Share links بدون expiry ولا rate limiting.

**المطلوب:**

1. اقرأ share procedures:
```bash
cat packages/api/modules/shares/procedures/*.ts
```

2. عند إنشاء share link، إذا لم يكن هناك `expiresAt`:
   - أضف default expiry (30 يوم) عند الإنشاء
   - عند الوصول للـ share link، تحقق من `expiresAt` وأرجع 410 Gone إذا انتهت الصلاحية

3. أضف rate limiting على endpoint الوصول للـ share link:
   - استخدم preset مناسب (مثلاً `RELAXED` أو أنشئ `SHARE_ACCESS` preset بـ 30 req/min)

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "shares" | head -10
```

---

## المرحلة 5: Race Condition في Document Approvals (مشكلة #29)

**المشكلة:** موافقات المستندات المتزامنة قد تسبب حالات غير متوقعة.

**المطلوب:**

1. اقرأ:
```bash
cat packages/api/modules/project-documents/procedures/*.ts | grep -A30 "approve\|status"
cat packages/database/prisma/queries/project-documents*.ts
```

2. أضف `SELECT ... FOR UPDATE` على صف المستند داخل transaction عند تغيير الحالة (نفس النمط المستخدم في claims):
```typescript
await db.$transaction(async (tx) => {
  // Lock the document row
  await tx.$queryRaw`SELECT id FROM "ProjectDocument" WHERE id = ${documentId} FOR UPDATE`;
  
  // Validate current status
  const doc = await tx.projectDocument.findUnique({ where: { id: documentId } });
  if (doc.status !== expectedStatus) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }
  
  // Update
  await tx.projectDocument.update({ ... });
});
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "project-documents" | head -10
```

---

## المرحلة 6: File Security (مشاكل #80, #82)

### 6a: File name sanitization (#80)
**المطلوب:**

1. ابحث عن مكان رفع الملفات:
```bash
grep -rn "upload\|presigned\|fileName" packages/storage/ --include="*.ts" -l
grep -rn "fileName\|originalName" packages/api/modules/attachments/ --include="*.ts"
```

2. أضف دالة sanitization:
```typescript
export function sanitizeFileName(fileName: string): string {
  // إزالة path traversal
  const name = fileName.replace(/[\/\\]/g, '_');
  // إزالة null bytes
  const clean = name.replace(/\0/g, '');
  // حد الطول
  const trimmed = clean.slice(0, 255);
  // إزالة أحرف خاصة خطيرة
  return trimmed.replace(/[<>:"|?*]/g, '_');
}
```

3. استدعها عند كل رفع ملف قبل حفظ الاسم.

### 6b: File count limit (#82)
أضف فحص عدد الملفات per organization عند الرفع:
```typescript
const fileCount = await db.attachment.count({
  where: { organizationId }
});
const MAX_FILES = 10000; // حد معقول
if (fileCount >= MAX_FILES) {
  throw new ORPCError("FORBIDDEN", { message: "File storage limit reached" });
}
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "storage|attachments" | head -10
```

---

## المرحلة 7: Rate Limiting + Slug Enumeration + dangerouslySetInnerHTML (مشاكل #74, #111, #118)

### 7a: Rate limiting on employee CRUD (#74)
```bash
cat packages/api/modules/company/procedures/employees.ts | head -50
```
- أضف rate limit preset `WRITE` (20/min) على create/update/delete endpoints للموظفين (إذا لم يكن موجوداً).

### 7b: Slug enumeration protection (#111)
```bash
grep -rn "generateSlug" packages/ --include="*.ts"
```
- أضف rate limiting على endpoint `generateSlug` (إذا كان public).
- أو أضف authentication check بحيث فقط المستخدمين المسجلين يمكنهم توليد slugs.

### 7c: dangerouslySetInnerHTML audit (#118)
```bash
grep -rn "dangerouslySetInnerHTML" apps/web/ --include="*.tsx" --include="*.ts" -l
```
- راجع كل استخدام: إذا كان المحتوى يأتي من user input بدون sanitization، أضف DOMPurify أو استبدله بـ safe rendering.
- إذا كل الاستخدامات لمحتوى ثابت/آمن (مثل markdown مُولّد server-side)، أضف تعليقاً يوثق ذلك.

---

## المرحلة 8: CSP Nonce-based (مشكلة #41)

**المشكلة:** `script-src 'unsafe-inline'` يُضعف حماية XSS.

**المطلوب:**

1. في `apps/web/next.config.ts`، غيّر CSP لاستخدام nonce:
   - **ملاحظة مهمة:** Next.js 16 مع App Router يدعم nonce عبر `headers()` — لكن هذا قد يكون معقد مع Turbopack.
   - **البديل الواقعي للبيتا:** غيّر `unsafe-inline` لـ `unsafe-inline` فقط في `style-src` (مطلوب لـ Tailwind)، لكن **أزل `unsafe-inline` من `script-src`** واستبدله بـ `'strict-dynamic'` إذا كان Next.js يدعمه.

2. إذا إزالة `unsafe-inline` من `script-src` تكسر التطبيق:
   - اتركها مؤقتاً وأضف تعليق `// TODO: migrate to nonce-based CSP post-beta`
   - أضف `'strict-dynamic'` بجانب `'unsafe-inline'` كحل وسط

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "next.config" | head -5
pnpm --filter @repo/web build 2>&1 | tail -20
```

---

## المرحلة 9: Super-Admin RBAC (مشكلة #35)

**المشكلة:** كل super-admins لديهم نفس الصلاحيات.

**المطلوب:**

1. اقرأ:
```bash
grep -rn "super.admin\|superAdmin\|isSuperAdmin" packages/api/ --include="*.ts" -l
cat packages/api/modules/super-admin/procedures/*.ts | head -100
```

2. **للبيتا:** هذا ليس urgent لأن عدد super-admins محدود (جودت فقط). أضف:
   - تعليق `// TODO: Add RBAC levels for super-admin (VIEWER, EDITOR, FULL) post-beta`
   - Audit log لكل عملية super-admin (إذا لم يكن موجوداً)

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "super-admin" | head -10
```

---

## التحقق النهائي

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# يجب أن يكون 0 أو نفس عدد الأخطاء الموجودة مسبقاً فقط
```

---

## ملخص المشاكل المعالجة في هذا البرومبت

| # | المشكلة | الشدة |
|---|---------|-------|
| 1 | Stripe webhook signature | 🔴 Critical |
| 7 | Cache-Control no-store | 🔴 Critical |
| 29 | Race condition document approvals | 🟠 High |
| 35 | No RBAC in super-admin | 🟠 High |
| 41 | CSP unsafe-inline | 🟡 Medium |
| 62 | Token cleanup | 🟡 Medium |
| 63 | Cross-project access Owner Portal | 🟡 Medium |
| 64 | Token in URL | 🟡 Medium |
| 65 | Token not invalidated | 🟡 Medium |
| 66 | Session duration unclear | 🟡 Medium |
| 67 | Share links no expiry | 🟡 Medium |
| 74 | Rate limiting employee CRUD | 🟡 Medium |
| 80 | File name sanitization | 🟡 Medium |
| 82 | No file count limit | 🟡 Medium |
| 111 | Slug enumeration | 🟢 Low |
| 118 | dangerouslySetInnerHTML | 🟢 Low |
