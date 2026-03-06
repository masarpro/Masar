"use client";

import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
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
		<div style={{ borderBottom: "1px solid var(--lp-faq-divider)" }}>
			<button
				onClick={onToggle}
				className="w-full flex items-center justify-between py-6 bg-transparent border-none cursor-pointer text-start gap-4"
			>
				<span
					className="text-[17px] font-semibold flex-1"
					style={{ color: "var(--lp-text)" }}
				>
					{question}
				</span>
				<span
					className="w-8 h-8 rounded-[10px] flex items-center justify-center text-lg shrink-0 transition-all duration-[400ms]"
					style={{
						background: isOpen
							? "linear-gradient(135deg, #0ea5e9, #06B6D4)"
							: "var(--lp-card-bg)",
						color: isOpen
							? "white"
							: "var(--lp-text-subtle)",
						transform: isOpen
							? "rotate(45deg)"
							: "rotate(0deg)",
						transitionTimingFunction:
							"cubic-bezier(0.16,1,0.3,1)",
					}}
				>
					+
				</span>
			</button>
			<div
				className="overflow-hidden transition-[max-height] duration-[400ms]"
				style={{
					maxHeight: isOpen ? 200 : 0,
					transitionTimingFunction:
						"cubic-bezier(0.16,1,0.3,1)",
				}}
			>
				<p
					className="text-[15px] leading-[1.8] pb-6"
					style={{ color: "var(--lp-text-muted)" }}
				>
					{answer}
				</p>
			</div>
		</div>
	);
}

export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();
	const [openFaq, setOpenFaq] = useState<number | null>(null);

	return (
		<section
			className={cn("scroll-mt-20 py-28 px-6", className)}
			id="faq"
			style={{ background: "var(--lp-bg)" }}
		>
			<div className="max-w-[700px] mx-auto">
				{/* Header */}
				<div className="text-center mb-16">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.04))",
							border: "1px solid rgba(139,92,246,0.12)",
							color: "#8B5CF6",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #8B5CF6, #3B82F6)",
							}}
						/>
						{t("faq.title")}
					</div>
					<h2
						className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3]"
						style={{ color: "var(--lp-text)" }}
					>
						{t("faq.title")}
					</h2>
				</div>

				{/* FAQ Items */}
				<div
					className="rounded-3xl px-6 sm:px-9 py-2"
					style={{
						background: "var(--lp-faq-card-bg)",
						border: "1px solid var(--lp-faq-card-border)",
					}}
				>
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
			</div>
		</section>
	);
}
