"use client";

import { Button } from "@ui/components/button";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ConvertToQuotationButtonProps {
	studyId: string;
	organizationSlug: string;
	studyType: string;
	pricingStageStatus: string | undefined;
}

/**
 * زر "تحويل إلى عرض سعر" — ينقل إلى صفحة مرحلة عرض السعر الغنية
 * (StudyQuotationPageContent: اختيار الصيغة، VAT من الدراسة، ربط costStudyId)
 * بدلاً من تدفق sessionStorage القديم المسطّح.
 */
export function ConvertToQuotationButton({
	studyId,
	organizationSlug,
	studyType,
	pricingStageStatus,
}: ConvertToQuotationButtonProps) {
	const t = useTranslations();

	// Only show for FULL_STUDY, FULL_PROJECT, or COST_PRICING
	const allowedTypes = ["FULL_STUDY", "FULL_PROJECT", "COST_PRICING"];
	if (!allowedTypes.includes(studyType)) return null;

	// Only after the pricing stage is APPROVED
	if (pricingStageStatus !== "APPROVED") return null;

	return (
		<Button
			asChild
			className="bg-red-600 hover:bg-red-700 text-white gap-2"
		>
			<Link
				href={`/app/${organizationSlug}/pricing/studies/${studyId}/quotation`}
			>
				<FileText className="h-4 w-4" />
				{t("pricing.studies.convertToQuotation")}
			</Link>
		</Button>
	);
}
