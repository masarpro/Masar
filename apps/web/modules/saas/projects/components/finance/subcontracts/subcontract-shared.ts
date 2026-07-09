import { statusToneClasses } from "@ui/components/status-chip";

export { formatSAR as formatCurrency } from "@shared/lib/formatters";

/** Splits the canonical tone classes into the { bg, text } shape consumed by the subcontract components. */
function toneStyle(status: string): { bg: string; text: string } {
	const classes = statusToneClasses(status).split(" ");
	return {
		bg: classes.filter((c) => c.includes("bg-")).join(" "),
		text: classes.filter((c) => c.includes("text-")).join(" "),
	};
}

export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
	DRAFT: toneStyle("DRAFT"),
	ACTIVE: toneStyle("ACTIVE"),
	SUSPENDED: toneStyle("SUSPENDED"),
	COMPLETED: toneStyle("COMPLETED"),
	TERMINATED: toneStyle("TERMINATED"),
};

export const CO_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
	DRAFT: toneStyle("DRAFT"),
	SUBMITTED: toneStyle("SUBMITTED"),
	APPROVED: toneStyle("APPROVED"),
	REJECTED: toneStyle("REJECTED"),
};

export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"] as const;
