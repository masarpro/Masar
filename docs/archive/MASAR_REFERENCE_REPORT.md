# تقرير مرجعي شامل - منصة مسار (Masar Platform)

> **تاريخ التقرير:** 2026-02-07
> **الإصدار:** v1.3.4
> **النوع:** منصة SaaS لإدارة مشاريع البناء والمقاولات

---

## جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [البنية المعمارية](#2-البنية-المعمارية)
3. [التقنيات والاعتماديات](#3-التقنيات-والاعتماديات)
4. [وحدات التطبيق](#4-وحدات-التطبيق)
5. [قاعدة البيانات](#5-قاعدة-البيانات)
6. [طبقة API](#6-طبقة-api)
7. [صفحات التطبيق والتوجيه](#7-صفحات-التطبيق-والتوجيه)
8. [الترجمة والتدويل](#8-الترجمة-والتدويل)
9. [التكاملات الخارجية](#9-التكاملات-الخارجية)
10. [المشاكل المحتملة والتحسينات](#10-المشاكل-المحتملة-والتحسينات)
11. [دليل المطورين](#11-دليل-المطورين)

---

## 1. نظرة عامة

### 1.1 وصف المشروع

**مسار (Masar)** هي منصة SaaS متكاملة لإدارة مشاريع البناء والمقاولات، مبنية على قاعدة **supastarter** - إطار عمل Monorepo جاهز للإنتاج. تركز المنصة على:

- إدارة المشاريع الإنشائية
- تتبع التنفيذ الميداني
- الإدارة المالية المتقدمة
- حساب الكميات والتكاليف
- التعاون بين الفرق

### 1.2 المعلومات الأساسية

| البند | القيمة |
|-------|--------|
| **اسم المشروع** | Masar Platform (منصة مسار) |
| **الإصدار الحالي** | v1.3.4 |
| **Node.js المطلوب** | ≥20 |
| **مدير الحزم** | pnpm 10.14.0 |
| **قاعدة البيانات** | PostgreSQL (via Supabase) |
| **اللغات المدعومة** | العربية، الإنجليزية |
| **العملة الافتراضية** | SAR (ريال سعودي) |
| **المنطقة الزمنية** | Asia/Riyadh |

### 1.3 الميزات الرئيسية

- **إدارة المشاريع:** إنشاء وتتبع المشاريع مع فريق متعدد الأدوار
- **التنفيذ الميداني:** تقارير يومية، صور، مشاكل، تحديثات
- **المالية:** فواتير، عروض أسعار، مصروفات، مقبوضات
- **حساب الكميات:** دراسات تكلفة مع حسابات هيكلية متقدمة
- **بوابة المالك:** واجهة خاصة لأصحاب المشاريع
- **أوامر التغيير:** إدارة التعديلات والاعتمادات
- **الذكاء الاصطناعي:** محادثات ذكية ومساعدة

---

## 2. البنية المعمارية

### 2.1 هيكل Monorepo

```
H:\Masar\supastarter-nextjs-3\
├── apps/                          # التطبيقات
│   └── web/                       # تطبيق Next.js الرئيسي
├── packages/                      # الحزم المشتركة (Backend)
│   ├── api/                       # طبقة API (oRPC)
│   ├── auth/                      # المصادقة (Better Auth)
│   ├── database/                  # قاعدة البيانات (Prisma)
│   ├── ai/                        # تكاملات الذكاء الاصطناعي
│   ├── i18n/                      # الترجمة والتدويل
│   ├── mail/                      # إرسال البريد الإلكتروني
│   ├── payments/                  # معالجة المدفوعات
│   ├── storage/                   # تخزين الملفات (S3)
│   ├── logs/                      # التسجيل
│   └── utils/                     # الأدوات المساعدة
├── config/                        # الإعدادات العامة
├── tooling/                       # أدوات البناء
│   ├── tailwind/                  # إعدادات Tailwind
│   ├── typescript/                # إعدادات TypeScript
│   └── scripts/                   # سكربتات البناء
├── docs/                          # التوثيق
├── turbo.json                     # إعدادات Turbo
├── pnpm-workspace.yaml            # إعدادات مساحة العمل
├── package.json                   # حزمة الجذر
└── agents.md                      # دليل وكلاء الكود
```

### 2.2 هيكل تطبيق Web

```
apps/web/
├── app/                           # Next.js App Router
│   ├── (marketing)/               # صفحات التسويق العامة
│   │   └── [locale]/              # التوجيه حسب اللغة
│   ├── (saas)/                    # التطبيق المحمي
│   │   ├── app/                   # لوحة القيادة
│   │   │   ├── (account)/         # إعدادات الحساب
│   │   │   └── (organizations)/   # المنظمات
│   │   │       └── [organizationSlug]/
│   │   │           ├── finance/   # المالية
│   │   │           ├── projects/  # المشاريع
│   │   │           └── quantities/# الكميات
│   │   ├── owner/                 # بوابة المالك العامة
│   │   ├── choose-plan/           # اختيار الخطة
│   │   ├── onboarding/            # التهيئة
│   │   └── new-organization/      # منظمة جديدة
│   ├── auth/                      # صفحات المصادقة
│   ├── api/                       # API Routes
│   └── share/                     # المشاركة العامة
├── modules/                       # وحدات الميزات
│   ├── saas/                      # وحدات SaaS
│   │   ├── finance/               # وحدة المالية
│   │   ├── projects/              # وحدة المشاريع
│   │   ├── quantities/            # وحدة الكميات
│   │   ├── organizations/         # وحدة المنظمات
│   │   └── ...                    # وحدات أخرى
│   ├── marketing/                 # وحدات التسويق
│   ├── shared/                    # المكونات المشتركة
│   ├── ui/                        # مكتبة Shadcn UI
│   └── i18n/                      # التدويل
├── content/                       # محتوى MDX
│   ├── docs/                      # التوثيق
│   ├── legal/                     # صفحات قانونية
│   └── posts/                     # المدونة
├── public/                        # الملفات الثابتة
└── tests/                         # اختبارات E2E
```

### 2.3 علاقات الحزم

```
@repo/web (التطبيق الرئيسي)
  ├── @repo/api (طبقة API)
  │     ├── @repo/database (قاعدة البيانات)
  │     ├── @repo/auth (المصادقة)
  │     └── @repo/mail (البريد)
  ├── @repo/config (الإعدادات)
  ├── @repo/i18n (الترجمة)
  ├── @repo/payments (المدفوعات)
  └── @repo/storage (التخزين)
```

---

## 3. التقنيات والاعتماديات

### 3.1 Frontend Stack

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **Next.js** | 16.1.0 | إطار React للـ SSR/SSG |
| **React** | 19.2.3 | مكتبة واجهات المستخدم |
| **TypeScript** | 5.9.3 | لغة البرمجة |
| **Tailwind CSS** | 4.1.17 | إطار التنسيق |
| **Shadcn UI** | Latest | مكتبة المكونات |
| **Radix UI** | 1.x | مكونات الوصول |
| **Lucide React** | 0.553.0 | مكتبة الأيقونات |

### 3.2 إدارة الحالة والبيانات

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **TanStack Query** | 5.90.9 | إدارة حالة الخادم |
| **React Hook Form** | 7.66.0 | إدارة النماذج |
| **Zod** | 4.1.12 | التحقق من البيانات |
| **nuqs** | 2.7.3 | إدارة حالة URL |

### 3.3 Backend Stack

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **oRPC** | 1.13.2 | RPC آمن الأنواع |
| **Hono** | 4.10.5 | إطار الويب |
| **Prisma** | 7.1.0 | ORM لقاعدة البيانات |
| **Better Auth** | 1.4.7 | نظام المصادقة |
| **PostgreSQL** | - | قاعدة البيانات (via Supabase) |

### 3.4 الذكاء الاصطناعي

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **Vercel AI SDK** | 5.0.93 | تجريد نماذج AI |
| **OpenAI SDK** | - | تكامل OpenAI |
| **Anthropic SDK** | 2.0.44 | تكامل Claude |

### 3.5 البنية التحتية

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **pnpm** | 10.14.0 | مدير الحزم |
| **Turbo** | 2.7.2 | بناء Monorepo |
| **Biome** | 2.3.5 | Linter/Formatter |
| **Playwright** | 1.56.1 | اختبارات E2E |
| **AWS S3** | - | تخزين الملفات |

### 3.6 مزودو الخدمات المدعومون

**البريد الإلكتروني:**
- Resend
- Postmark
- Mailgun
- Nodemailer
- Plunk

**المدفوعات:**
- Stripe
- Lemonsqueezy
- Polar
- DodoPayments
- Chargebee

**التحليلات:**
- Google Analytics
- Plausible
- Mixpanel
- Pirsch

---

## 4. وحدات التطبيق

### 4.1 وحدة المالية (Finance Module)

**الموقع:** `apps/web/modules/saas/finance/`

#### المكونات الرئيسية

```
finance/
├── components/
│   ├── dashboard/              # لوحة التحكم المالية
│   │   ├── FinanceDashboard    # الواجهة الرئيسية
│   │   ├── BalanceCards        # بطاقات الأرصدة
│   │   ├── CashFlowCard        # التدفق النقدي
│   │   └── QuickActionsGrid    # الإجراءات السريعة
│   ├── clients/                # إدارة العملاء
│   │   ├── ClientForm          # نموذج العميل
│   │   ├── ClientDetail        # تفاصيل العميل
│   │   └── ClientsList         # قائمة العملاء
│   ├── banks/                  # الحسابات البنكية
│   │   ├── BankForm            # نموذج البنك
│   │   └── BanksList           # قائمة البنوك
│   ├── invoices/               # الفواتير
│   │   ├── CreateInvoiceForm   # إنشاء فاتورة
│   │   ├── InvoiceEditor       # محرر الفاتورة
│   │   └── InvoicePreview      # معاينة الفاتورة
│   ├── quotations/             # عروض الأسعار
│   │   ├── QuotationForm       # نموذج العرض
│   │   └── QuotationPreview    # معاينة العرض
│   ├── expenses/               # المصروفات
│   │   ├── ExpenseForm         # نموذج المصروف
│   │   └── ExpensesList        # قائمة المصروفات
│   ├── payments/               # المقبوضات
│   │   ├── PaymentForm         # نموذج الدفعة
│   │   └── ReceiptVoucher      # سند القبض
│   ├── documents/              # المستندات
│   ├── templates/              # قوالب المستندات
│   │   ├── TemplateEditor      # محرر القوالب
│   │   ├── TemplateRenderer    # عارض القوالب
│   │   └── InteractivePreview  # معاينة تفاعلية
│   ├── reports/                # التقارير
│   └── settings/               # الإعدادات
└── lib/                        # الأدوات المساعدة
```

#### قائمة التنقل

| القسم | الأيقونة | الوصف |
|-------|----------|-------|
| لوحة التحكم | Wallet | نظرة عامة على الوضع المالي |
| عروض الأسعار | FileText | إدارة عروض الأسعار |
| الفواتير | Receipt | إدارة الفواتير |
| الحسابات | Building | الحسابات البنكية والصناديق |
| المصروفات | TrendingDown | تتبع المصروفات |
| المقبوضات | TrendingUp | تتبع الإيرادات |
| المستندات | FolderOpen | المستندات المفتوحة |
| القوالب | LayoutTemplate | قوالب المستندات |
| العملاء | Users | إدارة العملاء |
| التقارير | BarChart3 | التقارير المالية |

### 4.2 وحدة المشاريع (Projects Module)

**الموقع:** `apps/web/modules/saas/projects/`

#### المكونات الرئيسية

```
projects/
├── components/
│   ├── field/                  # التنفيذ الميداني
│   │   ├── DailyReportCard     # بطاقة التقرير اليومي
│   │   ├── FieldTimeline       # الجدول الزمني
│   │   ├── IssueCard           # بطاقة المشكلة
│   │   └── PhotoGrid           # شبكة الصور
│   ├── finance/                # المالية (على مستوى المشروع)
│   │   ├── ClaimsTable         # جدول المستخلصات
│   │   ├── ExpensesTable       # جدول المصروفات
│   │   └── FinanceSummary      # ملخص مالي
│   ├── forms/                  # النماذج
│   │   ├── DailyReportForm     # نموذج التقرير اليومي
│   │   ├── IssueForm           # نموذج المشكلة
│   │   └── ProgressUpdateForm  # نموذج تحديث التقدم
│   ├── shell/                  # الهيكل والتنقل
│   │   ├── ProjectShell        # الهيكل الرئيسي
│   │   └── ProjectNavigation   # التنقل
│   ├── supervisor/             # وضع المشرف
│   └── team/                   # إدارة الفريق
└── lib/                        # الأدوات المساعدة
```

#### أقسام التنقل (Grouped Navigation)

1. **التنفيذ (Execution)**
   - التقارير الميدانية (Field Reports)
   - وضع المشرف (Supervisor Mode)

2. **المالية (Finance)**
   - رابط مباشر للوحدة المالية

3. **التخطيط (Planning)**
   - الجدول الزمني (Timeline)
   - أوامر التغيير (Change Orders)

4. **التواصل (Communication)**
   - المستندات (Documents)
   - المحادثات (Chat)
   - التحديثات الرسمية (Official Updates)

5. **المزيد (More)**
   - بوابة المالك (Owner Portal)
   - الرؤى والتحليلات (Insights)
   - الفريق (Team)

### 4.3 وحدة الكميات (Quantities Module)

**الموقع:** `apps/web/modules/saas/quantities/`

#### المكونات الرئيسية

```
quantities/
├── components/
│   ├── QuantitiesList          # قائمة الدراسات
│   ├── CostStudyCard           # بطاقة الدراسة
│   ├── CostStudyOverview       # نظرة عامة
│   ├── StructuralItemsEditor   # محرر البنود الإنشائية
│   ├── FinishingItemsEditor    # محرر بنود التشطيب
│   ├── MEPItemsEditor          # محرر الكهروميكانيكا
│   ├── PricingEditor           # محرر التسعير
│   └── sections/               # أقسام الحسابات
│       ├── BeamsSection        # الكمرات
│       ├── ColumnsSection      # الأعمدة
│       ├── SlabsSection        # البلاطات
│       ├── FoundationsSection  # الأساسات
│       └── StairsSection       # السلالم
├── constants/                  # الثوابت
│   ├── blocks.ts               # مواصفات البلوك
│   ├── prices.ts               # الأسعار
│   └── slabs.ts                # إعدادات البلاطات
└── lib/                        # الحسابات
    ├── calculations.ts         # المحرك الحسابي
    ├── structural-calculations.ts
    └── cutting/                # تحسين القطع
        ├── cutting-optimizer.ts    # محسن قص الحديد
        ├── remnant-manager.ts      # إدارة الفضلات
        ├── saudi-rebar-specs.ts    # مواصفات حديد سعودي
        └── waste-analyzer.ts       # تحليل الهدر
```

#### الميزات المتقدمة

- **حسابات هيكلية:** خرسانة، حديد تسليح، قوالب
- **تحسين القطع:** خوارزميات لتقليل هدر الحديد
- **المعايير السعودية:** مواصفات حديد التسليح السعودي
- **بنود MEP:** كهرباء، سباكة، تكييف
- **التشطيبات:** دهانات، أرضيات، أسقف

### 4.4 وحدة المنظمات (Organizations Module)

**الموقع:** `apps/web/modules/saas/organizations/`

```
organizations/
├── components/
│   ├── CreateOrganizationForm  # إنشاء منظمة
│   ├── OrganizationMembersList # قائمة الأعضاء
│   ├── InviteMemberForm        # دعوة عضو
│   ├── OrganizationRoleSelect  # اختيار الدور
│   └── TeamManagementTabs      # إدارة الفريق
├── hooks/
│   └── use-active-organization.ts
└── lib/
    └── active-organization-context.ts
```

### 4.5 الوحدات الأخرى

| الوحدة | الموقع | الوصف |
|--------|--------|-------|
| **Auth** | `modules/saas/auth/` | المصادقة وتسجيل الدخول |
| **Dashboard** | `modules/saas/dashboard/` | لوحة التحكم الرئيسية |
| **Settings** | `modules/saas/settings/` | إعدادات الحساب والمنظمة |
| **Admin** | `modules/saas/admin/` | لوحة الإدارة |
| **Payments** | `modules/saas/payments/` | الاشتراكات والدفع |
| **AI** | `modules/saas/ai/` | المحادثات الذكية |
| **Integrations** | `modules/saas/integrations/` | التكاملات الخارجية |
| **Projects Timeline** | `modules/saas/projects-timeline/` | المعالم الزمنية |
| **Projects Changes** | `modules/saas/projects-changes/` | أوامر التغيير |

---

## 5. قاعدة البيانات

### 5.1 معلومات عامة

| البند | القيمة |
|-------|--------|
| **ORM** | Prisma 7.1.0 |
| **قاعدة البيانات** | PostgreSQL (Supabase) |
| **موقع Schema** | `packages/database/prisma/schema.prisma` |
| **عدد الأسطر** | 2,512 سطر |
| **عدد النماذج** | 48+ نموذج |
| **عدد Enums** | 40+ enum |

### 5.2 النماذج الرئيسية (Models)

#### المستخدمون والمصادقة

| النموذج | الوصف | الحقول الرئيسية |
|---------|-------|-----------------|
| **User** | المستخدم | id, name, email, role, accountType |
| **Session** | الجلسة | token, userId, expiresAt |
| **Account** | حساب OAuth | providerId, accessToken |
| **Passkey** | مفتاح المرور | publicKey, credentialID |
| **TwoFactor** | المصادقة الثنائية | secret, backupCodes |

#### المنظمات والأدوار

| النموذج | الوصف | الحقول الرئيسية |
|---------|-------|-----------------|
| **Organization** | المنظمة | name, slug, ownerId, currency |
| **Member** | عضو المنظمة | organizationId, userId, role |
| **Role** | الدور | name, type, permissions |
| **Invitation** | الدعوة | email, status, expiresAt |

#### المشاريع

| النموذج | الوصف | الحقول الرئيسية |
|---------|-------|-----------------|
| **Project** | المشروع | name, status, contractValue, progress |
| **ProjectMember** | عضو المشروع | projectId, userId, role |
| **ProjectDailyReport** | التقرير اليومي | reportDate, manpower, workDone |
| **ProjectPhoto** | صورة المشروع | url, caption, category |
| **ProjectIssue** | مشكلة | title, severity, status |
| **ProjectProgressUpdate** | تحديث التقدم | progress, phaseLabel |
| **ProjectMilestone** | معلم زمني | title, plannedStart, status |
| **ProjectChangeOrder** | أمر تغيير | title, costImpact, status |

#### المالية (على مستوى المشروع)

| النموذج | الوصف | الحقول الرئيسية |
|---------|-------|-----------------|
| **ProjectExpense** | مصروف المشروع | amount, category, vendorName |
| **ProjectClaim** | مستخلص | claimNo, amount, status |
| **ProjectDocument** | مستند | title, folder, fileUrl |
| **ProjectApproval** | اعتماد | status, requestedById |

#### المالية (على مستوى المنظمة)

| النموذج | الوصف | الحقول الرئيسية |
|---------|-------|-----------------|
| **Client** | العميل | name, phone, email, taxNumber |
| **Quotation** | عرض السعر | quotationNo, totalAmount, status |
| **FinanceInvoice** | الفاتورة | invoiceNo, totalAmount, status |
| **OrganizationBank** | الحساب البنكي | name, iban, balance |
| **FinanceExpense** | المصروف | amount, category, date |
| **FinancePayment** | المقبوض | amount, clientId, date |
| **FinanceTransfer** | التحويل | amount, fromAccountId, toAccountId |
| **FinanceTemplate** | قالب المستند | name, templateType, content |

#### دراسات التكلفة

| النموذج | الوصف | الحقول الرئيسية |
|---------|-------|-----------------|
| **CostStudy** | دراسة التكلفة | name, totalCost, status |
| **StructuralItem** | بند إنشائي | category, quantity, totalCost |
| **FinishingItem** | بند تشطيب | category, area, totalCost |
| **MEPItem** | بند كهروميكانيكا | category, quantity, totalCost |
| **Quote** | عرض سعر | quoteNumber, totalAmount |

### 5.3 Enums الرئيسية

#### حالات المشروع والأدوار

```typescript
enum ProjectStatus {
  ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
}

enum ProjectRole {
  MANAGER, ENGINEER, SUPERVISOR, ACCOUNTANT, VIEWER
}

enum RoleType {
  OWNER, PROJECT_MANAGER, ACCOUNTANT, ENGINEER, SUPERVISOR, CUSTOM
}
```

#### التنفيذ الميداني

```typescript
enum IssueSeverity { LOW, MEDIUM, HIGH, CRITICAL }
enum IssueStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
enum WeatherCondition { SUNNY, CLOUDY, RAINY, WINDY, DUSTY, HOT, COLD }
enum PhotoCategory { PROGRESS, ISSUE, EQUIPMENT, MATERIAL, SAFETY, OTHER }
```

#### المالية

```typescript
enum ClaimStatus { DRAFT, SUBMITTED, APPROVED, PAID, REJECTED }
enum QuotationStatus { DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, CONVERTED }
enum FinanceInvoiceStatus { DRAFT, SENT, VIEWED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED }
enum InvoiceType { STANDARD, TAX, SIMPLIFIED }
enum PaymentMethod { CASH, BANK_TRANSFER, CHEQUE, CREDIT_CARD, OTHER }
```

#### فئات المصروفات

```typescript
enum OrgExpenseCategory {
  MATERIALS, LABOR, EQUIPMENT_RENTAL, EQUIPMENT_PURCHASE,
  SUBCONTRACTOR, TRANSPORT, SALARIES, RENT, UTILITIES,
  COMMUNICATIONS, INSURANCE, LICENSES, BANK_FEES, FUEL,
  MAINTENANCE, SUPPLIES, MARKETING, TRAINING, TRAVEL,
  HOSPITALITY, LOAN_PAYMENT, TAXES, ZAKAT, REFUND, MISC, CUSTOM
}
```

---

## 6. طبقة API

### 6.1 البنية العامة

**الإطار:** oRPC 1.13.2 مع Hono
**المسار الأساسي:** `/api`
**التوثيق:** OpenAPI 3.0 في `/api/docs`

### 6.2 الإجراءات الأساسية (Procedures)

```typescript
// إجراء عام - بدون مصادقة
const publicProcedure = base.use(localeMiddleware);

// إجراء محمي - يتطلب مصادقة
const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
  const session = await getSession(context.headers);
  if (!session) throw new ORPCError("UNAUTHORIZED");
  return next({ context: { ...context, session, user: session.user } });
});

// إجراء إداري - يتطلب دور admin
const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (context.user.role !== "admin") throw new ORPCError("FORBIDDEN");
  return next({ context });
});
```

### 6.3 نظام الصلاحيات

**الموقع:** `packages/api/lib/permissions/`

#### أقسام الصلاحيات

```typescript
interface Permissions {
  projects: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    viewFinance: boolean;
    manageTeam: boolean;
  };
  quantities: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    pricing: boolean;
  };
  finance: {
    view: boolean;
    quotations: boolean;
    invoices: boolean;
    payments: boolean;
    reports: boolean;
    settings: boolean;
  };
  employees: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    payroll: boolean;
    attendance: boolean;
  };
  settings: {
    organization: boolean;
    users: boolean;
    roles: boolean;
    billing: boolean;
    integrations: boolean;
  };
  reports: {
    view: boolean;
    create: boolean;
    approve: boolean;
  };
}
```

#### الأدوار الافتراضية

| الدور | الوصف | الصلاحيات |
|-------|-------|----------|
| **OWNER** | المالك | جميع الصلاحيات |
| **PROJECT_MANAGER** | مدير المشاريع | المشاريع، الفريق، التقارير |
| **ACCOUNTANT** | المحاسب | المالية، الفواتير، المدفوعات |
| **ENGINEER** | المهندس | الكميات، تعديل المشاريع |
| **SUPERVISOR** | المشرف | عرض فقط، إنشاء التقارير |
| **CUSTOM** | مخصص | صلاحيات محددة |

### 6.4 وحدات API (30 وحدة)

#### وحدات المشاريع

| الوحدة | الإجراءات الرئيسية |
|--------|-------------------|
| **projects** | list, create, getById, update, delete |
| **projectFinance** | getSummary, listExpenses, createExpense, listClaims, createClaim |
| **projectField** | createDailyReport, listPhotos, createIssue, addProgressUpdate |
| **projectDocuments** | list, create, createApprovalRequest, actOnApproval |
| **projectChat** | listMessages, sendMessage |
| **projectTimeline** | listMilestones, createMilestone, startMilestone, completeMilestone |
| **projectChangeOrders** | list, create, submit, approve, reject, implement |
| **projectTeam** | list, add, updateRole, remove |
| **projectOwner** | createAccess, portal.getSummary, portal.sendMessage |
| **projectUpdates** | generateDraft, publish |
| **projectTemplates** | list, create, apply, addItem |
| **projectInsights** | get, acknowledge |

#### وحدات المالية

| الوحدة | الإجراءات الرئيسية |
|--------|-------------------|
| **finance.clients** | list, getById, create, update, delete, contacts.* |
| **finance.quotations** | list, create, updateStatus, convertToInvoice |
| **finance.invoices** | list, create, addPayment, convertToTax |
| **finance.banks** | list, create, setDefault, getSummary |
| **finance.expenses** | list, create, update, getSummary |
| **finance.orgPayments** | list, create, update |
| **finance.transfers** | list, create, cancel |
| **finance.templates** | list, create, setDefault, seed |
| **finance.reports** | revenueByPeriod, revenueByClient, quotationStats |
| **finance.settings** | get, update |

#### وحدات أخرى

| الوحدة | الوصف |
|--------|-------|
| **admin** | إدارة المستخدمين والمنظمات |
| **users** | تحميل صورة المستخدم |
| **organizations** | إنشاء وإدارة المنظمات |
| **orgUsers** | إدارة موظفي المنظمة |
| **roles** | إدارة الأدوار والصلاحيات |
| **notifications** | الإشعارات (list, markRead) |
| **attachments** | رفع وتحميل الملفات |
| **ai** | المحادثات الذكية |
| **exports** | تصدير PDF/CSV/ICS |
| **integrations** | إعدادات التكاملات |
| **shares** | مشاركة الموارد |
| **digests** | ملخصات البريد |
| **quantities** | دراسات التكلفة |
| **dashboard** | إحصائيات لوحة التحكم |
| **payments** | اشتراكات Stripe |

---

## 7. صفحات التطبيق والتوجيه

### 7.1 مجموعات المسارات (Route Groups)

#### (marketing) - التسويق

```
/(marketing)/[locale]/
├── (home)/page.tsx              # الصفحة الرئيسية
├── blog/page.tsx                # المدونة
├── blog/[...path]/page.tsx      # مقالات المدونة
├── docs/[[...path]]/page.tsx    # التوثيق
├── contact/page.tsx             # اتصل بنا
├── changelog/page.tsx           # سجل التغييرات
└── legal/[...path]/page.tsx     # الصفحات القانونية
```

#### (saas) - التطبيق

```
/(saas)/
├── choose-plan/page.tsx         # اختيار الخطة
├── onboarding/page.tsx          # التهيئة
├── new-organization/page.tsx    # إنشاء منظمة
├── organization-invitation/[invitationId]/page.tsx
│
├── owner/[token]/               # بوابة المالك العامة
│   ├── page.tsx                 # لوحة التحكم
│   ├── changes/page.tsx         # أوامر التغيير
│   ├── chat/page.tsx            # المحادثات
│   ├── payments/page.tsx        # المدفوعات
│   └── schedule/page.tsx        # الجدول الزمني
│
└── app/                         # التطبيق المحمي
    ├── (account)/               # الحساب الشخصي
    │   ├── page.tsx             # الملف الشخصي
    │   ├── chatbot/page.tsx     # المحادثة الذكية
    │   ├── admin/               # لوحة الإدارة
    │   │   ├── users/page.tsx
    │   │   └── organizations/page.tsx
    │   └── settings/            # الإعدادات
    │       ├── general/page.tsx
    │       ├── security/page.tsx
    │       ├── billing/page.tsx
    │       └── danger-zone/page.tsx
    │
    └── (organizations)/[organizationSlug]/  # المنظمة
        ├── page.tsx             # لوحة التحكم
        ├── notifications/page.tsx
        ├── settings/            # إعدادات المنظمة
        │
        ├── finance/             # المالية (25+ صفحة)
        │   ├── page.tsx         # لوحة التحكم
        │   ├── banks/**
        │   ├── clients/**
        │   ├── invoices/**
        │   ├── quotations/**
        │   ├── expenses/**
        │   ├── payments/**
        │   ├── documents/**
        │   ├── templates/**
        │   ├── reports/**
        │   └── settings/page.tsx
        │
        ├── projects/            # المشاريع
        │   ├── page.tsx         # قائمة المشاريع
        │   ├── new/page.tsx     # مشروع جديد
        │   └── [projectId]/     # المشروع
        │       ├── page.tsx     # نظرة عامة
        │       ├── field/**     # التنفيذ الميداني
        │       ├── finance/**   # المالية
        │       ├── documents/** # المستندات
        │       ├── timeline/**  # الجدول الزمني
        │       ├── changes/**   # أوامر التغيير
        │       ├── chat/**      # المحادثات
        │       ├── team/**      # الفريق
        │       └── insights/**  # التحليلات
        │
        └── quantities/          # الكميات
            ├── page.tsx         # قائمة الدراسات
            ├── new/page.tsx     # دراسة جديدة
            └── [studyId]/       # الدراسة
                ├── page.tsx     # نظرة عامة
                ├── structural/  # الإنشائي
                ├── mep/         # الكهروميكانيكا
                ├── finishing/   # التشطيبات
                └── pricing/     # التسعير
```

#### auth - المصادقة

```
/auth/
├── login/page.tsx               # تسجيل الدخول
├── signup/page.tsx              # إنشاء حساب
├── verify/page.tsx              # التحقق من البريد
├── forgot-password/page.tsx     # نسيت كلمة المرور
├── reset-password/page.tsx      # إعادة تعيين كلمة المرور
└── change-password/page.tsx     # تغيير كلمة المرور
```

### 7.2 المسارات الخاصة

| المسار | الوصف |
|--------|-------|
| `/api/[[...rest]]` | جميع طلبات API |
| `/share/[token]` | مشاركة المستندات |
| `/image-proxy/[...path]` | وكيل الصور |

### 7.3 إحصائيات المسارات

| القسم | عدد الصفحات |
|-------|-------------|
| التسويق | 8+ |
| المصادقة | 6 |
| المالية | 25+ |
| المشاريع | 15+ |
| الكميات | 5 |
| الإعدادات | 12 |
| **المجموع** | **70+** |

---

## 8. الترجمة والتدويل

### 8.1 اللغات المدعومة

| اللغة | الكود | الاتجاه |
|-------|-------|---------|
| العربية | ar | RTL |
| الإنجليزية | en | LTR |

### 8.2 ملفات الترجمة

**الموقع:** `packages/i18n/translations/`

```
translations/
├── ar.json    # الترجمة العربية
└── en.json    # الترجمة الإنجليزية
```

### 8.3 التقنية المستخدمة

- **المكتبة:** next-intl 4.5.3
- **الدمج:** deepmerge 4.3.1

### 8.4 أمثلة الترجمة

```json
{
  "finance": {
    "dashboard": "لوحة التحكم المالية",
    "clients": "العملاء",
    "invoices": "الفواتير",
    "quotations": "عروض الأسعار",
    "expenses": "المصروفات",
    "payments": "المقبوضات"
  },
  "projects": {
    "title": "المشاريع",
    "create": "مشروع جديد",
    "field": "التنفيذ الميداني",
    "timeline": "الجدول الزمني"
  }
}
```

---

## 9. التكاملات الخارجية

### 9.1 ZATCA (هيئة الزكاة والضريبة)

**الموقع:** `packages/api/lib/zatca/`

- توليد رموز QR للفواتير الضريبية
- حقول الفاتورة: `sellerTaxNumber`, `qrCode`, `zatcaUuid`, `zatcaHash`, `zatcaSignature`
- دعم أنواع الفواتير: STANDARD, TAX, SIMPLIFIED

### 9.2 بوابات الدفع

| البوابة | الاستخدام |
|---------|----------|
| **Stripe** | الاشتراكات الرئيسية |
| **Lemonsqueezy** | بديل للاشتراكات |
| **Polar** | المدفوعات الدولية |
| **DodoPayments** | خيار إضافي |
| **Chargebee** | إدارة الاشتراكات |

### 9.3 خدمات البريد الإلكتروني

| الخدمة | الحالة |
|--------|--------|
| Resend | ✅ مدعوم |
| Postmark | ✅ مدعوم |
| Mailgun | ✅ مدعوم |
| Nodemailer | ✅ مدعوم |
| Plunk | ✅ مدعوم |

### 9.4 التخزين السحابي

- **AWS S3** للملفات والمرفقات
- دعم Presigned URLs للرفع المباشر

### 9.5 نظام الرسائل

```typescript
enum MessagingChannel {
  EMAIL,
  WHATSAPP,
  SMS
}
```

---

## 10. المشاكل المحتملة والتحسينات

### 10.1 مشاكل محتملة في الكود

#### 1. حجم ملف Schema كبير
- **الملف:** `packages/database/prisma/schema.prisma`
- **الحجم:** 2,512 سطر
- **المشكلة:** صعوبة الصيانة والتنقل
- **الحل المقترح:** تقسيم Schema إلى ملفات متعددة باستخدام `prisma-merge` أو إعادة هيكلة

#### 2. تكرار منطق الصلاحيات
- بعض التحققات من الصلاحيات مكررة في عدة ملفات
- **الحل:** توحيد في middleware مركزي

#### 3. ملفات TypeScript بدون strict null checks
- قد تسبب أخطاء runtime غير متوقعة

### 10.2 تحسينات مقترحة

#### أولوية عالية

1. **إضافة اختبارات وحدة (Unit Tests)**
   - تغطية API procedures
   - تغطية حسابات الكميات
   - تغطية منطق الصلاحيات

2. **تحسين أداء الاستعلامات**
   - إضافة indices للحقول المستخدمة في البحث
   - استخدام pagination في جميع القوائم
   - تفعيل caching للبيانات الثابتة

3. **تحسين الأمان**
   - مراجعة جميع endpoints للتأكد من الصلاحيات
   - إضافة rate limiting
   - تشفير البيانات الحساسة

#### أولوية متوسطة

4. **تحسين تجربة المستخدم**
   - إضافة loading skeletons
   - تحسين رسائل الخطأ
   - إضافة تأكيدات للعمليات الحساسة

5. **توثيق API**
   - توثيق جميع endpoints
   - إضافة أمثلة استخدام
   - إنشاء Postman collection

6. **تحسين الأداء**
   - تفعيل Server Components حيث أمكن
   - تحسين bundle size
   - lazy loading للمكونات الكبيرة

#### أولوية منخفضة

7. **إضافة ميزات جديدة**
   - تطبيق موبايل
   - تقارير متقدمة
   - تكامل مع أنظمة ERP

8. **تحسين DevOps**
   - إضافة CI/CD pipeline
   - monitoring وalerting
   - automated backups

### 10.3 الديون التقنية (Technical Debt)

| المشكلة | الأولوية | الجهد المقدر |
|---------|----------|-------------|
| تقسيم Schema | عالية | متوسط |
| إضافة اختبارات | عالية | عالي |
| توثيق API | متوسطة | متوسط |
| تحسين الأداء | متوسطة | متوسط |
| تنظيف الكود المكرر | منخفضة | منخفض |

---

## 11. دليل المطورين

### 11.1 متطلبات البيئة

```bash
Node.js >= 20
pnpm 10.14.0
PostgreSQL (أو Supabase)
```

### 11.2 التشغيل المحلي

```bash
# تثبيت التبعيات
pnpm install

# إعداد ملف البيئة
cp .env.local.example .env.local

# تشغيل قاعدة البيانات (migrations)
pnpm db:migrate

# تشغيل التطوير
pnpm dev

# فتح التطبيق
# http://localhost:3000
```

### 11.3 الأوامر الرئيسية

```bash
# التطوير
pnpm dev              # تشغيل كل الخدمات
pnpm build            # بناء الإنتاج
pnpm start            # تشغيل الإنتاج
pnpm type-check       # فحص الأنواع

# قاعدة البيانات
pnpm db:migrate       # تطبيق migrations
pnpm db:studio        # فتح Prisma Studio
pnpm db:generate      # توليد Prisma Client

# الجودة
pnpm lint             # فحص الكود
pnpm format           # تنسيق الكود

# الاختبارات
pnpm e2e              # اختبارات E2E (واجهة)
pnpm e2e:ci           # اختبارات E2E (CI)
```

### 11.4 Path Aliases

```typescript
@repo/*           → packages/*
@shared/*         → apps/web/modules/shared/*
@saas/*           → apps/web/modules/saas/*
@marketing/*      → apps/web/modules/marketing/*
@ui/*             → apps/web/modules/ui/*
```

### 11.5 أنماط الكود

#### تسمية الملفات

```
PascalCase.tsx     # مكونات React
camelCase.ts       # ملفات الـ utilities
kebab-case/        # المجلدات
```

#### هيكل المكون

```typescript
// components/Example.tsx
"use client"; // إذا كان Client Component

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ExampleProps {
  title: string;
}

export function Example({ title }: ExampleProps) {
  const t = useTranslations("example");

  return (
    <div>
      <h1>{title}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

#### إجراء API

```typescript
// packages/api/modules/example/procedures/list.ts
import { protectedProcedure } from "@repo/api/orpc/procedures";
import { z } from "zod";

export const list = protectedProcedure
  .input(z.object({
    organizationId: z.string(),
    page: z.number().optional().default(1),
  }))
  .handler(async ({ input, context }) => {
    // التحقق من الصلاحيات
    await verifyOrganizationAccess({
      userId: context.user.id,
      organizationId: input.organizationId,
    });

    // جلب البيانات
    return await db.example.findMany({
      where: { organizationId: input.organizationId },
      skip: (input.page - 1) * 20,
      take: 20,
    });
  });
```

### 11.6 المتغيرات البيئية الرئيسية

```env
# قاعدة البيانات
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# المصادقة
BETTER_AUTH_SECRET=...
GITHUB_CLIENT_ID=...
GOOGLE_CLIENT_ID=...

# البريد
RESEND_API_KEY=...

# المدفوعات
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# التخزين
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=...

# الذكاء الاصطناعي
OPENAI_API_KEY=...
```

---

## الخاتمة

منصة **مسار** هي نظام SaaS متكامل لإدارة مشاريع البناء، مبني على أحدث التقنيات مع دعم كامل للغة العربية. المنصة توفر:

- **30+ وحدة API** لجميع العمليات
- **48+ نموذج قاعدة بيانات** لتخزين البيانات
- **70+ صفحة** في التطبيق
- **دعم ثنائي اللغة** (عربي/إنجليزي)
- **نظام صلاحيات متقدم** مع 6 أدوار افتراضية

---

> **ملاحظة:** هذا التقرير تم إنشاؤه تلقائياً بتاريخ 2026-02-07 ويعكس حالة الكود في ذلك التاريخ.
