"use client";

import { LocaleLink, useLocalePathname } from "@i18n/routing";
import { getWhatsAppLink } from "@marketing/faq/faq-data";
import { config } from "@repo/config";
import { Logo } from "@shared/components/Logo";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

export function Footer() {
	const t = useTranslations();
	const localePathname = useLocalePathname();
	const isHomePage = localePathname === "/" || localePathname === "";
	const whatsAppHref = getWhatsAppLink(t("faqPage.contact.title"));

	const columns: {
		title: string;
		links: { label: string; href: string; external?: boolean }[];
	}[] = [
		{
			title: t("footer.product"),
			links: [
				{ label: t("footer.features"), href: "/#features" },
				{ label: t("common.menu.pricing"), href: "/#pricing" },
				{ label: t("common.menu.faq"), href: "/faq" },
				{ label: t("common.menu.docs"), href: "/docs" },
			],
		},
		{
			title: t("footer.support"),
			links: [
				...(config.contactForm.enabled
					? [{ label: t("common.menu.contact"), href: "/contact" }]
					: []),
				...(whatsAppHref
					? [
							{
								label: t("footer.whatsapp"),
								href: whatsAppHref,
								external: true,
							},
						]
					: []),
			],
		},
		{
			title: t("footer.legal"),
			links: [
				{ label: t("footer.privacy"), href: "/legal/privacy-policy" },
				{ label: t("footer.terms"), href: "/legal/terms" },
			],
		},
	];

	const linkClass =
		"block text-[13px] transition-colors duration-200 hover:opacity-100 opacity-70";

	return (
		<footer
			className={cn(
				"border-t py-14 text-sm",
				isHomePage
					? "border-white/10 bg-[#131313] text-white/70"
					: "border-border/50 bg-muted/50 text-foreground/70",
			)}
		>
			<div className={cn("container", isHomePage && "max-w-[1200px]")}>
				<div className="grid grid-cols-2 gap-10 md:grid-cols-5">
					{/* العلامة */}
					<div className="col-span-2">
						{isHomePage ? (
							<div className="flex items-center gap-2.5">
								<div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white font-black text-base text-[#1d1d1d]">
									م
								</div>
								<span className="font-bold text-[17px] text-white">
									مسار
								</span>
							</div>
						) : (
							<Logo className="opacity-70 grayscale" />
						)}
						<p className="mt-4 max-w-xs text-[13px] leading-relaxed opacity-70">
							{t("footer.tagline")}
						</p>
					</div>

					{/* أعمدة الروابط */}
					{columns
						.filter((column) => column.links.length > 0)
						.map((column) => (
							<div key={column.title}>
								<h3 className="mb-4 font-bold text-[13px] opacity-90">
									{column.title}
								</h3>
								<div className="flex flex-col gap-2.5">
									{column.links.map((link) =>
										link.external ? (
											<a
												key={link.href}
												href={link.href}
												target="_blank"
												rel="noopener noreferrer"
												className={linkClass}
											>
												{link.label}
											</a>
										) : (
											<LocaleLink
												key={link.href}
												href={link.href}
												className={linkClass}
											>
												{link.label}
											</LocaleLink>
										),
									)}
								</div>
							</div>
						))}
				</div>

				{/* الحقوق */}
				<div
					className={cn(
						"mt-12 border-t pt-6 text-center",
						isHomePage ? "border-white/10" : "border-border/50",
					)}
				>
					<p className="text-[13px] opacity-60">
						© {new Date().getFullYear()} {config.appName} —{" "}
						{t("footer.rights")}
					</p>
				</div>
			</div>
		</footer>
	);
}
