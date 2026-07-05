# سجل قرارات جلسة ما قبل الإطلاق — prelaunch-all-fixes

> التاريخ: 2026-07-05 | التنفيذ: Claude Code (ذاتي بالكامل)
> الصيغة: `[المرحلة] القرار | البدائل المرفوضة | السبب | الثقة`

---

## قرارات عامة

- **[عام] شجرة العمل تحتوي تعديلات غير مُرتكبة من جلسة سابقة (loading skeletons + صفحات quantities/photos).** القرار: تُترك كما هي، وكل commit يضيف ملفاته بشكل صريح (`git add <paths>`) وليس `git add -A`. | البديل المرفوض: `git stash` (خطر فقدان عمل المالك) أو ارتكابها ضمن مراحلي (تلويث الـcommits). | الثقة: عالي
- **[عام] النشر:** بطلب من المالك (رسالة أثناء الجلسة): استخدام `git push --no-verify` عند الدفع. | الثقة: عالي

## المرحلة 0 — نتائج التحقق

### المرحلة 3 (webhook): فرضية Moyasar غير صحيحة ⚠️
- grep شامل للمستودع: **صفر** نتائج لـ`moyasar` — لا provider ولا route ولا env var. المزوّد الوحيد الموصول هو **Stripe** (`packages/payments/provider/index.ts:1` يصدّر stripe فقط).
- التحقق من توقيع Stripe **موجود أصلاً** عبر `constructEventAsync` مع `STRIPE_WEBHOOK_SECRET` (`packages/payments/provider/stripe/index.ts:145-157`)، مع idempotency عبر `checkEventProcessed`.
- الفجوات الفعلية: (1) غياب `STRIPE_WEBHOOK_SECRET` يمر كـcast `as string` ويفشل بشكل غامض، (2) فشل التحقق يُسجَّل بـ`logger.error` فقط دون Sentry.
- **القرار:** لا أبني تكامل Moyasar من الصفر (كود ميت غير قابل للاختبار مقابل بوابة غير موجودة في الكود). أُحصّن Stripe webhook الموجود: fail-closed صريح عند غياب الـsecret + تسجيل Sentry عند فشل التحقق. | البديل المرفوض: بناء endpoint Moyasar وهمي — يخالف "لا كود ميت" ولا يمكن التحقق منه. | الثقة: عالي — لكن ⚠️ **على المالك تأكيد هوية بوابة الدفع الفعلية**؛ إن كانت Moyasar فعلاً فتكاملها غير موجود في الكود أصلاً (وليس فقط webhook التحقق).

### المرحلة 2 (credit note opening balance): محلول مسبقاً على الأرجح ⏭️
- الإشعار الدائن يُنشأ بمبالغ **سالبة**: `packages/database/prisma/queries/finance.ts:1720-1724` (`negTotalAmount`) مع تعليق "Bug #9 fix" (حد المبلغ، سطر 1698-1715) و"Bug #8 fix" (تحديث paidAmount للفاتورة الأصلية، سطر 1778-1790).
- الرصيد الافتتاحي في `client-statements.ts:47-78` يجمع `_sum.totalAmount` — والسالب يطرح تلقائياً → فاتورة 10,000 + إشعار 2,000 قبل الفترة = 8,000 ✓
- حركات الفترة (سطر 115-124) تعرض الإشعار في عمود الدائن بـ`Math.abs` — متسق مع الافتتاحي.
- بانتظار فحص aging report وملخصات العملاء (وكيل الاختبارات) قبل الشطب النهائي.

### المرحلة 4 (تحصين النقاط العامة): محلولة مسبقاً بالكامل ⏭️
- **4.أ CAPTCHA:** Cloudflare Turnstile مطبّق فعلاً:
  - Server: `packages/api/lib/turnstile.ts:30-74` — `verifyTurnstileToken` fail-closed (الإنتاج بدون `TURNSTILE_SECRET_KEY` = رفض؛ أي فشل fetch = رفض BAD_REQUEST).
  - Contact: `packages/api/modules/contact/procedures/submit-contact-form.ts:22-24` — rate limit IP `PUBLIC_FORM` 3/دقيقة + Turnstile.
  - Newsletter: `packages/api/modules/newsletter/procedures/subscribe-to-newsletter.ts:25-28` — نفس النمط.
  - Widget: `apps/web/modules/shared/components/TurnstileWidget.tsx:40-44` — `language: "ar"` + `size: flexible` + dev bypass.
- **4.ب Rate limiting بوابة المالك:** موجود فعلاً في `packages/api/modules/project-owner/procedures/exchange-token.ts:24-31` — IP‏ `OWNER_EXCHANGE` 5/دقيقة + per-token 30/دقيقة + تأخير 1 ثانية على الفشل؛ وكل endpoints البوابة تستدعي `rateLimitToken` (30/دقيقة).
- **القرار:** لا عمل مطلوب. ⚠️ يتبقى على المالك ضبط `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` في Vercel (بدون site key لن يعمل نموذج التواصل في الإنتاج لأن الزر يبقى معطلاً). | الثقة: عالي
- ملاحظة خارج النطاق (توثيق فقط): endpoints العامة تقرأ IP من `x-forwarded-for` مباشرة بينما يوجد helper أفضل `getClientIp` يفضّل `x-real-ip` (`rate-limit.ts:360`) — توحيدها تحسين مستقبلي.

### المرحلة 1 (race condition المطالبات): محلولة مسبقاً ⏭️ + ثغرات مجاورة موثّقة
- **مطالبات المشروع:** `packages/database/prisma/queries/project-finance.ts` — `createProjectClaim` (487-571) و`updateClaimStatus` (577-684) و`updateProjectClaim` (809-892): كلها داخل `db.$transaction` مع قفل `SELECT ... FOR UPDATE` على `project_contracts` وإعادة تحقق من السقف (قيمة العقد + أوامر التغيير المعتمدة) داخل الـtransaction، مع خطأ `CLAIMS_EXCEED_CONTRACT_VALUE` يُترجم لرسالة عربية في الـprocedures.
- **مطالبات الباطن:** `packages/database/prisma/queries/subcontract-claims.ts` — `createSubcontractClaim` (146+, قفل سطر 171-174) و`updateSubcontractClaimStatus` (629+, قفل 676-679): قفل `subcontract_contracts FOR UPDATE` + تحقق كميات لكل بند (`QTY_EXCEEDS_REMAINING`).
- **القرار:** لا عمل — البندان الأساسيان محصّنان. | الثقة: عالي
- **مواضع مماثلة موثّقة فقط (لا توسّع، حسب نص المهمة):**
  - `subcontract-claims.ts:806` — `addSubcontractClaimPayment`: transaction بلا قفل قبل قراءة `paidAmount` → دفعتان متزامنتان قد تتجاوزان المستحق.
  - `subcontract.ts:610` — `createSubcontractPayment`: بلا قفل وبلا سقف مقابل قيمة العقد.
  - `subcontract.ts:533,567` — أوامر تغيير الباطن: بلا قفل/تحقق، واعتمادها يغيّر السقف الفعلي دون تسلسل مع المطالبات.
  - `project-payments.ts:406` — `createProjectPayment`: بلا قفل.

### المرحلة 5 (تضاعف تكلفة المواد) — التشخيص الكامل قبل الإصلاح
**السطح المتأثر:** `CostingSummaryTab.tsx` (ملخص تسعير التكلفة) يقرأ `pricing.studies.costing.getSummary`.
**السبب الجذري (بالدليل):** صفوف `CostingItem` مكررة في قاعدة البيانات، مصدرها `costingGenerateItems` (`packages/api/modules/quantities/procedures/costing.ts:53-199`):
1. النمط `count` ثم `createMany` **غير ذري وبلا قفل** (سطر 74-80 ثم 195)، ولا يوجد unique constraint على `(costStudyId, sourceItemType, sourceItemId)` في الـschema (`schema.prisma:5504-5551`).
2. التوليد يُستدعى تلقائياً من **5 مواضع** قد تتزامن عند أول فتح لصفحة التسعير: `CostingPageContentV2.tsx:68-72`، `FinishingCostingTab.tsx:166-175`، `StructuralCostingTab.tsx:99-111`، `MEPCostingTab.tsx:69`، `pipeline/CostingPageContent.tsx:60` — طلبان متزامنان يريان كلاهما `count == 0` فيُدرج كل منهما مجموعة كاملة.
3. **لماذا المواد تتضاعف والمصنعيات لا:** `materialTotal` مخزّن على كل صف فجمعه (`costing.ts:525`) يتضاعف مع التكرار؛ بينما مصنعيات الإنشائي lump sum على **الصف الأول فقط** (`costingSetSectionLabor`, costing.ts:412-481) والصفوف المكررة تحمل `laborTotal = 0` — يطابق تماماً 18,134.49 → 36,268.98 مع مصنعيات صحيحة.
**الإصلاح المقرر (بأقل تغيير، بلا schema):**
1. جعل التوليد ذرياً: `$transaction` + قفل `SELECT id FROM cost_studies WHERE id = $1 FOR UPDATE` (نفس نمط المطالبات) + إعادة العدّ داخل الـtransaction + تحقق أن الدراسة تتبع المنظمة.
2. دفاع في القراءة: إزالة التكرار في `costingGetSummary` حسب `(sourceItemType, sourceItemId)` مع إبقاء الأحدث تعديلاً — يصحّح العرض للبيانات المكررة تاريخياً دون حذف بيانات.
3. إصلاح ثانوي في نفس السطح: `CostingSummaryTab.tsx:80-81` يقرأ `grandTotal?.materialTotal/laborTotal` بينما الـAPI يعيد `grandTotal.material/labor` → صف الإجمالي يعرض صفراً.
**بدائل مرفوضة:** unique constraint (تعديل schema ممنوع)؛ حذف تلقائي للصفوف المكررة من DB (خطر فقدان تعديلات المستخدم على أحد التكرارات — العرض الموحّد أأمن). | الثقة: عالي

## المرحلة 7 — وحدة المالك

- **[7.أ] OwnerDetailPage مبوّبة: محلولة مسبقاً ⏭️** — فرضية المهمة ("تعرض الإجماليات فقط") قديمة. الصفحة الحالية (`apps/web/modules/saas/settings/components/owners/OwnerDetailPage.tsx` — 1443 سطراً) تستهلك فعلاً `ownerSummary` + `capitalContributions.getByOwner` + `ownerDrawings.list` وتعرض: 4 بطاقات KPI (رأس المال/حصة الربح/المسحوبات/الرصيد)، 3 تبويبات (ملخص/مساهمات/مسحوبات)، بطاقة سياق حقوق الملكية، رسم شهري، وجدول المسحوبات حسب المشروع (يغطي مطلب تبويب "المشاريع" معلوماتياً). القرار: لا إعادة بناء ولا تبويبات مكررة للمحتوى نفسه. | البديل المرفوض: إضافة تبويبي "مشاريع" و"حقوق ملكية" يكرران بيانات معروضة — ضوضاء بلا معلومة جديدة. | الثقة: عالي
- **[7.ب] تقرير حقوق الملاك:** الجدول موجود أصلاً في `PartnersOverviewTab.tsx` (لكل شريك: رأس المال المدفوع، نسبة الملكية، المسحوبات، حصة ربح السنة، الرصيد الجاري عبر `partners.listWithSummary`). **الفجوة الوحيدة:** "حصة الأرباح المحتجزة" — أُضيف عمود يحسبها من `ownerDrawings.companySummary.retainedEarnings × نسبة الملكية` خلف حارس `canViewProfits` نفسه. لا endpoint جديد (تجميع قراءة من endpoints قائمة). | الثقة: عالي
- **[7.ج] إقفال السنة:** الخلفية كاملة مسبقاً (preview/execute/history/reverse) والواجهة موجودة بمعاينة مفصلة وتحذيرات. **الفجوة:** التأكيد كان AlertDialog عادياً — أُضيف تأكيد مكتوب بنمط GitHub (كتابة رقم السنة لتفعيل زر الإقفال) + مفاتيح ترجمة ar/en. | الثقة: عالي
- **[7.د] توزيع الأرباح: محلول ضمن إقفال السنة ⏭️** — لا يوجد endpoint توزيع مستقل في النظام؛ التوزيع يُحسب ويُعرض في معاينة الإقفال (`yearEnd.preview.profitDistribution` لكل مالك: الحصة، المسحوبات، الفرق، المحوّل للمبقاة) ويُخزَّن في `YearEndClosing.distributionDetails`، والواجهة تعرضه في جدول المعاينة. بناء كيان توزيع جديد = منطق محاسبي جديد خارج الصلاحية. | الثقة: عالي

## حوادث الجلسة (شفافية كاملة)

- **⚠️ جلسة متزامنة على نفس الـbranch:** أثناء عملي ظهرت commits ليست مني (`6d815a80` loading skeletons، `4d53b900` إصلاح محاسبي NEWFIX/دفعات المشاريع) — يبدو أن جلسة/شخصاً آخر يعمل على نفس المستودع والـbranch. تعاملت معها بعدم إعادة كتابة التاريخ إطلاقاً وبإعادة قراءة أي ملف قبل تعديله.
- **⚠️ commit مدموج:** فشل commit المرحلة 7.ب بسبب خطأ تفسير here-string في PowerShell، فدخلت ملفاته (PartnersOverviewTab + الترجمات) ضمن commit ‏7.ج (`a0d9cf57` "typed confirmation for year-end closing") الذي كان قد دُفع. **لم أُصحّح بـforce-push** لوجود الجلسة المتزامنة — الرسالة تغطي 7.ج فقط بينما المحتوى يشمل 7.ب أيضاً. | الثقة: عالي في القرار، والوضع موثّق هنا وفي التقرير.
- **خطأ type-check غير مرتبط:** أثناء فحص المرحلة 8.ج ظهر خطأ وحيد في `finance/invoices/[invoiceId]/credit-note/page.tsx` (استخدام `FormPageSkeleton` بعد حذف استيراده) — ملف غير مُرتكب تعمل عليه الجلسة الأخرى، لم ألمسه. ملفاتي كلها type-check نظيفة (api + database + بقية web).

## المرحلة 8 — تنظيف التقارير

- **[8.أ] getRevenueByPeriod:** المشكلة الوحيدة كانت استعلام فواتير PAID يُجلب ولا يُستخدم (dead query). استُخرج منطق التجميع لدالة نقية `groupPaymentsByMonth` واختُبر بـ5 اختبارات تثبيت **قبل** الحذف، ثم حُذف الاستعلام الميت. الدلالات (أساس نقدي بشهر الدفع) لم تتغير. | الثقة: عالي
- **[8.ب] المستخلصات المعتمدة غير المفوترة:** أُضيفت كقسم `uninvoicedClaims` منفصل في `getAgedReceivables` + الـprocedure + بطاقة مستقلة في التقرير. **قرار:** لا دمج مع إجماليات المفوتر — لا يوجد ربط مستخلص↔فاتورة في الـschema، والدمج قد يحسب نفس العمل مرتين إذا فُوتر مستخلص لاحقاً. | البديل المرفوض: إدخالها في دلاء الأعمار — يتطلب dueDate إلزامياً وربط فواتير غير موجود. | الثقة: عالي
- **[8.ج] توزيع CompanyExpenseAllocation:** طُبّق في **الـprocedure** (طبقة القراءة) وليس في `getCostCenterByProject` المشتركة — لأن الأخيرة تُستهلك أيضاً في فحوص سحوبات الملاك (`owner-drawings`) وتغييرها يغيّر دلالات الرصيد المتاح للسحب. الأساس: دفعات `CompanyExpensePayment` المسددة (`isPaid`) في فترة التقرير (وليس مبلغ المصروف الاسمي المتكرر). التقريب: خانتان مع إسناد الفرق **لآخر** مركز (`allocateByPercentages` — 6 اختبارات تشمل 100.00/أثلاث = 33.33+33.33+33.34). العرض: عمود منفصل "مصروفات شركة موزَّعة" دون المساس بصافي الربح GL (تجنّب خلط أساسين محاسبيين في رقم واحد). | البدائل المرفوضة: تعديل netProfit مباشرة (يغيّر تقريراً معتمداً وخطر ازدواج لو سُجّلت GL بمشروع لاحقاً)؛ التوزيع على أساس مبلغ المصروف الاسمي (يتجاهل الفترة والسداد الفعلي) — ⚠️ ثقة متوسطة في اختيار `paidAt` أساساً زمنياً (البديل: `dueDate`). 

