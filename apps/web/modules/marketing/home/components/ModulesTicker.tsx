"use client";

import { useTranslations } from "next-intl";

const ITEMS = [
	{ icon: "🧾", key: "accounting" },
	{ icon: "📐", key: "boq" },
	{ icon: "🏛️", key: "zatca" },
	{ icon: "👷", key: "subcontracts" },
	{ icon: "📸", key: "fieldReports" },
	{ icon: "🔑", key: "ownerPortal" },
	{ icon: "🤖", key: "aiAssistant" },
	{ icon: "💼", key: "payroll" },
	{ icon: "📋", key: "handover" },
	{ icon: "🔒", key: "permissions" },
] as const;

// Botly-flat marquee: bordered pill chips on the page surface.
export function ModulesTicker() {
	const t = useTranslations();

	return (
		<div
			className="bl-ticker border-y-2 bg-background py-4"
			aria-label={t("ticker.aria")}
		>
			<div className="bl-ticker-track">
				{[0, 1].map((dup) =>
					ITEMS.map((item) => (
						<span
							key={`${dup}-${item.key}`}
							className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 bg-card px-4 py-2 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
							dir="auto"
							aria-hidden={dup === 1}
						>
							<span aria-hidden="true">{item.icon}</span>
							{t(`ticker.items.${item.key}`)}
						</span>
					)),
				)}
			</div>
		</div>
	);
}
