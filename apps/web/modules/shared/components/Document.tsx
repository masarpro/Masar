import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { SkipNavLink } from "@ui/components/skip-nav";
import { cn } from "@ui/lib";
import { Cairo, Inter, Libre_Baskerville } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

// RTL locales
const RTL_LOCALES = ["ar", "he", "fa", "ur"];

const sansFont = Inter({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

const serifFont = Libre_Baskerville({
	weight: ["400", "700"],
	subsets: ["latin"],
	variable: "--font-serif",
	display: "swap",
});

const arabicSansFont = Cairo({
	weight: ["400", "500", "600", "700"],
	subsets: ["arabic", "latin"],
	variable: "--font-arabic-sans",
	display: "swap",
});

// NOTE: deliberately NOT async and NOT reading cookies() here — that single
// cookie read forced every marketing page into dynamic rendering (no CDN
// cache, full SSR per visitor). Consent is now read client-side by
// ConsentProvider's lazy initializer.
export function Document({
	children,
	locale,
}: PropsWithChildren<{ locale: string }>) {
	const isRtl = RTL_LOCALES.includes(locale);

	return (
		<html
			lang={locale}
			dir={isRtl ? "rtl" : "ltr"}
			suppressHydrationWarning
			className={cn(
				sansFont.variable,
				serifFont.variable,
				arabicSansFont.variable,
			)}
		>
			<head>
				{/* viewport-fit=cover enables safe-area-inset-* env() values for Capacitor */}
				<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
				{/* Saudi Riyal Currency Symbol Font - pinned version for performance */}
				<link rel="dns-prefetch" href="https://unpkg.com" />
				<link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://unpkg.com/saudi-riyal-symbol@1.0.1/dist/saudi-riyal-symbol.min.css"
					crossOrigin="anonymous"
				/>
				{/* Inline script to detect Capacitor and add body class before first paint */}
				<script
					dangerouslySetInnerHTML={{
						__html: `if(window.Capacitor&&window.Capacitor.isNativePlatform()){document.addEventListener("DOMContentLoaded",function(){document.body.classList.add("capacitor-app")})}`,
					}}
				/>
			</head>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
			>
				<SkipNavLink />
				<NuqsAdapter>
					<ConsentProvider>
						<ClientProviders>{children}</ClientProviders>
					</ConsentProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
