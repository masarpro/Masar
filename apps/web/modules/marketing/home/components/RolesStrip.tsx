"use client";

import { useTranslations } from "next-intl";

const ROLE_KEYS = ["manager", "engineer", "accountant", "supervisor"] as const;

// Botly widget band: one flat card with role chips.
export function RolesStrip() {
	const t = useTranslations("landingRoles");

	return (
		<div className="bg-background px-6 py-12 md:py-14">
			<div className="bl-rv mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-7 rounded-[var(--botly-radius-card)] border-2 bg-card p-6 md:p-8">
				<div>
					<h3 className="text-[19px] font-extrabold text-foreground">
						{t("title")}
					</h3>
					<p className="mt-1 max-w-[460px] text-[14px] leading-[1.8] text-muted-foreground">
						{t("description")}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{ROLE_KEYS.map((key) => (
						<span
							key={key}
							className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-[13px] font-semibold text-muted-foreground"
						>
							<b className="text-chart-4" aria-hidden="true">
								⊢
							</b>
							{t(`roles.${key}`)}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
