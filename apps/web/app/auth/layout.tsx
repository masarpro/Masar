import { config } from "@repo/config";
import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { Logo, MasarLogoSvg } from "@shared/components/Logo";
import { Document } from "@shared/components/Document";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { Suspense } from "react";

export default async function AuthLayout({ children }: PropsWithChildren) {
	const [locale, messages, t] = await Promise.all([
		getLocale(),
		getMessages(),
		getTranslations(),
	]);

	return (
		<Document locale={locale}>
			<NextIntlClientProvider messages={messages}>
				<SessionProvider>
					<div className="flex min-h-screen">
						{/* Brand Panel — always dark */}
						<div
							className="dark auth-brand-panel hidden lg:flex lg:w-[55%] relative overflow-hidden"
							style={{ background: "var(--lp-bg)" }}
						>
							{/* Landing page animated background */}
							<div className="landing-light-bg">
								<div className="landing-light-blob" />
							</div>
							<div className="absolute inset-0 overflow-hidden pointer-events-none">
								<div className="landing-orb landing-orb-1" />
								<div className="landing-orb landing-orb-2" />
								<div className="landing-orb landing-orb-3" />
								<div className="landing-orb landing-orb-4" />
								<div className="landing-noise" />
								<div className="landing-grid" />
								<div className="landing-glow-line" />
							</div>
							<div
								className="absolute inset-0 pointer-events-none"
								style={{
									background:
										"radial-gradient(ellipse at center, transparent 40%, var(--lp-bg) 80%)",
								}}
							/>

							{/* Content — centered */}
							<div className="relative z-10 flex flex-col items-center justify-center w-full px-14 text-center">
								<div className="[&_path]:fill-white mb-8">
									<MasarLogoSvg className="h-12 w-auto" />
								</div>

								<h2
									className="text-3xl font-bold mb-4"
									style={{ color: "var(--lp-text)" }}
								>
									{t("auth.brand.headline")}
								</h2>

								<p
									className="text-lg leading-relaxed max-w-md"
									style={{
										color: "var(--lp-text-muted)",
									}}
								>
									{t("auth.brand.subheadline")}
								</p>
							</div>
						</div>

						{/* Divider */}
						<div className="hidden lg:block w-px bg-[#d4d9e0]" />

						{/* Form Area — always light */}
						<div className="auth-form-panel flex-1 flex flex-col">
							<div className="flex items-center justify-between p-4">
								<div className="lg:hidden">
									<Link href="/" className="block">
										<Logo />
									</Link>
								</div>
								<div className="hidden lg:block" />
								<div className="flex items-center gap-2">
									{config.i18n.enabled && (
										<Suspense>
											<LocaleSwitch
												withLocaleInUrl={false}
											/>
										</Suspense>
									)}
								</div>
							</div>

							<div className="flex-1 flex items-center justify-center px-6">
								<main className="w-full max-w-md">
									{children}
								</main>
							</div>

							<div className="py-4 px-6 text-center text-xs text-muted-foreground">
								<Link
									href="/legal/privacy-policy"
									className="hover:underline"
								>
									{t("auth.footer.privacyPolicy")}
								</Link>
								<span className="mx-2 opacity-50">|</span>
								<Link
									href="/legal/terms"
									className="hover:underline"
								>
									{t("auth.footer.terms")}
								</Link>
							</div>
						</div>
					</div>
				</SessionProvider>
			</NextIntlClientProvider>
		</Document>
	);
}
