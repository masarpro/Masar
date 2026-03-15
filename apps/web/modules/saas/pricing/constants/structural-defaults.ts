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
