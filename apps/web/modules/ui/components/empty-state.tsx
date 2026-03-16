"use client";

import { Button } from "@ui/components/button";
import type { ReactNode } from "react";

interface EmptyStateProps {
	icon: ReactNode;
	title?: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	/** Custom action slot — rendered below description, replaces `action` prop */
	children?: ReactNode;
}

export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="mb-4 rounded-2xl bg-muted/50 p-5 text-muted-foreground">
				{icon}
			</div>
			{title && <h3 className="text-lg font-medium">{title}</h3>}
			<p className="mt-1 max-w-sm text-sm text-muted-foreground">
				{description}
			</p>
			{children
				? <div className="mt-4">{children}</div>
				: action && (
					<Button className="mt-4" onClick={action.onClick}>
						{action.label}
					</Button>
				)}
		</div>
	);
}
