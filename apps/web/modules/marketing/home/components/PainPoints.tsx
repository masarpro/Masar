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
		<section className="py-12 lg:py-16 xl:py-24">
			<div className="container">
				<div className="mb-8">
					<small className="mb-4 block font-medium text-xs uppercase tracking-wider text-primary">
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
								className="flex items-start gap-4 rounded-2xl bg-card p-5 lg:p-6"
							>
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
									<Icon className="size-5 text-destructive" />
								</div>
								<p className="text-foreground/80 text-sm lg:text-base">
									{t(`painPoints.items.${key}`)}
								</p>
							</div>
						);
					})}
				</div>

				<div className="mt-8 text-center">
					<p className="font-medium text-primary text-lg">
						{t("painPoints.solution")}
					</p>
				</div>
			</div>
		</section>
	);
}
