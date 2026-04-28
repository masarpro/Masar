"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import type { ContextSpace } from "../hooks/useContext";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	costStudyId: string;
	organizationId: string;
	space: ContextSpace | null;
	onSave: (input: Record<string, unknown>) => Promise<unknown>;
}

const SPACE_TYPES: Array<{ value: string; label: string }> = [
	{ value: "room", label: "غرفة" },
	{ value: "corridor", label: "ممر" },
	{ value: "stairs", label: "سلالم" },
	{ value: "balcony", label: "بلكونة" },
	{ value: "exterior", label: "خارجي" },
	{ value: "custom", label: "مخصّص" },
];

interface FormState {
	name: string;
	spaceType: string;
	floorLabel: string;
	length: string;
	width: string;
	height: string;
	isWetArea: boolean;
	isExterior: boolean;
}

const blank: FormState = {
	name: "",
	spaceType: "room",
	floorLabel: "",
	length: "",
	width: "",
	height: "",
	isWetArea: false,
	isExterior: false,
};

const fromSpace = (s: ContextSpace | null): FormState =>
	s
		? {
				name: s.name,
				spaceType: s.spaceType,
				floorLabel: s.floorLabel ?? "",
				length: s.length != null ? String(s.length) : "",
				width: s.width != null ? String(s.width) : "",
				height: s.height != null ? String(s.height) : "",
				isWetArea: s.isWetArea,
				isExterior: s.isExterior,
			}
		: blank;

const parseNumOrNull = (s: string) => {
	if (s.trim() === "") return null;
	const n = Number.parseFloat(s);
	return Number.isFinite(n) ? n : null;
};

export function SpaceFormDialog({
	open,
	onOpenChange,
	costStudyId,
	organizationId,
	space,
	onSave,
}: Props) {
	const [form, setForm] = useState<FormState>(fromSpace(space));
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) setForm(fromSpace(space));
	}, [open, space]);

	const update = (patch: Partial<FormState>) =>
		setForm((prev) => ({ ...prev, ...patch }));

	const handleSubmit = async () => {
		if (!form.name.trim()) return;
		setSaving(true);
		try {
			await onSave({
				id: space?.id,
				costStudyId,
				organizationId,
				name: form.name.trim(),
				spaceType: form.spaceType,
				floorLabel: form.floorLabel.trim() || null,
				length: parseNumOrNull(form.length),
				width: parseNumOrNull(form.width),
				height: parseNumOrNull(form.height),
				isWetArea: form.isWetArea,
				isExterior: form.isExterior,
				sortOrder: space?.sortOrder ?? 0,
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
					<DialogTitle>{space ? "تعديل غرفة" : "إضافة غرفة"}</DialogTitle>
					<DialogDescription>
						الأبعاد اختيارية — تستخدمها بنود الكميات لاحقاً.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="sp-name" className="text-xs">
							الاسم
						</Label>
						<Input
							id="sp-name"
							value={form.name}
							onChange={(e) => update({ name: e.target.value })}
							placeholder="مثال: المطبخ"
							autoFocus
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="sp-type" className="text-xs">
								النوع
							</Label>
							<Select
								value={form.spaceType}
								onValueChange={(v) => update({ spaceType: v })}
							>
								<SelectTrigger id="sp-type" className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SPACE_TYPES.map((t) => (
										<SelectItem key={t.value} value={t.value}>
											{t.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="sp-floor" className="text-xs">
								الدور (اختياري)
							</Label>
							<Input
								id="sp-floor"
								value={form.floorLabel}
								onChange={(e) =>
									update({ floorLabel: e.target.value })
								}
								placeholder="الأرضي / الأول..."
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="sp-l" className="text-xs">
								الطول (م)
							</Label>
							<Input
								id="sp-l"
								type="text"
								inputMode="decimal"
								value={form.length}
								onChange={(e) => update({ length: e.target.value })}
								className="tabular-nums"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="sp-w" className="text-xs">
								العرض (م)
							</Label>
							<Input
								id="sp-w"
								type="text"
								inputMode="decimal"
								value={form.width}
								onChange={(e) => update({ width: e.target.value })}
								className="tabular-nums"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="sp-h" className="text-xs">
								الارتفاع (م)
							</Label>
							<Input
								id="sp-h"
								type="text"
								inputMode="decimal"
								value={form.height}
								onChange={(e) => update({ height: e.target.value })}
								className="tabular-nums"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="flex items-center justify-between rounded-md border px-3 py-2">
							<Label htmlFor="sp-wet" className="text-xs">
								منطقة رطبة
							</Label>
							<Switch
								id="sp-wet"
								checked={form.isWetArea}
								onCheckedChange={(v) => update({ isWetArea: v })}
							/>
						</div>
						<div className="flex items-center justify-between rounded-md border px-3 py-2">
							<Label htmlFor="sp-ext" className="text-xs">
								خارجية
							</Label>
							<Switch
								id="sp-ext"
								checked={form.isExterior}
								onCheckedChange={(v) => update({ isExterior: v })}
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						إلغاء
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={saving || !form.name.trim()}
					>
						{saving ? "جاري الحفظ..." : "حفظ"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
