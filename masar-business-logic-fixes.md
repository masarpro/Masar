# برومبت إصلاح مشاكل منطق الأعمال (Business Logic) — منصة مسار

> **ملاحظة:** هذا البرومبت مقسّم إلى 5 مراحل. نفّذ كل مرحلة بالترتيب.
> استخدم Plan Mode أولاً قبل كل مرحلة للتأكد من فهم السياق.

---

## المرحلة 1: إصلاح تسرّب ميزات PRO لمستخدمي FREE (Subscription Bypass)

### السياق
بعض الـ endpoints تستخدم `protectedProcedure` بدلاً من `subscriptionProcedure`. هذا يعني أن مستخدمي FREE plan يقدرون يوصلون لميزات مفترض تكون PRO فقط — ثغرة في نموذج الأعمال.

**الفرق بين الاثنين:**
- `protectedProcedure` → يتحقق من: session + isActive فقط (أي مستخدم مسجّل يمر)
- `subscriptionProcedure` → يتحقق من: session + isActive + checkSubscription() + feature gate (يحظر FREE من write operations)

### المطلوب

#### الخطوة 1: مسح شامل
اقرأ الملفات التالية أولاً:
- `packages/api/orpc/procedures.ts` — لفهم الفرق بين الـ procedures
- `packages/api/lib/feature-gate.ts` — لفهم حدود كل plan
- `packages/api/orpc/router.ts` — لرؤية كل الـ modules

ثم ابحث في كل ملفات `packages/api/modules/` عن كل استخدام لـ `protectedProcedure` باستخدام:
```bash
grep -rn "protectedProcedure" packages/api/modules/ --include="*.ts"
```

#### الخطوة 2: تصنيف كل endpoint
لكل endpoint يستخدم `protectedProcedure`، صنّفه:

**يجب أن يبقى `protectedProcedure`** (query فقط للعرض — مسموح لـ FREE):
- قوائم العرض (list) التي لا تُنشئ بيانات
- الإحصائيات والـ dashboards (read-only)
- بيانات الحساب الشخصي
- أي query يستخدم FREE plan للعرض كجزء من تجربة soft wall

**يجب تغييره لـ `subscriptionProcedure`** (mutations وميزات PRO):
- كل mutations (create, update, delete) في الوحدات المالية
- كل mutations في إدارة الشركة (employees, payroll, assets, expenses)
- كل mutations في التنفيذ الميداني (daily reports, photos, issues)
- كل mutations في الجدول الزمني (milestones, activities)
- كل mutations في المطالبات وأوامر التغيير
- كل mutations في مقاولي الباطن
- كل mutations في المستندات (documents)

#### الخطوة 3: تنفيذ التغييرات

**القاعدة الذهبية:**
- كل `query` (قراءة فقط) للبيانات العامة → يبقى `protectedProcedure` (يسمح لـ FREE بالمشاهدة = soft wall)
- كل `mutation` (كتابة/تعديل/حذف) → يتحول لـ `subscriptionProcedure` (يمنع FREE من الحفظ)
- **استثناء:** mutations حساب شخصي (avatar, profile update) تبقى `protectedProcedure`
- **استثناء:** mutations الاشتراك نفسه (activate code, create checkout) تبقى `protectedProcedure`

**الوحدات الأكثر احتمالاً للمشكلة** (ابدأ بها):
1. `packages/api/modules/dashboard/` — إذا فيه أي mutation يستخدم protected
2. `packages/api/modules/project-chat/` — الرسائل
3. `packages/api/modules/project-documents/` — المستندات
4. `packages/api/modules/project-field/` — التقارير الميدانية
5. `packages/api/modules/project-timeline/` — الجدول الزمني
6. `packages/api/modules/notifications/` — `markRead` (هذا يبقى protected — مقبول)
7. `packages/api/modules/ai/` — بعض الـ mutations مثل `chats.update` و `chats.delete`

**عند التغيير:**
في كل ملف handler، غيّر فقط الـ procedure:
```typescript
// قبل:
export const createSomething = protectedProcedure
  .input(schema)
  .handler(async ({ context, input }) => { ... });

// بعد:
export const createSomething = subscriptionProcedure
  .input(schema)
  .handler(async ({ context, input }) => { ... });
```

**لا تعدّل:** logic الـ handler نفسه، فقط الـ procedure.

#### الخطوة 4: التحقق
بعد كل التغييرات، شغّل:
```bash
pnpm type-check
```
للتأكد أن كل شيء يمر. الـ context type قد يختلف بين `protectedProcedure` و `subscriptionProcedure` — إذا فيه خطأ type، اقرأ `procedures.ts` وعدّل حسب الفرق.

### معايير النجاح
- [ ] كل mutation في وحدات PRO يستخدم `subscriptionProcedure`
- [ ] كل query للعرض يبقى `protectedProcedure` (soft wall)
- [ ] `pnpm type-check` يمر بدون أخطاء
- [ ] `pnpm build` يمر بدون أخطاء

---

## المرحلة 2: إضافة تأكيد البريد الإلكتروني عند إضافة مستخدمين

### السياق
عند إضافة عضو جديد للمنظمة عبر `org-users/create`، الحساب يُنشأ ويُفعّل فوراً بدون أي تأكيد بريد إلكتروني. هذا يعني:
1. ممكن إنشاء حسابات ببريد إلكتروني غير صحيح
2. المستخدم المُضاف ما يعرف إنه انضم لمنظمة
3. لا يوجد password set flow للمستخدم الجديد

### الملفات المرجعية
اقرأها قبل البدء:
- `packages/api/modules/org-users/` — كل ملفات الوحدة
- `packages/auth/auth.ts` — إعدادات BetterAuth
- `packages/mail/` — قوالب البريد الموجودة (6 قوالب)
- `packages/mail/emails/` — مكونات البريد الحالية

### المطلوب

#### الخطوة 1: فهم التدفق الحالي
اقرأ handler الـ `org-users/create` بالكامل. حالياً يفعل:
1. يتحقق من الصلاحيات (settings.users)
2. يتحقق من feature gate (members.invite — FREE: 2 max)
3. يبحث عن المستخدم بالإيميل
4. إذا ما موجود → يُنشئ user جديد + member
5. إذا موجود → يُضيفه كـ member فقط
6. يُفعّل الحساب فوراً

#### الخطوة 2: إنشاء قالب بريد الدعوة

أنشئ قالب بريد جديد في `packages/mail/emails/`:

**الملف:** `packages/mail/emails/org-invitation.tsx`

المحتوى يجب أن يشمل:
- عنوان: "تمت دعوتك للانضمام إلى [اسم المنظمة] في مسار"
- محتوى: "قام [اسم المدعو] بدعوتك للانضمام إلى منظمة [اسم المنظمة] بدور [اسم الدور]"
- زر CTA: "قبول الدعوة وتعيين كلمة المرور"
- رابط الزر: `${APP_URL}/invitation/accept?token={invitationToken}`
- ملاحظة: "هذا الرابط صالح لمدة 7 أيام"
- تصميم RTL بالعربية يتبع نمط القوالب الموجودة

**اتبع بالضبط** نمط القوالب الموجودة في `packages/mail/emails/` — نفس المكتبة (`@react-email`), نفس الأنماط, نفس البنية.

#### الخطوة 3: تعديل تدفق إنشاء المستخدم

عدّل handler الـ `org-users/create`:

```
التدفق الجديد:
1. التحقق من الصلاحيات والـ feature gate (كما هو)
2. البحث عن المستخدم بالإيميل (كما هو)

الحالة أ — المستخدم موجود مسبقاً في النظام (له حساب):
  3a. إضافته كـ member في المنظمة مباشرة (كما هو)
  4a. إرسال بريد إشعار بسيط: "تمت إضافتك لمنظمة X"
  5a. تفعيل العضوية فوراً (المستخدم عنده حساب يقدر يسجّل دخول)

الحالة ب — المستخدم غير موجود (حساب جديد):
  3b. إنشاء user جديد مع isActive: false (أو بحقل emailVerified: false)
  4b. إنشاء member مع حالة pending
  5b. توليد invitation token (CUID أو UUID) مع expiresAt = 7 أيام
  6b. إرسال بريد الدعوة مع رابط accept
  7b. المستخدم يبقى غير مفعّل حتى يقبل الدعوة ويعيّن كلمة مرور
```

#### الخطوة 4: إنشاء endpoint قبول الدعوة

أنشئ endpoint جديد في `packages/api/modules/org-users/`:

**`accept-invitation.ts`:**
```
- Procedure: publicProcedure (المستخدم ما عنده session بعد)
- Input: { token: string, password: string, name?: string }
- Logic:
  1. ابحث عن الدعوة بالـ token
  2. تحقق أن الدعوة ما انتهت (expiresAt > now)
  3. تحقق أن الدعوة ما قُبلت مسبقاً
  4. فعّل المستخدم (isActive: true, emailVerified: true)
  5. عيّن كلمة المرور (عبر BetterAuth أو hash مباشر)
  6. حدّث اسم المستخدم (إذا مُقدّم)
  7. علّم الدعوة كمقبولة
  8. أرجع { success: true } أو redirect URL
```

#### الخطوة 5: إنشاء صفحة قبول الدعوة (Frontend)

أنشئ صفحة في `apps/web/app/(saas)/invitation/accept/page.tsx`:

- تقرأ `token` من query params
- تعرض نموذج: اسم + كلمة مرور جديدة + تأكيد كلمة المرور
- تستدعي endpoint `accept-invitation`
- عند النجاح → redirect لتسجيل الدخول أو مباشرة للـ dashboard

**تصميم الصفحة:** اتبع نمط صفحات Auth الموجودة (login, signup).

#### الخطوة 6: إضافة مفاتيح الترجمة

أضف في `packages/i18n/ar.json` و `packages/i18n/en.json`:
```json
{
  "invitation": {
    "title": "قبول الدعوة / Accept Invitation",
    "subtitle": "تمت دعوتك للانضمام إلى {orgName}",
    "setPassword": "تعيين كلمة المرور",
    "confirmPassword": "تأكيد كلمة المرور",
    "accept": "قبول الدعوة",
    "expired": "هذه الدعوة منتهية الصلاحية",
    "alreadyAccepted": "هذه الدعوة مقبولة مسبقاً",
    "success": "تم قبول الدعوة بنجاح!",
    "emailSubject": "دعوة للانضمام إلى {orgName} في مسار",
    "emailBody": "قام {inviterName} بدعوتك للانضمام",
    "emailCta": "قبول الدعوة"
  }
}
```

### معايير النجاح
- [ ] إنشاء مستخدم جديد يرسل بريد دعوة (لا يُفعّل فوراً)
- [ ] إضافة مستخدم موجود يرسل بريد إشعار (يُفعّل فوراً)
- [ ] صفحة قبول الدعوة تعمل مع تعيين كلمة مرور
- [ ] الدعوة تنتهي بعد 7 أيام
- [ ] `pnpm type-check` و `pnpm build` يمران

---

## المرحلة 3: نقل تحديث حالة الفواتير المتأخرة من Lazy إلى Scheduled

### السياق
حالياً `finance.invoices.list` يشغّل `updateMany` على كل الفواتير المنتهية عند كل تحميل للقائمة. هذا يعني:
1. كل مرة مستخدم يفتح قائمة الفواتير → write query على DB
2. كلما زاد عدد الفواتير المنتهية → UPDATE أثقل
3. عدة مستخدمين يفتحون القائمة بنفس الوقت → race conditions محتملة
4. هذا anti-pattern: read endpoint يعمل write operation

### الملفات المرجعية
- `packages/api/modules/finance/` — ابحث عن `OVERDUE` و `updateMany` في ملفات الفواتير

### المطلوب

#### الخطوة 1: فهم الكود الحالي
ابحث عن الكود الذي يحدّث حالة الفواتير لـ OVERDUE:
```bash
grep -rn "OVERDUE\|overdue\|updateMany" packages/api/modules/finance/ --include="*.ts"
```
اقرأ الكود بالكامل وافهم:
- ما هو الشرط اللي يخلّي الفاتورة OVERDUE؟ (عادةً: status = ISSUED/SENT/VIEWED + dueDate < today)
- أين يُستدعى هذا التحديث؟ (داخل `list` handler)

#### الخطوة 2: إنشاء Cron API Route

أنشئ Next.js API route يُنفّذ كـ Cron Job:

**الملف:** `apps/web/app/api/cron/update-overdue-invoices/route.ts`

```typescript
// هذا الـ route يُستدعى كل يوم عبر Vercel Cron
// أو يمكن استدعاؤه يدوياً

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. تحقق من Authorization header (secret token لمنع الاستدعاء غير المصرح)
  //    استخدم CRON_SECRET من environment variables
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. حدّث كل الفواتير المتأخرة عبر المنظمات:
  //    WHERE status IN ('ISSUED', 'SENT', 'VIEWED') AND dueDate < NOW()
  //    SET status = 'OVERDUE'
  const result = await prisma.financeInvoice.updateMany({
    where: {
      status: { in: ["ISSUED", "SENT", "VIEWED"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  // 3. أرجع عدد الفواتير المُحدّثة
  return NextResponse.json({
    success: true,
    updatedCount: result.count,
    timestamp: new Date().toISOString(),
  });
}
```

#### الخطوة 3: تعريف Vercel Cron

أنشئ أو عدّل `vercel.json` في root المشروع:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-overdue-invoices",
      "schedule": "0 3 * * *"
    }
  ]
}
```
هذا يشغّل الـ cron كل يوم الساعة 3 صباحاً (UTC). عدّل التوقيت ليناسب توقيت السعودية (UTC+3) — يعني `0 0 * * *` يكون منتصف الليل بتوقيت السعودية.

#### الخطوة 4: إضافة CRON_SECRET

أضف في `.env.example`:
```
CRON_SECRET=your-cron-secret-here
```

وأضف القيمة الفعلية في Vercel Environment Variables.

#### الخطوة 5: إزالة Lazy Update من invoices.list

في handler الـ `finance.invoices.list`:
1. احذف كود `updateMany` للفواتير المتأخرة
2. اترك فقط الـ query اللي يجلب القائمة (read-only)
3. أضف تعليق يشرح إن التحديث يتم عبر cron job:

```typescript
// حالة OVERDUE تُحدّث عبر cron job يومي:
// /api/cron/update-overdue-invoices
// لا تُحدّث هنا لأن هذا read endpoint
```

#### الخطوة 6 (اختياري): Fallback check بسيط

إذا تبي safety net بدون write operation:
```typescript
// في finance.invoices.list — بدلاً من updateMany، حساب OVERDUE في memory:
const invoices = await prisma.financeInvoice.findMany({ ... });

// علّم الفواتير المتأخرة في memory فقط (بدون DB write)
const enrichedInvoices = invoices.map(inv => ({
  ...inv,
  computedStatus: isOverdue(inv) ? "OVERDUE" : inv.status,
}));
```
لكن الأفضل الاعتماد على الـ cron ونأخذ الـ status من DB مباشرة.

### معايير النجاح
- [ ] Cron route يعمل ويحدّث الفواتير المتأخرة
- [ ] `finance.invoices.list` لا يعمل أي write operation
- [ ] `vercel.json` يحتوي cron configuration
- [ ] `CRON_SECRET` مُوثّق في `.env.example`
- [ ] `pnpm build` يمر بدون أخطاء

---

## المرحلة 4: إصلاح AssistantProvider — Lazy Loading بدل Eager Fetching

### السياق
`AssistantProvider` موجود في Organization Slug Layout — يعني يُحمّل لكل مستخدم عند كل تنقل. المشكلة إنه يجلب قائمة محادثات AI (`/api/ai/assistant/chats`) عند كل تغيير في organization slug، حتى لو المستخدم ما فتح الـ AI chat أبداً.

هذا يضيف طلب شبكة (~100ms) لكل تنقل بدون فائدة.

### الملفات المرجعية
ابحث وافتح:
```bash
find apps/web -name "AssistantProvider*" -o -name "assistant-provider*" | head -20
```
واقرأ أيضاً الـ layout اللي يستخدمه:
```bash
grep -rn "AssistantProvider" apps/web/app/ --include="*.tsx"
```

### المطلوب

#### الخطوة 1: تحليل AssistantProvider الحالي

اقرأ ملف `AssistantProvider.tsx` بالكامل وافهم:
- كيف يجلب المحادثات (refreshChats أو useQuery)
- متى يُطلق الـ fetch (عند mount؟ عند تغيير org slug؟)
- ما البيانات اللي يوفرها للـ children (chats list, active chat, etc.)

#### الخطوة 2: تحويل fetch المحادثات لـ Lazy Loading

**الحل:** لا تجلب المحادثات حتى المستخدم يفتح AI panel فعلاً.

**الطريقة أ — `enabled: false` ثم trigger يدوي:**
```typescript
// في AssistantProvider أو hook المحادثات:
const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

const { data: chats, refetch: fetchChats } = useQuery({
  queryKey: ["ai", "chats", organizationId],
  queryFn: () => fetchAssistantChats(organizationId),
  enabled: isAiPanelOpen, // ← لا يجلب حتى يُفتح
  staleTime: 5 * 60 * 1000, // 5 دقائق — المحادثات لا تتغير بسرعة
});

// عند فتح AI panel:
const openAiPanel = () => {
  setIsAiPanelOpen(true);
  // fetchChats يُطلق تلقائياً لأن enabled صار true
};
```

**الطريقة ب — إزالة fetch من Provider ونقله للـ AI component:**
```typescript
// AssistantProvider يبقى لكن بدون fetch:
export function AssistantProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  // لا يجلب أي بيانات هنا
  return (
    <AssistantContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AssistantContext.Provider>
  );
}

// الـ fetch ينتقل لداخل AI Panel component:
function AiChatPanel() {
  const { data: chats } = useQuery({
    queryKey: ["ai", "chats", orgId],
    queryFn: fetchChats,
    // يُجلب فقط لما هذا الـ component يظهر
  });
  // ...
}
```

**اختر الطريقة الأنسب** حسب بنية الكود الحالي. الطريقة ب أفضل لكن قد تحتاج تعديلات أكثر.

#### الخطوة 3: التأكد أن AI Panel يعمل

بعد التعديل:
1. تنقّل بين الصفحات → تأكد أن لا يوجد طلب لـ `/api/ai/assistant/chats`
2. افتح AI panel → تأكد أن المحادثات تُجلب الآن
3. أغلق وأعد الفتح → تأكد أن الـ cache يعمل (ما يجلب مرة ثانية إذا ما مر 5 دقائق)

### معايير النجاح
- [ ] التنقل بين الصفحات لا يُطلق طلب AI chats
- [ ] فتح AI panel يجلب المحادثات عند الحاجة
- [ ] الـ cache يمنع re-fetch غير ضروري
- [ ] `pnpm type-check` و `pnpm build` يمران

---

## المرحلة 5: إضافة Business Error Logging (Sentry)

### السياق
حالياً `packages/logs/` يستخدم Sentry لكن فقط للأخطاء غير المتوقعة (unhandled exceptions). أخطاء business logic مثل "مستخدم حاول إنشاء فاتورة بدون صلاحية" أو "محاولة تجاوز حد FREE plan" لا تُسجّل.

هذه البيانات مهمة لـ:
1. معرفة كم مستخدم FREE يحاول ميزات PRO (فرصة conversion)
2. اكتشاف أنماط إساءة الاستخدام
3. مراقبة صحة النظام

### الملفات المرجعية
- `packages/logs/` — كل ملفاتها
- `packages/api/orpc/procedures.ts` — middleware chain
- `packages/api/lib/rate-limit.ts` — rate limiting

### المطلوب

#### الخطوة 1: فهم نظام اللوقات الحالي

اقرأ `packages/logs/` بالكامل. ادرس:
- هل Sentry مُعدّ فعلاً؟ ما الإعدادات؟
- هل فيه pino أو logger آخر؟
- كيف يُصدّر ويُستخدم في باقي الحزم؟

#### الخطوة 2: إنشاء Business Logger

أنشئ ملف جديد في `packages/logs/`:

**الملف:** `packages/logs/business-logger.ts`

```typescript
// Business Event Logger
// يُسجّل أحداث الأعمال المهمة (ليس أخطاء فنية)

type BusinessEvent = {
  // أحداث الاشتراك
  type: "subscription.limit_hit"      // مستخدم FREE وصل لحد
    | "subscription.bypass_attempt"   // محاولة تجاوز حد
    | "subscription.upgraded"         // ترقية لـ PRO
    | "subscription.expired"          // اشتراك انتهى
  // أحداث الصلاحيات
    | "permission.denied"             // محاولة وصول بدون صلاحية
    | "permission.cross_tenant"       // محاولة وصول cross-tenant
  // أحداث مالية
    | "finance.invoice_overdue"       // فاتورة تأخرت
    | "finance.large_transaction"     // معاملة كبيرة (threshold)
  // أحداث أمنية خفيفة
    | "auth.rate_limited"             // rate limit triggered
    | "auth.deactivated_access"       // مستخدم معطّل حاول الوصول
  // أحداث عامة
    | "org.member_added"              // عضو جديد
    | "org.member_removed"            // عضو مُزال
    | "project.created"               // مشروع جديد
    | "project.deleted";              // مشروع محذوف
};

type BusinessEventData = {
  type: BusinessEvent["type"];
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
  severity: "info" | "warning" | "error";
};

export function logBusinessEvent(event: BusinessEventData): void {
  // 1. Console log (always — for Vercel logs)
  const logFn = event.severity === "error" ? console.error
    : event.severity === "warning" ? console.warn
    : console.info;

  logFn(`[BUSINESS] ${event.type}`, {
    userId: event.userId,
    orgId: event.organizationId,
    ...event.metadata,
  });

  // 2. Sentry breadcrumb (if Sentry is configured)
  //    هذا لا يُنشئ error — فقط يُضيف breadcrumb للأحداث المستقبلية
  try {
    const Sentry = require("@sentry/nextjs");
    Sentry.addBreadcrumb({
      category: "business",
      message: event.type,
      level: event.severity,
      data: {
        userId: event.userId,
        organizationId: event.organizationId,
        ...event.metadata,
      },
    });

    // 3. لأحداث warning و error → سجّل كـ Sentry event فعلي
    if (event.severity !== "info") {
      Sentry.captureMessage(`[Business] ${event.type}`, {
        level: event.severity,
        tags: {
          eventType: event.type,
          userId: event.userId || "unknown",
          organizationId: event.organizationId || "unknown",
        },
        extra: event.metadata,
      });
    }
  } catch {
    // Sentry not available — silent fail
  }
}
```

#### الخطوة 3: إضافة Logging في النقاط الحرجة

**3a. في `subscriptionProcedure` — عند حظر FREE plan:**

اقرأ `packages/api/orpc/procedures.ts` وابحث عن المكان اللي يرمي خطأ عند FREE plan limit. أضف قبل throw:

```typescript
import { logBusinessEvent } from "@repo/logs/business-logger";

// عند حظر write operation لمستخدم FREE:
logBusinessEvent({
  type: "subscription.limit_hit",
  userId: context.user.id,
  organizationId: context.session.activeOrganizationId,
  metadata: {
    feature: featureName, // مثل "projects.create"
    plan: "FREE",
    currentUsage: currentCount,
    limit: maxAllowed,
  },
  severity: "info", // ليس خطأ — سلوك متوقع
});
```

**3b. في Permission denied:**

ابحث عن المكان اللي يرمي `FORBIDDEN` في verify-project-access أو getUserPermissions:

```typescript
logBusinessEvent({
  type: "permission.denied",
  userId: context.user.id,
  organizationId: orgId,
  metadata: {
    requiredPermission: permissionKey,
    userRole: userRole,
    endpoint: endpointName,
  },
  severity: "warning",
});
```

**3c. في Rate Limiting — عند الحظر:**

في `packages/api/lib/rate-limit.ts`، عند رفض الطلب:

```typescript
logBusinessEvent({
  type: "auth.rate_limited",
  userId: userId,
  metadata: {
    preset: presetName,
    key: rateLimitKey,
    limit: maxRequests,
  },
  severity: "warning",
});
```

**3d. في Cross-Tenant Guard:**

في `getUserPermissions()` عند رفض cross-tenant:

```typescript
logBusinessEvent({
  type: "permission.cross_tenant",
  userId: user.id,
  organizationId: requestedOrgId,
  metadata: {
    userOrgId: user.organizationId,
    requestedOrgId: requestedOrgId,
  },
  severity: "error", // هذا حدث أمني
});
```

#### الخطوة 4: تصدير من packages/logs

تأكد أن `packages/logs/index.ts` يصدّر `logBusinessEvent`:
```typescript
export { logBusinessEvent } from "./business-logger";
```

### معايير النجاح
- [ ] `logBusinessEvent` مُنشأ ومُصدّر من `@repo/logs`
- [ ] أحداث subscription limit مُسجّلة
- [ ] أحداث permission denied مُسجّلة
- [ ] أحداث rate limiting مُسجّلة
- [ ] أحداث cross-tenant مُسجّلة
- [ ] Console logs تظهر في Vercel dashboard
- [ ] Sentry events تظهر (إذا Sentry مُعدّ)
- [ ] `pnpm type-check` و `pnpm build` يمران

---

## ملخص المراحل

| المرحلة | المشكلة | الملفات الرئيسية | الوقت التقديري |
|---------|---------|-----------------|---------------|
| 1 | تسرّب ميزات PRO | `packages/api/modules/*/` | 2-3 ساعات |
| 2 | تأكيد البريد الإلكتروني | `org-users/`, `mail/`, صفحة جديدة | 4-5 ساعات |
| 3 | Lazy Invoice Update → Cron | `finance/invoices`, `api/cron/` | 1-2 ساعة |
| 4 | AssistantProvider Lazy Loading | `AssistantProvider.tsx` | 1-2 ساعة |
| 5 | Business Error Logging | `packages/logs/`, procedures | 2-3 ساعات |
| **المجموع** | | | **~10-15 ساعة** |

---

## تعليمات عامة

1. **استخدم Plan Mode** قبل كل مرحلة — اقرأ الملفات المذكورة وافهم السياق
2. **لا تكسر الموجود** — كل تغيير يجب أن يحافظ على التوافق مع الكود الحالي
3. **شغّل بعد كل مرحلة:**
   ```bash
   pnpm type-check
   pnpm build
   ```
4. **اتبع الأنماط الموجودة** — لا تُدخل أنماط جديدة (مكتبات, patterns) إلا إذا مطلوب صراحة
5. **مفاتيح الترجمة** — أي نص جديد يظهر للمستخدم يجب أن يكون عبر `next-intl` مع مفاتيح في `ar.json` و `en.json`
6. **اكتب ≤800 سطر لكل عملية كتابة** لتجنب حد output
