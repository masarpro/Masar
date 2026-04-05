"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { toast } from "sonner";
import { ArrowRight, Save, User, Building, Banknote, AlertTriangle } from "lucide-react";
import { Currency } from "../shared/Currency";

interface OwnerDrawingFormProps {
	organizationId: string;
	organizationSlug: string;
}

const formSchema = z.object({
	ownerId: z.string().min(1),
	bankAccountId: z.string().optional(),
	date: z.string().min(1),
	amount: z.number().positive(),
	projectId: z.string().optional(),
	description: z.string().max(2000).optional(),
	notes: z.string().max(5000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function OwnerDrawingForm({
	organizationId,
	organizationSlug,
}: OwnerDrawingFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const basePath = `/app/${organizationSlug}/finance/owner-drawings`;

	const [overdrawDialog, setOverdrawDialog] = useState(false);
	const [overdrawData, setOverdrawData] = useState<any>(null);
	const [checkResult, setCheckResult] = useState<any>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			ownerId: "",
			bankAccountId: "",
			date: new Date().toISOString().split("T")[0],
			amount: 0,
			projectId: "",
			description: "",
			notes: "",
		},
	});

	const watchOwnerId = form.watch("ownerId");
	const watchAmount = form.watch("amount");
	const watchProjectId = form.watch("projectId");
	const watchBankAccountId = form.watch("bankAccountId");

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

	// Fetch projects
	const { data: rawProjects } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);
	const projects = (rawProjects as any)?.projects ?? rawProjects ?? [];

	// Debounced overdraw check
	const runOverdrawCheck = useCallback(async () => {
		if (!watchOwnerId || !watchAmount || watchAmount <= 0) {
			setCheckResult(null);
			return;
		}

		try {
			const result = await orpcClient.accounting.ownerDrawings.checkOverdraw({
				organizationId,
				ownerId: watchOwnerId,
				amount: watchAmount,
				bankAccountId: watchBankAccountId || undefined,
				projectId: watchProjectId || undefined,
			});
			setCheckResult(result);
		} catch {
			// Silently fail — the check is informational
			setCheckResult(null);
		}
	}, [organizationId, watchOwnerId, watchAmount, watchProjectId, watchBankAccountId]);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(runOverdrawCheck, 500);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [runOverdrawCheck]);

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async (data: FormValues & { acknowledgeOverdraw?: boolean }) => {
			return orpcClient.accounting.ownerDrawings.create({
				organizationId,
				ownerId: data.ownerId,
				date: data.date,
				amount: data.amount,
				bankAccountId: data.bankAccountId || undefined,
				projectId: data.projectId || undefined,
				description: data.description || undefined,
				notes: data.notes || undefined,
				acknowledgeOverdraw: data.acknowledgeOverdraw,
			});
		},
		onSuccess: (drawing: any) => {
			queryClient.invalidateQueries({ queryKey: ["accounting", "ownerDrawings"] });
			toast.success(t("finance.ownerDrawings.created"));
			router.push(`${basePath}/${drawing.id}`);
		},
		onError: (error: any) => {
			const message = error?.message ?? error?.data?.message ?? "";
			if (message.includes("OVERDRAW_REQUIRES_CONFIRMATION")) {
				setOverdrawData(error?.data?.data ?? error?.data ?? null);
				setOverdrawDialog(true);
			} else if (message.includes("INSUFFICIENT_BANK_BALANCE")) {
				toast.error(t("finance.ownerDrawings.insufficientBankBalance"));
			} else {
				toast.error(t("common.error"));
			}
		},
	});

	const onSubmit = (data: FormValues) => {
		createMutation.mutate(data);
	};

	const handleOverdrawConfirm = () => {
		const values = form.getValues();
		createMutation.mutate({ ...values, acknowledgeOverdraw: true });
		setOverdrawDialog(false);
	};

	const handleConvertToGeneral = () => {
		form.setValue("projectId", "");
		const values = form.getValues();
		createMutation.mutate({ ...values, projectId: undefined });
		setOverdrawDialog(false);
	};

	const bankInsufficient = checkResult && checkResult.bankBalance !== null && !checkResult.bankSufficient;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
					<ArrowRight className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">{t("finance.ownerDrawings.new")}</h1>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Main Form — takes 2 columns */}
				<div className="lg:col-span-2">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
							{/* Basic Info */}
							<Card>
								<CardHeader><CardTitle>{t("finance.ownerDrawings.basicInfo")}</CardTitle></CardHeader>
								<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField control={form.control} name="ownerId" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.ownerDrawings.ownerName")}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t("finance.ownerDrawings.selectOwner")} />
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
											<FormLabel>{t("finance.ownerDrawings.date")}</FormLabel>
											<FormControl><Input type="date" {...field} /></FormControl>
											<FormMessage />
										</FormItem>
									)} />
									<FormField control={form.control} name="amount" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.ownerDrawings.amount")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													min="0.01"
													{...field}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
												/>
											</FormControl>
											{bankInsufficient && (
												<p className="text-sm text-red-600 flex items-center gap-1">
													<AlertTriangle className="h-3 w-3" />
													{t("finance.ownerDrawings.insufficientBankBalance")}
												</p>
											)}
											<FormMessage />
										</FormItem>
									)} />
									<FormField control={form.control} name="bankAccountId" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.ownerDrawings.bankAccount")}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value ?? ""}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t("finance.ownerDrawings.selectBank")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{Array.isArray(banks) && banks.map((bank: any) => (
														<SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)} />
									<FormField control={form.control} name="projectId" render={({ field }: any) => (
										<FormItem className="md:col-span-2">
											<FormLabel>{t("finance.ownerDrawings.project")} ({t("common.optional")})</FormLabel>
											<Select onValueChange={field.onChange} value={field.value ?? ""}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t("finance.ownerDrawings.selectProject")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="">{t("finance.ownerDrawings.companyLevel")}</SelectItem>
													{Array.isArray(projects) && projects.map((project: any) => (
														<SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
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
											<FormLabel>{t("finance.ownerDrawings.description")}</FormLabel>
											<FormControl><Textarea rows={2} {...field} /></FormControl>
											<FormMessage />
										</FormItem>
									)} />
									<FormField control={form.control} name="notes" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.ownerDrawings.notes")}</FormLabel>
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
									disabled={createMutation.isPending || !!bankInsufficient}
								>
									<Save className="me-2 h-4 w-4" />
									{t("finance.ownerDrawings.createDraft")}
								</Button>
							</div>
						</form>
					</Form>
				</div>

				{/* Sidebar — Context Cards */}
				<div className="space-y-4">
					{/* Owner Context Card */}
					{checkResult && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<User className="h-4 w-4" />
									{t("finance.ownerDrawings.ownerContext")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<InfoRow
									label={t("finance.ownerDrawings.ownerName")}
									value={checkResult.ownerName}
								/>
								<InfoRow
									label={t("finance.ownerDrawings.ownershipPercent")}
									value={`${checkResult.ownershipPercent}%`}
								/>
								<InfoRow
									label={t("finance.ownerDrawings.expectedShare")}
									value={<Currency amount={checkResult.expectedShare} />}
								/>
								<InfoRow
									label={t("finance.ownerDrawings.previousDrawings")}
									value={<Currency amount={checkResult.previousDrawings} />}
								/>
								<div className="border-t pt-2">
									<InfoRow
										label={t("finance.ownerDrawings.availableBalance")}
										value={
											<span className={checkResult.available < 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
												<Currency amount={checkResult.available} />
											</span>
										}
									/>
								</div>
								{checkResult.isOverdraw && (
									<div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2">
										<AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
										<span className="text-xs text-amber-700">
											{t("finance.ownerDrawings.overdrawWarning", {
												amount: new Intl.NumberFormat("en-US").format(checkResult.overdrawAmount),
											})}
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Project Context Card */}
					{checkResult && checkResult.projectName && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<Building className="h-4 w-4" />
									{t("finance.ownerDrawings.projectContext")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<InfoRow
									label={t("finance.ownerDrawings.projectProfit")}
									value={<Currency amount={checkResult.totalProfit} />}
								/>
								<InfoRow
									label={t("finance.ownerDrawings.previousDrawings")}
									value={<Currency amount={checkResult.previousDrawings} />}
								/>
								<div className="border-t pt-2">
									<InfoRow
										label={t("finance.ownerDrawings.availableBalance")}
										value={
											<span className={checkResult.available < 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
												<Currency amount={checkResult.available} />
											</span>
										}
									/>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Bank Balance Card */}
					{checkResult && checkResult.bankBalance !== null && (
						<Card className={bankInsufficient ? "border-red-200" : ""}>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<Banknote className="h-4 w-4" />
									{t("finance.ownerDrawings.bankBalance")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<InfoRow
									label={t("finance.ownerDrawings.currentBalance")}
									value={<Currency amount={checkResult.bankBalance} />}
								/>
								<InfoRow
									label={t("finance.ownerDrawings.afterDrawing")}
									value={
										<span className={bankInsufficient ? "text-red-600 font-bold" : "font-medium"}>
											<Currency amount={checkResult.bankBalance - (checkResult.requestedAmount ?? 0)} />
										</span>
									}
								/>
								{bankInsufficient && (
									<div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2">
										<AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
										<span className="text-xs text-red-700">
											{t("finance.ownerDrawings.insufficientBankBalance")}
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Overdraw Warning Dialog */}
			<AlertDialog open={overdrawDialog} onOpenChange={setOverdrawDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							{t("finance.ownerDrawings.overdrawDialog.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.ownerDrawings.overdrawDialog.description", {
								amount: overdrawData
									? new Intl.NumberFormat("en-US").format(overdrawData.overdrawAmount ?? 0)
									: "0",
								available: overdrawData
									? new Intl.NumberFormat("en-US").format(overdrawData.available ?? 0)
									: "0",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{overdrawData && (
						<div className="my-2 space-y-1 rounded-md border bg-muted/50 p-3 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("finance.ownerDrawings.totalProfit")}</span>
								<span><Currency amount={overdrawData.totalProfit ?? 0} /></span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("finance.ownerDrawings.expectedShare")}</span>
								<span><Currency amount={overdrawData.expectedShare ?? 0} /></span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("finance.ownerDrawings.previousDrawings")}</span>
								<span><Currency amount={overdrawData.previousDrawings ?? 0} /></span>
							</div>
							<div className="flex justify-between border-t pt-1">
								<span className="text-muted-foreground">{t("finance.ownerDrawings.availableBalance")}</span>
								<span className="font-bold text-red-600"><Currency amount={overdrawData.available ?? 0} /></span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("finance.ownerDrawings.requestedAmount")}</span>
								<span className="font-bold"><Currency amount={overdrawData.requestedAmount ?? 0} /></span>
							</div>
						</div>
					)}
					<AlertDialogFooter className="flex-col gap-2 sm:flex-row">
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						{watchProjectId && (
							<Button
								variant="outline"
								onClick={handleConvertToGeneral}
								disabled={createMutation.isPending}
							>
								{t("finance.ownerDrawings.overdrawDialog.convertToGeneral")}
							</Button>
						)}
						<AlertDialogAction
							onClick={handleOverdrawConfirm}
							disabled={createMutation.isPending}
							className="bg-amber-600 text-white hover:bg-amber-700"
						>
							{t("finance.ownerDrawings.overdrawDialog.confirmDespite")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-2">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium text-end">{value}</span>
		</div>
	);
}
