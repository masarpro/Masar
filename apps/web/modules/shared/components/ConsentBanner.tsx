"use client";

import { useCookieConsent } from "@shared/hooks/cookie-consent";
import { Button } from "@ui/components/button";
import { CookieIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ConsentBanner() {
	const t = useTranslations();
	const { userHasConsented, allowCookies, declineCookies } =
		useCookieConsent();
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	if (userHasConsented) {
		return null;
	}

	return (
		<div className="fixed start-4 bottom-4 max-w-md z-50">
			<div className="flex gap-4 rounded-2xl border bg-card p-4 text-card-foreground shadow-xl">
				<CookieIcon className="block size-6 shrink-0 text-primary/60 mt-1" />
				<div>
					<p className="text-sm leading-normal">
						{t("common.consent.message")}
					</p>
					<div className="mt-4 flex gap-2">
						<Button
							variant="secondary"
							className="flex-1"
							onClick={() => declineCookies()}
						>
							{t("common.consent.decline")}
						</Button>
						<Button
							className="flex-1"
							onClick={() => allowCookies()}
						>
							{t("common.consent.allow")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
