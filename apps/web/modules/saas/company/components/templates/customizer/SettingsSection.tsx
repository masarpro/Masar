"use client";

import { useState, type ReactNode } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { ChevronDownIcon } from "lucide-react";

export interface SettingsSectionProps {
	icon: ReactNode;
	title: string;
	defaultOpen?: boolean;
	children: ReactNode;
}

export function SettingsSection({
	icon,
	title,
	defaultOpen = false,
	children,
}: SettingsSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-background rounded-xl border hover:bg-muted/50 transition-colors">
				<div className="flex items-center gap-2 text-sm font-medium">
					{icon}
					{title}
				</div>
				<ChevronDownIcon
					className={`h-4 w-4 text-muted-foreground transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-3 px-1">
				{children}
			</CollapsibleContent>
		</Collapsible>
	);
}
