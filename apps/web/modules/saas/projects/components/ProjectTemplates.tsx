"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	ChevronLeft,
	FileStack,
	FolderPlus,
	Layout,
	Plus,
	RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CardGridSkeleton } from "@saas/shared/components/skeletons";

interface ProjectTemplatesProps {
	organizationId: string;
	organizationSlug: string;
}

export function ProjectTemplates({
	organizationId,
	organizationSlug,
}: ProjectTemplatesProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects`;

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newTemplateName, setNewTemplateName] = useState("");
	const [newTemplateDescription, setNewTemplateDescription] = useState("");

	const { data, isLoading, refetch, isRefetching } = useQuery(
		orpc.projectTemplates.list.queryOptions({
			input: {
				organizationId,
			},
		}),
	);

	const createMutation = useMutation(
		orpc.projectTemplates.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("projects.templates.createSuccess"));
				setShowCreateForm(false);
				setNewTemplateName("");
				setNewTemplateDescription("");
				queryClient.invalidateQueries({ queryKey: orpc.projectTemplates.key() });
			},
			onError: () => {
				toast.error(t("projects.templates.createError"));
			},
		}),
	);

	const handleCreateTemplate = () => {
		if (!newTemplateName.trim()) {
			toast.error(t("projects.templates.nameRequired"));
			return;
		}

		createMutation.mutate({
			organizationId,
			name: newTemplateName,
			description: newTemplateDescription || undefined,
		});
	};

	if (isLoading) {
		return <CardGridSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="rounded-xl hover:bg-accent hover:text-accent-foreground"
					>
						<Link href={basePath}>
							<ChevronLeft className="rtl-flip h-5 w-5 text-muted-foreground" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-semibold text-foreground">
							{t("projects.templates.title")}
						</h1>
						<p className="text-sm text-muted-foreground">
							{t("projects.templates.descriptionFull")}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="gap-2"
					>
						<RefreshCw
							className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
						/>
					</Button>
					<Button
						onClick={() => setShowCreateForm(true)}
						className="gap-2"
						size="sm"
					>
						<Plus className="h-4 w-4" />
						{t("projects.templates.newTemplate")}
					</Button>
				</div>
			</div>

			{/* Create Form */}
			{showCreateForm && (
				<div className="rounded-2xl border-2 bg-card p-6">
					<h2 className="mb-4 text-lg font-semibold text-card-foreground">
						{t("projects.templates.createTemplate")}
					</h2>
					<div className="space-y-4">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								{t("projects.templates.templateName")}
							</label>
							<Input
								value={newTemplateName}
								onChange={(e: any) => setNewTemplateName(e.target.value)}
								placeholder={t("projects.templates.namePlaceholder")}
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								{t("projects.templates.descriptionOptional")}
							</label>
							<Input
								value={newTemplateDescription}
								onChange={(e: any) => setNewTemplateDescription(e.target.value)}
								placeholder={t("projects.templates.descriptionPlaceholder")}
							/>
						</div>
						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => setShowCreateForm(false)}
							>
								{t("common.cancel")}
							</Button>
							<Button
								onClick={handleCreateTemplate}
								disabled={createMutation.isPending}
							>
								{createMutation.isPending ? t("projects.templates.creating") : t("projects.templates.createTemplate")}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Templates List */}
			<div className="rounded-2xl border-2 bg-card p-6">
				{data?.templates && data.templates.length > 0 ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{data.templates.map((template: any) => (
							<div
								key={template.id}
								className="group rounded-xl border-2 bg-muted/40 p-4 transition-colors hover:border-primary/30"
							>
								<div className="mb-3 flex items-start justify-between">
									<div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Layout className="h-5 w-5" />
									</div>
									<Badge variant="outline" className="text-xs">
										{template.itemsCount} {t("projects.templates.items")}
									</Badge>
								</div>
								<h3 className="mb-1 font-medium text-card-foreground">
									{template.name}
								</h3>
								{template.description && (
									<p className="mb-3 text-sm text-muted-foreground line-clamp-2">
										{template.description}
									</p>
								)}
								{template.sourceProject && (
									<p className="text-xs text-muted-foreground">
										{t("projects.templates.fromProject")}: {template.sourceProject.name}
									</p>
								)}
								<p className="mt-2 text-xs text-muted-foreground">
									{t("projects.templates.createdBy")}: {template.createdBy.name}
								</p>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-2xl bg-muted p-4">
							<FileStack className="h-10 w-10 text-muted-foreground" />
						</div>
						<h3 className="mb-1 font-medium text-card-foreground">
							{t("projects.templates.noTemplates")}
						</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							{t("projects.templates.createFirstDescription")}
						</p>
						<Button
							onClick={() => setShowCreateForm(true)}
							variant="outline"
							className="gap-2"
						>
							<FolderPlus className="h-4 w-4" />
							{t("projects.templates.createFirst")}
						</Button>
					</div>
				)}
			</div>

			{/* Info Card */}
			<div className="rounded-2xl border-2 bg-card p-4">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Layout className="h-5 w-5" />
					</div>
					<div>
						<p className="font-medium text-card-foreground">
							{t("projects.templates.whatIsTemplate")}
						</p>
						<p className="text-sm text-muted-foreground">
							{t("projects.templates.templateExplanation")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
