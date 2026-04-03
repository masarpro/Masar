# برومبت: إعادة هيكلة فئات المصروفات + تصميم نموذج إضافة مصروف

## الهدف
استبدال نظام فئات المصروفات الحالي (OrgExpenseCategory enum — 26 قيمة مسطحة) بنظام هرمي شامل خاص بالمقاولات (39 فئة رئيسية — 396 فئة فرعية) مع إعادة تصميم نموذج إضافة المصروف ليكون أبسط وأفضل على الجوال.

---

## المرحلة 0 — قراءة الملفات (إلزامي قبل أي تعديل)

```bash
# Schema
cat packages/database/prisma/schema.prisma | grep -A 30 "model FinanceExpense"
cat packages/database/prisma/schema.prisma | grep -A 30 "enum OrgExpenseCategory"

# Auto-journal mapping
cat packages/api/lib/accounting/auto-journal.ts | head -100
grep -n "EXPENSE_CATEGORY_TO_ACCOUNT_CODE" packages/api/lib/accounting/auto-journal.ts
grep -rn "EXPENSE_CATEGORY_TO_ACCOUNT_CODE" packages/api/ packages/database/

# Expense procedures
cat packages/api/modules/finance/procedures/expenses.ts | head -80
grep -n "category" packages/api/modules/finance/procedures/expenses.ts

# Frontend form
cat apps/web/modules/saas/finance/components/expenses/AddExpenseDialog.tsx | head -50
wc -l apps/web/modules/saas/finance/components/expenses/AddExpenseDialog.tsx

# Translation keys
grep -n "expense" apps/web/messages/ar.json | head -40

# Project expenses (also uses categories)
grep -rn "ExpenseCategory\|OrgExpenseCategory" packages/database/prisma/schema.prisma
grep -rn "category" apps/web/modules/saas/finance/components/expenses/

# Company expenses (facility)
grep -rn "CompanyExpenseCategory" packages/database/prisma/schema.prisma
cat packages/database/prisma/schema.prisma | grep -A 20 "enum CompanyExpenseCategory"

# VAT exempt categories
grep -n "VAT_EXEMPT\|vatExempt\|vat_exempt" packages/api/lib/accounting/auto-journal.ts
```

---

## المرحلة 1 — ملف الثوابت: فئات المصروفات الهرمية

### أنشئ ملف: `packages/utils/src/expense-categories.ts`

هذا الملف هو **المرجع الوحيد** لكل فئات المصروفات في النظام. يُستخدم في Backend و Frontend.

```typescript
// packages/utils/src/expense-categories.ts

export interface ExpenseSubcategory {
  id: string;           // e.g., "CONCRETE_READY_MIX"
  nameAr: string;       // "خرسانة جاهزة"
  nameEn: string;       // "Ready Mix Concrete"
  isLabor: boolean;     // true if this is a labor subcategory
}

export interface ExpenseMainCategory {
  id: string;            // e.g., "CONCRETE_STRUCTURAL"
  nameAr: string;        // "خرسانة وهيكل إنشائي"
  nameEn: string;        // "Concrete & Structural"
  accountCode: string;   // كود الحساب المحاسبي (e.g., "5100")
  isVatExempt: boolean;  // هل معفاة من VAT
  subcategories: ExpenseSubcategory[];
}

export const EXPENSE_CATEGORIES: ExpenseMainCategory[] = [
  // ═══════════════════════════════════════
  // تكاليف مشاريع مباشرة (5xxx)
  // ═══════════════════════════════════════
  {
    id: "CONCRETE_STRUCTURAL",
    nameAr: "خرسانة وهيكل إنشائي",
    nameEn: "Concrete & Structural",
    accountCode: "5100",
    isVatExempt: false,
    subcategories: [
      { id: "READY_MIX", nameAr: "خرسانة جاهزة", nameEn: "Ready Mix Concrete", isLabor: false },
      { id: "PLAIN_CONCRETE", nameAr: "خرسانة نظافة", nameEn: "Plain Concrete", isLabor: false },
      { id: "PRECAST", nameAr: "بريكاست (خرسانة مسبقة الصنع)", nameEn: "Precast Concrete", isLabor: false },
      { id: "CEMENT", nameAr: "أسمنت", nameEn: "Cement", isLabor: false },
      { id: "SAND_AGGREGATE", nameAr: "رمل وبحص (ركام)", nameEn: "Sand & Aggregate", isLabor: false },
      { id: "CONCRETE_ADDITIVES", nameAr: "إضافات خرسانة", nameEn: "Concrete Additives", isLabor: false },
      { id: "EXPANSION_JOINTS", nameAr: "فواصل تمدد وصب", nameEn: "Expansion & Pour Joints", isLabor: false },
      { id: "PILES", nameAr: "خوازيق", nameEn: "Piles", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "REBAR",
    nameAr: "حديد تسليح",
    nameEn: "Reinforcing Steel",
    accountCode: "5100",
    isVatExempt: false,
    subcategories: [
      { id: "REBAR_STEEL", nameAr: "حديد تسليح", nameEn: "Rebar", isLabor: false },
      { id: "TIE_WIRE", nameAr: "سلك رباط", nameEn: "Tie Wire", isLabor: false },
      { id: "SPACERS", nameAr: "مباعد (سبيسر)", nameEn: "Spacers", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "BLOCKS_BRICKS",
    nameAr: "بلوك وطابوق",
    nameEn: "Blocks & Bricks",
    accountCode: "5100",
    isVatExempt: false,
    subcategories: [
      { id: "CMU_BLACK", nameAr: "بلوك أسود (خرساني)", nameEn: "CMU Black Block", isLabor: false },
      { id: "INSULATED_WHITE", nameAr: "بلوك أبيض عازل (سيبوركس)", nameEn: "Insulated White Block", isLabor: false },
      { id: "CLAY_RED", nameAr: "بلوك أحمر (فخاري)", nameEn: "Clay Red Block", isLabor: false },
      { id: "RED_BRICK", nameAr: "طابوق أحمر", nameEn: "Red Brick", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "TIMBER_FORMWORK",
    nameAr: "خشب وشدات",
    nameEn: "Timber & Formwork",
    accountCode: "5100",
    isVatExempt: false,
    subcategories: [
      { id: "FORM_TIMBER", nameAr: "خشب تطبيل (شدات)", nameEn: "Form Timber", isLabor: false },
      { id: "PLYWOOD", nameAr: "أبلكاش (بليوود)", nameEn: "Plywood", isLabor: false },
      { id: "METAL_FORMWORK", nameAr: "شدات معدنية", nameEn: "Metal Formwork", isLabor: false },
      { id: "SCAFFOLDING", nameAr: "سقالات", nameEn: "Scaffolding", isLabor: false },
      { id: "NAILS_BOLTS", nameAr: "مسامير وبراغي إنشائية", nameEn: "Nails & Structural Bolts", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "EXCAVATION_EARTHWORK",
    nameAr: "حفريات وأعمال تربة",
    nameEn: "Excavation & Earthwork",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "EXCAVATION", nameAr: "حفر", nameEn: "Excavation", isLabor: false },
      { id: "BACKFILL", nameAr: "ردم", nameEn: "Backfill", isLabor: false },
      { id: "DEBRIS_REMOVAL", nameAr: "نقل أنقاض (شيلة)", nameEn: "Debris Removal", isLabor: false },
      { id: "LEVELING_COMPACTION", nameAr: "تسوية ودمك", nameEn: "Leveling & Compaction", isLabor: false },
      { id: "SOIL_TEST", nameAr: "فحص تربة", nameEn: "Soil Test", isLabor: false },
      { id: "DEWATERING", nameAr: "نزح مياه جوفية", nameEn: "Dewatering", isLabor: false },
      { id: "SHORING", nameAr: "سند جوانب", nameEn: "Shoring", isLabor: false },
      { id: "DEMOLITION", nameAr: "هدم وتكسير", nameEn: "Demolition", isLabor: false },
      { id: "BLACK_PLASTIC", nameAr: "بلاستيك أسود (مشمع)", nameEn: "Black Plastic Sheet", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "WATERPROOFING_INSULATION",
    nameAr: "عزل",
    nameEn: "Waterproofing & Insulation",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "WP_FOUNDATION", nameAr: "عزل مائي أساسات", nameEn: "Foundation Waterproofing", isLabor: false },
      { id: "WP_ROOF", nameAr: "عزل مائي أسطح", nameEn: "Roof Waterproofing", isLabor: false },
      { id: "WP_BATHROOM", nameAr: "عزل مائي حمامات", nameEn: "Bathroom Waterproofing", isLabor: false },
      { id: "WP_TANK", nameAr: "عزل مائي خزانات", nameEn: "Tank Waterproofing", isLabor: false },
      { id: "THERMAL_FOAM", nameAr: "عزل حراري (فوم)", nameEn: "Thermal Insulation (Foam)", isLabor: false },
      { id: "THERMAL_ROCKWOOL", nameAr: "عزل حراري (صوف صخري)", nameEn: "Thermal Insulation (Rockwool)", isLabor: false },
      { id: "THERMAL_POLYSTYRENE", nameAr: "عزل حراري (فلين / بولسترين)", nameEn: "Thermal Insulation (Polystyrene)", isLabor: false },
      { id: "ACOUSTIC", nameAr: "عزل صوتي", nameEn: "Acoustic Insulation", isLabor: false },
      { id: "MEMBRANE_ROLLS", nameAr: "رولات ممبرين", nameEn: "Membrane Rolls", isLabor: false },
      { id: "BITUMEN_PAINT", nameAr: "دهان بيتومين", nameEn: "Bitumen Paint", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "PLASTERING",
    nameAr: "لياسة وبياض",
    nameEn: "Plastering",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "INTERNAL_PLASTER", nameAr: "لياسة داخلية", nameEn: "Internal Plaster", isLabor: false },
      { id: "EXTERNAL_PLASTER", nameAr: "لياسة خارجية", nameEn: "External Plaster", isLabor: false },
      { id: "CEMENT_SCREED", nameAr: "بطحة أسمنتية", nameEn: "Cement Screed", isLabor: false },
      { id: "PLASTER_MESH", nameAr: "شبك لياسة", nameEn: "Plaster Mesh", isLabor: false },
      { id: "CORNER_BEAD", nameAr: "زوايا لياسة (كورنر بيد)", nameEn: "Corner Bead", isLabor: false },
      { id: "READY_MIX_MORTAR", nameAr: "مونة جاهزة", nameEn: "Ready Mix Mortar", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "GYPSUM_CEILINGS",
    nameAr: "جبس وأسقف",
    nameEn: "Gypsum & Ceilings",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "LOCAL_GYPSUM", nameAr: "جبس بلدي", nameEn: "Local Gypsum", isLabor: false },
      { id: "GYPSUM_BOARD", nameAr: "جبس بورد", nameEn: "Gypsum Board", isLabor: false },
      { id: "FRENCH_GYPSUM", nameAr: "جبس فرنسي (كرانيش)", nameEn: "French Gypsum (Cornices)", isLabor: false },
      { id: "SUSPENDED_CEILING", nameAr: "أسقف مستعارة", nameEn: "Suspended Ceiling", isLabor: false },
      { id: "GYPSUM_PROFILES", nameAr: "بروفايل ومستلزمات جبس بورد", nameEn: "Gypsum Board Profiles & Accessories", isLabor: false },
      { id: "COVE_LIGHT", nameAr: "كوف لايت (إنارة مخفية)", nameEn: "Cove Light (Hidden Lighting)", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "PAINTING",
    nameAr: "دهانات",
    nameEn: "Painting",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "INTERNAL_PAINT", nameAr: "دهان داخلي", nameEn: "Internal Paint", isLabor: false },
      { id: "EXTERNAL_PAINT", nameAr: "دهان خارجي", nameEn: "External Paint", isLabor: false },
      { id: "PRIMER", nameAr: "برايمر (أساس)", nameEn: "Primer", isLabor: false },
      { id: "PUTTY", nameAr: "معجون (سكيم كوت)", nameEn: "Putty (Skim Coat)", isLabor: false },
      { id: "GRAFIATO", nameAr: "جرافياتو", nameEn: "Grafiato", isLabor: false },
      { id: "EPOXY_PAINT", nameAr: "إيبوكسي", nameEn: "Epoxy", isLabor: false },
      { id: "MOISTURE_RESISTANT", nameAr: "دهان مقاوم رطوبة", nameEn: "Moisture Resistant Paint", isLabor: false },
      { id: "FIRE_PAINT", nameAr: "دهان حريق", nameEn: "Fire Retardant Paint", isLabor: false },
      { id: "WOOD_VARNISH", nameAr: "دهان خشب (ورنيش)", nameEn: "Wood Varnish", isLabor: false },
      { id: "METAL_PAINT", nameAr: "دهان حديد (سلاقون)", nameEn: "Metal Paint", isLabor: false },
      { id: "WALLPAPER", nameAr: "ورق جدران", nameEn: "Wallpaper", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "TILING_FLOORING",
    nameAr: "بلاط وأرضيات",
    nameEn: "Tiling & Flooring",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "CERAMIC", nameAr: "سيراميك", nameEn: "Ceramic", isLabor: false },
      { id: "PORCELAIN", nameAr: "بورسلان", nameEn: "Porcelain", isLabor: false },
      { id: "MARBLE", nameAr: "رخام", nameEn: "Marble", isLabor: false },
      { id: "GRANITE", nameAr: "جرانيت", nameEn: "Granite", isLabor: false },
      { id: "NATURAL_STONE", nameAr: "حجر طبيعي", nameEn: "Natural Stone", isLabor: false },
      { id: "PARQUET", nameAr: "باركيه", nameEn: "Parquet", isLabor: false },
      { id: "VINYL_PVC", nameAr: "فينيل (PVC)", nameEn: "Vinyl (PVC)", isLabor: false },
      { id: "EPOXY_FLOOR", nameAr: "إيبوكسي أرضيات", nameEn: "Epoxy Flooring", isLabor: false },
      { id: "MOSAIC", nameAr: "موزاييك", nameEn: "Mosaic", isLabor: false },
      { id: "TILE_ADHESIVE", nameAr: "غراء بلاط", nameEn: "Tile Adhesive", isLabor: false },
      { id: "GROUT", nameAr: "روبة (فواصل)", nameEn: "Grout", isLabor: false },
      { id: "SKIRTING", nameAr: "وزرات (بردورات)", nameEn: "Skirting", isLabor: false },
      { id: "METAL_TRIMS", nameAr: "فواصل معدنية", nameEn: "Metal Trims", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "ELECTRICAL_ROUGH",
    nameAr: "كهرباء — تأسيس",
    nameEn: "Electrical — Rough-in",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "CONDUITS", nameAr: "مواسير كهرباء", nameEn: "Electrical Conduits", isLabor: false },
      { id: "JUNCTION_BOXES", nameAr: "علب (بواطات)", nameEn: "Junction Boxes", isLabor: false },
      { id: "WIRES", nameAr: "أسلاك", nameEn: "Wires", isLabor: false },
      { id: "CABLES", nameAr: "كيابل", nameEn: "Cables", isLabor: false },
      { id: "GROUND_WIRE", nameAr: "سلك أرضي", nameEn: "Ground Wire", isLabor: false },
      { id: "UNDERGROUND_CABLE", nameAr: "كيابل تحت الأرض", nameEn: "Underground Cable", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "ELECTRICAL_FINISH",
    nameAr: "كهرباء — تشطيب",
    nameEn: "Electrical — Finish",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "MAIN_PANEL", nameAr: "طبلون (لوحة توزيع رئيسية)", nameEn: "Main Distribution Panel", isLabor: false },
      { id: "SUB_PANEL", nameAr: "لوحة توزيع فرعية", nameEn: "Sub Distribution Panel", isLabor: false },
      { id: "BREAKERS", nameAr: "قواطع (بريكرات)", nameEn: "Circuit Breakers", isLabor: false },
      { id: "LIGHT_SWITCHES", nameAr: "مفاتيح إنارة", nameEn: "Light Switches", isLabor: false },
      { id: "OUTLETS", nameAr: "أفياش (بلاكات)", nameEn: "Outlets", isLabor: false },
      { id: "SPOT_LIGHTS", nameAr: "سبوت لايت", nameEn: "Spot Lights", isLabor: false },
      { id: "LED_PANELS", nameAr: "لد بانل", nameEn: "LED Panels", isLabor: false },
      { id: "CHANDELIERS", nameAr: "ثريات ونجف", nameEn: "Chandeliers", isLabor: false },
      { id: "OUTDOOR_LIGHTING", nameAr: "إنارة خارجية", nameEn: "Outdoor Lighting", isLabor: false },
      { id: "EMERGENCY_LIGHTING", nameAr: "إنارة طوارئ", nameEn: "Emergency Lighting", isLabor: false },
      { id: "EXHAUST_FANS", nameAr: "شفاطات", nameEn: "Exhaust Fans", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "ELECTRICAL_SYSTEMS",
    nameAr: "كهرباء — أنظمة",
    nameEn: "Electrical — Systems",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "GENERATOR", nameAr: "مولد كهرباء (جنريتر)", nameEn: "Generator", isLabor: false },
      { id: "UPS", nameAr: "UPS", nameEn: "UPS", isLabor: false },
      { id: "ATS", nameAr: "لوحة نقل أوتوماتيك (ATS)", nameEn: "Automatic Transfer Switch", isLabor: false },
      { id: "SOLAR", nameAr: "طاقة شمسية", nameEn: "Solar Energy", isLabor: false },
      { id: "TRANSFORMER", nameAr: "محول كهرباء", nameEn: "Transformer", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "LOW_VOLTAGE_SMART",
    nameAr: "تيار خفيف وأنظمة ذكية",
    nameEn: "Low Voltage & Smart Systems",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "CCTV", nameAr: "كاميرات مراقبة (CCTV)", nameEn: "CCTV Cameras", isLabor: false },
      { id: "BURGLAR_ALARM", nameAr: "إنذار سرقة", nameEn: "Burglar Alarm", isLabor: false },
      { id: "INTERCOM", nameAr: "إنتركم", nameEn: "Intercom", isLabor: false },
      { id: "AUDIO_SYSTEM", nameAr: "نظام صوتي", nameEn: "Audio System", isLabor: false },
      { id: "DATA_NETWORK", nameAr: "شبكة داتا (كيابل + راك)", nameEn: "Data Network", isLabor: false },
      { id: "SMART_HOME", nameAr: "سمارت هوم", nameEn: "Smart Home", isLabor: false },
      { id: "LIGHTING_CONTROL", nameAr: "تحكم إنارة", nameEn: "Lighting Control", isLabor: false },
      { id: "CURTAIN_CONTROL", nameAr: "تحكم ستائر", nameEn: "Curtain Control", isLabor: false },
      { id: "MATV", nameAr: "تلفزيون مركزي", nameEn: "Master Antenna TV", isLabor: false },
      { id: "ACCESS_CONTROL", nameAr: "حضور وانصراف", nameEn: "Access Control", isLabor: false },
      { id: "GATES_PARKING", nameAr: "بوابات ومواقف", nameEn: "Gates & Parking", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "PLUMBING_ROUGH",
    nameAr: "سباكة — تأسيس",
    nameEn: "Plumbing — Rough-in",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "PPR_PIPES", nameAr: "مواسير مياه (PPR)", nameEn: "PPR Water Pipes", isLabor: false },
      { id: "COPPER_PIPES", nameAr: "مواسير مياه (نحاس)", nameEn: "Copper Water Pipes", isLabor: false },
      { id: "DRAIN_PIPES", nameAr: "مواسير صرف", nameEn: "Drain Pipes", isLabor: false },
      { id: "FITTINGS_VALVES", nameAr: "وصلات ومحابس", nameEn: "Fittings & Valves", isLabor: false },
      { id: "FLOOR_DRAINS", nameAr: "بالوعات أرضية", nameEn: "Floor Drains", isLabor: false },
      { id: "MANHOLES", nameAr: "غرف تفتيش (مناهل)", nameEn: "Manholes", isLabor: false },
      { id: "GREASE_TRAPS", nameAr: "مصايد زيوت", nameEn: "Grease Traps", isLabor: false },
      { id: "SEPTIC_TANK", nameAr: "بيارة", nameEn: "Septic Tank", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "PLUMBING_FINISH",
    nameAr: "سباكة — تشطيب",
    nameEn: "Plumbing — Finish",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "WC_WESTERN", nameAr: "أطقم حمام (كرسي إفرنجي)", nameEn: "Western WC", isLabor: false },
      { id: "WC_ARABIC", nameAr: "كرسي عربي", nameEn: "Arabic WC", isLabor: false },
      { id: "BATHROOM_SINK", nameAr: "مغسلة حمام", nameEn: "Bathroom Sink", isLabor: false },
      { id: "KITCHEN_SINK", nameAr: "مغسلة مطبخ", nameEn: "Kitchen Sink", isLabor: false },
      { id: "BATHTUB", nameAr: "بانيو", nameEn: "Bathtub", isLabor: false },
      { id: "SHOWER_MIXER", nameAr: "شاور وخلاط", nameEn: "Shower & Mixer", isLabor: false },
      { id: "SINK_FAUCETS", nameAr: "خلاطات مغاسل", nameEn: "Sink Faucets", isLabor: false },
      { id: "KITCHEN_FAUCETS", nameAr: "خلاطات مطبخ", nameEn: "Kitchen Faucets", isLabor: false },
      { id: "WATER_HEATER", nameAr: "سخان مياه", nameEn: "Water Heater", isLabor: false },
      { id: "BIDET_SPRAY", nameAr: "شطاف", nameEn: "Bidet Spray", isLabor: false },
      { id: "SIPHON", nameAr: "سيفون", nameEn: "Siphon", isLabor: false },
      { id: "BATHROOM_ACCESSORIES", nameAr: "معلقات حمام", nameEn: "Bathroom Accessories", isLabor: false },
      { id: "WATER_FILTER", nameAr: "فلتر مياه", nameEn: "Water Filter", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "PLUMBING_TANKS_PUMPS",
    nameAr: "سباكة — خزانات ومضخات",
    nameEn: "Plumbing — Tanks & Pumps",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "OVERHEAD_TANK", nameAr: "خزان مياه علوي", nameEn: "Overhead Water Tank", isLabor: false },
      { id: "GROUND_TANK", nameAr: "خزان مياه أرضي", nameEn: "Ground Water Tank", isLabor: false },
      { id: "WATER_PUMP", nameAr: "مضخة مياه", nameEn: "Water Pump", isLabor: false },
      { id: "SEWAGE_TREATMENT", nameAr: "محطة معالجة صرف", nameEn: "Sewage Treatment Plant", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "HVAC",
    nameAr: "تكييف وتهوية",
    nameEn: "HVAC",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "SPLIT_AC", nameAr: "سبليت", nameEn: "Split AC", isLabor: false },
      { id: "WINDOW_AC", nameAr: "شباك", nameEn: "Window AC", isLabor: false },
      { id: "CONCEALED_AC", nameAr: "كونسيلد (مخفي)", nameEn: "Concealed AC", isLabor: false },
      { id: "CASSETTE_AC", nameAr: "كاسيت (سقفي)", nameEn: "Cassette AC", isLabor: false },
      { id: "FLOOR_STANDING", nameAr: "دولابي", nameEn: "Floor Standing AC", isLabor: false },
      { id: "CHILLER", nameAr: "مركزي (تشيلر)", nameEn: "Central Chiller", isLabor: false },
      { id: "VRF_VRV", nameAr: "VRF/VRV", nameEn: "VRF/VRV", isLabor: false },
      { id: "DUCTWORK", nameAr: "مجاري هواء (دكت)", nameEn: "Ductwork", isLabor: false },
      { id: "DUCT_INSULATION", nameAr: "عزل دكت", nameEn: "Duct Insulation", isLabor: false },
      { id: "GRILLES_DIFFUSERS", nameAr: "قريلات وديفيوزر", nameEn: "Grilles & Diffusers", isLabor: false },
      { id: "COPPER_PIPES_AC", nameAr: "مواسير نحاس تكييف", nameEn: "AC Copper Pipes", isLabor: false },
      { id: "REFRIGERANT", nameAr: "فريون", nameEn: "Refrigerant", isLabor: false },
      { id: "THERMOSTAT", nameAr: "ثرموستات", nameEn: "Thermostat", isLabor: false },
      { id: "VENTILATION_FANS", nameAr: "شفاطات ومراوح تهوية", nameEn: "Ventilation Fans", isLabor: false },
      { id: "KITCHEN_HOOD", nameAr: "هود مطبخ", nameEn: "Kitchen Hood", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "FIRE_SYSTEM",
    nameAr: "نظام حريق",
    nameEn: "Fire System",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "FIRE_PIPING", nameAr: "شبكة مواسير حريق", nameEn: "Fire Piping Network", isLabor: false },
      { id: "SPRINKLERS", nameAr: "رشاشات (سبرنكلر)", nameEn: "Sprinklers", isLabor: false },
      { id: "HOSE_REELS", nameAr: "خراطيم (هوز ريل)", nameEn: "Hose Reels", isLabor: false },
      { id: "FIRE_EXTINGUISHERS", nameAr: "طفايات حريق", nameEn: "Fire Extinguishers", isLabor: false },
      { id: "FIRE_ALARM_PANEL", nameAr: "لوحة إنذار حريق", nameEn: "Fire Alarm Panel", isLabor: false },
      { id: "SMOKE_DETECTORS", nameAr: "كواشف دخان", nameEn: "Smoke Detectors", isLabor: false },
      { id: "HEAT_DETECTORS", nameAr: "كواشف حرارة", nameEn: "Heat Detectors", isLabor: false },
      { id: "MANUAL_PULL", nameAr: "أزرار إنذار يدوي", nameEn: "Manual Pull Stations", isLabor: false },
      { id: "ALARM_HORNS", nameAr: "صافرات إنذار", nameEn: "Alarm Horns", isLabor: false },
      { id: "EXIT_LIGHTING", nameAr: "إنارة مخارج طوارئ", nameEn: "Exit Lighting", isLabor: false },
      { id: "FIRE_PUMP_TANK", nameAr: "مضخة وخزان حريق", nameEn: "Fire Pump & Tank", isLabor: false },
      { id: "FM200", nameAr: "نظام إطفاء غاز (FM200)", nameEn: "Gas Suppression (FM200)", isLabor: false },
      { id: "FIRE_DOORS", nameAr: "أبواب مقاومة حريق", nameEn: "Fire Doors", isLabor: false },
      { id: "FIRE_STOP", nameAr: "فاير ستوب", nameEn: "Fire Stop", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "ALUMINUM_GLASS",
    nameAr: "ألمنيوم وزجاج",
    nameEn: "Aluminum & Glass",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "ALUMINUM_WINDOWS", nameAr: "شبابيك ألمنيوم", nameEn: "Aluminum Windows", isLabor: false },
      { id: "ALUMINUM_DOORS", nameAr: "أبواب ألمنيوم", nameEn: "Aluminum Doors", isLabor: false },
      { id: "CURTAIN_WALL", nameAr: "واجهات زجاجية (كيرتن وول)", nameEn: "Curtain Wall", isLabor: false },
      { id: "DOUBLE_GLASS", nameAr: "زجاج مزدوج (دبل جلاس)", nameEn: "Double Glazing", isLabor: false },
      { id: "TEMPERED_GLASS", nameAr: "زجاج سيكوريت", nameEn: "Tempered Glass", isLabor: false },
      { id: "ALUMINUM_CLADDING", nameAr: "كلادينج ألمنيوم", nameEn: "Aluminum Cladding", isLabor: false },
      { id: "STONE_CLADDING", nameAr: "كلادينج حجر", nameEn: "Stone Cladding", isLabor: false },
      { id: "GLASS_RAILING", nameAr: "درابزين زجاج", nameEn: "Glass Railing", isLabor: false },
      { id: "SHOWER_CABIN", nameAr: "كابينة شاور زجاج", nameEn: "Glass Shower Cabin", isLabor: false },
      { id: "MIRRORS", nameAr: "مرايا", nameEn: "Mirrors", isLabor: false },
      { id: "SILICONE", nameAr: "سيليكون", nameEn: "Silicone", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "DOORS",
    nameAr: "أبواب",
    nameEn: "Doors",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "INTERIOR_WOOD", nameAr: "أبواب خشب داخلية", nameEn: "Interior Wood Doors", isLabor: false },
      { id: "MAIN_WOOD", nameAr: "باب خشب رئيسي", nameEn: "Main Wood Door", isLabor: false },
      { id: "STEEL_DOORS", nameAr: "أبواب حديد", nameEn: "Steel Doors", isLabor: false },
      { id: "WPC_DOORS", nameAr: "أبواب WPC", nameEn: "WPC Doors", isLabor: false },
      { id: "ELECTRIC_GARAGE", nameAr: "باب جراج كهربائي", nameEn: "Electric Garage Door", isLabor: false },
      { id: "MANUAL_GARAGE", nameAr: "باب جراج يدوي", nameEn: "Manual Garage Door", isLabor: false },
      { id: "SLIDING_DOORS", nameAr: "أبواب منزلقة", nameEn: "Sliding Doors", isLabor: false },
      { id: "LOCKS_HANDLES", nameAr: "أقفال وكوالين", nameEn: "Locks & Handles", isLabor: false },
      { id: "HINGES", nameAr: "مفصلات", nameEn: "Hinges", isLabor: false },
      { id: "DOOR_CLOSER", nameAr: "كلوزر (غلاق)", nameEn: "Door Closer", isLabor: false },
      { id: "DOOR_FRAME", nameAr: "حلق (إطار) باب", nameEn: "Door Frame", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "METALWORK",
    nameAr: "حدادة ومعادن",
    nameEn: "Metalwork",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "IRON_RAILING", nameAr: "درابزين حديد", nameEn: "Iron Railing", isLabor: false },
      { id: "SS_RAILING", nameAr: "درابزين ستانلس ستيل", nameEn: "Stainless Steel Railing", isLabor: false },
      { id: "IRON_GATES", nameAr: "بوابات حديد", nameEn: "Iron Gates", isLabor: false },
      { id: "IRON_FENCE", nameAr: "سور حديد", nameEn: "Iron Fence", isLabor: false },
      { id: "IRON_SHADE", nameAr: "مظلات حديد", nameEn: "Iron Shade Structure", isLabor: false },
      { id: "HANGARS", nameAr: "هناجر", nameEn: "Hangars", isLabor: false },
      { id: "IRON_STAIRS", nameAr: "سلالم حديد", nameEn: "Iron Stairs", isLabor: false },
      { id: "WINDOW_GRILLE", nameAr: "شبك حماية نوافذ", nameEn: "Window Grille", isLabor: false },
      { id: "WELDING", nameAr: "أعمال لحام", nameEn: "Welding Works", isLabor: false },
      { id: "WROUGHT_IRON", nameAr: "حديد مشغول (فيرفورجيه)", nameEn: "Wrought Iron", isLabor: false },
      { id: "SANDWICH_PANEL", nameAr: "ساندوتش بانل", nameEn: "Sandwich Panel", isLabor: false },
      { id: "STEEL_STRUCTURE", nameAr: "هيكل معدني (ستيل ستراكتشر)", nameEn: "Steel Structure", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "CARPENTRY_FINISH",
    nameAr: "نجارة وأخشاب تشطيب",
    nameEn: "Finish Carpentry",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "WOOD_KITCHEN", nameAr: "مطبخ خشب", nameEn: "Wood Kitchen", isLabor: false },
      { id: "ALUMINUM_KITCHEN", nameAr: "مطبخ ألمنيوم", nameEn: "Aluminum Kitchen", isLabor: false },
      { id: "WALL_CLOSETS", nameAr: "دواليب حائط", nameEn: "Wall Closets", isLabor: false },
      { id: "WOOD_DECOR", nameAr: "ديكورات خشبية", nameEn: "Wood Decorations", isLabor: false },
      { id: "COUNTERTOPS", nameAr: "كاونترات", nameEn: "Countertops", isLabor: false },
      { id: "MOLDING", nameAr: "كسرات خشبية (مودنق)", nameEn: "Wood Molding", isLabor: false },
      { id: "WALL_CLADDING_WOOD", nameAr: "كسوة خشب جدران", nameEn: "Wood Wall Cladding", isLabor: false },
      { id: "WOOD_STAIRS", nameAr: "سلالم خشبية", nameEn: "Wood Stairs", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "EXTERNAL_WORKS",
    nameAr: "أعمال خارجية وتنسيق موقع",
    nameEn: "External Works & Landscaping",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "INTERLOCK", nameAr: "إنترلوك", nameEn: "Interlock Pavers", isLabor: false },
      { id: "KERBSTONE", nameAr: "بردورات (كيربستون)", nameEn: "Kerbstone", isLabor: false },
      { id: "ASPHALT", nameAr: "أسفلت", nameEn: "Asphalt", isLabor: false },
      { id: "STAMPED_CONCRETE", nameAr: "خرسانة مطبوعة (ستامب)", nameEn: "Stamped Concrete", isLabor: false },
      { id: "BOUNDARY_WALL", nameAr: "سور خارجي", nameEn: "Boundary Wall", isLabor: false },
      { id: "EXTERNAL_GATE", nameAr: "بوابة خارجية / كهربائية", nameEn: "External Gate", isLabor: false },
      { id: "CAR_SHADE", nameAr: "مظلات سيارات", nameEn: "Car Shade", isLabor: false },
      { id: "LANDSCAPING", nameAr: "تنسيق حدائق", nameEn: "Landscaping", isLabor: false },
      { id: "GRASS", nameAr: "نجيل طبيعي / صناعي", nameEn: "Natural / Artificial Grass", isLabor: false },
      { id: "TREES_PLANTS", nameAr: "أشجار ونباتات", nameEn: "Trees & Plants", isLabor: false },
      { id: "IRRIGATION", nameAr: "شبكة ري", nameEn: "Irrigation Network", isLabor: false },
      { id: "EXTERIOR_LIGHTING", nameAr: "إنارة خارجية", nameEn: "Exterior Lighting", isLabor: false },
      { id: "SWIMMING_POOL", nameAr: "مسبح", nameEn: "Swimming Pool", isLabor: false },
      { id: "STORMWATER", nameAr: "تصريف مياه أمطار", nameEn: "Stormwater Drainage", isLabor: false },
      { id: "OUTDOOR_SEATING", nameAr: "جلسات خارجية", nameEn: "Outdoor Seating", isLabor: false },
      { id: "BBQ", nameAr: "شواية (بربكيو)", nameEn: "BBQ", isLabor: false },
      { id: "PLAYGROUND", nameAr: "ملعب أطفال", nameEn: "Playground", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "ELEVATORS",
    nameAr: "مصاعد",
    nameEn: "Elevators",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "PASSENGER_ELEVATOR", nameAr: "مصعد ركاب", nameEn: "Passenger Elevator", isLabor: false },
      { id: "SERVICE_ELEVATOR", nameAr: "مصعد خدمة", nameEn: "Service Elevator", isLabor: false },
      { id: "DUMBWAITER", nameAr: "مصعد طعام (داموايتر)", nameEn: "Dumbwaiter", isLabor: false },
      { id: "ESCALATOR", nameAr: "سلم كهربائي", nameEn: "Escalator", isLabor: false },
      { id: "DISABLED_LIFT", nameAr: "منصة ذوي الإعاقة", nameEn: "Disabled Access Lift", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "EQUIPMENT_MACHINERY",
    nameAr: "معدات وآليات",
    nameEn: "Equipment & Machinery",
    accountCode: "5400",
    isVatExempt: false,
    subcategories: [
      { id: "CRANE", nameAr: "رافعة (كرين)", nameEn: "Crane", isLabor: false },
      { id: "CONCRETE_MIXER", nameAr: "خلاطة خرسانة", nameEn: "Concrete Mixer", isLabor: false },
      { id: "CONCRETE_VIBRATOR", nameAr: "هزاز خرسانة", nameEn: "Concrete Vibrator", isLabor: false },
      { id: "GENERATOR_EQUIP", nameAr: "مولد كهرباء", nameEn: "Generator", isLabor: false },
      { id: "COMPRESSOR", nameAr: "كمبروسر", nameEn: "Compressor", isLabor: false },
      { id: "CONSTRUCTION_HOIST", nameAr: "ونش بناء", nameEn: "Construction Hoist", isLabor: false },
      { id: "BOBCAT", nameAr: "بوب كات", nameEn: "Bobcat", isLabor: false },
      { id: "EXCAVATOR", nameAr: "حفار (بوكلين)", nameEn: "Excavator", isLabor: false },
      { id: "DUMP_TRUCK", nameAr: "قلاب (دينا)", nameEn: "Dump Truck", isLabor: false },
      { id: "LOADER", nameAr: "لودر (شيول)", nameEn: "Loader", isLabor: false },
      { id: "COMPACTOR", nameAr: "كومباكتر", nameEn: "Compactor", isLabor: false },
      { id: "CONCRETE_PUMP", nameAr: "مضخة خرسانة (بمب)", nameEn: "Concrete Pump", isLabor: false },
      { id: "WATER_TANKER", nameAr: "تنكر مياه", nameEn: "Water Tanker", isLabor: false },
      { id: "HAND_POWER_TOOLS", nameAr: "أدوات يدوية وكهربائية", nameEn: "Hand & Power Tools", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },

  // ═══════════════════════════════════════
  // مصروفات غير مباشرة / تشغيلية (6xxx)
  // ═══════════════════════════════════════
  {
    id: "INDIRECT_LABOR",
    nameAr: "مصاريف عمالة غير مباشرة",
    nameEn: "Indirect Labor Costs",
    accountCode: "5300",
    isVatExempt: false,
    subcategories: [
      { id: "WORKER_MEALS", nameAr: "إعاشة عمال", nameEn: "Worker Meals", isLabor: true },
      { id: "WORKER_HOUSING", nameAr: "سكن عمال", nameEn: "Worker Housing", isLabor: true },
      { id: "WORKER_TRANSPORT", nameAr: "نقل عمال", nameEn: "Worker Transport", isLabor: true },
      { id: "VISAS_RECRUITMENT", nameAr: "تأشيرات واستقدام", nameEn: "Visas & Recruitment", isLabor: true },
      { id: "MOL_FEES", nameAr: "رسوم مكتب العمل", nameEn: "MOL Fees", isLabor: true },
      { id: "IQAMA_FEES", nameAr: "رسوم إقامة", nameEn: "Iqama Fees", isLabor: true },
      { id: "SPONSORSHIP_TRANSFER", nameAr: "نقل كفالة", nameEn: "Sponsorship Transfer", isLabor: true },
      { id: "END_OF_SERVICE", nameAr: "مكافأة نهاية خدمة", nameEn: "End of Service", isLabor: true },
      { id: "TRAVEL_TICKETS", nameAr: "تذاكر سفر", nameEn: "Travel Tickets", isLabor: true },
      { id: "WORK_CLOTHES", nameAr: "ملابس عمل", nameEn: "Work Clothes", isLabor: true },
      { id: "WORKER_TRAINING", nameAr: "تدريب", nameEn: "Training", isLabor: true },
    ],
  },
  {
    id: "TEMP_FACILITIES",
    nameAr: "تجهيزات موقع مؤقتة",
    nameEn: "Temporary Site Facilities",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "PORTACABIN", nameAr: "بورتاكابين (مكتب موقع)", nameEn: "Portacabin", isLabor: false },
      { id: "TEMP_STORAGE", nameAr: "مخزن مؤقت", nameEn: "Temporary Storage", isLabor: false },
      { id: "TEMP_HOUSING", nameAr: "سكن عمال مؤقت", nameEn: "Temporary Worker Housing", isLabor: false },
      { id: "TEMP_TOILETS", nameAr: "دورات مياه مؤقتة", nameEn: "Temporary Toilets", isLabor: false },
      { id: "FENCING_BARRIERS", nameAr: "سياج وحواجز", nameEn: "Fencing & Barriers", isLabor: false },
      { id: "TEMP_POWER", nameAr: "كهرباء مؤقتة", nameEn: "Temporary Power", isLabor: false },
      { id: "TEMP_WATER", nameAr: "مياه مؤقتة", nameEn: "Temporary Water", isLabor: false },
      { id: "SITE_LIGHTING", nameAr: "إنارة موقع", nameEn: "Site Lighting", isLabor: false },
      { id: "PROJECT_SIGNBOARD", nameAr: "لوحة مشروع", nameEn: "Project Signboard", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "SAFETY_HSE",
    nameAr: "سلامة وصحة مهنية",
    nameEn: "Health, Safety & Environment",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "HARD_HATS", nameAr: "خوذ سلامة", nameEn: "Hard Hats", isLabor: false },
      { id: "HI_VIS_VESTS", nameAr: "سترات عاكسة", nameEn: "Hi-Vis Vests", isLabor: false },
      { id: "SAFETY_BOOTS", nameAr: "أحذية سلامة", nameEn: "Safety Boots", isLabor: false },
      { id: "GLOVES", nameAr: "قفازات", nameEn: "Gloves", isLabor: false },
      { id: "SAFETY_GLASSES", nameAr: "نظارات", nameEn: "Safety Glasses", isLabor: false },
      { id: "MASKS", nameAr: "كمامات", nameEn: "Masks", isLabor: false },
      { id: "HARNESS", nameAr: "حبال أمان (هارنس)", nameEn: "Safety Harness", isLabor: false },
      { id: "SAFETY_SIGNS", nameAr: "لوحات سلامة", nameEn: "Safety Signs", isLabor: false },
      { id: "FIRST_AID", nameAr: "إسعافات أولية", nameEn: "First Aid", isLabor: false },
      { id: "FALL_PROTECTION_NET", nameAr: "شبك حماية سقوط", nameEn: "Fall Protection Net", isLabor: false },
    ],
  },
  {
    id: "ADMIN_SALARIES",
    nameAr: "رواتب ومصاريف إدارية",
    nameEn: "Administrative Salaries & Expenses",
    accountCode: "6100",
    isVatExempt: true,
    subcategories: [
      { id: "ADMIN_STAFF", nameAr: "رواتب موظفين إداريين", nameEn: "Admin Staff Salaries", isLabor: true },
      { id: "ENGINEER_SALARIES", nameAr: "رواتب مهندسين", nameEn: "Engineer Salaries", isLabor: true },
      { id: "SUPERVISOR_SALARIES", nameAr: "رواتب مشرفين", nameEn: "Supervisor Salaries", isLabor: true },
      { id: "OFFICE_RENT", nameAr: "إيجار مكتب", nameEn: "Office Rent", isLabor: false },
      { id: "OFFICE_UTILITIES", nameAr: "كهرباء وماء مكتب", nameEn: "Office Utilities", isLabor: false },
      { id: "INTERNET_COMMS", nameAr: "إنترنت واتصالات", nameEn: "Internet & Communications", isLabor: false },
      { id: "STATIONERY", nameAr: "قرطاسية ومستلزمات", nameEn: "Stationery & Supplies", isLabor: false },
      { id: "OFFICE_FURNITURE", nameAr: "أثاث مكتبي", nameEn: "Office Furniture", isLabor: false },
      { id: "COMPUTERS", nameAr: "أجهزة كمبيوتر", nameEn: "Computers", isLabor: false },
      { id: "SOFTWARE_SUBSCRIPTIONS", nameAr: "برامج واشتراكات", nameEn: "Software & Subscriptions", isLabor: false },
      { id: "OFFICE_HOSPITALITY", nameAr: "ضيافة مكتبية", nameEn: "Office Hospitality", isLabor: false },
    ],
  },
  {
    id: "PROFESSIONAL_CONSULTANCY",
    nameAr: "استشارات مهنية",
    nameEn: "Professional Consultancy",
    accountCode: "6900",
    isVatExempt: false,
    subcategories: [
      { id: "ARCH_DESIGN", nameAr: "تصميم معماري", nameEn: "Architectural Design", isLabor: false },
      { id: "STRUCTURAL_DESIGN", nameAr: "تصميم إنشائي", nameEn: "Structural Design", isLabor: false },
      { id: "MEP_DESIGN", nameAr: "تصميم كهروميكانيك (MEP)", nameEn: "MEP Design", isLabor: false },
      { id: "ENGINEERING_SUPERVISION", nameAr: "إشراف هندسي", nameEn: "Engineering Supervision", isLabor: false },
      { id: "MATERIAL_TESTING", nameAr: "مختبر فحص مواد", nameEn: "Material Testing Lab", isLabor: false },
      { id: "LAND_SURVEY", nameAr: "مساحة أراضي", nameEn: "Land Survey", isLabor: false },
      { id: "LEGAL_CONSULTANCY", nameAr: "استشارات قانونية", nameEn: "Legal Consultancy", isLabor: false },
      { id: "ACCOUNTING_AUDIT", nameAr: "محاسب / مراجع", nameEn: "Accounting / Audit", isLabor: false },
      { id: "SAFETY_CONSULTANCY", nameAr: "استشارات سلامة", nameEn: "Safety Consultancy", isLabor: false },
    ],
  },
  {
    id: "GOVERNMENT_LICENSES",
    nameAr: "رسوم حكومية وتراخيص",
    nameEn: "Government Fees & Licenses",
    accountCode: "6600",
    isVatExempt: true,
    subcategories: [
      { id: "BUILDING_PERMIT", nameAr: "رخصة بناء", nameEn: "Building Permit", isLabor: false },
      { id: "MUNICIPALITY_FEES", nameAr: "رسوم أمانة / بلدية", nameEn: "Municipality Fees", isLabor: false },
      { id: "COMPLETION_CERT", nameAr: "شهادة إتمام بناء", nameEn: "Building Completion Certificate", isLabor: false },
      { id: "ELECTRICITY_CONNECTION", nameAr: "إيصال كهرباء", nameEn: "Electricity Connection", isLabor: false },
      { id: "WATER_CONNECTION", nameAr: "إيصال ماء", nameEn: "Water Connection", isLabor: false },
      { id: "SEWER_CONNECTION", nameAr: "إيصال صرف صحي", nameEn: "Sewer Connection", isLabor: false },
      { id: "GAS_CONNECTION", nameAr: "إيصال غاز", nameEn: "Gas Connection", isLabor: false },
      { id: "CIVIL_DEFENSE_FEES", nameAr: "رسوم دفاع مدني", nameEn: "Civil Defense Fees", isLabor: false },
      { id: "EXCAVATION_PERMIT", nameAr: "تصريح حفريات", nameEn: "Excavation Permit", isLabor: false },
      { id: "CONTRACTOR_CLASSIFICATION", nameAr: "تصنيف مقاول", nameEn: "Contractor Classification", isLabor: false },
      { id: "COMMERCIAL_REGISTER", nameAr: "سجل تجاري", nameEn: "Commercial Register", isLabor: false },
      { id: "CHAMBER_COMMERCE", nameAr: "غرفة تجارية", nameEn: "Chamber of Commerce", isLabor: false },
      { id: "PROFESSIONAL_LICENSE", nameAr: "رخصة مهنية", nameEn: "Professional License", isLabor: false },
    ],
  },
  {
    id: "INSURANCE_GUARANTEES",
    nameAr: "تأمينات وضمانات",
    nameEn: "Insurance & Guarantees",
    accountCode: "6500",
    isVatExempt: true,
    subcategories: [
      { id: "CAR_INSURANCE", nameAr: "تأمين مقاولين شامل (CAR)", nameEn: "Contractor All Risk Insurance", isLabor: false },
      { id: "LIABILITY_INSURANCE", nameAr: "تأمين مسؤولية تجاه الغير", nameEn: "Third Party Liability Insurance", isLabor: false },
      { id: "EQUIPMENT_INSURANCE", nameAr: "تأمين معدات", nameEn: "Equipment Insurance", isLabor: false },
      { id: "GOSI", nameAr: "تأمينات اجتماعية (GOSI)", nameEn: "Social Insurance (GOSI)", isLabor: false },
      { id: "MEDICAL_INSURANCE", nameAr: "تأمين طبي عمال", nameEn: "Worker Medical Insurance", isLabor: false },
      { id: "BID_BOND", nameAr: "كفالة بنكية ابتدائية", nameEn: "Bid Bond", isLabor: false },
      { id: "PERFORMANCE_BOND", nameAr: "كفالة بنكية نهائية", nameEn: "Performance Bond", isLabor: false },
      { id: "ADVANCE_BOND", nameAr: "كفالة دفعة مقدمة", nameEn: "Advance Payment Bond", isLabor: false },
      { id: "MAINTENANCE_BOND", nameAr: "كفالة صيانة", nameEn: "Maintenance Bond", isLabor: false },
    ],
  },
  {
    id: "TRANSPORT_LOGISTICS",
    nameAr: "نقل ولوجستيات",
    nameEn: "Transport & Logistics",
    accountCode: "6400",
    isVatExempt: false,
    subcategories: [
      { id: "FUEL", nameAr: "وقود ومحروقات", nameEn: "Fuel", isLabor: false },
      { id: "MATERIAL_TRANSPORT", nameAr: "نقل مواد", nameEn: "Material Transport", isLabor: false },
      { id: "EQUIPMENT_TRANSPORT", nameAr: "نقل معدات", nameEn: "Equipment Transport", isLabor: false },
      { id: "INTERNATIONAL_SHIPPING", nameAr: "شحن خارجي", nameEn: "International Shipping", isLabor: false },
      { id: "CUSTOMS", nameAr: "تخليص جمركي", nameEn: "Customs Clearance", isLabor: false },
      { id: "VEHICLE_RENTAL", nameAr: "إيجار سيارات", nameEn: "Vehicle Rental", isLabor: false },
      { id: "VEHICLE_MAINTENANCE", nameAr: "صيانة سيارات", nameEn: "Vehicle Maintenance", isLabor: false },
      { id: "VEHICLE_INSURANCE", nameAr: "تأمين سيارات", nameEn: "Vehicle Insurance", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "FINANCIAL_EXPENSES",
    nameAr: "مصاريف مالية",
    nameEn: "Financial Expenses",
    accountCode: "6950",
    isVatExempt: true,
    subcategories: [
      { id: "BANK_COMMISSIONS", nameAr: "عمولات بنكية", nameEn: "Bank Commissions", isLabor: false },
      { id: "LOAN_INTEREST", nameAr: "فوائد قروض", nameEn: "Loan Interest", isLabor: false },
      { id: "TRANSFER_FEES", nameAr: "رسوم تحويلات", nameEn: "Transfer Fees", isLabor: false },
      { id: "VAT_EXPENSE", nameAr: "ضريبة القيمة المضافة (VAT)", nameEn: "VAT", isLabor: false },
      { id: "ZAKAT", nameAr: "زكاة", nameEn: "Zakat", isLabor: false },
      { id: "LATE_PENALTIES", nameAr: "غرامات تأخير", nameEn: "Late Penalties", isLabor: false },
    ],
  },
  {
    id: "MARKETING_BUSINESS",
    nameAr: "تسويق وأعمال تجارية",
    nameEn: "Marketing & Business",
    accountCode: "6800",
    isVatExempt: false,
    subcategories: [
      { id: "ADVERTISING", nameAr: "تسويق ودعاية", nameEn: "Advertising & Marketing", isLabor: false },
      { id: "WEBSITE", nameAr: "موقع إلكتروني", nameEn: "Website", isLabor: false },
      { id: "PRINTING", nameAr: "مطبوعات", nameEn: "Printing", isLabor: false },
      { id: "TENDERS", nameAr: "مناقصات وعطاءات", nameEn: "Tenders", isLabor: false },
      { id: "PR_GIFTS", nameAr: "علاقات عامة وهدايا", nameEn: "PR & Gifts", isLabor: false },
      { id: "BROKER_COMMISSIONS", nameAr: "عمولات وسطاء", nameEn: "Broker Commissions", isLabor: false },
    ],
  },
  {
    id: "CHEMICAL_SPECIALIZED",
    nameAr: "مواد كيميائية ومتخصصة",
    nameEn: "Chemical & Specialized Materials",
    accountCode: "5100",
    isVatExempt: false,
    subcategories: [
      { id: "STRUCTURAL_EPOXY", nameAr: "إيبوكسي إنشائي", nameEn: "Structural Epoxy", isLabor: false },
      { id: "SELF_LEVELING", nameAr: "مادة تسوية (سيلف ليفلنق)", nameEn: "Self-Leveling Compound", isLabor: false },
      { id: "CURING_COMPOUND", nameAr: "معالجة خرسانة (كيورنق)", nameEn: "Curing Compound", isLabor: false },
      { id: "WATERSTOP", nameAr: "ووتر ستوب", nameEn: "Waterstop", isLabor: false },
      { id: "BONDING_AGENT", nameAr: "مادة ربط خرسانة", nameEn: "Concrete Bonding Agent", isLabor: false },
      { id: "REPAIR_MATERIALS", nameAr: "مواد ترميم", nameEn: "Repair Materials", isLabor: false },
      { id: "ANCHOR_BOLTS", nameAr: "أنكور بولت", nameEn: "Anchor Bolts", isLabor: false },
      { id: "JOINT_SEALANT", nameAr: "مواد حشو فواصل", nameEn: "Joint Sealant", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "FINISHING_DECOR",
    nameAr: "تشطيبات وديكور",
    nameEn: "Finishing & Décor",
    accountCode: "5500",
    isVatExempt: false,
    subcategories: [
      { id: "INTERIOR_DESIGN", nameAr: "ديكور داخلي", nameEn: "Interior Design", isLabor: false },
      { id: "CURTAINS", nameAr: "ستائر", nameEn: "Curtains", isLabor: false },
      { id: "APPLIANCES", nameAr: "أجهزة منزلية", nameEn: "Appliances", isLabor: false },
      { id: "FURNITURE", nameAr: "أثاث", nameEn: "Furniture", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
  {
    id: "MISCELLANEOUS",
    nameAr: "متنوعات",
    nameEn: "Miscellaneous",
    accountCode: "6900",
    isVatExempt: false,
    subcategories: [
      { id: "PHOTOGRAPHY", nameAr: "تصوير وتوثيق مشروع", nameEn: "Photography & Documentation", isLabor: false },
      { id: "PLAN_PRINTING", nameAr: "طباعة مخططات", nameEn: "Plan Printing", isLabor: false },
      { id: "MEASURING_TOOLS", nameAr: "أدوات قياس", nameEn: "Measuring Tools", isLabor: false },
      { id: "FINAL_CLEANING", nameAr: "تنظيف نهائي", nameEn: "Final Cleaning", isLabor: false },
      { id: "SITE_WATER", nameAr: "مياه شرب موقع", nameEn: "Site Drinking Water", isLabor: false },
      { id: "SUMMER_ICE", nameAr: "ثلج (خرسانة صيف)", nameEn: "Ice (Summer Concrete)", isLabor: false },
      { id: "SITE_HOSPITALITY", nameAr: "ضيافة موقع", nameEn: "Site Hospitality", isLabor: false },
      { id: "CONTINGENCY", nameAr: "تكاليف طوارئ / احتياطي", nameEn: "Contingency / Reserve", isLabor: false },
      { id: "LABOR", nameAr: "عمالة", nameEn: "Labor", isLabor: true },
    ],
  },
];

// ═══════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════

/** Get a flat list of all main category IDs */
export const getAllCategoryIds = () => EXPENSE_CATEGORIES.map((c) => c.id);

/** Find main category by ID */
export const findCategoryById = (id: string) =>
  EXPENSE_CATEGORIES.find((c) => c.id === id);

/** Find subcategory within a main category */
export const findSubcategoryById = (categoryId: string, subcategoryId: string) =>
  findCategoryById(categoryId)?.subcategories.find((s) => s.id === subcategoryId);

/** Get account code for a main category */
export const getAccountCodeForCategory = (categoryId: string): string =>
  findCategoryById(categoryId)?.accountCode ?? "6900";

/** Check if category is VAT exempt */
export const isCategoryVatExempt = (categoryId: string): boolean =>
  findCategoryById(categoryId)?.isVatExempt ?? false;

/** Search categories by Arabic or English name */
export const searchCategories = (query: string): ExpenseMainCategory[] => {
  const q = query.toLowerCase().trim();
  if (!q) return EXPENSE_CATEGORIES;
  return EXPENSE_CATEGORIES.filter(
    (c) =>
      c.nameAr.includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.subcategories.some(
        (s) =>
          s.nameAr.includes(q) ||
          s.nameEn.toLowerCase().includes(q)
      )
  );
};

/** Search subcategories within a specific category */
export const searchSubcategories = (categoryId: string, query: string): ExpenseSubcategory[] => {
  const cat = findCategoryById(categoryId);
  if (!cat) return [];
  const q = query.toLowerCase().trim();
  if (!q) return cat.subcategories;
  return cat.subcategories.filter(
    (s) =>
      s.nameAr.includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
  );
};

// ═══════════════════════════════════════
// Legacy mapping: Old enum → New category ID
// Used for data migration
// ═══════════════════════════════════════
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  MATERIALS: "CONCRETE_STRUCTURAL",
  LABOR: "INDIRECT_LABOR",
  EQUIPMENT_RENTAL: "EQUIPMENT_MACHINERY",
  EQUIPMENT_PURCHASE: "EQUIPMENT_MACHINERY",
  SUBCONTRACTOR: "MISCELLANEOUS",     // سيختار المستخدم الفئة المناسبة
  TRANSPORT: "TRANSPORT_LOGISTICS",
  SALARIES: "ADMIN_SALARIES",
  RENT: "ADMIN_SALARIES",             // sub: OFFICE_RENT
  UTILITIES: "ADMIN_SALARIES",        // sub: OFFICE_UTILITIES
  COMMUNICATIONS: "ADMIN_SALARIES",   // sub: INTERNET_COMMS
  INSURANCE: "INSURANCE_GUARANTEES",
  LICENSES: "GOVERNMENT_LICENSES",
  BANK_FEES: "FINANCIAL_EXPENSES",
  FUEL: "TRANSPORT_LOGISTICS",        // sub: FUEL
  MAINTENANCE: "MISCELLANEOUS",
  SUPPLIES: "ADMIN_SALARIES",         // sub: STATIONERY
  MARKETING: "MARKETING_BUSINESS",
  TRAINING: "INDIRECT_LABOR",         // sub: WORKER_TRAINING
  TRAVEL: "TRANSPORT_LOGISTICS",
  HOSPITALITY: "MISCELLANEOUS",       // sub: SITE_HOSPITALITY
  LOAN_PAYMENT: "FINANCIAL_EXPENSES", // sub: LOAN_INTEREST — حالة خاصة
  TAXES: "FINANCIAL_EXPENSES",        // sub: VAT_EXPENSE
  ZAKAT: "FINANCIAL_EXPENSES",        // sub: ZAKAT
  REFUND: "MISCELLANEOUS",            // حالة خاصة — مرتجعات
  MISC: "MISCELLANEOUS",
  CUSTOM: "MISCELLANEOUS",
  CONCRETE: "CONCRETE_STRUCTURAL",
  STEEL: "REBAR",
  ELECTRICAL: "ELECTRICAL_ROUGH",
  PLUMBING: "PLUMBING_ROUGH",
  HVAC: "HVAC",
  PAINTING: "PAINTING",
  FINISHING: "FINISHING_DECOR",
  EXCAVATION: "EXCAVATION_EARTHWORK",
  SAFETY: "SAFETY_HSE",
  TESTING: "PROFESSIONAL_CONSULTANCY",
  GOVERNMENT_FEES: "GOVERNMENT_LICENSES",
  SALARY: "ADMIN_SALARIES",
  OFFICE_SUPPLIES: "ADMIN_SALARIES",
  SUBSCRIPTIONS: "ADMIN_SALARIES",    // sub: SOFTWARE_SUBSCRIPTIONS
  LEGAL: "PROFESSIONAL_CONSULTANCY",  // sub: LEGAL_CONSULTANCY
  FINES: "FINANCIAL_EXPENSES",        // sub: LATE_PENALTIES
  TRANSPORTATION: "TRANSPORT_LOGISTICS",
  OTHER: "MISCELLANEOUS",
};
```

**تصدير من `packages/utils/src/index.ts`:**
```typescript
export * from "./expense-categories";
```

---

## المرحلة 2 — تعديل Schema (Prisma)

### 2.1 تعديل `FinanceExpense` model

```prisma
model FinanceExpense {
  // ... الحقول الموجودة

  // ❌ احذف (أو أبقِ deprecated مؤقتاً للبيانات القديمة):
  // category    OrgExpenseCategory

  // ✅ أضف:
  categoryId      String              // Required — ID من EXPENSE_CATEGORIES (e.g., "CONCRETE_STRUCTURAL")
  subcategoryId   String?             // Optional — ID من subcategories (e.g., "READY_MIX")

  // أبقِ الحقل القديم كـ legacyCategory لحين الترحيل:
  legacyCategory  OrgExpenseCategory?  // سيُحذف لاحقاً بعد الترحيل
}
```

**هام:** لا تحذف `OrgExpenseCategory` enum الآن. فقط أضف الحقول الجديدة واجعل `category` اختيارياً مؤقتاً (أعد تسميته لـ `legacyCategory`).

### 2.2 تعديل `CompanyExpense` model (مصروفات الشركة)

```prisma
model CompanyExpense {
  // نفس التعديل
  categoryId      String
  subcategoryId   String?
  legacyCategory  CompanyExpenseCategory?
}
```

### 2.3 بعد التعديل:
```bash
pnpm --filter database generate
node packages/database/scripts/fix-zod-decimal.mjs
npx tsc --noEmit --pretty
```

---

## المرحلة 3 — تحديث Auto-Journal (Backend)

### 3.1 تعديل `EXPENSE_CATEGORY_TO_ACCOUNT_CODE`

**الملف:** `packages/api/lib/accounting/auto-journal.ts`

استبدل الـ mapping القديم بالجديد الذي يستخدم `getAccountCodeForCategory` و `isCategoryVatExempt` من `@masar/utils`:

```typescript
import { getAccountCodeForCategory, isCategoryVatExempt } from "@masar/utils";

// استبدل:
// const accountCode = EXPENSE_CATEGORY_TO_ACCOUNT_CODE[expense.category] ?? "6900";
// بـ:
const accountCode = getAccountCodeForCategory(expense.categoryId) ?? "6900";

// استبدل:
// const isVatExempt = VAT_EXEMPT_CATEGORIES.includes(expense.category);
// بـ:
const isVatExempt = isCategoryVatExempt(expense.categoryId);
```

### 3.2 حالات خاصة

- **LOAN_PAYMENT** (سابقاً → 2110): أبقِ المنطق الحالي للقروض كما هو. فئة `FINANCIAL_EXPENSES` ستذهب لـ 6950.
- **REFUND** (سابقاً → 4300): أبقِ المنطق الحالي للمرتجعات.

⚠️ **لا تمس Silent Failure Pattern** — هذا غير قابل للتفاوض.

---

## المرحلة 4 — تحديث API Procedures

### 4.1 `expenses.ts` — createExpense / updateExpense

**الملف:** `packages/api/modules/finance/procedures/expenses.ts`

```typescript
// Input schema — استبدل:
// category: z.nativeEnum(OrgExpenseCategory)
// بـ:
categoryId: z.string().min(1),
subcategoryId: z.string().optional(),

// Validation — أضف تحقق:
import { findCategoryById, findSubcategoryById } from "@masar/utils";

const category = findCategoryById(input.categoryId);
if (!category) {
  throw new ORPCError("BAD_REQUEST", { message: "فئة المصروف غير صالحة" });
}
if (input.subcategoryId) {
  const sub = findSubcategoryById(input.categoryId, input.subcategoryId);
  if (!sub) {
    throw new ORPCError("BAD_REQUEST", { message: "الفئة الفرعية غير صالحة" });
  }
}
```

### 4.2 نفس التعديل في:
- `packages/api/modules/company/procedures/expense-payments.ts`
- أي ملف يستقبل `OrgExpenseCategory` أو `CompanyExpenseCategory`

### 4.3 إضافة endpoint لجلب الفئات (للـ Frontend):

```typescript
// packages/api/modules/finance/procedures/expense-categories.ts
import { EXPENSE_CATEGORIES, searchCategories } from "@masar/utils";

export const listExpenseCategories = publicProcedure
  .input(z.object({ search: z.string().optional() }))
  .handler(async ({ input }) => {
    if (input.search) {
      return searchCategories(input.search);
    }
    return EXPENSE_CATEGORIES;
  });
```

---

## المرحلة 5 — إعادة تصميم AddExpenseDialog (Frontend)

### 5.1 الهيكل الجديد للنموذج

**الملف:** `apps/web/modules/saas/finance/components/expenses/AddExpenseDialog.tsx`

**التصميم الجديد — قسمين:**

```
┌──────────────────────────────────────────────────┐
│  إضافة مصروف                                  ✕  │
├──────────────────────────────────────────────────┤
│                                                   │
│  ── البيانات الأساسية ──                          │
│                                                   │
│  [المبلغ *]     [التاريخ *]                       │
│  [▼ الفئة * — مع بحث]   [▼ الفئة الفرعية]        │
│  [▼ اختر المشروع — اختياري]                       │
│  [الوصف ...................]                      │
│                                                   │
│  ── متقدم ▼ ──  (مطوي افتراضياً)                  │
│                                                   │
│  [✓] تسجيل التزام                                │
│  [▼ طريقة الدفع]  [▼ اختر الحساب المصدر *]       │
│  [اسم المورد]  [الرقم الضريبي]  [رقم فاتورة]     │
│  [ملاحظات إضافية ............]                    │
│  [📎 إرفاق الفاتورة]                              │
│                                                   │
│  [     إضافة مصروف 💾     ]      [إلغاء]         │
└──────────────────────────────────────────────────┘
```

### 5.2 مكون اختيار الفئة (Combobox مع بحث)

**أنشئ ملف:** `apps/web/modules/saas/finance/components/expenses/ExpenseCategoryCombobox.tsx`

استخدم `command.tsx` (cmdk) من shadcn/ui الموجود في المشروع:

```typescript
// Props:
interface ExpenseCategoryComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// السلوك:
// 1. Popover يحتوي Command (cmdk) للبحث
// 2. البحث يعمل بالعربي والإنجليزي وبالـ ID
// 3. يعرض الفئات مجمّعة — أو مسطحة مع icon لكل فئة
// 4. عند اختيار فئة → يتم تحديثها ويُعاد تعيين الفئة الفرعية
// 5. RTL-safe: استخدم ms- me- ps- pe- start- end-
```

### 5.3 مكون اختيار الفئة الفرعية

**أنشئ ملف:** `apps/web/modules/saas/finance/components/expenses/ExpenseSubcategoryCombobox.tsx`

```typescript
interface ExpenseSubcategoryComboboxProps {
  categoryId: string;    // الفئة الرئيسية المختارة
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;    // disabled إذا لم تُختَر فئة رئيسية
}
```

### 5.4 تعديلات مهمة في النموذج:

1. **الفئة إلزامية** — `required` + validation error
2. **الفئة الفرعية اختيارية** — لا validation
3. **عند تغيير الفئة الرئيسية** → مسح الفئة الفرعية المختارة
4. **الجوال:** كل الحقول تأخذ عرض كامل `w-full` — لا أعمدة متعددة على الشاشات الصغيرة
5. **Desktop:** المبلغ + التاريخ في صف، الفئة + الفرعية في صف
6. **قسم "متقدم":** استخدم `Collapsible` من shadcn/ui مطوي افتراضياً
7. **RTL:** كل الحقول تستخدم `ms-` `me-` `ps-` `pe-` `start-` `end-`

### 5.5 مفاتيح الترجمة

**أضف في `apps/web/messages/ar.json` و `en.json`:**

```json
{
  "finance": {
    "expenses": {
      "basicInfo": "البيانات الأساسية",
      "advanced": "متقدم",
      "category": "الفئة",
      "subcategory": "الفئة الفرعية",
      "searchCategory": "ابحث عن فئة...",
      "searchSubcategory": "ابحث عن فئة فرعية...",
      "selectCategory": "اختر الفئة",
      "selectSubcategory": "اختر الفئة الفرعية (اختياري)",
      "noResults": "لا توجد نتائج",
      "categoryRequired": "يجب اختيار الفئة"
    }
  }
}
```

**ملاحظة:** أسماء الفئات الرئيسية والفرعية تأتي من `EXPENSE_CATEGORIES` مباشرة (حقول `nameAr` و `nameEn`) — لا حاجة لمفاتيح ترجمة منفصلة لكل فئة.

---

## المرحلة 6 — Migration Script (ترحيل البيانات)

**أنشئ ملف:** `packages/database/prisma/migrations/migrate-expense-categories.ts`

```typescript
// سكربت يُشغَّل مرة واحدة لترحيل البيانات القديمة:
// 1. اقرأ كل FinanceExpense مع category != null
// 2. استخدم LEGACY_CATEGORY_MAP لتحويل category → categoryId
// 3. حدّث categoryId في كل سجل
// 4. نفس الشيء لـ CompanyExpense

// بعد التأكد من نجاح الترحيل → يمكن حذف legacyCategory
```

---

## القائمة الحمراء — لا تمس أبداً 🔴

1. `packages/api/lib/accounting/auto-journal.ts` — **Silent Failure Pattern فقط** (لا تغير منطق الـ try/catch)
2. `packages/api/lib/structural-calculations.ts` — لا علاقة
3. `packages/database/prisma/schema.prisma` — **فقط** أضف الحقول الجديدة، لا تحذف حقول أو enums موجودة
4. ملفات auth — لا علاقة
5. أي ملف في `packages/api/lib/zatca/` — لا علاقة

---

## التحقق بعد كل مرحلة

```bash
# بعد كل مرحلة:
npx tsc --noEmit --pretty

# بعد المرحلة 1:
grep -rn "EXPENSE_CATEGORIES" packages/utils/src/expense-categories.ts | wc -l

# بعد المرحلة 2:
grep -n "categoryId" packages/database/prisma/schema.prisma

# بعد المرحلة 3-4:
grep -rn "getAccountCodeForCategory\|isCategoryVatExempt" packages/api/

# بعد المرحلة 5:
grep -rn "ExpenseCategoryCombobox" apps/web/
```

---

## ملخص التغييرات المتوقعة

| الملف / المنطقة | نوع التغيير | التفاصيل |
|---|---|---|
| `packages/utils/src/expense-categories.ts` | **جديد** | 39 فئة + 396 فرعية + helpers + legacy map |
| `packages/utils/src/index.ts` | تعديل | export الملف الجديد |
| `packages/database/prisma/schema.prisma` | تعديل | إضافة `categoryId`, `subcategoryId`, `legacyCategory` |
| `packages/api/lib/accounting/auto-journal.ts` | تعديل | استبدال mapping بـ `getAccountCodeForCategory` |
| `packages/api/modules/finance/procedures/expenses.ts` | تعديل | input schema + validation |
| `packages/api/modules/company/procedures/expense-payments.ts` | تعديل | input schema + validation |
| `packages/api/modules/finance/procedures/expense-categories.ts` | **جديد** | endpoint لجلب الفئات |
| `apps/web/.../expenses/AddExpenseDialog.tsx` | تعديل كبير | إعادة تصميم كامل |
| `apps/web/.../expenses/ExpenseCategoryCombobox.tsx` | **جديد** | Combobox مع بحث |
| `apps/web/.../expenses/ExpenseSubcategoryCombobox.tsx` | **جديد** | Combobox فرعي |
| `apps/web/messages/ar.json` | تعديل | مفاتيح ترجمة جديدة |
| `apps/web/messages/en.json` | تعديل | مفاتيح ترجمة جديدة |
| `packages/database/prisma/migrations/migrate-expense-categories.ts` | **جديد** | سكربت ترحيل |

---

## ملاحظات تنفيذية

1. **نفّذ المراحل بالترتيب** — لا تقفز
2. **اقرأ كل ملف قبل تعديله** — تحقق من أسماء الحقول والـ imports
3. **الفئة الرئيسية إلزامية، الفرعية اختيارية** — هذا ثابت لا يتغير
4. **البحث يعمل بالعربي والإنجليزي** — استخدم `includes` بدون regex
5. **RTL-safe دائماً** — `ms-` `me-` `ps-` `pe-` لا `ml-` `mr-`
6. **لا تحذف الـ enum القديم** — ستُحذف لاحقاً بعد ترحيل كامل
7. **`Decimal(15,2)`** لحقل المبلغ — لا تتغير
8. **`z.union([z.string(), z.number()])`** لأي حقل Decimal في Zod
