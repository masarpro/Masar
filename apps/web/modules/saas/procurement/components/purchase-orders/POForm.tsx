"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Label } from "@ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";

interface POFormProps {
	organizationId: string;
	organizationSlug: string;
}

interface POItem {
	name: string;
	description: string;
	unit: string;
	quantity: number;
	unitPrice: number;
}

export function POForm({ organizationId, organizationSlug }: POFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/procurement/orders`;

	const [vendorId, setVendorId] = useState("");
	const [projectId, setProjectId] = useState("");
	const [expectedDelivery, setExpectedDelivery] = useState("");
	const [discountPercent, setDiscountPercent] = useState(0);
	const [vatPercent, setVatPercent] = useState(15);
	const [deliveryTerms, setDeliveryTerms] = useState("");
	const [notes, setNotes] = useState("");
	const [items, setItems] = useState<POItem[]>([
		{ name: "", description: "", unit: "", quantity: 1, unitPrice: 0 },
	]);

	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({ input: { organizationId } }),
	);
	const { data: vendorsData } = useQuery(
		orpc.procurement.vendors.list.queryOptions({ input: { organizationId } }),
	);

	const projects = projectsData?.projects ?? [];
	const vendors = vendorsData ?? [];

	const addItem = () => {
		setItems([...items, { name: "", description: "", unit: "", quantity: 1, unitPrice: 0 }]);
	};

	const removeItem = (index: number) => {
		if (items.length > 1) setItems(items.filter((_, i) => i !== index));
	};

	const updateItem = (index: number, field: keyof POItem, value: string | number) => {
		const updated = [...items];
		(updated[index] as any)[field] = value;
		setItems(updated);
	};

	const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
	const discountAmount = subtotal * (discountPercent / 100);
	const afterDiscount = subtotal - discountAmount;
	const vatAmount = afterDiscount * (vatPercent / 100);
	const total = afterDiscount + vatAmount;

	const mutation = useMutation({
		mutationFn: async () => {
			return orpcClient.procurement.purchaseOrders.create({
				organizationId,
				vendorId,
				projectId: projectId || undefined,
				expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
				discountPercent,
				vatPercent,
				deliveryTerms: deliveryTerms || undefined,
				notes: notes || undefined,
				items: items.map((i) => ({
					name: i.name,
					description: i.description || undefined,
					unit: i.unit,
					quantity: i.quantity,
					unitPrice: i.unitPrice,
				})),
			});
		},
		onSuccess: () => {
			toast.success(t("procurement.orderSaved"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			router.push(basePath);
		},
		onError: (e: any) => toast.error(e.message),
	});

	const canSubmit = vendorId && items.every((i) => i.name && i.unit && i.quantity > 0 && i.unitPrice > 0);

	return (
		<div className="max-w-3xl space-y-6">
			<Card className="rounded-2xl">
				<CardHeader><CardTitle>{t("procurement.order")}</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("procurement.vendor")} *</Label>
							<Select value={vendorId} onValueChange={setVendorId}>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("procurement.selectVendor")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{vendors.map((v) => (
										<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.project")}</Label>
							<Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("procurement.selectProject")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">-</SelectItem>
									{projects.map((p) => (
										<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="space-y-2">
							<Label>{t("procurement.expectedDelivery")}</Label>
							<Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} className="rounded-xl" dir="ltr" />
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.discountPercent")}</Label>
							<Input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="rounded-xl" dir="ltr" />
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.vatPercent")}</Label>
							<Input type="number" min={0} max={100} value={vatPercent} onChange={(e) => setVatPercent(Number(e.target.value))} className="rounded-xl" dir="ltr" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Items */}
			<Card className="rounded-2xl">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>{t("procurement.items")}</CardTitle>
					<Button variant="outline" size="sm" className="rounded-xl" onClick={addItem}>
						<Plus className="me-2 h-4 w-4" />
						{t("procurement.addItem")}
					</Button>
				</CardHeader>
				<CardContent className="space-y-4">
					{items.map((item, index) => (
						<div key={index} className="p-4 border rounded-xl space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
								{items.length > 1 && (
									<Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 h-8">
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
								<div className="sm:col-span-2 space-y-1">
									<Label className="text-xs">{t("procurement.itemName")} *</Label>
									<Input value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} className="rounded-xl" />
								</div>
								<div className="space-y-1">
									<Label className="text-xs">{t("procurement.unit")} *</Label>
									<Input value={item.unit} onChange={(e) => updateItem(index, "unit", e.target.value)} className="rounded-xl" />
								</div>
								<div className="space-y-1">
									<Label className="text-xs">{t("procurement.quantity")} *</Label>
									<Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} className="rounded-xl" dir="ltr" />
								</div>
								<div className="space-y-1">
									<Label className="text-xs">{t("procurement.unitPrice")} *</Label>
									<Input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))} className="rounded-xl" dir="ltr" />
								</div>
							</div>
						</div>
					))}

					{/* Totals */}
					<div className="space-y-2 p-4 bg-muted rounded-xl text-sm">
						<div className="flex justify-between"><span>{t("procurement.subtotal")}</span><Currency amount={subtotal} /></div>
						{discountPercent > 0 && (
							<div className="flex justify-between text-red-600"><span>{t("procurement.discount")} ({discountPercent}%)</span><span>-<Currency amount={discountAmount} /></span></div>
						)}
						<div className="flex justify-between"><span>{t("procurement.vat")} ({vatPercent}%)</span><Currency amount={vatAmount} /></div>
						<div className="flex justify-between text-lg font-semibold border-t pt-2"><span>{t("procurement.grandTotal")}</span><Currency amount={total} /></div>
					</div>
				</CardContent>
			</Card>

			<Card className="rounded-2xl">
				<CardContent className="pt-6 space-y-4">
					<div className="space-y-2">
						<Label>{t("procurement.deliveryTerms")}</Label>
						<Textarea value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} className="rounded-xl" rows={2} />
					</div>
					<div className="space-y-2">
						<Label>{t("procurement.notes")}</Label>
						<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" rows={2} />
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end gap-3">
				<Button variant="outline" className="rounded-xl" onClick={() => router.push(basePath)}>
					{t("common.cancel")}
				</Button>
				<Button className="rounded-xl" onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
					{mutation.isPending ? t("common.saving") : t("procurement.actions.save")}
				</Button>
			</div>
		</div>
	);
}
