"use client";

import { resolveImageSrc } from "@saas/shared/lib/image-src";
import { formatDate } from "@shared/lib/formatters";
import { Building2 } from "lucide-react";
import Image from "next/image";

interface OwnerPrintHeaderProps {
	reportTitle: string;
	projectName?: string | null;
	clientName?: string | null;
	orgName?: string | null;
	orgLogo?: string | null;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
}

/**
 * Lightweight print header for the owner portal print pages.
 * Unlike ExecutionPrintHeader, it takes plain props (no authenticated
 * apiClient / useActiveOrganization) so it works behind the owner token.
 */
export function OwnerPrintHeader({
	reportTitle,
	projectName,
	clientName,
	orgName,
	orgLogo,
	startDate,
	endDate,
}: OwnerPrintHeaderProps) {
	const today = new Date().toLocaleDateString("ar-SA", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="mb-6 border-slate-300 border-b pb-4">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					{resolveImageSrc(orgLogo) ? (
						<Image
							src={resolveImageSrc(orgLogo) as string}
							alt={orgName ?? ""}
							width={48}
							height={48}
							className="rounded-lg object-cover"
							unoptimized
						/>
					) : (
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
							<Building2 className="h-6 w-6 text-slate-500" />
						</div>
					)}
					<div>
						<p className="font-bold text-slate-800 text-sm">{orgName ?? ""}</p>
						<p className="text-slate-500 text-xs">{today}</p>
					</div>
				</div>
				<div className="text-end">
					<h1 className="font-bold text-lg text-slate-800">{reportTitle}</h1>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
				<div>
					<p className="text-slate-400">المشروع</p>
					<p className="font-semibold text-slate-700">{projectName ?? "-"}</p>
				</div>
				<div>
					<p className="text-slate-400">العميل</p>
					<p className="font-semibold text-slate-700">{clientName ?? "-"}</p>
				</div>
				<div>
					<p className="text-slate-400">تاريخ البداية</p>
					<p className="font-semibold text-slate-700">{formatDate(startDate)}</p>
				</div>
				<div>
					<p className="text-slate-400">تاريخ النهاية</p>
					<p className="font-semibold text-slate-700">{formatDate(endDate)}</p>
				</div>
			</div>
		</div>
	);
}
