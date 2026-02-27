"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Badge } from "@ui/components/badge";
import { BuildingIcon, HomeIcon, WarehouseIcon, WrenchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MILESTONE_TEMPLATES } from "../../lib/milestone-templates";

interface MilestoneTemplateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApply: (template: typeof MILESTONE_TEMPLATES[number]) => void;
	onSkip: () => void;
}

const TEMPLATE_ICONS: Record<string, typeof HomeIcon> = {
	villa: HomeIcon,
	apartment: BuildingIcon,
	warehouse: WarehouseIcon,
	renovation: WrenchIcon,
};

export function MilestoneTemplateDialog({
	open,
	onOpenChange,
	onApply,
	onSkip,
}: MilestoneTemplateDialogProps) {
	const t = useTranslations();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{t("execution.template.title")}</DialogTitle>
					<DialogDescription>
						{t("execution.template.subtitle")}
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3 mt-4">
					{MILESTONE_TEMPLATES.map((template) => {
						const Icon = TEMPLATE_ICONS[template.id] ?? HomeIcon;
						const totalActivities = template.milestones.reduce(
							(sum, m) => sum + m.activities.length,
							0,
						);

						return (
							<Card
								key={template.id}
								className="p-4 cursor-pointer hover:border-primary transition-colors"
								onClick={() => onApply(template)}
							>
								<div className="flex items-start gap-3">
									<div className="p-2 rounded-lg bg-primary/10">
										<Icon className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="font-semibold text-sm">
											{t(`execution.template.${template.nameKey}`)}
										</h4>
										<div className="flex items-center gap-2 mt-1">
											<Badge variant="secondary" className="text-[10px]">
												{t("execution.template.milestones", {
													count: template.milestones.length,
												})}
											</Badge>
											<Badge variant="secondary" className="text-[10px]">
												{t("execution.template.activitiesInTemplate", {
													count: totalActivities,
												})}
											</Badge>
										</div>
									</div>
								</div>
							</Card>
						);
					})}
				</div>

				<div className="flex justify-end mt-4">
					<Button variant="ghost" onClick={onSkip}>
						{t("execution.template.skip")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
