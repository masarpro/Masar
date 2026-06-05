"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useAutosave } from "@saas/shared/hooks/use-autosave";
import { AutosaveIndicator } from "@saas/shared/components/AutosaveIndicator";
import { AutosaveConflictDialog } from "@saas/shared/components/AutosaveConflictDialog";
import { formatCurrency } from "@saas/shared/lib/invoice-constants";
import { UnitField } from "@saas/shared/components/UnitField";
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
	Save,
	MoreVertical,
	CheckCircle,
	XCircle,
	StickyNote,
	Paperclip,
	Receipt,
	ScrollText,
	BookOpen,
	ListChecks,
} from "lucide-react";
import { cn } from "@ui/lib";
import { ClientSelector, type Client } from "@saas/finance/components/shared/ClientSelector";
import { InlineClientForm } from "@saas/finance/components/clients/InlineClientForm";
import { StatusBadge } from "@saas/finance/components/shared/StatusBadge";
import { AmountSummary } from "@saas/finance/components/shared/AmountSummary";
import { calculateTotals } from "@saas/finance/lib/utils";
import { TemplateRenderer } from "@saas/company/components/templates/renderer";
import { useEnsureDefaultTemplate } from "@saas/shared/hooks/use-ensure-default-template";
import { EditorPageSkeleton } from "@saas/shared/components/skeletons";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@ui/components/collapsible";
import { EditDraftBanner } from "@saas/shared/components/drafts/EditDraftBanner";
import { QuotationContentBlockEditor, type ContentBlock } from "./QuotationContentBlockEditor";

interface QuotationFormProps {
	organizationId: string;
	organizationSlug: string;
	mode: "create" | "edit";
	/** عرض سعر معتمد نعدّله عبر مسودة تعديل */
	quotationId?: string;
	/** مسودة staging قائمة نستأنفها مباشرةً */
	draftId?: string;
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
	draftId,
}: QuotationFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/pricing/quotations`;
	const searchParams = useSearchParams();
	const fromStudyId = searchParams.get("fromStudy");

	// نعمل دائماً على مسودة staging:
	// - draftId: مسودة قائمة نستأنفها.
	// - mode "edit" + quotationId: عرض سعر معتمد نعدّله عبر مسودة تعديل (startEdit).
	// - بدونهما: مسودة جديدة (lazy create).
	const [workingDraftId, setWorkingDraftId] = useState<string | undefined>(draftId);
	const workingDraftIdRef = useRef<string | undefined>(draftId);
	const setDraftIdBoth = useCallback((id: string | undefined) => {
		workingDraftIdRef.current = id;
		setWorkingDraftId(id);
	}, []);
	const effectiveDraftId = workingDraftId;
	const isEditDraft = mode === "edit";
	const [isPublishing, setIsPublishing] = useState(false);
	const [isCommitting, setIsCommitting] = useState(false);
	const [isStartingEdit, setIsStartingEdit] = useState(mode === "edit" && !draftId);
	const [showConflictDialog, setShowConflictDialog] = useState(false);

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

	// Content sections
	const [introduction, setIntroduction] = useState("");
	const [termsAndConditions, setTermsAndConditions] = useState("");
	const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

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
	const [isInitialized, setIsInitialized] = useState(mode === "create" && !draftId);
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

	// ─── بدء/استئناف مسودة تعديل عند تمرير quotationId (عرض سعر معتمد) ───
	useEffect(() => {
		if (mode !== "edit" || !quotationId || draftId || workingDraftIdRef.current) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await orpcClient.pricing.quotations.startEdit({ organizationId, id: quotationId });
				if (cancelled) return;
				setDraftIdBoth(res.id);
				if (typeof window !== "undefined") {
					window.history.replaceState(null, "", `${basePath}/drafts/${res.id}`);
				}
			} catch (e: any) {
				toast.error(e?.message || t("pricing.quotations.notEditable"));
				router.replace(`${basePath}/${quotationId}`);
			} finally {
				if (!cancelled) setIsStartingEdit(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [mode, quotationId, draftId, organizationId, basePath, router, t, setDraftIdBoth]);

	// تحميل بيانات المسودة
	const { data: draftRaw, isLoading: isLoadingDraft } = useQuery({
		...orpc.pricing.quotations.drafts.getById.queryOptions({
			input: { organizationId, id: workingDraftId ?? "" },
		}),
		enabled: !!workingDraftId,
	});
	const draft = draftRaw as any;

	// عرض السعر الأصلي (لمسودة التعديل — للعرض في الشريط والمعاينة)
	const sourceQuotationId = (draft?.sourceQuotationId as string | null | undefined) ?? undefined;
	const { data: sourceQuotationRaw } = useQuery({
		...orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: sourceQuotationId ?? "" },
		}),
		enabled: !!sourceQuotationId,
	});
	const existingQuotation = (sourceQuotationRaw as any) ?? null;
	const sourceQuotationNo = existingQuotation?.quotationNo ?? null;
	const isLoadingQuotation = isLoadingDraft;
	// نعرض شريط "مسودة تعديل" إذا دخلنا عبر عرض سعر معتمد أو إذا كانت المسودة مرتبطة بأصل
	const showEditDraftUi = isEditDraft || !!sourceQuotationId;

	// Prefill items from study conversion (via sessionStorage)
	useEffect(() => {
		if (mode === "create" && !draftId && fromStudyId) {
			const storageKey = `quotation_prefill_${fromStudyId}`;
			const raw = sessionStorage.getItem(storageKey);
			if (raw) {
				try {
					const prefill = JSON.parse(raw);
					if (prefill.items?.length > 0) {
						setItems(
							prefill.items.map((item: any, i: number) => ({
								id: String(i + 1),
								description: item.description ?? "",
								quantity: Number(item.quantity ?? 1),
								unit: item.unit ?? "",
								unitPrice: Number(item.unitPrice ?? 0),
							})),
						);
					}
					toast.success(t("pricing.studies.quotationPrefilled"));
				} catch {
					/* ignore invalid JSON */
				}
				sessionStorage.removeItem(storageKey);
			}
		}
	}, [fromStudyId, mode]);

	// تعبئة النموذج من المسودة
	useEffect(() => {
		if (draft && !isInitialized) {
			setClientId(draft.clientId ?? undefined);
			setClientName(draft.clientName ?? "");
			setClientCompany(draft.clientCompany ?? "");
			setClientPhone(draft.clientPhone ?? "");
			setClientEmail(draft.clientEmail ?? "");
			setClientAddress(draft.clientAddress ?? "");
			setClientTaxNumber(draft.clientTaxNumber ?? "");
			setQuotationNumber(draft.quotationNo);
			setQuotationDate(new Date(draft.createdAt).toISOString().split("T")[0]);
			setValidUntilDate(new Date(draft.validUntil).toISOString().split("T")[0]);
			setPaymentTerms(draft.paymentTerms ?? "");
			setDeliveryTerms(draft.deliveryTerms ?? "");
			setWarrantyTerms(draft.warrantyTerms ?? "");
			setNotes(draft.notes ?? "");
			setIntroduction(draft.introduction ?? "");
			setTermsAndConditions(draft.termsAndConditions ?? "");
			setContentBlocks(
				(draft.contentBlocks ?? []).map((b: any) => ({
					id: b.id,
					title: b.title,
					content: b.content,
					position: b.position,
				})),
			);
			setVatPercent(Number(draft.vatPercent) || 15);
			setDiscountPercent(Number(draft.discountPercent) || 0);
			if (draft.projectId) {
				setProjectId(draft.projectId);
				setShowProjectLink(true);
			}

			if (draft.items && draft.items.length > 0) {
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

			setIsInitialized(true);
		}
	}, [draft, isInitialized]);

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

	// Apply finance settings defaults (مسودة جديدة فقط)
	useEffect(() => {
		if (orgSettings && mode === "create" && !draftId) {
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

	// Auto-seed templates if none exist (null = no template found, undefined = still loading)
	useEnsureDefaultTemplate(organizationId, defaultTemplateRaw, false);

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

	// نعمل دائماً على مسودة — قابلة للتحرير دائماً
	const isEditable = true;

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

	// ─── Autosave snapshots ────────────────────────────────
	const headerSnapshot = useMemo(
		() => ({
			clientId: clientId ?? null,
			clientName: clientName.trim(),
			clientCompany: clientCompany.trim() || undefined,
			clientPhone: clientPhone.trim() || undefined,
			clientEmail: clientEmail.trim(),
			clientAddress: clientAddress.trim() || undefined,
			clientTaxNumber: clientTaxNumber.trim() || undefined,
			validUntil: validUntilDate,
			paymentTerms: paymentTerms.trim() || undefined,
			deliveryTerms: deliveryTerms.trim() || undefined,
			warrantyTerms: warrantyTerms.trim() || undefined,
			notes: notes.trim() || undefined,
			introduction: introduction.trim() || undefined,
			termsAndConditions: termsAndConditions.trim() || undefined,
			vatPercent,
			discountPercent,
			projectId: !showProjectLink || projectId === "none" ? null : projectId,
			templateId: draft?.templateId || defaultTemplate?.id || undefined,
		}),
		[clientId, clientName, clientCompany, clientPhone, clientEmail, clientAddress,
		 clientTaxNumber, validUntilDate, paymentTerms, deliveryTerms, warrantyTerms,
		 notes, introduction, termsAndConditions, vatPercent, discountPercent,
		 showProjectLink, projectId, draft?.templateId, defaultTemplate?.id],
	);

	const itemsSnapshot = useMemo(
		() => ({
			items: items
				.filter((item) => item.description.trim())
				.map((item) => ({
					id: item.id,
					description: item.description.trim(),
					quantity: Math.max(Number(item.quantity) || 1, 0.01),
					unit: item.unit?.trim() || undefined,
					unitPrice: Number(item.unitPrice) || 0,
				})),
			contentBlocks: contentBlocks
				.filter((b) => b.title.trim() && b.content.trim())
				.map((b) => ({
					id: b.id,
					title: b.title.trim(),
					content: b.content.trim(),
					position: b.position,
				})),
		}),
		[items, contentBlocks],
	);

	const isReadyForCreate = useCallback(
		(snap: typeof headerSnapshot, snapItems: typeof itemsSnapshot) =>
			!!snap.clientName && snapItems.items.length > 0,
		[],
	);

	const createDraft = useCallback(
		async (snap: typeof headerSnapshot, snapItems: typeof itemsSnapshot) => {
			const result = await orpcClient.pricing.quotations.drafts.create({
				organizationId,
				clientId: snap.clientId ?? undefined,
				clientName: snap.clientName,
				clientCompany: snap.clientCompany,
				clientPhone: snap.clientPhone,
				clientEmail: snap.clientEmail || undefined,
				clientAddress: snap.clientAddress,
				clientTaxNumber: snap.clientTaxNumber,
				validUntil: new Date(snap.validUntil).toISOString(),
				paymentTerms: snap.paymentTerms,
				deliveryTerms: snap.deliveryTerms,
				warrantyTerms: snap.warrantyTerms,
				notes: snap.notes,
				introduction: snap.introduction,
				termsAndConditions: snap.termsAndConditions,
				templateId: snap.templateId,
				vatPercent: snap.vatPercent,
				discountPercent: snap.discountPercent,
				projectId: snap.projectId ?? undefined,
				contentBlocks: snapItems.contentBlocks.map(({ title, content, position }) => ({
					title,
					content,
					position,
				})),
				items: snapItems.items.map(({ description, quantity, unit, unitPrice }) => ({
					description,
					quantity,
					unit,
					unitPrice,
				})),
			});
			return { id: result.id };
		},
		[organizationId],
	);

	const updateHeader = useCallback(
		async (id: string, snap: typeof headerSnapshot) => {
			await orpcClient.pricing.quotations.drafts.updateHeader({
				organizationId,
				id,
				clientId: snap.clientId,
				clientName: snap.clientName,
				clientCompany: snap.clientCompany,
				clientPhone: snap.clientPhone,
				clientEmail: snap.clientEmail || "",
				clientAddress: snap.clientAddress,
				clientTaxNumber: snap.clientTaxNumber,
				validUntil: new Date(snap.validUntil).toISOString(),
				paymentTerms: snap.paymentTerms,
				deliveryTerms: snap.deliveryTerms,
				warrantyTerms: snap.warrantyTerms,
				notes: snap.notes,
				introduction: snap.introduction,
				termsAndConditions: snap.termsAndConditions,
				templateId: snap.templateId,
				vatPercent: snap.vatPercent,
				discountPercent: snap.discountPercent,
				projectId: snap.projectId,
			});
		},
		[organizationId],
	);

	// نتعقّب آخر items/contentBlocks لتجنب استدعاءات لا داعي لها
	const lastSavedItemsRef = useMemo(() => ({ current: null as null | typeof itemsSnapshot }), []);

	const updateItemsRemote = useCallback(
		async (id: string, snap: typeof itemsSnapshot) => {
			const prev = lastSavedItemsRef.current;
			const itemsChanged =
				!prev || JSON.stringify(prev.items) !== JSON.stringify(snap.items);
			const blocksChanged =
				!prev || JSON.stringify(prev.contentBlocks) !== JSON.stringify(snap.contentBlocks);

			if (itemsChanged) {
				await orpcClient.pricing.quotations.drafts.updateItems({
					organizationId,
					id,
					items: snap.items.map((item) => ({
						id: item.id.startsWith("new-") || /^\d+$/.test(item.id) ? undefined : item.id,
						description: item.description,
						quantity: item.quantity,
						unit: item.unit,
						unitPrice: item.unitPrice,
					})),
				});
			}
			if (blocksChanged) {
				await orpcClient.pricing.quotations.drafts.updateContentBlocks({
					organizationId,
					id,
					contentBlocks: snap.contentBlocks.map((b) => ({
						title: b.title,
						content: b.content,
						position: b.position,
					})),
				});
			}
			lastSavedItemsRef.current = snap;
		},
		[organizationId, lastSavedItemsRef],
	);

	const autosaveEnabled = !isPublishing && !isCommitting && !isStartingEdit;

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
			if (typeof window !== "undefined") {
				window.history.replaceState(null, "", `${basePath}/drafts/${newId}`);
			}
		},
		onSaved: () => {
			queryClient.invalidateQueries({ queryKey: ["pricing", "quotationDrafts"] });
		},
		onConflict: () => setShowConflictDialog(true),
	});

	// commit المسودة (حفظ): يُفرّغ آخر تغييرات ثم يثبّت المسودة. يُرجع id عرض السعر المعتمد.
	const commitDraft = async (): Promise<string | null> => {
		await autosave.forceSave();
		const did = workingDraftIdRef.current;
		if (!did) {
			toast.error(t("pricing.quotations.errors.itemsRequired"));
			return null;
		}
		const result = await orpcClient.pricing.quotations.drafts.commit({ organizationId, id: did });
		queryClient.invalidateQueries({ queryKey: ["finance", "quotations"] });
		queryClient.invalidateQueries({ queryKey: ["pricing", "quotationDrafts"] });
		return result.id;
	};

	// زر "حفظ" → commit ثم الانتقال لعرض السعر المعتمد
	const handleSaveClick = async () => {
		if (!clientName.trim()) {
			toast.error(t("pricing.quotations.errors.clientRequired"));
			return;
		}
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

	// زر "إرسال" → commit ثم تغيير الحالة إلى SENT
	const handleSendClick = async () => {
		if (!clientName.trim()) {
			toast.error(t("pricing.quotations.errors.clientRequired"));
			return;
		}
		setIsPublishing(true);
		try {
			const id = await commitDraft();
			if (!id) {
				setIsPublishing(false);
				return;
			}
			await orpcClient.pricing.quotations.updateStatus({ organizationId, id, status: "SENT" });
			queryClient.invalidateQueries({ queryKey: ["finance", "quotations"] });
			toast.success(t("pricing.quotations.status.sentSuccess"));
			router.push(`${basePath}/${id}`);
		} catch (e: any) {
			toast.error(e?.message || t("pricing.quotations.statusUpdateError"));
			setIsPublishing(false);
		}
	};

	// تجاهل مسودة التعديل
	const handleDiscardDraft = async () => {
		const did = workingDraftIdRef.current;
		if (!did) {
			router.push(basePath);
			return;
		}
		try {
			await orpcClient.pricing.quotations.drafts.delete({ organizationId, id: did });
			queryClient.invalidateQueries({ queryKey: ["pricing", "quotationDrafts"] });
			toast.success(t("drafts.discardSuccess"));
			router.push(sourceQuotationId ? `${basePath}/${sourceQuotationId}` : basePath);
		} catch (e: any) {
			toast.error(e?.message || t("drafts.discardError"));
		}
	};

	// Form submit (Enter في الحقول) → force-save
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await autosave.forceSave();
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

	const isBusy = autosave.state.status === "saving" || isCommitting || isPublishing;

	// Loading state
	if ((isEditDraft && isStartingEdit) || (!!workingDraftId && isLoadingDraft && !draft)) {
		return <EditorPageSkeleton />;
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
							<AutosaveIndicator state={autosave.state} onRetry={() => void autosave.forceSave()} mode="draft" className="hidden sm:inline-flex me-1" />
							<Button
								type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
								onClick={() => setShowPreviewDialog(true)}
							>
								<Eye className="h-4 w-4" />
							</Button>
							<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setShowPreviewDialog(true)}>
								<Printer className="h-4 w-4" />
							</Button>
							<div className="w-px h-5 bg-border/50" />
							<Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={handleSaveClick} className="h-8 rounded-[10px] text-xs px-4">
								<Save className="h-3.5 w-3.5 me-1.5" />
								{isCommitting ? t("common.saving") : t("common.save")}
							</Button>
							<Button type="button" size="sm" disabled={isBusy} onClick={handleSendClick} className="h-8 rounded-[10px] text-xs px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-[0_4px_15px_hsl(var(--primary)/0.35)] transition-all">
								<Send className="h-3.5 w-3.5 me-1.5" />
								{isPublishing ? t("common.saving") : t("pricing.quotations.actions.send")}
							</Button>
						</div>
					</div>
				</div>

				{/* Edit-draft banner */}
				{showEditDraftUi && (
					<EditDraftBanner
						sourceNumber={sourceQuotationNo}
						sourceHref={sourceQuotationId ? `${basePath}/${sourceQuotationId}` : undefined}
						onDiscard={handleDiscardDraft}
					/>
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

				{/* ─── Introduction (Collapsible) ─────────────────────── */}
				<Collapsible defaultOpen={!!introduction}>
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<CollapsibleTrigger asChild>
							<button type="button" className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
								<span className="flex items-center gap-2.5">
									<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/40 dark:to-sky-800/20 flex items-center justify-center">
										<BookOpen className="h-[15px] w-[15px] text-sky-500" />
									</div>
									{t("pricing.quotations.introduction")}
								</span>
								<ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="px-5 pb-5">
								<Textarea
									value={introduction}
									onChange={(e: any) => setIntroduction(e.target.value)}
									placeholder={t("pricing.quotations.introductionPlaceholder")}
									rows={4}
									disabled={!isEditable}
									className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background resize-none"
									maxLength={5000}
								/>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

				{/* ─── Content Blocks: BEFORE_TABLE ───────────────��───── */}
				<Collapsible defaultOpen={contentBlocks.some((b) => b.position === "BEFORE_TABLE")}>
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<CollapsibleTrigger asChild>
							<button type="button" className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
								<span className="flex items-center gap-2.5">
									<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-800/20 flex items-center justify-center">
										<ListChecks className="h-[15px] w-[15px] text-violet-500" />
									</div>
									{t("pricing.quotations.contentBlocksBeforeTable")}
								</span>
								<ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="px-5 pb-5">
								<QuotationContentBlockEditor
									blocks={contentBlocks}
									position="BEFORE_TABLE"
									onChange={setContentBlocks}
									disabled={!isEditable}
								/>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

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
													ref={(el) => {
														if (el && el.value) {
															el.style.height = "auto";
															setTimeout(() => {
																el.style.height = Math.min(el.scrollHeight, 300) + "px";
															}, 0);
														}
													}}
													onChange={(e: any) => {
														updateItem(item.id, { description: e.target.value });
														const ta = e.target as HTMLTextAreaElement;
														ta.style.height = "auto";
														setTimeout(() => {
															ta.style.height = Math.min(ta.scrollHeight, 300) + "px";
														}, 0);
													}}
													placeholder={t("finance.items.descriptionPlaceholder")}
													rows={1}
													maxLength={2000}
													enterKeyHint="enter"
													disabled={!isEditable}
													className="w-full min-h-[36px] max-h-[300px] px-3 py-2 rounded-[10px] text-sm border border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08] focus:outline-none overflow-y-auto resize-y whitespace-pre-wrap break-words transition-all disabled:opacity-50 disabled:cursor-not-allowed"
												/>
											</td>
										)}
										{isColumnVisible("unit") && (
											<td className="p-2">
												<UnitField
													value={item.unit}
													onChange={(v) => updateItem(item.id, { unit: v })}
													disabled={!isEditable}
												/>
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

				{/* ─── Content Blocks: AFTER_TABLE ────────────────────── */}
				<Collapsible defaultOpen={contentBlocks.some((b) => b.position === "AFTER_TABLE")}>
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<CollapsibleTrigger asChild>
							<button type="button" className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
								<span className="flex items-center gap-2.5">
									<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-800/20 flex items-center justify-center">
										<ListChecks className="h-[15px] w-[15px] text-violet-500" />
									</div>
									{t("pricing.quotations.contentBlocksAfterTable")}
								</span>
								<ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="px-5 pb-5">
								<QuotationContentBlockEditor
									blocks={contentBlocks}
									position="AFTER_TABLE"
									onChange={setContentBlocks}
									disabled={!isEditable}
								/>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

				{/* ─── Terms & Conditions (Collapsible) ───────────────── */}
				<Collapsible defaultOpen={!!termsAndConditions}>
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<CollapsibleTrigger asChild>
							<button type="button" className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
								<span className="flex items-center gap-2.5">
									<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 flex items-center justify-center">
										<ScrollText className="h-[15px] w-[15px] text-emerald-500" />
									</div>
									{t("pricing.quotations.termsAndConditions")}
								</span>
								<ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="px-5 pb-5">
								<Textarea
									value={termsAndConditions}
									onChange={(e: any) => setTermsAndConditions(e.target.value)}
									placeholder={t("pricing.quotations.termsAndConditionsPlaceholder")}
									rows={4}
									disabled={!isEditable}
									className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background resize-none"
									maxLength={5000}
								/>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

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
						<div className="min-w-0">
							<p className="text-[11px] text-muted-foreground">{t("finance.summary.total")}</p>
							<p className="text-lg font-bold text-primary leading-tight">
								{formatCurrency(totals.totalAmount)}
								<span className="text-xs font-normal text-muted-foreground ms-1">{currency}</span>
							</p>
							<AutosaveIndicator state={autosave.state} onRetry={() => void autosave.forceSave()} mode="draft" className="mt-0.5" />
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={handleSaveClick} className="rounded-xl h-9">
								<Save className="h-4 w-4 me-1" />
								{t("common.save")}
							</Button>
							<Button type="button" size="sm" disabled={isBusy} onClick={handleSendClick} className="rounded-xl h-9">
								<Send className="h-4 w-4 me-1" />
								{t("pricing.quotations.actions.send")}
							</Button>
						</div>
					</div>
				</div>
			</form>

			<AutosaveConflictDialog
				open={showConflictDialog}
				onReload={handleConflictReload}
				onOverwrite={handleConflictOverwrite}
			/>

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
									introduction: introduction || undefined,
									termsAndConditions: termsAndConditions || undefined,
									contentBlocks: contentBlocks
										.filter((b) => b.title.trim() && b.content.trim())
										.map((b) => ({ title: b.title, content: b.content, position: b.position })),
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
