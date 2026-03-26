"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@ui/components/card";
import {
	Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@ui/components/form";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import {
	ArrowRight, Save, Send, Plus, Trash2,
	ClipboardList, Shield, CheckCircle, Truck,
} from "lucide-react";

interface HandoverProtocolFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const formSchema = z.object({
	type: z.enum(["ITEM_ACCEPTANCE", "PRELIMINARY", "FINAL", "DELIVERY"]),
	date: z.string().min(1),
	title: z.string().min(1).max(300),
	subcontractContractId: z.string().optional(),
	location: z.string().optional(),
	description: z.string().optional(),
	conditions: z.string().optional(),
	warrantyMonths: z.coerce.number().int().positive().optional(),
	retentionReleaseAmount: z.coerce.number().nonnegative().optional(),
	parties: z.array(z.object({
		name: z.string().min(1),
		role: z.string().min(1),
		organization: z.string().optional(),
	})).default([]),
});

type FormValues = z.infer<typeof formSchema>;

const TYPE_ICONS = {
	ITEM_ACCEPTANCE: ClipboardList,
	PRELIMINARY: Shield,
	FINAL: CheckCircle,
	DELIVERY: Truck,
};

export function HandoverProtocolForm({
	organizationId,
	organizationSlug,
	projectId,
}: HandoverProtocolFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [submitAfterCreate, setSubmitAfterCreate] = useState(false);

	const basePath = `/app/${organizationSlug}/projects/${projectId}/handover`;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: "ITEM_ACCEPTANCE",
			date: new Date().toISOString().split("T")[0],
			title: "",
			warrantyMonths: 12,
			retentionReleaseAmount: 0,
			parties: [],
		},
	});

	const selectedType = form.watch("type");

	// Fetch subcontracts for the project
	const { data: subcontracts } = useQuery(
		orpc.subcontracts.list.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.handover.create({
				organizationId,
				projectId,
				type: data.type,
				date: data.date,
				title: data.title,
				subcontractContractId: data.subcontractContractId || undefined,
				location: data.location || undefined,
				description: data.description || undefined,
				conditions: data.conditions || undefined,
				warrantyMonths: data.type === "PRELIMINARY" ? data.warrantyMonths : undefined,
				retentionReleaseAmount: data.type === "FINAL" ? data.retentionReleaseAmount : undefined,
				parties: data.parties,
			});
		},
		onSuccess: async (protocol) => {
			if (submitAfterCreate) {
				try {
					await orpcClient.handover.submit({ organizationId, id: protocol.id });
					toast.success(t("handover.actions.submit"));
				} catch { toast.error(t("common.error")); }
			}
			queryClient.invalidateQueries({ queryKey: ["handover"] });
			toast.success(t("handover.actions.create"));
			router.push(`${basePath}/${protocol.id}`);
		},
		onError: () => toast.error(t("common.error")),
	});

	const addParty = () => {
		const current = form.getValues("parties");
		form.setValue("parties", [...current, { name: "", role: "", organization: "" }]);
	};

	const removeParty = (index: number) => {
		const current = form.getValues("parties");
		form.setValue("parties", current.filter((_, i) => i !== index));
	};

	const parties = form.watch("parties");

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
					<ArrowRight className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">{t("handover.new")}</h1>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
					{/* Type Selection */}
					<Card>
						<CardHeader><CardTitle>{t("handover.types.ITEM_ACCEPTANCE")}</CardTitle></CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
								{(["ITEM_ACCEPTANCE", "PRELIMINARY", "FINAL", "DELIVERY"] as const).map((type) => {
									const Icon = TYPE_ICONS[type];
									const isSelected = selectedType === type;
									return (
										<button
											key={type}
											type="button"
											onClick={() => form.setValue("type", type)}
											className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
												isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
											}`}
										>
											<Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
											<span className="text-sm font-medium">{t(`handover.types.${type}`)}</span>
											<span className="text-xs text-muted-foreground">{t(`handover.typeDescriptions.${type}`)}</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* Basic Info */}
					<Card>
						<CardHeader><CardTitle>{t("handover.titleField")}</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField control={form.control} name="title" render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>{t("handover.titleField")}</FormLabel>
									<FormControl><Input {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="date" render={({ field }) => (
								<FormItem>
									<FormLabel>{t("handover.date")}</FormLabel>
									<FormControl><Input type="date" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="location" render={({ field }) => (
								<FormItem>
									<FormLabel>{t("handover.location")}</FormLabel>
									<FormControl><Input {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />

							{/* Subcontract (required for ITEM_ACCEPTANCE) */}
							{selectedType === "ITEM_ACCEPTANCE" && (
								<FormField control={form.control} name="subcontractContractId" render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>{t("handover.subcontractRequired")}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value ?? ""}>
											<FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
											<SelectContent>
												{(subcontracts as any)?.contracts?.map((c: any) => (
													<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)} />
							)}

							{/* Warranty months for PRELIMINARY */}
							{selectedType === "PRELIMINARY" && (
								<FormField control={form.control} name="warrantyMonths" render={({ field }) => (
									<FormItem>
										<FormLabel>{t("handover.warranty.months")}</FormLabel>
										<FormControl><Input type="number" min="1" {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)} />
							)}

							{/* Retention for FINAL */}
							{selectedType === "FINAL" && (
								<FormField control={form.control} name="retentionReleaseAmount" render={({ field }) => (
									<FormItem>
										<FormLabel>{t("handover.retention.amount")}</FormLabel>
										<FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)} />
							)}

							<FormField control={form.control} name="description" render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>{t("handover.description")}</FormLabel>
									<FormControl><Textarea rows={2} {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="conditions" render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>{t("handover.conditions")}</FormLabel>
									<FormControl><Textarea rows={2} {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
						</CardContent>
					</Card>

					{/* Parties */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>{t("handover.parties.title")}</CardTitle>
								<Button type="button" variant="outline" size="sm" onClick={addParty}>
									<Plus className="me-2 h-4 w-4" />
									{t("handover.parties.addParty")}
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{parties.map((_, index) => (
								<div key={index} className="flex items-start gap-3">
									<div className="grid flex-1 grid-cols-3 gap-2">
										<Input
											placeholder={t("handover.parties.name")}
											value={form.watch(`parties.${index}.name`)}
											onChange={(e) => form.setValue(`parties.${index}.name`, e.target.value)}
										/>
										<Input
											placeholder={t("handover.parties.role")}
											value={form.watch(`parties.${index}.role`)}
											onChange={(e) => form.setValue(`parties.${index}.role`, e.target.value)}
										/>
										<Input
											placeholder={t("handover.parties.organization")}
											value={form.watch(`parties.${index}.organization`)}
											onChange={(e) => form.setValue(`parties.${index}.organization`, e.target.value)}
										/>
									</div>
									<Button type="button" variant="ghost" size="icon" onClick={() => removeParty(index)}>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							))}
							{parties.length === 0 && (
								<p className="text-sm text-muted-foreground text-center py-4">
									{t("handover.parties.addParty")}
								</p>
							)}
						</CardContent>
					</Card>

					{/* Actions */}
					<div className="flex gap-3">
						<Button
							type="submit"
							variant="outline"
							disabled={createMutation.isPending}
							onClick={() => setSubmitAfterCreate(false)}
						>
							<Save className="me-2 h-4 w-4" />
							{t("handover.actions.saveAsDraft")}
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending}
							onClick={() => setSubmitAfterCreate(true)}
						>
							<Send className="me-2 h-4 w-4" />
							{t("handover.actions.saveAndSubmit")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
