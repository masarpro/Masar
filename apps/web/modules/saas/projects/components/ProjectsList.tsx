"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	Plus,
	Search,
	FolderKanban,
	TrendingUp,
	CheckCircle2,
	Clock,
	PauseCircle,
	MapPin,
	User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

interface ProjectsListProps {
	organizationId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function getStatusBadge(status: string, t: (key: string) => string) {
	switch (status) {
		case "ACTIVE":
			return (
				<Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0">
					{t("projects.status.ACTIVE")}
				</Badge>
			);
		case "ON_HOLD":
			return (
				<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
					{t("projects.status.ON_HOLD")}
				</Badge>
			);
		case "COMPLETED":
			return (
				<Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0">
					{t("projects.status.COMPLETED")}
				</Badge>
			);
		default:
			return null;
	}
}

export function ProjectsList({ organizationId }: ProjectsListProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const { data, isLoading } = useQuery(
		orpc.projects.list.queryOptions({
			input: {
				organizationId,
				status:
					statusFilter !== "all"
						? (statusFilter as "ACTIVE" | "ON_HOLD" | "COMPLETED")
						: undefined,
				query: searchTerm || undefined,
			},
		}),
	);

	const projects = data?.projects ?? [];
	const stats = data?.stats ?? {
		total: 0,
		active: 0,
		onHold: 0,
		completed: 0,
		totalValue: 0,
	};
	const basePath = `/app/${activeOrganization?.slug}/projects`;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Statistics Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="group relative rounded-2xl bg-slate-50 p-5 transition-all duration-200 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800/50">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
								{t("projects.stats.total")}
							</p>
							<p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
								{stats.total}
							</p>
						</div>
						<div className="rounded-2xl bg-slate-200/50 p-3 dark:bg-slate-700/50">
							<FolderKanban className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-teal-50 p-5 transition-all duration-200 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-teal-600 dark:text-teal-400">
								{t("projects.stats.active")}
							</p>
							<p className="mt-2 text-3xl font-semibold text-teal-700 dark:text-teal-300">
								{stats.active}
							</p>
						</div>
						<div className="rounded-2xl bg-teal-200/50 p-3 dark:bg-teal-800/30">
							<Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-slate-50 p-5 transition-all duration-200 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800/50">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
								{t("projects.stats.completed")}
							</p>
							<p className="mt-2 text-3xl font-semibold text-slate-700 dark:text-slate-300">
								{stats.completed}
							</p>
						</div>
						<div className="rounded-2xl bg-slate-200/50 p-3 dark:bg-slate-700/50">
							<CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-indigo-50 p-5 transition-all duration-200 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
								{t("projects.stats.totalValue")}
							</p>
							<p className="mt-2 text-2xl font-semibold text-indigo-700 dark:text-indigo-300">
								{formatCurrency(stats.totalValue)}
							</p>
						</div>
						<div className="rounded-2xl bg-indigo-200/50 p-3 dark:bg-indigo-800/30">
							<TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
				</div>
			</div>

			{/* Search and Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative max-w-md flex-1">
						<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder={t("projects.searchPlaceholder")}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="rounded-xl border-slate-200 bg-slate-50 pr-10 focus:ring-1 focus:ring-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:focus:ring-slate-700"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
							<SelectValue placeholder={t("projects.allStatuses")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("projects.allStatuses")}</SelectItem>
							<SelectItem value="ACTIVE">
								{t("projects.status.ACTIVE")}
							</SelectItem>
							<SelectItem value="ON_HOLD">
								{t("projects.status.ON_HOLD")}
							</SelectItem>
							<SelectItem value="COMPLETED">
								{t("projects.status.COMPLETED")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					asChild
					className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					<Link href={`${basePath}/new`}>
						<Plus className="ml-2 h-4 w-4" />
						{t("projects.newProject")}
					</Link>
				</Button>
			</div>

			{/* Grid of projects */}
			{projects.length > 0 ? (
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{projects.map((project, index) => (
						<Link
							key={project.id}
							href={`${basePath}/${project.id}`}
							className="animate-in fade-in slide-in-from-bottom-4 duration-500"
							style={{ animationDelay: `${index * 50}ms` }}
						>
							<div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700">
								{/* Header */}
								<div className="mb-4 flex items-start justify-between">
									<h3 className="font-semibold text-slate-900 dark:text-slate-100">
										{project.name || t("projects.unnamed")}
									</h3>
									{getStatusBadge(project.status, t)}
								</div>

								{/* Client & Location */}
								<div className="mb-4 space-y-2">
									{project.clientName && (
										<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
											<User className="h-4 w-4" />
											<span>{project.clientName}</span>
										</div>
									)}
									{project.location && (
										<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
											<MapPin className="h-4 w-4" />
											<span>{project.location}</span>
										</div>
									)}
								</div>

								{/* Progress */}
								<div className="mb-4">
									<div className="mb-1 flex items-center justify-between text-sm">
										<span className="text-slate-500 dark:text-slate-400">
											{t("projects.overview.progress")}
										</span>
										<span className="font-medium text-slate-700 dark:text-slate-300">
											{Math.round(project.progress)}%
										</span>
									</div>
									<Progress value={project.progress} className="h-2" />
								</div>

								{/* Contract Value */}
								{project.contractValue && (
									<div className="border-t border-slate-100 pt-3 dark:border-slate-800">
										<div className="flex items-center justify-between">
											<span className="text-xs text-slate-500 dark:text-slate-400">
												{t("projects.overview.contractValue")}
											</span>
											<span className="font-semibold text-slate-900 dark:text-slate-100">
												{formatCurrency(project.contractValue)}
											</span>
										</div>
									</div>
								)}
							</div>
						</Link>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-5 rounded-2xl bg-slate-100 p-5 dark:bg-slate-800/50">
						<FolderKanban className="h-12 w-12 text-slate-400 dark:text-slate-500" />
					</div>
					<h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
						{t("projects.empty")}
					</h3>
					<p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
						{t("projects.emptyDescription")}
					</p>
					<Button
						asChild
						className="mt-5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
					>
						<Link href={`${basePath}/new`}>
							<Plus className="ml-2 h-4 w-4" />
							{t("projects.newProject")}
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
