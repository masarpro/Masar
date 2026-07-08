"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@ui/lib";

export interface CompactStatItem {
	label: string;
	value: ReactNode;
	icon: LucideIcon;
	/** لون الأيقونة، مثال: "text-sky-600 dark:text-sky-400" */
	iconClassName?: string;
	/** خلفية رقاقة الأيقونة، مثال: "bg-sky-100 dark:bg-sky-900/30" */
	iconBgClassName?: string;
	/** لون قيمة مخصص (اختياري) */
	valueClassName?: string;
	/** تلميح صغير بجانب القيمة (نسبة مثلاً) */
	hint?: ReactNode;
}

interface CompactStatGridProps {
	items: CompactStatItem[];
	className?: string;
}

/**
 * شريط إحصائيات مضغوط للجوال — بديل بطاقات KPI الضخمة.
 *
 * صف مدمج لكل مؤشر (أيقونة سطرية + عنوان صغير + قيمة text-base) في شبكة
 * عمودين، فتأخذ 4 مؤشرات ~ثلث ما تأخذه البطاقات الكاملة. يُستخدم مع
 * `className="sm:hidden"` بجانب بطاقات الديسكتوب الموجودة `hidden sm:grid`
 * — لا يغيّر عرض الكمبيوتر إطلاقاً.
 */
export function CompactStatGrid({ items, className }: CompactStatGridProps) {
	const isOdd = items.length % 2 === 1;
	return (
		<div className={cn("grid grid-cols-2 gap-2", className)}>
			{items.map((item, index) => (
				<div
					key={item.label}
					className={cn(
						"flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2.5 backdrop-blur-sm dark:border-slate-700/40 dark:bg-slate-900/70",
						// عدد فردي: العنصر الأخير يمتد بعرض كامل بدل بطاقة يتيمة مشوهة
						isOdd && index === items.length - 1 && "col-span-2",
					)}
				>
					<div
						className={cn(
							"shrink-0 rounded-lg p-1.5",
							item.iconBgClassName ?? "bg-slate-100 dark:bg-slate-800/60",
						)}
					>
						<item.icon
							className={cn(
								"h-4 w-4",
								item.iconClassName ??
									"text-slate-500 dark:text-slate-400",
							)}
						/>
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
							{item.label}
						</p>
						<p
							className={cn(
								"truncate text-base font-bold tabular-nums text-slate-900 dark:text-slate-100",
								item.valueClassName,
							)}
						>
							{item.value}
						</p>
					</div>
					{item.hint ? (
						<div className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
							{item.hint}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}
