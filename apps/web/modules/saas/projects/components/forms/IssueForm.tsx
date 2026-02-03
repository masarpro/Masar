"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface IssueFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const SEVERITY_OPTIONS: IssueSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function IssueForm({
	organizationId,
	organizationSlug,
	projectId,
}: IssueFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [severity, setSeverity] = useState<IssueSeverity>("MEDIUM");
	const [dueDate, setDueDate] = useState("");

	const createMutation = useMutation(
		orpc.projectField.createIssue.mutationOptions(),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await createMutation.mutateAsync({
				organizationId,
				projectId,
				title,
				description,
				severity,
				dueDate: dueDate ? new Date(dueDate) : undefined,
			});

			toast.success(t("projects.field.issueCreated"));
			queryClient.invalidateQueries({ queryKey: ["projectField"] });
			router.push(`${basePath}/field`);
		} catch {
			toast.error(t("projects.field.issueCreateError"));
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`${basePath}/field`}>
						<ChevronLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.field.newIssue")}
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("projects.field.newIssueSubtitle")}
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="title">{t("projects.field.issueTitle")} *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("projects.field.issueTitlePlaceholder")}
							required
							className="rounded-xl"
						/>
					</div>

					{/* Severity & Due Date */}
					<div className="mt-6 grid gap-6 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("projects.field.severityLabel")}</Label>
							<Select
								value={severity}
								onValueChange={(v) => setSeverity(v as IssueSeverity)}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SEVERITY_OPTIONS.map((sev) => (
										<SelectItem key={sev} value={sev}>
											{t(`projects.field.severity.${sev}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="dueDate">{t("projects.field.dueDate")}</Label>
							<Input
								id="dueDate"
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className="rounded-xl"
							/>
						</div>
					</div>

					{/* Description */}
					<div className="mt-6 space-y-2">
						<Label htmlFor="description">
							{t("projects.field.issueDescription")} *
						</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("projects.field.issueDescriptionPlaceholder")}
							rows={4}
							required
							className="rounded-xl"
						/>
					</div>
				</div>

				{/* Submit */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`${basePath}/field`)}
						className="rounded-xl"
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={
							createMutation.isPending ||
							!title.trim() ||
							!description.trim()
						}
						className="min-w-[120px] rounded-xl bg-red-600 hover:bg-red-700"
					>
						<AlertTriangle className="me-2 h-4 w-4" />
						{createMutation.isPending
							? t("common.saving")
							: t("projects.field.reportIssue")}
					</Button>
				</div>
			</form>
		</div>
	);
}
