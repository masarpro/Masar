// ════════════════════════════════════════════════════════════════
// Unified Quantities — Access Helpers
// Wrappers رقيقة على verifyOrganizationAccess الموحَّد للمشروع.
// ════════════════════════════════════════════════════════════════

import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { isUnifiedStudyServer } from "./classify";

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
	// حصر المحرك: القاعدة المشتركة في lib/classify.ts (تطابق الواجهة حرفياً).
	// الدراسة غير الموحّدة تُدار عبر النظام الأساسي ولا يجوز الكتابة عليها
	// من هنا (المحركان يكتبان نفس CostStudy بحسابات متنافرة)
	const isUnified = isUnifiedStudyServer({
		workScopes: study.workScopes,
		studyType: study.studyType,
	});
	if (!isUnified) {
		throw new ORPCError("CONFLICT", {
			message: "هذه الدراسة تُدار عبر نظام الكميات الأساسي وليس النظام الموحّد",
		});
	}
	return study;
}

/**
 * نسخة خاصة بترحيل الدراسات القديمة (migrate-legacy-study):
 * تتحقق من الوجود + ملكية المنظمة + أن نطاقات الدراسة تسمح بالتشطيبات/MEP،
 * لكنها **تتعمّد تجاوز فحص علم NEXT_PUBLIC_FEATURE_UNIFIED_QUANTITIES**
 * الموجود في loadStudy — الترحيل يجب أن يعمل قبل تفعيل العلم،
 * وإلا لظهرت الدراسات القديمة فارغة لحظة التفعيل.
 */
export async function loadStudyForMigration(
	costStudyId: string,
	organizationId: string,
) {
	const study = await db.costStudy.findFirst({
		where: { id: costStudyId, organizationId },
	});
	if (!study) {
		throw new ORPCError("NOT_FOUND", { message: "الدراسة غير موجودة" });
	}
	const scopes = Array.isArray(study.workScopes) ? study.workScopes : [];
	const scopeAllows =
		!["QUICK_PRICING", "CUSTOM_ITEMS", "LUMP_SUM_ANALYSIS"].includes(
			study.studyType,
		) &&
		(scopes.length === 0 ||
			scopes.includes("FINISHING") ||
			scopes.includes("MEP"));
	if (!scopeAllows) {
		throw new ORPCError("CONFLICT", {
			message:
				"هذه الدراسة لا تشمل نطاق تشطيبات أو كهروميكانيكا — لا يوجد ما يُرحَّل",
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
