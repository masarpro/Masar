"use client";

import { useTranslations } from "next-intl";

interface StatusBadgeProps {
	status: string;
	type: "quotation" | "invoice" | "document";
}

const quotationStatusConfig: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	SENT: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	VIEWED: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
	ACCEPTED: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
	REJECTED: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-600 dark:text-red-400" },
	EXPIRED: { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-600 dark:text-amber-400" },
	CONVERTED: { bg: "bg-teal-100 dark:bg-teal-900/50", text: "text-teal-600 dark:text-teal-400" },
};

const invoiceStatusConfig: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	ISSUED: { bg: "bg-teal-100 dark:bg-teal-900/50", text: "text-teal-600 dark:text-teal-400" },
	SENT: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	VIEWED: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
	PARTIALLY_PAID: { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-600 dark:text-amber-400" },
	PAID: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
	OVERDUE: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-600 dark:text-red-400" },
	CANCELLED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-500" },
	CREDIT_NOTE: { bg: "bg-pink-100 dark:bg-pink-900/50", text: "text-pink-600 dark:text-pink-400" },
};

const documentStatusConfig: Record<string, { bg: string; text: string }> = {
	LETTER: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	AGREEMENT: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
	CERTIFICATE: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
	MEMO: { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-600 dark:text-amber-400" },
	OTHER: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
	const t = useTranslations();

	let config: { bg: string; text: string };
	let label: string;

	switch (type) {
		case "quotation":
			config = quotationStatusConfig[status] ?? quotationStatusConfig.DRAFT;
			label = t(`finance.quotations.status.${status.toLowerCase()}`);
			break;
		case "invoice":
			config = invoiceStatusConfig[status] ?? invoiceStatusConfig.DRAFT;
			label = t(`finance.invoices.status.${status.toLowerCase()}`);
			break;
		case "document":
			config = documentStatusConfig[status] ?? documentStatusConfig.OTHER;
			label = t(`finance.documents.types.${status.toLowerCase()}`);
			break;
	}

	const isCancelled = type === "invoice" && status === "CANCELLED";

	return (
		<span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text} ${isCancelled ? "line-through" : ""}`}>
			{label}
		</span>
	);
}
