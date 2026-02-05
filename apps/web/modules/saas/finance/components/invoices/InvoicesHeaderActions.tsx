"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";

interface InvoicesHeaderActionsProps {
	organizationSlug: string;
}

export function InvoicesHeaderActions({ organizationSlug }: InvoicesHeaderActionsProps) {
	const t = useTranslations();

	return (
		<Button asChild className="rounded-xl">
			<Link href={`/app/${organizationSlug}/finance/invoices/new`}>
				<Plus className="h-4 w-4 me-2" />
				{t("finance.invoices.create")}
			</Link>
		</Button>
	);
}
