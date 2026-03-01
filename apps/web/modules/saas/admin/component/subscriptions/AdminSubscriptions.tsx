"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Card } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { useTranslations } from "next-intl";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "info"> = {
	ACTIVE: "success",
	TRIALING: "info",
	PAST_DUE: "warning",
	CANCELED: "error",
	UNPAID: "error",
	INCOMPLETE: "warning",
	PAUSED: "warning",
};

export function AdminSubscriptions() {
	const t = useTranslations();

	const { data: stats, isLoading } = useQuery(
		orpc.superAdmin.dashboard.getStats.queryOptions({ input: undefined }),
	);

	const { data: orgList } = useQuery(
		orpc.superAdmin.organizations.list.queryOptions({
			input: { limit: 100, offset: 0 },
		}),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-20 rounded-lg" />
				))}
			</div>
		);
	}

	// Group by subscription status
	const grouped: Record<string, typeof orgs> = {};
	const orgs = orgList?.organizations ?? [];
	for (const org of orgs) {
		const status = org.subscriptionStatus;
		if (!grouped[status]) grouped[status] = [];
		grouped[status].push(org);
	}

	return (
		<div className="space-y-6">
			<h2 className="font-semibold text-2xl">
				{t("admin.subscriptions.title")}
			</h2>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{stats?.planDistribution.map((item) => (
					<Card key={item.plan} className="p-4">
						<p className="text-muted-foreground text-sm">
							{item.plan}
						</p>
						<p className="font-bold text-2xl">{item.count}</p>
					</Card>
				))}
			</div>

			{Object.entries(grouped).map(([status, statusOrgs]) => (
				<Card key={status} className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<h3 className="font-semibold text-lg">{status}</h3>
						<Badge status={STATUS_BADGE[status] ?? "info"}>
							{statusOrgs.length}
						</Badge>
					</div>
					<div className="space-y-2">
						{statusOrgs.map((org) => (
							<div
								key={org.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div>
									<p className="font-medium">{org.name}</p>
									<p className="text-muted-foreground text-xs">
										{org.plan} &middot;{" "}
										{org._count.members}{" "}
										{t("admin.subscriptions.members")}{" "}
										&middot; {org._count.projects}{" "}
										{t("admin.subscriptions.projects")}
									</p>
								</div>
								<div className="text-end">
									{org.currentPeriodEnd && (
										<p className="text-muted-foreground text-xs">
											{t(
												"admin.subscriptions.renewsAt",
											)}{" "}
											{new Date(
												org.currentPeriodEnd,
											).toLocaleDateString()}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				</Card>
			))}
		</div>
	);
}
