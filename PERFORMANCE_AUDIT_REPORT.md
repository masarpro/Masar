# Masar Platform - Performance Audit Report

> تاريخ التدقيق: 2026-02-18
> النسخة: 0.0.0 (monorepo - supastarter-nextjs)
> Next.js: 16.1.0 | React: 19.2.3 | Prisma (client engine) | Tailwind CSS 4.1.17

---

## الملخص التنفيذي

- **درجة الأداء العامة**: 4/10
- **عدد المشاكل الحرجة**: 7
- **عدد المشاكل المتوسطة**: 9
- **عدد التحسينات المقترحة**: 15+
- **السبب الرئيسي للبطء**: غياب كامل لملفات `loading.tsx` + `force-dynamic` على layout الرئيسي + waterfalls في جلب البيانات

---

## 1. نظرة عامة على البنية

### Tech Stack

| Technology | Version | Notes |
| ---------- | ------- | ----- |
| Next.js | 16.1.0 | App Router |
| React | 19.2.3 | |
| TypeScript | 5.9.3 | |
| Prisma | Client engine with PrismaPg adapter | PostgreSQL via Supabase |
| Tailwind CSS | 4.1.17 | CSS-first config (v4) |
| oRPC | 1.13.2 | Type-safe API client |
| TanStack Query | 5.90.9 | Client-side caching |
| better-auth | 1.4.7 | Authentication |
| next-intl | 4.5.3 | i18n (Arabic RTL) |
| recharts | 2.15.4 | Charts (heavy) |
| lucide-react | 0.553.0 | Icons |
| zod | 4.1.12 | Validation |

### Project Structure Map

```text
supastarter-nextjs-3/
├── apps/web/                    # Next.js frontend
│   ├── app/                     # 14 layouts, 100+ pages, 0 loading.tsx, 0 error.tsx
│   │   ├── (marketing)/         # Marketing site with fumadocs
│   │   ├── (saas)/              # Main SaaS app
│   │   │   ├── app/             # Auth gate (force-dynamic!)
│   │   │   │   ├── (organizations)/[slug]/
│   │   │   │   │   ├── finance/
│   │   │   │   │   ├── projects/[projectId]/  # 10 levels deep
│   │   │   │   │   └── settings/
│   │   │   │   └── (account)/
│   │   │   └── owner/[token]/   # Client component layout (!)
│   │   └── auth/
│   └── modules/                 # Feature modules
│       ├── saas/                # Core business logic
│       ├── shared/              # Shared components
│       └── ui/                  # UI primitives
├── packages/
│   ├── api/                     # 30 oRPC router modules, 100+ procedures
│   ├── database/                # Prisma schema (59 models, 79 indexes)
│   ├── auth/                    # better-auth config
│   └── i18n/                    # Translations (ar, en)
```

### Provider Nesting (13 levels!)

```text
<RootLayout>
  <Document>                         # Server - loads 3 Google Fonts
    <html>
      <body>
        <NuqsAdapter>
          <ConsentProvider>
            <ClientProviders>
              <ApiClientProvider>     # 1st instance
                <ProgressProvider>
                  <ThemeProvider>
                    <ApiClientProvider>  # ⚠️ DUPLICATE!
                      <HydrationBoundary>
                        <SessionProvider>
                          <ActiveOrganizationProvider>
                            <ConfirmationAlertProvider>
                              <SidebarProvider>
                                {children}
```

---

## 2. المشاكل الحرجة 🔴

### 2.1 غياب كامل لملفات `loading.tsx` (CRITICAL)

- **الوصف**: لا يوجد ملف `loading.tsx` واحد في كامل المشروع
- **الموقع**: كل مجلدات `app/`
- **التأثير**: عند الانتقال بين الصفحات، لا يظهر أي مؤشر تحميل. المستخدم يرى شاشة مجمدة حتى يكتمل تحميل الصفحة الجديدة بالكامل. هذا هو **السبب الرئيسي رقم 1** للشعور بالبطء.
- **الحل**: إضافة `loading.tsx` في المسارات الحرجة:

```tsx
// apps/web/app/(saas)/app/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
```

```tsx
// apps/web/app/(saas)/app/(organizations)/[organizationSlug]/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center flex-1 py-20">
      <div className="animate-pulse space-y-4 w-full max-w-2xl px-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </div>
  );
}
```

**المسارات التي تحتاج loading.tsx بشكل عاجل:**

1. `app/(saas)/app/loading.tsx` - بوابة المصادقة (6+ عمليات تحقق)
2. `app/(saas)/app/(organizations)/[organizationSlug]/loading.tsx` - تحميل بيانات المنظمة
3. `app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/loading.tsx` - 4 استعلامات قاعدة بيانات متسلسلة
4. `app/(saas)/app/(organizations)/[organizationSlug]/finance/loading.tsx`

- **الأولوية**: حرجة
- **الجهد المقدر**: 2 ساعات

---

### 2.2 `force-dynamic` + `revalidate = 0` على Layout الرئيسي (CRITICAL)

- **الوصف**: ملف `app/(saas)/app/layout.tsx` يفرض التحميل الديناميكي لكل طلب
- **الموقع**: `apps/web/app/(saas)/app/layout.tsx:10-11`

  ```typescript
  export const dynamic = "force-dynamic";
  export const revalidate = 0;
  ```

- **التأثير**: **كل صفحة** داخل التطبيق تُعاد من السيرفر بالكامل في كل طلب. لا يوجد أي تخزين مؤقت. هذا يعني أن 6+ عمليات تحقق تتم في كل تنقل:
  1. `getSession()` - التحقق من الجلسة
  2. `getOrganizationList()` - جلب قائمة المنظمات
  3. `autoCreateOrganizationIfNeeded()` - شرطي
  4. `getOrganizationList()` مرة ثانية (سطر 45) - ⚠️ **استدعاء مكرر**
  5. `orpcClient.payments.listPurchases()` - التحقق من الاشتراك
  6. `createPurchasesHelper()` - معالجة الاشتراك
- **الحل**:
  1. **إزالة `force-dynamic` و `revalidate = 0`** - الدوال تستخدم `cache()` من React بالفعل
  2. **إزالة الاستدعاء المكرر** لـ `getOrganizationList()` في سطر 45
  3. استخدام React `cache()` يكفي لمنع الاستدعاءات المكررة ضمن نفس الطلب
- **الأولوية**: حرجة
- **الجهد المقدر**: 30 دقيقة

---

### 2.3 استعلامات متسلسلة في Project Layout (CRITICAL)

- **الوصف**: 4 استعلامات قاعدة بيانات تتم بشكل متسلسل (waterfall) بدلاً من متوازي
- **الموقع**: `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/layout.tsx:14-48`

  ```typescript
  const session = await getSession();                          // Query 1
  const organization = await getActiveOrganization(slug);      // Query 2 (waits for 1)
  const project = await getProjectById(projectId, org.id);     // Query 3 (waits for 2)
  const projectMemberRole = await getProjectMemberRole(...);   // Query 4 (waits for 1)
  ```

- **التأثير**: كل استعلام ينتظر السابق. إذا كان كل استعلام يأخذ 50-100ms، المجموع 200-400ms **فقط لهذا الـ layout**.
- **الحل**:

  ```typescript
  const session = await getSession();
  const organization = await getActiveOrganization(slug);
  if (!session?.user || !organization) { /* redirect */ }

  // Run remaining queries in parallel
  const [project, projectMemberRole] = await Promise.all([
    getProjectById(projectId, organization.id),
    getProjectMemberRole(projectId, session.user.id),
  ]);
  ```

- **الأولوية**: حرجة
- **الجهد المقدر**: 30 دقيقة

---

### 2.4 ProjectOverview: 6 استعلامات منفصلة + تجميع على العميل (CRITICAL)

- **الوصف**: مكون `ProjectOverview` يجري 6 استعلامات useQuery منفصلة ويقوم بتجميع بيانات ثقيلة على العميل
- **الموقع**: `apps/web/modules/saas/projects/components/ProjectOverview.tsx:78-138`

  ```typescript
  // 6 queries that could be 1-2:
  orpc.projectFinance.getSummary          // Query 1
  orpc.projectField.getTimeline           // Query 2
  orpc.projectField.listPhotos            // Query 3
  orpc.projectFinance.listExpenses        // Query 4 (100 items!)
  orpc.projectFinance.listClaims [PAID]   // Query 5
  orpc.projectFinance.listClaims [pending]// Query 6
  ```

  ثم يقوم بتجميع 100 مصروف لتصنيفات الرسم البياني على العميل (سطر 157-220)
- **التأثير**: 6 طلبات شبكة + معالجة ثقيلة على الموبايل = بطء واضح في تحميل صفحة المشروع
- **الحل**:
  1. إنشاء endpoint واحد `getProjectOverview()` يعيد كل البيانات مجمعة
  2. إنشاء `getProjectExpensesByCategory()` يعيد بيانات مجمعة من السيرفر
  3. إنشاء `getProjectCashFlowByMonth()` بدل جلب 100 مصروف وتجميعها
- **الأولوية**: حرجة
- **الجهد المقدر**: 4-6 ساعات

---

### 2.5 SidebarNav يستخدم `router.push()` بدل `<Link>` (CRITICAL)

- **الوصف**: القائمة الجانبية تستخدم `router.push()` للتنقل بدلاً من مكون `<Link>`
- **الموقع**: `apps/web/modules/saas/shared/components/sidebar/SidebarNav.tsx:76,95-98`

  ```typescript
  const router = useRouter();
  const navigateTo = (href: string) => {
    router.push(href);     // ❌ No prefetching
    setMobileOpen(false);
  };
  ```

- **التأثير**:
  - لا يوجد prefetch للصفحات - كل نقرة تبدأ التحميل من الصفر
  - لا يوجد scroll restoration
  - أقل إمكانية وصول (accessibility)
  - **هذا هو السبب الرئيسي رقم 2** للبطء عند التنقل بين الأقسام
- **الحل**: استبدال `router.push()` بمكون `<Link>` مع إضافة `onClick` لإغلاق القائمة على الموبايل
- **الأولوية**: حرجة
- **الجهد المقدر**: 2 ساعات

---

### 2.6 ApiClientProvider مكرر (HIGH)

- **الوصف**: `ApiClientProvider` مغلف مرتين في `ClientProviders.tsx`
- **الموقع**: `apps/web/modules/shared/components/ClientProviders.tsx:14,29`

  ```tsx
  <ApiClientProvider>       // ← 1st instance
    <ProgressProvider>
      <ThemeProvider>
        <ApiClientProvider> // ← 2nd DUPLICATE!
          {children}
  ```

- **التأثير**: إنشاء `QueryClientProvider` مزدوج - قد يسبب مشاكل في الـ cache والأداء
- **الحل**: إزالة أحد الاثنين (الأول الخارجي)
- **الأولوية**: عالية
- **الجهد المقدر**: 5 دقائق

---

### 2.7 Cropperjs CSS محمل عالمياً (HIGH)

- **الوصف**: CSS مكتبة cropperjs محملة في root layout لكل الصفحات
- **الموقع**: `apps/web/app/layout.tsx:4`

  ```typescript
  import "cropperjs/dist/cropper.css";
  ```

- **التأثير**: ~15KB من CSS يتم تحميلها في كل صفحة، بينما cropperjs مستخدم فقط في صفحة تعديل الصورة
- **الحل**: نقل الاستيراد إلى المكون الذي يستخدمه فقط (`CropImageDialog.tsx`)
- **الأولوية**: عالية
- **الجهد المقدر**: 5 دقائق

---

## 3. مشاكل انتقالات الصفحات (التركيز الرئيسي) 🔴

### تحليل مفصل لسبب البطء في التنقل

عندما يضغط المستخدم على رابط في التطبيق، يحدث التالي:

#### الخطوة 1 - لا يوجد loading.tsx مما يسبب شاشة مجمدة

- لا يظهر أي مؤشر تحميل
- المستخدم يظن أن الضغط لم يعمل
- **الحل**: إضافة `loading.tsx` (القسم 2.1)

#### الخطوة 2 - force-dynamic يجبر إعادة التحميل الكامل

- كل تنقل يمر عبر `app/(saas)/app/layout.tsx` الذي يفرض `force-dynamic`
- 6+ عمليات تحقق تتم في كل طلب
- **الحل**: إزالة `force-dynamic` (القسم 2.2)

#### الخطوة 3 - SidebarNav لا يعمل prefetch

- لأنه يستخدم `router.push()` بدل `<Link>`
- Next.js يعمل prefetch تلقائياً مع `<Link>` ولكن ليس مع `router.push()`
- **الحل**: استبدال بـ `<Link>` (القسم 2.5)

#### الخطوة 4 - استعلامات متسلسلة في Layout

- project layout يجري 4 استعلامات متسلسلة (200-400ms)
- organization layout يجري استعلامات prefetch
- **الحل**: توازي الاستعلامات (القسم 2.3)

#### الخطوة 5 - الصفحة تحمل بيانات إضافية من العميل

- ProjectOverview يجري 6 استعلامات إضافية
- **الحل**: تجميع الاستعلامات (القسم 2.4)

### الترتيب المقترح للإصلاح

1. **أضف loading.tsx** (أثر فوري - المستخدم يرى شيئاً) - 2 ساعات
2. **أزل force-dynamic** - 30 دقيقة
3. **حول SidebarNav لـ Link** - 2 ساعات
4. **وازِ الاستعلامات** - 30 دقيقة
5. **جمّع استعلامات Overview** - 4-6 ساعات

---

## 4. تحليل Client vs Server Components

### ملخص التحليل

- **إجمالي الملفات مع "use client"**: ~289 من ~541 ملف (53%)
- **مبرر**: ~180 ملف (62%)
- **قابل للتحسين**: ~80 ملف (28%)
- **يجب إعادة النظر**: ~29 ملف (10%)

### ملفات "use client" التي لا تحتاجها

| الملف | المشكلة | التوصية |
| ----- | ------- | ------- |
| `owner/[token]/layout.tsx` | Layout كامل كـ client component مع useQuery | تحويل لـ server component مع Suspense |
| `BalanceCards.tsx` | بيانات mock ثابتة | يمكن أن يكون server component |
| `CashFlowCard.tsx` | recharts (ثقيل) محمل مباشرة | dynamic import |

### توصيات Client vs Server

- Layout الـ owner portal (`app/(saas)/owner/[token]/layout.tsx`) يجب تحويله لـ server component
- مكونات العرض البحتة (display-only) يمكن تحويلها لـ server components
- الحدود الصحيحة لـ "use client" موجودة بشكل عام (providers, forms, interactive)

---

## 5. تحليل Data Fetching

### Waterfall Requests المكتشفة

| الموقع | النمط | الأثر |
| ------ | ----- | ----- |
| `ProjectOverview.tsx:78-138` | 6 useQuery متسلسلة | بطء شديد في تحميل Overview |
| `ExpensesList.tsx:116-132` | 2 queries (list + summary) | بطء طفيف |
| `project/[projectId]/layout.tsx:14-48` | 4 DB queries متسلسلة | 200-400ms إضافية |
| `(saas)/app/layout.tsx:20-46` | 6+ checks متسلسلة + استدعاء مكرر | بطء في كل تنقل |

### Caching Gaps

- **لا يوجد `unstable_cache`** في أي ملف
- **لا يوجد `revalidate`** (باستثناء `revalidate = 0` الذي يعطل الكاش!)
- **لا يوجد `React.cache()`** في queries (موجود فقط في auth functions)
- **TanStack Query staleTime**: 60 ثانية (مقبول)
- **نتيجة**: كل طلب يذهب لقاعدة البيانات مباشرة

### N+1 Queries

| الملف | المشكلة | الحل |
| ----- | ------- | ---- |
| `projects.ts:211-232` | `getProjectStats()` يجري 4 count queries منفصلة | استخدام `groupBy(["status"])` واحد |
| `project-finance.ts:16-85` | 5 queries متسلسلة | `Promise.all()` للاستعلامات المستقلة |
| `org-finance.ts:21-28` | `generateBankAccountRef()` يجري 2 queries | دمج في query واحد |

### توصيات Data Fetching

1. إضافة `unstable_cache()` لإحصائيات Dashboard (TTL: 5 دقائق)
2. تحويل `getProjectStats()` لاستخدام `groupBy`
3. تحويل استعلامات `getProjectFinanceSummary()` لاستخدام `Promise.all()`
4. إنشاء endpoints مجمعة لـ ProjectOverview

---

## 6. تحليل Bundle Size

### أكبر Dependencies بالحجم (تقديري)

| المكتبة | الحجم التقريبي | الاستخدام | التحسين |
| ------- | -------------- | --------- | ------- |
| `recharts` | ~200KB | رسوم بيانية في Dashboard/Overview | **dynamic import** |
| `@aws-sdk/client-s3` | ~150KB | رفع ملفات | server-side only |
| `cropperjs` | ~50KB + CSS | قص الصور | **dynamic import + نقل CSS** |
| `fumadocs-ui` + `fumadocs-core` | ~100KB | توثيق (marketing) | route-specific فقط |
| `ai` + `@ai-sdk/react` | ~80KB | Chatbot | **dynamic import** |
| `zod` | ~50KB | validation | tree-shakeable |
| `@radix-ui/*` (12 packages) | ~100KB total | UI primitives | tree-shakeable |
| `react-qr-code` | ~20KB | QR في الفواتير | **dynamic import** |
| `react-cropper` | ~15KB | قص الصور | **dynamic import** |
| `prettier` | ~100KB+ | **لا ينبغي أن يكون dependency!** | نقل لـ devDependencies |

### Dynamic Imports المفقودة

| المكون | المكتبة | التوصية |
| ------ | ------- | ------- |
| `CashFlowCard.tsx` | recharts (Area, AreaChart) | `next/dynamic` |
| `ProjectOverview.tsx` | recharts (PieChart, etc.) | `next/dynamic` |
| `CropImageDialog.tsx` | cropperjs | `next/dynamic` |
| `ProjectChat.tsx` | AI SDK | `next/dynamic` |
| `TemplateEditor.tsx` | Heavy editor | `next/dynamic` |
| `QuotationPreview.tsx` | react-qr-code | `next/dynamic` |

### توصيات Bundle Size

```tsx
// مثال: dynamic import لـ recharts
const CashFlowCard = dynamic(
  () => import("./CashFlowCard").then(mod => ({ default: mod.CashFlowCard })),
  { loading: () => <div className="h-32 animate-pulse bg-muted rounded" /> }
);
```

---

## 7. تحليل Middleware و Auth Flow

### Request Lifecycle Analysis

- **لا يوجد middleware.ts** - جيد، لا overhead إضافي على كل طلب
- المصادقة تتم عبر `getSession()` في layouts مع React `cache()` لمنع الاستدعاءات المكررة

### Auth Check Overhead

| الموقع | العملية | الملاحظة |
| ------ | ------- | ------- |
| `(saas)/layout.tsx:20` | `getSession()` | مع `cache()` |
| `(saas)/app/layout.tsx:14` | `getSession()` | مع `cache()` - يعيد من الكاش |
| `(saas)/app/layout.tsx:20` | Onboarding check | شرطي |
| `(saas)/app/layout.tsx:29,45` | `getOrganizationList()` | **مستدعاة مرتين!** |
| `[organizationSlug]/layout.tsx:20` | `getActiveOrganization()` | مع `cache()` |
| `[projectId]/layout.tsx:14-34` | 4 queries متسلسلة | **waterfall** |

### Auth Configuration

- `disableCookieCache: true` في `getSession()` (سطر 11 في `auth/lib/server.ts`)
  - هذا يجبر التحقق من قاعدة البيانات في كل مرة بدلاً من الكاش
  - **توصية**: تقييم إذا كان ضرورياً - إزالته يسرع الأداء بشكل ملحوظ

### توصيات Auth Flow

1. إزالة الاستدعاء المكرر لـ `getOrganizationList()` في `app/layout.tsx:45`
2. تقييم `disableCookieCache: true` - هل هو ضروري؟
3. توازي استعلامات project layout

---

## 8. تحليل Database و Prisma

### Missing Indexes

| Model | Index المفقود | الاستخدام | الأثر |
| ----- | ------------- | --------- | ----- |
| `ProjectMilestone` | `@@index([organizationId])` | Dashboard stats | full table scan |
| `ProjectMilestone` | `@@index([organizationId, status])` | Status grouping | slow groupBy |
| `ProjectChangeOrder` | `@@index([organizationId])` | Dashboard groupBy | slow aggregate |
| `ProjectClaim` | `@@index([organizationId])` | Dashboard without projectId filter | slow count |
| `ProjectIssue` | `@@index([organizationId])` | Dashboard cross-project | slow join |
| `ProjectExpense` | `@@index([organizationId])` | Standalone org filter | slow filter |
| `ProjectDailyReport` | `@@index([organizationId])` | Org-level digest | slow scan |

### Inefficient Queries

| الملف:السطر | المشكلة | الحل |
| ----------- | ------- | ---- |
| `projects.ts:211-232` | 4 `count()` queries بدل `groupBy` | استخدام `groupBy(["status"])` واحد |
| `project-finance.ts:16-85` | 5 queries متسلسلة | `Promise.all()` |
| `org-finance.ts:21-28` | 2 queries لـ reference generation | دمج |
| `finance.ts:130-137` | `orderBy: "desc"` بدون index | استخدام `_max` aggregate |
| `finance.ts:705-708` | Delete all + recreate items | Differential update |

### Connection Management

- Singleton pattern صحيح في `packages/database/prisma/client.ts`
- PrismaPg adapter مع Supabase pooler
- لا يوجد تحديد لحجم الـ pool (يستخدم defaults)
- DATABASE_URL و DIRECT_URL يشيران لنفس العنوان

### توصيات Database

1. إضافة 7 indexes المفقودة (migration واحد)
2. تحويل `getProjectStats()` لـ `groupBy`
3. إضافة `Promise.all()` في `getProjectFinanceSummary()`
4. فصل DIRECT_URL عن DATABASE_URL (DIRECT_URL للـ migrations)

---

## 9. تحليل CSS و Assets

### CSS Bundle

- **Tailwind CSS v4** (CSS-first) - جيد
- **globals.css**: 224 سطر - مقبول
- **Imports**: 5 CSS imports (tailwindcss, fumadocs x2, theme, animations)
- **Print styles**: ~120 سطر في globals.css - يمكن نقلها لملف منفصل

### Font Loading Strategy

| الخط | الأسلوب | الحجم | الملاحظة |
| ---- | ------- | ----- | ------- |
| Inter | `next/font/google` | 4 weights | صحيح |
| Libre Baskerville | `next/font/google` | 2 weights | صحيح |
| Cairo (Arabic) | `next/font/google` | 4 weights | صحيح |
| Saudi Riyal Symbol | **External CDN link** | Unknown | يجب self-host |

- **الموقع**: `apps/web/modules/shared/components/Document.tsx:51-55`

  ```html
  <link rel="stylesheet" href="https://unpkg.com/saudi-riyal-symbol@latest/dist/saudi-riyal-symbol.min.css" />
  ```

- **المشكلة**: External CSS من CDN يحجب الرندر (render-blocking)
- **الحل**: تحميل الخط محلياً أو استخدام `@next/third-parties`

### Image Optimization

- **next/image**: مستخدم في ~20 ملف
- **Raw `<img>`**: مستخدم في ~20 ملف
- **التوصية**: تحويل `<img>` لـ `next/image` حيث أمكن

### Icons

- `lucide-react` - يستورد أيقونات فردية (tree-shakeable)
- لا يوجد استيراد للمكتبة كاملة

---

## 10. خارطة طريق التحسين

### Phase 1 - Quick Wins (يوم واحد)

| # | المهمة | الملف | الأثر المتوقع |
| --- | ------ | ----- | ------------- |
| 1 | إضافة `loading.tsx` للمسارات الرئيسية (4 ملفات) | `app/` dirs | **فوري** - المستخدم يرى تحميل |
| 2 | إزالة `force-dynamic` و `revalidate = 0` | `app/(saas)/app/layout.tsx` | **كبير** - تفعيل caching |
| 3 | إزالة `getOrganizationList()` المكرر | `app/(saas)/app/layout.tsx:45` | صغير |
| 4 | إزالة `ApiClientProvider` المكرر | `ClientProviders.tsx:14` | صغير |
| 5 | نقل `cropperjs/dist/cropper.css` | `app/layout.tsx:4` → component | -15KB CSS عالمي |
| 6 | Self-host Saudi Riyal font | `Document.tsx:51-55` | إزالة render-blocking |
| 7 | نقل `prettier` لـ devDependencies | `apps/web/package.json` | -100KB+ من bundle |

### Phase 2 - Core Fixes (3-5 أيام)

| # | المهمة | الأثر المتوقع |
| --- | ------ | ------------- |
| 8 | تحويل SidebarNav لاستخدام `<Link>` | **كبير** - prefetching للصفحات |
| 9 | توازي استعلامات project layout | -200ms per navigation |
| 10 | إنشاء `getProjectOverview()` endpoint مجمع | -500ms على صفحة المشروع |
| 11 | تحويل `getProjectStats()` لـ `groupBy` | -3 DB queries |
| 12 | إضافة `Promise.all()` في `getProjectFinanceSummary()` | -100ms |
| 13 | Dynamic import لـ recharts | -200KB JS |
| 14 | Dynamic import لـ cropperjs, react-qr-code | -70KB JS |
| 15 | إضافة `error.tsx` للمسارات الرئيسية | تحسين UX عند الأخطاء |

### Phase 3 - Architecture (1-2 أسبوع)

| # | المهمة | الأثر المتوقع |
| --- | ------ | ------------- |
| 16 | إضافة 7 missing database indexes | 30-50% أسرع في Dashboard |
| 17 | إضافة `unstable_cache()` لـ dashboard stats | تقليل DB load |
| 18 | تحويل owner portal layout لـ server component | تقليل JS bundle |
| 19 | إنشاء endpoints مجمعة (cash flow, category breakdown) | تقليل network requests |
| 20 | تقييم `disableCookieCache` في auth | تسريع auth check |

### Phase 4 - Advanced (مستمر)

| # | المهمة | الأثر المتوقع |
| --- | ------ | ------------- |
| 21 | Service Worker للتخزين المؤقت (PWA) | أداء أفضل على الموبايل في الميدان |
| 22 | Streaming SSR مع Suspense boundaries | تحميل تدريجي |
| 23 | Route-based code splitting | تقليل initial JS |
| 24 | Database query monitoring | كشف slow queries |
| 25 | Image optimization audit (convert img → next/image) | تقليل data transfer |

---

## 11. الأداء المتوقع بعد التحسين

### Before vs After Estimates

| المقياس | الحالي (تقديري) | بعد Phase 1 | بعد Phase 2 | بعد Phase 3 |
| ------- | --------------- | ----------- | ----------- | ----------- |
| **Page Transition (perceived)** | 2-5s (frozen) | 0.3s (loading indicator) | 0.5-1s (with prefetch) | 0.3-0.8s |
| **TTFB (SaaS pages)** | 800-1500ms | 400-800ms | 300-600ms | 200-400ms |
| **LCP** | 3-5s | 2-3s | 1.5-2.5s | 1-2s |
| **JS Bundle (main)** | ~500KB+ | ~385KB | ~300KB | ~280KB |
| **DB Queries per navigation** | 10-15 | 8-10 | 5-7 | 3-5 |
| **Network Requests (Overview)** | 6+ | 6 | 1-2 | 1-2 |

### Target Metrics

- **LCP**: < 2.5s (Currently: 3-5s)
- **FID/INP**: < 200ms (likely OK)
- **CLS**: < 0.1 (likely OK)
- **TTFB**: < 600ms (Currently: 800-1500ms)
- **Page Transition Time**: < 1s perceived (Currently: 2-5s)

---

## 12. ملاحق

### A - قائمة كاملة بكل الملفات التي تحتاج تعديل

**Phase 1 (Quick Wins):**

1. `apps/web/app/(saas)/app/loading.tsx` - **إنشاء جديد**
2. `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/loading.tsx` - **إنشاء جديد**
3. `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/loading.tsx` - **إنشاء جديد**
4. `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/loading.tsx` - **إنشاء جديد**
5. `apps/web/app/(saas)/app/layout.tsx` - إزالة `force-dynamic` + `revalidate = 0` + استدعاء مكرر
6. `apps/web/modules/shared/components/ClientProviders.tsx` - إزالة `ApiClientProvider` المكرر
7. `apps/web/app/layout.tsx` - إزالة `import "cropperjs/dist/cropper.css"`
8. `apps/web/modules/saas/settings/components/CropImageDialog.tsx` - إضافة `import "cropperjs/dist/cropper.css"`
9. `apps/web/modules/shared/components/Document.tsx` - self-host Saudi Riyal font
10. `apps/web/package.json` - نقل `prettier` لـ devDependencies

**Phase 2 (Core Fixes):**

1. `apps/web/modules/saas/shared/components/sidebar/SidebarNav.tsx` - تحويل لـ `<Link>`
2. `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/layout.tsx` - `Promise.all()`
3. `packages/api/modules/project-finance/` - إنشاء `getProjectOverview` endpoint
4. `packages/database/prisma/queries/projects.ts` - تحويل `getProjectStats` لـ `groupBy`
5. `packages/database/prisma/queries/project-finance.ts` - `Promise.all()`
6. `apps/web/modules/saas/projects/components/ProjectOverview.tsx` - استخدام endpoint مجمع
7. `apps/web/modules/saas/finance/components/dashboard/CashFlowCard.tsx` - dynamic import
8. `apps/web/app/(saas)/app/error.tsx` - **إنشاء جديد**

**Phase 3 (Architecture):**

1. `packages/database/prisma/schema.prisma` - إضافة 7 indexes
2. `packages/database/prisma/queries/dashboard.ts` - تحسين queries
3. `apps/web/app/(saas)/owner/[token]/layout.tsx` - تحويل لـ server component

### B - أوامر مفيدة للقياس والمراقبة

```bash
# Build analysis
npx next build

# Bundle analysis (install first)
ANALYZE=true npx next build

# Lighthouse CLI
npx lighthouse http://localhost:3000/app --output json --output-path ./lighthouse-report.json

# Prisma query logging (add to .env)
# DATABASE_URL="...?log=query"
```

### C - إعدادات Next.js المثلى المقترحة

```typescript
// next.config.ts - additions
const nextConfig: NextConfig = {
  // ... existing config
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "recharts",
      "date-fns",
    ],
  },
  // If not using middleware, explicitly disable it
  // This prevents Next.js from checking for it on every request
};
```

### D - Prisma Optimization Checklist

- [ ] إضافة 7 indexes المفقودة
- [ ] تحويل `getProjectStats()` لـ `groupBy`
- [ ] إضافة `Promise.all()` في `getProjectFinanceSummary()`
- [ ] تحسين number generation queries (استخدام `_max` aggregate)
- [ ] فصل DIRECT_URL عن DATABASE_URL
- [ ] إضافة Prisma query logging في development
- [ ] مراقبة slow queries عبر Supabase dashboard
- [ ] تقييم إضافة composite indexes للفلاتر المركبة
