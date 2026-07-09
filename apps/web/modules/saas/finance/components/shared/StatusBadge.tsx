"use client";

import { StatusChip, type StatusTone } from "@ui/components/status-chip";
import { useTranslations } from "next-intl";

interface StatusBadgeProps {
	status: string;
	type: "quotation" | "invoice" | "document";
}

/** Document *types* aren't workflow statuses — they map to explicit tones. */
const documentTypeTones: Record<string, StatusTone> = {
	LETTER: "info",
	AGREEMENT: "success",
	CERTIFICATE: "purple",
	MEMO: "warning",
	OTHER: "neutral",
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
	const t = useTranslations();

	if (type === "document") {
		return (
			<StatusChip tone={documentTypeTones[status] ?? "neutral"}>
				{t(`finance.documents.types.${status.toLowerCase()}`)}
			</StatusChip>
		);
	}

	const label =
		type === "quotation"
			? t(`finance.quotations.status.${status.toLowerCase()}`)
			: t(`finance.invoices.status.${status.toLowerCase()}`);

	return <StatusChip status={status}>{label}</StatusChip>;
}
