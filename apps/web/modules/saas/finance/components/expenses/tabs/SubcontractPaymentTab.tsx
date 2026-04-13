"use client";

import {
	useState,
	useMemo,
	forwardRef,
	useImperativeHandle,
} from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import {
	Building,
	Wallet,
	ArrowRight,
	FolderOpen,
	FileSignature,
} from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

export interface SubcontractPaymentTabHandle {
	submit: () => void;
	isSubmitting: boolean;
	resetForm: () => void;
}

interface SubcontractPaymentTabProps {
	organizationId: string;
	onSuccess: () => void;
	onError?: () => void;
}

export const SubcontractPaymentTab = forwardRef<
	SubcontractPaymentTabHandle,
	SubcontractPaymentTabProps
>(function SubcontractPaymentTab({ organizationId, onSuccess, onError }, ref) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [projectId, setProjectId] = useState("");
	const [contractId, setContractId] = useState("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [sourceAccountId, setSourceAccountId] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
	const [referenceNo, setReferenceNo] = useState("");
	const [description, setDescription] = useState("");
	const [notes, setNotes] = useState("");

	// Fetch projects
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch subcontracts for selected project
	const { data: subcontractsData } = useQuery({
		...orpc.subcontracts.list.queryOptions({
			input: { organizationId, projectId },
		}),
		enabled: !!projectId,
	});

	// Fetch bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const projects = projectsData?.projects ?? [];
	const contracts = Array.isArray(subcontractsData)
		? subcontractsData
		: (subcontractsData as any)?.contracts ?? [];
	const accounts = accountsData?.accounts ?? [];

	const selectedContract = useMemo(
		() => contracts.find((c: any) => c.id === contractId),
		[contracts, contractId],
	);

	const selectedAccount = useMemo(
		() => accounts.find((a: any) => a.id === sourceAccountId),
		[accounts, sourceAccountId],
	);

	const numericAmount = Number.parseFloat(amount) || 0;

	const resetForm = () => {
		setProjectId("");
		setContractId("");
		setAmount("");
		setDate(new Date().toISOString().split("T")[0]);
		setSourceAccountId("");
		setPaymentMethod("BANK_TRANSFER");
		setReferenceNo("");
		setDescription("");
		setNotes("");
	};

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!projectId) {
				throw new Error(t("finance.expenses.subcontractPayment.projectRequired"));
			}
			if (!contractId) {
				throw new Error(t("finance.expenses.subcontractPayment.contractRequired"));
			}
			if (!amount || numericAmount <= 0) {
				throw new Error(t("finance.expenses.errors.amountRequired"));
			}
			if (!sourceAccountId) {
				throw new Error(t("finance.expenses.errors.accountRequired"));
			}

			return orpcClient.subcontracts.createPayment({
				organizationId,
				projectId,
				contractId,
				amount: numericAmount,
				date: new Date(date),
				sourceAccountId,
				paymentMethod:
					(paymentMethod as (typeof PAYMENT_METHODS)[number]) || null,
				referenceNo: referenceNo || null,
				description: description || null,
				notes: notes || null,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.expenses.subcontractPayment.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			queryClient.invalidateQueries({
				queryKey: orpc.finance.banks.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.finance.expenses.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.projectFinance.key(),
			});
			onSuccess();
			resetForm();
		},
		onError: (error: any) => {
			toast.error(
				error.message ||
					t("finance.expenses.subcontractPayment.createError"),
			);
			onError?.();
		},
	});

	const handleSubmit = () => {
		createMutation.mutate();
	};

	useImperativeHandle(ref, () => ({
		submit: handleSubmit,
		isSubmitting: createMutation.isPending,
		resetForm,
	}));

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	return (
		<div className="space-y-3 sm:space-y-4">
			{/* Row 1: Project, Subcontract */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
				<div className="space-y-1">
					<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
						<FolderOpen className="h-3 w-3 inline me-1" />
						{t("finance.expenses.subcontractPayment.selectProject")} *
					</Label>
					<Select
						value={projectId || "none"}
						onValueChange={(value: any) => {
							const newProjectId = value === "none" ? "" : value;
							setProjectId(newProjectId);
							setContractId("");
						}}
					>
						<SelectTrigger className="rounded-xl h-10">
							<SelectValue
								placeholder={t(
									"finance.expenses.subcontractPayment.selectProject",
								)}
							/>
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="none">
								{t("finance.expenses.subcontractPayment.selectProject")}
							</SelectItem>
							{projects.map((project: any) => (
								<SelectItem key={project.id} value={project.id}>
									{project.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
						<FileSignature className="h-3 w-3 inline me-1" />
						{t("finance.expenses.subcontractPayment.selectContract")} *
					</Label>
					<Select
						value={contractId || "none"}
						onValueChange={(value: any) =>
							setContractId(value === "none" ? "" : value)
						}
						disabled={!projectId}
					>
						<SelectTrigger className="rounded-xl h-10">
							<SelectValue
								placeholder={
									!projectId
										? t("finance.expenses.subcontractPayment.selectProjectFirst")
										: t("finance.expenses.subcontractPayment.selectContract")
								}
							/>
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="none">
								{contracts.length === 0 && projectId
									? t("finance.expenses.subcontractPayment.noContracts")
									: t("finance.expenses.subcontractPayment.selectContract")}
							</SelectItem>
							{contracts.map((contract: any) => (
								<SelectItem
									key={contract.id}
									value={contract.id}
								>
									{contract.name || contract.contractNo}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Contract summary */}
			{selectedContract && (
				<div className="rounded-xl border border-violet-200/60 bg-violet-50/40 dark:border-violet-800/30 dark:bg-violet-950/20 px-3 sm:px-4 py-2.5">
					<div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs">
						<div>
							<p className="text-violet-500">
								{t("finance.expenses.subcontractPayment.contractValue")}
							</p>
							<p className="font-semibold text-violet-700 dark:text-violet-300">
								<Currency
									amount={Number(
										selectedContract.totalValue ?? 0,
									)}
								/>
							</p>
						</div>
						<div>
							<p className="text-sky-500">
								{t("finance.expenses.subcontractPayment.totalPaid")}
							</p>
							<p className="font-semibold text-sky-700 dark:text-sky-300">
								<Currency
									amount={Number(
										selectedContract.totalPaid ?? 0,
									)}
								/>
							</p>
						</div>
						<div>
							<p className="text-amber-500">
								{t("finance.expenses.subcontractPayment.remaining")}
							</p>
							<p className="font-semibold text-amber-700 dark:text-amber-300">
								<Currency
									amount={
										Number(
											selectedContract.totalValue ?? 0,
										) -
										Number(selectedContract.totalPaid ?? 0)
									}
								/>
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Row 2: Amount, Date */}
			<div className="grid grid-cols-2 gap-2 sm:gap-3">
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

			{/* Source Account */}
			<div className="space-y-1">
				<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
					{t("finance.expenses.selectAccount")} *
				</Label>
				<Select
					value={sourceAccountId}
					onValueChange={setSourceAccountId}
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
							<SelectItem key={account.id} value={account.id}>
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
											amount={Number(account.balance)}
										/>
										)
									</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Selected account info */}
			{selectedAccount && (
				<div className="rounded-xl border border-blue-200/60 bg-blue-50/40 dark:border-blue-800/30 dark:bg-blue-950/20 px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center gap-2.5 min-w-0">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 shrink-0">
							{selectedAccount.accountType === "BANK" ? (
								<Building className="h-3.5 w-3.5 text-blue-600" />
							) : (
								<Wallet className="h-3.5 w-3.5 text-green-600" />
							)}
						</div>
						<div className="min-w-0">
							<p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
								{selectedAccount.name}
							</p>
							{selectedAccount.bankName && (
								<p className="text-[11px] text-slate-500 truncate">
									{selectedAccount.bankName}
								</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2 sm:gap-3 text-sm ps-9 sm:ps-0">
						<span className="font-semibold">
							<Currency
								amount={Number(selectedAccount.balance)}
							/>
						</span>
						{numericAmount > 0 && (
							<>
								<ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
								<span className="text-red-500 font-semibold">
									<Currency
										amount={
											Number(selectedAccount.balance) -
											numericAmount
										}
									/>
								</span>
							</>
						)}
					</div>
				</div>
			)}

			{/* Payment Method & Reference */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
				<div className="space-y-1">
					<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
						{t("finance.expenses.paymentMethod")}
					</Label>
					<Select
						value={paymentMethod}
						onValueChange={setPaymentMethod}
					>
						<SelectTrigger className="rounded-xl h-10">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							{PAYMENT_METHODS.map((method) => (
								<SelectItem key={method} value={method}>
									{getPaymentMethodLabel(method)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
						{t("finance.expenses.referenceNo")}
					</Label>
					<Input
						value={referenceNo}
						onChange={(e: any) => setReferenceNo(e.target.value)}
						className="rounded-xl h-10"
						dir="ltr"
					/>
				</div>
			</div>

			{/* Description */}
			<div className="space-y-1">
				<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
					{t("finance.expenses.description")}
				</Label>
				<Input
					value={description}
					onChange={(e: any) => setDescription(e.target.value)}
					placeholder={t("finance.expenses.descriptionPlaceholder")}
					className="rounded-xl h-10"
				/>
			</div>

			{/* Notes */}
			<div className="space-y-1">
				<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
					{t("finance.expenses.additionalNotes")}
				</Label>
				<Textarea
					value={notes}
					onChange={(e: any) => setNotes(e.target.value)}
					placeholder={t("finance.expenses.notesPlaceholder")}
					className="rounded-xl min-h-[60px] resize-none"
					rows={2}
				/>
			</div>
		</div>
	);
});
