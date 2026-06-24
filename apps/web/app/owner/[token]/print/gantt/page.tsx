"use client";

import { GanttPrintCanvas } from "@saas/projects-execution/components/print/GanttPrintCanvas";
import { OwnerPrintHeader } from "@saas/projects-owner/components/OwnerPrintHeader";
import { exportToPDF, printDocument } from "@saas/shared/lib/pdf-export";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { DownloadIcon, Loader2, PrinterIcon } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function OwnerGanttPrintPage() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();
	const searchParams = useSearchParams();
	const autoprint = searchParams?.get("autoprint") === "1";
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
	const [autoprinted, setAutoprinted] = useState(false);

	// Toggle body class so @page gantt-page (A3 landscape) applies on window.print()
	useEffect(() => {
		document.body.dataset.printFormat = "gantt";
		return () => {
			delete document.body.dataset.printFormat;
		};
	}, []);

	const { data: schedule, isLoading } = useQuery(
		orpc.projectOwner.portal.getSchedule.queryOptions({ input: { token } }),
	) as { data: any; isLoading: boolean };
	const { data: summary } = useQuery(
		orpc.projectOwner.portal.getSummary.queryOptions({ input: { token } }),
	) as { data: any };

	const dataReady = !!schedule && !isLoading;

	useEffect(() => {
		if (autoprint && dataReady && !autoprinted) {
			setAutoprinted(true);
			const id = setTimeout(() => printDocument(), 600);
			return () => clearTimeout(id);
		}
	}, [autoprint, dataReady, autoprinted]);

	const handleDownloadPdf = async () => {
		setIsGeneratingPdf(true);
		try {
			const safeName = (schedule?.projectName ?? "gantt").replace(
				/[/\\?%*:|"<>]/g,
				"-",
			);
			await exportToPDF(`gantt-${safeName}`, {
				url: window.location.pathname,
				format: "A3",
				landscape: true,
			});
			toast.success(t("execution.print.pdfReady"));
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("execution.print.pdfFailed"),
			);
		} finally {
			setIsGeneratingPdf(false);
		}
	};

	const milestones = (schedule?.milestones ?? []).map((m: any) => ({
		id: m.id,
		title: m.title,
		plannedStart: m.plannedStart,
		plannedEnd: m.plannedEnd,
		status: m.status,
		progress: Number(m.progress) || 0,
		isCritical: m.isCritical,
	}));

	return (
		<div className="min-h-screen bg-slate-50 py-6" dir="rtl">
			{/* Action bar — hidden when printing */}
			<div className="mx-auto mb-4 flex max-w-[1600px] items-center justify-between px-4 print:hidden">
				<h1 className="font-bold text-lg text-slate-700">
					{t("ownerPortal.schedule.ganttTitle")}
				</h1>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => printDocument()}
						disabled={!dataReady}
					>
						<PrinterIcon className="h-4 w-4 me-2" />
						{t("common.print")}
					</Button>
					<Button
						size="sm"
						onClick={handleDownloadPdf}
						disabled={!dataReady || isGeneratingPdf}
					>
						{isGeneratingPdf ? (
							<Loader2 className="h-4 w-4 me-2 animate-spin" />
						) : (
							<DownloadIcon className="h-4 w-4 me-2" />
						)}
						{t("execution.print.downloadPdf")}
					</Button>
				</div>
			</div>

			{/* Print area — A3 landscape */}
			<div
				id="execution-gantt-print-area"
				data-pdf-body
				className="mx-auto max-w-[1600px] border border-slate-200 bg-white p-4 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none"
			>
				<OwnerPrintHeader
					reportTitle={t("ownerPortal.schedule.ganttTitle")}
					projectName={schedule?.projectName ?? summary?.project?.name}
					clientName={summary?.project?.clientName}
					orgName={summary?.organization?.name}
					orgLogo={summary?.organization?.logo}
					startDate={schedule?.startDate}
					endDate={schedule?.endDate}
				/>

				{!dataReady ? (
					<div className="p-12 text-center text-slate-500 text-sm">
						{t("common.loading")}
					</div>
				) : (
					<GanttPrintCanvas
						milestones={milestones}
						projectStart={schedule?.startDate}
						projectEnd={schedule?.endDate}
					/>
				)}
			</div>
		</div>
	);
}
