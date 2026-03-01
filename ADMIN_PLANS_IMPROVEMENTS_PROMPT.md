# تحسين Super Admin Panel — إدارة الخطط + إعادة هيكلة عرض المؤسسات

## السياق

تم بناء Super Admin Panel بنجاح (Phase 1-8). الآن نحتاج تحسينات مهمة:

1. **إدارة الخطط (Plan Management)** — قسم جديد للتحكم بالخطط والأسعار
2. **إعادة هيكلة عرض المؤسسات** — المؤسسة هي الوحدة الأساسية وليس المستخدم
3. **تبسيط نموذج الاشتراك** — خطة واحدة مدفوعة + مجاني للمشاهدة

---

## المشكلة الحالية

### ❌ ما لا يعمل بشكل صحيح:

1. **صفحة المستخدمين `/app/admin/users`** تعرض المستخدمين بشكل منفصل عن المؤسسات — هذا غير مفيد. المستخدم دائماً تابع لمؤسسة. لا أحتاج قائمة مستخدمين مستقلة.

2. **صفحة المؤسسات** تعرض معلومات سطحية فقط (اسم + خطة + حالة). أحتاج عند الضغط على أي مؤسسة رؤية كل شيء عنها.

3. **الخطط محددة في الكود (hardcoded)** في `packages/payments/stripe-products.ts` — أحتاج إدارتها من لوحة التحكم.

4. **نموذج الاشتراك معقد** — 4 خطط (FREE/STARTER/PROFESSIONAL/ENTERPRISE). أحتاج فقط:
   - **مجاني (FREE)**: يرى النظام بعد التسجيل لكن لا يستطيع استخدامه فعلياً (read-only demo)
   - **اشتراك واحد مدفوع (PRO)**: الاشتراك الكامل بكل المميزات

---

## المطلوب

### التغيير 1: تبسيط الخطط

**قبل البدء:** اقرأ الملفات التالية وافهمها:
- `packages/payments/stripe-products.ts`
- `packages/database/prisma/schema.prisma` (خصوصاً enum PlanType و Organization model)
- `packages/api/modules/super-admin/procedures/organizations.ts`

**التغييرات:**

1. **عدّل `PlanType` enum** في schema.prisma:
```prisma
enum PlanType {
  FREE    // مجاني — مشاهدة فقط بعد التسجيل
  PRO     // اشتراك كامل — كل المميزات
}
```
⚠️ احذف STARTER, PROFESSIONAL, ENTERPRISE
⚠️ أنشئ migration: `pnpm prisma migrate dev --name simplify-plan-types`
⚠️ حدّث البيانات الموجودة: `UPDATE organization SET plan = 'FREE' WHERE plan NOT IN ('FREE', 'PRO');`

2. **عدّل `stripe-products.ts`**:
```typescript
export const STRIPE_PLANS = {
  FREE: {
    name: "مجاني | Free",
    nameAr: "مجاني",
    nameEn: "Free",
    maxUsers: 1,       // المالك فقط
    maxProjects: 0,    // لا يستطيع إنشاء مشاريع
    maxStorageGB: 0,
    features: ["view_demo", "explore_system"],
    price: 0,
    isReadOnly: true,  // ← جديد: مشاهدة فقط
  },
  PRO: {
    name: "احترافي | Pro",
    nameAr: "احترافي",
    nameEn: "Pro",
    maxUsers: 50,
    maxProjects: 100,
    maxStorageGB: 50,
    features: ["all_modules", "all_reports", "ai_features", "api_access", "priority_support"],
    priceMonthly: 299,  // ريال سعودي
    priceYearly: 2990,
    currency: "sar",
    isReadOnly: false,
  },
} as const;
```

3. **عدّل كل الملفات** التي تشير لـ STARTER/PROFESSIONAL/ENTERPRISE:
   - `packages/api/modules/super-admin/procedures/organizations.ts` (changePlan)
   - `packages/api/modules/super-admin/schema.ts` (schemas)
   - UI components (ChangePlanDialog, PlanDistributionChart, أي badges)
   - الترجمات (en.json, ar.json)

---

### التغيير 2: إضافة قسم إدارة الخطط

أنشئ قسم جديد في Admin Panel لإدارة الخطط وأسعارها من الواجهة.

**صفحة جديدة:** `/app/admin/plans`

**إضافة في Sidebar:** بعد "الاشتراكات" أضف "إدارة الخطط" بأيقونة Settings2

**نموذج جديد في schema.prisma:**
```prisma
model PlanConfig {
  id              String    @id @default(cuid())
  planType        PlanType  @unique              // FREE أو PRO
  nameAr          String                          // الاسم بالعربية
  nameEn          String                          // الاسم بالإنجليزية
  description     String?   @db.Text
  descriptionAr   String?   @db.Text
  priceMonthly    Decimal?  @db.Decimal(10, 2)    // السعر الشهري (SAR)
  priceYearly     Decimal?  @db.Decimal(10, 2)    // السعر السنوي (SAR)
  currency        String    @default("SAR")
  maxUsers        Int       @default(1)
  maxProjects     Int       @default(0)
  maxStorageGB    Int       @default(0)
  features        Json      @db.JsonB             // ["feature1", "feature2"]
  isReadOnly      Boolean   @default(false)       // المجاني = true
  isActive        Boolean   @default(true)
  stripePriceIdMonthly  String?
  stripePriceIdYearly   String?
  stripeProductId       String?
  trialDays       Int       @default(14)
  sortOrder       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([planType])
  @@index([isActive])
  @@map("plan_configs")
}
```

**API Endpoints (في super-admin module):**
```
superAdmin.plans.list()              // كل الخطط
superAdmin.plans.getById(id)         // تفاصيل خطة
superAdmin.plans.update(id, data)    // تعديل خطة (اسم، سعر، حدود)
superAdmin.plans.syncToStripe(id)    // مزامنة مع Stripe
```

⚠️ لا أحتاج إنشاء أو حذف خطط — فقط تعديل الموجود (FREE و PRO)
⚠️ أنشئ seed data للخطتين عند الـ migration

**واجهة صفحة الخطط (`/app/admin/plans`):**
- بطاقتين (Card) — واحدة للمجاني وواحدة للـ PRO
- كل بطاقة تعرض: الاسم، السعر، الحدود، المميزات، حالة Stripe
- زر "تعديل" يفتح Dialog لتعديل: الأسعار، الحدود (maxUsers, maxProjects, maxStorage)، المميزات
- زر "مزامنة مع Stripe" لتحديث الأسعار في Stripe

---

### التغيير 3: إعادة هيكلة صفحة المؤسسات

**المبدأ:** المؤسسة هي الوحدة الأساسية. كل شيء يُعرض من منظور المؤسسة.

**حذف أو تقليل صفحة المستخدمين:**
- صفحة `/app/admin/users` تصبح ثانوية (أو تُدمج داخل تفاصيل المؤسسة)
- في Sidebar، إما احذفها أو اجعلها أسفل القائمة

**ترقية صفحة قائمة المؤسسات** (`/app/admin/organizations`):

الجدول يعرض:
| اللوغو + اسم المؤسسة | المالك (اسم + بريد) | الخطة | الحالة | الأعضاء | المشاريع | تاريخ التسجيل | آخر نشاط | إجراءات |

- الفلاتر: حسب الخطة (FREE/PRO)، حسب الحالة (ACTIVE/TRIALING/SUSPENDED/CANCELLED/PAST_DUE)
- البحث: بالاسم أو بريد المالك
- الترتيب: تاريخ التسجيل (الأحدث أولاً)، آخر نشاط، عدد الأعضاء

**ترقية صفحة تفاصيل المؤسسة** (`/app/admin/organizations/[id]`):

عند الضغط على مؤسسة، تفتح صفحة تفصيلية شاملة بـ tabs:

**Tab 1: نظرة عامة (Overview)**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 مؤسسة عمران الخليج للمقاولات العامة                      │
│                                                              │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ معلومات المؤسسة   │  │ معلومات الاشتراك  │                  │
│ │                   │  │                   │                  │
│ │ السجل التجاري: ...│  │ الخطة: PRO ✅     │                  │
│ │ الرقم الضريبي: ...│  │ الحالة: ACTIVE    │                  │
│ │ المدينة: الرياض   │  │ بداية: 2025-01-15│                  │
│ │ الهاتف: 05...     │  │ تجديد: 2025-02-15│                  │
│ │ تاريخ التسجيل: ...│  │ المبلغ: 299 ر.س  │                  │
│ │ آخر دخول: ...     │  │ طريقة الدفع: بطاقة│                  │
│ └──────────────────┘  └──────────────────┘                  │
│                                                              │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ الاستخدام        │  │ معلومات المالك    │                  │
│ │                   │  │                   │                  │
│ │ الأعضاء: 5/50    │  │ الاسم: أحمد محمد  │                  │
│ │ المشاريع: 12/100 │  │ البريد: a@x.com  │                  │
│ │ التخزين: 2/50 GB │  │ الهاتف: 05...     │                  │
│ └──────────────────┘  └──────────────────┘                  │
│                                                              │
│ [تغيير الخطة] [إيقاف] [تفعيل مجاني] [تعديل الحدود]        │
└─────────────────────────────────────────────────────────────┘
```

**Tab 2: الأعضاء (Members)**
- جدول بأعضاء المؤسسة: الاسم، البريد، الدور، تاريخ الانضمام، آخر دخول، الحالة
- هذا يغني عن صفحة المستخدمين المستقلة

**Tab 3: المشاريع (Projects)**
- جدول بمشاريع المؤسسة: الاسم، الحالة، قيمة العقد، نسبة الإنجاز، تاريخ الإنشاء

**Tab 4: سجل الاشتراك (Subscription History)**
- كل أحداث الاشتراك (SubscriptionEvent): التاريخ، النوع، المبلغ، الحالة
- يعرض: متى اشترك، متى جدد، هل تأخر بالدفع، هل ألغى

**Tab 5: سجل النشاط (Activity Log)**
- SuperAdminLog + OrganizationAuditLog المتعلقة بهذه المؤسسة

---

### التغيير 4: تحديث Subscription Enforcement للنموذج الجديد

**المجاني (FREE):**
- بعد التسجيل، المستخدم يدخل النظام ويرى كل الأقسام
- لكن لا يستطيع: إنشاء مشاريع، إضافة أعضاء، إنشاء فواتير، أي عملية كتابة
- يرى رسالة "اشترك للبدء باستخدام مسار" في كل صفحة
- الهدف: يشوف النظام ويقتنع ثم يشترك

**PRO:**
- كل المميزات مفتوحة
- الحدود حسب PlanConfig (maxUsers, maxProjects, maxStorage)

**عدّل subscription-middleware.ts:**
```typescript
// إذا الخطة FREE → منع كل عمليات الكتابة (ليس فقط SUSPENDED)
if (org.plan === "FREE" && !org.isFreeOverride) {
  throw new ORPCError("FORBIDDEN", {
    message: "subscription_required",
    code: "FREE_PLAN_READ_ONLY"
  });
}
```

**عدّل SubscriptionBanner.tsx:**
- إذا FREE → عرض بانر ثابت "اشترك الآن لبدء إدارة مشاريعك" مع زر "ترقية"
- إذا PAST_DUE → "متأخر بالدفع — يرجى تحديث طريقة الدفع"
- إذا TRIALING → "باقي X يوم في الفترة التجريبية"

---

## ملخص الملفات

### ملفات يجب تعديلها:
```
packages/database/prisma/schema.prisma          ← تعديل PlanType enum + إضافة PlanConfig model
packages/payments/stripe-products.ts            ← تبسيط لـ FREE + PRO
packages/payments/webhook-handlers.ts           ← تحديث mapping
packages/api/modules/super-admin/schema.ts      ← تحديث schemas
packages/api/modules/super-admin/router.ts      ← إضافة plans router
packages/api/modules/super-admin/procedures/organizations.ts ← تبسيط changePlan
packages/api/orpc/middleware/subscription-middleware.ts ← إضافة FREE plan check
packages/api/orpc/middleware/limits-middleware.ts       ← قراءة حدود من PlanConfig

# UI
apps/web/app/(saas)/app/(account)/admin/layout.tsx           ← إضافة "إدارة الخطط" في sidebar
apps/web/modules/saas/admin/component/organizations/OrganizationList.tsx  ← ترقية الجدول
apps/web/modules/saas/admin/component/organizations/OrganizationDetail.tsx ← ترقية التفاصيل
apps/web/modules/saas/admin/component/organizations/ChangePlanDialog.tsx   ← تبسيط لـ FREE/PRO
apps/web/modules/saas/admin/component/dashboard/PlanDistributionChart.tsx  ← تبسيط
apps/web/modules/saas/payments/components/SubscriptionBanner.tsx ← إضافة حالة FREE
apps/web/modules/saas/payments/components/UpgradePrompt.tsx     ← تحديث

# ترجمات
packages/i18n/translations/en.json
packages/i18n/translations/ar.json
```

### ملفات جديدة:
```
# Plan Management
packages/database/prisma/queries/plan-config.ts
packages/api/modules/super-admin/procedures/plans.ts
apps/web/app/(saas)/app/(account)/admin/plans/page.tsx
apps/web/modules/saas/admin/component/plans/PlanManagement.tsx
apps/web/modules/saas/admin/component/plans/EditPlanDialog.tsx
```

---

## قواعد مهمة

1. **اقرأ كل ملف قبل تعديله** — لا تفترض المحتوى
2. **لا تحذف أي منطق موجود** — عدّل وأضف فقط
3. **migration بـ `pnpm prisma migrate dev`** — وليس push
4. **كل UI بـ `useTranslations()`** — عربي وإنجليزي
5. **RTL support** في كل المكونات الجديدة
6. **استخدم shadcn/ui + Tailwind** — نفس أنماط المشروع
7. **أضف seed data** للخطتين (FREE + PRO) في PlanConfig بعد الـ migration
8. **حدّث البيانات الموجودة**: كل org بخطة غير FREE أو PRO → اجعلها FREE

## ترتيب التنفيذ

```
1. Schema: تعديل PlanType + إضافة PlanConfig + migration + seed
2. Backend: queries + API procedures للخطط
3. Backend: تحديث subscription middleware + limits middleware
4. UI: صفحة إدارة الخطط
5. UI: ترقية قائمة المؤسسات
6. UI: ترقية تفاصيل المؤسسة (5 tabs)
7. UI: تحديث Sidebar + حذف/تقليل صفحة Users
8. UI: تحديث SubscriptionBanner + UpgradePrompt
9. Translations: كل المفاتيح الجديدة
```

ابدأ بقراءة الملفات الموجودة أولاً ثم نفّذ بالترتيب.
