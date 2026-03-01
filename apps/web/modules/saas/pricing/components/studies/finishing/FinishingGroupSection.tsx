"use client";

import * as LucideIcons from "lucide-react";
import type { FinishingCategoryConfig, FinishingGroup } from "../../../lib/finishing-categories";
import type { BuildingConfig } from "../../../lib/finishing-types";
import { FinishingCategoryCard } from "./FinishingCategoryCard";

interface FinishingItem {
	id: string;
	category: string;
	subCategory?: string | null;
	name: string;
	floorId?: string | null;
	floorName?: string | null;
	area?: number | null;
	quantity?: number | null;
	length?: number | null;
	unit: string;
	qualityLevel?: string | null;
	totalCost: number;
	wastagePercent?: number | null;
	materialPrice?: number | null;
	laborPrice?: number | null;
	calculationMethod?: string | null;
	calculationData?: Record<string, unknown> | null;
	brand?: string | null;
	specifications?: string | null;
	description?: string | null;
}

interface FinishingGroupSectionProps {
	group: FinishingGroup;
	categories: FinishingCategoryConfig[];
	items: FinishingItem[];
	organizationId: string;
	studyId: string;
	buildingConfig?: BuildingConfig | null;
}

const GROUP_COLORS: Record<string, string> = {
	emerald: "border-emerald-500",
	amber: "border-amber-500",
	blue: "border-blue-500",
	teal: "border-teal-500",
	cyan: "border-cyan-500",
	gray: "border-gray-500",
	orange: "border-orange-500",
	indigo: "border-indigo-500",
	violet: "border-violet-500",
	rose: "border-rose-500",
	stone: "border-stone-500",
	green: "border-green-500",
	red: "border-red-500",
	pink: "border-pink-500",
};

export function FinishingGroupSection({
	group,
	categories,
	items,
	organizationId,
	studyId,
	buildingConfig,
}: FinishingGroupSectionProps) {
	const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
		group.icon
	] ?? LucideIcons.Box;
	const borderColor = GROUP_COLORS[group.color] ?? "border-gray-500";

	return (
		<div className={`space-y-3 border-r-4 ${borderColor} pr-4`}>
			{/* Group header */}
			<div className="flex items-center gap-2">
				<IconComponent className="h-5 w-5" />
				<h3 className="text-lg font-semibold">{group.nameAr}</h3>
			</div>

			{/* Category cards */}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{categories.map((category) => (
					<FinishingCategoryCard
						key={category.id}
						category={category}
						items={items.filter((item) => item.category === category.id)}
						organizationId={organizationId}
						studyId={studyId}
						buildingConfig={buildingConfig}
					/>
				))}
			</div>
		</div>
	);
}
