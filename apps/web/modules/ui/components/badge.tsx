import { cn } from "@ui/lib";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type React from "react";

export const badge = cva(
	[
		"inline-flex",
		"items-center",
		"rounded-full",
		"px-2.5",
		"py-0.5",
		"text-xs",
		"font-semibold",
		"transition-colors",
	],
	{
		variants: {
			variant: {
				default: ["bg-primary", "text-primary-foreground"],
				secondary: ["bg-secondary", "text-secondary-foreground"],
				destructive: ["bg-destructive", "text-destructive-foreground"],
				outline: ["border", "border-input", "text-foreground"],
			},
			// Botly-derived: success=Brand/05, info=Brand/04, error=Brand/02.
			// warning stays amber — Botly's only yellow (Brand/01 #ffcc6f) is
			// illegible as text on light backgrounds (documented deviation).
			status: {
				success: ["bg-success/10", "text-success"],
				info: ["bg-chart-4/10", "text-chart-4"],
				warning: ["bg-amber-500/10", "text-amber-500"],
				error: ["bg-destructive/10", "text-destructive"],
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export type BadgeProps = React.HtmlHTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badge>;

export const Badge = ({
	children,
	className,
	variant,
	status,
	...props
}: BadgeProps) => (
	<span className={cn(badge({ variant, status }), className)} {...props}>
		{children}
	</span>
);

Badge.displayName = "Badge";
