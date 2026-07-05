/**
 * Concurrent Payments — Regression Tests
 *
 * يثبّت حماية سباق الدفعات المتزامنة (فرع payment-locks):
 * - packages/database/prisma/queries/subcontract-claims.ts → addSubcontractClaimPayment
 *   (قفل subcontract_contracts + إعادة قراءة paidAmount داخل القفل + سقف netAmount)
 * - packages/database/prisma/queries/subcontract.ts → createSubcontractPayment
 *   (نفس القفل + سقف: قيمة العقد + أوامر التغيير APPROVED مقابل دفعات COMPLETED)
 *   + أوامر التغيير (أرضية الالتزامات عند تخفيض السقف + تحقق الملكية)
 * - packages/database/prisma/queries/project-payments.ts → create/update/replace
 *   (قفل project_contracts + سقف: قيمة العقد + أوامر التغيير APPROVED|IMPLEMENTED)
 *
 * ثلاث طبقات (نفس نمط concurrent-claims.test.ts):
 * 1. اختبارات نقية لحساب السقف.
 * 2. محاكاة Promise.all لتسلسل القفل: دفعتان متزامنتان تتجاوزان المستحق معاً → واحدة فقط تنجح.
 * 3. Tripwire على المصدر: يفشل لو أُزيل قفل FOR UPDATE أو التحقق.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// ─────────────────────────────────────────────────────────────────
// 1. منطق سقف دفعة المستخلص (مطابق لدلالات addSubcontractClaimPayment)
// ─────────────────────────────────────────────────────────────────

/**
 * فحص دفعة مستخلص: المدفوع + الجديدة ≤ الصافي (سماحية 0.01)
 * الكود الفعلي يستخدم Prisma.Decimal (حساب عشري دقيق) — هنا نقرّب لسنتات
 * لمحاكاة الدقة العشرية بدل أخطاء float الثنائية.
 */
function canPayClaim(
	netAmount: number,
	paidAmount: number,
	newPayment: number,
): boolean {
	const excessCents = Math.round((paidAmount + newPayment - netAmount) * 100);
	return excessCents <= 1;
}

describe("Claim payment ceiling arithmetic (سقف دفعة المستخلص)", () => {
	it("يسمح حتى الصافي بالضبط ويرفض ما بعده", () => {
		expect(canPayClaim(50000, 0, 50000)).toBe(true);
		expect(canPayClaim(50000, 0, 50000.02)).toBe(false);
		expect(canPayClaim(50000, 30000, 20000)).toBe(true);
		expect(canPayClaim(50000, 30000, 20000.02)).toBe(false);
	});

	it("سماحية 0.01 تمتص فروق التقريب من الواجهة", () => {
		expect(canPayClaim(50000, 0, 50000.01)).toBe(true);
	});
});

// ─────────────────────────────────────────────────────────────────
// 1ب. سقف دفعة العقد المباشرة (مطابق لدلالات createSubcontractPayment)
// ─────────────────────────────────────────────────────────────────

/**
 * فحص دفعة عقد باطن: المدفوع (COMPLETED — مباشرة + مستخلصات معاً) + الجديدة
 * ≤ قيمة العقد + أوامر التغيير APPROVED (سماحية 0.01).
 * سقف ≤ 0 (عقد بلا قيمة) → يُتخطى التحقق.
 */
function canPayContract(
	contractValue: number,
	approvedCoSum: number,
	completedPayments: number,
	newPayment: number,
): boolean {
	const ceiling = contractValue + approvedCoSum;
	if (ceiling <= 0) return true;
	const excessCents = Math.round(
		(completedPayments + newPayment - ceiling) * 100,
	);
	return excessCents <= 1;
}

describe("Direct contract payment ceiling (سقف دفعة العقد المباشرة)", () => {
	it("يسمح حتى السقف المعدّل ويرفض ما بعده", () => {
		expect(canPayContract(100000, 0, 60000, 40000)).toBe(true);
		expect(canPayContract(100000, 0, 60000, 40000.02)).toBe(false);
	});

	it("أوامر التغيير المعتمدة ترفع السقف — وSUBMITTED لا يُحتسب", () => {
		// CO معتمد +20,000 → السقف 120,000
		expect(canPayContract(100000, 20000, 100000, 20000)).toBe(true);
		// لو لم يُعتمد (لا يدخل في المجموع) → يرفض
		expect(canPayContract(100000, 0, 100000, 20000)).toBe(false);
	});

	it("CO سالب معتمد يخفض السقف", () => {
		expect(canPayContract(100000, -30000, 50000, 25000)).toBe(false);
		expect(canPayContract(100000, -30000, 50000, 20000)).toBe(true);
	});

	it("عقد بلا قيمة (سقف ≤ 0) → لا تحقق (سلوك قائم لا نكسره)", () => {
		expect(canPayContract(0, 0, 999999, 1)).toBe(true);
	});
});

// ─────────────────────────────────────────────────────────────────
// 1ج. أرضية أوامر التغيير (مطابق لدلالات assertCeilingAboveCommitted)
// ─────────────────────────────────────────────────────────────────

/**
 * تخفيض السقف (إلغاء اعتماد/تخفيض مبلغ/حذف معتمد/اعتماد سالب) يجب ألا
 * ينزل السقف الجديد تحت max(المستخلصات المعتمدة، الدفعات COMPLETED).
 * الفحص يجري فقط عند التخفيض — رفع سقف متدنٍّ قديم لا يُحجب أبداً.
 */
function canLowerCeiling(
	newCeiling: number,
	approvedClaimsGross: number,
	completedPayments: number,
): boolean {
	const floor = Math.max(approvedClaimsGross, completedPayments);
	return Math.round((floor - newCeiling) * 100) <= 1;
}

describe("Change order ceiling floor (أرضية تخفيض السقف)", () => {
	it("يمنع النزول تحت المستخلصات المعتمدة أو الدفعات", () => {
		expect(canLowerCeiling(80000, 90000, 50000)).toBe(false); // مستخلصات أعلى
		expect(canLowerCeiling(80000, 50000, 90000)).toBe(false); // دفعات أعلى
		expect(canLowerCeiling(90000, 90000, 50000)).toBe(true); // على الأرضية بالضبط
		expect(canLowerCeiling(100000, 90000, 90000)).toBe(true);
	});
});

// ─────────────────────────────────────────────────────────────────
// 1د. سقف دفعة المشروع (مطابق لدلالات assertProjectPaymentCeiling)
// ─────────────────────────────────────────────────────────────────

/**
 * فحص دفعة مشروع: (المحصّل − المستبعَد للاستبدال/التعديل) + الجديدة
 * ≤ قيمة العقد + أثر أوامر التغيير APPROVED|IMPLEMENTED (سماحية 0.01).
 * لا عقد أو سقف ≤ 0 → لا تحقق (الدفعات الحرة بلا عقد مسموحة).
 */
function canReceiveProjectPayment(
	adjustedContractValue: number | null,
	collectedTotal: number,
	newPayment: number,
	excludeAmount = 0,
): boolean {
	if (adjustedContractValue == null || adjustedContractValue <= 0) return true;
	const current = collectedTotal - excludeAmount;
	return (
		Math.round((current + newPayment - adjustedContractValue) * 100) <= 1
	);
}

describe("Project payment ceiling (سقف دفعة المشروع)", () => {
	it("يسمح حتى قيمة العقد المعدّلة ويرفض ما بعدها", () => {
		expect(canReceiveProjectPayment(500000, 450000, 50000)).toBe(true);
		expect(canReceiveProjectPayment(500000, 450000, 50000.02)).toBe(false);
	});

	it("بلا عقد → لا سقف (الدفعات الحرة مسموحة اليوم)", () => {
		expect(canReceiveProjectPayment(null, 0, 999999)).toBe(true);
	});

	it("استبدال مجموعة split يستثني مجموع المجموعة القديمة", () => {
		// المحصّل 500,000 منها مجموعة 100,000 تُستبدل بـ 90,000 → مسموح
		expect(canReceiveProjectPayment(500000, 500000, 90000, 100000)).toBe(true);
		// استبدالها بـ 110,000 → يتجاوز
		expect(canReceiveProjectPayment(500000, 500000, 110000, 100000)).toBe(false);
	});

	it("تعديل مبلغ دفعة واحدة يستثني مبلغها القديم", () => {
		expect(canReceiveProjectPayment(500000, 500000, 60000, 50000)).toBe(false);
		expect(canReceiveProjectPayment(500000, 490000, 60000, 50000)).toBe(true);
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

describe("Concurrent claim payments serialization (Promise.all)", () => {
	it("دفعتان متزامنتان تتجاوزان المستحق معاً → واحدة فقط تنجح", async () => {
		const netAmount = 50000;
		const claim = { paidAmount: 0 };
		const withLock = createRowLock();

		// كل دفعة 30,000 — كلٌ منهما وحدها ضمن الصافي، ومعاً تتجاوزانه
		const submitPayment = (amount: number) =>
			withLock(async () => {
				// داخل القفل: إعادة قراءة paidAmount والفحص والتحديث ذرّيون
				if (!canPayClaim(netAmount, claim.paidAmount, amount)) {
					throw new Error("AMOUNT_EXCEEDS_OUTSTANDING");
				}
				// محاكاة زمن كتابة DB — لولا القفل لتداخل الفحصان
				await new Promise((r) => setTimeout(r, 5));
				claim.paidAmount += amount;
				return "ok";
			});

		const results = await Promise.allSettled([
			submitPayment(30000),
			submitPayment(30000),
		]);

		const fulfilled = results.filter((r) => r.status === "fulfilled");
		const rejected = results.filter((r) => r.status === "rejected");
		expect(fulfilled).toHaveLength(1);
		expect(rejected).toHaveLength(1);
		expect((rejected[0] as PromiseRejectedResult).reason.message).toBe(
			"AMOUNT_EXCEEDS_OUTSTANDING",
		);
		expect(claim.paidAmount).toBe(30000);
	});

	it("بدون تسلسل (النمط القديم) كانت الدفعتان تنجحان معاً — توثيق للخلل المحمي منه", async () => {
		const netAmount = 50000;
		const claim = { paidAmount: 0 };

		const submitPaymentUnsafe = async (amount: number) => {
			if (!canPayClaim(netAmount, claim.paidAmount, amount)) {
				throw new Error("AMOUNT_EXCEEDS_OUTSTANDING");
			}
			await new Promise((r) => setTimeout(r, 5));
			claim.paidAmount += amount;
		};

		await Promise.allSettled([
			submitPaymentUnsafe(30000),
			submitPaymentUnsafe(30000),
		]);
		expect(claim.paidAmount).toBe(60000); // 60,000 > 50,000 — هذا ما يمنعه قفل الصف
	});
});

// ─────────────────────────────────────────────────────────────────
// 3. Tripwire — القفل والتحقق موجودان في المصدر
// ─────────────────────────────────────────────────────────────────

function readQueryFile(name: string): string {
	return readFileSync(
		fileURLToPath(
			new URL(`../../../../database/prisma/queries/${name}`, import.meta.url),
		),
		"utf8",
	);
}

describe("Source tripwire — payment row locks must stay in place", () => {
	it("subcontract-claims.ts: قفل FOR UPDATE يغطي دفعة المستخلص + خطأ التجاوز", () => {
		const src = readQueryFile("subcontract-claims.ts");
		const lockCount = (
			src.match(/FROM subcontract_contracts[\s\S]{0,80}?FOR UPDATE/g) ?? []
		).length;
		// createSubcontractClaim + updateSubcontractClaim + updateSubcontractClaimStatus
		// + addSubcontractClaimPayment
		expect(lockCount).toBeGreaterThanOrEqual(4);
		expect(src).toContain("AMOUNT_EXCEEDS_OUTSTANDING");
	});

	it("subcontract.ts: قفل العقد + سقف الدفعة المباشرة + أرضية أوامر التغيير", () => {
		const src = readQueryFile("subcontract.ts");
		// helper القفل موجود ويُستدعى في: createSubcontractPayment +
		// create/update/deleteSubcontractChangeOrder
		expect(src).toMatch(/FROM subcontract_contracts[\s\S]{0,80}?FOR UPDATE/);
		const lockCalls = (src.match(/await lockSubcontractContract\(/g) ?? [])
			.length;
		expect(lockCalls).toBeGreaterThanOrEqual(4);
		expect(src).toContain("PAYMENT_EXCEEDS_CONTRACT");
		expect(src).toContain("CEILING_BELOW_COMMITTED");
		// إصلاح الملكية: أوامر التغيير تُقرأ بقيد contractId + organizationId
		expect(src).toContain("CHANGE_ORDER_NOT_FOUND");
	});

	it("project-payments.ts: قفل عقد المشروع + سقف الدفعات على المسارات الثلاثة", () => {
		const src = readQueryFile("project-payments.ts");
		expect(src).toMatch(/FROM project_contracts[\s\S]{0,80}?FOR UPDATE/);
		// create + replace + update كلها تقفل ثم تتحقق
		const lockCalls = (src.match(/await lockProjectContract\(/g) ?? []).length;
		expect(lockCalls).toBeGreaterThanOrEqual(3);
		const ceilingCalls = (
			src.match(/await assertProjectPaymentCeiling\(/g) ?? []
		).length;
		expect(ceilingCalls).toBeGreaterThanOrEqual(3);
		expect(src).toContain("PAYMENT_EXCEEDS_CONTRACT");
	});
});
