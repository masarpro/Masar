"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LockIcon } from "lucide-react";

export function UpgradeDialog({
	open,
	onOpenChange,
	reasonAr,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reasonAr: string;
}) {
	const t = useTranslations();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md text-center" dir="rtl">
				<DialogHeader className="items-center">
					<div className="flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-2">
						<LockIcon className="size-6 text-amber-600 dark:text-amber-400" />
					</div>
					<DialogTitle className="text-xl">
						{t("featureGate.title")}
					</DialogTitle>
					<DialogDescription className="text-base mt-2">
						{reasonAr}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex-col gap-2 sm:flex-col mt-4">
					<Button asChild size="lg" className="w-full">
						<Link href="/choose-plan">
							{t("featureGate.upgradeCta")}
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onOpenChange(false)}
						className="w-full"
					>
						{t("featureGate.later")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
