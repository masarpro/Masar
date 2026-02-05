"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@ui/components/tabs";
import { toast } from "sonner";
import {
	Search,
	Plus,
	MoreVertical,
	Pencil,
	Trash2,
	Building,
	Wallet,
	Star,
	CheckCircle,
	XCircle,
	Eye,
	ArrowLeftRight,
	Banknote,
} from "lucide-react";
import { Currency } from "../shared/Currency";

interface BanksListProps {
	organizationId: string;
	organizationSlug: string;
}

interface QuickBankFormData {
	name: string;
	accountType: "BANK" | "CASH_BOX";
	bankName: string;
	accountNumber: string;
	balance: number;
}

const emptyQuickFormData: QuickBankFormData = {
	name: "",
	accountType: "BANK",
	bankName: "",
	accountNumber: "",
	balance: 0,
};

export function BanksList({ organizationId, organizationSlug }: BanksListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// State
	const [searchQuery, setSearchQuery] = useState("");
	const [accountTypeFilter, setAccountTypeFilter] = useState<"BANK" | "CASH_BOX" | undefined>(undefined);
	const [quickDialogOpen, setQuickDialogOpen] = useState(false);
	const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
	const [quickFormData, setQuickFormData] = useState<QuickBankFormData>(emptyQuickFormData);

	// Fetch accounts
	const { data, isLoading } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				accountType: accountTypeFilter,
				isActive: true,
			},
		}),
	);

	// Fetch balances summary
	const { data: summaryData } = useQuery(
		orpc.finance.banks.getSummary.queryOptions({
			input: { organizationId },
		}),
	);

	const accounts = data?.accounts ?? [];

	// Quick create mutation
	const quickCreateMutation = useMutation({
		mutationFn: async () => {
			if (!quickFormData.name) {
				throw new Error(t("finance.banks.errors.nameRequired"));
			}

			return orpcClient.finance.banks.create({
				organizationId,
				name: quickFormData.name,
				accountType: quickFormData.accountType,
				bankName: quickFormData.bankName || undefined,
				accountNumber: quickFormData.accountNumber || undefined,
				balance: quickFormData.balance,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.createSuccess"));
			setQuickDialogOpen(false);
			resetQuickForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "banks"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.createError"));
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.banks.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.deleteSuccess"));
			setDeleteAccountId(null);
			queryClient.invalidateQueries({
				queryKey: ["finance", "banks"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.deleteError"));
		},
	});

	// Set default mutation
	const setDefaultMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.banks.setDefault({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.setDefaultSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "banks"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.setDefaultError"));
		},
	});

	const resetQuickForm = () => {
		setQuickFormData(emptyQuickFormData);
	};

	const handleQuickSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		quickCreateMutation.mutate();
	};

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
								<Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.banks.totalBankBalance")}
								</p>
								<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
									<Currency amount={summaryData?.totalBankBalance ?? 0} />
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-xl">
								<Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.banks.totalCashBalance")}
								</p>
								<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
									<Currency amount={summaryData?.totalCashBalance ?? 0} />
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-xl">
								<Banknote className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.banks.totalBalance")}
								</p>
								<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
									<Currency amount={summaryData?.totalBalance ?? 0} />
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder={t("finance.banks.searchPlaceholder")}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="ps-10 rounded-xl"
							/>
						</div>
						<div className="flex gap-2">
							<Button
								variant={accountTypeFilter === undefined ? "primary" : "outline"}
								size="sm"
								onClick={() => setAccountTypeFilter(undefined)}
								className="rounded-xl"
							>
								{t("common.all")}
							</Button>
							<Button
								variant={accountTypeFilter === "BANK" ? "primary" : "outline"}
								size="sm"
								onClick={() => setAccountTypeFilter("BANK")}
								className="rounded-xl"
							>
								<Building className="h-4 w-4 me-2" />
								{t("finance.banks.types.bank")}
							</Button>
							<Button
								variant={accountTypeFilter === "CASH_BOX" ? "primary" : "outline"}
								size="sm"
								onClick={() => setAccountTypeFilter("CASH_BOX")}
								className="rounded-xl"
							>
								<Wallet className="h-4 w-4 me-2" />
								{t("finance.banks.types.cashBox")}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Accounts Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="relative">
								<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
								<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						</div>
					) : accounts.length === 0 ? (
						<div className="text-center py-20">
							<Building className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
							<p className="text-slate-500 dark:text-slate-400">
								{searchQuery
									? t("finance.banks.noSearchResults")
									: t("finance.banks.noAccounts")}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.banks.accountName")}</TableHead>
									<TableHead>{t("finance.banks.accountType")}</TableHead>
									<TableHead>{t("finance.banks.bankName")}</TableHead>
									<TableHead>{t("finance.banks.accountNumber")}</TableHead>
									<TableHead className="text-end">{t("finance.banks.balance")}</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{accounts.map((account) => (
									<TableRow
										key={account.id}
										className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
										onClick={() =>
											router.push(
												`/app/${organizationSlug}/finance/banks/${account.id}`,
											)
										}
									>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className={`p-1.5 rounded-lg ${
													account.accountType === "BANK"
														? "bg-blue-100 dark:bg-blue-900/50"
														: "bg-green-100 dark:bg-green-900/50"
												}`}>
													{account.accountType === "BANK" ? (
														<Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
													) : (
														<Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
													)}
												</div>
												<div>
													<div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
														{account.name}
														{account.isDefault && (
															<Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
														)}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={account.accountType === "BANK" ? "secondary" : "outline"}
												className="rounded-lg"
											>
												{account.accountType === "BANK"
													? t("finance.banks.types.bank")
													: t("finance.banks.types.cashBox")}
											</Badge>
										</TableCell>
										<TableCell>
											{account.bankName || <span className="text-slate-400">-</span>}
										</TableCell>
										<TableCell>
											{account.accountNumber ? (
												<span className="font-mono text-sm">{account.accountNumber}</span>
											) : (
												<span className="text-slate-400">-</span>
											)}
										</TableCell>
										<TableCell className="text-end">
											<span className={`font-semibold ${
												Number(account.balance) >= 0
													? "text-green-600 dark:text-green-400"
													: "text-red-600 dark:text-red-400"
											}`}>
												<Currency amount={Number(account.balance)} />
											</span>
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="rounded-xl">
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/banks/${account.id}`,
															)
														}
													>
														<Eye className="h-4 w-4 me-2" />
														{t("common.view")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/banks/${account.id}`,
															)
														}
													>
														<Pencil className="h-4 w-4 me-2" />
														{t("common.edit")}
													</DropdownMenuItem>
													{!account.isDefault && (
														<DropdownMenuItem
															onClick={() => setDefaultMutation.mutate(account.id)}
														>
															<Star className="h-4 w-4 me-2" />
															{t("finance.banks.setAsDefault")}
														</DropdownMenuItem>
													)}
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => setDeleteAccountId(account.id)}
														className="text-red-600"
													>
														<Trash2 className="h-4 w-4 me-2" />
														{t("common.delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Quick Add Dialog */}
			<Dialog open={quickDialogOpen} onOpenChange={setQuickDialogOpen}>
				<DialogContent className="sm:max-w-lg rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.banks.addAccount")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleQuickSubmit} className="space-y-4">
						{/* نوع الحساب */}
						<div>
							<Label className="mb-2 block">{t("finance.banks.accountType")}</Label>
							<Tabs
								value={quickFormData.accountType}
								onValueChange={(value) =>
									setQuickFormData({
										...quickFormData,
										accountType: value as "BANK" | "CASH_BOX",
									})
								}
								className="w-full"
							>
								<TabsList className="grid w-full grid-cols-2 rounded-xl">
									<TabsTrigger value="BANK" className="rounded-xl">
										<Building className="h-4 w-4 me-2" />
										{t("finance.banks.types.bank")}
									</TabsTrigger>
									<TabsTrigger value="CASH_BOX" className="rounded-xl">
										<Wallet className="h-4 w-4 me-2" />
										{t("finance.banks.types.cashBox")}
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						{/* اسم الحساب */}
						<div>
							<Label>{t("finance.banks.accountName")} *</Label>
							<Input
								value={quickFormData.name}
								onChange={(e) =>
									setQuickFormData({
										...quickFormData,
										name: e.target.value,
									})
								}
								placeholder={
									quickFormData.accountType === "BANK"
										? t("finance.banks.bankAccountNamePlaceholder")
										: t("finance.banks.cashBoxNamePlaceholder")
								}
								required
								className="rounded-xl mt-1"
							/>
						</div>

						{/* حقول البنك (فقط للحسابات البنكية) */}
						{quickFormData.accountType === "BANK" && (
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label>{t("finance.banks.bankName")}</Label>
									<Input
										value={quickFormData.bankName}
										onChange={(e) =>
											setQuickFormData({
												...quickFormData,
												bankName: e.target.value,
											})
										}
										placeholder={t("finance.banks.bankNamePlaceholder")}
										className="rounded-xl mt-1"
									/>
								</div>
								<div>
									<Label>{t("finance.banks.accountNumber")}</Label>
									<Input
										value={quickFormData.accountNumber}
										onChange={(e) =>
											setQuickFormData({
												...quickFormData,
												accountNumber: e.target.value,
											})
										}
										placeholder={t("finance.banks.accountNumberPlaceholder")}
										className="rounded-xl mt-1"
										dir="ltr"
									/>
								</div>
							</div>
						)}

						{/* الرصيد الافتتاحي */}
						<div>
							<Label>{t("finance.banks.openingBalance")}</Label>
							<Input
								type="number"
								step="0.01"
								value={quickFormData.balance}
								onChange={(e) =>
									setQuickFormData({
										...quickFormData,
										balance: parseFloat(e.target.value) || 0,
									})
								}
								placeholder="0.00"
								className="rounded-xl mt-1"
								dir="ltr"
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setQuickDialogOpen(false)}
								className="rounded-xl"
							>
								{t("common.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={quickCreateMutation.isPending}
								className="rounded-xl"
							>
								{quickCreateMutation.isPending
									? t("common.saving")
									: t("finance.banks.addAccount")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteAccountId}
				onOpenChange={() => setDeleteAccountId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.banks.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.banks.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteAccountId && deleteMutation.mutate(deleteAccountId)}
							disabled={deleteMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending
								? t("common.deleting")
								: t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
