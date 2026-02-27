"use client";

import {
	createContext,
	useContext,
	useReducer,
	type Dispatch,
} from "react";
import type {
	GanttState,
	GanttAction,
	GanttMilestoneRow,
	FlatGanttRow,
} from "../lib/gantt-types";
import { flattenRows } from "../lib/gantt-utils";
import { DEFAULT_SPLIT_RATIO } from "../lib/gantt-constants";

// ─── Initial State ───

export const initialGanttState: GanttState = {
	zoom: "week",
	dateRange: { start: new Date(), end: new Date(), totalDays: 1 },
	rows: [],
	flatRows: [],
	dependencies: [],
	criticalActivityIds: new Set(),
	collapsedMilestones: new Set(),
	selectedActivityId: null,
	hoveredActivityId: null,
	dragState: null,
	dependencyDragState: null,
	splitPaneRatio: DEFAULT_SPLIT_RATIO,
	showBaseline: false,
	activeBaselineId: null,
	baselineData: null,
	scrollTop: 0,
	scrollLeft: 0,
};

// ─── Reducer ───

function recomputeFlat(
	rows: GanttMilestoneRow[],
	collapsed: Set<string>,
): FlatGanttRow[] {
	return flattenRows(rows, collapsed);
}

function updateActivityInRows(
	rows: GanttMilestoneRow[],
	activityId: string,
	newStart: Date,
	newEnd: Date,
): GanttMilestoneRow[] {
	return rows.map((m) => ({
		...m,
		children: m.children.map((a) =>
			a.id === activityId
				? { ...a, plannedStart: newStart, plannedEnd: newEnd }
				: a,
		),
	}));
}

export function ganttReducer(
	state: GanttState,
	action: GanttAction,
): GanttState {
	switch (action.type) {
		case "SET_ZOOM":
			return { ...state, zoom: action.zoom };

		case "SET_DATE_RANGE":
			return { ...state, dateRange: action.dateRange };

		case "SET_ROWS": {
			const flatRows = recomputeFlat(action.rows, state.collapsedMilestones);
			return { ...state, rows: action.rows, flatRows };
		}

		case "SET_DEPENDENCIES":
			return { ...state, dependencies: action.dependencies };

		case "SET_CRITICAL_IDS":
			return { ...state, criticalActivityIds: action.ids };

		case "TOGGLE_COLLAPSE": {
			const next = new Set(state.collapsedMilestones);
			if (next.has(action.milestoneId)) {
				next.delete(action.milestoneId);
			} else {
				next.add(action.milestoneId);
			}
			const flatRows = recomputeFlat(state.rows, next);
			return { ...state, collapsedMilestones: next, flatRows };
		}

		case "EXPAND_ALL": {
			const flatRows = recomputeFlat(state.rows, new Set());
			return { ...state, collapsedMilestones: new Set(), flatRows };
		}

		case "COLLAPSE_ALL": {
			const allIds = new Set(state.rows.map((r) => r.id));
			const flatRows = recomputeFlat(state.rows, allIds);
			return { ...state, collapsedMilestones: allIds, flatRows };
		}

		case "SELECT_ACTIVITY":
			return { ...state, selectedActivityId: action.activityId };

		case "HOVER_ACTIVITY":
			return { ...state, hoveredActivityId: action.activityId };

		case "SET_DRAG_STATE":
			return { ...state, dragState: action.dragState };

		case "UPDATE_DRAG_DELTA":
			if (!state.dragState) return state;
			return {
				...state,
				dragState: { ...state.dragState, currentDeltaDays: action.deltaDays },
			};

		case "SET_DEPENDENCY_DRAG":
			return { ...state, dependencyDragState: action.state };

		case "UPDATE_DEPENDENCY_DRAG_POS":
			if (!state.dependencyDragState) return state;
			return {
				...state,
				dependencyDragState: {
					...state.dependencyDragState,
					currentX: action.x,
					currentY: action.y,
				},
			};

		case "SET_DEPENDENCY_DRAG_TARGET":
			if (!state.dependencyDragState) return state;
			return {
				...state,
				dependencyDragState: {
					...state.dependencyDragState,
					targetActivityId: action.targetActivityId,
					targetAnchor: action.targetAnchor,
				},
			};

		case "SET_SPLIT_RATIO":
			return { ...state, splitPaneRatio: action.ratio };

		case "SET_SHOW_BASELINE":
			return { ...state, showBaseline: action.show };

		case "SET_BASELINE_DATA":
			return {
				...state,
				baselineData: action.data,
				activeBaselineId: action.id,
			};

		case "SET_SCROLL_TOP":
			return { ...state, scrollTop: action.scrollTop };

		case "SET_SCROLL_LEFT":
			return { ...state, scrollLeft: action.scrollLeft };

		case "OPTIMISTIC_MOVE_ACTIVITY":
		case "OPTIMISTIC_RESIZE_ACTIVITY": {
			const newRows = updateActivityInRows(
				state.rows,
				action.activityId,
				action.newStart,
				action.newEnd,
			);
			const flatRows = recomputeFlat(newRows, state.collapsedMilestones);
			return { ...state, rows: newRows, flatRows, dragState: null };
		}

		default:
			return state;
	}
}

// ─── Context ───

export interface GanttContextValue {
	state: GanttState;
	dispatch: Dispatch<GanttAction>;
}

export const GanttContext = createContext<GanttContextValue | null>(null);

export function useGantt(): GanttContextValue {
	const ctx = useContext(GanttContext);
	if (!ctx) {
		throw new Error("useGantt must be used within GanttContext.Provider");
	}
	return ctx;
}

export function useGanttReducer() {
	return useReducer(ganttReducer, initialGanttState);
}
