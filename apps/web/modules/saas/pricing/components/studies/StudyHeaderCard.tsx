"use client";

import { Card, CardContent } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Calendar,
	MapPin,
	Building2,
	Layers,
	ArrowRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { formatDate } from "../../lib/utils";

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
	organizationSlug: string;
	onEdit?: () => void;
}

export function StudyHeaderCard({
	study,
	organizationSlug,
	onEdit,
}: StudyHeaderCardProps) {
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
		return t(`pricing.studies.status.${statusKey}`) || status;
	};

	const studiesListUrl = `/app/${organizationSlug}/pricing/studies`;

	return (
		<Card className="bg-gradient-to-l from-primary/10 via-primary/5 to-background border-primary/20">
			<CardContent className="p-5">
				<div className="flex flex-col gap-4">
					{/* Row 1: Back button + Study name + Status */}
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3 flex-wrap min-w-0">
							<Link href={studiesListUrl}>
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8 shrink-0"
								>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<div className="min-w-0">
								<h1 className="text-xl font-bold truncate">
									{study.name || t("pricing.studies.unnamed")}
								</h1>
								<p className="text-sm text-muted-foreground truncate">
									الأعمال الإنشائية — حساب كميات الخرسانة والحديد للعناصر الإنشائية
								</p>
							</div>
							<Badge variant={getStatusBadgeVariant(study.status)}>
								{getStatusLabel(study.status)}
							</Badge>
						</div>
					</div>

					{/* Row 3: Project details */}
					<div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Building2 className="h-3.5 w-3.5" />
							{t(`pricing.studies.projectTypes.${study.projectType}`)}
						</span>
						<span className="flex items-center gap-1">
							<MapPin className="h-3.5 w-3.5" />
							{study.landArea} {t("pricing.studies.units.m2")}
						</span>
						<span className="flex items-center gap-1">
							<Layers className="h-3.5 w-3.5" />
							{study.numberOfFloors} {t("pricing.studies.floors")}
							{study.hasBasement &&
								" + " + t("pricing.studies.form.hasBasement")}
						</span>
						<span className="flex items-center gap-1">
							<Calendar className="h-3.5 w-3.5" />
							{formatDate(study.updatedAt)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
