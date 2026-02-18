"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useSession } from "@saas/auth/hooks/use-session";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
	BarChart3,
	BotMessageSquareIcon,
	Building,
	Calculator,
	CreditCard,
	FileSpreadsheet,
	FileText,
	FolderKanban,
	FolderOpen,
	HomeIcon,
	Layout,
	ReceiptIcon,
	Settings,
	SettingsIcon,
	UserCog2Icon,
	UserCogIcon,
	Users,
	Wallet,
	Banknote,
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

	const items = useMemo<SidebarMenuItem[]>(() => {
		return [
			{
				id: "start",
				label: t("app.menu.start"),
				href: basePath,
				icon: HomeIcon,
				isActive: pathname === basePath,
			},
			...(activeOrganization
				? [
						{
							id: "quantities",
							label: t("app.menu.quantities"),
							href: `${orgPrefix}/quantities`,
							icon: Calculator,
							isActive: pathname.includes("/quantities"),
						},
						{
							id: "projects",
							label: t("app.menu.projects"),
							href: `${orgPrefix}/projects`,
							icon: FolderKanban,
							isActive: pathname.includes("/projects"),
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
									id: "finance-quotations",
									label: t("finance.shell.sections.quotations"),
									href: `${orgPrefix}/finance/quotations`,
									icon: FileSpreadsheet,
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
					]
				: []),
			{
				id: "chatbot",
				label: t("app.menu.aiChatbot"),
				href: activeOrganization
					? `${orgPrefix}/chatbot`
					: "/app/chatbot",
				icon: BotMessageSquareIcon,
				isActive: pathname.includes("/chatbot"),
			},
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
			{
				id: "accountSettings",
				label: t("app.menu.accountSettings"),
				href: "/app/settings",
				icon: UserCog2Icon,
				isActive: pathname.startsWith("/app/settings/"),
			},
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
	]);

	const activeId = useMemo(() => {
		const financeBase = activeOrganization
			? `/app/${activeOrganization.slug}/finance`
			: undefined;

		for (const item of items) {
			if (item.children) {
				for (const child of item.children) {
					if (child.id === "finance-dashboard" && financeBase) {
						if (
							pathname === financeBase ||
							pathname === `${financeBase}/`
						) {
							return child.id;
						}
					} else if (child.href && pathname.startsWith(child.href)) {
						return child.id;
					}
				}
			}
			if (item.isActive) return item.id;
		}
		return undefined;
	}, [items, pathname, activeOrganization]);

	return { items, activeId };
}
