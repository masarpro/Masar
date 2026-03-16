export const UNIT_KEYS = [
	"m", "m2", "m3", "ton", "kg", "liter",
	"piece", "lumpsum", "workday", "workhour",
	"trip", "load", "roll", "carton", "set", "service",
] as const;

export const UNIT_VALUES: Record<(typeof UNIT_KEYS)[number], string> = {
	m: "م", m2: "م²", m3: "م³", ton: "طن", kg: "كجم", liter: "لتر",
	piece: "قطعة", lumpsum: "مقطوعية", workday: "يوم عمل", workhour: "ساعة عمل",
	trip: "رحلة", load: "حمولة", roll: "لفة", carton: "كرتون", set: "مجموعة", service: "خدمة",
};

export const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("en-SA", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
};
