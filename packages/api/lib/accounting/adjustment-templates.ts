// Adjustment entry templates for Saudi construction companies

export interface AdjustmentTemplate {
	id: string;
	nameAr: string;
	nameEn: string;
	type: string;
	descriptionAr: string;
	descriptionEn: string;
	lines: {
		accountCode: string;
		side: "debit" | "credit";
		descriptionAr: string;
	}[];
}

export const ADJUSTMENT_TEMPLATES: AdjustmentTemplate[] = [
	{
		id: "accrued_revenue",
		nameAr: "إيرادات مستحقة",
		nameEn: "Accrued Revenue",
		type: "ACCRUAL",
		descriptionAr: "تسجيل إيرادات تم تنفيذها ولم تُفوتر بعد",
		descriptionEn: "Record revenue earned but not yet invoiced",
		lines: [
			{ accountCode: "1120", side: "debit", descriptionAr: "إيرادات مستحقة — ذمم مدينة" },
			{ accountCode: "4100", side: "credit", descriptionAr: "إيرادات مشاريع مستحقة" },
		],
	},
	{
		id: "accrued_expense",
		nameAr: "مصروفات مستحقة",
		nameEn: "Accrued Expense",
		type: "ACCRUAL",
		descriptionAr: "تسجيل مصروفات تمت ولم تُسدد بعد (مثل: كهرباء، إيجار)",
		descriptionEn: "Record expenses incurred but not yet paid",
		lines: [
			{ accountCode: "6900", side: "debit", descriptionAr: "مصروفات مستحقة" },
			{ accountCode: "2110", side: "credit", descriptionAr: "ذمم دائنة — مصروفات مستحقة" },
		],
	},
	{
		id: "depreciation",
		nameAr: "إهلاك أصول ثابتة",
		nameEn: "Fixed Asset Depreciation",
		type: "DEPRECIATION",
		descriptionAr: "تسجيل قسط الإهلاك الشهري/السنوي",
		descriptionEn: "Record periodic depreciation",
		lines: [
			{ accountCode: "6900", side: "debit", descriptionAr: "مصروف إهلاك" },
			{ accountCode: "1290", side: "credit", descriptionAr: "مجمع الإهلاك" },
		],
	},
	{
		id: "prepaid_expense",
		nameAr: "توزيع مصروف مدفوع مقدماً",
		nameEn: "Prepaid Expense Amortization",
		type: "PREPAYMENT",
		descriptionAr: "تحميل جزء من المصروف المدفوع مقدماً على الفترة الحالية",
		descriptionEn: "Allocate prepaid expense to current period",
		lines: [
			{ accountCode: "6900", side: "debit", descriptionAr: "مصروف الفترة" },
			{ accountCode: "1130", side: "credit", descriptionAr: "تخفيض دفعة مقدمة" },
		],
	},
	{
		id: "provision",
		nameAr: "مخصص نهاية خدمة",
		nameEn: "End of Service Provision",
		type: "PROVISION",
		descriptionAr: "تكوين مخصص مكافأة نهاية الخدمة",
		descriptionEn: "Record end of service benefit provision",
		lines: [
			{ accountCode: "6100", side: "debit", descriptionAr: "مصروف مخصص نهاية خدمة" },
			{ accountCode: "2140", side: "credit", descriptionAr: "مخصص نهاية خدمة" },
		],
	},
	{
		id: "correction",
		nameAr: "قيد تصحيحي",
		nameEn: "Correction Entry",
		type: "CORRECTION",
		descriptionAr: "تصحيح خطأ في قيد سابق",
		descriptionEn: "Correct an error in a previous entry",
		lines: [],
	},
];
