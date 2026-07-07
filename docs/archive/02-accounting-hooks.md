# الملف 2: ربط العمليات — إصلاح وتكميل كل Hooks العمليات المالية

## ⛔ القائمة الحمراء — لا تلمس:
```
- packages/api/lib/pricing/
- packages/api/lib/structural-calculations.ts
- apps/web/modules/saas/pricing/
- packages/api/modules/quantities/
- apps/web/modules/saas/projects/components/execution/
```

## ⚠️ تعليمات إلزامية:
```
- اقرأ كل ملف بالكامل قبل أي تعديل
- لا تغيّر منطق العمليات المالية الأصلي (إنشاء فاتورة، دفع، حذف...)
- فقط أضف/أصلح الـ hooks المحاسبية بعد نجاح العملية المالية
- كل hook يجب أن يكون داخل try/catch — فشل القيد لا يُفشل العملية المالية
- تأكد أن referenceType فريد لكل نوع عملية
- تأكد أن referenceId فريد لكل عملية مفردة
- نفّذ tsc --noEmit بعد كل مرحلة فرعية
```

## 🔑 المبدأ الأساسي:
```
العمليات المالية هي المصدر الأصلي (source of truth)
القيود المحاسبية هي انعكاس تلقائي للعمليات المالية
فشل القيد = تسجيل في audit log + استمرار العملية المالية
```

---

## المرحلة 1: إصلاح المشاكل الحرجة والعالية (Bugs 1-3)

### الهدف:
إصلاح المشاكل الثلاث الأخطر المكتشفة في التدقيق

---

### المرحلة الفرعية 1.1: إصلاح رفض مستخلص الباطن (🔴 حرج — Bug #1)

**اقرأ أولاً:**
```
packages/api/modules/subcontracts/procedures/update-claim-status.ts — بالكامل
packages/api/modules/project-finance/procedures/update-claim-status.ts — بالكامل (كمرجع — هذا يعمل صحيح)
packages/api/lib/accounting/auto-journal.ts — الدالة reverseAutoJournalEntry
```

**المشكلة:**
- subcontracts/update-claim-status.ts يستدعي `onSubcontractClaimApproved` عند APPROVED (سطر 53-73)
- لكنه **لا يستدعي** `reverseAutoJournalEntry` عند REJECTED
- بينما project-finance/update-claim-status.ts يفعل ذلك عند رفض مستخلص المشروع
- النتيجة: رفض مستخلص باطن يترك قيد استحقاق خاطئ (DR تكاليف 5200 / CR ذمم دائنة 2120) في الدفاتر

**المطلوب:**
1. في `subcontracts/update-claim-status.ts`:
   - ابحث عن الشرط الذي يتحقق من حالة REJECTED
   - بعد تحديث حالة المستخلص إلى REJECTED بنجاح:
   ```typescript
   // عكس قيد الاستحقاق عند رفض المستخلص
   try {
     const { reverseAutoJournalEntry } = await import("@/lib/accounting/auto-journal");
     await reverseAutoJournalEntry({
       organizationId,
       referenceType: "SUBCONTRACT_CLAIM_APPROVED",
       referenceId: claimId,
       userId: ctx.session.user.id,
       db,
     });
   } catch (error) {
     console.error("[AutoJournal] Failed to reverse subcontract claim entry:", error);
   }
   ```
2. تأكد أن referenceType يطابق بالضبط ما يستخدمه `onSubcontractClaimApproved` عند الإنشاء
3. اقرأ `onSubcontractClaimApproved` للتأكد من الـ referenceType الصحيح

**ملف التحقق:** `tsc --noEmit`

---

### المرحلة الفرعية 1.2: إصلاح حذف مستخلص الباطن (Bug #5)

**اقرأ أولاً:**
```
packages/api/modules/subcontracts/procedures/ — ابحث عن delete-claim أو ملف حذف المستخلص
```

**المطلوب:**
1. ابحث عن procedure حذف مستخلص الباطن
2. إذا وُجد: أضف reverseAutoJournalEntry قبل الحذف (بنفس نمط الرفض في 1.1)
3. إذا لم يوجد procedure حذف: 
   - تحقق هل الحذف ممكن أصلاً من الواجهة
   - إذا لا: لا تفعل شيء — سجّل ملاحظة فقط
   - إذا نعم: أنشئ procedure حذف يعكس القيد أولاً ثم يحذف

**ملف التحقق:** `tsc --noEmit`

---

### المرحلة الفرعية 1.3: إصلاح bankAccountId في الرواتب (🟠 عالي — Bug #3)

**اقرأ أولاً:**
```
packages/api/modules/company/procedures/payroll.ts — بالكامل، خاصة approve procedure
packages/api/lib/accounting/auto-journal.ts — الدالة onPayrollApproved
packages/database/prisma/schema.prisma — model PayrollRun
```

**المشكلة:**
- في payroll.ts عند الاعتماد، sourceAccountId يكون undefined
- القيد يسقط على fallback ← حساب بنك افتراضي (قد لا يكون صحيح)
- الرواتب يجب أن تُسجل على حساب البنك الذي دُفعت منه فعلاً

**المطلوب:**
1. في schema.prisma — أضف حقل bankAccountId في PayrollRun:
   ```prisma
   bankAccountId    String?   @db.Uuid
   bankAccount      OrganizationBank? @relation(fields: [bankAccountId], references: [id])
   ```
2. في approve procedure في payroll.ts:
   - أضف bankAccountId كمُدخل اختياري في الـ schema
   - إذا لم يُمرر، استخدم البنك الافتراضي (defaultBankAccount)
   - مرّر sourceAccountId بشكل صريح لـ onPayrollApproved
3. في onPayrollApproved في auto-journal.ts:
   - تأكد أن sourceAccountId يُستخدم بدلاً من undefined
   - أزل الـ TODO comment إذا موجود
4. حدّث الواجهة (approve dialog في payroll):
   - أضف dropdown اختياري لاختيار البنك
   - القيمة الافتراضية = البنك الافتراضي للمنظمة

**نفّذ:**
```bash
pnpm --filter database generate
tsc --noEmit
```

---

### المرحلة الفرعية 1.4: Build verification

```bash
pnpm --filter database generate
tsc --noEmit
pnpm build
```

---

## المرحلة 2: إصلاح المشاكل المتوسطة (Bugs 4-7)

### الهدف:
إصلاح كل المشاكل المتوسطة في الـ hooks الموجودة

---

### المرحلة الفرعية 2.1: إضافة reverse+recreate عند تعديل المقبوض المباشر (Bug #6)

**اقرأ أولاً:**
```
packages/api/modules/finance/procedures/payments.ts — ابحث عن update procedure
packages/api/modules/company/procedures/expense-payments.ts — كمرجع (هذا يعمل صحيح)
packages/api/lib/accounting/auto-journal.ts — onOrganizationPaymentReceived + reverseAutoJournalEntry
```

**المشكلة:**
- updateOrgPaymentProcedure يُعدّل المقبوض (مبلغ، حساب بنك...) لكن لا يعكس/يعيد إنشاء القيد
- النتيجة: القيد يبقى بالمبلغ القديم

**المطلوب:**
1. في update procedure في payments.ts:
   - بعد نجاح التحديث
   - تحقق هل المبلغ أو البنك تغيّر (قارن القيم القديمة بالجديدة)
   - إذا تغيّر أي منهما:
     ```typescript
     try {
       // 1. عكس القيد القديم
       await reverseAutoJournalEntry({
         organizationId,
         referenceType: "ORG_PAYMENT",
         referenceId: paymentId,
         userId: ctx.session.user.id,
         db,
       });
       // 2. إنشاء قيد جديد بالقيم المحدّثة
       await onOrganizationPaymentReceived({
         organizationId,
         paymentId,
         amount: updatedAmount,
         destinationAccountId: updatedBankId,
         userId: ctx.session.user.id,
         db,
       });
     } catch (error) {
       console.error("[AutoJournal] Failed to update payment entry:", error);
     }
     ```
2. تأكد أن القيم المُمررة هي القيم **المُحدّثة** وليست القديمة

**ملف التحقق:** `tsc --noEmit`

---

### المرحلة الفرعية 2.2: إضافة reverse+recreate عند تعديل فاتورة بعد الإصدار (Bug #7)

**اقرأ أولاً:**
```
packages/api/modules/finance/procedures/create-invoice.ts — بالكامل، خاصة update procedure
packages/api/lib/accounting/auto-journal.ts — onInvoiceIssued + reverseAutoJournalEntry
```

**المشكلة:**
- تعديل فاتورة ISSUED (تغيير مبلغ أو بنود) لا يُحدّث القيد
- النتيجة: القيد يبقى بالمبلغ القديم

**المطلوب:**
1. أولاً: اقرأ update procedure وافهم متى يُسمح بالتعديل (هل فقط DRAFT أم حتى ISSUED؟)
2. إذا التعديل مسموح لـ ISSUED:
   - بعد نجاح التحديث
   - تحقق هل المبلغ أو نسبة الضريبة أو الخصم تغيّر
   - إذا تغيّر:
     ```typescript
     try {
       // فقط إذا الفاتورة ISSUED (لها قيد)
       if (invoice.status !== "DRAFT") {
         await reverseAutoJournalEntry({
           organizationId,
           referenceType: "INVOICE",
           referenceId: invoiceId,
           userId: ctx.session.user.id,
           db,
         });
         await onInvoiceIssued({
           organizationId,
           invoiceId,
           totalAmount: updatedTotal,
           vatAmount: updatedVat,
           userId: ctx.session.user.id,
           db,
         });
       }
     } catch (error) {
       console.error("[AutoJournal] Failed to update invoice entry:", error);
     }
     ```
3. إذا التعديل غير مسموح لـ ISSUED: لا تفعل شيء — سجّل ملاحظة

**ملف التحقق:** `tsc --noEmit`

---

### المرحلة الفرعية 2.3: التحقق من مصروفات المشاريع (Bug #10)

**اقرأ أولاً:**
```
packages/api/modules/project-finance/procedures/ — ابحث عن create-expense أو expense
packages/api/modules/finance/procedures/expenses.ts — كمرجع
```

**المشكلة:**
- project-finance/create-expense.ts قد لا يحتوي hook محاسبي
- لكن مصروفات المشاريع قد تُنشئ FinanceExpense الذي يحتوي hook بالفعل

**المطلوب:**
1. اقرأ create-expense في project-finance وافهم الـ flow:
   - هل يُنشئ FinanceExpense مباشرة (الذي يحتوي hook)؟
   - أم يُنشئ ProjectExpense منفصل بدون hook؟
2. إذا يمر عبر FinanceExpense → لا تفعل شيء ✅ (Hook موجود بالفعل)
3. إذا يُنشئ ProjectExpense مستقل:
   - أضف hook بنفس نمط onExpenseCompleted
   - أو أعد توجيهه ليمر عبر FinanceExpense

**سجّل ما وجدته في comment أعلى الملف.**

**ملف التحقق:** `tsc --noEmit`

---

### المرحلة الفرعية 2.4: Build verification

```bash
tsc --noEmit
pnpm build
```

---

## المرحلة 3: تكميل Hooks المفقودة

### الهدف:
إضافة hooks لأي عملية مالية لا تُنشئ قيداً حالياً

---

### المرحلة الفرعية 3.1: مراجعة شاملة لكل العمليات المالية

**اقرأ:**
```
packages/api/modules/finance/procedures/ — كل الملفات
packages/api/modules/subcontracts/procedures/ — كل الملفات
packages/api/modules/company/procedures/ — كل الملفات (payroll, expense-payments)
packages/api/modules/project-finance/procedures/ — كل الملفات
```

**المطلوب:**
1. أنشئ قائمة بكل العمليات المالية التي تُنشئ/تعدّل/تحذف أي شيء مالي
2. لكل عملية: هل تستدعي hook محاسبي؟ وما هو؟
3. حدد أي عمليات **بدون** hook
4. سجّل القائمة كتعليق في أعلى auto-journal.ts:
```typescript
/**
 * خريطة العمليات المالية والـ Hooks المحاسبية:
 * ✅ = hook موجود ويعمل
 * ❌ = hook مفقود
 * 
 * الفواتير:
 *   ✅ إصدار فاتورة → onInvoiceIssued (INVOICE)
 *   ✅ تحصيل فاتورة → onInvoicePaymentReceived (INVOICE_PAYMENT)
 *   ...
 */
```

---

### المرحلة الفرعية 3.2: إضافة hooks لأوامر التغيير (Change Orders) إذا مفقودة

**اقرأ أولاً:**
```
packages/api/modules/project-finance/procedures/ — ابحث عن change-order
packages/database/prisma/schema.prisma — model ProjectChangeOrder
```

**المطلوب:**
1. اقرأ وافهم: هل أوامر التغيير تُعدّل قيمة العقد فقط أم تُنشئ التزام مالي فعلي؟
2. إذا تُنشئ التزام مالي (مثل مستخلص):
   - أضف hook عند الاعتماد
   - أضف reversal عند الرفض/الإلغاء
3. إذا فقط تُعدّل قيمة العقد:
   - لا حاجة لـ hook محاسبي (لا تأثير مالي مباشر)
   - سجّل ملاحظة

---

### المرحلة الفرعية 3.3: التأكد من تغطية كل حالات الإلغاء والحذف

**المطلوب:**
لكل عملية تُنشئ قيداً، تأكد أن الإلغاء/الحذف/الرفض يعكس القيد:

| العملية | إنشاء قيد | عكس عند حذف | عكس عند إلغاء | عكس عند رفض |
|---------|----------|-------------|--------------|------------|
| فاتورة | ✅ onInvoiceIssued | ✅ تحقق | N/A | N/A |
| دفعة فاتورة | ✅ onInvoicePaymentReceived | ✅ تحقق | N/A | N/A |
| مصروف | ✅ onExpenseCompleted | ✅ تحقق | ✅ تحقق | N/A |
| مقبوض | ✅ onOrganizationPaymentReceived | ✅ تحقق | N/A | N/A |
| تحويل | ✅ onTransferCompleted | N/A | ✅ تحقق | N/A |
| مستخلص مشروع | ✅ onProjectClaimApproved | N/A | N/A | ✅ تحقق |
| دفعة مشروع | ✅ onProjectPaymentReceived | ✅ تحقق | N/A | N/A |
| مستخلص باطن | ✅ onSubcontractClaimApproved | ✅ تحقق | N/A | ✅ أُصلح في 1.1 |
| دفعة باطن | ✅ onSubcontractPayment | ✅ تحقق | N/A | N/A |
| رواتب | ✅ onPayrollApproved | N/A | ✅ تحقق | N/A |
| مصروف شركة | ✅ onExpenseCompleted | ✅ تحقق | N/A | N/A |
| إشعار دائن | ✅ onCreditNoteIssued | ✅ تحقق | N/A | N/A |

**لكل خلية "تحقق":** اقرأ الملف الفعلي وتأكد. إذا مفقود — أضفه.

---

### المرحلة الفرعية 3.4: Build verification

```bash
tsc --noEmit
pnpm build
```

---

## المرحلة 4: اختبار الدورة الكاملة وضمان السلامة

### الهدف:
التأكد أن كل شيء يعمل كوحدة واحدة متكاملة

---

### المرحلة الفرعية 4.1: إنشاء ملف اختبار شامل

**أنشئ ملف:** `packages/api/__tests__/accounting/full-cycle.test.ts`

**المحتوى:**
```typescript
/**
 * اختبارات الدورة المحاسبية الكاملة
 * 
 * هذا الملف يختبر كل السيناريوهات:
 * 1. دورة فاتورة كاملة (إنشاء → إصدار → دفعة → حذف دفعة → حذف فاتورة)
 * 2. دورة مقاول باطن (عقد → مستخلص → اعتماد → دفعة → رفض)
 * 3. دورة مشروع (مستخلص → اعتماد → دفعة → تعديل → حذف)
 * 4. دورة مصروف (إنشاء PENDING → دفع → إلغاء)
 * 5. دورة رواتب (إنشاء → اعتماد → إلغاء)
 * 6. تحويلات ومقبوضات
 * 
 * كل اختبار يتحقق:
 * - القيد موجود بعد العملية
 * - القيد متوازن (مدين = دائن)
 * - القيد يحمل referenceType صحيح
 * - العكس يعمل عند الحذف/الإلغاء/الرفض
 * - لا قيود يتيمة بعد الدورة الكاملة
 */

// TODO: كتابة الاختبارات الفعلية عند توفر بيئة اختبار
// الهيكل أعلاه يُستخدم كـ checklist يدوي حتى ذلك الحين
```

---

### المرحلة الفرعية 4.2: إنشاء دالة صحة النظام المحاسبي

**أنشئ ملف:** `packages/database/prisma/queries/accounting-health.ts`

**المحتوى — دالة تفحص صحة البيانات المحاسبية:**
```typescript
export async function checkAccountingHealth(organizationId: string) {
  // 1. فحص: هل كل قيد متوازن؟
  //    SELECT je.id, SUM(debit) - SUM(credit) as diff 
  //    FROM JournalEntryLine GROUP BY je.id HAVING diff != 0
  
  // 2. فحص: هل فيه فواتير صادرة بدون قيد؟
  //    الفواتير ISSUED/PAID التي ليس لها JournalEntry بـ referenceType=INVOICE
  
  // 3. فحص: هل فيه قيود يتيمة؟
  //    قيود بـ referenceType=INVOICE لكن الفاتورة محذوفة
  
  // 4. فحص: هل رصيد البنك في OrganizationBank يتوافق مع القيود؟
  //    قارن bank.balance مع مجموع القيود على حساب البنك
  
  // 5. فحص: هل فيه فئات مصروفات تسقط على fallback؟
  //    ابحث عن مصروفات مسجلة على 6900 التي فئتها لها حساب مخصص
  
  return {
    unbalancedEntries: [],
    invoicesWithoutEntries: [],
    orphanedEntries: [],
    bankBalanceMismatch: [],
    miscategorizedExpenses: [],
    isHealthy: true, // أو false
  };
}
```

---

### المرحلة الفرعية 4.3: إضافة endpoint لفحص صحة المحاسبة

**اقرأ أولاً:**
```
packages/api/modules/accounting/router.ts
```

**المطلوب:**
1. أضف procedure جديد: `accounting.health.check`
   - protectedProcedure (finance.view permission)
   - يستدعي checkAccountingHealth
   - يُعيد النتائج للعرض في لوحة المحاسبة
2. يُستخدم من لوحة المحاسبة لعرض تنبيهات إذا فيه مشاكل

---

### المرحلة الفرعية 4.4: Build verification نهائي

```bash
pnpm --filter database generate
tsc --noEmit
pnpm build
```

---

## ملخص الملف 2:

| ما تم | الحالة |
|-------|--------|
| إصلاح رفض مستخلص الباطن (حرج) | ✅ |
| إصلاح حذف مستخلص الباطن | ✅ |
| إصلاح bankAccountId في الرواتب (عالي) | ✅ |
| إضافة reverse+recreate لتعديل المقبوض | ✅ |
| إضافة reverse+recreate لتعديل الفاتورة | ✅ |
| فحص مصروفات المشاريع | ✅ |
| مراجعة شاملة لكل العمليات | ✅ |
| تغطية كاملة لكل حالات الحذف/الإلغاء/الرفض | ✅ |
| ملف اختبار هيكلي | ✅ |
| دالة فحص صحة المحاسبة | ✅ |
| endpoint فحص الصحة | ✅ |
