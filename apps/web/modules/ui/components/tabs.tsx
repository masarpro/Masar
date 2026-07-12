"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@ui/lib";
import * as React from "react";

const Tabs = TabsPrimitive.Root;

const TabsList = ({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
	<div className="min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
		{/* Botly tabs (Figma 43:163): pill style, no underline container */}
		<TabsPrimitive.List
			className={cn(
				"inline-flex items-center gap-1 text-sm",
				className,
			)}
			{...props}
		/>
	</div>
);

const TabsTrigger = ({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
	<TabsPrimitive.Trigger
		className={cn(
			// Botly tab pill: radius 8px, semibold 14px; default=Text secondary,
			// hover=Stroke bg, active=Background invert + white (43:160/161/162)
			"inline-flex items-center justify-center whitespace-nowrap rounded-[8px] px-3 py-1.5 font-semibold text-muted-foreground text-sm ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
			className,
		)}
		{...props}
	/>
);

const TabsContent = ({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
	<TabsPrimitive.Content
		className={cn(
			"mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			className,
		)}
		{...props}
	/>
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
