# برومبت تنفيذ: نظام مستخلصات مقاول الباطن الكامل + نموذج الطباعة

> **⚡ الوضع: PLAN MODE — ضع خطة كاملة أولاً قبل تنفيذ أي كود**
> اكتب خطة تفصيلية بكل الملفات المتأثرة والتعديلات المطلوبة، ثم انتظر موافقتي قبل التنفيذ.
> **التحقق بعد كل مرحلة:** `npx tsc --noEmit`
> **التحقق النهائي:** `pnpm build`
> **المسار الجذر:** `D:\Masar\Masar`

---

## 📋 ملخص المطلوب

### الوضع الحالي (من تحليل الواجهة الفعلية):

صفحة تفاصيل عقد الباطن (`SubcontractDetailView.tsx` — 1,349 سطر) تعرض حالياً:
1. ✅ Header بالإحصائيات (القيمة الأصلية، أوامر التغيير، المدفوع، المتبقي)
2. ✅ نطاق العمل
3. ✅ سجل الدفعات — مع نموذج تسجيل دفعة مباشرة (بدون مستخلص) ← **يجب الإبقاء عليه يعمل كما هو**
4. ✅ مراحل الدفع (payment terms)
5. ✅ أوامر التغيير
6. ❌ **قسم المستخلصات غير ظاهر في الواجهة** — رغم أن Backend كامل (8 endpoints + SubcontractClaimDetailView.tsx 682 سطر موجود)
7. ❌ لا يوجد نموذج طباعة مستخلص
8. ❌ نموذج الدفعة لا يربط بالمستخلصات
9. ❌ لا يوجد حقول غرامات/حسميات أخرى في المستخلص

### المطلوب تنفيذه:
1. **إظهار قسم المستخلصات** في صفحة تفاصيل العقد (أهم شيء)
2. **نموذج إنشاء مستخلص** مع بنود + حسابات تلقائية
3. **workflow اعتماد المستخلص** (تقديم → مراجعة → اعتماد/رفض)
4. **ربط الدفعة بالمستخلص** (اختياري — يبقى خيار الدفع بدون مستخلص)
5. **نموذج طباعة المستخلص** بالنمط السعودي (يسحب شعار وبيانات المنشأة)
6. **إضافة حقول الغرامات والحسميات الإضافية**

---

## 🔴 القائمة الحمراء — لا تلمس هذه الملفات أبداً

```
packages/api/lib/accounting/auto-journal.ts  ← لا تعدّل القيود الموجودة
apps/web/middleware.ts
packages/auth/**
```

---

## المرحلة 0: القراءة الإلزامية (اقرأ أولاً، لا تخمّن)

**اقرأ كل هذه الملفات بالكامل قبل كتابة أي كود أو خطة:**

```powershell
# ═══════════════════════════════════════════════════
# المجموعة 1: فهم الواجهة الحالية لعقود الباطن
# ═══════════════════════════════════════════════════

# 1. صفحة تفاصيل العقد (الأهم — 1,349 سطر — اقرأها كاملة)
cat apps/web/modules/saas/projects/components/subcontracts/SubcontractDetailView.tsx

# 2. صفحة تفاصيل المستخلص (موجودة لكن هل تُستخدم؟)
cat apps/web/modules/saas/projects/components/subcontracts/SubcontractClaimDetailView.tsx

# 3. نموذج إنشاء/تعديل العقد
cat apps/web/modules/saas/projects/components/subcontracts/SubcontractForm.tsx

# 4. كل مكونات المستخلصات الموجودة
Get-ChildItem -Recurse apps/web/modules/saas/projects/components/subcontracts/ -Filter "*.tsx" | Select-Object Name, Length

# 5. Routes الحالية للمستخلصات
Get-ChildItem -Recurse "apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/subcontracts/" -Filter "page.tsx" | Select-Object FullName

# ═══════════════════════════════════════════════════
# المجموعة 2: فهم Backend المستخلصات
# ═══════════════════════════════════════════════════

# 6. Procedures المستخلصات (كل العمليات)
cat packages/api/modules/projects/procedures/subcontract-claims.ts

# 7. Procedures العقود (بنود + دفعات)
cat packages/api/modules/projects/procedures/subcontracts.ts

# 8. Router — لمعرفة كل الـ endpoints المسجلة
cat packages/api/modules/projects/router.ts

# ═══════════════════════════════════════════════════
# المجموعة 3: Schema + أنماط موجودة
# ═══════════════════════════════════════════════════

# 9. Schema مقاولي الباطن
cat packages/database/prisma/schema/subcontract.prisma

# 10. دالة المبلغ بالحروف العربية
cat packages/utils/lib/number-to-arabic-words.ts

# 11. نمط الطباعة المستخدم في سندات القبض (كمرجع)
Get-ChildItem -Recurse apps/web/modules/saas/finance/components/vouchers/ -Filter "*Print*" -OR -Filter "*print*"
# اقرأ أول ملف print تجده

# 12. نمط الطباعة في محاضر الاستلام (كمرجع ثاني)
Get-ChildItem -Recurse apps/web/modules/saas/projects/components/handover/ -Filter "*.tsx" | Select-Object Name

# 13. بيانات المنشأة (Organization model — لسحب الشعار)
Select-String -Path packages/database/prisma/schema/*.prisma -Pattern "model Organization " -Context 0,40

# 14. ملفات الترجمة — القسم الحالي
Select-String -Path apps/web/messages/ar.json -Pattern "subcontract" -Context 0,5

# 15. Sidebar menu
cat apps/web/modules/saas/shared/components/sidebar/use-sidebar-menu.ts

# ═══════════════════════════════════════════════════
# المجموعة 4: فهم نمط الدفع الحالي
# ═══════════════════════════════════════════════════

# 16. كيف يتم تسجيل الدفعة حالياً (في SubcontractDetailView)
Select-String -Path apps/web/modules/saas/projects/components/subcontracts/SubcontractDetailView.tsx -Pattern "payment|Payment|دفع" | Select-Object LineNumber, Line

# 17. auto-journal للمستخلصات (قراءة فقط — لا تعدّل)
Select-String -Path packages/api/lib/accounting/auto-journal.ts -Pattern "onSubcontractClaim|onSubcontractPayment" -Context 0,25
```

**بعد القراءة، اكتب تقرير قصير يجيب على:**

```
1. هل قسم المستخلصات موجود في SubcontractDetailView لكنه مخفي؟ أم غير مبني أصلاً؟
2. هل SubcontractClaimDetailView.tsx مربوط بـ route أم orphan component؟
3. ما هي الـ tabs/sections الموجودة حالياً في SubcontractDetailView؟
4. هل نموذج الدفعة يدعم حقل claimId حالياً؟
5. هل يوجد حقول penaltyAmount / otherDeductions في schema؟
6. ما هو نمط الطباعة المستخدم (CSS @media print أم مكتبة PDF)؟
7. هل Organization model يحتوي على logo / crNumber / vatNumber؟
8. كم procedure claims موجود ومسجل في router؟
```

**ثم ضع خطة التنفيذ التفصيلية وانتظر موافقتي.**

---

## المرحلة 1: تعديلات Schema

### 1.1 إضافة حقول جديدة على SubcontractClaim

**الملف:** `packages/database/prisma/schema/subcontract.prisma`

أضف هذه الحقول على model `SubcontractClaim` (بعد الحقول الموجودة، قبل العلاقات):

```prisma
// === حقول الحسميات الإضافية ===
penaltyAmount       Decimal  @default(0) @db.Decimal(15, 2)  // الغرامات
otherDeductions     Decimal  @default(0) @db.Decimal(15, 2)  // حسميات أخرى
otherDeductionsNote String?                                    // وصف الحسميات الأخرى

// === حقول الطباعة والتوقيعات ===
signatories         Json?    // [{role: string, name: string, signed: boolean, signedAt: DateTime?}]
printedAt           DateTime? // تاريخ آخر طباعة
notes               String?   // ملاحظات عامة على المستخلص
```

⚠️ **كل الحقول optional أو لها default — لا تكسر البيانات الموجودة.**

### 1.2 تشغيل Migration

```powershell
pnpm --filter database push
pnpm --filter database generate
```

### ✅ تحقق المرحلة 1
```powershell
npx tsc --noEmit
```

---

## المرحلة 2: تعديلات Backend

### 2.1 تحديث create/update claim procedures

**الملف:** `packages/api/modules/projects/procedures/subcontract-claims.ts`

**في input schema لـ create و update:**
```typescript
penaltyAmount: z.union([z.string(), z.number()]).optional().default("0"),
otherDeductions: z.union([z.string(), z.number()]).optional().default("0"),
otherDeductionsNote: z.string().optional(),
notes: z.string().optional(),
```

**عدّل حساب netAmount (في create و update):**
```typescript
// الحساب الجديد (أضف السطرين الجديدين):
// netAmount = grossAmount - retentionAmount - advanceDeduction 
//             - penaltyAmount - otherDeductions + vatAmount

// ⚠️ تأكد: netAmount >= 0، وإلا throw error
```

### 2.2 إضافة procedure: `getClaimPrintData`

**الملف:** نفس الملف `subcontract-claims.ts`

procedure جديد يستخدم `protectedProcedure` (قراءة فقط):

```typescript
// Input: { claimId: string }
// Output: كل البيانات المطلوبة للطباعة في response واحد:

{
  // 1. بيانات المنشأة (من Organization)
  organization: {
    name, logo, address, city, phone, crNumber, vatNumber
  },
  
  // 2. بيانات المشروع (من Project)
  project: {
    name, type, city/location, startDate, endDate
  },
  
  // 3. بيانات العقد (من SubcontractContract + approved change orders)
  contract: {
    contractNo, name (اسم المقاول), contractorType,
    value, changeOrdersTotal (من APPROVED فقط), adjustedValue,
    workScope, retentionPercent, advancePaymentPercent,
    includesVat, vatPercent
  },
  
  // 4. بيانات المستخلص + البنود مع حسابات مشتقة
  claim: {
    id, claimNo, title, claimType, status,
    grossAmount, retentionAmount, advanceDeduction,
    penaltyAmount, otherDeductions, otherDeductionsNote,
    vatAmount, netAmount, paidAmount, notes, signatories,
    items: [{
      description, unit, contractQty, unitPrice,
      prevCumulativeQty, thisQty, thisAmount,
      // محسوبة:
      cumulativeQty,       // prevCumulativeQty + thisQty
      cumulativeAmount,    // cumulativeQty × unitPrice
      completionPercent,   // (cumulativeQty / contractQty) × 100
      prevCumulativeAmount // prevCumulativeQty × unitPrice
    }]
  },
  
  // 5. ملخص تراكمي من المستخلصات السابقة المعتمدة
  cumulative: {
    totalClaimsCount,
    currentClaimNumber,     // رقم هذا المستخلص "من N"
    previousClaimsGross,    // مجموع الأعمال السابقة
    previousClaimsPaid,     // المدفوع سابقاً
    totalRetentionHeld,     // إجمالي المحتجزات
  },
  
  // 6. المبلغ بالحروف
  netAmountInWords: string  // من numberToArabicWords()
}
```

**ملاحظات:**
- استخدم `numberToArabicWords` من `@masar/utils`
- احسب `changeOrdersTotal` من أوامر التغيير المعتمدة فقط (status = APPROVED)
- `cumulative` من مستخلصات بـ `claimNo < current` و `status ∈ [APPROVED, PARTIALLY_PAID, PAID]`

### 2.3 إضافة procedure: `markAsPrinted`

```typescript
// subscriptionProcedure
// Input: { claimId: string }
// يحدّث printedAt = new Date()
// يسجّل audit: SUBCONTRACT_CLAIM_PRINTED (أضفه للـ enum)
```

### 2.4 تسجيل الـ Procedures في Router

**الملف:** `packages/api/modules/projects/router.ts`

تأكد أن هذه الـ procedures مسجلة:
```
subcontracts.claims.getPrintData    ← جديد
subcontracts.claims.markAsPrinted   ← جديد
```

وتأكد أن الـ procedures الموجودة مسجلة:
```
subcontracts.claims.list
subcontracts.claims.get (أو getClaim)
subcontracts.claims.create
subcontracts.claims.update
subcontracts.claims.delete
subcontracts.claims.updateStatus (أو updateClaimStatus)
subcontracts.claims.addPayment (أو addClaimPayment)
subcontracts.claims.getSummary (أو getClaimSummary)
```

### 2.5 إضافة مفاتيح الترجمة

**الملف:** `apps/web/messages/ar.json` — أضف كتلة كاملة:

```json
{
  "subcontractClaim": {
    "title": "المستخلصات",
    "newClaim": "مستخلص جديد",
    "printTitle": "مستخلص مقاول باطن",
    "claimNumber": "المستخلص رقم {current} من {total}",
    "types": {
      "INTERIM": "جاري",
      "FINAL": "ختامي",
      "RETENTION": "استرداد محتجزات"
    },
    "statuses": {
      "DRAFT": "مسودة",
      "SUBMITTED": "مقدّم",
      "UNDER_REVIEW": "قيد المراجعة",
      "APPROVED": "معتمد",
      "REJECTED": "مرفوض",
      "PARTIALLY_PAID": "مدفوع جزئياً",
      "PAID": "مدفوع بالكامل",
      "CANCELLED": "ملغي"
    },
    "actions": {
      "submit": "تقديم للمراجعة",
      "review": "بدء المراجعة",
      "approve": "اعتماد المستخلص",
      "reject": "رفض المستخلص",
      "cancel": "إلغاء",
      "print": "طباعة المستخلص",
      "createPayment": "إنشاء سند صرف",
      "addPayment": "تسجيل دفعة"
    },
    "fields": {
      "contractValue": "قيمة العقد",
      "changeOrdersValue": "قيمة الأوامر التغييرية",
      "totalContractValue": "الإجمالي",
      "previousWorks": "قيمة الأعمال المنفذة السابقة",
      "currentWorks": "قيمة الأعمال الحالية",
      "cumulativeWorks": "قيمة الأعمال المنفذة حتى تاريخه",
      "grossAmount": "إجمالي البنود",
      "retentionDeduction": "حسم الاحتفاظ ({percent}%)",
      "retentionNote": "تصرف عند انتهاء الأعمال",
      "advanceDeduction": "خصم الدفعة المقدمة",
      "penalties": "الغرامات",
      "otherDeductions": "حسميات أخرى",
      "vatAmount": "ضريبة القيمة المضافة ({percent}%)",
      "totalDeductions": "إجمالي الحسميات",
      "netPayable": "صافي المستحق",
      "amountInWords": "المبلغ بالحروف",
      "previousPayments": "ما سبق صرفه من مستخلصات سابقة",
      "completionPercent": "نسبة الإنجاز %",
      "contractQty": "كمية العقد",
      "prevQty": "الكميات المنفذة السابقة",
      "currentQty": "الكميات المنفذة الحالية",
      "cumulativeQty": "إجمالي الكميات المنفذة",
      "unitPrice": "سعر الوحدة",
      "prevAmount": "قيمة الأعمال السابقة",
      "currentAmount": "قيمة الأعمال الحالية"
    },
    "signatures": {
      "projectEngineer": "مهندس المشروع",
      "technicalOffice": "المكتب الفني",
      "projectApprover": "معتمد المشروع",
      "projectsManager": "مدير المشاريع",
      "executiveDirector": "المدير التنفيذي",
      "financialManager": "المدير المالي / مدير الحسابات",
      "generalManager": "المدير العام"
    },
    "warnings": {
      "qtyExceeded": "تنبيه: الكمية المدخلة تتجاوز الكمية التعاقدية",
      "negativeNet": "خطأ: صافي المستحق لا يمكن أن يكون سالباً"
    },
    "empty": "لا توجد مستخلصات بعد. أنشئ أول مستخلص لبدء تتبع الأعمال المنفذة.",
    "paymentLinked": "مرتبطة بمستخلص #{claimNo}",
    "paymentDirect": "دفعة مباشرة (بدون مستخلص)"
  }
}
```

**الملف:** `apps/web/messages/en.json` — أضف الترجمة الإنجليزية المقابلة بنفس المفاتيح.

### ✅ تحقق المرحلة 2
```powershell
npx tsc --noEmit
```

---

## المرحلة 3: إظهار قسم المستخلصات في واجهة العقد ⭐ الأهم

### 3.1 تعديل SubcontractDetailView — إضافة قسم المستخلصات

**الملف:** `apps/web/modules/saas/projects/components/subcontracts/SubcontractDetailView.tsx`

**هذا هو التعديل الأهم — الواجهة الحالية تعرض: سجل الدفعات → مراحل الدفع → أوامر التغيير. يجب إضافة قسم المستخلصات.**

**أضف قسم "المستخلصات" كقسم جديد — ضعه بعد "نطاق العمل" وقبل "سجل الدفعات":**

**الترتيب المطلوب للأقسام:**
```
1. Header (الموجود — لا تعدّله)
2. بطاقات الإحصائيات (الموجود — لا تعدّله)
3. نطاق العمل (الموجود — لا تعدّله)
4. ⭐ المستخلصات (جديد) ← أضف هنا
5. سجل الدفعات (الموجود — عدّل فقط لإضافة ربط بالمستخلص)
6. مراحل الدفع (الموجود — لا تعدّله)
7. أوامر التغيير (الموجود — لا تعدّله)
```

**قسم المستخلصات يحتوي على:**

```
┌─────────────────────────────────────────────────────────────┐
│  📋 المستخلصات                           [+ مستخلص جديد]   │
│  3 مستخلصات                                                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ #1 │ مستخلص جاري │ ✅ معتمد │ SAR 25,000 │ 🖨️ طباعة  ││
│  │    │ 15/03/2026   │          │ صافي: SAR 22,500│ عرض ← ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ #2 │ مستخلص جاري │ ⏳ قيد المراجعة │ SAR 18,000│       ││
│  │    │ 22/03/2026   │                  │          │ عرض ← ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ #3 │ مستخلص جاري │ 📝 مسودة │ SAR 0     │ تعديل ←     ││
│  │    │ 29/03/2026   │          │           │              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  إذا لا توجد مستخلصات:                                      │
│  "لا توجد مستخلصات بعد. أنشئ أول مستخلص..."               │
└─────────────────────────────────────────────────────────────┘
```

**كل صف في قائمة المستخلصات يعرض:**
- رقم المستخلص (#1, #2, ...)
- النوع (جاري / ختامي / محتجزات) — badge ملوّن
- الحالة (مسودة / مقدّم / قيد المراجعة / معتمد / مرفوض / مدفوع) — badge ملوّن
- المبلغ الإجمالي (grossAmount)
- صافي المستحق (netAmount)
- تاريخ الإنشاء
- أزرار:
  - "عرض" → يوجه لصفحة تفاصيل المستخلص (SubcontractClaimDetailView)
  - "طباعة" 🖨️ → يفتح صفحة الطباعة في tab جديد (فقط إذا status ≠ DRAFT)
  - "تعديل" → (فقط إذا DRAFT)

**زر "مستخلص جديد":**
- يفتح dialog لإنشاء مستخلص جديد (انظر المرحلة 3.2)
- يظهر فقط إذا العقد في حالة ACTIVE
- يجلب بنود العقد (SubcontractItem) ويملأ بنود المستخلص تلقائياً مع:
  - contractQty و unitPrice من بنود العقد
  - prevCumulativeQty محسوب تلقائياً من المستخلصات السابقة المعتمدة
  - thisQty = 0 (المستخدم يدخلها)

### 3.2 إنشاء مكون dialog لإنشاء/تعديل المستخلص

**الملف الجديد:** `apps/web/modules/saas/projects/components/subcontracts/SubcontractClaimDialog.tsx`

**الـ dialog يحتوي على:**

```
┌─────────────────────────────────────────────────────────────┐
│                    إنشاء مستخلص جديد                        │
├─────────────────────────────────────────────────────────────┤
│  عنوان المستخلص: [________________________]                 │
│  نوع المستخلص:  ○ جاري  ○ ختامي  ○ استرداد محتجزات         │
│                                                              │
│  ──── جدول الكميات (مملوء تلقائياً من بنود العقد) ────       │
│                                                              │
│  │ الوصف      │ كمية │ وحدة │ سعر  │ سابق │ الحالي │ المبلغ│
│  │            │العقد │      │الوحدة│تراكمي│ (أدخل)│       │
│  ├────────────┼──────┼──────┼──────┼──────┼───────┼───────│
│  │ أعمال لياسة│ 100  │ م²   │ 45   │ 30   │ [20]  │ 900  │
│  │ أعمال بلاط │ 200  │ م²   │ 60   │ 0    │ [50]  │ 3000 │
│  │ ...        │      │      │      │      │       │       │
│  └────────────┴──────┴──────┴──────┴──────┴───────┴───────┘
│                                                              │
│  ⚠️ تنبيه: بند "أعمال لياسة" — الكمية تتجاوز التعاقدية     │
│                                                              │
│  ──── الملخص المالي (محسوب تلقائياً) ────                     │
│  إجمالي البنود ................... SAR 3,900.00              │
│  (-) حسم الاحتفاظ (10%) ......... SAR   390.00              │
│  (-) خصم الدفعة المقدمة ......... SAR     0.00              │
│  (+) ضريبة (15%) ................ SAR   526.50              │
│  = صافي المستحق ................. SAR 4,036.50              │
│                                                              │
│  ──── حسميات إضافية (اختياري — مطوي) ▼ ────                  │
│  │ الغرامات: [0.00]                                    │     │
│  │ حسميات أخرى: [0.00]  وصف: [____________]            │     │
│                                                              │
│  ملاحظات: [________________________________]                 │
│                                                              │
│  [إلغاء]                              [حفظ كمسودة] [تقديم]  │
└─────────────────────────────────────────────────────────────┘
```

**السلوك:**
- عند فتح الـ dialog لمستخلص جديد:
  1. اجلب بنود العقد (SubcontractItem)
  2. لكل بند، احسب prevCumulativeQty من المستخلصات السابقة المعتمدة
  3. اعرض الجدول مع thisQty = 0 (المستخدم يدخل)
  4. عند تغيير أي thisQty → أعد حساب thisAmount والملخص المالي فورياً (client-side)
  5. إذا `prevCumulativeQty + thisQty > contractQty` → اعرض تحذير أصفر (لا تمنع الإدخال)
  
- **"حفظ كمسودة"** → يُنشئ المستخلص بحالة DRAFT
- **"تقديم"** → يُنشئ بحالة SUBMITTED مباشرة (أو DRAFT ثم updateStatus → SUBMITTED)

- عند فتح الـ dialog لتعديل مستخلص DRAFT:
  - يملأ البيانات الموجودة
  - يسمح بالتعديل

### 3.3 تعديل SubcontractClaimDetailView — إضافة workflow الاعتماد

**الملف:** `apps/web/modules/saas/projects/components/subcontracts/SubcontractClaimDetailView.tsx`

**تأكد أن هذا المكون يعرض:**

1. **Header مع معلومات المستخلص + أزرار الإجراءات:**
   ```
   [المستخلص #2 — مستخلص جاري]  [⏳ قيد المراجعة]
   
   أزرار حسب الحالة:
   - DRAFT:        [✏️ تعديل]  [📤 تقديم]  [🗑️ حذف]
   - SUBMITTED:    [👁️ بدء المراجعة]
   - UNDER_REVIEW: [✅ اعتماد]  [❌ رفض]
   - APPROVED:     [🖨️ طباعة]  [💰 تسجيل دفعة]  [📄 إنشاء سند صرف]
   - PARTIALLY_PAID: [🖨️ طباعة]  [💰 تسجيل دفعة]
   - PAID:         [🖨️ طباعة]
   - REJECTED:     [📝 تعديل وإعادة تقديم]  [🗑️ إلغاء]
   ```

2. **بطاقات KPI:**
   - إجمالي البنود (grossAmount)
   - إجمالي الحسميات (retention + advance + penalty + other)
   - صافي المستحق (netAmount)
   - المدفوع (paidAmount)

3. **جدول البنود (items)** مع أعمدة:
   - الوصف، الوحدة، كمية العقد، سعر الوحدة
   - الكمية التراكمية السابقة، كمية هذا المستخلص، الكمية التراكمية الكلية
   - نسبة الإنجاز (%) — شريط تقدم ملوّن
   - قيمة الأعمال السابقة، قيمة الأعمال الحالية، القيمة الإجمالية

4. **ملخص مالي تفصيلي:**
   - مثل الـ dialog لكن read-only
   - يعرض المبلغ بالحروف العربية (numberToArabicWords)

5. **زر الطباعة:**
   - يفتح صفحة الطباعة في tab جديد
   - `window.open(\`...claims/\${claimId}/print\`, '_blank')`

### 3.4 تعديل نموذج الدفعة — إضافة ربط بالمستخلص (اختياري)

**الملف:** `SubcontractDetailView.tsx` — قسم "تسجيل دفعة جديدة"

**في نموذج تسجيل الدفعة الحالي (الذي يظهر في الصورة 3)، أضف:**

```
┌─────────────────────────────────────────────────────────────┐
│  تسجيل دفعة جديدة                                          │
│                                                              │
│  مبلغ الدفعة *  │  تاريخ الدفع *  │  طريقة الدفع           │
│  [0.00 ر.س]     │  [٢٩/٠٣/٢٠٢٦]  │  [تحويل بنكي ▼]       │
│                                                              │
│  حساب الصرف     │  مرحلة الدفع     │  ربط بمستخلص (جديد)   │
│  [اختر ▼]       │  [بدون ربط ▼]    │  [بدون ربط ▼]         │
│                                       │  ○ بدون ربط (دفعة مباشرة)
│                                       │  ○ المستخلص #1 (معتمد — SAR 22,500)
│                                       │  ○ المستخلص #2 (معتمد — SAR 18,000)
│                                                              │
│  رقم المرجع     │  الوصف                                    │
│  [___________]  │  [_________________________________]      │
│                                                              │
│  [تسجيل الدفعة 💾]   [إلغاء]                                │
└─────────────────────────────────────────────────────────────┘
```

**السلوك:**
- القائمة المنسدلة "ربط بمستخلص" تعرض فقط المستخلصات بحالة APPROVED أو PARTIALLY_PAID
- تعرض لكل مستخلص: الرقم + الصافي المتبقي (netAmount - paidAmount)
- الخيار الافتراضي "بدون ربط (دفعة مباشرة)" ← **السلوك الحالي يبقى كما هو**
- عند اختيار مستخلص: حقل المبلغ يُملأ تلقائياً بالمتبقي (قابل للتعديل)
- عند الحفظ: يمرر `claimId` في الـ API call

**⚠️ مهم جداً: الدفعة بدون مستخلص يجب أن تبقى تعمل بالضبط كما هي. فقط أضف خيار الربط كإضافة.**

### ✅ تحقق المرحلة 3
```powershell
npx tsc --noEmit
```

---

## المرحلة 4: نموذج الطباعة

### 4.1 إنشاء مكون الطباعة

**الملف الجديد:** `apps/web/modules/saas/projects/components/subcontracts/SubcontractClaimPrintTemplate.tsx`

**مكون React يستقبل `printData` من `getClaimPrintData` ويعرض نموذج مستخلص بالنمط السعودي:**

```
┌─────────────────────────────────────────────────────────┐
│  [شعار]     اسم المنشأة (عربي + إنجليزي)               │  القسم 1
│              العنوان • السجل التجاري • الرقم الضريبي     │
├─────────────────────────────────────────────────────────┤
│              مستخلص مقاول باطن                           │  القسم 2
│              أعمال [نطاق العمل]                          │
│              المستخلص رقم X من Y                         │
├──────────────────────┬──────────────────────────────────┤
│ تاريخ بداية العمل    │ اسم المشروع                      │  القسم 3
│ تاريخ الإتمام        │ الموقع                            │
│ مدة المشروع (بالشهور)│ رقم المشروع                      │
│ اسم المقاول          │ طبيعة الأعمال                     │
│                      │ شروط الدفع                       │
├──────────────────────┴──────────────────────────────────┤
│                    البيان المالي                         │  القسم 4
│  قيمة العقد ........................... XXX,XXX.XX     │
│  الأوامر التغييرية ..................... XXX.XX          │
│  الإجمالي ............................. XXX,XXX.XX     │
│  الأعمال المنفذة حتى تاريخه ........... XXX,XXX.XX     │
│  الأعمال المنفذة السابقة .............. XXX,XXX.XX     │
│  الأعمال الحالية ...................... XXX,XXX.XX     │
│  إجمالي الحسميات ...................... XXX.XX          │
│  صافي المستحق ........................ XXX,XXX.XX     │
├─────────────────────────────────────────────────────────┤
│               جدول الكميات                              │  القسم 5
│ # │ الوصف │كمية العقد│وحدة│سابق│حالي│تراكمي│%│سعر│..│  │
│───┼───────┼─────────┼────┼────┼────┼──────┼─┼───┼──│  │
│ 1 │أعمال..│         │    │    │    │      │ │   │  │  │
│ 2 │...    │         │    │    │    │      │ │   │  │  │
│   │ المجموع       │    │    │    │      │ │   │  │  │
├─────────────────────────────────────────────────────────┤
│               الحسميات                                  │  القسم 6
│  حسم الاحتفاظ (X%) — تصرف عند انتهاء الأعمال          │
│  ما سبق صرفه من مستخلصات سابقة                         │
│  خصم الدفعة المقدمة                                     │
│  الغرامات (إذا > 0)                                     │
│  حسميات أخرى (إذا > 0)                                  │
│  ضريبة القيمة المضافة (إذا مفعّلة)                      │
│  ────────────────────────────────────                    │
│  إجمالي الحسميات                                        │
│                                                          │
│  ** صافي المستحق: XXX,XXX.XX ريال سعودي **             │
│  المبلغ بالحروف: .............................          │
├─────────────────────────────────────────────────────────┤
│  مهندس المشروع │ المكتب الفني │ معتمد المشروع │ مدير   │  القسم 7
│  _____________ │ ____________ │ _____________ │ ______ │
│                                                          │
│  المدير التنفيذي │ المالي/الحسابات │ المدير العام        │
│  _______________ │ ________________ │ _____________       │
└─────────────────────────────────────────────────────────┘
```

**قواعد التنسيق:**
- `@media print` CSS — حجم A4 (210mm × 297mm) — margin: 10mm 15mm
- `-webkit-print-color-adjust: exact` لطباعة الخلفيات
- RTL كامل — Tailwind logical properties (`ms-`, `me-`, `start-`, `end-`)
- الأرقام: `new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2 })`
- شعار المنشأة: `<img src={organization.logo}>` مع fallback لاسم المنشأة
- صف المجاميع: خلفية رمادية فاتحة + bold
- صافي المستحق: خط كبير بارز
- الجداول: `border border-black` واضحة ومقروءة

### 4.2 إنشاء صفحة الطباعة (Route)

**الملف الجديد:**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/subcontracts/[subcontractId]/claims/[claimId]/print/page.tsx
```

**و:**
```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/subcontracts/[subcontractId]/claims/[claimId]/print/loading.tsx
```

**page.tsx:**
```typescript
// Server Component
// 1. يجلب printData من getClaimPrintData API
// 2. يعرض ClaimPrintPage (client component)
```

### 4.3 إنشاء مكون ClaimPrintPage

**الملف الجديد:** `apps/web/modules/saas/projects/components/subcontracts/ClaimPrintPage.tsx`

```typescript
"use client";
// يعرض:
// 1. شريط أدوات (class="no-print" — لا يُطبع):
//    - زر "طباعة" → window.print() + markAsPrinted API
//    - زر "رجوع" → router.back()
//    - badge حالة المستخلص
// 2. <SubcontractClaimPrintTemplate data={printData} />
```

### ✅ تحقق المرحلة 4
```powershell
npx tsc --noEmit
```

---

## المرحلة 5: التحسينات

### 5.1 Validation — تحذير تجاوز قيمة العقد

**الملف:** `subcontract-claims.ts` — في create و update

```typescript
// بعد حساب grossAmount:
// اجلب مجموع grossAmount من المستخلصات المعتمدة السابقة
// إذا totalClaimed > contractAdjustedValue → سجّل تحذير في audit (لا تمنع)
```

### 5.2 حساب prevCumulativeQty تلقائي

**الملف:** `subcontract-claims.ts` — أو في SubcontractClaimDialog.tsx (frontend)

عند إنشاء مستخلص جديد:
```typescript
// لكل بند في العقد:
// اجلب آخر مستخلص معتمد واحسب:
// prevCumulativeQty = Σ(thisQty) من كل المستخلصات المعتمدة لهذا البند
```

### 5.3 ربط المستخلص بسند صرف

**في SubcontractClaimDetailView — عند حالة APPROVED:**
- زر "إنشاء سند صرف" يوجه لصفحة إنشاء سند صرف مع pre-fill:
```
/finance/payment-vouchers/new?payeeType=SUBCONTRACTOR&subcontractContractId={id}&amount={netAmount}&projectId={projectId}
```

### 5.4 إضافة عرض نسبة الإنجاز

**في جدول البنود (ClaimDetailView و ClaimDialog):**
- عمود نسبة الإنجاز: `((prevCumulativeQty + thisQty) / contractQty × 100)`
- أخضر ≥ 100%، برتقالي ≥ 50%، أحمر < 50%

### 5.5 عرض المبلغ بالحروف العربية

**في ClaimDetailView وفي الـ print template:**
```typescript
import { numberToArabicWords } from "@masar/utils";
// عرض تحت netAmount
```

### ✅ تحقق المرحلة 5
```powershell
npx tsc --noEmit
```

---

## المرحلة 6: التحقق النهائي

### 6.1 TypeScript Check
```powershell
npx tsc --noEmit
```

### 6.2 Full Build
```powershell
pnpm build
```

### 6.3 Commit
```powershell
git add -A
git commit -m "feat(subcontracts): complete claims UI + print template + payment linking

- Show claims section in SubcontractDetailView (was backend-only)
- Add SubcontractClaimDialog for creating/editing claims with auto-filled items
- Add claim approval workflow buttons (submit → review → approve/reject)
- Add claim-to-payment linking (optional - direct payment still works)
- Add SubcontractClaimPrintTemplate (Saudi-standard format)
- Add print page route with organization logo/details
- Add penaltyAmount, otherDeductions fields to SubcontractClaim schema
- Update netAmount calculation to include new deduction fields
- Add getClaimPrintData procedure (all-in-one print data)
- Add markAsPrinted procedure with audit logging
- Add auto-calculation of prevCumulativeQty from previous approved claims
- Add completion percentage display per item
- Add amount in Arabic words (numberToArabicWords)
- Add quantity exceeded warning (non-blocking)
- Add link to create payment voucher from approved claim
- Add ar.json + en.json translation keys for all claim UI"
```

---

## ملخص الملفات

### ملفات جديدة:
```
apps/web/modules/saas/projects/components/subcontracts/SubcontractClaimDialog.tsx      ← إنشاء/تعديل مستخلص
apps/web/modules/saas/projects/components/subcontracts/SubcontractClaimPrintTemplate.tsx ← نموذج الطباعة
apps/web/modules/saas/projects/components/subcontracts/ClaimPrintPage.tsx               ← صفحة الطباعة client
apps/web/app/.../claims/[claimId]/print/page.tsx                                        ← route الطباعة
apps/web/app/.../claims/[claimId]/print/loading.tsx                                     ← skeleton
```

### ملفات معدّلة (التعديلات بالتفصيل):
```
packages/database/prisma/schema/subcontract.prisma
  └─ إضافة: penaltyAmount, otherDeductions, otherDeductionsNote, signatories, printedAt, notes

packages/api/modules/projects/procedures/subcontract-claims.ts
  └─ تعديل: حساب netAmount ليشمل penalty + otherDeductions
  └─ إضافة: getClaimPrintData, markAsPrinted

packages/api/modules/projects/router.ts
  └─ إضافة: تسجيل getPrintData + markAsPrinted

apps/web/modules/saas/projects/components/subcontracts/SubcontractDetailView.tsx ⭐
  └─ إضافة: قسم المستخلصات (قائمة + زر إنشاء + أيقونة طباعة)
  └─ تعديل: نموذج الدفعة — إضافة قائمة "ربط بمستخلص" اختيارية

apps/web/modules/saas/projects/components/subcontracts/SubcontractClaimDetailView.tsx
  └─ إضافة: أزرار workflow (تقديم/مراجعة/اعتماد/رفض)
  └─ إضافة: زر طباعة + زر إنشاء سند صرف
  └─ إضافة: عرض الحقول الجديدة (penalty, otherDeductions)
  └─ إضافة: نسبة الإنجاز + المبلغ بالحروف

apps/web/messages/ar.json
  └─ إضافة: كتلة subcontractClaim كاملة

apps/web/messages/en.json
  └─ إضافة: الترجمة الإنجليزية المقابلة
```

### ملفات لا تُلمس:
```
packages/api/lib/accounting/auto-journal.ts     ← يستخدم netAmount المحسوب — يتكيف تلقائياً
packages/auth/**
apps/web/middleware.ts
```

---

## ⚠️ تنبيهات حرجة

1. **الدفعة بدون مستخلص يجب أن تبقى تعمل.** لا تكسر السلوك الحالي. حقل "ربط بمستخلص" هو إضافة اختيارية فقط.

2. **auto-journal لا يحتاج تعديل.** عند الاعتماد يستدعي `onSubcontractClaimApproved(netAmount)` — و netAmount الجديد (بعد خصم الغرامات) يُمرر تلقائياً.

3. **الحقول الجديدة كلها optional مع default 0.** لا تحتاج data migration. المستخلصات الموجودة تعمل بدون أي تأثير.

4. **الطباعة بـ CSS `@media print`** — لا تستخدم مكتبة PDF خارجية. أبسط وأسرع. المستخدم يختار "حفظ كـ PDF" من المتصفح.

5. **RTL everywhere:** Tailwind logical properties فقط (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`).

6. **Decimal types:** في Zod schema استخدم `z.union([z.string(), z.number()])` — النمط الموجود في المشروع.

7. **organizationId:** على كل query — النمط الموجود.

8. **subscriptionProcedure:** لكل عمليات الكتابة — النمط الموجود.
