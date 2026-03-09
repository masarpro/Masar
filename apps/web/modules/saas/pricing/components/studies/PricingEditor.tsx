"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@ui/components/tabs";
import { ArrowLeft, Building2, PaintBucket, Wrench, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { formatCurrency } from "../../lib/utils";
import { calculateGrandTotal } from "../../lib/pricing-calculations";
import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import { PricingSummaryBar } from "../pricing/PricingSummaryBar";
import { PricingSettingsCard } from "../pricing/PricingSettingsCard";
import { StructuralPricingSection } from "../pricing/StructuralPricingSection";
import { FinishingPricingSection } from "../pricing/FinishingPricingSection";
import { MEPPricingSection } from "../pricing/MEPPricingSection";

interface PricingEditorProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function PricingEditor({
	organizationId,
	organizationSlug,
	studyId,
}: PricingEditorProps) {
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

	// Convert structural items
	const structuralItems = useMemo(() => {
		if (!study?.structuralItems) return [];
		return study.structuralItems.map((item) => ({
			id: item.id,
			category: item.category,
			subCategory: item.subCategory,
			name: item.name,
			quantity: Number(item.quantity),
			unit: item.unit,
			concreteVolume: Number(item.concreteVolume ?? 0),
			steelWeight: Number(item.steelWeight ?? 0),
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			totalCost: Number(item.totalCost),
		}));
	}, [study?.structuralItems]);

	// Convert finishing items
	const finishingItems = useMemo(() => {
		if (!study?.finishingItems) return [];
		return study.finishingItems.map((item) => ({
			id: item.id,
			category: item.category,
			subCategory: item.subCategory,
			name: item.name,
			floorName: item.floorName,
			area: Number(item.area ?? 0),
			quantity: Number(item.quantity ?? 0),
			length: Number(item.length ?? 0),
			unit: item.unit,
			materialPrice: Number(item.materialPrice ?? 0),
			laborPrice: Number(item.laborPrice ?? 0),
			wastagePercent: Number(item.wastagePercent ?? 0),
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			totalCost: Number(item.totalCost),
		}));
	}, [study?.finishingItems]);

	// Convert MEP items
	const mepItems = useMemo(() => {
		if (!study?.mepItems) return [];
		return study.mepItems.map((item) => ({
			id: item.id,
			category: item.category,
			subCategory: item.subCategory,
			name: item.name,
			quantity: Number(item.quantity),
			unit: item.unit,
			materialPrice: Number(item.materialPrice),
			laborPrice: Number(item.laborPrice),
			wastagePercent: Number(item.wastagePercent),
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			totalCost: Number(item.totalCost),
			isEnabled: item.isEnabled,
			dataSource: item.dataSource,
		}));
	}, [study?.mepItems]);

	if (isLoading) {
		return <StudyEditorSkeleton />;
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">
					{t("pricing.studies.notFound")}
				</p>
			</div>
		);
	}

	const directCost =
		study.structuralCost +
		study.finishingCost +
		study.mepCost +
		study.laborCost;

	const { grandTotal } = calculateGrandTotal(
		directCost,
		study.overheadPercent,
		study.profitPercent,
		study.contingencyPercent,
		study.vatIncluded,
	);

	return (
		<div className="space-y-6">
			{/* Back button */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={basePath}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold">التسعير الشامل</h1>
			</div>

			{/* Summary Bar */}
			<PricingSummaryBar
				structuralCost={study.structuralCost}
				finishingCost={study.finishingCost}
				mepCost={study.mepCost}
				laborCost={study.laborCost}
				directCost={directCost}
				grandTotal={grandTotal}
			/>

			{/* Settings */}
			<PricingSettingsCard
				studyId={studyId}
				organizationId={organizationId}
				overheadPercent={study.overheadPercent}
				profitPercent={study.profitPercent}
				contingencyPercent={study.contingencyPercent}
				vatIncluded={study.vatIncluded}
			/>

			{/* Pricing Tabs */}
			<Tabs defaultValue="structural" dir="rtl">
				<TabsList className="w-full grid grid-cols-3">
					<TabsTrigger value="structural" className="gap-1.5">
						<Building2 className="h-4 w-4" />
						<span className="hidden sm:inline">الأعمال الانشائية</span>
						<span className="sm:hidden">إنشائي</span>
						<span className="text-xs text-muted-foreground">
							({structuralItems.length})
						</span>
					</TabsTrigger>
					<TabsTrigger value="finishing" className="gap-1.5">
						<PaintBucket className="h-4 w-4" />
						<span className="hidden sm:inline">أعمال التشطيبات</span>
						<span className="sm:hidden">تشطيبات</span>
						<span className="text-xs text-muted-foreground">
							({finishingItems.length})
						</span>
					</TabsTrigger>
					<TabsTrigger value="mep" className="gap-1.5">
						<Wrench className="h-4 w-4" />
						<span className="hidden sm:inline">الأعمال الكهروميكانيكية</span>
						<span className="sm:hidden">MEP</span>
						<span className="text-xs text-muted-foreground">
							({mepItems.length})
						</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="structural" className="mt-4">
					<StructuralPricingSection
						studyId={studyId}
						organizationId={organizationId}
						items={structuralItems}
					/>
				</TabsContent>

				<TabsContent value="finishing" className="mt-4">
					<FinishingPricingSection
						studyId={studyId}
						organizationId={organizationId}
						items={finishingItems}
					/>
				</TabsContent>

				<TabsContent value="mep" className="mt-4">
					<MEPPricingSection
						studyId={studyId}
						organizationId={organizationId}
						items={mepItems}
					/>
				</TabsContent>
			</Tabs>

			{/* Quotes */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("pricing.studies.quotes.title")}
					</CardTitle>
					<Button>
						<Plus className="ml-2 h-4 w-4" />
						{t("pricing.studies.quotes.create")}
					</Button>
				</CardHeader>
				<CardContent>
					{study.quotes.length > 0 ? (
						<div className="space-y-3">
							{study.quotes.map((quote) => (
								<div
									key={quote.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div>
										<p className="font-medium">
											{quote.quoteNumber}
										</p>
										<p className="text-sm text-muted-foreground">
											{quote.clientName}
										</p>
									</div>
									<div className="text-end">
										<p className="font-medium">
											{formatCurrency(quote.totalAmount)}
										</p>
										<p className="text-sm text-muted-foreground">
											{t(
												`pricing.studies.quotes.status.${quote.status}`,
											)}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							{t("pricing.studies.quotes.empty")}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
