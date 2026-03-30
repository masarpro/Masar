# برومبت 5: الاختبارات والمحرك الإنشائي والذكاء الاصطناعي والتلميع النهائي

> **الهدف:** إغلاق كل المشاكل المتبقية — اختبارات، AI، structural engine guards، error boundaries، i18n، والباقي (28 مشكلة)
> **الوقت المتوقع:** 70-90 دقيقة
> **عدد المشاكل:** 28 مشكلة

---

## 🚫 القائمة الحمراء — لا تلمس هذه الملفات أبداً

- `packages/api/modules/quantities/engines/structural-calculations.ts` — **لا تعدّل المعادلات**
- `packages/api/modules/quantities/engines/derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/structural-calculations.ts`
- `packages/database/prisma/zod/index.ts`
- `packages/database/prisma/schema/*.prisma` (إلا ما يُطلب صراحةً)

> **استثناء المحرك الإنشائي:** المراحل 3-4 تضيف validation guards **حول** المحرك (قبل الإدخال وبعد الإخراج) — **لا تعدّل المعادلات الداخلية أبداً**.

---

## المرحلة 0: اقرأ أولاً — لا تخمّن

```bash
cat CLAUDE.md

# Structural engine
head -100 apps/web/modules/saas/pricing/lib/structural-calculations.ts
head -100 apps/web/modules/saas/pricing/lib/height-derivation-engine.ts
head -100 apps/web/modules/saas/pricing/lib/boq-aggregator.ts

# AI
cat packages/ai/tools/registry.ts | head -50
cat packages/ai/lib/tool-permissions.ts | head -50
ls packages/ai/tools/modules/
grep -rn "auditLog\|audit_log" packages/ai/ --include="*.ts" | head -10

# Error boundaries
grep -rn "ErrorBoundary\|error\.tsx" apps/web/app/ --include="*.tsx" -l
ls apps/web/app/(saas)/app/(organizations)/*/projects/*/subcontracts/ 2>/dev/null
ls apps/web/app/(saas)/app/(organizations)/*/projects/*/execution/ 2>/dev/null

# Testing
ls packages/api/__tests__/ 2>/dev/null
ls apps/web/tests/ 2>/dev/null
cat vitest.workspace.ts 2>/dev/null

# Components to split
wc -l apps/web/modules/saas/pricing/components/studies/sections/ColumnsSection.tsx
wc -l apps/web/modules/saas/finance/components/CreateInvoiceForm.tsx
wc -l apps/web/modules/saas/pricing/components/studies/sections/BlocksSection.tsx

# Handover
cat packages/api/modules/handover/procedures/handover-protocols.ts | wc -l

# i18n
grep -c "hardcoded\|العربية" packages/i18n/translations/ar.json 2>/dev/null | head -5
```

---

## المرحلة 1: AI Audit Trail + Prompt Injection Protection (مشاكل #75, #76, #77)

### 1a: AI interaction audit trail (#75)

```bash
cat apps/web/app/api/ai/assistant/route.ts | head -80
```

أضف audit logging لكل تفاعل AI:
```typescript
// بعد الاستدعاء الناجح
orgAuditLog({
  organizationId,
  actorId: userId,
  action: "AI_INTERACTION",
  entityType: "ai_assistant",
  entityId: conversationId || "no-id",
  metadata: {
    toolsUsed: usedTools.map(t => t.name),
    messageLength: userMessage.length,
    responseLength: response.length,
    model: "claude-sonnet",
  },
}).catch(() => {}); // fire-and-forget
```

- تأكد أن `AI_INTERACTION` موجود في `OrgAuditAction` enum. إذا لا، أضفه:
```bash
grep -n "OrgAuditAction" packages/database/prisma/schema/*.prisma
```

### 1b: Prompt injection protection (#76)

```bash
grep -rn "systemPrompt\|system.*prompt\|context.*inject" packages/ai/ --include="*.ts" | head -20
```

أضف sanitization للـ user context قبل حقنه في الـ prompt:
```typescript
function sanitizeUserContext(context: string): string {
  // إزالة أنماط prompt injection الشائعة
  return context
    .replace(/ignore.*previous.*instructions/gi, "[filtered]")
    .replace(/you are now/gi, "[filtered]")
    .replace(/system:/gi, "[filtered]")
    .replace(/\[INST\]/gi, "[filtered]")
    .replace(/<\/?system>/gi, "[filtered]")
    .slice(0, 5000); // حد الطول
}
```

- استدعها على أي user-provided content قبل دمجه في system prompt.
- **ملاحظة:** هذا ليس حماية مثالية — prompt injection مشكلة مفتوحة. لكن هذه الطبقة + الـ permission checks (تم إصلاحها في #4) تعطي حماية كافية للبيتا.

### 1c: AI usage analytics (#77)

أضف tracking بسيط:
```typescript
// في route.ts بعد كل استدعاء
const toolUsageKey = `ai:tools:${organizationId}`;
// إذا Redis متاح:
// await redis.hincrby(toolUsageKey, toolName, 1);
// إذا لا Redis، سجّل في audit log (تم في 1a)
```

- **للبيتا:** الـ audit log من 1a كافٍ كـ usage analytics. أضف تعليق `// TODO: Add dedicated analytics dashboard for AI tool usage`.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -E "ai/|assistant" | head -10
```

---

## المرحلة 2: Error Boundaries (مشاكل #87, #88)

### 2a: Error boundary لمقاولي الباطن (#87)

```bash
ls apps/web/app/(saas)/app/(organizations)/*/projects/*/subcontracts/
```

أنشئ `error.tsx` في مجلد subcontracts:
```typescript
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";

export default function SubcontractsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" dir="auto">
      <h2 className="text-xl font-semibold">
        {t("common.errorOccurred", { defaultMessage: "حدث خطأ" })}
      </h2>
      <p className="text-muted-foreground">
        {t("common.errorDescription", { defaultMessage: "حدث خطأ أثناء تحميل مقاولي الباطن" })}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        {t("common.tryAgain", { defaultMessage: "حاول مرة أخرى" })}
      </button>
    </div>
  );
}
```

### 2b: Error boundary للتنفيذ الميداني (#88)

نفس النمط لمجلد execution:
```bash
ls apps/web/app/(saas)/app/(organizations)/*/projects/*/execution/
```

- أنشئ `error.tsx` بنفس النمط أعلاه مع تعديل الرسالة.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "error.tsx" | head -10
```

---

## المرحلة 3: Structural Engine — Input Validation Guards (مشاكل #47, #48, #49, #50, #51, #55)

> **تذكير:** لا تعدّل المعادلات داخل المحرك. أضف validation **قبل** أو **بعد** الاستدعاء.

### 3a: blockHeight سالب guard (#55)
```bash
grep -n "blockHeight" apps/web/modules/saas/pricing/lib/height-derivation-engine.ts
```

أضف validation عند حساب blockHeight:
```typescript
// بعد حساب blockHeight (خارج الدالة أو في wrapper)
const blockHeight = calculatedBlockHeight;
if (blockHeight < 0) {
  console.warn("[HeightEngine] Negative blockHeight detected, clamping to 0:", blockHeight);
  // clamp to 0 بدل throw — لمنع كسر الواجهة
  return Math.max(0, blockHeight);
}
```

### 3b: Hardcoded values documentation (#47, #48, #49, #50, #51)

**لا نغيّر القيم — نوثقها فقط:**

أنشئ ملف constants جديد (أو أضف لملف موجود):
```bash
ls apps/web/modules/saas/pricing/constants/
```

أنشئ `apps/web/modules/saas/pricing/constants/structural-defaults.ts`:
```typescript
/**
 * Structural Engine Default Constants
 * ====================================
 * These values are hardcoded in structural-calculations.ts.
 * They represent Saudi construction industry defaults.
 * 
 * Reference: Audit v5 issues #47-#51
 * Status: Documented — will be made configurable post-beta
 */

/** #47: Hollow block count precision epsilon */
export const BLOCK_COUNT_EPSILON = 1e-9;
// Used in line ~1711 to handle floating point comparison

/** #48: Drop panel area threshold (m²) */
export const DROP_PANEL_AREA_THRESHOLD = 36;
// Used in line ~1876

/** #49: Labor cost markup multiplier */
export const LABOR_COST_MARKUP = 1.2;
// Used in line ~1825 — represents 20% overhead for labor

/** #50: Foundation cover fallback */
// coverSide falls back to cover when undefined
// This is intentional behavior for simple foundations

/** #51: Lean concrete perimeter expansion (meters) */
export const LEAN_CONCRETE_EXPANSION = 0.2;
// Used in line ~346 — 20cm expansion on each side

// TODO: Make these configurable per organization/project post-beta
```

### 3c: Perimeter non-rectangular shapes (#52)
أضف تعليق فقط:
```typescript
// TODO: Currently assumes rectangular shapes only.
// For irregular shapes, perimeter should be provided as input.
// Ref: Audit v5 #52
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "pricing" | head -10
```

---

## المرحلة 4: Structural Engine — Informational Limits (مشاكل #53, #54, #56, #57)

### 4a: Basement support documentation (#53, #54)
أضف في `structural-defaults.ts`:
```typescript
/**
 * Known Limitations (documented):
 * 
 * #53: No basement (underground) floor support in height derivation engine.
 *      Heights are always calculated from ground floor up.
 *      Workaround: Enter basement as a separate building or adjust manually.
 * 
 * #54: Uniform heights assumed across building.
 *      The engine uses a single floor height for all floors.
 *      Mixed-height buildings need manual adjustment.
 */
```

### 4b: BOQ aggregator string matching (#56)
```bash
grep -n "includes(" apps/web/modules/saas/pricing/lib/boq-aggregator.ts | head -10
```

- إذا `includes()` يُستخدم لمطابقة أسماء العناصر:
  - أضف تعليق `// CAUTION: includes() may cause false positives (e.g., "slab" matches "inslab")`
  - **للبيتا:** مقبول مع التوثيق. Post-beta: استبدل بـ exact match أو regex.

### 4c: Cutting optimizer remnants (#57)
```bash
grep -n "0\.3\|remnant\|leftover" apps/web/modules/saas/pricing/lib/cutting/ --include="*.ts" | head -10
```

- أضف تعليق يوثق أن remnants < 0.3m تُهمل وهذا قرار تصميم (scrap threshold):
```typescript
// Design decision: Remnants < 0.3m are treated as scrap (not reusable).
// This matches standard construction practice in Saudi Arabia.
// Ref: Audit v5 #57
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "pricing" | head -10
```

---

## المرحلة 5: Large Component Split — أهم 3 ملفات (مشكلة #40)

**المشكلة:** 10+ مكونات فوق 1000 سطر.

**للبيتا:** قسّم أكبر 3 فقط. الباقي post-beta.

### 5a: ColumnsSection.tsx (1535 سطر)
```bash
wc -l apps/web/modules/saas/pricing/components/studies/sections/ColumnsSection.tsx
```

قسّمه إلى:
1. `ColumnsSection.tsx` — المكون الرئيسي (orchestrator، <300 سطر)
2. `ColumnForm.tsx` — نموذج إنشاء/تعديل العمود
3. `ColumnTable.tsx` — جدول الأعمدة
4. `ColumnCalculations.tsx` — عرض الحسابات

### 5b: CreateInvoiceForm.tsx (1320 سطر)
قسّمه إلى:
1. `CreateInvoiceForm.tsx` — الـ form الرئيسي (<400 سطر)
2. `InvoiceItemsSection.tsx` — إدارة عناصر الفاتورة
3. `InvoiceSummarySection.tsx` — ملخص المبالغ
4. `InvoiceClientSection.tsx` — اختيار العميل

### 5c: BlocksSection.tsx (1289 سطر)
نفس النمط — قسّم لـ Form + Table + Calculations.

**قاعدة التقسيم:**
- كل sub-component يجب أن يعمل بشكل مستقل
- مرر البيانات عبر props
- لا تنقل state management — أبقه في المكون الرئيسي
- **لا تغيّر السلوك — فقط أعد التنظيم**

**تحقق بعد كل ملف:**
```bash
npx tsc --noEmit 2>&1 | grep "COMPONENT_NAME" | head -10
```

---

## المرحلة 6: Handover Protocol Split + Fixes (مشاكل #112, #113, #114, #115)

### 6a: Split handover file (#112)
```bash
wc -l packages/api/modules/handover/procedures/handover-protocols.ts
```

قسّمه إلى 4 ملفات:
1. `list-protocols.ts` — list, getById
2. `create-protocol.ts` — create, update
3. `sign-protocol.ts` — sign, complete
4. `protocol-queries.ts` — helper queries

- أضف `index.ts` يعيد تصدير كل الـ procedures.

### 6b: Signature identity validation (#113)
في sign handler:
```typescript
// تحقق أن الموقّع مخوّل (وليس أي مستخدم)
if (signature.role === "CONTRACTOR" && context.user.id !== project.contractorUserId) {
  throw new ORPCError("FORBIDDEN", { message: "غير مخوّل بالتوقيع" });
}
```

### 6c: PDF generation stub (#114)
- أضف تعليق `// TODO: Implement print/PDF using pdfkit (same pattern as exports/pdf-generator.ts)`

### 6d: Warranty tracking notifications (#115)
- أضف تعليق `// TODO: Add cron job to check warranty expiry and send notifications`

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "handover" | head -10
```

---

## المرحلة 7: Testing Infrastructure (مشاكل #103, #104)

### 7a: Test file stubs for critical paths (#103)

أنشئ ملفات اختبار فارغة مع test cases محددة (stubs):

```bash
# أنشئ المجلدات
mkdir -p packages/api/__tests__/accounting
mkdir -p packages/api/__tests__/finance
mkdir -p packages/api/__tests__/ai
```

1. `packages/api/__tests__/accounting/auto-journal.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

describe("Auto-Journal System", () => {
  describe("Invoice Issued", () => {
    it.todo("should create debit entry for accounts receivable");
    it.todo("should create credit entry for revenue");
    it.todo("should handle VAT correctly");
    it.todo("should log JOURNAL_ENTRY_FAILED on error");
    it.todo("should not block invoice creation on journal failure");
  });

  describe("Payment Received", () => {
    it.todo("should debit cash/bank account");
    it.todo("should credit accounts receivable");
  });

  describe("Expense Completed", () => {
    it.todo("should debit expense account");
    it.todo("should credit cash/bank account");
    it.todo("should use correct account for custom categories");
  });

  describe("Credit Note Issued", () => {
    it.todo("should reverse the original invoice journal");
    it.todo("should handle negative amounts correctly");
  });

  describe("Period Closure", () => {
    it.todo("should prevent journal entries in closed periods");
    it.todo("should require sequential closure");
  });

  describe("Concurrent Claims", () => {
    it.todo("should prevent exceeding contract value with concurrent requests");
  });
});
```

2. `packages/api/__tests__/finance/invoice-lifecycle.test.ts`:
```typescript
import { describe, it } from "vitest";

describe("Invoice Lifecycle", () => {
  it.todo("DRAFT → ISSUED: should set issueDate and generate number");
  it.todo("ISSUED → PAID: should update status when fully paid");
  it.todo("ISSUED → PARTIALLY_PAID: should track partial payments");
  it.todo("should validate issueDate ≤ dueDate");
  it.todo("should reject negative amounts");
  it.todo("should calculate VAT correctly at 15%");
});
```

3. `packages/api/__tests__/finance/payment-voucher.test.ts`:
```typescript
import { describe, it } from "vitest";

describe("Payment Voucher", () => {
  it.todo("should enforce PENDING_APPROVAL before APPROVED");
  it.todo("should prevent preparer from approving (separation of duties)");
  it.todo("should create auto-journal on approval");
  it.todo("should reverse journal on cancellation");
});
```

4. `packages/api/__tests__/ai/tool-permissions.test.ts`:
```typescript
import { describe, it } from "vitest";

describe("AI Tool Permissions", () => {
  it.todo("should filter tools based on user permissions");
  it.todo("should block tool execution without permission");
  it.todo("should always allow getMyPermissions tool");
  it.todo("should sanitize user context for prompt injection");
});
```

### 7b: E2E tests fix (#104)
```bash
cat apps/web/tests/*.spec.ts 2>/dev/null
cat playwright.config.ts 2>/dev/null
```

- غيّر timeout من 60 min إلى 5 min:
```typescript
export default defineConfig({
  timeout: 5 * 60 * 1000, // 5 minutes max per test
  // ...
});
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "test" | head -10
```

---

## المرحلة 8: Remaining Polish (مشاكل #45, #107, #108, #110, #116, #117)

### 8a: Prisma schema documentation (#45)
```bash
wc -l packages/database/prisma/schema/*.prisma
ls packages/database/prisma/schema/
```

- **لا تقسّم الـ schema** الآن (خطير). بدلاً من ذلك، أضف تعليقات قسم:
```prisma
// ============================
// SECTION: Authentication & Users
// ============================

// ============================
// SECTION: Finance & Accounting
// ============================
```

- إذا الـ schema بالفعل مقسّم لملفات متعددة في `schema/`، أضف تعليق `// Schema is already split into multiple files ✅`

### 8b: React 19 / Next.js 16 compatibility notes (#107)
- أضف في `CLAUDE.md` أو `README.md`:
```markdown
## Compatibility Notes
- React 19: Using RC — some libraries may need `--legacy-peer-deps`
- Next.js 16: Using canary — Turbopack is default bundler
- Known issue: Some UI libraries may show hydration warnings
```

### 8c: Zod v4 compatibility (#108)
```bash
grep -rn "zod" package.json packages/*/package.json | grep "version\|zod" | head -10
```
- أضف تعليق إذا Zod v4 يُستخدم:
```typescript
// NOTE: Using Zod v4 — some v3 patterns (.transform() chaining) may behave differently
```

### 8d: AI rate limit adjustment (#110)
```bash
grep -rn "STRICT\|5.*min\|rate.*limit.*ai" packages/api/ --include="*.ts" | head -10
```
- غيّر rate limit الـ AI من STRICT (5/min) إلى 10/min:
```typescript
// قبل
const AI_RATE_LIMIT = RATE_LIMIT_PRESETS.STRICT; // 5/min
// بعد
const AI_RATE_LIMIT = { windowMs: 60_000, max: 10 }; // 10/min — more practical for active users
```

### 8e: Decimal precision notes (#116)
```bash
grep -rn "Number(\|\.toNumber\|parseFloat" packages/api/ --include="*.ts" | grep -i "decimal\|amount\|total" | head -20
```
- أضف تعليق في الأماكن الخطرة:
```typescript
// CAUTION: Number() may lose precision for amounts > 2^53.
// For Saudi construction (max ~999M SAR), this is safe.
// Ref: Audit v5 #116
```

### 8f: next/Image check (#117)
```bash
grep -rn '<img ' apps/web/ --include="*.tsx" | grep -v "node_modules" | wc -l
```
- إذا أقل من 10 استخدامات، استبدلها بـ `next/Image`.
- إذا أكثر، أضف تعليق `// TODO: Migrate <img> to next/Image for optimization` في الملفات الأهم.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## المرحلة 9: i18n Remaining Waves (مشكلة #19 — تكملة)

**المشكلة:** Wave 1 (Finance) تمت. تبقى باقي الوحدات.

**للبيتا:** أضف Wave 2 لأهم الوحدات بعد Finance:

### الأولوية:
1. **Projects module** — أسماء الحالات، أنواع المستندات، رسائل الأخطاء
2. **Company/HR** — أنواع الإجازات، حالات الموظفين
3. **Settings** — labels الإعدادات

### الخطوة:
```bash
# اكتشف حجم المشكلة في كل وحدة
grep -rn "[\u0600-\u06FF]" apps/web/modules/saas/projects/ --include="*.tsx" -l | wc -l
grep -rn "[\u0600-\u06FF]" apps/web/modules/saas/company/ --include="*.tsx" -l | wc -l
```

- لكل ملف: استخرج النصوص العربية → أنشئ مفاتيح ترجمة → استبدل بـ `t()`.
- **إذا الوقت لا يكفي:** أضف تعليق `// TODO: i18n Wave 2 — migrate to translation keys` في أهم 20 ملف.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## التحقق النهائي الشامل

```bash
# Type check
npx tsc --noEmit 2>&1 | grep -c "error TS"

# Build
pnpm --filter @repo/web build 2>&1 | tail -30

# Count remaining issues
echo "=== Remaining hardcoded Arabic ==="
grep -rn "[\u0600-\u06FF]" apps/web/modules/saas/ --include="*.tsx" -l | wc -l

echo "=== Remaining as any ==="
grep -rn "as any" packages/api/ --include="*.ts" | wc -l

echo "=== Remaining console.log ==="
grep -rn "console\.log" packages/api/ --include="*.ts" | grep -v "__tests__" | wc -l

echo "=== Error boundaries ==="
find apps/web/app -name "error.tsx" | wc -l
```

---

## ملخص المشاكل المعالجة في هذا البرومبت

| # | المشكلة | الشدة |
|---|---------|-------|
| 19 | Arabic hardcoded (Wave 2+) | 🟠 High |
| 40 | Large components split (top 3) | 🟡 Medium |
| 45 | Prisma schema documentation | 🟡 Medium |
| 47 | Block count precision hack | 🟡 Medium |
| 48 | Drop panel hardcoded 36m² | 🟡 Medium |
| 49 | Labor cost 1.2x hardcoded | 🟡 Medium |
| 50 | coverSide undefined fallback | 🟡 Medium |
| 51 | Lean concrete expansion 0.2m | 🟡 Medium |
| 52 | Perimeter rectangular only | 🟡 Medium |
| 53 | No basement support | 🟡 Medium |
| 54 | Uniform heights assumed | 🟡 Medium |
| 55 | blockHeight negative | 🟡 Medium |
| 56 | BOQ string matching | 🟡 Medium |
| 57 | Cutting remnants < 0.3m | 🟡 Medium |
| 75 | AI audit trail | 🟡 Medium |
| 76 | Prompt injection | 🟡 Medium |
| 77 | AI usage analytics | 🟡 Medium |
| 87 | Error boundary subcontracts | 🟡 Medium |
| 88 | Error boundary execution | 🟡 Medium |
| 103 | Test coverage (stubs) | 🟡 Medium |
| 104 | E2E tests timeout | 🟡 Medium |
| 107 | React 19/Next.js 16 compat | 🟡 Medium |
| 108 | Zod v4 compat | 🟡 Medium |
| 110 | AI rate limit adjustment | 🟢 Low |
| 112 | Handover protocol split | 🟢 Low |
| 113 | Signature identity validation | 🟢 Low |
| 114 | Handover PDF stub | 🟢 Low |
| 115 | Warranty notifications stub | 🟢 Low |
| 116 | Decimal precision notes | 🟢 Low |
| 117 | next/Image migration | 🟢 Low |
