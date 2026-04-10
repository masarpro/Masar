"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import { Printer, Download, ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { InvoiceDocument } from "./InvoiceDocument";
import { PreviewPageSkeleton } from "@saas/shared/components/skeletons";
import { exportToPDF, printDocument } from "@saas/shared/lib/pdf-export";

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

	// PDF download state
	const [showFilenameDialog, setShowFilenameDialog] = useState(false);
	const [pdfFilename, setPdfFilename] = useState("");
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

	const { data: invoice, isLoading } = useQuery(
		orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	if (isLoading) {
		return <PreviewPageSkeleton />;
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
		printDocument();
	};

	const defaultFilename = `${invoice.invoiceNo}-${invoice.clientName || "invoice"}`;

	const handleDownloadPdf = async (filename: string) => {
		setIsGeneratingPdf(true);
		try {
			await exportToPDF(filename || defaultFilename);
		} catch (error) {
			console.error("PDF generation failed:", error);
			toast.error(t("common.error"));
		} finally {
			setIsGeneratingPdf(false);
			setShowFilenameDialog(false);
		}
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
					<div className="flex gap-2">
						<Button variant="outline" onClick={handlePrint} className="rounded-xl gap-2">
							<Printer className="h-4 w-4" />
							{t("finance.actions.print")}
						</Button>
						<Button
							className="rounded-xl gap-2"
							onClick={() => {
								setPdfFilename(defaultFilename);
								setShowFilenameDialog(true);
							}}
							disabled={isGeneratingPdf}
						>
							{isGeneratingPdf ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Download className="h-4 w-4" />
							)}
							{t("finance.actions.downloadPdf")}
						</Button>
					</div>
				</div>
			</div>

			{/* ─── A4 Invoice Document ─────────────────────────── */}
			<Card id="invoice-print-area" className="rounded-2xl max-w-[210mm] min-h-[297mm] mx-auto print:shadow-none print:rounded-none print:border-none print:min-h-0 print:max-w-none">
				<CardContent className="p-0 print:p-0">
					<InvoiceDocument
						invoice={invoice}
						options={{
							showWatermark: true,
							printMode: true,
							showPayments: true,
						}}
					/>
				</CardContent>
			</Card>

			{/* PDF Filename Dialog */}
			<Dialog open={showFilenameDialog} onOpenChange={setShowFilenameDialog}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.actions.downloadPdf")}</DialogTitle>
						<DialogDescription className="sr-only">
							{t("finance.actions.downloadPdf")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>{t("common.fileName")}</Label>
							<div className="flex items-center gap-2 mt-1.5">
								<Input
									value={pdfFilename}
									onChange={(e: any) => setPdfFilename(e.target.value)}
									placeholder={defaultFilename}
									dir="auto"
									className="rounded-xl"
								/>
								<span className="text-sm text-muted-foreground shrink-0">.pdf</span>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setShowFilenameDialog(false)} className="rounded-xl">
							{t("common.cancel")}
						</Button>
						<Button
							onClick={() => handleDownloadPdf(pdfFilename)}
							disabled={isGeneratingPdf}
							className="rounded-xl"
						>
							{isGeneratingPdf ? (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							) : (
								<Download className="h-4 w-4 me-2" />
							)}
							{t("common.download")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
