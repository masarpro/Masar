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
import { getStudyScopeSubtitle } from "../../lib/study-scope-subtitle";
import { formatDate } from "@shared/lib/formatters";

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
		workScopes?: string[] | null;
		createdAt: Date | string;
		updatedAt: Date | string;
		/** JSONB — BuildingWizard config lives at structuralSpecs.buildingConfig */
		structuralSpecs?: {
			buildingConfig?: {
				floors?: Array<{
					enabled?: boolean;
					slabArea?: number;
					repeatCount?: number;
				}>;
			} | null;
		} | null;
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
		// المفاتيح في pricing.studies.status.* تطابق القيم الخام
		// (draft / in_progress / completed / approved) — لا تُشوّه المفتاح
		return t(`pricing.studies.status.${status}`) || status;
	};

	const studiesListUrl = `/app/${organizationSlug}/pricing/studies`;

	// Real building data comes from the BuildingWizard config (structuralSpecs).
	// The scalar landArea/buildingArea/numberOfFloors columns default to the
	// placeholder value 1 at creation — never display those fake values.
	const configFloors = (study.structuralSpecs?.buildingConfig?.floors ?? []).filter(
		(f) => f.enabled !== false,
	);
	const configBuildingArea = Math.round(
		configFloors.reduce(
			(sum, f) =>
				sum + (Number(f.slabArea) || 0) * (Number(f.repeatCount) || 1),
			0,
		) * 10,
	) / 10;
	const configFloorsCount = configFloors.reduce(
		(sum, f) => sum + (Number(f.repeatCount) || 1),
		0,
	);
	const hasRealLegacyData =
		Number(study.buildingArea) > 1 ||
		Number(study.landArea) > 1 ||
		Number(study.numberOfFloors) > 1;
	const displayArea =
		configBuildingArea > 0
			? configBuildingArea
			: hasRealLegacyData
				? Number(study.landArea)
				: null;
	const displayFloors =
		configFloorsCount > 0
			? configFloorsCount
			: hasRealLegacyData
				? Number(study.numberOfFloors)
				: null;

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
									{getStudyScopeSubtitle(t, study.workScopes)}
								</p>
							</div>
							<Badge variant={getStatusBadgeVariant(study.status)}>
								{getStatusLabel(study.status)}
							</Badge>
						</div>
					</div>

					{/* Project details */}
					<div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Building2 className="h-3.5 w-3.5" />
							{t(`pricing.studies.projectTypes.${study.projectType}`)}
						</span>
						{displayArea !== null && (
							<span className="flex items-center gap-1">
								<MapPin className="h-3.5 w-3.5" />
								{displayArea} {t("pricing.studies.units.m2")}
							</span>
						)}
						{displayFloors !== null && (
							<span className="flex items-center gap-1">
								<Layers className="h-3.5 w-3.5" />
								{displayFloors} {t("pricing.studies.floors")}
								{study.hasBasement &&
									" + " + t("pricing.studies.form.hasBasement")}
							</span>
						)}
						<span className="flex items-center gap-1">
							<Calendar className="h-3.5 w-3.5" />
							<span className="text-muted-foreground/70">
								{t("pricing.studies.lastUpdated")}:
							</span>
							{formatDate(study.updatedAt)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
