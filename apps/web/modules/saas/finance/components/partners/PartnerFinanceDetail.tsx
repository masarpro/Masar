"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@ui/components/tabs";
import {
	ArrowLeft,
	Banknote,
	Building,
	Calendar,
	Receipt,
	TrendingUp,
	Wallet,
	BarChart3,
} from "lucide-react";
import { Currency } from "../shared/Currency";
import { formatDate } from "@shared/lib/formatters";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { usePartnerAccess } from "@saas/organizations/hooks/use-partner-access";

interface PartnerFinanceDetailProps {
	organizationId: string;
	organizationSlug: string;
	partnerId: string;
}

export function PartnerFinanceDetail({
	organizationId,
	organizationSlug,
	partnerId,
}: PartnerFinanceDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const { canViewProfits, canViewNetBalance, level } = usePartnerAccess();
	const [tab, setTab] = useState("drawings");

	const basePath = `/app/${organizationSlug}/finance/partners`;

	const { data: rawData, isLoading } = useQuery(
		orpc.accounting.partners.detail.queryOptions({
			input: { organizationId, id: partnerId },
		}),
	);
	const data = rawData as any;

	if (isLoading || !data) return <ListTableSkeleton rows={6} cols={3} />;

	const owner = data.owner;
	const summary = data.summary;
	const drawings = data.drawings as any[];
	const contributions = data.contributions as any[];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Button
					variant="ghost"
					className="rounded-xl"
					onClick={() => router.push(basePath)}
				>
					<ArrowLeft className="me-2 h-4 w-4" />
					{t("common.back")}
				</Button>
				<div className="flex flex-wrap items-center gap-2">
					<Button asChild variant="outline" size="sm" className="rounded-xl">
						<Link
							href={`/app/${organizationSlug}/finance/owner-drawings/new?ownerId=${partnerId}`}
						>
							<Banknote className="me-2 h-4 w-4" />
							{t("finance.partners.actions.newDrawing")}
						</Link>
					</Button>
					<Button asChild variant="outline" size="sm" className="rounded-xl">
						<Link
							href={`/app/${organizationSlug}/finance/capital-contributions/new?ownerId=${partnerId}`}
						>
							<TrendingUp className="me-2 h-4 w-4" />
							{t("finance.partners.actions.newContribution")}
						</Link>
					</Button>
				</div>
			</div>

			{/* Owner info */}
			<Card className="rounded-2xl">
				<CardContent className="p-4 sm:p-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="min-w-0">
							<h1 className="text-xl sm:text-2xl font-semibold break-words">{owner.name}</h1>
							{owner.nameEn && (
								<p className="text-sm text-muted-foreground">{owner.nameEn}</p>
							)}
							<div className="mt-2 flex items-center gap-2">
								<Badge variant="outline" className="rounded-lg">
									{t("finance.partners.ownershipPercent")}:{" "}
									{new Intl.NumberFormat("en-US", {
										maximumFractionDigits: 2,
									}).format(owner.ownershipPercent)}
									%
								</Badge>
								{!owner.isActive && (
									<Badge className="rounded-lg bg-muted text-muted-foreground border-0">
										{t("common.inactive")}
									</Badge>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Summary cards */}
			<div
				className={`grid grid-cols-2 gap-3 sm:gap-4 ${
					canViewProfits ? "lg:grid-cols-4" : "sm:grid-cols-2"
				}`}
			>
				<SummaryCard
					icon={<Wallet className="h-5 w-5 text-chart-4" />}
					bg="bg-chart-4/15 dark:bg-chart-4/20"
					label={t("finance.partners.totalContributions")}
					value={summary.totalContributions}
					hint={`${summary.contributionsCount} ${t("finance.partners.detail.contributionsCount")}`}
				/>
				<SummaryCard
					icon={<Banknote className="h-5 w-5 text-destructive" />}
					bg="bg-destructive/15"
					label={t("finance.partners.totalDrawings")}
					value={summary.totalDrawings}
					hint={`${summary.drawingsCount} ${t("finance.partners.detail.drawingsCount")}`}
				/>
				{canViewProfits && summary.shareOfProfit !== null && (
					<SummaryCard
						icon={<TrendingUp className="h-5 w-5 text-success" />}
						bg="bg-success/15"
						label={t("finance.partners.shareOfProfit")}
						value={summary.shareOfProfit}
					/>
				)}
				{canViewNetBalance && summary.netBalance !== null && (
					<SummaryCard
						icon={<BarChart3 className="h-5 w-5 text-chart-4" />}
						bg="bg-chart-4/15"
						label={t("finance.partners.netBalance")}
						value={summary.netBalance}
						emphasizeSign
					/>
				)}
			</div>

			{/* Tabs */}
			<Tabs value={tab} onValueChange={setTab} className="w-full">
				<div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
				<TabsList className="rounded-xl w-max min-w-full sm:w-auto sm:min-w-0">
					<TabsTrigger value="drawings" className="rounded-lg">
						{t("finance.partners.tabs.drawings")}
					</TabsTrigger>
					<TabsTrigger value="contributions" className="rounded-lg">
						{t("finance.partners.tabs.contributions")}
					</TabsTrigger>
					{canViewProfits && summary.drawingsByProject && (
						<TabsTrigger value="projects" className="rounded-lg">
							{t("finance.partners.detail.projectBreakdown")}
						</TabsTrigger>
					)}
				</TabsList>
				</div>

				<TabsContent value="drawings">
					<Card className="rounded-2xl overflow-hidden">
						<CardContent className="p-0">
							{drawings.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">
									{t("finance.partners.detail.noDrawings")}
								</div>
							) : (
								<div className="overflow-x-auto">
								<Table className="min-w-[800px]">
									<TableHeader>
										<TableRow>
											<TableHead className="whitespace-nowrap">
												{t("finance.ownerDrawings.drawingNo")}
											</TableHead>
											<TableHead className="whitespace-nowrap">{t("finance.ownerDrawings.date")}</TableHead>
											<TableHead className="whitespace-nowrap">{t("finance.ownerDrawings.bank")}</TableHead>
											<TableHead className="whitespace-nowrap">
												{t("finance.ownerDrawings.project")}
											</TableHead>
											<TableHead className="whitespace-nowrap">{t("common.status")}</TableHead>
											<TableHead className="text-end whitespace-nowrap">
												{t("finance.ownerDrawings.amount")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{drawings.map((d) => (
											<TableRow key={d.id}>
												<TableCell className="whitespace-nowrap">
													<Link
														href={`/app/${organizationSlug}/finance/owner-drawings/${d.id}`}
														className="font-mono hover:underline"
													>
														{d.drawingNo}
													</Link>
												</TableCell>
<<<<<<< HEAD
												<TableCell>
													<div className="flex items-center gap-2 text-muted-foreground">
=======
												<TableCell className="whitespace-nowrap">
													<div className="flex items-center gap-2 text-slate-600">
>>>>>>> claude/confident-mendeleev
														<Calendar className="h-4 w-4" />
														{formatDate(new Date(d.date))}
													</div>
												</TableCell>
												<TableCell className="whitespace-nowrap">
													{d.bankAccount?.name ?? "-"}
												</TableCell>
												<TableCell className="whitespace-nowrap">{d.project?.name ?? "-"}</TableCell>
												<TableCell className="whitespace-nowrap">
													<Badge
														className={
															d.status === "APPROVED"
																? "rounded-lg bg-success/15 text-success border-0"
																: "rounded-lg bg-muted text-muted-foreground border-0"
														}
													>
														{t(
															`finance.ownerDrawings.statuses.${d.status}`,
														)}
													</Badge>
												</TableCell>
<<<<<<< HEAD
												<TableCell className="text-end font-semibold text-destructive">
=======
												<TableCell className="text-end font-semibold text-red-600 whitespace-nowrap">
>>>>>>> claude/confident-mendeleev
													<Currency amount={d.amount} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="contributions">
					<Card className="rounded-2xl overflow-hidden">
						<CardContent className="p-0">
							{contributions.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">
									{t("finance.partners.detail.noContributions")}
								</div>
							) : (
								<div className="overflow-x-auto">
								<Table className="min-w-[700px]">
									<TableHeader>
										<TableRow>
											<TableHead className="whitespace-nowrap">
												{t("finance.capitalContributions.contributionNo")}
											</TableHead>
											<TableHead className="whitespace-nowrap">
												{t("finance.capitalContributions.date")}
											</TableHead>
											<TableHead className="whitespace-nowrap">
												{t("finance.capitalContributions.type")}
											</TableHead>
											<TableHead className="whitespace-nowrap">
												{t("finance.capitalContributions.bank")}
											</TableHead>
											<TableHead className="text-end whitespace-nowrap">
												{t("finance.capitalContributions.amount")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{contributions.map((c) => (
											<TableRow key={c.id}>
												<TableCell className="font-mono whitespace-nowrap">
													{c.contributionNo}
												</TableCell>
<<<<<<< HEAD
												<TableCell>
													<div className="flex items-center gap-2 text-muted-foreground">
=======
												<TableCell className="whitespace-nowrap">
													<div className="flex items-center gap-2 text-slate-600">
>>>>>>> claude/confident-mendeleev
														<Calendar className="h-4 w-4" />
														{formatDate(new Date(c.date))}
													</div>
												</TableCell>
												<TableCell className="whitespace-nowrap">
													<Badge
														variant="outline"
														className="rounded-lg"
													>
														{t(
															`finance.capitalContributions.types.${c.type}`,
														)}
													</Badge>
												</TableCell>
												<TableCell className="whitespace-nowrap">
													{c.bankAccount?.name ?? "-"}
												</TableCell>
<<<<<<< HEAD
												<TableCell className="text-end font-semibold text-success">
=======
												<TableCell className="text-end font-semibold text-emerald-600 whitespace-nowrap">
>>>>>>> claude/confident-mendeleev
													<Currency amount={c.amount} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{canViewProfits && summary.drawingsByProject && (
					<TabsContent value="projects">
						<Card className="rounded-2xl overflow-hidden">
							<CardContent className="p-0">
								<div className="overflow-x-auto">
								<Table className="min-w-[500px]">
									<TableHeader>
										<TableRow>
											<TableHead className="whitespace-nowrap">{t("common.project")}</TableHead>
											<TableHead className="text-end whitespace-nowrap">
												{t("finance.partners.detail.drawingsCount")}
											</TableHead>
											<TableHead className="text-end whitespace-nowrap">
												{t("finance.ownerDrawings.amount")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{summary.drawingsByProject.map((row: any) => (
											<TableRow key={row.projectId ?? "company"}>
												<TableCell className="font-medium whitespace-nowrap">
													{row.projectName}
												</TableCell>
												<TableCell className="text-end whitespace-nowrap">
													{row.count}
												</TableCell>
<<<<<<< HEAD
												<TableCell className="text-end font-semibold text-destructive">
=======
												<TableCell className="text-end font-semibold text-red-600 whitespace-nowrap">
>>>>>>> claude/confident-mendeleev
													<Currency amount={row.total} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
}

function SummaryCard({
	icon,
	bg,
	label,
	value,
	hint,
	emphasizeSign,
}: {
	icon: React.ReactNode;
	bg: string;
	label: string;
	value: number;
	hint?: string;
	emphasizeSign?: boolean;
}) {
	return (
		<Card className="rounded-2xl">
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
<<<<<<< HEAD
					<div className={`p-2 ${bg} rounded-xl`}>{icon}</div>
					<div>
						<p className="text-sm text-muted-foreground">
=======
					<div className={`p-2 ${bg} rounded-xl shrink-0`}>{icon}</div>
					<div className="min-w-0">
						<p className="text-sm text-slate-500 dark:text-slate-400 truncate">
>>>>>>> claude/confident-mendeleev
							{label}
						</p>
						<p
							className={`text-base sm:text-xl font-semibold tabular-nums break-words ${
								emphasizeSign
									? value >= 0
										? "text-success"
										: "text-destructive"
									: ""
							}`}
						>
							<Currency amount={value} />
						</p>
						{hint && (
							<p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
