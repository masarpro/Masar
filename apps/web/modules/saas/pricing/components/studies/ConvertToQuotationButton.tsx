"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ConvertToQuotationButtonProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	studyType: string;
	pricingStageStatus: string | undefined;
	/** اسم العميل من الدراسة — يُستخدم كاسم عميل العرض المبدئي */
	clientName?: string | null;
}

/**
 * زر "تحويل إلى عرض سعر" — يُنشئ عرض سعر فعلياً في نظام عروض الأسعار
 * (Quotation مربوط بالدراسة، بنوده معبأة من تسعير التكلفة بصيغة BOQ
 * تفصيلية وافتراضيات معقولة) ثم يفتحه مباشرة في
 * /pricing/quotations/{id} حيث يكمل المستخدم التحرير بنظامه المعتاد.
 * لا صفحات مراحل وسيطة.
 */
export function ConvertToQuotationButton({
	organizationId,
	organizationSlug,
	studyId,
	studyType,
	pricingStageStatus,
	clientName,
}: ConvertToQuotationButtonProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const createMutation = useMutation(
		orpc.pricing.studies.createStudyQuotation.mutationOptions({
			onSuccess: (data: any) => {
				toast.success(t("pricing.studies.convertToQuotationSuccess"));
				queryClient.invalidateQueries({ queryKey: orpc.pricing.key() });
				router.push(
					`/app/${organizationSlug}/pricing/quotations/${data.quotationId}`,
				);
			},
			onError: () => {
				toast.error(t("pricing.studies.convertToQuotationFailed"));
			},
		}),
	);

	// Only show for FULL_STUDY, FULL_PROJECT, or COST_PRICING
	const allowedTypes = ["FULL_STUDY", "FULL_PROJECT", "COST_PRICING"];
	if (!allowedTypes.includes(studyType)) return null;

	// Only after the pricing stage is APPROVED
	if (pricingStageStatus !== "APPROVED") return null;

	const handleConvert = () => {
		(createMutation as any).mutate({
			organizationId,
			studyId,
			format: "DETAILED_BOQ",
			displayConfig: {
				grouping: "BY_SECTION",
				showItemNumber: true,
				showDescription: true,
				showSpecifications: false,
				showQuantity: true,
				showUnit: true,
				showUnitPrice: true,
				showItemTotal: true,
				showStructural: true,
				showFinishing: true,
				showMEP: true,
				showManualItems: true,
				showMaterialDetails: false,
				showSectionSubtotal: true,
				showSubtotal: true,
				showDiscount: false,
				showVAT: true,
				showGrandTotal: true,
				showPricePerSqm: false,
			},
			clientData: {
				name:
					clientName?.trim() ||
					t("pricing.studies.defaultQuotationClient"),
			},
			validDays: 30,
			discountType: "none",
		});
	};

	return (
		<Button
			onClick={handleConvert}
			disabled={createMutation.isPending}
			className="bg-red-600 hover:bg-red-700 text-white gap-2"
		>
			{createMutation.isPending ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<FileText className="h-4 w-4" />
			)}
			{t("pricing.studies.convertToQuotation")}
		</Button>
	);
}
