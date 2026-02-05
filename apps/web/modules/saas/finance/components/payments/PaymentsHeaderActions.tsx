"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";

interface PaymentsHeaderActionsProps {
	organizationSlug: string;
}

export function PaymentsHeaderActions({ organizationSlug }: PaymentsHeaderActionsProps) {
	const t = useTranslations();

	return (
		<Button asChild className="rounded-xl">
			<Link href={`/app/${organizationSlug}/finance/payments/new`}>
				<Plus className="h-4 w-4 me-2" />
				{t("finance.payments.new")}
			</Link>
		</Button>
	);
}
