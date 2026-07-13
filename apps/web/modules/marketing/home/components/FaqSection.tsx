"use client";

import { LocaleLink } from "@i18n/routing";
import { cn } from "@ui/lib";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const faqKeys = ["1", "2", "3", "4", "5", "6"] as const;

function FAQItem({
	question,
	answer,
	isOpen,
	onToggle,
}: {
	question: string;
	answer: string;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<div
			className={cn(
				"rounded-[20px] border-2 bg-card transition-colors",
				isOpen && "border-primary/30",
			)}
		>
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-6 py-5 text-start"
			>
				<span className="flex-1 text-[16px] font-bold text-foreground">
					{question}
				</span>
				<span
					className={cn(
						"grid size-8 shrink-0 place-items-center rounded-lg border-2 text-muted-foreground transition-transform duration-300",
						isOpen && "rotate-45 bg-primary text-primary-foreground",
					)}
					aria-hidden="true"
				>
					<Plus className="size-4" />
				</span>
			</button>
			<div
				className="overflow-hidden transition-[max-height] duration-[400ms]"
				style={{
					maxHeight: isOpen ? 300 : 0,
					transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
				}}
			>
				<p className="px-6 pb-6 text-[14.5px] leading-[1.9] text-muted-foreground">
					{answer}
				</p>
			</div>
		</div>
	);
}

// Botly flat accordion cards.
export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();
	const locale = useLocale();
	const [openFaq, setOpenFaq] = useState<number | null>(null);
	const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

	return (
		<section
			className={cn(
				"scroll-mt-20 border-t-2 bg-background px-6 py-24 md:py-32",
				className,
			)}
			id="faq"
		>
			<div className="mx-auto max-w-[760px]">
				{/* Header */}
				<div className="bl-rv mb-12 text-center md:mb-14">
					<span className="inline-flex items-center rounded-full border-2 bg-card px-4 py-1.5 text-[13px] font-semibold text-muted-foreground">
						{t("faq.title")}
					</span>
					<h2 className="mt-4 text-3xl font-extrabold text-foreground md:text-4xl">
						{t("faq.heading")}
					</h2>
				</div>

				{/* Items */}
				<div className="bl-rv grid gap-3">
					{faqKeys.map((key, i) => (
						<FAQItem
							key={key}
							question={t(`faq.items.${key}.question`)}
							answer={t(`faq.items.${key}.answer`)}
							isOpen={openFaq === i}
							onToggle={() => setOpenFaq(openFaq === i ? null : i)}
						/>
					))}
				</div>

				{/* Full FAQ page link */}
				<div className="bl-rv mt-10 text-center">
					<LocaleLink
						href="/faq"
						className="inline-flex items-center gap-2 rounded-[12px] border-2 bg-card px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-accent"
					>
						{t("faqPage.viewAll")}
						<ArrowIcon className="size-4" />
					</LocaleLink>
				</div>
			</div>
		</section>
	);
}
