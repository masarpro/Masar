"use client";

import {
	useState,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { toast } from "sonner";
import {
	Building,
	Wallet,
	ArrowRight,
	FolderOpen,
	AlertTriangle,
	User,
} from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";

export interface OwnerDrawingTabHandle {
	submit: () => void;
	isSubmitting: boolean;
	resetForm: () => void;
}

interface OwnerDrawingTabProps {
	organizationId: string;
	onSuccess: () => void;
	onError?: () => void;
}

export const OwnerDrawingTab = forwardRef<
	OwnerDrawingTabHandle,
	OwnerDrawingTabProps
>(function OwnerDrawingTab({ organizationId, onSuccess, onError }, ref) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [ownerId, setOwnerId] = useState("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [bankAccountId, setBankAccountId] = useState("");
	const [projectId, setProjectId] = useState("");
	const [description, setDescription] = useState("");

	const [overdrawDialog, setOverdrawDialog] = useState(false);
	const [overdrawData, setOverdrawData] = useState<any>(null);
	const [checkResult, setCheckResult] = useState<any>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Fetch owners
	const { data: rawOwners } = useQuery(
		orpc.accounting.owners.list.queryOptions({
			input: { organizationId },
		}),
	);
	const owners = (rawOwners as any)?.owners ?? rawOwners ?? [];

	// Fetch banks
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);
	const accounts = accountsData?.accounts ?? [];

	// Fetch projects
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);
	const projects = projectsData?.projects ?? [];

	const numericAmount = Number.parseFloat(amount) || 0;

	const selectedAccount = useMemo(
		() => accounts.find((a: any) => a.id === bankAccountId),
		[accounts, bankAccountId],
	);

	// Debounced overdraw check
	const runOverdrawCheck = useCallback(async () => {
		if (!ownerId || !numericAmount || numericAmount <= 0) {
			setCheckResult(null);
			return;
		}

		try {
			const result =
				await orpcClient.accounting.ownerDrawings.checkOverdraw({
					organizationId,
					ownerId,
					amount: numericAmount,
					bankAccountId: bankAccountId || undefined,
					projectId: projectId || undefined,
				});
			setCheckResult(result);
		} catch {
			setCheckResult(null);
		}
	}, [organizationId, ownerId, numericAmount, bankAccountId, projectId]);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(runOverdrawCheck, 500);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [runOverdrawCheck]);

	const bankInsufficient =
		checkResult &&
		checkResult.bankBalance !== null &&
		!checkResult.bankSufficient;

	const resetForm = () => {
		setOwnerId("");
		setAmount("");
		setDate(new Date().toISOString().split("T")[0]);
		setBankAccountId("");
		setProjectId("");
		setDescription("");
		setCheckResult(null);
		setOverdrawData(null);
		setOverdrawDialog(false);
	};

	const createMutation = useMutation({
		mutationFn: async (opts?: { acknowledgeOverdraw?: boolean }) => {
			if (!ownerId) {
				throw new Error(t("finance.expenses.ownerDrawingPayment.ownerRequired"));
			}
			if (!amount || numericAmount <= 0) {
				throw new Error(t("finance.expenses.errors.amountRequired"));
			}

			return orpcClient.accounting.ownerDrawings.create({
				organizationId,
				ownerId,
				date,
				amount: numericAmount,
				bankAccountId: bankAccountId || undefined,
				projectId: projectId || undefined,
				description: description || undefined,
				acknowledgeOverdraw: opts?.acknowledgeOverdraw,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.expenses.ownerDrawingPayment.createSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["accounting", "ownerDrawings"],
			});
			queryClient.invalidateQueries({
				queryKey: orpc.finance.banks.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.projectFinance.key(),
			});
			onSuccess();
			resetForm();
		},
		onError: (error: any) => {
			const message = error?.message ?? error?.data?.message ?? "";
			if (message.includes("OVERDRAW_REQUIRES_CONFIRMATION")) {
				setOverdrawData(error?.data?.data ?? error?.data ?? null);
				setOverdrawDialog(true);
				onError?.();
			} else if (message.includes("INSUFFICIENT_BANK_BALANCE")) {
				toast.error(t("finance.expenses.ownerDrawingPayment.insufficientBank"));
				onError?.();
			} else {
				toast.error(
					error.message ||
						t("finance.expenses.ownerDrawingPayment.createError"),
				);
				onError?.();
			}
		},
	});

	const handleSubmit = () => {
		createMutation.mutate({});
	};

	const handleOverdrawConfirm = () => {
		createMutation.mutate({ acknowledgeOverdraw: true });
		setOverdrawDialog(false);
	};

	const handleConvertToGeneral = () => {
		setProjectId("");
		createMutation.mutate({ acknowledgeOverdraw: false });
		setOverdrawDialog(false);
	};

	useImperativeHandle(ref, () => ({
		submit: handleSubmit,
		isSubmitting: createMutation.isPending,
		resetForm,
	}));

	return (
		<>
			<div className="space-y-4">
				{/* Row 1: Owner, Date */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
							<User className="h-3 w-3 inline me-1" />
							{t("finance.expenses.ownerDrawingPayment.selectOwner")} *
						</Label>
						<Select value={ownerId} onValueChange={setOwnerId}>
							<SelectTrigger className="rounded-xl h-10">
								<SelectValue
									placeholder={t(
										"finance.expenses.ownerDrawingPayment.selectOwner",
									)}
								/>
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{Array.isArray(owners) &&
									owners
										.filter((o: any) => o.isActive !== false)
										.map((owner: any) => (
											<SelectItem
												key={owner.id}
												value={owner.id}
											>
												{owner.name} (
												{Number(
													owner.ownershipPercent,
												)}
												%)
											</SelectItem>
										))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("finance.expenses.date")} *
						</Label>
						<Input
							type="date"
							value={date}
							onChange={(e: any) => setDate(e.target.value)}
							className="rounded-xl h-10"
							required
						/>
					</div>
				</div>

				{/* Row 2: Amount, Bank Account */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("finance.expenses.amount")} *
						</Label>
						<Input
							type="number"
							step="0.01"
							min="0"
							value={amount}
							onChange={(e: any) => setAmount(e.target.value)}
							placeholder="0.00"
							className="rounded-xl text-base font-semibold h-10"
							dir="ltr"
							required
						/>
						{bankInsufficient && (
							<p className="text-xs text-red-600 flex items-center gap-1 mt-1">
								<AlertTriangle className="h-3 w-3" />
								{t("finance.expenses.ownerDrawingPayment.insufficientBank")}
							</p>
						)}
					</div>
					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("finance.expenses.selectAccount")}
						</Label>
						<Select
							value={bankAccountId}
							onValueChange={setBankAccountId}
						>
							<SelectTrigger className="rounded-xl h-10">
								<SelectValue
									placeholder={t(
										"finance.expenses.selectAccountPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{accounts.map((account: any) => (
									<SelectItem
										key={account.id}
										value={account.id}
									>
										<div className="flex items-center gap-2">
											{account.accountType === "BANK" ? (
												<Building className="h-3.5 w-3.5 text-blue-500" />
											) : (
												<Wallet className="h-3.5 w-3.5 text-green-500" />
											)}
											<span>{account.name}</span>
											<span className="text-slate-400 text-xs">
												(
												<Currency
													amount={Number(
														account.balance,
													)}
												/>
												)
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Selected account info */}
				{selectedAccount && (
					<div className="rounded-xl border border-blue-200/60 bg-blue-50/40 dark:border-blue-800/30 dark:bg-blue-950/20 px-4 py-2.5 flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
								{selectedAccount.accountType === "BANK" ? (
									<Building className="h-3.5 w-3.5 text-blue-600" />
								) : (
									<Wallet className="h-3.5 w-3.5 text-green-600" />
								)}
							</div>
							<div>
								<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
									{selectedAccount.name}
								</p>
								{selectedAccount.bankName && (
									<p className="text-[11px] text-slate-500">
										{selectedAccount.bankName}
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-3 text-sm">
							<span className="font-semibold">
								<Currency
									amount={Number(selectedAccount.balance)}
								/>
							</span>
							{numericAmount > 0 && (
								<>
									<ArrowRight className="h-3.5 w-3.5 text-slate-400" />
									<span className="text-red-500 font-semibold">
										<Currency
											amount={
												Number(
													selectedAccount.balance,
												) - numericAmount
											}
										/>
									</span>
								</>
							)}
						</div>
					</div>
				)}

				{/* Overdraw warning */}
				{checkResult?.willExceed && (
					<div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20 p-3">
						<AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
						<div className="text-xs text-amber-700 dark:text-amber-300">
							<p className="font-medium">
								{t("finance.expenses.ownerDrawingPayment.overdrawWarning")}
							</p>
							<p className="mt-1">
								{t("finance.expenses.ownerDrawingPayment.availableAmount")}:{" "}
								<Currency
									amount={checkResult.availableForOwner ?? 0}
								/>{" "}
								| {t("finance.expenses.ownerDrawingPayment.overdrawAmount")}:{" "}
								<Currency
									amount={checkResult.overdrawAmount ?? 0}
								/>
							</p>
						</div>
					</div>
				)}

				{/* Project (optional) */}
				<div className="space-y-1">
					<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
						<FolderOpen className="h-3 w-3 inline me-1" />
						{t("finance.expenses.projectLink")} ({t("common.optional")})
					</Label>
					<Select
						value={projectId || "none"}
						onValueChange={(value: any) =>
							setProjectId(value === "none" ? "" : value)
						}
					>
						<SelectTrigger className="rounded-xl h-10">
							<SelectValue
								placeholder={t(
									"finance.expenses.selectProjectPlaceholder",
								)}
							/>
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="none">
								{t("finance.ownerDrawings.companyLevel")}
							</SelectItem>
							{projects.map((project: any) => (
								<SelectItem key={project.id} value={project.id}>
									{project.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Description */}
				<div className="space-y-1">
					<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
						{t("finance.expenses.description")}
					</Label>
					<Input
						value={description}
						onChange={(e: any) => setDescription(e.target.value)}
						placeholder={t(
							"finance.expenses.descriptionPlaceholder",
						)}
						className="rounded-xl h-10"
					/>
				</div>
			</div>

			{/* Overdraw Confirmation Dialog */}
			<AlertDialog
				open={overdrawDialog}
				onOpenChange={setOverdrawDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							{t("finance.ownerDrawings.overdrawDialog.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t(
								"finance.ownerDrawings.overdrawDialog.description",
								{
									amount: overdrawData
										? new Intl.NumberFormat(
												"en-US",
											).format(
												overdrawData.overdrawAmount ?? 0,
											)
										: "0",
									available: overdrawData
										? new Intl.NumberFormat(
												"en-US",
											).format(
												overdrawData.available ?? 0,
											)
										: "0",
								},
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{overdrawData && (
						<div className="my-2 space-y-1 rounded-md border bg-muted/50 p-3 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t(
										"finance.ownerDrawings.contextProfit",
									)}
								</span>
								<span>
									<Currency
										amount={
											overdrawData.contextProfit ?? 0
										}
									/>
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("finance.ownerDrawings.ownerShare")}
								</span>
								<span>
									<Currency
										amount={
											overdrawData.ownerShareOfContext ??
											0
										}
									/>
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t(
										"finance.ownerDrawings.previousDrawings",
									)}
								</span>
								<span>
									<Currency
										amount={
											overdrawData.totalPreviousDrawings ??
											0
										}
									/>
								</span>
							</div>
							<div className="flex justify-between border-t pt-1">
								<span className="text-muted-foreground">
									{t(
										"finance.ownerDrawings.availableForOwner",
									)}
								</span>
								<span className="font-bold text-red-600">
									<Currency
										amount={
											overdrawData.availableForOwner ?? 0
										}
									/>
								</span>
							</div>
						</div>
					)}
					<AlertDialogFooter className="flex-col gap-2 sm:flex-row">
						<AlertDialogCancel>
							{t("common.cancel")}
						</AlertDialogCancel>
						{projectId && (
							<Button
								variant="outline"
								onClick={handleConvertToGeneral}
								disabled={createMutation.isPending}
							>
								{t(
									"finance.ownerDrawings.overdrawDialog.convertToGeneral",
								)}
							</Button>
						)}
						<AlertDialogAction
							onClick={handleOverdrawConfirm}
							disabled={createMutation.isPending}
							className="bg-amber-600 text-white hover:bg-amber-700"
						>
							{t(
								"finance.ownerDrawings.overdrawDialog.confirmDespite",
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
});
