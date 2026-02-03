"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatCurrency, formatNumber } from "../lib/utils";

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
	const basePath = `/app/${organizationSlug}/quantities/${studyId}`;

	const { data: study, isLoading } = useQuery(
		orpc.quantities.getById.queryOptions({
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
				<p className="text-muted-foreground">{t("quantities.notFound")}</p>
			</div>
		);
	}

	const directCost =
		study.structuralCost +
		study.finishingCost +
		study.mepCost +
		study.laborCost;

	const overhead = directCost * (study.overheadPercent / 100);
	const profit = directCost * (study.profitPercent / 100);
	const contingency = directCost * (study.contingencyPercent / 100);
	const subtotal = directCost + overhead + profit + contingency;
	const vat = study.vatIncluded ? subtotal * 0.15 : 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={basePath}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Cost Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle>{t("quantities.costBreakdown")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("quantities.structural.title")}
								</span>
								<span>{formatCurrency(study.structuralCost)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("quantities.finishing.title")}
								</span>
								<span>{formatCurrency(study.finishingCost)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("quantities.mep.title")}
								</span>
								<span>{formatCurrency(study.mepCost)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("quantities.labor")}
								</span>
								<span>{formatCurrency(study.laborCost)}</span>
							</div>
							<div className="border-t pt-3 flex justify-between font-medium">
								<span>{t("quantities.directCost")}</span>
								<span>{formatCurrency(directCost)}</span>
							</div>
						</div>

						<div className="border-t pt-4 space-y-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("quantities.overhead")} ({study.overheadPercent}%)
								</span>
								<span>{formatCurrency(overhead)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("quantities.profit")} ({study.profitPercent}%)
								</span>
								<span>{formatCurrency(profit)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("quantities.contingency")} ({study.contingencyPercent}%)
								</span>
								<span>{formatCurrency(contingency)}</span>
							</div>
							{study.vatIncluded && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t("quantities.vat")} (15%)
									</span>
									<span>{formatCurrency(vat)}</span>
								</div>
							)}
						</div>

						<div className="border-t pt-4 flex justify-between text-lg font-bold">
							<span>{t("quantities.total")}</span>
							<span>{formatCurrency(study.totalCost)}</span>
						</div>
					</CardContent>
				</Card>

				{/* Settings */}
				<Card>
					<CardHeader>
						<CardTitle>{t("quantities.pricingSettings")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>{t("quantities.overhead")}</Label>
							<div className="relative">
								<Input
									type="number"
									min="0"
									max="100"
									step="0.5"
									value={study.overheadPercent}
									readOnly
									className="pl-8"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
									%
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label>{t("quantities.profit")}</Label>
							<div className="relative">
								<Input
									type="number"
									min="0"
									max="100"
									step="0.5"
									value={study.profitPercent}
									readOnly
									className="pl-8"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
									%
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label>{t("quantities.contingency")}</Label>
							<div className="relative">
								<Input
									type="number"
									min="0"
									max="100"
									step="0.5"
									value={study.contingencyPercent}
									readOnly
									className="pl-8"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
									%
								</span>
							</div>
						</div>

						<div className="flex items-center justify-between pt-2">
							<Label>{t("quantities.includeVat")}</Label>
							<Switch checked={study.vatIncluded} disabled />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quotes */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("quantities.quotes.title")}
					</CardTitle>
					<Button>
						<Plus className="ml-2 h-4 w-4" />
						{t("quantities.quotes.create")}
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
										<p className="font-medium">{quote.quoteNumber}</p>
										<p className="text-sm text-muted-foreground">
											{quote.clientName}
										</p>
									</div>
									<div className="text-end">
										<p className="font-medium">
											{formatCurrency(quote.totalAmount)}
										</p>
										<p className="text-sm text-muted-foreground">
											{t(`quantities.quotes.status.${quote.status}`)}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							{t("quantities.quotes.empty")}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
