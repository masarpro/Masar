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
			className={cn("scroll-mt-20 py-12 lg:py-16 xl:py-24", className)}
			id="faq"
		>
			<div className="container max-w-3xl">
				<div className="mb-6 text-center">
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
							className="rounded-lg bg-card shadow-none border-none px-4 lg:px-6"
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
