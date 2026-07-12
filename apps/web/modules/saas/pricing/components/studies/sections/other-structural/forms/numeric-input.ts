/**
 * تحويل قيمة حقل رقمي: الحقل الفارغ يبقى فارغاً (undefined) بدل أن يتحول
 * إلى صفر بصمت، والصفر المدخل صراحةً قيمة صالحة تُعرض كما هي.
 * التحقق من الاكتمال يتم عبر getOtherStructuralInputErrors قبل الحساب/الحفظ.
 */
export function numOrUndef(raw: string): number | undefined {
	if (raw === "" || raw === null || raw === undefined) return undefined;
	const n = Number(raw);
	return Number.isFinite(n) ? n : undefined;
}
