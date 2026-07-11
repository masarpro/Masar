"use client";

import { useChat } from "@ai-sdk/react";
import { config } from "@repo/config";
import { cn } from "@ui/lib";
import { DefaultChatTransport } from "ai";
import { MessageCircle, RotateCcw, SendIcon, Sparkles, X } from "lucide-react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SUGGESTION_KEYS = ["1", "2", "3", "4"] as const;
const MAX_CHARS = 1000;

/** مساعد مسار العام — زر عائم ولوحة محادثة للزوار قبل التسجيل */
export function MarketingAssistant() {
	const t = useTranslations("marketingAssistant");
	const locale = useLocale();
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const localeRef = useRef(locale);
	localeRef.current = locale;

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/ai/public-assistant",
				prepareSendMessagesRequest({ messages }) {
					return {
						body: {
							messages,
							locale: localeRef.current,
						},
					};
				},
			}),
		[],
	);

	const { messages, setMessages, status, sendMessage, error } = useChat({
		transport,
	});

	const isLoading = status === "streaming" || status === "submitted";

	// التمرير لآخر رسالة
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	// تركيز حقل الإدخال عند الفتح
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => inputRef.current?.focus(), 250);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	const handleSubmit = useCallback(() => {
		const text = input.trim();
		if (!text || isLoading || text.length > MAX_CHARS) {
			return;
		}
		sendMessage({ text });
		setInput("");
	}, [input, isLoading, sendMessage]);

	const mapped = messages.map((message) => ({
		id: message.id,
		role: message.role,
		text:
			message.parts
				?.filter(
					(p): p is { type: "text"; text: string } =>
						p.type === "text",
				)
				.map((p) => p.text)
				.join("") ?? "",
	}));

	return (
		<>
			{/* الزر العائم */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-label={t("buttonLabel")}
				className={cn(
					"fixed bottom-5 end-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
					isOpen && "rotate-90",
				)}
				style={{
					background: "linear-gradient(135deg, #0ea5e9, #06B6D4)",
					boxShadow: "0 8px 24px rgba(14,165,233,0.35)",
				}}
			>
				{isOpen ? (
					<X className="size-6" />
				) : (
					<MessageCircle className="size-6" />
				)}
			</button>

			{/* اللوحة */}
			{isOpen && (
				<div
					role="dialog"
					aria-label={t("title")}
					className={cn(
						"fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
						"bottom-[88px] inset-x-4 h-[70vh]",
						"sm:inset-x-auto sm:end-5 sm:h-[min(65vh,560px)] sm:w-[380px]",
					)}
				>
					{/* الرأس */}
					<div className="flex items-center justify-between border-b p-3">
						<div className="flex items-center gap-2">
							<span
								className="flex size-8 items-center justify-center rounded-[10px] text-white"
								style={{
									background:
										"linear-gradient(135deg, #0ea5e9, #06B6D4)",
								}}
							>
								<Sparkles className="size-4" />
							</span>
							<div>
								<div className="font-bold text-sm">
									{t("title")}
								</div>
								<div className="text-[11px] text-muted-foreground">
									{t("subtitle")}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-1">
							{mapped.length > 0 && (
								<button
									type="button"
									onClick={() => {
										setMessages([]);
										setInput("");
									}}
									className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									title={t("newChat")}
									aria-label={t("newChat")}
								>
									<RotateCcw className="size-4" />
								</button>
							)}
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								aria-label={t("close")}
							>
								<X className="size-4" />
							</button>
						</div>
					</div>

					{/* الرسائل */}
					<div className="flex-1 space-y-3 overflow-y-auto p-4">
						{mapped.length === 0 ? (
							<div className="flex h-full flex-col justify-center">
								<p className="mb-1 text-center font-bold">
									{t("welcomeTitle")}
								</p>
								<p className="mb-5 text-center text-muted-foreground text-sm">
									{t("welcomeDescription")}
								</p>
								<div className="space-y-2">
									{SUGGESTION_KEYS.map((key) => (
										<button
											key={key}
											type="button"
											onClick={() =>
												sendMessage({
													text: t(
														`suggestions.${key}`,
													),
												})
											}
											className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-start text-[13px] transition-all hover:border-sky-300 hover:bg-sky-500/5"
										>
											{t(`suggestions.${key}`)}
										</button>
									))}
								</div>
							</div>
						) : (
							<>
								{mapped.map((message) => (
									<div
										key={message.id}
										className={cn(
											"max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
											message.role === "user"
												? "ms-auto rounded-ee-md bg-gradient-to-br from-sky-500 to-cyan-500 text-white"
												: "me-auto rounded-es-md bg-muted text-foreground",
										)}
									>
										{message.text}
									</div>
								))}
								{isLoading &&
									mapped[mapped.length - 1]?.role ===
										"user" && (
										<div className="me-auto flex items-center gap-1.5 rounded-2xl rounded-es-md bg-muted px-4 py-3">
											<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
											<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
											<span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
										</div>
									)}
								{error && (
									<div className="me-auto rounded-2xl bg-red-500/10 px-4 py-2.5 text-[13px] text-red-600 dark:text-red-400">
										{t("error")}
									</div>
								)}
								{/* دعوة للتسجيل بعد أول إجابة */}
								{!isLoading &&
									mapped.length >= 2 &&
									mapped[mapped.length - 1]?.role ===
										"assistant" &&
									config.ui.saas.enabled && (
										<div className="pt-1 text-center">
											<NextLink
												href="/auth/signup"
												className="inline-block rounded-xl px-5 py-2 font-bold text-[13px] text-white transition-all hover:-translate-y-0.5"
												style={{
													background:
														"linear-gradient(135deg, #0ea5e9, #06B6D4)",
												}}
											>
												{t("signupCta")}
											</NextLink>
										</div>
									)}
							</>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* الإدخال */}
					<div className="border-t p-3">
						<div className="flex items-end gap-2">
							<textarea
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSubmit();
									}
								}}
								placeholder={t("placeholder")}
								rows={1}
								maxLength={MAX_CHARS}
								className="max-h-24 flex-1 resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-sky-400"
							/>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={!input.trim() || isLoading}
								aria-label={t("send")}
								className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40"
								style={{
									background:
										"linear-gradient(135deg, #0ea5e9, #06B6D4)",
								}}
							>
								<SendIcon className="size-4 rtl:-scale-x-100" />
							</button>
						</div>
						<p className="mt-1.5 text-center text-[10px] text-muted-foreground/70">
							{t("disclaimer")}
						</p>
					</div>
				</div>
			)}
		</>
	);
}
