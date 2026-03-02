"use client";

import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function FinalCTA() {
	const t = useTranslations();

	return (
		<section className="py-12 lg:py-16 xl:py-24">
			<div className="container max-w-3xl">
				<div className="rounded-4xl bg-primary/5 p-8 text-center lg:p-12">
					<h2 className="font-serif font-medium text-2xl md:text-3xl lg:text-4xl leading-tighter text-foreground">
						{t("finalCta.title")}
					</h2>
					<p className="mt-3 text-foreground/60 text-sm sm:text-base">
						{t("finalCta.description")}
					</p>
					<div className="mt-6">
						<Button size="lg" variant="primary" asChild>
							<Link href="/auth/signup">
								{t("finalCta.cta")}
								<ArrowRightIcon className="ms-2 size-4" />
							</Link>
						</Button>
					</div>
					<p className="mt-4 text-foreground/40 text-xs">
						{t("finalCta.note")}
					</p>
				</div>
			</div>
		</section>
	);
}
