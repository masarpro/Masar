"use client";

import { Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface GreetingHeaderProps {
	icon: LucideIcon;
	title: string;
	subtitle?: string;
	/** Extra content on the far side (replaces the clock when provided). */
	actions?: ReactNode;
	showClock?: boolean;
}

function formatTime(date: Date | null | undefined): string {
	if (!date) return "";
	return date.toLocaleTimeString("en-SA", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
}

/**
 * GreetingHeader — the shared module-dashboard header (icon chip + title +
 * subtitle + live clock). Single source for the primary-gradient chrome that
 * was previously copy-pasted per module.
 */
export function GreetingHeader({
	icon: Icon,
	title,
	subtitle,
	actions,
	showClock = true,
}: GreetingHeaderProps) {
	const [mounted, setMounted] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		setMounted(true);
		const timer = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	if (!mounted) {
		return <div className="h-14 animate-pulse bg-muted rounded-xl" />;
	}

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
			<div className="flex min-w-0 items-center gap-3">
				<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
					<Icon className="h-5 w-5 text-primary" />
				</div>
				<div className="min-w-0">
					<h1 className="truncate text-xl font-bold text-foreground">
						{title}
					</h1>
					{subtitle ? (
						<p className="truncate text-sm text-muted-foreground">
							{subtitle}
						</p>
					) : null}
				</div>
			</div>

			{actions ??
				(showClock ? (
					<div className="hidden sm:flex items-center gap-1.5 text-foreground font-medium text-sm">
						<Clock className="h-4 w-4" />
						<span className="tabular-nums">
							{formatTime(currentTime)}
						</span>
					</div>
				) : null)}
		</div>
	);
}
