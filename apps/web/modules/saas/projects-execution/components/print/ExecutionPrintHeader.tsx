"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { resolveImageSrc } from "@saas/shared/lib/image-src";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { formatDateShort } from "@shared/lib/formatters";

interface ExecutionPrintHeaderProps {
	projectId: string;
	reportTitle: string;
}

export function ExecutionPrintHeader({
	projectId,
	reportTitle,
}: ExecutionPrintHeaderProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const { data: project } = useQuery({
		queryKey: ["project-print-header", organizationId, projectId],
		queryFn: () =>
			organizationId
				? apiClient.projects.getById({ id: projectId, organizationId })
				: null,
		enabled: !!organizationId,
	});

	const { data: contract } = useQuery({
		queryKey: ["project-contract-print-header", organizationId, projectId],
		queryFn: () =>
			organizationId
				? apiClient.projectContract
						.get({ organizationId, projectId })
						.catch(() => null)
				: null,
		enabled: !!organizationId,
	});

	const startDate = contract?.startDate ?? project?.startDate ?? null;
	const endDate = contract?.endDate ?? project?.endDate ?? null;
	const contractDate = contract?.signedDate ?? project?.startDate ?? null;

	let durationDays: number | null = null;
	if (startDate && endDate) {
		const a = new Date(startDate).getTime();
		const b = new Date(endDate).getTime();
		if (!isNaN(a) && !isNaN(b) && b >= a) {
			durationDays = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
		}
	}

	const contractorName = activeOrganization?.name ?? "";
	const logoUrl = resolveImageSrc(activeOrganization?.logo);

	return (
		<header className="border-b-2 border-foreground pb-3 mb-4 print:pb-2 print:mb-3">
			{/* الصف العلوي: الشعار + اسم المقاول + عنوان التقرير */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					{logoUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={logoUrl}
							alt={contractorName}
							className="h-14 w-14 object-contain rounded"
							crossOrigin="anonymous"
						/>
					) : (
						<div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
							{contractorName?.[0] ?? ""}
						</div>
					)}
					<div>
						<div className="text-lg font-bold text-foreground">
							{contractorName}
						</div>
						<div className="text-xs text-muted-foreground">
							{t("execution.print.contractor")}
						</div>
					</div>
				</div>

				<div className="text-end">
					<div className="text-xl font-bold text-foreground">
						{reportTitle}
					</div>
					<div className="text-xs text-muted-foreground mt-1">
						{t("execution.print.generatedOn")}:{" "}
						{formatDateShort(new Date())}
					</div>
				</div>
			</div>

			{/* الصف السفلي: بيانات المشروع */}
			<div className="mt-3 grid grid-cols-4 gap-3 text-xs">
				<HeaderCell
					label={t("execution.print.projectName")}
					value={project?.name ?? "—"}
				/>
				<HeaderCell
					label={t("execution.print.client")}
					value={project?.clientName ?? "—"}
				/>
				<HeaderCell
					label={t("execution.print.contractDate")}
					value={contractDate ? formatDateShort(contractDate) : "—"}
				/>
				<HeaderCell
					label={t("execution.print.duration")}
					value={
						durationDays !== null
							? `${durationDays} ${t("execution.print.days")}`
							: "—"
					}
				/>
			</div>
		</header>
	);
}

function HeaderCell({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<span className="text-muted-foreground text-[10px] uppercase tracking-wide">
				{label}
			</span>
			<span className="text-foreground font-semibold mt-0.5 truncate">
				{value}
			</span>
		</div>
	);
}
