"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ConvertToQuotationButtonProps {
	studyId: string;
	organizationId: string;
	organizationSlug: string;
	studyType: string;
	pricingStageStatus: string | undefined;
}

export function ConvertToQuotationButton({
	studyId,
	organizationId,
	organizationSlug,
	studyType,
	pricingStageStatus,
}: ConvertToQuotationButtonProps) {
	const t = useTranslations();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Only show for FULL_STUDY, FULL_PROJECT, or COST_PRICING
	const allowedTypes = ["FULL_STUDY", "FULL_PROJECT", "COST_PRICING"];
	if (!allowedTypes.includes(studyType)) return null;

	// Only show when pricing stage is APPROVED or DRAFT
	const allowedStatuses = ["APPROVED", "DRAFT"];
	if (!pricingStageStatus || !allowedStatuses.includes(pricingStageStatus))
		return null;

	const handleConvert = async () => {
		setIsLoading(true);
		try {
			// Fetch costing items and markup settings in parallel
			const [costingResult, markupResult] = await Promise.all([
				orpcClient.pricing.studies.costing.getItems({
					organizationId,
					studyId,
				}),
				orpcClient.pricing.studies.markup.getSettings({
					organizationId,
					studyId,
				}),
			]);

			const costingItems = (costingResult as any)?.items ?? [];
			const markup = markupResult as any;
			const method = markup?.method ?? "uniform";

			// Build section markup map for per_section method
			const sectionMarkupMap: Record<string, number> = {};
			if (method === "per_section" && markup?.sectionMarkups) {
				for (const sm of markup.sectionMarkups) {
					sectionMarkupMap[sm.section] = sm.markupPercent ?? 0;
				}
			}

			const overheadPct = markup?.uniformSettings?.overheadPercent ?? 5;
			const profitPct = markup?.uniformSettings?.profitPercent ?? 15;
			const contingencyPct =
				markup?.uniformSettings?.contingencyPercent ?? 2;

			// Calculate selling price per item
			const items = costingItems.map((item: any) => {
				const totalCost = Number(item.totalCost ?? 0);
				const quantity = Number(item.quantity ?? 1) || 1;
				let sellingPrice: number;

				if (method === "per_section") {
					const markupPct = sectionMarkupMap[item.section] ?? 0;
					sellingPrice = totalCost * (1 + markupPct / 100);
				} else {
					// uniform
					sellingPrice =
						totalCost *
						(1 + (overheadPct + profitPct + contingencyPct) / 100);
				}

				const unitPrice = sellingPrice / quantity;

				return {
					description: item.description ?? "",
					quantity,
					unit: item.unit ?? "",
					unitPrice,
				};
			});

			// Store prefill data in sessionStorage
			const storageKey = `quotation_prefill_${studyId}`;
			sessionStorage.setItem(storageKey, JSON.stringify({ items }));

			// Navigate to quotation creation page
			router.push(
				`/app/${organizationSlug}/pricing/quotations/new?fromStudy=${studyId}`,
			);
		} catch {
			toast.error(t("pricing.studies.convertToQuotationError"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handleConvert}
			disabled={isLoading}
			className="bg-red-600 hover:bg-red-700 text-white gap-2"
		>
			{isLoading ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<FileText className="h-4 w-4" />
			)}
			{t("pricing.studies.convertToQuotation")}
		</Button>
	);
}
