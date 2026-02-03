"use client";

import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Calendar, MapPin, Building2, Layers, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDate } from "../lib/utils";

interface StudyHeaderCardProps {
	study: {
		id: string;
		name?: string | null;
		customerName?: string | null;
		projectType: string;
		landArea: number;
		buildingArea: number;
		numberOfFloors: number;
		status: string;
		finishingLevel: string;
		hasBasement: boolean;
		createdAt: Date | string;
		updatedAt: Date | string;
	};
	onEdit?: () => void;
}

export function StudyHeaderCard({ study, onEdit }: StudyHeaderCardProps) {
	const t = useTranslations();

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case "completed":
			case "approved":
				return "default";
			case "in_progress":
			case "inProgress":
				return "secondary";
			default:
				return "outline";
		}
	};

	const getStatusLabel = (status: string) => {
		const statusKey = status.replace("_", "");
		return t(`quantities.status.${statusKey}`) || status;
	};

	return (
		<Card className="bg-gradient-to-l from-primary/10 via-primary/5 to-background border-primary/20">
			<CardContent className="p-6">
				<div className="flex flex-col md:flex-row justify-between gap-4">
					<div className="space-y-3">
						<div className="flex items-center gap-3 flex-wrap">
							<h1 className="text-2xl font-bold">
								{study.name || t("quantities.unnamed")}
							</h1>
							<Badge variant={getStatusBadgeVariant(study.status)}>
								{getStatusLabel(study.status)}
							</Badge>
						</div>

						{study.customerName && (
							<p className="text-muted-foreground">{study.customerName}</p>
						)}

						<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<Building2 className="h-4 w-4" />
								{t(`quantities.projectTypes.${study.projectType}`)}
							</span>
							<span className="flex items-center gap-1">
								<MapPin className="h-4 w-4" />
								{study.landArea} {t("quantities.units.m2")}
							</span>
							<span className="flex items-center gap-1">
								<Layers className="h-4 w-4" />
								{study.numberOfFloors} {t("quantities.floors")}
								{study.hasBasement && " + " + t("quantities.form.hasBasement")}
							</span>
							<span className="flex items-center gap-1">
								<Calendar className="h-4 w-4" />
								{t("quantities.lastUpdated")}:{" "}
								{formatDate(study.updatedAt)}
							</span>
						</div>
					</div>

					{onEdit && (
						<div className="flex-shrink-0">
							<Button variant="outline" size="sm" onClick={onEdit}>
								<Pencil className="h-4 w-4 ml-2" />
								{t("quantities.actions.edit")}
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
