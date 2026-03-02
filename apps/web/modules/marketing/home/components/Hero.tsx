"use client";

import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Hero() {
	const t = useTranslations();

	return (
		<section className="relative bg-card">
			<div className="container relative z-20 pt-44 pb-16 lg:pb-24">
				<div className="mb-4 flex justify-start">
					<span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 font-medium text-primary text-sm">
						{t("hero.badge")}
					</span>
				</div>

				<h1 className="text-balance font-medium text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tighter font-serif text-foreground">
					{t("hero.title")}
					<br />
					<span className="text-primary">{t("hero.titleHighlight")}</span>
				</h1>

				<p className="mt-4 max-w-2xl text-foreground/60 text-base sm:text-lg">
					{t("hero.description")}
				</p>

				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Button size="lg" variant="primary" asChild>
						<Link href="/auth/signup">
							{t("hero.cta")}
							<ArrowRightIcon className="ms-2 size-4" />
						</Link>
					</Button>
					<Button variant="outline" size="lg" asChild>
						<a href="#features">{t("hero.secondary")}</a>
					</Button>
				</div>
			</div>
		</section>
	);
}
