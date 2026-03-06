"use client";

import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface CreateLeadButtonProps {
	organizationSlug: string;
}

export function CreateLeadButton({ organizationSlug }: CreateLeadButtonProps) {
	const t = useTranslations();

	return (
		<Button asChild size="sm" className="gap-2 rounded-xl">
			<Link href={`/app/${organizationSlug}/pricing/leads/new`}>
				<Plus className="h-4 w-4" />
				{t("pricing.leads.create")}
			</Link>
		</Button>
	);
}
