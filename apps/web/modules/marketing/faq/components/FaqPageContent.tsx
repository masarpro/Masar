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
		<div className="border-b border-border/60 last:border-b-0">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between gap-4 bg-transparent py-5 text-start cursor-pointer"
				aria-expanded={isOpen}
			>
				<span className="flex-1 font-semibold text-[16px] text-foreground">
					{question}
				</span>
				<span
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-[10px] text-lg transition-all duration-300",
						isOpen
							? "rotate-45 bg-gradient-to-br from-sky-500 to-cyan-500 text-white"
							: "bg-muted text-muted-foreground",
					)}
				>
					+
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
					className="w-full rounded-2xl border border-border bg-card py-4 ps-12 pe-12 text-[15px] shadow-sm outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
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
						"rounded-full border px-4 py-2 font-medium text-[13px] transition-all",
						activeCategory === "all"
							? "border-transparent bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/20"
							: "border-border bg-card text-muted-foreground hover:border-sky-300 hover:text-foreground",
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
									activeCategory === category
										? "all"
										: category,
								)
							}
							className={cn(
								"flex items-center gap-1.5 rounded-full border px-4 py-2 font-medium text-[13px] transition-all",
								activeCategory === category
									? "border-transparent bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/20"
									: "border-border bg-card text-muted-foreground hover:border-sky-300 hover:text-foreground",
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
				<div className="rounded-3xl border border-border bg-card px-8 py-16 text-center">
					<p className="mb-2 font-semibold text-lg">
						{t("faqPage.noResults")}
					</p>
					<p className="text-muted-foreground text-sm">
						{t("faqPage.noResultsHint")}
					</p>
				</div>
			) : isSearching ? (
				<div className="rounded-3xl border border-border bg-card px-6 py-1 sm:px-9">
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
								<h2 className="mb-4 flex items-center gap-2 font-bold text-xl">
									<span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/10 to-cyan-500/10 text-sky-600 dark:text-sky-400">
										<Icon className="size-4.5" />
									</span>
									{t(`faqPage.categories.${group.category}`)}
								</h2>
								<div className="rounded-3xl border border-border bg-card px-6 py-1 sm:px-9">
									{group.items.map((item) => (
										<FaqAccordionItem
											key={item.id}
											question={item.question}
											answer={item.answer}
											isOpen={openId === item.id}
											onToggle={() =>
												setOpenId(
													openId === item.id
														? null
														: item.id,
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

			{/* لم تجد ما تبحث عنه؟ */}
			<div className="mt-16 rounded-3xl border border-sky-500/15 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 px-8 py-12 text-center">
				<h2 className="mb-2 font-bold text-2xl">
					{t("faqPage.contact.title")}
				</h2>
				<p className="mx-auto mb-8 max-w-md text-balance text-muted-foreground text-sm">
					{t("faqPage.contact.description")}
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					{whatsAppHref && (
						<a
							href={whatsAppHref}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 font-bold text-sm text-white shadow-md shadow-[#25D366]/25 transition-all hover:-translate-y-0.5 hover:shadow-lg"
						>
							<MessageCircle className="size-4.5" />
							{t("faqPage.contact.whatsapp")}
						</a>
					)}
					<LocaleLink
						href="/contact"
						className="flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 font-bold text-foreground text-sm transition-all hover:-translate-y-0.5 hover:border-sky-300"
					>
						<Mail className="size-4.5" />
						{t("faqPage.contact.contactUs")}
					</LocaleLink>
				</div>
			</div>
		</div>
	);
}
