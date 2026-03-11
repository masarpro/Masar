"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Loader2, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { QuickPricingPageContent } from "./QuickPricingPageContent";

interface QuickPricingStandaloneProps {
	organizationId: string;
	organizationSlug: string;
}

export function QuickPricingStandalone({
	organizationId,
	organizationSlug,
}: QuickPricingStandaloneProps) {
	const { data: studies, isLoading } = useQuery(
		orpc.pricing.studies.list.queryOptions({
			input: { organizationId },
		}),
	);

	const studyList = ((studies as any)?.costStudies as any[]) ?? [];

	// Find the most recent CUSTOM_ITEMS or quick-type study
	const quickStudy = studyList.find(
		(s: any) =>
			s.entryPoint === "CUSTOM_ITEMS" || s.entryPoint === "QUOTATION_ONLY",
	);

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (quickStudy) {
		return (
			<QuickPricingPageContent
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				studyId={quickStudy.id}
			/>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center py-16" dir="rtl">
			<Card className="max-w-md w-full">
				<CardContent className="p-8 text-center space-y-4">
					<div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
						<Zap className="h-6 w-6 text-primary" />
					</div>
					<h3 className="text-lg font-semibold">التسعير السريع</h3>
					<p className="text-sm text-muted-foreground">
						أنشئ دراسة تسعير سريعة لحساب التكاليف وتقديم عروض أسعار
						بدون الحاجة لإدخال الكميات التفصيلية
					</p>
					<Button asChild className="gap-2 rounded-xl">
						<Link
							href={`/app/${organizationSlug}/pricing/studies/new`}
						>
							<Plus className="h-4 w-4" />
							إنشاء دراسة جديدة
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
