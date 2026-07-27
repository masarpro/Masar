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
import type { ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════
// تنقل مساحة عمل الدراسة — صفّان
// ───────────────────────────────────────────────────────────────
// الصف الأول: مراحل العمل (الكميات، المواصفات، التكلفة والتسعير)
// الصف الثاني: الجداول (ملخص الكميات، طلبية المصنع، تفاصيل التفصيل،
//               التكلفة والتسعير)
// كل اللوحات مركّبة معاً، فالتبديل تبديل عرض فقط بلا تحميل.
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
		hint: "الأسعار والأرباح",
		icon: Wallet,
	},
];

export const TABLE_VIEWS: NavItem[] = [
	{ value: "table-summary", label: "ملخص الكميات", icon: Layers },
	{ value: "table-factory", label: "طلبية المصنع", icon: Factory },
	{ value: "table-cutting", label: "تفاصيل التفصيل", icon: Scissors },
	{ value: "table-cost", label: "التكلفة والتسعير", icon: Wallet },
];

interface WorkspaceNavProps {
	value: WorkspaceView;
	onChange: (view: WorkspaceView) => void;
	/** عدد البنود الإنشائية — يُخفي شريط الجداول حين لا توجد بنود */
	itemsCount: number;
	/** إجراء ثابت في نهاية شريط الجداول (تحويل لعرض سعر) */
	action?: ReactNode;
}

export function WorkspaceNav({
	value,
	onChange,
	itemsCount,
	action,
}: WorkspaceNavProps) {
	const isTableView = value.startsWith("table-");

	return (
		<div className="space-y-3" dir="rtl">
			{/* ─── الصف الأول: مراحل العمل ─── */}
			<div
				role="tablist"
				aria-label="مراحل الدراسة"
				className="grid grid-cols-3 gap-2 rounded-2xl border bg-card p-1.5"
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
								"group flex items-center justify-center gap-2.5 rounded-xl px-3 py-3 text-center transition-all duration-150",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								active
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<Icon
								className={cn(
									"h-5 w-5 shrink-0",
									active ? "opacity-100" : "opacity-70",
								)}
							/>
							<span className="min-w-0">
								<span className="block truncate font-semibold text-sm leading-tight">
									{item.label}
								</span>
								{item.hint && (
									<span
										className={cn(
											"mt-0.5 hidden truncate text-[11px] leading-tight sm:block",
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
			{(itemsCount > 0 || action) && (
				<div
					className={cn(
						"flex flex-wrap items-center gap-2 rounded-2xl border p-1.5 transition-colors",
						isTableView
							? "border-primary/30 bg-primary/5"
							: "bg-muted/30",
					)}
				>
					{itemsCount > 0 && (
						<span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 font-semibold text-muted-foreground text-xs">
							<Table2 className="h-3.5 w-3.5" />
							جداول
						</span>
					)}

					<div
						role="tablist"
						aria-label="جداول الدراسة"
						className="flex flex-1 flex-wrap items-center gap-1"
					>
						{itemsCount > 0 &&
							TABLE_VIEWS.map((item) => {
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
											"flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all duration-150",
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

					{action && <div className="shrink-0">{action}</div>}
				</div>
			)}
		</div>
	);
}
