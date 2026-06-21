"use client";

import { OwnerPrintHeader } from "@saas/projects-owner/components/OwnerPrintHeader";
import { exportToPDF, printDocument } from "@saas/shared/lib/pdf-export";
import { formatDateShort } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { DownloadIcon, Loader2, PrinterIcon } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, string> = {
	PLANNED: "bg-slate-100 text-slate-700 border-slate-300",
	IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
	COMPLETED: "bg-green-100 text-green-700 border-green-300",
	DELAYED: "bg-red-100 text-red-700 border-red-300",
	CANCELLED: "bg-gray-100 text-gray-500 border-gray-300",
};

function getDaysLeft(
	plannedEnd: Date | string | null | undefined,
	status: string,
): string {
	if (!plannedEnd || status === "COMPLETED" || status === "CANCELLED")
		return "-";
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const end = new Date(plannedEnd);
	end.setHours(0, 0, 0, 0);
	const diff = Math.ceil(
		(end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	);
	return String(diff);
}

export default function OwnerTablePrintPage() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();
	const searchParams = useSearchParams();
	const autoprint = searchParams?.get("autoprint") === "1";
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
	const [autoprinted, setAutoprinted] = useState(false);

	// Toggle body class so @page table-page (A4 portrait) applies on window.print()
	useEffect(() => {
		document.body.dataset.printFormat = "table";
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

	const sorted = [...(schedule?.milestones ?? [])].sort(
		(a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
	);

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
			const safeName = (schedule?.projectName ?? "milestones").replace(
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
		<div className="min-h-screen bg-slate-50 py-6">
			{/* Action bar — hidden when printing */}
			<div className="mx-auto mb-4 flex max-w-[800px] items-center justify-between px-4 print:hidden">
				<h1 className="font-bold text-lg text-slate-700">
					{t("ownerPortal.schedule.tableTitle")}
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
				className="mx-auto max-w-[800px] border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none"
			>
				<OwnerPrintHeader
					reportTitle={t("ownerPortal.schedule.tableTitle")}
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
				) : sorted.length === 0 ? (
					<div className="p-12 text-center text-slate-500 text-sm">
						{t("ownerPortal.schedule.noMilestones")}
					</div>
				) : (
					<table data-layout-table className="w-full border-collapse text-xs">
						<thead>
							<tr className="bg-slate-100">
								<th className="w-10 border border-slate-300 px-2 py-2 text-start font-bold">
									#
								</th>
								<th className="border border-slate-300 px-2 py-2 text-start font-bold">
									{t("execution.table.name")}
								</th>
								<th className="w-20 border border-slate-300 px-2 py-2 text-start font-bold">
									{t("execution.table.status")}
								</th>
								<th className="w-16 border border-slate-300 px-2 py-2 text-start font-bold">
									{t("execution.table.progress")}
								</th>
								<th className="w-24 border border-slate-300 px-2 py-2 text-start font-bold">
									{t("execution.table.plannedStart")}
								</th>
								<th className="w-24 border border-slate-300 px-2 py-2 text-start font-bold">
									{t("execution.table.plannedEnd")}
								</th>
								<th className="w-16 border border-slate-300 px-2 py-2 text-start font-bold">
									{t("execution.table.daysLeft")}
								</th>
							</tr>
						</thead>
						<tbody>
							{sorted.map((m: any, i: number) => {
								const progress = Math.max(
									0,
									Math.min(100, Number(m.progress) || 0),
								);
								return (
									<tr key={m.id} className="hover:bg-slate-50">
										<td className="border border-slate-300 px-2 py-1.5 text-center text-slate-500">
											{i + 1}
										</td>
										<td className="border border-slate-300 px-2 py-1.5 font-medium">
											{m.title}
										</td>
										<td className="border border-slate-300 px-2 py-1.5">
											<span
												className={cn(
													"inline-block rounded border px-1.5 py-0.5 font-semibold text-[10px]",
													STATUS_BADGE[m.status] ?? STATUS_BADGE.PLANNED,
												)}
											>
												{statusLabel(m.status)}
											</span>
										</td>
										<td className="border border-slate-300 px-2 py-1.5">
											<div className="flex items-center gap-2">
												<div className="h-2 flex-1 overflow-hidden rounded bg-slate-200">
													<div
														className="h-full bg-blue-600"
														style={{ width: `${progress}%` }}
													/>
												</div>
												<span className="w-7 text-end font-mono text-[10px]">
													{progress.toFixed(0)}%
												</span>
											</div>
										</td>
										<td className="border border-slate-300 px-2 py-1.5 text-slate-700">
											{formatDateShort(m.plannedStart)}
										</td>
										<td className="border border-slate-300 px-2 py-1.5 text-slate-700">
											{formatDateShort(m.plannedEnd)}
										</td>
										<td className="border border-slate-300 px-2 py-1.5 text-center text-slate-700">
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
