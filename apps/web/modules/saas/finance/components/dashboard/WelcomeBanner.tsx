"use client";

import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { formatDateFull } from "../../lib/utils";

interface WelcomeBannerProps {
	userName?: string;
}

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
	const t = useTranslations();

	const today = formatDateFull(new Date());

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return t("finance.dashboard.greeting.morning");
		if (hour < 17) return t("finance.dashboard.greeting.afternoon");
		return t("finance.dashboard.greeting.evening");
	};

	return (
		<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground">
			{/* Decorative background elements */}
			<div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
			<div className="absolute -end-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
			<div className="absolute -bottom-10 -start-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

			<div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold md:text-3xl">
						{getGreeting()}
						{userName && (
							<span className="block text-xl font-medium opacity-90 md:inline md:ms-2">
								{userName}
							</span>
						)}
					</h1>
					<p className="text-sm opacity-80 md:text-base">
						{t("finance.dashboard.welcomeMessage")}
					</p>
				</div>

				<div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 backdrop-blur-sm">
					<CalendarDays className="h-5 w-5" />
					<span className="text-sm font-medium">{today}</span>
				</div>
			</div>
		</div>
	);
}
