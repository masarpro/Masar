"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
	MessageSquareText,
	BarChart3,
	Users,
	BellRing,
	Bot,
	ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const bulletIcons = [MessageSquareText, BarChart3, Users, BellRing] as const;
const bulletColors = ["#0ea5e9", "#3B82F6", "#8B5CF6", "#F59E0B"] as const;

interface ChatMsg {
	role: "user" | "ai";
	key: string;
}

const chatMessages: ChatMsg[] = [
	{ role: "user", key: "1" },
	{ role: "ai", key: "2" },
	{ role: "user", key: "3" },
];

export function AiFeatureSection() {
	const t = useTranslations("aiFeature");
	const [visibleCount, setVisibleCount] = useState(0);
	const [typing, setTyping] = useState(false);
	const sectionRef = useRef<HTMLElement>(null);
	const hasAnimated = useRef(false);

	useEffect(() => {
		const el = sectionRef.current;
		if (!el) return;

		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !hasAnimated.current) {
					hasAnimated.current = true;
					// Stagger messages appearance
					let i = 0;
					const show = () => {
						i++;
						setVisibleCount(i);
						if (i < chatMessages.length) {
							setTimeout(show, 800);
						} else {
							// Show typing indicator after last message
							setTimeout(() => setTyping(true), 600);
						}
					};
					setTimeout(show, 400);
				}
			},
			{ threshold: 0.3 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	return (
		<section
			ref={sectionRef}
			className="relative py-28 px-6 overflow-hidden"
			style={{
				background:
					"linear-gradient(180deg, var(--lp-bg) 0%, var(--lp-bg-section) 30%, var(--lp-bg-section) 70%, var(--lp-bg) 100%)",
			}}
		>
			{/* Background glows */}
			<div
				className="absolute top-[20%] left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
				style={{
					background:
						"radial-gradient(circle, rgba(14,165,233,0.06), transparent 70%)",
					filter: "blur(80px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>
			<div
				className="absolute bottom-[10%] right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
				style={{
					background:
						"radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%)",
					filter: "blur(80px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>

			<div className="max-w-[1200px] mx-auto relative z-[2]">
				{/* Header */}
				<div className="text-center mb-16">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))",
							border: "1px solid rgba(59,130,246,0.12)",
							color: "#3B82F6",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #3B82F6, #8B5CF6)",
							}}
						/>
						{t("label")}
					</div>
					<h2
						className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3] max-w-[600px] mx-auto"
						style={{ color: "var(--lp-text)" }}
					>
						{t("title")}
					</h2>
					<p
						className="text-[17px] mt-4 max-w-[520px] mx-auto"
						style={{ color: "var(--lp-text-subtle)" }}
					>
						{t("description")}
					</p>
				</div>

				{/* Two columns */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
					{/* Right column (text) - shows first in RTL */}
					<div className="space-y-6">
						{(["1", "2", "3", "4"] as const).map((key, i) => {
							const Icon = bulletIcons[i];
							const color = bulletColors[i];
							return (
								<div key={key} className="flex items-start gap-4">
									<div
										className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
										style={{
											background: `linear-gradient(135deg, ${color}18, ${color}08)`,
											border: `1px solid ${color}25`,
										}}
									>
										<Icon
											size={20}
											style={{ color }}
										/>
									</div>
									<div>
										<p
											className="text-[16px] font-semibold leading-[1.6]"
											style={{
												color: "var(--lp-text)",
											}}
										>
											{t(`bullets.${key}`)}
										</p>
									</div>
								</div>
							);
						})}
					</div>

					{/* Left column (chat mockup) - shows second in RTL */}
					<div
						className="rounded-2xl p-5 border"
						style={{
							background:
								"linear-gradient(160deg, var(--lp-glow-card-bg), var(--lp-card-bg))",
							borderColor: "var(--lp-card-border)",
						}}
					>
						{/* Chat header */}
						<div
							className="flex items-center gap-3 pb-4 mb-4 border-b"
							style={{ borderColor: "var(--lp-card-border)" }}
						>
							<div
								className="w-9 h-9 rounded-lg flex items-center justify-center"
								style={{
									background:
										"linear-gradient(135deg, #3B82F6, #8B5CF6)",
								}}
							>
								<Bot size={18} color="#fff" />
							</div>
							<div>
								<p
									className="text-sm font-bold"
									style={{ color: "var(--lp-text)" }}
								>
									{t("chatHeader")}
								</p>
								<p
									className="text-xs"
									style={{
										color: "var(--lp-text-muted)",
									}}
								>
									{t("chatStatus")}
								</p>
							</div>
						</div>

						{/* Messages */}
						<div className="space-y-3 min-h-[260px]">
							{chatMessages.map((msg, i) => {
								if (i >= visibleCount) return null;
								const isUser = msg.role === "user";
								return (
									<div
										key={msg.key}
										className={`flex ${isUser ? "" : "justify-end"}`}
										style={{
											animation:
												"fadeSlideIn 0.4s ease-out forwards",
										}}
									>
										<div
											className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-[1.7] ${isUser ? "rounded-tl-sm" : "rounded-tr-sm"}`}
											style={
												isUser
													? {
															background:
																"var(--lp-card-bg)",
															border: "1px solid var(--lp-card-border)",
															color: "var(--lp-text)",
														}
													: {
															background:
																"linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))",
															border: "1px solid rgba(59,130,246,0.15)",
															color: "var(--lp-text)",
														}
											}
										>
											{t(`chat.${msg.key}`)}
										</div>
									</div>
								);
							})}

							{/* Typing indicator */}
							{typing && (
								<div
									className="flex justify-end"
									style={{
										animation:
											"fadeSlideIn 0.3s ease-out forwards",
									}}
								>
									<div
										className="rounded-xl rounded-tr-sm px-4 py-3 flex items-center gap-1.5"
										style={{
											background:
												"linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))",
											border: "1px solid rgba(59,130,246,0.15)",
										}}
									>
										<span className="typing-dot" />
										<span
											className="typing-dot"
											style={{
												animationDelay: "0.15s",
											}}
										/>
										<span
											className="typing-dot"
											style={{
												animationDelay: "0.3s",
											}}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* CTA */}
				<div className="text-center mt-14">
					<Link
						href="/app"
						className="inline-flex items-center gap-2 text-[15px] font-semibold transition-all hover:gap-3"
						style={{ color: "#3B82F6" }}
					>
						{t("cta")}
						<ArrowLeft size={16} />
					</Link>
				</div>
			</div>

			<style jsx>{`
				@keyframes fadeSlideIn {
					from {
						opacity: 0;
						transform: translateY(8px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.typing-dot {
					width: 6px;
					height: 6px;
					border-radius: 50%;
					background: rgba(59, 130, 246, 0.5);
					animation: typingBounce 1.2s infinite ease-in-out;
				}
				@keyframes typingBounce {
					0%,
					60%,
					100% {
						transform: translateY(0);
						opacity: 0.4;
					}
					30% {
						transform: translateY(-4px);
						opacity: 1;
					}
				}
			`}</style>
		</section>
	);
}
