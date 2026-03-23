"use client";

interface ReportPrintHeaderProps {
	reportTitle: string;
	organizationName?: string;
	dateRange?: string;
}

export function ReportPrintHeader({
	reportTitle,
	organizationName,
	dateRange,
}: ReportPrintHeaderProps) {
	return (
		<div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-300">
			{organizationName && (
				<p className="text-lg font-bold">{organizationName}</p>
			)}
			<h1 className="text-xl font-bold mt-1">{reportTitle}</h1>
			{dateRange && (
				<p className="text-sm text-slate-500 mt-1">{dateRange}</p>
			)}
			<p className="text-xs text-slate-400 mt-1">
				{new Date().toLocaleDateString("en-SA")}
			</p>
		</div>
	);
}
