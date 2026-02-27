"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
// Card/CardContent replaced with glass-morphism divs
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
	DialogFooter,
} from "@ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from "@ui/components/dropdown-menu";
import { Badge } from "@ui/components/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
	Save,
	User,
	FileText,
	Receipt,
	FileCheck,
	Plus,
	ChevronDown,
	ChevronUp,
	ChevronLeft,
	Paperclip,
	StickyNote,
	Trash2,
	Columns,
	Eye,
	Printer,
	ArrowRight,
	Calendar,
	FolderOpen,
	CreditCard,
	Send,
	MoreVertical,
	QrCode,
	Ban,
} from "lucide-react";
import { AmountSummary } from "../shared/AmountSummary";
import { ClientSelector, type Client } from "../shared/ClientSelector";
import { InlineClientForm } from "../clients/InlineClientForm";
import { StatusBadge } from "../shared/StatusBadge";
import { Currency } from "../shared/Currency";
import { calculateTotals, formatDate } from "../../lib/utils";

interface CreateInvoiceFormProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId?: string;
}

interface InvoiceItem {
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

const UNIT_KEYS = [
	"m", "m2", "m3", "ton", "kg", "liter",
	"piece", "lumpsum", "workday", "workhour",
	"trip", "load", "roll", "carton", "set", "service",
] as const;

const UNIT_VALUES: Record<string, string> = {
	m: "م", m2: "م²", m3: "م³", ton: "طن", kg: "كجم", liter: "لتر",
	piece: "قطعة", lumpsum: "مقطوعية", workday: "يوم عمل", workhour: "ساعة عمل",
	trip: "رحلة", load: "حمولة", roll: "لفة", carton: "كرتون", set: "مجموعة", service: "خدمة",
};

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("ar-SA", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
};

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
	const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
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
	const { data: orgSettings } = useQuery(
		orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
	);

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
			if (invoice.templateId) {
				setSelectedTemplate(invoice.templateId);
			}
		}
	}, [invoice]);

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

	// Auto-select the default template when it loads (skip in edit mode if invoice has a template)
	useEffect(() => {
		if (defaultTemplate && !isEditMode && (selectedTemplate === "default" || !selectedTemplate)) {
			setSelectedTemplate(defaultTemplate.id);
		}
	}, [defaultTemplate, isEditMode]);

	const activeTemplate = templates.find(tmpl => tmpl.id === selectedTemplate) || defaultTemplate;

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
		templateId: activeTemplate?.id,
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
				templateId: activeTemplate?.id || null,
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
		mutationFn: async (status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE") => {
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
		return (
			<div className="flex items-center justify-center py-20 min-h-[calc(100vh-4rem)]">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
			<form onSubmit={handleSubmit} className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header ─────────────────────────────────────────── */}
				<div className="sticky top-0 z-20 py-3 px-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
					<div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
						{/* Start: back + breadcrumb/title */}
						<div className="flex items-center gap-3 min-w-0">
							<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border shadow-sm">
								<Link href={`/app/${organizationSlug}/finance/invoices`}>
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
							<div className="min-w-0">
								<nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
									<Link href={`/app/${organizationSlug}/finance`} className="hover:text-foreground transition-colors">{t("finance.title")}</Link>
									<ChevronLeft className="h-3 w-3 shrink-0" />
									<Link href={`/app/${organizationSlug}/finance/invoices`} className="hover:text-foreground transition-colors">{t("finance.invoices.title")}</Link>
									{isEditMode && invoice && (
										<>
											<ChevronLeft className="h-3 w-3 shrink-0" />
											<Link href={`${basePath}/${invoiceId}`} className="hover:text-foreground transition-colors">{invoice.invoiceNo}</Link>
										</>
									)}
								</nav>
								<h1 className="text-base font-bold leading-tight truncate flex items-center gap-2">
									{isEditMode && invoice ? (
										<>
											{invoice.invoiceNo}
											<StatusBadge status={invoice.status} type="invoice" />
										</>
									) : (
										<>
											{t("finance.invoices.create")}
											{quotation && (
												<span className="text-xs font-normal text-blue-600 dark:text-blue-400 ms-2">
													{t("finance.invoices.fromQuotation")} — {quotation.quotationNo}
												</span>
											)}
										</>
									)}
								</h1>
							</div>
						</div>

						{/* End: actions */}
						<div className="flex items-center gap-1.5 shrink-0">
							<Select value={selectedTemplate || ""} onValueChange={setSelectedTemplate}>
								<SelectTrigger className="h-8 w-auto gap-1.5 rounded-lg border-dashed text-xs px-2.5">
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
							<div className="w-px h-5 bg-border/50" />
							<Button
								type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
								onClick={() => isEditMode ? router.push(`${basePath}/${invoiceId}/preview`) : setShowPreviewDialog(true)}
							>
								<Eye className="h-4 w-4" />
							</Button>
							<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toast.info(t("finance.actions.printComingSoon"))}><Printer className="h-4 w-4" /></Button>
							{isEditMode && canAddPayment && (
								<>
									<div className="w-px h-5 bg-border/50" />
									<Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs px-2.5" onClick={() => setPaymentDialogOpen(true)}>
										<CreditCard className="h-3.5 w-3.5 me-1" />
										{t("finance.invoices.addPayment")}
									</Button>
								</>
							)}
							<div className="w-px h-5 bg-border/50" />
							<Button type="submit" variant="outline" size="sm" disabled={isBusy} className="hidden sm:flex h-8 rounded-lg text-xs px-3 shadow-sm">
								<Save className="h-3.5 w-3.5 me-1.5" />
								{isBusy ? t("common.saving") : isEditMode ? t("finance.invoices.saveChanges") : t("finance.invoices.saveAsDraft")}
							</Button>
							{(!isEditMode || invoice?.status === "DRAFT") && (
								<Button type="button" size="sm" disabled={isBusy} onClick={handleIssueClick} className="h-8 rounded-[10px] text-xs px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-[0_4px_15px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] transition-all">
									<FileCheck className="h-3.5 w-3.5 me-1.5" />
									{createAndIssueMutation.isPending ? t("common.saving") : t("finance.invoices.issueInvoice")}
								</Button>
							)}
							{isEditMode && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="rounded-xl">
										{invoice?.status === "DRAFT" && (
											<DropdownMenuItem onClick={() => statusMutation.mutate("SENT")} disabled={statusMutation.isPending}>
												<Send className="h-4 w-4 me-2" />
												{t("finance.invoices.actions.send")}
											</DropdownMenuItem>
										)}
										{invoice?.invoiceType !== "TAX" && invoice?.status !== "CANCELLED" && (
											<DropdownMenuItem onClick={() => convertToTaxMutation.mutate()} disabled={convertToTaxMutation.isPending}>
												<QrCode className="h-4 w-4 me-2" />
												{t("finance.invoices.actions.convertToTax")}
											</DropdownMenuItem>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					</div>
				</div>

				{/* ─── Client + Details Grid ───────────────────────────── */}
				<div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">

					{/* Client Card */}
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
							<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center">
								<User className="h-[15px] w-[15px] text-blue-500" />
							</div>
							<span className="text-sm font-semibold text-foreground">{t("finance.invoices.clientInfo")}</span>
							<Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClientDialog(true)} className="ms-auto rounded-lg h-7 text-xs border border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 px-3">
								<Plus className="h-3 w-3 me-1" />
								{t("finance.clients.addClient")}
							</Button>
						</div>
						<div className="p-5 space-y-3">
							<ClientSelector organizationId={organizationId} onSelect={handleClientSelect} selectedClientId={clientId} />

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
									<button type="button" onClick={() => setClientDetailsOpen(!clientDetailsOpen)} className="text-xs text-primary hover:underline mt-0.5">
										{clientDetailsOpen ? t("common.close") : t("common.edit")}
									</button>
								</div>
							)}

							{clientDetailsOpen && (
								<div className="grid gap-3 sm:grid-cols-2 pt-1">
									<div>
										<Label className="text-xs">{t("finance.invoices.clientName")} *</Label>
										<Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t("finance.invoices.clientNamePlaceholder")} required className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("finance.invoices.clientCompany")}</Label>
										<Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder={t("finance.invoices.clientCompanyPlaceholder")} className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("finance.invoices.clientPhone")}</Label>
										<Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="05xxxxxxxx" className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("finance.invoices.clientEmail")}</Label>
										<Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("finance.invoices.clientTaxNumber")} *</Label>
										<Input value={clientTaxNumber} onChange={(e) => setClientTaxNumber(e.target.value)} placeholder={t("finance.invoices.taxNumberPlaceholder")} required className="rounded-xl mt-1 h-9" />
									</div>
									<div>
										<Label className="text-xs">{t("finance.invoices.clientAddress")}</Label>
										<Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder={t("finance.invoices.addressPlaceholder")} className="rounded-xl mt-1 h-9" />
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Details Card */}
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
							<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 flex items-center justify-center">
								<Calendar className="h-[15px] w-[15px] text-emerald-500" />
							</div>
							<span className="text-sm font-semibold text-foreground">{t("finance.invoices.details.metadata")}</span>
						</div>
						<div className="p-5 space-y-3.5">
							<div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50">
								<span className="text-xs text-muted-foreground font-medium">{t("finance.invoices.columns.number")}</span>
								<span className="text-sm font-bold font-mono text-foreground tracking-wide">
									{isEditMode && invoice ? invoice.invoiceNo : `INV-${new Date().getFullYear()}-XXXX`}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<Label className="text-xs text-muted-foreground">{t("finance.invoices.issueDate")}</Label>
									<Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className="rounded-xl mt-1 h-9" />
								</div>
								<div>
									<Label className="text-xs text-muted-foreground">{t("finance.invoices.dueDate")}</Label>
									<Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="rounded-xl mt-1 h-9" />
								</div>
							</div>

							<div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${showProjectLink ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40" : "bg-slate-50/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700"}`}>
								<div className="flex items-center gap-2">
									<FolderOpen className={`h-4 w-4 ${showProjectLink ? "text-emerald-500" : "text-muted-foreground"}`} />
									<span className={`text-sm font-medium ${showProjectLink ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>{t("finance.invoices.project")}</span>
								</div>
								<Switch checked={showProjectLink} onCheckedChange={(checked) => { setShowProjectLink(checked); if (!checked) setProjectId(undefined); }} />
							</div>
							{showProjectLink && (
								<Select value={projectId ?? "none"} onValueChange={setProjectId}>
									<SelectTrigger className="rounded-xl h-9">
										<SelectValue placeholder={t("finance.invoices.selectProject")} />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="none">{t("finance.invoices.noProject")}</SelectItem>
										{projects.map((project) => (
											<SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							<div className="flex items-center gap-2 pt-1">
								<Badge variant="secondary" className="text-xs font-medium">{currency}</Badge>
								<div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold text-emerald-700 dark:text-emerald-400">
									{t("finance.invoices.vatPercent")} {vatPercent}%
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
							<span className="text-sm font-semibold text-foreground">{t("finance.invoices.items")}</span>
							<span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">{items.filter((i) => i.description.trim()).length}</span>
						</div>
						<div className="flex items-center gap-3">
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
													<button type="button" onClick={() => moveItemUp(index)} disabled={index === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
														<ChevronUp className="h-3 w-3 text-muted-foreground" />
													</button>
													<span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center text-xs font-bold">{index + 1}</span>
													<button type="button" onClick={() => moveItemDown(index)} disabled={index === items.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
														<ChevronDown className="h-3 w-3 text-muted-foreground" />
													</button>
												</div>
											</td>
										)}
										{isColumnVisible("description") && (
											<td className="p-2 align-top">
												<textarea
													value={item.description}
													onChange={(e) => { updateItem(item.id, { description: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
													placeholder={t("finance.items.descriptionPlaceholder")}
													rows={1}
													className="w-full min-h-[36px] px-3 py-2 rounded-[10px] text-sm border border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08] focus:outline-none resize-none overflow-hidden transition-all"
												/>
											</td>
										)}
										{isColumnVisible("unit") && (
											<td className="p-2">
												<Select value={item.unit || "_empty"} onValueChange={(v) => updateItem(item.id, { unit: v === "_empty" ? "" : v })}>
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
												<Input type="number" min="0" step="0.01" value={item.unitPrice || ""} onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })} placeholder="0.00" className="rounded-[10px] h-9 text-sm text-center border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08]" />
											</td>
										)}
										{isColumnVisible("quantity") && (
											<td className="p-2">
												<Input type="number" min="0" step="0.01" value={item.quantity || ""} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })} placeholder="1" className="rounded-[10px] h-9 text-sm text-center border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08]" />
											</td>
										)}
										{isColumnVisible("total") && (
											<td className="p-2 text-center">
												<div className={`px-2 py-1.5 rounded-[10px] text-sm font-bold font-mono ${(item.quantity * item.unitPrice) > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
													{formatCurrency(item.quantity * item.unitPrice)}
												</div>
											</td>
										)}
										<td className="p-2">
											{items.length > 1 && (
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
				</div>

				{/* ─── Notes + Summary Grid ────────────────────────────── */}
				<div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">

					{/* Notes / Terms / Attachments */}
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<Tabs defaultValue="notes">
							<div className="flex border-b border-slate-100 dark:border-slate-800/60 px-5">
								<TabsList className="bg-transparent h-auto p-0 gap-0">
									<TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
										<StickyNote className="h-3.5 w-3.5" />
										{t("finance.invoices.notes")}
									</TabsTrigger>
									<TabsTrigger value="terms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
										<FileText className="h-3.5 w-3.5" />
										{t("finance.invoices.paymentTerms")}
									</TabsTrigger>
									<TabsTrigger value="attachments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
										<Paperclip className="h-3.5 w-3.5" />
										{t("finance.invoices.attachments")}
									</TabsTrigger>
								</TabsList>
							</div>
							<div className="p-5">
								<TabsContent value="notes" className="mt-0">
									<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("finance.invoices.notesPlaceholder")} rows={4} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
								</TabsContent>
								<TabsContent value="terms" className="mt-0">
									<Textarea value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder={t("finance.invoices.paymentTermsPlaceholder")} rows={4} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
								</TabsContent>
								<TabsContent value="attachments" className="mt-0">
									<div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
										<Paperclip className="h-8 w-8 text-muted-foreground/50 mb-2" />
										{t("finance.invoices.attachmentsComingSoon")}
									</div>
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
							{isEditMode && invoice && invoice.paidAmount > 0 && (
								<div className="mt-2 space-y-1.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
									<div className="flex justify-between text-sm text-green-600 dark:text-green-400">
										<span>{t("finance.invoices.paidAmount")}</span>
										<span>-<Currency amount={invoice.paidAmount} /></span>
									</div>
									<div className={`flex justify-between text-sm font-bold ${remainingAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
										<span>{t("finance.invoices.remainingAmount")}</span>
										<span><Currency amount={remainingAmount} /></span>
									</div>
								</div>
							)}
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

				{/* ─── Payments Section (edit mode) ───────────────────── */}
				{isEditMode && invoice && invoice.payments && invoice.payments.length > 0 && (
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
							<div className="flex items-center gap-2.5">
								<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 flex items-center justify-center">
									<CreditCard className="h-[15px] w-[15px] text-green-500" />
								</div>
								<span className="text-sm font-semibold text-foreground">{t("finance.invoices.payments")}</span>
								<span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] font-bold">{invoice.payments.length}</span>
							</div>
							{canAddPayment && (
								<Button type="button" variant="ghost" size="sm" className="rounded-lg h-8 text-xs" onClick={() => setPaymentDialogOpen(true)}>
									<Plus className="h-3.5 w-3.5 me-1" />
									{t("finance.invoices.addPayment")}
								</Button>
							)}
						</div>
						<div className="p-4 space-y-2">
							{invoice.payments.map((payment) => (
								<div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
									<div>
										<p className="font-medium text-green-600 dark:text-green-400 text-sm">
											<Currency amount={payment.amount} />
										</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{formatDate(payment.paymentDate)}
											{payment.paymentMethod && ` - ${payment.paymentMethod}`}
											{payment.referenceNo && ` (${payment.referenceNo})`}
										</p>
										{payment.notes && (
											<p className="text-xs text-muted-foreground/70 mt-0.5">{payment.notes}</p>
										)}
									</div>
									{canAddPayment && (
										<Button type="button" variant="ghost" size="sm" onClick={() => setDeletePaymentId(payment.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg h-8 w-8 p-0">
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* ─── Mobile Bottom Bar ───────────────────────────────── */}
				<div className="fixed bottom-0 inset-x-0 z-50 sm:hidden backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)] p-4 safe-area-inset-bottom">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[11px] text-muted-foreground">{t("finance.summary.total")}</p>
							<p className="text-lg font-bold text-primary">
								{formatCurrency(totals.totalAmount)}
								<span className="text-xs font-normal text-muted-foreground ms-1">{currency}</span>
							</p>
						</div>
						<div className="flex gap-2">
							<Button type="submit" variant="outline" size="sm" disabled={isBusy} className="rounded-xl h-9">
								<Save className="h-4 w-4 me-1" />
								{isEditMode ? t("finance.invoices.saveChanges") : t("finance.invoices.saveAsDraft")}
							</Button>
							{(!isEditMode || invoice?.status === "DRAFT") && (
								<Button type="button" size="sm" disabled={isBusy} onClick={handleIssueClick} className="rounded-xl h-9">
									<FileCheck className="h-4 w-4 me-1" />
									{t("finance.invoices.issueInvoice")}
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
						<div className="bg-white dark:bg-card rounded-xl shadow-lg overflow-hidden p-8">
							<div className="text-center text-muted-foreground py-16">{t("finance.invoices.previewAvailableAfterSave")}</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Issue Confirmation Dialog */}
			<AlertDialog open={showIssueConfirm} onOpenChange={setShowIssueConfirm}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.invoices.issueConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("finance.invoices.issueConfirmDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleIssueConfirm} className="rounded-xl">{t("finance.invoices.issueConfirmButton")}</AlertDialogAction>
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
						onSuccess={(client) => { handleClientSelect(client); setShowNewClientDialog(false); }}
						onCancel={() => setShowNewClientDialog(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Add Payment Dialog (edit mode) */}
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
						<Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-xl">
							{t("common.cancel")}
						</Button>
						<Button
							onClick={() => addPaymentMutation.mutate()}
							disabled={!newPaymentAmount || parseFloat(newPaymentAmount) <= 0 || addPaymentMutation.isPending}
							className="rounded-xl"
						>
							<Plus className="h-4 w-4 me-2" />
							{addPaymentMutation.isPending ? t("common.saving") : t("finance.invoices.addPayment")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Payment Confirmation (edit mode) */}
			<AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.invoices.deletePaymentTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("finance.invoices.deletePaymentDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)}
							disabled={deletePaymentMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deletePaymentMutation.isPending ? t("common.deleting") : t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
