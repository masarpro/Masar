"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { exportToPDF, printDocument } from "@saas/shared/lib/pdf-export";
import { apiClient } from "@shared/lib/api-client";
import { Button } from "@ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, Loader2, PrinterIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ExecutionMilestone } from "../../lib/execution-types";
import { ExecutionPrintHeader } from "./ExecutionPrintHeader";
import { GanttPrintCanvas } from "./GanttPrintCanvas";

interface GanttPrintLayoutProps {
	projectId: string;
}

export function GanttPrintLayout({ projectId }: GanttPrintLayoutProps) {
	const t = useTranslations();
	const searchParams = useSearchParams();
	const autoprint = searchParams?.get("autoprint") === "1";
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
	const [autoprinted, setAutoprinted] = useState(false);

	// Toggle body class so @page gantt-page (A3 landscape) applies on window.print()
	useEffect(() => {
		document.body.dataset.printFormat = "gantt";
		return () => {
			delete document.body.dataset.printFormat;
		};
	}, []);

	const { data: project } = useQuery({
		queryKey: ["project-print", organizationId, projectId],
		queryFn: () =>
			organizationId
				? apiClient.projects.getById({ id: projectId, organizationId })
				: null,
		enabled: !!organizationId,
	});

	const { data: milestonesData, isLoading } = useQuery({
		queryKey: ["project-timeline", organizationId, projectId],
		queryFn: () =>
			organizationId
				? apiClient.projectTimeline.listMilestones({
						organizationId,
						projectId,
					})
				: null,
		enabled: !!organizationId,
	});

	const milestones = (milestonesData?.milestones ?? []) as unknown as ExecutionMilestone[];
	const dataReady = !!project && !isLoading;

	// Auto-print when ?autoprint=1 and data is ready
	useEffect(() => {
		if (autoprint && dataReady && !autoprinted) {
			setAutoprinted(true);
			const t = setTimeout(() => printDocument(), 600);
			return () => clearTimeout(t);
		}
	}, [autoprint, dataReady, autoprinted]);

	const handleDownloadPdf = async () => {
		setIsGeneratingPdf(true);
		try {
			const safeName = (project?.name ?? "gantt").replace(/[/\\?%*:|"<>]/g, "-");
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

	return (
		<div className="min-h-screen bg-slate-50 py-6">
			{/* Action bar — hidden when printing */}
			<div className="max-w-[1600px] mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
				<h1 className="text-lg font-bold text-slate-700">
					{t("execution.print.ganttTitle")}
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

			{/* Print area */}
			<div
				id="execution-gantt-print-area"
				data-pdf-body
				className="max-w-[1600px] mx-auto bg-white shadow-sm border border-slate-200 p-4 print:shadow-none print:border-0 print:max-w-none print:p-0"
			>
				<ExecutionPrintHeader
					projectId={projectId}
					reportTitle={t("execution.print.ganttTitle")}
				/>

				{!dataReady ? (
					<div className="p-12 text-center text-slate-500 text-sm">
						{t("common.loading")}
					</div>
				) : (
					<GanttPrintCanvas
						milestones={milestones}
						projectStart={project?.startDate}
						projectEnd={project?.endDate}
					/>
				)}
			</div>
		</div>
	);
}
