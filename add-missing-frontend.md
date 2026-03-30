# برومبت: إضافة الواجهات المفقودة للـ Backend الموجود

> **الهدف:** إضافة كل العناصر المفقودة في الواجهة (sidebar entries, صفحات, تبويبات, أقسام إعدادات) لكل ما هو موجود ومُنشأ في الـ Backend ولا يظهر للمستخدم.
> **ممنوع:** التعديل على الداشبورد الرئيسية أو كروت الداشبورد — فقط الإضافات في أماكنها الصحيحة.

---

## المرحلة 0: القراءة الإجبارية (اقرأ أولاً، لا تخمّن)

اقرأ الملفات التالية بالكامل قبل كتابة أي كود:

```
CLAUDE.md
apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts
apps/web/modules/saas/shared/components/sidebar/SidebarNav.tsx
apps/web/modules/saas/shared/components/skeletons.tsx
packages/api/modules/notifications/index.ts (أو procedures.ts)
packages/api/modules/digests/index.ts (أو procedures.ts)
packages/api/modules/project-insights/index.ts (أو procedures.ts)
packages/api/modules/project-updates/index.ts (أو procedures.ts)
packages/api/modules/integrations/index.ts (أو procedures.ts)
packages/database/prisma/schema.prisma (ابحث عن: DigestSubscription, NotificationPreference, ProjectOwnerAccess)
apps/web/i18n/messages/ar.json
apps/web/i18n/messages/en.json
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/page.tsx
```

اقرأ أيضاً ملف loading.tsx لأي صفحة مجاورة لتفهم نمط الـ Skeletons المستخدم:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/change-orders/loading.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/loading.tsx
```

---

## 🔴 القائمة الحمراء — لا تلمس هذه الملفات أبداً:

- `packages/api/lib/accounting/auto-journal.ts`
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/queries/accounting.ts`
- `packages/database/prisma/queries/finance.ts`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx` (الداشبورد الرئيسية)
- أي ملف داخل `packages/api/modules/*/` (الـ Backend جاهز — لا تعدّل عليه)

---

## القواعد العامة لكل ملف تُنشئه:

1. **RTL:** استخدم `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-` فقط — ممنوع `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`
2. **الترجمة:** كل نص يظهر للمستخدم يستخدم `useTranslations()` — أضف المفاتيح في `ar.json` و `en.json`
3. **Loading:** كل `page.tsx` جديد يجب أن يكون معه `loading.tsx` يستخدم Skeleton مناسب من `skeletons.tsx`
4. **Procedures:** استخدم `protectedProcedure` للقراءة — لا تُنشئ endpoints جديدة (الـ Backend موجود)
5. **الأيقونات:** استخدم `lucide-react` فقط
6. **الأنماط:** اتبع نفس أنماط الصفحات المجاورة بالضبط (نفس بنية الـ Card, Table, PageHeader)

---

## المهمة 1: إضافة "محاضر الاستلام" في Sidebar المشروع

**الملف:** `apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts`

**المطلوب:** في قائمة المشروع الفرعية (project sub-menu)، أضف عنصر **"محاضر الاستلام"** بعد **"أوامر التغيير"** مباشرة.

```typescript
// ابحث عن عنصر "أوامر التغيير" (change-orders) في القائمة الفرعية للمشروع
// وأضف بعده مباشرة:
{
  id: "handover",
  label: t("sidebar.handover"), // أو المفتاح الموجود فعلاً
  href: `/${organizationSlug}/projects/${projectId}/handover`,
  icon: ClipboardCheck, // من lucide-react
}
```

**مفاتيح الترجمة (إن لم تكن موجودة):**
- `ar.json`: `"sidebar.handover": "محاضر الاستلام"`
- `en.json`: `"sidebar.handover": "Handover Protocols"`

**تحقق:** تأكد أن الأيقونة `ClipboardCheck` مستوردة من `lucide-react` في أعلى الملف.

---

## المهمة 2: إضافة تبويب "الرؤى" في صفحة نظرة عامة المشروع

**السياق:** الـ Backend فيه `project-insights/` بـ 2 endpoints (analytics) — لا توجد صفحة ولا تبويب لعرضها.

**المطلوب:** أنشئ صفحة بسيطة للرؤى داخل المشروع.

### الخطوة 1: أنشئ الصفحة

```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/insights/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/insights/loading.tsx
```

**محتوى الصفحة:**
- اقرأ صفحة `overview/page.tsx` أو أي صفحة فرعية أخرى في المشروع لتفهم النمط
- استدعِ endpoints الـ `project-insights` الموجودة في الـ Backend
- اعرض البيانات في بطاقات (Cards) بسيطة مع إحصائيات
- إذا الـ endpoints ترجع بيانات بسيطة (مثل metrics أو KPIs)، اعرضها في بطاقات بأرقام
- إذا ترجع بيانات زمنية، استخدم Recharts (dynamic import)

### الخطوة 2: أضف في Sidebar المشروع

في `use-sidebar-menu.ts`، أضف عنصر "الرؤى" في مكان مناسب (بعد "المالية" مثلاً):

```typescript
{
  id: "insights",
  label: t("sidebar.insights"),
  href: `/${organizationSlug}/projects/${projectId}/insights`,
  icon: TrendingUp, // من lucide-react
}
```

**مفاتيح الترجمة:**
- `ar.json`: `"sidebar.insights": "الرؤى والتحليلات"`
- `en.json`: `"sidebar.insights": "Insights & Analytics"`

---

## المهمة 3: إضافة صفحة "التحديثات" في المشروع

**السياق:** الـ Backend فيه `project-updates/` بـ 2 endpoints (إعلانات/تحديثات) — لا صفحة لها.

**المطلوب:** أنشئ صفحة بسيطة لعرض وإنشاء التحديثات.

### الخطوة 1: أنشئ الصفحة

```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/updates/page.tsx
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/updates/loading.tsx
```

**محتوى الصفحة:**
- قائمة التحديثات/الإعلانات (تنسيق timeline أو قائمة بطاقات)
- زر "إضافة تحديث" (Dialog أو Sheet) يستدعي الـ endpoint الموجود
- كل تحديث يعرض: النص، التاريخ، المؤلف

### الخطوة 2: أضف في Sidebar المشروع

```typescript
{
  id: "updates",
  label: t("sidebar.updates"),
  href: `/${organizationSlug}/projects/${projectId}/updates`,
  icon: Megaphone, // أو Bell أو Newspaper من lucide-react
}
```

**مفاتيح الترجمة:**
- `ar.json`: `"sidebar.updates": "التحديثات"`
- `en.json`: `"sidebar.updates": "Updates"`

---

## المهمة 4: إضافة قسم "تفضيلات الإشعارات" في إعدادات الحساب

**السياق:** الـ Backend فيه `notifications.preferences.get` و `notifications.preferences.update` — لا واجهة للمستخدم للتحكم بتفضيلاته.

**المطلوب:** أضف قسم تفضيلات الإشعارات.

### تحديد الموقع الصحيح:

أولاً اقرأ:
```
apps/web/app/(saas)/app/(account)/
```

ابحث عن صفحة "الإشعارات" أو "التفضيلات" — إذا لم تكن موجودة، أنشئها:

```
apps/web/app/(saas)/app/(account)/notifications/page.tsx
apps/web/app/(saas)/app/(account)/notifications/loading.tsx
```

**محتوى الصفحة:**
- اقرأ أولاً ملف `NotificationPreference` من الـ Schema و endpoint الـ `notifications.preferences.get` لتفهم الحقول المتاحة
- اعرض جدول/قائمة بكل نوع إشعار (17 نوع من `NotificationType` enum)
- لكل نوع: Switch لتفعيل/إلغاء
- Switch عام "كتم الكل" (`muteAll`)
- زر حفظ يستدعي `notifications.preferences.update`

**أضف رابط في القائمة الجانبية لقسم الحساب (account sidebar):**
```typescript
{
  id: "notifications",
  label: t("sidebar.notificationPreferences"),
  href: "/app/notifications",
  icon: BellRing,
}
```

**مفاتيح الترجمة:**
- `ar.json`:
  ```
  "notifications.preferences.title": "تفضيلات الإشعارات",
  "notifications.preferences.muteAll": "كتم جميع الإشعارات",
  "notifications.preferences.description": "تحكم في الإشعارات التي تريد استقبالها",
  ```
- `en.json`:
  ```
  "notifications.preferences.title": "Notification Preferences",
  "notifications.preferences.muteAll": "Mute All Notifications",
  "notifications.preferences.description": "Control which notifications you receive",
  ```

---

## المهمة 5: إضافة قسم "الملخصات البريدية" (Digests)

**السياق:** الـ Backend فيه `digests/` بـ 3 endpoints + نموذج `DigestSubscription` — لا واجهة.

**المطلوب:** أضف إمكانية الاشتراك/إلغاء الاشتراك في الملخصات.

### تحديد الموقع:

أولاً اقرأ endpoints الـ `digests/` لتفهم ماذا يفعل كل endpoint.

**الخيار الأفضل:** أضف قسم "الملخصات البريدية" **داخل نفس صفحة تفضيلات الإشعارات** (المهمة 4) كـ section منفصل في الأسفل.

**إذا قررت صفحة منفصلة:**
```
apps/web/app/(saas)/app/(account)/digests/page.tsx
apps/web/app/(saas)/app/(account)/digests/loading.tsx
```

**المحتوى:**
- قائمة المشاريع التي للمستخدم عضوية فيها
- لكل مشروع: Switch لتفعيل الملخص الأسبوعي
- عرض التردد (WEEKLY)
- استدعِ endpoints الـ `digests`

**مفاتيح الترجمة:**
- `ar.json`:
  ```
  "digests.title": "الملخصات البريدية",
  "digests.description": "استقبل ملخصاً أسبوعياً عن مشاريعك عبر البريد الإلكتروني",
  "digests.weeklyDigest": "ملخص أسبوعي",
  "digests.enabled": "مُفعّل",
  "digests.disabled": "مُعطّل",
  ```
- `en.json`:
  ```
  "digests.title": "Email Digests",
  "digests.description": "Receive weekly project summaries via email",
  "digests.weeklyDigest": "Weekly Digest",
  "digests.enabled": "Enabled",
  "digests.disabled": "Disabled",
  ```

---

## المهمة 6: إضافة قسم "قنوات التواصل" في إعدادات المنظمة

**السياق:** الـ Backend فيه `integrations/` بـ 5 endpoints + نموذج `OrganizationIntegrationSettings` (Email/WhatsApp/SMS config) — لكن SMS و WhatsApp providers غير مُنفّذين (TODO).

**المطلوب:** أضف صفحة/قسم لعرض وتعديل إعدادات قنوات التواصل.

### تحديد الموقع:

اقرأ أولاً:
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/integrations/page.tsx
```

**إذا الصفحة موجودة:** أضف قسماً جديداً فيها لقنوات التواصل.
**إذا غير موجودة:** أنشئها.

**المحتوى:**
- بطاقة البريد الإلكتروني: عرض الإعدادات الحالية + تفعيل/إلغاء
- بطاقة WhatsApp: عرض مع label "قريباً" (Badge) لأن الـ provider غير مُنفّذ
- بطاقة SMS: عرض مع label "قريباً" (Badge)
- استدعِ `integrations.getSettings` و `integrations.updateSettings`

**المهم:** لا تخفِ الأقسام غير المُنفّذة — اعرضها مع badge "قريباً" ليعرف المستخدم أنها قادمة.

**مفاتيح الترجمة:**
- `ar.json`:
  ```
  "integrations.channels.title": "قنوات التواصل",
  "integrations.channels.email": "البريد الإلكتروني",
  "integrations.channels.whatsapp": "واتساب",
  "integrations.channels.sms": "رسائل SMS",
  "integrations.channels.comingSoon": "قريباً",
  "integrations.channels.enabled": "مُفعّل",
  "integrations.channels.disabled": "مُعطّل",
  ```
- `en.json`:
  ```
  "integrations.channels.title": "Communication Channels",
  "integrations.channels.email": "Email",
  "integrations.channels.whatsapp": "WhatsApp",
  "integrations.channels.sms": "SMS",
  "integrations.channels.comingSoon": "Coming Soon",
  "integrations.channels.enabled": "Enabled",
  "integrations.channels.disabled": "Disabled",
  ```

---

## المهمة 7: إضافة عنصر "سجل تسليم الرسائل" في إعدادات التكاملات

**السياق:** الـ Backend فيه `integrations.getDeliveryLogs` — لا واجهة لعرض سجل التسليم.

**المطلوب:** أضف تبويب أو قسم في صفحة التكاملات يعرض سجل تسليم الرسائل.

**المحتوى:**
- جدول بسيط (DataTable) يعرض: القناة، الحالة (PENDING/SENT/FAILED/SKIPPED)، التاريخ، المستلم
- فلاتر: القناة، الحالة، نطاق التاريخ
- Badges ملونة للحالات (أخضر=SENT، أحمر=FAILED، رمادي=SKIPPED، أصفر=PENDING)

**مفاتيح الترجمة:**
- `ar.json`:
  ```
  "integrations.deliveryLog.title": "سجل تسليم الرسائل",
  "integrations.deliveryLog.channel": "القناة",
  "integrations.deliveryLog.status": "الحالة",
  "integrations.deliveryLog.date": "التاريخ",
  "integrations.deliveryLog.recipient": "المستلم",
  "integrations.deliveryLog.sent": "تم الإرسال",
  "integrations.deliveryLog.failed": "فشل",
  "integrations.deliveryLog.pending": "قيد الإرسال",
  "integrations.deliveryLog.skipped": "تم تخطيه",
  ```
- `en.json`:
  ```
  "integrations.deliveryLog.title": "Message Delivery Log",
  "integrations.deliveryLog.channel": "Channel",
  "integrations.deliveryLog.status": "Status",
  "integrations.deliveryLog.date": "Date",
  "integrations.deliveryLog.recipient": "Recipient",
  "integrations.deliveryLog.sent": "Sent",
  "integrations.deliveryLog.failed": "Failed",
  "integrations.deliveryLog.pending": "Pending",
  "integrations.deliveryLog.skipped": "Skipped",
  ```

---

## التحقق النهائي

بعد إنهاء كل المهام، نفّذ:

```bash
npx tsc --noEmit 2>&1 | head -50
```

إذا وجدت أخطاء TypeScript، أصلحها. ثم:

```bash
pnpm lint 2>&1 | head -30
```

---

## ملخص المهام

| # | المهمة | النوع | الملفات المتوقعة |
|---|--------|-------|-----------------|
| 1 | محاضر الاستلام في Sidebar | تعديل سطر واحد | `use-sidebar-menu.ts` + ترجمة |
| 2 | صفحة رؤى المشروع | صفحة جديدة | `page.tsx` + `loading.tsx` + sidebar + ترجمة |
| 3 | صفحة تحديثات المشروع | صفحة جديدة | `page.tsx` + `loading.tsx` + sidebar + ترجمة |
| 4 | تفضيلات الإشعارات | صفحة جديدة | `page.tsx` + `loading.tsx` + sidebar + ترجمة |
| 5 | الملخصات البريدية | قسم أو صفحة | ضمن المهمة 4 أو صفحة منفصلة + ترجمة |
| 6 | قنوات التواصل | قسم في إعدادات | تعديل أو صفحة جديدة + ترجمة |
| 7 | سجل تسليم الرسائل | تبويب/قسم | ضمن المهمة 6 + ترجمة |

**نفّذ المهام بالترتيب. بعد كل مهمة تأكد من عدم وجود أخطاء TypeScript.**
