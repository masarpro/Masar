"use client";

import { memo, useMemo } from "react";
import { useLocale } from "next-intl";
import { useGantt } from "../../../hooks/use-gantt-context";
import { getTimeHeaderIntervals } from "../../../lib/gantt-utils";
import { GANTT_HEADER_HEIGHT, WEEKEND_BG_COLOR } from "../../../lib/gantt-constants";

interface GanttTimeHeaderProps {
	totalWidth: number;
	isRtl: boolean;
}

export const GanttTimeHeader = memo(function GanttTimeHeader({
	totalWidth,
	isRtl,
}: GanttTimeHeaderProps) {
	const { state } = useGantt();
	const locale = useLocale();

	const intervals = useMemo(
		() => getTimeHeaderIntervals(state.dateRange, state.zoom, locale),
		[state.dateRange, state.zoom, locale],
	);

	const halfHeight = GANTT_HEADER_HEIGHT / 2;

	return (
		<g>
			{/* Background */}
			<rect
				x={0}
				y={0}
				width={totalWidth}
				height={GANTT_HEADER_HEIGHT}
				className="fill-muted/50"
			/>

			{/* Primary header (month/week labels) */}
			{intervals.primary.map((interval, i) => {
				const x = isRtl ? totalWidth - interval.x - interval.width : interval.x;
				return (
					<g key={`p-${i}`}>
						<rect
							x={x}
							y={0}
							width={interval.width}
							height={halfHeight}
							fill="none"
							stroke="currentColor"
							strokeOpacity={0.1}
						/>
						<text
							x={x + interval.width / 2}
							y={halfHeight / 2 + 4}
							textAnchor="middle"
							className="fill-muted-foreground text-[10px]"
						>
							{interval.label}
						</text>
					</g>
				);
			})}

			{/* Secondary header (day/week labels) */}
			{intervals.secondary.map((interval, i) => {
				const x = isRtl ? totalWidth - interval.x - interval.width : interval.x;
				return (
					<g key={`s-${i}`}>
						{interval.isWeekend && (
							<rect
								x={x}
								y={halfHeight}
								width={interval.width}
								height={halfHeight}
								fill={WEEKEND_BG_COLOR}
							/>
						)}
						<rect
							x={x}
							y={halfHeight}
							width={interval.width}
							height={halfHeight}
							fill="none"
							stroke="currentColor"
							strokeOpacity={0.05}
						/>
						<text
							x={x + interval.width / 2}
							y={halfHeight + halfHeight / 2 + 4}
							textAnchor="middle"
							className={`text-[10px] ${interval.isToday ? "fill-red-500 font-bold" : "fill-muted-foreground"}`}
						>
							{interval.label}
						</text>
					</g>
				);
			})}

			{/* Bottom border */}
			<line
				x1={0}
				y1={GANTT_HEADER_HEIGHT}
				x2={totalWidth}
				y2={GANTT_HEADER_HEIGHT}
				stroke="currentColor"
				strokeOpacity={0.15}
			/>
		</g>
	);
});
