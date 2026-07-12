"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@ui/lib";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = ({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) => (
	<DropdownMenuPrimitive.SubTrigger
		className={cn(
			"flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-sm outline-hidden focus:bg-accent data-[state=open]:bg-accent",
			inset ? "ps-8" : "",
			className,
		)}
		{...props}
	>
		{children}
		<ChevronRightIcon className="ms-auto size-4" />
	</DropdownMenuPrimitive.SubTrigger>
);

const DropdownMenuSubContent = ({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) => (
	<DropdownMenuPrimitive.SubContent
		className={cn(
			// Botly-derived (same surface as dropdown 75:2472)
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[70] min-w-[8rem] overflow-hidden rounded-[20px] border bg-popover px-3 py-2 text-popover-foreground shadow-[0px_8px_32px_12px_rgba(0,0,0,0.06)] data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
	/>
);

const DropdownMenuContent = ({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) => (
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Content
			sideOffset={sideOffset}
			className={cn(
				// Botly dropdown 75:2472: radius 20px, border Stroke, shadow 0 8px 32px 12px 6%, inner px-12/py-8
				"z-[70] min-w-[8rem] overflow-hidden rounded-[20px] border bg-popover px-3 py-2 text-popover-foreground shadow-[0px_8px_32px_12px_rgba(0,0,0,0.06)]",
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			{...props}
		/>
	</DropdownMenuPrimitive.Portal>
);

const DropdownMenuItem = ({
	className,
	inset,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
}) => (
	<DropdownMenuPrimitive.Item
		className={cn(
			// Botly item: radius 12px, resting text = Text secondary → hover Text Primary + Stroke bg
			"relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-muted-foreground text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			inset ? "ps-8" : "",
			className,
		)}
		{...props}
	/>
);

const DropdownMenuCheckboxItem = ({
	className,
	children,
	checked,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) => (
	<DropdownMenuPrimitive.CheckboxItem
		className={cn(
			"relative flex cursor-default select-none items-center rounded-lg py-3 pe-3 ps-8 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		)}
		checked={checked}
		{...props}
	>
		<span className="absolute start-2 flex size-3.5 items-center justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<CheckIcon className="size-4" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.CheckboxItem>
);

const DropdownMenuRadioItem = ({
	className,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) => (
	<DropdownMenuPrimitive.RadioItem
		className={cn(
			"relative flex cursor-default select-none items-center rounded-lg py-2 pe-8 ps-3 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-[state=checked]:font-semibold data-disabled:opacity-50",
			className,
		)}
		{...props}
	>
		<span className="absolute end-2 flex size-3.5 items-center justify-center">
			<DropdownMenuPrimitive.ItemIndicator>
				<CheckIcon className="size-4" />
			</DropdownMenuPrimitive.ItemIndicator>
		</span>
		{children}
	</DropdownMenuPrimitive.RadioItem>
);

const DropdownMenuLabel = ({
	className,
	inset,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
	inset?: boolean;
}) => (
	<DropdownMenuPrimitive.Label
		className={cn(
			"px-3 py-2 font-semibold text-sm",
			inset ? "ps-8" : "",
			className,
		)}
		{...props}
	/>
);

const DropdownMenuSeparator = ({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) => (
	<DropdownMenuPrimitive.Separator
		className={cn("-mx-1 my-1 h-px bg-border", className)}
		{...props}
	/>
);

const DropdownMenuShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn(
				"ms-auto text-xs tracking-widest opacity-60",
				className,
			)}
			{...props}
		/>
	);
};

export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
};
