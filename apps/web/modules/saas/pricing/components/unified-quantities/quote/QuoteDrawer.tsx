"use client";

import { Button } from "@ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@ui/components/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStudyTotals } from "../hooks/useStudyTotals";
import { useUnifiedQuantities } from "../hooks/useUnifiedQuantities";
import { useCostStudy } from "../hooks/useCostStudy";
import { QuotePreview } from "./QuotePreview";
import { QuoteSettingsForm } from "./QuoteSettingsForm";
import { QuoteTermsEditor } from "./QuoteTermsEditor";
import { DEFAULT_QUOTE, type QuoteData } from "./types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	costStudyId: string;
	organizationId: string;
}

const STORAGE_KEY = (id: string) => `unified-quote-${id}`;

function readPersisted(costStudyId: string): QuoteData {
	if (typeof window === "undefined") return DEFAULT_QUOTE;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY(costStudyId));
		if (!raw) return DEFAULT_QUOTE;
		const parsed = JSON.parse(raw) as Partial<QuoteData>;
		return { ...DEFAULT_QUOTE, ...parsed };
	} catch {
		return DEFAULT_QUOTE;
	}
}

function writePersisted(costStudyId: string, value: QuoteData) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY(costStudyId), JSON.stringify(value));
	} catch {
		// ignore quota errors
	}
}

export function QuoteDrawer({
	open,
	onOpenChange,
	costStudyId,
	organizationId,
}: Props) {
	const [data, setData] = useState<QuoteData>(() => readPersisted(costStudyId));
	const { totals } = useStudyTotals({ costStudyId, organizationId });
	const { items } = useUnifiedQuantities({ costStudyId, organizationId });
	const { vatPercent } = useCostStudy(costStudyId, organizationId);

	useEffect(() => {
		if (open) setData(readPersisted(costStudyId));
	}, [open, costStudyId]);

	const updateData = (next: QuoteData) => {
		setData(next);
		writePersisted(costStudyId, next);
	};

	const totalSellAmount = Number(totals?.totalSellAmount ?? 0);
	const totalGrossCost = Number(totals?.totalGrossCost ?? 0);
	const totalProfitAmount = Number(totals?.totalProfitAmount ?? 0);

	const { vatAmount, grossWithVat } = useMemo(() => {
		if (!data.includeVAT) {
			return { vatAmount: 0, grossWithVat: totalSellAmount };
		}
		const v = totalSellAmount * (vatPercent / 100);
		return { vatAmount: v, grossWithVat: totalSellAmount + v };
	}, [data.includeVAT, totalSellAmount, vatPercent]);

	const handlePrint = () => {
		// Brief tick to ensure CSS variable is set before print
		window.setTimeout(() => window.print(), 50);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
				<SheetHeader className="px-4 pt-4">
					<SheetTitle>إنشاء عرض سعر</SheetTitle>
				</SheetHeader>

				<Tabs
					defaultValue="settings"
					className="flex flex-1 flex-col overflow-hidden px-4 pb-2"
				>
					<TabsList className="w-full">
						<TabsTrigger value="settings" className="flex-1">
							الإعدادات
						</TabsTrigger>
						<TabsTrigger value="terms" className="flex-1">
							الشروط
						</TabsTrigger>
						<TabsTrigger value="preview" className="flex-1">
							معاينة
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="settings"
						className="mt-3 flex-1 overflow-y-auto pe-1"
					>
						<QuoteSettingsForm value={data} onChange={updateData} />
					</TabsContent>

					<TabsContent
						value="terms"
						className="mt-3 flex-1 overflow-y-auto pe-1"
					>
						<QuoteTermsEditor value={data} onChange={updateData} />
					</TabsContent>

					<TabsContent
						value="preview"
						className="mt-3 flex-1 overflow-y-auto pe-1"
					>
						<QuotePreview
							data={data}
							items={items}
							totalSellAmount={totalSellAmount}
							totalProfitAmount={totalProfitAmount}
							totalGrossCost={totalGrossCost}
							vatAmount={vatAmount}
							grossWithVat={grossWithVat}
						/>
					</TabsContent>
				</Tabs>

				<div className="flex justify-end gap-2 border-t bg-background px-4 py-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						إغلاق
					</Button>
					<Button
						onClick={handlePrint}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						<Download className="me-2 h-4 w-4" />
						توليد PDF (طباعة)
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
