"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@ui/components/sheet";
import { cn } from "@ui/lib";

interface MobileFilterSheetProps {
	/** عدد الفلاتر النشطة — يظهر كشارة على الزر */
	activeCount?: number;
	/** عناصر الفلترة (Select/RadioGroup...) تُعرض متراصة داخل الورقة */
	children: ReactNode;
	className?: string;
}

/**
 * ورقة فلاتر سفلية للجوال — بديل رصّ القوائم المنسدلة بعرض الشاشة.
 *
 * زر مضغوط (أيقونة + شارة عدّاد) يفتح Sheet من أسفل الشاشة تحوي عناصر
 * الفلترة. يُستخدم مع `className="sm:hidden"` بينما تبقى فلاتر الديسكتوب
 * كما هي خلف `hidden sm:flex` — صفر تأثير على عرض الكمبيوتر.
 */
export function MobileFilterSheet({
	activeCount = 0,
	children,
	className,
}: MobileFilterSheetProps) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					aria-label={t("common.filters")}
					className={cn(
						"relative h-10 w-10 shrink-0 rounded-xl border-white/20 bg-white/70 backdrop-blur-xl dark:border-slate-700/30 dark:bg-slate-900/70",
						className,
					)}
				>
					<SlidersHorizontal className="h-4 w-4" />
					{activeCount > 0 && (
						<span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
							{activeCount}
						</span>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="rounded-t-2xl pb-[max(env(safe-area-inset-bottom),1rem)]"
			>
				<SheetHeader className="pb-2 text-start">
					<SheetTitle className="text-base">
						{t("common.filters")}
					</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-3">{children}</div>
				<Button
					className="mt-4 w-full rounded-xl"
					onClick={() => setOpen(false)}
				>
					{t("common.apply")}
				</Button>
			</SheetContent>
		</Sheet>
	);
}
