# برومبت 1: بناء الـ Endpoints المفقودة والميزات الأساسية — منصة مسار

> **ملاحظة:** هذا البرومبت مقسّم إلى 8 مراحل. نفّذ كل مرحلة بالترتيب.
> استخدم Plan Mode أولاً قبل كل مرحلة.
> **هام:** قبل البدء بأي مرحلة، اقرأ الملفات المرجعية المذكورة فيها.

---

## المرحلة 1: تقرير ربحية المشروع (Project Profitability Report)

### السياق
هذا أهم تقرير مالي مفقود. يجيب على السؤال الأساسي للمقاول: "كم ربحت من هذا المشروع؟"
المنصة عندها كل البيانات اللازمة — تحتاج فقط تجميعها في endpoint واحد.

### الملفات المرجعية — اقرأها أولاً
- `packages/api/modules/finance/` — كل ملفات الوحدة المالية (خصوصاً reports/)
- `packages/api/modules/project-finance/` — مالية المشروع (getSummary)
- `packages/api/modules/project-payments/` — مدفوعات المشروع
- `packages/api/modules/subcontracts/` — عقود الباطن ومدفوعاتها
- `packages/api/modules/company/` — مصروفات الشركة (allocations)
- `packages/database/prisma/schema.prisma` — ابحث عن models: FinanceInvoice, FinanceExpense, ProjectClaim, SubcontractContract, SubcontractPayment, ProjectPayment, CompanyExpenseAllocation

### المطلوب

#### 1.1 إنشاء endpoint التقرير

**الملف:** `packages/api/modules/finance/reports/profitability.ts`

**Procedure:** `subscriptionProcedure`
**Permission:** `finance.reports`
**Rate Limit:** `READ`

**Input Schema:**
```typescript
z.object({
  projectId: z.string().cuid(),               // مطلوب
  dateFrom: z.string().datetime().optional(),  // فلترة بالفترة (اختياري)
  dateTo: z.string().datetime().optional(),
})
```

**الحسابات المطلوبة:**

```
الإيرادات (Revenue):
├── قيمة العقد الأساسي (contract value)
├── أوامر التغيير المعتمدة (approved change orders amounts)
├── إجمالي قيمة العقد = الأساسي + أوامر التغيير
├── الفواتير المُصدرة (issued invoices total) — من FinanceInvoice WHERE projectId
├── المبالغ المحصّلة فعلاً (collected payments) — من ProjectPayment WHERE projectId
├── المبالغ المستحقة (outstanding = invoiced - collected)
└── نسبة التحصيل (collection rate = collected / invoiced × 100)

التكاليف (Costs):
├── مصروفات المشروع المباشرة — من FinanceExpense WHERE projectId
│   ├── مصنّفة بالفئة (category breakdown)
│   └── إجمالي المصروفات المباشرة
├── مدفوعات مقاولي الباطن — من SubcontractPayment عبر SubcontractContract WHERE projectId
│   ├── إجمالي قيم عقود الباطن
│   ├── إجمالي المدفوع لمقاولي الباطن
│   └── المتبقي لمقاولي الباطن
├── تكاليف العمالة — من CompanyExpenseAllocation WHERE projectId (نوع SALARY)
├── مصروفات الشركة المُوزّعة — من CompanyExpenseAllocation WHERE projectId (أنواع أخرى)
└── إجمالي التكاليف = مباشرة + مقاولين + عمالة + مُوزّعة

الربحية (Profitability):
├── إجمالي الربح = إجمالي قيمة العقد - إجمالي التكاليف
├── نسبة الربح = (إجمالي الربح / إجمالي قيمة العقد) × 100
├── الربح المُحقّق = المبالغ المحصّلة - التكاليف المدفوعة فعلاً
└── هامش الربح المتوقع vs الفعلي

الاحتفاظ (Retention):
├── نسبة الاحتفاز من العقد
├── مبلغ الاحتفاظ الإجمالي
└── مبلغ الاحتفاظ المُحرّر
```

**Output:** أرجع كل هذه الأرقام في object واحد مع breakdown arrays.

**ملاحظات مهمة:**
- استخدم `Prisma.Decimal` لكل الحسابات — لا تحوّل لـ `Number()` إلا في النهاية
- أضف `organizationId` في كل `where` clause (multi-tenant isolation)
- استخدم `verifyProjectAccess()` للتحقق من صلاحية الوصول

#### 1.2 تسجيل الـ endpoint في الراوتر

عدّل `packages/api/modules/finance/` لإضافة `reports.profitability` في الراوتر.
اتبع نمط الـ reports الموجودة (revenueByPeriod, revenueByProject, etc.).

#### 1.3 إنشاء صفحة Frontend

**الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[id]/finance/profitability/page.tsx`

الصفحة تعرض:
- 3 بطاقات KPI كبيرة أعلى الصفحة: إجمالي الإيرادات, إجمالي التكاليف, صافي الربح (مع نسبة)
- جدول تفصيلي للإيرادات (العقد, أوامر التغيير, الفواتير, التحصيل)
- جدول تفصيلي للتكاليف (مصنّف بالفئة)
- شريط تقدم للتحصيل (collected vs outstanding)
- **لا تستخدم Recharts** — الأرقام والجداول كافية. إذا أردت chart بسيط، استخدم `dynamic(() => import(...))` 

**i18n:** أضف مفاتيح في `ar.json` و `en.json` تحت `finance.profitability.*`

### معايير النجاح
- [ ] Endpoint يرجع كل أرقام الربحية بشكل صحيح
- [ ] الحسابات تستخدم Decimal precision
- [ ] الصفحة تعرض البيانات بشكل واضح
- [ ] `pnpm type-check` و `pnpm build` يمران

---

## المرحلة 2: تقرير التدفقات النقدية (Cash Flow Report)

### السياق
ثاني أهم تقرير مالي. يجيب على: "كم عندي كاش فعلاً؟ ومتى أتوقع يدخل/يطلع فلوس؟"

### الملفات المرجعية
- نفس ملفات المرحلة 1 + `packages/api/modules/finance/banks/` (الحسابات البنكية)

### المطلوب

#### 2.1 إنشاء endpoint التدفقات النقدية

**الملف:** `packages/api/modules/finance/reports/cash-flow.ts`

**Input:**
```typescript
z.object({
  organizationId: z.string().cuid(),          // على مستوى المنظمة (كل المشاريع)
  projectId: z.string().cuid().optional(),     // اختياري — لمشروع محدد
  periodType: z.enum(["weekly", "monthly"]),   // تجميع أسبوعي أو شهري
  dateFrom: z.string().datetime(),             // بداية الفترة
  dateTo: z.string().datetime(),               // نهاية الفترة
})
```

**الحسابات المطلوبة:**

```
لكل فترة (أسبوع أو شهر):

التدفقات الداخلة (Inflows):
├── مدفوعات مُستلمة من العملاء — ProjectPayment WHERE type = RECEIVED
├── مبالغ محصّلة من فواتير — FinanceInvoice payments
└── إجمالي الداخل

التدفقات الخارجة (Outflows):
├── مصروفات مشاريع مدفوعة — FinanceExpense WHERE status = PAID
├── مدفوعات مقاولي باطن — SubcontractPayment
├── رواتب (إذا معتمدة) — PayrollRun WHERE status = APPROVED/PAID
├── مصروفات شركة مدفوعة — CompanyExpense WHERE status = PAID
└── إجمالي الخارج

صافي التدفق = الداخل - الخارج
الرصيد التراكمي = الرصيد السابق + صافي التدفق

المستحقات المتوقعة (Projected):
├── فواتير مُصدرة غير محصّلة — بحسب dueDate
├── مصروفات مستحقة غير مدفوعة — بحسب dueDate
└── رواتب الشهر القادم — بحسب آخر payroll
```

**Output:**
```typescript
{
  periods: [
    {
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
      inflows: { clientPayments: Decimal, invoicePayments: Decimal, total: Decimal },
      outflows: { projectExpenses: Decimal, subcontractPayments: Decimal, payroll: Decimal, companyExpenses: Decimal, total: Decimal },
      netFlow: Decimal,
      cumulativeBalance: Decimal,
    },
    // ...
  ],
  summary: {
    totalInflows: Decimal,
    totalOutflows: Decimal,
    netCashFlow: Decimal,
    openingBalance: Decimal,  // من أرصدة البنوك
    closingBalance: Decimal,
  },
  projected: {
    expectedInflows: Decimal,   // فواتير مستحقة
    expectedOutflows: Decimal,  // مصروفات مستحقة
    projectedBalance: Decimal,
  }
}
```

#### 2.2 صفحة Frontend

**المسار:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/finance/reports/cash-flow/page.tsx`

- فلتر علوي: الفترة (شهري/أسبوعي) + تاريخ البداية والنهاية + مشروع محدد (اختياري)
- 3 بطاقات: إجمالي الداخل, إجمالي الخارج, صافي التدفق
- جدول الفترات مع أعمدة: الفترة, الداخل, الخارج, الصافي, الرصيد التراكمي
- قسم "المتوقع" يعرض المستحقات القادمة

### معايير النجاح
- [ ] Endpoint يرجع التدفقات مُجمّعة بالفترة
- [ ] يدعم الفلترة بمشروع محدد أو كل المنظمة
- [ ] الرصيد التراكمي يُحسب بشكل صحيح
- [ ] صفحة واضحة مع فلاتر

---

## المرحلة 3: أرشفة المشاريع بدل الحذف

### السياق
حالياً حذف مشروع يعمل Cascade Delete ويمسح كل البيانات المالية. هذا خطير جداً. المطلوب:
1. منع الحذف الفعلي إذا فيه بيانات مالية
2. تحسين الأرشفة كبديل آمن

### الملفات المرجعية
- `packages/api/modules/projects/` — كل ملفات الوحدة
- `packages/database/prisma/schema.prisma` — ابحث عن model Project (الحالات: ACTIVE, ON_HOLD, COMPLETED, ARCHIVED)

### المطلوب

#### 3.1 إنشاء endpoint أرشفة مخصص

**الملف:** `packages/api/modules/projects/archive.ts`

```typescript
// projects.archive
// Procedure: subscriptionProcedure
// Permission: projects.delete (أو projects.edit)
// Input: { projectId: string }

// Logic:
// 1. verifyProjectAccess(projectId, 'projects.delete')
// 2. تحقق أن المشروع ليس مؤرشف مسبقاً
// 3. غيّر الحالة إلى ARCHIVED
// 4. سجّل في audit log: "مشروع تم أرشفته"
// 5. أرجع المشروع المُحدّث
```

#### 3.2 إنشاء endpoint استعادة من الأرشيف

```typescript
// projects.restore
// يُرجع المشروع من ARCHIVED إلى ACTIVE
// نفس الصلاحيات
```

#### 3.3 تعديل endpoint الحذف

عدّل `projects.delete` ليمنع الحذف الفعلي إذا:
```typescript
// قبل الحذف، تحقق:
const hasFinancialData = await prisma.$transaction([
  prisma.financeExpense.count({ where: { projectId } }),
  prisma.projectClaim.count({ where: { projectId } }),
  prisma.subcontractContract.count({ where: { projectId } }),
  prisma.financeInvoice.count({ where: { projectId } }),
  prisma.projectPayment.count({ where: { projectId } }),
]);

const totalRecords = hasFinancialData.reduce((sum, count) => sum + count, 0);

if (totalRecords > 0) {
  throw new ORPCError({
    code: "BAD_REQUEST",
    message: "لا يمكن حذف مشروع يحتوي على بيانات مالية. استخدم الأرشفة بدلاً من ذلك.",
  });
}

// إذا لا يوجد بيانات مالية → سمح بالحذف الفعلي (مشروع فارغ)
```

#### 3.4 تحديث الـ Frontend

في صفحة المشروع أو قائمة المشاريع:
- أضف زر "أرشفة" بدلاً من (أو بجانب) "حذف"
- في dialog الحذف → إذا فيه بيانات مالية، أظهر رسالة تنصح بالأرشفة
- أضف فلتر في قائمة المشاريع: "إظهار المؤرشفة"
- المشاريع المؤرشفة تظهر بلون مختلف (مثلاً opacity-60) مع badge "مؤرشف"

#### 3.5 مفاتيح الترجمة

```json
{
  "projects.archive": "أرشفة المشروع / Archive Project",
  "projects.restore": "استعادة المشروع / Restore Project",
  "projects.archiveConfirm": "هل أنت متأكد من أرشفة هذا المشروع؟ يمكنك استعادته لاحقاً.",
  "projects.cannotDelete": "لا يمكن حذف هذا المشروع لأنه يحتوي على بيانات مالية. يمكنك أرشفته بدلاً من ذلك.",
  "projects.archived": "مؤرشف / Archived",
  "projects.showArchived": "إظهار المؤرشفة / Show Archived"
}
```

### معايير النجاح
- [ ] أرشفة المشروع تعمل (status → ARCHIVED)
- [ ] استعادة المشروع تعمل (ARCHIVED → ACTIVE)
- [ ] حذف مشروع بـ بيانات مالية يُرفض مع رسالة واضحة
- [ ] حذف مشروع فارغ يعمل عادي
- [ ] UI يعكس التغييرات

---

## المرحلة 4: سجل تغييرات الموظف (Employee Change History)

### السياق
حالياً لو تغيّر راتب موظف أو حالته أو قسمه، ما فيه سجل يوثّق التغيير. المطلوب إنشاء audit trail للتغييرات المهمة.

### الملفات المرجعية
- `packages/api/modules/company/` — employees endpoints
- `packages/database/prisma/schema.prisma` — ابحث عن model Employee

### المطلوب

#### 4.1 إضافة model جديد في الـ Schema

أضف في `schema.prisma`:

```prisma
model EmployeeChangeLog {
  id             String   @id @default(cuid())
  employeeId     String
  employee       Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  changedBy      String   // userId اللي عمل التغيير
  changeType     EmployeeChangeType
  fieldName      String   // اسم الحقل المتغيّر (salary, status, department, position, etc.)
  oldValue       String?  // القيمة القديمة (كـ string)
  newValue       String?  // القيمة الجديدة (كـ string)
  notes          String?  // ملاحظات اختيارية
  
  createdAt      DateTime @default(now())
  
  @@index([employeeId, createdAt])
  @@index([organizationId, employeeId])
}

enum EmployeeChangeType {
  SALARY_CHANGE       // تغيير راتب
  STATUS_CHANGE       // تغيير حالة (ACTIVE, TERMINATED, etc.)
  POSITION_CHANGE     // تغيير المسمى الوظيفي
  DEPARTMENT_CHANGE   // تغيير القسم
  ASSIGNMENT_CHANGE   // تغيير تعيين المشروع
  INFO_UPDATE         // تحديث بيانات عامة
}
```

بعد التعديل، شغّل:
```bash
pnpm --filter database db:push
```

#### 4.2 إنشاء helper function لتسجيل التغييرات

**الملف:** `packages/api/modules/company/lib/log-employee-change.ts`

```typescript
// هذه الدالة تُستدعى من داخل handlers الموظفين
// تقارن old values مع new values وتُسجّل الفروقات

type LogEmployeeChangeParams = {
  prisma: PrismaClient;
  employeeId: string;
  organizationId: string;
  changedBy: string; // userId
  oldData: Partial<Employee>;
  newData: Partial<Employee>;
  notes?: string;
};

export async function logEmployeeChanges(params: LogEmployeeChangeParams) {
  const { prisma, employeeId, organizationId, changedBy, oldData, newData, notes } = params;
  
  const changes: Array<{
    changeType: EmployeeChangeType;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }> = [];

  // قارن الحقول المهمة:
  if (oldData.salary?.toString() !== newData.salary?.toString()) {
    changes.push({
      changeType: "SALARY_CHANGE",
      fieldName: "salary",
      oldValue: oldData.salary?.toString() ?? null,
      newValue: newData.salary?.toString() ?? null,
    });
  }
  
  if (oldData.status !== newData.status) {
    changes.push({
      changeType: "STATUS_CHANGE",
      fieldName: "status",
      oldValue: oldData.status ?? null,
      newValue: newData.status ?? null,
    });
  }

  if (oldData.position !== newData.position) {
    changes.push({
      changeType: "POSITION_CHANGE",
      fieldName: "position",
      oldValue: oldData.position ?? null,
      newValue: newData.position ?? null,
    });
  }

  if (oldData.department !== newData.department) {
    changes.push({
      changeType: "DEPARTMENT_CHANGE",
      fieldName: "department",
      oldValue: oldData.department ?? null,
      newValue: newData.department ?? null,
    });
  }

  // أضف حقول أخرى حسب الموجود في Employee model...

  // سجّل كل التغييرات دفعة واحدة
  if (changes.length > 0) {
    await prisma.employeeChangeLog.createMany({
      data: changes.map(change => ({
        employeeId,
        organizationId,
        changedBy,
        notes,
        ...change,
      })),
    });
  }
}
```

#### 4.3 تعديل handler تحديث الموظف

في `packages/api/modules/company/employees/update.ts` (أو الملف المعادل):

```typescript
// قبل التحديث — احفظ البيانات القديمة:
const oldEmployee = await prisma.employee.findUnique({ where: { id: input.employeeId } });

// نفّذ التحديث (الكود الحالي)
const updatedEmployee = await prisma.employee.update({ ... });

// بعد التحديث — سجّل التغييرات:
await logEmployeeChanges({
  prisma,
  employeeId: input.employeeId,
  organizationId: context.session.activeOrganizationId,
  changedBy: context.user.id,
  oldData: oldEmployee,
  newData: updatedEmployee,
});
```

#### 4.4 إنشاء endpoint قراءة السجل

```typescript
// company.employees.history
// Procedure: subscriptionProcedure
// Permission: employees.view
// Input: { employeeId: string, page?: number, pageSize?: number }
// Output: { changes: EmployeeChangeLog[], total: number }
// ترتيب: createdAt DESC (الأحدث أولاً)
```

#### 4.5 عرض السجل في صفحة الموظف

في صفحة تفاصيل الموظف (`/company/employees/[id]`):
- أضف tab أو قسم "سجل التغييرات"
- جدول بسيط: التاريخ, نوع التغيير, الحقل, القيمة القديمة, القيمة الجديدة, بواسطة

### معايير النجاح
- [ ] Schema محدّث مع EmployeeChangeLog
- [ ] تحديث موظف يسجّل التغييرات تلقائياً
- [ ] endpoint history يرجع السجل مع pagination
- [ ] صفحة الموظف تعرض السجل

---

## المرحلة 5: تفضيلات الإشعارات (Notification Preferences)

### الملفات المرجعية
- `packages/api/modules/notifications/`
- `packages/database/prisma/schema.prisma` — ابحث عن Notification model

### المطلوب

#### 5.1 إضافة model التفضيلات

```prisma
model NotificationPreference {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // لكل نوع إشعار → قنوات مفعّلة
  approvalRequested    NotificationChannel[] @default([IN_APP, EMAIL])
  approvalDecided      NotificationChannel[] @default([IN_APP])
  documentCreated      NotificationChannel[] @default([IN_APP])
  dailyReportCreated   NotificationChannel[] @default([IN_APP])
  issueCreated         NotificationChannel[] @default([IN_APP])
  issueCritical        NotificationChannel[] @default([IN_APP, EMAIL])
  expenseCreated       NotificationChannel[] @default([IN_APP])
  claimCreated         NotificationChannel[] @default([IN_APP])
  claimStatusChanged   NotificationChannel[] @default([IN_APP])
  changeOrderCreated   NotificationChannel[] @default([IN_APP])
  ownerMessage         NotificationChannel[] @default([IN_APP])
  teamMemberAdded      NotificationChannel[] @default([IN_APP])
  
  // إعدادات عامة
  emailDigest          Boolean @default(false) // ملخص يومي بدل إشعار فوري
  muteAll              Boolean @default(false) // كتم كل الإشعارات
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, organizationId])
}

enum NotificationChannel {
  IN_APP
  EMAIL
  // PUSH  // مستقبلاً
}
```

#### 5.2 Endpoints

```typescript
// notifications.preferences.get
// → يرجع تفضيلات المستخدم (أو الافتراضية إذا ما فيه)

// notifications.preferences.update
// → يحدّث تفضيلات محددة
// Input: Partial<NotificationPreference fields>
```

#### 5.3 تعديل نظام الإشعارات الحالي

ابحث عن المكان اللي يُنشئ الإشعارات (عادةً helper function أو في كل handler):
```typescript
// قبل إنشاء الإشعار → تحقق من تفضيلات المستلم:
const prefs = await prisma.notificationPreference.findUnique({
  where: { userId_organizationId: { userId: recipientId, organizationId } },
});

// إذا muteAll → لا تُنشئ الإشعار
// إذا القناة مُعطّلة لهذا النوع → لا تُرسل عبرها
// مثال: إذا issueCreated لا يشمل EMAIL → أنشئ IN_APP فقط
```

#### 5.4 صفحة الإعدادات

**المسار:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/notifications/page.tsx`

- جدول: كل نوع إشعار × القنوات (IN_APP, EMAIL)
- كل خلية فيها toggle (switch)
- زر "كتم الكل" في الأعلى
- زر "إعادة للافتراضي"

### معايير النجاح
- [ ] Model محدّث
- [ ] Endpoints get/update تعمل
- [ ] نظام الإشعارات يحترم التفضيلات
- [ ] صفحة إعدادات واضحة

---

## المرحلة 6: إصدارات المستندات (Document Versioning)

### السياق
حالياً رفع ملف جديد بنفس الاسم يستبدل القديم. المطلوب نظام إصدارات بسيط.

### الملفات المرجعية
- `packages/api/modules/project-documents/`
- `packages/storage/` — S3 operations

### المطلوب

#### 6.1 إضافة model الإصدارات

```prisma
model DocumentVersion {
  id          String   @id @default(cuid())
  documentId  String
  document    ProjectDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  versionNumber  Int       // 1, 2, 3...
  fileName       String
  fileSize       Int
  fileType       String
  storagePath    String    // المسار في S3
  uploadedBy     String    // userId
  changeNotes    String?   // ملاحظات التغيير
  
  createdAt   DateTime @default(now())
  
  @@index([documentId, versionNumber])
  @@unique([documentId, versionNumber])
}
```

عدّل `ProjectDocument` لإضافة:
```prisma
model ProjectDocument {
  // ... الحقول الموجودة
  currentVersion  Int @default(1)
  versions        DocumentVersion[]
}
```

#### 6.2 تعديل رفع المستند

عند رفع إصدار جديد لمستند موجود:
```typescript
// 1. لا تحذف الملف القديم من S3
// 2. ارفع الملف الجديد بمسار مختلف: {orgId}/{projectId}/documents/{docId}/v{version}/{filename}
// 3. أنشئ DocumentVersion جديد
// 4. حدّث currentVersion في ProjectDocument
```

#### 6.3 Endpoints جديدة

```typescript
// project-documents.listVersions → قائمة إصدارات مستند (documentId)
// project-documents.getVersionDownloadUrl → رابط تحميل إصدار محدد
// project-documents.revertToVersion → إرجاع لإصدار سابق (يُنشئ إصدار جديد بنسخة من القديم)
```

#### 6.4 UI

في صفحة تفاصيل المستند:
- أضف tab "الإصدارات"
- قائمة الإصدارات: رقم الإصدار, تاريخ الرفع, بواسطة, ملاحظات, زر تحميل
- عند رفع إصدار جديد → dialog يطلب "ملاحظات التغيير" (اختياري)

---

## المرحلة 7: إدارة إجازات الموظفين (Employee Leave Management)

### السياق
وحدة الموظفين مكتملة إلا إدارة الإجازات. هذي ميزة أساسية لأي نظام HR.

### المطلوب

#### 7.1 إضافة Models

```prisma
model LeaveType {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  name           String   // إجازة سنوية, مرضية, بدون راتب, etc.
  nameEn         String?
  daysPerYear    Int      // الرصيد السنوي الافتراضي
  isPaid         Boolean  @default(true)
  requiresApproval Boolean @default(true)
  color          String?  // لعرض في التقويم
  
  leaves         LeaveRequest[]
  balances       LeaveBalance[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([organizationId, name])
}

model LeaveBalance {
  id             String   @id @default(cuid())
  employeeId     String
  employee       Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  leaveTypeId    String
  leaveType      LeaveType @relation(fields: [leaveTypeId], references: [id], onDelete: Cascade)
  
  year           Int      // السنة الهجرية أو الميلادية
  totalDays      Int      // الرصيد الكلي
  usedDays       Int      @default(0)
  remainingDays  Int      // محسوب: total - used
  
  @@unique([employeeId, leaveTypeId, year])
}

model LeaveRequest {
  id             String   @id @default(cuid())
  employeeId     String
  employee       Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  leaveTypeId    String
  leaveType      LeaveType @relation(fields: [leaveTypeId], references: [id], onDelete: Cascade)
  
  startDate      DateTime
  endDate        DateTime
  totalDays      Int      // محسوب: عدد أيام العمل بين startDate و endDate
  reason         String?
  status         LeaveStatus @default(PENDING)
  
  approvedBy     String?  // userId
  approvedAt     DateTime?
  rejectionReason String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([organizationId, employeeId, status])
  @@index([organizationId, startDate, endDate])
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

#### 7.2 Endpoints

```typescript
// company.leaves.types.list → أنواع الإجازات
// company.leaves.types.create → إنشاء نوع (مع default أنواع سعودية)
// company.leaves.types.update → تعديل
// company.leaves.types.delete → حذف

// company.leaves.balances.list → أرصدة موظف أو كل الموظفين
// company.leaves.balances.adjust → تعديل رصيد يدوي

// company.leaves.requests.list → طلبات الإجازات (مع فلاتر: status, employee, dateRange)
// company.leaves.requests.create → تقديم طلب إجازة
// company.leaves.requests.approve → اعتماد
// company.leaves.requests.reject → رفض مع سبب
// company.leaves.requests.cancel → إلغاء (من الموظف نفسه)

// company.leaves.dashboard → ملخص: من في إجازة اليوم, طلبات معلّقة, أرصدة منخفضة
```

#### 7.3 أنواع إجازات افتراضية (سعودية)

عند إنشاء منظمة جديدة، أضف أنواع إجازات افتراضية:
```
1. إجازة سنوية — 21 يوم (ترتفع لـ 30 بعد 5 سنوات) — مدفوعة
2. إجازة مرضية — 30 يوم مدفوع + 60 يوم 75% — مدفوعة
3. إجازة زواج — 5 أيام — مدفوعة
4. إجازة وفاة قريب — 5 أيام — مدفوعة
5. إجازة أمومة — 70 يوم — مدفوعة
6. إجازة أبوة — 3 أيام — مدفوعة
7. إجازة حج — 10 أيام (مرة واحدة) — مدفوعة
8. إجازة بدون راتب — 0 — غير مدفوعة
```

#### 7.4 صفحات Frontend

- `/company/leaves` — لوحة تحكم الإجازات (من في إجازة, طلبات معلّقة)
- `/company/leaves/requests` — قائمة الطلبات مع فلاتر
- `/company/leaves/balances` — أرصدة الموظفين
- `/company/leaves/types` — إدارة أنواع الإجازات

---

## المرحلة 8: استيراد من Excel للكميات والمشاريع

### السياق
المقاولين يستخدمون Excel بكثرة. استيراد البيانات يُسهّل الانتقال لمسار.

### المطلوب

#### 8.1 تثبيت مكتبة معالجة Excel

```bash
pnpm --filter @repo/api add xlsx
pnpm --filter @repo/api add -D @types/xlsx
```

أو استخدم `exceljs` إذا تبي TypeScript support أفضل:
```bash
pnpm --filter @repo/api add exceljs
```

#### 8.2 Endpoint استيراد المشاريع

**الملف:** `packages/api/modules/projects/import.ts`

```typescript
// projects.importFromExcel
// Procedure: subscriptionProcedure
// Permission: projects.create
// Input: { fileUrl: string } — رابط ملف Excel المرفوع عبر S3

// Logic:
// 1. حمّل الملف من S3
// 2. اقرأ الـ sheet الأول
// 3. توقّع الأعمدة: اسم المشروع, النوع, تاريخ البداية, تاريخ النهاية, قيمة العقد, العميل
// 4. تحقق من البيانات (Zod validation لكل صف)
// 5. أنشئ المشاريع دفعة واحدة (createMany أو loop مع error collection)
// 6. أرجع: { imported: number, errors: Array<{ row: number, message: string }> }
```

**قالب Excel:**
أنشئ template Excel يقدر المستخدم يحمّله ويعبّيه:

| اسم المشروع | النوع | تاريخ البداية | تاريخ النهاية | قيمة العقد | اسم العميل |
|---|---|---|---|---|---|
| فيلا الرياض | RESIDENTIAL | 2025-01-01 | 2025-12-31 | 500000 | أحمد محمد |

#### 8.3 Endpoint استيراد بنود الكميات

**الملف:** `packages/api/modules/quantities/import.ts`

```typescript
// quantities.importFromExcel
// Input: { studyId: string, section: "structural"|"finishing"|"mep"|"labor", fileUrl: string }

// الأعمدة المتوقعة حسب القسم:
// structural: رقم البند, الوصف, الوحدة, الكمية, سعر الوحدة
// finishing: رقم البند, الوصف, المساحة/الكمية, الوحدة, سعر الوحدة
// mep: رقم البند, النظام, الوصف, الوحدة, الكمية, سعر الوحدة
// labor: المسمى, العدد, الراتب الشهري, المدة (أشهر)
```

#### 8.4 Endpoint تحميل القالب

```typescript
// exports.downloadImportTemplate
// Input: { type: "projects" | "quantities-structural" | "quantities-finishing" | ... }
// Output: { downloadUrl: string }
// يُنشئ ملف Excel فارغ مع headers صحيحة ويرجع رابط تحميل
```

#### 8.5 UI

- في قائمة المشاريع → زر "استيراد من Excel"
- في صفحة دراسة الكميات → زر "استيراد بنود من Excel"
- كلاهما يفتح dialog:
  1. رابط تحميل القالب
  2. منطقة رفع الملف (drag & drop)
  3. عرض نتيجة المعالجة (عدد المستورد + أخطاء الصفوف)

---

## ملخص المراحل

| المرحلة | الميزة | الأولوية | الوقت التقديري |
|---------|--------|---------|---------------|
| 1 | تقرير ربحية المشروع | 🔴 عالية | 4-5 ساعات |
| 2 | تقرير التدفقات النقدية | 🔴 عالية | 4-5 ساعات |
| 3 | أرشفة المشاريع | 🔴 عالية | 2-3 ساعات |
| 4 | سجل تغييرات الموظف | 🟠 متوسطة | 3-4 ساعات |
| 5 | تفضيلات الإشعارات | 🟠 متوسطة | 3-4 ساعات |
| 6 | إصدارات المستندات | 🟠 متوسطة | 3-4 ساعات |
| 7 | إدارة إجازات الموظفين | 🟠 متوسطة | 5-6 ساعات |
| 8 | استيراد من Excel | 🟡 عادية | 4-5 ساعات |
| **المجموع** | | | **~28-36 ساعة** |

---

## تعليمات عامة

1. **استخدم Plan Mode** قبل كل مرحلة
2. **اقرأ الملفات المرجعية** قبل كتابة أي كود
3. **اتبع الأنماط الموجودة:** `subscriptionProcedure`, `verifyProjectAccess`, `organizationId` isolation, Zod schemas, ORPCError
4. **كل model جديد** يحتاج `@@index` على الأعمدة المستخدمة في queries
5. **كل endpoint جديد** يُسجّل في الراوتر (`router.ts`) ويتبع نمط الوحدة
6. **كل صفحة جديدة** تحتاج مفاتيح ترجمة في `ar.json` و `en.json`
7. **شغّل بعد كل مرحلة:** `pnpm --filter database db:push` ثم `pnpm type-check` ثم `pnpm build`
8. **اكتب ≤800 سطر لكل عملية كتابة**
9. **Decimal precision** — كل حقل مالي يستخدم `Prisma.Decimal` وما يتحول لـ `Number()` إلا عند الإرجاع النهائي

---

## ملاحظة: الميزات المؤجّلة (تحتاج برومبت منفصل)

الميزات التالية أعقد بكثير وتحتاج تخطيط وبرومبتات مخصصة:

| الميزة | السبب | التقدير |
|--------|-------|---------|
| **Gantt Chart تفاعلي** | يحتاج مكتبة متخصصة (dhtmlx-gantt أو frappe-gantt) + تكامل معقد مع drag-drop والتبعيات والـ critical path. يحتاج برومبت مخصص يركّز على اختيار المكتبة والتكامل مع `project-execution` module. | أسبوع+ |
| **Push Notifications (FCM)** | يحتاج: إنشاء Firebase project, Service Worker, Web Push API, backend integration لإرسال عبر FCM, إدارة tokens لكل جهاز. | 5 أيام |
| **GPS Tagging للصور** | يحتاج: browser Geolocation API في Frontend, حفظ coordinates مع الصورة, خريطة عرض. الجزء الأكبر frontend. | 2-3 أيام |
| **Offline Mode** | أعقد ميزة — يحتاج: Service Worker, IndexedDB cache, sync strategy, conflict resolution. يُنصح بتأجيلها لتطبيق Mobile (React Native). | شهر+ |
| **OCR** | يحتاج خدمة خارجية (Google Vision API أو Tesseract). يحتاج برومبت مخصص لاختيار الخدمة والتكامل. | 3-5 أيام |
