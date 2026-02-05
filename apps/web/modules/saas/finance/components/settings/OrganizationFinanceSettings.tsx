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
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@ui/components/dialog";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Switch } from "@ui/components/switch";
import { toast } from "sonner";
import {
	Building2,
	CreditCard,
	FileText,
	Settings,
	Save,
	Loader2,
	Plus,
	Building,
	Wallet,
	Star,
	MoreVertical,
	Pencil,
	Trash2,
	Eye,
	Banknote,
	Receipt,
	Shield,
	Globe,
	Phone,
	Mail,
	MapPin,
	Hash,
	Landmark,
	CircleDollarSign,
	Percent,
	Calendar,
	FileCheck,
	Truck,
	ShieldCheck,
	Type,
	MessageSquare,
	CheckCircle2,
	ArrowLeftRight,
} from "lucide-react";
import { Currency } from "../shared/Currency";

interface OrganizationFinanceSettingsProps {
	organizationId: string;
	organizationSlug: string;
}

interface QuickBankFormData {
	name: string;
	accountType: "BANK" | "CASH_BOX";
	bankName: string;
	accountNumber: string;
	iban: string;
	balance: number;
}

const emptyQuickFormData: QuickBankFormData = {
	name: "",
	accountType: "BANK",
	bankName: "",
	accountNumber: "",
	iban: "",
	balance: 0,
};

const CURRENCIES = [
	{ value: "SAR", label: "SAR", labelAr: "ريال سعودي" },
	{ value: "USD", label: "USD", labelAr: "دولار أمريكي" },
	{ value: "EUR", label: "EUR", labelAr: "يورو" },
	{ value: "AED", label: "AED", labelAr: "درهم إماراتي" },
	{ value: "KWD", label: "KWD", labelAr: "دينار كويتي" },
	{ value: "QAR", label: "QAR", labelAr: "ريال قطري" },
	{ value: "BHD", label: "BHD", labelAr: "دينار بحريني" },
	{ value: "OMR", label: "OMR", labelAr: "ريال عماني" },
	{ value: "EGP", label: "EGP", labelAr: "جنيه مصري" },
	{ value: "GBP", label: "GBP", labelAr: "جنيه إسترليني" },
];

export function OrganizationFinanceSettings({
	organizationId,
	organizationSlug,
}: OrganizationFinanceSettingsProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("company");

	// Fetch settings
	const { data: settings, isLoading: settingsLoading } = useQuery(
		orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch bank accounts
	const { data: banksData, isLoading: banksLoading } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: {
				organizationId,
				isActive: true,
			},
		}),
	);

	// Fetch balances summary
	const { data: summaryData } = useQuery(
		orpc.finance.banks.getSummary.queryOptions({
			input: { organizationId },
		}),
	);

	const accounts = banksData?.accounts ?? [];

	// Form state
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [hasChanges, setHasChanges] = useState(false);

	// Bank dialog states
	const [quickDialogOpen, setQuickDialogOpen] = useState(false);
	const [editAccountId, setEditAccountId] = useState<string | null>(null);
	const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
	const [quickFormData, setQuickFormData] = useState<QuickBankFormData>(emptyQuickFormData);

	// Initialize form data when settings load
	const currentSettings = settings || {};
	const getFieldValue = (field: string) => {
		return formData[field] ?? (currentSettings as any)[field] ?? "";
	};

	// Track changes
	useEffect(() => {
		setHasChanges(Object.keys(formData).length > 0);
	}, [formData]);

	// Update settings mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.settings.update({
				organizationId,
				...formData,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.settings.updateSuccess"));
			setFormData({});
			setHasChanges(false);
			queryClient.invalidateQueries({
				queryKey: ["finance", "settings"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.settings.updateError"));
		},
	});

	// Bank mutations
	const createBankMutation = useMutation({
		mutationFn: async () => {
			if (!quickFormData.name) {
				throw new Error(t("finance.banks.errors.nameRequired"));
			}

			return orpcClient.finance.banks.create({
				organizationId,
				name: quickFormData.name,
				accountType: quickFormData.accountType,
				bankName: quickFormData.bankName || undefined,
				accountNumber: quickFormData.accountNumber || undefined,
				iban: quickFormData.iban || undefined,
				balance: quickFormData.balance,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.createSuccess"));
			setQuickDialogOpen(false);
			resetQuickForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "banks"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.createError"));
		},
	});

	const updateBankMutation = useMutation({
		mutationFn: async () => {
			if (!editAccountId || !quickFormData.name) {
				throw new Error(t("finance.banks.errors.nameRequired"));
			}

			return orpcClient.finance.banks.update({
				organizationId,
				id: editAccountId,
				name: quickFormData.name,
				accountType: quickFormData.accountType,
				bankName: quickFormData.bankName || undefined,
				accountNumber: quickFormData.accountNumber || undefined,
				iban: quickFormData.iban || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.updateSuccess"));
			setQuickDialogOpen(false);
			setEditAccountId(null);
			resetQuickForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "banks"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.updateError"));
		},
	});

	const deleteBankMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.banks.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.deleteSuccess"));
			setDeleteAccountId(null);
			queryClient.invalidateQueries({
				queryKey: ["finance", "banks"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.deleteError"));
		},
	});

	const setDefaultMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.banks.setDefault({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.setDefaultSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "banks"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.setDefaultError"));
		},
	});

	const handleFieldChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = () => {
		updateMutation.mutate();
	};

	const resetQuickForm = () => {
		setQuickFormData(emptyQuickFormData);
	};

	const handleOpenEditDialog = (account: any) => {
		setEditAccountId(account.id);
		setQuickFormData({
			name: account.name,
			accountType: account.accountType,
			bankName: account.bankName || "",
			accountNumber: account.accountNumber || "",
			iban: account.iban || "",
			balance: Number(account.balance) || 0,
		});
		setQuickDialogOpen(true);
	};

	const handleBankSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editAccountId) {
			updateBankMutation.mutate();
		} else {
			createBankMutation.mutate();
		}
	};

	const handleCloseDialog = () => {
		setQuickDialogOpen(false);
		setEditAccountId(null);
		resetQuickForm();
	};

	if (settingsLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 right-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6" dir="rtl">
			{/* Save Button (shown when there are changes) */}
			{hasChanges && (
				<div className="flex justify-end">
					<Button
						onClick={handleSave}
						disabled={updateMutation.isPending}
						className="rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
					>
						{updateMutation.isPending ? (
							<>
								<Loader2 className="h-4 w-4 ms-2 animate-spin" />
								{t("common.saving")}
							</>
						) : (
							<>
								<Save className="h-4 w-4 ms-2" />
								{t("common.saveChanges")}
							</>
						)}
					</Button>
				</div>
			)}

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
				<TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl flex-wrap h-auto gap-1 justify-start">
					<TabsTrigger
						value="company"
						className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
					>
						<Building2 className="h-4 w-4 ms-2" />
						{t("finance.settings.tabs.company")}
					</TabsTrigger>
					<TabsTrigger
						value="banks"
						className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
					>
						<Landmark className="h-4 w-4 ms-2" />
						{t("finance.settings.tabs.banks")}
					</TabsTrigger>
					<TabsTrigger
						value="tax"
						className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
					>
						<Receipt className="h-4 w-4 ms-2" />
						{t("finance.settings.tabs.taxCurrency")}
					</TabsTrigger>
					<TabsTrigger
						value="terms"
						className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
					>
						<FileCheck className="h-4 w-4 ms-2" />
						{t("finance.settings.tabs.terms")}
					</TabsTrigger>
					<TabsTrigger
						value="print"
						className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
					>
						<FileText className="h-4 w-4 ms-2" />
						{t("finance.settings.tabs.print")}
					</TabsTrigger>
				</TabsList>

				{/* Company Info Tab */}
				<TabsContent value="company" className="space-y-6 mt-6">
					{/* Company Basic Info */}
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
									<Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<CardTitle className="text-lg text-start">{t("finance.settings.companyInfo")}</CardTitle>
									<CardDescription className="text-start">{t("finance.settings.companyInfoDescription")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Type className="h-4 w-4 text-slate-400" />
										{t("finance.settings.companyNameAr")}
									</Label>
									<Input
										value={getFieldValue("companyNameAr")}
										onChange={(e) => handleFieldChange("companyNameAr", e.target.value)}
										placeholder={t("finance.settings.companyNameArPlaceholder")}
										className="rounded-xl text-start"
										dir="rtl"
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Type className="h-4 w-4 text-slate-400" />
										{t("finance.settings.companyNameEn")}
									</Label>
									<Input
										value={getFieldValue("companyNameEn")}
										onChange={(e) => handleFieldChange("companyNameEn", e.target.value)}
										placeholder={t("finance.settings.companyNameEnPlaceholder")}
										className="rounded-xl text-left"
										dir="ltr"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Hash className="h-4 w-4 text-slate-400" />
										{t("finance.settings.taxNumber")}
									</Label>
									<Input
										value={getFieldValue("taxNumber")}
										onChange={(e) => handleFieldChange("taxNumber", e.target.value)}
										placeholder={t("finance.settings.taxNumberPlaceholder")}
										className="rounded-xl font-mono text-left"
										dir="ltr"
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Shield className="h-4 w-4 text-slate-400" />
										{t("finance.settings.commercialReg")}
									</Label>
									<Input
										value={getFieldValue("commercialReg")}
										onChange={(e) => handleFieldChange("commercialReg", e.target.value)}
										placeholder={t("finance.settings.commercialRegPlaceholder")}
										className="rounded-xl font-mono text-left"
										dir="ltr"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Contact Info */}
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
									<Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<CardTitle className="text-lg text-start">{t("finance.settings.contactInfo")}</CardTitle>
									<CardDescription className="text-start">{t("finance.settings.contactInfoDescription")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Phone className="h-4 w-4 text-slate-400" />
										{t("finance.settings.phone")}
									</Label>
									<Input
										value={getFieldValue("phone")}
										onChange={(e) => handleFieldChange("phone", e.target.value)}
										placeholder={t("finance.settings.phonePlaceholder")}
										className="rounded-xl text-left"
										dir="ltr"
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Mail className="h-4 w-4 text-slate-400" />
										{t("finance.settings.email")}
									</Label>
									<Input
										type="email"
										value={getFieldValue("email")}
										onChange={(e) => handleFieldChange("email", e.target.value)}
										placeholder={t("finance.settings.emailPlaceholder")}
										className="rounded-xl text-left"
										dir="ltr"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<Globe className="h-4 w-4 text-slate-400" />
									{t("finance.settings.website")}
								</Label>
								<Input
									value={getFieldValue("website")}
									onChange={(e) => handleFieldChange("website", e.target.value)}
									placeholder={t("finance.settings.websitePlaceholder")}
									className="rounded-xl text-left"
									dir="ltr"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<MapPin className="h-4 w-4 text-slate-400" />
										{t("finance.settings.address")}
									</Label>
									<Textarea
										value={getFieldValue("address")}
										onChange={(e) => handleFieldChange("address", e.target.value)}
										placeholder={t("finance.settings.addressPlaceholder")}
										className="rounded-xl resize-none text-start"
										rows={3}
										dir="rtl"
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<MapPin className="h-4 w-4 text-slate-400" />
										{t("finance.settings.addressEn")}
									</Label>
									<Textarea
										value={getFieldValue("addressEn")}
										onChange={(e) => handleFieldChange("addressEn", e.target.value)}
										placeholder={t("finance.settings.addressEnPlaceholder")}
										className="rounded-xl resize-none text-left"
										rows={3}
										dir="ltr"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Logo */}
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
									<Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<CardTitle className="text-lg text-start">{t("finance.settings.logoSection")}</CardTitle>
									<CardDescription className="text-start">{t("finance.settings.logoSectionDescription")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col sm:flex-row items-start gap-4">
								{getFieldValue("logo") && (
									<div className="shrink-0">
										<img
											src={getFieldValue("logo")}
											alt="Logo"
											className="h-20 w-auto rounded-xl border border-slate-200 dark:border-slate-700 object-contain bg-white"
										/>
									</div>
								)}
								<div className="flex-1 space-y-2 w-full">
									<Label className="text-slate-700 dark:text-slate-300">
										{t("finance.settings.logo")}
									</Label>
									<Input
										value={getFieldValue("logo")}
										onChange={(e) => handleFieldChange("logo", e.target.value)}
										placeholder={t("finance.settings.logoPlaceholder")}
										className="rounded-xl text-left"
										dir="ltr"
									/>
									<p className="text-xs text-slate-500 text-start">
										{t("finance.settings.logoHint")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Banks Tab */}
				<TabsContent value="banks" className="space-y-6 mt-6">
					{/* Summary Cards */}
					<div className="grid gap-4 sm:grid-cols-3">
						<Card className="rounded-2xl border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900">
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
										<Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<div className="text-start">
										<p className="text-sm text-blue-600/80 dark:text-blue-400/80">
											{t("finance.banks.totalBankBalance")}
										</p>
										<p className="text-xl font-bold text-blue-700 dark:text-blue-300">
											<Currency amount={summaryData?.totalBankBalance ?? 0} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
						<Card className="rounded-2xl border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-900">
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2.5 bg-green-100 dark:bg-green-900/50 rounded-xl">
										<Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
									</div>
									<div className="text-start">
										<p className="text-sm text-green-600/80 dark:text-green-400/80">
											{t("finance.banks.totalCashBalance")}
										</p>
										<p className="text-xl font-bold text-green-700 dark:text-green-300">
											<Currency amount={summaryData?.totalCashBalance ?? 0} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
						<Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-slate-900">
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2.5 bg-primary/10 rounded-xl">
										<Banknote className="h-5 w-5 text-primary" />
									</div>
									<div className="text-start">
										<p className="text-sm text-primary/80">
											{t("finance.banks.totalBalance")}
										</p>
										<p className="text-xl font-bold text-primary">
											<Currency amount={summaryData?.totalBalance ?? 0} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Bank Accounts Card */}
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
										<Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
									</div>
									<div className="text-start">
										<CardTitle className="text-lg">{t("finance.banks.title")}</CardTitle>
										<CardDescription>{t("finance.banks.description")}</CardDescription>
									</div>
								</div>
								<div className="flex gap-2 flex-row-reverse sm:flex-row">
									<Button
										onClick={() => {
											resetQuickForm();
											setEditAccountId(null);
											setQuickDialogOpen(true);
										}}
										className="rounded-xl"
									>
										<Plus className="h-4 w-4 ms-2" />
										{t("finance.banks.addAccount")}
									</Button>
									<Button
										variant="outline"
										onClick={() => router.push(`/app/${organizationSlug}/finance/expenses/transfer`)}
										className="rounded-xl"
									>
										<ArrowLeftRight className="h-4 w-4 ms-2" />
										{t("finance.banks.transfer")}
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{banksLoading ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : accounts.length === 0 ? (
								<div className="text-center py-12 px-4">
									<div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
										<Building className="h-8 w-8 text-slate-400" />
									</div>
									<p className="text-slate-500 dark:text-slate-400 mb-4">
										{t("finance.banks.noAccounts")}
									</p>
									<Button
										onClick={() => {
											resetQuickForm();
											setQuickDialogOpen(true);
										}}
										className="rounded-xl"
									>
										<Plus className="h-4 w-4 ms-2" />
										{t("finance.banks.addAccount")}
									</Button>
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="hover:bg-transparent">
												<TableHead className="text-start">{t("finance.banks.accountName")}</TableHead>
												<TableHead className="text-start">{t("finance.banks.accountType")}</TableHead>
												<TableHead className="text-start">{t("finance.banks.bankName")}</TableHead>
												<TableHead className="text-start">{t("finance.banks.accountNumber")}</TableHead>
												<TableHead className="text-start">{t("finance.banks.balance")}</TableHead>
												<TableHead className="w-[50px]" />
											</TableRow>
										</TableHeader>
										<TableBody>
											{accounts.map((account) => (
												<TableRow
													key={account.id}
													className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
												>
													<TableCell className="text-start">
														<div className="flex items-center gap-3">
															<div className={`p-1.5 rounded-lg ${
																account.accountType === "BANK"
																	? "bg-blue-100 dark:bg-blue-900/50"
																	: "bg-green-100 dark:bg-green-900/50"
															}`}>
																{account.accountType === "BANK" ? (
																	<Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
																) : (
																	<Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
																)}
															</div>
															<div>
																<div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
																	{account.name}
																	{account.isDefault && (
																		<Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
																	)}
																</div>
															</div>
														</div>
													</TableCell>
													<TableCell className="text-start">
														<Badge
															variant={account.accountType === "BANK" ? "secondary" : "outline"}
															className="rounded-lg"
														>
															{account.accountType === "BANK"
																? t("finance.banks.types.bank")
																: t("finance.banks.types.cashBox")}
														</Badge>
													</TableCell>
													<TableCell className="text-start">
														{account.bankName || <span className="text-slate-400">-</span>}
													</TableCell>
													<TableCell className="text-start">
														{account.accountNumber ? (
															<span className="font-mono text-sm">{account.accountNumber}</span>
														) : (
															<span className="text-slate-400">-</span>
														)}
													</TableCell>
													<TableCell className="text-start">
														<span className={`font-semibold ${
															Number(account.balance) >= 0
																? "text-green-600 dark:text-green-400"
																: "text-red-600 dark:text-red-400"
														}`}>
															<Currency amount={Number(account.balance)} />
														</span>
													</TableCell>
													<TableCell onClick={(e) => e.stopPropagation()}>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
																	<MoreVertical className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="start" className="rounded-xl">
																<DropdownMenuItem onClick={() => handleOpenEditDialog(account)}>
																	<Pencil className="h-4 w-4 ms-2" />
																	{t("common.edit")}
																</DropdownMenuItem>
																{!account.isDefault && (
																	<DropdownMenuItem onClick={() => setDefaultMutation.mutate(account.id)}>
																		<Star className="h-4 w-4 ms-2" />
																		{t("finance.banks.setAsDefault")}
																	</DropdownMenuItem>
																)}
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() => setDeleteAccountId(account.id)}
																	className="text-red-600"
																>
																	<Trash2 className="h-4 w-4 ms-2" />
																	{t("common.delete")}
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Default Bank for Documents */}
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
									<CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
								</div>
								<div className="text-start">
									<CardTitle className="text-lg">{t("finance.settings.bankDetails")}</CardTitle>
									<CardDescription>{t("finance.settings.bankDetailsDescription")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Building className="h-4 w-4 text-slate-400" />
										{t("finance.settings.bankName")}
									</Label>
									<Input
										value={getFieldValue("bankName")}
										onChange={(e) => handleFieldChange("bankName", e.target.value)}
										placeholder={t("finance.settings.bankNamePlaceholder")}
										className="rounded-xl text-start"
										dir="rtl"
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Building className="h-4 w-4 text-slate-400" />
										{t("finance.settings.bankNameEn")}
									</Label>
									<Input
										value={getFieldValue("bankNameEn")}
										onChange={(e) => handleFieldChange("bankNameEn", e.target.value)}
										placeholder={t("finance.settings.bankNameEnPlaceholder")}
										className="rounded-xl text-left"
										dir="ltr"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<Type className="h-4 w-4 text-slate-400" />
									{t("finance.settings.accountName")}
								</Label>
								<Input
									value={getFieldValue("accountName")}
									onChange={(e) => handleFieldChange("accountName", e.target.value)}
									placeholder={t("finance.settings.accountNamePlaceholder")}
									className="rounded-xl text-start"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Hash className="h-4 w-4 text-slate-400" />
										{t("finance.settings.iban")}
									</Label>
									<Input
										value={getFieldValue("iban")}
										onChange={(e) => handleFieldChange("iban", e.target.value)}
										placeholder={t("finance.settings.ibanPlaceholder")}
										className="rounded-xl font-mono text-left"
										dir="ltr"
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Hash className="h-4 w-4 text-slate-400" />
										{t("finance.settings.accountNumber")}
									</Label>
									<Input
										value={getFieldValue("accountNumber")}
										onChange={(e) => handleFieldChange("accountNumber", e.target.value)}
										placeholder={t("finance.settings.accountNumberPlaceholder")}
										className="rounded-xl font-mono text-left"
										dir="ltr"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<Globe className="h-4 w-4 text-slate-400" />
									{t("finance.settings.swiftCode")}
								</Label>
								<Input
									value={getFieldValue("swiftCode")}
									onChange={(e) => handleFieldChange("swiftCode", e.target.value)}
									placeholder={t("finance.settings.swiftCodePlaceholder")}
									className="rounded-xl font-mono max-w-xs text-left"
									dir="ltr"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tax & Currency Tab */}
				<TabsContent value="tax" className="space-y-6 mt-6">
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
									<Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
								</div>
								<div className="text-start">
									<CardTitle className="text-lg">{t("finance.settings.taxAndCurrency")}</CardTitle>
									<CardDescription>{t("finance.settings.taxAndCurrencyDescription")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<Percent className="h-4 w-4 text-slate-400" />
										{t("finance.settings.defaultVatPercent")}
									</Label>
									<div className="relative max-w-xs">
										<Input
											type="number"
											min="0"
											max="100"
											step="0.5"
											value={getFieldValue("defaultVatPercent") || 15}
											onChange={(e) => handleFieldChange("defaultVatPercent", parseFloat(e.target.value))}
											className="rounded-xl ps-10"
											dir="ltr"
										/>
										<span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
									</div>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
										<CircleDollarSign className="h-4 w-4 text-slate-400" />
										{t("finance.settings.defaultCurrency")}
									</Label>
									<Select
										value={getFieldValue("defaultCurrency") || "SAR"}
										onValueChange={(value) => handleFieldChange("defaultCurrency", value)}
									>
										<SelectTrigger className="rounded-xl max-w-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="rounded-xl">
											{CURRENCIES.map((currency) => (
												<SelectItem key={currency.value} value={currency.value}>
													{currency.label} - {currency.labelAr}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<Calendar className="h-4 w-4 text-slate-400" />
									{t("finance.settings.quotationValidityDays")}
								</Label>
								<div className="flex items-center gap-2 max-w-xs">
									<Input
										type="number"
										min="1"
										max="365"
										value={getFieldValue("quotationValidityDays") || 30}
										onChange={(e) => handleFieldChange("quotationValidityDays", parseInt(e.target.value))}
										className="rounded-xl"
										dir="ltr"
									/>
									<span className="text-sm text-slate-500">{t("common.days")}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Terms Tab */}
				<TabsContent value="terms" className="space-y-6 mt-6">
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
									<FileCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
								</div>
								<div className="text-start">
									<CardTitle className="text-lg">{t("finance.settings.defaultTerms")}</CardTitle>
									<CardDescription>{t("finance.settings.defaultTermsDescription")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<CreditCard className="h-4 w-4 text-slate-400" />
									{t("finance.settings.defaultPaymentTerms")}
								</Label>
								<Textarea
									value={getFieldValue("defaultPaymentTerms")}
									onChange={(e) => handleFieldChange("defaultPaymentTerms", e.target.value)}
									placeholder={t("finance.settings.defaultPaymentTermsPlaceholder")}
									className="rounded-xl resize-none text-start"
									rows={3}
									dir="rtl"
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<Truck className="h-4 w-4 text-slate-400" />
									{t("finance.settings.defaultDeliveryTerms")}
								</Label>
								<Textarea
									value={getFieldValue("defaultDeliveryTerms")}
									onChange={(e) => handleFieldChange("defaultDeliveryTerms", e.target.value)}
									placeholder={t("finance.settings.defaultDeliveryTermsPlaceholder")}
									className="rounded-xl resize-none text-start"
									rows={3}
									dir="rtl"
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<ShieldCheck className="h-4 w-4 text-slate-400" />
									{t("finance.settings.defaultWarrantyTerms")}
								</Label>
								<Textarea
									value={getFieldValue("defaultWarrantyTerms")}
									onChange={(e) => handleFieldChange("defaultWarrantyTerms", e.target.value)}
									placeholder={t("finance.settings.defaultWarrantyTermsPlaceholder")}
									className="rounded-xl resize-none text-start"
									rows={3}
									dir="rtl"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Print Tab */}
				<TabsContent value="print" className="space-y-6 mt-6">
					<Card className="rounded-2xl border-slate-200 dark:border-slate-700">
						<CardHeader className="pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
									<FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
								</div>
								<div className="text-start">
									<CardTitle className="text-lg">{t("finance.settings.printSettings")}</CardTitle>
									<CardDescription>{t("finance.settings.printSettingsDescription")}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<Type className="h-4 w-4 text-slate-400" />
									{t("finance.settings.headerText")}
								</Label>
								<Input
									value={getFieldValue("headerText")}
									onChange={(e) => handleFieldChange("headerText", e.target.value)}
									placeholder={t("finance.settings.headerTextPlaceholder")}
									className="rounded-xl text-start"
									dir="rtl"
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<Type className="h-4 w-4 text-slate-400" />
									{t("finance.settings.footerText")}
								</Label>
								<Input
									value={getFieldValue("footerText")}
									onChange={(e) => handleFieldChange("footerText", e.target.value)}
									placeholder={t("finance.settings.footerTextPlaceholder")}
									className="rounded-xl text-start"
									dir="rtl"
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
									<MessageSquare className="h-4 w-4 text-slate-400" />
									{t("finance.settings.thankYouMessage")}
								</Label>
								<Input
									value={getFieldValue("thankYouMessage")}
									onChange={(e) => handleFieldChange("thankYouMessage", e.target.value)}
									placeholder={t("finance.settings.thankYouMessagePlaceholder")}
									className="rounded-xl text-start"
									dir="rtl"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Quick Add/Edit Bank Dialog */}
			<Dialog open={quickDialogOpen} onOpenChange={handleCloseDialog}>
				<DialogContent className="sm:max-w-lg rounded-2xl" dir="rtl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-start">
							{editAccountId ? (
								<>
									<Pencil className="h-5 w-5 text-primary" />
									{t("finance.banks.edit")}
								</>
							) : (
								<>
									<Plus className="h-5 w-5 text-primary" />
									{t("finance.banks.addAccount")}
								</>
							)}
						</DialogTitle>
						<DialogDescription className="text-start">
							{editAccountId
								? t("finance.banks.editDescription")
								: t("finance.banks.createSubtitle")}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleBankSubmit} className="space-y-4">
						{/* Account Type */}
						<div>
							<Label className="mb-2 block text-start">{t("finance.banks.accountType")}</Label>
							<Tabs
								value={quickFormData.accountType}
								onValueChange={(value) =>
									setQuickFormData({
										...quickFormData,
										accountType: value as "BANK" | "CASH_BOX",
									})
								}
								className="w-full"
								dir="rtl"
							>
								<TabsList className="grid w-full grid-cols-2 rounded-xl">
									<TabsTrigger value="BANK" className="rounded-xl">
										<Building className="h-4 w-4 ms-2" />
										{t("finance.banks.types.bank")}
									</TabsTrigger>
									<TabsTrigger value="CASH_BOX" className="rounded-xl">
										<Wallet className="h-4 w-4 ms-2" />
										{t("finance.banks.types.cashBox")}
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						{/* Account Name */}
						<div>
							<Label className="text-start block">{t("finance.banks.accountName")} *</Label>
							<Input
								value={quickFormData.name}
								onChange={(e) =>
									setQuickFormData({
										...quickFormData,
										name: e.target.value,
									})
								}
								placeholder={
									quickFormData.accountType === "BANK"
										? t("finance.banks.bankAccountNamePlaceholder")
										: t("finance.banks.cashBoxNamePlaceholder")
								}
								required
								className="rounded-xl mt-1 text-start"
								dir="rtl"
							/>
						</div>

						{/* Bank Fields (only for bank accounts) */}
						{quickFormData.accountType === "BANK" && (
							<>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<Label className="text-start block">{t("finance.banks.bankName")}</Label>
										<Input
											value={quickFormData.bankName}
											onChange={(e) =>
												setQuickFormData({
													...quickFormData,
													bankName: e.target.value,
												})
											}
											placeholder={t("finance.banks.bankNamePlaceholder")}
											className="rounded-xl mt-1 text-start"
											dir="rtl"
										/>
									</div>
									<div>
										<Label className="text-start block">{t("finance.banks.accountNumber")}</Label>
										<Input
											value={quickFormData.accountNumber}
											onChange={(e) =>
												setQuickFormData({
													...quickFormData,
													accountNumber: e.target.value,
												})
											}
											placeholder={t("finance.banks.accountNumberPlaceholder")}
											className="rounded-xl mt-1 text-left"
											dir="ltr"
										/>
									</div>
								</div>
								<div>
									<Label className="text-start block">{t("finance.banks.iban")}</Label>
									<Input
										value={quickFormData.iban}
										onChange={(e) =>
											setQuickFormData({
												...quickFormData,
												iban: e.target.value,
											})
										}
										placeholder={t("finance.banks.ibanPlaceholder")}
										className="rounded-xl mt-1 font-mono text-left"
										dir="ltr"
									/>
								</div>
							</>
						)}

						{/* Opening Balance (only for new accounts) */}
						{!editAccountId && (
							<div>
								<Label className="text-start block">{t("finance.banks.openingBalance")}</Label>
								<Input
									type="number"
									step="0.01"
									value={quickFormData.balance}
									onChange={(e) =>
										setQuickFormData({
											...quickFormData,
											balance: parseFloat(e.target.value) || 0,
										})
									}
									placeholder="0.00"
									className="rounded-xl mt-1 text-left"
									dir="ltr"
								/>
							</div>
						)}

						<DialogFooter className="gap-2 sm:gap-0 flex-row-reverse sm:flex-row">
							<Button
								type="submit"
								disabled={createBankMutation.isPending || updateBankMutation.isPending}
								className="rounded-xl"
							>
								{(createBankMutation.isPending || updateBankMutation.isPending) ? (
									<>
										<Loader2 className="h-4 w-4 ms-2 animate-spin" />
										{t("common.saving")}
									</>
								) : (
									<>
										<CheckCircle2 className="h-4 w-4 ms-2" />
										{editAccountId ? t("common.save") : t("finance.banks.addAccount")}
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseDialog}
								className="rounded-xl"
							>
								{t("common.cancel")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Bank Confirmation */}
			<AlertDialog
				open={!!deleteAccountId}
				onOpenChange={() => setDeleteAccountId(null)}
			>
				<AlertDialogContent className="rounded-2xl" dir="rtl">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-start">
							<Trash2 className="h-5 w-5 text-red-500" />
							{t("finance.banks.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-start">
							{t("finance.banks.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex-row-reverse sm:flex-row gap-2">
						<AlertDialogAction
							onClick={() => deleteAccountId && deleteBankMutation.mutate(deleteAccountId)}
							disabled={deleteBankMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteBankMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 ms-2 animate-spin" />
									{t("common.deleting")}
								</>
							) : (
								t("common.delete")
							)}
						</AlertDialogAction>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
