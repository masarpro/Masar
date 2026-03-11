"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { FlaskConical } from "lucide-react";
import Link from "next/link";

interface QuotationStudyBannerProps {
	organizationId: string;
	organizationSlug: string;
	quotationId: string;
}

const FORMAT_LABELS: Record<string, string> = {
	DETAILED_BOQ: "تفصيلي (BOQ)",
	PER_SQM: "بالمتر المربع",
	LUMP_SUM: "مقطوعية",
	CUSTOM: "مخصص",
};

export function QuotationStudyBanner({
	organizationId,
	organizationSlug,
	quotationId,
}: QuotationStudyBannerProps) {
	const { data: quotation } = useQuery(
		orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId },
		}),
	);

	const costStudy = (quotation as any)?.costStudy;
	const displayConfig = (quotation as any)?.displayConfig;

	if (!costStudy) return null;

	return (
		<div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between" dir="rtl">
			<div className="flex items-center gap-3">
				<FlaskConical className="h-5 w-5 text-muted-foreground" />
				<div>
					<span className="text-sm text-muted-foreground">مرتبط بدراسة: </span>
					<Link
						href={`/app/${organizationSlug}/pricing/studies/${costStudy.id}`}
						className="text-sm font-medium text-primary hover:underline"
					>
						{costStudy.name}
					</Link>
				</div>
			</div>
			{displayConfig?.format && (
				<Badge variant="outline" className="text-xs">
					{FORMAT_LABELS[displayConfig.format] ?? displayConfig.format}
				</Badge>
			)}
		</div>
	);
}
