# تقرير شامل: قسم التشطيبات (Finishing) — الوضع الحالي

> آخر تحديث: 2026-03-07
> إجمالي أسطر الكود: **~9,407 سطر** (frontend) + **~618 سطر** (API)

---

## 1. نظرة عامة

### ما هو هذا القسم؟
قسم التشطيبات هو الجزء الثاني من دراسة الكميات (Cost Study) في نظام مسار. يتولى حساب وإدارة كميات جميع أعمال التشطيبات في مشروع البناء — من العزل واللياسة والدهانات إلى الأرضيات والأبواب والأعمال الخارجية.

### المسار في التطبيق
```
/app/{organizationSlug}/pricing/studies/{studyId}/finishing
```

### العلاقة مع باقي أقسام دراسة التكلفة
```
CostStudy
├── الأعمال الإنشائية (Structural) → structuralCost
├── التشطيبات (Finishing) ← هذا القسم → finishingCost
├── الأعمال الكهروميكانيكية (MEP) → mepCost
├── العمالة (Labor) → laborCost
└── عروض الأسعار (Quotes)
```
تُخزّن تكلفة التشطيبات في حقل `finishingCost` في نموذج `CostStudy`.

---

## 2. هيكل الملفات الكامل

### شجرة الملفات

```
apps/web/modules/saas/pricing/
├── components/
│   ├── studies/
│   │   └── FinishingItemsEditor.tsx                    (166 سطر) — المكوّن الرئيسي (entry point)
│   └── finishing/
│       ├── BuildingSetupWizard.tsx                      (644 سطر) — ويزارد إعدادات المبنى
│       ├── BuildingSummaryBar.tsx                       (117 سطر) — شريط ملخص المبنى
│       ├── QuantitiesDashboard.tsx                      (797 سطر) — لوحة الكميات الرئيسية
│       ├── QuantitiesTable.tsx                          (275 سطر) — جدول عرض الكميات
│       ├── QuantityRowExpanded.tsx                      (219 سطر) — الصف الموسّع بالتفاصيل
│       ├── ManualItemAdder.tsx                          (188 سطر) — إضافة بند يدوي
│       ├── KnowledgeNotification.tsx                    (146 سطر) — إشعار استخلاص المعرفة
│       ├── CascadeNotification.tsx                      (123 سطر) — إشعار التحديث التتابعي
│       └── wizard/
│           ├── BuildingStructureStep.tsx                (359 سطر) — الخطوة 1: هيكل المبنى
│           ├── FloorDetailsStep.tsx                     (687 سطر) — الخطوة 2: تفاصيل الأدوار
│           ├── ExteriorStep.tsx                         (178 سطر) — الخطوة 3: الخارجي
│           └── ReviewStep.tsx                           (182 سطر) — الخطوة 4: المراجعة
├── lib/
│   ├── finishing-types.ts                               (58 سطر)  — الأنواع الأساسية
│   ├── finishing-categories.ts                          (997 سطر) — الفئات والمجموعات الـ 26
│   ├── finishing-templates.ts                           (260 سطر) — قوالب الفيلا والشقة
│   ├── finishing-links.ts                               (464 سطر) — قواعد الاشتقاق والربط
│   ├── smart-building-types.ts                          (142 سطر) — أنواع إعدادات المبنى الموسّعة
│   ├── derivation-engine.ts                            (1523 سطر) — محرك الاشتقاق (الأكبر)
│   ├── merge-quantities.ts                              (388 سطر) — دمج المحسوب مع المحفوظ
│   ├── knowledge-extractor.ts                           (616 سطر) — الاستخلاص العكسي
│   ├── plaster-config.ts                                (81 سطر)  — إعدادات اللياسة
│   ├── insulation-config.ts                             (183 سطر) — إعدادات العزل
│   └── paint-config.ts                                  (162 سطر) — إعدادات الدهانات

packages/api/modules/quantities/
├── router.ts                                            (53 سطر)  — الراوتر الرئيسي
└── procedures/
    ├── finishing-item-create.ts                          (124 سطر) — إنشاء بند + batch
    ├── finishing-item-update.ts                          (85 سطر)  — تحديث بند
    ├── finishing-item-delete.ts                          (38 سطر)  — حذف بند
    ├── finishing-item-reorder.ts                         (43 سطر)  — إعادة ترتيب
    └── building-config-update.ts                        (234 سطر) — تحديث إعدادات المبنى + cascade

apps/web/app/(saas)/app/(organizations)/[organizationSlug]/pricing/studies/[studyId]/finishing/
└── page.tsx                                             (41 سطر)  — صفحة Next.js
```

### إجمالي الأسطر حسب الطبقة:
| الطبقة | عدد الأسطر |
|--------|-----------|
| المكتبات (lib/) | 4,874 |
| المكونات (components/) | 3,903 |
| الصفحة (page) | 41 |
| API (procedures/) | 577 |
| الراوتر (router.ts) | 53 |
| **الإجمالي** | **~9,448** |

---

## 3. قاعدة البيانات

### 3.1 نموذج FinishingItem

```prisma
// schema.prisma — السطر 1230
model FinishingItem {
  id          String    @id @default(cuid())
  costStudyId String    @map("cost_study_id")
  costStudy   CostStudy @relation(fields: [costStudyId], references: [id], onDelete: Cascade)

  // التصنيف
  category       String                    // مثال: "FINISHING_WATERPROOFING"
  subCategory    String?  @map("sub_category")  // مثال: "WP_BATHROOMS"
  name           String                    // اسم البند بالعربية
  description    String?  @db.Text

  // ربط بالدور
  floorId   String? @map("floor_id")       // معرّف الدور من BuildingConfig
  floorName String? @map("floor_name")     // اسم الدور بالعربية

  // القياسات
  area      Decimal? @db.Decimal(15, 2)    // المساحة (م²)
  length    Decimal? @db.Decimal(15, 2)    // الطول (م.ط)
  height    Decimal? @db.Decimal(15, 2)    // الارتفاع (م)
  width     Decimal? @db.Decimal(15, 2)    // العرض (م)
  perimeter Decimal? @db.Decimal(15, 2)    // المحيط (م)
  quantity  Decimal? @db.Decimal(15, 2)    // الكمية (عدد/طقم)
  unit      String   @default("m2")        // m2, m, piece, set, lump_sum

  // الحساب الذكي
  calculationMethod String? @map("calculation_method")  // طريقة الحساب
  calculationData   Json?   @db.JsonB @map("calculation_data")  // بيانات الحساب التفصيلية

  // الربط الذكي
  dataSource      String?   @map("data_source")     // auto_building, auto_linked, manual, estimated
  sourceItemId    String?   @map("source_item_id")  // معرّف البند المصدر
  sourceFormula   String?   @map("source_formula")  // معادلة الحساب
  isEnabled       Boolean   @default(true) @map("is_enabled")
  groupKey        String?   @map("group_key")       // مثال: "INSULATION"
  scope           String?                            // per_floor, whole_building, external, roof

  // الجودة والمواصفات
  qualityLevel   String?  @map("quality_level")     // ECONOMY, STANDARD, PREMIUM, LUXURY
  brand          String?
  specifications String?  @db.Text

  // التكاليف
  wastagePercent Decimal? @default(0) @map("wastage_percent") @db.Decimal(5, 2)
  materialPrice  Decimal? @default(0) @map("material_price") @db.Decimal(15, 2)
  laborPrice     Decimal? @default(0) @map("labor_price") @db.Decimal(15, 2)
  materialCost   Decimal  @default(0) @map("material_cost") @db.Decimal(15, 2)
  laborCost      Decimal  @default(0) @map("labor_cost") @db.Decimal(15, 2)
  totalCost      Decimal  @default(0) @map("total_cost") @db.Decimal(15, 2)

  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([costStudyId])
  @@index([costStudyId, category])
  @@index([costStudyId, floorId])
  @@map("finishing_items")
}
```

**إجمالي الحقول: 28 حقل** (+ 3 indexes + 1 relation)

### 3.2 نموذج CostStudy — الحقول المتعلقة بالتشطيبات

```prisma
// schema.prisma — السطر 1141
model CostStudy {
  // ...
  finishingCost  Decimal @default(0) @map("finishing_cost") @db.Decimal(15, 2)
  buildingConfig Json?   @db.JsonB @map("building_config")  // SmartBuildingConfig
  finishingItems FinishingItem[]
  // ...
}
```

### 3.3 هيكل buildingConfig (JsonB) — مثال فعلي

```json
{
  "totalLandArea": 600,
  "buildingPerimeter": 48,
  "floors": [
    {
      "id": "uuid-1",
      "name": "الدور الأرضي",
      "area": 250,
      "height": 3.2,
      "sortOrder": 0,
      "isRepeated": false,
      "repeatCount": 1,
      "floorType": "GROUND",
      "rooms": [
        { "id": "r1", "name": "صالة", "length": 6, "width": 5, "type": "living", "hasFalseCeiling": true },
        { "id": "r2", "name": "مجلس", "length": 5, "width": 4, "type": "majlis", "hasFalseCeiling": true },
        { "id": "r3", "name": "حمام ضيوف", "length": 2.5, "width": 2, "type": "bathroom" },
        { "id": "r4", "name": "مطبخ", "length": 4, "width": 3.5, "type": "kitchen" }
      ],
      "openings": [
        { "id": "o1", "type": "door", "subType": "باب رئيسي", "width": 1.2, "height": 2.4, "count": 1, "isExternal": true },
        { "id": "o2", "type": "door", "subType": "باب عادي", "width": 0.9, "height": 2.1, "count": 4, "isExternal": false },
        { "id": "o3", "type": "window", "subType": "نافذة كبيرة", "width": 1.5, "height": 1.5, "count": 4, "isExternal": true }
      ]
    },
    {
      "id": "uuid-2",
      "name": "دور علوي",
      "area": 250,
      "height": 3.2,
      "sortOrder": 1,
      "isRepeated": true,
      "repeatCount": 2,
      "floorType": "UPPER"
    },
    {
      "id": "uuid-3",
      "name": "السطح",
      "area": 250,
      "height": 0,
      "sortOrder": 2,
      "isRepeated": false,
      "repeatCount": 1,
      "floorType": "ROOF"
    }
  ],
  "landPerimeter": 100,
  "fenceHeight": 3.5,
  "hasCourtyard": true,
  "hasGarden": true,
  "gardenPercentage": 30,
  "setupStep": 4,
  "isComplete": true
}
```

---

## 4. الـ API (كل endpoint بالتفصيل)

### 4.1 Router Structure
```typescript
// router.ts:19-41
quantitiesRouter = {
  finishingItem: {
    create:      finishingItemCreate,
    createBatch: finishingItemCreateBatch,
    update:      finishingItemUpdate,
    delete:      finishingItemDelete,
    reorder:     finishingItemReorder,
  },
  buildingConfig: {
    update: buildingConfigUpdate,
  },
}
```

### 4.2 `finishingItem.create`

| الخاصية | التفاصيل |
|---------|----------|
| **المسار** | `POST /quantities/{costStudyId}/finishing-items` |
| **Input** | `organizationId: string`, `costStudyId: string` + `finishingItemSchema` (28 حقل) |
| **Handler** | يتحقق من الصلاحيات → يتحقق من وجود الدراسة → `createFinishingItem(data)` |
| **Output** | كائن FinishingItem مع تحويل Decimal → Number |

**finishingItemSchema الكامل:**
```typescript
// finishing-item-create.ts:7-39
z.object({
  category: z.string(),
  subCategory: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  floorId: z.string().optional(),
  floorName: z.string().optional(),
  area: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  perimeter: z.number().optional(),
  quantity: z.number().optional(),
  unit: z.string().default("m2"),
  calculationMethod: z.string().optional(),
  calculationData: z.any().optional(),
  qualityLevel: z.string().optional(),
  brand: z.string().optional(),
  specifications: z.string().optional(),
  wastagePercent: z.number().default(0),
  materialPrice: z.number().default(0),
  laborPrice: z.number().default(0),
  materialCost: z.number().default(0),
  laborCost: z.number().default(0),
  totalCost: z.number().default(0),
  dataSource: z.string().optional(),
  sourceItemId: z.string().optional(),
  sourceFormula: z.string().optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().default(0),
  groupKey: z.string().optional(),
  scope: z.string().optional(),
})
```

### 4.3 `finishingItem.createBatch`

| الخاصية | التفاصيل |
|---------|----------|
| **المسار** | `POST /quantities/{costStudyId}/finishing-items/batch` |
| **Input** | `organizationId`, `costStudyId`, `items: finishingItemSchema[]` |
| **Handler** | يتحقق من الصلاحيات → `createFinishingItemsBatch(costStudyId, items)` |
| **Output** | `{ success: true }` |

### 4.4 `finishingItem.update`

| الخاصية | التفاصيل |
|---------|----------|
| **المسار** | `PUT /quantities/{costStudyId}/finishing-items/{id}` |
| **Input** | `organizationId`, `costStudyId`, `id` + كل حقول finishingItemSchema اختيارية |
| **Handler** | `updateFinishingItem(id, costStudyId, data)` |
| **Output** | كائن FinishingItem محدّث مع تحويل Decimal → Number |

### 4.5 `finishingItem.delete`

| الخاصية | التفاصيل |
|---------|----------|
| **المسار** | `DELETE /quantities/{costStudyId}/finishing-items/{id}` |
| **Input** | `organizationId`, `costStudyId`, `id` |
| **Output** | `{ success: true }` |

### 4.6 `finishingItem.reorder`

| الخاصية | التفاصيل |
|---------|----------|
| **المسار** | `PUT /quantities/{costStudyId}/finishing-items/reorder` |
| **Input** | `organizationId`, `costStudyId`, `items: { id: string, sortOrder: number }[]` |
| **Output** | `{ success: true }` |

### 4.7 `buildingConfig.update` (الأهم — مع Cascade)

| الخاصية | التفاصيل |
|---------|----------|
| **المسار** | `PUT /quantities/{costStudyId}/building-config` |
| **Input** | `organizationId`, `costStudyId`, `buildingConfig: SmartBuildingConfig` |
| **Handler Logic** | 1. حفظ الإعدادات → 2. جلب البنود المربوطة → 3. لكل بند مربوط (`calculationData.linkedSource.type === "building_config"`): حساب الكمية الجديدة → 4. `batchUpdateFinishingItems` |
| **Output** | `{ success: true, buildingConfig, cascadeUpdatedCount: number }` |

**منطق الـ Cascade في الباك-إند:**
```typescript
// building-config-update.ts:171-227
for (const item of items) {
  const linked = calcData?.linkedSource as LinkedSourceData;
  if (!linked || linked.type !== "building_config") continue;

  const newQty = computeDerived(linked.derivation, buildingConfig, floorId);
  // حساب التكلفة الجديدة: newQty × wastage × unitCost
  // تقسيم إلى materialCost و laborCost بنفس النسبة
  cascadeUpdates.push({ id, area/length/quantity, totalCost, materialCost, laborCost });
}
await batchUpdateFinishingItems(costStudyId, cascadeUpdates);
```

---

## 5. إعدادات المبنى (Building Config)

### 5.1 كيف يعمل الويزارد (BuildingSetupWizard)

**الملف:** `finishing/BuildingSetupWizard.tsx` (644 سطر)

الويزارد هو نقطة الدخول الأولى عند فتح قسم التشطيبات لأول مرة. يُعرض تلقائياً إذا:
- `showWizard === null` و `isWizardComplete === false` و `floors.length === 0`

### 5.2 الخطوات الأربع

#### الخطوة 1: هيكل المبنى (BuildingStructureStep)
**الملف:** `wizard/BuildingStructureStep.tsx` (359 سطر)

المحتوى:
- **مساحة الأرض الإجمالية** (`totalLandArea`)
- **محيط المبنى التقريبي** (`buildingPerimeter`)
- **إضافة الأدوار** — لكل دور:
  - اسم، مساحة، ارتفاع، نوع (`FloorType`)
  - هل هو متكرر؟ وعدد التكرار
- الأنواع المتاحة: `BASEMENT`, `GROUND`, `UPPER`, `ANNEX`, `ROOF`, `MEZZANINE`

#### الخطوة 2: تفاصيل الأدوار (FloorDetailsStep)
**الملف:** `wizard/FloorDetailsStep.tsx` (687 سطر) — الأكبر في الويزارد

لكل دور (عدا السطح):
- **الغرف** (`rooms[]`):
  - اسم، طول، عرض، نوع (`RoomType`), هل فيه سقف مستعار
  - الأنواع: `bedroom`, `living`, `majlis`, `kitchen`, `bathroom`, `hall`, `corridor`, `storage`, `laundry`, `maid_room`, `other`
- **الفتحات** (`openings[]`):
  - نوع (باب/نافذة)، النوع الفرعي، عرض، ارتفاع، عدد، هل خارجي
  - القيم الافتراضية: `باب عادي (0.9×2.1)`, `باب حمام (0.7×2.1)`, `باب رئيسي (1.2×2.4)`, `نافذة كبيرة (1.5×1.5)`, `نافذة متوسطة (1.2×1.2)`, `نافذة صغيرة (0.6×0.6)`
- **نسخ من دور آخر** — زر لاستنساخ الغرف والفتحات

#### الخطوة 3: الخارجي (ExteriorStep)
**الملف:** `wizard/ExteriorStep.tsx` (178 سطر)

- **محيط الأرض** (`landPerimeter`)
- **ارتفاع السور** (`fenceHeight`)
- **هل يوجد حوش؟** (`hasCourtyard`)
- **هل يوجد حديقة؟** (`hasGarden`)
- **نسبة الحديقة من الحوش** (`gardenPercentage`)

#### الخطوة 4: المراجعة والتوليد (ReviewStep)
**الملف:** `wizard/ReviewStep.tsx` (182 سطر)

يعرض ملخص:
- إجمالي مساحة البناء، عدد الأدوار، الارتفاع الكلي
- عدد الغرف، عدد الحمامات، عدد الفتحات
- مساحة الحوش

### 5.3 كيف يتم الحفظ

عند كل خطوة يُستدعى `saveConfig`:
```typescript
// BuildingSetupWizard.tsx:87-100
saveMutation.mutate({
  organizationId,
  costStudyId: studyId,
  buildingConfig: { ...cfg, setupStep: stepIdx, isComplete: false },
});
```

عند الضغط على "توليد الكميات" في الخطوة 4:
1. يُحفظ `buildingConfig` مع `isComplete: true`
2. يُستدعى `deriveAllQuantities(finalConfig)` لحساب كل البنود
3. يُنشأ البنود عبر `finishingItem.createBatch`
4. في حالة إعادة التعديل (re-edit): يُقارن مع البنود الموجودة ويُحدّث أو يُنشئ الجديد

### 5.4 بنية SmartBuildingConfig بالكامل

```typescript
// smart-building-types.ts:3-19
interface SmartBuildingConfig {
  // البيانات الأساسية
  totalLandArea: number;      // مساحة الأرض الكلية (م²)
  buildingPerimeter: number;  // محيط المبنى (م.ط)
  floors: SmartFloorConfig[]; // قائمة الأدوار

  // السور والحوش
  landPerimeter?: number;     // محيط الأرض (م.ط)
  fenceHeight?: number;       // ارتفاع السور (م)
  hasCourtyard?: boolean;     // هل يوجد حوش
  hasGarden?: boolean;        // هل يوجد حديقة
  gardenPercentage?: number;  // نسبة الحديقة %

  // حالة الإعداد
  setupStep?: number;         // الخطوة الحالية (0-4)
  isComplete?: boolean;       // هل اكتمل الويزارد
}

interface SmartFloorConfig {
  id: string;
  name: string;
  area: number;
  height: number;
  sortOrder: number;
  isRepeated: boolean;
  repeatCount: number;
  floorType: FloorType; // "BASEMENT"|"GROUND"|"UPPER"|"ANNEX"|"ROOF"|"MEZZANINE"
  rooms?: RoomConfig[];
  openings?: OpeningConfig[];
}

interface RoomConfig {
  id: string;
  name: string;
  length: number;
  width: number;
  type: RoomType; // "bedroom"|"living"|"majlis"|"kitchen"|"bathroom"|"hall"|"corridor"|"storage"|"laundry"|"maid_room"|"other"
  hasFalseCeiling?: boolean;
}

interface OpeningConfig {
  id: string;
  type: "door" | "window";
  subType: string;
  width: number;
  height: number;
  count: number;
  isExternal: boolean;
  roomId?: string;
}
```

---

## 6. محرك الاشتقاق (Derivation Engine)

**الملف:** `lib/derivation-engine.ts` (1,523 سطر) — أكبر ملف في القسم

### 6.1 الدالة الرئيسية `deriveAllQuantities`

```typescript
// derivation-engine.ts:196-270
export function deriveAllQuantities(config: SmartBuildingConfig): DerivedQuantity[]
```

**كيف تعمل:**
1. تتحقق من وجود أدوار
2. تحسب `PlasterResult` لكل دور سكني (cache)
3. تستدعي 15 دالة فرعية بالتتابع:

```
deriveInsulation()     → عزل مائي + حراري
derivePlastering()     → لياسة داخلية + خارجية
derivePainting()       → دهان داخلي + واجهات + سور
deriveFlooring()       → أرضيات
deriveWallCladding()   → تكسيات جدران + سبلاش باك
deriveFalseCeiling()   → أسقف مستعارة
deriveDoors()          → أبواب داخلية + خارجية
deriveWindows()        → نوافذ ألمنيوم
deriveSanitary()       → أدوات صحية + مغاسل
deriveKitchen()        → خزائن مطبخ
deriveStairs()         → درج داخلي + خارجي + درابزين
deriveFacade()         → واجهات حجرية + زخارف
deriveExternal()       → حوش + بوابات + حدائق
deriveRoofWorks()      → تشطيبات سطح
deriveDecor()          → ديكورات (مقطوعية)
```

### 6.2 كل علاقة بين البنود (بند ⟹ بند)

| البند المصدر | البنود المشتقة | العلاقة |
|-------------|----------------|---------|
| مساحة البدروم | عزل مائي أساسات | `= area` |
| حمامات (من الغرف) | عزل مائي حمامات | `= مجموع مساحات أرضيات الحمامات` |
| مساحة السطح | عزل مائي سطح | `= area` |
| عزل مائي سطح | عزل حراري سطح | `auto_linked = نفس الكمية` |
| محيط المبنى × الارتفاع | عزل حراري جدران | `= perimeter × totalHeight` |
| لياسة داخلية (لكل دور) | دهان داخلي | `auto_linked = نفس الكمية` |
| لياسة داخلية (جدران حمامات) | تكسيات جدران حمامات | `auto_linked = bathroomWallArea` |
| لياسة خارجية | دهان واجهات | `auto_linked = نفس الكمية` |
| لياسة خارجية | تكسيات واجهات حجرية | `auto_linked = نفس الكمية` |
| أدوات صحية (عدد) | مغاسل ورخاميات | `auto_linked = نفس العدد` |
| عزل مائي سطح | تشطيبات سطح | `auto_linked = نفس المساحة` |
| مساحة الحوش | تنسيق حدائق | `auto_derived = yard × gardenPercentage%` |
| عدد الأدوار العلوية | درج داخلي | `= عدد` |
| عدد الأدراج | درابزين | `= stairs × 4 م.ط` |

### 6.3 الدوال المساعدة

#### `calcInternalPlaster(floor)` (سطر 115-190)
يحسب مساحة اللياسة الداخلية لدور واحد:
- **إذا توجد غرف**: مجموع (محيط الغرفة × ارتفاع) + مساحات الأسقف - فتحات داخلية - جدران حمامات
- **بدون غرف**: تقديري = `estimatePerimeterFromArea(area)` × height + ceiling

#### `estimatePerimeterFromArea(area, multiplier=1.3)` (سطر 19-23)
```typescript
return Math.sqrt(area) * 4 * wallMultiplier;
```
يقدر محيط الجدران من المساحة بافتراض شكل شبه مربع مع معامل تعقيد 1.3.

#### `deriveFromExistingItems(existingItems, partialConfig)` (سطر 1366-1453)
يشتق بنوداً جديدة من بنود يدوية موجودة:
- لياسة داخلية → دهان داخلي + أسقف مستعارة
- دهان داخلي → أسقف مستعارة
- أرضيات → أسقف مستعارة

#### `calculateCascadeEffects(changedItemKey, newQuantity, allItems)` (سطر 1466-1523)
يحسب التأثيرات التتابعية عند تغيير كمية بند:

**خريطة التتابع المباشر:**
```typescript
// derivation-engine.ts:1460-1464
const CASCADE_MAP = {
  waterproofing_roof: ["thermal_roof", "roof_finishing"],
  external_plaster:   ["facade_paint", "stone_facade"],
  bathroom_fixtures:  ["vanities"],
};
```

**قواعد خاصة:**
- `internal_plaster_{floorId}` → `interior_paint_{floorId}`
- `yard_paving` → `landscaping` (بحساب النسبة)

### 6.4 مثال عملي: مبنى 3 أدوار

**الإدخال:** فيلا 250م² أرضي + علوي متكرر (2 دور) + سطح، محيط 48م, أرض 600م²

**المخرجات التقريبية:**

| # | البند | الكمية | الوحدة | المصدر |
|---|-------|--------|--------|--------|
| 1 | عزل مائي سطح | 250 | م² | auto_building |
| 2 | عزل حراري جدران | 461 (48×9.6) | م² | auto_building |
| 3 | عزل حراري سطح | 250 | م² | auto_linked ← عزل مائي |
| 4 | لياسة داخلية أرضي | ~490 | م² | estimated |
| 5 | لياسة داخلية علوي | ~490 | م² | estimated |
| 6 | لياسة خارجية | ~461 | م² | auto_building |
| 7 | دهان داخلي أرضي | ~490 | م² | auto_linked ← لياسة |
| 8 | دهان داخلي علوي | ~490 | م² | auto_linked ← لياسة |
| 9 | دهان واجهات | ~461 | م² | auto_linked ← لياسة خارجية |
| 10 | أرضيات أرضي | 250 | م² | estimated |
| 11 | أرضيات علوي | 250 | م² | estimated |
| 12 | أسقف مستعارة أرضي | 250 | م² | estimated |
| 13 | أسقف مستعارة علوي | 250 | م² | estimated |
| 14 | تكسيات واجهات | ~461 | م² | auto_linked ← لياسة خارجية |
| 15 | أرضيات حوش | 350 (600-250) | م² | auto_building |
| 16 | تشطيبات سطح | 250 | م² | auto_linked ← عزل مائي |
| 17 | درج خارجي | 1 | عدد | auto_building |
| 18 | درج داخلي | 2 | عدد | auto_building |
| 19 | درابزين | 8 | م.ط | auto_derived |
| 20 | بوابة سور | 1 | عدد | auto_building |
| 21 | زخارف واجهات | 0 | مقطوعية | manual (معطّل) |
| 22 | ديكورات داخلية | 0 | مقطوعية | manual (معطّل) |

---

## 7. لوحة الكميات (Quantities Dashboard)

### 7.1 المكونات وعلاقتها ببعض

```
FinishingItemsEditor (entry point)
├── BuildingSetupWizard (إذا لم يكتمل الإعداد)
│   ├── BuildingStructureStep
│   ├── FloorDetailsStep
│   ├── ExteriorStep
│   └── ReviewStep
└── QuantitiesDashboard (بعد اكتمال الإعداد أو التخطي)
    ├── BuildingSummaryBar
    ├── KnowledgeNotification (مشروط)
    ├── CascadeNotification (مشروط)
    ├── ManualItemAdder
    └── QuantitiesTable
        └── QuantityRowExpanded (عند النقر على صف)
```

### 7.2 BuildingSummaryBar

**الملف:** `BuildingSummaryBar.tsx` (117 سطر)

يعرض شريطاً أعلى لوحة الكميات بالمعلومات التالية:
- **مساحة البناء**: مجموع مساحات الأدوار × التكرار
- **الأدوار**: عدد الأدوار السكنية (+ سطح إن وجد)
- **الحمامات**: عدد الحمامات من كل الأدوار
- **الحوش**: مساحة الحوش (مساحة الأرض - مسطح المبنى)
- **زر تعديل الإعدادات**: يفتح الويزارد

إذا لم تُعدّ إعدادات المبنى يعرض رسالة مع زر "إعداد المبنى".

### 7.3 QuantitiesTable

**الملف:** `QuantitiesTable.tsx` (275 سطر)

**أعمدة الجدول:**
```
[Checkbox] | البند | الدور | الكمية | الوحدة | الهدر | الفعلية | المصدر
```

**الأعمدة بالتفصيل:**
1. **Checkbox**: تفعيل/تعطيل البند (`isEnabled`)
2. **البند**: اسم + أيقونة تحذير (إذا `isStale`)
3. **الدور**: اسم الدور أو النطاق (المبنى/خارجي/السطح)
4. **الكمية**: الكمية الأساسية (`quantity`)
5. **الوحدة**: م² / م.ط / عدد / طقم / مقطوعية
6. **الهدر**: `wastagePercent%` أو `-`
7. **الفعلية**: `effectiveQuantity` = quantity × (1 + wastage/100)
8. **المصدر**: Badge بلون:
   - `تلقائي` (أخضر) — `auto_building`
   - `مشتق` (أخضر) — `auto_linked`
   - `محسوب` (أخضر) — `auto_derived`
   - `يدوي` (outline) — `manual`
   - `تقديري` (outline) — `estimated`

**سلوك الصفوف:**
- مجمّعة حسب `groupKey` مع header قابل للطي
- النقر على صف يفتح `QuantityRowExpanded`
- الصفوف المعطّلة بشفافية 50%

### 7.4 QuantityRowExpanded

**الملف:** `QuantityRowExpanded.tsx` (219 سطر)

عند توسيع صف يظهر:
1. **تفاصيل الحساب** (`calculationBreakdown.formula`) — في صندوق بخط monospace
2. **المصدر** (`sourceDescription`)
3. **يعتمد على** — إذا كان مشتقاً من بند آخر (`sourceItemKey`)
4. **يُغذّي** — البنود التي تعتمد عليه
5. **تحذير القيمة القديمة** — إذا `isStale`: "الكمية اليدوية (X) قد لا تتوافق مع القيمة المحسوبة (Y)" + زر "إعادة للتلقائي"
6. **أزرار الإجراءات**:
   - "تعديل يدوي" (للبنود التلقائية)
   - "إعادة للتلقائي" (للبنود اليدوية التي لها قيمة مشتقة)

### 7.5 التبويبات والفلترة

**تبويبات المجموعات** (GROUP_TABS):
```
الكل | أعمال العزل | أعمال اللياسة | أعمال الدهانات | ... (15 مجموعة)
```

**فلاتر الحالة:**
```
الكل | تلقائي | يدوي | تقديري | معطّل
```

**البحث النصي:** يبحث في `name` و `floorName`

**الإحصائيات:** عدد البنود الكلي، المفعّل، المعطّل

### 7.6 الحفظ التلقائي (Debounced Save)

```typescript
// QuantitiesDashboard.tsx:304-391
const debouncedSave = useCallback((item) => {
  clearTimeout(saveTimerRef.current);
  saveTimerRef.current = setTimeout(() => {
    if (item.isSaved && item.savedId) {
      updateMutation.mutate({ ...item });  // تحديث
    } else {
      saveMutation.mutate({ items: [item] });  // إنشاء جديد
    }
  }, 1000);  // تأخير 1 ثانية
}, [...]);
```

**ماذا يحفظ:**
- عند تغيير الكمية يدوياً (`handleManualOverride`)
- عند تفعيل/تعطيل بند (`handleToggleEnabled`)
- عند إعادة للتلقائي (`handleResetToAuto`)
- عند إضافة بند يدوي (`handleAddManualItem`)

---

## 8. نظام الربط الذكي

### 8.1 merge-quantities.ts — كيف يدمج المحسوب مع المحفوظ

**الملف:** `lib/merge-quantities.ts` (388 سطر)

**الدالة الرئيسية:**
```typescript
export function mergeQuantities(
  derived: DerivedQuantity[],  // من محرك الاشتقاق
  saved: SavedFinishingItem[], // من قاعدة البيانات
): MergedQuantityItem[]
```

**قواعد الدمج:**
| الحالة | السلوك |
|--------|--------|
| البند في derived + saved | استخدام القيم المحفوظة (المستخدم ربما عدّل) مع الاحتفاظ بالقيمة المشتقة |
| البند في derived فقط | إضافته كبند جديد غير محفوظ |
| البند في saved فقط | إبقاؤه كبند يدوي |

**Match Key:**
```typescript
function matchKey(category, subCategory, floorId, scope): string {
  return `${category}|${subCategory ?? ""}|${floorId ?? ""}|${scope ?? ""}`;
}
```

**خريطة التحويل** (`mapCategoryKey`): تحوّل من `categoryKey` الداخلي (مثل `waterproofing_foundations`) إلى `category` قاعدة البيانات (مثل `FINISHING_WATERPROOFING`).

### 8.2 knowledge-extractor.ts — الربط العكسي

**الملف:** `lib/knowledge-extractor.ts` (616 سطر)

**الفكرة:** عندما يُدخل المستخدم بنداً يدوياً (مثل لياسة داخلية مع تفاصيل الغرف)، يستخلص النظام بيانات الغرف والفتحات ويحدّث إعدادات المبنى ثم يشتق بنوداً إضافية.

**السيناريوهات الأربعة:**

| # | المصدر | ماذا يستخلص | ماذا يشتق |
|---|--------|-------------|----------|
| 1 | لياسة داخلية (`INTERNAL_PLASTER`) | غرف + فتحات → تحديث floor.rooms/openings | دهان + أرضيات + أسقف + تكسيات |
| 2 | دهان داخلي (`INTERIOR_PAINT`) | غرف + فتحات | لياسة + أرضيات + أسقف |
| 3 | أرضيات (`FLOOR_TILES`) + ROOM_BY_ROOM | غرف | أسقف مستعارة + لياسة |
| 4 | لياسة خارجية (`EXTERNAL_PLASTER`) | محيط المبنى | واجهات + عزل حراري |

**تخمين نوع الغرفة:**
```typescript
// knowledge-extractor.ts:464-480
function guessRoomType(name: string): RoomType {
  if (name.includes("حمام")) return "bathroom";
  if (name.includes("مطبخ")) return "kitchen";
  if (name.includes("نوم")) return "bedroom";
  // ...
}
```

### 8.3 نظام التحديث التتابعي (Cascade)

يعمل على مستويين:

**المستوى 1 — الواجهة (Frontend):**
```typescript
// QuantitiesDashboard.tsx:409-529 — handleManualOverride
const cascadeEffects = calculateCascadeEffects(item.categoryKey, newQuantity, derived);
// لكل تأثير:
// - إذا البند يدوي: تعليمه كـ stale فقط
// - إذا البند تلقائي: تحديث الكمية + حفظ
```

**المستوى 2 — الباك-إند (Backend):**
```typescript
// building-config-update.ts:171-227
// عند تحديث buildingConfig → إعادة حساب كل البنود المربوطة بـ linkedSource
```

### 8.4 أنواع DataSource وكيف تعمل

```typescript
type DataSourceType =
  | "auto_building"  // محسوب مباشرة من إعدادات المبنى
  | "auto_linked"    // مشتق من بند آخر (نفس الكمية)
  | "auto_derived"   // محسوب بمعادلة من بيانات أخرى
  | "manual"         // إدخال يدوي من المستخدم
  | "estimated";     // تقديري (بدون تفاصيل غرف)
```

**الفرق بين estimated و auto_building:**
- `auto_building`: الغرف موجودة → حساب دقيق (غرفة بغرفة)
- `estimated`: الغرف غير موجودة → تقدير من المساحة باستخدام `estimatePerimeterFromArea`

---

## 9. الفئات والمجموعات (finishing-categories.ts)

**الملف:** `lib/finishing-categories.ts` (997 سطر)

### 9.1 المجموعات الـ 15

| # | المعرّف | الاسم عربي | الاسم إنجليزي | الأيقونة | اللون |
|---|---------|-----------|--------------|----------|-------|
| 1 | `INSULATION` | أعمال العزل | Insulation Works | ShieldCheck | emerald |
| 2 | `PLASTERING` | أعمال اللياسة | Plastering Works | PaintBucket | amber |
| 3 | `PAINTING` | أعمال الدهانات | Painting Works | Paintbrush | blue |
| 4 | `FLOORING` | أعمال الأرضيات | Flooring Works | LayoutGrid | teal |
| 5 | `WALL_CLADDING` | أعمال تكسيات الجدران | Wall Cladding Works | Layers | cyan |
| 6 | `FALSE_CEILING` | أعمال الأسقف المستعارة | False Ceiling Works | Layers3 | gray |
| 7 | `DOORS` | أعمال الأبواب | Door Works | DoorOpen | orange |
| 8 | `WINDOWS` | أعمال النوافذ والألمنيوم | Window & Aluminum Works | AppWindow | indigo |
| 9 | `SANITARY` | الأدوات الصحية والسيراميك | Sanitary Fixtures & Ceramics | Bath | violet |
| 10 | `KITCHEN` | أعمال المطابخ | Kitchen Works | ChefHat | rose |
| 11 | `STAIRS` | أعمال الدرج والدرابزين | Stairs & Railing Works | ArrowUpDown | stone |
| 12 | `FACADE` | أعمال الواجهات | Facade Works | Building2 | amber |
| 13 | `EXTERNAL` | الأعمال الخارجية | External & Yard Works | Trees | green |
| 14 | `ROOF_WORKS` | أعمال السطح | Roof Works | Home | red |
| 15 | `DECOR` | أعمال الديكور | Decoration Works | Sparkles | pink |

### 9.2 الفئات الـ 26 — تفاصيل كاملة

| # | المعرّف | الاسم | المجموعة | النطاق | الوحدة | طريقة الحساب | الهدر % | عدد الفئات الفرعية | عدد مستويات الجودة |
|---|---------|-------|---------|--------|--------|-------------|---------|------|------|
| 1 | `FINISHING_WATERPROOFING` | العزل المائي | INSULATION | PER_FLOOR | m2 | DIRECT_AREA | 5% | 5 | 3 |
| 2 | `FINISHING_THERMAL_INSULATION` | العزل الحراري | INSULATION | WHOLE_BUILDING | m2 | DIRECT_AREA | 5% | 3 | 3 |
| 3 | `FINISHING_INTERNAL_PLASTER` | لياسة داخلية | PLASTERING | PER_FLOOR | m2 | WALL_DEDUCTION | 5% | 3 | 3 |
| 4 | `FINISHING_EXTERNAL_PLASTER` | لياسة خارجية | PLASTERING | EXTERNAL | m2 | WALL_DEDUCTION | 5% | 2 | 3 |
| 5 | `FINISHING_INTERIOR_PAINT` | دهان داخلي | PAINTING | PER_FLOOR | m2 | WALL_DEDUCTION | 10% | 6 | 4 |
| 6 | `FINISHING_FACADE_PAINT` | دهان واجهات | PAINTING | EXTERNAL | m2 | WALL_DEDUCTION | 10% | 4 | 3 |
| 7 | `FINISHING_BOUNDARY_PAINT` | دهان سور | PAINTING | EXTERNAL | m2 | WALL_DEDUCTION | 8% | 2 | 2 |
| 8 | `FINISHING_FLOOR_TILES` | أرضيات | FLOORING | PER_FLOOR | m2 | ROOM_BY_ROOM | 10% | 9 | 4 |
| 9 | `FINISHING_WALL_TILES` | تكسيات جدران | WALL_CLADDING | PER_FLOOR | m2 | WALL_DEDUCTION | 12% | 4 | 3 |
| 10 | `FINISHING_FALSE_CEILING` | جبس بورد | FALSE_CEILING | PER_FLOOR | m2 | ROOM_BY_ROOM | 10% | 6 | 3 |
| 11 | `FINISHING_INTERIOR_DOORS` | أبواب داخلية | DOORS | WHOLE_BUILDING | piece | PER_UNIT | 0% | 7 | 4 |
| 12 | `FINISHING_EXTERIOR_DOORS` | أبواب خارجية | DOORS | WHOLE_BUILDING | piece | PER_UNIT | 0% | 4 | 3 |
| 13 | `FINISHING_WINDOWS` | نوافذ ألمنيوم | WINDOWS | WHOLE_BUILDING | m2 | PER_UNIT | 0% | 5 | 4 |
| 14 | `FINISHING_BATHROOMS` | تجهيز حمامات | SANITARY | WHOLE_BUILDING | set | PER_UNIT | 0% | 4 | 4 |
| 15 | `FINISHING_MARBLE_VANITIES` | مغاسل ورخاميات | SANITARY | WHOLE_BUILDING | piece | PER_UNIT | 0% | 4 | 3 |
| 16 | `FINISHING_KITCHEN` | خزائن مطبخ | KITCHEN | WHOLE_BUILDING | m | LINEAR | 0% | 6 | 4 |
| 17 | `FINISHING_INTERNAL_STAIRS` | تكسية درج داخلي | STAIRS | WHOLE_BUILDING | piece | LINEAR | 5% | 4 | 3 |
| 18 | `FINISHING_EXTERNAL_STAIRS` | تكسية درج خارجي | STAIRS | EXTERNAL | piece | LINEAR | 5% | 4 | 3 |
| 19 | `FINISHING_RAILINGS` | درابزين | STAIRS | WHOLE_BUILDING | m | LINEAR | 5% | 5 | 3 |
| 20 | `FINISHING_STONE_FACADE` | تكسيات واجهات | FACADE | EXTERNAL | m2 | WALL_DEDUCTION | 10% | 7 | 3 |
| 21 | `FINISHING_FACADE_DECOR` | زخارف واجهات | FACADE | EXTERNAL | lump_sum | LUMP_SUM | 0% | 5 | 2 |
| 22 | `FINISHING_YARD_PAVING` | أرضيات حوش | EXTERNAL | EXTERNAL | m2 | DIRECT_AREA | 8% | 6 | 3 |
| 23 | `FINISHING_FENCE_GATES` | بوابات سور | EXTERNAL | EXTERNAL | piece | PER_UNIT | 0% | 6 | 3 |
| 24 | `FINISHING_LANDSCAPING` | تنسيق حدائق | EXTERNAL | EXTERNAL | m2 | DIRECT_AREA | 0% | 7 | 3 |
| 25 | `FINISHING_ROOF` | تشطيبات سطح | ROOF_WORKS | EXTERNAL | m2 | DIRECT_AREA | 5% | 5 | 3 |
| 26 | `FINISHING_INTERIOR_DECOR` | ديكورات داخلية | DECOR | WHOLE_BUILDING | lump_sum | LUMP_SUM | 0% | 8 | 3 |

### 9.3 طرق الحساب المتاحة

| الطريقة | الوصف | الفئات التي تستخدمها |
|---------|-------|---------------------|
| `DIRECT_AREA` | مساحة مباشرة | عزل مائي، عزل حراري، أرضيات حوش، تنسيق حدائق، تشطيبات سطح |
| `WALL_DEDUCTION` | مساحة جدران مع خصم الفتحات | لياسة، دهان، تكسيات جدران، واجهات |
| `ROOM_BY_ROOM` | حساب غرفة بغرفة | أرضيات، أسقف مستعارة |
| `PER_UNIT` | بالوحدة/العدد | أبواب، نوافذ، حمامات، مغاسل، بوابات |
| `LINEAR` | متر طولي | مطابخ، درج، درابزين |
| `LUMP_SUM` | مبلغ مقطوع | زخارف واجهات، ديكورات |

### 9.4 نسب الهدر الافتراضية

```
0%  — أبواب، نوافذ، حمامات، مغاسل، مطابخ، بوابات، تنسيق حدائق، زخارف، ديكورات
5%  — عزل مائي، عزل حراري، لياسة، درج، درابزين، تشطيبات سطح
8%  — دهان سور، أرضيات حوش
10% — دهان داخلي، دهان واجهات، أرضيات، أسقف مستعارة، واجهات حجرية
12% — تكسيات جدران
```

### 9.5 Helper Functions

```typescript
// finishing-categories.ts:952-997
getCategoryById(id: string): FinishingCategoryConfig | undefined
getCategoriesByGroup(groupId: string): FinishingCategoryConfig[]
getGroupedCategories(): Array<{ group, categories }>
calculateFinishingItemCost(item): number
// التكلفة = baseQuantity × (1 + wastage/100) × (materialPrice + laborPrice) × repeatCount
```

---

## 10. القوالب والأنماط (finishing-templates.ts)

**الملف:** `lib/finishing-templates.ts` (260 سطر)

### 10.1 القوالب الموجودة

#### `generateVillaTemplate(config, quality)` (سطر 81-252)
يولّد قائمة بنود تشطيبات لفيلا بناءً على `BuildingConfig` ومستوى الجودة.

**مستويات الجودة (QUALITY_PRICES):**
| الفئة | اقتصادي (مواد+عمالة) | عادي | ممتاز |
|-------|---------------------|------|--------|
| أرضيات | 35+20 | 70+25 | 150+35 |
| دهان | 12+8 | 25+10 | 45+15 |
| لياسة | 20+15 | 30+18 | 45+22 |
| أسقف | 35+20 | 60+25 | 100+35 |
| تكسيات جدران | 40+25 | 80+30 | 160+40 |
| أبواب | 400+100 | 900+200 | 2500+500 |
| نوافذ | 250+80 | 500+120 | 900+200 |
| حمامات | 2500+1000 | 6000+2000 | 15000+4000 |
| مطابخ | 600+200 | 1200+400 | 3000+700 |

**البنود المولّدة لكل دور:**
- أرضيات (85% من المساحة)
- دهان داخلي (محيط × ارتفاع + مساحة)
- لياسة داخلية (نفس مساحة الدهان)
- جبس بورد (70% من المساحة)

**البنود على مستوى المبنى:**
- أبواب داخلية: `totalArea / 35` باب
- نوافذ: 12% من المساحة الكلية
- حمامات: `max(2, totalArea / 100)`
- مطبخ: 6 م.ط

#### `generateApartmentTemplate(config, quality)` (سطر 254-260)
حالياً يعيد نفس نتيجة `generateVillaTemplate` (تعليق: "Same logic, slightly different ratios").

### 10.2 ملاحظة: QuickAddTemplates
لم تعد موجودة كمكوّن مستقل. يبدو أنها اُستبدلت بنظام التوليد التلقائي في الويزارد.

---

## 11. المكونات المتخصصة

### 11.1 ManualItemAdder

**الملف:** `finishing/ManualItemAdder.tsx` (188 سطر)

مكوّن لإضافة بند يدوي إلى لوحة الكميات. يحتوي:
- اختيار الفئة (`FINISHING_CATEGORIES`)
- اختيار الدور (اختياري)
- إدخال الكمية
- زر "إضافة"

### 11.2 KnowledgeNotification

**الملف:** `finishing/KnowledgeNotification.tsx` (146 سطر)

إشعار يظهر عند استخلاص بيانات من بند يدوي. يعرض:
- رسالة الإشعار (مثل "تم حفظ بيانات الغرف. يمكن حساب 5 بنود إضافية")
- قائمة البنود المشتقة مع الكميات
- زر "حساب تلقائي" (accept)
- زر "لا شكراً" (dismiss)

### 11.3 CascadeNotification

**الملف:** `finishing/CascadeNotification.tsx` (123 سطر)

**Interface المُصدّر:**
```typescript
export interface CascadeChange {
  itemKey: string;
  itemName: string;
  oldQuantity: number;
  newQuantity: number;
  unit: string;
  isManual: boolean;
}
```

إشعار يظهر بعد تحديث إعدادات المبنى. يعرض:
- "تم تحديث إعدادات المبنى"
- البنود المتأثرة مع الكمية القديمة → الجديدة
- عدد البنود اليدوية التي لم تتأثر
- زر "تم"

### 11.4 الحوارات المتخصصة

**ملاحظة:** لم أجد ملفات مستقلة لـ `PlasterItemDialog`, `WaterproofingItemDialog`, أو `ThermalInsulationItemDialog` في المسار `finishing/`. هذه الوظائف تُدار من خلال:
- ملفات الإعدادات (`plaster-config.ts`, `insulation-config.ts`, `paint-config.ts`)
- مفاتيح الترجمة تشير لوجودها (`pricing.studies.finishing.plaster`, `waterproofing`, `thermal`, `paint`)
- يبدو أنها مكونات كانت موجودة سابقاً أو ستُنشأ لاحقاً

### 11.5 ملفات الإعدادات المتخصصة

#### plaster-config.ts (81 سطر)
```typescript
PLASTER_METHODS = {
  buoj_awtar:          { ar: "بؤج وأوتار", thickness: 20mm, wastage: 10% },
  buoj_awtar_flexible: { ar: "بؤج وأوتار + زاوية فليكسبل", thickness: 20mm, wastage: 12% },
  qadda_mizan:         { ar: "قدّة وميزان", thickness: 20mm, wastage: 10% },
  machine:             { ar: "لياسة ماكينة (رش)", thickness: 12mm, wastage: 8% },
}

MIX_RATIOS = {
  "1:4": { cement: 1, sand: 4, label: "قوية" },
  "1:5": { cement: 1, sand: 5, label: "متوسطة" },
  "1:6": { cement: 1, sand: 6, label: "عادية — داخلية" },
}

calculatePlasterMaterials({ totalArea, thickness, mixRatio }) → {
  cementBags, cementKg, sandVolumeM3, bondcreteLiters, meshLinearM
}
```

#### insulation-config.ts (183 سطر)
```typescript
WATERPROOFING_MATERIALS = {
  bitumen_rolls, liquid_bitumen, cement_based, polyurethane, epoxy, pvc_membrane, other
}
// لكل مادة: defaultThickness, wastagePercent, overlapPercent

THERMAL_INSULATION_MATERIALS = {
  xps, eps, rock_wool, pu_spray, glass_wool, pir, other
}
// لكل مادة: lambda (الموصلية الحرارية), defaultThickness

calculateWaterproofingQuantity() → { netArea, overlapArea, effectiveArea, wastageArea, finalQuantity, primerArea }
calculateThermalQuantity() → { grossArea, netArea, finalQuantity, volumeM3, rValue }
```

#### paint-config.ts (162 سطر)
```typescript
PAINT_TYPES = {
  plastic_latex, acrylic_exterior, oil_enamel, epoxy, graviato, elastomeric, other
}
// لكل نوع: defaultCoats, defaultCoverageRate, applicableCategories

PAINT_BRANDS = { jotun, jazeera, hempel, national, caparol, sigma, other }

PUTTY_TYPES = {
  saveto_vetonit, saveto_vetonit_wr, saveto_fine, jotun_putty, jazeera_putty, other
}

calculatePaintMaterials() → {
  paintLiters, paintDrums18L, primerLiters, primerDrums18L, puttyKg, puttyPackages
}
```

---

## 12. الترجمة

**الملفات:** `packages/i18n/translations/ar.json` و `en.json`

### 12.1 مفاتيح الترجمة المتعلقة بالتشطيبات

المسار: `pricing.studies.finishing.*`

#### مفاتيح buildingConfig
```
title, totalLandArea, buildingPerimeter, floors, floorName, floorArea, floorHeight,
addFloor, repeatedFloor, repeatCount, totalBuildingArea, save, saved, saveError,
floorTypes.{BASEMENT, GROUND, UPPER, ANNEX, ROOF, MEZZANINE}
```

#### مفاتيح wizard
```
title, step1Title, step2Title, step3Title, step4Title, skip, skipDetails,
next, previous, generate, copyFromFloor, addRoom, addOpening,
totalBuildingArea, floorCount, totalHeight, roomCount, bathroomCount,
openingCount, courtyardArea, willGenerate, editConfig,
roomTypes.{bedroom, living, majlis, kitchen, bathroom, hall, corridor, storage, laundry, maid_room, other}
```

#### مفاتيح scope
```
PER_FLOOR: "لكل دور", WHOLE_BUILDING: "على مستوى المبنى", EXTERNAL: "أعمال خارجية"
```

#### مفاتيح البنود والإدارة
```
addItem, editItem, deleteItem, addForFloor, allFloors, selectFloor,
subCategory, qualityLevel, wastage, materialPrice, laborPrice,
actualQuantity, estimatedCost, itemSaved, itemDeleted, itemSaveError,
confirmDelete, quickTemplates, templateApplied
```

#### مفاتيح المجموعات (groups)
```
INSULATION, PLASTERING, PAINTING, FLOORING, WALL_CLADDING, FALSE_CEILING,
DOORS, WINDOWS, SANITARY, KITCHEN, STAIRS, FACADE, EXTERNAL, ROOF_WORKS, DECOR
```

#### مفاتيح calculator
```
title, roomByRoom, wallDeduction, perUnit, directArea, linear, lumpSum,
includeCeiling, customOpening, addRoom, roomName, totalArea, netArea,
wallArea, ceilingArea, deductions, totalDeductions, apply, fromPerimeter, fromRooms,
wallPerimeter, wallHeight, openingType, openingWidth, openingHeight, openingCount,
standardDoor, bathroomDoor, mainDoor, largeWindow, mediumWindow, smallWindow, addOpening
```

#### مفاتيح quality و units
```
quality: { ECONOMY, STANDARD, PREMIUM, LUXURY }
units: { m2, m, piece, set, lump_sum }
```

#### مفاتيح linking
```
fillFromBuilding, selectSource, linked, linkedToBuilding, linkedToCategory,
unlinkConfirm, unlink, autoUpdated, autoUpdatedCount, derivedQuantity,
applyLink, manualEntry, noConfigData, selectFloorFirst
```

#### مفاتيح waterproofing
```
title, name, location, materialType, otherMaterial, thickness, layers,
includePrimer, areaCalc, area, length, width, wastage, summary,
netArea, overlap, effectiveArea, wastageAmount, primer, finalQuantity,
save, cancel, layer1, layer2, layer3, autoByMaterial
```

#### مفاتيح thermal
```
title, name, location, materialType, otherMaterial, thickness, thicknessHint,
thermalInfo, lambda, rValue, sbcCompliant, areaCalc, area, length, width,
deductions, deductionsHint, wastage, summary, grossArea, netArea,
wastageAmount, volume, finalQuantity, save, cancel, autoByMaterial
```

#### مفاتيح plaster
```
titleInternal, titleExternal, name, method, thickness, mixRatio,
floor, selectFloor, noFloors, floorHeight, floorHeightHint, editRoomHeight,
rooms, facades, addRoom, addFacade, roomName, wall1, wall2, facadeLength, height,
keyboardHint, doors, windows, addDoor, addWindow, openingName, openingWidth,
openingHeight, openingCount, includeCeiling, ceilingArea, summary,
wallsGrossArea, openingsDeduction, wallsNetArea, totalWallsCeiling, totalWalls,
wastage, finalQuantity, materialsRequired, cement, bags, sand,
bondcrete, liters, mesh, save, cancel
```

#### مفاتيح paint
```
titleInterior, titleFacade, titleBoundary, name, paintType, customPaintType,
coats, coat1-4, paintBrand, customBrand, primerCoats, puttyCoats, puttyType,
customPuttyName, floor, selectFloor, noFloors, floorHeight, wallHeight,
floorHeightHint, editRoomHeight, linkToPlaster, unlink, importFromPlaster,
linkedBadge, plasterArea, rooms, addRoom, roomName, wall1, wall2,
facades, addFacade, facadeLength, wallSegments, addSegment, keyboardHint,
doors, windows, addDoor, addWindow, openingName, openingWidth, openingHeight,
openingCount, includeCeiling, ceilingArea, summary, wallsGrossArea, totalWalls,
openingsDeduction, wallsNetArea, totalWallsCeiling, wastage, finalQuantity,
materialsRequired, paintAmount, paintCoverage, primerCoverage, puttyCoverage,
coverageRateHint, coatsLabel, liters, drum18L, primer, putty, package, save, cancel
```

#### مفاتيح dashboard
```
noConfig, setupBuilding, buildingArea, floors, bathrooms, courtyard, editSettings,
searchPlaceholder, filterAll, filterAuto, filterManual, filterEstimated, filterDisabled,
totalItems, enabled, disabled, addManualItem, selectCategory, selectFloor, quantity,
add, noItems, colItem, colFloor, colQuantity, colUnit, colWastage, colEffective,
colSource, calculationDetails, source, dependsOn, feedsItems, staleWarning,
resetToAuto, manualEdit, save, cancel, saved
```

#### مفاتيح knowledge و cascade
```
knowledge: { title, accept, dismiss, andMore }
cascade: { title, updatedItems, manualSkipped, andMore, done }
```

### 12.2 هل هناك مفاتيح ناقصة؟

**لا توجد مفاتيح ناقصة واضحة.** كل المفاتيح المستخدمة في المكونات (`useTranslations`) موجودة في ملفات الترجمة. لكن:
- بعض النصوص مكتوبة hardcoded بالعربية في الكود مباشرة (مثل أسماء الفئات في `merge-quantities.ts`, `derivation-engine.ts`, `BuildingSetupWizard.tsx`) بدلاً من استخدام مفاتيح الترجمة.

---

## 13. مشاكل معروفة وملاحظات

### 13.1 Bugs و TODO Comments

1. **لا يوجد TODO comments** في الكود الحالي.

2. **نصوص hardcoded بالعربية**: في عدة ملفات:
   - `derivation-engine.ts`: كل `sourceDescription` و `formula` مكتوبة بالعربية مباشرة
   - `merge-quantities.ts`: `getCategoryName()`, `getSubCategory()`
   - `BuildingSetupWizard.tsx`: `getCategoryName()`, `mapCategoryKey()`
   - `QuantitiesDashboard.tsx`: `mapDerivedCategory()`, `getItemDisplayName()`

3. **تكرار كود mapCategoryKey/getCategoryName**: نفس الدالة مكررة في 3 ملفات على الأقل:
   - `merge-quantities.ts:93-128`
   - `BuildingSetupWizard.tsx:551-586`
   - `QuantitiesDashboard.tsx:726-761`

### 13.2 تناقضات بين الملفات

1. **`finishing-types.ts` vs `smart-building-types.ts`**: يوجد interface `BuildingConfig` قديم (بدون rooms/openings) و `SmartBuildingConfig` جديد. كلاهما يُعرّف `FloorType` بنفس القيم.

2. **`finishing-links.ts` vs `derivation-engine.ts`**: ملفان يقومان بنفس الوظيفة تقريباً (حساب الكميات من إعدادات المبنى) لكن بنهج مختلف:
   - `finishing-links.ts`: نهج قائم على القواعد (rule-based) مع `LinkedSource`
   - `derivation-engine.ts`: نهج شامل (comprehensive) يحسب كل شيء دفعة واحدة

   يبدو أن `finishing-links.ts` هو النظام القديم و `derivation-engine.ts` هو البديل الأحدث. **لكن `finishing-links.ts` لا يزال مستخدماً في الباك-إند** (`building-config-update.ts` يستخدم منطق `computeDerived` المشابه).

3. **`finishing-templates.ts`**: الدالة `generateApartmentTemplate` تعيد نفس نتيجة `generateVillaTemplate` — لم تُخصص بعد.

### 13.3 كود deprecated أو غير مستخدم

1. **`finishing-links.ts`**: معظم وظائفه تتداخل مع `derivation-engine.ts`. الدوال `getDerivationOptions`, `computeDerivedQuantity`, `getQuantityFromCategory`, `computeCascadeUpdates` قد تكون مستخدمة في أماكن أخرى (مثل الباك-إند)، لكن الفرونت-إند تحوّل لاستخدام `derivation-engine.ts`.

2. **`finishing-templates.ts`**: لا يبدو أنها تُستدعى من أي مكوّن حالياً. الويزارد يستخدم `deriveAllQuantities` مباشرة بدلاً من القوالب.

3. **`finishing-types.ts`**: الـ interface `BuildingConfig` (بدون rooms/openings) و `CalculatorResult` لا يبدو أنهما مستخدمان في المكونات الجديدة.

### 13.4 اقتراحات تحسين

1. **توحيد mapCategoryKey**: استخراج الدالة المكررة إلى `lib/` واحد واستخدامها في كل الأماكن.

2. **دعم اللغة الإنجليزية في المحرك**: كل النصوص في `derivation-engine.ts` و `merge-quantities.ts` بالعربية. يجب استخدام مفاتيح الترجمة.

3. **إزالة الأنواع القديمة**: `BuildingConfig` في `finishing-types.ts` يمكن إزالتها واستبدالها بـ `SmartBuildingConfig`.

4. **تخصيص قالب الشقة**: `generateApartmentTemplate` حالياً مجرد alias.

5. **إضافة Calculators مستقلة**: مفاتيح الترجمة تشير لوجود حوارات متخصصة (لياسة، عزل، دهان) لكن لا يوجد مجلد `calculators/`. يبدو أنها قيد التطوير.

6. **حقل `FinishingItemsEditor` المفقود**: الصفحة تستورد من `@saas/pricing/components/studies/FinishingItemsEditor` وليس من المسار الذي ذكره المستخدم. المسار الفعلي: `apps/web/modules/saas/pricing/components/studies/FinishingItemsEditor.tsx`.

7. **فصل منطق الباك-إند**: `building-config-update.ts` يحتوي على نسخة مبسطة من `computeDerived` بدلاً من مشاركة الكود مع الفرونت-إند. يمكن وضع المنطق المشترك في package مشترك.

8. **إمكانية حذف البنود من لوحة الكميات**: حالياً يوجد `finishingItemDelete` في API لكن لا يوجد زر حذف في `QuantityRowExpanded` أو `QuantitiesTable`. الحذف متاح فقط عبر تعطيل البند (`isEnabled: false`).

9. **reorder غير مُستخدم**: `finishingItemReorder` موجود في API لكن لا يوجد drag-and-drop أو أي واجهة لإعادة الترتيب في المكونات الحالية.
