# تقرير تدقيق الصلاحيات المالية العميق — منصة مسار

> ✅ **تحديث 2026-07-19: تم إصلاح جميع النتائج الحرجة والعالية** (راجع قسم "سجل الإصلاح" في نهاية الملف). القرار المعتمد من جودت: من يرى المالية هو من مُنح الصلاحية من إعدادات الأعضاء — الإنفاذ بأعلام الصلاحيات لا بأسماء الأدوار.

> **التاريخ:** 2026-07-18
> **النطاق:** هل يستطيع المشرف الميداني (SUPERVISOR) أو أي دور غير مالي (ENGINEER, CUSTOM) رؤية أرقام مالية — فواتير، قيم عقود، تكاليف، أسعار بيع، رواتب، بطاقات مالية؟
> **المنهجية:** 5 مسارات فحص متوازية (API منظمة، API مشاريع، تسعير/كميات، واجهة أمامية، قنوات جانبية) + تحقق يدوي من كل نتيجة حرجة.
> **الحكم العام:** ❌ **السياسة مخترقة.** المشرف الميداني والمهندس يستطيعان فعلياً جلب أرقام مالية حقيقية من عدة مسارات — رغم أن الوحدات المالية الأساسية (finance/accounting/company) محكمة بشكل ممتاز.

---

## خلاصة تنفيذية

**السبب الجذري واحد يتكرر في كل الثغرات:** بوابات القراءة تستخدم صلاحيات عامة (`pricing.view`, `quantities.view`, `projects.view`, أو العضوية فقط) بينما الحمولة المرجعة تحتوي حقول مالية — ولا يوجد حجب حقول (field stripping) إلا في مكان واحد (`dashboard.getAll`) وهو نفسه ناقص.

المصفوفة الافتراضية (packages/database/prisma/permissions.ts) تمنح SUPERVISOR:
`projects.view=true`, `quantities.view=true`, `pricing.view=true`, `reports.view=true` — وهذه الأربعة هي مفاتيح كل التسريبات أدناه.

---

## 🔴 حرج — أرقام مالية حقيقية تصل للمشرف الميداني الآن

### C1. إجراءات الداشبورد المنفصلة — بلا أي فحص صلاحية (عضوية فقط)
`packages/api/modules/dashboard/router.ts` — تم التحقق يدوياً:
| الإجراء | السطر | ما يسرّبه |
|---|---|---|
| `getStats` | 42-54 | إجمالي قيم العقود، إجمالي المصروفات، المستخلصات المدفوعة والمعلقة، أثر أوامر التغيير — على مستوى المنظمة كاملة |
| `getFinancialSummary` | 93-105 | لكل مشروع (أعلى 10): قيمة العقد + إجمالي المصروفات + المستخلصات المدفوعة |
| `getFinancialTrend` | 173-185 | سلسلة الحركة النقدية الشهرية لـ 6 أشهر من حسابات 1110 |

كلها `verifyOrganizationMembership` فقط — أي عضو (مشرف/مهندس/مخصص) يمررها.

### C2. `getAll` يحجب الأقسام المالية لكن يسرّب `stats`
`dashboard/router.ts:298-310` — الحجب الخادمي مطبق على heroMetrics/overdueInvoices/financialTrend/invoiceTotals/pendingSubcontractClaims، لكن `stats` يُرجع كما هو (سطر 299) وهو يحتوي كتلة `financials` (قيم عقود + مصروفات + مستخلصات من `queries/dashboard.ts:89-98`).

### C3. وحدة التسعير/الكميات — كل قراءات التكلفة وسعر البيع خلف `pricing.view` (والمشرف يملكها!)
`packages/api/modules/quantities/procedures/` — تم التحقق يدوياً من costing.ts:363,650:
| الإجراء | الملف:السطر | ما يسرّبه |
|---|---|---|
| `costingGetItems` | costing.ts:363 | جدول التكاليف الكامل (مواد + مصنعيات + إجماليات) |
| `costingGetSummary` | costing.ts:650 | ملخص تكاليف الأقسام + overhead |
| `markupGetProfitAnalysis` | markup.ts:249 | **التكلفة + الربح + سعر البيع + هامش الأمان** — الصورة الكاملة |
| `markupGetSettings` | markup.ts:32 | نسب overhead/ربح/طوارئ + قيمة العقد |
| `list` (الدراسات) | list.ts:28 | totalCost لكل دراسة + `stats.totalValue` لكل المنظمة |
| `getById` | get-by-id.ts:26 | كل حقول التكلفة + contractValue + sectionMarkups |
| `getStructuralItems` / `getFinishingItems` / `getMEPItems` / `getLaborItems` | :24 في كل ملف | تكاليف المواد والمصنعيات لكل بند |
| `quoteList` / `quoteGetById` / `getQuotes` | quote-create.ts:89,212 | **أسعار البيع النهائية للعملاء** (الكتابة محمية بـ pricing.pricing لكن القراءة view فقط) |
| `listQuotations` / `getQuotation` | finance/procedures/list-quotations.ts:37,81 | عروض الأسعار بمبالغها وبنودها (unitPrice/totalAmount) — خلف `pricing.view` وليس `pricing.quotations` |
| `getPricingDashboard` | pricing/procedures/dashboard.ts:19 | إجمالي قيم الدراسات + قيم عروض الأسعار للمنظمة كاملة |

صلاحيات المراحل (`editCosting`, `editSellingPrice`, `pricing.pricing`, `quantities.pricing`) **لا تُفحص على أي مسار قراءة إطلاقاً** — تحمي الكتابة فقط.

### C4. BOQ المشروع — أسعار الوحدات والإجماليات خلف `quantities.view` + الواجهة تعرضها فعلاً
- Backend (تم التحقق يدوياً): `project-boq/procedures/get-summary.ts:24` وكذلك list.ts:47، get-by-phase.ts:29، get-boq-grouped-by-phase.ts:30، get-study-items-detail.ts:25 — كلها `quantities.view` وتعيد `unitPrice`, `totalPrice`, `grandTotal`.
- Frontend: `boq-by-phase-view.tsx:291-334` و `QuantitiesOverview.tsx:186,246-250` تعرض الأسعار والإجمالي المسعّر **بدون أي فحص دور** — وتبويب الكميات ظاهر للمشرف في `role-visibility.ts:40-49`.
- **هذا هو التسريب الوحيد الذي يظهر فيه المال فعلياً على شاشة المشرف اليوم** (البقية تتطلب نداء API مباشر أو المساعد الذكي).

### C5. الملخص الأسبوعي (Digest) — بلا فحص صلاحية
`digests/procedures/get-weekly-digest.ts:21-24` (تم التحقق يدوياً) — `verifyOrganizationAccess` بدون صلاحية. يعيد `upcomingPayments[].amount` (مبالغ المستخلصات المعتمدة/المقدمة) لكل المشاريع النشطة بالمنظمة، غير مقيد بمشاريع العضو.

---

## 🟠 عالي

### H1. `getProject` و `listProjects` يعيدان قيمة العقد خلف `projects.view`
- `projects/procedures/get-project.ts:28,42-44` (تم التحقق يدوياً) — كل عضو يفتح مشروعاً يستلم `contractValue` في الحمولة.
- `list-projects.ts:39,70-72` — قيمة العقد لكل مشروع + `stats.totalValue` = **مجموع قيم عقود كل مشاريع المنظمة** حتى لعضو مقيّد بمشاريع محددة (`queries/projects.ts:321-348`).

### H2. أدوات المساعد الذكي المربوطة على `projects.view` تعيد حقولاً مالية
- `packages/ai/tools/modules/projects-tools.ts:87-105` — `getProjectDetails` يعيد `contractValue` + شروط العقد (value/retentionPercent/vatPercent).
- `packages/ai/tools/assistant-tools.ts:96-124` — الأداة القديمة `queryProjects` تعيد contractValue (النظامان يعملان معاً في build-assistant-pipeline).
- `handover-tools.ts:62-74` — `queryHandover` يعيد `retentionReleaseAmount`.
- `project-chat-tools.ts:71-89` — `queryProjectChat` يقرأ قناة **المالك** التي تتضمن نصوص "المستخلص رقم X - {المبلغ} ر.س" (من publish-official-update.ts:81-101).
- الخريطة `TOOL_PERMISSION_MAP` نفسها مكتملة وfail-closed — المشكلة في ربط هذه الأدوات على صلاحية ضعيفة.

### H3. تقرير PDF الأسبوعي — مصروفات خلف `projects.view`
`exports/procedures/generate-weekly-report.ts:37-42,77-133` — يضمّن `expensesByCategory` (مجاميع مصروفات المشروع) بينما بقية التصديرات المالية محمية صحيحاً بـ `finance.payments`.

### H4. محاضر الاستلام تعيد مبلغ إفراج الضمان خلف `projects.view`
`handover/procedures/list-protocols.ts:47-50,129-132` — `findMany` بدون select يعيد كامل الصف بما فيه `retentionReleaseAmount` (Decimal 15,2).

### H5. المهندس (ENGINEER) — قسم المالية ظاهر له في المشروع + يستطيع تعديل التكاليف
- `apps/web/modules/saas/projects/lib/role-visibility.ts:27-39` — مصفوفة الرؤية تمنح ENGINEER قسمي `finance` و`finance/subcontracts` → يرى FinanceBudgetCard وBOQDashboardCard وتبويب مقاولي الباطن (تمتلئ بأصفار لأن الخادم يرفض، لكن الهيكل ظاهر — وأي مهندس منح إضافياً viewFinance يرى الأرقام).
- ENGINEER لديه `pricing.studies=true` → يستطيع **قراءة وتعديل** أسعار بنود التكلفة (`costingUpdateItem`/`bulkUpdate` تشترط studies فقط — costing.ts:418,497) رغم أن `editCosting=false`.

### H6. الشريط الجانبي العام يعرض روابط مالية المشروع لأي دور
`use-sidebar-menu.ts:162-179` — داخل المشروع تُحقن روابط `subcontracts/expenses/claims` وهي غير موجودة في `SIDEBAR_PERMISSION_MAP`، والعناصر غير المُعرّفة تظهر افتراضياً (permission-map.ts:172-177). الشريط الجانبي لا يعرف useProjectRole إطلاقاً.

---

## 🟡 متوسط

| # | الوصف | الموقع |
|---|---|---|
| M1 | `project-insights.getInsights` خلف `projects.view` — نص التنبيه يكشف "المصروفات بلغت X% من العقد" | get-insights.ts:20-25 + queries/project-insights.ts:107-127 |
| M2 | `useStudyConfig` بلا أي مدخل صلاحيات — مراحل التكلفة والتسعير تظهر لأي مشاهد دراسة | useStudyConfig.ts:30-146 |
| M3 | `PricingNavigation` بلا فلترة صلاحيات (تبويب عروض الأسعار يعمل فعلياً للمشرف لأن API مفتوح — C3) | PricingNavigation.tsx:17-51 |
| M4 | صفحات مالية المشروع بلا حارس مسار — الوصول المباشر بالرابط يعرض هيكلاً بأصفار بدل AccessDenied (الخادم يحمي الأرقام) | app/.../projects/[projectId]/finance/* |
| M5 | استعلامات مالية تُطلق بلا `enabled` للمشرف في ProjectOverview → ضجيج 403 في سجل permission.denied | ProjectOverview.tsx:51-62 |
| M6 | رواتب payroll خلف `company.view` بدل `employees.payroll` (لا تسريب للمشرف — دقة بوابة فقط) | company/procedures/payroll.ts |

---

## ✅ ما ثبت أنه محكم (لا إجراء مطلوب)

- **وحدة finance (23 ملف):** كل القراءات `finance.view`، الكتابات `finance.payments/invoices/settings`. سليمة.
- **وحدة accounting (12 ملف):** كلها خلف `finance.*`؛ partners-finance خلف verifyPartnerAccess (OWNER/ACCOUNTANT فقط). سليمة.
- **company/HR:** الرواتب والمصروفات خلف `company.*`/`employees.*` — محجوبة عن المشرف والمهندس. سليمة.
- **project-finance / project-payments / project-contract / subcontracts:** كل القراءات خلف `projects.viewFinance`. **هذا هو النمط الصحيح المرجعي.**
- **الإشعارات:** `notifyEvent` يعيد فحص صلاحية كل مستلم (notify.ts:96-118) — لا تصل إشعارات مالية للمشرف. سليمة.
- **واجهة الداشبورد:** BotlyHero وFinancePanel وQuickActionsGrid كلها خلف `showFinance`/`can()`. المشرف يرى داشبورد نظيفاً.
- **حراس المسارات:** `/finance/*`, `/company/*`, `/pricing/*` — redirect خادمي + SectionRouteGate. الوصول المباشر ممنوع.
- **العملاء المحتملون (leads):** كل الإجراءات (18 ملف) خلف `pricing.leads`. سليمة.
- **بوابة المالك:** token محدود النطاق، تستثني المصروفات الداخلية والربحية عمداً. مقبولة.
- **verifyProjectAccess/verifyOrganizationAccess نفسهما:** منطق سليم (حارس cross-tenant + نطاق المشاريع). كل الثغرات في اختيار المستدعي للصلاحية، لا في الآلية.

---

## خطة الإصلاح المقترحة (بالأولوية)

1. **C1+C2 (ساعة عمل):** إضافة فحص `finance.view` للإجراءات الثلاثة المنفصلة في dashboard/router.ts (أو حذفها إن كان getAll يغطيها)، وحجب `stats.financials` في getAll بنفس نمط heroMetrics.
2. **C3 (القرار المعماري الأهم):** إما (أ) نقل قراءات التكلفة/السعر إلى `quantities.pricing`/`pricing.pricing`، أو (ب) حجب حقول المال من الاستجابات عندما لا يملك الطالب سوى `view`. يشمل: costing, markup, quotes, quotations, pricing dashboard, study list/getById, item lists.
3. **C4:** حجب `unitPrice/totalPrice/grandTotal` في قراءات project-boq ما لم يملك الطالب `projects.viewFinance` (أو `quantities.pricing`)، + إخفاء أعمدة الأسعار في الواجهة بنفس الشرط.
4. **C5:** فحص صلاحية على digest أو إزالة المبالغ من upcomingPayments لغير المالية.
5. **H1:** حجب `contractValue` من getProject/listProjects لغير viewFinance + تقييد stats.totalValue بنطاق المشاريع المرئية.
6. **H2:** نقل الحقول المالية في أدوات AI الأربع خلف `projects.viewFinance` (النمط موجود في getProjectFinanceSummary).
7. **H3+H4:** weekly-report → `finance.view`؛ handover → select صريح أو حجب retentionReleaseAmount.
8. **H5+H6:** إزالة `finance`/`finance/subcontracts` من ENGINEER في role-visibility.ts؛ رفع قراءة/كتابة التكاليف عن `pricing.studies`؛ إضافة project-* items إلى SIDEBAR_PERMISSION_MAP.

> ⚠️ ملاحظة سياسة: طلب جودت أن "لا أحد غير المحاسب والمالك يرى الأرقام" — لكن PROJECT_MANAGER لديه حالياً `finance.view=true` و`viewFinance=true` افتراضياً. إن كانت السياسة حرفية، يجب أيضاً تقليص PROJECT_MANAGER — قرار منتج يحتاج تأكيداً صريحاً قبل التنفيذ.
> **حُسم 2026-07-19:** السياسة = صلاحيات إعدادات الأعضاء هي الحَكَم. PROJECT_MANAGER يبقى كما هو (قابل للتعديل من الإعدادات).

---

## سجل الإصلاح (2026-07-19)

**تم إصلاح كل النتائج الحرجة والعالية + M1-جزئي/M2/M3/M5.** type-check نظيف (web/api/ai/database) + 1109 اختبار API ناجح.

### Backend
- **C1+C2:** `dashboard/router.ts` — `getFinancialSummary`/`getFinancialTrend` تشترط `finance.view`؛ `getStats` و`getAll` يصفّران `stats.financials` و`changeOrders.totalCostImpact` عبر `stripStatsFinancials()`. إضافةً: `activeProjects` يصفّر `expensesTotal/paymentsTotal` بدون `viewFinance` (تسريب إضافي اكتُشف أثناء الإصلاح).
- **C3:** helper جديد `quantities/lib/pricing-access.ts` (قراءة تكاليف = editCosting|approveCosting|editSellingPrice|pricing|quantities.pricing؛ كتابة تكاليف؛ كتابة هوامش؛ قراءة عروض):
  - `costingGetItems`/`costingGetSummary` + `markupGetSettings`/`markupGetProfitAnalysis` → تتطلب صلاحية تكاليف.
  - كتابات costing (generate/update/bulkUpdate/bulk-labor) → `requireCostingWriteAccess` (أُغلق تصعيد ENGINEER عبر `pricing.studies`، ومُنح ACCOUNTANT حقه عبر editCosting).
  - كتابات markup → `requireSellingWriteAccess`.
  - `getQuotes`/`quoteList`/`quoteGetById` → `requireQuotationReadAccess`؛ `listQuotations`/`getQuotation`/drafts → `pricing.quotations`.
  - `list`/`getById` للدراسات → حجب حقول المال عبر `stripStudyMoney` + تصفير `stats.totalValue`.
  - قوائم البنود الأربع (structural/finishing/mep/labor) → `stripItemMoney`.
  - `getPricingDashboard` → تصفير قيم الدراسات/العروض/العملاء المحتملين حسب الصلاحية.
  - `getBOM` → تصفير unitPrice/totalPrice؛ `structural-specs.get`/`labor-breakdown.get` → حذف مفاتيح الأسعار من JSON عبر `scrubPriceKeys`.
- **C4:** helper `project-boq/lib/price-visibility.ts` (`canViewBoqPrices` = viewFinance|quantities.pricing) مطبق على: list, get-by-phase, get-boq-grouped-by-phase, get-summary, get-study-items-detail, get-available-cost-studies, get-available-quotations + وحدة project-quantities كاملة (get-summary, get-materials-list, get-phase-breakdown, list-studies, get-available-studies).
- **C5:** digest يحجب `upcomingPayments` بدون `finance.view`.
- **H1:** `getProject`/`listProjects` يحجبان `contractValue` و`stats.totalValue` بدون `viewFinance`.
- **H2:** أدوات AI — `getProjectDetails` (حقول العقد المالية خلف viewFinance)، `queryProjects` (list/details/stats)، `queryHandover` (retentionReleaseAmount)، `queryProjectChat` (قناة OWNER محصورة بـ viewFinance والافتراضي TEAM).
- **H3:** weekly-report PDF لا يضمّن المصروفات بدون viewFinance.
- **H4:** handover list/get يحجبان `retentionReleaseAmount` بدون viewFinance.

### Frontend
- **H5:** `role-visibility.ts` — حذف `finance`/`finance/subcontracts` من ENGINEER.
- **H6:** `permission-map.ts` — روابط `project-subcontracts/expenses/payments` خلف `projects.viewFinance`؛ وتشديد `study-costing/pricing/quotation` على صلاحيات التسعير الفعلية.
- **M2:** `useStudyConfig` يفلتر مراحل التكلفة/التسعير/العرض بالصلاحيات.
- **M3:** `PricingNavigation` يفلتر التبويبات (studies/quotations/leads) بالصلاحيات.
- **M5:** `ProjectOverview` — `enabled: showFinance` على الاستعلامات المالية + إعادة هيكلة شبكة البطاقات (التنفيذ والجدول الزمني يظهران دائماً، المالية بالصلاحية).
- **C4-UI:** `boq-by-phase-view.tsx` و`QuantitiesOverview.tsx` يخفيان أعمدة/بطاقات الأسعار بدون صلاحية.

### المتبقي (منخفض الأولوية)
- **M4:** صفحات مالية المشروع تعرض هيكلاً بأصفار عند الوصول المباشر بالرابط (الخادم يحمي الأرقام) — يُستحسن AccessDenied لاحقاً.
- **M6:** رواتب payroll خلف `company.view` بدل `employees.payroll` (دقة بوابة، لا تسريب).
- مكونات العرض الفرعية (MaterialsListView وأخواتها) تعرض أصفاراً بدل إخفاء الأعمدة — الخادم يحجب البيانات فعلياً، التحسين جمالي.
