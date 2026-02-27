"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import type { GanttDragState, DragType, GanttActivityRow } from "../lib/gantt-types";
import { useGantt } from "./use-gantt-context";

interface UseGanttDragOptions {
	pixelsPerDay: number;
	isRtl: boolean;
	onReschedule: (activityId: string, newStart: Date, newEnd: Date) => void;
}

export function useGanttDrag({
	pixelsPerDay,
	isRtl,
	onReschedule,
}: UseGanttDragOptions) {
	const { state, dispatch } = useGantt();
	const dragRef = useRef<GanttDragState | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const rafRef = useRef<number | null>(null);

	const handleDragStart = useCallback(
		(
			activityId: string,
			type: DragType,
			e: React.MouseEvent,
			activity: GanttActivityRow,
		) => {
			if (!activity.plannedStart || !activity.plannedEnd) return;
			e.preventDefault();
			e.stopPropagation();

			const start =
				typeof activity.plannedStart === "string"
					? new Date(activity.plannedStart)
					: activity.plannedStart;
			const end =
				typeof activity.plannedEnd === "string"
					? new Date(activity.plannedEnd)
					: activity.plannedEnd;

			const dragState: GanttDragState = {
				activityId,
				type,
				startX: e.clientX,
				originalStart: startOfDay(start),
				originalEnd: startOfDay(end),
				currentDeltaDays: 0,
			};

			dragRef.current = dragState;
			dispatch({ type: "SET_DRAG_STATE", dragState });
			setIsDragging(true);
		},
		[dispatch],
	);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!dragRef.current) return;

			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				if (!dragRef.current) return;

				const deltaPx = e.clientX - dragRef.current.startX;
				const direction = isRtl ? -1 : 1;
				const deltaDays = Math.round((deltaPx * direction) / pixelsPerDay);

				dragRef.current.currentDeltaDays = deltaDays;
				dispatch({ type: "UPDATE_DRAG_DELTA", deltaDays });
			});
		};

		const handleMouseUp = () => {
			if (!dragRef.current) return;

			const { activityId, type, originalStart, originalEnd, currentDeltaDays } =
				dragRef.current;

			if (currentDeltaDays !== 0) {
				let newStart = originalStart;
				let newEnd = originalEnd;

				switch (type) {
					case "move":
						newStart = addDays(originalStart, currentDeltaDays);
						newEnd = addDays(originalEnd, currentDeltaDays);
						break;
					case "resize-start":
						newStart = addDays(originalStart, currentDeltaDays);
						if (newStart >= newEnd) newStart = addDays(newEnd, -1);
						break;
					case "resize-end":
						newEnd = addDays(originalEnd, currentDeltaDays);
						if (newEnd <= newStart) newEnd = addDays(newStart, 1);
						break;
				}

				dispatch({
					type: "OPTIMISTIC_MOVE_ACTIVITY",
					activityId,
					newStart,
					newEnd,
				});
				onReschedule(activityId, newStart, newEnd);
			} else {
				dispatch({ type: "SET_DRAG_STATE", dragState: null });
			}

			dragRef.current = null;
			setIsDragging(false);
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isDragging, pixelsPerDay, isRtl, onReschedule, dispatch]);

	return {
		isDragging,
		handleDragStart,
		dragState: state.dragState,
	};
}
