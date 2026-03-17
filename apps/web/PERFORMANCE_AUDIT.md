# تقرير تشخيص الأداء — مسار
**تاريخ التشخيص:** 2026-03-17
**النوع:** تشخيص فقط — بدون تعديلات

---

## الملخص التنفيذي

منصة مسار تعاني من **5 مشاكل أداء هيكلية رئيسية** تُسبّب بطء ملحوظ في التنقل بين الصفحات وتحميل البيانات:

1. **Waterfall في الـ Layouts المتداخلة:** 4-5 طبقات من `await` متسلسل، كل طبقة تنتظر الطبقة الأعلى قبل أن تبدأ — مما يُضيف 500-1000ms على المسارات العميقة (مثل صفحة الكميات).
2. **غياب شبه كامل لـ Suspense:** 9 حدود Suspense فقط من أصل 187 صفحة — مما يمنع أي streaming/progressive rendering.
3. **استعلامات قاعدة بيانات مكررة:** `getActiveOrganization()` تُستدعى في 5 layouts مختلفة على نفس المسار — 3 استعلامات مكررة في كل تحميل صفحة مشروع.
4. **مكونات عميل ضخمة:** 10+ مكونات تتجاوز 1,000 سطر مع 30+ useState، بدون React.memo (4.6% فقط من المكونات مُحسّنة).
5. **تجميع بيانات على جانب العميل:** Dashboard يجلب آلاف السجلات الخام ويُجمّعها بـ JavaScript بدل استخدام `groupBy` على مستوى قاعدة البيانات.

---

## نتائج المحاور

### المحور 1: Server-Side Waterfalls

#### جدول الـ Layouts

| Layout | عدد Queries | نوع التنفيذ | Prefetch | Suspense | وقت انتظار تقديري |
|--------|-------------|-------------|----------|----------|-------------------|
| `app/layout.tsx` | 0 | None | لا | لا | 0ms |
| `(saas)/layout.tsx` | 3 | Parallel (Promise.all) | نعم (3) | لا | 50-100ms |
| `(saas)/app/layout.tsx` | 3 | Sequential | جزئي | لا | 150-250ms |
| `(saas)/app/(account)/layout.tsx` | 0 | None (wrapper) | لا | لا | 0ms |
| `[organizationSlug]/layout.tsx` | 4 | Parallel | نعم (2) | لا | 100-180ms |
| `[projectId]/layout.tsx` | 4 | Cascading (mixed) | لا | لا | 200-350ms |
| `finance/layout.tsx` | 1 | Sequential | لا | لا | 50ms |
| `company/layout.tsx` | 2 | Parallel | لا | لا | 75ms |
| `settings/layout.tsx` | 2 | Parallel | لا | لا | 75ms |
| `quantities/layout.tsx` | 0 | None (pass-through) | لا | لا | 0ms |

#### أعمق مسار (Pricing Study Quantities): 8 طبقات

```
Root Layout (0ms)
  → (saas)/layout.tsx: 50-100ms (3 queries parallel)
    [BLOCKED]
    → app/layout.tsx: 150-250ms (3 queries sequential)
      [BLOCKED]
      → [organizationSlug]/layout.tsx: 100-180ms (4 queries parallel + prefetch)
        [BLOCKED]
        → pricing/layout.tsx: ~50ms
          → studies/[studyId]/layout.tsx: ~50ms
            → quantities/layout.tsx: 0ms
              → page.tsx: 100-200ms (own queries)

المجموع التقديري: 600-1,000ms قبل أن يرى المستخدم أي محتوى
```

#### استعلامات مكررة عبر الـ Layouts

`getActiveOrganization()` تُستدعى في **5 layouts مختلفة**:
- `[organizationSlug]/layout.tsx` ✓ (الموقع الصحيح)
- `finance/layout.tsx` ← مكرر
- `company/layout.tsx` ← مكرر
- `settings/layout.tsx` ← مكرر
- `[projectId]/layout.tsx` ← مكرر

**النتيجة:** 3 استعلامات مكررة لقاعدة البيانات في كل تحميل صفحة مشروع.

#### استخدام React.cache()

3 دوال مُحسّنة بـ `cache()` موجودة في `modules/shared/lib/cached-queries.ts`:
- `cachedListPurchases()` — مستخدمة في 2 من 5 layouts ثقيلة
- `cachedGetOrganizationSubscription()` — مستخدمة في 2 من 5
- `cachedGetMemberRole()` — مستخدمة في 2 من 5

**المشكلة:** 3 layouts أخرى لا تستخدم النُسخ المُحسّنة.

---

### المحور 2: Navigation و Cache

#### Prefetch Coverage

| المكون | Routes مع Prefetch | النوع |
|--------|-------------------|-------|
| SidebarNav | `start`, `projects`, `finance`, `company`, `pricing`, `orgSettings`, `accountSettings` | Link prefetch={true} |
| NavBar (SaaS) | كل عناصر القائمة | Link prefetch={true} |
| FinanceNavigation | كل التبويبات | Link prefetch={true} |
| SettingsNavigation | كل التبويبات | Link prefetch={true} |
| CompanyNavigation | كل التبويبات | Link prefetch={true} |
| PricingNavigation | كل التبويبات | Link prefetch={true} |

#### Routes بدون Prefetch (فجوات حرجة)

| الفئة | أمثلة | الأثر |
|-------|-------|-------|
| صفحات التفاصيل | `/projects/:id`, `/finance/invoices/:id` | 200-400ms انتظار عند كل نقرة |
| روابط الجداول | صفوف المشاريع، الفواتير، المصروفات | O(n) prefetches مفقودة |
| تنقل مُتداخل | `/pricing/studies/:id/quantities` → tabs | Skeleton عند تبديل التبويبات |
| Pagination | أزرار "الصفحة التالية" | لا prefetch للصفحة التالية |

**ملاحظة:** لا يوجد أي استخدام لـ `router.prefetch()` في المشروع بالكامل.

#### Cache-Control Headers (next.config.ts)

| Pattern | القيمة | التقييم |
|---------|--------|---------|
| `/_next/static/*` | `public, max-age=31536000, immutable` | ممتاز — سنة كاملة |
| `/app/*` | `private, no-cache` | **إشكالي** — يُجبر revalidation كل تنقل |
| `/auth/*` | `no-store, no-cache, must-revalidate` | صحيح أمنياً |
| `/share/*` | `public, max-age=300, s-maxage=600` | جيد |
| `/*` (catch-all) | `public, s-maxage=3600, stale-while-revalidate=86400` | جيد |

#### React Query Configuration

**ملف:** `modules/shared/lib/query-client.ts`

```
defaultOptions.queries:
  staleTime: 5 * 60 * 1000        (5 دقائق — الافتراضي)
  gcTime: 10 * 60 * 1000           (10 دقائق)
  retry: false                      (لا إعادة محاولة)
  refetchOnWindowFocus: false       (لا إعادة جلب عند العودة للنافذة)
  refetchOnReconnect: true          (إعادة جلب عند الاتصال)
```

#### Stale Times المُخصّصة (`query-stale-times.ts`)

| المستوى | الوقت | البيانات |
|---------|-------|---------|
| Tier 1 | 15 دقيقة | Organization, Permissions, Roles, FinanceSettings, Templates |
| Tier 2 | 5 دقائق | Projects List, Employees, Clients, Banks, Subscription |
| Tier 3 | 2 دقيقة | Project Details, Invoices, Expenses, Claims, Dashboard Stats |
| Tier 4 | 30 ثانية | Notifications, Messages |
| Tier 5 | 0 | AI Chats (realtime) |

**التقييم:** نظام Stale Times مُصمّم بشكل جيد ✅ لكنه غير مُطبّق بشكل متسق في Prefetch calls.

---

### المحور 3: Client Components الثقيلة

#### أكبر 20 مكون (أكبر من 800 سطر)

| # | الملف | الأسطر | use client | useState | useMemo/memo | مشكلة رئيسية |
|---|-------|--------|-----------|----------|-------------|-------------|
| 1 | `SlabsSection.tsx` | 3,438 | نعم | كثير | قليل | أكبر مكون في المشروع |
| 2 | `FoundationsSection.tsx` | 2,383 | نعم | كثير | قليل | حسابات مدمجة مع UI |
| 3 | `ColumnsSection.tsx` | 1,535 | نعم | 17 | 5+ useMemo | حسابات أعمدة + تسليح inline |
| 4 | `CreateInvoiceForm.tsx` | 1,320 | نعم | **30+** | 0 | الأسوأ — كل ضغطة تعيد رسم كل شيء |
| 5 | `BlocksSection.tsx` | 1,289 | نعم | 11 | قليل | جدول ضخم بحسابات inline |
| 6 | `BOQSummaryTable.tsx` | 1,227 | نعم | 8 | قليل | 3 تبويبات فلترة، لا تقسيم مكونات |
| 7 | `PaintItemDialog.tsx` | 1,212 | نعم | **26+** | 7 useCallback | مرآة PlasterItemDialog |
| 8 | `QuotationForm.tsx` | 1,176 | نعم | **20+** | قليل | نموذج متعدد التبويبات |
| 9 | `StairsSection.tsx` | 1,095 | نعم | كثير | قليل | محرك حساب سلالم |
| 10 | `PricingPageContentV2.tsx` | 1,091 | نعم | 1 | - | منسّق مراحل التسعير |
| 11 | `LaborOverviewTab.tsx` | 1,070 | نعم | 6 | قليل | 4 أنماط تسعير عمالة |
| 12 | `InvoiceEditor.tsx` | 1,003 | نعم | كثير | قليل | محرر بنود مع حسابات |
| 13 | `ChoosePlanContent.tsx` | 1,000 | نعم | - | - | Stripe integration |
| 14 | `TemplateCustomizer.tsx` | 973 | نعم | 5+ | - | canvas + editor + preview |
| 15 | `PlasterItemDialog.tsx` | 971 | نعم | **30+** | 7 useCallback | تكرار مع PaintItemDialog |
| 16 | `InvoiceView.tsx` | 960 | نعم | كثير | قليل | عرض فاتورة + إجراءات |
| 17 | `FinishingCostingTab.tsx` | 920 | نعم | كثير | **مفقود** | بنية مشابهة لـ LaborOverviewTab |
| 18 | `QuotationPreviewV2.tsx` | 900 | نعم | - | - | معاينة PDF |
| 19 | `StairsSection.tsx` | 895 | نعم | كثير | قليل | محرك حساب |
| 20 | `Dashboard.tsx` | 883 | نعم | - | - | 9 dynamic imports للرسوم البيانية |

#### إحصائيات Memoization

```
React.memo() مُستخدم: 29 ملف فقط من 629 مكون (4.6%)
المكونات > 800 سطر: 20+
المكونات > 1,000 سطر: 10+
المكونات "use client": 610/629 (97%)
```

#### Dynamic Imports

- **إجمالي:** 30 ملف يستخدم `dynamic()`
- **مُعدّ بشكل صحيح (مع loading):** 24/30 (80%)
- **بدون loading prop:** 6/30 (20%)

الملفات بدون `loading` prop:
1. `TemplateCustomizer.tsx` — CropImageDialog
2. `UserAvatarUpload.tsx` — CropImageDialog
3. `OrganizationLogoForm.tsx` — CropImageDialog
4. `FinanceLogoUpload.tsx` — CropImageDialog
5. `OrganizationStart.tsx` — Dashboard
6. `StructuralItemsEditor.tsx` — BOQSummaryTable

#### next.config.ts — إعدادات الأداء

```
optimizePackageImports: 11 حزمة (lucide-react, recharts, إلخ) ✅
serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"] ✅
transpilePackages: ["@repo/api", "@repo/auth", "@repo/database"] ✅
Bundle analyzer: متاح (ANALYZE=true) — غير مُفعّل افتراضياً
```

---

### المحور 4: Database Queries

#### المشاكل الحرجة

**1. تجميع بيانات على جانب العميل (Dashboard)**
- **الملف:** `packages/database/prisma/queries/dashboard.ts` (سطور 404-461)
- **المشكلة:** `getMonthlyFinancialTrend()` تجلب كل السجلات الخام لـ 6 أشهر ثم تُجمّعها بـ for-loop في JavaScript
- **الأثر:** 50,000 سجل مصروفات → تُحمّل كلها → تُنتج 6 صفوف ملخص
- **البديل:** استخدام `prisma.groupBy({ _sum: { amount: true } })`

**2. تصدير بدون حدود (Exports)**
- **الملفات:** `packages/api/modules/exports/procedures/` (كل ملفات CSV/ICS)
  - `export-claims-csv.ts` (سطر 51)
  - `export-expenses-csv.ts` (سطر 60)
  - `export-issues-csv.ts` (سطر 57)
  - `generate-calendar-ics.ts` (سطور 54, 80)
  - `generate-weekly-report.ts` (سطور 56, 69, 80)
- **المشكلة:** `findMany` بدون `take` — يجلب كل السجلات بلا حد

**3. Nested Includes عميقة (Quote)**
- **الملف:** `packages/database/prisma/queries/cost-studies.ts` (سطر 1255)
- **المشكلة:** `getQuoteById()` تجلب quote → costStudy → ALL structuralItems + finishingItems + mepItems + laborItems
- **الأثر:** دراسة بـ 500 عنصر = 5MB+ payload

**4. فلترة على جانب العميل (Materials List)**
- **الملف:** `packages/api/modules/project-quantities/procedures/get-materials-list.ts` (سطور 35-52)
- **المشكلة:** 4 استعلامات متوازية تجلب كل العناصر ثم تُفلتر بـ JavaScript

**5. BOQ بدون Pagination**
- **الملف:** `packages/api/modules/project-boq/procedures/get-by-phase.ts` (سطور 37-53)
- **المشكلة:** `findMany` بدون `take` يجلب كل عناصر BOQ ثم يُفلتر بالمرحلة client-side

**6. استعلام تحقق مزدوج (Double Verification)**
- **الملف:** `packages/database/prisma/queries/finance.ts` (سطور 330-344)
- **المشكلة:** `findFirst` + `update` = 2 round trips (× 40-60ms مع Mumbai latency)

**7. Race Condition في ترقيم العروض**
- **الملف:** `packages/database/prisma/queries/cost-studies.ts` (سطور 1215-1223)
- **المشكلة:** `count()` + increment بدون transaction — طلبان متزامنان يحصلان على نفس الرقم

**8. Connection Pool صغير**
- **الملف:** `packages/database/prisma/client.ts` (سطر 12)
- **المشكلة:** `max: 5` connections فقط — غير كافٍ لـ Vercel functions تحت حمل عالٍ

#### الأنماط الإيجابية

- Pagination بحدود افتراضية (`take: 50`) في أغلب List endpoints ✅
- `Promise.all()` مُستخدم بكثرة لتوازي الاستعلامات ✅
- `db.$transaction()` مُستخدم في العمليات المركّبة (نسخ الدراسات) ✅
- `createMany()` و `updateMany()` للعمليات الجماعية ✅
- تحويل Decimal → Number صحيح ✅
- 265+ فهرس على الـ Schema ✅

---

### المحور 5: Bundle و Dynamic Imports

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| Dynamic imports (إجمالي) | 30 ملف | متوسط |
| مع loading prop | 24 (80%) | جيد |
| بدون loading prop | 6 (20%) | يحتاج إصلاح |
| optimizePackageImports | 11 حزمة | جيد |
| serverExternalPackages | 3 حزم | صحيح |

**ملاحظة:** وحدة التسعير (257 ملف، 82,620 سطر) هي الأثقل. الأقسام الإنشائية الـ 8 تُحمّل بـ dynamic imports لكنها تُحمّل فوراً عند فتح الـ accordion — لا lazy loading حقيقي.

---

### المحور 6: React Query

#### الإعدادات الافتراضية

```typescript
{
  staleTime: 300_000,          // 5 دقائق
  gcTime: 600_000,             // 10 دقائق
  retry: false,                 // لا إعادة محاولة
  refetchOnWindowFocus: false,  // لا إعادة جلب عند تبديل النافذة
  refetchOnReconnect: true,     // إعادة جلب عند العودة للشبكة
}
```

#### Server-Side Prefetch (Dehydration)

| الموقع | البيانات المُجلبة مسبقاً |
|--------|--------------------------|
| `(saas)/layout.tsx` | session, organizationList, listPurchases |
| `[organizationSlug]/layout.tsx` | activeOrganization, listPurchases |
| `/chatbot/page.tsx` | chats.list, chats.find |
| `/admin/organizations/[id]/page.tsx` | Full organization |
| `/settings/billing/page.tsx` | Purchase list |
| `/settings/security/page.tsx` | User accounts, passkeys |

**المشكلة:** فقط البيانات المباشرة للصفحة الحالية تُجلب مسبقاً — صفحات الأشقاء/الأبناء لا تحصل على شيء.

---

### المحور 7: Middleware

**الحالة:** مُهاجَر إلى `proxy.ts` (Next.js 16)

- **ملف:** `apps/web/proxy.ts` (81 سطر)
- **لا يوجد middleware.ts** — تمت إزالته بالكامل
- **الوظائف:** توجيه المسارات (public token routes, SaaS core, auth, marketing)
- **Matcher:** يستثني static assets, images, API routes, fonts

---

### المحور 8: الصور والـ Assets

| المقياس | القيمة | التقييم |
|---------|--------|---------|
| `<Image>` من next/image | 30 استخدام | ممتاز |
| `<img>` مباشر | 0 | ممتاز |
| موارد CDN خارجية | 1 (saudi-riyal-symbol من unpkg) | مقبول — مُثبّت الإصدار |
| الخطوط | Google Fonts عبر next/font (self-hosted) | ممتاز — display: swap |
| Remote image patterns | 7 نطاقات مُعرّفة | صحيح |

#### Suspense و Error Boundaries

| المقياس | القيمة |
|---------|--------|
| loading.tsx | 172 ملف (92% تغطية) |
| Suspense boundaries | **9 فقط** من 187 صفحة |
| error.tsx | 13 ملف (52% تغطية route groups) |
| ErrorBoundary مخصص | 0 |

#### CSP (Content Security Policy)

```
script-src: 'self' 'unsafe-inline'     ⚠️ يُضعف حماية XSS
style-src:  'self' 'unsafe-inline' https://unpkg.com
frame-ancestors: 'none'                 ✅ حماية clickjacking
form-action: 'self'                     ✅ حماية form hijacking
```

---

## الأولويات المقترحة

| الأولوية | المشكلة | الأثر المتوقع | الجهد | الملف/السطر |
|----------|---------|--------------|-------|------------|
| 1 | Waterfall في الـ Layouts (4-5 طبقات `await` متسلسل) | -40-60% وقت التحميل | متوسط | كل layout.tsx تحت `(saas)/app/` |
| 2 | غياب Suspense (9 من 187 صفحة) | streaming + progressive rendering | متوسط | كل page.tsx بدون Suspense |
| 3 | استعلامات مكررة `getActiveOrganization()` × 5 layouts | -3 DB queries لكل تحميل صفحة | منخفض | 5 ملفات layout.tsx |
| 4 | تجميع Dashboard client-side (50K rows → JS loop) | -80% ذاكرة + -70% وقت Dashboard | منخفض | `dashboard.ts:404-461` |
| 5 | Cache-Control "no-cache" على `/app/*` | أقل revalidation requests | منخفض | `next.config.ts` headers |
| 6 | CreateInvoiceForm — 30+ useState بدون memo | تحسين responsiveness النماذج | متوسط | `CreateInvoiceForm.tsx` |
| 7 | Exports بدون حدود (findMany بلا take) | منع memory spikes | منخفض | `exports/procedures/*.ts` |
| 8 | Nested includes عميقة (Quote → 4 relations) | -60% payload size | منخفض | `cost-studies.ts:1255` |
| 9 | 6 dynamic imports بدون loading prop | UX أفضل عند التحميل | منخفض جداً | 6 ملفات |
| 10 | Connection pool max:5 | أقل timeout errors تحت حمل | منخفض جداً | `prisma/client.ts:12` |
| 11 | Race condition في ترقيم العروض | منع تكرار أرقام | منخفض | `cost-studies.ts:1215` |
| 12 | CSP unsafe-inline | تحسين حماية XSS | متوسط (يتطلب nonce strategy) | `next.config.ts` |

---

## ملاحظات إضافية

### نقاط قوة مكتشفة
- **نظام Stale Times مُصمّم بعناية** (5 مستويات من 15 دقيقة إلى realtime) — مثالي للبيانات المختلفة
- **172 ملف loading.tsx** — تغطية ممتازة للـ skeletons، جاهزة للعمل مع Suspense
- **Promise.all() مُستخدم** في بعض Layouts — الأساس موجود ويحتاج توسيع
- **next/font self-hosted** — لا طلبات خارجية للخطوط أثناء التحميل
- **0 تاجات `<img>` مباشرة** — كل الصور عبر Next.js Image component
- **Progress bar (nprogress)** — يُعطي تأثير بصري أثناء التنقل
- **Error boundaries على 13 route group** — تغطية معقولة

### ملاحظات معمارية
- **97% من المكونات هي "use client"** — فرصة كبيرة لتحويل بعضها لـ Server Components
- وحدة التسعير (257 ملف، 82,620 سطر) هي **أثقل وحدة** — أي تحسين فيها يؤثر على أغلب المستخدمين
- **PaintItemDialog و PlasterItemDialog** شبه متطابقين (1,212 + 971 سطر) — فرصة لدمج/مشاركة كود
- الـ `force-dynamic` على `/chatbot` و `/choose-plan` يمنع أي caching على هذه الصفحات
- Region mismatch (Vercel Dubai ↔ Supabase Mumbai = ~20-30ms per query) يُضاعف أثر كل waterfall

### ملف مرجعي

```
Query Client Config:        apps/web/modules/shared/lib/query-client.ts
Stale Times:                apps/web/modules/shared/lib/query-stale-times.ts
Cache Headers:              apps/web/next.config.ts (سطور 74-227)
Sidebar Prefetch:           apps/web/modules/saas/shared/components/sidebar/SidebarNav.tsx (سطر 16)
Cached Queries:             apps/web/modules/shared/lib/cached-queries.ts
Proxy:                      apps/web/proxy.ts
Document/HTML:              apps/web/modules/shared/components/Document.tsx
DB Client:                  packages/database/prisma/client.ts
Dashboard Queries:          packages/database/prisma/queries/dashboard.ts
Finance Queries:            packages/database/prisma/queries/finance.ts
Cost Study Queries:         packages/database/prisma/queries/cost-studies.ts
Export Procedures:          packages/api/modules/exports/procedures/
```

---

*نهاية التقرير — لم يُعدَّل أي ملف أثناء التشخيص*
