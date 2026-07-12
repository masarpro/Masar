import { cn } from "@ui/lib";
import * as React from "react";

/* Botly Widget (Figma 69:3172): radius 32px, border-2 Stroke, flat (no
   shadow), 24px vertical / 32px horizontal padding, title = 20px semibold. */
const Card = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"rounded-[var(--botly-radius-card)] border-2 bg-card text-card-foreground",
			className,
		)}
		{...props}
	/>
);

const CardHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn("flex flex-col space-y-1.5 px-8 pt-6 pb-4", className)}
		{...props}
	/>
);

const CardTitle = ({
	className,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
	<h3
		className={cn("font-semibold text-xl leading-6", className)}
		{...props}
	/>
);

const CardDescription = ({
	className,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
	<p className={cn("text-muted-foreground text-sm", className)} {...props} />
);

const CardContent = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("px-8 pt-0 pb-6", className)} {...props} />
);

const CardFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex items-center px-8 pt-0 pb-6", className)} {...props} />
);

export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
