# التقرير التقني الشامل لمنصة مسار (Masar Platform)

> **تاريخ التقرير:** 2026-03-04
> **الإصدار:** 2.0
> **مبني على قراءة فعلية للكود المصدري**
> **عدد الملفات المقروءة:** 400+

---

## جدول المحتويات

1. [الملخص التنفيذي](#1-الملخص-التنفيذي)
2. [الهيكل التقني والمعماري](#2-الهيكل-التقني-والمعماري)
3. [قاعدة البيانات بالكامل](#3-قاعدة-البيانات-بالكامل)
4. [نظام المصادقة والصلاحيات](#4-نظام-المصادقة-والصلاحيات)
5. [طبقة الـ API](#5-طبقة-الـ-api)
6. [صفحات الواجهة](#6-صفحات-الواجهة)
7. [نظام التنقل](#7-نظام-التنقل)
8. [المكونات المشتركة](#8-المكونات-المشتركة)
9. [نظام الطباعة والقوالب](#9-نظام-الطباعة-والقوالب)
10. [التوافق مع هيئة الزكاة ZATCA](#10-التوافق-مع-هيئة-الزكاة-zatca)
11. [نظام الاشتراكات والفوترة](#11-نظام-الاشتراكات-والفوترة)
12. [التخزين السحابي](#12-التخزين-السحابي)
13. [نظام البريد الإلكتروني](#13-نظام-البريد-الإلكتروني)
14. [الذكاء الاصطناعي](#14-الذكاء-الاصطناعي)
15. [النشر والبنية التحتية](#15-النشر-والبنية-التحتية)
16. [الأمان](#16-الأمان)
17. [الأداء](#17-الأداء)
18. [الاختبارات](#18-الاختبارات)
19. [أوامر التطوير](#19-أوامر-التطوير)
20. [دليل المطور](#20-دليل-المطور)
21. [المشاكل المعروفة](#21-المشاكل-المعروفة)
22. [خارطة الطريق](#22-خارطة-الطريق)
23. [الملاحق](#23-الملاحق)

---

## 1. الملخص التنفيذي

### 1.1 ما هو مسار؟

مسار هو **منصة متكاملة لإدارة المشاريع الإنشائية** مصممة كتطبيق ويب حديث يعمل كخدمة سحابية (SaaS). اسم "مسار" يعكس فلسفة التطبيق في توجيه المشاريع نحو الإنجاز عبر مسار واضح ومنظم.

المنصة تستهدف:
- شركات المقاولات السعودية
- المكاتب الهندسية
- فرق إدارة المشاريع الإنشائية

### 1.2 المشاكل التي يحلها مسار

| المشكلة | الحل في مسار |
|---------|-------------|
| تشتت البيانات بين Excel وWhatsApp والورق | منصة موحدة لكل بيانات المشروع |
| صعوبة متابعة التقدم الفعلي | لوحات تحكم تفاعلية وتقارير يومية |
| غياب الرقابة المالية الدقيقة | نظام مالي متكامل مع تتبع المصروفات والمطالبات |
| ضعف التواصل مع مالك المشروع | بوابة مخصصة لمالك المشروع |
| عدم التوافق مع الأنظمة السعودية | دعم فواتير ZATCA وضريبة القيمة المضافة |
| صعوبة إدارة المقاولين من الباطن | نظام عقود وأوامر تغيير ودفعات |
| غياب الجدولة الزمنية المتقدمة | مخطط Gantt متقدم مع التبعيات والخطوط الأساسية |
| تعقيد إدارة الموظفين والرواتب | نظام شامل للموظفين وكشوف الرواتب |

### 1.3 الأرقام الرئيسية

| المعيار | القيمة |
|---------|--------|
| عدد Models في قاعدة البيانات | 85 model |
| عدد Enums | 65 enum |
| عدد API Endpoints | 400+ endpoint |
| عدد صفحات الويب (page.tsx) | 104 صفحة |
| عدد Layouts | 16 layout |
| عدد وحدات SaaS | 18 وحدة |
| عدد مكونات UI | 370+ مكون |
| عدد قوالب البريد | 6 قوالب |
| عدد أقسام الصلاحيات | 8 أقسام (42 صلاحية) |
| عدد حزم Monorepo | 16 حزمة |

### 1.4 فلسفة التصميم

1. **عربي أولاً (RTL-First)** — الواجهة مصممة بالعربية كلغة أساسية مع `dir="rtl"`
2. **متعدد المستأجرين (Multi-Tenant)** — كل `organizationId` يعزل البيانات بالكامل
3. **أدوار متدرجة (Role-Based)** — 6 أنواع أدوار مع 42 صلاحية قابلة للتخصيص
4. **مالي أولاً (Finance-First)** — جميع الحقول المالية تستخدم `Decimal` للدقة
5. **قابل للتوسع (Scalable)** — Monorepo مع Turborepo و pnpm workspaces
6. **تجربة موبايل محسنة** — شريط تنقل سفلي زجاجي للموبايل
7. **ذكاء اصطناعي مدمج** — مساعد Claude Sonnet 4 مع 6 أدوات متخصصة

### 1.5 تقييم الجاهزية

| الجانب | الحالة | النسبة |
|--------|--------|--------|
| إدارة المشاريع | مكتمل | 95% |
| الإدارة المالية | مكتمل | 90% |
| التنفيذ الميداني | مكتمل | 90% |
| نظام المستندات | مكتمل | 85% |
| المقاولين من الباطن | مكتمل | 90% |
| الجدول الزمني | مكتمل | 90% |
| مخطط Gantt المتقدم | مكتمل | 85% |
| إدارة الشركة | مكتمل | 85% |
| التسعير والعروض | مكتمل | 80% |
| بوابة المالك | مكتمل | 85% |
| ZATCA المرحلة 1 | مكتمل | 100% |
| ZATCA المرحلة 2 | غير مبدوء | 0% |
| الذكاء الاصطناعي | مكتمل | 75% |
| الاختبارات الآلية | ضعيف | 10% |
| CI/CD | أساسي | 40% |

### 1.6 أهم 10 مشاكل حرجة يجب حلها

1. **ZATCA المرحلة 2 غائبة** — التكامل مع API هيئة الزكاة (CSID, XML signing, clearance) غير موجود
2. **غياب الاختبارات الآلية** — لا يوجد unit tests أو integration tests تقريباً
3. **subscriptionProcedure غير مستخدم** — لا يوجد أي endpoint يفرض التحقق من الاشتراك
4. **عدم وجود rate limiting حقيقي** — فقط على contact و newsletter
5. **غياب CSP Headers** — لا توجد Content Security Policy
6. **لا يوجد monitoring/logging مركزي** — لا Sentry أو DataDog أو ما شابه
7. **Redis غير مفعل فعلياً** — ioredis موجود كـ dependency لكن غير مستخدم
8. **لا يوجد backup strategy** — لا توجد استراتيجية نسخ احتياطي موثقة
9. **Performance monitoring غائب** — لا يوجد قياس أداء أو Web Vitals tracking
10. **تصدير PDF محدود** — يعتمد على HTML to PDF بدلاً من حل متقدم

---

## 2. الهيكل التقني والمعماري

### 2.1 مكدس التقنيات (Tech Stack)

#### 2.1.1 Frontend

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Next.js | 16.1.0 | إطار عمل React مع App Router |
| React | 19.2.3 | مكتبة واجهة المستخدم |
| TypeScript | 5.9.3 | لغة البرمجة |
| Tailwind CSS | 4.1.17 | تنسيق CSS |
| shadcn/ui | أحدث إصدار | مكونات UI جاهزة |
| Radix UI | أحدث إصدار | مكونات Headless UI |
| TanStack React Query | 5.90.9 | إدارة الحالة والتخزين المؤقت |
| TanStack React Table | 8.21.3 | جداول البيانات |
| React Hook Form | 7.66.0 | إدارة النماذج |
| Zod | 4.1.12 | التحقق من البيانات |
| next-intl | 4.5.3 | الترجمة والتدويل |
| next-themes | 0.4.6 | الوضع المظلم/الفاتح |
| Recharts | 2.15.4 | الرسوم البيانية |
| Lucide React | 0.553.0 | الأيقونات |
| nuqs | 2.7.3 | إدارة Query String |
| date-fns | 4.1.0 | معالجة التواريخ |
| sonner | 2.0.7 | إشعارات Toast |
| react-dropzone | 14.3.8 | رفع الملفات |
| react-markdown | 10.1.0 | عرض Markdown |
| react-qr-code | 2.0.17 | رموز QR |
| fumadocs | 16.0.11 | التوثيق |

#### 2.1.2 Backend

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Hono.js | 4.10.5 | إطار عمل API خفيف |
| ORPC | 1.13.2 | Type-safe RPC framework |
| Prisma | 7.1.0 | ORM لقاعدة البيانات |
| PostgreSQL | أحدث | قاعدة البيانات (عبر Supabase) |
| BetterAuth | 1.4.7 | نظام المصادقة |
| Stripe | 19.3.1 | معالجة المدفوعات |
| ioredis | 5.9.3 | Redis client (معرّف لكن غير مفعل) |
| nanoid | 5.1.6 | توليد معرفات فريدة |
| qrcode | 1.5.4 | توليد رموز QR (ZATCA) |

#### 2.1.3 AI / الذكاء الاصطناعي

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| AI SDK | 5.0.93 | إطار عمل Vercel AI |
| @ai-sdk/openai | 2.0.65 | تكامل OpenAI |
| @ai-sdk/anthropic | 2.0.44 | تكامل Anthropic |
| @ai-sdk/react | 2.0.93 | React hooks للـ AI |
| OpenAI SDK | 6.9.0 | OpenAI API client |

#### 2.1.4 البنية التحتية

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Vercel | - | النشر والاستضافة (Frankfurt fra1) |
| Supabase | - | قاعدة البيانات PostgreSQL |
| AWS S3 | 3.437.0 | التخزين السحابي |
| Resend | 6.4.2 | إرسال البريد الإلكتروني |
| Turborepo | 2.7.2 | إدارة Monorepo |
| pnpm | 10.14.0 | مدير الحزم |
| Biome | 2.3.5 | Linter و Formatter |
| Vitest | 4.0.18 | إطار الاختبارات |

### 2.2 هيكل Monorepo

```
supastarter-nextjs-3/
├── apps/
│   └── web/                          # تطبيق Next.js الرئيسي
│       ├── app/                      # App Router (صفحات وLayouts)
│       │   ├── (marketing)/          # صفحات تسويقية
│       │   ├── (saas)/               # تطبيق SaaS
│       │   │   ├── app/
│       │   │   │   ├── (account)/    # حساب المستخدم
│       │   │   │   └── (organizations)/ # صفحات المنظمة
│       │   │   │       └── [organizationSlug]/
│       │   │   │           ├── projects/
│       │   │   │           │   └── [projectId]/  # صفحات المشروع
│       │   │   │           ├── finance/          # المالية
│       │   │   │           ├── company/          # إدارة الشركة
│       │   │   │           └── settings/         # الإعدادات
│       │   │   ├── onboarding/
│       │   │   ├── choose-plan/
│       │   │   └── new-organization/
│       │   ├── auth/                 # صفحات المصادقة
│       │   ├── owner/[token]/        # بوابة المالك
│       │   ├── share/[token]/        # روابط المشاركة
│       │   └── api/                  # API Routes
│       ├── modules/
│       │   └── saas/                 # 18 وحدة SaaS
│       │       ├── admin/
│       │       ├── ai/
│       │       ├── auth/
│       │       ├── company/
│       │       ├── dashboard/
│       │       ├── finance/
│       │       ├── integrations/
│       │       ├── onboarding/
│       │       ├── organizations/
│       │       ├── payments/
│       │       ├── pricing/
│       │       ├── projects/
│       │       ├── projects-changes/
│       │       ├── projects-execution/
│       │       ├── projects-timeline/
│       │       ├── settings/
│       │       └── shared/
│       ├── components/               # مكونات عامة
│       └── i18n/                     # ملفات الترجمة
├── packages/
│   ├── api/                          # طبقة API (ORPC + Hono)
│   │   ├── orpc/
│   │   │   ├── router.ts            # الـ Router الرئيسي
│   │   │   ├── procedures.ts        # أنواع الـ Procedures
│   │   │   └── middleware/           # Middleware
│   │   ├── modules/                  # 36 وحدة API
│   │   └── lib/
│   │       └── zatca/                # تكامل ZATCA
│   ├── auth/                         # حزمة المصادقة (BetterAuth)
│   │   └── auth.ts
│   ├── database/                     # حزمة قاعدة البيانات
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # مخطط قاعدة البيانات (3849 سطر)
│   │   │   ├── permissions.ts        # مصفوفة الصلاحيات
│   │   │   └── zod/                  # Zod schemas مولدة تلقائياً
│   │   └── generated/                # Prisma Client المولد
│   ├── ai/                           # حزمة الذكاء الاصطناعي
│   ├── mail/                         # حزمة البريد الإلكتروني
│   │   └── emails/                   # 6 قوالب React Email
│   ├── payments/                     # حزمة المدفوعات (Stripe)
│   ├── storage/                      # حزمة التخزين (S3)
│   └── ui/                           # مكونات UI مشتركة
├── config/
│   └── index.ts                      # الإعدادات المركزية
├── vercel.json                       # إعدادات النشر
├── turbo.json                        # إعدادات Turborepo
├── package.json                      # الحزمة الجذرية
└── pnpm-workspace.yaml               # تعريف workspaces
```

### 2.3 مخطط تدفق البيانات

```
┌─────────────────────────────────────────────────────────────┐
│                        المستخدم (Browser)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ React Query   │  │ React Hook   │  │ next-intl        │   │
│  │ (Cache)       │  │ Form (Forms) │  │ (i18n: ar/en/de) │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘   │
│         │                  │                                  │
│  ┌──────┴──────────────────┴───────┐                         │
│  │      ORPC Client (Type-Safe)     │                         │
│  └──────────────┬──────────────────┘                         │
└─────────────────┼───────────────────────────────────────────┘
                  │ HTTP (JSON-RPC)
┌─────────────────┼───────────────────────────────────────────┐
│  Vercel Edge    │                                            │
│  ┌──────────────┴──────────────────┐                         │
│  │      Hono.js API Server          │                         │
│  │  ┌───────────────────────────┐   │                         │
│  │  │  ORPC Router (36 modules) │   │                         │
│  │  │  ┌─────────────────────┐  │   │                         │
│  │  │  │ Middleware Pipeline  │  │   │                         │
│  │  │  │ ├─ locale            │  │   │                         │
│  │  │  │ ├─ auth (session)    │  │   │                         │
│  │  │  │ ├─ subscription      │  │   │                         │
│  │  │  │ └─ limits            │  │   │                         │
│  │  │  └─────────────────────┘  │   │                         │
│  │  └───────────────────────────┘   │                         │
│  └──────────────┬──────────────────┘                         │
│                 │                                             │
│  ┌──────────────┴──────────────────┐                         │
│  │      Prisma ORM (Type-Safe)      │                         │
│  └──────────────┬──────────────────┘                         │
└─────────────────┼───────────────────────────────────────────┘
                  │ PostgreSQL Protocol
┌─────────────────┼───────────────────────────────────────────┐
│  Supabase       │                                            │
│  ┌──────────────┴──────────────────┐                         │
│  │    PostgreSQL Database           │                         │
│  │    85 Models / 65 Enums          │                         │
│  │    ~130 Indexes                  │                         │
│  └─────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  AWS S3       │  │  Resend      │  │  Stripe      │
│  (Storage)    │  │  (Email)     │  │  (Payments)  │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│  OpenAI       │  │  Anthropic   │
│  (GPT-4o-mini)│  │  (Claude 4)  │
└──────────────┘  └──────────────┘
```

### 2.4 إعدادات Turborepo

```
الملف: turbo.json
```

| المهمة | الاعتمادات | المخرجات | التخزين المؤقت | مستمر |
|--------|-----------|----------|---------------|-------|
| `build` | `^generate`, `^build` | `dist/**`, `.next/**` | نعم | لا |
| `type-check` | لا شيء | - | نعم | لا |
| `clean` | لا شيء | - | لا | لا |
| `generate` | لا شيء | - | لا | لا |
| `dev` | `^generate` | - | لا | نعم |
| `export` | لا شيء | `out/**` | نعم | لا |
| `start` | `^generate`, `^build` | - | لا | نعم |
| `test` | `^generate` | - | نعم | لا |

### 2.5 إعدادات Vercel

```
الملف: vercel.json
```

```json
{
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

- **المنطقة:** Frankfurt (fra1) — الأقرب للسعودية في Vercel
- **مدة الدوال:** 30 ثانية كحد أقصى
- **فحص الصحة:** كل 5 دقائق عبر `/api/health`

### 2.6 الإعدادات المركزية

```
الملف: config/index.ts
```

| الإعداد | القيمة |
|---------|--------|
| اسم التطبيق | Masar |
| اللغة الافتراضية | العربية (ar) |
| اللغات المدعومة | ar, en, de |
| العملة الافتراضية | USD |
| الثيمات | light, dark |
| إنشاء منظمة تلقائي عند التسجيل | نعم |
| المنظمة مخفية عن المستخدم | نعم (multi-tenant) |
| مدة الجلسة | 30 يوم |
| fresh age | 300 ثانية |
| التسجيل | مفعل |
| Magic Link | مفعل |
| تسجيل اجتماعي | مفعل (Google, GitHub) |
| Passkeys | مفعل |
| Two-Factor Auth | مفعل |
| بريد المرسل | noreply@masar.app |

---

## 3. قاعدة البيانات بالكامل

```
الملف: packages/database/prisma/schema.prisma
الحجم: 3,849 سطر
قاعدة البيانات: PostgreSQL (عبر Supabase)
ORM: Prisma 7.1.0
```

### 3.1 الإحصائيات العامة

| المعيار | القيمة |
|---------|--------|
| إجمالي Models | 85 |
| إجمالي Enums | 65 |
| إجمالي Indexes | ~130 |
| إجمالي Unique Constraints | ~40 |
| أكبر Model (حقول) | User (~60 حقل + ~50 relation) |
| ثاني أكبر Model | Organization (~40 حقل) |
| أكبر Enum (قيم) | OrgAuditAction (38 قيمة) |

### 3.2 المولدات (Generators)

```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated"
}

generator zod {
  provider       = "prisma-zod-generator"
  output         = "./zod"
  // ... إعدادات مخصصة
}
```

- **Prisma Client** → يولد في `./generated`
- **Prisma Zod Generator** → يولد Zod schemas في `./zod`
- يتم تشغيل `fix-zod-import.js` بعد التوليد لإضافة `import { Prisma } from '../generated/client'`

### 3.3 جميع الـ Enums (65 enum)

#### 3.3.1 المصادقة والحسابات

**AccountType** — نوع الحساب
| القيمة | الوصف |
|--------|-------|
| `OWNER` | مالك المنظمة |
| `EMPLOYEE` | موظف |
| `PROJECT_CLIENT` | عميل مشروع |

**RoleType** — نوع الدور
| القيمة | الوصف |
|--------|-------|
| `OWNER` | مالك |
| `PROJECT_MANAGER` | مدير مشروع |
| `ACCOUNTANT` | محاسب |
| `ENGINEER` | مهندس |
| `SUPERVISOR` | مشرف |
| `CUSTOM` | مخصص |

**InvitationStatus** — حالة الدعوة
| القيمة | الوصف |
|--------|-------|
| `PENDING` | معلقة |
| `ACCEPTED` | مقبولة |
| `EXPIRED` | منتهية |
| `CANCELLED` | ملغاة |

#### 3.3.2 الاشتراكات والفوترة

**OrgStatus** — حالة المنظمة
| القيمة | الوصف |
|--------|-------|
| `ACTIVE` | نشطة |
| `TRIALING` | تجريبية |
| `SUSPENDED` | معلقة |
| `CANCELLED` | ملغاة |
| `PAST_DUE` | متأخرة الدفع |

**PlanType** — نوع الخطة
| القيمة | الوصف |
|--------|-------|
| `FREE` | مجانية |
| `PRO` | احترافية |

**SubscriptionStatus** — حالة الاشتراك
| القيمة | الوصف |
|--------|-------|
| `TRIALING` | تجريبي |
| `ACTIVE` | نشط |
| `PAST_DUE` | متأخر |
| `CANCELED` | ملغى |
| `UNPAID` | غير مدفوع |
| `INCOMPLETE` | غير مكتمل |
| `PAUSED` | متوقف |

#### 3.3.3 المشاريع

**ProjectStatus** — حالة المشروع
| القيمة | الوصف |
|--------|-------|
| `ACTIVE` | نشط |
| `ON_HOLD` | متوقف |
| `COMPLETED` | مكتمل |
| `ARCHIVED` | مؤرشف |

**ProjectRole** — دور في المشروع
| القيمة | الوصف |
|--------|-------|
| `MANAGER` | مدير |
| `ENGINEER` | مهندس |
| `SUPERVISOR` | مشرف |
| `ACCOUNTANT` | محاسب |
| `VIEWER` | مشاهد |

**ProjectType** — نوع المشروع
| القيمة | الوصف |
|--------|-------|
| `RESIDENTIAL` | سكني |
| `COMMERCIAL` | تجاري |
| `INDUSTRIAL` | صناعي |
| `INFRASTRUCTURE` | بنية تحتية |
| `MIXED` | متعدد |

#### 3.3.4 التنفيذ الميداني

**IssueSeverity** — خطورة المشكلة
| القيمة | الوصف |
|--------|-------|
| `LOW` | منخفضة |
| `MEDIUM` | متوسطة |
| `HIGH` | عالية |
| `CRITICAL` | حرجة |

**IssueStatus** — حالة المشكلة
| القيمة | الوصف |
|--------|-------|
| `OPEN` | مفتوحة |
| `IN_PROGRESS` | قيد العمل |
| `RESOLVED` | محلولة |
| `CLOSED` | مغلقة |

**PhotoCategory** — تصنيف الصورة
| القيمة | الوصف |
|--------|-------|
| `PROGRESS` | تقدم |
| `ISSUE` | مشكلة |
| `EQUIPMENT` | معدات |
| `MATERIAL` | مواد |
| `SAFETY` | سلامة |
| `OTHER` | أخرى |

**WeatherCondition** — حالة الطقس
| القيمة | الوصف |
|--------|-------|
| `SUNNY` | مشمس |
| `CLOUDY` | غائم |
| `RAINY` | ممطر |
| `WINDY` | عاصف |
| `DUSTY` | مترب |
| `HOT` | حار |
| `COLD` | بارد |

**ActivityStatus** — حالة النشاط
| القيمة | الوصف |
|--------|-------|
| `NOT_STARTED` | لم يبدأ |
| `IN_PROGRESS` | قيد التنفيذ |
| `COMPLETED` | مكتمل |
| `DELAYED` | متأخر |
| `ON_HOLD` | متوقف |
| `CANCELLED` | ملغى |

**DependencyType** — نوع التبعية
| القيمة | الوصف |
|--------|-------|
| `FINISH_TO_START` | انتهاء → بدء |
| `START_TO_START` | بدء → بدء |
| `FINISH_TO_FINISH` | انتهاء → انتهاء |
| `START_TO_FINISH` | بدء → انتهاء |

**ProgressMethod** — طريقة حساب التقدم
| القيمة | الوصف |
|--------|-------|
| `MANUAL` | يدوي |
| `CHECKLIST` | قائمة مهام |
| `ACTIVITIES` | أنشطة |

**MilestoneStatus** — حالة المرحلة
| القيمة | الوصف |
|--------|-------|
| `PLANNED` | مخطط |
| `IN_PROGRESS` | قيد التنفيذ |
| `COMPLETED` | مكتمل |
| `DELAYED` | متأخر |
| `CANCELLED` | ملغى |

#### 3.3.5 المستندات والموافقات

**DocumentFolder** — مجلد المستند
| القيمة | الوصف |
|--------|-------|
| `CONTRACT` | عقود |
| `DRAWINGS` | مخططات |
| `CLAIMS` | مطالبات |
| `LETTERS` | خطابات |
| `PHOTOS` | صور |
| `OTHER` | أخرى |

**ApprovalStatus** — حالة الموافقة
| القيمة | الوصف |
|--------|-------|
| `PENDING` | معلقة |
| `APPROVED` | موافق عليها |
| `REJECTED` | مرفوضة |
| `CANCELLED` | ملغاة |

**ApproverStatus** — حالة المعتمد
| القيمة | الوصف |
|--------|-------|
| `PENDING` | معلق |
| `APPROVED` | وافق |
| `REJECTED` | رفض |

#### 3.3.6 المالية — المشاريع

**ExpenseCategory** — فئة المصروف
| القيمة | الوصف |
|--------|-------|
| `MATERIALS` | مواد |
| `LABOR` | عمالة |
| `EQUIPMENT` | معدات |
| `SUBCONTRACTOR` | مقاول باطن |
| `TRANSPORT` | نقل |
| `MISC` | متنوعة |

**ClaimStatus** — حالة المطالبة
| القيمة | الوصف |
|--------|-------|
| `DRAFT` | مسودة |
| `SUBMITTED` | مقدمة |
| `APPROVED` | معتمدة |
| `PAID` | مدفوعة |
| `REJECTED` | مرفوضة |

#### 3.3.7 المالية — المنظمة

**OrgExpenseCategory** — فئة مصروف المنظمة (26 قيمة)

| القيمة | الوصف |
|--------|-------|
| `MATERIALS` | مواد |
| `LABOR` | عمالة |
| `EQUIPMENT_RENTAL` | إيجار معدات |
| `EQUIPMENT_PURCHASE` | شراء معدات |
| `SUBCONTRACTOR` | مقاول باطن |
| `TRANSPORT` | نقل |
| `SALARIES` | رواتب |
| `RENT` | إيجار |
| `UTILITIES` | مرافق |
| `COMMUNICATIONS` | اتصالات |
| `INSURANCE` | تأمين |
| `LICENSES` | تراخيص |
| `BANK_FEES` | رسوم بنكية |
| `FUEL` | وقود |
| `MAINTENANCE` | صيانة |
| `SUPPLIES` | مستلزمات |
| `MARKETING` | تسويق |
| `TRAINING` | تدريب |
| `TRAVEL` | سفر |
| `HOSPITALITY` | ضيافة |
| `LOAN_PAYMENT` | سداد قرض |
| `TAXES` | ضرائب |
| `ZAKAT` | زكاة |
| `REFUND` | استرداد |
| `MISC` | متنوعة |
| `CUSTOM` | مخصص |

**FinanceAccountType** — نوع الحساب المالي
| القيمة | الوصف |
|--------|-------|
| `BANK` | بنك |
| `CASH_BOX` | صندوق نقدي |

**FinanceTransactionStatus** — حالة المعاملة
| القيمة | الوصف |
|--------|-------|
| `PENDING` | معلقة |
| `COMPLETED` | مكتملة |
| `CANCELLED` | ملغاة |

**ExpenseSourceType** — مصدر المصروف
| القيمة | الوصف |
|--------|-------|
| `MANUAL` | يدوي |
| `FACILITY_PAYROLL` | رواتب |
| `FACILITY_RECURRING` | متكرر |
| `FACILITY_ASSET` | أصول |
| `PROJECT` | مشروع |

**PayrollRunStatus** — حالة دورة الرواتب
| القيمة | الوصف |
|--------|-------|
| `DRAFT` | مسودة |
| `APPROVED` | معتمدة |
| `PAID` | مدفوعة |
| `CANCELLED` | ملغاة |

**ExpenseRunStatus** — حالة دورة المصروفات
| القيمة | الوصف |
|--------|-------|
| `DRAFT` | مسودة |
| `POSTED` | مسجلة |
| `CANCELLED` | ملغاة |

**PaymentMethod** — طريقة الدفع
| القيمة | الوصف |
|--------|-------|
| `CASH` | نقداً |
| `BANK_TRANSFER` | تحويل بنكي |
| `CHEQUE` | شيك |
| `CREDIT_CARD` | بطاقة ائتمان |
| `OTHER` | أخرى |

**PaymentTermType** — نوع شرط الدفع
| القيمة | الوصف |
|--------|-------|
| `ADVANCE` | دفعة مقدمة |
| `MILESTONE` | مرتبط بمرحلة |
| `MONTHLY` | شهري |
| `COMPLETION` | عند الإنجاز |
| `CUSTOM` | مخصص |

#### 3.3.8 إدارة الشركة

**CompanyExpenseCategory** — فئة مصروف الشركة (12 قيمة)
`RENT`, `UTILITIES`, `COMMUNICATIONS`, `INSURANCE`, `LICENSES`, `SUBSCRIPTIONS`, `MAINTENANCE`, `BANK_FEES`, `MARKETING`, `TRANSPORT`, `HOSPITALITY`, `OTHER`

**RecurrenceType** — نوع التكرار
`MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `ANNUAL`, `ONE_TIME`

**AssetType** — نوع الأصل
`OWNED`, `RENTED`, `LEASED`

**AssetCategory** — فئة الأصل (9 قيم)
`HEAVY_EQUIPMENT`, `LIGHT_EQUIPMENT`, `VEHICLES`, `TOOLS`, `IT_EQUIPMENT`, `FURNITURE`, `SAFETY_EQUIPMENT`, `SURVEYING`, `OTHER`

**AssetStatus** — حالة الأصل
`AVAILABLE`, `IN_USE`, `MAINTENANCE`, `RETIRED`

**EmployeeType** — نوع الموظف (10 قيم)
`PROJECT_MANAGER`, `SITE_ENGINEER`, `SUPERVISOR`, `ACCOUNTANT`, `ADMIN`, `DRIVER`, `TECHNICIAN`, `LABORER`, `SECURITY`, `OTHER`

**SalaryType** — نوع الراتب
`MONTHLY`, `DAILY`

**EmployeeStatus** — حالة الموظف
`ACTIVE`, `ON_LEAVE`, `TERMINATED`

#### 3.3.9 المقاولات من الباطن

**SubcontractStatus** — حالة العقد
`DRAFT`, `ACTIVE`, `SUSPENDED`, `COMPLETED`, `TERMINATED`

**ContractorType** — نوع المقاول
`COMPANY`, `INDIVIDUAL`

**SubcontractCOStatus** — حالة أمر التغيير
`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`

#### 3.3.10 العقود

**ContractStatus** — حالة العقد
`DRAFT`, `ACTIVE`, `SUSPENDED`, `CLOSED`

#### 3.3.11 أوامر التغيير

**ChangeOrderStatus** — حالة أمر التغيير
`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `IMPLEMENTED`

**ChangeOrderCategory** — فئة أمر التغيير (7 قيم)
`SCOPE_CHANGE`, `CLIENT_REQUEST`, `SITE_CONDITION`, `DESIGN_CHANGE`, `MATERIAL_CHANGE`, `REGULATORY`, `OTHER`

#### 3.3.12 الاتصالات والإشعارات

**MessageChannel** — قناة الرسائل
`TEAM`, `OWNER`

**NotificationType** — نوع الإشعار (16 قيمة)
`APPROVAL_REQUESTED`, `APPROVAL_DECIDED`, `DOCUMENT_CREATED`, `DAILY_REPORT_CREATED`, `ISSUE_CREATED`, `ISSUE_CRITICAL`, `EXPENSE_CREATED`, `CLAIM_CREATED`, `CLAIM_STATUS_CHANGED`, `CHANGE_ORDER_CREATED`, `CHANGE_ORDER_APPROVED`, `CHANGE_ORDER_REJECTED`, `OWNER_MESSAGE`, `TEAM_MEMBER_ADDED`, `TEAM_MEMBER_REMOVED`, `SYSTEM`

**NotificationChannel** — قناة الإشعار
`IN_APP`, `EMAIL`

**DeliveryStatus** — حالة التسليم
`PENDING`, `SENT`, `FAILED`

#### 3.3.13 المرفقات والعملاء

**AttachmentOwnerType** — نوع مالك المرفق (8 قيم)
`DOCUMENT`, `PHOTO`, `EXPENSE`, `ISSUE`, `MESSAGE`, `CLAIM`, `CHANGE_ORDER`, `CLIENT`

**ClientType** — نوع العميل
`INDIVIDUAL`, `COMMERCIAL`

#### 3.3.14 سجلات التدقيق

**AuditAction** — إجراء التدقيق (22 قيمة)
`DOC_CREATED`, `APPROVAL_REQUESTED`, `APPROVAL_DECIDED`, `MESSAGE_SENT`, `TOKEN_CREATED`, `TOKEN_REVOKED`, `CLAIM_STATUS_CHANGED`, `EXPENSE_CREATED`, `ATTACHMENT_CREATED`, `CO_CREATED`, `CO_SUBMITTED`, `CO_APPROVED`, `CO_REJECTED`, `CO_IMPLEMENTED`, `SUBCONTRACT_CREATED`, `SUBCONTRACT_UPDATED`, `SUBCONTRACT_DELETED`, `SUBCONTRACT_CO_CREATED`, `SUBCONTRACT_CO_UPDATED`, `SUBCONTRACT_CO_DELETED`, `SUBCONTRACT_PAYMENT_CREATED`, `CONTRACT_CREATED`, `CONTRACT_UPDATED`

**OrgAuditAction** — إجراء تدقيق المنظمة (38 قيمة)
`EXPENSE_CREATED`, `EXPENSE_UPDATED`, `EXPENSE_PAID`, `EXPENSE_CANCELLED`, `EXPENSE_DELETED`, `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_DELETED`, `TRANSFER_CREATED`, `TRANSFER_CANCELLED`, `BANK_ACCOUNT_CREATED`, `BANK_ACCOUNT_UPDATED`, `BANK_ACCOUNT_SET_DEFAULT`, `BANK_ACCOUNT_DELETED`, `INVOICE_CREATED`, `INVOICE_UPDATED`, `INVOICE_ITEMS_UPDATED`, `INVOICE_STATUS_CHANGED`, `INVOICE_CONVERTED_TO_TAX`, `INVOICE_PAYMENT_ADDED`, `INVOICE_PAYMENT_DELETED`, `INVOICE_DELETED`, `INVOICE_ISSUED`, `INVOICE_DUPLICATED`, `INVOICE_CREDIT_NOTE_CREATED`, `QUOTATION_CREATED`, `QUOTATION_UPDATED`, `QUOTATION_ITEMS_UPDATED`, `QUOTATION_STATUS_CHANGED`, `QUOTATION_DELETED`, `QUOTATION_CONVERTED`, `CLIENT_CREATED`, `CLIENT_UPDATED`, `CLIENT_DELETED`, `PAYROLL_RUN_APPROVED`, `PAYROLL_RUN_CANCELLED`, `SETTINGS_UPDATED`, `ZATCA_INVOICE_SUBMITTED`, `ZATCA_INVOICE_CLEARED`, `ZATCA_INVOICE_REJECTED`

#### 3.3.15 التنبيهات والقوالب

**AlertType** — نوع التنبيه
`MISSING_DAILY_REPORT`, `STALE_PROGRESS`, `OVERDUE_PAYMENT`, `COST_OVERRUN_RISK`, `TOO_MANY_OPEN_ISSUES`

**AlertSeverity** — خطورة التنبيه
`INFO`, `WARN`, `CRITICAL`

**DigestFrequency** — تكرار الملخص
`WEEKLY`

**TemplateItemType** — نوع عنصر القالب
`MILESTONE`, `CHECKLIST`

#### 3.3.16 التكاملات والتصدير

**MessagingChannel** — قناة المراسلة
`EMAIL`, `WHATSAPP`, `SMS`

**MessageDeliveryStatus** — حالة تسليم الرسالة
`PENDING`, `SENT`, `FAILED`, `SKIPPED`

**ShareResourceType** — نوع المورد المشارك (6 قيم)
`UPDATE_PDF`, `CLAIM_PDF`, `DOCUMENT`, `PHOTO_ALBUM`, `ICS`, `WEEKLY_REPORT`

#### 3.3.17 الوحدة المالية

**QuotationStatus** — حالة عرض السعر (7 قيم)
`DRAFT`, `SENT`, `VIEWED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CONVERTED`

**FinanceInvoiceStatus** — حالة الفاتورة (7 قيم)
`DRAFT`, `ISSUED`, `SENT`, `VIEWED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`

**InvoiceType** — نوع الفاتورة
`STANDARD`, `TAX`, `SIMPLIFIED`, `CREDIT_NOTE`, `DEBIT_NOTE`

**OpenDocumentType** — نوع المستند المفتوح
`LETTER`, `AGREEMENT`, `CERTIFICATE`, `MEMO`, `OTHER`

**FinanceTemplateType** — نوع قالب المالية
`QUOTATION`, `INVOICE`, `LETTER`

**PurchaseType** — نوع الشراء
`SUBSCRIPTION`, `ONE_TIME`

### 3.4 جميع الـ Models (85 model)

#### 3.4.1 المصادقة والتفويض (6 models)

##### User — المستخدم
```
الملف: schema.prisma
الحقول الأساسية:
```

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `id` | `String @id @default(cuid())` | المعرف الفريد |
| `name` | `String` | الاسم |
| `email` | `String @unique` | البريد الإلكتروني |
| `emailVerified` | `Boolean` | تم التحقق من البريد |
| `image` | `String?` | صورة الملف الشخصي |
| `username` | `String? @unique` | اسم المستخدم |
| `role` | `String?` | الدور العام (admin) |
| `banned` | `Boolean?` | محظور |
| `banReason` | `String?` | سبب الحظر |
| `banExpires` | `DateTime?` | انتهاء الحظر |
| `onboardingComplete` | `Boolean @default(false)` | أكمل التهيئة |
| `paymentsCustomerId` | `String?` | معرف عميل Stripe |
| `locale` | `String?` | اللغة المفضلة |
| `displayUsername` | `String?` | اسم العرض |
| `twoFactorEnabled` | `Boolean?` | المصادقة الثنائية |
| `accountType` | `AccountType @default(OWNER)` | نوع الحساب |
| `isActive` | `Boolean @default(true)` | نشط |
| `mustChangePassword` | `Boolean @default(false)` | يجب تغيير كلمة المرور |
| `lastLoginAt` | `DateTime?` | آخر تسجيل دخول |
| `organizationRoleId` | `String?` | معرف الدور في المنظمة |
| `customPermissions` | `Json?` | صلاحيات مخصصة |
| `createdById` | `String?` | أنشئ بواسطة |
| `organizationId` | `String?` | معرف المنظمة |

**العلاقات:** 50+ علاقة تشمل sessions, accounts, passkeys, invitations, purchases, members, aiChats, projects, expenses, claims, invoices, والمزيد.

##### Session — الجلسة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `expiresAt` | `DateTime` |
| `ipAddress` | `String?` |
| `userAgent` | `String?` |
| `userId` | `String` → User |
| `token` | `String @unique` |
| `activeOrganizationId` | `String?` |

##### Account — الحساب (OAuth)
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `accountId` | `String` |
| `providerId` | `String` |
| `userId` | `String` → User |
| `accessToken` / `refreshToken` / `idToken` | `String?` |
| `password` | `String?` |

##### Verification — التحقق
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `identifier` | `String` |
| `value` | `String` |
| `expiresAt` | `DateTime` |

##### Passkey — مفتاح المرور
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `name` | `String` |
| `publicKey` | `String` |
| `userId` | `String` → User |
| `credentialID` | `String` |
| `counter` | `Int` |

##### TwoFactor — المصادقة الثنائية
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `secret` | `String` |
| `backupCodes` | `String` |
| `userId` | `String` → User |

#### 3.4.2 المنظمة والعضوية (5 models)

##### Organization — المنظمة
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `id` | `String @id` | المعرف |
| `name` | `String` | الاسم |
| `slug` | `String @unique` | الرابط المختصر |
| `logo` | `String?` | الشعار |
| `ownerId` | `String?` → User | المالك |
| `commercialRegister` | `String?` | السجل التجاري |
| `taxNumber` | `String?` | الرقم الضريبي |
| `contractorClass` | `String?` | تصنيف المقاول |
| `phone` | `String?` | الهاتف |
| `address` | `String?` | العنوان |
| `city` | `String?` | المدينة |
| `currency` | `String @default("SAR")` | العملة |
| `timezone` | `String @default("Asia/Riyadh")` | المنطقة الزمنية |
| `status` | `OrgStatus @default(ACTIVE)` | الحالة |
| `plan` | `PlanType @default(FREE)` | الخطة |
| `planName` | `String?` | اسم الخطة |
| `stripeSubscriptionId` | `String?` | معرف اشتراك Stripe |
| `stripeProductId` | `String?` | معرف منتج Stripe |
| `stripePriceId` | `String?` | معرف سعر Stripe |
| `subscriptionStatus` | `SubscriptionStatus?` | حالة الاشتراك |
| `maxUsers` | `Int @default(1)` | الحد الأقصى للمستخدمين |
| `maxProjects` | `Int @default(0)` | الحد الأقصى للمشاريع |
| `maxStorage` | `Int @default(0)` | الحد الأقصى للتخزين (GB) |
| `currentPeriodStart` / `End` | `DateTime?` | فترة الاشتراك |
| `trialEndsAt` | `DateTime?` | انتهاء التجربة |
| `cancelAtPeriodEnd` | `Boolean @default(false)` | إلغاء نهاية الفترة |
| `isFreeOverride` | `Boolean @default(false)` | تجاوز الخطة المجانية |
| `overrideReason` | `String?` | سبب التجاوز |
| `overrideBy` | `String?` | تم التجاوز بواسطة |

##### Member — عضو المنظمة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` → Organization |
| `userId` | `String` → User |
| `role` | `String` |
| **Unique** | `@@unique([organizationId, userId])` |

##### Invitation — دعوة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` → Organization |
| `email` | `String` |
| `role` | `String` |
| `status` | `String` |
| `expiresAt` | `DateTime` |
| `inviterId` | `String` → User |

##### Role — الدور
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `name` | `String` |
| `nameEn` | `String?` |
| `description` | `String?` |
| `type` | `RoleType` |
| `isSystem` | `Boolean @default(false)` |
| `permissions` | `Json` |
| `organizationId` | `String` → Organization |
| **Unique** | `@@unique([organizationId, name])` |

##### UserInvitation — دعوة المستخدم
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `email` | `String` |
| `name` | `String?` |
| `roleId` | `String?` |
| `token` | `String @unique` |
| `expiresAt` | `DateTime` |
| `status` | `InvitationStatus` |
| `organizationId` | `String` |

#### 3.4.3 المشاريع الأساسية (2 models)

##### Project — المشروع
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `id` | `String @id @default(cuid())` | المعرف |
| `organizationId` | `String` → Organization | المنظمة |
| `name` | `String` | اسم المشروع |
| `slug` | `String` | الرابط المختصر |
| `projectNo` | `String?` | رقم المشروع |
| `description` | `String?` | الوصف |
| `status` | `ProjectStatus @default(ACTIVE)` | الحالة |
| `type` | `ProjectType?` | نوع المشروع |
| `clientName` | `String?` | اسم العميل |
| `clientId` | `String?` → Client | معرف العميل |
| `location` | `String?` | الموقع |
| `contractValue` | `Decimal?` | قيمة العقد |
| `progress` | `Float @default(0)` | نسبة التقدم |
| `startDate` / `endDate` | `DateTime?` | تواريخ البدء والانتهاء |
| `createdById` | `String` → User | أنشئ بواسطة |
| **Unique** | `@@unique([organizationId, slug])` | |
| **Indexes** | `organizationId`, `createdById`, `clientId`, `status` | |

##### ProjectMember — عضو المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `projectId` | `String` → Project |
| `userId` | `String` → User |
| `role` | `ProjectRole` |
| `assignedAt` | `DateTime @default(now())` |
| `assignedById` | `String?` → User |
| **Unique** | `@@unique([projectId, userId])` |

#### 3.4.4 التنفيذ الميداني (4 models)

##### ProjectDailyReport — التقرير اليومي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `projectId` | `String` → Project |
| `reportDate` | `DateTime` |
| `manpower` | `Int?` |
| `equipment` | `String?` |
| `workDone` | `String?` |
| `blockers` | `String?` |
| `weather` | `WeatherCondition?` |
| `createdById` | `String` → User |
| **Unique** | `@@unique([projectId, reportDate])` |

##### ProjectPhoto — صورة المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `projectId` | `String` → Project |
| `url` | `String` |
| `caption` | `String?` |
| `category` | `PhotoCategory` |
| `takenAt` | `DateTime?` |
| `uploadedById` | `String` → User |

##### ProjectIssue — مشكلة المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `projectId` | `String` → Project |
| `title` | `String` |
| `description` | `String?` |
| `severity` | `IssueSeverity` |
| `status` | `IssueStatus @default(OPEN)` |
| `dueDate` | `DateTime?` |
| `assigneeId` | `String?` → User |
| `createdById` | `String` → User |
| `resolvedAt` | `DateTime?` |

##### ProjectProgressUpdate — تحديث التقدم
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `projectId` | `String` → Project |
| `progress` | `Float` |
| `phaseLabel` | `String?` |
| `note` | `String?` |
| `createdById` | `String` → User |

#### 3.4.5 المالية — المشاريع (2 models)

##### ProjectExpense — مصروف المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `date` | `DateTime` |
| `category` | `ExpenseCategory` |
| `amount` | `Decimal` |
| `vendorName` | `String?` |
| `note` | `String?` |
| `attachmentUrl` | `String?` |
| `subcontractContractId` | `String?` → SubcontractContract |
| `createdById` | `String` → User |

##### ProjectClaim — مطالبة المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `claimNo` | `Int` |
| `periodStart` / `periodEnd` | `DateTime` |
| `amount` | `Decimal` |
| `dueDate` | `DateTime?` |
| `status` | `ClaimStatus @default(DRAFT)` |
| `note` | `String?` |
| `createdById` | `String` → User |
| **Unique** | `@@unique([projectId, claimNo])` |

#### 3.4.6 المقاولات من الباطن (4 models)

##### SubcontractContract — عقد المقاولة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `contractNo` | `String` |
| `name` | `String` |
| `contractorType` | `ContractorType` |
| `companyName` | `String?` |
| `phone` / `email` | `String?` |
| `taxNumber` / `crNumber` | `String?` |
| `status` | `SubcontractStatus @default(DRAFT)` |
| `value` | `Decimal` |
| `startDate` / `endDate` | `DateTime?` |
| `scopeOfWork` | `String?` |
| `includesVat` | `Boolean @default(true)` |
| `vatPercent` | `Decimal @default(15)` |
| `retentionPercent` | `Decimal @default(10)` |
| `paymentMethod` | `PaymentMethod?` |

##### SubcontractPaymentTerm — شرط دفع المقاولة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `contractId` | `String` → SubcontractContract |
| `type` | `PaymentTermType` |
| `label` | `String` |
| `percent` | `Decimal?` |
| `amount` | `Decimal?` |
| `dueDate` | `DateTime?` |
| `sortOrder` | `Int @default(0)` |

##### SubcontractChangeOrder — أمر تغيير المقاولة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `contractId` | `String` → SubcontractContract |
| `orderNo` | `Int` |
| `description` | `String` |
| `amount` | `Decimal` |
| `status` | `SubcontractCOStatus @default(DRAFT)` |

##### SubcontractPayment — دفعة المقاولة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `contractId` | `String` → SubcontractContract |
| `termId` | `String?` → SubcontractPaymentTerm |
| `paymentNo` | `Int` |
| `amount` | `Decimal` |
| `date` | `DateTime` |
| `paymentMethod` | `PaymentMethod` |
| `sourceAccountId` | `String?` → OrganizationBank |
| `status` | `FinanceTransactionStatus @default(COMPLETED)` |

#### 3.4.7 عقود المشروع (2 models)

##### ProjectContract — عقد المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String @unique` → Project |
| `contractNo` | `String?` |
| `title` | `String` |
| `clientName` | `String?` |
| `status` | `ContractStatus @default(DRAFT)` |
| `value` | `Decimal?` |
| `currency` | `String @default("SAR")` |
| `retentionPercent` | `Decimal?` |
| `retentionCap` | `Decimal?` |
| `includesVat` | `Boolean @default(true)` |
| `vatPercent` | `Decimal @default(15)` |
| `performanceBondPercent` | `Decimal?` |
| `penaltyPercent` | `Decimal?` |
| `penaltyCapPercent` | `Decimal?` |
| `scopeOfWork` | `String?` |

##### ContractPaymentTerm — شرط دفع العقد
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `contractId` | `String` → ProjectContract |
| `type` | `PaymentTermType` |
| `label` | `String` |
| `percent` | `Decimal?` |
| `amount` | `Decimal?` |
| `milestoneId` | `String?` |

#### 3.4.8 المستندات والموافقات (3 models)

##### ProjectDocument — مستند المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `folder` | `DocumentFolder` |
| `title` | `String` |
| `description` | `String?` |
| `fileUrl` | `String?` |
| `version` | `Int @default(1)` |
| `createdById` | `String` → User |

##### ProjectApproval — طلب الموافقة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` |
| `documentId` | `String` → ProjectDocument |
| `status` | `ApprovalStatus @default(PENDING)` |
| `requestedById` | `String` → User |

##### ProjectApprovalApprover — معتمد الموافقة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `approvalId` | `String` → ProjectApproval |
| `userId` | `String` → User |
| `status` | `ApproverStatus @default(PENDING)` |
| `decidedAt` | `DateTime?` |
| `note` | `String?` |
| **Unique** | `@@unique([approvalId, userId])` |

#### 3.4.9 الاتصالات (4 models)

##### ProjectMessage — رسالة المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `channel` | `MessageChannel` |
| `senderId` | `String` → User |
| `content` | `String` |
| `isUpdate` | `Boolean @default(false)` |

##### ChatLastRead — آخر قراءة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` |
| `userId` | `String` → User |
| `channel` | `MessageChannel` |
| `lastReadAt` | `DateTime` |
| **Unique** | `@@unique([projectId, userId, channel])` |

##### Notification — إشعار
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `userId` | `String` → User |
| `type` | `NotificationType` |
| `title` | `String` |
| `body` | `String` |
| `projectId` | `String?` |
| `channel` | `NotificationChannel @default(IN_APP)` |
| `deliveryStatus` | `DeliveryStatus @default(PENDING)` |
| `dedupeKey` | `String?` |
| `readAt` | `DateTime?` |

##### ProjectAuditLog — سجل التدقيق
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `actorId` | `String` → User |
| `action` | `AuditAction` |
| `entityType` | `String` |
| `entityId` | `String?` |
| `metadata` | `Json?` |

#### 3.4.10 بوابة المالك (1 model)

##### ProjectOwnerAccess — وصول المالك
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `token` | `String` |
| `label` | `String?` |
| `expiresAt` | `DateTime?` |
| `isRevoked` | `Boolean @default(false)` |
| `createdById` | `String` → User |

#### 3.4.11 نظام التنفيذ المتقدم (5 models)

##### ProjectCalendar — تقويم المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `name` | `String` |
| `workDays` | `Json` |
| `holidays` | `Json` |
| `defaultHoursPerDay` | `Float @default(8)` |
| `isDefault` | `Boolean @default(false)` |

##### ProjectMilestone — مرحلة المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `title` | `String` |
| `orderIndex` | `Int` |
| `plannedStart` / `plannedEnd` | `DateTime?` |
| `actualStart` / `actualEnd` | `DateTime?` |
| `status` | `MilestoneStatus @default(PLANNED)` |
| `progress` | `Float @default(0)` |
| `isCritical` | `Boolean @default(false)` |
| `weight` | `Float @default(1)` |
| `progressMethod` | `ProgressMethod @default(MANUAL)` |
| `baselineStartDate` / `baselineEndDate` | `DateTime?` |
| `calendarId` | `String?` → ProjectCalendar |

##### ProjectActivity — نشاط المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `milestoneId` | `String` → ProjectMilestone |
| `title` | `String` |
| `wbsCode` | `String?` |
| `plannedStart` / `plannedEnd` | `DateTime?` |
| `duration` | `Float?` |
| `actualStart` / `actualEnd` | `DateTime?` |
| `status` | `ActivityStatus @default(NOT_STARTED)` |
| `progress` | `Float @default(0)` |
| `isCritical` | `Boolean @default(false)` |
| `weight` | `Float @default(1)` |
| `assigneeId` | `String?` → User |
| `calendarId` | `String?` → ProjectCalendar |
| `orderIndex` | `Int @default(0)` |

##### ActivityDependency — تبعية النشاط
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` |
| `predecessorId` | `String` → ProjectActivity |
| `successorId` | `String` → ProjectActivity |
| `dependencyType` | `DependencyType @default(FINISH_TO_START)` |
| `lagDays` | `Int @default(0)` |

##### ActivityChecklist — قائمة مهام النشاط
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `activityId` | `String` → ProjectActivity |
| `title` | `String` |
| `isCompleted` | `Boolean @default(false)` |
| `completedAt` | `DateTime?` |
| `completedById` | `String?` → User |
| `orderIndex` | `Int @default(0)` |

##### ProjectBaseline — الخط الأساسي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `name` | `String` |
| `description` | `String?` |
| `snapshotDate` | `DateTime` |
| `snapshotData` | `Json` |
| `isActive` | `Boolean @default(false)` |
| `createdById` | `String` → User |

#### 3.4.12 المرفقات (1 model)

##### Attachment — المرفق
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String?` |
| `ownerType` | `AttachmentOwnerType` |
| `ownerId` | `String` |
| `fileName` | `String` |
| `fileSize` | `Int` |
| `mimeType` | `String` |
| `storagePath` | `String` |
| `uploadId` | `String @unique` |
| `uploadedById` | `String` → User |

#### 3.4.13 التنبيهات والملخصات (4 models)

##### ProjectTemplate — قالب المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `name` | `String` |
| `description` | `String?` |
| `sourceProjectId` | `String?` → Project |
| `createdById` | `String` → User |

##### ProjectTemplateItem — عنصر قالب المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `templateId` | `String` → ProjectTemplate |
| `type` | `TemplateItemType` |
| `title` | `String` |
| `sortOrder` | `Int @default(0)` |
| `metadata` | `Json?` |

##### ProjectAlert — تنبيه المشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `type` | `AlertType` |
| `severity` | `AlertSeverity` |
| `title` | `String` |
| `description` | `String?` |
| `dedupeKey` | `String @unique` |
| `acknowledgedAt` | `DateTime?` |
| `acknowledgedById` | `String?` → User |

##### DigestSubscription — اشتراك الملخص
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `userId` | `String` → User |
| `projectId` | `String` → Project |
| `frequency` | `DigestFrequency @default(WEEKLY)` |
| `channel` | `NotificationChannel @default(EMAIL)` |
| `isEnabled` | `Boolean @default(true)` |
| **Unique** | `@@unique([organizationId, userId, projectId])` |

#### 3.4.14 التكاملات والتصدير (3 models)

##### OrganizationIntegrationSettings — إعدادات التكامل
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String @unique` → Organization |
| `emailEnabled` | `Boolean @default(true)` |
| `whatsappEnabled` | `Boolean @default(false)` |
| `smsEnabled` | `Boolean @default(false)` |
| `defaultChannel` | `MessagingChannel @default(EMAIL)` |

##### MessageDeliveryLog — سجل تسليم الرسائل
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String?` → Project |
| `channel` | `MessagingChannel` |
| `recipient` | `String` |
| `subject` | `String?` |
| `content` | `String` |
| `status` | `MessageDeliveryStatus` |
| `provider` | `String?` |
| `errorMessage` | `String?` |

##### ShareLink — رابط المشاركة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `token` | `String` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `resourceType` | `ShareResourceType` |
| `resourceId` | `String?` |
| `expiresAt` | `DateTime?` |
| `isRevoked` | `Boolean @default(false)` |

#### 3.4.15 أوامر التغيير (1 model)

##### ProjectChangeOrder — أمر التغيير
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` |
| `projectId` | `String` → Project |
| `coNo` | `Int` |
| `title` | `String` |
| `description` | `String?` |
| `category` | `ChangeOrderCategory` |
| `status` | `ChangeOrderStatus @default(DRAFT)` |
| `costImpact` | `Decimal?` |
| `currency` | `String @default("SAR")` |
| `timeImpactDays` | `Int?` |
| `milestoneId` | `String?` → ProjectMilestone |
| `claimId` | `String?` → ProjectClaim |
| `contractId` | `String?` → ProjectContract |
| `requestedById` | `String` → User |
| `decidedById` | `String?` → User |
| `implementedById` | `String?` → User |
| **Unique** | `@@unique([organizationId, projectId, coNo])` |

#### 3.4.16 العملاء (2 models)

##### Client — العميل
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `clientType` | `ClientType @default(COMMERCIAL)` |
| `firstName` / `lastName` | `String?` |
| `businessName` | `String?` |
| `name` | `String` |
| `company` | `String?` |
| `phone` / `mobile` / `email` | `String?` |
| `address` / `streetAddress1` / `streetAddress2` | `String?` |
| `city` / `region` / `postalCode` / `country` | `String?` |
| `code` | `String @unique` |
| `currency` | `String @default("SAR")` |
| `displayLanguage` | `String @default("ar")` |
| `classification` | `String[]` |
| `taxNumber` / `crNumber` | `String?` |
| `isActive` | `Boolean @default(true)` |
| `createdById` | `String` → User |

##### ClientContact — جهة اتصال العميل
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `clientId` | `String` → Client |
| `name` | `String` |
| `position` | `String?` |
| `phone` / `mobile` / `email` | `String?` |
| `isPrimary` | `Boolean @default(false)` |

#### 3.4.17 عروض الأسعار (2 models)

##### Quotation — عرض السعر
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `quotationNo` | `String @unique` |
| `clientId` | `String?` → Client |
| `clientName` / `clientCompany` | `String?` |
| `projectId` | `String?` → Project |
| `status` | `QuotationStatus @default(DRAFT)` |
| `subtotal` | `Decimal @default(0)` |
| `discountPercent` / `discountAmount` | `Decimal @default(0)` |
| `vatPercent` | `Decimal @default(15)` |
| `vatAmount` / `totalAmount` | `Decimal @default(0)` |
| `validUntil` | `DateTime?` |
| `paymentTerms` / `deliveryTerms` / `warrantyTerms` | `String?` |
| `templateId` | `String?` → FinanceTemplate |
| `createdById` | `String` → User |

##### QuotationItem — بند عرض السعر
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `quotationId` | `String` → Quotation |
| `description` | `String` |
| `quantity` | `Decimal @default(1)` |
| `unit` | `String?` |
| `unitPrice` | `Decimal @default(0)` |
| `totalPrice` | `Decimal @default(0)` |
| `sortOrder` | `Int @default(0)` |

#### 3.4.18 الفواتير (3 models)

##### FinanceInvoice — الفاتورة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `invoiceNo` | `String @unique` |
| `invoiceType` | `InvoiceType @default(STANDARD)` |
| `clientId` | `String?` → Client |
| `clientName` / `clientCompany` | `String?` |
| `clientTaxNumber` | `String?` |
| `projectId` | `String?` → Project |
| `quotationId` | `String?` → Quotation |
| `status` | `FinanceInvoiceStatus @default(DRAFT)` |
| `issueDate` / `dueDate` | `DateTime?` |
| `subtotal` | `Decimal @default(0)` |
| `discountPercent` / `discountAmount` | `Decimal @default(0)` |
| `vatPercent` | `Decimal @default(15)` |
| `vatAmount` / `totalAmount` / `paidAmount` | `Decimal @default(0)` |
| `sellerName` / `sellerAddress` / `sellerPhone` | `String?` |
| `sellerTaxNumber` | `String?` |
| `qrCode` | `String?` |
| `zatcaUuid` / `zatcaHash` / `zatcaSignature` | `String?` |
| `relatedInvoiceId` | `String?` → FinanceInvoice |
| `templateId` | `String?` → FinanceTemplate |
| `createdById` | `String` → User |

##### FinanceInvoiceItem — بند الفاتورة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `invoiceId` | `String` → FinanceInvoice |
| `description` | `String` |
| `quantity` | `Decimal @default(1)` |
| `unit` | `String?` |
| `unitPrice` | `Decimal @default(0)` |
| `totalPrice` | `Decimal @default(0)` |
| `sortOrder` | `Int @default(0)` |

##### FinanceInvoicePayment — دفعة الفاتورة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `invoiceId` | `String` → FinanceInvoice |
| `amount` | `Decimal` |
| `paymentDate` | `DateTime` |
| `paymentMethod` | `PaymentMethod` |
| `referenceNo` | `String?` |
| `createdById` | `String` → User |

#### 3.4.19 المستندات المفتوحة والقوالب (2 models)

##### OpenDocument — مستند مفتوح
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `documentNo` | `String @unique` |
| `documentType` | `OpenDocumentType` |
| `title` | `String` |
| `content` | `String?` |
| `clientId` | `String?` |
| `projectId` | `String?` → Project |
| `templateId` | `String?` → FinanceTemplate |
| `createdById` | `String` → User |

##### FinanceTemplate — قالب مالي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `name` | `String` |
| `description` | `String?` |
| `templateType` | `FinanceTemplateType` |
| `isDefault` | `Boolean @default(false)` |
| `content` | `Json` |
| `settings` | `Json?` |
| `createdById` | `String` → User |

#### 3.4.20 الحسابات البنكية والمالية (3 models)

##### OrganizationBank — حساب بنكي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `name` | `String` |
| `accountNumber` | `String?` |
| `bankName` | `String?` |
| `iban` | `String?` |
| `accountType` | `FinanceAccountType @default(BANK)` |
| `openingBalance` | `Decimal @default(0)` |
| `balance` | `Decimal @default(0)` |
| `currency` | `String @default("SAR")` |
| `isActive` | `Boolean @default(true)` |
| `isDefault` | `Boolean @default(false)` |
| `createdById` | `String` → User |

##### FinanceExpense — مصروف مالي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `expenseNo` | `String @unique` |
| `category` | `OrgExpenseCategory` |
| `customCategory` | `String?` |
| `description` | `String` |
| `amount` | `Decimal` |
| `date` | `DateTime` |
| `sourceAccountId` | `String?` → OrganizationBank |
| `vendorName` | `String?` |
| `vendorTaxNumber` | `String?` |
| `projectId` | `String?` → Project |
| `status` | `FinanceTransactionStatus @default(PENDING)` |
| `sourceType` | `ExpenseSourceType @default(MANUAL)` |
| `sourceId` | `String?` |
| `paidAmount` | `Decimal @default(0)` |
| `dueDate` | `DateTime?` |
| `createdById` | `String` → User |

##### FinancePayment — إيصال دفع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `paymentNo` | `String @unique` |
| `amount` | `Decimal` |
| `date` | `DateTime` |
| `destinationAccountId` | `String?` → OrganizationBank |
| `clientId` | `String?` → Client |
| `projectId` | `String?` → Project |
| `invoiceId` | `String?` → FinanceInvoice |
| `contractTermId` | `String?` → ContractPaymentTerm |
| `paymentMethod` | `PaymentMethod @default(BANK_TRANSFER)` |
| `status` | `FinanceTransactionStatus @default(COMPLETED)` |
| `createdById` | `String` → User |

##### FinanceTransfer — تحويل مالي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `transferNo` | `String @unique` |
| `amount` | `Decimal` |
| `date` | `DateTime` |
| `fromAccountId` | `String` → OrganizationBank |
| `toAccountId` | `String` → OrganizationBank |
| `status` | `FinanceTransactionStatus @default(COMPLETED)` |
| `createdById` | `String` → User |

#### 3.4.21 إدارة الشركة (7 models)

##### CompanyExpense — مصروف الشركة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `name` | `String` |
| `category` | `CompanyExpenseCategory` |
| `amount` | `Decimal` |
| `recurrence` | `RecurrenceType @default(MONTHLY)` |
| `vendor` | `String?` |
| `startDate` | `DateTime` |
| `endDate` | `DateTime?` |
| `isActive` | `Boolean @default(true)` |

##### CompanyExpensePayment — دفعة مصروف الشركة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `expenseId` | `String` → CompanyExpense |
| `periodStart` / `periodEnd` | `DateTime` |
| `amount` | `Decimal` |
| `isPaid` | `Boolean @default(false)` |
| `dueDate` | `DateTime` |
| `bankAccountId` | `String?` → OrganizationBank |
| `financeExpenseId` | `String?` → FinanceExpense |

##### CompanyExpenseAllocation — توزيع مصروف الشركة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `expenseId` | `String` → CompanyExpense |
| `projectId` | `String` → Project |
| `percentage` | `Decimal` |
| **Unique** | `@@unique([expenseId, projectId])` |

##### Employee — الموظف
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `linkedUserId` | `String?` → User |
| `name` | `String` |
| `employeeNo` | `String?` |
| `type` | `EmployeeType` |
| `phone` / `email` | `String?` |
| `nationalId` | `String?` |
| `salaryType` | `SalaryType @default(MONTHLY)` |
| `baseSalary` | `Decimal @default(0)` |
| `housingAllowance` | `Decimal @default(0)` |
| `transportAllowance` | `Decimal @default(0)` |
| `otherAllowances` | `Decimal @default(0)` |
| `gosiSubscription` | `Decimal @default(0)` |
| `joinDate` | `DateTime` |
| `status` | `EmployeeStatus @default(ACTIVE)` |

##### EmployeeProjectAssignment — تعيين الموظف في مشروع
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `employeeId` | `String` → Employee |
| `projectId` | `String` → Project |
| `percentage` | `Decimal @default(100)` |
| `isActive` | `Boolean @default(true)` |
| **Unique** | `@@unique([employeeId, projectId])` |

##### CompanyAsset — أصل الشركة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `name` | `String` |
| `assetNo` | `String?` |
| `category` | `AssetCategory` |
| `type` | `AssetType @default(OWNED)` |
| `status` | `AssetStatus @default(AVAILABLE)` |
| `brand` / `model` / `serialNumber` | `String?` |
| `purchasePrice` | `Decimal?` |
| `monthlyRent` | `Decimal?` |
| `currentValue` | `Decimal?` |
| `currentProjectId` | `String?` → Project |

#### 3.4.22 كشوف الرواتب ودورات المصروفات (4 models)

##### PayrollRun — دورة الرواتب
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `runNo` | `Int` |
| `month` | `Int` |
| `year` | `Int` |
| `totalBaseSalary` | `Decimal @default(0)` |
| `totalAllowances` | `Decimal @default(0)` |
| `totalDeductions` | `Decimal @default(0)` |
| `totalNetSalary` | `Decimal @default(0)` |
| `employeeCount` | `Int @default(0)` |
| `status` | `PayrollRunStatus @default(DRAFT)` |
| `approvedById` | `String?` → User |
| `createdById` | `String` → User |
| **Unique** | `@@unique([organizationId, runNo])` |
| **Unique** | `@@unique([organizationId, month, year])` |

##### PayrollRunItem — بند دورة الرواتب
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `payrollRunId` | `String` → PayrollRun |
| `employeeId` | `String` → Employee |
| `baseSalary` | `Decimal` |
| `housingAllowance` | `Decimal @default(0)` |
| `transportAllowance` | `Decimal @default(0)` |
| `otherAllowances` | `Decimal @default(0)` |
| `gosiDeduction` | `Decimal @default(0)` |
| `otherDeductions` | `Decimal @default(0)` |
| `netSalary` | `Decimal` |
| `financeExpenseId` | `String?` → FinanceExpense |
| **Unique** | `@@unique([payrollRunId, employeeId])` |

##### CompanyExpenseRun — دورة مصروفات الشركة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `runNo` | `Int` |
| `month` | `Int` |
| `year` | `Int` |
| `totalAmount` | `Decimal @default(0)` |
| `itemCount` | `Int @default(0)` |
| `status` | `ExpenseRunStatus @default(DRAFT)` |
| **Unique** | `@@unique([organizationId, runNo])` |
| **Unique** | `@@unique([organizationId, month, year])` |

##### CompanyExpenseRunItem — بند دورة مصروفات الشركة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `expenseRunId` | `String` → CompanyExpenseRun |
| `companyExpenseId` | `String` → CompanyExpense |
| `name` | `String` |
| `category` | `CompanyExpenseCategory` |
| `originalAmount` | `Decimal` |
| `amount` | `Decimal` |
| `financeExpenseId` | `String?` → FinanceExpense |
| **Unique** | `@@unique([expenseRunId, companyExpenseId])` |

#### 3.4.23 التسعير ودراسات التكلفة (5 models)

##### CostStudy — دراسة التكلفة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `createdById` | `String` → User |
| `name` | `String` |
| `customerName` | `String?` |
| `projectType` | `ProjectType?` |
| `landArea` / `buildingArea` | `Decimal?` |
| `numberOfFloors` | `Int?` |
| `hasBasement` | `Boolean @default(false)` |
| `finishingLevel` | `String?` |
| `structuralCost` / `finishingCost` / `mepCost` / `laborCost` | `Decimal @default(0)` |
| `overheadPercent` / `profitPercent` / `contingencyPercent` | `Decimal @default(0)` |
| `vatIncluded` | `Boolean @default(true)` |
| `totalCost` | `Decimal @default(0)` |
| `buildingConfig` | `Json?` |

##### StructuralItem — بند إنشائي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `costStudyId` | `String` → CostStudy |
| `category` / `subCategory` | `String` |
| `name` | `String` |
| `dimensions` | `Json?` |
| `quantity` | `Decimal` |
| `unit` | `String` |
| `concreteVolume` / `steelWeight` / `steelRatio` | `Decimal?` |
| `wastagePercent` | `Decimal @default(0)` |
| `materialCost` / `laborCost` / `totalCost` | `Decimal @default(0)` |

##### FinishingItem — بند تشطيب
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `costStudyId` | `String` → CostStudy |
| `category` / `subCategory` | `String` |
| `floorId` / `floorName` | `String?` |
| `area` / `length` / `height` / `width` / `perimeter` | `Decimal?` |
| `quantity` | `Decimal` |
| `unit` | `String` |
| `calculationMethod` | `String?` |
| `calculationData` | `Json?` |
| `qualityLevel` / `brand` | `String?` |
| `wastagePercent` | `Decimal @default(0)` |
| `materialPrice` / `laborPrice` | `Decimal @default(0)` |
| `materialCost` / `laborCost` / `totalCost` | `Decimal @default(0)` |

##### MEPItem — بند ميكانيكا/كهرباء/سباكة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `costStudyId` | `String` → CostStudy |
| `category` | `String` |
| `itemType` | `String?` |
| `name` | `String` |
| `quantity` | `Decimal` |
| `unit` | `String` |
| `unitPrice` | `Decimal @default(0)` |
| `totalCost` | `Decimal @default(0)` |

##### LaborItem — بند عمالة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `costStudyId` | `String` → CostStudy |
| `laborType` / `workerType` | `String` |
| `name` | `String` |
| `quantity` | `Int` |
| `dailyRate` | `Decimal` |
| `durationDays` | `Int` |
| `insuranceCost` / `housingCost` / `otherCosts` | `Decimal @default(0)` |
| `totalCost` | `Decimal @default(0)` |

#### 3.4.24 عروض أسعار التسعير (1 model)

##### Quote — عرض سعر (من دراسة التكلفة)
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `costStudyId` | `String` → CostStudy |
| `quoteNumber` | `String @unique` |
| `quoteType` | `String?` |
| `clientName` / `clientCompany` / `clientPhone` / `clientEmail` | `String?` |
| `subtotal` / `overheadAmount` / `profitAmount` / `vatAmount` / `totalAmount` | `Decimal @default(0)` |
| `validUntil` | `DateTime?` |
| `showUnitPrices` / `showQuantities` / `showItemDescriptions` | `Boolean @default(true)` |
| `includeTerms` / `includeCoverPage` | `Boolean @default(true)` |
| `selectedCategories` | `Json?` |
| `status` | `String @default("draft")` |

#### 3.4.25 سجلات التدقيق والتسلسلات (3 models)

##### OrganizationAuditLog — سجل تدقيق المنظمة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `actorId` | `String` → User |
| `action` | `OrgAuditAction` |
| `entityType` | `String` |
| `entityId` | `String` |
| `metadata` | `Json?` (JsonB) |
| `ipAddress` | `String?` |

##### OrganizationSequence — تسلسل المنظمة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `sequenceKey` | `String` |
| `currentValue` | `Int @default(0)` |
| **Unique** | `@@unique([organizationId, sequenceKey])` |

##### AiChat — محادثة ذكاء اصطناعي
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `userId` | `String` → User |
| `title` | `String?` |
| `type` | `String @default("chat")` |
| `messages` | `Json` |
| `metadata` | `Json?` |

#### 3.4.26 الاشتراكات والفوترة (4 models)

##### PlanConfig — إعدادات الخطة
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `plan` | `PlanType @unique` |
| `name` | `Json` |
| `maxUsers` / `maxProjects` / `maxStorageGB` | `Int` |
| `monthlyPrice` / `yearlyPrice` | `Decimal @default(0)` |
| `features` | `Json?` |
| `isActive` | `Boolean @default(true)` |

##### Purchase — عملية شراء
| الحقل | النوع |
|-------|-------|
| `id` | `String @id` |
| `organizationId` | `String` → Organization |
| `userId` | `String` → User |
| `type` | `PurchaseType` |
| `customerId` / `subscriptionId` / `productId` | `String?` |
| `status` | `String?` |

##### SubscriptionEvent — حدث اشتراك
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String` → Organization |
| `eventType` | `String` |
| `stripeEventId` | `String @unique` |
| `data` | `Json` (JsonB) |

##### SuperAdminLog — سجل المشرف العام
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `adminId` | `String` → User |
| `action` | `String` |
| `targetType` | `String` |
| `targetId` | `String` |
| `targetOrgId` | `String?` → Organization |
| `details` | `Json?` (JsonB) |
| `ipAddress` | `String?` |

#### 3.4.27 إعدادات المنظمة المالية (1 model)

##### OrganizationFinanceSettings — إعدادات مالية
| الحقل | النوع |
|-------|-------|
| `id` | `String @id @default(cuid())` |
| `organizationId` | `String @unique` → Organization |
| `companyNameAr` / `companyNameEn` | `String?` |
| `logo` | `String?` |
| `address` / `addressEn` | `String?` |
| `phone` / `email` / `website` | `String?` |
| `taxNumber` / `commercialReg` | `String?` |
| `bankName` / `bankNameEn` / `accountName` / `iban` / `accountNumber` / `swiftCode` | `String?` |
| `headerText` / `footerText` / `thankYouMessage` | `String?` |
| `defaultVatPercent` | `Decimal @default(15)` |
| `defaultCurrency` | `String @default("SAR")` |
| `defaultPaymentTerms` / `defaultDeliveryTerms` / `defaultWarrantyTerms` | `String?` |
| `quotationValidityDays` | `Int @default(30)` |

### 3.5 العلاقات الرئيسية

```
User ──────────┐
               │ 1:N
Organization ──┤──── Projects ──── DailyReports
               │         │──── Photos
               │         │──── Issues
               │         │──── Expenses
               │         │──── Claims
               │         │──── Documents
               │         │──── Milestones ──── Activities ──── Dependencies
               │         │──── Subcontracts ──── Payments
               │         │──── Contract ──── PaymentTerms
               │         │──── ChangeOrders
               │         │──── Messages
               │         └──── OwnerAccess
               │
               ├──── Clients ──── Contacts
               │         │──── Quotations ──── Items
               │         └──── Invoices ──── Items, Payments
               │
               ├──── BankAccounts
               ├──── Expenses (Finance)
               ├──── Payments (Finance)
               ├──── Transfers
               │
               ├──── Employees ──── Assignments
               ├──── CompanyAssets
               ├──── CompanyExpenses ──── Payments, Allocations
               ├──── PayrollRuns ──── Items
               ├──── ExpenseRuns ──── Items
               │
               ├──── CostStudies ──── Structural/Finishing/MEP/Labor Items
               ├──── Templates (Finance)
               ├──── Roles
               └──── AuditLogs
```

### 3.6 قرارات التصميم المهمة

1. **`Decimal` لكل الحقول المالية** — لتجنب أخطاء floating point في الحسابات المالية
2. **`organizationId` على كل model أعمال** — عزل بيانات Multi-tenant
3. **`createdById` على كل model** — تتبع من أنشأ كل سجل
4. **`cuid()` كـ default ID** — معرفات فريدة عالمياً وقابلة للفرز زمنياً
5. **Cascading Deletes** — حذف المنظمة يحذف كل بياناتها
6. **Composite Unique Constraints** — مثل `[projectId, claimNo]` لمنع التكرار
7. **JsonB للبيانات المرنة** — `metadata`, `permissions`, `snapshotData`
8. **فصل Project finance عن Organization finance** — `ProjectExpense` vs `FinanceExpense`

---

## 4. نظام المصادقة والصلاحيات

```
الملف الرئيسي: packages/auth/auth.ts
الإطار: BetterAuth 1.4.7
```

### 4.1 طرق المصادقة

| الطريقة | الحالة | التفاصيل |
|---------|--------|----------|
| بريد إلكتروني + كلمة مرور | مفعل | التحقق من البريد مطلوب |
| Magic Link | مفعل | رابط سحري عبر البريد |
| Google OAuth | مفعل | تسجيل اجتماعي |
| GitHub OAuth | مفعل | تسجيل اجتماعي |
| Passkeys (WebAuthn) | مفعل | مفاتيح مرور بيومترية |
| Two-Factor Auth (2FA) | مفعل | TOTP مع رموز احتياطية |

### 4.2 إعدادات الجلسة

```typescript
// packages/auth/auth.ts
session: {
  expiresIn: 2_592_000,  // 30 يوم
  freshAge: 300,          // 5 دقائق
}
```

- **مدة الجلسة:** 30 يوماً
- **عمر الجلسة الطازجة:** 5 دقائق — بعدها يتم تحديث الجلسة
- **ربط الحسابات:** مفعل مع Google و GitHub كمزودين موثوقين

### 4.3 إضافات BetterAuth (Plugins)

| الإضافة | الوظيفة |
|---------|---------|
| `username` | دعم اسم المستخدم |
| `admin` | صلاحيات المشرف العام |
| `passkey` | مفاتيح المرور البيومترية |
| `magicLink` | الروابط السحرية |
| `organization` | نظام المنظمات |
| `openAPI` | توثيق OpenAPI للمصادقة |
| `invitationOnlyPlugin` | التسجيل بالدعوة فقط (اختياري) |
| `twoFactor` | المصادقة الثنائية |
| `inferAdditionalFields` | حقول إضافية للمستخدم |
| `organizationClient` | عميل المنظمة |

### 4.4 حقول المستخدم الإضافية

```typescript
user: {
  additionalFields: {
    onboardingComplete: { type: "boolean" },
    locale: { type: "string" },
    isActive: { type: "boolean", defaultValue: true },
    mustChangePassword: { type: "boolean", defaultValue: false },
    accountType: { type: "string" },
    lastLoginAt: { type: "string" },
  }
}
```

### 4.5 Hooks (الخطافات)

| الحدث | الإجراء |
|-------|---------|
| بعد تسجيل الدخول | تحديث `lastLoginAt` |
| إنشاء منظمة | إنشاء دور `OWNER` تلقائياً |
| قبول دعوة | تعيين الدور المناسب |
| إضافة عضو | تحديث عدد المقاعد في Stripe |
| إزالة عضو | تحديث عدد المقاعد في Stripe |
| حذف مستخدم | إلغاء الاشتراكات المرتبطة |
| التحقق من الحساب | فحص `isActive` عند كل طلب |

### 4.6 نظام الأدوار (Role System)

#### 4.6.1 أنواع الأدوار

```
الملف: packages/database/prisma/permissions.ts
```

| نوع الدور | الاسم العربي | الوصف |
|-----------|-------------|-------|
| `OWNER` | مالك | صلاحيات كاملة غير قابلة للتعديل |
| `PROJECT_MANAGER` | مدير مشروع | إدارة المشاريع والفرق والمالية |
| `ACCOUNTANT` | محاسب | الوصول المالي والتقارير |
| `ENGINEER` | مهندس | التنفيذ والمتابعة الفنية |
| `SUPERVISOR` | مشرف | الإشراف الميداني |
| `CUSTOM` | مخصص | صلاحيات قابلة للتخصيص |

#### 4.6.2 مصفوفة الصلاحيات الكاملة

##### قسم المشاريع (projects) — 6 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `viewFinance` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `manageTeam` | ✅ | ✅ | ❌ | ❌ | ❌ |

##### قسم الكميات (quantities) — 5 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `create` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `edit` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `pricing` | ✅ | ✅ | ✅ | ❌ | ❌ |

##### قسم التسعير (pricing) — 4 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `studies` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `quotations` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `pricing` | ✅ | ✅ | ✅ | ❌ | ❌ |

##### قسم المالية (finance) — 6 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `quotations` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `invoices` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `payments` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `reports` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `settings` | ✅ | ❌ | ✅ | ❌ | ❌ |

##### قسم الموظفين (employees) — 6 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `payroll` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `attendance` | ✅ | ✅ | ❌ | ❌ | ❌ |

##### قسم الشركة (company) — 4 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `expenses` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `assets` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `reports` | ✅ | ❌ | ✅ | ❌ | ❌ |

##### قسم الإعدادات (settings) — 5 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `organization` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `roles` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `billing` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `integrations` | ✅ | ❌ | ❌ | ❌ | ❌ |

##### قسم التقارير (reports) — 3 صلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|-----------|
| `view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `approve` | ✅ | ✅ | ❌ | ❌ | ❌ |

#### 4.6.3 ملخص الصلاحيات لكل دور

| الدور | عدد الصلاحيات | النسبة من الإجمالي |
|-------|-------------|-------------------|
| OWNER | 42/42 | 100% |
| PROJECT_MANAGER | 25/42 | 60% |
| ACCOUNTANT | 22/42 | 52% |
| ENGINEER | 9/42 | 21% |
| SUPERVISOR | 5/42 | 12% |

### 4.7 نظام أدوار المشروع (Project Roles)

بالإضافة لأدوار المنظمة، هناك نظام أدوار خاص بالمشاريع عبر `ProjectMember`:

```typescript
enum ProjectRole {
  MANAGER    // مدير المشروع — يرى كل شيء
  ENGINEER   // مهندس — يرى التنفيذ والميداني
  SUPERVISOR // مشرف — يرى الميداني فقط
  ACCOUNTANT // محاسب — يرى المالية فقط
  VIEWER     // مشاهد — قراءة فقط
}
```

يتم استخدام `useProjectRole()` hook في الواجهة لإخفاء/إظهار أقسام التنقل بناءً على دور المستخدم في المشروع.

### 4.8 التحقق في طبقة API

```
الملف: packages/api/orpc/procedures.ts
```

أربعة مستويات من الـ Procedures:

| المستوى | الوصف | التحقق |
|---------|-------|--------|
| `publicProcedure` | عام — لا يتطلب مصادقة | لا شيء |
| `protectedProcedure` | محمي — يتطلب جلسة نشطة | `session` + `isActive` |
| `adminProcedure` | مشرف — يتطلب دور admin | `user.role === "admin"` |
| `subscriptionProcedure` | اشتراك — يتطلب اشتراك نشط | `org.status` + `trial` + `plan` |

### 4.9 Middleware Pipeline

```
الملف: packages/api/orpc/middleware/
```

| Middleware | الملف | الوظيفة |
|-----------|-------|---------|
| locale | `locale-middleware.ts` | استخراج اللغة من cookie `NEXT_LOCALE` |
| subscription | `subscription-middleware.ts` | التحقق من الاشتراك (يتجاوز admin و isFreeOverride) |
| limits | `limits-middleware.ts` | التحقق من حدود المستخدمين والمشاريع |

---

## 5. طبقة الـ API

```
الملف الرئيسي: packages/api/orpc/router.ts
الإطار: ORPC 1.13.2 + Hono.js 4.10.5
```

### 5.1 هيكل الـ Router

```typescript
// packages/api/orpc/router.ts
const router = publicProcedure.router({
  admin,              // إدارة النظام (legacy)
  newsletter,         // النشرة البريدية
  contact,            // نموذج التواصل
  organizations,      // المنظمات
  users,              // المستخدمين
  payments,           // المدفوعات
  ai,                 // الذكاء الاصطناعي
  roles,              // الأدوار
  orgUsers,           // مستخدمي المنظمة
  pricing,            // التسعير
  projects,           // المشاريع
  projectField,       // الميداني
  projectFinance,     // مالية المشاريع
  projectDocuments,   // المستندات
  projectChat,        // الدردشة
  notifications,      // الإشعارات
  projectOwner,       // بوابة المالك
  attachments,        // المرفقات
  projectTemplates,   // قوالب المشاريع
  projectInsights,    // التحليلات
  projectUpdates,     // التحديثات
  digests,            // الملخصات
  integrations,       // التكاملات
  exports,            // التصدير
  shares,             // المشاركة
  projectTimeline,    // الجدول الزمني
  projectChangeOrders,// أوامر التغيير
  projectContract,    // عقود المشاريع
  dashboard,          // لوحة التحكم
  projectTeam,        // فريق المشروع
  finance,            // المالية
  subcontracts,       // المقاولات من الباطن
  company,            // إدارة الشركة
  projectExecution,   // التنفيذ
  superAdmin,         // المشرف العام
})
```

### 5.2 جميع الـ Endpoints (400+)

#### 5.2.1 admin — إدارة النظام (Legacy)

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `admin.users.list` | admin | قائمة المستخدمين |
| `admin.organizations.list` | admin | قائمة المنظمات |
| `admin.organizations.find` | admin | بحث عن منظمة |

#### 5.2.2 newsletter — النشرة البريدية

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `newsletter.subscribe` | public + rate limit | الاشتراك في النشرة |

#### 5.2.3 contact — نموذج التواصل

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `contact.submit` | public + rate limit | إرسال رسالة تواصل |

#### 5.2.4 organizations — المنظمات

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `organizations.generateSlug` | public | توليد slug فريد |
| `organizations.createLogoUploadUrl` | public | رابط رفع الشعار |

#### 5.2.5 payments — المدفوعات

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `payments.createCheckoutLink` | protected | رابط الدفع |
| `payments.createCustomerPortalLink` | protected | بوابة الفوترة |
| `payments.listPurchases` | protected | قائمة المشتريات |

#### 5.2.6 users — المستخدمين

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `users.avatarUploadUrl` | protected | رابط رفع الصورة |

#### 5.2.7 ai — الذكاء الاصطناعي

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `ai.chats.list` | protected | قائمة المحادثات |
| `ai.chats.find` | protected | بحث عن محادثة |
| `ai.chats.create` | protected | إنشاء محادثة |
| `ai.chats.update` | protected | تحديث محادثة |
| `ai.chats.delete` | protected | حذف محادثة |
| `ai.chats.messages.add` | protected | إضافة رسالة |

#### 5.2.8 roles — الأدوار

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `roles.list` | protected | قائمة الأدوار |
| `roles.create` | protected | إنشاء دور |
| `roles.update` | protected | تحديث دور |
| `roles.delete` | protected | حذف دور |

#### 5.2.9 orgUsers — مستخدمي المنظمة

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `orgUsers.list` | protected | قائمة المستخدمين |
| `orgUsers.create` | protected | إنشاء مستخدم |
| `orgUsers.update` | protected | تحديث مستخدم |
| `orgUsers.toggleActive` | protected | تفعيل/تعطيل |
| `orgUsers.delete` | protected | حذف مستخدم |

#### 5.2.10 projects — المشاريع

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projects.list` | protected | قائمة المشاريع |
| `projects.create` | protected | إنشاء مشروع |
| `projects.getById` | protected | جلب مشروع |
| `projects.update` | protected | تحديث مشروع |
| `projects.delete` | protected | حذف مشروع |
| `projects.getNextProjectNo` | protected | الرقم التالي |

#### 5.2.11 projectTeam — فريق المشروع

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectTeam.list` | protected | قائمة الأعضاء |
| `projectTeam.add` | protected | إضافة عضو |
| `projectTeam.updateRole` | protected | تحديث الدور |
| `projectTeam.remove` | protected | إزالة عضو |

#### 5.2.12 projectField — التنفيذ الميداني

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectField.createDailyReport` | protected | إنشاء تقرير يومي |
| `projectField.listDailyReports` | protected | قائمة التقارير |
| `projectField.createPhoto` | protected | رفع صورة |
| `projectField.listPhotos` | protected | قائمة الصور |
| `projectField.deletePhoto` | protected | حذف صورة |
| `projectField.createIssue` | protected | إنشاء مشكلة |
| `projectField.listIssues` | protected | قائمة المشاكل |
| `projectField.updateIssue` | protected | تحديث مشكلة |
| `projectField.addProgressUpdate` | protected | إضافة تحديث تقدم |
| `projectField.listProgressUpdates` | protected | قائمة التحديثات |
| `projectField.getTimeline` | protected | الخط الزمني |

#### 5.2.13 projectFinance — مالية المشاريع

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectFinance.getSummary` | protected | ملخص مالي |
| `projectFinance.listExpenses` | protected | قائمة المصروفات |
| `projectFinance.createExpense` | protected | إنشاء مصروف |
| `projectFinance.updateExpense` | protected | تحديث مصروف |
| `projectFinance.deleteExpense` | protected | حذف مصروف |
| `projectFinance.listClaims` | protected | قائمة المطالبات |
| `projectFinance.createClaim` | protected | إنشاء مطالبة |
| `projectFinance.updateClaim` | protected | تحديث مطالبة |
| `projectFinance.updateClaimStatus` | protected | تغيير حالة المطالبة |
| `projectFinance.deleteClaim` | protected | حذف مطالبة |
| `projectFinance.listSubcontracts` | protected | قائمة العقود |
| `projectFinance.getSubcontract` | protected | جلب عقد |
| `projectFinance.createSubcontract` | protected | إنشاء عقد |
| `projectFinance.updateSubcontract` | protected | تحديث عقد |
| `projectFinance.deleteSubcontract` | protected | حذف عقد |
| `projectFinance.getExpensesByCategory` | protected | المصروفات بالفئة |
| `projectFinance.getPaymentsClaimsTimeline` | protected | خط زمني مالي |

#### 5.2.14 projectDocuments — المستندات

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectDocuments.list` | protected | قائمة المستندات |
| `projectDocuments.create` | protected | إنشاء مستند |
| `projectDocuments.get` | protected | جلب مستند |
| `projectDocuments.createApprovalRequest` | protected | طلب موافقة |
| `projectDocuments.actOnApproval` | protected | اتخاذ قرار |
| `projectDocuments.getApproval` | protected | جلب الموافقة |

#### 5.2.15 projectChat — الدردشة

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectChat.listMessages` | protected | قائمة الرسائل |
| `projectChat.sendMessage` | protected | إرسال رسالة |
| `projectChat.getUnreadCount` | protected | عدد غير المقروء |
| `projectChat.markAsRead` | protected | تحديد كمقروء |

#### 5.2.16 notifications — الإشعارات

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `notifications.list` | protected | قائمة الإشعارات |
| `notifications.markRead` | protected | تحديد كمقروء |
| `notifications.unreadCount` | protected | عدد غير المقروء |

#### 5.2.17 projectOwner — بوابة المالك

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectOwner.createAccess` | protected | إنشاء رابط وصول |
| `projectOwner.listAccess` | protected | قائمة الروابط |
| `projectOwner.revokeAccess` | protected | إلغاء رابط |
| `projectOwner.sendOfficialUpdate` | protected | إرسال تحديث رسمي |
| `projectOwner.portal.getSummary` | public (token) | ملخص المشروع |
| `projectOwner.portal.getSchedule` | public (token) | الجدول الزمني |
| `projectOwner.portal.getPayments` | public (token) | المدفوعات |
| `projectOwner.portal.listMessages` | public (token) | الرسائل |
| `projectOwner.portal.sendMessage` | public (token) | إرسال رسالة |
| `projectOwner.portal.listUpdates` | public (token) | التحديثات |

#### 5.2.18 projectTimeline — الجدول الزمني

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectTimeline.listMilestones` | protected | قائمة المراحل |
| `projectTimeline.createMilestone` | protected | إنشاء مرحلة |
| `projectTimeline.updateMilestone` | protected | تحديث مرحلة |
| `projectTimeline.deleteMilestone` | protected | حذف مرحلة |
| `projectTimeline.reorderMilestones` | protected | إعادة ترتيب |
| `projectTimeline.markActual` | protected | تسجيل تاريخ فعلي |
| `projectTimeline.startMilestone` | protected | بدء مرحلة |
| `projectTimeline.completeMilestone` | protected | إكمال مرحلة |
| `projectTimeline.getHealth` | protected | صحة الجدول |

#### 5.2.19 projectExecution — نظام التنفيذ

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectExecution.listActivities` | protected | قائمة الأنشطة |
| `projectExecution.createActivity` | protected | إنشاء نشاط |
| `projectExecution.updateActivity` | protected | تحديث نشاط |
| `projectExecution.deleteActivity` | protected | حذف نشاط |
| `projectExecution.reorderActivities` | protected | إعادة ترتيب |
| `projectExecution.updateActivityProgress` | protected | تحديث تقدم |
| `projectExecution.bulkUpdateProgress` | protected | تحديث جماعي |
| `projectExecution.listDependencies` | protected | قائمة التبعيات |
| `projectExecution.createDependency` | protected | إنشاء تبعية |
| `projectExecution.deleteDependency` | protected | حذف تبعية |
| `projectExecution.validateDependencies` | protected | التحقق من التبعيات |
| `projectExecution.listBaselines` | protected | قائمة الخطوط الأساسية |
| `projectExecution.createBaseline` | protected | إنشاء خط أساسي |
| `projectExecution.getBaseline` | protected | جلب خط أساسي |
| `projectExecution.setActiveBaseline` | protected | تعيين خط أساسي نشط |
| `projectExecution.deleteBaseline` | protected | حذف خط أساسي |
| `projectExecution.getCalendar` | protected | جلب التقويم |
| `projectExecution.upsertCalendar` | protected | إنشاء/تحديث تقويم |
| `projectExecution.listChecklists` | protected | قائمة المهام |
| `projectExecution.createChecklistItem` | protected | إنشاء مهمة |
| `projectExecution.toggleChecklistItem` | protected | تبديل حالة مهمة |
| `projectExecution.deleteChecklistItem` | protected | حذف مهمة |
| `projectExecution.reorderChecklist` | protected | إعادة ترتيب |
| `projectExecution.getDashboard` | protected | لوحة التحكم |
| `projectExecution.getCriticalPath` | protected | المسار الحرج |
| `projectExecution.getLookahead` | protected | نظرة استباقية |
| `projectExecution.getDelayAnalysis` | protected | تحليل التأخير |
| `projectExecution.getPlannedVsActual` | protected | مخطط vs فعلي |

#### 5.2.20 projectChangeOrders — أوامر التغيير

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectChangeOrders.list` | protected | القائمة |
| `projectChangeOrders.getStats` | protected | الإحصائيات |
| `projectChangeOrders.get` | protected | جلب أمر تغيير |
| `projectChangeOrders.create` | protected | إنشاء |
| `projectChangeOrders.update` | protected | تحديث |
| `projectChangeOrders.delete` | protected | حذف |
| `projectChangeOrders.submit` | protected | تقديم |
| `projectChangeOrders.approve` | protected | اعتماد |
| `projectChangeOrders.reject` | protected | رفض |
| `projectChangeOrders.implement` | protected | تنفيذ |
| `projectChangeOrders.ownerList` | public (token) | قائمة المالك |
| `projectChangeOrders.ownerGet` | public (token) | جلب للمالك |

#### 5.2.21 projectContract — عقد المشروع

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectContract.get` | protected | جلب العقد |
| `projectContract.upsert` | protected | إنشاء/تحديث |
| `projectContract.setPaymentTerms` | protected | شروط الدفع |
| `projectContract.getSummary` | protected | الملخص |
| `projectContract.getNextNo` | protected | الرقم التالي |
| `projectContract.getPaymentTermsProgress` | protected | تقدم الدفعات |

#### 5.2.22 dashboard — لوحة التحكم

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `dashboard.getStats` | protected | الإحصائيات |
| `dashboard.getProjectDistribution` | protected | توزيع المشاريع |
| `dashboard.getTypeDistribution` | protected | توزيع الأنواع |
| `dashboard.getFinancialSummary` | protected | ملخص مالي |
| `dashboard.getUpcoming` | protected | القادم |
| `dashboard.getOverdue` | protected | المتأخر |
| `dashboard.getActivities` | protected | الأنشطة الأخيرة |
| `dashboard.getFinancialTrend` | protected | الاتجاه المالي |

#### 5.2.23 pricing — التسعير

**دراسات التكلفة (studies):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `pricing.studies.list` | protected | قائمة الدراسات |
| `pricing.studies.getById` | protected | جلب دراسة |
| `pricing.studies.create` | protected | إنشاء دراسة |
| `pricing.studies.update` | protected | تحديث دراسة |
| `pricing.studies.delete` | protected | حذف دراسة |
| `pricing.studies.duplicate` | protected | نسخ دراسة |
| `pricing.studies.recalculate` | protected | إعادة حساب |
| `pricing.studies.structuralItem.create` | protected | إنشاء بند إنشائي |
| `pricing.studies.structuralItem.update` | protected | تحديث بند إنشائي |
| `pricing.studies.structuralItem.delete` | protected | حذف بند إنشائي |
| `pricing.studies.finishingItem.create` | protected | إنشاء بند تشطيب |
| `pricing.studies.finishingItem.createBatch` | protected | إنشاء مجموعة |
| `pricing.studies.finishingItem.update` | protected | تحديث بند تشطيب |
| `pricing.studies.finishingItem.delete` | protected | حذف بند تشطيب |
| `pricing.studies.finishingItem.reorder` | protected | إعادة ترتيب |
| `pricing.studies.buildingConfig.update` | protected | تحديث إعدادات المبنى |
| `pricing.studies.mepItem.create` | protected | إنشاء بند MEP |
| `pricing.studies.mepItem.createBatch` | protected | إنشاء مجموعة MEP |
| `pricing.studies.quote.list` | protected | قائمة العروض |
| `pricing.studies.quote.create` | protected | إنشاء عرض |
| `pricing.studies.quote.getById` | protected | جلب عرض |
| `pricing.studies.quote.update` | protected | تحديث عرض |
| `pricing.studies.quote.delete` | protected | حذف عرض |

**عروض الأسعار (quotations):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `pricing.quotations.list` | protected | القائمة |
| `pricing.quotations.getById` | protected | الجلب |
| `pricing.quotations.create` | protected | الإنشاء |
| `pricing.quotations.update` | protected | التحديث |
| `pricing.quotations.updateItems` | protected | تحديث البنود |
| `pricing.quotations.updateStatus` | protected | تحديث الحالة |
| `pricing.quotations.delete` | protected | الحذف |
| `pricing.quotations.convertToInvoice` | protected | تحويل لفاتورة |

#### 5.2.24 finance — المالية

**العملاء (clients):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.clients.list` | protected | القائمة |
| `finance.clients.getById` | protected | الجلب |
| `finance.clients.create` | protected | الإنشاء |
| `finance.clients.update` | protected | التحديث |
| `finance.clients.delete` | protected | الحذف |
| `finance.clients.contacts.list` | protected | قائمة جهات الاتصال |
| `finance.clients.contacts.create` | protected | إنشاء جهة |
| `finance.clients.contacts.update` | protected | تحديث جهة |
| `finance.clients.contacts.delete` | protected | حذف جهة |
| `finance.clients.contacts.setPrimary` | protected | تعيين الأساسية |

**الفواتير (invoices):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.invoices.list` | protected | القائمة |
| `finance.invoices.getById` | protected | الجلب |
| `finance.invoices.create` | protected | الإنشاء |
| `finance.invoices.update` | protected | التحديث |
| `finance.invoices.updateItems` | protected | تحديث البنود |
| `finance.invoices.updateStatus` | protected | تحديث الحالة |
| `finance.invoices.convertToTax` | protected | تحويل لضريبية |
| `finance.invoices.addPayment` | protected | إضافة دفعة |
| `finance.invoices.deletePayment` | protected | حذف دفعة |
| `finance.invoices.delete` | protected | الحذف |
| `finance.invoices.issue` | protected | إصدار |
| `finance.invoices.duplicate` | protected | نسخ |
| `finance.invoices.createCreditNote` | protected | إشعار دائن |
| `finance.invoices.updateNotes` | protected | تحديث الملاحظات |
| `finance.invoices.getActivity` | protected | سجل النشاط |

**المستندات المفتوحة (documents):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.documents.list` | protected | القائمة |
| `finance.documents.getById` | protected | الجلب |
| `finance.documents.create` | protected | الإنشاء |
| `finance.documents.update` | protected | التحديث |
| `finance.documents.delete` | protected | الحذف |

**القوالب (templates):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.templates.list` | protected | القائمة |
| `finance.templates.getById` | protected | الجلب |
| `finance.templates.getDefault` | protected | القالب الافتراضي |
| `finance.templates.create` | protected | الإنشاء |
| `finance.templates.update` | protected | التحديث |
| `finance.templates.setDefault` | protected | تعيين الافتراضي |
| `finance.templates.delete` | protected | الحذف |
| `finance.templates.seed` | protected | بذر القوالب |

**التقارير (reports):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.reports.revenueByPeriod` | protected | الإيرادات بالفترة |
| `finance.reports.revenueByProject` | protected | الإيرادات بالمشروع |
| `finance.reports.revenueByClient` | protected | الإيرادات بالعميل |
| `finance.reports.conversionRate` | protected | نسبة التحويل |
| `finance.reports.quotationStats` | protected | إحصائيات العروض |
| `finance.reports.invoiceStats` | protected | إحصائيات الفواتير |

**الحسابات البنكية (banks):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.banks.list` | protected | القائمة |
| `finance.banks.getById` | protected | الجلب |
| `finance.banks.getSummary` | protected | الملخص |
| `finance.banks.reconcile` | protected | التسوية |
| `finance.banks.create` | protected | الإنشاء |
| `finance.banks.update` | protected | التحديث |
| `finance.banks.setDefault` | protected | تعيين الافتراضي |
| `finance.banks.delete` | protected | الحذف |

**المصروفات (expenses):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.expenses.list` | protected | القائمة |
| `finance.expenses.listUnified` | protected | القائمة الموحدة |
| `finance.expenses.getById` | protected | الجلب |
| `finance.expenses.getSummary` | protected | الملخص |
| `finance.expenses.create` | protected | الإنشاء |
| `finance.expenses.update` | protected | التحديث |
| `finance.expenses.delete` | protected | الحذف |
| `finance.expenses.pay` | protected | الدفع |
| `finance.expenses.cancel` | protected | الإلغاء |

**إيصالات الدفع (orgPayments):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.orgPayments.list` | protected | القائمة |
| `finance.orgPayments.getById` | protected | الجلب |
| `finance.orgPayments.create` | protected | الإنشاء |
| `finance.orgPayments.update` | protected | التحديث |
| `finance.orgPayments.delete` | protected | الحذف |

**التحويلات (transfers):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.transfers.list` | protected | القائمة |
| `finance.transfers.getById` | protected | الجلب |
| `finance.transfers.create` | protected | الإنشاء |
| `finance.transfers.cancel` | protected | الإلغاء |

**لوحات التحكم والإعدادات:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `finance.dashboard` | protected | لوحة التحكم |
| `finance.outstanding` | protected | المبالغ المستحقة |
| `finance.projectFinance` | protected | مالية المشروع |
| `finance.orgDashboard` | protected | لوحة المنظمة |
| `finance.settings.get` | protected | جلب الإعدادات |
| `finance.settings.update` | protected | تحديث الإعدادات |
| `finance.settings.createLogoUploadUrl` | protected | رابط رفع الشعار |

#### 5.2.25 subcontracts — المقاولات من الباطن

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `subcontracts.list` | protected | القائمة |
| `subcontracts.get` | protected | الجلب |
| `subcontracts.create` | protected | الإنشاء |
| `subcontracts.update` | protected | التحديث |
| `subcontracts.delete` | protected | الحذف |
| `subcontracts.setPaymentTerms` | protected | شروط الدفع |
| `subcontracts.getPaymentTermsProgress` | protected | تقدم الدفعات |
| `subcontracts.getSummary` | protected | الملخص |
| `subcontracts.createChangeOrder` | protected | أمر تغيير |
| `subcontracts.updateChangeOrder` | protected | تحديث أمر تغيير |
| `subcontracts.deleteChangeOrder` | protected | حذف أمر تغيير |
| `subcontracts.createPayment` | protected | إنشاء دفعة |
| `subcontracts.generateContractNo` | protected | توليد رقم العقد |

#### 5.2.26 company — إدارة الشركة

**الموظفون (employees):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `company.employees.list` | protected | القائمة |
| `company.employees.getById` | protected | الجلب |
| `company.employees.create` | protected | الإنشاء |
| `company.employees.update` | protected | التحديث |
| `company.employees.terminate` | protected | إنهاء خدمة |
| `company.employees.getSummary` | protected | الملخص |
| `company.employees.assignments.list` | protected | التعيينات |
| `company.employees.assignments.byProject` | protected | بالمشروع |
| `company.employees.assignments.assign` | protected | تعيين |
| `company.employees.assignments.update` | protected | تحديث تعيين |
| `company.employees.assignments.remove` | protected | إزالة تعيين |

**مصروفات الشركة (expenses):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `company.expenses.list` | protected | القائمة |
| `company.expenses.getById` | protected | الجلب |
| `company.expenses.create` | protected | الإنشاء |
| `company.expenses.update` | protected | التحديث |
| `company.expenses.deactivate` | protected | التعطيل |
| `company.expenses.getSummary` | protected | الملخص |
| `company.expenses.getDashboardData` | protected | بيانات اللوحة |
| `company.expenses.getUpcoming` | protected | القادمة |
| `company.expenses.payments.list` | protected | الدفعات |
| `company.expenses.payments.create` | protected | إنشاء دفعة |
| `company.expenses.payments.markPaid` | protected | تحديد كمدفوع |
| `company.expenses.payments.update` | protected | تحديث دفعة |
| `company.expenses.payments.delete` | protected | حذف دفعة |
| `company.expenses.payments.generateMonthly` | protected | توليد شهري |
| `company.expenses.allocations.list` | protected | التوزيعات |
| `company.expenses.allocations.set` | protected | تعيين توزيع |
| `company.expenses.allocations.byProject` | protected | بالمشروع |

**كشوف الرواتب (payroll):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `company.payroll.list` | protected | القائمة |
| `company.payroll.getById` | protected | الجلب |
| `company.payroll.create` | protected | الإنشاء |
| `company.payroll.populate` | protected | التعبئة التلقائية |
| `company.payroll.approve` | protected | الاعتماد |
| `company.payroll.cancel` | protected | الإلغاء |
| `company.payroll.summary` | protected | الملخص |
| `company.payroll.updateItem` | protected | تحديث بند |
| `company.payroll.deleteItem` | protected | حذف بند |

**دورات المصروفات (expenseRuns):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `company.expenseRuns.list` | protected | القائمة |
| `company.expenseRuns.getById` | protected | الجلب |
| `company.expenseRuns.create` | protected | الإنشاء |
| `company.expenseRuns.populate` | protected | التعبئة |
| `company.expenseRuns.post` | protected | الترحيل |
| `company.expenseRuns.cancel` | protected | الإلغاء |
| `company.expenseRuns.summary` | protected | الملخص |
| `company.expenseRuns.updateItem` | protected | تحديث بند |
| `company.expenseRuns.deleteItem` | protected | حذف بند |

**الأصول (assets):**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `company.assets.list` | protected | القائمة |
| `company.assets.getById` | protected | الجلب |
| `company.assets.create` | protected | الإنشاء |
| `company.assets.update` | protected | التحديث |
| `company.assets.retire` | protected | التقاعد |
| `company.assets.assignToProject` | protected | تعيين لمشروع |
| `company.assets.returnToWarehouse` | protected | إرجاع للمستودع |
| `company.assets.getSummary` | protected | الملخص |
| `company.assets.getExpiringInsurance` | protected | التأمين المنتهي |

**لوحة التحكم:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `company.dashboard` | protected | لوحة إدارة الشركة |

#### 5.2.27 superAdmin — المشرف العام

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `superAdmin.dashboard.getStats` | admin | الإحصائيات |
| `superAdmin.dashboard.getMrrTrend` | admin | اتجاه MRR |
| `superAdmin.dashboard.getPlanDistribution` | admin | توزيع الخطط |
| `superAdmin.dashboard.getNewOrgsTrend` | admin | اتجاه المنظمات الجديدة |
| `superAdmin.dashboard.getChurnRate` | admin | معدل التسرب |
| `superAdmin.organizations.list` | admin | قائمة المنظمات |
| `superAdmin.organizations.getById` | admin | جلب منظمة |
| `superAdmin.organizations.changePlan` | admin | تغيير الخطة |
| `superAdmin.organizations.suspend` | admin | تعليق |
| `superAdmin.organizations.activate` | admin | تفعيل |
| `superAdmin.organizations.setFreeOverride` | admin | تجاوز الخطة |
| `superAdmin.organizations.updateLimits` | admin | تحديث الحدود |
| `superAdmin.organizations.getPaymentHistory` | admin | سجل المدفوعات |
| `superAdmin.organizations.getMembers` | admin | الأعضاء |
| `superAdmin.organizations.getProjects` | admin | المشاريع |
| `superAdmin.revenue.getSummary` | admin | ملخص الإيرادات |
| `superAdmin.revenue.getByPeriod` | admin | إيرادات بالفترة |
| `superAdmin.revenue.getByPlan` | admin | إيرادات بالخطة |
| `superAdmin.logs.list` | admin | سجل الأحداث |
| `superAdmin.plans.list` | admin | قائمة الخطط |
| `superAdmin.plans.getById` | admin | جلب خطة |
| `superAdmin.plans.update` | admin | تحديث خطة |
| `superAdmin.plans.syncToStripe` | admin | مزامنة مع Stripe |

#### 5.2.28 وحدات أخرى

**attachments — المرفقات:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `attachments.createUploadUrl` | protected | رابط الرفع |
| `attachments.finalizeUpload` | protected | إتمام الرفع |
| `attachments.list` | protected | القائمة |
| `attachments.getDownloadUrl` | protected | رابط التحميل |
| `attachments.delete` | protected | الحذف |

**projectTemplates — قوالب المشاريع:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectTemplates.list` | protected | القائمة |
| `projectTemplates.getById` | protected | الجلب |
| `projectTemplates.create` | protected | الإنشاء |
| `projectTemplates.update` | protected | التحديث |
| `projectTemplates.delete` | protected | الحذف |
| `projectTemplates.apply` | protected | التطبيق |
| `projectTemplates.addItem` | protected | إضافة بند |
| `projectTemplates.removeItem` | protected | إزالة بند |

**projectInsights — التحليلات:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectInsights.get` | protected | جلب التحليلات |
| `projectInsights.acknowledge` | protected | قراءة التنبيه |

**projectUpdates — التحديثات:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `projectUpdates.generateDraft` | protected | توليد مسودة |
| `projectUpdates.publish` | protected | النشر |

**digests — الملخصات:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `digests.getWeekly` | protected | الملخص الأسبوعي |
| `digests.subscribe` | protected | الاشتراك |
| `digests.unsubscribe` | protected | إلغاء الاشتراك |
| `digests.listSubscriptions` | protected | قائمة الاشتراكات |

**integrations — التكاملات:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `integrations.getSettings` | protected | جلب الإعدادات |
| `integrations.updateSettings` | protected | تحديث الإعدادات |
| `integrations.getDeliveryLogs` | protected | سجلات التسليم |
| `integrations.sendMessage` | protected | إرسال رسالة |
| `integrations.sendBulkMessages` | protected | إرسال جماعي |

**exports — التصدير:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `exports.generateUpdatePDF` | protected | PDF تحديث |
| `exports.generateClaimPDF` | protected | PDF مطالبة |
| `exports.generateWeeklyReport` | protected | تقرير أسبوعي |
| `exports.exportExpensesCsv` | protected | CSV مصروفات |
| `exports.exportClaimsCsv` | protected | CSV مطالبات |
| `exports.exportIssuesCsv` | protected | CSV مشاكل |
| `exports.generateCalendarICS` | protected | ICS تقويم |

**shares — المشاركة:**

| Endpoint | Procedure | الوصف |
|----------|-----------|-------|
| `shares.create` | protected | إنشاء رابط |
| `shares.list` | protected | القائمة |
| `shares.revoke` | protected | إلغاء |
| `shares.getResource` | public | جلب المورد |

### 5.3 ملخص إحصائي

| الفئة | العدد |
|-------|-------|
| إجمالي الوحدات | 36 |
| إجمالي الـ Endpoints | 400+ |
| Public Endpoints | ~15 |
| Protected Endpoints | ~370 |
| Admin Endpoints | ~23 |
| Subscription Endpoints | 0 (معرّف لكن غير مستخدم) |

### 5.4 ملاحظة مهمة

> **`subscriptionProcedure` غير مستخدم** — رغم تعريفه في `procedures.ts`، لا يوجد أي endpoint يستخدم `subscriptionProcedure`. هذا يعني أن أي مستخدم مسجل يمكنه الوصول لكل الوظائف بغض النظر عن حالة اشتراكه. هذه ثغرة منطقية يجب إصلاحها.

---

## 6. صفحات الواجهة

```
المجلد: apps/web/app/
إجمالي page.tsx: 104 صفحة
إجمالي layout.tsx: 16 layout
```

### 6.1 هيكل المسارات (Route Groups)

```
app/
├── layout.tsx                          # Root Layout
├── (marketing)/[locale]/              # صفحات تسويقية (مع locale)
├── auth/                              # صفحات المصادقة
├── (saas)/                            # تطبيق SaaS
│   ├── layout.tsx                     # SaaS Layout (providers)
│   ├── app/
│   │   ├── layout.tsx                 # App Layout
│   │   ├── (account)/                 # حساب المستخدم
│   │   │   ├── settings/             # إعدادات الحساب
│   │   │   └── admin/                # لوحة المشرف
│   │   └── (organizations)/          # المنظمات
│   │       └── [organizationSlug]/
│   │           ├── projects/         # المشاريع
│   │           │   └── [projectId]/  # صفحات المشروع
│   │           ├── finance/          # المالية
│   │           ├── company/          # إدارة الشركة
│   │           ├── settings/         # إعدادات المنظمة
│   │           └── notifications/    # الإشعارات
│   ├── onboarding/                   # التهيئة الأولى
│   ├── choose-plan/                  # اختيار الخطة
│   └── new-organization/            # منظمة جديدة
├── owner/[token]/                    # بوابة المالك
└── share/[token]/                    # روابط المشاركة
```

### 6.2 جميع الصفحات (104 صفحة)

#### 6.2.1 صفحات المصادقة (6 صفحات)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/auth/login` | `app/auth/login/page.tsx` | تسجيل الدخول |
| `/auth/signup` | `app/auth/signup/page.tsx` | إنشاء حساب |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | نسيت كلمة المرور |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | إعادة تعيين كلمة المرور |
| `/auth/verify` | `app/auth/verify/page.tsx` | تأكيد البريد |
| `/auth/change-password` | `app/auth/change-password/page.tsx` | تغيير كلمة المرور |

#### 6.2.2 صفحات التسويق (7 صفحات)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/[locale]/[...rest]` | `(marketing)/[locale]/[...rest]/page.tsx` | صفحات CMS عامة |
| `/[locale]/blog` | `(marketing)/[locale]/blog/page.tsx` | قائمة المدونة |
| `/[locale]/blog/[...path]` | `(marketing)/[locale]/blog/[...path]/page.tsx` | مقال مدونة |
| `/[locale]/changelog` | `(marketing)/[locale]/changelog/page.tsx` | سجل التغييرات |
| `/[locale]/contact` | `(marketing)/[locale]/contact/page.tsx` | نموذج التواصل |
| `/[locale]/docs/[[...path]]` | `(marketing)/[locale]/docs/[[...path]]/page.tsx` | التوثيق |
| `/[locale]/legal/[...path]` | `(marketing)/[locale]/legal/[...path]/page.tsx` | الصفحات القانونية |

#### 6.2.3 صفحات الحساب (4 صفحات)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/app` | `(saas)/app/(account)/page.tsx` | الصفحة الرئيسية |
| `/app/settings/general` | `settings/general/page.tsx` | الإعدادات العامة |
| `/app/settings/security` | `settings/security/page.tsx` | الأمان |
| `/app/settings/billing` | `settings/billing/page.tsx` | الفوترة |
| `/app/settings/danger-zone` | `settings/danger-zone/page.tsx` | المنطقة الخطرة |

#### 6.2.4 صفحات المشرف (3 صفحات)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/app/admin/users` | `admin/users/page.tsx` | إدارة المستخدمين |
| `/app/admin/organizations` | `admin/organizations/page.tsx` | إدارة المنظمات |
| `/app/admin/organizations/[id]` | `admin/organizations/[id]/page.tsx` | تفاصيل المنظمة |

#### 6.2.5 صفحات التهيئة (3 صفحات)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/onboarding` | `(saas)/onboarding/page.tsx` | التهيئة الأولى |
| `/choose-plan` | `(saas)/choose-plan/page.tsx` | اختيار الخطة |
| `/new-organization` | `(saas)/new-organization/page.tsx` | إنشاء منظمة |
| `/organization-invitation/[id]` | `organization-invitation/[invitationId]/page.tsx` | قبول الدعوة |

#### 6.2.6 صفحات المنظمة (7 صفحات)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/app/[slug]` | `[organizationSlug]/page.tsx` | لوحة التحكم الرئيسية |
| `/app/[slug]/settings/billing` | `settings/billing/page.tsx` | فوترة المنظمة |
| `/app/[slug]/settings/danger-zone` | `settings/danger-zone/page.tsx` | المنطقة الخطرة |
| `/app/[slug]/settings/members` | `settings/members/page.tsx` | الأعضاء |
| `/app/[slug]/settings/users` | `settings/users/page.tsx` | المستخدمون |
| `/app/[slug]/settings/roles` | `settings/roles/page.tsx` | الأدوار |
| `/app/[slug]/settings/integrations` | `settings/integrations/page.tsx` | التكاملات |

#### 6.2.7 صفحات المشاريع (4 صفحات أساسية)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/app/[slug]/projects` | `projects/page.tsx` | قائمة المشاريع |
| `/app/[slug]/projects/new` | `projects/new/page.tsx` | مشروع جديد |
| `/app/[slug]/projects/templates` | `projects/templates/page.tsx` | قوالب المشاريع |
| `/app/[slug]/projects/[id]` | `projects/[projectId]/page.tsx` | نظرة عامة |

#### 6.2.8 صفحات المشروع — التنفيذ والميداني (8 صفحات)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `[projectId]/execution/new-report` | `execution/new-report/page.tsx` | تقرير جديد |
| `[projectId]/execution/upload` | `execution/upload/page.tsx` | رفع صور |
| `[projectId]/execution/new-issue` | `execution/new-issue/page.tsx` | مشكلة جديدة |
| `[projectId]/field` | `field/page.tsx` | الصفحة الميدانية |
| `[projectId]/field/upload` | `field/upload/page.tsx` | رفع ميداني |
| `[projectId]/field/new-issue` | `field/new-issue/page.tsx` | مشكلة ميدانية |
| `[projectId]/timeline` | `timeline/page.tsx` | الجدول الزمني |
| `[projectId]/insights` | `insights/page.tsx` | التحليلات |

#### 6.2.9 صفحات المشروع — المالية (14 صفحة)

| المسار | الوصف |
|--------|-------|
| `[projectId]/finance` | نظرة عامة مالية |
| `[projectId]/finance/new-expense` | مصروف جديد |
| `[projectId]/finance/new-claim` | مطالبة جديدة |
| `[projectId]/finance/expenses` | قائمة المصروفات |
| `[projectId]/finance/expenses/new` | إضافة مصروف |
| `[projectId]/finance/claims` | قائمة المطالبات |
| `[projectId]/finance/claims/new` | إضافة مطالبة |
| `[projectId]/finance/payments` | قائمة الدفعات |
| `[projectId]/finance/payments/new` | إضافة دفعة |
| `[projectId]/finance/contract` | العقد |
| `[projectId]/finance/subcontracts` | المقاولات |
| `[projectId]/finance/subcontracts/new` | مقاولة جديدة |
| `[projectId]/finance/subcontracts/[id]` | تفاصيل المقاولة |
| `[projectId]/finance/subcontracts/[id]/payments/new` | دفعة مقاولة |

#### 6.2.10 صفحات المشروع — أخرى (6 صفحات)

| المسار | الوصف |
|--------|-------|
| `[projectId]/documents` | المستندات |
| `[projectId]/documents/new` | مستند جديد |
| `[projectId]/documents/[documentId]` | تفاصيل المستند |
| `[projectId]/changes` | أوامر التغيير |
| `[projectId]/changes/[changeId]` | تفاصيل أمر التغيير |
| `[projectId]/updates` | التحديثات |
| `[projectId]/owner` | بوابة المالك (من داخل المشروع) |
| `[projectId]/team` | فريق العمل |
| `[projectId]/chat` | دردشة الفريق |

#### 6.2.11 صفحات المالية — المنظمة (19 صفحة)

| المسار | الوصف |
|--------|-------|
| `[slug]/finance` | لوحة التحكم المالية |
| `[slug]/finance/clients` | العملاء |
| `[slug]/finance/clients/new` | عميل جديد |
| `[slug]/finance/clients/[clientId]` | تفاصيل العميل |
| `[slug]/finance/clients/[clientId]/edit` | تعديل العميل |
| `[slug]/finance/payments` | المدفوعات |
| `[slug]/finance/payments/new` | إيصال جديد |
| `[slug]/finance/payments/[paymentId]` | تفاصيل الإيصال |
| `[slug]/finance/payments/[paymentId]/receipt` | طباعة الإيصال |
| `[slug]/finance/expenses/new` | مصروف جديد |
| `[slug]/finance/expenses/transfer` | تحويل |
| `[slug]/finance/banks` | الحسابات البنكية |
| `[slug]/finance/banks/new` | حساب جديد |
| `[slug]/finance/banks/[bankId]` | تفاصيل الحساب |
| `[slug]/finance/documents` | المستندات المالية |
| `[slug]/finance/documents/new` | مستند جديد |
| `[slug]/finance/documents/[documentId]` | تفاصيل المستند |
| `[slug]/finance/templates` | القوالب |
| `[slug]/finance/templates/[templateId]/preview` | معاينة القالب |
| `[slug]/finance/reports` | التقارير المالية |

#### 6.2.12 صفحات الشركة (4 صفحات)

| المسار | الوصف |
|--------|-------|
| `[slug]/company/employees` | قائمة الموظفين |
| `[slug]/company/employees/new` | موظف جديد |
| `[slug]/company/employees/[employeeId]` | تفاصيل الموظف |
| `[slug]/company/employees/[employeeId]/edit` | تعديل الموظف |

#### 6.2.13 صفحات بوابة المالك (5 صفحات)

| المسار | الوصف |
|--------|-------|
| `/owner/[token]/schedule` | الجدول الزمني |
| `/owner/[token]/payments` | المدفوعات |
| `/owner/[token]/changes` | أوامر التغيير |
| `/owner/[token]/changes/[changeId]` | تفاصيل أمر تغيير |
| `/owner/[token]/chat` | المحادثة |

#### 6.2.14 صفحات المشاركة (1 صفحة)

| المسار | الوصف |
|--------|-------|
| `/share/[token]` | عرض المورد المشارك |

#### 6.2.15 الإشعارات (1 صفحة)

| المسار | الوصف |
|--------|-------|
| `[slug]/notifications` | قائمة الإشعارات |

### 6.3 هيكل الـ Layouts (16 layout)

| Layout | الموقع | الوظيفة |
|--------|--------|---------|
| Root Layout | `app/layout.tsx` | HTML, metadata, fonts |
| Marketing Layout | `(marketing)/[locale]/layout.tsx` | شريط تسويقي علوي |
| Docs Layout | `docs/[[...path]]/layout.tsx` | sidebar التوثيق |
| Auth Layout | `auth/layout.tsx` | تصميم صفحات الدخول |
| SaaS Layout | `(saas)/layout.tsx` | Session + Org providers |
| App Layout | `(saas)/app/layout.tsx` | Main app shell |
| Account Layout | `(account)/layout.tsx` | sidebar الحساب |
| Account Settings | `(account)/settings/layout.tsx` | tabs الإعدادات |
| Admin Layout | `(account)/admin/layout.tsx` | sidebar المشرف |
| Org Layout | `[organizationSlug]/layout.tsx` | org context + sidebar |
| Org Settings | `settings/layout.tsx` | tabs إعدادات المنظمة |
| Project Layout | `[projectId]/layout.tsx` | ProjectShell wrapper |
| Finance Layout | `finance/layout.tsx` | sidebar المالية |
| Company Layout | `company/layout.tsx` | sidebar الشركة |
| Owner Layout | `owner/[token]/layout.tsx` | بوابة المالك shell |

---

## 7. نظام التنقل

### 7.1 هيكل التنقل

```
الملفات الرئيسية:
- apps/web/modules/saas/projects/components/shell/ProjectShell.tsx
- apps/web/modules/saas/projects/components/shell/ProjectNavigation.tsx
- apps/web/modules/saas/projects/components/shell/DesktopNavBar.tsx
- apps/web/modules/saas/projects/components/shell/MobileBottomNav.tsx
- apps/web/modules/saas/projects/components/shell/constants.ts
```

### 7.2 ProjectShell

المكون الرئيسي الذي يغلف كل صفحات المشروع:

```
┌─────────────────────────────────────────┐
│ ProjectHeader (اسم المشروع + أدوات)     │
├─────────────────────────────────────────┤
│ ProjectNavigation (أقسام التنقل)         │
│ ┌─────────────────────────────────────┐ │
│ │ Desktop: DesktopNavBar (horizontal) │ │
│ │ Mobile: MobileBottomNav (bottom)    │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│                                         │
│          المحتوى (children)              │
│          scroll + pb-20 (mobile)         │
│          scroll + pb-4 (desktop)         │
│                                         │
├─────────────────────────────────────────┤
│ 💬 زر الدردشة العائم (bottom-right)     │
└─────────────────────────────────────────┘
```

**الخصائص:**
- `project` — بيانات المشروع
- `organizationSlug` / `organizationId` — بيانات المنظمة
- `userRole` — دور المستخدم في المشروع
- `userName` — اسم المستخدم
- يوفر `ProjectRoleProvider` context لجميع المكونات الداخلية

### 7.3 أقسام التنقل

```
الملف: apps/web/modules/saas/projects/components/shell/constants.ts
```

| القسم | المسار | الأيقونة | الأدوار المسموحة |
|-------|--------|---------|-----------------|
| نظرة عامة (Overview) | `/projects/[id]` | LayoutDashboard | الكل |
| التنفيذ (Execution) | `/projects/[id]/timeline` | CalendarRange | MANAGER, ENGINEER |
| المصروفات (Expenses) | `/projects/[id]/finance/expenses` | Receipt | MANAGER, ACCOUNTANT |
| الدفعات والمطالبات | `/projects/[id]/finance/claims` | CreditCard | MANAGER, ACCOUNTANT |
| المقاولات (Subcontracts) | `/projects/[id]/finance/subcontracts` | FileContract | MANAGER, ACCOUNTANT |
| المستندات (Documents) | `/projects/[id]/documents` | FolderOpen | MANAGER, ENGINEER |
| المالك (Owner) | `/projects/[id]/owner` | UserCircle | MANAGER |
| التحليلات (Insights) | `/projects/[id]/insights` | BarChart | MANAGER |
| الفريق (Team) | `/projects/[id]/team` | Users | MANAGER |

### 7.4 Desktop Navigation (DesktopNavBar)

- شريط أفقي من الأزرار/التبويبات
- يظهر على الشاشات المتوسطة والكبيرة (`hidden md:flex`)
- يدعم النوافذ المنبثقة (Popover) للقوائم الفرعية
- حالة نشطة مع تلوين

### 7.5 Mobile Navigation (MobileBottomNav)

```
الملف: apps/web/modules/saas/projects/components/shell/MobileBottomNav.tsx
```

**الخصائص:**
- **الموقع:** أسفل الشاشة ثابت (`fixed bottom-0`)
- **الـ z-index:** 50
- **التأثير:** Glass morphism (blur + backdrop)
- **الرؤية:** موبايل وتابلت فقط (`md:hidden`)
- **أنواع الأزرار:**
  - `MobileDockSlot` — رابط مباشر
  - `MobilePopoverSlot` — قائمة منبثقة لأعلى
  - `MobileSheetSlot` — لوحة سفلية (bottom sheet)

### 7.6 تنقل المالية (Finance)

```
الملف: apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/layout.tsx
```

شريط جانبي يحتوي على:
- لوحة التحكم (Dashboard)
- العملاء (Clients)
- عروض الأسعار (عبر pricing)
- الفواتير (Invoices)
- المدفوعات (Payments)
- المصروفات (Expenses)
- التحويلات (Transfers)
- الحسابات البنكية (Banks)
- المستندات (Documents)
- القوالب (Templates)
- التقارير (Reports)
- الإعدادات (Settings)

### 7.7 تنقل الشركة (Company)

```
الملف: apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/layout.tsx
```

شريط جانبي يحتوي على:
- الموظفون (Employees)
- الأصول (Assets)
- المصروفات الثابتة (Expenses)
- كشوف الرواتب (Payroll)
- دورات المصروفات (Expense Runs)
- التقارير (Reports)

---

## 8. المكونات المشتركة

### 8.1 وحدات SaaS (18 وحدة)

```
الملف: apps/web/modules/saas/
```

| الوحدة | المجلد | الوصف | عدد المكونات (تقريبي) |
|--------|--------|-------|---------------------|
| admin | `admin/` | إدارة النظام | 5 |
| ai | `ai/` | الذكاء الاصطناعي | 8 |
| auth | `auth/` | المصادقة | 12 |
| company | `company/` | إدارة الشركة | 25 |
| dashboard | `dashboard/` | لوحة التحكم | 10 |
| finance | `finance/` | المالية | 60+ |
| integrations | `integrations/` | التكاملات | 5 |
| onboarding | `onboarding/` | التهيئة الأولى | 5 |
| organizations | `organizations/` | المنظمات | 15 |
| payments | `payments/` | المدفوعات | 8 |
| pricing | `pricing/` | التسعير | 40+ |
| projects | `projects/` | المشاريع | 50+ |
| projects-changes | `projects-changes/` | أوامر التغيير | 10 |
| projects-execution | `projects-execution/` | التنفيذ المتقدم | 40+ |
| projects-timeline | `projects-timeline/` | الجدول الزمني | 20 |
| settings | `settings/` | الإعدادات | 15 |
| shared | `shared/` | مكونات مشتركة | 20+ |

### 8.2 مكونات Gantt Chart

#### 8.2.1 Gantt الجدول الزمني (البسيط)

```
الملف: apps/web/modules/saas/projects-timeline/components/gantt/
```

| المكون | الوصف |
|--------|-------|
| `GanttView.tsx` | العرض الرئيسي مع الفلاتر والتكبير |
| `GanttContainer.tsx` | حاوية مع sidebar وchart |
| `GanttChart.tsx` | رسم الشريط الزمني |
| `GanttToolbar.tsx` | أدوات التكبير والفلترة |
| `GanttSidebar.tsx` | قائمة المراحل الجانبية |
| `GanttTimeHeader.tsx` | رأس المحور الزمني |
| `GanttTodayMarker.tsx` | علامة اليوم الحالي |
| `GanttRow.tsx` | صف المرحلة |
| `GanttTooltip.tsx` | التلميحات عند التمرير |
| `use-gantt-state.ts` | إدارة الحالة (zoom, filters) |
| `use-gantt-drag.ts` | السحب والإفلات |

#### 8.2.2 Gantt المتقدم (التنفيذ)

```
الملف: apps/web/modules/saas/projects-execution/components/advanced/
```

| المكون | الوصف |
|--------|-------|
| `AdvancedGanttView.tsx` | العرض المتقدم الكامل |
| `GanttSplitPane.tsx` | تقسيم WBS table + chart |
| `GanttToolbar.tsx` | أدوات متقدمة مع تقويم وbaseline |
| `MobileGanttFallback.tsx` | بديل الموبايل |

**مكونات الرسم (chart/):**

| المكون | الوصف |
|--------|-------|
| `GanttChartArea.tsx` | منطقة الرسم SVG |
| `GanttSvgCanvas.tsx` | Canvas للأنشطة والتبعيات |
| `GanttActivityBar.tsx` | شريط النشاط |
| `GanttMilestoneGroupBar.tsx` | شريط مجموعة المراحل |
| `GanttBaselineOverlay.tsx` | طبقة الخط الأساسي |
| `GanttBarTooltip.tsx` | تلميحات متقدمة |
| `GanttTimeHeader.tsx` | رأس زمني مع zoom |
| `GanttTodayMarker.tsx` | علامة اليوم |

**الـ Hooks:**

| Hook | الوصف |
|------|-------|
| `use-gantt-context.ts` | Context و state reducer |
| `use-gantt-scroll-sync.ts` | مزامنة التمرير |
| `use-gantt-virtualization.ts` | Virtual scrolling للأداء |
| `use-gantt-drag.ts` | عمليات السحب |
| `use-gantt-dependency-drag.ts` | رسم خطوط التبعية |
| `use-gantt-keyboard.ts` | اختصارات لوحة المفاتيح |

**المكتبات (lib/):**

| الملف | الوصف |
|-------|-------|
| `gantt-types.ts` | الأنواع (GanttActivityRow, GanttDependency, BaselineSnapshot) |
| `gantt-constants.ts` | الثوابت (ZOOM_CONFIGS) |
| `gantt-utils.ts` | دوال مساعدة |
| `gantt-arrow-routing.ts` | توجيه أسهم التبعيات |

### 8.3 مكونات المالية

```
الملف: apps/web/modules/saas/finance/components/
```

**المكونات الرئيسية:**
- `FinanceDashboard.tsx` — لوحة التحكم المالية
- `InvoiceList.tsx` / `InvoiceDetail.tsx` — الفواتير
- `QuotationList.tsx` / `QuotationDetail.tsx` — عروض الأسعار
- `ClientList.tsx` / `ClientDetail.tsx` — العملاء
- `PaymentList.tsx` / `PaymentForm.tsx` — المدفوعات
- `ExpenseList.tsx` / `ExpenseForm.tsx` — المصروفات
- `BankList.tsx` / `BankDetail.tsx` — الحسابات البنكية
- `TransferForm.tsx` — التحويلات
- `FinanceReports.tsx` — التقارير المالية

### 8.4 مكونات التسعير

```
الملف: apps/web/modules/saas/pricing/components/
```

- `CostStudyList.tsx` — قائمة دراسات التكلفة
- `CostStudyDetail.tsx` — تفاصيل الدراسة
- `StructuralSection.tsx` — قسم الإنشائي
- `FinishingSection.tsx` — قسم التشطيب
- `MEPSection.tsx` — قسم الميكانيكا/كهرباء/سباكة
- `LaborSection.tsx` — قسم العمالة
- `QuoteGenerator.tsx` — مولد عروض الأسعار
- `BuildingConfigurator.tsx` — إعدادات المبنى

### 8.5 مكونات المشاريع

```
الملف: apps/web/modules/saas/projects/components/
```

**Shell (الهيكل):**
- `ProjectShell.tsx` — الغلاف الرئيسي
- `ProjectHeader.tsx` — الرأس
- `ProjectNavigation.tsx` — التنقل
- `DesktopNavBar.tsx` — شريط سطح المكتب
- `MobileBottomNav.tsx` — شريط الموبايل
- `ProjectContextToolbar.tsx` — شريط أدوات السياق
- `ContractBar.tsx` — شريط العقد
- `ViewAsSelector.tsx` — مُحدد العرض

**المشاريع:**
- `CreateProjectForm.tsx` — نموذج إنشاء مشروع
- `ProjectTemplates.tsx` — قوالب المشاريع
- `ProjectOverview.tsx` — نظرة عامة

**الميدانية (Field):**
- `FieldTimeline.tsx` — الخط الزمني الميداني
- `DailyReportCard.tsx` — بطاقة التقرير اليومي
- `IssueCard.tsx` — بطاقة المشكلة
- `PhotoGrid.tsx` — شبكة الصور

**المستندات:**
- `DocumentsList.tsx` — قائمة المستندات
- `DocumentDetail.tsx` — تفاصيل المستند
- `CreateDocumentForm.tsx` — نموذج إنشاء
- `ApprovalWorkflow.tsx` — سير عمل الموافقات

**الدردشة:**
- `ChatPanel.tsx` — لوحة الدردشة
- `ChatBubble.tsx` — فقاعة الرسالة
- `ChatInput.tsx` — حقل الإدخال

---

## 9. نظام الطباعة والقوالب

### 9.1 محرر القوالب (Template Editor)

```
الملف الرئيسي: apps/web/modules/saas/finance/components/templates/TemplateEditor.tsx
```

محرر متقدم لقوالب المستندات المالية مع ثلاث لوحات:

```
┌──────────────┬────────────────────────┬──────────────┐
│ Components   │   Interactive Preview   │  Properties  │
│ Panel        │                        │  Panel       │
│              │                        │              │
│ ┌──────────┐ │  ┌──────────────────┐  │ ┌──────────┐ │
│ │ Header   │ │  │   Logo + Name    │  │ │ Settings │ │
│ │ Client   │ │  │   ───────────    │  │ │ ──────── │ │
│ │ Items    │ │  │   Client Info    │  │ │ Font     │ │
│ │ Totals   │ │  │   ───────────    │  │ │ Color    │ │
│ │ Terms    │ │  │   Items Table    │  │ │ Size     │ │
│ │ Signature│ │  │   ───────────    │  │ │ Align    │ │
│ │ Bank     │ │  │   Totals         │  │ │ Spacing  │ │
│ │ QR Code  │ │  │   ───────────    │  │ │          │ │
│ │ Footer   │ │  │   Terms          │  │ │          │ │
│ │ Text     │ │  │   ───────────    │  │ │          │ │
│ │ Image    │ │  │   Signature      │  │ │          │ │
│ └──────────┘ │  └──────────────────┘  │ └──────────┘ │
└──────────────┴────────────────────────┴──────────────┘
```

### 9.2 أنواع القوالب

| النوع | الاسم | الاستخدام |
|-------|-------|-----------|
| `QUOTATION` | عرض سعر | عروض الأسعار للعملاء |
| `INVOICE` | فاتورة | فواتير البيع |
| `LETTER` | خطاب | مستندات عامة |

### 9.3 عناصر القالب

| العنصر | الملف | الوصف |
|--------|-------|-------|
| `header` | `HeaderComponent.tsx` | رأس المستند (شعار + اسم الشركة) |
| `clientInfo` | `ClientInfoComponent.tsx` | معلومات العميل |
| `itemsTable` | `ItemsTableComponent.tsx` | جدول البنود |
| `totals` | `TotalsComponent.tsx` | المجاميع (subtotal, VAT, total) |
| `terms` | `TermsComponent.tsx` | الشروط والأحكام |
| `signature` | `SignatureComponent.tsx` | منطقة التوقيع |
| `bankDetails` | `BankDetailsComponent.tsx` | معلومات بنكية |
| `qrCode` | `QRCodeElement.tsx` | رمز QR (ZATCA) |
| `footer` | `FooterElement.tsx` | تذييل المستند |
| `text` | - | نص حر |
| `image` | - | صورة |
| `timeline` | - | جدول زمني |
| `gallery` | - | معرض صور |
| `paymentSchedule` | - | جدول دفعات |

### 9.4 مكونات المحرر

| المكون | الوصف |
|--------|-------|
| `ComponentsPanel.tsx` | لوحة المكونات القابلة للسحب (يسار) |
| `TemplateCanvas.tsx` | مساحة ترتيب العناصر |
| `InteractivePreview.tsx` | المعاينة المباشرة مع دعم الإفلات |
| `PropertiesPanel.tsx` | لوحة الخصائص للعنصر المحدد (يمين) |
| `TemplateRenderer.tsx` | عرض القالب مع بيانات حقيقية |
| `TemplateList.tsx` | قائمة القوالب المحفوظة |
| `TemplatePreview.tsx` | معاينة كاملة |
| `TemplateCustomizer.tsx` | مخصص بديل |

### 9.5 ميزات المحرر

- **Undo/Redo** — تاريخ العمليات
- **سحب وإفلات** — إعادة ترتيب العناصر
- **إظهار/إخفاء** — تبديل رؤية كل عنصر
- **تغيير الحجم** — تعديل أبعاد العناصر
- **إعدادات عنصر** — خط، لون، محاذاة، حجم
- **حفظ تلقائي** — عبر React Query mutations
- **تعيين كافتراضي** — لكل نوع قالب

---

## 10. التوافق مع هيئة الزكاة ZATCA

```
المجلد: packages/api/lib/zatca/
الملفات: index.ts, qr-generator.ts, tlv-encoder.ts, qr-image.ts
```

### 10.1 المرحلة 1 (مكتملة ✅)

#### 10.1.1 ترميز TLV (Tag-Length-Value)

```
الملف: packages/api/lib/zatca/tlv-encoder.ts
```

| Tag | الحقل | الوصف |
|-----|-------|-------|
| 1 | اسم البائع | `sellerName` |
| 2 | الرقم الضريبي | `vatNumber` (15 رقم) |
| 3 | التاريخ والوقت | `timestamp` (ISO 8601) |
| 4 | الإجمالي شامل الضريبة | `totalWithVat` |
| 5 | مبلغ الضريبة | `vatAmount` |

#### 10.1.2 توليد QR Code

```
الملف: packages/api/lib/zatca/qr-generator.ts
```

```typescript
interface ZatcaQRInput {
  sellerName: string;      // اسم البائع
  vatNumber: string;       // الرقم الضريبي (15 رقم)
  timestamp: Date;         // التاريخ والوقت
  totalWithVat: number;    // الإجمالي شامل الضريبة
  vatAmount: number;       // مبلغ الضريبة
}

// الدوال
generateZatcaQR(input: ZatcaQRInput): string     // Base64 TLV
validateZatcaQR(base64: string): ZatcaQRInput     // فك الترميز والتحقق
```

#### 10.1.3 توليد صورة QR

```
الملف: packages/api/lib/zatca/qr-image.ts
```

```typescript
generateZatcaQRImage(tlvBase64: string): Promise<string>  // Data URL (PNG)
```

**إعدادات QR:**
- مستوى تصحيح الخطأ: `M`
- الهامش: `1 px`
- العرض: `200 px`
- اللون: أسود على أبيض

### 10.2 المرحلة 2 (غير موجودة ❌)

**المفقود:**

| الميزة | الحالة | الأهمية |
|--------|--------|---------|
| CSID (Compliance ID) | غائب | حرج |
| توقيع XML رقمي | غائب | حرج |
| ربط مع API هيئة الزكاة | غائب | حرج |
| Clearance/Reporting workflow | غائب | حرج |
| إنشاء UUID للفاتورة | جزئي (حقل موجود في DB) | متوسط |
| Hash chain | غائب | عالي |
| XML invoice format (UBL 2.1) | غائب | حرج |
| Cryptographic stamp | غائب | حرج |

> **ملاحظة:** المرحلة 2 من ZATCA مطلوبة قانونياً للشركات التي تصدر فواتير ضريبية. الحقول `zatcaUuid`, `zatcaHash`, `zatcaSignature` موجودة في جدول `FinanceInvoice` لكنها غير مستخدمة حالياً.

---

## 11. نظام الاشتراكات والفوترة

```
الملفات:
- packages/payments/stripe-products.ts (الخطط)
- packages/payments/providers/stripe.ts (Stripe integration)
- packages/api/orpc/middleware/subscription-middleware.ts (التحقق)
- packages/api/orpc/middleware/limits-middleware.ts (الحدود)
```

### 11.1 الخطط المتاحة

| الخطة | المستخدمون | المشاريع | التخزين | السعر الشهري | السعر السنوي |
|-------|-----------|----------|---------|-------------|-------------|
| FREE | 1 | 0 | 0 GB | مجاناً | مجاناً |
| PRO | 50 | 100 | 50 GB | 299 ر.س | 2,990 ر.س |

### 11.2 ميزات كل خطة

**FREE:**
- وصول تجريبي للعرض فقط (read-only)
- مستخدم واحد
- لا يمكن إنشاء مشاريع
- بدون تقارير

**PRO:**
- حتى 50 مستخدم
- حتى 100 مشروع
- 50 GB تخزين
- جميع التقارير
- دعم أولوية
- وصول API
- تجربة مجانية 7 أيام
- تسعير حسب المقاعد (seat-based)

### 11.3 تكامل Stripe

**المزود:** Stripe v19.3.1

**أحداث Webhook المدعومة:**

| الحدث | الإجراء |
|-------|---------|
| `checkout.session.completed` | تفعيل الاشتراك |
| `customer.subscription.created` | إنشاء سجل اشتراك |
| `customer.subscription.updated` | تحديث الخطة/الحالة |
| `customer.subscription.deleted` | إلغاء الاشتراك |
| `customer.subscription.paused` | إيقاف مؤقت |
| `customer.subscription.resumed` | استئناف |
| `invoice.paid` | تأكيد الدفع |
| `invoice.payment_failed` | فشل الدفع |

### 11.4 مزودي الدفع البديلون (معرّفون)

| المزود | الحزمة | الحالة |
|--------|--------|--------|
| Stripe | `stripe ^19.3.1` | مفعل ✅ |
| Chargebee | `chargebee-typescript ^2.53.0` | معرّف ❌ |
| Lemonsqueezy | `@lemonsqueezy/lemonsqueezy.js ^4.0.0` | معرّف ❌ |
| Polar | `@polar-sh/sdk ^0.41.4` | معرّف ❌ |
| DodoPayments | `dodopayments ^2.8.0` | معرّف ❌ |

### 11.5 عمليات الدفع

| العملية | الدالة | الوصف |
|---------|--------|-------|
| إنشاء رابط دفع | `createCheckoutLink()` | جلسة Stripe Checkout |
| بوابة العميل | `createCustomerPortalLink()` | إدارة الاشتراك |
| تعديل المقاعد | `setSubscriptionSeats()` | تحديث عدد المستخدمين |
| إلغاء الاشتراك | `cancelSubscription()` | إلغاء نهاية الفترة |
| معالجة Webhook | `webhookHandler()` | معالجة أحداث Stripe |

### 11.6 ملاحظة حرجة

> **`subscriptionProcedure` غير مستخدم فعلياً** في أي endpoint. الـ middleware يتحقق من:
> - `org.status` !== `SUSPENDED`/`CANCELLED`
> - فترة التجربة لم تنتهِ
> - الخطة صالحة
>
> لكن لا يتم استدعاؤه. هذا يعني أن مستخدمي الخطة المجانية يمكنهم نظرياً الوصول لكل الوظائف.

---

## 12. التخزين السحابي

```
الملف: packages/storage/index.ts
المزود: AWS S3 (متوافق مع S3)
الحزمة: @aws-sdk/client-s3 3.437.0
```

### 12.1 الإعدادات

| الإعداد | المتغير البيئي | القيمة الافتراضية |
|---------|---------------|------------------|
| Endpoint | `S3_ENDPOINT` | - |
| Region | `S3_REGION` | `"auto"` |
| Access Key | `S3_ACCESS_KEY_ID` | - |
| Secret Key | `S3_SECRET_ACCESS_KEY` | - |
| Path Style | - | `true` (force) |

### 12.2 الدوال المتاحة

| الدالة | الوصف | المعاملات |
|--------|-------|-----------|
| `getSignedUploadUrl(path, { bucket })` | رابط رفع مؤقت (60 ثانية) | المسار + اسم الـ bucket |
| `getSignedUrl(path, { bucket, expiresIn })` | رابط تحميل مؤقت | المسار + المدة |

### 12.3 الـ Buckets المستخدمة

| Bucket | المتغير | الاستخدام |
|--------|---------|-----------|
| Avatars | `NEXT_PUBLIC_AVATARS_BUCKET_NAME` | صور المستخدمين والشعارات |

### 12.4 حالات الاستخدام

1. **صور المستخدمين (Avatars)** — رفع عبر `users.avatarUploadUrl`
2. **شعارات المنظمات** — رفع عبر `organizations.createLogoUploadUrl`
3. **مرفقات المستندات** — رفع عبر `attachments.createUploadUrl` + `attachments.finalizeUpload`
4. **صور المشاريع** — رفع عبر `projectField.createPhoto`
5. **شعار الإعدادات المالية** — رفع عبر `finance.settings.createLogoUploadUrl`

### 12.5 سير عمل الرفع

```
1. العميل يطلب رابط رفع (createUploadUrl)
   → الخادم يولد Pre-signed URL من S3
2. العميل يرفع الملف مباشرة إلى S3
3. العميل يؤكد الرفع (finalizeUpload)
   → الخادم يسجل المرفق في قاعدة البيانات
```

---

## 13. نظام البريد الإلكتروني

```
المجلد: packages/mail/
المزود النشط: Resend v6.4.2
إطار القوالب: React Email v5.0.4
```

### 13.1 قوالب البريد (6 قوالب)

| القالب | الملف | الوصف |
|--------|-------|-------|
| EmailVerification | `emails/EmailVerification.tsx` | تأكيد البريد الإلكتروني |
| ForgotPassword | `emails/ForgotPassword.tsx` | إعادة تعيين كلمة المرور |
| MagicLink | `emails/MagicLink.tsx` | رابط سحري للدخول |
| NewUser | `emails/NewUser.tsx` | ترحيب بمستخدم جديد |
| NewsletterSignup | `emails/NewsletterSignup.tsx` | تأكيد الاشتراك في النشرة |
| OrganizationInvitation | `emails/OrganizationInvitation.tsx` | دعوة للمنظمة |

### 13.2 مزودي البريد

| المزود | الحالة | الحزمة |
|--------|--------|--------|
| Resend | مفعل ✅ | `resend ^6.4.2` |
| Plunk | معرّف | - |
| Mailgun | معرّف | - |
| Postmark | معرّف | - |
| Nodemailer | معرّف | `nodemailer ^7.0.10` |
| Console | للتطوير | مدمج |
| Custom | قابل للتخصيص | - |

### 13.3 واجهة الإرسال

```typescript
await sendEmail({
  to: string;
  locale?: 'ar' | 'en' | 'de';
  templateId?: 'magicLink' | 'forgotPassword' | 'newUser' |
               'newsletterSignup' | 'organizationInvitation' |
               'emailVerification';
  context?: object;
  // أو مباشرة:
  subject?: string;
  text?: string;
  html?: string;
});
```

### 13.4 إعدادات البريد

| الإعداد | القيمة |
|---------|--------|
| عنوان المرسل | `noreply@masar.app` |
| دعم اللغات | العربية، الإنجليزية، الألمانية |
| معاينة القوالب | المنفذ 3005 (`pnpm preview`) |

---

## 14. الذكاء الاصطناعي

```
الملف: packages/ai/index.ts
إطار العمل: Vercel AI SDK v5.0.93
```

### 14.1 النماذج المستخدمة

| النموذج | المزود | المعرف | الاستخدام |
|---------|--------|--------|-----------|
| GPT-4o-mini | OpenAI | `gpt-4o-mini` | الدردشة العامة والنصوص |
| DALL-E 3 | OpenAI | `dall-e-3` | توليد الصور |
| Whisper-1 | OpenAI | `whisper-1` | تحويل الصوت لنص |
| Claude Sonnet 4 | Anthropic | `claude-sonnet-4-20250514` | مساعد مسار الذكي |

### 14.2 مساعد مسار (Masar Assistant)

المساعد الذكي يستخدم Claude Sonnet 4 مع 6 أدوات متخصصة:

| الأداة | الوظيفة |
|--------|---------|
| `queryProjects` | الاستعلام عن بيانات المشاريع |
| `queryFinance` | الاستعلام عن البيانات المالية |
| `queryExecution` | الاستعلام عن التنفيذ والأنشطة |
| `queryTimeline` | الاستعلام عن الجدول الزمني والمراحل |
| `navigateTo` | التنقل إلى صفحة محددة |
| `queryCompany` | الاستعلام عن بيانات الشركة |

### 14.3 أنواع المحادثات

| النوع | الوصف |
|-------|-------|
| `chat` | دردشة عامة مع GPT-4o-mini |
| `assistant` | مساعد مسار مع Claude Sonnet 4 + أدوات |

### 14.4 تخزين المحادثات

المحادثات مخزنة في جدول `AiChat`:
- `organizationId` — ربط بالمنظمة
- `userId` — ربط بالمستخدم
- `messages` — رسائل المحادثة (JSON)
- `metadata` — بيانات إضافية (JSON)

### 14.5 الحزم المستخدمة

| الحزمة | الإصدار | الاستخدام |
|--------|---------|-----------|
| `ai` | 5.0.93 | Vercel AI SDK الأساسي |
| `@ai-sdk/openai` | 2.0.65 | تكامل OpenAI |
| `@ai-sdk/anthropic` | 2.0.44 | تكامل Anthropic |
| `@ai-sdk/react` | 2.0.93 | React hooks (useChat, useCompletion) |
| `openai` | 6.9.0 | OpenAI SDK مباشر |

---

## 15. النشر والبنية التحتية

### 15.1 منصة النشر

| الخدمة | الاستخدام | المنطقة |
|--------|-----------|---------|
| Vercel | الاستضافة والنشر | Frankfurt (fra1) |
| Supabase | قاعدة البيانات PostgreSQL | - |
| AWS S3 | التخزين السحابي | - |
| Resend | البريد الإلكتروني | - |
| Stripe | معالجة المدفوعات | - |

### 15.2 إعدادات Vercel

```json
{
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

### 15.3 متطلبات التشغيل

| المتطلب | الحد الأدنى |
|---------|------------|
| Node.js | >= 20 |
| pnpm | 10.14.0 |
| TypeScript | 5.9.3 |

### 15.4 المتغيرات البيئية المطلوبة

| المتغير | الخدمة | الوصف |
|---------|--------|-------|
| `DATABASE_URL` | Supabase | رابط اتصال PostgreSQL |
| `BETTER_AUTH_SECRET` | BetterAuth | مفتاح تشفير الجلسات |
| `BETTER_AUTH_URL` | BetterAuth | رابط التطبيق |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google | OAuth credentials |
| `GITHUB_CLIENT_ID` / `SECRET` | GitHub | OAuth credentials |
| `STRIPE_SECRET_KEY` | Stripe | مفتاح API |
| `STRIPE_WEBHOOK_SECRET` | Stripe | مفتاح Webhook |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe | معرف سعر PRO شهري |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Stripe | معرف سعر PRO سنوي |
| `S3_ENDPOINT` | S3 | نقطة نهاية التخزين |
| `S3_REGION` | S3 | منطقة التخزين |
| `S3_ACCESS_KEY_ID` | S3 | مفتاح الوصول |
| `S3_SECRET_ACCESS_KEY` | S3 | المفتاح السري |
| `RESEND_API_KEY` | Resend | مفتاح البريد |
| `MAIL_FROM` | - | عنوان المرسل |
| `OPENAI_API_KEY` | OpenAI | مفتاح AI |
| `ANTHROPIC_API_KEY` | Anthropic | مفتاح AI |
| `NEXT_PUBLIC_AVATARS_BUCKET_NAME` | S3 | اسم bucket الصور |

### 15.5 خط أنابيب البناء

```
1. pnpm install                    # تثبيت الحزم
2. turbo generate                  # توليد Prisma Client + Zod
3. fix-zod-import.js              # إصلاح imports
4. turbo build                     # بناء كل الحزم والتطبيقات
5. next build                      # بناء تطبيق Next.js
```

### 15.6 CI/CD الحالي

| الجانب | الحالة |
|--------|--------|
| النشر التلقائي | ✅ عبر Vercel (git push → deploy) |
| فحص الصحة | ✅ كل 5 دقائق |
| اختبارات تلقائية | ❌ غير موجودة في CI |
| فحص الأنواع | ❌ غير مفروض في CI |
| Linting | ❌ غير مفروض في CI |
| Preview deployments | ✅ عبر Vercel |
| Staging environment | ❌ غير موجود |

---

## 16. الأمان

### 16.1 ما هو موجود ✅

| الميزة | التفاصيل |
|--------|----------|
| مصادقة متعددة الطرق | بريد، Google، GitHub، Passkeys، Magic Link، 2FA |
| تشفير كلمات المرور | عبر BetterAuth (bcrypt) |
| حماية CSRF | عبر BetterAuth |
| جلسات آمنة | HttpOnly cookies, 30 يوم |
| التحقق من البريد | مطلوب عند التسجيل |
| حماية XSS | React auto-escaping |
| SQL Injection protection | Prisma ORM (parameterized queries) |
| RBAC | 6 أدوار، 42 صلاحية، project-level roles |
| Multi-tenant isolation | `organizationId` على كل query |
| Audit trails | `ProjectAuditLog` + `OrganizationAuditLog` |
| Token-based access | بوابة المالك عبر token |
| Account deactivation | `isActive` flag |
| حظر المستخدمين | `banned`, `banReason`, `banExpires` |

### 16.2 ما هو مفقود ❌

| الميزة | الأهمية | الملاحظات |
|--------|---------|-----------|
| Content Security Policy (CSP) | عالية | لا توجد CSP headers |
| Rate limiting شامل | عالية | فقط على contact و newsletter |
| CORS configuration | متوسطة | يعتمد على إعدادات Vercel الافتراضية |
| Input validation شامل | متوسطة | Zod موجود لكن ليس على كل endpoint |
| Helmet/Security headers | عالية | لا يوجد إعداد مخصص |
| API key authentication | متوسطة | لا يوجد نظام API keys |
| IP whitelisting | منخفضة | غير موجود |
| Encryption at rest | متوسطة | يعتمد على Supabase |
| Secrets rotation | متوسطة | لا توجد استراتيجية |
| Penetration testing | عالية | لم يتم |
| Security monitoring | عالية | لا Sentry/DataDog |

### 16.3 ثغرات منطقية محتملة

1. **subscriptionProcedure غير مفروض** — مستخدمو الخطة المجانية يمكنهم الوصول لكل الوظائف
2. **لا يوجد rate limiting على API** — يمكن إرسال طلبات غير محدودة
3. **Owner portal tokens لا تنتهي إجبارياً** — `expiresAt` اختياري
4. **لا يوجد تحقق من حجم الملفات** — رفع ملفات كبيرة ممكن
5. **Magic link tokens** — يعتمد على إعدادات BetterAuth الافتراضية

---

## 17. الأداء

### 17.1 تقنيات الأداء المستخدمة ✅

| التقنية | التفاصيل |
|---------|----------|
| React Server Components | Next.js 16 App Router |
| Server-side prefetching | TanStack React Query `prefetchQuery` |
| Hydration | React Query `HydrationBoundary` |
| Virtual scrolling | Gantt chart virtualization |
| Lazy loading | `React.lazy()` للمكونات الكبيرة |
| Image optimization | Next.js `Image` component + Sharp |
| Database indexes | ~130 index على الحقول المهمة |
| Composite indexes | استعلامات مركبة محسنة |
| Monorepo caching | Turborepo remote caching |
| Edge functions | Vercel Edge Runtime (fra1) |

### 17.2 ما هو مفقود ❌

| التقنية | الأهمية |
|---------|---------|
| Redis caching | عالية — ioredis معرّف لكن غير مفعل |
| Web Vitals tracking | عالية — لا يوجد قياس أداء |
| Bundle analysis | متوسطة — لا يوجد تحليل حجم الحزم |
| Database query optimization | متوسطة — لا يوجد query profiling |
| CDN for static assets | منخفضة — Vercel CDN موجود تلقائياً |
| Service Worker | منخفضة — لا يوجد PWA support |
| Connection pooling | متوسطة — يعتمد على Prisma defaults |
| Debouncing/Throttling | متوسطة — غير منهجي |

### 17.3 إعدادات الأداء

| الإعداد | القيمة |
|---------|--------|
| API function timeout | 30 ثانية |
| Region | Frankfurt (fra1) |
| Health check interval | كل 5 دقائق |
| Session fresh age | 5 دقائق |
| Pre-signed URL expiry | 60 ثانية |
| Turbo cache | مفعل للـ build و type-check |

---

## 18. الاختبارات

### 18.1 إطار الاختبارات

| الأداة | الإصدار | الاستخدام |
|--------|---------|-----------|
| Vitest | 4.0.18 | إطار الاختبارات الأساسي |
| Biome | 2.3.5 | Linter و Formatter |

### 18.2 الحالة الحالية

| نوع الاختبار | الحالة | النسبة |
|-------------|--------|--------|
| Unit Tests | شبه غائب | ~5% |
| Integration Tests | غائب | 0% |
| E2E Tests | غائب | 0% |
| API Tests | غائب | 0% |
| Component Tests | غائب | 0% |
| Visual Regression | غائب | 0% |

### 18.3 أوامر الاختبار

```bash
pnpm test              # تشغيل الاختبارات عبر Turborepo
pnpm lint              # biome lint .
pnpm format            # biome format . --write
pnpm type-check        # فحص الأنواع TypeScript
```

### 18.4 ما يجب تغطيته بالاختبارات

**أولوية حرجة:**
1. حسابات مالية (Decimal arithmetic) — المجاميع، الضريبة، الخصومات
2. ZATCA TLV encoding/decoding — صحة ترميز QR
3. نظام الصلاحيات — التأكد من فرض الصلاحيات على كل endpoint
4. Subscription limits — التحقق من حدود الخطط

**أولوية عالية:**
5. CRUD operations — إنشاء/قراءة/تحديث/حذف لكل entity
6. Audit logging — التأكد من تسجيل كل عملية
7. Multi-tenant isolation — التأكد من عدم تسرب بيانات بين المنظمات
8. Owner portal authentication — التحقق من صحة tokens

**أولوية متوسطة:**
9. Gantt chart calculations — التبعيات، المسار الحرج
10. Payroll calculations — صافي الراتب، الخصومات
11. Email template rendering — صحة المحتوى
12. Form validations — Zod schemas

---

## 19. أوامر التطوير

### 19.1 الأوامر الجذرية (Root)

```bash
# التطوير
pnpm dev                    # تشغيل بيئة التطوير (concurrency 15)
pnpm build                  # بناء المشروع
pnpm start                  # تشغيل الإنتاج
pnpm type-check             # فحص الأنواع
pnpm lint                   # فحص الكود (Biome)
pnpm format                 # تنسيق الكود (Biome)
pnpm test                   # تشغيل الاختبارات
pnpm clean                  # تنظيف ملفات البناء

# ملاحظة: كل الأوامر تمر عبر dotenv -c لتحميل المتغيرات البيئية
```

### 19.2 أوامر قاعدة البيانات

```bash
# من مجلد packages/database/
pnpm generate               # توليد Prisma Client + Zod schemas
pnpm push                   # دفع التغييرات لقاعدة البيانات
pnpm migrate                # تشغيل الترحيلات
pnpm studio                 # فتح Prisma Studio
pnpm seed-templates         # بذر قوالب إضافية

# ⚠️ مهم: لا تستخدم npx prisma مباشرة
# استخدم pnpm run push / pnpm run generate
# لأنها تحمل .env عبر dotenv -c وتشغل fix-zod-import.js
```

### 19.3 أوامر البريد

```bash
# من مجلد packages/mail/
pnpm export                 # تصدير قوالب البريد
pnpm preview                # معاينة القوالب (المنفذ 3005)
```

### 19.4 أوامر المصادقة

```bash
# من مجلد packages/auth/
pnpm migrate                # توليد تحديثات مخطط BetterAuth
```

### 19.5 سكربت إصلاح Zod

```
الملف: packages/database/fix-zod-import.js
```

يُشغل تلقائياً بعد `pnpm generate` لإضافة:
```typescript
import { Prisma } from '../generated/client'
```
إلى ملف `prisma/zod/index.ts` المولد تلقائياً.

---

## 20. دليل المطور

### 20.1 إعداد بيئة التطوير

```bash
# 1. استنساخ المستودع
git clone <repo-url>
cd supastarter-nextjs-3

# 2. تثبيت الحزم
pnpm install

# 3. إعداد المتغيرات البيئية
cp .env.example .env
# تعديل .env بالقيم الصحيحة

# 4. توليد Prisma Client
cd packages/database
pnpm generate

# 5. دفع المخطط لقاعدة البيانات
pnpm push

# 6. العودة للجذر وتشغيل التطوير
cd ../..
pnpm dev
```

### 20.2 هيكل إضافة ميزة جديدة

#### 20.2.1 إضافة Model جديد

1. **تعديل Schema:**
   ```
   packages/database/prisma/schema.prisma
   ```
   - إضافة model مع `id`, `organizationId`, `createdById`, timestamps
   - إضافة enums إذا لزم
   - إضافة indexes على الحقول المطلوبة

2. **توليد Client:**
   ```bash
   cd packages/database && pnpm generate && pnpm push
   ```

3. **إنشاء API Module:**
   ```
   packages/api/modules/<module-name>/
   ├── router.ts            # الـ router
   └── procedures/
       ├── list.ts          # قراءة القائمة
       ├── create.ts        # إنشاء
       ├── update.ts        # تحديث
       └── delete.ts        # حذف
   ```

4. **تسجيل في Router الرئيسي:**
   ```
   packages/api/orpc/router.ts
   ```

5. **إنشاء صفحة واجهة:**
   ```
   apps/web/app/(saas)/app/(organizations)/[organizationSlug]/<path>/page.tsx
   ```

6. **إنشاء مكون:**
   ```
   apps/web/modules/saas/<module>/components/<Component>.tsx
   ```

#### 20.2.2 إضافة Endpoint جديد

```typescript
// packages/api/modules/<module>/procedures/<action>.ts
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { db } from "@repo/database";

export const myAction = protectedProcedure
  .input(z.object({
    organizationId: z.string(),
    // ... حقول أخرى
  }))
  .handler(async ({ input, context }) => {
    const { user } = context;
    // ... المنطق
    return result;
  });
```

#### 20.2.3 إضافة صفحة جديدة

```typescript
// apps/web/app/(saas)/app/(organizations)/[organizationSlug]/<path>/page.tsx
import { MyComponent } from "@/modules/saas/<module>/components/MyComponent";

export default function MyPage() {
  return <MyComponent />;
}
```

### 20.3 الأنماط المتبعة (Patterns)

#### 20.3.1 استعلامات API

```typescript
// استخدام ORPC client مع React Query
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

const { data } = useSuspenseQuery(
  orpc.<module>.<action>.queryOptions({
    input: { organizationId, ... }
  })
);
```

#### 20.3.2 Mutations

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (input) => orpc.<module>.<action>.mutate(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [...] });
    toast.success("تمت العملية بنجاح");
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

#### 20.3.3 النماذج (Forms)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  amount: z.coerce.number().positive(),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: "", amount: 0 },
});
```

#### 20.3.4 الترجمة

```typescript
import { useTranslations } from "next-intl";

const t = useTranslations("module");
// استخدام: t("key")
```

#### 20.3.5 الصلاحيات

```typescript
import { useProjectRole } from "@/modules/saas/projects/hooks/useProjectRole";

const { role, can } = useProjectRole();

if (can("finance.view")) {
  // عرض المحتوى المالي
}
```

### 20.4 اصطلاحات التسمية

| النوع | الاصطلاح | مثال |
|-------|----------|------|
| ملفات المكونات | PascalCase | `ProjectShell.tsx` |
| ملفات الـ hooks | camelCase مع use | `useProjectRole.ts` |
| ملفات الـ lib | camelCase | `gantt-utils.ts` |
| مجلدات API | kebab-case | `project-field/` |
| Prisma models | PascalCase | `ProjectExpense` |
| Prisma enums | PascalCase | `ExpenseCategory` |
| API endpoints | camelCase | `createExpense` |
| صفحات الويب | kebab-case | `new-expense/page.tsx` |

### 20.5 هيكل مجلد API Module

```
packages/api/modules/<module>/
├── router.ts                 # تجميع كل الـ procedures
├── procedures/
│   ├── list.ts              # استعلام قائمة
│   ├── get-by-id.ts         # استعلام واحد
│   ├── create.ts            # إنشاء
│   ├── update.ts            # تحديث
│   ├── delete.ts            # حذف
│   └── <custom>.ts          # عمليات مخصصة
└── lib/                      # دوال مساعدة (اختياري)
    └── helpers.ts
```

---

## 21. المشاكل المعروفة

### 21.1 مشاكل حرجة

| # | المشكلة | التأثير | الحل المقترح |
|---|---------|---------|-------------|
| 1 | ZATCA المرحلة 2 غائبة | عدم التوافق القانوني | تكامل مع ZATCA API |
| 2 | subscriptionProcedure غير مفروض | فقدان الإيرادات | تطبيقه على endpoints المناسبة |
| 3 | غياب الاختبارات | مخاطر عالية عند التحديث | كتابة اختبارات شاملة |
| 4 | لا monitoring مركزي | صعوبة اكتشاف المشاكل | إضافة Sentry أو DataDog |
| 5 | Rate limiting محدود | عرضة لـ abuse | إضافة rate limiting شامل |

### 21.2 مشاكل متوسطة

| # | المشكلة | التأثير | الحل المقترح |
|---|---------|---------|-------------|
| 6 | Redis غير مفعل | أداء أقل من المتوقع | تفعيل Redis للتخزين المؤقت |
| 7 | لا CSP headers | مخاطر أمنية | إضافة Content Security Policy |
| 8 | لا staging environment | اختبار مباشر في الإنتاج | إنشاء بيئة staging |
| 9 | تصدير PDF محدود | جودة PDF منخفضة | استخدام مكتبة PDF متقدمة |
| 10 | لا backup strategy موثقة | خطر فقدان البيانات | إنشاء خطة نسخ احتياطي |
| 11 | Gantt على الموبايل ضعيف | تجربة موبايل سيئة | MobileGanttFallback موجود لكن محدود |
| 12 | لا Web Vitals tracking | لا قياس لتجربة المستخدم | إضافة analytics |

### 21.3 مشاكل منخفضة

| # | المشكلة | التأثير | الحل المقترح |
|---|---------|---------|-------------|
| 13 | لا PWA support | لا يعمل offline | إضافة Service Worker |
| 14 | لا API documentation عام | صعوبة التكامل | نشر OpenAPI docs |
| 15 | لا dark mode كامل | تجربة مظلمة ناقصة | مراجعة كل المكونات |
| 16 | 3 لغات فقط | تغطية لغوية محدودة | إضافة لغات أخرى (fr, ur, etc.) |
| 17 | لا import/export بيانات | صعوبة الترحيل | إضافة CSV/Excel import |

---

## 22. خارطة الطريق

### 22.1 المرحلة القريبة (1-3 أشهر)

| الأولوية | المهمة | الجهد المتوقع |
|---------|--------|-------------|
| 🔴 حرج | ZATCA المرحلة 2 (XML, CSID, Clearance) | 4-6 أسابيع |
| 🔴 حرج | تفعيل subscriptionProcedure على endpoints | 1 أسبوع |
| 🔴 حرج | إضافة rate limiting شامل | 1 أسبوع |
| 🟡 عالي | كتابة اختبارات للحسابات المالية | 2-3 أسابيع |
| 🟡 عالي | إضافة Sentry لـ error monitoring | 2-3 أيام |
| 🟡 عالي | إضافة CSP headers | 1-2 يوم |

### 22.2 المرحلة المتوسطة (3-6 أشهر)

| الأولوية | المهمة | الجهد المتوقع |
|---------|--------|-------------|
| 🟡 عالي | تغطية اختبارات شاملة (>60%) | 4-6 أسابيع |
| 🟡 عالي | تفعيل Redis للتخزين المؤقت | 1-2 أسبوع |
| 🟡 عالي | بيئة Staging | 1 أسبوع |
| 🟢 متوسط | نظام إشعارات Push | 2-3 أسابيع |
| 🟢 متوسط | تصدير PDF متقدم | 2-3 أسابيع |
| 🟢 متوسط | لوحة Super Admin متقدمة | 2-3 أسابيع |
| 🟢 متوسط | تطبيق موبايل (React Native أو PWA) | 6-8 أسابيع |

### 22.3 المرحلة البعيدة (6-12 شهر)

| الأولوية | المهمة | الجهد المتوقع |
|---------|--------|-------------|
| 🟢 متوسط | نظام اعتماد متعدد المستويات | 3-4 أسابيع |
| 🟢 متوسط | ذكاء اصطناعي متقدم (تحليل تلقائي) | 4-6 أسابيع |
| 🟢 متوسط | تكامل WhatsApp Business API | 2-3 أسابيع |
| 🟢 متوسط | دعم متعدد العملات | 2-3 أسابيع |
| 🔵 منخفض | API عام مع documentation | 3-4 أسابيع |
| 🔵 منخفض | Marketplace للإضافات | 6-8 أسابيع |
| 🔵 منخفض | تكامل مع أنظمة ERP | 4-6 أسابيع |

---

## 23. الملاحق

### ملحق أ: جدول الحزم الكامل (package.json)

#### الجذر

| الحزمة | الإصدار | النوع |
|--------|---------|-------|
| `@sindresorhus/slugify` | ^3.0.0 | dependency |
| `@biomejs/biome` | 2.3.5 | devDependency |
| `turbo` | ^2.7.2 | devDependency |
| `typescript` | 5.9.3 | devDependency |
| `vitest` | ^4.0.18 | devDependency |
| `dotenv-cli` | ^11.0.0 | devDependency |

#### apps/web — Frontend

| الحزمة | الإصدار |
|--------|---------|
| `next` | 16.1.0 |
| `react` | 19.2.3 |
| `react-dom` | 19.2.3 |
| `typescript` | 5.9.3 |
| `better-auth` | 1.4.7 |
| `@better-auth/passkey` | ^1.4.7 |
| `hono` | ^4.10.5 |
| `@orpc/client` | 1.13.2 |
| `@orpc/tanstack-query` | 1.13.2 |
| `@tanstack/react-query` | ^5.90.9 |
| `@tanstack/react-table` | ^8.21.3 |
| `zod` | ^4.1.12 |
| `react-hook-form` | ^7.66.0 |
| `@hookform/resolvers` | 5.2.2 |
| `next-intl` | 4.5.3 |
| `next-themes` | ^0.4.6 |
| `recharts` | ^2.15.4 |
| `lucide-react` | ^0.553.0 |
| `sonner` | ^2.0.7 |
| `nuqs` | ^2.7.3 |
| `date-fns` | ^4.1.0 |
| `react-dropzone` | ^14.3.8 |
| `react-markdown` | ^10.1.0 |
| `react-qr-code` | ^2.0.17 |
| `sharp` | ^0.34.5 |
| `clsx` | ^2.1.1 |
| `uuid` | ^13.0.0 |
| `es-toolkit` | ^1.41.0 |
| `tailwind-merge` | ^3.4.0 |
| `@ai-sdk/react` | ^2.0.93 |
| `ai` | ^5.0.93 |
| `fumadocs-core` | ^16.0.11 |
| `fumadocs-ui` | ^16.0.11 |
| `yet-another-react-lightbox` | ^3.29.1 |

#### packages/api — Backend

| الحزمة | الإصدار |
|--------|---------|
| `@orpc/server` | 1.13.2 |
| `@orpc/client` | 1.13.2 |
| `@orpc/zod` | 1.13.2 |
| `@orpc/json-schema` | 1.13.2 |
| `@orpc/openapi` | 1.13.2 |
| `hono` | ^4.10.5 |
| `@scalar/hono-api-reference` | ^0.9.24 |
| `qrcode` | ^1.5.4 |
| `ioredis` | ^5.9.3 |
| `nanoid` | ^5.1.6 |
| `openai` | ^6.9.0 |
| `openapi-merge` | ^1.3.3 |
| `zod` | ^4.1.12 |

#### packages/database — ORM

| الحزمة | الإصدار |
|--------|---------|
| `@prisma/client` | 7.1.0 |
| `@prisma/adapter-pg` | ^6.19.0 |
| `pg` | ^8.16.3 |
| `prisma` | 7.1.0 |
| `prisma-zod-generator` | 2.1.2 |
| `zod` | ^4.1.12 |
| `@paralleldrive/cuid2` | ^3.1.0 |
| `nanoid` | ^5.1.5 |

#### packages/auth — Authentication

| الحزمة | الإصدار |
|--------|---------|
| `better-auth` | 1.4.7 |
| `@better-auth/passkey` | ^1.4.7 |
| `cookie` | ^1.0.2 |

#### packages/ai — AI

| الحزمة | الإصدار |
|--------|---------|
| `@ai-sdk/anthropic` | ^2.0.44 |
| `@ai-sdk/openai` | ^2.0.65 |
| `@ai-sdk/react` | ^2.0.93 |
| `ai` | ^5.0.93 |
| `openai` | ^6.9.0 |

#### packages/payments — Billing

| الحزمة | الإصدار |
|--------|---------|
| `stripe` | ^19.3.1 |
| `chargebee-typescript` | ^2.53.0 |
| `@lemonsqueezy/lemonsqueezy.js` | ^4.0.0 |
| `@polar-sh/sdk` | ^0.41.4 |
| `dodopayments` | ^2.8.0 |

#### packages/mail — Email

| الحزمة | الإصدار |
|--------|---------|
| `react-email` | ^5.0.4 |
| `@react-email/components` | ^1.0.1 |
| `@react-email/render` | ^2.0.0 |
| `resend` | ^6.4.2 |
| `nodemailer` | ^7.0.10 |

#### packages/storage — S3

| الحزمة | الإصدار |
|--------|---------|
| `@aws-sdk/client-s3` | 3.437.0 |
| `@aws-sdk/s3-request-presigner` | 3.437.0 |

### ملحق ب: مخطط العلاقات (ER Diagram - مبسط)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────▶│  Organization │────▶│   Project     │
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ email        │     │ slug         │     │ slug         │
│ name         │     │ name         │     │ name         │
│ role         │     │ plan         │     │ status       │
│ accountType  │     │ status       │     │ contractValue│
│ isActive     │     │ currency     │     │ progress     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │     ┌──────────────┤                    │
       │     │              │                    │
       │     ▼              ▼                    ▼
       │  ┌────────┐  ┌──────────┐  ┌──────────────────┐
       │  │ Member │  │  Client  │  │  ProjectMember   │
       │  └────────┘  └────┬─────┘  └──────────────────┘
       │                   │
       │                   ▼
       │            ┌──────────────┐
       │            │  Quotation   │
       │            │  Invoice     │
       │            │  Payment     │
       │            └──────────────┘
       │
       │    ┌────────────────────────────────────┐
       │    │          Project Children           │
       │    │                                    │
       │    │  DailyReport  Photo  Issue         │
       │    │  Expense  Claim  Document          │
       │    │  Milestone  Activity  Dependency    │
       │    │  Subcontract  Contract  ChangeOrder │
       │    │  Message  OwnerAccess  AuditLog    │
       │    └────────────────────────────────────┘
       │
       │    ┌────────────────────────────────────┐
       │    │      Organization Children          │
       │    │                                    │
       │    │  Employee  CompanyAsset            │
       │    │  CompanyExpense  PayrollRun        │
       │    │  BankAccount  FinanceExpense       │
       │    │  FinancePayment  FinanceTransfer   │
       │    │  CostStudy  FinanceTemplate        │
       │    │  Role  AuditLog  Sequence          │
       │    └────────────────────────────────────┘
```

### ملحق ج: قاموس المصطلحات

| المصطلح | الترجمة | الوصف |
|---------|---------|-------|
| SaaS | خدمة سحابية | Software as a Service |
| Multi-tenant | متعدد المستأجرين | عزل بيانات كل منظمة |
| RBAC | تحكم وصول بالأدوار | Role-Based Access Control |
| RTL | من اليمين لليسار | Right-to-Left |
| ORPC | RPC نوعي | Type-safe Remote Procedure Call |
| ZATCA | هيئة الزكاة | الهيئة العامة للزكاة والضريبة والجمارك |
| TLV | Tag-Length-Value | ترميز البيانات في QR |
| WBS | هيكل تقسيم العمل | Work Breakdown Structure |
| Gantt | مخطط جانت | مخطط زمني لتتبع المهام |
| Baseline | الخط الأساسي | نسخة مرجعية من الجدول |
| Critical Path | المسار الحرج | أطول سلسلة أنشطة |
| BOQ | جدول الكميات | Bill of Quantities |
| VAT | ضريبة القيمة المضافة | Value Added Tax |
| GOSI | التأمينات الاجتماعية | General Organization for Social Insurance |
| MRR | الإيرادات الشهرية المتكررة | Monthly Recurring Revenue |
| Churn Rate | معدل التسرب | نسبة العملاء المغادرين |
| Webhook | خطاف ويب | HTTP callback لأحداث خارجية |
| Pre-signed URL | رابط موقع مسبقاً | رابط مؤقت للرفع/التحميل المباشر |
| Hydration | الإماهة | تحويل HTML ثابت لتطبيق React تفاعلي |
| SSR | عرض من الخادم | Server-Side Rendering |
| CSP | سياسة أمان المحتوى | Content Security Policy |
| CSRF | تزوير الطلبات | Cross-Site Request Forgery |

### ملحق د: مصفوفة الصلاحيات الكاملة (ملخص)

| القسم | الصلاحية | OWNER | PM | ACCT | ENG | SUP |
|-------|----------|:-----:|:--:|:----:|:---:|:---:|
| projects | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| projects | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| projects | edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| projects | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| projects | viewFinance | ✅ | ✅ | ✅ | ❌ | ❌ |
| projects | manageTeam | ✅ | ✅ | ❌ | ❌ | ❌ |
| quantities | view | ✅ | ✅ | ✅ | ✅ | ❌ |
| quantities | create | ✅ | ✅ | ❌ | ✅ | ❌ |
| quantities | edit | ✅ | ✅ | ❌ | ✅ | ❌ |
| quantities | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| quantities | pricing | ✅ | ✅ | ✅ | ❌ | ❌ |
| pricing | view | ✅ | ✅ | ✅ | ❌ | ❌ |
| pricing | studies | ✅ | ✅ | ❌ | ❌ | ❌ |
| pricing | quotations | ✅ | ✅ | ✅ | ❌ | ❌ |
| pricing | pricing | ✅ | ✅ | ✅ | ❌ | ❌ |
| finance | view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finance | quotations | ✅ | ✅ | ✅ | ❌ | ❌ |
| finance | invoices | ✅ | ✅ | ✅ | ❌ | ❌ |
| finance | payments | ✅ | ✅ | ✅ | ❌ | ❌ |
| finance | reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| finance | settings | ✅ | ❌ | ✅ | ❌ | ❌ |
| employees | view | ✅ | ✅ | ✅ | ❌ | ❌ |
| employees | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| employees | edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| employees | delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| employees | payroll | ✅ | ❌ | ✅ | ❌ | ❌ |
| employees | attendance | ✅ | ✅ | ❌ | ❌ | ❌ |
| company | view | ✅ | ✅ | ✅ | ❌ | ❌ |
| company | expenses | ✅ | ❌ | ✅ | ❌ | ❌ |
| company | assets | ✅ | ✅ | ❌ | ❌ | ❌ |
| company | reports | ✅ | ❌ | ✅ | ❌ | ❌ |
| settings | organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings | users | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings | roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings | billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings | integrations | ✅ | ❌ | ❌ | ❌ | ❌ |
| reports | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports | create | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports | approve | ✅ | ✅ | ❌ | ❌ | ❌ |

**الاختصارات:** PM = PROJECT_MANAGER, ACCT = ACCOUNTANT, ENG = ENGINEER, SUP = SUPERVISOR

### ملحق هـ: خريطة المسارات (Route Map)

```
/                                    → الصفحة الرئيسية
/auth/login                          → تسجيل الدخول
/auth/signup                         → إنشاء حساب
/auth/forgot-password                → نسيت كلمة المرور
/auth/reset-password                 → إعادة تعيين
/auth/verify                         → تأكيد البريد
/auth/change-password                → تغيير كلمة المرور
/[locale]/blog                       → المدونة
/[locale]/docs                       → التوثيق
/[locale]/contact                    → التواصل
/onboarding                          → التهيئة الأولى
/choose-plan                         → اختيار الخطة
/new-organization                    → منظمة جديدة
/app                                 → لوحة التحكم
/app/settings/*                      → إعدادات الحساب
/app/admin/*                         → لوحة المشرف
/app/[org]                           → لوحة المنظمة
/app/[org]/projects                  → المشاريع
/app/[org]/projects/new              → مشروع جديد
/app/[org]/projects/[id]             → نظرة عامة
/app/[org]/projects/[id]/field       → الميداني
/app/[org]/projects/[id]/timeline    → الجدول الزمني
/app/[org]/projects/[id]/finance/*   → مالية المشروع
/app/[org]/projects/[id]/documents/* → المستندات
/app/[org]/projects/[id]/changes/*   → أوامر التغيير
/app/[org]/projects/[id]/team        → الفريق
/app/[org]/projects/[id]/chat        → الدردشة
/app/[org]/projects/[id]/owner       → المالك
/app/[org]/projects/[id]/insights    → التحليلات
/app/[org]/finance/*                 → المالية
/app/[org]/company/*                 → إدارة الشركة
/app/[org]/settings/*                → إعدادات المنظمة
/app/[org]/notifications             → الإشعارات
/owner/[token]/*                     → بوابة المالك
/share/[token]                       → رابط مشاركة
```

---

### ملحق و: مكونات Radix UI المستخدمة

| المكون | الحزمة | الاستخدام في مسار |
|--------|--------|-------------------|
| Accordion | `@radix-ui/react-accordion` | الأقسام القابلة للطي |
| Alert Dialog | `@radix-ui/react-alert-dialog` | تأكيد الحذف والعمليات الخطرة |
| Avatar | `@radix-ui/react-avatar` | صور المستخدمين |
| Checkbox | `@radix-ui/react-checkbox` | خانات الاختيار |
| Collapsible | `@radix-ui/react-collapsible` | أقسام قابلة للطي |
| Context Menu | `@radix-ui/react-context-menu` | قائمة النقر الأيمن |
| Dialog | `@radix-ui/react-dialog` | النوافذ المنبثقة |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` | القوائم المنسدلة |
| Hover Card | `@radix-ui/react-hover-card` | بطاقات التمرير |
| Label | `@radix-ui/react-label` | تسميات النماذج |
| Menubar | `@radix-ui/react-menubar` | شريط القوائم |
| Navigation Menu | `@radix-ui/react-navigation-menu` | قوائم التنقل |
| Popover | `@radix-ui/react-popover` | النوافذ المنبثقة الصغيرة |
| Progress | `@radix-ui/react-progress` | أشرطة التقدم |
| Radio Group | `@radix-ui/react-radio-group` | أزرار الاختيار |
| Scroll Area | `@radix-ui/react-scroll-area` | مناطق التمرير المخصصة |
| Select | `@radix-ui/react-select` | قوائم الاختيار |
| Separator | `@radix-ui/react-separator` | الفواصل |
| Sheet | `@radix-ui/react-dialog` | الألواح الجانبية (Drawer) |
| Slider | `@radix-ui/react-slider` | أشرطة التمرير |
| Switch | `@radix-ui/react-switch` | مفاتيح التبديل |
| Tabs | `@radix-ui/react-tabs` | التبويبات |
| Toast | `sonner` | إشعارات مؤقتة |
| Toggle | `@radix-ui/react-toggle` | أزرار التبديل |
| Toggle Group | `@radix-ui/react-toggle-group` | مجموعة أزرار تبديل |
| Tooltip | `@radix-ui/react-tooltip` | التلميحات |

### ملحق ز: الأيقونات المستخدمة (Lucide)

أبرز الأيقونات المستخدمة من مكتبة `lucide-react`:

| الأيقونة | الاستخدام |
|----------|-----------|
| `LayoutDashboard` | لوحة التحكم |
| `FolderOpen` | المستندات |
| `Receipt` | المصروفات |
| `CreditCard` | المدفوعات |
| `FileContract` | العقود والمقاولات |
| `Users` | الفريق |
| `UserCircle` | المالك |
| `BarChart` | التحليلات |
| `CalendarRange` | الجدول الزمني |
| `Building2` | المنظمة |
| `HardHat` | المشروع |
| `Camera` | الصور |
| `AlertTriangle` | المشاكل |
| `CheckCircle` | مكتمل |
| `Clock` | قيد الانتظار |
| `Plus` | إضافة |
| `Pencil` | تعديل |
| `Trash2` | حذف |
| `Download` | تحميل |
| `Upload` | رفع |
| `Search` | بحث |
| `Filter` | فلتر |
| `Settings` | إعدادات |
| `Bell` | إشعارات |
| `MessageCircle` | دردشة |
| `Bot` | ذكاء اصطناعي |
| `ChevronRight` / `ChevronLeft` | التنقل RTL |
| `ArrowUpDown` | ترتيب |
| `MoreHorizontal` | المزيد |
| `ExternalLink` | رابط خارجي |

### ملحق ح: ملخص الإحصائيات النهائي

```
┌─────────────────────────────────────────────────────────┐
│                    مسار (Masar)                          │
│              منصة إدارة المشاريع الإنشائية               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 قاعدة البيانات                                      │
│  ├── 85 Model                                           │
│  ├── 65 Enum                                            │
│  ├── ~130 Index                                         │
│  └── ~40 Unique Constraint                              │
│                                                         │
│  🔌 API                                                 │
│  ├── 36 Module                                          │
│  ├── 400+ Endpoint                                      │
│  ├── 4 Procedure Levels                                 │
│  └── 3 Middleware                                       │
│                                                         │
│  🖥️ واجهة المستخدم                                     │
│  ├── 104 Page                                           │
│  ├── 16 Layout                                          │
│  ├── 18 SaaS Module                                     │
│  ├── 370+ Component                                     │
│  └── 2 Gantt Chart Systems                              │
│                                                         │
│  🔐 الأمان والصلاحيات                                   │
│  ├── 6 Auth Methods                                     │
│  ├── 6 Role Types                                       │
│  ├── 8 Permission Sections                              │
│  ├── 42 Permission Flags                                │
│  └── 5 Project Roles                                    │
│                                                         │
│  🤖 الذكاء الاصطناعي                                    │
│  ├── GPT-4o-mini (Chat)                                 │
│  ├── Claude Sonnet 4 (Assistant)                        │
│  ├── DALL-E 3 (Images)                                  │
│  ├── Whisper-1 (Audio)                                  │
│  └── 6 AI Tools                                         │
│                                                         │
│  📦 البنية التحتية                                      │
│  ├── 16 Monorepo Packages                               │
│  ├── Next.js 16.1.0                                     │
│  ├── React 19.2.3                                       │
│  ├── TypeScript 5.9.3                                   │
│  ├── Prisma 7.1.0                                       │
│  └── Vercel (Frankfurt)                                 │
│                                                         │
│  💰 الأعمال                                             │
│  ├── 2 Plans (FREE, PRO)                                │
│  ├── 299 SAR/month                                      │
│  ├── Stripe Integration                                 │
│  ├── ZATCA Phase 1 ✅                                    │
│  └── ZATCA Phase 2 ❌                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

> **نهاية التقرير**
>
> تم إعداد هذا التقرير بناءً على قراءة فعلية وشاملة للكود المصدري لمنصة مسار.
> جميع الأرقام والبيانات مستخرجة مباشرة من الملفات المصدرية.
> آخر تحديث: 2026-03-04
