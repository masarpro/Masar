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
			className="group block"
		>
			<div className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 px-6 py-12 text-center transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] sm:py-16">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
					<Building2 className="h-8 w-8 text-primary animate-pulse" />
				</div>

				<div className="space-y-2">
					<h3 className="text-lg font-bold text-foreground">
						{t("dashboard.emptyProjects.title")}
					</h3>
					<p className="mx-auto max-w-sm text-sm text-muted-foreground">
						{t("dashboard.emptyProjects.description")}
					</p>
				</div>

				<Button
					size="lg"
					className="mt-2 gap-2 transition-transform duration-300 group-hover:scale-105"
					tabIndex={-1}
				>
					<Plus className="h-5 w-5" />
					{t("dashboard.emptyProjects.cta")}
				</Button>
			</div>
		</Link>
	);
}
