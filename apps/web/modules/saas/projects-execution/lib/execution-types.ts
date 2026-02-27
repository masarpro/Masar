export type ViewMode = "cards" | "table" | "advanced";

export interface ExecutionMilestone {
	id: string;
	title: string;
	description?: string | null;
	orderIndex: number;
	plannedStart: Date | string | null;
	plannedEnd: Date | string | null;
	actualStart: Date | string | null;
	actualEnd: Date | string | null;
	status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "CANCELLED";
	progress: number;
	isCritical: boolean;
	weight?: number | null;
	color?: string | null;
	progressMethod: "MANUAL" | "CHECKLIST" | "ACTIVITIES";
	healthStatus: "ON_TRACK" | "AT_RISK" | "DELAYED";
}

export interface ExecutionActivity {
	id: string;
	milestoneId: string;
	title: string;
	description?: string | null;
	wbsCode?: string | null;
	plannedStart: Date | string | null;
	plannedEnd: Date | string | null;
	duration?: number | null;
	actualStart: Date | string | null;
	actualEnd: Date | string | null;
	status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "ON_HOLD" | "CANCELLED";
	progress: number;
	isCritical: boolean;
	weight?: number | null;
	orderIndex: number;
	assignee?: {
		id: string;
		name: string;
		image?: string | null;
	} | null;
	checklists: ActivityChecklistItem[];
}

export interface ActivityChecklistItem {
	id: string;
	activityId: string;
	title: string;
	isCompleted: boolean;
	completedAt?: Date | string | null;
	orderIndex: number;
}

export interface ExecutionHealth {
	activities: {
		total: number;
		completed: number;
		delayed: number;
		inProgress: number;
	};
	milestones: {
		total: number;
		completed: number;
		delayed: number;
	};
	overallProgress: number;
	upcomingMilestone: {
		plannedStart: Date | string | null;
		daysUntil: number;
	} | null;
}

export interface MilestoneTemplate {
	id: string;
	nameKey: string;
	milestones: Array<{
		title: string;
		activities: string[];
	}>;
}
