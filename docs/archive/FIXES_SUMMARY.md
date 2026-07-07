# ملخص الإصلاحات قبل النشر — 2026-03-01

## المشاكل التي تم إصلاحها

### 1. تحويل Float → Decimal
- **الملفات المعدّلة:** `packages/database/prisma/schema.prisma`
- **الحقول المحوّلة:**
  - `Project.progress` → `Decimal @db.Decimal(5, 2)`
  - `ProjectProgressUpdate.progress` → `Decimal @db.Decimal(5, 2)`
  - `ProjectCalendar.defaultHoursPerDay` → `Decimal @db.Decimal(5, 2)`
  - `ProjectActivity.progress` → `Decimal @db.Decimal(5, 2)`
  - `ProjectActivity.weight` → `Decimal? @db.Decimal(5, 2)`
  - `ProjectMilestone.progress` → `Decimal @db.Decimal(5, 2)`
  - `ProjectMilestone.weight` → `Decimal? @db.Decimal(5, 2)`
- **التحويلات في الكود:**
  - `packages/database/prisma/queries/project-insights.ts` — `Number()` للعمليات الحسابية
  - `packages/database/prisma/queries/project-timeline.ts` — `Number()` للمقارنات والتجميع
  - `packages/database/prisma/queries/project-execution.ts` — `Number()` للأوزان والتقدم
  - `packages/database/prisma/queries/dashboard.ts` — `Number()` للاستجابات
  - `packages/database/prisma/queries/digests.ts` — `Number()` للاستجابات
  - `packages/api/modules/project-insights/procedures/get-insights.ts` — `Number()` للاستجابة
  - `packages/api/modules/exports/procedures/generate-weekly-report.ts` — `Number()` للتقرير

### 2. إضافة Rate Limiting
- **الملفات المعدّلة:**
  - `packages/api/modules/contact/procedures/submit-contact-form.ts` — STRICT (5 طلبات/دقيقة) بالـ IP
  - `packages/api/modules/newsletter/procedures/subscribe-to-newsletter.ts` — WRITE (20 طلب/دقيقة) بالـ IP
  - `packages/api/modules/organizations/procedures/generate-organization-slug.ts` — READ (60 طلب/دقيقة) بالـ IP
- **النمط المستخدم:** `enforceRateLimit(createIpRateLimitKey(ip, procedureName), RATE_LIMITS.LEVEL)`

### 3. فحص صلاحيات list-purchases
- **الملف:** `packages/api/modules/payments/procedures/list-purchases.ts`
- **التعديل:** إضافة `verifyOrganizationAccess(organizationId, user.id)` قبل استعلام مشتريات المنظمة

### 4. إنشاء vercel.json
- **الملفات المنشأة:**
  - `vercel.json` — إعدادات Vercel (region: fra1, maxDuration: 30s, cron health check)
  - `apps/web/app/api/health/route.ts` — نقطة فحص الصحة

### 5. صفحات الخطأ
- **الملفات المنشأة:**
  - `apps/web/app/error.tsx` — صفحة خطأ عامة مع RTL ودعم dark mode
  - `apps/web/app/(saas)/app/error.tsx` — صفحة خطأ لقسم SaaS مع زر العودة للوحة التحكم
  - `apps/web/app/global-error.tsx` — صفحة خطأ للـ root layout مع HTML/body كاملين

### 6. تنظيف الراوترات
- **الملفات المعدّلة:**
  - `packages/api/modules/attachments/router.ts` — `publicProcedure.router` → `protectedProcedure.router`
  - `packages/api/modules/project-documents/router.ts` — `publicProcedure.router` → `protectedProcedure.router`
  - `packages/api/modules/project-chat/router.ts` — `publicProcedure.router` → `protectedProcedure.router`
  - `packages/api/modules/notifications/router.ts` — `publicProcedure.router` → `protectedProcedure.router`
- **التحقق:** تم التأكد أن جميع الإجراءات في كل راوتر تستخدم `protectedProcedure`

### 7. عنوان البريد المرسل
- **الملف:** `config/index.ts`
- **التعديل:** `"noreply@supastarter.dev"` → `process.env.MAIL_FROM || "noreply@masar.app"`

### 8. إصلاح fix-zod-import.js (مشكلة مكتشفة أثناء العمل)
- **الملف:** `packages/database/fix-zod-import.js`
- **التعديل:** إضافة إصلاح تلقائي لقيم `.default(NUMBER)` في حقول Decimal → `.default(new Prisma.Decimal(NUMBER))`
- **النتيجة:** إصلاح 10 قيم افتراضية في الملف المولّد تلقائياً

## نتائج الاختبار
- Prisma Generate: ✅
- TypeScript: ✅ (لا أخطاء جديدة — الأخطاء المتبقية موجودة مسبقاً في ملفات لم نعدّلها)
- Lint: ⏳ (لم يتم الفحص بعد)
