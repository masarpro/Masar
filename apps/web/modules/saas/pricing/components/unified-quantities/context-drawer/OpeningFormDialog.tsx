"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Switch } from "@ui/components/switch";
import { useEffect, useState } from "react";
import type { ContextOpening } from "../hooks/useContext";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	costStudyId: string;
	organizationId: string;
	opening: ContextOpening | null;
	onSave: (input: Record<string, unknown>) => Promise<unknown>;
}

const TYPES = [
	{ value: "door", label: "باب" },
	{ value: "window", label: "نافذة" },
	{ value: "arch", label: "قوس" },
	{ value: "skylight", label: "سكاي لايت" },
	{ value: "custom", label: "مخصّص" },
];

interface FormState {
	name: string;
	openingType: string;
	width: string;
	height: string;
	count: string;
	isExterior: boolean;
	deductFromInteriorFinishes: boolean;
}

const blank: FormState = {
	name: "",
	openingType: "door",
	width: "0.9",
	height: "2.1",
	count: "1",
	isExterior: false,
	deductFromInteriorFinishes: true,
};

const fromOpening = (o: ContextOpening | null): FormState =>
	o
		? {
				name: o.name,
				openingType: o.openingType,
				width: String(o.width),
				height: String(o.height),
				count: String(o.count),
				isExterior: o.isExterior,
				deductFromInteriorFinishes: o.deductFromInteriorFinishes,
			}
		: blank;

export function OpeningFormDialog({
	open,
	onOpenChange,
	costStudyId,
	organizationId,
	opening,
	onSave,
}: Props) {
	const [form, setForm] = useState<FormState>(fromOpening(opening));
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) setForm(fromOpening(opening));
	}, [open, opening]);

	const update = (patch: Partial<FormState>) =>
		setForm((prev) => ({ ...prev, ...patch }));

	const width = Number.parseFloat(form.width);
	const height = Number.parseFloat(form.height);
	const count = Number.parseInt(form.count, 10);
	const valid =
		form.name.trim().length > 0 &&
		Number.isFinite(width) &&
		width > 0 &&
		Number.isFinite(height) &&
		height > 0 &&
		Number.isFinite(count) &&
		count >= 1;

	const handleSubmit = async () => {
		if (!valid) return;
		setSaving(true);
		try {
			await onSave({
				id: opening?.id,
				costStudyId,
				organizationId,
				name: form.name.trim(),
				openingType: form.openingType,
				width,
				height,
				count,
				isExterior: form.isExterior,
				deductFromInteriorFinishes: form.deductFromInteriorFinishes,
			});
			onOpenChange(false);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{opening ? "تعديل فتحة" : "إضافة فتحة"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="op-name" className="text-xs">
							الاسم
						</Label>
						<Input
							id="op-name"
							value={form.name}
							onChange={(e) => update({ name: e.target.value })}
							placeholder="مثال: باب الصالة"
							autoFocus
						/>
					</div>

					<div className="grid grid-cols-4 gap-3">
						<div className="col-span-1 space-y-1.5">
							<Label htmlFor="op-type" className="text-xs">
								النوع
							</Label>
							<Select
								value={form.openingType}
								onValueChange={(v) => update({ openingType: v })}
							>
								<SelectTrigger id="op-type" className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TYPES.map((t) => (
										<SelectItem key={t.value} value={t.value}>
											{t.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="op-w" className="text-xs">
								العرض (م)
							</Label>
							<Input
								id="op-w"
								type="text"
								inputMode="decimal"
								value={form.width}
								onChange={(e) => update({ width: e.target.value })}
								className="tabular-nums"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="op-h" className="text-xs">
								الارتفاع (م)
							</Label>
							<Input
								id="op-h"
								type="text"
								inputMode="decimal"
								value={form.height}
								onChange={(e) => update({ height: e.target.value })}
								className="tabular-nums"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="op-c" className="text-xs">
								العدد
							</Label>
							<Input
								id="op-c"
								type="text"
								inputMode="numeric"
								value={form.count}
								onChange={(e) => update({ count: e.target.value })}
								className="tabular-nums"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="flex items-center justify-between rounded-md border px-3 py-2">
							<Label htmlFor="op-ext" className="text-xs">
								خارجية
							</Label>
							<Switch
								id="op-ext"
								checked={form.isExterior}
								onCheckedChange={(v) => update({ isExterior: v })}
							/>
						</div>
						<div className="flex items-center justify-between rounded-md border px-3 py-2">
							<Label htmlFor="op-deduct" className="text-xs">
								خصم من التشطيبات الداخلية
							</Label>
							<Switch
								id="op-deduct"
								checked={form.deductFromInteriorFinishes}
								onCheckedChange={(v) =>
									update({ deductFromInteriorFinishes: v })
								}
							/>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						المساحة المحسوبة:{" "}
						<span className="tabular-nums">
							{Number.isFinite(width * height)
								? (width * height).toFixed(2)
								: "0.00"}
						</span>{" "}
						م² ×{" "}
						<span className="tabular-nums">
							{Number.isFinite(count) ? count : 0}
						</span>
					</p>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						إلغاء
					</Button>
					<Button onClick={handleSubmit} disabled={saving || !valid}>
						{saving ? "جاري الحفظ..." : "حفظ"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
