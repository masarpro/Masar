"use client";

import {
	AlertTriangle,
	Building2,
	Calculator,
	CalendarClock,
	ChevronLeft,
	FileText,
	FolderKanban,
	FolderOpen,
	Home,
	MapPin,
	Plus,
	Receipt,
	Settings,
	TrendingDown,
	TrendingUp,
	Wallet,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Static, dummy-data replica of the real org dashboard
 * (modules/saas/dashboard/components/Dashboard.tsx + sections/*) used as the
 * hero "product shot" on the landing page — same layout, same Botly surfaces,
 * same i18n labels, no queries.
 *
 * Colors are light-locked hex (Botly light tokens) on purpose: the replica
 * sits on the fixed-dark hero and must keep its light art in dark mode,
 * exactly like BotlyHero's gradient card does in the app.
 */

// Botly light palette (theme.css light-mode values, hex-locked)
const INK = "#1d1d1d";
const MUTED = "#a0a5a9";
const STROKE = "#f2f2f2";
const BRAND_1 = "#ffcc6f"; // chart-1
const BRAND_2 = "#ea7465"; // chart-2 / destructive
const BRAND_3 = "#8ec9db"; // chart-3
const BRAND_4 = "#5d74f1"; // chart-4
const BRAND_5 = "#349264"; // chart-5 / success

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

export function LandingDashboardReplica() {
	const t = useTranslations();
	const v = useTranslations("landingVisuals.replica");

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

	const sidebarNav = [
		{ icon: Home, label: v("nav.home"), active: true },
		{ icon: FolderKanban, label: v("nav.projects") },
		{ icon: Wallet, label: v("nav.finance") },
		{ icon: Calculator, label: v("nav.pricing") },
		{ icon: Building2, label: v("nav.company") },
		{ icon: Settings, label: v("nav.settings") },
	];

	return (
		<div
			className="pointer-events-none flex select-none gap-3 rounded-[24px] bg-white p-3 md:p-4"
			aria-hidden="true"
			style={{ color: INK }}
		>
			{/* Sidebar — the app's Botly inverted floating panel, expanded.
			    inline-start so it sits on the right in RTL, like the real app. */}
			<div
				className="hidden w-40 shrink-0 flex-col rounded-[20px] p-3 md:flex"
				style={{ background: INK }}
			>
				<div className="flex items-center gap-2 px-2 pt-1 pb-4">
					<span className="grid size-7 place-items-center rounded-lg bg-white text-xs font-black" style={{ color: INK }}>
						م
					</span>
					<span className="text-sm font-bold text-white">مسار</span>
				</div>
				<div className="flex flex-col gap-1">
					{sidebarNav.map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
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
									className="size-3.5 shrink-0"
									style={{ color: item.active ? "#ffffff" : "#a0a5a9" }}
								/>
								<span
									className="truncate text-xs font-semibold"
									style={{ color: item.active ? "#ffffff" : "#a0a5a9" }}
								>
									{item.label}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			<div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
				{/* ── Left 2/3 ── */}
				<div className="flex min-w-0 flex-col gap-3 md:col-span-2 md:gap-4">
					{/* BotlyHero gradient card + glass stats strip */}
					<div
						className="relative overflow-hidden rounded-3xl"
						style={{
							backgroundImage:
								"linear-gradient(235.49deg, rgb(214, 220, 209) 57.337%, rgb(255, 221, 180) 81.642%, rgb(199, 180, 255) 105.59%)",
						}}
					>
						<div className="flex items-center gap-3 px-5 pt-4 pb-16 md:px-6 md:pt-5 md:pb-20">
							<p
								className="min-w-0 flex-1 truncate text-sm font-bold md:text-base"
								style={{ color: INK }}
							>
								{t("dashboard.welcome.greeting", { name: v("org") })}
							</p>
							<span
								className="hidden shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold text-white sm:flex"
								style={{ background: INK }}
							>
								{t("dashboard.cashFlow.goToFinance")}
								<ChevronLeft className="size-3 rtl-flip" />
							</span>
						</div>
						<div className="absolute inset-x-2 bottom-2">
							<div
								className="flex w-full gap-3 rounded-[18px] border bg-gradient-to-b from-[rgba(255,255,255,0.69)] to-white px-4 py-2.5 backdrop-blur-[24px] md:gap-5 md:px-6 md:py-3"
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
									<div key={s.label} className="min-w-0 flex-1">
										<p
											className="truncate text-[10px] font-semibold md:text-xs"
											style={{ color: INK }}
										>
											{s.label}
										</p>
										<p
											className="truncate text-sm font-bold tabular-nums md:text-lg"
											style={{ color: INK }}
										>
											{s.value}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Quick actions */}
					<div className={`${card} p-3.5 md:p-4`} style={cardStyle}>
						<p className="mb-2.5 text-xs font-semibold md:text-sm">
							{t("dashboard.quickActions")}
						</p>
						<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:gap-2">
							{quickActions.map((a) => (
								<div
									key={a.label}
									className="flex items-center gap-2 rounded-2xl border-2 p-1.5 md:p-2"
									style={{ borderColor: STROKE }}
								>
									<StatChip icon={a.icon} bg={a.bg} color={a.color} />
									<span className="min-w-0 flex-1 truncate text-[11px] font-semibold md:text-xs">
										{a.label}
									</span>
									<span
										className="hidden size-5 shrink-0 items-center justify-center rounded-md border-2 sm:flex"
										style={{ borderColor: STROKE, color: MUTED }}
									>
										<Plus className="size-3" />
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Active projects table */}
					<div className={`${card} px-4 py-3.5 md:px-5 md:py-4`} style={cardStyle}>
						<div className="flex items-center justify-between">
							<p className="text-xs font-semibold md:text-sm">
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
						<div className="mt-2">
							{projects.map((p, i) => (
								<div
									key={p.name}
									className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)] items-center gap-3 py-2 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] md:py-2.5"
									style={
										i < projects.length - 1
											? { borderBottom: `2px solid ${STROKE}` }
											: undefined
									}
								>
									<div className="flex min-w-0 items-center gap-2.5">
										<span
											className="flex size-8 shrink-0 items-center justify-center rounded-lg md:size-9 md:rounded-xl"
											style={{ background: "rgba(93,116,241,0.15)" }}
										>
											<FolderOpen className="size-3.5" style={{ color: BRAND_4 }} />
										</span>
										<div className="min-w-0">
											<p className="truncate text-[11px] font-semibold md:text-xs">
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
										className="hidden truncate text-[11px] font-semibold tabular-nums sm:block"
										style={{ color: BRAND_2 }}
									>
										{p.out}
									</p>
									<p
										className="hidden truncate text-[11px] font-semibold tabular-nums sm:block"
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
				<div className="flex min-w-0 flex-col gap-3 md:gap-4">
					{/* Cash-flow bars (Botly Membership widget) */}
					<div className={`${card} p-3.5 md:p-4`} style={cardStyle}>
						<p className="text-xs font-semibold md:text-sm">
							{t("dashboard.financePanel.cashFlowTitle")}
						</p>
						<div className="mt-2 flex items-center gap-3 text-[10px] md:text-[11px]">
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
						<div className="mt-3 flex h-24 items-end gap-2 md:h-28">
							{bars.map((b, i) => (
								<div
									key={i}
									className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"
								>
									<div
										className="w-2.5 rounded-[5px] md:w-3"
										style={{ height: `${b.a}%`, background: BRAND_1 }}
									/>
									<div
										className="w-2.5 rounded-[5px] md:w-3"
										style={{ height: `${b.b}%`, background: BRAND_2 }}
									/>
								</div>
							))}
						</div>
						<div className="mt-1.5 flex gap-2">
							{bars.map((_, i) => (
								<p
									key={i}
									className="flex-1 text-center text-[9px] md:text-[10px]"
									style={{ color: MUTED }}
								>
									{v(`months.${i + 1}`)}
								</p>
							))}
						</div>
					</div>

					{/* Needs attention + latest docs */}
					<div className={`${card} flex-1 p-3.5 md:p-4`} style={cardStyle}>
						<p className="text-xs font-semibold md:text-sm">
							{t("dashboard.alerts.needsAttention")}
						</p>
						<div className="mt-2 space-y-1.5">
							{attention.map((a) => (
								<div key={a.label} className="flex items-center gap-2 p-1">
									<StatChip icon={a.icon} bg={a.bg} color={a.color} />
									<span className="min-w-0 flex-1 truncate text-[11px] md:text-xs">
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
							className="mt-3 pt-2.5"
							style={{ borderTop: `2px solid ${STROKE}` }}
						>
							<p className="text-[11px] font-semibold md:text-xs" style={{ color: MUTED }}>
								{t("dashboard.recentDocs.title")}
							</p>
							<div className="mt-1.5 space-y-1">
								{["1024", "1023"].map((no) => (
									<div key={no} className="flex items-center gap-2 p-1">
										<span
											className="flex size-6 shrink-0 items-center justify-center rounded-lg"
											style={{ background: "rgba(93,116,241,0.15)" }}
										>
											<Receipt className="size-3" style={{ color: BRAND_4 }} />
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
	);
}
