"use client";

import { useTranslations } from "next-intl";

const ROLE_KEYS = ["manager", "engineer", "accountant", "supervisor"] as const;

export function RolesStrip() {
	const t = useTranslations("landingRoles");

	return (
		<div className="mas-roles py-12 md:py-14 px-6">
			<div className="mas-rv max-w-[1180px] mx-auto flex items-center justify-between gap-7 flex-wrap">
				<div>
					<h3
						className="text-[19px] font-extrabold"
						style={{ color: "var(--mas-ink)" }}
					>
						{t("title")}
					</h3>
					<p
						className="text-[14px] max-w-[460px] mt-1 leading-[1.8]"
						style={{ color: "var(--mas-muted)" }}
					>
						{t("description")}
					</p>
				</div>
				<div className="mas-role-chips">
					{ROLE_KEYS.map((key) => (
						<span key={key}>
							<b aria-hidden="true">⊢</b>
							{t(`roles.${key}`)}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
