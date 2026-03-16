"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
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
	MapPin,
	User,
	Users,
	Banknote,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { UpgradeGate } from "@saas/shared/components/UpgradeGate";
import { CardGridSkeleton } from "@saas/shared/components/skeletons";
import { ProjectsHeader } from "./ProjectsHeader";

interface ProjectsListProps {
	organizationId: string;
	userName?: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
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
				<Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-0 text-[10px] px-2 py-0.5">
					{t("projects.status.ACTIVE")}
				</Badge>
			);
		case "ON_HOLD":
			return (
				<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] px-2 py-0.5">
					{t("projects.status.ON_HOLD")}
				</Badge>
			);
		case "COMPLETED":
			return (
				<Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0 text-[10px] px-2 py-0.5">
					{t("projects.status.COMPLETED")}
				</Badge>
			);
		case "ARCHIVED":
			return (
				<Badge className="bg-slate-200 text-slate-500 dark:bg-slate-800/60 dark:text-slate-500 border-0 text-[10px] px-2 py-0.5">
					{t("projects.status.ARCHIVED")}
				</Badge>
			);
		default:
			return null;
	}
}

const coverGradients = [
	"from-blue-400 to-indigo-500",
	"from-sky-400 to-sky-500",
	"from-amber-400 to-orange-500",
	"from-violet-400 to-purple-500",
	"from-rose-400 to-pink-500",
	"from-cyan-400 to-sky-500",
];

export function ProjectsList({ organizationId, userName }: ProjectsListProps) {
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
						? (statusFilter as "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED")
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
		return <CardGridSkeleton />;
	}

	return (
		<div className="space-y-6" dir="rtl">
			{/* Header */}
			<ProjectsHeader userName={userName} />

			{/* Statistics Cards - Glass Morphism */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{/* Total Projects */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
							<FolderKanban className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("projects.stats.total")}
					</p>
					<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
						{stats.total}
					</p>
				</div>

				{/* Active Projects */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
							<Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
						</div>
						{stats.total > 0 && (
							<div className="flex items-center gap-0.5 text-xs text-sky-600 dark:text-sky-400">
								<TrendingUp className="h-3 w-3" />
								<span>{Math.round((stats.active / stats.total) * 100)}%</span>
							</div>
						)}
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("projects.stats.active")}
					</p>
					<p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
						{stats.active}
					</p>
				</div>

				{/* Completed Projects */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
							<CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
						</div>
						{stats.total > 0 && (
							<div className="flex items-center gap-0.5 text-xs text-sky-600 dark:text-sky-400">
								<CheckCircle2 className="h-3 w-3" />
								<span>{Math.round((stats.completed / stats.total) * 100)}%</span>
							</div>
						)}
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("projects.stats.completed")}
					</p>
					<p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
						{stats.completed}
					</p>
				</div>

				{/* Total Value */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<Banknote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("projects.stats.totalValue")}
					</p>
					<p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
						{formatCurrency(stats.totalValue)}
					</p>
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
							className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl pr-10 focus:ring-1 focus:ring-primary/30"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
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
							<SelectItem value="ARCHIVED">
								{t("projects.status.ARCHIVED")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<UpgradeGate feature="projects.create">
					<Button
						asChild
						className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
					>
						<Link href={`${basePath}/new`}>
							<Plus className="ml-2 h-4 w-4" />
							{t("projects.newProject")}
						</Link>
					</Button>
				</UpgradeGate>
			</div>

			{/* Grid of Projects - Glass Morphism Cards */}
			{projects.length > 0 ? (
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{projects.map((project, index) => {
						const coverPhoto = (project as any).photos?.[0]?.url;
						const gradientIndex = index % coverGradients.length;

						return (
							<Link
								key={project.id}
								href={`${basePath}/${project.id}`}
								className="animate-in fade-in slide-in-from-bottom-4 duration-500"
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<div className={`group relative h-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${project.status === "ARCHIVED" ? "opacity-60" : ""}`}>
									{/* Cover Image / Gradient */}
									<div className="relative aspect-[16/9] overflow-hidden">
										{coverPhoto ? (
											<Image
												src={coverPhoto}
												alt={project.name || ""}
												fill
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
												className="object-cover transition-transform duration-500 group-hover:scale-110"
												unoptimized
											/>
										) : (
											<div
												className={`h-full w-full bg-gradient-to-br ${coverGradients[gradientIndex]} opacity-80`}
											/>
										)}
										{/* Overlay gradient */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
										{/* Project name on overlay */}
										<div className="absolute bottom-0 left-0 right-0 p-3">
											<div className="flex items-start justify-between gap-2">
												<h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
													{project.name || t("projects.unnamed")}
												</h3>
												{getStatusBadge(project.status, t)}
											</div>
										</div>
									</div>

									{/* Card Content */}
									<div className="p-4 space-y-3">
										{/* Client & Location */}
										<div className="space-y-1.5">
											{project.clientName && (
												<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
													<User className="h-3.5 w-3.5 shrink-0" />
													<span className="truncate">{project.clientName}</span>
												</div>
											)}
											{project.location && (
												<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
													<MapPin className="h-3.5 w-3.5 shrink-0" />
													<span className="truncate">{project.location}</span>
												</div>
											)}
										</div>

										{/* Progress */}
										<div>
											<div className="mb-1 flex items-center justify-between text-xs">
												<span className="text-slate-500 dark:text-slate-400">
													{t("projects.overview.progress")}
												</span>
												<span className="font-semibold text-sky-600 dark:text-sky-400">
													{Math.round(Number(project.progress))}%
												</span>
											</div>
											<Progress value={Number(project.progress)} className="h-1.5" />
										</div>

										{/* Footer: Contract Value + Team */}
										<div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
											{project.contractValue ? (
												<div className="flex items-center gap-1.5">
													<Banknote className="h-3.5 w-3.5 text-slate-400" />
													<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
														{formatCurrency(project.contractValue)}
													</span>
												</div>
											) : (
												<span />
											)}
											<div className="flex items-center gap-1 text-xs text-slate-400">
												<Users className="h-3.5 w-3.5" />
												<span>{(project as any).memberCount ?? 0}</span>
											</div>
										</div>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			) : (
				<EmptyState
					icon={<FolderKanban className="h-12 w-12" />}
					title={t("projects.empty")}
					description={t("projects.emptyDescription")}
				>
					<Button
						asChild
						className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
					>
						<Link href={`${basePath}/new`}>
							<Plus className="ml-2 h-4 w-4" />
							{t("projects.newProject")}
						</Link>
					</Button>
				</EmptyState>
			)}
		</div>
	);
}
