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

interface PRFormProps {
	organizationId: string;
	organizationSlug: string;
}

interface PRItem {
	name: string;
	description: string;
	unit: string;
	quantity: number;
	estimatedPrice: number;
}

export function PRForm({ organizationId, organizationSlug }: PRFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/procurement/requests`;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [projectId, setProjectId] = useState("");
	const [priority, setPriority] = useState("MEDIUM");
	const [requiredDate, setRequiredDate] = useState("");
	const [notes, setNotes] = useState("");
	const [items, setItems] = useState<PRItem[]>([
		{ name: "", description: "", unit: "", quantity: 1, estimatedPrice: 0 },
	]);

	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({ input: { organizationId } }),
	);
	const projects = projectsData?.projects ?? [];

	const addItem = () => {
		setItems([...items, { name: "", description: "", unit: "", quantity: 1, estimatedPrice: 0 }]);
	};

	const removeItem = (index: number) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index));
		}
	};

	const updateItem = (index: number, field: keyof PRItem, value: string | number) => {
		const updated = [...items];
		(updated[index] as any)[field] = value;
		setItems(updated);
	};

	const estimatedTotal = items.reduce(
		(sum, item) => sum + item.quantity * item.estimatedPrice,
		0,
	);

	const mutation = useMutation({
		mutationFn: async () => {
			return orpcClient.procurement.purchaseRequests.create({
				organizationId,
				projectId,
				title,
				description: description || undefined,
				priority: priority as any,
				requiredDate: requiredDate ? new Date(requiredDate) : undefined,
				notes: notes || undefined,
				items: items.map((item) => ({
					name: item.name,
					description: item.description || undefined,
					unit: item.unit,
					quantity: item.quantity,
					estimatedPrice: item.estimatedPrice,
				})),
			});
		},
		onSuccess: () => {
			toast.success(t("procurement.requestSaved"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			router.push(basePath);
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	const canSubmit = title && projectId && items.every((i) => i.name && i.unit && i.quantity > 0);

	return (
		<div className="max-w-3xl space-y-6">
			{/* Basic Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("procurement.request")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("procurement.requestTitle")} *</Label>
							<Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.project")} *</Label>
							<Select value={projectId} onValueChange={setProjectId}>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("procurement.selectProject")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{projects.map((p) => (
										<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("procurement.priorities.MEDIUM")}</Label>
							<Select value={priority} onValueChange={setPriority}>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
										<SelectItem key={p} value={p}>{t(`procurement.priorities.${p}`)}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.requiredDate")}</Label>
							<Input
								type="date"
								value={requiredDate}
								onChange={(e) => setRequiredDate(e.target.value)}
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>{t("procurement.requestDescription")}</Label>
						<Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" rows={2} />
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
								<span className="text-sm font-medium text-muted-foreground">
									{t("procurement.items")} #{index + 1}
								</span>
								{items.length > 1 && (
									<Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 h-8">
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
								<div className="sm:col-span-2 space-y-1">
									<Label className="text-xs">{t("procurement.itemName")} *</Label>
									<Input
										value={item.name}
										onChange={(e) => updateItem(index, "name", e.target.value)}
										className="rounded-xl"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs">{t("procurement.unit")} *</Label>
									<Input
										value={item.unit}
										onChange={(e) => updateItem(index, "unit", e.target.value)}
										className="rounded-xl"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs">{t("procurement.quantity")} *</Label>
									<Input
										type="number"
										min={1}
										value={item.quantity}
										onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
										className="rounded-xl"
										dir="ltr"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div className="space-y-1">
									<Label className="text-xs">{t("procurement.estimatedPrice")}</Label>
									<Input
										type="number"
										min={0}
										value={item.estimatedPrice}
										onChange={(e) => updateItem(index, "estimatedPrice", Number(e.target.value))}
										className="rounded-xl"
										dir="ltr"
									/>
								</div>
								<div className="flex items-end text-sm font-medium">
									{t("procurement.totalPrice")}: <Currency amount={item.quantity * item.estimatedPrice} className="ms-2" />
								</div>
							</div>
						</div>
					))}

					{/* Total */}
					<div className="flex justify-end p-3 bg-muted rounded-xl">
						<span className="text-lg font-semibold">
							{t("procurement.estimatedTotal")}: <Currency amount={estimatedTotal} />
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Notes */}
			<Card className="rounded-2xl">
				<CardContent className="pt-6">
					<div className="space-y-2">
						<Label>{t("procurement.notes")}</Label>
						<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" rows={3} />
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			<div className="flex justify-end gap-3">
				<Button variant="outline" className="rounded-xl" onClick={() => router.push(basePath)}>
					{t("common.cancel")}
				</Button>
				<Button
					className="rounded-xl"
					onClick={() => mutation.mutate()}
					disabled={!canSubmit || mutation.isPending}
				>
					{mutation.isPending ? t("common.saving") : t("procurement.actions.save")}
				</Button>
			</div>
		</div>
	);
}
