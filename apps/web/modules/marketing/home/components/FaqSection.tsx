"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

const faqKeys = ["1", "2", "3", "4", "5", "6"] as const;

export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();

	return (
		<section
			className={cn("scroll-mt-20 py-16 lg:py-20 xl:py-28", className)}
			id="faq"
		>
			<div className="container max-w-3xl">
				<div className="mb-8 text-center">
					<small className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 font-semibold text-xs uppercase tracking-wider text-primary">
						{t("faq.title")}
					</small>
					<h2 className="mb-2 font-serif font-medium text-xl md:text-2xl lg:text-3xl xl:text-4xl leading-tighter text-foreground">
						{t("faq.title")}
					</h2>
					<p className="text-foreground/60 text-sm sm:text-lg">
						{t("faq.description")}
					</p>
				</div>
				<Accordion
					type="single"
					collapsible
					className="w-full space-y-2"
				>
					{faqKeys.map((key) => (
						<AccordionItem
							key={key}
							value={`item-${key}`}
							className="rounded-xl border border-border/50 bg-card shadow-none px-4 lg:px-6 transition-colors duration-200 hover:bg-muted/50 data-[state=open]:border-primary/20"
						>
							<AccordionTrigger className="text-start font-medium text-base hover:no-underline">
								{t(`faq.items.${key}.question`)}
							</AccordionTrigger>
							<AccordionContent className="text-foreground/60">
								{t(`faq.items.${key}.answer`)}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
