"use client";

import { useTranslations } from "next-intl";
import { GANTT_HEADER_HEIGHT } from "../../../lib/gantt-constants";

export function WbsTableHeader() {
	const t = useTranslations();

	return (
		<div
			className="sticky top-0 z-10 flex items-center border-b bg-muted/50 text-xs font-medium text-muted-foreground"
			style={{ height: GANTT_HEADER_HEIGHT }}
		>
			<div className="w-[70px] shrink-0 px-2 text-center">
				{t("execution.advanced.wbs.code")}
			</div>
			<div className="min-w-[200px] flex-1 px-2">
				{t("execution.advanced.wbs.name")}
			</div>
			<div className="w-[70px] shrink-0 px-2 text-center">
				{t("execution.advanced.wbs.duration")}
			</div>
			<div className="w-[90px] shrink-0 px-2">
				{t("execution.advanced.wbs.start")}
			</div>
			<div className="w-[90px] shrink-0 px-2">
				{t("execution.advanced.wbs.end")}
			</div>
			<div className="w-[60px] shrink-0 px-2 text-center">
				{t("execution.advanced.wbs.progress")}
			</div>
		</div>
	);
}
