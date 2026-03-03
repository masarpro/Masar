"use client";

import { LocaleLink, useLocalePathname } from "@i18n/routing";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { Logo } from "@shared/components/Logo";
import { Button } from "@ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@ui/components/sheet";
import { cn } from "@ui/lib";
import { MenuIcon } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

export function NavBar() {
	const t = useTranslations();
	const { user } = useSession();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const localePathname = useLocalePathname();
	const [isTop, setIsTop] = useState(true);

	const handleMobileMenuClose = () => {
		setMobileMenuOpen(false);
	};

	const debouncedScrollHandler = useDebounceCallback(
		() => {
			setIsTop(window.scrollY <= 10);
		},
		150,
		{
			maxWait: 150,
		},
	);

	useEffect(() => {
		window.addEventListener("scroll", debouncedScrollHandler);
		debouncedScrollHandler();
		return () => {
			window.removeEventListener("scroll", debouncedScrollHandler);
		};
	}, [debouncedScrollHandler]);

	useEffect(() => {
		handleMobileMenuClose();
	}, [localePathname]);

	const isDocsPage = localePathname.startsWith("/docs");
	const isHomePage = localePathname === "/" || localePathname === "";

	const menuItems: {
		label: string;
		href: string;
	}[] = [
		{
			label: t("common.menu.pricing"),
			href: "/#pricing",
		},
		{
			label: t("common.menu.faq"),
			href: "/#faq",
		},
		// {
		// 	label: t("common.menu.blog"),
		// 	href: "/blog",
		// },
		// {
		// 	label: t("common.menu.changelog"),
		// 	href: "/changelog",
		// },
		...(config.contactForm.enabled
			? [
					{
						label: t("common.menu.contact"),
						href: "/contact",
					},
				]
			: []),
		{
			label: t("common.menu.docs"),
			href: "/docs",
		},
	];

	const isMenuItemActive = (href: string) => localePathname.startsWith(href);

	return (
		<nav
			className={cn(
				"fixed top-0 left-0 z-50 w-full transition-all duration-500",
				!isTop || isDocsPage
					? isHomePage
						? "backdrop-blur-2xl border-b shadow-sm"
						: "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
					: "bg-transparent",
			)}
			style={
				!isTop && isHomePage
					? {
							background: "var(--lp-nav-scrolled-bg)",
							borderColor: "var(--lp-nav-scrolled-border)",
						}
					: undefined
			}
			data-test="navigation"
		>
			<div className="container">
				<div
					className={cn(
						"flex items-center justify-stretch gap-6 transition-[padding] duration-300",
						!isTop || isDocsPage ? "py-3" : "py-5",
					)}
				>
					<div className="flex flex-1 justify-start">
						<LocaleLink
							href="/"
							className={cn(
								"block hover:no-underline active:no-underline",
								isHomePage && "logo-light",
							)}
						>
							<Logo />
						</LocaleLink>
					</div>

					<div className="hidden flex-1 items-center justify-center lg:flex">
						{menuItems.map((menuItem) => (
							<LocaleLink
								key={menuItem.href}
								href={menuItem.href}
								className={cn(
									"block px-4 py-2 font-medium text-sm rounded-[10px] transition-all duration-300",
									!isHomePage && "text-foreground/80",
									!isHomePage &&
										isMenuItemActive(menuItem.href) &&
										"font-bold text-foreground",
								)}
								style={
									isHomePage
										? {
												color: isMenuItemActive(menuItem.href)
													? "var(--lp-nav-link-active)"
													: "var(--lp-nav-link)",
												fontWeight: isMenuItemActive(menuItem.href)
													? 700
													: undefined,
											}
										: undefined
								}
								onMouseEnter={(e) => {
									if (isHomePage) {
										e.currentTarget.style.color = "var(--lp-nav-link-hover)";
										e.currentTarget.style.backgroundColor = "var(--lp-nav-link-hover-bg)";
									}
								}}
								onMouseLeave={(e) => {
									if (isHomePage) {
										e.currentTarget.style.color = isMenuItemActive(menuItem.href)
											? "var(--lp-nav-link-active)"
											: "var(--lp-nav-link)";
										e.currentTarget.style.backgroundColor = "transparent";
									}
								}}
								prefetch
							>
								{menuItem.label}
							</LocaleLink>
						))}
					</div>

						<div
						className={cn(
							"flex flex-1 items-center justify-end gap-3",
							isHomePage && "lp-nav-buttons",
						)}
					>
						<ColorModeToggle />
						{config.i18n.enabled && (
							<Suspense>
								<LocaleSwitch />
							</Suspense>
						)}

						<Sheet
							open={mobileMenuOpen}
							onOpenChange={(open) => setMobileMenuOpen(open)}
						>
							<SheetTrigger asChild>
								<Button
									className="lg:hidden"
									size="icon"
									variant="light"
									aria-label="Menu"
								>
									<MenuIcon className="size-4" />
								</Button>
							</SheetTrigger>
							<SheetContent className="w-[280px]" side="right">
								<SheetTitle />
								<div className="flex flex-col items-start justify-center">
									{menuItems.map((menuItem) => (
										<LocaleLink
											key={menuItem.href}
											href={menuItem.href}
											onClick={handleMobileMenuClose}
											className={cn(
												"block px-3 py-2 font-medium text-base text-foreground/80",
												isMenuItemActive(menuItem.href)
													? "font-bold text-foreground"
													: "",
											)}
											prefetch
										>
											{menuItem.label}
										</LocaleLink>
									))}

									<NextLink
										key={user ? "start" : "login"}
										href={user ? "/app" : "/auth/login"}
										className="block px-3 py-2 text-base"
										onClick={handleMobileMenuClose}
										prefetch={!user}
									>
										{user
											? t("common.menu.dashboard")
											: t("common.menu.login")}
									</NextLink>
								</div>
							</SheetContent>
						</Sheet>

						{config.ui.saas.enabled &&
							(user ? (
								<Button
									key="dashboard"
									className="hidden lg:flex shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
									asChild
									variant="primary"
								>
									<NextLink href="/app">
										{t("common.menu.dashboard")}
									</NextLink>
								</Button>
							) : isHomePage ? (
								<>
									<NextLink
										key="login-home"
										href="/auth/login"
										className="hidden lg:block px-4 py-2 text-sm font-medium transition-colors duration-300"
										style={{
											color: "var(--lp-nav-login)",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.color = "var(--lp-nav-login-hover)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.color = "var(--lp-nav-login)";
										}}
										prefetch
									>
										{t("common.menu.login")}
									</NextLink>
									<NextLink
										key="signup-home"
										href="/auth/signup"
										className="hidden lg:block px-6 py-2.5 rounded-[14px] text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden"
										style={{
											background:
												"linear-gradient(135deg, #10B981, #059669)",
											border: `1px solid var(--lp-nav-signup-border)`,
											boxShadow:
												"var(--lp-nav-signup-shadow)",
										}}
									>
										{t("common.menu.signup")}
									</NextLink>
								</>
							) : (
								<Button
									key="login"
									className="hidden lg:flex hover:-translate-y-0.5 transition-all duration-300"
									asChild
									variant="ghost"
								>
									<NextLink href="/auth/login" prefetch>
										{t("common.menu.login")}
									</NextLink>
								</Button>
							))}
					</div>
				</div>
			</div>
		</nav>
	);
}
