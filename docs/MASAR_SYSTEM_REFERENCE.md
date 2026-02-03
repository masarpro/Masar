# مسار - المرجع التقني الشامل
## Masar SaaS Multi-Tenant System Reference

**تاريخ التوثيق:** يناير 2026
**الإصدار:** 1.0
**المصدر:** تحليل الكود الفعلي

---

## جدول المحتويات

1. [ما هو مسار؟](#1-ما-هو-مسار)
2. [البنية العامة](#2-البنية-العامة)
3. [هيكل المجلدات والملفات](#3-هيكل-المجلدات-والملفات)
4. [خريطة الموقع والمسارات](#4-خريطة-الموقع-والمسارات)
5. [نظام المنظمات](#5-نظام-المنظمات)
6. [عزل المستخدمين والبيانات](#6-عزل-المستخدمين-والبيانات)
7. [الأدوار والصلاحيات RBAC](#7-الأدوار-والصلاحيات-rbac)
8. [نظام المصادقة والجلسات](#8-نظام-المصادقة-والجلسات)
9. [عقلية التطوير SaaS](#9-عقلية-التطوير-saas)
10. [نقاط الضعف والمخاطر](#10-نقاط-الضعف-والمخاطر)
11. [التوصيات](#11-التوصيات)

---

## 1. ما هو مسار؟

### التعريف الفعلي من الكود

مسار هو **نظام SaaS Multi-Tenant** مبني على قاعدة supastarter-nextjs، موجه لقطاع **المقاولات السعودي**. النظام يعمل كمنصة تُدار فيها كل منشأة (Organization) بشكل منفصل مع عزل كامل للبيانات.

### ما الذي يقدّمه فعلياً الآن:

| الميزة | الحالة | الملفات المرجعية |
|--------|--------|------------------|
| إنشاء منظمات (منشآت) | ✅ يعمل | `organizations.ts:189-234` |
| إدارة المستخدمين داخل المنظمة | ✅ يعمل | `org-users.ts` |
| نظام أدوار وصلاحيات | ✅ يعمل | `roles.ts`, `permissions.ts` |
| المصادقة (Email, OAuth, Passkeys) | ✅ يعمل | `auth.ts` |
| الدعوات (Invitations) | ✅ يعمل | `auth.ts:293-317` |
| لوحة إدارة (Admin Panel) | ✅ يعمل | `admin/` |
| الدفع والاشتراكات | ✅ يعمل | `payments/` |
| AI Chat | ✅ يعمل | `ai/` |
| RTL Arabic Support | ✅ يعمل | `i18n/translations/ar.json` |

### ما الذي لا يقدّمه (غير موجود في الكود):

- إدارة المشاريع (Projects Module)
- إدارة الكميات (Quantities)
- الفواتير والمستخلصات (Invoices)
- بوابة العميل (Project Client Portal)
- التقارير المالية
- تتبع الموظفين والحضور

### الفرق بين المفاهيم الأساسية

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (المستخدم)                          │
│  - حساب شخص في النظام                                           │
│  - email, password, session                                      │
│  - قد يكون: OWNER, EMPLOYEE, PROJECT_CLIENT                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ ينتمي إلى
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Organization (المنظمة)                        │
│  - الكيان التجاري / المنشأة                                     │
│  - slug فريد للوصول                                              │
│  - لها مالك واحد (Owner) + موظفين (Employees)                   │
│  - لها أدوار (Roles) خاصة بها                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ يُنشئ علاقة
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Member (العضوية)                            │
│  - جدول ربط بين User و Organization                             │
│  - يحتوي على role (owner, admin, member)                        │
│  - unique على (organizationId, userId)                          │
└─────────────────────────────────────────────────────────────────┘
```

### لماذا مسار نظام SaaS وليس CRUD عادي؟

| معيار SaaS | التطبيق في مسار |
|------------|-----------------|
| **Multi-Tenancy** | كل منظمة لها بياناتها المعزولة |
| **Self-Service** | المالك ينشئ منظمته ويديرها ذاتياً |
| **Subscription Model** | نظام دفع واشتراكات مدمج |
| **Scalability** | نفس الكود يخدم آلاف المنظمات |
| **Isolation** | `organizationId` في كل query |

---

## 2. البنية العامة

### Monorepo Structure

```
supastarter-nextjs-3/
├── apps/
│   └── web/                 # التطبيق الرئيسي (Next.js App Router)
│
├── packages/
│   ├── api/                 # منطق API (ORPC)
│   ├── auth/                # المصادقة (Better Auth)
│   ├── database/            # قاعدة البيانات (Prisma)
│   ├── i18n/                # الترجمة
│   ├── mail/                # البريد
│   ├── payments/            # المدفوعات
│   └── ...
│
├── config/                  # الإعدادات المشتركة
└── tooling/                 # أدوات البناء
```

### Runtime Flow (تدفق التنفيذ)

```
Browser                   Next.js App Router                API Layer
   │                            │                               │
   │  HTTP Request              │                               │
   │────────────────────────────>                               │
   │                            │                               │
   │                     ┌──────▼──────┐                        │
   │                     │   Layout    │                        │
   │                     │  (session?) │                        │
   │                     └──────┬──────┘                        │
   │                            │                               │
   │                     ┌──────▼──────┐                        │
   │                     │   Page      │                        │
   │                     │  Component  │                        │
   │                     └──────┬──────┘                        │
   │                            │                               │
   │                            │  orpcClient.xxx()             │
   │                            │───────────────────────────────>
   │                            │                               │
   │                            │                    ┌──────────▼──────────┐
   │                            │                    │  protectedProcedure │
   │                            │                    │   (session check)   │
   │                            │                    └──────────┬──────────┘
   │                            │                               │
   │                            │                    ┌──────────▼──────────┐
   │                            │                    │ verifyMembership    │
   │                            │                    │  (org + role check) │
   │                            │                    └──────────┬──────────┘
   │                            │                               │
   │                            │                    ┌──────────▼──────────┐
   │                            │                    │   Prisma Query      │
   │                            │                    │ where: {orgId: ...} │
   │                            │                    └──────────┬──────────┘
   │                            │                               │
   │<───────────────────────────│<──────────────────────────────│
   │      Response              │                               │
```

### أين يتم فرض العزل؟

| الطبقة | الملف | آلية العزل |
|--------|-------|-----------|
| **Layout** | `apps/web/app/(saas)/app/layout.tsx` | `getSession()` → redirect if no session |
| **Organization Layout** | `[organizationSlug]/layout.tsx` | `getActiveOrganization()` → notFound if no access |
| **API Procedure** | `packages/api/orpc/procedures.ts` | `protectedProcedure` → UNAUTHORIZED if no session |
| **Membership Check** | `organizations/lib/membership.ts` | `verifyOrganizationMembership()` → null if not member |
| **Database Query** | `prisma/queries/*.ts` | `where: { organizationId }` في كل query |

### أين يمكن حدوث تسريب؟

| نقطة الخطر | الملف | المشكلة المحتملة |
|-----------|-------|-----------------|
| ❌ Query بدون organizationId | أي query جديد | نسيان فلترة البيانات |
| ❌ API بدون membership check | procedure جديد | الوصول لبيانات منظمة أخرى |
| ⚠️ Frontend-only authorization | صفحات الإعدادات | تجاوز UI restrictions |

---

## 3. هيكل المجلدات والملفات

### الهيكل التفصيلي

```
apps/web/
├── app/                              # Next.js App Router
│   ├── (marketing)/                  # الصفحات التسويقية العامة
│   │   └── [locale]/                 # i18n routing
│   │       ├── (home)/page.tsx
│   │       ├── blog/
│   │       ├── docs/
│   │       ├── contact/
│   │       └── legal/
│   │
│   ├── (saas)/                       # التطبيق الرئيسي (محمي)
│   │   ├── app/                      # SaaS core
│   │   │   ├── (account)/            # إعدادات المستخدم الشخصية
│   │   │   │   ├── admin/            # لوحة الإدارة (admin only)
│   │   │   │   │   ├── organizations/
│   │   │   │   │   └── users/
│   │   │   │   ├── settings/
│   │   │   │   │   ├── general/
│   │   │   │   │   ├── security/
│   │   │   │   │   ├── billing/
│   │   │   │   │   └── danger-zone/
│   │   │   │   └── chatbot/
│   │   │   │
│   │   │   └── (organizations)/      # إعدادات المنظمة
│   │   │       └── [organizationSlug]/
│   │   │           ├── page.tsx      # Dashboard
│   │   │           ├── chatbot/
│   │   │           └── settings/
│   │   │               ├── general/
│   │   │               ├── members/  # الأعضاء والدعوات
│   │   │               ├── users/    # إدارة الموظفين
│   │   │               ├── roles/    # إدارة الأدوار
│   │   │               ├── billing/
│   │   │               └── danger-zone/
│   │   │
│   │   ├── choose-plan/
│   │   ├── new-organization/
│   │   ├── onboarding/
│   │   └── organization-invitation/
│   │
│   ├── auth/                         # صفحات المصادقة
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── change-password/          # تغيير كلمة المرور (جديد)
│   │   └── verify-email/
│   │
│   └── api/                          # API routes
│       └── [[...rest]]/              # ORPC handler
│
└── modules/                          # Business logic modules
    ├── saas/
    │   ├── auth/
    │   │   ├── components/           # Login forms, etc.
    │   │   └── lib/                  # getSession, etc.
    │   ├── organizations/
    │   │   ├── components/
    │   │   └── lib/
    │   ├── settings/
    │   │   ├── components/
    │   │   ├── roles/                # إدارة الأدوار (جديد)
    │   │   └── users/                # إدارة الموظفين (جديد)
    │   └── shared/
    │       └── components/
    │           ├── AppWrapper.tsx
    │           ├── NavBar.tsx
    │           └── SettingsList.tsx
    │
    └── shared/
        ├── components/
        └── lib/
```

### Packages

```
packages/
├── api/
│   ├── modules/
│   │   ├── admin/                    # Admin endpoints
│   │   ├── ai/                       # AI chat
│   │   ├── organizations/            # Organization management
│   │   │   └── lib/
│   │   │       └── membership.ts     # ⚠️ حرج: التحقق من العضوية
│   │   ├── org-users/                # إدارة موظفي المنظمة (جديد)
│   │   │   ├── router.ts
│   │   │   └── procedures/
│   │   │       ├── create-org-user.ts
│   │   │       ├── update-org-user.ts
│   │   │       ├── delete-org-user.ts
│   │   │       └── list-org-users.ts
│   │   ├── payments/
│   │   ├── roles/                    # إدارة الأدوار (جديد)
│   │   └── users/
│   │
│   └── orpc/
│       ├── router.ts                 # Main router
│       └── procedures.ts             # ⚠️ حرج: protectedProcedure
│
├── auth/
│   ├── auth.ts                       # ⚠️ حرج: Better Auth config
│   ├── lib/
│   │   ├── helper.ts                 # isOrganizationAdmin()
│   │   └── organization.ts           # updateSeatsInSubscription
│   └── plugins/
│       └── invitation-only/
│
└── database/
    ├── prisma/
    │   ├── schema.prisma             # ⚠️ حرج: Database schema
    │   ├── permissions.ts            # ⚠️ حرج: RBAC permissions
    │   └── queries/
    │       ├── organizations.ts
    │       ├── org-users.ts          # (جديد)
    │       ├── roles.ts              # (جديد)
    │       └── users.ts
    └── client.ts
```

### أين تُضاف العناصر الجديدة؟

| العنصر | المكان | مثال |
|--------|--------|------|
| صفحة جديدة للمنظمة | `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/` | `projects/page.tsx` |
| صفحة جديدة للمستخدم | `apps/web/app/(saas)/app/(account)/` | `notifications/page.tsx` |
| API endpoint جديد | `packages/api/modules/` | `projects/router.ts` |
| Database query جديد | `packages/database/prisma/queries/` | `projects.ts` |
| Component مشترك | `apps/web/modules/saas/shared/components/` | `ProjectCard.tsx` |
| Business logic | `apps/web/modules/saas/[module]/lib/` | `projects/lib/api.ts` |

---

## 4. خريطة الموقع والمسارات

### خريطة كاملة للمسارات

#### الصفحات العامة (Marketing)

| المسار | الملف | الوصول | الوصف |
|--------|-------|--------|-------|
| `/` | `(marketing)/[locale]/(home)/page.tsx` | Public | الصفحة الرئيسية |
| `/blog` | `(marketing)/[locale]/blog/page.tsx` | Public | المدونة |
| `/docs` | `(marketing)/[locale]/docs/page.tsx` | Public | التوثيق |
| `/contact` | `(marketing)/[locale]/contact/page.tsx` | Public | تواصل معنا |
| `/legal/*` | `(marketing)/[locale]/legal/[...path]/page.tsx` | Public | الصفحات القانونية |

#### صفحات المصادقة (Auth)

| المسار | الملف | الوصول | الوصف |
|--------|-------|--------|-------|
| `/auth/login` | `auth/login/page.tsx` | Public | تسجيل الدخول |
| `/auth/signup` | `auth/signup/page.tsx` | Public (إن مفعّل) | إنشاء حساب |
| `/auth/forgot-password` | `auth/forgot-password/page.tsx` | Public | نسيت كلمة المرور |
| `/auth/change-password` | `auth/change-password/page.tsx` | Authenticated | تغيير كلمة المرور |
| `/auth/verify-email` | `auth/verify-email/page.tsx` | Public | تأكيد البريد |

#### التطبيق الرئيسي (SaaS)

| المسار | الملف | الوصول | الوصف |
|--------|-------|--------|-------|
| `/app` | `(saas)/app/layout.tsx` | 🔒 Authenticated | Entry point |
| `/onboarding` | `(saas)/onboarding/page.tsx` | 🔒 Authenticated | التهيئة الأولى |
| `/choose-plan` | `(saas)/choose-plan/page.tsx` | 🔒 Authenticated | اختيار الخطة |
| `/new-organization` | `(saas)/new-organization/page.tsx` | 🔒 Authenticated | إنشاء منظمة |

#### إعدادات المستخدم (Account)

| المسار | الملف | الوصول | الوصف |
|--------|-------|--------|-------|
| `/app/settings/general` | `(account)/settings/general/page.tsx` | 🔒 Authenticated | الإعدادات العامة |
| `/app/settings/security` | `(account)/settings/security/page.tsx` | 🔒 Authenticated | الأمان |
| `/app/settings/billing` | `(account)/settings/billing/page.tsx` | 🔒 Authenticated | الفوترة |
| `/app/settings/danger-zone` | `(account)/settings/danger-zone/page.tsx` | 🔒 Authenticated | حذف الحساب |

#### لوحة الإدارة (Admin)

| المسار | الملف | الوصول | الوصف |
|--------|-------|--------|-------|
| `/app/admin/organizations` | `admin/organizations/page.tsx` | 🔐 Admin only | إدارة المنظمات |
| `/app/admin/users` | `admin/users/page.tsx` | 🔐 Admin only | إدارة المستخدمين |

#### إعدادات المنظمة (Organization)

| المسار | الملف | الوصول | الوصف |
|--------|-------|--------|-------|
| `/app/[slug]` | `[organizationSlug]/page.tsx` | 🔒 Member | Dashboard |
| `/app/[slug]/chatbot` | `[organizationSlug]/chatbot/page.tsx` | 🔒 Member | AI Chat |
| `/app/[slug]/settings/general` | `settings/general/page.tsx` | 🔒 Member (view), Admin (edit) | الإعدادات العامة |
| `/app/[slug]/settings/members` | `settings/members/page.tsx` | 🔒 Member (view), Admin (invite) | الأعضاء |
| `/app/[slug]/settings/users` | `settings/users/page.tsx` | 🔒 Admin only | إدارة الموظفين |
| `/app/[slug]/settings/roles` | `settings/roles/page.tsx` | 🔒 Admin only | إدارة الأدوار |
| `/app/[slug]/settings/billing` | `settings/billing/page.tsx` | 🔒 Admin only | الفوترة |
| `/app/[slug]/settings/danger-zone` | `settings/danger-zone/page.tsx` | 🔒 Owner only | حذف المنظمة |

### كيفية التعامل مع i18n و RTL

```typescript
// config/index.ts
i18n: {
    enabled: true,
    locales: {
        en: { currency: "USD", label: "English" },
        ar: { currency: "USD", label: "العربية" },  // RTL
    },
    defaultLocale: "en",
}
```

**ملاحظة:** اللغة العربية (ar) مدعومة مع ترجمة كاملة في `packages/i18n/translations/ar.json`.

---

## 5. نظام المنظمات

### 🔴 هذا أهم قسم في الملف

### كيف يتم إنشاء Organization؟

#### السيناريو 1: الإنشاء التلقائي (Auto-Create)

```typescript
// config/index.ts
organizations: {
    enable: true,
    autoCreateOnSignup: true,  // ✅ مفعّل
    requireOrganization: true,
}
```

**التدفق:**
```
User Signs Up
     ↓
apps/web/app/(saas)/app/layout.tsx
     ↓
if (organizations.length === 0 && autoCreateOnSignup) {
     ↓
autoCreateOrganizationIfNeeded(session)
     ↓
createOrganizationForUser() في organizations.ts
     ↓
- إنشاء Organization مع slug فريد
- إنشاء Member بـ role: "owner"
- تحديث User.organizationId و accountType: "OWNER"
- إنشاء الأدوار الافتراضية (createDefaultRoles)
     ↓
redirect(`/app/${newOrg.slug}`)
```

**الكود الفعلي:**
```typescript
// packages/database/prisma/queries/organizations.ts:189-234
export async function createOrganizationForUser({
    userId,
    userName,
    organizationName,
}) {
    const name = organizationName || `منشأة ${userName}`;
    const slug = await generateUniqueSlug(name);

    return db.$transaction(async (tx) => {
        // 1. إنشاء المنظمة
        const organization = await tx.organization.create({
            data: {
                name,
                slug,
                ownerId: userId,  // ← المالك
            },
        });

        // 2. إنشاء العضوية
        await tx.member.create({
            data: {
                organizationId: organization.id,
                userId,
                role: "owner",  // ← دور المالك
            },
        });

        // 3. تحديث المستخدم
        await tx.user.update({
            where: { id: userId },
            data: {
                organizationId: organization.id,
                accountType: "OWNER",
            },
        });

        return organization;
    });
}
```

#### السيناريو 2: الإنشاء اليدوي

```
User → /new-organization
     ↓
auth.api.createOrganization() via Better Auth
     ↓
after hook في auth.ts:81-95
     ↓
createDefaultRoles(org.id)
```

### من هو Owner؟

| الخاصية | القيمة |
|---------|--------|
| `Organization.ownerId` | معرّف المستخدم المالك (unique) |
| `User.accountType` | `OWNER` |
| `Member.role` | `"owner"` |
| الصلاحيات | كل شيء (settings, billing, delete org) |

**قيد مهم:** كل منظمة لها مالك واحد فقط (`ownerId` هو `@unique`).

### ما هو Member؟

```prisma
// schema.prisma:235-248
model Member {
    id             String       @id
    organizationId String       // المنظمة
    userId         String       // المستخدم
    role           String       // "owner", "admin", "member"

    @@unique([organizationId, userId])  // مستخدم واحد لكل منظمة
}
```

**Member** هو جدول الربط الذي يحدد:
1. أي مستخدم ينتمي لأي منظمة
2. ما هو دوره في تلك المنظمة

### هل المستخدم يمكنه امتلاك أكثر من منظمة؟

**الجواب من الكود:**

```prisma
// User table
organizationId   String?  // منظمة واحدة كـ employee
organizationOwned Organization? @relation("OrganizationOwner")

// Organization table
ownerId String? @unique  // مالك واحد فقط
```

**التحليل:**
- `User.organizationId` → منظمة واحدة كموظف
- `Organization.ownerId` → مستخدم واحد كمالك للمنظمة

**❌ غير واضح:** هل يمكن للمستخدم أن يكون عضواً (Member) في منظمات متعددة؟

نظرياً **نعم**، لأن جدول `Member` يسمح بذلك:
```prisma
@@unique([organizationId, userId])  // Unique per org, not globally
```

لكن `User.organizationId` يحتفظ بمنظمة واحدة فقط، مما يُنشئ تناقضاً في النموذج.

### كيف يتم تحديد المنظمة النشطة؟

```typescript
// Session table
activeOrganizationId String?  // ← في الجلسة

// apps/web/app/(saas)/app/layout.tsx:52-55
const organization = organizations.find(
    (org) => org.id === session?.session.activeOrganizationId,
) || organizations[0];  // ← fallback لأول منظمة
```

**آلية التحديد:**
1. `Session.activeOrganizationId` → إذا موجود
2. `organizations[0]` → أول منظمة في القائمة
3. `redirect("/new-organization")` → إذا لا توجد منظمات

### هل العزل يتم عبر...؟

| الآلية | هل مستخدمة؟ | التفاصيل |
|--------|------------|---------|
| `organizationId` | ✅ نعم | في كل query: `where: { organizationId }` |
| `slug` | ✅ نعم | في URL: `/app/[organizationSlug]` |
| `session` | ✅ نعم | `protectedProcedure` يتحقق من الجلسة |
| `middleware` | ❌ لا | لا يوجد middleware مخصص للـ org |

---

## 6. عزل المستخدمين والبيانات

### كيف نضمن أن المستخدم لا يرى بيانات منظمة أخرى؟

#### الطبقة 1: Layout Protection

```typescript
// apps/web/app/(saas)/app/(organizations)/[organizationSlug]/layout.tsx
const organization = await getActiveOrganization(organizationSlug);

if (!organization) {
    return notFound();  // ← 404 إذا لم يكن عضواً
}
```

#### الطبقة 2: API Protection

```typescript
// packages/api/orpc/procedures.ts:8-25
export const protectedProcedure = publicProcedure.use(
    async ({ context, next }) => {
        const session = await auth.api.getSession({
            headers: context.headers,
        });

        if (!session) {
            throw new ORPCError("UNAUTHORIZED");  // ← 401
        }

        return await next({
            context: {
                session: session.session,
                user: session.user,
            },
        });
    },
);
```

#### الطبقة 3: Membership Verification

```typescript
// packages/api/modules/organizations/lib/membership.ts
export async function verifyOrganizationMembership(
    organizationId: string,
    userId: string,
) {
    const membership = await getOrganizationMembership(organizationId, userId);

    if (!membership) {
        return null;  // ← المستخدم ليس عضواً
    }

    return {
        organization: membership.organization,
        role: membership.role,
    };
}
```

#### الطبقة 4: Database Query Isolation

```typescript
// packages/database/prisma/queries/org-users.ts:4-16
export async function getOrganizationUsers(organizationId: string) {
    return await db.user.findMany({
        where: {
            organizationId,  // ← العزل هنا
            accountType: { in: ["OWNER", "EMPLOYEE"] },
        },
    });
}
```

### فحص الاستعلامات الحالية

| الملف | Query | هل organizationId موجود؟ |
|-------|-------|-------------------------|
| `org-users.ts:4` | `getOrganizationUsers` | ✅ نعم |
| `org-users.ts:19` | `getOrgUserById` | ✅ نعم |
| `org-users.ts:54` | `updateOrgUser` | ✅ نعم (مع تحقق إضافي) |
| `org-users.ts:88` | `toggleUserActive` | ✅ نعم |
| `org-users.ts:101` | `deleteOrgUser` | ✅ نعم |
| `roles.ts:10` | `getOrganizationRoles` | ✅ نعم |
| `organizations.ts:90` | `getOrganizationMembership` | ✅ نعم |

### ⚠️ خطر استعلام بدون فلترة

**المشكلة:** أي query جديد يُضاف بدون `organizationId` سيُسرّب بيانات.

**مثال خاطئ:**
```typescript
// ❌ خطر
async function getProjects() {
    return db.project.findMany();  // يجلب كل المشاريع!
}
```

**مثال صحيح:**
```typescript
// ✅ آمن
async function getProjects(organizationId: string) {
    return db.project.findMany({
        where: { organizationId },
    });
}
```

### أين يجب أن يكون العزل؟

| الطبقة | المسؤولية | الملفات |
|--------|-----------|---------|
| **API Layer** | التحقق من الجلسة + العضوية | `procedures.ts`, `membership.ts` |
| **DB Schema** | العلاقات + unique constraints | `schema.prisma` |
| **DB Queries** | فلترة بـ organizationId | `queries/*.ts` |
| **Frontend** | UI restrictions (ليس أمان) | `isOrganizationAdmin()` |

---

## 7. الأدوار والصلاحيات RBAC

### طبقات الصلاحيات

```
┌─────────────────────────────────────────────────────────────┐
│                    System Level                              │
│                                                              │
│   User.role = "admin" → لوحة الإدارة النظامية                │
│   (adminProcedure في procedures.ts:27-35)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Organization Level                          │
│                                                              │
│   Member.role = "owner" | "admin" | "member"                │
│   (isOrganizationAdmin في helper.ts)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Permission Level                           │
│                                                              │
│   Role.permissions (JSON) → صلاحيات مفصّلة                   │
│   (Permissions في permissions.ts)                           │
└─────────────────────────────────────────────────────────────┘
```

### أنواع الأدوار

#### الأدوار النظامية (RoleType enum)

```prisma
enum RoleType {
    OWNER              // مالك المنشأة
    PROJECT_MANAGER    // مدير مشاريع
    ACCOUNTANT         // محاسب
    ENGINEER           // مهندس
    SUPERVISOR         // مراقب/مشرف
    CUSTOM             // مخصص
}
```

#### الأدوار الافتراضية المُنشأة

```typescript
// packages/database/prisma/queries/roles.ts:52-77
export async function createDefaultRoles(organizationId: string) {
    const roles = [
        { type: "PROJECT_MANAGER", isSystem: true },
        { type: "ACCOUNTANT", isSystem: true },
        { type: "ENGINEER", isSystem: true },
        { type: "SUPERVISOR", isSystem: true },
    ];
    // ...
}
```

**ملاحظة:** دور `OWNER` لا يُنشأ كـ Role منفصل، بل يُستخدم من Member.role.

### هيكل الصلاحيات (Permissions)

```typescript
// packages/database/prisma/permissions.ts
export interface Permissions {
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

### جدول الصلاحيات (Permission Matrix)

| الصلاحية | OWNER | PROJECT_MANAGER | ACCOUNTANT | ENGINEER | SUPERVISOR |
|----------|-------|-----------------|------------|----------|------------|
| **المشاريع** |
| عرض | ✅ | ✅ | ✅ | ✅ | ✅ |
| إنشاء | ✅ | ✅ | ❌ | ❌ | ❌ |
| تعديل | ✅ | ✅ | ❌ | ✅ | ❌ |
| حذف | ✅ | ❌ | ❌ | ❌ | ❌ |
| المالية | ✅ | ✅ | ✅ | ❌ | ❌ |
| إدارة الفريق | ✅ | ✅ | ❌ | ❌ | ❌ |
| **المالية** |
| عرض | ✅ | ✅ | ✅ | ❌ | ❌ |
| عروض الأسعار | ✅ | ✅ | ✅ | ❌ | ❌ |
| الفواتير | ✅ | ❌ | ✅ | ❌ | ❌ |
| المدفوعات | ✅ | ❌ | ✅ | ❌ | ❌ |
| التقارير | ✅ | ✅ | ✅ | ❌ | ❌ |
| **الإعدادات** |
| المنظمة | ✅ | ❌ | ❌ | ❌ | ❌ |
| المستخدمين | ✅ | ❌ | ❌ | ❌ | ❌ |
| الأدوار | ✅ | ❌ | ❌ | ❌ | ❌ |
| الفوترة | ✅ | ❌ | ❌ | ❌ | ❌ |
| التكاملات | ✅ | ❌ | ❌ | ❌ | ❌ |

### آلية التحقق

```typescript
// packages/auth/lib/helper.ts
export function isOrganizationAdmin(organization, user) {
    const userOrganizationRole = organization?.members.find(
        (member) => member.userId === user?.id,
    )?.role;

    return (
        ["owner", "admin"].includes(userOrganizationRole ?? "") ||
        user?.role === "admin"  // System admin
    );
}
```

```typescript
// packages/database/prisma/permissions.ts:63-72
export function hasPermission(
    permissions: Permissions | null,
    section: keyof Permissions,
    action: string,
): boolean {
    if (!permissions) return false;
    const sectionPerms = permissions[section];
    if (!sectionPerms) return false;
    return sectionPerms[action] ?? false;
}
```

### من يصل لماذا؟

| الإجراء | من يحق له؟ | كيف يُفحص؟ |
|---------|-----------|-----------|
| إدارة المنظمة | Owner | `isOrganizationAdmin()` |
| إضافة مستخدمين | Owner, Admin | `["owner", "admin"].includes(role)` |
| تعديل الإعدادات | Owner | `settings.organization` permission |
| البيانات المالية | Owner, Accountant | `finance.view` permission |
| لوحة Admin النظامية | System Admin | `adminProcedure` (user.role === "admin") |

---

## 8. نظام المصادقة والجلسات

### كيف يعمل Auth فعلياً؟

**المكتبة:** Better Auth
**الملف:** `packages/auth/auth.ts`

```typescript
export const auth = betterAuth({
    baseURL: appUrl,
    database: prismaAdapter(db, { provider: "postgresql" }),
    session: {
        expiresIn: config.auth.sessionCookieMaxAge,  // 30 يوم
        freshAge: 0,
    },
    // ...
});
```

### طرق المصادقة المدعومة

| الطريقة | الحالة | الملف |
|---------|--------|-------|
| Email/Password | ✅ مفعّل | `emailAndPassword.enabled: true` |
| Magic Link | ✅ مفعّل | `magicLink()` plugin |
| Google OAuth | ✅ مفعّل | `socialProviders.google` |
| GitHub OAuth | ✅ مفعّل | `socialProviders.github` |
| Passkeys (WebAuthn) | ✅ مفعّل | `passkey()` plugin |
| Two-Factor (TOTP) | ✅ مفعّل | `twoFactor()` plugin |

### أين يتم حفظ Session؟

```prisma
// schema.prisma:103-122
model Session {
    id        String   @id
    expiresAt DateTime
    userId    String
    user      User     @relation(...)

    token     String   @unique  // ← Cookie token
    activeOrganizationId String?  // ← المنظمة النشطة
}
```

**Session Storage:** قاعدة البيانات (PostgreSQL) مع token في Cookie.

### هل Session تحتوي organizationId؟

**نعم:** `Session.activeOrganizationId`

```typescript
// الوصول للمنظمة النشطة
session.session.activeOrganizationId
```

### تدفق المصادقة

#### تسجيل دخول أول مرة:

```
User → /auth/login
     ↓
Better Auth validates credentials
     ↓
hooks.before: التحقق من isActive
     ↓ (إذا isActive === false → Error)
hooks.after: تحديث lastLoginAt
     ↓
Session created
     ↓
Redirect to /app
     ↓
layout.tsx: التحقق من session
     ↓
إذا !onboardingComplete → /onboarding
إذا mustChangePassword → /auth/change-password
إذا organizations.length === 0 → auto-create أو /new-organization
     ↓
Redirect to /app/[slug]
```

#### الحالات الخاصة:

**1. المستخدم ليس لديه منظمة:**
```typescript
// apps/web/app/(saas)/app/layout.tsx:48-60
if (config.organizations.requireOrganization) {
    if (!organization) {
        redirect("/new-organization");
    }
}
```

**2. المستخدم عضو في أكثر من منظمة:**
```typescript
// layout.tsx:52-55
const organization = organizations.find(
    (org) => org.id === session?.session.activeOrganizationId,
) || organizations[0];  // ← أول منظمة كـ fallback
```

**3. يجب تغيير كلمة المرور:**
```typescript
// layout.tsx:25-27
if ((session.user as any).mustChangePassword) {
    redirect("/auth/change-password");
}
```

**4. الحساب معطّل:**
```typescript
// auth.ts:127-138
if (ctx.path.startsWith("/sign-in/email")) {
    const user = await getUserByEmail(email);
    if (user && user.isActive === false) {
        throw new Error("ACCOUNT_DISABLED");
    }
}
```

---

## 9. عقلية التطوير SaaS

### كيف تفكّر عند إضافة Feature جديدة؟

#### الأسئلة الإلزامية قبل كل Feature:

```
┌─────────────────────────────────────────────────────────────┐
│  ❓ 1. هل هذا خاص بالمستخدم أم بالمنظمة؟                     │
│                                                              │
│  • مستخدم → /app/settings/ + User table                     │
│  • منظمة → /app/[slug]/ + organizationId في كل query       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ❓ 2. هل يحتاج RBAC؟                                         │
│                                                              │
│  • نعم → أضف permission في Permissions interface            │
│  • نعم → تحقق في API باستخدام hasPermission()              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ❓ 3. هل هناك تسريب بيانات محتمل؟                           │
│                                                              │
│  • كل query يجب أن يحتوي organizationId                    │
│  • كل API يجب أن يتحقق من membership                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ❓ 4. هل هذا قابل للتوسع؟                                    │
│                                                              │
│  • تجنب hardcoding                                          │
│  • استخدم config                                            │
│  • فكّر في آلاف المنظمات                                    │
└─────────────────────────────────────────────────────────────┘
```

### أين تضع الكود؟

| نوع الكود | المكان |
|-----------|--------|
| صفحة جديدة | `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/` |
| API endpoint | `packages/api/modules/[module-name]/` |
| Database model | `packages/database/prisma/schema.prisma` |
| Database query | `packages/database/prisma/queries/[table].ts` |
| Component | `apps/web/modules/saas/[module]/components/` |
| Business logic | `apps/web/modules/saas/[module]/lib/` |
| Type definitions | `packages/database/prisma/` أو مع الـ module |

### مثال: إضافة Module مشاريع

```
1️⃣ Database Schema:
   packages/database/prisma/schema.prisma
   ├── model Project { organizationId, ... }
   └── permissions.ts → أضف ProjectPermissions

2️⃣ Database Queries:
   packages/database/prisma/queries/projects.ts
   └── getProjectsByOrganization(organizationId)

3️⃣ API:
   packages/api/modules/projects/
   ├── router.ts
   └── procedures/
       ├── list-projects.ts     (protectedProcedure + membership)
       ├── create-project.ts    (+ hasPermission check)
       └── ...

4️⃣ Frontend Pages:
   apps/web/app/(saas)/app/(organizations)/[organizationSlug]/
   └── projects/
       ├── page.tsx             (list)
       ├── [projectId]/page.tsx (details)
       └── new/page.tsx         (create form)

5️⃣ Components:
   apps/web/modules/saas/projects/
   ├── components/
   │   ├── ProjectCard.tsx
   │   └── ProjectForm.tsx
   └── lib/
       └── api.ts               (query keys, hooks)
```

### مثال: إضافة تقارير

```
الأسئلة:
✓ خاص بالمنظمة؟ → نعم
✓ يحتاج RBAC؟ → نعم (reports.view, reports.create)
✓ تسريب بيانات؟ → فلترة بـ organizationId + membership check

الهيكل:
/app/[slug]/reports/
├── page.tsx                    → قائمة التقارير
├── [reportId]/page.tsx         → تفاصيل التقرير
└── new/page.tsx                → إنشاء تقرير (إذا hasPermission)
```

### مثال: إضافة فواتير

```
الأسئلة:
✓ خاص بالمنظمة؟ → نعم
✓ يحتاج RBAC؟ → نعم (finance.invoices)
✓ تسريب بيانات؟ → organizationId + projectId validation

الهيكل:
/app/[slug]/invoices/
├── page.tsx
└── [invoiceId]/page.tsx

API Protection:
const membership = await verifyOrganizationMembership(orgId, userId);
if (!hasPermission(userRole.permissions, 'finance', 'invoices')) {
    throw new ORPCError("FORBIDDEN");
}
```

---

## 10. نقاط الضعف والمخاطر

### 🔴 Security (أمان)

| المشكلة | الخطورة | الملف | التفاصيل |
|---------|---------|-------|---------|
| **Frontend-only authorization** | ⚠️ متوسط | `members/page.tsx:29` | `isOrganizationAdmin` يُستخدم في UI فقط، لكن API محمي |
| **Permission checks manual** | ⚠️ متوسط | كل procedure | لا يوجد middleware موحد لـ permissions |
| **No rate limiting** | 🔴 عالي | غير موجود | API مفتوح للـ brute force |
| **No audit logging** | ⚠️ متوسط | غير موجود | لا يوجد تتبع للعمليات الحساسة |

### 🔴 Data Leakage (تسريب البيانات)

| المشكلة | الخطورة | التفاصيل |
|---------|---------|---------|
| **Missing organizationId in new queries** | 🔴 عالي | أي query جديد بدون فلترة يُسرّب كل البيانات |
| **Cross-org data access risk** | ⚠️ متوسط | يعتمد على المطور أن يتذكر فلترة البيانات |

**مثال على الخطر:**
```typescript
// ❌ خطير جداً
async function getAllProjects() {
    return db.project.findMany();  // يجلب مشاريع كل المنظمات!
}

// ✅ صحيح
async function getOrgProjects(organizationId: string) {
    return db.project.findMany({
        where: { organizationId }
    });
}
```

### 🔴 Scalability (قابلية التوسع)

| المشكلة | الخطورة | التفاصيل |
|---------|---------|---------|
| **No pagination in some queries** | ⚠️ متوسط | بعض queries تجلب كل السجلات |
| **No caching strategy** | ⚠️ متوسط | لا يوجد caching layer واضح |
| **Permission JSON in every request** | ⚠️ منخفض | يُقرأ من DB في كل request |

### 🔴 UX (تجربة المستخدم)

| المشكلة | الخطورة | التفاصيل |
|---------|---------|---------|
| **Multi-organization confusion** | ⚠️ متوسط | `User.organizationId` vs `Member` model |
| **activeOrganizationId nullable** | ⚠️ منخفض | قد يكون null مما يسبب redirect loops |

### 🔴 Developer Experience (تجربة المطور)

| المشكلة | الخطورة | التفاصيل |
|---------|---------|---------|
| **Permission type safety** | ⚠️ متوسط | `permissions: Json` بدلاً من typed |
| **Manual membership checks** | ⚠️ متوسط | يجب تذكر استدعاء `verifyOrganizationMembership` |
| **Invitation.status as string** | ⚠️ منخفض | ليس enum في Prisma |

### ما هو غير واضح من الكود الحالي

1. **Multi-organization membership:** هل يُدعم أن يكون المستخدم عضواً في منظمات متعددة؟
2. **Permission enforcement middleware:** لا يوجد middleware موحد
3. **Organization deletion cascade:** ما الذي يُحذف عند حذف منظمة؟
4. **Session invalidation:** كيف تُلغى جلسات المستخدم عند تعطيل حسابه؟

---

## 11. التوصيات

### 🔴 Critical (حرج)

| التوصية | السبب |
|---------|-------|
| **إضافة Rate Limiting** | حماية من brute force attacks |
| **إنشاء organizationId validation middleware** | ضمان العزل في كل request |
| **توحيد permission checks في middleware** | تقليل الأخطاء البشرية |

### 🟠 Important (مهم)

| التوصية | السبب |
|---------|-------|
| **تحويل `permissions` من Json إلى typed** | Type safety |
| **إضافة audit logging** | تتبع العمليات الحساسة |
| **توضيح نموذج multi-organization** | حل التناقض بين `User.organizationId` و `Member` |
| **تحويل `Invitation.status` إلى enum** | Consistency مع `UserInvitation` |

### 🟢 Nice to Have (تحسينات)

| التوصية | السبب |
|---------|-------|
| **إضافة caching layer (Redis)** | تحسين الأداء |
| **إضافة pagination لكل queries** | التعامل مع البيانات الكبيرة |
| **إضافة request validation middleware** | Input sanitization موحد |
| **توثيق API باستخدام OpenAPI** | تسهيل التكامل |

---

## الملاحق

### A. الملفات الحرجة

```
🔴 CRITICAL - يجب مراجعتها عند أي تعديل
├── packages/database/prisma/schema.prisma
├── packages/auth/auth.ts
├── packages/api/orpc/procedures.ts
└── packages/api/modules/organizations/lib/membership.ts

🟠 HIGH - مهمة للأمان
├── packages/database/prisma/permissions.ts
├── packages/database/prisma/queries/org-users.ts
├── packages/database/prisma/queries/roles.ts
└── apps/web/app/(saas)/app/layout.tsx

🟢 NORMAL - منطق العمل
├── packages/api/modules/org-users/
├── packages/api/modules/roles/
└── apps/web/modules/saas/
```

### B. قائمة التحقق للميزات الجديدة

```
□ هل أضفت organizationId في الـ model؟
□ هل أضفت where: { organizationId } في كل query؟
□ هل استخدمت protectedProcedure في API؟
□ هل استدعيت verifyOrganizationMembership؟
□ هل أضفت permissions check إن لزم؟
□ هل أضفت الترجمة العربية؟
□ هل اختبرت مع مستخدم من منظمة أخرى؟
```

### C. أوامر مفيدة

```bash
# توليد Prisma client بعد تعديل schema
pnpm db:generate

# تشغيل migrations
pnpm db:migrate

# فتح Prisma Studio
pnpm db:studio

# تشغيل التطبيق
pnpm dev
```

---

**نهاية المرجع**
**آخر تحديث:** يناير 2026
