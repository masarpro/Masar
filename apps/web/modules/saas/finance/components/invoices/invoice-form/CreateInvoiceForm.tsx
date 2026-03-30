"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpcClient } from "@shared/lib/orpc-client";
import { toast } from "sonner";
import { calculateTotals } from "../../../lib/utils";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";
import type { Client } from "../../shared/ClientSelector";
import type { InvoiceItem, CreateInvoiceFormProps } from "./types";
import { DEFAULT_VISIBLE_COLUMNS, type ColumnKey } from "./types";
import { InvoiceFormHeader } from "./InvoiceFormHeader";
import { InvoiceClientCard } from "./InvoiceClientCard";
import { InvoiceDetailsCard } from "./InvoiceDetailsCard";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoiceNotesPanel } from "./InvoiceNotesPanel";
import { InvoiceSummaryPanel } from "./InvoiceSummaryPanel";
import { InvoicePaymentsSection } from "./InvoicePaymentsSection";
import { InvoiceMobileBar } from "./InvoiceMobileBar";
import {
	PreviewDialog,
	IssueConfirmDialog,
	NewClientDialog,
	AddPaymentDialog,
	DeletePaymentDialog,
} from "./InvoiceDialogs";

export function CreateInvoiceForm({
	organizationId,
	organizationSlug,
	invoiceId,
}: CreateInvoiceFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const quotationId = searchParams.get("quotationId");
	const basePath = `/app/${organizationSlug}/finance/invoices`;
	const isEditMode = !!invoiceId;

	// Form state
	const [invoiceType, setInvoiceType] = useState<"STANDARD" | "TAX" | "SIMPLIFIED">("TAX");
	const [clientId, setClientId] = useState<string | undefined>();
	const [clientName, setClientName] = useState("");
	const [clientCompany, setClientCompany] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientAddress, setClientAddress] = useState("");
	const [clientTaxNumber, setClientTaxNumber] = useState("");
	const [projectId, setProjectId] = useState<string | undefined>();
	const [showProjectLink, setShowProjectLink] = useState(false);
	const [issueDate, setIssueDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});
	const [dueDate, setDueDate] = useState(() => {
		const date = new Date();
		date.setDate(date.getDate() + 30);
		return date.toISOString().split("T")[0];
	});
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
	const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);
	const [showPreviewDialog, setShowPreviewDialog] = useState(false);

	// Payment dialog state (edit mode only)
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [newPaymentAmount, setNewPaymentAmount] = useState("");
	const [newPaymentDate, setNewPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
	const [newPaymentMethod, setNewPaymentMethod] = useState("");
	const [newPaymentReference, setNewPaymentReference] = useState("");
	const [newPaymentNotes, setNewPaymentNotes] = useState("");
	const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

	// Column visibility helpers
	const toggleColumn = (column: ColumnKey) => {
		setVisibleColumns((prev) =>
			prev.includes(column)
				? prev.filter((c) => c !== column)
				: [...prev, column],
		);
	};

	// Item manipulation functions
	const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id === itemId ? { ...item, ...updates } : item,
			),
		);
	};

	const addItem = () => {
		const newId = `new-${Date.now()}`;
		setItems((prev) => [
			...prev,
			{ id: newId, description: "", quantity: 1, unit: "", unitPrice: 0 },
		]);
	};

	const removeItem = (itemId: string) => {
		if (items.length > 1) {
			setItems((prev) => prev.filter((item) => item.id !== itemId));
		}
	};

	const moveItemUp = (index: number) => {
		if (index === 0) return;
		setItems((prev) => {
			const newItems = [...prev];
			[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
			return newItems;
		});
	};

	const moveItemDown = (index: number) => {
		if (index === items.length - 1) return;
		setItems((prev) => {
			const newItems = [...prev];
			[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
			return newItems;
		});
	};

	// Fetch organization finance settings
	const { data: orgSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});

	// Apply finance settings defaults (create mode only)
	useEffect(() => {
		if (orgSettings && !isEditMode) {
			if (orgSettings.defaultVatPercent !== undefined) {
				setVatPercent(orgSettings.defaultVatPercent);
			}
		}
	}, [orgSettings, isEditMode]);

	// ─── Edit mode: Fetch invoice data ────────────────────
	const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
		...orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId ?? "" },
		}),
		enabled: !!invoiceId,
	});

	// Redirect if invoice is not DRAFT
	useEffect(() => {
		if (invoice && invoice.status !== "DRAFT") {
			toast.error(t("finance.invoices.notEditable"));
			router.replace(`${basePath}/${invoiceId}`);
		}
	}, [invoice, basePath, invoiceId, router, t]);

	// Populate form from invoice data
	useEffect(() => {
		if (invoice) {
			setInvoiceType(invoice.invoiceType as "STANDARD" | "TAX" | "SIMPLIFIED");
			setClientId(invoice.clientId ?? undefined);
			setClientName(invoice.clientName);
			setClientCompany(invoice.clientCompany ?? "");
			setClientPhone(invoice.clientPhone ?? "");
			setClientEmail(invoice.clientEmail ?? "");
			setClientAddress(invoice.clientAddress ?? "");
			setClientTaxNumber(invoice.clientTaxNumber ?? "");
			setProjectId(invoice.projectId ?? undefined);
			if (invoice.projectId) setShowProjectLink(true);
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
		}
	}, [invoice]);

	// Fetch default template
	const { data: defaultTemplate } = useQuery(
		orpc.company.templates.getDefault.queryOptions({
			input: { organizationId, templateType: "INVOICE" },
		}),
	);

	// Fetch quotation data if converting from quotation
	const { data: quotation } = useQuery({
		...orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId ?? "" },
		}),
		enabled: !!quotationId,
	});

	// Pre-fill form with quotation data (create mode only)
	useEffect(() => {
		if (quotation && !isEditMode) {
			setClientId(quotation.clientId ?? undefined);
			setClientName(quotation.clientName);
			setClientCompany(quotation.clientCompany ?? "");
			setClientPhone(quotation.clientPhone ?? "");
			setClientEmail(quotation.clientEmail ?? "");
			setClientAddress(quotation.clientAddress ?? "");
			setClientTaxNumber(quotation.clientTaxNumber ?? "");
			if (quotation.projectId) {
				setProjectId(quotation.projectId);
				setShowProjectLink(true);
			}
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
		projectId: !showProjectLink || projectId === "none" ? undefined : projectId,
		quotationId: quotationId ?? undefined,
		issueDate: new Date(issueDate).toISOString(),
		dueDate: new Date(dueDate).toISOString(),
		paymentTerms,
		notes,
		vatPercent,
		discountPercent,
		templateId: defaultTemplate?.id,
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
			router.push(`${basePath}/${data.id}`);
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
			router.push(`${basePath}/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.issueError"));
		},
	});

	// Combined: create draft then issue
	const createAndIssueMutation = useMutation({
		mutationFn: async () => {
			const newInvoice = await orpcClient.finance.invoices.create(buildPayload());
			return orpcClient.finance.invoices.issue({
				organizationId,
				id: newInvoice.id,
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.issueSuccess"));
			router.push(`${basePath}/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.issueError"));
		},
	});

	// ─── Edit mode mutations ────────────────────────────
	const updateMutation = useMutation({
		mutationFn: async () => {
			await orpcClient.finance.invoices.update({
				organizationId,
				id: invoiceId!,
				invoiceType,
				clientId,
				clientName,
				clientCompany,
				clientPhone,
				clientEmail,
				clientAddress,
				clientTaxNumber,
				projectId: !showProjectLink || projectId === "none" ? null : projectId,
				issueDate: new Date(issueDate).toISOString(),
				dueDate: new Date(dueDate).toISOString(),
				paymentTerms,
				notes,
				vatPercent,
				discountPercent,
				templateId: invoice?.templateId || null,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.updateError"));
		},
	});

	const updateItemsMutation = useMutation({
		mutationFn: async () => {
			await orpcClient.finance.invoices.updateItems({
				organizationId,
				id: invoiceId!,
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
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.itemsUpdateError"));
		},
	});

	const addPaymentMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.addPayment({
				organizationId,
				id: invoiceId!,
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
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.paymentAddError"));
		},
	});

	const deletePaymentMutation = useMutation({
		mutationFn: async (paymentId: string) => {
			return orpcClient.finance.invoices.deletePayment({
				organizationId,
				invoiceId: invoiceId!,
				paymentId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.paymentDeleteSuccess"));
			setDeletePaymentId(null);
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.paymentDeleteError"));
		},
	});

	const statusMutation = useMutation({
		mutationFn: async (status: "CANCELLED" | "SENT" | "VIEWED" | "OVERDUE") => {
			await orpcClient.finance.invoices.updateStatus({
				organizationId,
				id: invoiceId!,
				status,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.statusUpdateError"));
		},
	});

	const convertToTaxMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.convertToTax({
				organizationId,
				id: invoiceId!,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.convertToTaxSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.convertToTaxError"));
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
			setClientDetailsOpen(false);
		} else {
			setClientId(undefined);
			setClientName("");
			setClientCompany("");
			setClientPhone("");
			setClientEmail("");
			setClientAddress("");
			setClientTaxNumber("");
			setClientDetailsOpen(false);
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

		if (!clientTaxNumber.trim()) {
			toast.error(t("finance.invoices.errors.taxNumberRequired"));
			return false;
		}

		const issueDateObj = new Date(issueDate);
		const dueDateObj = new Date(dueDate);
		if (dueDateObj <= issueDateObj) {
			toast.error(t("finance.invoices.errors.dueDateMustBeAfterIssueDate"));
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;
		if (isEditMode) {
			try {
				await updateMutation.mutateAsync();
				await updateItemsMutation.mutateAsync();
				toast.success(t("finance.invoices.updateSuccess"));
				router.push(`${basePath}/${invoiceId}`);
			} catch {
				// Error handled in mutations
			}
		} else {
			createMutation.mutate();
		}
	};

	const handleIssueClick = () => {
		if (!validateForm()) return;
		setShowIssueConfirm(true);
	};

	const handleIssueConfirm = async () => {
		setShowIssueConfirm(false);
		if (isEditMode) {
			try {
				await updateMutation.mutateAsync();
				await updateItemsMutation.mutateAsync();
				await issueMutation.mutateAsync(invoiceId!);
			} catch {
				// Error handled in mutations
			}
		} else {
			createAndIssueMutation.mutate();
		}
	};

	const isBusy = createMutation.isPending || createAndIssueMutation.isPending ||
		(isEditMode && (updateMutation.isPending || updateItemsMutation.isPending));

	const canAddPayment = isEditMode && invoice &&
		invoice.status !== "PAID" && invoice.status !== "CANCELLED";
	const remainingAmount = isEditMode && invoice
		? invoice.totalAmount - invoice.paidAmount
		: 0;

	const currency = orgSettings?.defaultCurrency || "SAR";

	// Loading state for edit mode
	if (isEditMode && isLoadingInvoice) {
		return <FormPageSkeleton />;
	}

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
			<form onSubmit={handleSubmit} className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header ─────────────────────────────────────────── */}
				<InvoiceFormHeader
					organizationSlug={organizationSlug}
					basePath={basePath}
					isEditMode={isEditMode}
					invoiceId={invoiceId}
					invoice={invoice ? { invoiceNo: invoice.invoiceNo, status: invoice.status, invoiceType: invoice.invoiceType } : null}
					quotation={quotation ? { quotationNo: quotation.quotationNo } : null}
					isBusy={isBusy}
					canAddPayment={!!canAddPayment}
					isCreateAndIssuePending={createAndIssueMutation.isPending}
					isStatusMutationPending={statusMutation.isPending}
					isConvertToTaxPending={convertToTaxMutation.isPending}
					onPreview={() => isEditMode ? router.push(`${basePath}/${invoiceId}/preview`) : setShowPreviewDialog(true)}
					onPaymentDialogOpen={() => setPaymentDialogOpen(true)}
					onIssueClick={handleIssueClick}
					onSendClick={() => statusMutation.mutate("SENT")}
					onConvertToTax={() => convertToTaxMutation.mutate()}
				/>

				{/* ─── Client + Details Grid ───────────────────────────── */}
				<div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
					<InvoiceClientCard
						organizationId={organizationId}
						clientId={clientId}
						clientName={clientName}
						clientCompany={clientCompany}
						clientPhone={clientPhone}
						clientEmail={clientEmail}
						clientAddress={clientAddress}
						clientTaxNumber={clientTaxNumber}
						clientDetailsOpen={clientDetailsOpen}
						onClientSelect={handleClientSelect}
						onClientDetailsToggle={() => setClientDetailsOpen(!clientDetailsOpen)}
						onShowNewClientDialog={() => setShowNewClientDialog(true)}
						onClientNameChange={setClientName}
						onClientCompanyChange={setClientCompany}
						onClientPhoneChange={setClientPhone}
						onClientEmailChange={setClientEmail}
						onClientAddressChange={setClientAddress}
						onClientTaxNumberChange={setClientTaxNumber}
					/>

					<InvoiceDetailsCard
						isEditMode={isEditMode}
						invoice={invoice ? { invoiceNo: invoice.invoiceNo } : null}
						issueDate={issueDate}
						dueDate={dueDate}
						showProjectLink={showProjectLink}
						projectId={projectId}
						projects={projects}
						vatPercent={vatPercent}
						currency={currency}
						onIssueDateChange={setIssueDate}
						onDueDateChange={setDueDate}
						onShowProjectLinkChange={(checked) => { setShowProjectLink(checked); if (!checked) setProjectId(undefined); }}
						onProjectIdChange={setProjectId}
					/>
				</div>

				{/* ─── Items Table ─────────────────────────────────────── */}
				<InvoiceItemsTable
					items={items}
					visibleColumns={visibleColumns}
					onUpdateItem={updateItem}
					onAddItem={addItem}
					onRemoveItem={removeItem}
					onMoveItemUp={moveItemUp}
					onMoveItemDown={moveItemDown}
					onToggleColumn={toggleColumn}
				/>

				{/* ─── Notes + Summary Grid ────────────────────────────── */}
				<div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
					<InvoiceNotesPanel
						notes={notes}
						paymentTerms={paymentTerms}
						onNotesChange={setNotes}
						onPaymentTermsChange={setPaymentTerms}
					/>

					<InvoiceSummaryPanel
						subtotal={totals.subtotal}
						discountPercent={discountPercent}
						discountAmount={totals.discountAmount}
						vatPercent={vatPercent}
						vatAmount={totals.vatAmount}
						totalAmount={totals.totalAmount}
						currency={currency}
						isEditMode={isEditMode}
						invoice={invoice ? { paidAmount: invoice.paidAmount } : null}
						remainingAmount={remainingAmount}
					/>
				</div>

				{/* ─── Payments Section (edit mode) ───────────────────── */}
				{isEditMode && invoice && invoice.payments && invoice.payments.length > 0 && (
					<InvoicePaymentsSection
						payments={invoice.payments}
						canAddPayment={!!canAddPayment}
						onAddPayment={() => setPaymentDialogOpen(true)}
						onDeletePayment={(paymentId) => setDeletePaymentId(paymentId)}
					/>
				)}

				{/* ─── Mobile Bottom Bar ───────────────────────────────── */}
				<InvoiceMobileBar
					totalAmount={totals.totalAmount}
					currency={currency}
					isEditMode={isEditMode}
					isBusy={isBusy}
					invoiceStatus={invoice?.status}
					onIssueClick={handleIssueClick}
				/>
			</form>

			{/* Dialogs */}
			<PreviewDialog
				open={showPreviewDialog}
				onOpenChange={setShowPreviewDialog}
			/>

			<IssueConfirmDialog
				open={showIssueConfirm}
				onOpenChange={setShowIssueConfirm}
				onConfirm={handleIssueConfirm}
			/>

			<NewClientDialog
				open={showNewClientDialog}
				onOpenChange={setShowNewClientDialog}
				organizationId={organizationId}
				onClientCreated={handleClientSelect}
			/>

			<AddPaymentDialog
				open={paymentDialogOpen}
				onOpenChange={setPaymentDialogOpen}
				remainingAmount={remainingAmount}
				paymentAmount={newPaymentAmount}
				paymentDate={newPaymentDate}
				paymentMethod={newPaymentMethod}
				paymentReference={newPaymentReference}
				paymentNotes={newPaymentNotes}
				isPending={addPaymentMutation.isPending}
				onPaymentAmountChange={setNewPaymentAmount}
				onPaymentDateChange={setNewPaymentDate}
				onPaymentMethodChange={setNewPaymentMethod}
				onPaymentReferenceChange={setNewPaymentReference}
				onPaymentNotesChange={setNewPaymentNotes}
				onSubmit={() => addPaymentMutation.mutate()}
			/>

			<DeletePaymentDialog
				open={!!deletePaymentId}
				onOpenChange={() => setDeletePaymentId(null)}
				isPending={deletePaymentMutation.isPending}
				onConfirm={() => deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)}
			/>
		</div>
	);
}
