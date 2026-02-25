"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { cn } from "@ui/lib";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { useSidebar } from "./sidebar-context";
import type { SidebarMenuChild, SidebarMenuItem } from "./use-sidebar-menu";

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
					isActive && "text-primary",
					isSubItem ? "size-4" : "size-5",
				)}
			/>
			{!collapsed && <span>{item.label}</span>}
		</div>
	);
});

const navItemClasses = (isActive: boolean, isSubItem: boolean, collapsed: boolean) =>
	cn(
		"w-full flex items-center rounded-lg transition-all duration-200 ease-out relative",
		"hover:bg-muted",
		isActive &&
			"bg-primary/10 dark:bg-primary/20 text-primary font-medium",
		isSubItem ? "p-2.5 text-sm" : "p-3",
		isSubItem && !isActive && "text-muted-foreground",
		collapsed && !isSubItem && "justify-center",
	);

export function SidebarNav({ items, activeId, collapsed }: SidebarNavProps) {
	const { setMobileOpen } = useSidebar();

	// Track which parent menus are open (for items with children)
	const [openMenus, setOpenMenus] = useState<string[]>([]);

	// Auto-expand parent when a child is active
	useEffect(() => {
		if (!activeId) {
			return;
		}
		for (const item of items) {
			if (item.children?.some((c) => c.id === activeId)) {
				setOpenMenus((prev) =>
					prev.includes(item.id) ? prev : [...prev, item.id],
				);
				break;
			}
		}
	}, [activeId, items]);

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
							onOpenChange={(open) =>
								setOpenMenus((prev) =>
									open
										? [...prev, item.id]
										: prev.filter((id) => id !== item.id),
								)
							}
						>
							<div
								className={cn(
									"w-full flex items-center justify-between rounded-lg transition-all duration-200 ease-out relative",
									"hover:bg-muted",
									isActive &&
										"bg-primary/10 dark:bg-primary/20 text-primary font-medium",
									"p-3",
								)}
							>
								{item.href ? (
									<Link
										href={item.href}
										onClick={closeMobile}
										className="flex flex-1 min-w-0 items-center gap-3"
									>
										<item.icon
											className={cn(
												"size-5 shrink-0",
												isActive && "text-primary",
											)}
										/>
										<span>{item.label}</span>
									</Link>
								) : (
									<div className="flex flex-1 min-w-0 items-center gap-3">
										<item.icon
											className={cn(
												"size-5 shrink-0",
												isActive && "text-primary",
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
									<div className="ms-4 mt-1 space-y-1 border-s-2 border-border ps-3">
									{(item.children ?? []).map((child) => {
										const childHref = child.href;
										const childActive = child.id === activeId;
										return childHref ? (
											<Link
												key={child.id}
												href={childHref}
												onClick={closeMobile}
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
											? prev.filter((id) => id !== item.id)
											: [...prev, item.id],
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
