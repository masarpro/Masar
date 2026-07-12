import type { ReactNode } from "react";
import { cn } from "@ui/lib";

/* Botly-restyle: flat card (bg-card + 2px Stroke, no glass/shadow), value is
   always Text Primary, label/subtitle Text secondary; scheme hue kept only on
   the icon chip + badge, remapped to Botly Brand/01..05. */
const colorSchemes = {
	blue: {
		card: "bg-card border-border",
		iconBg: "bg-chart-4/15",
		iconText: "text-chart-4",
		badge: "text-chart-4",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
	},
	orange: {
		card: "bg-card border-border",
		iconBg: "bg-chart-1/20",
		iconText: "text-chart-1",
		badge: "text-chart-1",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
	},
	sky: {
		card: "bg-card border-border",
		iconBg: "bg-chart-3/20",
		iconText: "text-chart-3",
		badge: "text-chart-3",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
	},
	red: {
		card: "bg-card border-border",
		iconBg: "bg-destructive/15",
		iconText: "text-destructive",
		badge: "text-destructive",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
	},
	amber: {
		card: "bg-card border-border",
		iconBg: "bg-chart-1/20",
		iconText: "text-chart-1",
		badge: "text-chart-1",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
	},
	green: {
		card: "bg-card border-border",
		iconBg: "bg-success/15",
		iconText: "text-success",
		badge: "text-success",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
	},
	violet: {
		card: "bg-card border-border",
		iconBg: "bg-chart-4/15",
		iconText: "text-chart-4",
		badge: "text-chart-4",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
	},
	slate: {
		card: "bg-card border-border",
		iconBg: "bg-muted",
		iconText: "text-muted-foreground",
		badge: "text-muted-foreground",
		value: "text-foreground",
		subtitle: "text-muted-foreground",
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
					"border-2 rounded-[var(--botly-radius-card)] p-4",
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
				"border-2 rounded-[var(--botly-radius-card)] min-w-0 p-3 sm:p-4",
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
			<p className="truncate text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">
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
