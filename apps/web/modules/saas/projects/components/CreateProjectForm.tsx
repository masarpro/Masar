"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
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
import { ChevronLeft, FolderPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	ContractFormSections,
	type ContractFormRef,
} from "./finance/contract/ContractFormSections";

interface CreateProjectFormProps {
	organizationId: string;
	organizationSlug: string;
}

const PROJECT_TYPES = [
	{
		value: "RESIDENTIAL",
		labelKey: "projects.type.RESIDENTIAL",
		color: "bg-sky-500",
	},
	{
		value: "COMMERCIAL",
		labelKey: "projects.type.COMMERCIAL",
		color: "bg-violet-500",
	},
	{
		value: "INDUSTRIAL",
		labelKey: "projects.type.INDUSTRIAL",
		color: "bg-orange-500",
	},
	{
		value: "INFRASTRUCTURE",
		labelKey: "projects.type.INFRASTRUCTURE",
		color: "bg-slate-500",
	},
	{ value: "MIXED", labelKey: "projects.type.MIXED", color: "bg-teal-500" },
];

export function CreateProjectForm({
	organizationId,
	organizationSlug,
}: CreateProjectFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const contractRef = useRef<ContractFormRef>(null);

	// ─── Project Info state ─────────────────────────────────
	const [projectData, setProjectData] = useState({
		name: "",
		clientName: "",
		location: "",
		type: "",
		description: "",
	});

	// ─── Queries ────────────────────────────────────────────
	const { data: nextNoData } = useQuery(
		orpc.projects.getNextProjectNo.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: nextContractNoData } = useQuery(
		orpc.projectContract.getNextNo.queryOptions({
			input: { organizationId },
		}),
	);

	// ─── Handlers ───────────────────────────────────────────
	const updateProjectField = useCallback(
		(field: string, value: string) => {
			setProjectData((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	// ─── Mutation ───────────────────────────────────────────
	const createMutation = useMutation(
		orpc.projects.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(t("projects.createProject.success"));
				router.push(`/app/${organizationSlug}/projects/${data.id}`);
			},
			onError: () => {
				toast.error(t("projects.createError"));
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!projectData.name.trim()) {
			toast.error(t("projects.createProject.projectNameRequired"));
			return;
		}

		const contractData = contractRef.current?.getFormData();
		if (!contractData) return;

		const contractVal =
			contractData.contractValue > 0
				? contractData.contractValue
				: undefined;

		createMutation.mutate({
			organizationId,
			name: projectData.name,
			clientName: projectData.clientName || undefined,
			location: projectData.location || undefined,
			type:
				(projectData.type as
					| "RESIDENTIAL"
					| "COMMERCIAL"
					| "INDUSTRIAL"
					| "INFRASTRUCTURE"
					| "MIXED") || undefined,
			description: projectData.description || undefined,
			contractValue: contractVal,
			startDate: contractData.startDate
				? new Date(contractData.startDate)
				: undefined,
			endDate: contractData.endDate
				? new Date(contractData.endDate)
				: undefined,
			// Contract fields
			contractNo: nextContractNoData?.contractNo || undefined,
			contractStatus:
				(contractData.contractStatus as
					| "DRAFT"
					| "ACTIVE"
					| "SUSPENDED"
					| "CLOSED") || undefined,
			signedDate: contractData.signedDate
				? new Date(contractData.signedDate)
				: undefined,
			retentionPercent: contractData.retentionPercent ?? undefined,
			retentionCap: contractData.retentionCap ?? undefined,
			retentionReleaseDays:
				contractData.retentionReleaseDays ?? undefined,
			contractNotes: contractData.contractNotes || undefined,
			includesVat: contractData.includesVat || undefined,
			vatPercent: contractData.vatPercent ?? undefined,
			paymentMethod:
				(contractData.paymentMethod as
					| "CASH"
					| "BANK_TRANSFER"
					| "CHEQUE"
					| "CREDIT_CARD"
					| "OTHER") || undefined,
			performanceBondPercent:
				contractData.performanceBondPercent ?? undefined,
			performanceBondAmount:
				contractData.performanceBondAmount ?? undefined,
			insuranceRequired: contractData.insuranceRequired || undefined,
			insuranceDetails: contractData.insuranceDetails || undefined,
			scopeOfWork: contractData.scopeOfWork || undefined,
			penaltyPercent: contractData.penaltyPercent ?? undefined,
			penaltyCapPercent: contractData.penaltyCapPercent ?? undefined,
			paymentTerms:
				contractData.paymentTerms.length > 0
					? contractData.paymentTerms.map((term) => ({
							type: term.type as
								| "ADVANCE"
								| "MILESTONE"
								| "MONTHLY"
								| "COMPLETION"
								| "CUSTOM",
							label: term.label,
							percent: term.percent ?? undefined,
							amount: term.amount ?? undefined,
							sortOrder: term.sortOrder,
						}))
					: undefined,
		});
	};

	// ─── Render ─────────────────────────────────────────────
	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto max-w-3xl space-y-6 pb-40"
		>
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={`/app/${organizationSlug}/projects`}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>
				<div className="flex flex-1 items-center gap-3">
					<div>
						<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
							{t("projects.createProject.title")}
						</h1>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("projects.newProjectSubtitle")}
						</p>
					</div>
					<div className="flex gap-2">
						{nextNoData?.projectNo && (
							<Badge
								variant="outline"
								className="rounded-lg border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
							>
								{nextNoData.projectNo}
							</Badge>
						)}
					</div>
				</div>
			</div>

			{/* ═══ Section 1: Project Info ═══════════════════════ */}
			<div className="overflow-hidden rounded-2xl border border-indigo-200/50 bg-indigo-50/50 dark:border-indigo-800/30 dark:bg-indigo-950/20">
				<div className="border-b border-indigo-200/50 p-5 dark:border-indigo-800/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
							<FolderPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<h2 className="text-lg font-medium text-indigo-900 dark:text-indigo-100">
							{t("projects.createProject.projectInfo")}
						</h2>
					</div>
				</div>

				<div className="space-y-5 p-5">
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.projectName")} *
							</Label>
							<Input
								value={projectData.name}
								onChange={(e) =>
									updateProjectField("name", e.target.value)
								}
								placeholder={t(
									"projects.form.namePlaceholder",
								)}
								className="rounded-xl border-indigo-200/60 bg-white dark:border-indigo-800/40 dark:bg-slate-900/50"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.projectType")}
							</Label>
							<Select
								value={projectData.type}
								onValueChange={(value) =>
									updateProjectField("type", value)
								}
							>
								<SelectTrigger className="rounded-xl border-indigo-200/60 bg-white dark:border-indigo-800/40 dark:bg-slate-900/50">
									<SelectValue
										placeholder={t(
											"projects.form.typePlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{PROJECT_TYPES.map((type) => (
										<SelectItem
											key={type.value}
											value={type.value}
											className="rounded-lg"
										>
											<div className="flex items-center gap-2">
												<div
													className={`h-2 w-2 rounded-full ${type.color}`}
												/>
												{t(type.labelKey)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.clientName")}
							</Label>
							<Input
								value={projectData.clientName}
								onChange={(e) =>
									updateProjectField(
										"clientName",
										e.target.value,
									)
								}
								placeholder={t(
									"projects.form.clientNamePlaceholder",
								)}
								className="rounded-xl border-indigo-200/60 bg-white dark:border-indigo-800/40 dark:bg-slate-900/50"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.location")}
							</Label>
							<Input
								value={projectData.location}
								onChange={(e) =>
									updateProjectField(
										"location",
										e.target.value,
									)
								}
								placeholder={t(
									"projects.form.locationPlaceholder",
								)}
								className="rounded-xl border-indigo-200/60 bg-white dark:border-indigo-800/40 dark:bg-slate-900/50"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("projects.createProject.description")}
						</Label>
						<Textarea
							value={projectData.description}
							onChange={(e) =>
								updateProjectField(
									"description",
									e.target.value,
								)
							}
							placeholder={t(
								"projects.form.descriptionPlaceholder",
							)}
							rows={3}
							className="rounded-xl border-indigo-200/60 bg-white dark:border-indigo-800/40 dark:bg-slate-900/50"
						/>
					</div>
				</div>
			</div>

			{/* ═══ Sections 2-4: Contract (shared component) ═══ */}
			<ContractFormSections
				ref={contractRef}
				contractNo={nextContractNoData?.contractNo}
			/>

			{/* ═══ Submit Buttons ════════════════════════════════ */}
			<div className="flex justify-end gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					className="rounded-xl border-slate-200 px-6 dark:border-slate-700"
				>
					{t("projects.createProject.cancel")}
				</Button>
				<Button
					type="submit"
					disabled={createMutation.isPending}
					className="rounded-xl bg-slate-900 px-8 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					{createMutation.isPending ? (
						<>
							<Loader2 className="ml-2 h-4 w-4 animate-spin" />
							{t("common.creating")}
						</>
					) : (
						t("projects.createProject.submit")
					)}
				</Button>
			</div>
		</form>
	);
}
