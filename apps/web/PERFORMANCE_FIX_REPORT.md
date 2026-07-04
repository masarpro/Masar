# تقرير إصلاح الأداء — منصة مسار

> **التاريخ:** 2026-07-04
> **النوع:** فحص شامل + إصلاحات منفّذة
> **المنهجية:** 4 وكلاء فحص متوازيين (سلسلة الـ Layouts، ترويسات الكاش، أوزان الحزم، React Query) + مراجعة يدوية للملفات الحرجة

---

## الملخص التنفيذي

الفحص الشامل كشف أن **معظم مشاكل الأداء المذكورة في `PERFORMANCE_AUDIT.md` القديم (2026-03-17) أُصلحت سابقاً**، لكن بقيت **مشكلتان جوهريتان** تم إصلاحهما في هذه الجلسة:

| # | المشكلة | الأثر | الحالة |
|---|---------|-------|--------|
| 1 | 🔴 `listPurchases` يُستدعى حتى **3 مرات لكل تنقّل** عبر **HTTP ذاتي** (السيرفر يستدعي نفسه عبر `/api/rpc` مع إعادة مصادقة كاملة + استعلام DB) | أكبر مصدر لبطء التنقل — 3 رحلات HTTP × (مصادقة + DB Mumbai ~20-30ms) في كل صفحة | ✅ أُصلح |
| 2 | 🟠 غياب `experimental.staleTimes` — كاش راوتر العميل = صفر ثانية، فكل تنقّل (حتى للخلف/الأمام) يعيد تنفيذ سلسلة الـ Layouts كاملة على السيرفر | إعادة تحميل كاملة عند كل تنقّل متكرر | ✅ أُصلح |
| 3 | 🟡 بيئة الجهاز غير متزامنة: Prisma client قديم عن الـ Schema + 3 حزم معلنة غير مثبتة (`use-debounce`, `vaul`, `@radix-ui/react-radio-group`) — كانت تسبب ~80 خطأ type-check | يمنع التطوير والتحقق | ✅ أُصلح |

---

## 1. المشكلة الأولى: HTTP الذاتي للمشتريات (الإصلاح الأهم)

### التشخيص

سلسلة الـ Layouts للصفحات داخل المنظمة (5-6 طبقات) كانت تجلب المشتريات **3 مرات منفصلة** في كل تنقّل:

```
(saas)/layout.tsx          → orpc.payments.listPurchases (input: {})           ← HTTP ذاتي
(saas)/app/layout.tsx      → cachedListPurchases(orgId) → orpcClient           ← HTTP ذاتي
[organizationSlug]/layout  → orpc.payments.listPurchases (input: {orgId})      ← HTTP ذاتي
```

كل استدعاء كان يمر عبر `orpcClient` (رابط `RPCLink` over fetch) الذي يرسل طلب HTTP كامل من الـ RSC render إلى `localhost/api/rpc`، حيث يعيد السيرفر **مصادقة الجلسة من جديد** ثم يستعلم من قاعدة البيانات. الاستدعاءات الثلاثة **لا تتشارك أي كاش** لأن اثنين منها يتجاوزان غلاف `React cache()`.

بينما إجراء `listPurchases` نفسه (في `packages/api/modules/payments/procedures/list-purchases.ts`) مجرد غلاف رقيق حول دالتي DB مباشرتين.

### الإصلاح المنفّذ

تحويل `cachedListPurchases` إلى **استعلام قاعدة بيانات مباشر** (in-process) مغلّف بـ `React cache()`، وتوحيد كل نقاط الاستدعاء عليه:

**`apps/web/modules/shared/lib/cached-queries.ts`** (أعيدت كتابته):
```typescript
export const cachedListPurchases = cache(
	async (organizationId?: string | null) => {
		if (organizationId) {
			const purchases = await getPurchasesByOrganizationId(organizationId);
			return { purchases };
		}
		const session = await getSession();
		if (!session) return { purchases: [] };
		const purchases = await getPurchasesByUserId(session.user.id);
		return { purchases };
	},
);
```

> **ملاحظة أمنية:** الدالة `server-only` ولا تتحقق من العضوية بنفسها — كل المستدعين يمررون `organizationId` مستخرجاً من جلسة المستخدم نفسه (`activeOrganizationId`) أو من `getActiveOrganization(slug)` التي ترجع `null` لغير الأعضاء. موثّق في تعليق داخل الملف.

### الملفات المعدّلة (6)

| الملف | التغيير |
|-------|---------|
| `modules/shared/lib/cached-queries.ts` | `cachedListPurchases` → استعلام DB مباشر بدل `orpcClient` |
| `app/(saas)/layout.tsx` | الـ prefetch يستخدم `queryKey` نفسه لكن `queryFn: () => cachedListPurchases()` |
| `app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx` | نفس التحويل مع `organization.id` |
| `modules/saas/payments/lib/server.ts` | `getPurchases` → يستهلك `cachedListPurchases` بدل `orpcClient` |
| `app/(saas)/app/(account)/settings/billing/page.tsx` | تحويل + **إصلاح bug موجود مسبقاً**: كان الـ prefetch يحقن مصفوفة خام بدل `{ purchases }` فيكسر شكل البيانات المتوقع في `usePurchases` |
| `app/(saas)/app/(organizations)/[organizationSlug]/settings/billing/page.tsx` | تحويل لـ `cachedListPurchases` |

### النتيجة

- **قبل:** 3 × (HTTP ذاتي + إعادة مصادقة + استعلام DB) لكل تنقّل.
- **بعد:** 1-2 استعلام DB خفيف مباشر (مدموج داخل الطلب الواحد عبر `React cache()`)، صفر HTTP ذاتي، صفر إعادة مصادقة.
- مفاتيح React Query لم تتغير — الـ hydration للعميل يعمل كما هو تماماً (`usePurchases`, `SubscriptionGuard`, إلخ).

---

## 2. المشكلة الثانية: كاش راوتر العميل

### التشخيص

لا يوجد `experimental.staleTimes` في `next.config.ts` — الافتراضي في Next.js للصفحات الديناميكية هو **0 ثانية**، أي أن كل تنقّل (حتى العودة لصفحة زرتها قبل ثوانٍ) يعيد طلب الـ RSC payload من السيرفر ويعيد تنفيذ سلسلة الـ Layouts كاملة.

### الإصلاح المنفّذ

**`apps/web/next.config.ts`**:
```typescript
experimental: {
	staleTimes: {
		dynamic: 30,   // إعادة استخدام صفحة ديناميكية زُرتها خلال آخر 30 ثانية
		static: 300,
	},
	optimizePackageImports: [ ... ],
},
```

### النتيجة

- التنقل للخلف/الأمام وإعادة زيارة صفحة خلال 30 ثانية → **فوري من كاش المتصفح** بدون أي طلب سيرفر.
- طزاجة البيانات لا تتأثر: React Query (staleTime = 5 دقائق) هو من يحكم البيانات داخل الصفحة أصلاً، وهذا أطول من نافذة الـ 30 ثانية.

---

## 3. إصلاح بيئة التطوير

- `pnpm --filter @repo/database generate` — إعادة توليد Prisma client (كان قديماً عن الـ Schema: حقول `splitGroupId`, `coverPhotoId`, model `projectDocumentFolder` كانت مفقودة من الـ client المولّد) + إصلاح Zod التلقائي عبر `fix-zod-import.js`.
- `pnpm install --prefer-offline` — تثبيت الحزم المعلنة غير المثبتة (+6 حزم: `use-debounce`, `vaul`, `@radix-ui/react-radio-group` وتوابعها).
- **النتيجة:** `pnpm --filter @repo/web type-check` ينجح الآن **بصفر أخطاء** (كان يفشل بـ ~80 خطأ قبل الجلسة).

---

## 4. ما فحصته ووجدته سليماً (لا يحتاج تعديل)

الفحص الشامل غطى 4 محاور، وهذه المناطق تبيّن أنها **مضبوطة جيداً بالفعل**:

| المنطقة | الحالة |
|---------|--------|
| **`proxy.ts`** | خفيف — فحص كوكي متزامن فقط، بدون أي استعلام DB لكل طلب ✅ |
| **ترويسة `Cache-Control` على `/app/*`** | أُصلحت سابقاً إلى `private, max-age=60, stale-while-revalidate=300` (كانت `no-cache`) ✅ |
| **Suspense** | 168 من ~170 صفحة تستخدم Suspense — الـ streaming مفعّل تقريباً في كل مكان ✅ |
| **`getSession` / `getActiveOrganization` / `getOrganizationList`** | كلها in-process ومغلّفة بـ `React cache()` — مدموجة لكل طلب ✅ |
| **React Query defaults** | `staleTime: 5min`, `refetchOnWindowFocus: false`, retry ذكي — مضبوط ✅ |
| **الـ Polling** | 3 مواضع فقط (إشعارات 30s، شات 15s/30s) وكلها تتوقف عند إخفاء التبويب ✅ |
| **الحزم الثقيلة** | recharts/xlsx/cropper/lightbox/react-markdown كلها خلف `dynamic()` أو `await import()` بالفعل ✅ |
| **`optimizePackageImports`** | مفعّل لـ 11 حزمة ✅ |
| **الصور والخطوط** | `next/image` بالكامل + خطوط self-hosted ✅ |

---

## 5. التحقق

| الخطوة | النتيجة |
|--------|---------|
| `pnpm --filter @repo/web type-check` | ✅ نجح (exit 0، صفر أخطاء) |
| `pnpm build` | ✅ نجح (exit 0) — Next.js فعّل `staleTimes` كتجربة نشطة، والتحذيرات الوحيدة هي ضجيج Sentry/OpenTelemetry المعتاد الموجود مسبقاً |
| Smoke test يدوي مقترح | فتح `/app/[slug]` → تنقّل بين المالية/المشاريع/الإعدادات → التأكد من ظهور خطة الاشتراك وحارس الاشتراك (`SubscriptionGuard`) بشكل صحيح |

---

## 6. توصيات متبقية (لم تُنفّذ — أولوية أدنى)

مرتبة حسب العائد المتوقع:

1. **Region mismatch** (Vercel Dubai ↔ Supabase Mumbai ~20-30ms لكل استعلام): نقل قاعدة البيانات لمنطقة أقرب أو الدوال إلى Mumbai — هذا مضاعِف لكل شيء وليس قابلاً للإصلاح بالكود.
2. **`getMonthlyFinancialTrend`** (`packages/database/prisma/queries/dashboard.ts:404-461`): يجلب كل السجلات الخام لـ 6 أشهر ويجمّعها بـ JavaScript — يحتاج `groupBy`/raw SQL بـ `date_trunc`. لم أعدّله لأنه يمس أرقاماً مالية ويحتاج تحققاً يدوياً بالأرقام.
3. **Exports بلا حدود** (`packages/api/modules/exports/procedures/*`): `findMany` بدون `take` — خطر memory spike عند البيانات الكبيرة.
4. **تقارير المحاسبة** (`AgedReceivablesReport`, `AgedPayablesReport`, `IncomeStatementReport`, `OwnerDetailPage`): recharts يُحمّل statically على تلك المسارات فقط — تحويلها لـ `dynamic()` يقلّص JS الأولي لتلك الصفحات (أثر محدود على مساراتها فقط).
5. **تبعيات ميتة**: `jspdf` و `html2canvas-pro` معلنتان في `apps/web/package.json` بلا أي استخدام (توليد PDF يتم server-side عبر puppeteer) — يمكن حذفهما بأمان.
6. **STALE_TIMES غير مطبّق على نطاق واسع**: ~29 من 776 موضع استعلام فقط يستخدم الثوابت المخصصة؛ الباقي يرث افتراضي 5 دقائق (مقبول، لكن بيانات الطبقة المستقرة مثل الأدوار/الصلاحيات تستحق 15 دقيقة).
7. **بيانات الداشبورد client-side فقط**: الداشبورد `ssr:false` فتنطلق استعلاماته الستة بعد الـ hydration — يمكن عمل SSR prefetch لها الآن بأمان بعد أن أصبح النمط المباشر (بدون HTTP ذاتي) متاحاً.

---

## الأثر المتوقع على تجربة المستخدم

- **التنقل بين الصفحات:** إزالة 2-3 رحلات HTTP ذاتية (كل منها مصادقة + DB) من المسار الحرج لكل تنقّل — تقدير التوفير **150-400ms لكل تنقّل** على بيئة الإنتاج (حسب زمن Mumbai).
- **التنقل المتكرر (ذهاب/عودة):** شبه فوري خلال نافذة 30 ثانية بدل إعادة تنفيذ كاملة.
- **صفحات الفوترة:** أسرع + إصلاح خطأ hydration في صفحة فوترة الحساب.

---

*التقرير أُنشئ بواسطة Claude Code — الفحص نُفّذ عبر 4 وكلاء متوازيين + تحليل يدوي، والإصلاحات تحققت بـ type-check ناجح.*
