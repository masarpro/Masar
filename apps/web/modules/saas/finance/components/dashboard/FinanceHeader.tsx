"use client";

import { Wallet, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { formatTime } from "../../lib/utils";

interface FinanceHeaderProps {
	userName?: string;
}

export function FinanceHeader({ userName }: FinanceHeaderProps) {
	const t = useTranslations();
	const [mounted, setMounted] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		setMounted(true);
		const timer = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	if (!mounted) {
		return (
			<div className="h-14 animate-pulse bg-muted rounded-xl" />
		);
	}

	return (
		<div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50" dir="rtl">
			{/* Title and greeting */}
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
					<Wallet className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold text-foreground">
						{t("finance.title")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("finance.dashboard.hello")}{userName ? ` ${userName}` : ""}
					</p>
				</div>
			</div>

			{/* Time */}
			<div className="flex items-center gap-1.5 text-foreground font-medium text-sm">
				<Clock className="h-4 w-4" />
				<span className="tabular-nums">{formatTime(currentTime)}</span>
			</div>
		</div>
	);
}
