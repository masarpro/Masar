# برومبت 3: التحقق من المدخلات وجودة الكود

> **الهدف:** سد ثغرات validation وتنظيف الكود من الممارسات الضعيفة (16 مشكلة)
> **الوقت المتوقع:** 60-90 دقيقة (حجم عمل كبير — bulk operations)
> **عدد المشاكل:** 16 مشكلة

---

## 🚫 القائمة الحمراء — لا تلمس هذه الملفات أبداً

- `packages/api/modules/quantities/engines/structural-calculations.ts`
- `packages/api/modules/quantities/engines/derivation-engine.ts`
- `apps/web/modules/saas/pricing/lib/structural-calculations.ts`
- `packages/database/prisma/zod/index.ts`
- `packages/database/prisma/schema/*.prisma`

---

## المرحلة 0: اقرأ أولاً — لا تخمّن

```bash
cat CLAUDE.md

# اكتشف أماكن الـ input validation
grep -rn "z\.string()" packages/api/modules/ --include="*.ts" -l | head -30
grep -rn "z\.number()" packages/api/modules/ --include="*.ts" -l | head -30

# اكتشف حجم المشكلة
grep -c "as any" packages/api/modules/**/*.ts 2>/dev/null | grep -v ":0$" | sort -t: -k2 -rn | head -20
grep -c "@ts-ignore\|@ts-expect-error" packages/api/modules/**/*.ts 2>/dev/null | grep -v ":0$" | sort -t: -k2 -rn | head -20

# Onboarding wizard
cat apps/web/modules/saas/onboarding/components/*.tsx | head -100
ls apps/web/modules/saas/onboarding/

# Permission backward compat
grep -rn "backward\|compat\|legacy\|auto.fill\|pricing.*section" packages/api/lib/permissions/ --include="*.ts"
```

---

## المرحلة 1: String Validation — .max() + .trim() (مشاكل #21, #23)

**المشكلة:** ~30% من حقول string بدون `.max()` و~50% بدون `.trim()` — يمكن إرسال بيانات ضخمة أو بمسافات زائدة.

**المطلوب:**

### الخطوة 1: حدد كل ملفات الـ types/input validation:
```bash
find packages/api/modules/ -name "types.ts" -o -name "*.schema.ts" | head -40
# أو
grep -rn "z\.object" packages/api/modules/ --include="types.ts" -l
grep -rn "\.input(" packages/api/modules/ --include="*.ts" -l | head -40
```

### الخطوة 2: أضف .max() و .trim() بشكل منهجي:

**قواعد الحدود القياسية:**
```typescript
// أسماء
z.string().trim().min(1).max(200)    // name, title, label

// أوصاف
z.string().trim().max(2000)          // description, notes

// أكواد
z.string().trim().min(1).max(50)     // code, reference, invoiceNo

// بحث
z.string().trim().max(200)           // search, query, filter

// نصوص طويلة
z.string().trim().max(5000)          // body, content, specifications

// بريد إلكتروني
z.string().trim().email().max(254)   // email

// هاتف
z.string().trim().max(20)            // phone

// عنوان
z.string().trim().max(500)           // address

// URL
z.string().trim().url().max(2048)    // url, link

// ملاحظات اختيارية
z.string().trim().max(1000).optional() // optional notes
```

### الخطوة 3: ابدأ بالوحدات الأهم (مالية → مشاريع → شركة):

**الترتيب:**
1. `packages/api/modules/finance/` — كل types.ts و procedure inputs
2. `packages/api/modules/accounting/` — كل inputs
3. `packages/api/modules/subcontracts/` — كل inputs
4. `packages/api/modules/projects/` — كل inputs
5. `packages/api/modules/project-finance/` — كل inputs
6. `packages/api/modules/company/` — كل inputs
7. `packages/api/modules/project-documents/` — كل inputs
8. `packages/api/modules/project-payments/` — كل inputs
9. `packages/api/modules/project-change-orders/` — كل inputs
10. باقي الوحدات

**ملاحظة مهمة:** لا تضف `.trim()` على حقول كلمة المرور (`password`) — المسافات قد تكون مقصودة.

**تحقق بعد كل وحدة:**
```bash
npx tsc --noEmit 2>&1 | grep "MODULE_NAME" | head -10
```

---

## المرحلة 2: Number Validation — .max() + .min() (مشكلة #22)

**المشكلة:** ~20% من حقول الأرقام بدون حدود — يمكن إرسال أرقام غير واقعية.

**قواعد الحدود:**
```typescript
// مبالغ مالية (ريال سعودي)
z.number().min(0).max(999_999_999.99)     // amount, price, total

// نسب مئوية
z.number().min(0).max(100)                // percentage, vat, discount

// كميات
z.number().min(0).max(999_999)            // quantity

// أبعاد (أمتار)
z.number().min(0).max(10_000)             // length, width, height

// عدد صحيح (pagination)
z.number().int().min(1).max(100)          // limit, page, take

// عدد صحيح (عام)
z.number().int().min(0).max(999_999)      // count, number

// أيام
z.number().int().min(1).max(365)          // days, duration
```

**ابدأ بنفس ترتيب المرحلة 1** (مالية أولاً).

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## المرحلة 3: JSON Deep Validation (مشكلة #24)

**المشكلة:** ~10% من حقول JSON بدون validation عميق — بيانات dimensions و metadata غير متسقة.

```bash
grep -rn "z\.any()\|z\.record(\|z\.unknown()\|Json\b" packages/api/modules/ --include="types.ts" | head -20
grep -rn "dimensions\|metadata\|config\|settings\|options" packages/api/modules/ --include="types.ts" | head -20
```

**المطلوب:**
- لكل حقل `z.any()` أو `z.record(z.any())`:
  1. اقرأ كيف يُستخدم في الكود
  2. حدد الشكل المتوقع
  3. استبدله بـ schema محدد:

```typescript
// مثال: dimensions
const dimensionsSchema = z.object({
  length: z.number().min(0).max(10000).optional(),
  width: z.number().min(0).max(10000).optional(),
  height: z.number().min(0).max(10000).optional(),
  diameter: z.number().min(0).max(10000).optional(),
  thickness: z.number().min(0).max(1000).optional(),
}).passthrough(); // passthrough يسمح بحقول إضافية غير معرّفة

// مثال: metadata
const metadataSchema = z.record(z.string(), z.union([
  z.string().max(1000),
  z.number(),
  z.boolean(),
  z.null(),
])).optional();
```

- **إذا الشكل معقد جداً أو متغير:** استخدم `z.record(z.string(), z.unknown())` مع `.max()` على عدد المفاتيح:
```typescript
z.record(z.string().max(100), z.unknown())
  .refine(obj => Object.keys(obj).length <= 50, "Too many keys")
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## المرحلة 4: Onboarding Wizard Validation (مشكلة #68)

**المشكلة:** يمكن إكمال wizard الـ Onboarding بدون إنهاء كل الخطوات.

```bash
cat apps/web/modules/saas/onboarding/components/*.tsx | grep -n "step\|complete\|finish\|submit\|skip"
grep -rn "onboarding\|wizard\|setup" packages/api/modules/ --include="*.ts" | head -20
```

**المطلوب:**

1. في الخطوة الأخيرة من wizard (أو عند الـ "إنهاء"):
   - تحقق أن كل الخطوات المطلوبة مكتملة
   - الخطوات الاختيارية يمكن تخطيها

2. إذا كان الـ onboarding يحفظ progress في الـ backend:
```typescript
// عند محاولة إكمال الـ onboarding
const requiredSteps = ["organization", "profile", "subscription"];
const completedSteps = user.onboardingProgress?.completedSteps || [];
const missingSteps = requiredSteps.filter(s => !completedSteps.includes(s));

if (missingSteps.length > 0) {
  throw new ORPCError("BAD_REQUEST", {
    message: `الخطوات التالية غير مكتملة: ${missingSteps.join(", ")}`
  });
}
```

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep "onboarding" | head -10
```

---

## المرحلة 5: as any Cleanup — المهم فقط (مشكلة #15 — تكملة)

**المشكلة:** ~505 `as any` متبقية. **لا نريد إصلاح الكل** — فقط الأماكن الحرجة.

**المطلوب:**

### الخطوة 1: حدد الأماكن الأخطر:
```bash
# أماكن as any في الملفات المالية والمحاسبية
grep -rn "as any" packages/api/modules/finance/ --include="*.ts" | wc -l
grep -rn "as any" packages/api/modules/accounting/ --include="*.ts" | wc -l
grep -rn "as any" packages/api/lib/accounting/ --include="*.ts" | wc -l
grep -rn "as any" packages/database/prisma/queries/ --include="*.ts" | wc -l
```

### الخطوة 2: أصلح فقط في هذه المجالات:
1. **Financial calculations** — أي `as any` على مبالغ أو حسابات مالية
2. **Database queries** — `as any` في query results
3. **Permission checks** — `as any` في التحقق من الصلاحيات

### الخطوة 3: الأنماط الشائعة للإصلاح:
```typescript
// ❌ 
const amount = result.total as any;
// ✅
const amount = result.total as Decimal;

// ❌
const data = response as any;
// ✅
const data = response as { id: string; amount: Decimal };

// ❌
(prismaResult as any).customField
// ✅
(prismaResult as Prisma.JsonValue & { customField?: string })?.customField

// ❌ Prisma JSON fields
const meta = entry.metadata as any;
// ✅
const meta = entry.metadata as Record<string, unknown>;
const value = typeof meta?.key === 'string' ? meta.key : '';
```

**هدف:** إصلاح 50+ من أخطر الـ `as any` (في المالية والمحاسبة والصلاحيات). الباقي post-beta.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## المرحلة 6: Console.log Cleanup (مشكلة #98)

**المشكلة:** 155 موقع `console.log/warn/error` — بعضها debug يجب إزالته.

```bash
grep -rn "console\.log" packages/api/ --include="*.ts" | grep -v "node_modules\|__tests__\|\.test\." | wc -l
grep -rn "console\.log" packages/api/ --include="*.ts" | grep -v "node_modules\|__tests__\|\.test\." | head -40
```

**المطلوب:**

1. **أزل:** `console.log` التي تطبع بيانات للـ debugging (مثل `console.log("data:", data)`)
2. **أبقِ:** `console.error` في catch blocks (هذه مفيدة)
3. **حوّل:** `console.log` المهمة لـ structured logging إذا كان متاحاً:
```typescript
// ❌
console.log("[Invoice] Created:", invoiceId);
// ✅ أزلها أو حوّلها لـ audit log
```

4. **ابدأ بـ `packages/api/`** ثم `packages/database/` — لا تلمس `apps/web/` (client-side logs أقل خطورة).

**تحقق:**
```bash
grep -rn "console\.log" packages/api/ --include="*.ts" | grep -v "node_modules\|__tests__" | wc -l
# الهدف: أقل من 20
```

---

## المرحلة 7: RTL Fixes (مشاكل #85, #86)

### 7a: dir="rtl" fixed (#85)
```bash
grep -rn 'dir="rtl"\|dir={"rtl"}' apps/web/ --include="*.tsx" | grep -v "node_modules"
```

- استبدل `dir="rtl"` الثابت بـ dynamic locale:
```typescript
// ❌
<div dir="rtl">
// ✅
<div dir={locale === "ar" ? "rtl" : "ltr"}>
// أو الأفضل — استخدم useDirection() hook إذا موجود
```

### 7b: Physical spacing audit (#86)
```bash
grep -rn "ml-\|mr-\|pl-\|pr-" apps/web/ --include="*.tsx" | grep -v "node_modules" | wc -l
```

**المطلوب:** استبدل أكثر الاستخدامات شيوعاً:
```
ml- → ms-
mr- → me-
pl- → ps-
pr- → pe-
text-left → text-start
text-right → text-end
left- → start-
right- → end-
```

**ابدأ بالملفات الأكثر استخداماً:**
```bash
grep -c "ml-\|mr-\|pl-\|pr-" apps/web/modules/saas/finance/**/*.tsx 2>/dev/null | grep -v ":0$" | sort -t: -k2 -rn | head -15
grep -c "ml-\|mr-\|pl-\|pr-" apps/web/modules/saas/shared/**/*.tsx 2>/dev/null | grep -v ":0$" | sort -t: -k2 -rn | head -15
```

**ملاحظة:** بعض الاستخدامات مقصودة (مثل `mr-auto` لـ spacing ثابت). راجع السياق قبل الاستبدال.

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## المرحلة 8: Permission Backward Compat + Biome Rules (مشاكل #95, #105)

### 8a: Permission backward compatibility (#95)
```bash
grep -rn "backward\|compat\|legacy\|auto.fill" packages/api/lib/permissions/ --include="*.ts"
```
- راجع الـ hack وأضف تعليق يوثق سببه.
- إذا كان الـ hack يمنح صلاحيات زائدة، أضف guard.
- إذا كان safe، أضف تعليق `// Legacy: auto-fills pricing section permission for backward compat — safe to keep`

### 8b: Biome rules (#105)
```bash
cat biome.json | grep -A5 "noExplicitAny\|useExhaustiveDependencies"
```
- غيّر `noExplicitAny: off` إلى `noExplicitAny: warn` (ليس error — لأن 507 as any موجودة)
- **لا تغيّر** `useExhaustiveDependencies` — React 19 يغيّر قواعد dependencies

**تحقق:**
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

## التحقق النهائي

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# تأكد أن الأخطاء الجديدة = 0
```

---

## ملخص المشاكل المعالجة في هذا البرومبت

| # | المشكلة | الشدة |
|---|---------|-------|
| 15 | as any cleanup (financial/critical) | 🟠 High |
| 21 | String fields without .max() | 🟠 High |
| 22 | Number fields without .max() | 🟠 High |
| 23 | Missing .trim() | 🟠 High |
| 24 | JSON fields without deep validation | 🟠 High |
| 68 | Onboarding wizard skip | 🟡 Medium |
| 85 | dir="rtl" fixed | 🟡 Medium |
| 86 | Physical spacing (ml-/mr-) | 🟡 Medium |
| 95 | Permission backward compat | 🟡 Medium |
| 96 | @ts-ignore/@ts-expect-error | 🟡 Medium |
| 97 | eslint-disable | 🟡 Medium |
| 98 | console.log cleanup | 🟡 Medium |
| 99 | TODO/FIXME/HACK | 🟡 Medium |
| 105 | Biome rules | 🟡 Medium |

**ملاحظة:** المشاكل #96, #97 (ts-ignore و eslint-disable) — لا تحذفها بشكل أعمى. راجع كل واحدة: إذا الـ suppression يخفي خطأ حقيقي أصلحه وأزل الـ suppression. إذا الـ suppression ضروري (مثلاً third-party type mismatch)، اتركه مع تعليق يشرح السبب.
