"use client";

import { Button } from "@ui/components/button";
import { GanttChartIcon, LayoutListIcon, TableIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ViewMode } from "../../lib/execution-types";

interface ExecutionViewToggleProps {
	view: ViewMode;
	onViewChange: (view: ViewMode) => void;
}

export function ExecutionViewToggle({
	view,
	onViewChange,
}: ExecutionViewToggleProps) {
	const t = useTranslations();
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const projectId = params.projectId as string;

	return (
		<div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
			<Button
				variant={view === "cards" ? "secondary" : "ghost"}
				size="sm"
				onClick={() => onViewChange("cards")}
				className="gap-1.5"
			>
				<LayoutListIcon className="h-4 w-4" />
				{t("execution.viewCards")}
			</Button>
			<Button
				variant={view === "table" ? "secondary" : "ghost"}
				size="sm"
				onClick={() => onViewChange("table")}
				className="gap-1.5"
			>
				<TableIcon className="h-4 w-4" />
				{t("execution.viewTable")}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				className="gap-1.5"
				asChild
			>
				<Link
					href={`/app/${organizationSlug}/projects/${projectId}/execution/advanced`}
				>
					<GanttChartIcon className="h-4 w-4" />
					{t("execution.advancedMode")}
				</Link>
			</Button>
		</div>
	);
}
