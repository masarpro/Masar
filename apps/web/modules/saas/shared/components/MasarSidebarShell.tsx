/**
 * MasarSidebarShell - UI Shell Only Component
 *
 * This is a visual-only component with NO business logic.
 * All data and behavior comes from props.
 *
 * Visual design migrated from: supastarter-nextjs-1/MasarSidebar.tsx
 * CSS classes preserved exactly as source for visual consistency.
 */
"use client";

import { cn } from "@ui/lib";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { useState, useEffect } from "react";

// ============================================
// Types (Props-based API)
// ============================================

export interface SidebarItem {
	id: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	children?: SidebarItem[];
}

export interface MasarSidebarShellProps {
	/** Menu items to display */
	items: SidebarItem[];
	/** Bottom menu items (e.g., help, logout) */
	bottomItems?: SidebarItem[];
	/** Currently active item ID */
	activeId?: string;
	/** Whether sidebar is collapsed */
	collapsed?: boolean;
	/** Called when collapse state changes */
	onCollapse?: (collapsed: boolean) => void;
	/** Called when an item is clicked */
	onItemClick?: (item: SidebarItem) => void;
	/** Whether mobile sidebar is open */
	mobileOpen?: boolean;
	/** Called when mobile open state changes */
	onMobileOpenChange?: (open: boolean) => void;
	/** Header configuration */
	header?: {
		logo?: React.ReactNode;
		title?: string;
		subtitle?: string;
	};
	/** Custom content below header (e.g., OrganizationSelect) */
	headerExtra?: React.ReactNode;
	/** Custom footer content (e.g., UserMenu) */
	footer?: React.ReactNode;
	/** Sidebar position: "start" (left in LTR, right in RTL) or "end" (right in LTR, left in RTL) */
	side?: "start" | "end";
	/** Additional className for the sidebar container */
	className?: string;
}

// ============================================
// Component
// ============================================

export function MasarSidebarShell({
	items,
	bottomItems = [],
	activeId,
	collapsed = false,
	onCollapse,
	onItemClick,
	mobileOpen = false,
	onMobileOpenChange,
	header,
	headerExtra,
	footer,
	side = "end",
	className,
}: MasarSidebarShellProps) {
	// Local state for open submenus (visual only)
	const [openMenus, setOpenMenus] = useState<string[]>([]);

	// Auto-expand parent menu when a child item is active
	useEffect(() => {
		if (!activeId) return;

		// Find the parent of the active item
		for (const item of items) {
			if (item.children?.some((child) => child.id === activeId)) {
				// If this parent's menu is not open, open it
				if (!openMenus.includes(item.id)) {
					setOpenMenus((prev) => [...prev, item.id]);
				}
				break;
			}
		}
	}, [activeId, items]);

	// Toggle submenu open/closed
	const toggleMenu = (menuId: string) => {
		setOpenMenus((prev) =>
			prev.includes(menuId)
				? prev.filter((id) => id !== menuId)
				: [...prev, menuId],
		);
	};

	// Check if a menu is open
	const isMenuOpen = (menuId: string) => openMenus.includes(menuId);

	// Check if an item or its children are active
	const isItemActive = (item: SidebarItem): boolean => {
		if (item.id === activeId) return true;
		if (item.children) {
			return item.children.some((child) => child.id === activeId);
		}
		return false;
	};

	// Handle item click
	const handleItemClick = (item: SidebarItem) => {
		onItemClick?.(item);
		onMobileOpenChange?.(false);
	};

	// Render a single menu item
	const renderMenuItem = (item: SidebarItem, isSubmenuItem = false) => {
		const hasChildren = item.children && item.children.length > 0;
		const isActive = isItemActive(item);
		const Icon = item.icon;

			const itemClasses = cn(
			"w-full flex items-center rounded-lg transition-all duration-200 ease-out relative",
			"hover:bg-muted",
			isActive && "bg-primary/10 dark:bg-primary/20 text-primary font-medium",
			isSubmenuItem ? "p-2.5 text-sm" : "p-3",
			isSubmenuItem && !isActive && "text-muted-foreground",
			collapsed && !isSubmenuItem && "justify-center",
			!collapsed && hasChildren && "justify-between",
		);

		const iconClasses = cn(
			"shrink-0",
			isActive && "text-primary",
			isSubmenuItem ? "size-4" : "size-5",
		);

		const content = (
			<>
				<div
					className={cn(
						"flex items-center",
						collapsed ? "justify-center" : "gap-3",
					)}
				>
					<Icon className={iconClasses} />
					{!collapsed && <span>{item.label}</span>}
				</div>
				{!collapsed && hasChildren && (
					<ChevronDown
						className={cn(
							"size-4 shrink-0 transition-transform duration-200 ease-out",
							isMenuOpen(item.id) && "rotate-180",
						)}
					/>
				)}
			</>
		);

		if (hasChildren) {
			return (
				<button
					type="button"
					onClick={() => {
						// Navigate to the parent page
						handleItemClick(item);
						// Open the submenu if not already open
						if (!isMenuOpen(item.id)) {
							toggleMenu(item.id);
						}
					}}
					className={itemClasses}
					aria-expanded={isMenuOpen(item.id)}
					aria-controls={`submenu-${item.id}`}
				>
					{content}
				</button>
			);
		}

		return (
			<button
				type="button"
				onClick={() => handleItemClick(item)}
				className={itemClasses}
			>
				{content}
			</button>
		);
	};

	return (
		<>
			{/* Mobile Overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => onMobileOpenChange?.(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") onMobileOpenChange?.(false);
					}}
					role="button"
					tabIndex={0}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					// Position & Size - always use start-0 (follows dir automatically)
					"fixed top-0 z-50 h-full start-0",
					// Flex layout for footer at bottom
					"flex flex-col",
					// Background & Border (border on the end side)
					"bg-card",
					"border-e border-border",
					"shadow-lg",
					// Width Transition
					"transition-all duration-300 ease-out",
					collapsed ? "w-20" : "w-72",
					// Mobile: hidden by default, visible on lg+
					// LTR: push left (-x), RTL: push right (+x)
					"-translate-x-full [dir=rtl]:translate-x-full lg:translate-x-0",
					mobileOpen && "!translate-x-0",
					className,
				)}
			>
				{/* Header */}
				<div
					className={cn(
						"flex h-16 items-center border-b border-border px-4",
						collapsed ? "justify-end" : "justify-between",
					)}
				>
					{!collapsed && header && (
						<div className="flex items-center gap-3">
							{header.logo}
							{(header.title || header.subtitle) && (
								<div>
									{header.title && (
										<h1 className="text-lg font-bold">{header.title}</h1>
									)}
									{header.subtitle && (
										<p className="text-xs text-muted-foreground">
											{header.subtitle}
										</p>
									)}
								</div>
							)}
						</div>
					)}
					<button
						type="button"
						onClick={() => onCollapse?.(!collapsed)}
						className={cn(
							"rounded-lg p-2 transition-colors duration-200 ease-out hover:bg-muted",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						)}
						aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{collapsed ? (
							<ChevronRight className="size-5 rtl-flip" />
						) : (
							<Menu className="size-5" />
						)}
					</button>
				</div>

				{/* Header Extra (e.g., OrganizationSelect) */}
				{!collapsed && headerExtra && (
					<div className="border-b border-border px-3 py-2">
						{headerExtra}
					</div>
				)}

				{/* Menu */}
				<nav
					className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-3"
					role="navigation"
					aria-label="Main navigation"
				>
					{items.map((item) => (
						<div key={item.id}>
							{renderMenuItem(item)}

							{/* Submenu with animation */}
							{item.children && item.children.length > 0 && (
								<div
									id={`submenu-${item.id}`}
									className={cn(
										"grid transition-all duration-200 ease-out",
										!collapsed && isMenuOpen(item.id)
											? "grid-rows-[1fr] opacity-100"
											: "grid-rows-[0fr] opacity-0",
									)}
								>
									<div className="overflow-hidden">
										<div className="ms-4 mt-1 space-y-1 border-s-2 border-border ps-3">
											{item.children.map((child) => (
												<div key={child.id}>
													{renderMenuItem(child, true)}
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</div>
					))}
				</nav>

				{/* Bottom Menu */}
				{bottomItems.length > 0 && (
					<div className="border-t border-border bg-card p-3">
						{bottomItems.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => handleItemClick(item)}
								className={cn(
									"flex w-full items-center rounded-lg p-3 transition-all duration-200 ease-out",
									collapsed ? "justify-center" : "gap-3",
									"hover:bg-muted",
									item.id === "logout" &&
										"text-destructive hover:bg-destructive/10",
								)}
								aria-label={collapsed ? item.label : undefined}
							>
								<item.icon className="size-5 shrink-0" />
								{!collapsed && (
									<span className="text-sm">{item.label}</span>
								)}
							</button>
						))}
					</div>
				)}

				{/* Footer (e.g., UserMenu) */}
				{footer && (
					<div className="mt-auto border-t border-border bg-card p-3">
						{footer}
					</div>
				)}
			</aside>

			{/* Mobile Toggle Button */}
			<button
				type="button"
				onClick={() => onMobileOpenChange?.(true)}
				className={cn(
					"fixed start-4 top-4 z-30 rounded-lg border border-border bg-card p-2 shadow-lg lg:hidden",
					"transition-opacity duration-200 ease-out",
					mobileOpen && "pointer-events-none opacity-0",
				)}
				aria-label="Open menu"
				aria-expanded={mobileOpen}
			>
				<Menu className="size-6" />
			</button>
		</>
	);
}
