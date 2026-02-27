"use client";

import { Button } from "@ui/components/button";
import { MonitorIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

export function MobileGanttFallback() {
	const t = useTranslations();
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const projectId = params.projectId as string;

	return (
		<div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[60vh]">
			<MonitorIcon className="h-12 w-12 text-muted-foreground" />
			<h2 className="text-lg font-semibold">
				{t("execution.advanced.mobile.title")}
			</h2>
			<p className="text-muted-foreground max-w-md">
				{t("execution.advanced.mobile.description")}
			</p>
			<Button asChild>
				<Link
					href={`/app/${organizationSlug}/projects/${projectId}/execution`}
				>
					{t("execution.advanced.mobile.switchToSimple")}
				</Link>
			</Button>
		</div>
	);
}
