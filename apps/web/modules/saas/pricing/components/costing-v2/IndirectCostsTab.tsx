"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Switch } from "@ui/components/switch";
import {
	Cable,
	HardHat,
	Home,
	Loader2,
	Plus,
	Save,
	Trash2,
	Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatNum } from "@saas/pricing/lib/utils";
import { aggregateBOQ } from "../../lib/boq-aggregator";

/**
 * تبويب المصاريف غير المباشرة — سلك التربيط والمسامير (تُحسب آلياً من
 * كميات BOQ)، الإشراف الهندسي والميداني (عدد × راتب × أشهر)، ومصاريف
 * التشغيل (سكن العمال، الإعاشة، النثريات، ...).
 *
 * تُحفظ في laborBreakdown.indirectCosts وتدخل في التكلفة الإجمالية
 * قبل هامش الربح وقبل ضريبة القيمة المضافة (الضريبة لا تدخل في الربح).
 */

interface IndirectCostsTabProps {
	organizationId: string;
	studyId: string;
}

interface SupervisionRow {
	id: string;
	role: string;
	count: string;
	monthlySalary: string;
	months: string;
}

interface OperatingRow {
	id: string;
	label: string;
	amount: string;
}

// افتراضيات سعودية شائعة: سلك تربيط ~12 كجم/طن حديد، مسامير ~0.12 كجم/م² شدات
const DEFAULT_TIE_WIRE_KG_PER_TON = "12";
const DEFAULT_TIE_WIRE_PRICE = "7";
const DEFAULT_NAILS_KG_PER_SQM = "0.12";
const DEFAULT_NAILS_PRICE = "5";

const DEFAULT_SUPERVISION: SupervisionRow[] = [
	{ id: "sup-engineer", role: "مهندس إشراف", count: "1", monthlySalary: "8000", months: "1" },
	{ id: "sup-field", role: "مشرف ميداني", count: "1", monthlySalary: "5000", months: "1" },
];

// بنود التشغيل الشائعة — المبلغ 0 يعني غير مفعّل (لا يدخل في الإجمالي)
const DEFAULT_OPERATING: OperatingRow[] = [
	{ id: "op-housing", label: "سكن العمال", amount: "" },
	{ id: "op-food", label: "إعاشة (أكل وشرب)", amount: "" },
	{ id: "op-utilities", label: "كهرباء وماء الموقع", amount: "" },
	{ id: "op-transport", label: "نقل مواد ومعدات", amount: "" },
	{ id: "op-equipment", label: "إيجار معدات وسقالات", amount: "" },
	{ id: "op-guard", label: "حراسة الموقع", amount: "" },
	{ id: "op-fees", label: "رسوم وتصاريح", amount: "" },
	{ id: "op-insurance", label: "تأمينات", amount: "" },
	{ id: "op-waste", label: "نقل مخلفات", amount: "" },
	{ id: "op-misc", label: "نثريات", amount: "" },
];

const num = (v: string) => Number(v) || 0;

export function IndirectCostsTab({
	organizationId,
	studyId,
}: IndirectCostsTabProps) {
	const queryClient = useQueryClient();

	const { data: savedBreakdown, isLoading } = useQuery(
		orpc.pricing.studies.laborBreakdown.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const { data: structuralItems } = useQuery(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: { costStudyId: studyId, organizationId },
		}),
	);

	// كميات مرجعية من BOQ: أطنان الحديد + مساحة الشدات
	const { steelTons, formworkArea } = useMemo(() => {
		const raw = (structuralItems as any[]) ?? [];
		if (raw.length === 0) return { steelTons: 0, formworkArea: 0 };
		try {
			const items = raw.map((item: any) => ({
				id: item.id,
				category: item.category,
				subCategory: item.subCategory ?? undefined,
				name: item.name,
				quantity: item.quantity ?? 1,
				dimensions: (item.dimensions as Record<string, number>) ?? {},
				concreteVolume: Number(item.concreteVolume ?? 0),
				steelWeight: Number(item.steelWeight ?? 0),
				totalCost: Number(item.totalCost ?? 0),
			}));
			const summary = aggregateBOQ(items as any);
			return {
				steelTons: summary.grandTotals.rebar / 1000,
				formworkArea: summary.grandTotals.formwork,
			};
		} catch {
			return { steelTons: 0, formworkArea: 0 };
		}
	}, [structuralItems]);

	// ─── State ───
	const [tieWireEnabled, setTieWireEnabled] = useState(true);
	const [tieWireKgPerTon, setTieWireKgPerTon] = useState(DEFAULT_TIE_WIRE_KG_PER_TON);
	const [tieWirePricePerKg, setTieWirePricePerKg] = useState(DEFAULT_TIE_WIRE_PRICE);
	const [nailsEnabled, setNailsEnabled] = useState(true);
	const [nailsKgPerSqm, setNailsKgPerSqm] = useState(DEFAULT_NAILS_KG_PER_SQM);
	const [nailsPricePerKg, setNailsPricePerKg] = useState(DEFAULT_NAILS_PRICE);
	const [supervision, setSupervision] = useState<SupervisionRow[]>(DEFAULT_SUPERVISION);
	const [operating, setOperating] = useState<OperatingRow[]>(DEFAULT_OPERATING);
	const [hydrated, setHydrated] = useState(false);

	// تحميل القيم المحفوظة مرة واحدة
	useEffect(() => {
		if (hydrated || savedBreakdown === undefined) return;
		const saved = (savedBreakdown as any)?.indirectCosts;
		if (saved) {
			if (saved.tieWireEnabled !== undefined) setTieWireEnabled(saved.tieWireEnabled !== false);
			if (saved.tieWireKgPerTon != null) setTieWireKgPerTon(String(saved.tieWireKgPerTon));
			if (saved.tieWirePricePerKg != null) setTieWirePricePerKg(String(saved.tieWirePricePerKg));
			if (saved.nailsEnabled !== undefined) setNailsEnabled(saved.nailsEnabled !== false);
			if (saved.nailsKgPerSqm != null) setNailsKgPerSqm(String(saved.nailsKgPerSqm));
			if (saved.nailsPricePerKg != null) setNailsPricePerKg(String(saved.nailsPricePerKg));
			if (Array.isArray(saved.supervision) && saved.supervision.length > 0) {
				setSupervision(
					saved.supervision.map((row: any) => ({
						id: row.id,
						role: row.role ?? "",
						count: String(row.count ?? ""),
						monthlySalary: String(row.monthlySalary ?? ""),
						months: String(row.months ?? ""),
					})),
				);
			}
			if (Array.isArray(saved.operating) && saved.operating.length > 0) {
				setOperating(
					saved.operating.map((row: any) => ({
						id: row.id,
						label: row.label ?? "",
						amount: row.amount ? String(row.amount) : "",
					})),
				);
			}
		}
		setHydrated(true);
	}, [savedBreakdown, hydrated]);

	// ─── Live totals ───
	const tieWireTotal = tieWireEnabled
		? steelTons * num(tieWireKgPerTon) * num(tieWirePricePerKg)
		: 0;
	const nailsTotal = nailsEnabled
		? formworkArea * num(nailsKgPerSqm) * num(nailsPricePerKg)
		: 0;
	const supervisionTotal = supervision.reduce(
		(sum, row) => sum + num(row.count) * num(row.monthlySalary) * num(row.months),
		0,
	);
	const operatingTotal = operating.reduce((sum, row) => sum + num(row.amount), 0);
	const grandTotal = tieWireTotal + nailsTotal + supervisionTotal + operatingTotal;

	// ─── Save ───
	const setBreakdownMutation = useMutation(
		orpc.pricing.studies.laborBreakdown.set.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ المصاريف غير المباشرة");
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "laborBreakdown"]],
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.studies.costing.key(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.studies.markup.key(),
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء الحفظ");
			},
		}),
	);

	const handleSave = () => {
		(setBreakdownMutation as any).mutate({
			organizationId,
			studyId,
			breakdown: {
				...((savedBreakdown as any) ?? {}),
				indirectCosts: {
					tieWireEnabled,
					tieWireKgPerTon: num(tieWireKgPerTon),
					tieWirePricePerKg: num(tieWirePricePerKg),
					nailsEnabled,
					nailsKgPerSqm: num(nailsKgPerSqm),
					nailsPricePerKg: num(nailsPricePerKg),
					steelTons,
					formworkArea,
					supervision: supervision
						.filter((row) => row.role.trim() !== "")
						.map((row) => ({
							id: row.id,
							role: row.role,
							count: num(row.count),
							monthlySalary: num(row.monthlySalary),
							months: num(row.months),
						})),
					operating: operating
						.filter((row) => row.label.trim() !== "")
						.map((row) => ({
							id: row.id,
							label: row.label,
							amount: num(row.amount),
						})),
				},
			},
		});
	};

	// ─── Row helpers ───
	const updateSupervisionRow = (id: string, patch: Partial<SupervisionRow>) => {
		setSupervision((prev) =>
			prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		);
	};
	const updateOperatingRow = (id: string, patch: Partial<OperatingRow>) => {
		setOperating((prev) =>
			prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		);
	};

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4" dir="rtl">
			{/* ─── بطاقة الإجمالي ─── */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
				<div className="rounded-xl border border-border bg-card p-3">
					<div className="flex items-center gap-2 mb-1">
						<Cable className="h-4 w-4 text-chart-4" />
						<span className="text-xs font-medium">سلك ومسمار</span>
					</div>
					<p className="text-sm sm:text-lg font-bold" dir="ltr">
						{formatNum(tieWireTotal + nailsTotal)} <span className="text-xs font-normal text-muted-foreground">ر.س</span>
					</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-3">
					<div className="flex items-center gap-2 mb-1">
						<HardHat className="h-4 w-4 text-chart-1" />
						<span className="text-xs font-medium">الإشراف</span>
					</div>
					<p className="text-sm sm:text-lg font-bold" dir="ltr">
						{formatNum(supervisionTotal)} <span className="text-xs font-normal text-muted-foreground">ر.س</span>
					</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-3">
					<div className="flex items-center gap-2 mb-1">
						<Home className="h-4 w-4 text-chart-2" />
						<span className="text-xs font-medium">التشغيل</span>
					</div>
					<p className="text-sm sm:text-lg font-bold" dir="ltr">
						{formatNum(operatingTotal)} <span className="text-xs font-normal text-muted-foreground">ر.س</span>
					</p>
				</div>
				<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
					<div className="flex items-center gap-2 mb-1">
						<Wallet className="h-4 w-4 text-primary" />
						<span className="text-xs font-medium">الإجمالي</span>
					</div>
					<p className="text-sm sm:text-lg font-bold text-primary" dir="ltr">
						{formatNum(grandTotal)} <span className="text-xs font-normal">ر.س</span>
					</p>
				</div>
			</div>

			{/* ─── سلك التربيط والمسامير ─── */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
					<Cable className="h-4 w-4 text-chart-4" />
					<h4 className="font-semibold">سلك التربيط والمسامير</h4>
					<span className="text-xs text-muted-foreground">
						تُحسب آلياً من كميات الحديد والشدات في BOQ
					</span>
				</div>
				<div className="p-4 space-y-4">
					{/* سلك التربيط */}
					<div className="flex flex-wrap items-end gap-3">
						<div className="flex items-center gap-2 min-w-[140px]">
							<Switch checked={tieWireEnabled} onCheckedChange={setTieWireEnabled} />
							<span className="text-sm font-medium">سلك تربيط</span>
						</div>
						<div className="w-28">
							<label className="text-xs text-muted-foreground">كجم / طن حديد</label>
							<Input
								type="number"
								inputMode="decimal"
								value={tieWireKgPerTon}
								onChange={(e) => setTieWireKgPerTon(e.target.value)}
								disabled={!tieWireEnabled}
								className="h-9"
							/>
						</div>
						<div className="w-28">
							<label className="text-xs text-muted-foreground">سعر الكجم (ر.س)</label>
							<Input
								type="number"
								inputMode="decimal"
								value={tieWirePricePerKg}
								onChange={(e) => setTieWirePricePerKg(e.target.value)}
								disabled={!tieWireEnabled}
								className="h-9"
							/>
						</div>
						<div className="text-xs text-muted-foreground pb-2" dir="ltr">
							{formatNum(steelTons)} طن × {tieWireKgPerTon || 0} كجم × {tieWirePricePerKg || 0} ر.س
						</div>
						<div className="ms-auto pb-1.5 font-semibold text-sm" dir="ltr">
							{formatNum(tieWireTotal)} ر.س
						</div>
					</div>

					{/* المسامير */}
					<div className="flex flex-wrap items-end gap-3 border-t border-border/60 pt-3">
						<div className="flex items-center gap-2 min-w-[140px]">
							<Switch checked={nailsEnabled} onCheckedChange={setNailsEnabled} />
							<span className="text-sm font-medium">مسامير شدات</span>
						</div>
						<div className="w-28">
							<label className="text-xs text-muted-foreground">كجم / م² شدات</label>
							<Input
								type="number"
								inputMode="decimal"
								value={nailsKgPerSqm}
								onChange={(e) => setNailsKgPerSqm(e.target.value)}
								disabled={!nailsEnabled}
								className="h-9"
							/>
						</div>
						<div className="w-28">
							<label className="text-xs text-muted-foreground">سعر الكجم (ر.س)</label>
							<Input
								type="number"
								inputMode="decimal"
								value={nailsPricePerKg}
								onChange={(e) => setNailsPricePerKg(e.target.value)}
								disabled={!nailsEnabled}
								className="h-9"
							/>
						</div>
						<div className="text-xs text-muted-foreground pb-2" dir="ltr">
							{formatNum(formworkArea)} م² × {nailsKgPerSqm || 0} كجم × {nailsPricePerKg || 0} ر.س
						</div>
						<div className="ms-auto pb-1.5 font-semibold text-sm" dir="ltr">
							{formatNum(nailsTotal)} ر.س
						</div>
					</div>
				</div>
			</div>

			{/* ─── الإشراف الهندسي والميداني ─── */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
					<HardHat className="h-4 w-4 text-chart-1" />
					<h4 className="font-semibold">الإشراف الهندسي والميداني</h4>
					<span className="text-xs text-muted-foreground">العدد × الراتب الشهري × عدد الأشهر</span>
				</div>
				<div className="p-4 space-y-3">
					{supervision.map((row) => {
						const rowTotal = num(row.count) * num(row.monthlySalary) * num(row.months);
						return (
							<div key={row.id} className="flex flex-wrap items-end gap-3">
								<div className="flex-1 min-w-[140px]">
									<label className="text-xs text-muted-foreground">الوظيفة</label>
									<Input
										value={row.role}
										onChange={(e) => updateSupervisionRow(row.id, { role: e.target.value })}
										className="h-9"
									/>
								</div>
								<div className="w-20">
									<label className="text-xs text-muted-foreground">العدد</label>
									<Input
										type="number"
										inputMode="numeric"
										value={row.count}
										onChange={(e) => updateSupervisionRow(row.id, { count: e.target.value })}
										className="h-9"
									/>
								</div>
								<div className="w-28">
									<label className="text-xs text-muted-foreground">الراتب الشهري</label>
									<Input
										type="number"
										inputMode="decimal"
										value={row.monthlySalary}
										onChange={(e) => updateSupervisionRow(row.id, { monthlySalary: e.target.value })}
										className="h-9"
									/>
								</div>
								<div className="w-20">
									<label className="text-xs text-muted-foreground">الأشهر</label>
									<Input
										type="number"
										inputMode="decimal"
										value={row.months}
										onChange={(e) => updateSupervisionRow(row.id, { months: e.target.value })}
										className="h-9"
									/>
								</div>
								<div className="ms-auto pb-1.5 font-semibold text-sm min-w-[90px] text-start" dir="ltr">
									{formatNum(rowTotal)} ر.س
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 text-destructive"
									onClick={() =>
										setSupervision((prev) => prev.filter((r) => r.id !== row.id))
									}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						);
					})}
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5 rounded-lg"
						onClick={() =>
							setSupervision((prev) => [
								...prev,
								{
									id: `sup-${Date.now()}`,
									role: "",
									count: "1",
									monthlySalary: "",
									months: "1",
								},
							])
						}
					>
						<Plus className="h-3.5 w-3.5" />
						إضافة وظيفة
					</Button>
				</div>
			</div>

			{/* ─── مصاريف التشغيل ─── */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
					<Home className="h-4 w-4 text-chart-2" />
					<h4 className="font-semibold">مصاريف التشغيل</h4>
					<span className="text-xs text-muted-foreground">
						اترك المبلغ فارغاً إن لم ينطبق البند
					</span>
				</div>
				<div className="p-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
						{operating.map((row) => (
							<div key={row.id} className="flex items-end gap-2">
								<div className="flex-1">
									<label className="text-xs text-muted-foreground">البند</label>
									<Input
										value={row.label}
										onChange={(e) => updateOperatingRow(row.id, { label: e.target.value })}
										className="h-9"
									/>
								</div>
								<div className="w-32">
									<label className="text-xs text-muted-foreground">المبلغ (ر.س)</label>
									<Input
										type="number"
										inputMode="decimal"
										value={row.amount}
										onChange={(e) => updateOperatingRow(row.id, { amount: e.target.value })}
										className="h-9"
									/>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 text-destructive shrink-0"
									onClick={() =>
										setOperating((prev) => prev.filter((r) => r.id !== row.id))
									}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5 rounded-lg mt-3"
						onClick={() =>
							setOperating((prev) => [
								...prev,
								{ id: `op-${Date.now()}`, label: "", amount: "" },
							])
						}
					>
						<Plus className="h-3.5 w-3.5" />
						إضافة بند تشغيل
					</Button>
				</div>
			</div>

			{/* ─── حفظ ─── */}
			<Button
				onClick={handleSave}
				disabled={setBreakdownMutation.isPending}
				className="w-full gap-2 py-5 text-sm sm:text-base rounded-xl"
				size="lg"
			>
				{setBreakdownMutation.isPending ? (
					<Loader2 className="h-5 w-5 animate-spin" />
				) : (
					<Save className="h-5 w-5" />
				)}
				حفظ المصاريف غير المباشرة
			</Button>

			<p className="text-xs text-muted-foreground text-center">
				تُضاف هذه المصاريف إلى التكلفة الإجمالية قبل هامش الربح وقبل ضريبة
				القيمة المضافة — الضريبة لا تدخل في حساب الربح.
			</p>
		</div>
	);
}
