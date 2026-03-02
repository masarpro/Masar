"use client";

import {
	AlertTriangleIcon,
	ClockIcon,
	FileSpreadsheetIcon,
	GlobeIcon,
	ReceiptIcon,
	UserXIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

const icons = [
	FileSpreadsheetIcon,
	UserXIcon,
	ReceiptIcon,
	GlobeIcon,
	ClockIcon,
	AlertTriangleIcon,
];

export function PainPoints() {
	const t = useTranslations();

	const items = ["1", "2", "3", "4", "5", "6"] as const;

	return (
		<section className="py-16 lg:py-20 xl:py-28 bg-muted/30">
			<div className="container">
				<div className="mb-10">
					<small className="mb-4 inline-flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/20 px-3 py-1 font-semibold text-xs uppercase tracking-wider text-destructive">
						{t("painPoints.label")}
					</small>
					<h2 className="font-serif font-medium text-2xl md:text-3xl lg:text-4xl leading-tighter text-foreground">
						{t("painPoints.title")}
					</h2>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{items.map((key, i) => {
						const Icon = icons[i];
						return (
							<div
								key={key}
								className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-5 lg:p-6 transition-all duration-300 hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/5 hover:-translate-y-1"
							>
								<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 transition-colors duration-300 group-hover:bg-destructive/15">
									<Icon className="size-5 text-destructive" />
								</div>
								<p className="text-foreground/80 text-sm lg:text-base">
									{t(`painPoints.items.${key}`)}
								</p>
							</div>
						);
					})}
				</div>

				<div className="mt-10 text-center">
					<p className="font-bold text-primary text-xl">
						{t("painPoints.solution")}
					</p>
				</div>
			</div>
		</section>
	);
}
