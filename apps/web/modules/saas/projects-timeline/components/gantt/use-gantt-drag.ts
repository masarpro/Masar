"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import type { GanttMilestone, DragState } from "./types";

interface UseGanttDragOptions {
	milestones: GanttMilestone[];
	columnWidth: number;
	isRtl: boolean;
	onReschedule: (milestoneId: string, newStart: Date, newEnd: Date) => void;
}

export function useGanttDrag({ milestones, columnWidth, isRtl, onReschedule }: UseGanttDragOptions) {
	const dragRef = useRef<DragState | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const rafRef = useRef<number | null>(null);

	const handleDragStart = useCallback(
		(milestoneId: string, type: "move" | "resize-start" | "resize-end", e: React.MouseEvent) => {
			const milestone = milestones.find((m) => m.id === milestoneId);
			if (!milestone?.plannedStart || !milestone?.plannedEnd) return;

			e.preventDefault();

			const start = typeof milestone.plannedStart === "string"
				? new Date(milestone.plannedStart)
				: milestone.plannedStart;
			const end = typeof milestone.plannedEnd === "string"
				? new Date(milestone.plannedEnd)
				: milestone.plannedEnd;

			dragRef.current = {
				milestoneId,
				type,
				startX: e.clientX,
				originalStart: startOfDay(start),
				originalEnd: startOfDay(end),
				currentDeltaDays: 0,
			};
			setIsDragging(true);
		},
		[milestones],
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
				const deltaDays = Math.round((deltaPx * direction) / columnWidth);

				dragRef.current.currentDeltaDays = deltaDays;
			});
		};

		const handleMouseUp = () => {
			if (!dragRef.current) return;

			const { milestoneId, type, originalStart, originalEnd, currentDeltaDays } = dragRef.current;

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

				onReschedule(milestoneId, newStart, newEnd);
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
	}, [isDragging, columnWidth, isRtl, onReschedule]);

	return {
		isDragging,
		handleDragStart,
	};
}
