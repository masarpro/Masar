"use client";

import { Button } from "@ui/components/button";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function FinanceError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const t = useTranslations();

	useEffect(() => {
		console.error("[Finance Error]", error);
	}, [error]);

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">{t("finance.error.title")}</h2>
				<p className="text-muted-foreground">
					{t("finance.error.description")}
				</p>
			</div>
			<div className="flex gap-3">
				<Button onClick={() => reset()}>
					{t("finance.error.retry")}
				</Button>
				<Button variant="outline" onClick={() => window.history.back()}>
					{t("finance.error.backToFinance")}
				</Button>
			</div>
			{process.env.NODE_ENV === "development" && error.message && (
				<pre className="mt-4 max-w-lg overflow-auto rounded bg-muted p-4 text-start text-xs">
					{error.message}
				</pre>
			)}
		</div>
	);
}
