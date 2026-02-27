"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Printer, ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { InvoiceDocument } from "./InvoiceDocument";

interface InvoicePreviewProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

export function InvoicePreview({
	organizationId,
	organizationSlug,
	invoiceId,
}: InvoicePreviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	const { data: invoice, isLoading } = useQuery(
		orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	if (isLoading) {
		return (
			<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
				<div className="flex items-center justify-center py-20">
					<div className="relative">
						<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
						<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				</div>
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
				<div className="text-center py-20">
					<p className="text-slate-500 dark:text-slate-400">
						{t("finance.invoices.notFound")}
					</p>
				</div>
			</div>
		);
	}

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
			{/* ─── Sticky Header ────────────────────────────────── */}
			<div className="sticky top-0 z-20 py-3 px-4 mb-6 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50 print:hidden">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link href={`${basePath}/${invoiceId}`}>
							<Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800">
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<div className="flex items-center gap-1.5 text-sm">
							<Link href={`/app/${organizationSlug}/finance`} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
								{t("finance.title")}
							</Link>
							<ChevronLeft className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
							<Link href={basePath} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
								{t("finance.invoices.title")}
							</Link>
							<ChevronLeft className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
							<Link href={`${basePath}/${invoiceId}`} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
								{invoice.invoiceNo}
							</Link>
							<ChevronLeft className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
							<span className="text-slate-700 dark:text-slate-200 font-medium">
								{t("finance.invoices.preview")}
							</span>
						</div>
					</div>
					<Button variant="outline" onClick={handlePrint} className="rounded-xl gap-2">
						<Printer className="h-4 w-4" />
						{t("finance.actions.print")}
					</Button>
				</div>
			</div>

			{/* ─── A4 Invoice Document ─────────────────────────── */}
			<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] max-w-[210mm] mx-auto print:shadow-none print:rounded-none print:border-none print:max-w-none print:bg-white">
				<div className="min-h-[297mm] print:text-black">
					<InvoiceDocument
						invoice={invoice}
						options={{
							showWatermark: false,
							printMode: true,
							showPayments: true,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
