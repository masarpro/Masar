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
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { Save, Building, Wallet, TrendingUp, User, FileText, Printer, Calendar } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

interface PaymentDetailProps {
	organizationId: string;
	organizationSlug: string;
	paymentId: string;
}

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

export function PaymentDetail({
	organizationId,
	organizationSlug,
	paymentId,
}: PaymentDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [isEditing, setIsEditing] = useState(false);

	// Fetch payment
	const { data: paymentData, isLoading } = useQuery(
		orpc.finance.orgPayments.getById.queryOptions({
			input: { organizationId, id: paymentId },
		}),
	);

	// Fetch bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	// Fetch clients
	const { data: clientsData } = useQuery(
		orpc.finance.clients.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch projects
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);

	const payment = paymentData;
	const accounts = accountsData?.accounts ?? [];
	const clients = clientsData?.clients ?? [];
	const projects = projectsData?.projects ?? [];

	// Form state for editing
	const [formData, setFormData] = useState({
		description: "",
		notes: "",
		referenceNo: "",
	});

	// Initialize form when payment loads
	useState(() => {
		if (payment) {
			setFormData({
				description: payment.description || "",
				notes: payment.notes || "",
				referenceNo: payment.referenceNo || "",
			});
		}
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.orgPayments.update({
				organizationId,
				id: paymentId,
				description: formData.description || undefined,
				notes: formData.notes || undefined,
				referenceNo: formData.referenceNo || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.payments.updateSuccess"));
			setIsEditing(false);
			queryClient.invalidateQueries({ queryKey: orpc.finance.orgPayments.key() });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.payments.updateError"));
		},
	});

	const handleSave = () => {
		updateMutation.mutate();
	};

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			COMPLETED: "bg-success/15 text-success dark:bg-success/20 dark:text-success",
			PENDING: "bg-chart-1/20 text-chart-1 dark:bg-chart-1/25 dark:text-chart-1",
			CANCELLED: "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive",
		};
		return colors[status] || "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground";
	};

	if (isLoading) {
		return <DetailPageSkeleton />;
	}

	if (!payment) {
		return (
			<div className="text-center py-20">
				<TrendingUp className="h-12 w-12 mx-auto text-muted-foreground dark:text-muted-foreground mb-4" />
				<p className="text-muted-foreground dark:text-muted-foreground">
					{t("finance.payments.notFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with actions */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Badge variant="outline" className="rounded-lg font-mono text-lg px-3 py-1">
						{payment.paymentNo}
					</Badge>
					<Badge className={`rounded-lg ${getStatusColor(payment.status)}`}>
						{t(`finance.transactions.status.${payment.status.toLowerCase()}`)}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => router.push(`/app/${organizationSlug}/finance/payments/${paymentId}/receipt`)}
						className="rounded-xl"
					>
						<Printer className="h-4 w-4 me-2" />
						{t("finance.payments.printReceipt")}
					</Button>
					{!isEditing ? (
						<Button onClick={() => setIsEditing(true)} className="rounded-xl">
							{t("common.edit")}
						</Button>
					) : (
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => setIsEditing(false)}
								className="rounded-xl"
							>
								{t("common.cancel")}
							</Button>
							<Button
								onClick={handleSave}
								disabled={updateMutation.isPending}
								className="rounded-xl"
							>
								<Save className="h-4 w-4 me-2" />
								{updateMutation.isPending ? t("common.saving") : t("common.save")}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Payment Amount */}
			<Card className="rounded-2xl">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-success/15 dark:bg-success/20 rounded-xl">
								<TrendingUp className="h-8 w-8 text-success dark:text-success" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">{t("finance.payments.amount")}</p>
								<p className="text-3xl font-bold text-success dark:text-success">
									+<Currency amount={Number(payment.amount)} />
								</p>
							</div>
						</div>
						<div className="text-end">
							<div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground">
								<Calendar className="h-4 w-4" />
								{formatDate(new Date(payment.date))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Client Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						{t("finance.payments.clientInfo")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-4 bg-muted dark:bg-muted rounded-xl">
						<div className="flex items-center gap-3">
							<User className="h-5 w-5 text-primary" />
							<div>
								<p className="font-medium">
									{payment.client?.name || payment.clientName || "-"}
								</p>
								{payment.client?.email && (
									<p className="text-sm text-muted-foreground">{payment.client.email}</p>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Account Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building className="h-5 w-5" />
						{t("finance.payments.destinationAccount")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-4 bg-success/15 dark:bg-success/20 rounded-xl border border-success dark:border-success">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								{payment.destinationAccount?.accountType === "BANK" ? (
									<Building className="h-6 w-6 text-chart-4" />
								) : (
									<Wallet className="h-6 w-6 text-success" />
								)}
								<div>
									<p className="font-medium">{payment.destinationAccount?.name}</p>
									{payment.destinationAccount?.bankName && (
										<p className="text-sm text-muted-foreground">
											{payment.destinationAccount.bankName}
										</p>
									)}
								</div>
							</div>
							<Badge className="rounded-lg bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4">
								{getPaymentMethodLabel(payment.paymentMethod)}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Project & Invoice */}
			{(payment.project || payment.invoice) && (
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							{t("finance.payments.linkedItems")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{payment.project && (
							<div className="p-4 bg-muted dark:bg-muted rounded-xl">
								<p className="text-sm text-muted-foreground">{t("finance.payments.project")}</p>
								<p className="font-medium">{payment.project.name}</p>
							</div>
						)}
						{payment.invoice && (
							<div className="p-4 bg-muted dark:bg-muted rounded-xl">
								<p className="text-sm text-muted-foreground">{t("finance.payments.invoice")}</p>
								<p className="font-medium">{payment.invoice.invoiceNo}</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Details (editable) */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.payments.details")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<Label>{t("finance.payments.referenceNo")}</Label>
						{isEditing ? (
							<Input
								value={formData.referenceNo}
								onChange={(e: any) =>
									setFormData({ ...formData, referenceNo: e.target.value })
								}
								className="rounded-xl mt-1"
								dir="ltr"
							/>
						) : (
							<p className="mt-1 text-muted-foreground dark:text-muted-foreground">
								{payment.referenceNo || "-"}
							</p>
						)}
					</div>

					<div>
						<Label>{t("finance.payments.description")}</Label>
						{isEditing ? (
							<Textarea
								value={formData.description}
								onChange={(e: any) =>
									setFormData({ ...formData, description: e.target.value })
								}
								className="rounded-xl mt-1"
								rows={2}
							/>
						) : (
							<p className="mt-1 text-muted-foreground dark:text-muted-foreground">
								{payment.description || "-"}
							</p>
						)}
					</div>

					<div>
						<Label>{t("finance.payments.notes")}</Label>
						{isEditing ? (
							<Textarea
								value={formData.notes}
								onChange={(e: any) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								className="rounded-xl mt-1"
								rows={3}
							/>
						) : (
							<p className="mt-1 text-muted-foreground dark:text-muted-foreground">
								{payment.notes || "-"}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Metadata */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>
							{t("common.createdAt")}: {formatDate(new Date(payment.createdAt))}
						</span>
						<span>
							{t("common.updatedAt")}: {formatDate(new Date(payment.updatedAt))}
						</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
