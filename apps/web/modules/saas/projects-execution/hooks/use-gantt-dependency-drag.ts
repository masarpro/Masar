"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import type { DependencyType, DependencyDragState } from "../lib/gantt-types";
import { useGantt } from "./use-gantt-context";

interface UseGanttDependencyDragOptions {
	onCreateDependency: (
		predecessorId: string,
		successorId: string,
		type: DependencyType,
	) => void;
}

export function useGanttDependencyDrag({
	onCreateDependency,
}: UseGanttDependencyDragOptions) {
	const { state, dispatch } = useGantt();
	const [isDragging, setIsDragging] = useState(false);
	const dragRef = useRef<DependencyDragState | null>(null);

	const handleAnchorDragStart = useCallback(
		(
			activityId: string,
			anchor: "start" | "end",
			e: React.MouseEvent,
		) => {
			e.preventDefault();
			e.stopPropagation();

			const dragState: DependencyDragState = {
				sourceActivityId: activityId,
				sourceAnchor: anchor,
				currentX: e.clientX,
				currentY: e.clientY,
				targetActivityId: null,
				targetAnchor: null,
			};

			dragRef.current = dragState;
			dispatch({ type: "SET_DEPENDENCY_DRAG", state: dragState });
			setIsDragging(true);
		},
		[dispatch],
	);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!dragRef.current) return;
			dragRef.current.currentX = e.clientX;
			dragRef.current.currentY = e.clientY;
			dispatch({
				type: "UPDATE_DEPENDENCY_DRAG_POS",
				x: e.clientX,
				y: e.clientY,
			});
		};

		const handleMouseUp = () => {
			if (!dragRef.current) return;

			const { sourceActivityId, sourceAnchor, targetActivityId, targetAnchor } =
				dragRef.current;

			if (targetActivityId && targetAnchor && targetActivityId !== sourceActivityId) {
				// Infer dependency type from anchor positions
				const type = inferDependencyType(sourceAnchor, targetAnchor);
				onCreateDependency(sourceActivityId, targetActivityId, type);
			}

			dragRef.current = null;
			dispatch({ type: "SET_DEPENDENCY_DRAG", state: null });
			setIsDragging(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, onCreateDependency, dispatch]);

	const setTarget = useCallback(
		(activityId: string | null, anchor: "start" | "end" | null) => {
			if (!dragRef.current) return;
			dragRef.current.targetActivityId = activityId;
			dragRef.current.targetAnchor = anchor;
			dispatch({
				type: "SET_DEPENDENCY_DRAG_TARGET",
				targetActivityId: activityId,
				targetAnchor: anchor,
			});
		},
		[dispatch],
	);

	return {
		isDragging,
		handleAnchorDragStart,
		setTarget,
		dependencyDragState: state.dependencyDragState,
	};
}

function inferDependencyType(
	sourceAnchor: "start" | "end",
	targetAnchor: "start" | "end",
): DependencyType {
	if (sourceAnchor === "end" && targetAnchor === "start")
		return "FINISH_TO_START";
	if (sourceAnchor === "start" && targetAnchor === "start")
		return "START_TO_START";
	if (sourceAnchor === "end" && targetAnchor === "end")
		return "FINISH_TO_FINISH";
	return "START_TO_FINISH";
}
