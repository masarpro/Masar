"use client";

import { DOMAIN_STYLES, type Domain } from "../types";

interface Props {
	selected: Set<Domain>;
	onToggle: (domain: Domain) => void;
	onClear: () => void;
	counts: Record<Domain, number>;
}

const DOMAINS: Domain[] = ["FINISHING", "MEP", "EXTERIOR", "SPECIAL"];

export function DomainFilterChips({
	selected,
	onToggle,
	onClear,
	counts,
}: Props) {
	const totalCount = DOMAINS.reduce((s, d) => s + (counts[d] ?? 0), 0);
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

			{DOMAINS.map((d) => {
				const style = DOMAIN_STYLES[d];
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
