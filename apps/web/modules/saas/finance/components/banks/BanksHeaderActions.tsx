"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";

interface BanksHeaderActionsProps {
	organizationSlug: string;
}

export function BanksHeaderActions({ organizationSlug }: BanksHeaderActionsProps) {
	const t = useTranslations();

	return (
		<Button asChild className="rounded-xl">
			<Link href={`/app/${organizationSlug}/finance/banks/new`}>
				<Plus className="h-4 w-4 me-2" />
				{t("finance.banks.addBank")}
			</Link>
		</Button>
	);
}
