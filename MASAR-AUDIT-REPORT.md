# تقرير التدقيق الشامل — منصة مسار

> **التاريخ:** 2026-02-25
> **النسخة:** 1.0
> **المدقق:** Claude Opus 4.6 (تدقيق آلي للكود)
> **النطاق:** المستودع الكامل `supastarter-nextjs-3`

---

## جدول المحتويات

1. [الملخص التنفيذي](#1-الملخص-التنفيذي)
2. [كيف تقرأ المستودع](#2-كيف-تقرأ-المستودع)
3. [شجرة المستودع](#3-شجرة-المستودع)
4. [معمارية التشغيل](#4-معمارية-التشغيل)
5. [خريطة الصفحات والمسارات](#5-خريطة-الصفحات-والمسارات)
6. [سطح API](#6-سطح-api)
7. [المصادقة والجلسات](#7-المصادقة-والجلسات)
8. [الصلاحيات والعزل](#8-الصلاحيات-والعزل)
9. [قاعدة البيانات](#9-قاعدة-البيانات)
10. [الوحدات التفصيلية](#10-الوحدات-التفصيلية)
11. [الواجهة وRTL وi18n](#11-الواجهة-وrtl-وi18n)
12. [المراجعة الأمنية](#12-المراجعة-الأمنية)
13. [الأداء والتوسع](#13-الأداء-والتوسع)
14. [الاختبارات والجودة](#14-الاختبارات-والجودة)
15. [كتالوج المشاكل](#15-كتالوج-المشاكل)
16. [خريطة الإصلاح — أعلى 20](#16-خريطة-الإصلاح--أعلى-20)
17. [خطة المراحل](#17-خطة-المراحل)
18. [الملاحق](#18-الملاحق)

---

## 1. الملخص التنفيذي

### نظرة عامة

منصة **مسار** هي تطبيق SaaS متعدد المستأجرين لإدارة المقاولات، مبني على supastarter كقاعدة أساسية مع تعديلات جوهرية. المنصة تدير دورة حياة مشاريع البناء من التسعير إلى التنفيذ إلى المالية.

### الأرقام الرئيسية

| المقياس | القيمة |
|---------|--------|
| إجمالي الموديلات | 73 |
| إجمالي الـ Enums | 57 |
| أسطر schema.prisma | 3,299 |
| وحدات API (ORPC) | 32 |
| وحدات SaaS Frontend | 17 |
| صفحات App Router | ~137 |
| أسطر الترجمة (ar+en) | ~8,300 |
| ملفات الاختبار | 0 (فعلياً) |

### أعلى 10 مشاكل حرجة (P0/P1)

| # | المشكلة | الخطورة |
|---|---------|---------|
| 1 | **`.env.local` مسرب في Git** — بيانات قاعدة البيانات ومفاتيح API مكشوفة | **P0** |
| 2 | **`getUserPermissions` لا يتحقق من organizationId** — يجلب المستخدم بـ `findUnique({id})` دون فلترة المنظمة | **P0** |
| 3 | **لا توجد اختبارات تقريباً** — صفر ملفات `.test.ts` أو `.spec.ts` في التطبيق | **P1** |
| 4 | **Rate limiting في الذاكرة فقط** — لا يعمل مع multi-instance deployment | **P1** |
| 5 | **Float للقيم المالية في CostStudy** — IEEE 754 يسبب أخطاء تقريب | **P1** |
| 6 | **نظام أدوار مزدوج** — `Member.role` (BetterAuth) + `Role` model (مخصص) | **P1** |
| 7 | **Owner portal tokens بلا expiry إلزامي** — الرابط يعمل للأبد | **P1** |
| 8 | **Prisma + Drizzle معاً** — ORM مزدوج يزيد التعقيد | **P2** |
| 9 | **لا يوجد CSP كامل** — `frame-ancestors 'none'` فقط، لا `script-src`/`style-src` | **P2** |
| 10 | **ZATCA Phase 1 فقط** — لا يوجد تكامل Phase 2 (E-invoicing API) | **P2** |

---

## 2. كيف تقرأ المستودع

### بنية Monorepo

المشروع monorepo يستخدم **pnpm workspaces** مع **Turborepo**:

```
supastarter-nextjs-3/          ← جذر المشروع
├── apps/
│   └── web/                   ← تطبيق Next.js 16 الرئيسي
├── packages/
│   ├── api/                   ← طبقة API (ORPC + Hono)
│   ├── auth/                  ← BetterAuth v1.4.7
│   ├── database/              ← Prisma 7 + Drizzle + Queries
│   ├── config/                ← إعدادات التطبيق المركزية
│   ├── i18n/                  ← الترجمة (ar + en)
│   ├── mail/                  ← Resend email service
│   ├── payments/              ← Stripe integration
│   ├── storage/               ← AWS S3 / Cloudflare R2
│   ├── logs/                  ← Logging
│   ├── ui/                    ← shadcn/ui مكونات (يُعاد تصديرها)
│   └── utils/                 ← أدوات مشتركة
├── config/                    ← إعدادات التطبيق (index.ts + types.ts)
├── content-collections/       ← Blog + Docs + Legal + Changelog
└── tooling/                   ← Biome + TypeScript configs
```

### الأنماط الرئيسية

- **API Layer:** ORPC (type-safe RPC) — ليس REST وليس GraphQL
- **State:** TanStack React Query v5 عبر ORPC hooks
- **Auth:** BetterAuth مع Prisma adapter
- **DB Access:** `packages/database/prisma/queries/*.ts` — كل الاستعلامات في ملفات queries مفصولة
- **Permissions:** `packages/database/prisma/permissions.ts` — نظام RBAC مخصص بالكامل
- **i18n:** `next-intl` مع ملفات `ar.json` / `en.json`

---

## 3. شجرة المستودع

```
supastarter-nextjs-3/
├── apps/web/
│   ├── app/
│   │   ├── (marketing)/[locale]/      # 8 صفحات تسويقية
│   │   ├── (saas)/
│   │   │   ├── app/(account)/          # 10 صفحات حساب + إدارة
│   │   │   ├── app/(organizations)/[organizationSlug]/
│   │   │   │   ├── company/            # 16 صفحة إدارة منشأة
│   │   │   │   ├── finance/            # 32 صفحة مالية
│   │   │   │   ├── projects/[projectId]/ # 41 صفحة مشاريع
│   │   │   │   ├── quantities/         # 7 صفحات كميات
│   │   │   │   ├── settings/           # 7 صفحات إعدادات
│   │   │   │   └── ...
│   │   │   ├── choose-plan/
│   │   │   ├── new-organization/
│   │   │   ├── onboarding/
│   │   │   └── organization-invitation/
│   │   ├── auth/                       # 6 صفحات مصادقة
│   │   ├── owner/[token]/              # 6 صفحات بوابة المالك
│   │   └── share/[token]/              # 1 صفحة مشاركة
│   └── modules/saas/                   # 17 وحدة frontend
│       ├── admin/
│       ├── ai/
│       ├── auth/
│       ├── company/           ← جديد
│       ├── dashboard/
│       ├── finance/
│       ├── integrations/
│       ├── onboarding/
│       ├── organizations/
│       ├── payments/
│       ├── projects/
│       ├── projects-changes/
│       ├── projects-timeline/
│       ├── quantities/
│       ├── settings/
│       └── shared/
├── packages/
│   ├── api/
│   │   ├── modules/           # 32 وحدة API
│   │   ├── lib/
│   │   │   ├── permissions/   # RBAC verification
│   │   │   ├── rate-limit.ts  # In-memory rate limiter
│   │   │   └── zatca/         # ZATCA Phase 1
│   │   └── orpc/router.ts     # Main ORPC router
│   ├── auth/auth.ts           # BetterAuth config
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # 73 models, 57 enums, 3299 lines
│   │   │   ├── queries/       # Database query functions
│   │   │   ├── permissions.ts # RBAC permission system
│   │   │   └── zod/           # Auto-generated Zod schemas
│   │   └── drizzle/           # Drizzle ORM (legacy/parallel)
│   ├── i18n/translations/
│   │   ├── ar.json            # 4,067 أسطر
│   │   └── en.json            # 4,232 أسطر
│   └── storage/provider/s3/   # S3/R2 upload
└── config/index.ts            # Feature flags & plans
```

---

## 4. معمارية التشغيل

```
┌─────────────────────────────────────────────────────────────────┐
│                        المتصفح (Browser)                        │
│  React 19 + Next.js 16 App Router + TanStack Query + shadcn/ui │
└───────────────┬─────────────────────┬───────────────────────────┘
                │ ORPC (type-safe)    │ BetterAuth
                ▼                     ▼
┌───────────────────────────────────────────────────────────────┐
│                    Next.js Server (Vercel)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Middleware   │  │  App Router  │  │  API Route Handler │  │
│  │ (auth check) │  │  (RSC + CSR) │  │  /api/rpc (ORPC)   │  │
│  └──────────────┘  └──────────────┘  └─────────┬──────────┘  │
│                                                  │             │
│  ┌──────────────────────────────────────────────┐│             │
│  │              ORPC Router (32 modules)        ││             │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  ││             │
│  │  │Rate Limiter│ │Permission│ │Session Check│  ││             │
│  │  │(in-memory)│ │  Guard   │ │ (BetterAuth)│  ││             │
│  │  └─────────┘ └──────────┘ └──────────────┘  ││             │
│  └──────────────────────────────────────────────┘│             │
│                         │                         │             │
└─────────────────────────┼─────────────────────────┘             │
                          │                                       │
          ┌───────────────┼───────────────────────┐               │
          ▼               ▼                       ▼               │
┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐   │
│  PostgreSQL  │ │  S3 / R2     │ │  External Services       │   │
│  (Supabase)  │ │  (Storage)   │ │  ┌───────┐ ┌──────────┐ │   │
│  Prisma 7    │ │  Pre-signed  │ │  │Resend │ │ Stripe   │ │   │
│  (primary)   │ │  URLs        │ │  │(Email)│ │(Payments)│ │   │
│  Drizzle     │ │              │ │  └───────┘ └──────────┘ │   │
│  (legacy)    │ │              │ │  ┌───────┐              │   │
└──────────────┘ └──────────────┘ │  │Google │ ┌──────────┐ │   │
                                  │  │OAuth  │ │ GitHub   │ │   │
                                  │  └───────┘ │ OAuth    │ │   │
                                  │            └──────────┘ │   │
                                  └──────────────────────────┘   │
```

### مكدس التقنيات

| الطبقة | التقنية | الإصدار |
|--------|---------|---------|
| Runtime | Next.js | 16 |
| UI Framework | React | 19 |
| Language | TypeScript | 5.x |
| ORM (Primary) | Prisma | 7.1.0 |
| ORM (Legacy) | Drizzle | موجود في `/drizzle` |
| API | ORPC | Latest |
| Auth | BetterAuth | 1.4.7 |
| State | TanStack React Query | 5 |
| UI Components | shadcn/ui + Radix | Latest |
| CSS | Tailwind CSS | 4 |
| Email | Resend | Latest |
| Payments | Stripe | Latest |
| Storage | AWS S3 / Cloudflare R2 | Latest |
| Database | PostgreSQL | (Supabase hosted) |
| Monorepo | pnpm + Turborepo | Latest |
| Linting | Biome | Latest |
| CMS | Content Collections | Latest |

---

## 5. خريطة الصفحات والمسارات

### مسارات المصادقة (`/auth/*`)

| المسار | الوصف |
|--------|-------|
| `/auth/login` | تسجيل الدخول |
| `/auth/signup` | إنشاء حساب |
| `/auth/forgot-password` | نسيت كلمة المرور |
| `/auth/reset-password` | إعادة تعيين كلمة المرور |
| `/auth/verify` | تأكيد البريد الإلكتروني |
| `/auth/change-password` | تغيير كلمة المرور |

### مسارات SaaS الأولية

| المسار | الوصف |
|--------|-------|
| `/onboarding` | إعداد الحساب |
| `/new-organization` | إنشاء منظمة |
| `/choose-plan` | اختيار الباقة |
| `/organization-invitation/[invitationId]` | قبول دعوة |

### مسارات الحساب (`/app/*`)

| المسار | الوصف |
|--------|-------|
| `/app` | الصفحة الرئيسية |
| `/app/chatbot` | المساعد الذكي |
| `/app/settings/general` | إعدادات عامة |
| `/app/settings/security` | إعدادات الأمان (2FA) |
| `/app/settings/billing` | الفوترة |
| `/app/settings/danger-zone` | حذف الحساب |
| `/app/admin/users` | إدارة المستخدمين (Admin) |
| `/app/admin/organizations/[id]` | إدارة منظمة (Admin) |

### مسارات المنظمة (`/app/[organizationSlug]/*`)

| المسار | الوصف | عدد الصفحات |
|--------|-------|-------------|
| `/` | لوحة التحكم | 1 |
| `/chatbot` | المساعد الذكي | 1 |
| `/notifications` | الإشعارات | 1 |

### مسارات المشاريع (`/app/[org]/projects/*`)

| المسار | الوصف |
|--------|-------|
| `/projects` | قائمة المشاريع |
| `/projects/new` | مشروع جديد |
| `/projects/templates` | قوالب المشاريع |
| `/projects/[id]` | نظرة عامة |
| `/projects/[id]/execution` | التنفيذ (تقارير + مشاكل + صور) |
| `/projects/[id]/field` | الميدان (تقارير + مشاكل + صور) |
| `/projects/[id]/finance` | مالية المشروع |
| `/projects/[id]/finance/expenses` | مصروفات المشروع |
| `/projects/[id]/finance/claims` | مستخلصات |
| `/projects/[id]/finance/payments` | دفعات |
| `/projects/[id]/finance/subcontracts` | عقود الباطن |
| `/projects/[id]/finance/subcontracts/[id]` | تفاصيل عقد |
| `/projects/[id]/finance/contract` | العقد الرئيسي |
| `/projects/[id]/documents` | المستندات |
| `/projects/[id]/chat` | محادثات المشروع |
| `/projects/[id]/changes` | أوامر التغيير |
| `/projects/[id]/timeline` | الجدول الزمني |
| `/projects/[id]/updates` | التحديثات |
| `/projects/[id]/insights` | رؤى وتحليلات |
| `/projects/[id]/owner` | بوابة المالك |
| `/projects/[id]/team` | فريق المشروع |

### مسارات المالية (`/app/[org]/finance/*`)

| المسار | الوصف |
|--------|-------|
| `/finance` | لوحة التحكم المالية |
| `/finance/quotations` | عروض الأسعار |
| `/finance/invoices` | الفواتير |
| `/finance/expenses` | المصروفات |
| `/finance/payments` | المقبوضات |
| `/finance/clients` | العملاء |
| `/finance/banks` | الحسابات البنكية |
| `/finance/documents` | المستندات المالية |
| `/finance/templates` | قوالب الفواتير |
| `/finance/reports` | التقارير |
| `/finance/settings` | الإعدادات المالية |

### مسارات إدارة المنشأة (`/app/[org]/company/*`)

| المسار | الوصف |
|--------|-------|
| `/company` | لوحة التحكم |
| `/company/employees` | الموظفين |
| `/company/employees/[id]` | تفاصيل الموظف |
| `/company/employees/new` | إضافة موظف |
| `/company/expenses` | مصروفات المنشأة |
| `/company/assets` | الأصول |
| `/company/payroll` | الرواتب |
| `/company/reports` | التقارير |

### مسارات الكميات (`/app/[org]/quantities/*`)

| المسار | الوصف |
|--------|-------|
| `/quantities` | دراسات الكميات |
| `/quantities/new` | دراسة جديدة |
| `/quantities/[id]` | نظرة عامة |
| `/quantities/[id]/structural` | الإنشائي |
| `/quantities/[id]/mep` | الكهروميكانيك |
| `/quantities/[id]/finishing` | التشطيبات |
| `/quantities/[id]/pricing` | التسعير |

### مسارات الإعدادات (`/app/[org]/settings/*`)

| المسار | الوصف |
|--------|-------|
| `/settings/general` | عام |
| `/settings/members` | الأعضاء |
| `/settings/users` | المستخدمين |
| `/settings/roles` | الأدوار |
| `/settings/billing` | الفوترة |
| `/settings/integrations` | التكاملات |
| `/settings/danger-zone` | منطقة الخطر |

### البوابات العامة

| المسار | الوصف |
|--------|-------|
| `/owner/[token]` | بوابة مالك المشروع (6 صفحات) |
| `/share/[token]` | رابط مشاركة عام |

---

## 6. سطح API

### هيكل ORPC Router

الـ API مبني على ORPC وموزع على **32 وحدة** في `packages/api/modules/`:

```typescript
// packages/api/orpc/router.ts
publicProcedure.router({
  admin,           newsletter,      contact,
  organizations,   users,           payments,
  ai,              roles,           orgUsers,
  quantities,      projects,        projectField,
  projectFinance,  projectDocuments, projectChat,
  notifications,   projectOwner,    attachments,
  projectTemplates, projectInsights, projectUpdates,
  digests,         integrations,    exports,
  shares,          projectTimeline, projectChangeOrders,
  projectContract, dashboard,       projectTeam,
  finance,         subcontracts,    company,
})
```

### وحدة المالية — الأكثر تعقيداً

```
finance/
├── dashboard          # لوحة التحكم + outstanding
├── clients/           # list, getById, create, update, delete
│   └── contacts/      # list, create, update, delete, setPrimary
├── quotations/        # list, getById, create, update, updateItems,
│                      # updateStatus, delete, convertToInvoice
├── invoices/          # list, getById, create, update, updateItems,
│                      # updateStatus, convertToTax, addPayment,
│                      # deletePayment, delete
├── documents/         # list, getById, create, update, delete
├── templates/         # list, getById, getDefault, create, update,
│                      # setDefault, delete, seed
├── reports/           # revenueByPeriod, revenueByProject,
│                      # revenueByClient, conversionRate,
│                      # quotationStats, invoiceStats
├── banks/             # list, getById, getSummary, create, update,
│                      # setDefault, delete
├── expenses/          # list, listUnified, getById, getSummary,
│                      # create, update, delete, pay, cancel
├── orgPayments/       # list, getById, create, update, delete
├── transfers/         # list, getById, create, cancel
├── orgDashboard       # المالية المؤسسية
├── settings/          # get, update
└── projectFinance     # ربط مالية المشروع
```

### نمط الحماية في الإجراءات

كل إجراء يمر عبر سلسلة:

```
Request → Rate Limit → Session Check → Organization Membership
        → Permission Check → Business Logic → Response
```

---

## 7. المصادقة والجلسات

### الإعداد

| الخاصية | القيمة |
|---------|--------|
| المكتبة | BetterAuth v1.4.7 |
| المحول | `prisma` (PostgreSQL) |
| مدة الجلسة | 30 يوماً (`60 * 60 * 24 * 30`) |
| Fresh Age | 0 (يُعاد التحقق دائماً) |
| Generate ID | `false` (PostgreSQL auto-increment) |

### طرق المصادقة

| الطريقة | الحالة | ملاحظات |
|---------|--------|---------|
| Email + Password | ✅ مفعّل | مع تأكيد البريد |
| Magic Link | ✅ مفعّل | عبر Resend |
| Google OAuth | ✅ مفعّل | `user:email` + `profile` |
| GitHub OAuth | ✅ مفعّل | `user:email` |
| Passkeys | ✅ مفعّل | WebAuthn |
| 2FA (TOTP) | ✅ مفعّل | — |
| Admin | ✅ مفعّل | BetterAuth admin plugin |

### الإضافات المفعّلة (Plugins)

```typescript
plugins: [
  username(),           // اسم المستخدم
  admin(),              // لوحة إدارة
  passkey(),            // مفاتيح المرور
  magicLink(),          // الرابط السحري
  organization(),       // المنظمات
  openAPI(),            // توثيق API
  invitationOnlyPlugin(), // التسجيل بالدعوة فقط
  twoFactor(),          // المصادقة الثنائية
]
```

### حقول المستخدم الإضافية

```typescript
additionalFields: {
  onboardingComplete: boolean,
  locale: string,
  isActive: boolean,          // تعطيل الحساب
  mustChangePassword: boolean,
  accountType: string,
  lastLoginAt: string,        // يُحدّث عند كل دخول
}
```

### Hooks — ما بعد المصادقة

| الحدث | الإجراء |
|-------|---------|
| قبول دعوة | إسناد دور + تعيين `organizationId` |
| إنشاء منظمة | إنشاء أدوار افتراضية + إسناد OWNER |
| إزالة عضو | تحديث الاشتراك (Seats) |
| تسجيل الدخول | تحديث `lastLoginAt` |
| محاولة دخول | التحقق من `isActive` |
| حذف مستخدم/منظمة | إلغاء الاشتراكات |

### ⚠️ مشاكل مكتشفة

| المشكلة | التفاصيل |
|---------|---------|
| ربط الحسابات التلقائي | `trustedProviders: ["google", "github"]` — أي حساب Google/GitHub بنفس البريد يُربط تلقائياً |
| تعيين `organizationId` على User | العلاقة مباشرة على `User` وليست عبر `Member` — مشكلة محتملة في multi-org |
| `session.freshAge: 0` | كل طلب يُعاد فيه التحقق — قد يسبب حمل زائد على DB |

---

## 8. الصلاحيات والعزل

### نظام RBAC

النظام يستخدم نموذج صلاحيات مخصص بالكامل (ليس BetterAuth RBAC):

**الملف:** `packages/database/prisma/permissions.ts`

### الأدوار الافتراضية

| الدور | النوع | الوصف |
|-------|-------|-------|
| OWNER | نظامي | المالك — كل الصلاحيات |
| PROJECT_MANAGER | نظامي | مدير المشاريع |
| ACCOUNTANT | نظامي | المحاسب |
| ENGINEER | نظامي | المهندس |
| SUPERVISOR | نظامي | المشرف |
| CUSTOM | مخصص | صلاحيات يحددها المسؤول |

### مصفوفة الصلاحيات

```
                    OWNER  PM    ACCT  ENG   SUP   CUSTOM
projects.view        ✅    ✅    ✅    ✅    ✅    ❌
projects.create      ✅    ✅    ❌    ❌    ❌    ❌
projects.edit        ✅    ✅    ❌    ✅    ❌    ❌
projects.delete      ✅    ❌    ❌    ❌    ❌    ❌
projects.viewFinance ✅    ✅    ✅    ❌    ❌    ❌
projects.manageTeam  ✅    ✅    ❌    ❌    ❌    ❌

quantities.view      ✅    ✅    ✅    ✅    ✅    ❌
quantities.create    ✅    ✅    ❌    ✅    ❌    ❌
quantities.edit      ✅    ✅    ❌    ✅    ❌    ❌
quantities.delete    ✅    ❌    ❌    ❌    ❌    ❌
quantities.pricing   ✅    ✅    ✅    ❌    ❌    ❌

finance.view         ✅    ✅    ✅    ❌    ❌    ❌
finance.quotations   ✅    ✅    ✅    ❌    ❌    ❌
finance.invoices     ✅    ❌    ✅    ❌    ❌    ❌
finance.payments     ✅    ❌    ✅    ❌    ❌    ❌
finance.reports      ✅    ✅    ✅    ❌    ❌    ❌
finance.settings     ✅    ❌    ✅    ❌    ❌    ❌

employees.view       ✅    ✅    ✅    ❌    ❌    ❌
employees.create     ✅    ❌    ❌    ❌    ❌    ❌
employees.payroll    ✅    ❌    ✅    ❌    ❌    ❌
employees.attendance ✅    ✅    ❌    ❌    ❌    ❌

company.view         ✅    ✅    ✅    ❌    ❌    ❌
company.expenses     ✅    ❌    ✅    ❌    ❌    ❌
company.assets       ✅    ✅    ✅    ❌    ❌    ❌
company.reports      ✅    ✅    ✅    ❌    ❌    ❌

settings.organization ✅   ❌    ❌    ❌    ❌    ❌
settings.users       ✅    ❌    ❌    ❌    ❌    ❌
settings.roles       ✅    ❌    ❌    ❌    ❌    ❌
settings.billing     ✅    ❌    ❌    ❌    ❌    ❌

reports.view         ✅    ✅    ✅    ✅    ✅    ❌
reports.create       ✅    ✅    ❌    ✅    ✅    ❌
reports.approve      ✅    ✅    ❌    ❌    ❌    ❌
```

### آلية التحقق

```
getUserPermissions(userId, organizationId)
  │
  ├─→ Priority 1: user.customPermissions (JSON override)
  │
  ├─→ Priority 2: user.organizationRole.permissions
  │      └─→ fillMissingSections() لملء أقسام جديدة
  │
  └─→ Priority 3: createEmptyPermissions() (لا صلاحيات)
```

### ⚠️ ثغرات خطيرة في العزل

#### P0: `getUserPermissions` لا يتحقق من `organizationId`

```typescript
// packages/api/lib/permissions/get-user-permissions.ts:21
const user = await db.user.findUnique({
  where: { id: userId },  // ← لا فلترة بـ organizationId!
  include: { organizationRole: true },
});
```

**التأثير:** المستخدم يحمل `organizationRoleId` واحد فقط. إذا كان عضواً في منظمتين:
- صلاحياته من المنظمة A ستُطبق في المنظمة B
- لا يتم التحقق من أن الدور ينتمي للمنظمة المطلوبة

#### P1: نظام الأدوار المزدوج

1. **BetterAuth `Member.role`** — القديم (owner/admin/member)
2. **`Role` model** — الجديد (OWNER/PROJECT_MANAGER/ACCOUNTANT/ENGINEER/SUPERVISOR/CUSTOM)

النظام الجديد يتجاهل القديم فعلياً، لكن `Member.role` لا يزال موجوداً ويُستخدم في `verifyProjectAccess.membership.role`.

#### P2: Middleware لا يتحقق من الصلاحيات

```typescript
// apps/web/middleware.ts
// يتحقق من وجود session cookie فقط
const sessionCookie = getSessionCookie(req);
if (!sessionCookie) { redirect to login }
// لا يتحقق من: المنظمة، الصلاحيات، حالة الحساب
```

**التأثير:** يمكن لمستخدم معطّل (`isActive: false`) الوصول لصفحات `/app/*` طالما لديه cookie صالح. الحظر يتم فقط عند محاولة تسجيل الدخول الجديد.

---

## 9. قاعدة البيانات

### إحصائيات

| المقياس | القيمة |
|---------|--------|
| إجمالي الموديلات | 73 |
| إجمالي الـ Enums | 57 |
| أسطر Schema | 3,299 |
| ORM الأساسي | Prisma 7.1.0 |
| ORM الثانوي | Drizzle (موجود) |
| المحول | `@prisma/adapter-pg` |
| المزود | PostgreSQL (Supabase) |

### تصنيف الموديلات

#### المصادقة والمستخدمين (6 موديلات)

| الموديل | الوصف |
|---------|-------|
| `User` | المستخدم + حقول إضافية (`isActive`, `lastLoginAt`, `organizationRoleId`, `customPermissions`) |
| `Session` | جلسات المصادقة |
| `Account` | حسابات OAuth المرتبطة |
| `Verification` | رموز التحقق |
| `Passkey` | مفاتيح المرور (WebAuthn) |
| `TwoFactor` | بيانات 2FA |

#### المنظمات والأعضاء (5 موديلات)

| الموديل | الوصف |
|---------|-------|
| `Organization` | المنظمة |
| `Member` | عضوية (BetterAuth) — تحمل `role` القديم |
| `Invitation` | دعوات BetterAuth |
| `Role` | أدوار مخصصة (`type`, `permissions` JSON, `isSystem`) |
| `UserInvitation` | دعوات المستخدمين |

#### المشاريع (16 موديل)

| الموديل | الوصف |
|---------|-------|
| `Project` | المشروع الرئيسي |
| `ProjectMember` | فريق المشروع |
| `ProjectDailyReport` | التقارير اليومية |
| `ProjectPhoto` | صور المشروع |
| `ProjectIssue` | المشاكل والملاحظات |
| `ProjectProgressUpdate` | تحديثات التقدم |
| `ProjectContract` | العقد الرئيسي |
| `ContractPaymentTerm` | بنود الدفع بالعقد |
| `ProjectDocument` | المستندات |
| `ProjectApproval` | الاعتمادات |
| `ProjectApprovalApprover` | المعتمدون |
| `ProjectAuditLog` | سجل التدقيق |
| `ProjectMilestone` | المعالم |
| `ProjectTemplate` | قوالب المشاريع |
| `ProjectTemplateItem` | عناصر القوالب |
| `ProjectAlert` | التنبيهات |

#### المالية — مستوى المنظمة (7 موديلات)

| الموديل | الوصف |
|---------|-------|
| `OrganizationBank` | الحسابات البنكية |
| `FinanceExpense` | المصروفات |
| `FinancePayment` | المقبوضات (سندات القبض) |
| `FinanceTransfer` | التحويلات بين الحسابات |
| `OrganizationFinanceSettings` | إعدادات المالية |
| `Client` | العملاء |
| `ClientContact` | جهات اتصال العملاء |

#### المالية — مستوى المشروع (4 موديلات)

| الموديل | الوصف |
|---------|-------|
| `ProjectExpense` | مصروفات المشروع |
| `ProjectClaim` | المستخلصات |
| `Quotation` + `QuotationItem` | عروض الأسعار |
| `FinanceInvoice` + `FinanceInvoiceItem` + `FinanceInvoicePayment` | الفواتير |

#### عقود الباطن (4 موديلات)

| الموديل | الوصف |
|---------|-------|
| `SubcontractContract` | عقد مقاول الباطن |
| `SubcontractPaymentTerm` | بنود الدفع |
| `SubcontractChangeOrder` | أوامر تغيير الباطن |
| `SubcontractPayment` | دفعات الباطن |

#### دراسات الكميات (6 موديلات)

| الموديل | الوصف |
|---------|-------|
| `CostStudy` | دراسة التكلفة الرئيسية |
| `StructuralItem` | بنود إنشائية |
| `FinishingItem` | بنود تشطيبات |
| `MEPItem` | بنود كهروميكانيك |
| `LaborItem` | بنود عمالة |
| `Quote` | عروض الأسعار |

#### إدارة المنشأة (7 موديلات) — جديد

| الموديل | الوصف |
|---------|-------|
| `Employee` | الموظفين |
| `EmployeeProjectAssignment` | تعيينات المشاريع |
| `CompanyAsset` | الأصول |
| `CompanyExpense` | مصروفات المنشأة |
| `CompanyExpensePayment` | دفعات المصروفات |
| `CompanyExpenseAllocation` | توزيع على المشاريع |
| `PayrollRun` + `PayrollRunItem` | مسيرات الرواتب |

#### أخرى (10 موديلات)

| الموديل | الوصف |
|---------|-------|
| `AiChat` | محادثات الذكاء الاصطناعي |
| `ProjectMessage` + `ChatLastRead` | الرسائل |
| `Notification` | الإشعارات |
| `ProjectOwnerAccess` | بوابة المالك |
| `Attachment` | المرفقات |
| `DigestSubscription` | اشتراكات الملخصات |
| `OrganizationIntegrationSettings` | التكاملات |
| `MessageDeliveryLog` | سجل تسليم الرسائل |
| `ShareLink` | روابط المشاركة |
| `ProjectChangeOrder` | أوامر التغيير |
| `OpenDocument` | المستندات المفتوحة |
| `FinanceTemplate` | قوالب المالية |
| `Purchase` | المشتريات (Stripe) |

### ⚠️ مشاكل قاعدة البيانات

#### P1: Float في القيم المالية

```prisma
model CostStudy {
  structuralCost   Float @default(0)  // ❌ يجب Decimal(14,2)
  finishingCost    Float @default(0)  // ❌
  mepCost          Float @default(0)  // ❌
  laborCost        Float @default(0)  // ❌
  totalCost        Float @default(0)  // ❌
  overheadPercent  Float @default(5)  // ❌
  profitPercent    Float @default(10) // ❌
}
```

**التأثير:** IEEE 754 يسبب أخطاء تقريب في الحسابات المالية. مثال: `0.1 + 0.2 = 0.30000000000000004`

**النماذج المتأثرة:** `CostStudy`, `StructuralItem`, `FinishingItem`, `MEPItem`, `LaborItem`, `Quote`

> ملاحظة: النماذج المالية الأحدث (`FinanceExpense`, `FinancePayment`, `OrganizationBank`) تستخدم `Decimal` بشكل صحيح.

#### P2: ORM المزدوج (Prisma + Drizzle)

- `packages/database/prisma/` — Prisma 7 (الأساسي)
- `packages/database/drizzle/` — Drizzle (موجود مع schemas + queries)
  - Queries: `users.ts`, `organizations.ts`, `purchases.ts`, `ai-chats.ts`

Drizzle يبدو أنه جزء من supastarter الأصلي ولم يُزال بعد الانتقال لـ Prisma.

#### P2: عدم وجود Audit Trail شامل

`ProjectAuditLog` موجود لكن لا يُستخدم بشكل متسق عبر كل العمليات الحساسة (خاصة المالية).

---

## 10. الوحدات التفصيلية

### 10.1 وحدة المشاريع (`projects`)

**المسار:** `packages/api/modules/projects/` + `apps/web/modules/saas/projects/`

**الوظائف:**
- CRUD كامل للمشاريع
- ربط بـ `CostStudy` (دراسة الكميات)
- قوالب مشاريع قابلة لإعادة الاستخدام
- `ProjectShell` يغلف كل صفحات المشروع

**الأقسام الفرعية:**
- **التنفيذ (Execution):** تقارير يومية + صور + مشاكل
- **الميدان (Field):** تقارير ميدانية + صور + مشاكل
- **المستندات (Documents):** تحميل وإدارة
- **أوامر التغيير (Changes):** طلبات تعديل + اعتماد
- **الجدول الزمني (Timeline):** معالم + Gantt
- **التحديثات (Updates):** تحديثات تقدم المشروع
- **رؤى (Insights):** تحليلات المشروع
- **الفريق (Team):** إدارة أعضاء المشروع

### 10.2 وحدة المالية (`finance`)

**المسار:** `packages/api/modules/finance/` + `apps/web/modules/saas/finance/`

أكبر وحدة في النظام — تشمل:

**العملاء (Clients):**
- CRUD + جهات اتصال متعددة لكل عميل
- تعيين جهة اتصال رئيسية

**عروض الأسعار (Quotations):**
- إنشاء + تعديل + بنود
- تحويل لفاتورة (`convertToInvoice`)
- حالات: DRAFT → SENT → ACCEPTED → REJECTED → EXPIRED

**الفواتير (Invoices):**
- إنشاء + بنود + دفعات جزئية
- تحويل لفاتورة ضريبية (`convertToTax`)
- ZATCA QR Code (Phase 1)
- حالات: DRAFT → SENT → PAID → PARTIALLY_PAID → OVERDUE → CANCELLED

**المصروفات (Expenses):**
- مصروفات يدوية + مصروفات من عقود الباطن
- دفع كامل/جزئي مع خصم من الرصيد
- ربط بمشاريع وحسابات بنكية
- `sourceType`: MANUAL | SUBCONTRACT | FACILITY

**المقبوضات (Payments):**
- سندات قبض مع إضافة للرصيد
- ربط بعملاء + فواتير + مشاريع

**التحويلات (Transfers):**
- بين حسابات المنظمة (atomic transaction)
- إلغاء مع عكس الأرصدة

**الحسابات البنكية (Banks):**
- BANK | CASH
- رصيد حي (يتحدث مع كل عملية)
- حساب افتراضي

**لوحة التحكم:**
- ملخص أرصدة
- مصروفات + مقبوضات الفترة
- التزامات معلقة

### 10.3 وحدة عقود الباطن (`subcontracts`)

**المسار:** `packages/api/modules/subcontracts/`

- عقود مع مقاولي الباطن
- بنود دفع مجدولة
- أوامر تغيير
- دفعات مع خصم من الحسابات البنكية
- تربط بين مالية المشروع ومالية المنظمة

### 10.4 وحدة دراسات الكميات (`quantities`)

**المسار:** `packages/api/modules/quantities/`

- دراسة تكلفة شاملة لمشاريع البناء
- 4 أقسام: إنشائي + تشطيبات + كهروميكانيك + عمالة
- تسعير مع نسب overhead + profit + contingency
- ⚠️ يستخدم `Float` بدلاً من `Decimal`

### 10.5 وحدة إدارة المنشأة (`company`) — جديدة

**المسار:** `packages/api/modules/company/` + `apps/web/modules/saas/company/`

- **الموظفين:** CRUD + تعيين على مشاريع + أنواع (دوام كامل/جزئي/مقاول)
- **الأصول:** CRUD + أنواع (معدات/مركبات/أثاث/تقنية)
- **مصروفات المنشأة:** منفصلة عن مصروفات المالية + توزيع على مشاريع
- **الرواتب:** مسيرات رواتب + عناصر تفصيلية

### 10.6 وحدة بوابة المالك (`project-owner`)

**المسار:** `packages/api/modules/project-owner/`

بوابة عامة (بدون تسجيل دخول) يصل إليها مالك المشروع عبر رابط:

```
/owner/[token]
  ├── / (ملخص المشروع)
  ├── /schedule (الجدول الزمني)
  ├── /payments (الدفعات)
  ├── /changes (التغييرات)
  └── /chat (المحادثات)
```

⚠️ **Token بلا expiry:** الرابط يعمل إلى الأبد ما لم يُحذف يدوياً.

### 10.7 وحدة المحادثات (`project-chat`)

- رسائل في الوقت الحقيقي داخل المشروع
- `ChatLastRead` لتتبع القراءة
- `MessageDeliveryLog` لتتبع التسليم

### 10.8 وحدة الذكاء الاصطناعي (`ai`)

- محادثات AI مخزنة في `AiChat`
- Chatbot في لوحة التحكم + داخل المشاريع

### 10.9 وحدات الدعم

| الوحدة | الوصف |
|--------|-------|
| `attachments` | رفع مرفقات عبر S3 pre-signed URLs |
| `notifications` | إشعارات + Push |
| `digests` | ملخصات بريدية دورية |
| `exports` | تصدير بيانات |
| `integrations` | إعدادات تكاملات خارجية |
| `shares` | روابط مشاركة عامة |

---

## 11. الواجهة وRTL وi18n

### اتجاه النص

- التطبيق RTL بالأساس (عربي)
- `dir="rtl"` يُطبق عبر Layout
- دعم LTR للإنجليزية والألمانية

### مكونات الواجهة

- **shadcn/ui** + **Radix** — المكتبة الأساسية
- **Tailwind CSS v4** — التنسيق
- **lucide-react** — الأيقونات
- **recharts** — الرسوم البيانية
- مكونات مخصصة في `apps/web/modules/ui/`

### الترجمة (i18n)

| اللغة | الملف | الأسطر |
|-------|-------|--------|
| العربية | `ar.json` | 4,067 |
| الإنجليزية | `en.json` | 4,232 |
| الألمانية | (في الإعدادات فقط) | — |

- المكتبة: `next-intl`
- Cookie: `NEXT_LOCALE`
- اللغة الافتراضية: `en` (في الإعدادات)
- العملة الافتراضية: `USD` (في الإعدادات) / `SAR` (في الكود)

### ⚠️ ملاحظات

| المشكلة | التفاصيل |
|---------|---------|
| عدم تطابق العملة | الإعدادات تقول `USD`، لكن `currency: "SAR"` في الكود المالي |
| اللغة الافتراضية | `defaultLocale: "en"` بينما التطبيق عربي بالأساس |
| الألمانية | موجودة في config لكن لا يوجد ملف `de.json` |
| MobileBottomNav | يظهر عند `z-50` — قد يتعارض مع modals |

---

## 12. المراجعة الأمنية

### 12.1 Security Headers

**الملف:** `apps/web/next.config.ts`

| Header | `/app/*` | `/auth/*` | `/owner/*` | `/share/*` | `/api/*` |
|--------|----------|-----------|------------|------------|----------|
| X-Content-Type-Options: nosniff | ✅ | ✅ | ✅ | ✅ | ✅ |
| Referrer-Policy: strict-origin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Permissions-Policy | ✅ | ✅ | ✅ | ✅ | ✅ |
| X-Frame-Options: DENY | ✅ | ✅ | ❌ | ✅ | — |
| CSP: frame-ancestors 'none' | ✅ | ❌ | ❌ | ❌ | — |
| Cache-Control: no-store | ✅ | ✅ | ✅ | ❌ (5min) | ✅ |

### 12.2 ما هو ناقص

| العنصر | الحالة | الخطورة |
|--------|--------|---------|
| `Content-Security-Policy` (كامل) | ❌ لا يوجد `script-src` أو `style-src` | P2 |
| `Strict-Transport-Security` (HSTS) | ❌ غير موجود | P2 |
| `X-XSS-Protection` | ❌ غير موجود (مُهمل لكن لا يضر) | P3 |
| CORS headers | — يُدار بواسطة Next.js | — |

### 12.3 تسريب `.env.local`

**الخطورة: P0**

الملف `.env.local` مُلتزم في Git ويحتوي:

| المتغير | المحتوى |
|---------|---------|
| `DATABASE_URL` | بيانات Supabase PostgreSQL كاملة |
| `DIRECT_URL` | بيانات اتصال مباشر |
| `RESEND_API_KEY` | مفتاح API حقيقي (`re_T7tePBXj_...`) |
| `BETTER_AUTH_SECRET` | سر المصادقة |

**الإجراء المطلوب فوراً:**
1. إضافة `.env.local` إلى `.gitignore`
2. إلغاء المفاتيح المسربة وإنشاء بدائل
3. تغيير كلمة مرور قاعدة البيانات
4. تنظيف تاريخ Git بـ `git filter-branch` أو `BFG Repo-Cleaner`

### 12.4 Rate Limiting

**الملف:** `packages/api/lib/rate-limit.ts`

```typescript
// In-memory store — لا يعمل مع multi-instance!
const rateLimitStore = new Map<string, ...>();
```

| النقطة | القيمة |
|--------|--------|
| READ | 60 طلب/دقيقة |
| WRITE | 20 طلب/دقيقة |
| TOKEN | 30 طلب/دقيقة |
| UPLOAD | 10 طلب/دقيقة |
| STRICT | 5 طلب/دقيقة |
| تنظيف | كل 5 دقائق، max 10,000 entries |

**المشكلة:** في بيئة multi-instance (Vercel Serverless)، كل instance لها store منفصل. المهاجم يمكنه تجاوز الحد بسهولة.

### 12.5 Owner Portal Token

```
/owner/[token]
```

- Token = `ProjectOwnerAccess.accessToken` (UUID)
- **لا يوجد expiry إلزامي** — الرابط يعمل للأبد
- **لا يوجد rate limiting على التحقق من Token**
- Token صالح = وصول كامل (ملخص + جدول + دفعات + محادثات)
- يمكن للمهاجم brute-force UUIDs (غير عملي لكن ممكن نظرياً)

### 12.6 Uploads

- S3 pre-signed URLs مع expiry 60 ثانية ✅
- لا يوجد تحقق من نوع الملف (MIME type) على الخادم ⚠️
- لا يوجد حد أقصى لحجم الملف في الكود (يعتمد على S3 config) ⚠️

### 12.7 CSRF

- BetterAuth يتعامل مع CSRF عبر `trustedOrigins` ✅
- ORPC يمر عبر نفس الـ session — مغطى ✅

### 12.8 SQL Injection

- Prisma يستخدم parameterized queries ✅
- لا يوجد raw SQL queries ✅
- `Record<string, unknown>` في بعض الاستعلامات — آمن لأن Prisma يتعامل معها

---

## 13. الأداء والتوسع

### 13.1 أنماط جيدة ✅

| النمط | المكان |
|-------|--------|
| `Promise.all()` للاستعلامات المتوازية | `getOrgFinanceDashboard()` — 6 استعلامات متوازية |
| Pagination مع `take`/`skip` | كل استعلامات القوائم |
| `select` لتحديد الحقول | معظم `include` تستخدم `select` |
| `groupBy` + `aggregate` | تقارير المصروفات |
| `$transaction` للعمليات الذرية | كل العمليات المالية |

### 13.2 مشاكل الأداء

| المشكلة | الموقع | الخطورة |
|---------|--------|---------|
| Rate limiter في الذاكرة | `packages/api/lib/rate-limit.ts` | **P1** |
| `session.freshAge: 0` | `packages/auth/auth.ts` | **P2** — كل طلب يستعلم من DB |
| لا database indexes صريحة | `schema.prisma` | **P2** — يعتمد على Prisma defaults |
| `getOrganizationBalancesSummary` يجلب كل الحسابات ثم يحسب | `org-finance.ts:112` | **P3** — يمكن استخدام `aggregate` |
| `optimizePackageImports` محدود | `next.config.ts` | **P3** — 5 حزم فقط |

### 13.3 قابلية التوسع

| البُعد | الحالة | ملاحظات |
|--------|--------|---------|
| Horizontal Scaling | ⚠️ | Rate limiter يمنع |
| Database Connection Pooling | ✅ | عبر Supabase |
| CDN / Edge Caching | ⚠️ | Share routes فقط (5 دقائق) |
| Background Jobs | ❌ | لا يوجد queue system |
| Real-time | ❌ | Polling only (لا WebSockets) |

---

## 14. الاختبارات والجودة

### 14.1 حالة الاختبارات

| النوع | العدد | التغطية |
|-------|-------|---------|
| Unit Tests | **0** | 0% |
| Integration Tests | **0** | 0% |
| E2E Tests | **0** (ملف Playwright فارغ) | 0% |
| Component Tests | **0** | 0% |

**هذا هو أكبر خطر تقني في المشروع.** لا يوجد أي ضمان آلي لصحة العمليات المالية أو الصلاحيات.

### 14.2 ما يحتاج اختبارات فوراً

| الأولوية | الوحدة | السبب |
|----------|--------|-------|
| **P0** | `getUserPermissions()` | ثغرة multi-tenancy |
| **P0** | Financial calculations | Float precision |
| **P0** | `createExpense` / `payExpense` / `cancelExpense` | عمليات مالية ذرية |
| **P1** | `createTransfer` | تحويلات بين حسابات |
| **P1** | Owner Portal token access | بوابة عامة |
| **P1** | RBAC permission matrix | كل الأدوار × كل الإجراءات |
| **P2** | Rate limiter | ضمان عمل الحدود |
| **P2** | Auth hooks | تسجيل الدخول + الدعوات |

### 14.3 أدوات الجودة الموجودة

| الأداة | الحالة |
|--------|--------|
| TypeScript | ✅ strict mode |
| Biome (lint + format) | ✅ |
| Prisma Zod generation | ✅ validation schemas |
| Git hooks | ❌ لا يوجد pre-commit |
| CI/CD Tests | ❌ لا يوجد |

---

## 15. كتالوج المشاكل

### P0 — حرجة (يجب إصلاحها فوراً)

| # | المشكلة | الموقع | التصنيف |
|---|---------|--------|---------|
| 1 | `.env.local` مسرب في Git مع بيانات حقيقية | `.env.local` | Security |
| 2 | `getUserPermissions` لا يتحقق من `organizationId` | `get-user-permissions.ts:21` | Multi-tenancy |

### P1 — عالية (يجب إصلاحها قبل الإطلاق)

| # | المشكلة | الموقع | التصنيف |
|---|---------|--------|---------|
| 3 | لا توجد اختبارات — صفر ملفات test | المشروع بالكامل | Testing |
| 4 | Rate limiting في الذاكرة فقط | `rate-limit.ts` | Security |
| 5 | Float للقيم المالية في CostStudy | `schema.prisma` (CostStudy + Items) | Data Integrity |
| 6 | نظام أدوار مزدوج (Member.role + Role) | `schema.prisma` + `auth.ts` | Architecture |
| 7 | Owner portal tokens بلا expiry | `ProjectOwnerAccess` model | Security |
| 8 | Middleware يتحقق من cookie فقط | `middleware.ts` | Security |
| 9 | `session.freshAge: 0` يسبب حمل DB | `auth.ts:56` | Performance |
| 10 | عدم التحقق من نوع/حجم الملف عند الرفع | `storage/provider/s3/` | Security |

### P2 — متوسطة (يجب إصلاحها بعد الإطلاق)

| # | المشكلة | الموقع | التصنيف |
|---|---------|--------|---------|
| 11 | Prisma + Drizzle ORM مزدوج | `packages/database/drizzle/` | DX |
| 12 | CSP ناقص (لا `script-src`) | `next.config.ts` | Security |
| 13 | HSTS غير موجود | `next.config.ts` | Security |
| 14 | ZATCA Phase 1 فقط — لا API integration | `packages/api/lib/zatca/` | Compliance |
| 15 | عدم تطابق العملة (USD في config، SAR في كود) | `config/index.ts` vs `org-finance.ts` | Config |
| 16 | اللغة الافتراضية `en` بينما التطبيق عربي | `config/index.ts` | Config |
| 17 | لا يوجد ZATCA integration فعلي | `zatca/` | Compliance |
| 18 | لا يوجد audit trail شامل للعمليات المالية | Database | Compliance |
| 19 | `account.accountLinking` يربط حسابات تلقائياً | `auth.ts:59` | Security |
| 20 | لا يوجد background job queue | Architecture | Scalability |
| 21 | الألمانية في config بلا ملف ترجمة | `config/index.ts` | Config |
| 22 | `organizationId` مباشرة على `User` (multi-org issue) | `schema.prisma` | Architecture |
| 23 | لا يوجد git pre-commit hooks | Project root | DX |
| 24 | لا يوجد CI/CD pipeline للاختبارات | Project root | DX |

### P3 — منخفضة (تحسينات)

| # | المشكلة | الموقع | التصنيف |
|---|---------|--------|---------|
| 25 | `getOrganizationBalancesSummary` يمكن تحسينه | `org-finance.ts:112` | Performance |
| 26 | `optimizePackageImports` يغطي 5 حزم فقط | `next.config.ts` | Performance |
| 27 | `MobileBottomNav` z-index قد يتعارض | Shared components | UI |
| 28 | `X-XSS-Protection` غير موجود | `next.config.ts` | Security |

---

## 16. خريطة الإصلاح — أعلى 20

مرتبة حسب **التأثير × سهولة التنفيذ**:

| # | الإصلاح | الخطورة | الجهد | التأثير |
|---|---------|---------|-------|---------|
| 1 | **إزالة `.env.local` من Git** + إلغاء المفاتيح المسربة | P0 | ساعة | أمان فوري |
| 2 | **إصلاح `getUserPermissions`** — إضافة فلتر `organizationId` على `Role` | P0 | 2 ساعة | إغلاق ثغرة multi-tenancy |
| 3 | **إضافة expiry لـ Owner Portal tokens** | P1 | 3 ساعات | أمان البوابة العامة |
| 4 | **كتابة اختبارات الصلاحيات** — Unit tests لـ permission matrix | P1 | يوم | ضمان RBAC |
| 5 | **كتابة اختبارات المالية** — Expense/Payment/Transfer flows | P1 | يومان | ضمان صحة الحسابات |
| 6 | **تحويل Float → Decimal** في CostStudy | P1 | يوم | دقة مالية |
| 7 | **Rate limiter مع Redis/Upstash** | P1 | 3 ساعات | أمان في production |
| 8 | **إضافة `freshAge`** للجلسات (مثل 300 ثانية) | P1 | 30 دقيقة | تقليل حمل DB |
| 9 | **التحقق من `isActive` في Middleware** | P1 | ساعة | منع دخول المحظورين |
| 10 | **إضافة التحقق من نوع/حجم الملفات** | P1 | 2 ساعة | أمان الرفع |
| 11 | **إزالة Drizzle** — تنظيف الكود | P2 | 3 ساعات | تبسيط DX |
| 12 | **توحيد نظام الأدوار** — إزالة `Member.role` legacy | P1 | يوم | تبسيط المعمارية |
| 13 | **إضافة CSP كامل** (`script-src`, `style-src`) | P2 | 3 ساعات | حماية XSS |
| 14 | **إضافة HSTS** | P2 | 15 دقيقة | حماية MITM |
| 15 | **إضافة audit trail** للعمليات المالية | P2 | يومان | Compliance |
| 16 | **توحيد العملة** (SAR كافتراضي) | P2 | ساعة | اتساق |
| 17 | **إضافة git pre-commit hooks** (Biome lint) | P2 | 30 دقيقة | جودة الكود |
| 18 | **إضافة CI pipeline** (GitHub Actions) | P2 | 3 ساعات | أتمتة |
| 19 | **إضافة database indexes** للحقول المفلترة | P2 | 2 ساعة | أداء |
| 20 | **ZATCA Phase 2** preparation | P2 | أسبوع+ | الامتثال |

---

## 17. خطة المراحل

### المرحلة 1: طوارئ أمنية (أسبوع 1)

**الهدف:** إغلاق الثغرات الحرجة

- [ ] إزالة `.env.local` من Git وتنظيف التاريخ
- [ ] إلغاء كل المفاتيح المسربة وإنشاء بدائل
- [ ] إصلاح `getUserPermissions` — فلترة بـ `organizationId`
- [ ] إضافة expiry لـ Owner Portal tokens (30 يوم افتراضي)
- [ ] التحقق من `isActive` في Middleware
- [ ] إضافة HSTS header

### المرحلة 2: اختبارات وسلامة البيانات (أسبوع 2-3)

**الهدف:** بناء شبكة أمان للكود

- [ ] إعداد بنية الاختبارات (Vitest + Playwright)
- [ ] كتابة unit tests لنظام الصلاحيات (RBAC matrix)
- [ ] كتابة unit tests للعمليات المالية (expense → pay → cancel)
- [ ] كتابة unit tests لحسابات CostStudy
- [ ] تحويل Float → Decimal في CostStudy والنماذج ذات الصلة
- [ ] إضافة git pre-commit hooks
- [ ] إضافة CI pipeline أساسي

### المرحلة 3: تحسينات الأمان والأداء (أسبوع 4-5)

**الهدف:** تحصين المنصة

- [ ] Rate limiter مع Redis/Upstash
- [ ] CSP كامل (`script-src`, `style-src`, `img-src`)
- [ ] التحقق من نوع/حجم الملفات عند الرفع
- [ ] تعديل `session.freshAge` إلى 300 ثانية
- [ ] إزالة Drizzle (تنظيف ORM المزدوج)
- [ ] توحيد نظام الأدوار (إزالة `Member.role` القديم)
- [ ] إضافة database indexes للحقول المستخدمة في الفلترة
- [ ] توحيد العملة الافتراضية

### المرحلة 4: Compliance والتكاملات (أسبوع 6-8)

**الهدف:** الامتثال + التوسع

- [ ] إضافة audit trail شامل للعمليات المالية
- [ ] ZATCA Phase 2 تحضير (E-invoicing API)
- [ ] إضافة background job queue (Bull/BullMQ)
- [ ] E2E tests لأهم السيناريوهات
- [ ] توثيق API (OpenAPI/Swagger)
- [ ] تعديل `organizationId` على User ليدعم multi-org
- [ ] إزالة اللغة الألمانية من الإعدادات أو إضافة ملف ترجمة

---

## 18. الملاحق

### الملحق أ — الملفات المقروءة في هذا التدقيق

| الملف | الأسطر | الملاحظات |
|-------|--------|---------|
| `packages/auth/auth.ts` | 387 | إعدادات BetterAuth الكاملة |
| `packages/database/prisma/schema.prisma` | 3,299 | 73 model + 57 enum |
| `packages/database/prisma/permissions.ts` | 443 | نظام RBAC كامل |
| `packages/database/prisma/queries/org-finance.ts` | 1,358 | استعلامات المالية |
| `packages/api/orpc/router.ts` | 84 | Router الرئيسي (32 module) |
| `packages/api/modules/finance/router.ts` | 252 | Finance sub-router |
| `packages/api/lib/permissions/get-user-permissions.ts` | 134 | جلب الصلاحيات |
| `packages/api/lib/permissions/verify-project-access.ts` | 216 | التحقق من الوصول |
| `packages/api/lib/rate-limit.ts` | 194 | Rate limiter (in-memory) |
| `packages/api/lib/zatca/` | ~150 | ZATCA QR + TLV |
| `packages/storage/provider/s3/index.ts` | 90 | S3 storage |
| `config/index.ts` | 174 | Feature flags |
| `apps/web/middleware.ts` | 81 | Next.js middleware |
| `apps/web/next.config.ts` | 187 | Security headers + config |
| `packages/i18n/translations/ar.json` | 4,067 | ترجمة عربية |
| `packages/i18n/translations/en.json` | 4,232 | ترجمة إنجليزية |

### الملحق ب — أوامر مهمة

```bash
# تشغيل التطبيق
pnpm dev

# قاعدة البيانات
cd packages/database
pnpm run push       # دفع التغييرات
pnpm run generate   # توليد العميل + Zod

# Linting
pnpm biome check .

# Build
pnpm build
```

### الملحق ج — Enum Reference

57 enum معرّفة في `schema.prisma`:

**Core:** `AccountType`, `RoleType`, `InvitationStatus`

**Projects:** `ProjectStatus`, `ProjectRole`, `ProjectType`, `IssueSeverity`, `IssueStatus`, `PhotoCategory`, `WeatherCondition`, `ExpenseCategory`, `ClaimStatus`, `DocumentFolder`, `ApprovalStatus`, `ApproverStatus`, `MilestoneStatus`, `AlertType`, `AlertSeverity`

**Finance:** `OrgExpenseCategory`, `FinanceAccountType`, `FinanceTransactionStatus`, `ExpenseSourceType`, `PaymentMethod`, `ClientType`, `QuotationStatus`, `FinanceInvoiceStatus`, `InvoiceType`, `OpenDocumentType`, `FinanceTemplateType`

**Subcontracts:** `SubcontractStatus`, `ContractorType`, `SubcontractCOStatus`, `ContractStatus`, `PaymentTermType`, `ChangeOrderStatus`, `ChangeOrderCategory`

**Company:** `CompanyExpenseCategory`, `RecurrenceType`, `AssetType`, `AssetCategory`, `AssetStatus`, `EmployeeType`, `SalaryType`, `EmployeeStatus`

**Communication:** `MessageChannel`, `NotificationType`, `NotificationChannel`, `DeliveryStatus`, `MessagingChannel`, `MessageDeliveryStatus`, `DigestFrequency`

**Other:** `AuditAction`, `AttachmentOwnerType`, `PurchaseType`, `ShareResourceType`, `TemplateItemType`

---

> **نهاية التقرير**
>
> هذا التقرير يعكس حالة الكود في تاريخ `2026-02-25`. يجب إعادة التدقيق بعد تنفيذ الإصلاحات في المرحلة 1 و2.
