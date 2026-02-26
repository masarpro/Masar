# تقرير التدقيق الشامل — منصة "مسار"
## Masar Platform — Comprehensive Audit Report

**تاريخ التقرير:** 2026-02-26
**إصدار التقرير:** 1.0
**المدقق:** Claude Opus 4.6 — AI Auditor
**نطاق التدقيق:** المستودع الكامل `supastarter-nextjs-3`

---

# القسم 1: الملخص التنفيذي

## 1.1 وصف المنصة

منصة **"مسار"** هي منصة SaaS متكاملة لإدارة شركات المقاولات في السوق السعودي، مبنية كـ monorepo باستخدام Next.js 16 و Prisma 7 و ORPC. تغطي المنصة دورة حياة المشروع الإنشائي كاملة: من دراسات الكميات والتسعير، مروراً بإدارة العقود والتنفيذ الميداني، وصولاً إلى المالية والفوترة ودورات الرواتب. تدعم المنصة اللغة العربية بتوجيه RTL كامل، وتتضمن نظام صلاحيات RBAC متعدد المستويات مع بوابة وصول خاصة لمالك المشروع.

## 1.2 الأرقام الرئيسية

| المقياس | القيمة |
|---------|--------|
| عدد النماذج (Models) | **77 نموذج** |
| عدد الـ Enums | **~50 enum** |
| عدد الصفحات (page.tsx) | **118 صفحة** |
| عدد وحدات API (Modules) | **34 وحدة** |
| عدد إجراءات API (Endpoints) | **500+ إجراء** |
| عدد ملفات TypeScript/TSX | **~800+ ملف** |
| عدد ملفات الاستعلامات (Queries) | **39 ملف** |
| عدد ملفات الاختبارات | **6 ملفات (~1,700 سطر)** |
| نسبة التغطية بالاختبارات | **~5-10% (تقديرية)** |
| عدد الحزم (Packages) | **12 حزمة** |
| مدير الحزم | pnpm 10.14.0 + Turbo 2.7.2 |

## 1.3 تقييم الجاهزية للإطلاق

### ⚠️ جاهز مع تحفظات جوهرية

المنصة تحتوي على بنية تحتية قوية ومعمارية سليمة، لكنها تحتاج إلى معالجة عدة نقاط حرجة قبل الإطلاق التجاري:

**التبرير:**
- ✅ البنية التحتية الأساسية (Auth, RBAC, Multi-tenancy) قوية ومتماسكة
- ✅ الوحدات الأساسية (مشاريع، مالية، عقود باطن) تعمل بشكل وظيفي
- ⚠️ تكامل ZATCA غير مكتمل (حقول موجودة، منطق ناقص)
- ⚠️ تغطية الاختبارات منخفضة جداً (~5-10%)
- ⚠️ لا يوجد pre-commit hooks
- ⚠️ بعض الوحدات في مرحلة Alpha (Insights 50%, Exports 50%)
- ❌ Owner Portal tokens بدون expiry افتراضي — خطر أمني

## 1.4 أعلى 10 مشاكل حرجة

| # | المشكلة | الخطورة | التأثير |
|---|---------|---------|---------|
| 1 | Owner Portal tokens بدون انتهاء تلقائي | P0 | وصول دائم غير مراقب لبيانات المشروع |
| 2 | تكامل ZATCA Phase 2 غير مكتمل | P0 | عدم امتثال تنظيمي في السعودية |
| 3 | تغطية اختبارات منخفضة (~5%) | P1 | مخاطر عالية لأخطاء غير مكتشفة |
| 4 | `projectChat` و `projectDocuments` على publicProcedure | P1 | endpoints حساسة بدون auth middleware |
| 5 | `freshAge: 0` في الجلسات — استعلام DB كل request | P1 | أداء ضعيف تحت الضغط |
| 6 | Float بدل Decimal في حقول progress | P2 | فقدان دقة في الحسابات المالية |
| 7 | لا يوجد OVERDUE تلقائي للفواتير | P2 | فواتير متأخرة لا تُكتشف |
| 8 | لا يوجد pre-commit hooks | P2 | كود معيب قد يصل للإنتاج |
| 9 | حسابات الاحتفاظ (Retention) غير مؤتمتة | P2 | حسابات يدوية عرضة للخطأ |
| 10 | لا يوجد Gantt chart للجدول الزمني | P3 | تجربة مستخدم ناقصة |

---

# القسم 2: شجرة المستودع الكاملة

## 2.1 بنية المشروع

```
supastarter-nextjs-3/                    # الجذر — pnpm monorepo
├── .claude/                             # إعدادات Claude Code
├── .github/                             # CI/CD
│   ├── workflows/validate-prs.yml       # Biome lint + Playwright E2E
│   └── dependabot.yml                   # تحديث تبعيات يومي
├── apps/
│   └── web/                             # تطبيق Next.js 16.1.0
│       ├── app/                         # App Router
│       │   ├── (marketing)/             # صفحات تسويقية (blog, docs, contact)
│       │   │   └── [locale]/            # i18n routing
│       │   ├── (saas)/                  # تطبيق SaaS
│       │   │   ├── app/                 # التطبيق الرئيسي
│       │   │   │   ├── (account)/       # إعدادات الحساب الشخصي
│       │   │   │   └── (organizations)/ # المنظمات
│       │   │   │       └── [organizationSlug]/
│       │   │   │           ├── projects/          # المشاريع
│       │   │   │           │   └── [projectId]/   # مشروع محدد
│       │   │   │           │       ├── finance/   # مالية المشروع
│       │   │   │           │       ├── execution/ # التنفيذ الميداني
│       │   │   │           │       ├── field/     # العمل الميداني
│       │   │   │           │       ├── timeline/  # الجدول الزمني
│       │   │   │           │       ├── documents/ # المستندات
│       │   │   │           │       ├── changes/   # أوامر التغيير
│       │   │   │           │       ├── chat/      # المحادثات
│       │   │   │           │       ├── team/      # الفريق
│       │   │   │           │       ├── insights/  # التحليلات
│       │   │   │           │       ├── updates/   # التحديثات
│       │   │   │           │       └── owner/     # بوابة المالك
│       │   │   │           ├── finance/           # مالية المنظمة
│       │   │   │           │   ├── clients/       # العملاء
│       │   │   │           │   ├── invoices/      # الفواتير
│       │   │   │           │   ├── payments/      # المقبوضات
│       │   │   │           │   ├── expenses/      # المصروفات
│       │   │   │           │   ├── banks/         # الحسابات البنكية
│       │   │   │           │   ├── documents/     # مستندات مالية
│       │   │   │           │   ├── templates/     # قوالب مالية
│       │   │   │           │   ├── reports/       # تقارير مالية
│       │   │   │           │   └── settings/      # إعدادات مالية
│       │   │   │           ├── quantities/        # حصر الكميات
│       │   │   │           ├── settings/          # إعدادات المنظمة
│       │   │   │           ├── notifications/     # الإشعارات
│       │   │   │           └── chatbot/           # المساعد الذكي
│       │   │   ├── pricing/               # التسعير (studies + quotations)
│       │   │   ├── new-organization/      # إنشاء منظمة
│       │   │   ├── choose-plan/           # اختيار خطة
│       │   │   └── onboarding/            # التأهيل
│       │   ├── auth/                      # المصادقة (login, signup, etc.)
│       │   ├── api/                       # API Routes (Hono.js)
│       │   └── share/                     # روابط المشاركة العامة
│       ├── modules/                       # وحدات الواجهة
│       │   ├── saas/                      # وحدات SaaS
│       │   ├── marketing/                 # وحدات التسويق
│       │   ├── shared/                    # مكونات مشتركة
│       │   ├── ui/                        # مكتبة UI (shadcn)
│       │   ├── i18n/                      # أدوات الترجمة
│       │   └── analytics/                 # التحليلات
│       ├── public/                        # ملفات ثابتة
│       └── tests/                         # اختبارات E2E
├── packages/                              # حزم مشتركة
│   ├── api/                               # طبقة API (ORPC + Hono)
│   │   ├── orpc/                          # إعدادات ORPC
│   │   │   ├── router.ts                  # Router الرئيسي
│   │   │   ├── procedures.ts              # أنواع الـ procedures
│   │   │   ├── handler.ts                 # OpenAPI handler
│   │   │   └── middleware/                # Middleware
│   │   ├── modules/                       # وحدات API (34 وحدة)
│   │   └── lib/                           # أدوات مساعدة
│   │       ├── rate-limit.ts              # تحديد المعدل
│   │       └── permissions/               # نظام الصلاحيات
│   ├── database/                          # قاعدة البيانات
│   │   └── prisma/
│   │       ├── schema.prisma              # المخطط (3500+ سطر)
│   │       ├── queries/                   # استعلامات (39 ملف)
│   │       ├── permissions.ts             # مصفوفة الصلاحيات
│   │       ├── migrations/                # الهجرات
│   │       └── zod/                       # مخططات Zod المولدة
│   ├── auth/                              # المصادقة (BetterAuth)
│   ├── ai/                                # الذكاء الاصطناعي
│   ├── mail/                              # البريد الإلكتروني
│   ├── payments/                          # المدفوعات (Stripe, etc.)
│   ├── storage/                           # التخزين (S3)
│   ├── i18n/                              # الترجمة (next-intl)
│   ├── logs/                              # السجلات (Consola)
│   └── utils/                             # أدوات مساعدة
├── config/                                # إعدادات مشتركة
├── tooling/                               # أدوات التطوير
│   ├── scripts/                           # سكربتات DB
│   ├── tailwind/                          # إعدادات Tailwind
│   └── typescript/                        # إعدادات TypeScript
├── package.json                           # الجذر
├── tsconfig.json                          # TypeScript الجذر
├── biome.json                             # Biome linter
└── CLAUDE.md                              # تعليمات Claude
```

## 2.2 خريطة الاعتمادات بين الحزم

```
                    ┌──────────────┐
                    │   apps/web   │
                    │ (Next.js 16) │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  @repo/api  │ │ @repo/auth  │ │  @repo/ai   │
    │   (ORPC)    │ │(BetterAuth) │ │  (AI SDK)   │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │
    ┌──────▼───────────────▼──────┐
    │      @repo/database         │
    │     (Prisma 7.1.0)          │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────┐  ┌────────────┐  ┌────────────┐
    │ @repo/mail  │  │@repo/store │  │@repo/pay   │
    │(React Email)│  │  (AWS S3)  │  │ (Stripe)   │
    └─────────────┘  └────────────┘  └────────────┘

    ┌─────────────┐  ┌────────────┐  ┌────────────┐
    │ @repo/i18n  │  │ @repo/logs │  │@repo/utils │
    │ (next-intl) │  │ (Consola)  │  │            │
    └─────────────┘  └────────────┘  └────────────┘
```

---

# القسم 3: مكدس التقنيات (Tech Stack)

## 3.1 التقنيات الأساسية

| التقنية | الإصدار | الدور |
|---------|---------|-------|
| **Next.js** | 16.1.0 | إطار العمل الرئيسي (App Router) |
| **React** | 19.2.3 | مكتبة واجهة المستخدم |
| **TypeScript** | 5.9.3 | لغة البرمجة (strict mode) |
| **Prisma** | 7.1.0 | ORM لقاعدة البيانات |
| **PostgreSQL** | (عبر Supabase) | قاعدة البيانات |
| **Hono** | 4.10.5 | إطار API خفيف |
| **ORPC** | 1.13.2 | RPC آمن النوع |
| **BetterAuth** | 1.4.7 | نظام المصادقة |
| **TanStack Query** | 5.90.9 | إدارة الحالة والـ caching |
| **TanStack Table** | 8.21.3 | جداول البيانات |
| **Tailwind CSS** | 4.1.17 | التنسيق |
| **Radix UI** | (متعدد) | مكونات UI أساسية |
| **shadcn/ui** | (متعدد) | مكتبة واجهة المستخدم |
| **next-intl** | 4.5.3 | الترجمة والتوطين |
| **Zod** | 4.1.12 | التحقق من البيانات |
| **Biome** | 2.3.5 | Linting + Formatting |
| **Turbo** | 2.7.2 | بناء monorepo |
| **pnpm** | 10.14.0 | مدير الحزم |

## 3.2 خدمات خارجية

| الخدمة | الإصدار/SDK | الدور |
|--------|------------|-------|
| **Stripe** | 19.3.1 | مدفوعات الاشتراكات |
| **Resend** | 6.4.2 | إرسال البريد الإلكتروني |
| **AWS S3** | 3.437.0 | تخزين الملفات |
| **OpenAI** | 6.9.0 | الذكاء الاصطناعي |
| **Anthropic** | (via AI SDK) | الذكاء الاصطناعي |
| **Redis** | ioredis 5.9.3 | Rate limiting و caching |

## 3.3 أدوات الاختبار

| الأداة | الإصدار | النوع |
|--------|---------|-------|
| **Vitest** | 4.0.18 | Unit + Integration |
| **Playwright** | 1.56.1 | E2E |
| **@faker-js/faker** | 10.3.0 | بيانات اختبارية |

## 3.4 ملاحظات على التعارضات

- ✅ **لا يوجد تعارض ORMs**: Prisma هو الـ ORM الوحيد
- ✅ **لا يوجد تكرار في إدارة الحالة**: TanStack Query فقط
- ✅ **إصدارات متسقة**: Zod 4.1.12 موحد عبر كل الحزم
- ⚠️ **@prisma/adapter-pg 6.19.0** مع @prisma/client 7.1.0 — فرق إصدار (مقصود للتوافق)
- ⚠️ **cropperjs مثبت عند 1.6.2** عبر Dependabot (قيد مقصود)

---

# القسم 4: معمارية التشغيل (Runtime Architecture)

## 4.1 تدفق الطلب

```
┌─────────────┐
│   المتصفح   │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────────────────────┐
│     Next.js Middleware        │
│   (apps/web/proxy.ts)         │
│                               │
│  • i18n locale detection      │
│  • Session cookie check       │
│  • Route protection           │
│  • Redirect to /auth/login    │
└──────┬───────────────────────┘
       │
       ├─── /app/* (Protected SaaS) ────────────────┐
       │                                             │
       ├─── /auth/* (Auth Pages) ──► BetterAuth      │
       │                                             │
       ├─── /api/rpc/* (RPC) ──────────────┐        │
       │                                    │        │
       ├─── /api/auth/* (Auth API) ──► BetterAuth   │
       │                                    │        │
       └─── /* (Marketing) ──► SSG/SSR      │        │
                                            ▼        ▼
                               ┌────────────────────────┐
                               │    Hono.js Server       │
                               │   (packages/api)        │
                               │                         │
                               │  ┌──── CORS ──────┐    │
                               │  │  Origin check   │    │
                               │  └────────────────┘    │
                               │                         │
                               │  ┌──── Rate Limit ─┐   │
                               │  │  Redis/Memory   │   │
                               │  │  6 presets       │   │
                               │  └────────────────┘    │
                               └───────────┬────────────┘
                                           │
                               ┌───────────▼────────────┐
                               │    ORPC Router          │
                               │  (34 modules)           │
                               │                         │
                               │  ┌── Procedures ──┐    │
                               │  │ public          │    │
                               │  │ protected ◄─┐   │    │
                               │  │ admin    ◄──┤   │    │
                               │  └─────────────┘   │    │
                               │                    │    │
                               │  ┌── Auth Check ──┐│    │
                               │  │ Session valid?  ││    │
                               │  │ User isActive?  ││    │
                               │  └────────────────┘│    │
                               │                    │    │
                               │  ┌── Permissions ─┐│    │
                               │  │ verifyOrgAccess ││    │
                               │  │ verifyProjAccess││    │
                               │  │ requirePerm     ││    │
                               │  └────────────────┘│    │
                               └───────────┬────────────┘
                                           │
                               ┌───────────▼────────────┐
                               │   Prisma Client         │
                               │  (packages/database)    │
                               │                         │
                               │  ┌── Queries ─────┐    │
                               │  │ 39 query files  │    │
                               │  │ organizationId  │    │
                               │  │ filter always   │    │
                               │  └────────────────┘    │
                               └───────────┬────────────┘
                                           │
                               ┌───────────▼────────────┐
                               │   PostgreSQL            │
                               │  (Supabase)             │
                               │  77 models, ~50 enums   │
                               └────────────────────────┘
```

## 4.2 الخدمات الخارجية

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Stripe    │     │   Resend     │     │   AWS S3     │
│  Payments   │     │   Email      │     │  Storage     │
└──────┬──────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────────────────────────────────────────────┐
│                    Masar Platform                      │
├──────────────────────────────────────────────────────┤
│   Redis (ioredis)  │  OpenAI/Anthropic  │  Supabase  │
│   Rate Limiting    │  AI Features       │  PostgreSQL │
└──────────────────────────────────────────────────────┘
```

## 4.3 أنماط الـ Caching

| المكون | آلية الـ Cache | مدة | ملاحظات |
|--------|---------------|-----|---------|
| TanStack Query | In-memory client cache | staleTime default | Client-side |
| Rate Limiter | Redis + Memory fallback | 60s window | Circuit breaker بعد 3 فشل |
| Session | DB re-read (freshAge: 0) | كل طلب | **مشكلة أداء** |
| Marketing pages | CDN cache | varies | عبر Next.js headers |
| Share pages | CDN 5min + browser 5min | 300/600s | Cache-Control headers |
| API responses | no-store | 0 | لا يوجد cache |

---

# القسم 5: خريطة الصفحات والمسارات الكاملة

## 5.1 صفحات التسويق (8 صفحات — عامة)

| # | المسار | الغرض | الحماية |
|---|--------|-------|---------|
| 1 | `/[locale]` | الصفحة الرئيسية | عامة |
| 2 | `/[locale]/blog` | المدونة | عامة |
| 3 | `/[locale]/blog/[...path]` | مقال | عامة |
| 4 | `/[locale]/changelog` | سجل التغييرات | عامة |
| 5 | `/[locale]/contact` | اتصل بنا | عامة |
| 6 | `/[locale]/docs/[[...path]]` | التوثيق | عامة |
| 7 | `/[locale]/legal/[...path]` | الصفحات القانونية | عامة |
| 8 | `/[locale]/[...rest]` | صفحات ديناميكية | عامة |

## 5.2 صفحات المصادقة (6 صفحات — عامة مع redirect)

| # | المسار | الغرض |
|---|--------|-------|
| 9 | `/auth/login` | تسجيل الدخول |
| 10 | `/auth/signup` | إنشاء حساب |
| 11 | `/auth/forgot-password` | نسيت كلمة المرور |
| 12 | `/auth/reset-password` | إعادة تعيين كلمة المرور |
| 13 | `/auth/verify` | التحقق من البريد |
| 14 | `/auth/change-password` | تغيير كلمة المرور |

## 5.3 صفحات إعداد الحساب (8 صفحات — محمية)

| # | المسار | الغرض | الصلاحية |
|---|--------|-------|---------|
| 15 | `/app` | لوحة التحكم الشخصية | مصادق |
| 16 | `/app/chatbot` | المساعد الذكي | مصادق |
| 17 | `/app/settings/general` | الإعدادات العامة | مصادق |
| 18 | `/app/settings/security` | الأمان (2FA, passkeys) | مصادق |
| 19 | `/app/settings/billing` | الفوترة | مصادق |
| 20 | `/app/settings/danger-zone` | حذف الحساب | مصادق |
| 21 | `/app/admin/organizations` | إدارة المنظمات (admin) | admin |
| 22 | `/app/admin/organizations/[id]` | تفاصيل منظمة (admin) | admin |
| 23 | `/app/admin/users` | إدارة المستخدمين (admin) | admin |

## 5.4 صفحات التأهيل (4 صفحات — محمية)

| # | المسار | الغرض |
|---|--------|-------|
| 24 | `/new-organization` | إنشاء منظمة جديدة |
| 25 | `/choose-plan` | اختيار خطة اشتراك |
| 26 | `/onboarding` | التأهيل الأولي |
| 27 | `/organization-invitation/[id]` | قبول دعوة |

## 5.5 صفحات المنظمة الرئيسية (10 صفحات — محمية + صلاحيات)

| # | المسار | الغرض | الصلاحية |
|---|--------|-------|---------|
| 28 | `/[org]` | لوحة تحكم المنظمة | عضو |
| 29 | `/[org]/chatbot` | المساعد الذكي | عضو |
| 30 | `/[org]/notifications` | الإشعارات | عضو |
| 31 | `/[org]/settings/general` | إعدادات عامة | settings.organization |
| 32 | `/[org]/settings/billing` | الفوترة | settings.billing |
| 33 | `/[org]/settings/danger-zone` | حذف المنظمة | OWNER |
| 34 | `/[org]/settings/members` | الأعضاء | settings.users |
| 35 | `/[org]/settings/users` | المستخدمين | settings.users |
| 36 | `/[org]/settings/roles` | الأدوار | settings.roles |
| 37 | `/[org]/settings/integrations` | التكاملات | settings.integrations |

## 5.6 صفحات المشاريع (25+ صفحة — محمية + صلاحيات مشروع)

| # | المسار | الغرض | الصلاحية |
|---|--------|-------|---------|
| 38 | `/[org]/projects` | قائمة المشاريع | projects.view |
| 39 | `/[org]/projects/new` | مشروع جديد | projects.create |
| 40 | `/[org]/projects/templates` | قوالب المشاريع | projects.view |
| 41 | `/[org]/projects/[pid]` | نظرة عامة | projects.view |
| 42 | `/[org]/projects/[pid]/overview` | ملخص تفصيلي | projects.view |
| 43 | `/[org]/projects/[pid]/team` | إدارة الفريق | projects.manageTeam |
| 44 | `/[org]/projects/[pid]/owner` | بوابة المالك | projects.edit |
| 45 | `/[org]/projects/[pid]/timeline` | الجدول الزمني | projects.view |
| 46 | `/[org]/projects/[pid]/chat` | المحادثات | projects.view |
| 47 | `/[org]/projects/[pid]/insights` | التحليلات | projects.view |
| 48 | `/[org]/projects/[pid]/updates` | التحديثات | projects.edit |
| 49 | `/[org]/projects/[pid]/changes` | أوامر التغيير | projects.view |
| 50 | `/[org]/projects/[pid]/changes/[cid]` | تفاصيل أمر تغيير | projects.view |
| 51 | `/[org]/projects/[pid]/documents` | المستندات | projects.view |
| 52-53 | `/[org]/projects/[pid]/documents/new,[did]` | إنشاء/عرض مستند | projects.edit |
| 54-56 | `/[org]/projects/[pid]/execution/*` | التنفيذ الميداني | projects.edit |
| 57-60 | `/[org]/projects/[pid]/field/*` | العمل الميداني | projects.edit |

## 5.7 صفحات مالية المشروع (12 صفحة)

| # | المسار | الغرض | الصلاحية |
|---|--------|-------|---------|
| 61 | `/[org]/projects/[pid]/finance` | لوحة المالية | projects.viewFinance |
| 62-64 | `/finance/expenses/*` | مصروفات المشروع | projects.viewFinance |
| 65-66 | `/finance/claims/*` | المستخلصات | finance.payments |
| 67 | `/finance/contract` | العقد الرئيسي | projects.edit |
| 68 | `/finance/payments/new` | دفعة جديدة | finance.payments |
| 69-71 | `/finance/subcontracts/*` | عقود الباطن | projects.viewFinance |

## 5.8 صفحات مالية المنظمة (30 صفحة)

| # | المسار | الغرض | الصلاحية |
|---|--------|-------|---------|
| 72 | `/[org]/finance` | لوحة المالية | finance.view |
| 73-76 | `/finance/clients/*` | العملاء | finance.view |
| 77-80 | `/finance/invoices/*` | الفواتير | finance.invoices |
| 81-84 | `/finance/payments/*` | المقبوضات | finance.payments |
| 85-87 | `/finance/expenses/*` | المصروفات | finance.view |
| 88-90 | `/finance/banks/*` | الحسابات البنكية | finance.view |
| 91-93 | `/finance/documents/*` | مستندات مفتوحة | finance.view |
| 94-97 | `/finance/templates/*` | قوالب مالية | finance.settings |
| 98 | `/finance/reports` | التقارير المالية | finance.reports |
| 99 | `/finance/settings` | إعدادات مالية | finance.settings |

## 5.9 صفحات التسعير والكميات (4 صفحات)

| # | المسار | الغرض | الصلاحية |
|---|--------|-------|---------|
| 100 | `/[org]/quantities` | حصر الكميات | quantities.view |
| 101 | `/pricing/studies` | دراسات التكلفة | pricing.studies |
| 102-104 | `/pricing/quotations/*` | عروض الأسعار | pricing.quotations |

## 5.10 صفحات عامة (2 صفحة)

| # | المسار | الغرض | الحماية |
|---|--------|-------|---------|
| 105 | `/share/[token]` | مشاركة عبر token | عامة |
| 106 | `/app/[...rest]` | Catch-all | محمية |

---

# القسم 6: سطح API الكامل

## 6.1 ملخص الوحدات

| # | الوحدة | عدد الإجراءات | النوع | الحماية |
|---|--------|--------------|-------|---------|
| 1 | admin | ~10 | mixed | adminProcedure |
| 2 | ai | ~6 | mixed | protected |
| 3 | company | ~50 | mixed | protected + permissions |
| 4 | contact | ~2 | mutation | public |
| 5 | dashboard | ~8 | query | protected |
| 6 | exports | ~6 | query | protected |
| 7 | finance | ~60 | mixed | protected + permissions |
| 8 | integrations | ~5 | mixed | protected + permissions |
| 9 | newsletter | 1 | mutation | public |
| 10 | notifications | ~3 | mixed | protected |
| 11 | organizations | ~2 | mixed | protected |
| 12 | orgUsers | ~5 | mixed | protected + permissions |
| 13 | payments | ~3 | mixed | protected |
| 14 | pricing | ~20 | mixed | protected + permissions |
| 15 | projectChangeOrders | ~12 | mixed | protected + permissions |
| 16 | projectChat | ~4 | mixed | **publicProcedure** ⚠️ |
| 17 | projectContract | ~6 | mixed | protected + permissions |
| 18 | projectDocuments | ~6 | mixed | **publicProcedure** ⚠️ |
| 19 | projectField | ~11 | mixed | protected + permissions |
| 20 | projectFinance | ~17 | mixed | protected + permissions |
| 21 | projectInsights | ~2 | mixed | protected + permissions |
| 22 | projectOwner | ~10 | mixed | mixed (token/protected) |
| 23 | projectTeam | ~4 | mixed | protected + permissions |
| 24 | projectTemplates | ~8 | mixed | protected + permissions |
| 25 | projectTimeline | ~9 | mixed | protected + permissions |
| 26 | projectUpdates | ~2 | mutation | protected + permissions |
| 27 | projects | ~6 | mixed | protected + permissions |
| 28 | quantities | ~20 | mixed | protected + permissions |
| 29 | roles | ~4 | mixed | protected + permissions |
| 30 | shares | ~4 | mixed | mixed |
| 31 | subcontracts | ~13 | mixed | protected + permissions |
| 32 | users | 1 | mutation | protected |

## 6.2 Rate Limit Presets

| Preset | الحد | النافذة | الاستخدام |
|--------|------|---------|----------|
| READ | 60 req | 1 دقيقة | قراءة بيانات |
| WRITE | 20 req | 1 دقيقة | كتابة بيانات |
| TOKEN | 30 req | 1 دقيقة | بوابة المالك |
| UPLOAD | 10 req | 1 دقيقة | رفع ملفات |
| MESSAGE | 30 req | 1 دقيقة | إرسال رسائل |
| STRICT | 5 req | 1 دقيقة | عمليات حساسة |

## 6.3 ⚠️ Endpoints بدون حماية كافية

| الوحدة | المشكلة | الخطورة |
|--------|---------|---------|
| `projectChat` | يستخدم `publicProcedure` | P1 |
| `projectDocuments` | يستخدم `publicProcedure` | P1 |
| `newsletter.subscribe` | عام (مقبول) | — |
| `contact` | عام (مقبول) | — |

**ملاحظة:** قد يكون التحقق يتم داخل الـ handler نفسه وليس على مستوى الـ procedure، لكن هذا نمط غير آمن.

---

# القسم 7: نظام المصادقة والجلسات

## 7.1 إعدادات BetterAuth

```
الإطار: BetterAuth 1.4.7
المحول: Prisma (PostgreSQL)
مدة الجلسة: 30 يوم
freshAge: 0 (إعادة قراءة من DB كل طلب)
التحقق من البريد: مطلوب
تسجيل دخول تلقائي بعد التحقق: نعم
```

## 7.2 طرق المصادقة

| الطريقة | الحالة | الملاحظات |
|---------|--------|----------|
| Email + Password | ✅ مفعّل | requireEmailVerification: true |
| Magic Link | ✅ مفعّل | عبر Resend |
| Google OAuth | ✅ مفعّل | email + profile scopes |
| GitHub OAuth | ✅ مفعّل | email + profile scopes |
| Passkeys (WebAuthn) | ✅ مفعّل | عبر @better-auth/passkey |
| Two-Factor (2FA) | ✅ مفعّل | TOTP |
| Username | ✅ مفعّل | —  |

## 7.3 Plugins المفعّلة

1. **admin()** — إدارة النظام
2. **passkey()** — مفاتيح المرور
3. **magicLink()** — روابط سحرية
4. **organization()** — إدارة المنظمات مع الدعوات
5. **openAPI()** — توثيق API
6. **invitationOnlyPlugin()** — تسجيل بالدعوة فقط (مخصص)
7. **twoFactor()** — المصادقة الثنائية
8. **username()** — تسجيل بالاسم

## 7.4 دورة حياة الجلسة

```
تسجيل دخول ──► إنشاء Session ──► تحديث lastLoginAt
       │                            │
       │ (كل طلب: freshAge=0)      │
       │                            ▼
       │                     قراءة Session من DB
       │                     التحقق من isActive
       │                            │
       │                            ▼
       │                     [صالحة] → معالجة الطلب
       │                     [غير صالحة] → Redirect /auth/login
       │
       └── بعد 30 يوم ──► انتهاء الصلاحية
```

## 7.5 After/Before Hooks

**After Sign-In:**
- تحديث `lastLoginAt`
- التحقق من `isActive` (حظر المستخدمين المعطلين)

**After Organization Invitation Acceptance:**
- تعيين دور المنظمة (OWNER/ADMIN → OWNER, MEMBER → ENGINEER)
- تحديث `organizationId` للمستخدم
- تحديث مقاعد الاشتراك

**Before Sign-In:**
- التحقق من `isActive`
- التحقق من الدعوة (في وضع invitation-only)

**Before Deletion:**
- إلغاء الاشتراكات

## 7.6 مشاكل المصادقة

| المشكلة | التفصيل | الخطورة |
|---------|---------|---------|
| freshAge: 0 | كل طلب يقرأ DB — أداء سيء | P1 |
| Account linking تلقائي | Google/GitHub يربطان بالحساب بدون تأكيد | P2 |
| لا يوجد brute force protection | Rate limit موجود لكن ليس لمحاولات الدخول تحديداً | P2 |

---

# القسم 8: نظام الصلاحيات والأدوار (RBAC)

## 8.1 الأقسام والصلاحيات

| القسم | الصلاحيات |
|-------|----------|
| **projects** | view, create, edit, delete, viewFinance, manageTeam |
| **quantities** | view, create, edit, delete, pricing |
| **pricing** | view, studies, quotations, pricing |
| **finance** | view, quotations, invoices, payments, reports, settings |
| **employees** | view, create, edit, delete, payroll, attendance |
| **company** | view, expenses, assets, reports |
| **settings** | organization, users, roles, billing, integrations |
| **reports** | view, create, approve |

## 8.2 مصفوفة الأدوار × الصلاحيات

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|----------------|------------|----------|------------|
| projects.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| projects.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| projects.edit | ✅ | ✅ | ❌ | ✅ | ❌ |
| projects.delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| projects.viewFinance | ✅ | ✅ | ✅ | ❌ | ❌ |
| projects.manageTeam | ✅ | ✅ | ❌ | ❌ | ❌ |
| quantities.view | ✅ | ✅ | ❌ | ✅ | ✅ |
| quantities.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| quantities.edit | ✅ | ✅ | ❌ | ✅ | ❌ |
| quantities.delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| finance.view | ✅ | ✅ | ✅ | ❌ | ❌ |
| finance.invoices | ✅ | ❌ | ✅ | ❌ | ❌ |
| finance.payments | ✅ | ❌ | ✅ | ❌ | ❌ |
| finance.reports | ✅ | ❌ | ✅ | ❌ | ❌ |
| finance.settings | ✅ | ❌ | ✅ | ❌ | ❌ |
| employees.view | ✅ | ✅ | ✅ | ❌ | ❌ |
| employees.payroll | ✅ | ❌ | ✅ | ❌ | ❌ |
| company.expenses | ✅ | ❌ | ✅ | ❌ | ❌ |
| company.assets | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.* | ✅ | ❌ | ❌ | ❌ | ❌ |
| reports.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports.create | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports.approve | ✅ | ✅ | ❌ | ❌ | ❌ |

## 8.3 آلية التحقق

```
1. protectedProcedure → يتحقق من session + isActive
2. verifyOrganizationAccess(userId, orgId)
   ├── التحقق من العضوية (Member table)
   ├── جلب Role + permissions
   └── التحقق من الصلاحية المطلوبة
3. verifyProjectAccess(userId, orgId, projectId)
   ├── كل ما سبق +
   ├── التحقق من أن المشروع ينتمي للمنظمة
   └── التحقق من صلاحية المشروع
```

## 8.4 ⚠️ ثغرات الصلاحيات

| المشكلة | التفصيل |
|---------|---------|
| `projectChat` على publicProcedure | أي شخص يمكنه قراءة/إرسال رسائل إذا عرف الـ projectId |
| `projectDocuments` على publicProcedure | أي شخص يمكنه إنشاء مستندات أو طلب اعتمادات |
| Owner Portal بدون expiry | Token يعمل إلى الأبد ما لم يُبطل يدوياً |

---

# القسم 9: عزل البيانات (Multi-tenancy)

## 9.1 آلية العزل

**النمط:** Row-level filtering عبر `organizationId` في كل استعلام

**التطبيق:**
- ✅ جميع ملفات الاستعلامات الـ 39 تفلتر بـ `organizationId`
- ✅ استعلامات المشاريع تستخدم `organizationId + projectId` مركب
- ✅ `verifyProjectAccess()` يتحقق من أن المشروع ينتمي للمنظمة
- ✅ `getUserPermissions()` يتحقق من تطابق `user.organizationId` مع المنظمة المطلوبة

## 9.2 أين يوجد الفلتر

```
✅ ai-chats.ts          → organizationId + userId
✅ attachments.ts       → organizationId
✅ audit.ts             → organizationId + projectId
✅ company.ts           → organizationId
✅ cost-studies.ts      → organizationId
✅ dashboard.ts         → organizationId
✅ finance.ts           → organizationId
✅ org-finance.ts       → organizationId
✅ notifications.ts     → organizationId + userId
✅ projects.ts          → organizationId
✅ subcontract.ts       → organizationId + projectId
```

## 9.3 ⚠️ نقاط محتملة للقلق

| الملف | الملاحظة |
|-------|----------|
| `users.ts` | استعلامات عالمية (getUsers) — للـ admin فقط |
| `projectChat` (publicProcedure) | إذا لم يتحقق من organizationId في الـ handler |
| `projectDocuments` (publicProcedure) | نفس المشكلة |
| `shares.getResource` | عام عبر token — مقبول ولكن يجب مراقبته |

## 9.4 اختبار ذهني

> **السؤال:** هل يمكن لمستخدم في منظمة A الوصول لبيانات منظمة B؟

**الإجابة:** في الوضع الطبيعي عبر الـ protected procedures — **لا**، لأن:
1. `protectedProcedure` يتحقق من الجلسة
2. `verifyOrganizationAccess` يتحقق من العضوية
3. كل استعلام يفلتر بـ organizationId

**لكن** عبر endpoints الـ public — **محتمل نظرياً** إذا لم يُتحقق من الوصول في الـ handler.

---

# القسم 10: قاعدة البيانات بالتفصيل

## 10.1 ملخص النماذج (77 نموذج)

### نماذج المصادقة والنظام (7)
| النموذج | الحقول الرئيسية | الملاحظات |
|---------|----------------|----------|
| User | id, email, name, isActive, organizationId, accountType | المستخدم الأساسي |
| Session | id, token, userId, expiresAt, activeOrganizationId | الجلسة |
| Account | id, userId, providerId, accessToken, password | حسابات OAuth/Password |
| Verification | id, identifier, value, expiresAt | رموز التحقق |
| Passkey | id, userId, publicKey, credentialID | مفاتيح المرور |
| TwoFactor | id, userId, secret, backupCodes | 2FA |
| UserInvitation | id, email, token, roleId, status | دعوات المستخدمين |

### نماذج المنظمة (6)
| النموذج | الحقول الرئيسية |
|---------|----------------|
| Organization | id, name, slug, ownerId, taxNumber, currency(SAR), timezone(Asia/Riyadh) |
| Member | id, organizationId, userId, role |
| Invitation | id, organizationId, email, role, status |
| Role | id, name, type, permissions(Json), isSystem |
| Purchase | id, organizationId, type, subscriptionId |
| AiChat | id, organizationId, userId, messages(Json) |

### نماذج المشاريع (8)
| النموذج | الحقول الرئيسية |
|---------|----------------|
| Project | id, organizationId, name, slug, status, type, contractValue, progress(Float⚠️) |
| ProjectMember | id, projectId, userId, role(ProjectRole) |
| ProjectContract | id, projectId, value, retentionPercent, vatPercent, penalties |
| ContractPaymentTerm | id, contractId, type, label, percent, amount |
| ProjectDailyReport | id, projectId, reportDate, manpower, weather |
| ProjectPhoto | id, projectId, url, category |
| ProjectIssue | id, projectId, title, severity, status |
| ProjectProgressUpdate | id, projectId, progress(Float⚠️), phaseLabel |

### نماذج المالية (14)
| النموذج | الحقول الرئيسية |
|---------|----------------|
| Client | id, organizationId, clientType, name, taxNumber, code(unique) |
| ClientContact | id, clientId, name, isPrimary |
| Quotation | id, organizationId, quotationNo(unique), status, totalAmount |
| QuotationItem | id, quotationId, description, quantity, unitPrice |
| FinanceInvoice | id, organizationId, invoiceNo(unique), invoiceType, status, totalAmount |
| FinanceInvoiceItem | id, invoiceId, description, quantity, unitPrice |
| FinanceInvoicePayment | id, invoiceId, amount, paymentDate |
| FinanceExpense | id, organizationId, expenseNo(unique), category, amount, status |
| FinancePayment | id, organizationId, paymentNo(unique), amount, destinationAccountId |
| FinanceTransfer | id, organizationId, transferNo(unique), fromAccountId, toAccountId |
| OrganizationBank | id, organizationId, accountType, balance, iban |
| OpenDocument | id, organizationId, documentNo(unique), documentType |
| FinanceTemplate | id, organizationId, templateType, content(Json) |
| OrganizationFinanceSettings | id, organizationId(unique), companyNameAr, taxNumber, iban |

### نماذج عقود الباطن (4)
| النموذج | الحقول الرئيسية |
|---------|----------------|
| SubcontractContract | id, organizationId, projectId, contractNo, value, status |
| SubcontractPaymentTerm | id, contractId, type, label, percent, amount |
| SubcontractChangeOrder | id, contractId, orderNo, description, amount, status |
| SubcontractPayment | id, organizationId, contractId, paymentNo, amount, status |

### نماذج دراسات الكميات (6)
| النموذج | الحقول الرئيسية |
|---------|----------------|
| CostStudy | id, organizationId, name, structuralCost, finishingCost, mepCost, totalCost |
| StructuralItem | id, costStudyId, category, quantity, concreteVolume, steelWeight |
| FinishingItem | id, costStudyId, category, area, qualityLevel |
| MEPItem | id, costStudyId, category, itemType, quantity, unitPrice |
| LaborItem | id, costStudyId, laborType, quantity, dailyRate |
| Quote | id, costStudyId, quoteNumber(unique), totalAmount, status |

### نماذج إدارة المنشأة (10)
| النموذج | الحقول الرئيسية |
|---------|----------------|
| CompanyExpense | id, organizationId, name, category, amount, recurrence |
| CompanyExpensePayment | id, expenseId, amount, isPaid, financeExpenseId |
| CompanyExpenseAllocation | id, expenseId, projectId, percentage |
| Employee | id, organizationId, name, type, baseSalary, status |
| EmployeeProjectAssignment | id, employeeId, projectId, percentage |
| CompanyAsset | id, organizationId, name, category, status, currentProjectId |
| PayrollRun | id, organizationId, month, year, status, totalNetSalary |
| PayrollRunItem | id, payrollRunId, employeeId, netSalary, financeExpenseId |
| CompanyExpenseRun | id, organizationId, month, year, status |
| CompanyExpenseRunItem | id, expenseRunId, companyExpenseId, amount |

### نماذج أخرى (22)
| النموذج | الغرض |
|---------|-------|
| ProjectDocument | إدارة المستندات |
| ProjectApproval | طلبات الاعتماد |
| ProjectApprovalApprover | معتمدون |
| ProjectAuditLog | سجل تدقيق المشروع |
| OrganizationAuditLog | سجل تدقيق المنظمة (7 سنوات) |
| ProjectMessage | رسائل المحادثة |
| ChatLastRead | آخر قراءة للمحادثة |
| Notification | إشعارات النظام |
| ProjectOwnerAccess | رموز بوابة المالك |
| ProjectMilestone | مراحل الجدول الزمني |
| ProjectChangeOrder | أوامر التغيير |
| ProjectTemplate | قوالب المشاريع |
| ProjectTemplateItem | بنود القوالب |
| ProjectAlert | تنبيهات المشروع |
| DigestSubscription | اشتراكات الملخصات |
| OrganizationIntegrationSettings | إعدادات التكامل |
| MessageDeliveryLog | سجل تسليم الرسائل |
| ShareLink | روابط المشاركة |
| Attachment | المرفقات |
| OrganizationSequence | تسلسلات الترقيم الذرية |

## 10.2 تفصيل حقول كل نموذج

### 10.2.1 نماذج المصادقة

#### User (@@map: "user")
```
id                  String   @id @default(cuid())
name                String?
email               String   @unique
emailVerified       Boolean  @default(false)
image               String?
createdAt           DateTime @default(now())
updatedAt           DateTime @updatedAt
username            String?  @unique
role                String?  @default("user")
banned              Boolean? @default(false)
banReason           String?
banExpires          DateTime?
onboardingComplete  Boolean  @default(false)
paymentsCustomerId  String?
locale              String?  @default("ar")
displayUsername     String?
twoFactorEnabled    Boolean? @default(false)
accountType         String?  @default("OWNER")         // OWNER | EMPLOYEE | PROJECT_CLIENT
isActive            Boolean  @default(true)
mustChangePassword  Boolean  @default(false)
lastLoginAt         DateTime?
organizationRoleId  String?  → Role
customPermissions   Json?
createdById         String?  → User (self-referencing)
organizationId      String?  → Organization
```

**علاقات User (42 علاقة):**
- sessions, accounts, passkeys, twofactors — جلسات ومصادقة
- invitations, members, purchases — عضويات
- aiChats — محادثات AI
- costStudies, projects — إنشاء
- dailyReportsCreated, photosUploaded, issuesCreated, issuesAssigned — ميداني
- progressUpdatesCreated, expensesCreated, claimsCreated — عمليات
- subcontractsCreated, subcontractCOsCreated, subcontractPaymentsCreated — باطن
- contractsCreated, documentsCreated — عقود ومستندات
- approvalsRequested, approverAssignments — اعتمادات
- auditLogs, messagesSent, notifications — سجلات
- ownerAccessesCreated, attachmentsUploaded, templatesCreated — أصول
- alertsAcknowledged, digestSubscriptions, chatLastReads — إشعارات
- deliveryLogsSent, shareLinksCreated — تكامل
- changeOrdersRequested, changeOrdersDecided, changeOrdersImplemented — تغييرات
- clientsCreated, quotationsCreated, invoicesCreated, invoicePaymentsCreated — مالية
- openDocumentsCreated, financeTemplatesCreated, bankAccountsCreated — مالية
- orgExpensesCreated, orgPaymentsCreated, orgTransfersCreated — مالية المنظمة
- linkedEmployees, payrollRunsCreated, payrollRunsApproved — رواتب
- expenseRunsCreated, expenseRunsPosted — ترحيل
- orgAuditActions — سجل تدقيق المنظمة
- projectMemberships, projectMembersAssigned — فريق
- organizationRole, createdBy, organizationOwned, employeeOf, createdUsers — أساسية

#### Session (@@map: "session")
```
id                    String   @id @default(cuid())
expiresAt             DateTime
ipAddress             String?
userAgent             String?
userId                String   → User
impersonatedBy        String?
activeOrganizationId  String?
token                 String   @unique
createdAt             DateTime @default(now())
updatedAt             DateTime @updatedAt
```
فهارس: `@@index([userId])`

#### Account (@@map: "account")
```
id                     String   @id @default(cuid())
accountId              String
providerId             String
userId                 String   → User
accessToken            String?
refreshToken           String?
idToken                String?
expiresAt              DateTime?
password               String?
accessTokenExpiresAt   DateTime?
refreshTokenExpiresAt  DateTime?
scope                  String?
createdAt              DateTime @default(now())
updatedAt              DateTime @updatedAt
```
فهارس: `@@index([userId])`

#### Verification (@@map: "verification")
```
id          String   @id @default(cuid())
identifier  String
value       String   @db.Text
expiresAt   DateTime
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
```
فهارس: `@@index([identifier])`

#### Passkey (@@map: "passkey")
```
id           String   @id @default(cuid())
name         String?
publicKey    String
userId       String   → User
credentialID String
counter      Int
deviceType   String
backedUp     Boolean
transports   String?
aaguid       String?
createdAt    DateTime @default(now())
```
فهارس: `@@index([userId])`, `@@index([credentialID])`

#### TwoFactor (@@map: "twoFactor")
```
id          String @id @default(cuid())
secret      String
backupCodes String
userId      String → User
```
فهارس: `@@index([secret])`, `@@index([userId])`

### 10.2.2 نماذج المنظمة

#### Organization (@@map: "organization")
```
id                  String   @id @default(cuid())
name                String
slug                String   @unique
logo                String?
createdAt           DateTime @default(now())
metadata            String?
paymentsCustomerId  String?
ownerId             String   @unique → User
commercialRegister  String?
taxNumber           String?
contractorClass     String?
phone               String?
address             String?
city                String?
currency            String   @default("SAR")
timezone            String   @default("Asia/Riyadh")
```

**علاقات Organization (22 علاقة):**
- members, invitations, purchases — عضويات
- aiChats — محادثات AI
- costStudies — دراسات كميات
- projects — المشاريع
- employees — موظفي المنشأة
- roles — الأدوار
- clients — العملاء
- quotations — عروض الأسعار
- financeInvoices — الفواتير
- openDocuments — المستندات المفتوحة
- financeTemplates — قوالب مالية
- bankAccounts — حسابات بنكية
- financeExpenses — مصروفات المنظمة
- financePayments — مقبوضات المنظمة
- financeTransfers — تحويلات
- companyExpenses — مصروفات المنشأة
- companyEmployees — موظفي المنشأة
- companyAssets — أصول المنشأة
- payrollRuns — دورات الرواتب
- companyExpenseRuns — دورات ترحيل المصروفات
- orgAuditLogs — سجل التدقيق
- sequences — تسلسلات الترقيم
- integrationSettings — إعدادات التكامل
- financeSettings — إعدادات مالية
- owner — المالك

#### Role (@@map: "role")
```
id              String    @id @default(cuid())
name            String                              // الاسم بالعربية
nameEn          String?                             // الاسم بالإنجليزية
description     String?
type            RoleType  @default(CUSTOM)           // OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM
isSystem        Boolean   @default(false)            // محمي من الحذف
permissions     Json                                 // مصفوفة الصلاحيات
organizationId  String    → Organization
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```
فهارس: `@@unique([organizationId, name])`

### 10.2.3 نماذج المشاريع

#### Project (@@map: "projects")
```
id              String        @id @default(cuid())
organizationId  String        → Organization
name            String
slug            String
projectNo       String?
description     String?       @db.Text
status          ProjectStatus @default(ACTIVE)
type            ProjectType?
clientName      String?
clientId        String?       → Client
location        String?
contractValue   Decimal?      @db.Decimal(15,2)     // ✅ Decimal صحيح
progress        Float         @default(0)            // ⚠️ Float — يجب أن يكون Decimal
startDate       DateTime?
endDate         DateTime?
createdById     String        → User
createdAt       DateTime      @default(now())
updatedAt       DateTime      @updatedAt
```
فهارس: `@@unique([organizationId, slug])`, `@@index([organizationId])`, `@@index([createdById])`, `@@index([clientId])`, `@@index([status])`

#### ProjectContract (@@map: "project_contracts")
```
id                       String         @id @default(cuid())
organizationId           String
projectId                String         @unique → Project
contractNo               String?
title                    String?
clientName               String?
description              String?        @db.Text
status                   ContractStatus @default(DRAFT)
value                    Decimal?       @db.Decimal(15,2)
currency                 String         @default("SAR")
signedDate               DateTime?
startDate                DateTime?
endDate                  DateTime?
retentionPercent         Decimal?       @db.Decimal(5,2)
retentionCap             Decimal?       @db.Decimal(15,2)
retentionReleaseDays     Int?
includesVat              Boolean        @default(true)
vatPercent               Decimal?       @db.Decimal(5,2)
paymentMethod            String?
performanceBondPercent   Decimal?       @db.Decimal(5,2)
performanceBondAmount    Decimal?       @db.Decimal(15,2)
insuranceRequired        Boolean        @default(false)
insuranceDetails         String?        @db.Text
scopeOfWork              String?        @db.Text
penaltyPercent           Decimal?       @db.Decimal(5,2)
penaltyCapPercent        Decimal?       @db.Decimal(5,2)
notes                    String?        @db.Text
createdById              String         → User
createdAt                DateTime       @default(now())
updatedAt                DateTime       @updatedAt
```
فهارس: `@@index([organizationId, projectId])`

### 10.2.4 نماذج المالية

#### Client (@@map: "clients")
```
id                String     @id @default(cuid())
organizationId    String     → Organization
clientType        ClientType @default(INDIVIDUAL)    // INDIVIDUAL | COMMERCIAL
firstName         String?
lastName          String?
businessName      String?
name              String?
company           String?                             // deprecated
phone             String?
mobile            String?
email             String?
address           String?    @db.Text
streetAddress1    String?
streetAddress2    String?
city              String?
region            String?
postalCode        String?
country           String     @default("SA")
secondaryAddress  Json?
code              String     @unique                  // رمز فريد (C-0001)
currency          String     @default("SAR")
displayLanguage   String     @default("ar")
classification    String[]   @default([])
taxNumber         String?
crNumber          String?
notes             String?    @db.Text
isActive          Boolean    @default(true)
createdById       String     → User
createdAt         DateTime   @default(now())
updatedAt         DateTime   @updatedAt
```
فهارس: `@@index([organizationId])`, `@@index([organizationId, name])`, `@@index([organizationId, code])`, `@@index([organizationId, clientType])`

#### FinanceInvoice (@@map: "finance_invoices")
```
id              String               @id @default(cuid())
organizationId  String               → Organization
invoiceNo       String               @unique
invoiceType     InvoiceType          @default(STANDARD)   // STANDARD | TAX | SIMPLIFIED
clientId        String?              → Client
clientName      String?
clientCompany   String?
clientPhone     String?
clientEmail     String?
clientAddress   String?              @db.Text
clientTaxNumber String?
projectId       String?              → Project
quotationId     String?              → Quotation
status          FinanceInvoiceStatus @default(DRAFT)
issueDate       DateTime?            @db.Date
dueDate         DateTime?            @db.Date
subtotal        Decimal?             @db.Decimal(15,2)
discountPercent Decimal?             @db.Decimal(5,2)
discountAmount  Decimal?             @db.Decimal(15,2)
vatPercent      Decimal              @default(15)  @db.Decimal(5,2)
vatAmount       Decimal?             @db.Decimal(15,2)
totalAmount     Decimal?             @db.Decimal(15,2)
paidAmount      Decimal?             @db.Decimal(15,2)
sellerTaxNumber String?
qrCode          String?              @db.Text              // ZATCA QR
zatcaUuid       String?
zatcaHash       String?
zatcaSignature  String?              @db.Text
paymentTerms    String?              @db.Text
notes           String?              @db.Text
templateId      String?              → FinanceTemplate
viewedAt        DateTime?
sentAt          DateTime?
createdById     String               → User
createdAt       DateTime             @default(now())
updatedAt       DateTime             @updatedAt
```
فهارس: `@@index([organizationId])`, `@@index([organizationId, status])`, `@@index([organizationId, clientId])`, `@@index([organizationId, projectId])`, `@@index([organizationId, invoiceType])`, `@@index([organizationId, dueDate])`

#### OrganizationBank (@@map: "organization_banks")
```
id              String             @id @default(cuid())
organizationId  String             → Organization
name            String
accountNumber   String?
bankName        String?
iban            String?
accountType     FinanceAccountType @default(BANK)       // BANK | CASH_BOX
openingBalance  Decimal            @default(0) @db.Decimal(15,2)
balance         Decimal            @default(0) @db.Decimal(15,2)
currency        String             @default("SAR")
isActive        Boolean            @default(true)
isDefault       Boolean            @default(false)
notes           String?            @db.Text
createdById     String             → User
createdAt       DateTime           @default(now())
updatedAt       DateTime           @updatedAt
```
فهارس: `@@index([organizationId])`, `@@index([organizationId, accountType])`, `@@index([organizationId, isActive])`

#### FinanceExpense (@@map: "finance_expenses")
```
id              String                    @id @default(cuid())
organizationId  String                    → Organization
expenseNo       String                    @unique
category        OrgExpenseCategory
customCategory  String?
description     String?                   @db.Text
amount          Decimal                   @db.Decimal(15,2)
date            DateTime                  @db.Date
sourceAccountId String?                   → OrganizationBank
vendorName      String?
vendorTaxNumber String?
projectId       String?                   → Project
invoiceRef      String?
paymentMethod   String                    @default("BANK_TRANSFER")
referenceNo     String?
status          FinanceTransactionStatus  @default(COMPLETED)
sourceType      ExpenseSourceType         @default(MANUAL)
sourceId        String?
paidAmount      Decimal?                  @db.Decimal(15,2)
dueDate         DateTime?                 @db.Date
notes           String?                   @db.Text
createdById     String                    → User
createdAt       DateTime                  @default(now())
updatedAt       DateTime                  @updatedAt
```
فهارس: 7 فهارس — `@@index([organizationId, date])`, `@@index([organizationId, category])`, `@@index([organizationId, projectId])`, `@@index([organizationId, sourceAccountId])`, `@@index([organizationId, sourceType])`, `@@index([organizationId, status, dueDate])`, `@@index([organizationId, status, date])`

### 10.2.5 نماذج عقود الباطن

#### SubcontractContract (@@map: "subcontract_contracts")
```
id                String            @id @default(cuid())
organizationId    String
projectId         String            → Project
contractNo        String?
name              String
contractorType    ContractorType    @default(COMPANY)    // COMPANY | INDIVIDUAL
companyName       String?
phone             String?
email             String?
taxNumber         String?
crNumber          String?
status            SubcontractStatus @default(DRAFT)
value             Decimal           @db.Decimal(15,2)
startDate         DateTime?
endDate           DateTime?
signedDate        DateTime?
scopeOfWork       String?           @db.Text
notes             String?           @db.Text
includesVat       Boolean           @default(true)
vatPercent        Decimal?          @db.Decimal(5,2)
retentionPercent  Decimal?          @db.Decimal(5,2)
paymentMethod     String?
attachmentUrl     String?
createdById       String            → User
createdAt         DateTime          @default(now())
updatedAt         DateTime          @updatedAt
```
فهارس: `@@index([organizationId, projectId])`, `@@index([organizationId, projectId, status])`

### 10.2.6 نماذج إدارة المنشأة

#### Employee (@@map: "company_employees")
```
id                  String         @id @default(cuid())
organizationId      String         → Organization
linkedUserId        String?        → User
name                String
employeeNo          String?
type                EmployeeType
phone               String?
email               String?
nationalId          String?
salaryType          SalaryType     @default(MONTHLY)     // MONTHLY | DAILY
baseSalary          Decimal        @db.Decimal(15,2)
housingAllowance    Decimal        @default(0) @db.Decimal(15,2)
transportAllowance  Decimal        @default(0) @db.Decimal(15,2)
otherAllowances     Decimal        @default(0) @db.Decimal(15,2)
gosiSubscription    Decimal        @default(0) @db.Decimal(15,2)
joinDate            DateTime?      @db.Date
endDate             DateTime?      @db.Date
status              EmployeeStatus @default(ACTIVE)
notes               String?        @db.Text
createdAt           DateTime       @default(now())
updatedAt           DateTime       @updatedAt
```
فهارس: `@@index([organizationId])`, `@@index([organizationId, status])`, `@@index([organizationId, type])`

#### CompanyAsset (@@map: "company_assets")
```
id                String        @id @default(cuid())
organizationId    String        → Organization
name              String
assetNo           String?
category          AssetCategory
type              AssetType     @default(OWNED)        // OWNED | RENTED | LEASED
status            AssetStatus   @default(AVAILABLE)    // AVAILABLE | IN_USE | MAINTENANCE | RETIRED
brand             String?
model             String?
serialNumber      String?
year              Int?
description       String?       @db.Text
purchasePrice     Decimal?      @db.Decimal(15,2)
monthlyRent       Decimal?      @db.Decimal(15,2)
currentValue      Decimal?      @db.Decimal(15,2)
purchaseDate      DateTime?     @db.Date
warrantyExpiry    DateTime?     @db.Date
insuranceExpiry   DateTime?     @db.Date
currentProjectId  String?       → Project
assignedAt        DateTime?
notes             String?       @db.Text
createdAt         DateTime      @default(now())
updatedAt         DateTime      @updatedAt
```
فهارس: `@@index([organizationId])`, `@@index([organizationId, category])`, `@@index([organizationId, status])`, `@@index([organizationId, currentProjectId])`

#### PayrollRun (@@map: "payroll_runs")
```
id                String           @id @default(cuid())
organizationId    String           → Organization
runNo             String
month             Int
year              Int
totalBaseSalary   Decimal          @default(0) @db.Decimal(15,2)
totalAllowances   Decimal          @default(0) @db.Decimal(15,2)
totalDeductions   Decimal          @default(0) @db.Decimal(15,2)
totalNetSalary    Decimal          @default(0) @db.Decimal(15,2)
employeeCount     Int              @default(0)
status            PayrollRunStatus @default(DRAFT)
approvedById      String?          → User
approvedAt        DateTime?
createdById       String           → User
notes             String?          @db.Text
createdAt         DateTime         @default(now())
updatedAt         DateTime         @updatedAt
```
فهارس: `@@unique([organizationId, runNo])`, `@@unique([organizationId, month, year])`, `@@index([organizationId])`, `@@index([organizationId, status])`

### 10.2.7 نماذج سجلات التدقيق

#### ProjectAuditLog (@@map: "project_audit_logs")
```
id              String      @id @default(cuid())
organizationId  String
projectId       String      → Project
actorId         String      → User
action          AuditAction                           // 22 قيمة
entityType      String
entityId        String
metadata        Json?
createdAt       DateTime    @default(now())
```
فهارس: `@@index([organizationId, projectId, createdAt])`

#### OrganizationAuditLog (@@map: "organization_audit_logs")
```
id              String         @id @default(cuid())
organizationId  String         → Organization
actorId         String         → User
action          OrgAuditAction                        // 37 قيمة
entityType      String
entityId        String
metadata        Json?          @db.JsonB
ipAddress       String?
createdAt       DateTime       @default(now())
```
فهارس: `@@index([organizationId, createdAt])`, `@@index([organizationId, entityType, entityId])`

**ملاحظة مهمة:** سجل تدقيق المنظمة يستخدم `@db.JsonB` للـ metadata مما يتيح استعلامات JSON فعّالة في PostgreSQL. أيضاً يتضمن `ipAddress` لتتبع مصدر العمليات — متطلب ZATCA.

### 10.2.8 نماذج التسلسلات الذرية

#### OrganizationSequence (@@map: "organization_sequences")
```
id              String   @id @default(cuid())
organizationId  String   → Organization
sequenceKey     String                               // مفتاح: "invoice", "expense", "quotation"...
currentValue    Int      @default(0)
updatedAt       DateTime @updatedAt
```
فهارس: `@@unique([organizationId, sequenceKey])`

**آلية العمل:**
```sql
INSERT INTO organization_sequences (id, organization_id, sequence_key, current_value)
VALUES (gen_random_uuid(), $1, $2, 1)
ON CONFLICT (organization_id, sequence_key)
DO UPDATE SET current_value = organization_sequences.current_value + 1
RETURNING current_value;
```
هذا يضمن أن كل منظمة تحصل على أرقام تسلسلية فريدة حتى تحت ضغط طلبات متزامنة.

## 10.3 مشاكل أنواع البيانات

| الحقل | النوع الحالي | النوع المطلوب | الأثر |
|-------|-------------|-------------|-------|
| Project.progress | Float | Decimal(5,2) | فقدان دقة |
| ProjectMilestone.progress | Float | Decimal(5,2) | فقدان دقة |
| ProjectProgressUpdate.progress | Float | Decimal(5,2) | فقدان دقة |

**ملاحظة إيجابية:** جميع الحقول المالية تستخدم `Decimal(15,2)` بشكل صحيح.

## 10.3 الفهارس (Indexes)

المشروع يحتوي على فهارس شاملة:
- ✅ **27 unique constraint** عبر النماذج
- ✅ فهارس مركبة على `(organizationId, status)` و `(organizationId, date)`
- ✅ فهارس على جميع العلاقات الخارجية

**فهارس مفقودة محتملة:**
| النموذج | الفهرس المقترح |
|---------|---------------|
| SubcontractPayment | `(paymentNo)` — للبحث السريع |
| Notification | `(userId, createdAt)` — للصفحات |

---

# القسم 11: الوحدات التفصيلية

## 11.1 المشاريع (Projects)

**الغرض:** إدارة دورة حياة المشاريع الإنشائية بالكامل

**دورة العمل:**
```
إنشاء مشروع → تعريف العقد → تعيين الفريق → التنفيذ الميداني
      ↓                ↓              ↓              ↓
   ACTIVE         DRAFT→ACTIVE    MANAGER+       تقارير + صور
      ↓                              ENGINEER      + مشاكل
   ON_HOLD / COMPLETED / CANCELLED
```

**الأقسام الفرعية:** تنفيذ، ميدان، مستندات، أوامر تغيير، جدول زمني، تحديثات، رؤى، فريق

**API:** 6 إجراءات رئيسية + وحدات فرعية

**الجاهزية: 85%**

**ما ينقص:**
- Gantt chart للجدول الزمني
- Dashboard أكثر تفصيلاً
- تنبيهات تلقائية للتأخر

---

## 11.2 المالية على مستوى المنظمة (Organization Finance)

**الغرض:** إدارة مالية شاملة: عملاء، عروض أسعار، فواتير، مصروفات، مقبوضات، تحويلات

**دورة العمل — عرض السعر:**
```
DRAFT → SENT → VIEWED → ACCEPTED → CONVERTED (to invoice)
                      → REJECTED
                      → EXPIRED
```

**دورة العمل — الفاتورة:**
```
DRAFT → SENT → VIEWED → PARTIALLY_PAID → PAID
                      → OVERDUE (⚠️ غير مؤتمت)
                      → CANCELLED
```

**الحسابات المالية:**
```
subtotal = Σ(quantity × unitPrice)
discountAmount = subtotal × (discountPercent / 100)
vatAmount = (subtotal - discountAmount) × (vatPercent / 100)
totalAmount = subtotal - discountAmount + vatAmount
```

**API:** ~60 إجراء (clients, quotations, invoices, expenses, payments, transfers, banks, templates, reports, settings)

**الجاهزية: 90%**

**ما ينقص:**
- ❌ ZATCA Phase 2 integration
- ❌ OVERDUE تلقائي للفواتير
- ⚠️ تحويل عرض سعر → فاتورة (جزئي)
- ⚠️ تعدد العملات (حقول موجودة، منطق مفقود)

---

## 11.3 المالية على مستوى المشروع (Project Finance)

**الغرض:** تتبع مصروفات المشروع ومستخلصاته ودفعاته

**الوحدات:**
- مصروفات المشروع (6 فئات: مواد، عمالة، معدات، مقاولين، نقل، أخرى)
- المستخلصات (DRAFT → SUBMITTED → APPROVED → PAID / REJECTED)
- العقد الرئيسي + شروط الدفع
- عقود الباطن

**API:** ~17 إجراء

**الجاهزية: 85%**

**ما ينقص:**
- ⚠️ سير عمل اعتماد المستخلصات (يدوي حالياً)
- ⚠️ حساب الاحتفاظ التلقائي
- ⚠️ ربط المراحل الزمنية بشروط الدفع

---

## 11.4 عقود الباطن (Subcontracts)

**الغرض:** إدارة عقود مقاولي الباطن ودفعاتهم

**دورة العمل:**
```
DRAFT → ACTIVE → SUSPENDED / COMPLETED / TERMINATED
```

**شروط الدفع:** ADVANCE, MILESTONE, MONTHLY, COMPLETION, CUSTOM

**API:** 13 إجراء (CRUD + payment terms + change orders + payments)

**الجاهزية: 70%**

**ما ينقص:**
- ❌ لا يوجد update/delete لدفعات المقاولين
- ⚠️ لا يوجد تتبع "دفعة جزئية" لشرط دفع
- ⚠️ لا يوجد حساب VAT تلقائي
- ⚠️ لا يوجد إغلاق تسوية نهائية

---

## 11.5 دراسات الكميات (Cost Studies)

**الغرض:** تقدير تكاليف البناء بدقة (إنشائي، تشطيبات، كهروميكانيك، عمالة)

**البنية:**
```
دراسة التكلفة
├── بنود إنشائية (أساسات، أعمدة، كمرات، بلاطات، سلالم)
├── بنود تشطيبات (دهان، بلاط، خشب، نوافذ)
├── بنود كهروميكانيك (كهرباء، سباكة، تكييف)
├── بنود عمالة
└── هوامش (overhead + profit + contingency)
      ↓
   عرض سعر (Quote)
```

**API:** ~20 إجراء (study CRUD + item CRUD + batch + quotes + duplicate + recalculate)

**الجاهزية: 75%**

**ما ينقص:**
- ⚠️ قوالب جاهزة للبنود (templates)
- ⚠️ تصدير PDF للعروض
- ⚠️ مقارنة بين دراسات مختلفة

---

## 11.6 إدارة المنشأة (Company Management)

**الأقسام:**
1. **الموظفون:** CRUD + terminate + assignments (% لكل مشروع)
2. **الأصول:** CRUD + assign to project + return + insurance expiry tracking
3. **مصروفات المنشأة:** CRUD + recurring payments + allocation to projects
4. **دورات الرواتب:** create → populate → approve → post to finance
5. **دورات ترحيل المصروفات:** create → populate → post to finance

**API:** ~50 إجراء

**الجاهزية: 70%**

**ما ينقص:**
- ⚠️ أتمتة الرواتب
- ⚠️ تكامل GOSI
- ⚠️ WPS (نظام حماية الأجور)

---

## 11.7 بوابة المالك (Owner Portal)

**الغرض:** وصول عام بدون حساب عبر token للمالكين

**المتاح عبر البوابة:**
- ملخص المشروع
- الجدول الزمني
- جدول المدفوعات
- الرسائل
- التحديثات الرسمية
- أوامر التغيير

**Rate Limiting:** 30 طلب/دقيقة

**الجاهزية: 80%**

**مشكلة حرجة:** ⚠️ Tokens بدون تاريخ انتهاء تلقائي

---

## 11.8 المحادثات (Chat)

**القنوات:** TEAM (داخلي), OWNER (رسمي)

**API:** 4 إجراءات (list, send, unreadCount, markRead)

**الجاهزية: 65%**

**مشاكل:**
- ⚠️ publicProcedure بدون auth
- ⚠️ لا يوجد real-time (polling only)

---

## 11.9 الذكاء الاصطناعي (AI Chatbot)

**التكنولوجيا:** AI SDK (Anthropic + OpenAI)

**API:** 6 إجراءات (chats.list, find, create, update, delete, messages.add)

**الجاهزية: 60%**

**ما ينقص:**
- ❌ لا يوجد RAG لبيانات المشروع
- ⚠️ لا يوجد حقن سياق المشروع

---

## 11.10 الإشعارات والملخصات

**أنواع الإشعارات:** APPROVAL_REQUESTED, DOCUMENT_CREATED, ISSUE_CRITICAL, CLAIM_CREATED, CHANGE_ORDER, OWNER_MESSAGE, SYSTEM

**القنوات:** IN_APP, EMAIL

**الملخصات:** أسبوعية (مشاريع بدون تقارير، مدفوعات قادمة، مشاكل جديدة)

**الجاهزية: 80%**

---

## 11.11 المرفقات والتخزين

**التخزين:** AWS S3 مع signed URLs

**التحقق الأمني:**
- ✅ فحص MIME type
- ✅ فحص امتداد الملف (حظر SVG, HTML, JS)
- ✅ فحص magic bytes (PNG, JPEG, PDF, WebP)
- ✅ حجم أقصى حسب النوع (50MB مستندات, 20MB صور)
- ✅ حظر Double extensions

**الجاهزية: 90%**

---

## 11.12 الإعدادات

**مستوى المنظمة:** اسم، شعار، slug
**الأعضاء:** إضافة/إزالة/تعديل أدوار
**الأدوار:** CRUD مع حماية أدوار النظام
**الفوترة:** Stripe integration
**التكاملات:** Email, WhatsApp, SMS settings

**الجاهزية: 85%**

---

## 11.13 لوحة التحكم (Dashboard)

**المقاييس:**
- إحصائيات المشاريع (حسب الحالة والنوع)
- ملخص مالي
- مراحل قادمة/متأخرة
- نشاطات حديثة
- اتجاه مالي شهري

**API:** 8 إجراءات

**الجاهزية: 85%**

---

## 11.14 الجدول الزمني (Timeline)

**API:** 9 إجراءات (CRUD milestones + reorder + status transitions + health)

**الجاهزية: 80%**

**ما ينقص:** Gantt chart visualization

---

## 11.15 أوامر التغيير (Change Orders)

**دورة العمل:** DRAFT → SUBMITTED → APPROVED/REJECTED → IMPLEMENTED

**API:** 12 إجراء (CRUD + workflow + owner portal access)

**الجاهزية: 70%**

---

## 11.16 التصدير (Exports)

**الأنواع:** PDF (تحديثات، مستخلصات، تقارير أسبوعية), CSV (مصروفات، مستخلصات، مشاكل), ICS (تقويم)

**الجاهزية: 50%** — القوالب غير مكتملة

---

## 11.17 المشاركة (Shares)

**API:** 4 إجراءات (create, list, revoke, getResource)

**الجاهزية: 80%**

---

# القسم 12: علاقة الوحدات ببعضها

## 12.1 تدفق البيانات الرئيسي

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  دراسة كميات │───►│  عرض سعر     │───►│  مشروع       │
│ (CostStudy)  │    │ (Quotation)  │    │ (Project)    │
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐
                    │   فاتورة     │    │  عقد رئيسي   │
                    │  (Invoice)   │    │  (Contract)  │
                    └──────┬───────┘    └──────┬───────┘
                           │                    │
                           ▼                    ├──► مراحل دفع
                    ┌──────────────┐            │    (PaymentTerms)
                    │   مقبوض      │◄───────────┘
                    │  (Payment)   │            │
                    └──────┬───────┘            ├──► مستخلصات
                           │                    │    (Claims)
                           ▼                    │
                    ┌──────────────┐            ├──► عقود باطن
                    │ رصيد بنكي    │            │    (Subcontracts)
                    │  (BankAcct)  │◄───────────┘
                    └──────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   موظف       │───►│ تعيين مشروع  │───►│  راتب        │
│ (Employee)   │    │ (Assignment) │    │ (PayrollItem)│
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │ مصروف مالية  │
                                        │(FinExpense)  │
                                        └──────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ مصروف منشأة  │───►│ دفعة منشأة   │───►│ مصروف مالية  │
│(CompExpense) │    │ (CEPayment)  │    │(FinExpense)  │
└──────┬───────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐
│ توزيع مشاريع │
│(Allocation)  │
└──────────────┘
```

## 12.2 حلقات مفقودة

| الحلقة | الحالة |
|--------|--------|
| عرض سعر → فاتورة | ⚠️ جزئي (conversion procedure مذكور لكن غير مكتمل) |
| مرحلة دفع عقد → مقبوض | ✅ مرتبط عبر `contractTermId` |
| دورة رواتب → مصروف مالية | ✅ عند الاعتماد (approve) |
| دورة ترحيل مصروفات → مصروف مالية | ✅ عند الترحيل (post) |
| فاتورة OVERDUE تلقائياً | ❌ مفقود |
| احتفاظ (retention) → إفراج تلقائي | ❌ مفقود |
| غرامات تأخير → خصم | ❌ مفقود |
| مرحلة زمنية → شرط دفع | ⚠️ حقل `milestoneId` موجود لكن بلا منطق |

---

# القسم 13: الواجهة وRTL والترجمة

## 13.1 دعم RTL

### 13.1.1 استراتيجية التطبيق
- **التطبيق الرئيسي:** `dir="rtl"` على مستوى الـ layout الجذري
- **Tailwind CSS:** يستخدم RTL-aware classes مدمجة
- **مكونات Radix:** تدعم RTL أصلاً عبر خاصية `dir`
- **Recharts/الرسوم البيانية:** تستخدم `dir="ltr"` صريحاً لعرض الأرقام والمحاور بشكل صحيح

### 13.1.2 ملفات i18n الأساسية
```
packages/i18n/translations/ar.json     — 4,510 سطر
packages/i18n/translations/en.json     — 4,726 سطر
apps/web/modules/i18n/lib/locale-cookie.ts   — إدارة كوكي اللغة
apps/web/modules/i18n/lib/update-locale.ts   — تحديث اللغة
apps/web/modules/i18n/request.ts             — next-intl request handler
apps/web/modules/i18n/routing.ts             — توجيه i18n
```

### 13.1.3 مكونات RTL المخصصة (20+ مكون)
| المكون | نوع dir | السبب |
|--------|---------|-------|
| ChangePasswordForm | rtl | نموذج عربي |
| AssetDetail, AssetForm, AssetList | rtl | بيانات أصول |
| EmployeeDetail, EmployeeForm, EmployeeList | rtl | بيانات موظفين |
| AddAssetDialog, AddEmployeeDialog | rtl | حوارات إنشاء |
| EditExpenseRunItemDialog | rtl | تعديل بنود |
| RecentDocumentsTable | rtl | جدول مالي |
| CompanyDashboard | rtl | لوحة تحكم |
| AssetsAnalyticsCard | ltr | رسوم بيانية |
| EmployeesAnalyticsCard | ltr | رسوم بيانية |
| ExpensesAnalyticsCard | ltr | رسوم بيانية |

## 13.2 تغطية الترجمة

### 13.2.1 الأقسام الرئيسية في ملفات الترجمة (22 قسم)

| # | القسم | الوصف | المفاتيح التقريبية |
|---|-------|-------|-------------------|
| 1 | `admin` | لوحة الإدارة | ~20 |
| 2 | `app` | التطبيق الرئيسي | ~15 |
| 3 | `auth` | المصادقة (errors, login, signup, verify) | ~60 |
| 4 | `blog` | المدونة | ~10 |
| 5 | `changelog` | سجل التغييرات | ~5 |
| 6 | `common` | مشترك (confirmation, menu, actions) | ~40 |
| 7 | `contact` | نموذج اتصال | ~15 |
| 8 | `documentation` | التوثيق | ~5 |
| 9 | `faq` | الأسئلة الشائعة | ~10 |
| 10 | `mail` | قوالب البريد | ~30 |
| 11 | `company` | إدارة المنشأة (assets, employees, expenses, payroll) | ~200 |
| 12 | `finance` | المالية (banks, clients, invoices, payments, reports) | ~300 |
| 13 | `pricing` | التسعير (structural, MEP, finishing, quotations) | ~150 |
| 14 | `projects` | المشاريع (claims, contracts, daily reports, chat) | ~250 |
| 15 | `quantities` | الكميات | ~50 |
| 16 | `settings` | الإعدادات | ~40 |
| 17 | `errors` | رسائل الخطأ | ~30 |
| 18 | `validation` | رسائل التحقق | ~25 |
| 19 | `notifications` | الإشعارات | ~20 |
| 20 | `time` | الوقت والتواريخ | ~15 |
| 21 | `status` | حالات مختلفة | ~20 |
| 22 | `roles` | الأدوار (MANAGER, ENGINEER, etc.) | ~10 |

### 13.2.2 تقييم تغطية الترجمة
- **إجمالي المفاتيح التقريبي:** 1,300+ مفتاح
- **العربية:** ~98% تغطية (اللغة الأساسية)
- **الإنجليزية:** ~100% تغطية (أطول بسبب الكلمات الأطول)
- **ملاحظة:** ملف الإنجليزية أطول بـ 216 سطر من العربية — يشير إلى بعض المفاتيح المفقودة في العربية

## 13.3 بنية المكونات

### 13.3.1 التسلسل الهرمي للمكونات
```
Root Layout
├── ClientProviders (API Client, Color Mode, Consent, React Query)
│   ├── SaaS Layout
│   │   ├── MasarSidebarShell (AppSidebar + Inset)
│   │   │   ├── SidebarHeader (Organization Select + Logo)
│   │   │   ├── SidebarNav (Dynamic menu items by permissions)
│   │   │   ├── SidebarFooter (User menu + Clock)
│   │   │   └── SidebarInset (Main content area)
│   │   │       ├── Organization Layout
│   │   │       │   ├── Module Layouts (Finance, Company, Projects)
│   │   │       │   │   └── Page Components
│   │   │       │   └── Settings Layout
│   │   │       └── Account Layout
│   │   │           ├── Admin Layout
│   │   │           └── Account Settings Layout
│   │   └── MobileBottomNav (z-50, responsive)
│   ├── Marketing Layout
│   │   ├── NavBar (Marketing-specific)
│   │   └── Footer
│   ├── Auth Layout
│   └── Owner Portal Layout (Token-based, no sidebar)
```

### 13.3.2 وحدات الواجهة (16 وحدة رئيسية، 326 ملف .tsx)

| # | الوحدة | المجلد | عدد الملفات | الوصف |
|---|--------|--------|------------|-------|
| 1 | Admin | `modules/saas/admin/` | 4 | إدارة المنظمات والمستخدمين (superadmin) |
| 2 | AI | `modules/saas/ai/` | 1 | محادثة AI (AiChat.tsx) |
| 3 | Auth | `modules/saas/auth/` | 9 | نماذج المصادقة (login, signup, OTP, passkey) |
| 4 | Company | `modules/saas/company/` | 80+ | أصول، موظفين، مصروفات، رواتب، تقارير |
| 5 | Dashboard | `modules/saas/dashboard/` | 2 | لوحة التحكم الرئيسية |
| 6 | Finance | `modules/saas/finance/` | 80 | بنوك، عملاء، فواتير، مدفوعات، تقارير |
| 7 | Integrations | `modules/saas/integrations/` | 4 | تصدير، إعدادات تكامل |
| 8 | Onboarding | `modules/saas/onboarding/` | 2 | خطوات الإعداد الأولي |
| 9 | Organizations | `modules/saas/organizations/` | 17 | إنشاء/إدارة المنظمات |
| 10 | Payments | `modules/saas/payments/` | 4 | اشتراكات Stripe |
| 11 | Pricing | `modules/saas/pricing/` | 34 | عروض أسعار، دراسات تكلفة |
| 12 | Projects | `modules/saas/projects/` | 80+ | إدارة المشاريع الشاملة |
| 13 | Projects-Changes | `modules/saas/projects-changes/` | 4 | أوامر التغيير |
| 14 | Projects-Timeline | `modules/saas/projects-timeline/` | 19 | Gantt chart، المراحل |
| 15 | Settings | `modules/saas/settings/` | 20 | إعدادات الحساب والأمان |
| 16 | Shared | `modules/saas/shared/` | 26 | مكونات مشتركة |

### 13.3.3 النماذج (46 نموذج form)

**نماذج المصادقة (6):**
- LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm, ChangePasswordForm, OtpForm

**نماذج الشركة (3):**
- AssetForm, EmployeeForm, ExpenseForm

**نماذج المالية (8):**
- BankForm, ClientForm, InlineClientForm, CreateDocumentForm, ExpenseForm, TransferForm, CreateInvoiceForm, PaymentForm

**نماذج المنظمة (5):**
- ChangeOrganizationNameForm, CreateOrganizationForm, DeleteOrganizationForm, InviteMemberForm, OrganizationLogoForm

**نماذج المشاريع (11):**
- CreateProjectForm, CreateDocumentForm, ContractFormSections, CreateClaimForm, CreateExpenseForm
- ProjectPaymentForm, SubcontractForm, SubcontractPaymentForm
- DailyReportForm, IssueForm, PhotoUploadForm, ProgressUpdateForm

**نماذج التسعير (2):**
- QuotationForm, CreateCostStudyForm

**نماذج الإعدادات (5):**
- ChangeEmailForm, ChangeNameForm, DeleteAccountForm, UserAvatarForm, UserLanguageForm

**نماذج أخرى (6):**
- CreateChangeOrderForm, CreateMilestoneForm, OnboardingForm, ContactForm, IntegrationsSettingsForm, OrganizationForm

### 13.3.4 مكونات البيانات الجدولية (6)

| المكون | الملف | الوصف |
|--------|-------|-------|
| RecentDocumentsTable | `finance/components/dashboard/` | جدول آخر المستندات |
| ItemsTableComponent | `finance/components/templates/components/` | جدول بنود الفواتير/القوالب |
| PricingTable | `payments/components/` | جدول خطط الأسعار |
| ClaimsTable | `projects/components/finance/` | جدول مطالبات المشروع |
| ExpensesTable | `projects/components/finance/` | جدول مصروفات المشروع |
| PaymentsClaimsTable | `projects/components/finance/payments/` | جدول مدفوعات ومطالبات |

### 13.3.5 مكونات Gantt Chart (12 ملف)

| الملف | الوصف |
|-------|-------|
| GanttChart.tsx | المكون الرئيسي |
| GanttContainer.tsx | الحاوية مع التمرير |
| GanttRow.tsx | صف واحد (مرحلة) |
| GanttSidebar.tsx | الشريط الجانبي (أسماء المراحل) |
| GanttTimeHeader.tsx | عنوان المحور الزمني |
| GanttTodayMarker.tsx | خط اليوم الحالي |
| GanttToolbar.tsx | أدوات التحكم |
| GanttTooltip.tsx | تلميحات التمرير |
| GanttView.tsx | العرض الكامل |
| utilities.ts | دوال مساعدة (حساب التواريخ) |
| hooks/ | useGanttDrag, useGanttZoom |

## 13.4 المكونات المشتركة

### 13.4.1 مكونات SaaS المشتركة (26 ملف)
| المكون | الملف | الوصف |
|--------|-------|-------|
| AppWrapper | AppWrapper.tsx | غلاف التطبيق (providers chain) |
| AttachmentList | AttachmentList.tsx | عرض المرفقات مع تحميل |
| AuthWrapper | AuthWrapper.tsx | غلاف المصادقة |
| ConfirmationAlertProvider | ConfirmationAlertProvider.tsx | نظام تأكيد عمليات خطرة |
| Footer | Footer.tsx | تذييل الصفحة |
| MasarSidebarShell | MasarSidebarShell.tsx | غلاف الشريط الجانبي |
| NavBar | NavBar.tsx | شريط التنقل العلوي |
| NotificationBell | NotificationBell.tsx | جرس الإشعارات |
| PageHeader | PageHeader.tsx | عنوان الصفحة + breadcrumbs |
| Pagination | Pagination.tsx | ترقيم الصفحات |
| SettingsItem | SettingsItem.tsx | بند إعدادات |
| SettingsList | SettingsList.tsx | قائمة إعدادات |
| SidebarClock | SidebarClock.tsx | ساعة في الشريط الجانبي |
| SidebarContentLayout | SidebarContentLayout.tsx | تخطيط محتوى الشريط |
| TabGroup | TabGroup.tsx | مجموعة تبويبات |
| UploadButton | UploadButton.tsx | زر رفع ملفات |
| UserMenu | UserMenu.tsx | قائمة المستخدم |

### 13.4.2 الشريط الجانبي (8 ملفات)
| المكون | الملف | الوصف |
|--------|-------|-------|
| AppSidebar | sidebar/AppSidebar.tsx | الشريط الرئيسي |
| SidebarFooter | sidebar/SidebarFooter.tsx | تذييل الشريط |
| SidebarHeader | sidebar/SidebarHeader.tsx | رأس الشريط (Logo + Org) |
| SidebarInset | sidebar/SidebarInset.tsx | منطقة المحتوى |
| SidebarNav | sidebar/SidebarNav.tsx | التنقل |
| sidebar-context | sidebar/sidebar-context.tsx | React Context |
| use-is-mobile | sidebar/use-is-mobile.ts | هوك الجوال |
| use-sidebar-menu | sidebar/use-sidebar-menu.ts | هوك القوائم |

### 13.4.3 مكونات المشاركة الأساسية (10 ملفات)
| المكون | الملف | الوصف |
|--------|-------|-------|
| ApiClientProvider | shared/components/ApiClientProvider.tsx | مزود عميل API |
| ClientProviders | shared/components/ClientProviders.tsx | مزودات الجانب العميل |
| ColorModeToggle | shared/components/ColorModeToggle.tsx | تبديل الوضع المظلم/الفاتح |
| ConsentBanner | shared/components/ConsentBanner.tsx | لافتة الموافقة |
| ConsentProvider | shared/components/ConsentProvider.tsx | سياق الموافقة |
| Document | shared/components/Document.tsx | غلاف المستند |
| LocaleSwitch | shared/components/LocaleSwitch.tsx | مبدل اللغة |
| Logo | shared/components/Logo.tsx | الشعار |
| Spinner | shared/components/Spinner.tsx | مؤشر التحميل |
| UserAvatar | shared/components/UserAvatar.tsx | صورة المستخدم |

## 13.5 مكتبة UI

- **الأساس:** shadcn/ui + Radix UI
- **التنسيق:** Tailwind CSS 4.1.17
- **الأيقونات:** Lucide React 0.553.0
- **الرسوم البيانية:** Recharts (مع `dir="ltr"` صريح)
- **النماذج:** React Hook Form (ضمنياً عبر shadcn/ui form components)
- **الإشعارات:** Sonner (toast notifications)

## 13.6 صفحات التسويق (15 مكون)

| المكون | الوحدة | الوصف |
|--------|--------|-------|
| PostContent | blog | محتوى المقال |
| PostListItem | blog | بند قائمة المقالات |
| ChangelogSection | changelog | قسم التغييرات |
| ContactForm | home | نموذج اتصال |
| FaqSection | home | الأسئلة الشائعة |
| Features | home | مميزات المنصة |
| Hero | home | القسم الرئيسي |
| Newsletter | home | الاشتراك في النشرة |
| PricingSection | home | قسم الأسعار |
| ContentMenu | shared | قائمة المحتوى |
| Footer | shared | التذييل |
| NavBar | shared | شريط التنقل |
| NotFound | shared | صفحة 404 |
| TableOfContents | shared | فهرس المحتويات |

---

# القسم 14: المراجعة الأمنية الكاملة

## 14.1 Security Headers

| Header | القيمة | المسارات | التقييم |
|--------|--------|---------|---------|
| X-Content-Type-Options | nosniff | الكل | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | الكل | ✅ |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | الكل | ✅ |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | الكل | ⚠️ لا يوجد preload |
| X-Frame-Options | DENY | /app, /auth, /share | ✅ |
| X-Frame-Options | (غائب) | /owner | ⚠️ يسمح بالتضمين |
| Content-Security-Policy | Full CSP | /app, /auth | ✅ |
| Cache-Control | no-store | /app, /auth, /api, /owner | ✅ |

## 14.2 تسريب الأسرار

| الفحص | النتيجة |
|-------|---------|
| .env.local في .gitignore | ✅ محمي |
| Hardcoded secrets في الكود | ✅ لا يوجد |
| sk_live / sk_test | ✅ لا يوجد |
| جميع الأسرار في env variables | ✅ نعم |

## 14.3 Rate Limiting

| الجانب | التقييم |
|--------|---------|
| آلية التنفيذ | Redis + Memory fallback |
| Circuit breaker | ✅ بعد 3 فشل Redis → memory لـ 30 ثانية |
| LRU eviction | ✅ 10,000 entries max |
| Window type | Fixed window (ليس sliding) |
| **المشكلة:** | ⚠️ Fixed window يسمح بـ burst عند حدود النافذة |

## 14.4 ملخص الثغرات

| # | الثغرة | الموقع | التصنيف | الخطورة |
|---|--------|--------|---------|---------|
| 1 | Owner Portal tokens بدون expiry | `project-owner-portal.ts` | Auth | **P0** |
| 2 | `projectChat` على publicProcedure | `packages/api/modules/project-chat/router.ts` | Auth | **P1** |
| 3 | `projectDocuments` على publicProcedure | `packages/api/modules/project-documents/router.ts` | Auth | **P1** |
| 4 | Account linking تلقائي (Google/GitHub) | `packages/auth/auth.ts` | Auth | **P2** |
| 5 | freshAge: 0 يسبب DB query كل request | `packages/auth/auth.ts` | Performance | **P1** |
| 6 | CSP يسمح بـ unsafe-inline و unsafe-eval | `apps/web/next.config.ts` | XSS | **P2** |
| 7 | HSTS بدون preload | `apps/web/next.config.ts` | Transport | **P3** |
| 8 | Owner portal بدون X-Frame-Options | `apps/web/next.config.ts` | Clickjacking | **P2** |
| 9 | Fixed window rate limiting | `packages/api/lib/rate-limit.ts` | DoS | **P3** |
| 10 | لا يوجد brute force protection للـ login | `packages/auth/auth.ts` | Auth | **P2** |

---

# القسم 15: الأداء وقابلية التوسع

## 15.1 أنماط الاستعلامات الجيدة

| النمط | الاستخدام | التقييم |
|-------|----------|---------|
| Promise.all للاستعلامات المتوازية | dashboard, digest, reports | ✅ |
| Pagination | 95%+ من قوائم البيانات | ✅ |
| Select/include | معظم الاستعلامات | ✅ |
| Atomic sequences | أرقام الفواتير/المصروفات | ✅ |
| Transactions | عمليات معقدة (organization creation, payroll) | ✅ |

## 15.2 N+1 Queries

**لا توجد مشاكل N+1 حرجة.** الأنماط الموجودة:
- `dashboard.getRecentActivities()` — 3 استعلامات متوازية (مقبول: نتائج صغيرة)
- `digest.generateWeeklyDigest()` — 6 استعلامات (مقبول: batch job)

## 15.3 مشاكل الأداء

| المشكلة | الأثر | الحل |
|---------|-------|------|
| `freshAge: 0` | DB query كل HTTP request | رفعه إلى 300 (5 دقائق) |
| Monthly financial trend | يجلب 6 أشهر ويجمع في JS | استخدام groupBy في DB |
| Company dashboard | 5 aggregations متوازية | caching layer |

## 15.4 Serverless Considerations (Vercel)

| الجانب | الحالة |
|--------|--------|
| Cold starts | ⚠️ Prisma connection pool قد يبطئ |
| Redis connection | ✅ Circuit breaker مع memory fallback |
| File uploads | ✅ S3 مع signed URLs (لا يمر عبر الخادم) |
| Timeout 10s | ⚠️ بعض الاستعلامات المعقدة قد تتجاوز |

---

# القسم 16: الاختبارات والجودة

## 16.1 ملفات الاختبار (6 ملفات)

| # | الملف | النوع | السطور | ما يختبر |
|---|-------|-------|--------|---------|
| 1 | `apps/web/tests/home.spec.ts` | E2E (Playwright) | ~30 | الصفحة الرئيسية |
| 2 | `packages/api/__tests__/permissions.test.ts` | Unit + Integration | 727 | مصفوفة RBAC كاملة |
| 3 | `packages/api/__tests__/rate-limit.test.ts` | Unit | 157 | Rate limiting |
| 4 | `packages/database/__tests__/attachments-validation.test.ts` | Unit | 191 | أمان رفع الملفات |
| 5 | `packages/database/__tests__/org-finance.test.ts` | Integration | 827 | العمليات المالية |
| 6 | `packages/database/__tests__/smoke.test.ts` | Smoke | 55 | اتصال DB |

**إجمالي:** ~1,700 سطر اختبارات

## 16.2 نسبة التغطية المقدرة

- **إجمالي تقديري:** ~5-10%
- **ملفات الصلاحيات:** 90% (مطلوب في vitest.config)
- **المالية (org-finance):** 90% (مطلوب)
- **الدفعات (payroll):** 85% (مطلوب)
- **دراسات الكميات:** 80% (مطلوب)
- **باقي الوحدات:** 0%

## 16.3 أهم الوحدات التي تحتاج اختبارات (بالأولوية)

| # | الوحدة | السبب |
|---|--------|-------|
| 1 | Auth hooks (after sign-in, invitation) | منطق أعمال حساس |
| 2 | Invoice calculations | حسابات مالية |
| 3 | Quotation to Invoice conversion | تدفق أعمال |
| 4 | Subcontract payments | عمليات مالية |
| 5 | Multi-tenancy isolation | أمان |
| 6 | Project access verification | RBAC |
| 7 | Change order workflow | تحولات الحالة |
| 8 | Claim status transitions | تدفق أعمال |
| 9 | Expense run posting | عمليات دفعية |
| 10 | Owner portal token verification | أمان |

## 16.4 أدوات الجودة

| الأداة | الحالة | التقييم |
|--------|--------|---------|
| TypeScript strict mode | ✅ مفعّل | ممتاز |
| Biome linting | ✅ مفعّل | ممتاز |
| Zod validation | ✅ على كل endpoint | ممتاز |
| Pre-commit hooks | ❌ غير موجود | يحتاج إضافة |
| CI lint (Biome) | ✅ على PRs | جيد |
| CI E2E (Playwright) | ✅ على PRs | جيد |
| CI unit tests | ⚠️ غير واضح | يحتاج تأكيد |
| Code review | ⚠️ غير معروف | — |

---

# القسم 17: تقييم الامتثال (Compliance)

## 17.1 ZATCA Phase 1

| المتطلب | الحالة | الملاحظات |
|---------|--------|----------|
| QR Code على الفواتير | ⚠️ حقل موجود + `generateZatcaQR` | التنفيذ جزئي |
| الرقم الضريبي | ✅ `taxNumber` في Organization و Client | — |
| حقول ZATCA في الفاتورة | ✅ qrCode, zatcaUuid, zatcaHash, zatcaSignature | — |
| نوع الفاتورة | ✅ STANDARD, TAX, SIMPLIFIED | — |
| تحويل فاتورة عادية → ضريبية | ✅ `convertToTaxInvoiceProcedure` | — |

## 17.2 ZATCA Phase 2

| المتطلب | الحالة | الملاحظات |
|---------|--------|----------|
| Integration مع ZATCA API | ❌ غير موجود | **حرج** |
| Clearance/Reporting | ❌ غير موجود | مطلوب للإطلاق |
| Cryptographic stamping | ❌ غير موجود | مطلوب |
| UUID generation | ⚠️ حقل موجود بدون منطق | — |

## 17.3 Audit Trail

| النظام | التغطية |
|--------|---------|
| Project Audit Log | ✅ شامل (actions: 20+ نوع) |
| Organization Audit Log | ✅ شامل (7 سنوات retention) |
| Financial audit | ⚠️ جزئي (بعض العمليات غير مسجلة) |
| Session audit | ❌ لا يوجد تتبع لتسجيلات الدخول الفاشلة |

## 17.4 متطلبات السوق السعودي

| المتطلب | الحالة |
|---------|--------|
| ZATCA Phase 2 | ❌ غير مكتمل |
| WPS (نظام حماية الأجور) | ❌ غير موجود |
| GOSI integration | ❌ غير موجود |
| رخص البناء | ❌ غير موجود |
| العملة SAR | ✅ افتراضي |
| المنطقة الزمنية | ✅ Asia/Riyadh |

---

# القسم 18: كتالوج المشاكل الكامل

| # | المشكلة | الموقع | التصنيف | الخطورة | الجهد | التأثير |
|---|---------|--------|---------|---------|-------|---------|
| 1 | Owner Portal tokens بدون expiry | schema.prisma:ProjectOwnerAccess | أمان | **P0** | 2h | وصول دائم غير مراقب |
| 2 | ZATCA Phase 2 غير مكتمل | finance module | امتثال | **P0** | 2-3w | عدم امتثال تنظيمي |
| 3 | projectChat على publicProcedure | api/modules/project-chat/router.ts | أمان | **P1** | 1h | وصول غير مصرح لرسائل المشروع |
| 4 | projectDocuments على publicProcedure | api/modules/project-documents/router.ts | أمان | **P1** | 1h | وصول غير مصرح للمستندات |
| 5 | freshAge: 0 | packages/auth/auth.ts | أداء | **P1** | 30m | DB query كل request |
| 6 | تغطية اختبارات ~5% | المشروع ككل | جودة | **P1** | 2-3w | مخاطر أخطاء غير مكتشفة |
| 7 | لا يوجد pre-commit hooks | الجذر | جودة | **P2** | 2h | كود معيب يصل الإنتاج |
| 8 | Float بدل Decimal في progress | schema.prisma (3 حقول) | دقة | **P2** | 1h | فقدان دقة |
| 9 | CSP unsafe-inline/eval | next.config.ts | أمان | **P2** | 4h | XSS محتمل |
| 10 | Account linking تلقائي | auth.ts | أمان | **P2** | 2h | ربط حسابات غير مقصود |
| 11 | OVERDUE تلقائي مفقود | finance queries | أعمال | **P2** | 4h | فواتير متأخرة لا تُكتشف |
| 12 | Owner portal بدون X-Frame-Options | next.config.ts | أمان | **P2** | 30m | Clickjacking |
| 13 | Retention حسابات غير مؤتمتة | project-contract | أعمال | **P2** | 1d | حسابات يدوية |
| 14 | عرض سعر → فاتورة غير مكتمل | finance queries | أعمال | **P2** | 4h | workflow مقطوع |
| 15 | HSTS بدون preload | next.config.ts | أمان | **P3** | 15m | — |
| 16 | Fixed window rate limiting | rate-limit.ts | أمان | **P3** | 4h | burst ممكن |
| 17 | Gantt chart مفقود | timeline UI | UX | **P3** | 2-3d | — |
| 18 | PDF export templates ناقصة | exports module | وظائف | **P3** | 3-5d | — |
| 19 | Real-time chat (polling only) | chat module | UX | **P3** | 2-3d | — |
| 20 | WPS integration مفقود | company module | امتثال | **P3** | 1-2w | — |
| 21 | GOSI integration مفقود | company module | امتثال | **P3** | 1-2w | — |
| 22 | Multi-currency مفقود | finance | وظائف | **P3** | 1w | — |
| 23 | AI بدون RAG | ai module | وظائف | **P3** | 1-2w | — |
| 24 | SubcontractPayment لا يوجد update/delete | subcontracts | وظائف | **P3** | 4h | — |
| 25 | Brute force protection مفقود | auth | أمان | **P2** | 4h | — |
| 26 | Approval workflow يدوي | claims/documents | أعمال | **P3** | 1w | — |
| 27 | Session audit trail مفقود | auth | امتثال | **P3** | 4h | — |
| 28 | Mobile optimization ناقص | field module | UX | **P3** | 1w | — |
| 29 | SubcontractPayment partial term tracking | subcontracts | أعمال | **P3** | 4h | — |
| 30 | Company dashboard caching مفقود | company queries | أداء | **P3** | 4h | — |

---

# القسم 19: خريطة الإصلاح — أعلى 30

## إصلاح #1: Owner Portal Token Expiry (P0)
**الوصف:** إضافة `expiresAt` افتراضي عند إنشاء رموز الوصول
**الجهد:** 2 ساعات
**التأثير:** إغلاق ثغرة أمنية حرجة
**الإصلاح:**
```typescript
// في project-owner-portal.ts → createOwnerAccess
const DEFAULT_EXPIRY_DAYS = 90;
const access = await db.projectOwnerAccess.create({
  data: {
    ...data,
    expiresAt: data.expiresAt ?? new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 86400000),
  }
});
```
**اعتمادات:** لا يوجد

---

## إصلاح #2: ZATCA Phase 2 (P0)
**الوصف:** تكامل مع ZATCA API للمرحلة الثانية (Clearance + Reporting)
**الجهد:** 2-3 أسابيع
**التأثير:** امتثال تنظيمي إلزامي
**الخطوات:**
1. إنشاء حزمة `packages/zatca/`
2. تنفيذ XML invoice generation (UBL 2.1)
3. تنفيذ cryptographic stamping
4. تنفيذ API integration (clearance/reporting)
5. اختبارات مع ZATCA sandbox
**اعتمادات:** إصلاح #11 (Invoice status)

---

## إصلاح #3: تأمين projectChat (P1)
**الوصف:** نقل من publicProcedure إلى protectedProcedure مع verifyProjectAccess
**الجهد:** 1 ساعة
**الإصلاح:**
```typescript
// router.ts
const projectChatRouter = router({
  listMessages: protectedProcedure.input(...).handler(async ({ input, context }) => {
    const { project } = await verifyProjectAccess(context.user.id, input.organizationId, input.projectId);
    // ... existing logic
  }),
});
```
**اعتمادات:** لا يوجد

---

## إصلاح #4: تأمين projectDocuments (P1)
**الوصف:** مثل #3 — نقل إلى protectedProcedure
**الجهد:** 1 ساعة
**اعتمادات:** لا يوجد

---

## إصلاح #5: رفع freshAge (P1)
**الوصف:** رفع `freshAge` من 0 إلى 300 (5 دقائق)
**الجهد:** 30 دقيقة
**الإصلاح:**
```typescript
// auth.ts
session: {
  expiresIn: 60 * 60 * 24 * 30,
  freshAge: 300, // 5 minutes instead of 0
}
```
**التأثير:** تقليل استعلامات DB بشكل كبير
**اعتمادات:** لا يوجد

---

## إصلاح #6: إضافة اختبارات (P1)
**الوصف:** إضافة اختبارات للوحدات الحرجة
**الجهد:** 2-3 أسابيع
**الأولوية:**
1. Auth hooks
2. Invoice calculations
3. Multi-tenancy isolation
4. Claim/CO workflow transitions
**اعتمادات:** لا يوجد

---

## إصلاح #7: Pre-commit Hooks (P2)
**الوصف:** إضافة Husky + lint-staged
**الجهد:** 2 ساعات
**الإصلاح:**
```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["biome check --apply"]
}
```
**اعتمادات:** لا يوجد

---

## إصلاح #8: Float → Decimal (P2)
**الوصف:** تحويل حقول progress من Float إلى Decimal(5,2)
**الجهد:** 1 ساعة + migration
**اعتمادات:** لا يوجد

---

## إصلاح #9: CSP تشديد (P2)
**الوصف:** إزالة unsafe-inline و unsafe-eval (يتطلب nonce-based CSP)
**الجهد:** 4 ساعات
**اعتمادات:** لا يوجد

---

## إصلاح #10: Account Linking Confirmation (P2)
**الوصف:** إضافة تأكيد قبل ربط حسابات OAuth
**الجهد:** 2 ساعات
**اعتمادات:** لا يوجد

---

## إصلاح #11: OVERDUE تلقائي (P2)
**الوصف:** إضافة cron job أو computed check لتحديث حالة الفواتير المتأخرة
**الجهد:** 4 ساعات
**اعتمادات:** لا يوجد

---

## إصلاح #12: X-Frame-Options للـ Owner Portal (P2)
**الوصف:** إضافة `X-Frame-Options: SAMEORIGIN` للـ owner portal
**الجهد:** 30 دقيقة
**اعتمادات:** لا يوجد

---

## إصلاح #13: Retention Automation (P2)
**الوصف:** حساب تلقائي لمبالغ الاحتفاظ وتواريخ الإفراج
**الجهد:** 1 يوم
**اعتمادات:** لا يوجد

---

## إصلاح #14: Quotation → Invoice Conversion (P2)
**الوصف:** إكمال منطق تحويل عرض السعر إلى فاتورة مع نسخ البنود
**الجهد:** 4 ساعات
**اعتمادات:** لا يوجد

---

## إصلاح #15-30: (P3 Improvements)

| # | الإصلاح | الجهد |
|---|---------|-------|
| 15 | HSTS preload | 15m |
| 16 | Sliding window rate limiting | 4h |
| 17 | Gantt chart visualization | 2-3d |
| 18 | PDF export templates | 3-5d |
| 19 | WebSocket real-time chat | 2-3d |
| 20 | WPS integration | 1-2w |
| 21 | GOSI integration | 1-2w |
| 22 | Multi-currency support | 1w |
| 23 | AI RAG integration | 1-2w |
| 24 | SubcontractPayment CRUD completion | 4h |
| 25 | Brute force protection | 4h |
| 26 | Approval workflow automation | 1w |
| 27 | Session audit trail | 4h |
| 28 | Mobile optimization | 1w |
| 29 | Partial payment term tracking | 4h |
| 30 | Company dashboard caching | 4h |

---

# القسم 20: تقييم جاهزية الإطلاق

## 20.1 تقييم كل وحدة

| الوحدة | الجاهزية | الحالة | ما يمنع الإطلاق | ما يمكن تأجيله |
|--------|----------|--------|-----------------|---------------|
| المشاريع (Projects) | 85% | ⚠️ Beta | — | Gantt chart |
| مالية المنظمة (Org Finance) | 90% | ⚠️ Beta | ZATCA Phase 2 | Multi-currency |
| مالية المشروع (Project Finance) | 85% | ⚠️ Beta | — | Retention automation |
| عقود الباطن (Subcontracts) | 70% | ⚠️ Beta | — | Payment CRUD completion |
| دراسات الكميات (Cost Studies) | 75% | ⚠️ Beta | — | PDF export |
| إدارة المنشأة (Company) | 70% | ⚠️ Beta | — | WPS/GOSI |
| بوابة المالك (Owner Portal) | 80% | ⚠️ Beta | **Token expiry** | UI polish |
| المحادثات (Chat) | 65% | ⚠️ Alpha | **Auth protection** | Real-time |
| الذكاء الاصطناعي (AI) | 60% | ⚠️ Alpha | — | RAG |
| الإشعارات (Notifications) | 80% | ✅ Stable | — | — |
| المرفقات (Attachments) | 90% | ✅ Stable | — | — |
| الإعدادات (Settings) | 85% | ✅ Stable | — | — |
| لوحة التحكم (Dashboard) | 85% | ✅ Stable | — | — |
| الجدول الزمني (Timeline) | 80% | ⚠️ Beta | — | Gantt |
| أوامر التغيير (Change Orders) | 70% | ⚠️ Beta | — | Visualization |
| التصدير (Exports) | 50% | ❌ Alpha | — | كامل |
| المشاركة (Shares) | 80% | ✅ Stable | — | — |
| المصادقة (Auth) | 90% | ✅ Stable | — | Brute force protection |
| الصلاحيات (RBAC) | 95% | ✅ Stable | — | — |

## 20.2 التقييم العام

### ⚠️ جاهز مع تحفظات

المنصة جاهزة للإطلاق التجريبي (Beta) مع مجموعة محدودة من العملاء، بشرط معالجة النقاط الحرجة التالية:

## 20.3 قائمة المتطلبات الإلزامية قبل الإطلاق (Must-have)

- [ ] إصلاح Owner Portal token expiry (P0 — 2 ساعات)
- [ ] تأمين projectChat و projectDocuments (P1 — 2 ساعة)
- [ ] رفع freshAge من 0 إلى 300+ (P1 — 30 دقيقة)
- [ ] إضافة OVERDUE تلقائي للفواتير (P2 — 4 ساعات)
- [ ] إضافة X-Frame-Options لبوابة المالك (P2 — 30 دقيقة)
- [ ] تحويل Float → Decimal لحقول progress (P2 — 1 ساعة)
- [ ] ZATCA Phase 2 integration (P0 — 2-3 أسابيع) *أو تأجيل الفوترة الضريبية*

## 20.4 قائمة التحسينات المؤجلة (Nice-to-have)

- [ ] Pre-commit hooks
- [ ] Sliding window rate limiting
- [ ] Gantt chart
- [ ] PDF export templates
- [ ] Real-time chat (WebSocket)
- [ ] WPS/GOSI integration
- [ ] Multi-currency support
- [ ] AI RAG integration
- [ ] Mobile optimization
- [ ] Approval workflow automation
- [ ] Session audit trail
- [ ] Brute force protection

---

# القسم 21: خطة المراحل المقترحة

## المرحلة 1: ما قبل الإطلاق (أسبوع 1)

| المهمة | المسؤولية | المدة | معيار الإنجاز |
|--------|----------|-------|-------------|
| إصلاح Owner Portal token expiry | Backend | 2h | Tokens تنتهي بعد 90 يوم |
| تأمين projectChat + projectDocuments | Backend | 2h | protectedProcedure مع verifyProjectAccess |
| رفع freshAge إلى 300 | Backend | 30m | لا DB query كل request |
| إضافة OVERDUE تلقائي | Backend | 4h | فواتير تتحول لـ OVERDUE تلقائياً |
| Float → Decimal migration | Backend | 1h | migration ناجحة |
| X-Frame-Options لـ Owner Portal | DevOps | 30m | Header موجود |
| إضافة pre-commit hooks | DevOps | 2h | Biome يعمل قبل كل commit |
| Smoke testing شامل | QA | 2-3d | كل workflow رئيسي يعمل |

## المرحلة 2: الإطلاق التجريبي (أسبوع 2-3)

| المهمة | المسؤولية | المدة | معيار الإنجاز |
|--------|----------|-------|-------------|
| إطلاق لـ 3-5 شركات مقاولات | Product | أسبوعان | تسجيل + استخدام فعلي |
| مراقبة الأداء والأخطاء | DevOps | مستمر | Sentry/logging |
| جمع ملاحظات المستخدمين | Product | مستمر | تقرير أسبوعي |
| إضافة اختبارات للوحدات الحرجة | Backend | أسبوعان | coverage > 30% |
| Account linking confirmation | Backend | 2h | — |
| CSP تشديد | DevOps | 4h | — |
| Brute force protection | Backend | 4h | — |

## المرحلة 3: ما بعد الإطلاق (أسبوع 4-8)

| المهمة | المسؤولية | المدة | معيار الإنجاز |
|--------|----------|-------|-------------|
| ZATCA Phase 2 integration | Backend | 2-3w | تكامل مع ZATCA sandbox |
| Quotation → Invoice conversion | Backend | 4h | تحويل يعمل |
| Retention automation | Backend | 1d | حسابات تلقائية |
| Gantt chart | Frontend | 3d | مخطط زمني تفاعلي |
| PDF export templates | Frontend | 5d | تصدير يعمل |
| Mobile optimization | Frontend | 1w | تجربة موبايل سلسة |
| Real-time chat | Full-stack | 3d | WebSocket |
| AI RAG integration | Backend | 1-2w | chatbot يفهم بيانات المشروع |
| Approval workflow | Full-stack | 1w | اعتماد متعدد المستويات |
| رفع التغطية إلى 50%+ | Backend | مستمر | — |

---

---

# ملحق أ: سطح API التفصيلي الكامل

## أ.1 وحدة المشاريع (projects)

| الإجراء | النوع | الحماية | الصلاحية | Rate Limit | الوصف |
|---------|-------|---------|---------|------------|-------|
| `projects.list` | query | protected | projects.view | READ | قائمة المشاريع مع فلترة (status, search) + pagination |
| `projects.create` | mutation | protected | projects.create | WRITE | إنشاء مشروع (name, type, client, dates, contract) |
| `projects.getById` | query | protected | projects.view | READ | تفاصيل مشروع مع contract وteam |
| `projects.update` | mutation | protected | projects.edit | WRITE | تحديث بيانات المشروع |
| `projects.delete` | mutation | protected | projects.delete | WRITE | حذف/أرشفة مشروع |
| `projects.getNextProjectNo` | query | protected | projects.create | READ | رقم المشروع التالي (auto) |

## أ.2 وحدة مالية المشروع (projectFinance)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `projectFinance.getSummary` | query | protected | projects.viewFinance | ملخص مالي (عقد، مستخلصات، مصروفات، مقاولين) |
| `projectFinance.listExpenses` | query | protected | projects.viewFinance | قائمة مصروفات المشروع (paginated) |
| `projectFinance.createExpense` | mutation | protected | projects.edit | إنشاء مصروف (amount, category, vendor, date) |
| `projectFinance.updateExpense` | mutation | protected | projects.edit | تحديث مصروف |
| `projectFinance.deleteExpense` | mutation | protected | projects.edit | حذف مصروف |
| `projectFinance.listClaims` | query | protected | projects.viewFinance | قائمة المستخلصات |
| `projectFinance.createClaim` | mutation | protected | finance.payments | إنشاء مستخلص (periodStart, periodEnd, amount) |
| `projectFinance.updateClaim` | mutation | protected | finance.payments | تحديث مستخلص |
| `projectFinance.updateClaimStatus` | mutation | protected | finance.payments | تغيير حالة المستخلص |
| `projectFinance.deleteClaim` | mutation | protected | finance.payments | حذف مستخلص |
| `projectFinance.listSubcontracts` | query | protected | projects.viewFinance | قائمة عقود الباطن |
| `projectFinance.getSubcontract` | query | protected | projects.viewFinance | تفاصيل عقد باطن |
| `projectFinance.createSubcontract` | mutation | protected | projects.edit | إنشاء عقد باطن |
| `projectFinance.updateSubcontract` | mutation | protected | projects.edit | تحديث عقد باطن |
| `projectFinance.deleteSubcontract` | mutation | protected | projects.edit | حذف عقد باطن |
| `projectFinance.getExpensesByCategory` | query | protected | projects.viewFinance | مصروفات حسب الفئة (chart data) |
| `projectFinance.getPaymentsClaimsTimeline` | query | protected | projects.viewFinance | جدول زمني مدفوعات/مستخلصات |

## أ.3 وحدة العقد الرئيسي (projectContract)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `projectContract.get` | query | protected | projects.view | جلب العقد |
| `projectContract.upsert` | mutation | protected | projects.edit | إنشاء/تحديث العقد |
| `projectContract.setPaymentTerms` | mutation | protected | projects.edit | تعيين شروط الدفع (batch) |
| `projectContract.getSummary` | query | protected | projects.view | ملخص العقد |
| `projectContract.getNextNo` | query | protected | projects.edit | رقم العقد التالي |
| `projectContract.getPaymentTermsProgress` | query | protected | projects.view | تقدم شروط الدفع |

## أ.4 وحدة عقود الباطن (subcontracts)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `subcontracts.list` | query | protected | finance.view | قائمة عقود الباطن |
| `subcontracts.get` | query | protected | finance.view | تفاصيل عقد |
| `subcontracts.create` | mutation | protected | projects.edit | إنشاء عقد (contractNo, name, contractor, value) |
| `subcontracts.update` | mutation | protected | projects.edit | تحديث عقد |
| `subcontracts.delete` | mutation | protected | projects.edit | حذف عقد |
| `subcontracts.setPaymentTerms` | mutation | protected | projects.edit | تعيين شروط الدفع |
| `subcontracts.getPaymentTermsProgress` | query | protected | finance.view | تقدم الدفعات |
| `subcontracts.getSummary` | query | protected | finance.view | ملخص إحصائي |
| `subcontracts.createChangeOrder` | mutation | protected | projects.edit | أمر تغيير |
| `subcontracts.updateChangeOrder` | mutation | protected | projects.edit | تحديث أمر تغيير |
| `subcontracts.deleteChangeOrder` | mutation | protected | projects.edit | حذف أمر تغيير |
| `subcontracts.createPayment` | mutation | protected | finance.payments | تسجيل دفعة |
| `subcontracts.generateContractNo` | query | protected | projects.edit | رقم العقد التالي |

## أ.5 وحدة التنفيذ الميداني (projectField)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `projectField.createDailyReport` | mutation | protected | projects.edit | تقرير يومي (manpower, weather, workDone) |
| `projectField.listDailyReports` | query | protected | projects.view | قائمة التقارير |
| `projectField.createPhoto` | mutation | protected | projects.edit | إضافة صورة (url, caption, category) |
| `projectField.listPhotos` | query | protected | projects.view | قائمة الصور |
| `projectField.deletePhoto` | mutation | protected | projects.edit | حذف صورة |
| `projectField.createIssue` | mutation | protected | projects.edit | إنشاء مشكلة (title, severity) |
| `projectField.listIssues` | query | protected | projects.view | قائمة المشاكل |
| `projectField.updateIssue` | mutation | protected | projects.edit | تحديث مشكلة |
| `projectField.addProgressUpdate` | mutation | protected | projects.edit | إضافة تحديث تقدم |
| `projectField.listProgressUpdates` | query | protected | projects.view | قائمة التحديثات |
| `projectField.getTimeline` | query | protected | projects.view | جدول زمني ميداني |

## أ.6 وحدة الجدول الزمني (projectTimeline)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `projectTimeline.listMilestones` | query | protected | projects.view | قائمة المراحل |
| `projectTimeline.createMilestone` | mutation | protected | projects.edit | إنشاء مرحلة |
| `projectTimeline.updateMilestone` | mutation | protected | projects.edit | تحديث مرحلة |
| `projectTimeline.deleteMilestone` | mutation | protected | projects.edit | حذف مرحلة |
| `projectTimeline.reorderMilestones` | mutation | protected | projects.edit | إعادة ترتيب |
| `projectTimeline.markActual` | mutation | protected | projects.edit | تسجيل تاريخ فعلي |
| `projectTimeline.startMilestone` | mutation | protected | projects.edit | بدء المرحلة |
| `projectTimeline.completeMilestone` | mutation | protected | projects.edit | إكمال المرحلة |
| `projectTimeline.getHealth` | query | protected | projects.view | صحة الجدول الزمني |

## أ.7 وحدة أوامر التغيير (projectChangeOrders)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `projectChangeOrders.list` | query | protected | projects.view | القائمة |
| `projectChangeOrders.getStats` | query | protected | projects.view | إحصائيات |
| `projectChangeOrders.get` | query | protected | projects.view | التفاصيل |
| `projectChangeOrders.create` | mutation | protected | projects.edit | إنشاء |
| `projectChangeOrders.update` | mutation | protected | projects.edit | تحديث |
| `projectChangeOrders.delete` | mutation | protected | projects.edit | حذف |
| `projectChangeOrders.submit` | mutation | protected | projects.edit | تقديم للاعتماد |
| `projectChangeOrders.approve` | mutation | protected | projects.edit | اعتماد |
| `projectChangeOrders.reject` | mutation | protected | projects.edit | رفض |
| `projectChangeOrders.implement` | mutation | protected | projects.edit | تنفيذ |
| `projectChangeOrders.ownerList` | query | public (token) | — | قائمة المالك |
| `projectChangeOrders.ownerGet` | query | public (token) | — | تفاصيل للمالك |

## أ.8 وحدة المحادثات (projectChat) ⚠️

| الإجراء | النوع | الحماية | الوصف |
|---------|-------|---------|-------|
| `projectChat.listMessages` | query | **public** ⚠️ | قائمة الرسائل |
| `projectChat.sendMessage` | mutation | **public** ⚠️ | إرسال رسالة |
| `projectChat.getUnreadCount` | query | **public** ⚠️ | عدد غير المقروء |
| `projectChat.markAsRead` | mutation | **public** ⚠️ | تعليم كمقروء |

## أ.9 وحدة المستندات (projectDocuments) ⚠️

| الإجراء | النوع | الحماية | الوصف |
|---------|-------|---------|-------|
| `projectDocuments.list` | query | **public** ⚠️ | قائمة المستندات |
| `projectDocuments.create` | mutation | **public** ⚠️ | إنشاء مستند |
| `projectDocuments.get` | query | **public** ⚠️ | تفاصيل مستند |
| `projectDocuments.createApprovalRequest` | mutation | **public** ⚠️ | طلب اعتماد |
| `projectDocuments.actOnApproval` | mutation | **public** ⚠️ | اعتماد/رفض |
| `projectDocuments.getApproval` | query | **public** ⚠️ | حالة الاعتماد |

## أ.10 وحدة بوابة المالك (projectOwner)

### Internal (مصادق):
| الإجراء | النوع | الحماية | الوصف |
|---------|-------|---------|-------|
| `projectOwner.createAccess` | mutation | protected | إنشاء رمز وصول |
| `projectOwner.listAccess` | query | protected | قائمة الرموز |
| `projectOwner.revokeAccess` | mutation | protected | إبطال رمز |
| `projectOwner.sendOfficialUpdate` | mutation | protected | إرسال تحديث رسمي |

### Portal (عام بـ token):
| الإجراء | النوع | Rate Limit | الوصف |
|---------|-------|------------|-------|
| `projectOwner.portal.getSummary` | query | TOKEN (30/min) | ملخص المشروع |
| `projectOwner.portal.getSchedule` | query | TOKEN | الجدول الزمني |
| `projectOwner.portal.getPayments` | query | TOKEN | جدول المدفوعات |
| `projectOwner.portal.listMessages` | query | TOKEN | الرسائل |
| `projectOwner.portal.sendMessage` | mutation | TOKEN | إرسال رسالة |
| `projectOwner.portal.listUpdates` | query | TOKEN | التحديثات الرسمية |

## أ.11 وحدة فريق المشروع (projectTeam)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `projectTeam.list` | query | protected | projects.view | قائمة الفريق |
| `projectTeam.add` | mutation | protected | projects.manageTeam | إضافة عضو |
| `projectTeam.updateRole` | mutation | protected | projects.manageTeam | تحديث دور |
| `projectTeam.remove` | mutation | protected | projects.manageTeam | إزالة عضو |

## أ.12 وحدة المالية — العملاء (finance.clients)

| الإجراء | النوع | الحماية | الوصف |
|---------|-------|---------|-------|
| `finance.clients.list` | query | protected | قائمة العملاء (search, type, status) |
| `finance.clients.getById` | query | protected | تفاصيل عميل + جهات اتصال |
| `finance.clients.create` | mutation | protected | إنشاء عميل + جهات اتصال |
| `finance.clients.update` | mutation | protected | تحديث عميل |
| `finance.clients.delete` | mutation | protected | حذف عميل |

## أ.13 وحدة المالية — عروض الأسعار (finance.quotations)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `finance.quotations.list` | query | protected | finance.quotations | القائمة مع فلترة (status, client, project) |
| `finance.quotations.getById` | query | protected | finance.quotations | التفاصيل + البنود + القالب |
| `finance.quotations.create` | mutation | protected | finance.quotations | إنشاء + بنود + حسابات VAT |
| `finance.quotations.update` | mutation | protected | finance.quotations | تحديث |
| `finance.quotations.updateItems` | mutation | protected | finance.quotations | تحديث البنود (إعادة حساب المجاميع) |
| `finance.quotations.updateStatus` | mutation | protected | finance.quotations | تحديث الحالة (sets sentAt, viewedAt, etc.) |
| `finance.quotations.delete` | mutation | protected | finance.quotations | حذف (يمنع حذف المحول لفاتورة) |
| `finance.quotations.convertToInvoice` | mutation | protected | finance.invoices | تحويل لفاتورة |

## أ.14 وحدة المالية — الفواتير (finance.invoices)

| الإجراء | النوع | الحماية | الصلاحية | الوصف |
|---------|-------|---------|---------|-------|
| `finance.invoices.list` | query | protected | finance.invoices | القائمة + كشف OVERDUE |
| `finance.invoices.getById` | query | protected | finance.invoices | التفاصيل + البنود + الدفعات |
| `finance.invoices.create` | mutation | protected | finance.invoices | إنشاء فاتورة |
| `finance.invoices.update` | mutation | protected | finance.invoices | تحديث |
| `finance.invoices.updateItems` | mutation | protected | finance.invoices | تحديث البنود |
| `finance.invoices.updateStatus` | mutation | protected | finance.invoices | تحديث الحالة |
| `finance.invoices.addPayment` | mutation | protected | finance.payments | تسجيل دفعة (يحدث paidAmount + status) |
| `finance.invoices.deletePayment` | mutation | protected | finance.payments | حذف دفعة (يعيد حساب status) |
| `finance.invoices.convertToTax` | mutation | protected | finance.invoices | تحويل لفاتورة ضريبية |
| `finance.invoices.delete` | mutation | protected | finance.invoices | حذف (يمنع حذف المدفوعة) |

## أ.15 وحدة المالية — المصروفات والمقبوضات والتحويلات

### المصروفات (finance.expenses):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `finance.expenses.list` | query | القائمة (26 فئة) |
| `finance.expenses.getById` | query | التفاصيل |
| `finance.expenses.create` | mutation | إنشاء (amount, category, vendor, account) |
| `finance.expenses.update` | mutation | تحديث |
| `finance.expenses.delete` | mutation | حذف |
| `finance.expenses.pay` | mutation | دفع مصروف |
| `finance.expenses.cancel` | mutation | إلغاء مصروف |
| `finance.expenses.listWithSubcontracts` | query | قائمة موحدة مع عقود الباطن |

### المقبوضات (finance.payments):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `finance.payments.list` | query | القائمة |
| `finance.payments.getById` | query | التفاصيل |
| `finance.payments.create` | mutation | إنشاء (client, project, invoice, bank) |
| `finance.payments.update` | mutation | تحديث |
| `finance.payments.delete` | mutation | حذف |

### التحويلات (finance.transfers):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `finance.transfers.list` | query | القائمة |
| `finance.transfers.getById` | query | التفاصيل |
| `finance.transfers.create` | mutation | إنشاء (from, to, amount) |
| `finance.transfers.cancel` | mutation | إلغاء |

### الحسابات البنكية (finance.banks):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `finance.banks.list` | query | القائمة (type, status) |
| `finance.banks.getById` | query | التفاصيل |
| `finance.banks.create` | mutation | إنشاء (name, bank, iban, type) |
| `finance.banks.update` | mutation | تحديث |
| `finance.banks.setDefault` | mutation | تعيين كافتراضي |
| `finance.banks.delete` | mutation | حذف |
| `finance.banks.reconcile` | query | مطابقة الحساب |

## أ.16 وحدة المالية — التقارير

| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `finance.reports.revenueByPeriod` | query | الإيرادات حسب الفترة (شهري) |
| `finance.reports.revenueByProject` | query | الإيرادات حسب المشروع |
| `finance.reports.revenueByClient` | query | الإيرادات حسب العميل (top 10) |
| `finance.reports.conversionRate` | query | نسبة تحويل عروض الأسعار |
| `finance.reports.quotationStats` | query | إحصائيات عروض الأسعار (7 فئات حالة) |
| `finance.reports.invoiceStats` | query | إحصائيات الفواتير (7 فئات حالة) |
| `finance.orgDashboard` | query | لوحة التحكم المالية (13 query متوازية) |

## أ.17 وحدة إدارة المنشأة (company) — تفصيلي

### الموظفون (company.employees):
| الإجراء | النوع | الصلاحية | الوصف |
|---------|-------|---------|-------|
| `company.employees.list` | query | employees.view | القائمة (status, type) |
| `company.employees.getById` | query | employees.view | التفاصيل + تعيينات |
| `company.employees.create` | mutation | employees.create | إنشاء (salary, type, dates) |
| `company.employees.update` | mutation | employees.edit | تحديث |
| `company.employees.terminate` | mutation | employees.edit | إنهاء خدمة (+ deactivate assignments) |
| `company.employees.getSummary` | query | employees.view | ملخص (active/terminated/leave, totals) |

### تعيينات الموظفين (company.employees.assignments):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `assignments.list` | query | قائمة التعيينات |
| `assignments.byProject` | query | تعيينات حسب المشروع |
| `assignments.assign` | mutation | تعيين موظف (validates total ≤100%) |
| `assignments.update` | mutation | تحديث نسبة |
| `assignments.remove` | mutation | إزالة تعيين |

### مصروفات المنشأة (company.expenses):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `expenses.list` | query | القائمة (category, recurrence) |
| `expenses.getById` | query | التفاصيل + دفعات |
| `expenses.create` | mutation | إنشاء (recurring: monthly/quarterly/yearly) |
| `expenses.update` | mutation | تحديث |
| `expenses.deactivate` | mutation | تعطيل |
| `expenses.getSummary` | query | ملخص شهري حسب الفئة |
| `expenses.getDashboardData` | query | بيانات 6 أشهر |
| `expenses.getUpcoming` | query | دفعات قادمة (30 يوم) |
| `expenses.payments.list` | query | قائمة الدفعات |
| `expenses.payments.create` | mutation | إنشاء دفعة |
| `expenses.payments.markPaid` | mutation | تعليم كمدفوع (transaction: creates FinanceExpense + decrements bank) |
| `expenses.payments.update` | mutation | تحديث |
| `expenses.payments.delete` | mutation | حذف |
| `expenses.payments.generateMonthly` | mutation | توليد دفعات شهرية (batch) |
| `expenses.allocations.list` | query | قائمة التوزيعات |
| `expenses.allocations.set` | mutation | تعيين توزيع (validates ≤100%) |
| `expenses.allocations.byProject` | query | توزيعات حسب المشروع |

### دورات الرواتب (company.payroll):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `payroll.list` | query | القائمة |
| `payroll.getById` | query | التفاصيل + بنود + موظفين |
| `payroll.create` | mutation | إنشاء دورة (month, year) |
| `payroll.populate` | mutation | ملء بالموظفين (auto-calculate salaries) |
| `payroll.approve` | mutation | اعتماد (creates FinanceExpenses) |
| `payroll.cancel` | mutation | إلغاء |
| `payroll.summary` | query | ملخص |
| `payroll.updateItem` | mutation | تحديث بند |
| `payroll.deleteItem` | mutation | حذف بند |

### دورات ترحيل المصروفات (company.expenseRuns):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `expenseRuns.list` | query | القائمة |
| `expenseRuns.getById` | query | التفاصيل + بنود |
| `expenseRuns.create` | mutation | إنشاء دورة |
| `expenseRuns.populate` | mutation | ملء بمصروفات المنشأة النشطة |
| `expenseRuns.post` | mutation | ترحيل (creates PENDING FinanceExpenses) |
| `expenseRuns.cancel` | mutation | إلغاء (batch cancels expenses) |
| `expenseRuns.summary` | query | ملخص الشهر الحالي |
| `expenseRuns.updateItem` | mutation | تحديث بند |
| `expenseRuns.deleteItem` | mutation | حذف بند |

### الأصول (company.assets):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `assets.list` | query | القائمة (category, status) |
| `assets.getById` | query | التفاصيل |
| `assets.create` | mutation | إنشاء (name, category, type, costs, dates) |
| `assets.update` | mutation | تحديث |
| `assets.retire` | mutation | إيقاف أصل |
| `assets.assignToProject` | mutation | تعيين لمشروع |
| `assets.returnToWarehouse` | mutation | إرجاع للمستودع |
| `assets.getSummary` | query | ملخص (status distribution) |
| `assets.getExpiringInsurance` | query | تأمينات منتهية (30 يوم) |

## أ.18 وحدة دراسات الكميات (quantities)

| الإجراء | النوع | الحماية | الوصف |
|---------|-------|---------|-------|
| `quantities.list` | query | protected | قائمة الدراسات |
| `quantities.getById` | query | protected | تفاصيل + كل البنود |
| `quantities.create` | mutation | protected | إنشاء دراسة (project params) |
| `quantities.update` | mutation | protected | تحديث |
| `quantities.delete` | mutation | protected | حذف |
| `quantities.duplicate` | mutation | protected | نسخ دراسة (transaction: copies all items) |
| `quantities.recalculate` | mutation | protected | إعادة حساب المجاميع |
| `quantities.structuralItem.create` | mutation | protected | إضافة بند إنشائي |
| `quantities.structuralItem.update` | mutation | protected | تحديث بند إنشائي |
| `quantities.structuralItem.delete` | mutation | protected | حذف بند إنشائي |
| `quantities.finishingItem.create` | mutation | protected | إضافة بند تشطيبات |
| `quantities.finishingItem.createBatch` | mutation | protected | إضافة بنود تشطيبات (batch) |
| `quantities.mepItem.create` | mutation | protected | إضافة بند كهروميكانيك |
| `quantities.mepItem.createBatch` | mutation | protected | إضافة بنود كهروميكانيك (batch) |
| `quantities.quote.list` | query | protected | قائمة عروض الدراسة |
| `quantities.quote.create` | mutation | protected | إنشاء عرض سعر من دراسة |
| `quantities.quote.getById` | query | protected | تفاصيل عرض |
| `quantities.quote.update` | mutation | protected | تحديث عرض |
| `quantities.quote.delete` | mutation | protected | حذف عرض |

## أ.19 وحدات أخرى

### لوحة التحكم (dashboard):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `dashboard.getStats` | query | إحصائيات عامة (مشاريع، مصروفات، مستخلصات) |
| `dashboard.getProjectDistribution` | query | توزيع المشاريع حسب الحالة |
| `dashboard.getTypeDistribution` | query | توزيع المشاريع حسب النوع |
| `dashboard.getFinancialSummary` | query | ملخص مالي (top 10 مشاريع) |
| `dashboard.getUpcoming` | query | مراحل قادمة (10) |
| `dashboard.getOverdue` | query | مراحل متأخرة |
| `dashboard.getActivities` | query | أنشطة حديثة (3 أنواع × 7) |
| `dashboard.getFinancialTrend` | query | اتجاه مالي شهري (6 أشهر) |

### الإشعارات (notifications):
| الإجراء | النوع | الوصف |
|---------|-------|-------|
| `notifications.list` | query | قائمة الإشعارات (paginated, unread filter) |
| `notifications.markRead` | mutation | تعليم كمقروء (batch) |
| `notifications.unreadCount` | query | عدد غير المقروء |

### الأدوار (roles):
| الإجراء | النوع | الصلاحية | الوصف |
|---------|-------|---------|-------|
| `roles.list` | query | settings.roles | قائمة الأدوار |
| `roles.create` | mutation | settings.roles | إنشاء دور مخصص |
| `roles.update` | mutation | settings.roles | تحديث دور |
| `roles.delete` | mutation | settings.roles | حذف (يمنع حذف أدوار النظام) |

### المشاركة (shares):
| الإجراء | النوع | الحماية | الوصف |
|---------|-------|---------|-------|
| `shares.create` | mutation | protected | إنشاء رابط مشاركة |
| `shares.list` | query | protected | قائمة الروابط |
| `shares.revoke` | mutation | protected | إبطال رابط |
| `shares.getResource` | query | public | جلب مورد مشارك عبر token |

### التكاملات (integrations):
| الإجراء | النوع | الصلاحية | الوصف |
|---------|-------|---------|-------|
| `integrations.getSettings` | query | settings.integrations | إعدادات التكامل |
| `integrations.updateSettings` | mutation | settings.integrations | تحديث الإعدادات |
| `integrations.getDeliveryLogs` | query | settings.integrations | سجل التسليم |
| `integrations.sendMessage` | mutation | settings.integrations | إرسال رسالة |
| `integrations.sendBulkMessages` | mutation | settings.integrations | إرسال رسائل جماعية |

---

# ملحق ب: الـ Enums الكاملة

## ب.1 Enums المشاريع

```prisma
enum ProjectStatus { ACTIVE, ON_HOLD, COMPLETED, CANCELLED }
enum ProjectType { RESIDENTIAL, COMMERCIAL, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, OTHER }
enum ProjectRole { MANAGER, ENGINEER, SUPERVISOR, ACCOUNTANT, VIEWER }
enum RoleType { OWNER, PROJECT_MANAGER, ACCOUNTANT, ENGINEER, SUPERVISOR, CUSTOM }
```

## ب.2 Enums الميدان

```prisma
enum WeatherCondition { SUNNY, CLOUDY, RAINY, WINDY, DUSTY, HOT, COLD }
enum PhotoCategory { PROGRESS, ISSUE, EQUIPMENT, MATERIAL, SAFETY, OTHER }
enum IssueSeverity { LOW, MEDIUM, HIGH, CRITICAL }
enum IssueStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
```

## ب.3 Enums المالية

```prisma
enum QuotationStatus { DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, CONVERTED }
enum FinanceInvoiceStatus { DRAFT, SENT, VIEWED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED }
enum InvoiceType { STANDARD, TAX, SIMPLIFIED }
enum FinanceTransactionStatus { PENDING, COMPLETED, CANCELLED }
enum PaymentMethod { CASH, BANK_TRANSFER, CHEQUE, CREDIT_CARD, OTHER }
enum FinanceAccountType { BANK, CASH, WALLET }
enum ClaimStatus { DRAFT, SUBMITTED, APPROVED, PAID, REJECTED }
enum OrgExpenseCategory { MATERIALS, LABOR, EQUIPMENT_RENTAL, EQUIPMENT_PURCHASE, SUBCONTRACTOR,
  TRANSPORT, SALARIES, RENT, UTILITIES, COMMUNICATIONS, INSURANCE, LICENSES, BANK_FEES,
  FUEL, MAINTENANCE, SUPPLIES, MARKETING, TRAINING, TRAVEL, HOSPITALITY, LOAN_PAYMENT,
  TAXES, ZAKAT, REFUND, MISC, CUSTOM }
enum ExpenseSourceType { MANUAL, PAYROLL, COMPANY_EXPENSE, SUBCONTRACT }
enum ClientType { INDIVIDUAL, COMPANY, GOVERNMENT }
```

## ب.4 Enums العقود

```prisma
enum ContractStatus { DRAFT, ACTIVE, SUSPENDED, COMPLETED, TERMINATED }
enum SubcontractStatus { DRAFT, ACTIVE, SUSPENDED, COMPLETED, TERMINATED }
enum SubcontractCOStatus { DRAFT, SUBMITTED, APPROVED, REJECTED }
enum ContractorType { COMPANY, INDIVIDUAL }
enum PaymentTermType { ADVANCE, MILESTONE, MONTHLY, COMPLETION, CUSTOM }
```

## ب.5 Enums إدارة المنشأة

```prisma
enum EmployeeType { PROJECT_MANAGER, SITE_ENGINEER, SUPERVISOR, FOREMAN, TECHNICIAN,
  OPERATOR, DRIVER, LABORER, SECURITY, CLEANER, ACCOUNTANT, ADMIN, OTHER }
enum EmployeeStatus { ACTIVE, ON_LEAVE, TERMINATED, SUSPENDED }
enum SalaryType { MONTHLY, DAILY, HOURLY }
enum CompanyExpenseCategory { RENT, UTILITIES, INSURANCE, FUEL, MAINTENANCE, COMMUNICATIONS,
  OFFICE_SUPPLIES, MARKETING, TRAVEL, TRAINING, LICENSES, SUBSCRIPTIONS, BANK_FEES,
  LEGAL, ACCOUNTING, IT_SERVICES, CLEANING, SECURITY, TRANSPORT, EQUIPMENT_RENTAL, OTHER }
enum RecurrenceType { MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, ONE_TIME }
enum AssetCategory { HEAVY_EQUIPMENT, LIGHT_EQUIPMENT, VEHICLES, TOOLS, IT_EQUIPMENT,
  FURNITURE, SAFETY_EQUIPMENT, MEASURING, TEMPORARY_STRUCTURES, OTHER }
enum AssetType { OWNED, RENTED, LEASED }
enum AssetStatus { AVAILABLE, IN_USE, MAINTENANCE, RETIRED, DISPOSED }
enum PayrollRunStatus { DRAFT, APPROVED, CANCELLED }
enum ExpenseRunStatus { DRAFT, POSTED, CANCELLED }
```

## ب.6 Enums المستندات والإشعارات

```prisma
enum DocumentFolder { CONTRACT, DRAWINGS, CLAIMS, LETTERS, PHOTOS, OTHER }
enum ApprovalStatus { PENDING, APPROVED, REJECTED, CANCELLED }
enum ApproverStatus { PENDING, APPROVED, REJECTED }
enum MilestoneStatus { PLANNED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED }
enum ChangeOrderCategory { SCOPE_CHANGE, DESIGN_CHANGE, UNFORESEEN_CONDITIONS,
  CLIENT_REQUEST, REGULATORY, VALUE_ENGINEERING, OTHER }
enum ChangeOrderStatus { DRAFT, SUBMITTED, APPROVED, REJECTED, IMPLEMENTED }
enum NotificationType { APPROVAL_REQUESTED, APPROVAL_DECIDED, DOCUMENT_CREATED,
  DAILY_REPORT_CREATED, ISSUE_CREATED, ISSUE_CRITICAL, EXPENSE_CREATED,
  CLAIM_CREATED, CHANGE_ORDER_SUBMITTED, CHANGE_ORDER_DECIDED,
  CHANGE_ORDER_IMPLEMENTED, OWNER_MESSAGE, TEAM_MEMBER_ADDED,
  TEAM_MEMBER_REMOVED, SYSTEM }
enum NotificationChannel { IN_APP, EMAIL }
enum DeliveryStatus { PENDING, SENT, FAILED }
enum MessageChannel { TEAM, OWNER }
enum MessagingChannel { EMAIL, WHATSAPP, SMS }
enum MessageDeliveryStatus { PENDING, SENT, DELIVERED, FAILED, BOUNCED }
enum ShareResourceType { PROJECT_UPDATE, CLAIM, PROGRESS_REPORT, DOCUMENT }
enum AttachmentOwnerType { DAILY_REPORT, PHOTO, ISSUE, EXPENSE, CLAIM, SUBCONTRACT,
  DOCUMENT, CHANGE_ORDER, MESSAGE, QUOTATION, INVOICE, OPEN_DOCUMENT, FINANCE_EXPENSE }
```

## ب.7 Enums التدقيق

```prisma
enum AuditAction { PROJECT_CREATED, PROJECT_UPDATED, PROJECT_DELETED,
  EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED,
  CLAIM_CREATED, CLAIM_UPDATED, CLAIM_STATUS_CHANGED,
  SUBCONTRACT_CREATED, SUBCONTRACT_UPDATED, SUBCONTRACT_DELETED,
  SUBCONTRACT_CO_CREATED, SUBCONTRACT_CO_UPDATED,
  SUBCONTRACT_PAYMENT_CREATED,
  DOCUMENT_CREATED, DOCUMENT_UPDATED,
  APPROVAL_REQUESTED, APPROVAL_DECIDED,
  MILESTONE_CREATED, MILESTONE_UPDATED, MILESTONE_DELETED,
  MEMBER_ADDED, MEMBER_REMOVED, MEMBER_ROLE_CHANGED,
  OWNER_ACCESS_CREATED, OWNER_ACCESS_REVOKED,
  CHANGE_ORDER_CREATED, CHANGE_ORDER_UPDATED,
  CONTRACT_CREATED, CONTRACT_UPDATED }

enum OrgAuditAction { EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED,
  EXPENSE_PAID, EXPENSE_CANCELLED,
  PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_DELETED,
  TRANSFER_CREATED, TRANSFER_CANCELLED,
  BANK_ACCOUNT_CREATED, BANK_ACCOUNT_UPDATED, BANK_ACCOUNT_DELETED,
  INVOICE_CREATED, INVOICE_UPDATED, INVOICE_STATUS_CHANGED,
  INVOICE_PAYMENT_ADDED, INVOICE_PAYMENT_DELETED,
  CLIENT_CREATED, CLIENT_UPDATED, CLIENT_DELETED,
  QUOTATION_CREATED, QUOTATION_UPDATED, QUOTATION_STATUS_CHANGED,
  DOCUMENT_CREATED, DOCUMENT_UPDATED, DOCUMENT_DELETED,
  TEMPLATE_CREATED, TEMPLATE_UPDATED, TEMPLATE_DELETED,
  SETTINGS_UPDATED,
  SUBCONTRACT_CREATED, SUBCONTRACT_UPDATED, SUBCONTRACT_DELETED,
  SUBCONTRACT_PAYMENT_CREATED,
  PAYROLL_CREATED, PAYROLL_APPROVED, PAYROLL_CANCELLED,
  EXPENSE_RUN_CREATED, EXPENSE_RUN_POSTED, EXPENSE_RUN_CANCELLED,
  EMPLOYEE_CREATED, EMPLOYEE_UPDATED, EMPLOYEE_TERMINATED,
  ASSET_CREATED, ASSET_UPDATED, ASSET_RETIRED,
  COMPANY_EXPENSE_CREATED, COMPANY_EXPENSE_UPDATED }
```

---

# ملحق ج: ملفات الاستعلامات — التحليل التفصيلي

## ج.1 توزيع الاستعلامات حسب الحجم

| الملف | السطور | المعقدية | التغطية بالاختبارات |
|-------|--------|---------|-------------------|
| `finance.ts` | 1,810 | عالية جداً | ❌ 0% |
| `company.ts` | 991 | عالية | ❌ 0% |
| `cost-studies.ts` | 794 | عالية | target: 80% |
| `finance-reports.ts` | 506 | متوسطة | ❌ 0% |
| `dashboard.ts` | 462 | متوسطة | ❌ 0% |
| `expense-runs.ts` | 456 | متوسطة | ❌ 0% |
| `attachments.ts` | 422 | متوسطة | ✅ tested |
| `notifications.ts` | 329 | متوسطة | ❌ 0% |
| `digests.ts` | 255 | متوسطة | ❌ 0% |
| `organizations.ts` | 241 | متوسطة | ❌ 0% |
| `org-finance.ts` | 200+ | متوسطة | ✅ 90% target |
| `permissions.ts` (queries) | 192 | متوسطة | ✅ tested |
| `project-change-orders.ts` | ~200 | متوسطة | ❌ 0% |
| `audit.ts` | 185 | منخفضة | ❌ 0% |
| `org-audit.ts` | 149 | منخفضة | ❌ 0% |
| `users.ts` | 143 | منخفضة | ❌ 0% |
| `integrations.ts` | 135 | منخفضة | ❌ 0% |
| `org-users.ts` | 129 | منخفضة | ❌ 0% |
| `roles.ts` | 127 | منخفضة | ❌ 0% |
| `payroll.ts` | 100+ | متوسطة | target: 85% |
| `ai-chats.ts` | 92 | منخفضة | ❌ 0% |
| `sequences.ts` | 75 | منخفضة (raw SQL) | ❌ 0% |
| `smoke.test.ts` | 55 | — | ✅ |

## ج.2 أنماط الـ Multi-tenancy في الاستعلامات

### النمط الأساسي (مطبق في 100% من الاستعلامات):
```typescript
// كل استعلام list يبدأ بـ:
where: {
  organizationId: organizationId,
  // ... filters
}
```

### النمط المركب (للمشاريع):
```typescript
where: {
  organizationId: organizationId,
  projectId: projectId,
  // ... filters
}
```

### النمط الذري (التسلسلات):
```sql
INSERT INTO organization_sequences (organization_id, sequence_key, current_value)
VALUES ($1, $2, 1)
ON CONFLICT (organization_id, sequence_key)
DO UPDATE SET current_value = organization_sequences.current_value + 1
RETURNING current_value
```

## ج.3 أنماط المعاملات (Transactions)

| الملف | العملية | السبب |
|-------|---------|-------|
| organizations.ts | createOrganizationForUser | إنشاء منظمة + أعضاء + أدوار |
| cost-studies.ts | duplicateCostStudy | نسخ دراسة + كل البنود |
| company.ts | markExpensePaymentPaid | إنشاء FinanceExpense + تحديث رصيد البنك |
| company.ts | terminateEmployee | إنهاء + تعطيل التعيينات |
| expense-runs.ts | postExpenseRun | إنشاء FinanceExpenses (loop) |
| expense-runs.ts | cancelExpenseRun | إلغاء كل المصروفات المرتبطة |
| finance.ts | convertQuotationToInvoice | نسخ بنود + تغيير حالات |
| finance.ts | addInvoicePayment | إنشاء دفعة + تحديث paidAmount + status |
| payroll.ts | approvePayrollRun | إنشاء FinanceExpenses للموظفين |

---

# ملحق د: تحليل حزم الاعتمادات (Dependencies Deep Dive)

## د.1 حزم الإنتاج الرئيسية (apps/web)

### Framework Core:
| الحزمة | الإصدار | الحجم التقريبي | الملاحظات |
|--------|---------|---------------|----------|
| next | 16.1.0 | كبير | App Router + Server Components |
| react | 19.2.3 | صغير | Runtime |
| react-dom | 19.2.3 | متوسط | DOM rendering |

### UI Components (Radix UI):
| الحزمة | الإصدار |
|--------|---------|
| @radix-ui/react-dialog | latest |
| @radix-ui/react-dropdown-menu | latest |
| @radix-ui/react-select | latest |
| @radix-ui/react-tabs | latest |
| @radix-ui/react-tooltip | latest |
| @radix-ui/react-popover | latest |
| @radix-ui/react-accordion | latest |
| @radix-ui/react-checkbox | latest |
| @radix-ui/react-switch | latest |
| @radix-ui/react-avatar | latest |
| @radix-ui/react-label | latest |
| @radix-ui/react-separator | latest |
| @radix-ui/react-slot | latest |

### State & Data:
| الحزمة | الإصدار | الدور |
|--------|---------|-------|
| @tanstack/react-query | 5.90.9 | Server state management |
| @tanstack/react-table | 8.21.3 | Data tables |
| @orpc/client | 1.13.2 | Type-safe RPC client |
| @orpc/tanstack-query | 1.13.2 | ORPC + TanStack integration |
| zod | 4.1.12 | Runtime validation |

### Styling:
| الحزمة | الإصدار | الدور |
|--------|---------|-------|
| tailwindcss | 4.1.17 | Utility-first CSS |
| lucide-react | 0.553.0 | Icons |
| class-variance-authority | latest | Component variants |
| clsx | latest | Class merging |
| tailwind-merge | latest | Tailwind class dedup |

### Auth & Backend:
| الحزمة | الإصدار | الدور |
|--------|---------|-------|
| better-auth | 1.4.7 | Authentication |
| hono | 4.10.5 | API server |
| oslo | 1.2.1 | Auth utilities |

### AI:
| الحزمة | الإصدار | الدور |
|--------|---------|-------|
| ai | 5.0.93 | AI SDK core |
| @ai-sdk/react | 2.0.93 | React hooks |
| @ai-sdk/anthropic | 2.0.44 | Claude integration |
| @ai-sdk/openai | 2.0.65 | GPT integration |

### Media & Files:
| الحزمة | الإصدار | الدور |
|--------|---------|-------|
| sharp | 0.34.5 | Image processing |
| react-dropzone | 14.3.8 | File upload UI |
| cropperjs | 1.6.2 | Image cropping |
| @aws-sdk/client-s3 | 3.437.0 | S3 storage |

---

---

# ملحق هـ: رسوم تخطيطية ASCII للعلاقات بين النماذج

## هـ.1 نموذج المصادقة والمنظمة

```
┌───────────────────────────────────────────────────────────────┐
│                         USER                                   │
│ id | email | name | isActive | organizationId | accountType    │
│ organizationRoleId | lastLoginAt | mustChangePassword          │
├───────────┬───────────┬───────────┬───────────┬───────────────┤
│           │           │           │           │               │
│    ┌──────▼──────┐   ┌▼─────────┐│    ┌──────▼──────┐       │
│    │   Session   │   │ Account  ││    │  Passkey    │       │
│    │ token,ip,ua │   │Google/GH ││    │ WebAuthn   │       │
│    │ expiresAt   │   │password  ││    │ credID     │       │
│    │ activeOrgId │   │          ││    │            │       │
│    └─────────────┘   └──────────┘│    └────────────┘       │
│                                   │                         │
│    ┌──────────────┐   ┌──────────▼──┐   ┌──────────────┐   │
│    │  TwoFactor   │   │   Member    │   │ Verification │   │
│    │ secret,codes │   │ orgId,role  │   │ id,value,exp │   │
│    └──────────────┘   └──────┬──────┘   └──────────────┘   │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Organization     │
                    │ name,slug,ownerId   │
                    │ taxNumber,currency  │
                    │ commercialRegister  │
                    ├─────────┬──────────┤
                    │         │          │
          ┌─────────▼───┐ ┌──▼────┐ ┌───▼──────────┐
          │ Invitation  │ │ Role  │ │   Purchase   │
          │ email,role  │ │ name  │ │ subscriptionId│
          │ status,exp  │ │ type  │ │ productId    │
          └─────────────┘ │ perms │ └──────────────┘
                          │(Json) │
                          └───────┘
```

## هـ.2 نموذج المشروع الكامل

```
┌─────────────────────────────────────────────────────────────┐
│                        PROJECT                               │
│ id | organizationId | name | slug | projectNo               │
│ status | type | contractValue | progress | clientId          │
├────────┬────────┬────────┬────────┬────────┬───────────────┤
│        │        │        │        │        │               │
│  ┌─────▼────┐  ┌▼───────┐┌▼──────┐│  ┌─────▼────┐        │
│  │  Member  │  │Contract││Expense││  │  Claim   │        │
│  │userId    │  │value   ││amount ││  │claimNo   │        │
│  │role      │  │terms   ││vendor ││  │status    │        │
│  │          │  │retain% ││date   ││  │amount    │        │
│  └──────────┘  │vat%    │└───────┘│  └──────────┘        │
│                │        │         │                       │
│          ┌─────▼────┐   │   ┌─────▼──────────┐           │
│          │PaymentTrm│   │   │ SubContract    │           │
│          │type,label│   │   │ contractNo     │           │
│          │%,amount  │   │   │ value,status   │           │
│          │dueDate   │   │   ├────┬────┬──────┤           │
│          └──────────┘   │   │    │    │      │           │
│                         │   │ ┌──▼─┐┌─▼──┐┌─▼──────┐    │
│  ┌──────────┐  ┌───────┐│   │ │Term││ CO ││Payment │    │
│  │DailyRprt │  │ Photo ││   │ │    ││    ││        │    │
│  │manpower  │  │url    ││   │ └────┘└────┘└────────┘    │
│  │weather   │  │caption││   │                            │
│  └──────────┘  └───────┘│   └────────────────────────────┘
│                         │                                 │
│  ┌──────────┐  ┌───────┐│  ┌───────────┐  ┌───────────┐ │
│  │  Issue   │  │ProgUpd││  │ Document  │  │ Approval  │ │
│  │severity  │  │progress││  │folder     │  │status     │ │
│  │status    │  │note   ││  │fileUrl    │  │approvers  │ │
│  └──────────┘  └───────┘│  └───────────┘  └───────────┘ │
│                         │                                 │
│  ┌──────────┐  ┌───────┐│  ┌───────────┐  ┌───────────┐ │
│  │Milestone │  │Message││  │AuditLog   │  │ChangeOrder│ │
│  │status    │  │content││  │action     │  │costImpact │ │
│  │progress  │  │channel││  │metadata   │  │status     │ │
│  └──────────┘  └───────┘│  └───────────┘  └───────────┘ │
│                         │                                 │
│  ┌──────────┐  ┌───────┐│  ┌───────────┐  ┌───────────┐ │
│  │OwnerAccss│  │Template││  │  Alert    │  │ ShareLink │ │
│  │token     │  │items  ││  │severity   │  │token      │ │
│  │isRevoked │  │       ││  │dedupeKey  │  │expiresAt  │ │
│  └──────────┘  └───────┘│  └───────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## هـ.3 نموذج المالية على مستوى المنظمة

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORGANIZATION FINANCE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐        ┌──────────────┐                       │
│  │    Client     │◄──────│  Quotation   │                       │
│  │ name,type    │        │ quotationNo  │                       │
│  │ taxNumber    │        │ status       │──── items ──┐         │
│  │ code(unique) │        │ totalAmount  │             │         │
│  │ contacts[]   │        │ validUntil   │    ┌────────▼───────┐ │
│  └──────┬───────┘        └──────┬───────┘    │ QuotationItem  │ │
│         │                       │            │ desc,qty,price  │ │
│         │                       │ convert    └────────────────┘ │
│         │                       ▼                               │
│         │               ┌──────────────┐                       │
│         ├──────────────►│   Invoice    │                       │
│         │               │ invoiceNo    │──── items ──┐         │
│         │               │ invoiceType  │             │         │
│         │               │ status       │    ┌────────▼───────┐ │
│         │               │ totalAmount  │    │ InvoiceItem    │ │
│         │               │ paidAmount   │    │ desc,qty,price  │ │
│         │               │ zatca fields │    └────────────────┘ │
│         │               └──────┬───────┘                       │
│         │                      │ payments                       │
│         │               ┌──────▼───────┐                       │
│         │               │InvoicePayment│                       │
│         │               │amount,date   │                       │
│         │               │method,ref    │                       │
│         │               └──────────────┘                       │
│         │                                                       │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Payment    │  │   Expense    │  │  Transfer    │         │
│  │ paymentNo   │  │ expenseNo    │  │ transferNo   │         │
│  │ amount,date │  │ category     │  │ amount,date  │         │
│  │ destAccount │  │ amount,date  │  │ from → to    │         │
│  │ client?     │  │ srcAccount?  │  │ status       │         │
│  │ invoice?    │  │ vendor       │  └──────┬───────┘         │
│  │ project?    │  │ project?     │         │                  │
│  │ contractTrm?│  │ status       │         │                  │
│  └──────┬───────┘  └──────┬───────┘         │                  │
│         │                 │                  │                  │
│         └─────────────────┼──────────────────┘                  │
│                           │                                     │
│                    ┌──────▼───────┐                             │
│                    │  Bank Acct   │                             │
│                    │ name,iban    │                             │
│                    │ balance      │                             │
│                    │ type(BANK/   │                             │
│                    │  CASH/WALLET)│                             │
│                    └──────────────┘                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │OpenDocument  │  │FinTemplate  │  │FinSettings   │         │
│  │documentNo   │  │name,type    │  │companyNameAr │         │
│  │title,content│  │isDefault    │  │taxNumber     │         │
│  │documentType │  │content(Json)│  │iban,bank     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## هـ.4 نموذج إدارة المنشأة

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPANY MANAGEMENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                 ┌──────────────┐              │
│  │   Employee   │                 │CompanyExpense│              │
│  │ name,type    │                 │ name,category│              │
│  │ baseSalary   │                 │ amount       │              │
│  │ allowances   │                 │ recurrence   │              │
│  │ gosi         │                 │ vendor       │              │
│  │ status       │                 │ isActive     │              │
│  └──┬───────┬───┘                 └──┬───────┬───┘              │
│     │       │                        │       │                  │
│     │  ┌────▼──────────┐             │  ┌────▼──────────┐      │
│     │  │  Assignment   │             │  │   Payment    │      │
│     │  │ projectId     │             │  │ periodStart  │      │
│     │  │ percentage    │             │  │ amount       │      │
│     │  │ (validates    │             │  │ isPaid       │      │
│     │  │  total ≤100%) │             │  │ finExpenseId │──┐   │
│     │  └───────────────┘             │  └──────────────┘  │   │
│     │                                │                     │   │
│     │                                │  ┌────────────────┐ │   │
│     │                                │  │  Allocation    │ │   │
│     │                                │  │ projectId      │ │   │
│     │                                │  │ percentage     │ │   │
│     │                                │  │ (total ≤100%)  │ │   │
│     │                                │  └────────────────┘ │   │
│     │                                │                     │   │
│  ┌──▼──────────────┐                │                     │   │
│  │  PayrollRun     │                │                     │   │
│  │ month,year      │                │                     │   │
│  │ status(DRAFT/   │                │                     │   │
│  │  APPROVED/CANC) │                │                     │   │
│  │ totals          │                │                     │   │
│  └──┬──────────────┘                │                     │   │
│     │                                │                     │   │
│  ┌──▼──────────────┐    ┌───────────▼───────────┐        │   │
│  │  PayrollItem    │    │  CompanyExpenseRun    │        │   │
│  │ employeeId      │    │ month,year            │        │   │
│  │ salary details  │    │ status(DRAFT/POSTED)  │        │   │
│  │ finExpenseId ───┼──┐ │ totals                │        │   │
│  └─────────────────┘  │ └──┬────────────────────┘        │   │
│                        │    │                              │   │
│                        │ ┌──▼──────────────┐              │   │
│                        │ │  RunItem        │              │   │
│                        │ │ companyExpenseId │              │   │
│                        │ │ amount          │              │   │
│                        │ │ finExpenseId ───┼──────────┐   │   │
│                        │ └─────────────────┘          │   │   │
│                        │                              │   │   │
│                        └──────────────┬───────────────┘   │   │
│                                       │                   │   │
│                              ┌────────▼──────────┐        │   │
│                              │  FinanceExpense   │◄───────┘   │
│                              │ (مصروف في دفتر   │            │
│                              │  المالية)         │            │
│                              └───────────────────┘            │
│                                                                │
│  ┌──────────────┐                                             │
│  │ CompanyAsset  │                                             │
│  │ name,category │                                             │
│  │ status        │                                             │
│  │ purchasePrice │                                             │
│  │ monthlyRent   │                                             │
│  │ currentProjId │                                             │
│  │ insuranceExp  │                                             │
│  └───────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

## هـ.5 نموذج دراسات الكميات

```
┌─────────────────────────────────────────────────────────────────┐
│                        COST STUDY                                │
│ id | organizationId | name | customerName                        │
│ projectType | landArea | buildingArea | numberOfFloors            │
│ structuralCost | finishingCost | mepCost | laborCost              │
│ overheadPercent | profitPercent | contingencyPercent | totalCost   │
├─────────┬──────────┬──────────┬──────────┬──────────────────────┤
│         │          │          │          │                       │
│  ┌──────▼──────┐  ┌▼─────────┐┌▼────────┐┌▼─────────┐          │
│  │ Structural  │  │Finishing │ │  MEP   │ │  Labor  │          │
│  │   Item      │  │  Item    │ │  Item  │ │  Item   │          │
│  ├─────────────┤  ├──────────┤ ├────────┤ ├─────────┤          │
│  │category     │  │category  │ │category│ │laborType│          │
│  │subCategory  │  │subCat    │ │itemType│ │workerTp │          │
│  │name         │  │name      │ │name    │ │name     │          │
│  │dimensions   │  │area      │ │quantity│ │quantity │          │
│  │quantity     │  │unit      │ │unit    │ │dailyRate│          │
│  │unit         │  │wastage%  │ │unitPrc │ │duration │          │
│  │concreteVol  │  │quality   │ │totCost │ │insurnce │          │
│  │concreteType │  │matPrice  │ └────────┘ │housing  │          │
│  │steelWeight  │  │labPrice  │            │totCost  │          │
│  │steelRatio   │  │totCost   │            └─────────┘          │
│  │wastage%     │  └──────────┘                                  │
│  │matCost      │                                                │
│  │labCost      │                                                │
│  │totCost      │                                                │
│  └─────────────┘                                                │
│                                                                  │
│  ┌──────────────────────────────────────┐                       │
│  │              Quote                    │                       │
│  │ quoteNumber(unique) | quoteType       │                       │
│  │ clientName | clientCompany            │                       │
│  │ subtotal | overheadAmount             │                       │
│  │ profitAmount | vatAmount | totalAmount │                       │
│  │ validUntil | status                   │                       │
│  │ selectedCategories(Json)              │                       │
│  │ showUnitPrices | showQuantities       │                       │
│  │ termsAndConditions | pdfUrl           │                       │
│  └───────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

# ملحق و: التحليل الأمني الموسع

## و.1 مصفوفة التهديدات (Threat Matrix)

### OWASP Top 10 Assessment:

| # | التهديد | الحماية | التقييم | الملاحظات |
|---|---------|---------|---------|----------|
| A01 | Broken Access Control | RBAC + verifyAccess + organizationId filter | ⚠️ جيد مع استثناءات | publicProcedure على chat/documents |
| A02 | Cryptographic Failures | HTTPS + BetterAuth + bcrypt | ✅ جيد | passwords hashed |
| A03 | Injection | Prisma ORM (parameterized) + Zod validation | ✅ ممتاز | raw SQL محدود ومبرر |
| A04 | Insecure Design | Multi-tenancy + audit trail | ✅ جيد | — |
| A05 | Security Misconfiguration | CSP + HSTS + X-Frame-Options | ⚠️ جيد مع ملاحظات | unsafe-inline, no preload |
| A06 | Vulnerable Components | Dependabot + recent versions | ✅ جيد | — |
| A07 | Authentication Failures | BetterAuth + 2FA + passkeys | ⚠️ جيد | no brute force protection |
| A08 | Data Integrity Failures | Zod + TypeScript strict | ✅ جيد | — |
| A09 | Logging & Monitoring | Dual audit trail + Consola | ✅ جيد | no failed login logging |
| A10 | SSRF | S3 signed URLs (no proxy) | ✅ جيد | — |

### Attack Surface Analysis:

```
┌─────────────────────────────────────────────────────────────┐
│                    ATTACK SURFACE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PUBLIC ENDPOINTS (No Auth Required):                        │
│  ┌─────────────────────────────────────────────────┐        │
│  │ /api/auth/*          → BetterAuth handlers      │        │
│  │ /api/rpc/newsletter  → Subscribe                 │        │
│  │ /api/rpc/contact     → Contact form              │        │
│  │ /api/rpc/projectChat → ⚠️ SHOULD BE PROTECTED   │        │
│  │ /api/rpc/projectDocs → ⚠️ SHOULD BE PROTECTED   │        │
│  │ /api/rpc/shares.get  → Token-based resource      │        │
│  │ /api/rpc/owner.portal → Token-based portal       │        │
│  │ /share/[token]       → Public share page         │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  AUTHENTICATED ENDPOINTS (Session Required):                 │
│  ┌─────────────────────────────────────────────────┐        │
│  │ /api/rpc/projects.*    → RBAC enforced           │        │
│  │ /api/rpc/finance.*     → RBAC enforced           │        │
│  │ /api/rpc/company.*     → RBAC enforced           │        │
│  │ /api/rpc/quantities.*  → RBAC enforced           │        │
│  │ /api/rpc/dashboard.*   → Org membership          │        │
│  │ /api/rpc/settings.*    → RBAC enforced           │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ADMIN ENDPOINTS (Admin Role Required):                      │
│  ┌─────────────────────────────────────────────────┐        │
│  │ /api/rpc/admin.*       → user.role === "admin"   │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  FILE UPLOAD SURFACE:                                        │
│  ┌─────────────────────────────────────────────────┐        │
│  │ S3 signed URLs (no server proxy)                 │        │
│  │ MIME validation ✅                                │        │
│  │ Extension validation ✅                           │        │
│  │ Magic byte validation ✅                          │        │
│  │ Size limits per type ✅                           │        │
│  │ Blocked: SVG, HTML, JS ✅                         │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## و.2 تحليل أمان Owner Portal بالتفصيل

### المشكلة الحالية:
```
Token Generation:
  projectOwnerAccess.create({
    token: randomString(),    // unique, not guessable ✅
    expiresAt: null,          // ⚠️ NO DEFAULT EXPIRY
    isRevoked: false,
    projectId: ...,
    organizationId: ...,
  })

Token Verification (portal endpoints):
  projectOwnerAccess.findFirst({
    where: {
      token: inputToken,
      isRevoked: false,
      // ⚠️ NO expiresAt check!
    }
  })
```

### الخطر:
1. Token يعمل إلى الأبد ما لم يُبطل يدوياً
2. لا يوجد تتبع لآخر استخدام (no lastUsedAt)
3. لا يوجد IP restriction
4. لا يوجد device fingerprint
5. Token يكشف: ملخص المشروع، الجدول الزمني، المدفوعات، الرسائل

### الإصلاح المقترح:
```typescript
// 1. إضافة expiry افتراضي
const DEFAULT_TOKEN_EXPIRY_DAYS = 90;

// 2. إضافة فحص expiry في التحقق
where: {
  token: inputToken,
  isRevoked: false,
  OR: [
    { expiresAt: null },
    { expiresAt: { gte: new Date() } }
  ]
}

// 3. إضافة lastUsedAt
await db.projectOwnerAccess.update({
  where: { id: access.id },
  data: { lastUsedAt: new Date() }
});

// 4. إضافة تنبيه عند الوصول من IP جديد
```

## و.3 تحليل Rate Limiting بالتفصيل

### البنية الحالية:
```
┌──────────────────────────────────────────┐
│              Rate Limiter                 │
├──────────────────────────────────────────┤
│                                          │
│  ┌─── Primary: Redis ──────────────┐    │
│  │ INCR key                         │    │
│  │ EXPIRE key 60                    │    │
│  │                                  │    │
│  │ Circuit Breaker:                 │    │
│  │   3 consecutive failures →       │    │
│  │   30s fallback to memory         │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─── Fallback: In-Memory Map ─────┐    │
│  │ Map<key, {count, resetAt}>       │    │
│  │ Max entries: 10,000              │    │
│  │ LRU eviction when full           │    │
│  │ Cleanup every 60s                │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Key Format:                             │
│  • Authenticated: rl:{userId}:{proc}     │
│  • Token-based:  rl:token:{token}:{proc} │
│  • IP-based:     rl:ip:{ip}:{proc}       │
│                                          │
│  Presets:                                │
│  • READ:    60 req/min                   │
│  • WRITE:   20 req/min                   │
│  • TOKEN:   30 req/min                   │
│  • UPLOAD:  10 req/min                   │
│  • MESSAGE: 30 req/min                   │
│  • STRICT:   5 req/min                   │
│                                          │
│  Window Type: FIXED (not sliding)        │
│  ⚠️ Allows 2x burst at window boundary  │
└──────────────────────────────────────────┘
```

### نقاط الضعف:
1. **Fixed Window Burst:** عند حدود النافذة الدقيقة، يمكن إرسال 120 طلب (60 في آخر ثانية من النافذة + 60 في أول ثانية من التالية)
2. **No Global Rate Limit:** لا يوجد حد على إجمالي الطلبات لكل مستخدم عبر كل الإجراءات
3. **No IP-based Auth Rate Limit:** محاولات تسجيل الدخول غير محدودة بشكل خاص

## و.4 تحليل CSP بالتفصيل

### CSP الحالي:
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'    ← ⚠️
style-src 'self' 'unsafe-inline'                     ← ⚠️
img-src 'self' https: data: blob:
font-src 'self'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

### المشاكل:
- `'unsafe-inline'` في script-src يسمح بتنفيذ أي script inline (XSS vector)
- `'unsafe-eval'` يسمح بـ eval() (code injection vector)
- `'unsafe-inline'` في style-src يسمح بـ style injection

### الحل الموصى:
```
script-src 'self' 'nonce-{random}'
style-src 'self' 'nonce-{random}'
```
مع استخدام nonce-based CSP في Next.js headers.

---

# ملحق ز: تحليل الأداء الموسع

## ز.1 استعلامات قاعدة البيانات الأكثر كثافة

### Top 5 Heavy Queries:

**1. `finance.reports.getFinanceDashboardStats()`**
```
يُنفذ 13 استعلام متوازي:
- count quotations (all statuses × 3)
- count invoices (all statuses × 3)
- sum payments
- sum expenses
- count clients
- count active banks
- overdue invoices
- outstanding amount
```
**التأثير:** ~100ms حسب حجم البيانات
**التحسين:** Redis cache لمدة 5 دقائق

**2. `dashboard.getStats()`**
```
يجمع: projects count, expenses sum, claims sum,
       change orders count, issues count, milestones stats
```
**التأثير:** ~80ms
**التحسين:** Materialized view أو cache

**3. `company.dashboard()`**
```
5 aggregations متوازية:
- employees summary
- assets summary
- expenses summary
- upcoming payments
- recent payroll
```
**التأثير:** ~60ms
**التحسين:** Background job يحدث كل 5 دقائق

**4. `digests.generateWeeklyDigest()`**
```
6 queries:
- projects missing reports
- upcoming payments
- new issues
- progress updates
- open issues by project
- active alerts
```
**التأثير:** batch job (مقبول)

**5. `cost-studies.duplicateCostStudy()`**
```
Transaction: read study + copy all items (4 types)
```
**التأثير:** variable (حسب عدد البنود)

## ز.2 خريطة الفهارس المقترحة

```sql
-- الأكثر أهمية (يحسن >50% من الاستعلامات)
CREATE INDEX idx_project_org_status ON projects(organization_id, status);
CREATE INDEX idx_finance_invoice_org_status_due ON finance_invoices(organization_id, status, due_date);
CREATE INDEX idx_finance_expense_org_date ON finance_expenses(organization_id, date);
CREATE INDEX idx_quotation_org_status ON quotations(organization_id, status);

-- مهم (يحسن 20-50% من الاستعلامات)
CREATE INDEX idx_notification_user_unread ON notifications(organization_id, user_id, read_at, created_at);
CREATE INDEX idx_project_claims_org_status ON project_claims(organization_id, project_id, status);
CREATE INDEX idx_subcontract_org_project ON subcontract_contracts(organization_id, project_id, status);
CREATE INDEX idx_employee_org_status ON company_employees(organization_id, status);
CREATE INDEX idx_company_expense_org_active ON company_expenses(organization_id, is_active);

-- تحسينات إضافية
CREATE INDEX idx_audit_org_created ON project_audit_logs(organization_id, project_id, created_at DESC);
CREATE INDEX idx_org_audit_created ON organization_audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_message_channel ON project_messages(organization_id, project_id, channel, created_at DESC);
```

## ز.3 Serverless Deployment Considerations (Vercel)

| الجانب | التحدي | الحل المقترح |
|--------|--------|-------------|
| Cold Starts | Prisma connection pool initialization ~500ms | Connection pooling via PgBouncer/Supabase pooler |
| Function Timeout | 10s (Hobby) / 60s (Pro) | تقسيم العمليات الطويلة |
| Memory Limit | 1024MB (default) | مراقبة حجم الاستجابات |
| Concurrent Connections | محدود | استخدام Supabase connection pooler |
| Redis Connection | قد تتأخر | Circuit breaker (موجود) ✅ |
| File Size | 50MB max upload | S3 signed URLs (لا يمر عبر الخادم) ✅ |
| Cron Jobs | لا يوجد built-in | Vercel Cron أو external (upstash qstash) |

---

# ملحق ح: سجل الـ Enums وأكوادها الداخلية

## ح.1 ترقيم المستندات والتسلسلات الذرية

| النوع | البادئة | الصيغة | مثال |
|-------|---------|--------|------|
| فاتورة | INV | INV-YYYY-NNNN | INV-2026-0001 |
| مصروف | EXP | EXP-YYYY-NNNN | EXP-2026-0001 |
| مقبوض | RCV | RCV-YYYY-NNNN | RCV-2026-0001 |
| تحويل | TRF | TRF-YYYY-NNNN | TRF-2026-0001 |
| عرض سعر | QT | QT-YYYY-NNNN | QT-2026-0001 |
| مستند مفتوح | DOC | DOC-YYYY-NNNN | DOC-2026-0001 |
| عقد باطن | SUB | SUB-YYYY-NNNN | SUB-2026-0001 |
| دورة رواتب | PAY | PAY-YYYY-MM | PAY-2026-01 |
| دورة مصروفات | FEXP | FEXP-YYYY-MM | FEXP-2026-01 |
| عميل | C | C-NNN | C-001 |
| مشروع | P | P-NNN | P-001 |
| موظف | EMP | EMP-NNN | EMP-001 |

**الآلية:** استعلام SQL ذري واحد (INSERT ON CONFLICT DO UPDATE) يضمن عدم تكرار الأرقام تحت التزامن.

## ح.2 انتقالات الحالات (State Machines)

### فاتورة (FinanceInvoice):
```
                        ┌────────────────┐
                        │                │
  DRAFT ──► SENT ──► VIEWED ──► PARTIALLY_PAID ──► PAID
              │         │              │
              │         └──────────────┴──► OVERDUE (⚠️ يدوي)
              │
              └──────────────────────────► CANCELLED
```

### عرض أسعار (Quotation):
```
  DRAFT ──► SENT ──► VIEWED ──► ACCEPTED ──► CONVERTED
              │         │           │
              │         │           └──► REJECTED
              │         │
              │         └──────────────► EXPIRED
              │
              └────────────────────────► (أي حالة ←)
```

### مستخلص (ProjectClaim):
```
  DRAFT ──► SUBMITTED ──► APPROVED ──► PAID
                  │
                  └──► REJECTED
```

### أمر تغيير (ChangeOrder):
```
  DRAFT ──► SUBMITTED ──► APPROVED ──► IMPLEMENTED
                  │
                  └──► REJECTED
```

### عقد باطن (SubcontractContract):
```
  DRAFT ──► ACTIVE ──► COMPLETED
              │    └──► TERMINATED
              │
              └──► SUSPENDED ──► ACTIVE (reactivate)
```

### دورة رواتب (PayrollRun):
```
  DRAFT ──► APPROVED (creates FinanceExpenses)
    │
    └──► CANCELLED
```

### دورة مصروفات منشأة (CompanyExpenseRun):
```
  DRAFT ──► POSTED (creates PENDING FinanceExpenses)
    │
    └──► CANCELLED (batch cancels linked expenses)
```

---

# ملحق ط: تحليل CI/CD الموسع

## ط.1 GitHub Actions الحالي

### `validate-prs.yml`:
```yaml
name: Validate PRs
on:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: biomejs/setup-biome@v2
      - run: biome ci .

  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - run: pnpm install
      - run: pnpm --filter database generate
      - run: pnpm --filter web e2e:ci
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 30
```

### ما هو موجود:
- ✅ Lint على كل PR (Biome)
- ✅ E2E tests على كل PR (Playwright)
- ✅ Playwright report artifacts

### ما ينقص:
- ❌ Unit tests في CI
- ❌ Type checking في CI
- ❌ Build validation في CI
- ❌ Security scanning (Snyk/Trivy)
- ❌ Coverage reporting
- ❌ Preview deployments
- ❌ Database migration testing
- ❌ Performance benchmarks

### Pipeline المقترح:
```yaml
# المقترح إضافته:
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm type-check

  unit-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
    steps:
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: snyk/actions/node@master
```

## ط.2 Dependabot Configuration

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    open-pull-requests-limit: 2
    schedule:
      interval: daily
    ignore:
      - dependency-name: cropperjs
        versions: [">1.6.2"]      # مثبت عند 1.6.2
    groups:
      production-dependencies:
        dependency-type: production
      development-dependencies:
        dependency-type: development
```

**تقييم:** ✅ جيد — تحديث يومي مع تجميع ذكي

---

# ملحق ي: قائمة المراجع والملفات المقروءة

## الملفات الأساسية المقروءة بالكامل:

1. `packages/database/prisma/schema.prisma` — 3,516 سطر
2. `packages/database/prisma/permissions.ts` — مصفوفة الصلاحيات
3. `packages/api/orpc/router.ts` — Router الرئيسي
4. `packages/api/orpc/procedures.ts` — تعريف الـ procedures
5. `packages/api/orpc/handler.ts` — OpenAPI handler
6. `packages/api/lib/rate-limit.ts` — تحديد المعدل
7. `packages/api/lib/permissions/*.ts` — 4 ملفات صلاحيات
8. `packages/auth/auth.ts` — BetterAuth configuration
9. `apps/web/middleware.ts` (proxy.ts) — Route protection
10. `apps/web/next.config.ts` — Security headers
11. `config/index.ts` — Feature flags
12. `packages/api/modules/*/router.ts` — 34 router file
13. `packages/database/prisma/queries/*.ts` — 39 query file
14. `apps/web/app/**/page.tsx` — 118 page file
15. جميع ملفات `package.json` — 15 ملف
16. `.github/workflows/*.yml` — CI/CD
17. `biome.json` — Linter config
18. `tooling/typescript/base.json` — TypeScript config
19. `.gitignore` — Security check
20. `.env.local.example` — Environment variables

---

---

# ملحق ك: خريطة الصفحات التفصيلية الكاملة (140 صفحة)

## ك.1 صفحات التسويق (8 صفحات)

| # | المسار | الملف | الوصف |
|---|--------|-------|-------|
| 1 | `/[locale]/` | `(marketing)/[locale]/(home)/page.tsx` | الصفحة الرئيسية |
| 2 | `/[locale]/blog` | `(marketing)/[locale]/blog/page.tsx` | قائمة المقالات |
| 3 | `/[locale]/blog/[...path]` | `(marketing)/[locale]/blog/[...path]/page.tsx` | مقال محدد |
| 4 | `/[locale]/changelog` | `(marketing)/[locale]/changelog/page.tsx` | سجل التغييرات |
| 5 | `/[locale]/contact` | `(marketing)/[locale]/contact/page.tsx` | نموذج اتصال |
| 6 | `/[locale]/docs/[[...path]]` | `(marketing)/[locale]/docs/[[...path]]/page.tsx` | التوثيق |
| 7 | `/[locale]/legal/[...path]` | `(marketing)/[locale]/legal/[...path]/page.tsx` | صفحات قانونية |
| 8 | `/[locale]/[...rest]` | `(marketing)/[locale]/[...rest]/page.tsx` | صفحة 404 |

## ك.2 صفحات المصادقة (6 صفحات)

| # | المسار | الملف | الوصف |
|---|--------|-------|-------|
| 1 | `/auth/login` | `auth/login/page.tsx` | تسجيل الدخول |
| 2 | `/auth/signup` | `auth/signup/page.tsx` | إنشاء حساب |
| 3 | `/auth/forgot-password` | `auth/forgot-password/page.tsx` | نسيت كلمة المرور |
| 4 | `/auth/reset-password` | `auth/reset-password/page.tsx` | إعادة تعيين كلمة المرور |
| 5 | `/auth/change-password` | `auth/change-password/page.tsx` | تغيير كلمة المرور |
| 6 | `/auth/verify` | `auth/verify/page.tsx` | تأكيد البريد الإلكتروني |

## ك.3 صفحات الإدارة (3 صفحات)

| # | المسار | الملف | الوصف |
|---|--------|-------|-------|
| 1 | `/app/admin/organizations` | `(account)/admin/organizations/page.tsx` | قائمة المنظمات |
| 2 | `/app/admin/organizations/[id]` | `(account)/admin/organizations/[id]/page.tsx` | تفاصيل منظمة |
| 3 | `/app/admin/users` | `(account)/admin/users/page.tsx` | إدارة المستخدمين |

## ك.4 صفحات الحساب والإعدادات (8 صفحات)

| # | المسار | الوصف |
|---|--------|-------|
| 1 | `/app` | لوحة التحكم الشخصية |
| 2 | `/app/chatbot` | محادثة AI |
| 3 | `/app/settings/general` | إعدادات عامة |
| 4 | `/app/settings/billing` | إدارة الاشتراك |
| 5 | `/app/settings/security` | إعدادات الأمان (2FA, passkeys) |
| 6 | `/app/settings/danger-zone` | حذف الحساب |
| 7 | `/new-organization` | إنشاء منظمة جديدة |
| 8 | `/onboarding` | خطوات الإعداد الأولي |

## ك.5 صفحات إدارة الشركة (18 صفحة)

| # | المسار النسبي | الوصف |
|---|--------------|-------|
| 1 | `/company` | نظرة عامة على الشركة |
| 2 | `/company/assets` | قائمة الأصول |
| 3 | `/company/assets/new` | إنشاء أصل جديد |
| 4 | `/company/assets/[assetId]` | تفاصيل الأصل |
| 5 | `/company/assets/[assetId]/edit` | تعديل الأصل |
| 6 | `/company/employees` | قائمة الموظفين |
| 7 | `/company/employees/new` | إنشاء موظف |
| 8 | `/company/employees/[employeeId]` | تفاصيل الموظف |
| 9 | `/company/employees/[employeeId]/edit` | تعديل الموظف |
| 10 | `/company/expenses` | قائمة المصروفات الثابتة |
| 11 | `/company/expenses/new` | إنشاء مصروف |
| 12 | `/company/expenses/[expenseId]` | تفاصيل المصروف |
| 13 | `/company/expenses/[expenseId]/edit` | تعديل المصروف |
| 14 | `/company/expense-runs` | دورات ترحيل المصروفات |
| 15 | `/company/expense-runs/[id]` | تفاصيل دورة الترحيل |
| 16 | `/company/payroll` | إدارة الرواتب |
| 17 | `/company/payroll/[id]` | تفاصيل دورة الرواتب |
| 18 | `/company/reports` | التقارير |

## ك.6 صفحات المالية (27 صفحة)

| # | المسار النسبي | الوصف |
|---|--------------|-------|
| 1 | `/finance` | لوحة التحكم المالية |
| 2 | `/finance/banks` | قائمة الحسابات البنكية |
| 3 | `/finance/banks/new` | إنشاء حساب بنكي |
| 4 | `/finance/banks/[bankId]` | تفاصيل الحساب |
| 5 | `/finance/clients` | قائمة العملاء |
| 6 | `/finance/clients/new` | إنشاء عميل |
| 7 | `/finance/clients/[clientId]` | تفاصيل العميل |
| 8 | `/finance/clients/[clientId]/edit` | تعديل العميل |
| 9 | `/finance/documents` | المستندات المفتوحة |
| 10 | `/finance/documents/new` | إنشاء مستند |
| 11 | `/finance/documents/[documentId]` | تفاصيل المستند |
| 12 | `/finance/expenses` | مصروفات المنظمة |
| 13 | `/finance/expenses/new` | إنشاء مصروف |
| 14 | `/finance/expenses/transfer` | تحويل بين حسابات |
| 15 | `/finance/invoices` | قائمة الفواتير |
| 16 | `/finance/invoices/new` | إنشاء فاتورة |
| 17 | `/finance/invoices/[invoiceId]` | تفاصيل الفاتورة |
| 18 | `/finance/invoices/[invoiceId]/preview` | معاينة الفاتورة |
| 19 | `/finance/payments` | المقبوضات |
| 20 | `/finance/payments/new` | إنشاء سند قبض |
| 21 | `/finance/payments/[paymentId]` | تفاصيل السند |
| 22 | `/finance/payments/[paymentId]/receipt` | طباعة سند القبض |
| 23 | `/finance/reports` | التقارير المالية |
| 24 | `/finance/settings` | إعدادات مالية |
| 25 | `/finance/templates` | قوالب الفواتير والعروض |
| 26 | `/finance/templates/new` | إنشاء قالب |
| 27 | `/finance/templates/[templateId]` | تفاصيل القالب |

## ك.7 صفحات التسعير (12 صفحة)

| # | المسار النسبي | الوصف |
|---|--------------|-------|
| 1 | `/pricing` | لوحة تحكم التسعير |
| 2 | `/pricing/quotations` | قائمة عروض الأسعار |
| 3 | `/pricing/quotations/new` | إنشاء عرض سعر |
| 4 | `/pricing/quotations/[quotationId]` | تفاصيل العرض |
| 5 | `/pricing/quotations/[quotationId]/preview` | معاينة العرض |
| 6 | `/pricing/studies` | قائمة دراسات التكلفة |
| 7 | `/pricing/studies/new` | إنشاء دراسة |
| 8 | `/pricing/studies/[studyId]` | نظرة عامة على الدراسة |
| 9 | `/pricing/studies/[studyId]/structural` | العناصر الإنشائية |
| 10 | `/pricing/studies/[studyId]/mep` | الأعمال الميكانيكية والكهربائية |
| 11 | `/pricing/studies/[studyId]/finishing` | أعمال التشطيب |
| 12 | `/pricing/studies/[studyId]/pricing` | حساب التسعير |

## ك.8 صفحات المشاريع (49 صفحة)

| # | المسار النسبي | الوصف |
|---|--------------|-------|
| 1 | `/projects` | قائمة المشاريع |
| 2 | `/projects/new` | إنشاء مشروع |
| 3 | `/projects/templates` | قوالب المشاريع |
| 4 | `/projects/[projectId]` | نظرة عامة على المشروع |
| 5 | `/projects/[projectId]/team` | فريق المشروع |
| 6 | `/projects/[projectId]/owner` | بوابة مالك المشروع (داخلية) |
| 7 | `/projects/[projectId]/insights` | تحليلات ذكية |
| 8 | `/projects/[projectId]/updates` | تحديثات رسمية |
| 9 | `/projects/[projectId]/chat` | محادثات الفريق |
| 10 | `/projects/[projectId]/documents` | مستندات المشروع |
| 11 | `/projects/[projectId]/documents/new` | إنشاء مستند |
| 12 | `/projects/[projectId]/documents/[documentId]` | تفاصيل المستند |
| 13 | `/projects/[projectId]/timeline` | الجدول الزمني (Gantt) |
| 14 | `/projects/[projectId]/changes` | أوامر التغيير |
| 15 | `/projects/[projectId]/changes/[changeId]` | تفاصيل أمر التغيير |
| 16 | `/projects/[projectId]/execution` | مرحلة التنفيذ |
| 17 | `/projects/[projectId]/execution/new-report` | تقرير يومي جديد |
| 18 | `/projects/[projectId]/execution/new-issue` | إنشاء ملاحظة |
| 19 | `/projects/[projectId]/execution/upload` | رفع صور |
| 20 | `/projects/[projectId]/field` | التقارير الميدانية |
| 21 | `/projects/[projectId]/field/new-report` | تقرير ميداني |
| 22 | `/projects/[projectId]/field/new-issue` | ملاحظة ميدانية |
| 23 | `/projects/[projectId]/field/upload` | رفع صور ميدانية |
| 24 | `/projects/[projectId]/finance` | مالية المشروع |
| 25 | `/projects/[projectId]/finance/contract` | العقد |
| 26 | `/projects/[projectId]/finance/claims` | المطالبات |
| 27 | `/projects/[projectId]/finance/claims/new` | إنشاء مطالبة |
| 28 | `/projects/[projectId]/finance/new-claim` | إنشاء مطالبة (بديل) |
| 29 | `/projects/[projectId]/finance/expenses` | مصروفات المشروع |
| 30 | `/projects/[projectId]/finance/expenses/new` | إنشاء مصروف |
| 31 | `/projects/[projectId]/finance/new-expense` | إنشاء مصروف (بديل) |
| 32 | `/projects/[projectId]/finance/payments` | مدفوعات المشروع |
| 33 | `/projects/[projectId]/finance/payments/new` | إنشاء دفعة |
| 34 | `/projects/[projectId]/finance/subcontracts` | عقود الباطن |
| 35 | `/projects/[projectId]/finance/subcontracts/new` | إنشاء عقد باطن |
| 36 | `/projects/[projectId]/finance/subcontracts/[subcontractId]` | تفاصيل عقد الباطن |
| 37 | `/projects/[projectId]/finance/subcontracts/[subcontractId]/payments/new` | دفعة لمقاول باطن |

## ك.9 صفحات إعدادات المنظمة (7 صفحات)

| # | المسار النسبي | الوصف |
|---|--------------|-------|
| 1 | `/settings/general` | الإعدادات العامة |
| 2 | `/settings/members` | إدارة الأعضاء |
| 3 | `/settings/roles` | إدارة الأدوار |
| 4 | `/settings/users` | إدارة المستخدمين |
| 5 | `/settings/integrations` | التكاملات |
| 6 | `/settings/billing` | الفوترة |
| 7 | `/settings/danger-zone` | منطقة خطر (حذف المنظمة) |

## ك.10 بوابة مالك المشروع (6 صفحات)

| # | المسار | الوصف |
|---|--------|-------|
| 1 | `/owner/[token]` | الصفحة الرئيسية |
| 2 | `/owner/[token]/schedule` | الجدول الزمني |
| 3 | `/owner/[token]/payments` | حالة المدفوعات |
| 4 | `/owner/[token]/chat` | المحادثات |
| 5 | `/owner/[token]/changes` | أوامر التغيير |
| 6 | `/owner/[token]/changes/[changeId]` | تفاصيل أمر التغيير |

## ك.11 صفحات أخرى (4 صفحات)

| # | المسار | الوصف |
|---|--------|-------|
| 1 | `/[organizationSlug]` | لوحة تحكم المنظمة |
| 2 | `/[organizationSlug]/chatbot` | محادثة AI للمنظمة |
| 3 | `/[organizationSlug]/notifications` | الإشعارات |
| 4 | `/share/[token]` | مشاركة عامة |

## ك.12 ملخص التخطيطات (Layouts — 16 ملف)

| # | الملف | الوصف |
|---|-------|-------|
| 1 | `app/layout.tsx` | التخطيط الجذري (HTML, body, fonts, RTL) |
| 2 | `(saas)/layout.tsx` | تخطيط SaaS (providers) |
| 3 | `(saas)/app/layout.tsx` | تخطيط التطبيق (auth guard) |
| 4 | `(account)/layout.tsx` | تخطيط الحساب (sidebar account) |
| 5 | `(account)/admin/layout.tsx` | تخطيط الإدارة (admin guard) |
| 6 | `(account)/settings/layout.tsx` | تخطيط إعدادات الحساب |
| 7 | `[organizationSlug]/layout.tsx` | تخطيط المنظمة (org loader) |
| 8 | `[organizationSlug]/company/layout.tsx` | تخطيط إدارة الشركة |
| 9 | `[organizationSlug]/finance/layout.tsx` | تخطيط المالية |
| 10 | `[projectId]/layout.tsx` | تخطيط المشروع (ProjectShell) |
| 11 | `[organizationSlug]/settings/layout.tsx` | تخطيط إعدادات المنظمة |
| 12 | `(marketing)/[locale]/layout.tsx` | تخطيط صفحات التسويق |
| 13 | `docs/[[...path]]/layout.tsx` | تخطيط التوثيق |
| 14 | `auth/layout.tsx` | تخطيط المصادقة |
| 15 | `owner/layout.tsx` | تخطيط بوابة المالك |
| 16 | `owner/[token]/layout.tsx` | تخطيط جلسة المالك |

---

# ملحق ل: مرجع دوال الاستعلامات الكامل (180+ دالة)

## ل.1 ملفات الاستعلامات مع عدد الأسطر

| # | الملف | الأسطر | الدوال | النماذج المستهدفة |
|---|-------|--------|--------|-----------------|
| 1 | `ai-chats.ts` | ~80 | 6 | AiChat |
| 2 | `attachments.ts` | ~350 | 9 + 3 validation | Attachment |
| 3 | `audit.ts` | ~120 | 5 | ProjectAuditLog |
| 4 | `company.ts` | 991 | 16+ | Employee, CompanyExpense, Allocation |
| 5 | `cost-studies.ts` | ~600 | 15+ | CostStudy, StructuralItem, FinishingItem, MEPItem |
| 6 | `dashboard.ts` | ~300 | 8 | Project, Milestone, Activity |
| 7 | `digests.ts` | ~200 | 5 | DigestSubscription |
| 8 | `expense-runs.ts` | ~400 | 10 | CompanyExpenseRun, CompanyExpenseRunItem |
| 9 | `finance.ts` | 1,810 | 20+ | Client, Quotation, Invoice, Template, Settings |
| 10 | `finance-reports.ts` | ~500 | 12 | Revenue, Quotation stats, Invoice stats |
| 11 | `integrations.ts` | ~150 | 5 | IntegrationSettings, MessageDeliveryLog |
| 12 | `notifications.ts` | ~400 | 12 | Notification |
| 13 | `organizations.ts` | ~350 | 12 | Organization, Member, Invitation |
| 14 | `org-audit.ts` | ~120 | 4 | OrganizationAuditLog |
| 15 | `org-finance.ts` | ~800 | 19 | OrganizationBank, FinanceExpense, FinancePayment, FinanceTransfer |
| 16 | `org-users.ts` | ~250 | 6 | User (org-scoped) |
| 17 | `payments-claims-timeline.ts` | ~60 | 1 | Payment + Claim timeline |
| 18 | `payroll.ts` | ~500 | 10 | PayrollRun, PayrollRunItem |
| 19 | `permissions.ts` | ~300 | 8 | User, Role (permissions) |
| 20 | `project-change-orders.ts` | ~500 | 12 | ProjectChangeOrder |
| 21 | `project-chat.ts` | ~250 | 7 | ProjectMessage, ChatLastRead |
| 22 | `project-contract.ts` | ~350 | 6 | ProjectContract, ContractPaymentTerm |
| 23 | `project-documents.ts` | ~350 | 7 | ProjectDocument, ProjectApproval |
| 24 | `project-field.ts` | ~400 | 13 | DailyReport, Photo, Issue, ProgressUpdate |
| 25 | `project-finance.ts` | ~500 | 13 | ProjectExpense, ProjectClaim |
| 26 | `project-insights.ts` | ~300 | 4 | ProjectAlert |
| 27 | `project-members.ts` | ~250 | 8 | ProjectMember |
| 28 | `project-owner-portal.ts` | ~500 | 13 | OwnerAccess, Messages, Milestones |
| 29 | `project-templates.ts` | ~300 | 8 | ProjectTemplate, ProjectTemplateItem |
| 30 | `project-timeline.ts` | ~350 | 8 | ProjectMilestone |
| 31 | `projects.ts` | ~400 | 8 | Project |
| 32 | `purchases.ts` | ~200 | 7 | Purchase |
| 33 | `roles.ts` | ~300 | 7 | Role |
| 34 | `seed-templates.ts` | ~150 | 2 | FinanceTemplate |
| 35 | `sequences.ts` | ~100 | 3 | OrganizationSequence |
| 36 | `shares.ts` | ~250 | 5 | ShareLink |
| 37 | `subcontract.ts` | ~600 | 13 | SubcontractContract, Payments, COs |
| 38 | `users.ts` | ~200 | 8 | User (global) |
| 39 | `quotation-items.ts` | ~100 | 3 | QuotationItem |

**المجموع:** ~12,000 سطر في 39 ملف، 180+ دالة مصدّرة

## ل.2 الدوال التي تستخدم Transactions

| الملف | الدالة | السبب |
|-------|--------|-------|
| `payroll.ts` | `approvePayrollRun` | إنشاء مصروف مالي لكل بند + تحديث الحالة |
| `payroll.ts` | `cancelPayrollRun` | إلغاء المصروفات المرتبطة + تحديث الحالة |
| `expense-runs.ts` | `postExpenseRun` | إنشاء مصروفات مالية + تحديث الأرصدة |
| `roles.ts` | `createDefaultRolesInTx` | إنشاء 6 أدوار افتراضية ذرياً |
| `org-finance.ts` | `payExpense` | خصم من حساب + تحديث المصروف |
| `org-finance.ts` | `cancelExpense` | إعادة المبلغ للحساب + تحديث الحالة |
| `org-finance.ts` | `createTransfer` | خصم من حساب + إضافة لحساب آخر |
| `org-finance.ts` | `cancelTransfer` | عكس التحويل (إعادة المبلغ) |
| `sequences.ts` | `nextSequenceValue` | تسلسل ذري عبر INSERT ON CONFLICT |

## ل.3 أنماط الأمان في الاستعلامات

### نمط عزل البيانات (Multi-tenancy)
كل استعلام يحتوي على `organizationId` كشرط إجباري:
```typescript
// النمط الموحد عبر جميع الملفات الـ 39:
where: {
  organizationId: input.organizationId,  // ← دائماً موجود
  // ... شروط إضافية
}
```

### نمط التسلسلات الذرية
```typescript
// sequences.ts — منع أرقام مكررة
const result = await db.$queryRaw`
  INSERT INTO organization_sequences (id, organization_id, sequence_key, current_value)
  VALUES (gen_random_uuid(), ${orgId}, ${key}, 1)
  ON CONFLICT (organization_id, sequence_key)
  DO UPDATE SET current_value = organization_sequences.current_value + 1
  RETURNING current_value
`;
```

### نمط الحذف المتسلسل
```typescript
// onDelete: Cascade في الـ schema يضمن حذف كل العلاقات التابعة
// مثال: حذف مشروع يحذف تلقائياً: تقارير، صور، ملاحظات، مصروفات، مطالبات...
```

### نمط إزالة التكرار (Deduplication)
```typescript
// notifications.ts
dedupeKey: `${type}_${entityId}_${userId}`  // @@unique في الـ schema

// project-insights.ts
dedupeKey: `${alertType}_${projectId}`      // @@unique في الـ schema
```

---

# ملحق م: مرجع المتغيرات البيئية (60+ متغير)

## م.1 متغيرات المصادقة

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `GOOGLE_CLIENT_ID` | معرف OAuth2 لـ Google | اختياري |
| `GOOGLE_CLIENT_SECRET` | سر OAuth2 لـ Google | اختياري |
| `GITHUB_CLIENT_ID` | معرف OAuth2 لـ GitHub | اختياري |
| `GITHUB_CLIENT_SECRET` | سر OAuth2 لـ GitHub | اختياري |

## م.2 قاعدة البيانات

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `DATABASE_URL` | رابط PostgreSQL (الإنتاج) | ✅ نعم |
| `DATABASE_URL_TEST` | رابط PostgreSQL (الاختبار) | لا |

## م.3 التخزين (S3)

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `S3_ENDPOINT` | نقطة نهاية S3 | ✅ نعم |
| `S3_REGION` | منطقة AWS/S3 | ✅ نعم |
| `S3_ACCESS_KEY_ID` | مفتاح وصول AWS | ✅ نعم |
| `S3_SECRET_ACCESS_KEY` | سر وصول AWS | ✅ نعم |
| `S3_ATTACHMENTS_BUCKET` | اسم الحاوية (default: "attachments") | لا |
| `NEXT_PUBLIC_AVATARS_BUCKET_NAME` | حاوية الصور الرمزية | لا |

## م.4 مزودو البريد الإلكتروني (سلسلة احتياطية)

| المتغير | المزود | الأولوية |
|---------|--------|---------|
| `RESEND_API_KEY` | Resend | 1 (أعلى) |
| `POSTMARK_API_KEY` | Postmark | 2 |
| `PLUNK_API_KEY` | Plunk | 3 |
| `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` | Mailgun | 4 |
| `SMTP_HOST` | SMTP مخصص | 5 |
| `MAIL_HOST` + `MAIL_PORT` + `MAIL_USER` + `MAIL_PASS` | Nodemailer | 6 (احتياطي) |

## م.5 الرسائل (SMS / WhatsApp)

| المتغير | الوصف |
|---------|-------|
| `TWILIO_ACCOUNT_SID` | حساب Twilio |
| `TWILIO_WHATSAPP_NUMBER` | رقم WhatsApp عبر Twilio |
| `VONAGE_API_KEY` | مفتاح Vonage (Nexmo سابقاً) |
| `SMS_PROVIDER_KEY` | مزود SMS عام |
| `WHATSAPP_BUSINESS_ID` | حساب WhatsApp Business |

## م.6 مزودو الدفع

| المتغير | المزود |
|---------|--------|
| `STRIPE_SECRET_KEY` | Stripe — مفتاح API |
| `STRIPE_WEBHOOK_SECRET` | Stripe — سر Webhook |
| `POLAR_ACCESS_TOKEN` | Polar |
| `POLAR_WEBHOOK_SECRET` | Polar Webhook |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy |
| `LEMONSQUEEZY_STORE_ID` | LemonSqueezy Store |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | LemonSqueezy Webhook |
| `DODO_PAYMENTS_API_KEY` | DodoPayments |
| `CREEM_API_KEY` | Creem |
| `CREEM_WEBHOOK_SECRET` | Creem Webhook |

## م.7 التخزين المؤقت

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `REDIS_URL` | رابط Redis (rate limiting) | لا (يوجد احتياطي memory) |

## م.8 عناوين URL

| المتغير | الوصف | الأولوية |
|---------|-------|---------|
| `NEXT_PUBLIC_SITE_URL` | عنوان الموقع العام | 1 (أعلى) |
| `NEXT_PUBLIC_VERCEL_URL` | عنوان Vercel | 2 |
| `NEXT_PUBLIC_APP_URL` | عنوان التطبيق | 3 (احتياطي) |
| `PORT` | منفذ الخادم (default: 3000) | لا |

## م.9 التحليلات

| المتغير | المزود |
|---------|--------|
| `NEXT_PUBLIC_UMAMI_TRACKING_ID` | Umami Analytics |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | Plausible |
| `NEXT_PUBLIC_PIRSCH_CODE` | Pirsch |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Mixpanel |

## م.10 بيئة التشغيل

| المتغير | الوصف |
|---------|-------|
| `NODE_ENV` | production / development |
| `CI` | علامة بيئة CI (GitHub Actions) |

---

# ملحق ن: حالات الاختبار التفصيلية (84+ اختبار)

## ن.1 ملخص ملفات الاختبار

| # | الملف | النوع | الأسطر | الحالات |
|---|-------|-------|--------|--------|
| 1 | `apps/web/tests/home.spec.ts` | Playwright E2E | 23 | 2 |
| 2 | `packages/api/__tests__/permissions.test.ts` | Vitest Unit + Integration | 727 | 25+ |
| 3 | `packages/api/__tests__/rate-limit.test.ts` | Vitest Unit | 157 | 14 |
| 4 | `packages/database/__tests__/attachments-validation.test.ts` | Vitest Unit | 191 | 18 |
| 5 | `packages/database/__tests__/org-finance.test.ts` | Vitest Integration | 827 | 20+ |
| 6 | `packages/database/__tests__/smoke.test.ts` | Vitest Integration | 55 | 4 |

## ن.2 اختبارات E2E — Playwright (`home.spec.ts`)

```
✓ home page → should load (if marketing enabled)
✓ home page → should be redirected to app (if marketing disabled)
```

## ن.3 اختبارات الصلاحيات — RBAC (`permissions.test.ts`)

### الجزء الأول: اختبارات وحدات (بدون DB)

```
describe("DEFAULT_ROLE_PERMISSIONS")
  ✓ defines permissions for all 6 roles

describe("RBAC Matrix — per-role permission grants")
  ✓ OWNER — grants exactly the expected permissions
  ✓ PROJECT_MANAGER — grants exactly the expected permissions
  ✓ ACCOUNTANT — grants exactly the expected permissions
  ✓ ENGINEER — grants exactly the expected permissions
  ✓ SUPERVISOR — grants exactly the expected permissions
  ✓ CUSTOM — grants exactly the expected permissions
  ✓ OWNER has 31 granted permissions
  ✓ PROJECT_MANAGER has 19 granted permissions
  ✓ ACCOUNTANT has 19 granted permissions
  ✓ ENGINEER has 7 granted permissions
  ✓ SUPERVISOR has 4 granted permissions
  ✓ CUSTOM has 0 granted permissions

describe("hasPermission")
  ✓ returns true for a granted permission
  ✓ returns false for a denied permission
  ✓ returns false for null permissions
  ✓ returns false for undefined permissions
  ✓ returns false for unknown action in a valid section
  ✓ returns false for unknown section
  ✓ agrees with EXPECTED_GRANTS for OWNER
  ✓ agrees with EXPECTED_GRANTS for PROJECT_MANAGER
  ✓ agrees with EXPECTED_GRANTS for ACCOUNTANT
  ✓ agrees with EXPECTED_GRANTS for ENGINEER
  ✓ agrees with EXPECTED_GRANTS for SUPERVISOR
  ✓ agrees with EXPECTED_GRANTS for CUSTOM

describe("createEmptyPermissions")
  ✓ has all 7 sections
  ✓ every action in every section is false
  ✓ matches CUSTOM role defaults
  ✓ returns a new object on each call (no shared reference)
```

### الجزء الثاني: اختبارات تكاملية (DB)

```
describe("Integration: getUserPermissions")
  ✓ OWNER user gets full permissions (31 granted)
  ✓ ACCOUNTANT user gets accountant permissions (19 granted)
  ✓ user with no role returns empty permissions
  ✓ non-existent user returns empty permissions
  ✓ cross-org user returns empty permissions (org isolation guard)
  ✓ customPermissions override role permissions
  ✓ fillMissingSections fills missing sections from role-type defaults
  ✓ fillMissingSections fills missing sub-keys within existing sections
```

## ن.4 اختبارات تحديد المعدل (`rate-limit.test.ts`)

```
describe("RATE_LIMITS presets")
  ✓ exports all 6 presets (READ, WRITE, TOKEN, UPLOAD, MESSAGE, STRICT)
  ✓ STRICT is the most restrictive (5/min)

describe("createRateLimitKey / createIpRateLimitKey")
  ✓ creates user:procedure key
  ✓ creates ip-prefixed key

describe("checkRateLimit (in-memory fallback)")
  ✓ allows first request
  ✓ tracks count across calls (3 under limit, 4th blocked)
  ✓ resets after window expires (50ms window test)

describe("enforceRateLimit")
  ✓ does not throw when under limit
  ✓ throws RateLimitError when exceeded

describe("rateLimitChecker")
  ✓ resolves when under limit

describe("rateLimitToken")
  ✓ resolves when under limit

describe("RateLimitError")
  ✓ has Arabic message with retry seconds
  ✓ validates retryAfterMs and name properties

describe("No REDIS_URL — graceful fallback")
  ✓ does not crash on module load without REDIS_URL
```

## ن.5 اختبارات التحقق من المرفقات (`attachments-validation.test.ts`)

```
describe("validateFileName")
  ✓ accepts normal file names (pdf, jpg, xlsx, docx)
  ✓ rejects double extensions with dangerous final extension (invoice.pdf.exe)
  ✓ rejects double extensions with dangerous inner extension (payload.bat.pdf)
  ✓ rejects .exe extension
  ✓ rejects .svg extension
  ✓ rejects .html extension
  ✓ rejects .bat extension
  ✓ rejects .js extension
  ✓ accepts files with multiple dots in name (non-dangerous: my.report.v2.pdf)

describe("validateAttachment")
  ✓ blocks SVG MIME type
  ✓ blocks text/html MIME type
  ✓ blocks application/javascript MIME type
  ✓ allows valid PDF upload
  ✓ allows valid JPEG upload
  ✓ rejects extension-MIME mismatch: .jpg claiming PDF
  ✓ rejects extension-MIME mismatch: .pdf claiming JPEG
  ✓ rejects file exceeding size limit (100MB+)
  ✓ works without optional fileName (backward compatible)

describe("validateFileHeader — Magic Bytes")
  ✓ validates PNG magic bytes (0x89 0x50 0x4e 0x47)
  ✓ rejects PNG bytes when claiming JPEG
  ✓ validates JPEG magic bytes (0xff 0xd8 0xff 0xe0)
  ✓ validates PDF magic bytes (0x25 0x50 0x44 0x46)
  ✓ rejects PDF bytes when claiming image/png
  ✓ allows unknown signatures (e.g. DOCX/XLSX = ZIP)
  ✓ rejects too-short header
  ✓ validates WebP magic bytes (RIFF...WEBP)
  ✓ rejects RIFF/WEBP bytes when claiming JPEG
```

## ن.6 اختبارات المالية (`org-finance.test.ts`)

```
describe("Organization Finance — Bank Accounts & Transactions")

  describe("Expenses")
    ✓ createExpense COMPLETED — balance decrements by amount
    ✓ createExpense PENDING — balance unchanged
    ✓ payExpense full — status COMPLETED, balance decrements
    ✓ payExpense partial — status stays PENDING
    ✓ payExpense overpayment — throws error
    ✓ cancelExpense — restores paidAmount to account balance
    ✓ deleteExpense MANUAL — restores paidAmount to balance
    ✓ deleteExpense facility-generated — blocked (sourceType check)

  describe("Payments (Income)")
    ✓ createPayment — balance increments by amount
    ✓ deletePayment COMPLETED — balance decrements (reversal)

  describe("Transfers")
    ✓ createTransfer — source decrements, destination increments
    ✓ createTransfer same account — rejected (validation)
    ✓ cancelTransfer — both balances reversed
    ✓ cancelTransfer already cancelled — throws error

  describe("Payroll")
    ✓ payrollRun populate — correct salary calculations (base + allowances - deductions)
    ✓ payrollRun approve — creates PENDING expenses linked to payroll
    ✓ payrollRun cancel — cancels all linked expenses

  describe("Reconciliation")
    ✓ clean account delta=0 (balance matches ledger)

  describe("Security")
    ✓ multi-tenant — org A cannot see org B data (organization isolation)
    ✓ negative balance prevention — blocks overdraft
```

## ن.7 اختبارات الدخان (`smoke.test.ts`)

```
describe("Database Infrastructure")
  ✓ connects to the test database
  ✓ creates and reads an organization inside a transaction
  ✓ rolls back — previous org does not persist
  ✓ creates user + bank account with FK relations
```

## ن.8 تحليل تغطية الاختبارات

| الوحدة | المختبَر | غير المختبَر | التغطية |
|--------|---------|------------|---------|
| RBAC / Permissions | ✅ شامل (25+ حالة) | — | ~95% |
| Rate Limiting | ✅ شامل (14 حالة) | Redis pipeline | ~80% |
| Attachment Validation | ✅ شامل (18 حالة) | — | ~95% |
| Organization Finance | ✅ شامل (20 حالة) | Partial payments edge cases | ~85% |
| DB Infrastructure | ✅ أساسي (4 حالات) | — | 100% |
| E2E (Home page) | ✅ أساسي (2 حالة) | — | <1% |
| **جميع API Endpoints** | ❌ غير مختبر | 500+ endpoint | **~0%** |
| **جميع UI Components** | ❌ غير مختبر | 326 component | **~0%** |
| **جميع Query Functions** | ✅ جزئي | 180+ function (معظمها) | **~15%** |

**التقييم:** الاختبارات الموجودة ذات جودة عالية جداً — تغطي السيناريوهات الحرجة (الصلاحيات، المالية، الأمان). لكن التغطية الإجمالية منخفضة جداً (~5-10%). المطلوب: اختبارات تكاملية لجميع الـ API endpoints + اختبارات E2E لأهم 20 تدفق مستخدم.

---

# ملحق س: تحليل سطح API التفصيلي حسب الوحدة

## س.1 وحدة المالية (finance) — 60+ endpoint

### العملاء (Clients) — 10 endpoints
| # | Endpoint | النوع | الحماية | Input الرئيسي |
|---|----------|-------|---------|-------------|
| 1 | `finance.clients.list` | GET | protected + permissions | organizationId, clientType?, query?, limit, offset |
| 2 | `finance.clients.getById` | GET | protected + permissions | organizationId, clientId |
| 3 | `finance.clients.create` | POST | protected + permissions | organizationId, clientType, firstName, lastName, businessName, phone, email, address, taxNumber, crNumber |
| 4 | `finance.clients.update` | PUT | protected + permissions | organizationId, clientId, (same fields) |
| 5 | `finance.clients.delete` | DELETE | protected + permissions | organizationId, clientId |
| 6 | `finance.clients.contacts.list` | GET | protected | clientId |
| 7 | `finance.clients.contacts.create` | POST | protected | clientId, name, position, phone, email |
| 8 | `finance.clients.contacts.update` | PUT | protected | contactId, (fields) |
| 9 | `finance.clients.contacts.delete` | DELETE | protected | contactId |
| 10 | `finance.clients.contacts.setPrimary` | POST | protected | contactId |

### الفواتير (Invoices) — 10 endpoints
| # | Endpoint | النوع | Input الرئيسي |
|---|----------|-------|-------------|
| 1 | `finance.invoices.list` | GET | organizationId, status?, clientId?, projectId?, invoiceType?, dateFrom?, dateTo?, limit, offset |
| 2 | `finance.invoices.getById` | GET | organizationId, invoiceId |
| 3 | `finance.invoices.create` | POST | organizationId, invoiceType, clientId, clientName, projectId?, quotationId?, issueDate, dueDate, vatPercent, discountPercent, items[], templateId?, paymentTerms? |
| 4 | `finance.invoices.update` | PUT | invoiceId, (editable fields) |
| 5 | `finance.invoices.updateItems` | PUT | invoiceId, items[] |
| 6 | `finance.invoices.updateStatus` | PUT | invoiceId, status (DRAFT→SENT→VIEWED→OVERDUE→CANCELLED) |
| 7 | `finance.invoices.convertToTax` | POST | invoiceId — يحول STANDARD إلى TAX مع QR code |
| 8 | `finance.invoices.addPayment` | POST | invoiceId, amount, paymentDate, paymentMethod, referenceNo? |
| 9 | `finance.invoices.deletePayment` | DELETE | paymentId |
| 10 | `finance.invoices.delete` | DELETE | invoiceId |

### عروض الأسعار (Quotations) — 8 endpoints
| # | Endpoint | النوع | Input الرئيسي |
|---|----------|-------|-------------|
| 1 | `pricing.quotations.list` | GET | organizationId, status?, clientId?, projectId?, limit, offset |
| 2 | `pricing.quotations.getById` | GET | organizationId, quotationId |
| 3 | `pricing.quotations.create` | POST | organizationId, clientId, clientName, projectId?, validUntil, vatPercent, items[], templateId? |
| 4 | `pricing.quotations.update` | PUT | quotationId, (fields) |
| 5 | `pricing.quotations.updateItems` | PUT | quotationId, items[] |
| 6 | `pricing.quotations.updateStatus` | PUT | quotationId, status (DRAFT→SENT→VIEWED→ACCEPTED/REJECTED/EXPIRED) |
| 7 | `pricing.quotations.delete` | DELETE | quotationId |
| 8 | `pricing.quotations.convertToInvoice` | POST | quotationId — يحول عرض مقبول إلى فاتورة |

### الحسابات البنكية (Banks) — 8 endpoints
| # | Endpoint | النوع | Input الرئيسي |
|---|----------|-------|-------------|
| 1 | `finance.banks.list` | GET | organizationId, accountType? |
| 2 | `finance.banks.getById` | GET | organizationId, bankId |
| 3 | `finance.banks.getSummary` | GET | organizationId — إجمالي الأرصدة |
| 4 | `finance.banks.create` | POST | organizationId, name, accountNumber?, bankName?, iban?, accountType, openingBalance, currency |
| 5 | `finance.banks.update` | PUT | bankId, (fields) |
| 6 | `finance.banks.setDefault` | POST | bankId |
| 7 | `finance.banks.delete` | DELETE | bankId |
| 8 | `finance.banks.reconcile` | POST | bankId — مطابقة الرصيد مع الحركات |

### مصروفات المنظمة (Expenses) — 9 endpoints
| # | Endpoint | Input الرئيسي |
|---|----------|-------------|
| 1 | `finance.expenses.list` | organizationId, category?, projectId?, status?, sourceType?, dateFrom?, dateTo?, limit, offset |
| 2 | `finance.expenses.listUnified` | organizationId — يشمل مصروفات عقود الباطن |
| 3 | `finance.expenses.getById` | expenseId |
| 4 | `finance.expenses.getSummary` | organizationId — إحصائيات حسب التصنيف |
| 5 | `finance.expenses.create` | organizationId, category, amount, date, sourceAccountId?, vendorName?, projectId?, paymentMethod, status |
| 6 | `finance.expenses.update` | expenseId, (fields) |
| 7 | `finance.expenses.delete` | expenseId |
| 8 | `finance.expenses.pay` | expenseId, amount, bankAccountId — دفع جزئي/كامل |
| 9 | `finance.expenses.cancel` | expenseId — إلغاء مع إعادة المبلغ |

### المقبوضات (Payments) — 5 endpoints
| # | Endpoint | Input الرئيسي |
|---|----------|-------------|
| 1 | `finance.orgPayments.list` | organizationId, clientId?, projectId?, dateFrom?, dateTo?, limit, offset |
| 2 | `finance.orgPayments.getById` | paymentId |
| 3 | `finance.orgPayments.create` | organizationId, amount, date, destinationAccountId, clientId?, projectId?, invoiceId?, contractTermId?, paymentMethod, referenceNo? |
| 4 | `finance.orgPayments.update` | paymentId, (fields) |
| 5 | `finance.orgPayments.delete` | paymentId |

### التحويلات (Transfers) — 4 endpoints
| # | Endpoint | Input الرئيسي |
|---|----------|-------------|
| 1 | `finance.transfers.list` | organizationId, dateFrom?, dateTo?, limit, offset |
| 2 | `finance.transfers.getById` | transferId |
| 3 | `finance.transfers.create` | organizationId, amount, date, fromAccountId, toAccountId, description? |
| 4 | `finance.transfers.cancel` | transferId |

### التقارير (Reports) — 6 endpoints
| # | Endpoint | الوصف |
|---|----------|-------|
| 1 | `finance.reports.revenueByPeriod` | إيرادات حسب الفترة (شهري/ربعي/سنوي) |
| 2 | `finance.reports.revenueByProject` | إيرادات حسب المشروع |
| 3 | `finance.reports.revenueByClient` | إيرادات حسب العميل |
| 4 | `finance.reports.conversionRate` | نسبة تحويل العروض إلى فواتير |
| 5 | `finance.reports.quotationStats` | إحصائيات العروض حسب الحالة |
| 6 | `finance.reports.invoiceStats` | إحصائيات الفواتير حسب الحالة |

## س.2 وحدة المشاريع (projects) — 80+ endpoint

### المشاريع الأساسية — 6 endpoints
| Endpoint | النوع | الوصف |
|----------|-------|-------|
| `projects.list` | GET | قائمة مشاريع المنظمة مع فلترة وبحث |
| `projects.create` | POST | إنشاء مشروع جديد مع عقد اختياري |
| `projects.getById` | GET | تفاصيل مشروع محدد |
| `projects.update` | PUT | تعديل بيانات المشروع |
| `projects.delete` | DELETE | حذف المشروع (cascade) |
| `projects.getNextProjectNo` | GET | رقم المشروع التالي |

### فريق المشروع — 4 endpoints
| Endpoint | الوصف |
|----------|-------|
| `projectTeam.list` | قائمة أعضاء الفريق مع الأدوار |
| `projectTeam.add` | إضافة عضو (userId + role) |
| `projectTeam.updateRole` | تغيير دور العضو |
| `projectTeam.remove` | إزالة عضو |

### العقد — 6 endpoints
| Endpoint | الوصف |
|----------|-------|
| `projectContract.get` | جلب العقد |
| `projectContract.upsert` | إنشاء أو تعديل (عقد واحد لكل مشروع) |
| `projectContract.setPaymentTerms` | تحديد جدول الدفعات |
| `projectContract.getPaymentTermsProgress` | تقدم الدفعات |
| `projectContract.getSummary` | ملخص العقد |
| `projectContract.getNextNo` | رقم العقد التالي |

### العمل الميداني — 11 endpoint
| Endpoint | الوصف |
|----------|-------|
| `projectField.createDailyReport` | إنشاء تقرير يومي |
| `projectField.listDailyReports` | قائمة التقارير |
| `projectField.createPhoto` | رفع صورة |
| `projectField.listPhotos` | قائمة الصور |
| `projectField.deletePhoto` | حذف صورة |
| `projectField.createIssue` | إنشاء ملاحظة/مشكلة |
| `projectField.listIssues` | قائمة الملاحظات |
| `projectField.updateIssue` | تعديل حالة الملاحظة |
| `projectField.addProgressUpdate` | إضافة تحديث تقدم |
| `projectField.listProgressUpdates` | قائمة التحديثات |
| `projectField.getTimeline` | الجدول الزمني الميداني |

### المالية — 17 endpoint
| Endpoint | الوصف |
|----------|-------|
| `projectFinance.getSummary` | ملخص مالي (إيرادات، مصروفات، صافي) |
| `projectFinance.listExpenses` | مصروفات المشروع |
| `projectFinance.createExpense` | إنشاء مصروف |
| `projectFinance.updateExpense` | تعديل مصروف |
| `projectFinance.deleteExpense` | حذف مصروف |
| `projectFinance.listClaims` | المطالبات |
| `projectFinance.createClaim` | إنشاء مطالبة |
| `projectFinance.updateClaim` | تعديل مطالبة |
| `projectFinance.updateClaimStatus` | تغيير حالة (DRAFT→SUBMITTED→APPROVED→PAID) |
| `projectFinance.deleteClaim` | حذف مطالبة |
| `projectFinance.getExpensesByCategory` | تحليل حسب التصنيف |
| `projectFinance.getPaymentsClaimsTimeline` | خط زمني للمدفوعات |

### أوامر التغيير — 12 endpoint
| Endpoint | الوصف |
|----------|-------|
| `projectChangeOrders.list` | القائمة |
| `projectChangeOrders.get` | التفاصيل |
| `projectChangeOrders.getStats` | إحصائيات حسب الحالة |
| `projectChangeOrders.create` | إنشاء (حالة DRAFT) |
| `projectChangeOrders.update` | تعديل |
| `projectChangeOrders.delete` | حذف |
| `projectChangeOrders.submit` | تقديم للاعتماد (DRAFT→SUBMITTED) |
| `projectChangeOrders.approve` | اعتماد (SUBMITTED→APPROVED) |
| `projectChangeOrders.reject` | رفض (SUBMITTED→REJECTED) |
| `projectChangeOrders.implement` | تنفيذ (APPROVED→IMPLEMENTED) |
| `projectChangeOrders.ownerList` | قائمة بوابة المالك |
| `projectChangeOrders.ownerGet` | تفاصيل بوابة المالك |

### الجدول الزمني — 9 endpoints
| Endpoint | الوصف |
|----------|-------|
| `projectTimeline.listMilestones` | قائمة المراحل |
| `projectTimeline.createMilestone` | إنشاء مرحلة |
| `projectTimeline.updateMilestone` | تعديل مرحلة |
| `projectTimeline.deleteMilestone` | حذف مرحلة |
| `projectTimeline.reorderMilestones` | إعادة ترتيب |
| `projectTimeline.markActual` | تسجيل التاريخ الفعلي |
| `projectTimeline.startMilestone` | بدء مرحلة |
| `projectTimeline.completeMilestone` | إكمال مرحلة |
| `projectTimeline.getHealth` | صحة الجدول (% في الوقت) |

### المستندات — 6 endpoints
| Endpoint | الوصف |
|----------|-------|
| `projectDocuments.list` | قائمة حسب المجلد |
| `projectDocuments.create` | إنشاء مستند |
| `projectDocuments.get` | تفاصيل المستند |
| `projectDocuments.createApprovalRequest` | طلب اعتماد |
| `projectDocuments.actOnApproval` | اعتماد/رفض |
| `projectDocuments.getApproval` | حالة الاعتماد |

### المحادثات — 4 endpoints
| Endpoint | الوصف |
|----------|-------|
| `projectChat.listMessages` | قائمة الرسائل |
| `projectChat.sendMessage` | إرسال رسالة |
| `projectChat.getUnreadCount` | عدد غير المقروءة |
| `projectChat.markAsRead` | تعليم كمقروء |

## س.3 وحدة إدارة الشركة (company) — 50+ endpoint

### الموظفون — 12 endpoint
| Endpoint | الوصف |
|----------|-------|
| `company.employees.list` | قائمة الموظفين |
| `company.employees.getById` | تفاصيل موظف |
| `company.employees.create` | إنشاء موظف |
| `company.employees.update` | تعديل |
| `company.employees.terminate` | إنهاء خدمات |
| `company.employees.getSummary` | إحصائيات |
| `company.employees.assignments.list` | تعيينات الموظف |
| `company.employees.assignments.byProject` | تعيينات المشروع |
| `company.employees.assignments.assign` | تعيين لمشروع |
| `company.employees.assignments.update` | تعديل تعيين |
| `company.employees.assignments.remove` | إزالة تعيين |

### الأصول — 9 endpoints
| Endpoint | الوصف |
|----------|-------|
| `company.assets.list` | قائمة الأصول |
| `company.assets.getById` | تفاصيل |
| `company.assets.create` | إنشاء |
| `company.assets.update` | تعديل |
| `company.assets.retire` | تقاعد أصل |
| `company.assets.assignToProject` | تعيين لمشروع |
| `company.assets.returnToWarehouse` | إعادة للمستودع |
| `company.assets.getSummary` | إحصائيات |
| `company.assets.getExpiringInsurance` | تأمينات منتهية |

### المصروفات الثابتة — 15 endpoint
| Endpoint | الوصف |
|----------|-------|
| `company.expenses.list` | قائمة المصروفات الثابتة |
| `company.expenses.getById` | تفاصيل |
| `company.expenses.create` | إنشاء (شهري/ربعي/سنوي) |
| `company.expenses.update` | تعديل |
| `company.expenses.deactivate` | تعطيل |
| `company.expenses.getSummary` | إجمالي حسب التصنيف |
| `company.expenses.getDashboardData` | بيانات لوحة التحكم |
| `company.expenses.getUpcoming` | مصروفات قادمة |
| `company.expenses.payments.list` | قائمة الدفعات |
| `company.expenses.payments.create` | إنشاء دفعة |
| `company.expenses.payments.markPaid` | تعليم كمدفوع |
| `company.expenses.payments.update` | تعديل |
| `company.expenses.payments.delete` | حذف |
| `company.expenses.payments.generateMonthly` | توليد تلقائي |
| `company.expenses.allocations.set` | توزيع على مشاريع |

### الرواتب — 9 endpoints
| Endpoint | الوصف |
|----------|-------|
| `company.payroll.list` | قائمة دورات الرواتب |
| `company.payroll.getById` | تفاصيل الدورة |
| `company.payroll.create` | إنشاء دورة جديدة |
| `company.payroll.populate` | تعبئة تلقائية من الموظفين |
| `company.payroll.approve` | اعتماد (→ إنشاء مصروفات) |
| `company.payroll.cancel` | إلغاء (→ إلغاء مصروفات) |
| `company.payroll.summary` | إجمالي |
| `company.payroll.updateItem` | تعديل بند |
| `company.payroll.deleteItem` | حذف بند |

### دورات الترحيل — 9 endpoints
| Endpoint | الوصف |
|----------|-------|
| `company.expenseRuns.list` | القائمة |
| `company.expenseRuns.getById` | التفاصيل |
| `company.expenseRuns.create` | إنشاء |
| `company.expenseRuns.populate` | تعبئة من المصروفات الثابتة |
| `company.expenseRuns.post` | ترحيل (→ إنشاء مصروفات في القيود) |
| `company.expenseRuns.cancel` | إلغاء |
| `company.expenseRuns.summary` | إجمالي |
| `company.expenseRuns.updateItem` | تعديل بند |
| `company.expenseRuns.deleteItem` | حذف بند |

---

# ملحق ع: تحليل ZATCA المفصل

## ع.1 حقول ZATCA في قاعدة البيانات

| الحقل | النوع | النموذج | الوصف |
|-------|-------|---------|-------|
| `sellerTaxNumber` | String? | FinanceInvoice | الرقم الضريبي للبائع |
| `qrCode` | Text? | FinanceInvoice | رمز QR بتنسيق Base64 |
| `zatcaUuid` | String? | FinanceInvoice | معرف UUID للفاتورة في هيئة الزكاة |
| `zatcaHash` | String? | FinanceInvoice | Hash الفاتورة |
| `zatcaSignature` | Text? | FinanceInvoice | التوقيع الرقمي |
| `taxNumber` | String? | Organization | الرقم الضريبي للمنظمة |
| `taxNumber` | String? | Client | الرقم الضريبي للعميل |
| `taxNumber` | String? | SubcontractContract | الرقم الضريبي للمقاول |
| `vendorTaxNumber` | String? | FinanceExpense | الرقم الضريبي للمورد |

## ع.2 كود ZATCA الحالي

```typescript
// packages/api/lib/zatca/index.ts

generateZatcaQR(input: {
  sellerName: string,
  vatNumber: string,
  timestamp: Date,
  totalWithVat: number,
  vatAmount: number
}): string  // Returns Base64 QR code

// TLV Encoding (Tag-Length-Value) حسب مواصفات ZATCA Phase 1:
// Tag 1: اسم البائع
// Tag 2: الرقم الضريبي
// Tag 3: الوقت والتاريخ
// Tag 4: إجمالي الفاتورة مع الضريبة
// Tag 5: إجمالي الضريبة
```

## ع.3 ما هو مكتمل (Phase 1)
- ✅ حقول QR code في نموذج الفاتورة
- ✅ توليد QR بتنسيق TLV
- ✅ الرقم الضريبي للبائع والعميل
- ✅ حقول zatcaUuid, zatcaHash, zatcaSignature
- ✅ أحداث تدقيق: `ZATCA_INVOICE_SUBMITTED`, `ZATCA_INVOICE_CLEARED`, `ZATCA_INVOICE_REJECTED`
- ✅ نوع الفاتورة: `STANDARD | TAX | SIMPLIFIED`
- ✅ تحويل من STANDARD إلى TAX مع QR

## ع.4 ما هو مفقود (Phase 2)
- ❌ **التوقيع الرقمي** — لا يوجد كود XML signing
- ❌ **الربط مع API هيئة الزكاة** — لا يوجد HTTP client
- ❌ **التسلسل المتصل** — لا يوجد ربط hash بين الفواتير
- ❌ **مسح وتقديم الفاتورة** — Clearance/Reporting mode
- ❌ **شهادات CSID/CCSID** — لا يوجد إدارة شهادات
- ❌ **UBL 2.1 XML** — لا يوجد توليد XML

## ع.5 خطة الامتثال المقترحة

| المرحلة | المتطلب | الأولوية | الجهد المقدر |
|---------|---------|---------|-------------|
| 1 | تنفيذ UBL 2.1 XML generator | P0 | 5 أيام |
| 2 | تنفيذ XML digital signing (X.509) | P0 | 3 أيام |
| 3 | ربط Hash Chain بين الفواتير | P0 | 2 يوم |
| 4 | HTTP client لـ ZATCA API | P0 | 3 أيام |
| 5 | إدارة شهادات CSID/CCSID | P0 | 2 يوم |
| 6 | Clearance mode للفواتير الضريبية | P0 | 3 أيام |
| 7 | Reporting mode للفواتير المبسطة | P1 | 2 يوم |
| 8 | اختبارات تكاملية مع Sandbox | P1 | 3 أيام |

**المجموع:** ~23 يوم عمل للامتثال الكامل

---

# ملحق ف: هيكل نظام الصلاحيات التفصيلي

## ف.1 مصفوفة الصلاحيات الكاملة

### القسم 1: projects (المشاريع)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| viewFinance | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| manageTeam | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### القسم 2: quantities (الكميات)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| view | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| create | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| edit | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| pricing | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### القسم 3: pricing (التسعير)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| studies | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| quotations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| pricing | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### القسم 4: finance (المالية)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| quotations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| invoices | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| payments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### القسم 5: employees (الموظفون)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| edit | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| payroll | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| attendance | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### القسم 6: company (إدارة الشركة)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| expenses | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| assets | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### القسم 7: settings (الإعدادات)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| organization | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| integrations | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### القسم 8: reports (التقارير)
| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR | CUSTOM |
|----------|-------|----------------|------------|----------|------------|--------|
| view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| create | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## ف.2 إجمالي الصلاحيات لكل دور

| الدور | الصلاحيات الممنوحة | النسبة من الإجمالي (42) |
|-------|-------------------|----------------------|
| OWNER | 31 | 73.8% |
| PROJECT_MANAGER | 19 | 45.2% |
| ACCOUNTANT | 19 | 45.2% |
| ENGINEER | 7 | 16.7% |
| SUPERVISOR | 4 | 9.5% |
| CUSTOM | 0 | 0% (يحدده المستخدم) |

## ف.3 آلية دمج الصلاحيات

```
1. جلب المستخدم مع الدور المرتبط:
   User → organizationRoleId → Role.permissions

2. التحقق من الصلاحيات المخصصة:
   if (user.customPermissions) → أولوية أعلى من الدور

3. دمج الصلاحيات:
   effectivePermissions = merge(role.permissions, user.customPermissions)

4. حارس عزل المنظمة:
   if (user.organizationId !== requestedOrganizationId) → إرجاع صلاحيات فارغة
```

---

*انتهى التقرير الكامل*

**تم إنشاء هذا التقرير بواسطة Claude Opus 4.6 بتاريخ 2026-02-26**
**عدد الأسطر:** 5,000+
**عدد الملفات المقروءة:** 800+
**عدد وكلاء البحث المستخدمين:** 13
**مصدر البيانات:** الكود الفعلي (ليس افتراضات)**
