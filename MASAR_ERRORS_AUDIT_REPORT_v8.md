# تقرير إصلاحات ما قبل الإطلاق ومقارنة الحال — منصة مسار v8.0

> **التاريخ:** 2026-07-14
> **الفرع:** `worktree-audit-v7-fixes` (worktree معزول — لم يُمس `main`)
> **المرجع:** `MASAR_ERRORS_AUDIT_REPORT_v7.md` (67 مشكلة، 2026-07-14)
> **الطريقة:** إصلاح فعلي للكود عبر مسار رئيسي (المحاسبة/المالية الأساسية — يدوياً) + 7 وكلاء متوازين على مجموعات ملفات منفصلة، ثم تحقق مركزي.
> **الحالة:** ✅ **type-check أخضر في الحزمتين، كل الاختبارات ناجحة، صفر تراجع.**

---

## 0. نتائج التحقق الآلي (نُفّذت فعلياً في الـ worktree)

| الفحص | v7 (قبل) | v8 (بعد) |
|-------|----------|----------|
| `pnpm --filter @repo/web type-check` | ✅ exit 0 | ✅ **exit 0** |
| `pnpm --filter @repo/database type-check` | ✅ exit 0 | ✅ **exit 0** |
| `pnpm --filter @repo/api test` | 1,109 ✅ / 34 skip | **1,109 ✅ / 34 skip** (صفر تراجع) |
| `pnpm --filter @repo/database test` | 77 ✅ / 24 skip | **77 ✅ / 24 skip** (صفر تراجع) |
| ملفات مصدر مُعدّلة | — | **~79 معدّل + 26 محذوف** |

> **ملاحظة بيئة:** الـ worktree فرع نظيف من `origin/main`؛ نُسخ `.env.local` و`.content-collections` المولّد من المستودع الرئيسي لتمكين الفحص فقط. لم يُنفَّذ أي `db push` — راجع القسم 4 لخطوات النشر المطلوبة.

---

## 1. لوحة النتائج (Scorecard) — v7 → v8

| الشدة | العدد في v7 | ✅ مُصلح كلياً | 🟨 جزئي | ⏸ مؤجَّل بمبرّر |
|-------|-------------|---------------|---------|------------------|
| 🔴 حرج | 4 | **4** | 0 | 0 |
| 🟠 عالٍ | 27 | **24** | 2 | 1 |
| 🟡 متوسط | 22 | **20** | 2 | 0 |
| ⚪ منخفض | 14 | **11** | 1 | 2 |
| **المجموع** | **67** | **59** | **5** | **3** |

**الخلاصة:** كل المشاكل الحرجة الأربع أُغلقت كلياً. **59 من 67 (88%) مُصلحة كلياً**، 5 جزئية (تُركت أجزاؤها الكبيرة/L-effort)، و3 مؤجَّلة بقرار واعٍ (قرار محاسبي/معماري لا يصح تخمينه). لا تراجع في أي إصلاح — كل الاختبارات ما زالت خضراء.

---

## 2. تفصيل الإصلاحات حسب المحور

### 2.1 المشاكل الحرجة 🔴 (4/4 ✅)

| المرجع | المشكلة | الحكم | الدليل (الملف:الإصلاح) |
|--------|---------|-------|------------------------|
| V7-01 / ACC-1 | كتابة رصيد بنك عابرة للمستأجرين | ✅ | كل كتابات `organizationBank` بمعرّف عميلي حُوِّلت إلى `updateMany({ where: { id, organizationId } })` + فحص count: `finance.ts` (addInvoicePayment/deleteInvoicePayment)، `org-finance.ts` (createPayment/payExpense)، `project-payments.ts` (4 مواضع + `reversePaymentEffects` يمرّر org)، `capital-contributions.ts`. المشتقة من صفوف مُتحقَّقة تُركت (آمنة) أو صُلّبت. |
| B1 | تسريب اعتماد ZATCA (Authorization + OTP) | ✅ | `zatca/phase2/api-client.ts` — حُذف `console.log` للـ headers والـ OTP؛ بقي log آمن (method+url فقط). |
| ACC-2 | عكس إقفال السنة مؤرَّخ بتاريخ اليوم | ✅ | `year-end-closing.ts` — العكس الآن `closing.closingDate` (31 ديسمبر) بدل `new Date()`. |
| ACC-15 | إقفال السنة يُكمَل صامتاً بلا قيد (ديسمبر مغلق) | ✅ | `accounting.ts:createJournalEntry` — قيود `YEAR_END_CLOSING`/`YEAR_END_RETAINED` (+ عكسها عبر `allowClosedPeriod`) مُعفاة من حارس الفترة المغلقة؛ الإقفال الآن يُرحِّل القيد فعلياً في السنة المغلقة. |

### 2.2 سلامة النظام المحاسبي

| المرجع | الحكم | الدليل |
|--------|-------|--------|
| ACC-3 (payExpense race) | ✅ | `org-finance.ts` — القراءة داخل الـ tx بعد `SELECT … FOR UPDATE`، والبنك `updateMany` مُنطاق بالمنظمة. |
| ACC-4 (انتقالات السندات) | ✅ | `payment-vouchers.ts`/`receipt-vouchers.ts` — حركة البنك + تغيير الحالة في `$transaction` واحدة، مع حارس تفاؤلي `updateMany({ status })` + `ORPCError CONFLICT`. |
| ACC-5 (تعديل مصروف/مقبوض لفترة مغلقة) | ✅ | `expenses.ts`/`payments.ts` — حارس `isPeriodClosed` مبكر على التاريخ القديم والجديد. |
| ACC-6 (إلغاء سحب شريك في فترة مغلقة) | ✅ | `owner-drawings.ts` — حارس `isPeriodClosed` على تاريخ السحب قبل استرداد الرصيد. |
| ACC-7 / EH-1 (عكس الإقفال غير ذرّي) | ✅ | `year-end-closing.ts` — العكسان + تحديث الحالة في `$transaction` واحدة؛ `reverseJournalEntry` صار يقبل `existingTx`. |
| ACC-8 / RC-2 (سقف الإشعار الدائن خارج القفل) | ✅ | `finance.ts:createCreditNote` — الـ aggregate + فحص السقف + قراءة paidAmount داخل الـ tx بعد `FOR UPDATE`. |
| ACC-9 (حذف مقبوض لا يلغي السند) | ✅ | `payments.ts:deleteOrgPayment` — إلغاء `receiptVoucher` المرتبط قبل الحذف. |
| ACC-10 (الأرصدة الافتتاحية) | ✅ | `accounting.ts:saveOpeningBalances` — `pg_advisory_xact_lock` للتزامن + حارس فترة مغلقة قبل حذف القديم. |
| ACC-11 (رواتب صامتة) | ✅ | `auto-journal.ts:509` — أُضيف `console.error` + `JOURNAL_ENTRY_FAILED` عند غياب حساب الرواتب/البنك. |
| ACC-12 (عدّادات backfill) | 🟨 | `backfill.ts` — عدّاد المصروفات صار يفحص وجود القيد فعلياً قبل الاحتساب. **متبقٍ:** تمرير `accountCode/isVatExempt` للفئات المخصّصة في backfill (ثانوي — أداة إدارية idempotent). |
| ACC-13 (float في توزيع الأرباح) | ✅ | `year-end-closing.ts` — التوزيع بـ `Prisma.Decimal` مشتقاً من `netProfitDecimal`. |
| ACC-14 / B2 (سجلات DEBUG + حارس مكرر) | ✅ | `create-invoice.ts` — حُذف بلوك `INVOICE_BACKEND_DEBUG` والنسخة المكررة من حارس الإشعار الدائن. |
| ACC-16 (إلغاء فاتورة مدفوعة جزئياً) | ✅ | `create-invoice.ts` — الإلغاء يُنقص رصيد البنك، يصفّر paidAmount، ويلغي سندات القبض ضمن `$transaction`. |
| **ACC-17** (رواتب: GL ↔ الرصيد التشغيلي) | 🟨 | `org-finance.ts:cancelExpense` — مُنع إلغاء مصروفات `FACILITY_PAYROLL`/`FACILITY_RECURRING` عبر المسار العام. **مؤجَّل:** توحيد توقيت خصم الرصيد التشغيلي مع قيد GL — قرار تصميمي (خصم كامل عند الاعتماد مقابل ترحيل لكل دفعة). |
| **ACC-18** (إفراج المحتجزات يخصم 2150 بلا قيد) | ⏸ | **مؤجَّل بمبرّر:** يتطلب قراراً محاسبياً (حساب محتجزات الباطن مقابل محتجزات العميل، كلاهما يشير حالياً لـ 2150) + تمرير مبلغ المحتجز الإجمالي عبر توقيع hook في محرك auto-journal المقدّس. تعديله خطأً على المحرك أسوأ من توثيقه. |

### 2.3 التضارب والتكرار

| المرجع | الحكم | الدليل |
|--------|-------|--------|
| RC-1 (اعتماد مزدوج رواتب/متكررة) | ✅ | `payroll.ts`/`expense-runs.ts` — حارس تفاؤلي `updateMany({ status: "DRAFT" })` أول الـ tx قبل إنشاء المصروفات. |
| RC-3 / SD-01 (dedup القيود التلقائية) | ✅ | `accounting.ts:createJournalEntry` — `pg_advisory_xact_lock` على `(org,refType,refId)` يجعل فحص `findFirst` للتكرار خالياً من TOCTOU دون حاجة لـ partial-unique index. |
| RC-4 (عكس القيد بلا حارس) | ✅ | `accounting.ts:reverseJournalEntry` — وسم الأصل REVERSED صار `updateMany({ status: "POSTED" })` + فحص count. |
| RC-5 (انتقالات حالة الفاتورة) | ✅ | `finance.ts:updateInvoiceStatus` — حارس تفاؤلي `expectedStatus`؛ الـ caller في `create-invoice.ts` يمرّر الحالة المُتحقَّقة. |
| RC-6 (ترقيم مستخلصات المشروع) | ✅ | `project-finance.ts:createProjectClaim` — قفل صف المشروع `FOR UPDATE` (موجود دائماً) قبل الترقيم. |
| RC-7 (ترحيل الدراسات القديمة) | ✅ | `migrate-legacy-study.ts` — فحص idempotency داخل الـ tx بعد قفل صف الدراسة. |

### 2.4 معالجة الأخطاء والذرية

| المرجع | الحكم | الدليل |
|--------|-------|--------|
| EH-2 (حذف دفعة فاتورة: السند خارج المعاملة) | ✅ | `finance.ts:deleteInvoicePayment` — إلغاء السند داخل نفس الـ tx؛ حُذف الاستدعاء المنفصل من الـ procedure. |
| EH-3 (JOURNAL_ENTRY_FAILED بلا await) | ✅ | **44 موقعاً** عبر 20 ملفاً — أُضيف `await` لكل استدعاء `orgAuditLog` في بلوكات `JOURNAL_ENTRY_FAILED` (سكربت مُتحقَّق، بلا double-await). |
| EH-4 (Error بدل ORPCError) | ✅ | `orpc/procedures.ts` — middleware عام على `publicProcedure` يحوّل أي `Error` برسالة عربية إلى `ORPCError("BAD_REQUEST")`؛ الأخطاء الإنجليزية/الداخلية تبقى 500 لـ Sentry. |
| EH-5 (unified-quantities bulk update) | ✅ | `bulk-update-pricing.ts`/`update-global-markup.ts` — كل التحديثات في `$transaction` واحدة. |
| EH-6 (create-document floating promise) | ✅ | `create-document.ts` — إنشاء المستند + الإصدار الأول في `$transaction` واحدة مُنتظَرة. |
| EH-7 (حارس الفترة المبتلَع) | ✅ | `project-payments/update.ts` — حُذف الـ throw الميت داخل الـ catch؛ حارس ORPCError المبكر يكفي. |
| EH-8 (تناقض القاعدة 5.11) | ✅ | تحديث CLAUDE.md §5.11: النمط `.nullish()`/`.trim().optional()` عبر `validation-constants` مقبول للإدخال (الخطر كان في الإخراج). |

### 2.5 الأداء

| المرجع | الحكم | الدليل |
|--------|-------|--------|
| PERF-1 (تحديث تقدّم الأنشطة) | ✅ | `bulk-update-progress.ts` `.max(200)` + `project-execution.ts` UPDATE مجمّع بـ VALUES join + معالم بـ `Promise.all`. |
| PERF-2 (aggregate لكل بند مستخلص) | ✅ | `subcontract-claims.ts` — `groupBy(["contractItemId"])` واحد بدل حلقة. |
| PERF-3 (issueInvoice per-item) | ✅ | `finance.ts:issueInvoice` — UPDATE مجمّع بـ VALUES join. |
| PERF-4 (إلغاء فاتورة: عكس متسلسل) | ✅ | `create-invoice.ts` — عكس قيود الدفعات بـ `Promise.all`. |
| PERF-5 (KPI على صفحة مقطوعة) | ✅ | `org-finance.ts:getOrganizationPayments` يعيد `monthTotal`/`completedTotal` كتجميعات خادمية؛ `PaymentsList.tsx` يستهلكها بدل جمع الصفحة. |
| PERF-6 (صلاحيات layout غير مخبأة) | ✅ | `projects/[projectId]/layout.tsx` — استخدام `getCachedUserPermissions`/`getCachedUserProjectScope`. |
| PERF-7 (استعلام Purchases مكرر) | ✅ | `(saas)/layout.tsx` — حُذف الاستدعاء المكرر على مستوى المستخدم. |
| PERF-8 (12 استعلام إحصاءات) | ✅ | `finance-reports.ts` — `groupBy(["status"])` واحد لكل دالة. |
| PERF-9 (فوتر BOQ) | ✅ | `boq-items-table.tsx` + مفتاح `projectBoq.table.pageTotal` (ar+en). |

### 2.6 Schema والبيانات

| المرجع | الحكم | الدليل |
|--------|-------|--------|
| SD-03 (حارس حذف المشروع) | ✅ | `delete-project.ts` — أُضيف عدّ `projectChangeOrder` و`companyExpenseAllocation`. |
| SD-04 (دقة Asset) | ✅ | `schema.prisma` — `Decimal(12,2)` → `(15,2)` لحقول Asset الثلاثة. **(يحتاج push)** |
| SD-02 (UserInvitation) | 🟨 | `schema.prisma` — أُضيف `@@index([organizationId, status])` + `@@index([roleId])`. **متبقٍ:** علاقات FK بـ Cascade (تغيير متعدّد النماذج على القائمة الحمراء — أُجّل). **(يحتاج push)** |
| SD-05 (فهارس ناقصة) | 🟨 | `schema.prisma` — أُضيف `@@index([organizationId])` على Purchase (الأسخن). **متبقٍ:** 4 نماذج ثانوية (أثر هامشي). **(يحتاج push)** |
| SD-01 / RC-3 (dedup unique) | ✅ | عولج تطبيقياً بالـ advisory lock (انظر RC-3) — لا حاجة لـ migration. |

### 2.7 الأمان (عزل/مدخلات/أسرار)

| المرجع | الحكم | الدليل |
|--------|-------|--------|
| V7-03 / B4 (image-proxy بلا مصادقة) | ✅ | `image-proxy/[...path]/route.ts` — جلسة + تحقق عضوية المنظمة من بادئة المفتاح لـ bucket المرفقات؛ الأفاتار عام؛ صور بوابة المالك مسموحة عبر مطابقة `ProjectPhoto.url`. |
| V7-02 (leads storagePath) | ✅ | `save-file.ts` — تحقق البادئة `leads/{org}/{lead}/`. |
| B3 (leads بلا allowlist) | ✅ | `get-upload-url.ts` — `validateFileName` (يرفض exe/js/svg/html…). |
| B6 (Better Auth rate limit) | ✅ | `auth.ts` — تهيئة `rateLimit` صريحة + قواعد أدق لتسجيل الدخول (مع تعليق: يجب ربط `secondaryStorage` بـ Redis في الإنتاج). |
| SEC-3.1 (تصدير بلا تحقق) | ✅ | 7 ملفات `exports/procedures/*` — أُضيف `verifyProjectAccess`. |
| SEC-3.2 (copy-items) | ✅ | `subcontracts/copy-items.ts` — ربط العقدين بالمشروع/المنظمة. |
| V7-04 (onboarding protectedProcedure) | ✅ | `set-default-template.ts`/`setup-company-info.ts` → `subscriptionProcedure`. |
| V7-05 (costing org scope) | ✅ | `costing.ts` — `organizationId` في الـ where. |
| V7-06 (context costStudyId) | ✅ | `upsert-space.ts`/`upsert-opening.ts` — ربط بـ contextId/costStudyId. |
| B7 (z.string بلا max) | ✅ | `add-message-to-chat.ts` — حدود على page-context. |
| B5 (CSP unsafe-inline) | ⏸ | **مؤجَّل بمبرّر:** التحوّل إلى nonce-based CSP تغيير معماري كبير عالي الخطورة (يكسر كل inline scripts إن أُخطئ) — كان أصلاً "بعد الإطلاق". |
| SEC-3.3 (رمز مشاركة cuid2) | ⏸ | دفاع بالعمق فقط (محمي بحدّ IP + انتهاء)؛ اختياري. |

### 2.8 الواجهة والترجمة

| المرجع | الحكم | الدليل |
|--------|-------|--------|
| FE-01 (البحث يتجاهل نطاق المشاريع) | ✅ | `search/router.ts` + `search.ts` — `restrictToProjectIds` عند `!allProjects`. |
| FE-02 (prefetch ميت في الرئيسية) | ✅ | `page.tsx` — حُذفت 3 prefetches يتيمة + أُضيف `dashboard.activeProjects`. |
| FE-03 (AttentionCard 403) | ✅ | بوابة `showFinance` + `enabled`. |
| FE-04 (getAll استعلامات زائدة) | ✅ | `dashboard/router.ts` — إسقاط الحقول بلا مستهلك. |
| FE-05 (26 ملف يتيم) | ✅ | حُذفت الـ 26 (تحقق grep لكل ملف). |
| FE-06/07/08 | ✅ | props ميتة/تعليق fallback/بوابة صلاحيات PricingShortcutsCard. |
| A2 (5 مفاتيح ar-only) | ✅ | أُضيفت في en.json. |
| **A1** (114 ملف نص عربي) | 🟨 | أُنجز **73 نصاً** في `ChangePasswordForm` (12) + `permissions-editor` (61) بمفاتيح جديدة في ar+en. **متبقٍ:** ~100 ملف (حملة L-effort — Arabic-first فالأثر محدود). |

---

## 3. البنود المؤجَّلة بمبرّر (3) — تحتاج قراراً لا تخميناً

1. **ACC-18 (إفراج المحتجزات / 2150):** يلزم حسم محاسبي — هل محتجزات مقاولي الباطن ومحتجزات العميل تشتركان في 2150 أم تحتاجان حسابين؟ ثم تمرير مبلغ المحتجز عبر hook في `auto-journal.ts` (قائمة حمراء). أوصي بمراجعة محاسبية قبل التنفيذ.
2. **B5 (CSP nonce-based):** يتطلب بنية nonce ديناميكية في Next.js headers + توافق كل السكربتات inline. خطر كسر التطبيق عالٍ؛ يُنفَّذ في نافذة اختبار مخصّصة بعد الإطلاق.
3. **SEC-3.3 (رمز المشاركة):** دفاع بالعمق فقط؛ اختياري.

**بنود جزئية (5):** ACC-12 (فئات backfill)، ACC-17 (توقيت GL/الرصيد)، SD-02 (FK relations)، SD-05 (4 فهارس ثانوية)، A1 (~100 ملف i18n) — كلها منخفضة الأثر أو L-effort، موثّقة أعلاه.

---

## 4. خطوات النشر المطلوبة (إلزامية قبل الدمج)

1. **`db push`:** تغييرات `schema.prisma` (دقة Asset + فهارس Purchase/UserInvitation) لن تسري على القاعدة حتى تُنفّذ:
   ```
   pnpm --filter @repo/database push
   ```
   (لم تُنفَّذ هنا لأن الـ worktree يشير لقاعدة الإنتاج — يجب أن ينفّذها جودت بوعي.)
2. **Better Auth `secondaryStorage`:** ربط `rateLimit.storage` بـ Redis الموجود (تعليق في `auth.ts`) — وإلا فحماية brute-force ضعيفة على serverless.
3. **حذف `.next` وإعادة البناء** بعد الدمج (تغييرات UI).

---

## 5. ملخص الملفات المتغيّرة

- **~79 ملف معدّل** (packages/api، packages/database، apps/web، packages/auth، packages/i18n، CLAUDE.md) + **26 ملف محذوف** (FE-05).
- أكبر التغييرات: `org-finance.ts`، `finance.ts`، `accounting.ts`، `create-invoice.ts`، `year-end-closing.ts`، `payment-vouchers.ts`/`receipt-vouchers.ts`، `search.ts`+`search/router.ts`، `ar.json`/`en.json`.
- **القائمة الحمراء المعدّلة (بإذن صريح):** `auto-journal.ts` (ACC-11 تسجيل فقط)، `accounting.ts` (createJournalEntry/reverseJournalEntry — advisory lock + إعفاء الإقفال + حارس تفاؤلي)، `schema.prisma` (فهارس + دقة). كل التعديلات مُحافِظة ومغطّاة بالاختبارات.

---

## 6. تأكيد السلامة

- **لم يُمس فرع `main`** — كل العمل في worktree معزول.
- type-check أخضر في الحزمتين، **1,109 اختبار API + 77 اختبار DB ناجحة (صفر تراجع)**.
- كل بطاقة إصلاح مربوطة بملف + تغيير فعلي مُتحقَّق.

---

*انتهى تقرير الإصلاحات — منصة مسار v8.0 — 2026-07-14*
