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

export function ModulesTicker() {
	const t = useTranslations();

	return (
		<div className="lp-ticker" aria-label={t("ticker.aria")}>
			<div className="lp-ticker-track">
				{[0, 1].map((dup) =>
					ITEMS.map((item) => (
						<span
							key={`${dup}-${item.key}`}
							className="lp-tk"
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
