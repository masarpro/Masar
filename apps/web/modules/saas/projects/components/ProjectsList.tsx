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
import { statusToneClasses } from "@ui/components/status-chip";
import { Progress } from "@ui/components/progress";
import {
	Plus,
	Search,
	FolderKanban,
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
import { CardGridSkeleton } from "@saas/shared/components/skeletons";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { ProjectsHero } from "@saas/projects/components/ProjectsHero";
import { formatSAR } from "@shared/lib/formatters";
interface ProjectsListProps {
	organizationId: string;
	userName?: string;
}

function getStatusBadge(status: string, t: (key: string) => string) {
	switch (status) {
		case "ACTIVE":
		case "ON_HOLD":
		case "COMPLETED":
		case "ARCHIVED":
			return (
				<Badge className={`${statusToneClasses(status)} border-0 text-[10px] px-2 py-0.5`}>
					{t(`projects.status.${status}`)}
				</Badge>
			);
		default:
			return null;
	}
}

const coverGradients = [
	"from-chart-4 to-chart-3",
	"from-chart-3 to-chart-4",
	"from-chart-1 to-chart-2",
	"from-chart-4 to-chart-5",
	"from-chart-2 to-chart-1",
	"from-chart-5 to-chart-3",
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
		<div className="space-y-4 sm:space-y-6" dir="rtl">
			{/* بطاقة ملوّنة واحدة تجمع المؤشرات الأربعة (على غرار بطاقة الداشبورد) */}
			<ProjectsHero newProjectHref={`${basePath}/new`} stats={stats} />

			{/* الجوال: بحث + ورقة فلاتر + زر إضافة مضغوط في صف واحد */}
			<div className="flex items-center gap-2 sm:hidden">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("projects.searchPlaceholder")}
						value={searchTerm}
						onChange={(e: any) => setSearchTerm(e.target.value)}
						className="rounded-lg border-input bg-card pe-10"
					/>
				</div>
				<MobileFilterSheet activeCount={statusFilter !== "all" ? 1 : 0}>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full rounded-xl">
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
				</MobileFilterSheet>
			</div>

			{/* Search and Filter Bar (الديسكتوب كما هو) */}
			<div className="hidden gap-4 sm:flex sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative max-w-md flex-1">
						<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t("projects.searchPlaceholder")}
							value={searchTerm}
							onChange={(e: any) => setSearchTerm(e.target.value)}
							className="rounded-lg border-input bg-card ps-10"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] rounded-lg border-input bg-card">
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
			</div>

			{/* Grid of Projects */}
			{projects.length > 0 ? (
				<div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{projects.map((project: any, index: any) => {
						const coverPhoto =
							(project as any).coverPhoto?.url ??
							(project as any).photos?.[0]?.url ??
							null;
						const gradientIndex = index % coverGradients.length;

						return (
							<Link
								key={project.id}
								href={`${basePath}/${project.id}`}
								className="animate-in fade-in slide-in-from-bottom-4 duration-300"
								style={{
									// Cap the stagger: an unbounded index*50ms reveal ran
									// for seconds with many projects and read as slow
									// loading even though the data was already hydrated.
									animationDelay: `${Math.min(index, 6) * 40}ms`,
								}}
							>
								<div className={`group relative h-full border-2 bg-card rounded-2xl overflow-hidden transition-colors duration-300 hover:border-primary/30 ${project.status === "ARCHIVED" ? "opacity-60" : ""}`}>
									{/* Cover Image / Gradient — شريط قصير على الجوال */}
									<div className="relative h-28 overflow-hidden sm:h-auto sm:aspect-[16/9]">
										<ProjectCover
											src={coverPhoto}
											alt={project.name || ""}
											gradientClass={coverGradients[gradientIndex]}
										/>
										{/* Overlay gradient */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
										{/* Project name on overlay */}
										<div className="absolute bottom-0 inset-x-0 p-3">
											<div className="flex items-start justify-between gap-2">
												<h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
													{project.name || t("projects.unnamed")}
												</h3>
												{getStatusBadge(project.status, t)}
											</div>
										</div>
									</div>

									{/* Card Content */}
									<div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
										{/* Client & Location */}
										<div className="space-y-1.5">
											{project.clientName && (
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<User className="h-3.5 w-3.5 shrink-0" />
													<span className="truncate">{project.clientName}</span>
												</div>
											)}
											{project.location && (
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<MapPin className="h-3.5 w-3.5 shrink-0" />
													<span className="truncate">{project.location}</span>
												</div>
											)}
										</div>

										{/* Progress */}
										<div>
											<div className="mb-1 flex items-center justify-between text-xs">
												<span className="text-muted-foreground">
													{t("projects.overview.progress")}
												</span>
												<span className="font-semibold text-chart-4">
													{Math.round(Number(project.progress))}%
												</span>
											</div>
											<Progress value={Number(project.progress)} className="h-1.5" />
										</div>

										{/* Footer: Contract Value + Team */}
										<div className="flex items-center justify-between border-t-2 pt-3">
											{project.contractValue ? (
												<div className="flex items-center gap-1.5">
													<Banknote className="h-3.5 w-3.5 text-muted-foreground" />
													<span className="text-xs font-semibold text-card-foreground">
														{formatSAR(project.contractValue)}
													</span>
												</div>
											) : (
												<span />
											)}
											<div className="flex items-center gap-1 text-xs text-muted-foreground">
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
						className="rounded-xl"
					>
						<Link href={`${basePath}/new`}>
							<Plus className="me-2 h-4 w-4" />
							{t("projects.newProject")}
						</Link>
					</Button>
				</EmptyState>
			)}
		</div>
	);
}

/**
 * غلاف بطاقة المشروع مع تدرّج بديل أنيق عند فشل تحميل الصورة
 * (الروابط الموقّعة تنتهي صلاحيتها فتظهر أيقونة صورة مكسورة بدون هذا).
 */
function ProjectCover({
	src,
	alt,
	gradientClass,
}: {
	src: string | null;
	alt: string;
	gradientClass: string;
}) {
	const [failed, setFailed] = useState(false);

	if (!src || failed) {
		return (
			<div
				className={`h-full w-full bg-gradient-to-br ${gradientClass} opacity-80`}
			/>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			fill
			sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
			className="object-cover transition-transform duration-500 group-hover:scale-110"
			unoptimized
			onError={() => setFailed(true)}
		/>
	);
}
