import { Slot, Slottable } from "@radix-ui/react-slot";
import { Spinner } from "@shared/components/Spinner";
import { cn } from "@ui/lib";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import * as React from "react";

/* Botly (Figma 43:12 Button, 63:5723 Icon button): radius 12px, semibold,
   full-opacity icons, hover surface = Stroke (--accent). lg/icon = 48px per
   Figma; sm/md keep Masar density (approved hybrid). */
const buttonVariants = cva(
	"flex items-center justify-center font-semibold enabled:cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&>svg]:me-1.5 [&>svg+svg]:hidden",
	{
		variants: {
			variant: {
				primary:
					"bg-primary text-primary-foreground hover:bg-primary/90",
				cta: "bg-[var(--cta)] text-[var(--cta-foreground)] hover:bg-[var(--cta)]/90 shadow-sm shadow-red-500/20",
				error: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/90",
				ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				sm: "h-6 rounded-lg px-3 text-xs",
				md: "h-8 rounded-lg px-4 text-sm",
				lg: "h-12 rounded-lg px-6 text-base [&>svg]:me-3",
				icon: "size-12 rounded-lg [&>svg]:m-0",
			},
		},
		defaultVariants: {
			variant: "secondary",
			size: "md",
		},
	},
);

export type ButtonProps = {
	asChild?: boolean;
	loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = ({
	className,
	children,
	variant,
	size,
	asChild = false,
	loading,
	disabled,
	...props
}: ButtonProps) => {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled || loading}
			{...props}
		>
			{loading && <Spinner className="me-1.5 size-4 text-inherit" />}
			<Slottable>{children}</Slottable>
		</Comp>
	);
};

export { Button, buttonVariants };
