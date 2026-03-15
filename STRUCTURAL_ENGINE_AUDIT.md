# تقرير تدقيق محرك الكميات الإنشائية — منصة مسار

> **تاريخ التقرير:** 2026-03-15
> **الإصدار:** 1.0
> **المراجع:** Claude Code Audit Engine
> **النطاق:** `apps/web/modules/saas/pricing/` + `packages/api/modules/quantities/`

---

## جدول المحتويات

1. [الخريطة الكاملة للملفات](#1-الخريطة-الكاملة-للملفات)
2. [محرك الحسابات الإنشائية](#2-محرك-الحسابات-الإنشائية)
3. [تهيئة المبنى](#3-تهيئة-المبنى)
4. [الأقسام الإنشائية](#4-الأقسام-الإنشائية)
5. [واجهة المستخدم والتجربة](#5-واجهة-المستخدم-والتجربة)
6. [APIs والطبقة الخلفية](#6-apis-والطبقة-الخلفية)
7. [نماذج قاعدة البيانات](#7-نماذج-قاعدة-البيانات)
8. [تدفق البيانات الكامل](#8-تدفق-البيانات-الكامل)
9. [الارتباطات مع باقي المراحل](#9-الارتباطات-مع-باقي-المراحل)
10. [الأداء وتحسين التحميل](#10-الأداء-وتحسين-التحميل)
11. [المشاكل والنواقص والأخطاء](#11-المشاكل-والنواقص-والأخطاء)
12. [جدول ملخص BOQ الإنشائي](#12-جدول-ملخص-boq-الإنشائي)
13. [التوصيات والتحسينات](#13-التوصيات-والتحسينات)
14. [مخططات بصرية](#14-مخططات-بصرية)

---

## 1. الخريطة الكاملة للملفات

### 1.1 إحصائيات عامة

| البُعد | القيمة |
|--------|--------|
| إجمالي الملفات | **257 ملف** |
| إجمالي أسطر الكود | **~82,620 سطر** |
| مكونات UI (TSX) | 148 ملف — 62,145 سطر |
| مكتبات/محركات (TS) | 47 ملف — 10,819 سطر |
| أنواع وواجهات | 9 ملفات — 1,273 سطر |
| ثوابت | 4 ملفات — 441 سطر |
| Hooks | 3 ملفات — 281 سطر |
| إجراءات API | 44 ملف — 5,637 سطر |

### 1.2 شجرة الملفات — الأقسام الإنشائية (الأهم)

```
apps/web/modules/saas/pricing/
├── components/studies/
│   ├── BOQSummaryTable.tsx              (1,200 سطر) — جدول ملخص BOQ
│   ├── StructuralAccordion.tsx          (279 سطر)   — أكورديون 7 أقسام
│   ├── StructuralBuildingConfigBar.tsx   (76 سطر)    — شريط تهيئة المبنى
│   ├── StructuralBuildingWizard.tsx      (794 سطر)   — معالج تهيئة المبنى
│   ├── StructuralItemsEditor.tsx         (175 سطر)   — المحرر الرئيسي
│   ├── SummaryStatsCards.tsx             (91 سطر)    — بطاقات الإحصائيات
│   ├── sections/
│   │   ├── SlabsSection.tsx             (3,438 سطر) ⚠️ أكبر ملف
│   │   ├── FoundationsSection.tsx       (2,383 سطر) ⚠️
│   │   ├── ColumnsSection.tsx           (1,643 سطر)
│   │   ├── BlocksSection.tsx            (1,287 سطر)
│   │   ├── StairsSection.tsx            (1,095 سطر)
│   │   ├── BeamsSection.tsx             (549 سطر)
│   │   ├── PlainConcreteSection.tsx      (511 سطر)
│   │   └── StructuralSpecsSection.tsx    (163 سطر)
│   └── shared/
│       ├── CalculationResultsPanel.tsx   (403 سطر)
│       ├── DimensionsCard.tsx            (94 سطر)
│       ├── RebarBarsInput.tsx            (114 سطر)
│       ├── RebarMeshInput.tsx            (126 سطر)
│       ├── StirrupsInput.tsx             (89 سطر)
│       ├── RebarWeightBadge.tsx          (41 سطر)
│       ├── ConcreteTypeSelect.tsx        (57 سطر)
│       └── ElementHeaderRow.tsx          (138 سطر)
├── lib/
│   ├── structural-calculations.ts       (2,357 سطر) ⭐ قلب المحرك
│   ├── calculations.ts                  (718 سطر)   — دوال حساب مساعدة
│   ├── boq-aggregator.ts                (498 سطر)   — محرك تجميع BOQ
│   ├── boq-recalculator.ts              (393 سطر)   — محرك إعادة الحساب
│   ├── boq-export.ts                    (265 سطر)   — تصدير Excel/PDF
│   ├── height-derivation-engine.ts      (177 سطر)   — محرك اشتقاق الارتفاعات
│   └── cutting/
│       ├── cutting-optimizer.ts         (231 سطر)   — خوارزمية 1D Cutting Stock
│       ├── waste-analyzer.ts            (210 سطر)   — تحليل الهدر
│       ├── remnant-manager.ts           (191 سطر)   — إدارة البواقي
│       ├── saudi-rebar-specs.ts         (107 سطر)   — مواصفات الحديد السعودي
│       └── types.ts                     (156 سطر)   — أنواع التقطيع
├── constants/
│   ├── prices.ts                        (275 سطر)   — الأسعار والأوزان
│   ├── blocks.ts                        (258 سطر)   — ثوابت البلوك
│   └── slabs.ts                         (158 سطر)   — ثوابت البلاطات
├── types/
│   ├── structural-building-config.ts    (148 سطر)
│   ├── slabs.ts                         (504 سطر)
│   ├── foundations.ts                   (315 سطر)
│   ├── beams.ts                         (219 سطر)
│   ├── blocks.ts                        (201 سطر)
│   └── columns.ts                       (106 سطر)
└── hooks/
    ├── useHeightDerivation.ts           (46 سطر)
    └── useStructuralBuildingConfig.ts   (98 سطر)

packages/api/modules/quantities/
├── router.ts                            (148 سطر)   — الموجه الرئيسي
└── procedures/
    ├── structural-item-create.ts        (72 سطر)
    ├── structural-item-update.ts        (59 سطر)
    ├── structural-item-delete.ts        (40 سطر)
    ├── get-structural-items.ts          (29 سطر)
    ├── structural-specs.ts              (179 سطر)
    ├── building-config-update.ts        (250 سطر)   — منطق التتالي
    └── ... (38 إجراء آخر)
```

### 1.3 أكبر 10 ملفات في المشروع

| # | الملف | الأسطر | الملاحظة |
|---|-------|--------|----------|
| 1 | `sections/SlabsSection.tsx` | 3,438 | ⚠️ يحتاج تقسيم عاجل |
| 2 | `sections/FoundationsSection.tsx` | 2,383 | ⚠️ يحتاج تقسيم |
| 3 | `lib/structural-calculations.ts` | 2,357 | ⭐ قلب المحرك المركزي |
| 4 | `sections/ColumnsSection.tsx` | 1,643 | حسابات inline |
| 5 | `sections/BlocksSection.tsx` | 1,287 | مقبول مع تعقيد عالي |
| 6 | `studies/BOQSummaryTable.tsx` | 1,200 | جدول BOQ الشامل |
| 7 | `sections/StairsSection.tsx` | 1,095 | حسابات inline |
| 8 | `studies/StructuralBuildingWizard.tsx` | 794 | معالج تهيئة المبنى |
| 9 | `lib/calculations.ts` | 718 | دوال حساب مساعدة |
| 10 | `sections/BeamsSection.tsx` | 549 | حسابات inline |

---

## 2. محرك الحسابات الإنشائية

### 2.1 الملف الرئيسي: `structural-calculations.ts` (2,357 سطر)

هذا هو **قلب المحرك** — يحتوي على جميع الحسابات الإنشائية للقواعد (4 أنواع) والبلاطات (5 أنواع) والبلوك والجدران.

#### 2.1.1 الدوال المساعدة (Helper Functions)

| الدالة | السطر | التوقيع | الوصف |
|--------|-------|---------|-------|
| `getRebarWeightPerMeter` | 61 | `(diameter: number): number` | `REBAR_WEIGHTS[d] \|\| d² × 0.00617` |
| `calculateBarCount` | 68 | `(length, spacing): number` | `Math.ceil(length / spacing) + 1` |
| `calculateBarLength` | 76 | `(dimension, anchorage?, lap?, hooks?): number` | طول القضيب مع الإضافات |
| `calculateNetArea` | 88 | `(grossArea, openings?[]): number` | المساحة الصافية بعد خصم الفتحات |

#### 2.1.2 دوال داخلية (غير مُصدّرة)

| الدالة | السطر | الوصف |
|--------|-------|-------|
| `calcFoundationBarLength` | 140 | `dimension - 2×cover + 2×hookLength` |
| `calcFoundationBarCount` | 151 | `Math.ceil((dimension - 2×cover) × barsPerMeter) + 1` |
| `calcFoundationRebar` | 163 | حساب تسليح القاعدة مع تحسين المخزون |
| `suggestWasteUse` | 208 | اقتراح استخدامات لبواقي الحديد |
| `calcLapLength` | 219 | حساب طول وصلة التراكب (40d, 50d, 60d) |
| `calcRaftRebar` | 239 | حساب تسليح اللبشة مع وصلات التراكب |

#### 2.1.3 محركات القواعد (4 أنواع)

**1. القاعدة المنفصلة — `calculateIsolatedFoundation`** (سطر 311)
```
المدخلات: IsolatedFoundationInput
المخرجات: IsolatedFoundationResult

الخرسانة:  length × width × height × quantity
النظافة:   (length+0.2) × (width+0.2) × thickness × quantity
الشدات:    2×(length+width) × height + length×width
الحديد:    شبكة سفلية (اتجاهين) + أشاير أعمدة
```

**2. القاعدة المشتركة — `calculateCombinedFoundation`** (سطر 480)
```
تمتد من IsolatedFoundation مع:
- عدد الأعمدة (columnsCount)
- المسافة بين الأعمدة (columnsSpacing)
- نفس حسابات الخرسانة والحديد
```

**3. القاعدة الشريطية — `calculateStripFoundation`** (سطر 603)
```
وضعان للتسليح:
  ├── إذا width ≤ 0.8m → كانات (stirrups mode)
  └── إذا width > 0.8m  → شبكة (mesh mode)

الثابت: STRIP_MESH_THRESHOLD = 0.8  (سطر 52)

الخرسانة الصافية:  totalLength × width × height × quantity
خصم التقاطعات:     intersectionCount × stripWidth × width × height × quantity
الشدات (جوانب):    2 × totalLength × height × quantity
وصلات التراكب:     lapLength = multiplier × (diameter/1000)
                    usablePerStock = stockLength - lapLength
                    piecesPerBar = Math.ceil(barLength / usablePerStock)
```

**4. اللبشة — `calculateRaftFoundation`** (سطر 914)
```
المساحة:      length × width
الخرسانة:     area × thickness
النظافة:      area × leanConcreteThickness
كمرات الحواف: perimeter × edgeBeamWidth × edgeBeamDepth
وصلات التراكب: تتبع مفصل (piecesPerBar, splicesPerBar, lapLength, totalSplices)
كراسي الحديد: شبكة بتباعد محسوب
```

#### 2.1.4 محركات البلاطات (5 أنواع)

**1. البلاطة المصمتة — `calculateSolidSlab`** (سطر 1524)
```
الكشف التلقائي:
  aspectRatio = max(length,width) / min(length,width)
  إذا aspectRatio ≥ 2 → اتجاه واحد (ONE_WAY)
  إذا aspectRatio < 2 → اتجاهين (TWO_WAY)

4 طبقات تسليح:
  1. شبكة سفلية — اتجاه X
  2. شبكة سفلية — اتجاه Y
  3. شبكة علوية — اتجاه X
  4. شبكة علوية — اتجاه Y

وصلات التراكب: diameter × SLAB_DEFAULTS.lapLengthFactor / 1000
```

**2. البلاطة الهوردي — `calculateRibbedSlab`** (سطر 1682)
```
عدد الأعصاب:    Math.floor(width / ribSpacingM + 1e-9) + 1
حجم العصب:      ribsCount × length × ribWidthM × blockHeightM
طبقة علوية:     netArea × toppingThickness
بلوك هوردي:     blockGaps × blocksPerGap × (1 + waste%)
كانات الأعصاب:  stirrupPerimeter = 2×(ribWidth + blockHeight - 0.08) + hookAllowance
```

**3. البلاطة المسطحة — `calculateFlatSlab`** (سطر 1848)
```
ألواح الإسقاط:  dpLength × dpWidth × extraThickness × count
الخرسانة:       netArea × thickness + dropPanelVolume
4 طبقات تسليح مثل البلاطة المصمتة
```

**4. الهولوكور — `calculateHollowCoreSlab`** (سطر 2011)
```
⚠️ تقديرية فقط — لا حسابات تسليح مفصلة
عدد الألواح:  Math.ceil(width / panelWidthM)
الخرسانة:     netArea × toppingThickness (طبقة علوية فقط)
التكلفة:      350 SAR/m² (hardcoded)
```

**5. بلاطة الكمرات العريضة — `calculateBandedBeamSlab`** (سطر 2094)
```
حجم البلاطة:             netArea × thickness
حجم الكمرة الإضافي:     additionalDepth × width × length (فقط العمق فوق البلاطة)
شدات الكمرة:             2 × additionalDepth × length (الجوانب فقط)
```

#### 2.1.5 محرك البلوك والجدران

| الدالة | السطر | الصيغة الرئيسية |
|--------|-------|-----------------|
| `calculateOpeningArea` | 1139 | `width × height` |
| `getBlocksPerSqm` | 1153 | `1 / (blockLength/100 × blockHeight/100)` — الافتراضي: 12.5 بلوكة/م² |
| `calculateBlockCount` | 1164 | `netCount + Math.ceil(netCount × wastePercentage/100)` |
| `calculateMortar` | 1189 | `netArea × 0.02 m³/m²` — أسمنت: `Math.ceil((vol × cement/parts) × 1440 / 50)` |
| `calculateLintels` | 1218 | طول الأعتاب: `opening.width + 0.30` — الحديد: `concreteVolume × 100` |
| `calculateWall` | 1255 | يجمع كل الحسابات لجدار واحد |
| `calculateBlocksSummary` | 1306 | تجميع حسب: السماكة، التصنيف، الدور |

#### 2.1.6 دالة حساب طبقة التسليح

```typescript
// سطر 1451
calculateRebarLayer(diameter, barLength, barCount, description, location): RebarDetail
// تحسب: totalLength, weight, stocksNeeded, wastePercentage, grossWeight
// تدعم: وصلات التراكب، أطوال المخزون، تحليل الهدر
```

### 2.2 الملف المساعد: `calculations.ts` (718 سطر)

دوال حساب مبسطة تُستخدم كـ fallback:

| الدالة | المدخلات الرئيسية | الملاحظة |
|--------|-------------------|----------|
| `calculateFoundation` | quantity, length, width, depth, rebar specs | إضافة: 0.3m للقضيب |
| `calculateColumn` | width(cm), depth(cm), height(m), bars | مضاعف شدات: 1.5x — إضافة: 0.8m |
| `calculateBeam` | width(cm), height(cm), length(m) | مضاعف شدات: 1.2x — إضافة: 0.6m |
| `calculateSlab` | length, width, thickness, slabType | إضافة: 0.4m |
| `calculateBlocks` | length(m), height(m), thickness | 12.5 بلوكة/م² — هدر: 5% |
| `calculateStairs` | width, flightLength, landing | مضاعف شدات: 1.5x |
| `calculateGroundBeam` | مثل Beam | عمالة: 180 SAR/م³ |
| `calculateNeckColumn` | مثل Column | عمالة: 200 SAR/م³ |
| `calculatePlainConcrete` | length, width, thickness | C20 افتراضي |

### 2.3 محرك التقطيع (`lib/cutting/`)

#### 2.3.1 خوارزمية التقطيع — `cutting-optimizer.ts` (231 سطر)

```
الخوارزمية: Simple-FFD-v5 مع وصلات تراكب
├── الخطوة 1: تجميع القطع حسب الطول (تقريب لأقرب ملم)
├── الخطوة 2: ترتيب تنازلي حسب الطول
├── الخطوة 3: لكل مجموعة:
│   ├── إذا الطول > stockLength → حساب القضبان مع lap splices
│   │   └── bars = Math.ceil((length - lapLength) / (stockLength - lapLength))
│   └── إذا الطول ≤ stockLength → تعبئة متعددة لكل قضيب
│       └── cutsPerStock = Math.floor(stockLength / effectiveLength)
└── الخطوة 4: حساب المقاييس النهائية

lapLength = (diameter × 40) / 1000  (الكود السعودي: 40d)
bladeWidth = 5mm
```

#### 2.3.2 مواصفات الحديد السعودي — `saudi-rebar-specs.ts` (107 سطر)

| الثابت | القيمة |
|--------|--------|
| أطوال المخزون | Φ8=6m، البقية=12m |
| الحد الأدنى للاستخدام | 0.3m (30cm) |
| طول وصلة التراكب | 40 × القطر |
| عرض شفرة القص | 5mm |
| معيار الهدر الممتاز | < 3% |
| معيار الهدر الجيد | 3-5% |
| معيار الهدر المتوسط | 5-8% |
| معيار الهدر الضعيف | > 8% |
| متوسط الصناعة | 8% |

**أوزان الحديد (kg/m):**

| القطر | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 25 | 28 | 32 |
|-------|---|---|----|----|----|----|----|----|----|----|----|----|
| الوزن | 0.222 | 0.395 | 0.617 | 0.888 | 1.208 | 1.578 | 1.998 | 2.466 | 2.984 | 3.853 | 4.834 | 6.313 |

#### 2.3.3 تحليل الهدر — `waste-analyzer.ts` (210 سطر)

- `generateWasteReport(results, projectId)` — تقرير شامل بالقطر
- `analyzePatternEfficiency(patterns)` — أفضل وأسوأ نمط قص
- التوفير المحتمل: إذا الهدر > 10% → 30% من الهدر قابل للتقليل
- 3 أنواع توصيات: تصميمية، تنفيذية، مشتريات

#### 2.3.4 إدارة البواقي — `remnant-manager.ts` (191 سطر)

- `findMatchingRemnants` — بحث بالقطر والطول الأدنى
- `addRemnantsToInventory` — دمج مع المخزون (تسامح 0.01m)
- `reserveRemnant` / `releaseRemnant` / `useRemnant` — دورة حياة كاملة
- `cleanOldRemnants(maxAgeDays=90)` — تنظيف تلقائي

### 2.4 الثوابت الرئيسية

| الثابت | القيمة | المصدر |
|--------|--------|--------|
| `STRIP_MESH_THRESHOLD` | 0.8m | `structural-calculations.ts:52` |
| `SLAB_DEFAULTS.cover` | 0.025m (2.5cm) | `constants/slabs.ts` |
| `SLAB_DEFAULTS.lapLengthFactor` | 40d | `constants/slabs.ts` |
| `SLAB_DEFAULTS.hookLength` | 0.10m | `constants/slabs.ts` |
| `SLAB_DEFAULTS.formworkWaste` | 5% | `constants/slabs.ts` |
| `SLAB_DEFAULTS.concreteWaste` | 2.5% | `constants/slabs.ts` |
| `SLAB_DEFAULTS.blockWaste` | 3% | `constants/slabs.ts` |
| خرسانة C20 | 250 SAR/m³ | `constants/prices.ts` |
| خرسانة C25 | 280 SAR/m³ | `constants/prices.ts` |
| خرسانة C30 | 310 SAR/m³ | `constants/prices.ts` |
| خرسانة C35 | 350 SAR/m³ | `constants/prices.ts` |
| خرسانة C40 | 400 SAR/m³ | `constants/prices.ts` |
| حديد تسليح | 3.2 SAR/kg (3,200/طن) | `constants/prices.ts` |
| شدات | 45 SAR/m² | `constants/prices.ts` |
| بلوك 10cm | 2.5 SAR | `constants/prices.ts` |
| بلوك 15cm | 3.5 SAR | `constants/prices.ts` |
| بلوك 20cm | 4.5 SAR | `constants/prices.ts` |
| مونة لكل م² | 0.02 m³ | `constants/blocks.ts` |
| هدر بلوك | 5% قياسي | `constants/blocks.ts` |

**أسعار العمالة الإنشائية (SAR):**

| البند | السعر | الوحدة |
|-------|-------|--------|
| قواعد | 180 | م³ |
| أعمدة | 220 | م³ |
| كمرات | 200 | م³ |
| بلاطات | 150 | م² |
| بلوك | 35 | م² |
| سلالم | 250 | م³ |
| رقاب أعمدة | 200 | م³ |
| كمرات أرضية | 180 | م³ |
| خرسانة عادية | 100 | م³ |

---

## 3. تهيئة المبنى

### 3.1 هيكل البيانات

```typescript
// types/structural-building-config.ts

interface StructuralBuildingConfig {
  floors: StructuralFloorConfig[];
  isComplete: boolean;
  heightProperties?: BuildingHeightProperties;
  heightOverrides?: Record<string, DerivedFloorHeights>;
}

interface StructuralFloorConfig {
  id: string;
  type: StructuralFloorType;  // "basement"|"ground"|"mezzanine"|"upper"|"repeated"|"annex"
  label: string;
  icon: string;
  height: number;             // m
  slabArea: number;           // m²
  sortOrder: number;
  isRepeated: boolean;
  repeatCount: number;
  enabled: boolean;
  hasNeckColumns?: boolean;
  finishLevel?: number;       // m
  derived?: DerivedFloorHeights;
}

interface BuildingHeightProperties {
  heightInputMode: "manual" | "levels";
  includeFinishInLevels: boolean;
  finishThickness: number;        // cm
  streetLevel: number;            // m
  excavationDepth: number;        // m
  plainConcreteThickness: number; // cm
  foundationDepth: number;        // cm
  beamDepth: number;              // cm
  buildingElevationAboveStreet: number; // cm
  defaultSlabThickness: number;   // cm
  defaultBeamDepth: number;       // cm
  hasParapet: boolean;
  parapetHeight: number;          // cm
  invertedBeamDepth: number;      // cm
  roofWaterproofingThickness: number; // cm
}

interface DerivedFloorHeights {
  floorToFloorHeight?: number; // m
  columnHeight?: number;       // cm
  blockHeight?: number;        // cm
  neckHeight?: number;         // cm
  isAutoCalculated?: boolean;
}
```

### 3.2 أنواع الطوابق (6 أنواع)

| النوع | الارتفاع الافتراضي | ملاحظات |
|-------|---------------------|---------|
| `basement` (بدروم) | 3.0m | — |
| `ground` (أرضي) | 3.2m | دائماً مفعّل، له رقاب أعمدة |
| `mezzanine` (ميزانين) | 2.8m | — |
| `upper` (علوي) | 3.0m | حتى 10 طوابق |
| `repeated` (متكرر) | 3.0m | يُضرب في repeatCount |
| `annex` (ملحق) | 3.0m | — |

### 3.3 المعالج التفاعلي — `StructuralBuildingWizard.tsx` (794 سطر)

- واجهة تفاعلية لتهيئة المبنى
- اختيار الطوابق مع تبديل التفعيل
- وضعان للارتفاع: يدوي (manual) أو مناسيب (levels)
- جدول ديناميكي للطوابق مع ارتفاعات محسوبة
- لوحة خصائص متقدمة قابلة للطي (foundation zone, defaults, parapet)
- معاينة ملخص الاشتقاق (derivation preview)

### 3.4 التخزين

- التهيئة تُحفظ داخل حقل `structuralSpecs` (JSONB) في جدول `CostStudy`
- يُستخدم `buildingConfig` كمفتاح فرعي داخل `structuralSpecs`
- API: `structuralSpecs.set` / `structuralSpecs.get`

### 3.5 ⚠️ مشكلة: نموذجان مختلفان للمبنى

| | النموذج الإنشائي | نموذج التشطيب |
|--|------------------|---------------|
| المصدر | `StructuralBuildingConfig` | `buildingConfig` (JSON) |
| التخزين | `structuralSpecs.buildingConfig` | `CostStudy.buildingConfig` |
| البنية | floors مع height, slabArea | floors مع rooms, openings |
| الاستخدام | الأقسام الإنشائية | التشطيبات + MEP |

هذا يعني أن المستخدم قد يضبط طوابق في الإنشائي بشكل مختلف عن التشطيب.

---

## 4. الأقسام الإنشائية — تفصيل كل قسم

### 4.1 القواعد — `FoundationsSection.tsx` (2,383 سطر)

**4 أنواع مدعومة:**
- ✅ قاعدة منفصلة (Isolated) — مع حديد + أشاير + خرسانة نظافة
- ✅ قاعدة مشتركة (Combined) — لعدة أعمدة
- ✅ قاعدة شريطية (Strip) — مع وضعي كانات/شبكة
- ✅ لبشة (Raft) — مع وصلات تراكب وكمرات حواف

**الميزات:**
- واجهة مفصلة لكل نوع مع إعدادات متقدمة
- حسابات: خرسانة + حديد (متعدد الطبقات) + شدات + نظافة + أشاير
- نتائج مفصلة مع تحليل التقطيع لكل طبقة
- ✅ الحسابات في المحرك المركزي (`structural-calculations.ts`)

### 4.2 البلاطات — `SlabsSection.tsx` (3,438 سطر) ⚠️

**5 أنواع مدعومة:**
- ✅ مصمتة (Solid) — كشف اتجاه واحد/اتجاهين تلقائي
- ✅ هوردي (Ribbed) — أعصاب + بلوك حراري + طبقة علوية
- ✅ مسطحة (Flat) — مع ألواح إسقاط (Drop Panels)
- ⚠️ هولوكور (Hollow Core) — تقديرية فقط (350 SAR/m²)
- ✅ كمرات عريضة (Banded Beam)

**الميزات:**
- 4 طبقات تسليح (X سفلي، Y سفلي، X علوي، Y علوي)
- كشف اتجاه واحد/اتجاهين تلقائي (`aspectRatio ≥ 2`)
- كمرات ثانوية (Beam Definitions) للبلاطة المصمتة
- قوالب تسليح الكمرات (4 قوالب محددة مسبقاً)
- ✅ الحسابات في المحرك المركزي
- ⚠️ **أكبر مكون في المشروع (3,438 سطر) — يحتاج تقسيم عاجل حسب النوع**

### 4.3 الأعمدة — `ColumnsSection.tsx` (1,643 سطر)

**الميزات:**
- مستطيل ودائري (مع width/depth)
- نظام متعدد الطوابق (floor-based architecture)
- دعم الطوابق المتكررة (repeated floors × repeatCount)
- رقاب أعمدة (Neck Columns) — للأجزاء تحت الأرض
- نسخ بين الأدوار (CopyFromFloorButton)
- تكامل مع محرك اشتقاق الارتفاعات (`useHeightDerivation`)

**الحسابات (INLINE — ليست في المحرك المركزي) ❌:**
```typescript
// سطر 150: طول القضيب الرئيسي
mainBarLength = height + 0.8  // (m)

// سطر 153: محيط الكانة
stirrupPerimeter = 2 × (widthM + depthM - 0.08) + 0.3

// سطر 154-155: عدد الكانات
stirrupsCount = Math.ceil((height × 1000) / stirrupSpacing) + 1

// سطر 551-556: حجم الخرسانة
concreteVolume = (width/100) × (depth/100) × height × quantity
```

### 4.4 الكمرات — `BeamsSection.tsx` (549 سطر)

**4 أنواع:**
- كمرة ساقطة (beam)
- كمرة أرضية (groundBeam)
- ❌ كمرة مخفية ونهاية — غير مدعومة حالياً

**الحسابات (INLINE) ❌:**
```typescript
// سطر 146: طول القضيب
barLength = length + 0.6  // (m)

// سطر 149: محيط الكانة
stirrupPerimeter = 2 × (widthM + heightM - 0.08) + 0.3

// سطر 150: عدد الكانات
stirrupsCount = Math.ceil((length × 1000) / stirrupSpacing) + 1

// حساب الحجم (سطر 429):
volume = (width/100) × (height/100) × length × quantity
```

### 4.5 البلوك — `BlocksSection.tsx` (1,287 سطر)

**6 أنواع بلوك:**

| النوع | المضاعف | الوزن |
|-------|---------|-------|
| مجوف (Hollow) | 1.0x | 15 kg |
| مصمت (Solid) | 1.5x | 25 kg |
| معزول (Insulated) | 2.0x | 12 kg |
| مقاوم حريق (Fire-rated) | 1.8x | 18 kg |
| خفيف (Lightweight) | 1.3x | 8 kg |
| AAC (سيبوركس) | 2.5x | 6 kg |

**6 تصنيفات جدران:**

| التصنيف | السماكة | النوع الافتراضي |
|---------|---------|-----------------|
| خارجي (External) | 20cm | معزول |
| داخلي (Internal) | 15cm | مجوف |
| فاصل (Partition) | 10cm | مجوف |
| سور (Boundary) | 20cm | مجوف |
| استنادي (Retaining) | 25cm | مصمت |
| درابزين (Parapet) | 15cm | مجوف |

**الميزات:**
- فتحات (أبواب + شبابيك) مع أعتاب
- حسابات مونة: أسمنت + رمل
- تكامل مع محرك اشتقاق الارتفاعات
- نظام عام + لكل دور
- ✅ الحسابات في المحرك المركزي

### 4.6 السلالم — `StairsSection.tsx` (1,095 سطر)

**الحسابات (INLINE) ❌:**
```typescript
// الثوابت (سطر 109-115):
DEV_LENGTH_MULTIPLIER = 40    // 40d طول التماسك
HOOK_MULTIPLIER = 12          // 12d طول الخطاف
TOP_BAR_EXTENSION_RATIO = 0.25 // 25% من طول الدرج
CUT_LENGTH_ROUNDING = 0.05    // تقريب لـ 5cm

// 4 طبقات تسليح:
Layer 1: حديد رئيسي سفلي (طولي)
  barLength = totalLength + 2×devLength + 2×hookLength
  count = Math.ceil(width × mainBarsPerMeter) + 1

Layer 2: حديد ثانوي سفلي (عرضي)
  barLength = width + 2×devLength + 2×hookLength
  count = Math.ceil(totalLength × secondaryBarsPerMeter) + 1

Layer 3: حديد رئيسي علوي (عند المساند)
  pieceLength = topExtension + devLength + hookLength
  count = mainBarsCount × 2

Layer 4: حديد ثانوي علوي (توزيع)
  count = 2 × (Math.ceil((topExtension×1000) / spacing) + 1)
```

**الوضع التلقائي (Auto Mode):**
```
لكل اتصال بين طابقين:
  risersCount = Math.ceil((height × 100) / riserHeight)
  goingLength = risersCount × (treadDepth / 100)
  flightLength = Math.sqrt(goingLength² + height²)
```

### 4.7 خرسانة عادية — `PlainConcreteSection.tsx` (511 سطر)

- عناصر غير مسلحة (نظافة، تسوية، ردم)
- حساب حجم بسيط: `length × width × thickness × quantity`
- 3 أنواع فرعية مع سماكات افتراضية
- ✅ حسابات بسيطة ومباشرة

### 4.8 المواصفات — `StructuralSpecsSection.tsx` (163 سطر)

- جدول لاختيار نوع الخرسانة ورتبة الحديد لكل عنصر
- 7 عناصر: قواعد، أعمدة، كمرات، بلاطات، سلالم، كمرات أرضية، رقاب
- خرسانة: C15 → C40
- رتبة حديد: 40, 60, 80 (MPa)

---

## 5. واجهة المستخدم والتجربة (UI/UX)

### 5.1 التسلسل الهرمي للمكونات

```
QuantitiesSubTabs
  └── StructuralItemsEditor (175 سطر) — المنسّق الرئيسي
        ├── SummaryStatsCards (91 سطر) — بطاقات إحصائيات
        ├── StructuralBuildingConfigBar (76 سطر) — شريط تهيئة
        ├── StructuralAccordion (279 سطر) — أكورديون 7 أقسام
        │     ├── PlainConcreteSection   (511 سطر)
        │     ├── FoundationsSection     (2,383 سطر) ⚠️
        │     ├── ColumnsSection         (1,643 سطر)
        │     ├── BeamsSection           (549 سطر)
        │     ├── SlabsSection           (3,438 سطر) ⚠️
        │     ├── BlocksSection          (1,287 سطر)
        │     └── StairsSection          (1,095 سطر)
        └── BOQSummaryTable (1,200 سطر) — جدول BOQ
```

### 5.2 المكونات المشتركة (`studies/shared/`)

| المكوّن | الأسطر | الوظيفة |
|---------|--------|---------|
| `CalculationResultsPanel` | 403 | عرض نتائج الحسابات (حجم خرسانة، وزن حديد، نسب) |
| `ElementHeaderRow` | 138 | صف رأس العنصر مع أزرار التحكم |
| `RebarMeshInput` | 126 | إدخال بيانات شبك الحديد (mesh) |
| `RebarBarsInput` | 114 | إدخال بيانات أسياخ الحديد (bars) |
| `DimensionsCard` | 94 | بطاقة إدخال الأبعاد |
| `StirrupsInput` | 89 | إدخال بيانات الكانات (stirrups) |
| `ConcreteTypeSelect` | 57 | اختيار رتبة الخرسانة |
| `RebarWeightBadge` | 41 | شارة وزن الحديد |

### 5.3 التعريب والاتجاه

- **RTL**: الواجهة تدعم الاتجاه من اليمين لليسار بالكامل
- **الترجمة**: عبر `next-intl` باستخدام `useTranslations()` مع ملفات `ar.json` و `en.json`
- **التبديل**: عربي / إنجليزي ديناميكي دون إعادة تحميل

### 5.4 تقييم الأداء والمشكلات

| البند | الحالة | الملاحظة |
|-------|--------|----------|
| المكونات المشتركة | ✅ | 8 مكونات قابلة لإعادة الاستخدام |
| حجم `StructuralItemsEditor` | ✅ | 175 سطر — منسّق خفيف |
| حجم `StructuralAccordion` | ✅ | 279 سطر — مقبول |
| حجم `SlabsSection` | ❌ | **3,438 سطر في مكوّن واحد** — God Component |
| التحميل الكسول (Lazy Loading) | ❌ | **لا يوجد** — كل الأقسام تُحمّل دفعة واحدة |
| دعم RTL | ✅ | مدعوم بالكامل |
| الترجمة (i18n) | ✅ | عربي/إنجليزي عبر `next-intl` |

> **❌ خطورة عالية**: `SlabsSection` بحجم 3,438 سطر يمثل مكوّنًا عملاقًا يصعب صيانته واختباره. يجب تقسيمه إلى 5 مكونات فرعية حسب نوع البلاطة.

> **⚠️ خطورة متوسطة**: غياب التحميل الكسول يعني تحميل كل الأقسام السبعة دفعة واحدة حتى لو فتح المستخدم قسمًا واحدًا فقط.

---

## 6. APIs والطبقة الخلفية

### 6.1 هيكل التوجيه (Router)

```
packages/api/modules/quantities/router.ts (148 سطر)
└── quantitiesRouter
      ├── getStructuralItems .............. GET  (protectedProcedure)
      ├── structuralItem
      │     ├── .create ................... POST (subscriptionProcedure)
      │     ├── .update ................... PUT  (subscriptionProcedure)
      │     └── .delete ................... DELETE (subscriptionProcedure)
      ├── structuralSpecs
      │     ├── .get ...................... GET  (protectedProcedure)
      │     └── .set ...................... PUT  (subscriptionProcedure)
      ├── buildingConfig
      │     └── .update ................... PUT  (subscriptionProcedure)
      ├── finishingItem
      │     ├── .create / .createBatch .... POST
      │     ├── .update ................... PUT
      │     ├── .delete ................... DELETE
      │     ├── .reorder .................. PUT
      │     └── .batchSpecUpdate .......... PUT
      ├── mepItem
      │     ├── .create / .createBatch .... POST
      │     ├── .update ................... PUT
      │     ├── .delete ................... DELETE
      │     └── .toggleEnabled ............ PUT
      ├── costing (6 endpoints)
      ├── markup (4 endpoints)
      ├── specifications (6 endpoints)
      ├── stages / studyStages
      └── ... (إجمالي ~50 endpoint)
```

### 6.2 نقاط النهاية الإنشائية

| Endpoint | Method | Auth | Validation | ملاحظات |
|----------|--------|------|------------|---------|
| `getStructuralItems` | GET | `protected` | ✅ | جلب العناصر |
| `structuralItem.create` | POST | `subscription` | ❌ `z.any()` للأبعاد | **لا تحقق من هيكل dimensions** |
| `structuralItem.update` | PUT | `subscription` | ❌ `z.any()` للأبعاد | **لا تحقق من هيكل dimensions** |
| `structuralItem.delete` | DELETE | `subscription` | ✅ | — |
| `structuralSpecs.get` | GET | `protected` | ✅ | — |
| `structuralSpecs.set` | PUT | `subscription` | ✅ Zod كامل | schemas مفصلة |
| `buildingConfig.update` | PUT | `subscription` | ✅ | 250 سطر + cascade |

### 6.3 التحقق من الصلاحيات

- **كل** endpoint يتحقق من `organizationId` عبر `verifyOrganizationAccess`
- مستويان: `protectedProcedure` (قراءة) و `subscriptionProcedure` (كتابة)

### 6.4 منطق التتابع في `buildingConfig.update` (250 سطر)

```
المستخدم يحدّث إعدادات المبنى
  │
  ├──➤ 1. حفظ الإعدادات في CostStudy.buildingConfig
  │
  ├──➤ 2. Cascade: إعادة حساب عناصر التشطيبات المرتبطة
  │     └── computeDerived(): floor_area, wall_area, external_wall_area,
  │                           roof_area, roof_perimeter, yard_area
  │     └── تحديث: area/quantity + materialCost + laborCost + totalCost
  │
  ├──➤ 3. Cascade: حذف جميع عناصر MEP التلقائية ❌ (مدمّر!)
  │
  └──➤ 4. recalculateCostStudyTotals()
```

### 6.5 المشكلات

| المشكلة | الخطورة | الملف | السطر |
|---------|---------|-------|-------|
| `z.any()` في dimensions | ❌ حرجة | `structural-item-create.ts` | 24 |
| `z.any()` في dimensions | ❌ حرجة | `structural-item-update.ts` | 25 |
| لا تحقق خادم من الحسابات | ❌ حرجة | — | — |
| حذف MEP مدمّر | ⚠️ مهمة | `building-config-update.ts` | 235 |

---

## 7. نماذج قاعدة البيانات

### 7.1 `CostStudy` — الدراسة التكلفية (النموذج الأب)

| الحقل | النوع | الملاحظة |
|-------|-------|----------|
| `id` | String (CUID) | PK |
| `organizationId` | String | FK → Organization (Cascade) |
| `createdById` | String | FK → User |
| `name` | String? | اسم الدراسة |
| `projectType` | String | نوع المشروع |
| `landArea` | Decimal(15,4) | مساحة الأرض |
| `buildingArea` | Decimal(15,4) | مساحة البناء |
| `numberOfFloors` | Int | عدد الأدوار |
| `structuralCost` | Decimal(15,2) | تكلفة الهيكل |
| `finishingCost` | Decimal(15,2) | تكلفة التشطيبات |
| `mepCost` | Decimal(15,2) | تكلفة الكهروميكانيك |
| `laborCost` | Decimal(15,2) | تكلفة العمالة |
| `totalCost` | Decimal(15,2) | الإجمالي |
| `buildingConfig` | **JSONB** | ⚠️ إعدادات المبنى — بلا schema مفروض |
| `structuralSpecs` | **JSONB** | ⚠️ المواصفات الإنشائية — بلا schema مفروض |
| `studyType` | Enum | FULL_PROJECT, CUSTOM_ITEMS, LUMP_SUM_ANALYSIS... |
| `entryPoint` | Enum | FROM_SCRATCH, HAS_QUANTITIES... |

**العلاقات:**
- `structuralItems` → StructuralItem[]
- `finishingItems` → FinishingItem[]
- `mepItems` → MEPItem[]
- `laborItems` → LaborItem[]
- `stages` → StudyStage[]
- `quotes` → Quote[]

### 7.2 `StructuralItem` — العنصر الإنشائي (20 حقل)

| الحقل | النوع | الملاحظة |
|-------|-------|----------|
| `id` | String (CUID) | PK |
| `costStudyId` | String | FK → CostStudy (Cascade) |
| `category` | String | التصنيف: foundations, columns, beams, slabs, blocks, stairs, plainConcrete |
| `subCategory` | String? | النوع الفرعي: isolated, combined, strip, raft, solid, ribbed... |
| `name` | String | اسم العنصر |
| `dimensions` | **Json?** | ❌ **بلا أي قيود** — يقبل أي JSON |
| `quantity` | Decimal(15,4) | الكمية |
| `unit` | String | الوحدة |
| `concreteVolume` | Decimal(15,4)? | حجم الخرسانة (م³) |
| `steelWeight` | Decimal(15,4)? | وزن الحديد (كجم) |
| `steelRatio` | Decimal(5,2)? | نسبة التسليح |
| `wastagePercent` | Decimal(5,2) | نسبة الهالك (افتراضي: 10%) |
| `materialCost` | Decimal(15,2) | تكلفة المواد |
| `laborCost` | Decimal(15,2) | تكلفة العمالة |
| `totalCost` | Decimal(15,2) | التكلفة الإجمالية |
| `sortOrder` | Int | ترتيب العرض |

### 7.3 `StudyStage` — مراحل الدراسة (6 مراحل)

| الحقل | النوع | الملاحظة |
|-------|-------|----------|
| `stage` | StageType Enum | QUANTITIES, SPECS, COSTING, PRICING, QUOTATION, REVIEW |
| `status` | StageStatus Enum | NOT_STARTED → DRAFT → IN_REVIEW → APPROVED |
| `assigneeId` | String? | المسؤول |
| `approvedById` | String? | المعتمِد |
| `approvedAt` | DateTime? | تاريخ الاعتماد |

### 7.4 `FinishingItem` — عنصر التشطيبات

| الحقل | النوع | الملاحظة |
|-------|-------|----------|
| `floorId` / `floorName` | String? | ربط بالدور |
| `area` / `length` / `height` / `width` / `perimeter` / `quantity` | Decimal(15,2)? | الأبعاد |
| `calculationData` | JSONB? | بيانات الحساب الذكي |
| `specData` | JSONB? | بيانات المواصفات |
| `materialPrice` / `laborPrice` | Decimal(15,2) | سعر الوحدة |
| `materialCost` / `laborCost` / `totalCost` | Decimal(15,2) | التكاليف |

### 7.5 `MEPItem` — عنصر الكهروميكانيك

| الحقل | النوع | الملاحظة |
|-------|-------|----------|
| `category` | String | ELECTRICAL, PLUMBING, HVAC, FIREFIGHTING, LOW_CURRENT, SPECIAL |
| `floorId` / `roomId` | String? | الدور / الغرفة |
| `calculationMethod` | String | manual أو auto |
| `dataSource` | String | manual أو auto |
| `materialPrice` / `laborPrice` / `unitPrice` / `totalCost` | Decimal(15,2) | التكاليف |

### 7.6 `LaborItem` — عنصر العمالة

| الحقل | النوع | الملاحظة |
|-------|-------|----------|
| `laborType` / `workerType` | String | نوع العمالة |
| `quantity` | Int | العدد |
| `dailyRate` | Decimal(15,2) | الأجر اليومي |
| `durationDays` | Int | المدة بالأيام |
| `totalCost` | Decimal(15,2) | الإجمالي |

### 7.7 المشكلات

| المشكلة | الخطورة |
|---------|---------|
| حقل `dimensions` (Json) بلا قيود | ❌ حرجة |
| حقول JSONB بلا schema مفروض على DB | ⚠️ مهمة |
| لا يوجد audit trail — لا تتبع لمن عدّل ماذا ومتى | ❌ حرجة |
| لا يوجد Soft Delete — الحذف نهائي | ⚠️ مهمة |

---

## 8. تدفق البيانات الكامل

### 8.1 التدفق الأول: إنشاء عنصر إنشائي

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│  المستخدم يملأ  │────►│  Section Component   │────►│  CalculationResultsPanel│
│  نموذج العنصر   │     │  useMemo(calculations)│     │  معاينة النتائج         │
└─────────────────┘     └──────────────────────┘     └──────────┬──────────────┘
                                                                │ حفظ
                                                                ▼
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│  DB: إضافة      │◄────│  API Mutation         │◄────│  Client يرسل البيانات   │
│  StructuralItem │     │  structuralItem.create │     │  المحسوبة كما هي        │
└────────┬────────┘     └──────────────────────┘     └─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  recalculateCostStudy   │
│  Totals()               │
└─────────────────────────┘
```

> **⚠️ ملاحظة حرجة**: الحسابات تتم بالكامل على العميل. القيم تُرسَل كما هي بدون إعادة تحقق على الخادم.

### 8.2 التدفق الثاني: تحديث إعدادات المبنى

```
┌──────────────────┐
│  المستخدم يعدّل  │
│  إعدادات المبنى  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  API: buildingConfig.update  │
│  (250 سطر)                    │
└────────┬─────────────────────┘
         │
         ├──► 1. حفظ الإعدادات
         │
         ├──► 2. CASCADE: إعادة حساب التشطيبات
         │     └── computeDerived: floor_area, wall_area,
         │         external_wall_area, roof_area, roof_perimeter, yard_area
         │
         ├──► 3. CASCADE: حذف MEP التلقائية ❌
         │
         └──► 4. recalculateCostStudyTotals()
```

### 8.3 التدفق الثالث: توليد BOQ

```
تحميل StructuralItems
         │
         ▼
┌──────────────────────┐
│  boq-aggregator      │ ← ترتيب: plainConcrete → foundations → groundBeams
│  تجميع حسب التصنيف    │   → columns → slabs → beams → blocks → stairs
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  boq-recalculator    │ ← إعادة حساب تفاصيل القطع لكل عنصر
│  لكل عنصر: cutting   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     ┌─────────────────┐
│  BOQSummaryTable     │────►│  boq-export      │
│  3 تبويبات           │     │  Excel / PDF     │
└──────────────────────┘     └─────────────────┘
```

---

## 9. الارتباطات مع باقي المراحل

### 9.1 خط الأنابيب (Pipeline)

```
┌────────────┐    ┌───────────────┐    ┌──────────┐    ┌─────────────┐    ┌───────────┐
│  Quantities│───►│ Specifications│───►│  Costing │───►│   Pricing   │───►│ Quotation │
│  الكميات    │    │  المواصفات     │    │  التسعير  │    │  هامش الربح  │    │  عرض السعر │
└────────────┘    └───────────────┘    └──────────┘    └─────────────┘    └───────────┘
```

### 9.2 تأثير Building Config التتابعي

| المصدر | الهدف | النوع | التفصيل |
|--------|-------|-------|---------|
| Building Config | Finishing Items | ✅ إعادة حساب | `computeDerived()`: floor_area, wall_area, external_wall_area, roof_area, roof_perimeter, yard_area |
| Building Config | MEP Items | ❌ حذف مدمّر | حذف **جميع** عناصر MEP التلقائية بلا تأكيد |
| Building Config | Cost Totals | ✅ إعادة حساب | `recalculateCostStudyTotals()` |

### 9.3 BOQ Aggregation

```
boq-aggregator ← يجمع من كل الأقسام بالترتيب:
  1. plainConcrete  ← خرسانة عادية
  2. foundations    ← أساسات
  3. groundBeams   ← ميدات
  4. columns       ← أعمدة
  5. slabs         ← بلاطات
  6. beams         ← كمرات
  7. blocks        ← بلوك
  8. stairs        ← سلالم
```

### 9.4 دورة حياة المراحل

```
NOT_STARTED ──► DRAFT ──► IN_REVIEW ──► APPROVED
```

### 9.5 المشكلات

| المشكلة | الخطورة |
|---------|---------|
| نموذجان مختلفان لـ Building Config (إنشائي vs تشطيب) | ⚠️ مهمة |
| حذف MEP مدمّر بلا تأكيد أو استرجاع | ❌ حرجة |
| لا قفل على المراحل المعتمدة | ⚠️ متوسطة |
| خط أنابيب أحادي الاتجاه — لا تتبع عكسي | ⚠️ منخفضة |

---

## 10. الأداء وتحسين التحميل

### 10.1 نموذج التنفيذ الحالي

جميع الحسابات الإنشائية تعمل بالكامل على جانب العميل (Client-Side).

| الجانب | الوضع الحالي | الملاحظة |
|--------|-------------|----------|
| مكان التنفيذ | Client-side فقط | سريع لكن غير آمن |
| التحميل الكسول (Lazy Loading) | ❌ غير مفعّل | كل الأقسام تُحمّل دفعة واحدة |
| تقسيم الكود (Code Splitting) | ❌ غير مطبّق | لا تقسيم لمكونات الأقسام |
| Web Workers | ❌ غير مستخدمة | الحسابات على Main Thread |
| useMemo | ✅ مستخدم | يمنع إعادة الحساب غير الضرورية |

### 10.2 حجم الملفات المحمّلة دفعة واحدة

| الملف | الأسطر | التحميل |
|-------|--------|---------|
| `SlabsSection.tsx` | 3,438 | يُحمّل دائماً |
| `structural-calculations.ts` | 2,357 | يُحمّل دائماً |
| `FoundationsSection.tsx` | 2,383 | يُحمّل دائماً |
| `BOQSummaryTable.tsx` | 1,200 | يُحمّل دائماً |
| `ColumnsSection.tsx` | 1,643 | يُحمّل دائماً |
| `BlocksSection.tsx` | 1,287 | يُحمّل دائماً |
| `StairsSection.tsx` | 1,095 | يُحمّل دائماً |
| `BeamsSection.tsx` | 549 | يُحمّل دائماً |
| **المجموع** | **~14,000** | **كل شيء دفعة واحدة** |

حتى لو فتح المستخدم قسماً واحداً فقط، يتم تحميل جميع الأقسام مع كامل محرك الحسابات.

### 10.3 التحميل المقترح

```
الوضع الحالي:
[الصفحة تُطلب] ──► تحميل كل الأقسام + المحركات + BOQ
                     ████████████████████████████████████████████ (~14,000 سطر)

المقترح (مع Lazy Loading):
[الصفحة تُطلب] ──► الهيكل الأساسي فقط
                     ████ (~500 سطر)

[المستخدم يفتح قسم] ──► تحميل القسم المطلوب فقط
                          ██████ (~2,000 سطر)
```

### 10.4 التوصيات

**أ. التحميل الكسول لكل قسم:**
```typescript
// بدلاً من:
import { SlabsSection } from './sections/SlabsSection'

// المقترح:
const SlabsSection = dynamic(() => import('./sections/SlabsSection'), {
  loading: () => <SectionSkeleton />
})
```

**ب. Web Workers للحسابات الثقيلة**

**ج. تقسيم `structural-calculations.ts` إلى وحدات حسب الفئة**

---

## 11. المشاكل والنواقص والأخطاء

### 11.1 🔴 P0 — حرجة (يجب المعالجة فوراً)

#### المشكلة 1: جميع الحسابات client-side فقط — لا مصادقة خادم

```
المتصفح ──► حسابات client-side ──► API (حفظ فقط) ──► DB
                                        ▲
                                   لا يوجد تحقق!
                                   الخادم يقبل أي أرقام
```

**الخطر:** يمكن لعميل خبيث إرسال أي أرقام (كميات مخفّضة، أسعار معدّلة) والخادم سيقبلها. ثغرة أمنية في نظام مالي.

#### المشكلة 2: حسابات الأعمدة/الكمرات/السلالم مدمجة في مكونات UI

```
الوضع المطلوب:                    الوضع الفعلي:
Section UI ──► engine.ts          ColumnsSection.tsx ──► حسابات inline
                                  BeamsSection.tsx   ──► حسابات inline
  مركزي + قابل للاختبار           StairsSection.tsx  ──► حسابات inline
                                        حسابات مكررة + غير قابلة للاختبار
```

#### المشكلة 3: `dimensions` يستخدم `z.any()` — بدون تحقق

```typescript
// structural-item-create.ts:24
dimensions: z.any()    // ◄── يقبل أي شيء!

// structural-item-update.ts:25
dimensions: z.any()    // ◄── يقبل أي شيء!
```

### 11.2 🟠 P1 — مهمة (يجب المعالجة قريباً)

| # | المشكلة | الملف | الأسطر |
|---|---------|-------|--------|
| 4 | `SlabsSection.tsx` — 3,438 سطر في ملف واحد | `sections/SlabsSection.tsx` | يحتاج تقسيم إلى 5 مكونات |
| 5 | `FoundationsSection.tsx` — 2,383 سطر | `sections/FoundationsSection.tsx` | يحتاج تقسيم إلى 4 مكونات |
| 6 | نموذجان مختلفان لتكوين المبنى | `structural-building-config.ts` + `building-config-update.ts` | قد ينحرفان مع الوقت |
| 7 | Hollow Core Slab تقديري فقط | `structural-calculations.ts:2011` | 350 SAR/m² hardcoded |
| 8 | لا يوجد lazy loading لأي قسم | `StructuralAccordion.tsx` | كل الأقسام تُحمّل دفعة واحدة |

### 11.3 🟡 P2 — تحسينات

| # | المشكلة | التفصيل |
|---|---------|---------|
| 9 | عناصر مفقودة | جدران استنادية، خزانات مياه |
| 10 | أرقام سحرية | معاملات العمالة (1.2-1.3) مشفّرة |
| 11 | لا اختبارات وحدة | لا يوجد أي ملف اختبار لمحرك الحسابات |
| 12 | لا سجل تدقيق | لا تتبع لمن عدّل ماذا ومتى |

### 11.4 🟢 P3 — مستقبلية

| # | المشكلة | التفصيل |
|---|---------|---------|
| 13 | تصدير PDF | حالياً `window.print()` فقط |
| 14 | تراجع/إعادة (Undo/Redo) | لا يوجد |
| 15 | إزالة `as any` | تحويلات نوع قسرية منتشرة |

### 11.5 ملخص

```
🔴 P0 حرجة    ███ 3 مشاكل    ← فوراً
🟠 P1 مهمة    █████ 5 مشاكل  ← الدورة القادمة
🟡 P2 تحسينات ████ 4 مشاكل   ← تخطيط
🟢 P3 مستقبلية ███ 3 مشاكل   ← طويل المدى
               ─────────────
               المجموع: 15 مشكلة
```

---

## 12. جدول ملخص BOQ الإنشائي

### 12.1 BOQSummaryTable.tsx (~1,200 سطر)

**3 تبويبات:**

| التبويب | المحتوى |
|---------|---------|
| **ملخص** (Summary) | إجمالي الخرسانة/الحديد/البلوك/الشدات + تفصيل لكل قسم |
| **طلبية المصنع** (Factory Order) | القطر، طول السيخ، العدد، الوزن (كجم + طن) |
| **ورشة القص** (Cutting Workshop) | العنصر، الوصف، القطر، طول القطعة، العدد، الأسياخ، الهالك%، الوزن |

### 12.2 ترتيب التجميع في `boq-aggregator.ts`

```
1. plainConcrete  ← خرسانة عادية (نظافة)
2. foundations    ← أساسات
3. groundBeams   ← ميدات
4. columns       ← أعمدة
5. slabs         ← بلاطات
6. beams         ← كمرات
7. blocks        ← بلوك
8. stairs        ← سلالم
```

**كل قسم يظهر بلون وأيقونة مميزة:**

| القسم | اللون | الأيقونة |
|-------|-------|---------|
| plainConcrete | gray | — |
| foundations | amber | — |
| groundBeams | teal | — |
| columns | purple | — |
| slabs | emerald | — |
| beams | blue | — |
| blocks | orange | — |
| stairs | rose | — |

### 12.3 `boq-recalculator.ts` (393 سطر)

```
recalculateItem(category, subCategory, dims, quantity, name)
  ├── 'columns'    → recalculateColumnCutting()
  ├── 'beams'      → recalculateBeamCutting()
  ├── 'foundations' → recalculateFoundationCutting()
  ├── 'stairs'     → recalculateStairsCutting()
  └── 'slabs'      → recalculateSlabCutting()
```

**خوارزمية القص الأساسية (`calcCutting`):**
```
cutsPerStock  = floor(stockLength / barLength)
stocksNeeded  = ceil(barCount / cutsPerStock)
wastePerStock = stockLength - cutsPerStock × barLength
waste%        = (totalWaste / grossLength) × 100
```

### 12.4 `boq-export.ts` (265 سطر)

| الدالة | الصيغة | المحتوى |
|--------|--------|---------|
| `exportBOQToExcel` | Excel (3 أوراق) | BOQ + Factory Order + Cutting |
| `exportFactoryOrder` | Excel (ورقة واحدة) | القطر، العدد، الأوزان |
| `exportCuttingDetails` | Excel (ورقة واحدة) | جميع مواصفات القص |
| `exportBOQToPDF` | `window.print()` | ⚠️ طباعة متصفح فقط |

**تسمية الملفات:** بالعربية مع ختم التاريخ:
```
جدول_كميات_{اسم_الدراسة}_2026-03-15.xlsx
طلبية_مصنع_{اسم_الدراسة}_2026-03-15.xlsx
تفاصيل_قص_{اسم_الدراسة}_2026-03-15.xlsx
```

### 12.5 الإجماليات الكبرى (Grand Totals)

| المادة | الوحدة |
|--------|--------|
| الخرسانة | م³ |
| حديد التسليح | طن (+ كجم) |
| البلوك | عدد |
| الشدات | م² |

---

## 13. التوصيات والتحسينات

### 13.1 جدول التوصيات الشامل

| # | المشكلة | الملفات | الحل | الجهد | التأثير |
|---|---------|---------|------|-------|---------|
| 1 | حسابات inline في UI | `ColumnsSection`, `BeamsSection`, `StairsSection` → `structural-calculations.ts` | نقل الحسابات للمحرك المركزي | عالي | حرج |
| 2 | `z.any()` في dimensions | `structural-item-create.ts`, `structural-item-update.ts` | إنشاء Zod schemas لكل فئة | متوسط | حرج |
| 3 | SlabsSection عملاق | `SlabsSection.tsx` (3,438 سطر) | تقسيم إلى 5 مكونات فرعية | متوسط | عالي |
| 4 | FoundationsSection عملاق | `FoundationsSection.tsx` (2,383 سطر) | تقسيم إلى 4 مكونات فرعية | متوسط | عالي |
| 5 | لا lazy loading | `StructuralAccordion.tsx` | `next/dynamic` لكل قسم | منخفض | متوسط |
| 6 | نموذجان للمبنى | `structural-building-config.ts` + `building-config-update.ts` | توحيد في نموذج مشترك | عالي | عالي |
| 7 | Hollow Core تقديري | `structural-calculations.ts:2011` | حسابات تفصيلية بدل 350 SAR/m² | متوسط | متوسط |
| 8 | لا اختبارات وحدة | ملفات جديدة | اختبارات شاملة لكل دوال الحساب | عالي | حرج |
| 9 | لا سجل تدقيق | `schema.prisma` + middleware | جدول history أو soft deletes | متوسط | متوسط |
| 10 | `z.any()` بدل schemas | `structural-item-*.ts` | استبدال بـ discriminated union | منخفض | عالي |
| 11 | لا تحقق خادم | middleware جديد | طبقة تحقق تعيد الحساب وتقارن | عالي | حرج |
| 12 | PDF = window.print() | `boq-export.ts` | مكتبة jspdf أو @react-pdf | متوسط | منخفض |

### 13.2 مصفوفة الأولويات

```
التأثير
  ▲
حرج ──┤  [8] اختبارات    [1] نقل حسابات    [11] تحقق خادم
  │   │  [2] تحقق أبعاد
  │   │
عالي ──┤  [10] z.any()    [3] تقسيم Slabs    [6] توحيد Config
  │   │                   [4] تقسيم Found.
  │   │
متوسط ┤  [5] lazy load   [7] Hollow Core     [9] Audit Trail
  │   │
منخفض ┤                  [12] PDF Export
  │   │
  └───┼────────────┼────────────┼──────────────► الجهد
      منخفض       متوسط       عالي
```

### 13.3 ترتيب التنفيذ المقترح

**المرحلة 1 (فوري — 1-2 أسبوع):**
- [10] استبدال `z.any()` بمخططات محددة — منخفض الجهد، عالي التأثير
- [5] إضافة lazy loading — منخفض الجهد، متوسط التأثير
- [2] تحقق Zod للأبعاد على الخادم — متوسط الجهد، حرج التأثير

**المرحلة 2 (قصير المدى — 2-4 أسابيع):**
- [3] تقسيم SlabsSection إلى 5 مكونات
- [4] تقسيم FoundationsSection إلى 4 مكونات
- [7] تطوير حسابات Hollow Core Slab

**المرحلة 3 (متوسط المدى — 1-2 شهر):**
- [1] نقل الحسابات المدمجة إلى المحرك المركزي
- [8] كتابة اختبارات وحدة شاملة
- [9] إضافة سجل تدقيق

**المرحلة 4 (طويل المدى — 2-3 أشهر):**
- [11] تحقق حسابات على الخادم
- [6] توحيد نماذج تكوين المبنى
- [12] تصدير PDF حقيقي

---

## 14. مخططات بصرية

### 14.1 مخطط الهندسة المعمارية

```
┌─────────────────────────────────────────────────────────────────────┐
│                           المستخدم (User)                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Next.js App (Client)                          │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                 StructuralItemsEditor                         │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │               StructuralAccordion                       │  │  │
│  │  │                                                         │  │  │
│  │  │  ┌────────┐┌──────────┐┌────────┐┌──────┐┌───────┐    │  │  │
│  │  │  │ Plain  ││Foundation││Columns ││Slabs ││ Beams │    │  │  │
│  │  │  │Concrete││          ││        ││      ││       │    │  │  │
│  │  │  └────────┘└──────────┘└────────┘└──────┘└───────┘    │  │  │
│  │  │  ┌────────┐┌──────────┐                                │  │  │
│  │  │  │ Blocks ││  Stairs  │     7 Sections                 │  │  │
│  │  │  └────────┘└──────────┘                                │  │  │
│  │  └─────────────────────┬───────────────────────────────────┘  │  │
│  │                        │                                      │  │
│  │                        ▼                                      │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  structural-calculations.ts  +  calculations.ts         │  │  │
│  │  │  (2,357 سطر)                    (718 سطر)               │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  cutting-optimizer + boq-aggregator + boq-recalculator  │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ ORPC API Calls
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ORPC API Layer                               │
│  structural-item.create/update/delete  |  structural-specs.get/set  │
│  buildingConfig.update (cascade)       |  recalculate               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Prisma ORM                                 │
│  CostStudy | StructuralItem | FinishingItem | MEPItem | LaborItem  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       PostgreSQL Database                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 14.2 مخطط تدفق البيانات

```
┌──────────────┐
│  إدخال       │
│  المستخدم    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐         ┌─────────────────────────────┐
│  Section         │────────►│  CalculationResultsPanel    │
│  Component       │         │  (معاينة فورية)              │
│  useMemo(calc)   │         └─────────────────────────────┘
└──────┬───────────┘
       │ حفظ
       ▼
┌──────────────────┐
│  API Mutation    │
│  create / update │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐     ┌─────────────────────────────┐
│  DB              │────►│  recalculateCostStudy       │
│  StructuralItem  │     │  Totals()                   │
└──────────────────┘     └──────────┬──────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────────┐
                         │  BOQ Aggregation             │
                         │  boq-aggregator → recalc     │
                         │  → factory orders → export   │
                         └─────────────────────────────┘
```

### 14.3 مخطط هرمية المكونات

```
CostStudyPage
└── StructuralItemsEditor (175 سطر)
    ├── SummaryStatsCards
    ├── StructuralBuildingConfigBar (76 سطر)
    │   └── StructuralBuildingWizard (794 سطر) — modal
    │
    ├── StructuralAccordion (279 سطر)
    │   ├── PlainConcreteSection (511 سطر)
    │   ├── FoundationsSection (2,383 سطر) ⚠️
    │   │   ├── Isolated / Combined / Strip / Raft
    │   │   └── CalculationResultsPanel
    │   ├── ColumnsSection (1,643 سطر)
    │   │   ├── FloorColumnsPanel × N floors
    │   │   ├── NeckColumnsSection
    │   │   ├── [inline calculations] ❌
    │   │   └── CalculationResultsPanel
    │   ├── BeamsSection (549 سطر)
    │   │   ├── [inline calculations] ❌
    │   │   └── CalculationResultsPanel
    │   ├── SlabsSection (3,438 سطر) ⚠️
    │   │   ├── Solid / Ribbed / Flat / HollowCore / BandedBeam
    │   │   └── CalculationResultsPanel
    │   ├── BlocksSection (1,287 سطر)
    │   │   ├── General walls + Per-floor walls
    │   │   └── CalculationResultsPanel
    │   └── StairsSection (1,095 سطر)
    │       ├── Manual + Auto mode
    │       ├── [inline calculations] ❌
    │       └── CalculationResultsPanel
    │
    └── BOQSummaryTable (1,200 سطر)
        ├── Tab: ملخص (Summary)
        ├── Tab: طلبية المصنع (Factory Order)
        └── Tab: ورشة القص (Cutting Workshop)
```

### 14.4 مخطط تتالي تكوين المبنى

```
┌─────────────────────────────┐
│   BuildingConfig.update()   │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Finishing   │  │     MEP      │
│  إعادة حساب │  │  ❌ حذف كامل │
│  العناصر     │  │  العناصر     │
│  المرتبطة    │  │  التلقائية   │
└──────┬───────┘  └──────┬───────┘
       └────────┬────────┘
                ▼
┌──────────────────────────────┐
│ recalculateCostStudyTotals() │
└──────────────────────────────┘
```

### 14.5 جدول المعادلات المرجعية

#### حسابات الخرسانة

| العنصر | المعادلة | الوحدة |
|--------|----------|--------|
| حجم العمود | `(width/100) × (depth/100) × height` | م³ |
| حجم الكمرة | `(width/100) × (height/100) × length` | م³ |
| حجم البلاطة المصمتة | `length × width × thickness` | م³ |
| حجم الأساس المنفصل | `length × width × depth × quantity` | م³ |
| حجم الأساس الشريطي | `totalLength × width × height × quantity` | م³ |
| حجم اللبشة | `length × width × thickness` | م³ |
| خرسانة نظافة | `(length+0.2) × (width+0.2) × 0.10` | م³ |

#### حسابات حديد التسليح

| البند | المعادلة |
|-------|----------|
| وزن السيخ (كجم/م) | `diameter² × 0.00617` أو `REBAR_WEIGHTS[d]` |
| عدد الأسياخ (توزيع) | `Math.ceil(length / spacing) + 1` |
| عدد الكانات | `Math.ceil(height×1000 / spacing) + 1` |
| محيط الكانة | `2×(width + depth - 0.08) + 0.3` |
| طول التراكب | `40 × diameter` (الكود السعودي) |
| طول القضيب (عمود) | `height + 0.8` |
| طول القضيب (كمرة) | `length + 0.6` |

#### حسابات القص

| البند | المعادلة |
|-------|----------|
| قطع من كل سيخ | `cutsPerStock = floor(stockLength / barLength)` |
| أسياخ مطلوبة | `stocksNeeded = ceil(barCount / cutsPerStock)` |
| نسبة الهالك | `waste% = (stocksNeeded×stockLength - barCount×barLength) / (stocksNeeded×stockLength) × 100` |

#### حسابات البلوك

| البند | المعادلة |
|-------|----------|
| بلوكات/م² | `1 / (blockLength/100 × blockHeight/100)` — الافتراضي: 12.5 |
| عدد البلوك | `netArea × blocksPerSqm × (1 + wastePercent/100)` |
| المونة | `netArea × 0.02 m³/m²` |
| أكياس أسمنت | `ceil((volume × cement/parts) × 1440 / 50)` |

#### حسابات التكلفة

| البند | المعادلة |
|-------|----------|
| تكلفة الخرسانة | `volume × STRUCTURAL_PRICES.concrete[grade]` |
| تكلفة الحديد | `weight × 3.2 SAR/kg` |
| تكلفة الشدات | `area × 45 SAR/m²` |
| تكلفة العمالة | `quantity × STRUCTURAL_LABOR_PRICES[element]` |

### 14.6 جدول الثوابت المرجعية

#### أوزان الحديد (كجم/م)

| Φ6 | Φ8 | Φ10 | Φ12 | Φ14 | Φ16 | Φ18 | Φ20 | Φ22 | Φ25 | Φ28 | Φ32 |
|----|-----|------|------|------|------|------|------|------|------|------|------|
| 0.222 | 0.395 | 0.617 | 0.888 | 1.208 | 1.578 | 1.998 | 2.466 | 2.984 | 3.853 | 4.834 | 6.313 |

**المعادلة العامة:** `weight (kg/m) = diameter² / 162.2`

#### أسعار الخرسانة (SAR/م³)

| C15 | C20 | C25 | C30 | C35 | C40 |
|-----|-----|-----|-----|-----|-----|
| 220 | 250 | 280 | 310 | 350 | 400 |

#### أسعار العمالة الإنشائية (SAR)

| قواعد | أعمدة | كمرات | بلاطات | بلوك | سلالم | رقاب | ميدات | عادية |
|-------|-------|-------|--------|------|-------|------|-------|-------|
| 180/م³ | 220/م³ | 200/م³ | 150/م² | 35/م² | 250/م³ | 200/م³ | 180/م³ | 100/م³ |

#### أبعاد البلوك القياسية

| السماكة | الطول×الارتفاع | عدد/م² | السعر |
|---------|----------------|--------|-------|
| 10 cm | 40×20 cm | 12.5 | 2.5 SAR |
| 15 cm | 40×20 cm | 12.5 | 3.5 SAR |
| 20 cm | 40×20 cm | 12.5 | 4.5 SAR |

#### معايير الهدر (Waste Benchmarks)

| التقييم | النسبة |
|---------|--------|
| ممتاز | < 3% |
| جيد | 3-5% |
| متوسط | 5-8% |
| ضعيف | > 8% |

---

> **نهاية التقرير** — تم إعداد هذا التقرير بتاريخ 2026-03-15 بواسطة Claude Code Audit Engine.
> يغطي التقرير 257 ملف مصدري بإجمالي ~82,620 سطر كود عبر 14 قسماً شاملاً.
