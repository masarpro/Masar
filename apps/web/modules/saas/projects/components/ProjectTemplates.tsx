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
				toast.success("تم إنشاء القالب بنجاح");
				setShowCreateForm(false);
				setNewTemplateName("");
				setNewTemplateDescription("");
				queryClient.invalidateQueries({ queryKey: ["projectTemplates"] });
			},
			onError: () => {
				toast.error("حدث خطأ أثناء إنشاء القالب");
			},
		}),
	);

	const handleCreateTemplate = () => {
		if (!newTemplateName.trim()) {
			toast.error("اسم القالب مطلوب");
			return;
		}

		createMutation.mutate({
			organizationId,
			name: newTemplateName,
			description: newTemplateDescription || undefined,
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
					>
						<Link href={basePath}>
							<ChevronLeft className="h-5 w-5 text-slate-500" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
							قوالب المشاريع
						</h1>
						<p className="text-sm text-slate-500">
							إنشاء وإدارة قوالب المشاريع لبدء مشاريع جديدة بسرعة
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
						قالب جديد
					</Button>
				</div>
			</div>

			{/* Create Form */}
			{showCreateForm && (
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
						إنشاء قالب جديد
					</h2>
					<div className="space-y-4">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
								اسم القالب
							</label>
							<Input
								value={newTemplateName}
								onChange={(e) => setNewTemplateName(e.target.value)}
								placeholder="مثال: مشروع سكني نموذجي"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
								الوصف (اختياري)
							</label>
							<Input
								value={newTemplateDescription}
								onChange={(e) => setNewTemplateDescription(e.target.value)}
								placeholder="وصف مختصر للقالب..."
							/>
						</div>
						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => setShowCreateForm(false)}
							>
								إلغاء
							</Button>
							<Button
								onClick={handleCreateTemplate}
								disabled={createMutation.isPending}
							>
								{createMutation.isPending ? "جاري الإنشاء..." : "إنشاء القالب"}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Templates List */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				{data?.templates && data.templates.length > 0 ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{data.templates.map((template) => (
							<div
								key={template.id}
								className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-primary/30 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"
							>
								<div className="mb-3 flex items-start justify-between">
									<div className="rounded-xl bg-primary/10 p-2.5">
										<Layout className="h-5 w-5 text-primary" />
									</div>
									<Badge variant="outline" className="text-xs">
										{template.itemsCount} عنصر
									</Badge>
								</div>
								<h3 className="mb-1 font-medium text-slate-900 dark:text-slate-100">
									{template.name}
								</h3>
								{template.description && (
									<p className="mb-3 text-sm text-slate-500 line-clamp-2">
										{template.description}
									</p>
								)}
								{template.sourceProject && (
									<p className="text-xs text-slate-400">
										مأخوذ من: {template.sourceProject.name}
									</p>
								)}
								<p className="mt-2 text-xs text-slate-400">
									أنشأه: {template.createdBy.name}
								</p>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
							<FileStack className="h-10 w-10 text-slate-400" />
						</div>
						<h3 className="mb-1 font-medium text-slate-900 dark:text-slate-100">
							لا توجد قوالب
						</h3>
						<p className="mb-4 text-sm text-slate-500">
							أنشئ قالبًا لبدء مشاريع جديدة بسرعة
						</p>
						<Button
							onClick={() => setShowCreateForm(true)}
							variant="outline"
							className="gap-2"
						>
							<FolderPlus className="h-4 w-4" />
							إنشاء أول قالب
						</Button>
					</div>
				)}
			</div>

			{/* Info Card */}
			<div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
				<div className="flex items-start gap-3">
					<Layout className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					<div>
						<p className="font-medium text-indigo-800 dark:text-indigo-200">
							ما هي قوالب المشاريع؟
						</p>
						<p className="text-sm text-indigo-700 dark:text-indigo-300">
							القوالب تساعدك على بدء مشاريع جديدة بسرعة عن طريق نسخ الهيكل
							(المراحل، قوائم المهام) من مشروع سابق أو إنشاء هيكل معياري.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
