"use client";

import { useEffect, useState } from "react";

export function SidebarClock() {
	const [time, setTime] = useState<Date | null>(null);

	useEffect(() => {
		// Set initial time
		setTime(new Date());

		// Update every second
		const interval = setInterval(() => {
			setTime(new Date());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	if (!time) {
		return null;
	}

	// Format with English numerals (en-US locale)
	const timeString = time.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});

	const dateString = time.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});

	return (
		<div className="flex flex-col items-center text-center text-xs text-muted-foreground">
			<span className="font-medium tabular-nums">{timeString}</span>
			<span className="text-[10px] opacity-70">{dateString}</span>
		</div>
	);
}
