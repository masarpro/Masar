import { config } from "@repo/config";
import { getSession } from "@saas/auth/lib/server";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import { Logo } from "@shared/components/Logo";
import {
	Building2Icon,
	ClipboardListIcon,
	CreditCardIcon,
	DollarSignIcon,
	LayoutDashboardIcon,
	Settings2Icon,
	UsersIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations();
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	if ((session.user as any)?.role !== "admin") {
		redirect("/app");
	}

	return (
		<>
			<PageHeader
				title={t("admin.title")}
				subtitle={t("admin.description")}
			/>
			<SidebarContentLayout
				sidebar={
					<SettingsMenu
						menuItems={[
							{
								avatar: (
									<Logo
										className="size-8"
										withLabel={false}
									/>
								),
								title: t("admin.title"),
								items: [
									{
										title: t("admin.menu.dashboard"),
										href: "/app/admin",
										icon: (
											<LayoutDashboardIcon className="size-4 opacity-50" />
										),
									},
									{
										title: t("admin.menu.users"),
										href: "/app/admin/users",
										icon: (
											<UsersIcon className="size-4 opacity-50" />
										),
									},
									...(config.organizations.enable
										? [
												{
													title: t(
														"admin.menu.organizations",
													),
													href: "/app/admin/organizations",
													icon: (
														<Building2Icon className="size-4 opacity-50" />
													),
												},
											]
										: []),
									{
										title: t("admin.menu.plans"),
										href: "/app/admin/plans",
										icon: (
											<Settings2Icon className="size-4 opacity-50" />
										),
									},
									{
										title: t("admin.menu.revenue"),
										href: "/app/admin/revenue",
										icon: (
											<DollarSignIcon className="size-4 opacity-50" />
										),
									},
									{
										title: t("admin.menu.subscriptions"),
										href: "/app/admin/subscriptions",
										icon: (
											<CreditCardIcon className="size-4 opacity-50" />
										),
									},
									{
										title: t("admin.menu.logs"),
										href: "/app/admin/logs",
										icon: (
											<ClipboardListIcon className="size-4 opacity-50" />
										),
									},
								],
							},
						]}
					/>
				}
			>
				{children}
			</SidebarContentLayout>
		</>
	);
}
