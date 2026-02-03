"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@ui/components/alert-dialog";
import { toast } from "sonner";
import {
	User,
	Building2,
	Phone,
	Smartphone,
	Mail,
	MapPin,
	Receipt,
	CreditCard,
	Users2,
	FileText,
	Globe,
	Pencil,
	Trash2,
	CheckCircle,
	XCircle,
	Star,
	Calendar,
	Hash,
} from "lucide-react";
import { formatDateArabic } from "../../lib/utils";

interface ClientDetailProps {
	organizationId: string;
	organizationSlug: string;
	clientId: string;
}

// قائمة التصنيفات
const classificationLabels: Record<string, string> = {
	VIP: "VIP",
	regular: "عادي",
	company: "شركة",
	government: "جهة حكومية",
	contractor: "مقاول",
};

// قائمة الدول
const countryNames: Record<string, string> = {
	SA: "السعودية",
	AE: "الإمارات",
	KW: "الكويت",
	QA: "قطر",
	BH: "البحرين",
	OM: "عمان",
	EG: "مصر",
	JO: "الأردن",
};

export function ClientDetail({
	organizationId,
	organizationSlug,
	clientId,
}: ClientDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// جلب بيانات العميل
	const { data: client, isLoading } = useQuery(
		orpc.finance.clients.getById.queryOptions({
			input: {
				organizationId,
				id: clientId,
			},
		}),
	);

	// حذف العميل
	const deleteMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.clients.delete({
				organizationId,
				id: clientId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
			router.push(`/app/${organizationSlug}/finance/clients`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.deleteError"));
		},
	});

	// تبديل حالة النشاط
	const toggleActiveMutation = useMutation({
		mutationFn: async (isActive: boolean) => {
			return orpcClient.finance.clients.update({
				organizationId,
				id: clientId,
				isActive,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.statusUpdateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.statusUpdateError"));
		},
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="text-center py-20">
				<User className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
				<p className="text-slate-500 dark:text-slate-400">
					{t("finance.clients.notFound")}
				</p>
			</div>
		);
	}

	const secondaryAddress = client.secondaryAddress as Record<string, string> | null;

	return (
		<div className="space-y-6 pb-8">
			{/* رأس الصفحة */}
			<Card className="rounded-2xl">
				<CardContent className="p-6">
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div className="flex items-start gap-4">
							<div className="p-3 bg-primary/10 rounded-xl">
								{client.clientType === "COMMERCIAL" ? (
									<Building2 className="h-8 w-8 text-primary" />
								) : (
									<User className="h-8 w-8 text-primary" />
								)}
							</div>
							<div>
								<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
									{client.name}
								</h1>
								<div className="flex items-center gap-2 mt-1">
									{client.code && (
										<Badge variant="outline" className="rounded-lg">
											<Hash className="h-3 w-3 me-1" />
											{client.code}
										</Badge>
									)}
									<Badge
										variant={
											client.clientType === "COMMERCIAL"
												? "secondary"
												: "outline"
										}
										className="rounded-lg"
									>
										{client.clientType === "COMMERCIAL"
											? t("finance.clients.types.commercial")
											: t("finance.clients.types.individual")}
									</Badge>
									{client.isActive ? (
										<Badge className="rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
											<CheckCircle className="h-3 w-3 me-1" />
											{t("finance.clients.active")}
										</Badge>
									) : (
										<Badge className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
											<XCircle className="h-3 w-3 me-1" />
											{t("finance.clients.inactive")}
										</Badge>
									)}
								</div>
								{client.classification && client.classification.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{client.classification.map((c: string) => (
											<Badge key={c} variant="secondary" className="rounded-lg">
												{classificationLabels[c] || c}
											</Badge>
										))}
									</div>
								)}
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() =>
									toggleActiveMutation.mutate(!client.isActive)
								}
								className="rounded-xl"
								disabled={toggleActiveMutation.isPending}
							>
								{client.isActive ? (
									<>
										<XCircle className="h-4 w-4 me-2" />
										{t("finance.clients.deactivate")}
									</>
								) : (
									<>
										<CheckCircle className="h-4 w-4 me-2" />
										{t("finance.clients.activate")}
									</>
								)}
							</Button>
							<Button
								onClick={() =>
									router.push(
										`/app/${organizationSlug}/finance/clients/${clientId}/edit`,
									)
								}
								className="rounded-xl"
							>
								<Pencil className="h-4 w-4 me-2" />
								{t("common.edit")}
							</Button>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="error" className="rounded-xl">
										<Trash2 className="h-4 w-4 me-2" />
										{t("common.delete")}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent className="rounded-2xl">
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t("finance.clients.deleteTitle")}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t("finance.clients.deleteDescription")}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel className="rounded-xl">
											{t("common.cancel")}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => deleteMutation.mutate()}
											className="rounded-xl bg-red-600 hover:bg-red-700"
											disabled={deleteMutation.isPending}
										>
											{deleteMutation.isPending
												? t("common.deleting")
												: t("common.delete")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* معلومات الاتصال */}
				<Card className="rounded-2xl">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Phone className="h-5 w-5 text-primary" />
							{t("finance.clients.sections.contactInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{client.phone && (
							<div className="flex items-center gap-3">
								<Phone className="h-4 w-4 text-slate-400" />
								<span dir="ltr">{client.phone}</span>
							</div>
						)}
						{client.mobile && (
							<div className="flex items-center gap-3">
								<Smartphone className="h-4 w-4 text-slate-400" />
								<span dir="ltr">{client.mobile}</span>
							</div>
						)}
						{client.email && (
							<div className="flex items-center gap-3">
								<Mail className="h-4 w-4 text-slate-400" />
								<a
									href={`mailto:${client.email}`}
									className="text-primary hover:underline"
									dir="ltr"
								>
									{client.email}
								</a>
							</div>
						)}
						{!client.phone && !client.mobile && !client.email && (
							<p className="text-slate-400">
								{t("finance.clients.noContactInfo")}
							</p>
						)}
					</CardContent>
				</Card>

				{/* العنوان */}
				<Card className="rounded-2xl">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-lg">
							<MapPin className="h-5 w-5 text-primary" />
							{t("finance.clients.sections.address")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{client.streetAddress1 || client.city || client.region ? (
							<>
								{client.streetAddress1 && <p>{client.streetAddress1}</p>}
								{client.streetAddress2 && <p>{client.streetAddress2}</p>}
								{(client.city || client.region) && (
									<p>
										{[client.city, client.region].filter(Boolean).join("، ")}
									</p>
								)}
								{client.postalCode && (
									<p>
										{t("finance.clients.postalCode")}: {client.postalCode}
									</p>
								)}
								{client.country && (
									<p>{countryNames[client.country] || client.country}</p>
								)}
							</>
						) : (
							<p className="text-slate-400">
								{t("finance.clients.noAddress")}
							</p>
						)}

						{/* العنوان الثانوي */}
						{secondaryAddress &&
							(secondaryAddress.streetAddress1 || secondaryAddress.city) && (
								<div className="mt-4 pt-4 border-t">
									<h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
										{t("finance.clients.secondaryAddress")}
									</h4>
									{secondaryAddress.streetAddress1 && (
										<p>{secondaryAddress.streetAddress1}</p>
									)}
									{secondaryAddress.streetAddress2 && (
										<p>{secondaryAddress.streetAddress2}</p>
									)}
									{(secondaryAddress.city || secondaryAddress.region) && (
										<p>
											{[secondaryAddress.city, secondaryAddress.region]
												.filter(Boolean)
												.join("، ")}
										</p>
									)}
									{secondaryAddress.postalCode && (
										<p>
											{t("finance.clients.postalCode")}:{" "}
											{secondaryAddress.postalCode}
										</p>
									)}
									{secondaryAddress.country && (
										<p>
											{countryNames[secondaryAddress.country] ||
												secondaryAddress.country}
										</p>
									)}
								</div>
							)}
					</CardContent>
				</Card>

				{/* المعلومات الضريبية */}
				<Card className="rounded-2xl">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Receipt className="h-5 w-5 text-primary" />
							{t("finance.clients.sections.taxInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{client.taxNumber && (
							<div>
								<span className="text-sm text-slate-500">
									{t("finance.clients.taxNumber")}
								</span>
								<p className="font-medium" dir="ltr">
									{client.taxNumber}
								</p>
							</div>
						)}
						{client.crNumber && (
							<div>
								<span className="text-sm text-slate-500">
									{t("finance.clients.crNumber")}
								</span>
								<p className="font-medium" dir="ltr">
									{client.crNumber}
								</p>
							</div>
						)}
						{!client.taxNumber && !client.crNumber && (
							<p className="text-slate-400">
								{t("finance.clients.noTaxInfo")}
							</p>
						)}
					</CardContent>
				</Card>

				{/* بيانات الحساب */}
				<Card className="rounded-2xl">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-lg">
							<CreditCard className="h-5 w-5 text-primary" />
							{t("finance.clients.sections.accountData")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="text-sm text-slate-500">
									{t("finance.clients.currency")}
								</span>
								<p className="font-medium">{client.currency}</p>
							</div>
							<div>
								<span className="text-sm text-slate-500">
									{t("finance.clients.displayLanguage")}
								</span>
								<p className="font-medium">
									{client.displayLanguage === "ar" ? "العربية" : "English"}
								</p>
							</div>
						</div>
						<div className="pt-2 border-t">
							<span className="text-sm text-slate-500">
								{t("finance.clients.statistics")}
							</span>
							<div className="grid grid-cols-2 gap-4 mt-2">
								<div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
									<p className="text-2xl font-semibold text-primary">
										{client._count?.quotations || 0}
									</p>
									<p className="text-sm text-slate-500">
										{t("finance.clients.quotationsCount")}
									</p>
								</div>
								<div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
									<p className="text-2xl font-semibold text-primary">
										{client._count?.invoices || 0}
									</p>
									<p className="text-sm text-slate-500">
										{t("finance.clients.invoicesCount")}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* جهات الاتصال */}
			<Card className="rounded-2xl">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Users2 className="h-5 w-5 text-primary" />
						{t("finance.clients.sections.contacts")}
						{client.contacts && client.contacts.length > 0 && (
							<Badge variant="secondary" className="rounded-lg">
								{client.contacts.length}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{client.contacts && client.contacts.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{client.contacts.map((contact: any) => (
								<div
									key={contact.id}
									className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-800/50"
								>
									<div className="flex items-start justify-between mb-2">
										<div>
											<h4 className="font-medium">{contact.name}</h4>
											{contact.position && (
												<p className="text-sm text-slate-500">
													{contact.position}
												</p>
											)}
										</div>
										{contact.isPrimary && (
											<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
										)}
									</div>
									<div className="space-y-1">
										{contact.phone && (
											<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
												<Phone className="h-3 w-3" />
												<span dir="ltr">{contact.phone}</span>
											</div>
										)}
										{contact.mobile && (
											<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
												<Smartphone className="h-3 w-3" />
												<span dir="ltr">{contact.mobile}</span>
											</div>
										)}
										{contact.email && (
											<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
												<Mail className="h-3 w-3" />
												<span dir="ltr">{contact.email}</span>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-slate-500">
							<Users2 className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
							<p>{t("finance.clients.contacts.noContacts")}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* الملاحظات */}
			{client.notes && (
				<Card className="rounded-2xl">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-lg">
							<FileText className="h-5 w-5 text-primary" />
							{t("finance.clients.notes")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
							{client.notes}
						</p>
					</CardContent>
				</Card>
			)}

			{/* معلومات إضافية */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex flex-wrap gap-4 text-sm text-slate-500">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							{t("finance.clients.createdAt")}:{" "}
							{formatDateArabic(client.createdAt)}
						</div>
						{client.createdBy && (
							<div className="flex items-center gap-2">
								<User className="h-4 w-4" />
								{t("finance.clients.createdBy")}: {client.createdBy.name}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
