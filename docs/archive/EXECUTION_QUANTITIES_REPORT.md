# تقرير تفصيلي: قسم التنفيذ وقسم الكميات والمواصفات

## الفهرس

1. [قسم التنفيذ (Execution)](#1-قسم-التنفيذ-execution)
2. [قسم الكميات والمواصفات (Quantities & BOQ)](#2-قسم-الكميات-والمواصفات-quantities--boq)
3. [العلاقات المشتركة والربط بينهما](#3-العلاقات-المشتركة-والربط-بينهما)
4. [نظام المراحل (Phases)](#4-نظام-المراحل-phases)
5. [الرسم البياني للعلاقات](#5-الرسم-البياني-للعلاقات)
6. [مسارات الملفات](#6-مسارات-الملفات)

---

## 1. قسم التنفيذ (Execution)

### 1.1 الوصف العام

قسم التنفيذ هو نظام متكامل لإدارة الجدول الزمني للمشروع وتتبع التقدم الفعلي مقابل المخطط. يتضمن المراحل (Milestones)، الأنشطة (Activities)، التبعيات (Dependencies)، وخطوط الأساس (Baselines).

### 1.2 النماذج (Database Models)

#### ProjectMilestone (المراحل/المعالم)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | String | المعرف الفريد |
| `projectId` | String | ربط بالمشروع |
| `title` | String | عنوان المرحلة |
| `description` | String? | وصف المرحلة |
| `orderIndex` | Int | ترتيب العرض |
| `plannedStart` | DateTime? | تاريخ البداية المخطط |
| `plannedEnd` | DateTime? | تاريخ النهاية المخطط |
| `actualStart` | DateTime? | تاريخ البداية الفعلي |
| `actualEnd` | DateTime? | تاريخ النهاية الفعلي |
| `status` | MilestoneStatus | الحالة (PLANNED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED) |
| `progress` | Decimal | نسبة الإنجاز (0-100) |
| `isCritical` | Boolean | هل هي على المسار الحرج؟ |
| `weight` | Decimal | الوزن النسبي للحساب المرجح |
| `progressMethod` | ProgressMethod | طريقة حساب التقدم (MANUAL, CHECKLIST, ACTIVITIES) |
| `color` | String? | لون العرض |
| `calendarId` | String? | ربط بالتقويم |

**طرق حساب التقدم:**
- **MANUAL**: يتم إدخال النسبة يدوياً
- **ACTIVITIES**: المتوسط المرجح لتقدم الأنشطة (بناءً على الوزن `weight`)
- **CHECKLIST**: نسبة العناصر المكتملة من قوائم التحقق

#### ProjectActivity (الأنشطة)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | String | المعرف الفريد |
| `milestoneId` | String | ربط بالمرحلة الأم |
| `title` | String | عنوان النشاط |
| `wbsCode` | String | كود هيكل تجزئة العمل (يُولّد تلقائياً: M{x}.A{y}) |
| `plannedStart` | DateTime? | تاريخ البداية المخطط |
| `plannedEnd` | DateTime? | تاريخ النهاية المخطط |
| `actualStart` | DateTime? | تاريخ البداية الفعلي |
| `actualEnd` | DateTime? | تاريخ النهاية الفعلي |
| `duration` | Int? | المدة بالأيام |
| `status` | ActivityStatus | الحالة (NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED, ON_HOLD, CANCELLED) |
| `progress` | Decimal | نسبة الإنجاز (0-100) |
| `isCritical` | Boolean | مسار حرج |
| `weight` | Decimal | الوزن النسبي |
| `assigneeId` | String? | المسؤول عن التنفيذ |
| `calendarId` | String? | ربط بالتقويم |
| `notes` | String? | ملاحظات |

**تحديث الحالة التلقائي:**
- `progress = 0%` → `NOT_STARTED`
- `progress = 1-99%` → `IN_PROGRESS`
- `progress = 100%` → `COMPLETED`

#### ActivityDependency (التبعيات)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `predecessorId` | String | النشاط السابق |
| `successorId` | String | النشاط اللاحق |
| `dependencyType` | DependencyType | نوع الارتباط |
| `lagDays` | Int | أيام التأخير/التقديم |

**أنواع التبعيات:**
- `FINISH_TO_START` (FS): يبدأ اللاحق بعد انتهاء السابق
- `START_TO_START` (SS): يبدآن معاً
- `FINISH_TO_FINISH` (FF): ينتهيان معاً
- `START_TO_FINISH` (SF): ينتهي اللاحق عند بدء السابق

> يتم الكشف عن الحلقات الدائرية (Cycle Detection) باستخدام خوارزمية DFS قبل إنشاء أي تبعية.

#### ActivityChecklist (قوائم التحقق)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `activityId` | String | ربط بالنشاط |
| `title` | String | عنوان العنصر |
| `isCompleted` | Boolean | مكتمل؟ |
| `completedAt` | DateTime? | تاريخ الإكمال |
| `completedById` | String? | من أكمله |
| `orderIndex` | Int | الترتيب |

#### ProjectBaseline (خطوط الأساس)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `name` | String | اسم خط الأساس |
| `snapshotDate` | DateTime | تاريخ اللقطة |
| `snapshotData` | JSON | بيانات الجدول الزمني الملتقطة |
| `isActive` | Boolean | خط الأساس النشط |

#### ProjectCalendar (تقويم المشروع)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `name` | String | اسم التقويم |
| `workDays` | JSON | أيام العمل (مصفوفة: 0=أحد، 1=إثنين، ...) |
| `holidays` | JSON | العطل الرسمية |
| `defaultHoursPerDay` | Decimal | ساعات العمل اليومية (افتراضي: 8) |
| `isDefault` | Boolean | التقويم الافتراضي |

### 1.3 واجهات API (27 إجراء)

#### الأنشطة
| الإجراء | الوصف |
|---------|-------|
| `listActivities` | عرض الأنشطة (مع فلترة بالمرحلة) |
| `createActivity` | إنشاء نشاط جديد |
| `updateActivity` | تحديث نشاط |
| `deleteActivity` | حذف نشاط |
| `reorderActivities` | إعادة ترتيب الأنشطة |
| `updateActivityProgress` | تحديث نسبة الإنجاز |
| `bulkUpdateProgress` | تحديث جماعي للتقدم |

#### التبعيات
| الإجراء | الوصف |
|---------|-------|
| `listDependencies` | عرض التبعيات |
| `createDependency` | إنشاء تبعية (مع كشف الحلقات) |
| `deleteDependency` | حذف تبعية |
| `validateDependencies` | التحقق من سلامة سلسلة التبعيات |

#### خطوط الأساس
| الإجراء | الوصف |
|---------|-------|
| `listBaselines` | عرض خطوط الأساس |
| `createBaseline` | إنشاء لقطة للجدول الزمني |
| `setActiveBaseline` | تعيين خط أساس نشط |
| `deleteBaseline` | حذف خط أساس |

#### التقويم
| الإجراء | الوصف |
|---------|-------|
| `getCalendar` | عرض إعدادات التقويم |
| `upsertCalendar` | إنشاء/تحديث التقويم |

#### قوائم التحقق
| الإجراء | الوصف |
|---------|-------|
| `listChecklists` | عرض قائمة التحقق |
| `createChecklistItem` | إضافة عنصر |
| `toggleChecklistItem` | تبديل حالة الإكمال |
| `deleteChecklistItem` | حذف عنصر |
| `reorderChecklist` | إعادة ترتيب |

#### التحليلات
| الإجراء | الوصف |
|---------|-------|
| `getDashboard` | لوحة المعلومات الرئيسية |
| `getCriticalPath` | تحليل المسار الحرج |
| `getLookahead` | الجدولة الاستباقية |
| `getDelayAnalysis` | تحليل التأخيرات |
| `getPlannedVsActual` | المخطط مقابل الفعلي |

### 1.4 المكونات المرئية (Components)

| المكون | الوظيفة |
|--------|---------|
| `ExecutionDashboard` | لوحة المعلومات الرئيسية (بطاقات + جدول + Gantt) |
| `AdvancedGanttView` | مخطط جانت تفاعلي مع السحب والإفلات |
| `GanttActivityBar` | شريط النشاط في مخطط جانت |
| `GanttMilestoneGroupBar` | شريط المرحلة |
| `GanttBaselineOverlay` | طبقة مقارنة خط الأساس |
| `DependencyLayer` | عرض خطوط التبعيات |
| `DependencyEditDialog` | حوار إنشاء/تعديل التبعية |
| `ActivityDetailSheet` | تفاصيل النشاط (قوائم تحقق + تبعيات) |
| `BaselineManagementDialog` | إدارة خطوط الأساس |
| `CalendarSettingsDialog` | إعدادات التقويم |
| `DelayAnalysisView` | عرض تحليل التأخيرات |
| `PlannedVsActualTable` | جدول المقارنة |
| `SCurveChart` | منحنى S للتقدم |
| `EnhancedMilestoneCard` | بطاقة المرحلة |
| `MilestoneTableView` | عرض جدولي للمراحل |
| `MilestoneTemplateDialog` | قوالب جاهزة للمراحل |

**أوضاع العرض (ViewMode):**
- `cards` — عرض البطاقات
- `table` — عرض الجدول
- `advanced` — مخطط جانت المتقدم

### 1.5 سير العمل

```
1. إنشاء المراحل (Milestones) مع تواريخ مخططة
2. إضافة أنشطة تحت كل مرحلة
3. تعيين تبعيات بين الأنشطة (اختياري)
4. إضافة قوائم تحقق للأنشطة (اختياري)
5. إنشاء خط أساس (Baseline) للمقارنة لاحقاً
6. تحديث التقدم → يتم تحديث حالة المرحلة تلقائياً
7. مراقبة المسار الحرج والتأخيرات عبر التحليلات
```

---

## 2. قسم الكميات والمواصفات (Quantities & BOQ)

### 2.1 الوصف العام

قسم الكميات يتكون من نظامين مترابطين:
1. **دراسة التكاليف (Cost Study)**: تقدير التكاليف قبل/أثناء المشروع
2. **جدول الكميات (BOQ - Bill of Quantities)**: إدارة بنود الكميات المرتبطة بالمشروع

### 2.2 النماذج (Database Models)

#### CostStudy (دراسة التكاليف)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | String | المعرف الفريد |
| `name` | String | اسم الدراسة |
| `customerName` | String? | اسم العميل |
| `projectType` | String? | نوع المشروع |
| `landArea` | Decimal? | مساحة الأرض |
| `buildingArea` | Decimal? | مساحة البناء |
| `numberOfFloors` | Int? | عدد الأدوار |
| `structuralCost` | Decimal | تكلفة الهيكل الإنشائي |
| `finishingCost` | Decimal | تكلفة التشطيبات |
| `mepCost` | Decimal | تكلفة الأعمال الميكانيكية والكهربائية |
| `laborCost` | Decimal | تكلفة العمالة |
| `overheadPercent` | Decimal | نسبة المصاريف العامة |
| `profitPercent` | Decimal | نسبة الربح |
| `contingencyPercent` | Decimal | نسبة الطوارئ |
| `totalCost` | Decimal | التكلفة الإجمالية |
| `projectId` | String? | ربط بالمشروع (اختياري) |

#### StructuralItem (بنود الأعمال الإنشائية)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | التصنيف |
| `subCategory` | String? | التصنيف الفرعي |
| `name` | String | اسم البند |
| `quantity` | Decimal | الكمية |
| `unit` | String | الوحدة |
| `concreteVolume` | Decimal? | حجم الخرسانة |
| `concreteType` | String? | نوع الخرسانة |
| `steelWeight` | Decimal? | وزن الحديد |
| `steelRatio` | Decimal? | نسبة التسليح |
| `wastagePercent` | Decimal? | نسبة الهالك |
| `materialCost` | Decimal | تكلفة المواد |
| `laborCost` | Decimal | تكلفة العمالة |
| `totalCost` | Decimal | التكلفة الإجمالية |
| `projectPhaseId` | String? | **ربط بمرحلة التنفيذ** |

#### FinishingItem (بنود التشطيبات)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | التصنيف (أرضيات، دهانات، ...) |
| `floorId` | String? | معرف الدور |
| `floorName` | String? | اسم الدور |
| `area` | Decimal? | المساحة |
| `quantity` | Decimal | الكمية |
| `unit` | String | الوحدة |
| `calculationMethod` | String? | طريقة الحساب الذكية |
| `qualityLevel` | String? | مستوى الجودة |
| `brand` | String? | العلامة التجارية |
| `specifications` | String? | المواصفات |
| `specData` | JSON? | بيانات المواصفات التفصيلية |
| `materialPrice` | Decimal | سعر المواد |
| `laborPrice` | Decimal | سعر العمالة |
| `totalCost` | Decimal | التكلفة الإجمالية |
| `wastagePercent` | Decimal? | نسبة الهالك |
| `projectPhaseId` | String? | **ربط بمرحلة التنفيذ** |

#### MEPItem (الأعمال الميكانيكية والكهربائية والصحية)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `category` | String | النظام (كهرباء، سباكة، تكييف) |
| `subCategory` | String? | التصنيف الفرعي |
| `itemType` | String? | نوع العنصر |
| `name` | String | الاسم |
| `quantity` | Decimal | الكمية |
| `unit` | String | الوحدة |
| `specifications` | String? | المواصفات |
| `specData` | JSON? | بيانات المواصفات |
| `qualityLevel` | String? | مستوى الجودة |
| `materialPrice` | Decimal | سعر المواد |
| `laborPrice` | Decimal | سعر العمالة |
| `totalCost` | Decimal | التكلفة الإجمالية |
| `projectPhaseId` | String? | **ربط بمرحلة التنفيذ** |

#### LaborItem (بنود العمالة)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `laborType` | String | نوع العمالة |
| `workerType` | String? | تصنيف العامل |
| `name` | String | الاسم |
| `quantity` | Int | العدد |
| `dailyRate` | Decimal | الأجر اليومي |
| `durationDays` | Int | مدة العمل بالأيام |
| `insuranceCost` | Decimal? | تكلفة التأمين |
| `housingCost` | Decimal? | تكلفة السكن |
| `totalCost` | Decimal | التكلفة الإجمالية |
| `projectPhaseId` | String? | **ربط بمرحلة التنفيذ** |

#### ProjectBOQItem (بنود جدول الكميات)

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | String | المعرف الفريد |
| `projectId` | String | ربط بالمشروع |
| `sourceType` | BOQSourceType | مصدر البند |
| `costStudyId` | String? | ربط بدراسة التكاليف |
| `sourceItemId` | String? | معرف البند المصدر |
| `quotationId` | String? | ربط بعرض السعر |
| `section` | BOQSection | القسم |
| `category` | String? | التصنيف |
| `code` | String? | الكود |
| `description` | String | الوصف |
| `specifications` | String? | المواصفات |
| `quantity` | Decimal | الكمية |
| `unit` | String | الوحدة |
| `unitPrice` | Decimal? | سعر الوحدة |
| `totalPrice` | Decimal? | السعر الإجمالي |
| `projectPhaseId` | String? | **ربط بمرحلة التنفيذ** |
| `notes` | String? | ملاحظات |

**مصادر بنود BOQ (`BOQSourceType`):**
- `MANUAL` — إدخال يدوي
- `COST_STUDY` — نسخ من دراسة تكاليف
- `IMPORTED` — استيراد من Excel/CSV
- `CONTRACT` — من العقد
- `QUOTATION` — من عرض سعر

**أقسام BOQ (`BOQSection`):**
- `STRUCTURAL` — إنشائي
- `FINISHING` — تشطيبات
- `MEP` — ميكانيكا وكهرباء
- `LABOR` — عمالة
- `GENERAL` — عام

### 2.3 واجهات API

#### دراسة التكاليف (Cost Study)
| الإجراء | الوصف |
|---------|-------|
| `create` | إنشاء دراسة تكاليف |
| `list` | عرض الدراسات |
| `getById` | عرض دراسة محددة |
| `update` | تحديث الدراسة |
| `delete` | حذف الدراسة |
| `duplicate` | تكرار الدراسة |
| `recalculate` | إعادة حساب الإجماليات |

#### بنود الكميات (لكل نوع: structural, finishing, mep)
| الإجراء | الوصف |
|---------|-------|
| `create` | إنشاء بند |
| `createBatch` | إنشاء مجموعة بنود |
| `update` | تحديث بند |
| `delete` | حذف بند |
| `reorder` | إعادة ترتيب |
| `batchSpecUpdate` | تحديث مواصفات جماعي (للتشطيبات) |

#### جدول الكميات (Project BOQ)
| الإجراء | الوصف |
|---------|-------|
| `list` | عرض البنود (مع فلترة وصفحات وترتيب) |
| `getSummary` | ملخص الإجماليات حسب القسم |
| `create` | إنشاء بند |
| `bulkCreate` | إنشاء بنود جماعي |
| `update` | تحديث بند |
| `delete` | حذف بند |
| `bulkDelete` | حذف جماعي |
| `bulkUpdatePrices` | تحديث أسعار جماعي |
| `assignPhase` | **تعيين بند لمرحلة تنفيذ** |
| `getByPhase` | **عرض البنود حسب المرحلة** |
| `copyFromCostStudy` | نسخ من دراسة تكاليف |
| `copyFromQuotation` | نسخ من عرض سعر |
| `importFromData` | استيراد من Excel/CSV |
| `getUnpricedItems` | البنود بدون تسعير |
| `getAvailableQuotations` | عروض الأسعار المتاحة |
| `getAvailableCostStudies` | الدراسات المتاحة |

#### ربط الكميات بالمشروع (Project Quantities)
| الإجراء | الوصف |
|---------|-------|
| `getSummary` | ملخص كميات المشروع |
| `listStudies` | الدراسات المرتبطة بالمشروع |
| `linkStudy` | ربط دراسة بالمشروع |
| `unlinkStudy` | فك ربط دراسة |
| `createStudy` | إنشاء دراسة جديدة للمشروع |
| `getPhaseBreakdown` | **تفصيل البنود حسب المراحل** |
| `assignItemToPhase` | **تعيين بند كمية لمرحلة** |
| `bulkAssignToPhase` | **تعيين جماعي لمرحلة** |
| `getMaterialsList` | قائمة المواد المجمعة |
| `getAvailableStudies` | الدراسات المتاحة للربط |

### 2.4 المكونات المرئية

#### مكونات الكميات
| المكون | الوظيفة |
|--------|---------|
| `QuantitiesOverview` | الملخص العام |
| `StructuralItemsView` | عرض البنود الإنشائية مع تعيين المراحل |
| `FinishingItemsView` | عرض بنود التشطيبات |
| `MEPItemsView` | عرض بنود MEP |
| `LaborItemsView` | عرض بنود العمالة |
| `MaterialsListView` | قائمة المواد المجمعة (تجميع حسب التصنيف/المرحلة/الدراسة) |
| `CreateStudyDialog` | حوار إنشاء دراسة جديدة |
| `LinkStudyDialog` | حوار ربط دراسة موجودة |

#### مكونات جدول الكميات (BOQ)
| المكون | الوظيفة |
|--------|---------|
| `BOQOverview` | الواجهة الرئيسية |
| `boq-items-table` | جدول مع صفحات وترتيب واختيار |
| `boq-filters` | فلترة حسب القسم والمصدر وحالة التسعير |
| `boq-summary-cards` | بطاقات ملخص الإجماليات |
| `boq-bulk-actions` | شريط العمليات الجماعية |
| `create-item-dialog` | حوار إنشاء بند |
| `bulk-entry-dialog` | حوار الإدخال الجماعي |
| `pricing-mode-dialog` | حوار التسعير |
| `copy-from-study-dialog` | نسخ من دراسة تكاليف |
| `copy-from-quotation-dialog` | نسخ من عرض سعر |
| `import-excel-dialog` | استيراد من Excel |

### 2.5 سير العمل

```
1. إنشاء دراسة تكاليف (Cost Study) مع معلومات المبنى
2. إضافة بنود في 4 أقسام: إنشائي، تشطيبات، MEP، عمالة
3. ربط الدراسة بالمشروع (linkStudy)
4. إنشاء جدول كميات (BOQ) عبر:
   ├── نسخ من دراسة التكاليف (copyFromCostStudy)
   ├── نسخ من عرض سعر (copyFromQuotation)
   ├── استيراد من Excel (importFromData)
   └── إدخال يدوي (create)
5. تعيين بنود BOQ لمراحل التنفيذ (assignPhase)
6. تسعير البنود (unitPrice → totalPrice)
7. مراجعة حسب المرحلة (getByPhase) أو كقائمة مواد (getMaterialsList)
```

---

## 3. العلاقات المشتركة والربط بينهما

### 3.1 نقطة الربط المحورية: `ProjectMilestone`

**المرحلة (`ProjectMilestone`) هي العنصر المشترك الذي يربط بين التنفيذ والكميات.**

```
┌─────────────────────────────────────────────────────────┐
│                   ProjectMilestone                       │
│                   (المرحلة/المعلم)                        │
│                                                         │
│  يربط بين:                                               │
│                                                         │
│  ← التنفيذ: ProjectActivity.milestoneId                  │
│  ← الكميات: ProjectBOQItem.projectPhaseId               │
│  ← إنشائي: StructuralItem.projectPhaseId                │
│  ← تشطيبات: FinishingItem.projectPhaseId                │
│  ← MEP: MEPItem.projectPhaseId                          │
│  ← عمالة: LaborItem.projectPhaseId                      │
└─────────────────────────────────────────────────────────┘
```

### 3.2 كيف يعمل الربط؟

#### من جهة التنفيذ:
- كل **نشاط** (`ProjectActivity`) يُنشأ تحت **مرحلة** محددة عبر `milestoneId`
- العلاقة **إلزامية** (كل نشاط يجب أن ينتمي لمرحلة)

#### من جهة الكميات:
- كل **بند كميات** (`ProjectBOQItem`) يمكن تعيينه لمرحلة عبر `projectPhaseId`
- العلاقة **اختيارية** (يمكن أن يكون البند غير مُعيّن لأي مرحلة)
- نفس الأمر ينطبق على بنود دراسة التكاليف (Structural, Finishing, MEP, Labor)

### 3.3 آليات التعيين

#### تعيين بند BOQ لمرحلة:

```typescript
// تعيين فردي
POST /projects/{projectId}/boq/assign-phase
Body: {
  itemIds: ["boq-item-id-1", "boq-item-id-2"],
  phaseId: "milestone-id" | null  // null لإلغاء التعيين
}

// تعيين بند كمية من دراسة التكاليف
POST /projects/{projectId}/quantities/assign-phase
Body: {
  itemId: "item-id",
  itemType: "structural" | "finishing" | "mep" | "labor",
  phaseId: "milestone-id" | null
}

// تعيين جماعي
POST /projects/{projectId}/quantities/bulk-assign-phase
```

#### عرض البنود حسب المرحلة:

```typescript
// بنود BOQ حسب المرحلة
GET /projects/{projectId}/boq/get-by-phase
→ Returns: { [phaseId]: ProjectBOQItem[] }

// تفصيل الكميات حسب المرحلة
GET /projects/{projectId}/quantities/phase-breakdown
→ Returns: Items grouped by milestone with cost totals
```

### 3.4 العلاقة البيانية

```
المشروع (Project)
│
├── التنفيذ (Execution)
│   ├── المرحلة 1 (Milestone)
│   │   ├── نشاط 1.1 (Activity) ──→ تبعية ──→ نشاط 1.2
│   │   ├── نشاط 1.2 (Activity)
│   │   └── نشاط 1.3 (Activity) ──→ قائمة تحقق
│   │
│   ├── المرحلة 2 (Milestone)
│   │   ├── نشاط 2.1
│   │   └── نشاط 2.2
│   │
│   ├── خط أساس (Baseline)
│   └── تقويم (Calendar)
│
├── الكميات (Quantities)
│   ├── دراسة تكاليف (Cost Study)
│   │   ├── بنود إنشائية ──→ projectPhaseId → المرحلة 1
│   │   ├── بنود تشطيبات ──→ projectPhaseId → المرحلة 2
│   │   ├── بنود MEP ──→ projectPhaseId → المرحلة 1
│   │   └── بنود عمالة ──→ projectPhaseId → المرحلة 2
│   │
│   └── جدول كميات (BOQ)
│       ├── بند BOQ 1 ──→ projectPhaseId → المرحلة 1
│       ├── بند BOQ 2 ──→ projectPhaseId → المرحلة 1
│       ├── بند BOQ 3 ──→ projectPhaseId → المرحلة 2
│       └── بند BOQ 4 ──→ (غير معيّن)
│
└── الرابط المشترك: ProjectMilestone.id = projectPhaseId
```

---

## 4. نظام المراحل (Phases)

### 4.1 المرحلة كوحدة تنظيمية

المرحلة (`ProjectMilestone`) تعمل كـ **وحدة تنظيمية مزدوجة**:

| الجانب | الدور |
|--------|-------|
| **في التنفيذ** | حاوية للأنشطة والمهام مع جدول زمني وتتبع تقدم |
| **في الكميات** | مرجع لتوزيع التكاليف والمواد حسب مراحل العمل |

### 4.2 فوائد الربط

1. **توزيع التكاليف حسب المرحلة**: معرفة تكلفة كل مرحلة من مراحل التنفيذ
2. **تتبع المواد حسب المرحلة**: معرفة المواد المطلوبة لكل مرحلة
3. **المقارنة**: ربط التقدم الفعلي (من التنفيذ) بالتكاليف المصروفة (من الكميات)
4. **التخطيط**: تخطيط المشتريات بناءً على الجدول الزمني للمراحل
5. **التقارير**: تقارير شاملة تجمع بين الأداء الزمني والمالي

### 4.3 حقول المرحلة المؤثرة

| الحقل | التأثير على التنفيذ | التأثير على الكميات |
|-------|---------------------|---------------------|
| `plannedStart/End` | جدولة الأنشطة | تخطيط المشتريات |
| `actualStart/End` | تتبع التنفيذ الفعلي | مقارنة مع الصرف الفعلي |
| `status` | حالة التقدم | تحديد البنود النشطة |
| `progress` | نسبة إنجاز الأعمال | نسبة استهلاك الكميات |
| `weight` | حساب التقدم المرجح | توزيع التكاليف المرجح |

---

## 5. الرسم البياني للعلاقات

```
╔══════════════════════════════════════════════════════════════════╗
║                        المشروع (Project)                        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌──────────────────────┐         ┌──────────────────────────┐  ║
║  │   قسم التنفيذ        │         │   قسم الكميات            │  ║
║  │   (Execution)        │         │   (Quantities & BOQ)     │  ║
║  │                      │         │                          │  ║
║  │  ┌────────────────┐  │         │  ┌────────────────────┐  │  ║
║  │  │ ProjectCalendar│  │         │  │ CostStudy          │  │  ║
║  │  └───────┬────────┘  │         │  │ ├─ StructuralItem  │  │  ║
║  │          │            │         │  │ ├─ FinishingItem   │  │  ║
║  │  ┌───────▼────────┐  │         │  │ ├─ MEPItem         │  │  ║
║  │  │ProjectMilestone│◄─┼────┬────┼──│ └─ LaborItem       │  │  ║
║  │  │ (المراحل)      │  │    │    │  └────────┬───────────┘  │  ║
║  │  └───────┬────────┘  │    │    │           │              │  ║
║  │          │            │    │    │  ┌────────▼───────────┐  │  ║
║  │  ┌───────▼────────┐  │    │    │  │ ProjectBOQItem     │  │  ║
║  │  │ProjectActivity │  │    │    │  │ (جدول الكميات)      │  │  ║
║  │  │ (الأنشطة)      │  │    │    │  └────────────────────┘  │  ║
║  │  └───┬───┬────────┘  │    │    │                          │  ║
║  │      │   │            │    │    │  ┌────────────────────┐  │  ║
║  │  ┌───▼┐ ┌▼─────────┐ │    │    │  │ Quote              │  │  ║
║  │  │Dep.│ │Checklist  │ │    │    │  │ (عروض الأسعار)     │  │  ║
║  │  └────┘ └───────────┘ │    │    │  └────────────────────┘  │  ║
║  │                      │    │    │                          │  ║
║  │  ┌────────────────┐  │    │    │                          │  ║
║  │  │ProjectBaseline │  │    │    │                          │  ║
║  │  │ (خطوط الأساس)  │  │    │    │                          │  ║
║  │  └────────────────┘  │    │    │                          │  ║
║  └──────────────────────┘    │    └──────────────────────────┘  ║
║                              │                                   ║
║              projectPhaseId ─┘                                   ║
║              (العلاقة المشتركة)                                   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 6. مسارات الملفات

### 6.1 قسم التنفيذ

```
الصفحة الرئيسية:
  apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/execution/page.tsx

المكونات:
  apps/web/modules/saas/projects-execution/components/
  ├── ExecutionDashboard.tsx
  ├── AdvancedGanttView.tsx
  ├── GanttActivityBar.tsx
  ├── GanttMilestoneGroupBar.tsx
  ├── GanttTimeHeader.tsx
  ├── GanttChartArea.tsx
  ├── GanttSvgCanvas.tsx
  ├── GanttBaselineOverlay.tsx
  ├── GanttTodayMarker.tsx
  ├── GanttToolbar.tsx
  ├── DependencyLayer.tsx
  ├── DependencyEditDialog.tsx
  ├── DependencyArrow.tsx
  ├── ActivityDetailSheet.tsx
  ├── BaselineManagementDialog.tsx
  ├── CalendarSettingsDialog.tsx
  ├── AnalysisPage.tsx
  ├── DelayAnalysisView.tsx
  ├── PlannedVsActualTable.tsx
  ├── SCurveChart.tsx
  ├── EnhancedMilestoneCard.tsx
  ├── HealthStatStrip.tsx
  ├── MilestoneTableView.tsx
  ├── MilestoneTemplateDialog.tsx
  ├── ConfirmDeleteDialog.tsx
  ├── ExecutionViewToggle.tsx
  └── MilestoneForm.tsx

الهوكس:
  apps/web/modules/saas/projects-execution/hooks/
  ├── use-execution-data.ts
  ├── use-milestone-actions.ts
  ├── use-gantt-context.ts
  ├── use-gantt-drag.ts
  ├── use-gantt-dependency-drag.ts
  ├── use-gantt-keyboard.ts
  ├── use-gantt-scroll-sync.ts
  └── use-gantt-virtualization.ts

الأنواع:
  apps/web/modules/saas/projects-execution/lib/
  ├── execution-types.ts
  └── gantt-types.ts

API:
  packages/api/modules/project-execution/router.ts
  packages/api/modules/project-execution/procedures/

قاعدة البيانات:
  packages/database/prisma/queries/project-execution.ts
  packages/database/prisma/schema.prisma (سطور 2544-2699)
```

### 6.2 قسم الكميات

```
الصفحات:
  apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/quantities/
  ├── page.tsx (الملخص)
  ├── structural/page.tsx
  ├── finishing/page.tsx
  ├── mep/page.tsx
  ├── labor/page.tsx
  ├── materials/page.tsx
  └── studies/page.tsx

مكونات الكميات:
  apps/web/modules/saas/projects/components/quantities/
  ├── QuantitiesOverview.tsx
  ├── StructuralItemsView.tsx
  ├── FinishingItemsView.tsx
  ├── MEPItemsView.tsx
  ├── LaborItemsView.tsx
  ├── MaterialsListView.tsx
  ├── CreateStudyDialog.tsx
  └── LinkStudyDialog.tsx

مكونات BOQ:
  apps/web/modules/saas/projects/components/boq/
  ├── BOQOverview.tsx
  ├── boq-items-table.tsx
  ├── boq-filters.tsx
  ├── boq-summary-cards.tsx
  ├── boq-bulk-actions.tsx
  ├── boq-dashboard-card.tsx
  ├── create-item-dialog.tsx
  ├── bulk-entry-dialog.tsx
  ├── pricing-mode-dialog.tsx
  ├── copy-from-study-dialog.tsx
  ├── copy-from-quotation-dialog.tsx
  └── import-excel-dialog.tsx

الهوكس:
  apps/web/modules/saas/projects/hooks/use-project-boq.ts

API:
  packages/api/modules/quantities/          (دراسات التكاليف)
  packages/api/modules/project-quantities/  (ربط الكميات بالمشروع)
  packages/api/modules/project-boq/         (جدول الكميات)

قاعدة البيانات:
  packages/database/prisma/schema.prisma (سطور 1197-1510, 3102+)
```

### 6.3 الملفات المشتركة

```
التنقل:
  apps/web/modules/saas/projects/components/shell/constants.ts

الراوتر الرئيسي:
  packages/api/orpc/router.ts

تعريفات AI:
  packages/ai/modules/definitions/execution.ts
  packages/ai/modules/definitions/quantities.ts

قاعدة البيانات المشتركة:
  packages/database/prisma/schema.prisma
  packages/database/prisma/generated/enums.ts
```

---

## ملخص تنفيذي

| العنصر | التنفيذ | الكميات |
|--------|---------|---------|
| **الهدف** | إدارة الجدول الزمني والتقدم | إدارة التكاليف والمواد |
| **الوحدة الأساسية** | النشاط (Activity) | بند الكمية (BOQ Item) |
| **التنظيم** | مراحل → أنشطة → قوائم تحقق | دراسات → بنود → BOQ |
| **الحالات** | 6 حالات للنشاط | 5 مصادر للبنود |
| **التتبع** | نسبة إنجاز + مسار حرج | تسعير + توزيع تكاليف |
| **الربط** | milestoneId (إلزامي) | projectPhaseId (اختياري) |
| **نقطة الالتقاء** | ProjectMilestone | ProjectMilestone |

> **العلاقة الجوهرية**: `ProjectMilestone` هو الجسر بين القسمين. يمكن ربط بنود الكميات بمراحل التنفيذ عبر حقل `projectPhaseId`، مما يتيح تحليل التكاليف حسب المرحلة، وتتبع المواد المطلوبة لكل مرحلة، والتخطيط المالي المتكامل مع الجدول الزمني.
