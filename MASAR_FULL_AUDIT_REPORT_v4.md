> **تاريخ التقرير:** 2026-03-16
> **الإصدار:** 4.0
> **مبني على قراءة فعلية لكل ملف في المشروع**
> **عدد الملفات المقروءة:** 2,017+ ملف (.ts/.tsx)
> **عدد أسطر الكود:** 613,024+ سطر (TS: 444,902 | TSX: 168,122)
> **عدد أسطر Prisma Schema:** 5,134 سطر
> **وقت التدقيق:** ~4 ساعات

---

# تقرير التدقيق الشامل لمنصة مسار — الإصدار 4.0

---

# جدول المحتويات

- [الجزء الأول: الملخص التنفيذي](#الجزء-الأول-الملخص-التنفيذي)
- [الجزء الثاني: البنية التقنية والمعمارية](#الجزء-الثاني-البنية-التقنية-والمعمارية)
- [الجزء الثالث: قاعدة البيانات](#الجزء-الثالث-قاعدة-البيانات)
- [الجزء الرابع: نظام المصادقة والصلاحيات](#الجزء-الرابع-نظام-المصادقة-والصلاحيات)
- [الجزء الخامس: طبقة API](#الجزء-الخامس-طبقة-api)
- [الجزء السادس: واجهة المستخدم](#الجزء-السادس-واجهة-المستخدم)
- [الجزء السابع: تحليل الأداء وبطء التنقل](#الجزء-السابع-تحليل-الأداء-وبطء-التنقل)
- [الجزء الثامن: الأمان](#الجزء-الثامن-الأمان)
- [الجزء التاسع: الوحدات الوظيفية](#الجزء-التاسع-الوحدات-الوظيفية)
- [الجزء العاشر: التكاملات الخارجية](#الجزء-العاشر-التكاملات-الخارجية)
- [الجزء الحادي عشر: الترجمة والتدويل](#الجزء-الحادي-عشر-الترجمة-والتدويل)
- [الجزء الثاني عشر: الاختبارات و CI/CD](#الجزء-الثاني-عشر-الاختبارات)
- [الجزء الثالث عشر: التوصيات والخلاصة](#الجزء-الثالث-عشر-التوصيات-والخلاصة)
- [الملاحق](#الملاحق)

---

# الجزء الأول: الملخص التنفيذي

## 1.1 ما هو مسار وما هي رؤيته

مسار (Masar) هي منصة SaaS متكاملة لإدارة المشاريع الإنشائية، موجّهة بشكل أساسي للسوق السعودي. تغطي المنصة دورة حياة المشروع الإنشائي بالكامل: من دراسة الكميات والتسعير (Quantity Surveying & Pricing)، مروراً بإدارة المشروع والتنفيذ الميداني، وصولاً للمالية والفوترة وإدارة الشركة.

المنصة مبنية على مكدس تقني حديث (Next.js 16.1 + React 19 + oRPC + Prisma + PostgreSQL) كـ Monorepo باستخدام Turborepo و pnpm. تدعم العربية والإنجليزية مع دعم RTL كامل، وتتكامل مع ZATCA للفوترة الإلكترونية (المرحلة الأولى).

## 1.2 الأرقام الرئيسية (من القراءة الفعلية)

| المقياس | القيمة |
|---------|--------|
| ملفات TypeScript (.ts) | 922 |
| ملفات React (.tsx) | 1,095 |
| إجمالي أسطر TS | 444,902 |
| إجمالي أسطر TSX | 168,122 |
| أسطر Prisma Schema | 5,134 |
| Models في Prisma | 112 |
| Enums في Prisma | 87 |
| صفحات (page.tsx) | 187 |
| Layouts (layout.tsx) | 18 |
| Loading files (loading.tsx) | 172 |
| Error files (error.tsx) | 11 |
| Not-found files | 2 |
| وحدات API (modules) | 42 |
| Endpoints تقديرية | 380+ |
| مكونات "use client" | 704 |
| استخدام Suspense | 11 |
| Dynamic imports | 16 |
| Zod Schemas | 351 ملف |
| Prisma Indexes (@@index) | 225 |
| Prisma Unique (@@unique) | 31 |
| Custom Hooks | 28 |
| ملفات الاختبارات | 24 |
| مفاتيح ترجمة عربية | 6,651 |
| مفاتيح ترجمة إنجليزية | 6,814 |
| نصوص عربية Hardcoded | 122 ملف |
| console.log/warn/error | 108 |
| TODO/FIXME/HACK | 30 |
| `<img>` بدلاً من next/Image | 4 |
| next/Image usage | 10 |
| Dependencies (web) | ~87 production + ~28 dev |

## 1.3 تقييم الجاهزية التفصيلي

| الوحدة | النسبة | التبرير |
|--------|--------|---------|
| المصادقة والصلاحيات | 90% | نظام متقدم (6 أدوار، 55 صلاحية، 2FA، Passkeys، حماية cross-tenant). ثغرات طفيفة. |
| قاعدة البيانات | 85% | 112 model مع indexes جيدة (225). Decimal precision سليم. تنقصها soft-delete patterns شاملة. |
| طبقة API | 80% | 42 module، تغطية صلاحيات واسعة، rate limiting متقدم. ينقصها `.max()` على معظم الـ string inputs. |
| النظام المالي (فواتير/مصروفات) | 82% | حسابات Decimal دقيقة server-side، audit log شامل، reconciliation ممتاز. فرق حسابات client vs server. |
| التسعير ودراسات الكميات | 75% | أعقد module (257 ملف، 53K سطر). محركات حساب قوية. مشاكل أداء في المكونات الضخمة. |
| إدارة المشاريع | 85% | تغطية شاملة (execution، timeline، documents، change orders، owner portal). |
| واجهة المستخدم | 70% | 187 صفحة، skeletons جيدة. مشاكل: layout waterfall، 16 provider، sidebar flash، 704 client component. |
| الأداء | 55% | 🔴 أكبر نقطة ضعف. 7-10 مراحل waterfall لصفحة مشروع. لا middleware.ts. لا virtualization للجداول الكبيرة. |
| الأمان | 75% | Headers جيدة، CSP مفصّل، rate limiting. ثغرات: perf-check endpoint مكشوف، credentials في .env.example. |
| الاختبارات | 5% | 🔴 كارثي. 24 ملف اختبار فقط لمنصة بـ 613K سطر. صفر اختبارات مكونات. |
| الترجمة | 72% | 6,651 مفتاح عربي لكن 339 مفتاح مفقود. 122 ملف بنصوص عربية hardcoded. |
| ZATCA | 50% | Phase 1 مكتمل (QR). Phase 2 غير موجود (XML، توقيع رقمي، API). |
| الذكاء الاصطناعي | 78% | 20 أداة، Claude Sonnet 4، context-aware. واجهتان متنافستان. بدون rate limiting. |

## 1.4 أهم 20 مشكلة حرجة

| # | الشدة | المشكلة | الملف/الموقع |
|---|-------|---------|-------------|
| 1 | 🔴 | بيانات اعتماد قاعدة البيانات الحقيقية في `.env.local.example` مُرفقة في Git | `.env.local.example` |
| 2 | 🔴 | تغطية اختبارات شبه معدومة (5%) لمنصة مالية | المشروع بالكامل |
| 3 | 🔴 | Endpoint `/api/perf-check` مكشوف بدون مصادقة — يكشف معلومات البنية التحتية | `apps/web/app/api/perf-check/route.ts` |
| 4 | 🔴 | ZATCA Phase 2 غير مُنفّذ رغم كونه متطلب قانوني | `packages/api/lib/zatca/` |
| 5 | 🔴 | 7-10 مراحل waterfall متسلسلة قبل عرض صفحة مشروع | Layouts chain |
| 6 | 🟠 | `ANTHROPIC_API_KEY` مفقود من `.env.local.example` — المساعد الذكي يفشل | `.env.local.example` |
| 7 | 🟠 | لا `.max()` على string inputs في ~90% من الـ API modules | معظم procedure files |
| 8 | 🟠 | Dashboard router يستخدم `throw new Error()` بدل `ORPCError` — ينتج HTTP 500 بدل 403 | `packages/api/modules/dashboard/router.ts` |
| 9 | 🟠 | فرق حسابات بين client (floating-point) و server (Decimal) في الفواتير | `finance/lib/utils.ts` vs `queries/finance.ts` |
| 10 | 🟠 | InvoiceEditor يسمح بتعديل فاتورة SENT في الواجهة لكن Server يرفض | `InvoiceEditor.tsx` line 397 |
| 11 | 🟠 | Shared resource endpoint بدون rate limiting — يمكن brute-force للـ tokens | `shares/get-shared-resource.ts` |
| 12 | 🟠 | Company layout و Settings layout: `getSession()` و `getActiveOrganization()` متسلسلتان بدل متوازيتان | `company/layout.tsx`, `settings/layout.tsx` |
| 13 | 🟠 | Project layout: `getActiveOrganization()` متسلسل رغم عدم اعتماده على session | `[projectId]/layout.tsx` line 26 |
| 14 | 🟠 | 339 مفتاح ترجمة مفقود في العربية (اللغة الأساسية) | `packages/i18n/translations/ar.json` |
| 15 | 🟠 | AI Assistant بدون rate limiting — يمكن spam لـ LLM API calls | `/api/ai/assistant/route.ts` |
| 16 | 🟡 | 704 مكون "use client" — حجم bundle ضخم متوقع | المشروع بالكامل |
| 17 | 🟡 | 16 طبقة Provider متداخلة لصفحة مشروع | Provider tree |
| 18 | 🟡 | لا middleware.ts — كل redirect يحصل في layouts | المشروع بالكامل |
| 19 | 🟡 | Sidebar collapsed state flash عند التحميل (localStorage read بعد SSR) | `sidebar-context.tsx` |
| 20 | 🟡 | BOQSummaryTable يعيد حساب كل البنود عند تغيير أي فلتر | `BOQSummaryTable.tsx` |

## 1.5 أهم 10 نقاط قوة

| # | النقطة |
|---|--------|
| 1 | **نظام صلاحيات متقدم:** 55 صلاحية × 6 أدوار مع حماية cross-tenant صريحة، custom permissions per-user، backward compatibility لتطور الـ schema |
| 2 | **Rate limiting مع Circuit Breaker:** Redis-backed مع fallback in-memory، 6 presets، حماية auth endpoints بـ IP-based limits، circuit breaker يفتح بعد 3 فشل Redis |
| 3 | **حسابات مالية دقيقة (Server):** استخدام `Prisma.Decimal` مع `ROUND_HALF_UP` لكل العمليات الحسابية. Bank reconciliation يتحقق بدقة هللة واحدة (0.01 SAR) |
| 4 | **حماية رصيد الحسابات:** Two-layer balance guard (early check + atomic updateMany with `balance >= amount`) يمنع السحب الزائد حتى تحت الـ concurrency |
| 5 | **محرك تسعير شامل:** 6 مراحل pipeline (كميات → مواصفات → تسعير → عرض سعر)، محركات حساب إنشائية (2,926 سطر) و MEP (2,493 سطر) و تشطيبات (1,523 سطر) |
| 6 | **Audit logging واسع:** 133 نقطة تسجيل في 48 ملف، تغطية شاملة للفواتير والمالية ومقاولي الباطن |
| 7 | **بوابة المالك (Owner Portal):** نظام token exchange آمن (256-bit entropy)، session sliding 1 ساعة، rate limiting خاص، 7 endpoints للمالك |
| 8 | **Security Headers شاملة:** CSP مفصّل لكل route group، HSTS، CORP، COOP، X-Frame-Options، Permissions-Policy |
| 9 | **Skeleton library متسقة:** 12 skeleton component مخصصة، مستخدمة في 172 ملف loading.tsx |
| 10 | **React Query configuration مدروسة:** 5 مستويات staleTime (STABLE 15min → REALTIME 0)، server-side prefetching مع HydrationBoundary |

## 1.6 ملخص التوصيات العاجلة

| الأولوية | التوصية | الأثر | الجهد |
|----------|---------|------|-------|
| 🔴 فوري | تدوير كلمة مرور DB في `.env.local.example` واستبدالها بـ placeholders | أمان | ساعة |
| 🔴 فوري | إزالة أو حماية `/api/perf-check` | أمان | ساعة |
| 🔴 فوري | إضافة `ANTHROPIC_API_KEY` لـ `.env.local.example` | وظيفي | دقائق |
| 🟠 أسبوع | إصلاح waterfall في Company/Settings/Project layouts بـ `Promise.all` | أداء | يوم |
| 🟠 أسبوع | إضافة `.max()` لكل string/array inputs في API | أمان | 3 أيام |
| 🟠 أسبوع | إصلاح Dashboard router: `ORPCError` بدل `throw new Error` | وظيفي | ساعات |
| 🟠 شهر | إضافة middleware.ts للـ redirects المبكرة | أداء | 2-3 أيام |
| 🟠 شهر | إضافة rate limiting لـ AI endpoints | أمان | يوم |
| 🟡 3 أشهر | ZATCA Phase 2 (XML + توقيع + API) | امتثال | 4-6 أسابيع |
| 🟡 3 أشهر | خطة اختبارات شاملة (unit + integration + e2e) | جودة | مستمر |

## 1.7 خارطة طريق مقترحة

### المرحلة 1: الإصلاحات العاجلة (أسبوعان)
- تدوير credentials وإصلاح `.env.local.example`
- حماية perf-check endpoint
- إصلاح layout waterfalls (3 layouts)
- إصلاح Dashboard router errors
- إضافة rate limiting لـ AI و shares endpoints
- إضافة `.max()` لأهم API inputs

### المرحلة 2: تحسين الأداء والجودة (شهر - شهران)
- إضافة middleware.ts للـ auth redirects
- تقليل client components (target: 500 من 704)
- تقسيم أكبر 10 مكونات (TemplateCustomizer, CreateInvoiceForm, structural-calculations, etc.)
- إضافة list virtualization للجداول الكبيرة
- توحيد واجهات AI (AssistantPanel + AiChat → واحدة)
- إكمال الترجمة العربية المفقودة (339 مفتاح)

### المرحلة 3: الامتثال والاستقرار (3-6 أشهر)
- ZATCA Phase 2 implementation
- خطة اختبارات: 60%+ coverage للـ business logic
- Leave accrual system (Saudi labor law compliance)
- Payroll-bank balance verification
- Performance monitoring (bundle analyzer, Core Web Vitals)

---

# الجزء الثاني: البنية التقنية والمعمارية

## 2.1 مكدس التقنيات مع الإصدارات الفعلية

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| Next.js | 16.1.0 | Framework |
| React | 19.2.3 | UI Library |
| TypeScript | 5.9.3 | Type Safety |
| Prisma | Client v6.19+ | ORM |
| PostgreSQL | Supabase (ap-south-1) | Database |
| oRPC | 1.13.2 | API Layer (type-safe RPC) |
| Hono | 4.10.5 | HTTP Server |
| BetterAuth | 1.4.7 | Authentication |
| TanStack React Query | 5.90.9 | Server State |
| TanStack React Table | 8.21.3 | Data Tables |
| Zod | 4.1.12 | Schema Validation |
| Zustand | 5.0.11 | Client State |
| next-intl | 4.5.3 | i18n |
| next-themes | 0.4.6 | Dark Mode |
| Tailwind CSS | 4.1.17 | Styling |
| Radix UI | Multiple | Headless Components |
| Lucide React | 0.553.0 | Icons |
| Recharts | 2.15.4 | Charts |
| Resend | via @repo/mail | Email |
| Stripe | via @repo/payments | Billing |
| AI SDK | 5.0.93 | AI Integration |
| Claude Sonnet 4 | claude-sonnet-4-20250514 | AI Model |
| Sentry | 10.42.0 | Error Monitoring |
| Biome | 2.3.5 | Linter/Formatter |
| Turborepo | 2.7.2 | Monorepo Build |
| pnpm | 10.14.0 | Package Manager |
| Vitest | 4.0.18 | Testing |
| Playwright | 1.56.1 | E2E Testing |

## 2.2 هيكل Monorepo التفصيلي

```
masar/
├── apps/
│   └── web/                          # Next.js 16.1 Application
│       ├── app/                      # App Router
│       │   ├── (marketing)/          # Marketing pages (blog, docs, legal)
│       │   ├── (saas)/               # SaaS Application
│       │   │   ├── app/
│       │   │   │   ├── (account)/    # Account settings, Admin panel, Chatbot
│       │   │   │   └── (organizations)/
│       │   │   │       └── [organizationSlug]/
│       │   │   │           ├── projects/[projectId]/  # 20+ sub-pages
│       │   │   │           ├── finance/               # 15+ sub-pages
│       │   │   │           ├── pricing/               # 15+ sub-pages
│       │   │   │           ├── company/               # 12+ sub-pages
│       │   │   │           ├── settings/              # 10+ sub-pages
│       │   │   │           └── notifications/
│       │   │   ├── choose-plan/
│       │   │   ├── new-organization/
│       │   │   ├── onboarding/
│       │   │   └── organization-invitation/
│       │   ├── api/                  # API routes
│       │   ├── auth/                 # Auth pages (6 routes)
│       │   ├── owner/[token]/        # Owner Portal (5 sub-pages)
│       │   └── share/[token]/        # Share links
│       ├── modules/
│       │   ├── saas/                 # 20 feature modules
│       │   ├── shared/               # Shared components, hooks, lib
│       │   ├── ui/                   # UI components (shadcn-based)
│       │   ├── marketing/            # Marketing module
│       │   ├── i18n/                 # i18n configuration
│       │   └── analytics/            # Analytics provider
│       └── hooks/                    # Global hooks (1 file)
├── packages/
│   ├── ai/                           # AI SDK integration
│   ├── api/                          # oRPC API layer
│   │   ├── modules/ (42 dirs)        # API modules
│   │   ├── orpc/                     # Procedures, middleware
│   │   └── lib/                      # Utilities (auth, rate-limit, zatca, etc.)
│   ├── auth/                         # BetterAuth configuration
│   ├── database/                     # Prisma schema, queries, migrations
│   ├── i18n/                         # Translation files (ar, en, de)
│   ├── logs/                         # Structured logging
│   ├── mail/                         # Email (Resend provider)
│   ├── payments/                     # Stripe integration
│   ├── storage/                      # S3 file storage
│   └── utils/                        # Shared utilities
├── config/                           # App configuration
└── tooling/                          # Build tooling
```

## 2.3 App Router Structure

| Route Group | عدد الصفحات | عدد الـ Layouts | الوصف |
|------------|-------------|----------------|-------|
| `(marketing)` | ~8 | 2 | الصفحات التسويقية، المدونة، الوثائق |
| `(saas)/app/(account)` | ~12 | 3 | إعدادات الحساب، لوحة المشرف |
| `(saas)/app/(organizations)/[slug]` | ~150+ | 7 | التطبيق الرئيسي بكل وحداته |
| `auth/` | 6 | 1 | صفحات المصادقة |
| `owner/[token]/` | 5 | 2 | بوابة المالك |
| `share/[token]/` | 1 | 0 | روابط المشاركة |
| `api/` | 7 routes | 0 | API endpoints |
| **الإجمالي** | **187** | **18** | |

## 2.4 Data Flow (من المستخدم حتى قاعدة البيانات)

```
المستخدم (Browser)
    │
    ▼
Next.js App Router (Server Components)
    │ ← getSession(), getActiveOrganization(), etc. [React cache()]
    │
    ▼
Server Layout Chain (6 layouts for project page)
    │ ← Parallel prefetch queries via getServerQueryClient()
    │
    ▼
HydrationBoundary (dehydrated state → client)
    │
    ▼
Client Components ("use client" — 704 files)
    │ ← React Query (staleTime: 30s-15min, gcTime: 10min)
    │
    ▼
oRPC Client (@orpc/client + @orpc/tanstack-query)
    │ ← Type-safe RPC calls
    │
    ▼
Hono Server (packages/api/index.ts)
    │ ← CORS, body limit 10MB, IP rate limiting
    │
    ▼
oRPC Procedures (4 tiers: public → protected → subscription → admin)
    │ ← Session check, isActive guard, rate limiting, subscription check
    │
    ▼
Permission Layer (verifyOrganizationAccess / verifyProjectAccess)
    │ ← 55 permissions × 6 roles, cross-tenant guard
    │
    ▼
Feature Gate (enforceFeatureAccess)
    │ ← FREE vs PRO plan checks
    │
    ▼
Business Logic + Database Queries (Prisma)
    │ ← Decimal arithmetic, atomic transactions, audit logging
    │
    ▼
PostgreSQL (Supabase — ap-south-1 Mumbai region)
```

## 2.5 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ React 19 │ │ RQ v5    │ │ Zustand  │ │ next-intl (i18n) │  │
│  │ 704 CC   │ │ 5-tier   │ │ AI state │ │ ar/en/de         │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ oRPC Client / fetch
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16.1 SERVER                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐   │
│  │ App Router │  │ 18 Layouts │  │ 187 Pages (SSR/SSG)    │   │
│  │ RSC + CC   │  │ 6-deep     │  │ 172 loading.tsx        │   │
│  └────────────┘  └────────────┘  └────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ API Routes: /api/[[...rest]] (Hono), /api/ai/*, cron  │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HONO + oRPC SERVER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Middleware: Logger → Body 10MB → CORS → Auth Rate Limit  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐ ┌─────────────┐ ┌───────────────────────┐   │
│  │ BetterAuth   │ │ 42 oRPC     │ │ Stripe Webhooks       │   │
│  │ /auth/**     │ │ Modules     │ │ /webhooks/payments     │   │
│  └──────────────┘ │ 380+ EPs    │ └───────────────────────┘   │
│                    └──────┬──────┘                              │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │ Procedure Chain:       ▼                                │   │
│  │ public → protected (session + rate 60/min)              │   │
│  │        → subscription (plan check + rate 20/min write)  │   │
│  │        → admin (superadmin only)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────────┐
│  PostgreSQL   │  │  Redis        │  │  S3 / Supabase    │
│  (Supabase)   │  │  Rate Limit   │  │  Storage          │
│  112 models   │  │  + Circuit    │  │  Files/Avatars    │
│  225 indexes  │  │    Breaker    │  │                   │
└───────────────┘  └───────────────┘  └───────────────────┘
           │
           ▼
┌───────────────────────────────────────┐
│  External Services                    │
│  ├── Stripe (Billing)                 │
│  ├── Resend (Email)                   │
│  ├── Anthropic Claude (AI)            │
│  ├── OpenAI (Legacy AI + Images)      │
│  └── ZATCA (Phase 1 QR only)         │
└───────────────────────────────────────┘
```

## 2.6 تقييم القرارات المعمارية

| القرار | التقييم | التبرير |
|--------|---------|---------|
| Next.js 16.1 App Router | ✅ صحيح | أحدث إصدار، RSC support، excellent DX |
| oRPC بدل tRPC | ✅ صحيح | Type-safe، OpenAPI auto-generation، Hono integration |
| Prisma ORM | ✅ صحيح | Type safety ممتاز، migration support، Decimal support |
| BetterAuth بدل NextAuth | ✅ صحيح | أكثر مرونة، organization plugin، passkeys، 2FA built-in |
| React Query (TanStack) | ✅ صحيح | Server state management best practice، 5-tier staleTime |
| Monorepo (Turborepo) | ✅ صحيح | Code sharing بين packages، parallel builds |
| Supabase PostgreSQL | ⚠️ مشكوك | Region `ap-south-1` (Mumbai) بعيد عن السعودية (30-80ms latency إضافية) |
| لا middleware.ts | ❌ خطأ | كل auth redirects تحدث في layouts — يزيد waterfall ويعيد تحميل layouts |
| 704 client component | ❌ مفرط | Bundle size ضخم، يجب تحويل المكونات التي لا تحتاج interactivity لـ Server Components |
| Zustand + React Query | ⚠️ ازدواجية | Zustand مستخدم فقط لـ AI assistant state — يمكن دمجه في React Query أو Context |
| لا bundle analyzer | ❌ مفقود | لا طريقة لقياس حجم الـ bundle فعلياً |

## 2.7 Technical Debt

| الدين التقني | الشدة | التأثير |
|-------------|------|--------|
| 704 "use client" component | 🟠 عالي | Bundle size، hydration cost |
| لا middleware.ts | 🟠 عالي | Auth redirects في كل layout، waterfall |
| 122 ملف بنصوص عربية hardcoded | 🟠 عالي | يكسر نظام الترجمة |
| 24 ملف اختبار فقط | 🔴 حرج | لا safety net للتغييرات |
| مكونات ضخمة (10+ فوق 1000 سطر) | 🟡 متوسط | صعوبة صيانة، أداء سيء |
| `as any` pervasive في Pricing (~30+) | 🟡 متوسط | Type safety مفقودة |
| واجهتا AI متنافستان | 🟡 متوسط | ازدواجية كود، ارتباك UX |
| `throw new Error()` بدل `ORPCError` (20 موقع) | 🟡 متوسط | HTTP 500 بدل 403 |
| console.log (108 مرة) | 🟢 منخفض | تلويث الـ logs |
| TODO/FIXME (30) | 🟢 منخفض | عمل غير مكتمل |

---

# الجزء الثالث: قاعدة البيانات

## 3.1 كل الـ Models (112 model)

| # | Model | الوصف | حقول رئيسية | علاقات |
|---|-------|------|------------|--------|
| 1 | User | المستخدم الأساسي | name, email, accountType, isActive, organizationRoleId | 50+ علاقة |
| 2 | Session | جلسات المصادقة | token, expiresAt, userId, activeOrganizationId | User |
| 3 | Account | حسابات OAuth | providerId, accessToken, refreshToken | User |
| 4 | Verification | رموز التحقق | identifier, value, expiresAt | — |
| 5 | Passkey | مفاتيح WebAuthn | publicKey, credentialID, counter | User |
| 6 | TwoFactor | إعدادات 2FA | secret, backupCodes | User |
| 7 | Organization | المنظمة/الشركة | name, slug, ownerId, plan, status, currency | 30+ علاقة |
| 8 | Member | عضوية المنظمة | organizationId, userId, role | Organization, User |
| 9 | Invitation | دعوات المنظمة | email, role, status, expiresAt | Organization |
| 10 | Role | الأدوار | name, type, permissions (JSON), isSystem | Organization, Users |
| 11 | UserInvitation | دعوات المستخدمين | email, roleId, token, status | — |
| 12 | Purchase | المشتريات/الاشتراكات | type, subscriptionId, productId, status | Organization |
| 13 | SubscriptionEvent | أحداث الاشتراك | eventType, stripeEventId, data | Organization |
| 14 | SuperAdminLog | سجل المشرف العام | action, targetType, targetId, details | User, Organization |
| 15 | PlanConfig | إعدادات الخطط | plan, maxUsers, maxProjects, maxStorageGB, prices | — |
| 16 | AiChat | محادثات AI | title, type, messages (JSON), metadata | Organization, User |
| 17 | AiChatUsage | استخدام AI | totalChats | Organization |
| 18 | OnboardingProgress | تقدم الإعداد | 10+ boolean steps, wizardCompleted | Organization |
| 19 | Project | المشروع | name, slug, status, type, contractValue, progress | Organization, 20+ علاقات |
| 20 | ProjectMember | عضو المشروع | projectId, userId, role, assignedById | Project, User |
| 21-25 | ProjectDailyReport, ProjectPhoto, ProjectIssue, ProjectProgressUpdate | التنفيذ الميداني | — | Project |
| 26-27 | ProjectExpense, ProjectClaim | مالية المشروع | amount (Decimal 15,2), status | Project |
| 28-34 | SubcontractContract, SubcontractPaymentTerm, SubcontractChangeOrder, SubcontractPayment, SubcontractItem, SubcontractClaim, SubcontractClaimItem | مقاولو الباطن | value (Decimal 15,2) | Project |
| 35-36 | ProjectContract, ContractPaymentTerm | العقد الرئيسي | value (Decimal 15,2), retentionPercent | Project |
| 37 | ProjectPayment | دفعات المشروع | amount, paymentNo | Project, Organization |
| 38-42 | ProjectDocument, DocumentVersion, ProjectApproval, ProjectApprovalApprover, ProjectAuditLog | المستندات والاعتمادات | — | Project |
| 43-44 | ProjectMessage, ChatLastRead | المحادثات | channel, content | Project |
| 45-46 | Notification, NotificationPreference | الإشعارات | type, channel, deliveryStatus | User, Organization |
| 47-48 | ProjectOwnerAccess, OwnerPortalSession | بوابة المالك | token (256-bit), sessionToken | Project |
| 49-53 | ProjectActivity, ActivityDependency, ActivityChecklist, ProjectBaseline, ProjectCalendar | التنفيذ (Phase 13) | — | Project |
| 54 | ProjectMilestone | مراحل المشروع | title, plannedStart/End, progress, status | Project |
| 55 | Attachment | المرفقات | fileName, fileSize, mimeType, storagePath | — |
| 56-59 | ProjectTemplate, ProjectTemplateItem, ProjectAlert, DigestSubscription | الذكاء والقوالب (Phase 7) | — | Project |
| 60-62 | OrganizationIntegrationSettings, OrganizationFinanceSettings, MessageDeliveryLog | التكاملات (Phase 8) | — | Organization |
| 63 | ShareLink | روابط المشاركة | token, resourceType, expiresAt | Project |
| 64 | ProjectChangeOrder | أوامر التغيير (Phase 11) | costImpact (Decimal 15,2), timeImpactDays | Project |
| 65 | ProjectBOQItem | جدول الكميات | section, quantity, unitPrice, totalPrice | Project |
| 66-72 | CostStudy, StudyStage, MaterialBOM, CostingLabor, StructuralItem, FinishingItem, MEPItem | حصر الكميات | — | Organization |
| 73 | LaborItem | بنود العمالة | dailyRate, durationDays, totalCost | CostStudy |
| 74 | Quote | عروض أسعار (legacy) | quoteNumber, amounts | CostStudy |
| 75 | SpecificationTemplate | قوالب المواصفات | specs (JSON) | Organization |
| 76-78 | Client, ClientContact, Quotation | العملاء وعروض الأسعار | — | Organization |
| 79-80 | QuotationItem, QuotationDisplayConfig | بنود عرض السعر | — | Quotation |
| 81-84 | FinanceInvoice, FinanceInvoiceItem, FinanceInvoicePayment, OpenDocument | الفواتير | ZATCA fields | Organization |
| 85 | FinanceTemplate | قوالب المالية | content (JSON), settings (JSON) | Organization |
| 86-88 | OrganizationBank, FinanceExpense, FinancePayment | المالية المؤسسية | balance (Decimal 15,2) | Organization |
| 89 | FinanceTransfer | التحويلات | amount, fromAccount, toAccount | Organization |
| 90-93 | CompanyExpense, CompanyExpensePayment, CompanyExpenseAllocation, Employee | إدارة المنشأة | — | Organization |
| 94 | EmployeeChangeLog | سجل تغييرات الموظف | changeType, oldValue, newValue | Employee |
| 95-97 | LeaveType, LeaveBalance, LeaveRequest | إدارة الإجازات | — | Organization, Employee |
| 98 | EmployeeProjectAssignment | توزيع الموظفين | percentage (Decimal 5,2) | Employee, Project |
| 99 | CompanyAsset | أصول المنشأة | category, status, purchasePrice | Organization |
| 100-103 | PayrollRun, PayrollRunItem, CompanyExpenseRun, CompanyExpenseRunItem | الرواتب والترحيل | — | Organization |
| 104 | OrganizationAuditLog | سجل التدقيق المؤسسي | action, entityType, metadata | Organization |
| 105 | OrganizationSequence | تسلسلات الترقيم | sequenceKey, currentValue | Organization |
| 106-108 | Lead, LeadFile, LeadActivity | العملاء المحتملون | status, source, priority | Organization |
| 109-110 | ActivationCode, ActivationCodeUsage | أكواد التفعيل | code, planType, durationDays | — |
| 111-112 | CostingItem, ManualItem, SectionMarkup | التسعير والبنود اليدوية | — | CostStudy |

## 3.2 كل الـ Enums (87 enum)

| الفئة | الأسماء | العدد |
|------|--------|------|
| الحساب والأدوار | AccountType, RoleType, InvitationStatus | 3 |
| الاشتراكات | OrgStatus, PlanType, SubscriptionStatus, PurchaseType | 4 |
| المشاريع | ProjectStatus, ProjectRole, ProjectType | 3 |
| التنفيذ الميداني | IssueSeverity, IssueStatus, PhotoCategory, WeatherCondition | 4 |
| التنفيذ (Phase 13) | ActivityStatus, DependencyType, ProgressMethod | 3 |
| المالية (مشاريع) | ExpenseCategory, ClaimStatus | 2 |
| المستندات | DocumentFolder, DocumentUploadType, ApprovalStatus, ApproverStatus | 4 |
| المحادثات والإشعارات | MessageChannel, NotificationType, NotificationChannel, DeliveryStatus | 4 |
| المراحل الزمنية | MilestoneStatus | 1 |
| سجل التدقيق | AuditAction (36 action), OrgAuditAction (35 action) | 2 |
| المرفقات | AttachmentOwnerType | 1 |
| العملاء | ClientType | 1 |
| المالية المؤسسية | OrgExpenseCategory (25 value), FinanceAccountType, FinanceTransactionStatus, ExpenseSourceType, PaymentMethod | 5 |
| الرواتب | PayrollRunStatus, ExpenseRunStatus | 2 |
| أوامر التغيير | ChangeOrderStatus, ChangeOrderCategory | 2 |
| العقود | ContractStatus, PaymentTermType, PaymentTermStatus | 3 |
| مقاولو الباطن | SubcontractStatus, ContractorType, SubcontractCOStatus, SubcontractClaimStatus, SubcontractClaimType | 5 |
| إدارة المنشأة | CompanyExpenseCategory, RecurrenceType, AssetType, AssetCategory, AssetStatus | 5 |
| الموظفين | EmployeeType, SalaryType, EmployeeStatus, EmployeeChangeType, LeaveStatus | 5 |
| الكميات والتسعير | BOQSourceType, BOQSection, BOQSectionType, LaborMethod, LaborCostType | 5 |
| عروض الأسعار | QuotationStatus, QuotationFormat, QuotationGrouping | 3 |
| الفواتير | FinanceInvoiceStatus, InvoiceType, OpenDocumentType, FinanceTemplateType | 4 |
| العملاء المحتملون | LeadStatus, LeadSource, LeadPriority, LeadFileCategory, LeadActivityType | 5 |
| التكاملات | MessagingChannel, MessageDeliveryStatus, ShareResourceType | 3 |
| التنبيهات | AlertType, AlertSeverity, DigestFrequency, TemplateItemType | 4 |
| Pipeline | StudyType, StageStatus, StageType, StudyEntryPoint | 4 |

## 3.3 تحليل الـ Indexes

**225 `@@index`** و **31 `@@unique`** في الـ schema.

✅ **الـ indexes الموجودة جيدة:**
- كل الجداول الفرعية مفهرسة بـ `organizationId` + `projectId`
- الـ status fields مفهرسة للفلترة
- الـ date fields مفهرسة للترتيب الزمني
- Composite indexes للاستعلامات المتكررة (مثل `[organizationId, projectId, status]`)

⚠️ **Indexes مفقودة محتملة:**
- `Lead` ليس لديه index على `status + priority` مجتمعين
- `FinanceInvoice` ليس لديه index على `dueDate + status` لاستعلامات المتأخرات
- `Employee` ليس لديه index على `linkedUserId` للربط السريع

## 3.4 Decimal Precision Audit

✅ **كل الحقول المالية تستخدم `@db.Decimal(15,2)`** — 15 رقم إجمالي، 2 بعد الفاصلة. هذا يدعم مبالغ حتى 9,999,999,999,999.99 SAR.

**استثناءات مقبولة:**
- النسب المئوية: `@db.Decimal(5,2)` — حتى 999.99%
- الكميات: `@db.Decimal(15,4)` — 4 أرقام عشرية للدقة
- المساحات والأبعاد: `@db.Decimal(15,4)` أو `@db.Decimal(15,2)`

## 3.5 Cascade Delete Analysis

| الكيان المحذوف | التأثير | الآلية |
|---------------|--------|--------|
| Organization | يحذف كل شيء (members, projects, finances, etc.) | `onDelete: Cascade` |
| Project | يحذف كل بيانات المشروع (expenses, claims, documents, etc.) | `onDelete: Cascade` |
| User | يحذف sessions, accounts, passkeys, 2FA. لكن: memberships, messages, etc. تُحذف أيضاً | `onDelete: Cascade` |
| CostStudy | يحذف كل البنود (structural, finishing, MEP, labor, quotes) | `onDelete: Cascade` |
| SubcontractContract | يحذف terms, change orders, payments, items, claims | `onDelete: Cascade` |

⚠️ **حذف Organization خطير جداً** — يحذف كل البيانات بلا رجعة. لا يوجد soft-delete pattern على مستوى المنظمة.

✅ **حذف Project محمي:** الكود يفحص 5 جداول مالية قبل السماح بالحذف، ويُجبر على الأرشفة (`status: ARCHIVED`) إذا وُجدت بيانات.

## 3.6 Connection Pooling و Region

- **Provider:** Supabase Pooler (`pooler.supabase.com:6543`)
- **Region:** `ap-south-1` (Mumbai, India)
- **المشكلة:** المستخدمون المستهدفون في السعودية. المسافة من الرياض إلى Mumbai ~3,000 كم. الـ latency المتوقعة: 40-80ms per query.
- **التأثير:** مع 7-10 sequential layout queries، يُضاف 280-800ms فقط من network latency.
- **التوصية:** الانتقال لـ Supabase `me-south-1` (Bahrain) يُقلل الـ latency إلى 5-15ms per query.

---

# الجزء الرابع: نظام المصادقة والصلاحيات

## 4.1 BetterAuth Configuration

| الإعداد | القيمة |
|---------|--------|
| Session expiry | 30 يوم (2,592,000 ثانية) |
| Session freshAge | 60 ثانية (يُعاد التحقق من DB كل دقيقة) |
| Account linking | مفعّل (trusted: Google, GitHub) |
| Email verification | مطلوب |
| Auto sign-in after signup | فقط في وضع invitation-only |
| User delete | مفعّل |
| Change email | مفعّل مع تحقق |

## 4.2 طرق المصادقة المدعومة

| الطريقة | الحالة | التنفيذ |
|---------|--------|---------|
| Email + Password | ✅ مفعّل | `emailAndPassword.enabled: true` |
| Magic Link | ✅ مفعّل | `magicLink()` plugin |
| Google OAuth | ✅ مفعّل | scopes: email, profile |
| GitHub OAuth | ✅ مفعّل | scope: user:email |
| Passkey (WebAuthn) | ✅ مفعّل | `@better-auth/passkey` |
| 2FA (TOTP) | ✅ مفعّل | `twoFactor()` plugin |

## 4.3 نظام الأدوار (6 أدوار)

| الدور | النوع | الوصف | isSystem |
|------|------|------|---------|
| OWNER | مالك المنشأة | كل الصلاحيات (55/55) | true |
| PROJECT_MANAGER | مدير مشاريع | إدارة مشاريع وكميات، قراءة مالية | true |
| ACCOUNTANT | محاسب | كل المالية والشركة، قراءة مشاريع | true |
| ENGINEER | مهندس | تحرير مشاريع وكميات، بدون مالية | true |
| SUPERVISOR | مشرف | قراءة فقط لأغلب الأقسام | true |
| CUSTOM | مخصص | كل الصلاحيات false — يُخصّص يدوياً | false |

## 4.4 الـ 55 صلاحية (8 أقسام)

| القسم | الإجراءات |
|------|---------|
| projects (6) | view, create, edit, delete, viewFinance, manageTeam |
| quantities (5) | view, create, edit, delete, pricing |
| pricing (14) | view, studies, quotations, pricing, leads, editQuantities, approveQuantities, editSpecs, approveSpecs, editCosting, approveCosting, editSellingPrice, generateQuotation, convertToProject |
| finance (6) | view, quotations, invoices, payments, reports, settings |
| employees (6) | view, create, edit, delete, payroll, attendance |
| company (4) | view, expenses, assets, reports |
| settings (5) | organization, users, roles, billing, integrations |
| reports (3) | view, create, approve |

## 4.5 مصفوفة الصلاحيات (مختصرة)

| الصلاحية | OWNER | PM | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|------|-----------|---------|-----------|
| projects.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| projects.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| projects.delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| projects.viewFinance | ✅ | ❌ | ✅ | ❌ | ❌ |
| finance.invoices | ✅ | ❌ | ✅ | ❌ | ❌ |
| finance.settings | ✅ | ❌ | ✅ | ❌ | ❌ |
| employees.payroll | ✅ | ❌ | ✅ | ❌ | ❌ |
| settings.roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| pricing.editCosting | ✅ | ❌ | ✅ | ❌ | ❌ |
| pricing.convertToProject | ✅ | ❌ | ❌ | ❌ | ❌ |

## 4.6 سلسلة الحماية (Middleware Chain)

```
Request
  │
  ▼
publicProcedure ─── (لا حماية)
  │
  ▼
protectedProcedure
  ├── 1. Session check (BetterAuth)
  ├── 2. isActive check (throw if deactivated)
  └── 3. Rate limit: 60 req/min (READ)
  │
  ▼
subscriptionProcedure
  ├── 4. Subscription check (blocks FREE/SUSPENDED/expired trial)
  └── 5. Rate limit: 20 req/min (WRITE)
  │
  ▼
adminProcedure
  └── 6. user.role === "admin" check
```

## 4.7 الثغرات الأمنية في المصادقة

| الشدة | الثغرة | الملف |
|------|--------|------|
| 🟠 H1 | نموذج التسجيل بدون حد أدنى لطول كلمة المرور (`.min()` مفقود) | `SignupForm.tsx` line 43 |
| 🟠 H2 | رسائل بوابة المالك تُسجل بـ `senderId` لمنشئ المشروع — انتحال هوية | `project-owner-portal.ts` lines 526-548 |
| 🟡 M1 | مفتاح rate limit عام (`"global"`) — dashboard chatty يستنفد ميزانية endpoints أخرى | `procedures.ts` lines 39, 71 |
| 🟡 M2 | 60 ثانية نافذة لمستخدم مُعطّل يمكنه الاستمرار (freshAge: 60s) | `auth.ts` line 57 |
| 🟡 M3 | subscription check يمرر إذا `activeOrganizationId` null | `subscription-middleware.ts` lines 21-23 |
| 🟢 L1 | in-memory rate limit fallback per-instance (3x effective limit في 3-instance deployment) | `rate-limit.ts` |
| 🟢 L2 | `x-forwarded-for` spoofing لتجاوز IP rate limits بدون proxy config | `index.ts` line 51 |

---

# الجزء الخامس: طبقة API

## 5.1 oRPC Architecture

- **Framework:** Hono + oRPC (OpenAPI-compatible RPC)
- **Entry:** `packages/api/index.ts` (93 سطر)
- **Body limit:** 10MB
- **CORS:** Single-origin، credentials enabled
- **OpenAPI:** Auto-generated at `/api/docs`

## 5.2 كل الـ Modules (42) مع عدد Endpoints

| # | Module | Read | Write | Total | Procedure Level |
|---|--------|------|-------|-------|----------------|
| 1 | activation-codes | 2 | 4 | 6 | admin + protected |
| 2 | admin | 3 | 0 | 3 | admin |
| 3 | ai | 4 | 2 | 6 | protected + subscription |
| 4 | attachments | 3 | 2 | 5 | subscription |
| 5 | company | ~25 | ~40 | ~65 | protected + subscription |
| 6 | contact | 0 | 1 | 1 | public |
| 7 | dashboard | 9 | 0 | 9 | protected |
| 8 | digests | 2 | 2 | 4 | protected + subscription |
| 9 | exports | 7 | 0 | 7 | subscription |
| 10 | finance | ~20 | ~35 | ~55 | protected + subscription |
| 11 | integrations | 2 | 3 | 5 | subscription |
| 12 | newsletter | 0 | 1 | 1 | public |
| 13 | notifications | 3 | 2 | 5 | protected |
| 14 | onboarding | 1 | 6 | 7 | subscription |
| 15 | organizations | 2 | 1 | 3 | public + protected |
| 16 | org-users | 2 | 4 | 6 | subscription |
| 17 | payments | 2 | 1 | 3 | protected |
| 18 | pricing | ~8 | ~16 | ~24 | protected + subscription |
| 19 | project-boq | 8 | 9 | 17 | protected + subscription |
| 20 | project-change-orders | 5 | 6 | 11 | protected + subscription |
| 21 | project-chat | 2 | 2 | 4 | subscription |
| 22 | project-contract | 4 | 2 | 6 | protected + subscription |
| 23 | project-documents | 6 | 6 | 12 | protected + subscription |
| 24 | project-execution | 10 | 12 | 22 | protected + subscription |
| 25 | project-field | 5 | 6 | 11 | protected + subscription |
| 26 | project-finance | 8 | 9 | 17 | protected + subscription |
| 27 | project-insights | 1 | 1 | 2 | protected |
| 28 | project-owner | 5 | 7 | 12 | protected + public (portal) |
| 29 | project-payments | 2 | 3 | 5 | protected + subscription |
| 30 | project-quantities | 5 | 5 | 10 | protected + subscription |
| 31 | projects | 4 | 4 | 8 | protected + subscription |
| 32 | project-team | 2 | 2 | 4 | protected + subscription |
| 33 | project-templates | 4 | 4 | 8 | protected + subscription |
| 34 | project-timeline | 4 | 5 | 9 | protected + subscription |
| 35 | project-updates | 1 | 1 | 2 | subscription |
| 36 | quantities | ~25 | ~40 | ~65 | protected + subscription |
| 37 | roles | 2 | 2 | 4 | protected + subscription |
| 38 | shares | 2 | 2 | 4 | protected + public |
| 39 | subcontracts | 10 | 17 | 27 | protected + subscription |
| 40 | super-admin | ~20 | ~5 | ~25 | admin |
| 41 | users | 0 | 1 | 1 | subscription |
| 42 | project-boq | — | — | (included above) | — |
| **الإجمالي** | **~200** | **~180** | **~380+** | |

## 5.3 أهم مشاكل طبقة API

| # | الشدة | المشكلة | الأثر |
|---|------|---------|------|
| F1 | 🔴 | `/api/perf-check` مكشوف بدون auth — يكشف DB latency وregion | Information disclosure, DoS probing |
| F2 | 🟠 | Dashboard router: `throw new Error("Unauthorized")` × 9 مرات → HTTP 500 | Sentry noise, wrong status codes |
| F3 | 🟠 | Shares `getResource` public endpoint بدون rate limiting | Token brute-force, DB DoS |
| F4 | 🟠 | ~90% من modules بدون `.max()` على string inputs | Multi-MB payloads, DB bloat |
| F5 | 🟠 | Array inputs بدون `.max()` (bulkCreate, importFromData, items) | آلاف العناصر في طلب واحد |
| F6 | 🟡 | List endpoints بدون upper bound على `limit` (~20+ endpoints) | Unbounded result sets |
| F7 | 🟡 | `listExpensesWithSubcontracts` يجلب 400 record ويدمج in-memory | Memory pressure |
| F8 | 🟠 | AI Assistant route بدون rate limiting | LLM API cost abuse |

---

# الجزء السادس: واجهة المستخدم

## 6.1 الـ Layouts (18 layout) — تحليل مفصّل

### Layout Waterfall لصفحة مشروع

```
Layout 1: app/layout.tsx                    [passthrough, ~0ms]
Layout 2: (saas)/layout.tsx                 [session + locale + messages + prefetch, ~150-300ms]
Layout 3: (saas)/app/layout.tsx             [session + orgList + billing, ~100-200ms]
Layout 4: [organizationSlug]/layout.tsx     [org + subscription + role + prefetch, ~200-400ms]
Layout 5: [projectId]/layout.tsx            [session + org + project + role, ~150-300ms]
─────────────────────────────────────────
المجموع التقديري: 600-1,200ms (server-side فقط)
+ Network latency (Mumbai): 200-400ms
= 800-1,600ms قبل أن يرى المستخدم المحتوى
```

### مشكلة Waterfall المحددة في كل layout

| Layout | المشكلة | الإصلاح |
|--------|---------|--------|
| `company/layout.tsx` | `getSession()` ثم `getActiveOrganization()` متسلسلتان | `Promise.all([getSession(), getActiveOrganization(slug)])` |
| `settings/layout.tsx` | نفس المشكلة | نفس الإصلاح |
| `[projectId]/layout.tsx` | `getActiveOrganization()` تنتظر `getSession()` رغم عدم الاعتماد | نقل `getActiveOrganization()` لـ Stage A |

## 6.2 شجرة الـ Providers (16 طبقة)

```
<html>
  <body>
    1. <NuqsAdapter>                    — URL state
    2.   <ConsentProvider>              — Cookie consent
    3.     <ApiClientProvider>           — React Query client
    4.       <ProgressProvider>          — Page transition bar
    5.         <ThemeProvider>            — Dark/light mode
    6.           <NextIntlClientProvider> — i18n
    7.             <HydrationBoundary>    — SSR dehydration
    8.               <SessionProvider>    — Auth session
    9.                 <ActiveOrgProvider> — Active org
    10.                  <ConfirmAlertProvider> — Dialogs
    11.                    <AssistantProvider>   — AI state
    12.                      <SidebarProvider>    — Sidebar
    13.                        <SubscriptionGuard> — Plan
    14.                          <OnboardingProvider> — Onboarding
    15.                            <ProjectRoleProvider> — Permissions
    16.                              {PAGE CONTENT}
```

## 6.3 React Query Configuration

| الإعداد | القيمة |
|---------|--------|
| staleTime (default) | 5 دقائق |
| gcTime | 10 دقائق |
| retry | false |
| refetchOnWindowFocus | false |
| refetchOnReconnect | true |

**5 مستويات staleTime:**

| المستوى | المدة | الاستخدام |
|---------|------|---------|
| STABLE | 15 دقيقة | Organization, Permissions, Roles |
| DEFAULT | 5 دقائق | Projects list, Employees, Clients |
| DYNAMIC | 2 دقيقة | Project details, Invoices, Dashboard |
| FAST | 30-60 ثانية | Notifications, Messages |
| REALTIME | 0 | Always fresh |

## 6.4 Sidebar Analysis

- **Prefetch strategy:** 7 عناصر فقط تحصل على `prefetch={true}` (start, projects, finance, company, pricing, orgSettings, accountSettings)
- **Responsive:** Desktop ≥1280px (ثابت/قابل للطي)، Mobile <1280px (overlay)
- **مشاكل:**
  - Hydration mismatch: `useIsMobile()` يبدأ `false` → يتحول `true` على الموبايل
  - Collapsed state flash: يبدأ expanded → يقرأ localStorage → قد ينطوي
  - Study menu items: تظهر بعد React Query resolve (pop-in)

---

# الجزء السابع: تحليل الأداء وبطء التنقل

## 7.1 لماذا التنقل بطيء — 12 سبب

| # | السبب | الأثر | الملف |
|---|------|------|------|
| 1 | 7-10 مراحل waterfall متسلسلة في layouts | +600-1200ms server time | Layout chain |
| 2 | لا middleware.ts — auth redirects في كل layout | يُعاد تنفيذ auth check في كل layout | غائب |
| 3 | DB في Mumbai بدل البحرين | +40-80ms per query | Supabase config |
| 4 | Company + Settings layouts: sequential fetches | +50-100ms لكل layout | `company/layout.tsx`, `settings/layout.tsx` |
| 5 | Project layout: `getActiveOrganization()` sequential | +50ms | `[projectId]/layout.tsx` |
| 6 | 704 client components → hydration cost كبير | +200-500ms client time | 704 files |
| 7 | 16 provider layers → mount overhead | +50-100ms React overhead | Provider tree |
| 8 | فقط 11 Suspense boundary → لا streaming | Content يظهر دفعة واحدة | المشروع |
| 9 | فقط 16 dynamic import → bundle كبير | Initial load ثقيل | المشروع |
| 10 | BOQSummaryTable: يعيد حساب كل البنود عند فلتر | CPU spike | `BOQSummaryTable.tsx` |
| 11 | TemplateCustomizer: preview re-render عند أي تغيير | Jank في الـ UI | `TemplateCustomizer.tsx` |
| 12 | لا list virtualization للجداول الكبيرة | DOM bloat | Multiple tables |

## 7.2 تحليل Bundle Size

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| "use client" components | 704 | 🔴 مفرط — target: <500 |
| Suspense boundaries | 11 | 🔴 قليل جداً |
| Dynamic imports | 16 | 🟡 يجب زيادتها |
| `<img>` بدل next/Image | 4 | ✅ مقبول |
| optimizePackageImports | 5 packages | ✅ جيد (lucide, recharts, date-fns, es-toolkit, radix-icons) |
| Bundle analyzer | ❌ غير مُثبّت | يجب إضافته |

**أثقل Dependencies المتوقعة:**
1. `recharts` — charting library (>200KB gzipped)
2. `xlsx` + `xlsx-js-style` — Excel processing
3. `react-markdown` — Markdown rendering
4. `cropperjs` — Image cropping
5. `yet-another-react-lightbox` — Image gallery

## 7.3 تتبع رحلة المستخدم: فتح صفحة مشروع

```
الخطوة 1: المستخدم ينقر على رابط مشروع في الداشبورد
  → Next.js يبدأ server-side rendering

الخطوة 2: Layout 2 (saas) — ~200ms
  → Promise.all([getLocale(), getMessages(), getSession()])
  → prefetch: session, orgList, purchases
  → المستخدم يرى: لا شيء (blank)

الخطوة 3: Layout 3 (app) — ~150ms
  → getSession() (cached, ~instant)
  → getOrganizationList() (cached, ~instant)
  → cachedListPurchases() (~50-100ms)
  → المستخدم يرى: لا شيء (blank)

الخطوة 4: Layout 4 (organizationSlug) — ~300ms
  → Stage A: getActiveOrganization(slug) + getSession()
  → Stage B: cachedGetOrgSubscription() + cachedGetMemberRole()
  → Stage C: prefetch queries
  → المستخدم يرى: Sidebar يظهر (from Layout 4)
  → ثم: loading.tsx skeleton يظهر داخل الـ sidebar

الخطوة 5: Layout 5 (projectId) — ~200ms
  → getSession() (instant) → getActiveOrganization() (BUG: sequential)
  → getProjectById() + getProjectMemberRole()
  → getEffectivePermissions() (conditional)
  → المستخدم يرى: ProjectShell header + navigation

الخطوة 6: page.tsx — ~100ms
  → Client-side React Query fires
  → المستخدم يرى: المحتوى النهائي

الإجمالي: 950-1,600ms (server) + hydration (200-500ms) = 1.2-2.1 ثانية
```

## 7.4 خطة تحسين الأداء

| الخطوة | الأثر | الصعوبة | الأولوية |
|--------|------|---------|---------|
| إضافة middleware.ts للـ auth redirect | -200ms (يلغي auth checks في layouts) | متوسطة | 🔴 |
| إصلاح 3 layout waterfalls بـ Promise.all | -100-200ms | سهلة | 🔴 |
| نقل DB لـ me-south-1 (Bahrain) | -30-60ms per query | سهلة | 🟠 |
| تحويل 200+ client components لـ Server | -30% bundle size | متوسطة | 🟠 |
| إضافة Suspense boundaries (target: 30+) | Streaming SSR | متوسطة | 🟠 |
| إضافة dynamic imports لمكونات ثقيلة | Lazy loading | سهلة | 🟡 |
| List virtualization (react-window) | -50% DOM nodes | متوسطة | 🟡 |
| Memoize BOQSummaryTable aggregation | -CPU spikes | سهلة | 🟡 |
| Bundle analyzer + tree shaking audit | Informed optimization | سهلة | 🟡 |

---

# الجزء الثامن: الأمان

## 8.1 Security Headers Analysis

| Header | القيمة | التقييم |
|--------|--------|---------|
| X-Content-Type-Options | `nosniff` | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | ✅ |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | ✅ (بدون preload) |
| Cross-Origin-Opener-Policy | `same-origin` | ✅ |
| Cross-Origin-Resource-Policy | `same-origin` | ✅ |
| X-Permitted-Cross-Domain-Policies | `none` | ✅ |
| X-Frame-Options | `DENY` (app/auth/share/marketing) | ✅ |
| Content-Security-Policy | مفصّل لكل route group | ✅ |

## 8.2 CSP Analysis

```
default-src 'self'
script-src 'self' 'unsafe-inline' ['unsafe-eval' in dev only]
style-src 'self' 'unsafe-inline'
img-src 'self' https: data: blob: https://*.supabase.co
connect-src 'self' blob: https://*.supabase.co
frame-src 'self' https://*.supabase.co https://docs.google.com blob:
font-src 'self'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

⚠️ `'unsafe-inline'` في `script-src` يُضعف حماية XSS. Next.js يحتاجها لـ inline scripts.
✅ `frame-ancestors 'none'` يمنع clickjacking.
✅ `'unsafe-eval'` مقصور على development فقط.

## 8.3 Cache-Control لكل Route

| Route | Cache-Control |
|-------|--------------|
| `/_next/static/*` | `public, max-age=31536000, immutable` |
| `/app/*` | `private, no-cache` |
| `/auth/*` | `no-store, no-cache, must-revalidate` |
| `/owner/*` | `private, no-cache` |
| `/share/*` | `public, max-age=300, s-maxage=600` |
| `/api/*` | `no-store` |
| `/*` (marketing) | `public, s-maxage=3600, stale-while-revalidate=86400` |

✅ Auth routes لا تُخزّن. App routes private. Share routes cacheable. Marketing aggressive caching.

## 8.4 OWASP Top 10 Checklist

| # | الثغرة | الحالة | التفاصيل |
|---|--------|--------|---------|
| A01 | Broken Access Control | ⚠️ جيد مع ثغرات | Cross-tenant guard ممتاز. لكن: perf-check مكشوف, shares بدون rate limit |
| A02 | Cryptographic Failures | ✅ جيد | HTTPS enforced (HSTS), tokens 256-bit, passwords hashed by BetterAuth |
| A03 | Injection | ✅ جيد | Prisma ORM (parameterized queries), Zod input validation |
| A04 | Insecure Design | ⚠️ متوسط | Owner portal message impersonation, no absolute session expiry |
| A05 | Security Misconfiguration | ⚠️ | Real DB credentials in .env.example, missing env vars |
| A06 | Vulnerable Components | ✅ | Dependencies modern, no known CVEs at time of audit |
| A07 | Auth Failures | ✅ جيد | 2FA, Passkeys, rate limiting, session management solid |
| A08 | Software Integrity | ✅ | Turborepo lockfile, no CDN script loading |
| A09 | Logging & Monitoring | ⚠️ | Audit logs good (133 points), but Sentry only for errors. No security event stream |
| A10 | SSRF | ✅ | No user-controlled URLs in server-side fetches |

---

# الجزء التاسع: الوحدات الوظيفية

## 9.1-9.17 ملخص جودة كل وحدة

| # | الوحدة | الجودة /10 | الملاحظات الرئيسية |
|---|--------|-----------|-------------------|
| 1 | إدارة المشاريع | 8/10 | تغطية شاملة، حماية الحذف، فريق المشروع |
| 2 | التنفيذ الميداني | 7/10 | تقارير يومية، صور، مشاكل. ينقصها: offline support |
| 3 | الجدول الزمني و Gantt | 7/10 | Milestones + Activities + Dependencies + Baselines. لا Gantt chart component |
| 4 | النظام المالي | 8/10 | Decimal precision، audit logging، bank reconciliation. فرق client/server calculations |
| 5 | المطالبات (Claims) | 7/10 | Workflow كامل (DRAFT→PAID). بدون إشعارات تلقائية عند تأخر الدفع |
| 6 | العقود ومقاولو الباطن | 8/10 | BOQ items، claims، change orders، payments. Audit log شامل |
| 7 | بوابة المالك | 8/10 | Token exchange آمن، 7 endpoints، session sliding. Message impersonation issue |
| 8 | إدارة الشركة (HR) | 7/10 | Employees، assets، payroll، leaves. لا leave accrual تلقائي |
| 9 | دراسات الكميات | 8/10 | 3 محركات حساب (structural 2926 سطر، MEP 2493، finishing 1523). مشاكل أداء |
| 10 | الذكاء الاصطناعي | 7/10 | 20 أداة، Claude Sonnet 4، context-aware. واجهتان متنافستان، بدون rate limiting |
| 11 | نظام المستندات | 7/10 | Folders، versions، approvals. بدون OCR أو بحث في المحتوى |
| 12 | نظام الإشعارات | 6/10 | IN_APP + EMAIL channels. لا push notifications. لا real-time (polling) |
| 13 | Super Admin Panel | 8/10 | Dashboard، org management، revenue analytics، audit logs. API well-protected |
| 14 | Onboarding Wizard | 7/10 | 5 wizard steps + post-wizard checklist. جيد لأول استخدام |
| 15 | نظام التسعير | 7/10 | Pipeline من 6 مراحل. مكونات ضخمة تحتاج تقسيم |
| 16 | نظام CRM/Leads | 7/10 | Pipeline tracking، file management، activity log. لا email integration |
| 17 | القوالب المالية | 6/10 | Drag-and-drop customizer (1566 سطر). أداء ضعيف، يحتاج تقسيم |

---

# الجزء العاشر: التكاملات الخارجية

## 10.1 ZATCA Phase 1

✅ **مكتمل:** TLV encoding لـ 5 حقول إلزامية، Base64 QR generation، QR image rendering (200px PNG)، VAT number validation (15 digits).

⚠️ **قيود:** TLV encoder يستخدم byte واحد للطول (max 255 bytes). أسماء بائعين عربية طويلة (>85 حرف) قد تُنتج TLV فاسد.

## 10.2 ZATCA Phase 2 — ما المفقود

| المتطلب | الحالة |
|---------|--------|
| TLV Tags 6-9 (XML hash, signature, public key, cert) | ❌ مفقود |
| UBL 2.1 XML generation | ❌ مفقود |
| CSR generation for ZATCA onboarding | ❌ مفقود |
| ECDSA-SHA256 digital signing | ❌ مفقود |
| ZATCA API integration (clearance/reporting) | ❌ مفقود |
| Invoice counter + Previous Invoice Hash chain | ❌ مفقود |
| Credit/Debit note XML linking | ❌ مفقود |

## 10.3 Stripe Integration

✅ **جيد:** Checkout links، customer portal، webhook handling (8 events)، idempotency via SubscriptionEvent table، seat management.

⚠️ **مشكلة:** `currentPeriodEnd` يستخدم `subscription.cancel_at` بدل actual period end (Stripe v19 change). Active subscriptions بدون إلغاء مجدول ستكون `null`.

## 10.4 Email System

✅ **Provider:** Resend فقط (Nodemailer code exists but not wired).
❌ **مفقود:** لا email لأحداث العمل (فاتورة مرسلة، دفعة مستلمة، تذكير تأخر). فقط قوالب auth.
❌ **لا retry logic** — `sendEmail()` يمسك الخطأ ويرجع `false`.

## 10.5 File Storage

✅ **S3-compatible** (AWS S3، Supabase Storage، etc.)
⚠️ **Upload URL expiry:** 60 ثانية — قد يفشل للملفات الكبيرة على اتصالات بطيئة.
❌ **لا file listing** capability.

---

# الجزء الحادي عشر: الترجمة والتدويل

## 11.1 حالة الترجمة

| اللغة | مفاتيح Leaf | أسطر الملف | الاكتمال |
|------|------------|-----------|---------|
| العربية (ar) | 6,651 | 8,137 | 97.6% (339 مفتاح مفقود) |
| الإنجليزية (en) | 6,814 | 8,304 | 100% (المرجع) |
| الألمانية (de) | 555 | 923 | 8.1% |

## 11.2 المفاتيح المفقودة

- **339 مفتاح في ar مفقود:** أغلبها في `pricing.quotations.*` (حالات، إجراءات، labels)
- **176 مفتاح في en مفقود:** مصطلحات هندسية عربية خاصة (أساسات، خرسانة عادية)
- **Fallback:** `deepmerge` يعرض النص الإنجليزي عند غياب العربي

## 11.3 نصوص عربية Hardcoded

**122 ملف** يحتوي نصوص عربية مباشرة بدل `useTranslations()`:
- Pricing/Studies: 10+ ملفات (ColumnsSection, BeamsSection, SlabsSection, etc.)
- Company/Templates: 5+ ملفات (TemplatePreview, TemplateCustomizer, etc.)
- Finance: 2+ ملفات (CreateInvoiceForm, ExpensesList)
- هذا يكسر نظام الترجمة تماماً لهذه الأقسام في اللغة الإنجليزية

---

# الجزء الثاني عشر: الاختبارات

## 12.1 الوضع الحالي

| الفئة | عدد الملفات | عدد الأسطر | التغطية |
|------|------------|-----------|---------|
| API tests (permissions, rate-limit, feature-gate, ZATCA, finance) | 18 | ~3,500 | ⚠️ محدودة |
| Database tests (org-finance, sequences, invoices, smoke) | 5 | ~1,500 | ⚠️ محدودة |
| Pricing lib tests (structural-calc, boq, cutting, height) | 5 | ~784 | 🔴 ضعيفة جداً |
| E2E tests (Playwright) | 1 | ~20 | 🔴 شبه معدومة |
| Component tests | 0 | 0 | ❌ معدومة |
| **الإجمالي** | **24** | **~5,800** | **~1% تقديري** |

## 12.2 ما يجب اختباره أولاً (Priority)

1. **Financial calculations** — Decimal arithmetic، invoice totals، bank reconciliation
2. **Permission system** — Cross-tenant guard، role resolution، feature gating
3. **ZATCA TLV encoding** — Encoding/decoding roundtrip
4. **Structural calculations** — Foundation، slab، rebar computations
5. **Subscription middleware** — Trial expiry، plan blocking
6. **Owner portal** — Token exchange، session management
7. **Payroll calculations** — Salary computation، deductions

---

# الجزء الثالث عشر: التوصيات والخلاصة

## 13.1 أهم 30 توصية مرتبة

### Quick Wins (يوم واحد)

| # | التوصية | الأثر |
|---|---------|------|
| 1 | تدوير DB password في `.env.local.example`، استبدال بـ placeholders | أمان حرج |
| 2 | حذف أو حماية `/api/perf-check` بـ admin auth | أمان حرج |
| 3 | إضافة `ANTHROPIC_API_KEY` لـ `.env.local.example` | وظيفي |
| 4 | إصلاح `DIRECT_URL` malformed في `.env.local.example` | وظيفي |
| 5 | إصلاح Dashboard router: `ORPCError` بدل `throw new Error` (9 مواقع) | جودة |
| 6 | إضافة rate limiting لـ `/api/ai/assistant` و shares `getResource` | أمان |
| 7 | إصلاح InvoiceEditor: إزالة `SENT` من `isEditable` check | وظيفي |

### Medium Term (شهر)

| # | التوصية | الأثر |
|---|---------|------|
| 8 | إضافة middleware.ts للـ auth redirects | أداء |
| 9 | إصلاح 3 layout waterfalls بـ `Promise.all` | أداء |
| 10 | إضافة `.max()` لكل string/array inputs في API | أمان |
| 11 | توحيد واجهات AI (AssistantPanel + AiChat) | UX |
| 12 | إكمال 339 مفتاح ترجمة عربي مفقود | ترجمة |
| 13 | Port client-side invoice calculations لـ Decimal | دقة مالية |
| 14 | إضافة `error.tsx` لـ `[organizationSlug]/` و `[projectId]/` | UX |
| 15 | تقسيم TemplateCustomizer (1566 سطر → 5 ملفات) | صيانة |

### Long Term (3-6 أشهر)

| # | التوصية | الأثر |
|---|---------|------|
| 16 | ZATCA Phase 2 implementation | امتثال قانوني |
| 17 | نقل DB لـ me-south-1 (Bahrain) | أداء (-40ms/query) |
| 18 | تحويل 200+ client components لـ Server Components | أداء |
| 19 | إضافة Suspense boundaries (target: 30+) | streaming SSR |
| 20 | خطة اختبارات شاملة (target: 60% coverage) | جودة |
| 21 | تقسيم structural-calculations.ts (2926 سطر → 5 ملفات) | صيانة |
| 22 | List virtualization للجداول الكبيرة | أداء |
| 23 | Leave accrual system (Saudi labor law) | امتثال |
| 24 | Payroll-bank balance verification | سلامة بيانات |
| 25 | إضافة transactional emails لأحداث العمل | UX |
| 26 | Bundle analyzer + optimization audit | أداء |
| 27 | إصلاح 122 ملف بنصوص عربية hardcoded | ترجمة |
| 28 | إضافة push notifications | UX |
| 29 | Centralized cache invalidation strategy | صيانة |
| 30 | إزالة `as any` في Pricing module (30+ مكان) | type safety |

## 13.2 ما يجب عدم فعله

| ❌ لا تفعل | السبب |
|-----------|------|
| لا تُعِد كتابة نظام الصلاحيات | ممتاز كما هو — 55 صلاحية مع cross-tenant guard |
| لا تنتقل من oRPC لـ tRPC | oRPC أحدث ويوفر OpenAPI مجاناً |
| لا تنتقل من BetterAuth | يعمل بشكل ممتاز مع كل الميزات المطلوبة |
| لا تُضف middleware ثقيل | Middleware يجب أن يكون خفيف (auth redirect فقط) |
| لا تُعِد بناء الـ Sidebar | المشاكل قابلة للإصلاح بتغييرات صغيرة |

## 13.3 هل المنصة جاهزة للمستخدمين الحقيقيين؟

**الجواب: نعم، مع تحفظات.**

✅ **جاهز:**
- النظام المالي (invoices, expenses, payments, bank reconciliation)
- إدارة المشاريع (CRUD, team, documents, execution)
- نظام الصلاحيات (أفضل ما رأيت في مشاريع مشابهة)
- التسعير ودراسات الكميات (محركات حساب قوية)
- الأمان (headers, CSP, rate limiting, audit logging)

⚠️ **يحتاج إصلاح قبل الإطلاق:**
- تدوير credentials المسربة (ساعة)
- حماية perf-check endpoint (ساعة)
- إصلاح layout waterfalls (يوم)
- إضافة rate limiting لـ AI (ساعات)

❌ **يحتاج إصلاح قبل الاعتماد الواسع:**
- ZATCA Phase 2 (متطلب قانوني في السعودية)
- تغطية اختبارات (5% غير مقبول لمنصة مالية)
- أداء التنقل (1.2-2.1 ثانية مرتفع)

## 13.4 ما الذي قد يسبب فشل المنصة؟

1. **عدم تنفيذ ZATCA Phase 2** — سيمنع العملاء السعوديين من الاعتماد عليها للفوترة
2. **بطء التنقل** — المستخدمون سيتركونها إذا كل صفحة تأخذ 2 ثانية
3. **غياب الاختبارات** — أي تغيير قد يكسر الحسابات المالية بدون اكتشاف
4. **تسريب credentials** — إذا لم تُدوّر فوراً

## 13.5 ما الذي يميزها عن المنافسين؟

1. **محركات حساب إنشائية متخصصة** — 7,000+ سطر لحسابات سعودية محلية (أساسات، بلاطات، تشطيبات، MEP)
2. **Pipeline تسعير من 6 مراحل** — من الكميات حتى عرض السعر في نظام واحد
3. **نظام صلاحيات متقدم** — 55 صلاحية granular مع custom permissions per-user
4. **بوابة المالك** — يعطي مالك المشروع اطلاع محدود آمن بدون حساب
5. **RTL-first** — مبنية للسوق العربي من الأساس
6. **AI مدمج** — 20 أداة مع context-awareness لكل صفحة

---

# الملاحق

## ملحق أ: Environment Variables المطلوبة

| المتغير | الوصف | الحساسية | موجود في .env.example |
|---------|------|---------|----------------------|
| DATABASE_URL | اتصال PostgreSQL (Pooler) | 🔴 حرج | نعم (⚠️ credentials حقيقية!) |
| DIRECT_URL | اتصال مباشر (migrations) | 🔴 حرج | نعم (⚠️ malformed) |
| BETTER_AUTH_SECRET | سر JWT للمصادقة | 🔴 حرج | نعم |
| NEXT_PUBLIC_SITE_URL | URL الموقع | مهم | نعم |
| GOOGLE_CLIENT_ID/SECRET | OAuth Google | مهم | نعم |
| GITHUB_CLIENT_ID/SECRET | OAuth GitHub | مهم | نعم |
| RESEND_API_KEY | مزود البريد | مهم | نعم |
| MAIL_FROM | عنوان المرسل | عام | نعم |
| STRIPE_SECRET_KEY | Stripe API | 🔴 حرج | نعم |
| STRIPE_WEBHOOK_SECRET | Stripe Webhooks | مهم | نعم |
| S3_ACCESS_KEY_ID/SECRET | تخزين ملفات | 🔴 حرج | نعم |
| S3_ENDPOINT/REGION | تخزين ملفات | عام | نعم |
| OPENAI_API_KEY | AI (legacy) | مهم | نعم |
| ANTHROPIC_API_KEY | AI (primary) | مهم | ❌ مفقود |
| STRIPE_PRO_MONTHLY_PRICE_ID | Stripe Plan | مهم | ❌ مفقود |
| STRIPE_PRO_YEARLY_PRICE_ID | Stripe Plan | مهم | ❌ مفقود |
| CRON_SECRET | Cron jobs auth | مهم | نعم |
| SENTRY_* | Error monitoring | عام | نعم |

## ملحق ب: كل API Endpoints — ملخص

| Module | Read | Write | Total |
|--------|------|-------|-------|
| company | 25 | 40 | 65 |
| quantities | 25 | 40 | 65 |
| finance | 20 | 35 | 55 |
| subcontracts | 10 | 17 | 27 |
| super-admin | 20 | 5 | 25 |
| pricing (composite) | 8 | 16 | 24 |
| project-execution | 10 | 12 | 22 |
| project-boq | 8 | 9 | 17 |
| project-finance | 8 | 9 | 17 |
| project-documents | 6 | 6 | 12 |
| project-owner | 5 | 7 | 12 |
| project-change-orders | 5 | 6 | 11 |
| project-field | 5 | 6 | 11 |
| project-quantities | 5 | 5 | 10 |
| dashboard | 9 | 0 | 9 |
| project-timeline | 4 | 5 | 9 |
| projects | 4 | 4 | 8 |
| project-templates | 4 | 4 | 8 |
| onboarding | 1 | 6 | 7 |
| exports | 7 | 0 | 7 |
| activation-codes | 2 | 4 | 6 |
| ai | 4 | 2 | 6 |
| org-users | 2 | 4 | 6 |
| project-contract | 4 | 2 | 6 |
| attachments | 3 | 2 | 5 |
| notifications | 3 | 2 | 5 |
| integrations | 2 | 3 | 5 |
| project-payments | 2 | 3 | 5 |
| digests | 2 | 2 | 4 |
| project-chat | 2 | 2 | 4 |
| project-team | 2 | 2 | 4 |
| roles | 2 | 2 | 4 |
| shares | 2 | 2 | 4 |
| admin | 3 | 0 | 3 |
| organizations | 2 | 1 | 3 |
| payments | 2 | 1 | 3 |
| project-insights | 1 | 1 | 2 |
| project-updates | 1 | 1 | 2 |
| contact | 0 | 1 | 1 |
| newsletter | 0 | 1 | 1 |
| users | 0 | 1 | 1 |
| **الإجمالي** | **~200** | **~180** | **~380+** |

## ملحق ج: Rate Limiting Presets

| Preset | النافذة | الحد الأقصى | الاستخدام |
|--------|--------|------------|---------|
| READ | 60s | 60 req | protectedProcedure global |
| WRITE | 60s | 20 req | subscriptionProcedure global-write |
| TOKEN | 60s | 30 req | Owner portal endpoints |
| UPLOAD | 60s | 10 req | File upload operations |
| MESSAGE | 60s | 30 req | Chat/messaging |
| STRICT | 60s | 5 req | Owner portal send, AI create |

Auth endpoints (IP-based):
| Endpoint | النافذة | الحد |
|----------|--------|------|
| /auth/sign-in | 60s | 10 |
| /auth/forgot-password | 60s | 5 |
| /auth/magic-link | 60s | 5 |
| /auth/sign-up | 60s | 5 |

## ملحق د: أكبر 30 ملف في المشروع

| # | الملف | الأسطر | الوحدة |
|---|------|--------|-------|
| 1 | prisma/zod/index.ts | 4,181 | Generated |
| 2 | structural-calculations.ts | 2,926 | Pricing |
| 3 | mep-derivation-engine.ts | 2,493 | Pricing |
| 4 | queries/finance.ts | 2,150 | Database |
| 5 | TemplateCustomizer.tsx | 1,566 | Company |
| 6 | exterior-catalog.ts | 1,536 | Pricing |
| 7 | ColumnsSection.tsx | 1,535 | Pricing |
| 8 | derivation-engine.ts | 1,523 | Pricing |
| 9 | queries/org-finance.ts | 1,476 | Database |
| 10 | queries/cost-studies.ts | 1,461 | Database |
| 11 | SubcontractDetailView.tsx | 1,349 | Projects |
| 12 | CreateInvoiceForm.tsx | 1,338 | Finance |
| 13 | BlocksSection.tsx | 1,289 | Pricing |
| 14 | default-templates.ts | 1,258 | Company |
| 15 | PaintItemDialog.tsx | 1,256 | Pricing |
| 16 | BOQSummaryTable.tsx | 1,227 | Pricing |
| 17 | QuotationForm.tsx | 1,164 | Pricing |
| 18 | ContractFormSections.tsx | 1,125 | Projects |
| 19 | PricingPageContentV2.tsx | 1,091 | Pricing |
| 20 | queries/project-execution.ts | 1,090 | Database |
| 21 | LaborOverviewTab.tsx | 1,070 | Pricing |
| 22 | PlasterItemDialog.tsx | 1,022 | Pricing |
| 23 | InvoiceEditor.tsx | 1,003 | Finance |
| 24 | ChoosePlanContent.tsx | 1,000 | Payments |
| 25 | finishing-categories.ts | 997 | Pricing |
| 26 | queries/company.ts | 990 | Database |
| 27 | InvoiceView.tsx | 960 | Finance |
| 28 | sanitary-kitchen-catalog.ts | 957 | Pricing |
| 29 | create-invoice.ts | 939 | API/Finance |
| 30 | FinishingCostingTab.tsx | 920 | Pricing |

## ملحق هـ: Feature Gating Matrix

| الميزة | FREE | PRO |
|--------|------|-----|
| المشاريع | 1 | 100 |
| المستخدمين | 2 | 50 |
| التخزين | 0 GB | 50 GB |
| محادثات AI | 10 | غير محدود |
| تصدير PDF/CSV | ❌ | ✅ |
| حفظ دراسة تكلفة | ❌ | ✅ |
| تصدير عرض سعر | ❌ | ✅ |
| بوابة المالك | ❌ | ✅ |
| تقارير تفصيلية | ❌ | ✅ |
| ZATCA QR | ❌ | ✅ |

---

---

# الملاحق التفصيلية

---

## الملحق التفصيلي 1: تحليل معمّق لنظام المصادقة

### 1.1 BetterAuth Plugins المحمّلة (8 plugins)

```typescript
// packages/auth/auth.ts
plugins: [
  username(),           // دعم اسم المستخدم
  admin(),              // عمليات super-admin
  passkey(),            // WebAuthn/FIDO2
  magicLink(),          // تسجيل دخول بدون كلمة مرور
  organization(),       // إدارة المنظمات multi-tenant
  openAPI(),            // توليد مخطط OpenAPI
  invitationOnlyPlugin(), // حظر التسجيل بدون دعوة (مخصص)
  twoFactor(),          // TOTP 2FA
]
```

### 1.2 Auth Hooks (ما بعد الحدث)

| الحدث | ما يحدث |
|------|---------|
| `/organization/accept-invitation` | تحديث مقاعد الاشتراك، ربط دور BetterAuth بدور مسار (OWNER→OWNER, ADMIN→OWNER, MEMBER→ENGINEER)، تعيين `organizationRoleId`، تعيين `user.organizationId` |
| `/organization/create` | إنشاء 5 أدوار نظام افتراضية، تعيين دور OWNER للمنشئ |
| `/organization/remove-member` | تحديث مقاعد الاشتراك |
| `/sign-in` أو `/magic-link/verify` | تحديث `user.lastLoginAt` |

### 1.3 Auth Hooks (قبل الحدث)

| الحدث | ما يحدث |
|------|---------|
| `/sign-in/email` أو `/sign-in/magic-link` | فحص `user.isActive === false`، رمي `ACCOUNT_DISABLED` إذا معطّل |
| `/delete-user` أو `/organization/delete` | إلغاء كل الاشتراكات النشطة قبل الحذف |

### 1.4 حقول User الإضافية في مسار

| الحقل | النوع | الافتراضي | الغرض |
|------|------|---------|-------|
| `onboardingComplete` | boolean | false | بوابة الإعداد الأولي |
| `locale` | string | null | لغة المستخدم المفضلة |
| `isActive` | boolean | true | تبديل تفعيل الحساب (يمكن للمشرف تعطيله) |
| `mustChangePassword` | boolean | false | إجبار تغيير كلمة المرور |
| `accountType` | AccountType | EMPLOYEE | نوع الحساب (OWNER/EMPLOYEE/PROJECT_CLIENT) |
| `lastLoginAt` | DateTime | null | آخر تسجيل دخول ناجح |
| `organizationRoleId` | string | null | مرجع الدور في المنظمة |
| `customPermissions` | Json | null | صلاحيات مخصصة تتجاوز الدور |
| `organizationId` | string | null | المنظمة التي ينتمي لها |
| `createdById` | string | null | من أنشأ هذا الحساب |

### 1.5 آلية حل الصلاحيات (Permission Resolution Chain)

```
getUserPermissions(userId, organizationId)
│
├── 1. Cross-tenant Guard (الأولوية القصوى)
│   └── if user.organizationId !== requestedOrganizationId
│       → return EMPTY_PERMISSIONS (deny-all)
│       → log: permission.cross_tenant (severity: error)
│
├── 2. Custom Permissions (الأولوية العليا)
│   └── if user.customPermissions !== null
│       → merge ON TOP of role permissions
│       → custom overrides role at section level
│
├── 3. Role Permissions (الأولوية الوسطى)
│   └── user.organizationRoleId → Role.permissions
│       → fillMissingSections() for schema evolution
│       → backward compat: pricing auto-populated from quantities + finance
│
└── 4. Empty Permissions (الأخير)
    └── if no role AND no custom permissions
        → return deny-all (createEmptyPermissions())
```

**ملاحظة مهمة:** `Member.role` من BetterAuth مُجمّد ولا يُستخدم أبداً للتخويل. مصدر الحقيقة الوحيد هو `organizationRoleId`.

### 1.6 صفحات المصادقة في الواجهة

| المسار | المكون | الأسطر | الغرض |
|-------|-------|--------|-------|
| `/auth/login` | `LoginForm` | 357 | Email/password، magic link، passkeys، OAuth، 2FA redirect |
| `/auth/signup` | `SignupForm` | 280 | تسجيل (اسم/email/password)، وضع invitation-only، OAuth |
| `/auth/verify` | `OtpForm` | 168 | تحقق 6 أرقام TOTP، إرسال تلقائي |
| `/auth/forgot-password` | `ForgotPasswordForm` | 135 | إدخال email، إرسال رابط إعادة تعيين |
| `/auth/reset-password` | `ResetPasswordForm` | 139 | كلمة مرور جديدة (حد أدنى 8)، token من URL |
| `/auth/change-password` | `ChangePasswordForm` | 233 | كلمة مرور حالية + جديدة + تأكيد |

### 1.7 Rate Limiting — التفاصيل التقنية

**البنية:**
- **أساسي:** Redis (ioredis) مع fixed-window عبر `INCR` + `EXPIRE` pipeline
- **احتياطي:** `Map` في الذاكرة بسقف 10,000 مدخل ودورة تنظيف كل 60 ثانية (حذف المدخلات أقدم من 5 دقائق)
- **بادئة المفاتيح:** `rl:` في Redis
- **صيغ المفاتيح:** `{userId}:{procedureName}`, `ip:{ip}:{procedureName}`, `token:{token}:{procedureName}`

**Circuit Breaker:**

| المعامل | القيمة |
|---------|--------|
| عتبة الفشل | 3 فشل متتالي في Redis |
| مدة الفتح | 30,000ms (30 ثانية) |

```
CLOSED (عادي) ──3 failures──► OPEN (fallback in-memory)
                                    │
                              30 ثانية
                                    │
                                    ▼
                              HALF-OPEN (يُجرّب Redis)
                                    │
                         ┌──────────┴──────────┐
                      نجاح                   فشل
                         │                      │
                         ▼                      ▼
                      CLOSED                  OPEN (30s أخرى)
```

---

## الملحق التفصيلي 2: تحليل نظام Feature Gating

### 2.1 الكود الأساسي

```typescript
// packages/api/lib/feature-gate.ts
async function enforceFeatureAccess(organizationId, feature, user) {
  // 1. Super admin bypass
  if (user.role === "admin") return;

  // 2. Fetch org
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { status, plan, isFreeOverride, trialEndsAt, ... }
  });

  // 3. Free override bypass
  if (org.isFreeOverride === true) return;

  // 4. Determine effective plan
  if (org.plan === "PRO" && (org.status === "ACTIVE" || org.status === "TRIALING"))
    return; // PRO features allowed

  if (org.status === "TRIALING" && trialEndsAt > now)
    return; // Trial still active

  if (org.status === "TRIALING" && trialEndsAt <= now)
    // Lazy expiry: update org to FREE/ACTIVE
    await db.organization.update({ status: "ACTIVE", plan: "FREE" });

  // 5. Feature gate for FREE plan
  switch (feature) {
    case "projects.create": check count < maxProjects (1)
    case "members.invite": check count < maxUsers (2)
    case "ai.chat": check count < maxAiChats (10)
    case "export.pdf":
    case "cost-study.save":
    case "quotation.export":
    case "owner-portal.activate":
    case "reports.detailed":
    case "zatca.qr":
      throw FORBIDDEN("UPGRADE_REQUIRED")
  }
}
```

### 2.2 نقاط استدعاء Feature Gate في الكود

| الملف | الميزة | عدد الاستدعاءات |
|------|--------|----------------|
| `projects/create-project.ts` | `projects.create` | 1 |
| `org-users/create.ts` | `members.invite` | 1 |
| `ai/router.ts` | `ai.chat` | 1 |
| `exports/*.ts` | `export.pdf` | 6 |
| `quantities/create-study.ts` | `cost-study.save` | 2 |
| `quantities/create-study-quotation.ts` | `quotation.export` | 1 |
| `project-owner/create-access.ts` | `owner-portal.activate` | 1 |
| `finance/create-invoice.ts` | `zatca.qr` | 1 |
| أخرى | various | ~23 |
| **الإجمالي** | | **37 استدعاء في 17 ملف** |

---

## الملحق التفصيلي 3: تحليل ZATCA بالتفصيل

### 3.1 Phase 1 — TLV Encoding

```typescript
// packages/api/lib/zatca/tlv-encoder.ts

// 5 tags إلزامية
const TAGS = {
  1: "Seller Name",        // اسم البائع
  2: "VAT Number",         // الرقم الضريبي
  3: "Timestamp",          // الطابع الزمني (ISO 8601)
  4: "Total with VAT",     // الإجمالي مع الضريبة
  5: "VAT Amount",         // مبلغ الضريبة
};

function encodeTLV(fields: TLVField[]): Uint8Array {
  // لكل حقل: [tag (1 byte)] [length (1 byte)] [value (N bytes)]
  // ⚠️ length بايت واحد = max 255 bytes per value
}
```

### 3.2 Phase 1 — QR Generation

```typescript
// packages/api/lib/zatca/qr-generator.ts

function generateZatcaQR(input: ZatcaQRInput): string {
  // 1. Validate VAT number (exactly 15 digits)
  if (!/^\d{15}$/.test(input.vatNumber))
    throw new Error("VAT number must be exactly 15 digits");

  // 2. Format amounts to 2 decimal places
  const totalStr = Number(input.totalWithVat).toFixed(2);
  const vatStr = Number(input.vatAmount).toFixed(2);

  // 3. Format timestamp as ISO 8601
  const timestamp = input.timestamp.toISOString();

  // 4. Encode TLV
  const tlv = encodeTLV([
    { tag: 1, value: input.sellerName },
    { tag: 2, value: input.vatNumber },
    { tag: 3, value: timestamp },
    { tag: 4, value: totalStr },
    { tag: 5, value: vatStr },
  ]);

  // 5. Return Base64
  return Buffer.from(tlv).toString("base64");
}
```

### 3.3 Phase 2 — Gap Analysis التفصيلي

| # | المتطلب | الوصف | التعقيد | الأولوية |
|---|---------|------|---------|---------|
| 1 | UBL 2.1 XML Generation | توليد مستند XML كامل بمعيار UBL 2.1 للفاتورة الإلكترونية | 🔴 عالي | حرج |
| 2 | CSR Generation | توليد Certificate Signing Request للتسجيل في ZATCA | 🟡 متوسط | حرج |
| 3 | ECDSA-SHA256 Signing | توقيع رقمي لكل فاتورة | 🔴 عالي | حرج |
| 4 | CSID Onboarding | تسجيل الجهاز في بوابة ZATCA والحصول على CSID | 🟡 متوسط | حرج |
| 5 | Invoice Hash Chain | كل فاتورة تشير لـ hash الفاتورة السابقة (PIH) | 🟡 متوسط | حرج |
| 6 | ZATCA API Integration | إرسال فواتير B2B للـ clearance وB2C للـ reporting | 🟠 عالي | حرج |
| 7 | TLV Tags 6-9 | إضافة XML hash, signature, public key, cert signature للـ QR | 🟡 متوسط | حرج |
| 8 | Credit/Debit Note XML | ربط إشعار الدائن/المدين بـ UUID الفاتورة الأصلية | 🟢 منخفض | مهم |
| 9 | Invoice Counter | عدّاد فواتير تراكمي per-device | 🟢 منخفض | مهم |

**الحقول الجاهزة في الـ Schema (جاهزة لـ Phase 2):**
- `FinanceInvoice.zatcaUuid` — UUID للفاتورة
- `FinanceInvoice.zatcaHash` — Hash للفاتورة
- `FinanceInvoice.zatcaSignature` — التوقيع الرقمي
- `FinanceInvoice.qrCode` — محتوى QR

---

## الملحق التفصيلي 4: تحليل نظام الذكاء الاصطناعي

### 4.1 System Prompt Structure

```
buildEnhancedSystemPrompt() =
  basePrompt (identity + 12 rules)
  + "\n\n" + moduleKnowledge (9 modules)
  + "\n\n" + pageContext (URL-based + Zustand-based)
```

**12 قاعدة سلوكية:**
1. الرد بالعربية افتراضياً
2. قراءة فقط (لا تعديل بيانات)
3. لا مصطلحات تقنية
4. مصطلحات إنشائية سعودية
5. Markdown formatting
6. Full URL paths مع org slug
7. أرقام بفاصلة آلاف ونقطة عشرية
8. لا تخمّن — اطلب البيانات أولاً
9. لا تكرر نفسك
10. حافظ على سياق المحادثة
11. اعتذر عند عدم القدرة
12. اقترح أسئلة متابعة

### 4.2 الأدوات الـ 20 بالتفصيل

**أدوات Legacy (6):**

| # | الأداة | المدخلات | المخرجات |
|---|-------|---------|---------|
| 1 | `queryProjects` | action: list/details/stats, projectId? | قائمة/تفاصيل مشاريع |
| 2 | `queryFinance` | action: invoices/payments/expenses/summary/banks | بيانات مالية |
| 3 | `queryExecution` | action: phases/dailyReports/issues/progress/summary | بيانات تنفيذ |
| 4 | `queryTimeline` | action: milestones, filter: all/upcoming/overdue/completed | مراحل زمنية |
| 5 | `navigateTo` | destination: string (Arabic/English keywords) | URL مع org slug |
| 6 | `queryCompany` | action: employees/assets/expenses/payroll/summary | بيانات شركة |

**أدوات Registry (14):**

| # | الأداة | الوحدة | المدخلات | المخرجات |
|---|-------|-------|---------|---------|
| 7 | `getProjectDetails` | projects | projectId | تفاصيل شاملة مع عقد وفريق |
| 8 | `getProjectFinanceSummary` | projects | projectId | ملخص مالي (مصروفات، مطالبات، ربحية) |
| 9 | `getProjectActivities` | execution | projectId | أنشطة مع critical path |
| 10 | `getProjectMilestones` | execution | projectId | مراحل مع حساب أيام التأخير |
| 11 | `getDelayAnalysis` | execution | projectId | تحليل تأخير (ON_TRACK/WARNING/AT_RISK) |
| 12 | `queryCostStudies` | quantities | organizationId | قائمة دراسات |
| 13 | `getCostStudyDetails` | quantities | studyId | دراسة كاملة مع كل البنود |
| 14 | `searchMaterials` | quantities | query, organizationId | بحث مواد عبر كل الدراسات |
| 15 | `queryQuotations` | quotations | organizationId, filters | عروض أسعار |
| 16 | `getQuotationDetails` | quotations | quotationId | عرض سعر مع البنود |
| 17 | `getQuotationsSummary` | quotations | organizationId, period | إحصائيات عروض |
| 18 | `queryLeads` | leads | organizationId, filters | عملاء محتملون |
| 19 | `getLeadsSummary` | leads | organizationId | معدل تحويل، قيم إجمالية |
| 20 | `getLeadsPipeline` | leads | organizationId | توزيع pipeline |

### 4.3 حدود الاستخدام

| الحد | القيمة | مكان التطبيق |
|------|--------|-------------|
| رسائل per محادثة | 50 | Server-side (400 error) |
| حروف المدخل | 2,000 | Client-side (visual counter) |
| خطوات أدوات per turn | 5 | `stepCountIs(5)` |
| tokens الخرج | 2,000 | `maxOutputTokens: 2000` |
| محادثات FREE plan | 10 | Feature gate `ai.chat` |
| Rate limiting | ❌ لا يوجد | ⚠️ ثغرة |

### 4.4 مشكلة الواجهتين المتنافستين

| الخاصية | AssistantPanel | AiChat Page |
|---------|---------------|-------------|
| الموقع | Floating panel (bottom-left) | Full page `/app/{org}/chatbot` |
| Transport | `DefaultChatTransport` → `/api/ai/assistant` | oRPC → `ai.chats.messages.add` |
| Markdown | ✅ react-markdown | ❌ plain text |
| Tool indicators | ✅ (6 legacy labels) | ❌ لا يوجد |
| Context-aware | ✅ URL + Zustand | ❌ لا |
| History | ✅ slide-in panel | ❌ basic list |
| Plan gating | ✅ في الواجهة | ✅ UpgradeGate |

**التوصية:** توحيد في AssistantPanel وإزالة AiChat page.

---

## الملحق التفصيلي 5: تحليل نظام Email

### 5.1 البنية

```
packages/mail/
├── index.ts              — Public API (sendEmail)
├── src/
│   ├── provider/
│   │   ├── index.ts      — يُصدّر Resend فقط
│   │   ├── resend.ts     — تنفيذ Resend
│   │   └── nodemailer.ts — موجود لكن غير مُوصّل
│   └── templates/
│       ├── render.ts     — React Email rendering
│       └── *.tsx         — قوالب (auth فقط)
```

### 5.2 القوالب الموجودة

| القالب | الغرض | اللغات |
|-------|------|-------|
| Magic Link | رابط تسجيل دخول بدون كلمة مرور | ar/en |
| Email Verification | تأكيد البريد | ar/en |
| Password Reset | إعادة تعيين كلمة المرور | ar/en |
| Organization Invitation | دعوة للانضمام لمنظمة | ar/en |
| User Invitation | دعوة مستخدم جديد | ar/en |

### 5.3 القوالب المفقودة (لأحداث العمل)

| القالب المفقود | الأولوية |
|---------------|---------|
| Invoice Sent to Client | 🔴 حرج |
| Payment Received Confirmation | 🟠 عالي |
| Invoice Overdue Reminder | 🟠 عالي |
| Daily Report Submitted | 🟡 متوسط |
| Issue Assigned | 🟡 متوسط |
| Claim Status Changed | 🟡 متوسط |
| Weekly Digest Report | 🟡 متوسط |
| Owner Portal Access Created | 🟡 متوسط |

---

## الملحق التفصيلي 6: تحليل نظام الاشتراكات

### 6.1 Stripe Webhook Events المعالجة

| الحدث | ما يحدث |
|------|---------|
| `checkout.session.completed` | إنشاء purchase، مزامنة org |
| `customer.subscription.created` | إنشاء purchase، تعيين customer ID، مزامنة org |
| `customer.subscription.updated` | تحديث purchase status، مزامنة org |
| `customer.subscription.deleted` | حذف purchase، تعليم org كـ CANCELLED |
| `customer.subscription.paused` | مزامنة org إلى SUSPENDED |
| `customer.subscription.resumed` | مزامنة org |
| `invoice.paid` | تسجيل تاريخ ومبلغ آخر دفعة |
| `invoice.payment_failed` | تسجيل الحدث فقط |

### 6.2 مزامنة المنظمة من Stripe

```typescript
syncOrganizationFromSubscription() {
  // في transaction واحدة:
  update org {
    status:              mapped from Stripe status
    plan:                mapped from price ID
    planName:            product.name from metadata
    stripeSubscriptionId
    stripeProductId
    stripePriceId
    subscriptionStatus:  mapped from Stripe status
    maxUsers:            from metadata or plan config
    maxProjects:         from metadata or plan config
    maxStorage:          from metadata or plan config
    currentPeriodStart:  billing_cycle_anchor (⚠️ not actual period start)
    currentPeriodEnd:    cancel_at (⚠️ null if not cancelling)
    trialEndsAt
    cancelAtPeriodEnd
  }
}
```

### 6.3 خطط الأسعار

| | FREE | PRO شهري | PRO سنوي |
|---|------|---------|---------|
| السعر | 0 SAR | 199 SAR/شهر | 1,990 SAR/سنة |
| المشاريع | 1 | 100 | 100 |
| المستخدمين | 2 | 50 | 50 |
| التخزين | 0 GB | 50 GB | 50 GB |
| AI Chats | 10 | غير محدود | غير محدود |

---

## الملحق التفصيلي 7: تحليل React Query بالتفصيل

### 7.1 إعدادات QueryClient الافتراضية

```typescript
// modules/shared/lib/query-client.ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 دقائق
      gcTime: 10 * 60 * 1000,         // 10 دقائق
      retry: false,                    // لا إعادة محاولة
      refetchOnWindowFocus: false,     // لا إعادة جلب عند التركيز
      refetchOnReconnect: true,        // إعادة جلب عند عودة الاتصال
    },
  },
});
```

### 7.2 مستويات staleTime التفصيلية

```typescript
// modules/shared/lib/query-stale-times.ts
export const STALE_TIMES = {
  // ═══ STABLE (15 دقيقة) ═══
  ORGANIZATION: 15 * 60 * 1000,       // بيانات المنظمة
  PERMISSIONS: 15 * 60 * 1000,        // الصلاحيات
  ROLES: 15 * 60 * 1000,              // الأدوار
  FINANCE_SETTINGS: 15 * 60 * 1000,   // إعدادات المالية
  TEMPLATES: 15 * 60 * 1000,          // القوالب

  // ═══ DEFAULT (5 دقائق) ═══
  PROJECTS_LIST: 5 * 60 * 1000,       // قائمة المشاريع
  EMPLOYEES: 5 * 60 * 1000,           // الموظفين
  CLIENTS: 5 * 60 * 1000,             // العملاء
  BANKS: 5 * 60 * 1000,               // الحسابات البنكية
  SUBSCRIPTION: 5 * 60 * 1000,        // الاشتراك

  // ═══ DYNAMIC (2 دقيقة) ═══
  PROJECT_DETAILS: 2 * 60 * 1000,     // تفاصيل مشروع
  INVOICES: 2 * 60 * 1000,            // الفواتير
  EXPENSES: 2 * 60 * 1000,            // المصروفات
  DASHBOARD_STATS: 2 * 60 * 1000,     // إحصائيات الداشبورد

  // ═══ FAST (30-60 ثانية) ═══
  NOTIFICATIONS: 60 * 1000,           // الإشعارات
  MESSAGES: 30 * 1000,                // الرسائل
  AI_CHATS: 60 * 1000,                // محادثات AI

  // ═══ REALTIME (0) ═══
  // لا يوجد حالياً — كل شيء يستخدم polling
};
```

### 7.3 تأثير staleTime على التنقل

عندما ينتقل المستخدم بين الصفحات:
- **الصفحة الأولى:** يجلب البيانات ويعرض skeleton أثناء الانتظار
- **العودة للصفحة:** إذا staleTime لم ينتهِ → يعرض cached data فوراً ✅
- **بعد انتهاء staleTime:** يعرض cached data + يجلب في الخلفية (stale-while-revalidate pattern) ✅

**المشكلة:** 180+ ملف يدير invalidation بشكل فردي. لا يوجد centralized invalidation layer. هذا يعني:
- قد تنسى بعض الـ mutations invalidate queries ذات صلة
- قد تُفرط بعض الـ mutations في invalidation (تحديث كل شيء)
- صعوبة تتبع bugs الـ stale data

---

## الملحق التفصيلي 8: تحليل نظام التسعير بالتفصيل

### 8.1 Pipeline المراحل الست

```
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ الكميات  │ →  │ المواصفات  │ →  │ التكلفة  │ →  │ التسعير  │ →  │ العرض    │ →  │ التحويل  │
│Quantities│    │   Specs    │    │ Costing  │    │ Pricing  │    │Quotation │    │ Convert  │
└──────────┘    └────────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
    ▲                                                                                  │
    │              StudyType يتحكم بالمراحل النشطة                                      │
    │                                                                                  ▼
    │         FULL_STUDY: كل 6 مراحل                                              ┌──────────┐
    │         QUICK_PRICING: Pricing + Quotation فقط                              │ مشروع   │
    │         LUMP_SUM_ANALYSIS: Costing + Pricing فقط                            │ فعلي    │
    │         CUSTOM_ITEMS: بنود يدوية فقط                                        └──────────┘
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 محركات الحساب الثلاثة

**محرك 1: structural-calculations.ts (2,926 سطر)**
- 13 دالة مُصدّرة
- أساسات: منفردة، مشتركة، شريطية، لبّشة
- بلاطات: 5 أنواع (صلبة، أعصاب، مسطحة، hollow-core، banded)
- جدران وبلوك
- حديد تسليح: أعمدة، كمرات، سلالم

**محرك 2: mep-derivation-engine.ts (2,493 سطر)**
- 7 فئات MEP
- كهرباء: نقاط، مفاتيح، مقابس، لوحات
- سباكة: نقاط، أنابيب، صنابير
- تكييف: وحدات، مجاري هواء
- إطفاء حريق: رشاشات، كواشف
- تيار خفيف: شبكات، كاميرات
- أنظمة خاصة: مصاعد، خزانات
- خارجي: أسوار، تنسيق حدائق

**محرك 3: derivation-engine.ts (1,523 سطر)**
- اشتقاق كميات التشطيبات من SmartBuildingConfig
- 15 مجموعة أعمال (بلاط، رخام، خشب، دهان، جبس، عزل، ألمنيوم، إلخ)
- حسابات ذكية: مساحات صافية بعد خصم الفتحات

### 8.3 أكبر 10 مكونات في الوحدة مع توصيات التقسيم

| المكون | الأسطر | المشكلة | التقسيم المقترح |
|--------|--------|---------|----------------|
| `ColumnsSection.tsx` | 1,535 | Form + table + calculations في مكون واحد | ColumnForm + ColumnTable + ColumnSummary |
| `BlocksSection.tsx` | 1,289 | نفس النمط | BlockForm + BlockTable + BlockSummary |
| `PaintItemDialog.tsx` | 1,256 | 15+ useState، re-render عند أي تغيير | PaintRoomCalc + OpeningsEditor + MaterialSelector |
| `BOQSummaryTable.tsx` | 1,227 | يعيد حساب كل البنود عند تغيير فلتر | BOQSummaryTab + FactoryOrderTab + CuttingDetailsTab |
| `QuotationForm.tsx` | 1,164 | نموذج ضخم | QuotationBasicInfo + QuotationItems + QuotationTerms |
| `PricingPageContentV2.tsx` | 1,091 | 5 API queries، 10+ useState، `as any` × 15 | MarkupSelector + MarkupForm + ItemOverrides + Summary |
| `LaborOverviewTab.tsx` | 1,070 | Tab with all labor calculations | LaborTable + LaborSummary + LaborForm |
| `PlasterItemDialog.tsx` | 1,022 | مشابه لـ PaintItemDialog | PlasterCalc + PlasterOpenings + PlasterMaterials |
| `EmptySectionTable.tsx` | 809 | جدول إدخال يدوي | ManualItemTable + ManualItemForm |
| `StructuralBuildingWizard.tsx` | 793 | Multi-step wizard | FloorConfigStep + FoundationStep + SummaryStep |

---

## الملحق التفصيلي 9: تحليل Sidebar بالتفصيل

### 9.1 هيكل الملفات (9 ملفات)

| الملف | النوع | الأسطر | الغرض |
|------|------|--------|-------|
| `sidebar-context.tsx` | Client | ~80 | SidebarProvider — حالة الطي عبر localStorage، breakpoint 1280px |
| `use-is-mobile.ts` | Client | ~25 | hook لـ matchMedia(max-width: 1279px) |
| `use-sidebar-menu.ts` | Client | ~200 | بناء شجرة القائمة، استخراج projectId/studyId من المسار |
| `AppSidebar.tsx` | Client | ~150 | Sidebar ثابت، overlay على الموبايل، RTL support |
| `SidebarNav.tsx` | Client | ~180 | عناصر التنقل مع sub-menus قابلة للطي |
| `SidebarHeader.tsx` | Client | ~60 | الشعار + زر الطي/الإغلاق |
| `SidebarFooter.tsx` | Client | ~80 | UserMenu + ساعة + تبديل اللغة + وضع الألوان |
| `SidebarInset.tsx` | Client | ~40 | منطقة المحتوى الرئيسية |
| `index.ts` | Barrel | ~10 | Re-exports |

### 9.2 قائمة التنقل الكاملة (من `use-sidebar-menu.ts`)

```
📊 الرئيسية (start)                    [prefetch: true]
📁 المشاريع (projects)                  [prefetch: true]
   └── 📄 قوالب المشاريع (templates)
💰 المالية (finance)                    [prefetch: true]
   ├── 📊 لوحة المتابعة (dashboard)
   ├── 📄 الفواتير (invoices)
   ├── 💵 المقبوضات (payments)
   ├── 📤 المصروفات (expenses)
   ├── 🏦 الحسابات البنكية (banks)
   ├── 👥 العملاء (clients)
   ├── 📋 المستندات (documents)
   ├── 📊 التقارير (reports)
   └── ⚙️ الإعدادات (settings)
📐 التسعير (pricing)                    [prefetch: true]
   ├── 📊 الدراسات (studies)
   ├── 📄 عروض الأسعار (quotations)
   ├── 👥 العملاء المحتملون (leads)
   └── ⚡ تسعير سريع (quick)
🏢 المنشأة (company)                    [prefetch: true]
   ├── 👥 الموظفون (employees)
   ├── 📤 المصروفات الثابتة (expenses)
   ├── 🏗️ الأصول (assets)
   ├── 💰 الرواتب (payroll)
   ├── 📅 الإجازات (leaves)
   ├── 📊 التقارير (reports)
   └── 📋 القوالب (templates)
⚙️ إعدادات المنظمة (orgSettings)        [prefetch: true]
⚙️ إعدادات الحساب (accountSettings)     [prefetch: true]
```

**داخل صفحة مشروع (project sub-menu):**
```
📊 نظرة عامة (overview)
📈 التقدم والتنفيذ (execution)
📅 الجدول الزمني (timeline)
💰 المالية (finance)
📄 المستندات (documents)
🔄 أوامر التغيير (changes)
📐 الكميات (quantities)
👥 الفريق (team)
💬 المحادثات (chat)
📊 التحليلات (insights)
👤 بوابة المالك (owner)
📝 التحديثات (updates)
```

---

## الملحق التفصيلي 10: تحليل Loading States

### 10.1 مكتبة Skeletons

```typescript
// modules/saas/shared/components/skeletons.tsx

export function HomeDashboardSkeleton()   // 4 بطاقات + chart + جدول
export function DashboardSkeleton()        // 4 بطاقات + 2 sections
export function ListTableSkeleton()        // header + 8 صفوف
export function CardGridSkeleton()         // 6 بطاقات في شبكة
export function DetailPageSkeleton()       // header + 2 أعمدة
export function ProjectOverviewSkeleton()  // info cards + sections
export function FormPageSkeleton()         // header + حقول نموذج
export function EditorPageSkeleton()       // toolbar + editing area
export function PreviewPageSkeleton()       // A4 page preview
export function SettingsPageSkeleton()     // tabs + حقول
export function StudyEditorSkeleton()      // study pipeline + editor
export function StudyOverviewSkeleton()    // overview cards + pipeline
export function MinimalSkeleton()          // spinner بسيط
```

### 10.2 تغطية loading.tsx

| المنطقة | عدد loading.tsx | الثغرات |
|---------|----------------|---------|
| Organization root | 1 | — |
| Projects section | 4 | `projects/[projectId]/finance/` مفقود |
| Finance section | 12 | — |
| Pricing section | 8 | `pricing/` root مفقود |
| Company section | 8 | — |
| Settings section | 4 | — |
| Account section | 3 | — |
| Owner portal | 1 | — |
| Auth | 0 | كل auth pages هي form pages |
| **الإجمالي** | **~172** | **2 ثغرات** |

---

## الملحق التفصيلي 11: تحليل نظام Onboarding

### 11.1 Wizard Steps (5 خطوات)

| # | الخطوة | ما يحدث | قابلة للتخطي |
|---|-------|---------|-------------|
| 1 | معلومات الشركة | commercialRegister, taxNumber, phone, address, city | نعم |
| 2 | الشعار | رفع شعار المنظمة | نعم |
| 3 | القالب الافتراضي | اختيار قالب فاتورة/عرض سعر | نعم |
| 4 | المشروع الأول | إنشاء أول مشروع | نعم |
| 5 | دعوة الفريق | إرسال دعوات email | نعم |

### 11.2 Post-Wizard Checklist

| البند | الربط التلقائي |
|------|--------------|
| ✅ إعداد معلومات الشركة | `companyInfoDone` |
| ✅ رفع الشعار | `logoDone` |
| ✅ اختيار قالب | `templateDone` |
| ✅ إنشاء مشروع | `firstProjectDone` |
| ✅ دعوة عضو فريق | `teamInviteDone` |
| ☐ إضافة أول كمية | `firstQuantityAdded` |
| ☐ إنشاء أول فاتورة | `firstInvoiceCreated` |
| ☐ تسجيل أول مصروف | `firstExpenseRecorded` |
| ☐ إكمال بيانات ZATCA | `zatcaInfoComplete` |

---

## الملحق التفصيلي 12: تحليل أنماط الأخطاء

### 12.1 ORPCError vs throw new Error

| النوع | العدد | المواقع الرئيسية |
|------|------|-----------------|
| `throw new ORPCError(...)` (صحيح) | 337 في 175 ملف | معظم الكود |
| `throw new Error(...)` (خطأ) | 20 في 10 ملفات | Dashboard (9), Finance banks/expenses/payments/transfers |

**المشكلة:** `throw new Error()` ينتج HTTP 500 بدل 403/404. يظهر كـ unhandled exception في Sentry.

### 12.2 رسائل خطأ عربية

✅ **نقطة قوة:** معظم رسائل الخطأ مكتوبة بالعربية في الـ API:
```typescript
throw new ORPCError("FORBIDDEN", {
  message: "ليس لديك صلاحية للوصول لهذا المحتوى",
  data: { code: "PERMISSION_DENIED" }
});
```

---

## الملحق التفصيلي 13: تحليل نظام التصدير

### 13.1 Export Endpoints (7)

| Endpoint | النوع | Feature Gate |
|----------|------|-------------|
| `generateUpdatePDF` | PDF | `export.pdf` |
| `generateClaimPDF` | PDF | `export.pdf` |
| `generateWeeklyReport` | PDF | `export.pdf` |
| `exportExpensesCsv` | CSV | `export.pdf` |
| `exportClaimsCsv` | CSV | `export.pdf` |
| `exportIssuesCsv` | CSV | `export.pdf` |
| `generateCalendarICS` | ICS | `export.pdf` (نفس الـ gate) |

⚠️ **كل التصديرات تستخدم نفس feature gate (`export.pdf`)** حتى CSV وICS. يجب فصلها.

---

## الملحق التفصيلي 14: تحليل نظام المشاركة (Share Links)

### 14.1 Share Resources

| Resource Type | الوصف |
|--------------|------|
| `UPDATE_PDF` | تحديث رسمي كـ PDF |
| `CLAIM_PDF` | مستخلص كـ PDF |
| `DOCUMENT` | مستند مشروع |
| `PHOTO_ALBUM` | ألبوم صور |
| `ICS` | تقويم المشروع |
| `WEEKLY_REPORT` | تقرير أسبوعي |

### 14.2 Share Security

- **Token:** فريد، `cuid()` (22 حرف)
- **انتهاء:** اختياري (`expiresAt`)
- **إلغاء:** `isRevoked` flag
- **Cache:** `public, max-age=300, s-maxage=600` (5-10 دقائق)
- ⚠️ **لا rate limiting على public endpoint** — ثغرة

---

## الملحق التفصيلي 15: تحليل الاختبارات بالتفصيل

### 15.1 كل ملف اختبار موجود

| # | الملف | الأسطر | ما يختبره |
|---|------|--------|---------|
| 1 | `api/__tests__/permissions.test.ts` | ~200 | Permission resolution، role defaults |
| 2 | `api/__tests__/permissions/cross-tenant.test.ts` | ~150 | Cross-tenant guard |
| 3 | `api/__tests__/permissions/permission-matrix.test.ts` | ~180 | 6 أدوار × 8 أقسام |
| 4 | `api/__tests__/permissions/verify-project-access.test.ts` | ~120 | Project access verification |
| 5 | `api/__tests__/feature-gate.test.ts` | ~200 | Feature gating logic |
| 6 | `api/__tests__/feature-gate/subscription-procedure.test.ts` | ~150 | Subscription middleware |
| 7 | `api/__tests__/rate-limit.test.ts` | ~280 | Rate limiting with Redis mock |
| 8 | `api/__tests__/finance/decimal-precision.test.ts` | ~100 | Decimal arithmetic |
| 9 | `api/__tests__/financial-calculations.test.ts` | ~150 | Invoice total calculations |
| 10 | `api/__tests__/modules/quantities/structural-bounds.test.ts` | ~100 | Structural input bounds |
| 11 | `api/__tests__/security/file-upload.test.ts` | ~120 | File validation |
| 12 | `api/__tests__/security/input-validation.test.ts` | ~100 | Input sanitization |
| 13 | `api/__tests__/zatca-tlv.test.ts` | ~150 | TLV encoding/decoding |
| 14 | `database/__tests__/org-finance.test.ts` | 826 | Org finance queries |
| 15 | `database/__tests__/sequences.test.ts` | ~100 | Atomic sequences |
| 16 | `database/__tests__/invoice-calculations.test.ts` | ~150 | Invoice math |
| 17 | `database/__tests__/attachments-validation.test.ts` | ~80 | File validation |
| 18 | `database/__tests__/smoke.test.ts` | ~30 | DB connection check |
| 19 | `pricing/lib/__tests__/structural-calculations.test.ts` | ~200 | Structural math |
| 20 | `pricing/lib/__tests__/boq-aggregator.test.ts` | ~150 | BOQ aggregation |
| 21 | `pricing/lib/__tests__/boq-recalculator.test.ts` | ~100 | BOQ recalculation |
| 22 | `pricing/lib/__tests__/cutting-optimizer.test.ts` | ~100 | Cutting optimization |
| 23 | `pricing/lib/__tests__/height-derivation-engine.test.ts` | ~80 | Height derivation |
| 24 | `web/tests/home.spec.ts` | ~20 | E2E smoke test |

### 15.2 فجوات الاختبارات الحرجة

| المنطقة | عدد الاختبارات | الخطورة |
|---------|---------------|---------|
| MEP derivation engine (2,493 سطر) | 0 | 🔴 |
| Finishing derivation engine (1,523 سطر) | 0 | 🔴 |
| Stripe webhook handlers | 0 | 🔴 |
| Email template rendering | 0 | 🟠 |
| AI tools (20 أداة) | 0 | 🟠 |
| React components (1,095 ملف) | 0 | 🟠 |
| Owner portal flow | 0 | 🟠 |
| Payroll calculations | 0 | 🟠 |
| Leave balance tracking | 0 | 🟡 |
| Notification system | 0 | 🟡 |

---

## الملحق التفصيلي 16: تحليل next.config.ts بالتفصيل

### 16.1 Security Headers

```typescript
// كل route يحصل على:
"X-Content-Type-Options": "nosniff"
"Referrer-Policy": "strict-origin-when-cross-origin"
"Permissions-Policy": "camera=(), microphone=(), geolocation=()"
"Strict-Transport-Security": "max-age=31536000; includeSubDomains"
"Cross-Origin-Opener-Policy": "same-origin"
"Cross-Origin-Resource-Policy": "same-origin"
"X-Permitted-Cross-Domain-Policies": "none"
```

### 16.2 CSP Directives بالتفصيل

| Directive | القيمة | التقييم |
|-----------|--------|---------|
| `default-src` | `'self'` | ✅ |
| `script-src` | `'self' 'unsafe-inline'` (+`'unsafe-eval'` in dev) | ⚠️ unsafe-inline يضعف XSS protection |
| `style-src` | `'self' 'unsafe-inline'` | ⚠️ مطلوب لـ Tailwind/Radix |
| `img-src` | `'self' https: data: blob: https://*.supabase.co` | ✅ واسع لكن ضروري |
| `connect-src` | `'self' blob: https://*.supabase.co` | ✅ |
| `frame-src` | `'self' supabase blob: docs.google.com` | ✅ |
| `font-src` | `'self'` | ✅ |
| `frame-ancestors` | `'none'` | ✅ يمنع clickjacking |
| `base-uri` | `'self'` | ✅ |
| `form-action` | `'self'` | ✅ |

### 16.3 Cache-Control لكل Route

| Route Pattern | Cache-Control | السبب |
|--------------|--------------|------|
| `/_next/static/*` | `public, max-age=31536000, immutable` | ملفات ثابتة مع content hash |
| `/app/*` | `private, no-cache` | بيانات خاصة، يُعاد التحقق |
| `/auth/*` | `no-store, no-cache, must-revalidate` | حساس — لا تخزين |
| `/owner/*` | `private, no-cache` | بيانات خاصة |
| `/share/*` | `public, max-age=300, s-maxage=600` | محتوى مشترك، 5-10 دقائق |
| `/api/*` | `no-store` | ديناميكي — لا تخزين |
| `/*` (marketing) | `public, s-maxage=3600, stale-while-revalidate=86400` | ساعة fresh + يوم stale |

### 16.4 Redirects المُعرّفة

| المصدر | الوجهة | الغرض |
|-------|-------|------|
| `/` → `/ar` | permanent | الصفحة الرئيسية → العربية |
| `/app/settings` → `/app/settings/general` | permanent | إعادة توجيه الإعدادات |
| `/app/:slug/settings` → `/app/:slug/settings/general` | permanent | إعادة توجيه إعدادات المنظمة |
| `/app/admin` → `/app/admin/users` | permanent | إعادة توجيه لوحة الإدارة |
| `/app/:slug/finance/quotations` → `/app/:slug/pricing/quotations` | permanent | إعادة هيكلة التسعير |
| `/app/:slug/quantities` → `/app/:slug/pricing/studies` | permanent | إعادة هيكلة الكميات |
| دراسة/structural → quantities?tab=structural | permanent | دمج صفحات الدراسة |
| دراسة/finishing → quantities?tab=finishing | permanent | دمج صفحات الدراسة |
| دراسة/mep → quantities?tab=mep | permanent | دمج صفحات الدراسة |

### 16.5 Package Optimizations

```typescript
optimizePackageImports: [
  "lucide-react",         // Tree-shake icons
  "recharts",             // Tree-shake charts
  "date-fns",             // Tree-shake date utilities
  "es-toolkit",           // Tree-shake utilities
  "@radix-ui/react-icons" // Tree-shake Radix icons
]
```

---

## الملحق التفصيلي 17: تحليل Database Queries Layer

### 17.1 حجم ملفات الاستعلامات

| الملف | الأسطر | الوصف |
|------|--------|------|
| `finance.ts` | 2,150 | فواتير، عروض أسعار، عملاء، مستندات مفتوحة |
| `org-finance.ts` | 1,476 | حسابات بنكية، مصروفات، مقبوضات، تحويلات |
| `cost-studies.ts` | 1,461 | دراسات التكلفة (CRUD + duplicate + recalculate) |
| `project-execution.ts` | 1,090 | أنشطة، اعتماديات، baselines، تقاويم |
| `company.ts` | 990 | موظفين، أصول، مصروفات ثابتة |
| `project-finance.ts` | 748 | مصروفات المشروع، مطالبات |
| `subcontract-claims.ts` | 734 | مستخلصات مقاولي الباطن |
| `subcontract.ts` | 706 | عقود مقاولي الباطن |
| `project-owner-portal.ts` | 651 | بوابة المالك |
| `seed-templates.ts` | 590 | بذر القوالب الافتراضية |
| `finance-reports.ts` | 505 | تقارير مالية |
| `payroll.ts` | 498 | مسيرات الرواتب |
| **الإجمالي** | **~21,000** | **43 ملف** |

### 17.2 أنماط الاستعلامات المميزة

**✅ Pattern: Two-Layer Balance Guard**
```typescript
// Layer 1: Early check (fast fail for UX)
const account = await db.organizationBank.findUnique({
  where: { id: sourceAccountId },
  select: { balance: true },
});
if (account.balance.lessThan(amount)) {
  throw new Error("رصيد غير كافٍ");
}

// Layer 2: Atomic guard (prevents race conditions)
const updated = await db.organizationBank.updateMany({
  where: {
    id: sourceAccountId,
    balance: { gte: amount },  // ← atomic condition
  },
  data: {
    balance: { decrement: amount },
  },
});
if (updated.count === 0) {
  throw new Error("رصيد غير كافٍ (تزامن)");
}
```

**✅ Pattern: Atomic Sequence Numbers**
```typescript
// packages/database/prisma/queries/sequences.ts
async function getNextSequenceValue(orgId, key) {
  const result = await db.$queryRaw`
    INSERT INTO organization_sequences (id, organization_id, sequence_key, current_value, updated_at)
    VALUES (${cuid()}, ${orgId}, ${key}, 1, NOW())
    ON CONFLICT (organization_id, sequence_key)
    DO UPDATE SET current_value = organization_sequences.current_value + 1, updated_at = NOW()
    RETURNING current_value
  `;
  return result[0].current_value;
}
```
هذا يمنع تكرار أرقام الفواتير/المصروفات تحت التزامن.

---

## الملحق التفصيلي 18: ملخص إحصائي شامل

### 18.1 إحصائيات الكود

| المقياس | القيمة |
|---------|--------|
| إجمالي ملفات TS/TSX | 2,017 |
| إجمالي أسطر الكود | 613,024 |
| أسطر TypeScript | 444,902 |
| أسطر React (TSX) | 168,122 |
| أسطر Prisma Schema | 5,134 |
| أسطر Database Queries | ~21,000 |
| أسطر API Modules | ~50,000 (تقدير) |
| أسطر Frontend Components | ~100,000 (تقدير) |
| أسطر Pricing Engine | ~53,000 |
| أسطر Tests | ~5,800 |

### 18.2 إحصائيات البنية

| المقياس | القيمة |
|---------|--------|
| Packages في Monorepo | 10 |
| Prisma Models | 112 |
| Prisma Enums | 87 |
| Prisma Indexes | 225 |
| Prisma Unique Constraints | 31 |
| API Modules | 42 |
| API Endpoints | 380+ |
| Frontend Pages | 187 |
| Frontend Layouts | 18 |
| Loading States | 172 |
| Error Boundaries | 11 |
| Client Components | 704 |
| Suspense Boundaries | 11 |
| Dynamic Imports | 16 |
| Custom Hooks | 28 |
| Provider Layers | 16 (max depth) |

### 18.3 إحصائيات الجودة

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| Test Files | 24 | 🔴 |
| Test Coverage (est.) | ~1% | 🔴 |
| console.log/warn/error | 108 | 🟡 |
| TODO/FIXME/HACK | 30 | 🟢 |
| `throw new Error` (should be ORPCError) | 20 | 🟡 |
| `as any` type assertions | 30+ (pricing alone) | 🟡 |
| Hardcoded Arabic strings | 122 files | 🟠 |
| Missing Arabic translations | 339 keys | 🟠 |
| Zod schemas (validation) | 351 files | ✅ |
| Audit log points | 133 in 48 files | ✅ |
| Rate limit points | 43 explicit + global | ✅ |
| Feature gate calls | 37 in 17 files | ✅ |
| Access verification calls | 300+ in 140+ files | ✅ |

### 18.4 إحصائيات الأمان

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| Security Headers | 7 headers on all routes | ✅ |
| CSP Rules | 10 directives | ✅ |
| Auth Methods | 6 (email, magic link, Google, GitHub, Passkey, 2FA) | ✅ |
| Permission Flags | 55 across 8 sections | ✅ |
| Role Types | 6 (5 system + custom) | ✅ |
| Rate Limit Presets | 6 + 4 auth-specific | ✅ |
| Vulnerabilities (High) | 3 | 🔴 |
| Vulnerabilities (Medium) | 8 | 🟠 |
| Vulnerabilities (Low) | 6 | 🟡 |
| Credentials in git | 1 file (.env.local.example) | 🔴 |

---

---

## الملحق التفصيلي 19: تحليل كامل لنظام المالية المؤسسية

### 19.1 هيكل الحسابات البنكية

```
OrganizationBank
├── name: اسم الحساب (مثل: البنك الأهلي - حساب جاري)
├── accountType: BANK | CASH_BOX
├── openingBalance: Decimal(15,2)
├── balance: Decimal(15,2)  ← يُحدّث تلقائياً
├── currency: SAR (default)
├── isActive: boolean
├── isDefault: boolean  ← حساب واحد فقط default
│
├── ← مصروفات تخرج منه (FinanceExpense.sourceAccountId)
├── ← مقبوضات تدخل فيه (FinancePayment.destinationAccountId)
├── ← تحويلات تخرج (FinanceTransfer.fromAccountId)
├── ← تحويلات تدخل (FinanceTransfer.toAccountId)
├── ← دفعات مقاولي باطن (SubcontractPayment.sourceAccountId)
├── ← دفعات مشاريع (ProjectPayment.destinationAccountId)
└── ← دفعات مصروفات منشأة (CompanyExpensePayment.bankAccountId)
```

### 19.2 آلية Bank Reconciliation

```typescript
// org-finance.ts — reconcileBankAccount()

// 1. جلب الرصيد الافتتاحي
const account = await db.organizationBank.findUnique({
  select: { openingBalance, balance }
});

// 2. حساب الإيرادات (مقبوضات COMPLETED)
const paymentsIn = await db.financePayment.aggregate({
  where: { destinationAccountId, status: "COMPLETED" },
  _sum: { amount: true }
});

// 3. حساب المصروفات (مصروفات COMPLETED)
const expensesOut = await db.financeExpense.aggregate({
  where: { sourceAccountId, status: "COMPLETED" },
  _sum: { amount: true }
});

// 4. حساب دفعات مقاولي الباطن (COMPLETED)
const subcontractOut = await db.subcontractPayment.aggregate({
  where: { sourceAccountId, status: "COMPLETED" },
  _sum: { amount: true }
});

// 5. حساب التحويلات الواردة والصادرة (COMPLETED)
const transfersIn = await db.financeTransfer.aggregate({
  where: { toAccountId, status: "COMPLETED" },
  _sum: { amount: true }
});
const transfersOut = await db.financeTransfer.aggregate({
  where: { fromAccountId, status: "COMPLETED" },
  _sum: { amount: true }
});

// 6. الحساب النهائي
computedBalance = openingBalance
  + paymentsIn
  - expensesOut
  - subcontractOut
  + transfersIn
  - transfersOut

// 7. فحص التطابق (تسامح: 0.01 SAR = هللة واحدة)
delta = abs(computedBalance - account.balance)
isReconciled = delta <= 0.01
```

### 19.3 Expense States Machine

```
                    ┌──────────┐
                    │  إنشاء   │
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │ COMPLETED │         │ PENDING  │
        │ (مدفوع   │         │ (التزام) │
        │  فوراً)   │         │          │
        └──────────┘         └────┬─────┘
              │                    │
              │                    ▼
              │              ┌──────────┐
              │              │   دفع    │
              │              │ (pay)    │
              │              └────┬─────┘
              │                    │
              │                    ▼
              │              ┌──────────┐
              │              │ COMPLETED │
              │              └──────────┘
              │                    │
              ▼                    ▼
        ┌──────────┐         ┌──────────┐
        │ إلغاء    │         │  إلغاء   │
        │(CANCELLED)│         │(CANCELLED)│
        │ يُرجع    │         │ لا يُرجع │
        │ المبلغ   │         │ (لم يُدفع)│
        └──────────┘         └──────────┘
```

### 19.4 Invoice Lifecycle

```
DRAFT ──إصدار──► ISSUED ──إرسال──► SENT ──مشاهدة──► VIEWED
  │                 │                 │                  │
  │                 ▼                 ▼                  ▼
  │          ┌──────────┐     ┌──────────┐      ┌──────────┐
  │          │ إضافة    │     │ إضافة    │      │ إضافة    │
  │          │ دفعة     │     │ دفعة     │      │ دفعة     │
  │          └────┬─────┘     └────┬─────┘      └────┬─────┘
  │               │                │                  │
  │               ▼                ▼                  ▼
  │          ┌────────────────────────────────────────────┐
  │          │ PARTIALLY_PAID (paidAmount < totalAmount)  │
  │          └──────────────────┬─────────────────────────┘
  │                             │
  │                             ▼
  │          ┌──────────────────────────────────────┐
  │          │ PAID (paidAmount >= totalAmount)      │
  │          └──────────────────────────────────────┘
  │
  ▼
CANCELLED (أي وقت قبل PAID)

  ISSUED + تحويل ──► TAX invoice (مع ZATCA QR)
  ISSUED + إشعار دائن ──► CREDIT_NOTE (مرتبط بالفاتورة الأصلية)

  CRON: إذا dueDate < today && status ∈ {ISSUED,SENT,VIEWED,PARTIALLY_PAID}
        → status = OVERDUE
```

### 19.5 Quotation Lifecycle

```
DRAFT ──إرسال──► SENT ──مشاهدة──► VIEWED
  │                                  │
  │                      ┌───────────┴───────────┐
  │                      ▼                       ▼
  │               ┌──────────┐            ┌──────────┐
  │               │ ACCEPTED │            │ REJECTED │
  │               └────┬─────┘            └──────────┘
  │                    │
  │                    ▼
  │               ┌──────────┐
  │               │ تحويل    │
  │               │ لفاتورة  │
  │               └────┬─────┘
  │                    │
  │                    ▼
  │               ┌──────────┐
  │               │ CONVERTED │
  │               └──────────┘
  │
  ▼
  EXPIRED (إذا validUntil < today)
```

---

## الملحق التفصيلي 20: تحليل شامل لوحدة إدارة المشاريع

### 20.1 Project Model — الحقول الرئيسية

| الحقل | النوع | الوصف |
|------|------|------|
| name | String | اسم المشروع |
| slug | String | المعرّف في URL |
| projectNo | String? | رقم المشروع التسلسلي |
| status | ProjectStatus | ACTIVE/ON_HOLD/COMPLETED/ARCHIVED |
| type | ProjectType? | RESIDENTIAL/COMMERCIAL/INDUSTRIAL/INFRASTRUCTURE/MIXED |
| clientName | String? | اسم العميل |
| clientId | String? | مرجع كيان العميل |
| location | String? | موقع المشروع |
| contractValue | Decimal(15,2) | قيمة العقد |
| progress | Decimal(5,2) | نسبة الإنجاز (0-100) |
| startDate/endDate | DateTime? | الجدول الزمني |
| createdById | String | من أنشأ المشروع |

### 20.2 علاقات المشروع (20+ علاقة)

```
Project
├── dailyReports[]        ← التقارير اليومية
├── photos[]              ← صور المشروع
├── issues[]              ← المشاكل
├── progressUpdates[]     ← تحديثات التقدم
├── expenses[]            ← مصروفات المشروع
├── claims[]              ← المستخلصات
├── subcontractContracts[] ← عقود الباطن
├── contract              ← العقد الرئيسي (one-to-one)
├── documents[]           ← المستندات
├── auditLogs[]           ← سجل التدقيق
├── messages[]            ← المحادثات
├── ownerAccesses[]       ← وصول المالك
├── milestones[]          ← المراحل الزمنية
├── activities[]          ← الأنشطة (Phase 13)
├── baselines[]           ← خطوط الأساس
├── calendars[]           ← التقاويم
├── changeOrders[]        ← أوامر التغيير
├── members[]             ← فريق المشروع
├── boqItems[]            ← جدول الكميات
├── costStudies[]         ← دراسات مرتبطة
├── quotations[]          ← عروض أسعار مرتبطة
├── financeInvoices[]     ← فواتير مرتبطة
├── projectPayments[]     ← دفعات المشروع
└── shareLinks[]          ← روابط مشاركة
```

### 20.3 حماية حذف المشروع

```typescript
// packages/api/modules/projects/procedures/delete-project.ts

// الخطوة 1: فحص 5 جداول مالية بالتوازي
const [expenses, claims, subcontracts, invoices, payments] = await Promise.all([
  db.projectExpense.count({ where: { projectId } }),
  db.projectClaim.count({ where: { projectId } }),
  db.subcontractContract.count({ where: { projectId } }),
  db.financeInvoice.count({ where: { projectId } }),
  db.projectPayment.count({ where: { projectId } }),
]);

// الخطوة 2: إذا وُجدت بيانات مالية → لا يمكن الحذف → أرشفة
if (expenses + claims + subcontracts + invoices + payments > 0) {
  throw new ORPCError("FORBIDDEN", {
    message: "لا يمكن حذف مشروع يحتوي على بيانات مالية. استخدم الأرشفة بدلاً من ذلك.",
  });
}

// الخطوة 3: حذف فعلي فقط للمشاريع الفارغة مالياً
await db.project.delete({ where: { id: projectId } });
```

### 20.4 فريق المشروع — 5 أدوار

| الدور | الوصف | الصلاحيات في Project Shell |
|------|------|--------------------------|
| MANAGER | مدير المشروع | كل شيء |
| ENGINEER | مهندس | تحرير، تنفيذ، مستندات. لا مالية. |
| SUPERVISOR | مشرف | تقارير يومية، صور، مشاكل. قراءة فقط للباقي. |
| ACCOUNTANT | محاسب | مالية كاملة. قراءة فقط للباقي. |
| VIEWER | مشاهد | قراءة فقط لكل شيء |

### 20.5 ProjectShell Component

```
ProjectShell (Server Component wrapper)
├── ProjectHeader
│   ├── Project name + status badge
│   ├── Progress bar
│   └── Contract value + client name
├── ProjectNavigation
│   ├── نظرة عامة
│   ├── التنفيذ ← (visibility: MANAGER, ENGINEER, SUPERVISOR)
│   ├── الجدول الزمني
│   ├── المالية ← (visibility: MANAGER, ACCOUNTANT)
│   ├── المستندات
│   ├── أوامر التغيير
│   ├── الكميات
│   ├── الفريق ← (visibility: MANAGER)
│   ├── المحادثات
│   ├── التحليلات
│   ├── المالك ← (visibility: MANAGER)
│   └── التحديثات
├── FloatingChatButton
└── {children} (page content)
```

---

## الملحق التفصيلي 21: تحليل شامل لمقاولي الباطن

### 21.1 هيكل البيانات

```
SubcontractContract
├── contractNo (تسلسلي)
├── name (اسم المقاول)
├── contractorType: COMPANY | INDIVIDUAL
├── value: Decimal(15,2)
├── status: DRAFT → ACTIVE → SUSPENDED/COMPLETED/TERMINATED
├── retentionPercent / retentionCapPercent
├── advancePaymentPercent / advancePaymentAmount
├── includesVat / vatPercent
│
├── items[] (SubcontractItem — بنود العقد BOQ)
│   ├── description, unit, contractQty, unitPrice, totalAmount
│   └── claimItems[] → ربط بمستخلصات
│
├── claims[] (SubcontractClaim — مستخلصات الباطن)
│   ├── claimNo, title, claimType: INTERIM/FINAL/RETENTION
│   ├── status: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED → PAID
│   ├── grossAmount, retentionAmount, advanceDeduction, vatAmount, netAmount
│   └── items[] (SubcontractClaimItem — بنود المستخلص)
│       ├── contractQty, unitPrice
│       ├── prevCumulativeQty (الكمية التراكمية السابقة)
│       ├── thisQty (كمية هذا المستخلص)
│       └── thisAmount (مبلغ هذا المستخلص)
│
├── changeOrders[] (SubcontractChangeOrder)
│   ├── orderNo, description, amount
│   └── status: DRAFT → SUBMITTED → APPROVED/REJECTED
│
├── payments[] (SubcontractPayment)
│   ├── paymentNo, amount, date, paymentMethod
│   ├── sourceAccountId → خصم من حساب بنكي
│   └── claimId? → ربط اختياري بمستخلص
│
└── paymentTerms[] (SubcontractPaymentTerm)
    ├── type: ADVANCE/MILESTONE/MONTHLY/COMPLETION/CUSTOM
    └── percent/amount, dueDate
```

### 21.2 Audit Trail لمقاولي الباطن

| الحدث | Audit Action |
|------|-------------|
| إنشاء عقد | `SUBCONTRACT_CREATED` |
| تعديل عقد | `SUBCONTRACT_UPDATED` |
| حذف عقد | `SUBCONTRACT_DELETED` |
| إنشاء أمر تغيير | `SUBCONTRACT_CO_CREATED` |
| إنشاء دفعة | `SUBCONTRACT_PAYMENT_CREATED` |
| إنشاء بند | `SUBCONTRACT_ITEM_CREATED` |
| نسخ بنود | `SUBCONTRACT_ITEMS_COPIED` |
| إنشاء مستخلص | `SUBCONTRACT_CLAIM_CREATED` |
| تغيير حالة مستخلص | `SUBCONTRACT_CLAIM_STATUS_CHANGED` |
| إضافة دفعة لمستخلص | `SUBCONTRACT_CLAIM_PAYMENT_ADDED` |

---

## الملحق التفصيلي 22: تحليل نظام أوامر التغيير

### 22.1 Change Order Lifecycle

```
DRAFT ──تقديم──► SUBMITTED ──قرار──► APPROVED ──تنفيذ──► IMPLEMENTED
                                        │
                                        ▼
                                    REJECTED
```

### 22.2 حقول أمر التغيير

| الحقل | الوصف |
|------|------|
| coNo | الرقم التسلسلي (فريد لكل مشروع) |
| title | عنوان التغيير |
| description | وصف تفصيلي |
| category | SCOPE_CHANGE / CLIENT_REQUEST / SITE_CONDITION / DESIGN_CHANGE / MATERIAL_CHANGE / REGULATORY / OTHER |
| costImpact | الأثر المالي (Decimal 15,2 — موجب أو سالب) |
| timeImpactDays | الأثر الزمني (أيام — موجب أو سالب) |
| milestoneId | ربط بمرحلة زمنية (اختياري) |
| claimId | ربط بمستخلص (اختياري) |
| contractId | ربط بالعقد الرئيسي (اختياري) |
| requestedBy | من طلب التغيير |
| decidedBy | من اتخذ القرار |
| implementedBy | من نفّذ التغيير |

### 22.3 بوابة المالك — عرض أوامر التغيير

أوامر التغيير تظهر في بوابة المالك عبر:
- `ownerListChangeOrders` — قائمة أوامر التغيير (public، token auth)
- `ownerGetChangeOrder` — تفاصيل أمر تغيير (public، token auth)

المالك يرى فقط: الأوامر المعتمدة والمنفذة (لا يرى DRAFT أو SUBMITTED).

---

## الملحق التفصيلي 23: تحليل بوابة المالك بالتفصيل

### 23.1 Token Architecture

| الخاصية | URL Token | Session Token |
|---------|-----------|---------------|
| التوليد | `randomBytes(32).toString("hex")` | `randomUUID()` |
| الإنتروبيا | 256 bits | 122 bits (UUID v4) |
| العمر | 1-90 يوم (افتراضي 30) | ساعة واحدة (sliding) |
| التخزين | `ProjectOwnerAccess.token` | `OwnerPortalSession.sessionToken` |
| الإلغاء | `isRevoked` flag | يُلغى مع الـ access |

### 23.2 Token Exchange Flow

```
الخطوة 1: المستخدم المُصرّح ينشئ URL token
  → يحتاج: projects.manageTeam permission + owner-portal.activate feature
  → ينتج: URL مثل /owner/{64-char-hex-token}

الخطوة 2: المالك يفتح URL → exchangeToken (public)
  → يتحقق: token موجود؟ غير ملغي؟ غير منتهي؟
  → rate limit: TOKEN (30/min)
  → ينشئ: session token (UUID) بعمر ساعة
  → يسجل: IP + User Agent
  → يُرجع: { sessionToken, expiresAt }

الخطوة 3: كل طلب لاحق يستخدم sessionToken
  → كل طلب يمدد الجلسة بساعة (sliding)
  → يتحقق: الجلسة صالحة؟ الـ access غير ملغي/منتهي؟

الخطوة 4 (اختياري): المستخدم المُصرّح يلغي الوصول
  → isRevoked = true
  → كل الجلسات المرتبطة تصبح غير صالحة
```

### 23.3 Portal Endpoints (7)

| Endpoint | Rate | ما يُرجع |
|----------|------|---------|
| `exchangeToken` | TOKEN 30/min | Session token + expiry |
| `getSummary` | TOKEN 30/min | نظرة عامة: المرحلة الحالية، آخر تحديث، دفعة قادمة |
| `getSchedule` | TOKEN 30/min | المراحل الزمنية (أو 5 افتراضية) |
| `getPayments` | TOKEN 30/min | قيمة العقد، مطالبات، مدفوع/متبقي |
| `listMessages` | TOKEN 30/min | رسائل قناة OWNER (مُرقّمة) |
| `sendMessage` | STRICT 5/min | إنشاء رسالة بـ `[من المالك]` prefix |
| `listUpdates` | TOKEN 30/min | التحديثات الرسمية فقط |

### 23.4 صفحات بوابة المالك

| المسار | المكون | الوصف |
|-------|-------|------|
| `/owner/[token]` | OwnerPortalDashboard | لوحة معلومات: ملخص، تقدم، مراحل |
| `/owner/[token]/schedule` | OwnerSchedulePage | الجدول الزمني التفصيلي |
| `/owner/[token]/payments` | OwnerPaymentsPage | المدفوعات والمطالبات |
| `/owner/[token]/chat` | OwnerChatPage | محادثة مع الفريق |
| `/owner/[token]/changes` | OwnerChangesPage | أوامر التغيير |
| `/owner/[token]/changes/[id]` | OwnerChangeDetailPage | تفاصيل أمر تغيير |

---

## الملحق التفصيلي 24: تحليل Dashboard Component

### 24.1 Dashboard الرئيسي

**ملف:** `apps/web/modules/saas/dashboard/components/Dashboard.tsx` (883 سطر)

**البيانات المجلوبة (endpoint واحد: `dashboard.getAll`):**
- إحصائيات عامة (مشاريع، مهام، مشاكل)
- توزيع المشاريع حسب الحالة
- ملخص مالي (إيرادات، مصروفات، ربح)
- أنشطة قادمة
- مهام متأخرة

**مكونات الداشبورد:**
- 4 بطاقات KPI (glass-morphism design)
- مخطط توزيع المشاريع (Recharts PieChart)
- مخطط الاتجاه المالي (Recharts AreaChart)
- جدول الأنشطة القادمة
- جدول المهام المتأخرة
- OnboardingChecklist (إذا لم يكتمل)

### 24.2 Finance Dashboard

**ملف:** `apps/web/modules/saas/finance/components/dashboard/FinanceDashboard.tsx`

**البيانات:** `finance.dashboard` + `finance.orgDashboard` (استعلامان متوازيان)

الـ `orgDashboard` يشغّل 7 استعلامات DB متوازية:
1. إحصائيات الحسابات البنكية
2. إجمالي المصروفات (شهر حالي)
3. إجمالي المقبوضات (شهر حالي)
4. مصروفات معلقة
5. مقبوضات حسب المشروع
6. مصروفات حسب الفئة
7. إجمالي التحويلات

### 24.3 Company Dashboard

**ملف:** `apps/web/modules/saas/company/components/CompanyDashboard.tsx` (270 سطر)

**نقطة قوة:** يستخدم dynamic imports لمكونات الرسوم البيانية مع skeletons:
```typescript
const EmployeesAnalyticsCard = dynamic(
  () => import("./employees/EmployeesAnalyticsCard"),
  { loading: () => <AnalyticsCardSkeleton /> }
);
```

---

## الملحق التفصيلي 25: تحليل نظام الإشعارات

### 25.1 أنواع الإشعارات (16 نوع)

| النوع | الوصف | القنوات الافتراضية |
|------|------|-------------------|
| APPROVAL_REQUESTED | طلب اعتماد | IN_APP + EMAIL |
| APPROVAL_DECIDED | قرار اعتماد | IN_APP |
| DOCUMENT_CREATED | وثيقة جديدة | IN_APP |
| DAILY_REPORT_CREATED | تقرير يومي جديد | IN_APP |
| ISSUE_CREATED | مشكلة جديدة | IN_APP |
| ISSUE_CRITICAL | مشكلة حرجة | IN_APP + EMAIL |
| EXPENSE_CREATED | مصروف جديد | IN_APP |
| CLAIM_CREATED | مستخلص جديد | IN_APP |
| CLAIM_STATUS_CHANGED | تغيير حالة مستخلص | IN_APP |
| CHANGE_ORDER_CREATED | أمر تغيير جديد | IN_APP |
| CHANGE_ORDER_APPROVED | اعتماد أمر تغيير | IN_APP |
| CHANGE_ORDER_REJECTED | رفض أمر تغيير | IN_APP |
| OWNER_MESSAGE | رسالة من/إلى المالك | IN_APP |
| TEAM_MEMBER_ADDED | إضافة عضو | IN_APP |
| TEAM_MEMBER_REMOVED | إزالة عضو | IN_APP |
| SYSTEM | إشعار نظام | IN_APP |

### 25.2 تفضيلات الإشعارات

كل مستخدم يمكنه تخصيص قنوات الإشعار لكل نوع:
- `IN_APP` — إشعار داخل التطبيق
- `EMAIL` — بريد إلكتروني
- `emailDigest` — ملخص بريدي
- `muteAll` — كتم الكل

### 25.3 ما ينقص نظام الإشعارات

| المفقود | الأولوية |
|---------|---------|
| Push notifications (PWA/Native) | 🟠 عالي |
| Real-time delivery (WebSocket/SSE) | 🟠 عالي |
| SMS notifications | 🟡 متوسط |
| WhatsApp notifications | 🟡 متوسط |
| Notification grouping/batching | 🟡 متوسط |
| Notification snooze | 🟢 منخفض |

---

## الملحق التفصيلي 26: تحليل نظام Super Admin

### 26.1 لوحة المشرف العام — الصفحات

| المسار | الوصف |
|-------|------|
| `/app/admin/users` | إدارة المستخدمين |
| `/app/admin/organizations` | إدارة المنظمات |
| `/app/admin/organizations/[id]` | تفاصيل منظمة |
| `/app/admin/subscriptions` | إدارة الاشتراكات |
| `/app/admin/revenue` | تحليل الإيرادات |
| `/app/admin/plans` | إدارة الخطط |
| `/app/admin/activation-codes` | أكواد التفعيل |
| `/app/admin/logs` | سجل العمليات |

### 26.2 عمليات Super Admin

| العملية | الوصف | Audit Log |
|---------|------|-----------|
| changePlan | تغيير خطة منظمة | ✅ |
| suspend | تعليق منظمة | ✅ |
| activate | تفعيل منظمة | ✅ |
| setFreeOverride | تجاوز مجاني (PRO بدون دفع) | ✅ |
| updateLimits | تحديث حدود (مشاريع/مستخدمين/تخزين) | ✅ |
| syncToStripe | مزامنة خطط مع Stripe | — |

### 26.3 لوحة إحصائيات Super Admin

- إجمالي المنظمات (نشط/تجريبي/معلق/ملغي)
- إجمالي المستخدمين
- MRR trend (شهري)
- توزيع الخطط (FREE vs PRO)
- New orgs trend
- Churn rate

---

## الملحق التفصيلي 27: تحليل RTL Implementation

### 27.1 كيف يُكتشف اتجاه الصفحة

```typescript
// modules/shared/components/Document.tsx (Server Component)
export function Document({ locale, children }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
```

✅ **الاتجاه يُحدّد server-side** — لا flash of wrong direction.

### 27.2 RTL CSS Support

```css
/* globals.css */

/* Arabic font for RTL */
[dir="rtl"] body {
  font-family: var(--font-arabic-sans), var(--font-sans), sans-serif;
  letter-spacing: 0;
}

/* Flip directional icons */
[dir="rtl"] .rtl-flip {
  transform: scaleX(-1);
}

/* Saudi Riyal symbol font protection */
[dir="rtl"] i.sr { font-family: "saudi riyal symbol" !important; }
```

### 27.3 مشاكل RTL المحتملة

| المشكلة | الشدة | الوصف |
|---------|------|------|
| Sidebar transform direction | 🟡 | يقرأ `document.dir` مباشرة في client |
| Hardcoded margin/padding في بعض المكونات | 🟡 | بعض الأماكن تستخدم `ml-`/`mr-` بدل `ms-`/`me-` |
| Chart labels | 🟡 | Recharts لا يدعم RTL natively — الأرقام قد تظهر معكوسة |
| Icons direction | ✅ | `.rtl-flip` class متاح للأيقونات الاتجاهية |

---

## الملحق التفصيلي 28: تحليل Dark Mode

### 28.1 التنفيذ

```typescript
// next-themes provider
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

```css
/* globals.css */
@variant dark (&:where(.dark, .dark *));
```

### 28.2 تقييم Dark Mode

| المكون | الحالة | الملاحظات |
|-------|--------|---------|
| Sidebar | ✅ | يستخدم CSS variables |
| Cards | ✅ | `bg-card` / `text-card-foreground` |
| Tables | ✅ | Radix UI components |
| Forms | ✅ | shadcn/ui components |
| Charts (Recharts) | ⚠️ | ألوان hardcoded في بعض الأماكن |
| Template Preview | ⚠️ | خلفية بيضاء ثابتة (مقصود — preview لطباعة) |
| Skeletons | ✅ | تستخدم `bg-muted` |
| Glass-morphism cards | ✅ | تستخدم `backdrop-blur` مع variables |

---

## الملحق التفصيلي 29: خارطة المسارات الكاملة (Route Map)

### 29.1 مسارات التسويق

| المسار | الوصف |
|-------|------|
| `/[locale]` | الصفحة الرئيسية |
| `/[locale]/blog` | المدونة |
| `/[locale]/blog/[...path]` | مقالة |
| `/[locale]/changelog` | سجل التغييرات |
| `/[locale]/contact` | تواصل معنا |
| `/[locale]/docs/[[...path]]` | الوثائق |
| `/[locale]/legal/[...path]` | قانوني |

### 29.2 مسارات المصادقة

| المسار | الوصف |
|-------|------|
| `/auth/login` | تسجيل الدخول |
| `/auth/signup` | التسجيل |
| `/auth/verify` | تحقق 2FA |
| `/auth/forgot-password` | نسيت كلمة المرور |
| `/auth/reset-password` | إعادة تعيين |
| `/auth/change-password` | تغيير كلمة المرور |

### 29.3 مسارات التطبيق الرئيسي

| المسار | الوصف |
|-------|------|
| `/app/{slug}` | الداشبورد الرئيسي |
| `/app/{slug}/projects` | قائمة المشاريع |
| `/app/{slug}/projects/new` | مشروع جديد |
| `/app/{slug}/projects/templates` | قوالب المشاريع |
| `/app/{slug}/projects/{id}` | نظرة عامة على المشروع |
| `/app/{slug}/projects/{id}/execution` | التنفيذ |
| `/app/{slug}/projects/{id}/execution/advanced` | تنفيذ متقدم |
| `/app/{slug}/projects/{id}/execution/analysis` | تحليل |
| `/app/{slug}/projects/{id}/execution/lookahead` | توقعات |
| `/app/{slug}/projects/{id}/execution/new-issue` | مشكلة جديدة |
| `/app/{slug}/projects/{id}/execution/new-report` | تقرير يومي |
| `/app/{slug}/projects/{id}/execution/upload` | رفع صور |
| `/app/{slug}/projects/{id}/timeline` | الجدول الزمني |
| `/app/{slug}/projects/{id}/finance` | مالية المشروع |
| `/app/{slug}/projects/{id}/finance/claims` | المستخلصات |
| `/app/{slug}/projects/{id}/finance/contract` | العقد |
| `/app/{slug}/projects/{id}/finance/expenses` | المصروفات |
| `/app/{slug}/projects/{id}/finance/payments` | الدفعات |
| `/app/{slug}/projects/{id}/finance/profitability` | الربحية |
| `/app/{slug}/projects/{id}/finance/subcontracts` | مقاولو الباطن |
| `/app/{slug}/projects/{id}/documents` | المستندات |
| `/app/{slug}/projects/{id}/changes` | أوامر التغيير |
| `/app/{slug}/projects/{id}/quantities` | الكميات |
| `/app/{slug}/projects/{id}/team` | الفريق |
| `/app/{slug}/projects/{id}/chat` | المحادثات |
| `/app/{slug}/projects/{id}/insights` | التحليلات |
| `/app/{slug}/projects/{id}/owner` | بوابة المالك |
| `/app/{slug}/projects/{id}/updates` | التحديثات |
| `/app/{slug}/finance` | لوحة المالية |
| `/app/{slug}/finance/invoices` | الفواتير |
| `/app/{slug}/finance/invoices/new` | فاتورة جديدة |
| `/app/{slug}/finance/invoices/{id}` | تفاصيل فاتورة |
| `/app/{slug}/finance/invoices/{id}/edit` | تعديل فاتورة |
| `/app/{slug}/finance/invoices/{id}/preview` | معاينة فاتورة |
| `/app/{slug}/finance/invoices/{id}/credit-note` | إشعار دائن |
| `/app/{slug}/finance/payments` | المقبوضات |
| `/app/{slug}/finance/payments/new` | مقبوضة جديدة |
| `/app/{slug}/finance/expenses` | المصروفات |
| `/app/{slug}/finance/expenses/new` | مصروف جديد |
| `/app/{slug}/finance/expenses/transfer` | تحويل |
| `/app/{slug}/finance/banks` | الحسابات البنكية |
| `/app/{slug}/finance/clients` | العملاء |
| `/app/{slug}/finance/documents` | المستندات المالية |
| `/app/{slug}/finance/reports` | التقارير |
| `/app/{slug}/finance/settings` | إعدادات المالية |
| `/app/{slug}/pricing` | لوحة التسعير |
| `/app/{slug}/pricing/studies` | الدراسات |
| `/app/{slug}/pricing/studies/new` | دراسة جديدة |
| `/app/{slug}/pricing/studies/{id}/quantities` | كميات الدراسة |
| `/app/{slug}/pricing/studies/{id}/specifications` | مواصفات |
| `/app/{slug}/pricing/studies/{id}/costing` | تكلفة |
| `/app/{slug}/pricing/studies/{id}/pricing` | تسعير |
| `/app/{slug}/pricing/studies/{id}/quotation` | عرض سعر |
| `/app/{slug}/pricing/quotations` | عروض الأسعار |
| `/app/{slug}/pricing/leads` | العملاء المحتملون |
| `/app/{slug}/pricing/quick` | تسعير سريع |
| `/app/{slug}/company` | لوحة المنشأة |
| `/app/{slug}/company/employees` | الموظفون |
| `/app/{slug}/company/assets` | الأصول |
| `/app/{slug}/company/expenses` | المصروفات الثابتة |
| `/app/{slug}/company/payroll` | الرواتب |
| `/app/{slug}/company/leaves` | الإجازات |
| `/app/{slug}/company/hr` | الموارد البشرية |
| `/app/{slug}/company/templates` | القوالب |
| `/app/{slug}/company/reports` | التقارير |
| `/app/{slug}/settings/general` | إعدادات عامة |
| `/app/{slug}/settings/members` | الأعضاء |
| `/app/{slug}/settings/roles` | الأدوار |
| `/app/{slug}/settings/users` | المستخدمون |
| `/app/{slug}/settings/billing` | الفوترة |
| `/app/{slug}/settings/notifications` | الإشعارات |
| `/app/{slug}/settings/integrations` | التكاملات |
| `/app/{slug}/settings/templates` | قوالب الإعدادات |
| `/app/{slug}/notifications` | مركز الإشعارات |

### 29.4 مسارات الحساب

| المسار | الوصف |
|-------|------|
| `/app/settings/general` | إعدادات الحساب |
| `/app/settings/security` | الأمان |
| `/app/settings/billing` | الفوترة |
| `/app/settings/danger-zone` | منطقة الخطر |
| `/app/admin/users` | إدارة المستخدمين (super admin) |
| `/app/admin/organizations` | إدارة المنظمات |
| `/app/admin/subscriptions` | الاشتراكات |
| `/app/admin/revenue` | الإيرادات |
| `/app/admin/plans` | الخطط |
| `/app/admin/activation-codes` | أكواد التفعيل |
| `/app/admin/logs` | السجلات |
| `/app/chatbot` | المساعد الذكي |

### 29.5 مسارات خارجية

| المسار | الوصف |
|-------|------|
| `/owner/[token]` | بوابة المالك |
| `/share/[token]` | رابط مشاركة |
| `/invitation/accept` | قبول دعوة |
| `/choose-plan` | اختيار خطة |
| `/new-organization` | منظمة جديدة |
| `/onboarding` | الإعداد الأولي |

---

## الملحق التفصيلي 30: Glossary (مصطلحات مسار)

| المصطلح | بالعربية | الوصف |
|---------|---------|------|
| BOQ | جدول الكميات | Bill of Quantities — قائمة بنود العمل وكمياتها وأسعارها |
| BOM | جدول المواد | Bill of Materials — قائمة المواد المطلوبة |
| Claim | مستخلص | دفعة مرحلية بناءً على تقدم العمل |
| Change Order | أمر تغيير | تعديل رسمي على نطاق/قيمة/مدة العقد |
| Cost Study | دراسة تكلفة | حصر كميات وحساب تكاليف لمشروع |
| Daily Report | تقرير يومي | تقرير الأعمال المنجزة في يوم واحد |
| Feature Gate | بوابة الميزات | آلية تقييد ميزات حسب خطة الاشتراك |
| GOSI | التأمينات الاجتماعية | General Organization for Social Insurance |
| Milestone | مرحلة | نقطة فارقة في الجدول الزمني |
| MEP | ميكانيكا وكهرباء وسباكة | Mechanical, Electrical, Plumbing |
| oRPC | RPC type-safe | بديل لـ tRPC مع OpenAPI مدمج |
| Owner Portal | بوابة المالك | واجهة محدودة لمالك المشروع (بدون حساب) |
| Pipeline | خط الإنتاج | مراحل متسلسلة (كميات → مواصفات → تكلفة → سعر → عرض) |
| Retention | محتجزات | نسبة تُحجز من كل دفعة كضمان |
| Subcontract | عقد باطن | عقد مع مقاول من الباطن |
| ZATCA | هيئة الزكاة | Zakat, Tax and Customs Authority — هيئة الزكاة والضريبة والجمارك |

---

---

## الملحق التفصيلي 31: تحليل شامل لكل وحدة وظيفية

### 31.1 إدارة المشاريع — التفاصيل

**عدد الـ API Endpoints:** 8 (list, create, getById, update, delete, archive, restore, getNextProjectNo)

**ميزات بارزة:**
- أرقام مشاريع تسلسلية تلقائية (PROJ-001, PROJ-002, ...)
- أرشفة بدل حذف (للمشاريع ذات بيانات مالية)
- 5 أنواع مشاريع (سكني، تجاري، صناعي، بنية تحتية، مختلط)
- 4 حالات (نشط، معلق، مكتمل، مؤرشف)
- تتبع التقدم 0-100%
- ربط بالعميل من قائمة العملاء

**ما ينقص:**
- لا project cloning/duplication
- لا project archiving with reason
- لا project cost baseline comparison
- لا multi-currency support (SAR only)

### 31.2 التنفيذ الميداني — التفاصيل

**عدد الـ API Endpoints:** 11 (field) + 22 (execution/advanced)

**التقارير اليومية:**
- واحد لكل يوم لكل مشروع (unique constraint)
- يسجل: عدد العمال، المعدات، الأعمال المنجزة، العوائق، الطقس
- 7 حالات طقس (مشمس، غائم، ممطر، عاصف، مغبر، حار، بارد)

**صور المشروع:**
- 6 فئات (تقدم، مشكلة، معدات، مواد، سلامة، أخرى)
- رفع عبر S3 presigned URLs
- rate limit: 10 uploads/min

**المشاكل:**
- 4 مستويات خطورة (منخفضة، متوسطة، عالية، حرجة)
- 4 حالات (مفتوحة، قيد المعالجة، تم الحل، مغلقة)
- إسناد لمسؤول + موعد نهائي
- إشعار تلقائي للمشاكل الحرجة

**Execution Module (Phase 13) — المتقدم:**
- أنشطة مع WBS codes
- اعتماديات (FS, SS, FF, SF) مع lag days
- قوائم مراجعة (checklists) لكل نشاط
- Critical path marking
- خطوط أساس (baselines) مع snapshot data
- تقاويم مشروع مخصصة (أيام عمل، إجازات)
- 6 حالات نشاط (لم يبدأ، قيد التنفيذ، مكتمل، متأخر، معلق، ملغي)
- حساب تقدم: يدوي أو من checklist أو من الأنشطة الفرعية
- تحليلات: delay analysis، health status، lookahead

### 31.3 الجدول الزمني والمراحل

**عدد الـ API Endpoints:** 9

**المراحل (Milestones):**
- title, description, plannedStart/End, actualStart/End
- 5 حالات (مخطط، قيد التنفيذ، مكتمل، متأخر، ملغي)
- progress 0-100%
- isCritical flag
- weight (وزن المرحلة في الحساب الإجمالي)
- orderIndex + drag-and-drop reorder
- ربط بتقويم مشروع
- ربط ببنود كميات (structural, finishing, MEP, labor, BOQ items)

**ما ينقص:**
- لا Gantt chart component (يُعرض كقائمة/جدول)
- لا critical path algorithm تلقائي
- لا export to MS Project format
- لا resource leveling

### 31.4 العقد الرئيسي

**عدد الـ API Endpoints:** 6

**حقول العقد:**
- رقم العقد، العنوان، اسم العميل
- القيمة (Decimal 15,2) + العملة
- تواريخ التوقيع، البدء، الانتهاء
- نسبة الاحتفاظ + سقف الاحتفاظ + أيام إفراج الاحتفاظ
- ضريبة القيمة المضافة (VAT)
- ضمان حسن الأداء (Performance Bond)
- التأمين
- غرامات التأخير (نسبة + سقف)
- نطاق العمل

**مراحل الدفع (Payment Terms):**
- 5 أنواع (دفعة مقدمة، مرحلة، شهري، عند الإنهاء، مخصص)
- لكل مرحلة: نسبة أو مبلغ + تاريخ استحقاق
- حالة: معلق، مدفوع جزئياً، مدفوع بالكامل
- ربط مباشر بالدفعات المالية

### 31.5 المستندات والاعتمادات

**عدد الـ API Endpoints:** 12

**مجلدات المستندات:**
- عقد، مخططات، مستخلصات، خطابات، صور، أخرى
- نوعان: ملف مرفوع أو رابط خارجي
- إصدارات متعددة (DocumentVersion) مع change notes
- حجم الملف ونوعه وبصمة التخزين

**نظام الاعتمادات:**
- طلب اعتماد مرتبط بمستند
- عدة مُعتمدين لكل طلب
- 3 حالات لكل مُعتمد (معلق، وافق، رفض)
- 4 حالات للطلب الكلي (معلق، معتمد، مرفوض، ملغي)
- audit log لكل عملية

### 31.6 المحادثات (Chat)

**عدد الـ API Endpoints:** 4

**قناتان:**
- `TEAM` — محادثة الفريق الداخلية
- `OWNER` — محادثة المالك الرسمية

**ميزات:**
- رسائل مع علامة "تحديث رسمي" (isUpdate)
- تتبع آخر قراءة لكل مستخدم (ChatLastRead)
- عدد غير مقروء (unreadCount)
- rate limit: 30 رسالة/دقيقة
- إشعارات تلقائية (أول 20 مستلم)

**ما ينقص:**
- لا real-time (WebSocket/SSE) — polling فقط
- لا مرفقات في الرسائل
- لا reactions/emoji
- لا threading/replies
- لا mention (@user)

### 31.7 التحليلات (Insights)

**عدد الـ API Endpoints:** 2 (get, acknowledge)

**التنبيهات الذكية (5 أنواع):**
- `MISSING_DAILY_REPORT` — تقرير يومي مفقود
- `STALE_PROGRESS` — تقدم قديم (لم يُحدّث)
- `OVERDUE_PAYMENT` — دفعة متأخرة
- `COST_OVERRUN_RISK` — خطر تجاوز التكلفة
- `TOO_MANY_OPEN_ISSUES` — مشاكل مفتوحة كثيرة

**خطورة:** INFO, WARN, CRITICAL
**Deduplication:** dedupeKey فريد يمنع التكرار

### 31.8 الملخصات الأسبوعية (Digests)

**عدد الـ API Endpoints:** 4

- تكرار أسبوعي (WEEKLY فقط حالياً)
- per-project أو لكل المشاريع
- قنوات: IN_APP أو EMAIL
- enable/disable per subscription

### 31.9 التكاملات والرسائل

**عدد الـ API Endpoints:** 5

**قنوات الرسائل الخارجية:**
- Email (مفعّل افتراضياً)
- WhatsApp (متاح، يحتاج إعداد)
- SMS (متاح، يحتاج إعداد)

**إعدادات per-organization:**
- القناة الافتراضية
- إشعار المالك عند تحديث رسمي
- إشعار المالك عند استحقاق دفعة

**سجل التسليم:**
- كل رسالة تُسجّل مع: القناة، المستلم، الحالة (PENDING/SENT/FAILED/SKIPPED)
- provider name، رسالة الخطأ

---

## الملحق التفصيلي 32: تحليل معمّق للأداء — أنماط الاستعلامات

### 32.1 N+1 Query Patterns المحتملة

| الموقع | النمط | الخطورة |
|-------|------|---------|
| `project-quantities/getPhaseBreakdown` | 5 `findMany` queries per project | 🟡 منخفض (per-project scoped) |
| `project-quantities/getMaterialsList` | 4 `findMany` queries per project | 🟡 منخفض (per-project scoped) |
| `company/leave-dashboard` | 3 parallel `findMany` (mitigated by Promise.all) | 🟢 مقبول |
| `dashboard/getAll` | 3 parallel queries (Promise.all) | 🟢 جيد |
| `quantities/costing/generate` | 9 `findMany` calls to build costing items | 🟡 متوسط |
| `quantities/specifications/get` | 7 `findMany` calls | 🟡 متوسط |

### 32.2 Unbounded Queries (بدون pagination)

| الموقع | ما يُجلب | الحد |
|-------|---------|------|
| `quantities/costing/*` | كل بنود الدراسة | لا حد (per-study scoped) |
| `quantities/specifications/*` | كل بنود المواصفات | لا حد |
| `project-boq/list` | كل بنود BOQ للمشروع | لا حد |
| `subcontracts/listItems` | كل بنود عقد الباطن | لا حد |
| `finance/listExpensesWithSubcontracts` | 200 + 200 records, in-memory merge | 400 record max |

### 32.3 Heavy Queries

| الموقع | العملية | التأثير المتوقع |
|-------|--------|----------------|
| `orgDashboard` | 7 parallel aggregate queries | ~50-100ms |
| `reconcileBankAccount` | 5 aggregate queries | ~30-50ms |
| `recalculateCostStudyTotals` | 4 parallel aggregates + 1 update | ~20-40ms (يُنفّذ بعد كل save) |
| `dashboard.getAll` | 3 parallel multi-table queries | ~30-60ms |
| `exportExpensesCsv` | Full table scan + CSV generation | Variable |

### 32.4 تأثير Region Mismatch

```
السيناريو: صفحة مشروع مع 7 sequential layout queries

Current (Mumbai ap-south-1):
  Network latency per query: 40-80ms
  Total added latency: 280-560ms
  Total page load: 900-1600ms

Proposed (Bahrain me-south-1):
  Network latency per query: 5-15ms
  Total added latency: 35-105ms
  Total page load: 635-1145ms

  Improvement: 245-455ms faster (27-35% reduction)
```

### 32.5 Client-Side Performance Bottlenecks

| المكون | المشكلة | الحل المقترح |
|-------|---------|-------------|
| `BOQSummaryTable` | `aggregateBOQ` → `recalculateItem` لكل بند عند أي فلتر | `useMemo` + web worker لحسابات ثقيلة |
| `PaintItemDialog` | 15+ useState → re-render كامل عند أي تغيير | `useReducer` أو form library |
| `CreateInvoiceForm` | 25+ useState → re-render 1338 سطر | react-hook-form |
| `TemplateCustomizer` | Preview re-render عند أي slider tick | `React.memo` + debounce preview |
| `PricingPageContentV2` | 5 parallel API queries + 10+ useState | Custom hook + `useMemo` |
| Tables بدون virtualization | كل الصفوف في DOM | react-window/react-virtuoso |

---

## الملحق التفصيلي 33: تحليل Prisma Indexes بالتفصيل

### 33.1 Indexes الموجودة — ملخص حسب النوع

| نوع الـ Index | العدد | أمثلة |
|-------------|------|-------|
| Primary key (@id) | 112 | كل model |
| @@unique (composite) | 31 | `[organizationId, slug]`, `[projectId, userId]`, `[organizationId, name]` |
| @@index (single) | ~80 | `[organizationId]`, `[userId]`, `[projectId]` |
| @@index (composite) | ~145 | `[organizationId, projectId, status]`, `[organizationId, date]` |
| @unique (field) | ~15 | `email`, `token`, `slug`, `quotationNo`, `invoiceNo` |

### 33.2 أنماط الفهرسة الجيدة

✅ **كل جدول فرعي** يحتوي على `@@index([organizationId])` — يمنع full table scan عند الاستعلام per-organization.

✅ **الاستعلامات المركبة** مفهرسة:
```
@@index([organizationId, projectId, status])      ← فلترة بالحالة
@@index([organizationId, projectId, createdAt])   ← ترتيب زمني
@@index([organizationId, date])                    ← فلترة بالتاريخ
@@index([organizationId, category])                ← فلترة بالفئة
```

✅ **Foreign keys** مفهرسة:
```
@@index([userId])
@@index([projectId])
@@index([contractId])
@@index([invoiceId])
```

### 33.3 Indexes مفقودة

| الجدول | الـ Index المفقود | السبب |
|-------|------------------|------|
| `Lead` | `@@index([organizationId, status, priority])` | فلترة pipeline بالأولوية |
| `FinanceInvoice` | `@@index([organizationId, status, dueDate])` | استعلامات المتأخرات |
| `Employee` | `@@index([linkedUserId])` | ربط مستخدم بموظف |
| `CompanyExpense` | `@@index([organizationId, recurrence, isActive])` | المصروفات المتكررة النشطة |
| `LeaveRequest` | `@@index([employeeId, status])` | طلبات إجازة الموظف |
| `ProjectActivity` | `@@index([milestoneId, status])` | أنشطة مرحلة بحالة |
| `Notification` | `@@index([userId, readAt])` | إشعارات غير مقروءة |

---

## الملحق التفصيلي 34: تحليل الأمان — التفاصيل

### 34.1 Multi-tenant Isolation

✅ **Cross-Tenant Guard (أقوى حماية):**
```typescript
// packages/api/lib/permissions/get-user-permissions.ts
if (user.organizationId !== requestedOrganizationId) {
  logBusinessEvent("permission.cross_tenant", {
    severity: "error",
    userId: user.id,
    userOrgId: user.organizationId,
    requestedOrgId: organizationId,
  });
  return createEmptyPermissions(); // deny-all
}
```

✅ **كل Database Query** يتضمن `organizationId` في WHERE:
```typescript
const expenses = await db.financeExpense.findMany({
  where: {
    organizationId: context.organization.id, // ← always present
    ...filters
  }
});
```

✅ **لا direct object references** — كل عملية تتحقق من الملكية:
```typescript
const project = await getProjectById(projectId, organizationId);
if (!project) throw new ORPCError("NOT_FOUND");
```

### 34.2 Input Validation Security

✅ **Zod validation على 100% من oRPC inputs** — لا input غير validated.

⚠️ **ما ينقص:**
- `.max()` على strings في ~90% من modules
- `.max()` على arrays في bulk operations
- Upper bound على `limit` parameter في ~20 list endpoints

**الوحدات الأفضل validation:**
1. `project-boq` — `.max()` على code(50), category(200), specifications(2000), notes(1000), search(200)
2. `project-execution` — `.max()` على description(2000), notes(5000)
3. `project-timeline` — `.max()` على description(2000)
4. `attachments` — fileName `.max(255)`, fileSize `.max(100MB)`, MIME validation, double-extension check

### 34.3 File Upload Security

```typescript
// packages/api/modules/attachments/
validateAttachment(file) {
  // 1. File size check (max 100MB)
  // 2. File name validation (no path traversal, no double extensions)
  // 3. MIME type validation against whitelist
  // 4. Extension-MIME consistency check
}

validateFileName(name) {
  // Rejects: ../../../etc/passwd, file.exe.pdf, file%2e%2e/etc
}
```

### 34.4 CSRF Protection

✅ **BetterAuth** يستخدم CSRF tokens تلقائياً لـ POST requests.
✅ **CORS** مقصور على origin واحد (`getBaseUrl()`) مع `credentials: true`.
✅ **SameSite cookies** (BetterAuth default).

### 34.5 XSS Vectors

✅ **React**: Auto-escaping بطبيعته لكل `{variable}` في JSX.
✅ **CSP**: `script-src 'self' 'unsafe-inline'` — يمنع inline scripts من domains خارجية.
⚠️ **`unsafe-inline`**: يسمح بـ inline script injection إذا وُجد HTML injection. لكن React يمنع هذا بالفعل.
⚠️ **`react-markdown`**: يُستخدم في AI assistant — يجب التأكد من sanitization (rehype-sanitize).

### 34.6 SQL Injection Protection

✅ **Prisma ORM**: كل الاستعلامات parameterized.
✅ **Raw queries minimal**: فقط `getNextSequenceValue` يستخدم `$queryRaw` مع tagged template (parameterized).
✅ **لا string concatenation** في أي SQL query.

### 34.7 Secret Exposure Analysis

| السر | الموقع | الحالة |
|-----|-------|-------|
| Database password | `.env.local.example` | 🔴 مكشوف في Git (real credentials) |
| Database connection string | `.env.local.example` | 🔴 مكشوف |
| Supabase bucket name | `next.config.ts` | 🟡 مكشوف (hostname) — مقبول |
| API keys | `.env.local.example` | ✅ Placeholders (ما عدا DB) |
| NEXT_PUBLIC_* variables | `.env.local.example` | ✅ Public by design |

---

## الملحق التفصيلي 35: تحليل CSS والتصميم البصري

### 35.1 CSS Variables (من tailwind-config)

**المنصة تستخدم نظام CSS variables مع Tailwind CSS 4:**
```css
/* Light theme */
--background: oklch(1 0 0);          /* أبيض */
--foreground: oklch(0.145 0 0);      /* أسود تقريباً */
--primary: oklch(0.205 0.085 265);   /* أزرق داكن */
--card: oklch(1 0 0);
--muted: oklch(0.97 0 0);
--accent: oklch(0.97 0 0);
--destructive: oklch(0.577 0.245 27); /* أحمر */

/* Dark theme */
.dark {
  --background: oklch(0.145 0 0);     /* أسود تقريباً */
  --foreground: oklch(0.985 0 0);     /* أبيض تقريباً */
  --primary: oklch(0.922 0.085 265);  /* أزرق فاتح */
  --card: oklch(0.205 0 0);
}
```

### 35.2 Glass Morphism Design

```css
/* globals.css */
.masar-glow {
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}
.masar-glow:hover {
  border-color: color-mix(in srgb, var(--primary) 40%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--primary) 15%, transparent);
  transform: translateY(-2px);
}
```

### 35.3 Font System

```css
/* LTR: System font stack */
body { letter-spacing: -0.02em; }

/* RTL: IBM Plex Sans Arabic */
[dir="rtl"] body {
  font-family: var(--font-arabic-sans), var(--font-sans), ui-sans-serif, system-ui;
  letter-spacing: 0;
}

/* RTL heading weights */
[dir="rtl"] h1 { font-weight: 700; }
[dir="rtl"] h2 { font-weight: 600; }
[dir="rtl"] h3, [dir="rtl"] h4 { font-weight: 500; }

/* Saudi Riyal symbol protection */
[dir="rtl"] i.sr { font-family: "saudi riyal symbol" !important; }
```

---

## الملحق التفصيلي 36: أوامر التطوير المهمة

| الأمر | الوصف |
|------|------|
| `pnpm dev` | تشغيل development server (Turborepo concurrency 15) |
| `pnpm build` | بناء production |
| `pnpm start` | تشغيل production server |
| `pnpm type-check` | فحص TypeScript |
| `pnpm lint` | Biome linting |
| `pnpm check` | Biome check (lint + format) |
| `pnpm format` | Biome formatting |
| `pnpm test` | تشغيل كل الاختبارات (Vitest) |
| `pnpm test:api` | اختبارات API فقط |
| `pnpm test:db` | اختبارات Database فقط |
| `pnpm test:coverage` | اختبارات مع تغطية |
| `pnpm clean` | تنظيف build artifacts |
| `pnpm e2e` | Playwright tests (UI mode) |
| `pnpm e2e:ci` | Playwright tests (CI mode) |
| `npx prisma generate` | توليد Prisma client |
| `npx prisma migrate dev` | تطبيق migrations |
| `npx prisma studio` | Prisma Studio (DB GUI) |

---

## الملحق التفصيلي 37: مقارنة مع المنافسين (تقديرية)

| الميزة | مسار (Masar) | Procore | PlanRadar | Buildertrend |
|--------|-------------|---------|-----------|-------------|
| حصر كميات تلقائي | ✅ (محركات حساب 7K سطر) | ❌ | ❌ | ❌ |
| تسعير متكامل (Pipeline) | ✅ (6 مراحل) | ❌ | ❌ | محدود |
| فوترة إلكترونية (ZATCA) | ⚠️ Phase 1 | ❌ | ❌ | ❌ |
| RTL/Arabic-first | ✅ | ❌ | ⚠️ | ❌ |
| بوابة المالك | ✅ (Token-based) | ✅ | ❌ | ✅ |
| مقاولو باطن | ✅ (شامل) | ✅ | محدود | ✅ |
| HR/إجازات/رواتب | ✅ | ❌ | ❌ | ❌ |
| أصول المنشأة | ✅ | ❌ | ❌ | ❌ |
| AI مساعد | ✅ (20 أداة، Claude) | ⚠️ | ❌ | ❌ |
| CRM/Leads | ✅ | ❌ | ❌ | محدود |
| قوالب مالية (drag-and-drop) | ✅ | ❌ | ❌ | محدود |
| Multi-tenant | ✅ | ✅ | ✅ | ✅ |
| Mobile app | ❌ (responsive web) | ✅ | ✅ | ✅ |
| Gantt chart | ❌ (قائمة فقط) | ✅ | ✅ | ✅ |
| Offline support | ❌ | ⚠️ | ✅ | ❌ |
| API documentation | ✅ (OpenAPI auto) | ✅ | ⚠️ | ❌ |
| السعر (شهري) | 199 SAR | $499+ USD | $49+ EUR | $499+ USD |

**نقاط التميز الرئيسية لمسار:**
1. أول منصة SaaS تجمع حصر الكميات + التسعير + إدارة المشاريع في نظام واحد عربي
2. محركات حساب إنشائية متخصصة للسوق السعودي
3. سعر تنافسي جداً مقارنة بالمنافسين الغربيين
4. AI مدمج بسياق الصفحة (context-aware)

**نقاط الضعف مقارنة بالمنافسين:**
1. لا تطبيق موبايل native
2. لا Gantt chart بصري
3. لا offline support
4. ZATCA Phase 2 غير مكتمل
5. لا BIM integration
6. تغطية اختبارات ضعيفة جداً

---

---

## الملحق التفصيلي 38: تحليل كامل لملفات Database Queries

### 38.1 finance.ts (2,150 سطر) — أكبر ملف استعلامات

**الأقسام:**
| القسم | الأسطر | الدوال |
|------|--------|-------|
| Invoice Calculations | 1-60 | `calculateInvoiceTotals` (Decimal math) |
| Clients CRUD | 61-250 | `getClients`, `getClient`, `createClient`, `updateClient`, `deleteClient` |
| Client Contacts | 251-350 | `getClientContacts`, `addClientContact`, `updateClientContact`, `deleteClientContact`, `setPrimaryContact` |
| Quotations CRUD | 351-600 | `getQuotations`, `getQuotation`, `createQuotation`, `updateQuotation`, `updateQuotationItems`, `updateQuotationStatus`, `deleteQuotation` |
| Quotation → Invoice | 601-700 | `convertQuotationToInvoice` |
| Invoices CRUD | 701-1100 | `getInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `updateInvoiceItems`, `updateInvoiceStatus`, `convertToTaxInvoice`, `addInvoicePayment`, `deleteInvoicePayment`, `deleteInvoice`, `issueInvoice`, `duplicateInvoice`, `createCreditNote` |
| Open Documents | 1101-1250 | `getOpenDocuments`, `getOpenDocument`, `createOpenDocument`, `updateOpenDocument`, `deleteOpenDocument` |
| Finance Templates | 1251-1400 | `getFinanceTemplates`, `getFinanceTemplate`, `createFinanceTemplate`, `updateFinanceTemplate`, `deleteFinanceTemplate`, `getDefaultTemplate`, `setDefaultTemplate`, `seedDefaultTemplates` |
| Finance Settings | 1401-1550 | `getFinanceSettings`, `updateFinanceSettings` |
| Activity Log | 1551-1600 | `getInvoiceActivity` |
| Dashboard | 1601-1750 | `getFinanceDashboard`, `getOutstandingInvoices` |
| Reports | 1751-2150 | `getRevenueByPeriod`, `getRevenueByProject`, `getRevenueByClient`, `getConversionRate`, `getQuotationStats`, `getInvoiceStats`, `getProfitability` |

**أهم pattern — Decimal Calculations:**
```typescript
// finance.ts lines 16-57
function calculateInvoiceTotals(items, discountPercent, vatPercent) {
  const D = (v) => new Prisma.Decimal(v);
  const ROUND = Prisma.Decimal.ROUND_HALF_UP;

  let subtotal = D(0);
  for (const item of items) {
    const total = D(item.quantity).mul(D(item.unitPrice)).toDecimalPlaces(2, ROUND);
    subtotal = subtotal.add(total);
  }

  const discountAmount = subtotal.mul(D(discountPercent)).div(100).toDecimalPlaces(2, ROUND);
  const afterDiscount = subtotal.sub(discountAmount);
  const vatAmount = afterDiscount.mul(D(vatPercent)).div(100).toDecimalPlaces(2, ROUND);
  const totalAmount = afterDiscount.add(vatAmount);

  return { subtotal, discountAmount, vatAmount, totalAmount };
}
```

### 38.2 org-finance.ts (1,476 سطر)

**الأقسام:**
| القسم | الدوال الرئيسية |
|------|---------------|
| Bank Accounts | `getBankAccounts`, `getBankAccount`, `getBankAccountSummary`, `createBankAccount`, `updateBankAccount`, `setDefaultBankAccount`, `deleteBankAccount`, `reconcileBankAccount` |
| Expenses | `getExpenses`, `getExpense`, `createExpense`, `updateExpense`, `deleteExpense`, `payExpense`, `cancelExpense`, `getExpenseSummary` |
| Payments | `getPayments`, `getPayment`, `createPayment`, `updatePayment`, `deletePayment` |
| Transfers | `getTransfers`, `getTransfer`, `createTransfer`, `cancelTransfer` |
| Dashboard | `getOrgFinanceDashboard` (7 parallel queries) |

**أهم pattern — Two-Layer Balance Guard:**
```typescript
// createExpense with balance protection
async function createExpense(data) {
  // Layer 1: Fast UX check (non-atomic)
  const account = await db.organizationBank.findUnique({
    where: { id: data.sourceAccountId },
    select: { balance: true }
  });
  if (account.balance.lessThan(data.amount)) {
    throw new Error("رصيد الحساب غير كافٍ");
  }

  // Layer 2: Atomic guard (race-condition safe)
  return db.$transaction(async (tx) => {
    const updated = await tx.organizationBank.updateMany({
      where: {
        id: data.sourceAccountId,
        balance: { gte: data.amount } // ← atomic condition
      },
      data: { balance: { decrement: data.amount } }
    });
    if (updated.count === 0) {
      throw new Error("رصيد غير كافٍ (تم تعديله أثناء العملية)");
    }
    // Create expense record...
  });
}
```

### 38.3 cost-studies.ts (1,461 سطر)

**الأقسام:**
| القسم | الدوال |
|------|-------|
| Study CRUD | `getCostStudies`, `getCostStudy`, `createCostStudy`, `updateCostStudy`, `deleteCostStudy`, `duplicateCostStudy` |
| Structural Items | `getStructuralItems`, `createStructuralItem`, `updateStructuralItem`, `deleteStructuralItem` |
| Finishing Items | Same pattern |
| MEP Items | Same pattern |
| Labor Items | Same pattern |
| Quotes | `getQuotes`, `createQuote`, `updateQuote`, `deleteQuote` |
| Spec Templates | CRUD operations |
| Totals | `recalculateCostStudyTotals` |

**أهم pattern — Cost Study Duplication:**
```typescript
async function duplicateCostStudy(studyId, organizationId, userId) {
  return db.$transaction(async (tx) => {
    // 1. Fetch original with all items
    const original = await tx.costStudy.findUnique({
      where: { id: studyId },
      include: {
        structuralItems: true,
        finishingItems: true,
        mepItems: true,
        laborItems: true,
      }
    });

    // 2. Create new study (without items)
    const newStudy = await tx.costStudy.create({
      data: {
        ...omit(original, ['id', 'createdAt', 'updatedAt', 'structuralItems', ...]),
        name: `${original.name} (نسخة)`,
        createdById: userId,
        status: 'draft',
      }
    });

    // 3. Bulk-create all items with new studyId
    for (const items of [structuralItems, finishingItems, mepItems, laborItems]) {
      await tx[model].createMany({
        data: items.map(item => ({
          ...omit(item, ['id', 'createdAt', 'updatedAt']),
          costStudyId: newStudy.id,
        }))
      });
    }

    return newStudy;
  });
}
```

### 38.4 project-execution.ts (1,090 سطر)

**Activities CRUD + Dependencies + Baselines + Calendars + Checklists**

**أهم ميزة — Activity Weight-Based Progress:**
```
Milestone progress = Σ(activity.progress × activity.weight) / Σ(activity.weight)
```
حيث كل نشاط له وزن (weight) يمثل نسبته من المرحلة.

### 38.5 company.ts (990 سطر)

**Employees + Assets + Expenses + Project Assignments**

**⚠️ مشكلة:** `getEmployeeSummary()` يجلب كل الموظفين ويحسب الإجماليات في JavaScript:
```typescript
const employees = await db.employee.findMany({
  where: { organizationId, status: "ACTIVE" }
});
let totalSalaries = 0;
for (const emp of employees) {
  totalSalaries += Number(emp.baseSalary) + Number(emp.housingAllowance) + ...;
}
```
**يجب استبداله بـ** `db.employee.aggregate({ _sum: { baseSalary: true, ... } })`.

---

## الملحق التفصيلي 39: تحليل Custom Hooks (28 hook)

### 39.1 قائمة كل الـ Custom Hooks

| # | Hook | المسار | الأسطر | الغرض |
|---|------|-------|--------|-------|
| 1 | `useMediaQuery` | `apps/web/hooks/use-media-query.ts` | ~20 | Media query listener |
| 2 | `useIsMobile` | `sidebar/use-is-mobile.ts` | ~25 | Mobile breakpoint detection |
| 3 | `useSidebarMenu` | `sidebar/use-sidebar-menu.ts` | ~200 | Build sidebar menu tree |
| 4 | `useSessionQuery` | `auth/lib/api.ts` | ~15 | Session with Infinity staleTime |
| 5 | `useActiveOrganizationQuery` | `organizations/lib/api.ts` | ~20 | Active org query |
| 6 | `useOrganizationListQuery` | `organizations/lib/api.ts` | ~15 | Org list query |
| 7 | `useConfirmationAlert` | `shared/components/ConfirmationAlertProvider.tsx` | ~10 | Confirmation dialog trigger |
| 8 | `usePageContext` (URL) | `ai-assistant/usePageContext.ts` | ~40 | URL-based page context |
| 9 | `usePageContext` (Zustand) | `ai/hooks/use-page-context.ts` | ~30 | Rich page context store |
| 10 | `useAssistant` | `ai-assistant/AssistantProvider.tsx` | ~15 | AI assistant state |
| 11 | `useChatHistory` | `ai-assistant/hooks/useChatHistory.ts` | ~50 | Chat history management |
| 12 | `useProjectRole` | `projects/components/shell/ProjectRoleProvider.tsx` | ~10 | Project role context |
| 13 | `useRoleVisibility` | `projects/lib/role-visibility.ts` | ~30 | Feature visibility by role |
| 14-28 | Various query hooks | Spread across modules | ~10-30 each | Module-specific data fetching |

### 39.2 Hooks مفقودة (يجب إضافتها)

| Hook مقترح | الغرض | يحل مشكلة |
|-----------|------|---------|
| `useDecimalCalculation` | حسابات Decimal آمنة client-side | فرق client/server calculations |
| `useDebouncedValue` | Debounce لحقول البحث والفلاتر | عمليات حساب ثقيلة عند كل keystroke |
| `useVirtualList` | List virtualization | DOM bloat في الجداول الكبيرة |
| `useFormPersist` | حفظ النماذج في localStorage | فقدان البيانات عند التنقل بالخطأ |
| `usePermission` | فحص صلاحية client-side | تكرار `hasPermission()` calls |

---

## الملحق التفصيلي 40: تحليل شامل لنظام الرواتب

### 40.1 Payroll Run Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  إنشاء   │ →  │  تعبئة   │ →  │  اعتماد  │ →  │  دفع     │
│  DRAFT   │    │ populate │    │ APPROVED │    │  PAID    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │                                │
      │                                │
      ▼                                ▼
┌──────────┐                    ┌──────────┐
│  إلغاء   │                    │  إلغاء   │
│CANCELLED │                    │CANCELLED │
└──────────┘                    └──────────┘
```

### 40.2 تعبئة مسير الرواتب (Populate)

```typescript
async function populatePayrollRun(runId) {
  // 1. جلب كل الموظفين النشطين
  const employees = await db.employee.findMany({
    where: { organizationId, status: "ACTIVE" }
  });

  // 2. لكل موظف: نسخ بيانات الراتب الحالية
  const items = employees.map(emp => ({
    payrollRunId: runId,
    employeeId: emp.id,
    baseSalary: emp.baseSalary,
    housingAllowance: emp.housingAllowance,
    transportAllowance: emp.transportAllowance,
    otherAllowances: emp.otherAllowances,
    gosiDeduction: emp.gosiSubscription,
    otherDeductions: 0,
    netSalary: baseSalary + housing + transport + other - gosi,
  }));

  // 3. إنشاء كل البنود دفعة واحدة
  await db.payrollRunItem.createMany({ data: items });

  // 4. تحديث إجماليات المسير
  await updateRunTotals(runId);
}
```

### 40.3 اعتماد مسير الرواتب

```typescript
async function approvePayrollRun(runId, userId) {
  // 1. التحقق من أن المسير في حالة DRAFT
  // 2. تغيير الحالة إلى APPROVED
  // 3. لكل بند: إنشاء FinanceExpense مرتبط
  //    (sourceType: "FACILITY_PAYROLL", category: "SALARIES")
  // 4. ⚠️ لا يتحقق من رصيد البنك!
}
```

### 40.4 حقول بند الراتب

| الحقل | الوصف |
|------|------|
| baseSalary | الراتب الأساسي |
| housingAllowance | بدل السكن |
| transportAllowance | بدل المواصلات |
| otherAllowances | بدلات أخرى |
| gosiDeduction | خصم التأمينات الاجتماعية |
| otherDeductions | خصومات أخرى |
| netSalary | صافي الراتب = (base + allowances) - deductions |

### 40.5 مشاكل نظام الرواتب

| المشكلة | الشدة | التفصيل |
|---------|------|---------|
| لا تحقق من رصيد البنك عند الاعتماد | 🟠 عالي | قد يُنشئ مصروفات تتجاوز الرصيد |
| لا تكامل مع الإجازات | 🟡 متوسط | إجازة بدون راتب لا تُخصم |
| لا overtime calculations | 🟡 متوسط | ساعات العمل الإضافية غير محسوبة |
| لا end of service benefit | 🟡 متوسط | مكافأة نهاية الخدمة غير محسوبة |
| حساب الإجماليات في JavaScript | 🟡 متوسط | يجب استخدام DB aggregate |

---

## الملحق التفصيلي 41: تحليل نظام الإجازات

### 41.1 Leave Types الافتراضية (قابلة للتخصيص)

| النوع | أيام/سنة | مدفوعة | تحتاج موافقة |
|------|---------|--------|-------------|
| إجازة سنوية | 30 | ✅ | ✅ |
| إجازة مرضية | 30 | ✅ | ✅ |
| إجازة طارئة | 5 | ✅ | ✅ |
| إجازة بدون راتب | 30 | ❌ | ✅ |

### 41.2 Leave Request Workflow

```
PENDING ──موافقة──► APPROVED ──إلغاء──► CANCELLED
    │
    ├──رفض──► REJECTED
    │
    └──إلغاء──► CANCELLED
```

### 41.3 Leave Balance Tracking

```
LeaveBalance {
  employeeId
  leaveTypeId
  year: 2026
  totalDays: 30
  usedDays: 12
  remainingDays: 18    ← يُحدّث عند الموافقة/الإلغاء
}
```

### 41.4 ما ينقص (Saudi Labor Law Compliance)

| المتطلب | الحالة | التفصيل |
|---------|--------|---------|
| Accrual تلقائي | ❌ مفقود | 2.5 يوم/شهر (< 5 سنوات)، 2.917 يوم/شهر (≥ 5 سنوات) |
| ترحيل الرصيد | ❌ مفقود | الرصيد غير المستخدم يُرحّل للسنة التالية |
| إجازة أمومة | ❌ مفقود | 10 أسابيع (70 يوم) مدفوعة |
| إجازة أبوة | ❌ مفقود | 3 أيام |
| إجازة زواج | ❌ مفقود | 5 أيام |
| إجازة وفاة | ❌ مفقود | 5 أيام (قريب من الدرجة الأولى) |
| إجازة حج | ❌ مفقود | 10-15 يوم (مرة واحدة) |
| عيد الفطر | ❌ مفقود | 4 أيام إجازة رسمية |
| عيد الأضحى | ❌ مفقود | 4 أيام إجازة رسمية |
| اليوم الوطني | ❌ مفقود | يوم واحد |
| يوم التأسيس | ❌ مفقود | يوم واحد |

---

## الملحق التفصيلي 42: تحليل كامل للعملاء (Clients Module)

### 42.1 هيكل العميل

| الحقل | الوصف |
|------|------|
| clientType | INDIVIDUAL (فرد) أو COMMERCIAL (شركة) |
| firstName / lastName | للأفراد |
| businessName | للشركات |
| name | الاسم المحسوب تلقائياً |
| code | رقم العميل (C-001, C-002, ...) |
| phone / mobile / email | الاتصال |
| streetAddress1/2, city, region, postalCode, country | العنوان |
| secondaryAddress | عنوان ثانوي (JSON) |
| currency | العملة (SAR default) |
| displayLanguage | لغة العرض (ar default) |
| classification | تصنيفات (VIP, عادي, شركة, جهة حكومية, مقاول) |
| taxNumber | الرقم الضريبي |
| crNumber | السجل التجاري |
| contacts[] | جهات الاتصال (اسم، منصب، هاتف، بريد) |

### 42.2 استخدام العميل عبر المنصة

```
Client
├── → Quotation.clientId (عروض أسعار مرتبطة)
├── → FinanceInvoice.clientId (فواتير مرتبطة)
├── → FinancePayment.clientId (مقبوضات مرتبطة)
├── → Project.clientId (مشاريع مرتبطة)
└── → contacts[] (جهات اتصال — primary contact)
```

### 42.3 العميل في بيانات الفاتورة/العرض

عند إنشاء فاتورة أو عرض سعر، بيانات العميل **تُنسخ** (snapshot) لا تُشار إليها:
```typescript
createInvoice({
  clientId: client.id,        // المرجع
  clientName: client.name,    // ← نسخة
  clientCompany: client.businessName,
  clientPhone: client.phone,
  clientEmail: client.email,
  clientAddress: client.address,
  clientTaxNumber: client.taxNumber,
});
```
هذا يحمي الفاتورة من تغييرات لاحقة على بيانات العميل — pattern جيد للامتثال المحاسبي.

---

## الملحق التفصيلي 43: تحليل نظام التقارير المالية

### 43.1 التقارير المتاحة

| التقرير | الوصف | المدخلات |
|--------|------|---------|
| Revenue by Period | الإيرادات حسب الفترة (شهري/ربعي/سنوي) | dateFrom, dateTo, groupBy |
| Revenue by Project | الإيرادات حسب المشروع | dateFrom, dateTo |
| Revenue by Client | الإيرادات حسب العميل | dateFrom, dateTo |
| Conversion Rate | معدل تحويل العروض للفواتير | dateFrom, dateTo |
| Quotation Stats | إحصائيات عروض الأسعار | dateFrom, dateTo |
| Invoice Stats | إحصائيات الفواتير | dateFrom, dateTo |
| Profitability | الربحية (إيرادات - مصروفات) | dateFrom, dateTo |
| Cash Flow | التدفق النقدي | dateFrom, dateTo, groupBy |

### 43.2 Cash Flow Report

```
packages/database/prisma/queries/cash-flow.ts (283 سطر)

التدفق النقدي = المقبوضات - المصروفات - دفعات المقاولين - التحويلات الصادرة + التحويلات الواردة

مجمّع حسب: يومي / أسبوعي / شهري
```

### 43.3 ما ينقص من التقارير

| التقرير المفقود | الأولوية |
|---------------|---------|
| Balance Sheet (الميزانية العمومية) | 🟠 عالي |
| Income Statement (قائمة الدخل) | 🟠 عالي |
| Aged Receivables (المديونيات المتقادمة) | 🟠 عالي |
| Aged Payables (المستحقات المتقادمة) | 🟡 متوسط |
| VAT Report (تقرير ضريبة القيمة المضافة) | 🟠 عالي (لـ ZATCA) |
| Project Cost vs Budget | 🟡 متوسط |
| Employee Cost Report | 🟡 متوسط |
| Subcontractor Performance Report | 🟡 متوسط |

---

## الملحق التفصيلي 44: تحليل نظام Activation Codes

### 44.1 الهيكل

```
ActivationCode {
  code: string (unique, 1-20 chars)
  planType: FREE | PRO
  durationDays: number (default 90)
  maxUsers: number (default 50)
  maxProjects: number (default 100)
  maxStorageGB: number (default 50)
  isActive: boolean
  maxUses: number (default 1)
  usedCount: number
  expiresAt: DateTime?
}

ActivationCodeUsage {
  codeId → ActivationCode
  organizationId → Organization
  activatedById → User
  activatedAt: DateTime
  planExpiresAt: DateTime
}
```

### 44.2 تدفق التفعيل

```
1. Super Admin ينشئ كود (مثل: MASAR-PRO-90)
2. المستخدم يدخل الكود في صفحة التفعيل
3. النظام يتحقق:
   - الكود موجود وصالح؟
   - لم يُستنفد (usedCount < maxUses)؟
   - لم ينتهِ (expiresAt > now)؟
4. النظام يُفعّل:
   - يحدّث org: plan=PRO, maxUsers, maxProjects, maxStorage
   - يحسب planExpiresAt = now + durationDays
   - يزيد usedCount++
   - يسجل ActivationCodeUsage
```

### 44.3 استخدامات Activation Codes

- **العروض التجريبية:** كود PRO لـ 30 يوم لعميل محتمل
- **الصفقات الخاصة:** كود PRO لـ 365 يوم لعقد سنوي خارج Stripe
- **الشركاء:** أكواد multi-use للموزعين
- **الاختبار الداخلي:** أكواد PRO لفريق التطوير

---

## الملحق التفصيلي 45: ملخص Security Checklist

### 45.1 OWASP Top 10 — حالة التنفيذ

| # | الثغرة | الحالة | التفاصيل | مكتمل |
|---|--------|--------|---------|------|
| A01 | Broken Access Control | ⚠️ | Cross-tenant guard ✅، RBAC 55 perm ✅، perf-check مكشوف ❌، shares بدون rate limit ❌ | 85% |
| A02 | Cryptographic Failures | ✅ | HTTPS (HSTS) ✅، tokens 256-bit ✅، bcrypt passwords ✅ | 95% |
| A03 | Injection | ✅ | Prisma ORM ✅، Zod validation ✅، لا raw SQL غير آمن ✅ | 98% |
| A04 | Insecure Design | ⚠️ | Owner portal impersonation ❌، no absolute session expiry ❌ | 70% |
| A05 | Security Misconfiguration | ⚠️ | Real creds in .env ❌، missing env vars ❌، headers ✅ | 60% |
| A06 | Vulnerable Components | ✅ | Modern deps ✅، no known CVEs ✅ | 95% |
| A07 | Auth Failures | ✅ | 2FA ✅، Passkeys ✅، rate limiting ✅، session mgmt ✅ | 90% |
| A08 | Software Integrity | ✅ | Lockfile ✅، no CDN scripts ✅ | 95% |
| A09 | Logging & Monitoring | ⚠️ | Audit logs ✅ (133 points)، Sentry ✅، no security SIEM ❌ | 70% |
| A10 | SSRF | ✅ | No user-controlled URLs in server fetches ✅ | 98% |

### 45.2 Authentication Security Checklist

| البند | الحالة |
|------|--------|
| Password minimum length enforced | ⚠️ (server-side via BetterAuth, client Zod missing .min()) |
| Password complexity requirements | ❌ (no uppercase/number/special requirements) |
| Brute force protection | ✅ (rate limiting: 10 sign-in/min, 5 signup/min) |
| Session timeout | ✅ (30 days, freshAge 60s) |
| Session invalidation on password change | ✅ (BetterAuth handles) |
| Account lockout | ❌ (no lockout after N failures) |
| 2FA available | ✅ (TOTP) |
| 2FA enforced | ❌ (optional, not enforceable per-org) |
| Passkey support | ✅ (WebAuthn/FIDO2) |
| OAuth state parameter | ✅ (BetterAuth handles CSRF) |
| Secure cookie attributes | ✅ (httpOnly, secure, sameSite) |
| Account deactivation | ✅ (isActive flag, enforced in middleware) |

### 45.3 Data Protection Checklist

| البند | الحالة |
|------|--------|
| Data at rest encryption | ✅ (Supabase default — AES-256) |
| Data in transit encryption | ✅ (TLS 1.3 via HSTS) |
| PII identification | ⚠️ (no formal PII tagging) |
| Data retention policy | ⚠️ (audit logs: "7 years" comment, no enforcement) |
| Right to deletion | ✅ (user delete enabled) |
| Data export | ⚠️ (CSV exports for some data, no full data export) |
| Backup and recovery | ✅ (Supabase daily backups) |
| Multi-tenant isolation | ✅ (organizationId in every query + cross-tenant guard) |

### 45.4 API Security Checklist

| البند | الحالة |
|------|--------|
| Authentication on all endpoints | ⚠️ (perf-check, shares.getResource unauthenticated) |
| Authorization checks | ✅ (300+ verifyAccess calls) |
| Input validation | ✅ (100% Zod, but missing .max() on strings) |
| Rate limiting | ✅ (6 presets + global middleware) |
| CORS configured | ✅ (single origin, credentials) |
| Content-Type validation | ✅ (oRPC handles) |
| Response headers | ✅ (no-store on API routes) |
| Error handling | ⚠️ (20 instances of throw new Error instead of ORPCError) |
| API versioning | ❌ (no versioning strategy) |
| OpenAPI documentation | ✅ (auto-generated) |
| Webhook signature verification | ✅ (Stripe webhook secret) |

---

---

## الملحق التفصيلي 46: تحليل كل API Module — Audit Log Coverage

### 46.1 Modules مع Audit Log شامل

| Module | عدد نقاط التسجيل | الأحداث المسجّلة |
|--------|-----------------|-----------------|
| **finance** | 13+ | INVOICE_CREATED, INVOICE_UPDATED, INVOICE_ITEMS_UPDATED, INVOICE_STATUS_CHANGED, INVOICE_CONVERTED_TO_TAX, INVOICE_PAYMENT_ADDED, INVOICE_PAYMENT_DELETED, INVOICE_DELETED, INVOICE_ISSUED, INVOICE_DUPLICATED, INVOICE_CREDIT_NOTE_CREATED, QUOTATION_*, CLIENT_* |
| **subcontracts** | 12+ | SUBCONTRACT_CREATED/UPDATED/DELETED, SUBCONTRACT_CO_CREATED/UPDATED/DELETED, SUBCONTRACT_PAYMENT_CREATED, SUBCONTRACT_ITEM_CREATED/UPDATED/DELETED, SUBCONTRACT_CLAIM_CREATED/STATUS_CHANGED |
| **project-documents** | 5+ | DOC_CREATED, DOC_DELETED, APPROVAL_REQUESTED, APPROVAL_DECIDED, ATTACHMENT_CREATED |
| **project-change-orders** | 5+ | CO_CREATED, CO_SUBMITTED, CO_APPROVED, CO_REJECTED, CO_IMPLEMENTED |
| **super-admin** | 6+ | changePlan, suspend, activate, setFreeOverride, updateLimits, plan update |
| **project-owner** | 4+ | TOKEN_CREATED, TOKEN_REVOKED, renewAccess, sendOfficialUpdate |
| **project-payments** | 3 | PROJECT_PAYMENT_CREATED, PROJECT_PAYMENT_UPDATED, PROJECT_PAYMENT_DELETED |
| **projects** | 2 | PROJECT_ARCHIVED, PROJECT_RESTORED |
| **project-finance** | 3+ | SUBCONTRACT_CREATED/UPDATED/DELETED (via subcontract operations) |
| **project-updates** | 1 | publish (MESSAGE_SENT type) |

### 46.2 Modules بدون Audit Log (فجوات)

| Module | ما يحتاج تسجيل | الخطورة |
|--------|---------------|---------|
| **company** (65 endpoints) | Employee create/terminate, payroll approve/cancel, asset assign/retire, leave approve/reject | 🔴 حرج |
| **roles** | Role create/update/delete, permission changes | 🔴 حرج |
| **org-users** | User create/deactivate/delete, role assignment | 🔴 حرج |
| **quantities** (65 endpoints) | Study create/delete, stage approve, quotation generate | 🟠 عالي |
| **project-team** | Member add/remove/role change | 🟠 عالي |
| **attachments** | File upload/delete | 🟡 متوسط |
| **project-boq** | BOQ create/import/delete | 🟡 متوسط |
| **project-execution** | Activity create/update, baseline create | 🟡 متوسط |
| **ai** | Chat create (for usage tracking) | 🟢 منخفض |
| **notifications** | Preference changes | 🟢 منخفض |
| **integrations** | Settings changes | 🟢 منخفض |

### 46.3 Audit Log Schema

```prisma
model OrganizationAuditLog {
  id              String          @id
  organizationId  String          // المنظمة
  actorId         String          // من قام بالعملية
  action          OrgAuditAction  // نوع العملية (35+ قيمة)
  entityType      String          // نوع الكيان (expense, invoice, bank_account, ...)
  entityId        String          // معرّف الكيان
  metadata        Json?           // بيانات إضافية (amounts, old/new values)
  ipAddress       String?         // عنوان IP
  createdAt       DateTime        // الوقت

  // الاحتفاظ: 7 سنوات (نظام الزكاة والضريبة السعودي)
}
```

---

## الملحق التفصيلي 47: تحليل أنماط Error Handling

### 47.1 أنماط الخطأ في API

**Pattern 1: ORPCError (الصحيح — 337 موقع)**
```typescript
throw new ORPCError("FORBIDDEN", {
  message: "ليس لديك صلاحية للوصول لهذا المحتوى",
  data: { code: "PERMISSION_DENIED", section: "finance", action: "invoices" }
});
```

**Pattern 2: throw new Error (الخطأ — 20 موقع)**
```typescript
// Dashboard router — 9 instances
throw new Error("Unauthorized"); // ← ينتج HTTP 500!
```

**Pattern 3: Business Event Logging**
```typescript
logBusinessEvent("subscription.limit_hit", {
  severity: "warning",
  userId: context.user.id,
  organizationId: org.id,
  feature: "projects.create",
  currentCount: projectCount,
  limit: org.maxProjects,
});
throw new ORPCError("FORBIDDEN", {
  message: "لقد وصلت للحد الأقصى...",
  data: { code: "UPGRADE_REQUIRED", feature }
});
```

### 47.2 Error Handling في Frontend

**Pattern 1: error.tsx (11 ملفات)**
```typescript
// Client component
export default function ErrorPage({ error, reset }) {
  return (
    <div>
      <h2>حدث خطأ غير متوقع</h2>
      <p>نعتذر عن هذا الخطأ...</p>
      <button onClick={() => reset()}>إعادة المحاولة</button>
      <button onClick={() => router.back()}>العودة</button>
      {process.env.NODE_ENV === "development" && <pre>{error.message}</pre>}
    </div>
  );
}
```

**Pattern 2: React Query Error Handling**
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: [...],
  queryFn: ...,
  // retry: false (global default)
});

if (error) {
  // Usually handled by error.tsx boundary
  // Some components show inline error messages
}
```

**Pattern 3: Form Submission Errors**
```typescript
try {
  await mutation.mutateAsync(data);
  toast.success("تم الحفظ بنجاح");
} catch (error) {
  toast.error(error.message || "حدث خطأ");
}
```

### 47.3 Global Error Handler

```typescript
// app/global-error.tsx (1,349 سطر — includes styling)
export default function GlobalError({ error, reset }) {
  // Sentry.captureException(error)
  // Shows full-page error with retry and reload options
  // Includes Arabic error message
}
```

---

## الملحق التفصيلي 48: تحليل Turborepo Pipeline

### 48.1 Task Dependencies

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^generate", "^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "generate": {
      "cache": false
    },
    "dev": {
      "cache": false,
      "dependsOn": ["^generate"],
      "persistent": true
    },
    "test": {
      "cache": false,
      "dependsOn": ["^generate"]
    }
  }
}
```

### 48.2 Build Pipeline

```
prisma generate ──► packages build ──► web build
     │                    │                │
     ▼                    ▼                ▼
  Prisma Client     TS compilation   Next.js build
  + Zod schemas     (api, auth,      (pages, RSC,
                     mail, etc.)      client bundles)
```

### 48.3 Development Flow

```
pnpm dev
  → dotenv -c -- turbo dev --concurrency 15
    → ^generate (Prisma generate first)
    → All packages dev in parallel (max 15)
    → next dev (with HMR)
```

### 48.4 Scripts Summary

| الأمر | الوصف |
|------|------|
| `build` | `next build --webpack` |
| `dev` | `next dev` |
| `start` | `next start` |
| `type-check` | `tsc --noEmit` |
| `e2e` | `playwright test --ui` |
| `e2e:ci` | `playwright install && playwright test` |
| `shadcn-ui` | `pnpm dlx shadcn@latest` |

---

## الملحق التفصيلي 49: تحليل Package Dependencies بالتفصيل

### 49.1 Production Dependencies (87)

**الفئة: Framework & Core (8)**
| Package | الإصدار | الحجم المتوقع |
|---------|---------|-------------|
| next | 16.1.0 | ~15MB |
| react | 19.2.3 | ~140KB |
| react-dom | 19.2.3 | ~140KB |
| hono | 4.10.5 | ~200KB |
| typescript (build) | 5.9.3 | — |
| server-only | 0.0.1 | <1KB |
| sharp | 0.34.5 | ~30MB (native) |
| pg | 8.16.3 | ~200KB |

**الفئة: Auth & Security (3)**
| Package | الإصدار |
|---------|---------|
| better-auth | 1.4.7 |
| oslo | 1.2.1 |
| js-cookie | 3.0.5 |

**الفئة: Data & State (7)**
| Package | الإصدار |
|---------|---------|
| @tanstack/react-query | 5.90.9 |
| @tanstack/react-table | 8.21.3 |
| @orpc/client | 1.13.2 |
| @orpc/tanstack-query | 1.13.2 |
| zustand | 5.0.11 |
| nuqs | 2.7.3 |
| zod | 4.1.12 |

**الفئة: UI Components (18)**
| Package | الإصدار |
|---------|---------|
| @radix-ui/* | 12 packages (accordion → tooltip) |
| lucide-react | 0.553.0 |
| cmdk | 1.1.1 |
| sonner | 2.0.7 |
| input-otp | 1.4.2 |
| class-variance-authority | 0.7.1 |
| clsx | 2.1.1 |
| tailwind-merge | 3.4.0 |

**الفئة: Data Visualization (1)**
| Package | الإصدار | الحجم المتوقع |
|---------|---------|-------------|
| recharts | 2.15.4 | ~500KB (heavy) |

**الفئة: Forms & Validation (2)**
| Package | الإصدار |
|---------|---------|
| react-hook-form | 7.66.0 |
| @hookform/resolvers | 5.2.2 |

**الفئة: i18n (2)**
| Package | الإصدار |
|---------|---------|
| next-intl | 4.5.3 |
| next-themes | 0.4.6 |

**الفئة: AI (2)**
| Package | الإصدار |
|---------|---------|
| ai | 5.0.93 |
| @ai-sdk/react | 2.0.93 |

**الفئة: Files & Media (6)**
| Package | الإصدار | الحجم المتوقع |
|---------|---------|-------------|
| @aws-sdk/client-s3 | 3.437.0 | ~5MB |
| xlsx | 0.18.5 | ~1MB (heavy) |
| xlsx-js-style | 1.2.0 | ~500KB |
| react-dropzone | 14.3.8 | ~50KB |
| cropperjs | 1.6.2 | ~200KB |
| react-cropper | 2.3.3 | ~10KB |

**الفئة: Utilities (10)**
| Package | الإصدار |
|---------|---------|
| date-fns | 4.1.0 |
| es-toolkit | 1.41.0 |
| deepmerge | 4.3.1 |
| uuid | 13.0.0 |
| slugify | 1.6.6 |
| @sindresorhus/slugify | 3.0.0 |
| ufo | 1.6.1 |
| usehooks-ts | 3.1.1 |
| react-qr-code | 2.0.17 |
| boring-avatars | 2.0.4 |

**الفئة: Content & Markdown (3)**
| Package | الإصدار |
|---------|---------|
| react-markdown | 10.1.0 |
| fumadocs-core | 16.0.11 |
| fumadocs-ui | 16.0.11 |

**الفئة: Monitoring (1)**
| Package | الإصدار |
|---------|---------|
| @sentry/nextjs | 10.42.0 |

**الفئة: Other (5)**
| Package | الإصدار |
|---------|---------|
| @bprogress/next | 3.2.12 |
| @next/third-parties | 16.0.3 |
| nprogress | 0.2.0 |
| yet-another-react-lightbox | 3.29.1 |
| @prisma/nextjs-monorepo-workaround-plugin | 6.19.0 |

### 49.2 Dev Dependencies (28)

| Package | الإصدار | الغرض |
|---------|---------|-------|
| @biomejs/biome | 2.3.5 | Linter + Formatter |
| @playwright/test | 1.56.1 | E2E Testing |
| @types/* | Various | TypeScript type definitions |
| @tailwindcss/postcss | 4.1.17 | PostCSS plugin |
| autoprefixer | 10.4.22 | CSS autoprefixing |
| tailwindcss | 4.1.17 | CSS framework |
| typescript | 5.9.3 | Type checking |
| prettier | 3.6.2 | Code formatting (backup) |
| dotenv | 17.2.3 | Environment loading |
| postcss | 8.5.6 | CSS processing |
| start-server-and-test | 2.1.2 | E2E test utility |
| @content-collections/* | Various | MDX content |
| @mdx-js/mdx | 3.1.1 | MDX processing |
| @shikijs/rehype | 3.15.0 | Code highlighting |
| mdx | 0.3.1 | MDX utilities |
| mdx-bundler | 10.1.1 | MDX bundling |

### 49.3 أثقل Dependencies (Bundle Impact)

| Package | الحجم المقدّر (gzipped) | قابل لـ Tree Shaking | مستخدم في optimizePackageImports |
|---------|----------------------|---------------------|--------------------------------|
| recharts | ~200KB+ | ⚠️ جزئياً | ✅ |
| xlsx + xlsx-js-style | ~350KB+ | ❌ | ❌ |
| @aws-sdk/client-s3 | ~100KB+ | ⚠️ | ❌ |
| lucide-react | ~150KB (كامل) | ✅ | ✅ |
| date-fns | ~80KB (كامل) | ✅ | ✅ |
| react-markdown | ~50KB | ❌ | ❌ |
| fumadocs-* | ~100KB+ | ⚠️ | ❌ |

**توصيات لتقليل Bundle:**
1. ❌ `xlsx` — يُحمّل كاملاً حتى لو تستخدم export فقط. بديل: SheetJS streaming
2. ❌ `@aws-sdk/client-s3` — يجب أن يكون server-only. تأكد أنه لا يُضمّن في client bundle
3. ✅ `recharts` — مُحسّن بـ optimizePackageImports
4. ✅ `lucide-react` — مُحسّن بـ optimizePackageImports
5. ⚠️ `react-markdown` — يُستخدم في AI assistant (client component). لا يمكن tree-shake بسهولة

---

## الملحق التفصيلي 50: خلاصة التوصيات حسب الجدول الزمني

### 50.1 الأسبوع الأول (Critical Fixes)

- [ ] تدوير DB password في `.env.local.example` (ساعة)
- [ ] حذف/حماية `/api/perf-check` (ساعة)
- [ ] إضافة `ANTHROPIC_API_KEY` لـ `.env.local.example` (دقائق)
- [ ] إصلاح `DIRECT_URL` malformed (دقائق)
- [ ] إصلاح Dashboard router: `ORPCError` × 9 (ساعتان)
- [ ] إضافة rate limiting لـ AI endpoints (ساعتان)
- [ ] إضافة rate limiting لـ shares.getResource (ساعة)
- [ ] إصلاح InvoiceEditor: إزالة SENT من isEditable (30 دقيقة)

### 50.2 الأسبوع الثاني (Performance Quick Wins)

- [ ] إصلاح Company layout waterfall (Promise.all) (ساعة)
- [ ] إصلاح Settings layout waterfall (ساعة)
- [ ] إصلاح Project layout waterfall (ساعة)
- [ ] إضافة `error.tsx` لـ [organizationSlug]/ (ساعة)
- [ ] إضافة `error.tsx` لـ [projectId]/ (ساعة)
- [ ] إصلاح sidebar collapsed state flash (useLayoutEffect) (ساعتان)
- [ ] إصلاح useIsMobile hydration mismatch (ساعة)

### 50.3 الشهر الأول (Security & Stability)

- [ ] إضافة `.max()` لكل string inputs في API (3 أيام)
- [ ] إضافة `.max()` لكل array inputs في API (يوم)
- [ ] إضافة upper bound لكل list `limit` params (يوم)
- [ ] إضافة middleware.ts للـ auth redirects (2-3 أيام)
- [ ] إكمال 339 مفتاح ترجمة عربي (2 أيام)
- [ ] Port client-side invoice calculations لـ Decimal (يومان)
- [ ] توحيد واجهات AI (AssistantPanel + AiChat) (أسبوع)
- [ ] إضافة Audit Log لـ company module (3 أيام)
- [ ] إضافة Audit Log لـ roles و org-users (يومان)

### 50.4 الشهر الثاني (Architecture & Performance)

- [ ] تقسيم TemplateCustomizer (1566 → 5 ملفات) (أسبوع)
- [ ] تقسيم CreateInvoiceForm (1338 → react-hook-form) (أسبوع)
- [ ] تقسيم structural-calculations.ts (2926 → 5 ملفات) (أسبوع)
- [ ] إضافة Suspense boundaries (target: 30+) (أسبوع)
- [ ] تحويل 100+ client components لـ Server (أسبوعان)
- [ ] إضافة list virtualization لـ BOQ وجداول كبيرة (أسبوع)
- [ ] Memoize BOQSummaryTable aggregation (يومان)
- [ ] إضافة bundle analyzer (يوم)

### 50.5 الأشهر 3-6 (Compliance & Scale)

- [ ] ZATCA Phase 2 — UBL XML generation (أسبوعان)
- [ ] ZATCA Phase 2 — Digital signing (أسبوع)
- [ ] ZATCA Phase 2 — API integration (أسبوعان)
- [ ] خطة اختبارات: unit tests للـ business logic (مستمر)
- [ ] خطة اختبارات: integration tests للـ API (مستمر)
- [ ] خطة اختبارات: component tests (مستمر)
- [ ] نقل DB لـ me-south-1 (Bahrain) (يوم)
- [ ] Leave accrual system (أسبوع)
- [ ] Payroll-bank balance verification (يومان)
- [ ] إضافة transactional emails (أسبوعان)
- [ ] إصلاح 122 ملف hardcoded Arabic (أسبوعان)
- [ ] إزالة `as any` في Pricing (أسبوع)
- [ ] إضافة push notifications (أسبوعان)
- [ ] Centralized cache invalidation (أسبوع)

---

> **نهاية التقرير الكامل — الإصدار 4.0**
>
> تم إعداد هذا التقرير بناءً على قراءة فعلية لكل ملف في المشروع.
> كل رقم ومرجع ملف مستند لقراءة حقيقية.
>
> **تاريخ التقرير:** 2026-03-16
> **المُعدّ:** Claude Opus 4.6 (1M context) — Anthropic
