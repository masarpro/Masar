"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Calculator,
	Hammer,
	PaintBucket,
	Zap,
	HardHat,
	MoreVertical,
	ExternalLink,
	Unlink,
	Plus,
	Link2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { LinkStudyDialog } from "./LinkStudyDialog";
import { CreateStudyDialog } from "./CreateStudyDialog";

interface QuantitiesOverviewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function formatCurrency(value: number): string {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export function QuantitiesOverview({
	organizationId,
	organizationSlug,
	projectId,
}: QuantitiesOverviewProps) {
	const t = useTranslations("projectQuantities");
	const queryClient = useQueryClient();
	const router = useRouter();

	const studyPath = (studyId: string) =>
		`/app/${organizationSlug}/pricing/studies/${studyId}`;

	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

	// Fetch summary data
	const { data: summary, isLoading: summaryLoading } = useQuery(
		orpc.projectQuantities.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch linked studies list
	const { data: studiesData, isLoading: studiesLoading } = useQuery(
		orpc.projectQuantities.listStudies.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Unlink study mutation
	const unlinkMutation = useMutation({
		mutationFn: async (studyId: string) => {
			return orpcClient.projectQuantities.unlinkStudy({
				organizationId,
				projectId,
				studyId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [["projectQuantities"]],
			});
			toast.success(t("toast.studyUnlinked"));
		},
	});

	if (summaryLoading || studiesLoading) {
		return <DashboardSkeleton />;
	}

	const studies = studiesData ?? [];
	const hasStudies = studies.length > 0;

	// Empty state
	if (!hasStudies) {
		return (
			<>
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
						<Calculator className="h-12 w-12 text-slate-400" />
					</div>
					<h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("empty.title")}
					</h2>
					<p className="mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
						{t("empty.description")}
					</p>
					<div className="flex items-center gap-3">
						<Button
							className="rounded-xl"
							onClick={() => setIsCreateDialogOpen(true)}
						>
							<Plus className="h-4 w-4 me-2" />
							{t("actions.createStudy")}
						</Button>
						<Button
							variant="outline"
							className="rounded-xl"
							onClick={() => setIsLinkDialogOpen(true)}
						>
							<Link2 className="h-4 w-4 me-2" />
							{t("actions.linkExisting")}
						</Button>
					</div>
				</div>

				<CreateStudyDialog
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					projectId={projectId}
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
				/>
				<LinkStudyDialog
					organizationId={organizationId}
					projectId={projectId}
					open={isLinkDialogOpen}
					onOpenChange={setIsLinkDialogOpen}
				/>
			</>
		);
	}

	// Summary card data
	const summaryCards = [
		{
			label: t("summary.structural"),
			value: summary?.totals?.structural ?? 0,
			icon: Hammer,
			iconBg: "bg-blue-100 dark:bg-blue-900/50",
			iconColor: "text-blue-600 dark:text-blue-400",
		},
		{
			label: t("summary.finishing"),
			value: summary?.totals?.finishing ?? 0,
			icon: PaintBucket,
			iconBg: "bg-purple-100 dark:bg-purple-900/50",
			iconColor: "text-purple-600 dark:text-purple-400",
		},
		{
			label: t("summary.mep"),
			value: summary?.totals?.mep ?? 0,
			icon: Zap,
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
		},
		{
			label: t("summary.labor"),
			value: summary?.totals?.labor ?? 0,
			icon: HardHat,
			iconBg: "bg-green-100 dark:bg-green-900/50",
			iconColor: "text-green-600 dark:text-green-400",
		},
	];

	const grandTotal = summary?.totals?.grandTotal ?? 0;

	return (
		<div className="space-y-6">
			{/* Header with actions */}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
					{t("title")}
				</h1>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={() => setIsLinkDialogOpen(true)}
					>
						<Link2 className="h-4 w-4 me-2" />
						{t("actions.linkExisting")}
					</Button>
					<Button
						className="rounded-xl"
						onClick={() => setIsCreateDialogOpen(true)}
					>
						<Plus className="h-4 w-4 me-2" />
						{t("actions.createStudy")}
					</Button>
				</div>
			</div>

			{/* Summary Cards Row */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{summaryCards.map((card) => (
					<Card key={card.label} className="rounded-2xl">
						<CardContent className="p-5">
							<div className="flex items-start gap-3">
								<div className={`rounded-xl ${card.iconBg} p-2.5`}>
									<card.icon className={`h-5 w-5 ${card.iconColor}`} />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{card.label}
									</p>
									<p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
										{formatCurrency(Number(card.value))}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Grand Total Card */}
			<Card className="rounded-2xl border-2 border-slate-200 dark:border-slate-700">
				<CardContent className="p-5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
								<Calculator className="h-5 w-5 text-slate-600 dark:text-slate-400" />
							</div>
							<p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								{t("summary.grandTotal")}
							</p>
						</div>
						<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
							{formatCurrency(grandTotal)}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Studies Table */}
			<div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
					<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
						{t("studies.title")}
					</h2>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("studies.name")}</TableHead>
							<TableHead>{t("studies.itemCount")}</TableHead>
							<TableHead>{t("studies.total")}</TableHead>
							<TableHead className="w-[60px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{studies.map((study: any) => (
							<TableRow
								key={study.id}
								className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
								onClick={() => router.push(studyPath(study.id))}
							>
								<TableCell>
									<div className="flex items-center gap-2">
										<span className="font-medium text-slate-900 dark:text-slate-100">
											{study.name}
										</span>
										{study.status && (
											<Badge
												variant="outline"
												className="rounded-full text-xs"
											>
												{study.status}
											</Badge>
										)}
									</div>
								</TableCell>
								<TableCell className="text-slate-600 dark:text-slate-400">
									{(
										(study.itemCounts?.structuralItems ?? 0) +
										(study.itemCounts?.finishingItems ?? 0) +
										(study.itemCounts?.mepItems ?? 0) +
										(study.itemCounts?.laborItems ?? 0)
									).toLocaleString("en-US")}
								</TableCell>
								<TableCell className="font-medium text-slate-900 dark:text-slate-100">
									{formatCurrency(Number(study.totalCost ?? 0))}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 rounded-lg"
												onClick={(e: any) => e.stopPropagation()}
											>
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem asChild>
												<Link
													href={studyPath(study.id)}
												>
													<ExternalLink className="h-4 w-4 me-2" />
													{t("studies.actions.open")}
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
												onClick={(e: any) => {
														e.stopPropagation();
														unlinkMutation.mutate(study.id);
													}}
												disabled={unlinkMutation.isPending}
											>
												<Unlink className="h-4 w-4 me-2" />
												{t("studies.actions.unlink")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Dialogs */}
			<CreateStudyDialog
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			/>
			<LinkStudyDialog
				organizationId={organizationId}
				projectId={projectId}
				open={isLinkDialogOpen}
				onOpenChange={setIsLinkDialogOpen}
			/>
		</div>
	);
}
