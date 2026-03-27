agents.md
# CLAUDE.md — دليل Claude Code الشامل لمنصة مسار

> **آخر تحديث:** 2026-03-28
> **المطوّر:** جودت — مؤسس ومطوّر رئيسي (مطوّر فردي)
> **المشروع:** منصة مسار (Masar) — SaaS لإدارة المشاريع الإنشائية
> **المستودع:** github.com/masarpro/Masar
> **الموقع:** app-masar.com

---

## القاعدة الذهبية

**اقرأ أولاً، لا تخمّن.** — قبل تعديل أي ملف، اقرأه بالكامل أولاً. لا تفترض أسماء الحقول أو المسارات أو الـ imports. هذا المشروع كبير (600K+ سطر كود) والافتراضات تؤدي لأخطاء صامتة وتكرار عمل.

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
- **TanStack React Query 5** (server state) + **TanStack React Table 8** (tables)
- **Recharts** (charts) + **Lucide React 0.553** (icons)
- **next-intl** (i18n — Arabic-first مع دعم إنجليزي)
- **React Hook Form** + Zod schemas (forms)

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

---

## 3. هيكل المشروع

```
D:\Masar\Masar/
├── apps/web/                          # Next.js 16 App (1,135+ files)
│   ├── app/                           # App Router
│   │   ├── (marketing)/[locale]/      # Marketing (8 pages, SSG)
│   │   ├── (saas)/app/                # SaaS App (145+ pages)
│   │   │   └── [organizationSlug]/    # Multi-tenant routes
│   │   │       ├── projects/          # المشاريع (72+ pages)
│   │   │       ├── company/           # إدارة الشركة (26+ pages)
│   │   │       ├── finance/           # النظام المالي (55+ pages — يشمل المحاسبة)
│   │   │       ├── settings/          # الإعدادات (8 pages)
│   │   │       └── pricing/           # دراسات التسعير والكميات
│   │   ├── auth/                      # المصادقة (6 pages)
│   │   ├── owner/[token]/             # بوابة المالك (5 pages)
│   │   └── share/[token]/             # مستندات مشاركة
│   ├── modules/                       # Feature modules (753 files)
│   │   └── saas/                      # 19 sub-modules
│   │       ├── pricing/               # ⭐ أكبر وأعقد module (257 file, ~82,620 lines)
│   │       │   ├── components/studies/ # مكونات دراسات الكميات
│   │       │   │   ├── sections/      # أقسام إنشائية (7 sections)
│   │       │   │   └── shared/        # مكونات مشتركة
│   │       │   ├── lib/               # محركات الحساب
│   │       │   │   ├── structural-calculations.ts  # ⭐ 2,357 lines — القلب
│   │       │   │   ├── boq-aggregator.ts           # تجميع BOQ
│   │       │   │   ├── boq-recalculator.ts         # إعادة حساب
│   │       │   │   ├── height-derivation-engine.ts  # اشتقاق ارتفاعات
│   │       │   │   └── cutting/                    # خوارزميات تقطيع الحديد
│   │       │   ├── types/             # أنواع TypeScript
│   │       │   ├── constants/         # ثوابت (أسعار، بلوك، بلاطات)
│   │       │   └── hooks/             # React hooks
│   │       ├── projects/              # إدارة المشاريع
│   │       ├── finance/               # النظام المالي
│   │       ├── company/               # إدارة الشركة/HR
│   │       └── shared/                # مكونات مشتركة
│   └── proxy.ts                       # Next.js 16 proxy (replaced middleware.ts)
│
├── packages/
│   ├── api/                           # Backend (420+ files, 41 modules, 690+ endpoints)
│   │   └── modules/
│   │       ├── quantities/            # API الكميات والدراسات
│   │       │   ├── engines/           # محركات الحساب الخلفية
│   │       │   │   ├── structural-calculations.ts  # ⭐ لا تلمس
│   │       │   │   └── derivation-engine.ts        # ⭐ لا تلمس (2,493 lines)
│   │       │   └── procedures/        # CRUD + business logic
│   │       ├── finance/               # 116+ endpoints (+ payment vouchers)
│   │       ├── company/               # 87 endpoints
│   │       ├── handover/              # 15 endpoints (محاضر الاستلام — جديد)
│   │       └── ...                    # 37 more modules
│   ├── database/                      # Prisma (175+ files)
│   │   └── prisma/
│   │       ├── schema/                # Schema files (119 models, 77 enums)
│   │       └── zod/index.ts           # ⚠️ auto-generated, breaks after prisma generate
│   ├── ai/                            # AI assistant (40+ files, 32 tools)
│   ├── auth/                          # Better Auth config
│   ├── mail/                          # Email (7 templates via Resend)
│   ├── payments/                      # Stripe integration
│   ├── storage/                       # S3/Supabase storage
│   ├── i18n/                          # Internationalization
│   └── utils/                         # Shared utilities
│
├── tooling/                           # Scripts, configs
└── config/                            # App configuration
```

---

## 4. القائمة الحمراء — ملفات لا تلمسها أبداً

هذه الملفات تحتوي على محركات حساب معقدة ومُختبرة يدوياً. أي تعديل خاطئ يفسد كل الأرقام في المنصة:

| الملف | السبب |
|-------|-------|
| `packages/api/modules/quantities/engines/structural-calculations.ts` | محرك حساب الكميات الإنشائية — 2,357+ سطر من معادلات هندسية دقيقة |
| `packages/api/modules/quantities/engines/derivation-engine.ts` | محرك اشتقاق كميات التشطيبات — 2,493 سطر |
| `apps/web/modules/saas/pricing/lib/structural-calculations.ts` | نسخة المحرك الإنشائي في الواجهة — synchronized مع الخلفية |
| `packages/database/prisma/zod/index.ts` | ملف مولّد تلقائياً — لا تعدّله يدوياً (يُصلح بـ `fix-zod-decimal.mjs`) |
| `packages/database/prisma/schema/*.prisma` | لا تعدّل Schema بدون تأكيد صريح من جودت |

**استثناء وحيد:** إذا طُلب منك صراحةً إصلاح bug محدد في المحرك مع تقديم الحساب اليدوي كدليل.

---

## 5. أنماط العمل والقواعد الأساسية

### 5.1 نمط تنفيذ المهام

```
1. اقرأ الملفات المعنية أولاً (grep + cat/view)
2. نفّذ التعديلات
3. تحقق بـ: npx tsc --noEmit (أو pnpm type-check)
4. إذا نجح → pnpm build للتحقق النهائي
5. git add -A && git commit && git push
```

### 5.2 قاعدة الـ Multi-tenancy

**`organizationId` يجب أن يكون على كل query بدون استثناء.** لا تثق بـ organizationId المرسل من الـ frontend — دائماً resolve من قاعدة البيانات عبر الجلسة. كل endpoint يجب أن يستدعي `verifyOrganizationAccess()` مع الصلاحية المناسبة.

### 5.3 قاعدة الاشتراكات

**165+ write endpoint** يستخدم `subscriptionProcedure` لمنع مستخدمي الخطة المجانية. لا تستخدم `publicProcedure` أبداً لـ endpoints تتعامل مع بيانات المنظمة. القراءة تستخدم `protectedProcedure`، الكتابة تستخدم `subscriptionProcedure`.

### 5.4 قاعدة الترجمة

كل نص يظهر للمستخدم يجب أن يستخدم مفاتيح الترجمة عبر `useTranslations()` — لا hardcoded strings. أضف المفاتيح في كلا الملفين:
- `apps/web/i18n/messages/ar.json` (~6,567 مفتاح)
- `apps/web/i18n/messages/en.json` (~6,781 مفتاح)

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

Prisma auto-generates `packages/database/prisma/zod/index.ts` الذي يتعطل بعد كل `prisma generate` بسبب مشكلة Decimal types. الحل مطبّق عبر سكربت `fix-zod-decimal.mjs` الذي يعمل تلقائياً كـ post-generate hook مسلسل في أمر `db:generate`.

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
// 189 loading.tsx files exist — maintain this pattern for any new pages
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
| `STRUCTURAL` | أعمال إنشائية | structural-calculations.ts (محرك متقدم) |
| `FINISHING` | تشطيبات | derivation-engine.ts (2,493 lines) |
| `MEP` | كهروميكانيكية | MEPItemsEditor |
| `CUSTOM` | يدوي/مخصص | ManualItemsTable |

### 7.3 الأقسام الإنشائية (8 أقسام)

| القسم | الملف | الحجم | العناصر |
|-------|-------|-------|---------|
| صبة النظافة | `PlainConcreteSection.tsx` | 511 lines | خرسانة عادية تحت القواعد |
| القواعد | `FoundationsSection.tsx` | 2,383 lines | معزولة، مشتركة، شريطية، لبشة |
| الميدة | `BeamsSection.tsx` | 549 lines | كمرات ربط |
| الأعمدة | `ColumnsSection.tsx` | 1,643 lines | أعمدة + رقاب أعمدة |
| الأسقف | `SlabsSection.tsx` | 3,438 lines | صلب، مسطح، هوردي، كمرات عريضة |
| البلوك | `BlocksSection.tsx` | 1,287 lines | 6 تصنيفات جدران |
| السلالم | `StairsSection.tsx` | 1,095 lines | 4 طبقات تسليح |
| عناصر إنشائية أخرى | `OtherStructuralSection.tsx` | ~600 lines | 11 عنصر (بيارة، خزان، مصعد، إلخ) |

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

- **119 model** + **77 enum** في Prisma Schema (~4,900+ سطر)
- **275+ indexes** + **42+ unique constraints**
- **Decimal(15,2)** لكل الحقول المالية
- **Cascade Delete** شامل — حذف المنظمة يحذف كل شيء
- **organizationId** كـ index على كل model

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

## 10. مشاكل معروفة ومحلولة

### 10.1 مشاكل محلولة (للرجوع إليها)

| المشكلة | السبب | الحل | التاريخ |
|---------|-------|------|---------|
| Redirect loop (ERR_TOO_MANY_REDIRECTS) | middleware.ts يعيد توجيه المستخدم بجلسة منتهية بين /auth و /app | حذف شرط إعادة التوجيه من /auth/ عند وجود session cookie | 2026-03-16 |
| pg Pool #state error (500 errors كل الصفحات) | webpack يُضمّن مكتبة pg فتتعارض مع النسخة الأصلية | إضافة `"pg"` لـ `serverExternalPackages` في next.config.ts | 2026-03-17 |
| middleware.ts deprecated warning | Next.js 16 يستخدم proxy.ts بدل middleware.ts | إعادة تسمية proxy.disabled.ts → proxy.ts وحذف middleware.ts | 2026-03-16 |
| الهالك السالب في اللبشة (-67.9%) | القطع الطويلة (>12m) تحتاج سيخين مع وصلة تراكب | إضافة `if (barLength > stockLength)` مع حساب lap splice | 2026-03-15 |
| الحديد العلوي في القواعد (101 بدل 81 سيخ) | Top mesh يستخدم bottom mesh bars-per-meter بالخطأ | فصل حساب top mesh عن bottom mesh | 2026-03-14 |
| أسماء العناصر تُمسح عند الكتابة | useEffect في ElementHeaderRow يعيد التشغيل بسبب inline function | إضافة `skipAutoName` prop + functional `setFormData` updaters | 2026-03-14 |
| Prisma 6→7 breaking changes | Dependabot auto-upgraded major version | رفض PR + manual migration (driver adapters, ESM, prisma.config.ts) | 2026-03-10 |
| Build failure (ECONNRESET) | Windows dev mode + Turbopack | غير مؤثر — يحدث فقط في dev mode، الحل: restart pnpm dev | متكرر |
| .env.local duplicates | قيم وهمية تتجاوز القيم الحقيقية | تنظيف الملف يدوياً — حذف التكرارات | 2026-03-16 |
| تدقيق محاسبي (14 خطأ) | تدقيق شامل للنظام المحاسبي والمالي | جميع الـ 14 خطأ تبيّن أنها مُصلحة مسبقاً: قيود تلقائية ذرية ($transaction)، تحديث رصيد البنك عند دفعة الفاتورة، state machine للفواتير والمستخلصات، حد مبلغ الإشعار الدائن، منع تعديل فاتورة ISSUED، ترقيم ذري للعقود، فحص الفترات المغلقة، VAT بـ Decimal، entryNo فريد، audit log لأخطاء القيود | 2026-03-27 |

### 10.2 مشاكل مفتوحة (تحتاج إصلاح)

| المشكلة | الأولوية | التفاصيل |
|---------|---------|---------|
| بطء التنقل بين الصفحات | 🔴 حرج | Cache-Control: no-store على كل /app/* routes + waterfall layouts + 11 Suspense فقط من 171 صفحة |
| صفحات "ترفرف" عند الفتح | 🔴 حرج | 4-5 layouts متداخلة كل واحد يعمل await لاستعلام DB — المحتوى يظهر ويختفي |
| تضاعف تكلفة المواد في ملخص التسعير | 🟠 عالي | 18,134.49 يظهر 36,268.98 — المصنعيات صحيحة |
| Region mismatch | 🟠 عالي | Vercel Dubai ↔ Supabase Mumbai = ~20-30ms per query |
| مكونات >1000 سطر (10+) | 🟡 متوسط | تحتاج تقسيم لتحسين bundle size |
| غياب Error Boundaries | 🟡 متوسط | 2 فقط من ~17 route group |
| CSP unsafe-inline | 🟡 متوسط | يضعف الحماية ضد XSS |
| غياب اختبارات | 🟡 متوسط | صفر unit/integration/E2E tests |
| PDF export يعرض صفحة فارغة ثانية + URL المتصفح | 🟡 متوسط | مشكلة iframe في window.print |

---

## 11. أوامر التطوير

```bash
# تشغيل التطوير
pnpm dev

# بناء الإنتاج
pnpm build

# فحص الأنواع (أسرع من build)
pnpm type-check
# أو بشكل مستهدف:
npx tsc --noEmit

# توليد Prisma client (مع إصلاح Zod تلقائي)
pnpm --filter @repo/database db:generate

# تطبيق تغييرات Schema
pnpm --filter @repo/database db:push

# Linting
pnpm lint

# تنسيق الكود
pnpm format
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

1. **اقرأ الملفات قبل التعديل** — استخدم `cat` أو `grep` لفهم البنية الحالية
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
- **`tsc --noEmit` قد يأخذ وقتاً طويلاً** — استخدم `grep` المستهدف + scoped builds بدل full project checks
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

## 13. بنية وحدة API (41 module)

| الوحدة | Endpoints | الملاحظات |
|--------|-----------|---------|
| finance | 116+ | أكبر وحدة — فواتير، مصروفات، مدفوعات، تحويلات، بنوك، سندات قبض/صرف، تقارير |
| company | 87 | HR — موظفين، أصول، رواتب، إجازات، مصروفات متكررة |
| pricing (+ quantities + leads) | 57 | دراسات، كميات، عروض أسعار، عملاء محتملون |
| accounting | 36+ | دليل حسابات، قيود، تقارير، فترات، أرصدة افتتاحية، كشوف حساب، تسوية بنكية، قيود متكررة، صحة محاسبية |
| super-admin | 29 | لوحة تحكم المشرف العام |
| project-execution | 28 | أنشطة، مراحل، تقدم، Gantt |
| subcontracts | 26 | عقود باطن، مدفوعات، مطالبات |
| project-finance | 17 | مالية المشروع — عقد، مصروفات، مطالبات |
| handover | 15 | **جديد** — محاضر استلام (ابتدائي، نهائي، بنود، تسليم) |
| project-documents | 13 | مستندات — تصنيف، إصدارات، موافقات |
| project-change-orders | 12 | أوامر التغيير |
| project-owner | 12 | بوابة المالك |
| project-field | 11 | تقارير يومية، صور، مشاكل |
| dashboard | 9 | لوحة التحكم الرئيسية |
| ai | 6 | المساعد الذكي (32 tools) |
| + 26 more modules | ~250 | باقي الوحدات |
| **المجموع** | **690+** | |

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
- **32 أداة** (6 legacy + 26 registry) مقسمة على ملفات:

### الأدوات القديمة (Legacy — 6 أدوات في `packages/ai/tools/assistant-tools.ts`)
  - `queryProjects` — قائمة/تفاصيل/إحصائيات المشاريع
  - `queryFinance` — فواتير، مدفوعات، مصروفات، أرصدة بنكية، ملخص مالي
  - `queryExecution` — مراحل، تقارير يومية، مشاكل، تقدم
  - `queryTimeline` — معالم المشروع الزمنية
  - `navigateTo` — توليد روابط تنقل (37 regex pattern عربي/إنجليزي)
  - `queryCompany` — موظفين، أصول، مصروفات منشأة، رواتب

### الأدوات الجديدة (Registry — 26 أداة في `packages/ai/tools/modules/`)
  - **projects-tools** (2): `getProjectDetails`, `getProjectFinanceSummary`
  - **execution-tools** (3): `getProjectActivities`, `getProjectMilestones`, `getDelayAnalysis`
  - **quantities-tools** (3): `queryCostStudies`, `getCostStudyDetails`, `searchMaterials`
  - **quotations-tools** (3): `queryQuotations`, `getQuotationDetails`, `getQuotationsSummary`
  - **leads-tools** (3): `queryLeads`, `getLeadsSummary`, `getLeadsPipeline`
  - **accounting-tools** (3): `queryAccounting`, `getAccountLedger`, `getAccountingReports`
  - **subcontracts-tools** (2): `querySubcontracts`, `getSubcontractDetails`
  - **project-finance-tools** (2): `queryClaims`, `queryChangeOrders`
  - **dashboard-tools** (2): `getDashboardSummary`, `getFinanceDashboard`
  - **documents-tools** (1): `queryDocuments`
  - **field-tools** (1): `queryFieldExecution`
  - **vouchers-tools** (1): `queryVouchers`

### 15 وحدة معرفية (Module Definitions — `packages/ai/modules/definitions/`)
  projects, execution, finance, quantities, company, leads, subcontracts, owner-portal, settings, navigation, **accounting**, **dashboard**, **documents**, **change-orders**, **field**

### بنية المساعد
- **Page Context:** Zustand store يرسل snapshot الصفحة الحالية مع كل رسالة AI
- **Module/Tool Registry:** extensible — إضافة module أو tool جديد = ملف واحد فقط
- **تقييد النطاق:** المساعد يجيب فقط على أسئلة متعلقة ببيانات مسار واستخدام المنصة — يرفض الأسئلة الهندسية/المقاولاتية العامة
- **Always Available Tools:** projects, execution, quantities, finance, leads, accounting, subcontracts, dashboard — متاحة من أي صفحة
- **Context-Aware:** أدوات documents, field, change-orders تتفعل تلقائياً حسب الصفحة الحالية عبر `activeModule`

### إضافة أداة AI جديدة

```
1. أنشئ packages/ai/tools/modules/[name]-tools.ts
2. استخدم registerTool({ name, description, moduleId, parameters: z.object({}), execute })
3. أضف import في packages/ai/tools/modules/index.ts
4. أضف اسم الأداة في relatedTools بتعريف الوحدة المناسبة
5. (اختياري) أضف الوحدة في القائمة الثابتة في route.ts إذا كانت مطلوبة من أي صفحة
```

---

## 16. على الأفق (Roadmap)

### قريب (أسابيع)
- إصلاح بطء التنقل (Cache-Control + Suspense + parallel layouts)
- إصلاح تضاعف تكلفة المواد في ملخص التسعير
- Beta مغلق مع مستخدمين محدودين

### متوسط (أشهر)
- وحدة الأعمال الترابية (حفر، ردم، تدعيم، تجفيف) — قسم منفصل قبل الإنشائي
- توسيع الأقسام الإنشائية: دمج عناصر متشابهة هيكلياً + كتالوج "بنود إضافية"
- ZATCA Phase 2 (secp256k1, UBL 2.1, XAdES-BES, CSID)
- تطبيق React Native / Expo (MVP: مشرف ميداني)

### بعيد (6+ أشهر)
- مكتبة أسعار مجتمعية (13 موقع مورد سعودي)
- 7 أركان AI: استخراج مستندات، تسعير ذكي، تحليلات تنبؤية، أتمتة، رؤية حاسوبية، تقارير آلية
- ربط BOQ بالتنفيذ (Earned Value: CPI/SPI)
- Offline mode + GPS tagging

---

## 17. ملخص الإحصائيات

| المقياس | القيمة |
|---------|--------|
| أسطر الكود | 620,000+ |
| ملفات TypeScript/TSX | 1,950+ |
| صفحات | 210+ |
| API Endpoints | 690+ |
| API Modules | 41 |
| Database Models | 119 |
| Database Enums | 77 |
| Database Indexes | 280+ |
| Loading States | 200+ files |
| Translation Keys (AR) | ~6,900 |
| Translation Keys (EN) | ~7,100 |
| Permissions | 42 |
| Custom Hooks | 21 |
| UI Components (shadcn) | 35+ |
| Environment Variables | 43 |
| Rate Limit Tiers | 6 |
| AI Tools | 32 (6 legacy + 26 registry) |
| AI Module Definitions | 15 |
| AI Module Prompts | 14 |
| AI navigateTo Patterns | 37 |
| Auto-Journal Events | 15 (+ generic reverse) |

---

## 18. دليل سريع: كيف أنفذ مهمة شائعة

### إضافة صفحة جديدة

```
1. أنشئ app/(saas)/app/[organizationSlug]/module/page.tsx
2. أنشئ app/.../module/loading.tsx (skeleton)
3. أضف المكون في modules/saas/module/components/
4. أضف مفاتيح الترجمة في ar.json + en.json
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
6. تحقق بـ npx tsc --noEmit
```

### إصلاح مشكلة UI لا تظهر

```
1. احذف .next: Remove-Item -Recurse -Force apps/web/.next
2. أعد تشغيل: pnpm dev
3. Hard refresh في المتصفح: Ctrl+Shift+R
4. إذا لا يزال الأمر — تحقق من console errors في المتصفح
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
8. تحقق: npx tsc --noEmit → pnpm build
```

---

## 19. النظام المحاسبي المتكامل (أُضيف 2026-03-24)

### 19.1 نظرة عامة

نظام محاسبي متكامل يعمل دائماً. يشمل: دليل حسابات هرمي (يُنشأ تلقائياً عند أول عملية مالية)، قيود يومية تلقائية ويدوية، فترات محاسبية، 10 تقارير، دفتر أستاذ، أرصدة افتتاحية، كشوف حساب (عميل/مقاول/مشروع/حساب)، سندات قبض/صرف (مع workflow اعتماد)، تسوية بنكية، قيود متكررة، فحص صحة محاسبية، وتصدير Excel.

**القاعدة:** المحاسبة تعمل دائماً بلا toggle — دليل الحسابات يُنشأ تلقائياً عبر `ensureChartExists`. أخطاء القيود التلقائية لا تكسر العملية المالية الأصلية أبداً.

### 19.2 المعمارية

```
المحاسبة تعمل **دائماً** — لا يوجد toggle
    ↓
عند أول عملية مالية أو أول زيارة لصفحات المالية → seedChartOfAccounts() → 48 حساب افتراضي
    (auto-seed عبر ensureChartExists في auto-journal.ts + AccountingSeedCheck.tsx في frontend)
    ↓
كل عملية مالية → auto-journal.ts → قيد تلقائي POSTED
    ↓
القيود → تغذي التقارير (ميزان مراجعة، ميزانية، قائمة دخل، مراكز تكلفة)
```

### 19.3 Models المحاسبية (7 models)

| Model | الوصف | الحقول الرئيسية |
|-------|-------|-----------------|
| `ChartAccount` | دليل الحسابات | code, nameAr, nameEn, type(ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE), normalBalance(DEBIT/CREDIT), level(1-4), parentId, isSystem, isPostable, bankAccount(1-1) |
| `JournalEntry` | القيد اليومي | entryNo, date, description, referenceType, referenceId, referenceNo, isAutoGenerated, status(DRAFT/POSTED/REVERSED), totalAmount, createdByUser, postedByUser |
| `JournalEntryLine` | بند القيد | accountId, debit(Decimal 15,2), credit(Decimal 15,2), projectId, description |
| `AccountingPeriod` | الفترة المحاسبية | name, periodType(MONTHLY/QUARTERLY/ANNUAL), startDate, endDate, isClosed |
| `RecurringJournalTemplate` | قالب قيد متكرر | description, lines(Json), frequency(MONTHLY/QUARTERLY/ANNUAL), dayOfMonth, nextDueDate, isActive |
| `BankReconciliation` | التسوية البنكية | bankAccountId, reconciliationDate, statementBalance, bookBalance, difference, status(DRAFT/COMPLETED) |
| `BankReconciliationItem` | بند التسوية | reconciliationId, journalEntryLineId, isMatched |

### 19.4 القيود التلقائية (auto-journal.ts)

| الحدث | القيد | المرجع |
|-------|-------|--------|
| إصدار فاتورة | DR: 1120 عملاء / CR: 4100 إيرادات + 2130 ضريبة | INVOICE |
| تحصيل فاتورة | DR: البنك / CR: 1120 عملاء | INVOICE_PAYMENT |
| مصروف | DR: حساب المصروف + 1150 ضريبة مدخلات / CR: البنك | EXPENSE |
| تحويل بنكي | DR: البنك المستلم / CR: البنك المرسل | TRANSFER |
| دفعة مقاول باطن | DR: 5200 مقاولو باطن / CR: البنك | SUBCONTRACT_PAYMENT |
| اعتماد مطالبة مقاول باطن | DR: 5200 مقاولو باطن / CR: 2120 مستحقات | SUBCONTRACT_CLAIM_APPROVED |
| رواتب | DR: 6100 رواتب / CR: البنك + 2170 تأمينات | PAYROLL |
| مقبوض مباشر | DR: البنك / CR: 4300 إيرادات أخرى | ORG_PAYMENT |
| دفعة مشروع | DR: البنك / CR: 4100 إيرادات | PROJECT_PAYMENT |
| اعتماد مستخلص مشروع | DR: 1120 عملاء / CR: 4100 إيرادات | PROJECT_CLAIM_APPROVED |
| إشعار دائن | DR: 4100 + 2130 / CR: 1120 | CREDIT_NOTE |
| سند قبض | DR: البنك / CR: حساب حسب النوع | RECEIPT_VOUCHER |
| سند صرف | DR: حساب حسب النوع / CR: البنك | PAYMENT_VOUCHER |
| تسليم نهائي (إفراج ضمان) | DR: 2120 / CR: البنك | HANDOVER_RETENTION_RELEASE |

**15 حدث تلقائي** — كل واحد مع `JOURNAL_ENTRY_FAILED` audit log في حالة الفشل + `reverseAutoJournalEntry` دالة عكس عامة.

**قاعدة صامتة:** أخطاء المحاسبة لا تكسر العملية المالية الأصلية أبداً.

### 19.5 ترقيم القيود حسب النوع

كل نوع قيد له prefix مستقل مع sequence منفصل (18 نوع):
```
INVOICE → INV-JE              INVOICE_PAYMENT → RCV-JE
EXPENSE → EXP-JE              TRANSFER → TRF-JE
SUBCONTRACT_PAYMENT → SUB-JE  SUBCONTRACT_CLAIM_APPROVED → SCL-JE
PROJECT_PAYMENT → PRJ-JE      PROJECT_CLAIM_APPROVED → PCL-JE
PAYROLL → PAY-JE              ORG_PAYMENT → RCV-JE
CREDIT_NOTE → CN-JE           REVERSAL → REV-JE
ADJUSTMENT → ADJ-JE           PERIOD_CLOSING → CLS-JE
OPENING_BALANCE → OPN-JE      RECEIPT_VOUCHER → RV-JE
PAYMENT_VOUCHER → PV-JE       HANDOVER_RETENTION_RELEASE → HR-JE
MANUAL (default) → MAN-JE
```
Format: `{PREFIX}-{YEAR}-{XXXX}` (e.g. `INV-JE-2026-0001`)

### 19.6 الميزات الـ 21 المنفّذة

| # | الميزة | الملفات الرئيسية |
|---|--------|-----------------|
| 1 | **دفتر الأستاذ** — حركات الحساب بالرصيد التراكمي | `AccountLedgerPage.tsx` + `/chart-of-accounts/[accountId]/ledger` |
| 2 | **أرصدة افتتاحية** — إدخال أرصدة عند بدء استخدام النظام | `OpeningBalancesPage.tsx` + `/opening-balances` |
| 3 | **كشف حساب عميل/مقاول** — من الفواتير والمدفوعات مباشرة | `ClientStatementReport.tsx` + `client-statements.ts` |
| 4 | **سند صرف** — مستند مطبوع للمصروفات | `PaymentVoucher.tsx` + `/expenses/[id]/voucher` |
| 5 | **ترحيل جماعي** — checkboxes + bulk post + post all drafts | `JournalEntriesPage.tsx` (معدّل) |
| 6 | **مراكز التكلفة** — ربحية كل مشروع | `CostCenterReport.tsx` + `/accounting-reports/cost-center` |
| 7 | **تسوية بنكية** — مطابقة يدوية مع كشف البنك | `BankReconciliation.tsx` + `/banks/[id]/reconciliation` |
| 8 | **قيود متكررة** — قوالب شهرية/ربعية/سنوية تولّد DRAFT | `RecurringJournalTemplates.tsx` + `recurring-entries.ts` |
| 9 | **طباعة التقارير** — `ReportPrintHeader` + `window.print()` | `ReportPrintHeader.tsx` + 4 تقارير معدّلة |
| 10 | **ربط ثنائي الاتجاه** — من القيد للمصدر والعكس | `JournalEntryDetails.tsx` (referenceNo clickable) |
| 11 | **ترقيم حسب النوع** — INV-JE, EXP-JE, etc. | `accounting.ts` → `createJournalEntry()` |
| 12 | **لوحة محاسبة** — KPIs + تنبيهات + اختصارات | `AccountingDashboard.tsx` + `/accounting-dashboard` |
| 13 | **بحث متقدم** — فلاتر المبلغ والحساب والنوع والتاريخ | `JournalEntriesPage.tsx` (فلاتر متقدمة) |
| 14 | **سجل تدقيق بصري** — من أنشأ/رحّل/عكس القيد | `JournalEntryDetails.tsx` (audit trail card) |
| 15 | **تصدير Excel** — ميزان مراجعة + قيود + دفتر أستاذ | `accounting-excel-export.ts` (xlsx-js-style) |
| 16 | **المبلغ بالحروف العربية** — utility مشتركة | `packages/utils/lib/number-to-arabic-words.ts` |
| 17 | **VAT تفصيلي** — tabs لتفاصيل الفواتير والمصروفات | `VATReport.tsx` (معدّل بـ 3 tabs) |
| 18 | **سندات صرف كاملة** — CRUD + workflow اعتماد (DRAFT→PENDING→ISSUED) | `PaymentVouchersList/Form/Detail.tsx` + `payment-vouchers.ts` (10 endpoints) |
| 19 | **كشوف حساب متقدمة** — حساب بالكود + مشروع + مقاول باطن | `AccountStatementView.tsx` + `ProjectStatementView.tsx` + `SubcontractStatementView.tsx` |
| 20 | **فحص صحة محاسبية** — 4 فحوصات + backfill تلقائي | `AccountingHealthPage.tsx` + `accounting-health.ts` |
| 21 | **تكامل محاسبي شامل** — 15+ procedure مع auto-journal hooks | `auto-journal.ts` (12 handler + reverse) — يشمل كل العمليات المالية |

### 19.7 ملفات النظام المحاسبي — خريطة كاملة

**Backend (queries + procedures):**
```
packages/database/prisma/queries/
├── accounting.ts              # ⭐ ~1,600 سطر — كل الاستعلامات المحاسبية
│   ├── seedChartOfAccounts()  # إنشاء 40+ حساب افتراضي
│   ├── createJournalEntry()   # إنشاء قيد مع ترقيم حسب النوع
│   ├── postJournalEntry()     # ترحيل قيد DRAFT→POSTED
│   ├── reverseJournalEntry()  # عكس قيد مع إنشاء قيد عكسي
│   ├── getTrialBalance()      # Raw SQL — ميزان المراجعة
│   ├── getBalanceSheet()      # الميزانية العمومية
│   ├── getJournalIncomeStatement() # قائمة الدخل
│   ├── getAccountLedger()     # دفتر الأستاذ بالرصيد التراكمي
│   ├── getOpeningBalances() / saveOpeningBalances() # أرصدة افتتاحية
│   ├── bulkPostJournalEntries() / bulkPostAllDrafts() # ترحيل جماعي
│   ├── getCostCenterByProject() # مراكز التكلفة
│   ├── getAccountingDashboard() # لوحة المحاسبة KPIs
│   ├── listRecurringTemplates() / createRecurringTemplate() / generateDueRecurringEntries()
│   ├── getBankJournalLines() / createBankReconciliation() / listBankReconciliations()
│   └── findJournalEntryByReference() # ربط ثنائي الاتجاه
├── client-statements.ts       # كشوف حساب العملاء والمقاولين
│   ├── getClientStatement()   # من FinanceInvoice + FinancePayment
│   └── getVendorStatement()   # من SubcontractClaim + SubcontractPayment
├── account-statements.ts      # كشوف حساب متقدمة (جديد — 428 سطر)
│   ├── getAccountLedgerByCode()  # دفتر أستاذ بكود الحساب + فلتر مشروع
│   ├── getSubcontractStatement() # كشف مقاول باطن + ملخص عقد
│   └── getProjectStatement()     # ربحية مشروع (إيرادات/تكاليف/تدفق نقدي)
├── accounting-health.ts       # فحص صحة محاسبية (جديد — 87 سطر)
│   └── checkAccountingHealth()   # 4 فحوصات: unbalanced, missing entries, orphaned, expenses
└── accounting-reports.ts      # تقارير: aged receivables/payables, VAT, income statement

packages/api/modules/accounting/
├── router.ts                  # accounts.*, journal.*, reports.*, openingBalances.*, statements.*, recurring.*, periods.*, dashboard, health
├── procedures/
│   ├── chart-of-accounts.ts   # seed, list, getById, create, update, deactivate, getBalance, getLedger, openingBalances
│   ├── journal-entries.ts     # list, getById, create, post, reverse, delete, bulkPost, postAllDrafts, findByReference, costCenter, dashboard
│   ├── statements.ts          # getClientStatement, getVendorStatement
│   ├── account-statements.ts  # accountLedgerByCode, subcontractStatement, projectStatement
│   ├── health.ts              # checkAccountingHealth (4 validations)
│   ├── backfill.ts            # backfillJournalEntries
│   └── recurring-entries.ts   # list, create, update, delete, generate

packages/api/modules/finance/procedures/
├── bank-reconciliation.ts     # getLines, create, history
└── payment-vouchers.ts        # list, getById, create, update, submit, approve, reject, cancel, print, summary (10 endpoints)

packages/api/lib/accounting/
└── auto-journal.ts            # 12 event handlers + reverseAutoJournalEntry (766 lines)

packages/utils/lib/
└── number-to-arabic-words.ts  # numberToArabicWords(13800.50) → "ثلاثة عشر ألفاً وثمانمائة ريال سعودي وخمسون هللة"
```

**Frontend (pages + components):**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/
├── chart-of-accounts/
│   ├── page.tsx + loading.tsx
│   └── [accountId]/ledger/page.tsx + loading.tsx     # Feature 1: دفتر الأستاذ
├── journal-entries/
│   ├── page.tsx + loading.tsx
│   ├── [id]/page.tsx                                  # تفاصيل القيد + audit trail
│   └── recurring/page.tsx                             # Feature 8: قيود متكررة
├── opening-balances/page.tsx + loading.tsx             # Feature 2: أرصدة افتتاحية
├── accounting-dashboard/page.tsx + loading.tsx         # Feature 12: لوحة المحاسبة
├── accounting-periods/page.tsx + loading.tsx
├── accounting-reports/
│   ├── page.tsx (landing — 9 بطاقات تقارير)
│   ├── trial-balance/        # + طباعة + Excel
│   ├── balance-sheet/        # + طباعة
│   ├── income-statement/     # + طباعة
│   ├── journal-income-statement/ # + طباعة
│   ├── cost-center/          # Feature 6: مراكز التكلفة
│   ├── vat-report/           # Feature 17: tabs تفصيلية
│   ├── health/               # Feature 20: فحص صحة محاسبية
│   ├── aged-receivables/
│   └── aged-payables/
├── payment-vouchers/                                   # Feature 18: سندات صرف
│   ├── page.tsx + loading.tsx                          # قائمة السندات
│   ├── new/page.tsx + loading.tsx                      # إنشاء سند جديد
│   └── [voucherId]/page.tsx + loading.tsx              # تفاصيل السند
├── clients/[clientId]/statement/page.tsx               # Feature 3: كشف حساب عميل
├── expenses/[expenseId]/voucher/page.tsx               # Feature 4: سند صرف مصروف
└── banks/[bankId]/reconciliation/page.tsx              # Feature 7: تسوية بنكية

apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/
├── finance/
│   ├── statement/page.tsx + loading.tsx                # Feature 19: كشف حساب مشروع
│   └── subcontracts/[subcontractId]/
│       └── statement/page.tsx + loading.tsx            # Feature 19: كشف حساب مقاول باطن
└── handover/                                           # وحدة الاستلام (Section 21)
    ├── page.tsx + loading.tsx                          # قائمة المحاضر
    ├── new/page.tsx + loading.tsx                      # إنشاء محضر
    └── [protocolId]/page.tsx + loading.tsx             # تفاصيل المحضر

apps/web/modules/saas/finance/
├── components/accounting/
│   ├── ChartOfAccountsPage.tsx      # شجرة حسابات + حسابات قابلة للنقر → ledger
│   ├── JournalEntriesPage.tsx       # بحث متقدم + checkboxes + bulk post + Excel
│   ├── JournalEntryDetails.tsx      # referenceNo clickable + audit trail
│   ├── AccountLedgerPage.tsx        # رصيد تراكمي + طباعة + Excel
│   ├── OpeningBalancesPage.tsx      # إدخال أرصدة مجمّعة حسب النوع
│   ├── ClientStatementReport.tsx    # كشف حساب مع طباعة
│   ├── CostCenterReport.tsx         # صفوف قابلة للتوسيع + بطاقات KPI
│   ├── AccountingDashboard.tsx      # 4 KPIs + تنبيهات + اختصارات
│   ├── AccountingHealthPage.tsx     # 4 فحوصات صحة + backfill (جديد)
│   ├── RecurringJournalTemplates.tsx # قائمة قوالب + توليد + toggle
│   ├── TrialBalanceReport.tsx       # + طباعة + Excel export
│   ├── BalanceSheetReport.tsx       # + طباعة
│   ├── JournalIncomeStatementReport.tsx # + طباعة
│   └── formatters.ts               # formatAccounting, ACCOUNT_TYPE_COLORS
├── components/accounting-reports/
│   ├── AccountingReportsLanding.tsx  # 9 بطاقات (+ cost center + health)
│   └── VATReport.tsx                # 3 tabs: ملخص/فواتير/مصروفات
├── components/banks/
│   └── BankReconciliation.tsx       # مطابقة يدوية + checkboxes + تاريخ تسويات
├── components/vouchers/
│   ├── ReceiptVouchersList.tsx      # قائمة سندات القبض
│   ├── ReceiptVoucherForm.tsx       # إنشاء/تعديل سند قبض
│   ├── ReceiptVoucherDetail.tsx     # تفاصيل سند قبض + طباعة
│   ├── PaymentVouchersList.tsx      # قائمة سندات الصرف (جديد)
│   ├── PaymentVoucherForm.tsx       # إنشاء سند صرف + workflow (جديد)
│   └── PaymentVoucherDetail.tsx     # تفاصيل + اعتماد/رفض + طباعة (جديد)
├── components/statements/
│   ├── AccountStatementView.tsx     # كشف حساب عام بالكود (reusable)
│   ├── ProjectStatementView.tsx     # ربحية مشروع + تدفق نقدي
│   └── SubcontractStatementView.tsx # كشف حساب مقاول باطن
├── components/shared/
│   ├── ReportPrintHeader.tsx        # هيدر طباعة مشترك (hidden print:block)
│   └── JournalEntryLink.tsx         # رابط للقيد المحاسبي من أي مكان
├── components/shell/
│   ├── constants.ts                 # FINANCE_NAV_SECTIONS (15 section)
│   └── FinanceNavigation.tsx        # شريط التنقل المالي (المحاسبة مرئية دائماً)
└── lib/
    └── accounting-excel-export.ts   # xlsx-js-style: trial balance, journal, ledger

apps/web/modules/saas/projects/components/handover/     # وحدة الاستلام (جديدة)
├── HandoverProtocolsList.tsx        # قائمة المحاضر + فلاتر + بحث
├── HandoverProtocolForm.tsx         # إنشاء محضر + أطراف + شروط
├── HandoverProtocolDetail.tsx       # تفاصيل + توقيعات + بنود + ضمان
└── HandoverItemDialog.tsx           # إضافة/تعديل بند استلام

apps/web/modules/saas/shared/components/
└── DocumentPrintHeader.tsx          # هيدر طباعة مستندات مشترك (جديد)
```

### 19.8 التنقل المحاسبي

أقسام المحاسبة تظهر دائماً في شريط التنقل المالي والـ Sidebar:
- لوحة المحاسبة
- دليل الحسابات
- القيود اليومية
- الأرصدة الافتتاحية
- الفترات المحاسبية
- التقارير المحاسبية (8 تقارير)

**ملاحظة:** كل أقسام المحاسبة مرئية دائماً في شريط التنقل — لا يوجد `useAccountingMode` toggle أو `ACCOUNTING_ONLY_SECTIONS` gate.

### 19.9 نمط oRPC في المحاسبة

```typescript
// ✅ Query (استعلام — protectedProcedure)
const { data } = useQuery(
  orpc.accounting.accounts.getLedger.queryOptions({
    input: { organizationId, id: accountId, dateFrom, dateTo },
  }),
);

// ✅ Mutation (كتابة — subscriptionProcedure) — بدون { input: }
bulkPostMutation.mutate({ organizationId, entryIds: [...] });

// ❌ خطأ شائع — لا تلف المعاملات في { input: }
mutation.mutate({ input: { organizationId } }); // هذا خطأ!
```

### 19.10 حسابات النظام الافتراضية (Saudi Construction)

| الكود | الحساب | النوع |
|-------|--------|-------|
| 1110 | النقدية والبنوك | ASSET |
| 1120 | العملاء (ذمم مدينة) | ASSET |
| 1150 | ضريبة مدخلات قابلة للاسترداد | ASSET |
| 2110 | الموردون (ذمم دائنة) | LIABILITY |
| 2120 | مستحقات مقاولي الباطن | LIABILITY |
| 2130 | ضريبة القيمة المضافة المستحقة | LIABILITY |
| 2150 | محتجزات (ضمان) | LIABILITY |
| 2140 | رواتب مستحقة | LIABILITY |
| 2170 | تأمينات اجتماعية مستحقة | LIABILITY |
| 3100 | رأس المال | EQUITY |
| 3200 | أرباح مبقاة (حساب موازنة الأرصدة الافتتاحية) | EQUITY |
| 4100 | إيرادات المشاريع | REVENUE |
| 4300 | إيرادات أخرى | REVENUE |
| 5100 | مواد ومشتريات | EXPENSE |
| 5200 | مقاولو باطن | EXPENSE |
| 5300 | عمالة مباشرة | EXPENSE |
| 6100 | رواتب إدارية | EXPENSE |
| 6200-6950 | مصروفات تشغيلية (إيجار، مرافق، عمولات...) | EXPENSE |

### 19.11 ضمانات سلامة البيانات المالية (مُتحقق منها 2026-03-27)

| الضمانة | الموقع | التفاصيل |
|---------|--------|----------|
| القيود ذرية | `createJournalEntry` → `db.$transaction` | duplicate check + period check + account validation + create كلها في transaction واحد |
| رصيد البنك يُحدّث مع دفعة الفاتورة | `addInvoicePayment` / `deleteInvoicePayment` | `increment` / `decrement` داخل نفس الـ transaction |
| state machine للفواتير | `updateInvoiceStatusProcedure` | `ALLOWED_TRANSITIONS` + DRAFT محذوف من Zod enum |
| منع تعديل فاتورة ISSUED | `updateInvoiceItems` | `status !== "DRAFT"` → throw |
| حد مبلغ الإشعار الدائن | `createCreditNote` | مجموع الإشعارات السابقة + الجديد ≤ الفاتورة الأصلية |
| الإشعار الدائن يُقلل رصيد الفاتورة | `createCreditNote` → `tx.financeInvoice.update` | `paidAmount: { increment: creditAmount }` + تحديث status |
| فحص الفترات المغلقة عند الترحيل | `postJournalEntry` → `isPeriodClosed` | يمنع ترحيل قيد في فترة مغلقة |
| entryNo فريد | Schema: `@@unique([organizationId, entryNo])` | مع ترقيم ذري عبر `nextSequenceValue` |
| ترقيم ذري للعقود | `generateSubcontractNo` / `generateSubcontractPaymentNo` | عبر `generateAtomicNo` |
| state machine للمستخلصات | `updateClaimStatus` → `ALLOWED_TRANSITIONS` | DRAFT→SUBMITTED→APPROVED→PAID |
| VAT بـ Prisma Decimal | `onExpenseCompleted` | `amount.div(Decimal("1.15"))` بدل JS floating-point |
| audit log لأخطاء القيود | كل catch block (33+ موقع) | `JOURNAL_ENTRY_FAILED` enum + fire-and-forget |
| سندات صرف state machine | `payment-vouchers.ts` | DRAFT→PENDING_APPROVAL→ISSUED + reject/cancel |
| محاضر استلام state machine | `handover-protocols.ts` | DRAFT→PENDING_SIGNATURES→COMPLETED + sign tracking |

---

## 20. وحدة محاضر الاستلام (Handover Protocols — أُضيف 2026-03-28)

### 20.1 نظرة عامة

وحدة كاملة لإدارة محاضر الاستلام في المشاريع الإنشائية. تدعم 4 أنواع استلام مع workflow توقيعات وتتبع ضمان وربط محاسبي تلقائي لإفراج المحتجزات.

### 20.2 أنواع المحاضر (4 أنواع)

| النوع | الوصف | ملاحظات |
|-------|-------|---------|
| `ITEM_ACCEPTANCE` | استلام بنود | يتطلب ربط بعقد مقاول باطن |
| `PRELIMINARY` | استلام ابتدائي | يحسب تلقائياً فترة الضمان (warrantyMonths) |
| `FINAL` | استلام نهائي | يفرج المحتجزات (retentionReleaseAmount) + قيد تلقائي |
| `DELIVERY` | تسليم للعميل | تسليم المشروع النهائي |

### 20.3 حالات المحضر (State Machine)

```
DRAFT → PENDING_SIGNATURES → PARTIALLY_SIGNED → COMPLETED
  │                                                  ↑
  └──────────────────────────────────────────────────┘ (complete manually)
                                                    → ARCHIVED
```

**شروط التقديم:** يتطلب ≥1 بند و ≥1 طرف موقّع.
**إكمال تلقائي:** عند توقيع جميع الأطراف → COMPLETED تلقائياً.

### 20.4 Prisma Models

```prisma
model HandoverProtocol {
  protocolNo              String         // HND-YYYY-XXXX (ترقيم ذري)
  type                    HandoverType   // ITEM_ACCEPTANCE | PRELIMINARY | FINAL | DELIVERY
  status                  HandoverStatus // DRAFT → PENDING_SIGNATURES → COMPLETED
  projectId               String         // FK → Project
  subcontractContractId   String?        // FK → SubcontractContract (مطلوب لـ ITEM_ACCEPTANCE)
  title                   String
  parties                 Json           // [{name, role, organization, signed, signedAt}]
  items                   HandoverProtocolItem[]
  warrantyMonths          Int?           // افتراضي 12 (لـ PRELIMINARY)
  warrantyStartDate       DateTime?      // يُحسب تلقائياً
  warrantyEndDate         DateTime?
  retentionReleaseAmount  Decimal?       // (لـ FINAL) → قيد محاسبي تلقائي
  // ...
}

model HandoverProtocolItem {
  description    String
  contractQty    Decimal?       // الكمية التعاقدية
  executedQty    Decimal?       // الكمية المنفّذة
  acceptedQty    Decimal?       // الكمية المقبولة
  qualityRating  QualityRating? // EXCELLENT | GOOD | ACCEPTABLE | NEEDS_REWORK | REJECTED
  defects        Json?          // تفاصيل العيوب
}
```

### 20.5 API Endpoints (15 endpoint)

| المجموعة | الإجراءات |
|----------|-----------|
| CRUD | list, getById, create, update, delete |
| بنود | add, update, delete, importFromContract, importFromBOQ |
| سير العمل | submit, sign, complete, print |
| تقارير | getWarrantyStatus (حالة الضمان لكل المحاضر الابتدائية) |

**Router path:** `orpc.handover.*`

### 20.6 التكامل المحاسبي

عند إكمال محضر استلام نهائي (`FINAL`) مع مبلغ محتجزات > 0:
- **القيد التلقائي:** DR: 2150 (محتجزات) / CR: 1120 (عملاء)
- **المرجع:** `HANDOVER_RETENTION_RELEASE` → `HR-JE-YYYY-XXXX`
- **الفشل آمن:** أخطاء القيد تُسجّل في audit trail بدون كسر العملية

### 20.7 Frontend

| المكون | الموقع | الوصف |
|--------|--------|-------|
| `HandoverProtocolsList.tsx` | projects/handover | قائمة + بحث + فلاتر (نوع، حالة) |
| `HandoverProtocolForm.tsx` | projects/handover/new | إنشاء محضر + أطراف + شروط |
| `HandoverProtocolDetail.tsx` | projects/handover/[id] | تفاصيل + توقيعات + بنود + ضمان + طباعة |
| `HandoverItemDialog.tsx` | (dialog) | إضافة/تعديل بند مع تقييم جودة |

**التنقل:** أيقونة ClipboardCheck في sidebar المشروع → `/projects/[id]/handover`

---

## 21. نظام سندات الصرف (Payment Vouchers — أُضيف 2026-03-28)

### 21.1 نظرة عامة

نظام سندات صرف كامل مع workflow اعتماد ثنائي (إعداد → اعتماد)، ربط اختياري بالمصروفات/عقود الباطن، وتكامل محاسبي تلقائي.

### 21.2 State Machine

```
DRAFT ──submit──→ PENDING_APPROVAL ──approve──→ ISSUED
  │                      │                         │
  │                    reject                   cancel
  │                      ↓                         ↓
  └──cancel──→      CANCELLED                CANCELLED
```

### 21.3 حقول السند الرئيسية

- `voucherNo`: PMT-YYYY-XXXX (ترقيم ذري)
- `payeeType`: SUBCONTRACTOR | SUPPLIER | EMPLOYEE | OTHER
- `paymentMethod`: CASH | BANK_TRANSFER | CHEQUE | CREDIT_CARD | OTHER
- حقول شرطية: `checkNumber/checkDate/checkBank` (شيك) أو `transferRef/bankName` (تحويل)
- ربط اختياري: `projectId`, `subcontractContractId`, `expenseId`
- `amountInWords`: توليد تلقائي بالعربية عبر `numberToArabicWords()`

### 21.4 API Endpoints (10 endpoints)

```
finance.disbursements.list / getById / create / update / submit / approve / reject / cancel / print / getSummary
```

### 21.5 التكامل المحاسبي

- **سندات يدوية فقط** (بدون ربط بمصروف أو دفعة مقاول): عند الاعتماد → `onPaymentVoucherApproved()`
- **المرجع:** `PAYMENT_VOUCHER` → `PV-JE-YYYY-XXXX`
- **عند الإلغاء من ISSUED:** يعكس القيد تلقائياً عبر `reverseAutoJournalEntry()`

---

## 22. ملاحظات بيئة العمل

- **نظام التشغيل:** Windows (primary)
- **المحرر:** VS Code / Cursor
- **Claude Code:** مع `--dangerously-skip-permissions` flag
- **pnpm على Windows بطيء جداً** — تجنب `pnpm install` الكامل
- **النص العربي معكوس في Windows Terminal** — استخدم ملفات `.md` للبرومبتات
- **الجهاز الثاني:** GitHub Codespaces (Linux — syntax مختلف)
- **Git identity** يحتاج إعداد على كل جهاز جديد

---

*هذا الملف يُحدّث مع كل تطوير كبير. آخر مراجعة: 2026-03-28*