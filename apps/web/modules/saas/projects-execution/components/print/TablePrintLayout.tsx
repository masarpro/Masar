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
import { formatDateShort } from "@shared/lib/formatters";
import { cn } from "@ui/lib";

interface TablePrintLayoutProps {
	projectId: string;
}

function getDaysLeft(
	plannedEnd: Date | string | null | undefined,
	status: string,
): string {
	if (!plannedEnd || status === "COMPLETED" || status === "CANCELLED") return "-";
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const end = new Date(plannedEnd);
	end.setHours(0, 0, 0, 0);
	const diff = Math.ceil(
		(end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	);
	return String(diff);
}

const STATUS_BADGE: Record<string, string> = {
	PLANNED: "bg-muted text-muted-foreground border-border",
	IN_PROGRESS: "bg-chart-4/15 text-chart-4 border-chart-4",
	COMPLETED: "bg-success/15 text-success border-success",
	DELAYED: "bg-destructive/15 text-destructive border-destructive",
	CANCELLED: "bg-muted text-muted-foreground border-border",
};

export function TablePrintLayout({ projectId }: TablePrintLayoutProps) {
	const t = useTranslations();
	const searchParams = useSearchParams();
	const autoprint = searchParams?.get("autoprint") === "1";
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
	const [autoprinted, setAutoprinted] = useState(false);

	// Toggle body class so @page table-page (A4 portrait) applies on window.print()
	useEffect(() => {
		document.body.dataset.printFormat = "table";
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
	const sorted = [...milestones].sort((a, b) => a.orderIndex - b.orderIndex);
	const dataReady = !!project && !isLoading;

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
			const safeName = (project?.name ?? "milestones").replace(
				/[/\\?%*:|"<>]/g,
				"-",
			);
			await exportToPDF(`milestones-${safeName}`, {
				url: window.location.pathname,
				format: "A4",
				landscape: false,
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

	const statusLabel = (s: string) => {
		const map: Record<string, string> = {
			PLANNED: t("timeline.status.planned"),
			IN_PROGRESS: t("timeline.status.inProgress"),
			COMPLETED: t("timeline.status.completed"),
			DELAYED: t("timeline.status.delayed"),
			CANCELLED: t("execution.milestone.cancelled"),
		};
		return map[s] ?? s;
	};

	return (
		<div className="min-h-screen bg-muted py-6">
			{/* Action bar — hidden when printing */}
			<div className="max-w-[800px] mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
				<h1 className="text-lg font-bold text-foreground">
					{t("execution.print.tableTitle")}
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

			{/* Print area — A4 portrait */}
			<div
				id="execution-table-print-area"
				data-pdf-body
				className="max-w-[800px] mx-auto bg-white shadow-sm border border-border p-6 print:shadow-none print:border-0 print:max-w-none print:p-0"
			>
				<ExecutionPrintHeader
					projectId={projectId}
					reportTitle={t("execution.print.tableTitle")}
				/>

				{!dataReady ? (
					<div className="p-12 text-center text-muted-foreground text-sm">
						{t("common.loading")}
					</div>
				) : sorted.length === 0 ? (
					<div className="p-12 text-center text-muted-foreground text-sm">
						{t("timeline.emptyTitle")}
					</div>
				) : (
					<table
						data-layout-table
						className="w-full text-xs border-collapse"
					>
						<thead>
							<tr className="bg-muted">
								<th className="border border-border px-2 py-2 text-start font-bold w-10">
									#
								</th>
								<th className="border border-border px-2 py-2 text-start font-bold">
									{t("execution.table.name")}
								</th>
								<th className="border border-border px-2 py-2 text-start font-bold w-20">
									{t("execution.table.status")}
								</th>
								<th className="border border-border px-2 py-2 text-start font-bold w-16">
									{t("execution.table.progress")}
								</th>
								<th className="border border-border px-2 py-2 text-start font-bold w-24">
									{t("execution.table.plannedStart")}
								</th>
								<th className="border border-border px-2 py-2 text-start font-bold w-24">
									{t("execution.table.plannedEnd")}
								</th>
								<th className="border border-border px-2 py-2 text-start font-bold w-16">
									{t("execution.table.daysLeft")}
								</th>
							</tr>
						</thead>
						<tbody>
							{sorted.map((m, i) => {
								const progress = Math.max(
									0,
									Math.min(100, Number(m.progress) || 0),
								);
								return (
									<tr key={m.id} className="hover:bg-muted/50">
										<td className="border border-border px-2 py-1.5 text-muted-foreground text-center">
											{i + 1}
										</td>
										<td className="border border-border px-2 py-1.5 font-medium">
											{m.title}
										</td>
										<td className="border border-border px-2 py-1.5">
											<span
												className={cn(
													"inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold",
													STATUS_BADGE[m.status] ?? STATUS_BADGE.PLANNED,
												)}
											>
												{statusLabel(m.status)}
											</span>
										</td>
										<td className="border border-border px-2 py-1.5">
											<div className="flex items-center gap-2">
												<div className="flex-1 h-2 bg-muted rounded overflow-hidden">
													<div
														className="h-full bg-chart-4"
														style={{ width: `${progress}%` }}
													/>
												</div>
												<span className="text-[10px] font-mono w-7 text-end">
													{progress.toFixed(0)}%
												</span>
											</div>
										</td>
										<td className="border border-border px-2 py-1.5 text-muted-foreground">
											{formatDateShort(m.plannedStart)}
										</td>
										<td className="border border-border px-2 py-1.5 text-muted-foreground">
											{formatDateShort(m.plannedEnd)}
										</td>
										<td className="border border-border px-2 py-1.5 text-center text-muted-foreground">
											{getDaysLeft(m.plannedEnd, m.status)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
