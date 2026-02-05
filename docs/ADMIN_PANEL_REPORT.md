# تقرير شامل: لوحة تحكم Admin في Supastarter

> **تاريخ التقرير**: 2026-02-04
> **المشروع**: منصة مسار (Masar)
> **مبني على**: Supastarter Next.js

---

## جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [هيكل لوحة Admin](#هيكل-لوحة-admin)
3. [تحليل قسم إدارة المستخدمين](#تحليل-قسم-إدارة-المستخدمين)
4. [تحليل قسم إدارة المنظمات](#تحليل-قسم-إدارة-المنظمات)
5. [نظام الاشتراكات والدفع](#نظام-الاشتراكات-والدفع)
6. [البنية التقنية](#البنية-التقنية)
7. [الفجوات والنواقص](#الفجوات-والنواقص)
8. [التوصيات](#التوصيات)
9. [خطة التطوير المقترحة](#خطة-التطوير-المقترحة)

---

## نظرة عامة

### ما هو Supastarter؟

Supastarter هو قالب SaaS جاهز مبني على Next.js يوفر:
- نظام مصادقة متكامل
- إدارة المنظمات والفرق
- نظام اشتراكات ودفع
- لوحة تحكم Admin أساسية

### الحالة الراهنة للوحة Admin

| الميزة | الحالة | الملاحظات |
|--------|--------|-----------|
| إدارة المستخدمين | ✅ موجود | كامل الوظائف |
| إدارة المنظمات | ✅ موجود | كامل الوظائف |
| إدارة الاشتراكات | ❌ غير موجود | يتم عبر Stripe Dashboard |
| تقارير الإيرادات | ❌ غير موجود | يتم عبر Stripe Dashboard |
| إحصائيات النظام | ❌ غير موجود | غير متوفر |

---

## هيكل لوحة Admin

### المسارات (Routes)

```
apps/web/app/(saas)/app/(account)/admin/
├── layout.tsx                    # التخطيط الرئيسي
├── users/
│   └── page.tsx                  # صفحة المستخدمين
└── organizations/
    ├── page.tsx                  # قائمة المنظمات
    └── [id]/
        └── page.tsx              # تفاصيل منظمة
```

### المكونات (Components)

```
apps/web/modules/saas/admin/
├── component/
│   ├── EmailVerified.tsx         # مؤشر تحقق البريد
│   ├── users/
│   │   └── UserList.tsx          # قائمة المستخدمين
│   └── organizations/
│       ├── OrganizationList.tsx  # قائمة المنظمات
│       └── OrganizationForm.tsx  # نموذج المنظمة
└── lib/
    └── links.ts                  # دوال المسارات
```

### الـ API Routes

```
packages/api/modules/admin/
├── router.ts                     # الموجه الرئيسي
└── procedures/
    ├── list-users.ts             # جلب المستخدمين
    ├── list-organizations.ts     # جلب المنظمات
    └── find-organization.ts      # البحث عن منظمة
```

---

## تحليل قسم إدارة المستخدمين

### الموقع
- **الصفحة**: `/app/admin/users`
- **المكون**: `apps/web/modules/saas/admin/component/users/UserList.tsx`
- **API**: `packages/api/modules/admin/procedures/list-users.ts`

### الوظائف المتاحة

#### 1. عرض قائمة المستخدمين
```typescript
// API Endpoint
GET /admin/users?query=&limit=10&offset=0

// Response
{
  users: User[],
  total: number
}
```

**البيانات المعروضة**:
- صورة المستخدم (Avatar)
- الاسم
- البريد الإلكتروني
- حالة التحقق من البريد
- الدور (Admin/User)

#### 2. البحث والتصفية
- بحث نصي بالاسم أو البريد
- Debounce 300ms لتحسين الأداء
- ترقيم صفحات (10 مستخدمين/صفحة)

#### 3. الإجراءات على المستخدم

| الإجراء | الدالة | الوصف |
|---------|--------|-------|
| محاكاة المستخدم | `impersonateUser()` | تسجيل الدخول كمستخدم آخر |
| إعادة إرسال التحقق | `resendVerificationMail()` | للمستخدمين غير المؤكدين |
| تعيين Admin | `assignAdminRole()` | ترقية لصلاحية مشرف |
| إزالة Admin | `removeAdminRole()` | تخفيض لمستخدم عادي |
| حذف المستخدم | `deleteUser()` | حذف نهائي |

### الكود المصدري للإجراءات

```typescript
// محاكاة المستخدم
const impersonateUser = async (userId: string, { name }: { name: string }) => {
  await authClient.admin.impersonateUser({ userId });
  window.location.href = "/app";
};

// تعيين صلاحية Admin
const assignAdminRole = async (id: string) => {
  await authClient.admin.setRole({
    userId: id,
    role: "admin",
  });
};

// حذف المستخدم
const deleteUser = async (id: string) => {
  await authClient.admin.removeUser({ userId: id });
};
```

### التحقق من الصلاحيات

```typescript
// packages/api/orpc/procedures.ts
export const adminProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    if (context.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN");
    }
    return await next();
  },
);
```

---

## تحليل قسم إدارة المنظمات

### الموقع
- **الصفحة**: `/app/admin/organizations`
- **المكون**: `apps/web/modules/saas/admin/component/organizations/OrganizationList.tsx`
- **API**: `packages/api/modules/admin/procedures/list-organizations.ts`

### الوظائف المتاحة

#### 1. عرض قائمة المنظمات
```typescript
// API Endpoint
GET /admin/organizations?query=&limit=10&offset=0

// Response
{
  organizations: Organization[],
  total: number
}
```

**البيانات المعروضة**:
- شعار المنظمة
- اسم المنظمة
- عدد الأعضاء

#### 2. الإجراءات على المنظمة

| الإجراء | الوصف |
|---------|-------|
| إنشاء منظمة | `/app/admin/organizations/new` |
| تعديل منظمة | `/app/admin/organizations/[id]` |
| حذف منظمة | حذف نهائي مع تأكيد |

### الكود المصدري

```typescript
// حذف منظمة
const deleteOrganization = async (id: string) => {
  const { error } = await authClient.organization.delete({
    organizationId: id,
  });
};
```

---

## نظام الاشتراكات والدفع

### مزودي الدفع المدعومين

```
packages/payments/provider/
├── stripe/           # Stripe (الأكثر شيوعاً)
├── lemonsqueezy/     # Lemonsqueezy
├── polar/            # Polar
├── creem/            # Creem
└── dodopayments/     # DodoPayments
```

### بنية جدول الاشتراكات (Purchase)

```sql
CREATE TABLE purchase (
  id           VARCHAR(255) PRIMARY KEY,
  organizationId TEXT REFERENCES organization(id),
  userId       TEXT REFERENCES user(id),
  type         ENUM('SUBSCRIPTION', 'ONE_TIME'),
  customerId   TEXT NOT NULL,        -- معرف العميل في Stripe
  subscriptionId TEXT UNIQUE,        -- معرف الاشتراك في Stripe
  productId    TEXT NOT NULL,        -- معرف المنتج/الخطة
  status       TEXT,                 -- حالة الاشتراك
  createdAt    TIMESTAMP,
  updatedAt    TIMESTAMP
);
```

### أنواع الاشتراكات

| النوع | الوصف |
|-------|-------|
| `SUBSCRIPTION` | اشتراك متكرر (شهري/سنوي) |
| `ONE_TIME` | دفعة واحدة |

### حالات الاشتراك (Stripe)

| الحالة | الوصف |
|--------|-------|
| `active` | نشط ويدفع |
| `trialing` | في فترة تجريبية |
| `past_due` | متأخر في الدفع |
| `canceled` | ملغي |
| `unpaid` | غير مدفوع |
| `incomplete` | غير مكتمل |

### Webhook Events المدعومة

```typescript
// packages/payments/provider/stripe/index.ts

switch (event.type) {
  case "checkout.session.completed":
    // اكتمال الدفع (ONE_TIME)
    await createPurchase({ type: "ONE_TIME", ... });
    break;

  case "customer.subscription.created":
    // إنشاء اشتراك جديد
    await createPurchase({ type: "SUBSCRIPTION", ... });
    break;

  case "customer.subscription.updated":
    // تحديث اشتراك (ترقية/تخفيض)
    await updatePurchase({ status: event.data.object.status });
    break;

  case "customer.subscription.deleted":
    // إلغاء اشتراك
    await deletePurchaseBySubscriptionId(id);
    break;
}
```

### API المتاحة للدفع

```typescript
// packages/api/modules/payments/router.ts

export const paymentsRouter = {
  createCheckoutLink,      // إنشاء رابط دفع
  createCustomerPortalLink, // رابط بوابة العميل (Stripe)
  listPurchases,           // قائمة المشتريات
};
```

### الدوال المتاحة في قاعدة البيانات

```typescript
// packages/database/drizzle/queries/purchases.ts

getPurchasesByOrganizationId(organizationId)  // مشتريات منظمة
getPurchasesByUserId(userId)                   // مشتريات مستخدم
getPurchaseById(id)                            // مشتري واحد
getPurchaseBySubscriptionId(subscriptionId)    // بواسطة معرف الاشتراك
createPurchase(data)                           // إنشاء مشتري
updatePurchase(data)                           // تحديث مشتري
deletePurchaseBySubscriptionId(subscriptionId) // حذف مشتري
```

---

## البنية التقنية

### تدفق إنشاء اشتراك

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   المستخدم   │────▶│  التطبيق    │────▶│   Stripe    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │ createCheckoutLink │
                           │◀───────────────────│
                           │                    │
                           │    Redirect URL    │
                           │───────────────────▶│
                           │                    │
                           │     Webhook        │
                           │◀───────────────────│
                           │                    │
                    ┌──────▼──────┐              │
                    │  Database   │              │
                    │  (purchase) │              │
                    └─────────────┘              │
```

### تدفق التحقق من الصلاحيات

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│ protectedProcedure │────▶│ adminProcedure │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                    Check: user exists?   Check: role === "admin"?
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  FORBIDDEN  │     │  FORBIDDEN  │
                    │  (no user)  │     │ (not admin) │
                    └─────────────┘     └─────────────┘
```

---

## الفجوات والنواقص

### ما هو غير موجود في لوحة Admin

| الميزة | الحالة | التأثير |
|--------|--------|---------|
| قائمة المشتركين | ❌ | لا يمكن رؤية من يدفع |
| تفاصيل الاشتراك | ❌ | لا يمكن رؤية الخطط |
| إلغاء اشتراك | ❌ | يجب استخدام Stripe |
| تقارير MRR | ❌ | لا توجد إحصائيات |
| إدارة الخطط | ❌ | يجب استخدام Stripe |
| Dashboard إحصائي | ❌ | لا توجد نظرة عامة |
| تصدير البيانات | ❌ | لا يمكن التصدير |
| سجل النشاطات | ❌ | لا يوجد Audit Log |

### المقارنة مع المنافسين

| الميزة | Supastarter | SaaS Boilerplate | ShipFast |
|--------|-------------|------------------|----------|
| إدارة المستخدمين | ✅ | ✅ | ✅ |
| إدارة الاشتراكات | ❌ | ✅ | ✅ |
| Dashboard إحصائي | ❌ | ✅ | ✅ |
| تقارير الإيرادات | ❌ | ✅ | ❌ |

---

## التوصيات

### للإدارة الحالية (بدون تطوير)

#### 1. استخدام Stripe Dashboard
**الرابط**: https://dashboard.stripe.com

| المهمة | المكان في Stripe |
|--------|------------------|
| رؤية المشتركين | Customers → All |
| إدارة الاشتراكات | Billing → Subscriptions |
| تقارير الإيرادات | Reports → Revenue |
| إلغاء اشتراك | Subscriptions → Select → Cancel |

#### 2. أدوات تحليل خارجية

| الأداة | الوصف | التكلفة |
|--------|-------|---------|
| [Baremetrics](https://baremetrics.com) | تحليلات SaaS متقدمة | من $50/شهر |
| [ChartMogul](https://chartmogul.com) | تحليلات الإيرادات | من $99/شهر |
| [ProfitWell](https://profitwell.com) | تحليلات مجانية | مجاني |
| [Stripe Sigma](https://stripe.com/sigma) | SQL على بيانات Stripe | من $10/شهر |

#### 3. إنشاء تقارير يدوية

```bash
# تصدير المشتركين من Stripe CLI
stripe customers list --limit 100 > customers.json

# تصدير الاشتراكات
stripe subscriptions list --status=active > subscriptions.json
```

### للتطوير (بناء ميزات جديدة)

#### الأولوية العالية

1. **صفحة المشتركين** `/app/admin/subscriptions`
   - قائمة بجميع المشتركين
   - حالة كل اشتراك
   - تاريخ البدء والتجديد

2. **Dashboard إحصائي** `/app/admin`
   - إجمالي المستخدمين
   - إجمالي المشتركين
   - MRR (الإيراد الشهري المتكرر)
   - معدل الإلغاء (Churn Rate)

#### الأولوية المتوسطة

3. **إدارة الخطط** `/app/admin/plans`
   - عرض الخطط المتاحة
   - ربط مع Stripe Products

4. **تقارير الإيرادات** `/app/admin/reports`
   - إيرادات شهرية/سنوية
   - مقارنة الفترات
   - تصدير CSV

#### الأولوية المنخفضة

5. **سجل النشاطات** (Audit Log)
6. **إشعارات المشرف** (Admin Notifications)
7. **إدارة الكوبونات** (Coupons)

---

## خطة التطوير المقترحة

### المرحلة 1: Dashboard أساسي (1-2 أسابيع)

#### الملفات المطلوبة

```
apps/web/app/(saas)/app/(account)/admin/
├── page.tsx                      # Dashboard رئيسي (جديد)
└── subscriptions/
    └── page.tsx                  # قائمة المشتركين (جديد)

apps/web/modules/saas/admin/component/
├── dashboard/
│   ├── StatsCards.tsx            # بطاقات الإحصائيات
│   └── RevenueChart.tsx          # رسم بياني للإيرادات
└── subscriptions/
    └── SubscriptionList.tsx      # قائمة الاشتراكات

packages/api/modules/admin/procedures/
├── get-stats.ts                  # إحصائيات عامة
├── list-subscriptions.ts         # قائمة الاشتراكات
└── get-revenue.ts                # بيانات الإيرادات
```

#### API جديدة

```typescript
// إحصائيات Dashboard
GET /admin/stats
Response: {
  totalUsers: number,
  totalOrganizations: number,
  totalSubscriptions: number,
  activeSubscriptions: number,
  mrr: number,
  arr: number
}

// قائمة الاشتراكات
GET /admin/subscriptions?status=&limit=10&offset=0
Response: {
  subscriptions: Subscription[],
  total: number
}

// بيانات الإيرادات
GET /admin/revenue?period=monthly
Response: {
  data: { date: string, amount: number }[]
}
```

### المرحلة 2: إدارة متقدمة (2-3 أسابيع)

```
apps/web/app/(saas)/app/(account)/admin/
├── plans/
│   └── page.tsx                  # إدارة الخطط
├── reports/
│   └── page.tsx                  # التقارير
└── activity/
    └── page.tsx                  # سجل النشاطات
```

### المرحلة 3: تكامل وأتمتة (1-2 أسابيع)

- إشعارات البريد للمشرف
- تقارير آلية أسبوعية
- تنبيهات الإلغاء والتأخر

---

## مثال على الكود المقترح

### صفحة Dashboard

```typescript
// apps/web/app/(saas)/app/(account)/admin/page.tsx
import { StatsCards } from "@saas/admin/component/dashboard/StatsCards";
import { RevenueChart } from "@saas/admin/component/dashboard/RevenueChart";
import { RecentSubscriptions } from "@saas/admin/component/dashboard/RecentSubscriptions";

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart />
        <RecentSubscriptions />
      </div>
    </div>
  );
}
```

### API للإحصائيات

```typescript
// packages/api/modules/admin/procedures/get-stats.ts
import { adminProcedure } from "../../../orpc/procedures";
import { db } from "@repo/database";

export const getStats = adminProcedure
  .route({
    method: "GET",
    path: "/admin/stats",
    tags: ["Administration"],
    summary: "Get admin dashboard stats",
  })
  .handler(async () => {
    const [
      totalUsers,
      totalOrganizations,
      subscriptions,
    ] = await Promise.all([
      db.query.user.findMany().then(u => u.length),
      db.query.organization.findMany().then(o => o.length),
      db.query.purchase.findMany({
        where: (p, { eq }) => eq(p.type, "SUBSCRIPTION"),
      }),
    ]);

    const activeSubscriptions = subscriptions.filter(
      s => s.status === "active" || s.status === "trialing"
    );

    return {
      totalUsers,
      totalOrganizations,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
    };
  });
```

### قائمة المشتركين

```typescript
// packages/api/modules/admin/procedures/list-subscriptions.ts
import { adminProcedure } from "../../../orpc/procedures";
import { db } from "@repo/database";
import { z } from "zod";

export const listSubscriptions = adminProcedure
  .route({
    method: "GET",
    path: "/admin/subscriptions",
    tags: ["Administration"],
  })
  .input(
    z.object({
      status: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }),
  )
  .handler(async ({ input: { status, limit, offset } }) => {
    const subscriptions = await db.query.purchase.findMany({
      where: (p, { eq, and }) =>
        and(
          eq(p.type, "SUBSCRIPTION"),
          status ? eq(p.status, status) : undefined,
        ),
      with: {
        user: true,
        organization: true,
      },
      limit,
      offset,
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    return { subscriptions };
  });
```

---

## الخلاصة

### الوضع الحالي

- ✅ لوحة Admin موجودة وتعمل
- ✅ إدارة المستخدمين كاملة
- ✅ إدارة المنظمات كاملة
- ❌ إدارة الاشتراكات غير موجودة
- ❌ تقارير الإيرادات غير موجودة

### التوصية النهائية

| للاستخدام الفوري | للمدى الطويل |
|------------------|--------------|
| استخدم Stripe Dashboard | ابنِ لوحة اشتراكات مخصصة |
| اربط Baremetrics/ChartMogul | أضف Dashboard إحصائي |
| صدّر تقارير يدوية | أتمت التقارير |

### هل تريد أن أبدأ ببناء لوحة الاشتراكات؟

يمكنني البدء بـ:
1. إنشاء صفحة `/app/admin/subscriptions`
2. إنشاء Dashboard إحصائي في `/app/admin`
3. إضافة API endpoints للإحصائيات

---

> **ملاحظة**: هذا التقرير يعكس حالة الكود في تاريخ إنشائه. قد تتغير الميزات مع التحديثات المستقبلية لـ Supastarter.
