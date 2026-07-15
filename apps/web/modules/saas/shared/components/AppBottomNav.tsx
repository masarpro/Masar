"use client";

import { BottomNavMoreSheet } from "@saas/shared/components/BottomNavMoreSheet";
import { useSidebarMenu } from "@saas/shared/components/sidebar";
import { cn } from "@ui/lib";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * الشريط السفلي العام للجوال — يظهر تحت md فقط في كل صفحات /app.
 * العناصر تأتي من useSidebarMenu نفسه الذي يغذّي الـ sidebar، فترث
 * فلترة الصلاحيات (RBAC) والترجمة والروابط بلا أي منطق مكرر.
 * تجربة الديسكتوب لا تتأثر إطلاقاً (md:hidden).
 */

/** عناصر الشريط الرئيسية بالترتيب (RTL: الأول يظهر أقصى اليمين) */
const MAIN_ITEM_IDS = ["start", "projects", "finance", "pricing"] as const;

/** عناصر Sheet «المزيد»: المنشأة (بأقسامها) + إعدادات المنشأة + الإدارة */
const MORE_ITEM_IDS = ["company", "orgSettings", "admin"] as const;

export function AppBottomNav() {
	const t = useTranslations();
	const pathname = usePathname();
	const { items } = useSidebarMenu();
	const [moreOpen, setMoreOpen] = useState(false);

	const mainItems = MAIN_ITEM_IDS.flatMap((id) => {
		const item = items.find((i) => i.id === id);
		return item?.href ? [item] : [];
	});

	const companyItem = items.find((i) => i.id === "company");
	const footerItems = MORE_ITEM_IDS.slice(1).flatMap((id) => {
		const item = items.find((i) => i.id === id);
		return item ? [item] : [];
	});
	const hasMore = !!companyItem || footerItems.length > 0;

	const moreActive = MORE_ITEM_IDS.some((id) => {
		const href = items.find((i) => i.id === id)?.href;
		return !!href && (pathname === href || pathname.startsWith(`${href}/`));
	});

	if (mainItems.length === 0 && !hasMore) return null;

	const isItemActive = (id: string, href: string) => {
		// الرئيسية: تطابق تام فقط (وإلا تبقى نشطة في كل الصفحات)
		if (id === "start") {
			return pathname === href || pathname === `${href}/`;
		}
		return pathname === href || pathname.startsWith(`${href}/`);
	};

	return (
		<nav
			aria-label={t("app.menu.mainNavigation")}
			className={cn(
				"fixed bottom-0 inset-x-0 z-50 md:hidden",
				"border-t border-border bg-background/85 backdrop-blur-lg",
				"pb-[env(safe-area-inset-bottom)]",
			)}
		>
			<div className="flex items-stretch justify-around">
				{mainItems.map((item) => {
					const active = isItemActive(item.id, item.href!);
					const Icon = item.icon;
					return (
						<Link
							key={item.id}
							href={item.href!}
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 transition-colors",
								active ? "text-primary" : "text-muted-foreground",
							)}
						>
							<Icon
								className={cn("h-5 w-5", active && "fill-primary/15")}
							/>
							<span className="truncate text-[10px] font-medium leading-tight">
								{item.label}
							</span>
						</Link>
					);
				})}

				{hasMore && (
					<button
						type="button"
						onClick={() => setMoreOpen(true)}
						aria-haspopup="dialog"
						aria-expanded={moreOpen}
						className={cn(
							"flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 transition-colors",
							moreActive ? "text-primary" : "text-muted-foreground",
						)}
					>
						<MoreHorizontal
							className={cn("h-5 w-5", moreActive && "fill-primary/15")}
						/>
						<span className="truncate text-[10px] font-medium leading-tight">
							{t("app.menu.more")}
						</span>
					</button>
				)}
			</div>

			{hasMore && (
				<BottomNavMoreSheet
					open={moreOpen}
					onOpenChange={setMoreOpen}
					companyItem={companyItem}
					footerItems={footerItems}
					pathname={pathname}
				/>
			)}
		</nav>
	);
}
