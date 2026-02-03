"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { toast } from "sonner";
import {
	Save,
	Loader2,
	User,
	Building2,
	ChevronDown,
	ArrowRight,
	Phone,
	Mail,
	MapPin,
	Receipt,
	FileText,
	CreditCard,
} from "lucide-react";
import { cn } from "@ui/lib";

// Types
export type ClientType = "INDIVIDUAL" | "COMMERCIAL";

export interface SecondaryAddress {
	streetAddress1?: string;
	streetAddress2?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	country?: string;
}

export interface ClientContact {
	id?: string;
	name: string;
	position?: string;
	phone?: string;
	mobile?: string;
	email?: string;
	isPrimary: boolean;
	notes?: string;
}

export interface ClientFormData {
	clientType: ClientType;
	firstName: string;
	lastName: string;
	businessName: string;
	phone: string;
	mobile: string;
	email: string;
	streetAddress1: string;
	streetAddress2: string;
	city: string;
	region: string;
	postalCode: string;
	country: string;
	secondaryAddress: SecondaryAddress | null;
	showSecondaryAddress: boolean;
	taxNumber: string;
	crNumber: string;
	code: string;
	currency: string;
	classification: string[];
	notes: string;
	displayLanguage: string;
}

const defaultFormData: ClientFormData = {
	clientType: "COMMERCIAL",
	firstName: "",
	lastName: "",
	businessName: "",
	phone: "",
	mobile: "",
	email: "",
	streetAddress1: "",
	streetAddress2: "",
	city: "",
	region: "",
	postalCode: "",
	country: "SA",
	secondaryAddress: null,
	showSecondaryAddress: false,
	taxNumber: "",
	crNumber: "",
	code: "",
	currency: "SAR",
	classification: [],
	notes: "",
	displayLanguage: "ar",
};

// قائمة المناطق السعودية
const saudiRegions = [
	"الرياض",
	"مكة المكرمة",
	"المدينة المنورة",
	"القصيم",
	"الشرقية",
	"عسير",
	"تبوك",
	"حائل",
	"الحدود الشمالية",
	"جازان",
	"نجران",
	"الباحة",
	"الجوف",
];

interface ClientFormProps {
	organizationId: string;
	organizationSlug: string;
	clientId?: string;
	mode: "create" | "edit";
}

export function ClientForm({
	organizationId,
	organizationSlug,
	clientId,
	mode,
}: ClientFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState<ClientFormData>(defaultFormData);
	const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);

	// جلب بيانات العميل في وضع التعديل فقط
	const { data: clientData, isLoading: isLoadingClient } = useQuery({
		...orpc.finance.clients.getById.queryOptions({
			input: {
				organizationId,
				id: clientId ?? "",
			},
		}),
		enabled: mode === "edit" && !!clientId,
	});

	// تحميل البيانات عند استلامها
	useEffect(() => {
		if (clientData && mode === "edit") {
			setFormData({
				clientType: clientData.clientType as ClientType,
				firstName: clientData.firstName ?? "",
				lastName: clientData.lastName ?? "",
				businessName: clientData.businessName ?? "",
				phone: clientData.phone ?? "",
				mobile: clientData.mobile ?? "",
				email: clientData.email ?? "",
				streetAddress1: clientData.streetAddress1 ?? "",
				streetAddress2: clientData.streetAddress2 ?? "",
				city: clientData.city ?? "",
				region: clientData.region ?? "",
				postalCode: clientData.postalCode ?? "",
				country: clientData.country ?? "SA",
				secondaryAddress: clientData.secondaryAddress as SecondaryAddress | null,
				showSecondaryAddress: !!clientData.secondaryAddress,
				taxNumber: clientData.taxNumber ?? "",
				crNumber: clientData.crNumber ?? "",
				code: clientData.code ?? "",
				currency: clientData.currency ?? "SAR",
				classification: clientData.classification ?? [],
				notes: clientData.notes ?? "",
				displayLanguage: clientData.displayLanguage ?? "ar",
			});
		}
	}, [clientData, mode]);

	// حساب الاسم الكامل
	const computeName = (): string => {
		if (formData.clientType === "COMMERCIAL") {
			return formData.businessName;
		}
		return `${formData.firstName} ${formData.lastName}`.trim();
	};

	// إنشاء عميل جديد
	const createMutation = useMutation({
		mutationFn: async () => {
			const name = computeName();
			if (!name) {
				throw new Error(t("finance.clients.errors.nameRequired"));
			}

			return orpcClient.finance.clients.create({
				organizationId,
				clientType: formData.clientType,
				firstName: formData.firstName || undefined,
				lastName: formData.lastName || undefined,
				businessName: formData.businessName || undefined,
				name,
				phone: formData.phone || undefined,
				mobile: formData.mobile || undefined,
				email: formData.email || undefined,
				streetAddress1: formData.streetAddress1 || undefined,
				streetAddress2: formData.streetAddress2 || undefined,
				city: formData.city || undefined,
				region: formData.region || undefined,
				postalCode: formData.postalCode || undefined,
				country: formData.country,
				secondaryAddress: formData.showSecondaryAddress && formData.secondaryAddress
					? formData.secondaryAddress
					: undefined,
				code: formData.code || undefined,
				currency: formData.currency,
				displayLanguage: formData.displayLanguage,
				classification: formData.classification,
				taxNumber: formData.taxNumber || undefined,
				crNumber: formData.crNumber || undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: async (newClient) => {
			toast.success(t("finance.clients.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
			router.push(`/app/${organizationSlug}/finance/clients/${newClient.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.createError"));
		},
	});

	// تحديث عميل
	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!clientId) return;

			const name = computeName();
			if (!name) {
				throw new Error(t("finance.clients.errors.nameRequired"));
			}

			return orpcClient.finance.clients.update({
				organizationId,
				id: clientId,
				clientType: formData.clientType,
				firstName: formData.firstName || undefined,
				lastName: formData.lastName || undefined,
				businessName: formData.businessName || undefined,
				name,
				phone: formData.phone || undefined,
				mobile: formData.mobile || undefined,
				email: formData.email || undefined,
				streetAddress1: formData.streetAddress1 || undefined,
				streetAddress2: formData.streetAddress2 || undefined,
				city: formData.city || undefined,
				region: formData.region || undefined,
				postalCode: formData.postalCode || undefined,
				country: formData.country,
				secondaryAddress: formData.showSecondaryAddress
					? formData.secondaryAddress
					: null,
				code: formData.code || undefined,
				currency: formData.currency,
				displayLanguage: formData.displayLanguage,
				classification: formData.classification,
				taxNumber: formData.taxNumber || undefined,
				crNumber: formData.crNumber || undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
			router.push(`/app/${organizationSlug}/finance/clients/${clientId}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.updateError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (mode === "create") {
			createMutation.mutate();
		} else {
			updateMutation.mutate();
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	if (mode === "edit" && isLoadingClient) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="pb-28 lg:pb-6 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-l from-emerald-500/10 via-emerald-500/5 to-transparent border border-border/50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
						<User className="h-5 w-5 text-emerald-500" />
					</div>
					<div>
						<h1 className="text-lg font-bold">
							{mode === "create" ? t("finance.clients.addClient") : t("finance.clients.editClient")}
						</h1>
						<p className="text-xs text-muted-foreground">{t("finance.clients.addClientDescription")}</p>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					<Button type="button" variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => router.back()}>
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Main Form Grid */}
			<div className="grid gap-4 lg:grid-cols-3">
				{/* البيانات الأساسية - عمودين */}
				<div className="lg:col-span-2 rounded-2xl border bg-card p-4 space-y-4">
					{/* نوع العميل والاسم */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
							<User className="h-4 w-4" />
							{t("finance.clients.sections.clientInfo")}
						</div>

						{/* نوع العميل */}
						<Tabs
							value={formData.clientType}
							onValueChange={(value) => setFormData((prev) => ({ ...prev, clientType: value as ClientType }))}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-2 rounded-xl h-11">
								<TabsTrigger value="COMMERCIAL" className="rounded-xl gap-2">
									<Building2 className="h-4 w-4" />
									{t("finance.clients.types.commercial")}
								</TabsTrigger>
								<TabsTrigger value="INDIVIDUAL" className="rounded-xl gap-2">
									<User className="h-4 w-4" />
									{t("finance.clients.types.individual")}
								</TabsTrigger>
							</TabsList>

							{/* حقول الشركة */}
							<TabsContent value="COMMERCIAL" className="mt-4">
								<div>
									<Label className="text-xs text-muted-foreground">{t("finance.clients.businessName")} *</Label>
									<Input
										value={formData.businessName}
										onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
										placeholder={t("finance.clients.businessNamePlaceholder")}
										className="rounded-lg mt-1 h-10"
										required={formData.clientType === "COMMERCIAL"}
									/>
								</div>
							</TabsContent>

							{/* حقول الفرد */}
							<TabsContent value="INDIVIDUAL" className="mt-4">
								<div className="grid gap-3 sm:grid-cols-2">
									<div>
										<Label className="text-xs text-muted-foreground">{t("finance.clients.firstName")} *</Label>
										<Input
											value={formData.firstName}
											onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
											placeholder={t("finance.clients.firstNamePlaceholder")}
											className="rounded-lg mt-1 h-10"
											required={formData.clientType === "INDIVIDUAL"}
										/>
									</div>
									<div>
										<Label className="text-xs text-muted-foreground">{t("finance.clients.lastName")} *</Label>
										<Input
											value={formData.lastName}
											onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
											placeholder={t("finance.clients.lastNamePlaceholder")}
											className="rounded-lg mt-1 h-10"
											required={formData.clientType === "INDIVIDUAL"}
										/>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</div>

					{/* الرقم الضريبي والسجل التجاري */}
					<div className="pt-4 border-t space-y-4">
						<div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
							<Receipt className="h-4 w-4" />
							{t("finance.clients.sections.taxInfo")}
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.taxNumber")}</Label>
								<Input
									value={formData.taxNumber}
									onChange={(e) => setFormData((prev) => ({ ...prev, taxNumber: e.target.value }))}
									placeholder="3XXXXXXXXXX0003"
									className="rounded-lg mt-1 h-10 font-mono text-sm"
									dir="ltr"
								/>
								<p className="text-[10px] text-muted-foreground mt-1">{t("finance.clients.taxNumberHint")}</p>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.crNumber")}</Label>
								<Input
									value={formData.crNumber}
									onChange={(e) => setFormData((prev) => ({ ...prev, crNumber: e.target.value }))}
									placeholder="XXXXXXXXXX"
									className="rounded-lg mt-1 h-10 font-mono text-sm"
									dir="ltr"
								/>
								<p className="text-[10px] text-muted-foreground mt-1">{t("finance.clients.crNumberHint")}</p>
							</div>
						</div>
					</div>

					{/* العنوان الوطني */}
					<div className="pt-4 border-t space-y-4">
						<div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
							<MapPin className="h-4 w-4" />
							{t("finance.clients.sections.address")}
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<Label className="text-xs text-muted-foreground">{t("finance.clients.streetAddress1")}</Label>
								<Input
									value={formData.streetAddress1}
									onChange={(e) => setFormData((prev) => ({ ...prev, streetAddress1: e.target.value }))}
									placeholder={t("finance.clients.streetAddress1Placeholder")}
									className="rounded-lg mt-1 h-10"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.city")}</Label>
								<Input
									value={formData.city}
									onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
									placeholder={t("finance.clients.cityPlaceholder")}
									className="rounded-lg mt-1 h-10"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.region")}</Label>
								<Select
									value={formData.region}
									onValueChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}
								>
									<SelectTrigger className="rounded-lg mt-1 h-10">
										<SelectValue placeholder={t("finance.clients.regionPlaceholder")} />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{saudiRegions.map((region) => (
											<SelectItem key={region} value={region}>
												{region}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.postalCode")}</Label>
								<Input
									value={formData.postalCode}
									onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
									placeholder="12345"
									className="rounded-lg mt-1 h-10 font-mono"
									dir="ltr"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.streetAddress2")}</Label>
								<Input
									value={formData.streetAddress2}
									onChange={(e) => setFormData((prev) => ({ ...prev, streetAddress2: e.target.value }))}
									placeholder={t("finance.clients.streetAddress2Placeholder")}
									className="rounded-lg mt-1 h-10"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* العمود الجانبي - عمود واحد */}
				<div className="lg:col-span-1 space-y-4">
					{/* معلومات التواصل */}
					<div className="rounded-2xl border bg-card p-4 space-y-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
							<Phone className="h-4 w-4" />
							{t("finance.clients.contact")}
						</div>

						<div className="space-y-3">
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.mobile")}</Label>
								<Input
									value={formData.mobile}
									onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
									placeholder="05XXXXXXXX"
									className="rounded-lg mt-1 h-10 font-mono"
									dir="ltr"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.phone")}</Label>
								<Input
									value={formData.phone}
									onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
									placeholder="011XXXXXXX"
									className="rounded-lg mt-1 h-10 font-mono"
									dir="ltr"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.email")}</Label>
								<Input
									type="email"
									value={formData.email}
									onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
									placeholder="email@example.com"
									className="rounded-lg mt-1 h-10 text-sm"
									dir="ltr"
								/>
							</div>
						</div>
					</div>

					{/* أزرار الإجراءات */}
					<div className="rounded-2xl border bg-card p-3 flex flex-col gap-2">
						<button
							type="submit"
							disabled={isPending}
							className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-foreground transition-all duration-200 disabled:opacity-50"
						>
							<div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
								{isPending ? (
									<Loader2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
								) : (
									<Save className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
								)}
							</div>
							<span className="text-sm font-medium">
								{isPending ? t("common.saving") : (mode === "create" ? t("finance.clients.addClient") : t("common.save"))}
							</span>
						</button>

						<button
							type="button"
							onClick={() => router.back()}
							className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-200"
						>
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
								<ArrowRight className="h-4 w-4 text-muted-foreground" />
							</div>
							<span className="text-sm font-medium">{t("common.cancel")}</span>
						</button>
					</div>
				</div>
			</div>

			{/* معلومات إضافية - قسم قابل للطي */}
			<Collapsible open={additionalInfoOpen} onOpenChange={setAdditionalInfoOpen}>
				<CollapsibleTrigger asChild>
					<Button type="button" variant="outline" className="w-full justify-between rounded-xl h-12">
						<span className="flex items-center gap-2">
							<FileText className="h-4 w-4 text-muted-foreground" />
							{t("finance.clients.sections.additional")}
						</span>
						<ChevronDown className={cn("h-4 w-4 transition-transform", additionalInfoOpen && "rotate-180")} />
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-3">
					<div className="rounded-2xl border bg-card p-4 space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.code")}</Label>
								<Input
									value={formData.code}
									onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
									placeholder={t("finance.clients.codePlaceholder")}
									className="rounded-lg mt-1 h-10 font-mono"
									dir="ltr"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.currency")}</Label>
								<Select
									value={formData.currency}
									onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
								>
									<SelectTrigger className="rounded-lg mt-1 h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
										<SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
										<SelectItem value="EUR">يورو (EUR)</SelectItem>
										<SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">{t("finance.clients.notes")}</Label>
							<Textarea
								value={formData.notes}
								onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
								placeholder={t("finance.clients.notesPlaceholder")}
								rows={3}
								className="rounded-lg mt-1"
							/>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>

			{/* Mobile Fixed Bottom Bar */}
			<div className="fixed bottom-0 inset-x-0 z-50 lg:hidden backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-t p-4 safe-area-inset-bottom">
				<div className="flex items-center justify-between gap-4">
					<Button type="button" variant="outline" size="lg" className="rounded-xl flex-1" onClick={() => router.back()}>
						{t("common.cancel")}
					</Button>
					<Button type="submit" size="lg" className="rounded-xl flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
						{isPending ? (
							<Loader2 className="h-4 w-4 me-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 me-2" />
						)}
						{isPending ? t("common.saving") : (mode === "create" ? t("finance.clients.addClient") : t("common.save"))}
					</Button>
				</div>
			</div>
		</form>
	);
}
