"use client";

import { cn } from "@ui/lib";
import {
	Building2,
	ClipboardList,
	Factory,
	Layers,
	Scissors,
	Table2,
	Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// تنقل مساحة عمل الدراسة — صفّان
// ───────────────────────────────────────────────────────────────
// الصف الأول: مراحل العمل (الكميات، المواصفات، التكلفة والتسعير)
// الصف الثاني: الجداول (ملخص الكميات، طلبية المصنع، تفاصيل التفصيل،
//               التكلفة والتسعير)
// كل اللوحات مركّبة معاً، فالتبديل تبديل عرض فقط بلا تحميل.
//
// على الجوال: خط أصغر، تسميات مختصرة للصف الأول، والجداول شبكة 2×2
// بدل التفاف عشوائي.
// ═══════════════════════════════════════════════════════════════

export type WorkspaceView =
	| "quantities"
	| "specs"
	| "costing"
	| "table-summary"
	| "table-factory"
	| "table-cutting"
	| "table-cost";

interface NavItem {
	value: WorkspaceView;
	label: string;
	/** تسمية الجوال حين تكون الأصلية أطول من عرض الخانة */
	shortLabel?: string;
	hint?: string;
	icon: LucideIcon;
}

export const PRIMARY_VIEWS: NavItem[] = [
	{
		value: "quantities",
		label: "الكميات",
		hint: "إدخال العناصر الإنشائية",
		icon: Building2,
	},
	{
		value: "specs",
		label: "المواصفات",
		hint: "الخرسانة والحديد والبلوك",
		icon: ClipboardList,
	},
	{
		value: "costing",
		label: "التكلفة والتسعير",
		shortLabel: "التكلفة",
		hint: "الأسعار والأرباح",
		icon: Wallet,
	},
];

export const TABLE_VIEWS: NavItem[] = [
	{ value: "table-summary", label: "ملخص الكميات", icon: Layers },
	{ value: "table-factory", label: "طلبية المصنع", icon: Factory },
	{ value: "table-cutting", label: "تفاصيل التفصيل", icon: Scissors },
	{
		value: "table-cost",
		label: "التكلفة والتسعير",
		shortLabel: "التكلفة",
		icon: Wallet,
	},
];

interface WorkspaceNavProps {
	value: WorkspaceView;
	onChange: (view: WorkspaceView) => void;
	/** عدد البنود الإنشائية — يُخفي شريط الجداول حين لا توجد بنود */
	itemsCount: number;
}

export function WorkspaceNav({
	value,
	onChange,
	itemsCount,
}: WorkspaceNavProps) {
	const isTableView = value.startsWith("table-");

	return (
		<div className="space-y-2 sm:space-y-3" dir="rtl">
			{/* ─── الصف الأول: مراحل العمل ─── */}
			<div
				role="tablist"
				aria-label="مراحل الدراسة"
				className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1 sm:gap-2 sm:rounded-2xl sm:p-1.5"
			>
				{PRIMARY_VIEWS.map((item) => {
					const Icon = item.icon;
					const active = value === item.value;
					return (
						<button
							key={item.value}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => onChange(item.value)}
							className={cn(
								"flex flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center transition-colors",
								"sm:flex-row sm:gap-2.5 sm:rounded-xl sm:px-3 sm:py-3",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								active
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
							<span className="min-w-0">
								<span className="block font-semibold text-[11px] leading-tight sm:text-sm">
									<span
										className={
											item.shortLabel
												? "sm:hidden"
												: undefined
										}
									>
										{item.shortLabel ?? item.label}
									</span>
									{item.shortLabel && (
										<span className="hidden sm:inline">
											{item.label}
										</span>
									)}
								</span>
								{item.hint && (
									<span
										className={cn(
											"mt-0.5 hidden truncate text-[11px] leading-tight lg:block",
											active
												? "text-primary-foreground/75"
												: "text-muted-foreground/70",
										)}
									>
										{item.hint}
									</span>
								)}
							</span>
						</button>
					);
				})}
			</div>

			{/* ─── الصف الثاني: الجداول ─── */}
			{itemsCount > 0 && (
				<div
					className={cn(
						"rounded-xl border p-1 transition-colors sm:rounded-2xl sm:p-1.5",
						isTableView
							? "border-primary/30 bg-primary/5"
							: "bg-muted/30",
					)}
				>
					<div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
						<span className="flex w-fit shrink-0 items-center gap-1.5 rounded-lg bg-background px-2 py-1 font-semibold text-[11px] text-muted-foreground sm:px-2.5 sm:py-1.5 sm:text-xs">
							<Table2 className="h-3.5 w-3.5" />
							جداول
						</span>

						<div
							role="tablist"
							aria-label="جداول الدراسة"
							className="grid grid-cols-2 gap-1 sm:flex sm:flex-1 sm:flex-wrap sm:items-center"
						>
							{TABLE_VIEWS.map((item) => {
								const Icon = item.icon;
								const active = value === item.value;
								return (
									<button
										key={item.value}
										type="button"
										role="tab"
										aria-selected={active}
										onClick={() => onChange(item.value)}
										className={cn(
											"flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-[11px] transition-colors",
											"sm:justify-start sm:px-3 sm:text-xs",
											"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											active
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:bg-background hover:text-foreground",
										)}
									>
										<Icon className="h-3.5 w-3.5 shrink-0" />
										{item.label}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
