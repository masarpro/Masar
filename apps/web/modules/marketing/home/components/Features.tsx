"use client";

import { useTranslations } from "next-intl";

/**
 * Feature "stations" — the journey line from the hero continues here:
 * a dashed spine with numbered nodes, each station pairing copy with a
 * hand-crafted mini mockup of the real product screen.
 *
 * Station order follows the project journey (and the hero path strip):
 * pricing → contracts → execution → finance → owner portal.
 * The dashboard feature sits above them all as the "watchtower" card.
 */

function StationCopy({
	itemKey,
	tagCount,
	isNew,
}: {
	itemKey: string;
	tagCount: number;
	isNew?: boolean;
}) {
	const t = useTranslations();
	return (
		<div className="mas-station-copy">
			<span className="mas-kicker">
				{t(`features.items.${itemKey}.kicker`)}
				{isNew && (
					<span
						className="not-italic rounded-full px-2.5 py-0.5 text-[11px] font-bold ms-2"
						style={{
							background: "var(--mas-yellow-bg)",
							color: "var(--mas-yellow)",
						}}
					>
						{t("features.newBadge")}
					</span>
				)}
			</span>
			<h3 className="mt-1">{t(`features.items.${itemKey}.title`)}</h3>
			<p>{t(`features.items.${itemKey}.description`)}</p>
			<div className="mas-tags">
				{Array.from({ length: tagCount }, (_, i) => (
					<span key={`${itemKey}-${i + 1}`}>
						{t(`features.items.${itemKey}.sub.${i + 1}`)}
					</span>
				))}
			</div>
		</div>
	);
}

export function Features() {
	const t = useTranslations();
	const v = useTranslations("landingVisuals");

	return (
		<section
			id="features"
			className="scroll-mt-16 py-24 md:py-32 px-6"
			style={{ background: "var(--mas-bg)" }}
		>
			<div className="max-w-[1180px] mx-auto">
				{/* Header */}
				<div className="mas-sec-head mas-rv max-w-[660px] mx-auto text-center mb-12 md:mb-16">
					<span className="mas-dim">{t("features.label")}</span>
					<h2>{t("features.title")}</h2>
					<p>{t("features.description")}</p>
				</div>

				{/* Watchtower — the dashboard above all stations */}
				<div className="mas-tower mas-rv mb-10 md:mb-14">
					<div>
						<span className="mas-kicker">
							{t("features.items.1.kicker")}
						</span>
						<h3
							className="text-[clamp(1.25rem,0.8vw+1rem,1.5rem)] font-extrabold mt-1 mb-2"
							style={{ color: "var(--mas-ink)" }}
						>
							{t("features.items.1.title")}
						</h3>
						<p
							className="mb-4 leading-[1.8]"
							style={{ color: "var(--mas-muted)" }}
						>
							{t("features.items.1.description")}
						</p>
						<div className="mas-tags">
							{([1, 2, 3] as const).map((i) => (
								<span key={i}>
									{t(`features.items.1.sub.${i}`)}
								</span>
							))}
						</div>
					</div>
					<div aria-hidden="true">
						<div className="mas-quad mb-3.5">
							<div className="mas-q blue">
								<b>2</b>
								<span>{v("tower.active")}</span>
							</div>
							<div className="mas-q green">
								<b>5</b>
								<span>{v("tower.done")}</span>
							</div>
							<div className="mas-q yellow">
								<b>0</b>
								<span>{v("tower.pending")}</span>
							</div>
							<div className="mas-q red">
								<b>0</b>
								<span>{v("tower.issues")}</span>
							</div>
						</div>
						<div className="mas-mini-label mb-1.5">
							<span>{v("tower.overall")}</span>
							<b>74%</b>
						</div>
						<div className="mas-bar-wrap">
							<span
								className="mas-bar"
								style={{ "--w": "74%" } as React.CSSProperties}
							/>
						</div>
					</div>
				</div>

				{/* Stations */}
				<div className="mas-stations">
					{/* 01 — Pricing & quantities */}
					<article className="mas-station" id="st-1">
						<span className="mas-station-node">01</span>
						<div className="mas-station-grid">
							<StationCopy itemKey="4" tagCount={4} isNew />
							<div
								className="mas-station-visual"
								aria-hidden="true"
							>
								<div className="mas-proj-head">
									<span className="mas-pj-t">
										{v("pricing.project")}
									</span>
									<span className="mas-chip-draft">
										{v("pricing.draft")}
									</span>
								</div>
								<div className="mas-flow">
									<div className="mas-fstep done">
										<i>✓</i>
										<span>{v("pricing.steps.qty")}</span>
										<em>{v("pricing.approved")}</em>
									</div>
									<span className="mas-fline" />
									<div className="mas-fstep done">
										<i>✓</i>
										<span>{v("pricing.steps.specs")}</span>
										<em>{v("pricing.approved")}</em>
									</div>
									<span className="mas-fline" />
									<div className="mas-fstep done">
										<i>✓</i>
										<span>{v("pricing.steps.cost")}</span>
										<em>{v("pricing.approved")}</em>
									</div>
									<span className="mas-fline" />
									<div className="mas-fstep act">
										<i>$</i>
										<span>{v("pricing.steps.price")}</span>
										<em>{v("pricing.wip")}</em>
									</div>
								</div>
								<div className="mas-fin3">
									<div className="mas-fc">
										<span>{v("pricing.concrete")}</span>
										<b className="mas-c-blue">
											1,551.58{" "}
											<i>{v("pricing.concreteUnit")}</i>
										</b>
									</div>
									<div className="mas-fc">
										<span>{v("pricing.steel")}</span>
										<b className="mas-c-red">
											137.39{" "}
											<i>{v("pricing.steelUnit")}</i>
										</b>
									</div>
									<div className="mas-fc">
										<span>{v("pricing.block")}</span>
										<b className="mas-c-green">
											115,500{" "}
											<i>{v("pricing.blockUnit")}</i>
										</b>
									</div>
								</div>
								<div className="mas-badge-line">
									<span className="mas-chip-red">
										{v("pricing.convert")}
									</span>
									<span
										className="text-[12px]"
										style={{ color: "var(--mas-muted)" }}
									>
										{v("pricing.convertHint")}
									</span>
								</div>
							</div>
						</div>
					</article>

					{/* 02 — Contracts & subcontractors */}
					<article className="mas-station" id="st-2">
						<span className="mas-station-node">02</span>
						<div className="mas-station-grid">
							<StationCopy itemKey="5" tagCount={3} />
							<div
								className="mas-station-visual"
								aria-hidden="true"
							>
								<div className="mas-badge-line">
									<span className="ok">✓</span>{" "}
									{v("contracts.l1")}
								</div>
								<div className="mas-badge-line">
									<span className="ok">✓</span>{" "}
									{v("contracts.l2")}
								</div>
								<div className="mas-badge-line">
									<span className="ok">✓</span>{" "}
									{v("contracts.l3")}
								</div>
							</div>
						</div>
					</article>

					{/* 03 — Field execution */}
					<article className="mas-station" id="st-3">
						<span className="mas-station-node">03</span>
						<div className="mas-station-grid">
							<StationCopy itemKey="2" tagCount={3} />
							<div
								className="mas-station-visual"
								aria-hidden="true"
							>
								<div className="mas-ringrow">
									<div
										className="mas-ring"
										style={
											{ "--p": 15 } as React.CSSProperties
										}
									>
										<span className="mas-ring-in">
											<b>15%</b>
											<span>
												{v("execution.progress")}
											</span>
										</span>
									</div>
									<div className="mas-phases">
										{(
											[
												["p1", "100%"],
												["p2", "100%"],
												["p3", "0%"],
												["p4", "0%"],
											] as const
										).map(([key, w]) => (
											<div className="mas-ph" key={key}>
												<span>
													{v(
														`execution.phases.${key}`,
													)}
												</span>
												<span className="mas-pb">
													<i
														style={
															{
																"--w": w,
															} as React.CSSProperties
														}
													/>
												</span>
												<b>{w}</b>
											</div>
										))}
									</div>
								</div>
								<div className="mas-mini-label">
									<span>{v("execution.milestones")}</span>
									<b>2/13</b>
								</div>
								<div className="mas-badge-line">
									<span className="ok">✓</span>{" "}
									{v("execution.report")}
								</div>
							</div>
						</div>
					</article>

					{/* 04 — Finance & invoicing */}
					<article className="mas-station" id="st-4">
						<span className="mas-station-node">04</span>
						<div className="mas-station-grid">
							<StationCopy itemKey="3" tagCount={3} />
							<div
								className="mas-station-visual"
								aria-hidden="true"
							>
								<div className="mas-mini-label">
									<span>{v("finance.header")}</span>
									<b>{v("finance.contract")}</b>
								</div>
								<div className="mas-fin3">
									<div className="mas-fc">
										<span>{v("finance.received")}</span>
										<b className="mas-c-blue">685,000</b>
									</div>
									<div className="mas-fc">
										<span>{v("finance.spent")}</span>
										<b className="mas-c-red">245,000</b>
									</div>
									<div className="mas-fc">
										<span>{v("finance.profit")}</span>
										<b className="mas-c-green">2,342,921</b>
									</div>
								</div>
								<div className="mas-mini-label">
									<span>{v("finance.budget")}</span>
									<b>29%</b>
								</div>
								<div className="mas-bar-wrap">
									<span
										className="mas-bar"
										style={
											{
												"--w": "29%",
											} as React.CSSProperties
										}
									/>
								</div>
								<div className="mas-badge-line">
									<span className="ok">✓</span>{" "}
									{v("finance.invoice")}
								</div>
							</div>
						</div>
					</article>

					{/* 05 — Owner portal */}
					<article className="mas-station" id="st-5">
						<span className="mas-station-node">05</span>
						<div className="mas-station-grid">
							<StationCopy itemKey="6" tagCount={3} />
							<div
								className="mas-station-visual"
								aria-hidden="true"
							>
								<div className="mas-proj-head">
									<span className="mas-pj-t">
										{v("owner.project")}
									</span>
									<span className="mas-chip-live">
										{v("owner.live")}
									</span>
								</div>
								<div className="mas-mini-row">
									<span>{v("owner.contract")}</span>
									<span className="mas-num">
										2,109,043 SAR
									</span>
								</div>
								<div className="mas-mini-row">
									<span>{v("owner.adjusted")}</span>
									<span className="mas-num pos">
										2,342,921 SAR
									</span>
								</div>
								<div className="mas-mini-label">
									<span>{v("owner.days")}</span>
									<b>16%</b>
								</div>
								<div className="mas-bar-wrap">
									<span
										className="mas-bar"
										style={
											{
												"--w": "16%",
											} as React.CSSProperties
										}
									/>
								</div>
								<div className="mas-badge-line">
									<span className="ok">✓</span>{" "}
									{v("owner.payment")}
								</div>
							</div>
						</div>
					</article>
				</div>
			</div>
		</section>
	);
}
