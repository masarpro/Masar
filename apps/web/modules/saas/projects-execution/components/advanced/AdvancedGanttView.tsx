"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	GanttContext,
	useGanttReducer,
} from "../../hooks/use-gantt-context";
import { useGanttScrollSync } from "../../hooks/use-gantt-scroll-sync";
import { useGanttVirtualization } from "../../hooks/use-gantt-virtualization";
import { useGanttDrag } from "../../hooks/use-gantt-drag";
import { useGanttDependencyDrag } from "../../hooks/use-gantt-dependency-drag";
import { useGanttKeyboard } from "../../hooks/use-gantt-keyboard";
import { computeGanttDateRange } from "../../lib/gantt-utils";
import { ZOOM_CONFIGS } from "../../lib/gantt-constants";
import type {
	GanttMilestoneRow,
	GanttActivityRow,
	GanttDependency,
	DependencyType,
	BaselineSnapshot,
} from "../../lib/gantt-types";
import { GanttToolbar } from "./GanttToolbar";
import { GanttSplitPane } from "./GanttSplitPane";
import { WbsTable } from "./table/WbsTable";
import { GanttChartArea } from "./chart/GanttChartArea";
import { ActivityDetailSheet } from "./panels/ActivityDetailSheet";
import { CalendarSettingsDialog } from "./panels/CalendarSettingsDialog";
import { BaselineManagementDialog } from "./panels/BaselineManagementDialog";
import { MobileGanttFallback } from "./MobileGanttFallback";

interface AdvancedGanttViewProps {
	projectId: string;
}

export function AdvancedGanttView({ projectId }: AdvancedGanttViewProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const [state, dispatch] = useGanttReducer();
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [baselineOpen, setBaselineOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Check mobile
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	// ─── Data Fetching ───

	const milestonesQueryKey = ["project-timeline", organizationId, projectId];
	const activitiesQueryKey = [
		"project-execution-activities-all",
		organizationId,
		projectId,
	];
	const dependenciesQueryKey = [
		"project-execution-dependencies",
		organizationId,
		projectId,
	];
	const criticalPathQueryKey = [
		"project-execution-critical-path",
		organizationId,
		projectId,
	];
	const calendarQueryKey = [
		"project-execution-calendar",
		organizationId,
		projectId,
	];
	const baselinesQueryKey = [
		"project-execution-baselines",
		organizationId,
		projectId,
	];

	const { data: milestonesData } = useQuery({
		queryKey: milestonesQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectTimeline.listMilestones({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: activitiesData } = useQuery({
		queryKey: activitiesQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.listActivities({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: dependenciesData } = useQuery({
		queryKey: dependenciesQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.listDependencies({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: criticalPathData } = useQuery({
		queryKey: criticalPathQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.getCriticalPath({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: calendarData } = useQuery({
		queryKey: calendarQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.getCalendar({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: baselinesData } = useQuery({
		queryKey: baselinesQueryKey,
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.listBaselines({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	// ─── Transform Data into GanttRows ───

	useEffect(() => {
		if (!milestonesData?.milestones || !activitiesData?.activities) return;

		const milestones = milestonesData.milestones as any[];
		const activities = activitiesData.activities as any[];

		// Group activities by milestone
		const actByMilestone = new Map<string, any[]>();
		for (const act of activities) {
			const list = actByMilestone.get(act.milestoneId) ?? [];
			list.push(act);
			actByMilestone.set(act.milestoneId, list);
		}

		const rows: GanttMilestoneRow[] = milestones.map((m) => {
			const milestoneActivities = actByMilestone.get(m.id) ?? [];
			const children: GanttActivityRow[] = milestoneActivities
				.sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
				.map((a: any) => ({
					type: "activity" as const,
					id: a.id,
					milestoneId: a.milestoneId,
					title: a.title,
					wbsCode: a.wbsCode ?? null,
					plannedStart: a.plannedStart ? new Date(a.plannedStart) : null,
					plannedEnd: a.plannedEnd ? new Date(a.plannedEnd) : null,
					duration: a.duration ?? null,
					actualStart: a.actualStart ? new Date(a.actualStart) : null,
					actualEnd: a.actualEnd ? new Date(a.actualEnd) : null,
					status: a.status ?? "NOT_STARTED",
					progress: a.progress ?? 0,
					isCritical: a.isCritical ?? false,
					orderIndex: a.orderIndex ?? 0,
					assignee: a.assignee ?? null,
				}));

			return {
				type: "milestone" as const,
				id: m.id,
				title: m.title,
				orderIndex: m.orderIndex ?? 0,
				plannedStart: m.plannedStart ? new Date(m.plannedStart) : null,
				plannedEnd: m.plannedEnd ? new Date(m.plannedEnd) : null,
				actualStart: m.actualStart ? new Date(m.actualStart) : null,
				actualEnd: m.actualEnd ? new Date(m.actualEnd) : null,
				status: m.status ?? "PLANNED",
				progress: m.progress ?? 0,
				isCritical: m.isCritical ?? false,
				children,
			};
		});

		dispatch({ type: "SET_ROWS", rows });

		// Compute date range
		const dateRange = computeGanttDateRange(rows);
		dispatch({ type: "SET_DATE_RANGE", dateRange });
	}, [milestonesData, activitiesData, dispatch]);

	// Dependencies
	useEffect(() => {
		if (!dependenciesData?.dependencies) return;
		const deps: GanttDependency[] = (dependenciesData.dependencies as any[]).map(
			(d) => ({
				id: d.id,
				predecessorId: d.predecessorId,
				successorId: d.successorId,
				type: d.type,
				lag: d.lag ?? 0,
			}),
		);
		dispatch({ type: "SET_DEPENDENCIES", dependencies: deps });
	}, [dependenciesData, dispatch]);

	// Critical path
	useEffect(() => {
		if (!criticalPathData) return;
		const data = criticalPathData as any;
		const criticalIds: string[] = data.criticalActivities ?? [];
		dispatch({ type: "SET_CRITICAL_IDS", ids: new Set(criticalIds) });
	}, [criticalPathData, dispatch]);

	// ─── Mutations ───

	const invalidateAll = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: milestonesQueryKey });
		queryClient.invalidateQueries({ queryKey: activitiesQueryKey });
		queryClient.invalidateQueries({ queryKey: dependenciesQueryKey });
		queryClient.invalidateQueries({ queryKey: criticalPathQueryKey });
	}, [queryClient, milestonesQueryKey, activitiesQueryKey, dependenciesQueryKey, criticalPathQueryKey]);

	const updateActivityMutation = useMutation({
		mutationFn: async (params: {
			activityId: string;
			plannedStart: string;
			plannedEnd: string;
		}) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.updateActivity({
				organizationId,
				projectId,
				activityId: params.activityId,
				plannedStart: params.plannedStart,
				plannedEnd: params.plannedEnd,
			});
		},
		onSuccess: () => {
			invalidateAll();
			toast.success(t("execution.advanced.notifications.activityMoved"));
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const createDependencyMutation = useMutation({
		mutationFn: async (params: {
			predecessorId: string;
			successorId: string;
			type: DependencyType;
		}) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.createDependency({
				organizationId,
				projectId,
				predecessorId: params.predecessorId,
				successorId: params.successorId,
				dependencyType: params.type,
				lagDays: 0,
			});
		},
		onSuccess: () => {
			invalidateAll();
			toast.success(t("execution.advanced.notifications.dependencyCreated"));
		},
		onError: (err: Error) => {
			toast.error(
				err.message.includes("cycle")
					? t("execution.advanced.notifications.dependencyCycleError")
					: err.message,
			);
		},
	});

	const deleteDependencyMutation = useMutation({
		mutationFn: async (dependencyId: string) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.deleteDependency({
				organizationId,
				projectId,
				dependencyId,
			});
		},
		onSuccess: () => {
			invalidateAll();
			toast.success(t("execution.advanced.notifications.dependencyDeleted"));
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const upsertCalendarMutation = useMutation({
		mutationFn: async (params: {
			workDays: number[];
			hoursPerDay: number;
		}) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.upsertCalendar({
				organizationId,
				projectId,
				workDays: params.workDays,
				defaultHoursPerDay: params.hoursPerDay,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: calendarQueryKey });
			toast.success(t("execution.advanced.notifications.calendarSaved"));
			setCalendarOpen(false);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const createBaselineMutation = useMutation({
		mutationFn: async (name: string) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.createBaseline({
				organizationId,
				projectId,
				name,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: baselinesQueryKey });
			toast.success(t("execution.advanced.notifications.baselineCreated"));
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const activateBaselineMutation = useMutation({
		mutationFn: async (baselineId: string) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.setActiveBaseline({
				organizationId,
				projectId,
				baselineId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: baselinesQueryKey });
			toast.success(t("execution.advanced.notifications.baselineActivated"));
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteBaselineMutation = useMutation({
		mutationFn: async (baselineId: string) => {
			if (!organizationId) throw new Error("No org");
			return apiClient.projectExecution.deleteBaseline({
				organizationId,
				projectId,
				baselineId,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: baselinesQueryKey });
			toast.success(t("execution.advanced.notifications.baselineDeleted"));
		},
		onError: (err: Error) => toast.error(err.message),
	});

	// ─── RTL detection ───
	const isRtl =
		typeof document !== "undefined" &&
		(document.documentElement.dir === "rtl" ||
			document.documentElement.getAttribute("dir") === "rtl");

	// ─── Hooks ───

	const pixelsPerDay = ZOOM_CONFIGS[state.zoom].pixelsPerDay;

	const handleReschedule = useCallback(
		(activityId: string, newStart: Date, newEnd: Date) => {
			updateActivityMutation.mutate({
				activityId,
				plannedStart: newStart.toISOString(),
				plannedEnd: newEnd.toISOString(),
			});
		},
		[updateActivityMutation],
	);

	const handleCreateDependency = useCallback(
		(predecessorId: string, successorId: string, type: DependencyType) => {
			createDependencyMutation.mutate({ predecessorId, successorId, type });
		},
		[createDependencyMutation],
	);

	const contextValue = useMemo(
		() => ({ state, dispatch }),
		[state, dispatch],
	);

	// Scroll sync
	const { tableRef, chartRef, handleTableScroll, handleChartScroll } =
		useGanttScrollSync();

	// Drag hooks — must be inside context provider indirectly, so we wire them here
	// and pass callbacks down. The hooks use useGantt internally but we provide the
	// context via GanttContext.Provider wrapping the render. Since hooks are called
	// at component level, we need a wrapper or direct wiring. We'll wire via callbacks.

	// Container height for virtualization
	const [containerHeight, setContainerHeight] = useState(600);
	useEffect(() => {
		const el = chartRef.current;
		if (el) {
			const obs = new ResizeObserver((entries) => {
				for (const entry of entries) {
					setContainerHeight(entry.contentRect.height);
				}
			});
			obs.observe(el);
			return () => obs.disconnect();
		}
	}, [chartRef]);

	const { visibleRows, startIndex, topPadding, totalHeight } =
		useGanttVirtualization(state.flatRows, state.scrollTop, containerHeight);

	// Scroll-to-today callback for toolbar
	const scrollToToday = useCallback(() => {
		const el = chartRef.current;
		if (!el) return;
		const totalWidth = state.dateRange.totalDays * pixelsPerDay;
		const now = new Date();
		const diffDays = Math.floor(
			(now.getTime() - state.dateRange.start.getTime()) / (1000 * 60 * 60 * 24),
		);
		const todayPx = diffDays * pixelsPerDay;
		const targetPx = isRtl
			? totalWidth - todayPx - el.clientWidth / 2
			: todayPx - el.clientWidth / 2;
		el.scrollLeft = Math.max(0, targetPx);
	}, [chartRef, state.dateRange, pixelsPerDay, isRtl]);

	if (isMobile) {
		return <MobileGanttFallback />;
	}

	// Baselines for dialog
	const baselines = (baselinesData?.baselines ?? []) as any[];

	return (
		<GanttContext.Provider value={contextValue}>
			<GanttInnerContent
				tableRef={tableRef}
				chartRef={chartRef}
				handleTableScroll={handleTableScroll}
				handleChartScroll={handleChartScroll}
				visibleRows={visibleRows}
				startIndex={startIndex}
				topPadding={topPadding}
				totalHeight={totalHeight}
				isRtl={isRtl}
				pixelsPerDay={pixelsPerDay}
				onReschedule={handleReschedule}
				onCreateDependency={handleCreateDependency}
				onDeleteDependency={(id) => deleteDependencyMutation.mutate(id)}
				onOpenCalendarSettings={() => setCalendarOpen(true)}
				onOpenBaselineManagement={() => setBaselineOpen(true)}
				scrollToToday={scrollToToday}
			/>

			{/* Activity detail side panel */}
			<ActivityDetailSheet onClose={() => {}} />

			{/* Calendar settings */}
			<CalendarSettingsDialog
				open={calendarOpen}
				onOpenChange={setCalendarOpen}
				initialWorkDays={
					(calendarData as any)?.calendar?.workDays ?? [0, 1, 2, 3, 4]
				}
				initialHoursPerDay={
					(calendarData as any)?.calendar?.defaultHoursPerDay ?? 8
				}
				onSave={(workDays, hoursPerDay) =>
					upsertCalendarMutation.mutate({ workDays, hoursPerDay })
				}
				isLoading={upsertCalendarMutation.isPending}
			/>

			{/* Baseline management */}
			<BaselineManagementDialog
				open={baselineOpen}
				onOpenChange={setBaselineOpen}
				baselines={baselines.map((b: any) => ({
					id: b.id,
					name: b.name,
					createdAt: b.createdAt,
					isActive: b.isActive ?? false,
				}))}
				onCreate={(name) => createBaselineMutation.mutate(name)}
				onActivate={(id) => activateBaselineMutation.mutate(id)}
				onDelete={(id) => deleteBaselineMutation.mutate(id)}
				isLoading={
					createBaselineMutation.isPending ||
					activateBaselineMutation.isPending ||
					deleteBaselineMutation.isPending
				}
			/>
		</GanttContext.Provider>
	);
}

// ─── Inner Content (uses drag hooks that need GanttContext) ───

interface GanttInnerContentProps {
	tableRef: React.RefObject<HTMLDivElement | null>;
	chartRef: React.RefObject<HTMLDivElement | null>;
	handleTableScroll: () => void;
	handleChartScroll: () => void;
	visibleRows: import("../../lib/gantt-types").FlatGanttRow[];
	startIndex: number;
	topPadding: number;
	totalHeight: number;
	isRtl: boolean;
	pixelsPerDay: number;
	onReschedule: (activityId: string, newStart: Date, newEnd: Date) => void;
	onCreateDependency: (
		predecessorId: string,
		successorId: string,
		type: DependencyType,
	) => void;
	onDeleteDependency: (id: string) => void;
	onOpenCalendarSettings: () => void;
	onOpenBaselineManagement: () => void;
	scrollToToday: () => void;
}

function GanttInnerContent({
	tableRef,
	chartRef,
	handleTableScroll,
	handleChartScroll,
	visibleRows,
	startIndex,
	topPadding,
	totalHeight,
	isRtl,
	pixelsPerDay,
	onReschedule,
	onCreateDependency,
	onDeleteDependency,
	onOpenCalendarSettings,
	onOpenBaselineManagement,
	scrollToToday,
}: GanttInnerContentProps) {
	const { isDragging: isBarDragging, handleDragStart } = useGanttDrag({
		pixelsPerDay,
		isRtl,
		onReschedule,
	});

	const {
		isDragging: isDepDragging,
		handleAnchorDragStart,
		setTarget: setDependencyTarget,
	} = useGanttDependencyDrag({
		onCreateDependency,
	});

	useGanttKeyboard();

	return (
		<div className="flex h-[calc(100vh-200px)] min-h-[500px] flex-col rounded-lg border bg-background">
			<GanttToolbar
				onOpenCalendarSettings={onOpenCalendarSettings}
				onOpenBaselineManagement={onOpenBaselineManagement}
				onScrollToToday={scrollToToday}
			/>

			<div className="flex-1 overflow-hidden">
				<GanttSplitPane
					tableContent={
						<WbsTable
							scrollRef={tableRef}
							onScroll={handleTableScroll}
							visibleRows={visibleRows}
							topPadding={topPadding}
							totalHeight={totalHeight}
						/>
					}
					chartContent={
						<GanttChartArea
							scrollRef={chartRef}
							onScroll={handleChartScroll}
							visibleRows={visibleRows}
							startIndex={startIndex}
							topPadding={topPadding}
							totalHeight={totalHeight}
							isRtl={isRtl}
							onDragStart={handleDragStart}
							onAnchorDragStart={handleAnchorDragStart}
							isDependencyDragging={isDepDragging}
							onAnchorHover={(activityId, anchor) =>
								setDependencyTarget(activityId, anchor)
							}
							onDeleteDependency={onDeleteDependency}
						/>
					}
				/>
			</div>
		</div>
	);
}
