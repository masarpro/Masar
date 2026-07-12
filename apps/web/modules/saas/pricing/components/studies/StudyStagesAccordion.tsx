"use client";

import { formatSAR } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
import { Card, CardContent } from "@ui/components/card";
import { StatusChip, type StatusTone } from "@ui/components/status-chip";
import { Calculator, ClipboardList, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

import { StageApprovalButton } from "../pipeline/StageApprovalButton";
import { CostingPageContentV2 } from "../costing-v2/CostingPageContentV2";
import { PricingPageContentV2 } from "../pricing-v2/PricingPageContentV2";
import { SpecificationsPageContentV2 } from "../specifications/SpecificationsPageContentV2";
import { ConvertToQuotationButton } from "./ConvertToQuotationButton";

/**
 * دمج مراحل الدراسة (المواصفات ← تسعير التكلفة ← التسعير) داخل صفحة
 * الكميات نفسها كأقسام مطوية أسفل الصفحة — بطلب جودت بدل شريط المراحل
 * العلوي وصفحات المراحل المنفصلة. كل قسم يعرض حالته وإجماليه في
 * الرأس، ومحتواه الكامل (جداول + اعتماد) يُركَّب فقط عند فتحه.
 * سلّم الاعتماد نفسه لم يتغير: اعتماد الكميات من هنا يفتح المواصفات
 * وهكذا، وبعد اعتماد التسعير يظهر زر التحويل الذي يُنشئ عرض السعر
 * في نظام عروض الأسعار مباشرة.
 */

type StageStatus = "NOT_STARTED" | "DRAFT" | "IN_REVIEW" | "APPROVED";

const STATUS_LABEL_KEY: Record<StageStatus, string> = {
	NOT_STARTED: "pricing.pipeline.notStarted",
	DRAFT: "pricing.pipeline.draft",
	IN_REVIEW: "pricing.pipeline.inReview",
	APPROVED: "pricing.pipeline.approved",
};

const STATUS_TONE: Record<StageStatus, StatusTone> = {
	NOT_STARTED: "neutral",
	DRAFT: "info",
	IN_REVIEW: "warning",
	APPROVED: "success",
};

interface StudyStagesAccordionProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	studyType: string;
	clientName?: string | null;
}

export function StudyStagesAccordion({
	organizationId,
	organizationSlug,
	studyId,
	studyType,
	clientName,
}: StudyStagesAccordionProps) {
	const t = useTranslations();

	const { data: stagesData } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const stageRecords: Array<{
		stage: string;
		status: string;
		canApprove?: boolean;
	}> = (stagesData as any)?.stages ?? [];

	const statusOf = (stage: string): StageStatus =>
		(stageRecords.find((s) => s.stage === stage)?.status ??
			"NOT_STARTED") as StageStatus;

	const quantitiesStatus = statusOf("QUANTITIES");
	const specsStatus = statusOf("SPECIFICATIONS");
	const costingStatus = statusOf("COSTING");
	const pricingStatus = statusOf("PRICING");
	const canApproveQuantities =
		stageRecords.find((s) => s.stage === "QUANTITIES")?.canApprove ?? true;

	// إجماليات الرؤوس — تُجلب فقط عندما تصبح مرحلتها متاحة
	const { data: costingSummary } = useQuery(
		orpc.pricing.studies.costing.getSummary.queryOptions({
			input: { organizationId, studyId },
			enabled: costingStatus !== "NOT_STARTED",
		}),
	);
	const { data: profitData } = useQuery(
		orpc.pricing.studies.markup.getProfitAnalysis.queryOptions({
			input: { organizationId, studyId },
			enabled: pricingStatus !== "NOT_STARTED",
		}),
	);

	const totalCost = (costingSummary as any)?.grandTotal?.total ?? 0;
	const sellingPrice = (profitData as any)?.sellingPriceBeforeVat ?? 0;

	const sections = [
		{
			key: "specifications",
			icon: ClipboardList,
			label: t("pricing.pipeline.specifications"),
			status: specsStatus,
			headline: null as string | null,
			content: (
				<SpecificationsPageContentV2
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			),
		},
		{
			key: "costing",
			icon: Calculator,
			label: t("pricing.pipeline.costing"),
			status: costingStatus,
			headline:
				totalCost > 0
					? `${t("pricing.pipeline.stagesPanel.totalCost")}: ${formatSAR(totalCost)}`
					: null,
			content: (
				<CostingPageContentV2
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			),
		},
		{
			key: "pricing",
			icon: Tag,
			label: t("pricing.pipeline.sellingPrice"),
			status: pricingStatus,
			headline:
				sellingPrice > 0
					? `${t("pricing.pipeline.stagesPanel.sellingPrice")}: ${formatSAR(sellingPrice)}`
					: null,
			content: (
				<PricingPageContentV2
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			),
		},
	];

	return (
		<Card className="border-primary/15" dir="rtl">
			<CardContent className="p-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="font-semibold text-sm">
						{t("pricing.pipeline.stagesPanel.title")}
					</p>
					<div className="flex items-center gap-2">
						<ConvertToQuotationButton
							organizationId={organizationId}
							organizationSlug={organizationSlug}
							studyId={studyId}
							studyType={studyType}
							pricingStageStatus={pricingStatus}
							clientName={clientName}
						/>
						<StageApprovalButton
							organizationId={organizationId}
							organizationSlug={organizationSlug}
							studyId={studyId}
							stage="quantities"
							status={quantitiesStatus}
							canReopen
							canApprove={canApproveQuantities}
						/>
					</div>
				</div>

				<Accordion type="multiple" className="mt-2">
					{sections.map((section) => {
						const Icon = section.icon;
						return (
							<AccordionItem key={section.key} value={section.key}>
								<AccordionTrigger className="hover:no-underline">
									<span className="flex flex-1 flex-wrap items-center gap-2.5 pe-2">
										<Icon className="h-4 w-4 shrink-0 text-primary" />
										<span className="font-medium text-sm">
											{section.label}
										</span>
										<StatusChip tone={STATUS_TONE[section.status]}>
											{t(STATUS_LABEL_KEY[section.status])}
										</StatusChip>
										{section.headline && (
											<span className="ms-auto text-muted-foreground text-xs tabular-nums">
												{section.headline}
											</span>
										)}
									</span>
								</AccordionTrigger>
								<AccordionContent>
									<div className="pt-2">{section.content}</div>
								</AccordionContent>
							</AccordionItem>
						);
					})}
				</Accordion>
			</CardContent>
		</Card>
	);
}
