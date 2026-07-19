import { ORPCError } from "@orpc/server";
import type { Permissions } from "@repo/database/prisma/permissions";

/**
 * سياسة سرية الأرقام المالية في وحدة التسعير:
 * `pricing.view` تمنح رؤية بنية الدراسة والكميات فقط — أما التكاليف
 * والهوامش وأسعار البيع فتتطلب صلاحية تسعير فعلية من إعدادات الأعضاء.
 * (SUPERVISOR/ENGINEER لديهما view افتراضياً ولا يجب أن يريا أي أرقام.)
 */

/** يرى التكاليف/الهوامش/أسعار البيع (قراءة). */
export function hasCostingReadAccess(p: Permissions): boolean {
	return !!(
		p.pricing?.editCosting ||
		p.pricing?.approveCosting ||
		p.pricing?.editSellingPrice ||
		p.pricing?.pricing ||
		p.quantities?.pricing
	);
}

/** يعدّل التكاليف (كتابة) — الاعتماد وحده لا يكفي للتعديل. */
export function hasCostingWriteAccess(p: Permissions): boolean {
	return !!(
		p.pricing?.editCosting ||
		p.pricing?.pricing ||
		p.quantities?.pricing
	);
}

/** يرى عروض الأسعار بمبالغها. */
export function hasQuotationReadAccess(p: Permissions): boolean {
	return !!(
		p.pricing?.quotations ||
		p.pricing?.pricing ||
		p.finance?.quotations
	);
}

/** يعدّل الهوامش/سعر البيع (كتابة). */
export function hasSellingWriteAccess(p: Permissions): boolean {
	return !!(
		p.pricing?.editSellingPrice ||
		p.pricing?.pricing ||
		p.quantities?.pricing
	);
}

export function requireSellingWriteAccess(p: Permissions): void {
	if (!hasSellingWriteAccess(p)) {
		throw new ORPCError("FORBIDDEN", {
			message: "ليس لديك صلاحية تعديل سعر البيع",
		});
	}
}

export function requireCostingReadAccess(p: Permissions): void {
	if (!hasCostingReadAccess(p)) {
		throw new ORPCError("FORBIDDEN", {
			message: "ليس لديك صلاحية عرض التكاليف والتسعير",
		});
	}
}

export function requireCostingWriteAccess(p: Permissions): void {
	if (!hasCostingWriteAccess(p)) {
		throw new ORPCError("FORBIDDEN", {
			message: "ليس لديك صلاحية تعديل التكاليف",
		});
	}
}

/**
 * يصفّر الحقول المالية لكيان الدراسة (بعد convertStudyDecimals) لمن لا يملك
 * صلاحية الاطلاع على التكاليف — بنية الدراسة والكميات تبقى كما هي.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripStudyMoney<T extends Record<string, any>>(
	study: T,
	hasAccess: boolean,
): T {
	if (hasAccess) return study;
	return {
		...study,
		structuralCost: 0,
		finishingCost: 0,
		mepCost: 0,
		laborCost: 0,
		totalCost: 0,
		overheadPercent: 0,
		profitPercent: 0,
		contingencyPercent: 0,
		...("contractValue" in study ? { contractValue: null } : {}),
	};
}

const ITEM_MONEY_FIELDS = [
	"materialCost",
	"laborCost",
	"totalCost",
	"materialPrice",
	"laborPrice",
	"unitPrice",
	"dailyRate",
	"insuranceCost",
	"housingCost",
	"otherCosts",
] as const;

/** يصفّر حقول التكلفة/السعر على بند دراسة (إنشائي/تشطيبات/MEP/عمالة). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripItemMoney<T extends Record<string, any>>(
	item: T,
	hasAccess: boolean,
): T {
	if (hasAccess) return item;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const out: Record<string, any> = { ...item };
	for (const field of ITEM_MONEY_FIELDS) {
		if (field in out && out[field] != null) out[field] = 0;
	}
	return out as T;
}

/**
 * يحذف مفاتيح الأسعار من JSON المواصفات (structuralSpecs / laborBreakdown)
 * تكرارياً لمن لا يملك صلاحية تكاليف — بقية المواصفات تبقى كما هي.
 */
export function scrubPriceKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(scrubPriceKeys);
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
			if (/price/i.test(key) || key === "dailyRate") continue;
			out[key] = scrubPriceKeys(v);
		}
		return out;
	}
	return value;
}

export function requireQuotationReadAccess(p: Permissions): void {
	if (!hasQuotationReadAccess(p)) {
		throw new ORPCError("FORBIDDEN", {
			message: "ليس لديك صلاحية عرض عروض الأسعار",
		});
	}
}
