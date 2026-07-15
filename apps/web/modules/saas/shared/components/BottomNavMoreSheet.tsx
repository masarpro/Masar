"use client";

import type { SidebarMenuItem } from "@saas/shared/components/sidebar";
import { Sheet, SheetContent, SheetTitle } from "@ui/components/sheet";
import { cn } from "@ui/lib";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface BottomNavMoreSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** عنصر المنشأة مع أقسامه الفرعية (إن كان مرئياً للصلاحيات) */
	companyItem?: SidebarMenuItem;
	/** إعدادات المنشأة + الإدارة (المرئي منها فقط) */
	footerItems: SidebarMenuItem[];
	pathname: string;
}

/**
 * Bottom Sheet لعنصر «المزيد» في الشريط السفلي العام: أقسام المنشأة
 * الفرعية كشبكة بلاطات، ثم إعدادات المنشأة والإدارة. يعيد استخدام
 * مكوّن Sheet الموجود (نفس نمط شريط المشروع الحالي).
 */
export function BottomNavMoreSheet({
	open,
	onOpenChange,
	companyItem,
	footerItems,
	pathname,
}: BottomNavMoreSheetProps) {
	const t = useTranslations();

	const isActive = (href?: string) =>
		!!href && (pathname === href || pathname.startsWith(`${href}/`));

	const gridTiles = [
		...(companyItem?.children ?? []),
		...footerItems.flatMap((item) => (item.href ? [item] : [])),
	];

	if (gridTiles.length === 0) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="rounded-t-2xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))]"
				dir="rtl"
			>
				<SheetTitle className="mb-4 text-center text-base font-semibold">
					{t("app.menu.more")}
				</SheetTitle>

				{companyItem && companyItem.children && (
					<p className="mb-2 text-xs font-medium text-muted-foreground">
						{companyItem.label}
					</p>
				)}

				<div className="grid grid-cols-3 gap-4">
					{gridTiles.map((tile) => {
						const active = isActive(tile.href);
						const Icon = tile.icon;
						return (
							<Link
								key={tile.id}
								href={tile.href ?? "#"}
								onClick={() => onOpenChange(false)}
								className="flex flex-col items-center gap-2 py-3"
							>
								<div
									className={cn(
										"flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
										active ? "bg-primary" : "bg-muted",
									)}
								>
									<Icon
										className={cn(
											"h-5 w-5",
											active
												? "text-primary-foreground"
												: "text-muted-foreground",
										)}
									/>
								</div>
								<span
									className={cn(
										"text-center text-xs font-medium leading-tight",
										active ? "text-primary" : "text-muted-foreground",
									)}
								>
									{tile.label}
								</span>
							</Link>
						);
					})}
				</div>
			</SheetContent>
		</Sheet>
	);
}
