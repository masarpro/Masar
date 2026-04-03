"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	LayoutDashboard,
	Calculator,
	Receipt,
	BarChart3,
	GanttChart,
	Users,
	Globe,
	HardHat,
	Languages,
	CheckCircle2Icon,
	LoaderIcon,
	MessageCircleIcon,
	XIcon,
	CreditCard,
	Building2,
	ShieldCheck,
	ArrowDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function ChoosePlanContent() {
	const t = useTranslations();
	const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
		"monthly",
	);

	return (
		<div
			dir="rtl"
			className="min-h-screen overflow-x-hidden"
			style={{ background: "var(--lp-bg)", color: "var(--lp-text)" }}
		>
			{/* Section 1 — Hero Header */}
			<HeroSection />

			{/* Section 2 — Activation Code */}
			<ActivationCodeSection />

			{/* Section 3 — Plan Comparison */}
			<PlansSection
				billingPeriod={billingPeriod}
				setBillingPeriod={setBillingPeriod}
			/>

			{/* Section 4 — Feature Cards */}
			<FeaturesSection />

			{/* Section 5 — Subscription Info */}
			<SubscriptionInfoSection />
		</div>
	);
}

/* ═══════════════════════════════════════════════
   Section 1 — Hero Header
   ═══════════════════════════════════════════════ */
function HeroSection() {
	const t = useTranslations();

	return (
		<section className="relative py-24 px-6 text-center overflow-hidden">
			{/* Background glow */}
			<div
				className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-[50%] pointer-events-none"
				style={{
					background:
						"conic-gradient(from 0deg, rgba(14,165,233,0.06), rgba(59,130,246,0.04), rgba(6,182,212,0.05), rgba(14,165,233,0.06))",
					filter: "blur(100px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>

			<div className="relative z-10 max-w-[700px] mx-auto">
				{/* Badge */}
				<div className="mb-6">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(14,165,233,0.06), rgba(6,182,212,0.04))",
							border: "1px solid rgba(14,165,233,0.12)",
							color: "#0ea5e9",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #0ea5e9, #06B6D4)",
							}}
						/>
						{t("choosePlan.heroBadge")}
					</div>
				</div>

				{/* Title */}
				<h1
					className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold leading-[1.3] mb-5"
					style={{ color: "var(--lp-text)" }}
				>
					{t("choosePlan.pageTitle")}
				</h1>

				{/* Subtitle */}
				<p
					className="text-[17px] leading-[1.7] max-w-[520px] mx-auto mb-8"
					style={{ color: "var(--lp-text-subtle)" }}
				>
					{t("choosePlan.heroSubtitle")}
				</p>

				{/* Scroll indicator */}
				<div className="flex justify-center">
					<ArrowDown
						className="animate-bounce"
						size={24}
						style={{ color: "var(--lp-text-faint)" }}
					/>
				</div>
			</div>
		</section>
	);
}

/* ═══════════════════════════════════════════════
   Section 2 — Plans Comparison
   ═══════════════════════════════════════════════ */
function PlansSection({
	billingPeriod,
	setBillingPeriod,
}: {
	billingPeriod: "monthly" | "yearly";
	setBillingPeriod: (v: "monthly" | "yearly") => void;
}) {
	const t = useTranslations();

	const freeFeatures = [
		t("choosePlan.free.features.users"),
		t("choosePlan.free.features.viewOnly"),
		t("choosePlan.free.features.noProjects"),
		t("choosePlan.free.features.noReports"),
		t("choosePlan.free.features.noSupport"),
	];

	const proFeatures = [
		t("choosePlan.pro.features.users"),
		t("choosePlan.pro.features.projects"),
		t("choosePlan.pro.features.storage"),
		t("choosePlan.pro.features.projectMgmt"),
		t("choosePlan.pro.features.pricing"),
		t("choosePlan.pro.features.finance"),
		t("choosePlan.pro.features.gantt"),
		t("choosePlan.pro.features.reports"),
		t("choosePlan.pro.features.zatca"),
		t("choosePlan.pro.features.ownerPortal"),
		t("choosePlan.pro.features.support"),
		t("choosePlan.pro.features.trial"),
	];

	return (
		<section
			className="relative py-20 px-6"
			style={{
				background:
					"linear-gradient(180deg, var(--lp-bg) 0%, var(--lp-bg-section) 50%, var(--lp-bg) 100%)",
			}}
		>
			<div className="max-w-[900px] mx-auto">
				{/* Billing Toggle */}
				<div className="flex justify-center mb-12">
					<div
						className="inline-flex items-center rounded-full p-1 gap-1"
						style={{
							background: "var(--lp-card-bg)",
							border: "1px solid var(--lp-card-border)",
						}}
					>
						<button
							type="button"
							onClick={() => setBillingPeriod("monthly")}
							className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
							style={{
								background:
									billingPeriod === "monthly"
										? "linear-gradient(135deg, #0ea5e9, #06B6D4)"
										: "transparent",
								color:
									billingPeriod === "monthly"
										? "white"
										: "var(--lp-text-muted)",
							}}
						>
							{t("choosePlan.billingToggle.monthly")}
						</button>
						<button
							type="button"
							onClick={() => setBillingPeriod("yearly")}
							className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2"
							style={{
								background:
									billingPeriod === "yearly"
										? "linear-gradient(135deg, #0ea5e9, #06B6D4)"
										: "transparent",
								color:
									billingPeriod === "yearly"
										? "white"
										: "var(--lp-text-muted)",
							}}
						>
							{t("choosePlan.billingToggle.yearly")}
							{billingPeriod !== "yearly" && (
								<span
									className="text-[11px] px-2 py-0.5 rounded-full font-bold"
									style={{
										background:
											"linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))",
										color: "#F59E0B",
										border: "1px solid rgba(245,158,11,0.2)",
									}}
								>
									{t("choosePlan.pro.yearlySaving")}
								</span>
							)}
						</button>
					</div>
				</div>

				{/* Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Free Plan */}
					<div
						className="landing-price-card"
						style={{
							background: "var(--lp-price-free-bg)",
							border: "1px solid var(--lp-price-free-border)",
						}}
					>
						<h3
							className="text-[22px] font-bold mb-1.5"
							style={{ color: "var(--lp-text)" }}
						>
							{t("choosePlan.free.name")}
						</h3>
						<p
							className="text-sm mb-6"
							style={{ color: "var(--lp-text-subtle)" }}
						>
							{t("choosePlan.description")}
						</p>
						<div
							className="text-[44px] font-black mb-7"
							style={{
								fontFamily: "'Space Grotesk', sans-serif",
								color: "var(--lp-text)",
							}}
						>
							{t("choosePlan.free.price")}
						</div>

						{/* Badge: Current Plan */}
						<div className="mb-6">
							<span
								className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold"
								style={{
									background: "var(--lp-card-bg)",
									border: "1px solid var(--lp-card-border)",
									color: "var(--lp-text-muted)",
								}}
							>
								{t("choosePlan.free.currentPlan")}
							</span>
						</div>

						<ul className="list-none mb-8 space-y-0">
							{freeFeatures.map((feature, i) => (
								<li
									key={feature}
									className="text-sm py-2.5 flex items-center gap-2.5"
									style={{
										color: "var(--lp-text-muted)",
										borderBottom:
											i < freeFeatures.length - 1
												? "1px solid var(--lp-card-border)"
												: "none",
									}}
								>
									<XIcon
										size={14}
										style={{
											color: "var(--lp-text-faint)",
										}}
									/>
									{feature}
								</li>
							))}
						</ul>

						<button
							type="button"
							disabled
							className="btn-premium btn-premium-ghost w-full justify-center !py-4 !text-[15px] opacity-50 cursor-not-allowed"
						>
							{t("choosePlan.free.currentPlan")}
						</button>
					</div>

					{/* PRO Plan */}
					<div
						className="landing-price-card"
						style={{
							background: "var(--lp-price-pro-bg)",
							border: "2px solid var(--lp-price-pro-border-color)",
							boxShadow: "var(--lp-price-pro-shadow)",
						}}
					>
						{/* Badge */}
						<div
							className="absolute -top-3.5 start-6 px-5 py-1.5 rounded-full text-xs font-bold text-white"
							style={{
								background:
									"linear-gradient(135deg, #F59E0B, #EF4444)",
								boxShadow:
									"0 4px 20px rgba(245,158,11,0.3), 0 0 40px rgba(239,68,68,0.1)",
								letterSpacing: "0.5px",
							}}
						>
							{t("choosePlan.pro.popular")}
						</div>

						<h3
							className="text-[22px] font-bold mb-1.5"
							style={{ color: "var(--lp-text)" }}
						>
							{t("choosePlan.pro.name")}
						</h3>
						<p
							className="text-sm mb-6"
							style={{ color: "var(--lp-text-subtle)" }}
						>
							{t("choosePlan.pro.trialNote")}
						</p>

						{/* Price */}
						<div className="mb-7 flex items-baseline gap-2 flex-wrap">
							<span
								className="text-[clamp(32px,5vw,44px)] font-black shimmer-blue"
								style={{
									fontFamily: "'Space Grotesk', sans-serif",
								}}
							>
								{billingPeriod === "monthly"
									? t("choosePlan.pro.priceMonthly")
									: t("choosePlan.pro.priceYearly")}
							</span>
							<span
								className="text-base font-semibold"
								style={{ color: "var(--lp-text-muted)" }}
							>
								{t("choosePlan.pro.currency")}{" "}
								{billingPeriod === "monthly"
									? t("choosePlan.pro.perMonth")
									: t("choosePlan.pro.perYear")}
							</span>
							{billingPeriod === "yearly" && (
								<span
									className="text-[11px] px-2 py-0.5 rounded-full font-bold"
									style={{
										background:
											"linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))",
										color: "#F59E0B",
										border: "1px solid rgba(245,158,11,0.2)",
									}}
								>
									{t("choosePlan.pro.yearlySaving")}
								</span>
							)}
						</div>

						<ul className="list-none mb-8 space-y-0">
							{proFeatures.map((feature, i) => (
								<li
									key={feature}
									className="text-sm py-2.5 flex items-center gap-2.5"
									style={{
										color: "var(--lp-text-muted)",
										borderBottom:
											i < proFeatures.length - 1
												? "1px solid var(--lp-card-border)"
												: "none",
									}}
								>
									<span
										style={{
											background:
												"linear-gradient(135deg, #0ea5e9, #06B6D4)",
											WebkitBackgroundClip: "text",
											WebkitTextFillColor:
												"transparent",
											backgroundClip: "text",
										}}
									>
										&#10003;
									</span>
									{feature}
								</li>
							))}
						</ul>

						<a
							href="https://wa.me/966500000000?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D9%85%D8%B3%D8%A7%D8%B1%20PRO"
							target="_blank"
							rel="noopener noreferrer"
							className="btn-premium btn-premium-primary w-full justify-center !py-4 !text-base"
						>
							<MessageCircleIcon size={18} />
							{t("choosePlan.pro.contactUs")}
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ═══════════════════════════════════════════════
   Section 3 — Feature Cards
   ═══════════════════════════════════════════════ */
const featureIcons = [
	LayoutDashboard,
	Calculator,
	Receipt,
	GanttChart,
	Globe,
	HardHat,
	BarChart3,
	Users,
	Languages,
];

const featureColors = [
	"#0ea5e9",
	"#3B82F6",
	"#F59E0B",
	"#0ea5e9",
	"#8B5CF6",
	"#EF4444",
	"#06B6D4",
	"#3B82F6",
	"#0ea5e9",
];

function FeaturesSection() {
	const t = useTranslations();

	return (
		<section className="relative py-24 px-6">
			<div className="max-w-[1100px] mx-auto">
				{/* Header */}
				<div className="text-center mb-16">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(14,165,233,0.06), rgba(6,182,212,0.04))",
							border: "1px solid rgba(14,165,233,0.12)",
							color: "#0ea5e9",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #0ea5e9, #06B6D4)",
							}}
						/>
						PRO
					</div>
					<h2
						className="text-3xl sm:text-4xl font-extrabold leading-[1.3]"
						style={{ color: "var(--lp-text)" }}
					>
						{t("choosePlan.featuresSection.title")}
					</h2>
				</div>

				{/* Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{Array.from({ length: 9 }, (_, i) => {
						const Icon = featureIcons[i];
						const color = featureColors[i];
						const key = String(i + 1);

						return (
							<div
								key={key}
								className="landing-glow-card"
								style={{
									background: `linear-gradient(135deg, ${color}20, transparent)`,
								}}
							>
								<div className="landing-glow-card-inner">
									<div
										className="w-[48px] h-[48px] rounded-xl flex items-center justify-center mb-4"
										style={{
											background: `${color}15`,
											border: `1px solid ${color}20`,
										}}
									>
										<Icon
											size={24}
											color={color}
											strokeWidth={1.8}
										/>
									</div>
									<h3
										className="text-[17px] font-bold mb-2"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{t(
											`choosePlan.featuresSection.items.${key}.title`,
										)}
									</h3>
									<p
										className="text-sm leading-[1.7]"
										style={{
											color: "var(--lp-text-muted)",
										}}
									>
										{t(
											`choosePlan.featuresSection.items.${key}.description`,
										)}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

/* ═══════════════════════════════════════════════
   Section 4 — Subscription Info
   ═══════════════════════════════════════════════ */
function SubscriptionInfoSection() {
	const t = useTranslations();

	const steps = [
		{ num: "01", color: "#0ea5e9", accent: "#06B6D4" },
		{ num: "02", color: "#3B82F6", accent: "#8B5CF6" },
		{ num: "03", color: "#F59E0B", accent: "#EF4444" },
	];

	const paymentMethods = [
		{ label: t("choosePlan.subscriptionInfo.mada"), icon: CreditCard },
		{ label: t("choosePlan.subscriptionInfo.visa"), icon: CreditCard },
		{
			label: t("choosePlan.subscriptionInfo.mastercard"),
			icon: CreditCard,
		},
		{
			label: t("choosePlan.subscriptionInfo.bankTransfer"),
			icon: Building2,
		},
	];

	const guarantees = [
		t("choosePlan.subscriptionInfo.guarantees.noContracts"),
		t("choosePlan.subscriptionInfo.guarantees.secureData"),
		t("choosePlan.subscriptionInfo.guarantees.support"),
	];

	return (
		<section
			className="relative py-24 px-6"
			style={{
				background:
					"linear-gradient(180deg, var(--lp-bg) 0%, var(--lp-bg-section) 50%, var(--lp-bg) 100%)",
			}}
		>
			<div className="max-w-[1000px] mx-auto">
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
						{t("choosePlan.subscriptionInfo.title")}
					</div>
				</div>

				{/* Steps */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
					{steps.map((s, i) => {
						const key = String(i + 1);
						return (
							<div
								key={key}
								className="landing-step-card"
								style={{
									background: `linear-gradient(135deg, ${s.color}15, ${s.accent}08, var(--lp-card-border))`,
								}}
							>
								<div
									className="rounded-[22px] p-8 h-full text-center"
									style={{
										background: "var(--lp-step-inner)",
										backdropFilter: "blur(20px)",
									}}
								>
									<div
										className="w-[60px] h-[60px] rounded-[18px] mx-auto mb-5 flex items-center justify-center text-xl font-black"
										style={{
											background: `linear-gradient(135deg, ${s.color}18, ${s.accent}10)`,
											border: `1px solid ${s.color}25`,
											color: s.color,
											fontFamily:
												"'Space Grotesk', monospace",
										}}
									>
										{s.num}
									</div>
									<h3
										className="text-[17px] font-bold mb-2"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{t(
											`choosePlan.subscriptionInfo.steps.${key}.title`,
										)}
									</h3>
									<p
										className="text-sm leading-[1.7]"
										style={{
											color: "var(--lp-text-subtle)",
										}}
									>
										{t(
											`choosePlan.subscriptionInfo.steps.${key}.description`,
										)}
									</p>
								</div>
							</div>
						);
					})}
				</div>

				{/* Payment Methods */}
				<div className="text-center mb-10">
					<h3
						className="text-lg font-bold mb-6"
						style={{ color: "var(--lp-text)" }}
					>
						{t("choosePlan.subscriptionInfo.paymentMethods")}
					</h3>
					<div className="flex flex-wrap justify-center gap-4">
						{paymentMethods.map((pm) => {
							const Icon = pm.icon;
							return (
								<div
									key={pm.label}
									className="flex items-center gap-2 px-5 py-3 rounded-xl"
									style={{
										background: "var(--lp-card-bg)",
										border: "1px solid var(--lp-card-border)",
									}}
								>
									<Icon
										size={18}
										style={{
											color: "var(--lp-text-muted)",
										}}
									/>
									<span
										className="text-sm font-medium"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{pm.label}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* Guarantees */}
				<div className="flex flex-wrap justify-center gap-6">
					{guarantees.map((g) => (
						<div
							key={g}
							className="flex items-center gap-2 text-sm"
						>
							<ShieldCheck
								size={16}
								color="#0ea5e9"
								className="shrink-0"
							/>
							<span style={{ color: "var(--lp-text-muted)" }}>
								{g}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ═══════════════════════════════════════════════
   Section 5 — Activation Code
   ═══════════════════════════════════════════════ */
function ActivationCodeSection() {
	const t = useTranslations();
	const router = useRouter();
	const [code, setCode] = useState("");
	const [validatedData, setValidatedData] = useState<{
		planType: string;
		durationDays: number;
		maxUsers: number;
		maxProjects: number;
		maxStorageGB: number;
	} | null>(null);
	const [validationError, setValidationError] = useState(false);

	const validateMutation = useMutation({
		mutationFn: (codeValue: string) =>
			orpc.activationCodes.validate.call({ code: codeValue }),
		onSuccess: (data) => {
			setValidatedData(data);
			setValidationError(false);
		},
		onError: () => {
			setValidatedData(null);
			setValidationError(true);
		},
	});

	const activateMutation = useMutation({
		mutationFn: (codeValue: string) =>
			orpc.activationCodes.activate.call({ code: codeValue }),
		onSuccess: (data) => {
			toast.success(t("choosePlan.activateSuccess"));
			setTimeout(() => {
				router.push(data.orgSlug ? `/app/${data.orgSlug}` : "/app");
			}, 2000);
		},
		onError: (error: any) => {
			toast.error(error?.message ?? t("choosePlan.activateFailed"));
		},
	});

	const handleVerify = () => {
		if (!code.trim()) return;
		setValidationError(false);
		setValidatedData(null);
		validateMutation.mutate(code.trim());
	};

	const handleActivate = () => {
		if (!code.trim()) return;
		activateMutation.mutate(code.trim());
	};

	const expiresDate = validatedData
		? new Date(
				Date.now() + validatedData.durationDays * 24 * 60 * 60 * 1000,
			).toLocaleDateString("ar-SA")
		: "";

	return (
		<section className="relative py-24 px-6">
			{/* Separator */}
			<div className="max-w-[600px] mx-auto mb-16">
				<div
					className="h-px w-full"
					style={{ background: "var(--lp-card-border)" }}
				/>
			</div>

			<div className="max-w-[580px] mx-auto text-center">
				{/* Header */}
				<div
					className="landing-section-label"
					style={{
						background:
							"linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.04))",
						border: "1px solid rgba(245,158,11,0.12)",
						color: "#F59E0B",
					}}
				>
					<span
						className="landing-dot"
						style={{
							background:
								"linear-gradient(135deg, #F59E0B, #EF4444)",
						}}
					/>
					{t("choosePlan.haveCode")}
				</div>

				<p
					className="text-sm leading-[1.7] mb-8"
					style={{ color: "var(--lp-text-subtle)" }}
				>
					{t("choosePlan.haveCodeDescription")}
				</p>

				{/* Input */}
				<div
					className="rounded-2xl p-6"
					style={{
						background: "var(--lp-card-bg)",
						border: "1px solid var(--lp-card-border)",
						backdropFilter: "blur(20px)",
					}}
				>
					<div className="flex gap-3">
						<Input
							placeholder={t("choosePlan.codePlaceholder")}
							value={code}
							onChange={(e: any) => {
								setCode(e.target.value.toUpperCase());
								setValidatedData(null);
								setValidationError(false);
							}}
							className={`font-mono text-center tracking-wider text-base h-12 ${
								validationError
									? "border-red-500 focus-visible:ring-red-500"
									: ""
							}`}
							dir="ltr"
							onKeyDown={(e: any) => {
								if (e.key === "Enter") handleVerify();
							}}
						/>
						<Button
							onClick={handleVerify}
							disabled={
								!code.trim() || validateMutation.isPending
							}
							variant="outline"
							className="h-12 px-6 shrink-0"
						>
							{validateMutation.isPending ? (
								<LoaderIcon className="size-4 animate-spin" />
							) : (
								t("choosePlan.verify")
							)}
						</Button>
					</div>

					{/* Validation Error */}
					{validationError && (
						<div
							className="mt-4 rounded-xl p-4 text-sm font-medium text-start"
							style={{
								background: "rgba(239,68,68,0.08)",
								border: "1px solid rgba(239,68,68,0.2)",
								color: "#EF4444",
							}}
						>
							{t("choosePlan.invalidCode")}
						</div>
					)}

					{/* Validated Data */}
					{validatedData && (
						<div
							className="mt-4 rounded-xl p-5 space-y-4 text-start"
							style={{
								background: "rgba(16,185,129,0.06)",
								border: "1px solid rgba(16,185,129,0.2)",
							}}
						>
							<div className="flex items-center gap-2">
								<CheckCircle2Icon
									size={20}
									color="#10B981"
								/>
								<span
									className="font-bold"
									style={{ color: "#10B981" }}
								>
									{t("choosePlan.codeValid")}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<span
										style={{
											color: "var(--lp-text-subtle)",
										}}
									>
										{t("choosePlan.plan")}:
									</span>{" "}
									<span
										className="font-semibold"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{validatedData.planType}
									</span>
								</div>
								<div>
									<span
										style={{
											color: "var(--lp-text-subtle)",
										}}
									>
										{t("choosePlan.duration")}:
									</span>{" "}
									<span
										className="font-semibold"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{validatedData.durationDays}{" "}
										{t("choosePlan.daysUnit")}
									</span>
								</div>
								<div>
									<span
										style={{
											color: "var(--lp-text-subtle)",
										}}
									>
										{t("choosePlan.expiresAt")}:
									</span>{" "}
									<span
										className="font-semibold"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{expiresDate}
									</span>
								</div>
							</div>

							<button
								type="button"
								onClick={handleActivate}
								disabled={activateMutation.isPending}
								className="btn-premium btn-premium-primary w-full justify-center !py-3.5 !text-[15px] !rounded-xl"
								style={{
									background: activateMutation.isPending
										? undefined
										: "linear-gradient(135deg, #10B981, #059669)",
								}}
							>
								{activateMutation.isPending ? (
									<>
										<LoaderIcon className="size-4 animate-spin" />
										{t("choosePlan.activating")}
									</>
								) : (
									t("choosePlan.activateCode")
								)}
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Bottom spacer */}
			<div className="h-16" />
		</section>
	);
}
