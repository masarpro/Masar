"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { UNIT_KEYS, UNIT_VALUES, formatCurrency } from "@saas/shared/lib/invoice-constants";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Switch } from "@ui/components/switch";
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
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
	DropdownMenuItem,
} from "@ui/components/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { toast } from "sonner";
import Link from "next/link";
import {
	Save,
	User,
	FileText,
	Plus,
	ChevronDown,
	ChevronUp,
	ChevronLeft,
	Trash2,
	Columns,
	Eye,
	Printer,
	ArrowRight,
	ArrowRightLeft,
	Calendar,
	FolderOpen,
	Send,
	MoreVertical,
	CheckCircle,
	XCircle,
	StickyNote,
	Paperclip,
	Receipt,
} from "lucide-react";
import { cn } from "@ui/lib";
import { ClientSelector, type Client } from "@saas/finance/components/shared/ClientSelector";
import { InlineClientForm } from "@saas/finance/components/clients/InlineClientForm";
import { StatusBadge } from "@saas/finance/components/shared/StatusBadge";
import { AmountSummary } from "@saas/finance/components/shared/AmountSummary";
import { calculateTotals } from "@saas/finance/lib/utils";
import { TemplateRenderer } from "@saas/company/components/templates/renderer";
import { EditorPageSkeleton } from "@saas/shared/components/skeletons";

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
}

type ColumnKey = "index" | "description" | "unit" | "unitPrice" | "quantity" | "total" | "actions";

const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
	"index", "description", "unit", "unitPrice", "quantity", "total", "actions",
];

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
	const [quotationNumber, setQuotationNumber] = useState("");
	const [quotationDate, setQuotationDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});
	const [validUntilDate, setValidUntilDate] = useState(() => {
		const date = new Date();
		date.setDate(date.getDate() + 30);
		return date.toISOString().split("T")[0];
	});
	const [salesRepId, setSalesRepId] = useState<string | undefined>();
	const [projectId, setProjectId] = useState<string | undefined>();
	const [showProjectLink, setShowProjectLink] = useState(false);
	const [customElementData, setCustomElementData] = useState<Record<string, { content?: string }>>({});

	// Terms
	const [paymentTerms, setPaymentTerms] = useState("");
	const [deliveryTerms, setDeliveryTerms] = useState("");
	const [warrantyTerms, setWarrantyTerms] = useState("");
	const [notes, setNotes] = useState("");

	// Tax & Discount (simplified: always show, percent only)
	const [vatPercent, setVatPercent] = useState(15);
	const [discountPercent, setDiscountPercent] = useState(0);

	// Items
	const [items, setItems] = useState<QuotationItem[]>([
		{ id: "1", description: "", quantity: 1, unit: "", unitPrice: 0 },
	]);

	// UI state
	const [showNewClientDialog, setShowNewClientDialog] = useState(false);
	const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
	const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);
	const [isInitialized, setIsInitialized] = useState(mode === "create");
	const [showPreviewDialog, setShowPreviewDialog] = useState(false);

	// Column visibility helpers
	const columnLabels: Record<ColumnKey, string> = {
		index: "#",
		description: t("finance.items.description"),
		unit: t("finance.items.unit"),
		unitPrice: t("finance.items.unitPrice"),
		quantity: t("finance.items.quantity"),
		total: t("finance.items.total"),
		actions: "",
	};

	const toggleColumn = (column: ColumnKey) => {
		setVisibleColumns((prev) =>
			prev.includes(column)
				? prev.filter((c) => c !== column)
				: [...prev, column],
		);
	};

	const isColumnVisible = (column: ColumnKey) => visibleColumns.includes(column);

	// Unit options for select
	const units = UNIT_KEYS.map((key) => ({
		value: UNIT_VALUES[key],
		label: t(`finance.units.${key}`),
	}));

	// Fetch existing quotation for edit mode
	const { data: existingQuotationRaw, isLoading: isLoadingQuotation } = useQuery({
		...orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId! },
		}),
		enabled: mode === "edit" && !!quotationId,
	});
	const existingQuotation = existingQuotationRaw as any;

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
			setValidUntilDate(new Date(existingQuotation.validUntil).toISOString().split("T")[0]);
			setPaymentTerms(existingQuotation.paymentTerms ?? "");
			setDeliveryTerms(existingQuotation.deliveryTerms ?? "");
			setWarrantyTerms(existingQuotation.warrantyTerms ?? "");
			setNotes(existingQuotation.notes ?? "");
			setVatPercent(existingQuotation.vatPercent);
			setDiscountPercent(existingQuotation.discountPercent);
			if (existingQuotation.projectId) {
				setProjectId(existingQuotation.projectId);
				setShowProjectLink(true);
			}

			if (existingQuotation.items && existingQuotation.items.length > 0) {
				setItems(
					existingQuotation.items.map((item: any) => ({
						id: item.id,
						description: item.description,
						quantity: item.quantity,
						unit: item.unit ?? "",
						unitPrice: item.unitPrice,
					}))
				);
			}

			// Open client details if we have client data
			if (existingQuotation.clientName) {
				setClientDetailsOpen(false);
			}

			setIsInitialized(true);
		}
	}, [existingQuotation, mode, isInitialized]);

	// Fetch organization members for sales rep
	const { data: membersDataRaw } = useQuery(
		orpc.orgUsers.list.queryOptions({
			input: { organizationId },
		}),
	);
	const membersData = membersDataRaw as any;
	const members = membersData?.users ?? [];

	// Fetch organization finance settings
	const { data: orgSettingsRaw } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});
	const orgSettings = orgSettingsRaw as any;

	// Apply finance settings defaults (create mode only)
	useEffect(() => {
		if (orgSettings && mode === "create") {
			if (orgSettings.defaultVatPercent !== undefined) {
				setVatPercent(orgSettings.defaultVatPercent);
			}
			if (orgSettings.quotationValidityDays) {
				const date = new Date();
				date.setDate(date.getDate() + orgSettings.quotationValidityDays);
				setValidUntilDate(date.toISOString().split("T")[0]);
			}
		}
	}, [orgSettings, mode]);

	// Fetch default template for quotations
	const { data: defaultTemplateRaw } = useQuery(
		orpc.company.templates.getDefault.queryOptions({
			input: { organizationId, templateType: "QUOTATION" },
		}),
	);
	const defaultTemplate = defaultTemplateRaw as any;

	// Fetch projects for dropdown
	const { data: projectsDataRaw } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);
	const projectsData = projectsDataRaw as any;
	const projects = projectsData?.projects ?? [];

	// Calculate totals using shared utility
	const totals = calculateTotals(items, discountPercent, vatPercent);

	// Check if editable (only DRAFT status can be edited)
	const isEditable = mode === "create" || (existingQuotation?.status === "DRAFT");

	const currency = orgSettings?.defaultCurrency || "SAR";

	// Item manipulation functions
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

	// Client handlers
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

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.pricing.quotations.create({
				organizationId,
				clientId,
				clientName,
				clientCompany,
				clientPhone,
				clientEmail: clientEmail || undefined,
				clientAddress,
				clientTaxNumber,
				validUntil: new Date(validUntilDate).toISOString(),
				paymentTerms,
				deliveryTerms,
				warrantyTerms,
				notes,
				templateId: defaultTemplate?.id,
				vatPercent,
				discountPercent,
				projectId: !showProjectLink || projectId === "none" ? undefined : projectId,
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
			return orpcClient.pricing.quotations.update({
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
				templateId: existingQuotation?.templateId,
				vatPercent,
				discountPercent,
				projectId: !showProjectLink || projectId === "none" ? null : projectId,
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("pricing.quotations.updateError"));
		},
	});

	// Update items mutation
	const updateItemsMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.pricing.quotations.updateItems({
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
			});
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

	// Validation
	const validateForm = (): boolean => {
		if (!clientName.trim()) {
			toast.error(t("pricing.quotations.errors.clientRequired"));
			return false;
		}
		const validItems = items.filter((item) => item.description.trim());
		if (validItems.length === 0) {
			toast.error(t("pricing.quotations.errors.itemsRequired"));
			return false;
		}
		return true;
	};

	// Submit handler
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		if (mode === "create") {
			createMutation.mutate();
		} else {
			try {
				await updateMutation.mutateAsync();
				await updateItemsMutation.mutateAsync();
				toast.success(t("pricing.quotations.updateSuccess"));
				queryClient.invalidateQueries({
					queryKey: ["finance", "quotations"],
				});
			} catch {
				// Error handled in mutations
			}
		}
	};

	const isBusy = createMutation.isPending || updateMutation.isPending || updateItemsMutation.isPending;

	// Loading state for edit mode
	if (mode === "edit" && isLoadingQuotation) {
		return <EditorPageSkeleton />;
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
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
			<form onSubmit={handleSubmit} className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header (Sticky) ──────────────────────────────── */}
				<div className="sticky top-0 z-20 py-3 px-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
					<div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
						{/* Start: back + breadcrumb/title */}
						<div className="flex items-center gap-3 min-w-0">
							<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border shadow-sm">
								<Link href={`/app/${organizationSlug}/pricing/quotations`}>
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
							<div className="min-w-0">
								<nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
									<Link href={`/app/${organizationSlug}/pricing`} className="hover:text-foreground transition-colors">{t("pricing.title")}</Link>
									<ChevronLeft className="h-3 w-3 shrink-0" />
									<Link href={`/app/${organizationSlug}/pricing/quotations`} className="hover:text-foreground transition-colors">{t("pricing.quotations.title")}</Link>
									{mode === "edit" && existingQuotation && (
										<>
											<ChevronLeft className="h-3 w-3 shrink-0" />
											<span>{existingQuotation.quotationNo}</span>
										</>
									)}
								</nav>
								<h1 className="text-base font-bold leading-tight truncate flex items-center gap-2">
									{mode === "edit" && existingQuotation ? (
										<>
											{existingQuotation.quotationNo}
											<StatusBadge status={existingQuotation.status} type="quotation" />
										</>
									) : (
										t("pricing.quotations.create")
									)}
								</h1>
							</div>
						</div>

						{/* End: actions */}
						<div className="flex items-center gap-1.5 shrink-0">
							<Button
								type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
								onClick={() => setShowPreviewDialog(true)}
							>
								<Eye className="h-4 w-4" />
							</Button>
							<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toast.info(t("finance.actions.printComingSoon"))}>
								<Printer className="h-4 w-4" />
							</Button>
							<div className="w-px h-5 bg-border/50" />
							{/* Save Draft Button */}
							<Button type="submit" variant="outline" size="sm" disabled={isBusy || !isEditable} className="hidden sm:flex h-8 rounded-lg text-xs px-3 shadow-sm">
								<Save className="h-3.5 w-3.5 me-1.5" />
								{isBusy ? t("common.saving") : mode === "create" ? t("pricing.quotations.saveAsDraft") : t("pricing.quotations.saveChanges")}
							</Button>
							{/* Convert to Invoice Button (prominent) */}
							{mode === "edit" && existingQuotation && existingQuotation.status !== "DRAFT" && existingQuotation.status !== "CONVERTED" && (
								<Button type="button" size="sm" className="hidden sm:flex h-8 rounded-lg text-xs px-3 shadow-sm bg-blue-600 hover:bg-blue-700 text-white" asChild>
									<Link href={`/app/${organizationSlug}/finance/invoices/new?quotationId=${quotationId}`}>
										<ArrowRightLeft className="h-3.5 w-3.5 me-1.5" />
										{t("pricing.quotations.actions.convertToInvoice")}
									</Link>
								</Button>
							)}
							{/* Status Actions (edit mode) */}
							{mode === "edit" && existingQuotation && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
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
										{existingQuotation.status !== "DRAFT" && existingQuotation.status !== "CONVERTED" && (
											<DropdownMenuItem asChild>
												<Link href={`/app/${organizationSlug}/finance/invoices/new?quotationId=${quotationId}`}>
													<ArrowRightLeft className="h-4 w-4 me-2" />
													{t("pricing.quotations.actions.convertToInvoice")}
												</Link>
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
						</div>
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

				{/* ─── Client + Details Grid ───────────────────────────── */}
				<div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">

					{/* Client Card */}
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
							<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center">
								<User className="h-[15px] w-[15px] text-blue-500" />
							</div>
							<span className="text-sm font-semibold text-foreground">{t("pricing.quotations.clientInfo")}</span>
							{isEditable && (
								<Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClientDialog(true)} className="ms-auto rounded-lg h-7 text-xs border border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 px-3">
									<Plus className="h-3 w-3 me-1" />
									{t("finance.clients.addClient")}
								</Button>
							)}
						</div>
						<div className="p-5 space-y-3">
							<ClientSelector
								organizationId={organizationId}
								onSelect={handleClientSelect}
								selectedClientId={clientId}
								disabled={!isEditable}
							/>

							{clientName && (
								<div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/15 px-4 py-3 space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">{clientName}</span>
										{clientTaxNumber && (
											<Badge variant="outline" className="text-[10px] font-mono h-5">{clientTaxNumber}</Badge>
										)}
									</div>
									<div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
										{clientCompany && <span>{clientCompany}</span>}
										{clientPhone && <span dir="ltr">{clientPhone}</span>}
										{clientEmail && <span dir="ltr">{clientEmail}</span>}
									</div>
									{isEditable && (
										<button type="button" onClick={() => setClientDetailsOpen(!clientDetailsOpen)} className="text-xs text-primary hover:underline mt-0.5">
											{clientDetailsOpen ? t("common.close") : t("common.edit")}
										</button>
									)}
								</div>
							)}

							{clientDetailsOpen && isEditable && (
								<div className="grid gap-3 sm:grid-cols-2 pt-1">
									<div>
										<Label className="text-xs">{t("pricing.quotations.clientName")} *</Label>
										<Input value={clientName} onChange={(e: any) => setClientName(e.target.value)} placeholder={t("pricing.quotations.clientNamePlaceholder")} required className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("pricing.quotations.clientCompany")}</Label>
										<Input value={clientCompany} onChange={(e: any) => setClientCompany(e.target.value)} placeholder={t("pricing.quotations.clientCompanyPlaceholder")} className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("pricing.quotations.clientPhone")}</Label>
										<Input value={clientPhone} onChange={(e: any) => setClientPhone(e.target.value)} placeholder="05xxxxxxxx" className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("pricing.quotations.clientEmail")}</Label>
										<Input type="email" value={clientEmail} onChange={(e: any) => setClientEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("pricing.quotations.clientTaxNumber")}</Label>
										<Input value={clientTaxNumber} onChange={(e: any) => setClientTaxNumber(e.target.value)} placeholder={t("pricing.quotations.taxNumberPlaceholder")} className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("pricing.quotations.clientAddress")}</Label>
										<Input value={clientAddress} onChange={(e: any) => setClientAddress(e.target.value)} placeholder={t("pricing.quotations.addressPlaceholder")} className="rounded-xl mt-1 h-9" />
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Details Card */}
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
							<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/40 dark:to-sky-800/20 flex items-center justify-center">
								<Calendar className="h-[15px] w-[15px] text-sky-500" />
							</div>
							<span className="text-sm font-semibold text-foreground">{t("pricing.quotations.detailsMetadata")}</span>
						</div>
						<div className="p-5 space-y-3.5">
							{/* Quotation Number (read-only) */}
							<div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50">
								<span className="text-xs text-muted-foreground font-medium">{t("pricing.quotations.columns.number")}</span>
								<span className="text-sm font-bold font-mono text-foreground tracking-wide">
									{mode === "edit" && existingQuotation ? existingQuotation.quotationNo : `QT-${new Date().getFullYear()}-XXXX`}
								</span>
							</div>

							{/* Dates */}
							<div className="grid grid-cols-2 gap-3">
								<div>
									<Label className="text-xs text-muted-foreground">{t("pricing.quotations.quotationDate")}</Label>
									<Input
										type="date"
										value={quotationDate}
										onChange={(e: any) => setQuotationDate(e.target.value)}
										required
										disabled={!isEditable}
										className="rounded-xl mt-1 h-9"
									/>
								</div>
								<div>
									<Label className="text-xs text-muted-foreground">{t("pricing.quotations.validUntil")}</Label>
									<Input
										type="date"
										value={validUntilDate}
										onChange={(e: any) => setValidUntilDate(e.target.value)}
										required
										disabled={!isEditable}
										className="rounded-xl mt-1 h-9"
									/>
								</div>
							</div>

							{/* Sales Representative */}
							<div>
								<Label className="text-xs text-muted-foreground">{t("pricing.quotations.salesRep")}</Label>
								<Select value={salesRepId} onValueChange={setSalesRepId} disabled={!isEditable}>
									<SelectTrigger className="rounded-xl mt-1 h-9">
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

							{/* Project Link */}
							<div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${showProjectLink ? "bg-sky-50/50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800/40" : "bg-slate-50/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700"}`}>
								<div className="flex items-center gap-2">
									<FolderOpen className={`h-4 w-4 ${showProjectLink ? "text-sky-500" : "text-muted-foreground"}`} />
									<span className={`text-sm font-medium ${showProjectLink ? "text-sky-700 dark:text-sky-400" : "text-muted-foreground"}`}>{t("pricing.quotations.project")}</span>
								</div>
								<Switch checked={showProjectLink} onCheckedChange={(checked: any) => { setShowProjectLink(checked); if (!checked) setProjectId(undefined); }} disabled={!isEditable} />
							</div>
							{showProjectLink && (
								<Select value={projectId ?? "none"} onValueChange={setProjectId} disabled={!isEditable}>
									<SelectTrigger className="rounded-xl h-9">
										<SelectValue placeholder={t("pricing.quotations.selectProject")} />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="none">{t("pricing.quotations.noProject")}</SelectItem>
										{projects.map((project: any) => (
											<SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{/* Currency + VAT badges */}
							<div className="flex items-center gap-2 pt-1">
								<Badge variant="secondary" className="text-xs font-medium">{currency}</Badge>
								<div className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800/40 text-xs font-bold text-sky-700 dark:text-sky-400">
									{t("pricing.quotations.vatPercent")} {vatPercent}%
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* ─── Items Table ─────────────────────────────────────── */}
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
					<div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
						<div className="flex items-center gap-2.5">
							<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 flex items-center justify-center">
								<FileText className="h-[15px] w-[15px] text-amber-500" />
							</div>
							<span className="text-sm font-semibold text-foreground">{t("pricing.quotations.items")}</span>
							<span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">{items.filter((i) => i.description.trim()).length}</span>
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
									<DropdownMenuCheckboxItem key={column} checked={isColumnVisible(column)} onCheckedChange={() => toggleColumn(column)}>
										{columnLabels[column]}
									</DropdownMenuCheckboxItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-slate-50/80 dark:bg-slate-800/30">
									{isColumnVisible("index") && <th className="p-3 text-center w-12 text-[11.5px] font-semibold text-muted-foreground tracking-wide">#</th>}
									{isColumnVisible("description") && <th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground min-w-[180px] tracking-wide">{columnLabels.description}</th>}
									{isColumnVisible("unit") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-24 tracking-wide">{columnLabels.unit}</th>}
									{isColumnVisible("unitPrice") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-28 tracking-wide">{columnLabels.unitPrice}</th>}
									{isColumnVisible("quantity") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-20 tracking-wide">{columnLabels.quantity}</th>}
									{isColumnVisible("total") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-28 tracking-wide">{columnLabels.total}</th>}
									<th className="p-3 w-10" />
								</tr>
							</thead>
							<tbody>
								{items.map((item, index) => (
									<tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/30 last:border-0 hover:bg-primary/[0.02] transition-colors">
										{isColumnVisible("index") && (
											<td className="p-2 text-center">
												<div className="flex flex-col items-center gap-0.5">
													{isEditable && (
														<button type="button" onClick={() => moveItemUp(index)} disabled={index === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
															<ChevronUp className="h-3 w-3 text-muted-foreground" />
														</button>
													)}
													<span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center text-xs font-bold">{index + 1}</span>
													{isEditable && (
														<button type="button" onClick={() => moveItemDown(index)} disabled={index === items.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
													onChange={(e: any) => { updateItem(item.id, { description: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
													placeholder={t("finance.items.descriptionPlaceholder")}
													rows={1}
													disabled={!isEditable}
													className="w-full min-h-[36px] px-3 py-2 rounded-[10px] text-sm border border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08] focus:outline-none resize-none overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
												/>
											</td>
										)}
										{isColumnVisible("unit") && (
											<td className="p-2">
												<Select value={item.unit || "_empty"} onValueChange={(v: any) => updateItem(item.id, { unit: v === "_empty" ? "" : v })} disabled={!isEditable}>
													<SelectTrigger className="rounded-[10px] h-9 text-xs px-1 border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30"><SelectValue placeholder={t("finance.items.unitPlaceholder")} /></SelectTrigger>
													<SelectContent className="rounded-xl">
														<SelectItem value="_empty">-</SelectItem>
														{units.map((u) => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}
													</SelectContent>
												</Select>
											</td>
										)}
										{isColumnVisible("unitPrice") && (
											<td className="p-2">
												<Input type="number" min="0" step="0.01" value={item.unitPrice || ""} onChange={(e: any) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })} placeholder="0.00" disabled={!isEditable} className="rounded-[10px] h-9 text-sm text-center border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08]" />
											</td>
										)}
										{isColumnVisible("quantity") && (
											<td className="p-2">
												<Input type="number" min="0" step="0.01" value={item.quantity || ""} onChange={(e: any) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })} placeholder="1" disabled={!isEditable} className="rounded-[10px] h-9 text-sm text-center border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08]" />
											</td>
										)}
										{isColumnVisible("total") && (
											<td className="p-2 text-center">
												<div className={`px-2 py-1.5 rounded-[10px] text-sm font-bold font-mono ${(item.quantity * item.unitPrice) > 0 ? "bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400" : "text-muted-foreground"}`}>
													{formatCurrency(item.quantity * item.unitPrice)}
												</div>
											</td>
										)}
										<td className="p-2">
											{items.length > 1 && isEditable && (
												<Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => removeItem(item.id)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{isEditable && (
						<div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
							<button
								type="button"
								onClick={addItem}
								className="w-full py-3.5 rounded-xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.02] to-primary/[0.06] hover:from-primary/[0.04] hover:to-primary/[0.10] hover:border-primary/40 text-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all"
							>
								<Plus className="h-[18px] w-[18px]" />
								{t("finance.items.add")}
							</button>
						</div>
					)}
				</div>

				{/* ─── Notes + Summary Grid ────────────────────────────── */}
				<div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">

					{/* Notes / Terms Tabs */}
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<Tabs defaultValue="notes">
							<div className="flex border-b border-slate-100 dark:border-slate-800/60 px-5">
								<TabsList className="bg-transparent h-auto p-0 gap-0">
									<TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
										<StickyNote className="h-3.5 w-3.5" />
										{t("pricing.quotations.notes")}
									</TabsTrigger>
									<TabsTrigger value="paymentTerms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
										<FileText className="h-3.5 w-3.5" />
										{t("pricing.quotations.paymentTerms")}
									</TabsTrigger>
									<TabsTrigger value="deliveryTerms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
										<Paperclip className="h-3.5 w-3.5" />
										{t("pricing.quotations.deliveryTerms")}
									</TabsTrigger>
									<TabsTrigger value="warrantyTerms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
										<Paperclip className="h-3.5 w-3.5" />
										{t("pricing.quotations.warrantyTerms")}
									</TabsTrigger>
								</TabsList>
							</div>
							<div className="p-5">
								<TabsContent value="notes" className="mt-0">
									<Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder={t("pricing.quotations.notesPlaceholder")} rows={4} disabled={!isEditable} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
								</TabsContent>
								<TabsContent value="paymentTerms" className="mt-0">
									<Textarea value={paymentTerms} onChange={(e: any) => setPaymentTerms(e.target.value)} placeholder={t("pricing.quotations.paymentTermsPlaceholder")} rows={4} disabled={!isEditable} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
								</TabsContent>
								<TabsContent value="deliveryTerms" className="mt-0">
									<Textarea value={deliveryTerms} onChange={(e: any) => setDeliveryTerms(e.target.value)} placeholder={t("pricing.quotations.deliveryTermsPlaceholder")} rows={4} disabled={!isEditable} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
								</TabsContent>
								<TabsContent value="warrantyTerms" className="mt-0">
									<Textarea value={warrantyTerms} onChange={(e: any) => setWarrantyTerms(e.target.value)} placeholder={t("pricing.quotations.warrantyTermsPlaceholder")} rows={4} disabled={!isEditable} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
								</TabsContent>
							</div>
						</Tabs>
					</div>

					{/* Summary / Totals */}
					<div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
						<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
							<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/40 dark:to-pink-800/20 flex items-center justify-center">
								<Receipt className="h-[15px] w-[15px] text-pink-500" />
							</div>
							<span className="text-sm font-semibold text-foreground">{t("finance.summary.total")}</span>
						</div>
						<div className="p-5 flex-1 flex flex-col justify-between">
							<AmountSummary
								subtotal={totals.subtotal}
								discountPercent={discountPercent}
								discountAmount={totals.discountAmount}
								vatPercent={vatPercent}
								vatAmount={totals.vatAmount}
								totalAmount={totals.totalAmount}
							/>
							{/* Gradient Total Bar */}
							<div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 flex items-center justify-between shadow-[0_4px_20px_hsl(var(--primary)/0.3)]">
								<div>
									<div className="text-[11px] text-primary-foreground/70 font-medium tracking-wide">{t("finance.summary.total")}</div>
								</div>
								<div className="text-2xl font-extrabold text-primary-foreground font-mono tracking-tight flex items-baseline gap-1.5">
									{formatCurrency(totals.totalAmount)}
									<span className="text-sm font-medium text-primary-foreground/75">{currency}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* ─── Mobile Bottom Bar ───────────────────────────────── */}
				<div className="fixed bottom-0 inset-x-0 z-50 sm:hidden backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[11px] text-muted-foreground">{t("finance.summary.total")}</p>
							<p className="text-lg font-bold text-primary">
								{formatCurrency(totals.totalAmount)}
								<span className="text-xs font-normal text-muted-foreground ms-1">{currency}</span>
							</p>
						</div>
						<div className="flex items-center gap-2">
							{mode === "edit" && existingQuotation && existingQuotation.status !== "DRAFT" && existingQuotation.status !== "CONVERTED" && (
								<Button type="button" size="sm" className="rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white" asChild>
									<Link href={`/app/${organizationSlug}/finance/invoices/new?quotationId=${quotationId}`}>
										<ArrowRightLeft className="h-4 w-4 me-1" />
										{t("finance.actions.convertToInvoice")}
									</Link>
								</Button>
							)}
							{isEditable && (
								<Button type="submit" size="sm" disabled={isBusy} className="rounded-xl h-9">
									<Save className="h-4 w-4 me-1" />
									{isBusy ? t("common.saving") : (mode === "create" ? t("pricing.quotations.saveAsDraft") : t("pricing.quotations.saveChanges"))}
								</Button>
							)}
						</div>
					</div>
				</div>
			</form>

			{/* Preview Dialog */}
			<Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0 rounded-2xl">
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
									quotationNo: mode === "edit" && existingQuotation ? existingQuotation.quotationNo : quotationNumber,
									createdAt: quotationDate,
									validUntil: validUntilDate,
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
									subtotal: totals.subtotal,
									discountPercent,
									discountAmount: totals.discountAmount,
									vatPercent,
									vatAmount: totals.vatAmount,
									totalAmount: totals.totalAmount,
									paymentTerms: paymentTerms || orgSettings?.defaultPaymentTerms || undefined,
									deliveryTerms: deliveryTerms || orgSettings?.defaultDeliveryTerms || undefined,
									warrantyTerms: warrantyTerms || orgSettings?.defaultWarrantyTerms || undefined,
									notes,
								}}
								template={{
									elements: (defaultTemplate?.content as { elements?: any[] })?.elements || [],
									settings: (defaultTemplate?.settings as any) || {},
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

			{/* New Client Dialog */}
			<Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
				<DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("finance.clients.addClient")}</DialogTitle>
					</DialogHeader>
					<InlineClientForm
						organizationId={organizationId}
						onSuccess={(client: any) => { handleClientSelect(client); setShowNewClientDialog(false); }}
						onCancel={() => setShowNewClientDialog(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
