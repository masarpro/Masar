// ════════════════════════════════════════════════════════════════
// Polygon helpers — Shoelace formula + perimeter + validation
// ════════════════════════════════════════════════════════════════

export interface Point {
	x: number;
	y: number;
}

/**
 * مساحة شكل غير منتظم بـ Shoelace formula.
 * يدعم وجهة الدوران بأي اتجاه (clockwise / counter-clockwise) عبر
 * Math.abs على الناتج. self-intersecting يعطي قيمة لكنها غير دقيقة
 * هندسياً — يجب على الواجهة منع رسم أشكال متقاطعة.
 *
 * @returns 0 لو أقل من 3 نقاط، وإلا |sum| / 2
 */
export function shoelaceArea(points: Point[]): number {
	if (!Array.isArray(points) || points.length < 3) return 0;
	let sum = 0;
	for (let i = 0; i < points.length; i++) {
		const j = (i + 1) % points.length;
		sum += points[i].x * points[j].y;
		sum -= points[j].x * points[i].y;
	}
	return Math.abs(sum) / 2;
}

/**
 * محيط شكل (مجموع الأضلاع).
 *
 * @returns 0 لو أقل من 2 نقطة
 */
export function polygonPerimeter(points: Point[]): number {
	if (!Array.isArray(points) || points.length < 2) return 0;
	let perimeter = 0;
	for (let i = 0; i < points.length; i++) {
		const j = (i + 1) % points.length;
		const dx = points[j].x - points[i].x;
		const dy = points[j].y - points[i].y;
		perimeter += Math.hypot(dx, dy);
	}
	return perimeter;
}

/** Type guard — يتأكد أن المدخل مصفوفة من نقاط صحيحة (أعداد منتهية) */
export function validatePolygon(points: unknown): points is Point[] {
	if (!Array.isArray(points)) return false;
	if (points.length < 3) return false;
	return points.every(
		(p) =>
			typeof p === "object" &&
			p !== null &&
			"x" in p &&
			"y" in p &&
			Number.isFinite((p as Point).x) &&
			Number.isFinite((p as Point).y),
	);
}
