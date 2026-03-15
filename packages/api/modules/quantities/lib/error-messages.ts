/**
 * Unified error message constants for the quantities module.
 * Using bilingual format (EN | AR) for developer readability + user display.
 */
export const STUDY_ERRORS = {
	NOT_FOUND: "Cost study not found | دراسة التكلفة غير موجودة",
	ITEM_NOT_FOUND: "Item not found | البند غير موجود",
	QUOTE_NOT_FOUND: "Quote not found | عرض السعر غير موجود",
	TEMPLATE_NOT_FOUND: "Template not found | القالب غير موجود",
	STAGE_ORDER: "Cannot approve this stage before the previous one | لا يمكن اعتماد المرحلة قبل السابقة",
	STAGE_ASSIGN: "Cannot assign responsible for this stage | لا يمكن تعيين مسؤول لهذه المرحلة",
	ITEMS_LOCKED: "Cannot add items after quantities approval | لا يمكن إضافة بنود بعد اعتماد الكميات",
	BOUNDS_EXCEEDED: "Value exceeds allowed bounds | القيمة تتجاوز الحدود المسموحة",
} as const;
