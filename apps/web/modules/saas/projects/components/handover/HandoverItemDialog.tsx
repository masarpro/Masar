"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import {
	Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@ui/components/dialog";
import {
	Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@ui/components/form";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";

interface HandoverItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	protocolId: string;
	editItem?: any;
	onSuccess: () => void;
}

const formSchema = z.object({
	description: z.string().min(1),
	unit: z.string().optional(),
	contractQty: z.number().optional(),
	executedQty: z.number().optional(),
	acceptedQty: z.number().optional(),
	qualityRating: z.enum(["EXCELLENT", "GOOD", "ACCEPTABLE", "NEEDS_REWORK", "REJECTED"]).optional(),
	remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function HandoverItemDialog({
	open,
	onOpenChange,
	organizationId,
	protocolId,
	editItem,
	onSuccess,
}: HandoverItemDialogProps) {
	const t = useTranslations();
	const isEdit = !!editItem;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			description: "",
			unit: "",
			remarks: "",
		},
	});

	useEffect(() => {
		if (editItem) {
			form.reset({
				description: editItem.description ?? "",
				unit: editItem.unit ?? "",
				contractQty: editItem.contractQty ? Number(editItem.contractQty) : undefined,
				executedQty: editItem.executedQty ? Number(editItem.executedQty) : undefined,
				acceptedQty: editItem.acceptedQty ? Number(editItem.acceptedQty) : undefined,
				qualityRating: editItem.qualityRating ?? undefined,
				remarks: editItem.remarks ?? "",
			});
		} else {
			form.reset({
				description: "",
				unit: "",
				remarks: "",
			});
		}
	}, [editItem, form]);

	const addMutation = useMutation({
		mutationFn: (data: FormValues) =>
			orpcClient.handover.items.add({
				organizationId,
				protocolId,
				...data,
			}),
		onSuccess: () => {
			toast.success(t("handover.items.addItem"));
			onSuccess();
		},
		onError: () => toast.error(t("common.error")),
	});

	const updateMutation = useMutation({
		mutationFn: (data: FormValues) =>
			orpcClient.handover.items.update({
				organizationId,
				protocolId,
				itemId: editItem?.id,
				...data,
			}),
		onSuccess: () => {
			toast.success(t("handover.items.editItem"));
			onSuccess();
		},
		onError: () => toast.error(t("common.error")),
	});

	const onSubmit = (data: FormValues) => {
		if (isEdit) {
			updateMutation.mutate(data);
		} else {
			addMutation.mutate(data);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? t("handover.items.editItem") : t("handover.items.addItem")}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
						<FormField control={form.control} name="description" render={({ field }: any) => (
							<FormItem>
								<FormLabel>{t("handover.items.description")}</FormLabel>
								<FormControl><Textarea rows={2} {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />

						<div className="grid grid-cols-2 gap-3">
							<FormField control={form.control} name="unit" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("handover.items.unit")}</FormLabel>
									<FormControl><Input {...field} /></FormControl>
								</FormItem>
							)} />
							<FormField control={form.control} name="contractQty" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("handover.items.contractQty")}</FormLabel>
									<FormControl><Input type="number" step="0.0001" {...field} /></FormControl>
								</FormItem>
							)} />
							<FormField control={form.control} name="executedQty" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("handover.items.executedQty")}</FormLabel>
									<FormControl><Input type="number" step="0.0001" {...field} /></FormControl>
								</FormItem>
							)} />
							<FormField control={form.control} name="acceptedQty" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("handover.items.acceptedQty")}</FormLabel>
									<FormControl><Input type="number" step="0.0001" {...field} /></FormControl>
								</FormItem>
							)} />
						</div>

						<FormField control={form.control} name="qualityRating" render={({ field }: any) => (
							<FormItem>
								<FormLabel>{t("handover.items.qualityRating")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value ?? ""}>
									<FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
									<SelectContent>
										<SelectItem value="EXCELLENT">{t("handover.qualityRatings.EXCELLENT")}</SelectItem>
										<SelectItem value="GOOD">{t("handover.qualityRatings.GOOD")}</SelectItem>
										<SelectItem value="ACCEPTABLE">{t("handover.qualityRatings.ACCEPTABLE")}</SelectItem>
										<SelectItem value="NEEDS_REWORK">{t("handover.qualityRatings.NEEDS_REWORK")}</SelectItem>
										<SelectItem value="REJECTED">{t("handover.qualityRatings.REJECTED")}</SelectItem>
									</SelectContent>
								</Select>
							</FormItem>
						)} />

						<FormField control={form.control} name="remarks" render={({ field }: any) => (
							<FormItem>
								<FormLabel>{t("handover.items.remarks")}</FormLabel>
								<FormControl><Textarea rows={2} {...field} /></FormControl>
							</FormItem>
						)} />

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
								{t("common.cancel")}
							</Button>
							<Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
								{isEdit ? t("handover.items.editItem") : t("handover.items.addItem")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
