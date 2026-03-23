"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	TrendingUp,
	TrendingDown,
	Timer,
	CalendarClock,
	ShieldCheck,
	Eraser,
	FileEdit,
	ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
	organizationId: string;
	organizationSlug: string;
}

const TEMPLATES = [
	{ id: "accrued_revenue", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20", type: "ACCRUAL" },
	{ id: "accrued_expense", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", type: "ACCRUAL" },
	{ id: "depreciation", icon: Timer, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", type: "DEPRECIATION" },
	{ id: "prepaid_expense", icon: CalendarClock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", type: "PREPAYMENT" },
	{ id: "provision", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20", type: "PROVISION" },
	{ id: "correction", icon: Eraser, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800", type: "CORRECTION" },
] as const;

const TEMPLATE_LABELS: Record<string, { ar: string; en: string; descAr: string }> = {
	accrued_revenue: { ar: "إيرادات مستحقة", en: "Accrued Revenue", descAr: "تسجيل إيرادات تم تنفيذها ولم تُفوتر بعد" },
	accrued_expense: { ar: "مصروفات مستحقة", en: "Accrued Expense", descAr: "تسجيل مصروفات تمت ولم تُسدد بعد" },
	depreciation: { ar: "إهلاك أصول ثابتة", en: "Depreciation", descAr: "تسجيل قسط الإهلاك الشهري/السنوي" },
	prepaid_expense: { ar: "مصروف مدفوع مقدماً", en: "Prepaid Expense", descAr: "تحميل جزء من المصروف المدفوع مقدماً" },
	provision: { ar: "مخصص نهاية خدمة", en: "End of Service Provision", descAr: "تكوين مخصص مكافأة نهاية الخدمة" },
	correction: { ar: "قيد تصحيحي", en: "Correction", descAr: "تصحيح خطأ في قيد سابق" },
};

export function NewAdjustmentEntry({ organizationId, organizationSlug }: Props) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
	const [adjustmentType, setAdjustmentType] = useState("ACCRUAL");
	const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
	const [description, setDescription] = useState("");
	const [notes, setNotes] = useState("");
	const [autoPost, setAutoPost] = useState(false);
	const [lines, setLines] = useState<{ accountId: string; debit: number; credit: number; description: string }[]>([
		{ accountId: "", debit: 0, credit: 0, description: "" },
		{ accountId: "", debit: 0, credit: 0, description: "" },
	]);

	const mutation = useMutation({
		...orpc.accounting.journal.createAdjustment.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounting"] });
			router.push(`/app/${organizationSlug}/finance/journal-entries`);
		},
	});

	const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
	const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
	const diff = Math.round((totalDebit - totalCredit) * 100) / 100;
	const isBalanced = Math.abs(diff) < 0.01;
	const hasMinLines = lines.filter((l) => l.accountId && (l.debit > 0 || l.credit > 0)).length >= 2;

	const selectTemplate = (tplId: string) => {
		setSelectedTemplate(tplId);
		const tpl = TEMPLATES.find((t) => t.id === tplId);
		if (tpl) setAdjustmentType(tpl.type);
		const label = TEMPLATE_LABELS[tplId];
		if (label) setDescription(label.descAr);
	};

	const addLine = () => setLines([...lines, { accountId: "", debit: 0, credit: 0, description: "" }]);
	const removeLine = (idx: number) => { if (lines.length > 2) setLines(lines.filter((_, i) => i !== idx)); };

	// Step 1: Template Selection
	if (!selectedTemplate) {
		return (
			<div className="space-y-4">
				<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
					{t("finance.accounting.adjustments.selectTemplate") || "اختر قالب أو ابدأ قيد حر"}
				</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{TEMPLATES.map((tpl) => {
						const Icon = tpl.icon;
						const label = TEMPLATE_LABELS[tpl.id];
						return (
							<Card
								key={tpl.id}
								className="rounded-2xl cursor-pointer hover:shadow-lg transition-shadow group"
								onClick={() => selectTemplate(tpl.id)}
							>
								<CardContent className="p-5">
									<div className={`p-3 rounded-xl ${tpl.bg} w-fit mb-3 group-hover:scale-110 transition-transform`}>
										<Icon className={`h-6 w-6 ${tpl.color}`} />
									</div>
									<h3 className="font-semibold text-slate-900 dark:text-slate-100">{label.ar}</h3>
									<p className="text-xs text-slate-500 mt-1">{label.descAr}</p>
								</CardContent>
							</Card>
						);
					})}
					{/* Free entry */}
					<Card
						className="rounded-2xl cursor-pointer hover:shadow-lg transition-shadow group border-dashed"
						onClick={() => { setSelectedTemplate("free"); setDescription(""); }}
					>
						<CardContent className="p-5">
							<div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit mb-3 group-hover:scale-110 transition-transform">
								<FileEdit className="h-6 w-6 text-slate-600" />
							</div>
							<h3 className="font-semibold text-slate-900 dark:text-slate-100">{t("finance.accounting.adjustments.freeEntry")}</h3>
							<p className="text-xs text-slate-500 mt-1">{t("finance.accounting.adjustments.freeEntry")}</p>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Step 2: Entry Form
	return (
		<div className="space-y-4">
			<Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)} className="rounded-xl">
				<ArrowRight className="h-4 w-4 me-1" /> {t("finance.accounting.adjustments.selectTemplate") || "رجوع"}
			</Button>

			<Card className="rounded-2xl">
				<CardContent className="p-6 space-y-4">
					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<Label>{t("finance.accounting.adjustments.type")}</Label>
							<select value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)} className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm">
								<option value="ACCRUAL">{t("finance.accounting.adjustments.accrual")}</option>
								<option value="PREPAYMENT">{t("finance.accounting.adjustments.prepayment")}</option>
								<option value="DEPRECIATION">{t("finance.accounting.adjustments.depreciation")}</option>
								<option value="PROVISION">{t("finance.accounting.adjustments.provision")}</option>
								<option value="CORRECTION">{t("finance.accounting.adjustments.correction")}</option>
							</select>
						</div>
						<div>
							<Label>{t("finance.accounting.entryDate")}</Label>
							<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
						</div>
						<div className="flex items-end">
							<label className="flex items-center gap-2 text-sm cursor-pointer">
								<input type="checkbox" checked={autoPost} onChange={(e) => setAutoPost(e.target.checked)} className="rounded" />
								{t("finance.accounting.adjustments.autoPost")}
							</label>
						</div>
					</div>

					<div>
						<Label>{t("finance.accounting.description")}</Label>
						<Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" />
					</div>

					{/* Lines */}
					<div className="space-y-2">
						<Label>{t("finance.accounting.journalEntries")}</Label>
						{lines.map((line, idx) => (
							<div key={idx} className="flex gap-2 items-center">
								<Input placeholder={t("finance.accounting.selectAccount")} value={line.accountId} onChange={(e) => { const n = [...lines]; n[idx].accountId = e.target.value; setLines(n); }} className="flex-1 rounded-xl text-sm" />
								<Input type="number" placeholder={t("finance.accounting.debit")} value={line.debit || ""} onChange={(e) => { const n = [...lines]; n[idx].debit = Number(e.target.value); setLines(n); }} className="w-28 rounded-xl text-sm" />
								<Input type="number" placeholder={t("finance.accounting.credit")} value={line.credit || ""} onChange={(e) => { const n = [...lines]; n[idx].credit = Number(e.target.value); setLines(n); }} className="w-28 rounded-xl text-sm" />
								{lines.length > 2 && (
									<Button variant="ghost" size="sm" onClick={() => removeLine(idx)} className="text-red-500 px-2">×</Button>
								)}
							</div>
						))}
						<Button variant="outline" size="sm" onClick={addLine} className="rounded-xl">{t("finance.accounting.addLine")}</Button>
					</div>

					{/* Totals */}
					<div className={`flex justify-between p-3 rounded-xl ${isBalanced ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
						<span className="text-sm font-medium">{t("finance.accounting.debit")}: {totalDebit.toLocaleString()}</span>
						<span className="text-sm font-medium">{t("finance.accounting.credit")}: {totalCredit.toLocaleString()}</span>
						<span className={`text-sm font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
							{isBalanced ? t("finance.accounting.balanced") : `${t("finance.accounting.difference")}: ${diff}`}
						</span>
					</div>

					<div>
						<Label>{t("finance.accounting.description")} ({t("finance.accounting.manual")})</Label>
						<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm" />
					</div>

					<Button
						onClick={() => mutation.mutate({
							organizationId,
							adjustmentType: adjustmentType as any,
							date: new Date(date).toISOString(),
							description,
							notes: notes || undefined,
							autoPost,
							lines: lines.filter((l) => l.accountId),
						})}
						disabled={!isBalanced || !hasMinLines || mutation.isPending || !description}
						className="w-full rounded-xl"
					>
						{mutation.isPending ? "..." : t("finance.accounting.saveDraft") || "حفظ"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
