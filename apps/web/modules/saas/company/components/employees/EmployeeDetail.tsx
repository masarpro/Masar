"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
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
import { Pencil, Plus, Trash2, Users, Banknote, Briefcase } from "lucide-react";
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

	const { data: employee, isLoading } = useQuery(
		orpc.company.employees.getById.queryOptions({
			input: { organizationId, id: employeeId },
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
		return (
			<div className="space-y-6" dir="rtl">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
						<div className="h-24 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		);
	}

	if (!employee) return null;

	const formatCurrency = (amount: number | string) =>
		new Intl.NumberFormat("ar-SA").format(Number(amount)) + " ر.س";

	const totalSalary = Number(employee.baseSalary) + Number(employee.housingAllowance) +
		Number(employee.transportAllowance) + Number(employee.otherAllowances);

	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			ACTIVE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
			ON_LEAVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
			TERMINATED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
		};
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${styles[status] ?? ""}`}>
				{t(`company.employees.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
			</Badge>
		);
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{employee.name}</h2>
					{employee.employeeNo && (
						<p className="text-sm text-slate-500 dark:text-slate-400">{employee.employeeNo}</p>
					)}
				</div>
				<Button
					variant="outline"
					className="rounded-xl border-white/20 dark:border-slate-700/30"
					onClick={() => router.push(`/app/${organizationSlug}/company/employees/${employeeId}/edit`)}
				>
					<Pencil className="ml-2 h-4 w-4" />
					{t("company.common.edit")}
				</Button>
			</div>

			{/* Info Card */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.employees.basicInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.type")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{t(`company.employees.types.${employee.type}`)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.status")}</p>
							<div className="mt-1">{getStatusBadge(employee.status)}</div>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.joinDate")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{new Date(employee.joinDate).toLocaleDateString("ar-SA")}</p>
						</div>
						{employee.phone && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.phone")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{employee.phone}</p>
							</div>
						)}
						{employee.email && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.email")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{employee.email}</p>
							</div>
						)}
						{employee.nationalId && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.nationalId")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{employee.nationalId}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Financial Card */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
						<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.employees.financialInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.baseSalary")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(employee.baseSalary)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.housingAllowance")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(employee.housingAllowance)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.transportAllowance")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(employee.transportAllowance)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.otherAllowances")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(employee.otherAllowances)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.gosiSubscription")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(employee.gosiSubscription)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.totalCost")}</p>
							<p className="text-lg font-bold text-teal-700 dark:text-teal-300">
								{formatCurrency(totalSalary + Number(employee.gosiSubscription))}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Assignments Card */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center justify-between p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.employees.projectAssignments")}
						</h3>
					</div>
					{employee.status === "ACTIVE" && (
						<Button
							size="sm"
							variant="outline"
							className="rounded-xl border-white/20 dark:border-slate-700/30"
							onClick={() => setShowAssignForm(!showAssignForm)}
						>
							<Plus className="ml-1 h-4 w-4" />
							{t("company.employees.addAssignment")}
						</Button>
					)}
				</div>
				<div className="p-5">
					{showAssignForm && (
						<div className="mb-4 flex items-end gap-3 rounded-xl border border-white/20 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/30 p-3">
							<div className="flex-1">
								<label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">{t("company.employees.project")}</label>
								<Select value={assignProjectId} onValueChange={setAssignProjectId}>
									<SelectTrigger className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70">
										<SelectValue placeholder={t("company.employees.selectProject")} />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{projectsList?.map((p) => (
											<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="w-24">
								<label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">{t("company.employees.percentage")}</label>
								<Input
									type="number"
									min={1}
									max={100}
									value={assignPercentage}
									onChange={(e) => setAssignPercentage(e.target.value)}
									className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70"
								/>
							</div>
							<Button
								size="sm"
								className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
								onClick={() => assignMutation.mutate()}
								disabled={!assignProjectId || assignMutation.isPending}
							>
								{t("company.common.save")}
							</Button>
						</div>
					)}

					{employee.assignments?.length ? (
						<div className="space-y-2">
							{employee.assignments.map((assignment) => (
								<div
									key={assignment.id}
									className="flex items-center justify-between rounded-xl border border-white/20 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20 p-3 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
								>
									<div>
										<p className="font-medium text-slate-900 dark:text-slate-100">{assignment.project.name}</p>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{Number(assignment.percentage)}% - {formatCurrency(totalSalary * Number(assignment.percentage) / 100)}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
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
						<div className="rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-center">
							<p className="text-sm font-medium text-blue-700 dark:text-blue-300">
								{t("company.employees.generalBudget")}
							</p>
							<p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
								{t("company.employees.generalBudgetDesc")}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
