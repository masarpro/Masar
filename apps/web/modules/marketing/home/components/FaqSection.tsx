"use client";

import { LocaleLink } from "@i18n/routing";
import { cn } from "@ui/lib";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
		<div className={cn("mas-faq-item", isOpen && "open")}>
			<button
				type="button"
				onClick={onToggle}
				className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-transparent border-none cursor-pointer text-start"
			>
				<span
					className="text-[16px] font-bold flex-1"
					style={{ color: "var(--mas-ink)" }}
				>
					{question}
				</span>
				<span className="mas-faq-plus" aria-hidden="true">
					+
				</span>
			</button>
			<div
				className="overflow-hidden transition-[max-height] duration-[400ms]"
				style={{
					maxHeight: isOpen ? 300 : 0,
					transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
				}}
			>
				<p
					className="text-[14.5px] leading-[1.9] px-6 pb-6"
					style={{ color: "var(--mas-muted)" }}
				>
					{answer}
				</p>
			</div>
		</div>
	);
}

export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();
	const locale = useLocale();
	const [openFaq, setOpenFaq] = useState<number | null>(null);
	const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

	return (
		<section
			className={cn("scroll-mt-20 py-24 md:py-32 px-6", className)}
			id="faq"
			style={{
				background: "var(--mas-bg-2)",
				borderTop: "1px solid var(--mas-line)",
			}}
		>
			<div className="max-w-[760px] mx-auto">
				{/* Header */}
				<div className="mas-sec-head mas-rv text-center mb-12 md:mb-14">
					<span className="mas-dim">{t("faq.title")}</span>
					<h2>{t("faq.heading")}</h2>
				</div>

				{/* Items */}
				<div className="mas-rv grid gap-3">
					{faqKeys.map((key, i) => (
						<FAQItem
							key={key}
							question={t(`faq.items.${key}.question`)}
							answer={t(`faq.items.${key}.answer`)}
							isOpen={openFaq === i}
							onToggle={() =>
								setOpenFaq(openFaq === i ? null : i)
							}
						/>
					))}
				</div>

				{/* Full FAQ page link */}
				<div className="mas-rv mt-10 text-center">
					<LocaleLink
						href="/faq"
						className="mas-btn mas-btn-ghost !min-h-[46px] !py-2.5 !px-6 !text-[14px]"
					>
						{t("faqPage.viewAll")}
						<ArrowIcon className="size-4" />
					</LocaleLink>
				</div>
			</div>
		</section>
	);
}
