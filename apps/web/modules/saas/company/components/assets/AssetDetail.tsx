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
		return <DetailPageSkeleton />;
	}

	if (!asset) return null;

	const formatCurrency = (amount: number | string | null | undefined | unknown) => {
		if (!amount) return "-";
		return formatCurrencySuffixed(Number(amount), t("common.sar"), 0);
	};

	const getStatusStyle = (status: string) => {
		const styles: Record<string, string> = {
			AVAILABLE: "bg-chart-4/15 text-chart-4",
			IN_USE: "bg-chart-4/15 text-chart-4",
			MAINTENANCE: "bg-chart-1/15 text-chart-1",
			RETIRED: "bg-muted text-muted-foreground",
		};
		return styles[status] ?? styles.RETIRED;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-card-foreground">{asset.name}</h2>
					<div className="flex items-center gap-2 mt-1">
						{asset.assetNo && (
							<Badge className="bg-chart-4/15 text-chart-4 border-0 text-[10px] px-2 py-0.5">
								{asset.assetNo}
							</Badge>
						)}
						<Badge className="bg-chart-4/15 text-chart-4 border-0 text-[10px] px-2 py-0.5">
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
						className="rounded-lg"
						onClick={() => router.push(`/app/${organizationSlug}/company/assets/${assetId}/edit`)}
					>
						<Pencil className="ms-2 h-4 w-4" />
						{t("company.common.edit")}
					</Button>
					{asset.status !== "RETIRED" && (
						<Button
							variant="outline"
							className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
							onClick={() => {
								if (confirm(t("company.assets.confirmRetire"))) retireMutation.mutate();
							}}
						>
							<Trash2 className="ms-2 h-4 w-4" />
							{t("company.assets.retire")}
						</Button>
					)}
				</div>
			</div>

			{/* Info */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Package className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.assets.basicInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">{t("company.assets.type")}</p>
							<p className="font-medium text-card-foreground">{t(`company.assets.types.${asset.type}`)}</p>
						</div>
						{asset.brand && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.assets.brand")}</p>
								<p className="font-medium text-card-foreground">{asset.brand}</p>
							</div>
						)}
						{asset.model && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.assets.model")}</p>
								<p className="font-medium text-card-foreground">{asset.model}</p>
							</div>
						)}
						{asset.serialNumber && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.assets.serialNumber")}</p>
								<p className="font-medium text-card-foreground">{asset.serialNumber}</p>
							</div>
						)}
						{asset.year && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.assets.year")}</p>
								<p className="font-medium text-card-foreground">{asset.year}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Financial */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Banknote className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.assets.financialInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">{t("company.assets.purchasePrice")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(asset.purchasePrice))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.assets.monthlyRent")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(asset.monthlyRent))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.assets.currentValue")}</p>
							<p className="font-medium text-card-foreground">{formatCurrency(Number(asset.currentValue))}</p>
						</div>
						{asset.purchaseDate && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.assets.purchaseDate")}</p>
								<p className="font-medium text-card-foreground">{new Date(asset.purchaseDate).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
						{asset.warrantyExpiry && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.assets.warrantyExpiry")}</p>
								<p className="font-medium text-card-foreground">{new Date(asset.warrantyExpiry).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
						{asset.insuranceExpiry && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.assets.insuranceExpiry")}</p>
								<p className="font-medium text-card-foreground">{new Date(asset.insuranceExpiry).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Assignment */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Briefcase className="h-5 w-5" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.assets.projectAssignment")}
					</h3>
				</div>
				<div className="p-5">
					{asset.currentProject ? (
						<div className="flex items-center justify-between rounded-xl border-2 bg-muted/50 p-4">
							<div>
								<p className="font-medium text-card-foreground">{asset.currentProject.name}</p>
								{asset.assignedAt && (
									<p className="text-sm text-muted-foreground">
										{t("company.assets.assignedSince")} {new Date(asset.assignedAt).toLocaleDateString("ar-SA")}
									</p>
								)}
							</div>
							<Button
								variant="outline"
								className="rounded-lg"
								onClick={() => returnMutation.mutate()}
								disabled={returnMutation.isPending}
							>
								<RotateCcw className="ms-2 h-4 w-4" />
								{t("company.assets.returnToWarehouse")}
							</Button>
						</div>
					) : asset.status !== "RETIRED" ? (
						<div>
							{showAssignForm ? (
								<div className="flex items-end gap-3 rounded-xl border-2 bg-muted/50 p-3">
									<div className="flex-1">
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
									<Button
										className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
										onClick={() => assignMutation.mutate()}
										disabled={!assignProjectId || assignMutation.isPending}
									>
										{t("company.assets.assign")}
									</Button>
								</div>
							) : (
								<Button
									variant="outline"
									className="rounded-lg"
									onClick={() => setShowAssignForm(true)}
								>
									<MapPin className="ms-2 h-4 w-4" />
									{t("company.assets.assignToProject")}
								</Button>
							)}
						</div>
					) : (
						<p className="text-center text-sm text-muted-foreground py-4">
							{t("company.assets.retiredCannotAssign")}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
