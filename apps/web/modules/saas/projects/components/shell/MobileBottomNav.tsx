"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import { ChevronUp } from "lucide-react";
import { useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetTitle,
} from "@ui/components/sheet";
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

interface MobileBottomNavProps {
	groups: VisibleGroup[];
	organizationSlug: string;
	projectId: string;
}

export function MobileBottomNav({
	groups,
	organizationSlug,
	projectId,
}: MobileBottomNavProps) {
	const t = useTranslations();
	const pathname = usePathname();

	// Only show groups marked for mobile dock
	const dockGroups = groups.filter((g) => g.showInMobileDock);

	if (dockGroups.length === 0) return null;

	return (
		<nav
			className={cn(
				"fixed bottom-0 inset-x-0 z-50 md:hidden",
				GLASS_CLASSES.bar,
				"border-t border-x-0 border-b-0 rounded-none pb-[env(safe-area-inset-bottom)]",
			)}
			dir="rtl"
		>
			<div className="flex items-stretch justify-around">
				{dockGroups.map((group) => (
					<MobileDockSlot
						key={group.id}
						group={group}
						organizationSlug={organizationSlug}
						projectId={projectId}
						pathname={pathname}
						t={t}
					/>
				))}
			</div>
		</nav>
	);
}

function MobileDockSlot({
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
	if (group.mobileSheet) {
		return (
			<MobileSheetSlot
				group={group}
				organizationSlug={organizationSlug}
				projectId={projectId}
				pathname={pathname}
				t={t}
			/>
		);
	}

	if (group.type === "popover") {
		return (
			<MobilePopoverSlot
				group={group}
				organizationSlug={organizationSlug}
				projectId={projectId}
				pathname={pathname}
				t={t}
			/>
		);
	}

	// Direct link - use first visible section
	const section = group.visibleSections[0];
	if (!section) return null;

	const isActive = isProjectSectionActive(pathname, section.path);
	const href = getProjectSectionHref(
		organizationSlug,
		projectId,
		section.path,
	);
	const Icon = group.icon;

	return (
		<Link
			href={href}
			className={cn(
				"flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-0 flex-1 transition-colors",
				isActive
					? "text-primary"
					: "text-muted-foreground",
			)}
		>
			<Icon className="h-5 w-5" />
			<span className="text-[10px] font-medium leading-tight truncate">
				{t(group.labelKey)}
			</span>
			{isActive && (
				<div className="w-1 h-1 rounded-full bg-primary" />
			)}
		</Link>
	);
}

function MobilePopoverSlot({
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

	const isGroupActive = group.visibleSections.some((s) =>
		isProjectSectionActive(pathname, s.path),
	);

	return (
		<NavGroupPopover
			sections={group.visibleSections}
			organizationSlug={organizationSlug}
			projectId={projectId}
			pathname={pathname}
			side="top"
			align="center"
			open={open}
			onOpenChange={setOpen}
		>
			<button
				type="button"
				className={cn(
					"flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-0 flex-1 transition-colors",
					isGroupActive
						? "text-primary"
						: "text-muted-foreground",
				)}
			>
				<div className="relative">
					<Icon className="h-5 w-5" />
					<ChevronUp className="absolute -top-1.5 -left-1.5 h-2.5 w-2.5 opacity-60" />
				</div>
				<span className="text-[10px] font-medium leading-tight truncate">
					{t(group.labelKey)}
				</span>
				{isGroupActive && (
					<div className="w-1 h-1 rounded-full bg-primary" />
				)}
			</button>
		</NavGroupPopover>
	);
}

function MobileSheetSlot({
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

	const isGroupActive = group.visibleSections.some((s) =>
		isProjectSectionActive(pathname, s.path),
	);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(
					"flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-0 flex-1 transition-colors",
					isGroupActive
						? "text-primary"
						: "text-muted-foreground",
				)}
			>
				<div className="relative">
					<Icon className="h-5 w-5" />
					<ChevronUp className="absolute -top-1.5 -left-1.5 h-2.5 w-2.5 opacity-60" />
				</div>
				<span className="text-[10px] font-medium leading-tight truncate">
					{t(group.labelKey)}
				</span>
				{isGroupActive && (
					<div className="w-1 h-1 rounded-full bg-primary" />
				)}
			</button>

			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8" dir="rtl">
					<SheetTitle className="text-center text-base font-semibold mb-4">
						{t(group.labelKey)}
					</SheetTitle>
					<div className="grid grid-cols-3 gap-4">
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
							const SectionIcon = section.icon;

							return (
								<Link
									key={section.id}
									href={href}
									onClick={() => setOpen(false)}
									className="flex flex-col items-center gap-2 py-3"
								>
									<div
										className={cn(
											"flex items-center justify-center w-12 h-12 rounded-2xl transition-colors",
											isActive
												? "bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/20"
												: "bg-muted",
										)}
									>
										<SectionIcon
											className={cn(
												"h-5 w-5",
												isActive
													? "text-primary-foreground"
													: "text-muted-foreground",
											)}
										/>
									</div>
									<span
										className={cn(
											"text-xs font-medium",
											isActive
												? "text-primary"
												: "text-muted-foreground",
										)}
									>
										{t(section.labelKey)}
									</span>
								</Link>
							);
						})}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
