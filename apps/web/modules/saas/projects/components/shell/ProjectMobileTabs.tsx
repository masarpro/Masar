"use client";

import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { NavGroupConfig, ProjectNavSection } from "./constants";
import {
	getProjectSectionHref,
	isProjectSectionActive,
} from "./constants";

interface VisibleGroup extends NavGroupConfig {
	visibleSections: ProjectNavSection[];
}

interface ProjectMobileTabsProps {
	groups: VisibleGroup[];
	organizationSlug: string;
	projectId: string;
}

/**
 * تبويبات أفقية قابلة للتمرير لأقسام المشروع على الجوال — تحل محل
 * الشريط السفلي القديم الخاص بالمشروع (الشريط السفلي العام للتطبيق
 * يبقى ثابتاً تحتها). نفس الأقسام ونفس الروابط، تغيير في العرض فقط.
 * التبويب النشط يتوسّط منطقة التمرير عند فتح الصفحة.
 */
export function ProjectMobileTabs({
	groups,
	organizationSlug,
	projectId,
}: ProjectMobileTabsProps) {
	const t = useTranslations();
	const pathname = usePathname();
	const activeRef = useRef<HTMLAnchorElement>(null);

	// كل الأقسام المرئية بترتيب المجموعات، بلا تكرار
	const seen = new Set<string>();
	const sections = groups
		.flatMap((g) => g.visibleSections)
		.filter((s) => {
			if (seen.has(s.id)) return false;
			seen.add(s.id);
			return true;
		});

	// توسيط التبويب النشط عند الفتح (بدون سحب الصفحة عمودياً)
	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only centering
	useEffect(() => {
		activeRef.current?.scrollIntoView({
			inline: "center",
			block: "nearest",
		});
	}, []);

	if (sections.length === 0) return null;

	return (
		<div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-hide md:hidden">
			<div className="flex w-max items-center gap-2">
				{sections.map((section) => {
					const active = isProjectSectionActive(pathname, section.path);
					const href = getProjectSectionHref(
						organizationSlug,
						projectId,
						section.path,
					);
					const Icon = section.icon;
					return (
						<Link
							key={section.id}
							href={href}
							ref={active ? activeRef : undefined}
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
								active
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-card text-muted-foreground",
							)}
						>
							<Icon className="h-3.5 w-3.5 shrink-0" />
							<span className="whitespace-nowrap">
								{t(section.labelKey)}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
