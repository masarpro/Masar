// Temporary UI integration for MasarSidebarShell
// Using original NavBar menu items – no new labels
"use client";

import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { OrganzationSelect } from "@saas/organizations/components/OrganizationSelect";
// import { NavBar } from "@saas/shared/components/NavBar";
import { MasarSidebarShell } from "@saas/shared/components/MasarSidebarShell";
import { SidebarClock } from "@saas/shared/components/SidebarClock";
import { UserMenu } from "@saas/shared/components/UserMenu";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { Logo } from "@shared/components/Logo";
import { cn } from "@ui/lib";
import {
	BotMessageSquareIcon,
	Calculator,
	FolderKanban,
	HomeIcon,
	ReceiptIcon,
	SettingsIcon,
	UserCog2Icon,
	UserCogIcon,
	// Finance sub-section icons
	Wallet,
	FileSpreadsheet,
	FileText,
	CreditCard,
	Banknote,
	Users,
	FolderOpen,
	Layout,
	BarChart3,
	Settings,
	Building,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type PropsWithChildren, useState } from "react";

export function AppWrapper({ children }: PropsWithChildren) {
	const t = useTranslations();
	const pathname = usePathname();
	const router = useRouter();
	const { user } = useSession();
	const { activeOrganization, isOrganizationAdmin } = useActiveOrganization();

	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	// Same menu items as NavBar (exact same logic)
	const menuItems = [
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
						href: `/app/${activeOrganization.slug}/quantities`,
						icon: Calculator,
						isActive: pathname.includes("/quantities"),
					},
					{
						id: "projects",
						label: t("app.menu.projects"),
						href: `/app/${activeOrganization.slug}/projects`,
						icon: FolderKanban,
						isActive: pathname.includes("/projects"),
					},
					{
						id: "finance",
						label: t("app.menu.finance"),
						href: `/app/${activeOrganization.slug}/finance`,
						icon: ReceiptIcon,
						isActive: pathname.includes("/finance"),
						children: [
							{
								id: "finance-dashboard",
								label: t("finance.shell.sections.dashboard"),
								href: `/app/${activeOrganization.slug}/finance`,
								icon: Wallet,
							},
							{
								id: "finance-quotations",
								label: t("finance.shell.sections.quotations"),
								href: `/app/${activeOrganization.slug}/finance/quotations`,
								icon: FileSpreadsheet,
							},
							{
								id: "finance-invoices",
								label: t("finance.shell.sections.invoices"),
								href: `/app/${activeOrganization.slug}/finance/invoices`,
								icon: FileText,
							},
							{
								id: "finance-expenses",
								label: t("finance.shell.sections.expenses"),
								href: `/app/${activeOrganization.slug}/finance/expenses`,
								icon: CreditCard,
							},
							{
								id: "finance-payments",
								label: t("finance.shell.sections.payments"),
								href: `/app/${activeOrganization.slug}/finance/payments`,
								icon: Banknote,
							},
							{
								id: "finance-clients",
								label: t("finance.shell.sections.clients"),
								href: `/app/${activeOrganization.slug}/finance/clients`,
								icon: Users,
							},
							{
								id: "finance-banks",
								label: t("finance.shell.sections.banks"),
								href: `/app/${activeOrganization.slug}/finance/banks`,
								icon: Building,
							},
							{
								id: "finance-documents",
								label: t("finance.shell.sections.documents"),
								href: `/app/${activeOrganization.slug}/finance/documents`,
								icon: FolderOpen,
							},
							{
								id: "finance-templates",
								label: t("finance.shell.sections.templates"),
								href: `/app/${activeOrganization.slug}/finance/templates`,
								icon: Layout,
							},
							{
								id: "finance-reports",
								label: t("finance.shell.sections.reports"),
								href: `/app/${activeOrganization.slug}/finance/reports`,
								icon: BarChart3,
							},
							{
								id: "finance-settings",
								label: t("finance.shell.sections.settings"),
								href: `/app/${activeOrganization.slug}/finance/settings`,
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
				? `/app/${activeOrganization.slug}/chatbot`
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

	// Find active item ID (checks children first for more specific matching)
	const findActiveId = (): string | undefined => {
		for (const item of menuItems) {
			// Check children first (more specific)
			if (item.children) {
				for (const child of item.children) {
					// Special case: dashboard is exact match to /finance
					if (child.id === "finance-dashboard") {
						const financeBase = `/app/${activeOrganization?.slug}/finance`;
						if (pathname === financeBase || pathname === `${financeBase}/`) {
							return child.id;
						}
					} else if (child.href && pathname.startsWith(child.href)) {
						return child.id;
					}
				}
			}
			// Then check parent
			if (item.isActive) return item.id;
		}
		return undefined;
	};
	const activeId = findActiveId();

	// Handle item click - navigate to href (searches both items and children)
	const handleItemClick = (item: { id: string; label: string }) => {
		// Search in main items
		const menuItem = menuItems.find((m) => m.id === item.id);
		if (menuItem?.href) {
			router.push(menuItem.href);
			return;
		}
		// Search in children
		for (const mainItem of menuItems) {
			if (mainItem.children) {
				const child = mainItem.children.find((c) => c.id === item.id);
				if (child?.href) {
					router.push(child.href);
					return;
				}
			}
		}
	};

	return (
		<div className="flex min-h-screen">
			{/* Old NavBar (disabled) */}
			{/* <NavBar /> */}

			{/* New MasarSidebarShell with original menu items */}
			<MasarSidebarShell
				items={menuItems}
				activeId={activeId}
				collapsed={collapsed}
				onCollapse={setCollapsed}
				mobileOpen={mobileOpen}
				onMobileOpenChange={setMobileOpen}
				onItemClick={handleItemClick}
				header={{
					logo: (
						<Link href="/app" className="block">
							<Logo />
						</Link>
					),
				}}
				headerExtra={
					config.organizations.enable &&
					!config.organizations.hideOrganization && (
						<OrganzationSelect />
					)
				}
				footer={
					<>
						<UserMenu showUserName={!collapsed} />
						<div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
							{!collapsed && <SidebarClock />}
							<div className={cn(
								"flex items-center gap-2",
								collapsed ? "w-full justify-center" : "justify-end"
							)}>
								<LocaleSwitch />
								<ColorModeToggle />
							</div>
						</div>
					</>
				}
			/>

			{/* Main content area */}
			<div
				className={cn("flex-1 py-4", [
					config.ui.saas.useSidebarLayout
						? "min-h-[calc(100vh)] lg:ms-[280px] lg:pe-4"
						: "",
					collapsed && config.ui.saas.useSidebarLayout
						? "lg:ms-[80px]"
						: "",
				])}
			>
				<main
					className={cn(
						"py-6 rounded-3xl bg-card px-4 md:p-8 min-h-full w-full",
					)}
				>
					<div className="container px-0">{children}</div>
				</main>
			</div>
		</div>
	);
}
