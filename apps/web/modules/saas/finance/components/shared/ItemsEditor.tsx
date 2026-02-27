"use client";

import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Plus, Trash2 } from "lucide-react";
import { Currency } from "./Currency";

const UNIT_KEYS = [
	"m", "m2", "m3", "ton", "kg", "liter",
	"piece", "lumpsum", "workday", "workhour",
	"trip", "load", "roll", "carton", "set", "service",
] as const;

const UNIT_VALUES: Record<string, string> = {
	m: "م",
	m2: "م²",
	m3: "م³",
	ton: "طن",
	kg: "كجم",
	liter: "لتر",
	piece: "قطعة",
	lumpsum: "مقطوعية",
	workday: "يوم عمل",
	workhour: "ساعة عمل",
	trip: "رحلة",
	load: "حمولة",
	roll: "لفة",
	carton: "كرتون",
	set: "مجموعة",
	service: "خدمة",
};

interface Item {
	id: string;
	description: string;
	quantity: number;
	unit: string;
	unitPrice: number;
}

interface ItemsEditorProps {
	items: Item[];
	onChange: (items: Item[]) => void;
	readOnly?: boolean;
}

export function ItemsEditor({ items, onChange, readOnly = false }: ItemsEditorProps) {
	const t = useTranslations();

	const units = UNIT_KEYS.map((key) => ({
		value: UNIT_VALUES[key],
		label: t(`finance.units.${key}`),
	}));

	const addItem = () => {
		const newItem: Item = {
			id: Math.random().toString(36).substring(7),
			description: "",
			quantity: 1,
			unit: "",
			unitPrice: 0,
		};
		onChange([...items, newItem]);
	};

	const updateItem = (id: string, updates: Partial<Item>) => {
		onChange(
			items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
		);
	};

	const removeItem = (id: string) => {
		if (items.length > 1) {
			onChange(items.filter((item) => item.id !== id));
		}
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="hidden sm:grid sm:grid-cols-12 gap-3 px-2 text-sm font-medium text-slate-500">
				<div className="col-span-5">{t("finance.items.description")}</div>
				<div className="col-span-2 text-center">{t("finance.items.quantity")}</div>
				<div className="col-span-1 text-center">{t("finance.items.unit")}</div>
				<div className="col-span-2 text-center">{t("finance.items.unitPrice")}</div>
				<div className="col-span-2 text-center">{t("finance.items.total")}</div>
			</div>

			{/* Items */}
			<div className="space-y-3">
				{items.map((item) => (
					<div
						key={item.id}
						className="grid gap-3 sm:grid-cols-12 items-start p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"
					>
						{/* Description */}
						<div className="sm:col-span-5">
							<span className="text-xs text-slate-500 sm:hidden mb-1 block">{t("finance.items.description")}</span>
							<Input
								value={item.description}
								onChange={(e) =>
									updateItem(item.id, { description: e.target.value })
								}
								placeholder={t("finance.items.descriptionPlaceholder")}
								disabled={readOnly}
								className="rounded-lg"
							/>
						</div>

						{/* Quantity */}
						<div className="sm:col-span-2">
							<span className="text-xs text-slate-500 sm:hidden mb-1 block">{t("finance.items.quantity")}</span>
							<Input
								type="number"
								min="0"
								step="0.01"
								value={item.quantity}
								onChange={(e) =>
									updateItem(item.id, { quantity: Number(e.target.value) })
								}
								disabled={readOnly}
								className="rounded-lg text-center"
							/>
						</div>

						{/* Unit */}
						<div className="sm:col-span-1">
							<span className="text-xs text-slate-500 sm:hidden mb-1 block">{t("finance.items.unit")}</span>
							{readOnly ? (
								<Input
									value={item.unit}
									disabled
									className="rounded-lg text-center"
								/>
							) : (
								<Select
									value={item.unit || "_empty"}
									onValueChange={(v) => updateItem(item.id, { unit: v === "_empty" ? "" : v })}
								>
									<SelectTrigger className="rounded-lg h-10 text-xs px-1">
										<SelectValue placeholder={t("finance.items.unitPlaceholder")} />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="_empty">-</SelectItem>
										{units.map((u) => (
											<SelectItem key={u.value} value={u.value}>
												{u.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						{/* Unit Price */}
						<div className="sm:col-span-2">
							<span className="text-xs text-slate-500 sm:hidden mb-1 block">{t("finance.items.unitPrice")}</span>
							<Input
								type="number"
								min="0"
								step="0.01"
								value={item.unitPrice}
								onChange={(e) =>
									updateItem(item.id, { unitPrice: Number(e.target.value) })
								}
								disabled={readOnly}
								className="rounded-lg text-center"
							/>
						</div>

						{/* Total */}
						<div className="sm:col-span-2 flex items-center justify-between sm:justify-center gap-2">
							<div>
								<span className="text-xs text-slate-500 sm:hidden mb-1 block">{t("finance.items.total")}</span>
								<span className="font-semibold text-slate-900 dark:text-slate-100">
									<Currency amount={item.quantity * item.unitPrice} />
								</span>
							</div>
							{!readOnly && items.length > 1 && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeItem(item.id)}
									className="h-8 w-8 text-slate-400 hover:text-red-500"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Add Item Button */}
			{!readOnly && (
				<Button
					type="button"
					variant="outline"
					onClick={addItem}
					className="w-full rounded-xl border-dashed"
				>
					<Plus className="h-4 w-4 me-2" />
					{t("finance.items.add")}
				</Button>
			)}
		</div>
	);
}
