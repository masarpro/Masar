/**
 * Concurrent Claims — Regression Tests
 *
 * يثبّت حماية سباق المطالبات المتزامنة (المرحلة كانت محصّنة مسبقاً في):
 * - packages/database/prisma/queries/project-finance.ts → createProjectClaim / updateClaimStatus
 *   ($transaction + SELECT ... FOR UPDATE على project_contracts + إعادة تحقق من السقف)
 * - packages/database/prisma/queries/subcontract-claims.ts → createSubcontractClaim / updateSubcontractClaimStatus
 *   (قفل subcontract_contracts + تحقق كميات لكل بند)
 *
 * ثلاث طبقات:
 * 1. اختبارات نقية لحساب السقف (قيمة العقد + أوامر التغيير المعتمدة).
 * 2. محاكاة Promise.all لتسلسل القفل: مطالبتان متزامنتان تتجاوزان السقف معاً → واحدة فقط تنجح.
 * 3. Tripwire على المصدر: يفشل لو أُزيل قفل FOR UPDATE أو الـtransaction من الدوال المعنية.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// ─────────────────────────────────────────────────────────────────
// 1. منطق السقف (مطابق لدلالات createProjectClaim / updateClaimStatus)
// ─────────────────────────────────────────────────────────────────

/** السقف المعدّل = قيمة العقد + أثر أوامر التغيير المعتمدة/المنفذة (الموجب والسالب) */
function adjustedContractValue(
	contractValue: number,
	changeOrders: Array<{ status: string; costImpact: number }>,
): number {
	const impact = changeOrders
		.filter((co) => ["APPROVED", "IMPLEMENTED"].includes(co.status))
		.reduce((sum, co) => sum + co.costImpact, 0);
	return contractValue + impact;
}

/** فحص السقف عند الإنشاء: مجموع غير المرفوض + الجديد ≤ السقف المعدّل */
function canCreateClaim(
	existingClaims: Array<{ status: string; amount: number }>,
	newAmount: number,
	adjustedValue: number,
): boolean {
	const existingTotal = existingClaims
		.filter((c) => c.status !== "REJECTED")
		.reduce((sum, c) => sum + c.amount, 0);
	return existingTotal + newAmount <= adjustedValue;
}

describe("Claim ceiling arithmetic (سقف المطالبات)", () => {
	it("يسمح حتى السقف بالضبط ويرفض ما بعده", () => {
		expect(canCreateClaim([], 100000, 100000)).toBe(true);
		expect(canCreateClaim([], 100001, 100000)).toBe(false);
		expect(canCreateClaim([{ status: "APPROVED", amount: 60000 }], 40000, 100000)).toBe(true);
		expect(canCreateClaim([{ status: "APPROVED", amount: 60000 }], 40001, 100000)).toBe(false);
	});

	it("المطالبات المرفوضة لا تُحتسب ضمن المجموع", () => {
		const claims = [
			{ status: "REJECTED", amount: 90000 },
			{ status: "SUBMITTED", amount: 30000 },
		];
		expect(canCreateClaim(claims, 70000, 100000)).toBe(true);
		expect(canCreateClaim(claims, 70001, 100000)).toBe(false);
	});

	it("أوامر التغيير المعتمدة ترفع السقف والسالبة تخفضه", () => {
		expect(
			adjustedContractValue(100000, [
				{ status: "APPROVED", costImpact: 20000 },
				{ status: "IMPLEMENTED", costImpact: -5000 },
				{ status: "DRAFT", costImpact: 999999 }, // لا يُحتسب
			]),
		).toBe(115000);
	});
});

// ─────────────────────────────────────────────────────────────────
// 2. محاكاة التسلسل: FOR UPDATE يجعل الفحص+الإدخال ذرياً
// ─────────────────────────────────────────────────────────────────

/** قفل بسيط يحاكي تسلسل FOR UPDATE على صف العقد */
function createRowLock() {
	let chain: Promise<void> = Promise.resolve();
	return function withLock<T>(fn: () => Promise<T>): Promise<T> {
		const result = chain.then(fn);
		chain = result.then(
			() => undefined,
			() => undefined,
		);
		return result;
	};
}

describe("Concurrent claims serialization (Promise.all)", () => {
	it("مطالبتان متزامنتان تتجاوزان السقف معاً → واحدة فقط تنجح", async () => {
		const contractValue = 100000;
		const claims: Array<{ status: string; amount: number }> = [];
		const withLock = createRowLock();

		// كل مطالبة 60,000 — كلٌ منهما وحدها ضمن السقف، ومعاً تتجاوزانه
		const submitClaim = (amount: number) =>
			withLock(async () => {
				// داخل القفل: الفحص وإعادة القراءة والإدخال ذرّيان
				if (!canCreateClaim(claims, amount, contractValue)) {
					throw new Error("CLAIMS_EXCEED_CONTRACT_VALUE");
				}
				// محاكاة زمن كتابة DB — لولا القفل لتداخل الفحصان
				await new Promise((r) => setTimeout(r, 5));
				claims.push({ status: "SUBMITTED", amount });
				return "ok";
			});

		const results = await Promise.allSettled([
			submitClaim(60000),
			submitClaim(60000),
		]);

		const fulfilled = results.filter((r) => r.status === "fulfilled");
		const rejected = results.filter((r) => r.status === "rejected");
		expect(fulfilled).toHaveLength(1);
		expect(rejected).toHaveLength(1);
		expect((rejected[0] as PromiseRejectedResult).reason.message).toBe(
			"CLAIMS_EXCEED_CONTRACT_VALUE",
		);
		expect(claims).toHaveLength(1);
	});

	it("بدون تسلسل (النمط القديم) كانت المطالبتان تنجحان معاً — توثيق للخلل المحمي منه", async () => {
		const contractValue = 100000;
		const claims: Array<{ status: string; amount: number }> = [];

		// فحص ثم إدخال دون قفل — كلاهما يقرأ قائمة فارغة
		const submitClaimUnsafe = async (amount: number) => {
			if (!canCreateClaim(claims, amount, contractValue)) {
				throw new Error("CLAIMS_EXCEED_CONTRACT_VALUE");
			}
			await new Promise((r) => setTimeout(r, 5));
			claims.push({ status: "SUBMITTED", amount });
		};

		await Promise.allSettled([submitClaimUnsafe(60000), submitClaimUnsafe(60000)]);
		expect(claims).toHaveLength(2); // 120,000 > 100,000 — هذا ما يمنعه قفل الصف
	});
});

// ─────────────────────────────────────────────────────────────────
// 3. Tripwire — القفل وإعادة التحقق موجودان في المصدر
// ─────────────────────────────────────────────────────────────────

function readQueryFile(name: string): string {
	return readFileSync(
		fileURLToPath(
			new URL(`../../../../database/prisma/queries/${name}`, import.meta.url),
		),
		"utf8",
	);
}

describe("Source tripwire — row locks must stay in place", () => {
	it("project-finance.ts: قفل FOR UPDATE على project_contracts + خطأ السقف", () => {
		const src = readQueryFile("project-finance.ts");
		const lockCount = (
			src.match(/FROM project_contracts[\s\S]{0,80}?FOR UPDATE/g) ?? []
		).length;
		// createProjectClaim + updateClaimStatus + updateProjectClaim
		expect(lockCount).toBeGreaterThanOrEqual(3);
		expect(src).toContain("CLAIMS_EXCEED_CONTRACT_VALUE");
	});

	it("subcontract-claims.ts: قفل FOR UPDATE على subcontract_contracts + خطأ الكميات", () => {
		const src = readQueryFile("subcontract-claims.ts");
		const lockCount = (
			src.match(/FROM subcontract_contracts[\s\S]{0,80}?FOR UPDATE/g) ?? []
		).length;
		// createSubcontractClaim + updateSubcontractClaimStatus
		expect(lockCount).toBeGreaterThanOrEqual(2);
		expect(src).toContain("QTY_EXCEEDS_REMAINING");
	});
});
