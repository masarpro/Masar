"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { CloudIcon, EditIcon, UsersIcon, FolderIcon, HardDriveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { EditPlanDialog } from "./EditPlanDialog";

export function AdminPlans() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [editPlan, setEditPlan] = useState<any>(null);

	const { data: plans, isLoading } = useQuery(
		orpc.superAdmin.plans.list.queryOptions({}),
	);

	const syncMutation = useMutation({
		mutationFn: (plan: "FREE" | "PRO") =>
			orpc.superAdmin.plans.syncToStripe.call({ plan }),
		onSuccess: () => {
			toast.success(t("admin.plans.syncSuccess"));
		},
		onError: () => {
			toast.error(t("admin.plans.syncFailed"));
		},
	});

	if (isLoading) {
		return (
			<div className="grid gap-6 md:grid-cols-2">
				<Skeleton className="h-64 rounded-lg" />
				<Skeleton className="h-64 rounded-lg" />
			</div>
		);
	}

	return (
		<>
			<div className="space-y-6">
				<h2 className="font-semibold text-2xl">{t("admin.plans.title")}</h2>
				<div className="grid gap-6 md:grid-cols-2">
					{plans?.map((plan) => {
						const name = plan.name as { en: string; ar: string };
						const features = plan.features as {
							en: string[];
							ar: string[];
						};
						return (
							<Card key={plan.id} className="p-6">
								<div className="flex items-start justify-between">
									<div>
										<h3 className="font-bold text-xl">
											{name.ar} / {name.en}
										</h3>
										<div className="mt-1 flex gap-2">
											<Badge
												status={
													plan.plan === "PRO"
														? "success"
														: "info"
												}
											>
												{plan.plan}
											</Badge>
											{plan.isActive && (
												<Badge variant="outline">
													{t("admin.plans.active")}
												</Badge>
											)}
										</div>
									</div>
									<Button
										variant="outline"
										size="icon"
										onClick={() => setEditPlan(plan)}
									>
										<EditIcon className="size-4" />
									</Button>
								</div>

								<div className="mt-4 grid grid-cols-3 gap-4 text-center">
									<div>
										<UsersIcon className="mx-auto size-5 text-muted-foreground mb-1" />
										<p className="font-bold text-lg">
											{plan.maxUsers}
										</p>
										<p className="text-muted-foreground text-xs">
											{t("admin.plans.maxUsers")}
										</p>
									</div>
									<div>
										<FolderIcon className="mx-auto size-5 text-muted-foreground mb-1" />
										<p className="font-bold text-lg">
											{plan.maxProjects}
										</p>
										<p className="text-muted-foreground text-xs">
											{t("admin.plans.maxProjects")}
										</p>
									</div>
									<div>
										<HardDriveIcon className="mx-auto size-5 text-muted-foreground mb-1" />
										<p className="font-bold text-lg">
											{plan.maxStorageGB} GB
										</p>
										<p className="text-muted-foreground text-xs">
											{t("admin.plans.maxStorage")}
										</p>
									</div>
								</div>

								<div className="mt-4 border-t pt-4">
									<div className="flex justify-between text-sm">
										<span>{t("admin.plans.monthlyPrice")}</span>
										<span className="font-bold">
											{plan.monthlyPrice} SAR
										</span>
									</div>
									<div className="flex justify-between text-sm mt-1">
										<span>{t("admin.plans.yearlyPrice")}</span>
										<span className="font-bold">
											{plan.yearlyPrice} SAR
										</span>
									</div>
								</div>

								<div className="mt-4 border-t pt-4">
									<p className="font-medium text-sm mb-2">
										{t("admin.plans.features")}
									</p>
									<ul className="space-y-1 text-sm text-muted-foreground">
										{features.ar.map(
											(feature: string, idx: number) => (
												<li key={idx}>• {feature}</li>
											),
										)}
									</ul>
								</div>

								{plan.plan === "PRO" && (
									<div className="mt-4 border-t pt-4">
										<Button
											variant="outline"
											size="sm"
											className="w-full"
											onClick={() =>
												syncMutation.mutate("PRO")
											}
											disabled={syncMutation.isPending}
										>
											<CloudIcon className="me-2 size-4" />
											{t("admin.plans.syncToStripe")}
										</Button>
									</div>
								)}
							</Card>
						);
					})}
				</div>
			</div>

			{editPlan && (
				<EditPlanDialog
					open={!!editPlan}
					onOpenChange={(open) => !open && setEditPlan(null)}
					planConfig={editPlan}
				/>
			)}
		</>
	);
}
