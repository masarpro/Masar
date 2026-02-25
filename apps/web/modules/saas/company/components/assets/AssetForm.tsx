"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Package, Banknote, FileText } from "lucide-react";
import { toast } from "sonner";

const ASSET_CATEGORIES = [
	"HEAVY_EQUIPMENT", "LIGHT_EQUIPMENT", "VEHICLES", "TOOLS",
	"IT_EQUIPMENT", "FURNITURE", "SAFETY_EQUIPMENT", "SURVEYING", "OTHER",
] as const;

const ASSET_TYPES = ["OWNED", "RENTED", "LEASED"] as const;

const formSchema = z.object({
	name: z.string().min(1, "اسم الأصل مطلوب"),
	assetNo: z.string().optional(),
	category: z.enum(ASSET_CATEGORIES),
	type: z.enum(ASSET_TYPES),
	brand: z.string().optional(),
	model: z.string().optional(),
	serialNumber: z.string().optional(),
	year: z.coerce.number().int().optional().or(z.literal("")),
	description: z.string().optional(),
	purchasePrice: z.coerce.number().min(0).optional().or(z.literal("")),
	monthlyRent: z.coerce.number().min(0).optional().or(z.literal("")),
	currentValue: z.coerce.number().min(0).optional().or(z.literal("")),
	purchaseDate: z.string().optional(),
	warrantyExpiry: z.string().optional(),
	insuranceExpiry: z.string().optional(),
	notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssetFormProps {
	organizationId: string;
	organizationSlug: string;
	assetId?: string;
}

export function AssetForm({ organizationId, organizationSlug, assetId }: AssetFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const isEditing = !!assetId;

	const { data: existingAsset } = useQuery({
		...orpc.company.assets.getById.queryOptions({
			input: { organizationId, id: assetId! },
		}),
		enabled: isEditing,
	});

	const toDateStr = (d: string | Date | null | undefined) => {
		if (!d) return "";
		return new Date(d).toISOString().split("T")[0];
	};

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			assetNo: "",
			category: "HEAVY_EQUIPMENT",
			type: "OWNED",
			brand: "",
			model: "",
			serialNumber: "",
			year: "",
			description: "",
			purchasePrice: "",
			monthlyRent: "",
			currentValue: "",
			purchaseDate: "",
			warrantyExpiry: "",
			insuranceExpiry: "",
			notes: "",
		},
		values: existingAsset
			? {
					name: existingAsset.name,
					assetNo: existingAsset.assetNo ?? "",
					category: existingAsset.category as typeof ASSET_CATEGORIES[number],
					type: existingAsset.type as typeof ASSET_TYPES[number],
					brand: existingAsset.brand ?? "",
					model: existingAsset.model ?? "",
					serialNumber: existingAsset.serialNumber ?? "",
					year: existingAsset.year ?? "",
					description: existingAsset.description ?? "",
					purchasePrice: existingAsset.purchasePrice ? Number(existingAsset.purchasePrice) : "",
					monthlyRent: existingAsset.monthlyRent ? Number(existingAsset.monthlyRent) : "",
					currentValue: existingAsset.currentValue ? Number(existingAsset.currentValue) : "",
					purchaseDate: toDateStr(existingAsset.purchaseDate),
					warrantyExpiry: toDateStr(existingAsset.warrantyExpiry),
					insuranceExpiry: toDateStr(existingAsset.insuranceExpiry),
					notes: existingAsset.notes ?? "",
				}
			: undefined,
	});

	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.company.assets.create({
				organizationId,
				name: data.name,
				assetNo: data.assetNo || undefined,
				category: data.category,
				type: data.type,
				brand: data.brand || undefined,
				model: data.model || undefined,
				serialNumber: data.serialNumber || undefined,
				year: data.year ? Number(data.year) : undefined,
				description: data.description || undefined,
				purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
				monthlyRent: data.monthlyRent ? Number(data.monthlyRent) : undefined,
				currentValue: data.currentValue ? Number(data.currentValue) : undefined,
				purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
				warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
				insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
				notes: data.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("company.assets.createSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.assets.list.queryOptions({ input: { organizationId } }).queryKey });
			router.push(`/app/${organizationSlug}/company/assets`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.assets.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.company.assets.update({
				organizationId,
				id: assetId!,
				name: data.name,
				assetNo: data.assetNo || undefined,
				category: data.category,
				type: data.type,
				brand: data.brand || null,
				model: data.model || null,
				serialNumber: data.serialNumber || null,
				year: data.year ? Number(data.year) : null,
				description: data.description || null,
				purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : null,
				monthlyRent: data.monthlyRent ? Number(data.monthlyRent) : null,
				currentValue: data.currentValue ? Number(data.currentValue) : null,
				purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
				warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
				insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
				notes: data.notes || null,
			});
		},
		onSuccess: () => {
			toast.success(t("company.assets.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.assets.list.queryOptions({ input: { organizationId } }).queryKey });
			router.push(`/app/${organizationSlug}/company/assets/${assetId}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.assets.updateError"));
		},
	});

	const onSubmit = (data: FormValues) => {
		if (isEditing) updateMutation.mutate(data);
		else createMutation.mutate(data);
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
				{/* Basic Info */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.assets.basicInfo")}
						</h3>
					</div>
					<div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<FormField control={form.control} name="name" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.name")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="assetNo" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.assetNo")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="category" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.category")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
									<SelectContent className="rounded-xl">
										{ASSET_CATEGORIES.map((cat) => (
											<SelectItem key={cat} value={cat}>{t(`company.assets.categories.${cat}`)}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="type" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.type")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
									<SelectContent className="rounded-xl">
										{ASSET_TYPES.map((t2) => (
											<SelectItem key={t2} value={t2}>{t(`company.assets.types.${t2}`)}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="brand" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.brand")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="model" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.model")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="serialNumber" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.serialNumber")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="year" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.year")}</FormLabel>
								<FormControl><Input type="number" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
					</div>
				</div>

				{/* Financial Info */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.assets.financialInfo")}
						</h3>
					</div>
					<div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<FormField control={form.control} name="purchasePrice" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.purchasePrice")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="monthlyRent" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.monthlyRent")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="currentValue" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.currentValue")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="purchaseDate" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.purchaseDate")}</FormLabel>
								<FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="warrantyExpiry" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.warrantyExpiry")}</FormLabel>
								<FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="insuranceExpiry" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.insuranceExpiry")}</FormLabel>
								<FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
					</div>
				</div>

				{/* Notes */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
							<FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.common.notes")}
						</h3>
					</div>
					<div className="p-5 space-y-4">
						<FormField control={form.control} name="description" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.assets.description")}</FormLabel>
								<FormControl><Textarea rows={2} className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="notes" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.common.notes")}</FormLabel>
								<FormControl><Textarea rows={2} className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
					</div>
				</div>

				<div className="flex gap-3">
					<Button
						type="submit"
						disabled={isPending}
						className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
					>
						{isPending ? t("company.common.saving") : isEditing ? t("company.common.update") : t("company.common.create")}
					</Button>
					<Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>
						{t("company.common.cancel")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
