// ═══════════════════════════════════════════════════════════════
// ثوابت الحسابات الإنشائية — بدل الأرقام السحرية في calculations.ts
// Structural calculation defaults — replaces magic numbers
// ═══════════════════════════════════════════════════════════════

// القواعد (Foundations)
export const FOUNDATION_BAR_RETURN = 0.3;            // م — إضافة رجوع حديد القاعدة
export const FOUNDATION_SECONDARY_RATIO = 0.5;       // نسبة الشبكة العلوية (50%)

// الأعمدة (Columns)
export const COLUMN_MAIN_BAR_RETURN = 0.8;           // م — رجوع علوي وسفلي للعمود
export const COLUMN_FORMWORK_MULTIPLIER = 1.5;       // معامل تكلفة شدات الأعمدة

// الكانات (Stirrups) — مشتركة بين الأعمدة والكمرات
export const STIRRUP_COVER_DEDUCTION = 0.08;         // م — خصم الغطاء من محيط الكانة
export const STIRRUP_HOOK_LENGTH = 0.3;              // م — طول رجوع الكانة

// الكمرات (Beams)
export const BEAM_BAR_RETURN = 0.6;                  // م — رجوع حديد الكمرة
export const BEAM_FORMWORK_MULTIPLIER = 1.2;         // معامل تكلفة شدات الكمرات

// البلوك (Blocks)
export const BLOCKS_PER_SQM = 12.5;                  // عدد البلوكات / م² (بلوك 40×20)
export const BLOCK_WASTE_FACTOR = 1.05;              // هالك 5%
export const MORTAR_VOLUME_PER_SQM = 0.02;           // م³ مونة / م²
export const MORTAR_COST_PER_CUBIC_METER = 150;      // ريال / م³ مونة

// السلالم (Stairs)
export const STAIRS_FORMWORK_MULTIPLIER = 1.5;       // معامل تكلفة شدات السلالم

// ═══════════════════════════════════════════════════════════════
// Documented Engine Constants (Audit v5 #47-#54)
// These document hardcoded values in structural-calculations.ts.
// They are NOT imported by the engine — documentation only.
// Post-beta: make configurable per organization/project.
// ═══════════════════════════════════════════════════════════════

/** #47: Hollow block count — epsilon for floating-point comparison */
export const DOC_BLOCK_COUNT_EPSILON = 1e-9;

/** #48: Drop panel area threshold (m²) — below this, flat slab assumed */
export const DOC_DROP_PANEL_AREA_THRESHOLD = 36;

/** #49: Labor cost markup multiplier — 20% overhead for labor */
export const DOC_LABOR_COST_MARKUP = 1.2;

/** #50: Foundation cover — coverSide falls back to cover when undefined (intentional for simple foundations) */
// No constant needed — this is documented behavior

/** #51: Lean concrete perimeter expansion — 20cm on each side */
export const DOC_LEAN_CONCRETE_EXPANSION = 0.2;

/**
 * Known Limitations (documented — Audit v5 #52-#54):
 *
 * #52: Perimeter calculation assumes rectangular shapes only.
 *      For irregular shapes, perimeter should be provided as input.
 *
 * #53: No basement (underground) floor support in height derivation engine.
 *      Heights are always calculated from ground floor up.
 *      Workaround: Enter basement as a separate building or adjust manually.
 *
 * #54: Uniform heights assumed across building.
 *      The engine uses a single floor height for all floors of the same type.
 *      Mixed-height buildings need manual adjustment per floor.
 */
