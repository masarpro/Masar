"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { toast } from "sonner";
import { Save, User, FileText, Receipt, FileCheck, Plus, ChevronDown, Paperclip, StickyNote } from "lucide-react";
import { ItemsEditor } from "../shared/ItemsEditor";
import { AmountSummary } from "../shared/AmountSummary";
import { ClientSelector, type Client } from "../shared/ClientSelector";
import { InlineClientForm } from "../clients/InlineClientForm";
import { calculateTotals } from "../../lib/utils";

interface CreateInvoiceFormProps {
	organizationId: string;
	organizationSlug: string;
}

interface InvoiceItem {
	id: string;
	description: string;
	quantity: number;
	unit: string;
	unitPrice: number;
}

export function CreateInvoiceForm({
	organizationId,
	organizationSlug,
}: CreateInvoiceFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();
	const quotationId = searchParams.get("quotationId");

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
	const [issueDate, setIssueDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});
	const [dueDate, setDueDate] = useState(() => {
		const date = new Date();
		date.setDate(date.getDate() + 30);
		return date.toISOString().split("T")[0];
	});
	const [paymentTermsDays, setPaymentTermsDays] = useState<number | "">(30);
	const [paymentTerms, setPaymentTerms] = useState("");
	const [notes, setNotes] = useState("");
	const [vatPercent, setVatPercent] = useState(15);
	const [discountPercent, setDiscountPercent] = useState(0);
	const [items, setItems] = useState<InvoiceItem[]>([
		{ id: "1", description: "", quantity: 1, unit: "", unitPrice: 0 },
	]);

	// UI state
	const [showIssueConfirm, setShowIssueConfirm] = useState(false);
	const [showNewClientDialog, setShowNewClientDialog] = useState(false);
	const [clientDetailsOpen, setClientDetailsOpen] = useState(false);

	// Auto-compute dueDate when paymentTermsDays or issueDate changes
	useEffect(() => {
		if (paymentTermsDays !== "" && paymentTermsDays > 0 && issueDate) {
			const date = new Date(issueDate);
			date.setDate(date.getDate() + paymentTermsDays);
			setDueDate(date.toISOString().split("T")[0]);
		}
	}, [paymentTermsDays, issueDate]);

	// Fetch quotation data if converting from quotation
	const { data: quotation } = useQuery({
		...orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId ?? "" },
		}),
		enabled: !!quotationId,
	});

	// Pre-fill form with quotation data
	useEffect(() => {
		if (quotation) {
			setClientId(quotation.clientId ?? undefined);
			setClientName(quotation.clientName);
			setClientCompany(quotation.clientCompany ?? "");
			setClientPhone(quotation.clientPhone ?? "");
			setClientEmail(quotation.clientEmail ?? "");
			setClientAddress(quotation.clientAddress ?? "");
			setClientTaxNumber(quotation.clientTaxNumber ?? "");
			setProjectId(quotation.projectId ?? undefined);
			setVatPercent(quotation.vatPercent);
			setDiscountPercent(quotation.discountPercent);
			setPaymentTerms(quotation.paymentTerms ?? "");
			setNotes(quotation.notes ?? "");
			setItems(
				quotation.items.map((item, index) => ({
					id: String(index + 1),
					description: item.description,
					quantity: item.quantity,
					unit: item.unit ?? "",
					unitPrice: item.unitPrice,
				})),
			);
			setClientDetailsOpen(true);
		}
	}, [quotation]);

	// Fetch projects for dropdown
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);
	const projects = projectsData?.projects ?? [];

	// Calculate totals
	const totals = calculateTotals(items, discountPercent, vatPercent);

	// Build the invoice payload (shared between save draft and issue flows)
	const buildPayload = () => ({
		organizationId,
		invoiceType,
		clientId,
		clientName,
		clientCompany,
		clientPhone,
		clientEmail,
		clientAddress,
		clientTaxNumber,
		projectId: projectId === "none" ? undefined : projectId,
		quotationId: quotationId ?? undefined,
		issueDate: new Date(issueDate).toISOString(),
		dueDate: new Date(dueDate).toISOString(),
		paymentTerms,
		notes,
		vatPercent,
		discountPercent,
		items: items
			.filter((item) => item.description.trim())
			.map((item) => ({
				description: item.description,
				quantity: item.quantity,
				unit: item.unit || undefined,
				unitPrice: item.unitPrice,
			})),
	});

	// Create mutation (save as draft)
	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.create(buildPayload());
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.createSuccess"));
			router.push(`/app/${organizationSlug}/finance/invoices/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.createError"));
		},
	});

	// Issue mutation
	const issueMutation = useMutation({
		mutationFn: async (invoiceId: string) => {
			return orpcClient.finance.invoices.issue({
				organizationId,
				id: invoiceId,
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.issueSuccess"));
			router.push(`/app/${organizationSlug}/finance/invoices/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.issueError"));
		},
	});

	// Combined: create draft then issue
	const createAndIssueMutation = useMutation({
		mutationFn: async () => {
			// Step 1: Create the invoice as draft
			const newInvoice = await orpcClient.finance.invoices.create(buildPayload());
			// Step 2: Issue it
			return orpcClient.finance.invoices.issue({
				organizationId,
				id: newInvoice.id,
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.issueSuccess"));
			router.push(`/app/${organizationSlug}/finance/invoices/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.issueError"));
		},
	});

	const handleClientSelect = (client: Client | null) => {
		if (client) {
			setClientId(client.id);
			setClientName(client.name);
			setClientCompany(client.company ?? "");
			setClientPhone(client.phone ?? "");
			setClientEmail(client.email ?? "");
			setClientAddress(client.address ?? "");
			setClientTaxNumber(client.taxNumber ?? "");
			setClientDetailsOpen(true);
		} else {
			setClientId(undefined);
		}
	};

	const validateForm = (): boolean => {
		if (!clientName.trim()) {
			toast.error(t("finance.invoices.errors.clientRequired"));
			return false;
		}

		const validItems = items.filter((item) => item.description.trim());
		if (validItems.length === 0) {
			toast.error(t("finance.invoices.errors.itemsRequired"));
			return false;
		}

		// Validate tax invoice requirements
		if (invoiceType === "TAX" && !clientTaxNumber.trim()) {
			toast.error(t("finance.invoices.errors.taxNumberRequired"));
			return false;
		}

		// Validate dates: dueDate must be after issueDate
		const issueDateObj = new Date(issueDate);
		const dueDateObj = new Date(dueDate);
		if (dueDateObj <= issueDateObj) {
			toast.error(t("finance.invoices.errors.dueDateMustBeAfterIssueDate"));
			return false;
		}

		return true;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;
		createMutation.mutate();
	};

	const handleIssueClick = () => {
		if (!validateForm()) return;
		setShowIssueConfirm(true);
	};

	const handleIssueConfirm = () => {
		setShowIssueConfirm(false);
		createAndIssueMutation.mutate();
	};

	const isBusy = createMutation.isPending || createAndIssueMutation.isPending;

	return (
		<>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Quotation Reference Banner */}
				{quotation && (
					<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
						<Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						<div>
							<p className="font-medium text-blue-900 dark:text-blue-100">
								{t("finance.invoices.fromQuotation")}
							</p>
							<p className="text-sm text-blue-700 dark:text-blue-300">
								{quotation.quotationNo}
							</p>
						</div>
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
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<ClientSelector
								organizationId={organizationId}
								onSelect={handleClientSelect}
								selectedClientId={clientId}
							/>

							<Collapsible open={clientDetailsOpen} onOpenChange={setClientDetailsOpen}>
								<CollapsibleTrigger asChild>
									<Button type="button" variant="ghost" className="w-full justify-between rounded-xl text-slate-600 dark:text-slate-400">
										{t("finance.invoices.clientDetails")}
										<ChevronDown className={`h-4 w-4 transition-transform ${clientDetailsOpen ? "rotate-180" : ""}`} />
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="space-y-4 pt-2">
									<div className="grid gap-4 sm:grid-cols-2">
										<div>
											<Label>{t("finance.invoices.clientName")} *</Label>
											<Input
												value={clientName}
												onChange={(e) => setClientName(e.target.value)}
												placeholder={t("finance.invoices.clientNamePlaceholder")}
												required
												className="rounded-xl mt-1"
											/>
										</div>
										<div>
											<Label>{t("finance.invoices.clientCompany")}</Label>
											<Input
												value={clientCompany}
												onChange={(e) => setClientCompany(e.target.value)}
												placeholder={t("finance.invoices.clientCompanyPlaceholder")}
												className="rounded-xl mt-1"
											/>
										</div>
										<div>
											<Label>{t("finance.invoices.clientPhone")}</Label>
											<Input
												value={clientPhone}
												onChange={(e) => setClientPhone(e.target.value)}
												placeholder="05xxxxxxxx"
												className="rounded-xl mt-1"
											/>
										</div>
										<div>
											<Label>{t("finance.invoices.clientEmail")}</Label>
											<Input
												type="email"
												value={clientEmail}
												onChange={(e) => setClientEmail(e.target.value)}
												placeholder="email@example.com"
												className="rounded-xl mt-1"
											/>
										</div>
										<div>
											<Label>
												{t("finance.invoices.clientTaxNumber")}
												{invoiceType === "TAX" && " *"}
											</Label>
											<Input
												value={clientTaxNumber}
												onChange={(e) => setClientTaxNumber(e.target.value)}
												placeholder={t("finance.invoices.taxNumberPlaceholder")}
												required={invoiceType === "TAX"}
												className="rounded-xl mt-1"
											/>
										</div>
									</div>
									<div>
										<Label>{t("finance.invoices.clientAddress")}</Label>
										<Textarea
											value={clientAddress}
											onChange={(e) => setClientAddress(e.target.value)}
											placeholder={t("finance.invoices.addressPlaceholder")}
											rows={2}
											className="rounded-xl mt-1"
										/>
									</div>
								</CollapsibleContent>
							</Collapsible>
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
							{/* Invoice Number (auto-assigned) */}
							<div>
								<Label>{t("finance.invoices.columns.number")}</Label>
								<Input
									value={t("finance.invoices.autoAssigned")}
									readOnly
									disabled
									className="rounded-xl mt-1 text-slate-400"
								/>
							</div>
							<div>
								<Label>{t("finance.invoices.invoiceType")} *</Label>
								<Select
									value={invoiceType}
									onValueChange={(v) => setInvoiceType(v as typeof invoiceType)}
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
							{/* Currency badge */}
							<div>
								<Label>{t("finance.invoices.currency")}</Label>
								<div className="mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
									SAR ر.س
								</div>
							</div>
							<div>
								<Label>{t("finance.invoices.project")}</Label>
								<Select value={projectId ?? "none"} onValueChange={setProjectId}>
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
								<Label>{t("finance.invoices.issueDate")} *</Label>
								<Input
									type="date"
									value={issueDate}
									onChange={(e) => setIssueDate(e.target.value)}
									required
									className="rounded-xl mt-1"
								/>
							</div>
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
							<div>
								<Label>{t("finance.invoices.dueDate")} *</Label>
								<Input
									type="date"
									value={dueDate}
									onChange={(e) => {
										setDueDate(e.target.value);
										// Clear payment terms days when user manually edits due date
										setPaymentTermsDays("");
									}}
									required
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
						<ItemsEditor items={items} onChange={setItems} />
					</CardContent>
				</Card>

				{/* Amount Summary */}
				<div className="flex justify-end">
					<AmountSummary
						subtotal={totals.subtotal}
						discountPercent={discountPercent}
						discountAmount={totals.discountAmount}
						vatPercent={vatPercent}
						vatAmount={totals.vatAmount}
						totalAmount={totals.totalAmount}
					/>
				</div>

				{/* Notes / Terms / Attachments Tabs */}
				<Card className="rounded-2xl">
					<CardContent className="pt-6">
						<Tabs defaultValue="notes">
							<TabsList className="grid w-full grid-cols-3 rounded-xl max-w-md">
								<TabsTrigger value="notes" className="rounded-xl">
									<StickyNote className="h-4 w-4 me-2" />
									{t("finance.invoices.notes")}
								</TabsTrigger>
								<TabsTrigger value="terms" className="rounded-xl">
									<FileText className="h-4 w-4 me-2" />
									{t("finance.invoices.paymentTerms")}
								</TabsTrigger>
								<TabsTrigger value="attachments" className="rounded-xl">
									<Paperclip className="h-4 w-4 me-2" />
									{t("finance.invoices.attachments")}
								</TabsTrigger>
							</TabsList>
							<TabsContent value="notes" className="mt-4">
								<Textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder={t("finance.invoices.notesPlaceholder")}
									rows={3}
									className="rounded-xl"
								/>
							</TabsContent>
							<TabsContent value="terms" className="mt-4">
								<Textarea
									value={paymentTerms}
									onChange={(e) => setPaymentTerms(e.target.value)}
									placeholder={t("finance.invoices.paymentTermsPlaceholder")}
									rows={3}
									className="rounded-xl"
								/>
							</TabsContent>
							<TabsContent value="attachments" className="mt-4">
								<div className="flex items-center justify-center py-8 text-sm text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
									{t("finance.invoices.attachmentsComingSoon")}
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* Sticky Submit Buttons */}
				<div className="sticky bottom-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6">
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							className="rounded-xl"
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							variant="outline"
							disabled={isBusy}
							className="rounded-xl"
						>
							<Save className="h-4 w-4 me-2" />
							{createMutation.isPending
								? t("common.saving")
								: t("finance.invoices.saveAsDraft")}
						</Button>
						<Button
							type="button"
							disabled={isBusy}
							onClick={handleIssueClick}
							className="rounded-xl"
						>
							<FileCheck className="h-4 w-4 me-2" />
							{createAndIssueMutation.isPending
								? t("common.saving")
								: t("finance.invoices.issueInvoice")}
						</Button>
					</div>
				</div>
			</form>

			{/* Issue Confirmation Dialog */}
			<AlertDialog open={showIssueConfirm} onOpenChange={setShowIssueConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.invoices.issueConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.invoices.issueConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleIssueConfirm}>
							{t("finance.invoices.issueConfirmButton")}
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
		</>
	);
}
