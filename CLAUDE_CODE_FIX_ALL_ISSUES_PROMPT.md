# برومبت إصلاح جميع المشاكل المتبقية قبل نشر منصة مسار

أنت تعمل على منصة **"مسار" (Masar)** — منصة SaaS لإدارة شركات المقاولات في السوق السعودي. المشروع monorepo مبني بـ Next.js 16 + Prisma + ORPC + BetterAuth.

تم إجراء تحليل شامل للمشروع وتم اكتشاف **7 مشاكل** يجب إصلاحها قبل النشر على الإنتاج. المطلوب منك إصلاحها **جميعاً** بالترتيب التالي.

**تعليمات عامة:**
- اقرأ الملف المعني أولاً قبل أي تعديل
- لا تحذف أي وظائف موجودة
- حافظ على نفس أسلوب الكود (code style) الموجود في المشروع
- اختبر أن TypeScript لا يعطي أخطاء بعد كل تعديل (`pnpm type-check` أو `tsc --noEmit`)
- بعد الانتهاء من كل مشكلة، اكتب تعليقاً قصيراً يوضح ما تم

---

## المشكلة 1: تحويل 7 حقول Float إلى Decimal (أولوية عالية)

**الملف:** `packages/database/prisma/schema.prisma`

**المشكلة:** 7 حقول تستخدم `Float` بدلاً من `Decimal`، مما يسبب مشاكل دقة في الحسابات.

**الحقول المطلوب تحويلها:**

| النموذج | الحقل |
|---------|-------|
| Project | progress |
| ProjectProgressUpdate | progress |
| Employee | defaultHoursPerDay |
| ProjectActivity | progress |
| ProjectActivity | weight |
| ProjectMilestone | progress |
| ProjectMilestone | weight |

**المطلوب:**
1. افتح `packages/database/prisma/schema.prisma`
2. ابحث عن كل حقل من الحقول أعلاه
3. غيّر النوع من `Float` إلى `Decimal` مع `@db.Decimal(5, 2)`
4. تأكد أن القيم الافتراضية (`@default`) متوافقة مع Decimal
5. بعد التعديل، شغّل:
   ```bash
   cd packages/database && pnpm run generate
   ```
6. ابحث في الكود (grep) عن أي مكان يستخدم هذه الحقول وتأكد من التوافق مع Decimal:
   - Decimal في Prisma يُرجع كـ `Prisma.Decimal` وليس `number`
   - قد تحتاج لتحويل `toNumber()` أو `Number()` في بعض الأماكن
   - ابحث في `packages/api/modules/` و `packages/database/prisma/queries/` عن استخدامات هذه الحقول
   - ابحث في `apps/web/modules/` عن أي مكان يعرض هذه القيم في الواجهة

**مثال التعديل في schema.prisma:**
```prisma
// قبل:
progress Float @default(0)

// بعد:
progress Decimal @default(0) @db.Decimal(5, 2)
```

---

## المشكلة 2: إضافة Rate Limiting على النقاط العامة (أولوية عالية)

**المشكلة:** 3 نقاط API عامة بدون حماية Rate Limiting.

**الملفات المطلوب تعديلها:**

### 2.1: نموذج التواصل
**الملف:** `packages/api/modules/contact/procedures/submit-contact-form.ts`

**المطلوب:**
1. اقرأ الملف أولاً
2. اقرأ `packages/api/lib/rate-limit.ts` لفهم كيف يُستخدم Rate Limiting في المشروع
3. اقرأ أي procedure محمي آخر يستخدم Rate Limiting كمرجع (مثلاً ابحث عن `rateLimitKey` أو `createIpRateLimitKey` في modules أخرى)
4. أضف Rate Limiting بحد `STRICT` (5 طلبات/دقيقة) باستخدام نفس النمط الموجود في المشروع
5. استخدم `createIpRateLimitKey()` لتحديد المستخدم بالـ IP

### 2.2: الاشتراك في النشرة
**الملف:** `packages/api/modules/newsletter/procedures/subscribe-to-newsletter.ts`

**المطلوب:**
- أضف Rate Limiting بحد `WRITE` (20 طلب/دقيقة)
- نفس النمط والأسلوب

### 2.3: توليد slug المنظمة
**الملف:** `packages/api/modules/organizations/procedures/generate-organization-slug.ts`

**المطلوب:**
- أضف Rate Limiting بحد `READ` (60 طلب/دقيقة)
- نفس النمط والأسلوب

---

## المشكلة 3: إضافة فحص صلاحيات في قائمة المشتريات (أولوية عالية)

**الملف:** `packages/api/modules/payments/procedures/list-purchases.ts`

**المشكلة:** عند استعلام مشتريات منظمة، لا يتم التحقق من صلاحية المستخدم.

**المطلوب:**
1. اقرأ الملف أولاً
2. اقرأ كيف يتم فحص الصلاحيات في procedures أخرى (ابحث عن `verifyOrganizationAccess` في المشروع)
3. عند وجود `organizationId` في الطلب، أضف فحص:
   - أن المستخدم عضو في هذه المنظمة
   - أن لديه صلاحية `settings.billing` (أو الصلاحية المناسبة الموجودة في مصفوفة الصلاحيات)
4. إذا لم تكن هناك صلاحية محددة للـ billing، استخدم فحص العضوية على الأقل (`verifyOrganizationAccess`)
5. حافظ على الحالة الأخرى (استعلام بـ userId بدون organizationId) كما هي

---

## المشكلة 4: إنشاء ملف vercel.json (أولوية متوسطة)

**الملف:** أنشئ `vercel.json` في **جذر المشروع** (بجانب `package.json` الرئيسي)

**المطلوب:**
1. أولاً اقرأ `package.json` في الجذر و `apps/web/next.config.ts` لفهم بنية المشروع
2. أنشئ الملف بالمحتوى التالي مع التعديل حسب ما تجده:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "regions": ["fra1"],
  "functions": {
    "apps/web/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/health",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

3. تحقق: هل يوجد `/api/health` endpoint في المشروع؟
   - إذا لا، أنشئ ملف `apps/web/app/api/health/route.ts` بسيط:
     ```typescript
     export async function GET() {
       return Response.json({ status: "ok", timestamp: new Date().toISOString() });
     }
     ```

---

## المشكلة 5: إنشاء صفحات الخطأ error.tsx (أولوية متوسطة)

**المشكلة:** لا يوجد أي ملف `error.tsx` في المشروع.

**المطلوب:**
1. اقرأ `apps/web/app/layout.tsx` و أي `layout.tsx` آخر لفهم التصميم العام والـ theme
2. اقرأ `apps/web/app/not-found.tsx` إذا وجد، لتستخدم نفس الأسلوب
3. اقرأ كيف يتم استخدام الترجمة (i18n) في المشروع — هل يمكن استخدامها في error.tsx؟ (عادةً لا لأنها "use client")

4. أنشئ الملفات التالية:

### 5.1: صفحة خطأ عامة
**الملف:** `apps/web/app/error.tsx`

```typescript
"use client";

// صفحة خطأ عامة — يجب أن تكون "use client"
// استخدم نفس تصميم المشروع (Tailwind + shadcn)
// يجب أن تعرض:
// - رسالة خطأ واضحة (عربي/إنجليزي حسب الممكن)
// - زر "حاول مرة أخرى" يستدعي reset()
// - زر "العودة للرئيسية"
// - تصميم نظيف يتناسب مع RTL
```

### 5.2: صفحة خطأ لقسم SaaS
**الملف:** `apps/web/app/(saas)/app/error.tsx`

نفس المحتوى تقريباً لكن مع زر "العودة للوحة التحكم" بدلاً من "العودة للرئيسية".

### 5.3: صفحة Global Error
**الملف:** `apps/web/app/global-error.tsx`

هذه تمسك أخطاء الـ root layout نفسه. يجب أن تحتوي على `<html>` و `<body>` كاملين لأنها تستبدل الـ layout.

**تنبيهات:**
- `error.tsx` يجب أن تكون `"use client"` دائماً
- يجب أن تستقبل `{ error, reset }` كـ props
- استخدم تصميم متوافق مع Dark Mode إذا كان المشروع يدعمه
- اجعلها تدعم RTL

---

## المشكلة 6: تنظيف تعريف الراوترات المضللة (أولوية منخفضة)

**المشكلة:** بعض الراوترات معرّفة كـ `publicProcedure.router()` لكن كل الإجراءات داخلها `protectedProcedure`. ليست ثغرة أمنية لكنها مضللة.

**الملفات:**
- `packages/api/modules/attachments/router.ts`
- `packages/api/modules/project-documents/router.ts`
- `packages/api/modules/project-chat/router.ts`
- `packages/api/modules/notifications/router.ts`

**المطلوب:**
1. اقرأ كل ملف
2. تحقق: هل فعلاً **كل** الإجراءات داخله تستخدم `protectedProcedure`؟
3. إذا نعم، غيّر `publicProcedure.router({` إلى `protectedProcedure.router({`
4. إذا كان هناك إجراء واحد على الأقل يستخدم `publicProcedure`، **لا تغيّر شيئاً** في ذلك الراوتر
5. تأكد أن الـ import صحيح (أن `protectedProcedure` مستورد)

---

## المشكلة 7: تغيير عنوان البريد المرسل (أولوية متوسطة)

**الملف:** `config/index.ts`

**المشكلة:** عنوان البريد المرسل لا يزال يستخدم النطاق الافتراضي `supastarter.dev`.

**المطلوب:**
1. اقرأ الملف
2. ابحث عن إعداد `mails.from` أو أي مكان يحدد عنوان المرسل
3. غيّره من القيمة الافتراضية إلى متغير بيئي أو قيمة قابلة للتعديل:

```typescript
// الحل المثالي: استخدام متغير بيئي
mails: {
    from: process.env.MAIL_FROM || "noreply@masar.app",
}
```

4. إذا لم يكن هناك متغير بيئي `MAIL_FROM`، أضفه كخيار

---

## بعد الانتهاء من جميع الإصلاحات

1. شغّل `pnpm run generate` في `packages/database` للتأكد من توليد Prisma Client بنجاح
2. شغّل `pnpm type-check` أو `pnpm build` للتأكد من عدم وجود أخطاء TypeScript
3. شغّل `pnpm lint` للتأكد من عدم وجود أخطاء Biome
4. اكتب ملخصاً بما تم إنجازه في ملف `FIXES_SUMMARY.md` في جذر المشروع:

```markdown
# ملخص الإصلاحات قبل النشر — [التاريخ]

## المشاكل التي تم إصلاحها

### 1. تحويل Float → Decimal
- الملفات المعدّلة: ...
- الحقول المحوّلة: ...

### 2. إضافة Rate Limiting
- الملفات المعدّلة: ...
- الحدود المضافة: ...

### 3. فحص صلاحيات list-purchases
- الملف: ...
- التعديل: ...

### 4. إنشاء vercel.json
- الإعدادات: ...

### 5. صفحات الخطأ
- الملفات المنشأة: ...

### 6. تنظيف الراوترات
- الملفات المعدّلة: ...

### 7. عنوان البريد المرسل
- التعديل: ...

## نتائج الاختبار
- TypeScript: ✅/❌
- Lint: ✅/❌
- Prisma Generate: ✅/❌
```

ابدأ الآن بالمشكلة 1 وتقدّم بالترتيب.
