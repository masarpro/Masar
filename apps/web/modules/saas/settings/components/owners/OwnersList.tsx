"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import {
	UsersRound,
	Plus,
	AlertTriangle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

interface OwnersListProps {
	organizationId: string;
	organizationSlug: string;
}

export function OwnersList({
	organizationId,
	organizationSlug,
}: OwnersListProps) {
	const t = useTranslations("settings.owners");
	const router = useRouter();
	const basePath = `/app/${organizationSlug}/settings/owners`;

	// Fetch owners
	const { data: owners, isLoading: ownersLoading } = useQuery(
		orpc.accounting.owners.list.queryOptions({
			input: { organizationId, includeInactive: true },
		}),
	);

	// Fetch total ownership
	const { data: ownership, isLoading: ownershipLoading } = useQuery(
		orpc.accounting.owners.getTotalOwnership.queryOptions({
			input: { organizationId },
		}),
	);

	const isLoading = ownersLoading || ownershipLoading;
	const totalPercent = ownership?.totalPercent ?? 0;
	const remaining = ownership?.remaining ?? 100;

	// Determine progress bar color
	const getProgressColor = () => {
		if (totalPercent === 100) return "bg-green-500";
		if (totalPercent > 100) return "bg-red-500";
		return "bg-amber-500";
	};

	const getProgressBgColor = () => {
		if (totalPercent === 100) return "bg-green-100 dark:bg-green-900/20";
		if (totalPercent > 100) return "bg-red-100 dark:bg-red-900/20";
		return "bg-amber-100 dark:bg-amber-900/20";
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-32" />
				</div>
				<Skeleton className="h-20 w-full rounded-xl" />
				<Skeleton className="h-64 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<UsersRound className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h2 className="text-xl font-bold">{t("title")}</h2>
						<p className="text-sm text-muted-foreground">
							{t("description")}
						</p>
					</div>
				</div>
				<Button onClick={() => router.push(`${basePath}/new`)}>
					<Plus className="h-4 w-4 me-2" />
					{t("addOwner")}
				</Button>
			</div>

			{/* Ownership Progress */}
			<Card>
				<CardContent className="pt-6">
					<div className="space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium">
								{t("totalOwnership")}
							</span>
							<span className="font-bold tabular-nums">
								{totalPercent.toFixed(2)}%
							</span>
						</div>

						{/* Progress bar */}
						<div
							className={`h-3 w-full overflow-hidden rounded-full ${getProgressBgColor()}`}
						>
							<div
								className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
								style={{
									width: `${Math.min(totalPercent, 100)}%`,
								}}
							/>
						</div>

						{/* Status message */}
						<div className="flex items-center gap-2 text-sm">
							{totalPercent === 100 ? (
								<>
									<CheckCircle2 className="h-4 w-4 text-green-600" />
									<span className="text-green-700 dark:text-green-400">
										{t("ownershipComplete")}
									</span>
								</>
							) : totalPercent > 100 ? (
								<>
									<AlertTriangle className="h-4 w-4 text-red-600" />
									<span className="text-red-700 dark:text-red-400">
										{t("ownershipExceeded")}
									</span>
								</>
							) : (
								<>
									<AlertTriangle className="h-4 w-4 text-amber-600" />
									<span className="text-amber-700 dark:text-amber-400">
										{t("ownershipWarning")} —{" "}
										{t("remaining")}: {remaining.toFixed(2)}
										%
									</span>
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Owners Table */}
			{!owners || owners.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<UsersRound className="h-12 w-12 text-muted-foreground/40 mb-4" />
						<p className="text-lg font-medium text-muted-foreground">
							{t("noOwners")}
						</p>
						<p className="text-sm text-muted-foreground/70 mt-1">
							{t("noOwnersDesc")}
						</p>
						<Button
							className="mt-4"
							onClick={() => router.push(`${basePath}/new`)}
						>
							<Plus className="h-4 w-4 me-2" />
							{t("addOwner")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-start">
										{t("name")}
									</TableHead>
									<TableHead className="text-start">
										{t("ownershipPercent")}
									</TableHead>
									<TableHead className="text-start">
										{t("accountCode")}
									</TableHead>
									<TableHead className="text-start">
										{t("status")}
									</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{owners.map((owner) => (
									<TableRow
										key={owner.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() =>
											router.push(
												`${basePath}/${owner.id}`,
											)
										}
									>
										<TableCell>
											<div>
												<p className="font-medium">
													{owner.name}
												</p>
												{owner.nameEn && (
													<p className="text-xs text-muted-foreground">
														{owner.nameEn}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell className="tabular-nums font-medium">
											{owner.ownershipPercent.toFixed(2)}%
										</TableCell>
										<TableCell className="font-mono text-sm text-muted-foreground">
											{owner.drawingsAccount?.code ??
												"—"}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													owner.isActive
														? "default"
														: "secondary"
												}
												className={
													owner.isActive
														? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
														: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
												}
											>
												{owner.isActive
													? t("active")
													: t("inactive")}
											</Badge>
										</TableCell>
										<TableCell>
											<ChevronLeft className="h-4 w-4 text-muted-foreground rtl:hidden" />
											<ChevronRight className="h-4 w-4 text-muted-foreground hidden rtl:block" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
