"use client";

import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useLocalePathname, useLocaleRouter } from "@i18n/routing";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { NotificationBell } from "@saas/shared/components/NotificationBell";
import { UserAvatar } from "@shared/components/UserAvatar";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { Button } from "@ui/components/button";
import React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Building2,
	Calculator,
	FolderKanban,
	Home,
	LanguagesIcon,
	LogOutIcon,
	Menu,
	Settings,
	Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSidebar } from "../sidebar/sidebar-context";
import { useIsMobile } from "../sidebar/use-is-mobile";

export const GlobalHeader = React.memo(function GlobalHeader() {
	const t = useTranslations();
	const pathname = usePathname();
	const locale = useLocale();
	const searchParams = useSearchParams();
	const localeRouter = useLocaleRouter();
	const localePathname = useLocalePathname();
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { setMobileOpen } = useSidebar();
	const isMobile = useIsMobile();

	// Determine current section from pathname
	let SectionIcon: LucideIcon = Home;
	let sectionLabel = t("app.menu.home");

	if (pathname.includes("/finance")) {
		SectionIcon = Wallet;
		sectionLabel = t("app.menu.finance");
	} else if (pathname.includes("/projects")) {
		SectionIcon = FolderKanban;
		sectionLabel = t("app.menu.projects");
	} else if (pathname.includes("/pricing")) {
		SectionIcon = Calculator;
		sectionLabel = t("app.menu.pricing");
	} else if (pathname.includes("/company")) {
		SectionIcon = Building2;
		sectionLabel = t("app.menu.company");
	} else if (pathname.includes("/settings")) {
		SectionIcon = Settings;
		sectionLabel = t("app.menu.organizationSettings");
	}

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					window.location.href = new URL(
						config.auth.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	const onSwitchLocale = () => {
		const newLocale = locale === "ar" ? "en" : "ar";
		localeRouter.replace(
			`${localePathname}?${searchParams.toString()}`,
			{ locale: newLocale },
		);
	};

	return (
		<header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center justify-between border-b border-border/30 bg-background px-4">
			{/* Start side: mobile hamburger + section icon + section name */}
			<div className="flex items-center gap-2.5">
				{isMobile && (
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 rounded-lg"
						onClick={() => setMobileOpen(true)}
						aria-label="Open menu"
					>
						<Menu className="h-5 w-5" />
					</Button>
				)}
				<SectionIcon className="h-5 w-5 text-primary/70" />
				<span className="text-base font-medium text-foreground">
					{sectionLabel}
				</span>
			</div>

			{/* End side: color mode + notifications + user avatar */}
			<div className="flex items-center gap-1">
				<ColorModeToggle />

				{activeOrganization?.id && (
					<NotificationBell organizationId={activeOrganization.id} />
				)}

				{/* User avatar + dropdown */}
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="ms-1 rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
							aria-label="User menu"
						>
							<UserAvatar
								name={user?.name ?? ""}
								avatarUrl={user?.image}
								className="h-8 w-8"
							/>
						</button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							{user?.name}
							<span className="block text-xs font-normal opacity-70">
								{user?.email}
							</span>
						</DropdownMenuLabel>

						<DropdownMenuSeparator />

						<DropdownMenuItem asChild>
							<Link href="/app/settings/general">
								<Settings className="me-2 h-4 w-4" />
								{t("app.userMenu.accountSettings")}
							</Link>
						</DropdownMenuItem>

						<DropdownMenuItem onClick={onSwitchLocale}>
							<LanguagesIcon className="me-2 h-4 w-4" />
							{locale === "ar"
								? t("globalHeader.switchToEnglish")
								: t("globalHeader.switchToArabic")}
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem onClick={onLogout}>
							<LogOutIcon className="me-2 h-4 w-4" />
							{t("app.userMenu.logout")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
});
