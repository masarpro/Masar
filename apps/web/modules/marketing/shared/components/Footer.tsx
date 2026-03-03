"use client";

import { LocaleLink, useLocalePathname } from "@i18n/routing";
import { config } from "@repo/config";
import { Logo } from "@shared/components/Logo";
import { cn } from "@ui/lib";

export function Footer() {
	const localePathname = useLocalePathname();
	const isHomePage = localePathname === "/" || localePathname === "";

	return (
		<footer
			className={cn(
				"border-t py-12 text-sm",
				!isHomePage && "border-border/50 bg-muted/50 text-foreground/60",
			)}
			style={
				isHomePage
					? {
							background: "var(--lp-footer-bg)",
							borderColor: "var(--lp-footer-border)",
							color: "var(--lp-footer-text)",
						}
					: undefined
			}
		>
			<div
				className={cn(
					"container flex justify-between items-center flex-wrap gap-6",
					isHomePage ? "max-w-[1200px]" : "grid grid-cols-1 gap-6 lg:grid-cols-3",
				)}
			>
				{isHomePage ? (
					<>
						<div className="flex items-center gap-2.5">
							<div
								className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base font-black text-white"
								style={{
									background:
										"linear-gradient(135deg, #10B981, #06B6D4)",
								}}
							>
								م
							</div>
							<span
								className="text-[17px] font-bold"
								style={{ color: "var(--lp-footer-brand)" }}
							>
								مسار
							</span>
						</div>
						<p className="text-[13px]" style={{ color: "var(--lp-footer-text)" }}>
							© {new Date().getFullYear()} {config.appName} — جميع الحقوق محفوظة
						</p>
					</>
				) : (
					<>
						<div>
							<Logo className="opacity-70 grayscale" />
							<p className="mt-3 text-sm opacity-70">
								© {new Date().getFullYear()} {config.appName}.{" "}
								<a href="https://supastarter.dev">
									Built with supastarter
								</a>
								.
							</p>
						</div>

						<div className="flex flex-col gap-2">
							<LocaleLink
								href="/blog"
								className="block hover:text-foreground transition-colors duration-200"
							>
								Blog
							</LocaleLink>
							<a
								href="#features"
								className="block hover:text-foreground transition-colors duration-200"
							>
								Features
							</a>
							<a
								href="/#pricing"
								className="block hover:text-foreground transition-colors duration-200"
							>
								Pricing
							</a>
						</div>

						<div className="flex flex-col gap-2">
							<LocaleLink
								href="/legal/privacy-policy"
								className="block hover:text-foreground transition-colors duration-200"
							>
								Privacy policy
							</LocaleLink>
							<LocaleLink
								href="/legal/terms"
								className="block hover:text-foreground transition-colors duration-200"
							>
								Terms and conditions
							</LocaleLink>
						</div>
					</>
				)}
			</div>
		</footer>
	);
}
