# 🔧 برومبت إصلاح مشاكل P0 + P1 — منصة مسار

> **تعليمات:** هذا البرومبت مُقسّم إلى 8 مراحل. نفّذ كل مرحلة بالترتيب. استخدم Plan Mode أولاً لتحليل الملفات المذكورة قبل أي تعديل. بعد كل مرحلة، أكد الانتهاء وانتقل للمرحلة التالية.

---

## المرحلة 1: إصلاح Waterfall Data Fetching في Layouts (P0 — الأخطر)

### المشكلة
4-5 layouts متداخلة تنفذ 8+ استعلامات بشكل تسلسلي (waterfall). `getSession()` يُستدعى 3 مرات في سلسلة واحدة. كل تنقل يستغرق 700ms-1.7s فقط في data fetching.

### الملفات المستهدفة
```
apps/web/app/(saas)/layout.tsx
apps/web/app/(saas)/app/layout.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx
apps/web/app/(saas)/app/(organizations)/layout.tsx
```

### المطلوب

#### 1.1 — إنشاء cached getSession باستخدام React `cache()`
```
الملف: apps/web/lib/cached-session.ts (ملف جديد)
```

أنشئ ملف `cached-session.ts` يستخدم `React.cache()` من React 19 لعمل request-level deduplication لـ `getSession()`:

```typescript
import { cache } from "react";
import { auth } from "@repo/auth"; // أو المسار الفعلي لـ auth

// cache() يضمن استدعاء واحد فقط لكل request
export const getCachedSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});
```

- **ابحث أولاً** عن كيف يتم استدعاء `getSession()` حالياً في كل layout. قد يكون عبر `auth.api.getSession` أو `getSession` من `@repo/auth` أو أي import آخر.
- استبدل **كل** استدعاءات `getSession()` في الـ 4 layouts بـ `getCachedSession()`.
- هذا وحده سيوفر 100-400ms لكل تنقل.

#### 1.2 — تحويل الاستعلامات التسلسلية إلى متوازية بـ `Promise.all()`

في كل layout، حوّل الاستعلامات من تسلسلية إلى متوازية. مثال:

**قبل (waterfall):**
```typescript
const session = await getSession();
const orgList = await getOrganizationList();
const purchases = await listPurchases();
```

**بعد (parallel):**
```typescript
const [session, orgList, purchases] = await Promise.all([
  getCachedSession(),
  getOrganizationList(),
  listPurchases(),
]);
```

- **مهم:** بعض الاستعلامات تعتمد على نتيجة استعلام سابق (مثلاً `orgList` يحتاج `session.userId`). في هذه الحالة، اجعل المجموعة المستقلة متوازية، ثم المجموعة المعتمدة متوازية بعدها:

```typescript
const session = await getCachedSession();
// هذه مستقلة عن بعض — نفذها معاً
const [orgList, purchases, member] = await Promise.all([
  getOrganizationList(session.user.id),
  listPurchases(session.organizationId),
  getMember(session.user.id, session.organizationId),
]);
```

#### 1.3 — إزالة الاستدعاءات المكررة عبر Layouts

ابحث عن هذه الاستدعاءات المكررة وأزل التكرار:

| الاستدعاء | مكان التكرار | الحل |
|-----------|-------------|------|
| `getSession()` | 3 layouts | استخدم `getCachedSession()` — `cache()` يضمن استدعاء واحد |
| `getOrganizationList()` | SaaS layout + App layout | استدعِ مرة واحدة في أعلى layout وغلّفه بـ `cache()` أيضاً |
| `payments.listPurchases()` | App layout + Org layout | نفس الحل — `cache()` wrapper |
| `db.organization.findUnique()` | Org validation + billing | نفس الحل |

أنشئ cached wrappers لكل دالة مكررة في نفس الملف `cached-session.ts` أو ملف منفصل `apps/web/lib/cached-queries.ts`.

#### 1.4 — إضافة ملفات `loading.tsx`

أنشئ ملف `loading.tsx` لكل مجلد رئيسي. كل ملف يعرض skeleton/spinner مناسب:

```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/loading.tsx
```

محتوى كل `loading.tsx`:
```typescript
import { Skeleton } from "@/modules/ui/components/skeleton"; // تحقق من المسار الفعلي

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
```

- ابحث عن مكون `Skeleton` الموجود في المشروع واستخدمه.
- إذا لم يكن موجوداً، أنشئه كمكون بسيط بـ Tailwind.

### معايير النجاح — المرحلة 1
- [ ] `getSession()` يُستدعى مرة واحدة فقط لكل request (عبر `cache()`)
- [ ] لا توجد استدعاءات تسلسلية يمكن تحويلها لمتوازية
- [ ] ملفات `loading.tsx` موجودة في 7+ مجلدات رئيسية
- [ ] `pnpm type-check` يمر بنجاح
- [ ] `pnpm build` يمر بنجاح

---

## المرحلة 2: إضافة Pagination على Endpoints الحرجة (P0)

### المشكلة
endpoints في `project-field`, `project-timeline`, و `company` تُرجع كل السجلات دفعة واحدة بدون pagination. مشروع يعمل لسنة = 365 تقرير يومي يُحمّل دفعة واحدة.

### الملفات المستهدفة
```
packages/api/modules/project-field/   (listDailyReports, listPhotos, listIssues)
packages/api/modules/project-timeline/  (listMilestones, listActivities)
packages/api/modules/company/  (employees, assets, expenses)
```

### المطلوب

#### 2.1 — إنشاء Pagination Schema مشترك

ابحث أولاً عن أي pagination schema موجود في المشروع (من المحتمل أن بعض الـ endpoints تستخدمه بالفعل). ابحث في:
```
packages/api/lib/
packages/api/shared/
packages/database/
```

إذا لم يكن موجوداً، أنشئ:
```
الملف: packages/api/lib/pagination.ts (أو المسار المناسب)
```

```typescript
import { z } from "zod";

export const paginationInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
) => ({
  items,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    hasMore: page * pageSize < total,
  },
});

export type PaginationInput = z.infer<typeof paginationInput>;
```

#### 2.2 — تطبيق Pagination على Endpoints الحرجة

لكل endpoint من هذه القائمة:

**project-field module:**
- `listDailyReports`
- `listPhotos`
- `listIssues`

**project-timeline module:**
- `listMilestones`
- `listActivities`

**company module:**
- قوائم الموظفين، الأصول، المصروفات

**الخطوات لكل endpoint:**

1. أضف `paginationInput` إلى الـ input schema عبر `.merge()` أو `.extend()`:
```typescript
.input(
  existingSchema.merge(paginationInput)
)
```

2. عدّل الـ Prisma query لتستخدم `skip` و `take`:
```typescript
const { page, pageSize, ...filters } = input;
const skip = (page - 1) * pageSize;

const [items, total] = await Promise.all([
  ctx.db.dailyReport.findMany({
    where: { projectId: input.projectId, organizationId: ctx.session.organizationId },
    skip,
    take: pageSize,
    orderBy: { date: "desc" },
  }),
  ctx.db.dailyReport.count({
    where: { projectId: input.projectId, organizationId: ctx.session.organizationId },
  }),
]);

return createPaginatedResponse(items, total, page, pageSize);
```

3. **مهم:** استخدم `Promise.all` لتشغيل `findMany` و `count` بالتوازي.

#### 2.3 — تحديث Frontend لدعم Pagination

لكل صفحة frontend تعرض هذه البيانات:
- ابحث عن مكون `DataTable` أو جدول البيانات المُستخدم.
- من المحتمل أن TanStack Table مع pagination موجود بالفعل في بعض الصفحات — اتبع نفس النمط.
- أضف `page` و `pageSize` كـ URL search params باستخدام `useSearchParams`.
- أضف مكون pagination في أسفل الجدول.

ابحث عن مكونات pagination أو DataTable موجودة:
```
apps/web/modules/shared/components/data-table/
apps/web/modules/ui/components/pagination/
```

### معايير النجاح — المرحلة 2
- [ ] كل endpoints المذكورة تقبل `page` و `pageSize`
- [ ] كل endpoint يُرجع `{ items, pagination: { page, pageSize, total, totalPages, hasMore } }`
- [ ] Frontend يعرض pagination controls
- [ ] `pnpm type-check` يمر بنجاح

---

## المرحلة 3: إزالة `unsafe-eval` من CSP في Production (P0)

### المشكلة
CSP يحتوي `'unsafe-eval'` و `'unsafe-inline'` في `script-src` مما يفتح باب XSS.

### الملف المستهدف
```
apps/web/next.config.ts
```

### المطلوب

#### 3.1 — تعديل CSP ليكون مختلفاً بين Development و Production

ابحث في `apps/web/next.config.ts` عن تعريف الـ Content-Security-Policy header. عادةً يكون ضمن `headers()` function.

عدّله ليستخدم `unsafe-eval` فقط في development:

```typescript
const isDev = process.env.NODE_ENV === "development";

const cspHeader = [
  `default-src 'self'`,
  `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : " 'unsafe-inline'"}`,
  // 'unsafe-inline' مطلوب لـ Next.js — لا يمكن إزالته حالياً بدون nonce
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' https: data: blob: https://*.supabase.co`,
  `connect-src 'self' blob: https://*.supabase.co https://api.anthropic.com`,
  `frame-src 'self' https://*.supabase.co https://docs.google.com blob:`,
  `font-src 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");
```

#### 3.2 — إضافة Security Headers المفقودة

في نفس الملف، أضف هذه headers إذا لم تكن موجودة:

```typescript
{
  key: "Cross-Origin-Opener-Policy",
  value: "same-origin",
},
{
  key: "Cross-Origin-Resource-Policy",
  value: "same-origin",
},
{
  key: "X-Permitted-Cross-Domain-Policies",
  value: "none",
},
```

#### 3.3 — تأكد من أن التطبيق يعمل بدون `unsafe-eval`

بعد التعديل، شغّل:
```bash
pnpm build
```

إذا ظهرت أخطاء متعلقة بـ `eval()` في production build، قد تحتاج إلى:
- التحقق من أي مكتبة تستخدم `eval()` runtime
- البحث عن `eval(` و `new Function(` في الكود
- إضافة `'wasm-unsafe-eval'` إذا كانت مطلوبة لـ WebAssembly فقط

### معايير النجاح — المرحلة 3
- [ ] CSP في production لا يحتوي `'unsafe-eval'`
- [ ] Security headers الإضافية مُضافة
- [ ] `pnpm build` يمر بنجاح
- [ ] لا أخطاء CSP في browser console عند فتح التطبيق

---

## المرحلة 4: إضافة Rate Limiting على Auth Endpoints (P0)

### المشكلة
endpoints المصادقة (`/api/auth/sign-in/email`, `/api/auth/forgot-password`, `/api/auth/magic-link/send`) تمر عبر BetterAuth مباشرة بدون rate limiting. مهاجم يمكنه تنفيذ brute force attack.

### الملف المستهدف
```
packages/api/index.ts  (أو الملف الذي يُعرّف فيه Hono app ويربط BetterAuth)
```

### المطلوب

#### 4.1 — إضافة Rate Limiting Middleware على Auth Routes

ابحث أولاً عن:
1. أين يتم تعريف `app` (Hono instance) — عادةً في `packages/api/index.ts`
2. أين يتم ربط BetterAuth handler — ابحث عن `/api/auth`
3. أين تم تعريف `rateLimit` function — ابحث في `packages/api/lib/rate-limit` أو مسار مشابه

ثم أضف middleware **قبل** BetterAuth handler:

```typescript
// Rate limiting middleware لـ auth endpoints
// أضف هذا قبل app.on(["GET", "POST"], "/api/auth/**", ...) أو app.route("/api/auth", ...)

const AUTH_RATE_LIMITS: Record<string, { maxRequests: number; window: number }> = {
  "/api/auth/sign-in": { maxRequests: 10, window: 60 }, // 10 محاولات/دقيقة
  "/api/auth/forgot-password": { maxRequests: 5, window: 60 }, // 5 طلبات/دقيقة
  "/api/auth/magic-link": { maxRequests: 5, window: 60 },
  "/api/auth/sign-up": { maxRequests: 5, window: 60 },
};

app.use("/api/auth/*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  
  // ابحث عن أقرب match
  const matchedRule = Object.entries(AUTH_RATE_LIMITS).find(([prefix]) =>
    path.startsWith(prefix)
  );
  
  if (matchedRule) {
    const [, limits] = matchedRule;
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `auth-rl:${ip}:${path}`;
    
    // استخدم نفس دالة rateLimit الموجودة في المشروع
    const result = await rateLimit({
      key,
      preset: "STRICT", // 5/min — أو استخدم custom limits
    });
    
    if (!result.allowed) {
      return c.json(
        { error: "Too many requests. Please try again later." },
        429,
      );
    }
  }
  
  return next();
});
```

- **مهم:** ابحث عن الـ `rateLimit` function الموجودة وتوقيعها الفعلي. قد يختلف عن المثال أعلاه.
- ابحث عن الملف: `packages/api/lib/rate-limit.ts` أو `packages/api/middleware/rate-limit.ts`
- استخدم الـ preset `STRICT` الموجود (5 req/min) أو عدّل حسب الحاجة.

#### 4.2 — إضافة Rate Limiting لـ Activation Codes

ابحث عن endpoint `activation-codes.validate` وأضف rate limiting عليه لمنع code enumeration:

```
packages/api/modules/activation-codes/  (أو المسار الفعلي)
```

أضف `STRICT` rate limit (5/min per IP) على endpoint الـ validate.

### معايير النجاح — المرحلة 4
- [ ] `/api/auth/sign-in/*` محمي بـ rate limit (10/min per IP)
- [ ] `/api/auth/forgot-password` محمي بـ rate limit (5/min per IP)
- [ ] `/api/auth/magic-link/*` محمي بـ rate limit (5/min per IP)
- [ ] `/api/auth/sign-up/*` محمي بـ rate limit (5/min per IP)
- [ ] يُرجع HTTP 429 عند تجاوز الحد
- [ ] `pnpm type-check` يمر بنجاح

---

## المرحلة 5: أمان بوابة المالك — Session-Based Auth (P1)

### المشكلة
Token بوابة المالك ظاهر في URL ويُسجّل في browser history و server logs و referrer headers. إذا تسرّب، أي شخص يمكنه الوصول. لا يوجد expiry enforcement فعّال.

### الملفات المستهدفة
```
packages/api/modules/project-owner/    (كل ملفات الـ module)
apps/web/app/owner/[token]/            (كل صفحات بوابة المالك)
```

### المطلوب

#### 5.1 — إضافة Token Exchange Endpoint

أنشئ endpoint جديد يستبدل الـ URL token بـ session cookie:

```
الملف: packages/api/modules/project-owner/router.ts (أو الملف المناسب)
```

```typescript
// POST /api/rpc/owner-portal.exchangeToken
exchangeToken: publicProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ input, ctx }) => {
    // 1. تحقق من Token الأصلي
    const portalAccess = await ctx.db.ownerPortalAccess.findUnique({
      where: { token: input.token },
      include: { project: true },
    });
    
    if (!portalAccess) throw new TRPCError({ code: "NOT_FOUND" });
    
    // 2. تحقق من الصلاحية (expiry)
    if (portalAccess.expiresAt && portalAccess.expiresAt < new Date()) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Token expired" });
    }
    
    // 3. أنشئ session token مؤقت (صالح لمدة ساعة واحدة، يتجدد)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة
    
    await ctx.db.ownerPortalSession.create({
      data: {
        sessionToken,
        portalAccessId: portalAccess.id,
        expiresAt,
        ipAddress: ctx.req?.header("x-forwarded-for") || null,
        userAgent: ctx.req?.header("user-agent") || null,
      },
    });
    
    // 4. أرجع session token (سيُخزّن في httpOnly cookie من Frontend)
    return { sessionToken, expiresAt };
  }),
```

#### 5.2 — إضافة OwnerPortalSession Model

```
الملف: packages/database/prisma/schema.prisma
```

أضف model جديد:
```prisma
model OwnerPortalSession {
  id              String   @id @default(cuid())
  sessionToken    String   @unique
  portalAccessId  String
  portalAccess    OwnerPortalAccess @relation(fields: [portalAccessId], references: [id], onDelete: Cascade)
  expiresAt       DateTime
  ipAddress       String?
  userAgent       String?
  lastAccessedAt  DateTime @default(now())
  createdAt       DateTime @default(now())

  @@index([portalAccessId])
  @@index([expiresAt])
}
```

- أضف relation في `OwnerPortalAccess`:
```prisma
sessions OwnerPortalSession[]
```

- شغّل: `pnpm --filter database db:push`

#### 5.3 — تعديل صفحة بوابة المالك Landing

```
الملف: apps/web/app/owner/[token]/layout.tsx أو page.tsx
```

عدّل أول زيارة بـ token لتعمل كالتالي:
1. عند الوصول بـ URL token → اتصل بـ `exchangeToken` API
2. خزّن الـ session token في httpOnly cookie
3. حوّل (redirect) إلى `/owner/portal` (بدون token في URL)
4. كل الطلبات اللاحقة تستخدم session cookie بدل URL token

#### 5.4 — إضافة Expiry Enforcement

عدّل كل الـ owner portal endpoints لتتحقق من:
1. صلاحية الـ session token (ليس فقط الـ URL token)
2. `expiresAt` على الـ `OwnerPortalAccess` — إذا انتهى، ارفض الطلب
3. حدّث `lastAccessedAt` عند كل طلب ناجح

### معايير النجاح — المرحلة 5
- [ ] Token يظهر في URL فقط عند أول زيارة، ثم يُستبدل بـ session cookie
- [ ] OwnerPortalSession model موجود في DB
- [ ] Session تنتهي بعد ساعة من عدم الاستخدام
- [ ] Token منتهي الصلاحية يُرجع خطأ واضح
- [ ] `pnpm --filter database db:push` يمر بنجاح
- [ ] `pnpm type-check` يمر بنجاح

---

## المرحلة 6: إصلاحات أمنية إضافية (P1)

### 6.1 — إضافة Expiry لروابط المشاركة (Share Links)

```
الملفات:
packages/api/modules/*/  (ابحث عن share link creation endpoints)
apps/web/app/share/[token]/
```

- ابحث عن endpoints إنشاء share links في كل الـ modules.
- أضف `expiresAt` بقيمة افتراضية 7 أيام.
- عدّل endpoint عرض الـ share link للتحقق من `expiresAt`.
- إذا انتهت الصلاحية، اعرض رسالة "انتهت صلاحية هذا الرابط".

### 6.2 — توسيع Invitation Plugin Scope

```
الملف: packages/auth/plugins/invitation-only/index.ts
```

- ابحث عن الـ matcher/path filter الحالي — حالياً يحظر `/sign-up/email` فقط.
- وسّعه ليشمل كل مسارات إنشاء الحسابات:

```typescript
// قبل — يحظر مسار واحد فقط
const blockedPaths = ["/sign-up/email"];

// بعد — يحظر كل مسارات التسجيل
const blockedPaths = [
  "/sign-up/email",
  "/sign-up/magic-link",
  // أي مسار آخر يسمح بإنشاء حساب جديد
];
```

- **مهم:** تحقق كيف يتعامل BetterAuth مع OAuth first-time login (Google OAuth). إذا كان يُنشئ حساب تلقائياً عند أول تسجيل دخول بـ Google، تأكد أن الـ plugin يتعامل مع هذا السيناريو أيضاً.

### 6.3 — تقليل `freshAge` في BetterAuth

```
الملف: packages/auth/auth.ts
```

غيّر `freshAge` من 300 (5 دقائق) إلى 60 (دقيقة واحدة):
```typescript
freshAge: 60, // كان 300
```

### معايير النجاح — المرحلة 6
- [ ] Share links لها expiry افتراضي (7 أيام)
- [ ] Invitation plugin يحظر كل مسارات التسجيل
- [ ] `freshAge` = 60 ثانية
- [ ] `pnpm type-check` يمر بنجاح

---

## المرحلة 7: تحسينات الأداء (P1)

### 7.1 — Dynamic Import لـ Recharts

ابحث عن كل الملفات التي تستورد `recharts`:
```bash
grep -r "from ['\"]recharts['\"]" apps/web/ --include="*.tsx" --include="*.ts" -l
```

لكل ملف يستورد Recharts:
```typescript
// قبل
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// بعد — استخدم dynamic import مع Next.js
import dynamic from "next/dynamic";
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
// أو الأفضل: غلّف المكون الكامل الذي يستخدم Recharts
```

**الطريقة الأفضل:** بدلاً من dynamic import لكل مكون Recharts، غلّف الـ chart component بالكامل:

```typescript
// apps/web/modules/shared/components/charts/project-chart.tsx
"use client";
// ... chart component code with recharts imports ...

// في الصفحة التي تستخدمه:
const ProjectChart = dynamic(
  () => import("@/modules/shared/components/charts/project-chart"),
  { ssr: false, loading: () => <Skeleton className="h-64" /> }
);
```

### 7.2 — زيادة React Query `staleTime`

```
الملف: ابحث عن QueryClient configuration
المحتمل: apps/web/lib/query-client.ts أو apps/web/providers/
```

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 دقائق (كان 60 ثانية)
      gcTime: 10 * 60 * 1000,         // 10 دقائق
      retry: false,
      refetchOnWindowFocus: false,     // أضف هذا — يمنع refetch غير ضروري
    },
  },
});
```

### 7.3 — Memoize Sidebar Menu

```
الملف: apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts
```

ابحث عن `useSidebarMenu` hook وأضف `useMemo`:

```typescript
// قبل
const menuItems = buildMenuItems(pathname, permissions, organization);

// بعد
const menuItems = useMemo(
  () => buildMenuItems(pathname, permissions, organization),
  [pathname, permissions?.length, organization?.id]
);
```

أيضاً ابحث عن مكونات Sidebar items وأضف `React.memo`:

```typescript
// SidebarNavItem أو ما يعادله
export const SidebarNavItem = React.memo(function SidebarNavItem(props) {
  // ... existing code
});
```

### 7.4 — Lazy Load AssistantProvider

ابحث عن `AssistantProvider` أو AI-related provider في layouts:
```bash
grep -r "AssistantProvider\|AiProvider\|ChatProvider" apps/web/ --include="*.tsx" -l
```

غلّفه بـ lazy loading:
```typescript
const AssistantProvider = dynamic(
  () => import("@/modules/ai/providers/assistant-provider"),
  { ssr: false }
);
```

### معايير النجاح — المرحلة 7
- [ ] Recharts لا يُحمّل في initial bundle (dynamic import)
- [ ] `staleTime` = 5 دقائق
- [ ] `refetchOnWindowFocus` = false
- [ ] Sidebar menu items مُغلّفة بـ `useMemo`
- [ ] AssistantProvider يُحمّل lazily
- [ ] `pnpm build` يمر بنجاح

---

## المرحلة 8: Decimal → Number Conversion Fix + Audit Logging (P1)

### 8.1 — إصلاح Decimal Precision Loss

### المشكلة
كل حقل Decimal يُحوّل عبر `Number()` قبل الإرجاع من API. هذا يفقد الدقة المالية.

ابحث عن أماكن التحويل:
```bash
grep -rn "Number(" packages/api/modules/finance/ --include="*.ts" | head -30
grep -rn "\.toNumber()" packages/api/modules/finance/ --include="*.ts" | head -30
```

### الحل
استبدل `Number(decimal)` بـ `decimal.toString()` أو `String(decimal)` في كل الـ API responses المالية:

```typescript
// قبل
return {
  amount: Number(invoice.amount),
  vatAmount: Number(invoice.vatAmount),
  total: Number(invoice.total),
};

// بعد
return {
  amount: invoice.amount.toString(),
  vatAmount: invoice.vatAmount.toString(),
  total: invoice.total.toString(),
};
```

**مهم:** تأكد من أن الـ Zod output schema يقبل `string` بدل `number` للحقول المالية. ابحث عن الـ output schemas وعدّلها.

**ملاحظة:** الـ Frontend سيحتاج تحديث لتحويل الـ strings إلى أرقام عند العرض. لكن هذا أفضل من فقدان الدقة في الـ API layer.

### 8.2 — إضافة Audit Logging للعمليات المالية

#### أنشئ AuditLog Model

```
الملف: packages/database/prisma/schema.prisma
```

```prisma
model AuditLog {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId          String?
  action          String   // CREATE, UPDATE, DELETE, STATUS_CHANGE
  entityType      String   // INVOICE, PAYMENT, EXPENSE, QUOTATION, CONTRACT
  entityId        String
  changes         Json?    // { field: { old: "x", new: "y" } }
  metadata        Json?    // بيانات إضافية
  ipAddress       String?
  createdAt       DateTime @default(now())

  @@index([organizationId])
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

#### أنشئ Audit Logging Utility

```
الملف: packages/api/lib/audit-log.ts (ملف جديد)
```

```typescript
import { db } from "@repo/database"; // تحقق من المسار

type AuditLogInput = {
  organizationId: string;
  userId?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

export async function createAuditLog(input: AuditLogInput) {
  try {
    await db.auditLog.create({ data: input });
  } catch (error) {
    // Audit logging يجب أن لا يكسر العملية الأصلية
    console.error("Failed to create audit log:", error);
  }
}

export function diffChanges<T extends Record<string, unknown>>(
  oldData: T,
  newData: Partial<T>,
  fields: (keyof T)[],
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const field of fields) {
    if (newData[field] !== undefined && oldData[field] !== newData[field]) {
      changes[String(field)] = { old: oldData[field], new: newData[field] };
    }
  }
  return changes;
}
```

#### تطبيق Audit Logging على Finance Endpoints

أضف `createAuditLog()` في كل mutation endpoint في:
```
packages/api/modules/finance/invoices/   (create, update, delete, updateStatus)
packages/api/modules/finance/payments/   (create, update, delete)
packages/api/modules/finance/expenses/   (create, update, delete)
```

مثال:
```typescript
// في نهاية create invoice mutation
await createAuditLog({
  organizationId: ctx.session.organizationId,
  userId: ctx.session.user.id,
  action: "CREATE",
  entityType: "INVOICE",
  entityId: invoice.id,
  metadata: { invoiceNumber: invoice.number, total: invoice.total.toString() },
});
```

شغّل: `pnpm --filter database db:push`

### معايير النجاح — المرحلة 8
- [ ] حقول Decimal تُرجع كـ strings في API responses
- [ ] AuditLog model موجود في DB
- [ ] كل عمليات الفواتير والمدفوعات والمصروفات تُسجّل في audit log
- [ ] `pnpm --filter database db:push` يمر بنجاح
- [ ] `pnpm type-check` يمر بنجاح
- [ ] `pnpm build` يمر بنجاح

---

## ✅ فحص نهائي بعد كل المراحل

```bash
# 1. فحص الأنواع
pnpm type-check

# 2. بناء المشروع
pnpm build

# 3. تشغيل الاختبارات
pnpm test

# 4. تحقق من أن Prisma محدث
pnpm --filter database generate
```

## ملخص الأثر المتوقع

| المقياس | قبل | بعد |
|---------|------|------|
| سرعة التنقل | 700ms-1.7s | 200-500ms |
| Bundle size | ~800KB-1.2MB | ~600KB-900KB (-200KB+) |
| API calls لكل تنقل | 8+ تسلسلي | 3-4 متوازي |
| Auth brute force | غير محمي | محمي (10 req/min) |
| CSP security | ضعيف (unsafe-eval) | قوي (بدون unsafe-eval) |
| Owner portal | Token في URL دائماً | Session-based بعد أول زيارة |
| Share links | بدون انتهاء | 7 أيام افتراضي |
| الدقة المالية | Number() = فقدان | String = دقيق |
| Audit logging | غير موجود | كل العمليات المالية مُسجّلة |
