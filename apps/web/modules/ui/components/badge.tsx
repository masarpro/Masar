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
			status: {
				success: ["bg-emerald-500/10", "text-emerald-500"],
				info: ["bg-primary/10", "text-primary"],
				warning: ["bg-amber-500/10", "text-amber-500"],
				error: ["bg-rose-500/10", "text-rose-500"],
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
