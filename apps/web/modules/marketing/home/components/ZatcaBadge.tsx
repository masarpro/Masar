"use client";

import { useTranslations } from "next-intl";

export function ZatcaBadge() {
	const t = useTranslations();

	return (
		<section
			className="px-6 pb-24 md:pb-28"
			style={{ background: "var(--mas-bg)" }}
		>
			<div className="mas-zatca-band mas-rv max-w-[860px] mx-auto">
				<span className="seal" aria-hidden="true">
					🏛️
				</span>
				<span>
					<b>{t("landingZatca.title")}:</b>{" "}
					{t("landingZatca.description")}
				</span>
				<span className="mas-zatca-chip shrink-0">
					<span className="mas-zatca-dot" aria-hidden="true" />
					{t("landingZatca.badge")}
				</span>
			</div>
		</section>
	);
}
