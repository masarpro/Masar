"use client";

import {
	createElement,
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import {
	type ProjectRole,
	canRoleViewSection,
} from "../lib/role-visibility";

export interface ProjectData {
	id: string;
	name: string;
	status: string;
	progress: number;
	contractValue?: number | null;
	clientName?: string | null;
	location?: string | null;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
}

interface ProjectRoleContextValue {
	/** The user's actual role in this project */
	actualRole: ProjectRole;
	/** The role currently being viewed (for "View As" feature) */
	viewAsRole: ProjectRole;
	/** Whether we're in "View As" preview mode */
	isViewAsActive: boolean;
	/** The effective role to use for visibility checks */
	effectiveRole: ProjectRole;
	/** Set the "View As" role (only for MANAGER) */
	setViewAs: (role: ProjectRole | null) => void;
	/** Check if a section is visible for the effective role */
	canViewSection: (section: string) => boolean;
	/** Whether the user is a manager (can use View As) */
	isManager: boolean;
	/** The project data from the shell */
	projectData: ProjectData | null;
}

const ProjectRoleContext = createContext<ProjectRoleContextValue | null>(null);

interface ProjectRoleProviderProps {
	children: ReactNode;
	actualRole: ProjectRole;
	projectData?: ProjectData;
}

export function ProjectRoleProvider({
	children,
	actualRole,
	projectData: projectDataProp,
}: ProjectRoleProviderProps) {
	const [viewAsRole, setViewAsRole] = useState<ProjectRole | null>(null);

	const isManager = actualRole === "MANAGER";
	const isViewAsActive = isManager && viewAsRole !== null;
	const effectiveRole = isViewAsActive ? viewAsRole! : actualRole;

	const setViewAs = useCallback(
		(role: ProjectRole | null) => {
			if (!isManager) return;
			setViewAsRole(role);
		},
		[isManager],
	);

	const canViewSection = useCallback(
		(section: string) => canRoleViewSection(effectiveRole, section),
		[effectiveRole],
	);

	const value: ProjectRoleContextValue = {
		actualRole,
		viewAsRole: viewAsRole ?? actualRole,
		isViewAsActive,
		effectiveRole,
		setViewAs,
		canViewSection,
		isManager,
		projectData: projectDataProp ?? null,
	};

	return createElement(ProjectRoleContext.Provider, { value }, children);
}

/**
 * Hook to access the current project role context
 */
export function useProjectRole(): ProjectRoleContextValue {
	const context = useContext(ProjectRoleContext);
	if (!context) {
		// Return a default context for when provider is not mounted
		return {
			actualRole: "VIEWER",
			viewAsRole: "VIEWER",
			isViewAsActive: false,
			effectiveRole: "VIEWER",
			setViewAs: () => {},
			canViewSection: (section: string) =>
				canRoleViewSection("VIEWER", section),
			isManager: false,
			projectData: null,
		};
	}
	return context;
}

/**
 * Convenience hook to check if a specific section is visible
 */
export function useCanViewSection(section: string): boolean {
	const { canViewSection } = useProjectRole();
	return canViewSection(section);
}
