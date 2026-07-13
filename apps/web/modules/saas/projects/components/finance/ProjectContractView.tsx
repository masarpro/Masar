"use client";

import { formatNumber } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { FileDiff, Loader2, Pencil, Save, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
import { toast } from "sonner";
import { ContractSummaryBar } from "./contract/ContractSummaryBar";
import {
	ContractFormSections,
	type ContractFormRef,
} from "./contract/ContractFormSections";

interface ProjectContractViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectContractView({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectContractViewProps) {
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const t = useTranslations();
	const queryClient = useQueryClient();
	const contractRef = useRef<ContractFormRef>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [projectClientName, setProjectClientName] = useState("");

	const { data: contract, isLoading: contractLoading } = useQuery(
		orpc.projectContract.get.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: summary, isLoading: summaryLoading } = useQuery(
		orpc.projectContract.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: project, isLoading: projectLoading } = useQuery(
		orpc.projects.getById.queryOptions({
			input: { organizationId, id: projectId },
		}),
	);

	useEffect(() => {
		if (project) {
			setProjectName(project.name ?? "");
			setProjectClientName(project.clientName ?? "");
		}
	}, [project]);

	const invalidateAll = () => {
		queryClient.invalidateQueries({
			queryKey: orpc.projectContract.get.queryOptions({
				input: { organizationId, projectId },
			}).queryKey,
		});
		queryClient.invalidateQueries({
			queryKey: orpc.projectContract.getSummary.queryOptions({
				input: { organizationId, projectId },
			}).queryKey,
		});
		queryClient.invalidateQueries({
			queryKey: orpc.projects.getById.queryOptions({
				input: { organizationId, id: projectId },
			}).queryKey,
		});
	};

	const upsertMutation = useMutation({
		...orpc.projectContract.upsert.mutationOptions(),
		onSuccess: () => {
			invalidateAll();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const setTermsMutation = useMutation({
		...orpc.projectContract.setPaymentTerms.mutationOptions(),
		onSuccess: () => {
			invalidateAll();
			toast.success(t("projects.contract.saved"));
			setIsEditing(false);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateProjectMutation = useMutation({
		...orpc.projects.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.projects.getById.queryOptions({
					input: { organizationId, id: projectId },
				}).queryKey,
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const isSaving =
		upsertMutation.isPending ||
		setTermsMutation.isPending ||
		updateProjectMutation.isPending;

	const handleSave = async () => {
		const data = contractRef.current?.getFormData();
		if (!data) return;

		const trimmedName = projectName.trim();
		if (!trimmedName) {
			toast.error(t("projects.createProject.projectNameRequired"));
			return;
		}

		const trimmedClientName = projectClientName.trim();
		const nameChanged = project && trimmedName !== (project.name ?? "");
		const clientNameChanged =
			project && trimmedClientName !== (project.clientName ?? "");
		if (nameChanged || clientNameChanged) {
			updateProjectMutation.mutate({
				organizationId,
				id: projectId,
				name: trimmedName,
				clientName: trimmedClientName || undefined,
			});
		}

		const VALID_STATUSES = ["DRAFT", "ACTIVE", "SUSPENDED", "CLOSED"];
		const VALID_METHODS = [
			"CASH",
			"BANK_TRANSFER",
			"CHEQUE",
			"CREDIT_CARD",
			"OTHER",
		];
		const VALID_TERM_TYPES = [
			"ADVANCE",
			"MILESTONE",
			"MONTHLY",
			"COMPLETION",
			"CUSTOM",
		];

		const status = VALID_STATUSES.includes(data.contractStatus)
			? (data.contractStatus as
					| "DRAFT"
					| "ACTIVE"
					| "SUSPENDED"
					| "CLOSED")
			: undefined;

		const paymentMethod =
			data.paymentMethod && VALID_METHODS.includes(data.paymentMethod)
				? (data.paymentMethod as
						| "CASH"
						| "BANK_TRANSFER"
						| "CHEQUE"
						| "CREDIT_CARD"
						| "OTHER")
				: null;

		// First upsert the contract
		upsertMutation.mutate(
			{
				organizationId,
				projectId,
				contractNo: contract?.contractNo ?? undefined,
				value: data.contractValue,
				status,
				signedDate: data.signedDate
					? new Date(data.signedDate)
					: null,
				startDate: data.startDate
					? new Date(data.startDate)
					: null,
				endDate: data.endDate ? new Date(data.endDate) : null,
				retentionPercent: data.retentionPercent,
				retentionCap: data.retentionCap,
				retentionReleaseDays: data.retentionReleaseDays,
				notes: data.contractNotes || null,
				includesVat: data.includesVat,
				vatPercent: data.vatPercent,
				paymentMethod,
				performanceBondPercent: data.performanceBondPercent,
				performanceBondAmount: data.performanceBondAmount,
				insuranceRequired: data.insuranceRequired,
				insuranceDetails: data.insuranceDetails || null,
				scopeOfWork: data.scopeOfWork || null,
				penaltyPercent: data.penaltyPercent,
				penaltyCapPercent: data.penaltyCapPercent,
			},
			{
				onSuccess: () => {
					// Then save payment terms
					setTermsMutation.mutate({
						organizationId,
						projectId,
						terms: data.paymentTerms.map((term) => ({
							id: term.id ?? undefined,
							type: VALID_TERM_TYPES.includes(term.type)
								? (term.type as
										| "ADVANCE"
										| "MILESTONE"
										| "MONTHLY"
										| "COMPLETION"
										| "CUSTOM")
								: "CUSTOM",
							label: term.label,
							percent: term.percent,
							amount: term.amount,
							sortOrder: term.sortOrder,
						})),
					});
				},
			},
		);
	};

	if (contractLoading || summaryLoading || projectLoading) {
		return <DetailPageSkeleton />;
	}

	return (
		<div className="w-full max-w-full space-y-6 pb-40">
			{/* Header + Edit button */}
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					{t("projects.contract.title")}
				</h2>
				{!isEditing ? (
					<div className="flex gap-2">
						<Button
							asChild
							variant="outline"
							className="rounded-xl border-chart-4/30 px-5 text-chart-4 hover:bg-chart-4/10"
						>
							<Link href={`${basePath}/changes`}>
								<FileDiff className="me-2 h-4 w-4" />
								{t("changeOrders.title")}
							</Link>
						</Button>
						<Button
							onClick={() => setIsEditing(true)}
							className="rounded-xl px-6"
						>
							<Pencil className="me-2 h-4 w-4" />
							{t("projects.contract.editContract")}
						</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setProjectName(project?.name ?? "");
								setProjectClientName(project?.clientName ?? "");
								setIsEditing(false);
							}}
							disabled={isSaving}
							className="rounded-xl px-5"
						>
							<X className="me-2 h-4 w-4" />
							{t("projects.contract.cancelEdit")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className="rounded-xl px-6"
						>
							{isSaving ? (
								<>
									<Loader2 className="me-2 h-4 w-4 animate-spin" />
									{t("projects.contract.saving")}
								</>
							) : (
								<>
									<Save className="me-2 h-4 w-4" />
									{t("projects.contract.saveChanges")}
								</>
							)}
						</Button>
					</div>
				)}
			</div>

			{/* Summary Bar */}
			<ContractSummaryBar
				originalValue={Number(summary?.originalValue ?? 0)}
				approvedCOImpact={Number(summary?.approvedCOImpact ?? 0)}
				adjustedValue={Number(summary?.adjustedValue ?? 0)}
				retentionAmount={Number(summary?.retentionAmount ?? 0)}
			/>

			{/* Project Info (editable when isEditing) */}
			{isEditing ? (
				<div className="overflow-hidden rounded-2xl border-2 bg-card">
					<div className="border-b-2 p-5">
						<h3 className="text-lg font-medium text-card-foreground">
							{t("projects.contract.projectInfo.title")}
						</h3>
					</div>
					<div className="grid gap-4 p-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="project-name">
								{t("projects.contract.projectInfo.projectName")}
							</Label>
							<Input
								id="project-name"
								value={projectName}
								onChange={(e) => setProjectName(e.target.value)}
								disabled={isSaving}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="project-client-name">
								{t("projects.contract.projectInfo.clientName")}
							</Label>
							<Input
								id="project-client-name"
								value={projectClientName}
								onChange={(e) =>
									setProjectClientName(e.target.value)
								}
								disabled={isSaving}
							/>
						</div>
					</div>
				</div>
			) : (
				<ProjectInfoReadOnly
					projectName={project?.name ?? null}
					clientName={project?.clientName ?? null}
				/>
			)}

			{/* Contract Form (same as creation page) */}
			{isEditing ? (
				<ContractFormSections
					key="editing"
					ref={contractRef}
					contractNo={contract?.contractNo ?? undefined}
					initialData={
						contract
							? {
									value: contract.value,
									status: contract.status,
									includesVat: contract.includesVat,
									vatPercent: contract.vatPercent,
									signedDate: contract.signedDate,
									startDate: contract.startDate,
									endDate: contract.endDate,
									paymentMethod: contract.paymentMethod,
									scopeOfWork: contract.scopeOfWork,
									notes: contract.notes,
									retentionPercent:
										contract.retentionPercent,
									retentionCap: contract.retentionCap,
									retentionReleaseDays:
										contract.retentionReleaseDays,
									performanceBondPercent:
										contract.performanceBondPercent,
									performanceBondAmount:
										contract.performanceBondAmount,
									insuranceRequired:
										contract.insuranceRequired,
									insuranceDetails:
										contract.insuranceDetails,
									penaltyPercent: contract.penaltyPercent,
									penaltyCapPercent:
										contract.penaltyCapPercent,
									paymentTerms: contract.paymentTerms,
								}
							: undefined
					}
				/>
			) : (
				<ContractReadOnlyView contract={contract} />
			)}
		</div>
	);
}

// ─── Project Info (Read-Only) ────────────────────────────────
function ProjectInfoReadOnly({
	projectName,
	clientName,
}: {
	projectName: string | null;
	clientName: string | null;
}) {
	const t = useTranslations();

	return (
		<div className="overflow-hidden rounded-2xl border-2 bg-card">
			<div className="border-b-2 p-5">
				<h3 className="text-lg font-medium text-card-foreground">
					{t("projects.contract.projectInfo.title")}
				</h3>
			</div>
			<div className="grid gap-4 p-5 sm:grid-cols-2">
				<ReadOnlyField
					label={t("projects.contract.projectInfo.projectName")}
					value={projectName || "—"}
				/>
				<ReadOnlyField
					label={t("projects.contract.projectInfo.clientName")}
					value={clientName || "—"}
				/>
			</div>
		</div>
	);
}

// ─── Read-Only View ──────────────────────────────────────────
function ContractReadOnlyView({ contract }: { contract: any }) {
	const t = useTranslations();

	if (!contract) {
		return (
			<div className="rounded-2xl border-2 border-dashed py-16 text-center">
				<p className="text-sm text-muted-foreground">
					{t("projects.contract.title")}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{t("projects.contract.editContract")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Contract Details */}
			<div className="overflow-hidden rounded-2xl border-2 bg-card">
				<div className="border-b-2 p-5">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium text-card-foreground">
							{t("projects.createProject.contractInfo")}
						</h3>
						{contract.contractNo && (
							<span className="rounded-lg bg-chart-4/15 px-3 py-1 font-mono text-sm text-chart-4">
								{contract.contractNo}
							</span>
						)}
					</div>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<ReadOnlyField
						label={t("projects.createProject.contractValue")}
						value={
							Number(contract.value) > 0
								? `${formatNumber(Number(contract.value))} ${t("common.sar")}`
								: "—"
						}
					/>
					<ReadOnlyField
						label={t("projects.createProject.contractStatus")}
						value={
							contract.status
								? t(
										`projects.createProject.contractStatuses.${contract.status}`,
									)
								: "—"
						}
					/>
					{contract.includesVat && (
						<ReadOnlyField
							label={t("projects.createProject.vatToggle")}
							value={`${formatNumber(Number(contract.value) * (1 + (contract.vatPercent ?? 15) / 100))} ${t("common.sar")}`}
						/>
					)}
					{contract.paymentMethod && (
						<ReadOnlyField
							label={t("projects.createProject.paymentMethod")}
							value={t(
								`projects.createProject.paymentMethods.${contract.paymentMethod}`,
							)}
						/>
					)}
					<ReadOnlyField
						label={t("projects.createProject.signedDate")}
						value={
							contract.signedDate
								? new Date(
										contract.signedDate,
									).toLocaleDateString("ar-SA")
								: "—"
						}
					/>
					<ReadOnlyField
						label={t("projects.createProject.startDate")}
						value={
							contract.startDate
								? new Date(
										contract.startDate,
									).toLocaleDateString("ar-SA")
								: "—"
						}
					/>
					<ReadOnlyField
						label={t("projects.createProject.endDate")}
						value={
							contract.endDate
								? new Date(
										contract.endDate,
									).toLocaleDateString("ar-SA")
								: "—"
						}
					/>
				</div>

				{contract.scopeOfWork && (
					<div className="border-t-2 p-5">
						<p className="mb-1 text-xs text-muted-foreground">
							{t("projects.createProject.scopeOfWork")}
						</p>
						<p className="text-sm text-card-foreground">
							{contract.scopeOfWork}
						</p>
					</div>
				)}
			</div>

			{/* Payment Terms */}
			{contract.paymentTerms?.length > 0 && (
				<div className="overflow-hidden rounded-2xl border-2 bg-card">
					<div className="border-b-2 p-5">
						<h3 className="text-lg font-medium text-card-foreground">
							{t("projects.createProject.paymentTermsSection")}
						</h3>
					</div>
					<div className="space-y-2 p-5">
						{contract.paymentTerms.map(
							(term: any, idx: number) => (
								<div
									key={term.id ?? idx}
									className="flex items-center justify-between rounded-xl border-2 bg-card p-3"
								>
									<div className="flex items-center gap-3">
										<span className="rounded-full bg-chart-4/15 px-2.5 py-0.5 text-xs font-semibold text-chart-4">
											{t(
												`projects.createProject.termTypes.${term.type}`,
											)}
										</span>
										{term.label && (
											<span className="text-sm text-muted-foreground">
												{term.label}
											</span>
										)}
									</div>
									<div className="flex items-center gap-3">
										{term.percent != null && (
											<span className="font-mono text-sm font-medium text-chart-4">
												{term.percent}%
											</span>
										)}
										{term.amount != null && (
											<span className="font-mono text-sm text-muted-foreground">
												{formatNumber(Number(term.amount))}{" "}
												{t("common.sar")}
											</span>
										)}
									</div>
								</div>
							),
						)}
					</div>
				</div>
			)}

			{/* Guarantees & Retention */}
			{(contract.retentionPercent ||
				contract.performanceBondPercent ||
				contract.insuranceRequired ||
				contract.penaltyPercent) && (
				<div className="overflow-hidden rounded-2xl border-2 bg-card">
					<div className="border-b-2 p-5">
						<h3 className="text-lg font-medium text-card-foreground">
							{t("projects.createProject.guaranteesSection")}
						</h3>
					</div>
					<div className="grid gap-4 p-5 sm:grid-cols-2">
						{contract.retentionPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.retentionPercent",
								)}
								value={`${contract.retentionPercent}%`}
							/>
						)}
						{contract.performanceBondPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.performanceBondPercent",
								)}
								value={`${contract.performanceBondPercent}%`}
							/>
						)}
						{contract.insuranceRequired && (
							<ReadOnlyField
								label={t(
									"projects.createProject.insuranceRequired",
								)}
								value={
									contract.insuranceDetails || "✓"
								}
							/>
						)}
						{contract.penaltyPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.penaltyPercent",
								)}
								value={`${contract.penaltyPercent}%`}
							/>
						)}
						{contract.penaltyCapPercent != null && (
							<ReadOnlyField
								label={t(
									"projects.createProject.penaltyCapPercent",
								)}
								value={`${contract.penaltyCapPercent}%`}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Helpers ─────────────────────────────────────────────────
function ReadOnlyField({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<div className="space-y-1">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="text-sm font-medium text-card-foreground">
				{value}
			</p>
		</div>
	);
}

