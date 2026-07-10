"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const DISMISS_KEY = "lp-announce-dismissed";

export function AnnouncementBar() {
	const t = useTranslations();
	const [hidden, setHidden] = useState(false);

	useEffect(() => {
		if (sessionStorage.getItem(DISMISS_KEY) === "1") {
			setHidden(true);
		}
	}, []);

	if (hidden) {
		return null;
	}

	return (
		<div
			className="lp-announce"
			role="region"
			aria-label={t("hero.announcement.label")}
		>
			<span className="lp-announce-in">
				<span className="lp-announce-chip">
					{t("hero.announcement.chip")}
				</span>
				<span>{t("hero.announcement.text")}</span>
				<Link href="/auth/signup" className="lp-announce-link">
					{t("hero.announcement.cta")}{" "}
					<span className="rtl-flip">→</span>
				</Link>
			</span>
			<button
				type="button"
				className="lp-announce-x"
				aria-label={t("hero.announcement.close")}
				onClick={() => {
					setHidden(true);
					sessionStorage.setItem(DISMISS_KEY, "1");
				}}
			>
				✕
			</button>
		</div>
	);
}
