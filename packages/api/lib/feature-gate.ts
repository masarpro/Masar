import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";

export type FeatureKey =
	| "projects.create"
	| "members.invite"
	| "ai.chat"
	| "export.pdf"
	| "cost-study.save"
	| "quotation.export"
	| "owner-portal.activate"
	| "reports.detailed"
	| "zatca.qr";

export type GateResult =
	| { allowed: true }
	| {
			allowed: false;
			reason: string;
			reasonAr: string;
			upgradeRequired: true;
	  };

// FREE plan limits
const FREE_LIMITS = {
	maxProjects: 1,
	maxUsers: 2,
	maxAiChats: 10,
};

/**
 * Check if a feature is accessible for the given organization.
 * Returns a GateResult indicating if the action is allowed or blocked.
 */
export async function checkFeatureAccess(
	organizationId: string,
	feature: FeatureKey,
	user: { id: string; role?: string | null },
): Promise<GateResult> {
	// Super admin bypass
	if (user.role === "admin") return { allowed: true };

	const org = await db.organization.findUnique({
		where: { id: organizationId },
		select: {
			status: true,
			plan: true,
			isFreeOverride: true,
			trialEndsAt: true,
		},
	});

	if (!org) return { allowed: true };

	// isFreeOverride bypass
	if (org.isFreeOverride) return { allowed: true };

	// Determine effective plan
	let effectivePlan: "PRO" | "FREE" | "TRIAL" = "FREE";

	if (org.plan === "PRO" && (org.status === "ACTIVE" || org.status === "TRIALING")) {
		effectivePlan = "PRO";
	} else if (
		org.status === "TRIALING" &&
		org.trialEndsAt &&
		new Date() < org.trialEndsAt
	) {
		effectivePlan = "TRIAL";
	} else if (
		org.status === "TRIALING" &&
		org.trialEndsAt &&
		new Date() >= org.trialEndsAt
	) {
		// Lazy update: trial expired → mark as FREE
		await db.organization.update({
			where: { id: organizationId },
			data: { status: "ACTIVE", plan: "FREE" },
		});
		effectivePlan = "FREE";
	}

	// PRO and TRIAL users get full access
	if (effectivePlan === "PRO" || effectivePlan === "TRIAL") {
		return { allowed: true };
	}

	// FREE plan — check per-feature limits
	return checkFreePlanLimit(organizationId, feature);
}

async function checkFreePlanLimit(
	organizationId: string,
	feature: FeatureKey,
): Promise<GateResult> {
	switch (feature) {
		case "projects.create": {
			const projectCount = await db.project.count({
				where: { organizationId, status: { not: "ARCHIVED" } },
			});
			if (projectCount >= FREE_LIMITS.maxProjects) {
				return {
					allowed: false,
					reason: `Free plan allows up to ${FREE_LIMITS.maxProjects} project`,
					reasonAr: `الخطة المجانية تسمح بمشروع واحد فقط. فعّل الاشتراك الاحترافي لإضافة مشاريع أكثر`,
					upgradeRequired: true,
				};
			}
			return { allowed: true };
		}

		case "members.invite": {
			const memberCount = await db.member.count({
				where: { organizationId },
			});
			if (memberCount >= FREE_LIMITS.maxUsers) {
				return {
					allowed: false,
					reason: `Free plan allows up to ${FREE_LIMITS.maxUsers} users`,
					reasonAr: `الخطة المجانية تسمح بمستخدمين اثنين فقط. فعّل الاشتراك الاحترافي لإضافة المزيد`,
					upgradeRequired: true,
				};
			}
			return { allowed: true };
		}

		case "ai.chat": {
			const usage = await db.aiChatUsage.findUnique({
				where: { organizationId },
			});
			if (usage && usage.totalChats >= FREE_LIMITS.maxAiChats) {
				return {
					allowed: false,
					reason: `Free plan allows up to ${FREE_LIMITS.maxAiChats} AI chat sessions`,
					reasonAr: `استخدمت جميع محادثات الذكاء الاصطناعي المتاحة (${FREE_LIMITS.maxAiChats}). فعّل الاشتراك الاحترافي للحصول على محادثات بلا حدود`,
					upgradeRequired: true,
				};
			}
			return { allowed: true };
		}

		// Hard-blocked features for FREE plan
		case "export.pdf":
			return {
				allowed: false,
				reason: "PDF/CSV exports require Pro plan",
				reasonAr: "تصدير التقارير والملفات متاح فقط للمشتركين في الخطة الاحترافية",
				upgradeRequired: true,
			};

		case "cost-study.save":
			return {
				allowed: false,
				reason: "Saving cost studies requires Pro plan",
				reasonAr: "حفظ دراسات التكلفة متاح فقط للمشتركين في الخطة الاحترافية",
				upgradeRequired: true,
			};

		case "quotation.export":
			return {
				allowed: false,
				reason: "Converting quotations to invoices requires Pro plan",
				reasonAr: "تحويل عروض الأسعار إلى فواتير متاح فقط للمشتركين في الخطة الاحترافية",
				upgradeRequired: true,
			};

		case "owner-portal.activate":
			return {
				allowed: false,
				reason: "Owner portal requires Pro plan",
				reasonAr: "بوابة المالك متاحة فقط للمشتركين في الخطة الاحترافية",
				upgradeRequired: true,
			};

		case "reports.detailed":
			return {
				allowed: false,
				reason: "Detailed reports require Pro plan",
				reasonAr: "التقارير التفصيلية متاحة فقط للمشتركين في الخطة الاحترافية",
				upgradeRequired: true,
			};

		case "zatca.qr":
			return {
				allowed: false,
				reason: "ZATCA e-invoicing requires Pro plan",
				reasonAr: "الفوترة الإلكترونية (زاتكا) متاحة فقط للمشتركين في الخطة الاحترافية",
				upgradeRequired: true,
			};

		default:
			return { allowed: true };
	}
}

/**
 * Throws FORBIDDEN error if the feature is not accessible.
 * Use this directly in procedure handlers.
 */
export async function enforceFeatureAccess(
	organizationId: string,
	feature: FeatureKey,
	user: { id: string; role?: string | null },
): Promise<void> {
	const result = await checkFeatureAccess(organizationId, feature, user);
	if (!result.allowed) {
		throw new ORPCError("FORBIDDEN", {
			message: result.reasonAr,
			data: { code: "UPGRADE_REQUIRED", feature },
		});
	}
}
