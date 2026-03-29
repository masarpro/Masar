import { z } from "zod";
import { registerTool } from "../registry";
import { type Permissions, ROLE_NAMES_AR, hasPermission } from "@repo/database";

registerTool({
	name: "getMyPermissions",
	description:
		"عرض صلاحيات المستخدم الحالي — ما يمكنه الوصول إليه في المنصة. استخدمها لما يسأل 'وش صلاحياتي' أو 'وش أقدر أسوي' أو 'ما هي صلاحياتي'",
	moduleId: "system",
	parameters: z.object({}),
	execute: async (_params, context) => {
		const permissions = (context as any).permissions as
			| Permissions
			| undefined;
		const roleType = (context as any).roleType as string | undefined;

		if (!permissions) {
			return { error: "لم يتم تحميل الصلاحيات" };
		}

		const roleName = roleType
			? (ROLE_NAMES_AR[roleType] ?? roleType)
			: "غير محدد";

		const permSections: {
			key: keyof Permissions;
			nameAr: string;
			checks: [string, string][];
		}[] = [
			{
				key: "projects",
				nameAr: "المشاريع",
				checks: [
					["view", "عرض"],
					["create", "إنشاء"],
					["edit", "تعديل"],
					["delete", "حذف"],
					["viewFinance", "عرض المالية"],
					["manageTeam", "إدارة الفريق"],
				],
			},
			{
				key: "finance",
				nameAr: "المالية",
				checks: [
					["view", "عرض"],
					["quotations", "عروض الأسعار"],
					["invoices", "الفواتير"],
					["payments", "المدفوعات"],
					["reports", "التقارير"],
					["settings", "الإعدادات"],
				],
			},
			{
				key: "quantities",
				nameAr: "الكميات",
				checks: [
					["view", "عرض"],
					["create", "إنشاء"],
					["edit", "تعديل"],
					["pricing", "التسعير"],
				],
			},
			{
				key: "company",
				nameAr: "المنشأة",
				checks: [
					["view", "عرض"],
					["expenses", "المصروفات"],
					["assets", "الأصول"],
					["reports", "التقارير"],
				],
			},
			{
				key: "employees",
				nameAr: "الموظفين",
				checks: [
					["view", "عرض"],
					["payroll", "الرواتب"],
					["attendance", "الحضور"],
				],
			},
			{
				key: "pricing",
				nameAr: "التسعير",
				checks: [
					["view", "عرض"],
					["studies", "الدراسات"],
					["quotations", "عروض الأسعار"],
					["leads", "العملاء المحتملين"],
				],
			},
		];

		const summary: Record<string, string[]> = {};

		for (const section of permSections) {
			const allowed = section.checks
				.filter(([action]) =>
					hasPermission(permissions, section.key, action),
				)
				.map(([, label]) => label);
			if (allowed.length > 0) {
				summary[section.nameAr] = allowed;
			}
		}

		return {
			role: roleName,
			permissions: summary,
			note: "هذه صلاحياتك في المنصة. بإمكان المالك تعديلها من إعدادات الأدوار.",
		};
	},
});
