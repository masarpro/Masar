"use client";

import { Badge } from "@ui/components/badge";
import { useLocale, useTranslations } from "next-intl";
import { formatDateShort } from "../../lib/gantt-utils";

interface PlannedVsActualItem {
	activityId: string;
	activityTitle: string;
	plannedStart: string | Date | null;
	plannedEnd: string | Date | null;
	actualStart: string | Date | null;
	actualEnd: string | Date | null;
	varianceDays: number;
}

interface PlannedVsActualTableProps {
	data: PlannedVsActualItem[];
}

export function PlannedVsActualTable({ data }: PlannedVsActualTableProps) {
	const t = useTranslations();
	const locale = useLocale();

	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center h-[200px] text-muted-foreground">
				{t("execution.analysis.plannedVsActual.noData")}
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg border">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b bg-muted/50">
						<th className="px-3 py-2 text-start font-medium">
							{t("execution.analysis.plannedVsActual.activity")}
						</th>
						<th className="px-3 py-2 text-start font-medium">
							{t("execution.analysis.plannedVsActual.plannedStart")}
						</th>
						<th className="px-3 py-2 text-start font-medium">
							{t("execution.analysis.plannedVsActual.plannedEnd")}
						</th>
						<th className="px-3 py-2 text-start font-medium">
							{t("execution.analysis.plannedVsActual.actualStart")}
						</th>
						<th className="px-3 py-2 text-start font-medium">
							{t("execution.analysis.plannedVsActual.actualEnd")}
						</th>
						<th className="px-3 py-2 text-center font-medium">
							{t("execution.analysis.plannedVsActual.variance")}
						</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item) => (
						<tr key={item.activityId} className="border-b">
							<td className="px-3 py-2 font-medium">
								{item.activityTitle}
							</td>
							<td className="px-3 py-2">
								{formatDateShort(item.plannedStart, locale)}
							</td>
							<td className="px-3 py-2">
								{formatDateShort(item.plannedEnd, locale)}
							</td>
							<td className="px-3 py-2">
								{formatDateShort(item.actualStart, locale)}
							</td>
							<td className="px-3 py-2">
								{formatDateShort(item.actualEnd, locale)}
							</td>
							<td className="px-3 py-2 text-center">
								<Badge
									variant={
										item.varianceDays > 0
											? "destructive"
											: item.varianceDays < 0
												? "default"
												: "secondary"
									}
									className="text-[10px]"
								>
									{item.varianceDays > 0 ? "+" : ""}
									{item.varianceDays}d
								</Badge>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
