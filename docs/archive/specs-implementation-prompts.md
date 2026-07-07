# برومبتات Claude Code — قسم المواصفات في التشطيبات

> **تعليمات:** نفّذ كل مرحلة على حدة. استخدم Plan Mode أولاً. تأكد من نجاح كل مرحلة قبل الانتقال للتالية.
> **السياق:** قسم التشطيبات الحالي يحسب الكميات (41 بند تقريباً). الآن نضيف طبقة "المواصفات" التي تحوّل كل كمية إلى قائمة مواد فرعية تفصيلية. بدون أسعار — كميات ومواد فقط.

---

## المرحلة 1: بنية البيانات والأنواع

```
## المهمة
إنشاء بنية البيانات لنظام المواصفات: الأنواع TypeScript، توسيع قاعدة البيانات، وقاموس المواصفات لكل فئة تشطيب.

## السياق الحالي (اقرأ هذه الملفات أولاً لفهم النظام):
- `apps/web/modules/saas/pricing/lib/finishing-categories.ts` — الـ 26 فئة وخصائصها
- `apps/web/modules/saas/pricing/lib/smart-building-types.ts` — أنواع إعدادات المبنى
- `packages/database/prisma/schema.prisma` — نموذج FinishingItem (يحتوي بالفعل: qualityLevel, brand, specifications, calculationData JsonB)
- `apps/web/modules/saas/pricing/lib/derivation-engine.ts` — محرك اشتقاق الكميات
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx` — لوحة الكميات الحالية

## المطلوب

### 1. إنشاء ملف الأنواع الرئيسي
أنشئ `apps/web/modules/saas/pricing/lib/specs/spec-types.ts`:

```typescript
// === نموذج المواصفات لبند واحد ===
export interface ItemSpecification {
  categoryKey: string;          // مفتاح الفئة (مثل 'FINISHING_FLOOR_TILES')
  specTypeKey: string;          // مفتاح نوع المواصفة (مثل 'porcelain_60x60')
  specTypeLabel: string;        // اسم العرض ("بورسلان 60×60")
  options: Record<string, any>; // الخيارات المحددة (المقاس، طريقة التركيب، إلخ)
  subItems: SpecSubItem[];      // المواد الفرعية المحسوبة
  notes?: string;               // ملاحظات إضافية
}

// === مادة فرعية ===
export interface SpecSubItem {
  id: string;                   // معرّف فريد
  name: string;                 // اسم المادة بالعربية
  nameEn: string;               // اسم المادة بالإنجليزية
  unit: string;                 // الوحدة (كجم، لتر، م²، عدد، م.ط)
  ratePerUnit: number;          // معدل الاستهلاك لكل وحدة من البند الأصلي
  quantity: number;             // الكمية المحسوبة = ratePerUnit × كمية البند الفعلية
  category: 'main' | 'adhesive' | 'primer' | 'filler' | 'accessory' | 'protection' | 'tool';
  isOptional: boolean;          // هل المادة اختيارية
  brand?: string;               // الماركة المختارة
  notes?: string;
}

// === قاموس مواصفات فئة واحدة ===
export interface CategorySpecConfig {
  categoryKey: string;
  specTypes: SpecTypeOption[];   // الأنواع المتاحة
  commonOptions: SpecOption[];   // خيارات مشتركة لكل الأنواع
  qualityPresets: QualityPreset[]; // إعدادات مسبقة حسب الجودة
}

// === نوع مواصفة متاح ===
export interface SpecTypeOption {
  key: string;                  // 'porcelain_60x60', 'ceramic_40x40', etc.
  label: string;                // "بورسلان 60×60"
  labelEn: string;              // "Porcelain 60×60"
  defaultOptions: Record<string, any>;
  subItemRates: SubItemRate[];  // معدلات المواد الفرعية لهذا النوع
  specificOptions?: SpecOption[]; // خيارات خاصة بهذا النوع فقط
}

// === معدل مادة فرعية ===
export interface SubItemRate {
  subItemKey: string;           // مفتاح المادة (مثل 'tile_adhesive')
  name: string;
  nameEn: string;
  unit: string;
  ratePerUnit: number;          // المعدل الأساسي
  category: SpecSubItem['category'];
  isOptional: boolean;
  conditionalOn?: string;       // مرتبط بخيار معين (مثل 'hasScreed')
}

// === خيار قابل للتحديد ===
export interface SpecOption {
  key: string;
  label: string;
  labelEn: string;
  type: 'select' | 'number' | 'boolean' | 'text';
  options?: { value: string; label: string; labelEn: string }[];
  defaultValue: any;
  affectsSubItems?: boolean;    // هل يؤثر على حساب المواد
}

// === إعداد مسبق حسب الجودة ===
export interface QualityPreset {
  quality: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY';
  specTypeKey: string;          // النوع الافتراضي لهذه الجودة
  options: Record<string, any>; // الخيارات الافتراضية
  suggestedBrands?: string[];
}

// === نموذج محفوظ (Template) ===
export interface SpecificationTemplate {
  id: string;
  name: string;                 // "تشطيب فاخر"
  nameEn?: string;
  description?: string;
  organizationId: string;
  createdById: string;
  isDefault: boolean;
  isSystem: boolean;            // نموذج نظام (غير قابل للحذف)
  specs: SavedCategorySpec[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedCategorySpec {
  categoryKey: string;
  specTypeKey: string;
  options: Record<string, any>;
  brand?: string;
  qualityLevel?: string;
}
```

### 2. إضافة نموذج SpecificationTemplate لقاعدة البيانات
أضف في `packages/database/prisma/schema.prisma`:

```prisma
model SpecificationTemplate {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdById    String   @map("created_by_id")
  createdBy      User     @relation(fields: [createdById], references: [id])

  name           String
  nameEn         String?  @map("name_en")
  description    String?  @db.Text
  isDefault      Boolean  @default(false) @map("is_default")
  isSystem       Boolean  @default(false) @map("is_system")
  specs          Json     @db.JsonB  // SavedCategorySpec[]

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([organizationId])
  @@map("specification_templates")
}
```

أيضاً أضف حقل في FinishingItem لتخزين المواصفات المفصّلة:
```prisma
// أضف هذا الحقل في model FinishingItem بعد حقل specifications
specData Json? @db.JsonB @map("spec_data")  // ItemSpecification
```

أضف العلاقة في model Organization:
```prisma
specificationTemplates SpecificationTemplate[]
```

وفي model User:
```prisma
specificationTemplates SpecificationTemplate[]
```

### 3. إنشاء قاموس المواصفات لكل فئة (الملف الأكبر والأهم)
أنشئ `apps/web/modules/saas/pricing/lib/specs/spec-catalog.ts`

هذا الملف يحتوي على CategorySpecConfig لكل فئة من الـ 26 فئة.

اتبع الجداول التالية بدقة لكل فئة:

---

#### الفئة 1: العزل المائي (FINISHING_WATERPROOFING)
**الأنواع:**
| key | الاسم | المواد الفرعية لكل م² |
|-----|-------|----------------------|
| `cement_flexible` | عزل أسمنتي مرن | برايمر 0.25 لتر + مكون A أسمنتي 1.75 كجم + مكون B سائل 0.6 لتر + شريط تقوية 0.4 م.ط (اختياري) + شبك فايبر 1.1 م² (اختياري) |
| `bitumen_rolls` | رولات بيتومينية | برايمر بيتوميني 0.4 لتر + رول 4مم 1.15 م² + رول 3مم 1.15 م² + ماستك 0.3 كجم + لياسة حماية 1.0 م² (اختياري) |
| `liquid_bitumen` | سائل بيتوميني | برايمر 0.3 لتر + سائل بيتوميني 1.5 كجم |
| `polyurethane` | بولي يوريثان (PU) | برايمر 0.2 لتر + PU سائل 1.5 كجم |
| `epoxy` | إيبوكسي | برايمر إيبوكسي 0.15 لتر + طلاء إيبوكسي 0.5 كجم |
| `other` | أخرى | (يدوي) |

**الخيارات:**
- موقع التطبيق: [أساسات, حمامات, سطح, أحواض زراعية, مسبح, خزان]
- عدد الطبقات: [2, 3]
- هل يوجد شريط تقوية: [نعم, لا]
- هل يوجد طبقة حماية: [لياسة 3سم, بلاط, لا]
- الماركة: [Sika, BASF, Index, TAMEER, Dr.Fixit, أخرى]

---

#### الفئة 2: العزل الحراري (FINISHING_THERMAL_INSULATION)
**الأنواع:**
| key | الاسم | المواد الفرعية لكل م² |
|-----|-------|----------------------|
| `xps_50` | XPS بوليسترين مبثوق 50مم | ألواح XPS 1.05 م² + لاصق 3.5 كجم + مسامير تثبيت 5 عدد + شريط فواصل 0.5 م.ط |
| `eps_50` | EPS بوليسترين ممدد 50مم | ألواح EPS 1.05 م² + لاصق 3.5 كجم + مسامير 5 عدد + شريط 0.5 م.ط |
| `rock_wool_50` | صوف صخري 50مم | ألواح صوف صخري 1.05 م² + مسامير 5 عدد + فيلم بخار 1.1 م² + شريط ألمنيوم 0.5 م.ط |
| `pu_spray` | بولي يوريثان رش | مادة PU رش 1.8 كجم (لسماكة 50مم) |
| `other` | أخرى | (يدوي) |

**الخيارات:**
- موقع التطبيق: [جدران خارجية, سطح, تجويف]
- السماكة (مم): [30, 40, 50, 60, 75, 100]
- طريقة التثبيت: [لصق, تثبيت ميكانيكي, لصق + تثبيت]
- هل يوجد حاجز بخار: [نعم, لا]
- الماركة: [SABIC, Al Watania, Rockwool, Knauf, أخرى]

> **مهم:** عند تغيير السماكة عن 50مم، اضرب كمية المادة الأساسية × (السماكة/50). مثلاً 75مم = ×1.5

---

#### الفئة 3: لياسة داخلية (FINISHING_INTERNAL_PLASTER)
**الأنواع:**
| key | الاسم | المواد الفرعية لكل م² |
|-----|-------|----------------------|
| `cement_manual` | أسمنتية بؤج وأوتار | طرطشة: أسمنت 2.0 كجم + رمل خشن 2.0 كجم // لياسة: أسمنت 6.0 كجم + رمل ناعم 28 كجم + ماء 6 لتر + شبك تقوية 0.3 م² + زوايا حماية 0.15 م.ط + بؤج ألمنيوم 0.6 م.ط |
| `cement_machine` | أسمنتية ماكينة | لياسة جاهزة 15 كجم + ماء 6 لتر + بؤج ألمنيوم 0.6 م.ط + زوايا 0.15 م.ط |
| `gypsum_manual` | جبسية يدوية | جبس لياسة 10 كجم + ماء 7 لتر + بؤج 0.5 م.ط + زوايا 0.1 م.ط + شبك فايبر 0.2 م² |
| `gypsum_machine` | جبسية ماكينة (MP75) | لياسة جبسية MP75 جاهزة 10 كجم + ماء 7 لتر + بؤج 0.5 م.ط + زوايا 0.1 م.ط + شبك 0.2 م² |
| `other` | أخرى | (يدوي) |

**الخيارات:**
- السماكة (مم): [10, 15, 20, 25]
- نسبة الخلط (أسمنتية فقط): [1:3, 1:4, 1:6]
- هل تشمل الطرطشة: [نعم, لا]
- هل يوجد شبك تقوية: [كامل, فواصل فقط, لا]
- هل يوجد زوايا حماية: [نعم, لا]
- الماركة (جبسية): [Knauf, Gyproc, National Gypsum, أخرى]

---

#### الفئة 4: لياسة خارجية (FINISHING_EXTERNAL_PLASTER)
**الأنواع:** نفس `cement_manual` و `cement_machine` لكن:
- نسبة الخلط 1:3 (أقوى)
- إضافة: مادة مقاومة للماء (Sika-1) 0.15 لتر/م²
- إضافة: شبك تقوية كامل 1.1 م²/م² (إلزامي)
- إضافة: سقالات 1.0 م²/م² (بند إضافي)

---

#### الفئة 5: دهان داخلي (FINISHING_INTERIOR_PAINT)
**الأنواع:**
| key | الاسم | المواد الفرعية لكل م² |
|-----|-------|----------------------|
| `plastic_matt` | بلاستيك مطفي | معجون أساسي 1.0 كجم + معجون ناعم 0.6 كجم + صنفرة 0.1 ورقة + أساس (برايمر) 0.11 لتر + دهان نهائي 0.22 لتر + شريط لاصق 0.1 م.ط + نايلون حماية 0.3 م² |
| `plastic_satin` | بلاستيك ساتان | نفس المطفي مع تغيير نوع الدهان |
| `plastic_semi_gloss` | بلاستيك لامع | نفس المطفي مع تغيير نوع الدهان |
| `acrylic` | أكريليك | نفس المطفي مع تغيير نوع الدهان + الأساس |
| `velvet` | مخملي | معجون 1.0 كجم + صنفرة + أساس خاص 0.12 لتر + دهان مخملي 0.30 لتر |
| `texture` | تأثيرات خاصة | أساس + مادة تكستشر 1.5 كجم |
| `other` | أخرى | (يدوي) |

**الخيارات:**
- تحضير السطح: [معجون كامل (طبقتان), معجون خفيف (طبقة), بدون معجون]
- عدد الأوجه: [2, 3]
- الماركة: [Jotun, National Paints, Hempel, Caparol, Valentine, أخرى]
- هل يشمل السقف: [نعم — نفس الدهان, نعم — دهان مختلف, لا]

---

#### الفئة 6: دهان واجهات (FINISHING_FACADE_PAINT)
**الأنواع:**
| key | الاسم | المواد الفرعية لكل م² |
|-----|-------|----------------------|
| `acrylic_exterior` | أكريليك خارجي | أساس خارجي 0.13 لتر + دهان خارجي 0.30 لتر + سقالات 1.0 م² |
| `elastomeric` | إلاستوميري (مرن) | أساس 0.13 لتر + دهان مرن 0.35 لتر + سقالات 1.0 م² |
| `texture_exterior` | تكستشر خارجي | أساس + جرافياتو/تكستشر 2.0 كجم + سقالات |
| `other` | أخرى | (يدوي) |

---

#### الفئة 7: دهان سور (FINISHING_BOUNDARY_PAINT)
نفس أنواع دهان الواجهات بدون سقالات.

---

#### الفئة 8: أرضيات (FINISHING_FLOOR_TILES)
**الأنواع:**
| key | الاسم | المواد الفرعية لكل م² |
|-----|-------|----------------------|
| `porcelain_60x60` | بورسلان 60×60 | بلاط 1.10 م² + غراء C1 4.5 كجم + فواصل 0.4 كجم + صلبان 12 عدد + وزرات 0.3 م.ط + زوايا ألمنيوم 0.05 م.ط |
| `porcelain_80x80` | بورسلان 80×80 | بلاط 1.10 م² + غراء C1 4.5 كجم + فواصل 0.3 كجم + صلبان 8 عدد + وزرات 0.3 م.ط |
| `porcelain_120x120` | بورسلان 120×120 | بلاط 1.08 م² + غراء C2 5.0 كجم + فواصل 0.2 كجم + صلبان 5 عدد + وزرات 0.3 م.ط |
| `porcelain_60x120` | بورسلان 60×120 | بلاط 1.10 م² + غراء C1 4.5 كجم + فواصل 0.3 كجم + صلبان 8 عدد + وزرات 0.3 م.ط |
| `ceramic_40x40` | سيراميك 40×40 | بلاط 1.10 م² + غراء C1 4.0 كجم + فواصل 0.5 كجم + صلبان 15 عدد + وزرات 0.3 م.ط |
| `ceramic_30x30` | سيراميك 30×30 | بلاط 1.12 م² + غراء C1 4.0 كجم + فواصل 0.6 كجم + صلبان 18 عدد + وزرات 0.3 م.ط |
| `marble` | رخام طبيعي | رخام 1.10 م² + خلطة لصق (أسمنت أبيض + رمل) 18 كجم + فواصل أسمنت أبيض 0.2 كجم + مادة تلميع 0.05 لتر + وزرات 0.3 م.ط |
| `granite` | جرانيت | جرانيت 1.10 م² + خلطة لصق 18 كجم + فواصل 0.2 كجم + وزرات 0.3 م.ط |
| `spc` | SPC/باركيه | ألواح SPC 1.08 م² + فوم عازل 1.05 م² + وزرات PVC 0.3 م.ط + شريط حواف 0.05 م.ط |
| `vinyl` | فينيل | فينيل 1.05 م² + لاصق 0.3 كجم + وزرات PVC 0.3 م.ط |
| `epoxy` | إيبوكسي | أساس إيبوكسي 0.2 كجم + إيبوكسي 1.5 كجم |
| `other` | أخرى | (يدوي) |

**الخيارات:**
- طريقة التركيب: [غراء, خلطة أسمنتية, تعشيق (click), لصق]
- هل تحتاج بطحة أسمنتية: [نعم, لا]
  - إذا نعم: أسمنت 9 كجم + رمل 55 كجم + ماء 8 لتر (لسماكة 4سم)
- نوع الفواصل: [عادي, إيبوكسي]
- حجم الفاصل (مم): [1, 2, 3, 5]
- هل يوجد وزرات: [نفس البلاط, PVC, خشب, لا]
- الماركة: [RAK, Saudi Ceramics, Porcelanosa, Kajaria, أخرى]
- مستوى الجودة: [اقتصادي, متوسط, ممتاز, فاخر]

---

#### الفئة 9: تكسيات جدران (FINISHING_WALL_TILES)
نفس أنواع الأرضيات البلاطية لكن:
- غراء C2 بدل C1 (أقوى للجدران)
- هدر أعلى (1.12 بدل 1.10)
- إضافة: زوايا PVC للحواف 0.2 م.ط + سيليكون 0.1 م.ط

---

#### الفئة 10: أسقف مستعارة (FINISHING_FALSE_CEILING)
**الأنواع:**
| key | الاسم | المواد الفرعية لكل م² |
|-----|-------|----------------------|
| `gypsum_board_flat` | جبس بورد مستوي | ألواح 12.5مم 1.10 م² + بروفايل رئيسي 0.8 م.ط + بروفايل ثانوي 1.6 م.ط + بروفايل حائطي 0.3 م.ط + حوامل 1.5 عدد + مسامير دريوال 15 عدد + شريط فواصل 1.5 م.ط + معجون 0.5 كجم + أساس 0.10 لتر + دهان 0.20 لتر |
| `gypsum_board_design` | جبس بورد مع تصميم | نفس المستوي + 20% زيادة في المواد + إضاءة مخفية (بند منفصل) |
| `suspended_tiles` | سقف معلق بلاطات (60×60) | بلاطات 1.10 م² + بروفايل T 3.3 م.ط + بروفايل حائطي 0.3 م.ط + سلك تعليق 1.5 عدد |
| `other` | أخرى | (يدوي) |

**الخيارات:**
- نوع الجبس بورد: [عادي, مقاوم رطوبة (أخضر), مقاوم حريق (وردي)]
- السماكة: [9.5مم, 12.5مم, 15مم]
- هل يشمل الدهان: [نعم, لا]
- الماركة: [Knauf, Gyproc, National Gypsum, أخرى]

---

#### الفئة 11-12: الأبواب (FINISHING_INTERIOR_DOORS / FINISHING_EXTERIOR_DOORS)
**أنواع الأبواب الداخلية:**
| key | الاسم | المكونات لكل باب |
|-----|-------|-----------------|
| `wpc` | WPC | ضلفة WPC 1 + حلق 1 طقم + كالون 1 + مفصلات 3 + مقبض 1 + وقّاف 1 + سيليكون 5 م.ط + مسامير/فيشر 1 طقم |
| `hdf` | HDF مضغوط | نفس المكونات مع ضلفة HDF |
| `solid_wood` | خشب طبيعي | ضلفة خشب 1 + حلق خشب 1 + كالون 1 + مفصلات نحاس 3 + مقبض 1 + وقّاف 1 + برواز 5 م.ط |
| `aluminum` | ألمنيوم | باب ألمنيوم كامل 1 + كالون 1 + مقبض 1 + سيليكون 5 م.ط |
| `other` | أخرى | (يدوي) |

**أنواع الأبواب الخارجية:**
| key | الاسم |
|-----|-------|
| `steel_security` | فولاذ أمني |
| `solid_wood_exterior` | خشب طبيعي خارجي |
| `wpc_exterior` | WPC خارجي |
| `aluminum_glass` | ألمنيوم + زجاج |
| `other` | أخرى |

---

#### الفئة 13: نوافذ (FINISHING_WINDOWS)
**الأنواع:**
| key | الاسم | المكونات لكل م² |
|-----|-------|-----------------|
| `aluminum_thermal_break` | ألمنيوم قطع حراري | إطار ألمنيوم 4.5 م.ط + زجاج مزدوج DGU 0.85 م² + مطاط عازل 8 م.ط + يد فتح 0.5 عدد + سيليكون 4 م.ط + مسامير 8 عدد + شبكة حشرات 1.0 م² (اختياري) |
| `aluminum_standard` | ألمنيوم عادي | إطار 4.5 م.ط + زجاج مفرد 6مم 0.9 م² + مطاط 6 م.ط + يد 0.5 + سيليكون 4 م.ط + مسامير 8 |
| `upvc` | UPVC | إطار UPVC 4.5 م.ط + زجاج مزدوج 0.85 م² + مطاط 8 م.ط + يد 0.5 + سيليكون 4 م.ط |
| `other` | أخرى | (يدوي) |

---

#### الفئة 14-15: الأدوات الصحية (FINISHING_BATHROOMS / FINISHING_MARBLE_VANITIES)
**أنواع طقم الحمام:**
| key | الاسم | المكونات |
|-----|-------|---------|
| `standard_set` | طقم عادي | مغسلة 1 + خلاط مغسلة 1 + كرسي أفرنجي 1 + شطاف 1 + صندوق طرد 1 + شاور تريه 1 + خلاط شاور 1 + مرآة 1 + إكسسوارات 1 طقم + سيفون أرضي 2 |
| `premium_set` | طقم ممتاز | نفس + زجاج شاور 1 + بانيو (اختياري) |
| `other` | أخرى | (يدوي) |

---

#### الفئة 16: مطابخ (FINISHING_KITCHEN)
**الأنواع:**
| key | الاسم | المكونات لكل م.ط |
|-----|-------|-------------------|
| `mdf_lacquer` | MDF مطلي | خزائن سفلية 1.0 م.ط + خزائن علوية 0.8 م.ط + سطح عمل 1.0 م.ط + مفصلات هيدروليك 4 عدد + سكك أدراج 2 عدد + مقابض 3 عدد + حوض 0.15 عدد + خلاط 0.15 عدد |
| `pvc_membrane` | PVC ممبرين | نفس المكونات مع باب PVC |
| `hpl` | HPL هاي بريشر | نفس مع باب HPL |
| `acrylic` | أكريليك | نفس مع باب أكريليك |
| `aluminum` | ألمنيوم | نفس مع هيكل ألمنيوم |
| `other` | أخرى | (يدوي) |

**خيارات سطح العمل:** [جرانيت محلي, جرانيت مستورد, كوارتز, رخام, HPL, ستانلس]

---

#### الفئة 17-18: الدرج (FINISHING_INTERNAL_STAIRS / FINISHING_EXTERNAL_STAIRS)
**لكل درج (16 درجة تقريباً):**
| المكون | الكمية |
|--------|--------|
| رخام/جرانيت نائمة (30سم عرض) | 16 م.ط |
| رخام/جرانيت قائمة (17سم ارتفاع) | 16 م.ط |
| بسطة | 2.0 م² |
| وزرة جانبية | 11 م.ط |
| لاصق (أسمنت أبيض + رمل) | 35 كجم |
| نف ستانلس (اختياري) | 16 م.ط |

---

#### الفئة 19: درابزين (FINISHING_RAILINGS)
**الأنواع:**
| key | الاسم | المكونات لكل م.ط |
|-----|-------|-------------------|
| `wrought_iron` | حديد مشغول | حديد مشغول 1 م.ط + دهان حديد 0.3 لتر + كابات خشب 1 م.ط |
| `stainless_steel` | ستانلس ستيل | أنابيب ستانلس 1 م.ط + كابات ستانلس 1 م.ط + مسامير تثبيت 4 عدد |
| `glass_stainless` | زجاج + ستانلس | زجاج سيكوريت 10مم 0.9 م² + كابات ستانلس 1 م.ط + مشابك 6 عدد |
| `aluminum` | ألمنيوم | قطاعات ألمنيوم 1 م.ط + مسامير 4 عدد |
| `wood` | خشب | درابزين خشب 1 م.ط + برنيش 0.2 لتر + مسامير 6 عدد |
| `other` | أخرى | (يدوي) |

---

#### الفئة 20: واجهات حجرية (FINISHING_STONE_FACADE)
**الأنواع:**
| key | الاسم | المواد لكل م² |
|-----|-------|--------------|
| `natural_riyadh` | حجر رياضي طبيعي | حجر 1.10 م² + خلطة لصق 18 كجم + مسامير تثبيت 5 عدد + سلك ربط 0.1 كجم + مونة فواصل 1.0 كجم + مادة حماية 0.15 لتر + سقالات 1.0 م² |
| `natural_imported` | حجر طبيعي مستورد | نفس المكونات |
| `manufactured` | حجر صناعي | حجر صناعي 1.10 م² + غراء حجر 5 كجم + فواصل 0.5 كجم + مادة حماية 0.15 لتر + سقالات 1.0 م² |
| `grc` | GRC | ألواح GRC 1.10 م² + هيكل تثبيت 1.0 م² + مسامير 8 عدد + سيليكون فواصل 0.5 م.ط + سقالات 1.0 م² |
| `other` | أخرى | (يدوي) |

---

#### الفئة 22: أرضيات حوش (FINISHING_YARD_PAVING)
**الأنواع:**
| key | الاسم | المواد لكل م² |
|-----|-------|--------------|
| `interlock_6cm` | إنترلوك 6سم | إنترلوك 1.08 م² + رمل تسوية 0.04 م³ + حصمة (بيس كورس) 0.12 م³ + رمل فواصل 5 كجم + بردورات 0.2 م.ط |
| `interlock_8cm` | إنترلوك 8سم | نفس مع سماكة أكبر |
| `outdoor_tiles` | بلاط خارجي | بلاط 1.08 م² + غراء خارجي 5 كجم + فواصل 0.5 كجم |
| `stamped_concrete` | خرسانة مطبوعة | خرسانة 0.08 م³ + صبغة 0.5 كجم + مادة طبع 0.1 كجم + ورنيش حماية 0.15 لتر |
| `other` | أخرى | (يدوي) |

---

#### الفئات 21, 23, 24, 25, 26 (مقطوعية أو بسيطة)
هذه فئات إما مقطوعية أو بسيطة:
- `FINISHING_FACADE_DECOR`: مقطوعية — لا مواد فرعية تلقائية
- `FINISHING_FENCE_GATES`: لكل بوابة — بوابة حديد/ألمنيوم 1 + محرك كهربائي (اختياري) 1 + ريموت (اختياري) 1
- `FINISHING_LANDSCAPING`: عشب صناعي 1.05 م² أو عشب طبيعي 1.05 م² + تربة زراعية 0.15 م³ + شبكة ري (اختياري)
- `FINISHING_ROOF`: نفس مواصفات العزل المائي + بلاط سطح
- `FINISHING_INTERIOR_DECOR`: مقطوعية — لا مواد فرعية تلقائية

### 4. إنشاء محرك حساب المواد الفرعية
أنشئ `apps/web/modules/saas/pricing/lib/specs/spec-calculator.ts`:

```typescript
/**
 * يحسب المواد الفرعية لبند واحد بناءً على مواصفاته وكميته
 */
export function calculateSubItems(
  categoryKey: string,
  specTypeKey: string,
  options: Record<string, any>,
  effectiveQuantity: number,  // الكمية الفعلية (بعد الهدر)
  unit: string
): SpecSubItem[]

/**
 * يطبّق نموذج مواصفات على كل البنود
 */
export function applyTemplate(
  template: SpecificationTemplate,
  items: MergedQuantityItem[]
): ItemSpecification[]

/**
 * يجمع كل المواد الفرعية من كل البنود في جدول موحّد
 */
export function aggregateAllSubItems(
  specs: ItemSpecification[]
): AggregatedMaterial[]

interface AggregatedMaterial {
  name: string;
  nameEn: string;
  unit: string;
  totalQuantity: number;
  usedInItems: string[];  // أسماء البنود التي تستخدم هذه المادة
}
```

### 5. إنشاء 3 نماذج نظام محفوظة
أنشئ `apps/web/modules/saas/pricing/lib/specs/system-templates.ts`:

```typescript
export const SYSTEM_TEMPLATES: Omit<SpecificationTemplate, 'id' | 'organizationId' | 'createdById' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "تشطيب اقتصادي",
    nameEn: "Economy Finishing",
    description: "مواصفات أساسية بتكلفة منخفضة — مناسب للشقق الاستثمارية",
    isDefault: false,
    isSystem: true,
    specs: [
      { categoryKey: "FINISHING_WATERPROOFING", specTypeKey: "cement_flexible", options: { layers: 2 } },
      { categoryKey: "FINISHING_THERMAL_INSULATION", specTypeKey: "eps_50", options: { thickness: 50 } },
      { categoryKey: "FINISHING_INTERNAL_PLASTER", specTypeKey: "cement_manual", options: { thickness: 20, mixRatio: "1:4" } },
      { categoryKey: "FINISHING_INTERIOR_PAINT", specTypeKey: "plastic_matt", options: { preparation: "light_putty", coats: 2 }, brand: "National Paints" },
      { categoryKey: "FINISHING_FLOOR_TILES", specTypeKey: "ceramic_40x40", options: { installation: "adhesive", hasScreed: true }, qualityLevel: "ECONOMY" },
      // ... باقي الفئات
    ]
  },
  {
    name: "تشطيب متوسط",
    nameEn: "Standard Finishing",
    description: "مواصفات متوازنة — الأكثر شيوعاً للفلل السكنية",
    isDefault: true,
    isSystem: true,
    specs: [
      { categoryKey: "FINISHING_WATERPROOFING", specTypeKey: "cement_flexible", options: { layers: 2, hasReinforcement: true } },
      { categoryKey: "FINISHING_THERMAL_INSULATION", specTypeKey: "xps_50", options: { thickness: 50 } },
      { categoryKey: "FINISHING_INTERNAL_PLASTER", specTypeKey: "cement_machine", options: { thickness: 15 } },
      { categoryKey: "FINISHING_INTERIOR_PAINT", specTypeKey: "plastic_satin", options: { preparation: "full_putty", coats: 2 }, brand: "Jotun" },
      { categoryKey: "FINISHING_FLOOR_TILES", specTypeKey: "porcelain_60x60", options: { installation: "adhesive", hasScreed: true }, qualityLevel: "STANDARD" },
      // ... باقي الفئات
    ]
  },
  {
    name: "تشطيب فاخر",
    nameEn: "Premium Finishing",
    description: "مواصفات عالية الجودة — للفلل الفاخرة",
    isDefault: false,
    isSystem: true,
    specs: [
      { categoryKey: "FINISHING_WATERPROOFING", specTypeKey: "bitumen_rolls", options: { layers: 3, hasReinforcement: true } },
      { categoryKey: "FINISHING_THERMAL_INSULATION", specTypeKey: "xps_50", options: { thickness: 75 } },
      { categoryKey: "FINISHING_INTERNAL_PLASTER", specTypeKey: "gypsum_machine", options: { thickness: 10 }, brand: "Knauf" },
      { categoryKey: "FINISHING_INTERIOR_PAINT", specTypeKey: "acrylic", options: { preparation: "full_putty", coats: 3 }, brand: "Caparol" },
      { categoryKey: "FINISHING_FLOOR_TILES", specTypeKey: "porcelain_120x120", options: { installation: "adhesive", hasScreed: true }, qualityLevel: "PREMIUM" },
      // ... باقي الفئات
    ]
  }
];
```

**أكمل specs لكل النماذج الثلاثة لكل الـ 26 فئة** حسب الجداول في هذا البرومبت.

## تشغيل Prisma
```bash
cd packages/database && pnpm generate && pnpm db:push
```

## الملفات
- `apps/web/modules/saas/pricing/lib/specs/spec-types.ts` (جديد)
- `apps/web/modules/saas/pricing/lib/specs/spec-catalog.ts` (جديد — الأكبر ~1500-2000 سطر)
- `apps/web/modules/saas/pricing/lib/specs/spec-calculator.ts` (جديد)
- `apps/web/modules/saas/pricing/lib/specs/system-templates.ts` (جديد)
- `packages/database/prisma/schema.prisma` (تعديل)

## معايير النجاح
- كل الـ 26 فئة لها CategorySpecConfig مع أنواع ومواد فرعية
- spec-calculator يحسب المواد الفرعية بشكل صحيح لأي بند
- 3 نماذج نظام جاهزة (اقتصادي، متوسط، فاخر)
- لا أخطاء TypeScript
- Prisma generate و db:push ينجحان
```

---

## المرحلة 2: واجهة اختيار المواصفات (Specification Editor)

```
## المهمة
إنشاء واجهة اختيار المواصفات لكل بند — تظهر عند الضغط على بند في جدول الكميات.

## السياق
- الكميات موجودة في QuantitiesDashboard.tsx
- المواصفات معرّفة في spec-catalog.ts (المرحلة 1)
- المحسوبات في spec-calculator.ts (المرحلة 1)
- FinishingItem يحتوي حقل specData (JsonB) لتخزين المواصفات

## المطلوب

### 1. مكوّن اختيار المواصفات لبند واحد
أنشئ `apps/web/modules/saas/pricing/components/finishing/specs/ItemSpecEditor.tsx`:

هذا المكوّن يظهر **داخل QuantityRowExpanded** (inline — ليس dialog) عند الضغط على زر "المواصفات" في الصف الموسّع.

**التصميم:**
```
┌──────────────────────────────────────────────────────────────┐
│ المواصفات — أرضيات بورسلان (الدور الأرضي)     [حفظ] [إلغاء]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  نوع الأرضيات:  [بورسلان 60×60 ▼]                           │
│                                                              │
│  ┌─ خيارات ──────────────────────────────────────────────┐  │
│  │ طريقة التركيب: [غراء ▼]                                │  │
│  │ بطحة أسمنتية:  [☑ نعم]                                │  │
│  │ نوع الفواصل:   [عادي ▼]    حجم الفاصل: [2 ▼] مم       │  │
│  │ وزرات:         [نفس البلاط ▼]                          │  │
│  │ الماركة:       [RAK ▼]                                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ المواد الفرعية المحسوبة (660 م² فعلية) ───────────────┐ │
│  │ المادة              │ الوحدة │ لكل م² │ الإجمالي       │ │
│  │ بورسلان RAK 60×60   │ م²    │ 1.10  │ 726.0          │ │
│  │ غراء بلاط C1        │ كجم   │ 4.5   │ 2,970          │ │
│  │ فواصل عادي          │ كجم   │ 0.4   │ 264            │ │
│  │ صلبان 2مم           │ عدد   │ 12    │ 7,920          │ │
│  │ ── بطحة أسمنتية ──                                     │ │
│  │ أسمنت              │ كجم   │ 9.0   │ 5,940          │ │
│  │ رمل                │ كجم   │ 55    │ 36,300         │ │
│  │ ── وزرات ──                                            │ │
│  │ وزرات بورسلان      │ م.ط   │ 0.3   │ 198            │ │
│  │ زوايا ألمنيوم      │ م.ط   │ 0.05  │ 33             │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**السلوك:**
- تغيير النوع ← تتغير الخيارات المتاحة + تُعاد حساب المواد الفرعية
- تغيير أي خيار يؤثر على المواد ← إعادة حساب فوري
- زر "حفظ" يحفظ specData في FinishingItem عبر API update
- إذا البند يدوي بدون كمية ← المواد الفرعية تظهر فارغة "أدخل الكمية أولاً"

### 2. تعديل QuantityRowExpanded
عدّل `QuantityRowExpanded.tsx`:
- أضف تبويبين: "تفاصيل الحساب" (الحالي) | "المواصفات" (الجديد)
- تبويب "المواصفات" يعرض ItemSpecEditor
- إذا specData محفوظ: يعرض ملخص المواصفات + زر "تعديل"
- إذا لا: يعرض رسالة "لم تُحدد المواصفات بعد" + زر "تحديد المواصفات"
- أيقونة صغيرة في الصف الأصلي (قبل التوسيع) تشير لحالة المواصفات:
  - ⚙️ (أخضر) = مواصفات محددة
  - ⚙️ (رمادي) = بدون مواصفات

### 3. زر "تحديد مواصفات الكل" في الأعلى
في `QuantitiesDashboard.tsx`:
- أضف زر "⚙️ تحديد المواصفات" بجانب "إضافة بند يدوي"
- عند الضغط يفتح SpecBulkEditor (المرحلة 3)

### 4. حفظ المواصفات
عند حفظ مواصفات بند:
```typescript
updateMutation.mutate({
  id: item.savedId,
  specData: {
    categoryKey: item.category,
    specTypeKey: selectedSpec.key,
    specTypeLabel: selectedSpec.label,
    options: selectedOptions,
    subItems: calculatedSubItems,
  },
  qualityLevel: selectedQuality,
  brand: selectedBrand,
  specifications: generateSpecDescription(selectedSpec, selectedOptions), // نص وصفي
});
```

## الملفات
- `apps/web/modules/saas/pricing/components/finishing/specs/ItemSpecEditor.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/QuantityRowExpanded.tsx` (تعديل)
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx` (تعديل)
- `apps/web/messages/ar/pricing.json` (تعديل — إضافة مفاتيح specs)
- `apps/web/messages/en/pricing.json` (تعديل)

## معايير النجاح
- فتح أي بند يعرض تبويب "المواصفات"
- اختيار النوع يعرض الخيارات الصحيحة
- تغيير أي خيار يحدّث المواد الفرعية فوراً
- الحفظ يعمل بدون أخطاء
- الأيقونة في الصف تعكس حالة المواصفات
```

---

## المرحلة 3: تحديد المواصفات بالجملة (Bulk Spec Editor)

```
## المهمة
إنشاء واجهة لتحديد مواصفات كل البنود دفعة واحدة — مع دعم النماذج المحفوظة.

## المطلوب

### 1. مكوّن SpecBulkEditor
أنشئ `apps/web/modules/saas/pricing/components/finishing/specs/SpecBulkEditor.tsx`:

صفحة/dialog كبير يعرض كل المجموعات مع مواصفات كل بند:

**التصميم:**
```
┌──────────────────────────────────────────────────────────────────┐
│ تحديد المواصفات                                    [حفظ الكل]  │
├──────────────────────────────────────────────────────────────────┤
│ تطبيق نموذج: [اقتصادي ▼ | متوسط | فاخر | نموذج مخصص...]      │
│              [تطبيق]  [حفظ كنموذج جديد]                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ▼ أعمال العزل                                        [تحديد الكل]│
│ ┌─────────────────┬──────────────┬──────────────┬───────┐       │
│ │ البند           │ النوع        │ الماركة      │ الحالة│       │
│ │ عزل مائي حمامات│ [أسمنتي مرن▼]│ [Sika ▼]    │ ✅    │       │
│ │ عزل مائي سطح   │ [رولات    ▼] │ [Index ▼]   │ ✅    │       │
│ │ عزل حراري جدران│ [XPS 50مم ▼] │ [SABIC ▼]   │ ✅    │       │
│ │ عزل حراري سطح  │ [XPS 50مم ▼] │ [SABIC ▼]   │ ✅    │       │
│ └─────────────────┴──────────────┴──────────────┴───────┘       │
│                                                                  │
│ ▼ أعمال اللياسة                                                  │
│ ┌─────────────────┬──────────────┬──────────────┬───────┐       │
│ │ لياسة داخلية    │ [ماكينة  ▼]  │ [          ] │ ✅    │       │
│ │ لياسة خارجية    │ [تقليدية ▼]  │ [          ] │ ✅    │       │
│ └─────────────────┴──────────────┴──────────────┴───────┘       │
│                                                                  │
│ ▼ أعمال الدهانات                                                 │
│   ... (كل مجموعة بنفس النمط)                                     │
│                                                                  │
│ ▶ الضغط على أي صف يوسّعه ليعرض الخيارات التفصيلية               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**السلوك:**
- "تطبيق نموذج" يملأ كل الحقول من النموذج المحدد
- يمكن تعديل أي بند بشكل فردي بعد تطبيق النموذج
- "حفظ الكل" يحفظ specData لكل البنود دفعة واحدة
- الحالة (✅/⚪): هل تم تحديد مواصفات لهذا البند

### 2. إدارة النماذج (Template Management)
أنشئ `apps/web/modules/saas/pricing/components/finishing/specs/TemplateManager.tsx`:

- عرض النماذج المتاحة (نظام + مخصصة)
- حفظ نموذج جديد من المواصفات الحالية
- حذف نموذج مخصص
- تعيين نموذج كافتراضي

### 3. API للنماذج
أنشئ `packages/api/modules/quantities/procedures/`:

- `spec-template-list.ts`: جلب نماذج المنظمة + النماذج النظامية
- `spec-template-create.ts`: إنشاء نموذج مخصص
- `spec-template-update.ts`: تحديث نموذج
- `spec-template-delete.ts`: حذف نموذج (ليس نظامياً)
- `spec-template-set-default.ts`: تعيين نموذج كافتراضي

أضف في router.ts:
```typescript
specTemplate: {
  list: specTemplateList,
  create: specTemplateCreate,
  update: specTemplateUpdate,
  delete: specTemplateDelete,
  setDefault: specTemplateSetDefault,
}
```

### 4. Batch Update API
أنشئ `finishing-item-batch-spec-update.ts`:
```typescript
// يحدّث specData لمجموعة بنود دفعة واحدة
input: {
  organizationId: string,
  costStudyId: string,
  items: { id: string, specData: ItemSpecification }[]
}
```

## الملفات
- `apps/web/modules/saas/pricing/components/finishing/specs/SpecBulkEditor.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/specs/TemplateManager.tsx` (جديد)
- `packages/api/modules/quantities/procedures/spec-template-list.ts` (جديد)
- `packages/api/modules/quantities/procedures/spec-template-create.ts` (جديد)
- `packages/api/modules/quantities/procedures/spec-template-update.ts` (جديد)
- `packages/api/modules/quantities/procedures/spec-template-delete.ts` (جديد)
- `packages/api/modules/quantities/procedures/spec-template-set-default.ts` (جديد)
- `packages/api/modules/quantities/procedures/finishing-item-batch-spec-update.ts` (جديد)
- `packages/api/modules/quantities/router.ts` (تعديل)

## معايير النجاح
- تطبيق نموذج يملأ كل البنود بالمواصفات الصحيحة
- التعديل الفردي يعمل
- حفظ الكل يحفظ specData لكل البنود
- إنشاء/حذف/تعديل النماذج يعمل
- النماذج الثلاثة النظامية تظهر دائماً
```

---

## المرحلة 4: جدول المواد المجمّع (Bill of Materials)

```
## المهمة
إنشاء جدول يجمع كل المواد الفرعية من كل البنود في قائمة مواد موحّدة — وهذا هو الناتج النهائي لقسم المواصفات.

## المطلوب

### 1. مكوّن BillOfMaterials
أنشئ `apps/web/modules/saas/pricing/components/finishing/specs/BillOfMaterials.tsx`:

**التصميم — تبويبان:**

**تبويب 1: حسب البند**
```
┌──────────────────────────────────────────────────────────────┐
│ قائمة المواد — حسب البند                     [تصدير] [طباعة]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ▼ أرضيات بورسلان — الأرضي (660 م²)                          │
│   • بورسلان RAK 60×60         726 م²                         │
│   • غراء بلاط C1             2,970 كجم                       │
│   • فواصل عادي                264 كجم                        │
│   • صلبان 2مم               7,920 عدد                        │
│   • أسمنت (بطحة)           5,940 كجم                         │
│   • رمل (بطحة)            36,300 كجم                         │
│   • وزرات                    198 م.ط                         │
│                                                              │
│ ▼ لياسة داخلية — الأرضي (690 م²)                             │
│   • أسمنت (طرطشة + لياسة)  5,520 كجم                         │
│   • رمل ناعم              19,320 كجم                         │
│   • ...                                                      │
└──────────────────────────────────────────────────────────────┘
```

**تبويب 2: حسب المادة (المُجمّع)**
```
┌──────────────────────────────────────────────────────────────┐
│ قائمة المواد — مُجمّعة                       [تصدير] [طباعة]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  المادة                │ الوحدة │ الإجمالي  │ مستخدم في      │
│  أسمنت                │ كجم   │ 28,450   │ لياسة، بطحة، ...│
│  رمل ناعم             │ كجم   │ 92,800   │ لياسة، بطحة     │
│  غراء بلاط C1         │ كجم   │ 8,910    │ أرضيات، تكسيات  │
│  غراء بلاط C2         │ كجم   │ 1,260    │ تكسيات جدران    │
│  بورسلان 60×60        │ م²    │ 1,452    │ أرضيات          │
│  سيراميك جدران        │ م²    │ 380      │ تكسيات حمامات   │
│  دهان داخلي بلاستيك   │ لتر   │ 580      │ دهان، أسقف      │
│  أساس (برايمر) داخلي  │ لتر   │ 290      │ دهان، أسقف      │
│  معجون                │ كجم   │ 4,200    │ دهان            │
│  ...                                                        │
└──────────────────────────────────────────────────────────────┘
```

### 2. دالة التجميع
استخدم `aggregateAllSubItems` من `spec-calculator.ts` (المرحلة 1).

قواعد التجميع:
- مواد بنفس الاسم والوحدة ← تُجمع كمياتها
- أسمنت من اللياسة + أسمنت من البطحة = إجمالي أسمنت واحد
- غراء C1 + غراء C2 = صفان منفصلان (نوع مختلف)

### 3. نقطة الدخول
في `QuantitiesDashboard.tsx`:
- أضف تبويب "قائمة المواد" بجانب التبويبات الحالية (أو زر في الأعلى)
- يظهر فقط إذا بند واحد على الأقل لديه specData

### 4. تصدير
- زر "تصدير Excel" — ينتج ملف xlsx بالجدول المجمّع
- زر "طباعة" — يفتح نافذة طباعة

## الملفات
- `apps/web/modules/saas/pricing/components/finishing/specs/BillOfMaterials.tsx` (جديد)
- `apps/web/modules/saas/pricing/components/finishing/QuantitiesDashboard.tsx` (تعديل)

## معايير النجاح
- الجدول يعرض كل المواد الفرعية لكل البنود التي لها specData
- التبويب "حسب المادة" يجمع المواد المتشابهة بشكل صحيح
- التصدير ينتج ملف Excel صحيح
```

---

## المرحلة 5: الترجمة والتنظيف والتكامل

```
## المهمة
إضافة كل مفاتيح الترجمة، تنظيف الكود، واختبار التكامل الكامل.

## المطلوب

### 1. مفاتيح الترجمة
أضف في `apps/web/messages/ar/pricing.json` و `en/pricing.json`:

تحت `pricing.finishing.specs`:
```json
{
  "specs": {
    "title": "المواصفات",
    "noSpec": "لم تُحدد المواصفات",
    "defineSpec": "تحديد المواصفات",
    "editSpec": "تعديل المواصفات",
    "specType": "النوع",
    "options": "الخيارات",
    "subItems": "المواد الفرعية",
    "perUnit": "لكل وحدة",
    "total": "الإجمالي",
    "brand": "الماركة",
    "save": "حفظ",
    "cancel": "إلغاء",
    "saveAll": "حفظ الكل",
    "bulkEdit": "تحديد المواصفات",
    "applyTemplate": "تطبيق نموذج",
    "apply": "تطبيق",
    "saveAsTemplate": "حفظ كنموذج",
    "templateName": "اسم النموذج",
    "templates": "النماذج",
    "systemTemplate": "نموذج نظام",
    "customTemplate": "نموذج مخصص",
    "setDefault": "تعيين كافتراضي",
    "deleteTemplate": "حذف النموذج",
    "billOfMaterials": "قائمة المواد",
    "byItem": "حسب البند",
    "byMaterial": "حسب المادة (مجمّع)",
    "materialName": "المادة",
    "unit": "الوحدة",
    "totalQuantity": "الإجمالي",
    "usedIn": "مستخدم في",
    "export": "تصدير Excel",
    "print": "طباعة",
    "economy": "تشطيب اقتصادي",
    "standard": "تشطيب متوسط",
    "premium": "تشطيب فاخر",
    "other": "أخرى",
    "enterQuantityFirst": "أدخل الكمية أولاً",
    "specDefined": "المواصفات محددة",
    "specNotDefined": "بدون مواصفات",
    "optional": "اختياري"
  }
}
```

### 2. اختبار السيناريوهات

**سيناريو 1: تطبيق نموذج**
1. فتح دراسة بها كميات محسوبة
2. الضغط على "تحديد المواصفات"
3. اختيار "تشطيب متوسط" ← تطبيق
4. التحقق من ملء كل البنود
5. حفظ الكل
6. التحقق من ظهور أيقونة ⚙️ على كل الصفوف

**سيناريو 2: تعديل بند واحد**
1. فتح بند "أرضيات — أرضي"
2. تبويب "المواصفات"
3. تغيير النوع من "بورسلان 60×60" إلى "رخام"
4. التحقق من تغيير المواد الفرعية
5. حفظ

**سيناريو 3: قائمة المواد**
1. بعد تحديد مواصفات عدة بنود
2. فتح "قائمة المواد"
3. التحقق من التجميع الصحيح
4. تصدير Excel

**سيناريو 4: حفظ نموذج مخصص**
1. تعديل المواصفات حسب الرغبة
2. "حفظ كنموذج" ← إدخال اسم
3. التحقق من ظهوره في القائمة
4. فتح دراسة جديدة ← تطبيق النموذج المحفوظ

### 3. التنظيف
- التحقق من عدم وجود console.log أو TODO
- التحقق من أن كل النصوص تستخدم مفاتيح الترجمة
- التحقق من عدم وجود أخطاء TypeScript

## معايير النجاح
- كل السيناريوهات تعمل
- الترجمة كاملة (عربي + إنجليزي)
- لا أخطاء TypeScript أو console errors
- التوافق مع البيانات القديمة (بنود بدون specData تعمل بشكل طبيعي)
```

---

## ملاحظات عامة لكل المراحل

```
## أنماط الكود
- ORPC: protectedProcedure مع organizationId
- React Query: useSuspenseQuery / useMutation
- Forms: react-hook-form + zod
- UI: shadcn/ui + Tailwind CSS 4 + RTL
- الترجمة: next-intl مع useTranslations("pricing")
- الأيقونات: lucide-react
- الإشعارات: sonner

## المسارات
- المكونات: apps/web/modules/saas/pricing/components/finishing/specs/
- المكتبات: apps/web/modules/saas/pricing/lib/specs/
- API: packages/api/modules/quantities/procedures/
- Schema: packages/database/prisma/schema.prisma
- الترجمة: apps/web/messages/{ar,en}/pricing.json

## قواعد حاسمة
1. specData يُخزّن كـ JsonB — لا حاجة لجداول إضافية للمواد الفرعية
2. هذا القسم كميات ومواد فقط — بدون أسعار
3. كل بند يمكن أن يعمل بدون مواصفات (backward compatible)
4. المواد الفرعية تُحسب على الـ client (فوري) وتُخزّن مع البند
5. النماذج النظامية لا يمكن حذفها أو تعديلها
```
