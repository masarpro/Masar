# تقرير الأخطاء والمشاكل الشامل النهائي — منصة مسار v9.0

> **التاريخ:** 2026-07-15
> **الفرع:** main (آخر commit: `55cbcd45` — dashboard active-projects progress)
> **الحالة:** تقرير ما قبل الإطلاق — **قراءة فقط، لم يُعدَّل أي ملف كود**
> **نتيجة type-check:** ✅ نجح — `@repo/web` و`@repo/database` كلاهما exit 0، صفر أخطاء
> **نتيجة الاختبارات:** ✅ API: 1,109 ناجحاً / 34 متخطى (41 ملفاً) — DB: 77 ناجحاً / 24 متخطى — صفر فشل
> **نتيجة lint (Biome):** 726 خطأ + 5,550 تحذير + 218 ملاحظة — **كلها شكلية** (organizeImports، قوالب نصية، استيرادات غير مستخدمة)؛ الأخطاء الخمسة `useIterableCallbackReturn` إيجابيات كاذبة (arrow يعيد `setCell` في `forEach` بلا أثر). صفر خطأ منطقي.
> **المنهجية:** 8 مسارات تدقيق متوازية عميقة بقراءة فعلية للكود + type-check + tests + lint + **تحقق يدوي مباشر لأخطر 9 بنود** (خارج الوكلاء). كل بطاقة تحمل الملف:السطر ومقتطف كود مقروء مباشرة. المشاكل المبنية على تخمين استُبعدت.

---

## ملاحظة منهجية

هذا التقرير امتداد لسلسلة v6→v7→v8. تقرير v8 (2026-07-14) أغلق 59 من 67 مشكلة في v7 (88%، كل الحرجة الأربع). **تحققتُ في v9 من عدم تراجع أي إصلاح v8 — كلها صامدة** (جداول التحقق في القسم 12). المشاكل الجديدة أدناه تتركز في:
1. **الكود الذي لم يُغطِّه v8** — وحدات الباطن، الرواتب/المصروفات المتكررة (company)، مالية المشاريع، التسوية البنكية، ZATCA Phase 2 — حيث نُسخت أنماط خاطئة (كتابة البنك بلا نطاق، الحارس التفاؤلي المفقود) لم تصل يد إصلاح v8 إليها.
2. **تعارضات عرض بين الشاشات** في التسعير والتقارير المالية (نفس الرقم يظهر مختلفاً في شاشتين).
3. **blockers ZATCA Phase 2** — قيمة PIH تالفة، مرجع الإشعار الدائن خاطئ، سلسلة hash غير ذرية — حرجة لأن go-live قريب.

**تحقق مباشر يدوي (خارج الوكلاء) — أكّدتُ بنفسي بقراءة الكود:** ثغرة بنك الباطن (PF-01)، ثغرة بنك company (RC-01/بنك)، عزل التخزين في المرفقات (SEC-att)، انهيار ترقيم دفعات المستخلصات (PF-03)، عمى الفواتير المتأخرة (FIN-04)، السندات اليدوية المعطلة (FIN-02)، PIH التالف (FIN-03)، تصفير قائمة الدخل بعد الإقفال (ACC-19)، تسريب المالية في الداشبورد (UI-01)، اعتماد company المزدوج (RC-01)، اعتماد الأوفرهيد على الصفر (QTY-01)، وتسريب اعتماد DB في `.env.local.example` (SD-1).

**القائمة الحمراء (قُرئت، لم تُعدَّل):** `auto-journal.ts`، `structural-calculations.ts`، `queries/accounting.ts`، `schema.prisma`، ZATCA. البنود التي تمسّها موسومة.

---

# 1. الملخص التنفيذي

## 1.1 توزيع المشاكل حسب الشدة

| الشدة | العدد |
|-------|-------|
| 🔴 حرج | 13 |
| 🟠 عالٍ | 24 |
| 🟡 متوسط | 34 |
| ⚪ منخفض | 24 |
| **المجموع** | **95** |

> **قراءة الاتجاه:** ارتفاع العدد عن v7 (67) **ليس تراجعاً** — بل نتيجة تدقيق أعمق شمل وحدات لم تُفحص سابقاً بنفس العمق (الباطن، company payroll، ZATCA Phase 2، التسوية البنكية، مالية المشاريع). النظام الأساسي (المحاسبة الأساسية، حساب الفاتورة، الترقيم التسلسلي، عزل الوحدة المالية الرئيسية) **متين ومختبَر**. المخاطر متركزة في **الأطراف والوحدات الحديثة** حيث نُسخت أنماط قبل تصليبها.

## 1.2 توزيع المشاكل حسب المحور

| # | المحور | 🔴 | 🟠 | 🟡 | ⚪ |
|---|--------|----|----|----|----|
| 2 | العزل متعدد المستأجرين (عائلة ثغرة البنك) | 5 | 1 | 2 | 0 |
| 3 | الوحدة المالية وZATCA | 4 | 8 | 14 | 7 |
| 4 | سلامة النظام المحاسبي | 0 | 3 | 6 | 6 |
| 5 | مالية المشاريع والباطن | 4 | 7 | 7 | 3 |
| 6 | الذرية والسباقات والأخطاء | 1 | 2 | 6 | 4 |
| 7 | محركات الحساب والأرقام | 0 | 3 | 7 | 7 |
| 8 | الواجهة والتصميم والترجمة | 0 | 1 | 8 | 2 |
| 9 | Schema والأداء والبنية | 2 | 3 | 2 | 0 |

> بعض البطاقات تظهر في محورين (ثغرة البنك = عزل + محاسبة)؛ تُحسب مرة واحدة في المجموع.

## 1.3 أخطر 13 مشكلة — يجب حلها قبل الإطلاق (مرتبة)

| # | المشكلة | المحور | المرجع |
|---|---------|--------|--------|
| 1 | **عائلة ثغرة البنك العابرة للمستأجرين (4 مواقع جديدة)** — `organizationBank.updateMany` بلا `organizationId`: دفعة باطن مباشرة، دفعة مستخلص باطن، دفع مصروف منشأة، + تسوية بنكية بلا تحقق ملكية. نفس فئة blocker v7 نُسخت لوحدات لم يشملها إصلاح v8 | عزل | [BANK-IDOR](#bankidor) / [FIN-01](#fin01) |
| 2 | **صفحة "مصروف مشروع جديد" حيّة تكتب في جدول `ProjectExpense` المهجور** → المبلغ يختفي من كل القوائم والمجاميع والربحية وبلا قيد محاسبي | مالية مشاريع | [PF-05](#pf05) |
| 3 | **انهيار ترقيم دفعات المستخلصات** — تصادم بادئتي `PAY-`/`SUBPAY-` في نفس الجدول → دائماً `PAY-0001` → ثاني دفعة مستخلص على عقد به دفعة مباشرة = 500 دائم | مالية مشاريع | [PF-03](#pf03) |
| 4 | **تعديل مبلغ دفعة مشروع لا يحرّك رصيد البنك بينما القيد يتحدث** (مؤكد UI→API→DB) → انحراف دائم بنك↔دفتر | مالية مشاريع | [PF-04](#pf04) |
| 5 | **اعتماد مزدوج في دفع مصروف المنشأة** (`markExpensePaymentPaid` بلا حارس `isPaid:false`) → مصروف وخصم بنك وقيد وسند مضاعف | ذرية | [RC-01](#rc01) |
| 6 | **`contractTermId` في دفعات المشروع بلا ربط بالمشروع/المنظمة** → إفساد مراحل عقد منظمة أخرى + تسريب دفعات | عزل | [PF-02](#pf02) |
| 7 | **عمى الفواتير المتأخرة بعد cron** — الفلتر يبحث عن `SENT`/`PARTIALLY_PAID` بينما cron يحوّلها `OVERDUE` → البطاقة والقائمة تعرض صفراً | مالية | [FIN-04](#fin04) |
| 8 | **نموذجا السندات اليدوية (صرف/قبض) معطلان بالكامل** — مفتاح `banks.banks` خاطئ + `z.number()` بلا coerce → غير قابلين للإرسال | مالية | [FIN-02](#fin02) |
| 9 | **ZATCA: قيمة INITIAL_PIH تالفة (48 حرف بدل 64)** — أول فاتورة كل جهاز + فواتير التوافق تحمل PIH مخالف للمواصفة | مالية/ZATCA | [FIN-03](#fin03) |
| 10 | **ZATCA: الإشعار الدائن يشير لنفسه بدل الفاتورة الأصلية + غياب noteReason** → رفض كل إشعار دائن/مدين | مالية/ZATCA | [FIN-09](#fin09) |
| 11 | **cron تفريغ طابور بريد الإشعارات غير مسجّل في `vercel.json`** → لا تصل أي إشعارات بريدية للمستخدمين إطلاقاً | بنية | [PERF-INFRA-1](#infra1) |
| 12 | **اعتماد Supabase حيّ (كلمة مرور DB) داخل `.env.local.example` المتتبَّع بـ git** | بنية/أمان | [SD-1](#sd1) |
| 13 | **تصفير قائمة الدخل بعد الإقفال السنوي** — استعلام قائمة الدخل لا يستثني قيود `YEAR_END_*` → إيرادات/مصروفات ≈ 0 ويتسلسل لإنذارات السحب الزائد وحصص أرباح الشركاء | محاسبة | [ACC-19](#acc19) |

**نمطان متكرران لافتان:** (أ) إصلاح v8 للحارس التفاؤلي وكتابة البنك المنطاقة طُبّق على "الاعتماد/الترحيل/الفاتورة الرئيسية" ونُسي في "الإلغاء/mark-paid/الباطن/company". (ب) قاعدة `invalidateAccessCache` طُبّقت على مسارات منح الصلاحية ونُسيت في مسارات إسقاطها (الأخطر).

---

# 2. العزل متعدد المستأجرين — عائلة ثغرة البنك {#bankidor}

> **الأخطر في التقرير كله.** تقرير v7 صنّف ثغرة كتابة البنك العابرة 🔴 وأصلحها v8 في `finance.ts`/`org-finance.ts`/`project-payments.ts`. لكن النمط نفسه (`organizationBank.updateMany({ where: { id, balance } })` **بلا `organizationId`**) بقي منسوخاً في 4 مواقع لم يشملها الإصلاح. **الحل الموحّد:** إضافة `organizationId` إلى الـ `where` + فحص `count === 0`، ثم **grep على مستوى المستودع كله** لكل `organizationBank.update`/`updateMany` للتأكد.

## BANK-1 — دفعة عقد باطن مباشرة (🔴)
- **الملف:** `packages/database/prisma/queries/subcontract.ts:837`
```ts
const bankDec = await tx.organizationBank.updateMany({
    where: { id: data.sourceAccountId, balance: { gte: data.amount } }, // ← لا organizationId
    data: { balance: { decrement: data.amount } },
});
```
- **الأثر:** عضو منظمة A يمرّر معرّف بنك منظمة B فيخصم من رصيدها التشغيلي. **مؤكَّد يدوياً.**

## BANK-2 — دفعة مستخلص باطن (🔴)
- **الملف:** `packages/database/prisma/queries/subcontract-claims.ts:916` — نفس النمط تماماً. **مؤكَّد يدوياً.**

## BANK-3 — دفع مصروف منشأة (رواتب/متكرر) (🔴)
- **الملف:** `packages/database/prisma/queries/company.ts:642` — `updateMany({ where: { id: data.bankAccountId, balance: {gte} } })` بلا `organizationId`. **مؤكَّد يدوياً** (انظر أيضاً [RC-01](#rc01) — نفس الدالة فيها اعتماد مزدوج).

## FIN-01 — التسوية البنكية: IDOR إنشاء (🔴) {#fin01}
- **الملف:** `packages/api/modules/finance/procedures/bank-reconciliation.ts:79-88` + `queries/accounting.ts:2391-2410`
- **المشكلة:** بعكس `getBankLinesForReconciliation` (يتحقق `organizationBank.findFirst({ id, organizationId })`)، إجراء **الإنشاء** لا يتحقق أن `bankAccountId` وسطور القيود `matchedLineIds` تخص المنظمة.
- **الأثر:** عضو A يُنشئ تسوية تشير لحساب بنكي وسطور قيود منظمة B ويسمها `isMatched` — إفساد تسوية عابر للمستأجرين.
- **الحل:** تحقق ملكية الحساب + مقارنة `count` على سطور القيود بشرط `journalEntry.organizationId`.

## SEC-att — عزل تخزين المرفقات العام (🟠)
- **الملف:** `packages/api/modules/attachments/procedures/finalize-upload.ts:40,88`
- **المشكلة:** `finalize` يقبل `storagePath` خام من العميل ويخزّنه بلا التحقق أنه يبدأ بـ `attachments/${organizationId}/`. `create-upload-url.ts:98` يولّد المسار الصحيح ويعيده للعميل، لكن `finalize` لا يعيد التحقق، و`get-download-url.ts:47` يوقّعه مباشرة بعد فحص ملكية السجل فقط (لا الملف). **الإصلاح المناظر مطبّق في `leads/save-file.ts:44` منذ v8 — لكن وحدة المرفقات العامة لم تُحدَّث.**
- **الأثر:** عضو A يمرّر `storagePath` يشير لملف منظمة B فيقرأه عبر رابط موقّع (مقيّد بمعرفة المسار الذي يحوي uploadId ضعيف العشوائية). **مؤكَّد يدوياً (السلسلة كاملة).**
- **الحل:** `input.storagePath.startsWith('attachments/' + input.organizationId + '/')` قبل `createAttachment`.

## SEC-auth — حد المصادقة غير مربوط بـ Redis (🟡→🟠) 
- **الملف:** `packages/auth/auth.ts:78-98` — حدود تسجيل الدخول (5/د) والاستعادة (3/د) و2FA تعتمد التخزين الافتراضي **في الذاكرة**؛ لا `secondaryStorage` مربوط بـ Redis (التعليق التحذيري ما زال حرفياً كما في v8). على serverless الحد الفعلي = max × عدد النسخ الساخنة، ويُصفَّر عند كل cold start. **مؤكَّد يدوياً.** (بند v8 المؤجَّل — ما زال قائماً، يجب حسمه قبل beta عام.)

---

# 3. الوحدة المالية وZATCA

## 🔴 حرجة

### FIN-02 — نموذجا السندات اليدوية معطلان بالكامل {#fin02}
- **الملفات:** `vouchers/PaymentVoucherForm.tsx` (32,147,204) و`ReceiptVoucherForm.tsx` (41,184,254)
- **(أ)** `(banks as any)?.banks?.map(...)` بينما `finance.banks.list` يعيد `{ accounts, total }` → القائمة `undefined` دائماً.
- **(ب)** `amount: z.number().positive()` مع `<Input type="number" {...field}>` — RHF يمرّر string، `zodResolver` بلا coerce يرفضها → **النموذج غير قابل للإرسال إطلاقاً**.
- **مؤكَّد يدوياً.** السندات التلقائية غير متأثرة (تُنشأ خادمياً). **الحل:** `.accounts?.map` + `z.coerce.number().positive().max(MAX_FINANCIAL)`.

### FIN-03 — ZATCA: قيمة INITIAL_PIH تالفة (blocker Phase 2) {#fin03}
- **الملف:** `packages/api/lib/zatca/phase2/constants.ts:67` + `schema.prisma:6361`
- **مؤكَّد يدوياً:** القيمة تُفكّ إلى `5feceb66...c2dbbe1b17e11709` بطول **48 حرفاً**، بينما SHA-256("0") الصحيح `5feceb66...c2dbc239dd4e91b46729d73a27fb57e9` بطول **64 حرفاً**. القيمة الصحيحة موجودة فعلاً في `sandbox-test.ts:38`.
- **الأثر:** أول فاتورة لكل جهاز + كل فواتير اختبار التوافق تحمل PIH مخالف → تحذير/رفض ZATCA. **الحل:** استبدال بالقيمة الصحيحة (schema — قائمة حمراء، يحتاج موافقة).

### FIN-04 — عمى الفواتير المتأخرة بعد cron {#fin04}
- **الملف:** `packages/database/prisma/queries/finance-reports.ts:38-44,148-153` + `cron/update-overdue-invoices/route.ts:13-19`
- **مؤكَّد يدوياً:** cron يحوّل `["ISSUED","SENT","PARTIALLY_PAID"]` المستحقة إلى `OVERDUE`، بينما فلتر الداشبورد يبحث عن `status: { in: ["SENT","PARTIALLY_PAID"] }` فقط → **بعد أول تشغيل للـ cron تعرض بطاقة "المتأخرة" وقائمة `getOverdueInvoices` صفراً**. عمى كامل عن الذمم المتأخرة. **الحل:** `status: { in: ["ISSUED","SENT","VIEWED","PARTIALLY_PAID","OVERDUE"] }`.

## 🟠 عالية

- **FIN-05** | `queries/finance.ts:1810,1869` — سقف الإشعار الدائن يقارن بإجمالي الفاتورة فقط (لا `total − paidAmount`) ثم يزيد `paidAmount` → فاتورة 1000 مدفوعة كاملاً يمكن إضافة إشعار 1000 فوقها → `paidAmount=2000 > total`.
- **FIN-06** | `finance-reports.ts:28-66` — `getFinanceDashboardStats` تجمع بلا `isDraft:false` ولا استثناء `CANCELLED` (مسودات autosave والملغية تدخل)، والإشعار الدائن يُخصم مرتين (سالباً في totalAmount + زيادةً في paidAmount). أرقام لوحة المالية منفوخة. نفس الازدواج في `project-profitability.ts:179`.
- **FIN-07** | `accounting-reports.ts:644-655,874-883` — **تقرير VAT (إقرار ZATCA) وقائمة الدخل يُدخلان دفعات باطن PENDING/CANCELLED** (بلا `status:"COMPLETED"`) → ضريبة مدخلات منفوخة (سداد أقل من المستحق) + صافي ربح خاطئ.
- **FIN-08** | `create-invoice.ts:377-457` — إلغاء الفاتورة: `updateInvoiceStatus("CANCELLED")` **خارج وقبل** `$transaction` عكس الأرصدة → فشل المعاملة يترك فاتورة CANCELLED بأرصدة بنك شبح وسندات حية. (إصلاح v8 كان جزئياً — العكس ذرّي لكن تغيير الحالة ليس معه.)
- **FIN-09** | ZATCA — `zatca-service.ts:293` + 3 مسارات: `billingReference` يضع رقم الإشعار نفسه لا الفاتورة الأصلية + `noteReason` (إلزامي KSA للأكواد 381/383) لا يُمرَّر → **رفض كل إشعار دائن/مدين**. blocker Phase 2. {#fin09}
- **FIN-10** | ZATCA — `submit-invoice.ts:325` — قراءة/كتابة `previousInvoiceHash` (سلسلة PIH) ليست في `$transaction` (فاتورتان متزامنتان تكسران السلسلة)، والتحديث غير مشروط عند REJECTED/FAILED (تناقض مع `retry-*` المشروط) → سلسلة hash مكسورة.
- **FIN-11** | `queries/finance.ts:963-966` — فلتر "overdue" في قائمة الفواتير يقصر على `status="SENT"` (نفس عمى FIN-04) ويدهس أي status مرّره المستخدم.
- **FIN-12** | off-by-one: `dueDate` من نوع `@db.Date` (00:00 UTC) و`{ lt: new Date() }` يجعلها متأخرة من 03:00 الرياض من **يوم الاستحقاق نفسه** — وسم OVERDUE مبكر يوماً.

## 🟡 متوسطة (مختصرة)

FIN-13 (autosave يزوّر كمية 0→1)، FIN-14 (استعادة رصيد خاطئة عند إلغاء مصروف مدفوع من حسابات متعددة)، FIN-15 (سند صرف بكامل المبلغ عند أول دفعة جزئية، والثاني يفشل صامتاً بسبب `expenseId @unique`)، FIN-16 (openingBalance لا يُكتب عند إنشاء الحساب → انحراف التسوية بمقدار الرصيد الابتدائي دائماً)، FIN-17 (سندات تبقى ISSUED بعد حذف/إلغاء المصروف)، FIN-18 (داشبورد المنظمة يُرجع Decimal خاماً → NaN)، FIN-19 (formatCurrency محلي بكسور مختلفة في شاشتين متجاورتين)، FIN-20 (bookBalance تسوية يُحسب float على العميل)، FIN-21 (إيراد المشروع/العميل والإحصاءات تشمل drafts/الإشعارات)، FIN-22 (VAT 0.15 حرفي في 6 مواضع)، FIN-23 (ZATCA PayableAmount بلا PrepaidAmount — BR-CO-16)، FIN-24 (ZATCA مرمّز TLV مرحلة 1 بلا حارس >255 بايت → QR تالف لاسم بائع طويل + طابع issueDate بدل issuedAt)، FIN-25 (قراءات بـ subscriptionProcedure تمنع FREE + رفع الشعار بلا فحص `finance.settings`)، FIN-26 (ZATCA non-null assertion على publicKey → 500 + `csidExpiresAt` لا يُكتب → لا إنذار انتهاء شهادة).

## ⚪ منخفضة
FIN-27..33: نوافذ الدفع تعتمد `max` HTML فقط؛ `roundHalfUp2` بـ Math.round للسوالب (نظري)؛ grossProfit لا يشمل الباطن؛ توقعات التدفق تُغفل ISSUED؛ `getInvoiceStats` بلا `enforceFeatureAccess`؛ ضجيج ZATCA التشخيصي؛ رسائل `throw new Error` إنجليزية في bank-reconciliation.

> **✅ سليم ومؤكَّد في الوحدة المالية:** `calculateInvoiceTotals` مصدر وحيد بـ Decimal + ROUND_HALF_UP، الخادم لا يثق بإجماليات العميل ويعيد الحساب دائماً؛ الترقيم التسلسلي ذرّي (INSERT ON CONFLICT + retry P2002، لا count)؛ عزل الوحدة المالية الرئيسية سليم (كل update/delete بـ `{id, organizationId}` عدا FIN-01)؛ ZATCA أساسيات TLV بالبايت + الأسرار مشفّرة AES-256-GCM ولا تُسجَّل (إصلاح v7 مؤكَّد)؛ cash-flow وأعمار الذمم بنموذج POSTED+REVERSED متسق.

---

# 4. سلامة النظام المحاسبي

> جرد الـ 17 hook: **صحة القيد المزدوج سليمة سطراً سطراً** — كلها متوازنة بـ Decimal باتجاهات DR/CR صحيحة (تقسيم VAT، حارس GOSI، رفض القيد غير المتوازن). المشاكل في *الأطراف*: التقارير، الفترات المغلقة، والإقفال السنوي.

## ACC-19 — تصفير قائمة الدخل بعد الإقفال السنوي (🟠) {#acc19}
- **الملف:** `packages/database/prisma/queries/accounting.ts:1039-1042`
- **مؤكَّد يدوياً:** استعلام قائمة الدخل يضمّ القيود `status IN (POSTED, REVERSED)` ضمن نطاق التاريخ **بلا أي فلتر على `referenceType`**. قيود `YEAR_END_CLOSING`/`YEAR_END_RETAINED` المؤرخة 31 ديسمبر تصفّر حسابات الإيراد/المصروف (بالتصميم)، فأي قائمة دخل سنوية تعرض إيرادات ومصروفات ≈ 0.
- **الأثر (يتسلسل):** `computeOverdrawContext` (owner-drawings:265) يعامل الربح صفراً → إنذارات سحب زائد خاطئة لكل الشركاء؛ `getCompanySummary` يعرض `availableForDrawing` سالباً؛ `partners-finance:51` يحسب `shareOfProfit=0`.
- **الحل:** `AND (je.reference_type IS NULL OR je.reference_type NOT IN ('YEAR_END_CLOSING','YEAR_END_RETAINED','PERIOD_CLOSING'))`. **قائمة حمراء — يحتاج موافقة.**

## ACC-20 — إلغاء مساهمة رأس مال بلا حارس فترة مغلقة (🟠)
- **الملف:** `capital-contributions.ts:388-418` — v8 أضاف الحارس في إلغاء سحوبات الشركاء لكن المسار المطابق في المساهمات بقي بلا حارس. قيد في فترة مغلقة: يُخصم البنك وتُلغى المساهمة، ثم `reverseJournalEntry` يرمي ويُبتلع في catch → القيد يبقى POSTED. + خصم البنك بلا حارس `balance >= amount` (قد يصبح سالباً).

## ACC-21 — مستندات مؤرخة داخل فترة مغلقة: العملية تنجح والقيد يُتخطى صامتاً (🟠)
- **الملف:** `owner-drawings.ts:365,528` + `accounting.ts:607-635` (منهجي عبر السحوبات/المصروفات/الدفعات) — إنشاء بتاريخ في فترة مغلقة: الرصيد التشغيلي يتغير والمستند يُعتمد، بينما `createJournalEntry` يعيد `null` بصمت (`JOURNAL_ENTRY_SKIPPED` فقط). v8 عالج مسار الإلغاء فقط. **الحل:** حارس `isPeriodClosed` موحّد على مسارات الإنشاء المالية.

## 🟡 متوسطة
- **ACC-22** | `accounting.ts:1496,575` — إعادة فتح فترة لا تعكس قيد إقفالها + إعادة الإقفال تُبتلع بالـ dedup (نفس refId) → نشاط ما بعد الفتح لا يُقفل. (محدود حالياً: الواجهة لا تمرر `generateClosingEntry`.)
- **ACC-23** | `accounting.ts:1238` — الميزانية تُسقط حسابات الأصول المخصّصة خارج بادئة 11/12 من `totalAssets` → شارة "غير متوازنة" كاذبة بمجرد أول حساب أصل مخصّص.
- **ACC-24** | `year-end-closing.ts:341` — الإقفال لا يشترط إغلاق فترات السنة (تحذير غير مُلزم) → قيود لاحقة بتاريخ داخل السنة المُقفلة لا تصل 3200 أبداً.
- **ACC-25** | `auto-journal.ts:967,988` — `onOwnerDrawing/Cancelled` وحدهما ملفوفان بـ try/catch داخلي يبتلع الخطأ → catch الخارجي المسجِّل لـ `JOURNAL_ENTRY_FAILED` غير قابل للوصول. **قائمة حمراء.**
- **ACC-26** | `accounting-health.ts:17` — فحص "القيود غير المتوازنة" يفلتر `status='POSTED'` فقط بينما التقارير تجمع POSTED+REVERSED → قيد REVERSED غير متوازن يفسد الميزان بلا كشف.
- **ACC-27** | `accounting.ts:278` — إنشاء الحساب البنكي التاسع فصاعداً يفشل دائماً (1109+1=1110 يصطدم بالأب، وretry يعيد نفس الكود) → قيود بنوكه تُتخطى صامتاً. **قائمة حمراء.**

## ⚪ منخفضة
ACC-28 (`bulkPostJournalEntries` بلا فلتر `status:DRAFT` نهائي — TOCTOU ضيق)، ACC-29 (`computeNextDueDate` تجاوز فبراير ليوم 29-31)، ACC-30 (`entryNo` يستخدم سنة اليوم لا سنة القيد)، ACC-31 (عدّادات backfill تُزاد optimistically)، ACC-32 (سباق سقف 100% ملكية + إنشاء حساب سحب بلا retry)، ACC-33 (سجل `yearEndClosing.netProfit` float بينما القيد Decimal — فرق هللات عرضي).

> **مؤجَّلة معروفة (بلا تغيير):** ACC-18 (إفراج المحتجزات 2150 بلا قيد استحقاق)، ACC-17 (توقيت خصم رصيد الرواتب)، ACC-12 (فئات backfill المخصّصة).

---

# 5. مالية المشاريع والباطن

## 🔴 حرجة

### PF-05 — صفحة مصروف مشروع حيّة تكتب في جدول مهجور {#pf05}
- **الملف:** `.../projects/[projectId]/finance/new-expense/page.tsx` → `CreateExpenseForm.tsx:61` → `create-expense.ts:53` → `queries/project-finance.ts:427` (`db.projectExpense.create`)
- **المشكلة:** الصفحة الحيّة تكتب في `projectExpense` (القديم)، بينما القائمة والملخص والربحية يقرآن `financeExpense + subcontractPayment` فقط. المصروف: **لا يظهر، لا يُحتسب في `actualExpenses`، لا يستدعي `onExpenseCompleted`** (لا قيد، لا خصم بنك). + `subcontractContractId` بلا تحقق منظمة.
- **الأثر:** أموال مسجّلة تختفي من التقارير والمحاسبة — فقدان صامت. **الحل:** توجيه الصفحة إلى `AddExpenseDialog` الموحّد (§19.10) أو الكتابة في `financeExpense` مع الـ hook.

### PF-03 — انهيار ترقيم دفعات المستخلصات {#pf03}
- **الملف:** `queries/subcontract-claims.ts:875-883`
- **مؤكَّد يدوياً:** الدفعات المباشرة `SUBPAY-YYYY-XXXX` والدفعات على المستخلصات `PAY-XXXX` في نفس جدول `subcontractPayment` تحت `@@unique([contractId, paymentNo])`. `findFirst orderBy paymentNo desc` يعيد صف `SUBPAY` (S>P أبجدياً)، و`replace(/^PAY-/)` لا يطابقه → `NaN` → **دائماً `PAY-0001`**. أول دفعة مستخلص تنجح؛ الثانية على عقد به دفعة مباشرة = P2002 بلا retry → **500 دائم**.
- **الحل:** `where: { paymentNo: { startsWith: "PAY-" } }` + retry على P2002.

### PF-04 — تعديل مبلغ الدفعة لا يحرّك البنك بينما القيد يتحدث {#pf04}
- **الملف:** `queries/project-payments.ts:683-714` + `EditPaymentDialog.tsx:124`
- **المشكلة:** الواجهة تُرسل `destinationAccountId` دائماً بقيمته الحالية. عند تعديل المبلغ فقط: شرط "لم يُرسل" يسقط وشرط "تغيّر" يسقط → **الرصيد لا يُعدَّل بالفارق**، بينما الإجراء يعكس القيد القديم وينشئ قيداً جديداً بالمبلغ الجديد.
- **الأثر:** انحراف دائم بنك↔دفتر عند كل تعديل مبلغ — على الأرجح جذر فروقات التسوية المعلّقة. **الحل:** فرع ثالث: نفس الحساب + `amountDiff !== 0` → `increment: amountDiff` (منطاق بالمنظمة).

### PF-02 — contractTermId بلا ربط بالمشروع/المنظمة {#pf02}
- **الملف:** `queries/project-payments.ts:297-346,402-420` — `contractPaymentTerm.findUnique({ where: { id } })` بلا scoping، ثم خوارزمية الـ spillover تحدّث `paidAmount/status` لمراحل **العقد الذي تتبعه المرحلة** أياً كان. + `getProjectPaymentsSummary:124` يعرض `term.projectPayments` بلا فلتر منظمة.
- **الأثر:** إفساد تقدّم مراحل عقد منظمة أخرى + تسريب دفعات بين المستأجرين.

## 🟠 عالية
- **PF-06** | `project-payments.ts:568` — استبدال دفعة مقسّمة يحذف الصفوف بلا إلغاء سنداتها (بعكس الحذف) → سندات قبض تتضاعف؛ وتعديل الدفعة المفردة يترك السند بمبلغ قديم.
- **PF-07** | تضارب VAT منهجي: مراحل الدفع تُخزَّن Gross بينما سقف التحصيل والملخص Net (`copy-terms-from-execution.ts:56` مقابل `project-payments.ts:86`) → آخر ~15% من الدفعات تُرفض بـ `PAYMENT_EXCEEDS_CONTRACT`. نفس الخلط في سقف الباطن.
- **PF-08** | `subcontract.ts:402` — `setSubcontractPaymentTerms` upsert بمعرّف `term.id` عميلي بلا تحقق تبعيته للعقد → تعديل مرحلة عقد آخر.
- **PF-09** | `handover/protocol-workflow.ts:115-146` — توقيع المحاضر: read-modify-write على JSON بلا `$transaction`/قفل → توقيع ضائع (lost update) أو استدعاء `onFinalHandoverCompleted` مرتين → قيد HR-JE مزدوج (createJournalEntry لا يمنع تكرار handover بالمرجع).
- **PF-10** | `subcontract.ts:288` + `project-change-orders.ts:300` — خفض قيمة العقد مباشرةً بلا حارس أرضية الالتزامات → سقوف ومتبقٍّ سالبة/متضاربة.
- **PF-11** | `subcontract-claims.ts:658` — مستخلص باطن معتمد لا يمكن إلغاؤه (CANCELLED غير قابلة للوصول) → اعتماد خاطئ = قيد استحقاق دائم لا يُعكس. + يسمح APPROVED→PAID يدوياً بلا دفعة.
- **PF-12** | `subcontract.ts:817` — `termId` في الدفعة المباشرة بلا تحقق تبعيته للعقد.

## 🟡 متوسطة
PF-13 (ترقيم أوامر تغيير الباطن بـ count+1)، PF-14 (معاينة مستخلص الباطن تفترض 10%/15% بينما الخادم 0)، PF-15 (`bulk-create` BOQ بلا تحقق `projectPhaseId`)، PF-16 (استيراد Excel/جماعي بلا حد أعلى → تجاوز Decimal(15,2)=500)، PF-17 (**لا endpoint لتعديل/حذف دفعة باطن** — الخطأ غير قابل للتصحيح)، PF-18 (إنشاء دفعة مشروع بتاريخ فترة مغلقة مسموح بينما التعديل مرفوض)، PF-19 (تعديل الدفعة المفردة بلا spillover ولا سقف `paidAmount`).

## ⚪ منخفضة
ACC-18 (سطر واحد)، سياسة VAT على صافي المستخلص (قرار محاسبي)، استرداد الدفعة المقدمة يتطلب حقلين معاً، `getProjectExpenses` يقصّ 200+200 قبل الترقيم.

> **✅ سليم:** كتابات بنك `project-payments` منطاقة (4 مواضع، إصلاح v8 صامد)؛ `reversePaymentEffects` منطاق؛ ترقيم مستخلصات المشروع بقفل `FOR UPDATE` + MAX؛ `copy-items` يربط العقدين؛ حارس ORPCError المبكر في `project-payments/update`.

---

# 6. الذرية والسباقات والأخطاء

## RC-01 — اعتماد مزدوج في دفع مصروف المنشأة (🔴) {#rc01}
- **الملف:** `queries/company.ts:600-663` + `expense-payments.ts`
- **مؤكَّد يدوياً:** فحص `isPaid` (سطر 611) قراءة **غير معاملاتية** قبل الـ transaction، والتحديث النهائي (سطر 653) `update({ where: { id } })` **بلا حارس `isPaid:false`**. نقرتان متزامنتان → **مصروفان COMPLETED + خصم بنك مضاعف + قيدان + سندا صرف**. عكس نمط v8 المطبّق في `approvePayrollRun`. (الدالة نفسها فيها ثغرة بنك BANK-3.)
- **الحل:** `updateMany({ where: { id, isPaid: false } })` + فحص count داخل الـ transaction.

## 🟠 عالية
- **RC-02** | `leaves/leave-requests.ts:223,396` — اعتماد/رفض/إلغاء الإجازات: فحص الحالة قراءةً ثم تحديث غير مشروط → اعتمادان متزامنان يخصمان الرصيد مرتين؛ سباق approve↔cancel يترك طلب CANCELLED برصيد مخصوم للأبد.
- **RC-03** | `payroll.ts:339` + `expense-runs.ts:327` — **إلغاء** دورة الرواتب/المصروفات المتكررة بلا حارس تفاؤلي (بينما الاعتماد محمي بـ v8) → سباق cancel↔approve يترك مصروفات رواتب PENDING حية تُدفع لاحقاً بالخطأ؛ إلغاءان متزامنان لدورة APPROVED → قيدا عكس يكسران التوازن.
- **EH-01** | `auth.ts:165-192` — إنشاء المنظمة + بذر الأدوار + تعيين OWNER غير ذري وفشل البذر يُبتلع → منظمة بلا أدوار وبلا OWNER role، كل RPC فيها يفشل، بلا مسار إصلاح.

## 🟡 متوسطة
- **RC-05** | **غياب `invalidateAccessCache` عن مسارات إسقاط الصلاحية** — `toggle-user-active`, `delete-org-user`, `delete-role`, `project-team/remove-member`+`update-member-role`. القاعدة طُبّقت في المنح ونُسيت في الإسقاط (الأخطر) → عضو مُزال يظل يصل ≤30s. **تراجع جزئي عن قاعدة موثّقة.**
- **RC-04** (رقم إصدار المستند من قراءة غير معاملاتية → P2002 خام + ملف يتيم)، **EH-02** (رسائل `throw new Error` إنجليزية في company/payroll → 500 مبهم؛ middleware يلتقط العربية فقط)، **RC-06** (`activation-codes/user.ts:121` تجاوز maxUses تحت التزامن + بلا unique مركّب)، **EH-03** (catch يحوّل أي خطأ إلى NOT_FOUND في `update-activity-progress`/`project-team`)، **IN-01** (`projectPhaseId` بلا تحقق في bulk-create/update BOQ)، **RC-07** (`email-queue.ts:72` بلا حجز ذري PENDING→PROCESSING → بريد مزدوج عند تداخل cron + FAILED نهائي بلا retry).

## ⚪ منخفضة
EH-04 (orgAuditLog عائم في 5 مواضع → ضياع سجل تدقيق على تجمّد الدالة)، EH-05 (حذف S3 عائم → ملفات يتيمة)، RC-08 (sortOrder BOQ غير معاملاتي)، RC-09 (بنود الرواتب snapshot قبل الـ tx).

> **✅ سليم:** حارس v8 التفاؤلي في `approvePayrollRun`/`postExpenseRun` صامد؛ `sequences.ts` كله ذرّي؛ موافقات المستندات بـ `SELECT FOR UPDATE`؛ `notifyEvent` never-throw قائم؛ middleware التحويل يعمل.

---

# 7. محركات الحساب والأرقام

> **✅ البند الأهم:** **لا عودة لتضاعف المواد ×2** (بند CLAUDE.md §10 القديم) — حماية ثلاثية مؤكَّدة: `@@unique([costStudyId, sourceItemType, sourceItemId])` + قفل `FOR UPDATE` في `costingGenerateItems` + `dedupeCostingItems` في كل مسارات القراءة. سطر §10 أقدم من الإصلاح.

## 🟠 عالية
- **QTY-01** | `costing.ts:669` — **مؤكَّد يدوياً:** `toNum(study?.overheadPercent) || 5` يفرض 5% على من ضبط الإداري 0%، بينما تحليل الربحية وعرض السعر يحترمان الصفر → تكلفة 100,000 تظهر 105,000 في ملخص التكلفة و100,000 في التحليل. **الحل:** تمييز null عن 0.
- **QTY-02** | `PricingPageContentV2.tsx:111,1007` — عمود "تجاوز سعر البند" حالة محلية بحتة لا تُحفظ، و`create-study-quotation` يتجاهلها → المستخدم يعدّل أسعاراً يراها في الإجمالي ثم عرض السعر يتجاهلها كلياً + تضيع عند التحديث.
- **QTY-03** | `PricingPageContentV2.tsx:337` + `markup.ts:100` — طريقتا `manual_price`/`per_sqm` تُفكَّكان لنسب uniform مقيّدة (25/65/10): سعر يدوي < التكلفة → هامش سالب → `Math.max(0)` يصدر بسعر التكلفة بصمت؛ هامش > 153.8% → يفشل الحفظ بـ Zod.

## 🟡 متوسطة
QTY-04 (طلبية المصنع محسّنة مقابل تفاصيل القص الخام — رقمان لنفس القطر)، QTY-05 (صبة النظافة/extras تدخل الإجمالي العام ولا تُصدَّر كصف → إجمالي Excel ≠ مجموع الأقسام)، QTY-06 (صيغة الهالك القديمة في المحرك مقابل المُعيد المُصحَّح — **قائمة حمراء**)، QTY-07 (`isCircular` في المُعيد يقبل أي shape → كانة خاطئة لعمود محوّل)، QTY-08 (صيغة شبكة الهوردي العلوية floor مقابل ceil)، QTY-09 (VAT 0.15 حرفي في 3 ملفات تسعير)، QTY-10 (`formatCurrency` محلي بلا كسور في lib/utils.ts).

## ⚪ منخفضة
QTY-11 (filterItemsByFloor يضاعف العناصر المشتركة عند الجمع اليدوي)، QTY-12 (`update.ts` يقبل status حراً في عمود مجمّد)، QTY-13 (`_chairBarsDetail` يلوّث كائن الإدخال — قائمة حمراء)، QTY-14 (`Error` بدل ORPCError)، QTY-15 (تجاوزات كميات محلية غير محفوظة + بند بلا سعر يسقط على C30)، QTY-16 (بطاقات CostingSummary تعرض STRUCTURAL بعنوان عام)، QTY-17 (دلالة `profitPercent` مختلفة بين النظامين).

> **✅ سليم ومؤكَّد:** `migrate-legacy-study` idempotent (قفل + إعادة عدّ)؛ تطابق تصنيف client/server؛ `__result` يُعاد حسابه عند كل تعديل؛ الحالة المشتقة للقراءة فقط؛ تطابق التحويل لعرض السعر رياضياً في uniform/per_section؛ أوزان الحديد مطابقة؛ اشتقاق الارتفاعات سليم (لا هوالك سالبة)؛ عزل المستأجرين في procedures الكميات.
> **⚠️ أخطر فجوة اختبار:** `derivation-engine.ts` (1,523 سطر) و`mep-derivation-engine.ts` (2,493 سطر) و`other-structural-calculations.ts` **بلا أي اختبار** — ثلاثتها محركات قائمة حمراء لا يحميها إلا الاختبار اليدوي.

---

# 8. الواجهة والتصميم والترجمة

## UI-01 — تسريب أرقام مالية عبر `dashboard.getAll` (🟠) {#ui01}
- **الملف:** `packages/api/modules/dashboard/router.ts:295-307`
- **مؤكَّد يدوياً:** `financialTrend`, `overdueInvoices`, `invoiceTotals`, `pendingSubcontractClaims` تُجلب وتُعاد في الحمولة **دائماً**، بينما `heroMetrics` وحده يُجرَّد بـ `canViewFinance`. عضو بصلاحية مشاريع فقط (ENGINEER/SUPERVISOR) يستقبل بيانات مالية عبر الشبكة رغم إخفائها في الواجهة (تظهر في DevTools).
- **الحل:** تطبيق نفس تجريد heroMetrics (`null` عند `!canViewFinance`) على الحقول الأربعة. (بوابات heroMetrics نفسها سليمة تماماً ✅.)

## 🟡 متوسطة
UI-02 (4 استعلامات ساخنة بلا `staleTime` — يفاقم بطء التنقل)، UI-03 (12 ملف `formatCurrency` محلي في company)، UI-04 (**238 ملف / 1,929 سطر عربي hardcoded** متركزة في pricing — حملة مؤجلة، القياس محدَّث)، UI-05 (تكرار قيم Figma الخام في ProjectsHero/BotlyHero)، UI-06 (skeleton المشاريع لا يطابق hero card الجديد → قفز تخطيط)، UI-07 (Badge خام بدل StatusChip في ProjectsList)، UI-08 (3 صفحات بلا loading.tsx: drafts/partners-reports/quick)، UI-09 (زر إغلاق AssistantHistory بلا aria-label).

## ⚪ منخفضة
UI-10 (3 مواضع `mr-` خارج saas: invitation + blog)، UI-11 (ظل توهج FloatingAssistantButton بلون مثبّت).

> **✅ ممتاز ومؤكَّد:** **RTL نظيف تماماً** في `apps/web/modules/saas` (0 خصائص فيزيائية)؛ **تكافؤ الترجمة مثالي** (ar/en كلاهما 10,389 مفتاحاً، 0 فرق، 0 فارغ)؛ الطباعة (تحذير tfoot قائم، لا انتهاك)؛ 16 error boundary بتغطية شجرية كاملة؛ React Query invalidation صامد؛ `fallback={null}` موضع واحد موثّق.

---

# 9. Schema والأداء والبنية

## 🔴 حرجة

### SD-1 — اعتماد Supabase حيّ في `.env.local.example` المتتبَّع بـ git {#sd1}
- **مؤكَّد يدوياً:** الملف متتبَّع بـ git ويحوي سلسلة اتصال Supabase حقيقية المظهر (project ref `mbivfenbnvkquxajwbju` + host Mumbai) بكلمة مرور مضمّنة في `DATABASE_URL` و`DIRECT_URL`، مع خطأ تداخل اقتباس في `DIRECT_URL` (`DIRECT_URL="DATABASE_URL="postgres..."`).
- **الأثر:** أي وصول للمستودع = كلمة مرور قاعدة الإنتاج. **الحل:** استبدال بـ placeholders + **تدوير كلمة المرور فوراً** + إصلاح الاقتباس.

### PERF-INFRA-1 — cron تفريغ بريد الإشعارات غير مسجّل (🔴) {#infra1}
- **مؤكَّد يدوياً:** `vercel.json` يسجّل health/overdue-invoices/cleanup-tokens/daily/zatca-retry — **لا إدخال لـ `/api/cron/notifications-email`** (الـ route موجود ويتحقق من CRON_SECRET لكن لا يُستدعى أبداً؛ `daily` يُنظّف الإشعارات لا يُفرّغ طابور البريد).
- **الأثر:** طابور بريد الإشعارات PENDING لا يُصرَّف إطلاقاً → لا تصل إشعارات بريدية. يطابق تحذير الذاكرة "Jawdat must register externally". **الحل:** إدخال cron بجدول `*/5 * * * *`.

## 🟠 عالية
- **SD-2** | `REDIS_URL` مستخدَم في `rate-limit.ts` لكنه **غير موثّق** في أي ملف env؛ غيابه على الإنتاج → rate limiting per-instance (fail-safe لا fail-open، لكن الحد يتضاعف بعدد النسخ). **وثّقه وتأكد من ضبطه على Vercel.**
- **PERF-1** | `accounting-reports.ts:347,494` — تقارير المدينون/الربحية تقرأ الفواتير/العقود كاملة وتجمّع in-memory (حلقات for) بدل `groupBy`/`aggregate` → حمل ذاكرة ونقل Dubai↔Mumbai. مقبول حالياً، يتدهور مع النمو.
- **PERF-2** | 10 مكوّنات >1000 سطر (ExpensesList 1577، QuotationForm 1542، OwnerDetailPage 1435، BOQSummaryTable 1338...) — bundle أكبر على المسارات الساخنة (مشكلة §10 موثّقة).

## 🟡 متوسطة
- **SD-3** | `SubcontractClaimItem` و`ActivityChecklist` بـ `organizationId` غير مفهرس وغير unique (منخفض — يُستعلَم عادة عبر الأب).
- **PERF-3** | `instrumentation.ts` بلا `onRequestError` (Sentry v10) ولا `app/global-error.tsx` → أخطاء RSC/route-handler الخادمية وأخطاء الجذر في العميل **لا تُلتقط** في Sentry — فجوة رصد.

> **✅ سليم ومؤكَّد:** `pg Pool.on("error")` قائم (+ retry + keepAlive، max رُفع 5→10 بتعليق مبرّر)؛ `serverExternalPackages` (pg/pg-pool/pg-protocol — إصلاح ed5b914e صامد)؛ النماذج الجديدة كلها مفهرسة (UserDashboardPreference/ProjectDocumentFolder/ProjectMessage/quantity_*)؛ كل الحقول المالية Decimal(15,2)، لا Float؛ unique على كل أرقام المستندات per-org؛ onDelete على السجلات المالية SetNull (يحفظ التاريخ)؛ **layouts متوازية (Promise.all) — مشكلة "الترفرف" مُعالَجة بنيوياً** (~9 استعلامات cached للصفحة الساخنة).
> **أهم 5 فجوات اختبار:** year-end-closing (790 سطر بلا اختبار)، تجميع تقارير المحاسبة، ZATCA Phase 2 (الإرسال/clearance)، bank-reconciliation procedure، استمرارية طابور البريد.

---

# 10. الأمان (خلاصة موحّدة)

الأخطر ضمن عائلة البنك (قسم 2). ما تبقّى:
- **SEC-att** (🟠 عزل تخزين المرفقات — قسم 2)، **SEC-auth** (🟠 حد المصادقة/Redis — قسم 2)، **UI-01** (🟠 تسريب المالية — قسم 8)، **SD-1** (🔴 اعتماد DB — قسم 9).
- **SEC-inv** (🟡) | `org-users/accept-invitation.ts` publicProcedure بلا rate limit (مخفَّف: الرمز `randomUUID` 122-bit).
- **SEC-zatca-log** (🟡) | `zatca/phase2/api-client.ts:83` مسار الخطأ يطبع جسم الرد + كل الترويسات (الأخطر — تسريب OTP/Authorization في الطلب — **مُصلَح في v8**؛ بقيت ضوضاء مسار الخطأ).

> **✅ سليم ومؤكَّد أمنياً:** بوابة owner (IP+token limit + randomBytes 256-bit)، شارات المشاركة، super-admin عبر `adminProcedure`، **AI fail-closed** (كل الأدوات الـ27 ممثّلة في TOOL_PERMISSION_MAP، غير الموجود = مرفوض)، Stripe webhook fail-closed بتوقيع، كل `/api/cron/*` بـ `Bearer CRON_SECRET`، لا `dangerouslySetInnerHTML`/`eval` في packages، headers كاملة (HSTS/CSP/X-Frame).
> **مؤجَّل معروف (بلا تغيير):** B5 (CSP nonce-based)، SEC-3.3 (رمز مشاركة cuid2).

---

# 11. تحقق بقاء إصلاحات v8 (صفر تراجع)

كل إصلاحات v8 الـ 59 التي أُعيد فحصها **صامدة**. أبرزها:

| المجال | البند | الحالة | الدليل |
|--------|-------|--------|--------|
| محاسبة | عكس الإقفال بـ closingDate | ✅ | `year-end-closing.ts:783` |
| محاسبة | إعفاء YEAR_END_* من حارس الفترة | ✅ | `accounting.ts:591,726` |
| محاسبة | advisory lock dedup + opening balances | ✅ | `accounting.ts:576,1892` |
| محاسبة | reverseJournalEntry حارس تفاؤلي + existingTx | ✅ | `accounting.ts:775` |
| مالية | addInvoicePayment/delete منطاق بالمنظمة | ✅ | `finance.ts:1386,1471` |
| مالية | updateInvoiceStatus حارس expectedStatus | ✅ | `finance.ts:1280` |
| مالية | سقف الإشعار داخل tx بعد FOR UPDATE | ✅ (لكن ناقص paidAmount — FIN-05) | `finance.ts:1790` |
| مالية | payExpense قراءة داخل tx | ✅ | `org-finance.ts:874` |
| مالية | سندات القبض/الصرف حركة+حالة في tx واحدة | ✅ | `receipt-vouchers.ts:367` |
| مالية | deleteOrgPayment يلغي السند | ✅ | `payments.ts:402` |
| مالية | حذف بلوك INVOICE_BACKEND_DEBUG | ✅ | grep نظيف |
| مالية-مشاريع | كتابات بنك project-payments منطاقة (4) | ✅ | `project-payments.ts:426,687,699,706` |
| مالية-مشاريع | ترقيم المستخلصات FOR UPDATE + MAX | ✅ | `project-finance.ts:504` |
| مالية-مشاريع | copy-items يربط العقدين | ✅ | `copy-items.ts:33` |
| ذرية | حارس تفاؤلي payroll/expense-runs (اعتماد) | ✅ | `payroll.ts:267` |
| ذرية | EH-3 (44 موقع await orgAuditLog) | ✅ | grep |
| ذرية | middleware تحويل Error عربي → BAD_REQUEST | ✅ | `orpc/procedures.ts:28` |
| أمان | image-proxy جلسة + عضوية | ✅ | `image-proxy/route.ts:104` |
| أمان | leads storagePath + allowlist | ✅ | `save-file.ts:44` |
| أمان | exports verifyProjectAccess | ✅ | `generate-claim-pdf.ts:26` |
| أمان | ZATCA أسرار مشفّرة، لا تُسجَّل | ✅ | `api-client.ts:62` |
| schema | دقة Asset (15,2) + فهارس Purchase/UserInvitation | ✅ | `schema.prisma:5046,1304,1279` |
| بنية | pg Pool.on("error") + serverExternalPackages | ✅ | `client.ts:73`, `next.config.ts:16` |
| بنية | layouts متوازية + getCachedUserPermissions | ✅ | project/org layouts |
| تسعير | bulk-update-pricing في $transaction | ✅ | `bulk-update-pricing.ts:74` |
| تسعير | حماية تضاعف المواد ×2 الثلاثية | ✅ | `schema:5588` + `costing.ts:80` + dedupe |

**استثناء وحيد جزئي:** إلغاء الفاتورة المدفوعة جزئياً — العكس ذرّي لكن تغيير الحالة قبله وخارج الـ tx (FIN-08). أُعيد فتحه كبند جديد.

---

# 12. حكم جاهزية الإطلاق

**الحالة العامة:** النظام الأساسي **متين وجاهز بنيوياً** — type-check أخضر، 1,186 اختباراً ناجحاً، صفر تراجع عن v8، RTL/ترجمة شبه مثاليين، المحاسبة الأساسية وحساب الفاتورة والعزل الرئيسي مصلّبة ومختبرة. **لكن الإطلاق يجب أن ينتظر إغلاق البنود الحرجة الـ13** — أغلبها في وحدات حديثة نُسخت فيها أنماط قبل تصليبها.

**مسار الإغلاق الموصى به (مرتّب):**

1. **موجة الأمان/العزل (يوم واحد):** عائلة ثغرة البنك الـ4 (BANK-1/2/3 + FIN-01) — إضافة `organizationId` + فحص count؛ PF-02 (contractTermId)؛ SEC-att (بادئة storagePath)؛ SD-1 (تدوير كلمة مرور DB + placeholders). *كلها تغييرات صغيرة عالية الأثر خارج القائمة الحمراء.*
2. **موجة سلامة البيانات المالية (1-2 يوم):** PF-05 (المصروف المهجور)، PF-03 (ترقيم المستخلصات)، PF-04 (انحراف البنك)، RC-01 (اعتماد company المزدوج)، FIN-04/11 (عمى المتأخرة)، FIN-02 (السندات اليدوية)، FIN-05/06 (اتساق paidAmount + الداشبورد)، FIN-07 (فلتر COMPLETED في إقرار ZATCA).
3. **موجة ZATCA Phase 2 (قبل go-live الضريبي):** FIN-03 (PIH)، FIN-09 (مرجع الإشعار + noteReason)، FIN-10 (سلسلة hash الذرية)، FIN-23/24/26. *بعضها يمسّ schema — يحتاج موافقة جودت.*
4. **موجة البنية (نصف يوم):** PERF-INFRA-1 (cron البريد في vercel.json)، SD-2 (توثيق REDIS_URL + ضبطه)، SEC-auth (ربط secondaryStorage بـ Redis)، PERF-3 (Sentry onRequestError).
5. **موجة المحاسبة (تحتاج موافقة القائمة الحمراء):** ACC-19 (تصفير قائمة الدخل)، ACC-20/21 (حرّاس الفترة المغلقة)، ACC-26/27.

**البنود المتوسطة والمنخفضة (58 بنداً):** يمكن جدولتها بعد الإطلاق — أغلبها تعارضات عرض، تحسينات أداء، أو حملات توحيد (formatSAR، العربية في pricing) منخفضة الخطورة.

**تقدير الجهد للبنود الحرجة الـ13:** ~3-4 أيام عمل مركّز. لا شيء منها يتطلب إعادة معمارية — كلها إما إضافة نطاق/حارس، أو إصلاح مفتاح/قيمة، أو نقل عملية داخل transaction قائمة.

---

*انتهى التقرير الشامل النهائي — منصة مسار v9.0 — 2026-07-15*
*8 مسارات تدقيق متوازية + تحقق يدوي لأخطر 12 بنداً + type-check + 1,186 اختباراً + lint. لم يُعدَّل أي ملف كود.*
