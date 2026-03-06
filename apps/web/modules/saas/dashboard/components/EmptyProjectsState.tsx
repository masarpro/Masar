"use client";

import { Button } from "@ui/components/button";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function EmptyProjectsState({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const t = useTranslations();

	return (
		<Link
			href={`/app/${organizationSlug}/projects/new`}
			className="group block w-full"
		>
			<div className="flex h-[88px] w-full items-center gap-4 rounded-2xl border-2 border-dashed border-green-500 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 px-5 transition-all duration-300 hover:border-green-600 hover:bg-green-50 hover:shadow-lg hover:shadow-green-500/5 hover:scale-[1.01]">
				<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 transition-transform duration-300 group-hover:scale-110">
					<Building2 className="h-6 w-6 text-green-600 animate-pulse" />
				</div>

				<div className="min-w-0 flex-1">
					<h3 className="text-sm font-bold text-foreground">
						{t("dashboard.emptyProjects.title")}
					</h3>
					<p className="text-[11px] text-muted-foreground line-clamp-1">
						{t("dashboard.emptyProjects.description")}
					</p>
				</div>

				<Button
					size="sm"
					className="shrink-0 gap-1.5 transition-transform duration-300 group-hover:scale-105"
					tabIndex={-1}
				>
					<Plus className="h-4 w-4" />
					{t("dashboard.emptyProjects.cta")}
				</Button>
			</div>
		</Link>
	);
}
