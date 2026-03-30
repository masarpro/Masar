# برومبت 4: الأداء والبنية التحتية والمراقبة

> **الهدف:** تحسين الأداء وإضافة البنية التحتية المفقودة (24 مشكلة)
> **الوقت المتوقع:** 60-80 دقيقة
> **عدد المشاكل:** 24 مشكلة

---

## 🚫 القائمة الحمراء — لا تلمس هذه الملفات أبداً

- `packages/api/modules/quantities/engines/structural-calculations.ts`
- `packages/api/modules/quantities/engines/derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/structural-calculations.ts`
- `packages/database/prisma/zod/index.ts`

---

## المرحلة 0: اقرأ أولاً — لا تخمّن

```bash
cat CLAUDE.md
cat packages/database/prisma/schema/*.prisma | grep "@@index" | wc -l
cat vercel.json 2>/dev/null || echo "No vercel.json"
grep -rn "maxDuration\|MAX_DURATION" apps/web/ --include="*.ts" | head -10
grep -rn "recharts\|xlsx-js-style" apps/web/ --include="*.tsx" --include="*.ts" -l | head -20
grep -rn "import.*dynamic\|lazy(" apps/web/ --include="*.tsx" --include="*.ts" | head -20
cat packages/api/modules/project-execution/procedures/*.ts | head -100
grep -rn "cron\|schedule\|setInterval" packages/api/ --include="*.ts" -l
cat packages/mail/lib/*.ts | head -50
cat packages/api/lib/messaging/providers/*.ts | head -100
ls packages/api/modules/notifications/
grep -rn "Sentry\|sentry" apps/web/ --include="*.ts" --include="*.tsx" -l | head -10
```

---

## المرحلة 1: Database Indexes المفقودة (مشكلة #46)

**المشكلة:** 6 فهارس مفقودة تبطئ الاستعلامات الشائعة.

**المطلوب:**

1. اقرأ الـ schema الحالي:
```bash
grep -B2 -A10 "JournalEntryLine" packages/database/prisma/schema/*.prisma | grep "@@index"
grep -B2 -A10 "ChartAccount" packages/database/prisma/schema/*.prisma | grep "@@index"
grep -B2 -A10 "Notification" packages/database/prisma/schema/*.prisma | grep "@@index"
grep -B2 -A10 "ProjectPayment" packages/database/prisma/schema/*.prisma | grep "@@index"
grep -B2 -A10 "SubcontractClaim" packages/database/prisma/schema/*.prisma | grep "@@index"
grep -B2 -A10 "FinanceExpense" packages/database/prisma/schema/*.prisma | grep "@@index"
```

2. أضف الفهارس المفقودة (**ملاحظة:** تعديل Schema — هذا استثناء مطلوب):

في الملف المناسب من `packages/database/prisma/schema/`:
```prisma
// JournalEntryLine — لتقارير مراكز التكلفة
@@index([projectId])

// ChartAccount — لفلترة حسب النوع
@@index([organizationId, type])

// Notification — للإشعارات غير المقروءة
@@index([userId, readAt])

// ProjectPayment — لفلترة بالحالة
@@index([organizationId, projectId, status])

// SubcontractClaim — لتقارير الاستحقاق
@@index([organizationId, dueDate])

// FinanceExpense — للبحث بالمورد
@@index([organizationId, vendorName])
```

3. بعد الإضافة:
```bash
pnpm --filter database generate
# لا تعمل push للقاعدة الآن — فقط generate للتحقق من صحة الـ schema
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "database" | head -10
```

---

## المرحلة 2: CPM Caching (مشكلة #30)

**المشكلة:** CPM (Critical Path Method) يُعاد حسابه كل طلب بدون cache.

```bash
cat packages/api/modules/project-execution/procedures/*.ts | grep -n "criticalPath\|cpm\|CPM\|calculateCPM"
grep -rn "criticalPath\|getCriticalPath" packages/database/prisma/queries/ --include="*.ts"
```

**المطلوب:**

1. أضف caching بسيط باستخدام حقل في المشروع:
```typescript
// في الـ query أو procedure:
// 1. تحقق من وجود cache صالح
const project = await db.project.findUnique({
  where: { id: projectId },
  select: { cpmCacheData: true, cpmCacheUpdatedAt: true }
});

const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق
if (project.cpmCacheData && project.cpmCacheUpdatedAt && 
    Date.now() - project.cpmCacheUpdatedAt.getTime() < CACHE_TTL) {
  return project.cpmCacheData as CPMResult;
}

// 2. إذا لا cache، احسب
const result = calculateCPM(activities);

// 3. خزّن النتيجة (fire-and-forget)
db.project.update({
  where: { id: projectId },
  data: { 
    cpmCacheData: result as any,  // JSON field
    cpmCacheUpdatedAt: new Date() 
  }
}).catch(() => {}); // don't block on cache save

return result;
```

2. **إذا لا يوجد حقل `cpmCacheData` في الـ schema:**
   - أضف تعليق `// TODO: Add cpmCacheData: Json? and cpmCacheUpdatedAt: DateTime? to Project model`
   - بديل بدون schema change: استخدم in-memory cache (Map) مع TTL:
```typescript
const cpmCache = new Map<string, { data: CPMResult; timestamp: number }>();

function getCachedCPM(projectId: string): CPMResult | null {
  const cached = cpmCache.get(projectId);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  return null;
}
```

3. **Invalidate cache** عند تعديل activities, dependencies, أو milestones.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "execution" | head -10
```

---

## المرحلة 3: Dynamic Imports لـ Heavy Libraries (مشكلة #38)

**المشكلة:** recharts (~120KB) و xlsx-js-style (~100KB) يُحمّلان مع الـ bundle حتى لو لم تُستخدم.

```bash
grep -rn "from.*recharts" apps/web/ --include="*.tsx" --include="*.ts" -l
grep -rn "from.*xlsx-js-style\|from.*xlsx" apps/web/ --include="*.tsx" --include="*.ts" -l
```

**المطلوب:**

### 3a: Recharts — dynamic import
لكل ملف يستخدم recharts:
```typescript
// ❌ قبل
import { LineChart, Line, XAxis, YAxis } from "recharts";

// ✅ بعد — استخدم next/dynamic لكل component يحتوي recharts
import dynamic from "next/dynamic";

const ChartComponent = dynamic(() => import("./ChartComponent"), {
  loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
  ssr: false, // recharts لا يعمل server-side
});
```

### 3b: xlsx-js-style — dynamic import
هذا يُستخدم فقط عند التصدير (export button):
```typescript
// ❌ قبل
import XLSX from "xlsx-js-style";

// ✅ بعد — import عند الحاجة فقط
async function exportToExcel(data: any[]) {
  const XLSX = (await import("xlsx-js-style")).default;
  // ... use XLSX
}
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "recharts|xlsx" | head -10
```

---

## المرحلة 4: Vercel Region (مشاكل #39, #93)

**المشكلة:** 
- #39: Vercel Frankfurt ↔ Supabase Mumbai (20-30ms latency)
- #93: Vercel fra1 بدل dxb1

**ملاحظة من الذاكرة:** Vercel region تم تغييره لـ dxb1 (Dubai) سابقاً. تحقق:

```bash
cat vercel.json 2>/dev/null
grep -rn "region\|dxb1\|fra1" vercel.json apps/web/next.config.ts 2>/dev/null
```

**المطلوب:**
- إذا لم يتم التغيير بعد:
  1. في `vercel.json` أو من Vercel Dashboard، غيّر region لـ `dxb1`
  2. أو في `next.config.ts`:
  ```typescript
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  ```
  3. أضف في `vercel.json`:
  ```json
  {
    "regions": ["dxb1"]
  }
  ```

- إذا تم التغيير مسبقاً → وثّق أنهما محلولتان.

**تحقق:**
```bash
cat vercel.json
```

---

## المرحلة 5: API maxDuration (مشكلة #92)

**المشكلة:** maxDuration 30s قد يكون قصيراً لـ Excel exports والتقارير الكبيرة.

```bash
grep -rn "maxDuration\|MAX_DURATION\|export.*config" apps/web/app/api/ --include="*.ts" | head -20
```

**المطلوب:**

1. لكل API route يتعامل مع exports/reports كبيرة:
```typescript
export const maxDuration = 60; // أو 120 للعمليات الثقيلة
```

2. ابحث عن routes الـ exports:
```bash
ls apps/web/app/api/exports/ 2>/dev/null || echo "No exports API"
grep -rn "export\|generate.*pdf\|generate.*excel" apps/web/app/api/ --include="*.ts" -l
```

3. أضف `maxDuration = 60` لهذه الـ routes.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "api/" | head -10
```

---

## المرحلة 6: Notifications Infrastructure (مشاكل #36, #37, #58, #59)

### 6a: Notification channels (#36)
```bash
cat packages/api/lib/messaging/*.ts
cat packages/api/modules/notifications/procedures/*.ts | head -100
```

- الوضع الحالي: IN_APP يعمل، EMAIL/SMS/WhatsApp معطّلة.
- **للبيتا:** تأكد أن EMAIL يعمل عبر Resend:
```bash
cat packages/mail/lib/*.ts
grep -rn "sendEmail\|resend" packages/mail/ --include="*.ts"
```
- إذا Resend integration موجود لكن غير مربوط بالـ notifications، اربطه:
```typescript
// في notification dispatcher
if (channels.includes("EMAIL") && user.email) {
  await sendNotificationEmail(user.email, notification).catch(err => {
    console.error("[Notification] Email failed:", err);
  });
}
```

### 6b: Resend retry logic (#37)
```bash
grep -rn "resend\|Resend" packages/mail/ --include="*.ts"
```

- أضف retry بسيط:
```typescript
async function sendWithRetry(fn: () => Promise<any>, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // exponential backoff
    }
  }
}
```

### 6c: Notifications fire-and-forget (#58)
- أضف audit logging عند فشل الإرسال (نفس نمط auto-journal):
```typescript
try {
  await sendNotification(notification);
} catch (err) {
  console.error("[Notification] Failed:", err);
  // لا نوقف العملية — fire-and-forget صحيح هنا
  // لكن نسجّل الفشل
  orgAuditLog({ action: "NOTIFICATION_FAILED", ... }).catch(() => {});
}
```

### 6d: Unknown notification type fallback (#59)
```bash
grep -rn "switch.*type\|notificationType\|channel.*type" packages/api/modules/notifications/ --include="*.ts"
```
- بدل السقوط على IN_APP:
```typescript
default:
  console.warn(`[Notification] Unknown type: ${type}, defaulting to IN_APP`);
  // أبقِ الـ fallback لكن سجّل warning
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "notification|mail" | head -10
```

---

## المرحلة 7: Fire-and-Forget Improvements (مشاكل #60, #61, #73, #84)

### 7a: S3 file cleanup on deletion (#60)
```bash
grep -rn "delete.*attachment\|remove.*file" packages/api/modules/attachments/ --include="*.ts"
grep -rn "deleteObject\|removeObject" packages/storage/ --include="*.ts"
```

- عند حذف attachment من DB، أضف S3 cleanup (fire-and-forget):
```typescript
// بعد حذف الـ attachment من DB
if (attachment.storageKey) {
  deleteFromStorage(attachment.storageKey).catch(err => {
    console.error("[Storage] Failed to delete file:", attachment.storageKey, err);
  });
}
```

### 7b: Document version creation (#61)
- إذا fire-and-forget مقبول (لا يؤثر على user flow)، أضف logging عند الفشل فقط.

### 7c: Expense runs error handling (#73)
```bash
grep -rn "fire.and.forget\|catch.*=>" packages/api/modules/company/procedures/expense-payments.ts
```
- أضف logging عند الفشل.

### 7d: Orphaned file cleanup (#84)
- أنشئ دالة `cleanupOrphanedFiles()` في `packages/storage/`:
```typescript
export async function cleanupOrphanedFiles(db: PrismaClient) {
  // هذه تُستدعى من cron job
  // 1. احصل على كل storage keys في DB
  // 2. احصل على كل files في S3
  // 3. احذف files في S3 غير موجودة في DB
  // ملاحظة: عملية ثقيلة — تُنفّذ مرة في اليوم
}
```
- أضف تعليق `// TODO: Implement and call from daily cron` إذا التنفيذ الكامل معقد.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "storage|attachment|expense" | head -10
```

---

## المرحلة 8: Cron Jobs Stubs (مشكلة #102)

**المشكلة:** Missing cron jobs: recurring journal entries, expired trial cleanup, token cleanup, digest emails, notification cleanup.

```bash
ls apps/web/app/api/cron/ 2>/dev/null || echo "No cron directory"
grep -rn "cron\|schedule" apps/web/app/api/ --include="*.ts" -l
```

**المطلوب:**

أنشئ cron API routes (تُستدعى من Vercel Cron أو external scheduler):

1. `apps/web/app/api/cron/daily/route.ts`:
```typescript
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, any> = {};

  // 1. Generate recurring journal entries
  // TODO: Import and call generateDueRecurringEntries()

  // 2. Cleanup expired tokens
  // TODO: Import and call cleanupExpiredTokens()

  // 3. Cleanup old notifications (>90 days)
  // TODO: Import and call cleanupOldNotifications()

  // 4. Cleanup expired trials → auto-downgrade
  // TODO: Import and call cleanupExpiredTrials()

  // 5. Cleanup orphaned files
  // TODO: Import and call cleanupOrphanedFiles()

  return NextResponse.json({ success: true, results });
}
```

2. `apps/web/app/api/cron/hourly/route.ts`:
```typescript
// Digest emails, notification batching
```

3. أضف في `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily", "schedule": "0 2 * * *" },
    { "path": "/api/cron/hourly", "schedule": "0 * * * *" }
  ]
}
```

4. أضف `CRON_SECRET` في `.env.example`.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "cron" | head -10
```

---

## المرحلة 9: Sentry Improvements (مشاكل #100, #101)

### 9a: Session replay (#100)
```bash
grep -rn "Sentry.init\|sentry.*init" apps/web/ --include="*.ts" --include="*.tsx" | head -5
cat apps/web/sentry.client.config.ts 2>/dev/null
```

أضف في Sentry client config:
```typescript
Sentry.init({
  // ... existing config
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,      // privacy: mask text
      blockAllMedia: true,    // privacy: block media
    }),
  ],
  replaysSessionSampleRate: 0.1,   // 10% of sessions
  replaysOnErrorSampleRate: 1.0,   // 100% of error sessions
});
```

### 9b: Custom breadcrumbs (#101)
في أماكن مهمة (route changes, API calls, user actions):
```typescript
Sentry.addBreadcrumb({
  category: "navigation",
  message: `Navigated to ${path}`,
  level: "info",
});
```

**للبيتا:** أضف breadcrumbs فقط في:
1. Layout navigation (route changes)
2. Financial operations (invoice create, payment, etc.)

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "sentry" | head -10
```

---

## المرحلة 10: React Performance (مشاكل #89, #90, #91, #106)

### 10a: React.memo للمكونات الثقيلة (#90)
```bash
grep -rn "export default function\|export function" apps/web/modules/saas/shared/components/sidebar/ --include="*.tsx" | head -10
grep -rn "export default function" apps/web/modules/saas/shared/components/header/ --include="*.tsx" | head -10
```

- لف Sidebar, Header, وأهم table components بـ `React.memo`:
```typescript
// ❌ قبل
export default function Sidebar(props: SidebarProps) { ... }

// ✅ بعد
function SidebarInner(props: SidebarProps) { ... }
export default React.memo(SidebarInner);
```

### 10b: useMemo/useCallback (#89)
- في المكونات الكبيرة (>500 سطر)، أضف `useMemo` للحسابات المعقدة و `useCallback` للـ handlers المررة كـ props.
- **لا تضف useMemo/useCallback لكل شيء** — فقط حيث يوجد re-render ملحوظ.

### 10c: Table virtualization (#91)
- **للبيتا:** أضف تعليق `// TODO: Add virtualization (@tanstack/react-virtual) for tables >100 rows` في أهم الجداول:
  - BOQ Summary Table
  - Journal Entries list
  - Invoice list

### 10d: Provider tree depth (#106)
```bash
grep -rn "Provider" apps/web/app/layout.tsx apps/web/app/(saas)/layout.tsx | head -20
```
- إذا بعض Providers يمكن دمجها (مثل Consent + Analytics)، ادمجها.
- **للبيتا:** أضف تعليق فقط.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## التحقق النهائي

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
pnpm --filter @repo/web build 2>&1 | tail -20
```

---

## ملخص المشاكل المعالجة في هذا البرومبت

| # | المشكلة | الشدة |
|---|---------|-------|
| 30 | CPM cache | 🟠 High |
| 36 | Notifications infrastructure | 🟠 High |
| 37 | Resend email retry | 🟠 High |
| 38 | Dynamic imports (recharts, xlsx) | 🟠 High |
| 39 | Region mismatch | 🟡 Medium |
| 46 | Missing database indexes (6) | 🟡 Medium |
| 58 | Notifications fire-and-forget | 🟡 Medium |
| 59 | Unknown notification fallback | 🟡 Medium |
| 60 | S3 file cleanup | 🟡 Medium |
| 61 | Version creation fire-and-forget | 🟡 Medium |
| 73 | Expense runs fire-and-forget | 🟡 Medium |
| 79 | Trial balance materialized view | 🟡 Medium |
| 84 | Orphaned file cleanup | 🟡 Medium |
| 89 | useMemo/useCallback | 🟡 Medium |
| 90 | React.memo | 🟡 Medium |
| 91 | Table virtualization | 🟡 Medium |
| 92 | API maxDuration | 🟡 Medium |
| 93 | Vercel region | 🟡 Medium |
| 100 | Sentry session replay | 🟡 Medium |
| 101 | Sentry breadcrumbs | 🟡 Medium |
| 102 | Missing cron jobs | 🟡 Medium |
| 106 | Provider tree depth | 🟡 Medium |

**ملاحظة:** المشكلة #79 (Trial balance materialized view) — للبيتا أضف تعليق `// TODO: Add materialized view for large organizations` فقط. التنفيذ يحتاج raw SQL migration وهو post-beta.
