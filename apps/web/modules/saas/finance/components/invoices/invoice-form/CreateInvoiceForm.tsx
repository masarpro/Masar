"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpcClient } from "@shared/lib/orpc-client";
import { toast } from "sonner";
import { calculateTotals } from "../../../lib/utils";
import { EditorPageSkeleton } from "@saas/shared/components/skeletons";
import { useAutosave } from "@saas/shared/hooks/use-autosave";
import { AutosaveConflictDialog } from "@saas/shared/components/AutosaveConflictDialog";
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
import { EditDraftBanner } from "@saas/shared/components/drafts/EditDraftBanner";
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
	draftId,
}: CreateInvoiceFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const quotationId = searchParams.get("quotationId");
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	// نعمل دائماً على مسودة staging:
	// - draftId: مسودة قائمة نستأنفها مباشرةً.
	// - invoiceId: فاتورة معتمدة نعدّلها عبر مسودة تعديل (تُنشأ/تُستأنف عبر startEdit).
	// - بدونهما: مسودة جديدة (lazy create عبر الحفظ التلقائي).
	const [workingDraftId, setWorkingDraftId] = useState<string | undefined>(draftId);
	const workingDraftIdRef = useRef<string | undefined>(draftId);
	const setDraftIdBoth = useCallback((id: string | undefined) => {
		workingDraftIdRef.current = id;
		setWorkingDraftId(id);
	}, []);
	const effectiveDraftId = workingDraftId;
	const isEditDraft = !!invoiceId; // نعدّل فاتورة معتمدة
	const [isIssuing, setIsIssuing] = useState(false);
	const [isCommitting, setIsCommitting] = useState(false);
	const [isStartingEdit, setIsStartingEdit] = useState(!!invoiceId && !draftId);
	const [showConflictDialog, setShowConflictDialog] = useState(false);

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

	// Validation state
	const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
	const [isValidating, setIsValidating] = useState(false);

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
		// Clear validation error when user edits description
		if (updates.description !== undefined) {
			setItemErrors((prev) => {
				const next = { ...prev };
				delete next[itemId];
				return next;
			});
		}
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

	// Apply finance settings defaults (مسودة جديدة فقط)
	useEffect(() => {
		if (orgSettings && !invoiceId && !draftId) {
			if (orgSettings.defaultVatPercent !== undefined) {
				setVatPercent(orgSettings.defaultVatPercent);
			}
		}
	}, [orgSettings, invoiceId, draftId]);

	// ─── بدء/استئناف مسودة تعديل عند تمرير invoiceId (فاتورة معتمدة) ───
	useEffect(() => {
		if (!invoiceId || draftId || workingDraftIdRef.current) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await orpcClient.finance.invoices.startEdit({ organizationId, id: invoiceId });
				if (cancelled) return;
				setDraftIdBoth(res.id);
				if (typeof window !== "undefined") {
					window.history.replaceState(null, "", `${basePath}/drafts/${res.id}`);
				}
			} catch (e: any) {
				toast.error(e?.message || t("finance.invoices.notEditable"));
				router.replace(`${basePath}/${invoiceId}`);
			} finally {
				if (!cancelled) setIsStartingEdit(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [invoiceId, draftId, organizationId, basePath, router, t, setDraftIdBoth]);

	// ─── تحميل بيانات المسودة ────────────────────
	const { data: draft, isLoading: isLoadingDraft } = useQuery({
		...orpc.finance.invoices.drafts.getById.queryOptions({
			input: { organizationId, id: workingDraftId ?? "" },
		}),
		enabled: !!workingDraftId,
	});

	// رقم الفاتورة الأصلية (لشريط مسودة التعديل)
	const sourceInvoiceId = (draft?.sourceInvoiceId as string | null | undefined) ?? undefined;
	const { data: sourceInvoice } = useQuery({
		...orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: sourceInvoiceId ?? "" },
		}),
		enabled: !!sourceInvoiceId,
	});
	const sourceInvoiceNo = sourceInvoice?.invoiceNo ?? null;
	// نعرض واجهة "مسودة تعديل" إذا دخلنا عبر فاتورة معتمدة أو إذا كانت المسودة مرتبطة بأصل
	const showEditDraftUi = isEditDraft || !!sourceInvoiceId;

	// تعبئة النموذج من المسودة
	useEffect(() => {
		if (draft) {
			setInvoiceType(draft.invoiceType as "STANDARD" | "TAX" | "SIMPLIFIED");
			setClientId(draft.clientId ?? undefined);
			setClientName(draft.clientName);
			setClientCompany(draft.clientCompany ?? "");
			setClientPhone(draft.clientPhone ?? "");
			setClientEmail(draft.clientEmail ?? "");
			setClientAddress(draft.clientAddress ?? "");
			setClientTaxNumber(draft.clientTaxNumber ?? "");
			setProjectId(draft.projectId ?? undefined);
			if (draft.projectId) setShowProjectLink(true);
			setIssueDate(new Date(draft.issueDate).toISOString().split("T")[0]);
			setDueDate(new Date(draft.dueDate).toISOString().split("T")[0]);
			setPaymentTerms(draft.paymentTerms ?? "");
			setNotes(draft.notes ?? "");
			setVatPercent(Number(draft.vatPercent) || 15);
			setDiscountPercent(Number(draft.discountPercent) || 0);
			setItems(
				draft.items.map((item: any) => ({
					id: item.id,
					description: item.description,
					quantity: Number(item.quantity) || 1,
					unit: item.unit ?? "",
					unitPrice: Number(item.unitPrice) || 0,
				})),
			);
		}
	}, [draft]);

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

	// Pre-fill form with quotation data (مسودة جديدة فقط)
	useEffect(() => {
		if (quotation && !invoiceId && !draftId) {
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
			setVatPercent(Number(quotation.vatPercent) || 15);
			setDiscountPercent(Number(quotation.discountPercent) || 0);
			setPaymentTerms(quotation.paymentTerms ?? "");
			setNotes(quotation.notes ?? "");
			setItems(
				quotation.items.map((item: any, index: any) => ({
					id: String(index + 1),
					description: item.description,
					quantity: Number(item.quantity) || 1,
					unit: item.unit ?? "",
					unitPrice: Number(item.unitPrice) || 0,
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

	// Map backend Zod error paths to human-readable Arabic messages
	const formatValidationErrors = (issues: any[]): string => {
		const msgs: string[] = [];
		for (const issue of issues) {
			const path = issue.path?.join(".") || "";
			if (path.includes("description")) {
				if (issue.code === "too_big") {
					msgs.push(t("finance.invoices.errors.descriptionTooLong"));
				} else {
					msgs.push(t("finance.invoices.errors.descriptionRequired"));
				}
			} else if (path.includes("quantity")) {
				msgs.push(t("finance.invoices.errors.quantityMustBePositive"));
			} else if (path === "items") {
				msgs.push(t("finance.invoices.errors.itemsRequired"));
			} else if (path.includes("clientName")) {
				msgs.push(t("finance.invoices.errors.clientRequired"));
			} else {
				msgs.push(issue.message || path);
			}
		}
		return [...new Set(msgs)].join("، ");
	};

	// ─── Autosave: snapshot للحقول والبنود ────────────────
	const headerSnapshot = useMemo(
		() => ({
			invoiceType,
			clientId: clientId || undefined,
			clientName: clientName.trim(),
			clientCompany: clientCompany.trim() || undefined,
			clientPhone: clientPhone.trim() || undefined,
			clientEmail: clientEmail.trim() || undefined,
			clientAddress: clientAddress.trim() || undefined,
			clientTaxNumber: clientTaxNumber.trim() || undefined,
			projectId: !showProjectLink || projectId === "none" ? undefined : projectId || undefined,
			issueDate,
			dueDate,
			paymentTerms: paymentTerms.trim() || undefined,
			notes: notes.trim() || undefined,
			vatPercent: Number(vatPercent) || 0,
			discountPercent: Number(discountPercent) || 0,
			templateId: draft?.templateId || defaultTemplate?.id || undefined,
		}),
		[invoiceType, clientId, clientName, clientCompany, clientPhone, clientEmail,
		 clientAddress, clientTaxNumber, showProjectLink, projectId, issueDate, dueDate,
		 paymentTerms, notes, vatPercent, discountPercent, draft?.templateId, defaultTemplate?.id],
	);

	const itemsSnapshot = useMemo(
		() =>
			items
				.filter((item) => (item.description ?? "").trim())
				.map((item) => ({
					id: item.id,
					description: (item.description ?? "").trim(),
					quantity: Math.max(Number(item.quantity) || 1, 0.01),
					unit: item.unit?.trim() || undefined,
					unitPrice: Number(item.unitPrice) || 0,
				})),
		[items],
	);

	const isReadyForCreate = useCallback(
		(snap: typeof headerSnapshot, snapItems: typeof itemsSnapshot) =>
			!!snap.clientName && snapItems.length > 0,
		[],
	);

	const createDraft = useCallback(
		async (snap: typeof headerSnapshot, snapItems: typeof itemsSnapshot) => {
			const result = await orpcClient.finance.invoices.drafts.create({
				organizationId,
				...snap,
				quotationId: quotationId || undefined,
				issueDate: new Date(snap.issueDate).toISOString(),
				dueDate: new Date(snap.dueDate).toISOString(),
				items: snapItems.map(({ description, quantity, unit, unitPrice }) => ({
					description,
					quantity,
					unit,
					unitPrice,
				})),
			});
			return { id: result.id };
		},
		[organizationId, quotationId],
	);

	const updateHeader = useCallback(
		async (id: string, snap: typeof headerSnapshot) => {
			await orpcClient.finance.invoices.drafts.updateHeader({
				organizationId,
				id,
				...snap,
				issueDate: new Date(snap.issueDate).toISOString(),
				dueDate: new Date(snap.dueDate).toISOString(),
			});
		},
		[organizationId],
	);

	const updateItemsRemote = useCallback(
		async (id: string, snapItems: typeof itemsSnapshot) => {
			await orpcClient.finance.invoices.drafts.updateItems({
				organizationId,
				id,
				items: snapItems.map((item) => ({
					id: item.id.startsWith("new-") || /^\d+$/.test(item.id) ? undefined : item.id,
					description: item.description,
					quantity: item.quantity,
					unit: item.unit,
					unitPrice: item.unitPrice,
				})),
			});
		},
		[organizationId],
	);

	const autosaveEnabled = !isIssuing && !isCommitting && !isStartingEdit;

	const autosave = useAutosave({
		snapshot: headerSnapshot,
		items: itemsSnapshot,
		id: effectiveDraftId,
		enabled: autosaveEnabled,
		isReadyForCreate,
		createDraft,
		updateHeader,
		updateItems: updateItemsRemote,
		onCreated: (newId) => {
			setDraftIdBoth(newId);
			// تغيير URL بدون re-render (لا router.push كي لا يفقد النموذج حالته)
			if (typeof window !== "undefined") {
				window.history.replaceState(null, "", `${basePath}/drafts/${newId}`);
			}
		},
		onSaved: () => {
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.drafts.key() });
		},
		onConflict: () => {
			setShowConflictDialog(true);
		},
	});

	// Issue mutation (الإجراء الصريح الوحيد المتبقي)
	const issueMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.invoices.issue({
				organizationId,
				id,
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.issueSuccess"));
			router.push(`${basePath}/${data.id}`);
		},
		onError: (error: any) => {
			const issues = error?.data?.issues ?? error?.issues;
			if (issues?.length) {
				toast.error(`${t("finance.invoices.issueError")}: ${formatValidationErrors(issues)}`);
			} else {
				toast.error(error.message || t("finance.invoices.issueError"));
			}
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
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
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
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
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
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
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
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
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
		setIsValidating(true);

		// 1. Client name check (first priority)
		if (!clientName.trim()) {
			toast.error(t("finance.invoices.errors.clientRequired"));
			setIsValidating(false);
			return false;
		}

		// 2. Per-item validation — check items with data but missing description
		const newItemErrors: Record<string, string> = {};
		for (const item of items) {
			const hasPrice = Number(item.unitPrice) > 0;
			const hasQty = Number(item.quantity) > 0 && Number(item.quantity) !== 1; // exclude default qty=1
			const hasDesc = (item.description ?? "").trim().length > 0;
			if ((hasPrice || hasQty) && !hasDesc) {
				newItemErrors[item.id] = t("finance.invoices.errors.descriptionRequired");
			}
		}
		setItemErrors(newItemErrors);

		if (Object.keys(newItemErrors).length > 0) {
			toast.error(t("finance.invoices.errors.descriptionRequired"));
			// Scroll to first error item
			const firstErrorId = Object.keys(newItemErrors)[0];
			const el = document.querySelector(`[data-item-id="${firstErrorId}"]`);
			if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
			setIsValidating(false);
			return false;
		}

		// 3. Must have at least one valid item
		const validItems = items.filter((item) => (item.description ?? "").trim());
		if (validItems.length === 0) {
			toast.error(t("finance.invoices.errors.itemsRequired"));
			setIsValidating(false);
			return false;
		}

		// 4. Quantity check on valid items
		for (const item of validItems) {
			if (!item.quantity || Number(item.quantity) <= 0) {
				toast.error(t("finance.invoices.errors.quantityMustBePositive"));
				setIsValidating(false);
				return false;
			}
		}

		// 5. Tax number required for TAX invoices
		if (invoiceType === "TAX" && !clientTaxNumber.trim()) {
			toast.error(t("finance.invoices.errors.taxNumberRequired"));
			setIsValidating(false);
			return false;
		}

		// 6. Email format validation
		if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
			toast.error(t("finance.invoices.errors.invalidEmail"));
			setIsValidating(false);
			return false;
		}

		// 7. Date validation
		const issueDateObj = new Date(issueDate);
		const dueDateObj = new Date(dueDate);
		if (dueDateObj <= issueDateObj) {
			toast.error(t("finance.invoices.errors.dueDateMustBeAfterIssueDate"));
			setIsValidating(false);
			return false;
		}

		setIsValidating(false);
		return true;
	};

	// Form submit (Enter في الحقول) → force-save تلقائي
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await autosave.forceSave();
	};

	// commit المسودة (حفظ): يُفرّغ آخر تغييرات ثم يثبّت المسودة كمستند حقيقي. يُرجع id المستند المعتمد.
	const commitDraft = async (): Promise<string | null> => {
		await autosave.forceSave();
		const did = workingDraftIdRef.current;
		if (!did) {
			toast.error(t("finance.invoices.errors.itemsRequired"));
			return null;
		}
		const result = await orpcClient.finance.invoices.drafts.commit({ organizationId, id: did });
		queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
		queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.drafts.key() });
		return result.id;
	};

	// زر "حفظ" → commit ثم الانتقال للمستند المعتمد
	const handleSaveClick = async () => {
		if (!validateForm()) return;
		setIsCommitting(true);
		try {
			const id = await commitDraft();
			if (id) {
				toast.success(t("drafts.saveSuccess"));
				router.push(`${basePath}/${id}`);
			}
		} catch (e: any) {
			toast.error(e?.message || t("drafts.saveError"));
		} finally {
			setIsCommitting(false);
		}
	};

	const handleIssueClick = () => {
		if (!validateForm()) return;
		setShowIssueConfirm(true);
	};

	const handleIssueConfirm = async () => {
		setShowIssueConfirm(false);
		setIsIssuing(true);
		try {
			// أولاً: تثبيت المسودة (commit) للحصول على فاتورة حقيقية ثم إصدارها
			const committedId = await commitDraft();
			if (!committedId) {
				setIsIssuing(false);
				return;
			}
			await issueMutation.mutateAsync(committedId);
		} catch (e: any) {
			toast.error(e?.message || t("finance.invoices.issueError"));
			setIsIssuing(false);
		}
	};

	// Ctrl+S / Cmd+S → force save
	useEffect(() => {
		if (!autosaveEnabled) return;
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				void autosave.forceSave();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [autosaveEnabled, autosave]);

	const handleConflictReload = () => {
		setShowConflictDialog(false);
		window.location.reload();
	};

	const handleConflictOverwrite = () => {
		setShowConflictDialog(false);
		void autosave.forceSave();
	};

	// تجاهل مسودة التعديل (الأصل لا يتأثّر)
	const handleDiscardDraft = async () => {
		const did = workingDraftIdRef.current;
		if (!did) {
			router.push(basePath);
			return;
		}
		try {
			await orpcClient.finance.invoices.drafts.delete({ organizationId, id: did });
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.drafts.key() });
			toast.success(t("drafts.discardSuccess"));
			router.push(sourceInvoiceId ? `${basePath}/${sourceInvoiceId}` : basePath);
		} catch (e: any) {
			toast.error(e?.message || t("drafts.discardError"));
		}
	};

	const isBusy =
		isValidating ||
		isIssuing ||
		isCommitting ||
		issueMutation.isPending ||
		autosave.state.status === "saving";

	// المسودات لا تحتوي مدفوعات (التحرير مسموح فقط لمستندات قبل الإصدار)
	const canAddPayment = false;
	const remainingAmount = 0;

	const currency = orgSettings?.defaultCurrency || "SAR";

	// Loading state
	if ((isEditDraft && isStartingEdit) || (!!workingDraftId && isLoadingDraft && !draft)) {
		return <EditorPageSkeleton />;
	}

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-background">
			<form onSubmit={handleSubmit} className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header ─────────────────────────────────────────── */}
				<InvoiceFormHeader
					organizationSlug={organizationSlug}
					basePath={basePath}
					isEditDraft={showEditDraftUi}
					sourceInvoiceId={sourceInvoiceId}
					sourceInvoiceNo={sourceInvoiceNo}
					quotation={quotation ? { quotationNo: quotation.quotationNo } : null}
					isBusy={isBusy}
					isSaving={isCommitting}
					isIssuing={isIssuing || issueMutation.isPending}
					autosaveState={autosave.state}
					onAutosaveRetry={() => void autosave.forceSave()}
					onPreview={() => setShowPreviewDialog(true)}
					onSaveClick={handleSaveClick}
					onIssueClick={handleIssueClick}
				/>

				{/* ─── Edit-draft banner ──────────────────────────────── */}
				{showEditDraftUi && (
					<EditDraftBanner
						sourceNumber={sourceInvoiceNo}
						sourceHref={sourceInvoiceId ? `${basePath}/${sourceInvoiceId}` : undefined}
						onDiscard={handleDiscardDraft}
					/>
				)}

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
						isEditMode={false}
						invoice={null}
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
					itemErrors={itemErrors}
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
						isEditMode={false}
						invoice={null}
						remainingAmount={remainingAmount}
					/>
				</div>

				{/* ─── Mobile Bottom Bar ───────────────────────────────── */}
				<InvoiceMobileBar
					totalAmount={totals.totalAmount}
					currency={currency}
					isBusy={isBusy}
					autosaveState={autosave.state}
					onAutosaveRetry={() => void autosave.forceSave()}
					onSaveClick={handleSaveClick}
					onIssueClick={handleIssueClick}
				/>
			</form>

			<AutosaveConflictDialog
				open={showConflictDialog}
				onReload={handleConflictReload}
				onOverwrite={handleConflictOverwrite}
			/>

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
