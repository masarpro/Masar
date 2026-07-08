import type { ReactNode } from "react";
import { cn } from "@ui/lib";

const colorSchemes = {
	blue: {
		card: "bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-700/30",
		iconBg: "bg-blue-100 dark:bg-blue-900/30",
		iconText: "text-blue-600 dark:text-blue-400",
		badge: "text-blue-600 dark:text-blue-400",
		value: "text-blue-700 dark:text-blue-300",
		subtitle: "text-blue-600/70 dark:text-blue-400/70",
	},
	orange: {
		card: "bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-700/30",
		iconBg: "bg-orange-100 dark:bg-orange-900/30",
		iconText: "text-orange-600 dark:text-orange-400",
		badge: "text-orange-600 dark:text-orange-400",
		value: "text-orange-700 dark:text-orange-300",
		subtitle: "text-orange-600/70 dark:text-orange-400/70",
	},
	sky: {
		card: "bg-sky-50/80 dark:bg-sky-950/30 border-sky-100/50 dark:border-sky-900/50",
		iconBg: "bg-sky-100 dark:bg-sky-900/30",
		iconText: "text-sky-600 dark:text-sky-400",
		badge: "text-sky-600 dark:text-sky-400",
		value: "text-sky-700 dark:text-sky-300",
		subtitle: "text-sky-600/70 dark:text-sky-400/70",
	},
	red: {
		card: "bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-700/30",
		iconBg: "bg-red-100 dark:bg-red-900/30",
		iconText: "text-red-600 dark:text-red-400",
		badge: "text-red-600 dark:text-red-400",
		value: "text-red-700 dark:text-red-300",
		subtitle: "text-red-600/70 dark:text-red-400/70",
	},
	amber: {
		card: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-100/50 dark:border-amber-900/50",
		iconBg: "bg-amber-100 dark:bg-amber-900/30",
		iconText: "text-amber-600 dark:text-amber-400",
		badge: "text-amber-600 dark:text-amber-400",
		value: "text-amber-700 dark:text-amber-300",
		subtitle: "text-amber-600/70 dark:text-amber-400/70",
	},
	green: {
		card: "bg-green-50/80 dark:bg-green-950/30 border-green-100/50 dark:border-green-900/50",
		iconBg: "bg-green-100 dark:bg-green-900/30",
		iconText: "text-green-600 dark:text-green-400",
		badge: "text-green-600 dark:text-green-400",
		value: "text-green-700 dark:text-green-300",
		subtitle: "text-green-600/70 dark:text-green-400/70",
	},
	violet: {
		card: "bg-violet-50/80 dark:bg-violet-950/30 border-violet-100/50 dark:border-violet-900/50",
		iconBg: "bg-violet-100 dark:bg-violet-900/30",
		iconText: "text-violet-600 dark:text-violet-400",
		badge: "text-violet-600 dark:text-violet-400",
		value: "text-violet-700 dark:text-violet-300",
		subtitle: "text-violet-600/70 dark:text-violet-400/70",
	},
	slate: {
		card: "bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-700/30",
		iconBg: "bg-slate-100 dark:bg-slate-800/50",
		iconText: "text-slate-500 dark:text-slate-400",
		badge: "text-slate-500 dark:text-slate-400",
		value: "text-slate-600 dark:text-slate-300",
		subtitle: "text-slate-500/70 dark:text-slate-400/70",
	},
} as const;

export type GlassStatCardColorScheme = keyof typeof colorSchemes;

interface GlassStatCardProps {
	icon: ReactNode;
	title: string;
	value: ReactNode;
	subtitle?: ReactNode;
	badge?: ReactNode;
	colorScheme?: GlassStatCardColorScheme;
	children?: ReactNode;
	className?: string;
}

export function GlassStatCard({
	icon,
	title,
	value,
	subtitle,
	badge,
	colorScheme = "blue",
	children,
	className,
}: GlassStatCardProps) {
	const colors = colorSchemes[colorScheme];

	if (children) {
		return (
			<div
				className={cn(
					"backdrop-blur-xl border rounded-2xl shadow-lg shadow-black/5 p-4",
					colors.card,
					className,
				)}
			>
				{children}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"backdrop-blur-xl border rounded-2xl shadow-lg shadow-black/5 min-w-0 p-3 sm:p-4",
				colors.card,
				className,
			)}
		>
			<div className="flex items-center justify-between mb-2 sm:mb-3">
				<div
					className={cn(
						"p-1.5 sm:p-2 rounded-lg max-sm:[&_svg]:h-4 max-sm:[&_svg]:w-4",
						colors.iconBg,
					)}
				>
					{icon}
				</div>
				{badge && (
					<span className={cn("text-xs font-medium", colors.badge)}>
						{badge}
					</span>
				)}
			</div>
			<p className="truncate text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
				{title}
			</p>
			<p
				className={cn(
					"truncate tabular-nums text-lg sm:text-xl font-bold",
					colors.value,
				)}
			>
				{value}
			</p>
			{subtitle && (
				<p className={cn("truncate text-xs mt-1", colors.subtitle)}>
					{subtitle}
				</p>
			)}
		</div>
	);
}
