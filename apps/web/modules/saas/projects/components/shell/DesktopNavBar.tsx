"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { NavGroupConfig, ProjectNavSection } from "./constants";
import {
	GLASS_CLASSES,
	getProjectSectionHref,
	isProjectSectionActive,
} from "./constants";
import { NavGroupPopover } from "./NavGroupPopover";

interface VisibleGroup extends NavGroupConfig {
	visibleSections: ProjectNavSection[];
}

interface DesktopNavBarProps {
	groups: VisibleGroup[];
	organizationSlug: string;
	projectId: string;
}

export function DesktopNavBar({
	groups,
	organizationSlug,
	projectId,
}: DesktopNavBarProps) {
	const t = useTranslations();
	const pathname = usePathname();

	return (
		<nav
			className={cn(
				"hidden md:flex items-center gap-1 px-2 py-1.5 rounded-2xl",
				GLASS_CLASSES.bar,
			)}
			dir="rtl"
		>
			{groups.map((group, index) => (
				<div key={group.id} className="flex items-center">
					{/* Vertical divider between groups */}
					{index > 0 && (
						<div className="w-px h-6 bg-border/50 mx-1" />
					)}

					{group.type === "direct" ? (
						<DirectGroupItems
							group={group}
							organizationSlug={organizationSlug}
							projectId={projectId}
							pathname={pathname}
							t={t}
						/>
					) : (
						<PopoverGroupItem
							group={group}
							organizationSlug={organizationSlug}
							projectId={projectId}
							pathname={pathname}
							t={t}
						/>
					)}
				</div>
			))}
		</nav>
	);
}

/** Renders direct link items for a group */
function DirectGroupItems({
	group,
	organizationSlug,
	projectId,
	pathname,
	t,
}: {
	group: VisibleGroup;
	organizationSlug: string;
	projectId: string;
	pathname: string;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<div className="flex items-center gap-0.5">
			{group.visibleSections.map((section) => {
				const isActive = isProjectSectionActive(
					pathname,
					section.path,
				);
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
						className={cn(
							"flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
							isActive
								? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:scale-105",
						)}
					>
						<Icon className="h-4 w-4" />
						<span>{t(section.labelKey)}</span>
					</Link>
				);
			})}
		</div>
	);
}

/** Renders a popover trigger for grouped items */
function PopoverGroupItem({
	group,
	organizationSlug,
	projectId,
	pathname,
	t,
}: {
	group: VisibleGroup;
	organizationSlug: string;
	projectId: string;
	pathname: string;
	t: ReturnType<typeof useTranslations>;
}) {
	const [open, setOpen] = useState(false);
	const Icon = group.icon;

	// Check if any section in this group is active
	const isGroupActive = group.visibleSections.some((s) =>
		isProjectSectionActive(pathname, s.path),
	);

	return (
		<NavGroupPopover
			sections={group.visibleSections}
			organizationSlug={organizationSlug}
			projectId={projectId}
			pathname={pathname}
			open={open}
			onOpenChange={setOpen}
		>
			<button
				type="button"
				className={cn(
					"flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
					isGroupActive
						? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20"
						: "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:scale-105",
				)}
			>
				<Icon className="h-4 w-4" />
				<span>{t(group.labelKey)}</span>
				<ChevronDown
					className={cn(
						"h-3 w-3 transition-transform duration-200",
						open && "rotate-180",
					)}
				/>
			</button>
		</NavGroupPopover>
	);
}
