# ملخص تنفيذ نظام وواجهة الصلاحيات حسب الأدوار (RBAC-UI)

> **التاريخ:** 2026-07-05 · **الفرع:** `main` · **النطاق:** `597afb83..30fce7d8` (8 commits — مدفوعة إلى GitHub)
> **الحالة:** ✅ مكتمل — type-check نظيف، build إنتاجي ناجح، 31 اختباراً جديداً تمرّ كلها

---

## المشكلة التي عولجت

عند إضافة عضو لمنشأة ومنحه صلاحيات محددة، كان يرى **نفس الواجهة الكاملة التي يراها المالك**، والأقسام التي لا يملك صلاحيتها تظهر **صفحات فارغة**. الـ backend كان سليماً (التخويل عبر `verifyOrganizationAccess` يعمل)، لكن طبقة العرض لم تكن تعرف صلاحيات المستخدم إطلاقاً.

## المعمارية الجديدة: Permission-Driven UI

```
الخادم (مصدر الحقيقة — بلا مساس)
  User.organizationRoleId → Role.permissions + customPermissions (دمج)
        │
        ├─ permissions.getMine (endpoint جديد) ──→ العميل
        │                                            │
        │                                    PermissionsProvider
        │                                    (SSR prefetch + hydration)
        │                                            │
        │                                     usePermission()
        │                                     can() / canAny() / isOwner
        │                                            │
        │        ┌───────────────┬──────────────┬────┴─────────┬──────────────┐
        │   القائمة الجانبية   حماية الصفحات   الداشبورد     الإشعارات    محرر الصلاحيات
        │   (permission-map)   (Guards+Gates)  (widgets)     (تصفية RBAC)  (Stage 6)
        │
        └─ دفاع في العمق: الواجهة تجربة فقط — كل procedure ما زال محمياً خادمياً
```

---

## المراحل السبع

### المرحلة 1 — طبقة الصلاحيات على العميل (`30391fe7`)

| جديد | الوصف |
|---|---|
| `packages/api/modules/permissions/procedures/get-mine.ts` | `protectedProcedure` يعيد الصلاحيات **الفعّالة** (دمج `customPermissions` فوق الدور) + `roleType` + `isOwner` |
| `apps/web/modules/saas/permissions/components/PermissionsProvider.tsx` | Provider بين `ActiveOrganizationProvider` و`ConfirmationAlertProvider`، `staleTime` 15 دقيقة، مفتاح الكاش يتضمن `organizationId` (منع تسريب cross-tenant) |
| `apps/web/modules/saas/permissions/hooks/use-permission.ts` | `can(section, action)` · `canAny(section)` · تجاوز OWNER دائم · deny-by-default أثناء التحميل |
| `cachedGetMyPermissions` في `cached-queries.ts` | قراءة DB مباشرة (بلا self-HTTP) للـ SSR prefetch |

- أُضيف `HydrationBoundary` خاص بـ layout المنظمة كي تصل الصلاحيات للعميل من أول paint على كل الصفحات.

### المرحلة 2 — تصفية القائمة الجانبية (`3945c4f5` + `30fce7d8`)

- **`permission-map.ts`** — خريطة مركزية `itemId → predicate` لكل عناصر القائمة:
  - المجموعات: `projects/finance/pricing → canAny` · `company → canAny("company") || employees.view` (حالة المحاسب الحدّية)
  - أبناء المالية: لوحة/مصروفات/عملاء/بنوك/مستندات → `finance.view` · الفواتير → `finance.invoices` · المقبوضات → `finance.payments` · التقارير المحاسبية → `finance.reports` · **دليل الحسابات/القيود/الأرصدة/الفترات → `finance.settings`** (مالك + محاسب فقط)
  - أبناء التسعير: لوحة → `view` · دراسات ومراحلها → `studies` · عروض → `quotations` · عملاء محتملون → `leads`
  - أبناء المنشأة: لوحة → `company.view` · موظفون → `employees.view` · مصروفات/أصول/تقارير → مقابلاتها
- عناصر المشروع (`project-*`) و`finance-partners` و`orgSettings` و`admin` **بلا مساس** — تحكمها أنظمتها القائمة.
- المجموعة تعيش بأبنائها المرئيين: مجموعة فرغت من كل أبنائها تختفي؛ ومجموعة فيها ابن مرئي واحد تبقى (يحمي وصول الشريك لصفحة الشركاء).

### المرحلة 3 — حماية الصفحات: صفر صفحات فارغة (`35bf9825`)

| مكوّن | الدور |
|---|---|
| `AccessDenied.tsx` | رسالة عربية واضحة + زر عودة للرئيسية بدل الصفحة الفارغة |
| `PermissionGate.tsx` | بوابة عامة لأي محتوى (`section` + `action` اختياري) |
| `SectionRouteGate.tsx` | بوابة مسارات: تقرأ `pathname` وتطبّق قواعد `FINANCE/COMPANY/PRICING_ROUTE_PERMISSIONS` — المسارات المجهولة تسقط على قاعدة الجذر (آمن افتراضياً) |

- **حرّاس خادميون** في `finance/layout.tsx` و`company/layout.tsx` + **layout جديد** للتسعير: من لا يملك أي صلاحية في القسم → `redirect` للرئيسية قبل أي عرض.
- مثال: PM يدخل المالية (يملك `view`) لكن فتح `/finance/invoices` عبر URL مباشرة → `AccessDenied`.
- ترجمات `permissions.accessDenied` أُضيفت في `ar.json` + `en.json` معاً.

### المرحلة 4 — الداشبورد المتكيّف (`9ade02eb`)

- `FinancePanel` → `finance.view` · `ActiveProjectsSection`/`OperationalSection`/`RecentDocumentsCard` → `canAny("projects")` · بيانات `AlertsSection` تُصفّى (فواتير متأخرة للماليين فقط، milestones للمشاريعيين فقط).
- **استعلامات الـ widgets المخفية لا تُرسل أصلاً** (`enabled: false`) — لا ضجيج 403.
- `QuickActionsGrid`: كل إجراء سريع مربوط بصلاحية قسمه (مصروف → `finance.view`، فاتورة → `finance.invoices`، دراسة → `pricing.studies`...).
- `WelcomeSection` جديد: عند إخفاء اللوحتين الرئيسيتين يظهر ترحيب بروابط الأقسام المتاحة — الرئيسية لا تكون فارغة أبداً.

### المرحلة 5 — الإشعارات حسب الصلاحية (`6d0559a6`)

- **`notification-permissions.ts`** — خريطة الأنواع الـ16: المالية (`EXPENSE_CREATED`, `CLAIM_CREATED`) → `finance.view` · المشاريع (تقارير/مشاكل/مستندات/أوامر تغيير/اعتمادات/رسائل مالك) → `projects.view` · الشخصية (قرارات تعود لصاحبها، إضافة/إزالة من فريق، `SYSTEM`) → للجميع.
- **تصفية مزدوجة (دفاع في العمق):**
  1. عند **الإنشاء**: `sendNotification`/`sendNotificationToUser` تصفّي المستلمين عبر `getCachedUserPermissions` (نفس مصدر التخويل).
  2. عند **الجلب**: `excludeTypes` في `listNotifications` + `getUnreadNotificationCount` — تغطي الإشعارات المخزّنة قبل هذا التغيير، والعدّاد يطابق القائمة.
- النتيجة: إشعار الفاتورة/المصروف يصل للمالك والمحاسب — **لا للمشرف الميداني**.

### المرحلة 6 — لوحة إدارة الصلاحيات التفاعلية (`c5fd28ac`) ⭐

- **الموقع:** زر 🔑 في صف المستخدم داخل جدول "المستخدمين" (settings/members) — النظام الحقيقي `orgUsers`.
- **4 مكوّنات** (أكبرها 320 سطراً): `PermissionsEditorDialog` (المنسّق) · `PermissionMatrix` (8 أقسام × 49 صلاحية) · `SectionGroup` (قسم + تحديد/إلغاء الكل) · `SaveBar` (حفظ/تراجع/إعادة للدور).
- **المنطق:** اختيار الدور يملأ المصفوفة (preset من `DEFAULT_ROLE_PERMISSIONS` + المخزّن) → التخصيص فوقه يُحسب **diff** ويُحفظ في `User.customPermissions` عبر `orgUsers.update` القائم → invalidation فوري لـ `getMine` وقائمة المستخدمين.
- **UX:** الإجراء المخالف للدور يحمل شارة "مخصص" كهرمانية · زر "إعادة للدور الافتراضي" يمسح التخصيصات (علم `resetCustomPermissions` جديد → `Prisma.DbNull`) · دور المالك لا يقبل التخصيص (تنبيه بدل المصفوفة).
- **حرّاس backend جدد** في `update-org-user` (مستخرجة في `lib/update-guards.ts`):
  1. **منع تعديل الذات** — يقطع طريق رفع الصلاحيات الذاتية.
  2. **حماية آخر مالك** — لا تنزيل ولا تعطيل لآخر OWNER فعّال (`countActiveOrganizationOwners`).
  3. **منع تخصيص صلاحيات دور المالك** — يمنع قفل المنشأة.
- **إخفاء `OrganizationMembersList`** (قائمة BetterAuth الخادعة التي كانت تعدّل `Member.role` المجمّد بلا أثر) — الجدول الحقيقي الوحيد الآن هو "المستخدمين"، مع تعليق كودي يشرح السبب.

### المرحلة 7 — الاختبارات والتثبيت (`4912add1`)

| ملف الاختبار | العدد | يغطي |
|---|---|---|
| `apps/web/.../permission-map.test.ts` | 22 ✅ | الأدوار الخمسة × المجموعات والأبناء، **الحالات الحرجة الثلاث**، تجاوز OWNER، العناصر غير المحكومة، قواعد المسارات (جذر/فرعي/partners/مجهول) |
| `packages/api/__tests__/permissions/org-user-update-guards.test.ts` | 9 ✅ | منع تعديل الذات، تنزيل/تعطيل آخر مالك، السماح بوجود مالك ثانٍ، منع تخصيص المالك، عدم تأثر غير المالكين |

- الحزم القائمة: **api** 922 نجاح (فشل واحد pre-existing غير متعلق: `file-upload.test.ts` حد حجم الصور) · **database** 72 نجاح · **web** 67 نجاح.
- lint (biome) نظيف على كل الملفات الجديدة · type-check نظيف في الحزم الثلاث · `pnpm build` إنتاجي ناجح.

---

## الحالات الحرجة الثلاث (كلها ✅ مُثبتة باختبارات)

1. **PM يرى مجموعة المالية** والتقارير المحاسبية داخلها، مع إخفاء الفواتير والمقبوضات والبنية المحاسبية الأربعة.
2. **الشرط المركّب للمنشأة يعمل دون تسريب** — `employees.view` وحدها تُظهر المجموعة + الموظفين دون لوحة المنشأة.
3. **المهندس والمشرف لا يريان المالية ولا المنشأة إطلاقاً** — لا قائمة، ولا صفحات فارغة (redirect خادمي).

## الانحرافات الموثقة

1. **تعارض داخلي في ملف المهمة:** بعض صفوف مصفوفة القبول افترضت صلاحيات تخالف `DEFAULT_ROLE_PERMISSIONS` الفعلية. حُسمت لصالح خريطة القسم 2 المعتمدة على البيانات الحقيقية — الفروق العملية: PM يرى الصفحات المالية التشغيلية (`finance.view=true` لديه فعلاً)، المحاسب يرى لوحة المنشأة والعملاء المحتملين، PM يرى الموظفين وتقارير المنشأة.
2. **`resetCustomPermissions` بدل `null`:** قاعدة Zod v4 + oRPC تمنع nullable — عولجت بعلم boolean.
3. **حارس ثالث إضافي** (منع تخصيص المالك) لم يطلبه الملف لكنه يمنع سيناريو قفل المنشأة.
4. **قاعدة المجموعات بالأبناء المرئيين** بدل predicate مباشر — مكافئة تماماً للمصفوفة وتحمي حالة الشريك.

## ديون تقنية مكتشفة (للسجل — لم تُنفّذ)

- فشل `file-upload.test.ts > PHOTO: rejects 21MB` قائم مسبقاً ويحتاج إصلاحاً منفصلاً.
- العضو المعدَّلة صلاحياته يرى التغيير بعد `staleTime` (15 دقيقة) أو إعادة تحميل — لا يوجد push فوري لجلسته.
- `orgSettings` ما زال محكوماً بـ `isOrganizationAdmin` (BetterAuth المجمّد) — مرشح للانتقال إلى `settings.organization`.
- `vitest.workspace.ts` لا يشمل `apps/web`.
- مكوّن `OrganizationMembersList` ما زال في الكود (غير مستدعى) — قابل للحذف بعد فترة أمان.

## الضمانات

- ✅ **لا مساس بالقائمة الحمراء** (المحركات الحسابية، `auto-journal.ts`، `schema.prisma`، ZATCA) — لا تغيير schema إطلاقاً.
- ✅ **التخويل الخلفي لم يُضعف** — كل ما أُضيف حرّاس أشد؛ `verifyOrganizationAccess`/`verifyProjectAccess` كما هي.
- ✅ **Multi-tenancy** — كل استعلام جديد يتضمن `organizationId`، ومفاتيح الكاش كذلك.
- ✅ **RTL** — خصائص منطقية فقط (`ms-/me-/ps-/pe-`).
- ✅ **الترجمات** في `ar.json` + `en.json` معاً في نفس الـ commit.
- ✅ **عناصر المشروع** (نظام `ProjectRole`) لم تتغير إطلاقاً.
