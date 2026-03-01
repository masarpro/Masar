"use client";

import { Card } from "@ui/components/card";
import type { LucideIcon } from "lucide-react";

export function StatsCard({
	title,
	value,
	icon: Icon,
	description,
}: {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
}) {
	return (
		<Card className="p-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-muted-foreground text-sm">{title}</p>
					<p className="font-bold text-2xl">{value}</p>
					{description && (
						<p className="text-muted-foreground text-xs mt-1">
							{description}
						</p>
					)}
				</div>
				<div className="rounded-full bg-primary/10 p-3">
					<Icon className="size-5 text-primary" />
				</div>
			</div>
		</Card>
	);
}
