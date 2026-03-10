"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
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
import { Textarea } from "@ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateBOQItem } from "@saas/projects/hooks/use-project-boq";

interface CreateItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

export function CreateItemDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: CreateItemDialogProps) {
	const t = useTranslations("projectBoq");
	const createMutation = useCreateBOQItem();

	const [form, setForm] = useState({
		section: "GENERAL",
		code: "",
		description: "",
		specifications: "",
		unit: "",
		quantity: "",
		unitPrice: "",
		category: "",
		notes: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.description.trim() || !form.unit.trim()) return;

		try {
			await createMutation.mutateAsync({
				organizationId,
				projectId,
				section: form.section as any,
				code: form.code || undefined,
				description: form.description,
				specifications: form.specifications || undefined,
				unit: form.unit,
				quantity: Number(form.quantity) || 0,
				unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
				category: form.category || undefined,
				notes: form.notes || undefined,
			});
			toast.success(t("toast.itemCreated"));
			onOpenChange(false);
			setForm({
				section: "GENERAL",
				code: "",
				description: "",
				specifications: "",
				unit: "",
				quantity: "",
				unitPrice: "",
				category: "",
				notes: "",
			});
		} catch {
			// Error handled by mutation
		}
	};

	const updateField = (field: string, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden">
				<DialogHeader className="bg-white dark:bg-slate-900 border-b px-5 py-4">
					<DialogTitle>{t("createDialog.title")}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
						{/* Section */}
						<div className="space-y-1.5">
							<Label>{t("createDialog.section")}</Label>
							<Select value={form.section} onValueChange={(v) => updateField("section", v)}>
								<SelectTrigger className="rounded-xl h-10">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GENERAL">{t("section.GENERAL")}</SelectItem>
									<SelectItem value="STRUCTURAL">{t("section.STRUCTURAL")}</SelectItem>
									<SelectItem value="FINISHING">{t("section.FINISHING")}</SelectItem>
									<SelectItem value="MEP">{t("section.MEP")}</SelectItem>
									<SelectItem value="LABOR">{t("section.LABOR")}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Code + Category row */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>{t("createDialog.code")}</Label>
								<Input
									placeholder={t("createDialog.codePlaceholder")}
									value={form.code}
									onChange={(e) => updateField("code", e.target.value)}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1.5">
								<Label>{t("createDialog.category")}</Label>
								<Input
									value={form.category}
									onChange={(e) => updateField("category", e.target.value)}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Description */}
						<div className="space-y-1.5">
							<Label>{t("createDialog.description")} *</Label>
							<Textarea
								placeholder={t("createDialog.descriptionPlaceholder")}
								value={form.description}
								onChange={(e) => updateField("description", e.target.value)}
								className="rounded-xl min-h-[80px]"
								required
							/>
						</div>

						{/* Specifications */}
						<div className="space-y-1.5">
							<Label>{t("createDialog.specifications")}</Label>
							<Textarea
								placeholder={t("createDialog.specificationsPlaceholder")}
								value={form.specifications}
								onChange={(e) => updateField("specifications", e.target.value)}
								className="rounded-xl min-h-[60px]"
							/>
						</div>

						{/* Unit + Quantity + UnitPrice */}
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-1.5">
								<Label>{t("createDialog.unit")} *</Label>
								<Input
									placeholder={t("createDialog.unitPlaceholder")}
									value={form.unit}
									onChange={(e) => updateField("unit", e.target.value)}
									className="rounded-xl h-10"
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label>{t("createDialog.quantity")}</Label>
								<Input
									type="number"
									min="0"
									step="any"
									value={form.quantity}
									onChange={(e) => updateField("quantity", e.target.value)}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1.5">
								<Label>{t("createDialog.unitPrice")}</Label>
								<Input
									type="number"
									min="0"
									step="any"
									placeholder={t("createDialog.unitPricePlaceholder")}
									value={form.unitPrice}
									onChange={(e) => updateField("unitPrice", e.target.value)}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-1.5">
							<Label>{t("createDialog.notes")}</Label>
							<Textarea
								value={form.notes}
								onChange={(e) => updateField("notes", e.target.value)}
								className="rounded-xl min-h-[60px]"
							/>
						</div>
					</div>

					<div className="bg-slate-50 dark:bg-slate-800/50 border-t px-5 py-3 flex gap-3 justify-end">
						<Button
							type="button"
							variant="outline"
							className="rounded-xl"
							onClick={() => onOpenChange(false)}
						>
							{t("actions.cancel")}
						</Button>
						<Button
							type="submit"
							className="rounded-xl"
							disabled={createMutation.isPending || !form.description.trim() || !form.unit.trim()}
						>
							{createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
							{t("createDialog.create")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
