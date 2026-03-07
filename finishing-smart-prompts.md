# برومبتات Claude Code — إعادة تصميم قسم التشطيبات "المبنى الذكي"

> **ملاحظة مهمة:** نفّذ كل مرحلة على حدة. استخدم Plan Mode أولاً ثم نفّذ. تأكد من نجاح كل مرحلة قبل الانتقال للتالية.
> **ملاحظة:** هذا القسم هو **حساب كميات فقط** — بدون تسعير. التسعير سيكون في قسم منفصل لاحقاً.

---

## المرحلة 1: توسيع بنية البيانات (BuildingConfig + FinishingItem)

```
## المهمة
توسيع بنية بيانات إعدادات المبنى (buildingConfig JsonB) في CostStudy وإضافة حقل dataSource لـ FinishingItem لدعم نظام الربط الذكي.

## السياق
- `buildingConfig` هو حقل `Json?` في model `CostStudy` في `packages/database/prisma/schema.prisma`
- حالياً يحتوي: `{ totalLandArea, buildingPerimeter, floors: [{ id, name, area, height, sortOrder, isRepeated, repeatCount, floorType }] }`
- نحتاج توسيعه ليشمل: غرف لكل دور، فتحات لكل دور، بيانات السور والحوش
- نحتاج إضافة حقول جديدة لـ `FinishingItem`: `dataSource`, `sourceItemId`, `isEnabled`, `sortOrder`

## المطلوب

### 1. إضافة حقول جديدة لـ FinishingItem في schema.prisma
أضف الحقول التالية لموديل `FinishingItem`:
```prisma
// أضف هذه الحقول بعد الحقول الموجودة
dataSource      String?   // 'auto_building' | 'auto_linked' | 'auto_derived' | 'manual' | 'estimated'
sourceItemId    String?   // معرف البند المصدر (إذا كان مرتبطاً ببند آخر)
sourceFormula   String?   // وصف المعادلة المستخدمة
isEnabled       Boolean   @default(true)  // هل البند مفعّل في الحساب
sortOrder       Int       @default(0)
groupKey        String?   // مفتاح المجموعة (insulation, plaster, paint, flooring, etc.)
scope           String?   // 'per_floor' | 'whole_building' | 'external' | 'roof'
```

### 2. إنشاء ملف الأنواع الموسّعة
أنشئ ملف `apps/web/modules/saas/pricing/lib/smart-building-types.ts`:

```typescript
// === إعدادات المبنى الموسّعة ===

export interface SmartBuildingConfig {
  // البيانات الأساسية (موجودة حالياً)
  totalLandArea: number;      // مساحة الأرض الإجمالية (م²)
  buildingPerimeter: number;  // محيط المبنى (م.ط)
  floors: SmartFloorConfig[]; // مصفوفة الأدوار

  // بيانات جديدة — السور والحوش
  landPerimeter?: number;     // محيط الأرض (م.ط) — للسور
  fenceHeight?: number;       // ارتفاع السور (م) — افتراضي 3.0
  hasCourtyard?: boolean;     // هل يوجد حوش
  hasGarden?: boolean;        // هل يوجد حديقة
  gardenPercentage?: number;  // نسبة الحديقة من الحوش (0-100)

  // حالة الإعداد
  setupStep?: number;         // آخر خطوة تم الوصول إليها في الويزارد (1-4)
  isComplete?: boolean;       // هل تم إكمال الويزارد
}

export interface SmartFloorConfig {
  // الحقول الحالية
  id: string;
  name: string;
  area: number;
  height: number;
  sortOrder: number;
  isRepeated: boolean;
  repeatCount: number;
  floorType: FloorType;

  // حقول جديدة — الغرف
  rooms?: RoomConfig[];

  // حقول جديدة — الفتحات
  openings?: OpeningConfig[];
}

export type FloorType = 'BASEMENT' | 'GROUND' | 'UPPER' | 'ANNEX' | 'ROOF' | 'MEZZANINE';

export interface RoomConfig {
  id: string;
  name: string;
  length: number;            // طول الغرفة (م) — يمثل جدار1
  width: number;             // عرض الغرفة (م) — يمثل جدار2
  type: RoomType;
  hasFalseCeiling?: boolean; // هل يوجد سقف مستعار — افتراضي true
}

export type RoomType = 'bedroom' | 'living' | 'majlis' | 'kitchen' | 'bathroom' | 'hall' | 'corridor' | 'storage' | 'laundry' | 'maid_room' | 'other';

// الغرف التي تُبلّط جدرانها بالكامل (لا تُدهن)
export const TILED_WALL_ROOMS: RoomType[] = ['bathroom'];

// الغرف التي يكون فيها سبلاش باك (تكسية جزئية)
export const SPLASH_BACK_ROOMS: RoomType[] = ['kitchen', 'laundry'];

// ارتفاع السبلاش باك الافتراضي (م)
export const DEFAULT_SPLASH_BACK_HEIGHT = 0.6;

export interface OpeningConfig {
  id: string;
  type: 'door' | 'window';
  subType: string;           // باب عادي، باب حمام، باب رئيسي، نافذة كبيرة، ...
  width: number;
  height: number;
  count: number;
  isExternal: boolean;       // هل على الواجهة الخارجية
  roomId?: string;           // الغرفة التي تنتمي إليها (اختياري)
}

// الفتحات الافتراضية مع أبعادها
export const DEFAULT_OPENINGS: Record<string, { width: number; height: number; isExternal: boolean }> = {
  'باب عادي':      { width: 0.9,  height: 2.1, isExternal: false },
  'باب حمام':      { width: 0.7,  height: 2.1, isExternal: false },
  'باب رئيسي':     { width: 1.2,  height: 2.4, isExternal: true },
  'باب مطبخ':      { width: 0.9,  height: 2.1, isExternal: false },
  'نافذة كبيرة':   { width: 1.5,  height: 1.5, isExternal: true },
  'نافذة متوسطة':  { width: 1.2,  height: 1.2, isExternal: true },
  'نافذة صغيرة':   { width: 0.6,  height: 0.6, isExternal: true },
};

// === مصدر البيانات ===

export type DataSourceType =
  | 'auto_building'   // محسوب تلقائياً من إعدادات المبنى
  | 'auto_linked'     // مرتبط ببند آخر (مساوي أو مشتق)
  | 'auto_derived'    // محسوب بمعادلة من عدة مصادر
  | 'manual'          // إدخال يدوي
  | 'estimated';      // تقديري من مساحة الدور فقط

// === الكمية المحسوبة ===

export interface DerivedQuantity {
  categoryKey: string;       // مفتاح الفئة (مثل 'internal_plaster')
  subCategory?: string;      // فئة فرعية (مثل 'cement')
  floorId?: string;          // الدور (null = المبنى كاملاً أو خارجي)
  floorName?: string;
  scope: 'per_floor' | 'whole_building' | 'external' | 'roof';
  quantity: number;          // الكمية الصافية
  unit: string;              // الوحدة
  wastagePercent: number;    // نسبة الهدر
  effectiveQuantity: number; // الكمية الفعلية (بعد الهدر)
  dataSource: DataSourceType;
  sourceDescription: string; // وصف مقروء لمصدر الكمية
  sourceItemKey?: string;    // مفتاح البند المصدر (إذا مرتبط)
  calculationBreakdown?: CalculationBreakdown; // تفاصيل الحساب
  isEnabled: boolean;        // هل البند مفعّل
  groupKey: string;          // مجموعة العمل
  groupName: string;         // اسم المجموعة
  groupIcon: string;         // أيقونة المجموعة
  groupColor: string;        // لون المجموعة
}

export interface CalculationBreakdown {
  type: 'direct_area' | 'wall_deduction' | 'room_by_room' | 'per_unit' | 'linear' | 'lump_sum' | 'derived';
  details: Record<string, any>;
  formula: string;           // المعادلة بشكل مقروء
}
```

### 3. تحديث Zod validation في API
عدّل ملف `packages/api/modules/quantities/procedures/building-config-update.ts`:
- وسّع الـ schema ليقبل الحقول الجديدة (rooms, openings, landPerimeter, fenceHeight, hasCourtyard, hasGarden, gardenPercentage, setupStep, isComplete)
- الحقول الجديدة كلها optional — التوافق مع البيانات القديمة مضمون

### 4. تحديث FinishingItem create/update procedures
عدّل الملفات:
- `packages/api/modules/quantities/procedures/finishing-item-create.ts`
- `packages/api/modules/quantities/procedures/finishing-item-update.ts`
أضف الحقول الجديدة (dataSource, sourceItemId, sourceFormula, isEnabled, sortOrder, groupKey, scope) للـ input schema والـ handler.

### 5. تشغيل Prisma
```bash
cd packages/database && pnpm generate && pnpm db:push
```

## الملفات المتأثرة
- `packages/database/prisma/schema.prisma`
- `packages/api/modules/quantities/procedures/building-config-update.ts`
- `packages/api/modules/quantities/procedures/finishing-item-create.ts`
- `packages/api/modules/quantities/procedures/finishing-item-update.ts`
- `apps/web/modules/saas/pricing/lib/smart-building-types.ts` (ملف جديد)

## معايير النجاح
- `pnpm --filter database generate` ينجح بدون أخطاء
- `pnpm --filter database db:push` ينجح
- الأنواع الجديدة في smart-building-types.ts ليس فيها أخطاء TypeScript
- API procedures تقبل الحقول الجديدة
- البيانات القديمة (buildingConfig الحالية) تعمل بدون مشاكل (backward compatible)
```

---

## المرحلة 2: محرك الاشتقاق (Derivation Engine)

```
## المهمة
إنشاء محرك اشتقاق الكميات الذكي — القلب النابض للنظام. يأخذ إعدادات المبنى (SmartBuildingConfig) ويُنتج مصفوفة كاملة من الكميات المحسوبة لكل بند تشطيب ممكن.

## السياق
- الأنواع معرّفة في `apps/web/modules/saas/pricing/lib/smart-building-types.ts` (المرحلة 1)
- الفئات والمجموعات معرّفة في `apps/web/modules/saas/pricing/lib/finishing-categories.ts`
- المحرك يعمل على الـ client side (حساب فوري بدون API call)
- المحرك يجب أن يعمل حتى مع بيانات ناقصة (مثلاً: بدون غرف، بدون فتحات)

## المطلوب

أنشئ ملف `apps/web/modules/saas/pricing/lib/derivation-engine.ts`:

### الدالة الرئيسية
```typescript
export function deriveAllQuantities(
  config: SmartBuildingConfig,
  existingItems?: FinishingItem[]  // البنود الموجودة (للربط العكسي)
): DerivedQuantity[]
```

### منطق الاشتقاق — 26 بند في 15 مجموعة

اتبع خريطة العلاقات التالية بدقة:

#### المجموعة 1: أعمال العزل
**1. العزل المائي** — لكل دور حسب الموقع:
- `waterproofing_foundations`: مساحة دور البدروم (BASEMENT). إذا لا يوجد بدروم = لا يُولّد.
- `waterproofing_bathrooms`: لكل دور فيه حمامات → مجموع مساحات أرضيات الحمامات (طول × عرض). إذا لا توجد غرف = لا يُولّد.
- `waterproofing_roof`: مساحة السطح (ROOF). إذا لا يوجد سطح = مساحة آخر دور UPPER أو GROUND.
- الهدر: 5%

**2. العزل الحراري** — المبنى كاملاً:
- `thermal_walls`: محيط المبنى (buildingPerimeter) × مجموع ارتفاعات الأدوار (مع مراعاة repeatCount). هدر 5%.
- `thermal_roof`: = مساحة العزل المائي للسطح (علاقة تساوي). هدر 5%.

#### المجموعة 2: أعمال اللياسة
**3. لياسة داخلية** — لكل دور:
إذا توجد غرف (rooms):
```
لكل غرفة:
  محيط الغرفة = (length + width) × 2
  مساحة جدران الغرفة = محيط × ارتفاع الدور

مجموع مساحة الجدران = Σ مساحة جدران كل غرفة
+ مساحة الأسقف (مجموع مساحات أرضيات الغرف) — اختياري، افتراضي مضمّن
- خصم الفتحات الداخلية = Σ (عرض × ارتفاع × عدد) لكل فتحة غير خارجية
- خصم جدران الحمامات (المُبلّطة) = مساحة جدران الغرف من نوع 'bathroom'
```
إذا لا توجد غرف (فقط مساحة الدور):
```
تقدير المحيط الداخلي = √(مساحة الدور) × 4 × 1.3 (معامل تصحيح للتقسيم الداخلي)
مساحة الجدران ≈ المحيط المقدّر × ارتفاع الدور
+ مساحة السقف = مساحة الدور
هذا تقديري ← dataSource = 'estimated'
```
- الهدر: 5%
- **مهم:** خزّن في breakdown: مساحة جدران الحمامات المستثناة (bathroom_wall_area) — ستُستخدم لاحقاً

**4. لياسة خارجية** — المبنى كاملاً:
```
مساحة الواجهات = محيط المبنى × مجموع ارتفاعات الأدوار (مع repeatCount)
- خصم الفتحات الخارجية = Σ (عرض × ارتفاع × عدد) لكل فتحة خارجية من كل الأدوار
```
- الهدر: 5%

#### المجموعة 3: أعمال الدهانات
**5. دهان داخلي** — لكل دور:
```
= لياسة داخلية نفس الدور - جدران الحمامات (المُبلّطة من breakdown)
```
- dataSource: `auto_linked` مع sourceItemKey = `internal_plaster_[floorId]`
- الهدر: 10%

**6. دهان واجهات** — خارجي:
```
= لياسة خارجية (علاقة تساوي كامل)
```
- dataSource: `auto_linked` مع sourceItemKey = `external_plaster`
- الهدر: 10%

**7. دهان سور** — خارجي:
```
= محيط الأرض (landPerimeter) × ارتفاع السور (fenceHeight) × 2 (وجهين)
```
- إذا لا يوجد landPerimeter أو fenceHeight → لا يُولّد
- الهدر: 8%

#### المجموعة 4: أعمال الأرضيات
**8. أرضيات** — لكل دور:
إذا توجد غرف:
```
= مجموع مساحات الغرف (طول × عرض)
```
إذا لا توجد غرف:
```
= مساحة الدور (تقديري)
```
- الهدر: 10%

#### المجموعة 5: تكسيات الجدران
**9. تكسيات جدران (حمامات)** — لكل دور:
```
= جدران الحمامات المستثناة من اللياسة (bathroom_wall_area من breakdown)
```
- dataSource: `auto_linked` مع sourceItemKey = `internal_plaster_[floorId]`
- إذا لا توجد حمامات → لا يُولّد
- الهدر: 12%

**تكسيات جدران (مطابخ — سبلاش باك)** — لكل دور:
```
= محيط المطابخ × ارتفاع السبلاش باك (0.6م افتراضي)
```
- إذا لا توجد مطابخ → لا يُولّد
- الهدر: 12%

#### المجموعة 6: الأسقف المستعارة
**10. جبس بورد** — لكل دور:
إذا توجد غرف:
```
= مجموع مساحات الغرف التي hasFalseCeiling = true (أو كلها إذا لم يُحدد)
```
إذا لا توجد غرف:
```
= مساحة الدور (تقديري)
```
- الهدر: 10%

#### المجموعة 7: الأبواب
**11. أبواب داخلية** — المبنى كاملاً:
```
= مجموع عدد الفتحات من نوع 'door' وisExternal = false من كل الأدوار
```
- إذا لا توجد فتحات → لا يُولّد
- الهدر: 0%

**12. أبواب خارجية** — المبنى كاملاً:
```
= مجموع عدد الفتحات من نوع 'door' وisExternal = true من كل الأدوار
```
- الهدر: 0%

#### المجموعة 8: النوافذ
**13. نوافذ ألمنيوم** — المبنى كاملاً:
```
= مجموع (عرض × ارتفاع × عدد) لكل فتحة من نوع 'window' من كل الأدوار
الوحدة: م²
```
- الهدر: 0%

#### المجموعة 9: الأدوات الصحية
**14. تجهيز حمامات** — المبنى كاملاً:
```
= مجموع عدد الغرف من نوع 'bathroom' من كل الأدوار
الوحدة: طقم
```
- إذا لا توجد غرف → لا يُولّد
- الهدر: 0%

**15. مغاسل ورخاميات** — المبنى كاملاً:
```
= عدد الحمامات (من بند 14)
```
- الهدر: 0%

#### المجموعة 10: المطابخ
**16. خزائن وسطح عمل** — المبنى كاملاً:
```
= مجموع محيطات غرف المطابخ ÷ 2 (تقريبي — نصف المحيط للخزائن)
الوحدة: م.ط
```
- إذا لا توجد مطابخ → لا يُولّد
- الهدر: 0%

#### المجموعة 11: الدرج والدرابزين
**17. تكسية درج داخلي** — المبنى كاملاً:
```
= عدد الأدوار فوق الأرضي (UPPER + ANNEX مع repeatCount)
الوحدة: عدد (درج)
```
- إذا دور واحد فقط → لا يُولّد
- الهدر: 5%

**18. تكسية درج خارجي** — خارجي:
```
= 1 (افتراضي — درج مدخل واحد)
```
- الهدر: 5%

**19. درابزين وحواجز** — المبنى كاملاً:
```
تقدير: عدد الأدراج × 4 م.ط (متوسط طول درابزين لكل درج)
```
- الهدر: 5%

#### المجموعة 12: الواجهات
**20. تكسيات واجهات حجرية** — خارجي:
```
= لياسة خارجية (علاقة تساوي — أو نسبة يحددها المستخدم لاحقاً)
```
- dataSource: `auto_linked` مع sourceItemKey = `external_plaster`
- الهدر: 10%

**21. زخارف وديكورات واجهات** — خارجي:
```
لا يُحسب تلقائياً — مقطوعية
```
- isEnabled: false (معطّل افتراضياً)

#### المجموعة 13: الأعمال الخارجية
**22. أرضيات الحوش** — خارجي:
```
= مساحة الأرض - مساحة الدور الأرضي (أو أكبر دور)
```
- إذا لا يوجد حوش (hasCourtyard = false) → لا يُولّد
- الهدر: 8%

**23. بوابات السور** — خارجي:
```
= 1 (افتراضي)
```
- الهدر: 0%

**24. تنسيق حدائق** — خارجي:
```
= أرضيات الحوش × (gardenPercentage / 100)
```
- إذا hasGarden = false → لا يُولّد
- الهدر: 0%

#### المجموعة 14: أعمال السطح
**25. تشطيبات السطح** — خارجي:
```
= مساحة السطح (ROOF) — نفس العزل المائي سطح
```
- الهدر: 5%

#### المجموعة 15: الديكور
**26. ديكورات داخلية** — المبنى كاملاً:
```
لا يُحسب تلقائياً — مقطوعية
```
- isEnabled: false

### الربط العكسي (Reverse Derivation)
أنشئ دالة إضافية:
```typescript
export function deriveFromExistingItems(
  existingItems: FinishingItem[],
  partialConfig: Partial<SmartBuildingConfig>
): DerivedQuantity[]
```

هذه الدالة تأخذ البنود الموجودة (المدخلة يدوياً) وتحاول اشتقاق بنود أخرى منها:
- إذا وجد بند لياسة داخلية يدوي ← يمكن اشتقاق الدهان والأرضيات والأسقف
- إذا وجد بند دهان داخلي يدوي ← يمكن تقدير اللياسة (الدهان + بلاط الحمامات)
- إذا وجد بند أرضيات يدوي ← يمكن تقدير الأسقف المستعارة

### دالة حساب التأثير المتتابع (Cascade)
```typescript
export function calculateCascadeEffects(
  changedItemKey: string,
  newQuantity: number,
  allItems: DerivedQuantity[]
): { itemKey: string; oldQuantity: number; newQuantity: number }[]
```

تُرجع قائمة بكل البنود التي ستتأثر عند تغيير كمية بند معين.

### دالة مساعدة — حساب المحيط من المساحة
```typescript
export function estimatePerimeterFromArea(area: number, wallMultiplier = 1.3): number {
  // المضلع المربع: محيط = 4 × √مساحة
  // المعامل 1.3 يعوض عن التقسيمات الداخلية (الجدران بين الغرف)
  return Math.sqrt(area) * 4 * wallMultiplier;
}
```

## الملفات
- `apps/web/modules/saas/pricing/lib/derivation-engine.ts` (ملف جديد — ~500-700 سطر)

## معايير النجاح
- الدالة deriveAllQuantities تعمل مع buildingConfig كامل → تُنتج ~30-45 بند (حسب عدد الأدوار والغرف)
- تعمل مع buildingConfig ناقص (فقط مساحات الأدوار بدون غرف) → تُنتج بنود تقديرية
- تعمل مع buildingConfig فارغ → تُرجع مصفوفة فارغة
- كل بند لديه sourceDescription واضح ومقروء بالعربية
- العلاقات بين البنود صحيحة:
  - دهان داخلي = لياسة داخلية - حمامات ✓
  - دهان واجهات = لياسة خارجية ✓
  - عزل حراري سطح = عزل مائي سطح ✓
  - أرضيات حوش = أرض - مبنى ✓
- لا أخطاء TypeScript
```

---

## المرحلة 3: ويزارد إعداد المبنى (Building Setup Wizard)

```
## المهمة
إنشاء مساعد إعداد المبنى بأربع خطوات — يظهر كـ full-page wizard بدلاً من بطاقة BuildingConfigPanel الحالية. مع إمكانية تجاوزه كلياً.

## السياق
- الويزارد الحالي: `BuildingConfigPanel.tsx` — بطاقة بسيطة في أعلى الصفحة
- الأنواع: `smart-building-types.ts` من المرحلة 1
- المسار: `/app/[organizationSlug]/pricing/studies/[studyId]/finishing`
- الـ API: `pricing.studies.buildingConfig.update`
- لغة الواجهة: عربية أولاً (RTL) مع دعم إنجليزي عبر next-intl

## المطلوب

### 1. مكون الويزارد الرئيسي
أنشئ `apps/web/modules/saas/pricing/components/finishing/BuildingSetupWizard.tsx`:

- **4 خطوات** مع شريط تقدم (stepper) أفقي في الأعلى
- زر "التالي" و "السابق" و "تخطي الإعداد" (يذهب مباشرة لصفحة الكميات)
- كل خطوة تحفظ بياناتها عند الانتقال للخطوة التالية (auto-save)
- يمكن العودة لأي خطوة سابقة

#### الخطوة 1: هيكل المبنى (BuildingStructureStep)
نفس الواجهة الحالية مع تحسينات:
- مساحة الأرض الإجمالية (م²)
- محيط المبنى (م.ط) — مع tooltip: "مجموع أطوال الأضلاع الخارجية للمبنى"
- إضافة الأدوار: أزرار سريعة (+ بدروم | + أرضي | + دور علوي | + ملحق | + سطح | + ميزانين)
- لكل دور: [اسم الدور] [المساحة م²] [الارتفاع م] [toggle تكرار] [عدد التكرار إذا مفعّل]
- حذف الدور
- **جديد:** ملخص مُحسوب في الأسفل: "إجمالي مساحة البناء: X م² | عدد الأدوار: Y | الارتفاع الكلي: Z م"

#### الخطوة 2: تفاصيل الأدوار (FloorDetailsStep)
لكل دور (tabs أو accordion):

**قسم الغرف:**
- جدول سريع: [اسم الغرفة] [النوع ▼] [الطول م] [العرض م] [المساحة — محسوبة]
- أزرار إضافة سريعة: (+ غرفة نوم | + صالة | + مجلس | + مطبخ | + حمام | + ممر)
- كل زر يضيف صف جاهز بالاسم والنوع
- Enter في آخر حقل ← إضافة صف جديد
- Tab للانتقال بين الحقول
- ملخص: "عدد الغرف: X | المساحة المحسوبة: Y م² | الفرق عن مساحة الدور: Z م²"
- **زر "نسخ غرف من دور آخر" ▼** ← dropdown بالأدوار الأخرى

**قسم الفتحات:**
- جدول: [النوع: باب/نافذة ▼] [النوع الفرعي ▼] [العرض م] [الارتفاع م] [العدد] [خارجية ☐]
- أزرار إضافة: (+ باب عادي | + باب حمام | + باب رئيسي | + نافذة كبيرة | + نافذة متوسطة | + نافذة صغيرة)
- كل زر يملأ الأبعاد الافتراضية تلقائياً
- ملخص: "أبواب: X | نوافذ: Y | مساحة الفتحات: Z م²"
- **زر "نسخ فتحات من دور آخر" ▼**

**هذه الخطوة اختيارية — يمكن تجاوزها بزر "تخطي التفاصيل"**

#### الخطوة 3: الخارجي (ExteriorStep)
- محيط الأرض (م.ط) — اختياري
- ارتفاع السور (م) — افتراضي 3.0
- ☑ يوجد حوش ← يحسب ويعرض: "مساحة الحوش = X م²"
- ☑ يوجد حديقة ← شريط تمرير: نسبة الحديقة من الحوش (0-100%)
- **هذه الخطوة اختيارية بالكامل**

#### الخطوة 4: المراجعة والتوليد (ReviewStep)
ملخص بصري للمبنى:
```
┌──────────────────────────────────────────────┐
│  ملخص المبنى                                 │
│                                              │
│  المساحات          │  التفاصيل               │
│  مساحة الأرض: 1000 │  الأدوار: 3 + سطح      │
│  مساحة البناء: 1700│  الغرف: 18 غرفة         │
│  مساحة الحوش: 350  │  الحمامات: 6            │
│                    │  المطابخ: 2              │
│  الارتفاعات       │  الأبواب: 24             │
│  الارتفاع الكلي: 9.4│ النوافذ: 18            │
│  ارتفاع السور: 3.0 │                         │
│                                              │
│  📊 سيتم حساب ~38 بند تشطيب تلقائياً         │
│                                              │
│  [← السابق]        [توليد الكميات →]          │
└──────────────────────────────────────────────┘
```

زر "توليد الكميات" يحفظ الإعدادات ويستدعي deriveAllQuantities ثم ينتقل للوحة الكميات.

### 2. حالة الويزارد
استخدم React state محلي + حفظ تلقائي عند كل خطوة عبر `pricing.studies.buildingConfig.update`.

### 3. نقطة الدخول
في ملف الصفحة الرئيسية (`FinishingItemsEditor.tsx`):
- إذا `buildingConfig` فارغ أو `isComplete !== true` → أعرض الويزارد
- مع زر "تخطي الإعداد — أريد إدخال بنود يدوياً" في الأعلى
- إذا `buildingConfig.isComplete === true` → أعرض لوحة الكميات (المرحلة 4)
- مع زر "تعديل إعدادات المبنى" يفتح الويزارد من جديد

### 4. مفاتيح الترجمة
أضف مفاتيح الترجمة في:
- `apps/web/messages/ar/pricing.json`
- `apps/web/messages/en/pricing.json`

تحت مفتاح `pricing.finishing.wizard`:
```json
{
  "wizard": {
    "title": "إعداد المبنى",
    "step1Title": "هيكل المبنى",
    "step2Title": "تفاصيل الأدوار",
    "step3Title": "الخارجي",
    "step4Title": "المراجعة والتوليد",
    "skip": "تخطي — أريد إدخال يدوياً",
    "skipDetails": "تخطي التفاصيل",
    "next": "التالي",
    "previous": "السابق",
    "generate": "توليد الكميات",
    "copyFromFloor": "نسخ من دور آخر",
    "addRoom": "إضافة غرفة",
    "addOpening": "إضافة فتحة",
    "totalBuildingArea": "إجمالي مساحة البناء",
    "floorCount": "عدد الأدوار",
    "totalHeight": "الارتفاع الكلي",
    "roomCount": "عدد الغرف",
    "bathroomCount": "عدد الحمامات",
    "openingCount": "عدد الفتحات",
    "courtyardArea": "مساحة الحوش",
    "willGenerate": "سيتم حساب {count} بند تشطيب تلقائياً",
    "editConfig": "تعديل إعدادات المبنى",
    "roomTypes": {
      "bedroom": "غرفة نوم",
      "living": "صالة",
      "majlis": "مجلس",
      "kitchen": "مطبخ",
      "bathroom": "حمام",
      "hall": "صالة طعام",
      "corridor": "ممر",
      "storage": "مخزن",
      "laundry": "مغسلة",
      "maid_room": "غرفة خادمة",
      "other": "أخرى"
    }
  }
}
```

## الملفات
- `apps/web/modules/saas/pricing/components/finishing/BuildingSetupWizard.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/wizard/BuildingStructureStep.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/wizard/FloorDetailsStep.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/wizard/ExteriorStep.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/wizard/ReviewStep.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/FinishingItemsEditor.tsx` (تعديل — نقطة الدخول)
- `apps/web/messages/ar/pricing.json` (تعديل)
- `apps/web/messages/en/pricing.json` (تعديل)

## أنماط التصميم
- استخدم shadcn/ui: Card, Button, Input, Select, Tabs, Badge, Tooltip, Switch
- Tailwind CSS 4 + RTL (dir="rtl")
- IBM Plex Sans Arabic font
- الألوان: متوافقة مع theme الحالي

## معايير النجاح
- الويزارد يعمل بالكامل مع 4 خطوات
- الحفظ التلقائي عند كل خطوة
- زر التخطي يعمل ويوصل لصفحة الكميات مباشرة
- نسخ الغرف والفتحات بين الأدوار يعمل
- الملخص في الخطوة 4 دقيق
- زر "توليد الكميات" يستدعي derivation engine ويحفظ البنود
- لا أخطاء TypeScript أو console errors
```

---

## المرحلة 4: لوحة الكميات (Quantities Dashboard)

```
## المهمة
إنشاء لوحة الكميات الرئيسية — الواجهة التي تعرض كل البنود المحسوبة والمدخلة يدوياً في جدول موحد مع إمكانية التعديل inline.

## السياق
- الكميات المحسوبة تأتي من `deriveAllQuantities()` (المرحلة 2)
- البنود المحفوظة تأتي من `FinishingItem` في قاعدة البيانات
- هذا القسم لحساب الكميات فقط — بدون تسعير
- يجب دمج البنود المحسوبة مع المحفوظة: البنود المحفوظة لها أولوية

## المطلوب

### 1. مكون لوحة الكميات الرئيسي
أنشئ `apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx`:

#### الشريط العلوي (BuildingSummaryBar)
شريط مضغوط يعرض ملخص المبنى:
```
مساحة البناء: 1,700 م² | الأدوار: 3 + سطح | الحمامات: 6 | الحوش: 350 م² [تعديل الإعدادات]
```
- إذا لا يوجد إعدادات مبنى: "لم تُعدّ إعدادات المبنى — [إعداد المبنى] أو أضف بنداً يدوياً"

#### شريط التصفية والأدوات
- تبويبات أفقية: (الكل | عزل | لياسة | دهان | أرضيات | جدران | أسقف | أبواب ونوافذ | صحية | مطابخ | درج | واجهات | خارجي | سطح | ديكور)
- فلتر: (الكل | محسوب تلقائي | يدوي | تقديري | معطّل)
- بحث نصي
- إحصائيات: "إجمالي البنود: X | مفعّل: Y | معطّل: Z"
- زر "+ إضافة بند يدوي"

#### الجدول الرئيسي (QuantitiesTable)
جدول واحد لكل المجموعات (مفصول بصفوف عناوين المجموعات):

```
┌────┬──────────────────────┬─────────┬──────────┬────────┬─────────┬──────────┬──────────┐
│ ✓  │ البند                │ الدور   │ الكمية   │ الوحدة │ الهدر%  │ الكمية   │ المصدر   │
│    │                      │         │ الصافية  │        │         │ الفعلية  │          │
├────┴──────────────────────┴─────────┴──────────┴────────┴─────────┴──────────┴──────────┤
│ 🛡️ أعمال العزل                                                                         │
├────┬──────────────────────┬─────────┬──────────┬────────┬─────────┬──────────┬──────────┤
│ ☑  │ عزل مائي — أساسات    │ بدروم   │ 300      │ م²    │ 5%     │ 315      │ 🔗 تلقائي│
│ ☑  │ عزل مائي — حمامات    │ أرضي   │ 9        │ م²    │ 5%     │ 9.5      │ 🔗 تلقائي│
│ ☑  │ عزل مائي — حمامات    │ أول    │ 9        │ م²    │ 5%     │ 9.5      │ 🔗 تلقائي│
│ ☑  │ عزل مائي — سطح       │ سطح    │ 300      │ م²    │ 5%     │ 315      │ 🔗 تلقائي│
│ ☑  │ عزل حراري — جدران    │ واجهات │ 470      │ م²    │ 5%     │ 494      │ 🔗 تلقائي│
│ ☑  │ عزل حراري — سطح      │ سطح    │ 300      │ م²    │ 5%     │ 315      │ 🔗 مشتق │
├────┴──────────────────────┴─────────┴──────────┴────────┴─────────┴──────────┴──────────┤
│ 🪣 أعمال اللياسة                                                                       │
├────┬──────────────────────┬─────────┬──────────┬────────┬─────────┬──────────┬──────────┤
│ ☑  │ لياسة داخلية         │ أرضي   │ 657      │ م²    │ 5%     │ 690      │ 🔗 تلقائي│
│ ...│                      │        │          │        │         │          │          │
```

#### سلوك التشيك بوكس
- ☑ مفعّل: البند يُحسب في الإجمالي
- ☐ معطّل: البند يبقى مرئياً بلون خافت، لا يُحسب
- تغيير الحالة يحفظ تلقائياً (isEnabled)

#### سلوك الضغط على صف (Inline Expansion)
عند الضغط على صف بند، يتوسع لأسفل (ليس dialog) ليعرض:

**للبنود التلقائية (auto_building / auto_linked / auto_derived):**
```
┌──────────────────────────────────────────────────────────────────┐
│ لياسة داخلية — الدور الأرضي                        🔗 تلقائي    │
│                                                                  │
│ تفاصيل الحساب:                                                   │
│ ─────────────                                                    │
│ الغرف: مجلس (88م²) + صالة (96م²) + غ.نوم1 (64م²) +            │
│        غ.نوم2 (60م²) + مطبخ (52م²) + حمام1 (36م²) +            │
│        حمام2 (28م²) + ممر (49.6م²)                               │
│ إجمالي مساحة الجدران: 473.6 م²                                   │
│ + الأسقف: +300.0 م²                                              │
│ - الفتحات (14 فتحة): -52.4 م²                                    │
│ - جدران حمامات مُبلّطة: -64.0 م²                                 │
│ ═══════════════════════                                           │
│ الصافي: 657.2 م²                                                 │
│                                                                  │
│ 🔗 يُغذّي: دهان داخلي (أرضي)، بلاط جدران حمامات (أرضي)          │
│ 🔗 يعتمد على: إعدادات المبنى (الأرضي)                            │
│                                                                  │
│ [✏️ تعديل يدوي]  [↺ إعادة حساب]                                  │
└──────────────────────────────────────────────────────────────────┘
```

**للبنود اليدوية:**
يعرض نموذج الإدخال المناسب حسب طريقة الحساب (DIRECT_AREA, WALL_DEDUCTION, ROOM_BY_ROOM, PER_UNIT, LINEAR, LUMP_SUM) — استخدم مكونات الآلات الحاسبة الموجودة:
- `DirectAreaCalculator.tsx`
- `WallDeductionCalculator.tsx`
- `RoomByRoomCalculator.tsx`
- `PerUnitCalculator.tsx`
- `LinearCalculator.tsx`
- `LumpSumCalculator.tsx`

#### زر "تعديل يدوي" على بند تلقائي
1. تظهر رسالة تأكيد: "ستتحول الكمية لإدخال يدوي. يمكنك العودة للحساب التلقائي لاحقاً."
2. يتحول البند لـ `dataSource: 'manual'`
3. يظهر حقل لإدخال الكمية الجديدة
4. يظهر زر "↺ إعادة للتلقائي" بشكل دائم

#### زر "+ إضافة بند يدوي"
يفتح dropdown بالفئات المتاحة → يختار الفئة → يظهر صف جديد → يختار الدور (إذا per_floor) → يدخل الكمية يدوياً.

### 2. Merge Logic (دمج المحسوب مع المحفوظ)
أنشئ `apps/web/modules/saas/pricing/lib/merge-quantities.ts`:

```typescript
export function mergeQuantities(
  derived: DerivedQuantity[],    // من المحرك
  saved: FinishingItem[]         // من قاعدة البيانات
): MergedQuantityItem[]
```

قواعد الدمج:
- إذا البند موجود في saved و derived: استخدم saved (المستخدم عدّل يدوياً)
- إذا البند موجود في derived فقط: أضفه كبند جديد (غير محفوظ بعد)
- إذا البند موجود في saved فقط: أبقه (بند يدوي)
- المطابقة بين derived و saved: عبر `category + subCategory + floorId + scope`

### 3. Auto-save (حفظ تلقائي)
عند أي تغيير (تفعيل/تعطيل، تعديل كمية، إضافة بند):
- debounce 1 ثانية
- إذا البند جديد (من derived غير محفوظ): create via API
- إذا البند موجود: update via API
- toast notification صغير: "تم الحفظ"

### 4. تحديث FinishingItemsEditor.tsx
عدّل نقطة الدخول الرئيسية:
```
if (!buildingConfig || !buildingConfig.isComplete) {
  // أعرض الويزارد مع زر تخطي
  return <BuildingSetupWizard onComplete={...} onSkip={...} />
}
// أعرض لوحة الكميات
return <QuantitiesDashboard config={buildingConfig} items={existingItems} />
```

إذا المستخدم ضغط "تخطي":
```
// أعرض لوحة الكميات بدون بنود تلقائية (كلها فارغة)
return <QuantitiesDashboard config={null} items={existingItems} />
```

## الملفات
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/BuildingSummaryBar.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesTable.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/QuantityRowExpanded.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/ManualItemAdder.tsx` (جديد)
- `apps/web/modules/saas/pricing/lib/merge-quantities.ts` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/FinishingItemsEditor.tsx` (تعديل)
- `apps/web/messages/ar/pricing.json` (تعديل)
- `apps/web/messages/en/pricing.json` (تعديل)

## معايير النجاح
- الجدول يعرض كل البنود المحسوبة + اليدوية
- التبويبات والفلتر يعملان
- الضغط على صف يتوسع inline بتفاصيل الحساب
- التشيك بوكس يفعّل/يعطّل البند مع حفظ تلقائي
- "تعديل يدوي" يحوّل البند لإدخال يدوي مع زر العودة
- إضافة بند يدوي يعمل
- الحفظ التلقائي يعمل بدون أخطاء
- الأداء جيد (لا lag مع 40+ صف)
```

---

## المرحلة 5: الربط العكسي والذاكرة التراكمية

```
## المهمة
تنفيذ نظام "الذاكرة التراكمية" — عندما يدخل المستخدم بيانات في بند واحد (يدوياً)، يحفظها النظام في إعدادات المبنى ويستفيد منها في بنود أخرى.

## السياق
- المستخدم قد يتجاوز الويزارد ويدخل بند واحد يدوياً
- عند إدخال لياسة داخلية مثلاً (مع غرف وفتحات)، هذه البيانات يمكن حفظها في buildingConfig
- عند الذهاب لبند آخر لنفس الدور، يجد البيانات جاهزة

## المطلوب

### 1. دالة استخلاص المعرفة من البنود
أنشئ في `apps/web/modules/saas/pricing/lib/knowledge-extractor.ts`:

```typescript
/**
 * يستخلص بيانات المبنى من بند تشطيب مُدخل يدوياً
 * ويحدّث إعدادات المبنى (buildingConfig) تلقائياً
 */
export function extractKnowledgeFromItem(
  item: FinishingItem,
  currentConfig: SmartBuildingConfig | null
): {
  updatedConfig: Partial<SmartBuildingConfig>;
  newDerivedItems: DerivedQuantity[];  // بنود يمكن حسابها الآن
  notification: string;                // رسالة للمستخدم
} | null
```

#### سيناريوهات الاستخلاص:

**من بند لياسة داخلية (calculationMethod = WALL_DEDUCTION مع calculationData يحتوي rooms و openings):**
- استخلص الغرف → حدّث `config.floors[floorId].rooms`
- استخلص الفتحات → حدّث `config.floors[floorId].openings`
- اشتق: أرضيات، أسقف مستعارة، دهان داخلي، بلاط حمامات

**من بند أرضيات (calculationMethod = ROOM_BY_ROOM مع calculationData يحتوي rooms):**
- استخلص الغرف → حدّث `config.floors[floorId].rooms` (إذا لم تكن موجودة)
- اشتق: أسقف مستعارة، تقدير لياسة

**من بند دهان داخلي (مع كمية يدوية):**
- إذا يوجد بلاط جدران حمامات لنفس الدور:
  - لياسة داخلية ≈ دهان + بلاط حمامات
  - اشتق: لياسة داخلية

**من بند لياسة خارجية (calculationMethod = WALL_DEDUCTION):**
- إذا الكمية مُحسوبة من محيط × ارتفاع:
  - يمكن استنتاج أو تأكيد: محيط المبنى، مجموع الارتفاعات
  - اشتق: دهان واجهات، واجهات حجرية، عزل حراري جدران

### 2. واجهة الإشعار
بعد حفظ بند يدوي يحتوي بيانات قابلة للاستخلاص:

```
┌──────────────────────────────────────────────────────┐
│ 💡 تم حفظ بيانات الغرف للدور الأرضي                  │
│                                                      │
│ يمكن حساب 4 بنود إضافية تلقائياً:                    │
│ • أرضيات الأرضي (300 م²)                             │
│ • أسقف مستعارة الأرضي (300 م²)                       │
│ • دهان داخلي الأرضي (593 م²)                         │
│ • بلاط جدران حمامات الأرضي (64 م²)                   │
│                                                      │
│ [حساب تلقائي]  [لا شكراً]                            │
└──────────────────────────────────────────────────────┘
```

### 3. تكامل مع QuantitiesDashboard
في `QuantitiesDashboard.tsx`:
- بعد حفظ أي بند يدوي، استدعِ `extractKnowledgeFromItem`
- إذا أرجع بنود جديدة، أعرض الإشعار
- إذا المستخدم وافق، أضف البنود للجدول وحدّث buildingConfig

### 4. تكامل مع الويزارد
إذا المستخدم دخل بيانات يدوياً أولاً ثم قرر فتح الويزارد:
- الويزارد يجد إعدادات المبنى مُحدّثة (من الاستخلاص)
- الغرف والفتحات المستخلصة تظهر جاهزة
- المستخدم يكمل ما ينقص فقط

## الملفات
- `apps/web/modules/saas/pricing/lib/knowledge-extractor.ts` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/KnowledgeNotification.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx` (تعديل)

## معايير النجاح
- إدخال لياسة داخلية يدوياً (مع غرف) → يعرض إشعار بالبنود المشتقة
- الموافقة على الاشتقاق → البنود تُضاف للجدول
- فتح الويزارد بعد الإدخال اليدوي → الغرف تظهر جاهزة
- الاستخلاص لا يكتب فوق بيانات موجودة (يُضيف فقط ما ينقص)
```

---

## المرحلة 6: تحديث سلسلة التأثير (Cascade Updates)

```
## المهمة
تنفيذ التحديث التتابعي — عند تغيير أي قيمة (في إعدادات المبنى أو في بند)، تنتشر التغييرات تلقائياً لكل البنود المتأثرة.

## السياق
- تغيير مساحة دور في الإعدادات → يؤثر على 5-10 بنود
- تغيير كمية لياسة داخلية → يؤثر على الدهان وبلاط الحمامات
- البنود اليدوية (manual) لا تتأثر بالتغييرات

## المطلوب

### 1. تحديث عند تغيير إعدادات المبنى
في `BuildingSetupWizard.tsx` عند الحفظ:
1. أعد حساب `deriveAllQuantities(newConfig)`
2. قارن مع البنود الحالية
3. للبنود التلقائية (auto_*): حدّث الكميات
4. للبنود اليدوية (manual): لا تمس
5. أعرض ملخص التغييرات:

```
┌──────────────────────────────────────────────────────┐
│ تم تحديث إعدادات المبنى                              │
│                                                      │
│ البنود المتأثرة (8 بنود):                            │
│ • أرضيات أرضي: 300 → 350 م²                         │
│ • أسقف مستعارة أرضي: 300 → 350 م²                   │
│ • لياسة داخلية أرضي: 657 → 720 م²                   │
│ • دهان داخلي أرضي: 593 → 656 م²                     │
│ • أرضيات حوش: 325 → 275 م²                          │
│ • ...                                                │
│                                                      │
│ ⚠️ بنود لم تتأثر (يدوية): 2                          │
│                                                      │
│ [تم]                                                 │
└──────────────────────────────────────────────────────┘
```

### 2. تحديث عند تعديل كمية بند
في `QuantitiesTable.tsx` عند تعديل كمية بند:
1. استدعِ `calculateCascadeEffects(changedItemKey, newQuantity, allItems)`
2. إذا هناك بنود متأثرة:
   - حدّثها تلقائياً
   - أعرض toast: "تم تحديث 3 بنود مرتبطة"

### 3. مؤشر البنود المرتبطة
في الصف المُوسّع لكل بند، أعرض:
- "🔗 يُغذّي:" + قائمة البنود المعتمدة على هذا البند
- "🔗 يعتمد على:" + قائمة البنود التي يعتمد عليها هذا البند

### 4. حماية البنود اليدوية
عند محاولة التحديث التلقائي لبند يدوي:
- لا تحدّث الكمية
- أعرض badge صغير: "⚠️ قد تكون الكمية قديمة" بجانب البند
- عند الضغط: "الكمية اليدوية (X م²) قد لا تتوافق مع القيمة المحسوبة (Y م²). [تحديث للتلقائي]"

## الملفات
- `apps/web/modules/saas/pricing/lib/derivation-engine.ts` (تعديل — إضافة calculateCascadeEffects)
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx` (تعديل)
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesTable.tsx` (تعديل)
- `apps/web/modules/saas/pricing/components/finishing/CascadeNotification.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/BuildingSetupWizard.tsx` (تعديل)

## معايير النجاح
- تغيير مساحة دور في الويزارد → كل البنود المرتبطة تتحدث + إشعار
- تعديل كمية لياسة → الدهان يتحدث تلقائياً
- البنود اليدوية لا تتغير مع ظهور تحذير
- زر "↺ إعادة للتلقائي" يعمل ويحدّث الكمية
- لا circular dependencies (حلقات لا نهائية)
```

---

## المرحلة 7: التنظيف والتكامل النهائي

```
## المهمة
تنظيف الكود، إزالة المكونات القديمة غير المستخدمة، وضمان التكامل الكامل بين كل الأجزاء.

## المطلوب

### 1. إزالة/تحديث المكونات القديمة
هذه المكونات كانت في النظام القديم وقد تم استبدالها:
- لا تحذفها بل ضعها في مجلد `_deprecated/` (للرجوع إليها لاحقاً إن لزم)
- المكونات القديمة:
  - `FinishingGroupSection.tsx` ← استُبدل بـ QuantitiesTable
  - `FinishingCategoryCard.tsx` ← استُبدل
  - `QuickAddTemplates.tsx` ← استُبدل بالويزارد + محرك الاشتقاق
  - `FloorSelector.tsx` ← مُدمج في الواجهة الجديدة
  - `AddEditFinishingItemDialog.tsx` ← استُبدل بـ inline expansion
  - الـ dialogs المتخصصة (PlasterItemDialog, WaterproofingItemDialog, ThermalInsulationItemDialog) ← أبقها لأنها تحتوي منطق خاص

### 2. تحديث BuildingConfigPanel.tsx
- بدلاً من عرض بطاقة الإعدادات، أعرض `BuildingSummaryBar` مع زر "تعديل"
- الضغط على "تعديل" يفتح الويزارد

### 3. اختبار السيناريوهات الكاملة

**سيناريو 1: مشروع كامل عبر الويزارد**
1. فتح دراسة تكلفة جديدة → التشطيبات
2. ملء الويزارد (4 خطوات)
3. توليد الكميات → ظهور ~35 بند
4. تعديل بعض البنود يدوياً
5. تعطيل بعض البنود
6. تعديل إعدادات المبنى → التحقق من التحديث التتابعي

**سيناريو 2: بند واحد يدوي**
1. فتح دراسة تكلفة → التشطيبات → تخطي الويزارد
2. إضافة بند لياسة داخلية يدوياً (مع غرف وفتحات)
3. ظهور إشعار الاستخلاص → الموافقة
4. التحقق من ظهور بنود مشتقة (دهان، أرضيات، أسقف)

**سيناريو 3: التوافق مع البيانات القديمة**
1. فتح دراسة تكلفة موجودة (فيها بنود قديمة)
2. التحقق من عرض البنود القديمة بشكل صحيح
3. التحقق من أن buildingConfig القديم (بدون rooms/openings) يعمل

### 4. تحسين الأداء
- React.memo للصفوف التي لا تتغير
- useMemo للحسابات المكلفة (deriveAllQuantities)
- Virtualization إذا الجدول أكثر من 50 صف (react-window أو مكافئ)
- debounce على auto-save

### 5. تحديث مفاتيح الترجمة النهائية
تأكد من أن كل النصوص العربية والإنجليزية موجودة ومتسقة.

## معايير النجاح
- كل السيناريوهات الثلاثة تعمل بدون أخطاء
- لا console errors
- لا TypeScript errors
- الأداء سلس (لا lag ملحوظ)
- التوافق مع البيانات القديمة مضمون
- الترجمة كاملة (عربي + إنجليزي)
```

---

## ملاحظات عامة لكل المراحل

```
## قواعد عامة يجب اتباعها في كل المراحل

### الأنماط المتبعة
- ORPC: protectedProcedure مع organizationId
- React Query: useSuspenseQuery / useMutation مع invalidateQueries
- Forms: react-hook-form + zod + @hookform/resolvers
- الترجمة: next-intl مع useTranslations
- UI: shadcn/ui + Tailwind CSS 4 + RTL
- الأيقونات: lucide-react
- الإشعارات: sonner (toast)

### أنماط التسمية
- مكونات React: PascalCase (.tsx)
- ملفات lib: camelCase أو kebab-case (.ts)
- API procedures: kebab-case (.ts)
- مفاتيح الترجمة: camelCase متداخل

### المسارات المهمة
- المكونات: `apps/web/modules/saas/pricing/components/finishing/`
- المكتبات: `apps/web/modules/saas/pricing/lib/`
- API: `packages/api/modules/quantities/`
- Schema: `packages/database/prisma/schema.prisma`
- الترجمة: `apps/web/messages/{ar,en}/pricing.json`

### الأمان
- كل API procedure يتحقق من organizationId
- لا direct database access من المكونات
- Zod validation على كل input

### قاعدة البيانات
- buildingConfig هو Json? (JsonB) — لا حاجة لـ migration
- FinishingItem الحقول الجديدة: تحتاج `pnpm --filter database db:push`
- الحقول الجديدة كلها nullable أو لها default — backward compatible
```
