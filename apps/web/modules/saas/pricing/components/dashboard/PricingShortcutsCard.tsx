"use client";

import { useState } from "react";
import { Calculator, FileSpreadsheet, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreateCostStudyDialog } from "@saas/pricing/components/studies/CreateCostStudyForm";

interface PricingShortcutsCardProps {
	organizationSlug: string;
	organizationId: string;
}

/**
 * Botly-style shortcuts card (same tile language as the home dashboard's
 * QuickActionsGrid): one row per pricing section — icon chip + label (browse)
 * and a trailing "+" (create). Sits beside the recent-documents table on the
 * pricing overview. Studies opens the cost-study dialog; the rest navigate to
 * verified /new routes.
 */
export function PricingShortcutsCard({
	organizationSlug,
	organizationId,
}: PricingShortcutsCardProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing`;
	const [studyDialogOpen, setStudyDialogOpen] = useState(false);

	const shortcuts: Array<{
		key: string;
		icon: LucideIcon;
		label: string;
		createLabel: string;
		browsePath: string;
		createPath?: string;
		onCreateClick?: () => void;
		chip: string;
	}> = [
		{
			key: "studies",
			icon: Calculator,
			label: t("pricing.dashboard.nav.studies"),
			createLabel: t("pricing.dashboard.nav.studiesNew"),
			browsePath: `${basePath}/studies`,
			onCreateClick: () => setStudyDialogOpen(true),
			chip: "bg-chart-4/15 text-chart-4",
		},
		{
			key: "quotations",
			icon: FileSpreadsheet,
			label: t("pricing.dashboard.nav.quotations"),
			createLabel: t("pricing.dashboard.nav.quotationsNew"),
			browsePath: `${basePath}/quotations`,
			createPath: `${basePath}/quotations/new`,
			chip: "bg-chart-3/20 text-chart-3",
		},
		{
			key: "leads",
			icon: Users,
			label: t("pricing.dashboard.nav.leads"),
			createLabel: t("pricing.dashboard.nav.leadsNew"),
			browsePath: `${basePath}/leads`,
			createPath: `${basePath}/leads/new`,
			chip: "bg-primary/10 text-primary",
		},
	];

	const createChip =
		"flex size-7 shrink-0 items-center justify-center rounded-lg border-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground";

	return (
		<>
			<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 bg-card p-5">
				<p className="mb-3 shrink-0 text-base font-semibold text-card-foreground">
					{t("dashboard.quickActions")}
				</p>

				<div className="flex min-h-0 flex-1 flex-col gap-2">
					{shortcuts.map((s) => {
						const Icon = s.icon;
						return (
							<div
								key={s.key}
								className="flex min-h-0 flex-1 items-center gap-2 rounded-2xl border-2 p-2 transition-colors hover:border-primary/20"
							>
								<Link
									href={s.browsePath}
									className="flex min-w-0 flex-1 items-center gap-2.5"
									title={s.label}
								>
									<span
										className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${s.chip}`}
									>
										<Icon className="size-4.5" />
									</span>
									<span className="truncate text-sm font-semibold text-card-foreground">
										{s.label}
									</span>
								</Link>
								{s.onCreateClick ? (
									<button
										type="button"
										onClick={s.onCreateClick}
										className={createChip}
										aria-label={s.createLabel}
										title={s.createLabel}
									>
										<Plus className="size-4" />
									</button>
								) : (
									<Link
										href={s.createPath ?? s.browsePath}
										className={createChip}
										aria-label={s.createLabel}
										title={s.createLabel}
									>
										<Plus className="size-4" />
									</Link>
								)}
							</div>
						);
					})}
				</div>
			</div>

			<CreateCostStudyDialog
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				open={studyDialogOpen}
				onOpenChange={setStudyDialogOpen}
			/>
		</>
	);
}
