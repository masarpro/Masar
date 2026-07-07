برومبت المرحلة 3 — AI Tools / Function Calling

المرحلة الفرعية 3.1 — ملف تعريف الأدوات (Tool Definitions)
## المهمة
أنشئ ملف الأدوات الذي يعرّف 6 tools للمساعد الذكي باستخدام AI SDK `tool()` مع Zod schemas.
كل أداة تقرأ بيانات من قاعدة البيانات عبر Prisma — read-only فقط.

## السياق
- المرحلتان 1 و 2 مكتملتان — المساعد يعمل مع system prompt ويرد عبر streaming
- API Route موجود: apps/web/app/api/ai/assistant/route.ts
- قاعدة البيانات: Prisma 7 مع PostgreSQL (Supabase)
- ملفات الاستعلامات الموجودة: packages/database/prisma/queries/ (39 ملف)
- أهم ملفات الاستعلامات:
  - projects.ts (~400 سطر، 8 دوال)
  - dashboard.ts (~300 سطر، 8 دوال) 
  - finance.ts (~1810 سطر، 20+ دالة)
  - org-finance.ts (~800 سطر، 19 دالة)
  - finance-reports.ts (~500 سطر، 12 دالة)
  - project-field.ts (~400 سطر، 13 دالة)
  - project-finance.ts (~500 سطر، 13 دالة)
  - project-timeline.ts (~350 سطر، 8 دوال)
  - company.ts (~991 سطر، 16+ دالة)
  - subcontract.ts (~600 سطر، 13 دالة)
  - payroll.ts (~500 سطر، 10 دوال)
- النمط الموجود: كل استعلام يفلتر بـ organizationId (multi-tenancy)
- AI SDK: ai@5.0.93 — استخدم `tool()` من 'ai' مع Zod schemas
- Zod: zod@4.1.12

## ⚠️ قاعدة حاسمة
اقرأ ملفات الاستعلامات الموجودة أولاً قبل كتابة أي كود:
1. `packages/database/prisma/queries/projects.ts`
2. `packages/database/prisma/queries/dashboard.ts`
3. `packages/database/prisma/queries/org-finance.ts`
4. `packages/database/prisma/queries/finance-reports.ts`
5. `packages/database/prisma/queries/project-field.ts`
6. `packages/database/prisma/queries/project-finance.ts`
7. `packages/database/prisma/queries/project-timeline.ts`
8. `packages/database/prisma/queries/company.ts`
9. `packages/database/prisma/queries/subcontract.ts`
10. `packages/database/prisma/queries/payroll.ts`
11. `packages/database/prisma/queries/finance.ts`

استخدم الدوال الموجودة فيها بأقصى قدر ممكن بدل كتابة استعلامات Prisma جديدة.
إذا لم تجد دالة مناسبة، اكتب استعلام Prisma مباشر مع فلتر organizationId دائماً.

## الملف المطلوب

### `packages/ai/tools/assistant-tools.ts`
```typescript
// يصدّر: getAssistantTools(toolContext: ToolContext) => Record<string, Tool>
//
// ToolContext يُمرر من API Route ويحتوي:
// interface ToolContext {
//   organizationId: string;
//   userId: string;
//   organizationSlug: string;
//   locale: string;
// }
//
// --- استيرادات ---
// import { tool } from 'ai';
// import { z } from 'zod';
// import { db } from '@repo/database'; // أو المسار الصحيح — تحقق من كيف يستوردها بقية الكود
//
// ⚠️ تحقق من الـ import الصحيح لـ prisma client:
// ابحث في packages/database/index.ts أو packages/database/prisma/client.ts
// وابحث في أي ملف queries موجود لترى كيف يستورد db
//
// إذا الاستعلامات الموجودة تصدّر دوال جاهزة (مثل listProjects(orgId))
// استوردها واستخدمها مباشرة بدل كتابة prisma.project.findMany

// ===========================
// الأداة 1: queryProjects
// ===========================
// الغرض: استعلام المشاريع — قائمة أو تفاصيل مشروع أو إحصائيات عامة
//
// Zod Schema (parameters):
// {
//   action: z.enum(['list', 'details', 'stats']),
//   projectId: z.string().optional(),       // مطلوب لـ details
//   status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(), // فلتر لـ list
//   search: z.string().optional(),          // بحث بالاسم
// }
//
// Description (بالعربي — يقرأها Claude ليفهم متى يستخدمها):
// "استعلام المشاريع. action=list: قائمة المشاريع مع فلتر اختياري. action=details: تفاصيل مشروع محدد (يحتاج projectId). action=stats: إحصائيات عامة (عدد المشاريع حسب الحالة)."
//
// Execute:
// - list: استخدم دالة listProjects أو prisma.project.findMany مع:
//   where: { organizationId, status?, name: { contains: search, mode: 'insensitive' }? }
//   select: { id, name, status, type, progress, contractValue, startDate, endDate, client }
//   orderBy: { updatedAt: 'desc' }
//   take: 20  // حد أقصى
//
// - details: 
//   prisma.project.findFirst مع:
//   where: { id: projectId, organizationId } // تحقق من organizationId دائماً!
//   include: { members: { include: { user: { select: { name, email } } } }, _count: { select: { expenses, dailyReports, issues, milestones, documents } } }
//
// - stats:
//   استخدم دالة getStats من dashboard.ts إذا وُجدت
//   أو groupBy status مع count
//
// Return format: ارجع object مع البيانات بشكل مقروء
// { projects: [...] } أو { project: {...} } أو { stats: {...} }

// ===========================
// الأداة 2: queryFinance
// ===========================
// الغرض: استعلام البيانات المالية — فواتير، مقبوضات، مصروفات، ملخص
//
// Zod Schema:
// {
//   action: z.enum(['invoices', 'payments', 'expenses', 'summary', 'banks']),
//   projectId: z.string().optional(),         // فلتر حسب المشروع
//   status: z.string().optional(),            // فلتر حسب الحالة
//   dateFrom: z.string().optional(),          // تاريخ البداية ISO
//   dateTo: z.string().optional(),            // تاريخ النهاية ISO
//   limit: z.number().min(1).max(50).optional().default(20),
// }
//
// Description:
// "استعلام البيانات المالية للمنظمة. invoices: قائمة الفواتير. payments: المقبوضات. expenses: المصروفات. summary: ملخص مالي شامل (إجمالي فواتير/مقبوضات/مصروفات/أرصدة). banks: أرصدة الحسابات البنكية."
//
// Execute:
// - invoices: ابحث عن دالة listInvoices في finance.ts أو org-finance.ts
//   أو: prisma.financeInvoice.findMany
//   where: { organizationId, status?, projectId? }
//   select: { id, invoiceNo, clientName, totalAmount, paidAmount, status, dueDate, createdAt }
//   orderBy: { createdAt: 'desc' }, take: limit
//   + count لـ OVERDUE (status SENT/VIEWED وتاريخ الاستحقاق فات)
//
// - payments: ابحث عن listPayments في org-finance.ts
//   أو: prisma.financePayment.findMany
//   where: { organizationId, projectId? }
//   select: { id, paymentNo, amount, date, clientName, paymentMethod }
//   orderBy: { date: 'desc' }, take: limit
//
// - expenses: ابحث عن listExpenses في org-finance.ts
//   أو: prisma.financeExpense.findMany
//   where: { organizationId, projectId?, status?, category? }
//   select: { id, expenseNo, amount, category, vendorName, status, date }
//   orderBy: { date: 'desc' }, take: limit
//
// - summary: ابحث عن getFinanceDashboardStats في finance-reports.ts
//   أو أنشئ aggregation:
//   { totalInvoices: count + sum, totalPayments: sum, totalExpenses: sum, overdueInvoices: count + sum, bankBalances: sum }
//
// - banks: prisma.organizationBank.findMany
//   where: { organizationId }
//   select: { id, name, bankName, accountType, balance, currency }
//
// ملاحظة: المبالغ من نوع Decimal — حولها لـ number عند الإرجاع:
// amount: Number(record.amount) أو record.amount.toNumber()

// ===========================
// الأداة 3: queryExecution
// ===========================
// الغرض: استعلام بيانات التنفيذ والعمل الميداني لمشروع محدد
//
// Zod Schema:
// {
//   projectId: z.string(),  // مطلوب
//   action: z.enum(['phases', 'dailyReports', 'issues', 'progress', 'summary']),
//   status: z.string().optional(),
//   severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
//   limit: z.number().min(1).max(20).optional().default(10),
// }
//
// Description:
// "استعلام بيانات التنفيذ الميداني لمشروع محدد. يحتاج projectId دائماً. phases: مراحل التنفيذ. dailyReports: آخر التقارير اليومية. issues: المشاكل (مع فلتر severity اختياري). progress: تحديثات التقدم. summary: ملخص شامل."
//
// Execute:
// ⚠️ أمان: تحقق أن المشروع ينتمي للمنظمة أولاً:
// const project = await prisma.project.findFirst({ where: { id: projectId, organizationId } });
// if (!project) return { error: 'المشروع غير موجود أو لا تملك صلاحية الوصول' };
//
// - phases: ابحث في project-field.ts عن دالة مناسبة
//   أو: prisma.executionPhase.findMany (تحقق من اسم النموذج الفعلي في schema.prisma)
//   ملاحظة: قد تكون المراحل محفوظة بطريقة مختلفة — اقرأ schema.prisma للتأكد
//   ابحث عن: ExecutionPhase أو ProjectPhase أو ما يشبه في الـ schema
//
// - dailyReports: ابحث عن listDailyReports في project-field.ts
//   أو: prisma.projectDailyReport.findMany
//   where: { projectId, organizationId }
//   select: { id, reportDate, weather, manpower, notes, createdAt }
//   orderBy: { reportDate: 'desc' }, take: limit
//
// - issues: ابحث عن listIssues في project-field.ts
//   أو: prisma.projectIssue.findMany
//   where: { projectId, organizationId, status?, severity? }
//   select: { id, title, description, severity, status, createdAt }
//   orderBy: { createdAt: 'desc' }, take: limit
//
// - progress: ابحث عن listProgressUpdates في project-field.ts
//   أو: prisma.projectProgressUpdate.findMany
//   where: { projectId, organizationId }
//   select: { id, progress, phaseLabel, notes, createdAt }
//   orderBy: { createdAt: 'desc' }, take: limit
//
// - summary: اجمع: عدد التقارير، عدد المشاكل المفتوحة، آخر تقرير، نسبة الإنجاز من Project

// ===========================
// الأداة 4: queryTimeline
// ===========================
// الغرض: استعلام الجدول الزمني (مراحل المشروع الزمنية)
//
// Zod Schema:
// {
//   projectId: z.string(),  // مطلوب
//   filter: z.enum(['all', 'upcoming', 'overdue', 'completed']).optional().default('all'),
// }
//
// Description:
// "استعلام الجدول الزمني (Milestones) لمشروع محدد. all: كل المراحل. upcoming: القادمة. overdue: المتأخرة. completed: المكتملة."
//
// Execute:
// ⚠️ تحقق من ملكية المشروع أولاً (نفس نمط queryExecution)
//
// ابحث عن listMilestones في project-timeline.ts
// أو: prisma.projectMilestone.findMany
// where: { projectId, organizationId, ...filterCondition }
//
// filterCondition:
// - all: {} (لا فلتر إضافي)
// - upcoming: { status: { in: ['PLANNED', 'IN_PROGRESS'] }, dueDate: { gte: new Date() } }
// - overdue: { status: { in: ['PLANNED', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } }
// - completed: { status: 'COMPLETED' }
//
// select: { id, title, status, dueDate, completedDate, sortOrder }
// orderBy: { dueDate: 'asc' }
//
// Return: { milestones: [...], total: count, overdueCount: count }

// ===========================
// الأداة 5: navigateTo
// ===========================
// الغرض: يرجع رابط التنقل المناسب بناءً على وصف الوجهة
//
// Zod Schema:
// {
//   destination: z.string(), // وصف نصي: "إنشاء فاتورة"، "قائمة المشاريع"، "إعدادات المنظمة"
//   projectId: z.string().optional(), // إذا الوجهة داخل مشروع
// }
//
// Description:
// "يرجع رابط URL للتنقل حسب الوصف المطلوب. مثلاً: 'إنشاء فاتورة' → '/app/{org}/finance/invoices/new'"
//
// Execute:
// هذه الأداة لا تحتاج Prisma — فقط تبني URL
// استخدم organizationSlug من toolContext
//
// const basePath = `/app/${toolContext.organizationSlug}`;
//
// خريطة الوجهات (keyword matching):
// فاتورة/invoice → finance/invoices (new/list)
// مقبوض/payment → finance/payments
// مصروف/expense → finance/expenses  
// عميل/client → finance/clients
// بنك/bank → finance/banks
// تقرير مالي → finance/reports
// مشروع/project → projects (new/list/[pid])
// تقرير يومي → projects/[pid]/field/daily-reports
// مشكلة/issue → projects/[pid]/field/issues
// تنفيذ/execution → projects/[pid]/execution
// جدول زمني/timeline → projects/[pid]/timeline
// مستند/document → projects/[pid]/documents
// أمر تغيير → projects/[pid]/changes
// فريق/team → projects/[pid]/team
// بوابة مالك → projects/[pid]/owner
// عقد باطن → projects/[pid]/finance/subcontracts
// موظف/employee → company/employees
// أصل/asset → company/assets
// رواتب/payroll → company/payroll
// مصروف منشأة → company/expenses
// إعدادات/settings → settings/general
// أعضاء → settings/members
// أدوار → settings/roles
// اشتراك/billing → settings/billing
// إشعارات → notifications
// عرض سعر/quotation → pricing/quotations
// دراسة تكلفة → pricing/studies
//
// إذا الوجهة تحتاج projectId وما هو متوفر:
// return { url: null, message: 'يرجى تحديد المشروع أولاً' }
//
// Return: { url: string, label: string }

// ===========================
// الأداة 6: queryCompany
// ===========================
// الغرض: استعلام بيانات إدارة المنشأة (موظفين، أصول، مصروفات، رواتب)
//
// Zod Schema:
// {
//   action: z.enum(['employees', 'assets', 'expenses', 'payroll', 'summary']),
//   status: z.string().optional(),
//   limit: z.number().min(1).max(50).optional().default(20),
// }
//
// Description:
// "استعلام بيانات إدارة المنشأة (الشركة). employees: قائمة الموظفين. assets: الأصول. expenses: مصروفات المنشأة الثابتة. payroll: آخر دورات الرواتب. summary: ملخص شامل."
//
// Execute:
// - employees: ابحث عن listEmployees في company.ts
//   أو: prisma.employee.findMany (تحقق من الاسم الفعلي — قد يكون CompanyEmployee)
//   where: { organizationId, status? }
//   select: { id, name, type, baseSalary, status, department }
//   orderBy: { name: 'asc' }, take: limit
//   + count active + terminated
//
// - assets: ابحث عن listAssets في company.ts
//   أو: prisma.companyAsset.findMany
//   where: { organizationId, status? }
//   select: { id, name, category, type, status, purchaseCost, currentProjectId }
//   orderBy: { name: 'asc' }, take: limit
//   + count حسب status
//
// - expenses: ابحث في company.ts
//   أو: prisma.companyExpense.findMany
//   where: { organizationId, isActive: true }
//   select: { id, name, category, amount, recurrence }
//   orderBy: { name: 'asc' }
//   + sum الشهري (amount × recurrence factor)
//
// - payroll: ابحث عن listPayrollRuns في payroll.ts
//   أو: prisma.payrollRun.findMany
//   where: { organizationId }
//   select: { id, month, year, status, totalNetSalary, itemCount }
//   orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 6
//
// - summary: اجمع:
//   { employeesActive: count, assetsTotal: count, monthlyExpenses: sum, lastPayroll: {...} }

// ===========================
// الدالة الرئيسية
// ===========================
//
// export function getAssistantTools(toolContext: ToolContext) {
//   return {
//     queryProjects: tool({
//       description: '...',
//       parameters: z.object({...}),
//       execute: async (params) => {
//         // ... implementation using toolContext.organizationId
//       }
//     }),
//     queryFinance: tool({ ... }),
//     queryExecution: tool({ ... }),
//     queryTimeline: tool({ ... }),
//     navigateTo: tool({ ... }),
//     queryCompany: tool({ ... }),
//   };
// }
//
// export interface ToolContext {
//   organizationId: string;
//   userId: string;
//   organizationSlug: string;
//   locale: string;
// }
```

## قواعد أمان حاسمة — لا تتجاوزها أبداً
1. **كل استعلام Prisma** يجب أن يحتوي `organizationId` في `where` — بلا استثناء
2. لاستعلامات المشاريع الفرعية: تحقق أن `projectId` ينتمي لـ `organizationId` أولاً
3. **read-only فقط** — لا create, update, delete في أي أداة
4. **حد البيانات**: take لا يتجاوز 50 سجل لأي استعلام
5. **تحويل Decimal**: أي حقل مالي (Decimal) حوّله لـ Number قبل الإرجاع
6. **error handling**: كل execute ملفوف بـ try/catch — ارجع { error: message } عند الفشل

## التحقق
- [ ] الملف يصدّر getAssistantTools + ToolContext
- [ ] لا يوجد أي mutation (create/update/delete) في أي أداة
- [ ] كل استعلام يحتوي organizationId
- [ ] pnpm build ينجح (تأكد من imports صحيحة)

المرحلة الفرعية 3.2 — ربط الأدوات مع API Route
## المهمة
عدّل API Route ليستخدم الأدوات مع streamText — يصبح المساعد قادراً على قراءة البيانات الفعلية.

## السياق
- المرحلة 3.1 مكتملة — getAssistantTools جاهز
- API Route الحالي: apps/web/app/api/ai/assistant/route.ts (من المرحلة 2.3)
- حالياً يستخدم streamText بدون tools
- يجب إضافة: tools + maxSteps + organizationId

## الملف المطلوب تعديله

### `apps/web/app/api/ai/assistant/route.ts`

التعديلات:

1. **أضف import للأدوات:**
```typescript
import { getAssistantTools } from '@repo/ai/tools/assistant-tools';
// أو المسار الصحيح — تحقق من tsconfig paths
```

2. **استخراج organizationId:**
   - الـ context يأتي من body الطلب (أضفناه في المرحلة 2.3)
   - يحتوي: organizationSlug, organizationId, organizationName...
   - ⚠️ تحقق: هل organizationId يأتي من الـ frontend أم يجب جلبه من الـ backend؟
   - **الأفضل أمنياً**: لا تثق بـ organizationId من الـ frontend!
   - بدلاً من ذلك: استخدم organizationSlug + userId لجلب الـ membership من DB
   - ابحث في الكود عن كيف يتحقق الـ layout من العضوية — عادةً:
```typescript
// النمط المتوقع:
const member = await db.member.findFirst({
  where: { userId: session.user.id, organization: { slug: context.organizationSlug } },
  include: { organization: true }
});
if (!member) return new Response('Unauthorized', { status: 403 });
const organizationId = member.organization.id;
```

3. **بناء الأدوات:**
```typescript
const tools = getAssistantTools({
  organizationId: organizationId,  // من DB وليس من frontend
  userId: session.user.id,
  organizationSlug: context.organizationSlug,
  locale: context.locale || 'ar',
});
```

4. **عدّل streamText:**
```typescript
const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: systemPrompt,
  messages,
  tools,               // ← أضف هذا
  maxSteps: 5,         // ← أضف: يسمح لـ Claude بعمل حتى 5 tool calls متتابعة
  maxTokens: 2000,     // ← زد من 1000 (الردود مع بيانات تحتاج أكثر)
});
```

5. **أضف rate limiting (إذا لم يكن موجوداً):**
```typescript
// ابحث عن الآلية الموجودة في المشروع:
// packages/api/lib/rate-limit.ts
// استخدم RATE_LIMITS.MESSAGE (30 req/min) أو أنشئ preset جديد
//
// النمط المتوقع:
// import { checkRateLimit } from '@repo/api/lib/rate-limit';
// await checkRateLimit(`assistant:${session.user.id}`, { max: 30, window: 60 });
```

6. **أضف validation على الطلب:**
```typescript
// تحقق من:
// - messages يجب أن يكون array
// - آخر رسالة user لا تتجاوز 2000 حرف
// - عدد الرسائل لا يتجاوز 50
const lastMessage = messages[messages.length - 1];
if (lastMessage?.content?.length > 2000) {
  return new Response('الرسالة طويلة جداً (الحد الأقصى 2000 حرف)', { status: 400 });
}
if (messages.length > 50) {
  return new Response('تم تجاوز الحد الأقصى للرسائل (50 رسالة). ابدأ محادثة جديدة', { status: 400 });
}
```

## ⚠️ ملاحظة مهمة عن organizationId
السبب الرئيسي لجلب organizationId من DB بدل الـ frontend:
- المستخدم يمكنه تعديل body الطلب وإرسال organizationId لمنظمة أخرى
- هذا يكسر multi-tenancy — سيقرأ بيانات منظمة ليست له
- الحل: استخدم session.user.id + organizationSlug للتحقق من العضوية

## التحقق
- [ ] pnpm build ينجح
- [ ] افتح المساعد واسأل "كم مشروع عندي؟" — يجب أن يستخدم queryProjects ويرجع عدد فعلي
- [ ] اسأل "أعطني قائمة الفواتير" — يرجع فواتير فعلية
- [ ] اسأل "كيف أروح صفحة الفواتير؟" — يرجع رابط صحيح
- [ ] إذا ما فيه بيانات: يقول "لا توجد فواتير حالياً" بدل اختراع بيانات
- [ ] أخطاء الأدوات تُعالج بسلاسة (لا crash)

المرحلة الفرعية 3.3 — تمرير organizationId من الـ Frontend
## المهمة
تأكد أن AssistantPanel يمرر البيانات اللازمة للـ API Route، وأن الـ context يحتوي كل ما يحتاجه الـ backend.

## السياق
- في المرحلة 2.3 أضفنا useChat مع body.context
- الـ backend الآن يحتاج organizationSlug (وسيجلب organizationId بنفسه من DB)
- نحتاج التأكد أن كل البيانات تُمرر بشكل صحيح

## التعديلات المحتملة

### 1. تحقق من AssistantProvider
تأكد أنه يوفر:
- organizationSlug (من useParams)
- organizationName (من props)
- pageContext (من usePageContext)
- locale (من useLocale أو ما يعادلها)

### 2. تحقق من AssistantPanel
تأكد أن useChat body يحتوي:
```typescript
body: {
  context: {
    organizationSlug: assistant.organizationSlug,
    organizationName: assistant.organizationName,
    currentPage: assistant.pageContext.route,
    currentSection: assistant.pageContext.section,
    projectId: assistant.pageContext.projectId,
    projectName: assistant.pageContext.projectName,
    locale: locale,  // من useLocale()
  },
},
```

### 3. إذا projectName غير متوفر
- في المرحلة 1 عرّفنا projectName في PageContext
- لكن usePageContext يستخرج projectId من URL فقط — لا يعرف projectName
- خياران:
  (أ) الـ backend يجلب projectName من DB (الأبسط — أضفه في buildDynamicContext)
  (ب) مرره من layout المشروع عبر context إضافي
- **الخيار (أ) أبسط** — عدّل API route:
  إذا context.projectId موجود:
```typescript
  const project = await db.project.findFirst({
    where: { id: context.projectId, organizationId },
    select: { name: true, status: true, progress: true, contractValue: true }
  });
  // مرر للـ systemPrompt context
```

### 4. عدّل buildSystemPrompt في المرحلة 2.2
أضف projectName و projectStatus و projectProgress للـ AssistantContext
ليأتوا من الـ API route (جلبناهم في الخطوة 3 أعلاه)

## التحقق
- [ ] السياق يوصل كاملاً للـ backend (سجّل console.log في route.ts مؤقتاً)
- [ ] projectId يتغير عند التنقل بين المشاريع
- [ ] إذا المستخدم على صفحة المشروع، يعرف المساعد اسم المشروع
- [ ] إذا خارج مشروع، لا يحاول جلب بيانات مشروع

المرحلة الفرعية 3.4 — تنسيق الردود و Markdown Rendering
## المهمة
عدّل AssistantMessages ليعرض ردود المساعد بتنسيق Markdown (عناوين، قوائم، روابط، أرقام).

## السياق
- الآن المساعد يرجع ردود غنية تحتوي أرقام وقوائم وروابط
- حالياً AssistantMessages يعرض plain text فقط (من المرحلة 1.2)
- نحتاج Markdown rendering

## التعديلات

### 1. تثبيت مكتبة Markdown (إذا لم تكن موجودة)
```bash
# تحقق أولاً إذا react-markdown أو ما يشابه موجود
# ابحث في package.json:
grep -r "react-markdown\|remark\|rehype\|marked" apps/web/package.json

# إذا لا — ثبتها:
cd apps/web && pnpm add react-markdown
```

### 2. تعديل AssistantMessages.tsx
```typescript
// أضف import:
// import ReactMarkdown from 'react-markdown';  // أو بديل
//
// في عرض رسالة المساعد، بدل:
//   <p>{message.content}</p>
// استخدم:
//   <ReactMarkdown
//     components={{
//       // تخصيص عرض الروابط — تفتح في نفس التطبيق
//       a: ({ href, children }) => {
//         // إذا الرابط يبدأ بـ /app/ → تنقل داخلي
//         if (href?.startsWith('/app/')) {
//           return <button onClick={() => router.push(href)} className="text-blue-600 underline hover:text-blue-800">{children}</button>;
//         }
//         return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>;
//       },
//       // تنسيقات أساسية
//       p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
//       ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
//       ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
//       li: ({ children }) => <li className="text-sm">{children}</li>,
//       strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
//       h3: ({ children }) => <h3 className="font-bold text-sm mt-2 mb-1">{children}</h3>,
//       // code blocks
//       code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
//     }}
//   >
//     {message.content}
//   </ReactMarkdown>
//
// ملاحظة: استخدم useRouter من next/navigation للتنقل الداخلي
// import { useRouter } from 'next/navigation';
```

### 3. أضف Tool Call Loading Indicator
عندما Claude يستدعي أداة، useChat يمرر messages بحالة خاصة.
أضف مؤشر يوضح أن المساعد "يبحث في البيانات":
```typescript
// في AssistantMessages:
// تحقق من حالات الرسائل:
// - رسائل بـ role: 'assistant' مع toolInvocations → يعني يستدعي أداة
// - عرض: "🔍 يبحث في {toolName}..." مؤقتاً
//
// ابحث في @ai-sdk/react docs عن كيف يعرض tool calls في messages
// عادةً: message.toolInvocations array
//
// مثال:
// if (message.toolInvocations?.length && !message.content) {
//   return (
//     <div className="flex items-center gap-2 text-xs text-muted-foreground">
//       <Loader2 className="h-3 w-3 animate-spin" />
//       <span>يبحث في البيانات...</span>
//     </div>
//   );
// }
```

### 4. تنسيق الأرقام المالية
أضف helper لتنسيق الأرقام:
```typescript
// في ملف مساعد أو ضمن AssistantMessages
// أو الأفضل: أضف تعليمات في system prompt (المرحلة 2.2) ليستخدم Claude تنسيقاً محدداً
// مثلاً أضف في rules:
// "الأرقام المالية: استخدم فاصلة للآلاف ونقطة للكسور مع ر.س (مثال: 1,500,000.00 ر.س)"
// "الروابط: اكتبها بصيغة Markdown: [النص](/app/slug/path)"
```

## التحقق
- [ ] الردود تظهر بتنسيق Markdown (عناوين، قوائم، bold)
- [ ] الروابط قابلة للنقر وتنقل داخل التطبيق
- [ ] أثناء استدعاء الأدوات يظهر مؤشر "يبحث..."
- [ ] بعد انتهاء البحث يظهر الرد المنسق
- [ ] الأرقام المالية مقروءة (فواصل آلاف + عملة)
- [ ] RTL يعمل بشكل صحيح مع Markdown

ملخص الملفات في المرحلة 3
المرحلةملفات جديدةملفات معدّلة3.1packages/ai/tools/assistant-tools.ts—3.2—apps/web/app/api/ai/assistant/route.ts3.3—AssistantProvider.tsx (اختياري)، route.ts3.4—AssistantMessages.tsx، package.json (إذا أضفت react-markdown)
التحقق النهائي للمرحلة 3
- [ ] اسأل "كم مشروع عندي؟" → يرجع عدد فعلي من DB
- [ ] اسأل "أعطني ملخص مالي" → أرقام حقيقية (فواتير/مقبوضات/مصروفات)
- [ ] اسأل "هل عندي فواتير متأخرة؟" → يستعلم ويجاوب بالأرقام
- [ ] اسأل "كم موظف عندي؟" → عدد فعلي
- [ ] اسأل "وين أروح عشان أنشئ فاتورة؟" → رابط صحيح قابل للنقر
- [ ] وأنت في مشروع اسأل "هل فيه مشاكل مفتوحة؟" → يبحث في المشروع الحالي
- [ ] اسأل "كيف أنشئ تقرير يومي؟" → يجاوب من المعرفة + رابط التنقل
- [ ] المساعد لا يخترع بيانات — إذا ما فيه يقول "لا توجد بيانات"
- [ ] Streaming يعمل حتى مع tool calls
- [ ] الأمان: لا يمكن الوصول لبيانات منظمة أخرى
