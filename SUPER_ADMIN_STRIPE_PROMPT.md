# 🏗️ برومبت بناء Super Admin Panel + Stripe Billing لمنصة مسار

> **الوضع:** Plan Mode أولاً → ثم التنفيذ
> **الأولوية:** إنتاج جاهز (Production-Ready)
> **اللغة:** الكود بالإنجليزية، الواجهة ثنائية اللغة (عربي/إنجليزي)

---

## 🎯 السياق العام

أنت تعمل على **مسار (Masar)** — منصة SaaS لإدارة مشاريع البناء في السعودية. المنصة مبنية بالتقنيات التالية:

**Tech Stack:**
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** Prisma 7 + PostgreSQL (Supabase)
- **API:** ORPC (type-safe RPC) + Hono.js
- **Auth:** Better Auth (sessions, OAuth, 2FA, passkeys)
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **Payments:** Stripe (يوجد package في `packages/payments/`)
- **Email:** Resend
- **Storage:** AWS S3
- **Cache:** Redis (ioredis) مع circuit breaker
- **Validation:** Zod 4
- **State:** TanStack Query + TanStack Table

**بنية المشروع (Monorepo):**
```
├── apps/web/                    # تطبيق Next.js الرئيسي
│   ├── app/                     # App Router pages
│   │   ├── (saas)/              # SaaS pages
│   │   │   ├── app/             # Account-level pages
│   │   │   │   ├── (account)/   # Account settings
│   │   │   │   │   ├── admin/   # ← Admin pages (حالياً 3 صفحات بسيطة)
│   │   │   │   │   └── settings/
│   │   │   │   └── [organizationSlug]/  # Org-level pages
│   │   │   └── auth/
│   │   └── api/                 # API routes (Hono)
│   └── modules/                 # UI modules
│       └── saas/
│           ├── admin/           # ← Admin UI (حالياً 4 ملفات بسيطة)
│           ├── payments/        # ← Payments UI (حالياً 4 ملفات)
│           └── ...
├── packages/
│   ├── api/                     # ORPC API layer
│   │   ├── orpc/
│   │   │   ├── router.ts       # Main router
│   │   │   ├── procedures.ts   # Procedure types
│   │   │   └── middleware/      # Auth middleware
│   │   └── modules/            # 34 API modules
│   ├── database/
│   │   └── prisma/
│   │       ├── schema.prisma   # 3500+ lines, 77 models
│   │       └── queries/        # 39 query files
│   ├── auth/                   # BetterAuth config
│   ├── payments/               # ← Stripe package
│   └── mail/                   # Resend email
```

---

## 📊 الوضع الحالي (ما هو موجود)

### نموذج Organization الحالي:
```prisma
model Organization {
  id                  String   @id @default(cuid())
  name                String
  slug                String   @unique
  logo                String?
  createdAt           DateTime @default(now())
  metadata            String?
  paymentsCustomerId  String?        // ← Stripe Customer ID (موجود)
  ownerId             String   @unique
  commercialRegister  String?
  taxNumber           String?
  contractorClass     String?
  phone               String?
  address             String?
  city                String?
  currency            String   @default("SAR")
  timezone            String   @default("Asia/Riyadh")
  // ⚠️ لا يوجد: status, planId, subscriptionStatus, maxUsers, trialEndsAt
}
```

### نموذج User الحالي:
```prisma
model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  name                String?
  role                String?  @default("user")     // ← "user" أو "admin" (للسوبر أدمن)
  paymentsCustomerId  String?                        // ← Stripe Customer ID
  isActive            Boolean  @default(true)
  organizationId      String?
  accountType         String?  @default("OWNER")     // OWNER | EMPLOYEE | PROJECT_CLIENT
  // ... باقي الحقول
}
```

### نموذج Purchase الحالي:
```prisma
model Purchase {
  id              String  @id @default(cuid())
  organizationId  String
  type            String
  subscriptionId  String?
  productId       String?
  // ⚠️ بسيط جداً — يحتاج توسيع كبير
}
```

### صفحات Admin الحالية (بسيطة):
- `/app/admin/organizations` — قائمة المنظمات
- `/app/admin/organizations/[id]` — تفاصيل منظمة
- `/app/admin/users` — إدارة المستخدمين
- **Layout:** `(account)/admin/layout.tsx` — يتحقق من صلاحية admin

### نظام الصلاحيات الحالي:
- 8 أقسام: projects, quantities, pricing, finance, employees, company, settings, reports
- 6 أدوار: OWNER, PROJECT_MANAGER, ACCOUNTANT, ENGINEER, SUPERVISOR, CUSTOM
- User.role = "user" | "admin" (للسوبر أدمن)
- الحقل `role` في User يحدد إذا كان super admin

### أنماط ORPC المتبعة:
```typescript
// procedures.ts — أنواع الإجراءات
export const publicProcedure = base;
export const protectedProcedure = base.use(authMiddleware);
export const orgProcedure = protectedProcedure.use(orgMiddleware);

// كل router يتبع نمط:
// packages/api/modules/[module]/router.ts
// packages/api/modules/[module]/schema.ts (Zod schemas)
```

### أنماط Multi-tenancy:
```typescript
// كل استعلام يفلتر بـ organizationId:
where: {
  organizationId: input.organizationId,
  // ... شروط إضافية
}
```

---

## 🎯 المطلوب بناؤه

### المرحلة 1: تحديث Schema + Stripe Products

#### 1.1 تحديث نموذج Organization
```prisma
model Organization {
  // ... الحقول الحالية تبقى كما هي

  // ✅ حقول جديدة للاشتراك:
  status              OrgStatus        @default(TRIALING)
  plan                PlanType         @default(FREE)
  planName            String?          // اسم الخطة من Stripe
  stripeSubscriptionId String?         @unique
  stripeProductId     String?
  stripePriceId       String?
  subscriptionStatus  SubscriptionStatus @default(TRIALING)
  maxUsers            Int              @default(3)
  maxProjects         Int              @default(2)
  maxStorage          Int              @default(1)  // بالـ GB
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  trialEndsAt         DateTime?
  cancelAtPeriodEnd   Boolean          @default(false)
  lastPaymentAt       DateTime?
  lastPaymentAmount   Decimal?         @db.Decimal(10,2)
  billingEmail        String?

  // ⚠️ Override من السوبر أدمن:
  isFreeOverride      Boolean          @default(false)   // تجاوز مجاني من الأدمن
  overrideReason      String?
  overrideBy          String?          // معرف السوبر أدمن
  overrideAt          DateTime?
}
```

#### 1.2 Enums جديدة
```prisma
enum OrgStatus {
  ACTIVE           // يعمل بشكل طبيعي
  TRIALING         // في فترة تجريبية
  SUSPENDED        // موقوف (عدم دفع)
  CANCELLED        // ملغي
  PAST_DUE         // متأخر بالدفع
}

enum PlanType {
  FREE             // مجاني (محدود جداً)
  STARTER          // بداية (للمقاولين الصغار)
  PROFESSIONAL     // احترافي (للمقاولين المتوسطين)
  ENTERPRISE       // مؤسسي (مخصص)
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  INCOMPLETE
  PAUSED
}
```

#### 1.3 نموذج SubscriptionEvent جديد (سجل أحداث الاشتراك)
```prisma
model SubscriptionEvent {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(...)
  eventType       String       // "subscription.created", "invoice.paid", etc.
  stripeEventId   String       @unique
  data            Json         @db.JsonB
  processedAt     DateTime     @default(now())
  
  @@index([organizationId])
  @@index([eventType])
  @@index([stripeEventId])
  @@map("subscription_events")
}
```

#### 1.4 نموذج SuperAdminLog (سجل عمليات السوبر أدمن)
```prisma
model SuperAdminLog {
  id          String   @id @default(cuid())
  adminId     String
  admin       User     @relation(...)
  action      String       // "override_plan", "suspend_org", "activate_free"
  targetType  String       // "organization", "user"
  targetId    String
  details     Json?        @db.JsonB
  ipAddress   String?
  createdAt   DateTime     @default(now())

  @@index([adminId])
  @@index([targetId])
  @@index([createdAt])
  @@map("super_admin_logs")
}
```

---

### المرحلة 2: Stripe Products Setup

#### 2.1 إعداد المنتجات في Stripe
أنشئ ملف `packages/payments/stripe-products.ts`:

```typescript
export const STRIPE_PLANS = {
  FREE: {
    name: "مجاني | Free",
    maxUsers: 3,
    maxProjects: 2,
    maxStorageGB: 1,
    features: ["basic_projects", "basic_finance"],
    price: 0,
  },
  STARTER: {
    name: "بداية | Starter",
    maxUsers: 10,
    maxProjects: 10,
    maxStorageGB: 10,
    features: ["all_modules", "basic_reports", "email_support"],
    priceMonthly: 299,  // ريال سعودي
    priceYearly: 2990,
    currency: "sar",
  },
  PROFESSIONAL: {
    name: "احترافي | Professional",
    maxUsers: 30,
    maxProjects: 50,
    maxStorageGB: 50,
    features: ["all_modules", "advanced_reports", "api_access", "priority_support", "ai_features"],
    priceMonthly: 699,
    priceYearly: 6990,
    currency: "sar",
  },
  ENTERPRISE: {
    name: "مؤسسي | Enterprise",
    maxUsers: -1,  // unlimited
    maxProjects: -1,
    maxStorageGB: 500,
    features: ["everything", "dedicated_support", "custom_integrations", "sla"],
    priceMonthly: null,  // custom pricing
    priceYearly: null,
    currency: "sar",
  },
} as const;
```

#### 2.2 أنشئ سكريبت Seed للـ Stripe Products
ملف `packages/payments/seed-stripe-products.ts` — يُنشئ المنتجات والأسعار في Stripe Dashboard.

#### 2.3 Environment Variables المطلوبة
```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Plan Price IDs (تُملأ بعد تشغيل seed script)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_...
```

---

### المرحلة 3: Stripe Webhook (Production-Grade)

#### 3.1 أنشئ API Route للـ Webhook
المسار: `apps/web/app/api/webhooks/stripe/route.ts`

**متطلبات:**
- التحقق من التوقيع (signature verification) باستخدام `STRIPE_WEBHOOK_SECRET`
- معالجة الأحداث التالية (مرتبة حسب الأولوية):

```typescript
const HANDLED_EVENTS = [
  // === الاشتراكات ===
  "checkout.session.completed",      // إنشاء اشتراك جديد
  "customer.subscription.created",   // تم إنشاء الاشتراك
  "customer.subscription.updated",   // تحديث (ترقية/تخفيض/تجديد)
  "customer.subscription.deleted",   // إلغاء
  "customer.subscription.paused",    // إيقاف مؤقت
  "customer.subscription.resumed",   // استئناف
  
  // === الفواتير والمدفوعات ===
  "invoice.paid",                    // دفعة ناجحة
  "invoice.payment_failed",         // فشل الدفع
  "invoice.upcoming",               // فاتورة قادمة (إشعار)
  
  // === العميل ===
  "customer.updated",               // تحديث بيانات العميل
] as const;
```

**لكل حدث، يجب:**
1. تسجيل الحدث في `SubscriptionEvent` (idempotency check عبر `stripeEventId`)
2. تحديث `Organization` (status, plan, subscriptionStatus, dates)
3. إرسال إشعار بريد إلكتروني عبر Resend عند:
   - نجاح الدفع
   - فشل الدفع
   - قرب انتهاء التجربة
   - إلغاء الاشتراك
4. تسجيل في `OrganizationAuditLog`

**أنماط مطلوبة:**
```typescript
// Idempotency — لا تعالج نفس الحدث مرتين
const existing = await db.subscriptionEvent.findUnique({
  where: { stripeEventId: event.id }
});
if (existing) return NextResponse.json({ received: true });

// Atomic updates
await db.$transaction(async (tx) => {
  await tx.subscriptionEvent.create({ ... });
  await tx.organization.update({ ... });
});
```

#### 3.2 Helper Functions
أنشئ `packages/payments/webhook-handlers.ts`:

```typescript
export async function handleSubscriptionCreated(subscription: Stripe.Subscription) { ... }
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) { ... }
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) { ... }
export async function handleInvoicePaid(invoice: Stripe.Invoice) { ... }
export async function handlePaymentFailed(invoice: Stripe.Invoice) { ... }
export async function syncOrganizationFromSubscription(orgId: string, sub: Stripe.Subscription) { ... }
```

#### 3.3 ربط Organization.status تلقائياً
```typescript
function mapSubscriptionToOrgStatus(stripeStatus: string): OrgStatus {
  switch (stripeStatus) {
    case "trialing":   return "TRIALING";
    case "active":     return "ACTIVE";
    case "past_due":   return "PAST_DUE";
    case "canceled":   return "CANCELLED";
    case "unpaid":     return "SUSPENDED";
    case "paused":     return "SUSPENDED";
    default:           return "SUSPENDED";
  }
}
```

---

### المرحلة 4: Subscription Enforcement (منع الوصول عند عدم الدفع)

#### 4.1 Middleware للتحقق من الاشتراك
أنشئ middleware جديد في `packages/api/orpc/middleware/subscription.ts`:

```typescript
export const subscriptionMiddleware = middleware(async ({ ctx, next }) => {
  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { status: true, plan: true, isFreeOverride: true, trialEndsAt: true }
  });

  // السوبر أدمن يتجاوز كل القيود
  if (ctx.user.role === "admin") return next();
  
  // التجاوز المجاني من السوبر أدمن
  if (org.isFreeOverride) return next();

  // التحقق من حالة المنظمة
  if (org.status === "SUSPENDED" || org.status === "CANCELLED") {
    throw new ORPCError("FORBIDDEN", { 
      message: "subscription_expired",
      code: "SUBSCRIPTION_REQUIRED"
    });
  }

  // التحقق من انتهاء التجربة
  if (org.status === "TRIALING" && org.trialEndsAt && new Date() > org.trialEndsAt) {
    throw new ORPCError("FORBIDDEN", {
      message: "trial_expired", 
      code: "TRIAL_EXPIRED"
    });
  }

  return next();
});
```

#### 4.2 Middleware للحدود (Limits)
```typescript
export const limitsMiddleware = middleware(async ({ ctx, next, meta }) => {
  const org = await getOrgWithLimits(ctx.organizationId);
  
  // التحقق من عدد المستخدمين
  if (meta?.checkUserLimit) {
    const userCount = await db.user.count({ 
      where: { organizationId: ctx.organizationId, isActive: true }
    });
    if (org.maxUsers !== -1 && userCount >= org.maxUsers) {
      throw new ORPCError("FORBIDDEN", { code: "USER_LIMIT_REACHED" });
    }
  }

  // التحقق من عدد المشاريع
  if (meta?.checkProjectLimit) {
    const projectCount = await db.project.count({
      where: { organizationId: ctx.organizationId }
    });
    if (org.maxProjects !== -1 && projectCount >= org.maxProjects) {
      throw new ORPCError("FORBIDDEN", { code: "PROJECT_LIMIT_REACHED" });
    }
  }

  return next();
});
```

#### 4.3 UI Paywall Component
أنشئ مكون `SubscriptionGuard` يعرض رسالة ترقية عند الوصول لحدود الخطة:

```typescript
// modules/saas/payments/SubscriptionGuard.tsx
// يعرض:
// 1. بانر تحذيري عند اقتراب انتهاء التجربة
// 2. صفحة كاملة عند انتهاء الاشتراك (مع زر "ترقية الآن")
// 3. رسالة عند الوصول لحد المستخدمين/المشاريع
```

#### 4.4 تحديث Organization Layout
في `apps/web/app/(saas)/app/[organizationSlug]/layout.tsx`:
- إضافة التحقق من `organization.status`
- إذا `SUSPENDED` أو `CANCELLED` → redirect إلى صفحة الاشتراك
- إذا `PAST_DUE` → عرض بانر تحذيري مع السماح بالاستمرار (grace period)
- إذا `TRIALING` وقرب الانتهاء → عرض بانر تذكيري

---

### المرحلة 5: Super Admin Panel

#### 5.1 المسارات المطلوبة
```
/app/admin/                          → لوحة التحكم الرئيسية (Dashboard)
/app/admin/organizations             → قائمة كل المنظمات (موجود — يحتاج ترقية)
/app/admin/organizations/[id]        → تفاصيل منظمة (موجود — يحتاج ترقية)
/app/admin/users                     → كل المستخدمين (موجود — يحتاج ترقية)
/app/admin/revenue                   → تقارير الإيرادات
/app/admin/subscriptions             → إدارة الاشتراكات
/app/admin/logs                      → سجل عمليات السوبر أدمن
```

#### 5.2 Dashboard الرئيسي (`/app/admin`)

**بطاقات KPI العلوية:**
```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ إجمالي المنظمات│ │      MRR       │ │  Churn Rate    │ │ منظمات نشطة    │
│     45         │ │  ر.س 12,450    │ │    3.2%        │ │     38         │
│  ↑ 5 هذا الشهر│ │  ↑ 8% عن سابق │ │  ↓ 0.5%        │ │  84% من الكل   │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

**مؤشرات إضافية:**
- إجمالي الإيرادات (Total Revenue) — تراكمي
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate — نسبة الإلغاء الشهرية
- Net Revenue Retention
- المنظمات حسب الخطة (pie chart)
- الإيرادات الشهرية (bar chart - آخر 12 شهر)
- المنظمات الجديدة حسب الشهر (line chart)
- Trial Conversion Rate — نسبة تحويل التجربة لاشتراك
- Average Revenue Per Organization (ARPO)
- المنظمات المتأخرة بالدفع (past_due) — قائمة تحذيرية

**Charts المطلوبة (استخدم recharts):**
1. MRR Trend — خط بياني آخر 12 شهر
2. Organizations by Plan — دائري
3. New Organizations — أعمدة شهرية
4. Revenue by Month — أعمدة مكدسة (حسب الخطة)
5. Churn Rate Trend — خط بياني

#### 5.3 صفحة المنظمات (ترقية الموجود)

**جدول شامل مع TanStack Table:**
| اسم المنظمة | المالك | الخطة | الحالة | المستخدمين | المشاريع | MRR | آخر دفع | إجراءات |
|---|---|---|---|---|---|---|---|---|

**الفلاتر:**
- حسب الخطة (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- حسب الحالة (ACTIVE, TRIALING, SUSPENDED, CANCELLED, PAST_DUE)
- بحث بالاسم أو البريد
- ترتيب حسب: تاريخ الإنشاء، MRR، عدد المستخدمين

**إجراءات لكل منظمة:**
- 👁️ عرض التفاصيل
- ✏️ تعديل الخطة (مع تحديث Stripe)
- ⏸️ إيقاف المنظمة
- ▶️ تفعيل المنظمة
- 🆓 تفعيل مجاني (Free Override)
- 👥 تعديل حد المستخدمين
- 📊 تعديل حد المشاريع

#### 5.4 صفحة تفاصيل المنظمة (ترقية الموجود)

**Tabs:**
1. **نظرة عامة** — معلومات المنظمة + الاشتراك
2. **المستخدمين** — قائمة أعضاء المنظمة
3. **المشاريع** — قائمة مشاريع المنظمة
4. **سجل الدفع** — كل الفواتير والمدفوعات من Stripe
5. **سجل الأحداث** — SubscriptionEvents + SuperAdminLogs

**إجراءات في صفحة التفاصيل:**
```typescript
// تغيير الخطة
async function changePlan(orgId: string, newPlan: PlanType) {
  // 1. تحديث Stripe Subscription (prorate)
  // 2. تحديث Organization في DB
  // 3. تسجيل في SuperAdminLog
  // 4. إرسال إشعار بريد
}

// إيقاف منظمة
async function suspendOrg(orgId: string, reason: string) {
  // 1. تحديث Organization.status = SUSPENDED
  // 2. تسجيل في SuperAdminLog
  // 3. إرسال إشعار بريد للمالك
}

// تفعيل مجاني
async function activateFreeOverride(orgId: string, reason: string) {
  // 1. Organization.isFreeOverride = true
  // 2. Organization.status = ACTIVE
  // 3. إلغاء Stripe Subscription إذا موجود
  // 4. تسجيل في SuperAdminLog
}

// تعديل الحدود
async function updateLimits(orgId: string, maxUsers: number, maxProjects: number) {
  // 1. تحديث Organization
  // 2. تسجيل في SuperAdminLog
}
```

#### 5.5 صفحة الإيرادات (`/app/admin/revenue`)

**تقارير:**
- إجمالي الإيرادات حسب الفترة (يومي/أسبوعي/شهري/سنوي)
- الإيرادات حسب الخطة
- Refunds
- Net Revenue
- LTV (Lifetime Value) تقديري
- جدول تفصيلي لكل عملية دفع

#### 5.6 صفحة سجل العمليات (`/app/admin/logs`)

**جدول SuperAdminLog:**
| التاريخ | الأدمن | العملية | الهدف | التفاصيل | IP |
|---|---|---|---|---|---|

**الفلاتر:** حسب الأدمن، حسب نوع العملية، حسب الفترة

---

### المرحلة 6: Super Admin API

#### 6.1 أنشئ ORPC Module جديد
المسار: `packages/api/modules/super-admin/`

```
packages/api/modules/super-admin/
├── router.ts          # Router الرئيسي
├── schema.ts          # Zod schemas
├── dashboard.ts       # Dashboard queries
├── organizations.ts   # Organization management
├── revenue.ts         # Revenue reports
└── logs.ts            # Admin logs
```

#### 6.2 Super Admin Middleware
```typescript
// packages/api/orpc/middleware/superAdmin.ts
export const superAdminProcedure = protectedProcedure.use(
  middleware(async ({ ctx, next }) => {
    if (ctx.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN", { message: "Super admin access required" });
    }
    return next();
  })
);
```

#### 6.3 API Endpoints المطلوبة

```typescript
// Dashboard
superAdmin.dashboard.getStats()           // KPIs
superAdmin.dashboard.getMrrTrend()        // MRR chart data
superAdmin.dashboard.getPlanDistribution() // Plan pie chart
superAdmin.dashboard.getNewOrgsTrend()    // New orgs chart
superAdmin.dashboard.getChurnRate()       // Churn calculations

// Organizations
superAdmin.organizations.list()           // مع فلترة وبحث وpagination
superAdmin.organizations.getById()        // تفاصيل شاملة
superAdmin.organizations.changePlan()     // تغيير الخطة
superAdmin.organizations.suspend()        // إيقاف
superAdmin.organizations.activate()       // تفعيل
superAdmin.organizations.setFreeOverride() // تجاوز مجاني
superAdmin.organizations.updateLimits()   // تحديث الحدود
superAdmin.organizations.getPaymentHistory() // سجل الدفع من Stripe

// Revenue
superAdmin.revenue.getSummary()           // ملخص الإيرادات
superAdmin.revenue.getByPeriod()          // حسب الفترة
superAdmin.revenue.getByPlan()            // حسب الخطة
superAdmin.revenue.getTransactions()      // كل المعاملات

// Logs
superAdmin.logs.list()                    // سجل العمليات مع فلترة
superAdmin.logs.getByTarget()             // عمليات على هدف محدد

// Subscriptions
superAdmin.subscriptions.list()           // كل الاشتراكات
superAdmin.subscriptions.getEvents()      // أحداث الاشتراكات
```

#### 6.4 Query Files
أنشئ `packages/database/prisma/queries/super-admin.ts`:

```typescript
// Dashboard aggregations
export async function getDashboardStats(db: PrismaClient) {
  const [
    totalOrgs, activeOrgs, trialingOrgs, suspendedOrgs,
    totalUsers, totalProjects,
    orgsByPlan, mrr
  ] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { status: "ACTIVE" } }),
    db.organization.count({ where: { status: "TRIALING" } }),
    db.organization.count({ where: { status: "SUSPENDED" } }),
    db.user.count({ where: { isActive: true } }),
    db.project.count(),
    db.organization.groupBy({ by: ["plan"], _count: true }),
    calculateMRR(db),
  ]);
  // ...
}

// MRR Calculation
export async function calculateMRR(db: PrismaClient) {
  // Sum of all active monthly subscription amounts
  // Annual subscriptions divided by 12
}

// Churn Rate
export async function calculateChurnRate(db: PrismaClient, month: Date) {
  // (Cancelled this month) / (Active at start of month) * 100
}
```

---

### المرحلة 7: Checkout Flow (للمستخدمين)

#### 7.1 صفحة اختيار الخطة
تحديث الصفحة الموجودة `/choose-plan` لتعمل مع Stripe:

```typescript
// عند اختيار خطة:
// 1. إنشاء Stripe Checkout Session
// 2. Redirect إلى Stripe
// 3. Success URL → /app/[org]/settings/billing?success=true
// 4. Cancel URL → /choose-plan?cancelled=true
```

#### 7.2 صفحة Billing (إعدادات المنظمة)
تحديث `/[org]/settings/billing`:

- عرض الخطة الحالية
- عرض تاريخ التجديد
- زر "ترقية" / "تخفيض"
- زر "إلغاء الاشتراك"
- Stripe Customer Portal link
- سجل الفواتير

#### 7.3 Stripe Checkout Integration
```typescript
// packages/payments/checkout.ts
export async function createCheckoutSession(params: {
  organizationId: string;
  priceId: string;
  customerEmail: string;
  customerId?: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId || undefined,
    customer_email: params.customerId ? undefined : params.customerEmail,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: `${BASE_URL}/app/{org}/settings/billing?success=true`,
    cancel_url: `${BASE_URL}/choose-plan?cancelled=true`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: params.organizationId },
    },
    metadata: { organizationId: params.organizationId },
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
  });
  return session;
}
```

---

## 📁 ملخص الملفات المطلوب إنشاؤها/تعديلها

### ملفات جديدة:
```
# Database
packages/database/prisma/schema.prisma                    ← تعديل (إضافة حقول + نماذج)
packages/database/prisma/queries/super-admin.ts           ← جديد
packages/database/prisma/queries/subscriptions.ts         ← جديد

# Payments
packages/payments/stripe-products.ts                      ← جديد
packages/payments/checkout.ts                             ← جديد/تعديل
packages/payments/webhook-handlers.ts                     ← جديد
packages/payments/seed-stripe-products.ts                 ← جديد

# API
packages/api/modules/super-admin/router.ts                ← جديد
packages/api/modules/super-admin/schema.ts                ← جديد
packages/api/modules/super-admin/dashboard.ts             ← جديد
packages/api/modules/super-admin/organizations.ts         ← جديد
packages/api/modules/super-admin/revenue.ts               ← جديد
packages/api/modules/super-admin/logs.ts                  ← جديد
packages/api/orpc/middleware/subscription.ts               ← جديد
packages/api/orpc/middleware/superAdmin.ts                 ← جديد
packages/api/orpc/router.ts                               ← تعديل (إضافة super-admin router)

# Webhook
apps/web/app/api/webhooks/stripe/route.ts                 ← جديد

# Pages
apps/web/app/(saas)/app/(account)/admin/page.tsx          ← جديد (Dashboard)
apps/web/app/(saas)/app/(account)/admin/revenue/page.tsx  ← جديد
apps/web/app/(saas)/app/(account)/admin/subscriptions/page.tsx ← جديد
apps/web/app/(saas)/app/(account)/admin/logs/page.tsx     ← جديد
apps/web/app/(saas)/app/(account)/admin/organizations/page.tsx ← ترقية
apps/web/app/(saas)/app/(account)/admin/organizations/[id]/page.tsx ← ترقية
apps/web/app/(saas)/app/(account)/admin/users/page.tsx    ← ترقية

# UI Modules
apps/web/modules/saas/admin/AdminDashboard.tsx            ← جديد
apps/web/modules/saas/admin/AdminOrgList.tsx              ← ترقية
apps/web/modules/saas/admin/AdminOrgDetail.tsx            ← ترقية
apps/web/modules/saas/admin/AdminUserList.tsx             ← ترقية
apps/web/modules/saas/admin/AdminRevenue.tsx              ← جديد
apps/web/modules/saas/admin/AdminSubscriptions.tsx        ← جديد
apps/web/modules/saas/admin/AdminLogs.tsx                 ← جديد
apps/web/modules/saas/admin/components/                   ← مجلد مكونات جديد
  ├── StatsCard.tsx
  ├── MrrChart.tsx
  ├── PlanDistributionChart.tsx
  ├── OrgActionsMenu.tsx
  ├── ChangePlanDialog.tsx
  ├── SuspendOrgDialog.tsx
  ├── FreeOverrideDialog.tsx
  ├── UpdateLimitsDialog.tsx
  └── PaymentHistoryTable.tsx

apps/web/modules/saas/payments/SubscriptionGuard.tsx      ← جديد
apps/web/modules/saas/payments/SubscriptionBanner.tsx     ← جديد
apps/web/modules/saas/payments/UpgradePrompt.tsx          ← جديد

# Translations
apps/web/modules/i18n/messages/ar.json                    ← تعديل (إضافة مفاتيح)
apps/web/modules/i18n/messages/en.json                    ← تعديل (إضافة مفاتيح)
```

### ملفات يجب تعديلها:
```
# Middleware
apps/web/middleware.ts                                     ← إضافة subscription check
packages/api/orpc/procedures.ts                           ← إضافة subscriptionProcedure

# Layouts
apps/web/app/(saas)/app/[organizationSlug]/layout.tsx     ← إضافة subscription guard
apps/web/app/(saas)/app/(account)/admin/layout.tsx        ← ترقية

# Auth
packages/auth/auth.ts                                     ← إضافة hooks للاشتراك

# Existing pages
apps/web/app/(saas)/app/(account)/settings/billing/page.tsx ← ترقية
apps/web/app/(saas)/app/choose-plan/page.tsx              ← ترقية
```

---

## ⚠️ قواعد مهمة

### 1. اتبع الأنماط الموجودة بدقة:
- استخدم ORPC لكل الـ API endpoints
- استخدم Zod لكل الـ validation schemas
- كل query يفلتر بـ `organizationId` (multi-tenancy)
- استخدم TanStack Query في الواجهة
- استخدم shadcn/ui + Tailwind لكل المكونات
- دعم RTL + ثنائي اللغة (عربي/إنجليزي) في كل الواجهات
- استخدم `cuid()` للـ IDs
- استخدم `@db.Decimal(15,2)` للمبالغ المالية
- استخدم `@db.JsonB` للـ metadata
- استخدم `@@index` على الحقول المستخدمة في الفلترة والبحث
- استخدم `@@map("snake_case")` لأسماء الجداول

### 2. الأمان:
- Super Admin middleware يتحقق من `user.role === "admin"`
- Webhook يتحقق من Stripe signature
- كل عملية Super Admin تُسجّل في `SuperAdminLog` مع IP
- لا يمكن للسوبر أدمن حذف منظمة — فقط إيقاف
- Idempotency في معالجة أحداث Stripe

### 3. التجربة:
- فترة تجريبية 14 يوم لكل منظمة جديدة
- بعد انتهاء التجربة بدون اشتراك → `SUSPENDED`
- `PAST_DUE` → grace period 7 أيام ثم `SUSPENDED`
- `SUSPENDED` → read-only access (يرى بياناته لكن لا يمكنه الإضافة/التعديل)
- `CANCELLED` → redirect إلى صفحة إعادة الاشتراك

### 4. الأداء:
- استخدم `Promise.all` للاستعلامات المتوازية في Dashboard
- Cache Dashboard stats لمدة 5 دقائق
- Pagination في كل القوائم
- Lazy loading للـ charts

### 5. Stripe Best Practices:
- استخدم metadata على Checkout Session و Subscription لتخزين `organizationId`
- استخدم Stripe Customer Portal لإدارة طرق الدفع
- Prorate عند الترقية/التخفيض
- اسمح بـ promotion codes
- اجمع عنوان الفوترة والرقم الضريبي

---

## 🔄 ترتيب التنفيذ المقترح

```
المرحلة 1: Schema Updates
  1.1 تحديث schema.prisma (enums + حقول Organization + نماذج جديدة)
  1.2 إنشاء migration
  1.3 تحديث Zod schemas

المرحلة 2: Stripe Setup
  2.1 stripe-products.ts (تعريف الخطط)
  2.2 seed-stripe-products.ts
  2.3 checkout.ts
  2.4 Environment variables

المرحلة 3: Webhook
  3.1 webhook-handlers.ts
  3.2 API route (apps/web/app/api/webhooks/stripe/route.ts)
  3.3 اختبار مع Stripe CLI

المرحلة 4: Super Admin API
  4.1 superAdmin middleware
  4.2 query files
  4.3 ORPC module (router + schemas)
  4.4 ربط في router.ts الرئيسي

المرحلة 5: Super Admin UI
  5.1 Dashboard page + components
  5.2 ترقية صفحة المنظمات
  5.3 ترقية صفحة تفاصيل المنظمة
  5.4 صفحة الإيرادات
  5.5 صفحة السجلات
  5.6 ترقية صفحة المستخدمين

المرحلة 6: Subscription Enforcement
  6.1 subscription middleware
  6.2 limits middleware
  6.3 تحديث Organization layout
  6.4 SubscriptionGuard + Banner components
  6.5 ترقية Billing page
  6.6 ترقية Choose Plan page

المرحلة 7: Translations + Polish
  7.1 إضافة مفاتيح الترجمة (ar + en)
  7.2 RTL testing
  7.3 Error handling
  7.4 Loading states
```

---

## 🧪 نقاط الاختبار

بعد كل مرحلة، تأكد من:

1. **Schema:** `npx prisma generate` + `npx prisma migrate dev` بدون أخطاء
2. **Webhook:** اختبر مع `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. **Super Admin:** تسجيل دخول بحساب `role: "admin"` + التحقق من كل الصفحات
4. **Subscription Flow:** إنشاء منظمة → اختيار خطة → Checkout → Webhook → Organization.status = ACTIVE
5. **Enforcement:** منظمة `SUSPENDED` لا تستطيع إنشاء مشاريع أو مستخدمين
6. **Free Override:** السوبر أدمن يفعّل مجاني → المنظمة تعمل بدون اشتراك
7. **Bilingual:** كل النصوص تظهر بالعربية والإنجليزية

---

**ابدأ بالمرحلة 1 (Schema Updates) وأعطني الخطة التفصيلية قبل التنفيذ.**
