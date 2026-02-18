"use client";

import { formatCurrency } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from "@ui/components/chart";
import { Progress } from "@ui/components/progress";
import { useQuery } from "@tanstack/react-query";
import {
	Banknote,
	Calendar,
	Camera,
	ClipboardList,
	FileText,
	FolderKanban,
	Image as ImageIcon,
	Plus,
	Receipt,
	TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useRef } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Label,
	Pie,
	PieChart,
	XAxis,
} from "recharts";
import { useProjectRole } from "../hooks/use-project-role";

interface ProjectOverviewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

// Expense category colors for donut chart
const CATEGORY_COLORS: Record<string, string> = {
	MATERIALS: "#3b82f6",
	LABOR: "#f59e0b",
	EQUIPMENT: "#8b5cf6",
	SUBCONTRACTOR: "#10b981",
	TRANSPORT: "#ef4444",
	MISC: "#6b7280",
};

const CATEGORY_LABELS_AR: Record<string, string> = {
	MATERIALS: "مواد",
	LABOR: "عمالة",
	EQUIPMENT: "معدات",
	SUBCONTRACTOR: "مقاولين",
	TRANSPORT: "نقل",
	MISC: "متنوع",
};

export function ProjectOverview({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectOverviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const { canViewSection } = useProjectRole();
	const galleryRef = useRef<HTMLDivElement>(null);

	// Fetch finance summary
	const { data: financeSummary } = useQuery(
		orpc.projectFinance.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch recent field timeline
	const { data: fieldData } = useQuery(
		orpc.projectField.getTimeline.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 5,
			},
		}),
	);

	// Fetch project photos
	const { data: photosData } = useQuery(
		orpc.projectField.listPhotos.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 10,
			},
		}),
	);

	// Fetch expenses for category breakdown
	const { data: expensesData } = useQuery(
		orpc.projectFinance.listExpenses.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 100,
			},
		}),
	);

	// Fetch paid claims for cash flow chart
	const { data: paidClaimsData } = useQuery(
		orpc.projectFinance.listClaims.queryOptions({
			input: {
				organizationId,
				projectId,
				status: "PAID",
				limit: 100,
			},
		}),
	);

	// Fetch pending claims (SUBMITTED/APPROVED) for upcoming deadlines
	const { data: pendingClaimsData } = useQuery(
		orpc.projectFinance.listClaims.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 20,
			},
		}),
	);

	// Calculate finance snapshot
	const contractValue = financeSummary?.contractValue ?? 0;
	const claimsPaid = financeSummary?.claimsPaid ?? 0;
	const actualExpenses = financeSummary?.actualExpenses ?? 0;
	const remaining = financeSummary?.remaining ?? 0;

	// Calculate percentages for mini progress bars
	const collectedPct =
		contractValue > 0 ? Math.round((claimsPaid / contractValue) * 100) : 0;
	const remainingPct =
		contractValue > 0 ? Math.round((remaining / contractValue) * 100) : 0;
	const expensesPct =
		contractValue > 0
			? Math.min(Math.round((actualExpenses / contractValue) * 100), 100)
			: 0;

	// Expense categories for donut chart
	const categoryData = useMemo(() => {
		if (!expensesData?.expenses?.length) return [];
		const grouped: Record<string, number> = {};
		for (const exp of expensesData.expenses) {
			const cat = (exp as any).category ?? "MISC";
			grouped[cat] = (grouped[cat] ?? 0) + exp.amount;
		}
		return Object.entries(grouped).map(([category, total]) => ({
			name: CATEGORY_LABELS_AR[category] ?? category,
			value: total,
			category,
			fill: CATEGORY_COLORS[category] ?? "#6b7280",
		}));
	}, [expensesData]);

	// Monthly cash flow data for area chart
	const cashFlowData = useMemo(() => {
		const hasExpenses = !!expensesData?.expenses?.length;
		const hasClaims = !!paidClaimsData?.claims?.length;
		if (!hasExpenses && !hasClaims) return [];

		const monthlyExpenses: Record<string, number> = {};
		const monthlyCollected: Record<string, number> = {};

		// Aggregate expenses by month
		if (hasExpenses) {
			for (const exp of expensesData!.expenses) {
				const date = new Date((exp as any).date ?? (exp as any).createdAt);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
				monthlyExpenses[monthKey] =
					(monthlyExpenses[monthKey] ?? 0) + exp.amount;
			}
		}

		// Aggregate paid claims by month (using paidAt → periodEnd → createdAt)
		if (hasClaims) {
			for (const claim of paidClaimsData!.claims) {
				const c = claim as any;
				const dateStr = c.paidAt ?? c.periodEnd ?? c.createdAt;
				const date = new Date(dateStr);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
				monthlyCollected[monthKey] =
					(monthlyCollected[monthKey] ?? 0) + claim.amount;
			}
		}

		// Merge all months from both sources
		const allMonths = new Set([
			...Object.keys(monthlyExpenses),
			...Object.keys(monthlyCollected),
		]);
		const months = Array.from(allMonths).sort();

		const arabicMonths = [
			"يناير",
			"فبراير",
			"مارس",
			"أبريل",
			"مايو",
			"يونيو",
			"يوليو",
			"أغسطس",
			"سبتمبر",
			"أكتوبر",
			"نوفمبر",
			"ديسمبر",
		];
		return months.map((m) => {
			const monthIdx = Number.parseInt(m.split("-")[1]) - 1;
			return {
				month: arabicMonths[monthIdx],
				expenses: monthlyExpenses[m] ?? 0,
				collected: monthlyCollected[m] ?? 0,
			};
		});
	}, [expensesData, paidClaimsData]);

	// Chart configs
	const cashFlowChartConfig: ChartConfig = {
		expenses: {
			label: t("projects.commandCenter.expenses"),
			color: "#ef4444",
		},
		collected: {
			label: t("projects.overview.collected"),
			color: "#10b981",
		},
	};

	// Total expenses for donut center label
	const totalExpensesAmount = useMemo(
		() => categoryData.reduce((sum, item) => sum + item.value, 0),
		[categoryData],
	);

	// Upcoming claims (SUBMITTED or APPROVED with dueDate)
	const upcomingClaims = useMemo(() => {
		if (!pendingClaimsData?.claims?.length) return [];
		return pendingClaimsData.claims
			.filter((claim: any) => {
				const status = claim.status;
				return (
					(status === "SUBMITTED" || status === "APPROVED") &&
					claim.dueDate
				);
			})
			.sort((a: any, b: any) => {
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
			})
			.slice(0, 5);
	}, [pendingClaimsData]);

	const donutChartConfig: ChartConfig = categoryData.reduce(
		(acc, item) => {
			acc[item.name] = { label: item.name, color: item.fill };
			return acc;
		},
		{} as ChartConfig,
	);

	// Photos
	const photos = photosData?.photos ?? [];
	const totalPhotos = photosData?.total ?? 0;
	const lastPhotoDate = photos[0]?.createdAt;

	// Quick action cards
	const actionSections = [
		{
			id: "field",
			section: "field",
			icon: FileText,
			browsePath: `${basePath}/field`,
			createPath: `${basePath}/field/new-report`,
			iconColor: "text-blue-500 dark:text-blue-400",
			bgColor: "bg-blue-50/80 dark:bg-blue-950/30",
			hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/50",
			borderColor: "border-blue-200/50 dark:border-blue-800/50",
		},
		{
			id: "finance",
			section: "finance",
			icon: Banknote,
			browsePath: `${basePath}/finance`,
			createPath: `${basePath}/finance/expenses/new`,
			iconColor: "text-emerald-500 dark:text-emerald-400",
			bgColor: "bg-emerald-50/80 dark:bg-emerald-950/30",
			hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
			borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
		},
		{
			id: "documents",
			section: "documents",
			icon: FolderKanban,
			browsePath: `${basePath}/documents`,
			createPath: `${basePath}/documents/new`,
			iconColor: "text-violet-500 dark:text-violet-400",
			bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
			hoverBg: "hover:bg-violet-100 dark:hover:bg-violet-900/50",
			borderColor: "border-violet-200/50 dark:border-violet-800/50",
		},
		{
			id: "timeline",
			section: "timeline",
			icon: Calendar,
			browsePath: `${basePath}/timeline`,
			createPath: `${basePath}/timeline?action=new`,
			iconColor: "text-amber-500 dark:text-amber-400",
			bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
			hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
			borderColor: "border-amber-200/50 dark:border-amber-800/50",
		},
	].filter((section) => canViewSection(section.section));

	// Activity type icon colors
	const getActivityColor = (type: string) => {
		switch (type) {
			case "DAILY_REPORT":
				return {
					bg: "bg-blue-100 dark:bg-blue-900/30",
					text: "text-blue-600 dark:text-blue-400",
					dot: "bg-blue-500",
				};
			case "ISSUE":
				return {
					bg: "bg-red-100 dark:bg-red-900/30",
					text: "text-red-600 dark:text-red-400",
					dot: "bg-red-500",
				};
			case "PHOTO":
				return {
					bg: "bg-purple-100 dark:bg-purple-900/30",
					text: "text-purple-600 dark:text-purple-400",
					dot: "bg-purple-500",
				};
			default:
				return {
					bg: "bg-amber-100 dark:bg-amber-900/30",
					text: "text-amber-600 dark:text-amber-400",
					dot: "bg-amber-500",
				};
		}
	};

	// Relative time helper
	const getRelativeTime = (dateStr: string | Date) => {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 60) return t("projects.overview.minutesAgo", { count: Math.max(1, diffMins) });
		if (diffHours < 24) return t("projects.overview.hoursAgo", { count: diffHours });
		if (diffDays === 1) return t("projects.overview.yesterday");
		if (diffDays < 7) return t("projects.overview.daysAgo", { count: diffDays });
		return date.toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
	};

	return (
		<div className="space-y-6">
			{/* ═══════════ القسم 1: الملخص المالي السريع ═══════════ */}
			{canViewSection("finance") && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{/* قيمة العقد */}
					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
								<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
							</div>
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("projects.overview.contractValue")}
							</p>
						</div>
						<p className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">
							{formatCurrency(contractValue)}
						</p>
						<div className="flex items-center gap-2">
							<Progress value={100} className="h-1.5 flex-1" />
							<span className="text-[10px] text-slate-400">100%</span>
						</div>
					</div>

					{/* المحصّل */}
					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
								<Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
							</div>
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("projects.overview.collected")}
							</p>
						</div>
						<p className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">
							{formatCurrency(claimsPaid)}
						</p>
						<div className="flex items-center gap-2">
							<div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
								<div
									className="h-full rounded-full bg-green-500 transition-all duration-500"
									style={{ width: `${collectedPct}%` }}
								/>
							</div>
							<span className="text-[10px] text-slate-400">{collectedPct}%</span>
						</div>
					</div>

					{/* المتبقي */}
					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
								<Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
							</div>
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("projects.commandCenter.remaining")}
							</p>
						</div>
						<p className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-2">
							{formatCurrency(remaining)}
						</p>
						<div className="flex items-center gap-2">
							<div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
								<div
									className="h-full rounded-full bg-amber-500 transition-all duration-500"
									style={{ width: `${remainingPct}%` }}
								/>
							</div>
							<span className="text-[10px] text-slate-400">{remainingPct}%</span>
						</div>
					</div>

					{/* المصروفات */}
					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
								<Banknote className="h-4 w-4 text-red-600 dark:text-red-400" />
							</div>
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("projects.commandCenter.expenses")}
							</p>
						</div>
						<p className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
							{formatCurrency(actualExpenses)}
						</p>
						<div className="flex items-center gap-2">
							<div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
								<div
									className="h-full rounded-full bg-red-500 transition-all duration-500"
									style={{ width: `${expensesPct}%` }}
								/>
							</div>
							<span className="text-[10px] text-slate-400">{expensesPct}%</span>
						</div>
					</div>
				</div>
			)}

			{/* ═══════════ القسم 2: المخططات البيانية ═══════════ */}
			{canViewSection("finance") && (
				<div className="space-y-4">
					{/* الصف الأول: مخطط التدفق + مخطط التوزيع */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* التدفق المالي - Area Chart */}
						<div className="group backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5 transition-all duration-300 hover:shadow-xl">
							<div className="flex items-center gap-2 mb-4">
								<TrendingUp className="h-4 w-4 text-slate-500" />
								<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
									{t("projects.overview.cashFlow")}
								</h3>
							</div>
							{cashFlowData.length > 0 ? (
								<ChartContainer
									config={cashFlowChartConfig}
									className="h-48 w-full"
								>
									<AreaChart
										accessibilityLayer
										data={cashFlowData}
										margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
									>
										<defs>
											<linearGradient
												id="expensesGradient"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="0%"
													stopColor="#ef4444"
													stopOpacity={0.3}
												/>
												<stop
													offset="100%"
													stopColor="#ef4444"
													stopOpacity={0}
												/>
											</linearGradient>
											<linearGradient
												id="collectedGradient"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="0%"
													stopColor="#10b981"
													stopOpacity={0.3}
												/>
												<stop
													offset="100%"
													stopColor="#10b981"
													stopOpacity={0}
												/>
											</linearGradient>
										</defs>
										<CartesianGrid vertical={false} />
										<XAxis
											dataKey="month"
											tickLine={false}
											axisLine={false}
											tickMargin={8}
											fontSize={10}
										/>
										<ChartTooltip
											content={
												<ChartTooltipContent
													formatter={(value: number | string) =>
														formatCurrency(Number(value))
													}
												/>
											}
										/>
										<Area
											dataKey="expenses"
											type="natural"
											fill="url(#expensesGradient)"
											stroke="#ef4444"
											strokeWidth={2}
										/>
										<Area
											dataKey="collected"
											type="natural"
											fill="url(#collectedGradient)"
											stroke="#10b981"
											strokeWidth={2}
										/>
										<ChartLegend content={<ChartLegendContent />} />
									</AreaChart>
								</ChartContainer>
							) : (
								<div className="flex flex-col items-center justify-center h-48 text-slate-400">
									<TrendingUp className="h-8 w-8 mb-2" />
									<p className="text-sm">{t("projects.overview.noFinancialData")}</p>
								</div>
							)}
						</div>

						{/* توزيع المصروفات - Donut Chart */}
						<div className="group backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5 transition-all duration-300 hover:shadow-xl">
							<div className="flex items-center gap-2 mb-4">
								<Receipt className="h-4 w-4 text-slate-500" />
								<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
									{t("projects.overview.expenseDistribution")}
								</h3>
							</div>
							{categoryData.length > 0 ? (
								<ChartContainer
									config={donutChartConfig}
									className="h-48 w-full"
								>
									<PieChart>
										<Pie
											data={categoryData}
											cx="50%"
											cy="50%"
											innerRadius={50}
											outerRadius={80}
											paddingAngle={3}
											dataKey="value"
											nameKey="name"
										>
											{categoryData.map((entry) => (
												<Cell
													key={entry.category}
													fill={entry.fill}
												/>
											))}
											<Label
												content={({ viewBox }) => {
													if (viewBox && "cx" in viewBox && "cy" in viewBox) {
														return (
															<text
																x={viewBox.cx}
																y={viewBox.cy}
																textAnchor="middle"
																dominantBaseline="middle"
															>
																<tspan
																	x={viewBox.cx}
																	y={(viewBox.cy ?? 0) - 6}
																	className="fill-slate-900 dark:fill-slate-100 text-lg font-bold"
																>
																	{formatCurrency(totalExpensesAmount)}
																</tspan>
																<tspan
																	x={viewBox.cx}
																	y={(viewBox.cy ?? 0) + 12}
																	className="fill-slate-500 text-[10px]"
																>
																	{t("projects.commandCenter.expenses")}
																</tspan>
															</text>
														);
													}
													return null;
												}}
											/>
										</Pie>
										<ChartTooltip
											content={
												<ChartTooltipContent
													formatter={(value: number | string) =>
														formatCurrency(Number(value))
													}
												/>
											}
										/>
										<ChartLegend content={<ChartLegendContent />} />
									</PieChart>
								</ChartContainer>
							) : (
								<div className="flex flex-col items-center justify-center h-48 text-slate-400">
									<Receipt className="h-8 w-8 mb-2" />
									<p className="text-sm">{t("projects.overview.noExpenseData")}</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ═══════════ القسم 3: شريط صور المشروع ═══════════ */}
			{canViewSection("field") && (
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Camera className="h-4 w-4 text-slate-500" />
							<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
								{t("projects.overview.projectPhotos")}
							</h3>
						</div>
						<Link
							href={`${basePath}/field?tab=photos`}
							className="text-sm text-primary hover:underline"
						>
							{t("projects.commandCenter.viewAll")}
						</Link>
					</div>

					{photos.length > 0 ? (
						<>
							<div
								ref={galleryRef}
								className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
								style={{ scrollBehavior: "smooth" }}
							>
								{photos.map((photo: any) => (
									<div
										key={photo.id}
										className="shrink-0 group relative overflow-hidden rounded-xl border border-white/20 dark:border-slate-700/30 shadow-md"
									>
										<Image
											src={photo.url}
											alt={photo.caption || ""}
											width={176}
											height={128}
											className="h-32 w-44 object-cover transition-transform duration-300 group-hover:scale-110"
											unoptimized
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
										{photo.caption && (
											<div className="absolute bottom-0 inset-x-0 p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
												{photo.caption}
											</div>
										)}
									</div>
								))}
							</div>
							<div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
								{lastPhotoDate && (
									<div className="flex items-center gap-1.5">
										<Calendar className="h-3 w-3" />
										<span>
											{t("projects.overview.lastUpdate")}:{" "}
											{new Date(lastPhotoDate).toLocaleDateString("ar-SA", {
												day: "numeric",
												month: "short",
												year: "numeric",
											})}
										</span>
									</div>
								)}
								<div className="flex items-center gap-1.5">
									<ImageIcon className="h-3 w-3" />
									<span>
										{totalPhotos} {t("projects.overview.photos")}
									</span>
								</div>
							</div>
						</>
					) : (
						<div className="flex flex-col items-center justify-center py-10 text-slate-400">
							<Camera className="h-10 w-10 mb-3" />
							<p className="text-sm mb-2">
								{t("projects.overview.noPhotosYet")}
							</p>
							<Link
								href={`${basePath}/field?action=upload-photo`}
								className="text-sm text-primary hover:underline flex items-center gap-1"
							>
								<Plus className="h-3.5 w-3.5" />
								{t("projects.commandCenter.uploadPhoto")}
							</Link>
						</div>
					)}
				</div>
			)}

			{/* ═══════════ القسم 4: الوصول السريع + الأنشطة والمواعيد ═══════════ */}

			{/* الوصول السريع */}
			{actionSections.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					{actionSections.map((section) => {
						const Icon = section.icon;
						return (
							<div
								key={section.id}
								className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-xl"
							>
								<Link
									href={section.browsePath}
									className={`flex flex-col items-center gap-2 p-4 ${section.bgColor} ${section.hoverBg} transition-colors border-b ${section.borderColor}`}
								>
									<div
										className={`p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 ${section.iconColor}`}
									>
										<Icon className="h-6 w-6" />
									</div>
									<span className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
										{t(
											`projects.commandCenter.nav.${section.id}`,
										)}
									</span>
								</Link>
								<Link
									href={section.createPath}
									className="flex items-center justify-center gap-2 p-3 bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-colors"
								>
									<Plus
										className={`h-4 w-4 ${section.iconColor}`}
									/>
									<span
										className={`text-xs font-medium ${section.iconColor}`}
									>
										{t(
											`projects.commandCenter.nav.${section.id}New`,
										)}
									</span>
								</Link>
							</div>
						);
					})}
				</div>
			)}

			{/* الأنشطة الأخيرة + المواعيد القادمة */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* الأنشطة الأخيرة */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
							{t("projects.commandCenter.recentActivities")}
						</h2>
						{canViewSection("field") && (
							<Link
								href={`${basePath}/field`}
								className="text-sm text-primary hover:underline"
							>
								{t("projects.commandCenter.viewAll")}
							</Link>
						)}
					</div>

					{fieldData?.timeline && fieldData.timeline.length > 0 ? (
						<div className="space-y-1">
							{fieldData.timeline.map((item: any) => {
								const colors = getActivityColor(item.type);
								return (
									<div
										key={item.id}
										className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/50 dark:hover:bg-slate-800/30"
									>
										{/* Timeline dot */}
										<div className="flex flex-col items-center mt-1">
											<div
												className={`h-2.5 w-2.5 rounded-full ${colors.dot}`}
											/>
											<div className="w-px h-full bg-slate-200 dark:bg-slate-700 mt-1" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
												{item.type === "DAILY_REPORT"
													? t("projects.field.dailyReport")
													: item.type === "ISSUE"
														? t("projects.field.issue")
														: item.type === "PHOTO"
															? t("projects.field.photo")
															: t(
																	"projects.field.progressUpdate",
																)}
											</p>
											<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
												{getRelativeTime(item.createdAt)}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-8 text-slate-400">
							<FileText className="h-8 w-8 mb-2" />
							<p className="text-sm">
								{t("projects.commandCenter.noRecentActivity")}
							</p>
						</div>
					)}
				</div>

				{/* المواعيد القادمة */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
							{t("projects.commandCenter.upcomingDeadlines")}
						</h2>
						{canViewSection("finance") && upcomingClaims.length > 0 && (
							<Link
								href={`${basePath}/finance/claims`}
								className="text-sm text-primary hover:underline"
							>
								{t("projects.commandCenter.viewAll")}
							</Link>
						)}
					</div>
					{upcomingClaims.length > 0 ? (
						<div className="space-y-2">
							{upcomingClaims.map((claim: any) => {
								const dueDate = new Date(claim.dueDate);
								const now = new Date();
								const diffDays = Math.ceil(
									(dueDate.getTime() - now.getTime()) / 86400000,
								);
								const isOverdue = diffDays < 0;
								const isUrgent = diffDays >= 0 && diffDays <= 3;
								return (
									<div
										key={claim.id}
										className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/50 dark:hover:bg-slate-800/30"
									>
										<div
											className={`p-2 rounded-lg ${
												isOverdue
													? "bg-red-100 dark:bg-red-900/30"
													: isUrgent
														? "bg-amber-100 dark:bg-amber-900/30"
														: "bg-blue-100 dark:bg-blue-900/30"
											}`}
										>
											<ClipboardList
												className={`h-4 w-4 ${
													isOverdue
														? "text-red-600 dark:text-red-400"
														: isUrgent
															? "text-amber-600 dark:text-amber-400"
															: "text-blue-600 dark:text-blue-400"
												}`}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
												{t("finance.claims.claimNo")} #{claim.claimNo}
											</p>
											<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
												{formatCurrency(claim.amount)} &middot;{" "}
												<span
													className={
														isOverdue
															? "text-red-500"
															: isUrgent
																? "text-amber-500"
																: ""
													}
												>
													{dueDate.toLocaleDateString("ar-SA", {
														day: "numeric",
														month: "short",
													})}
												</span>
											</p>
										</div>
										<span
											className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
												claim.status === "APPROVED"
													? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
													: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
											}`}
										>
											{claim.status === "APPROVED"
												? t("finance.status.APPROVED")
												: t("finance.status.SUBMITTED")}
										</span>
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-8 text-slate-400">
							<Calendar className="h-8 w-8 mb-2" />
							<p className="text-sm">
								{t("projects.commandCenter.noDeadlines")}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
