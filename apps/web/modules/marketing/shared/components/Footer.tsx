import { LocaleLink } from "@i18n/routing";
import { config } from "@repo/config";
import { Logo } from "@shared/components/Logo";

export function Footer() {
	return (
		<footer className="border-t border-border/50 bg-muted/50 py-8 text-foreground/60 text-sm">
			<div className="container grid grid-cols-1 gap-6 lg:grid-cols-3">
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
					<LocaleLink href="/blog" className="block hover:text-foreground transition-colors duration-200">
						Blog
					</LocaleLink>

					<a href="#features" className="block hover:text-foreground transition-colors duration-200">
						Features
					</a>

					<a href="/#pricing" className="block hover:text-foreground transition-colors duration-200">
						Pricing
					</a>
				</div>

				<div className="flex flex-col gap-2">
					<LocaleLink href="/legal/privacy-policy" className="block hover:text-foreground transition-colors duration-200">
						Privacy policy
					</LocaleLink>

					<LocaleLink href="/legal/terms" className="block hover:text-foreground transition-colors duration-200">
						Terms and conditions
					</LocaleLink>
				</div>
			</div>
		</footer>
	);
}
