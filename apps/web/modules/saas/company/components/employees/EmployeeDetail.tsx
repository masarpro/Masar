"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Pencil, Plus, Trash2, Users, Banknote, Briefcase, History } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface EmployeeDetailProps {
	organizationId: string;
	organizationSlug: string;
	employeeId: string;
}

export function EmployeeDetail({ organizationId, organizationSlug, employeeId }: EmployeeDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showAssignForm, setShowAssignForm] = useState(false);
	const [assignProjectId, setAssignProjectId] = useState("");
	const [assignPercentage, setAssignPercentage] = useState("50");

	const [historyPage, setHistoryPage] = useState(1);

	const { data: employee, isLoading } = useQuery(
		orpc.company.employees.getById.queryOptions({
			input: { organizationId, id: employeeId },
		}),
	);

	const { data: historyData } = useQuery(
		orpc.company.employees.history.queryOptions({
			input: { organizationId, employeeId, page: historyPage, pageSize: 10 },
		}),
	);

	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" },
		}),
	);

	const projectsList = projectsData?.projects;

	const assignMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.employees.assignments.assign({
				organizationId,
				employeeId,
				projectId: assignProjectId,
				percentage: Number(assignPercentage),
				startDate: new Date(),
			});
		},
		onSuccess: () => {
			toast.success(t("company.employees.assignSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.getById.queryOptions({ input: { organizationId, id: employeeId } }).queryKey });
			setShowAssignForm(false);
			setAssignProjectId("");
			setAssignPercentage("50");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const removeAssignmentMutation = useMutation({
		mutationFn: async (assignmentId: string) => {
			return orpcClient.company.employees.assignments.remove({
				organizationId,
				id: assignmentId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.employees.removeAssignmentSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.getById.queryOptions({ input: { organizationId, id: employeeId } }).queryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	if (isLoading) {
		return <DetailPageSkeleton />;
	}

	if (!employee) return null;

	const formatCurrency = (amount: number | string) =>
		formatCurrencySuffixed(Number(amount), t("common.sar"), 0);

	const totalSalary = Number(employee.baseSalary) + Number(employee.housingAllowance) +
		Number(employee.transportAllowance) + Number(employee.otherAllowances);

	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			ACTIVE: "bg-chart-4/15 text-chart-4",
			ON_LEAVE: "bg-chart-1/15 text-chart-1",
			TERMINATED: "bg-muted text-muted-foreground",
		};
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${styles[status] ?? ""}`}>
				{t(`company.employees.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-card-foreground">{employee.name}</h2>
					{employee.employeeNo && (
						<p className="text-sm text-muted-foreground">{employee.employeeNo}</p>
					)}
				</div>
				<Button
					variant="outline"
					className="rounded-lg"
					onClick={() => router.push(`/app/${organizationSlug}/company/employees/${employeeId}/edit`)}
				>
					<Pencil className="ms-2 h-4 w-4" />
					{t("company.common.edit")}
				</Button>
			</div>

			{/* Info Card */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Users className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.employees.basicInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.type")}</p>
							<p className="font-medium text-card-foreground">{t(`company.employees.types.${employee.type}`)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.status")}</p>
							<div className="mt-1">{getStatusBadge(employee.status)}</div>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.joinDate")}</p>
							<p className="font-medium text-card-foreground">{new Date(employee.joinDate).toLocaleDateString("ar-SA")}</p>
						</div>
						{employee.phone && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.employees.phone")}</p>
								<p className="font-medium text-card-foreground">{employee.phone}</p>
							</div>
						)}
						{employee.email && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.employees.email")}</p>
								<p className="font-medium text-card-foreground">{employee.email}</p>
							</div>
						)}
						{employee.nationalId && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.employees.nationalId")}</p>
								<p className="font-medium text-card-foreground">{employee.nationalId}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Financial Card */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Banknote className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.employees.financialInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.baseSalary")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(employee.baseSalary))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.housingAllowance")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(employee.housingAllowance))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.transportAllowance")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(employee.transportAllowance))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.otherAllowances")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(employee.otherAllowances))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.gosiSubscription")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(employee.gosiSubscription))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.employees.totalCost")}</p>
							<p className="text-lg font-bold text-chart-4">
								{formatCurrency(totalSalary + Number(employee.gosiSubscription))}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Assignments Card */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center justify-between p-5 border-b-2">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Briefcase className="h-5 w-5" />
						</div>
						<h3 className="text-sm font-semibold text-card-foreground">
							{t("company.employees.projectAssignments")}
						</h3>
					</div>
					{employee.status === "ACTIVE" && (
						<Button
							size="sm"
							variant="outline"
							className="rounded-lg"
							onClick={() => setShowAssignForm(!showAssignForm)}
						>
							<Plus className="ms-1 h-4 w-4" />
							{t("company.employees.addAssignment")}
						</Button>
					)}
				</div>
				<div className="p-5">
					{showAssignForm && (
						<div className="mb-4 flex items-end gap-3 rounded-xl border-2 bg-muted/50 p-3">
							<div className="flex-1">
								<label className="mb-1 block text-sm text-muted-foreground">{t("company.employees.project")}</label>
								<Select value={assignProjectId} onValueChange={setAssignProjectId}>
									<SelectTrigger className="rounded-lg border border-input bg-card">
										<SelectValue placeholder={t("company.employees.selectProject")} />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{projectsList?.map((p: any) => (
											<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="w-24">
								<label className="mb-1 block text-sm text-muted-foreground">{t("company.employees.percentage")}</label>
								<Input
									type="number"
									min={1}
									max={100}
									value={assignPercentage}
									onChange={(e: any) => setAssignPercentage(e.target.value)}
									className="rounded-lg border border-input bg-card"
								/>
							</div>
							<Button
								size="sm"
								className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
								onClick={() => assignMutation.mutate()}
								disabled={!assignProjectId || assignMutation.isPending}
							>
								{t("company.common.save")}
							</Button>
						</div>
					)}

					{employee.assignments?.length ? (
						<div className="space-y-2">
							{employee.assignments.map((assignment: any) => (
								<div
									key={assignment.id}
									className="flex items-center justify-between rounded-xl border-2 bg-muted/50 p-3 transition-colors hover:bg-accent"
								>
									<div>
										<p className="font-medium text-card-foreground">{assignment.project.name}</p>
										<p className="text-sm text-muted-foreground">
											{Number(assignment.percentage)}% - {formatCurrency(totalSalary * Number(assignment.percentage) / 100)}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="rounded-lg hover:bg-destructive/10"
										onClick={() => {
											if (confirm(t("company.employees.confirmRemoveAssignment"))) {
												removeAssignmentMutation.mutate(assignment.id);
											}
										}}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-xl border-2 border-chart-4/30 bg-chart-4/15 p-4 text-center">
							<p className="text-sm font-medium text-chart-4">
								{t("company.employees.generalBudget")}
							</p>
							<p className="text-xs text-chart-4/70 mt-1">
								{t("company.employees.generalBudgetDesc")}
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Change History Card */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
						<History className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.employees.changeHistory.title")}
					</h3>
				</div>
				<div className="p-5">
					{historyData && historyData.changes.length > 0 ? (
						<>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b-2">
											<th className="pb-2 text-end text-xs font-medium text-muted-foreground">{t("company.employees.changeHistory.date")}</th>
											<th className="pb-2 text-end text-xs font-medium text-muted-foreground">{t("company.employees.changeHistory.changeType")}</th>
											<th className="pb-2 text-end text-xs font-medium text-muted-foreground">{t("company.employees.changeHistory.field")}</th>
											<th className="pb-2 text-end text-xs font-medium text-muted-foreground">{t("company.employees.changeHistory.oldValue")}</th>
											<th className="pb-2 text-end text-xs font-medium text-muted-foreground">{t("company.employees.changeHistory.newValue")}</th>
										</tr>
									</thead>
									<tbody>
										{historyData.changes.map((change: any) => (
											<tr key={change.id} className="border-b-2 last:border-0">
												<td className="py-2.5 text-muted-foreground whitespace-nowrap">
													{new Date(change.createdAt).toLocaleDateString("ar-SA")}
												</td>
												<td className="py-2.5">
													<Badge className="border-0 text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
														{t(`company.employees.changeHistory.types.${change.changeType}`)}
													</Badge>
												</td>
												<td className="py-2.5 text-muted-foreground">
													{t(`company.employees.changeHistory.fields.${change.fieldName}`)}
												</td>
												<td className="py-2.5 text-destructive line-through">
													{change.oldValue ?? "-"}
												</td>
												<td className="py-2.5 text-chart-4 font-medium">
													{change.newValue ?? "-"}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{historyData.total > 10 && (
								<div className="flex items-center justify-center gap-2 mt-4">
									<Button
										variant="outline"
										size="sm"
										className="rounded-xl"
										disabled={historyPage <= 1}
										onClick={() => setHistoryPage((p) => p - 1)}
									>
										{t("common.previous")}
									</Button>
									<span className="text-sm text-muted-foreground">
										{historyPage} / {Math.ceil(historyData.total / 10)}
									</span>
									<Button
										variant="outline"
										size="sm"
										className="rounded-xl"
										disabled={historyPage >= Math.ceil(historyData.total / 10)}
										onClick={() => setHistoryPage((p) => p + 1)}
									>
										{t("common.next")}
									</Button>
								</div>
							)}
						</>
					) : (
						<div className="rounded-xl border-2 border-chart-1/30 bg-chart-1/15 p-4 text-center">
							<p className="text-sm font-medium text-chart-1">
								{t("company.employees.changeHistory.noChanges")}
							</p>
							<p className="text-xs text-chart-1/70 mt-1">
								{t("company.employees.changeHistory.noChangesDesc")}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
