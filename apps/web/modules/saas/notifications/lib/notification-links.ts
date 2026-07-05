/**
 * روابط الإشعارات العميقة — تحويل (entityType, entityId, projectId) إلى مسار.
 * كل مسار هنا تم التحقق من وجوده في apps/web/app قبل إضافته.
 */

export interface NotificationLinkInput {
	projectId?: string | null;
	entityType?: string | null;
	entityId?: string | null;
}

export function getNotificationHref(
	notification: NotificationLinkInput,
	organizationSlug: string,
): string | null {
	const base = `/app/${organizationSlug}`;
	const { entityType, entityId, projectId } = notification;
	const projectBase = projectId ? `${base}/projects/${projectId}` : null;
	const fallback = projectBase;

	switch (entityType) {
		// ─── المالية ────────────────────────────────────────────────────
		case "invoice":
			return entityId
				? `${base}/finance/invoices/${entityId}`
				: `${base}/finance/invoices`;
		case "expense":
			if (projectBase) {
				return `${projectBase}/finance/expenses`;
			}
			return entityId
				? `${base}/finance/expenses/${entityId}`
				: `${base}/finance/expenses`;
		case "payment":
			return entityId
				? `${base}/finance/payments/${entityId}`
				: `${base}/finance/payments`;
		case "receiptVoucher":
			return entityId
				? `${base}/finance/receipt-vouchers/${entityId}`
				: `${base}/finance/receipt-vouchers`;
		case "paymentVoucher":
			return entityId
				? `${base}/finance/payment-vouchers/${entityId}`
				: `${base}/finance/payment-vouchers`;
		case "transfer":
			// لا يوجد مسار تفاصيل تحويل — الصفحة المالية الرئيسية
			return `${base}/finance`;
		case "quotation":
			return entityId
				? `${base}/pricing/quotations/${entityId}`
				: `${base}/pricing/quotations`;
		case "client":
			return entityId
				? `${base}/finance/clients/${entityId}`
				: `${base}/finance/clients`;
		case "ownerDrawing":
			return entityId
				? `${base}/finance/owner-drawings/${entityId}`
				: `${base}/finance/owner-drawings`;
		case "capitalContribution":
			return `${base}/finance/capital-contributions`;

		// ─── الموارد البشرية ────────────────────────────────────────────
		case "payrollRun":
			return entityId
				? `${base}/company/payroll/${entityId}`
				: `${base}/company/payroll`;
		case "leaveRequest":
			return `${base}/company/leaves/requests`;
		case "companyExpense":
			return entityId
				? `${base}/company/expenses/${entityId}`
				: `${base}/company/expenses`;
		case "employee":
			return entityId
				? `${base}/company/employees/${entityId}`
				: `${base}/company/employees`;

		// ─── المشاريع ───────────────────────────────────────────────────
		case "project":
			return entityId ? `${base}/projects/${entityId}` : fallback;
		case "claim":
			return projectBase ? `${projectBase}/finance/claims` : fallback;
		case "projectPayment":
			return projectBase ? `${projectBase}/finance/payments` : fallback;
		case "subcontract":
			return projectBase && entityId
				? `${projectBase}/finance/subcontracts/${entityId}`
				: projectBase
					? `${projectBase}/finance/subcontracts`
					: fallback;
		case "subcontractPayment":
		case "subcontractClaim":
		case "subcontractChangeOrder":
			return projectBase
				? `${projectBase}/finance/subcontracts`
				: fallback;
		case "changeOrder":
			return projectBase && entityId
				? `${projectBase}/changes/${entityId}`
				: projectBase
					? `${projectBase}/changes`
					: fallback;
		case "dailyReport":
		case "issue":
			return projectBase ? `${projectBase}/field` : fallback;
		case "photo":
			return projectBase ? `${projectBase}/photos` : fallback;
		case "handover":
			return projectBase && entityId
				? `${projectBase}/handover/${entityId}`
				: projectBase
					? `${projectBase}/handover`
					: fallback;
		case "document":
		case "approval":
			return projectBase && entityId
				? `${projectBase}/documents/${entityId}`
				: projectBase
					? `${projectBase}/documents`
					: fallback;
		case "attachment":
			return projectBase ? `${projectBase}/documents` : fallback;
		case "message":
			return projectBase ? `${projectBase}/chat` : fallback;
		case "progressUpdate":
			return fallback;

		// ─── التسعير ────────────────────────────────────────────────────
		case "study":
			return entityId
				? `${base}/pricing/studies/${entityId}`
				: `${base}/pricing/studies`;

		// ─── المنظمة ────────────────────────────────────────────────────
		case "user":
			return `${base}/settings/users`;

		default:
			return fallback;
	}
}
