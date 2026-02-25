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
import { Badge } from "@ui/components/badge";
import { Switch } from "@ui/components/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@ui/components/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
	DropdownMenuItem,
} from "@ui/components/dropdown-menu";
import { toast } from "sonner";
import {
	Plus,
	Trash2,
	Save,
	User,
	FileText,
	ArrowRight,
	ChevronDown,
	ChevronUp,
	X,
	Printer,
	Eye,
	FileDown,
	Layout,
	Columns,
	Receipt,
	Share2,
	UserPlus,
	Building2,
	Phone,
	Mail,
	MapPin,
	CreditCard,
	MoreVertical,
	Send,
	CheckCircle,
	XCircle,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { cn } from "@ui/lib";
import { ClientSelector, type Client } from "@saas/finance/components/shared/ClientSelector";
import { InlineClientForm } from "@saas/finance/components/clients/InlineClientForm";
import { StatusBadge } from "@saas/finance/components/shared/StatusBadge";
import { formatCurrency, formatDateFull } from "@saas/finance/lib/utils";
import { TemplateRenderer } from "@saas/finance/components/templates/renderer";

interface QuotationFormProps {
	organizationId: string;
	organizationSlug: string;
	mode: "create" | "edit";
	quotationId?: string;
}

interface QuotationItem {
	id: string;
	description: string;
	quantity: number;
	unit: string;
	unitPrice: number;
	discountPercent: number;
	taxPercent: number;
}

type ColumnKey = "index" | "description" | "unit" | "unitPrice" | "quantity" | "discount" | "tax" | "total" | "actions";

const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = ["index", "description", "unit", "unitPrice", "quantity", "total", "actions"];

export function QuotationForm({
	organizationId,
	organizationSlug,
	mode,
	quotationId,
}: QuotationFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/pricing/quotations`;

	// Client state
	const [clientId, setClientId] = useState<string | undefined>();
	const [clientName, setClientName] = useState("");
	const [clientCompany, setClientCompany] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientAddress, setClientAddress] = useState("");
	const [clientTaxNumber, setClientTaxNumber] = useState("");

	// Document settings
	const [quotationNumber, setQuotationNumber] = useState(() => {
		if (mode === "edit") return "";
		// Generate sequential number: QT-YYYYMM-XXXX
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const random = String(Math.floor(Math.random() * 9000) + 1000);
		return `QT-${year}${month}-${random}`;
	});
	const [quotationDate, setQuotationDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});
	const [salesRepId, setSalesRepId] = useState<string | undefined>();
	const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
	// بيانات مخصصة للعناصر القابلة للتعديل في القالب
	const [customElementData, setCustomElementData] = useState<Record<string, { content?: string }>>({});

	// Terms
	const [paymentTerms, setPaymentTerms] = useState("");
	const [deliveryTerms, setDeliveryTerms] = useState("");
	const [warrantyTerms, setWarrantyTerms] = useState("");
	const [notes, setNotes] = useState("");

	// Tax & Discount
	const [includeTax, setIncludeTax] = useState(true);
	const [globalVatPercent, setGlobalVatPercent] = useState(15);
	const [includeDiscount, setIncludeDiscount] = useState(false);
	const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
	const [globalDiscountAmount, setGlobalDiscountAmount] = useState(0);
	const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");

	// Items
	const [items, setItems] = useState<QuotationItem[]>([
		{ id: "1", description: "", quantity: 1, unit: "", unitPrice: 0, discountPercent: 0, taxPercent: 15 },
	]);

	// UI state
	const [manualEntryOpen, setManualEntryOpen] = useState(false);
	const [termsOpen, setTermsOpen] = useState(false);
	const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);
	const [showInlineClientForm, setShowInlineClientForm] = useState(false);
	const [isInitialized, setIsInitialized] = useState(mode === "create");
	const [showPreviewDialog, setShowPreviewDialog] = useState(false);

	// Fetch existing quotation for edit mode
	const { data: existingQuotation, isLoading: isLoadingQuotation } = useQuery({
		...orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId! },
		}),
		enabled: mode === "edit" && !!quotationId,
	});

	// Initialize form with existing data in edit mode
	useEffect(() => {
		if (mode === "edit" && existingQuotation && !isInitialized) {
			setClientId(existingQuotation.clientId ?? undefined);
			setClientName(existingQuotation.clientName);
			setClientCompany(existingQuotation.clientCompany ?? "");
			setClientPhone(existingQuotation.clientPhone ?? "");
			setClientEmail(existingQuotation.clientEmail ?? "");
			setClientAddress(existingQuotation.clientAddress ?? "");
			setClientTaxNumber(existingQuotation.clientTaxNumber ?? "");
			setQuotationNumber(existingQuotation.quotationNo);
			setQuotationDate(new Date(existingQuotation.createdAt).toISOString().split("T")[0]);
			setPaymentTerms(existingQuotation.paymentTerms ?? "");
			setDeliveryTerms(existingQuotation.deliveryTerms ?? "");
			setWarrantyTerms(existingQuotation.warrantyTerms ?? "");
			setNotes(existingQuotation.notes ?? "");
			setGlobalVatPercent(existingQuotation.vatPercent);
			setIncludeTax(existingQuotation.vatPercent > 0);
			setGlobalDiscountPercent(existingQuotation.discountPercent);
			setIncludeDiscount(existingQuotation.discountPercent > 0);

			if (existingQuotation.items && existingQuotation.items.length > 0) {
				setItems(
					existingQuotation.items.map((item) => ({
						id: item.id,
						description: item.description,
						quantity: item.quantity,
						unit: item.unit ?? "",
						unitPrice: item.unitPrice,
						discountPercent: 0,
						taxPercent: existingQuotation.vatPercent,
					}))
				);
			}

			// Open terms if any exist
			if (existingQuotation.paymentTerms || existingQuotation.deliveryTerms ||
				existingQuotation.warrantyTerms || existingQuotation.notes) {
				setTermsOpen(true);
			}

			// تحميل القالب المحدد
			if (existingQuotation.templateId) {
				setSelectedTemplate(existingQuotation.templateId);
			}

			setIsInitialized(true);
		}
	}, [existingQuotation, mode, isInitialized]);

	// Fetch organization members for sales rep
	const { data: membersData } = useQuery(
		orpc.orgUsers.list.queryOptions({
			input: { organizationId },
		}),
	);
	const members = membersData?.users ?? [];

	// Fetch all templates for quotations
	const { data: templatesData } = useQuery(
		orpc.finance.templates.list.queryOptions({
			input: { organizationId, templateType: "QUOTATION" },
		}),
	);
	const templates = templatesData?.templates ?? [];

	// Fetch default template for quotations
	const { data: defaultTemplate } = useQuery(
		orpc.finance.templates.getDefault.queryOptions({
			input: { organizationId, templateType: "QUOTATION" },
		}),
	);

	// Get the selected template (or default)
	const activeTemplate = selectedTemplate === "default" || !selectedTemplate
		? defaultTemplate
		: templates.find(t => t.id === selectedTemplate) || defaultTemplate;

	// Fetch organization finance settings
	const { data: orgSettings } = useQuery(
		orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
	);

	// Calculations
	const calculateItemTotal = (item: QuotationItem) => {
		const subtotal = item.quantity * item.unitPrice;
		const discountAmount = (subtotal * item.discountPercent) / 100;
		const afterDiscount = subtotal - discountAmount;
		const taxAmount = includeTax ? (afterDiscount * item.taxPercent) / 100 : 0;
		return afterDiscount + taxAmount;
	};

	const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
	const itemsDiscountTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discountPercent) / 100, 0);
	const afterItemsDiscount = subtotal - itemsDiscountTotal;

	const globalDiscountValue = includeDiscount
		? (discountType === "percent"
			? (afterItemsDiscount * globalDiscountPercent) / 100
			: globalDiscountAmount)
		: 0;
	const afterGlobalDiscount = afterItemsDiscount - globalDiscountValue;

	const taxAmount = includeTax ? (afterGlobalDiscount * globalVatPercent) / 100 : 0;
	const totalAmount = afterGlobalDiscount + taxAmount;

	// Check if editable (only DRAFT status can be edited)
	const isEditable = mode === "create" || (existingQuotation?.status === "DRAFT");

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			// Calculate validUntil date (30 days from quotation date)
			const validDate = new Date(quotationDate);
			validDate.setDate(validDate.getDate() + 30);

			return orpcClient.pricing.quotations.create({
				organizationId,
				clientId,
				clientName,
				clientCompany,
				clientPhone,
				clientEmail: clientEmail || undefined,
				clientAddress,
				clientTaxNumber,
				validUntil: validDate.toISOString(),
				paymentTerms,
				deliveryTerms,
				warrantyTerms,
				notes,
				templateId: selectedTemplate !== "default" ? selectedTemplate : activeTemplate?.id,
				vatPercent: includeTax ? globalVatPercent : 0,
				discountPercent: includeDiscount && discountType === "percent" ? globalDiscountPercent : 0,
				items: items
					.filter((item) => item.description.trim())
					.map((item) => ({
						description: item.description,
						quantity: item.quantity,
						unit: item.unit || undefined,
						unitPrice: item.unitPrice,
					})),
			});
		},
		onSuccess: (data) => {
			toast.success(t("pricing.quotations.createSuccess"));
			router.push(`${basePath}/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("pricing.quotations.createError"));
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			const updateData = {
				organizationId,
				id: quotationId!,
				clientId: clientId ?? null,
				clientName,
				clientCompany: clientCompany || undefined,
				clientPhone: clientPhone || undefined,
				clientEmail: clientEmail || "",
				clientAddress: clientAddress || undefined,
				clientTaxNumber: clientTaxNumber || undefined,
				paymentTerms: paymentTerms || undefined,
				deliveryTerms: deliveryTerms || undefined,
				warrantyTerms: warrantyTerms || undefined,
				notes: notes || undefined,
				templateId: selectedTemplate !== "default" ? selectedTemplate : activeTemplate?.id,
				vatPercent: includeTax ? globalVatPercent : 0,
				discountPercent: includeDiscount && discountType === "percent" ? globalDiscountPercent : 0,
			};
			console.log("Update data:", updateData);
			return orpcClient.pricing.quotations.update(updateData);
		},
		onError: (error: any) => {
			console.error("Update mutation error:", error);
			toast.error(error.message || t("pricing.quotations.updateError"));
		},
	});

	// Update items mutation
	const updateItemsMutation = useMutation({
		mutationFn: async () => {
			const itemsData = {
				organizationId,
				id: quotationId!,
				items: items
					.filter((item) => item.description.trim())
					.map((item) => ({
						id: item.id.startsWith("new-") ? undefined : item.id,
						description: item.description,
						quantity: item.quantity,
						unit: item.unit || undefined,
						unitPrice: item.unitPrice,
					})),
			};
			console.log("Update items data:", itemsData);
			return orpcClient.pricing.quotations.updateItems(itemsData);
		},
		onError: (error: any) => {
			toast.error(error.message || t("pricing.quotations.itemsUpdateError"));
		},
	});

	// Status mutation
	const statusMutation = useMutation({
		mutationFn: async (status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED") => {
			await orpcClient.pricing.quotations.updateStatus({
				organizationId,
				id: quotationId!,
				status,
			});
		},
		onSuccess: (_, status) => {
			toast.success(t(`pricing.quotations.status.${status.toLowerCase()}Success`));
			queryClient.invalidateQueries({
				queryKey: ["finance", "quotations"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("pricing.quotations.statusUpdateError"));
		},
	});

	// Convert to invoice mutation
	const convertMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.pricing.quotations.convertToInvoice({
				organizationId,
				id: quotationId!,
			});
		},
		onSuccess: (data) => {
			toast.success(t("pricing.quotations.convertSuccess"));
			router.push(`/app/${organizationSlug}/finance/invoices/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("pricing.quotations.convertError"));
		},
	});

	// Handlers
	const handleClientSelect = (client: Client | null) => {
		if (client) {
			setClientId(client.id);
			setClientName(client.name);
			setClientCompany(client.company ?? "");
			setClientPhone(client.phone ?? "");
			setClientEmail(client.email ?? "");
			setClientAddress(client.address ?? "");
			setClientTaxNumber(client.taxNumber ?? "");
			setManualEntryOpen(false);
		} else {
			setClientId(undefined);
		}
	};

	const clearClient = () => {
		setClientId(undefined);
		setClientName("");
		setClientCompany("");
		setClientPhone("");
		setClientEmail("");
		setClientAddress("");
		setClientTaxNumber("");
	};

	const updateItem = (itemId: string, updates: Partial<QuotationItem>) => {
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
			{ id: newId, description: "", quantity: 1, unit: "", unitPrice: 0, discountPercent: 0, taxPercent: globalVatPercent },
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("handleSubmit called, mode:", mode, "quotationId:", quotationId);

		if (!clientName.trim()) {
			toast.error(t("pricing.quotations.errors.clientRequired"));
			return;
		}

		const validItems = items.filter((item) => item.description.trim());
		if (validItems.length === 0) {
			toast.error(t("pricing.quotations.errors.itemsRequired"));
			return;
		}

		if (mode === "create") {
			console.log("Creating new quotation...");
			createMutation.mutate();
		} else {
			// Update mode - save quotation details and items
			console.log("Updating quotation...", { organizationId, quotationId, clientName, items: validItems });
			try {
				console.log("Calling updateMutation...");
				await updateMutation.mutateAsync();
				console.log("updateMutation succeeded, calling updateItemsMutation...");
				await updateItemsMutation.mutateAsync();
				console.log("updateItemsMutation succeeded");
				// Show combined success message
				toast.success(t("pricing.quotations.updateSuccess"));
				// Invalidate queries to refresh data
				queryClient.invalidateQueries({
					queryKey: ["finance", "quotations"],
				});
			} catch (error: any) {
				console.error("Update failed:", error);
				toast.error(error.message || t("pricing.quotations.updateError"));
			}
		}
	};

	const toggleColumn = (column: ColumnKey) => {
		setVisibleColumns((prev) =>
			prev.includes(column)
				? prev.filter((c) => c !== column)
				: [...prev, column],
		);
	};

	const isColumnVisible = (column: ColumnKey) => visibleColumns.includes(column);

	const columnLabels: Record<ColumnKey, string> = {
		index: "#",
		description: t("finance.items.description"),
		unit: t("finance.items.unit"),
		unitPrice: t("finance.items.unitPrice"),
		quantity: t("finance.items.quantity"),
		discount: t("pricing.quotations.discountPercent"),
		tax: t("pricing.quotations.vatPercent"),
		total: t("finance.items.total"),
		actions: "",
	};

	const isSaving = createMutation.isPending || updateMutation.isPending || updateItemsMutation.isPending;

	// Loading state for edit mode
	if (mode === "edit" && isLoadingQuotation) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	// Not found state for edit mode
	if (mode === "edit" && !existingQuotation && !isLoadingQuotation) {
		return (
			<div className="text-center py-20">
				<p className="text-muted-foreground">
					{t("pricing.quotations.notFound")}
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="pb-28 lg:pb-6 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-l from-blue-500/10 via-blue-500/5 to-transparent border border-border/50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
						<FileText className="h-5 w-5 text-blue-500" />
					</div>
					<div className="flex items-center gap-3">
						<div>
							<h1 className="text-lg font-bold">
								{mode === "create"
									? t("pricing.quotations.create")
									: quotationNumber
								}
							</h1>
							<p className="text-xs text-muted-foreground">{formatDateFull(new Date(quotationDate))}</p>
						</div>
						{mode === "edit" && existingQuotation && (
							<StatusBadge status={existingQuotation.status} type="quotation" />
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{mode === "edit" && existingQuotation && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button type="button" variant="outline" size="icon" className="rounded-lg h-9 w-9">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="rounded-xl">
								{existingQuotation.status === "DRAFT" && (
									<DropdownMenuItem
										onClick={() => statusMutation.mutate("SENT")}
										disabled={statusMutation.isPending}
									>
										<Send className="h-4 w-4 me-2" />
										{t("pricing.quotations.actions.send")}
									</DropdownMenuItem>
								)}
								{(existingQuotation.status === "SENT" || existingQuotation.status === "VIEWED") && (
									<>
										<DropdownMenuItem
											onClick={() => statusMutation.mutate("ACCEPTED")}
											disabled={statusMutation.isPending}
										>
											<CheckCircle className="h-4 w-4 me-2 text-green-600" />
											{t("pricing.quotations.actions.accept")}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => statusMutation.mutate("REJECTED")}
											disabled={statusMutation.isPending}
										>
											<XCircle className="h-4 w-4 me-2 text-red-600" />
											{t("pricing.quotations.actions.reject")}
										</DropdownMenuItem>
									</>
								)}
								{existingQuotation.status === "ACCEPTED" && (
									<DropdownMenuItem
										onClick={() => convertMutation.mutate()}
										disabled={convertMutation.isPending}
									>
										<FileText className="h-4 w-4 me-2" />
										{t("pricing.quotations.actions.convertToInvoice")}
									</DropdownMenuItem>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => statusMutation.mutate("DRAFT")}
									disabled={statusMutation.isPending || existingQuotation.status === "DRAFT"}
								>
									{t("pricing.quotations.actions.revertToDraft")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}

					{/* Template Selector */}
					<Select
						value={selectedTemplate}
						onValueChange={setSelectedTemplate}
					>
						<SelectTrigger className="hidden sm:flex w-[180px] h-9 rounded-lg">
							<Layout className="h-4 w-4 me-2 text-muted-foreground" />
							<SelectValue placeholder={t("finance.templates.select")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="default">
								{defaultTemplate?.name || t("finance.templates.default")}
							</SelectItem>
							{templates
								.filter(t => t.id !== defaultTemplate?.id)
								.map((template) => (
									<SelectItem key={template.id} value={template.id}>
										{template.name}
									</SelectItem>
								))}
						</SelectContent>
					</Select>

					<Button
						type="button"
						variant="outline"
						size="icon"
						className="rounded-lg h-9 w-9"
						onClick={() => setShowPreviewDialog(true)}
					>
						<Eye className="h-4 w-4" />
					</Button>
					<Button type="button" variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => toast.info(t("finance.actions.printComingSoon"))}>
						<Printer className="h-4 w-4" />
					</Button>
					<Button type="button" variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => router.back()}>
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Non-editable warning */}
			{mode === "edit" && !isEditable && (
				<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
					<p className="text-amber-800 dark:text-amber-200 text-sm">
						{t("pricing.quotations.notEditable")}
					</p>
				</div>
			)}

			{/* Client & Document Settings Row */}
			<div className="grid gap-4 lg:grid-cols-6">
				{/* Client Section - Takes 4 columns */}
				<div className="lg:col-span-4 rounded-2xl border bg-card p-4 space-y-4">
					{/* Header with selector and new button */}
					<div className="flex items-center gap-3">
						<div className="flex-1">
							<ClientSelector
								organizationId={organizationId}
								onSelect={handleClientSelect}
								selectedClientId={clientId}
								disabled={!isEditable}
							/>
						</div>
						{isEditable && (
							<Button
								type="button"
								variant={showInlineClientForm ? "secondary" : "outline"}
								size="sm"
								className="rounded-xl gap-2 shrink-0"
								onClick={() => {
									setShowInlineClientForm(!showInlineClientForm);
									if (!showInlineClientForm) {
										clearClient();
									}
								}}
							>
								<UserPlus className="h-4 w-4" />
								{t("finance.clients.new")}
							</Button>
						)}
					</div>

					{/* Inline Client Form */}
					{showInlineClientForm && isEditable ? (
						<InlineClientForm
							organizationId={organizationId}
							onSuccess={(client) => {
								setClientId(client.id);
								setClientName(client.name);
								setClientCompany(client.company ?? "");
								setClientPhone(client.phone ?? "");
								setClientEmail(client.email ?? "");
								setClientAddress(client.address ?? "");
								setClientTaxNumber(client.taxNumber ?? "");
								setShowInlineClientForm(false);
							}}
							onCancel={() => setShowInlineClientForm(false)}
						/>
					) : clientId && clientName ? (
						/* Selected Client Card */
						<div className="rounded-xl border bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
							{/* Client Header */}
							<div className="flex items-center justify-between p-4 border-b border-blue-100 dark:border-blue-900/50">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
										{clientName.charAt(0).toUpperCase()}
									</div>
									<div>
										<p className="font-semibold text-foreground">{clientName}</p>
										{clientCompany && (
											<p className="text-xs text-muted-foreground flex items-center gap-1">
												<Building2 className="h-3 w-3" />
												{clientCompany}
											</p>
										)}
									</div>
								</div>
								{isEditable && (
									<Button type="button" variant="ghost" size="icon" onClick={clearClient} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>

							{/* Client Details */}
							<div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
								{clientPhone && (
									<div className="flex items-center gap-2 text-sm">
										<div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
											<Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
										</div>
										<span className="text-muted-foreground truncate">{clientPhone}</span>
									</div>
								)}
								{clientEmail && (
									<div className="flex items-center gap-2 text-sm">
										<div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
											<Mail className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
										</div>
										<span className="text-muted-foreground truncate">{clientEmail}</span>
									</div>
								)}
								{clientTaxNumber && (
									<div className="flex items-center gap-2 text-sm">
										<div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
											<CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
										</div>
										<span className="text-muted-foreground truncate font-mono text-xs">{clientTaxNumber}</span>
									</div>
								)}
								{clientAddress && (
									<div className="flex items-center gap-2 text-sm">
										<div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
											<MapPin className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
										</div>
										<span className="text-muted-foreground truncate">{clientAddress}</span>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-center">
							<User className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
							<p className="text-sm text-muted-foreground">{t("finance.clients.selectOrCreate")}</p>
						</div>
					)}
				</div>

				{/* Document Settings - Takes 1 column */}
				<div className="lg:col-span-1 rounded-2xl border bg-card p-3 space-y-2">
					<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
						<Receipt className="h-3.5 w-3.5" />
						{t("pricing.quotations.documentSettings")}
					</div>

					<div className="grid gap-2">
						{/* Quotation Number */}
						<Input
							value={quotationNumber}
							readOnly
							className="rounded-lg text-xs font-mono bg-muted/50 cursor-not-allowed h-9"
						/>

						{/* Quotation Date */}
						<Input
							type="date"
							value={quotationDate}
							onChange={(e) => setQuotationDate(e.target.value)}
							required
							lang="en"
							dir="ltr"
							disabled={!isEditable}
							className="rounded-lg h-9 text-xs [&::-webkit-calendar-picker-indicator]:cursor-pointer"
						/>

						{/* Sales Representative */}
						<Select value={salesRepId} onValueChange={setSalesRepId} disabled={!isEditable}>
							<SelectTrigger className="rounded-lg h-9 text-xs">
								<SelectValue placeholder={t("pricing.quotations.salesRep")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{members.map((member: any, index: number) => (
									<SelectItem key={member.id} value={member.id}>
										#{index + 1} {member.name || member.email}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Quick Actions - Takes 1 column */}
				<div className="lg:col-span-1 rounded-2xl border bg-card p-3 flex flex-col gap-2">
					{/* Save Button */}
					<Button
						type="submit"
						disabled={isSaving || !isEditable}
						className="w-full justify-start gap-2.5 px-3 py-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
					>
						<Save className="h-4 w-4" />
						<span className="text-sm font-medium">
							{isSaving
								? t("common.saving")
								: mode === "create"
									? t("common.save")
									: t("pricing.quotations.saveChanges")
							}
						</span>
					</Button>

					{/* Preview Button */}
					<button
						type="button"
						onClick={() => setShowPreviewDialog(true)}
						className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-200"
					>
						<div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
							<Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
						<span className="text-sm font-medium">{t("finance.actions.preview")}</span>
					</button>

					{/* Share Button */}
					<button
						type="button"
						onClick={() => {
							if (mode === "edit" && quotationId) {
								// Copy link to clipboard
								const url = `${window.location.origin}${basePath}/${quotationId}/preview`;
								navigator.clipboard.writeText(url);
								toast.success(t("common.linkCopied"));
							} else {
								toast.info(t("common.saveFirst"));
							}
						}}
						className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-200"
					>
						<div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
							<Share2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
						</div>
						<span className="text-sm font-medium">{t("common.share")}</span>
					</button>
				</div>
			</div>

			{/* Items Table */}
			<div className="rounded-2xl border bg-card overflow-hidden">
				{/* Table Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
					<div className="flex items-center gap-2">
						<span className="text-sm font-semibold">{t("pricing.quotations.items")}</span>
						<Badge variant="secondary" className="text-xs">
							{items.filter((i) => i.description.trim()).length}
						</Badge>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="rounded-lg h-8">
								<Columns className="h-4 w-4 me-2" />
								{t("finance.items.columns")}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48 rounded-xl">
							<DropdownMenuLabel>{t("finance.items.showColumns")}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{(Object.keys(columnLabels) as ColumnKey[]).filter(k => !["actions", "index"].includes(k)).map((column) => (
								<DropdownMenuCheckboxItem
									key={column}
									checked={isColumnVisible(column)}
									onCheckedChange={() => toggleColumn(column)}
								>
									{columnLabels[column]}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40">
								{isColumnVisible("index") && <th className="p-3 text-center w-12 text-xs font-medium text-muted-foreground">#</th>}
								{isColumnVisible("description") && <th className="p-3 text-start text-xs font-medium text-muted-foreground min-w-[180px]">{columnLabels.description}</th>}
								{isColumnVisible("unit") && <th className="p-3 text-center text-xs font-medium text-muted-foreground w-20">{columnLabels.unit}</th>}
								{isColumnVisible("unitPrice") && <th className="p-3 text-center text-xs font-medium text-muted-foreground w-28">{columnLabels.unitPrice}</th>}
								{isColumnVisible("quantity") && <th className="p-3 text-center text-xs font-medium text-muted-foreground w-20">{columnLabels.quantity}</th>}
								{isColumnVisible("discount") && <th className="p-3 text-center text-xs font-medium text-muted-foreground w-20">{columnLabels.discount}</th>}
								{isColumnVisible("tax") && includeTax && <th className="p-3 text-center text-xs font-medium text-muted-foreground w-20">{columnLabels.tax}</th>}
								{isColumnVisible("total") && <th className="p-3 text-center text-xs font-medium text-muted-foreground w-28">{columnLabels.total}</th>}
								<th className="p-3 w-10"></th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, index) => (
								<tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
									{isColumnVisible("index") && (
										<td className="p-2 text-center">
											<div className="flex flex-col items-center gap-0.5">
												{isEditable && (
													<button
														type="button"
														onClick={() => moveItemUp(index)}
														disabled={index === 0}
														className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
													>
														<ChevronUp className="h-3 w-3 text-muted-foreground" />
													</button>
												)}
												<span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
													{index + 1}
												</span>
												{isEditable && (
													<button
														type="button"
														onClick={() => moveItemDown(index)}
														disabled={index === items.length - 1}
														className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
													>
														<ChevronDown className="h-3 w-3 text-muted-foreground" />
													</button>
												)}
											</div>
										</td>
									)}
									{isColumnVisible("description") && (
										<td className="p-2 align-top">
											<textarea
												value={item.description}
												onChange={(e) => {
													updateItem(item.id, { description: e.target.value });
													e.target.style.height = "auto";
													e.target.style.height = e.target.scrollHeight + "px";
												}}
												placeholder={t("finance.items.descriptionPlaceholder")}
												rows={1}
												disabled={!isEditable}
												className="w-full min-h-[36px] px-3 py-2 rounded-lg text-sm border-0 bg-transparent focus:bg-background focus:border focus:outline-none resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
											/>
										</td>
									)}
									{isColumnVisible("unit") && (
										<td className="p-2">
											<Input
												value={item.unit}
												onChange={(e) => updateItem(item.id, { unit: e.target.value })}
												placeholder="م²"
												disabled={!isEditable}
												className="rounded-lg h-9 text-sm text-center border-0 bg-transparent focus:bg-background focus:border"
											/>
										</td>
									)}
									{isColumnVisible("unitPrice") && (
										<td className="p-2">
											<Input
												type="number"
												min="0"
												step="0.01"
												value={item.unitPrice || ""}
												onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}
												placeholder="0.00"
												disabled={!isEditable}
												className="rounded-lg h-9 text-sm text-center border-0 bg-transparent focus:bg-background focus:border"
											/>
										</td>
									)}
									{isColumnVisible("quantity") && (
										<td className="p-2">
											<Input
												type="number"
												min="0"
												step="0.01"
												value={item.quantity || ""}
												onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
												placeholder="1"
												disabled={!isEditable}
												className="rounded-lg h-9 text-sm text-center border-0 bg-transparent focus:bg-background focus:border"
											/>
										</td>
									)}
									{isColumnVisible("discount") && (
										<td className="p-2">
											<div className="flex items-center justify-center gap-0.5">
												<Input
													type="number"
													min="0"
													max="100"
													value={item.discountPercent || ""}
													onChange={(e) => updateItem(item.id, { discountPercent: Number(e.target.value) || 0 })}
													placeholder="0"
													disabled={!isEditable}
													className="rounded-lg h-9 text-sm text-center border-0 bg-transparent focus:bg-background focus:border w-14"
												/>
												<span className="text-xs text-muted-foreground">%</span>
											</div>
										</td>
									)}
									{isColumnVisible("tax") && includeTax && (
										<td className="p-2">
											<div className="flex items-center justify-center gap-0.5">
												<Input
													type="number"
													min="0"
													max="100"
													value={item.taxPercent || ""}
													onChange={(e) => updateItem(item.id, { taxPercent: Number(e.target.value) || 0 })}
													placeholder="15"
													disabled={!isEditable}
													className="rounded-lg h-9 text-sm text-center border-0 bg-transparent focus:bg-background focus:border w-14"
												/>
												<span className="text-xs text-muted-foreground">%</span>
											</div>
										</td>
									)}
									{isColumnVisible("total") && (
										<td className="p-2 text-center font-semibold text-primary">
											{formatCurrency(calculateItemTotal(item))}
										</td>
									)}
									<td className="p-2">
										{items.length > 1 && isEditable && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
												onClick={() => removeItem(item.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Add Item */}
				{isEditable && (
					<div className="p-3 border-t">
						<Button type="button" variant="outline" size="sm" className="w-full rounded-lg border-dashed" onClick={addItem}>
							<Plus className="h-4 w-4 me-2" />
							{t("finance.items.add")}
						</Button>
					</div>
				)}
			</div>

			{/* Terms & Totals Row */}
			<div className="grid gap-4 lg:grid-cols-5">
				{/* Terms Section - 3 columns */}
				<div className="lg:col-span-3">
					<Collapsible open={termsOpen} onOpenChange={setTermsOpen}>
						<CollapsibleTrigger asChild>
							<Button type="button" variant="outline" className="w-full justify-between rounded-xl h-12">
								<span className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-muted-foreground" />
									{t("pricing.quotations.terms")}
									{(paymentTerms || deliveryTerms || warrantyTerms || notes) && (
										<Badge variant="secondary" className="text-xs">{t("common.completed")}</Badge>
									)}
								</span>
								<ChevronDown className={cn("h-4 w-4 transition-transform", termsOpen && "rotate-180")} />
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="pt-3 space-y-3">
							<div className="grid gap-3 sm:grid-cols-2">
								<div>
									<Label className="text-xs text-muted-foreground">{t("pricing.quotations.paymentTerms")}</Label>
									<Textarea
										value={paymentTerms}
										onChange={(e) => setPaymentTerms(e.target.value)}
										placeholder={t("pricing.quotations.paymentTermsPlaceholder")}
										rows={2}
										disabled={!isEditable}
										className="rounded-lg mt-1 text-sm"
									/>
								</div>
								<div>
									<Label className="text-xs text-muted-foreground">{t("pricing.quotations.deliveryTerms")}</Label>
									<Textarea
										value={deliveryTerms}
										onChange={(e) => setDeliveryTerms(e.target.value)}
										placeholder={t("pricing.quotations.deliveryTermsPlaceholder")}
										rows={2}
										disabled={!isEditable}
										className="rounded-lg mt-1 text-sm"
									/>
								</div>
								<div>
									<Label className="text-xs text-muted-foreground">{t("pricing.quotations.warrantyTerms")}</Label>
									<Textarea
										value={warrantyTerms}
										onChange={(e) => setWarrantyTerms(e.target.value)}
										placeholder={t("pricing.quotations.warrantyTermsPlaceholder")}
										rows={2}
										disabled={!isEditable}
										className="rounded-lg mt-1 text-sm"
									/>
								</div>
								<div>
									<Label className="text-xs text-muted-foreground">{t("pricing.quotations.notes")}</Label>
									<Textarea
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder={t("pricing.quotations.notesPlaceholder")}
										rows={2}
										disabled={!isEditable}
										className="rounded-lg mt-1 text-sm"
									/>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>

					{/* Custom Template Elements - حقول العناصر المخصصة من القالب */}
					{activeTemplate?.content && (() => {
						const templateContent = activeTemplate.content as { elements?: Array<{ id: string; type: string; enabled: boolean; order: number; settings: Record<string, unknown> }> };
						const editableElements = (templateContent.elements || [])
							.filter((el) => el.enabled && el.type === "text" && el.settings?.isEditable !== false)
							.sort((a, b) => a.order - b.order); // ترتيب حسب order في القالب
						if (editableElements.length === 0) return null;
						return (
							<div className="mt-3 space-y-3">
								<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<FileText className="h-4 w-4" />
									{t("pricing.quotations.customFields")}
								</h4>
								{editableElements.map((element) => (
									<div key={element.id} className="space-y-1">
										<Label className="text-sm">
											{(element.settings.label as string) || t("finance.templates.editor.elementTypes.text")}
										</Label>
										<Textarea
											value={customElementData[element.id]?.content || (element.settings.content as string) || ""}
											onChange={(e) => setCustomElementData(prev => ({
												...prev,
												[element.id]: { content: e.target.value }
											}))}
											placeholder={(element.settings.placeholder as string) || ""}
											rows={2}
											disabled={!isEditable}
											className="rounded-lg text-sm"
										/>
									</div>
								))}
							</div>
						);
					})()}
				</div>

				{/* Totals Card - 2 columns */}
				<div className="lg:col-span-2 rounded-2xl border bg-card p-4 space-y-4">
					{/* Subtotal */}
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("finance.summary.subtotal")}</span>
						<span className="font-medium">{formatCurrency(subtotal)}</span>
					</div>

					{/* Items Discount */}
					{itemsDiscountTotal > 0 && (
						<div className="flex items-center justify-between text-sm text-orange-600">
							<span>{t("finance.summary.itemsDiscount")}</span>
							<span>-{formatCurrency(itemsDiscountTotal)}</span>
						</div>
					)}

					{/* Global Discount Toggle */}
					<div className="flex items-center justify-between py-2 border-t border-b">
						<div className="flex items-center gap-2">
							<Switch checked={includeDiscount} onCheckedChange={setIncludeDiscount} disabled={!isEditable} />
							<span className="text-sm">{t("finance.summary.discount")}</span>
						</div>
						{includeDiscount && (
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant={discountType === "percent" ? "secondary" : "ghost"}
									size="sm"
									className="h-7 px-2 text-xs rounded-md"
									onClick={() => setDiscountType("percent")}
									disabled={!isEditable}
								>
									%
								</Button>
								<Button
									type="button"
									variant={discountType === "amount" ? "secondary" : "ghost"}
									size="sm"
									className="h-7 px-2 text-xs rounded-md"
									onClick={() => setDiscountType("amount")}
									disabled={!isEditable}
								>
									ر.س
								</Button>
								<Input
									type="number"
									min="0"
									max={discountType === "percent" ? 100 : undefined}
									value={discountType === "percent" ? globalDiscountPercent : globalDiscountAmount}
									onChange={(e) => {
										if (discountType === "percent") {
											setGlobalDiscountPercent(Number(e.target.value) || 0);
										} else {
											setGlobalDiscountAmount(Number(e.target.value) || 0);
										}
									}}
									disabled={!isEditable}
									className="w-20 h-7 text-center text-sm rounded-md"
								/>
							</div>
						)}
					</div>

					{/* Show discount value if applied */}
					{includeDiscount && globalDiscountValue > 0 && (
						<div className="flex items-center justify-between text-sm text-orange-600">
							<span>
								{discountType === "percent" ? `${globalDiscountPercent}%` : t("pricing.quotations.fixedAmount")}
							</span>
							<span>-{formatCurrency(globalDiscountValue)}</span>
						</div>
					)}

					{/* Tax Toggle */}
					<div className="flex items-center justify-between py-2 border-b">
						<div className="flex items-center gap-2">
							<Switch checked={includeTax} onCheckedChange={setIncludeTax} disabled={!isEditable} />
							<span className="text-sm">{t("finance.summary.vat")}</span>
						</div>
						{includeTax && (
							<div className="flex items-center gap-1">
								<Input
									type="number"
									min="0"
									max="100"
									value={globalVatPercent}
									onChange={(e) => setGlobalVatPercent(Number(e.target.value) || 0)}
									disabled={!isEditable}
									className="w-16 h-7 text-center text-sm rounded-md"
								/>
								<span className="text-xs text-muted-foreground">%</span>
							</div>
						)}
					</div>

					{/* Tax value */}
					{includeTax && taxAmount > 0 && (
						<div className="flex items-center justify-between text-sm text-emerald-600">
							<span>{globalVatPercent}%</span>
							<span>+{formatCurrency(taxAmount)}</span>
						</div>
					)}

					{/* Total */}
					<div className="flex items-center justify-between pt-2 border-t">
						<span className="font-bold">{t("finance.summary.total")}</span>
						<span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)} <span className="text-sm font-normal">ر.س</span></span>
					</div>
				</div>
			</div>

			{/* Mobile Fixed Bottom Bar */}
			<div className="fixed bottom-0 inset-x-0 z-50 lg:hidden backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-t p-4 safe-area-inset-bottom">
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-xs text-muted-foreground">{t("finance.summary.total")}</p>
						<p className="text-xl font-bold text-primary">
							{formatCurrency(totalAmount)}
							<span className="text-sm font-normal text-muted-foreground ms-1">ر.س</span>
						</p>
					</div>
					{isEditable && (
						<Button type="submit" size="lg" className="rounded-xl px-8" disabled={isSaving}>
							<Save className="h-4 w-4 me-2" />
							{isSaving ? t("common.saving") : (mode === "create" ? t("common.save") : t("pricing.quotations.saveChanges"))}
						</Button>
					)}
				</div>
			</div>

			{/* Preview Dialog */}
			<Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
					<DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
						<DialogTitle className="flex items-center gap-2">
							<Eye className="h-5 w-5" />
							{t("finance.actions.preview")}
						</DialogTitle>
					</DialogHeader>
					<div className="bg-slate-100 dark:bg-slate-900 p-4 min-h-[60vh]">
						<div className="bg-white dark:bg-card rounded-xl shadow-lg overflow-hidden">
							<TemplateRenderer
								data={{
									quotationNo: quotationNumber,
									createdAt: quotationDate,
									validUntil: (() => {
										const validDate = new Date(quotationDate);
										validDate.setDate(validDate.getDate() + (orgSettings?.quotationValidityDays || 30));
										return validDate.toISOString();
									})(),
									status: existingQuotation?.status || "DRAFT",
									clientName,
									clientCompany,
									clientPhone,
									clientEmail,
									clientAddress,
									clientTaxNumber,
									items: items
										.filter((item) => item.description.trim())
										.map((item) => ({
											description: item.description,
											quantity: item.quantity,
											unit: item.unit,
											unitPrice: item.unitPrice,
											totalPrice: item.quantity * item.unitPrice,
										})),
									subtotal,
									discountPercent: includeDiscount && discountType === "percent" ? globalDiscountPercent : 0,
									discountAmount: globalDiscountValue,
									vatPercent: includeTax ? globalVatPercent : 0,
									vatAmount: taxAmount,
									totalAmount,
									paymentTerms: paymentTerms || orgSettings?.defaultPaymentTerms,
									deliveryTerms: deliveryTerms || orgSettings?.defaultDeliveryTerms,
									warrantyTerms: warrantyTerms || orgSettings?.defaultWarrantyTerms,
									notes,
								}}
								template={{
									elements: (activeTemplate?.content as { elements?: any[] })?.elements || [],
									settings: (activeTemplate?.settings as any) || {},
								}}
								customElementData={customElementData}
								organization={{
									name: orgSettings?.companyNameAr || undefined,
									nameAr: orgSettings?.companyNameAr || undefined,
									nameEn: orgSettings?.companyNameEn || undefined,
									logo: orgSettings?.logo || undefined,
									address: orgSettings?.address || undefined,
									addressAr: orgSettings?.address || undefined,
									addressEn: orgSettings?.addressEn || undefined,
									phone: orgSettings?.phone || undefined,
									email: orgSettings?.email || undefined,
									website: orgSettings?.website || undefined,
									taxNumber: orgSettings?.taxNumber || undefined,
									commercialReg: orgSettings?.commercialReg || undefined,
									bankName: orgSettings?.bankName || undefined,
									bankNameEn: orgSettings?.bankNameEn || undefined,
									accountName: orgSettings?.accountName || undefined,
									iban: orgSettings?.iban || undefined,
									accountNumber: orgSettings?.accountNumber || undefined,
									swiftCode: orgSettings?.swiftCode || undefined,
									headerText: orgSettings?.headerText || undefined,
									footerText: orgSettings?.footerText || undefined,
									thankYouMessage: orgSettings?.thankYouMessage || undefined,
								}}
								documentType="quotation"
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</form>
	);
}
