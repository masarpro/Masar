"use client";

import { useEffect } from "react";
import { useGantt } from "./use-gantt-context";

interface UseGanttKeyboardOptions {
	onDeleteActivity?: (activityId: string) => void;
	onDeleteDependency?: (dependencyId: string) => void;
}

export function useGanttKeyboard({
	onDeleteActivity,
	onDeleteDependency,
}: UseGanttKeyboardOptions = {}) {
	const { state, dispatch } = useGantt();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Escape: cancel drag or deselect
			if (e.key === "Escape") {
				if (state.dragState) {
					dispatch({ type: "SET_DRAG_STATE", dragState: null });
					return;
				}
				if (state.dependencyDragState) {
					dispatch({ type: "SET_DEPENDENCY_DRAG", state: null });
					return;
				}
				if (state.selectedActivityId) {
					dispatch({ type: "SELECT_ACTIVITY", activityId: null });
					return;
				}
			}

			// Delete: remove selected activity or dependency
			if (e.key === "Delete" && state.selectedActivityId) {
				onDeleteActivity?.(state.selectedActivityId);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		state.dragState,
		state.dependencyDragState,
		state.selectedActivityId,
		dispatch,
		onDeleteActivity,
		onDeleteDependency,
	]);
}
