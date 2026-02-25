"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Pencil, MapPin, RotateCcw, Trash2, Package, Banknote, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface AssetDetailProps {
	organizationId: string;
	organizationSlug: string;
	assetId: string;
}

export function AssetDetail({ organizationId, organizationSlug, assetId }: AssetDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showAssignForm, setShowAssignForm] = useState(false);
	const [assignProjectId, setAssignProjectId] = useState("");

	const queryKey = orpc.company.assets.getById.queryOptions({ input: { organizationId, id: assetId } }).queryKey;

	const { data: asset, isLoading } = useQuery(
		orpc.company.assets.getById.queryOptions({
			input: { organizationId, id: assetId },
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
			return orpcClient.company.assets.assignToProject({
				organizationId,
				id: assetId,
				projectId: assignProjectId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.assets.assignSuccess"));
			queryClient.invalidateQueries({ queryKey });
			setShowAssignForm(false);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const returnMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.assets.returnToWarehouse({
				organizationId,
				id: assetId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.assets.returnSuccess"));
			queryClient.invalidateQueries({ queryKey });
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const retireMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.assets.retire({
				organizationId,
				id: assetId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.assets.retireSuccess"));
			queryClient.invalidateQueries({ queryKey });
		},
		onError: (error: Error) => toast.error(error.message),
	});

	if (isLoading) {
		return (
			<div className="space-y-6" dir="rtl">
				{[...Array(2)].map((_, i) => (
					<div key={i} className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
						<div className="h-24 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		);
	}

	if (!asset) return null;

	const formatCurrency = (amount: number | string | null | undefined) => {
		if (!amount) return "-";
		return new Intl.NumberFormat("ar-SA").format(Number(amount)) + " ر.س";
	};

	const getStatusStyle = (status: string) => {
		const styles: Record<string, string> = {
			AVAILABLE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
			IN_USE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			MAINTENANCE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
			RETIRED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
		};
		return styles[status] ?? styles.RETIRED;
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{asset.name}</h2>
					<div className="flex items-center gap-2 mt-1">
						{asset.assetNo && (
							<Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 text-[10px] px-2 py-0.5">
								{asset.assetNo}
							</Badge>
						)}
						<Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0 text-[10px] px-2 py-0.5">
							{t(`company.assets.categories.${asset.category}`)}
						</Badge>
						<Badge className={`border-0 text-[10px] px-2 py-0.5 ${getStatusStyle(asset.status)}`}>
							{t(`company.assets.statuses.${asset.status}`)}
						</Badge>
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="rounded-xl border-white/20 dark:border-slate-700/30"
						onClick={() => router.push(`/app/${organizationSlug}/company/assets/${assetId}/edit`)}
					>
						<Pencil className="ml-2 h-4 w-4" />
						{t("company.common.edit")}
					</Button>
					{asset.status !== "RETIRED" && (
						<Button
							variant="outline"
							className="rounded-xl border-red-200/50 dark:border-red-800/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
							onClick={() => {
								if (confirm(t("company.assets.confirmRetire"))) retireMutation.mutate();
							}}
						>
							<Trash2 className="ml-2 h-4 w-4" />
							{t("company.assets.retire")}
						</Button>
					)}
				</div>
			</div>

			{/* Info */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.assets.basicInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.type")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{t(`company.assets.types.${asset.type}`)}</p>
						</div>
						{asset.brand && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.brand")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{asset.brand}</p>
							</div>
						)}
						{asset.model && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.model")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{asset.model}</p>
							</div>
						)}
						{asset.serialNumber && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.serialNumber")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{asset.serialNumber}</p>
							</div>
						)}
						{asset.year && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.year")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{asset.year}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Financial */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
						<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.assets.financialInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.purchasePrice")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(asset.purchasePrice)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.monthlyRent")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(asset.monthlyRent)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.currentValue")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(asset.currentValue)}</p>
						</div>
						{asset.purchaseDate && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.purchaseDate")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{new Date(asset.purchaseDate).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
						{asset.warrantyExpiry && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.warrantyExpiry")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{new Date(asset.warrantyExpiry).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
						{asset.insuranceExpiry && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.insuranceExpiry")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{new Date(asset.insuranceExpiry).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Assignment */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
						<Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.assets.projectAssignment")}
					</h3>
				</div>
				<div className="p-5">
					{asset.currentProject ? (
						<div className="flex items-center justify-between rounded-xl border border-white/20 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20 p-4">
							<div>
								<p className="font-medium text-slate-900 dark:text-slate-100">{asset.currentProject.name}</p>
								{asset.assignedAt && (
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{t("company.assets.assignedSince")} {new Date(asset.assignedAt).toLocaleDateString("ar-SA")}
									</p>
								)}
							</div>
							<Button
								variant="outline"
								className="rounded-xl border-white/20 dark:border-slate-700/30"
								onClick={() => returnMutation.mutate()}
								disabled={returnMutation.isPending}
							>
								<RotateCcw className="ml-2 h-4 w-4" />
								{t("company.assets.returnToWarehouse")}
							</Button>
						</div>
					) : asset.status !== "RETIRED" ? (
						<div>
							{showAssignForm ? (
								<div className="flex items-end gap-3 rounded-xl border border-white/20 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20 p-3">
									<div className="flex-1">
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
									<Button
										className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
										onClick={() => assignMutation.mutate()}
										disabled={!assignProjectId || assignMutation.isPending}
									>
										{t("company.assets.assign")}
									</Button>
								</div>
							) : (
								<Button
									variant="outline"
									className="rounded-xl border-white/20 dark:border-slate-700/30"
									onClick={() => setShowAssignForm(true)}
								>
									<MapPin className="ml-2 h-4 w-4" />
									{t("company.assets.assignToProject")}
								</Button>
							)}
						</div>
					) : (
						<p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
							{t("company.assets.retiredCannotAssign")}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
