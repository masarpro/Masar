"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { ShieldXIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function UpgradePrompt() {
	const t = useTranslations();

	return (
		<div className="flex min-h-[60vh] items-center justify-center p-8">
			<Card className="max-w-md p-8 text-center">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
					<ShieldXIcon className="size-8 text-destructive" />
				</div>
				<h2 className="mb-2 font-bold text-xl">
					{t("subscription.suspended")}
				</h2>
				<p className="mb-6 text-muted-foreground">
					{t("subscription.suspendedDescription")}
				</p>
				<div className="flex flex-col gap-2">
					<Button asChild>
						<Link href="/choose-plan">
							{t("subscription.upgradeNow")}
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href="mailto:support@masar.sa">
							{t("subscription.contactSupport")}
						</Link>
					</Button>
				</div>
			</Card>
		</div>
	);
}
