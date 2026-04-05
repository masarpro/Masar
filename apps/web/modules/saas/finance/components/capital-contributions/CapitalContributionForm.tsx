"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@ui/components/form";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { ArrowRight, Save } from "lucide-react";

interface CapitalContributionFormProps {
	organizationId: string;
	organizationSlug: string;
}

const formSchema = z.object({
	ownerId: z.string().min(1),
	date: z.string().min(1),
	amount: z.number().positive(),
	type: z.enum(["INITIAL", "ADDITIONAL", "IN_KIND"]),
	bankAccountId: z.string().optional(),
	description: z.string().max(2000).optional(),
	notes: z.string().max(5000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CapitalContributionForm({
	organizationId,
	organizationSlug,
}: CapitalContributionFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const basePath = `/app/${organizationSlug}/finance/capital-contributions`;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			ownerId: "",
			date: new Date().toISOString().split("T")[0],
			amount: 0,
			type: "INITIAL",
			bankAccountId: "",
			description: "",
			notes: "",
		},
	});

	// Fetch owners
	const { data: rawOwners } = useQuery(
		orpc.accounting.owners.list.queryOptions({
			input: { organizationId },
		}),
	);
	const owners = (rawOwners as any)?.owners ?? rawOwners ?? [];

	// Fetch banks
	const { data: rawBanks } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);
	const banks = (rawBanks as any)?.banks ?? rawBanks ?? [];

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.accounting.capitalContributions.create({
				organizationId,
				ownerId: data.ownerId,
				date: data.date,
				amount: data.amount,
				type: data.type,
				bankAccountId: data.bankAccountId || undefined,
				description: data.description || undefined,
				notes: data.notes || undefined,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounting", "capitalContributions"] });
			toast.success(t("finance.capitalContributions.created"));
			router.push(basePath);
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: FormValues) => {
		createMutation.mutate(data);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
					<ArrowRight className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">{t("finance.capitalContributions.new")}</h1>
			</div>

			<div className="mx-auto max-w-2xl">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
						{/* Basic Info */}
						<Card>
							<CardHeader><CardTitle>{t("finance.capitalContributions.basicInfo")}</CardTitle></CardHeader>
							<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField control={form.control} name="ownerId" render={({ field }: any) => (
									<FormItem>
										<FormLabel>{t("finance.capitalContributions.ownerName")}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("finance.capitalContributions.selectOwner")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Array.isArray(owners) && owners.map((owner: any) => (
													<SelectItem key={owner.id} value={owner.id}>
														{owner.name} ({Number(owner.ownershipPercent)}%)
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)} />
								<FormField control={form.control} name="date" render={({ field }: any) => (
									<FormItem>
										<FormLabel>{t("finance.capitalContributions.date")}</FormLabel>
										<FormControl><Input type="date" {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)} />
								<FormField control={form.control} name="amount" render={({ field }: any) => (
									<FormItem>
										<FormLabel>{t("finance.capitalContributions.amount")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0.01"
												{...field}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)} />
								<FormField control={form.control} name="type" render={({ field }: any) => (
									<FormItem>
										<FormLabel>{t("finance.capitalContributions.type")}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="INITIAL">{t("finance.capitalContributions.types.INITIAL")}</SelectItem>
												<SelectItem value="ADDITIONAL">{t("finance.capitalContributions.types.ADDITIONAL")}</SelectItem>
												<SelectItem value="IN_KIND">{t("finance.capitalContributions.types.IN_KIND")}</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)} />
								<FormField control={form.control} name="bankAccountId" render={({ field }: any) => (
									<FormItem className="md:col-span-2">
										<FormLabel>{t("finance.capitalContributions.bankAccount")} ({t("common.optional")})</FormLabel>
										<Select onValueChange={field.onChange} value={field.value ?? ""}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("finance.capitalContributions.selectBank")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="">{t("common.none")}</SelectItem>
												{Array.isArray(banks) && banks.map((bank: any) => (
													<SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)} />
							</CardContent>
						</Card>

						{/* Description */}
						<Card>
							<CardContent className="grid grid-cols-1 gap-4 pt-6">
								<FormField control={form.control} name="description" render={({ field }: any) => (
									<FormItem>
										<FormLabel>{t("finance.capitalContributions.description")}</FormLabel>
										<FormControl><Textarea rows={2} {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)} />
								<FormField control={form.control} name="notes" render={({ field }: any) => (
									<FormItem>
										<FormLabel>{t("finance.capitalContributions.notes")}</FormLabel>
										<FormControl><Textarea rows={2} {...field} /></FormControl>
										<FormMessage />
									</FormItem>
								)} />
							</CardContent>
						</Card>

						{/* Actions */}
						<div className="flex gap-3">
							<Button
								type="submit"
								disabled={createMutation.isPending}
							>
								<Save className="me-2 h-4 w-4" />
								{t("finance.capitalContributions.create")}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
}
