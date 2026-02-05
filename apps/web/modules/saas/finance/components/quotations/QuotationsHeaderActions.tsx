"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";

interface QuotationsHeaderActionsProps {
	organizationSlug: string;
}

export function QuotationsHeaderActions({ organizationSlug }: QuotationsHeaderActionsProps) {
	const t = useTranslations();

	return (
		<Button asChild className="rounded-xl">
			<Link href={`/app/${organizationSlug}/finance/quotations/new`}>
				<Plus className="h-4 w-4 me-2" />
				{t("finance.quotations.create")}
			</Link>
		</Button>
	);
}
