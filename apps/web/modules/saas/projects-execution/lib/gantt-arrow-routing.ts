import type { DependencyType, FlatGanttRow } from "./gantt-types";
import { GANTT_ROW_HEIGHT, GANTT_BAR_Y_OFFSET, GANTT_BAR_HEIGHT } from "./gantt-constants";
import { dateToPx } from "./gantt-utils";

const ARROW_GAP = 12;
const CORNER_RADIUS = 4;

interface ArrowEndpoints {
	fromX: number;
	fromY: number;
	toX: number;
	toY: number;
}

/**
 * Compute the SVG path for a dependency arrow between two activities.
 * Uses orthogonal (right-angle) routing with rounded corners.
 * Handles RTL by swapping time-axis edges.
 */
export function computeDependencyPath(
	predecessorStart: Date | null,
	predecessorEnd: Date | null,
	successorStart: Date | null,
	successorEnd: Date | null,
	predecessorRowIndex: number,
	successorRowIndex: number,
	type: DependencyType,
	rangeStart: Date,
	pixelsPerDay: number,
	isRtl: boolean,
	totalWidth: number,
): string | null {
	if (!predecessorStart || !predecessorEnd || !successorStart || !successorEnd) {
		return null;
	}

	const predStartPx = dateToPx(predecessorStart, rangeStart, pixelsPerDay, isRtl, totalWidth);
	const predEndPx = dateToPx(predecessorEnd, rangeStart, pixelsPerDay, isRtl, totalWidth);
	const succStartPx = dateToPx(successorStart, rangeStart, pixelsPerDay, isRtl, totalWidth);
	const succEndPx = dateToPx(successorEnd, rangeStart, pixelsPerDay, isRtl, totalWidth);

	const predLeft = Math.min(predStartPx, predEndPx);
	const predRight = Math.max(predStartPx, predEndPx);
	const succLeft = Math.min(succStartPx, succEndPx);
	const succRight = Math.max(succStartPx, succEndPx);

	const predCenterY = predecessorRowIndex * GANTT_ROW_HEIGHT + GANTT_BAR_Y_OFFSET + GANTT_BAR_HEIGHT / 2;
	const succCenterY = successorRowIndex * GANTT_ROW_HEIGHT + GANTT_BAR_Y_OFFSET + GANTT_BAR_HEIGHT / 2;

	const endpoints = getEndpoints(
		type,
		predLeft,
		predRight,
		succLeft,
		succRight,
		predCenterY,
		succCenterY,
	);

	return buildOrthogonalPath(endpoints, predCenterY < succCenterY);
}

function getEndpoints(
	type: DependencyType,
	predLeft: number,
	predRight: number,
	succLeft: number,
	succRight: number,
	predY: number,
	succY: number,
): ArrowEndpoints {
	switch (type) {
		case "FINISH_TO_START":
			return { fromX: predRight, fromY: predY, toX: succLeft, toY: succY };
		case "START_TO_START":
			return { fromX: predLeft, fromY: predY, toX: succLeft, toY: succY };
		case "FINISH_TO_FINISH":
			return { fromX: predRight, fromY: predY, toX: succRight, toY: succY };
		case "START_TO_FINISH":
			return { fromX: predLeft, fromY: predY, toX: succRight, toY: succY };
	}
}

function buildOrthogonalPath(
	endpoints: ArrowEndpoints,
	goingDown: boolean,
): string {
	const { fromX, fromY, toX, toY } = endpoints;

	// Simple case: direct horizontal then vertical
	const midX = fromX + (toX > fromX ? ARROW_GAP : -ARROW_GAP);
	const r = CORNER_RADIUS;

	// If target is roughly in line horizontally
	if (Math.abs(fromY - toY) < 2) {
		return `M ${fromX} ${fromY} H ${toX}`;
	}

	// Standard L-shape or S-shape routing
	const goingRight = toX > fromX;
	const vertDir = toY > fromY ? 1 : -1;

	// If there's enough horizontal space for a simple L-shape
	if ((goingRight && toX - fromX > ARROW_GAP * 2) || (!goingRight && fromX - toX > ARROW_GAP * 2)) {
		// L-shape: horizontal gap → vertical → horizontal to target
		const junctionX = fromX + (goingRight ? ARROW_GAP : -ARROW_GAP);
		return [
			`M ${fromX} ${fromY}`,
			`H ${junctionX - (goingRight ? r : -r)}`,
			`Q ${junctionX} ${fromY} ${junctionX} ${fromY + vertDir * r}`,
			`V ${toY - vertDir * r}`,
			`Q ${junctionX} ${toY} ${junctionX + (goingRight ? r : -r)} ${toY}`,
			`H ${toX}`,
		].join(" ");
	}

	// S-shape: need to route around
	const halfY = (fromY + toY) / 2;
	const exitX = fromX + (goingRight ? ARROW_GAP : -ARROW_GAP);

	return [
		`M ${fromX} ${fromY}`,
		`H ${exitX}`,
		`V ${halfY}`,
		`H ${toX + (goingRight ? -ARROW_GAP : ARROW_GAP)}`,
		`V ${toY}`,
		`H ${toX}`,
	].join(" ");
}

/**
 * Get the marker ID for the arrowhead based on whether it's critical.
 */
export function getArrowMarkerId(isCritical: boolean): string {
	return isCritical ? "arrowhead-critical" : "arrowhead-normal";
}

/**
 * SVG defs for arrow markers.
 */
export function getArrowMarkerDefs(): string {
	return `
		<marker id="arrowhead-normal" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
			<polygon points="0 0, 8 3, 0 6" fill="#64748b" />
		</marker>
		<marker id="arrowhead-critical" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
			<polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
		</marker>
	`;
}
