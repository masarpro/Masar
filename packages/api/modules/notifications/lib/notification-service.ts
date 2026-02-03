/**
 * Notification Service
 * Provides a simple interface for sending notifications throughout the application
 */

import {
	createNotifications,
	createNotification,
	generateDedupeKey,
	db,
	type CreateNotificationInput,
} from "@repo/database";
import type { NotificationType, ProjectRole } from "@repo/database/prisma/generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationPayload {
	/**
	 * Organization context
	 */
	organizationId: string;

	/**
	 * Project context (optional, but recommended for project-related notifications)
	 */
	projectId?: string;

	/**
	 * Type of notification
	 */
	type: NotificationType;

	/**
	 * Arabic title for the notification
	 */
	title: string;

	/**
	 * Arabic body text (optional)
	 */
	body?: string;

	/**
	 * Users to notify
	 */
	recipientIds: string[];

	/**
	 * User who triggered the action (to exclude from recipients)
	 */
	actorId?: string;

	/**
	 * Entity type for linking (e.g., "daily_report", "issue", "expense")
	 */
	entityType?: string;

	/**
	 * Entity ID for linking
	 */
	entityId?: string;

	/**
	 * Additional metadata
	 */
	metadata?: Record<string, unknown>;

	/**
	 * Whether to deduplicate notifications
	 */
	deduplicate?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send notifications to multiple users
 * Automatically excludes the actor from recipients
 */
export async function sendNotification(
	payload: NotificationPayload,
): Promise<{ count: number; skipped?: boolean }> {
	// Filter out the actor from recipients
	const recipients = payload.actorId
		? payload.recipientIds.filter((id) => id !== payload.actorId)
		: payload.recipientIds;

	if (recipients.length === 0) {
		return { count: 0 };
	}

	const notificationData: CreateNotificationInput = {
		type: payload.type,
		title: payload.title,
		body: payload.body,
		projectId: payload.projectId,
		entityType: payload.entityType,
		entityId: payload.entityId,
		metadata: payload.metadata,
	};

	// Add dedupe key if requested
	if (payload.deduplicate && payload.entityType && payload.entityId) {
		notificationData.dedupeKey = generateDedupeKey(
			payload.type,
			payload.entityType,
			payload.entityId,
		);
	}

	const result = await createNotifications(
		payload.organizationId,
		recipients,
		notificationData,
	);

	return result;
}

/**
 * Send a notification to a single user
 */
export async function sendNotificationToUser(
	organizationId: string,
	userId: string,
	data: Omit<NotificationPayload, "organizationId" | "recipientIds">,
): Promise<void> {
	const notificationData: CreateNotificationInput = {
		type: data.type,
		title: data.title,
		body: data.body,
		projectId: data.projectId,
		entityType: data.entityType,
		entityId: data.entityId,
		metadata: data.metadata,
	};

	if (data.deduplicate && data.entityType && data.entityId) {
		notificationData.dedupeKey = generateDedupeKey(
			data.type,
			data.entityType,
			data.entityId,
		);
	}

	await createNotification(organizationId, userId, notificationData);
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Functions for Common Notifications
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Notify about a new daily report
 */
export async function notifyDailyReportCreated(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	reportId: string;
	reportDate: string;
	creatorId: string;
	managerIds: string[];
}): Promise<void> {
	await sendNotification({
		organizationId: params.organizationId,
		projectId: params.projectId,
		type: "DAILY_REPORT_CREATED",
		title: `تقرير يومي جديد - ${params.projectName}`,
		body: `تم إضافة تقرير يومي بتاريخ ${params.reportDate}`,
		recipientIds: params.managerIds,
		actorId: params.creatorId,
		entityType: "daily_report",
		entityId: params.reportId,
		deduplicate: true,
	});
}

/**
 * Notify about a new issue (especially critical ones)
 */
export async function notifyIssueCreated(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	issueId: string;
	issueTitle: string;
	severity: string;
	creatorId: string;
	managerIds: string[];
}): Promise<void> {
	const isCritical = params.severity === "HIGH" || params.severity === "CRITICAL";

	await sendNotification({
		organizationId: params.organizationId,
		projectId: params.projectId,
		type: isCritical ? "ISSUE_CRITICAL" : "ISSUE_CREATED",
		title: isCritical
			? `مشكلة حرجة - ${params.projectName}`
			: `مشكلة جديدة - ${params.projectName}`,
		body: params.issueTitle,
		recipientIds: params.managerIds,
		actorId: params.creatorId,
		entityType: "issue",
		entityId: params.issueId,
		metadata: { severity: params.severity },
		deduplicate: true,
	});
}

/**
 * Notify about a new expense
 */
export async function notifyExpenseCreated(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	expenseId: string;
	amount: string;
	category: string;
	creatorId: string;
	accountantIds: string[];
}): Promise<void> {
	await sendNotification({
		organizationId: params.organizationId,
		projectId: params.projectId,
		type: "EXPENSE_CREATED",
		title: `مصروف جديد - ${params.projectName}`,
		body: `تم تسجيل مصروف بقيمة ${params.amount}`,
		recipientIds: params.accountantIds,
		actorId: params.creatorId,
		entityType: "expense",
		entityId: params.expenseId,
		metadata: { amount: params.amount, category: params.category },
		deduplicate: true,
	});
}

/**
 * Notify about a new claim
 */
export async function notifyClaimCreated(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	claimId: string;
	claimNo: number;
	amount: string;
	creatorId: string;
	recipientIds: string[];
}): Promise<void> {
	await sendNotification({
		organizationId: params.organizationId,
		projectId: params.projectId,
		type: "CLAIM_CREATED",
		title: `مستخلص جديد - ${params.projectName}`,
		body: `تم إنشاء مستخلص رقم ${params.claimNo} بقيمة ${params.amount}`,
		recipientIds: params.recipientIds,
		actorId: params.creatorId,
		entityType: "claim",
		entityId: params.claimId,
		metadata: { claimNo: params.claimNo, amount: params.amount },
		deduplicate: true,
	});
}

/**
 * Notify about claim status change
 */
export async function notifyClaimStatusChanged(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	claimId: string;
	claimNo: number;
	newStatus: string;
	actorId: string;
	creatorId: string;
}): Promise<void> {
	const statusLabels: Record<string, string> = {
		DRAFT: "مسودة",
		SUBMITTED: "مقدم",
		APPROVED: "معتمد",
		PAID: "مدفوع",
		REJECTED: "مرفوض",
	};

	await sendNotificationToUser(params.organizationId, params.creatorId, {
		projectId: params.projectId,
		type: "CLAIM_STATUS_CHANGED",
		title: `تحديث مستخلص - ${params.projectName}`,
		body: `تم تغيير حالة المستخلص رقم ${params.claimNo} إلى "${statusLabels[params.newStatus] || params.newStatus}"`,
		entityType: "claim",
		entityId: params.claimId,
		metadata: { claimNo: params.claimNo, newStatus: params.newStatus },
	});
}

/**
 * Notify about approval request
 */
export async function notifyApprovalRequested(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	documentId: string;
	documentTitle: string;
	requesterId: string;
	approverIds: string[];
}): Promise<void> {
	await sendNotification({
		organizationId: params.organizationId,
		projectId: params.projectId,
		type: "APPROVAL_REQUESTED",
		title: `طلب اعتماد - ${params.projectName}`,
		body: `طلب اعتماد للمستند: ${params.documentTitle}`,
		recipientIds: params.approverIds,
		actorId: params.requesterId,
		entityType: "document",
		entityId: params.documentId,
		deduplicate: true,
	});
}

/**
 * Notify about approval decision
 */
export async function notifyApprovalDecided(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	documentId: string;
	documentTitle: string;
	decision: "APPROVED" | "REJECTED";
	deciderId: string;
	requesterId: string;
}): Promise<void> {
	const decisionText = params.decision === "APPROVED" ? "تمت الموافقة" : "تم الرفض";

	await sendNotificationToUser(params.organizationId, params.requesterId, {
		projectId: params.projectId,
		type: "APPROVAL_DECIDED",
		title: `قرار اعتماد - ${params.projectName}`,
		body: `${decisionText} على المستند: ${params.documentTitle}`,
		entityType: "document",
		entityId: params.documentId,
		metadata: { decision: params.decision },
	});
}

/**
 * Notify about change order creation
 */
export async function notifyChangeOrderCreated(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	changeOrderId: string;
	coNo: number;
	title: string;
	creatorId: string;
	managerIds: string[];
}): Promise<void> {
	await sendNotification({
		organizationId: params.organizationId,
		projectId: params.projectId,
		type: "CHANGE_ORDER_CREATED",
		title: `أمر تغيير جديد - ${params.projectName}`,
		body: `أمر تغيير رقم ${params.coNo}: ${params.title}`,
		recipientIds: params.managerIds,
		actorId: params.creatorId,
		entityType: "change_order",
		entityId: params.changeOrderId,
		metadata: { coNo: params.coNo },
		deduplicate: true,
	});
}

/**
 * Notify about change order decision
 */
export async function notifyChangeOrderDecision(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	changeOrderId: string;
	coNo: number;
	decision: "APPROVED" | "REJECTED";
	deciderId: string;
	creatorId: string;
}): Promise<void> {
	const type = params.decision === "APPROVED" ? "CHANGE_ORDER_APPROVED" : "CHANGE_ORDER_REJECTED";
	const decisionText = params.decision === "APPROVED" ? "تمت الموافقة" : "تم الرفض";

	await sendNotificationToUser(params.organizationId, params.creatorId, {
		projectId: params.projectId,
		type,
		title: `قرار أمر تغيير - ${params.projectName}`,
		body: `${decisionText} على أمر التغيير رقم ${params.coNo}`,
		entityType: "change_order",
		entityId: params.changeOrderId,
		metadata: { coNo: params.coNo, decision: params.decision },
	});
}

/**
 * Notify about team member added
 */
export async function notifyTeamMemberAdded(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	addedUserId: string;
	role: string;
	addedById: string;
}): Promise<void> {
	const roleLabels: Record<string, string> = {
		MANAGER: "مدير المشروع",
		ENGINEER: "مهندس",
		SUPERVISOR: "مشرف ميداني",
		ACCOUNTANT: "محاسب المشروع",
		VIEWER: "مشاهد",
	};

	await sendNotificationToUser(params.organizationId, params.addedUserId, {
		projectId: params.projectId,
		type: "TEAM_MEMBER_ADDED",
		title: `تمت إضافتك لفريق المشروع`,
		body: `تمت إضافتك لمشروع "${params.projectName}" بصفة ${roleLabels[params.role] || params.role}`,
		entityType: "project",
		entityId: params.projectId,
		metadata: { role: params.role },
	});
}

/**
 * Notify about team member removed
 */
export async function notifyTeamMemberRemoved(params: {
	organizationId: string;
	projectId: string;
	projectName: string;
	removedUserId: string;
	removedById: string;
}): Promise<void> {
	await sendNotificationToUser(params.organizationId, params.removedUserId, {
		projectId: params.projectId,
		type: "TEAM_MEMBER_REMOVED",
		title: `تمت إزالتك من فريق المشروع`,
		body: `تمت إزالتك من مشروع "${params.projectName}"`,
		entityType: "project",
		entityId: params.projectId,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions for Notification Targeting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get project members by role(s) for notification targeting
 */
export async function getProjectMembersByRole(
	projectId: string,
	roles: ProjectRole[],
): Promise<string[]> {
	const members = await db.projectMember.findMany({
		where: {
			projectId,
			role: { in: roles },
		},
		select: { userId: true },
	});
	return members.map((m) => m.userId);
}

/**
 * Get project managers (MANAGER role)
 */
export async function getProjectManagers(projectId: string): Promise<string[]> {
	return getProjectMembersByRole(projectId, ["MANAGER"]);
}

/**
 * Get project accountants (ACCOUNTANT role)
 */
export async function getProjectAccountants(
	projectId: string,
): Promise<string[]> {
	return getProjectMembersByRole(projectId, ["ACCOUNTANT"]);
}

/**
 * Get organization admins for notifications
 */
export async function getOrganizationAdmins(
	organizationId: string,
): Promise<string[]> {
	const admins = await db.member.findMany({
		where: {
			organizationId,
			role: { in: ["owner", "admin"] },
		},
		select: { userId: true },
	});
	return admins.map((a) => a.userId);
}
