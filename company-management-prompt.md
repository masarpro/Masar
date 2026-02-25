# برومبت إنشاء قسم المنشأة وإدارة الشركة — مسار
# Company Management Module — Complete Implementation Prompt

> **الوضع:** Plan Mode → ثم التنفيذ على مراحل
> **المشروع:** مسار (Masar) — منصة SaaS لإدارة المشاريع الإنشائية
> **المسار:** `D:\Masar\Masar\`

---

## السياق العام — اقرأ هذا أولاً

أنت تعمل على مشروع **مسار** — منصة SaaS لإدارة المشاريع الإنشائية تستهدف المقاولين الصغار والمتوسطين في السعودية. المشروع مبني على:

### التقنيات الأساسية
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS 4 + Shadcn UI + Radix UI
- **Backend:** oRPC 1.13.2 + Hono.js + Prisma 7.1.0 + PostgreSQL (Supabase)
- **Auth:** Better Auth 1.4.7 (cookie-based sessions)
- **State:** TanStack Query 5 + React Hook Form + Zod 4
- **i18n:** next-intl 4.5.3 (ar + en)
- **البنية:** Monorepo (pnpm + Turborepo)

### هيكل المشروع (المسارات المهمة)
```
apps/web/
├── app/(saas)/[locale]/app/[organizationSlug]/    ← صفحات المنظمة (هنا نضيف company/)
├── modules/saas/                                   ← الوحدات البرمجية
│   ├── finance/                                    ← وحدة المالية (مرجع للأنماط)
│   ├── projects/                                   ← وحدة المشاريع (مرجع للأنماط)
│   ├── shared/                                     ← مكونات مشتركة
│   └── [هنا نضيف company/]                         ← وحدة المنشأة الجديدة
│
packages/
├── api/                                            ← طبقة oRPC
│   ├── modules/                                    ← وحدات API
│   │   ├── finance/                                ← مرجع للأنماط
│   │   ├── projects/                               ← مرجع للأنماط
│   │   └── [هنا نضيف company/]                     ← API المنشأة
│   └── lib/                                        ← أدوات مساعدة
│
├── database/
│   └── prisma/schema.prisma                        ← الـ Schema (67 جدول حالياً)
│
└── i18n/
    └── messages/
        ├── ar.json                                 ← الترجمة العربية
        └── en.json                                 ← الترجمة الإنجليزية
```

### أسماء المسارات المختصرة (Path Aliases)
```
@repo/*       → packages/*
@shared/*     → apps/web/modules/shared/*
@saas/*       → apps/web/modules/saas/*
@ui/*         → apps/web/modules/ui/*
```

### الأنماط الموجودة التي يجب اتباعها

**نمط API (oRPC):**
```typescript
// packages/api/modules/[module]/[feature].ts
import { protectedProcedure } from "../../procedures";
import { z } from "zod";

export const featureRouter = {
  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input, ctx }) => {
      // التحقق من العضوية
      const member = await ctx.db.member.findFirst({
        where: { organizationId: input.organizationId, userId: ctx.user.id }
      });
      if (!member) throw new Error("Unauthorized");
      
      // الاستعلام مع فلتر organizationId دائماً
      return ctx.db.model.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { createdAt: "desc" }
      });
    }),
};
```

**نمط الصفحات (App Router):**
```
app/(saas)/[locale]/app/[organizationSlug]/[section]/page.tsx   ← صفحة القائمة
app/(saas)/[locale]/app/[organizationSlug]/[section]/new/page.tsx ← صفحة الإنشاء
app/(saas)/[locale]/app/[organizationSlug]/[section]/[id]/page.tsx ← صفحة التفاصيل
```

**نمط المكونات:**
```
modules/saas/[module]/
├── components/          ← المكونات الخاصة بالوحدة
├── hooks/              ← React hooks
├── lib/                ← منطق الأعمال والثوابت
└── types/              ← TypeScript types
```

**نمط الصلاحيات:**
```typescript
// التحقق من الصلاحيات عبر checkPermission
import { checkPermission } from "@saas/shared/lib/permissions";

// في المكون
const canView = checkPermission(userPermissions, "employees", "view");
const canCreate = checkPermission(userPermissions, "employees", "create");
```

**نمط الترجمة:**
```typescript
// في المكون
const t = useTranslations("company");
// في ملف الترجمة
{
  "company": {
    "title": "المنشأة",
    "dashboard": { ... },
    "expenses": { ... }
  }
}
```

### الصلاحيات الموجودة المرتبطة

في النظام الحالي، مجموعة صلاحيات `employees` موجودة بالفعل ولكن غير مُنفّذة:
```
employees.view     — عرض الموظفين
employees.create   — إضافة موظف
employees.edit     — تعديل بيانات موظف
employees.delete   — حذف موظف
employees.payroll  — إدارة الرواتب
employees.attendance — إدارة الحضور
```

نحتاج إضافة مجموعة صلاحيات جديدة `company`:
```
company.view       — عرض بيانات المنشأة
company.expenses   — إدارة المصاريف الثابتة
company.assets     — إدارة الأصول والمعدات
company.reports    — التقارير والملخصات
```

---

## الهدف من قسم المنشأة

المقاول الصغير يحتاج يجاوب على سؤال واحد: **"هل مشاريعي تغطي مصاريف شركتي الشهرية ولا لا؟"**

قسم المنشأة يوفر:
1. **نظرة شاملة** على تكاليف تشغيل الشركة (رواتب + إيجارات + فواتير + أقساط)
2. **ربط التكاليف بالمشاريع** لمعرفة ربحية كل مشروع الحقيقية
3. **سجل موظفين مبسّط** (بدون HR كامل) — الهدف فقط حساب الرواتب وتوزيعها
4. **إدارة أصول ومعدات** مع تتبع التكلفة الشهرية

### الهيكل المستهدف
```
/app/:org/company                    ← لوحة المعلومات (النظرة الشاملة)
/app/:org/company/expenses           ← المصاريف الثابتة
/app/:org/company/expenses/new       ← إضافة مصروف ثابت
/app/:org/company/expenses/:id       ← تفاصيل المصروف
/app/:org/company/expenses/:id/edit  ← تعديل المصروف
/app/:org/company/employees          ← سجل الموظفين
/app/:org/company/employees/new      ← إضافة موظف
/app/:org/company/employees/:id      ← تفاصيل الموظف
/app/:org/company/employees/:id/edit ← تعديل الموظف
/app/:org/company/assets             ← الأصول والمعدات
/app/:org/company/assets/new         ← إضافة أصل
/app/:org/company/assets/:id         ← تفاصيل الأصل
/app/:org/company/assets/:id/edit    ← تعديل الأصل
/app/:org/company/reports            ← التقارير والملخصات
```

---

# ════════════════════════════════════════
# المرحلة 1: قاعدة البيانات والبنية التحتية
# ════════════════════════════════════════

## المرحلة 1.1: إضافة الـ Enums للسكيما

**الملف:** `packages/database/prisma/schema.prisma`

أضف الـ Enums التالية في نهاية قسم الـ Enums الموجود (بعد آخر enum):

```prisma
// ════════ قسم المنشأة — Enums ════════

enum CompanyExpenseCategory {
  RENT              // إيجار
  UTILITIES         // كهرباء/ماء/إنترنت
  GOVERNMENT_FEES   // رسوم حكومية
  INSURANCE         // تأمينات
  SUBSCRIPTIONS     // اشتراكات وعقود
  MAINTENANCE       // صيانة مكتب/مستودع
  TRANSPORT         // مواصلات
  OFFICE_SUPPLIES   // مستلزمات مكتبية
  COMMUNICATION     // اتصالات
  LEGAL             // استشارات قانونية
  ACCOUNTING        // محاسبة خارجية
  OTHER             // أخرى
}

enum RecurrenceType {
  MONTHLY           // شهري
  QUARTERLY         // ربع سنوي
  SEMI_ANNUAL       // نصف سنوي
  YEARLY            // سنوي
  ONE_TIME          // مرة واحدة
}

enum AssetType {
  OWNED             // مملوك
  RENTED            // مستأجر
  LEASED            // تأجير تمويلي
}

enum AssetCategory {
  HEAVY_EQUIPMENT   // معدات ثقيلة (بوكلين، رافعة)
  LIGHT_EQUIPMENT   // معدات خفيفة (هزاز، قاطع)
  VEHICLE           // مركبة
  TOOL              // عُدّة يدوية
  OFFICE            // أثاث/معدات مكتبية
  SCAFFOLDING       // سقالات
  FORMWORK          // شدات خشبية/معدنية
  GENERATOR         // مولدات كهربائية
  OTHER             // أخرى
}

enum AssetStatus {
  AVAILABLE         // متاح
  IN_USE            // قيد الاستخدام (في مشروع)
  MAINTENANCE       // في الصيانة
  DISPOSED          // تم التخلص منه
}

enum EmployeeType {
  ADMIN             // إداري
  ENGINEER          // مهندس
  SUPERVISOR        // مشرف
  FOREMAN           // ملاحظ/رئيس عمال
  WORKER            // عامل
  DRIVER            // سائق
  TECHNICIAN        // فني
  ACCOUNTANT        // محاسب
  SECURITY          // حارس أمن
  OTHER             // أخرى
}

enum SalaryType {
  MONTHLY           // راتب شهري
  DAILY             // أجر يومي
}

enum EmployeeStatus {
  ACTIVE            // نشط
  SUSPENDED         // موقوف مؤقتاً
  TERMINATED        // منتهي الخدمة
}
```

---

## المرحلة 1.2: إضافة جداول قاعدة البيانات

**الملف:** `packages/database/prisma/schema.prisma`

أضف الجداول التالية بعد الـ Enums الجديدة:

```prisma
// ════════════════════════════════════════
// قسم المنشأة — الجداول
// ════════════════════════════════════════

// ──────── المصاريف الثابتة ────────

model CompanyExpense {
  id               String                  @id @default(cuid())
  organizationId   String
  name             String                  // "إيجار المكتب الرئيسي"
  nameEn           String?                 // "Main Office Rent" (اختياري)
  category         CompanyExpenseCategory
  amount           Decimal                 @db.Decimal(12, 2)
  recurrence       RecurrenceType
  startDate        DateTime                @db.Date
  endDate          DateTime?               @db.Date    // null = مستمر بدون نهاية
  isActive         Boolean                 @default(true)
  notes            String?
  vendorName       String?                 // اسم المورد/المؤجر
  contractNumber   String?                 // رقم العقد
  reminderDays     Int?                    @default(7) // تذكير قبل الاستحقاق بكم يوم

  // العلاقات
  organization     Organization            @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  payments         CompanyExpensePayment[]
  allocations      CompanyExpenseAllocation[]

  createdAt        DateTime                @default(now())
  updatedAt        DateTime                @updatedAt
  createdBy        String?

  @@index([organizationId])
  @@index([organizationId, category])
  @@index([organizationId, isActive])
}

// تسجيل الدفع الفعلي لكل فترة
model CompanyExpensePayment {
  id               String    @id @default(cuid())
  companyExpenseId  String
  amount           Decimal   @db.Decimal(12, 2)  // المبلغ الفعلي (قد يختلف عن المتوقع)
  periodDate       DateTime  @db.Date            // الشهر/الفترة (أول يوم من الشهر)
  paidAt           DateTime?                     // تاريخ الدفع الفعلي
  isPaid           Boolean   @default(false)
  notes            String?
  paymentMethod    PaymentMethod?                // طريقة الدفع (enum موجود بالفعل)
  bankAccountId    String?                       // ربط بالحساب البنكي

  // العلاقات
  expense          CompanyExpense @relation(fields: [companyExpenseId], references: [id], onDelete: Cascade)
  bankAccount      OrganizationBank? @relation(fields: [bankAccountId], references: [id])

  createdAt        DateTime       @default(now())

  @@unique([companyExpenseId, periodDate])
  @@index([companyExpenseId])
}

// توزيع المصروف على المشاريع (overhead allocation)
model CompanyExpenseAllocation {
  id               String  @id @default(cuid())
  companyExpenseId  String
  projectId        String
  allocationPct    Int     // نسبة التحميل (1-100)

  expense          CompanyExpense @relation(fields: [companyExpenseId], references: [id], onDelete: Cascade)
  project          Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([companyExpenseId, projectId])
  @@index([projectId])
}

// ──────── الموظفين (مبسّط — بدون HR) ────────

model Employee {
  id               String          @id @default(cuid())
  organizationId   String
  fullName         String
  fullNameEn       String?
  phone            String?
  idNumber         String?         // رقم الهوية/الإقامة
  nationality      String?         // الجنسية
  employeeType     EmployeeType
  salaryType       SalaryType
  salaryAmount     Decimal         @db.Decimal(12, 2)
  housingAllowance Decimal?        @db.Decimal(12, 2) // بدل سكن
  transportAllowance Decimal?      @db.Decimal(12, 2) // بدل مواصلات
  otherAllowances  Decimal?        @db.Decimal(12, 2) // بدلات أخرى
  gosiAmount       Decimal?        @db.Decimal(12, 2) // تأمينات اجتماعية (GOSI)
  status           EmployeeStatus  @default(ACTIVE)
  linkedUserId     String?         // ربط اختياري بحساب مستخدم في النظام
  joinDate         DateTime?       @db.Date
  terminationDate  DateTime?       @db.Date
  notes            String?
  jobTitle         String?         // المسمى الوظيفي الفعلي

  // العلاقات
  organization     Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  linkedUser       User?           @relation(fields: [linkedUserId], references: [id])
  projectAssignments EmployeeProjectAssignment[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  createdBy        String?

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, employeeType])
}

// تعيين الموظف على مشروع (لتوزيع تكلفة الراتب)
model EmployeeProjectAssignment {
  id            String    @id @default(cuid())
  employeeId    String
  projectId     String
  allocationPct Int       @default(100)  // نسبة من الراتب تُحمّل على المشروع
  startDate     DateTime  @default(now())
  endDate       DateTime? // null = لا يزال معيّن
  isActive      Boolean   @default(true)
  notes         String?

  employee      Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([employeeId])
  @@index([projectId])
  @@index([projectId, isActive])
}

// ──────── الأصول والمعدات ────────

model CompanyAsset {
  id               String         @id @default(cuid())
  organizationId   String
  name             String         // "بوكلين كوماتسو PC200"
  nameEn           String?
  assetCategory    AssetCategory
  assetType        AssetType      // مملوك/مستأجر/تأجير تمويلي
  serialNumber     String?        // رقم تسلسلي
  plateNumber      String?        // رقم اللوحة (للمركبات)
  monthlyCost      Decimal?       @db.Decimal(12, 2)  // قسط أو إيجار شهري
  purchaseValue    Decimal?       @db.Decimal(12, 2)  // قيمة الشراء
  purchaseDate     DateTime?      @db.Date
  warrantyExpiry   DateTime?      @db.Date
  insuranceExpiry  DateTime?      @db.Date
  status           AssetStatus    @default(AVAILABLE)
  currentProjectId String?        // المشروع الحالي (null = في المستودع)
  isActive         Boolean        @default(true)
  notes            String?

  // العلاقات
  organization     Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  currentProject   Project?       @relation(fields: [currentProjectId], references: [id])

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  createdBy        String?

  @@index([organizationId])
  @@index([organizationId, assetCategory])
  @@index([organizationId, status])
  @@index([currentProjectId])
}
```

**مهم جداً — تحديث العلاقات في الجداول الموجودة:**

أضف العلاقات التالية في الجداول الموجودة مسبقاً:

```prisma
// في model Organization — أضف:
  companyExpenses    CompanyExpense[]
  employees          Employee[]
  companyAssets      CompanyAsset[]

// في model Project — أضف:
  companyExpenseAllocations CompanyExpenseAllocation[]
  employeeAssignments      EmployeeProjectAssignment[]
  assignedAssets           CompanyAsset[]

// في model User — أضف (إذا لم تكن موجودة):
  linkedEmployee     Employee[]

// في model OrganizationBank — أضف:
  companyExpensePayments CompanyExpensePayment[]
```

---

## المرحلة 1.3: تشغيل Prisma Migration

```bash
cd packages/database
npx prisma migrate dev --name add_company_management
npx prisma generate
```

**تحقق من:**
- عدم وجود أخطاء في العلاقات
- توليد أنواع TypeScript بنجاح
- تطابق الـ enums مع الموجودة (مثل PaymentMethod)

---

## المرحلة 1.4: إضافة الصلاحيات

**الملف:** الملف الذي يحتوي على تعريف الصلاحيات (ابحث عن `permissions` أو `PERMISSION_GROUPS` في المشروع)

أضف مجموعة صلاحيات `company`:

```typescript
company: {
  view: boolean;       // عرض بيانات المنشأة ولوحة المعلومات
  expenses: boolean;   // إدارة المصاريف الثابتة (إضافة/تعديل/حذف)
  assets: boolean;     // إدارة الأصول والمعدات
  reports: boolean;    // عرض التقارير والملخصات الشهرية
}
```

**تحديث مصفوفة الصلاحيات الافتراضية:**

| الدور | company.view | company.expenses | company.assets | company.reports |
|-------|-------------|-----------------|----------------|----------------|
| المالك (OWNER) | ✅ | ✅ | ✅ | ✅ |
| مدير المشاريع (PM) | ✅ | ❌ | ✅ (عرض فقط) | ✅ |
| المحاسب (ACCOUNTANT) | ✅ | ✅ | ✅ | ✅ |
| المهندس (ENGINEER) | ❌ | ❌ | ❌ | ❌ |
| المشرف (SUPERVISOR) | ❌ | ❌ | ❌ | ❌ |

**وتحديث صلاحيات `employees` الموجودة لتعمل مع سجل الموظفين:**

| الدور | employees.view | employees.create | employees.edit | employees.delete | employees.payroll |
|-------|---------------|-----------------|----------------|-----------------|-------------------|
| المالك | ✅ | ✅ | ✅ | ✅ | ✅ |
| مدير المشاريع | ✅ | ❌ | ❌ | ❌ | ❌ |
| المحاسب | ✅ | ✅ | ✅ | ❌ | ✅ |
| المهندس | ❌ | ❌ | ❌ | ❌ | ❌ |
| المشرف | ❌ | ❌ | ❌ | ❌ | ❌ |

---

# ════════════════════════════════════════
# المرحلة 2: طبقة API (Backend)
# ════════════════════════════════════════

## المرحلة 2.1: إنشاء هيكل مجلد API

```
packages/api/modules/company/
├── index.ts                    ← تصدير الراوتر الرئيسي
├── employees.ts                ← CRUD الموظفين
├── employees-assignments.ts    ← تعيينات الموظفين على المشاريع
├── company-expenses.ts         ← CRUD المصاريف الثابتة
├── company-expense-payments.ts ← تسجيل الدفعات
├── company-expense-allocations.ts ← توزيع على المشاريع
├── company-assets.ts           ← CRUD الأصول والمعدات
├── company-dashboard.ts        ← إحصائيات لوحة المعلومات
└── company-reports.ts          ← التقارير والملخصات
```

---

## المرحلة 2.2: API الموظفين (`employees.ts`)

**الإجراءات المطلوبة:**

```typescript
employees.list          — قائمة الموظفين مع فلترة (حالة، نوع، مشروع)
employees.getById       — تفاصيل موظف واحد مع تعييناته
employees.create        — إضافة موظف جديد
employees.update        — تعديل بيانات موظف
employees.delete        — حذف موظف (soft delete → تغيير الحالة لـ TERMINATED)
employees.getSummary    — ملخص: عدد الموظفين، إجمالي الرواتب، توزيع حسب النوع
```

**قواعد مهمة:**
- كل استعلام يجب أن يفلتر بـ `organizationId`
- التحقق من العضوية (membership check) في كل إجراء
- التحقق من صلاحية `employees.view` للقراءة و `employees.create/edit/delete` للكتابة
- `employees.payroll` مطلوبة لعرض/تعديل الراتب والبدلات
- الحذف = تغيير `status` إلى `TERMINATED` + تعيين `terminationDate` (وليس حذف فعلي)
- عند الحذف: إلغاء تفعيل جميع تعيينات المشاريع النشطة

**Zod Schemas:**

```typescript
const createEmployeeSchema = z.object({
  organizationId: z.string(),
  fullName: z.string().min(2).max(100),
  fullNameEn: z.string().optional(),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  nationality: z.string().optional(),
  employeeType: z.nativeEnum(EmployeeType),
  salaryType: z.nativeEnum(SalaryType),
  salaryAmount: z.number().min(0),
  housingAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
  otherAllowances: z.number().min(0).optional(),
  gosiAmount: z.number().min(0).optional(),
  joinDate: z.string().optional(), // ISO date
  jobTitle: z.string().optional(),
  notes: z.string().optional(),
});

const listEmployeesSchema = z.object({
  organizationId: z.string(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  employeeType: z.nativeEnum(EmployeeType).optional(),
  projectId: z.string().optional(), // فلترة بالمشروع المعيّن عليه
  search: z.string().optional(),    // بحث بالاسم
});
```

---

## المرحلة 2.3: API تعيينات الموظفين (`employees-assignments.ts`)

```typescript
employeeAssignments.list        — تعيينات موظف أو مشروع
employeeAssignments.assign      — تعيين موظف على مشروع
employeeAssignments.update      — تعديل نسبة التحميل
employeeAssignments.remove      — إزالة التعيين (endDate = now, isActive = false)
employeeAssignments.byProject   — كل الموظفين المعيّنين على مشروع محدد
```

**قاعدة مهمة:** مجموع `allocationPct` لموظف واحد عبر كل مشاريعه النشطة يجب ألا يتجاوز 100%.

---

## المرحلة 2.4: API المصاريف الثابتة (`company-expenses.ts`)

```typescript
companyExpenses.list            — قائمة المصاريف مع فلترة (فئة، حالة، تكرار)
companyExpenses.getById         — تفاصيل مصروف مع دفعاته وتوزيعه
companyExpenses.create          — إضافة مصروف ثابت
companyExpenses.update          — تعديل مصروف
companyExpenses.delete          — حذف مصروف (soft delete → isActive = false)
companyExpenses.getSummary      — ملخص: إجمالي شهري، حسب الفئة
companyExpenses.getUpcoming     — المصاريف المستحقة قريباً (خلال 30 يوم)
```

**عند الإنشاء بتكرار شهري:** لا تُنشئ سجلات دفع مستقبلية تلقائياً. سجلات الدفع تُنشأ يدوياً أو عبر cron job شهري.

---

## المرحلة 2.5: API دفعات المصاريف (`company-expense-payments.ts`)

```typescript
companyExpensePayments.list           — قائمة الدفعات لمصروف محدد
companyExpensePayments.create         — تسجيل دفعة جديدة
companyExpensePayments.markPaid       — تأكيد الدفع (isPaid = true + paidAt)
companyExpensePayments.update         — تعديل دفعة
companyExpensePayments.delete         — حذف دفعة
companyExpensePayments.generateMonthly — توليد دفعات شهر محدد لكل المصاريف النشطة
```

---

## المرحلة 2.6: API توزيع المصاريف على المشاريع (`company-expense-allocations.ts`)

```typescript
companyExpenseAllocations.list       — توزيع مصروف محدد
companyExpenseAllocations.set        — تعيين/تعديل التوزيع (array of {projectId, pct})
companyExpenseAllocations.byProject  — كل المصاريف الموزّعة على مشروع
```

**قاعدة:** مجموع النسب لمصروف واحد لا يتجاوز 100%. الباقي يُعتبر "إداري غير موزّع".

---

## المرحلة 2.7: API الأصول والمعدات (`company-assets.ts`)

```typescript
companyAssets.list              — قائمة الأصول مع فلترة (فئة، نوع، حالة، مشروع)
companyAssets.getById           — تفاصيل أصل
companyAssets.create            — إضافة أصل
companyAssets.update            — تعديل أصل
companyAssets.delete            — حذف أصل (soft: isActive = false)
companyAssets.assignToProject   — تعيين أصل لمشروع
companyAssets.returnToWarehouse — إعادة الأصل للمستودع (currentProjectId = null)
companyAssets.getSummary        — ملخص: عدد، قيمة، تكلفة شهرية
companyAssets.getExpiringInsurance — أصول تأمينها ينتهي قريباً
```

---

## المرحلة 2.8: API لوحة المعلومات (`company-dashboard.ts`)

```typescript
companyDashboard.getOverview — البيانات الرئيسية:
  {
    // التكاليف الشهرية
    totalMonthlySalaries: number,      // إجمالي الرواتب
    totalMonthlyExpenses: number,      // إجمالي المصاريف الثابتة
    totalMonthlyAssetCosts: number,    // إجمالي أقساط/إيجارات الأصول
    totalMonthlyOverhead: number,      // المجموع الكلي
    
    // الدخل (من المشاريع — مستخلصات مدفوعة)
    totalMonthlyIncome: number,        // من ProjectClaim المدفوعة هذا الشهر
    
    // الفرق
    netResult: number,                 // ربح أو خسارة تشغيلية
    
    // إحصائيات
    activeEmployees: number,
    activeAssets: number,
    activeExpenses: number,
    upcomingPayments: number,          // دفعات مستحقة خلال 7 أيام
    
    // توزيع المصاريف حسب الفئة (للرسم البياني)
    expensesByCategory: { category: string, amount: number }[],
    
    // الاتجاه (آخر 6 أشهر)
    monthlyTrend: { month: string, expenses: number, income: number }[],
    
    // توزيع على المشاريع
    projectCosts: { projectId: string, projectName: string, directCost: number, overhead: number, income: number, net: number }[]
  }
```

---

## المرحلة 2.9: API التقارير (`company-reports.ts`)

```typescript
companyReports.monthlySummary   — ملخص شهر محدد (كل التفاصيل)
companyReports.projectProfitability — ربحية المشاريع (تكلفة حقيقية vs دخل)
companyReports.expensesTrend    — اتجاه المصاريف (6-12 شهر)
companyReports.employeeCosts    — تكاليف العمالة حسب المشروع/النوع
companyReports.exportMonthlyCsv — تصدير الملخص الشهري CSV
```

---

## المرحلة 2.10: تسجيل الراوتر في الـ API الرئيسي

**الملف:** `packages/api/modules/index.ts` (أو أينما تُسجّل الراوترات)

```typescript
import { companyRouter } from "./company";

// أضف في الراوتر الرئيسي:
company: companyRouter,
```

---

# ════════════════════════════════════════
# المرحلة 3: الواجهة الأمامية — البنية والتنقل
# ════════════════════════════════════════

## المرحلة 3.1: إنشاء هيكل مجلد الوحدة

```
apps/web/modules/saas/company/
├── components/
│   ├── company-sidebar-nav.tsx        ← التنقل الداخلي للقسم
│   ├── company-stats-cards.tsx        ← بطاقات الإحصائيات
│   ├── monthly-overview-chart.tsx     ← رسم بياني (مصاريف vs دخل)
│   ├── expense-category-chart.tsx     ← رسم بياني دائري
│   ├── project-costs-table.tsx        ← جدول توزيع التكاليف
│   │
│   ├── employees/
│   │   ├── employee-form.tsx          ← نموذج إضافة/تعديل
│   │   ├── employee-list.tsx          ← قائمة الموظفين
│   │   ├── employee-card.tsx          ← بطاقة موظف
│   │   ├── employee-assignments.tsx   ← تعيينات الموظف
│   │   └── employee-summary-cards.tsx ← ملخص الموظفين
│   │
│   ├── expenses/
│   │   ├── expense-form.tsx           ← نموذج إضافة/تعديل
│   │   ├── expense-list.tsx           ← قائمة المصاريف
│   │   ├── expense-payments.tsx       ← إدارة الدفعات
│   │   ├── expense-allocation.tsx     ← توزيع على المشاريع
│   │   └── upcoming-payments.tsx      ← المستحقات القادمة
│   │
│   ├── assets/
│   │   ├── asset-form.tsx             ← نموذج إضافة/تعديل
│   │   ├── asset-list.tsx             ← قائمة الأصول
│   │   ├── asset-card.tsx             ← بطاقة أصل
│   │   └── asset-summary-cards.tsx    ← ملخص الأصول
│   │
│   └── reports/
│       ├── monthly-report.tsx         ← التقرير الشهري
│       └── project-profitability.tsx  ← ربحية المشاريع
│
├── hooks/
│   ├── use-employees.ts               ← hooks الموظفين
│   ├── use-company-expenses.ts        ← hooks المصاريف
│   ├── use-company-assets.ts          ← hooks الأصول
│   └── use-company-dashboard.ts       ← hooks لوحة المعلومات
│
├── lib/
│   ├── constants.ts                   ← ثوابت (فئات، أيقونات، ألوان)
│   └── utils.ts                       ← دوال مساعدة (حسابات، تنسيق)
│
└── types/
    └── index.ts                       ← أنواع TypeScript
```

---

## المرحلة 3.2: إنشاء صفحات App Router

```
apps/web/app/(saas)/[locale]/app/[organizationSlug]/company/
├── layout.tsx                         ← Layout مع sidebar nav
├── page.tsx                           ← لوحة المعلومات الرئيسية
│
├── employees/
│   ├── page.tsx                       ← قائمة الموظفين
│   ├── new/
│   │   └── page.tsx                   ← إضافة موظف
│   └── [employeeId]/
│       ├── page.tsx                   ← تفاصيل الموظف
│       └── edit/
│           └── page.tsx               ← تعديل الموظف
│
├── expenses/
│   ├── page.tsx                       ← قائمة المصاريف
│   ├── new/
│   │   └── page.tsx                   ← إضافة مصروف
│   └── [expenseId]/
│       ├── page.tsx                   ← تفاصيل المصروف (مع الدفعات)
│       └── edit/
│           └── page.tsx               ← تعديل المصروف
│
├── assets/
│   ├── page.tsx                       ← قائمة الأصول
│   ├── new/
│   │   └── page.tsx                   ← إضافة أصل
│   └── [assetId]/
│       ├── page.tsx                   ← تفاصيل الأصل
│       └── edit/
│           └── page.tsx               ← تعديل الأصل
│
└── reports/
    └── page.tsx                       ← التقارير والملخصات
```

---

## المرحلة 3.3: إضافة التنقل في الشريط الجانبي

**الملف:** ابحث عن ملف navigation config (عادةً في `modules/saas/shared/` أو `config/`)

أضف عنصر المنشأة في الشريط الجانبي بعد "المالية" وقبل "الإعدادات":

```typescript
{
  title: t("company.title"), // "المنشأة"
  icon: Building2,           // من lucide-react
  href: `/${organizationSlug}/company`,
  permission: { group: "company", action: "view" },
  children: [
    { title: t("company.dashboard"), href: `/${organizationSlug}/company`, icon: LayoutDashboard },
    { title: t("company.employees.title"), href: `/${organizationSlug}/company/employees`, icon: Users },
    { title: t("company.expenses.title"), href: `/${organizationSlug}/company/expenses`, icon: Receipt },
    { title: t("company.assets.title"), href: `/${organizationSlug}/company/assets`, icon: Truck },
    { title: t("company.reports.title"), href: `/${organizationSlug}/company/reports`, icon: FileBarChart },
  ]
}
```

---

# ════════════════════════════════════════
# المرحلة 4: الواجهة الأمامية — الصفحات والمكونات
# ════════════════════════════════════════

## المرحلة 4.1: لوحة المعلومات الرئيسية (`/company`)

**الصفحة الأهم — يجب أن تكون غنية بالمعلومات وسهلة القراءة.**

**المحتوى:**
1. **صف بطاقات الإحصائيات** (4 بطاقات):
   - إجمالي الرواتب الشهرية (أيقونة: Users, لون: أزرق)
   - إجمالي المصاريف الثابتة (أيقونة: Receipt, لون: برتقالي)
   - إجمالي تكاليف الأصول (أيقونة: Truck, لون: بنفسجي)
   - صافي النتيجة — ربح/خسارة (أيقونة: TrendingUp/Down, لون: أخضر/أحمر)

2. **رسم بياني خطي** (Recharts): المصاريف vs الدخل — آخر 6 أشهر

3. **رسم بياني دائري**: توزيع المصاريف حسب الفئة

4. **جدول توزيع التكاليف على المشاريع:**
   | المشروع | تكلفة مباشرة | حصة الرواتب | حصة المصاريف | حصة الأصول | الإجمالي | الدخل | صافي |
   
5. **تنبيهات:**
   - دفعات مستحقة خلال 7 أيام
   - تأمين معدات ينتهي قريباً
   - موظفين بدون تعيين على مشروع

**أسلوب التصميم:** اتبع نفس أسلوب لوحة المعلومات الرئيسية (`/app/:org` dashboard) — Glassmorphic cards, RTL, ألوان متناسقة.

---

## المرحلة 4.2: صفحات الموظفين

### صفحة القائمة (`/company/employees`)
- **شريط أدوات:** زر "إضافة موظف" + فلتر (حالة، نوع) + بحث
- **بطاقات ملخص:** عدد الموظفين النشطين، إجمالي الرواتب الشهرية، متوسط الراتب
- **الجدول:**
  | الاسم | النوع | الراتب | الحالة | المشروع الحالي | إجراءات |
- **دعم الحالات الفارغة:** رسالة تشجيعية + زر إضافة أول موظف

### نموذج الإضافة/التعديل (`/company/employees/new` و `/edit`)
- **React Hook Form + Zod validation**
- **الحقول:**
  - المعلومات الأساسية: الاسم (عربي + إنجليزي اختياري)، الجوال، الهوية، الجنسية
  - الوظيفة: النوع (EmployeeType)، المسمى الوظيفي، تاريخ الانضمام
  - المالي: نوع الراتب (شهري/يومي)، المبلغ، بدل سكن، بدل مواصلات، بدلات أخرى، تأمينات GOSI
  - ملاحظات
- **عند الحفظ:** عرض toast نجاح + العودة للقائمة

### صفحة التفاصيل (`/company/employees/:id`)
- **بطاقة معلومات الموظف** (الأساسية + المالية)
- **تعيينات المشاريع:** قائمة المشاريع المعيّن عليها مع النسبة
  - زر "تعيين على مشروع" → Dialog/Sheet مع اختيار المشروع + النسبة
  - زر "إزالة" لكل تعيين
- **ملخص مالي:** إجمالي التكلفة الشهرية (راتب + بدلات + GOSI)
- **أزرار:** تعديل، تعطيل/تفعيل، حذف (مع تأكيد)

---

## المرحلة 4.3: صفحات المصاريف الثابتة

### صفحة القائمة (`/company/expenses`)
- **شريط أدوات:** زر "إضافة مصروف" + فلتر (فئة، تكرار، حالة)
- **بطاقات ملخص:** إجمالي المصاريف الشهرية، عدد المصاريف النشطة، المستحق هذا الشهر
- **الجدول:**
  | الاسم | الفئة | المبلغ | التكرار | المورد | حالة آخر دفعة | إجراءات |
- **Tabs أو فلتر سريع:** الكل / شهري / ربع سنوي / سنوي

### نموذج الإضافة/التعديل
- **الحقول:**
  - الاسم (عربي + إنجليزي)
  - الفئة (CompanyExpenseCategory)
  - المبلغ
  - نوع التكرار (RecurrenceType)
  - تاريخ البدء / تاريخ الانتهاء (اختياري)
  - اسم المورد/المؤجر
  - رقم العقد
  - تذكير قبل الاستحقاق (بالأيام)
  - ملاحظات

### صفحة التفاصيل (`/company/expenses/:id`)
- **بطاقة معلومات المصروف**
- **سجل الدفعات:** جدول بكل الدفعات (الشهرية)
  - زر "تسجيل دفعة" لكل فترة غير مدفوعة
  - حالة: مدفوع ✅ / غير مدفوع ⏳ / متأخر 🔴
- **توزيع على المشاريع:**
  - واجهة لتوزيع النسب على المشاريع
  - Slider أو حقول نسبة لكل مشروع
  - عرض المجموع (يجب ≤ 100%)
  - الباقي = "إداري غير موزّع"

---

## المرحلة 4.4: صفحات الأصول والمعدات

### صفحة القائمة (`/company/assets`)
- **شريط أدوات:** زر "إضافة أصل" + فلتر (فئة، نوع ملكية، حالة، مشروع)
- **بطاقات ملخص:** عدد الأصول، القيمة الإجمالية، التكلفة الشهرية
- **عرض:** جدول أو بطاقات (toggle)
  | الاسم | الفئة | النوع | التكلفة الشهرية | المشروع الحالي | الحالة | إجراءات |

### نموذج الإضافة/التعديل
- **الحقول:**
  - الاسم (عربي + إنجليزي)
  - الفئة (AssetCategory) + نوع الملكية (AssetType)
  - الرقم التسلسلي / رقم اللوحة
  - التكلفة الشهرية (قسط/إيجار)
  - قيمة الشراء + تاريخ الشراء
  - تاريخ انتهاء الضمان + تاريخ انتهاء التأمين
  - المشروع الحالي (اختياري — dropdown من مشاريع المنظمة)
  - ملاحظات

### صفحة التفاصيل (`/company/assets/:id`)
- **بطاقة معلومات الأصل**
- **زر "نقل لمشروع"** → Dialog لاختيار المشروع
- **زر "إعادة للمستودع"**
- **تنبيهات:** تأمين ينتهي قريباً، ضمان منتهي

---

## المرحلة 4.5: صفحة التقارير (`/company/reports`)

- **اختيار الشهر/الفترة** (month picker)
- **الملخص الشهري المطبوع:**

```
╔══════════════════════════════════════════════╗
║        ملخص مصاريف شهر يناير 2026          ║
╠══════════════════════════════════════════════╣
║ البند                │  المبلغ              ║
╠──────────────────────┼──────────────────────╣
║ رواتب وعمالة         │  85,000 ر.س          ║
║ إيجارات              │  15,000 ر.س          ║
║ فواتير خدمات         │   4,500 ر.س          ║
║ أقساط معدات          │   8,000 ر.س          ║
║ رسوم حكومية          │   2,000 ر.س          ║
║ تأمينات              │   1,000 ر.س          ║
╠──────────────────────┼──────────────────────╣
║ الإجمالي             │ 115,500 ر.س          ║
╠══════════════════════════════════════════════╣
║                                              ║
║ التوزيع على المشاريع:                       ║
║   مشروع فلل الرياض  │  65,000 (56%)        ║
║   مشروع مستودع جدة  │  35,000 (30%)        ║
║   غير موزّع (إداري)  │  15,500 (14%)        ║
╚══════════════════════════════════════════════╝
```

- **جدول ربحية المشاريع:**
  | المشروع | المصاريف المباشرة | حصة Overhead | إجمالي التكلفة | الدخل (مستخلصات) | صافي الربح | الهامش % |

- **زر تصدير CSV** للملخص الشهري

---

# ════════════════════════════════════════
# المرحلة 5: الترجمة (i18n)
# ════════════════════════════════════════

## المرحلة 5.1: إضافة مفاتيح الترجمة العربية

**الملف:** `packages/i18n/messages/ar.json`

```json
{
  "company": {
    "title": "المنشأة",
    "description": "إدارة مصاريف وموارد الشركة",
    
    "dashboard": {
      "title": "نظرة عامة",
      "totalSalaries": "إجمالي الرواتب",
      "totalExpenses": "المصاريف الثابتة",
      "totalAssetCosts": "تكاليف الأصول",
      "netResult": "صافي النتيجة",
      "profit": "ربح تشغيلي",
      "loss": "خسارة تشغيلية",
      "monthlyTrend": "الاتجاه الشهري",
      "expensesByCategory": "المصاريف حسب الفئة",
      "projectCosts": "توزيع التكاليف على المشاريع",
      "upcomingPayments": "دفعات مستحقة قريباً",
      "noData": "لا توجد بيانات بعد. ابدأ بإضافة الموظفين والمصاريف.",
      "expensesVsIncome": "المصاريف مقابل الدخل",
      "last6Months": "آخر 6 أشهر"
    },
    
    "employees": {
      "title": "الموظفين",
      "add": "إضافة موظف",
      "edit": "تعديل الموظف",
      "details": "تفاصيل الموظف",
      "fullName": "الاسم الكامل",
      "fullNameEn": "الاسم بالإنجليزية",
      "phone": "رقم الجوال",
      "idNumber": "رقم الهوية/الإقامة",
      "nationality": "الجنسية",
      "employeeType": "نوع الموظف",
      "jobTitle": "المسمى الوظيفي",
      "salaryType": "نوع الراتب",
      "salaryAmount": "الراتب الأساسي",
      "housingAllowance": "بدل السكن",
      "transportAllowance": "بدل المواصلات",
      "otherAllowances": "بدلات أخرى",
      "gosiAmount": "التأمينات الاجتماعية (GOSI)",
      "totalMonthlyCost": "إجمالي التكلفة الشهرية",
      "joinDate": "تاريخ الانضمام",
      "status": "الحالة",
      "notes": "ملاحظات",
      "assignments": "التعيينات على المشاريع",
      "assignToProject": "تعيين على مشروع",
      "allocationPct": "نسبة التحميل",
      "noAssignments": "لم يتم تعيين الموظف على أي مشروع",
      "confirmDelete": "هل أنت متأكد من إنهاء خدمة هذا الموظف؟",
      "emptyState": "لا يوجد موظفين مسجلين بعد",
      "emptyStateAction": "سجّل أول موظف لتتبع الرواتب",
      "summary": {
        "activeCount": "موظفين نشطين",
        "totalSalaries": "إجمالي الرواتب",
        "averageSalary": "متوسط الراتب"
      },
      "types": {
        "ADMIN": "إداري",
        "ENGINEER": "مهندس",
        "SUPERVISOR": "مشرف",
        "FOREMAN": "ملاحظ",
        "WORKER": "عامل",
        "DRIVER": "سائق",
        "TECHNICIAN": "فني",
        "ACCOUNTANT": "محاسب",
        "SECURITY": "حارس أمن",
        "OTHER": "أخرى"
      },
      "statuses": {
        "ACTIVE": "نشط",
        "SUSPENDED": "موقوف",
        "TERMINATED": "منتهي الخدمة"
      },
      "salaryTypes": {
        "MONTHLY": "شهري",
        "DAILY": "يومي"
      }
    },
    
    "expenses": {
      "title": "المصاريف الثابتة",
      "add": "إضافة مصروف",
      "edit": "تعديل المصروف",
      "details": "تفاصيل المصروف",
      "name": "اسم المصروف",
      "category": "الفئة",
      "amount": "المبلغ",
      "recurrence": "التكرار",
      "startDate": "تاريخ البدء",
      "endDate": "تاريخ الانتهاء",
      "ongoing": "مستمر",
      "vendorName": "المورد/المؤجر",
      "contractNumber": "رقم العقد",
      "reminderDays": "التذكير قبل (أيام)",
      "payments": "سجل الدفعات",
      "recordPayment": "تسجيل دفعة",
      "paid": "مدفوع",
      "unpaid": "غير مدفوع",
      "overdue": "متأخر",
      "allocation": "التوزيع على المشاريع",
      "unallocated": "غير موزّع (إداري)",
      "emptyState": "لا توجد مصاريف ثابتة مسجلة",
      "emptyStateAction": "سجّل مصاريف شركتك الشهرية",
      "categories": {
        "RENT": "إيجار",
        "UTILITIES": "كهرباء/ماء/إنترنت",
        "GOVERNMENT_FEES": "رسوم حكومية",
        "INSURANCE": "تأمينات",
        "SUBSCRIPTIONS": "اشتراكات وعقود",
        "MAINTENANCE": "صيانة",
        "TRANSPORT": "مواصلات",
        "OFFICE_SUPPLIES": "مستلزمات مكتبية",
        "COMMUNICATION": "اتصالات",
        "LEGAL": "استشارات قانونية",
        "ACCOUNTING": "محاسبة خارجية",
        "OTHER": "أخرى"
      },
      "recurrenceTypes": {
        "MONTHLY": "شهري",
        "QUARTERLY": "ربع سنوي",
        "SEMI_ANNUAL": "نصف سنوي",
        "YEARLY": "سنوي",
        "ONE_TIME": "مرة واحدة"
      }
    },
    
    "assets": {
      "title": "الأصول والمعدات",
      "add": "إضافة أصل",
      "edit": "تعديل الأصل",
      "details": "تفاصيل الأصل",
      "name": "اسم الأصل",
      "assetCategory": "الفئة",
      "assetType": "نوع الملكية",
      "serialNumber": "الرقم التسلسلي",
      "plateNumber": "رقم اللوحة",
      "monthlyCost": "التكلفة الشهرية",
      "purchaseValue": "قيمة الشراء",
      "purchaseDate": "تاريخ الشراء",
      "warrantyExpiry": "انتهاء الضمان",
      "insuranceExpiry": "انتهاء التأمين",
      "currentProject": "المشروع الحالي",
      "warehouse": "في المستودع",
      "assignToProject": "نقل لمشروع",
      "returnToWarehouse": "إعادة للمستودع",
      "emptyState": "لا توجد أصول مسجلة",
      "emptyStateAction": "سجّل معدات ومركبات شركتك",
      "categories": {
        "HEAVY_EQUIPMENT": "معدات ثقيلة",
        "LIGHT_EQUIPMENT": "معدات خفيفة",
        "VEHICLE": "مركبة",
        "TOOL": "عُدّة",
        "OFFICE": "أثاث/معدات مكتبية",
        "SCAFFOLDING": "سقالات",
        "FORMWORK": "شدات",
        "GENERATOR": "مولد كهربائي",
        "OTHER": "أخرى"
      },
      "types": {
        "OWNED": "مملوك",
        "RENTED": "مستأجر",
        "LEASED": "تأجير تمويلي"
      },
      "statuses": {
        "AVAILABLE": "متاح",
        "IN_USE": "قيد الاستخدام",
        "MAINTENANCE": "في الصيانة",
        "DISPOSED": "تم التخلص منه"
      }
    },
    
    "reports": {
      "title": "التقارير",
      "monthlySummary": "الملخص الشهري",
      "projectProfitability": "ربحية المشاريع",
      "selectMonth": "اختر الشهر",
      "export": "تصدير CSV",
      "directCost": "تكلفة مباشرة",
      "overheadShare": "حصة Overhead",
      "totalCost": "إجمالي التكلفة",
      "income": "الدخل",
      "netProfit": "صافي الربح",
      "margin": "الهامش"
    }
  }
}
```

---

## المرحلة 5.2: إضافة مفاتيح الترجمة الإنجليزية

**الملف:** `packages/i18n/messages/en.json`

نفس الهيكل أعلاه مترجم للإنجليزية بالكامل. (اطلب مني التفصيل إذا احتجت.)

---

# ════════════════════════════════════════
# المرحلة 6: التكامل والربط
# ════════════════════════════════════════

## المرحلة 6.1: ربط تكاليف المنشأة بالمشاريع

**المبدأ:**
```
تكلفة المشروع الحقيقية = 
  ProjectExpense (مصاريف مباشرة)
  + حصته من رواتب الموظفين المعيّنين (EmployeeProjectAssignment)
  + حصته من المصاريف الثابتة (CompanyExpenseAllocation)
  + تكلفة الأصول المعيّنة عليه (CompanyAsset.monthlyCost where currentProjectId)

ربحية المشروع = 
  ProjectClaim (المستخلصات المدفوعة) - تكلفة المشروع الحقيقية
```

**أضف في API مالية المشروع (`projectFinance.getSummary`):**
- حقول جديدة: `overheadSalaries`, `overheadExpenses`, `overheadAssets`, `totalTrueCost`, `trueProfit`
- هذه تُحسب من بيانات المنشأة

**أضف في لوحة معلومات المشروع:**
- بطاقة "التكلفة الحقيقية" تعرض المصاريف المباشرة + الـ Overhead
- تحذير إذا تجاوزت التكلفة الحقيقية الدخل المتوقع

---

## المرحلة 6.2: ربط مع لوحة المعلومات الرئيسية

**في dashboard الرئيسي (`/app/:org`):**
- أضف بطاقة "مصاريف المنشأة الشهرية" → رابط لـ `/company`
- أضف في الرسم البياني المالي خط "تكاليف الشركة" إذا وجدت بيانات

---

## المرحلة 6.3: التنبيهات الذكية

أضف أنواع تنبيهات جديدة في نظام `ProjectAlert` أو نظام منفصل:

```typescript
// إضافة في AlertType enum:
UPCOMING_COMPANY_PAYMENT    // دفعة مصروف ثابت مستحقة قريباً
EXPIRING_ASSET_INSURANCE    // تأمين أصل ينتهي
UNASSIGNED_EMPLOYEES        // موظفين نشطين بدون تعيين على مشروع
SALARY_EXCEEDS_INCOME       // الرواتب تتجاوز الدخل الشهري
```

---

# ════════════════════════════════════════
# المرحلة 7: التحسينات والجودة
# ════════════════════════════════════════

## المرحلة 7.1: التحقق من الصلاحيات

- كل صفحة تتحقق من الصلاحية المناسبة قبل العرض
- إخفاء أزرار الإجراءات (إضافة/تعديل/حذف) إذا لم يملك المستخدم الصلاحية
- كل API endpoint يتحقق من الصلاحية في الـ procedure

## المرحلة 7.2: الحالات الفارغة (Empty States)

- كل قائمة لها حالة فارغة جميلة مع رسالة تشجيعية وزر إضافة
- أيقونات مناسبة (Building2, Users, Receipt, Truck)

## المرحلة 7.3: Loading States

- استخدام Skeleton components أثناء تحميل البيانات
- اتبع نفس أنماط الـ Loading الموجودة في المشروع

## المرحلة 7.4: التأكيدات

- حذف موظف → Dialog تأكيد مع تحذير بإلغاء التعيينات
- حذف مصروف → Dialog تأكيد مع تحذير بحذف الدفعات
- حذف أصل → Dialog تأكيد

## المرحلة 7.5: RTL والتصميم

- جميع المكونات تدعم RTL بشكل كامل
- الأرقام بالعربية في الواجهة العربية
- تنسيق العملة: `XX,XXX ر.س`
- التواريخ: تنسيق عربي (مثل: 15 يناير 2026)

## المرحلة 7.6: الأداء

- استخدام `useSuspenseQuery` مع `prefetch` حيث أمكن
- تحميل بيانات لوحة المعلومات مرة واحدة (استعلام واحد مُجمّع)
- استخدام `select` في Prisma لجلب الحقول المطلوبة فقط

---

# ════════════════════════════════════════
# ملخص ترتيب التنفيذ
# ════════════════════════════════════════

```
المرحلة 1: قاعدة البيانات والبنية التحتية
  1.1 → Enums
  1.2 → الجداول + العلاقات
  1.3 → Migration
  1.4 → الصلاحيات

المرحلة 2: طبقة API
  2.1 → هيكل المجلد
  2.2 → API الموظفين
  2.3 → API التعيينات
  2.4 → API المصاريف
  2.5 → API الدفعات
  2.6 → API التوزيع
  2.7 → API الأصول
  2.8 → API لوحة المعلومات
  2.9 → API التقارير
  2.10 → التسجيل في الراوتر

المرحلة 3: الواجهة — البنية
  3.1 → هيكل المجلد
  3.2 → صفحات App Router
  3.3 → التنقل في الشريط الجانبي

المرحلة 4: الواجهة — الصفحات
  4.1 → لوحة المعلومات
  4.2 → صفحات الموظفين
  4.3 → صفحات المصاريف
  4.4 → صفحات الأصول
  4.5 → صفحة التقارير

المرحلة 5: الترجمة
  5.1 → العربية
  5.2 → الإنجليزية

المرحلة 6: التكامل
  6.1 → ربط بالمشاريع
  6.2 → ربط بلوحة المعلومات الرئيسية
  6.3 → التنبيهات

المرحلة 7: الجودة
  7.1 → الصلاحيات
  7.2 → الحالات الفارغة
  7.3 → Loading
  7.4 → التأكيدات
  7.5 → RTL
  7.6 → الأداء
```

---

# تعليمات مهمة لكلود كود

1. **قبل أي تعديل:** اقرأ الملفات الموجودة في نفس النمط (مثلاً اقرأ `finance/` أو `projects/` لفهم النمط المتبع)
2. **لا تكرر الكود:** استخدم المكونات المشتركة الموجودة في `@saas/shared/`
3. **حافظ على نفس الأسلوب:** تسمية الملفات، هيكل المكونات، أنماط Tailwind
4. **التحقق من organizationId:** في كل استعلام API بدون استثناء
5. **العلاقات:** تأكد من عدم كسر العلاقات الموجودة عند إضافة الجديدة
6. **الـ Imports:** استخدم Path Aliases (`@repo/`, `@saas/`, `@shared/`, `@ui/`)
7. **بعد كل مرحلة:** شغّل `pnpm build` للتأكد من عدم وجود أخطاء TypeScript
