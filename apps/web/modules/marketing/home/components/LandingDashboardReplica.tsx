"use client";

import { MasarLogoSvg } from "@shared/components/Logo";
import {
	AlertTriangle,
	Bell,
	Building2,
	Calculator,
	CalendarClock,
	Camera,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	FileText,
	FolderKanban,
	FolderOpen,
	Home,
	Lock,
	MapPin,
	Menu,
	Plus,
	Receipt,
	Search,
	Settings,
	Sparkles,
	SquarePlus,
	TrendingDown,
	TrendingUp,
	Wallet,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

/**
 * Static, dummy-data replica of the real org dashboard
 * (modules/saas/dashboard/components/Dashboard.tsx + sections/* and the app
 * shell: AppSidebar + GlobalHeader) used as the hero "product shot" on the
 * landing page — same layout, same Botly surfaces, same i18n labels, no
 * queries. It is dressed in a light browser chrome so it reads as a real
 * screenshot of app-masar.com.
 *
 * Layout parity with the real Dashboard: a FIXED-HEIGHT board whose two
 * columns share matched flex ratios (hero↔cash-flow = 4, quick↔field = 3,
 * projects↔attention = 5) so every card aligns row-for-row and fills the
 * board, exactly like the app's xl:h-[calc(100dvh-…)] flex columns.
 *
 * It ALWAYS renders the desktop layout at a fixed design width and scales
 * down to fit its container (like a screenshot would), so phones see the
 * exact same computer view. Colors are light-locked hex (Botly light tokens)
 * on purpose: the replica sits on the fixed-dark hero and must keep its
 * light art in dark mode, exactly like BotlyHero's gradient card does.
 */

// Botly light palette (theme.css light-mode values, hex-locked)
const INK = "#1d1d1d";
const MUTED = "#a0a5a9";
const STROKE = "#f2f2f2";
const APP_BG = "#ffffff"; // app background behind the cards (white, like the app)
const BRAND_1 = "#ffcc6f"; // chart-1
const BRAND_2 = "#ea7465"; // chart-2 / destructive
const BRAND_3 = "#8ec9db"; // chart-3
const BRAND_4 = "#5d74f1"; // chart-4
const BRAND_5 = "#349264"; // chart-5 / success

// Fixed desktop design width + board height the replica is authored at.
const BASE_WIDTH = 1180;
const BOARD_HEIGHT = 560; // the flex-column grid (matches the app's tall board)

const card = "rounded-3xl border-2 bg-white";
const cardStyle = { borderColor: STROKE, color: INK };

function StatChip({
	icon: Icon,
	bg,
	color,
}: {
	icon: typeof Receipt;
	bg: string;
	color: string;
}) {
	return (
		<span
			className="flex size-7 shrink-0 items-center justify-center rounded-xl"
			style={{ background: bg, color }}
		>
			<Icon className="size-3.5" />
		</span>
	);
}

// Botly top-bar icon button (GlobalHeader iconButtonClass, scaled to the board)
function HeaderIcon({ icon: Icon }: { icon: typeof Receipt }) {
	return (
		<span
			className="flex size-9 items-center justify-center rounded-xl"
			style={{ color: INK }}
		>
			<Icon className="size-[18px]" />
		</span>
	);
}

export function LandingDashboardReplica() {
	const t = useTranslations();
	const v = useTranslations("landingVisuals.replica");

	// Scale-to-fit: keep the desktop layout at every viewport, shrinking the
	// whole board like an image. Height is synced to the scaled content.
	const outerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);
	const [height, setHeight] = useState<number | undefined>(undefined);

	useEffect(() => {
		const update = () => {
			const w = outerRef.current?.clientWidth ?? BASE_WIDTH;
			const s = Math.min(1, w / BASE_WIDTH);
			setScale(s);
			const h = innerRef.current?.offsetHeight ?? 0;
			setHeight(h > 0 ? h * s : undefined);
		};
		update();
		const ro = new ResizeObserver(update);
		if (outerRef.current) {
			ro.observe(outerRef.current);
		}
		if (innerRef.current) {
			ro.observe(innerRef.current);
		}
		return () => ro.disconnect();
	}, []);

	const sidebarNav = [
		{ icon: Home, label: v("nav.home"), active: true },
		{ icon: FolderKanban, label: v("nav.projects") },
		{ icon: Wallet, label: v("nav.finance"), expandable: true },
		{ icon: Calculator, label: v("nav.pricing"), expandable: true },
		{ icon: Building2, label: v("nav.company"), expandable: true },
		{ icon: Settings, label: v("nav.settings") },
	];

	const quickActions = [
		{
			icon: TrendingDown,
			label: t("dashboard.actions.expenses"),
			bg: "rgba(234,116,101,0.15)",
			color: BRAND_2,
		},
		{
			icon: TrendingUp,
			label: t("dashboard.actions.payments"),
			bg: "rgba(52,146,100,0.15)",
			color: BRAND_5,
		},
		{
			icon: FileText,
			label: t("dashboard.actions.quotations"),
			bg: "rgba(142,201,219,0.2)",
			color: BRAND_3,
		},
		{
			icon: Receipt,
			label: t("dashboard.actions.invoices"),
			bg: "rgba(93,116,241,0.15)",
			color: BRAND_4,
		},
		{
			icon: Calculator,
			label: t("dashboard.actions.quantityStudies"),
			bg: "rgba(255,204,111,0.25)",
			color: INK,
		},
		{
			icon: Users,
			label: t("dashboard.actions.leads"),
			bg: "rgba(29,29,29,0.08)",
			color: INK,
		},
	];

	const projects = [
		{
			name: v("projects.1.name"),
			phase: v("projects.1.phase"),
			progress: 72,
			out: "245,000",
			in: "685,000",
		},
		{
			name: v("projects.2.name"),
			phase: v("projects.2.phase"),
			progress: 38,
			out: "512,400",
			in: "890,000",
		},
		{
			name: v("projects.3.name"),
			phase: v("projects.3.phase"),
			progress: 15,
			out: "96,300",
			in: "310,000",
		},
	];

	// 6 grouped months — receipts (Brand/01) vs expenses (Brand/02)
	const bars = [
		{ a: 44, b: 30 },
		{ a: 62, b: 38 },
		{ a: 52, b: 46 },
		{ a: 78, b: 40 },
		{ a: 58, b: 52 },
		{ a: 92, b: 60 },
	];

	const attention = [
		{
			icon: AlertTriangle,
			label: t("dashboard.alerts.overdueInvoices"),
			count: 2,
			bg: "rgba(234,116,101,0.15)",
			color: BRAND_2,
		},
		{
			icon: CalendarClock,
			label: t("dashboard.alerts.upcomingPayments"),
			count: 3,
			bg: "rgba(255,204,111,0.25)",
			color: INK,
		},
		{
			icon: FileText,
			label: t("dashboard.alerts.pendingClaims"),
			count: 1,
			bg: "rgba(142,201,219,0.2)",
			color: BRAND_3,
		},
	];

	return (
		<div
			ref={outerRef}
			className="overflow-hidden"
			style={{ height }}
			aria-hidden="true"
		>
			<div
				ref={innerRef}
				className="pointer-events-none origin-top-left select-none overflow-hidden rounded-[20px] border bg-white rtl:origin-top-right"
				style={{
					color: INK,
					width: BASE_WIDTH,
					transform: `scale(${scale})`,
					borderColor: "#e4e4e9",
				}}
			>
				{/* ── Browser chrome (LTR, like a real browser screenshot) ── */}
				<div
					dir="ltr"
					className="flex items-center gap-3 px-4 py-2.5"
					style={{ background: "#ededf1", borderBottom: "1px solid #e0e0e6" }}
				>
					<div className="flex items-center gap-1.5">
						<span className="size-3 rounded-full bg-[#ff5f57]" />
						<span className="size-3 rounded-full bg-[#febc2e]" />
						<span className="size-3 rounded-full bg-[#28c840]" />
					</div>
					<div className="flex flex-1 justify-center">
						<div
							className="flex items-center gap-2 rounded-lg px-4 py-1.5"
							style={{ background: "#ffffff", minWidth: 320 }}
						>
							<Lock className="size-3" style={{ color: MUTED }} />
							<span
								className="text-[12px] font-medium"
								style={{ color: "#5c6066" }}
							>
								app-masar.com/app
							</span>
						</div>
					</div>
					<div className="w-14" />
				</div>

				{/* ── App viewport ── */}
				<div className="flex gap-4 p-4" style={{ background: APP_BG }}>
					{/* Sidebar — mirrors the real app's inverted floating panel
					    (AppSidebar): مسار wordmark + burger, expandable sections with
					    chevrons, active الرئيسية pill, AI button at the bottom.
					    inline-start so it sits on the right in RTL, like the app. */}
					<div
						className="flex w-44 shrink-0 flex-col self-stretch rounded-[20px] p-3"
						style={{ background: INK }}
					>
						<div className="flex items-center justify-between px-2 pt-1 pb-5">
							<span className="inline-flex text-white">
								<MasarLogoSvg mono className="h-6 w-auto" />
							</span>
							<Menu className="size-4" style={{ color: MUTED }} />
						</div>
						<div className="flex flex-col gap-1.5">
							{sidebarNav.map((item) => {
								const Icon = item.icon;
								return (
									<div
										key={item.label}
										className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
										style={
											item.active
												? {
														background: "#323232",
														border: "1px solid rgba(255,255,255,0.1)",
													}
												: undefined
										}
									>
										<Icon
											className="size-4 shrink-0"
											style={{ color: item.active ? "#ffffff" : MUTED }}
										/>
										<span
											className="min-w-0 flex-1 truncate text-[13px] font-semibold"
											style={{ color: item.active ? "#ffffff" : MUTED }}
										>
											{item.label}
										</span>
										{item.expandable && (
											<ChevronDown
												className="size-3 shrink-0"
												style={{ color: MUTED }}
											/>
										)}
									</div>
								);
							})}
						</div>
						{/* floating AI assistant button, like the real app */}
						<div className="mt-auto flex justify-end pt-6">
							<span
								className="grid size-9 place-items-center rounded-full"
								style={{ background: BRAND_4 }}
							>
								<Sparkles className="size-4 text-white" />
							</span>
						</div>
					</div>

					{/* Content column — header + fixed-height dashboard grid */}
					<div className="flex min-w-0 flex-1 flex-col gap-4">
						{/* Global header (GlobalHeader): page title + back/forward
						    chevrons on the leading side; quick-add → bell → search →
						    avatar on the trailing side. */}
						<div className="flex items-center justify-between gap-3 px-1">
							<div className="flex min-w-0 items-center gap-4">
								<h1
									className="truncate text-2xl font-bold"
									style={{ color: INK }}
								>
									{v("nav.home")}
								</h1>
								<div className="flex items-center">
									<HeaderIcon icon={ChevronLeft} />
									<HeaderIcon icon={ChevronRight} />
								</div>
							</div>
							<div className="flex items-center gap-1.5">
								<HeaderIcon icon={SquarePlus} />
								<HeaderIcon icon={Bell} />
								<HeaderIcon icon={Search} />
								<span
									className="ms-1 grid size-9 place-items-center rounded-full text-[13px] font-bold text-white"
									style={{ background: BRAND_4 }}
								>
									ع
								</span>
							</div>
						</div>

						<div
							className="grid min-w-0 grid-cols-3 gap-5"
							style={{ height: BOARD_HEIGHT }}
						>
							{/* ── Left 2/3 ── */}
							<div className="col-span-2 flex min-h-0 min-w-0 flex-col gap-5">
								{/* BotlyHero gradient card + glass stats strip (flex-4) */}
								<div
									className="relative flex-[4] overflow-hidden rounded-[32px]"
									style={{
										backgroundImage:
											"linear-gradient(235.49deg, rgb(214, 220, 209) 57.337%, rgb(255, 221, 180) 81.642%, rgb(199, 180, 255) 105.59%)",
									}}
								>
									{/* greeting + contextual CTA + carousel arrows (BotlyHero) */}
									<div className="flex items-center gap-2.5 px-7 pt-6">
										<p
											className="min-w-0 flex-1 truncate text-xl font-bold leading-tight"
											style={{ color: INK }}
										>
											{t("dashboard.welcome.greeting", { name: v("org") })}
										</p>
										<span
											className="flex shrink-0 items-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white"
											style={{ background: INK }}
										>
											{t("dashboard.cashFlow.goToFinance")}
											<ChevronLeft className="size-4 rtl-flip" />
										</span>
										<div className="flex shrink-0 items-center">
											<span
												className="flex size-9 items-center justify-center rounded-xl"
												style={{ color: INK }}
											>
												<ChevronLeft className="size-4 rtl-flip" />
											</span>
											<span
												className="flex size-9 items-center justify-center rounded-xl"
												style={{ color: INK }}
											>
												<ChevronRight className="size-4 rtl-flip" />
											</span>
										</div>
									</div>

									{/* bottom block — card title + dots, then the glass strip */}
									<div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5">
										<div className="flex items-center justify-between px-3">
											<span
												className="truncate text-xs font-semibold"
												style={{ color: "rgba(29,29,29,0.6)" }}
											>
												{t("dashboard.hero.cards.finance")}
											</span>
											<div className="flex shrink-0 items-center gap-1.5">
												{[0, 1, 2, 3].map((i) => (
													<span
														key={i}
														className={`h-1.5 rounded-full ${i === 0 ? "w-5" : "w-1.5"}`}
														style={{
															background:
																i === 0 ? INK : "rgba(29,29,29,0.25)",
														}}
													/>
												))}
											</div>
										</div>
										<div
											className="flex w-full gap-6 rounded-[24px] border bg-gradient-to-b from-[rgba(255,255,255,0.69)] to-white px-9 py-4 backdrop-blur-[24px]"
											style={{ borderColor: "rgba(255,255,255,0.7)" }}
										>
											{[
												{
													label: t("dashboard.operational.activeProjects"),
													value: "4",
												},
												{
													label: t("dashboard.kpi.bankBalance"),
													value: `1,245,300 ${v("sar")}`,
												},
												{
													label: t("dashboard.kpi.cashBalance"),
													value: `86,500 ${v("sar")}`,
												},
											].map((s) => (
												<div
													key={s.label}
													className="flex min-w-0 flex-1 flex-col gap-1"
												>
													<p
														className="truncate text-sm font-semibold leading-6"
														style={{ color: INK }}
													>
														{s.label}
													</p>
													<p
														className="truncate text-2xl font-bold tabular-nums leading-none"
														style={{ color: INK, letterSpacing: "-0.84px" }}
													>
														{s.value}
													</p>
												</div>
											))}
										</div>
									</div>
								</div>

								{/* Quick actions (flex-3) */}
								<div
									className={`${card} flex flex-[3] flex-col p-4`}
									style={cardStyle}
								>
									<p className="mb-2.5 shrink-0 text-sm font-semibold">
										{t("dashboard.quickActions")}
									</p>
									<div className="grid flex-1 grid-cols-3 grid-rows-2 gap-2.5">
										{quickActions.map((a) => (
											<div
												key={a.label}
												className="flex items-center gap-2 rounded-2xl border-2 px-2.5"
												style={{ borderColor: STROKE }}
											>
												<StatChip icon={a.icon} bg={a.bg} color={a.color} />
												<span className="min-w-0 flex-1 truncate text-xs font-semibold">
													{a.label}
												</span>
												<span
													className="flex size-5 shrink-0 items-center justify-center rounded-md border-2"
													style={{ borderColor: STROKE, color: MUTED }}
												>
													<Plus className="size-3" />
												</span>
											</div>
										))}
									</div>
								</div>

								{/* Active projects table (flex-5) */}
								<div
									className={`${card} flex flex-[5] flex-col px-5 py-4`}
									style={cardStyle}
								>
									<div className="flex shrink-0 items-center justify-between">
										<p className="text-sm font-semibold">
											{t("dashboard.activeProjects")}
										</p>
										<span
											className="flex items-center gap-1 text-[11px] font-medium"
											style={{ color: MUTED }}
										>
											{t("dashboard.viewAll")}
											<ChevronLeft className="size-3 rtl-flip" />
										</span>
									</div>
									<div className="mt-1 flex min-h-0 flex-1 flex-col">
										{projects.map((p, i) => (
											<div
												key={p.name}
												className="grid flex-1 grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-center gap-3"
												style={
													i < projects.length - 1
														? { borderBottom: `2px solid ${STROKE}` }
														: undefined
												}
											>
												<div className="flex min-w-0 items-center gap-2.5">
													<span
														className="flex size-10 shrink-0 items-center justify-center rounded-xl"
														style={{ background: "rgba(93,116,241,0.15)" }}
													>
														<FolderOpen
															className="size-4"
															style={{ color: BRAND_4 }}
														/>
													</span>
													<div className="min-w-0">
														<p className="truncate text-xs font-semibold">
															{p.name}
														</p>
														<p
															className="flex items-center gap-1 truncate text-[10px]"
															style={{ color: MUTED }}
														>
															<MapPin
																className="size-2.5 shrink-0"
																style={{ color: BRAND_3 }}
															/>
															<span className="truncate">{p.phase}</span>
														</p>
													</div>
												</div>
												<div className="flex items-center gap-1.5">
													<div
														className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-[3px]"
														style={{ background: STROKE }}
													>
														<div
															className="h-full rounded-[3px]"
															style={{
																width: `${p.progress}%`,
																background: BRAND_1,
															}}
														/>
													</div>
													<span className="shrink-0 text-[11px] font-semibold tabular-nums">
														{p.progress}
														<span style={{ color: MUTED }}>%</span>
													</span>
												</div>
												<p
													className="truncate text-[11px] font-semibold tabular-nums"
													style={{ color: BRAND_2 }}
												>
													{p.out}
												</p>
												<p
													className="truncate text-[11px] font-semibold tabular-nums"
													style={{ color: BRAND_5 }}
												>
													{p.in}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* ── Right 1/3 ── */}
							<div className="flex min-h-0 min-w-0 flex-col gap-5">
								{/* Cash-flow bars (Botly Membership widget, flex-4) */}
								<div
									className={`${card} flex flex-[4] flex-col p-4`}
									style={cardStyle}
								>
									<div className="flex shrink-0 items-center justify-between">
										<p className="text-sm font-semibold">
											{t("dashboard.financePanel.cashFlowTitle")}
										</p>
										<ChevronLeft
											className="size-3.5 rtl-flip"
											style={{ color: MUTED }}
										/>
									</div>
									<div className="mt-2 flex shrink-0 items-center gap-3 text-[11px]">
										<span className="flex items-center gap-1">
											<i
												className="size-2 rounded-[3px]"
												style={{ background: BRAND_1 }}
											/>
											<span style={{ color: MUTED }}>
												{t("dashboard.financial.revenueLabel")}
											</span>
											<b className="font-semibold tabular-nums">2.4M</b>
										</span>
										<span className="flex items-center gap-1">
											<i
												className="size-2 rounded-[3px]"
												style={{ background: BRAND_2 }}
											/>
											<span style={{ color: MUTED }}>
												{t("dashboard.financial.expensesLabel")}
											</span>
											<b className="font-semibold tabular-nums">1.8M</b>
										</span>
									</div>
									{/* chart: y-axis (start/right) + bars fill remaining height */}
									<div className="mt-3 flex min-h-0 flex-1 gap-2">
										<div
											className="flex shrink-0 flex-col justify-between py-0.5 text-[9px] tabular-nums"
											style={{ color: MUTED }}
										>
											<span>800K</span>
											<span>400K</span>
											<span>0</span>
										</div>
										<div className="flex min-h-0 flex-1 items-end gap-2">
											{bars.map((b, i) => (
												<div
													key={i}
													className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"
												>
													<div
														className="w-3 rounded-[5px]"
														style={{ height: `${b.a}%`, background: BRAND_1 }}
													/>
													<div
														className="w-3 rounded-[5px]"
														style={{ height: `${b.b}%`, background: BRAND_2 }}
													/>
												</div>
											))}
										</div>
									</div>
									<div className="mt-1.5 flex shrink-0 gap-2 ps-7">
										{bars.map((_, i) => (
											<p
												key={i}
												className="flex-1 text-center text-[10px]"
												style={{ color: MUTED }}
											>
												{v(`months.${i + 1}`)}
											</p>
										))}
									</div>
								</div>

								{/* Field activity (FieldActivityCard, flex-3): projects
								    touched today headline + new media + stalest site. */}
								<div
									className={`${card} flex flex-[3] flex-col p-4`}
									style={cardStyle}
								>
									<div className="flex shrink-0 items-baseline justify-between gap-2">
										<p className="truncate text-sm font-semibold">
											{t("dashboard.fieldActivity.title")}
										</p>
										<p className="shrink-0 text-2xl font-bold tabular-nums">3</p>
									</div>
									<p
										className="shrink-0 text-[11px] font-medium"
										style={{ color: MUTED }}
									>
										{t("dashboard.fieldActivity.siteUpdates")}
									</p>
									<div className="mt-2 flex min-h-0 flex-1 flex-col justify-center gap-2">
										<div className="flex items-center gap-2.5">
											<span
												className="flex size-8 shrink-0 items-center justify-center rounded-lg"
												style={{
													background: "rgba(255,204,111,0.25)",
													color: INK,
												}}
											>
												<MapPin className="size-4" />
											</span>
											<span className="min-w-0 flex-1 truncate text-xs">
												{t("dashboard.fieldActivity.updatedToday", {
													count: 3,
												})}
											</span>
										</div>
										<div className="flex items-center gap-2.5">
											<span
												className="flex size-8 shrink-0 items-center justify-center rounded-lg"
												style={{
													background: "rgba(93,116,241,0.15)",
													color: BRAND_4,
												}}
											>
												<Camera className="size-4" />
											</span>
											<span className="min-w-0 flex-1 truncate text-xs">
												{t("dashboard.fieldActivity.newMedia", {
													photos: 14,
													reports: 2,
												})}
											</span>
										</div>
										<div className="flex items-center gap-2.5">
											<span
												className="flex size-8 shrink-0 items-center justify-center rounded-lg"
												style={{
													background: "rgba(142,201,219,0.2)",
													color: BRAND_3,
												}}
											>
												<CalendarClock className="size-4" />
											</span>
											<span className="min-w-0 flex-1 truncate text-xs">
												{t("dashboard.fieldActivity.stale", {
													name: v("projects.3.name"),
													days: 4,
												})}
											</span>
										</div>
									</div>
								</div>

								{/* Needs attention + latest docs (flex-5) */}
								<div
									className={`${card} flex flex-[5] flex-col p-4`}
									style={cardStyle}
								>
									<p className="shrink-0 text-sm font-semibold">
										{t("dashboard.alerts.needsAttention")}
									</p>
									<div className="mt-2 flex flex-col gap-1.5">
										{attention.map((a) => (
											<div
												key={a.label}
												className="flex items-center gap-2 p-1"
											>
												<StatChip icon={a.icon} bg={a.bg} color={a.color} />
												<span className="min-w-0 flex-1 truncate text-xs">
													{a.label}
												</span>
												<span
													className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums text-white"
													style={{ background: INK }}
												>
													{a.count}
												</span>
											</div>
										))}
									</div>
									<div
										className="mt-auto pt-3"
										style={{ borderTop: `2px solid ${STROKE}` }}
									>
										<p
											className="text-xs font-semibold"
											style={{ color: MUTED }}
										>
											{t("dashboard.recentDocs.title")}
										</p>
										<div className="mt-1.5 flex flex-col gap-1">
											{["1024", "1023"].map((no) => (
												<div
													key={no}
													className="flex items-center gap-2 p-1"
												>
													<span
														className="flex size-6 shrink-0 items-center justify-center rounded-lg"
														style={{ background: "rgba(93,116,241,0.15)" }}
													>
														<Receipt
															className="size-3"
															style={{ color: BRAND_4 }}
														/>
													</span>
													<span className="min-w-0 flex-1 truncate text-[11px] font-medium">
														{t("dashboard.recentDocs.invoice")} #{no}
													</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
