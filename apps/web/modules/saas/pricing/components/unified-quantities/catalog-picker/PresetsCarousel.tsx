"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import * as Icons from "lucide-react";
import type { Preset } from "../hooks/usePresets";

interface Props {
	presets: Preset[];
	isLoading: boolean;
	onSelect: (presetKey: string) => Promise<void> | void;
}

export function PresetsCarousel({ presets, isLoading, onSelect }: Props) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-32 w-full" />
				))}
			</div>
		);
	}

	if (presets.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				لا توجد باقات متاحة
			</p>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
			{presets.map((preset) => {
				const Icon =
					((Icons as unknown as Record<string, Icons.LucideIcon>)[
						preset.icon
					]) ?? Icons.Package;

				return (
					<Card
						key={preset.key}
						className="flex flex-col p-4 transition-all hover:border-primary"
					>
						<div className="flex items-start gap-3">
							<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Icon className="h-6 w-6" />
							</div>
							<div className="min-w-0 flex-1">
								<h4 className="font-semibold">{preset.nameAr}</h4>
								{preset.descriptionAr && (
									<p className="mt-1 text-xs text-muted-foreground">
										{preset.descriptionAr}
									</p>
								)}
								<p className="mt-2 text-xs text-muted-foreground tabular-nums">
									{preset.itemKeys.length} بند
								</p>
							</div>
						</div>

						<Button
							onClick={() => onSelect(preset.key)}
							className="mt-3 w-full"
							size="sm"
						>
							تطبيق الباقة
						</Button>
					</Card>
				);
			})}
		</div>
	);
}
