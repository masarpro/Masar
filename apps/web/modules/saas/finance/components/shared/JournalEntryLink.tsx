"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FileText } from "lucide-react";

interface JournalEntryLinkProps {
	organizationId: string;
	organizationSlug: string;
	referenceType: string;
	referenceId: string;
}

export function JournalEntryLink({
	organizationId,
	organizationSlug,
	referenceType,
	referenceId,
}: JournalEntryLinkProps) {
	const t = useTranslations();

	const { data: entry } = useQuery(
		orpc.accounting.journal.findByReference.queryOptions({
			input: { organizationId, referenceType, referenceId },
		}),
	);

	if (!entry) return null;

	return (
		<Link
			href={`/app/${organizationSlug}/finance/journal-entries/${entry.id}`}
			className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
		>
			<FileText className="h-3 w-3" />
			{t("finance.accounting.viewJournalEntry")} ({entry.entryNo})
		</Link>
	);
}
