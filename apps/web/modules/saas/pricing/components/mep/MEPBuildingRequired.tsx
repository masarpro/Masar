"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface MEPBuildingRequiredProps {
	studyId: string;
	organizationSlug: string;
}

export function MEPBuildingRequired({
	studyId,
	organizationSlug,
}: MEPBuildingRequiredProps) {
	const finishingPath = `/app/${organizationSlug}/pricing/studies/${studyId}/finishing`;

	return (
		<Card className="border-dashed">
			<CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
				<div className="rounded-full bg-muted p-4">
					<Building2 className="h-8 w-8 text-muted-foreground" />
				</div>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold">
						إعدادات المبنى مطلوبة
					</h3>
					<p className="text-sm text-muted-foreground max-w-md">
						لاشتقاق بنود الأعمال الكهروميكانيكية تلقائياً، يجب أولاً
						إنشاء إعدادات المبنى (الطوابق والغرف) من قسم التشطيبات.
					</p>
				</div>
				<Button asChild>
					<Link href={finishingPath}>
						<ArrowLeft className="h-4 w-4 me-2" />
						الذهاب لقسم التشطيبات
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
