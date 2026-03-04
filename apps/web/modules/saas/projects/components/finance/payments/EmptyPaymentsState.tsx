"use client";

import { useTranslations } from "next-intl";
import { Banknote, FileText } from "lucide-react";
import { Button } from "@ui/components/button";
import Link from "next/link";

interface EmptyPaymentsStateProps {
	organizationSlug: string;
	projectId: string;
	showContractLink?: boolean;
}

export function EmptyPaymentsState({
	organizationSlug,
	projectId,
	showContractLink,
}: EmptyPaymentsStateProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 dark:border-slate-700 dark:bg-slate-900/30">
			<Banknote className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
			<p className="mb-2 text-base font-medium text-slate-600 dark:text-slate-400">
				{t("projectPayments.emptyTitle")}
			</p>
			<p className="mb-6 max-w-sm text-center text-sm text-slate-500">
				{t("projectPayments.emptyDescription")}
			</p>
			{showContractLink && (
				<Button asChild variant="outline" size="sm" className="rounded-xl">
					<Link href={`${basePath}/finance/contract`}>
						<FileText className="ml-1.5 h-4 w-4" />
						{t("projectPayments.goToContract")}
					</Link>
				</Button>
			)}
		</div>
	);
}
