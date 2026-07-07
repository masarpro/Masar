# برومبت إنشاء تقرير التدقيق الشامل — منصة مسار — الإصدار 5.0

> **تعليمات:** انسخ هذا البرومبت بالكامل وأعطه لـ Claude Code في مجلد المشروع `D:\Masar\Masar`
> **ملاحظة:** مرر هذا الملف عبر: `cat MASAR_AUDIT_V5_PROMPT.md | claude` أو اقرأه كملف لتجنب مشاكل العربية في Terminal

---

## البرومبت يبدأ هنا:

```
أنت مدقق كود تقني محترف. مطلوب منك إنشاء تقرير تدقيق شامل لمنصة "مسار" (Masar) — منصة SaaS لإدارة المشاريع الإنشائية.

═══════════════════════════════════════════════════
القواعد الصارمة — اقرأها قبل أي شيء
═══════════════════════════════════════════════════

1. **اقرأ أولاً، لا تخمن أبداً.** كل رقم، كل اسم ملف، كل سطر كود يجب أن يكون مبنياً على قراءة فعلية. إذا لم تقرأ الملف، لا تذكره.
2. **لا مجاملات.** لا تقل "ممتاز" أو "رائع" أو "مثير للإعجاب". قيّم بأرقام ونسب مبررة فقط. إذا كان شيء سيئاً قل إنه سيء.
3. **التقرير يجب أن يتجاوز 5,000 سطر.** هذا تقرير مرجعي وليس ملخصاً. أريد التفاصيل الكاملة.
4. **لا تحذف أي قسم.** حتى لو بدا بسيطاً، وثّقه.
5. **كل مشكلة تُذكر يجب أن تُرفق بـ:** اسم الملف الكامل + رقم السطر + مقتطف الكود المسبب + شدة المشكلة + اقتراح الحل.
6. **لا تعتمد على تقارير سابقة.** اقرأ كل شيء من الصفر كأنك تراه لأول مرة.
7. **اكتب التقرير بالعربية** مع المصطلحات التقنية بالإنجليزية كما هي.

═══════════════════════════════════════════════════
المرحلة 0: الإحصائيات الأولية (نفّذها قبل كتابة أي شيء)
═══════════════════════════════════════════════════

نفّذ الأوامر التالية واحفظ نتائجها لاستخدامها في التقرير:

```bash
# 1. عدد الملفات حسب النوع
echo "=== FILE COUNTS ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" | wc -l
find . -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" | wc -l
find . -name "*.prisma" -not -path "*/node_modules/*" | wc -l

# 2. عدد الأسطر
echo "=== LINE COUNTS ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -exec cat {} + | wc -l
find . -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -exec cat {} + | wc -l
find . -name "*.prisma" -not -path "*/node_modules/*" -exec cat {} + | wc -l

# 3. صفحات Next.js
echo "=== PAGES ==="
find . -name "page.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | wc -l
find . -name "layout.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | wc -l
find . -name "loading.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | wc -l
find . -name "error.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | wc -l
find . -name "not-found.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | wc -l

# 4. API modules
echo "=== API MODULES ==="
ls -d packages/api/modules/*/ | wc -l

# 5. Client components
echo "=== CLIENT COMPONENTS ==="
grep -rl '"use client"' --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v .next | wc -l

# 6. Prisma models and enums
echo "=== PRISMA ==="
grep -c "^model " packages/database/prisma/schema/*.prisma 2>/dev/null || grep -c "^model " packages/database/prisma/schema.prisma 2>/dev/null
grep -c "^enum " packages/database/prisma/schema/*.prisma 2>/dev/null || grep -c "^enum " packages/database/prisma/schema.prisma 2>/dev/null

# 7. Indexes
echo "=== INDEXES ==="
grep -c "@@index" packages/database/prisma/schema/*.prisma 2>/dev/null || echo "check schema path"
grep -c "@@unique" packages/database/prisma/schema/*.prisma 2>/dev/null || echo "check schema path"

# 8. Zod schemas
echo "=== ZOD ==="
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.next/*" -exec grep -l "z\." {} + | wc -l

# 9. Translation keys
echo "=== TRANSLATIONS ==="
cat packages/i18n/translations/ar.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(sum(1 for _ in str(d).split(',')))" 2>/dev/null || echo "count manually"
cat packages/i18n/translations/en.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(sum(1 for _ in str(d).split(',')))" 2>/dev/null || echo "count manually"

# 10. مشاكل الجودة
echo "=== QUALITY ==="
grep -r "console\.\(log\|warn\|error\)" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | wc -l
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | wc -l
grep -r "as any" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | wc -l
grep -r "// @ts-ignore\|// @ts-expect-error\|// @ts-nocheck" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | wc -l
grep -rl "eslint-disable" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next | wc -l

# 11. الاختبارات
echo "=== TESTS ==="
find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -v node_modules | wc -l

# 12. Suspense usage
echo "=== SUSPENSE ==="
grep -rl "Suspense" --include="*.tsx" . | grep -v node_modules | grep -v .next | wc -l

# 13. Dynamic imports
echo "=== DYNAMIC IMPORTS ==="
grep -r "dynamic(" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v .next | wc -l

# 14. Custom hooks
echo "=== HOOKS ==="
find . -name "use*.ts" -o -name "use*.tsx" | grep -v node_modules | grep -v .next | grep -v "use client" | wc -l

# 15. Hardcoded Arabic
echo "=== HARDCODED ARABIC ==="
grep -rl '[\u0600-\u06FF]' --include="*.tsx" . | grep -v node_modules | grep -v .next | grep -v translations | grep -v i18n | wc -l

# 16. Dependencies
echo "=== DEPS ==="
cat apps/web/package.json | grep -c '":'
```

═══════════════════════════════════════════════════
المرحلة 1: قراءة الملفات الأساسية
═══════════════════════════════════════════════════

اقرأ الملفات التالية بالكامل قبل البدء بالكتابة. لا تكتب سطراً واحداً في التقرير قبل إكمال القراءة:

### 1.1 البنية التحتية والتكوين
- `package.json` (root)
- `apps/web/package.json`
- `apps/web/next.config.ts`
- `apps/web/tailwind.config.ts` أو `apps/web/app/globals.css` (Tailwind v4)
- `turbo.json`
- `pnpm-workspace.yaml`
- `tsconfig.json` (root + apps/web)
- `.env.local.example` أو `.env.example`
- `apps/web/middleware.ts` (إذا وُجد)
- `biome.json` أو `.biome.json`
- `vercel.json` (إذا وُجد)
- `.github/` (CI/CD workflows إذا وُجدت)

### 1.2 قاعدة البيانات (Prisma)
- **كل ملفات** `packages/database/prisma/schema/` (اقرأ كل ملف .prisma بدون استثناء)
- `packages/database/package.json`
- `packages/database/src/index.ts`
- `packages/database/src/client.ts`
- كل ملفات `packages/database/src/queries/` (كل ملف)
- كل ملفات `packages/database/src/mutations/` (كل ملف)
- `packages/database/prisma/seed.ts` (إذا وُجد)
- `packages/database/fix-zod-decimal.mjs` (إذا وُجد)

### 1.3 نظام المصادقة
- `packages/auth/src/index.ts` أو `packages/auth/src/auth.ts`
- `packages/auth/src/client.ts`
- `packages/auth/src/permissions.ts`
- كل ملفات `packages/auth/src/` بدون استثناء

### 1.4 طبقة API الكاملة
- `packages/api/index.ts`
- `packages/api/orpc/procedures.ts`
- `packages/api/orpc/middlewares.ts` أو أي ملف middleware
- `packages/api/orpc/context.ts`
- `packages/api/lib/` — كل ملف (rate-limit، zatca، email، etc.)
- **كل 42 module في** `packages/api/modules/` — اقرأ كل `router.ts` و `schema.ts` لكل module بدون استثناء:
  - dashboard, projects, finance (invoices, expenses, payments, banks, transfers, receipts), pricing (studies, quantities, templates, custom-items), company (employees, departments, facilities), settings (organization, billing, roles), subcontractors, execution, issues, documents, calendar, notifications, ai, shares, admin, onboarding, leads, accounting, payroll, owner-portal — وأي modules أخرى موجودة

### 1.5 الواجهة الأمامية — الأجزاء الحرجة
- `apps/web/app/layout.tsx` (root)
- `apps/web/app/(saas)/layout.tsx`
- `apps/web/app/(saas)/app/layout.tsx`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/layout.tsx`
- كل `layout.tsx` في المشروع (الـ 18 كلها)
- `apps/web/modules/saas/shared/components/providers/` — كل الـ providers
- `apps/web/modules/saas/shared/components/sidebar/`
- `apps/web/modules/saas/shared/components/navbar/`

### 1.6 وحدة التسعير والكميات (الأعقد)
- `apps/web/modules/saas/pricing/lib/structural-calculations.ts` ⭐ (بالكامل — كل سطر)
- `apps/web/modules/saas/pricing/lib/calculations.ts`
- `apps/web/modules/saas/pricing/lib/height-derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/boq-aggregator.ts`
- `apps/web/modules/saas/pricing/lib/boq-recalculator.ts`
- `apps/web/modules/saas/pricing/lib/boq-export.ts`
- `apps/web/modules/saas/pricing/lib/cutting/` — كل الملفات
- `apps/web/modules/saas/pricing/lib/finishing-derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/mep-derivation-engine.ts`
- `apps/web/modules/saas/pricing/components/studies/sections/` — كل الأقسام (Slabs, Foundations, Columns, Blocks, Stairs, Beams, PlainConcrete, StructuralSpecs)
- `apps/web/modules/saas/pricing/components/studies/BOQSummaryTable.tsx`
- `apps/web/modules/saas/pricing/components/studies/StructuralBuildingWizard.tsx`
- `apps/web/modules/saas/pricing/components/studies/shared/` — كل المكونات المشتركة
- `apps/web/modules/saas/pricing/components/pricing/` — مكونات التسعير
- `apps/web/modules/saas/pricing/components/quotations/` — مكونات عروض الأسعار
- `apps/web/modules/saas/pricing/components/templates/` — مكونات القوالب

### 1.7 النظام المالي
- `apps/web/modules/saas/finance/` — كل المكونات والصفحات
- `packages/api/modules/finance/` — كل الـ routers
- `packages/database/src/queries/finance/` — كل الاستعلامات
- `packages/database/src/mutations/finance/` — كل العمليات
- `apps/web/modules/saas/finance/lib/` — كل المساعدات

### 1.8 النظام المحاسبي
- `packages/api/modules/accounting/` — كل الملفات
- `apps/web/modules/saas/finance/components/accounting/` — كل المكونات
- `packages/api/lib/auto-journal.ts` أو أي ملف يولّد قيود تلقائية
- `packages/database/src/queries/accounting/` — إذا وُجد
- `packages/database/prisma/seed-chart-of-accounts.ts` — إذا وُجد

### 1.9 إدارة المشاريع والتنفيذ
- `apps/web/modules/saas/projects/` — كل المكونات
- `packages/api/modules/projects/` — كل الـ routers
- `packages/api/modules/execution/` — إذا وُجد
- `apps/web/modules/saas/projects/components/execution/`
- `apps/web/modules/saas/projects/components/timeline/`
- `apps/web/modules/saas/projects/components/documents/`
- `apps/web/modules/saas/projects/components/change-orders/`

### 1.10 مقاولو الباطن
- `packages/api/modules/subcontractors/` — كل الملفات
- `apps/web/modules/saas/subcontractors/` — كل المكونات

### 1.11 إدارة الشركة
- `packages/api/modules/company/` — كل الملفات (employees, departments, facilities, attendance, leave, payroll)
- `apps/web/modules/saas/company/` — كل المكونات

### 1.12 الذكاء الاصطناعي
- `packages/ai/` — كل الملفات
- `packages/api/modules/ai/` — كل الملفات
- `apps/web/app/api/ai/` — كل الـ API routes
- `apps/web/modules/saas/shared/components/ai/` — واجهات المساعد

### 1.13 بوابة المالك
- `apps/web/app/owner/` — كل الصفحات
- `packages/api/modules/owner-portal/` — كل الملفات

### 1.14 الإعدادات والأدمن
- `packages/api/modules/settings/` — كل الملفات
- `packages/api/modules/admin/` — كل الملفات
- `apps/web/modules/saas/settings/` — كل المكونات

### 1.15 الترجمة
- `packages/i18n/translations/ar.json`
- `packages/i18n/translations/en.json`
- `apps/web/modules/i18n/` — التكوين

### 1.16 البريد والإشعارات
- `packages/mail/` — كل الملفات
- `packages/api/modules/notifications/` — كل الملفات

### 1.17 التخزين والملفات
- `packages/storage/` — كل الملفات

### 1.18 الاختبارات
- **كل ملف** ينتهي بـ `.test.ts` أو `.test.tsx` أو `.spec.ts` أو `.spec.tsx` في المشروع بالكامل

### 1.19 Marketing والصفحات العامة
- `apps/web/app/(marketing)/` — الهيكل العام
- `apps/web/modules/marketing/` — المكونات

### 1.20 ZATCA
- `packages/api/lib/zatca/` — كل الملفات

═══════════════════════════════════════════════════
المرحلة 2: هيكل التقرير المطلوب (التزم بهذا الترتيب بالضبط)
═══════════════════════════════════════════════════

اكتب التقرير في ملف واحد: `MASAR_FULL_AUDIT_REPORT_v5.md`
ابدأ بالهيدر التالي:

---

> **تاريخ التقرير:** [التاريخ الفعلي]
> **الإصدار:** 5.0
> **مبني على قراءة فعلية لكل ملف في المشروع**
> **عدد الملفات المقروءة:** [العدد الفعلي]
> **عدد أسطر الكود:** [الأرقام الفعلية]
> **وقت التدقيق:** [الوقت الفعلي]

---

ثم اكتب الأقسام التالية بالتفصيل الكامل:

### القسم 1: الملخص التنفيذي (300+ سطر)
- 1.1 ما هو مسار وما هي رؤيته (فقرة)
- 1.2 الأرقام الرئيسية (جدول شامل — كل الإحصائيات من المرحلة 0)
- 1.3 تقييم الجاهزية التفصيلي (جدول: كل وحدة + نسبة + تبرير صريح — لماذا هذه النسبة وليست أعلى أو أقل)
- 1.4 أهم 20 مشكلة حرجة (جدول: رقم + شدة + المشكلة + الملف/السطر)
- 1.5 أهم 10 نقاط قوة (بدون مبالغة — اذكر القوة وما يحدّها)
- 1.6 ملخص التوصيات العاجلة (جدول: أولوية + توصية + أثر + جهد)
- 1.7 خارطة طريق مقترحة (4 مراحل زمنية)
- 1.8 مقارنة مع الإصدار السابق: ما تغير منذ آخر تدقيق (v4 بتاريخ 2026-03-16)

### القسم 2: البنية التقنية والمعمارية (400+ سطر)
- 2.1 مكدس التقنيات مع الإصدارات الفعلية (جدول مفصّل من package.json)
- 2.2 هيكل Monorepo التفصيلي (شجرة ملفات كاملة مع عدد الأسطر لكل مجلد رئيسي)
- 2.3 App Router Structure (جدول: كل route group + عدد الصفحات + عدد الـ layouts)
- 2.4 Data Flow diagram (من المستخدم حتى قاعدة البيانات — ASCII art مفصّل)
- 2.5 Architecture Diagram (ASCII art شامل)
- 2.6 تقييم القرارات المعمارية (جدول: كل قرار + تقييم ✅/⚠️/❌ + تبرير)
- 2.7 Provider Tree Analysis (كل الـ providers المتداخلة بالترتيب)
- 2.8 Bundle Analysis (أكبر الـ dependencies وحجمها المقدّر)

### القسم 3: قاعدة البيانات (500+ سطر)
- 3.1 إحصائيات Prisma Schema (models, enums, indexes, unique constraints)
- 3.2 قائمة كل الـ Models (جدول: اسم + عدد الحقول + العلاقات + الـ indexes)
- 3.3 قائمة كل الـ Enums (جدول: اسم + عدد القيم + أين تُستخدم)
- 3.4 تحليل الـ Indexes (هل هناك missing indexes؟ هل هناك redundant indexes?)
- 3.5 تحليل Decimal vs Float (كل الحقول المالية — هل تستخدم Decimal بشكل صحيح؟)
- 3.6 تحليل العلاقات (orphan records possibility، cascade deletes، soft deletes)
- 3.7 تحليل Migration history
- 3.8 تحليل الـ Queries (packages/database/src/queries/) — كل ملف مع ما يفعله
- 3.9 تحليل الـ Mutations — كل ملف مع ما يفعله
- 3.10 مشاكل وثغرات قاعدة البيانات (كل مشكلة + ملف + سطر)

### القسم 4: نظام المصادقة والصلاحيات (300+ سطر)
- 4.1 تكوين BetterAuth (كل الـ plugins، providers، options)
- 4.2 نظام الأدوار (كل دور + صلاحياته)
- 4.3 مصفوفة الصلاحيات الكاملة (كل صلاحية × كل دور)
- 4.4 حماية Cross-Tenant
- 4.5 نظام 2FA و Passkeys
- 4.6 Session management
- 4.7 Rate limiting على Auth endpoints
- 4.8 مشاكل وثغرات المصادقة

### القسم 5: طبقة API (500+ سطر)
- 5.1 بنية oRPC (procedures, middleware chain, context)
- 5.2 قائمة كل الـ 42+ modules (جدول: اسم المودول + عدد الـ endpoints + الـ procedure type + وصف)
- 5.3 لكل module: قائمة كل endpoint مع:
  - اسم الـ endpoint
  - نوع الـ procedure (public/protected/subscription/admin)
  - الـ input schema (هل يوجد .max()؟ هل يوجد validation كافية?)
  - الـ output
  - هل يوجد permission check؟
  - هل يوجد audit logging؟
  - ملاحظات ومشاكل
- 5.4 تحليل Rate Limiting (التكوين الحالي، الثغرات)
- 5.5 تحليل Error Handling (ORPCError vs throw new Error)
- 5.6 تحليل Input Validation الشامل (missing .max(), missing .min(), etc.)
- 5.7 مشاكل طبقة API

### القسم 6: واجهة المستخدم (400+ سطر)
- 6.1 إحصائيات الواجهة (صفحات, layouts, client components, server components)
- 6.2 Skeleton و Loading States (أين موجودة؟ أين مفقودة?)
- 6.3 Error Boundaries (أين موجودة؟ أين مفقودة?)
- 6.4 Server Components vs Client Components (تحليل: أي مكونات يمكن تحويلها؟)
- 6.5 Suspense Boundaries (عددها ومواقعها)
- 6.6 Dynamic Imports (عددها وأين تُستخدم)
- 6.7 أكبر 20 مكون (بالأسطر) — لكل واحد: اسم + أسطر + هل يحتاج تقسيم؟
- 6.8 Custom Hooks (قائمة كاملة مع ما يفعله كل hook)
- 6.9 تحليل RTL Support
- 6.10 تحليل Dark Mode
- 6.11 تحليل Responsive Design
- 6.12 مشاكل الواجهة (hydration mismatches, layout shifts, flash of content, etc.)

### القسم 7: تحليل الأداء (300+ سطر)
- 7.1 Layout Waterfall Analysis (كم مرحلة متسلسلة لكل صفحة رئيسية؟)
- 7.2 React Query Configuration (staleTime, gcTime per query type)
- 7.3 Server-Side Prefetching (أين يُستخدم؟ أين ينقص؟)
- 7.4 Bundle Size Analysis (biggest dependencies, tree-shaking status)
- 7.5 Image Optimization (next/Image usage vs <img>)
- 7.6 Font Loading
- 7.7 Memoization Analysis (useMemo, useCallback, React.memo — مفرط أم ناقص؟)
- 7.8 Virtualization (هل تُستخدم في الجداول الكبيرة؟)
- 7.9 next.config.ts Analysis (كل خيار وتأثيره)
- 7.10 توصيات تحسين الأداء مع أولويات

### القسم 8: الأمان (300+ سطر)
- 8.1 Security Headers (CSP, HSTS, CORP, COOP, X-Frame-Options)
- 8.2 Environment Variables (ما هو مكشوف؟ ما هو محمي؟)
- 8.3 API Security (authentication, authorization, rate limiting)
- 8.4 File Upload Security (validation, size limits, type checks)
- 8.5 Input Sanitization (SQL injection, XSS, prototype pollution)
- 8.6 CORS Configuration
- 8.7 Session Security
- 8.8 Exposed Endpoints (أي endpoints بدون حماية؟)
- 8.9 Dependency Vulnerabilities (check for known issues)
- 8.10 كل ثغرة أمنية مع الملف والسطر واقتراح الحل

### القسم 9: الوحدات الوظيفية — تحليل مفصّل (1500+ سطر)

هذا هو القسم الأكبر والأهم. لكل وحدة:
- الملفات المكونة (قائمة كاملة مع عدد الأسطر)
- الـ Schema (Models المرتبطة)
- الـ API endpoints (قائمة كاملة)
- تدفق البيانات
- المشاكل والنواقص
- نسبة الجاهزية مع تبرير
- اقتراحات التحسين

#### 9.1 وحدة Dashboard
#### 9.2 وحدة المشاريع (إنشاء، تعديل، حذف، إعدادات)
#### 9.3 وحدة التنفيذ الميداني (execution, updates, timeline, milestones)
#### 9.4 وحدة المستندات والملفات
#### 9.5 وحدة التقويم والجدول الزمني
#### 9.6 وحدة القضايا والملاحظات (Issues)
#### 9.7 وحدة أوامر التغيير (Change Orders)

#### 9.8 وحدة التسعير ودراسات الكميات (الأعقد — 500+ سطر لهذا القسم وحده):
- 9.8.1 نظام الدراسات (CostStudy types, entry points, stages)
- 9.8.2 تهيئة المبنى (Building Config Wizard — كل حقل وكل derivation)
- 9.8.3 محرك اشتقاق الارتفاعات (height-derivation-engine.ts — شرح كامل للخوارزمية)
- 9.8.4 الأقسام الإنشائية — لكل قسم:
  - الأعمدة (Columns): الحسابات، الـ inputs، الـ outputs، المشاكل
  - البلاط (Slabs): كل أنواع البلاط (solid, flat, ribbed/hourdi, wide beam) — الحسابات الفعلية، calculateRebarLayer، المشاكل
  - الأساسات (Foundations): كل أنواع الأساسات (isolated, combined, strip, raft) — الحسابات، top mesh، المشاكل
  - البلك (Blocks): الحسابات، أنواع الجدران، المشاكل
  - السلالم (Stairs): 4 طبقات تسليح، development length، hooks
  - الجسور (Beams): الحسابات، الكانات، المشاكل
  - الخرسانة العادية (Plain Concrete): الحسابات، المشاكل
  - المواصفات الإنشائية (Structural Specs)
- 9.8.5 محرك التشطيبات (finishing-derivation-engine) — التدفق الكامل
- 9.8.6 محرك MEP (mep-derivation-engine) — التدفق الكامل
- 9.8.7 جدول BOQ (BOQSummaryTable) — المنطق، الفلترة، الأداء
- 9.8.8 نظام القطع والتحسين (Cutting Optimizer)
- 9.8.9 مرحلة التسعير (Pricing stage)
- 9.8.10 مرحلة عروض الأسعار (Quotations)
- 9.8.11 نظام القوالب (Templates + TemplateCustomizer)
- 9.8.12 البنود المخصصة (Custom Items)

#### 9.9 النظام المالي:
- 9.9.1 الفواتير (Invoices — lifecycle, statuses, calculations, PDF generation)
- 9.9.2 المصروفات (Expenses — categories, recurring, approval)
- 9.9.3 المقبوضات (Payments — linking to invoices, partial payments)
- 9.9.4 الحسابات البنكية (Banks — balance management, atomic guards)
- 9.9.5 التحويلات البنكية (Transfers)
- 9.9.6 سندات القبض والصرف (Receipt/Payment Vouchers)
- 9.9.7 المطالبات (Claims — project claims, subcontractor claims)
- 9.9.8 التسوية البنكية (Reconciliation)
- 9.9.9 ZATCA (Phase 1 status, Phase 2 readiness)

#### 9.10 النظام المحاسبي:
- 9.10.1 دليل الحسابات (Chart of Accounts — 48 حساب افتراضي)
- 9.10.2 القيود التلقائية (auto-journal — كل الـ 29 عملية)
- 9.10.3 القيود اليدوية
- 9.10.4 التقارير المحاسبية (8 تقارير)
- 9.10.5 فحص الصحة المحاسبية (Health Check)
- 9.10.6 الترحيل الاسترجاعي (Backfill)
- 9.10.7 مشاكل النظام المحاسبي

#### 9.11 مقاولو الباطن (Subcontractors):
- العقود، المطالبات، الدفعات، التقييم

#### 9.12 إدارة الشركة:
- 9.12.1 الموظفين (CRUD, documents, salary info)
- 9.12.2 الأقسام
- 9.12.3 المنشآت/الفروع
- 9.12.4 الحضور والانصراف
- 9.12.5 الإجازات
- 9.12.6 الرواتب (Payroll)

#### 9.13 الذكاء الاصطناعي:
- 9.13.1 المساعد الذكي (واجهاته، أدواته، الـ context)
- 9.13.2 قائمة كل الأدوات (tools) مع وصف ما تفعله
- 9.13.3 RAG / Document Search (إذا وُجد)
- 9.13.4 مشاكل وتحسينات

#### 9.14 بوابة المالك (Owner Portal):
- Token exchange، Session management، الـ 7 endpoints، الأمان

#### 9.15 الإشعارات (Notifications):
- الأنواع، القنوات، الحالة

#### 9.16 نظام الـ Leads/CRM (إذا وُجد)

#### 9.17 نظام Onboarding:
- Wizard steps، Post-wizard checklist

#### 9.18 نظام الإعدادات:
- Organization settings، Billing، Roles، Members، Invitations

#### 9.19 لوحة الأدمن (Admin Panel)

#### 9.20 نظام المشاركة (Share Links)

### القسم 10: التكاملات الخارجية (200+ سطر)
- 10.1 Stripe (Billing — webhooks, plans, subscription lifecycle)
- 10.2 Resend (Email — templates, delivery)
- 10.3 Anthropic Claude (AI — model, tools, rate limits)
- 10.4 ZATCA (e-invoicing — Phase 1 QR, Phase 2 readiness)
- 10.5 Supabase (Storage — file uploads, S3 config)
- 10.6 Sentry (Error monitoring — config, DSN, source maps)
- 10.7 Google Analytics / Vercel Analytics (إذا وُجد)
- 10.8 أي تكامل خارجي آخر موجود

### القسم 11: الترجمة والتدويل (200+ سطر)
- 11.1 تكوين next-intl
- 11.2 عدد المفاتيح (ar vs en)
- 11.3 المفاتيح المفقودة في العربية (قائمة كاملة أو أهم 50)
- 11.4 المفاتيح المفقودة في الإنجليزية
- 11.5 الملفات التي تحتوي نصوص عربية hardcoded (قائمة كاملة)
- 11.6 RTL Issues
- 11.7 مشاكل الترجمة والتوصيات

### القسم 12: الاختبارات و CI/CD (200+ سطر)
- 12.1 قائمة كل ملف اختبار (اسم + أسطر + ما يختبره + هل يعمل؟)
- 12.2 فجوات الاختبارات الحرجة (جدول: المنطقة + عدد الاختبارات + الخطورة)
- 12.3 تحليل الـ CI/CD pipeline (GitHub Actions إذا وُجد)
- 12.4 Deployment configuration (Vercel)
- 12.5 خطة اختبارات مقترحة (بالأولوية)

### القسم 13: تحليل جودة الكود (300+ سطر)
- 13.1 TypeScript Strictness (tsconfig options)
- 13.2 `as any` usage (عدد + قائمة أهم 20 موقع)
- 13.3 `@ts-ignore` / `@ts-expect-error` (قائمة كاملة)
- 13.4 `console.log` / `console.warn` / `console.error` (عدد + أهم المواقع)
- 13.5 `TODO` / `FIXME` / `HACK` (قائمة كاملة مع المحتوى)
- 13.6 Duplicate code patterns
- 13.7 Dead code / Unused exports
- 13.8 Naming consistency
- 13.9 Biome/ESLint configuration and overrides

### القسم 14: التوصيات والخلاصة (300+ سطر)
- 14.1 التوصيات العاجلة (أسبوع) — كل توصية مع الأثر والجهد
- 14.2 التوصيات قصيرة المدى (شهر)
- 14.3 التوصيات متوسطة المدى (3 أشهر)
- 14.4 التوصيات طويلة المدى (6 أشهر)
- 14.5 خلاصة القرارات المعمارية (ما يجب تغييره وما يجب الحفاظ عليه)
- 14.6 تقييم الجاهزية للإطلاق (production readiness — نسبة مئوية مع تبرير)
- 14.7 تقييم قابلية التوسع (scalability assessment)
- 14.8 تقييم الدين التقني (technical debt — قائمة مرتبة بالأولوية)

### الملاحق (500+ سطر)
- ملحق A: قائمة كل الـ Dependencies مع الإصدارات (production + dev)
- ملحق B: قائمة كل Environment Variables المطلوبة
- ملحق C: قائمة كل API Endpoints مع paths و HTTP methods
- ملحق D: مصفوفة الصلاحيات الكاملة (كل صلاحية × كل دور)
- ملحق E: قائمة كل الـ Prisma Models مع حقولها
- ملحق F: قائمة كل الـ Feature Gates
- ملحق G: قائمة كل الـ React Query Keys مع staleTime
- ملحق H: خريطة الـ Error Codes

═══════════════════════════════════════════════════
المرحلة 3: قواعد الكتابة والتنسيق
═══════════════════════════════════════════════════

1. **لغة التقرير:** عربي مع مصطلحات تقنية بالإنجليزية
2. **كل جدول يجب أن يكون Markdown table صحيح**
3. **كل مقتطف كود يكون في code block مع نوع اللغة**
4. **شدة المشاكل:**
   - 🔴 حرج (Critical) — يؤثر على الأمان أو يسبب خسارة بيانات أو يخالف القانون
   - 🟠 مهم (High) — يؤثر على تجربة المستخدم أو الأداء بشكل ملحوظ
   - 🟡 متوسط (Medium) — يحتاج إصلاح لكن لا يؤثر على التشغيل الفوري
   - 🟢 منخفض (Low) — تحسينات وأفضل ممارسات
5. **لا تكرر المعلومات** — إذا ذكرت مشكلة في قسم، أشر إليها في الأقسام الأخرى برقم المشكلة
6. **كل نسبة جاهزية يجب أن تُرفق بتبرير واضح** — لماذا 75% وليس 80%؟
7. **ASCII Art diagrams** للـ data flows و architecture
8. **لا تقل "ممتاز" أو "رائع"** — استخدم: "يعمل بشكل صحيح"، "مُنفّذ بشكل سليم"، "يحقق الهدف"
9. **إذا لم تجد ملفاً مذكوراً** — وثّق ذلك صراحةً: "الملف X غير موجود"

═══════════════════════════════════════════════════
المرحلة 4: خطة التنفيذ (اتبعها بالترتيب)
═══════════════════════════════════════════════════

1. نفّذ أوامر المرحلة 0 (الإحصائيات)
2. اقرأ كل ملفات المرحلة 1 (القراءة الأولية)
3. ابدأ كتابة التقرير قسماً بقسم
4. اكتب التقرير في ملف `MASAR_FULL_AUDIT_REPORT_v5.md` في المجلد الجذري
5. **لا تتوقف** عند 3000 سطر — أكمل حتى تغطي كل الأقسام
6. عند الانتهاء، نفّذ: `wc -l MASAR_FULL_AUDIT_REPORT_v5.md` وتأكد أنه يتجاوز 5000 سطر
7. إذا كان أقل من 5000 سطر، عُد وأضف تفاصيل أكثر للأقسام الأقل تغطية

═══════════════════════════════════════════════════
تذكيرات نهائية حرجة
═══════════════════════════════════════════════════

- ❌ لا تختصر
- ❌ لا تجامل
- ❌ لا تخمن — اقرأ
- ❌ لا تتخطى أقساماً
- ❌ لا تعتمد على ذاكرتك — اقرأ الملفات فعلياً
- ✅ كل رقم من قراءة فعلية
- ✅ كل ملف مذكور تم فتحه وقراءته
- ✅ كل مشكلة مع ملف + سطر + حل
- ✅ تقييم صادق بلا رتوش
- ✅ أكثر من 5000 سطر

ابدأ الآن.
```
