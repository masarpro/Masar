// ═══════════════════════════════════════════════════════════════
// ثوابت أقسام التكلفة — مشتركة بين مكونات Pipeline
// ═══════════════════════════════════════════════════════════════

export const SECTION_ORDER = [
	"STRUCTURAL",
	"FINISHING",
	"MEP",
	"LABOR",
	"MANUAL",
] as const;

export const SECTION_LABELS: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة",
	MANUAL: "يدوي",
};

export const SECTION_COLORS: Record<string, string> = {
	STRUCTURAL: "border-r-blue-500",
	FINISHING: "border-r-amber-500",
	MEP: "border-r-emerald-500",
	LABOR: "border-r-purple-500",
	MANUAL: "border-r-gray-500",
};

export const SECTION_BG_COLORS: Record<string, string> = {
	STRUCTURAL: "bg-blue-50 border-r-blue-500",
	FINISHING: "bg-amber-50 border-r-amber-500",
	MEP: "bg-emerald-50 border-r-emerald-500",
	LABOR: "bg-purple-50 border-r-purple-500",
	MANUAL: "bg-gray-50 border-r-gray-500",
};
