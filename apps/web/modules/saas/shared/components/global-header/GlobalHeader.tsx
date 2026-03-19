"use client";

import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useLocalePathname, useLocaleRouter } from "@i18n/routing";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { NotificationBell } from "@saas/shared/components/NotificationBell";
import { UserAvatar } from "@shared/components/UserAvatar";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
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
	Settings,
	Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export function GlobalHeader() {
	const t = useTranslations();
	const pathname = usePathname();
	const locale = useLocale();
	const searchParams = useSearchParams();
	const localeRouter = useLocaleRouter();
	const localePathname = useLocalePathname();
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();

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
		<div
			className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50 mb-5"
			dir="rtl"
		>
			{/* Section icon + title + org name */}
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
					<SectionIcon className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold text-foreground">
						{sectionLabel}
					</h1>
					<p className="text-sm text-muted-foreground">
						{activeOrganization?.name}
					</p>
				</div>
			</div>

			{/* Tools: notifications + color mode + user avatar */}
			<div className="hidden sm:flex items-center gap-2">
				{activeOrganization?.id && (
					<NotificationBell organizationId={activeOrganization.id} />
				)}

				<ColorModeToggle />

				{/* User avatar + dropdown */}
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
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
		</div>
	);
}
