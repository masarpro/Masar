"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { cn } from "@ui/lib";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { memo, useState } from "react";
import { useSidebar } from "./sidebar-context";
import type { SidebarMenuChild, SidebarMenuItem } from "./use-sidebar-menu";

/** Top-level items that benefit from eager FULL prefetch. Everything else
 * falls back to Next's default (partial prefetch to the nearest loading.tsx
 * on viewport) instead of prefetch={false}, which forced a fully cold
 * navigation on every non-whitelisted link. */
const PREFETCH_IDS = new Set(["start", "projects", "finance", "company", "pricing", "orgSettings", "accountSettings"]);

/** true → eager full prefetch; undefined → Next default (partial on viewport) */
const prefetchMode = (id: string): true | undefined =>
	PREFETCH_IDS.has(id) ? true : undefined;

interface SidebarNavProps {
	items: SidebarMenuItem[];
	activeId: string | undefined;
	collapsed: boolean;
}

const NavItemContent = memo(function NavItemContent({
	item,
	isSubItem,
	isActive,
	collapsed,
}: {
	item: SidebarMenuItem | SidebarMenuChild;
	isSubItem: boolean;
	isActive: boolean;
	collapsed: boolean;
}) {
	const Icon = item.icon;

	return (
		<div
			className={cn(
				"flex items-center",
				collapsed ? "justify-center" : "gap-3",
			)}
		>
			<Icon
				className={cn(
					"shrink-0",
					isSubItem ? "size-4" : "size-5",
				)}
			/>
			{!collapsed && <span>{item.label}</span>}
		</div>
	);
});

/* Botly menu item (63:8787 resting / 63:8790 active): resting = Text
   secondary on transparent; active = On-surface chip + white/10 border +
   Text invert, semibold. Hover derived: sidebar-accent at 50%. */
/* Botly menu items are Base 1 (16px semibold) at every state (63:8787). */
const navItemClasses = (isActive: boolean, isSubItem: boolean, collapsed: boolean) =>
	cn(
		"w-full flex items-center rounded-lg font-semibold transition-all duration-200 ease-out relative border border-transparent",
		"hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
		isActive &&
			"bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground",
		isSubItem ? "px-2.5 py-2.5 text-sm" : "p-3 text-[15px]",
		isSubItem && !isActive && "text-sidebar-foreground/80",
		collapsed && !isSubItem && "justify-center",
	);

export function SidebarNav({ items, activeId, collapsed }: SidebarNavProps) {
	const { setMobileOpen } = useSidebar();

	// Track which parent menus are open (accordion: only one at a time, all closed by default)
	const [openMenus, setOpenMenus] = useState<string[]>([]);

	const closeMobile = () => setMobileOpen(false);

	const getHref = (item: SidebarMenuItem | SidebarMenuChild): string | undefined =>
		"href" in item ? item.href : undefined;

	const isItemActive = (item: SidebarMenuItem | SidebarMenuChild): boolean => {
		if (item.id === activeId) {
			return true;
		}
		if ("children" in item && item.children) {
			return item.children.some((c) => c.id === activeId);
		}
		return false;
	};

	return (
		<nav
			className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-3"
			aria-label="Main navigation"
		>
			{items.map((item) => {
				const hasChildren = item.children && item.children.length > 0;
				const isOpen = openMenus.includes(item.id);
				const isActive = isItemActive(item);

				if (hasChildren && !collapsed) {
					return (
						<Collapsible
							key={item.id}
							open={isOpen}
							onOpenChange={(open: any) =>
								setOpenMenus(
									open ? [item.id] : [],
								)
							}
						>
							<div
								className={cn(
									"w-full flex items-center justify-between rounded-lg font-semibold text-[15px] transition-all duration-200 ease-out relative border border-transparent",
									"hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
									isActive &&
										"bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground",
									"p-3",
								)}
							>
								{item.href ? (
									<Link
										href={item.href}
										onClick={closeMobile}
										prefetch={prefetchMode(item.id)}
										className="flex flex-1 min-w-0 items-center gap-3"
									>
										<item.icon
											className={cn(
												"size-5 shrink-0",
																		)}
										/>
										<span>{item.label}</span>
									</Link>
								) : (
									<div className="flex flex-1 min-w-0 items-center gap-3">
										<item.icon
											className={cn(
												"size-5 shrink-0",
																		)}
										/>
										<span>{item.label}</span>
									</div>
								)}
								<CollapsibleTrigger asChild>
									<button
										type="button"
										aria-label={item.label}
										className="shrink-0 rounded p-1 hover:bg-muted-foreground/20"
									>
										<ChevronDown
											className={cn(
												"size-4 shrink-0 transition-transform duration-200 ease-out",
												isOpen && "rotate-180",
											)}
										/>
									</button>
								</CollapsibleTrigger>
							</div>
							<CollapsibleContent
								className="grid transition-all duration-200 ease-out data-[state=closed]:grid-rows-[0fr] data-[state=closed]:opacity-0 data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100"
							>
								<div className="overflow-hidden">
									<div className="ms-4 mt-1 space-y-1 border-s-2 border-sidebar-border ps-3">
									{(item.children ?? []).map((child) => {
										const childHref = child.href;
										const childActive = child.id === activeId;
										return childHref ? (
											<Link
												key={child.id}
												href={childHref}
												onClick={closeMobile}
												prefetch
												className={navItemClasses(childActive, true, false)}
											>
												<NavItemContent
													item={child}
													isSubItem
													isActive={childActive}
													collapsed={false}
												/>
											</Link>
										) : (
											<div key={child.id} className={navItemClasses(childActive, true, false)}>
												<NavItemContent
													item={child}
													isSubItem
													isActive={childActive}
													collapsed={false}
												/>
											</div>
										);
									})}
									</div>
								</div>
							</CollapsibleContent>
						</Collapsible>
					);
				}

				// Leaf item or collapsed parent
				const href = hasChildren ? item.href : getHref(item);
				return href ? (
					<Link
						key={item.id}
						href={href}
						onClick={closeMobile}
						prefetch={prefetchMode(item.id)}
						className={navItemClasses(isActive, false, collapsed)}
						aria-label={collapsed ? item.label : undefined}
					>
						<NavItemContent
							item={item}
							isSubItem={false}
							isActive={isActive}
							collapsed={collapsed}
						/>
					</Link>
				) : (
					<div key={item.id}>
						<button
							type="button"
							aria-label={item.label}
							onClick={() => {
								if (hasChildren) {
									setOpenMenus((prev) =>
										prev.includes(item.id)
											? []
											: [item.id],
									);
								}
							}}
							className={navItemClasses(isActive, false, collapsed)}
						>
							<NavItemContent
								item={item}
								isSubItem={false}
								isActive={isActive}
								collapsed={collapsed}
							/>
						</button>
					</div>
				);
			})}
		</nav>
	);
}
