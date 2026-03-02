"use client";

import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function FinalCTA() {
	const t = useTranslations();

	return (
		<section className="relative overflow-hidden py-24 lg:py-32">
			{/* Decorative background */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
				<div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
			</div>

			<div className="container max-w-3xl">
				<div className="text-center">
					<h2 className="font-serif font-medium text-3xl sm:text-4xl lg:text-5xl leading-tighter text-foreground">
						{t("finalCta.title")}
					</h2>
					<p className="mt-4 text-foreground/60 text-sm sm:text-base">
						{t("finalCta.description")}
					</p>
					<div className="mt-8">
						<Button size="lg" variant="primary" asChild className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
							<Link href="/auth/signup">
								{t("finalCta.cta")}
								<ArrowRightIcon className="ms-2 size-4" />
							</Link>
						</Button>
					</div>
					<p className="mt-5 text-foreground/40 text-xs">
						{t("finalCta.note")}
					</p>
				</div>
			</div>
		</section>
	);
}
