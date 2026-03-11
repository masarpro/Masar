"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { QuotationPreview } from "@saas/pricing/components/quotations/QuotationPreview";
import { QuotationPreviewV2 } from "./QuotationPreviewV2";
import { Loader2 } from "lucide-react";

interface QuotationPreviewSwitchProps {
	organizationId: string;
	organizationSlug: string;
	quotationId: string;
}

export function QuotationPreviewSwitch({
	organizationId,
	organizationSlug,
	quotationId,
}: QuotationPreviewSwitchProps) {
	const { data: quotation, isLoading } = useQuery(
		orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	// If quotation has a displayConfig (created from study), use V2 preview
	const hasDisplayConfig = !!(quotation as any)?.displayConfig;

	if (hasDisplayConfig) {
		return (
			<QuotationPreviewV2
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				quotationId={quotationId}
			/>
		);
	}

	// Otherwise use the standard preview
	return (
		<QuotationPreview
			organizationId={organizationId}
			organizationSlug={organizationSlug}
			quotationId={quotationId}
		/>
	);
}
