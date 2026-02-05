"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
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
import { toast } from "sonner";
import {
	Search,
	Plus,
	MoreVertical,
	Pencil,
	Trash2,
	TrendingUp,
	Eye,
	Calendar,
	Building,
	User,
	FileText,
	Printer,
} from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";

interface PaymentsListProps {
	organizationId: string;
	organizationSlug: string;
}

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

export function PaymentsList({
	organizationId,
	organizationSlug,
}: PaymentsListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// State
	const [searchQuery, setSearchQuery] = useState("");
	const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

	// Fetch payments
	const { data, isLoading } = useQuery(
		orpc.finance.orgPayments.list.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
			},
		}),
	);

	const payments = data?.payments ?? [];
	const totalPayments = payments.reduce(
		(acc, p) => acc + Number(p.amount),
		0,
	);

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.orgPayments.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.payments.deleteSuccess"));
			setDeletePaymentId(null);
			queryClient.invalidateQueries({ queryKey: ["finance", "orgPayments"] });
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.payments.deleteError"));
		},
	});

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	const getPaymentMethodColor = (method: string) => {
		const colors: Record<string, string> = {
			CASH: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
			BANK_TRANSFER: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
			CHEQUE: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
			CREDIT_CARD: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
		};
		return colors[method] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
	};

	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
			PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
			CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
		};
		return colors[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
	};

	return (
		<div className="space-y-6">
			{/* Summary Card */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-xl">
							<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.payments.totalPayments")}
							</p>
							<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
								<Currency amount={totalPayments} />
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Filters */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder={t("finance.payments.searchPlaceholder")}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="ps-10 rounded-xl"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Payments Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="relative">
								<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
								<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						</div>
					) : payments.length === 0 ? (
						<div className="text-center py-20">
							<TrendingUp className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
							<p className="text-slate-500 dark:text-slate-400">
								{searchQuery
									? t("finance.payments.noSearchResults")
									: t("finance.payments.noPayments")}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.payments.paymentNo")}</TableHead>
									<TableHead>{t("finance.payments.date")}</TableHead>
									<TableHead>{t("finance.payments.client")}</TableHead>
									<TableHead>{t("finance.payments.project")}</TableHead>
									<TableHead>{t("finance.payments.method")}</TableHead>
									<TableHead>{t("finance.payments.account")}</TableHead>
									<TableHead>{t("finance.payments.status")}</TableHead>
									<TableHead className="text-end">{t("finance.payments.amount")}</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((payment) => (
									<TableRow
										key={payment.id}
										className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
									>
										<TableCell>
											<Badge variant="outline" className="rounded-lg font-mono">
												{payment.paymentNo}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
												<Calendar className="h-4 w-4" />
												{formatDate(new Date(payment.date))}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<User className="h-4 w-4 text-slate-400" />
												<span>
													{payment.client?.name || payment.clientName || (
														<span className="text-slate-400">-</span>
													)}
												</span>
											</div>
										</TableCell>
										<TableCell>
											{payment.project?.name || <span className="text-slate-400">-</span>}
										</TableCell>
										<TableCell>
											<Badge className={`rounded-lg ${getPaymentMethodColor(payment.paymentMethod)}`}>
												{getPaymentMethodLabel(payment.paymentMethod)}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Building className="h-4 w-4 text-slate-400" />
												<span className="text-sm">{payment.destinationAccount?.name}</span>
											</div>
										</TableCell>
										<TableCell>
											<Badge className={`rounded-lg ${getStatusColor(payment.status)}`}>
												{t(`finance.transactions.status.${payment.status.toLowerCase()}`)}
											</Badge>
										</TableCell>
										<TableCell className="text-end">
											<span className="font-semibold text-green-600 dark:text-green-400">
												+<Currency amount={Number(payment.amount)} />
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
																`/app/${organizationSlug}/finance/payments/${payment.id}`,
															)
														}
													>
														<Eye className="h-4 w-4 me-2" />
														{t("common.view")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/payments/${payment.id}/receipt`,
															)
														}
													>
														<Printer className="h-4 w-4 me-2" />
														{t("finance.payments.printReceipt")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/payments/${payment.id}`,
															)
														}
													>
														<Pencil className="h-4 w-4 me-2" />
														{t("common.edit")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => setDeletePaymentId(payment.id)}
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

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deletePaymentId}
				onOpenChange={() => setDeletePaymentId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.payments.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.payments.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletePaymentId && deleteMutation.mutate(deletePaymentId)}
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
