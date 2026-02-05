"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";

interface DocumentsHeaderActionsProps {
	organizationSlug: string;
}

export function DocumentsHeaderActions({ organizationSlug }: DocumentsHeaderActionsProps) {
	const t = useTranslations();

	return (
		<Button asChild className="rounded-xl">
			<Link href={`/app/${organizationSlug}/finance/documents/new`}>
				<Plus className="h-4 w-4 me-2" />
				{t("finance.documents.new")}
			</Link>
		</Button>
	);
}
