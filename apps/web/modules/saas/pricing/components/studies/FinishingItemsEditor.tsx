"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatCurrency, formatNumber } from "../../lib/utils";

interface FinishingItemsEditorProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

const FINISHING_CATEGORIES = [
	{ key: "plastering", icon: "🏗️" },
	{ key: "painting", icon: "🎨" },
	{ key: "flooring", icon: "🪨" },
	{ key: "ceilings", icon: "⬆️" },
	{ key: "doors", icon: "🚪" },
	{ key: "windows", icon: "🪟" },
];

export function FinishingItemsEditor({
	organizationId,
	organizationSlug,
	studyId,
}: FinishingItemsEditorProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;

	const { data: study, isLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	// Group items by category
	const itemsByCategory = FINISHING_CATEGORIES.map((cat) => ({
		...cat,
		items: study.finishingItems.filter((item) => item.category === cat.key),
		totalCost: study.finishingItems
			.filter((item) => item.category === cat.key)
			.reduce((sum, item) => sum + item.totalCost, 0),
		totalArea: study.finishingItems
			.filter((item) => item.category === cat.key)
			.reduce((sum, item) => sum + item.area, 0),
	}));

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={basePath}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
			</div>

			{/* Summary */}
			<Card>
				<CardContent className="pt-6">
					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<p className="text-sm text-muted-foreground">
								{t("pricing.studies.totalItems")}
							</p>
							<p className="text-2xl font-bold">
								{study.finishingItems.length}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								{t("pricing.studies.totalArea")}
							</p>
							<p className="text-2xl font-bold">
								{formatNumber(
									study.finishingItems.reduce(
										(sum, item) => sum + item.area,
										0
									)
								)}{" "}
								م²
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								{t("pricing.studies.totalCost")}
							</p>
							<p className="text-2xl font-bold">
								{formatCurrency(study.finishingCost)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Categories */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{itemsByCategory.map((category) => (
					<Card key={category.key}>
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center justify-between text-base">
								<span className="flex items-center gap-2">
									<span>{category.icon}</span>
									{t(`pricing.studies.finishing.${category.key}`)}
								</span>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<Plus className="h-4 w-4" />
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										{t("pricing.studies.items")}
									</span>
									<span>{category.items.length}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										{t("pricing.studies.area")}
									</span>
									<span>{formatNumber(category.totalArea)} م²</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										{t("pricing.studies.totalCost")}
									</span>
									<span className="font-medium">
										{formatCurrency(category.totalCost)}
									</span>
								</div>
							</div>

							{category.items.length > 0 && (
								<div className="mt-4 space-y-2 border-t pt-4">
									{category.items.slice(0, 3).map((item) => (
										<div
											key={item.id}
											className="flex justify-between text-sm"
										>
											<span className="truncate max-w-[60%]">
												{item.name}
											</span>
											<span>{formatCurrency(item.totalCost)}</span>
										</div>
									))}
									{category.items.length > 3 && (
										<p className="text-xs text-muted-foreground">
											+{category.items.length - 3} {t("pricing.studies.more")}
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
