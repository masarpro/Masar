// Sidebar Skin Migration
// CSS-only changes inspired by Masar v1
// No logic or behavior changes
"use client";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { UserMenu } from "@saas/shared/components/UserMenu";
import { NotificationBell } from "@saas/shared/components/NotificationBell";
import { Logo } from "@shared/components/Logo";
import { cn } from "@ui/lib";
import {
	BotMessageSquareIcon,
	Calculator,
	ChevronRightIcon,
	HomeIcon,
	ReceiptIcon,
	SettingsIcon,
	UserCog2Icon,
	UserCogIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { OrganzationSelect } from "../../organizations/components/OrganizationSelect";

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { user } = useSession();
	const { activeOrganization, isOrganizationAdmin } = useActiveOrganization();

	const { useSidebarLayout } = config.ui.saas;

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	const menuItems = [
		{
			label: t("app.menu.home"),
			href: basePath,
			icon: HomeIcon,
			isActive: pathname === basePath,
		},
		...(activeOrganization
			? [
					{
						label: t("app.menu.quantities"),
						href: `/app/${activeOrganization.slug}/quantities`,
						icon: Calculator,
						isActive: pathname.includes("/quantities"),
					},
					{
						label: t("app.menu.finance"),
						href: `/app/${activeOrganization.slug}/finance`,
						icon: ReceiptIcon,
						isActive: pathname.includes("/finance"),
					},
				]
			: []),
		{
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
						label: t("app.menu.organizationSettings"),
						href: `${basePath}/settings`,
						icon: SettingsIcon,
						isActive: pathname.startsWith(`${basePath}/settings/`),
					},
				]
			: []),
		{
			label: t("app.menu.accountSettings"),
			href: "/app/settings",
			icon: UserCog2Icon,
			isActive: pathname.startsWith("/app/settings/"),
		},
		...(user?.role === "admin"
			? [
					{
						label: t("app.menu.admin"),
						href: "/app/admin",
						icon: UserCogIcon,
						isActive: pathname.startsWith("/app/admin/"),
					},
				]
			: []),
	];

	return (
		<nav
			className={cn("w-full", {
				"w-full md:fixed md:top-0 md:start-0 md:h-full md:w-[280px]":
					useSidebarLayout,
			})}
		>
			<div
				className={cn("container max-w-6xl py-4", {
					"container max-w-6xl py-4 md:flex md:h-full md:flex-col md:px-6 md:pt-6 md:pb-0":
						useSidebarLayout,
				})}
			>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div
						className={cn("flex items-center gap-4 md:gap-2", {
							"md:flex md:w-full md:flex-col md:items-stretch md:align-stretch":
								useSidebarLayout,
						})}
					>
						<Link href="/app" className="block">
							<Logo />
						</Link>

						{config.organizations.enable &&
							!config.organizations.hideOrganization && (
								<>
									<span
										className={cn(
											"hidden opacity-30 md:block",
											{
												"md:hidden": useSidebarLayout,
											},
										)}
									>
										<ChevronRightIcon className="size-4" />
									</span>

									<OrganzationSelect
										className={cn({
											"md:-mx-2 md:mt-2":
												useSidebarLayout,
										})}
									/>
								</>
							)}
					</div>

					<div
						className={cn(
							"me-0 ms-auto flex items-center justify-end gap-4",
							{
								"md:hidden": useSidebarLayout,
							},
						)}
					>
						{activeOrganization && (
							<NotificationBell organizationId={activeOrganization.id} />
						)}
						<UserMenu />
					</div>
				</div>

				<ul
					className={cn(
						"no-scrollbar -mx-4 -mb-4 mt-6 flex list-none items-center justify-start gap-4 overflow-x-auto px-4 text-sm",
						{
							"md:mx-0 md:my-4 md:flex md:flex-col md:items-stretch md:gap-1 md:px-3":
								useSidebarLayout,
						},
					)}
				>
					{menuItems.map((menuItem) => (
						<li key={menuItem.href}>
							<Link
								href={menuItem.href}
								className={cn(
									"flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3",
									[
										menuItem.isActive
											? "border-primary font-bold"
											: "border-transparent",
									],
									{
										"md:gap-3 md:border-b-0 md:border-s-0 md:rounded-lg md:p-3 md:transition-colors md:hover:bg-muted":
											useSidebarLayout,
										"md:bg-primary/10 md:text-primary md:font-medium":
											useSidebarLayout && menuItem.isActive,
									},
								)}
								prefetch
							>
								<menuItem.icon
									className={cn(
										"size-4 shrink-0",
										menuItem.isActive
											? "text-primary"
											: "opacity-50",
										{
											"md:size-5": useSidebarLayout,
										},
									)}
								/>
								<span>{menuItem.label}</span>
							</Link>
						</li>
					))}
				</ul>

				<div
					className={cn(
						"-mx-4 md:-mx-6 mt-auto mb-0 hidden p-4 md:p-4",
						{
							"md:block": useSidebarLayout,
						},
					)}
				>
					<div className="mb-2 flex items-center justify-between">
						{activeOrganization && (
							<NotificationBell organizationId={activeOrganization.id} />
						)}
					</div>
					<UserMenu showUserName />
				</div>
			</div>
		</nav>
	);
}
