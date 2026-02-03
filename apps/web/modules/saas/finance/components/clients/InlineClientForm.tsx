"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
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
	ChevronDown,
	X,
	Building2,
	Phone,
	MapPin,
	Receipt,
	FileText,
} from "lucide-react";
import { cn } from "@ui/lib";

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

interface InlineClientFormProps {
	organizationId: string;
	onSuccess: (client: {
		id: string;
		name: string;
		company?: string;
		phone?: string;
		email?: string;
		address?: string;
		taxNumber?: string;
	}) => void;
	onCancel: () => void;
}

export function InlineClientForm({
	organizationId,
	onSuccess,
	onCancel,
}: InlineClientFormProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	// البيانات الأساسية
	const [businessName, setBusinessName] = useState("");
	const [taxNumber, setTaxNumber] = useState("");
	const [crNumber, setCrNumber] = useState("");

	// العنوان الوطني
	const [streetAddress1, setStreetAddress1] = useState("");
	const [city, setCity] = useState("");
	const [region, setRegion] = useState("");
	const [postalCode, setPostalCode] = useState("");

	// معلومات إضافية
	const [mobile, setMobile] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [notes, setNotes] = useState("");

	// UI state
	const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);

	// إنشاء عميل جديد
	const createMutation = useMutation({
		mutationFn: async () => {
			if (!businessName.trim()) {
				throw new Error(t("finance.clients.errors.nameRequired"));
			}

			// تجميع العنوان الكامل
			const addressParts = [streetAddress1, city, region, postalCode].filter(Boolean);
			const fullAddress = addressParts.join("، ");

			return orpcClient.finance.clients.create({
				organizationId,
				clientType: "COMMERCIAL",
				businessName: businessName.trim(),
				name: businessName.trim(),
				phone: phone || undefined,
				mobile: mobile || undefined,
				email: email || undefined,
				streetAddress1: streetAddress1 || undefined,
				city: city || undefined,
				region: region || undefined,
				postalCode: postalCode || undefined,
				country: "SA",
				currency: "SAR",
				displayLanguage: "ar",
				classification: [],
				taxNumber: taxNumber || undefined,
				crNumber: crNumber || undefined,
				notes: notes || undefined,
			});
		},
		onSuccess: async (newClient) => {
			toast.success(t("finance.clients.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });

			// تجميع العنوان للإرسال
			const addressParts = [streetAddress1, city, region].filter(Boolean);
			const fullAddress = addressParts.join("، ");

			onSuccess({
				id: newClient.id,
				name: businessName.trim(),
				company: businessName.trim(),
				phone: mobile || phone || undefined,
				email: email || undefined,
				address: fullAddress || undefined,
				taxNumber: taxNumber || undefined,
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.createError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		createMutation.mutate();
	};

	return (
		<div className="rounded-xl border bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-500/5">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
						<Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					</div>
					<span className="font-semibold text-sm">{t("finance.clients.addClient")}</span>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onCancel}
					className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Form */}
			<div className="p-4 space-y-4">
				{/* البيانات الأساسية */}
				<div className="grid gap-3 sm:grid-cols-2">
					{/* الاسم التجاري */}
					<div className="sm:col-span-2">
						<Label className="text-xs text-muted-foreground">{t("finance.clients.businessName")} *</Label>
						<Input
							value={businessName}
							onChange={(e) => setBusinessName(e.target.value)}
							placeholder={t("finance.clients.businessNamePlaceholder")}
							className="rounded-lg mt-1 h-9 text-sm"
							required
						/>
					</div>

					{/* الرقم الضريبي */}
					<div>
						<Label className="text-xs text-muted-foreground">{t("finance.clients.taxNumber")}</Label>
						<Input
							value={taxNumber}
							onChange={(e) => setTaxNumber(e.target.value)}
							placeholder="3XXXXXXXXXX0003"
							className="rounded-lg mt-1 h-9 text-sm font-mono"
							dir="ltr"
						/>
					</div>

					{/* السجل التجاري */}
					<div>
						<Label className="text-xs text-muted-foreground">{t("finance.clients.crNumber")}</Label>
						<Input
							value={crNumber}
							onChange={(e) => setCrNumber(e.target.value)}
							placeholder="XXXXXXXXXX"
							className="rounded-lg mt-1 h-9 text-sm font-mono"
							dir="ltr"
						/>
					</div>
				</div>

				{/* العنوان الوطني */}
				<div className="pt-3 border-t space-y-3">
					<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
						<MapPin className="h-3.5 w-3.5" />
						{t("finance.clients.sections.address")}
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Input
								value={streetAddress1}
								onChange={(e) => setStreetAddress1(e.target.value)}
								placeholder={t("finance.clients.streetAddress1Placeholder")}
								className="rounded-lg h-9 text-sm"
							/>
						</div>
						<div>
							<Input
								value={city}
								onChange={(e) => setCity(e.target.value)}
								placeholder={t("finance.clients.cityPlaceholder")}
								className="rounded-lg h-9 text-sm"
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<Select value={region} onValueChange={setRegion}>
								<SelectTrigger className="rounded-lg h-9 text-xs">
									<SelectValue placeholder={t("finance.clients.regionPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{saudiRegions.map((r) => (
										<SelectItem key={r} value={r} className="text-sm">
											{r}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Input
								value={postalCode}
								onChange={(e) => setPostalCode(e.target.value)}
								placeholder="12345"
								className="rounded-lg h-9 text-sm font-mono"
								dir="ltr"
							/>
						</div>
					</div>
				</div>

				{/* معلومات إضافية - قابلة للطي */}
				<Collapsible open={additionalInfoOpen} onOpenChange={setAdditionalInfoOpen}>
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
						>
							<span className="flex items-center gap-2">
								<FileText className="h-3.5 w-3.5" />
								{t("finance.clients.sections.additional")}
							</span>
							<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", additionalInfoOpen && "rotate-180")} />
						</button>
					</CollapsibleTrigger>
					<CollapsibleContent className="pt-3 space-y-3">
						<div className="grid gap-3 sm:grid-cols-3">
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.mobile")}</Label>
								<Input
									value={mobile}
									onChange={(e) => setMobile(e.target.value)}
									placeholder="05XXXXXXXX"
									className="rounded-lg mt-1 h-9 text-sm font-mono"
									dir="ltr"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.phone")}</Label>
								<Input
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder="011XXXXXXX"
									className="rounded-lg mt-1 h-9 text-sm font-mono"
									dir="ltr"
								/>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">{t("finance.clients.email")}</Label>
								<Input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="email@example.com"
									className="rounded-lg mt-1 h-9 text-sm"
									dir="ltr"
								/>
							</div>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">{t("finance.clients.notes")}</Label>
							<Textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder={t("finance.clients.notesPlaceholder")}
								rows={2}
								className="rounded-lg mt-1 text-sm"
							/>
						</div>
					</CollapsibleContent>
				</Collapsible>

				{/* أزرار الإجراءات */}
				<div className="flex items-center gap-2 pt-2">
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={createMutation.isPending || !businessName.trim()}
						size="sm"
						className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700"
					>
						{createMutation.isPending ? (
							<Loader2 className="h-4 w-4 me-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 me-2" />
						)}
						{createMutation.isPending ? t("common.saving") : t("finance.clients.addClient")}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onCancel}
						className="rounded-lg"
					>
						{t("common.cancel")}
					</Button>
				</div>
			</div>
		</div>
	);
}
