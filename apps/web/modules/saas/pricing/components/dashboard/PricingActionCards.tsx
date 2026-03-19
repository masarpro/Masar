"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	Calculator,
	FileSpreadsheet,
	Users,
	Plus,
} from "lucide-react";
import { useState } from "react";
import { CreateCostStudyDialog } from "@saas/pricing/components/studies/CreateCostStudyForm";

interface ActionCardsProps {
	organizationSlug: string;
	organizationId: string;
}

interface MainSection {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	browsePath: string;
	createAction: "link" | "dialog";
	createPath?: string;
	iconColor: string;
	bgColor: string;
	hoverBg: string;
	borderColor: string;
}

export function PricingActionCards({ organizationSlug, organizationId }: ActionCardsProps) {
	const t = useTranslations();
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const basePath = `/app/${organizationSlug}/pricing`;

	const mainSections: MainSection[] = [
		{
			id: "studies",
			icon: Calculator,
			browsePath: `${basePath}/studies`,
			createAction: "dialog",
			iconColor: "text-sky-500 dark:text-sky-400",
			bgColor: "bg-sky-50/80 dark:bg-sky-950/30",
			hoverBg: "hover:bg-sky-100 dark:hover:bg-sky-900/50",
			borderColor: "border-sky-200/50 dark:border-sky-800/50",
		},
		{
			id: "quotations",
			icon: FileSpreadsheet,
			browsePath: `${basePath}/quotations`,
			createAction: "link",
			createPath: `${basePath}/quotations/new`,
			iconColor: "text-violet-500 dark:text-violet-400",
			bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
			hoverBg: "hover:bg-violet-100 dark:hover:bg-violet-900/50",
			borderColor: "border-violet-200/50 dark:border-violet-800/50",
		},
		{
			id: "leads",
			icon: Users,
			browsePath: `${basePath}/leads`,
			createAction: "link",
			createPath: `${basePath}/leads/new`,
			iconColor: "text-amber-500 dark:text-amber-400",
			bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
			hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
			borderColor: "border-amber-200/50 dark:border-amber-800/50",
		},
	];

	return (
		<>
			<div className="grid grid-cols-3 gap-4">
				{mainSections.map((section) => {
					const Icon = section.icon;
					return (
						<div
							key={section.id}
							className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-xl"
						>
							{/* Browse Section (Top) */}
							<Link
								href={section.browsePath}
								className={`flex flex-col items-center gap-2 p-4 ${section.bgColor} ${section.hoverBg} transition-colors border-b ${section.borderColor}`}
							>
								<div
									className={`p-3 rounded-xl bg-card/60 ${section.iconColor}`}
								>
									<Icon className="h-6 w-6" />
								</div>
								<span className="text-sm font-medium text-foreground/80 text-center">
									{t(`pricing.dashboard.nav.${section.id}`)}
								</span>
							</Link>

							{/* Create Section (Bottom) */}
							{section.createAction === "link" ? (
								<Link
									href={section.createPath!}
									className="flex items-center justify-center gap-2 p-3 bg-card/50 hover:bg-card/80 transition-colors"
								>
									<Plus className={`h-4 w-4 ${section.iconColor}`} />
									<span className={`text-xs font-medium ${section.iconColor}`}>
										{t(`pricing.dashboard.nav.${section.id}New`)}
									</span>
								</Link>
							) : (
								<button
									type="button"
									onClick={() => setShowCreateDialog(true)}
									className="flex items-center justify-center gap-2 p-3 bg-card/50 hover:bg-card/80 transition-colors w-full"
								>
									<Plus className={`h-4 w-4 ${section.iconColor}`} />
									<span className={`text-xs font-medium ${section.iconColor}`}>
										{t(`pricing.dashboard.nav.${section.id}New`)}
									</span>
								</button>
							)}
						</div>
					);
				})}
			</div>
			<CreateCostStudyDialog
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
			/>
		</>
	);
}
