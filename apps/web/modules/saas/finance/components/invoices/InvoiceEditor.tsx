"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
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
import { toast } from "sonner";
import {
	Save,
	User,
	Send,
	Eye,
	MoreVertical,
	FileText,
	CreditCard,
	Plus,
	Trash2,
	QrCode,
	Ban,
} from "lucide-react";
import { Badge } from "@ui/components/badge";
import { ItemsEditor } from "../shared/ItemsEditor";
import { AmountSummary } from "../shared/AmountSummary";
import { ClientSelector, type Client } from "../shared/ClientSelector";
import { InlineClientForm } from "../clients/InlineClientForm";
import { StatusBadge } from "../shared/StatusBadge";
import { calculateTotals, formatDate } from "../../lib/utils";
import { Currency } from "../shared/Currency";

interface InvoiceEditorProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

interface InvoiceItem {
	id: string;
	description: string;
	quantity: number;
	unit: string;
	unitPrice: number;
}

export function InvoiceEditor({
	organizationId,
	organizationSlug,
	invoiceId,
}: InvoiceEditorProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	// Form state
	const [invoiceType, setInvoiceType] = useState<"STANDARD" | "TAX" | "SIMPLIFIED">("STANDARD");
	const [clientId, setClientId] = useState<string | undefined>();
	const [clientName, setClientName] = useState("");
	const [clientCompany, setClientCompany] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientAddress, setClientAddress] = useState("");
	const [clientTaxNumber, setClientTaxNumber] = useState("");
	const [projectId, setProjectId] = useState<string | undefined>();
	const [issueDate, setIssueDate] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [paymentTermsDays, setPaymentTermsDays] = useState<number | "">(30);
	const [paymentTerms, setPaymentTerms] = useState("");
	const [notes, setNotes] = useState("");
	const [vatPercent, setVatPercent] = useState(15);
	const [discountPercent, setDiscountPercent] = useState(0);
	const [items, setItems] = useState<InvoiceItem[]>([]);

	// Template state
	const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

	// Payment dialog state
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [newPaymentAmount, setNewPaymentAmount] = useState("");
	const [newPaymentDate, setNewPaymentDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});
	const [newPaymentMethod, setNewPaymentMethod] = useState("");
	const [newPaymentReference, setNewPaymentReference] = useState("");
	const [newPaymentNotes, setNewPaymentNotes] = useState("");

	// Delete payment dialog
	const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
	// New client dialog
	const [showNewClientDialog, setShowNewClientDialog] = useState(false);

	// Fetch invoice data
	const { data: invoice, isLoading } = useQuery(
		orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	// Fetch templates for invoices
	const { data: templatesData } = useQuery(
		orpc.finance.templates.list.queryOptions({
			input: { organizationId, templateType: "INVOICE" },
		}),
	);
	const templates = templatesData?.templates ?? [];

	// Fetch default template
	const { data: defaultTemplate } = useQuery(
		orpc.finance.templates.getDefault.queryOptions({
			input: { organizationId, templateType: "INVOICE" },
		}),
	);

	// Redirect if not DRAFT
	useEffect(() => {
		if (invoice && invoice.status !== "DRAFT") {
			toast.error(t("finance.invoices.notEditable"));
			router.replace(`${basePath}/${invoiceId}`);
		}
	}, [invoice, basePath, invoiceId, router, t]);

	// Initialize form with invoice data
	useEffect(() => {
		if (invoice) {
			setInvoiceType(invoice.invoiceType as typeof invoiceType);
			setClientId(invoice.clientId ?? undefined);
			setClientName(invoice.clientName);
			setClientCompany(invoice.clientCompany ?? "");
			setClientPhone(invoice.clientPhone ?? "");
			setClientEmail(invoice.clientEmail ?? "");
			setClientAddress(invoice.clientAddress ?? "");
			setClientTaxNumber(invoice.clientTaxNumber ?? "");
			setProjectId(invoice.projectId ?? undefined);
			setIssueDate(new Date(invoice.issueDate).toISOString().split("T")[0]);
			setDueDate(new Date(invoice.dueDate).toISOString().split("T")[0]);
			setPaymentTerms(invoice.paymentTerms ?? "");
			setNotes(invoice.notes ?? "");
			setVatPercent(invoice.vatPercent);
			setDiscountPercent(invoice.discountPercent);
			setItems(
				invoice.items.map((item) => ({
					id: item.id,
					description: item.description,
					quantity: item.quantity,
					unit: item.unit ?? "",
					unitPrice: item.unitPrice,
				})),
			);
			setSelectedTemplate(invoice.templateId ?? undefined);
		}
	}, [invoice]);

	// Auto-compute dueDate when paymentTermsDays or issueDate changes
	useEffect(() => {
		if (paymentTermsDays !== "" && paymentTermsDays > 0 && issueDate) {
			const date = new Date(issueDate);
			date.setDate(date.getDate() + paymentTermsDays);
			setDueDate(date.toISOString().split("T")[0]);
		}
	}, [paymentTermsDays, issueDate]);

	// Fetch projects for dropdown
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);
	const projects = projectsData?.projects ?? [];

	// Calculate totals
	const totals = calculateTotals(items, discountPercent, vatPercent);

	// Update invoice mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			await orpcClient.finance.invoices.update({
				organizationId,
				id: invoiceId,
				invoiceType,
				clientId,
				clientName,
				clientCompany,
				clientPhone,
				clientEmail,
				clientAddress,
				clientTaxNumber,
				projectId: projectId === "none" ? null : projectId,
				issueDate: new Date(issueDate).toISOString(),
				dueDate: new Date(dueDate).toISOString(),
				paymentTerms,
				notes,
				vatPercent,
				discountPercent,
				templateId: selectedTemplate || null,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.updateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.updateError"));
		},
	});

	// Update items mutation
	const updateItemsMutation = useMutation({
		mutationFn: async () => {
			await orpcClient.finance.invoices.updateItems({
				organizationId,
				id: invoiceId,
				items: items
					.filter((item) => item.description.trim())
					.map((item) => ({
						id: item.id.startsWith("new-") ? undefined : item.id,
						description: item.description,
						quantity: item.quantity,
						unit: item.unit || undefined,
						unitPrice: item.unitPrice,
					})),
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.itemsUpdateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.itemsUpdateError"));
		},
	});

	// Update status mutation
	const statusMutation = useMutation({
		mutationFn: async (status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE") => {
			await orpcClient.finance.invoices.updateStatus({
				organizationId,
				id: invoiceId,
				status,
			});
		},
		onSuccess: (_, status) => {
			toast.success(t(`finance.invoices.status.${status.toLowerCase()}Success`));
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.statusUpdateError"));
		},
	});

	// Convert to tax invoice mutation
	const convertToTaxMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.convertToTax({
				organizationId,
				id: invoiceId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.convertToTaxSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.convertToTaxError"));
		},
	});

	// Add payment mutation
	const addPaymentMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.addPayment({
				organizationId,
				id: invoiceId,
				amount: parseFloat(newPaymentAmount),
				paymentDate: new Date(newPaymentDate).toISOString(),
				paymentMethod: newPaymentMethod || undefined,
				referenceNo: newPaymentReference || undefined,
				notes: newPaymentNotes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.paymentAddSuccess"));
			setPaymentDialogOpen(false);
			resetPaymentForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.paymentAddError"));
		},
	});

	// Delete payment mutation
	const deletePaymentMutation = useMutation({
		mutationFn: async (paymentId: string) => {
			return orpcClient.finance.invoices.deletePayment({
				organizationId,
				invoiceId,
				paymentId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.paymentDeleteSuccess"));
			setDeletePaymentId(null);
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.paymentDeleteError"));
		},
	});

	const resetPaymentForm = () => {
		setNewPaymentAmount("");
		setNewPaymentDate(new Date().toISOString().split("T")[0]);
		setNewPaymentMethod("");
		setNewPaymentReference("");
		setNewPaymentNotes("");
	};

	const handleClientSelect = (client: Client | null) => {
		if (client) {
			setClientId(client.id);
			setClientName(client.name);
			setClientCompany(client.company ?? "");
			setClientPhone(client.phone ?? "");
			setClientEmail(client.email ?? "");
			setClientAddress(client.address ?? "");
			setClientTaxNumber(client.taxNumber ?? "");
		} else {
			setClientId(undefined);
		}
	};

	const handleSaveAll = async () => {
		if (!clientName.trim()) {
			toast.error(t("finance.invoices.errors.clientRequired"));
			return;
		}

		const validItems = items.filter((item) => item.description.trim());
		if (validItems.length === 0) {
			toast.error(t("finance.invoices.errors.itemsRequired"));
			return;
		}

		try {
			await updateMutation.mutateAsync();
			await updateItemsMutation.mutateAsync();
		} catch {
			// Error handled in mutations
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500 dark:text-slate-400">
					{t("finance.invoices.notFound")}
				</p>
			</div>
		);
	}

	const isEditable =
		invoice.status === "DRAFT" || invoice.status === "SENT";
	const canAddPayment =
		invoice.status !== "PAID" && invoice.status !== "CANCELLED";
	const remainingAmount = invoice.totalAmount - invoice.paidAmount;

	return (
		<div className="space-y-6">
			{/* Header with Status and Actions */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center gap-3">
					<h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{invoice.invoiceNo}
					</h1>
					<StatusBadge status={invoice.status} type="invoice" />
				</div>
				<div className="flex items-center gap-2">
					{isEditable && templates.length > 0 && (
						<Select value={selectedTemplate || ""} onValueChange={setSelectedTemplate}>
							<SelectTrigger className="h-9 w-auto gap-1.5 rounded-xl border-dashed text-xs px-2.5">
								<SelectValue placeholder={t("finance.templates.select")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl min-w-[220px]" align="end">
								{templates.map((tmpl) => (
									<SelectItem key={tmpl.id} value={tmpl.id}>
										<div className="flex items-center gap-2">
											<span
												className="w-2.5 h-2.5 rounded-full shrink-0"
												style={{ backgroundColor: (tmpl.settings as any)?.primaryColor || "#3b82f6" }}
											/>
											<span>{tmpl.name}</span>
											{tmpl.id === defaultTemplate?.id && (
												<Badge variant="secondary" className="text-[10px] h-4 px-1.5 ms-1">
													{t("finance.templates.default")}
												</Badge>
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
					<Button
						variant="outline"
						onClick={() => router.push(`${basePath}/${invoiceId}/preview`)}
						className="rounded-xl"
					>
						<Eye className="h-4 w-4 me-2" />
						{t("finance.actions.preview")}
					</Button>
					{canAddPayment && (
						<Button
							variant="outline"
							onClick={() => setPaymentDialogOpen(true)}
							className="rounded-xl"
						>
							<CreditCard className="h-4 w-4 me-2" />
							{t("finance.invoices.addPayment")}
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="rounded-xl">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="rounded-xl">
							{invoice.status === "DRAFT" && (
								<DropdownMenuItem
									onClick={() => statusMutation.mutate("SENT")}
									disabled={statusMutation.isPending}
								>
									<Send className="h-4 w-4 me-2" />
									{t("finance.invoices.actions.send")}
								</DropdownMenuItem>
							)}
							{invoice.invoiceType !== "TAX" &&
								invoice.status !== "CANCELLED" && (
									<DropdownMenuItem
										onClick={() => convertToTaxMutation.mutate()}
										disabled={convertToTaxMutation.isPending}
									>
										<QrCode className="h-4 w-4 me-2" />
										{t("finance.invoices.actions.convertToTax")}
									</DropdownMenuItem>
								)}

							{invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && (
								<DropdownMenuItem
									onClick={() => statusMutation.mutate("DRAFT")}
									disabled={statusMutation.isPending}
								>
									{t("finance.invoices.actions.revertToDraft")}
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Non-editable warning */}
			{!isEditable && invoice.status !== "CANCELLED" && (
				<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
					<p className="text-amber-800 dark:text-amber-200 text-sm">
						{t("finance.invoices.notEditable")}
					</p>
				</div>
			)}

			{/* Cancelled warning */}
			{invoice.status === "CANCELLED" && (
				<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
					<p className="text-red-800 dark:text-red-200 text-sm">
						{t("finance.invoices.cancelled")}
					</p>
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Client Information */}
				<Card className="lg:col-span-2 rounded-2xl">
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span className="flex items-center gap-2">
								<User className="h-5 w-5" />
								{t("finance.invoices.clientInfo")}
							</span>
							{isEditable && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setShowNewClientDialog(true)}
									className="rounded-xl"
								>
									<Plus className="h-4 w-4 me-2" />
									{t("finance.clients.addClient")}
								</Button>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{isEditable && (
							<ClientSelector
								organizationId={organizationId}
								onSelect={handleClientSelect}
								selectedClientId={clientId}
							/>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label>{t("finance.invoices.clientName")} *</Label>
								<Input
									value={clientName}
									onChange={(e) => setClientName(e.target.value)}
									readOnly={!isEditable}
									required
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.clientCompany")}</Label>
								<Input
									value={clientCompany}
									onChange={(e) => setClientCompany(e.target.value)}
									readOnly={!isEditable}
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.clientPhone")}</Label>
								<Input
									value={clientPhone}
									onChange={(e) => setClientPhone(e.target.value)}
									readOnly={!isEditable}
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.clientEmail")}</Label>
								<Input
									type="email"
									value={clientEmail}
									onChange={(e) => setClientEmail(e.target.value)}
									readOnly={!isEditable}
									className="rounded-xl mt-1"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.clientTaxNumber")}</Label>
								<Input
									value={clientTaxNumber}
									onChange={(e) => setClientTaxNumber(e.target.value)}
									readOnly={!isEditable}
									className="rounded-xl mt-1"
								/>
							</div>
						</div>
						<div>
							<Label>{t("finance.invoices.clientAddress")}</Label>
							<Textarea
								value={clientAddress}
								onChange={(e) => setClientAddress(e.target.value)}
								readOnly={!isEditable}
								rows={2}
								className="rounded-xl mt-1"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Invoice Settings */}
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							{t("finance.invoices.settings")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label>{t("finance.invoices.invoiceType")}</Label>
							<Select
								value={invoiceType}
								onValueChange={(v) => setInvoiceType(v as typeof invoiceType)}
								disabled={!isEditable || invoice.invoiceType === "TAX"}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="STANDARD">
										{t("finance.invoices.types.standard")}
									</SelectItem>
									<SelectItem value="TAX">
										{t("finance.invoices.types.tax")}
									</SelectItem>
									<SelectItem value="SIMPLIFIED">
										{t("finance.invoices.types.simplified")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.invoices.project")}</Label>
							<Select
								value={projectId ?? "none"}
								onValueChange={setProjectId}
								disabled={!isEditable}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.invoices.selectProject")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">
										{t("finance.invoices.noProject")}
									</SelectItem>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.invoices.issueDate")}</Label>
							<Input
								type="date"
								value={issueDate}
								onChange={(e) => setIssueDate(e.target.value)}
								readOnly={!isEditable}
								className="rounded-xl mt-1"
							/>
						</div>
						{isEditable && (
							<div>
								<Label>{t("finance.invoices.paymentTermsDays")}</Label>
								<Input
									type="number"
									min="1"
									max="365"
									value={paymentTermsDays}
									onChange={(e) => {
										const val = e.target.value;
										setPaymentTermsDays(val === "" ? "" : Number(val));
									}}
									placeholder="30"
									className="rounded-xl mt-1"
								/>
							</div>
						)}
						<div>
							<Label>{t("finance.invoices.dueDate")}</Label>
							<Input
								type="date"
								value={dueDate}
								onChange={(e) => {
									setDueDate(e.target.value);
									setPaymentTermsDays("");
								}}
								readOnly={!isEditable}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.vatPercent")}</Label>
							<Input
								type="number"
								min="0"
								max="100"
								value={vatPercent}
								onChange={(e) => setVatPercent(Number(e.target.value))}
								readOnly={!isEditable}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.discountPercent")}</Label>
							<Input
								type="number"
								min="0"
								max="100"
								value={discountPercent}
								onChange={(e) => setDiscountPercent(Number(e.target.value))}
								readOnly={!isEditable}
								className="rounded-xl mt-1"
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Items */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.invoices.items")}</CardTitle>
				</CardHeader>
				<CardContent>
					<ItemsEditor
						items={items}
						onChange={setItems}
						readOnly={!isEditable}
					/>
				</CardContent>
			</Card>

			{/* Amount Summary */}
			<div className="flex justify-end">
				<div className="w-72 space-y-2">
					<AmountSummary
						subtotal={totals.subtotal}
						discountPercent={discountPercent}
						discountAmount={totals.discountAmount}
						vatPercent={vatPercent}
						vatAmount={totals.vatAmount}
						totalAmount={totals.totalAmount}
					/>
					{invoice.paidAmount > 0 && (
						<>
							<div className="flex justify-between text-green-600 dark:text-green-400 pt-2 border-t">
								<span>{t("finance.invoices.paidAmount")}</span>
								<span>-<Currency amount={invoice.paidAmount} /></span>
							</div>
							<div className="flex justify-between font-bold">
								<span
									className={
										remainingAmount > 0
											? "text-amber-600 dark:text-amber-400"
											: "text-green-600 dark:text-green-400"
									}
								>
									{t("finance.invoices.remainingAmount")}
								</span>
								<span
									className={
										remainingAmount > 0
											? "text-amber-600 dark:text-amber-400"
											: "text-green-600 dark:text-green-400"
									}
								>
									<Currency amount={remainingAmount} />
								</span>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Payments Section */}
			{invoice.payments && invoice.payments.length > 0 && (
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							{t("finance.invoices.payments")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{invoice.payments.map((payment) => (
								<div
									key={payment.id}
									className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
								>
									<div>
										<p className="font-medium text-green-600 dark:text-green-400">
											<Currency amount={payment.amount} />
										</p>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{formatDate(payment.paymentDate)}
											{payment.paymentMethod && ` - ${payment.paymentMethod}`}
											{payment.referenceNo && ` (${payment.referenceNo})`}
										</p>
										{payment.notes && (
											<p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
												{payment.notes}
											</p>
										)}
									</div>
									{canAddPayment && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setDeletePaymentId(payment.id)}
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Terms & Notes */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.invoices.terms")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>{t("finance.invoices.paymentTerms")}</Label>
						<Textarea
							value={paymentTerms}
							onChange={(e) => setPaymentTerms(e.target.value)}
							readOnly={!isEditable}
							rows={2}
							className="rounded-xl mt-1"
						/>
					</div>
					<div>
						<Label>{t("finance.invoices.notes")}</Label>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							readOnly={!isEditable}
							rows={2}
							className="rounded-xl mt-1"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Submit */}
			{isEditable && (
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(basePath)}
						className="rounded-xl"
					>
						{t("common.cancel")}
					</Button>
					<Button
						onClick={handleSaveAll}
						disabled={updateMutation.isPending || updateItemsMutation.isPending}
						className="rounded-xl"
					>
						<Save className="h-4 w-4 me-2" />
						{updateMutation.isPending || updateItemsMutation.isPending
							? t("common.saving")
							: t("finance.invoices.saveChanges")}
					</Button>
				</div>
			)}

			{/* Add Payment Dialog */}
			<Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.invoices.addPayment")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>{t("finance.invoices.paymentAmount")} *</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								max={remainingAmount}
								value={newPaymentAmount}
								onChange={(e) => setNewPaymentAmount(e.target.value)}
								placeholder={t("finance.invoices.maxAmount")}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.paymentDate")} *</Label>
							<Input
								type="date"
								value={newPaymentDate}
								onChange={(e) => setNewPaymentDate(e.target.value)}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.paymentMethod")}</Label>
							<Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.invoices.selectPaymentMethod")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="CASH">{t("finance.paymentMethods.cash")}</SelectItem>
									<SelectItem value="BANK_TRANSFER">{t("finance.paymentMethods.bankTransfer")}</SelectItem>
									<SelectItem value="CHECK">{t("finance.paymentMethods.check")}</SelectItem>
									<SelectItem value="CREDIT_CARD">{t("finance.paymentMethods.creditCard")}</SelectItem>
									<SelectItem value="OTHER">{t("finance.paymentMethods.other")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.invoices.referenceNo")}</Label>
							<Input
								value={newPaymentReference}
								onChange={(e) => setNewPaymentReference(e.target.value)}
								placeholder={t("finance.invoices.referenceNoPlaceholder")}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.paymentNotes")}</Label>
							<Textarea
								value={newPaymentNotes}
								onChange={(e) => setNewPaymentNotes(e.target.value)}
								rows={2}
								className="rounded-xl mt-1"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setPaymentDialogOpen(false)}
							className="rounded-xl"
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={() => addPaymentMutation.mutate()}
							disabled={
								!newPaymentAmount ||
								parseFloat(newPaymentAmount) <= 0 ||
								addPaymentMutation.isPending
							}
							className="rounded-xl"
						>
							<Plus className="h-4 w-4 me-2" />
							{addPaymentMutation.isPending
								? t("common.saving")
								: t("finance.invoices.addPayment")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Payment Confirmation */}
			<AlertDialog
				open={!!deletePaymentId}
				onOpenChange={() => setDeletePaymentId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.invoices.deletePaymentTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.invoices.deletePaymentDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)
							}
							disabled={deletePaymentMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deletePaymentMutation.isPending
								? t("common.deleting")
								: t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* New Client Dialog */}
			<Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
				<DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("finance.clients.addClient")}</DialogTitle>
					</DialogHeader>
					<InlineClientForm
						organizationId={organizationId}
						onSuccess={(client) => {
							handleClientSelect(client);
							setShowNewClientDialog(false);
						}}
						onCancel={() => setShowNewClientDialog(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
