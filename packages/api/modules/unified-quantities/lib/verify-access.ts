// ════════════════════════════════════════════════════════════════
// Unified Quantities — Access Helpers
// Wrappers رقيقة على verifyOrganizationAccess الموحَّد للمشروع.
// ════════════════════════════════════════════════════════════════

import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { verifyOrganizationAccess } from "../../../lib/permissions";

/**
 * تحقق من عضوية المستخدم في المنظمة + صلاحية pricing.studies.
 * يُستخدم في كل endpoint قراءة/كتابة لـ unified-quantities.
 */
export async function requireStudyAccess(
	organizationId: string,
	userId: string,
): Promise<void> {
	await verifyOrganizationAccess(organizationId, userId, {
		section: "pricing",
		action: "studies",
	});
}

/**
 * يجلب CostStudy مع تحقق ملكية المنظمة.
 * يرمي 404 لو غير موجودة، 403 لو لمنظمة أخرى.
 */
export async function loadStudy(costStudyId: string, organizationId: string) {
	const study = await db.costStudy.findFirst({
		where: { id: costStudyId, organizationId },
	});
	if (!study) {
		throw new ORPCError("NOT_FOUND", { message: "الدراسة غير موجودة" });
	}
	// حصر المحرك: يطابق قاعدة الواجهة في unified-flag.ts حرفياً —
	// الدراسة موحّدة عندما يكون العلم مفعّلاً و(لا نطاقات أو تشمل FINISHING/MEP).
	// غير ذلك تُدار عبر النظام الأساسي ولا يجوز الكتابة عليها من هنا
	// (المحركان يكتبان نفس CostStudy بحسابات متنافرة)
	const flagEnabled =
		process.env.NEXT_PUBLIC_FEATURE_UNIFIED_QUANTITIES === "1";
	const scopes = Array.isArray(study.workScopes) ? study.workScopes : [];
	const isUnified =
		flagEnabled &&
		(scopes.length === 0 ||
			scopes.includes("FINISHING") ||
			scopes.includes("MEP"));
	if (!isUnified) {
		throw new ORPCError("CONFLICT", {
			message: "هذه الدراسة تُدار عبر نظام الكميات الأساسي وليس النظام الموحّد",
		});
	}
	return study;
}

/**
 * يجلب QuantityItem مع تحقق ملكية المنظمة + الانتماء للدراسة.
 */
export async function loadItem(
	itemId: string,
	organizationId: string,
	costStudyId?: string,
) {
	const item = await db.quantityItem.findFirst({
		where: {
			id: itemId,
			organizationId,
			...(costStudyId ? { costStudyId } : {}),
		},
	});
	if (!item) {
		throw new ORPCError("NOT_FOUND", { message: "البند غير موجود" });
	}
	return item;
}
