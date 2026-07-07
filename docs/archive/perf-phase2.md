# إصلاح أداء — المرحلة الثانية: Suspense Boundaries + Dashboard Aggregation
**النوع:** تعديلات هيكلية — لا تغيير في business logic

## القواعد الصارمة
- اقرأ كل ملف قبل تعديله — لا تفترض أي شيء
- الملفات المحظورة نهائياً:
  - `structural-calculations.ts`
  - `derivation-engine.ts`
  - أي ملف `.prisma` أو schema
- بعد كل مجموعة خطوات: `pnpm tsc --noEmit`
- إذا فشل TypeScript في أي خطوة: أوقف وأبلّغ قبل المتابعة

---

## فهم المطلوب أولاً

### كيف يعمل Suspense في Next.js App Router

الوضع الحالي (بطيء):
```
المستخدم ينقر → شاشة فارغة/spinner → كل البيانات تُحمّل → الصفحة تظهر كاملة
```

بعد Suspense (سريع):
```
المستخدم ينقر → skeleton يظهر فوراً → البيانات تأتي تدريجياً → الصفحة مكتملة
```

Pattern المطلوب في كل `page.tsx`:

```tsx
// قبل:
export default async function SomePage() {
  const data = await fetchData()
  return <SomeComponent data={data} />
}

// بعد:
import { Suspense } from "react"

export default async function SomePage() {
  return (
    <Suspense fallback={<SomeSkeleton />}>
      <SomePageContent />
    </Suspense>
  )
}

async function SomePageContent() {
  const data = await fetchData()
  return <SomeComponent data={data} />
}
```

### قاعدة مهمة للـ loading.tsx

كل مجلد يحتوي `loading.tsx` يعمل كـ Suspense تلقائياً للـ page.tsx نفسها — لكن هذا يعمل فقط على مستوى الـ route الأساسي. البيانات داخل المكونات الفرعية لا تستفيد منه. المطلوب: إضافة `<Suspense>` داخل الصفحات للمكونات التي تجلب بيانات.

---

## الخطوة A: استطلاع شامل (اقرأ ولا تعدّل)

قبل أي تعديل، نفّذ هذه الأوامر وسجّل النتائج:

```bash
# عدد الصفحات الكلي
find apps/web/app -name "page.tsx" | wc -l

# الصفحات التي تحتوي فعلاً على await داخلها (تجلب بيانات)
grep -rl "await" apps/web/app --include="page.tsx" | wc -l

# الصفحات التي تستخدم Suspense بالفعل
grep -rl "Suspense" apps/web/app --include="page.tsx" | wc -l

# loading.tsx الموجودة
find apps/web/app -name "loading.tsx" | wc -l
```

سجّل الأرقام في تقريرك.

---

## الخطوة B: Dashboard Aggregation (الأثر الأكبر — ابدأ هنا)

### B1 — اقرأ الملف أولاً

اقرأ: `packages/database/prisma/queries/dashboard.ts` السطور 380-480

ابحث عن:
- استعلام يجلب transactions/expenses/payments بـ `findMany` بدون `groupBy`
- loop لاحق يُجمّع البيانات بـ JavaScript (reduce, forEach, map)
- أي حساب لإجماليات شهرية أو فئوية يتم client-side أو في JavaScript

### B2 — نمط الإصلاح المطلوب

إذا وجدت pattern مثل:
```typescript
// قبل — جلب كل الصفوف ثم تجميع بـ JavaScript
const expenses = await db.expense.findMany({
  where: { organizationId }
})
const grouped = expenses.reduce((acc, exp) => {
  const month = exp.date.toISOString().slice(0, 7)
  acc[month] = (acc[month] || 0) + Number(exp.amount)
  return acc
}, {})
```

حوّله إلى:
```typescript
// بعد — groupBy على مستوى قاعدة البيانات
const grouped = await db.expense.groupBy({
  by: ['date'],
  where: { organizationId },
  _sum: { amount: true },
})
```

**تحذير:** إذا كان الـ groupBy يحتاج تجميعاً بالشهر وليس باليوم، استخدم raw query بدلاً من groupBy:
```typescript
const result = await db.$queryRaw`
  SELECT
    DATE_TRUNC('month', date) as month,
    SUM(amount) as total
  FROM expenses
  WHERE organization_id = ${organizationId}
  GROUP BY DATE_TRUNC('month', date)
  ORDER BY month DESC
`
```

### B3 — تحقق من التوافق

بعد التعديل:
1. `pnpm tsc --noEmit`
2. افتح Dashboard في المتصفح وتحقق أن الأرقام صحيحة
3. تحقق أن كل charts تعرض البيانات بشكل صحيح

---

## الخطوة C: Suspense Boundaries — بالأولوية

### C1 — الصفحات عالية الأثر (ابدأ هنا)

اقرأ كل صفحة من هذه القائمة ثم طبّق pattern الـ Suspense:

**مجموعة 1: الصفحات الرئيسية**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/invoices/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/expenses/page.tsx
```

**مجموعة 2: صفحات التسعير**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/[studyId]/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/[studyId]/quantities/page.tsx
```

**مجموعة 3: إدارة الشركة**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/employees/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/company/clients/page.tsx
```

**مجموعة 4: الإعدادات**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/members/page.tsx
```

### C2 — كيف تطبّق على كل صفحة

لكل صفحة في القائمة أعلاه:

1. **اقرأ الصفحة كاملة**
2. **حدّد:** هل تحتوي على `await` لجلب بيانات؟
   - إذا لا → تجاوزها (لا تحتاج Suspense)
   - إذا نعم → طبّق الخطوات التالية

3. **ابحث عن `loading.tsx`** في نفس المجلد
   - اقرأه لتعرف شكل الـ skeleton المتاح
   - استخدمه كـ fallback في الـ Suspense

4. **طبّق التحويل:**
```tsx
// قبل
export default async function ProjectsPage({ params }) {
  const { organizationSlug } = await params
  const projects = await getProjects(organizationSlug)
  return <ProjectsList projects={projects} />
}

// بعد
import { Suspense } from "react"
// استورد الـ skeleton من loading.tsx أو أنشئ مكون بسيط

export default async function ProjectsPage({ params }) {
  const { organizationSlug } = await params
  return (
    <Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsPageContent organizationSlug={organizationSlug} />
    </Suspense>
  )
}

async function ProjectsPageContent({ organizationSlug }: { organizationSlug: string }) {
  const projects = await getProjects(organizationSlug)
  return <ProjectsList projects={projects} />
}
```

5. **قاعدة الـ Skeleton:**
   - إذا كان `loading.tsx` يُصدّر مكوناً → استورده واستخدمه مباشرة
   - إذا لم يكن كذلك → استخدم `null` كـ fallback مؤقتاً (أفضل من لا شيء)
   - لا تُنشئ skeleton جديداً من الصفر — استخدم ما هو موجود

### C3 — بعد كل مجموعة

```bash
pnpm tsc --noEmit
```

إذا نجح → انتقل للمجموعة التالية
إذا فشل → أوقف وأبلّغ بالخطأ

---

## الخطوة D: باقي الصفحات

بعد نجاح المجموعات الأربع أعلاه، طبّق نفس الـ pattern على:

```bash
# ابحث عن كل page.tsx التي تحتوي await ولم تُعالج بعد
grep -rl "await" apps/web/app --include="page.tsx" | \
  grep -v "node_modules" | \
  sort
```

لكل صفحة في النتيجة لم تُعالجها في C1-C2، طبّق نفس الـ pattern.

**استثناءات — لا تُعدّل:**
- صفحات `auth/*` (تسجيل دخول)
- صفحات `api/*`
- صفحات `owner/*` (بوابة المالك — لها طبيعة خاصة)
- `choose-plan/page.tsx` و `chatbot/page.tsx` (force-dynamic، ذات طبيعة مختلفة)

---

## التقرير النهائي

بعد الانتهاء، أبلّغ بـ:

```
## نتائج المرحلة الثانية

### Dashboard Aggregation
- الملف المُعدّل:
- الاستعلامات التي تحولت لـ groupBy:
- الاستعلامات التي احتاجت raw query:

### Suspense Boundaries
- إجمالي الصفحات التي تم فحصها:
- الصفحات التي تم تطبيق Suspense عليها:
- الصفحات التي تجاوزناها (لا await):
- الصفحات التي استثنيناها:

### نتيجة TypeScript
- pnpm tsc --noEmit: ✅ / ❌

### ملفات تُعدّل
[قائمة كل الملفات]
```

---

*لا تعدّل أي ملف خارج `apps/web/app` و `packages/database/prisma/queries/dashboard.ts`*
