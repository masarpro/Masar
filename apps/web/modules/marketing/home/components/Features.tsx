"use client";

import { useTranslations } from "next-intl";

/**
 * Feature stations rebuilt on the Botly system: every product visual is a
 * flat Botly widget card (32px radius, 2px stroke, brand-hue chips/bars),
 * alternating copy/visual rows. All copy comes from the same i18n keys as
 * before — only the presentation changed.
 */

function Tag({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex items-center rounded-full border-2 bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
			{children}
		</span>
	);
}

function StationCopy({
	index,
	itemKey,
	tagCount,
	isNew,
}: {
	index: number;
	itemKey: string;
	tagCount: number;
	isNew?: boolean;
}) {
	const t = useTranslations();
	return (
		<div>
			<div className="flex items-center gap-3">
				<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
					0{index}
				</span>
				<span className="text-sm font-semibold text-muted-foreground">
					{t(`features.items.${itemKey}.kicker`)}
					{isNew && (
						<span className="ms-2 rounded-full bg-chart-1/25 px-2.5 py-0.5 text-[11px] font-bold text-foreground">
							{t("features.newBadge")}
						</span>
					)}
				</span>
			</div>
			<h3 className="mt-4 text-xl font-extrabold text-foreground md:text-2xl">
				{t(`features.items.${itemKey}.title`)}
			</h3>
			<p className="mt-2 leading-[1.9] text-muted-foreground">
				{t(`features.items.${itemKey}.description`)}
			</p>
			<div className="mt-4 flex flex-wrap gap-2">
				{Array.from({ length: tagCount }, (_, i) => (
					<Tag key={`${itemKey}-${i + 1}`}>
						{t(`features.items.${itemKey}.sub.${i + 1}`)}
					</Tag>
				))}
			</div>
		</div>
	);
}

function WidgetCard({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-[var(--botly-radius-card)] border-2 bg-card p-6 md:p-8 ${className}`}
		>
			{children}
		</div>
	);
}

function ProgressBar({ value, color }: { value: number; color: string }) {
	return (
		<div className="h-2 w-full overflow-hidden rounded-[4px] bg-muted">
			<div
				className={`h-full rounded-[4px] ${color}`}
				style={{ width: `${value}%` }}
			/>
		</div>
	);
}

function CheckLine({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-3 border-b-2 py-3 last:border-0">
			<span className="grid size-7 shrink-0 place-items-center rounded-lg bg-success/15 text-sm font-bold text-success">
				✓
			</span>
			<span className="text-sm font-medium text-card-foreground">
				{children}
			</span>
		</div>
	);
}

function Station({
	index,
	itemKey,
	tagCount,
	isNew,
	visual,
}: {
	index: number;
	itemKey: string;
	tagCount: number;
	isNew?: boolean;
	visual: React.ReactNode;
}) {
	// Alternate visual side on desktop, Botly-landing style
	const flip = index % 2 === 0;
	return (
		<article
			id={`st-${index}`}
			className="bl-rv grid scroll-mt-24 grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14"
		>
			<div className={flip ? "md:order-2" : undefined}>
				<StationCopy
					index={index}
					itemKey={itemKey}
					tagCount={tagCount}
					isNew={isNew}
				/>
			</div>
			<div className={flip ? "md:order-1" : undefined} aria-hidden="true">
				{visual}
			</div>
		</article>
	);
}

export function Features() {
	const t = useTranslations();
	const v = useTranslations("landingVisuals");

	return (
		<section
			id="features"
			className="scroll-mt-16 bg-background px-6 py-24 md:py-32"
		>
			<div className="mx-auto max-w-[1180px]">
				{/* Header */}
				<div className="bl-rv mx-auto mb-12 max-w-[660px] text-center md:mb-16">
					<span className="inline-flex items-center rounded-full border-2 bg-card px-4 py-1.5 text-[13px] font-semibold text-muted-foreground">
						{t("features.label")}
					</span>
					<h2 className="mt-4 text-3xl font-extrabold text-foreground md:text-4xl">
						{t("features.title")}
					</h2>
					<p className="mt-3 leading-[1.9] text-muted-foreground">
						{t("features.description")}
					</p>
				</div>

				{/* Watchtower — the dashboard above all stations */}
				<div className="bl-rv mb-14 md:mb-20">
					<WidgetCard className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14">
						<div>
							<span className="text-sm font-semibold text-muted-foreground">
								{t("features.items.1.kicker")}
							</span>
							<h3 className="mt-2 text-xl font-extrabold text-foreground md:text-2xl">
								{t("features.items.1.title")}
							</h3>
							<p className="mt-2 leading-[1.9] text-muted-foreground">
								{t("features.items.1.description")}
							</p>
							<div className="mt-4 flex flex-wrap gap-2">
								{([1, 2, 3] as const).map((i) => (
									<Tag key={i}>{t(`features.items.1.sub.${i}`)}</Tag>
								))}
							</div>
						</div>
						<div aria-hidden="true">
							<div className="grid grid-cols-2 gap-3">
								{(
									[
										["2", v("tower.active"), "bg-chart-4/15 text-chart-4"],
										["5", v("tower.done"), "bg-success/15 text-success"],
										["0", v("tower.pending"), "bg-chart-1/25 text-foreground"],
										["0", v("tower.issues"), "bg-destructive/15 text-destructive"],
									] as const
								).map(([value, label, chip]) => (
									<div
										key={label}
										className="flex items-center gap-3 rounded-2xl border-2 p-3"
									>
										<span
											className={`grid size-9 shrink-0 place-items-center rounded-xl text-base font-bold ${chip}`}
										>
											{value}
										</span>
										<span className="text-xs font-semibold text-muted-foreground">
											{label}
										</span>
									</div>
								))}
							</div>
							<div className="mt-4 flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									{v("tower.overall")}
								</span>
								<b className="font-bold tabular-nums text-foreground">74%</b>
							</div>
							<div className="mt-1.5">
								<ProgressBar value={74} color="bg-chart-1" />
							</div>
						</div>
					</WidgetCard>
				</div>

				{/* Stations */}
				<div className="grid gap-16 md:gap-24">
					{/* 01 — Pricing & quantities */}
					<Station
						index={1}
						itemKey="4"
						tagCount={4}
						isNew
						visual={
							<WidgetCard>
								<div className="flex items-center justify-between">
									<span className="text-sm font-bold text-card-foreground">
										{v("pricing.project")}
									</span>
									<span className="rounded-full bg-chart-1/25 px-3 py-1 text-xs font-bold text-foreground">
										{v("pricing.draft")}
									</span>
								</div>
								<div className="mt-4 flex flex-wrap items-center gap-2">
									{(
										[
											["qty", true],
											["specs", true],
											["cost", true],
											["price", false],
										] as const
									).map(([key, done]) => (
										<span
											key={key}
											className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
												done
													? "bg-success/15 text-success"
													: "bg-chart-1/25 text-foreground"
											}`}
										>
											{done ? "✓" : "$"}
											{v(`pricing.steps.${key}`)}
											<i className="text-[10px] font-medium not-italic opacity-70">
												{done ? v("pricing.approved") : v("pricing.wip")}
											</i>
										</span>
									))}
								</div>
								<div className="mt-4 grid grid-cols-3 gap-2">
									{(
										[
											[
												v("pricing.concrete"),
												"1,551.58",
												v("pricing.concreteUnit"),
												"text-chart-4",
											],
											[
												v("pricing.steel"),
												"137.39",
												v("pricing.steelUnit"),
												"text-chart-2",
											],
											[
												v("pricing.block"),
												"115,500",
												v("pricing.blockUnit"),
												"text-success",
											],
										] as const
									).map(([label, value, unit, color]) => (
										<div key={label} className="rounded-2xl border-2 p-3">
											<p className="text-[11px] text-muted-foreground">
												{label}
											</p>
											<p
												className={`mt-1 text-sm font-bold tabular-nums ${color}`}
											>
												{value}{" "}
												<i className="text-[10px] font-medium not-italic text-muted-foreground">
													{unit}
												</i>
											</p>
										</div>
									))}
								</div>
								<div className="mt-4 flex items-center gap-3">
									<span className="rounded-[10px] bg-cta px-3.5 py-1.5 text-xs font-bold text-cta-foreground">
										{v("pricing.convert")}
									</span>
									<span className="text-xs text-muted-foreground">
										{v("pricing.convertHint")}
									</span>
								</div>
							</WidgetCard>
						}
					/>

					{/* 02 — Contracts & subcontractors */}
					<Station
						index={2}
						itemKey="5"
						tagCount={3}
						visual={
							<WidgetCard>
								<CheckLine>{v("contracts.l1")}</CheckLine>
								<CheckLine>{v("contracts.l2")}</CheckLine>
								<CheckLine>{v("contracts.l3")}</CheckLine>
							</WidgetCard>
						}
					/>

					{/* 03 — Field execution */}
					<Station
						index={3}
						itemKey="2"
						tagCount={3}
						visual={
							<WidgetCard>
								<div className="flex items-center gap-6">
									{/* progress donut (conic, Brand/01) */}
									<div
										className="grid size-24 shrink-0 place-items-center rounded-full"
										style={{
											background:
												"conic-gradient(var(--chart-1) 15%, var(--muted) 0)",
										}}
									>
										<span className="grid size-[4.5rem] place-items-center rounded-full bg-card text-center">
											<span>
												<b className="block text-lg font-bold tabular-nums text-foreground">
													15%
												</b>
												<span className="block text-[10px] text-muted-foreground">
													{v("execution.progress")}
												</span>
											</span>
										</span>
									</div>
									<div className="min-w-0 flex-1 space-y-2.5">
										{(
											[
												["p1", 100],
												["p2", 100],
												["p3", 0],
												["p4", 0],
											] as const
										).map(([key, w]) => (
											<div key={key} className="flex items-center gap-2">
												<span className="w-16 shrink-0 truncate text-xs text-muted-foreground">
													{v(`execution.phases.${key}`)}
												</span>
												<div className="min-w-0 flex-1">
													<ProgressBar value={w} color="bg-chart-4" />
												</div>
												<b className="w-9 shrink-0 text-end text-xs font-bold tabular-nums text-foreground">
													{w}%
												</b>
											</div>
										))}
									</div>
								</div>
								<div className="mt-4 flex items-center justify-between border-t-2 pt-3 text-sm">
									<span className="text-muted-foreground">
										{v("execution.milestones")}
									</span>
									<b className="font-bold tabular-nums text-foreground">2/13</b>
								</div>
								<div className="mt-2 flex items-center gap-2.5">
									<span className="grid size-7 shrink-0 place-items-center rounded-lg bg-success/15 text-sm font-bold text-success">
										✓
									</span>
									<span className="text-sm text-card-foreground">
										{v("execution.report")}
									</span>
								</div>
							</WidgetCard>
						}
					/>

					{/* 04 — Finance & invoicing */}
					<Station
						index={4}
						itemKey="3"
						tagCount={3}
						visual={
							<WidgetCard>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{v("finance.header")}
									</span>
									<b className="font-bold text-foreground">
										{v("finance.contract")}
									</b>
								</div>
								<div className="mt-4 grid grid-cols-3 gap-2">
									{(
										[
											[v("finance.received"), "685,000", "text-chart-4"],
											[v("finance.spent"), "245,000", "text-chart-2"],
											[v("finance.profit"), "2,342,921", "text-success"],
										] as const
									).map(([label, value, color]) => (
										<div key={label} className="rounded-2xl border-2 p-3">
											<p className="text-[11px] text-muted-foreground">
												{label}
											</p>
											<p
												className={`mt-1 text-sm font-bold tabular-nums ${color}`}
											>
												{value}
											</p>
										</div>
									))}
								</div>
								<div className="mt-4 flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{v("finance.budget")}
									</span>
									<b className="font-bold tabular-nums text-foreground">29%</b>
								</div>
								<div className="mt-1.5">
									<ProgressBar value={29} color="bg-chart-1" />
								</div>
								<div className="mt-4 flex items-center gap-2.5">
									<span className="grid size-7 shrink-0 place-items-center rounded-lg bg-success/15 text-sm font-bold text-success">
										✓
									</span>
									<span className="text-sm text-card-foreground">
										{v("finance.invoice")}
									</span>
								</div>
							</WidgetCard>
						}
					/>

					{/* 05 — Owner portal */}
					<Station
						index={5}
						itemKey="6"
						tagCount={3}
						visual={
							<WidgetCard>
								<div className="flex items-center justify-between">
									<span className="text-sm font-bold text-card-foreground">
										{v("owner.project")}
									</span>
									<span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
										<i className="size-1.5 rounded-full bg-success not-italic" />
										{v("owner.live")}
									</span>
								</div>
								<div className="mt-4 space-y-2.5">
									<div className="flex items-center justify-between border-b-2 pb-2.5 text-sm">
										<span className="text-muted-foreground">
											{v("owner.contract")}
										</span>
										<b className="font-bold tabular-nums text-foreground">
											2,109,043 SAR
										</b>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{v("owner.adjusted")}
										</span>
										<b className="font-bold tabular-nums text-success">
											2,342,921 SAR
										</b>
									</div>
								</div>
								<div className="mt-4 flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{v("owner.days")}
									</span>
									<b className="font-bold tabular-nums text-foreground">16%</b>
								</div>
								<div className="mt-1.5">
									<ProgressBar value={16} color="bg-chart-3" />
								</div>
								<div className="mt-4 flex items-center gap-2.5">
									<span className="grid size-7 shrink-0 place-items-center rounded-lg bg-success/15 text-sm font-bold text-success">
										✓
									</span>
									<span className="text-sm text-card-foreground">
										{v("owner.payment")}
									</span>
								</div>
							</WidgetCard>
						}
					/>
				</div>
			</div>
		</section>
	);
}
