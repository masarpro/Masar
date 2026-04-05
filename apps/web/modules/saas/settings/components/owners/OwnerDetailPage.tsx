"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { toast } from "sonner";
import {
	ArrowRight,
	ArrowLeft,
	UserRound,
	Percent,
	CreditCard,
	Phone,
	Mail,
	FileText,
	Hash,
	Ban,
	ExternalLink,
} from "lucide-react";

interface OwnerDetailPageProps {
	organizationId: string;
	organizationSlug: string;
	ownerId: string;
}

export function OwnerDetailPage({
	organizationId,
	organizationSlug,
	ownerId,
}: OwnerDetailPageProps) {
	const t = useTranslations("settings.owners");
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/settings/owners`;
	const [deactivateOpen, setDeactivateOpen] = useState(false);

	// Fetch owner details
	const { data: owner, isLoading } = useQuery(
		orpc.accounting.owners.getById.queryOptions({
			input: { organizationId, id: ownerId },
		}),
	);

	// Deactivate mutation
	const deactivateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.accounting.owners.deactivate({
				organizationId,
				id: ownerId,
			});
		},
		onSuccess: () => {
			toast.success(t("deactivateSuccess"));
			queryClient.invalidateQueries({
				queryKey: orpc.accounting.owners.list.queryOptions({
					input: { organizationId, includeInactive: true },
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.accounting.owners.getTotalOwnership.queryOptions({
					input: { organizationId },
				}).queryKey,
			});
			router.push(basePath);
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-64 w-full rounded-xl" />
				<Skeleton className="h-32 w-full rounded-xl" />
			</div>
		);
	}

	if (!owner) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
				<p className="text-lg">{t("noOwners")}</p>
				<Button
					variant="ghost"
					className="mt-4"
					onClick={() => router.push(basePath)}
				>
					{t("backToList")}
				</Button>
			</div>
		);
	}

	const drawingsPath = `/app/${organizationSlug}/finance/owner-drawings?ownerId=${ownerId}`;

	const infoItems = [
		{
			icon: UserRound,
			label: t("name"),
			value: owner.name,
			secondary: owner.nameEn,
		},
		{
			icon: Percent,
			label: t("ownershipPercent"),
			value: `${owner.ownershipPercent.toFixed(2)}%`,
		},
		{
			icon: CreditCard,
			label: t("drawingsAccount"),
			value: owner.drawingsAccount
				? `${owner.drawingsAccount.code} — ${owner.drawingsAccount.nameAr}`
				: "—",
		},
		{
			icon: Hash,
			label: t("nationalId"),
			value: owner.nationalId || "—",
		},
		{
			icon: Phone,
			label: t("phone"),
			value: owner.phone || "—",
		},
		{
			icon: Mail,
			label: t("email"),
			value: owner.email || "—",
		},
		{
			icon: FileText,
			label: t("notes"),
			value: owner.notes || "—",
		},
	];

	return (
		<div className="space-y-6">
			{/* Back button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={() => router.push(basePath)}
			>
				<ArrowRight className="h-4 w-4 me-1 rtl:hidden" />
				<ArrowLeft className="h-4 w-4 me-1 hidden rtl:block" />
				{t("backToList")}
			</Button>

			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<h2 className="text-xl font-bold">{owner.name}</h2>
					<Badge
						variant={owner.isActive ? "default" : "secondary"}
						className={
							owner.isActive
								? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
								: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
						}
					>
						{owner.isActive ? t("active") : t("inactive")}
					</Badge>
				</div>
				{owner.isActive && (
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setDeactivateOpen(true)}
					>
						<Ban className="h-4 w-4 me-2" />
						{t("deactivate")}
					</Button>
				)}
			</div>

			{/* Owner Info Card */}
			<Card>
				<CardHeader>
					<CardTitle>{t("ownerInfo")}</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-4 sm:grid-cols-2">
						{infoItems.map((item) => (
							<div
								key={item.label}
								className="flex items-start gap-3"
							>
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
									<item.icon className="h-4 w-4 text-muted-foreground" />
								</div>
								<div className="min-w-0">
									<dt className="text-xs text-muted-foreground">
										{item.label}
									</dt>
									<dd className="text-sm font-medium break-all">
										{item.value}
									</dd>
									{item.secondary && (
										<dd className="text-xs text-muted-foreground">
											{item.secondary}
										</dd>
									)}
								</div>
							</div>
						))}
					</dl>
				</CardContent>
			</Card>

			{/* Drawings Summary Card */}
			<Card>
				<CardHeader>
					<CardTitle>{t("drawingsSummary")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-lg border border-border p-4">
							<p className="text-xs text-muted-foreground">
								{t("totalDrawings")}
							</p>
							<p className="text-2xl font-bold tabular-nums mt-1">
								{new Intl.NumberFormat("en-SA", {
									style: "currency",
									currency: "SAR",
								}).format(owner.totalDrawings)}
							</p>
						</div>
					</div>

					<Button
						variant="outline"
						className="mt-4"
						onClick={() => router.push(drawingsPath)}
					>
						<ExternalLink className="h-4 w-4 me-2" />
						{t("viewDrawings")}
					</Button>
				</CardContent>
			</Card>

			{/* Deactivate Dialog */}
			<AlertDialog
				open={deactivateOpen}
				onOpenChange={setDeactivateOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("deactivateConfirm")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deactivateDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("backToList")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deactivateMutation.mutate()}
							disabled={deactivateMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deactivateMutation.isPending
								? "..."
								: t("deactivate")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
