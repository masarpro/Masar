# CLAUDE.md — دليل Claude Code الشامل لمنصة مسار

> **آخر تحديث:** 2026-04-28
> **المطوّر:** جودت — مؤسس ومطوّر رئيسي (مطوّر فردي)
> **المشروع:** منصة مسار (Masar) — SaaS لإدارة المشاريع الإنشائية
> **المستودع:** github.com/masarpro/Masar
> **الموقع:** app-masar.com
> **مسار العمل المحلي:** `H:\Masar\supastarter-nextjs-3\`

---

## القاعدة الذهبية

**اقرأ أولاً، لا تخمّن.** — قبل تعديل أي ملف، اقرأه بالكامل أولاً. لا تفترض أسماء الحقول أو المسارات أو الـ imports. هذا المشروع كبير (650K+ سطر كود) والافتراضات تؤدي لأخطاء صامتة وتكرار عمل.

---

## 1. ما هو مسار

مسار هي منصة SaaS متكاملة لإدارة المشاريع الإنشائية، موجّهة للمقاولين الصغار والمتوسطين في السوق السعودي. المنصة تجيب على ثلاثة أسئلة أساسية للمقاول: "كم ربحت؟ كم عندي؟ من مدين لي؟" — وتجمع في مكان واحد كل ما يحتاجه المقاول بديلاً عن Excel والأنظمة المتفرّقة: إدارة المشاريع، الفوترة، تتبع المصروفات، إدارة مقاولي الباطن، تقارير الربحية، حساب الكميات الإنشائية، التسعير، عروض الأسعار، بوابة المالك، إدارة الموظفين والرواتب، ومساعد ذكاء اصطناعي.

الميزة التنافسية الأكبر: لا يوجد منافس مباشر يجمع التسعير المتخصص + الفوترة + HR + AI في منصة واحدة باللغة العربية مع دعم كامل RTL وتوافق مع الأنظمة السعودية (ZATCA).

---

## 2. مكدس التقنيات

### Frontend
- **React 19.2.3** + **Next.js 16.1.0** (App Router)
- **TypeScript** + **Zod 4** (validation)
- **Tailwind CSS 4** + **shadcn/ui** (Radix-based, 35+ components)
- **TanStack React Query 5** (server state) + **TanStack React Table 8** (tables) + **TanStack Virtual** (virtualization)
- **Recharts** (charts) + **Lucide React 0.553** (icons)
- **next-intl** (i18n — Arabic-first مع دعم إنجليزي)
- **React Hook Form** + Zod schemas (forms)

### Testing
- **Vitest** (unit/integration tests — monorepo workspace)
- **Playwright** (E2E tests — Chromium, Arabic locale, Asia/Riyadh timezone)

### Backend
- **Hono** (HTTP framework) + **oRPC 1.13.2** (type-safe RPC مع OpenAPI)
- **Prisma 7** (ORM) مع **@prisma/adapter-pg** (PostgreSQL driver adapter)
- **Better Auth** (authentication — email/password, magic link, Google OAuth, GitHub OAuth, passkeys, 2FA)
- **pg** (PostgreSQL client) — يجب أن يكون في `serverExternalPackages` في next.config.ts

### AI
- **Claude Sonnet 4** (primary — via Vercel AI SDK + Anthropic provider)
- **GPT-4o mini** (text generation) + **DALL-E 3** (images) + **Whisper-1** (audio)

### Infrastructure
- **Vercel Pro** — functions في **dxb1/Dubai** (تم نقلها من Frankfurt)
- **Supabase PostgreSQL** — **ap-south-1/Mumbai** (⚠️ ~20-30ms latency per query)
- **AWS S3 / Supabase Storage** (files)
- **Redis** (rate limiting)
- **Turborepo + pnpm 10** (monorepo build)
- **Biome** (linting)
- **Sentry** (error monitoring — 4 env vars configured)
- **Resend** (email — domain app-masar.com verified)
- **Stripe** (subscription billing)
- **Google OAuth** (Project ID: masar-489017)

### Compatibility Notes
- **React 19.2.3:** Production release — `use()` hook, Server Components, Actions all stable
- **Next.js 16.1.0:** Production release — App Router, proxy.ts (replaces middleware.ts), Turbopack default
- **Zod v4.1.12:** Breaking changes from v3 — `z.coerce` behavior changed, some `.transform()` patterns differ
- **Node.js:** Requires 20+ (ESM-first Prisma 7)

---

## 3. هيكل المشروع

```
H:\Masar\supastarter-nextjs-3/
├── apps/web/                          # Next.js 16 App (1,200+ files)
│   ├── app/                           # App Router (232 pages, 230 loading states, 16 error boundaries)
│   │   ├── (marketing)/[locale]/      # Marketing (8 pages, SSG)
│   │   ├── (saas)/app/                # SaaS App (188+ pages داخل [organizationSlug])
│   │   │   └── [organizationSlug]/    # Multi-tenant routes
│   │   │       ├── projects/          # المشاريع (56+ pages — chat, boq, handover, finance, …)
│   │   │       ├── company/           # إدارة الشركة (27 pages)
│   │   │       ├── finance/           # النظام المالي (63 pages — يشمل المحاسبة)
│   │   │       ├── settings/          # الإعدادات (16 pages)
│   │   │       └── pricing/           # دراسات التسعير والكميات (24 pages)
│   │   ├── auth/                      # المصادقة (6 pages + AuthParticleField تأثير بصري)
│   │   ├── owner/[token]/             # بوابة المالك (5 pages)
│   │   └── share/[token]/             # مستندات مشاركة
│   ├── modules/                       # Feature modules
│   │   └── saas/                      # 19 sub-modules
│   │       ├── pricing/               # ⭐ أكبر module (280 ملف؛ components/ ~207؛ lib/ ~14,628 سطر)
│   │       │   ├── components/studies/ # مكونات دراسات الكميات
│   │       │   │   ├── sections/      # أقسام إنشائية (8 sections — foundations/slabs/columns/blocks/beams/stairs/plain-concrete/other-structural)
│   │       │   │   │   ├── foundations/ # 🆕 مُعاد هيكلته (forms/, types, index — 2,119 سطر)
│   │       │   │   │   ├── slabs/     # 🆕 مُعاد هيكلته (6 forms + helpers — 4,471 سطر)
│   │       │   │   │   ├── columns/   # 🆕 مُعاد هيكلته (6 ملفات — 1,580 سطر)
│   │       │   │   │   ├── blocks/    # 🆕 مُعاد هيكلته (5 ملفات + index — 1,372 سطر)
│   │       │   │   │   └── other-structural/ # 🆕 مُعاد هيكلته (forms/ — 1,582 سطر)
│   │       │   │   └── shared/        # مكونات مشتركة
│   │       │   ├── lib/               # محركات الحساب (31 ملف، ~14,628 سطر)
│   │       │   │   ├── structural-calculations.ts  # ⭐ 2,926 lines — القلب الإنشائي
│   │       │   │   ├── derivation-engine.ts         # اشتقاق التشطيبات (1,523 سطر)
│   │       │   │   ├── mep-derivation-engine.ts     # اشتقاق MEP (2,493 سطر)
│   │       │   │   ├── other-structural-calculations.ts # عناصر إنشائية أخرى (855 سطر)
│   │       │   │   ├── knowledge-extractor.ts       # استخلاص المعرفة (616 سطر)
│   │       │   │   ├── boq-aggregator.ts           # تجميع BOQ (509 سطر)
│   │       │   │   ├── boq-recalculator.ts         # إعادة حساب (512 سطر)
│   │       │   │   ├── boq-export.ts               # تصدير Excel/PDF (437 سطر)
│   │       │   │   ├── height-derivation-engine.ts  # اشتقاق ارتفاعات (198 سطر)
│   │       │   │   ├── specs/                      # مواصفات (13 ملف، 4 جذر + 9 catalog/)
│   │       │   │   ├── __tests__/                  # 5 اختبارات (boq-aggregator, structural, cutting, height, recalculator)
│   │       │   │   └── cutting/                    # خوارزميات تقطيع الحديد
│   │       │   ├── types/             # أنواع TypeScript
│   │       │   ├── constants/         # ثوابت (أسعار، بلوك، بلاطات)
│   │       │   └── hooks/             # React hooks
│   │       ├── projects/              # إدارة المشاريع
│   │       │   └── components/
│   │       │       ├── boq/           # 🆕 جدول كميات المشروع (12 ملف — CRUD + Excel import)
│   │       │       ├── chat/          # 🆕 محادثات المشروع (7 ملفات — فريق + مالك)
│   │       │       └── finance/
│   │       │           └── subcontracts/  # مقاولو الباطن (مُحسّن)
│   │       ├── finance/               # النظام المالي
│   │       │   └── components/
│   │       │       └── invoices/
│   │       │           └── invoice-form/  # 🆕 نموذج الفاتورة (مُعاد هيكلته — 11 ملف)
│   │       ├── company/               # إدارة الشركة/HR
│   │       │   └── components/
│   │       │       └── templates/
│   │       │           └── renderer/  # 🆕 محرك عرض القوالب (TemplateRenderer — 693 سطر)
│   │       └── shared/                # مكونات مشتركة
│   │           ├── components/
│   │           │   ├── ExpenseCategoryCombobox.tsx    # 🆕 تصنيفات المصروفات (combobox هرمي)
│   │           │   └── ExpenseSubcategoryCombobox.tsx # 🆕 تصنيفات فرعية (combobox مرتبط)
│   │           └── hooks/
│   │               └── use-virtual-rows.ts  # 🆕 hook افتراضية الصفوف (TanStack Virtual)
│   ├── tests/                         # 🆕 E2E Tests (Playwright)
│   │   └── e2e/                       # 4 test files + fixtures
│   └── proxy.ts                       # Next.js 16 proxy (replaced middleware.ts)
│
├── packages/
│   ├── api/                           # Backend (521 ملفات، 45 modules، 700+ endpoints)
│   │   ├── modules/
│   │   │   ├── quantities/            # API الكميات والدراسات (42 procedures — لا engines/ هنا)
│   │   │   │   ├── lib/error-messages.ts
│   │   │   │   ├── procedures/        # CRUD + finishing-/mep-/structural-/manual-/costing-/markup
│   │   │   │   ├── schemas/
│   │   │   │   └── validators/
│   │   │   ├── finance/               # 23 procedures (invoices, expenses, payments, vouchers, transfers, banks, clients, dashboards, reports)
│   │   │   ├── company/               # HR — موظفين، أصول، رواتب، إجازات، مصروفات متكررة
│   │   │   ├── accounting/            # 12 procedure files (journal, chart, owner-drawings, year-end-closing, …)
│   │   │   ├── handover/              # محاضر الاستلام
│   │   │   ├── project-boq/           # جدول كميات المشروع
│   │   │   ├── project-chat/          # محادثات المشروع
│   │   │   └── ...                    # 37 more modules
│   │   ├── lib/
│   │   │   ├── accounting/auto-journal.ts  # قيود تلقائية (922 سطر، 17 hook + reverseAutoJournalEntry)
│   │   │   ├── accounting/adjustment-templates.ts # (87 سطر)
│   │   │   ├── accounting/backfill.ts  # (245 سطر)
│   │   │   ├── messaging/providers/   # email, sms, whatsapp, noop
│   │   │   ├── permissions/, categories/, zatca/phase2/
│   │   │   └── validation-constants.ts # ثوابت التحقق المركزية (حدود أرقام/نصوص)
│   │   └── __tests__/                 # 17 اختبار (permissions, finance, security, modules, zatca-tlv)
│   ├── database/                      # Prisma (175+ files)
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Schema (132 models, 103 enums, 6,320 سطر)
│   │   │   ├── queries/               # طبقة الاستعلام (accounting.ts: 2,295 سطر، finance.ts: 2,296 سطر، …)
│   │   │   └── zod/index.ts           # ⚠️ auto-generated, breaks after prisma generate (يُصلَح بـ fix-zod-import.js)
│   │   └── __tests__/                 # 5 اختبارات (smoke, invoice-calculations, sequences, attachments-validation, org-finance)
│   ├── ai/                            # AI assistant (55 ملف، 14 module + 27 registered tool)
│   ├── auth/                          # Better Auth config
│   ├── mail/                          # Email (7 templates via Resend)
│   ├── payments/                      # Stripe integration
│   ├── storage/                       # S3/Supabase storage
│   ├── i18n/                          # Internationalization
│   └── utils/                         # Shared utilities (+ expense-categories.ts — 39 تصنيف هرمي)
│
├── tooling/                           # Scripts, configs
└── config/                            # App configuration
```

---

## 4. القائمة الحمراء — ملفات لا تلمسها أبداً

هذه الملفات تحتوي على محركات حساب معقدة ومُختبرة يدوياً. أي تعديل خاطئ يفسد كل الأرقام في المنصة:

> **ملاحظة معمارية:** المحركات الحسابية تعيش على **الواجهة فقط** (`apps/web/modules/saas/pricing/lib/`). لا يوجد `packages/api/modules/quantities/engines/` — الـ API يعرض CRUD وبعض إعادة الحساب، أما الحساب الإنشائي/التشطيبات/MEP فيتم client-side ثم يُحفظ.

| الملف | السبب |
|-------|-------|
| `apps/web/modules/saas/pricing/lib/structural-calculations.ts` | محرك حساب الكميات الإنشائية — **2,926 سطر** من معادلات هندسية دقيقة |
| `apps/web/modules/saas/pricing/lib/derivation-engine.ts` | محرك اشتقاق التشطيبات — **1,523 سطر** |
| `apps/web/modules/saas/pricing/lib/mep-derivation-engine.ts` | محرك اشتقاق MEP — **2,493 سطر** |
| `apps/web/modules/saas/pricing/lib/other-structural-calculations.ts` | عناصر إنشائية أخرى — 855 سطر |
| `apps/web/modules/saas/pricing/lib/knowledge-extractor.ts` | مستخلص المعرفة — 616 سطر |
| `packages/database/prisma/zod/index.ts` | ملف مولّد تلقائياً — لا تعدّله يدوياً (يُصلَح بـ `fix-zod-import.js` تلقائياً بعد `prisma generate`) |
| `packages/database/prisma/schema.prisma` | لا تعدّل Schema بدون تأكيد صريح من جودت |
| `packages/database/prisma/queries/accounting.ts` | طبقة استعلام محاسبية ضخمة (2,295 سطر) — تعديلات هنا تؤثر على القيود |
| `packages/api/lib/accounting/auto-journal.ts` | محرك القيود التلقائية (922 سطر، 17 hook) — يُكسر التطابق المحاسبي بسهولة |

**استثناء وحيد:** إذا طُلب منك صراحةً إصلاح bug محدد في المحرك مع تقديم الحساب اليدوي كدليل.

---

## 5. أنماط العمل والقواعد الأساسية

### 5.1 نمط تنفيذ المهام

```
1. اقرأ الملفات المعنية أولاً (grep + view)
2. نفّذ التعديلات
3. تحقق بـ: pnpm --filter @repo/web type-check (من جذر المشروع)
4. إذا نجح → pnpm build للتحقق النهائي
5. git add -A && git commit && git push
```

### 5.2 قاعدة الـ Multi-tenancy

**`organizationId` يجب أن يكون على كل query بدون استثناء.** لا تثق بـ organizationId المرسل من الـ frontend — دائماً resolve من قاعدة البيانات عبر الجلسة. كل endpoint يجب أن يستدعي `verifyOrganizationAccess()` مع الصلاحية المناسبة.

### 5.3 قاعدة الاشتراكات

**165+ write endpoint** يستخدم `subscriptionProcedure` لمنع مستخدمي الخطة المجانية. لا تستخدم `publicProcedure` أبداً لـ endpoints تتعامل مع بيانات المنظمة. القراءة تستخدم `protectedProcedure`، الكتابة تستخدم `subscriptionProcedure`.

### 5.4 قاعدة الترجمة (Internationalization)

كل نص يظهر للمستخدم يجب أن يستخدم مفاتيح الترجمة عبر `useTranslations()` — لا hardcoded strings.

**قاعدة الإضافة:** عند إضافة أي نص UI جديد، **أضف الترجمة في كلا الملفين معاً** في نفس الـ commit. لا تترك مفاتيح ترجمة ناقصة أبداً — هذا يكسر الـ fallback ويظهر المفتاح الخام للمستخدم.

- `packages/i18n/translations/ar.json` (~10,736 سطر)
- `packages/i18n/translations/en.json` (~10,736 سطر)

### 5.5 قاعدة RTL

استخدم خصائص Tailwind المنطقية فقط:
- `ms-` بدل `ml-` (margin-inline-start)
- `me-` بدل `mr-` (margin-inline-end)
- `ps-` بدل `pl-` (padding-inline-start)
- `pe-` بدل `pr-` (padding-inline-end)
- `text-start` بدل `text-left`
- `text-end` بدل `text-right`

**لا تستخدم أبداً:** `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right` في مكونات SaaS.

### 5.6 قاعدة Zod Decimals

Prisma auto-generates `packages/database/prisma/zod/index.ts` الذي يتعطل بعد كل `prisma generate` بسبب مشكلة Decimal types وغياب `import { Prisma }`. الحل مطبّق عبر سكربت `packages/database/fix-zod-import.js` الذي يعمل تلقائياً كـ post-generate hook في أمر `generate`:

```jsonc
"generate": "dotenv -c -e ../../.env -- prisma generate --no-hints && node fix-zod-import.js"
```

**الأوامر الصحيحة:**
- ✅ `pnpm --filter @repo/database generate` (وليس `db:generate`)
- ✅ `pnpm --filter @repo/database push` (وليس `db:push`)
- ✅ من `packages/database/`: `pnpm run generate` / `pnpm run push`

### 5.7 قاعدة Prisma

```typescript
// ✅ صحيح — استخدم Number() للتحويل من Decimal
const amount = Number(invoice.total);

// ❌ خطأ — لا تمرر Decimal مباشرة
const amount = invoice.total; // Prisma Decimal !== JavaScript number
```

### 5.8 قاعدة تنسيق الأرقام

```typescript
// أعداد: en-US format (1,234.56)
new Intl.NumberFormat("en-US").format(value);

// عملات: en-SA format (1,234.56 ر.س)
new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(value);
```

### 5.9 قاعدة فحص الأنواع (Build & Type Checking) ⚠️ حرجة

**الأمر الصحيح الوحيد** للـ type-check هو من جذر المشروع:

```bash
# ✅ صحيح — من جذر المشروع
pnpm --filter @repo/web type-check
pnpm --filter @repo/database type-check

# ❌ ممنوع — ينتج ~5600 خطأ module resolution وهمي
cd apps/web && npx tsc --noEmit
```

**السبب:** تشغيل `tsc` داخل `apps/web` يفقد path mappings من الـ monorepo ويُسبب أخطاء import وهمية على كل ملف تقريباً. هذه المشكلة استهلكت 6+ جلسات Claude Code سابقاً.

**بعد أي تغيير Prisma schema:** شغّل `pnpm --filter @repo/database generate` (يستدعي `fix-zod-import.js` تلقائياً) قبل type-check.

### 5.10 قاعدة التعديل (Editing Conventions)

**اقرأ قبل التعديل، دائماً.** قبل أي Edit:
1. استخدم `view` لقراءة الملف كاملاً أولاً
2. لاحظ بدقة: tabs أم spaces، 2 أم 4 spaces، CRLF أم LF
3. إذا فشل Edit مرتين بسبب whitespace mismatch → انتقل فوراً إلى `Write` كامل أو `sed` عبر Bash. **لا تُحاول مرة ثالثة** — أنت تُضيع وقتاً.

هذه القاعدة تمنع دورات تصحيح متكررة (كانت 61 فشل Edit في آخر 6 أسابيع).

### 5.11 قاعدة Zod v4 + oRPC (حرجة)

المشروع يستخدم Zod v4 مع oRPC. مخالفة هذه القواعد = runtime errors صامتة:

```typescript
// ❌ ممنوع — .nullish() يُدخل null ويكسر oRPC serialization
z.string().nullish()

// ✅ البديل — .transform() للحقول الاختيارية
z.string().optional().transform(v => v ?? "")

// ❌ ممنوع — رمي Error عادي لا يظهر للـ client
throw new Error("فشل")

// ✅ صحيح — ORPCError مع code مناسب
throw new ORPCError("BAD_REQUEST", { message: "فشل" })

// ❌ ممنوع — .trim() مع .optional()
z.string().trim().optional()  // يكسر في Zod v4

// ✅ البديل
z.string().optional().transform(v => v?.trim() ?? "")
```

### 5.12 قاعدة التصحيح (Debugging Workflow)

بعد إصلاح أي bug، **لا تعتبره منتهياً قبل smoke test للمسار الكامل**:
- إصلاح validation قد يكشف unique constraint bug مختبئ
- إصلاح API قد يكشف cache invalidation مفقود في الـ frontend
- إصلاح UI قد يكشف hydration mismatch

**الطريقة:** نفّذ الـ full user flow من البداية للنهاية — ليس فقط الكود المُعدَّل.

**أسلوب التحقيق قبل الإصلاح (مهم):** للأخطاء الغامضة، اقرأ الملفات المعنية، تتبّع تدفّق البيانات، واشرح السبب الجذري قبل أي تعديل. لا تجرّب حلولاً عشوائية — 19 جلسة سابقة ضاعت في "wrong approach" بسبب القفز للإصلاح قبل التشخيص.

---

## 6. أنماط الكود والمعمارية

### 6.1 تدفق البيانات (Data Flow)

```
المستخدم → React Component (Hook Form + Zod)
         → useMutation (React Query)
         → HTTP POST /api/rpc (oRPC via Hono)
         → Procedure Chain:
           publicProcedure (context)
           → protectedProcedure (session + isActive + rate limit READ:60/min)
           → subscriptionProcedure (subscription + rate limit WRITE:20/min)
         → Zod Input Validation
         → Handler:
           → verifyOrganizationAccess() (membership + permission)
           → enforceFeatureAccess() (plan gate)
           → Business Logic (Prisma queries)
           → orgAuditLog() (audit trail)
           → Return result
         → Prisma ORM (parameterized queries)
         → PostgreSQL (Supabase)
```

### 6.2 نمط إنشاء API Endpoint

```typescript
// packages/api/modules/[module]/procedures/[action].ts
import { subscriptionProcedure } from "../../trpc";
import { z } from "zod";

export const createSomething = subscriptionProcedure
  .input(z.object({
    organizationId: z.string(),
    name: z.string().min(1).max(200),
    // ... fields with .min(), .max(), .nonnegative() etc.
  }))
  .handler(async ({ input, context }) => {
    await verifyOrganizationAccess(context, input.organizationId, "module.create");
    // Business logic...
    await orgAuditLog(context, input.organizationId, "ITEM_CREATED", { ... });
    return result;
  });
```

### 6.3 نمط React Query Hooks

```typescript
// Stale times defined in query-stale-times.ts
const STALE_TIMES = {
  ORGANIZATION: 15 * 60 * 1000,  // 15 min — rarely changes
  PROJECTS_LIST: 5 * 60 * 1000,   // 5 min
  INVOICES: 2 * 60 * 1000,        // 2 min
  NOTIFICATIONS: 30 * 1000,        // 30 sec — frequently changes
};
```

### 6.4 نمط المكونات

```typescript
// "use client" — required for interactive components
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("module.section");
  // Never hardcoded Arabic strings
  return <h1>{t("title")}</h1>;
}
```

### 6.5 نمط Loading States

```typescript
// app/(saas)/app/[organizationSlug]/module/loading.tsx
import { ListTableSkeleton } from "@/modules/saas/shared/components/skeletons";
export default function Loading() {
  return <ListTableSkeleton rows={10} cols={5} />;
}
// 230 loading.tsx files exist — maintain this pattern for any new pages
```

---

## 7. وحدة دراسات الكميات والتسعير (الأكبر والأعقد)

### 7.1 أنواع الدراسات (3 أنواع فعّالة)

| النوع | الوصف | المراحل |
|-------|-------|---------|
| `FULL_STUDY` | دراسة كاملة من الصفر | الكميات → المواصفات → تسعير التكلفة → التسعير |
| `COST_PRICING` | تسعير تكلفة (بدون محركات حساب) | نفس المراحل لكن بجداول يدوية |
| `QUICK_PRICING` | تسعير سريع | يتخطى للتسعير مباشرة |

**ملاحظة:** المراحل كانت 6 (+ عرض سعر + تحويل لمشروع) واختُصرت إلى 4 مع زر "تحويل لعرض سعر" أحمر يظهر بعد اعتماد مرحلة التسعير.

### 7.2 نطاقات العمل (Work Scopes)

| النطاق | الوصف | المحرك |
|--------|-------|--------|
| `STRUCTURAL` | أعمال إنشائية | structural-calculations.ts (2,926 سطر) + other-structural-calculations.ts (855 سطر) |
| `FINISHING` | تشطيبات | derivation-engine.ts (1,523 سطر) + finishing-categories/-templates/-types/-links/-room-types |
| `MEP` | كهروميكانيكية | mep-derivation-engine.ts (2,493 سطر) + mep-categories/-prices/-room-profiles/-merge |
| `CUSTOM` | يدوي/مخصص | ManualItemsTable |

### 7.3 الأقسام الإنشائية (8 أقسام)

| القسم | الملف/المجلد | الحجم | العناصر |
|-------|-------|-------|---------|
| صبة النظافة | `PlainConcreteSection.tsx` | 511 سطر | خرسانة عادية تحت القواعد |
| القواعد | `foundations/` (3 ملفات + forms/) | 2,119 سطر | معزولة، مشتركة، شريطية، لبشة (مُعاد هيكلته) |
| الميدة | `BeamsSection.tsx` | 455 سطر | كمرات ربط |
| الأعمدة | `columns/` (6 ملفات) | 1,580 سطر | أعمدة + رقاب أعمدة (مُعاد هيكلته) |
| الأسقف | `slabs/` (6 forms + helpers) | 4,471 سطر | صلب، مسطح، هوردي، كمرات عريضة (مُعاد هيكلته) |
| البلوك | `blocks/` (5 ملفات + index) | 1,372 سطر | 6 تصنيفات جدران (مُعاد هيكلته) |
| السلالم | `StairsSection.tsx` | 895 سطر | 4 طبقات تسليح |
| عناصر إنشائية أخرى | `other-structural/` (1 رئيسي + 9 forms) | 1,582 سطر | 11 عنصر (بيارة، خزان، مصعد، إلخ — مُعاد هيكلته) |

### 7.4 ثوابت المحرك الإنشائي (Saudi Defaults — SBC 304 / ACI 318)

```typescript
DEV_LENGTH_MULTIPLIER: 40    // طول التماسك = 40 × القطر
HOOK_MULTIPLIER: 12           // الخطاف = 12 × القطر
TOP_BAR_EXTENSION_RATIO: 0.25 // امتداد الحديد العلوي = 25% من البحر
STOCK_LENGTH: 12              // طول السيخ القياسي = 12 متر
LAP_SPLICE: 40                // وصلة التراكب = 40 × القطر
```

### 7.5 تدفق البيانات في الكميات الإنشائية

```
1. معالج تهيئة المبنى (BuildingWizard)
   → يحدد الأدوار والارتفاعات والمساحات
   → يُحفظ في structuralSpecs (JSONB field)

2. محرك اشتقاق الارتفاعات (height-derivation-engine.ts)
   → يحسب ارتفاعات الأعمدة والبلوك لكل دور تلقائياً
   → من المناسيب المعمارية (±0.00 = مستوى الشارع)

3. أقسام إدخال البيانات (Sections)
   → المستخدم يدخل أبعاد كل عنصر (أو يقبل الافتراضيات)
   → كل عنصر يُحسب فوراً (client-side)
   → النتائج تُحفظ كـ StructuralItem في DB

4. جدول ملخص BOQ (BOQSummaryTable)
   → boq-aggregator.ts يجمع كل العناصر
   → 3 تبويبات: ملخص | طلبية المصنع | تفاصيل التقطيع
   → فلترة بالدور (كل دور على حدة أو المشروع بالكامل)
   → فصل المواد (خرسانة | حديد | بلوك) عند اختيار دور

5. تصدير (boq-export.ts)
   → Excel (SheetJS) + PDF (window.print)
```

### 7.6 نموذج البيانات للكميات

```prisma
model StructuralItem {
  id              String   @id @default(cuid())
  costStudyId     String
  category        String   // "foundations", "columns", "slabs", "blocks", "stairs", "beams", "plainConcrete", "otherStructural"
  name            String
  quantity        Int      @default(1)
  dimensions      Json     // أبعاد العنصر (width, length, height, etc.)
  concreteVolume  Decimal? // حجم الخرسانة (م³)
  steelWeight     Decimal? // وزن الحديد (كجم)
  formworkArea    Decimal? // مساحة الشدات (م²)
  blockCount      Int?     // عدد البلوك
  concreteGrade   String?  // C25, C30, C35, etc.
  floorLabel      String?  // "الأساسات", "الدور الأرضي", etc.
  // ... more fields
}
```

---

## 8. قاعدة البيانات

### 8.1 إحصائيات

- **132 model** + **103 enum** في Prisma Schema (6,320 سطر)
- **259+ indexes** + **40+ unique constraints**
- **Decimal(15,2)** لكل الحقول المالية
- **Cascade Delete** شامل — حذف المنظمة يحذف كل شيء
- **organizationId** كـ index على كل model
- طبقة الاستعلام (`packages/database/prisma/queries/`): accounting.ts (2,295 سطر) + finance.ts (2,296 سطر) أكبر ملفين

### 8.2 نماذج رئيسية (مجمّعة)

| الفئة | النماذج | العدد |
|-------|---------|-------|
| المصادقة | User, Session, Account, Verification, Passkey, TwoFactor, Role, UserInvitation | 8 |
| المنظمات | Organization, Member, Invitation, IntegrationSettings, FinanceSettings, AuditLog, Sequence | 7 |
| الاشتراكات | PlanConfig, Purchase, SubscriptionEvent | 3 |
| المشاريع | Project, ProjectTeamMember, ProjectNote + 15 child models | 18 |
| التنفيذ | WBSItem, Milestone, ProjectActivity, ActivityDependency, Checklist, Baseline, Alert | 7 |
| المالية | FinanceInvoice, InvoiceItem, InvoicePayment, FinanceExpense, FinancePayment, Transfer, BankAccount, CashAccount, PaymentVoucher | 9+ |
| المحاسبة | ChartAccount, JournalEntry, JournalEntryLine, AccountingPeriod, RecurringJournalTemplate, BankReconciliation, BankReconciliationItem | 7 |
| الاستلام | HandoverProtocol, HandoverProtocolItem | 2 |
| الشركة/HR | Employee, EmployeeAssignment, CompanyExpense, Asset, PayrollRun, LeaveRequest, etc. | 12+ |
| التسعير | CostStudy, StudyStage, StructuralItem, FinishingItem, MEPItem, LaborItem, CostingItem, ManualItem, SectionMarkup, Quote | 10 |
| العملاء | Client, ClientContact, Quotation, QuotationItem, Lead, LeadNote, LeadActivity | 7 |
| مقاولو الباطن | SubcontractContract, PaymentTerm, ChangeOrder, Payment, Item, Claim, ClaimItem | 7 |
| أخرى | Attachment, ShareLink, Notification, ProjectMessage, DigestSubscription, etc. | 10+ |

### 8.3 Connection Pooling

```
DATABASE_URL = postgresql://...?pgbouncer=true   # Transaction Pooler (port 6543)
DIRECT_URL = postgresql://...                     # Direct (migrations only)
```

**الإعداد الحالي:**
- Pool mode: `transaction` (Supabase default)
- `pg` Pool singleton via `globalThis` مع `max: 5` connections
- `PrismaPg(pool)` syntax — **ليس** `{ pool }`
- `pgbouncer=true` parameter مطلوب دائماً

---

## 9. نظام الصلاحيات

### 9.1 الأدوار الافتراضية (6)

| الدور | الوصف |
|-------|-------|
| OWNER | صاحب المؤسسة — كل الصلاحيات |
| MANAGER | مدير — كل شيء عدا الحذف والإعدادات الحساسة |
| ACCOUNTANT | محاسب — المالية + المشتريات |
| ENGINEER | مهندس — المشاريع + التنفيذ + الكميات |
| SUPERVISOR | مشرف ميداني — التقارير اليومية + الصور |
| VIEWER | مشاهد — قراءة فقط |

### 9.2 الصلاحيات (42 permission في 8 أقسام)

الأقسام: `projects`, `finance`, `company`, `execution`, `pricing`, `settings`, `admin`, `reports`
كل قسم يحتوي: `.view`, `.create`, `.edit`, `.delete` + صلاحيات خاصة.

### 9.3 Feature Gating (9 features)

| Feature | FREE | PRO |
|---------|------|-----|
| projects.create | 1 max | ∞ |
| members.invite | 2 max | ∞ |
| ai.chat | 10 max | ∞ |
| export.pdf | ❌ | ✅ |
| cost-study.save | ❌ | ✅ |
| quotation.export | ❌ | ✅ |
| owner-portal.activate | ❌ | ✅ |
| reports.detailed | ❌ | ✅ |
| zatca.qr | ❌ | ✅ |

---

## 10. مشاكل مفتوحة (تحتاج إصلاح)

| المشكلة | الأولوية | التفاصيل |
|---------|---------|---------|
| بطء التنقل بين الصفحات | 🔴 حرج | Cache-Control: no-store على كل /app/* routes + waterfall layouts + 11 Suspense فقط من 171 صفحة |
| صفحات "ترفرف" عند الفتح | 🔴 حرج | 4-5 layouts متداخلة كل واحد يعمل await لاستعلام DB |
| تضاعف تكلفة المواد في ملخص التسعير | 🟠 عالي | 18,134.49 يظهر 36,268.98 — المصنعيات صحيحة |
| Region mismatch | 🟠 عالي | Vercel Dubai ↔ Supabase Mumbai = ~20-30ms per query |
| مكونات >1000 سطر (10+) | 🟡 متوسط | تحتاج تقسيم لتحسين bundle size |
| CSP unsafe-inline | 🟡 متوسط | يضعف الحماية ضد XSS |

**مشاكل محلولة سابقاً:** Redirect loop، pg Pool state، middleware→proxy، الهالك السالب في اللبشة، الحديد العلوي في القواعد، أسماء العناصر تُمسح، Prisma 6→7، Error Boundaries (16)، غياب اختبارات (26 ملف اليوم)، PDF export، توحيد AddExpenseDialog (حذف shared + ExpenseForm + /expenses/new pages). *(للتفاصيل التاريخية، راجع git log)*

---

## 11. أوامر التطوير

```bash
# تشغيل التطوير
pnpm dev

# بناء الإنتاج
pnpm build

# فحص الأنواع — دائماً من جذر المشروع
pnpm --filter @repo/web type-check
pnpm --filter @repo/database type-check

# توليد Prisma client (مع إصلاح Zod تلقائي عبر fix-zod-import.js)
pnpm --filter @repo/database generate

# تطبيق تغييرات Schema
pnpm --filter @repo/database push

# Migration (في حال استخدام migrate بدل push)
pnpm --filter @repo/database migrate

# Linting
pnpm lint

# تنسيق الكود
pnpm format

# اختبارات (Vitest)
pnpm test                              # كل الاختبارات
pnpm --filter @repo/api test           # API فقط
pnpm --filter @repo/database test      # Database فقط

# E2E (Playwright — يتطلب build أولاً)
cd apps/web && npx playwright test
```

### أوامر Windows-specific

```powershell
# زيادة حجم المخرجات (قبل تشغيل Claude Code)
$env:CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000

# حذف كاش Next.js (إجباري بعد تغييرات UI)
Remove-Item -Recurse -Force apps/web/.next

# Git identity (مطلوب على أجهزة جديدة)
git config --global user.name "jawdat"
git config --global user.email "your@email.com"
```

---

## 12. نصائح حاسمة لـ Claude Code

### 12.1 قبل أي مهمة

1. **اقرأ الملفات قبل التعديل** — استخدم `view` أو `grep` لفهم البنية الحالية
2. **تحقق من وجود الحقول في Schema** — قبل استخدام أي model أو field تأكد إنه موجود فعلاً في Prisma schema
3. **تحقق من المسارات** — `grep -r "ImportName" --include="*.ts" --include="*.tsx" -l` قبل افتراض import paths
4. **لا تفترض أسماء الإجراءات** — اقرأ ملف router.ts للـ module المعني

### 12.2 أثناء التنفيذ

- **لا تضف حقول UI جديدة بدون طلب صريح** — فلسفة مسار: البساطة الجذرية، الحسابات تعمل في الخلفية بافتراضيات سعودية
- **المحركات الحسابية مقدّسة** — لا تعدّل المعادلات، فقط أعد تنظيم UI حولها
- **لا تحذف كود — أخفِه** — عبر فلترة المصفوفة أو شرط عدم العرض
- **كل مرحلة → type-check** — لا تنتقل للمرحلة التالية بدون تحقق TypeScript
- **الأخطاء الموجودة مسبقاً مقبولة** — بعض أخطاء TypeScript في `.next/types` وملفات اختبار هي pre-existing

### 12.3 بعد التنفيذ

- **احذف `.next` وأعد التشغيل** بعد أي تغيير UI — التغييرات لن تظهر بدون ذلك
- **أعط ملخصاً واضحاً** — ما الملفات التي تغيّرت ولماذا
- **لا تعمل auto-commit** إلا إذا طُلب منك صراحةً

### 12.4 مشاكل Windows الشائعة

- **pnpm بطيء جداً** — تجنب `pnpm install` الكامل، استخدم `pnpm --filter @repo/web add package`
- **النص العربي معكوس في Terminal** — استخدم ملفات `.md` لتمرير البرومبتات الطويلة
- **`tsc` يأخذ وقتاً طويلاً** — استخدم `grep` المستهدف + scoped builds
- **ECONNRESET في dev mode** — طبيعي على Windows مع Turbopack، أعد تشغيل `pnpm dev`

### 12.5 أنماط حرجة لتجنب الأخطاء

```typescript
// ❌ لا تفعل — Dead code يسبب build failures
import { ProcurementModel } from "@repo/database"; // قد لا يوجد في Schema

// ✅ افعل — تحقق أولاً
// grep -r "ProcurementModel" packages/database/prisma/schema/ --include="*.prisma"

// ❌ لا تفعل — Decimal مباشرة
const total = item.total + item.vat; // Prisma Decimal لا يدعم +

// ✅ افعل
const total = Number(item.total) + Number(item.vat);

// ❌ لا تفعل — hardcoded direction
className="ml-4 text-left"

// ✅ افعل
className="ms-4 text-start"

// ❌ لا تفعل — publicProcedure لبيانات المنظمة
export const listItems = publicProcedure...

// ✅ افعل
export const listItems = protectedProcedure... // read
export const createItem = subscriptionProcedure... // write
```

---

## 13. بنية وحدة API (45 module)

> الأعداد تقريبية للـ endpoints (لكل procedure file عادةً 1-3 endpoints). الأرقام مشتقة من بنية المجلدات وليست مُعدّة عبر AST.

| الوحدة | Procedures/Endpoints | الملاحظات |
|--------|-----------|---------|
| finance | 23 procedure file (120+ endpoint) | أكبر وحدة — فواتير، مصروفات، مدفوعات، تحويلات، بنوك، سندات قبض/صرف، تقارير، تصنيفات مصروفات، open-documents |
| company | 87 endpoints | HR — موظفين، أصول، رواتب، إجازات، مصروفات متكررة، expense-payments، payroll |
| quantities | 42 procedure file | دراسات، كميات، CRUD + finishing-* + mep-* + structural-* + manual + costing + markup + spec-templates |
| pricing | dashboard + leads (~17 procedure) | لوحة تسعير + إدارة العملاء المحتملين (links، files، convert-to-project) |
| accounting | 12 procedure file (~36 endpoint) | journal-entries (768 سطر)، owner-drawings (1,204 سطر)، year-end-closing (790 سطر)، capital-contributions، organization-owners، chart-of-accounts، partners-finance، account-statements، backfill |
| super-admin | 29 | لوحة تحكم المشرف العام |
| project-execution | 28 | أنشطة، مراحل، تقدم، Gantt |
| subcontracts | 26 | عقود باطن، مدفوعات، مطالبات |
| project-finance | 17 | مالية المشروع — عقد، مصروفات، مطالبات |
| handover | 15 | محاضر استلام (ابتدائي، نهائي، بنود، تسليم) |
| project-documents | 13 | مستندات — تصنيف، إصدارات، موافقات |
| project-change-orders | 12 | أوامر التغيير |
| project-owner | 12 | بوابة المالك |
| project-field | 11 | تقارير يومية، صور، مشاكل |
| project-boq | ~10 | جدول كميات المشروع (BOQ) — CRUD + import |
| project-chat | ~8 | محادثات المشروع — قنوات فريق/مالك |
| dashboard | 9 | لوحة التحكم الرئيسية |
| ai | 6 | المساعد الذكي (27 tool registry + legacy tools) |
| + 27 more modules | ~260 | باقي الوحدات (admin, ai, attachments, categories, contact, digests, exports, integrations, notifications, onboarding, organizations, org-users, payments, project-contract, project-insights, project-payments, project-quantities, project-team, project-templates, project-timeline, project-updates, projects, roles, shares, users, zatca, activation-codes) |
| **المجموع** | **700+ endpoint موزّعة على 521 ملف TS داخل packages/api** | |

---

## 14. نظام التسعير (Pricing Pipeline)

### 14.1 المراحل الحالية (4 مراحل)

```
الكميات → المواصفات → تسعير التكلفة → التسعير
  │            │              │              │
  │            │              │              └→ زر "تحويل لعرض سعر" (أحمر)
  │            │              │                 → ينسخ البنود → /quotations/new
  │            │              │
  │            │              └→ 3 تبويبات: المواد | المصنعيات | ملخص
  │            │                 + تسعير الحديد بـ 3 مجموعات (Ø6, Ø8, باقي)
  │            │
  │            └→ مواصفات المواد + قائمة المواد (BOM)
  │
  └→ 4 تبويبات: إنشائي | تشطيبات | كهروميكانيكي | يدوي
     + معالج تهيئة المبنى + 8 أقسام إنشائية + BOQ Summary
```

### 14.2 طرق الهوامش في التسعير

| الطريقة | الوصف |
|---------|-------|
| `uniform` | نسبة ربح موحدة على الكل |
| `per_section` | نسبة مختلفة لكل قسم (إنشائي، تشطيبات، MEP) |
| `manual_price` | سعر بيع يدوي لكل بند |
| `per_sqm` | سعر لكل متر مربع |

### 14.3 Hook التحكم الرئيسي: `useStudyConfig`

```typescript
// apps/web/modules/saas/pricing/hooks/useStudyConfig.ts
// يحدد المراحل المفعّلة والتبويبات الظاهرة بناءً على:
// - studyType (FULL_STUDY, COST_PRICING, QUICK_PRICING)
// - workScopes (STRUCTURAL, FINISHING, MEP, CUSTOM)
// - isEmptyTableMode (لـ COST_PRICING — جداول يدوية بدل محركات)
```

---

## 15. المساعد الذكي (AI Assistant)

- **Model:** Claude Sonnet 4 (via Vercel AI SDK)
- **Streaming:** `POST /api/ai/assistant` مع `stepCountIs(8)` و `maxOutputTokens: 4000`
- **package:** `packages/ai/` (55 ملف، 14 module file)

### الأدوات (Registry — 27 tool)

موزّعة على 14 ملف في `packages/ai/tools/modules/`:

- **accounting-tools** (3) — chart, journal, statements
- **dashboard-tools** (2)
- **documents-tools** (1)
- **execution-tools** (3) — activities, milestones, progress
- **field-tools** (1)
- **leads-tools** (3) — list, get, stats
- **permissions-tool** (1)
- **project-finance-tools** (2)
- **projects-tools** (2)
- **quantities-tools** (3) — studies, items, summary
- **quotations-tools** (3)
- **subcontracts-tools** (2)
- **vouchers-tools** (1)

بالإضافة إلى الأدوات الـ legacy (`queryProjects`, `queryFinance`, `queryExecution`, `queryTimeline`, `navigateTo`, `queryCompany`).

### بنية المساعد

- **Page Context:** Zustand store يرسل snapshot الصفحة الحالية مع كل رسالة AI
- **Module/Tool Registry:** extensible — إضافة module أو tool جديد = ملف واحد فقط
- **تقييد النطاق:** المساعد يجيب فقط على أسئلة متعلقة ببيانات مسار — يرفض الأسئلة الهندسية العامة
- **Always Available Tools:** projects, execution, quantities, finance, leads, accounting, subcontracts, dashboard
- **Context-Aware:** documents, field, change-orders تتفعل تلقائياً حسب الصفحة الحالية

### إضافة أداة AI جديدة

```
1. أنشئ packages/ai/tools/modules/[name]-tools.ts
2. استخدم registerTool({ name, description, moduleId, parameters: z.object({}), execute })
3. أضف import في packages/ai/tools/modules/index.ts
4. أضف اسم الأداة في relatedTools بتعريف الوحدة المناسبة
5. (اختياري) أضف الوحدة في route.ts إذا مطلوبة من أي صفحة
```

---

## 16. على الأفق (Roadmap)

### قريب (أسابيع)
- إصلاح بطء التنقل (Cache-Control + Suspense + parallel layouts)
- إصلاح تضاعف تكلفة المواد في ملخص التسعير
- Beta مغلق مع مستخدمين محدودين
- ZATCA Phase 2 production go-live

### متوسط (أشهر)
- وحدة الأعمال الترابية (حفر، ردم، تدعيم، تجفيف)
- توسيع الأقسام الإنشائية
- تطبيق React Native / Expo (MVP: مشرف ميداني)

### بعيد (6+ أشهر)
- مكتبة أسعار مجتمعية (13 موقع مورد سعودي)
- 7 أركان AI
- ربط BOQ بالتنفيذ (Earned Value: CPI/SPI)
- Offline mode + GPS tagging

---

## 17. دليل سريع: كيف أنفذ مهمة شائعة

### إضافة صفحة جديدة

```
1. أنشئ app/(saas)/app/[organizationSlug]/module/page.tsx
2. أنشئ app/.../module/loading.tsx (skeleton)
3. أضف المكون في modules/saas/module/components/
4. أضف مفاتيح الترجمة في ar.json + en.json (كلاهما!)
5. أضف رابط في SidebarNav.tsx (مع prefetch)
6. أضف الصلاحية في navigation guard
```

### إضافة API Endpoint

```
1. أنشئ packages/api/modules/[module]/procedures/[action].ts
2. استخدم subscriptionProcedure (write) أو protectedProcedure (read)
3. أضف Zod schema مع .min(), .max(), .nonnegative()
4. أضف verifyOrganizationAccess() + orgAuditLog()
5. سجّل في packages/api/modules/[module]/router.ts
6. تحقق بـ pnpm --filter @repo/web type-check (من الجذر!)
```

### إصلاح مشكلة UI لا تظهر

```
1. احذف .next: Remove-Item -Recurse -Force apps/web/.next
2. أعد تشغيل: pnpm dev
3. Hard refresh في المتصفح: Ctrl+Shift+R
4. إذا لا يزال — تحقق من console errors في المتصفح
```

### إضافة قسم إنشائي جديد

```
1. أضف الأنواع في types/ (interfaces + defaults)
2. أضف الثوابت في constants/ (نسب تسليح، افتراضيات سعودية)
3. أضف الحسابات في lib/structural-calculations.ts → دالة calculate[Element]()
4. أنشئ [Element]Section.tsx في components/studies/sections/
5. أضف في StructuralAccordion.tsx كقسم جديد
6. أضف في boq-aggregator.ts (SECTION_ORDER + SECTION_LABELS + SECTION_ICONS)
7. أضف الترجمات (~20-30 مفتاح في ar.json + en.json)
8. تحقق: pnpm --filter @repo/web type-check → pnpm build
```

---

## 18. النظام المحاسبي المتكامل

### 18.1 نظرة عامة

نظام محاسبي يعمل **دائماً بلا toggle**. يشمل: دليل حسابات هرمي (يُنشأ تلقائياً)، قيود يومية تلقائية ويدوية، فترات محاسبية، 10 تقارير، دفتر أستاذ، أرصدة افتتاحية، كشوف حساب، سندات قبض/صرف، تسوية بنكية، قيود متكررة، فحص صحة محاسبية، تصدير Excel.

**قاعدة صامتة:** أخطاء القيود التلقائية **لا تكسر العملية المالية الأصلية أبداً** — تُسجّل في `JOURNAL_ENTRY_FAILED` audit log.

### 18.2 المعمارية

```
المحاسبة دائماً — لا toggle
    ↓
أول عملية مالية → seedChartOfAccounts() → 48 حساب افتراضي
    ↓
كل عملية → auto-journal.ts → قيد POSTED
    ↓
القيود → التقارير (ميزان مراجعة، ميزانية، قائمة دخل، مراكز تكلفة)
```

### 18.3 Models المحاسبية (7)

`ChartAccount`, `JournalEntry`, `JournalEntryLine`, `AccountingPeriod`, `RecurringJournalTemplate`, `BankReconciliation`, `BankReconciliationItem`

### 18.4 القيود التلقائية (17 hook في `auto-journal.ts` — 922 سطر)

| Hook | الحدث | القيد | Prefix |
|------|-------|-------|--------|
| `onInvoiceIssued` | إصدار فاتورة | DR: 1120 / CR: 4100 + 2130 | INV-JE |
| `onInvoicePaymentReceived` | تحصيل فاتورة | DR: بنك / CR: 1120 | RCV-JE |
| `onCreditNoteIssued` | إشعار دائن | DR: 4100 + 2130 / CR: 1120 | CN-JE |
| `onExpenseCompleted` | مصروف | DR: مصروف + 1150 / CR: بنك | EXP-JE |
| `onTransferCompleted` | تحويل بنكي | DR: بنك مستلم / CR: بنك مرسل | TRF-JE |
| `onSubcontractPayment` | دفعة مقاول باطن | DR: 5200 / CR: بنك | SUB-JE |
| `onSubcontractClaimApproved` | اعتماد مطالبة باطن | DR: 5200 / CR: 2120 | SCL-JE |
| `onPayrollApproved` | رواتب | DR: 6100 / CR: بنك + 2170 | PAY-JE |
| `onOrganizationPaymentReceived` | مقبوض مباشر | DR: بنك / CR: 4300 | RCV-JE |
| `onProjectPaymentReceived` | دفعة مشروع | DR: بنك / CR: 4100 | PRJ-JE |
| `onProjectClaimApproved` | اعتماد مستخلص مشروع | DR: 1120 / CR: 4100 | PCL-JE |
| `onReceiptVoucherIssued` | سند قبض | DR: بنك / CR: حسب النوع | RV-JE |
| `onPaymentVoucherApproved` | سند صرف | DR: حسب النوع / CR: بنك | PV-JE |
| `onOwnerDrawing` | سحب أرباح | DR: 3200 / CR: بنك | OD-JE |
| `onOwnerDrawingCancelled` | إلغاء سحب أرباح | عكس القيد | — |
| `onCapitalContribution` | مساهمة رأس المال | DR: بنك / CR: 3100 | CC-JE |
| `onFinalHandoverCompleted` | إفراج ضمان (نهائي) | DR: 2150 / CR: 1120 | HR-JE |

**أدوات إضافية:** `reverseAutoJournalEntry` (لإلغاء قيد عند delete/cancel)، `invalidateAccountingCache`.

**Format ترقيم:** `{PREFIX}-{YEAR}-{XXXX}` (ذري عبر `nextSequenceValue`)

**نقاط الاستدعاء:** 19 ملف يستورد `auto-journal` عبر api modules (finance, accounting, company, handover, project-finance, project-payments, subcontracts).

### 18.5 الميزات المنفّذة (21)

دفتر الأستاذ، أرصدة افتتاحية، كشوف حساب، سند صرف، ترحيل جماعي، مراكز التكلفة، تسوية بنكية، قيود متكررة، طباعة التقارير، ربط ثنائي الاتجاه، ترقيم حسب النوع، لوحة محاسبة، بحث متقدم، سجل تدقيق بصري، تصدير Excel، المبلغ بالحروف العربية، VAT تفصيلي، سندات صرف كاملة، كشوف حساب متقدمة، فحص صحة محاسبية، تكامل محاسبي شامل.

### 18.6 نمط oRPC في المحاسبة

```typescript
// ✅ Query (protectedProcedure)
const { data } = useQuery(
  orpc.accounting.accounts.getLedger.queryOptions({
    input: { organizationId, id: accountId, dateFrom, dateTo },
  }),
);

// ✅ Mutation (subscriptionProcedure) — بدون { input: }
bulkPostMutation.mutate({ organizationId, entryIds: [...] });

// ❌ خطأ شائع — لا تلف المعاملات في { input: }
mutation.mutate({ input: { organizationId } }); // هذا خطأ!
```

### 18.7 حسابات النظام الافتراضية (Saudi Construction)

| الكود | الحساب | النوع |
|-------|--------|-------|
| 1110 | النقدية والبنوك | ASSET |
| 1120 | العملاء | ASSET |
| 1150 | ضريبة مدخلات | ASSET |
| 2110 | الموردون | LIABILITY |
| 2120 | مستحقات مقاولي الباطن | LIABILITY |
| 2130 | VAT المستحقة | LIABILITY |
| 2150 | محتجزات (ضمان) | LIABILITY |
| 2170 | تأمينات اجتماعية | LIABILITY |
| 3100 | رأس المال | EQUITY |
| 3200 | أرباح مبقاة | EQUITY |
| 4100 | إيرادات المشاريع | REVENUE |
| 4300 | إيرادات أخرى | REVENUE |
| 5100 | مواد ومشتريات | EXPENSE |
| 5200 | مقاولو باطن | EXPENSE |
| 5300 | عمالة مباشرة | EXPENSE |
| 6100-6950 | مصروفات إدارية وتشغيلية | EXPENSE |

### 18.8 ضمانات سلامة البيانات المالية

القيود ذرية ($transaction)، رصيد البنك يُحدّث مع دفعة الفاتورة، state machines (فواتير/مستخلصات/سندات)، منع تعديل فاتورة ISSUED، حد مبلغ الإشعار الدائن، فحص الفترات المغلقة، entryNo فريد، ترقيم ذري للعقود، VAT بـ Decimal، audit log (`JOURNAL_ENTRY_FAILED`) لأخطاء القيود التلقائية في 19 ملف من api modules.

### 18.9 ملفات النظام المحاسبي

**Backend:**
- `packages/database/prisma/queries/accounting.ts` (**2,295 سطر** — القلب)
- `packages/api/modules/accounting/` (12 procedure file: journal-entries 768 سطر، owner-drawings 1,204 سطر، year-end-closing 790 سطر، capital-contributions 485، organization-owners 497، chart-of-accounts 356، partners-finance 452، account-statements، backfill، …)
- `packages/api/lib/accounting/auto-journal.ts` (**922 سطر**)
- `packages/api/lib/accounting/adjustment-templates.ts` (87 سطر) + `backfill.ts` (245 سطر)
- `packages/utils/lib/number-to-arabic-words.ts`

**Frontend:**
- صفحات: `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/` تشمل: accounting-dashboard، accounting-periods، accounting-reports (9 تقارير فرعية)، banks، capital-contributions، chart-of-accounts، clients، journal-entries، opening-balances، owner-drawings، partners، payment-vouchers، payments، receipt-vouchers، reports، settings، year-end-closing، statements
- مكونات: `apps/web/modules/saas/finance/components/accounting/` (17 ملف)
- `apps/web/modules/saas/finance/components/vouchers/` — 6 ملفات (PaymentVoucherForm/Detail/List + ReceiptVoucherForm/Detail/List)
- مجلدات: capital-contributions، owner-drawings، partners، statements (مكونات مخصّصة)

---

## 19. وحدات إضافية

### 19.1 محاضر الاستلام (Handover Protocols)

4 أنواع (`ITEM_ACCEPTANCE`, `PRELIMINARY`, `FINAL`, `DELIVERY`) مع state machine (DRAFT → PENDING_SIGNATURES → PARTIALLY_SIGNED → COMPLETED → ARCHIVED). تتبع ضمان + ربط محاسبي لإفراج المحتجزات عند `FINAL` عبر hook `onFinalHandoverCompleted` (DR: 2150 / CR: 1120 → HR-JE).

**Backend:** `packages/api/modules/handover/procedures/` (shared, list, crud, items, workflow, reports)
**Frontend:** `apps/web/modules/saas/projects/components/handover/` (4 مكونات: protocol form، detail، list، item dialog)
**Router:** `orpc.handover.*`

### 19.2 سندات الصرف (Payment Vouchers)

State machine: `DRAFT → PENDING_APPROVAL → ISSUED` (مع reject/cancel). ترقيم PMT-YYYY-XXXX. 10 endpoints: `finance.disbursements.*`. ربط محاسبي تلقائي للسندات اليدوية (PV-JE). عند الإلغاء من ISSUED → عكس القيد.

### 19.3 جدول كميات المشروع (Project BOQ)

وحدة منفصلة عن دراسات التسعير. 12 ملف frontend في `apps/web/modules/saas/projects/components/boq/`: فلترة، ترتيب، عمليات جماعية، إضافة/إدخال بنود بالجملة، نسخ من دراسات/عروض أسعار، استيراد Excel.

### 19.4 محادثات المشروع (Project Chat)

قناتان (TEAM + OWNER) مع polling كل 15 ثانية + mark-as-read. 7 ملفات frontend في `apps/web/modules/saas/projects/components/chat/`.

### 19.5 محرك عرض القوالب (Template Renderer)

`TemplateRenderer.tsx` (693 سطر) — فواتير + عروض أسعار، عناصر قابلة للسحب (هيدر، بيانات، جدول، مجاميع، شروط، توقيع، QR ZATCA، فوتر)، AR/EN + RTL، ألوان/خطوط/خلفيات قابلة للتخصيص، Watermark.

### 19.6 تصنيفات المصروفات الهرمية

39 تصنيف رئيسي + ~200 فرعي مربوطة بدليل الحسابات. `packages/utils/lib/expense-categories.ts` (887 سطر). `auto-journal.ts` يستخدم `getAccountCodeForCategory()`. تدعم الفئات القديمة عبر `LEGACY_CATEGORY_MAP` (25 mapping).

### 19.7 بنية الاختبارات

**Vitest** (workspace: api + database) + **Playwright** (E2E). 26 ملف اختبار:
- **API (17):** `permissions.test.ts`, `permissions/cross-tenant.test.ts`, `permissions/permission-matrix.test.ts`, `permissions/verify-project-access.test.ts`, `feature-gate.test.ts`, `feature-gate/subscription-procedure.test.ts`, `financial-calculations.test.ts`, `finance/decimal-precision.test.ts`, `modules/accounting/auto-journal.test.ts`, `modules/ai/tool-permissions.test.ts`, `modules/finance/invoice-lifecycle.test.ts`, `modules/finance/payment-voucher.test.ts`, `modules/quantities/structural-bounds.test.ts`, `rate-limit.test.ts`, `security/file-upload.test.ts`, `security/input-validation.test.ts`, `zatca-tlv.test.ts`
- **DB (5):** `smoke`, `invoice-calculations`, `sequences`, `attachments-validation`, `org-finance`
- **E2E (4):** `smoke.spec.ts`, `auth.spec.ts`, `public-pages.spec.ts`, + `home.spec.ts` (مع `fixtures/auth.ts`)
- **Frontend (5):** `apps/web/modules/saas/pricing/lib/__tests__/` (boq-aggregator, structural-calculations, cutting-optimizer, height-derivation-engine, boq-recalculator)

### 19.8 ثوابت التحقق المركزية

`packages/api/lib/validation-constants.ts`: حدود نصوص (`MAX_NAME=200`, `MAX_DESC=2000`, `MAX_LONG_TEXT=5000`)، حدود مالية (`MAX_FINANCIAL=999,999,999.99`)، دوال Zod جاهزة (`trimmedString`, `financialAmount`, `percentage`, `quantity`).

### 19.9 أنماط الطباعة

`@page { size: A4 portrait; margin: 15mm 10mm 10mm 10mm; }` في globals.css. `.print-page-break-before/after`, `.print-avoid-break`, `.signature-section`, `.totals-section`. `thead` يتكرر. Watermark عبر `[data-watermark]::before`. PDF export عبر `html2pdf.js` + `window.print()`.

### 19.10 نافذة إضافة المصروف الموحّدة

**المرجع الوحيد:** `apps/web/modules/saas/finance/components/expenses/AddExpenseDialog.tsx` — Dialog بثلاث تبويبات (مصروف عام / دفعة عقد باطن / سحب أرباح) تعتمد على ملفات `tabs/` مع `useImperativeHandle`. **لا تُنشئ نوافذ مصروف بديلة** — كل سياق يستخدم هذا.

**Props الاختيارية للتكيّف مع السياق:**
| Prop | السلوك |
|------|--------|
| `projectId?` | سياق مشروع ثابت: يُخفي Project selector في "عام"، ويُختار تلقائياً (قابل للتغيير) في "عقد باطن" و"سحب أرباح" |
| `initialSourceAccountId?` | يعبّئ الحساب المصدر مسبقاً في "عام" (قابل للتغيير) — مستخدَم من `BankDetail.tsx` |
| `expenseId?` | وضع التحرير — يُخفي التبويبات ويحمّل البيانات |
| `organizationSlug?` | اختياري، غير مستخدم في الجسم (legacy prop) |

**نقاط الاستدعاء (4):** الداشبورد (`QuickActionsGrid`)، الصفحة المالية الرئيسية (`ActionCards`)، قائمة المصروفات (`ExpensesList`)، سياق المشروع (`ExpensesTable` + `QuickActions` overview + `BankDetail`).

**Auto-journal:** التبويبات تنادي procedures موجودة (`finance.expenses.create`, `subcontracts.createPayment`, `accounting.ownerDrawings.create`) التي تستدعي hooks `onExpenseCompleted`/`onSubcontractPayment`/`onOwnerDrawing`+`onCapitalContribution` — **لا تعدّل auto-journal.ts** عند التعامل مع هذا Dialog.

**محذوف ولا تعيد إنشاءه:** `shared/components/AddExpenseDialog.tsx`, `finance/components/expenses/ExpenseForm.tsx`, صفحات `/finance/expenses/new` و `/projects/[projectId]/finance/expenses/new`. صفحة `company/expenses/ExpenseForm.tsx` **منفصلة** (HR employee expenses — لا تُدمج).

---

## 20. ملاحظات بيئة العمل

- **نظام التشغيل:** Windows (primary) + GitHub Codespaces (secondary — Linux)
- **المحرر:** VS Code / Cursor
- **Claude Code:** مع `--dangerously-skip-permissions` flag للمهام الكبيرة
- **pnpm بطيء على Windows** — تجنب `pnpm install` الكامل
- **النص العربي معكوس في Windows Terminal** — استخدم ملفات `.md` للبرومبتات الطويلة
- **Git identity** يحتاج إعداد على كل جهاز جديد
- **Vitest + Playwright** مُثبتان (القسم 19.7)

---

## 21. Claude Code — ملخص قواعد حرجة

هذه الخلاصة الذهبية (من واقع 200+ جلسة سابقة):

1. **Type-check من الجذر فقط:** `pnpm --filter @repo/web type-check` — أبداً `cd apps/web && tsc`
2. **DB scripts:** `pnpm --filter @repo/database generate|push|migrate` (بدون بادئة `db:`). من `packages/database/` استخدم `pnpm run generate|push`.
3. **اقرأ قبل Edit:** view الملف أولاً لمطابقة indentation. فشل مرتين → انتقل لـ Write/sed
4. **Zod v4 + oRPC:** لا `.nullish()`، استخدم `.transform()`. رمي `ORPCError` وليس `Error`
5. **بعد الإصلاح:** smoke test للمسار الكامل — قد تظهر bugs متعلقة
6. **الترجمات:** ar.json + en.json معاً في نفس commit — أبداً لا تترك مفاتيح ناقصة
7. **المحركات مقدّسة (Frontend فقط):** `structural-calculations.ts`, `derivation-engine.ts`, `mep-derivation-engine.ts`, `other-structural-calculations.ts` لا تُمس بدون طلب صريح. **لا engines/ على backend.**
8. **Multi-tenancy:** `organizationId` على كل query، `verifyOrganizationAccess()` على كل handler
9. **RTL:** `ms-/me-/ps-/pe-` فقط — أبداً `ml-/mr-/pl-/pr-`
10. **Decimal → Number():** قبل أي عملية حسابية على حقل Prisma Decimal
11. **auto-journal:** أخطاؤه لا تكسر العملية الأصلية. تستدعَى عبر 17 hook (راجع 18.4) — لا تعدّلها مباشرة عند العمل في dialogs.
12. **لا تفترض — تحقّق:** grep قبل افتراض import path، اقرأ router.ts قبل استخدام procedure

---

*هذا الملف يُحدّث مع كل تطوير كبير. آخر مراجعة شاملة: 2026-04-28*