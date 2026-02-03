import { ORPCError } from "@orpc/server";
import { db, getProjectById } from "@repo/database";
import { hasPermission, type Permissions } from "@repo/database/prisma/permissions";
import { getUserPermissions } from "./get-user-permissions";
import { verifyOrganizationMembership } from "../../modules/organizations/lib/membership";

export interface ProjectAccessResult {
	organization: {
		id: string;
		name: string;
		slug: string | null;
	};
	project: {
		id: string;
		name: string;
		slug: string;
		organizationId: string;
	};
	permissions: Permissions;
	membership: {
		role: string;
	};
}

/**
 * Verify user has access to a project with required permissions
 *
 * This is a combined verification that:
 * 1. Verifies organization membership
 * 2. Verifies project belongs to organization
 * 3. Gets user permissions
 * 4. Optionally checks a required permission
 *
 * @throws ORPCError FORBIDDEN if any check fails
 */
export async function verifyProjectAccess(
	projectId: string,
	organizationId: string,
	userId: string,
	requiredPermission?: {
		section: keyof Permissions;
		action: string;
	},
): Promise<ProjectAccessResult> {
	// Step 1: Verify organization membership
	const membership = await verifyOrganizationMembership(organizationId, userId);
	if (!membership) {
		throw new ORPCError("FORBIDDEN", {
			message: "ليس لديك عضوية في هذه المنظمة",
		});
	}

	// Step 2: Verify project belongs to organization
	const project = await getProjectById(projectId, organizationId);
	if (!project) {
		throw new ORPCError("NOT_FOUND", {
			message: "المشروع غير موجود أو لا ينتمي لهذه المنظمة",
		});
	}

	// Step 3: Get user permissions
	const permissions = await getUserPermissions(userId, organizationId);

	// Step 4: Check required permission if provided
	if (requiredPermission) {
		if (!hasPermission(permissions, requiredPermission.section, requiredPermission.action)) {
			throw new ORPCError("FORBIDDEN", {
				message: getPermissionErrorMessage(requiredPermission.section, requiredPermission.action),
			});
		}
	}

	return {
		organization: membership.organization,
		project: {
			id: project.id,
			name: project.name,
			slug: project.slug,
			organizationId: project.organizationId,
		},
		permissions,
		membership: {
			role: membership.role,
		},
	};
}

/**
 * Verify user has organization access with required permissions (no project needed)
 *
 * @throws ORPCError FORBIDDEN if any check fails
 */
export async function verifyOrganizationAccess(
	organizationId: string,
	userId: string,
	requiredPermission?: {
		section: keyof Permissions;
		action: string;
	},
): Promise<{
	organization: {
		id: string;
		name: string;
		slug: string | null;
	};
	permissions: Permissions;
	membership: {
		role: string;
	};
}> {
	// Step 1: Verify organization membership
	const membership = await verifyOrganizationMembership(organizationId, userId);
	if (!membership) {
		throw new ORPCError("FORBIDDEN", {
			message: "ليس لديك عضوية في هذه المنظمة",
		});
	}

	// Step 2: Get user permissions
	const permissions = await getUserPermissions(userId, organizationId);

	// Step 3: Check required permission if provided
	if (requiredPermission) {
		if (!hasPermission(permissions, requiredPermission.section, requiredPermission.action)) {
			throw new ORPCError("FORBIDDEN", {
				message: getPermissionErrorMessage(requiredPermission.section, requiredPermission.action),
			});
		}
	}

	return {
		organization: membership.organization,
		permissions,
		membership: {
			role: membership.role,
		},
	};
}

/**
 * Check permission on an existing permissions object (no DB call)
 *
 * @throws ORPCError FORBIDDEN if permission not granted
 */
export function requirePermission(
	permissions: Permissions,
	section: keyof Permissions,
	action: string,
): void {
	if (!hasPermission(permissions, section, action)) {
		throw new ORPCError("FORBIDDEN", {
			message: getPermissionErrorMessage(section, action),
		});
	}
}

/**
 * Get Arabic error message for permission denial
 */
function getPermissionErrorMessage(section: keyof Permissions, action: string): string {
	const sectionMessages: Record<keyof Permissions, Record<string, string>> = {
		projects: {
			view: "ليس لديك صلاحية عرض المشاريع",
			create: "ليس لديك صلاحية إنشاء المشاريع",
			edit: "ليس لديك صلاحية تعديل المشاريع",
			delete: "ليس لديك صلاحية حذف المشاريع",
			viewFinance: "ليس لديك صلاحية عرض البيانات المالية للمشروع",
			manageTeam: "ليس لديك صلاحية إدارة فريق المشروع",
		},
		quantities: {
			view: "ليس لديك صلاحية عرض دراسات الكميات",
			create: "ليس لديك صلاحية إنشاء دراسات الكميات",
			edit: "ليس لديك صلاحية تعديل دراسات الكميات",
			delete: "ليس لديك صلاحية حذف دراسات الكميات",
			pricing: "ليس لديك صلاحية إدارة التسعير",
		},
		finance: {
			view: "ليس لديك صلاحية عرض البيانات المالية",
			quotations: "ليس لديك صلاحية إدارة عروض الأسعار",
			invoices: "ليس لديك صلاحية إدارة الفواتير",
			payments: "ليس لديك صلاحية إدارة المدفوعات",
			reports: "ليس لديك صلاحية عرض التقارير المالية",
		},
		employees: {
			view: "ليس لديك صلاحية عرض الموظفين",
			create: "ليس لديك صلاحية إضافة موظفين",
			edit: "ليس لديك صلاحية تعديل بيانات الموظفين",
			delete: "ليس لديك صلاحية حذف الموظفين",
			payroll: "ليس لديك صلاحية إدارة الرواتب",
			attendance: "ليس لديك صلاحية إدارة الحضور",
		},
		settings: {
			organization: "ليس لديك صلاحية تعديل إعدادات المنظمة",
			users: "ليس لديك صلاحية إدارة المستخدمين",
			roles: "ليس لديك صلاحية إدارة الأدوار",
			billing: "ليس لديك صلاحية إدارة الفوترة",
			integrations: "ليس لديك صلاحية إدارة التكاملات",
		},
		reports: {
			view: "ليس لديك صلاحية عرض التقارير",
			create: "ليس لديك صلاحية إنشاء التقارير",
			approve: "ليس لديك صلاحية اعتماد التقارير",
		},
	};

	return sectionMessages[section]?.[action] ?? "ليس لديك الصلاحية المطلوبة";
}
