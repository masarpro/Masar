"use client";

import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useLocalePathname, useLocaleRouter } from "@i18n/routing";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { NotificationBell } from "@saas/shared/components/NotificationBell";
import { UserAvatar } from "@shared/components/UserAvatar";
import { cn } from "@ui/lib";
import { Button } from "@ui/components/button";
import React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	ChevronLeft,
	ChevronRight,
	LanguagesIcon,
	LogOutIcon,
	Menu,
	MoonIcon,
	Settings,
	SunIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useIsClient } from "usehooks-ts";
import { useSidebar } from "../sidebar/sidebar-context";
import { useIsMobile } from "../sidebar/use-is-mobile";
import { HeaderQuickAdd } from "./HeaderQuickAdd";
import { HeaderSearch } from "./HeaderSearch";

/** Botly top-bar icon-button treatment (69:1786): 44px, 12px radius, ghost. */
const iconButtonClass = cn(
	"flex size-11 items-center justify-center rounded-xl text-foreground transition-colors",
	"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

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

	// Section label = page title (Botly big bold headline).
	let sectionLabel = t("app.menu.home");
	if (pathname.includes("/finance")) {
		sectionLabel = t("app.menu.finance");
	} else if (pathname.includes("/projects")) {
		sectionLabel = t("app.menu.projects");
	} else if (pathname.includes("/pricing")) {
		sectionLabel = t("app.menu.pricing");
	} else if (pathname.includes("/company")) {
		sectionLabel = t("app.menu.company");
	} else if (pathname.includes("/settings")) {
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
		localeRouter.replace(`${localePathname}?${searchParams.toString()}`, {
			locale: newLocale,
		});
	};

	return (
		// Botly Top bar (69:1786): flat, no divider, big bold title + nav chevrons
		// on the leading side; icon buttons + avatar on the trailing side. Padding
		// aligns with the content cards below it.
		<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center bg-background px-3 xl:h-20 xl:px-8">
			{/* Inner box shares the cards' max-w-[1400px] content column so the
			    title + icons line up exactly with the card borders (Figma 69:1786:
			    the top bar is the same 1144px-wide column as the cards). */}
			<div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
			{/* Leading side: mobile hamburger + page title + back/forward chevrons */}
			<div className="flex min-w-0 items-center gap-2 xl:gap-6">
				{isMobile && (
					<Button
						variant="ghost"
						size="icon"
						className="size-10 rounded-xl"
						onClick={() => setMobileOpen(true)}
						aria-label="Open menu"
					>
						<Menu className="size-5" />
					</Button>
				)}
				<h1 className="truncate text-xl font-bold text-foreground xl:text-3xl">
					{sectionLabel}
				</h1>
				<div className="hidden items-center sm:flex">
					<button
						type="button"
						onClick={() => window.history.back()}
						className={cn(iconButtonClass, "size-10")}
						aria-label={t("globalHeader.back")}
					>
						<ChevronLeft className="size-5 rtl-flip" />
					</button>
					<button
						type="button"
						onClick={() => window.history.forward()}
						className={cn(iconButtonClass, "size-10")}
						aria-label={t("globalHeader.forward")}
					>
						<ChevronRight className="size-5 rtl-flip" />
					</button>
				</div>
			</div>

			{/* Trailing side (Botly 267:4701): quick-add → bell → search → avatar */}
			<div className="flex items-center gap-2 xl:gap-4">
				<HeaderQuickAdd />

				{activeOrganization?.id && (
					<NotificationBell
						organizationId={activeOrganization.id}
						organizationSlug={activeOrganization.slug}
					/>
				)}

				<HeaderSearch />

				{/* Avatar + Botly profile card dropdown (75:2472) */}
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="ms-1 rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
							aria-label="User menu"
						>
							<UserAvatar
								name={user?.name ?? ""}
								avatarUrl={user?.image}
								className="size-11"
							/>
						</button>
					</DropdownMenuTrigger>

					<DropdownMenuContent
						align="end"
						sideOffset={12}
						className="w-72 overflow-hidden rounded-[20px] p-0 shadow-[0px_8px_32px_12px_rgba(0,0,0,0.06)]"
					>
						{/* User block */}
						<div className="flex items-center gap-4 border-b px-6 py-5">
							<div className="min-w-0 flex-1">
								<p className="truncate text-lg font-semibold text-foreground">
									{user?.name}
								</p>
								<p className="truncate text-sm text-muted-foreground">
									{user?.email}
								</p>
							</div>
							<UserAvatar
								name={user?.name ?? ""}
								avatarUrl={user?.image}
								className="size-14 shrink-0"
							/>
						</div>

						{/* Actions */}
						<div className="flex flex-col gap-1 px-3 py-2">
							<DropdownMenuItem
								asChild
								className="rounded-xl px-4 py-3 text-base font-semibold text-muted-foreground focus:text-foreground"
							>
								<Link href="/app/settings/general">
									<Settings className="me-3 size-5" />
									{t("app.userMenu.accountSettings")}
								</Link>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={onSwitchLocale}
								className="rounded-xl px-4 py-3 text-base font-semibold text-muted-foreground focus:text-foreground"
							>
								<LanguagesIcon className="me-3 size-5" />
								{locale === "ar"
									? t("globalHeader.switchToEnglish")
									: t("globalHeader.switchToArabic")}
							</DropdownMenuItem>
						</div>

						{/* Segmented Light/Dark toggle */}
						<div className="border-y px-3 py-4">
							<ThemeSegmentedToggle />
						</div>

						{/* Log out */}
						<div className="px-3 py-2">
							<DropdownMenuItem
								onClick={onLogout}
								className="rounded-xl px-4 py-3 text-base font-semibold text-muted-foreground focus:text-foreground"
							>
								<LogOutIcon className="me-3 size-5" />
								{t("app.userMenu.logout")}
							</DropdownMenuItem>
						</div>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			</div>
		</header>
	);
});

/** Botly two-cell segmented Light/Dark control (75:2438). */
function ThemeSegmentedToggle() {
	const t = useTranslations();
	const { resolvedTheme, setTheme } = useTheme();
	const isClient = useIsClient();
	// Before hydration, assume light so the markup is stable (no flash of the
	// wrong active cell). resolvedTheme fills in on mount.
	const active = isClient ? resolvedTheme : "light";

	const options = [
		{ value: "light", label: t("globalHeader.themeLight"), icon: SunIcon },
		{ value: "dark", label: t("globalHeader.themeDark"), icon: MoonIcon },
	];

	return (
		<div className="flex items-center gap-1 rounded-lg border-2 p-1">
			{options.map((option) => {
				const isActive = active === option.value;
				return (
					<button
						key={option.value}
						type="button"
						onClick={(e) => {
							// Keep the dropdown open while switching themes.
							e.preventDefault();
							setTheme(option.value);
						}}
						className={cn(
							"flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-base font-semibold transition-colors",
							isActive
								? "bg-muted text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<option.icon className="size-4" />
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
