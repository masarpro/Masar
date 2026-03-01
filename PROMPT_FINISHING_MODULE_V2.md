# برومبت شامل: إعادة بناء قسم التشطيبات في دراسات الكميات — الإصدار 2

## السياق العام

أنت تعمل على منصة **مسار** — منصة SaaS لإدارة شركات المقاولات في السوق السعودي.
المطلوب: **إعادة بناء قسم التشطيبات** في وحدة دراسات الكميات (`/pricing/studies/[studyId]/finishing`) ليصبح شاملاً لكل بنود التشطيبات المستخدمة في السوق السعودي، مع أدوات حساب ذكية لكل بند.

**ملاحظة حرجة:** الأعمال الكهروميكانيكية (كهرباء، تكييف، سباكة، إطفاء، انتركم، أنظمة ذكية، مصعد) لها قسم منفصل `/mep`. هذا القسم فقط لأعمال التشطيبات.

**المسار:** `apps/web/app/[locale]/(saas)/app/[organizationSlug]/pricing/studies/[studyId]/finishing/page.tsx`

**المرجع:** صفحة الأعمال الإنشائية (structural) — نفس أسلوب العرض والتفاعل.

---

## المرحلة 0: مفهوم "الأدوار الديناميكية" — حجر الأساس

### 0.1 الفكرة الجوهرية

بدلاً من فئات ثابتة مثل "أرضيات الدور الأرضي" و"أرضيات الدور الأول"، يقوم المستخدم **أولاً** بتعريف أدوار المبنى، ثم تتكرر البنود المرتبطة بالأدوار (أرضيات، جبس بورد، دهانات) تلقائياً لكل دور.

### 0.2 إعدادات المبنى (Building Configuration) — أعلى الصفحة

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ إعدادات المبنى                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  مساحة الأرض الإجمالية: [  600  ] م²                                │
│                                                                      │
│  ── الأدوار ──                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ #  │ اسم الدور          │ المساحة (م²) │ الارتفاع (م) │ ✕  │   │
│  ├────┼─────────────────────┼──────────────┼──────────────┼────┤   │
│  │ 1  │ بدروم               │    200       │    3.0       │ ✕  │   │
│  │ 2  │ الدور الأرضي        │    400       │    3.2       │ ✕  │   │
│  │ 3  │ الدور الأول          │    400       │    3.2       │ ✕  │   │
│  │ 4  │ الملحق العلوي        │    180       │    3.0       │ ✕  │   │
│  │ 5  │ السطح               │    400       │    —         │ ✕  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [+ إضافة دور]   [📋 دور متكرر: عدد التكرار [ 2 ] ]               │
│                                                                      │
│  مساحة البناء الإجمالية: 1,580 م²                                   │
│  إجمالي محيط المبنى التقريبي: [  80  ] م                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**خيار "دور متكرر":** إذا كان المبنى عمارة (مثلاً 4 أدوار متطابقة)، يختار المستخدم "دور متكرر" ويحدد عدد التكرارات. النظام يحسب الكميات مرة واحدة × عدد التكرارات.

### 0.3 تخزين إعدادات الأدوار

```typescript
// يُخزن في CostStudy.metadata (Json) أو في حقول جديدة
interface BuildingConfig {
  totalLandArea: number;       // مساحة الأرض
  buildingPerimeter: number;   // محيط المبنى التقريبي
  floors: FloorConfig[];
}

interface FloorConfig {
  id: string;             // cuid
  name: string;           // "الدور الأرضي"، "بدروم"، "ملحق"
  area: number;           // مساحة الدور بالمتر المربع
  height: number;         // ارتفاع الدور بالمتر
  sortOrder: number;
  isRepeated: boolean;    // هل هو دور متكرر؟
  repeatCount: number;    // عدد التكرارات (1 = دور واحد)
  floorType: 'BASEMENT' | 'GROUND' | 'UPPER' | 'ANNEX' | 'ROOF' | 'MEZZANINE';
}
```

**الأسماء الافتراضية عند الإضافة:**

| النوع | الاسم الافتراضي |
|-------|----------------|
| `BASEMENT` | بدروم |
| `GROUND` | الدور الأرضي |
| `UPPER` | الدور الأول / الثاني / ... |
| `ANNEX` | الملحق العلوي |
| `ROOF` | السطح |
| `MEZZANINE` | ميزانين |

---

## المرحلة 1: تحديث Schema قاعدة البيانات

### 1.1 تحديث CostStudy — إضافة حقل إعدادات المبنى

```prisma
model CostStudy {
  // ... الحقول الحالية ...

  // ===  جديد: إعدادات المبنى للتشطيبات ===
  buildingConfig    Json?    @db.JsonB   // BuildingConfig object
}
```

### 1.2 تحديث FinishingItem Model

```prisma
model FinishingItem {
  id              String   @id @default(cuid())
  costStudyId     String
  costStudy       CostStudy @relation(fields: [costStudyId], references: [id], onDelete: Cascade)

  // ══════════════════════════════════════
  // التصنيف
  // ══════════════════════════════════════
  category        String    // الفئة الرئيسية (FINISHING_PLASTERING, FINISHING_PAINT, etc.)
  subCategory     String?   // الفئة الفرعية
  name            String    // اسم البند الوصفي
  description     String?   @db.Text

  // ══════════════════════════════════════
  // ربط بالدور (للبنود المرتبطة بأدوار)
  // ══════════════════════════════════════
  floorId         String?   // معرف الدور من buildingConfig.floors[].id
  floorName       String?   // اسم الدور (للعرض: "الدور الأرضي")
  // null يعني بند عام غير مرتبط بدور محدد (مثل: واجهات، حوش)

  // ══════════════════════════════════════
  // القياسات
  // ══════════════════════════════════════
  area            Decimal?  @db.Decimal(15,2)   // المساحة م²
  length          Decimal?  @db.Decimal(15,2)   // الطول م
  height          Decimal?  @db.Decimal(15,2)   // الارتفاع م
  width           Decimal?  @db.Decimal(15,2)   // العرض م
  perimeter       Decimal?  @db.Decimal(15,2)   // المحيط م
  quantity        Decimal?  @db.Decimal(15,2)   // الكمية (عدد)
  unit            String    @default("m2")      // m2, m, piece, set, lump_sum

  // ══════════════════════════════════════
  // الحساب الذكي
  // ══════════════════════════════════════
  calculationMethod String?  // ROOM_BY_ROOM | WALL_DEDUCTION | DIRECT_AREA | PER_UNIT | LUMP_SUM | LINEAR
  calculationData   Json?   @db.JsonB  // بيانات الحساب التفصيلية

  // ══════════════════════════════════════
  // الجودة والمواصفات
  // ══════════════════════════════════════
  qualityLevel    String?   // ECONOMY | STANDARD | PREMIUM | LUXURY
  brand           String?
  specifications  String?   @db.Text

  // ══════════════════════════════════════
  // التكاليف
  // ══════════════════════════════════════
  wastagePercent  Decimal?  @db.Decimal(5,2) @default(0)
  materialPrice   Decimal?  @db.Decimal(15,2) @default(0)
  laborPrice      Decimal?  @db.Decimal(15,2) @default(0)
  totalCost       Decimal   @db.Decimal(15,2) @default(0)

  // ══════════════════════════════════════
  // الترتيب
  // ══════════════════════════════════════
  sortOrder       Int       @default(0)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([costStudyId])
  @@index([costStudyId, category])
  @@index([costStudyId, floorId])
  @@map("finishing_items")
}
```

### 1.3 Migration

```bash
npx prisma migrate dev --name expand_finishing_items_v2
```

الحقول الجديدة كلها `optional` أو لها `default` — التوافقية محفوظة.

---

## المرحلة 2: تسمية الفئات الاحترافية

### 2.1 فلسفة التسمية

- التسمية تتبع **مصطلحات عقود المقاولات** في السوق السعودي
- البادئة `FINISHING_` لتمييزها عن بنود الأقسام الأخرى (إنشائي، كهروميكانيك)
- الفئات مقسمة إلى **مجموعات عمل** (Work Packages) كما في جداول الكميات الاحترافية (BOQ)

### 2.2 هيكل الفئات الشامل

```typescript
// ══════════════════════════════════════════════════════════════
// packages/config/src/finishing-categories.ts
// ══════════════════════════════════════════════════════════════

// ────────────────────────────────────────
// أنواع الفئات
// ────────────────────────────────────────

export type FinishingScope = 'PER_FLOOR' | 'WHOLE_BUILDING' | 'EXTERNAL';
// PER_FLOOR     = يتكرر لكل دور (أرضيات، جبس، دهان داخلي)
// WHOLE_BUILDING = على مستوى المبنى ككل (أبواب، شبابيك)
// EXTERNAL      = أعمال خارجية (واجهات، حوش، سور)

export interface FinishingCategoryConfig {
  id: string;                  // المعرف الفني
  groupId: string;             // مجموعة العمل
  groupNameAr: string;         // اسم المجموعة بالعربي
  groupNameEn: string;         // اسم المجموعة بالإنجليزي
  groupIcon: string;           // أيقونة المجموعة
  groupColor: string;          // لون المجموعة

  nameAr: string;              // اسم الفئة بالعربي
  nameEn: string;              // اسم الفئة بالإنجليزي
  icon: string;                // أيقونة lucide-react

  scope: FinishingScope;       // نطاق البند
  unit: string;                // الوحدة الافتراضية
  calculationMethod: string;   // طريقة الحساب الافتراضية
  defaultWastage: number;      // نسبة الهالك الافتراضية %

  subCategories: SubCategory[];
  qualityLevels: QualityLevel[];
}

export interface SubCategory {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface QualityLevel {
  id: string;
  nameAr: string;
  nameEn: string;
  priceRangeAr: string;       // نطاق السعر التقريبي
}

// ────────────────────────────────────────
// مجموعات العمل (Work Packages)
// ────────────────────────────────────────

export const FINISHING_GROUPS = {
  INSULATION: {
    id: 'INSULATION',
    nameAr: 'أعمال العزل',
    nameEn: 'Insulation Works',
    icon: 'ShieldCheck',
    color: 'emerald',
    sortOrder: 1,
  },
  PLASTERING: {
    id: 'PLASTERING',
    nameAr: 'أعمال اللياسة',
    nameEn: 'Plastering Works',
    icon: 'PaintBucket',
    color: 'amber',
    sortOrder: 2,
  },
  PAINTING: {
    id: 'PAINTING',
    nameAr: 'أعمال الدهانات',
    nameEn: 'Painting Works',
    icon: 'Paintbrush',
    color: 'blue',
    sortOrder: 3,
  },
  FLOORING: {
    id: 'FLOORING',
    nameAr: 'أعمال الأرضيات',
    nameEn: 'Flooring Works',
    icon: 'LayoutGrid',
    color: 'teal',
    sortOrder: 4,
  },
  WALL_CLADDING: {
    id: 'WALL_CLADDING',
    nameAr: 'أعمال تكسيات الجدران',
    nameEn: 'Wall Cladding Works',
    icon: 'Layers',
    color: 'cyan',
    sortOrder: 5,
  },
  FALSE_CEILING: {
    id: 'FALSE_CEILING',
    nameAr: 'أعمال الأسقف المستعارة',
    nameEn: 'False Ceiling Works',
    icon: 'Layers3',
    color: 'gray',
    sortOrder: 6,
  },
  DOORS: {
    id: 'DOORS',
    nameAr: 'أعمال الأبواب',
    nameEn: 'Door Works',
    icon: 'DoorOpen',
    color: 'orange',
    sortOrder: 7,
  },
  WINDOWS: {
    id: 'WINDOWS',
    nameAr: 'أعمال النوافذ والألمنيوم',
    nameEn: 'Window & Aluminum Works',
    icon: 'AppWindow',
    color: 'indigo',
    sortOrder: 8,
  },
  SANITARY: {
    id: 'SANITARY',
    nameAr: 'الأدوات الصحية والسيراميك',
    nameEn: 'Sanitary Fixtures & Ceramics',
    icon: 'Bath',
    color: 'violet',
    sortOrder: 9,
  },
  KITCHEN: {
    id: 'KITCHEN',
    nameAr: 'أعمال المطابخ',
    nameEn: 'Kitchen Works',
    icon: 'ChefHat',
    color: 'rose',
    sortOrder: 10,
  },
  STAIRS: {
    id: 'STAIRS',
    nameAr: 'أعمال الدرج والدرابزين',
    nameEn: 'Stairs & Railing Works',
    icon: 'ArrowUpDown',
    color: 'stone',
    sortOrder: 11,
  },
  FACADE: {
    id: 'FACADE',
    nameAr: 'أعمال الواجهات',
    nameEn: 'Facade Works',
    icon: 'Building2',
    color: 'amber',
    sortOrder: 12,
  },
  EXTERNAL: {
    id: 'EXTERNAL',
    nameAr: 'الأعمال الخارجية',
    nameEn: 'External & Yard Works',
    icon: 'Trees',
    color: 'green',
    sortOrder: 13,
  },
  ROOF_WORKS: {
    id: 'ROOF_WORKS',
    nameAr: 'أعمال السطح',
    nameEn: 'Roof Works',
    icon: 'Home',
    color: 'red',
    sortOrder: 14,
  },
  DECOR: {
    id: 'DECOR',
    nameAr: 'أعمال الديكور',
    nameEn: 'Decoration Works',
    icon: 'Sparkles',
    color: 'pink',
    sortOrder: 15,
  },
} as const;

// ────────────────────────────────────────
// الفئات التفصيلية
// ────────────────────────────────────────

export const FINISHING_CATEGORIES: FinishingCategoryConfig[] = [

  // ╔══════════════════════════════════════════════════╗
  // ║  1. أعمال العزل                                  ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_WATERPROOFING',
    groupId: 'INSULATION',
    groupNameAr: 'أعمال العزل',
    groupNameEn: 'Insulation Works',
    groupIcon: 'ShieldCheck',
    groupColor: 'emerald',
    nameAr: 'العزل المائي',
    nameEn: 'Waterproofing',
    icon: 'Droplets',
    scope: 'PER_FLOOR',  // حمامات كل دور + أساسات + سطح
    unit: 'm2',
    calculationMethod: 'DIRECT_AREA',
    defaultWastage: 5,
    subCategories: [
      { id: 'WP_FOUNDATIONS', nameAr: 'عزل أساسات', nameEn: 'Foundation Waterproofing' },
      { id: 'WP_BATHROOMS', nameAr: 'عزل حمامات', nameEn: 'Bathroom Waterproofing' },
      { id: 'WP_ROOF', nameAr: 'عزل سطح', nameEn: 'Roof Waterproofing' },
      { id: 'WP_PLANTERS', nameAr: 'عزل أحواض زراعية', nameEn: 'Planter Waterproofing' },
      { id: 'WP_POOL', nameAr: 'عزل مسبح', nameEn: 'Pool Waterproofing' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (رولات بيتومين)', nameEn: 'Economy', priceRangeAr: '15–30 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي (سيكا/فوسروك)', nameEn: 'Standard', priceRangeAr: '30–60 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز (مركب متعدد الطبقات)', nameEn: 'Premium', priceRangeAr: '60–120 ر.س/م²' },
    ],
  },

  {
    id: 'FINISHING_THERMAL_INSULATION',
    groupId: 'INSULATION',
    groupNameAr: 'أعمال العزل',
    groupNameEn: 'Insulation Works',
    groupIcon: 'ShieldCheck',
    groupColor: 'emerald',
    nameAr: 'العزل الحراري',
    nameEn: 'Thermal Insulation',
    icon: 'Thermometer',
    scope: 'WHOLE_BUILDING',
    unit: 'm2',
    calculationMethod: 'DIRECT_AREA',
    defaultWastage: 5,
    subCategories: [
      { id: 'TI_WALLS', nameAr: 'عزل جدران خارجية', nameEn: 'External Wall Insulation' },
      { id: 'TI_ROOF', nameAr: 'عزل سطح حراري', nameEn: 'Roof Thermal Insulation' },
      { id: 'TI_CAVITY', nameAr: 'عزل تجويف (بين جدارين)', nameEn: 'Cavity Insulation' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (بولسترين)', nameEn: 'Economy', priceRangeAr: '15–30 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي (صوف صخري)', nameEn: 'Standard', priceRangeAr: '30–55 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز (بولي يوريثان رش)', nameEn: 'Premium', priceRangeAr: '55–100 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  2. أعمال اللياسة                                ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_INTERNAL_PLASTER',
    groupId: 'PLASTERING',
    groupNameAr: 'أعمال اللياسة',
    groupNameEn: 'Plastering Works',
    groupIcon: 'PaintBucket',
    groupColor: 'amber',
    nameAr: 'لياسة داخلية (جدران وأسقف)',
    nameEn: 'Internal Plastering (Walls & Ceilings)',
    icon: 'PaintBucket',
    scope: 'PER_FLOOR',
    unit: 'm2',
    calculationMethod: 'WALL_DEDUCTION',
    defaultWastage: 5,
    subCategories: [
      { id: 'IP_CEMENT', nameAr: 'لياسة إسمنتية', nameEn: 'Cement Plaster' },
      { id: 'IP_GYPSUM', nameAr: 'لياسة جبسية', nameEn: 'Gypsum Plaster' },
      { id: 'IP_MACHINE', nameAr: 'لياسة آلية (بروجكتر)', nameEn: 'Machine Plaster' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '25–40 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '40–55 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز (طبقتين + شبك)', nameEn: 'Premium', priceRangeAr: '55–80 ر.س/م²' },
    ],
  },

  {
    id: 'FINISHING_EXTERNAL_PLASTER',
    groupId: 'PLASTERING',
    groupNameAr: 'أعمال اللياسة',
    groupNameEn: 'Plastering Works',
    groupIcon: 'PaintBucket',
    groupColor: 'amber',
    nameAr: 'لياسة خارجية',
    nameEn: 'External Plastering',
    icon: 'Building',
    scope: 'EXTERNAL',
    unit: 'm2',
    calculationMethod: 'WALL_DEDUCTION',
    defaultWastage: 5,
    subCategories: [
      { id: 'EP_CEMENT', nameAr: 'لياسة إسمنتية خارجية', nameEn: 'External Cement Plaster' },
      { id: 'EP_MACHINE', nameAr: 'لياسة آلية خارجية', nameEn: 'External Machine Plaster' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '30–45 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '45–65 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '65–90 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  3. أعمال الدهانات                               ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_INTERIOR_PAINT',
    groupId: 'PAINTING',
    groupNameAr: 'أعمال الدهانات',
    groupNameEn: 'Painting Works',
    groupIcon: 'Paintbrush',
    groupColor: 'blue',
    nameAr: 'دهان داخلي (جدران وأسقف)',
    nameEn: 'Interior Paint (Walls & Ceilings)',
    icon: 'Paintbrush',
    scope: 'PER_FLOOR',
    unit: 'm2',
    calculationMethod: 'WALL_DEDUCTION',
    defaultWastage: 10,
    // ملاحظة: الجدران والأسقف في بند واحد لأن نفس المقاول عادةً ينفذهما معاً
    // الحاسبة تفصل بينهما: مساحة الجدران (محيط × ارتفاع - خصومات) + مساحة الأسقف
    subCategories: [
      { id: 'PAINT_PLASTIC', nameAr: 'دهان بلاستيك (لاتكس)', nameEn: 'Latex / Plastic Paint' },
      { id: 'PAINT_ACRYLIC', nameAr: 'دهان أكريليك', nameEn: 'Acrylic Paint' },
      { id: 'PAINT_VELVET', nameAr: 'دهان مخملي', nameEn: 'Velvet Paint' },
      { id: 'PAINT_TEXTURE', nameAr: 'دهان تكستشر', nameEn: 'Texture Paint' },
      { id: 'PAINT_WALLPAPER', nameAr: 'ورق جدران', nameEn: 'Wallpaper' },
      { id: 'PAINT_WOOD_VARNISH', nameAr: 'دهان/ورنيش أخشاب', nameEn: 'Wood Varnish' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (ناشونال/محلي)', nameEn: 'Economy', priceRangeAr: '12–22 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي (جوتن فينيل مات / الجزيرة)', nameEn: 'Standard', priceRangeAr: '22–38 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز (جوتن فينوماستيك)', nameEn: 'Premium', priceRangeAr: '38–60 ر.س/م²' },
      { id: 'LUXURY', nameAr: 'فاخر (بنجامين مور / فارو آند بول)', nameEn: 'Luxury', priceRangeAr: '60–120 ر.س/م²' },
    ],
  },

  {
    id: 'FINISHING_FACADE_PAINT',
    groupId: 'PAINTING',
    groupNameAr: 'أعمال الدهانات',
    groupNameEn: 'Painting Works',
    groupIcon: 'Paintbrush',
    groupColor: 'blue',
    nameAr: 'دهان الواجهات الخارجية',
    nameEn: 'Exterior Facade Paint',
    icon: 'PaintRoller',
    scope: 'EXTERNAL',
    unit: 'm2',
    calculationMethod: 'WALL_DEDUCTION',
    defaultWastage: 10,
    subCategories: [
      { id: 'FP_SMOOTH', nameAr: 'دهان خارجي ناعم', nameEn: 'Smooth Exterior Paint' },
      { id: 'FP_TEXTURE', nameAr: 'تكستشر واجهات', nameEn: 'Textured Facade Paint' },
      { id: 'FP_ELASTOMERIC', nameAr: 'دهان مطاطي مقاوم', nameEn: 'Elastomeric Paint' },
      { id: 'FP_STONE_PAINT', nameAr: 'دهان حجري', nameEn: 'Stone-Effect Paint' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '18–30 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي (جوتن شيلد)', nameEn: 'Standard', priceRangeAr: '30–50 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '50–85 ر.س/م²' },
    ],
  },

  {
    id: 'FINISHING_BOUNDARY_PAINT',
    groupId: 'PAINTING',
    groupNameAr: 'أعمال الدهانات',
    groupNameEn: 'Painting Works',
    groupIcon: 'Paintbrush',
    groupColor: 'blue',
    nameAr: 'دهان السور الخارجي',
    nameEn: 'Boundary Wall Paint',
    icon: 'Fence',
    scope: 'EXTERNAL',
    unit: 'm2',
    calculationMethod: 'WALL_DEDUCTION',
    defaultWastage: 8,
    subCategories: [
      { id: 'BP_EXTERIOR', nameAr: 'دهان خارجي سور', nameEn: 'Exterior Boundary Paint' },
      { id: 'BP_TEXTURE', nameAr: 'تكستشر سور', nameEn: 'Textured Boundary Paint' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '15–25 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '25–40 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  4. أعمال الأرضيات                               ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_FLOOR_TILES',
    groupId: 'FLOORING',
    groupNameAr: 'أعمال الأرضيات',
    groupNameEn: 'Flooring Works',
    groupIcon: 'LayoutGrid',
    groupColor: 'teal',
    nameAr: 'أرضيات',
    nameEn: 'Floor Tiles & Finishes',
    icon: 'LayoutGrid',
    scope: 'PER_FLOOR',       // ← هنا المفتاح: يتكرر لكل دور
    unit: 'm2',
    calculationMethod: 'ROOM_BY_ROOM',
    defaultWastage: 10,
    subCategories: [
      { id: 'FT_PORCELAIN', nameAr: 'بورسلان', nameEn: 'Porcelain' },
      { id: 'FT_CERAMIC', nameAr: 'سيراميك', nameEn: 'Ceramic' },
      { id: 'FT_MARBLE', nameAr: 'رخام طبيعي', nameEn: 'Natural Marble' },
      { id: 'FT_GRANITE', nameAr: 'جرانيت', nameEn: 'Granite' },
      { id: 'FT_SPC', nameAr: 'أرضيات SPC', nameEn: 'SPC Flooring' },
      { id: 'FT_PARQUET', nameAr: 'باركيه / خشب', nameEn: 'Parquet / Wood' },
      { id: 'FT_EPOXY', nameAr: 'إيبوكسي', nameEn: 'Epoxy' },
      { id: 'FT_CARPET', nameAr: 'موكيت', nameEn: 'Carpet' },
      { id: 'FT_VINYL', nameAr: 'فينيل', nameEn: 'Vinyl' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (صيني 60×60)', nameEn: 'Economy', priceRangeAr: '35–65 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي (سعودي/هندي 80×80)', nameEn: 'Standard', priceRangeAr: '65–130 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز (إسباني/إيطالي 120×120)', nameEn: 'Premium', priceRangeAr: '130–280 ر.س/م²' },
      { id: 'LUXURY', nameAr: 'فاخر (رخام طبيعي/بورسلان كبير)', nameEn: 'Luxury', priceRangeAr: '280–700 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  5. أعمال تكسيات الجدران                         ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_WALL_TILES',
    groupId: 'WALL_CLADDING',
    groupNameAr: 'أعمال تكسيات الجدران',
    groupNameEn: 'Wall Cladding Works',
    groupIcon: 'Layers',
    groupColor: 'cyan',
    nameAr: 'تكسيات جدران (بورسلان/سيراميك)',
    nameEn: 'Wall Tiles (Porcelain/Ceramic)',
    icon: 'Layers',
    scope: 'PER_FLOOR',
    unit: 'm2',
    calculationMethod: 'WALL_DEDUCTION',
    defaultWastage: 12,
    subCategories: [
      { id: 'WT_FULL', nameAr: 'تكسية كاملة (أرضية للسقف)', nameEn: 'Full Height' },
      { id: 'WT_HALF', nameAr: 'نصف جدار (1.2م)', nameEn: 'Half Height (1.2m)' },
      { id: 'WT_SPLASH', nameAr: 'خلفية مطبخ (سبلاش)', nameEn: 'Kitchen Splash Back' },
      { id: 'WT_ACCENT', nameAr: 'جدار مميز (أكسنت)', nameEn: 'Accent Wall' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '40–75 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '75–160 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '160–350 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  6. أعمال الأسقف المستعارة                       ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_FALSE_CEILING',
    groupId: 'FALSE_CEILING',
    groupNameAr: 'أعمال الأسقف المستعارة',
    groupNameEn: 'False Ceiling Works',
    groupIcon: 'Layers3',
    groupColor: 'gray',
    nameAr: 'جبس بورد / أسقف مستعارة',
    nameEn: 'Gypsum Board / False Ceilings',
    icon: 'Layers3',
    scope: 'PER_FLOOR',       // ← يتكرر لكل دور
    unit: 'm2',
    calculationMethod: 'ROOM_BY_ROOM',
    defaultWastage: 10,
    subCategories: [
      { id: 'FC_FLAT', nameAr: 'سقف مسطح', nameEn: 'Flat Ceiling' },
      { id: 'FC_DROP', nameAr: 'سقف منخفض (دروب سيلنج)', nameEn: 'Drop Ceiling' },
      { id: 'FC_LAYERED', nameAr: 'طبقات متعددة', nameEn: 'Multi-Layer' },
      { id: 'FC_COFFERED', nameAr: 'سقف كاسيت', nameEn: 'Coffered Ceiling' },
      { id: 'FC_CURVED', nameAr: 'أشكال منحنية', nameEn: 'Curved Forms' },
      { id: 'FC_HIDDEN_LIGHT', nameAr: 'مع إضاءة مخفية (كوف لايت)', nameEn: 'With Cove Lighting' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (مسطح بسيط)', nameEn: 'Economy', priceRangeAr: '45–75 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي (دروب + إضاءة)', nameEn: 'Standard', priceRangeAr: '75–130 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز (طبقات + تصاميم)', nameEn: 'Premium', priceRangeAr: '130–260 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  7. أعمال الأبواب                                 ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_INTERIOR_DOORS',
    groupId: 'DOORS',
    groupNameAr: 'أعمال الأبواب',
    groupNameEn: 'Door Works',
    groupIcon: 'DoorOpen',
    groupColor: 'orange',
    nameAr: 'أبواب داخلية',
    nameEn: 'Interior Doors',
    icon: 'DoorOpen',
    scope: 'WHOLE_BUILDING',
    unit: 'piece',
    calculationMethod: 'PER_UNIT',
    defaultWastage: 0,
    subCategories: [
      { id: 'ID_WOOD_SOLID', nameAr: 'خشب صلب (ماسيف)', nameEn: 'Solid Wood' },
      { id: 'ID_WOOD_HDF', nameAr: 'HDF / MDF مضغوط', nameEn: 'HDF / MDF' },
      { id: 'ID_WPC', nameAr: 'WPC (خشب بلاستيكي)', nameEn: 'WPC' },
      { id: 'ID_GLASS', nameAr: 'أبواب زجاجية', nameEn: 'Glass Doors' },
      { id: 'ID_SLIDING', nameAr: 'أبواب سحّاب', nameEn: 'Sliding Doors' },
      { id: 'ID_POCKET', nameAr: 'أبواب مخفية (بوكيت)', nameEn: 'Pocket Doors' },
      { id: 'ID_BATHROOM', nameAr: 'أبواب حمامات (مقاومة رطوبة)', nameEn: 'Bathroom Doors' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (HDF صيني)', nameEn: 'Economy', priceRangeAr: '350–700 ر.س/باب' },
      { id: 'STANDARD', nameAr: 'عادي (MDF تركي/سعودي)', nameEn: 'Standard', priceRangeAr: '700–1,600 ر.س/باب' },
      { id: 'PREMIUM', nameAr: 'ممتاز (خشب طبيعي/WPC)', nameEn: 'Premium', priceRangeAr: '1,600–4,000 ر.س/باب' },
      { id: 'LUXURY', nameAr: 'فاخر (خشب ماسيف + نقش)', nameEn: 'Luxury', priceRangeAr: '4,000–12,000+ ر.س/باب' },
    ],
  },

  {
    id: 'FINISHING_EXTERIOR_DOORS',
    groupId: 'DOORS',
    groupNameAr: 'أعمال الأبواب',
    groupNameEn: 'Door Works',
    groupIcon: 'DoorOpen',
    groupColor: 'orange',
    nameAr: 'أبواب خارجية ورئيسية',
    nameEn: 'Exterior & Main Doors',
    icon: 'DoorClosed',
    scope: 'WHOLE_BUILDING',
    unit: 'piece',
    calculationMethod: 'PER_UNIT',
    defaultWastage: 0,
    subCategories: [
      { id: 'ED_MAIN_WOOD', nameAr: 'باب رئيسي خشب', nameEn: 'Main Wood Door' },
      { id: 'ED_MAIN_STEEL', nameAr: 'باب رئيسي حديد/فولاذ', nameEn: 'Main Steel Door' },
      { id: 'ED_FIRE_RATED', nameAr: 'باب مقاوم حريق', nameEn: 'Fire-Rated Door' },
      { id: 'ED_VILLA_ENTRY', nameAr: 'مدخل فيلا (مزدوج)', nameEn: 'Villa Double Entry' },
    ],
    qualityLevels: [
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '2,000–5,000 ر.س' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '5,000–15,000 ر.س' },
      { id: 'LUXURY', nameAr: 'فاخر', nameEn: 'Luxury', priceRangeAr: '15,000–50,000 ر.س' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  8. أعمال النوافذ والألمنيوم                     ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_WINDOWS',
    groupId: 'WINDOWS',
    groupNameAr: 'أعمال النوافذ والألمنيوم',
    groupNameEn: 'Window & Aluminum Works',
    groupIcon: 'AppWindow',
    groupColor: 'indigo',
    nameAr: 'نوافذ ألمنيوم',
    nameEn: 'Aluminum Windows',
    icon: 'AppWindow',
    scope: 'WHOLE_BUILDING',
    unit: 'm2',
    calculationMethod: 'PER_UNIT',
    defaultWastage: 0,
    subCategories: [
      { id: 'WIN_SLIDING', nameAr: 'سحّاب', nameEn: 'Sliding' },
      { id: 'WIN_CASEMENT', nameAr: 'مصراع (فتح للخارج)', nameEn: 'Casement' },
      { id: 'WIN_FIXED', nameAr: 'ثابت', nameEn: 'Fixed' },
      { id: 'WIN_TILT', nameAr: 'ميلان ودوران', nameEn: 'Tilt & Turn' },
      { id: 'WIN_UPVC', nameAr: 'UPVC', nameEn: 'UPVC' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (ألمنيوم عادي)', nameEn: 'Economy', priceRangeAr: '280–500 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي (ألمنيوم سعودي)', nameEn: 'Standard', priceRangeAr: '500–850 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز (مكسور حراري)', nameEn: 'Premium', priceRangeAr: '850–1,500 ر.س/م²' },
      { id: 'LUXURY', nameAr: 'فاخر (UPVC / ألمنيوم أوروبي)', nameEn: 'Luxury', priceRangeAr: '1,500–2,500 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  9. الأدوات الصحية                               ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_BATHROOMS',
    groupId: 'SANITARY',
    groupNameAr: 'الأدوات الصحية والسيراميك',
    groupNameEn: 'Sanitary Fixtures & Ceramics',
    groupIcon: 'Bath',
    groupColor: 'violet',
    nameAr: 'تجهيز حمامات (أدوات صحية)',
    nameEn: 'Bathroom Fixtures',
    icon: 'Bath',
    scope: 'WHOLE_BUILDING',
    unit: 'set',
    calculationMethod: 'PER_UNIT',
    defaultWastage: 0,
    subCategories: [
      { id: 'BT_MASTER', nameAr: 'حمام ماستر', nameEn: 'Master Bathroom' },
      { id: 'BT_GUEST', nameAr: 'حمام ضيوف', nameEn: 'Guest Bathroom' },
      { id: 'BT_STANDARD', nameAr: 'حمام عادي', nameEn: 'Standard Bathroom' },
      { id: 'BT_HALF', nameAr: 'نصف حمام (مرحاض فقط)', nameEn: 'Half Bath / WC' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (صيني)', nameEn: 'Economy', priceRangeAr: '2,500–5,500 ر.س/طقم' },
      { id: 'STANDARD', nameAr: 'عادي (TOTO / Ideal Standard)', nameEn: 'Standard', priceRangeAr: '5,500–14,000 ر.س/طقم' },
      { id: 'PREMIUM', nameAr: 'ممتاز (Duravit / Kohler)', nameEn: 'Premium', priceRangeAr: '14,000–35,000 ر.س/طقم' },
      { id: 'LUXURY', nameAr: 'فاخر (Villeroy & Boch / Grohe)', nameEn: 'Luxury', priceRangeAr: '35,000–80,000+ ر.س/طقم' },
    ],
  },

  {
    id: 'FINISHING_MARBLE_VANITIES',
    groupId: 'SANITARY',
    groupNameAr: 'الأدوات الصحية والسيراميك',
    groupNameEn: 'Sanitary Fixtures & Ceramics',
    groupIcon: 'Bath',
    groupColor: 'violet',
    nameAr: 'مغاسل ورخاميات',
    nameEn: 'Vanities & Marble Tops',
    icon: 'Droplets',
    scope: 'WHOLE_BUILDING',
    unit: 'piece',
    calculationMethod: 'PER_UNIT',
    defaultWastage: 0,
    subCategories: [
      { id: 'MV_SINGLE', nameAr: 'مغسلة فردية', nameEn: 'Single Vanity' },
      { id: 'MV_DOUBLE', nameAr: 'مغسلة مزدوجة', nameEn: 'Double Vanity' },
      { id: 'MV_WALL', nameAr: 'مغسلة معلقة', nameEn: 'Wall-Mounted' },
      { id: 'MV_FREESTANDING', nameAr: 'مغسلة أرضية مستقلة', nameEn: 'Freestanding' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (رخام صناعي)', nameEn: 'Economy', priceRangeAr: '500–1,300 ر.س' },
      { id: 'STANDARD', nameAr: 'عادي (جرانيت/رخام محلي)', nameEn: 'Standard', priceRangeAr: '1,300–3,500 ر.س' },
      { id: 'PREMIUM', nameAr: 'ممتاز (رخام طبيعي مستورد)', nameEn: 'Premium', priceRangeAr: '3,500–9,000 ر.س' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  10. أعمال المطابخ                                ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_KITCHEN',
    groupId: 'KITCHEN',
    groupNameAr: 'أعمال المطابخ',
    groupNameEn: 'Kitchen Works',
    groupIcon: 'ChefHat',
    groupColor: 'rose',
    nameAr: 'خزائن وسطح عمل المطبخ',
    nameEn: 'Kitchen Cabinets & Countertops',
    icon: 'ChefHat',
    scope: 'WHOLE_BUILDING',
    unit: 'm',
    calculationMethod: 'LINEAR',
    defaultWastage: 0,
    subCategories: [
      { id: 'KT_LOWER', nameAr: 'خزائن سفلية', nameEn: 'Lower Cabinets' },
      { id: 'KT_UPPER', nameAr: 'خزائن علوية', nameEn: 'Upper Cabinets' },
      { id: 'KT_COUNTERTOP_GRANITE', nameAr: 'سطح عمل جرانيت', nameEn: 'Granite Countertop' },
      { id: 'KT_COUNTERTOP_QUARTZ', nameAr: 'سطح عمل كوارتز', nameEn: 'Quartz Countertop' },
      { id: 'KT_COUNTERTOP_MARBLE', nameAr: 'سطح عمل رخام', nameEn: 'Marble Countertop' },
      { id: 'KT_ISLAND', nameAr: 'جزيرة مطبخ', nameEn: 'Kitchen Island' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي (MDF صيني)', nameEn: 'Economy', priceRangeAr: '800–1,600 ر.س/م.ط' },
      { id: 'STANDARD', nameAr: 'عادي (MDF تركي/سعودي)', nameEn: 'Standard', priceRangeAr: '1,600–3,200 ر.س/م.ط' },
      { id: 'PREMIUM', nameAr: 'ممتاز (خشب طبيعي/لاكر)', nameEn: 'Premium', priceRangeAr: '3,200–6,500 ر.س/م.ط' },
      { id: 'LUXURY', nameAr: 'فاخر (إيطالي/ألماني)', nameEn: 'Luxury', priceRangeAr: '6,500–16,000+ ر.س/م.ط' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  11. أعمال الدرج والدرابزين                      ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_INTERNAL_STAIRS',
    groupId: 'STAIRS',
    groupNameAr: 'أعمال الدرج والدرابزين',
    groupNameEn: 'Stairs & Railing Works',
    groupIcon: 'ArrowUpDown',
    groupColor: 'stone',
    nameAr: 'تكسية درج داخلي',
    nameEn: 'Internal Stair Cladding',
    icon: 'ArrowUpDown',
    scope: 'WHOLE_BUILDING',
    unit: 'piece',  // عدد الدرجات
    calculationMethod: 'LINEAR',
    defaultWastage: 5,
    subCategories: [
      { id: 'IS_MARBLE', nameAr: 'رخام', nameEn: 'Marble' },
      { id: 'IS_GRANITE', nameAr: 'جرانيت', nameEn: 'Granite' },
      { id: 'IS_PORCELAIN', nameAr: 'بورسلان', nameEn: 'Porcelain' },
      { id: 'IS_WOOD', nameAr: 'خشب', nameEn: 'Wood' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '200–450 ر.س/درجة' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '450–900 ر.س/درجة' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '900–2,000 ر.س/درجة' },
    ],
  },

  {
    id: 'FINISHING_EXTERNAL_STAIRS',
    groupId: 'STAIRS',
    groupNameAr: 'أعمال الدرج والدرابزين',
    groupNameEn: 'Stairs & Railing Works',
    groupIcon: 'ArrowUpDown',
    groupColor: 'stone',
    nameAr: 'تكسية درج خارجي',
    nameEn: 'External Stair Cladding',
    icon: 'TrendingUp',
    scope: 'EXTERNAL',
    unit: 'piece',
    calculationMethod: 'LINEAR',
    defaultWastage: 5,
    subCategories: [
      { id: 'ES_MARBLE', nameAr: 'رخام', nameEn: 'Marble' },
      { id: 'ES_GRANITE', nameAr: 'جرانيت', nameEn: 'Granite' },
      { id: 'ES_STONE', nameAr: 'حجر طبيعي', nameEn: 'Natural Stone' },
      { id: 'ES_TILES', nameAr: 'بلاط مانع انزلاق', nameEn: 'Anti-Slip Tiles' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '180–380 ر.س/درجة' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '380–700 ر.س/درجة' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '700–1,400 ر.س/درجة' },
    ],
  },

  {
    id: 'FINISHING_RAILINGS',
    groupId: 'STAIRS',
    groupNameAr: 'أعمال الدرج والدرابزين',
    groupNameEn: 'Stairs & Railing Works',
    groupIcon: 'ArrowUpDown',
    groupColor: 'stone',
    nameAr: 'درابزين وحواجز',
    nameEn: 'Railings & Balustrades',
    icon: 'Fence',
    scope: 'WHOLE_BUILDING',
    unit: 'm',
    calculationMethod: 'LINEAR',
    defaultWastage: 5,
    subCategories: [
      { id: 'RL_IRON', nameAr: 'حديد مشغول', nameEn: 'Wrought Iron' },
      { id: 'RL_STAINLESS', nameAr: 'ستانلس ستيل', nameEn: 'Stainless Steel' },
      { id: 'RL_GLASS', nameAr: 'زجاج (سيكوريت)', nameEn: 'Tempered Glass' },
      { id: 'RL_WOOD', nameAr: 'خشب', nameEn: 'Wood' },
      { id: 'RL_ALUMINUM', nameAr: 'ألمنيوم', nameEn: 'Aluminum' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '200–400 ر.س/م.ط' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '400–850 ر.س/م.ط' },
      { id: 'PREMIUM', nameAr: 'ممتاز (زجاج/ستانلس)', nameEn: 'Premium', priceRangeAr: '850–2,200 ر.س/م.ط' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  12. أعمال الواجهات                              ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_STONE_FACADE',
    groupId: 'FACADE',
    groupNameAr: 'أعمال الواجهات',
    groupNameEn: 'Facade Works',
    groupIcon: 'Building2',
    groupColor: 'amber',
    nameAr: 'تكسيات واجهات حجرية',
    nameEn: 'Stone Facade Cladding',
    icon: 'Building2',
    scope: 'EXTERNAL',
    unit: 'm2',
    calculationMethod: 'WALL_DEDUCTION',
    defaultWastage: 10,
    subCategories: [
      { id: 'SF_RIYADH', nameAr: 'حجر رياض', nameEn: 'Riyadh Stone' },
      { id: 'SF_SYRIAN', nameAr: 'حجر شامي', nameEn: 'Syrian / Levant Stone' },
      { id: 'SF_TABUK', nameAr: 'حجر تبوك', nameEn: 'Tabuk Stone' },
      { id: 'SF_THAMAD', nameAr: 'حجر ثمد', nameEn: 'Thamad Stone' },
      { id: 'SF_LIMESTONE', nameAr: 'حجر جيري', nameEn: 'Limestone' },
      { id: 'SF_GRC', nameAr: 'GRC (ألياف زجاجية)', nameEn: 'GRC Panels' },
      { id: 'SF_CLADDING', nameAr: 'كلادينج', nameEn: 'Aluminum Cladding' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '80–150 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '150–280 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '280–550 ر.س/م²' },
    ],
  },

  {
    id: 'FINISHING_FACADE_DECOR',
    groupId: 'FACADE',
    groupNameAr: 'أعمال الواجهات',
    groupNameEn: 'Facade Works',
    groupIcon: 'Building2',
    groupColor: 'amber',
    nameAr: 'زخارف وديكورات واجهات',
    nameEn: 'Facade Decorative Elements',
    icon: 'Castle',
    scope: 'EXTERNAL',
    unit: 'lump_sum',
    calculationMethod: 'LUMP_SUM',
    defaultWastage: 0,
    subCategories: [
      { id: 'FD_GRC_MOLD', nameAr: 'قوالب GRC', nameEn: 'GRC Moldings' },
      { id: 'FD_COLUMNS', nameAr: 'أعمدة ديكورية', nameEn: 'Decorative Columns' },
      { id: 'FD_CORNICES', nameAr: 'كرانيش وبروزات', nameEn: 'Cornices' },
      { id: 'FD_ARCHES', nameAr: 'أقواس', nameEn: 'Arches' },
      { id: 'FD_PARAPETS', nameAr: 'درّة (بارابت)', nameEn: 'Parapets' },
    ],
    qualityLevels: [
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: 'حسب التصميم' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: 'حسب التصميم' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  13. الأعمال الخارجية                            ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_YARD_PAVING',
    groupId: 'EXTERNAL',
    groupNameAr: 'الأعمال الخارجية',
    groupNameEn: 'External & Yard Works',
    groupIcon: 'Trees',
    groupColor: 'green',
    nameAr: 'أرضيات الحوش والمداخل',
    nameEn: 'Yard & Entrance Paving',
    icon: 'LayoutDashboard',
    scope: 'EXTERNAL',
    unit: 'm2',
    calculationMethod: 'DIRECT_AREA',
    defaultWastage: 8,
    subCategories: [
      { id: 'YP_INTERLOCK', nameAr: 'إنترلوك', nameEn: 'Interlock' },
      { id: 'YP_STAMPED', nameAr: 'خرسانة مطبوعة', nameEn: 'Stamped Concrete' },
      { id: 'YP_STONE', nameAr: 'حجر طبيعي', nameEn: 'Natural Stone' },
      { id: 'YP_PORCELAIN', nameAr: 'بورسلان خارجي', nameEn: 'Outdoor Porcelain' },
      { id: 'YP_MARBLE', nameAr: 'رخام خارجي', nameEn: 'Outdoor Marble' },
      { id: 'YP_EXPOSED_AGG', nameAr: 'خرسانة مكشوفة الحصى', nameEn: 'Exposed Aggregate' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '40–80 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '80–160 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '160–350 ر.س/م²' },
    ],
  },

  {
    id: 'FINISHING_FENCE_GATES',
    groupId: 'EXTERNAL',
    groupNameAr: 'الأعمال الخارجية',
    groupNameEn: 'External & Yard Works',
    groupIcon: 'Trees',
    groupColor: 'green',
    nameAr: 'بوابات السور والمداخل',
    nameEn: 'Fence Gates & Entrances',
    icon: 'Shield',
    scope: 'EXTERNAL',
    unit: 'piece',
    calculationMethod: 'PER_UNIT',
    defaultWastage: 0,
    subCategories: [
      { id: 'FG_IRON', nameAr: 'حديد مشغول', nameEn: 'Wrought Iron' },
      { id: 'FG_STEEL', nameAr: 'ستيل', nameEn: 'Steel' },
      { id: 'FG_ALUMINUM', nameAr: 'ألمنيوم', nameEn: 'Aluminum' },
      { id: 'FG_AUTO_SLIDING', nameAr: 'أوتوماتيك سحّاب', nameEn: 'Automatic Sliding' },
      { id: 'FG_AUTO_SWING', nameAr: 'أوتوماتيك مصراع', nameEn: 'Automatic Swing' },
      { id: 'FG_PEDESTRIAN', nameAr: 'بوابة مشاة', nameEn: 'Pedestrian Gate' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '3,000–7,000 ر.س' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '7,000–18,000 ر.س' },
      { id: 'PREMIUM', nameAr: 'ممتاز (أوتوماتيك)', nameEn: 'Premium', priceRangeAr: '18,000–50,000 ر.س' },
    ],
  },

  {
    id: 'FINISHING_LANDSCAPING',
    groupId: 'EXTERNAL',
    groupNameAr: 'الأعمال الخارجية',
    groupNameEn: 'External & Yard Works',
    groupIcon: 'Trees',
    groupColor: 'green',
    nameAr: 'تنسيق حدائق ومسطحات',
    nameEn: 'Landscaping & Green Areas',
    icon: 'Trees',
    scope: 'EXTERNAL',
    unit: 'm2',
    calculationMethod: 'DIRECT_AREA',
    defaultWastage: 0,
    subCategories: [
      { id: 'LS_NATURAL_GRASS', nameAr: 'عشب طبيعي', nameEn: 'Natural Grass' },
      { id: 'LS_ARTIFICIAL_GRASS', nameAr: 'عشب صناعي', nameEn: 'Artificial Grass' },
      { id: 'LS_PLANTING', nameAr: 'زراعة وأشجار', nameEn: 'Planting & Trees' },
      { id: 'LS_IRRIGATION', nameAr: 'شبكة ري', nameEn: 'Irrigation System' },
      { id: 'LS_GARDEN_LIGHT', nameAr: 'إنارة حدائق', nameEn: 'Garden Lighting' },
      { id: 'LS_PERGOLA', nameAr: 'برقولات ومظلات', nameEn: 'Pergolas & Shades' },
      { id: 'LS_POOL', nameAr: 'مسبح', nameEn: 'Swimming Pool' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '50–110 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '110–280 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '280–700 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  14. أعمال السطح                                 ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_ROOF',
    groupId: 'ROOF_WORKS',
    groupNameAr: 'أعمال السطح',
    groupNameEn: 'Roof Works',
    groupIcon: 'Home',
    groupColor: 'red',
    nameAr: 'تشطيبات السطح',
    nameEn: 'Roof Finishing',
    icon: 'Home',
    scope: 'EXTERNAL',
    unit: 'm2',
    calculationMethod: 'DIRECT_AREA',
    defaultWastage: 5,
    subCategories: [
      { id: 'RF_TILES', nameAr: 'بلاط سطح', nameEn: 'Roof Tiles' },
      { id: 'RF_DRAINAGE', nameAr: 'تصريف مياه أمطار', nameEn: 'Rain Drainage' },
      { id: 'RF_RAILING', nameAr: 'سور سطح', nameEn: 'Roof Railing/Parapet' },
      { id: 'RF_SHADE', nameAr: 'مظلات/برقولات سطح', nameEn: 'Roof Shading' },
      { id: 'RF_ROOM', nameAr: 'غرفة خدمات السطح', nameEn: 'Roof Service Room' },
    ],
    qualityLevels: [
      { id: 'ECONOMY', nameAr: 'اقتصادي', nameEn: 'Economy', priceRangeAr: '30–65 ر.س/م²' },
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: '65–130 ر.س/م²' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: '130–280 ر.س/م²' },
    ],
  },

  // ╔══════════════════════════════════════════════════╗
  // ║  15. أعمال الديكور                                ║
  // ╚══════════════════════════════════════════════════╝

  {
    id: 'FINISHING_INTERIOR_DECOR',
    groupId: 'DECOR',
    groupNameAr: 'أعمال الديكور',
    groupNameEn: 'Decoration Works',
    groupIcon: 'Sparkles',
    groupColor: 'pink',
    nameAr: 'ديكورات داخلية',
    nameEn: 'Interior Decorations',
    icon: 'Sparkles',
    scope: 'WHOLE_BUILDING',
    unit: 'lump_sum',
    calculationMethod: 'LUMP_SUM',
    defaultWastage: 0,
    subCategories: [
      { id: 'DC_WALL_PANELS', nameAr: 'بانيلات جدارية', nameEn: 'Wall Panels' },
      { id: 'DC_NICHES', nameAr: 'نيش / تجاويف إضاءة', nameEn: 'Wall Niches' },
      { id: 'DC_TV_UNIT', nameAr: 'وحدة تلفزيون', nameEn: 'TV Unit' },
      { id: 'DC_FEATURE_WALL', nameAr: 'جدار مميز', nameEn: 'Feature Wall' },
      { id: 'DC_MIRRORS', nameAr: 'مرايا ديكورية', nameEn: 'Decorative Mirrors' },
      { id: 'DC_CURTAIN_BOX', nameAr: 'بوكسات ستائر', nameEn: 'Curtain Boxes' },
      { id: 'DC_CEILING_DETAIL', nameAr: 'تفاصيل أسقف ديكورية', nameEn: 'Ceiling Details' },
      { id: 'DC_BUILT_IN', nameAr: 'خزائن مدمجة (بلت إن)', nameEn: 'Built-in Wardrobes' },
    ],
    qualityLevels: [
      { id: 'STANDARD', nameAr: 'عادي', nameEn: 'Standard', priceRangeAr: 'حسب التصميم' },
      { id: 'PREMIUM', nameAr: 'ممتاز', nameEn: 'Premium', priceRangeAr: 'حسب التصميم' },
      { id: 'LUXURY', nameAr: 'فاخر', nameEn: 'Luxury', priceRangeAr: 'حسب التصميم' },
    ],
  },
];
```

---

## المرحلة 3: تحديث API

### 3.1 إضافة API لإعدادات المبنى

```typescript
// ══════════════════════════════════════
// في cost-studies.ts أو ملف جديد finishing.ts
// ══════════════════════════════════════

// 1. حفظ/تحديث إعدادات المبنى
buildingConfig: {
  update: protectedProcedure
    .input(z.object({
      costStudyId: z.string(),
      buildingConfig: z.object({
        totalLandArea: z.number(),
        buildingPerimeter: z.number(),
        floors: z.array(z.object({
          id: z.string(),
          name: z.string(),
          area: z.number(),
          height: z.number(),
          sortOrder: z.number(),
          isRepeated: z.boolean().default(false),
          repeatCount: z.number().default(1),
          floorType: z.enum(['BASEMENT', 'GROUND', 'UPPER', 'ANNEX', 'ROOF', 'MEZZANINE']),
        })),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      // تحقق ملكية + تحديث
    }),
}
```

### 3.2 CRUD بنود التشطيبات

```typescript
finishingItem: {
  // ── إنشاء بند ──
  create: protectedProcedure
    .input(finishingItemInput)
    .use(requirePermission('quantities', 'edit'))
    .mutation(async ({ input, ctx }) => {
      // 1. حساب totalCost
      // 2. إنشاء البند
      // 3. recalculateFinishingCost(costStudyId)
    }),

  // ── تحديث بند ──
  update: protectedProcedure
    .input(z.object({ id: z.string(), ...finishingItemInput.partial() }))
    .use(requirePermission('quantities', 'edit'))
    .mutation(async ({ input, ctx }) => {
      // 1. تحقق ملكية
      // 2. حساب totalCost
      // 3. تحديث
      // 4. recalculateFinishingCost
    }),

  // ── حذف بند ──
  delete: protectedProcedure
    .input(z.object({ id: z.string(), costStudyId: z.string() }))
    .use(requirePermission('quantities', 'edit'))
    .mutation(/* ... */),

  // ── إنشاء دفعة (batch) ──
  createBatch: protectedProcedure
    .input(z.object({
      costStudyId: z.string(),
      items: z.array(finishingItemInput.omit({ costStudyId: true })),
    }))
    .use(requirePermission('quantities', 'edit'))
    .mutation(/* ... */),

  // ── إعادة ترتيب ──
  reorder: protectedProcedure
    .input(z.object({
      costStudyId: z.string(),
      items: z.array(z.object({ id: z.string(), sortOrder: z.number() })),
    }))
    .use(requirePermission('quantities', 'edit'))
    .mutation(/* ... */),
}
```

### 3.3 حساب التكلفة

```typescript
function calculateFinishingItemCost(item: FinishingItemInput): number {
  // مقطوعية
  if (item.unit === 'lump_sum') {
    return (item.materialPrice || 0) + (item.laborPrice || 0);
  }

  const baseQuantity = item.area || item.quantity || item.length || 0;
  const wastage = 1 + (item.wastagePercent || 0) / 100;
  const unitCost = (item.materialPrice || 0) + (item.laborPrice || 0);

  // إذا كان دور متكرر — الكمية تُضرب بعدد التكرارات
  // (يُمرر من الـ frontend في calculationData.repeatCount)
  const repeatMultiplier = item.calculationData?.repeatCount || 1;

  return baseQuantity * wastage * unitCost * repeatMultiplier;
}
```

---

## المرحلة 4: واجهة المستخدم

### 4.1 هيكل الملفات

```
finishing/
├── page.tsx
└── _components/
    ├── BuildingConfigPanel.tsx        // إعدادات المبنى (أعلى الصفحة)
    ├── FinishingSummary.tsx            // ملخص التكاليف
    ├── FinishingGroupSection.tsx       // قسم مجموعة عمل (مثلاً: أعمال الدهانات)
    ├── FinishingCategoryCard.tsx       // بطاقة فئة واحدة
    ├── FinishingItemRow.tsx            // صف بند
    ├── AddFinishingItemDialog.tsx      // إضافة بند
    ├── EditFinishingItemDialog.tsx     // تعديل بند
    ├── FloorSelector.tsx              // اختيار الدور (للبنود PER_FLOOR)
    ├── calculators/
    │   ├── RoomByRoomCalculator.tsx
    │   ├── WallDeductionCalculator.tsx
    │   ├── PerUnitCalculator.tsx
    │   ├── DirectAreaCalculator.tsx
    │   ├── LinearCalculator.tsx
    │   └── LumpSumCalculator.tsx
    └── QuickAddTemplates.tsx
```

### 4.2 تخطيط الصفحة الكامل

```
┌─────────────────────────────────────────────────────────────────┐
│  ← رجوع   │   أعمال التشطيبات                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗   │
│  ║  ⚙️  إعدادات المبنى                              [تعديل] ║   │
│  ║                                                           ║   │
│  ║  مساحة الأرض: 600 م²   │  محيط المبنى: 80 م             ║   │
│  ║                                                           ║   │
│  ║  الأدوار:                                                 ║   │
│  ║  ┌─ الدور الأرضي  400م² (3.2م) ──────────────────────┐  ║   │
│  ║  ├─ الدور الأول   400م² (3.2م)                        │  ║   │
│  ║  ├─ الملحق        180م² (3.0م)                        │  ║   │
│  ║  └─ السطح         400م²                                │  ║   │
│  ║                                                           ║   │
│  ║  إجمالي مساحة البناء: 1,380 م²                           ║   │
│  ╚═══════════════════════════════════════════════════════════╝   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  إجمالي العناصر: 24  │  التكلفة الإجمالية: 285,000 ر.س  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [📋 قوالب جاهزة]                                               │
│                                                                  │
│  ── أعمال العزل 🛡️ ─────────────────────────────────────────   │
│  ┌────────────┐ ┌────────────┐                                  │
│  │ العزل      │ │ العزل      │                                  │
│  │ المائي     │ │ الحراري    │                                  │
│  │ 3 عناصر   │ │ 2 عنصر    │                                  │
│  │ 12,500 ر.س│ │ 8,200 ر.س │                                  │
│  │   [+ أضف] │ │   [+ أضف]  │                                  │
│  └────────────┘ └────────────┘                                  │
│                                                                  │
│  ── أعمال اللياسة 🪣 ────────────────────────────────────────   │
│  ┌────────────────────────┐ ┌────────────────────────┐          │
│  │ لياسة داخلية           │ │ لياسة خارجية           │          │
│  │ (جدران وأسقف)         │ │                        │          │
│  │                        │ │ 1 عنصر                │          │
│  │ ┌── الدور الأرضي ──┐  │ │ 28,000 ر.س            │          │
│  │ │  850 م² = 42,500  │  │ │   [+ أضف]             │          │
│  │ └──────────────────┘  │ └────────────────────────┘          │
│  │ ┌── الدور الأول ────┐  │                                     │
│  │ │  850 م² = 42,500  │  │                                     │
│  │ └──────────────────┘  │                                     │
│  │ ┌── الملحق ─────────┐  │                                     │
│  │ │  400 م² = 20,000  │  │                                     │
│  │ └──────────────────┘  │                                     │
│  │ المجموع: 105,000 ر.س │                                     │
│  │   [+ أضف لدور]        │                                     │
│  └────────────────────────┘                                     │
│                                                                  │
│  ── أعمال الدهانات 🎨 ───────────────────────────────────────   │
│  ┌────────────────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ دهان داخلي             │ │ دهان واجهات  │ │ دهان السور   │  │
│  │ (جدران وأسقف)         │ │ الخارجية     │ │ الخارجي     │  │
│  │                        │ │              │ │              │  │
│  │ ← نفس نمط الأدوار →   │ │ 1 عنصر      │ │ 1 عنصر      │  │
│  │                        │ │ 18,000 ر.س  │ │ 5,400 ر.س   │  │
│  │   [+ أضف لدور]        │ │   [+ أضف]   │ │   [+ أضف]   │  │
│  └────────────────────────┘ └──────────────┘ └──────────────┘  │
│                                                                  │
│  ── أعمال الأرضيات ▦ ────────────────────────────────────────   │
│  ┌────────────────────────────────────────────┐                 │
│  │ أرضيات                                      │                 │
│  │                                              │                 │
│  │ ┌── الدور الأرضي ─────── بورسلان ────────┐  │                 │
│  │ │  صالة 24م² + غ.نوم 20م² + مطبخ 12م²   │  │                 │
│  │ │  = 56 م² + 10% هالك = 61.6 م²          │  │                 │
│  │ │  61.6 × 95 = 5,852 ر.س       [✏️] [🗑️] │  │                 │
│  │ └──────────────────────────────────────────┘  │                 │
│  │ ┌── الدور الأول ──────── باركيه ─────────┐  │                 │
│  │ │  3 غرف = 52 م² + 10% = 57.2 م²        │  │                 │
│  │ │  57.2 × 120 = 6,864 ر.س      [✏️] [🗑️] │  │                 │
│  │ └──────────────────────────────────────────┘  │                 │
│  │   [+ أضف أرضيات لدور]                        │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  ... باقي المجموعات بنفس النمط ...                              │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 سلوك البنود `PER_FLOOR`

عند الضغط على **[+ أضف لدور]** في فئة `PER_FLOOR`:

```
┌─────────────────────────────────────────────────────────────────┐
│  إضافة أرضيات                                             ✕    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  اختر الدور: [▼ الدور الأرضي      ]                            │
│              ┌──────────────────────┐                            │
│              │ ● الدور الأرضي      │                            │
│              │ ○ الدور الأول        │                            │
│              │ ○ الملحق             │  ← فقط الأدوار من          │
│              │ ○ السطح              │    buildingConfig          │
│              │ ────────────────     │                            │
│              │ ○ كل الأدوار (نسخ)  │  ← ينشئ بند لكل دور       │
│              └──────────────────────┘                            │
│                                                                  │
│  النوع الفرعي: [▼ بورسلان                    ]                  │
│  مستوى الجودة: [▼ عادي (65-130 ر.س/م²)       ]                 │
│                                                                  │
│  [📐 حساب المساحة — غرفة بغرفة]  ← يفتح RoomByRoomCalculator  │
│                                                                  │
│  المساحة: [    56    ] م²                                       │
│  الهالك: [ 10 ] %                                                │
│  سعر المواد: [  70  ] ر.س/م²                                    │
│  سعر التركيب: [ 25  ] ر.س/م²                                    │
│                                                                  │
│  ─────────────────────────────────────                          │
│  الكمية الفعلية: 61.60 م²                                       │
│  التكلفة: 61.60 × 95 = 5,852 ر.س                               │
│                                                                  │
│  [إلغاء]                                        [✓ حفظ]        │
└─────────────────────────────────────────────────────────────────┘
```

**خيار "كل الأدوار (نسخ)":** ينشئ نفس البند لكل دور مُعرّف، مع استخدام مساحة كل دور تلقائياً.

### 4.4 الحاسبات الذكية

نفس المواصفات من الإصدار الأول (المرجع: `PROMPT_FINISHING_MODULE.md` v1) مع التعديلات التالية:

#### RoomByRoomCalculator

**بدون تغيير** — نفس السلوك: Enter للانتقال، إضافة غرف ديناميكياً.

#### WallDeductionCalculator

**تحسين:** يأخذ تلقائياً `height` الدور المحدد من `buildingConfig.floors`:

```
┌─────────────────────────────────────────────────────────────────┐
│  حساب مساحة الجدران — الدور الأرضي                        ✕    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ◉ حساب من المحيط    ○ حساب من الغرف                           │
│                                                                  │
│  إجمالي محيط الجدران (م.ط): [  65  ]                           │
│  ارتفاع الجدران (م):        [  3.2 ] ← مأخوذ من إعدادات الدور │
│                                                                  │
│  المساحة الإجمالية: 208.00 م²                                   │
│                                                                  │
│  ── مساحة الأسقف (للدهان الداخلي فقط) ──                       │
│  ☑ تضمين مساحة الأسقف: [  400  ] م² ← من مساحة الدور          │
│                                                                  │
│  ── الخصومات ──                                                  │
│                                                                  │
│  نوع الفتحة            │ الأبعاد     │ العدد │ المساحة          │
│  ───────────────────────┼─────────────┼───────┼─────────         │
│  باب عادي               │ 0.90 × 2.10│ [ 8 ] │  15.12 م²       │
│  باب حمام               │ 0.70 × 2.10│ [ 4 ] │   5.88 م²       │
│  باب رئيسي              │ 1.20 × 2.40│ [ 1 ] │   2.88 م²       │
│  شباك كبير             │ 1.50 × 1.50│ [ 4 ] │   9.00 م²       │
│  شباك متوسط            │ 1.20 × 1.20│ [ 3 ] │   4.32 م²       │
│  شباك حمام             │ 0.60 × 0.60│ [ 4 ] │   1.44 م²       │
│  [+ فتحة مخصصة]                                                 │
│                                                                  │
│  ─────────────────────────────────────────                      │
│  مساحة الجدران:     208.00 م²                                   │
│  مساحة الأسقف:    + 400.00 م²                                   │
│  إجمالي الخصومات: −  38.64 م²                                   │
│  المساحة الصافية:    569.36 م²                                   │
│  + هالك 10%:        + 56.94 م²                                   │
│  المساحة الفعلية:    626.30 م²                                   │
│                                                                  │
│  [إلغاء]                                        [✓ تطبيق]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## المرحلة 5: القوالب الجاهزة

### 5.1 منطق القوالب

القوالب تستخدم `buildingConfig` لحساب الكميات تلقائياً:

```typescript
function generateVillaTemplate(config: BuildingConfig): FinishingItemInput[] {
  const items: FinishingItemInput[] = [];
  const floors = config.floors.filter(f => f.floorType !== 'ROOF');

  // لكل دور (عدا السطح) → أرضيات + جبس + دهان داخلي + لياسة داخلية
  for (const floor of floors) {
    const effectiveArea = floor.area * floor.repeatCount;

    items.push({
      category: 'FINISHING_FLOOR_TILES',
      floorId: floor.id,
      floorName: floor.name,
      name: `أرضيات ${floor.name}`,
      area: effectiveArea * 0.85, // تقدير: 85% من المساحة (خصم الجدران)
      unit: 'm2',
      wastagePercent: 10,
      materialPrice: 80,
      laborPrice: 25,
      // ...
    });

    items.push({
      category: 'FINISHING_FALSE_CEILING',
      floorId: floor.id,
      floorName: floor.name,
      name: `جبس بورد ${floor.name}`,
      area: effectiveArea * 0.7, // تقدير: 70% جبس (بعض الغرف بدون)
      // ...
    });

    items.push({
      category: 'FINISHING_INTERIOR_PAINT',
      floorId: floor.id,
      floorName: floor.name,
      name: `دهان داخلي ${floor.name}`,
      // الحاسبة: محيط × ارتفاع + مساحة سقف - خصومات
      area: (config.buildingPerimeter * floor.height) + effectiveArea,
      // ...
    });
  }

  // بنود على مستوى المبنى ككل
  const totalArea = floors.reduce((s, f) => s + f.area * f.repeatCount, 0);
  const doorCount = Math.ceil(totalArea / 35); // تقدير: باب لكل 35م²

  items.push({
    category: 'FINISHING_INTERIOR_DOORS',
    name: 'أبواب داخلية',
    quantity: doorCount,
    // ...
  });

  // ... باقي البنود

  return items;
}
```

---

## المرحلة 6: الترجمة

أضف في `ar.json` و `en.json`:

```json
{
  "pricing": {
    "finishing": {
      "title": "أعمال التشطيبات",
      "buildingConfig": {
        "title": "إعدادات المبنى",
        "totalLandArea": "مساحة الأرض الإجمالية",
        "buildingPerimeter": "محيط المبنى التقريبي",
        "floors": "الأدوار",
        "floorName": "اسم الدور",
        "floorArea": "المساحة",
        "floorHeight": "الارتفاع",
        "addFloor": "إضافة دور",
        "repeatedFloor": "دور متكرر",
        "repeatCount": "عدد التكرار",
        "totalBuildingArea": "إجمالي مساحة البناء",
        "floorTypes": {
          "BASEMENT": "بدروم",
          "GROUND": "الدور الأرضي",
          "UPPER": "دور علوي",
          "ANNEX": "ملحق",
          "ROOF": "السطح",
          "MEZZANINE": "ميزانين"
        }
      },
      "scope": {
        "PER_FLOOR": "لكل دور",
        "WHOLE_BUILDING": "على مستوى المبنى",
        "EXTERNAL": "أعمال خارجية"
      },
      "addForFloor": "إضافة لدور",
      "allFloors": "كل الأدوار (نسخ)",
      "selectFloor": "اختر الدور",
      "groups": {
        "INSULATION": "أعمال العزل",
        "PLASTERING": "أعمال اللياسة",
        "PAINTING": "أعمال الدهانات",
        "FLOORING": "أعمال الأرضيات",
        "WALL_CLADDING": "أعمال تكسيات الجدران",
        "FALSE_CEILING": "أعمال الأسقف المستعارة",
        "DOORS": "أعمال الأبواب",
        "WINDOWS": "أعمال النوافذ والألمنيوم",
        "SANITARY": "الأدوات الصحية والسيراميك",
        "KITCHEN": "أعمال المطابخ",
        "STAIRS": "أعمال الدرج والدرابزين",
        "FACADE": "أعمال الواجهات",
        "EXTERNAL": "الأعمال الخارجية",
        "ROOF_WORKS": "أعمال السطح",
        "DECOR": "أعمال الديكور"
      },
      "calculator": {
        "roomByRoom": "حساب غرفة بغرفة",
        "wallDeduction": "حساب الجدران مع الخصومات",
        "perUnit": "حساب بالوحدة",
        "directArea": "مساحة مباشرة",
        "linear": "متر طولي",
        "lumpSum": "مبلغ مقطوع",
        "includeCeiling": "تضمين مساحة الأسقف",
        "customOpening": "فتحة مخصصة"
      },
      "quality": {
        "ECONOMY": "اقتصادي",
        "STANDARD": "عادي",
        "PREMIUM": "ممتاز",
        "LUXURY": "فاخر"
      },
      "units": {
        "m2": "م²",
        "m": "م.ط",
        "piece": "عدد",
        "set": "طقم",
        "lump_sum": "مقطوعية"
      }
    }
  }
}
```

---

## المرحلة 7: ملاحظات تنفيذية

### 7.1 قواعد حرجة

1. **لا أعمال كهروميكانيكية هنا** — كل ما يخص الكهرباء، التكييف، السباكة، الإطفاء، المصاعد، الانتركم → قسم MEP المنفصل
2. **الأدوار ديناميكية** — لا تفترض عدد أدوار ثابت
3. **البنود `PER_FLOOR`** تربط بـ `floorId` — هذا يسمح بحذف/تعديل بنود دور واحد دون التأثير على الباقي
4. **الدور المتكرر** يُخزن كدور واحد مع `repeatCount` — التكلفة تُضرب بعدد التكرارات

### 7.2 ترتيب العرض

المجموعات تظهر بترتيب `sortOrder` من `FINISHING_GROUPS` (يتبع مراحل التنفيذ الفعلية):
1. أعمال العزل → 2. اللياسة → 3. الدهانات → 4. الأرضيات → 5. تكسيات جدران → 6. أسقف مستعارة → 7. أبواب → 8. نوافذ → 9. أدوات صحية → 10. مطابخ → 11. درج → 12. واجهات → 13. أعمال خارجية → 14. سطح → 15. ديكور

### 7.3 أنماط UI

- **نفس أنماط `structural/page.tsx`** بالضبط
- البطاقات مجمّعة تحت عناوين المجموعات مع خط فاصل ملوّن
- بنود `PER_FLOOR` تعرض أقساماً فرعية لكل دور داخل البطاقة
- `shadcn/ui` components + Tailwind
- RTL كامل

### 7.4 الأمان

- `protectedProcedure` على كل endpoint
- `organizationId` check في كل query
- `requirePermission('quantities', 'edit')` للكتابة
- `requirePermission('quantities', 'view')` للقراءة

### 7.5 الأداء

- `createBatch` للقوالب (معاملة واحدة بدل عشرات)
- فهارس: `[costStudyId, category]`, `[costStudyId, floorId]`
- `revalidatePath` بعد mutations

### 7.6 التنفيذ خطوة بخطوة

```
الخطوة 1: اقرأ structural/page.tsx وكل components المرتبطة
الخطوة 2: اقرأ packages/api/src/queries/cost-studies.ts
الخطوة 3: اقرأ prisma/schema.prisma (FinishingItem الحالي)
الخطوة 4: اقرأ packages/i18n/messages/ar.json (قسم pricing)

الخطوة 5: حدّث Schema (أضف حقول + migration)
الخطوة 6: أنشئ finishing-categories.ts
الخطوة 7: حدّث/أضف API procedures
الخطوة 8: ابنِ BuildingConfigPanel
الخطوة 9: ابنِ الصفحة الرئيسية + المجموعات + البطاقات
الخطوة 10: ابنِ الحاسبات (RoomByRoom → WallDeduction → البقية)
الخطوة 11: ابنِ القوالب الجاهزة
الخطوة 12: حدّث ملفات الترجمة
الخطوة 13: اختبر كل فئة
```

---

## ملخص الفئات النهائية (22 فئة في 15 مجموعة)

| # | المجموعة | الفئة | النطاق | الوحدة |
|---|---------|--------|--------|--------|
| 1 | أعمال العزل | العزل المائي | PER_FLOOR | م² |
| 2 | أعمال العزل | العزل الحراري | WHOLE_BUILDING | م² |
| 3 | أعمال اللياسة | لياسة داخلية (جدران وأسقف) | PER_FLOOR | م² |
| 4 | أعمال اللياسة | لياسة خارجية | EXTERNAL | م² |
| 5 | أعمال الدهانات | دهان داخلي (جدران وأسقف) | PER_FLOOR | م² |
| 6 | أعمال الدهانات | دهان الواجهات الخارجية | EXTERNAL | م² |
| 7 | أعمال الدهانات | دهان السور الخارجي | EXTERNAL | م² |
| 8 | أعمال الأرضيات | أرضيات | PER_FLOOR | م² |
| 9 | أعمال تكسيات الجدران | تكسيات جدران | PER_FLOOR | م² |
| 10 | أعمال الأسقف المستعارة | جبس بورد / أسقف مستعارة | PER_FLOOR | م² |
| 11 | أعمال الأبواب | أبواب داخلية | WHOLE_BUILDING | عدد |
| 12 | أعمال الأبواب | أبواب خارجية ورئيسية | WHOLE_BUILDING | عدد |
| 13 | أعمال النوافذ | نوافذ ألمنيوم | WHOLE_BUILDING | م² |
| 14 | الأدوات الصحية | تجهيز حمامات | WHOLE_BUILDING | طقم |
| 15 | الأدوات الصحية | مغاسل ورخاميات | WHOLE_BUILDING | عدد |
| 16 | أعمال المطابخ | خزائن وسطح عمل | WHOLE_BUILDING | م.ط |
| 17 | أعمال الدرج | تكسية درج داخلي | WHOLE_BUILDING | عدد درجات |
| 18 | أعمال الدرج | تكسية درج خارجي | EXTERNAL | عدد درجات |
| 19 | أعمال الدرج | درابزين وحواجز | WHOLE_BUILDING | م.ط |
| 20 | أعمال الواجهات | تكسيات واجهات حجرية | EXTERNAL | م² |
| 21 | أعمال الواجهات | زخارف وديكورات واجهات | EXTERNAL | مقطوعية |
| 22 | الأعمال الخارجية | أرضيات الحوش والمداخل | EXTERNAL | م² |
| 23 | الأعمال الخارجية | بوابات السور والمداخل | EXTERNAL | عدد |
| 24 | الأعمال الخارجية | تنسيق حدائق ومسطحات | EXTERNAL | م² |
| 25 | أعمال السطح | تشطيبات السطح | EXTERNAL | م² |
| 26 | أعمال الديكور | ديكورات داخلية | WHOLE_BUILDING | مقطوعية |
