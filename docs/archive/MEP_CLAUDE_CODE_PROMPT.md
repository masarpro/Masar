# برومبت تنفيذ قسم الأعمال الكهروميكانيكية (MEP) — منصة مسار
# Claude Code Implementation Prompt — Multi-Phase

> **تنبيه:** هذا برومبت متعدد المراحل. نفّذ كل مرحلة بالترتيب. لا تنتقل للمرحلة التالية إلا بعد إكمال الحالية.
> **المشروع:** Masar — `masarpro/Masar` monorepo
> **الأدوات:** Next.js 16, React 19, TypeScript, Prisma 7, ORPC, Tailwind CSS 4, shadcn/ui
> **اللغة:** Arabic-first (RTL) + English

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 1: تحديث Schema وإكمال CRUD
# Phase 1: Schema Update & Complete CRUD
# ═══════════════════════════════════════════════════════════════

## السياق

نظام دراسات التكلفة في مسار يحتوي على 4 أقسام: إنشائي (مكتمل)، تشطيبات (مكتمل بمحرك اشتقاق ذكي)، كهروميكانيكي MEP (هيكل فارغ)، وعمالة.

قسم التشطيبات يحتوي على `buildingConfig` (JSON field في CostStudy) يُخزن فيه: الطوابق، الغرف (نوعها، أبعادها)، الحمامات، المطابخ، الممرات، العناصر الخارجية. هذه البيانات هي **مصدر بيانات MEP**.

نموذج MEPItem الحالي ضعيف جداً (8 حقول فقط). نحتاج توسيعه ليتوافق مع نمط FinishingItem.

## المرحلة 1.1: تحديث Schema

**الملف:** `packages/database/prisma/schema.prisma`

ابحث عن model MEPItem الحالي (يحتوي على: id, costStudyId, category, itemType, name, quantity, unit, unitPrice, totalCost) واستبدله بالنموذج المحسن التالي.

**مهم:** لا تغير أي model آخر. لا تغير العلاقة مع CostStudy. فقط وسّع MEPItem.

```prisma
model MEPItem {
  id              String   @id @default(cuid())
  costStudyId     String
  costStudy       CostStudy @relation(fields: [costStudyId], references: [id], onDelete: Cascade)

  // ─── التصنيف (Classification) ───
  category        String    // ELECTRICAL | PLUMBING | HVAC | FIREFIGHTING | LOW_CURRENT | SPECIAL
  subCategory     String    @default("general") // lighting | power_outlets | cables | panels | earthing | emergency | water_supply | drainage | pipes | tanks | pumps | heaters | manholes | fixtures | ac_units | refrigerant | ductwork | diffusers | ventilation | condensate | alarm | sprinklers | hose_cabinets | extinguishers | fire_pumps | fire_tank | network | cctv | intercom | sound | access | elevator | generator | solar | gas | lightning_protection
  itemType        String?   // spot_light | chandelier | led_panel | outlet_13a | outlet_20a | outlet_32a | split_ac | cassette_ac | ppr_pipe | pvc_pipe | etc
  name            String

  // ─── الموقع (Location) ───
  floorId         String?
  floorName       String?
  roomId          String?
  roomName        String?
  scope           String    @default("per_room") // per_room | per_floor | per_building | external

  // ─── الكميات والأبعاد (Quantities) ───
  quantity        Decimal   @default(0) @db.Decimal(15, 2)
  unit            String    @default("عدد")
  length          Decimal?  @db.Decimal(15, 2)
  area            Decimal?  @db.Decimal(15, 2)

  // ─── الحساب الذكي (Smart Calculation) ───
  calculationMethod  String   @default("manual") // auto_derived | manual | estimated
  calculationData    Json?
  dataSource         String   @default("manual") // auto | manual | estimated
  sourceFormula      String?
  groupKey           String?

  // ─── المواصفات (Specifications) ───
  specifications  String?
  specData        Json?
  qualityLevel    String?   // economy | standard | premium

  // ─── التكاليف (Costs) ───
  materialPrice   Decimal   @default(0) @db.Decimal(15, 2)
  laborPrice      Decimal   @default(0) @db.Decimal(15, 2)
  wastagePercent  Decimal   @default(10) @db.Decimal(5, 2)
  materialCost    Decimal   @default(0) @db.Decimal(15, 2)
  laborCost       Decimal   @default(0) @db.Decimal(15, 2)
  unitPrice       Decimal   @default(0) @db.Decimal(15, 2)
  totalCost       Decimal   @default(0) @db.Decimal(15, 2)

  // ─── التحكم (Control) ───
  sortOrder       Int       @default(0)
  isEnabled       Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([costStudyId])
  @@index([costStudyId, category])
  @@index([costStudyId, dataSource])
}
```

بعد التعديل نفّذ:
```bash
pnpm --filter database db:push
```

ثم تحقق أن الـ generate يعمل:
```bash
pnpm --filter database generate
```

إذا ظهر خطأ `Prisma is not defined` في `packages/database/prisma/zod/index.ts`، شغّل السكريبت:
```bash
node packages/database/prisma/fix-zod-decimal.mjs
```

**معايير النجاح:**
- `db:push` ينجح بدون أخطاء
- `generate` ينتج Prisma Client بدون أخطاء
- الحقول الجديدة موجودة في قاعدة البيانات

---

## المرحلة 1.2: تحديث queries في cost-studies.ts

**الملف:** `packages/database/prisma/queries/cost-studies.ts`

### 1.2.1 — إضافة دالة updateMEPItem

ابحث عن الدوال الموجودة المتعلقة بـ MEP (مثل createMEPItem, createMEPItems) وأضف بجوارها:

```typescript
export async function updateMEPItem(
  id: string,
  costStudyId: string,
  data: {
    category?: string;
    subCategory?: string;
    itemType?: string;
    name?: string;
    floorId?: string | null;
    floorName?: string | null;
    roomId?: string | null;
    roomName?: string | null;
    scope?: string;
    quantity?: number;
    unit?: string;
    length?: number | null;
    area?: number | null;
    calculationMethod?: string;
    calculationData?: any;
    dataSource?: string;
    sourceFormula?: string | null;
    groupKey?: string | null;
    specifications?: string | null;
    specData?: any;
    qualityLevel?: string | null;
    materialPrice?: number;
    laborPrice?: number;
    wastagePercent?: number;
    isEnabled?: boolean;
    sortOrder?: number;
  }
) {
  // حساب التكاليف
  const quantity = data.quantity ?? 0;
  const materialPrice = data.materialPrice ?? 0;
  const laborPrice = data.laborPrice ?? 0;
  const wastagePercent = data.wastagePercent ?? 10;
  const wastageMultiplier = 1 + wastagePercent / 100;

  const materialCost = quantity * materialPrice * wastageMultiplier;
  const laborCost = quantity * laborPrice;
  const unitPrice = materialPrice + laborPrice;
  const totalCost = materialCost + laborCost;

  // إذا عدّل المستخدم بند auto → يتحول لـ manual
  const dataSource = data.dataSource === "auto" && data.quantity !== undefined
    ? "manual"
    : data.dataSource;

  const item = await db.mEPItem.update({
    where: { id },
    data: {
      ...data,
      dataSource: dataSource ?? undefined,
      materialCost,
      laborCost,
      unitPrice,
      totalCost,
    },
  });

  await recalculateCostStudyTotals(costStudyId);
  return item;
}
```

### 1.2.2 — إضافة دالة deleteMEPItem

```typescript
export async function deleteMEPItem(id: string, costStudyId: string) {
  const item = await db.mEPItem.delete({
    where: { id },
  });
  await recalculateCostStudyTotals(costStudyId);
  return item;
}
```

### 1.2.3 — إضافة دالة toggleMEPItemEnabled

```typescript
export async function toggleMEPItemEnabled(id: string, costStudyId: string, isEnabled: boolean) {
  const item = await db.mEPItem.update({
    where: { id },
    data: { isEnabled },
  });
  await recalculateCostStudyTotals(costStudyId);
  return item;
}
```

### 1.2.4 — إضافة دالة deleteAutoMEPItems (للـ Cascade)

```typescript
export async function deleteAutoMEPItems(costStudyId: string) {
  return db.mEPItem.deleteMany({
    where: {
      costStudyId,
      dataSource: "auto",
    },
  });
}
```

### 1.2.5 — تحديث createMEPItem الموجودة

ابحث عن دالة `createMEPItem` الموجودة وعدّلها لتدعم الحقول الجديدة. أضف حساب التكاليف (materialCost, laborCost, unitPrice, totalCost) بنفس نمط updateMEPItem أعلاه.

### 1.2.6 — تحديث createMEPItems (batch) الموجودة

ابحث عن دالة `createMEPItems` (batch create) وعدّلها لتدعم الحقول الجديدة. تأكد أنها تحسب totalCost لكل عنصر قبل الإدخال.

### 1.2.7 — تحديث recalculateCostStudyTotals

**مهم:** هذه الدالة **موجودة ويجب ألا تتغير منطقها**. تحقق فقط أنها تجمع `totalCost` من `mEPItem` حيث `isEnabled = true`:

ابحث عن سطر الـ aggregate لـ mEPItem وعدّله ليفلتر فقط البنود المفعلة:
```typescript
// قبل
db.mEPItem.aggregate({ where: { costStudyId: id }, _sum: { totalCost: true } }),
// بعد
db.mEPItem.aggregate({ where: { costStudyId: id, isEnabled: true }, _sum: { totalCost: true } }),
```

**معايير النجاح:**
- الدوال الأربع الجديدة (update, delete, toggle, deleteAuto) مضافة
- createMEPItem و createMEPItems محدثة
- recalculateCostStudyTotals تفلتر بـ isEnabled
- لا أخطاء TypeScript

---

## المرحلة 1.3: إنشاء API Procedures جديدة

### 1.3.1 — إنشاء mep-item-update.ts

**الملف الجديد:** `packages/api/modules/quantities/procedures/mep-item-update.ts`

انسخ نمط `finishing-item-update.ts` الموجود وعدّله لـ MEP:

```typescript
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateMEPItem } from "@masar/database/prisma/queries/cost-studies";
import { verifyOrganizationAccess } from "../../../lib/authorization";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const mepItemUpdate = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      costStudyId: z.string(),
      organizationId: z.string(),
      data: z.object({
        category: z.string().optional(),
        subCategory: z.string().optional(),
        itemType: z.string().nullable().optional(),
        name: z.string().optional(),
        floorId: z.string().nullable().optional(),
        floorName: z.string().nullable().optional(),
        roomId: z.string().nullable().optional(),
        roomName: z.string().nullable().optional(),
        scope: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        length: z.number().nullable().optional(),
        area: z.number().nullable().optional(),
        calculationMethod: z.string().optional(),
        calculationData: z.any().optional(),
        dataSource: z.string().optional(),
        sourceFormula: z.string().nullable().optional(),
        groupKey: z.string().nullable().optional(),
        specifications: z.string().nullable().optional(),
        specData: z.any().optional(),
        qualityLevel: z.string().nullable().optional(),
        materialPrice: z.number().optional(),
        laborPrice: z.number().optional(),
        wastagePercent: z.number().optional(),
        isEnabled: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }),
    })
  )
  .handler(async ({ input, context }) => {
    await verifyOrganizationAccess(input.organizationId, context.user.id, {
      section: "pricing",
      action: "studies",
    });
    await enforceFeatureAccess(input.organizationId, "cost-study.save", context.user);
    return updateMEPItem(input.id, input.costStudyId, input.data);
  });
```

### 1.3.2 — إنشاء mep-item-delete.ts

**الملف الجديد:** `packages/api/modules/quantities/procedures/mep-item-delete.ts`

```typescript
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { deleteMEPItem } from "@masar/database/prisma/queries/cost-studies";
import { verifyOrganizationAccess } from "../../../lib/authorization";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const mepItemDelete = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      costStudyId: z.string(),
      organizationId: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    await verifyOrganizationAccess(input.organizationId, context.user.id, {
      section: "pricing",
      action: "studies",
    });
    await enforceFeatureAccess(input.organizationId, "cost-study.save", context.user);
    return deleteMEPItem(input.id, input.costStudyId);
  });
```

### 1.3.3 — إنشاء mep-item-toggle.ts

**الملف الجديد:** `packages/api/modules/quantities/procedures/mep-item-toggle.ts`

```typescript
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { toggleMEPItemEnabled } from "@masar/database/prisma/queries/cost-studies";
import { verifyOrganizationAccess } from "../../../lib/authorization";

export const mepItemToggle = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      costStudyId: z.string(),
      organizationId: z.string(),
      isEnabled: z.boolean(),
    })
  )
  .handler(async ({ input, context }) => {
    await verifyOrganizationAccess(input.organizationId, context.user.id, {
      section: "pricing",
      action: "studies",
    });
    return toggleMEPItemEnabled(input.id, input.costStudyId, input.isEnabled);
  });
```

### 1.3.4 — تحديث router.ts

**الملف:** `packages/api/modules/quantities/router.ts`

ابحث عن قسم `mepItem` في الراوتر وأضف الإجراءات الجديدة:

```typescript
import { mepItemUpdate } from "./procedures/mep-item-update";
import { mepItemDelete } from "./procedures/mep-item-delete";
import { mepItemToggle } from "./procedures/mep-item-toggle";

// داخل quantitiesRouter:
mepItem: {
  create: mepItemCreate,         // موجود
  createBatch: mepItemCreateBatch, // موجود
  update: mepItemUpdate,          // جديد
  delete: mepItemDelete,          // جديد
  toggleEnabled: mepItemToggle,   // جديد
},
```

**مهم:** تحقق من أسماء الـ imports الموجودة. قد تكون الأسماء مختلفة قليلاً — طابقها مع الموجود.

**معايير النجاح:**
- 3 ملفات procedure جديدة
- router.ts يحتوي على 5 إجراءات MEP (create, createBatch, update, delete, toggleEnabled)
- `pnpm type-check` ينجح
- لا أخطاء TypeScript

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 2: الفئات والثوابت والأنواع
# Phase 2: Categories, Constants & Types
# ═══════════════════════════════════════════════════════════════

## السياق

قبل بناء محرك الاشتقاق، نحتاج بناء "قاعدة المعرفة" — الفئات، الأسعار الافتراضية، المواصفات، وخرائط الربط بين نوع الغرفة ومتطلبات MEP.

**المسار:** `apps/web/modules/saas/pricing/`

**مرجع:** ادرس ملف `finishing-categories.ts` الموجود في `apps/web/modules/saas/pricing/lib/finishing-categories.ts` لفهم النمط المتبع.

---

## المرحلة 2.1: أنواع TypeScript

**الملف الجديد:** `apps/web/modules/saas/pricing/types/mep.ts`

```typescript
// ═══════════════════════════════════════════════════════════
// MEP Types — أنواع الأعمال الكهروميكانيكية
// ═══════════════════════════════════════════════════════════

export type MEPCategoryId =
  | "ELECTRICAL"
  | "PLUMBING"
  | "HVAC"
  | "FIREFIGHTING"
  | "LOW_CURRENT"
  | "SPECIAL";

export type ElectricalSubCategory =
  | "lighting"
  | "power_outlets"
  | "cables"
  | "panels"
  | "earthing"
  | "emergency";

export type PlumbingSubCategory =
  | "water_supply"
  | "drainage"
  | "pipes"
  | "tanks"
  | "pumps"
  | "heaters"
  | "manholes"
  | "fixtures";

export type HVACSubCategory =
  | "ac_units"
  | "refrigerant"
  | "ductwork"
  | "diffusers"
  | "ventilation"
  | "condensate";

export type FirefightingSubCategory =
  | "alarm"
  | "sprinklers"
  | "hose_cabinets"
  | "extinguishers"
  | "fire_pumps"
  | "fire_tank";

export type LowCurrentSubCategory =
  | "network"
  | "cctv"
  | "intercom"
  | "sound"
  | "access";

export type SpecialSubCategory =
  | "elevator"
  | "generator"
  | "solar"
  | "gas"
  | "lightning_protection";

export type MEPSubCategory =
  | ElectricalSubCategory
  | PlumbingSubCategory
  | HVACSubCategory
  | FirefightingSubCategory
  | LowCurrentSubCategory
  | SpecialSubCategory;

export interface MEPDerivedItem {
  category: MEPCategoryId;
  subCategory: string;
  itemType: string;
  name: string;
  floorId: string | null;
  floorName: string | null;
  roomId: string | null;
  roomName: string | null;
  scope: "per_room" | "per_floor" | "per_building" | "external";
  groupKey: string;
  quantity: number;
  unit: string;
  materialPrice: number;
  laborPrice: number;
  wastagePercent: number;
  calculationData: Record<string, any>;
  sourceFormula: string;
  specData: Record<string, any>;
  qualityLevel: "economy" | "standard" | "premium";
}

export interface MEPMergedItem extends MEPDerivedItem {
  id?: string;
  isNew: boolean;
  isSaved: boolean;
  isManualOverride: boolean;
  isEnabled: boolean;
  savedQuantity?: number;
  derivedQuantity?: number;
  totalCost: number;
  materialCost: number;
  laborCost: number;
  dataSource: "auto" | "manual" | "estimated";
}

export interface MEPCategoryConfig {
  id: MEPCategoryId;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  subCategories: Record<string, {
    nameAr: string;
    nameEn: string;
    defaultUnit: string;
    icon?: string;
  }>;
}

export interface RoomMEPProfile {
  spotLightCoverage: number;      // م² لكل سبوت
  luxLevel: number;
  hasChandelier: boolean;
  outlets13A: number;
  outlets20A_AC: number;
  outlets20A_heater: number;
  outlets32A_oven: number;
  outlets20A_washer: number;
  needsAC: boolean;
  coolingFactorBTU: number;       // BTU/م²
  hasWaterSupply: boolean;
  hasDrainage: boolean;
  needsExhaustFan: boolean;
  plumbingFixtures: {
    washbasin: number;
    wc: number;
    shower: number;
    bathtub: number;
    kitchenSink: number;
    washer: number;
    bidet: number;
  };
  fixtureUnits: number;           // FU إجمالي
  drainageFixtureUnits: number;   // DFU إجمالي
  networkPoints: number;
}

// ─── أنواع buildingConfig (مطابقة لما في التشطيبات) ───
export type FloorType = "BASEMENT" | "GROUND" | "UPPER" | "ANNEX" | "ROOF" | "MEZZANINE";

export type RoomType =
  | "bedroom"
  | "living"
  | "majlis"
  | "kitchen"
  | "bathroom"
  | "hall"
  | "corridor"
  | "storage"
  | "laundry"
  | "maid_room"
  | "office"
  | "other";

export interface RoomConfig {
  id: string;
  name: string;
  length: number;
  width: number;
  type: RoomType;
  hasFalseCeiling?: boolean;
}

export interface FloorConfig {
  id: string;
  name: string;
  type: FloorType;
  area: number;
  height: number;
  rooms: RoomConfig[];
  openings?: any[];
}

export interface ExteriorConfig {
  fenceLength?: number;
  fenceHeight?: number;
  gardenArea?: number;
  courtyardArea?: number;
  hasPool?: boolean;
  poolArea?: number;
}

export interface SmartBuildingConfig {
  landArea: number;
  buildingPerimeter?: number;
  numberOfFloors: number;
  hasBasement?: boolean;
  floors: FloorConfig[];
  exterior?: ExteriorConfig;
}
```

**مهم:** تحقق أن `SmartBuildingConfig` و `RoomConfig` و `FloorConfig` تتطابق مع الأنواع المستخدمة في `derivation-engine.ts` و `BuildingSetupWizard.tsx`. إذا كانت الأنواع موجودة بالفعل في `smart-building-types.ts`، استخدمها بـ import بدلاً من إعادة تعريفها. أضف فقط الأنواع الخاصة بـ MEP.

**معايير النجاح:**
- ملف mep.ts موجود مع جميع الأنواع
- لا تعارض مع أنواع التشطيبات الموجودة
- `pnpm type-check` ينجح

---

## المرحلة 2.2: فئات MEP

**الملف الجديد:** `apps/web/modules/saas/pricing/lib/mep-categories.ts`

أنشئ ملف الفئات. **مهم:** انسخ نمط `finishing-categories.ts` — استخدم `nameAr` و `nameEn` لكل فئة.

```typescript
import type { MEPCategoryConfig, MEPCategoryId } from "../types/mep";

export const MEP_CATEGORIES: Record<MEPCategoryId, MEPCategoryConfig> = {
  ELECTRICAL: {
    id: "ELECTRICAL",
    nameAr: "الأعمال الكهربائية",
    nameEn: "Electrical Works",
    icon: "Zap",
    color: "#F59E0B", // amber
    subCategories: {
      lighting: { nameAr: "الإنارة", nameEn: "Lighting", defaultUnit: "نقطة", icon: "Lightbulb" },
      power_outlets: { nameAr: "نقاط القوى والأفياش", nameEn: "Power Outlets", defaultUnit: "نقطة", icon: "Plug" },
      cables: { nameAr: "الكيبلات والأسلاك", nameEn: "Cables & Wires", defaultUnit: "م.ط", icon: "Cable" },
      panels: { nameAr: "اللوحات الكهربائية", nameEn: "Distribution Panels", defaultUnit: "عدد", icon: "LayoutGrid" },
      earthing: { nameAr: "التأريض", nameEn: "Earthing System", defaultUnit: "نظام", icon: "Anchor" },
      emergency: { nameAr: "إنارة الطوارئ", nameEn: "Emergency Lighting", defaultUnit: "نقطة", icon: "AlertTriangle" },
    },
  },
  PLUMBING: {
    id: "PLUMBING",
    nameAr: "الأعمال الصحية",
    nameEn: "Plumbing Works",
    icon: "Droplets",
    color: "#3B82F6", // blue
    subCategories: {
      water_supply: { nameAr: "تغذية المياه", nameEn: "Water Supply", defaultUnit: "نقطة", icon: "Droplet" },
      drainage: { nameAr: "الصرف الصحي", nameEn: "Drainage", defaultUnit: "نقطة", icon: "ArrowDownCircle" },
      pipes: { nameAr: "المواسير", nameEn: "Pipes", defaultUnit: "م.ط", icon: "Minus" },
      tanks: { nameAr: "الخزانات", nameEn: "Water Tanks", defaultUnit: "م³", icon: "Box" },
      pumps: { nameAr: "المضخات", nameEn: "Pumps", defaultUnit: "عدد", icon: "Activity" },
      heaters: { nameAr: "السخانات", nameEn: "Water Heaters", defaultUnit: "عدد", icon: "Flame" },
      manholes: { nameAr: "غرف التفتيش", nameEn: "Manholes", defaultUnit: "عدد", icon: "Square" },
      fixtures: { nameAr: "الأجهزة الصحية", nameEn: "Sanitary Fixtures", defaultUnit: "عدد", icon: "Bath" },
    },
  },
  HVAC: {
    id: "HVAC",
    nameAr: "التكييف والتهوية",
    nameEn: "HVAC",
    icon: "Wind",
    color: "#06B6D4", // cyan
    subCategories: {
      ac_units: { nameAr: "وحدات التكييف", nameEn: "AC Units", defaultUnit: "وحدة", icon: "Snowflake" },
      refrigerant: { nameAr: "مواسير التبريد", nameEn: "Refrigerant Pipes", defaultUnit: "م.ط", icon: "Thermometer" },
      ductwork: { nameAr: "مجاري الهواء", nameEn: "Ductwork", defaultUnit: "م²", icon: "Wind" },
      diffusers: { nameAr: "مخارج الهواء", nameEn: "Diffusers", defaultUnit: "عدد", icon: "CircleDot" },
      ventilation: { nameAr: "التهوية والشفط", nameEn: "Ventilation", defaultUnit: "عدد", icon: "Fan" },
      condensate: { nameAr: "تصريف المكثفات", nameEn: "Condensate Drain", defaultUnit: "م.ط", icon: "Droplets" },
    },
  },
  FIREFIGHTING: {
    id: "FIREFIGHTING",
    nameAr: "مكافحة الحريق",
    nameEn: "Firefighting",
    icon: "Flame",
    color: "#EF4444", // red
    subCategories: {
      alarm: { nameAr: "نظام الإنذار", nameEn: "Fire Alarm", defaultUnit: "نقطة", icon: "Bell" },
      sprinklers: { nameAr: "الرشاشات", nameEn: "Sprinklers", defaultUnit: "عدد", icon: "Umbrella" },
      hose_cabinets: { nameAr: "صناديق الحريق", nameEn: "Hose Cabinets", defaultUnit: "عدد", icon: "Box" },
      extinguishers: { nameAr: "الطفايات", nameEn: "Extinguishers", defaultUnit: "عدد", icon: "Cylinder" },
      fire_pumps: { nameAr: "مضخات الحريق", nameEn: "Fire Pumps", defaultUnit: "عدد", icon: "Activity" },
      fire_tank: { nameAr: "خزان الحريق", nameEn: "Fire Tank", defaultUnit: "م³", icon: "Box" },
    },
  },
  LOW_CURRENT: {
    id: "LOW_CURRENT",
    nameAr: "التيار الخفيف",
    nameEn: "Low Current Systems",
    icon: "Wifi",
    color: "#8B5CF6", // purple
    subCategories: {
      network: { nameAr: "شبكة البيانات", nameEn: "Data Network", defaultUnit: "نقطة", icon: "Network" },
      cctv: { nameAr: "كاميرات المراقبة", nameEn: "CCTV", defaultUnit: "عدد", icon: "Camera" },
      intercom: { nameAr: "الاتصال الداخلي", nameEn: "Intercom", defaultUnit: "نقطة", icon: "Phone" },
      sound: { nameAr: "نظام الصوت", nameEn: "Sound System", defaultUnit: "نقطة", icon: "Volume2" },
      access: { nameAr: "تحكم الدخول", nameEn: "Access Control", defaultUnit: "نقطة", icon: "Lock" },
    },
  },
  SPECIAL: {
    id: "SPECIAL",
    nameAr: "أنظمة خاصة",
    nameEn: "Special Systems",
    icon: "Settings",
    color: "#64748B", // slate
    subCategories: {
      elevator: { nameAr: "المصاعد", nameEn: "Elevators", defaultUnit: "عدد", icon: "ArrowUpDown" },
      generator: { nameAr: "مولد كهربائي", nameEn: "Generator", defaultUnit: "KVA", icon: "Zap" },
      solar: { nameAr: "طاقة شمسية", nameEn: "Solar PV", defaultUnit: "KW", icon: "Sun" },
      gas: { nameAr: "غاز مركزي", nameEn: "Central Gas", defaultUnit: "نقطة", icon: "Flame" },
      lightning_protection: { nameAr: "حماية صواعق", nameEn: "Lightning Protection", defaultUnit: "نظام", icon: "CloudLightning" },
    },
  },
};

// ─── ترتيب الفئات للعرض ───
export const MEP_CATEGORY_ORDER: MEPCategoryId[] = [
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "FIREFIGHTING",
  "LOW_CURRENT",
  "SPECIAL",
];

// ─── Helper: الحصول على اسم الفئة ───
export function getMEPCategoryName(categoryId: MEPCategoryId, locale: "ar" | "en" = "ar"): string {
  const cat = MEP_CATEGORIES[categoryId];
  return locale === "ar" ? cat.nameAr : cat.nameEn;
}

export function getMEPSubCategoryName(
  categoryId: MEPCategoryId,
  subCategoryId: string,
  locale: "ar" | "en" = "ar"
): string {
  const sub = MEP_CATEGORIES[categoryId]?.subCategories[subCategoryId];
  if (!sub) return subCategoryId;
  return locale === "ar" ? sub.nameAr : sub.nameEn;
}
```

---

## المرحلة 2.3: خارطة ربط الغرف بمتطلبات MEP

**الملف الجديد:** `apps/web/modules/saas/pricing/lib/mep-room-profiles.ts`

هذا الملف هو **قلب الربط** — يربط بين نوع الغرفة (من buildingConfig) ومتطلبات MEP.

```typescript
import type { RoomType, RoomMEPProfile } from "../types/mep";

/**
 * لكل نوع غرفة: ما هي متطلبات MEP الكهربائية والصحية والتكييف؟
 *
 * القيم مبنية على:
 * - كود البناء السعودي (SBC)
 * - معايير ASHRAE للتكييف (مع ضبط للمناخ السعودي الحار)
 * - الممارسات الشائعة عند المقاولين السعوديين
 */
export const ROOM_MEP_PROFILES: Record<RoomType, RoomMEPProfile> = {
  bedroom: {
    spotLightCoverage: 2.5,
    luxLevel: 200,
    hasChandelier: false,
    outlets13A: 6,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 700,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 1,
  },
  living: {
    spotLightCoverage: 2.0,
    luxLevel: 300,
    hasChandelier: true,
    outlets13A: 10,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 800,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 2,
  },
  majlis: {
    spotLightCoverage: 2.0,
    luxLevel: 300,
    hasChandelier: true,
    outlets13A: 8,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 800,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 1,
  },
  kitchen: {
    spotLightCoverage: 1.5,
    luxLevel: 500,
    hasChandelier: false,
    outlets13A: 6,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 1,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 900,
    hasWaterSupply: true,
    hasDrainage: true,
    needsExhaustFan: true,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 1, washer: 0, bidet: 0 },
    fixtureUnits: 2,
    drainageFixtureUnits: 2,
    networkPoints: 1,
  },
  bathroom: {
    spotLightCoverage: 2.5,
    luxLevel: 250,
    hasChandelier: false,
    outlets13A: 1,
    outlets20A_AC: 0,
    outlets20A_heater: 1,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: false,
    coolingFactorBTU: 0,
    hasWaterSupply: true,
    hasDrainage: true,
    needsExhaustFan: true,
    plumbingFixtures: { washbasin: 1, wc: 1, shower: 1, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 8,
    drainageFixtureUnits: 7,
    networkPoints: 0,
  },
  hall: {
    spotLightCoverage: 2.0,
    luxLevel: 250,
    hasChandelier: true,
    outlets13A: 6,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 750,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 1,
  },
  corridor: {
    spotLightCoverage: 3.0,
    luxLevel: 100,
    hasChandelier: false,
    outlets13A: 2,
    outlets20A_AC: 0,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: false,
    coolingFactorBTU: 0,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 0,
  },
  storage: {
    spotLightCoverage: 4.0,
    luxLevel: 100,
    hasChandelier: false,
    outlets13A: 2,
    outlets20A_AC: 0,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: false,
    coolingFactorBTU: 0,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 0,
  },
  laundry: {
    spotLightCoverage: 2.5,
    luxLevel: 200,
    hasChandelier: false,
    outlets13A: 2,
    outlets20A_AC: 0,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 1,
    needsAC: false,
    coolingFactorBTU: 0,
    hasWaterSupply: true,
    hasDrainage: true,
    needsExhaustFan: true,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 1, bidet: 0 },
    fixtureUnits: 3,
    drainageFixtureUnits: 3,
    networkPoints: 0,
  },
  maid_room: {
    spotLightCoverage: 2.5,
    luxLevel: 200,
    hasChandelier: false,
    outlets13A: 4,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 700,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 0,
  },
  office: {
    spotLightCoverage: 1.8,
    luxLevel: 400,
    hasChandelier: false,
    outlets13A: 6,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 900,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 2,
  },
  other: {
    spotLightCoverage: 2.5,
    luxLevel: 200,
    hasChandelier: false,
    outlets13A: 4,
    outlets20A_AC: 1,
    outlets20A_heater: 0,
    outlets32A_oven: 0,
    outlets20A_washer: 0,
    needsAC: true,
    coolingFactorBTU: 700,
    hasWaterSupply: false,
    hasDrainage: false,
    needsExhaustFan: false,
    plumbingFixtures: { washbasin: 0, wc: 0, shower: 0, bathtub: 0, kitchenSink: 0, washer: 0, bidet: 0 },
    fixtureUnits: 0,
    drainageFixtureUnits: 0,
    networkPoints: 0,
  },
};

/**
 * Helper: عدد الأشخاص المقدر من عدد غرف النوم
 */
export function estimateOccupants(floors: Array<{ rooms: Array<{ type: string }> }>): number {
  let bedrooms = 0;
  for (const floor of floors) {
    for (const room of floor.rooms) {
      if (room.type === "bedroom" || room.type === "maid_room") bedrooms++;
    }
  }
  return Math.max(bedrooms * 2, 4);
}

/**
 * Helper: اختيار حجم مكيف مناسب (أقرب حجم قياسي)
 */
export function selectACSize(tons: number): number {
  const sizes = [1, 1.5, 2, 2.5, 3, 4, 5];
  for (const size of sizes) {
    if (tons <= size) return size;
  }
  return Math.ceil(tons);
}

/**
 * Helper: اختيار قطر ماسورة التغذية حسب FU
 */
export function selectSupplyPipeSize(totalFU: number): { size: number; label: string } {
  if (totalFU <= 5)   return { size: 20, label: '20mm (3/4")' };
  if (totalFU <= 15)  return { size: 25, label: '25mm (1")' };
  if (totalFU <= 30)  return { size: 32, label: '32mm (1.25")' };
  if (totalFU <= 60)  return { size: 40, label: '40mm (1.5")' };
  if (totalFU <= 100) return { size: 50, label: '50mm (2")' };
  if (totalFU <= 200) return { size: 63, label: '63mm (2.5")' };
  return { size: 75, label: '75mm (3")' };
}

/**
 * Helper: اختيار مقاس الكيبل حسب الحمل
 */
export function selectCableSize(loadKW: number): { size: string; ampacity: number } {
  const current = loadKW * 1000 / (400 * 1.732 * 0.85); // ثلاثي الأطوار
  if (current <= 25)  return { size: "4×6mm²", ampacity: 32 };
  if (current <= 45)  return { size: "4×10mm²", ampacity: 45 };
  if (current <= 60)  return { size: "4×16mm²", ampacity: 60 };
  if (current <= 80)  return { size: "4×25mm²", ampacity: 80 };
  if (current <= 100) return { size: "4×35mm²", ampacity: 100 };
  if (current <= 125) return { size: "4×50mm²", ampacity: 125 };
  if (current <= 160) return { size: "4×70mm²", ampacity: 160 };
  if (current <= 200) return { size: "4×95mm²", ampacity: 200 };
  return { size: "4×120mm²", ampacity: 250 };
}

/**
 * Helper: مقاسات مواسير التبريد حسب سعة المكيف
 */
export function selectRefrigerantPipes(tons: number): { liquid: string; suction: string } {
  if (tons <= 1.5) return { liquid: '1/4"', suction: '1/2"' };
  if (tons <= 2)   return { liquid: '1/4"', suction: '5/8"' };
  if (tons <= 3)   return { liquid: '3/8"', suction: '5/8"' };
  if (tons <= 4)   return { liquid: '3/8"', suction: '3/4"' };
  return { liquid: '3/8"', suction: '7/8"' };
}
```

---

## المرحلة 2.4: الأسعار الافتراضية

**الملف الجديد:** `apps/web/modules/saas/pricing/lib/mep-prices.ts`

```typescript
/**
 * أسعار افتراضية للأعمال الكهروميكانيكية — السوق السعودي 2024-2026
 * الأسعار بالريال السعودي (SAR) — قابلة للتعديل من المستخدم
 *
 * materialPrice = سعر المواد لكل وحدة
 * laborPrice = سعر المصنعية لكل وحدة
 * wastagePercent = نسبة الهدر الافتراضية
 */

export interface MEPDefaultPrice {
  materialPrice: number;
  laborPrice: number;
  wastagePercent: number;
  unit: string;
}

export const MEP_DEFAULT_PRICES: Record<string, Record<string, MEPDefaultPrice>> = {
  // ═══════════════════════ الكهرباء ═══════════════════════
  ELECTRICAL: {
    spot_light:        { materialPrice: 35, laborPrice: 30, wastagePercent: 10, unit: "نقطة" },
    chandelier_point:  { materialPrice: 80, laborPrice: 70, wastagePercent: 10, unit: "نقطة" },
    led_panel:         { materialPrice: 60, laborPrice: 35, wastagePercent: 10, unit: "نقطة" },
    outdoor_light:     { materialPrice: 120, laborPrice: 50, wastagePercent: 10, unit: "نقطة" },
    emergency_light:   { materialPrice: 120, laborPrice: 40, wastagePercent: 5, unit: "نقطة" },
    exit_sign:         { materialPrice: 100, laborPrice: 30, wastagePercent: 5, unit: "نقطة" },
    outlet_13a:        { materialPrice: 45, laborPrice: 40, wastagePercent: 10, unit: "نقطة" },
    outlet_20a_ac:     { materialPrice: 65, laborPrice: 50, wastagePercent: 10, unit: "نقطة" },
    outlet_20a_heater: { materialPrice: 65, laborPrice: 50, wastagePercent: 10, unit: "نقطة" },
    outlet_20a_washer: { materialPrice: 65, laborPrice: 50, wastagePercent: 10, unit: "نقطة" },
    outlet_32a_oven:   { materialPrice: 90, laborPrice: 60, wastagePercent: 10, unit: "نقطة" },
    outlet_external:   { materialPrice: 80, laborPrice: 50, wastagePercent: 10, unit: "نقطة" },
    wire_1_5mm:        { materialPrice: 2.5, laborPrice: 1.5, wastagePercent: 15, unit: "م.ط" },
    wire_2_5mm:        { materialPrice: 3.5, laborPrice: 1.5, wastagePercent: 15, unit: "م.ط" },
    wire_4mm:          { materialPrice: 5.5, laborPrice: 2, wastagePercent: 15, unit: "م.ط" },
    wire_6mm:          { materialPrice: 8, laborPrice: 2.5, wastagePercent: 15, unit: "م.ط" },
    cable_4x16:        { materialPrice: 35, laborPrice: 15, wastagePercent: 10, unit: "م.ط" },
    cable_4x25:        { materialPrice: 55, laborPrice: 20, wastagePercent: 10, unit: "م.ط" },
    cable_4x35:        { materialPrice: 75, laborPrice: 25, wastagePercent: 10, unit: "م.ط" },
    cable_4x50:        { materialPrice: 100, laborPrice: 30, wastagePercent: 10, unit: "م.ط" },
    panel_12way:       { materialPrice: 400, laborPrice: 250, wastagePercent: 0, unit: "عدد" },
    panel_24way:       { materialPrice: 800, laborPrice: 400, wastagePercent: 0, unit: "عدد" },
    panel_36way:       { materialPrice: 1200, laborPrice: 500, wastagePercent: 0, unit: "عدد" },
    main_panel:        { materialPrice: 3000, laborPrice: 1500, wastagePercent: 0, unit: "عدد" },
    earthing_system:   { materialPrice: 2000, laborPrice: 1500, wastagePercent: 0, unit: "نظام" },
  },
  // ═══════════════════════ السباكة ═══════════════════════
  PLUMBING: {
    supply_cold:       { materialPrice: 25, laborPrice: 30, wastagePercent: 15, unit: "نقطة" },
    supply_hot:        { materialPrice: 30, laborPrice: 30, wastagePercent: 15, unit: "نقطة" },
    drain_50mm:        { materialPrice: 20, laborPrice: 25, wastagePercent: 12, unit: "نقطة" },
    drain_100mm:       { materialPrice: 35, laborPrice: 35, wastagePercent: 12, unit: "نقطة" },
    ppr_20mm:          { materialPrice: 5, laborPrice: 4, wastagePercent: 15, unit: "م.ط" },
    ppr_25mm:          { materialPrice: 8, laborPrice: 5, wastagePercent: 15, unit: "م.ط" },
    ppr_32mm:          { materialPrice: 12, laborPrice: 6, wastagePercent: 15, unit: "م.ط" },
    pvc_50mm:          { materialPrice: 8, laborPrice: 5, wastagePercent: 12, unit: "م.ط" },
    pvc_100mm:         { materialPrice: 15, laborPrice: 8, wastagePercent: 12, unit: "م.ط" },
    pvc_150mm:         { materialPrice: 25, laborPrice: 12, wastagePercent: 12, unit: "م.ط" },
    tank_fiberglass:   { materialPrice: 1200, laborPrice: 300, wastagePercent: 0, unit: "م³" },
    pump_1hp:          { materialPrice: 1500, laborPrice: 500, wastagePercent: 0, unit: "عدد" },
    pump_2hp:          { materialPrice: 2500, laborPrice: 700, wastagePercent: 0, unit: "عدد" },
    heater_50l:        { materialPrice: 600, laborPrice: 200, wastagePercent: 0, unit: "عدد" },
    heater_80l:        { materialPrice: 800, laborPrice: 250, wastagePercent: 0, unit: "عدد" },
    manhole_60x60:     { materialPrice: 300, laborPrice: 250, wastagePercent: 0, unit: "عدد" },
    manhole_80x80:     { materialPrice: 500, laborPrice: 350, wastagePercent: 0, unit: "عدد" },
    wc_set:            { materialPrice: 800, laborPrice: 300, wastagePercent: 0, unit: "عدد" },
    washbasin_set:     { materialPrice: 400, laborPrice: 200, wastagePercent: 0, unit: "عدد" },
    shower_mixer:      { materialPrice: 300, laborPrice: 150, wastagePercent: 0, unit: "عدد" },
    kitchen_sink:      { materialPrice: 500, laborPrice: 200, wastagePercent: 0, unit: "عدد" },
    floor_drain:       { materialPrice: 40, laborPrice: 30, wastagePercent: 0, unit: "عدد" },
  },
  // ═══════════════════════ التكييف ═══════════════════════
  HVAC: {
    split_1ton:        { materialPrice: 200, laborPrice: 300, wastagePercent: 0, unit: "وحدة" },
    split_1_5ton:      { materialPrice: 250, laborPrice: 350, wastagePercent: 0, unit: "وحدة" },
    split_2ton:        { materialPrice: 300, laborPrice: 400, wastagePercent: 0, unit: "وحدة" },
    split_2_5ton:      { materialPrice: 350, laborPrice: 450, wastagePercent: 0, unit: "وحدة" },
    split_3ton:        { materialPrice: 400, laborPrice: 500, wastagePercent: 0, unit: "وحدة" },
    copper_pipes:      { materialPrice: 25, laborPrice: 15, wastagePercent: 10, unit: "م.ط" },
    condensate_pipe:   { materialPrice: 5, laborPrice: 3, wastagePercent: 10, unit: "م.ط" },
    exhaust_fan_bath:  { materialPrice: 150, laborPrice: 80, wastagePercent: 0, unit: "عدد" },
    exhaust_fan_kitchen: { materialPrice: 300, laborPrice: 150, wastagePercent: 0, unit: "عدد" },
  },
  // ═══════════════════════ الحريق ═══════════════════════
  FIREFIGHTING: {
    facp_8zone:        { materialPrice: 5000, laborPrice: 2000, wastagePercent: 0, unit: "عدد" },
    smoke_detector:    { materialPrice: 60, laborPrice: 30, wastagePercent: 5, unit: "عدد" },
    heat_detector:     { materialPrice: 50, laborPrice: 25, wastagePercent: 5, unit: "عدد" },
    manual_call_point: { materialPrice: 80, laborPrice: 40, wastagePercent: 0, unit: "عدد" },
    horn_strobe:       { materialPrice: 120, laborPrice: 50, wastagePercent: 0, unit: "عدد" },
    sprinkler_head:    { materialPrice: 30, laborPrice: 20, wastagePercent: 5, unit: "عدد" },
    hose_cabinet:      { materialPrice: 1000, laborPrice: 500, wastagePercent: 0, unit: "عدد" },
    extinguisher_abc:  { materialPrice: 100, laborPrice: 0, wastagePercent: 0, unit: "عدد" },
    extinguisher_co2:  { materialPrice: 200, laborPrice: 0, wastagePercent: 0, unit: "عدد" },
    fire_pump_main:    { materialPrice: 35000, laborPrice: 15000, wastagePercent: 0, unit: "عدد" },
    jockey_pump:       { materialPrice: 5000, laborPrice: 3000, wastagePercent: 0, unit: "عدد" },
    fire_tank:         { materialPrice: 1500, laborPrice: 500, wastagePercent: 0, unit: "م³" },
  },
  // ═══════════════════════ التيار الخفيف ═══════════════════════
  LOW_CURRENT: {
    network_point:     { materialPrice: 80, laborPrice: 50, wastagePercent: 10, unit: "نقطة" },
    wifi_ap:           { materialPrice: 300, laborPrice: 100, wastagePercent: 0, unit: "عدد" },
    camera_dome:       { materialPrice: 250, laborPrice: 100, wastagePercent: 0, unit: "عدد" },
    camera_bullet:     { materialPrice: 300, laborPrice: 120, wastagePercent: 0, unit: "عدد" },
    nvr_8ch:           { materialPrice: 1500, laborPrice: 300, wastagePercent: 0, unit: "عدد" },
    intercom_outdoor:  { materialPrice: 800, laborPrice: 300, wastagePercent: 0, unit: "عدد" },
    intercom_indoor:   { materialPrice: 400, laborPrice: 150, wastagePercent: 0, unit: "عدد" },
    speaker:           { materialPrice: 150, laborPrice: 80, wastagePercent: 0, unit: "عدد" },
    amplifier:         { materialPrice: 1000, laborPrice: 300, wastagePercent: 0, unit: "عدد" },
  },
  // ═══════════════════════ أنظمة خاصة ═══════════════════════
  SPECIAL: {
    elevator_6person:  { materialPrice: 80000, laborPrice: 20000, wastagePercent: 0, unit: "عدد" },
    elevator_8person:  { materialPrice: 100000, laborPrice: 25000, wastagePercent: 0, unit: "عدد" },
    generator_30kva:   { materialPrice: 25000, laborPrice: 8000, wastagePercent: 0, unit: "عدد" },
    generator_100kva:  { materialPrice: 60000, laborPrice: 15000, wastagePercent: 0, unit: "عدد" },
    generator_250kva:  { materialPrice: 120000, laborPrice: 25000, wastagePercent: 0, unit: "عدد" },
    solar_per_kw:      { materialPrice: 3000, laborPrice: 1000, wastagePercent: 0, unit: "KW" },
    gas_point:         { materialPrice: 200, laborPrice: 150, wastagePercent: 10, unit: "نقطة" },
    lightning_system:  { materialPrice: 3000, laborPrice: 2000, wastagePercent: 0, unit: "نظام" },
  },
};

/**
 * Helper: جلب سعر افتراضي لبند محدد
 */
export function getMEPDefaultPrice(category: string, itemType: string): MEPDefaultPrice {
  const categoryPrices = MEP_DEFAULT_PRICES[category];
  if (!categoryPrices) return { materialPrice: 0, laborPrice: 0, wastagePercent: 10, unit: "عدد" };
  return categoryPrices[itemType] || { materialPrice: 0, laborPrice: 0, wastagePercent: 10, unit: "عدد" };
}
```

**معايير النجاح للمرحلة 2 كاملة:**
- 4 ملفات جديدة: `mep.ts`, `mep-categories.ts`, `mep-room-profiles.ts`, `mep-prices.ts`
- جميع الأنواع متوافقة
- `pnpm type-check` ينجح
- لا أخطاء import

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 3: محرك اشتقاق MEP الذكي
# Phase 3: MEP Smart Derivation Engine
# ═══════════════════════════════════════════════════════════════

## السياق

هذه هي المرحلة الأهم. نبني محرك يقرأ `buildingConfig` (JSON) ويولّد قائمة بنود MEP كاملة.

**المرجع الأساسي:** ادرس `apps/web/modules/saas/pricing/lib/derivation-engine.ts` (1,523 سطر) — هذا محرك اشتقاق التشطيبات. محرك MEP يتبع نفس النمط لكنه يقرأ نفس `buildingConfig` ويُخرج بنود MEP بدلاً من بنود تشطيب.

**الملف الجديد:** `apps/web/modules/saas/pricing/lib/mep-derivation-engine.ts`

**مهم جداً:** قبل كتابة أي كود، اقرأ:
1. `derivation-engine.ts` — لفهم بنية buildingConfig المستخدمة فعلياً
2. `smart-building-types.ts` — للأنواع الدقيقة
3. `BuildingSetupWizard.tsx` — لمعرفة ما يدخله المستخدم

استخدم الأنواع الموجودة **كما هي** (import). لا تعيد تعريفها.

---

## المرحلة 3.1: الهيكل العام للمحرك

```typescript
/**
 * محرك اشتقاق الأعمال الكهروميكانيكية (MEP Derivation Engine)
 *
 * يقرأ buildingConfig (نفس بيانات قسم التشطيبات) ويولّد قائمة بنود MEP.
 *
 * المدخلات: SmartBuildingConfig + projectType
 * المخرجات: MEPDerivedItem[]
 *
 * خوارزمية العمل:
 * 1. لكل طابق → لكل غرفة → قراءة ROOM_MEP_PROFILES[room.type]
 * 2. حساب: إنارة، أفياش، تكييف، سباكة (حسب نوع الغرفة)
 * 3. تجميع: كيبلات، لوحات، أسلاك (على مستوى الطابق)
 * 4. حساب: مبنى كامل (خزانات، مضخات، تأريض، مصعد، مولد)
 * 5. حساب: خارجي (إنارة، ري، كاميرات)
 * 6. حساب: حريق (حسب نوع المبنى والمساحة)
 */

import type { MEPDerivedItem, SmartBuildingConfig, RoomType } from "../types/mep";
import { ROOM_MEP_PROFILES, estimateOccupants, selectACSize, selectSupplyPipeSize, selectCableSize, selectRefrigerantPipes } from "./mep-room-profiles";
import { getMEPDefaultPrice } from "./mep-prices";

export function deriveMEPQuantities(
  config: SmartBuildingConfig,
  projectType: string = "RESIDENTIAL"
): MEPDerivedItem[] {
  const items: MEPDerivedItem[] = [];

  // ─── 1. الكهرباء ───
  items.push(...deriveElectricalLighting(config));
  items.push(...deriveElectricalOutlets(config));
  items.push(...deriveElectricalCablesAndPanels(config));
  items.push(...deriveEarthing(config));
  items.push(...deriveEmergencyLighting(config, projectType));

  // ─── 2. السباكة ───
  items.push(...derivePlumbingFixtures(config));
  items.push(...derivePlumbingPipes(config));
  items.push(...deriveTanksAndPumps(config));
  items.push(...deriveManholes(config));
  items.push(...deriveHeaters(config));

  // ─── 3. التكييف ───
  items.push(...deriveACUnits(config));
  items.push(...deriveRefrigerantPipes(config));
  items.push(...deriveVentilation(config));

  // ─── 4. الحريق ───
  items.push(...deriveFirefighting(config, projectType));

  // ─── 5. التيار الخفيف ───
  items.push(...deriveLowCurrent(config, projectType));

  // ─── 6. أنظمة خاصة ───
  items.push(...deriveSpecialSystems(config, projectType));

  // ─── 7. خارجي ───
  items.push(...deriveExteriorMEP(config));

  return items;
}
```

---

## المرحلة 3.2: اشتقاق الإنارة

أنشئ دالة `deriveElectricalLighting` داخل نفس الملف. **هذه الدالة تمر على كل طابق → كل غرفة → تحسب عدد السبوت لايت والنجف:**

```typescript
function deriveElectricalLighting(config: SmartBuildingConfig): MEPDerivedItem[] {
  const items: MEPDerivedItem[] = [];
  const prices = getMEPDefaultPrice;

  for (const floor of config.floors) {
    // السطح لا يحتاج إنارة داخلية
    if (floor.type === "ROOF") continue;

    for (const room of floor.rooms) {
      const profile = ROOM_MEP_PROFILES[room.type as RoomType];
      if (!profile) continue;

      const area = room.length * room.width;
      if (area <= 0) continue;

      // ─── سبوت لايت ───
      const spotCount = Math.ceil(area / profile.spotLightCoverage);
      const spotPrice = prices("ELECTRICAL", "spot_light");

      items.push({
        category: "ELECTRICAL",
        subCategory: "lighting",
        itemType: "spot_light",
        name: `سبوت لايت LED - ${room.name || room.type}`,
        floorId: floor.id,
        floorName: floor.name,
        roomId: room.id,
        roomName: room.name || room.type,
        scope: "per_room",
        groupKey: "electrical_lighting",
        quantity: spotCount,
        unit: "نقطة",
        materialPrice: spotPrice.materialPrice,
        laborPrice: spotPrice.laborPrice,
        wastagePercent: spotPrice.wastagePercent,
        calculationData: {
          roomArea: area,
          roomType: room.type,
          coveragePerSpot: profile.spotLightCoverage,
          luxLevel: profile.luxLevel,
        },
        sourceFormula: `مساحة(${area.toFixed(1)}م²) ÷ تغطية(${profile.spotLightCoverage}م²) = ${spotCount} نقطة`,
        specData: { wattage: "9-12W LED", size: '4"', wireSize: "1.5mm²" },
        qualityLevel: "standard",
      });

      // ─── نجفة (إن وجدت) ───
      if (profile.hasChandelier) {
        const chandelierPrice = prices("ELECTRICAL", "chandelier_point");
        items.push({
          category: "ELECTRICAL",
          subCategory: "lighting",
          itemType: "chandelier_point",
          name: `نقطة نجفة - ${room.name || room.type}`,
          floorId: floor.id,
          floorName: floor.name,
          roomId: room.id,
          roomName: room.name || room.type,
          scope: "per_room",
          groupKey: "electrical_lighting",
          quantity: 1,
          unit: "نقطة",
          materialPrice: chandelierPrice.materialPrice,
          laborPrice: chandelierPrice.laborPrice,
          wastagePercent: chandelierPrice.wastagePercent,
          calculationData: { roomType: room.type, reason: "صالة/مجلس يحتاج نجفة" },
          sourceFormula: `${room.type} → نقطة نجفة`,
          specData: { wireSize: "2.5mm²", mountType: "ceiling_plate" },
          qualityLevel: "standard",
        });
      }
    }
  }

  return items;
}
```

---

## المرحلة 3.3: اشتقاق الأفياش

أنشئ `deriveElectricalOutlets` — **تمر على كل غرفة وتقرأ من ROOM_MEP_PROFILES عدد كل نوع فيش:**

```typescript
function deriveElectricalOutlets(config: SmartBuildingConfig): MEPDerivedItem[] {
  const items: MEPDerivedItem[] = [];

  for (const floor of config.floors) {
    if (floor.type === "ROOF") continue;

    for (const room of floor.rooms) {
      const profile = ROOM_MEP_PROFILES[room.type as RoomType];
      if (!profile) continue;

      const roomLabel = room.name || room.type;

      // ─── أفياش عادية 13A ───
      if (profile.outlets13A > 0) {
        const p = getMEPDefaultPrice("ELECTRICAL", "outlet_13a");
        items.push({
          category: "ELECTRICAL",
          subCategory: "power_outlets",
          itemType: "outlet_13a",
          name: `أفياش 13A مزدوج - ${roomLabel}`,
          floorId: floor.id, floorName: floor.name,
          roomId: room.id, roomName: roomLabel,
          scope: "per_room",
          groupKey: "electrical_power",
          quantity: profile.outlets13A,
          unit: "نقطة",
          materialPrice: p.materialPrice, laborPrice: p.laborPrice, wastagePercent: p.wastagePercent,
          calculationData: { roomType: room.type, standard: "SBC" },
          sourceFormula: `${room.type} → ${profile.outlets13A} أفياش 13A`,
          specData: { rating: "13A", wireSize: "2.5mm²", type: "double" },
          qualityLevel: "standard",
        });
      }

      // ─── فيش مكيف 20A ───
      if (profile.outlets20A_AC > 0) {
        const p = getMEPDefaultPrice("ELECTRICAL", "outlet_20a_ac");
        items.push({
          category: "ELECTRICAL",
          subCategory: "power_outlets",
          itemType: "outlet_20a_ac",
          name: `فيش مكيف 20A - ${roomLabel}`,
          floorId: floor.id, floorName: floor.name,
          roomId: room.id, roomName: roomLabel,
          scope: "per_room",
          groupKey: "electrical_power",
          quantity: profile.outlets20A_AC,
          unit: "نقطة",
          materialPrice: p.materialPrice, laborPrice: p.laborPrice, wastagePercent: p.wastagePercent,
          calculationData: { roomType: room.type },
          sourceFormula: `${room.type} → فيش مكيف مخصص`,
          specData: { rating: "20A", wireSize: "4mm²", type: "dedicated" },
          qualityLevel: "standard",
        });
      }

      // ─── فيش سخان 20A (حمامات) ───
      if (profile.outlets20A_heater > 0) {
        const p = getMEPDefaultPrice("ELECTRICAL", "outlet_20a_heater");
        items.push({
          category: "ELECTRICAL",
          subCategory: "power_outlets",
          itemType: "outlet_20a_heater",
          name: `فيش سخان 20A - ${roomLabel}`,
          floorId: floor.id, floorName: floor.name,
          roomId: room.id, roomName: roomLabel,
          scope: "per_room", groupKey: "electrical_power",
          quantity: profile.outlets20A_heater, unit: "نقطة",
          materialPrice: p.materialPrice, laborPrice: p.laborPrice, wastagePercent: p.wastagePercent,
          calculationData: { roomType: room.type },
          sourceFormula: `حمام → فيش سخان مخصص`,
          specData: { rating: "20A", wireSize: "4mm²" },
          qualityLevel: "standard",
        });
      }

      // ─── فيش فرن 32A (مطبخ) ───
      if (profile.outlets32A_oven > 0) {
        const p = getMEPDefaultPrice("ELECTRICAL", "outlet_32a_oven");
        items.push({
          category: "ELECTRICAL",
          subCategory: "power_outlets",
          itemType: "outlet_32a_oven",
          name: `فيش فرن كهربائي 32A - ${roomLabel}`,
          floorId: floor.id, floorName: floor.name,
          roomId: room.id, roomName: roomLabel,
          scope: "per_room", groupKey: "electrical_power",
          quantity: profile.outlets32A_oven, unit: "نقطة",
          materialPrice: p.materialPrice, laborPrice: p.laborPrice, wastagePercent: p.wastagePercent,
          calculationData: { roomType: room.type },
          sourceFormula: `مطبخ → فيش فرن مخصص`,
          specData: { rating: "32A", wireSize: "6mm²" },
          qualityLevel: "standard",
        });
      }

      // ─── فيش غسالة 20A (غسيل) ───
      if (profile.outlets20A_washer > 0) {
        const p = getMEPDefaultPrice("ELECTRICAL", "outlet_20a_washer");
        items.push({
          category: "ELECTRICAL",
          subCategory: "power_outlets",
          itemType: "outlet_20a_washer",
          name: `فيش غسالة 20A - ${roomLabel}`,
          floorId: floor.id, floorName: floor.name,
          roomId: room.id, roomName: roomLabel,
          scope: "per_room", groupKey: "electrical_power",
          quantity: profile.outlets20A_washer, unit: "نقطة",
          materialPrice: p.materialPrice, laborPrice: p.laborPrice, wastagePercent: p.wastagePercent,
          calculationData: { roomType: room.type },
          sourceFormula: `غسيل → فيش غسالة مخصص`,
          specData: { rating: "20A", wireSize: "4mm²" },
          qualityLevel: "standard",
        });
      }
    }
  }

  return items;
}
```

---

## المرحلة 3.4: اشتقاق الكيبلات واللوحات

أنشئ `deriveElectricalCablesAndPanels` — **تجمع نقاط كل طابق → تحسب الأسلاك والدوائر واللوحات:**

هذه الدالة تمر على النتائج السابقة (الإنارة والأفياش) وتحسب:
1. **أسلاك الإنارة 1.5mm²** = عدد نقاط الإنارة × متوسط 4 م × 3 (فاز+نيوترال+أرضي)
2. **أسلاك الأفياش 2.5mm²** = عدد أفياش 13A × متوسط 6 م × 3
3. **أسلاك المكيفات 4mm²** = عدد أفياش 20A × متوسط 10 م × 3
4. **أسلاك ثقيلة 6mm²** = عدد أفياش 32A × متوسط 12 م × 3
5. **عدد الدوائر/طابق** = (إنارة÷8) + (أفياش÷6) + مكيفات + سخانات + فرن
6. **عدد الأقطاب** = دوائر × 1 أو 2 + 30% احتياطي → اختيار حجم اللوحة
7. **كيبل تغذية** = مسافة من اللوحة الرئيسية + (رقم الطابق × ارتفاع الطابق)

**اكتب هذه الدالة بالكامل — تمر على كل طابق وتحسب الأسلاك والكيبلات واللوحات. تأخذ المعلومات من config.floors مباشرة (عدد الغرف وأنواعها) ومن ROOM_MEP_PROFILES.**

**المسافة المقدرة للسلك/نقطة:**
- إنارة: متوسط 4 م.ط × 3 أسلاك
- فيش عادي: متوسط 6 م.ط × 3 أسلاك
- فيش مكيف: متوسط 10 م.ط × 3 أسلاك
- فيش فرن: متوسط 12 م.ط × 3 أسلاك

**الكيبل الرئيسي للطابق:**
- المسافة = 10 م (عداد للوحة) + (رقم الطابق × ارتفاع الطابق) + 5 م فائض
- المقاس = حسب إجمالي الحمل (استخدم selectCableSize)

**اللوحة الفرعية:**
- عدد الأقطاب = (دوائر إنارة × 1) + (دوائر أفياش × 1) + (مكيفات × 2) + (سخانات × 2) + (أفران × 2) + 30% احتياطي
- اختر: 12 أو 18 أو 24 أو 36 قطب

**أضف أيضاً: لوحة رئيسية واحدة للمبنى (scope: per_building).**

---

## المرحلة 3.5: اشتقاق السباكة

أنشئ الدوال التالية:

### `derivePlumbingFixtures` — الأجهزة الصحية
لكل غرفة حمام/مطبخ/غسيل → قراءة `plumbingFixtures` من Profile → إنشاء بند لكل جهاز (مرحاض، مغسلة، دش، حوض مطبخ...).

### `derivePlumbingPipes` — المواسير
- **تغذية بارد:** عدد نقاط التغذية (كل حمام + مطبخ + غسيل) × متوسط 5 م.ط PPR 20mm
- **تغذية ساخن:** نفس العدد × 5 م.ط PPR 20mm
- **صرف 50mm:** مغاسل + دشات × 3 م.ط
- **صرف 100mm:** مراحيض × 4 م.ط
- **ماسورة رئيسية تغذية:** مقاس من selectSupplyPipeSize(إجمالي FU)
- **رايزر صرف:** عدد الطوابق × ارتفاع الطابق × عدد الأعمدة (تقدير: عمود صرف لكل 3 حمامات)

### `deriveTanksAndPumps` — الخزانات والمضخات
- **خزان أرضي:** عدد الأشخاص (estimateOccupants) × 250 لتر × 1.5 يوم ÷ 1000 = م³
- **خزان علوي:** عدد الأشخاص × 250 × 0.5 ÷ 1000 = م³
- **مضخة رفع:** إذا عدد الطوابق > 1 → مضخة 1HP. إذا > 3 → مضخة 2HP

### `deriveManholes` — غرف التفتيش
- عدد الحمامات ÷ 2 (غرفة لكل حمامين) + محيط المبنى ÷ 15 + 2 (مدخل ومخرج)

### `deriveHeaters` — السخانات
- إذا عدد الحمامات ≤ 3 → سخان 50 لتر لكل حمام
- إذا > 3 → سخان مركزي 80 لتر لكل حمامين

---

## المرحلة 3.6: اشتقاق التكييف

### `deriveACUnits` — وحدات التكييف
لكل غرفة بها `needsAC: true`:
- الحمل = area × coolingFactorBTU
- الطن = الحمل ÷ 12000
- الحجم القياسي = selectACSize(الطن)
- بند: وحدة سبليت بالحجم المناسب

### `deriveRefrigerantPipes` — مواسير التبريد
لكل وحدة تكييف:
- الطول = 5 م (أساس) + (رقم الطابق × ارتفاع الطابق) + 2 م فائض
- المقاسات = selectRefrigerantPipes(الطن)
- بند: مواسير نحاس + عزل + تصريف مكثفات

### `deriveVentilation` — مراوح الشفط
لكل حمام → مروحة شفط حمام
لكل مطبخ → مروحة شفط مطبخ

---

## المرحلة 3.7: اشتقاق الحريق

### `deriveFirefighting` — حسب نوع المبنى

**القواعد:**

```
إذا RESIDENTIAL:
  - طفايات: كل 200 م² على الأقل
  - إنذار: فقط إذا عدد الطوابق > 3
  - رشاشات: لا (إلا إذا برج > 8 طوابق)
  - صناديق حريق: فقط إذا عدد الطوابق > 3

إذا COMMERCIAL أو MIXED:
  - كاشفات دخان: كل 70 م²
  - كاشفات حرارة: في المطابخ
  - نقاط يدوية: 2 لكل طابق
  - صفارات: 2 لكل طابق
  - رشاشات: كل 12 م²
  - صناديق حريق: كل 800 م²
  - طفايات: كل 200 م²
  - مضخة حريق + جوكي + خزان حريق
  - لوحة إنذار مركزية

إذا INDUSTRIAL:
  - نفس التجاري + رشاشات أكثف (كل 9 م²)
```

---

## المرحلة 3.8: اشتقاق التيار الخفيف والأنظمة الخاصة

### `deriveLowCurrent`
- **نقاط شبكة:** لكل غرفة بها networkPoints > 0
- **كاميرات:** عدد المداخل + (محيط المبنى ÷ 30) — تقدير
- **انتركم:** إذا عمارة (عدد شقق > 1) → وحدة خارجية + وحدة داخلية لكل شقة

### `deriveSpecialSystems`
- **مصعد:** إذا عدد الطوابق ≥ 5 → مصعد 6 أشخاص. إذا ≥ 10 → مصعد 8 أشخاص
- **مولد:** إذا تجاري أو عدد الطوابق ≥ 8

### `deriveExteriorMEP`
- **إنارة خارجية:** (fenceLength ÷ 8) نقاط إنارة على السور + (gardenArea ÷ 25) إنارة حديقة
- **أفياش خارجية:** 2 نقاط فيش خارجي مقاوم للماء (واحدة أمام + واحدة خلف)

---

## المرحلة 3.9: دمج المشتق والمحفوظ

**الملف الجديد:** `apps/web/modules/saas/pricing/lib/mep-merge.ts`

انسخ نمط `merge-quantities.ts` الموجود:

```typescript
import type { MEPDerivedItem, MEPMergedItem } from "../types/mep";

interface SavedMEPItem {
  id: string;
  category: string;
  subCategory: string;
  itemType: string | null;
  floorId: string | null;
  roomId: string | null;
  scope: string;
  quantity: number;
  dataSource: string;
  isEnabled: boolean;
  // ... باقي الحقول
  [key: string]: any;
}

/**
 * دمج البنود المشتقة من المحرك مع البنود المحفوظة في قاعدة البيانات
 *
 * القواعد:
 * 1. بند في المشتق والمحفوظ → استخدم المحفوظ (المستخدم قد عدّل)
 * 2. بند في المشتق فقط → إضافة كجديد
 * 3. بند في المحفوظ فقط (manual) → إبقاء كبند يدوي
 *
 * مفتاح المطابقة: category + subCategory + itemType + floorId + roomId
 */
export function mergeMEPQuantities(
  derived: MEPDerivedItem[],
  saved: SavedMEPItem[]
): MEPMergedItem[] {
  const merged: MEPMergedItem[] = [];
  const matchedSavedIds = new Set<string>();

  for (const d of derived) {
    const matchKey = `${d.category}|${d.subCategory}|${d.itemType}|${d.floorId}|${d.roomId}`;

    const savedMatch = saved.find(s => {
      const sKey = `${s.category}|${s.subCategory}|${s.itemType}|${s.floorId}|${s.roomId}`;
      return sKey === matchKey && !matchedSavedIds.has(s.id);
    });

    if (savedMatch) {
      matchedSavedIds.add(savedMatch.id);
      const isManualOverride = savedMatch.dataSource === "manual" &&
        Math.abs(Number(savedMatch.quantity) - d.quantity) > 0.01;

      merged.push({
        ...d,
        id: savedMatch.id,
        isNew: false,
        isSaved: true,
        isManualOverride,
        isEnabled: savedMatch.isEnabled,
        savedQuantity: Number(savedMatch.quantity),
        derivedQuantity: d.quantity,
        quantity: Number(savedMatch.quantity), // استخدم المحفوظ
        materialPrice: Number(savedMatch.materialPrice) || d.materialPrice,
        laborPrice: Number(savedMatch.laborPrice) || d.laborPrice,
        totalCost: Number(savedMatch.totalCost),
        materialCost: Number(savedMatch.materialCost),
        laborCost: Number(savedMatch.laborCost),
        dataSource: savedMatch.dataSource as any,
      });
    } else {
      const wastageMultiplier = 1 + d.wastagePercent / 100;
      const materialCost = d.quantity * d.materialPrice * wastageMultiplier;
      const laborCost = d.quantity * d.laborPrice;

      merged.push({
        ...d,
        id: undefined,
        isNew: true,
        isSaved: false,
        isManualOverride: false,
        isEnabled: true,
        derivedQuantity: d.quantity,
        totalCost: materialCost + laborCost,
        materialCost,
        laborCost,
        dataSource: "auto",
      });
    }
  }

  // بنود محفوظة يدوية لم تتطابق مع المشتق
  for (const s of saved) {
    if (!matchedSavedIds.has(s.id) && s.dataSource === "manual") {
      merged.push({
        category: s.category as any,
        subCategory: s.subCategory,
        itemType: s.itemType || "",
        name: s.name,
        floorId: s.floorId,
        floorName: s.floorName,
        roomId: s.roomId,
        roomName: s.roomName,
        scope: s.scope as any,
        groupKey: s.groupKey || "",
        quantity: Number(s.quantity),
        unit: s.unit,
        materialPrice: Number(s.materialPrice),
        laborPrice: Number(s.laborPrice),
        wastagePercent: Number(s.wastagePercent),
        calculationData: s.calculationData || {},
        sourceFormula: s.sourceFormula || "",
        specData: s.specData || {},
        qualityLevel: (s.qualityLevel || "standard") as any,
        id: s.id,
        isNew: false,
        isSaved: true,
        isManualOverride: true,
        isEnabled: s.isEnabled,
        totalCost: Number(s.totalCost),
        materialCost: Number(s.materialCost),
        laborCost: Number(s.laborCost),
        dataSource: "manual",
      });
    }
  }

  return merged;
}
```

**معايير النجاح للمرحلة 3:**
- `mep-derivation-engine.ts` يحتوي على جميع دوال الاشتقاق (~1,200-1,800 سطر)
- `mep-merge.ts` يحتوي على دالة الدمج (~150 سطر)
- الاستيرادات من `mep-room-profiles.ts` و `mep-prices.ts` تعمل
- `pnpm type-check` ينجح
- اختبار يدوي: استدعاء `deriveMEPQuantities` مع buildingConfig تجريبي يُرجع بنود منطقية

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 4: واجهة المستخدم — لوحة MEP الرئيسية
# Phase 4: UI — MEP Dashboard & Main Editor
# ═══════════════════════════════════════════════════════════════

## السياق

الآن نبني الواجهة. **المرجع:** ادرس `QuantitiesDashboard.tsx` و `FinishingItemsEditor.tsx` لفهم نمط UI المتبع.

**المكونات المطلوبة في هذه المرحلة:**
1. `MEPBuildingRequired.tsx` — رسالة عندما لا يوجد buildingConfig
2. `MEPSummaryBar.tsx` — شريط ملخص بالأرقام
3. `MEPDashboard.tsx` — اللوحة الرئيسية مع بطاقات الفئات
4. `MEPCategorySection.tsx` — أكورديون لكل فئة
5. `MEPItemRow.tsx` — صف بند واحد
6. تحديث `MEPItemsEditor.tsx` — المكون الحاوي

**النمط:** RTL، shadcn/ui، Tailwind، lucide-react icons.

## المرحلة 4.1: MEPBuildingRequired

**الملف الجديد:** `apps/web/modules/saas/pricing/components/mep/MEPBuildingRequired.tsx`

مكون بسيط يعرض رسالة: "لاشتقاق بنود MEP تلقائياً، أنشئ إعدادات المبنى من قسم التشطيبات" مع زر يوجه لصفحة التشطيبات.

استخدم: `Card` + `Button` + أيقونة `Building` من lucide-react.

## المرحلة 4.2: MEPSummaryBar

**الملف الجديد:** `apps/web/modules/saas/pricing/components/mep/MEPSummaryBar.tsx`

شريط أفقي يعرض:
- إجمالي تكلفة MEP
- عدد البنود
- عدد البنود المفعلة vs المعطلة

انسخ نمط `BuildingSummaryBar.tsx`.

## المرحلة 4.3: MEPDashboard

**الملف الجديد:** `apps/web/modules/saas/pricing/components/mep/MEPDashboard.tsx`

يعرض:
1. شريط الملخص (`MEPSummaryBar`)
2. 6 بطاقات (واحدة لكل فئة) تعرض: اسم الفئة، الأيقونة، عدد البنود، إجمالي التكلفة، نسبة من الإجمالي
3. أزرار: "إعادة اشتقاق" + "إضافة بند يدوي"
4. أقسام الفئات (`MEPCategorySection` لكل فئة)

**Props:**
```typescript
interface MEPDashboardProps {
  mergedItems: MEPMergedItem[];
  onSave: (items: MEPMergedItem[]) => void;
  onRederive: () => void;
  studyId: string;
  organizationId: string;
}
```

## المرحلة 4.4: MEPCategorySection

**الملف الجديد:** `apps/web/modules/saas/pricing/components/mep/MEPCategorySection.tsx`

أكورديون لفئة واحدة (مثلاً: الأعمال الكهربائية). يعرض:
- عنوان الفئة مع أيقونة ولون
- عدد البنود والتكلفة
- قائمة الفئات الفرعية مع بنودها
- كل بند في `MEPItemRow`

استخدم `Collapsible` أو `Accordion` من shadcn/ui.

## المرحلة 4.5: MEPItemRow

**الملف الجديد:** `apps/web/modules/saas/pricing/components/mep/MEPItemRow.tsx`

صف واحد لبند MEP يعرض:
- Checkbox لتفعيل/تعطيل (isEnabled)
- اسم البند
- الكمية (قابلة للتعديل inline)
- الوحدة
- سعر الوحدة
- الإجمالي
- علامة "مشتق تلقائياً" أو "يدوي"
- زر تعديل (يفتح MEPItemDialog)
- المعادلة المستخدمة (sourceFormula) كـ tooltip

## المرحلة 4.6: تحديث MEPItemsEditor

**الملف:** `apps/web/modules/saas/pricing/components/studies/MEPItemsEditor.tsx`

أعد كتابة هذا المكون ليستخدم:

```typescript
export default function MEPItemsEditor({ study, organizationId }: Props) {
  // 1. جلب buildingConfig من study.buildingConfig
  const buildingConfig = study.buildingConfig as SmartBuildingConfig | null;

  // 2. إذا لا يوجد buildingConfig → عرض MEPBuildingRequired
  if (!buildingConfig) return <MEPBuildingRequired studyId={study.id} />;

  // 3. اشتقاق بنود MEP
  const derived = useMemo(() =>
    deriveMEPQuantities(buildingConfig, study.projectType || "RESIDENTIAL"),
    [buildingConfig, study.projectType]
  );

  // 4. جلب البنود المحفوظة من API
  // ... useQuery لجلب mepItems المحفوظة

  // 5. دمج
  const merged = useMemo(() =>
    mergeMEPQuantities(derived, savedItems || []),
    [derived, savedItems]
  );

  // 6. عرض MEPDashboard
  return <MEPDashboard mergedItems={merged} ... />;
}
```

**معايير النجاح:**
- صفحة MEP تعرض البنود المشتقة تلقائياً من buildingConfig
- البنود مجمعة بالفئات (كهرباء، سباكة، تكييف...)
- يمكن تفعيل/تعطيل كل بند
- يعرض "أنشئ إعدادات المبنى" إذا لم يوجد buildingConfig

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 5: حوار التعديل والإضافة اليدوية
# Phase 5: Edit Dialog & Manual Item Addition
# ═══════════════════════════════════════════════════════════════

## المرحلة 5.1: MEPItemDialog

**الملف الجديد:** `apps/web/modules/saas/pricing/components/mep/MEPItemDialog.tsx`

حوار لتعديل بند MEP. يعرض:
- اسم البند (قابل للتعديل)
- الفئة والفئة الفرعية (dropdown)
- الكمية والوحدة
- سعر المواد وسعر المصنعية
- نسبة الهدر
- المواصفات (specData)
- المعادلة المستخدمة (للقراءة فقط إذا auto)
- مستوى الجودة (economy/standard/premium)
- زر حفظ → يستدعي mepItem.update

**انسخ نمط** `PaintItemDialog.tsx` لكن أبسط بكثير (حوار واحد عام لجميع أنواع MEP).

## المرحلة 5.2: MEPManualAdder

**الملف الجديد:** `apps/web/modules/saas/pricing/components/mep/MEPManualAdder.tsx`

مكون لإضافة بند يدوي:
1. اختيار الفئة (dropdown)
2. اختيار الفئة الفرعية
3. الاسم والكمية والأسعار
4. حفظ → يستدعي mepItem.create مع dataSource="manual"

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 6: التكامل مع Cascade
# Phase 6: Cascade Integration
# ═══════════════════════════════════════════════════════════════

## السياق

عندما يغير المستخدم `buildingConfig` (يضيف غرفة، يغير مساحة...) من قسم التشطيبات → يجب إعادة اشتقاق MEP تلقائياً.

**الملف:** `packages/api/modules/quantities/procedures/building-config-update.ts`

## المرحلة 6.1: تحديث building-config-update

اقرأ الملف الموجود. بعد الكود الذي يحدث عناصر التشطيبات (Cascade الموجود)، أضف:

```typescript
// ─── إعادة اشتقاق MEP ───
// 1. استيراد المحرك
import { deriveMEPQuantities } from "../../../../apps/web/modules/saas/pricing/lib/mep-derivation-engine";

// ⚠️ ملاحظة: المحرك client-side. إذا لا يمكن استيراده في server-side،
// استخدم نسخة server-compatible أو انقل الحساب للـ frontend
// والخيار الأبسط: حذف البنود auto وإعادة إنشائها من frontend

// 2. حذف البنود التلقائية القديمة
await db.mEPItem.deleteMany({
  where: {
    costStudyId,
    dataSource: "auto",
  },
});

// 3. إعادة حساب المجاميع (البنود اليدوية تبقى)
await recalculateCostStudyTotals(costStudyId);
```

**الخيار المفضل (أبسط وأنظف):**
بدلاً من تشغيل المحرك على السيرفر، فقط احذف البنود التلقائية. عندما يفتح المستخدم صفحة MEP، سيُعاد الاشتقاق تلقائياً من الـ frontend (لأن MEPItemsEditor يستدعي deriveMEPQuantities في useMemo).

**هذا أبسط ويعمل لأن:**
- الـ frontend يشتق → يرى بنود جديدة (isNew: true) → يعرضها → المستخدم يحفظ

**أضف إشعار Cascade:** في الـ frontend، إذا رأى بنود جديدة غير محفوظة → يعرض شريط: "تم تحديث إعدادات المبنى. اضغط حفظ لتحديث بنود MEP".

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 7: الترجمة
# Phase 7: Internationalization (i18n)
# ═══════════════════════════════════════════════════════════════

## المرحلة 7.1: إضافة مفاتيح الترجمة

**الملفات:**
- `apps/web/locales/ar/pricing.json`
- `apps/web/locales/en/pricing.json`

أضف تحت `studies.mep`:

```json
{
  "studies": {
    "mep": {
      "title": "الأعمال الكهروميكانيكية",
      "titleEn": "MEP Works",
      "subtitle": "الكهرباء والسباكة والتكييف ومكافحة الحريق",
      "totalCost": "إجمالي تكلفة MEP",
      "itemCount": "عدد البنود",
      "enabledCount": "بنود مفعلة",
      "disabledCount": "بنود معطلة",
      "rederive": "إعادة اشتقاق",
      "addManual": "إضافة بند يدوي",
      "saveAll": "حفظ الكل",
      "buildingRequired": {
        "title": "إعدادات المبنى مطلوبة",
        "description": "لاشتقاق بنود MEP تلقائياً، أنشئ إعدادات المبنى من قسم التشطيبات أولاً",
        "action": "إنشاء إعدادات المبنى"
      },
      "cascade": {
        "updated": "تم تحديث إعدادات المبنى",
        "savePrompt": "اضغط حفظ لتحديث بنود MEP"
      },
      "item": {
        "autoDerived": "مشتق تلقائياً",
        "manual": "يدوي",
        "estimated": "تقديري",
        "enabled": "مفعل",
        "disabled": "معطل",
        "formula": "المعادلة",
        "specs": "المواصفات",
        "edit": "تعديل",
        "delete": "حذف"
      },
      "categories": {
        "ELECTRICAL": "الأعمال الكهربائية",
        "PLUMBING": "الأعمال الصحية",
        "HVAC": "التكييف والتهوية",
        "FIREFIGHTING": "مكافحة الحريق",
        "LOW_CURRENT": "التيار الخفيف",
        "SPECIAL": "أنظمة خاصة"
      }
    }
  }
}
```

أضف المقابل الإنجليزي في `en/pricing.json`.

---
---
---

# ═══════════════════════════════════════════════════════════════
# المرحلة 8: الاختبار والتنظيف
# Phase 8: Testing & Cleanup
# ═══════════════════════════════════════════════════════════════

## المرحلة 8.1: اختبار شامل

1. أنشئ دراسة تكلفة جديدة
2. اذهب لقسم التشطيبات → أنشئ إعدادات مبنى:
   - مبنى سكني (فيلا)
   - 3 طوابق: أرضي + أول + سطح
   - أرضي: صالة 6×5 + مطبخ 4×3.5 + حمام 3×2.5 + غرفة نوم 5×4
   - أول: 3 غرف نوم + 2 حمام + ممر
3. اذهب لقسم MEP
4. تحقق أن البنود المشتقة منطقية:
   - الصالة: 15 سبوت + 1 نجفة + 10 أفياش + 1 مكيف 2.5 طن
   - الحمام: 3 سبوت + 1 فيش + 1 سخان + مرحاض + مغسلة + دش + مروحة شفط
   - المطبخ: 9 سبوت + 6 أفياش + 1 فرن 32A + مغسلة + مروحة شفط + 1 مكيف

5. غيّر مساحة غرفة في التشطيبات → تحقق أن MEP يتحدث

## المرحلة 8.2: تحقق من الأرقام

```
فيلا 300 م² — المتوقع تقريباً:
├── كهرباء:
│   ├── إنارة: ~60-80 نقطة
│   ├── أفياش: ~50-70 نقطة
│   ├── لوحات: 3-4 (رئيسية + 2-3 فرعية)
│   └── تكلفة: ~25,000-40,000 ر.س
│
├── سباكة:
│   ├── أجهزة صحية: ~15-20 جهاز
│   ├── خزان أرضي: 3-5 م³
│   ├── خزان علوي: 1-2 م³
│   └── تكلفة: ~20,000-35,000 ر.س
│
├── تكييف:
│   ├── وحدات: 5-8 (12-18 طن إجمالي)
│   ├── مراوح شفط: 3-5
│   └── تكلفة: ~15,000-30,000 ر.س
│
├── حريق (سكني):
│   └── طفايات فقط: ~4-6
│
└── الإجمالي: ~70,000-120,000 ر.س (بدون أجهزة التكييف والصحية)
```

## المرحلة 8.3: تنظيف

1. احذف أي `console.log` debug
2. تحقق من `pnpm type-check` ينجح
3. تحقق من `pnpm build` ينجح
4. تأكد من عدم كسر أي وظيفة موجودة

---

# ═══════════════════════════════════════════════════════════════
# ملخص الملفات
# ═══════════════════════════════════════════════════════════════

## ملفات جديدة (16+)

```
packages/database/prisma/schema.prisma                          (تعديل)
packages/database/prisma/queries/cost-studies.ts                 (تعديل)
packages/api/modules/quantities/procedures/mep-item-update.ts    (جديد)
packages/api/modules/quantities/procedures/mep-item-delete.ts    (جديد)
packages/api/modules/quantities/procedures/mep-item-toggle.ts    (جديد)
packages/api/modules/quantities/router.ts                        (تعديل)

apps/web/modules/saas/pricing/types/mep.ts                       (جديد)
apps/web/modules/saas/pricing/lib/mep-categories.ts              (جديد)
apps/web/modules/saas/pricing/lib/mep-room-profiles.ts           (جديد)
apps/web/modules/saas/pricing/lib/mep-prices.ts                  (جديد)
apps/web/modules/saas/pricing/lib/mep-derivation-engine.ts       (جديد)
apps/web/modules/saas/pricing/lib/mep-merge.ts                   (جديد)

apps/web/modules/saas/pricing/components/mep/MEPBuildingRequired.tsx  (جديد)
apps/web/modules/saas/pricing/components/mep/MEPSummaryBar.tsx       (جديد)
apps/web/modules/saas/pricing/components/mep/MEPDashboard.tsx        (جديد)
apps/web/modules/saas/pricing/components/mep/MEPCategorySection.tsx  (جديد)
apps/web/modules/saas/pricing/components/mep/MEPItemRow.tsx          (جديد)
apps/web/modules/saas/pricing/components/mep/MEPItemDialog.tsx       (جديد)
apps/web/modules/saas/pricing/components/mep/MEPManualAdder.tsx      (جديد)

apps/web/modules/saas/pricing/components/studies/MEPItemsEditor.tsx   (إعادة كتابة)
apps/web/locales/ar/pricing.json                                      (تعديل)
apps/web/locales/en/pricing.json                                      (تعديل)
```

## الأمر النهائي بعد كل المراحل

```bash
pnpm --filter database db:push
pnpm --filter database generate
node packages/database/prisma/fix-zod-decimal.mjs
pnpm type-check
pnpm build
```

---

> **تذكير أخير:** المبدأ الأساسي هو أن buildingConfig (بيانات المبنى من قسم التشطيبات) هو مصدر البيانات الوحيد لـ MEP. المستخدم لا يدخل شيء إضافي — إلا إذا أراد تعديل بند محدد أو إضافة بند يدوي.
