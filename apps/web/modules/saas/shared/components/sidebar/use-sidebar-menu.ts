"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useSession } from "@saas/auth/hooks/use-session";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
	BarChart3,
	Building,
	Calculator,
	CreditCard,
	FileSpreadsheet,
	FileText,
	FolderKanban,
	FolderOpen,
	Hammer,
	HomeIcon,
	Key,
	Layout,
	Receipt,
	ReceiptIcon,
	Settings,
	SettingsIcon,
	UserCogIcon,
	Users,
	Wallet,
	Banknote,
	Building2,
} from "lucide-react";

export interface SidebarMenuChild {
	id: string;
	label: string;
	href: string;
	icon: LucideIcon;
}

export interface SidebarMenuItem {
	id: string;
	label: string;
	href?: string;
	icon: LucideIcon;
	isActive?: boolean;
	children?: SidebarMenuChild[];
}

export function useSidebarMenu(): {
	items: SidebarMenuItem[];
	activeId: string | undefined;
} {
	const t = useTranslations();
	const pathname = usePathname();
	const { user } = useSession();
	const { activeOrganization, isOrganizationAdmin } = useActiveOrganization();

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";
	const orgPrefix = basePath;

	// Extract projectId from pathname when inside a project
	const projectId = useMemo(() => {
		const match = pathname.match(/\/projects\/([^/]+)/);
		return match?.[1] ?? null;
	}, [pathname]);

	const items = useMemo<SidebarMenuItem[]>(() => {
		const projectBase = projectId
			? `${orgPrefix}/projects/${projectId}`
			: null;

		return [
			{
				id: "start",
				label: t("app.menu.home"),
				href: basePath,
				icon: HomeIcon,
				isActive: pathname === basePath,
			},
			...(activeOrganization
				? [
						{
							id: "projects",
							label: t("app.menu.projects"),
							href: `${orgPrefix}/projects`,
							icon: FolderKanban,
							isActive: pathname.includes("/projects"),
							...(projectBase
								? {
										children: [
											{
												id: "project-overview",
												label: t("projects.shell.sections.overview"),
												href: projectBase,
												icon: HomeIcon,
											},
											{
												id: "project-execution",
												label: t("projects.shell.sections.execution"),
												href: `${projectBase}/execution`,
												icon: FileText,
											},
											{
												id: "project-subcontracts",
												label: t("projects.shell.sections.subcontracts"),
												href: `${projectBase}/finance/subcontracts`,
												icon: Hammer,
											},
											{
												id: "project-expenses",
												label: t("projects.shell.sections.expenses"),
												href: `${projectBase}/finance/expenses`,
												icon: Receipt,
											},
											{
												id: "project-payments",
												label: t("projects.shell.sections.paymentsAndClaims"),
												href: `${projectBase}/finance/claims`,
												icon: Banknote,
											},
											{
												id: "project-documents",
												label: t("projects.shell.sections.documents"),
												href: `${projectBase}/documents`,
												icon: FolderOpen,
											},
											{
												id: "project-owner",
												label: t("projects.shell.sections.owner"),
												href: `${projectBase}/owner`,
												icon: Key,
											},
											{
												id: "project-insights",
												label: t("projects.shell.sections.insights"),
												href: `${projectBase}/insights`,
												icon: BarChart3,
											},
											{
												id: "project-team",
												label: t("projects.shell.sections.team"),
												href: `${projectBase}/team`,
												icon: Users,
											},
										],
									}
								: {}),
						},
						{
							id: "finance",
							label: t("app.menu.finance"),
							href: `${orgPrefix}/finance`,
							icon: ReceiptIcon,
							isActive: pathname.includes("/finance"),
							children: [
								{
									id: "finance-dashboard",
									label: t("finance.shell.sections.dashboard"),
									href: `${orgPrefix}/finance`,
									icon: Wallet,
								},
								{
									id: "finance-invoices",
									label: t("finance.shell.sections.invoices"),
									href: `${orgPrefix}/finance/invoices`,
									icon: FileText,
								},
								{
									id: "finance-expenses",
									label: t("finance.shell.sections.expenses"),
									href: `${orgPrefix}/finance/expenses`,
									icon: CreditCard,
								},
								{
									id: "finance-payments",
									label: t("finance.shell.sections.payments"),
									href: `${orgPrefix}/finance/payments`,
									icon: Banknote,
								},
								{
									id: "finance-clients",
									label: t("finance.shell.sections.clients"),
									href: `${orgPrefix}/finance/clients`,
									icon: Users,
								},
								{
									id: "finance-banks",
									label: t("finance.shell.sections.banks"),
									href: `${orgPrefix}/finance/banks`,
									icon: Building,
								},
								{
									id: "finance-documents",
									label: t("finance.shell.sections.documents"),
									href: `${orgPrefix}/finance/documents`,
									icon: FolderOpen,
								},
								{
									id: "finance-templates",
									label: t("finance.shell.sections.templates"),
									href: `${orgPrefix}/finance/templates`,
									icon: Layout,
								},
								{
									id: "finance-reports",
									label: t("finance.shell.sections.reports"),
									href: `${orgPrefix}/finance/reports`,
									icon: BarChart3,
								},
								{
									id: "finance-settings",
									label: t("finance.shell.sections.settings"),
									href: `${orgPrefix}/finance/settings`,
									icon: Settings,
								},
							],
						},
						{
							id: "pricing",
							label: t("app.menu.pricing"),
							href: `${orgPrefix}/pricing`,
							icon: Calculator,
							isActive: pathname.includes("/pricing"),
							children: [
								{
									id: "pricing-dashboard",
									label: t("pricing.shell.sections.dashboard"),
									href: `${orgPrefix}/pricing`,
									icon: HomeIcon,
								},
								{
									id: "pricing-studies",
									label: t("pricing.shell.sections.studies"),
									href: `${orgPrefix}/pricing/studies`,
									icon: Calculator,
								},
								{
									id: "pricing-quotations",
									label: t("pricing.shell.sections.quotations"),
									href: `${orgPrefix}/pricing/quotations`,
									icon: FileSpreadsheet,
								},
							],
						},
						{
							id: "company",
							label: t("app.menu.company"),
							href: `${orgPrefix}/company`,
							icon: Building2,
							isActive: pathname.includes("/company"),
							children: [
								{
									id: "company-dashboard",
									label: t("company.nav.dashboard"),
									href: `${orgPrefix}/company`,
									icon: HomeIcon,
								},
								{
									id: "company-employees",
									label: t("company.nav.employees"),
									href: `${orgPrefix}/company/employees`,
									icon: Users,
								},
								{
									id: "company-expenses",
									label: t("company.nav.expenses"),
									href: `${orgPrefix}/company/expenses`,
									icon: CreditCard,
								},
								{
									id: "company-assets",
									label: t("company.nav.assets"),
									href: `${orgPrefix}/company/assets`,
									icon: Hammer,
								},
								{
									id: "company-reports",
									label: t("company.nav.reports"),
									href: `${orgPrefix}/company/reports`,
									icon: BarChart3,
								},
							],
						},
					]
				: []),
			...(activeOrganization && isOrganizationAdmin
				? [
						{
							id: "orgSettings",
							label: t("app.menu.organizationSettings"),
							href: `${basePath}/settings`,
							icon: SettingsIcon,
							isActive: pathname.startsWith(`${basePath}/settings/`),
						},
					]
				: []),
			...(user?.role === "admin"
				? [
						{
							id: "admin",
							label: t("app.menu.admin"),
							href: "/app/admin",
							icon: UserCogIcon,
							isActive: pathname.startsWith("/app/admin/"),
						},
					]
				: []),
		];
	}, [
		t,
		pathname,
		basePath,
		orgPrefix,
		activeOrganization,
		isOrganizationAdmin,
		user?.role,
		projectId,
	]);

	const activeId = useMemo(() => {
		const financeBase = activeOrganization
			? `/app/${activeOrganization.slug}/finance`
			: undefined;

		const companyBase = activeOrganization
			? `/app/${activeOrganization.slug}/company`
			: undefined;

		const pricingBase = activeOrganization
			? `/app/${activeOrganization.slug}/pricing`
			: undefined;

		const projectBase = projectId && activeOrganization
			? `/app/${activeOrganization.slug}/projects/${projectId}`
			: undefined;

		for (const item of items) {
			if (item.children) {
				// For children, find the best (longest) match
				let bestMatch: { id: string; length: number } | null = null;
				for (const child of item.children) {
					if (child.id === "finance-dashboard" && financeBase) {
						if (
							pathname === financeBase ||
							pathname === `${financeBase}/`
						) {
							return child.id;
						}
					} else if (child.id === "pricing-dashboard" && pricingBase) {
						if (
							pathname === pricingBase ||
							pathname === `${pricingBase}/`
						) {
							return child.id;
						}
					} else if (child.id === "company-dashboard" && companyBase) {
						if (
							pathname === companyBase ||
							pathname === `${companyBase}/`
						) {
							return child.id;
						}
					} else if (child.id === "project-overview" && projectBase) {
						if (
							pathname === projectBase ||
							pathname === `${projectBase}/`
						) {
							return child.id;
						}
					} else if (child.href && pathname.startsWith(child.href)) {
						if (!bestMatch || child.href.length > bestMatch.length) {
							bestMatch = { id: child.id, length: child.href.length };
						}
					}
				}
				if (bestMatch) return bestMatch.id;
			}
			if (item.isActive) return item.id;
		}
		return undefined;
	}, [items, pathname, activeOrganization, projectId]);

	return { items, activeId };
}
