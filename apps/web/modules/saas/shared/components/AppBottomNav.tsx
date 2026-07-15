"use client";

import { useSidebarMenu } from "@saas/shared/components/sidebar";
import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * الشريط السفلي العام للجوال — يظهر تحت md فقط في كل صفحات /app.
 * العناصر تأتي من useSidebarMenu نفسه الذي يغذّي الـ sidebar، فترث
 * فلترة الصلاحيات (RBAC) والترجمة والروابط بلا أي منطق مكرر.
 * تجربة الديسكتوب لا تتأثر إطلاقاً (md:hidden).
 */

/** عناصر الشريط الرئيسية بالترتيب (RTL: الأول يظهر أقصى اليمين) */
const MAIN_ITEM_IDS = ["start", "projects", "finance", "pricing"] as const;

export function AppBottomNav() {
	const t = useTranslations();
	const pathname = usePathname();
	const { items } = useSidebarMenu();

	const mainItems = MAIN_ITEM_IDS.flatMap((id) => {
		const item = items.find((i) => i.id === id);
		return item?.href ? [item] : [];
	});

	if (mainItems.length === 0) return null;

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
			</div>
		</nav>
	);
}
