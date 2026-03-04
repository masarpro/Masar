"use client";

import { useOrganizationPlan } from "./use-organization-plan";

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

const FEATURE_REASONS_AR: Record<FeatureKey, string> = {
	"projects.create": "الخطة المجانية تسمح بمشروع واحد فقط",
	"members.invite": "الخطة المجانية تسمح بمستخدمين اثنين فقط",
	"ai.chat": "استخدمت جميع محادثات الذكاء الاصطناعي المتاحة",
	"export.pdf": "تصدير التقارير متاح فقط للمشتركين",
	"cost-study.save": "حفظ دراسات التكلفة متاح فقط للمشتركين",
	"quotation.export": "تحويل عروض الأسعار متاح فقط للمشتركين",
	"owner-portal.activate": "بوابة المالك متاحة فقط للمشتركين",
	"reports.detailed": "التقارير التفصيلية متاحة فقط للمشتركين",
	"zatca.qr": "الفوترة الإلكترونية متاحة فقط للمشتركين",
};

export function useFeatureAccess(feature: FeatureKey) {
	const { isFree, limits, isLoading } = useOrganizationPlan();

	if (isLoading) {
		return { allowed: true, reasonAr: "", checking: true };
	}

	// Non-free plans get full access
	if (!isFree) {
		return { allowed: true, reasonAr: "", checking: false };
	}

	// FREE plan — check per-feature limits
	switch (feature) {
		case "projects.create":
			if (limits.projects.used >= limits.projects.max) {
				return {
					allowed: false,
					reasonAr: FEATURE_REASONS_AR[feature],
					checking: false,
				};
			}
			return { allowed: true, reasonAr: "", checking: false };

		case "members.invite":
			if (limits.members.used >= limits.members.max) {
				return {
					allowed: false,
					reasonAr: FEATURE_REASONS_AR[feature],
					checking: false,
				};
			}
			return { allowed: true, reasonAr: "", checking: false };

		case "ai.chat":
			if (limits.aiChats.max >= 0 && limits.aiChats.used >= limits.aiChats.max) {
				return {
					allowed: false,
					reasonAr: FEATURE_REASONS_AR[feature],
					checking: false,
				};
			}
			return { allowed: true, reasonAr: "", checking: false };

		// Hard-blocked features for FREE plan
		default:
			return {
				allowed: false,
				reasonAr: FEATURE_REASONS_AR[feature],
				checking: false,
			};
	}
}
