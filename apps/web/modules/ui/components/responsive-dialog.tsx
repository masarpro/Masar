"use client";

import { useMediaQuery } from "../../../hooks/use-media-query";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import type { PropsWithChildren } from "react";

interface ResponsiveDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
	className?: string;
}

export function ResponsiveDialog({
	open,
	onOpenChange,
	title,
	description,
	className,
	children,
}: PropsWithChildren<ResponsiveDialogProps>) {
	const isMobile = useMediaQuery("(max-width: 640px)");

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="bottom"
					className="max-h-[90vh] overflow-y-auto rounded-t-2xl"
				>
					{(title || description) && (
						<SheetHeader className="text-start">
							{title && <SheetTitle>{title}</SheetTitle>}
							{description && (
								<SheetDescription>{description}</SheetDescription>
							)}
						</SheetHeader>
					)}
					{children}
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={`max-w-2xl max-h-[85vh] overflow-y-auto ${className ?? ""}`}
			>
				{(title || description) && (
					<DialogHeader>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
				)}
				{children}
			</DialogContent>
		</Dialog>
	);
}

export function ResponsiveDialogFooter({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	const isMobile = useMediaQuery("(max-width: 640px)");

	if (isMobile) {
		return <SheetFooter className={className}>{children}</SheetFooter>;
	}

	return <DialogFooter className={className}>{children}</DialogFooter>;
}
