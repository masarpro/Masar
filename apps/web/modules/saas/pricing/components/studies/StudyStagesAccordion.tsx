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
import { Calculator, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";

import { CostingPageContentV2 } from "../costing-v2/CostingPageContentV2";
import { SpecificationsPageContentV2 } from "../specifications/SpecificationsPageContentV2";
import { ConvertToQuotationButton } from "./ConvertToQuotationButton";

/**
 * لوحة مراحل الدراسة الحية — أُلغي نظام الاعتماد/إعادة الفتح بالكامل
 * بطلب جودت؛ كل شيء حي ويُحدَّث مباشرة:
 * - بطاقة المواصفات: مستقلة بذاتها.
 * - بطاقة التكلفة والتسعير: لوحة واحدة مدموجة (المواد، المصنعيات،
 *   المصاريف غير المباشرة، الملخص، التسعير والأرباح) عبر
 *   CostingPageContentV2.
 * زر "تحويل لعرض سعر" متاح دائماً لأنواع الدراسات المسموحة.
 */

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

	// إجماليات الرؤوس — حية دائماً
	const { data: costingSummary } = useQuery(
		orpc.pricing.studies.costing.getSummary.queryOptions({
			input: { organizationId, studyId },
		}),
	);
	const { data: profitData } = useQuery(
		orpc.pricing.studies.markup.getProfitAnalysis.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const totalCost = (costingSummary as any)?.grandTotal?.total ?? 0;
	const sellingPrice = (profitData as any)?.sellingPriceBeforeVat ?? 0;

	const sections = [
		{
			key: "specifications",
			icon: ClipboardList,
			label: t("pricing.pipeline.specifications"),
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
			key: "costPricing",
			icon: Calculator,
			label: t("pricing.pipeline.stagesPanel.costPricingCard"),
			headline: [
				totalCost > 0
					? `${t("pricing.pipeline.stagesPanel.totalCost")}: ${formatSAR(totalCost)}`
					: null,
				sellingPrice > 0
					? `${t("pricing.pipeline.stagesPanel.sellingPrice")}: ${formatSAR(sellingPrice)}`
					: null,
			]
				.filter(Boolean)
				.join(" • ") || null,
			content: (
				<CostingPageContentV2
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
					<ConvertToQuotationButton
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
						studyType={studyType}
						clientName={clientName}
					/>
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
