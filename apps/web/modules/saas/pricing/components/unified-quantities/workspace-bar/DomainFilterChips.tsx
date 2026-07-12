"use client";

import { DOMAIN_STYLES, type Domain } from "../types";

interface Props {
	selected: Set<string>;
	onToggle: (domain: string) => void;
	onClear: () => void;
	counts: Record<string, number>;
	/** True total item count — the "all" chip must never undercount. */
	totalCount: number;
}

const DOMAINS: Domain[] = ["FINISHING", "MEP", "EXTERIOR", "SPECIAL"];

const FALLBACK_STYLE = {
	color: "#64748b",
	bgColor: "#64748b20",
};

export function DomainFilterChips({
	selected,
	onToggle,
	onClear,
	counts,
	totalCount,
}: Props) {
	// Canonical order first, then any extra domain present on the items —
	// a chip always exists for every domain that actually has items.
	const chipDomains: string[] = [
		...DOMAINS,
		...Object.keys(counts).filter(
			(d) => !(DOMAINS as string[]).includes(d),
		),
	];
	const isAll = selected.size === 0;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<button
				type="button"
				onClick={onClear}
				className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
					isAll
						? "border-foreground bg-foreground text-background"
						: "border-border bg-background hover:bg-muted"
				}`}
			>
				<span>الكل</span>
				<span className="rounded-full bg-background/30 px-1.5 py-px text-[10px] tabular-nums dark:bg-foreground/20">
					{totalCount}
				</span>
			</button>

			{chipDomains.map((d) => {
				const known = DOMAIN_STYLES[d as Domain];
				const style = {
					color: known?.color ?? FALLBACK_STYLE.color,
					bgColor: known?.bgColor ?? FALLBACK_STYLE.bgColor,
					label: known?.label ?? d,
				};
				const active = selected.has(d);
				const count = counts[d] ?? 0;
				if (count === 0 && !active) return null;
				return (
					<button
						key={d}
						type="button"
						onClick={() => onToggle(d)}
						className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition"
						style={
							active
								? {
										borderColor: style.color,
										backgroundColor: style.color,
										color: "#fff",
									}
								: {
										borderColor: style.color + "40",
										backgroundColor: style.bgColor,
										color: style.color,
									}
						}
					>
						<span>{style.label}</span>
						<span
							className="rounded-full px-1.5 py-px text-[10px] tabular-nums"
							style={{
								backgroundColor: active
									? "rgba(255,255,255,0.25)"
									: "rgba(0,0,0,0.06)",
							}}
						>
							{count}
						</span>
					</button>
				);
			})}
		</div>
	);
}
