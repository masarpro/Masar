# المرحلة 3 — "القوائم المالية" — برومبت تنفيذي لـ Claude Code

## نظرة عامة

هذه المرحلة تبني فوق المرحلة 2 (دليل الحسابات + القيود التلقائية) وتُنتج المخرجات التي يحتاجها المحاسب فعلياً: القوائم المالية الرسمية + أدوات التسوية والإقفال.

**المتطلب المسبق:** المرحلة 2 مكتملة — نماذج `Account`, `JournalEntry`, `JournalEntryLine` موجودة، دليل الحسابات يعمل، القيود التلقائية تُولّد.

**مقسّم إلى 5 مراحل فرعية:**
1. ميزان المراجعة (Trial Balance) — التقرير الأساسي
2. قائمة الدخل التفصيلية (Detailed Income Statement)
3. الميزانية العمومية (Balance Sheet)
4. قيود التسوية والقيود اليدوية المتقدمة (Adjusting Entries)
5. إقفال الفترات المحاسبية (Period Closing)

---
---
---

# المرحلة الفرعية 1/5: ميزان المراجعة (Trial Balance)

## الهدف
ميزان المراجعة هو أول تقرير يطلبه أي محاسب — يعرض كل الحسابات بأرصدتها المدينة والدائنة ويتحقق أنها متساوية. هو "فحص صحة" للدفاتر قبل إنتاج القوائم المالية.

## ⛔ القائمة الحمراء — ملفات لا تلمسها أبداً
- `structural-calculations.ts`
- `derivation-engine.ts`
- `packages/api/modules/quantities/**`
- لا تعدّل أي procedure مالي موجود (فواتير، مصروفات، مقبوضات)
- لا تعدّل schema.prisma في هذه المرحلة

## التعليمات

### الخطوة 1: قراءة الملفات

```
اقرأ هذه الملفات بالكامل قبل أي شيء:
1. packages/database/prisma/queries/accounting.ts — الملف الذي أنشأناه في المرحلة 2 (دليل الحسابات + القيود)
2. packages/api/modules/accounting/router.ts — الراوتر المحاسبي من المرحلة 2
3. packages/api/modules/accounting/procedures/ — كل الـ procedures الحالية
4. apps/web/app/[locale]/app/[slug]/finance/accounting-reports/ — صفحة التقارير المحاسبية (من المرحلة 1 إذا موجودة)
5. apps/web/modules/saas/finance/components/reports/ — تصميم التقارير المالية الحالية كمرجع
```

### الخطوة 2: استعلام ميزان المراجعة

في `packages/database/prisma/queries/accounting.ts`، أضف:

```typescript
// ========================================
// ميزان المراجعة (Trial Balance)
// ========================================

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  level: number;
  parentCode: string | null;
  
  // حركة الفترة
  periodDebit: Prisma.Decimal;     // مجموع المدين خلال الفترة
  periodCredit: Prisma.Decimal;    // مجموع الدائن خلال الفترة
  
  // الرصيد
  debitBalance: Prisma.Decimal;    // رصيد مدين (إذا المجموع مدين)
  creditBalance: Prisma.Decimal;   // رصيد دائن (إذا المجموع دائن)
  
  // معلومات إضافية
  transactionCount: number;        // عدد القيود على هذا الحساب
  isSystem: boolean;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totals: {
    totalPeriodDebit: Prisma.Decimal;
    totalPeriodCredit: Prisma.Decimal;
    totalDebitBalance: Prisma.Decimal;
    totalCreditBalance: Prisma.Decimal;
  };
  isBalanced: boolean;             // totalDebitBalance === totalCreditBalance
  difference: Prisma.Decimal;     // الفرق (يجب أن يكون 0)
  asOfDate: Date;
  periodFrom: Date | null;        // إذا محدد فترة
  accountCount: number;            // عدد الحسابات التي عليها حركة
  generatedAt: Date;
}

export async function getTrialBalance(
  db: PrismaClient,
  organizationId: string,
  options: {
    asOfDate: Date;
    dateFrom?: Date;           // بداية الفترة (اختياري — للحركة)
    includeZeroBalance?: boolean;  // عرض الحسابات بدون حركة؟ (default: false)
    level?: number;             // تصفية حسب المستوى (1=رئيسي, 2=فرعي, 3=تفصيلي, 4=تحليلي)
    accountType?: AccountType;  // تصفية حسب نوع الحساب
  }
): Promise<TrialBalanceResult> {
  // الاستعلام:
  // 1. جلب كل الحسابات isPostable = true (أو includeZeroBalance = true → كل الحسابات)
  // 2. لكل حساب: مجموع المدين ومجموع الدائن من JournalEntryLine
  //    حيث:
  //      - journalEntry.organizationId = organizationId
  //      - journalEntry.status = 'POSTED'
  //      - journalEntry.date <= asOfDate
  //      - إذا dateFrom محدد: journalEntry.date >= dateFrom
  //
  // 3. حساب الرصيد:
  //    netAmount = مجموع المدين - مجموع الدائن
  //    إذا netAmount > 0 → debitBalance = netAmount, creditBalance = 0
  //    إذا netAmount < 0 → debitBalance = 0, creditBalance = |netAmount|
  //    إذا netAmount = 0 → كلاهما 0
  //
  // 4. الحسابات بدون حركة: لا تظهر إلا إذا includeZeroBalance = true
  //
  // 5. ترتيب: حسب accountCode تصاعدياً
  //
  // 6. الإجماليات: مجموع كل debitBalance يجب = مجموع كل creditBalance

  // **الطريقة المُثلى:** استعلام SQL واحد مع GROUP BY
  // استخدم db.$queryRaw أو Prisma aggregate مع groupBy
  
  // مثال:
  const results = await db.$queryRaw<Array<{
    accountId: string;
    totalDebit: Prisma.Decimal;
    totalCredit: Prisma.Decimal;
    txCount: bigint;
  }>>`
    SELECT 
      jel."accountId",
      COALESCE(SUM(jel."debit"), 0) as "totalDebit",
      COALESCE(SUM(jel."credit"), 0) as "totalCredit",
      COUNT(DISTINCT jel."journalEntryId") as "txCount"
    FROM "JournalEntryLine" jel
    INNER JOIN "JournalEntry" je ON je."id" = jel."journalEntryId"
    WHERE je."organizationId" = ${organizationId}
      AND je."status" = 'POSTED'
      AND je."date" <= ${options.asOfDate}
      ${options.dateFrom ? Prisma.sql`AND je."date" >= ${options.dateFrom}` : Prisma.empty}
    GROUP BY jel."accountId"
  `;
  
  // ثم join مع الحسابات في TypeScript (أو SQL)
  // وحساب الأرصدة والإجماليات
}
```

### الخطوة 3: الـ Procedure

في `packages/api/modules/accounting/procedures/`، أنشئ أو عدّل ملف التقارير:

```typescript
// accounting.reports.trialBalance
// النوع: protectedProcedure / GET
// الصلاحية: verifyOrganizationAccess("finance.view")
// المدخلات: 
//   organizationId: string
//   asOfDate: string (ISO date) — الافتراضي: اليوم
//   dateFrom?: string — بداية الفترة (اختياري)
//   includeZeroBalance?: boolean — الافتراضي: false
//   level?: number — 1-4
//   accountType?: AccountType
// المخرجات: TrialBalanceResult
```

### الخطوة 4: صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/trial-balance/page.tsx
```

**التصميم — ارجع أولاً للتقارير الموجودة:**
```
اقرأ apps/web/modules/saas/finance/components/reports/ واستخدم نفس أنماط التصميم
```

**المكونات:**

1. **شريط فلاتر علوي:**
   - تاريخ "كما في" (as of date) — date picker
   - فترة "من" (اختياري) — لعرض حركة الفترة فقط
   - اختيار سريع: "اليوم" | "نهاية الشهر" | "نهاية الربع" | "نهاية السنة"
   - checkbox: "إظهار الحسابات بدون حركة"
   - فلتر نوع الحساب (اختياري)
   - زر تصدير Excel/PDF

2. **بطاقة حالة التوازن:**
   - إذا متوازن: ✅ "ميزان المراجعة متوازن" (أخضر)
   - إذا غير متوازن: ❌ "يوجد فرق: XX ريال" (أحمر) — هذا لا يحدث إذا القيود صحيحة

3. **جدول ميزان المراجعة:**
   ```
   رمز الحساب | اسم الحساب | مدين (حركة) | دائن (حركة) | رصيد مدين | رصيد دائن
   ─────────────────────────────────────────────────────────────────────────
   1120       | العملاء     | 500,000     |              | 350,000   |
   1150       | ضريبة مدخلات| 45,000      |              | 30,000    |
   2130       | ضريبة مستحقة|             | 75,000       |           | 55,000
   4100       | إيرادات     |             | 500,000      |           | 500,000
   5100       | مواد        | 120,000     |              | 120,000   |
   ─────────────────────────────────────────────────────────────────────────
   الإجمالي                 | 665,000     | 665,000      | 500,000   | 500,000
   ```

   - الحسابات مرتّبة بالرمز
   - مسافة بادئة حسب المستوى (level)
   - حسابات المستوى 1 بخط عريض وخلفية ملونة خفيفة
   - صف الإجمالي في الأسفل بخط عريض وخلفية مميزة
   - خط مزدوج تحت الإجمالي (نمط محاسبي)
   - أرقام سالبة بين أقواس: `(10,000)`
   - فواصل آلاف: `500,000`
   - خلايا فارغة لا تعرض "0" — تبقى فارغة (نمط محاسبي)

4. **رسالة فارغة:** إذا لم يوجد قيود مرحّلة → "لا توجد قيود مرحّلة بعد. ابدأ بتفعيل المحاسبة من دليل الحسابات."

### الخطوة 5: الترجمة

أضف في `ar.json` و `en.json`:
```json
"trialBalance": {
  "title": "ميزان المراجعة",
  "asOfDate": "كما في تاريخ",
  "periodFrom": "من تاريخ",
  "balanced": "ميزان المراجعة متوازن",
  "notBalanced": "يوجد فرق في ميزان المراجعة",
  "difference": "الفرق",
  "periodDebit": "مدين (حركة)",
  "periodCredit": "دائن (حركة)",
  "debitBalance": "رصيد مدين",
  "creditBalance": "رصيد دائن",
  "includeZero": "إظهار الحسابات بدون حركة",
  "noEntries": "لا توجد قيود مرحّلة بعد",
  "accountCount": "عدد الحسابات"
}
```

### الخطوة 6: التحقق
```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# المرحلة الفرعية 2/5: قائمة الدخل التفصيلية (Detailed Income Statement)

## الهدف
قائمة الدخل تعرض إيرادات ومصروفات الفترة وتُنتج صافي الربح/الخسارة. الفرق عن قائمة الدخل المبسّطة (المرحلة 1) أن هذه تُبنى من القيود المحاسبية وليس من جداول الفواتير والمصروفات مباشرة — أدق وأشمل.

## مصدر البيانات
القيود المرحّلة (`JournalEntry.status = POSTED`) على حسابات `type = REVENUE` و `type = EXPENSE`.

## التعليمات

### الخطوة 1: قراءة الملفات
```
اقرأ:
1. packages/database/prisma/queries/accounting.ts — ميزان المراجعة (المرحلة السابقة)
2. DEFAULT_CHART_OF_ACCOUNTS في نفس الملف — لفهم تسلسل الحسابات
3. SYSTEM_ACCOUNTS — لفهم الربط
```

### الخطوة 2: استعلام قائمة الدخل

في `packages/database/prisma/queries/accounting.ts`، أضف:

```typescript
// ========================================
// قائمة الدخل التفصيلية (Income Statement)
// ========================================

export interface IncomeStatementSection {
  code: string;              // رمز الحساب الرئيسي (4000, 5000, 6000)
  nameAr: string;
  nameEn: string;
  accounts: {
    code: string;
    nameAr: string;
    nameEn: string;
    amount: Prisma.Decimal;  // الرصيد (موجب دائماً)
    percentage: number;       // نسبة من إجمالي الإيرادات
    // تفصيل حسب المشروع (اختياري)
    byProject?: { projectId: string; projectName: string; amount: Prisma.Decimal }[];
  }[];
  total: Prisma.Decimal;
}

export interface IncomeStatementResult {
  period: { from: Date; to: Date };
  
  // الإيرادات
  revenue: IncomeStatementSection;
  
  // تكاليف المشاريع (5000)
  costOfProjects: IncomeStatementSection;
  
  // مجمل الربح = الإيرادات - تكاليف المشاريع
  grossProfit: Prisma.Decimal;
  grossProfitMargin: number;  // نسبة مئوية
  
  // المصروفات التشغيلية (6000)
  operatingExpenses: IncomeStatementSection;
  
  // الربح التشغيلي = مجمل الربح - المصروفات التشغيلية
  operatingProfit: Prisma.Decimal;
  operatingProfitMargin: number;
  
  // صافي الربح (= الربح التشغيلي حالياً — لا توجد بنود أخرى بعد)
  netProfit: Prisma.Decimal;
  netProfitMargin: number;
  
  // مقارنة بالفترة السابقة
  comparison?: {
    previousRevenue: Prisma.Decimal;
    previousCostOfProjects: Prisma.Decimal;
    previousGrossProfit: Prisma.Decimal;
    previousOperatingExpenses: Prisma.Decimal;
    previousNetProfit: Prisma.Decimal;
    revenueChangePercent: number;
    netProfitChangePercent: number;
  };
  
  generatedAt: Date;
}

export async function getIncomeStatement(
  db: PrismaClient,
  organizationId: string,
  options: {
    dateFrom: Date;
    dateTo: Date;
    includeProjectBreakdown?: boolean;  // تفصيل حسب المشروع
    includeComparison?: boolean;         // مقارنة بفترة سابقة
  }
): Promise<IncomeStatementResult> {
  // المنطق:
  // 1. جلب أرصدة كل حسابات REVENUE (4000-4999) للفترة
  //    الرصيد = مجموع الدائن - مجموع المدين (لأن الإيرادات طبيعتها دائنة)
  //
  // 2. جلب أرصدة كل حسابات EXPENSE:
  //    - 5000-5999 = تكاليف مشاريع (Cost of Projects)
  //    - 6000-6999 = مصروفات تشغيلية (Operating Expenses)
  //    الرصيد = مجموع المدين - مجموع الدائن (لأن المصروفات طبيعتها مدينة)
  //
  // 3. تجميع حسب الحساب الأب (المستوى 2)
  //
  // 4. حساب المجاميع والنسب
  //
  // 5. إذا includeProjectBreakdown: GROUP BY أيضاً على projectId من JournalEntryLine
  //
  // 6. إذا includeComparison: نفس الاستعلام للفترة السابقة
  //    (نفس المدة، الفترة التي تسبقها مباشرة)

  // الاستعلام — استخدم نفس نمط ميزان المراجعة مع فلتر على accountType
  const revenueBalances = await db.$queryRaw`
    SELECT 
      a."id", a."code", a."nameAr", a."nameEn", a."parentId",
      COALESCE(SUM(jel."credit"), 0) - COALESCE(SUM(jel."debit"), 0) as "balance"
    FROM "Account" a
    LEFT JOIN "JournalEntryLine" jel ON jel."accountId" = a."id"
    LEFT JOIN "JournalEntry" je ON je."id" = jel."journalEntryId"
      AND je."status" = 'POSTED'
      AND je."date" >= ${options.dateFrom}
      AND je."date" <= ${options.dateTo}
    WHERE a."organizationId" = ${organizationId}
      AND a."type" = 'REVENUE'
      AND a."isPostable" = true
    GROUP BY a."id"
    HAVING COALESCE(SUM(jel."credit"), 0) - COALESCE(SUM(jel."debit"), 0) != 0
  `;
  
  // نفس الشيء لـ EXPENSE مع عكس الإشارة:
  // balance = SUM(debit) - SUM(credit)
  
  // تجميع في sections حسب الرمز (4xxx, 5xxx, 6xxx)
}
```

### الخطوة 3: الـ Procedure

```typescript
// accounting.reports.incomeStatement
// النوع: protectedProcedure / GET
// المدخلات:
//   organizationId: string
//   dateFrom: string (ISO)
//   dateTo: string (ISO)
//   includeProjectBreakdown?: boolean
//   includeComparison?: boolean
// المخرجات: IncomeStatementResult
```

### الخطوة 4: صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/income-statement/page.tsx
```

**المكونات:**

1. **شريط فلاتر:**
   - فترة: اختيار سريع (هذا الشهر | الربع الحالي | السنة | مخصص)
   - checkbox: "تفصيل حسب المشروع"
   - checkbox: "مقارنة بالفترة السابقة"
   - زر تصدير

2. **4 بطاقات KPI في الأعلى:**
   - إجمالي الإيرادات (أخضر) + نسبة التغيير
   - تكاليف المشاريع (برتقالي) + نسبة من الإيرادات
   - مجمل الربح (أزرق) + الهامش %
   - صافي الربح (أخضر إذا موجب، أحمر إذا سالب) + الهامش %

3. **قائمة الدخل بالتنسيق المحاسبي الكلاسيكي:**

```
┌───────────────────────────────────────────────────────────────┐
│                    قائمة الدخل                                │
│              للفترة من 01/01/2026 إلى 31/03/2026              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ الإيرادات                                                     │
│   إيرادات المشاريع                              450,000       │
│   إيرادات أوامر التغيير                           30,000       │
│   إيرادات أخرى                                   20,000       │
│                                              ──────────       │
│   إجمالي الإيرادات                              500,000       │
│                                                               │
│ تكاليف المشاريع                                               │
│   مواد ومشتريات                                 120,000       │
│   مقاولو باطن                                   150,000       │
│   عمالة مباشرة                                   40,000       │
│   تكاليف أخرى                                    10,000       │
│                                              ──────────       │
│   إجمالي تكاليف المشاريع                       (320,000)      │
│                                              ══════════       │
│ مجمل الربح                                      180,000       │
│ هامش مجمل الربح                                    36.0%      │
│                                                               │
│ المصروفات التشغيلية                                           │
│   رواتب وأجور إدارية                             45,000       │
│   إيجارات                                        15,000       │
│   مرافق واتصالات                                  8,000       │
│   نقل ومواصلات                                    5,000       │
│   تأمين                                           3,000       │
│   مصروفات أخرى                                    4,000       │
│                                              ──────────       │
│   إجمالي المصروفات التشغيلية                    (80,000)      │
│                                              ══════════       │
│ صافي الربح                                      100,000       │
│ هامش صافي الربح                                    20.0%      │
└───────────────────────────────────────────────────────────────┘
```

   **قواعد التنسيق:**
   - أسماء الأقسام (إيرادات، تكاليف، مصروفات): خط عريض بخلفية خفيفة
   - المجاميع الفرعية: خط تحتها
   - المجاميع الرئيسية: خطين تحتها (══)
   - المبالغ السالبة بين أقواس
   - النسب المئوية بخط أصغر ولون رمادي
   - محاذاة الأرقام: يمين العمود (left في RTL)
   - الخلايا الفارغة تبقى فارغة — لا تعرض "0"
   
4. **إذا includeComparison = true:** عمود إضافي يعرض أرقام الفترة السابقة + عمود التغيير (%)

5. **إذا includeProjectBreakdown = true:** كل حساب قابل للتوسيع ويعرض التفصيل حسب المشروع

6. **مخطط Recharts (أسفل القائمة):**
   - Bar chart: إيرادات vs تكاليف vs مصروفات
   - إذا comparison مُفعّل: مخطط مقارنة جنب-لجنب

### الخطوة 5: التحقق
```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# المرحلة الفرعية 3/5: الميزانية العمومية (Balance Sheet)

## الهدف
الميزانية العمومية تعرض المركز المالي للشركة في لحظة معينة: ماذا تملك (الأصول)، ماذا عليها (الخصوم)، وماذا يتبقى لأصحابها (حقوق الملكية). المعادلة الأساسية: **الأصول = الخصوم + حقوق الملكية**.

## التعليمات

### الخطوة 1: الاستعلام

في `packages/database/prisma/queries/accounting.ts`، أضف:

```typescript
// ========================================
// الميزانية العمومية (Balance Sheet)
// ========================================

export interface BalanceSheetSection {
  title: string;            // عنوان القسم
  titleEn: string;
  subsections: {
    code: string;           // رمز الحساب الأب (1100, 1200, 2100, ...)
    nameAr: string;
    nameEn: string;
    accounts: {
      code: string;
      nameAr: string;
      nameEn: string;
      balance: Prisma.Decimal;
    }[];
    subtotal: Prisma.Decimal;
  }[];
  total: Prisma.Decimal;
}

export interface BalanceSheetResult {
  asOfDate: Date;
  
  // الأصول
  assets: BalanceSheetSection;   // 1000-1999
  
  // الخصوم
  liabilities: BalanceSheetSection;  // 2000-2999
  
  // حقوق الملكية
  equity: {
    section: BalanceSheetSection;    // 3000-3999
    currentYearPL: Prisma.Decimal;   // أرباح/خسائر السنة الحالية (محسوبة)
    totalEquity: Prisma.Decimal;     // حسابات حقوق الملكية + أرباح السنة
  };
  
  // التحقق
  totalAssets: Prisma.Decimal;
  totalLiabilitiesAndEquity: Prisma.Decimal;
  isBalanced: boolean;               // الأصول = الخصوم + حقوق الملكية
  difference: Prisma.Decimal;
  
  // مقارنة (اختياري)
  comparison?: {
    previousDate: Date;
    previousAssets: Prisma.Decimal;
    previousLiabilities: Prisma.Decimal;
    previousEquity: Prisma.Decimal;
  };
  
  generatedAt: Date;
}

export async function getBalanceSheet(
  db: PrismaClient,
  organizationId: string,
  options: {
    asOfDate: Date;
    fiscalYearStart?: Date;      // بداية السنة المالية (default: 1 يناير)
    includeComparison?: boolean;  // مقارنة مع نفس التاريخ السنة الماضية
  }
): Promise<BalanceSheetResult> {
  // المنطق:
  //
  // 1. الأصول (type = ASSET):
  //    لكل حساب: الرصيد = مجموع المدين - مجموع الدائن (من بداية الزمن حتى asOfDate)
  //    ← ملاحظة: الميزانية دائماً تراكمية من البداية — ليست لفترة
  //    استثناء: مجمع الإهلاك (1290) طبيعته دائنة رغم أنه حساب أصول
  //
  // 2. الخصوم (type = LIABILITY):
  //    لكل حساب: الرصيد = مجموع الدائن - مجموع المدين
  //
  // 3. حقوق الملكية (type = EQUITY):
  //    لكل حساب: الرصيد = مجموع الدائن - مجموع المدين
  //
  // 4. أرباح/خسائر السنة الحالية:
  //    = مجموع أرصدة حسابات REVENUE - مجموع أرصدة حسابات EXPENSE
  //    للفترة من بداية السنة المالية (fiscalYearStart) حتى asOfDate
  //    هذا يُضاف لحقوق الملكية
  //
  // 5. المعادلة: الأصول = الخصوم + حقوق الملكية + أرباح السنة
  
  const fiscalYearStart = options.fiscalYearStart || new Date(options.asOfDate.getFullYear(), 0, 1); // 1 يناير
  
  // استعلام واحد لكل الأرصدة (من بداية الزمن حتى asOfDate)
  const allBalances = await db.$queryRaw<Array<{
    accountId: string;
    code: string;
    nameAr: string;
    nameEn: string;
    type: string;
    normalBalance: string;
    level: number;
    parentId: string | null;
    totalDebit: Prisma.Decimal;
    totalCredit: Prisma.Decimal;
  }>>`
    SELECT 
      a."id" as "accountId", a."code", a."nameAr", a."nameEn",
      a."type", a."normalBalance", a."level", a."parentId",
      COALESCE(SUM(jel."debit"), 0) as "totalDebit",
      COALESCE(SUM(jel."credit"), 0) as "totalCredit"
    FROM "Account" a
    LEFT JOIN "JournalEntryLine" jel ON jel."accountId" = a."id"
    LEFT JOIN "JournalEntry" je ON je."id" = jel."journalEntryId"
      AND je."status" = 'POSTED'
      AND je."date" <= ${options.asOfDate}
    WHERE a."organizationId" = ${organizationId}
      AND a."isPostable" = true
      AND a."isActive" = true
    GROUP BY a."id"
    HAVING COALESCE(SUM(jel."debit"), 0) != 0 
       OR COALESCE(SUM(jel."credit"), 0) != 0
    ORDER BY a."code"
  `;
  
  // أرباح/خسائر السنة الحالية (حسابات REVENUE و EXPENSE من بداية السنة)
  // استعلام منفصل بفلتر dateFrom = fiscalYearStart
  
  // تجميع في sections حسب الحساب الأب
}
```

### الخطوة 2: الـ Procedure

```typescript
// accounting.reports.balanceSheet
// المدخلات: organizationId, asOfDate, includeComparison?
```

### الخطوة 3: صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-reports/balance-sheet/page.tsx
```

**التصميم — تنسيق T-Account الكلاسيكي:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      الميزانية العمومية                              │
│                    كما في 31/03/2026                                │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │                                      │
│ الأصول                       │ الخصوم وحقوق الملكية                  │
│                              │                                      │
│ الأصول المتداولة             │ الخصوم المتداولة                      │
│   النقدية والبنوك   250,000  │   الموردون           80,000           │
│   العملاء          350,000  │   مقاولو الباطن     120,000           │
│   دفعات مقدمة      20,000  │   ضريبة مستحقة       55,000           │
│   ضريبة مدخلات     30,000  │   رواتب مستحقة       45,000           │
│              ────────────── │                ──────────────          │
│              إجمالي 650,000 │                إجمالي 300,000         │
│                              │                                      │
│ الأصول الثابتة               │ حقوق الملكية                          │
│   معدات وآليات     180,000  │   رأس المال         200,000           │
│   سيارات            80,000  │   أرباح مبقاة        60,000           │
│   مجمع إهلاك      (60,000) │   أرباح السنة       290,000           │
│              ────────────── │                ──────────────          │
│              إجمالي 200,000 │                إجمالي 550,000         │
│                              │                                      │
│ ════════════════════════════ │ ══════════════════════════════════    │
│ إجمالي الأصول      850,000  │ إجمالي الخصوم وحقوق  850,000         │
│                              │ الملكية                               │
└──────────────────────────────┴──────────────────────────────────────┘
```

**ملاحظات تصميمية:**
- عرض بعمودين جنب-لجنب (grid-cols-2) — على الشاشات الكبيرة
- على الموبايل: عمود واحد (الأصول أولاً ثم الخصوم)
- بطاقة تأكيد التوازن: "الأصول (850,000) = الخصوم + حقوق الملكية (850,000) ✅"
- أرباح السنة الحالية تُعرض بسطر مميز (لون مختلف) لأنها محسوبة وليست من القيود مباشرة

### الخطوة 4: التحقق
```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# المرحلة الفرعية 4/5: قيود التسوية (Adjusting Entries)

## الهدف
المحاسب يحتاج يسجّل قيود تسوية في نهاية كل فترة — مثل: استحقاقات، مقدمات، مخصصات، إهلاك. هذه قيود يدوية لكن بنظام مُنظّم يربطها بالفترة.

## المتطلب المسبق
نظام القيود اليومية (المرحلة 2، المرحلة الفرعية 3) يعمل — CRUD + ترحيل + عكس.

## التعليمات

### الخطوة 1: إضافة حقول للـ Schema

**لا نحتاج نموذج جديد** — نضيف حقلين فقط على `JournalEntry`:

```prisma
// أضف في model JournalEntry:
  adjustmentType    String?     // "ACCRUAL" | "PREPAYMENT" | "DEPRECIATION" | "PROVISION" | "CORRECTION" | null
  periodId          String?     // ربط بفترة محاسبية (سيُستخدم في المرحلة 5)
```

```bash
pnpm --filter database db:generate
```

### الخطوة 2: قوالب قيود التسوية الشائعة

في `packages/api/lib/accounting/adjustment-templates.ts`، أنشئ:

```typescript
// قوالب جاهزة لأنواع قيود التسوية الشائعة في شركات المقاولات

export interface AdjustmentTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string; // ACCRUAL, PREPAYMENT, DEPRECIATION, PROVISION, CORRECTION
  descriptionAr: string;
  descriptionEn: string;
  lines: {
    accountCode: string;  // رمز الحساب الافتراضي
    side: "debit" | "credit";
    descriptionAr: string;
  }[];
}

export const ADJUSTMENT_TEMPLATES: AdjustmentTemplate[] = [
  {
    id: "accrued_revenue",
    nameAr: "إيرادات مستحقة",
    nameEn: "Accrued Revenue",
    type: "ACCRUAL",
    descriptionAr: "تسجيل إيرادات تم تنفيذها ولم تُفوتر بعد",
    descriptionEn: "Record revenue earned but not yet invoiced",
    lines: [
      { accountCode: "1120", side: "debit", descriptionAr: "إيرادات مستحقة — ذمم مدينة" },
      { accountCode: "4100", side: "credit", descriptionAr: "إيرادات مشاريع مستحقة" },
    ],
  },
  {
    id: "accrued_expense",
    nameAr: "مصروفات مستحقة",
    nameEn: "Accrued Expense",
    type: "ACCRUAL",
    descriptionAr: "تسجيل مصروفات تمت ولم تُسدد بعد (مثل: كهرباء، إيجار)",
    descriptionEn: "Record expenses incurred but not yet paid",
    lines: [
      { accountCode: "6900", side: "debit", descriptionAr: "مصروفات مستحقة" },
      { accountCode: "2110", side: "credit", descriptionAr: "ذمم دائنة — مصروفات مستحقة" },
    ],
  },
  {
    id: "depreciation",
    nameAr: "إهلاك أصول ثابتة",
    nameEn: "Fixed Asset Depreciation",
    type: "DEPRECIATION",
    descriptionAr: "تسجيل قسط الإهلاك الشهري/السنوي",
    descriptionEn: "Record periodic depreciation",
    lines: [
      { accountCode: "6900", side: "debit", descriptionAr: "مصروف إهلاك" },
      { accountCode: "1290", side: "credit", descriptionAr: "مجمع الإهلاك" },
    ],
  },
  {
    id: "prepaid_expense",
    nameAr: "توزيع مصروف مدفوع مقدماً",
    nameEn: "Prepaid Expense Amortization",
    type: "PREPAYMENT",
    descriptionAr: "تحميل جزء من المصروف المدفوع مقدماً على الفترة الحالية",
    descriptionEn: "Allocate prepaid expense to current period",
    lines: [
      { accountCode: "6900", side: "debit", descriptionAr: "مصروف الفترة" },
      { accountCode: "1130", side: "credit", descriptionAr: "تخفيض دفعة مقدمة" },
    ],
  },
  {
    id: "provision",
    nameAr: "مخصص نهاية خدمة",
    nameEn: "End of Service Provision",
    type: "PROVISION",
    descriptionAr: "تكوين مخصص مكافأة نهاية الخدمة",
    descriptionEn: "Record end of service benefit provision",
    lines: [
      { accountCode: "6100", side: "debit", descriptionAr: "مصروف مخصص نهاية خدمة" },
      { accountCode: "2140", side: "credit", descriptionAr: "مخصص نهاية خدمة" },
    ],
  },
  {
    id: "correction",
    nameAr: "قيد تصحيحي",
    nameEn: "Correction Entry",
    type: "CORRECTION",
    descriptionAr: "تصحيح خطأ في قيد سابق",
    descriptionEn: "Correct an error in a previous entry",
    lines: [], // بدون حسابات افتراضية — المحاسب يحددها
  },
];
```

### الخطوة 3: Procedure إنشاء قيد تسوية

```typescript
// accounting.journal.createAdjustment
// النوع: subscriptionProcedure / POST
// المدخلات:
//   organizationId: string
//   templateId?: string              // من ADJUSTMENT_TEMPLATES
//   adjustmentType: string           // ACCRUAL | PREPAYMENT | DEPRECIATION | PROVISION | CORRECTION
//   date: Date
//   description: string
//   lines: { accountId: string; debit: Decimal; credit: Decimal; description?: string; projectId?: string }[]
//   autoPost?: boolean               // ترحيل تلقائي بعد الإنشاء (default: false)
//
// المنطق:
// 1. نفس validations قيد عادي (متوازن، حسابات صالحة)
// 2. إضافة adjustmentType على القيد
// 3. referenceType = "ADJUSTMENT"
// 4. isAutoGenerated = false (دائماً يدوي)
// 5. إذا autoPost = true: ترحيل فوري
```

### الخطوة 4: Procedure قائمة القوالب

```typescript
// accounting.adjustments.templates
// النوع: protectedProcedure / GET
// المخرجات: ADJUSTMENT_TEMPLATES مع resolve لأسماء الحسابات الفعلية
```

### الخطوة 5: صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/journal-entries/new-adjustment/page.tsx
```

**المكونات:**

1. **اختيار القالب (اختياري):** 5 بطاقات — كل قالب ببطاقة فيها الاسم + الوصف + أيقونة
   - عند النقر: يملأ الحقول تلقائياً (الحسابات + الوصف)
   - "قيد حر" = بدون قالب

2. **نموذج القيد:** نفس نموذج القيد اليدوي من المرحلة 2 مع إضافات:
   - dropdown "نوع التسوية" (ACCRUAL, PREPAYMENT, DEPRECIATION, PROVISION, CORRECTION)
   - حقل "الملاحظات" (textarea)
   - checkbox "ترحيل فوري"

3. **إضافة زر** في صفحة القيود اليومية الرئيسية: "قيد تسوية جديد" → يفتح هذه الصفحة

### الخطوة 6: التحقق
```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# المرحلة الفرعية 5/5: إقفال الفترات المحاسبية (Period Closing)

## الهدف
إقفال الفترة المحاسبية يمنع أي تعديل على القيود في فترة سابقة. هذا ضروري لسلامة البيانات المحاسبية — بعد إقفال شهر يناير مثلاً، لا يمكن إضافة أو تعديل قيود في يناير.

## التعليمات

### الخطوة 1: تغييرات Schema

أضف نموذج جديد:

```prisma
model AccountingPeriod {
  id              String      @id @default(cuid())
  organizationId  String
  
  name            String      // "يناير 2026", "Q1 2026", "2025"
  periodType      String      // "MONTHLY" | "QUARTERLY" | "ANNUAL"
  startDate       DateTime    // بداية الفترة
  endDate         DateTime    // نهاية الفترة
  
  isClosed        Boolean     @default(false)
  closedAt        DateTime?
  closedById      String?     // من أغلق الفترة
  
  // قيد الإقفال (ترحيل الإيرادات والمصروفات لحساب الأرباح المبقاة)
  closingEntryId  String?     // القيد الذي أُنشئ عند الإقفال
  
  notes           String?
  
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@unique([organizationId, startDate, endDate])
  @@index([organizationId, isClosed])
  @@index([organizationId, endDate])
}
```

أضف في Organization:
```prisma
  accountingPeriods AccountingPeriod[]
```

```bash
pnpm --filter database db:generate
```

### الخطوة 2: استعلامات الفترات

في `packages/database/prisma/queries/accounting.ts`، أضف:

```typescript
// ========================================
// الفترات المحاسبية (Accounting Periods)
// ========================================

// 1. توليد الفترات الشهرية تلقائياً
export async function generateMonthlyPeriods(
  db: PrismaClient,
  organizationId: string,
  year: number
): Promise<{ created: number }> {
  // أنشئ 12 فترة شهرية للسنة المحددة
  // تحقق أولاً: لا تُنشئ فترات مكررة
  // الاسم: "يناير 2026", "فبراير 2026", ...
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  
  let created = 0;
  for (let m = 0; m < 12; m++) {
    const startDate = new Date(year, m, 1);
    const endDate = new Date(year, m + 1, 0); // آخر يوم في الشهر
    
    const exists = await db.accountingPeriod.findUnique({
      where: { organizationId_startDate_endDate: { organizationId, startDate, endDate } },
    });
    
    if (!exists) {
      await db.accountingPeriod.create({
        data: {
          organizationId,
          name: `${months[m]} ${year}`,
          periodType: "MONTHLY",
          startDate,
          endDate,
        },
      });
      created++;
    }
  }
  return { created };
}

// 2. إقفال فترة
export async function closePeriod(
  db: PrismaClient,
  periodId: string,
  closedById: string,
  options: {
    generateClosingEntry: boolean; // هل ننشئ قيد إقفال؟ (فقط للسنة)
  }
): Promise<{ success: boolean; closingEntryId?: string }> {
  const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error("الفترة غير موجودة");
  if (period.isClosed) throw new Error("الفترة مغلقة مسبقاً");
  
  // التحقق: لا توجد قيود DRAFT في هذه الفترة
  const draftEntries = await db.journalEntry.count({
    where: {
      organizationId: period.organizationId,
      status: "DRAFT",
      date: { gte: period.startDate, lte: period.endDate },
    },
  });
  if (draftEntries > 0) {
    throw new Error(`يوجد ${draftEntries} قيود مسودة في هذه الفترة. يجب ترحيلها أو حذفها أولاً.`);
  }
  
  let closingEntryId: string | undefined;
  
  // إذا إقفال سنوي: أنشئ قيد إقفال يُرحّل الإيرادات والمصروفات لحساب الأرباح المبقاة
  if (options.generateClosingEntry && period.periodType === "ANNUAL") {
    // 1. حساب صافي الربح/الخسارة (إيرادات - مصروفات) للسنة
    // 2. إنشاء قيد:
    //    - مدين: كل حسابات الإيرادات (لتصفيرها)
    //    - دائن: كل حسابات المصروفات (لتصفيرها)
    //    - الفرق → حساب الأرباح المبقاة (3200)
    
    // جلب أرصدة الإيرادات والمصروفات
    const revenueBalance = await getAccountTypeBalance(db, period.organizationId, "REVENUE", period.startDate, period.endDate);
    const expenseBalance = await getAccountTypeBalance(db, period.organizationId, "EXPENSE", period.startDate, period.endDate);
    
    // الربح = الإيرادات - المصروفات
    const netProfit = revenueBalance.sub(expenseBalance);
    
    // إنشاء قيد الإقفال
    // ... (استخدم createJournalEntry مع referenceType = "PERIOD_CLOSING")
  }
  
  // إغلاق الفترة
  await db.accountingPeriod.update({
    where: { id: periodId },
    data: {
      isClosed: true,
      closedAt: new Date(),
      closedById,
      closingEntryId,
    },
  });
  
  return { success: true, closingEntryId };
}

// 3. التحقق قبل إنشاء/تعديل قيد: هل الفترة مغلقة؟
export async function isPeriodClosed(
  db: PrismaClient,
  organizationId: string,
  date: Date
): Promise<boolean> {
  const closedPeriod = await db.accountingPeriod.findFirst({
    where: {
      organizationId,
      isClosed: true,
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });
  return !!closedPeriod;
}

// 4. إعادة فتح فترة (الأخيرة فقط)
export async function reopenPeriod(
  db: PrismaClient,
  periodId: string
): Promise<void> {
  const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
  if (!period || !period.isClosed) throw new Error("الفترة غير مغلقة");
  
  // التحقق: لا يمكن فتح فترة إذا الفترة التالية مغلقة
  const nextClosedPeriod = await db.accountingPeriod.findFirst({
    where: {
      organizationId: period.organizationId,
      isClosed: true,
      startDate: { gt: period.endDate },
    },
  });
  if (nextClosedPeriod) {
    throw new Error("لا يمكن إعادة فتح هذه الفترة لأن الفترة التالية مغلقة أيضاً");
  }
  
  // إذا وُجد قيد إقفال: عكسه
  if (period.closingEntryId) {
    // reverseJournalEntry(...)
  }
  
  await db.accountingPeriod.update({
    where: { id: periodId },
    data: { isClosed: false, closedAt: null, closedById: null, closingEntryId: null },
  });
}
```

### الخطوة 3: تعديل القيود اليومية — فحص الفترة المغلقة

**مهم:** هذا التعديل يؤثر على كل عمليات القيود الموجودة من المرحلة 2.

في كل مكان يُنشأ أو يُعدّل قيد، أضف فحص:
```typescript
// قبل إنشاء أي قيد:
const periodClosed = await isPeriodClosed(db, organizationId, entryDate);
if (periodClosed) {
  throw new ORPCError("FORBIDDEN", {
    message: "لا يمكن إنشاء قيد في فترة محاسبية مغلقة",
  });
}
```

**الملفات التي تحتاج تعديل:**
1. `createJournalEntry` في `accounting.ts` — أضف الفحص في البداية
2. `postJournalEntry` — فحص قبل الترحيل
3. `reverseJournalEntry` — فحص تاريخ القيد الأصلي
4. **القيود التلقائية** في `auto-journal.ts` — أضف الفحص. إذا الفترة مغلقة والقيد تلقائي → log warning وتجاوز (لا تمنع العملية المالية الأصلية)

### الخطوة 4: Procedures

```typescript
// 1. accounting.periods.list — قائمة الفترات
// 2. accounting.periods.generate — توليد فترات شهرية لسنة
// 3. accounting.periods.close — إقفال فترة
// 4. accounting.periods.reopen — إعادة فتح الفترة الأخيرة
// 5. accounting.periods.getStatus — حالة الفترة (عدد قيود، مجاميع، هل متوازنة)
```

### الخطوة 5: صفحة UI

أنشئ:
```
apps/web/app/[locale]/app/[slug]/finance/accounting-periods/page.tsx
```

**المكونات:**

1. **شريط علوي:**
   - اختيار السنة (2025, 2026, ...)
   - زر "توليد الفترات الشهرية" (إذا لم تُولّد بعد)

2. **جدول الفترات:**
   ```
   الفترة        | النوع  | البداية    | النهاية    | القيود | الحالة    | إجراء
   ─────────────────────────────────────────────────────────────────────────
   يناير 2026    | شهري   | 01/01/2026 | 31/01/2026 | 45     | مغلقة ✅  | إعادة فتح
   فبراير 2026   | شهري   | 01/02/2026 | 28/02/2026 | 38     | مغلقة ✅  | —
   مارس 2026     | شهري   | 01/03/2026 | 31/03/2026 | 52     | مفتوحة 🟡 | إقفال
   أبريل 2026    | شهري   | 01/04/2026 | 30/04/2026 | 12     | مفتوحة 🟡 | —
   ```
   
   - **إقفال:** يظهر فقط للفترة المفتوحة الأقدم (لا يمكن إقفال مارس قبل يناير وفبراير)
   - **إعادة فتح:** يظهر فقط لآخر فترة مغلقة
   - عمود "القيود": عدد القيود المرحّلة في الفترة — قابل للنقر → يفتح قائمة القيود مفلترة

3. **Dialog إقفال الفترة:**
   - ملخص: عدد القيود، إجمالي المدين/الدائن، هل متوازن
   - تحذير: "لا يمكن تعديل القيود بعد الإقفال"
   - إذا يوجد قيود DRAFT: رسالة خطأ + رابط لقائمة القيود المسودة
   - إذا إقفال سنوي: checkbox "إنشاء قيد إقفال (ترحيل الأرباح لحساب الأرباح المبقاة)"
   - زر تأكيد مع كلمة "أقفل الفترة" (ليس مجرد "تأكيد")

4. **إضافة رابط في Sidebar المالية:** "الفترات المحاسبية"

### الخطوة 6: الترجمة

أضف في `ar.json` و `en.json`:
```json
"accountingPeriods": {
  "title": "الفترات المحاسبية",
  "period": "الفترة",
  "monthly": "شهري",
  "quarterly": "ربع سنوي",
  "annual": "سنوي",
  "open": "مفتوحة",
  "closed": "مغلقة",
  "close": "إقفال الفترة",
  "reopen": "إعادة فتح",
  "generate": "توليد الفترات",
  "generateForYear": "توليد الفترات الشهرية لسنة",
  "closingConfirm": "هل أنت متأكد من إقفال هذه الفترة؟ لن تتمكن من تعديل القيود بعد الإقفال.",
  "draftEntriesExist": "يوجد {count} قيود مسودة في هذه الفترة. يجب ترحيلها أو حذفها أولاً.",
  "closingEntry": "قيد إقفال",
  "generateClosingEntry": "إنشاء قيد إقفال (ترحيل الأرباح)",
  "cannotModifyClosed": "لا يمكن تعديل قيود في فترة مغلقة",
  "cannotReopenMiddle": "لا يمكن إعادة فتح هذه الفترة لأن فترة لاحقة مغلقة",
  "entriesCount": "عدد القيود",
  "periodStatus": "حالة الفترة"
},
"adjustments": {
  "title": "قيود التسوية",
  "newAdjustment": "قيد تسوية جديد",
  "type": "نوع التسوية",
  "accrual": "استحقاق",
  "prepayment": "مقدمات",
  "depreciation": "إهلاك",
  "provision": "مخصص",
  "correction": "تصحيح",
  "template": "اختر قالب",
  "freeEntry": "قيد حر",
  "autoPost": "ترحيل فوري"
}
```

### الخطوة 7: التحقق النهائي
```bash
pnpm tsc --noEmit
pnpm build
```

---
---
---

# ملاحظات عامة حرجة لكل المراحل

## 1. الترابط بين المراحل
```
المرحلة 1 (ميزان مراجعة) → مستقلة — يمكن تنفيذها أولاً
المرحلة 2 (قائمة الدخل) → تعتمد على نفس استعلامات المرحلة 1
المرحلة 3 (ميزانية عمومية) → تعتمد على قائمة الدخل (أرباح السنة)
المرحلة 4 (قيود تسوية) → تعتمد على نظام القيود من المرحلة 2 السابقة
المرحلة 5 (إقفال الفترات) → تعتمد على كل ما سبق + تعدّل سلوك القيود
```

## 2. ترتيب التنفيذ المقترح
```
المرحلة 1/5 (ميزان مراجعة)   → tsc → build → اختبر بالمتصفح → commit
المرحلة 2/5 (قائمة الدخل)     → tsc → build → اختبر → commit
المرحلة 3/5 (ميزانية عمومية)   → tsc → build → اختبر → commit
المرحلة 4/5 (قيود تسوية)      → db:generate → tsc → build → commit
المرحلة 5/5 (إقفال الفترات)   → db:generate → tsc → build → commit ← الأخطر
```

## 3. أنماط يجب اتباعها
- **كل استعلام** يبدأ بـ `organizationId` (multi-tenancy)
- **الحسابات المالية:** `Prisma.Decimal` فقط — `@db.Decimal(15, 2)`
- **الاستعلامات الثقيلة:** استخدم `db.$queryRaw` مع SQL مباشر + `GROUP BY` بدل جلب كل البيانات وتجميعها في TypeScript
- **التقارير:** `protectedProcedure` مع `finance.view`
- **العمليات:** `subscriptionProcedure`
- **RTL:** `ms-`, `me-`, `ps-`, `pe-`
- **ترجمة:** `ar.json` + `en.json` بالتوازي
- **بعد schema change:** `pnpm --filter database db:generate`
- **بعد كل مرحلة:** `pnpm tsc --noEmit && pnpm build`

## 4. التنسيق المحاسبي — قواعد ثابتة لكل التقارير
- الأرقام السالبة: `(10,000)` وليس `-10,000`
- فواصل الآلاف: `500,000`
- الخلايا الفارغة: لا تعرض `0` — تبقى فارغة
- المجاميع الفرعية: خط تحتها `──────`
- المجاميع الرئيسية: خطين `══════`
- النسب المئوية: بخط أصغر ولون رمادي: `36.0%`
- محاذاة الأرقام: left-aligned (في RTL يعني على اليسار فعلياً)
- أسماء الأقسام: خط عريض بخلفية ملونة خفيفة

## 5. ماذا بعد (خارج هذا البرومبت)
- تصدير كل التقارير لـ PDF بتنسيق احترافي
- تصدير Excel لميزان المراجعة
- تقرير مراكز التكلفة (حسب المشروع) من بيانات `projectId` في `JournalEntryLine`
- تقرير حركة حساب (Account Ledger) — كل القيود على حساب معين
- تقرير دفتر الأستاذ العام (General Ledger)
- dashboard محاسبي يعرض ملخص القوائم المالية
- أداة AI: `queryAccounting` في مساعد مسار
- توليد القيود بأثر رجعي (backfill) للعمليات القديمة
