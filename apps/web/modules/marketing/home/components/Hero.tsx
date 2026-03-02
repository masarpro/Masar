"use client";

import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Hero() {
	const t = useTranslations();

	return (
		<section className="relative overflow-hidden">
			{/* Decorative background */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
				<div className="absolute top-20 end-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
				<div className="absolute bottom-20 start-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_var(--foreground)_1px,_transparent_0)] bg-[size:24px_24px] opacity-[0.04]" />
			</div>

			<div className="container relative z-20 pt-44 pb-24 lg:pb-36">
				<div className="mb-4 flex justify-start animate-fade-in">
					<span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 font-medium text-primary text-sm">
						{t("hero.badge")}
					</span>
				</div>

				<h1 className="text-balance font-medium text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tighter font-serif text-foreground animate-fade-in-delay-1">
					{t("hero.title")}
					<br />
					<span className="text-primary">{t("hero.titleHighlight")}</span>
				</h1>

				<p className="mt-4 max-w-2xl text-foreground/60 text-base sm:text-lg animate-fade-in-delay-2">
					{t("hero.description")}
				</p>

				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-delay-3">
					<Button size="lg" variant="primary" asChild className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300">
						<Link href="/auth/signup">
							{t("hero.cta")}
							<ArrowRightIcon className="ms-2 size-4" />
						</Link>
					</Button>
					<Button variant="outline" size="lg" asChild className="h-12 px-8 text-base font-semibold hover:-translate-y-0.5 transition-all duration-300">
						<a href="#features">{t("hero.secondary")}</a>
					</Button>
				</div>
			</div>
		</section>
	);
}
