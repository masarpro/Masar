"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
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
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { toast } from "sonner";
import {
	Plus,
	MoreVertical,
	Pencil,
	Trash2,
	FileText,
	Star,
	StarOff,
	Receipt,
	FileSignature,
	Palette,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "../../lib/utils";

interface TemplatesListProps {
	organizationId: string;
	organizationSlug: string;
}

interface TemplateFormData {
	name: string;
	description: string;
	templateType: "QUOTATION" | "INVOICE" | "LETTER";
}

const emptyFormData: TemplateFormData = {
	name: "",
	description: "",
	templateType: "QUOTATION",
};

const templateTypeIcons: Record<string, React.ReactNode> = {
	QUOTATION: <FileSignature className="h-5 w-5" />,
	INVOICE: <Receipt className="h-5 w-5" />,
	LETTER: <FileText className="h-5 w-5" />,
};

export function TemplatesList({
	organizationId,
	organizationSlug,
}: TemplatesListProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	// State
	const [filterType, setFilterType] = useState<"ALL" | "QUOTATION" | "INVOICE" | "LETTER">("ALL");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<{ id: string; templateType: string } | null>(null);
	const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
	const [formData, setFormData] = useState<TemplateFormData>(emptyFormData);

	// Fetch templates
	const { data, isLoading } = useQuery(
		orpc.finance.templates.list.queryOptions({
			input: {
				organizationId,
				templateType: filterType === "ALL" ? undefined : filterType,
			},
		}),
	);

	const templates = data?.templates ?? [];

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.templates.create({
				organizationId,
				name: formData.name,
				description: formData.description || undefined,
				templateType: formData.templateType,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.createSuccess"));
			setDialogOpen(false);
			resetForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "templates"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.templates.createError"));
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!editingTemplate) return;
			return orpcClient.finance.templates.update({
				organizationId,
				id: editingTemplate.id,
				name: formData.name,
				description: formData.description || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.updateSuccess"));
			setDialogOpen(false);
			setEditingTemplate(null);
			resetForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "templates"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.templates.updateError"));
		},
	});

	// Set default mutation
	const setDefaultMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.templates.setDefault({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.setDefaultSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "templates"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.templates.setDefaultError"));
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.templates.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.templates.deleteSuccess"));
			setDeleteTemplateId(null);
			queryClient.invalidateQueries({
				queryKey: ["finance", "templates"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.templates.deleteError"));
		},
	});

	const resetForm = () => {
		setFormData(emptyFormData);
	};

	const handleOpenCreate = () => {
		setEditingTemplate(null);
		resetForm();
		setDialogOpen(true);
	};

	const handleOpenEdit = (template: typeof templates[0]) => {
		setEditingTemplate({ id: template.id, templateType: template.templateType });
		setFormData({
			name: template.name,
			description: template.description ?? "",
			templateType: template.templateType as TemplateFormData["templateType"],
		});
		setDialogOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error(t("finance.templates.errors.nameRequired"));
			return;
		}

		if (editingTemplate) {
			updateMutation.mutate();
		} else {
			createMutation.mutate();
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-primary/10 rounded-xl">
						<FileText className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
							{t("finance.templates.title")}
						</h1>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("finance.templates.description")}
						</p>
					</div>
				</div>
				<Button asChild className="rounded-xl">
					<Link href={`/app/${organizationSlug}/finance/templates/new`}>
						<Plus className="h-4 w-4 me-2" />
						{t("finance.templates.addTemplate")}
					</Link>
				</Button>
			</div>

			{/* Filters */}
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
							variant={filterType === "QUOTATION" ? "primary" : "outline"}
							size="sm"
							onClick={() => setFilterType("QUOTATION")}
							className="rounded-xl"
						>
							<FileSignature className="h-4 w-4 me-2" />
							{t("finance.templates.types.quotation")}
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
							variant={filterType === "LETTER" ? "primary" : "outline"}
							size="sm"
							onClick={() => setFilterType("LETTER")}
							className="rounded-xl"
						>
							<FileText className="h-4 w-4 me-2" />
							{t("finance.templates.types.letter")}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Templates Grid */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<div className="relative">
						<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
						<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				</div>
			) : templates.length === 0 ? (
				<div className="text-center py-20">
					<FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
					<p className="text-slate-500 dark:text-slate-400">
						{t("finance.templates.noTemplates")}
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{templates.map((template) => (
						<Card
							key={template.id}
							className={`rounded-2xl transition-all ${
								template.isDefault
									? "border-2 border-primary"
									: "hover:border-slate-300 dark:hover:border-slate-600"
							}`}
						>
							<CardContent className="p-4">
								<div className="flex items-start justify-between">
									<Link
										href={`/app/${organizationSlug}/finance/templates/${template.id}`}
										className="flex items-center gap-3 hover:opacity-80 transition-opacity"
									>
										<div
											className={`p-2 rounded-xl ${
												template.isDefault
													? "bg-primary/10 text-primary"
													: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
											}`}
										>
											{templateTypeIcons[template.templateType]}
										</div>
										<div>
											<div className="flex items-center gap-2">
												<h3 className="font-medium text-slate-900 dark:text-slate-100">
													{template.name}
												</h3>
												{template.isDefault && (
													<Star className="h-4 w-4 text-amber-500 fill-amber-500" />
												)}
											</div>
											<p className="text-xs text-slate-500 dark:text-slate-400">
												{t(`finance.templates.types.${template.templateType.toLowerCase()}`)}
											</p>
										</div>
									</Link>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="rounded-xl">
											<DropdownMenuItem asChild>
												<Link href={`/app/${organizationSlug}/finance/templates/${template.id}`}>
													<Palette className="h-4 w-4 me-2" />
													{t("finance.templates.design")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleOpenEdit(template)}>
												<Pencil className="h-4 w-4 me-2" />
												{t("common.edit")}
											</DropdownMenuItem>
											{!template.isDefault && (
												<DropdownMenuItem
													onClick={() => setDefaultMutation.mutate(template.id)}
													disabled={setDefaultMutation.isPending}
												>
													<Star className="h-4 w-4 me-2" />
													{t("finance.templates.setAsDefault")}
												</DropdownMenuItem>
											)}
											{!template.isDefault && (
												<DropdownMenuItem
													onClick={() => setDeleteTemplateId(template.id)}
													className="text-red-600"
												>
													<Trash2 className="h-4 w-4 me-2" />
													{t("common.delete")}
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{template.description && (
									<p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
										{template.description}
									</p>
								)}
								<div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
									<p className="text-xs text-slate-400 dark:text-slate-500">
										{t("finance.templates.createdAt")}: {formatDate(template.createdAt)}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Create/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingTemplate
								? t("finance.templates.editTemplate")
								: t("finance.templates.addTemplate")}
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>{t("finance.templates.name")} *</Label>
							<Input
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder={t("finance.templates.namePlaceholder")}
								required
								className="rounded-xl mt-1"
							/>
						</div>
						{!editingTemplate && (
							<div>
								<Label>{t("finance.templates.type")} *</Label>
								<Select
									value={formData.templateType}
									onValueChange={(v) =>
										setFormData({
											...formData,
											templateType: v as TemplateFormData["templateType"],
										})
									}
								>
									<SelectTrigger className="rounded-xl mt-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="QUOTATION">
											{t("finance.templates.types.quotation")}
										</SelectItem>
										<SelectItem value="INVOICE">
											{t("finance.templates.types.invoice")}
										</SelectItem>
										<SelectItem value="LETTER">
											{t("finance.templates.types.letter")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
						<div>
							<Label>{t("finance.templates.description")}</Label>
							<Textarea
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder={t("finance.templates.descriptionPlaceholder")}
								rows={3}
								className="rounded-xl mt-1"
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
								className="rounded-xl"
							>
								{t("common.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={createMutation.isPending || updateMutation.isPending}
								className="rounded-xl"
							>
								{createMutation.isPending || updateMutation.isPending
									? t("common.saving")
									: editingTemplate
										? t("common.save")
										: t("finance.templates.addTemplate")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

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
