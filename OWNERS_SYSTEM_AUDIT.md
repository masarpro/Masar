# تقرير تشخيصي شامل: منظومة الشركاء/الملاك في Masar

> **تاريخ التقرير:** 2026-04-13
> **المُعِد:** Claude Code — تدقيق آلي مبني على قراءة فعلية للكود
> **النطاق:** كل ما يخص Partners/Owners — Backend + Frontend + Schema + Accounting + Navigation

---

## Section 1 — Executive Summary

### ✅ موجود بشكل كامل ويعمل

- **إدارة الشركاء (CRUD):** إنشاء/تعديل/تعطيل الشركاء مع تحقق من نسب الملكية (≤100%) — Backend + Frontend كامل
- **سحوبات المالك:** إنشاء/إلغاء مع اكتشاف تجاوز الربح المتاح (overdraw) — Backend + Frontend كامل (قائمة + نموذج + تفاصيل + طباعة)
- **مساهمات رأس المال:** إنشاء/إلغاء مع 3 أنواع (ابتدائي/إضافي/عيني) — Backend + Frontend كامل (قائمة + نموذج)
- **الإقفال السنوي (Year-End Closing):** معاينة + تنفيذ + عكس مع توزيع أرباح حسب نسب الملكية — Backend + Frontend كامل
- **القيود المحاسبية التلقائية:** `onOwnerDrawing`, `onCapitalContribution` — تعمل بشكل كامل
- **دليل حسابات حقوق الملكية:** 3000-3500 مع حسابات 34xx مخصصة لكل شريك
- **بوابة المالك الخارجية:** `/owner/[token]` — نظام مستقل لمالك المشروع (ملخص + مطالبات + أوامر تغيير + محادثة)

### ⚠️ موجود جزئياً

- **صفحة تفاصيل الشريك:** موجودة في `/settings/owners/[ownerId]` لكنها **أساسية جداً** — تعرض بيانات الاتصال + إجمالي السحوبات فقط. لا تعرض: رأس المال، حصة الأرباح، الرصيد الحالي في حقوق الملكية، سجل المساهمات.
- **الإقفال السنوي:** لا يحتوي على tabbed preview أو typed confirmation — يستخدم AlertDialog بسيط مع زر "تأكيد".

### ❌ ناقص كلياً

- **لوحة شريك شاملة (Owner Dashboard):** لا توجد صفحة واحدة تجمع: رأس المال + السحوبات + حصة الأرباح + الرصيد الجاري
- **تقرير كشف حقوق الملكية (Statement of Owner's Equity):** غير موجود كتقرير مستقل
- **توزيع أرباح يدوي/منفصل (Profit Distribution):** لا يوجد — التوزيع يحدث فقط ضمن الإقفال السنوي
- **صفحة تفاصيل مساهمة رأس مال:** لا توجد صفحة `[contributionId]` للعرض/الطباعة

### أهم 3 فجوات من منظور المستخدم

1. **لا توجد لوحة شريك شاملة** — المستخدم لا يستطيع رؤية صورة كاملة عن أي شريك في مكان واحد
2. **لا يوجد تقرير حقوق ملكية** — لا يمكن طباعة أو مشاركة كشف حقوق الملكية مع المحاسب
3. **صفحة تفاصيل الشريك فقيرة** — لا تعرض رأس المال ولا حصة الأرباح ولا سجل المساهمات

---

## Section 2 — إجابات مباشرة على أسئلة المستخدم

### س1: أين "لوحة الشريك"؟

**نعم، توجد صفحة تفاصيل شريك** في المسار:
```
/app/[organizationSlug]/settings/owners/[ownerId]
```
- **الملف:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/owners/[ownerId]/page.tsx`
- **المكون:** `OwnerDetailPage.tsx` في `apps/web/modules/saas/settings/components/owners/OwnerDetailPage.tsx` (300 سطر)

**ما تعرضه فعلياً:**
- الاسم (عربي + إنجليزي) — `OwnerDetailPage.tsx:121-127`
- نسبة الملكية — `:128-131`
- حساب السحوبات (كود GL + اسم الحساب) — `:132-139`
- الهوية الوطنية، الهاتف، البريد الإلكتروني — `:140-155`
- الملاحظات — `:156-159`
- **إجمالي السحوبات (رقم واحد فقط)** — `:236-254`
- حالة الشريك (نشط/معطل) — `:179-189`
- زر "عرض السحوبات" يوجه لـ `/finance/owner-drawings?ownerId={id}` — `:256-263`
- زر "تعطيل الشريك" مع تأكيد — `:267-296`

**ما لا تعرضه (الفجوة):**
- ❌ إجمالي رأس المال المساهم به
- ❌ سجل مساهمات رأس المال
- ❌ حصة الشريك من أرباح السنة الحالية (YTD)
- ❌ الرصيد الحالي في حقوق الملكية
- ❌ سجل السحوبات مباشرة في الصفحة (فقط رابط خارجي)
- ❌ بطاقات KPI (رأس مال، سحوبات، أرباح، رصيد)

### س2: أين تظهر سحوبات المالك بعد التسجيل؟

السحوبات تظهر في **4 أماكن:**

| # | الصفحة | المسار | ما تعرضه |
|---|--------|--------|----------|
| 1 | **قائمة السحوبات** | `/finance/owner-drawings` | قائمة كل السحوبات مع فلاتر (شريك، حالة، بحث) + بطاقات ملخص (إجمالي مسحوب، ربح السنة، المتاح) |
| 2 | **تفاصيل السحب** | `/finance/owner-drawings/[drawingId]` | كل تفاصيل السحب + طباعة سند + إلغاء |
| 3 | **تفاصيل الشريك** | `/settings/owners/[ownerId]` | إجمالي السحوبات (رقم واحد) + رابط للقائمة |
| 4 | **معاينة الإقفال السنوي** | `/finance/year-end-closing` | عمود "السحوبات" في جدول توزيع الأرباح |

**إضافياً:**
- القيود اليومية المحاسبية: كل سحب ينشئ قيد يظهر في `/finance/journal-entries`
- تبويب "سحب مالك" في نافذة إضافة مصروف (Tab 3 المُضاف حديثاً) — يُسجّل السحب مباشرة

**نعم، يوجد سجل مرئي:** `OwnerDrawingsList.tsx` في `/finance/owner-drawings` — مع بحث وفلاتر وبطاقات ملخص.
- **الملف:** `apps/web/modules/saas/finance/components/owner-drawings/OwnerDrawingsList.tsx` (245 سطر)

### س3: أين تظهر حصة الشريك من الأرباح؟

**حصة الأرباح تظهر في مكانين فقط:**

1. **معاينة الإقفال السنوي** (`/finance/year-end-closing`) — جدول توزيع الأرباح يعرض لكل شريك: نسبة الملكية، حصته من الربح، سحوباته، الصافي المُحوَّل للأرباح المبقاة.
   - `YearEndClosingPage.tsx:249-323`

2. **فحص تجاوز السحب (Overdraw Check)** — عند تسجيل سحب جديد، البطاقات الجانبية في `OwnerDrawingForm.tsx` تعرض: ربح السياق، حصة المالك، السحوبات السابقة، المتاح.
   - `OwnerDrawingForm.tsx:328-437`

**الفجوة:** لا يوجد عرض **دائم ومستقل** لحصة كل شريك من الأرباح. الحصة تُحسب فقط عند:
- معاينة الإقفال السنوي (يدوي — الضغط على "معاينة")
- تسجيل سحب جديد (تلقائي — overdraw check)

**لا يوجد توزيع أرباح منفصل** — التوزيع يحدث ضمنياً عبر الإقفال السنوي فقط.

---

## Section 3 — Backend Inventory

| Module | File Path | Procedures | Status |
|--------|-----------|------------|--------|
| Owners CRUD | `packages/api/modules/accounting/procedures/organization-owners.ts` | list, getById, create, update, deactivate, getTotalOwnership, ensureDrawingsSystem (7) | ✅ كامل |
| Owner Drawings | `packages/api/modules/accounting/procedures/owner-drawings.ts` | list, getById, create, cancel, checkOverdraw, companySummary, projectSummary, ownerSummary (8) | ✅ كامل |
| Capital Contributions | `packages/api/modules/accounting/procedures/capital-contributions.ts` | list, getById, create, cancel, getByOwner (5) | ✅ كامل |
| Year-End Closing | `packages/api/modules/accounting/procedures/year-end-closing.ts` | preview, execute, history, reverse (4) | ✅ كامل |
| Auto-Journal (Owners) | `packages/api/lib/accounting/auto-journal.ts` | onOwnerDrawing (:749), onOwnerDrawingCancelled (:812), onCapitalContribution (:832) | ✅ كامل |
| Profit Distribution (standalone) | — | — | ❌ غير موجود |
| Equity Statement Report | — | — | ❌ غير موجود |
| Owner Dashboard API | — | — | ⚠️ الـ APIs الفرعية موجودة (ownerSummary, getByOwner, companySummary) لكن لا يوجد endpoint موحّد |

---

## Section 4 — Database Schema Inventory

### 4.1 OrganizationOwner
- **الموقع:** `schema.prisma:5605-5640`
- **الحقول:** id, organizationId, name, nameEn?, ownershipPercent(5,2), nationalId?, phone?, email?, drawingsAccountId?(@unique), isActive(default:true), notes?, createdById?, timestamps
- **العلاقات:** `drawings: OwnerDrawing[]`, `capitalContributions: CapitalContribution[]`, `drawingsAccount: ChartAccount`
- **Constraints:** `@@unique([organizationId, name])`, `@@index([organizationId, isActive])`
- **الاستخدام:** ✅ مُستخدم بفعالية في 7 procedures + frontend كامل

### 4.2 OwnerDrawing
- **الموقع:** `schema.prisma:5694-5757`
- **الحقول:** id, organizationId, drawingNo(@unique), date, amount(15,2), currency(SAR), ownerId, bankAccountId?, projectId?, type(COMPANY_LEVEL|PROJECT_SPECIFIC), status(APPROVED|CANCELLED), journalEntryId?, hasOverdrawWarning, overdrawAmount?, overdrawAcknowledgedBy/At?, approvedById/At?, cancelledAt?, cancelReason?, description?, notes?, createdById, timestamps
- **العلاقات:** owner, bankAccount, project, journalEntry, approvedBy, createdBy
- **Constraints:** `@@unique([organizationId, drawingNo])`, indexes على status, ownerId, projectId
- **الاستخدام:** ✅ مُستخدم بفعالية

### 4.3 CapitalContribution
- **الموقع:** `schema.prisma:5652-5688`
- **الحقول:** id, organizationId, ownerId, contributionNo(@unique), date, amount(15,2), type(INITIAL|ADDITIONAL|IN_KIND), bankAccountId?, description?, notes?, journalEntryId?(@unique), status(ACTIVE|CANCELLED), cancelledAt?, cancelReason?, createdById, timestamps
- **العلاقات:** owner, bankAccount, journalEntry, createdBy
- **Constraints:** `@@unique([organizationId, contributionNo])`, indexes على ownerId, date
- **الاستخدام:** ✅ مُستخدم بفعالية

### 4.4 YearEndClosing
- **الموقع:** `schema.prisma:5763-5806`
- **الحقول:** id, organizationId, fiscalYear(Int), closingDate, totalRevenue(15,2), totalExpenses(15,2), netProfit(15,2), totalDrawings(15,2), retainedEarningsTransfer(15,2), closingJournalEntryId?(@unique), drawingsClosingEntryId?(@unique), distributionDetails(Json), status(COMPLETED|REVERSED), reversedAt?, reversedById?, createdById, timestamps
- **العلاقات:** closingJournalEntry, drawingsClosingEntry, reversedBy, createdBy
- **Constraints:** `@@unique([organizationId, fiscalYear])`
- **الاستخدام:** ✅ مُستخدم بفعالية

### غير موجود:
- ❌ `ProfitDistribution` — التوزيع مخزون كـ JSON في `YearEndClosing.distributionDetails`
- ❌ `Dividend` — غير موجود
- ❌ `EquityStatement` — غير موجود

---

## Section 5 — Frontend Inventory

| Page/Component | Route/Path | Purpose | Connected To API | Visible in Nav? |
|---------------|------------|---------|-----------------|----------------|
| **OwnersList** | `/settings/owners` | قائمة الشركاء + نسب الملكية | `owners.list`, `owners.getTotalOwnership` | ✅ Settings sidebar (adminOnly) |
| **OwnerForm** | `/settings/owners/new` | إنشاء شريك جديد | `owners.create`, `owners.getTotalOwnership` | ✅ زر من القائمة |
| **OwnerDetailPage** | `/settings/owners/[ownerId]` | تفاصيل الشريك + تعطيل | `owners.getById`, `owners.deactivate` | ✅ click من القائمة |
| **OwnerDrawingsList** | `/finance/owner-drawings` | قائمة السحوبات + ملخص | `ownerDrawings.list`, `ownerDrawings.companySummary`, `owners.list` | ✅ Finance sidebar |
| **OwnerDrawingForm** | `/finance/owner-drawings/new` | تسجيل سحب + overdraw check | `ownerDrawings.create`, `ownerDrawings.checkOverdraw`, `owners.list`, `banks.list`, `projects.list` | ✅ زر من القائمة |
| **OwnerDrawingDetail** | `/finance/owner-drawings/[drawingId]` | تفاصيل + طباعة + إلغاء | `ownerDrawings.getById`, `ownerDrawings.cancel` | ✅ click من القائمة |
| **CapitalContributionsList** | `/finance/capital-contributions` | قائمة المساهمات | `capitalContributions.list`, `owners.list` | ✅ Finance sidebar |
| **CapitalContributionForm** | `/finance/capital-contributions/new` | تسجيل مساهمة | `capitalContributions.create`, `owners.list`, `banks.list` | ✅ زر من القائمة |
| **YearEndClosingPage** | `/finance/year-end-closing` | معاينة + تنفيذ + تاريخ + عكس | `yearEnd.preview`, `yearEnd.execute`, `yearEnd.history`, `yearEnd.reverse` | ✅ Finance sidebar |
| **OwnerDrawingTab** | (داخل نافذة المصروف) | تسجيل سحب سريع | `ownerDrawings.create`, `ownerDrawings.checkOverdraw` | ✅ Tab في dialog |
| **OwnerAccessManagement** | `/projects/[projectId]/owner` | إدارة tokens بوابة المالك | `projectOwner.listAccess`, `createAccess`, `revokeAccess` | ✅ Project sidebar |
| **Owner Portal** | `/owner/[token]` (public) | لوحة مالك المشروع (خارجية) | `projectOwner.portal.*` | ✅ رابط مباشر |
| Capital Contribution Detail | — | غير موجود | — | ❌ |
| Owner Dashboard (شامل) | — | غير موجود | — | ❌ |
| Equity Statement Report | — | غير موجود | — | ❌ |

---

## Section 6 — Accounting Flow

### 6.1 Capital Contribution (مساهمة رأس مال)

| البند | القيمة |
|-------|--------|
| Handler | `onCapitalContribution()` — `auto-journal.ts:832-886` |
| Trigger | عند إنشاء مساهمة جديدة (ACTIVE فوراً) |
| DR | Bank account (من `bankAccountId` أو 1110 افتراضي) |
| CR | 3100 (رأس المال) |
| Reference | `CAPITAL_CONTRIBUTION` → `CNT-JE-YYYY-XXXX` |
| عكس | عبر `reverseAutoJournalEntry()` عند الإلغاء |

### 6.2 Owner Drawing (سحب مالك)

| البند | القيمة |
|-------|--------|
| Handler | `onOwnerDrawing()` — `auto-journal.ts:749-807` |
| Trigger | عند إنشاء سحب جديد (APPROVED فوراً) |
| DR | 34xx (حساب سحوبات الشريك المخصص) |
| CR | Bank account (من `bankAccountId` أو 1110 افتراضي) |
| Reference | `OWNER_DRAWING` → `OWD-JE-YYYY-XXXX` |
| عكس | `onOwnerDrawingCancelled()` — `auto-journal.ts:812-827` عبر `reverseAutoJournalEntry()` |

### 6.3 Year-End Closing (إقفال سنوي)

| البند | القيمة |
|-------|--------|
| Handler | `executeYearEndProcedure` — `year-end-closing.ts:316-663` |
| Trigger | عند تنفيذ الإقفال يدوياً |
| **القيد 1 (إقفال P&L):** | |
| DR | كل حسابات الإيرادات (4xxx) لتصفيرها |
| CR | كل حسابات المصروفات (5xxx/6xxx) لتصفيرها |
| الفرق → | CR 3200 (أرباح مبقاة) = صافي الربح |
| **القيد 2 (إقفال سحوبات):** | |
| DR | 3200 (أرباح مبقاة) بإجمالي السحوبات |
| CR | كل حسابات 34xx لتصفيرها |
| **العكس:** | `reverseYearEndProcedure` — يعكس كلا القيدين |

### 6.4 Profit Distribution (توزيع أرباح مستقل)

| البند | القيمة |
|-------|--------|
| Handler | ❌ **غير موجود** |
| ملاحظة | التوزيع يحدث ضمنياً فقط عبر الإقفال السنوي. لا يوجد توزيع أرباح مستقل خلال السنة. |

---

## Section 7 — Gap Analysis

### 7.1 Backend Gaps

| الفجوة | التفاصيل | الأولوية |
|--------|---------|---------|
| **Equity Statement Query** | لا يوجد procedure لحساب كشف حقوق الملكية (Capital + Retained + Drawings = Total Equity) لكل شريك | P0 |
| **Owner Combined Summary** | لا يوجد endpoint واحد يُرجع: رأس المال + السحوبات + حصة الأرباح + الرصيد — الـ APIs الفرعية موجودة لكن غير مجمّعة | P1 |
| **Standalone Profit Distribution** | لا يمكن توزيع أرباح أو سلف على الأرباح خلال السنة — فقط عبر الإقفال السنوي | P2 |
| **Capital Contribution Cancel Validation** | لا يتحقق ممن يلغي المساهمة هل أثّر ذلك على حسابات أخرى | P2 |

### 7.2 Frontend Gaps

| الفجوة | التفاصيل | الأولوية |
|--------|---------|---------|
| **Owner Dashboard Page** | لا توجد صفحة شاملة تجمع كل بيانات الشريك في مكان واحد | P0 |
| **Equity Statement Report** | لا يوجد تقرير مطبوع لحقوق الملكية | P0 |
| **Capital Contribution Detail Page** | لا توجد صفحة `[contributionId]` لعرض/طباعة تفاصيل المساهمة | P1 |
| **Owner Edit Page** | لا توجد صفحة تعديل بيانات الشريك (فقط إنشاء + تعطيل) | P1 |
| **OwnerDetailPage enrichment** | صفحة `/settings/owners/[ownerId]` لا تعرض رأس المال ولا حصة الأرباح ولا سجل المساهمات | P0 |

### 7.3 UX Gaps (Backend موجود لكن UI مفقود)

| الوظيفة | Backend | Frontend | الفجوة |
|---------|---------|----------|--------|
| `ownerSummary` — ملخص شامل لشريك واحد (حصته، سحوباته، رصيده) | ✅ `owner-drawings.ts:1062-1188` | ❌ غير مستخدم في أي صفحة | **Backend جاهز، Frontend مفقود** |
| `projectSummary` — ربحية مشروع من منظور السحوبات | ✅ `owner-drawings.ts:979-1057` | ❌ غير مستخدم | **Backend جاهز، Frontend مفقود** |
| `companySummary` — ملخص سنوي شامل | ✅ `owner-drawings.ts:790-974` | ⚠️ مستخدم جزئياً فقط في `OwnerDrawingsList.tsx` (4 بطاقات) | بيانات بحسب الشريك وبحسب المشروع وبحسب الشهر غير معروضة |
| `getByOwner` — مساهمات شريك محدد | ✅ `capital-contributions.ts:437-485` | ❌ غير مستخدم في أي مكون | **Backend جاهز، Frontend مفقود** |
| `capitalContributions.cancel` — إلغاء مساهمة | ✅ `capital-contributions.ts:322-432` | ❌ لا يوجد زر إلغاء في القائمة | **Backend جاهز، Frontend مفقود** |

---

## Section 8 — Proposed Owner Dashboard Spec

### المسار المقترح
```
/app/[organizationSlug]/settings/owners/[ownerId]
```
(توسيع الصفحة الموجودة `OwnerDetailPage.tsx` بدلاً من إنشاء صفحة جديدة)

### البطاقات/الأقسام المقترحة

**Header:**
- اسم الشريك (عربي + إنجليزي) + Badge (نشط/معطل)
- نسبة الملكية (بروجرس بار)
- كود حساب السحوبات (34xx)

**KPI Cards (4 بطاقات):**
1. **رأس المال المساهم:** إجمالي المساهمات النشطة — API: `capitalContributions.getByOwner`
2. **إجمالي السحوبات:** إجمالي السحوبات المعتمدة للسنة — API: `ownerDrawings.ownerSummary`
3. **حصته من الأرباح (YTD):** ربح السنة × نسبة الملكية — API: `ownerDrawings.ownerSummary` (يُرجع `expectedShare`)
4. **الرصيد المتاح للسحب:** حصة الأرباح + رأس المال - السحوبات — API: `ownerDrawings.ownerSummary` أو `checkOverdraw`

**Tabs/Sections:**
1. **سجل المساهمات (Capital Contributions)** — جدول من `capitalContributions.getByOwner`
2. **سجل السحوبات (Drawings)** — جدول من `ownerDrawings.list` مع فلتر `ownerId`
3. **سجل القيود المحاسبية** — قيود مرتبطة بهذا الشريك (عبر حساب 34xx)

**أزرار الإجراءات:**
- تسجيل مساهمة رأسمالية جديدة → `/finance/capital-contributions/new?ownerId={id}`
- تسجيل سحب جديد → `/finance/owner-drawings/new?ownerId={id}`
- تعطيل الشريك (موجود حالياً)

### قائمة الـ APIs المطلوبة

| API | الحالة | ملاحظة |
|-----|--------|--------|
| `owners.getById` | ✅ موجود | يُرجع بيانات أساسية + إجمالي سحوبات |
| `ownerDrawings.ownerSummary` | ✅ موجود لكن **غير مُستخدم في UI** | يُرجع: expectedShare, actualDrawings, balance, byMonth, byProject |
| `capitalContributions.getByOwner` | ✅ موجود لكن **غير مُستخدم في UI** | يُرجع: إجمالي + قائمة مساهمات |
| `ownerDrawings.list` (مع فلتر ownerId) | ✅ موجود ومُستخدم | |
| Equity balance per owner | ❌ **ناقص** | يحتاج endpoint جديد أو حساب من القيود على حساب 34xx + 3100 |

---

## Section 9 — Recommended Roadmap

### P0 — حرج (يجب بناؤه لإكمال الحد الأدنى)

| # | المهمة | الحجم | الملفات المتوقعة |
|---|--------|-------|-----------------|
| 1 | **توسيع OwnerDetailPage كـ Owner Dashboard** — إضافة KPI cards + tabs (مساهمات، سحوبات) باستخدام APIs الموجودة (`ownerSummary`, `getByOwner`) | **M** | `OwnerDetailPage.tsx` (تعديل ~+300 سطر) |
| 2 | **تقرير كشف حقوق الملكية** — صفحة + API يُرجع لكل شريك: رأس المال، الأرباح المستحقة، السحوبات، الرصيد | **L** | Backend: `equity-statement.ts` جديد (~200 سطر) + Frontend: `EquityStatementReport.tsx` (~300 سطر) + route جديد |

### P1 — مهم

| # | المهمة | الحجم | الملفات المتوقعة |
|---|--------|-------|-----------------|
| 3 | **صفحة تفاصيل مساهمة رأس المال** — عرض + طباعة + إلغاء | **S** | Route `[contributionId]/page.tsx` + `CapitalContributionDetail.tsx` (~200 سطر) |
| 4 | **تعديل بيانات الشريك** — صفحة أو dialog لتعديل الاسم/النسبة/بيانات الاتصال | **S** | `OwnerEditForm.tsx` (~150 سطر) أو dialog داخل `OwnerDetailPage.tsx` |
| 5 | **زر إلغاء في قائمة المساهمات** — `capitalContributions.cancel` موجود في Backend لكن لا يوجد زر | **S** | تعديل `CapitalContributionsList.tsx` (~30 سطر) |
| 6 | **عرض بيانات companySummary كاملة** — الـ API يُرجع بيانات بحسب الشريك/المشروع/الشهر لكن القائمة تعرض 4 بطاقات فقط | **S** | تعديل `OwnerDrawingsList.tsx` (~100 سطر) |

### P2 — مستقبلي

| # | المهمة | الحجم | الملفات المتوقعة |
|---|--------|-------|-----------------|
| 7 | **توزيع أرباح مستقل (خلال السنة)** — إنشاء model + procedure + UI لتوزيع أرباح بدون إقفال سنوي | **L** | Schema change + backend procedure + frontend |
| 8 | **Typed Confirmation للإقفال السنوي** — كتابة "إقفال 2025" بدل زر عادي | **S** | تعديل `YearEndClosingPage.tsx` (~20 سطر) |
| 9 | **Tabbed Preview للإقفال** — تبويبات (ملخص، توزيع، قيود مقترحة، تحذيرات) بدل صفحة واحدة | **M** | تعديل `YearEndClosingPage.tsx` (~200 سطر) |

---

## Section 10 — Discrepancies vs. User Memories

| الميزة حسب الذاكرة | الحالة الفعلية | الدليل | ملاحظة |
|---|---|---|---|
| Owner drawings مع auto-journal | ✅ كامل — Backend + Frontend + auto-journal | `auto-journal.ts:749-807`, `owner-drawings.ts:335-621`, `OwnerDrawingForm.tsx`, `OwnerDrawingDetail.tsx` | مطابق تماماً |
| Per-partner overdraw warnings | ✅ كامل — debounced check + AlertDialog + sidebar context cards | `owner-drawings.ts:193-330` (backend), `OwnerDrawingForm.tsx:105-175` (frontend) | مطابق تماماً |
| `CapitalContribution` history table | ⚠️ **DB + Backend كامل، Frontend جزئي** | DB: `schema.prisma:5652-5688`, Backend: `capital-contributions.ts:32-87`, Frontend: `CapitalContributionsList.tsx` | القائمة موجودة، لكن **لا توجد صفحة تفاصيل** ولا زر إلغاء في UI |
| Year-end closing with tabbed preview | ⚠️ **Closing كامل، لكن بدون tabs** | `YearEndClosingPage.tsx:119-566` | **لا يوجد tabbed preview** — الصفحة تعرض KPIs + جدول توزيع + تحذيرات + تاريخ في صفحة واحدة بدون تبويبات |
| Typed confirmation للـ year-end | ❌ **غير موجود** | `YearEndClosingPage.tsx:496-527` | يستخدم `AlertDialog` عادي مع زر "تأكيد التنفيذ" — **لا يوجد حقل كتابة "إقفال XXXX" للتأكيد** |

---

## Section 11 — Open Questions for the User

### 1. نموذج المحاسبة للشركاء
هل المنشأة **شراكة (Partnership)** أم **شركة ذات مسؤولية محدودة (LLC)**؟
- في النظام الحالي: النموذج هو **شراكة** (سحوبات مالك = Drawing، ليس Dividend)
- حساب 3500 "توزيعات الأرباح" موجود في دليل الحسابات لكن **غير مُستخدم** في أي عملية
- إذا كانت المنشأة LLC: قد تحتاج تغيير من "سحب مالك" إلى "توزيع أرباح"

### 2. توزيع الأرباح
هل التوزيع:
- **تلقائي بحسب نسب الملكية** (كما هو الحال حالياً في الإقفال السنوي)؟
- أم **يدوي بمبالغ محددة** (قد يحتاج مودل جديد `ProfitDistribution`)؟
- هل يُحتاج توزيع أرباح **خلال السنة** (مثل ربع سنوي) أم فقط عند الإقفال؟

### 3. لوحة الشريك — من يصل إليها؟
- **الأدمن فقط؟** (الوضع الحالي — `/settings/owners/[ownerId]` متاح لـ adminOnly)
- أم **كل شريك يرى لوحته فقط**؟ (يتطلب ربط OrganizationOwner بـ User + permission check)
- ملاحظة: `/owner/[token]` (بوابة المالك) هي **نظام مختلف تماماً** — بوابة مالك المشروع (العميل)، وليست بوابة الشريك/المساهم

### 4. نطاق Year-End Closing
الإقفال الحالي يُنشئ **قيدين**:
- **القيد 1:** إقفال حسابات الإيرادات والمصروفات → 3200 (أرباح مبقاة)
- **القيد 2:** إقفال حسابات السحوبات (34xx) → 3200

السؤال: هل يجب أن تُقفل السحوبات إلى **3200 (أرباح مبقاة)** كما هو الحال، أم إلى **3100 (رأس المال)** مباشرة؟ هذا يعتمد على النموذج المحاسبي المتبع.

### 5. Multi-currency للشركاء
- النظام الحالي: كل شيء بـ **SAR** (حقل `currency` في `OwnerDrawing` مع default `SAR`)
- هل قد يساهم شريك بعملة أخرى؟ (يتطلب تحويل عملة عند المساهمة)

---

> **نهاية التقرير**
> تاريخ الإنتاج: 2026-04-13
> مبني على قراءة فعلية لـ 24 ملف مصدري عبر أدوات Read/Grep/Glob
> كل ادعاء مدعوم بمسار ملف ورقم سطر من الكود المصدري
