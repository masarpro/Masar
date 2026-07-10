"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function DashboardPreview() {
	const t = useTranslations();

	return (
		<div className="lp-shot animate-fade-in-delay-4">
			<div className="lp-shot-bar" aria-hidden="true">
				<i />
				<i />
				<i />
				<span>app-masar.com/app</span>
			</div>
			<Image
				src="/images/dashboard-preview.png"
				alt={t("hero.dashboardAlt")}
				width={1586}
				height={992}
				priority
				className="lp-shot-img"
				sizes="(max-width: 1080px) 100vw, 1020px"
			/>
		</div>
	);
}
