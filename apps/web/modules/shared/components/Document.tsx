import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { cn } from "@ui/lib";
import { Cairo, Inter, Libre_Baskerville } from "next/font/google";
import { cookies } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

// RTL locales
const RTL_LOCALES = ["ar", "he", "fa", "ur"];

const sansFont = Inter({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-sans",
});

const serifFont = Libre_Baskerville({
	weight: ["400", "700"],
	subsets: ["latin"],
	variable: "--font-serif",
});

const arabicSansFont = Cairo({
	weight: ["400", "500", "600", "700"],
	subsets: ["arabic", "latin"],
	variable: "--font-arabic-sans",
});

export async function Document({
	children,
	locale,
}: PropsWithChildren<{ locale: string }>) {
	const cookieStore = await cookies();
	const consentCookie = cookieStore.get("consent");
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
				{/* Saudi Riyal Currency Symbol Font */}
				<link
					rel="stylesheet"
					href="https://unpkg.com/saudi-riyal-symbol@latest/dist/saudi-riyal-symbol.min.css"
					crossOrigin="anonymous"
				/>
			</head>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
			>
				<NuqsAdapter>
					<ConsentProvider
						initialConsent={consentCookie?.value === "true"}
					>
						<ClientProviders>{children}</ClientProviders>
					</ConsentProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
