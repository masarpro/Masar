# برومبت إصلاح الأداء الشامل لمنصة مسار — Masar Performance Optimization

> **الهدف:** إصلاح جميع مشاكل البطء في منصة مسار بشكل جذري وشامل
> **المشروع:** `masarpro/Masar` — Monorepo (Next.js 16 + React 19 + Prisma + oRPC + Supabase)
> **عدد المراحل:** 9 مراحل متسلسلة
> **الأولوية:** P0 → يجب التنفيذ قبل أي شيء آخر

---

## 🔴 تعليمات عامة مهمة (اقرأها أولاً)

**قبل البدء في أي مرحلة:**
1. شغّل Plan Mode واقرأ كل الملفات المذكورة في المرحلة
2. لا تحذف أي وظيفة (functionality) — فقط أعد هيكلتها لتكون أسرع
3. حافظ على نفس الـ patterns الموجودة: `protectedProcedure`, `organizationId` isolation, `verifyProjectAccess`
4. كل كود جديد يجب أن يكون TypeScript strict مع types واضحة
5. لا تكسر أي شيء — إذا وجدت شيئاً غير واضح، اسأل قبل التعديل
6. اكتب في batches (≤800 سطر لكل عملية كتابة)
7. بعد كل مرحلة، تأكد من `pnpm typecheck` و `pnpm build` يمرّان بنجاح

---

## المرحلة 1: إلغاء التكرار في Layouts + Parallel Data Fetching (الأهم والأخطر)

### المشكلة
4-5 layouts متداخلة تنفذ 8+ استعلامات قاعدة بيانات بشكل تسلسلي (waterfall) عند كل تنقل:
- `getSession()` يُستدعى 3 مرات (مرة في كل layout)
- `getOrganizationList()` يُستدعى مرتين
- `payments.listPurchases()` يُستدعى مرتين
- `db.organization.findUnique()` يُستدعى مرتين
- كل layout ينتظر الـ parent layout يكتمل قبل أن يبدأ → waterfall يستغرق 710ms - 1,700ms

### الملفات المطلوب تعديلها
```
apps/web/app/(saas)/layout.tsx
apps/web/app/(saas)/app/layout.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx
apps/web/app/(saas)/app/(organizations)/layout.tsx
```

### المطلوب

#### الخطوة 1.1: إنشاء طبقة Request-Level Caching
أنشئ ملف جديد:
```
apps/web/lib/cached-queries.ts
```

استخدم `React.cache()` (من React 19) لتغليف كل استعلام يُستدعى أكثر من مرة في الـ layouts. هذا يضمن أن نفس الاستعلام في نفس الـ request يُنفّذ مرة واحدة فقط:

```typescript
import { cache } from "react";
// غلّف كل الاستعلامات المكررة:
// - getSession → cachedGetSession
// - getOrganizationList → cachedGetOrganizationList
// - payments.listPurchases → cachedListPurchases
// - db.organization.findUnique → cachedGetOrganization
```

كل function يجب أن:
- تستخدم `cache()` wrapper من React
- تُصدّر (export) لتُستخدم في كل الـ layouts
- تحافظ على نفس الـ return type الأصلي

#### الخطوة 1.2: تحويل Data Fetching من Sequential إلى Parallel
في كل layout من الـ layouts المذكورة:
1. استبدل كل استدعاء مباشر بالنسخة المُحسّنة من `cached-queries.ts`
2. اجمع كل الاستعلامات المستقلة (التي لا تعتمد على نتيجة بعضها) في `Promise.all()`:

**مثال للتحويل في `(saas)/layout.tsx`:**
```typescript
// ❌ قبل (sequential):
const session = await getSession();
const locale = await getLocale();
const messages = await getMessages();
// prefetchQuery session...
// prefetchQuery organizationList...
// prefetchQuery purchases...

// ✅ بعد (parallel):
const [session, locale, messages] = await Promise.all([
  cachedGetSession(),
  getLocale(),
  getMessages(),
]);
// prefetch queries بشكل parallel أيضاً:
await Promise.all([
  queryClient.prefetchQuery({ queryKey: sessionQueryKey, queryFn: ... }),
  queryClient.prefetchQuery({ queryKey: orgListKey, queryFn: ... }),
  queryClient.prefetchQuery({ queryKey: purchasesKey, queryFn: ... }),
]);
```

#### الخطوة 1.3: تخفيف الـ App Layout
الملف `apps/web/app/(saas)/app/layout.tsx` يقوم بعمليات كثيرة (session + org + billing + redirects).
- انقل عمليات الـ billing checks و organization validation إلى `Promise.all()` واحد
- استخدم `cachedGetSession()` بدلاً من `getSession()` المكرر
- استخدم `cachedGetOrganizationList()` بدلاً من الاستدعاء المكرر

#### الخطوة 1.4: تخفيف الـ Organization Slug Layout
الملف `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx`:
- اجمع كل الاستعلامات في `Promise.all()`:
  - organization findUnique
  - member check
  - purchases check
  - onboarding check
- استخدم النسخ المُحسّنة من `cached-queries.ts`

### التأثير المتوقع
- **توفير 300-600ms** بإلغاء التكرار
- **توفير 200-400ms** بالـ parallel fetching
- **المجموع: تسريع 500ms - 1,000ms لكل تنقل**

### معايير النجاح
- [ ] `getSession()` يُستدعى مرة واحدة فقط في كل request (تحقق بـ console.log مؤقت)
- [ ] لا يوجد sequential await للاستعلامات المستقلة
- [ ] `pnpm typecheck` و `pnpm build` يمرّان بنجاح
- [ ] التنقل بين الصفحات أسرع بشكل ملحوظ

---

## المرحلة 2: إضافة loading.tsx لكل المسارات الرئيسية (Perceived Performance)

### المشكلة
غياب `loading.tsx` يعني أن Next.js لا يعرض UI loading أثناء التحميل. المستخدم يرى الصفحة السابقة "مجمّدة" حتى يكتمل التحميل — يبدو كأن التطبيق معلّق.

### المطلوب
أنشئ `loading.tsx` لكل مجلد من المجلدات التالية. كل loading يجب أن يحتوي على Skeleton مناسب لنوع الصفحة:

#### 2.1 صفحات المشاريع
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/loading.tsx
```
- Skeleton: بطاقات مشاريع (grid من 3-4 skeleton cards)

#### 2.2 صفحة المشروع الداخلية
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/loading.tsx
```
- Skeleton: tabs bar + محتوى skeleton

#### 2.3 الصفحات المالية
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/invoices/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/expenses/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/payments/loading.tsx
```
- Skeleton: جدول بيانات (table skeleton مع 5-8 صفوف وهمية)

#### 2.4 إدارة الشركة
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/employees/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/payroll/loading.tsx
```
- Skeleton: قائمة + جدول

#### 2.5 التسعير والكميات
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/loading.tsx
```
- Skeleton: بطاقات + جدول

#### 2.6 الإعدادات
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/loading.tsx
```
- Skeleton: نموذج إعدادات (form fields skeleton)

#### 2.7 Dashboard الحساب
```
apps/web/app/(saas)/app/(account)/dashboard/loading.tsx
apps/web/app/(saas)/app/(account)/admin/loading.tsx
```
- Skeleton: لوحة تحكم (stats cards + chart areas)

#### 2.8 التنفيذ الميداني
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/field/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/execution/loading.tsx
```
- Skeleton: قائمة تقارير

#### 2.9 صفحات التمويل داخل المشروع
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/loading.tsx
```
- Skeleton: tabs + جدول

### نمط الـ Skeleton المطلوب
استخدم مكونات Skeleton الموجودة في المشروع. إذا لم تكن موجودة، أنشئ مكون `PageSkeleton` عام:

```typescript
// apps/web/modules/shared/components/page-skeleton.tsx
// أنواع: "table" | "cards" | "form" | "dashboard" | "list"
// يستخدم shadcn/ui Skeleton component
// يدعم RTL تلقائياً
```

### معايير النجاح
- [ ] كل مجلد رئيسي يحتوي على `loading.tsx`
- [ ] الـ Skeleton يظهر فوراً عند التنقل (لا شاشة بيضاء أو تجمّد)
- [ ] الـ Skeleton يشبه الصفحة الحقيقية في التخطيط العام

---

## المرحلة 3: تحسين Sidebar + Navigation Performance

### المشكلة 3A: Sidebar يعمل re-render كامل عند كل تنقل
- `useSidebarMenu()` يعتمد على `usePathname()` مما يُعيد حساب 40+ عنصر قائمة عند كل تغيير URL
- Active item detection يفحص كل عنصر ضد pathname الحالي
- لا يوجد memoization فعّال

### المشكلة 3B: Sidebar يستخدم router.push بدلاً من Link
- إذا كان الـ Sidebar يستخدم `onClick → router.push()` بدلاً من `<Link>`, الـ prefetch لا يحدث

### الملفات المطلوب تعديلها
```
apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts
apps/web/modules/saas/shared/components/sidebar/ (كل ملفات الـ sidebar)
```

### المطلوب

#### 3.1: Memoize Sidebar Menu
في `use-sidebar-menu.ts`:
1. لف بناء الـ menu items في `useMemo()` مع dependency فقط على المتغيرات التي تتغير فعلاً (organizationSlug, projectId, permissions)
2. افصل الـ active state detection في hook منفصل خفيف
3. لا تُعيد بناء كل الـ 40+ عنصر لمجرد تغيّر الـ pathname — فقط حدّث الـ active states

```typescript
// ✅ النمط المطلوب:
const menuItems = useMemo(() => buildMenuItems(slug, projectId, permissions, t), [slug, projectId, permissions, t]);
const activeStates = useMemo(() => computeActiveStates(menuItems, pathname), [menuItems, pathname]);
```

#### 3.2: React.memo على SidebarNavItem
إذا كان هناك مكون `SidebarNavItem` أو ما يعادله:
- لفّه بـ `React.memo()` مع `areEqual` function مخصصة
- لا تعيد render العنصر إلا إذا تغيّر `isActive` أو `label` أو `href`

#### 3.3: تحويل Navigation إلى Link Components
- تأكد من أن كل عناصر الـ sidebar تستخدم `<Link href="..." prefetch>` من Next.js
- إذا كان هناك `onClick → router.push()`, استبدله بـ `<Link>`
- أضف `prefetch={true}` على العناصر الأكثر استخداماً (Dashboard, المشاريع, المالية)

#### 3.4: تحسين Navigation Tabs
في ملفات الـ layout tabs (company/layout.tsx, finance/layout.tsx, etc.):
- تأكد من استخدام `<Link>` بدلاً من `onClick + router.push`
- أضف `prefetch` على أول 3 tabs

### التأثير المتوقع
- **توفير 50-100ms** من الـ sidebar re-rendering
- **تحسين 200-300ms** في perceived performance بفضل prefetch
- **تقليل re-renders** بنسبة 60-80%

### معايير النجاح
- [ ] الـ sidebar لا يعمل full re-render عند التنقل (تحقق بـ React DevTools Profiler)
- [ ] كل links في الـ sidebar تستخدم `<Link>` من Next.js
- [ ] `pnpm typecheck` يمرّ بنجاح

---

## المرحلة 4: Dynamic Imports للمكتبات الثقيلة (Bundle Size)

### المشكلة
- Recharts (~200KB) مُستورد مباشرة في client components بدون dynamic import — يُحمّل حتى لو المستخدم لم يزر صفحة Dashboard
- `@ai-sdk/react` (~20KB) مُحمّل في كل layout عبر AssistantProvider حتى لو المستخدم لم يفتح AI chat

### الملفات المطلوب تعديلها
ابحث عن كل ملفات الـ components التي تستورد مباشرة من `recharts`:
```bash
grep -r "from ['\"]recharts['\"]" apps/web/ --include="*.tsx" --include="*.ts" -l
```

وابحث عن كل imports لـ `@ai-sdk/react`:
```bash
grep -r "from ['\"]@ai-sdk/react['\"]" apps/web/ --include="*.tsx" --include="*.ts" -l
```

### المطلوب

#### 4.1: Dynamic Import لكل مكونات Recharts
لكل مكون يستورد من `recharts`:
1. أنشئ wrapper component يستخدم `next/dynamic`:
```typescript
import dynamic from "next/dynamic";
import { Skeleton } from "@/modules/ui/components/skeleton";

const FinanceChart = dynamic(() => import("./FinanceChart"), {
  loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
  ssr: false, // Recharts لا يعمل في SSR
});
```

2. في الملف الأصلي الذي يستورد الـ chart، استبدل الـ import المباشر بالـ dynamic version

#### 4.2: Lazy Load AssistantProvider
الملف الحالي: يُحمّل AssistantProvider في Organization Slug layout ← يُطلق `refreshChats()` عند كل تنقل حتى لو المستخدم لم يفتح AI chat.

المطلوب:
1. انقل تحميل قائمة المحادثات (chats) إلى **lazy loading** — فقط عند فتح AI panel
2. لف AssistantProvider بـ Suspense boundary أو حوّله إلى dynamic import:
```typescript
const AssistantProvider = dynamic(
  () => import("@/modules/saas/ai/components/AssistantProvider"),
  { ssr: false }
);
```
3. الأهم: تأكد أن `refreshChats()` **لا يُستدعى** إلا عندما يفتح المستخدم فعلاً الـ AI panel

#### 4.3: Dynamic Import لـ TanStack Table (اختياري)
إذا كانت هناك صفحات لا تحتوي على جداول لكنها تحمّل `@tanstack/react-table`، ضع الـ table component في dynamic import أيضاً. لكن هذا أقل أولوية — فقط إذا كان هناك صفحات واضحة بدون جداول.

### التأثير المتوقع
- **تقليل initial bundle بـ 200KB+** (Recharts)
- **تقليل 20KB+** من AssistantProvider
- **توفير 100-200ms** في parsing time
- **توفير طلب شبكة واحد** لكل تنقل (chats refresh)

### معايير النجاح
- [ ] Recharts لا يظهر في الـ initial bundle (تحقق من build output)
- [ ] AI chats لا تُجلب عند التنقل بين الصفحات العادية
- [ ] Skeleton يظهر مكان الـ charts أثناء التحميل
- [ ] `pnpm build` يمرّ بنجاح

---

## المرحلة 5: تحسين React Query Cache Configuration

### المشكلة
- `staleTime: 60 * 1000` (60 ثانية) — قصير جداً للبيانات المستقرة
- كل البيانات تصبح "قديمة" بعد دقيقة واحدة ← re-fetch عند العودة للصفحة
- بيانات مثل إعدادات المنظمة والأدوار لا تتغير كل دقيقة
- `refetchOnWindowFocus` ربما مفعّل (default) ← refetch عند العودة للتبويبة

### الملفات المطلوب تعديلها
```
apps/web/modules/shared/lib/query-client.ts
```
وكل الملفات التي تستخدم `useQuery` أو `useSuspenseQuery` لبيانات مستقرة.

### المطلوب

#### 5.1: تحديث الإعدادات الافتراضية
في `query-client.ts`:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 دقائق افتراضي (بدلاً من 60 ثانية)
      gcTime: 10 * 60 * 1000,           // 10 دقائق garbage collection
      retry: false,                      // لا إعادة محاولة (كما هو)
      refetchOnWindowFocus: false,       // لا re-fetch عند العودة للتبويبة
      refetchOnReconnect: true,          // re-fetch عند العودة للإنترنت فقط
    },
  },
});
```

#### 5.2: تعريف staleTime مخصص لكل نوع بيانات
أنشئ ملف ثوابت:
```
apps/web/lib/query-stale-times.ts
```

```typescript
export const STALE_TIMES = {
  // بيانات ثابتة تقريباً — 15 دقيقة
  ORGANIZATION: 15 * 60 * 1000,
  PERMISSIONS: 15 * 60 * 1000,
  ROLES: 15 * 60 * 1000,
  FINANCE_SETTINGS: 15 * 60 * 1000,
  TEMPLATES: 15 * 60 * 1000,

  // بيانات مستقرة — 5 دقائق
  PROJECTS_LIST: 5 * 60 * 1000,
  EMPLOYEES: 5 * 60 * 1000,
  CLIENTS: 5 * 60 * 1000,
  BANKS: 5 * 60 * 1000,
  SUBSCRIPTION: 5 * 60 * 1000,

  // بيانات متغيرة — 2 دقيقة
  PROJECT_DETAILS: 2 * 60 * 1000,
  INVOICES: 2 * 60 * 1000,
  EXPENSES: 2 * 60 * 1000,
  CLAIMS: 2 * 60 * 1000,
  DASHBOARD_STATS: 2 * 60 * 1000,

  // بيانات سريعة التغيير — 30 ثانية
  NOTIFICATIONS: 30 * 1000,
  MESSAGES: 30 * 1000,
  AI_CHATS: 60 * 1000,

  // بيانات حيّة — بدون cache
  REALTIME: 0,
} as const;
```

#### 5.3: تطبيق الـ staleTime على الاستعلامات الموجودة
ابحث عن استعلامات البيانات المستقرة وأضف `staleTime` مخصص:
```bash
grep -r "queryKey.*organization\|queryKey.*roles\|queryKey.*permissions\|queryKey.*settings" apps/web/ --include="*.tsx" --include="*.ts" -l
```

لكل استعلام من هذا النوع، أضف `staleTime` من `STALE_TIMES`:
```typescript
useQuery({
  queryKey: ["organization", slug],
  queryFn: ...,
  staleTime: STALE_TIMES.ORGANIZATION,
});
```

**ملاحظة مهمة:** لا تحتاج تعديل كل الـ 400+ endpoint — فقط الاستعلامات التي تُستدعى بشكل متكرر أثناء التنقل. ركّز على:
- session / organization / permissions / roles (تُستدعى في كل صفحة تقريباً)
- projects list / clients list (تُستدعى كثيراً)
- dashboard stats

### التأثير المتوقع
- **تقليل API calls بنسبة 30-40%**
- **تسريع التنقل** — البيانات المُخبّأة تُعرض فوراً بدون انتظار
- **تقليل الحمل على Supabase**

### معايير النجاح
- [ ] الإعدادات الافتراضية محدّثة في `query-client.ts`
- [ ] ملف `STALE_TIMES` موجود ومُستخدم
- [ ] التنقل بين الصفحات لا يُطلق re-fetch للبيانات المستقرة
- [ ] `pnpm typecheck` يمرّ بنجاح

---

## المرحلة 6: إضافة Pagination للـ Endpoints الحرجة

### المشكلة
كل قوائم `project-field` (تقارير يومية، صور، مشاكل، تحديثات) بدون pagination. مشروع يعمل لمدة سنة = 365 تقرير يومي يُحمّل دفعة واحدة.

### الملفات المطلوب تعديلها
ابحث عن endpoints بدون pagination:
```bash
# في packages/api/modules/ — ابحث عن findMany بدون take/skip:
grep -r "findMany" packages/api/modules/project-field/ --include="*.ts" -l
grep -r "findMany" packages/api/modules/project-timeline/ --include="*.ts" -l
grep -r "findMany" packages/api/modules/company/ --include="*.ts" -l
```

### المطلوب

#### 6.1: إضافة Pagination Schema مشترك
إذا لم يكن موجوداً، أنشئ schema مشترك للـ pagination:
```
packages/api/lib/pagination.ts
```

```typescript
import { z } from "zod";

export const paginationInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createPaginatedResponse = <T>(items: T[], total: number, page: number, pageSize: number) => ({
  items,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    hasMore: page * pageSize < total,
  },
});
```

#### 6.2: تطبيق Pagination على project-field endpoints
هذه هي الـ endpoints الأكثر خطورة:

**التقارير اليومية:**
```
packages/api/modules/project-field/daily-reports/ (list endpoint)
```
- أضف `take` و `skip` بناءً على `page` و `pageSize`
- أضف `orderBy: { reportDate: "desc" }`
- أضف `_count` لإرجاع العدد الإجمالي

**الصور:**
```
packages/api/modules/project-field/photos/ (list endpoint)
```
- أضف pagination مع `pageSize: 20` (الصور أثقل)

**المشاكل:**
```
packages/api/modules/project-field/issues/ (list endpoint)
```
- أضف pagination مع فلترة حسب `status`

**التحديثات:**
```
packages/api/modules/project-field/progress-updates/ (list endpoint)
```
- أضف pagination

#### 6.3: تطبيق Pagination على company endpoints
```
packages/api/modules/company/employees/ (list)
packages/api/modules/company/assets/ (list)
packages/api/modules/company/expenses/ (list)
```

#### 6.4: تطبيق Pagination على project-timeline endpoints
```
packages/api/modules/project-timeline/activities/ (list)
packages/api/modules/project-timeline/milestones/ (list)
```

#### 6.5: تحديث الواجهة (Frontend)
لكل endpoint أضفت له pagination:
1. حدّث الـ `useQuery` ليُرسل `page` و `pageSize`
2. أضف مكون Pagination في أسفل الجدول/القائمة (استخدم مكون Pagination الموجود في المشروع أو أنشئ واحد مشترك)
3. استخدم URL search params لتخزين الصفحة الحالية (`?page=2`)

### التأثير المتوقع
- **منع crashes** عند البيانات الكبيرة
- **تسريع تحميل القوائم** من ثوانٍ إلى مئات الميلي ثانية
- **تقليل حجم البيانات المنقولة** بنسبة 90%+ للمشاريع الكبيرة

### معايير النجاح
- [ ] كل endpoints المذكورة تدعم pagination
- [ ] الواجهة تعرض pagination controls
- [ ] لا يُحمّل أكثر من 20-50 عنصر في المرة الواحدة
- [ ] `pnpm typecheck` و `pnpm build` يمرّان

---

## المرحلة 7: إضافة Database Indexes المفقودة + تحسين Dashboard Queries

### المشكلة A: Indexes مفقودة
7 indexes مفقودة تُبطئ الاستعلامات الشائعة.

### المشكلة B: N+1 في Dashboard
Dashboard يُنفّذ 8 استعلامات منفصلة بدلاً من استعلام مُجمّع.

### الملفات المطلوب تعديلها
```
packages/database/prisma/schema.prisma
packages/api/modules/dashboard/
```

### المطلوب

#### 7.1: إضافة الـ Indexes المفقودة
في `schema.prisma`, أضف الـ indexes التالية:

```prisma
model ProjectDailyReport {
  // ... الحقول الموجودة ...
  @@index([projectId, reportDate])
}

model ProjectMessage {
  // ... الحقول الموجودة ...
  @@index([projectId, channel, createdAt])
}

model Notification {
  // ... الحقول الموجودة ...
  @@index([userId, isRead, createdAt])
}

model ProjectActivity {
  // ... الحقول الموجودة ...
  @@index([projectId, status])
}

model SubcontractPayment {
  // ... الحقول الموجودة ...
  @@index([subcontractContractId, createdAt])
}

model Attachment {
  // ... الحقول الموجودة ...
  @@index([ownerType, ownerId])
}

model Employee {
  // ... الحقول الموجودة ...
  @@index([organizationId, status])
}
```

بعد التعديل:
```bash
pnpm --filter database db:push
```

#### 7.2: تجميع Dashboard Queries
في `packages/api/modules/dashboard/`:
- بدلاً من 8 استعلامات منفصلة (getStats, getProjectDistribution, getTypeDistribution, getFinancialSummary, getUpcoming, getOverdue, getActivities, getFinancialTrend)...
- اجمعها في `Promise.all()` واحد:

```typescript
const [stats, projectDist, typeDist, financeSummary, upcoming, overdue, activities, trend] =
  await Promise.all([
    getStats(organizationId),
    getProjectDistribution(organizationId),
    getTypeDistribution(organizationId),
    getFinancialSummary(organizationId),
    getUpcoming(organizationId),
    getOverdue(organizationId),
    getActivities(organizationId),
    getFinancialTrend(organizationId),
  ]);
```

أو الأفضل: ادمج الاستعلامات المتشابهة في استعلام واحد باستخدام raw SQL أو Prisma groupBy حيث ممكن.

#### 7.3: تحسين استعلام notifications.unreadCount
هذا الاستعلام يُستعلم عنه بشكل متكرر. تأكد من أنه:
1. يستخدم الـ index الجديد `(userId, isRead, createdAt)`
2. يستخدم `count()` فقط (لا يجلب البيانات)
3. على جانب الـ Frontend، يستخدم `staleTime` طويل نسبياً (30 ثانية) مع polling بدلاً من refetch عند كل تنقل

### التأثير المتوقع
- **تسريع 50-100ms** لكل query يستخدم الـ indexes الجديدة
- **تسريع Dashboard** من 500-800ms إلى 100-200ms
- **تسريع إشعارات** بشكل ملحوظ

### معايير النجاح
- [ ] `pnpm --filter database db:push` ينجح بدون أخطاء
- [ ] Dashboard يُحمّل بشكل أسرع ملحوظاً
- [ ] `pnpm typecheck` يمرّ

---

## المرحلة 8: تحسينات UX سريعة (Quick Wins)

### المطلوب

#### 8.1: تقليل Progress Bar Delay
الملف: `apps/web/` — ابحث عن `ProgressProvider` أو `BProgress` أو `delay`
```bash
grep -r "ProgressProvider\|BProgress\|delay.*250" apps/web/ --include="*.tsx" --include="*.ts"
```

غيّر `delay` من 250ms إلى 100ms:
```typescript
<ProgressProvider delay={100} />
```

#### 8.2: إضافة `prefetch` على Sidebar Links الأكثر استخداماً
تأكد من أن الـ links التالية في الـ sidebar تحتوي على `prefetch={true}`:
- Dashboard
- المشاريع
- المالية
- الإعدادات

#### 8.3: تحسين ActiveOrganizationProvider
الملف: `ActiveOrganizationProvider.tsx`
عند تغيير المنظمة، يحدث سلسلة من العمليات المتتابعة. لف العمليات في `startTransition()` من React 19:

```typescript
import { startTransition } from "react";

const handleOrganizationChange = async (orgId: string) => {
  startTransition(async () => {
    await authClient.organization.setActive({ organizationId: orgId });
    await refetchActiveOrganization();
    router.push(`/${newSlug}`);
  });
};
```

#### 8.4: تحسين Image Loading
ابحث عن `<img>` tags عادية واستبدلها بـ `next/image`:
```bash
grep -r "<img " apps/web/modules/ --include="*.tsx" -l
```

لكل `<img>` عادي (ليس inside مكتبة خارجية):
- استبدله بـ `<Image>` من `next/image`
- أضف `width` و `height` أو `fill`
- أضف `loading="lazy"` للصور غير المرئية فوراً

#### 8.5: تحسين تحميل الخطوط العربية
في `apps/web/app/layout.tsx` أو حيث يتم تعريف الخط:
- تأكد من وجود `display: "swap"` في تعريف الخط
- إذا أمكن، استخدم subset للخط العربي

### التأثير المتوقع
- **UX أفضل** — المستخدم يرى feedback فوري
- **تحسين 200-300ms** في perceived performance من prefetch
- **تحسين LCP** من تحسين الصور والخطوط

### معايير النجاح
- [ ] Progress bar يظهر بعد 100ms (لا 250ms)
- [ ] Sidebar links تعمل prefetch
- [ ] لا يوجد `<img>` عادي حيث يمكن استخدام `next/image`
- [ ] `pnpm build` يمرّ

---

## المرحلة 9: تحسين Invoice List + Background Jobs + Connection Pool

### المطلوب

#### 9.1: نقل Invoice OVERDUE Update إلى Background Logic
المشكلة: عند جلب قائمة الفواتير، يتم عمل `updateMany` لتحديث الفواتير المتأخرة (OVERDUE) في نفس الطلب ← يُبطئ كل list call.

الملف: ابحث في `packages/api/modules/finance/invoices/` عن `OVERDUE` update logic.

الحل:
1. انقل الـ OVERDUE update logic إلى middleware أو separate function تعمل بشكل منفصل
2. استخدم approach "lazy update" ذكي: حدّث فقط إذا مرّ أكثر من ساعة منذ آخر تحديث (خزّن آخر وقت تحديث في cache أو DB)
3. أو الأبسط: افصل الـ update عن الـ query — نفّذ الـ update بشكل fire-and-forget بدون انتظار نتيجته:

```typescript
// ✅ لا تنتظر الـ update:
void updateOverdueInvoices(organizationId); // fire-and-forget
const invoices = await getInvoices(organizationId, pagination);
return invoices;
```

#### 9.2: تحسين Connection Pool
تأكد من الإعدادات التالية في `DATABASE_URL`:
```
?pgbouncer=true&connection_limit=5
```

في ملف Prisma client initialization (عادة `packages/database/index.ts`):
- تأكد من وجود `connection_limit=5` (أو الرقم الحالي المناسب)
- تأكد من استخدام `PrismaPg(pool)` مع `max: 5`

#### 9.3: إضافة Keep-Alive Ping (اختياري لكن مفيد)
لمنع cold starts في Vercel Serverless:
- أنشئ endpoint خفيف جداً `/api/health` يعيد `{ status: "ok" }`
- يمكن استخدام خدمة مثل UptimeRobot لعمل ping كل 5 دقائق

### التأثير المتوقع
- **تسريع Invoice list** بـ 50-100ms
- **استقرار أفضل** للـ connection pool
- **تقليل cold starts** مع الـ keep-alive

### معايير النجاح
- [ ] Invoice list لا يُنفّذ `updateMany` في نفس request الـ query
- [ ] Connection pool مُعدّ بشكل صحيح
- [ ] `pnpm build` يمرّ

---

## ملخص التأثير التراكمي المتوقع

| المرحلة | التحسين الرئيسي | التوفير |
|---------|----------------|---------|
| 1 | إلغاء التكرار + Parallel fetching | -500ms إلى -1,000ms |
| 2 | Loading skeletons | UX فوري (perceived) |
| 3 | Sidebar memoization + Link prefetch | -50ms إلى -400ms |
| 4 | Dynamic imports (Recharts + AI) | -200KB bundle, -200ms parsing |
| 5 | React Query staleTime | -30-40% API calls |
| 6 | Pagination | منع crashes + أسرع بكثير |
| 7 | DB Indexes + Dashboard parallel | -50ms إلى -600ms |
| 8 | Quick wins (progress, images, fonts) | -200ms perceived |
| 9 | Invoice + connection pool | -50ms + استقرار |

**النتيجة النهائية المتوقعة:**
- سرعة التنقل: من **1-2 ثانية** إلى **200-500ms**
- Bundle size: **-200KB+**
- API calls: **-30-40%**
- UX: من "جامد ومعلّق" إلى "سريع وسلس"

---

## ملاحظة عن Region Alignment (Vercel ↔ Supabase)

هذا لا يُحلّ بالكود — يحتاج تغيير في الإعدادات:
- **Vercel Deployment Region:** iad1 (Washington)
- **Supabase Region:** ap-south-1 (India)
- **المسافة:** ~14,000 كم ← ~100-200ms latency لكل DB query

**الحل:** نقل Supabase إلى region قريب من Vercel (أو العكس). هذا يحتاج ترقية في Supabase plan. لكنه سيُحسّن كل DB queries بـ 100-200ms تلقائياً — **وهذا وحده يعادل تأثير المراحل 1 و 3 مجتمعتين.**

**إذا أمكن تغيير الـ region، افعل ذلك أولاً قبل كل المراحل أعلاه.**

---

## ترتيب التنفيذ المقترح

```
1. [اختياري] Region Alignment — إذا أمكن
2. المرحلة 1: Layouts (الأهم) ← يوم واحد
3. المرحلة 2: Loading Skeletons ← يومين
4. المرحلة 5: React Query Cache ← ساعتين
5. المرحلة 4: Dynamic Imports ← نصف يوم
6. المرحلة 3: Sidebar ← يوم واحد
7. المرحلة 7: DB Indexes + Dashboard ← يوم واحد
8. المرحلة 8: Quick Wins ← نصف يوم
9. المرحلة 6: Pagination ← يومين
10. المرحلة 9: Invoice + Pool ← نصف يوم
```

**الإجمالي المقدّر: 7-9 أيام عمل**
