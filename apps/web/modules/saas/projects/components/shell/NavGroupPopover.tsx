"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import type { ProjectNavSection } from "./constants";
import { isProjectSectionActive, getProjectSectionHref } from "./constants";

interface NavGroupPopoverProps {
	sections: ProjectNavSection[];
	organizationSlug: string;
	projectId: string;
	pathname: string;
	/** The trigger element */
	children: React.ReactNode;
	/** Popover opening side */
	side?: "top" | "bottom";
	/** Popover alignment */
	align?: "start" | "center" | "end";
	/** Additional class for popover content */
	className?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function NavGroupPopover({
	sections,
	organizationSlug,
	projectId,
	pathname,
	children,
	side = "bottom",
	align = "center",
	className,
	open,
	onOpenChange,
}: NavGroupPopoverProps) {
	const t = useTranslations();

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				side={side}
				align={align}
				sideOffset={8}
				className={cn(
					"w-auto min-w-[180px] p-2 bg-card border-2 rounded-xl shadow-[0px_8px_32px_12px_rgba(0,0,0,0.06)]",
					className,
				)}
			>
				<div className="flex flex-col gap-1">
					{sections.map((section) => {
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
								onClick={() => onOpenChange?.(false)}
								className={cn(
									"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-foreground hover:bg-accent hover:text-accent-foreground",
								)}
							>
								<div
									className={cn(
										"flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
										isActive
											? "bg-white/20"
											: "bg-primary/10 dark:bg-primary/20",
									)}
								>
									<Icon
										className={cn(
											"h-4 w-4",
											isActive
												? "text-primary-foreground"
												: "text-primary",
										)}
									/>
								</div>
								<span>{t(section.labelKey)}</span>
							</Link>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
