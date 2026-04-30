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
