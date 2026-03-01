# دليل نشر منصة مسار — من التطوير إلى الإنتاج

> تاريخ التحليل: 1 مارس 2026
> الإصدار: 1.0

---

## 1. ملخص تنفيذي

### حالة المشروع الحالية

| المقياس | العدد |
|---------|-------|
| صفحات Next.js | 150 صفحة |
| نماذج قاعدة البيانات (Prisma Models) | 85 نموذج |
| API Routers | 36 راوتر |
| مكونات React | 404 مكون |
| ملفات TSX الإجمالية | 649 ملف |
| Layout Files | 16 ملف |
| API Route Handlers | 3 معالجات |
| Loading Pages | 7 صفحات |
| Server Actions | 2 ملفات |
| المتغيرات البيئية | 42 متغير |
| وحدات المكونات (Modules) | 18 وحدة |
| اللغات المدعومة | 3 (العربية، الإنجليزية، الألمانية) |

### البنية التقنية

| التقنية | الإصدار |
|---------|---------|
| Next.js | 16.1.0 |
| React | 19.2.3 |
| TypeScript | 5.9.3 |
| Prisma ORM | أحدث إصدار |
| Better Auth | 1.4.7 |
| ORPC | 1.13.2 |
| Hono.js | 4.10.5 |
| Tailwind CSS | 4.1.17 |
| TanStack Query | 5.90.9 |
| Node.js | >= 20 (مطلوب) |
| pnpm | 10.14.0 (مطلوب بالضبط) |

### تقييم الجاهزية العام: جاهز مع تحفظات

المشروع في حالة جيدة للنشر مع بعض التحفظات التي يجب معالجتها:

### المشاكل الحرجة التي يجب إصلاحها قبل النشر

| # | المشكلة | الأولوية | الوقت المتوقع |
|---|---------|----------|---------------|
| 1 | 7 حقول Float يجب تحويلها إلى Decimal | عالية | 1-2 ساعة |
| 2 | نقص Rate Limiting على النقاط العامة (Contact, Newsletter) | عالية | 1 ساعة |
| 3 | نقص فحص صلاحيات في `list-purchases.ts` | عالية | 30 دقيقة |
| 4 | التأكد من إعداد CORS بشكل صحيح للإنتاج | حرجة | 15 دقيقة |
| 5 | عدم وجود `vercel.json` للتحكم في إعدادات Serverless | متوسطة | 30 دقيقة |
| 6 | عدم وجود Error Pages (error.tsx) | متوسطة | 1 ساعة |
| 7 | عدم وجود نظام مراقبة خارجي (Sentry أو مشابه) | متوسطة | 1-2 ساعة |

---

## 2. المشاكل والثغرات المكتشفة

### 2.1 مشاكل أمنية

#### مشكلة #1: نقص Rate Limiting على النقاط العامة (أولوية عالية)

**الوصف:** ثلاث نقاط API عامة (public endpoints) لا تحتوي على حماية Rate Limiting، مما يعرّضها لهجمات الإغراق (spam) واستنفاد الموارد.

| الملف | النقطة |
|-------|--------|
| `packages/api/modules/contact/procedures/submit-contact-form.ts` | نموذج التواصل |
| `packages/api/modules/newsletter/procedures/subscribe-to-newsletter.ts` | الاشتراك في النشرة |
| `packages/api/modules/organizations/procedures/generate-organization-slug.ts` | توليد slug المنظمة |

**الحل المقترح:** إضافة Rate Limiting باستخدام `createIpRateLimitKey()` الموجود في `packages/api/lib/rate-limit.ts`:
- Contact Form: حد `STRICT` (5 طلبات/دقيقة)
- Newsletter: حد `WRITE` (20 طلب/دقيقة)
- Slug Generation: حد `READ` (60 طلب/دقيقة)

**الوقت المتوقع:** 1 ساعة

---

#### مشكلة #2: نقص فحص صلاحيات في قائمة المشتريات (أولوية عالية)

**الملف:** `packages/api/modules/payments/procedures/list-purchases.ts` (سطر 23-28)

**الوصف:** عند استعلام مشتريات منظمة، لا يتم التحقق من أن المستخدم لديه صلاحية `settings.billing` داخل تلك المنظمة.

**الكود الحالي:**
```typescript
if (organizationId) {
    const purchases = await getPurchasesByOrganizationId(organizationId);
    return { purchases };
}
```

**الحل المقترح:** إضافة `verifyOrganizationAccess()` مع فحص صلاحية الفوترة قبل إرجاع البيانات.

**الوقت المتوقع:** 30 دقيقة

---

#### مشكلة #3: تعريف الراوترات المضلل (أولوية منخفضة)

**الوصف:** بعض الراوترات معرّفة كـ `publicProcedure.router()` لكن جميع الإجراءات داخلها تستخدم `protectedProcedure`. هذا ليس ثغرة أمنية فعلية لكنه مضلل.

**الملفات المتأثرة:**
- `packages/api/modules/attachments/router.ts`
- `packages/api/modules/project-documents/router.ts`
- `packages/api/modules/project-chat/router.ts`
- `packages/api/modules/notifications/router.ts`

**الحل:** تغيير `publicProcedure.router()` إلى `protectedProcedure.router()` للوضوح.

**الوقت المتوقع:** 15 دقيقة

---

### 2.2 مشاكل دقة البيانات

#### مشكلة #4: حقول Float بدلاً من Decimal (أولوية عالية)

**الوصف:** 7 حقول تستخدم نوع `Float` بدلاً من `Decimal`، مما قد يسبب مشاكل دقة في الحسابات المالية والنسب المئوية.

| النموذج | الحقل | الملف |
|---------|-------|-------|
| Project | progress | `packages/database/prisma/schema.prisma` |
| ProjectProgressUpdate | progress | `packages/database/prisma/schema.prisma` |
| Employee | defaultHoursPerDay | `packages/database/prisma/schema.prisma` |
| ProjectActivity | progress | `packages/database/prisma/schema.prisma` |
| ProjectActivity | weight | `packages/database/prisma/schema.prisma` |
| ProjectMilestone | progress | `packages/database/prisma/schema.prisma` |
| ProjectMilestone | weight | `packages/database/prisma/schema.prisma` |

**الحل:** تحويل هذه الحقول إلى `Decimal(5, 2)` في schema.prisma وتشغيل migration.

**الوقت المتوقع:** 1-2 ساعة

---

### 2.3 مشاكل البنية والأداء

#### مشكلة #5: عدم وجود صفحات خطأ (error.tsx)

**الوصف:** لا يوجد أي ملف `error.tsx` في المشروع (0 ملفات). هذا يعني أن أي خطأ غير متوقع سيعرض صفحة خطأ Next.js الافتراضية.

**الحل:** إنشاء ملفات `error.tsx` على الأقل في:
- `apps/web/app/error.tsx` (صفحة خطأ عامة)
- `apps/web/app/(saas)/app/error.tsx` (صفحة خطأ لقسم SaaS)

**الوقت المتوقع:** 1 ساعة

---

#### مشكلة #6: عدم وجود نظام مراقبة أخطاء

**الوصف:** لا يوجد تكامل مع أي خدمة مراقبة خارجية (Sentry, LogFlare, Axiom). في بيئة الإنتاج، هذا يعني أنك لن تعرف عن الأخطاء إلا إذا أبلغ المستخدمون.

**الحل المقترح:** تكامل مع Sentry (مجاني حتى 5000 خطأ/شهر).

**الوقت المتوقع:** 1-2 ساعة

---

#### مشكلة #7: عدم وجود `vercel.json`

**الوصف:** لا يوجد ملف `vercel.json` للتحكم في إعدادات النشر. Vercel سيستخدم الإعدادات الافتراضية، والتي قد لا تكون مثالية لهذا المشروع.

**الحل:** إنشاء `vercel.json` بالإعدادات المناسبة (انظر القسم 6).

**الوقت المتوقع:** 30 دقيقة

---

### 2.4 ملخص النتائج الإيجابية

| الفحص | النتيجة |
|-------|---------|
| حماية SQL Injection | ممتاز - Prisma ORM في كل مكان |
| التحقق من المدخلات (Input Validation) | ممتاز - Zod schemas على جميع النقاط |
| أمان رفع الملفات | ممتاز - فحص Magic Bytes + MIME + حجم |
| نظام الصلاحيات | ممتاز - حماية Cross-tenant + صلاحيات دقيقة |
| التحقق من Webhook | ممتاز - Stripe signature verification + idempotency |
| CSRF Protection | جيد - Session-based auth مع credentials: true |
| Security Headers | جيد - HSTS, CSP, X-Frame-Options مُعَدَّة |
| Audit Logging | جيد - تسجيل العمليات الإدارية والملفات |
| Rate Limiting | جيد على النقاط المحمية، ناقص على العامة |

---

## 3. المتطلبات — ماذا تحتاج قبل البدء

### 3.1 حسابات مطلوبة

| الخدمة | الغرض | مجاني/مدفوع | الرابط |
|--------|-------|-------------|--------|
| **Vercel** | استضافة التطبيق | مجاني (Hobby) / $20/شهر (Pro) | vercel.com |
| **Supabase** | قاعدة البيانات PostgreSQL | مجاني حتى 500MB / $25/شهر (Pro) | supabase.com |
| **Resend** أو بديل | إرسال البريد الإلكتروني | مجاني حتى 3000 رسالة/شهر | resend.com |
| **Stripe** | معالجة المدفوعات | رسوم على كل معاملة (2.9% + 30¢) | stripe.com |
| **AWS S3** أو Supabase Storage | تخزين الملفات | مجاني حتى 1GB (Supabase) | - |
| **Google Cloud Console** | OAuth (تسجيل دخول Google) | مجاني | console.cloud.google.com |
| **GitHub** | OAuth (تسجيل دخول GitHub) | مجاني | github.com/settings/developers |
| **Upstash** (اختياري) | Redis لـ Rate Limiting | مجاني حتى 10K طلب/يوم | upstash.com |
| **OpenAI** (اختياري) | ميزات الذكاء الاصطناعي | مدفوع حسب الاستخدام | platform.openai.com |

### 3.2 أدوات مطلوبة على جهازك

| الأداة | الإصدار المطلوب | أمر التحقق |
|--------|----------------|------------|
| Node.js | >= 20 | `node --version` |
| pnpm | 10.14.0 (بالضبط) | `pnpm --version` |
| Git | أحدث إصدار | `git --version` |
| Vercel CLI | أحدث إصدار | `npm i -g vercel` |
| Stripe CLI (اختياري) | أحدث إصدار | للاختبار المحلي للـ webhooks |

### 3.3 نطاق (Domain)

- تحتاج نطاقاً واحداً على الأقل (مثل `masar.sa` أو `app.masar.sa`)
- يمكنك البدء بالنطاق المجاني من Vercel (مثل `masar.vercel.app`) للاختبار
- لاحقاً تربط نطاقك الخاص مع شهادة SSL تلقائية من Vercel

### 3.4 تكاليف تقديرية شهرية

| السيناريو | التكلفة الشهرية التقديرية |
|-----------|--------------------------|
| **إطلاق تجريبي** (< 100 مستخدم) | $0 - $25 |
| Vercel Hobby (مجاني) | $0 |
| Supabase Free | $0 |
| Resend Free (3000 رسالة) | $0 |
| Upstash Free | $0 |
| Domain (.sa أو .com) | ~$10-50/سنة |
| | |
| **إنتاج صغير** (100-1000 مستخدم) | $50 - $100 |
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Resend (10K رسالة) | $0 |
| Upstash Pro | $10 |
| | |
| **إنتاج متوسط** (1000+ مستخدم) | $150 - $300+ |
| Vercel Pro | $20+ |
| Supabase Pro | $25+ |
| Resend Growth | $20+ |
| Upstash | $20+ |
| S3 Storage | $10+ |
| Stripe رسوم | حسب المبيعات |

---

## 4. المتغيرات البيئية الكاملة

### 4.1 جدول المتغيرات البيئية

#### قاعدة البيانات (إلزامي)

| المتغير | الوصف | إلزامي | من أين تحصل عليه | مثال |
|---------|-------|--------|------------------|------|
| `DATABASE_URL` | رابط اتصال PostgreSQL | نعم | Supabase Dashboard → Settings → Database → Connection String (Transaction pooler) | `postgresql://postgres.xxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | رابط اتصال مباشر (بدون pooler) | موصى | Supabase Dashboard → Settings → Database → Connection String (Direct) | `postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres` |

#### المصادقة (إلزامي)

| المتغير | الوصف | إلزامي | من أين تحصل عليه | مثال |
|---------|-------|--------|------------------|------|
| `BETTER_AUTH_SECRET` | مفتاح تشفير الجلسات (32 حرف على الأقل) | نعم | أنشئه بـ `openssl rand -base64 32` | `xY7k9mN2pQ...` |
| `GOOGLE_CLIENT_ID` | معرف OAuth لـ Google | نعم (إذا مفعّل) | Google Cloud Console → APIs & Services → Credentials | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | مفتاح OAuth لـ Google | نعم (إذا مفعّل) | نفس المكان | `GOCSPX-xxxx` |
| `GITHUB_CLIENT_ID` | معرف OAuth لـ GitHub | نعم (إذا مفعّل) | GitHub → Settings → Developer Settings → OAuth Apps | `Iv1.abc123` |
| `GITHUB_CLIENT_SECRET` | مفتاح OAuth لـ GitHub | نعم (إذا مفعّل) | نفس المكان | `abc123def456...` |

#### الموقع والروابط (إلزامي)

| المتغير | الوصف | إلزامي | من أين تحصل عليه | مثال |
|---------|-------|--------|------------------|------|
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع الكامل | نعم | رابط النشر على Vercel أو نطاقك | `https://masar.sa` |

#### البريد الإلكتروني (اختر مزوّداً واحداً — إلزامي)

**Resend (موصى):**

| المتغير | الوصف | إلزامي | من أين تحصل عليه |
|---------|-------|--------|------------------|
| `RESEND_API_KEY` | مفتاح API لـ Resend | نعم | resend.com → API Keys |

**Nodemailer (SMTP):**

| المتغير | الوصف | إلزامي |
|---------|-------|--------|
| `MAIL_HOST` | خادم SMTP | نعم |
| `MAIL_PORT` | منفذ SMTP | نعم |
| `MAIL_USER` | اسم المستخدم | نعم |
| `MAIL_PASS` | كلمة المرور | نعم |

**Postmark:**

| المتغير | الوصف | إلزامي |
|---------|-------|--------|
| `POSTMARK_SERVER_TOKEN` | Server Token | نعم |

**Mailgun:**

| المتغير | الوصف | إلزامي |
|---------|-------|--------|
| `MAILGUN_API_KEY` | مفتاح API | نعم |
| `MAILGUN_DOMAIN` | النطاق | نعم |

**Plunk:**

| المتغير | الوصف | إلزامي |
|---------|-------|--------|
| `PLUNK_API_KEY` | مفتاح API | نعم |

#### المدفوعات — Stripe (إلزامي للاشتراكات)

| المتغير | الوصف | إلزامي | من أين تحصل عليه |
|---------|-------|--------|------------------|
| `STRIPE_SECRET_KEY` | المفتاح السري لـ Stripe | نعم | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | مفتاح التحقق من Webhooks | نعم | Stripe Dashboard → Developers → Webhooks → Signing Secret |
| `NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY` | معرف سعر الاشتراك الشهري | نعم | Stripe Dashboard → Products → Price ID |
| `NEXT_PUBLIC_PRICE_ID_PRO_YEARLY` | معرف سعر الاشتراك السنوي | نعم | نفس المكان |
| `NEXT_PUBLIC_PRICE_ID_LIFETIME` | معرف سعر الشراء مدى الحياة | اختياري | نفس المكان |

#### التخزين — S3 (إلزامي لرفع الملفات)

| المتغير | الوصف | إلزامي | من أين تحصل عليه |
|---------|-------|--------|------------------|
| `S3_ENDPOINT` | نقطة اتصال S3 | نعم | Supabase Storage أو AWS S3 |
| `S3_ACCESS_KEY_ID` | معرف المفتاح | نعم | Supabase → Settings → API → service_role key |
| `S3_SECRET_ACCESS_KEY` | المفتاح السري | نعم | نفس المكان |
| `S3_REGION` | المنطقة | اختياري | يستخدم "auto" افتراضياً |
| `NEXT_PUBLIC_AVATARS_BUCKET_NAME` | اسم حاوية الصور الرمزية | اختياري | يستخدم "avatars" افتراضياً |

#### Redis (اختياري — موصى للإنتاج)

| المتغير | الوصف | إلزامي | من أين تحصل عليه |
|---------|-------|--------|------------------|
| `REDIS_URL` | رابط اتصال Redis | لا | Upstash Dashboard → Redis → Details |

> **ملاحظة:** بدون Redis، يستخدم النظام Rate Limiting في الذاكرة (in-memory) مع circuit breaker. هذا يعمل لكنه لا يتشارك بين instances مختلفة على Vercel.

#### الذكاء الاصطناعي (اختياري)

| المتغير | الوصف | إلزامي |
|---------|-------|--------|
| `OPENAI_API_KEY` | مفتاح OpenAI API | لا (فقط إذا مفعّل) |

#### التحليلات (اختياري — اختر واحداً)

| المتغير | الوصف |
|---------|-------|
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics GA4 |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Mixpanel |
| `NEXT_PUBLIC_PIRSCH_CODE` | Pirsch |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | Plausible |
| `NEXT_PUBLIC_UMAMI_TRACKING_ID` | Umami |

---

### 4.2 ملف `.env.production` جاهز للنسخ

```env
# ===================================
# قاعدة البيانات (إلزامي)
# ===================================
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# ===================================
# الموقع (إلزامي)
# ===================================
NEXT_PUBLIC_SITE_URL="https://your-domain.com"

# ===================================
# المصادقة (إلزامي)
# ===================================
BETTER_AUTH_SECRET="GENERATE_WITH_openssl_rand_-base64_32"

# Google OAuth (اختياري)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (اختياري)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# ===================================
# البريد الإلكتروني (اختر واحداً — إلزامي)
# ===================================
# Resend (موصى)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# أو Nodemailer SMTP
# MAIL_HOST="smtp.example.com"
# MAIL_PORT="587"
# MAIL_USER="user@example.com"
# MAIL_PASS="password"

# أو Postmark
# POSTMARK_SERVER_TOKEN="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# أو Mailgun
# MAILGUN_API_KEY="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# MAILGUN_DOMAIN="mg.your-domain.com"

# ===================================
# المدفوعات — Stripe (إلزامي)
# ===================================
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="price_xxxxxxxxxxxx"
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="price_xxxxxxxxxxxx"
NEXT_PUBLIC_PRICE_ID_LIFETIME="price_xxxxxxxxxxxx"

# ===================================
# التخزين — S3 (إلزامي)
# ===================================
S3_ENDPOINT="https://[PROJECT_REF].supabase.co/storage/v1/s3"
S3_ACCESS_KEY_ID="your-s3-access-key"
S3_SECRET_ACCESS_KEY="your-s3-secret-key"
S3_REGION="auto"
NEXT_PUBLIC_AVATARS_BUCKET_NAME="avatars"

# ===================================
# Redis (اختياري — موصى)
# ===================================
# REDIS_URL="rediss://default:xxxx@xxx.upstash.io:6379"

# ===================================
# الذكاء الاصطناعي (اختياري)
# ===================================
# OPENAI_API_KEY="sk-xxxxxxxxxxxx"

# ===================================
# التحليلات (اختياري — اختر واحداً)
# ===================================
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

---

## 5. خطوات النشر التفصيلية

### 5.1 إعداد قاعدة البيانات (Supabase)

#### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وسجّل دخول
2. اضغط "New Project"
3. اختر Organization (أو أنشئ واحدة)
4. أدخل اسم المشروع: `masar-production`
5. أنشئ كلمة مرور قوية لقاعدة البيانات (احفظها!)
6. اختر المنطقة الأقرب لمستخدميك:
   - للسعودية: `Middle East (Bahrain)` أو `Europe (Frankfurt)`
7. اختر الخطة (Free للبداية، Pro للإنتاج)
8. اضغط "Create new project" وانتظر 2-3 دقائق

#### الخطوة 2: الحصول على روابط الاتصال

1. اذهب إلى **Settings → Database**
2. انسخ **Connection string (Transaction pooler)** ← هذا هو `DATABASE_URL`
   - استبدل `[YOUR-PASSWORD]` بكلمة المرور التي أنشأتها
   - أضف `?pgbouncer=true` في النهاية
3. انسخ **Connection string (Direct)** ← هذا هو `DIRECT_URL`
   - استبدل `[YOUR-PASSWORD]` بكلمة المرور

#### الخطوة 3: تشغيل Schema Push

```bash
# من جذر المشروع
cd packages/database
pnpm run push
```

**النتيجة المتوقعة:** رسالة نجاح "Your database is now in sync with your Prisma schema"

**أخطاء محتملة:**
- `P1001: Can't reach database server` → تأكد من صحة رابط الاتصال وأن الـ IP مسموح به
- `P3005: Database schema is not empty` → القاعدة تحتوي بيانات سابقة، استخدم `pnpm run push --accept-data-loss` (بحذر!)

#### الخطوة 4: توليد Prisma Client و Zod Types

```bash
cd packages/database
pnpm run generate
```

**ملاحظة هامة:** هذا الأمر يستخدم `dotenv -c` لتحميل `.env.local` ويشغّل `fix-zod-import.js` تلقائياً بعد التوليد.

---

### 5.2 إعداد التخزين (Supabase Storage / S3)

#### الخيار أ: Supabase Storage (الأسهل)

1. في Supabase Dashboard اذهب إلى **Storage**
2. أنشئ Bucket جديد باسم `avatars` (Public)
3. أنشئ Bucket آخر باسم `attachments` (Private)
4. اذهب إلى **Settings → API**:
   - `S3_ENDPOINT`: `https://[PROJECT_REF].supabase.co/storage/v1/s3`
   - `S3_ACCESS_KEY_ID`: استخدم `service_role` key
   - `S3_SECRET_ACCESS_KEY`: نفس المفتاح

#### الخيار ب: AWS S3

1. أنشئ حساب AWS وفعّل IAM user
2. أنشئ S3 Buckets في المنطقة المناسبة
3. أعطِ صلاحيات `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
4. استخدم Access Key و Secret Key في المتغيرات البيئية

#### الخيار ج: أي مزوّد S3-Compatible (Wasabi, MinIO, Cloudflare R2)

الكود يدعم `forcePathStyle` (في `packages/storage/provider/s3/index.ts`) مما يسمح باستخدام أي مزوّد S3-compatible.

**تأكد من تحديث `remotePatterns` في `apps/web/next.config.ts`** لتشمل نطاق التخزين الخاص بك:

```typescript
remotePatterns: [
  // أضف نطاق التخزين الخاص بك هنا
  { hostname: "*.supabase.co" },
]
```

---

### 5.3 إعداد البريد الإلكتروني

#### Resend (الخيار الموصى)

1. سجّل في [resend.com](https://resend.com)
2. أضف نطاقك وتحقق من DNS records (SPF, DKIM, DMARC)
3. أنشئ API Key من **API Keys**
4. تأكد أن العنوان المرسل في `config/index.ts` يطابق نطاقك:

**الملف:** `config/index.ts`
```typescript
mails: {
    from: "noreply@supastarter.dev", // ← غيّر هذا لنطاقك
}
```

**اختبار:** بعد النشر، جرب تسجيل حساب جديد وتأكد من وصول بريد التحقق.

**قوالب البريد المستخدمة في المشروع:**
- `EmailVerification` — التحقق من البريد عند التسجيل
- `ForgotPassword` — استعادة كلمة المرور
- `MagicLink` — رابط الدخول السحري
- `NewUser` — ترحيب بمستخدم جديد
- `OrganizationInvitation` — دعوة لمنظمة
- `NewsletterSignup` — تأكيد الاشتراك في النشرة

---

### 5.4 إعداد Redis (اختياري — موصى)

#### Upstash (الخيار الموصى لـ Serverless)

1. سجّل في [upstash.com](https://upstash.com)
2. أنشئ Redis Database:
   - اختر المنطقة الأقرب (مثل `eu-central-1`)
   - فعّل TLS
3. انسخ **Redis URL** (بصيغة `rediss://`)
4. ضعه في `REDIS_URL`

**ملاحظة:** الكود في `packages/api/lib/rate-limit.ts` يستخدم:
- اتصال lazy (لا يتصل حتى يُطلب)
- Circuit breaker (3 أخطاء متتالية = يتحول للذاكرة)
- Max retries: 1 لكل طلب
- Connection timeout: 3000ms

**بدون Redis:** النظام يعمل بـ in-memory rate limiting (كافٍ لبداية صغيرة لكنه لا يتشارك بين Serverless functions مختلفة).

---

### 5.5 إعداد OAuth

#### Google OAuth

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروعاً جديداً أو اختر موجوداً
3. اذهب إلى **APIs & Services → Credentials**
4. اضغط **Create Credentials → OAuth client ID**
5. اختر **Web application**
6. أضف في **Authorized redirect URIs**:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
7. انسخ Client ID و Client Secret

#### GitHub OAuth

1. اذهب إلى [GitHub Developer Settings](https://github.com/settings/developers)
2. اضغط **New OAuth App**
3. أدخل:
   - **Application name:** Masar
   - **Homepage URL:** `https://your-domain.com`
   - **Authorization callback URL:** `https://your-domain.com/api/auth/callback/github`
4. انسخ Client ID
5. أنشئ Client Secret وانسخه

**تنبيه هام:** رابط الـ callback يجب أن يطابق `NEXT_PUBLIC_SITE_URL` تماماً. تأكد من أن المصادقة في `packages/auth/auth.ts` تستخدم `getBaseUrl()` الذي يعتمد على هذا المتغير.

---

### 5.6 إعداد المدفوعات (Stripe)

#### الخطوة 1: إعداد حساب Stripe

1. سجّل في [stripe.com](https://stripe.com) وفعّل حسابك
2. **مهم للسعودية:** أكمل متطلبات KYC (Know Your Customer)

#### الخطوة 2: إنشاء المنتجات والأسعار

المشروع يحتوي على ملف `packages/payments/stripe-products.ts` يعرّف المنتجات بالريال السعودي (SAR). يمكنك استخدام سكريبت البذر:

```bash
cd packages/payments
npx ts-node seed-stripe-products.ts
```

أو إنشائها يدوياً في Stripe Dashboard:

1. **خطة Pro الشهرية:** $29/شهر (أو ما يقابلها بالريال) — seat-based, 7 أيام تجربة مجانية
2. **خطة Pro السنوية:** $290/سنة — seat-based, 7 أيام تجربة مجانية
3. **خطة Lifetime:** $799 — دفعة واحدة

4. انسخ Price IDs وضعها في المتغيرات البيئية

#### الخطوة 3: إعداد Webhooks

1. في Stripe Dashboard اذهب إلى **Developers → Webhooks**
2. أضف Endpoint جديد:
   - **URL:** `https://your-domain.com/api/webhooks/payments`
   - **Events المطلوبة:**
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `customer.subscription.paused`
     - `customer.subscription.resumed`
     - `invoice.paid`
     - `invoice.payment_failed`
3. انسخ **Signing Secret** ← هذا هو `STRIPE_WEBHOOK_SECRET`

**التحقق من Webhook:** الكود في `packages/payments/provider/stripe/index.ts` (سطر 146-149) يتحقق من التوقيع باستخدام `constructEventAsync` ويرفض الطلبات غير الموقّعة.

---

### 5.7 تشغيل Migrations على قاعدة الإنتاج

**هام:** هذا المشروع يستخدم `db push` وليس `prisma migrate`. هذا يعني أنه لا توجد migration files تقليدية.

```bash
# تأكد أن .env.local يحتوي على DATABASE_URL للإنتاج
cd packages/database
pnpm run push
```

**ما يفعله هذا الأمر:**
1. يقارن schema.prisma مع قاعدة البيانات الحالية
2. ينشئ/يعدّل الجداول والأعمدة والفهارس تلقائياً
3. **تحذير:** قد يحذف بيانات إذا كان هناك تغييرات جذرية في Schema

**للإنتاج يُفضّل:** التحويل إلى `prisma migrate` للتحكم الكامل:
```bash
# توليد migration
npx prisma migrate dev --name init

# تطبيق على الإنتاج
npx prisma migrate deploy
```

**الفهارس المعرّفة:** المشروع يحتوي على 40+ فهرس (indexes) مُعرّف في schema.prisma بما في ذلك:
- فهارس مركبة (composite): `[costStudyId, category]`, `[projectId, reportDate]`, `[projectId, status]`
- فهارس فريدة (unique): `[organizationId, name]` (أسماء الأدوار)، `[organizationId, slug]` (slugs المشاريع)
- جميعها تُنشأ تلقائياً مع `db push`

---

### 5.8 النشر على Vercel (خطوة بخطوة)

#### الخطوة 1: ربط المشروع

```bash
# من جذر المشروع
vercel login
vercel link
```

أو من خلال Vercel Dashboard:
1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اختر **Import Git Repository**
3. اربط مستودع GitHub الخاص بك
4. Vercel سيكتشف تلقائياً أنه monorepo

#### الخطوة 2: إعداد المشروع

1. **Root Directory:** اتركه فارغاً (جذر المشروع)
2. **Framework Preset:** Next.js (يُكتشف تلقائياً)
3. **Build Command:** اتركه الافتراضي — Turbo سيدير عملية البناء
4. **Output Directory:** اتركه الافتراضي (`.next`)
5. **Install Command:** `pnpm install`

#### الخطوة 3: إضافة المتغيرات البيئية

1. في Vercel Dashboard → Project → **Settings → Environment Variables**
2. أضف **جميع** المتغيرات من القسم 4.2
3. تأكد من اختيار البيئة الصحيحة (Production / Preview / Development)
4. **تنبيه:** المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` تكون متاحة في المتصفح

#### الخطوة 4: إعدادات البناء المهمة

1. اذهب إلى **Settings → General**
2. تأكد من:
   - **Node.js Version:** 20.x
   - **Build & Development Settings → Root Directory:** `.` أو اتركه فارغاً

#### الخطوة 5: النشر الأول

```bash
vercel --prod
```

أو اضغط **Deploy** من Dashboard.

**النتيجة المتوقعة:**
- عملية البناء تستغرق 3-8 دقائق
- Turbo يشغّل `generate` ثم `build`
- Prisma Client يُنشأ تلقائياً (بفضل `@prisma/nextjs-monorepo-workaround-plugin` في `next.config.ts`)

**أخطاء محتملة:**

| الخطأ | السبب | الحل |
|-------|-------|------|
| `Cannot find module '@prisma/client'` | لم يُشغّل generate | تأكد من أن Turbo يشغّل generate قبل build (مُعَد في turbo.json) |
| `BETTER_AUTH_SECRET is required` | متغير بيئي ناقص | أضف المتغير في Vercel Dashboard |
| `P1001: Can't reach database` | DATABASE_URL خاطئ | تأكد من الرابط واسمح بـ Vercel IPs في Supabase |
| `Module not found: 'pg-native'` | مُعالج في webpack config | تأكد من وجود `externals` في next.config.ts |
| Build timeout | البناء يستغرق وقتاً طويلاً | فعّل Remote Caching في Vercel |

---

### 5.9 ربط النطاق و SSL

1. في Vercel Dashboard → **Settings → Domains**
2. أضف نطاقك (مثل `masar.sa`)
3. Vercel سيعطيك DNS records لإضافتها عند مسجّل النطاق:
   - عادةً A record إلى `76.76.21.21`
   - أو CNAME record إلى `cname.vercel-dns.com`
4. بعد تحديث DNS (قد يستغرق 24 ساعة):
   - SSL certificate يُنشأ تلقائياً
   - HTTPS يعمل مباشرة

**تنبيه حرج:** بعد ربط النطاق:
1. حدّث `NEXT_PUBLIC_SITE_URL` إلى النطاق الجديد
2. حدّث OAuth Callback URLs (Google و GitHub) إلى النطاق الجديد
3. حدّث Stripe Webhook URL إلى النطاق الجديد
4. أعد النشر: `vercel --prod`

---

### 5.10 اختبار ما بعد النشر

#### اختبارات فورية:

```
□ فتح الموقع — هل تظهر الصفحة الرئيسية؟
□ التبديل بين العربية والإنجليزية
□ تسجيل حساب جديد — هل يصل بريد التحقق؟
□ تسجيل الدخول بالبريد وكلمة المرور
□ تسجيل الدخول بـ Google OAuth
□ تسجيل الدخول بـ GitHub OAuth
□ إنشاء منظمة جديدة
□ الاشتراك في خطة Pro (استخدم بطاقة اختبار Stripe: 4242 4242 4242 4242)
□ رفع صورة (avatar)
□ رفع مرفق في مشروع
□ إنشاء فاتورة وتحميل PDF
□ التأكد من صفحة /api/health (يجب أن ترجع 200)
```

---

## 6. تحديات Vercel Serverless

### 6.1 جدول التحديات والحلول

| التحدي | الوصف | الحل |
|--------|-------|------|
| **Cold Starts مع Prisma** | Prisma Client يستغرق وقتاً للتهيئة في كل cold start | استخدم `@prisma/nextjs-monorepo-workaround-plugin` (موجود في `next.config.ts`). يُنشئ Prisma engine مع الـ function |
| **Connection Pooling** | Serverless يفتح اتصالات جديدة مع كل طلب | استخدم Supabase Transaction Pooler (PgBouncer) عبر `DATABASE_URL` مع `?pgbouncer=true` |
| **Function Timeout** | الحد الأقصى 10 ثوانٍ (Hobby) أو 60 ثانية (Pro) | العمليات الثقيلة (PDF generation, exports) يجب أن تكون أقل من 10 ثوانٍ |
| **Body Size Limit** | حد 4.5MB على Vercel Serverless | الكود يحدد 10MB (`packages/api/index.ts` سطر 16) لكن Vercel يحد عند 4.5MB. رفع الملفات يتم عبر Signed URLs لـ S3 (صحيح) |
| **لا WebSocket** | Vercel لا يدعم WebSocket مباشرة | الـ chat في المشروع يستخدم polling وليس WebSocket |
| **Cron Jobs** | قد تحتاج مهام مجدولة | استخدم Vercel Cron Jobs في `vercel.json` |
| **Region Selection** | الأداء يعتمد على قرب الخادم | اختر `cdg1` (باريس) أو `fra1` (فرانكفورت) الأقرب للسعودية |
| **بيئة البناء** | Native dependencies (Sharp, Prisma) تحتاج rebuild | Vercel يعيد بناءها تلقائياً. مُعَد في `pnpm` config `onlyBuiltDependencies` |

### 6.2 إعدادات vercel.json المطلوبة

أنشئ ملف `vercel.json` في جذر المشروع:

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

**ملاحظات:**
- `regions: ["fra1"]` — فرانكفورت (الأقرب لمنطقة الخليج)
- `maxDuration: 30` — 30 ثانية كحد أقصى لـ API functions (يحتاج Vercel Pro)
- Cron job كل 5 دقائق لمنع cold starts المتكرر

### 6.3 Cron Jobs المطلوبة

حالياً لا يوجد cron jobs مُعَدّة في المشروع. مع النمو قد تحتاج:

| المهمة | التكرار | الغرض |
|--------|---------|-------|
| Health Check | كل 5 دقائق | تقليل cold starts |
| تنظيف الجلسات المنتهية | يومياً | أداء قاعدة البيانات |
| إرسال الملخصات (Digests) | أسبوعياً | ميزة DigestSubscription |
| تنبيهات المشاريع المتأخرة | يومياً | ميزة ProjectAlert |

---

## 7. قائمة مراجعة ما بعد النشر (Checklist)

### 7.1 اختبارات يدوية يجب تنفيذها

#### المصادقة والأمان
```
□ تسجيل حساب جديد بالبريد الإلكتروني
□ التحقق من البريد الإلكتروني (verification email)
□ تسجيل الدخول بالبريد وكلمة المرور
□ تسجيل الدخول بـ Google OAuth
□ تسجيل الدخول بـ GitHub OAuth
□ تسجيل الدخول بـ Magic Link
□ استعادة كلمة المرور (Forgot Password)
□ تفعيل المصادقة الثنائية (2FA)
□ تسجيل الدخول بـ Passkey (WebAuthn)
□ تسجيل الخروج والتأكد من حذف الجلسة
□ محاولة الوصول لـ /app بدون تسجيل دخول (يجب التحويل إلى login)
```

#### المنظمات والصلاحيات
```
□ إنشاء منظمة جديدة
□ دعوة عضو جديد (invitation email)
□ قبول دعوة
□ التحقق من الأدوار (MANAGER, ENGINEER, SUPERVISOR, ACCOUNTANT, VIEWER)
□ إنشاء مشروع جديد
□ التحقق من أن المستخدم لا يستطيع الوصول لمشاريع منظمة أخرى (cross-tenant)
```

#### المدفوعات
```
□ الاشتراك في خطة Pro (بطاقة اختبار: 4242 4242 4242 4242)
□ التأكد من تحديث حالة المنظمة بعد الدفع
□ إلغاء الاشتراك
□ التأكد من التحويل إلى read-only بعد الإلغاء
□ Webhook يعمل (تحقق من Stripe Dashboard → Webhooks → Recent Deliveries)
```

#### رفع الملفات
```
□ رفع صورة شخصية (avatar)
□ رفع شعار المنظمة
□ رفع مرفقات في مشروع
□ التأكد من ظهور الصور المرفوعة
□ التأكد من أن الحد الأقصى للملفات يعمل (100MB)
```

#### الوحدات الرئيسية
```
□ إنشاء مشروع وتعبئة البيانات
□ إنشاء تقرير يومي
□ إنشاء فاتورة وتحميل PDF
□ إنشاء عرض سعر
□ دراسة تكلفة جديدة
□ التبديل بين العربية والإنجليزية
□ اختبار الـ Dark Mode
```

### 7.2 نقاط أمنية يجب التحقق منها

```
□ HTTPS يعمل بشكل صحيح (لا HTTP)
□ Security headers موجودة (افحص بـ securityheaders.com)
□ HSTS مفعّل (Strict-Transport-Security header)
□ CSP header موجود على /app/* و /auth/*
□ X-Frame-Options: DENY على الصفحات الحساسة
□ Cookie attributes: HttpOnly, Secure, SameSite
□ CORS يقبل فقط النطاق الصحيح (ليس wildcard *)
□ Rate limiting يعمل (أرسل 100 طلب سريع وتأكد من الحجب)
□ Webhook endpoint يرفض الطلبات بدون توقيع صحيح
□ /api/docs-search لا يكشف معلومات حساسة
□ لا يمكن الوصول لـ .env من المتصفح
```

### 7.3 أداء يجب قياسه

```
□ TTFB (Time to First Byte) < 500ms
□ LCP (Largest Contentful Paint) < 2.5s
□ زمن استجابة API < 200ms للعمليات العادية
□ Cold start time < 3 ثوانٍ
□ استجابة قاعدة البيانات < 100ms
□ حجم JavaScript Bundle مقبول
□ افحص بـ Google PageSpeed Insights
□ افحص بـ Vercel Analytics (Speed Insights)
```

---

## 8. حل المشاكل الشائعة (Troubleshooting)

### 8.1 مشاكل البناء والنشر

| الأعراض | السبب | الحل |
|---------|-------|------|
| `Cannot find module '@prisma/client'` | Prisma Client لم يُنشأ | تأكد من ترتيب Turbo: `generate` → `build`. تحقق من `turbo.json` أن `build.dependsOn` يحتوي `^generate` |
| `Module not found: 'pg-native'` | Dependency اختيارية غير موجودة | مُعالج في `next.config.ts` webpack config: `externals: ['pg-native', 'cloudflare:sockets']` |
| `ENOMEM: out of memory` | البناء يستهلك ذاكرة كبيرة | أضف في Vercel: `NODE_OPTIONS=--max-old-space-size=4096` |
| `Type error` أثناء البناء | TypeScript strict mode | أصلح الخطأ — strict mode مفعّل ولا يمكن تجاهله |
| Build timeout (> 45 دقيقة) | البناء بطيء بدون cache | فعّل Vercel Remote Caching. `turbo.json` مُعَد لاستبعاد `.next/cache` |
| `pnpm: command not found` | Vercel لا يعرف pnpm | أضف `"packageManager": "pnpm@10.14.0"` في root `package.json` (موجود) |

### 8.2 مشاكل قاعدة البيانات

| الأعراض | السبب | الحل |
|---------|-------|------|
| `P1001: Can't reach database` | IP محجوب أو رابط خاطئ | في Supabase: Settings → Database → Network → Allow All IPs (أو Vercel IPs) |
| `P2002: Unique constraint failed` | محاولة إدخال قيمة مكررة | تحقق من القيود الفريدة في schema.prisma |
| `P2025: Record not found` | البيانات غير موجودة | تأكد من وجود البيانات قبل التحديث/الحذف |
| `prepared statement already exists` | Connection pooler issue | استخدم `?pgbouncer=true` في `DATABASE_URL` |
| `too many connections` | Serverless يفتح اتصالات كثيرة | استخدم Transaction Pooler (PgBouncer) من Supabase |
| بطء الاستعلامات | نقص فهارس | الفهارس مُعرّفة في schema (40+). تأكد من تطبيقها بـ `db push` |

### 8.3 مشاكل المصادقة

| الأعراض | السبب | الحل |
|---------|-------|------|
| `UNAUTHORIZED` على كل الطلبات | `BETTER_AUTH_SECRET` مختلف | تأكد من أن المفتاح نفسه في التطوير والإنتاج |
| OAuth redirect error | Callback URL خاطئ | تأكد أن OAuth callback URLs تطابق `NEXT_PUBLIC_SITE_URL` |
| "حسابك معطّل" | المستخدم `isActive = false` | تفعيل المستخدم من Admin Panel أو قاعدة البيانات |
| Session تنتهي بسرعة | إعداد `sessionCookieMaxAge` | المُعَد: 30 يوم. تأكد من `config/index.ts` |
| Google login لا يعمل | Missing client credentials | تأكد من `GOOGLE_CLIENT_ID` و `GOOGLE_CLIENT_SECRET` |

### 8.4 مشاكل المدفوعات

| الأعراض | السبب | الحل |
|---------|-------|------|
| Checkout لا يعمل | `STRIPE_SECRET_KEY` خاطئ | تأكد أنك تستخدم Live Key (يبدأ بـ `sk_live_`) وليس Test Key |
| Webhook يرجع 400 | `STRIPE_WEBHOOK_SECRET` خاطئ | أعد نسخ Secret من Stripe Dashboard → Webhooks |
| الاشتراك لا يتحدث | Events لا تصل | تحقق من Stripe Dashboard → Webhooks → Recent Deliveries |
| خطأ "subscription_required" | المنظمة على خطة مجانية | الخطة المجانية read-only. اشترك في Pro |
| خطأ "trial_expired" | انتهت الفترة التجريبية | الترقية أو تمديد Trial من Admin |

### 8.5 مشاكل التخزين

| الأعراض | السبب | الحل |
|---------|-------|------|
| رفع الملفات يفشل | S3 credentials خاطئة | تأكد من `S3_ACCESS_KEY_ID` و `S3_SECRET_ACCESS_KEY` |
| الصور لا تظهر | نطاق S3 غير مسموح | أضف نطاق S3 في `remotePatterns` في `next.config.ts` |
| خطأ CORS عند الرفع | Bucket policy | أضف CORS policy على S3 Bucket للسماح بنطاقك |
| `413 Entity Too Large` | حد حجم Vercel | الحد 4.5MB. الرفع المباشر يتم عبر Signed URLs (صحيح) |

---

## 9. خطة الإطلاق المرحلية

### الأسبوع 1: إصلاحات + بنية تحتية

| اليوم | المهمة | التفاصيل |
|-------|--------|----------|
| **1-2** | إصلاح المشاكل الحرجة | - تحويل 7 حقول Float → Decimal في schema.prisma<br>- إضافة Rate Limiting على Public Endpoints<br>- إضافة Permission Check في list-purchases |
| **2-3** | إنشاء الحسابات | - Supabase (قاعدة بيانات الإنتاج)<br>- Stripe (Live mode + Products)<br>- Resend (بريد إلكتروني)<br>- Upstash (Redis)<br>- Google + GitHub OAuth Apps |
| **3-4** | إعداد البنية التحتية | - إنشاء قاعدة البيانات على Supabase<br>- إعداد S3 Buckets<br>- إعداد Stripe Products و Webhooks<br>- تحضير جميع المتغيرات البيئية |
| **4-5** | أول نشر تجريبي | - ربط المشروع بـ Vercel<br>- إضافة المتغيرات البيئية<br>- أول `vercel --prod`<br>- اختبار أن الموقع يفتح |
| **5-7** | إنشاء صفحات الخطأ + Monitoring | - إنشاء error.tsx<br>- تكامل Sentry أو بديل<br>- إنشاء vercel.json |

### الأسبوع 2-3: إطلاق تجريبي (Soft Launch)

| المهمة | التفاصيل |
|--------|----------|
| اختبار شامل | تنفيذ قائمة المراجعة كاملة (القسم 7) |
| ربط النطاق | شراء نطاق + ربطه بـ Vercel + تحديث OAuth URLs |
| اختبار المدفوعات | اختبار Stripe Live mode بمبالغ صغيرة حقيقية |
| دعوة مستخدمين تجريبيين | 5-10 مستخدمين لاختبار المنصة |
| مراقبة الأخطاء | متابعة Sentry + Vercel Logs يومياً |
| قياس الأداء | Google PageSpeed + Vercel Speed Insights |
| اختبار الأمان | فحص securityheaders.com + اختبار Rate Limiting |

### الأسبوع 4+: تحسينات وإطلاق كامل

| المهمة | التفاصيل |
|--------|----------|
| تحسين الأداء | - تفعيل Vercel Remote Caching<br>- مراجعة cold starts<br>- تحسين حجم JS bundles |
| تحسين الأمان | - مراجعة CSP headers<br>- تقليل session duration إلى 14 يوم (اختياري)<br>- إضافة brute force protection |
| إعداد CI/CD | - مراجعة GitHub Actions (validate-prs.yml موجود)<br>- إضافة deployment preview للـ PRs |
| التوسع | - مراقبة استخدام قاعدة البيانات<br>- التحويل إلى Supabase Pro عند الحاجة<br>- إعداد نسخ احتياطية دورية |
| التوثيق | - توثيق العمليات التشغيلية<br>- إعداد runbook للأخطاء الشائعة<br>- توثيق إجراءات الطوارئ |

---

## الملحق أ: ملخص الخدمات الخارجية المستخدمة

| الخدمة | النوع | الحالة | إلزامي | الحزمة |
|--------|-------|--------|--------|--------|
| **Stripe** | مدفوعات | مُفعّل (أساسي) | نعم | `stripe@19.3.1` |
| Lemon Squeezy | مدفوعات | بديل جاهز | لا | `@lemonsqueezy/lemonsqueezy.js@4.0.0` |
| Polar | مدفوعات | بديل جاهز | لا | `@polar-sh/sdk@0.41.4` |
| DodoPayments | مدفوعات | بديل جاهز | لا | `dodopayments@2.8.0` |
| Creem | مدفوعات | بديل جاهز | لا | fetch-based |
| **Resend** | بريد إلكتروني | موصى | نعم (واحد) | `resend@6.4.2` |
| Nodemailer | بريد إلكتروني | بديل SMTP | لا | `nodemailer@7.0.10` |
| Postmark | بريد إلكتروني | بديل | لا | fetch-based |
| Mailgun | بريد إلكتروني | بديل | لا | fetch-based |
| Plunk | بريد إلكتروني | بديل | لا | fetch-based |
| **AWS S3** | تخزين | أساسي | نعم | `@aws-sdk/client-s3@3.437.0` |
| **PostgreSQL** | قاعدة بيانات | أساسي | نعم | Prisma ORM |
| **Better Auth** | مصادقة | أساسي | نعم | `better-auth@1.4.7` |
| Google OAuth | مصادقة اجتماعية | مفعّل | لا | عبر Better Auth |
| GitHub OAuth | مصادقة اجتماعية | مفعّل | لا | عبر Better Auth |
| Redis (ioredis) | Rate Limiting | اختياري | لا | `ioredis@5.9.3` |
| **OpenAI** | ذكاء اصطناعي | مفعّل | لا | `@ai-sdk/openai@2.0.65` |
| Anthropic | ذكاء اصطناعي | متاح | لا | `@ai-sdk/anthropic@2.0.44` |
| Google Analytics | تحليلات | اختياري | لا | `@next/third-parties` |
| PostHog | تحليلات | اختياري | لا | `posthog-js` |
| Mixpanel | تحليلات | اختياري | لا | `mixpanel-browser` |
| Vercel Analytics | تحليلات | اختياري | لا | `@vercel/analytics` |
| Umami | تحليلات | اختياري | لا | script tag |
| Pirsch | تحليلات | اختياري | لا | script tag |
| Plausible | تحليلات | اختياري | لا | script tag |
| React Email | قوالب بريد | مُضمّن | نعم | `react-email@5.0.4` |

---

## الملحق ب: هيكل المشروع

```
supastarter-nextjs-3/
├── apps/
│   └── web/                              ← تطبيق Next.js 16
│       ├── app/                          ← App Router (150 صفحة)
│       │   ├── (marketing)/              ← صفحات التسويق (8 صفحات)
│       │   ├── (saas)/                   ← قسم SaaS
│       │   │   ├── app/(account)/        ← الحساب + Admin (16 صفحة)
│       │   │   └── app/(organizations)/  ← المنظمات (134 صفحة)
│       │   ├── auth/                     ← صفحات المصادقة (6 صفحات)
│       │   ├── owner/                    ← بوابة المالك (6 صفحات)
│       │   └── share/                    ← الروابط المشتركة
│       ├── modules/                      ← 18 وحدة (404 مكون)
│       │   └── saas/
│       │       ├── finance/              ← 86 مكون
│       │       ├── projects/             ← 78 مكون
│       │       ├── pricing/              ← 48 مكون
│       │       ├── company/              ← 26 مكون
│       │       ├── shared/               ← 23 مكون
│       │       ├── settings/             ← 21 مكون
│       │       ├── admin/                ← 19 مكون
│       │       ├── organizations/        ← 18 مكون
│       │       └── ...                   ← باقي الوحدات
│       ├── next.config.ts                ← إعدادات + Security Headers
│       ├── proxy.ts                      ← Middleware (auth routing)
│       └── playwright.config.ts          ← E2E testing
│
├── packages/
│   ├── api/                              ← ORPC + Hono (36 راوتر)
│   │   ├── modules/                      ← الوحدات (procedures)
│   │   ├── orpc/                         ← Router + Procedures + Middleware
│   │   └── lib/                          ← Helpers (rate-limit, permissions)
│   ├── auth/                             ← Better Auth
│   ├── database/                         ← Prisma (85 نموذج)
│   │   └── prisma/schema.prisma
│   ├── i18n/                             ← الترجمات (ar.json, en.json)
│   ├── mail/                             ← 5 مزودي بريد + 6 قوالب
│   ├── payments/                         ← 5 مزودي دفع
│   ├── storage/                          ← S3 provider
│   ├── ai/                               ← OpenAI integration
│   ├── logs/                             ← Consola logging
│   └── utils/                            ← أدوات مساعدة
│
├── config/                               ← Feature Flags + App Config
├── tooling/typescript/                    ← Shared tsconfig
├── .github/workflows/                    ← CI: Biome lint + E2E tests
├── turbo.json                            ← Monorepo task orchestration
├── biome.json                            ← Linter + Formatter
├── package.json                          ← Root (pnpm 10.14.0, Node >= 20)
└── .env.local.example                    ← قالب المتغيرات البيئية
```

---

## الملحق ج: أرقام Schema القاعدة

| الفئة | عدد النماذج | أمثلة |
|-------|-------------|-------|
| المصادقة والتفويض | 7 | User, Session, Account, Role, Passkey, TwoFactor |
| المنظمات والاشتراكات | 7 | Organization, Member, Invitation, PlanConfig, Purchase |
| المشاريع والتنفيذ | 27 | Project, ProjectMember, DailyReport, Activity, Milestone |
| المالية والفواتير | 14 | Client, Invoice, Payment, Quotation, FinanceTemplate |
| إدارة الشركة | 10 | Employee, Asset, PayrollRun, CompanyExpense |
| دراسات التكلفة | 5 | CostStudy, StructuralItem, FinishingItem, MEPItem |
| الاتصالات | 4 | Notification, MessageDeliveryLog, DigestSubscription |
| الإعدادات | 3 | IntegrationSettings, FinanceSettings, ShareLink |
| التدقيق | 2 | ProjectAuditLog, OrganizationAuditLog |
| التسلسلات | 1 | OrganizationSequence |
| **المجموع** | **85** | |

**Cascading Deletes:** مُعَدّة على جميع العلاقات الفرعية (`onDelete: Cascade`)
**Soft Deletes:** المشاريع تستخدم `status: ARCHIVED`، المنظمات تستخدم `status: CANCELLED`
**Decimal Fields:** جميع الحقول المالية تستخدم `Decimal(15, 2)` بشكل صحيح

---

> **ملاحظة أخيرة:** هذا الدليل مبني على تحليل فعلي لكود المشروع وليس معلومات عامة. جميع المسارات والأرقام والإعدادات مستخرجة مباشرة من الكود المصدري.
