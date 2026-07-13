"use client";

import { LocaleLink } from "@i18n/routing";
import { cn } from "@ui/lib";
import {
	Calculator,
	CreditCard,
	FolderKanban,
	HardHat,
	Info,
	Mail,
	MessageCircle,
	Plus,
	Receipt,
	SearchIcon,
	ShieldCheck,
	Sparkles,
	Users,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
	FAQ_CATEGORIES,
	FAQ_ITEMS,
	type FaqCategory,
	getWhatsAppLink,
} from "../faq-data";

const CATEGORY_ICONS: Record<FaqCategory, typeof Info> = {
	general: Info,
	plans: CreditCard,
	projects: FolderKanban,
	finance: Receipt,
	quantities: Calculator,
	subcontractors: HardHat,
	hr: Users,
	assistant: Sparkles,
	security: ShieldCheck,
};

// Botly brand hues rotate across category chips (chart tokens)
const CATEGORY_CHIPS: Record<FaqCategory, string> = {
	general: "bg-chart-4/15 text-chart-4",
	plans: "bg-chart-1/25 text-foreground",
	projects: "bg-chart-3/20 text-chart-3",
	finance: "bg-success/15 text-success",
	quantities: "bg-chart-2/15 text-chart-2",
	subcontractors: "bg-chart-1/25 text-foreground",
	hr: "bg-chart-4/15 text-chart-4",
	assistant: "bg-chart-3/20 text-chart-3",
	security: "bg-success/15 text-success",
};

/** تطبيع النص العربي للبحث — إزالة التشكيل وتوحيد الألف والتاء المربوطة */
function normalize(text: string): string {
	return text
		.toLowerCase()
		.replace(/[ً-ْٰ]/g, "")
		.replace(/[أإآ]/g, "ا")
		.replace(/ة/g, "ه")
		.replace(/ى/g, "ي")
		.trim();
}

function FaqAccordionItem({
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
		<div className="border-b-2 last:border-b-0">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full cursor-pointer items-center justify-between gap-4 bg-transparent py-5 text-start"
				aria-expanded={isOpen}
			>
				<span className="flex-1 font-semibold text-[16px] text-foreground">
					{question}
				</span>
				<span
					className={cn(
						"grid size-8 shrink-0 place-items-center rounded-lg border-2 transition-all duration-300",
						isOpen
							? "rotate-45 border-transparent bg-primary text-primary-foreground"
							: "text-muted-foreground",
					)}
				>
					<Plus className="size-4" />
				</span>
			</button>
			<div
				className="grid transition-[grid-template-rows] duration-300 ease-out"
				style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
			>
				<div className="overflow-hidden">
					<p className="pb-5 text-[15px] text-muted-foreground leading-[1.9]">
						{answer}
					</p>
				</div>
			</div>
		</div>
	);
}

export function FaqPageContent() {
	const t = useTranslations();
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<FaqCategory | "all">(
		"all",
	);
	const [openId, setOpenId] = useState<string | null>(null);

	const items = useMemo(
		() =>
			FAQ_ITEMS.map((item) => ({
				...item,
				question: t(`faqPage.items.${item.id}.question`),
				answer: t(`faqPage.items.${item.id}.answer`),
			})),
		[t],
	);

	const filtered = useMemo(() => {
		const q = normalize(query);
		return items.filter((item) => {
			if (activeCategory !== "all" && item.category !== activeCategory) {
				return false;
			}
			if (!q) {
				return true;
			}
			return (
				normalize(item.question).includes(q) ||
				normalize(item.answer).includes(q)
			);
		});
	}, [items, query, activeCategory]);

	const isSearching = query.trim().length > 0;

	// عند التصفح بدون بحث نعرض الأسئلة مجمّعة حسب التصنيف
	const grouped = useMemo(() => {
		if (isSearching) {
			return null;
		}
		const categories =
			activeCategory === "all" ? FAQ_CATEGORIES : [activeCategory];
		return categories
			.map((category) => ({
				category,
				items: filtered.filter((item) => item.category === category),
			}))
			.filter((group) => group.items.length > 0);
	}, [filtered, activeCategory, isSearching]);

	const whatsAppHref = getWhatsAppLink(t("faqPage.items.g1.question"));

	return (
		<div className="container max-w-3xl pt-32 pb-20">
			{/* العنوان */}
			<div className="mb-10 text-center">
				<h1 className="mb-3 font-extrabold text-4xl sm:text-5xl">
					{t("faqPage.heading")}
				</h1>
				<p className="mx-auto max-w-xl text-balance text-muted-foreground">
					{t("faqPage.description")}
				</p>
			</div>

			{/* البحث */}
			<div className="relative mb-6">
				<SearchIcon className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
				<input
					type="search"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpenId(null);
					}}
					placeholder={t("faqPage.searchPlaceholder")}
					className="w-full rounded-2xl border-2 bg-card py-4 ps-12 pe-12 text-[15px] outline-none transition-colors focus:border-ring"
				/>
				{query && (
					<button
						type="button"
						onClick={() => setQuery("")}
						className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
						aria-label={t("faqPage.noResults")}
					>
						<XIcon className="size-4" />
					</button>
				)}
			</div>

			{/* التصنيفات */}
			<div className="mb-10 flex flex-wrap justify-center gap-2">
				<button
					type="button"
					onClick={() => setActiveCategory("all")}
					className={cn(
						"rounded-full border-2 px-4 py-2 font-medium text-[13px] transition-colors",
						activeCategory === "all"
							? "border-transparent bg-primary text-primary-foreground"
							: "bg-card text-muted-foreground hover:text-foreground",
					)}
				>
					{t("faqPage.allCategories")}
				</button>
				{FAQ_CATEGORIES.map((category) => {
					const Icon = CATEGORY_ICONS[category];
					return (
						<button
							key={category}
							type="button"
							onClick={() =>
								setActiveCategory(
									activeCategory === category ? "all" : category,
								)
							}
							className={cn(
								"flex items-center gap-1.5 rounded-full border-2 px-4 py-2 font-medium text-[13px] transition-colors",
								activeCategory === category
									? "border-transparent bg-primary text-primary-foreground"
									: "bg-card text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="size-3.5" />
							{t(`faqPage.categories.${category}`)}
						</button>
					);
				})}
			</div>

			{/* النتائج */}
			{filtered.length === 0 ? (
				<div className="rounded-[var(--botly-radius-card)] border-2 bg-card px-8 py-16 text-center">
					<p className="mb-2 font-semibold text-lg">
						{t("faqPage.noResults")}
					</p>
					<p className="text-muted-foreground text-sm">
						{t("faqPage.noResultsHint")}
					</p>
				</div>
			) : isSearching ? (
				<div className="rounded-[var(--botly-radius-card)] border-2 bg-card px-6 py-1 sm:px-9">
					{filtered.map((item) => (
						<FaqAccordionItem
							key={item.id}
							question={item.question}
							answer={item.answer}
							isOpen={openId === item.id}
							onToggle={() =>
								setOpenId(openId === item.id ? null : item.id)
							}
						/>
					))}
				</div>
			) : (
				<div className="space-y-10">
					{grouped?.map((group) => {
						const Icon = CATEGORY_ICONS[group.category];
						return (
							<section key={group.category}>
								<h2 className="mb-4 flex items-center gap-2.5 font-bold text-xl">
									<span
										className={cn(
											"grid size-9 place-items-center rounded-xl",
											CATEGORY_CHIPS[group.category],
										)}
									>
										<Icon className="size-4.5" />
									</span>
									{t(`faqPage.categories.${group.category}`)}
								</h2>
								<div className="rounded-[var(--botly-radius-card)] border-2 bg-card px-6 py-1 sm:px-9">
									{group.items.map((item) => (
										<FaqAccordionItem
											key={item.id}
											question={item.question}
											answer={item.answer}
											isOpen={openId === item.id}
											onToggle={() =>
												setOpenId(
													openId === item.id ? null : item.id,
												)
											}
										/>
									))}
								</div>
							</section>
						);
					})}
				</div>
			)}

			{/* لم تجد ما تبحث عنه؟ — Botly inverted band */}
			<div className="mt-16 rounded-[var(--botly-radius-card)] bg-primary px-8 py-12 text-center text-primary-foreground">
				<h2 className="mb-2 font-bold text-2xl">
					{t("faqPage.contact.title")}
				</h2>
				<p className="mx-auto mb-8 max-w-md text-balance text-primary-foreground/65 text-sm">
					{t("faqPage.contact.description")}
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					{whatsAppHref && (
						<a
							href={whatsAppHref}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 rounded-[12px] bg-[#25D366] px-6 py-3 font-bold text-sm text-white transition-opacity hover:opacity-90"
						>
							<MessageCircle className="size-4.5" />
							{t("faqPage.contact.whatsapp")}
						</a>
					)}
					<LocaleLink
						href="/contact"
						className="flex items-center gap-2 rounded-[12px] bg-primary-foreground px-6 py-3 font-bold text-primary text-sm transition-opacity hover:opacity-90"
					>
						<Mail className="size-4.5" />
						{t("faqPage.contact.contactUs")}
					</LocaleLink>
				</div>
			</div>
		</div>
	);
}
