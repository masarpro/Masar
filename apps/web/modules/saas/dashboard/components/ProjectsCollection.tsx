"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { cn } from "@ui/lib";
import { Card } from "@ui/components/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface ProjectItem {
	id: string;
	name: string | null;
	contractValue: number | null;
}

interface ProjectsCollectionProps {
	projects: ProjectItem[];
	collectionRate: number;
	organizationSlug: string;
}

export function ProjectsCollection({
	projects,
	collectionRate,
	organizationSlug,
}: ProjectsCollectionProps) {
	const t = useTranslations();
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	const donutData = [
		{ value: collectionRate, fill: "#10b981" },
		{ value: 100 - collectionRate, fill: isDark ? "#1f2937" : "#f1f5f9" },
	];

	return (
		<Card className="flex h-full flex-col p-5 dark:border-gray-800 dark:bg-gray-900">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
					{t("dashboard.collection.title")}
				</h3>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="text-[10px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
				>
					{t("dashboard.viewAll")}
				</Link>
			</div>

			<div className="flex flex-1 flex-col items-center gap-4">
				{/* Donut Chart */}
				<div className="relative h-32 w-32">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={donutData}
								innerRadius="70%"
								outerRadius="90%"
								startAngle={90}
								endAngle={-270}
								dataKey="value"
								stroke="none"
							>
								{donutData.map((entry, i) => (
									<Cell
										key={i}
										fill={entry.fill}
									/>
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<span className="text-2xl font-black text-gray-900 dark:text-white">
							{Math.round(collectionRate)}%
						</span>
						<span className="text-[10px] text-gray-400">
							{t("dashboard.collection.rate")}
						</span>
					</div>
				</div>

				{/* Projects list */}
				<div className="w-full space-y-2">
					{projects.length > 0 ? (
						projects.slice(0, 3).map((project) => (
							<Link
								key={project.id}
								href={`/app/${organizationSlug}/projects/${project.id}`}
								className="flex items-center justify-between border-b border-gray-50 py-2 transition-colors last:border-0 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30"
							>
								<div className="flex items-center gap-2">
									<span className="h-2 w-2 rounded-full bg-emerald-500" />
									<span className="text-sm text-gray-700 dark:text-gray-300">
										{project.name ||
											t("projects.unnamed")}
									</span>
								</div>
								<span className="text-sm font-bold text-gray-900 dark:text-white">
									<Currency
										amount={project.contractValue}
									/>
								</span>
							</Link>
						))
					) : (
						<Link
							href={`/app/${organizationSlug}/projects/new`}
							className="flex flex-col items-center gap-2 py-4"
						>
							<Plus className="h-5 w-5 text-gray-300 dark:text-gray-600" />
							<span className="text-xs text-gray-400">
								{t("dashboard.emptyProjects.cta")}
							</span>
						</Link>
					)}
				</div>
			</div>
		</Card>
	);
}
