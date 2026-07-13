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

// Home page = Botly landing header (Figma 226:1357): transparent over the
// fixed-dark hero, 50%-white menu links, white pill CTA. Other pages keep
// the token-driven light/dark surface.
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
			href: "/faq",
		},
		...(config.contactForm.enabled
			? [
					{
						label: t("common.menu.contact"),
						href: "/contact",
					},
				]
			: []),
	];

	const isMenuItemActive = (href: string) => localePathname.startsWith(href);

	return (
		<nav
			className={cn(
				"fixed top-0 left-0 z-50 w-full transition-all duration-500",
				!isTop || isDocsPage
					? isHomePage
						? "border-b border-white/10 bg-[#0f0b1d]/85 backdrop-blur-2xl"
						: "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
					: "bg-transparent",
			)}
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
							className="block hover:no-underline active:no-underline"
						>
							{/* mono + white: the wordmark must stay visible on the
							    fixed-dark landing hero in both themes */}
							<Logo mono={isHomePage} className={cn(isHomePage && "text-white")} />
						</LocaleLink>
					</div>

					<div className="hidden flex-1 items-center justify-center lg:flex">
						{menuItems.map((menuItem) => (
							<LocaleLink
								key={menuItem.href}
								href={menuItem.href}
								className={cn(
									"block px-4 py-2 font-medium text-sm rounded-[10px] transition-colors duration-300",
									isHomePage
										? isMenuItemActive(menuItem.href)
											? "font-bold text-white"
											: "text-white/50 hover:bg-white/5 hover:text-white"
										: cn(
												"text-foreground/80",
												isMenuItemActive(menuItem.href) &&
													"font-bold text-foreground",
											),
								)}
								prefetch
							>
								{menuItem.label}
							</LocaleLink>
						))}
					</div>

					<div
						className={cn(
							"flex flex-1 items-center justify-end gap-3",
							isHomePage && "bl-nav-buttons",
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
							onOpenChange={(open: any) => setMobileMenuOpen(open)}
						>
							<SheetTrigger asChild>
								<Button
									className="lg:hidden"
									size="icon"
									variant="secondary"
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
									className={cn(
										"hidden lg:flex",
										isHomePage &&
											"rounded-[12px] bg-white font-bold text-[#1d1d1d] hover:bg-white/90",
									)}
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
										className="hidden px-4 py-2 text-sm font-medium text-white/60 transition-colors duration-300 hover:text-white lg:block"
										prefetch
									>
										{t("common.menu.login")}
									</NextLink>
									<NextLink
										key="signup-home"
										href="/auth/signup"
										className="hidden rounded-[12px] bg-white px-6 py-2.5 text-sm font-bold text-[#1d1d1d] transition-opacity duration-300 hover:opacity-90 lg:block"
									>
										{t("common.menu.signup")}
									</NextLink>
								</>
							) : (
								<Button
									key="login"
									className="hidden lg:flex"
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
