"use client";

import { useTranslations } from "next-intl";

const stepKeys = ["1", "2", "3"] as const;

export function HowItWorks() {
	const t = useTranslations();

	return (
		<section
			id="how"
			className="py-24 md:py-32 px-6"
			style={{ background: "var(--mas-bg)" }}
		>
			<div className="max-w-[1000px] mx-auto">
				{/* Header */}
				<div className="mas-sec-head mas-rv max-w-[660px] mx-auto text-center mb-12 md:mb-14">
					<span className="mas-dim">{t("howItWorks.label")}</span>
					<h2>{t("howItWorks.title")}</h2>
				</div>

				{/* One bordered grid, three cells */}
				<div className="mas-steps-grid mas-rv">
					{stepKeys.map((key, i) => (
						<div className="mas-step" key={key}>
							<span className="n">0{i + 1}</span>
							<h3>{t(`howItWorks.steps.${key}.title`)}</h3>
							<p>{t(`howItWorks.steps.${key}.description`)}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
