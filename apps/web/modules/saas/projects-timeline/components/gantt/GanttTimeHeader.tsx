"use client";

import { HEADER_HEIGHT, GRID_LINE_COLOR, WEEKEND_BG_COLOR } from "./constants";

interface HeaderInterval {
	label: string;
	x: number;
	width: number;
	isWeekend?: boolean;
}

interface GanttTimeHeaderProps {
	primary: HeaderInterval[];
	secondary: HeaderInterval[];
	totalWidth: number;
	totalHeight: number;
	isRtl: boolean;
}

export function GanttTimeHeader({
	primary,
	secondary,
	totalWidth,
	totalHeight,
	isRtl,
}: GanttTimeHeaderProps) {
	const primaryHeight = HEADER_HEIGHT / 2;
	const secondaryHeight = HEADER_HEIGHT / 2;

	return (
		<g>
			{/* Weekend background columns */}
			{secondary
				.filter((s) => s.isWeekend)
				.map((s, i) => (
					<rect
						key={`weekend-${i}`}
						x={s.x}
						y={0}
						width={s.width}
						height={totalHeight}
						fill={WEEKEND_BG_COLOR}
					/>
				))}

			{/* Primary header row */}
			{primary.map((item, i) => (
				<g key={`primary-${i}`}>
					<rect
						x={item.x}
						y={0}
						width={item.width}
						height={primaryHeight}
						fill="transparent"
						stroke={GRID_LINE_COLOR}
						strokeWidth={1}
					/>
					<text
						x={item.x + item.width / 2}
						y={primaryHeight / 2}
						textAnchor="middle"
						dominantBaseline="central"
						className="fill-muted-foreground"
						fontSize={11}
						fontWeight={600}
						direction={isRtl ? "rtl" : "ltr"}
					>
						{item.label}
					</text>
				</g>
			))}

			{/* Secondary header row */}
			{secondary.map((item, i) => (
				<g key={`secondary-${i}`}>
					<rect
						x={item.x}
						y={primaryHeight}
						width={item.width}
						height={secondaryHeight}
						fill="transparent"
						stroke={GRID_LINE_COLOR}
						strokeWidth={0.5}
					/>
					<text
						x={item.x + item.width / 2}
						y={primaryHeight + secondaryHeight / 2}
						textAnchor="middle"
						dominantBaseline="central"
						className="fill-muted-foreground"
						fontSize={10}
						direction={isRtl ? "rtl" : "ltr"}
					>
						{item.label}
					</text>
				</g>
			))}

			{/* Vertical grid lines for secondary intervals */}
			{secondary.map((item, i) => (
				<line
					key={`grid-${i}`}
					x1={item.x}
					y1={HEADER_HEIGHT}
					x2={item.x}
					y2={totalHeight}
					stroke={GRID_LINE_COLOR}
					strokeWidth={0.5}
				/>
			))}
		</g>
	);
}
