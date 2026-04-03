"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
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
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { toast } from "sonner";
import {
	MoreVertical,
	Pencil,
	Trash2,
	FileText,
	Star,
	Receipt,
	FileSignature,
	Palette,
	Sparkles,
} from "lucide-react";
import { cn } from "@ui/lib";
import { Badge } from "@ui/components/badge";
import Link from "next/link";
import { formatDate } from "@saas/finance/lib/utils";
import {
	getAllPresetTemplates,
	type DefaultTemplateConfig,
} from "../../lib/default-templates";
import { TemplateThumbnail } from "./TemplateThumbnail";
import type { OrganizationData } from "./renderer/TemplateRenderer";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface TemplatesListProps {
	organizationId: string;
	organizationSlug: string;
}

const templateTypeIcons: Record<string, React.ReactNode> = {
	QUOTATION: <FileSignature className="h-4 w-4" />,
	INVOICE: <Receipt className="h-4 w-4" />,
	LETTER: <FileText className="h-4 w-4" />,
};

export function TemplatesList({
	organizationId,
	organizationSlug,
}: TemplatesListProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [filterType, setFilterType] = useState<"ALL" | "QUOTATION" | "INVOICE">("ALL");
	const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

	// Fetch organization finance settings for thumbnails
	const { data: orgSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});

	const organizationData: OrganizationData = {
		name: orgSettings?.companyNameAr ?? "",
		nameAr: orgSettings?.companyNameAr ?? undefined,
		nameEn: orgSettings?.companyNameEn ?? undefined,
		logo: orgSettings?.logo ?? undefined,
		address: orgSettings?.address ?? undefined,
		addressAr: orgSettings?.address ?? undefined,
		addressEn: orgSettings?.addressEn ?? undefined,
		phone: orgSettings?.phone ?? undefined,
		email: orgSettings?.email ?? undefined,
		website: orgSettings?.website ?? undefined,
		taxNumber: orgSettings?.taxNumber ?? undefined,
		commercialReg: orgSettings?.commercialReg ?? undefined,
		bankName: orgSettings?.bankName ?? undefined,
		bankNameEn: orgSettings?.bankNameEn ?? undefined,
		accountName: orgSettings?.accountName ?? undefined,
		iban: orgSettings?.iban ?? undefined,
		accountNumber: orgSettings?.accountNumber ?? undefined,
		swiftCode: orgSettings?.swiftCode ?? undefined,
		headerText: orgSettings?.headerText ?? undefined,
		footerText: orgSettings?.footerText ?? undefined,
		thankYouMessage: undefined,
	};

	// Fetch user's custom templates
	const { data, isLoading } = useQuery({
		...orpc.company.templates.list.queryOptions({
			input: {
				organizationId,
				templateType: filterType === "ALL" ? undefined : filterType,
			},
		}),
		staleTime: STALE_TIMES.TEMPLATES,
	});

	const templates = data?.templates ?? [];

	// Show all templates (including defaults)
	const customTemplates = templates;

	// Set default mutation
	const setDefaultMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.company.templates.setDefault({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.setDefaultSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["company", "templates"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.templates.setDefaultError"));
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.company.templates.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.deleteSuccess"));
			setDeleteTemplateId(null);
			queryClient.invalidateQueries({
				queryKey: ["company", "templates"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.templates.deleteError"));
		},
	});

	// Get all preset templates (always show all presets regardless of filter)
	const allPresets = getAllPresetTemplates();

	const basePath = `/app/${organizationSlug}/settings`;

	return (
		<div className="space-y-8">
			{/* Type Filter */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex gap-2">
						<Button
							variant={filterType === "ALL" ? "primary" : "outline"}
							size="sm"
							onClick={() => setFilterType("ALL")}
							className="rounded-xl"
						>
							{t("common.all")}
						</Button>
						<Button
							variant={filterType === "INVOICE" ? "primary" : "outline"}
							size="sm"
							onClick={() => setFilterType("INVOICE")}
							className="rounded-xl"
						>
							<Receipt className="h-4 w-4 me-2" />
							{t("finance.templates.types.invoice")}
						</Button>
						<Button
							variant={filterType === "QUOTATION" ? "primary" : "outline"}
							size="sm"
							onClick={() => setFilterType("QUOTATION")}
							className="rounded-xl"
						>
							<FileSignature className="h-4 w-4 me-2" />
							{t("finance.templates.types.quotation")}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Section A: Preset Gallery */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Sparkles className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-semibold">
						{t("finance.templates.presetGallery")}
					</h2>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{allPresets.map((preset) => (
						<PresetCard
							key={preset.key}
							preset={preset}
							basePath={basePath}
							t={t}
							organization={organizationData}
						/>
					))}
				</div>
			</div>

			{/* Section B: My Custom Templates */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Palette className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-semibold">
						{t("finance.templates.myTemplates")}
					</h2>
				</div>

				{isLoading ? <ListTableSkeleton /> : customTemplates.length === 0 ? (
					<Card className="rounded-2xl border-dashed">
						<CardContent className="p-8 text-center">
							<FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.templates.noCustomTemplates")}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{customTemplates.map((template: any) => (
							<Card
								key={template.id}
								className={cn(
									"rounded-2xl group transition-all hover:border-slate-300 dark:hover:border-slate-600",
									template.isDefault && "border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-800"
								)}
							>
								<CardContent className="p-4">
									{/* Thumbnail */}
									<Link href={`${basePath}/templates/${template.id}`}>
										<div
											className="relative w-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden mb-3 border"
											style={{ aspectRatio: "210 / 297", maxHeight: "200px" }}
										>
											<TemplateThumbnail
												elements={
													(template.content as any)?.elements ?? []
												}
												settings={
													(template.settings as any) ?? {
														backgroundColor: "#ffffff",
														primaryColor: "#3b82f6",
														fontFamily: "Cairo",
														fontSize: "14px",
														lineHeight: "1.6",
														pageSize: "A4",
														orientation: "portrait",
														margins: "20mm",
														vatPercent: 15,
														currency: "SAR",
													}
												}
												templateType={
													template.templateType as "QUOTATION" | "INVOICE"
												}
												organization={organizationData}
											/>
										</div>
									</Link>

									{/* Info */}
									<div className="flex items-start justify-between">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
											<h3 className="font-medium text-sm truncate">
												{template.name}
											</h3>
											{template.isDefault && (
												<Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
													<Star className="h-3 w-3 me-0.5 fill-amber-500 text-amber-500" />
													{t("finance.templates.default")}
												</Badge>
											)}
										</div>
											<div className="flex items-center gap-1.5 mt-1">
												<Badge
													variant="outline"
													className="text-[10px] px-1.5 py-0"
												>
													{templateTypeIcons[template.templateType]}
													<span className="ms-1">
														{t(
															`finance.templates.types.${template.templateType.toLowerCase()}`,
														)}
													</span>
												</Badge>
											</div>
											<p className="text-xs text-muted-foreground mt-1.5">
												{formatDate(template.createdAt)}
											</p>
										</div>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="rounded-xl"
											>
												<DropdownMenuItem asChild>
													<Link
														href={`${basePath}/templates/${template.id}`}
													>
														<Pencil className="h-4 w-4 me-2" />
														{t("common.edit")}
													</Link>
												</DropdownMenuItem>
												{!template.isDefault && (
													<DropdownMenuItem
														onClick={() =>
															setDefaultMutation.mutate(template.id)
														}
														disabled={setDefaultMutation.isPending}
													>
														<Star className="h-4 w-4 me-2" />
														{t("finance.templates.setAsDefault")}
													</DropdownMenuItem>
												)}
												{!template.isDefault && (
													<DropdownMenuItem
														onClick={() =>
															setDeleteTemplateId(template.id)
														}
														className="text-red-600"
													>
														<Trash2 className="h-4 w-4 me-2" />
														{t("common.delete")}
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteTemplateId}
				onOpenChange={() => setDeleteTemplateId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.templates.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.templates.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deleteTemplateId && deleteMutation.mutate(deleteTemplateId)
							}
							disabled={deleteMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending
								? t("common.deleting")
								: t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// Preset card sub-component
function PresetCard({
	preset,
	basePath,
	t,
	organization,
}: {
	preset: DefaultTemplateConfig;
	basePath: string;
	t: ReturnType<typeof useTranslations>;
	organization?: OrganizationData;
}) {
	return (
		<Card className="rounded-2xl group transition-all hover:border-primary/50 hover:shadow-md">
			<CardContent className="p-4">
				{/* Thumbnail */}
				<div
					className="relative w-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden mb-3 border"
					style={{ aspectRatio: "210 / 297", maxHeight: "200px" }}
				>
					<TemplateThumbnail
						elements={preset.elements}
						settings={preset.settings}
						templateType={preset.templateType}
						organization={organization}
					/>
				</div>

				{/* Info */}
				<div className="space-y-2">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<h3 className="font-medium text-sm">{preset.nameAr}</h3>
							<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
								{preset.descriptionAr}
							</p>
						</div>
						<div
							className="w-5 h-5 rounded-full shrink-0 border border-white shadow-sm"
							style={{ backgroundColor: preset.settings.primaryColor }}
						/>
					</div>

					<Button asChild size="sm" className="w-full rounded-xl mt-1">
						<Link href={`${basePath}/templates/new?preset=${preset.key}`}>
							<Palette className="h-4 w-4 me-2" />
							{t("finance.templates.customize")}
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
