/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
import { Prisma } from '../generated/client';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

// File: PlanConfigScalarFieldEnum.schema.ts

export const PlanConfigScalarFieldEnumSchema = z.enum(['id', 'plan', 'name', 'maxUsers', 'maxProjects', 'maxStorageGB', 'monthlyPrice', 'yearlyPrice', 'features', 'isActive', 'updatedAt', 'createdAt'])

export type PlanConfigScalarFieldEnum = z.infer<typeof PlanConfigScalarFieldEnumSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'username', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'displayUsername', 'twoFactorEnabled', 'accountType', 'isActive', 'mustChangePassword', 'lastLoginAt', 'organizationRoleId', 'customPermissions', 'createdById', 'organizationId'])

export type UserScalarFieldEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'activeOrganizationId', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'aaguid', 'createdAt'])

export type PasskeyScalarFieldEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'userId'])

export type TwoFactorScalarFieldEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: OrganizationScalarFieldEnum.schema.ts

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId', 'ownerId', 'commercialRegister', 'taxNumber', 'contractorClass', 'phone', 'address', 'city', 'currency', 'timezone', 'status', 'plan', 'planName', 'stripeSubscriptionId', 'stripeProductId', 'stripePriceId', 'subscriptionStatus', 'maxUsers', 'maxProjects', 'maxStorage', 'currentPeriodStart', 'currentPeriodEnd', 'trialEndsAt', 'cancelAtPeriodEnd', 'lastPaymentAt', 'lastPaymentAmount', 'billingEmail', 'isFreeOverride', 'overrideReason', 'overrideBy', 'overrideAt'])

export type OrganizationScalarFieldEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId', 'createdAt'])

export type InvitationScalarFieldEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: RoleScalarFieldEnum.schema.ts

export const RoleScalarFieldEnumSchema = z.enum(['id', 'name', 'nameEn', 'description', 'type', 'isSystem', 'permissions', 'organizationId', 'createdAt', 'updatedAt'])

export type RoleScalarFieldEnum = z.infer<typeof RoleScalarFieldEnumSchema>;

// File: UserInvitationScalarFieldEnum.schema.ts

export const UserInvitationScalarFieldEnumSchema = z.enum(['id', 'email', 'name', 'roleId', 'token', 'expiresAt', 'status', 'organizationId', 'invitedById', 'createdAt', 'acceptedAt'])

export type UserInvitationScalarFieldEnum = z.infer<typeof UserInvitationScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'productId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: SubscriptionEventScalarFieldEnum.schema.ts

export const SubscriptionEventScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'eventType', 'stripeEventId', 'data', 'processedAt'])

export type SubscriptionEventScalarFieldEnum = z.infer<typeof SubscriptionEventScalarFieldEnumSchema>;

// File: SuperAdminLogScalarFieldEnum.schema.ts

export const SuperAdminLogScalarFieldEnumSchema = z.enum(['id', 'adminId', 'action', 'targetType', 'targetId', 'targetOrgId', 'details', 'ipAddress', 'createdAt'])

export type SuperAdminLogScalarFieldEnum = z.infer<typeof SuperAdminLogScalarFieldEnumSchema>;

// File: AiChatScalarFieldEnum.schema.ts

export const AiChatScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'title', 'type', 'messages', 'metadata', 'createdAt', 'updatedAt'])

export type AiChatScalarFieldEnum = z.infer<typeof AiChatScalarFieldEnumSchema>;

// File: CostStudyScalarFieldEnum.schema.ts

export const CostStudyScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'createdById', 'name', 'customerName', 'customerId', 'projectType', 'landArea', 'buildingArea', 'numberOfFloors', 'hasBasement', 'finishingLevel', 'structuralCost', 'finishingCost', 'mepCost', 'laborCost', 'overheadPercent', 'profitPercent', 'contingencyPercent', 'vatIncluded', 'totalCost', 'buildingConfig', 'status', 'notes', 'projectId', 'studyType', 'entryPoint', 'workScopes', 'quantitiesStatus', 'specsStatus', 'costingStatus', 'pricingStatus', 'quotationStatus', 'quantitiesAssigneeId', 'specsAssigneeId', 'costingAssigneeId', 'pricingAssigneeId', 'contractValue', 'generatedQuotationId', 'convertedProjectId', 'structuralSpecs', 'laborBreakdown', 'costingMethod', 'overheadCost', 'adminCost', 'adminPercent', 'storageCostPercent', 'markupMethod', 'uniformMarkupPercent', 'globalMarkupPercent', 'globalMarkupMethod', 'vatPercent', 'vatIncludedInPrices', 'totalMaterialCost', 'totalLaborCost', 'totalGrossCost', 'totalSellAmount', 'totalProfitAmount', 'totalProfitPercent', 'createdAt', 'updatedAt'])

export type CostStudyScalarFieldEnum = z.infer<typeof CostStudyScalarFieldEnumSchema>;

// File: StudyStageScalarFieldEnum.schema.ts

export const StudyStageScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'stage', 'status', 'assigneeId', 'approvedById', 'approvedAt', 'notes', 'sortOrder', 'createdAt', 'updatedAt'])

export type StudyStageScalarFieldEnum = z.infer<typeof StudyStageScalarFieldEnumSchema>;

// File: MaterialBOMScalarFieldEnum.schema.ts

export const MaterialBOMScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'parentItemId', 'parentItemType', 'parentCategory', 'materialName', 'materialNameEn', 'materialCode', 'quantity', 'unit', 'consumptionRate', 'wastagePercent', 'effectiveQuantity', 'unitPrice', 'totalPrice', 'floorId', 'floorName', 'roomId', 'roomName', 'sortOrder', 'isEnabled', 'createdAt', 'updatedAt'])

export type MaterialBOMScalarFieldEnum = z.infer<typeof MaterialBOMScalarFieldEnumSchema>;

// File: CostingLaborScalarFieldEnum.schema.ts

export const CostingLaborScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'section', 'subSection', 'laborMethod', 'description', 'unit', 'quantity', 'rate', 'durationMonths', 'insuranceCost', 'housingCost', 'transportCost', 'otherCosts', 'totalCost', 'sortOrder', 'isEnabled', 'createdAt', 'updatedAt'])

export type CostingLaborScalarFieldEnum = z.infer<typeof CostingLaborScalarFieldEnumSchema>;

// File: StructuralItemScalarFieldEnum.schema.ts

export const StructuralItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'category', 'subCategory', 'name', 'description', 'dimensions', 'quantity', 'unit', 'concreteVolume', 'concreteType', 'steelWeight', 'steelRatio', 'wastagePercent', 'materialCost', 'laborCost', 'totalCost', 'projectPhaseId', 'sortOrder', 'createdAt', 'updatedAt'])

export type StructuralItemScalarFieldEnum = z.infer<typeof StructuralItemScalarFieldEnumSchema>;

// File: FinishingItemScalarFieldEnum.schema.ts

export const FinishingItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'category', 'subCategory', 'name', 'description', 'floorId', 'floorName', 'area', 'length', 'height', 'width', 'perimeter', 'quantity', 'unit', 'calculationMethod', 'calculationData', 'dataSource', 'sourceItemId', 'sourceFormula', 'isEnabled', 'groupKey', 'scope', 'qualityLevel', 'brand', 'specifications', 'specData', 'wastagePercent', 'materialPrice', 'laborPrice', 'materialCost', 'laborCost', 'totalCost', 'projectPhaseId', 'sortOrder', 'createdAt', 'updatedAt'])

export type FinishingItemScalarFieldEnum = z.infer<typeof FinishingItemScalarFieldEnumSchema>;

// File: SpecificationTemplateScalarFieldEnum.schema.ts

export const SpecificationTemplateScalarFieldEnumSchema = z.enum(['id', 'name', 'nameEn', 'description', 'organizationId', 'createdById', 'isDefault', 'isSystem', 'specs', 'createdAt', 'updatedAt'])

export type SpecificationTemplateScalarFieldEnum = z.infer<typeof SpecificationTemplateScalarFieldEnumSchema>;

// File: MEPItemScalarFieldEnum.schema.ts

export const MEPItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'category', 'subCategory', 'itemType', 'name', 'floorId', 'floorName', 'roomId', 'roomName', 'scope', 'quantity', 'unit', 'length', 'area', 'calculationMethod', 'calculationData', 'dataSource', 'sourceFormula', 'groupKey', 'specifications', 'specData', 'qualityLevel', 'materialPrice', 'laborPrice', 'wastagePercent', 'materialCost', 'laborCost', 'unitPrice', 'totalCost', 'projectPhaseId', 'sortOrder', 'isEnabled', 'createdAt', 'updatedAt'])

export type MEPItemScalarFieldEnum = z.infer<typeof MEPItemScalarFieldEnumSchema>;

// File: LaborItemScalarFieldEnum.schema.ts

export const LaborItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'laborType', 'workerType', 'name', 'quantity', 'dailyRate', 'durationDays', 'insuranceCost', 'housingCost', 'otherCosts', 'totalCost', 'projectPhaseId', 'createdAt', 'updatedAt'])

export type LaborItemScalarFieldEnum = z.infer<typeof LaborItemScalarFieldEnumSchema>;

// File: QuoteScalarFieldEnum.schema.ts

export const QuoteScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'quoteNumber', 'quoteType', 'clientName', 'clientCompany', 'clientPhone', 'clientEmail', 'clientAddress', 'subtotal', 'overheadAmount', 'profitAmount', 'vatAmount', 'totalAmount', 'validUntil', 'paymentTerms', 'deliveryTerms', 'showUnitPrices', 'showQuantities', 'showItemDescriptions', 'includeTerms', 'includeCoverPage', 'selectedCategories', 'termsAndConditions', 'notes', 'pdfUrl', 'status', 'createdAt', 'updatedAt'])

export type QuoteScalarFieldEnum = z.infer<typeof QuoteScalarFieldEnumSchema>;

// File: ProjectScalarFieldEnum.schema.ts

export const ProjectScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'slug', 'projectNo', 'description', 'status', 'type', 'clientName', 'clientId', 'location', 'contractValue', 'progress', 'startDate', 'endDate', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectScalarFieldEnum = z.infer<typeof ProjectScalarFieldEnumSchema>;

// File: ProjectMemberScalarFieldEnum.schema.ts

export const ProjectMemberScalarFieldEnumSchema = z.enum(['id', 'projectId', 'userId', 'role', 'assignedAt', 'assignedById'])

export type ProjectMemberScalarFieldEnum = z.infer<typeof ProjectMemberScalarFieldEnumSchema>;

// File: ProjectDailyReportScalarFieldEnum.schema.ts

export const ProjectDailyReportScalarFieldEnumSchema = z.enum(['id', 'projectId', 'reportDate', 'manpower', 'equipment', 'workDone', 'blockers', 'weather', 'createdById', 'createdAt'])

export type ProjectDailyReportScalarFieldEnum = z.infer<typeof ProjectDailyReportScalarFieldEnumSchema>;

// File: ProjectPhotoScalarFieldEnum.schema.ts

export const ProjectPhotoScalarFieldEnumSchema = z.enum(['id', 'projectId', 'url', 'caption', 'category', 'takenAt', 'uploadedById', 'createdAt'])

export type ProjectPhotoScalarFieldEnum = z.infer<typeof ProjectPhotoScalarFieldEnumSchema>;

// File: ProjectIssueScalarFieldEnum.schema.ts

export const ProjectIssueScalarFieldEnumSchema = z.enum(['id', 'projectId', 'title', 'description', 'severity', 'status', 'dueDate', 'assigneeId', 'createdById', 'resolvedAt', 'createdAt'])

export type ProjectIssueScalarFieldEnum = z.infer<typeof ProjectIssueScalarFieldEnumSchema>;

// File: ProjectProgressUpdateScalarFieldEnum.schema.ts

export const ProjectProgressUpdateScalarFieldEnumSchema = z.enum(['id', 'projectId', 'progress', 'phaseLabel', 'note', 'createdById', 'createdAt'])

export type ProjectProgressUpdateScalarFieldEnum = z.infer<typeof ProjectProgressUpdateScalarFieldEnumSchema>;

// File: ProjectExpenseScalarFieldEnum.schema.ts

export const ProjectExpenseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'date', 'category', 'amount', 'vendorName', 'note', 'attachmentUrl', 'subcontractContractId', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectExpenseScalarFieldEnum = z.infer<typeof ProjectExpenseScalarFieldEnumSchema>;

// File: ProjectClaimScalarFieldEnum.schema.ts

export const ProjectClaimScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'claimNo', 'periodStart', 'periodEnd', 'amount', 'dueDate', 'status', 'note', 'createdById', 'approvedAt', 'paidAt', 'createdAt', 'updatedAt'])

export type ProjectClaimScalarFieldEnum = z.infer<typeof ProjectClaimScalarFieldEnumSchema>;

// File: SubcontractContractScalarFieldEnum.schema.ts

export const SubcontractContractScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'contractNo', 'name', 'contractorType', 'companyName', 'phone', 'email', 'taxNumber', 'crNumber', 'status', 'value', 'startDate', 'endDate', 'signedDate', 'scopeOfWork', 'notes', 'includesVat', 'vatPercent', 'retentionPercent', 'retentionCapPercent', 'advancePaymentPercent', 'advancePaymentAmount', 'paymentMethod', 'attachmentUrl', 'createdById', 'createdAt', 'updatedAt'])

export type SubcontractContractScalarFieldEnum = z.infer<typeof SubcontractContractScalarFieldEnumSchema>;

// File: SubcontractPaymentTermScalarFieldEnum.schema.ts

export const SubcontractPaymentTermScalarFieldEnumSchema = z.enum(['id', 'contractId', 'type', 'label', 'percent', 'amount', 'dueDate', 'sortOrder', 'createdAt', 'updatedAt'])

export type SubcontractPaymentTermScalarFieldEnum = z.infer<typeof SubcontractPaymentTermScalarFieldEnumSchema>;

// File: SubcontractChangeOrderScalarFieldEnum.schema.ts

export const SubcontractChangeOrderScalarFieldEnumSchema = z.enum(['id', 'contractId', 'orderNo', 'description', 'amount', 'status', 'approvedDate', 'attachmentUrl', 'createdById', 'createdAt', 'updatedAt'])

export type SubcontractChangeOrderScalarFieldEnum = z.infer<typeof SubcontractChangeOrderScalarFieldEnumSchema>;

// File: SubcontractPaymentScalarFieldEnum.schema.ts

export const SubcontractPaymentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'contractId', 'termId', 'claimId', 'paymentNo', 'amount', 'date', 'paymentMethod', 'referenceNo', 'description', 'notes', 'status', 'voucherNo', 'sourceAccountId', 'createdById', 'createdAt', 'updatedAt'])

export type SubcontractPaymentScalarFieldEnum = z.infer<typeof SubcontractPaymentScalarFieldEnumSchema>;

// File: SubcontractItemScalarFieldEnum.schema.ts

export const SubcontractItemScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'contractId', 'itemCode', 'description', 'descriptionEn', 'unit', 'contractQty', 'unitPrice', 'totalAmount', 'sortOrder', 'category', 'isLumpSum', 'createdById', 'createdAt', 'updatedAt'])

export type SubcontractItemScalarFieldEnum = z.infer<typeof SubcontractItemScalarFieldEnumSchema>;

// File: SubcontractClaimScalarFieldEnum.schema.ts

export const SubcontractClaimScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'contractId', 'claimNo', 'title', 'claimType', 'status', 'periodStart', 'periodEnd', 'grossAmount', 'retentionAmount', 'advanceDeduction', 'vatAmount', 'netAmount', 'paidAmount', 'penaltyAmount', 'otherDeductions', 'otherDeductionsNote', 'notes', 'rejectionReason', 'printedAt', 'submittedAt', 'approvedAt', 'approvedById', 'createdById', 'createdAt', 'updatedAt'])

export type SubcontractClaimScalarFieldEnum = z.infer<typeof SubcontractClaimScalarFieldEnumSchema>;

// File: SubcontractClaimItemScalarFieldEnum.schema.ts

export const SubcontractClaimItemScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'claimId', 'contractItemId', 'contractQty', 'unitPrice', 'prevCumulativeQty', 'thisQty', 'thisAmount', 'createdAt', 'updatedAt'])

export type SubcontractClaimItemScalarFieldEnum = z.infer<typeof SubcontractClaimItemScalarFieldEnumSchema>;

// File: ProjectContractScalarFieldEnum.schema.ts

export const ProjectContractScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'contractNo', 'title', 'clientName', 'description', 'status', 'value', 'currency', 'signedDate', 'startDate', 'endDate', 'retentionPercent', 'retentionCap', 'retentionReleaseDays', 'includesVat', 'vatPercent', 'paymentMethod', 'performanceBondPercent', 'performanceBondAmount', 'insuranceRequired', 'insuranceDetails', 'scopeOfWork', 'penaltyPercent', 'penaltyCapPercent', 'notes', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectContractScalarFieldEnum = z.infer<typeof ProjectContractScalarFieldEnumSchema>;

// File: ContractPaymentTermScalarFieldEnum.schema.ts

export const ContractPaymentTermScalarFieldEnumSchema = z.enum(['id', 'contractId', 'type', 'label', 'percent', 'amount', 'dueDate', 'milestoneId', 'sortOrder', 'status', 'paidAmount', 'note', 'createdAt', 'updatedAt'])

export type ContractPaymentTermScalarFieldEnum = z.infer<typeof ContractPaymentTermScalarFieldEnumSchema>;

// File: ProjectPaymentScalarFieldEnum.schema.ts

export const ProjectPaymentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'contractTermId', 'paymentNo', 'amount', 'date', 'paymentMethod', 'referenceNo', 'description', 'note', 'destinationAccountId', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectPaymentScalarFieldEnum = z.infer<typeof ProjectPaymentScalarFieldEnumSchema>;

// File: ProjectDocumentScalarFieldEnum.schema.ts

export const ProjectDocumentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'folder', 'title', 'description', 'fileUrl', 'version', 'fileName', 'fileSize', 'mimeType', 'storagePath', 'thumbnailPath', 'uploadType', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectDocumentScalarFieldEnum = z.infer<typeof ProjectDocumentScalarFieldEnumSchema>;

// File: DocumentVersionScalarFieldEnum.schema.ts

export const DocumentVersionScalarFieldEnumSchema = z.enum(['id', 'documentId', 'versionNumber', 'fileName', 'fileSize', 'fileType', 'storagePath', 'uploadedBy', 'changeNotes', 'createdAt'])

export type DocumentVersionScalarFieldEnum = z.infer<typeof DocumentVersionScalarFieldEnumSchema>;

// File: ProjectApprovalScalarFieldEnum.schema.ts

export const ProjectApprovalScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'documentId', 'status', 'note', 'requestedById', 'requestedAt', 'decidedAt', 'decisionNote', 'createdAt', 'updatedAt'])

export type ProjectApprovalScalarFieldEnum = z.infer<typeof ProjectApprovalScalarFieldEnumSchema>;

// File: ProjectApprovalApproverScalarFieldEnum.schema.ts

export const ProjectApprovalApproverScalarFieldEnumSchema = z.enum(['id', 'approvalId', 'userId', 'status', 'decidedAt', 'note'])

export type ProjectApprovalApproverScalarFieldEnum = z.infer<typeof ProjectApprovalApproverScalarFieldEnumSchema>;

// File: ProjectAuditLogScalarFieldEnum.schema.ts

export const ProjectAuditLogScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'actorId', 'action', 'entityType', 'entityId', 'metadata', 'createdAt'])

export type ProjectAuditLogScalarFieldEnum = z.infer<typeof ProjectAuditLogScalarFieldEnumSchema>;

// File: ProjectMessageScalarFieldEnum.schema.ts

export const ProjectMessageScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'channel', 'senderId', 'content', 'isUpdate', 'createdAt'])

export type ProjectMessageScalarFieldEnum = z.infer<typeof ProjectMessageScalarFieldEnumSchema>;

// File: ChatLastReadScalarFieldEnum.schema.ts

export const ChatLastReadScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'userId', 'channel', 'lastReadAt'])

export type ChatLastReadScalarFieldEnum = z.infer<typeof ChatLastReadScalarFieldEnumSchema>;

// File: NotificationScalarFieldEnum.schema.ts

export const NotificationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'title', 'body', 'projectId', 'entityType', 'entityId', 'channel', 'deliveryStatus', 'dedupeKey', 'metadata', 'createdAt', 'readAt', 'sentAt'])

export type NotificationScalarFieldEnum = z.infer<typeof NotificationScalarFieldEnumSchema>;

// File: NotificationPreferenceScalarFieldEnum.schema.ts

export const NotificationPreferenceScalarFieldEnumSchema = z.enum(['id', 'userId', 'organizationId', 'approvalRequested', 'approvalDecided', 'documentCreated', 'dailyReportCreated', 'issueCreated', 'issueCritical', 'expenseCreated', 'claimCreated', 'claimStatusChanged', 'changeOrderCreated', 'ownerMessage', 'teamMemberAdded', 'emailDigest', 'muteAll', 'createdAt', 'updatedAt'])

export type NotificationPreferenceScalarFieldEnum = z.infer<typeof NotificationPreferenceScalarFieldEnumSchema>;

// File: ProjectOwnerAccessScalarFieldEnum.schema.ts

export const ProjectOwnerAccessScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'token', 'label', 'expiresAt', 'isRevoked', 'createdById', 'createdAt'])

export type ProjectOwnerAccessScalarFieldEnum = z.infer<typeof ProjectOwnerAccessScalarFieldEnumSchema>;

// File: OwnerPortalSessionScalarFieldEnum.schema.ts

export const OwnerPortalSessionScalarFieldEnumSchema = z.enum(['id', 'sessionToken', 'portalAccessId', 'expiresAt', 'ipAddress', 'userAgent', 'lastAccessedAt', 'createdAt'])

export type OwnerPortalSessionScalarFieldEnum = z.infer<typeof OwnerPortalSessionScalarFieldEnumSchema>;

// File: ProjectCalendarScalarFieldEnum.schema.ts

export const ProjectCalendarScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'name', 'workDays', 'holidays', 'defaultHoursPerDay', 'isDefault', 'createdAt', 'updatedAt'])

export type ProjectCalendarScalarFieldEnum = z.infer<typeof ProjectCalendarScalarFieldEnumSchema>;

// File: ProjectActivityScalarFieldEnum.schema.ts

export const ProjectActivityScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'milestoneId', 'title', 'description', 'wbsCode', 'plannedStart', 'plannedEnd', 'duration', 'actualStart', 'actualEnd', 'status', 'progress', 'isCritical', 'weight', 'assigneeId', 'calendarId', 'orderIndex', 'notes', 'createdAt', 'updatedAt'])

export type ProjectActivityScalarFieldEnum = z.infer<typeof ProjectActivityScalarFieldEnumSchema>;

// File: ActivityDependencyScalarFieldEnum.schema.ts

export const ActivityDependencyScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'predecessorId', 'successorId', 'dependencyType', 'lagDays', 'createdAt'])

export type ActivityDependencyScalarFieldEnum = z.infer<typeof ActivityDependencyScalarFieldEnumSchema>;

// File: ActivityChecklistScalarFieldEnum.schema.ts

export const ActivityChecklistScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'activityId', 'title', 'isCompleted', 'completedAt', 'completedById', 'orderIndex', 'createdAt', 'updatedAt'])

export type ActivityChecklistScalarFieldEnum = z.infer<typeof ActivityChecklistScalarFieldEnumSchema>;

// File: ProjectBaselineScalarFieldEnum.schema.ts

export const ProjectBaselineScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'name', 'description', 'snapshotDate', 'snapshotData', 'isActive', 'createdById', 'createdAt'])

export type ProjectBaselineScalarFieldEnum = z.infer<typeof ProjectBaselineScalarFieldEnumSchema>;

// File: ProjectMilestoneScalarFieldEnum.schema.ts

export const ProjectMilestoneScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'title', 'description', 'orderIndex', 'plannedStart', 'plannedEnd', 'actualStart', 'actualEnd', 'status', 'progress', 'isCritical', 'weight', 'color', 'progressMethod', 'baselineStartDate', 'baselineEndDate', 'calendarId', 'plannedDate', 'actualDate', 'isCompleted', 'sortOrder', 'createdAt', 'updatedAt'])

export type ProjectMilestoneScalarFieldEnum = z.infer<typeof ProjectMilestoneScalarFieldEnumSchema>;

// File: AttachmentScalarFieldEnum.schema.ts

export const AttachmentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'ownerType', 'ownerId', 'fileName', 'fileSize', 'mimeType', 'storagePath', 'uploadId', 'uploadedById', 'createdAt'])

export type AttachmentScalarFieldEnum = z.infer<typeof AttachmentScalarFieldEnumSchema>;

// File: ProjectTemplateScalarFieldEnum.schema.ts

export const ProjectTemplateScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'description', 'sourceProjectId', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectTemplateScalarFieldEnum = z.infer<typeof ProjectTemplateScalarFieldEnumSchema>;

// File: ProjectTemplateItemScalarFieldEnum.schema.ts

export const ProjectTemplateItemScalarFieldEnumSchema = z.enum(['id', 'templateId', 'type', 'title', 'description', 'sortOrder', 'metadata', 'createdAt'])

export type ProjectTemplateItemScalarFieldEnum = z.infer<typeof ProjectTemplateItemScalarFieldEnumSchema>;

// File: ProjectAlertScalarFieldEnum.schema.ts

export const ProjectAlertScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'type', 'severity', 'title', 'description', 'dedupeKey', 'acknowledgedAt', 'acknowledgedById', 'createdAt'])

export type ProjectAlertScalarFieldEnum = z.infer<typeof ProjectAlertScalarFieldEnumSchema>;

// File: DigestSubscriptionScalarFieldEnum.schema.ts

export const DigestSubscriptionScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'projectId', 'frequency', 'channel', 'isEnabled', 'createdAt', 'updatedAt'])

export type DigestSubscriptionScalarFieldEnum = z.infer<typeof DigestSubscriptionScalarFieldEnumSchema>;

// File: OrganizationIntegrationSettingsScalarFieldEnum.schema.ts

export const OrganizationIntegrationSettingsScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'emailEnabled', 'whatsappEnabled', 'smsEnabled', 'defaultChannel', 'ownerNotifyOnOfficialUpdate', 'ownerNotifyOnPaymentDue', 'createdAt', 'updatedAt'])

export type OrganizationIntegrationSettingsScalarFieldEnum = z.infer<typeof OrganizationIntegrationSettingsScalarFieldEnumSchema>;

// File: OrganizationFinanceSettingsScalarFieldEnum.schema.ts

export const OrganizationFinanceSettingsScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'companyNameAr', 'companyNameEn', 'logo', 'address', 'addressEn', 'buildingNumber', 'street', 'secondaryNumber', 'postalCode', 'city', 'phone', 'email', 'website', 'taxNumber', 'commercialReg', 'bankName', 'bankNameEn', 'accountName', 'iban', 'accountNumber', 'swiftCode', 'headerText', 'footerText', 'thankYouMessage', 'defaultVatPercent', 'defaultCurrency', 'defaultPaymentTerms', 'defaultDeliveryTerms', 'defaultWarrantyTerms', 'quotationValidityDays', 'createdAt', 'updatedAt'])

export type OrganizationFinanceSettingsScalarFieldEnum = z.infer<typeof OrganizationFinanceSettingsScalarFieldEnumSchema>;

// File: MessageDeliveryLogScalarFieldEnum.schema.ts

export const MessageDeliveryLogScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'channel', 'recipient', 'subject', 'content', 'status', 'provider', 'errorMessage', 'sentById', 'createdAt'])

export type MessageDeliveryLogScalarFieldEnum = z.infer<typeof MessageDeliveryLogScalarFieldEnumSchema>;

// File: ShareLinkScalarFieldEnum.schema.ts

export const ShareLinkScalarFieldEnumSchema = z.enum(['id', 'token', 'organizationId', 'projectId', 'resourceType', 'resourceId', 'expiresAt', 'isRevoked', 'createdById', 'createdAt'])

export type ShareLinkScalarFieldEnum = z.infer<typeof ShareLinkScalarFieldEnumSchema>;

// File: ProjectChangeOrderScalarFieldEnum.schema.ts

export const ProjectChangeOrderScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'coNo', 'title', 'description', 'category', 'status', 'costImpact', 'currency', 'timeImpactDays', 'milestoneId', 'claimId', 'contractId', 'requestedById', 'requestedAt', 'decidedById', 'decidedAt', 'decisionNote', 'implementedAt', 'implementedById', 'createdAt', 'updatedAt'])

export type ProjectChangeOrderScalarFieldEnum = z.infer<typeof ProjectChangeOrderScalarFieldEnumSchema>;

// File: ProjectBOQItemScalarFieldEnum.schema.ts

export const ProjectBOQItemScalarFieldEnumSchema = z.enum(['id', 'projectId', 'organizationId', 'sourceType', 'costStudyId', 'sourceItemId', 'quotationId', 'sortOrder', 'section', 'category', 'code', 'description', 'specifications', 'unit', 'quantity', 'unitPrice', 'totalPrice', 'projectPhaseId', 'notes', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectBOQItemScalarFieldEnum = z.infer<typeof ProjectBOQItemScalarFieldEnumSchema>;

// File: ClientScalarFieldEnum.schema.ts

export const ClientScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'clientType', 'firstName', 'lastName', 'businessName', 'name', 'company', 'phone', 'mobile', 'email', 'address', 'streetAddress1', 'streetAddress2', 'city', 'region', 'postalCode', 'country', 'secondaryAddress', 'code', 'currency', 'displayLanguage', 'classification', 'taxNumber', 'crNumber', 'notes', 'isActive', 'createdById', 'createdAt', 'updatedAt'])

export type ClientScalarFieldEnum = z.infer<typeof ClientScalarFieldEnumSchema>;

// File: ClientContactScalarFieldEnum.schema.ts

export const ClientContactScalarFieldEnumSchema = z.enum(['id', 'clientId', 'name', 'position', 'phone', 'mobile', 'email', 'isPrimary', 'notes', 'createdAt', 'updatedAt'])

export type ClientContactScalarFieldEnum = z.infer<typeof ClientContactScalarFieldEnumSchema>;

// File: QuotationScalarFieldEnum.schema.ts

export const QuotationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'quotationNo', 'clientId', 'clientName', 'clientCompany', 'clientPhone', 'clientEmail', 'clientAddress', 'clientTaxNumber', 'projectId', 'status', 'subtotal', 'discountPercent', 'discountAmount', 'vatPercent', 'vatAmount', 'totalAmount', 'validUntil', 'paymentTerms', 'deliveryTerms', 'warrantyTerms', 'notes', 'introduction', 'termsAndConditions', 'templateId', 'viewedAt', 'sentAt', 'acceptedAt', 'rejectedAt', 'createdById', 'createdAt', 'updatedAt', 'costStudyId'])

export type QuotationScalarFieldEnum = z.infer<typeof QuotationScalarFieldEnumSchema>;

// File: QuotationItemScalarFieldEnum.schema.ts

export const QuotationItemScalarFieldEnumSchema = z.enum(['id', 'quotationId', 'description', 'quantity', 'unit', 'unitPrice', 'totalPrice', 'sortOrder', 'createdAt', 'updatedAt'])

export type QuotationItemScalarFieldEnum = z.infer<typeof QuotationItemScalarFieldEnumSchema>;

// File: QuotationDisplayConfigScalarFieldEnum.schema.ts

export const QuotationDisplayConfigScalarFieldEnumSchema = z.enum(['id', 'quotationId', 'quoteId', 'format', 'grouping', 'showItemNumber', 'showDescription', 'showSpecifications', 'showQuantity', 'showUnit', 'showUnitPrice', 'showItemTotal', 'showStructural', 'showFinishing', 'showMEP', 'showManualItems', 'showMaterialDetails', 'showSectionSubtotal', 'showSubtotal', 'showDiscount', 'showVAT', 'showGrandTotal', 'showPricePerSqm', 'totalArea', 'pricePerSqm', 'lumpSumAmount', 'lumpSumDescription', 'createdAt', 'updatedAt'])

export type QuotationDisplayConfigScalarFieldEnum = z.infer<typeof QuotationDisplayConfigScalarFieldEnumSchema>;

// File: QuotationContentBlockScalarFieldEnum.schema.ts

export const QuotationContentBlockScalarFieldEnumSchema = z.enum(['id', 'quotationId', 'title', 'content', 'position', 'sortOrder', 'createdAt', 'updatedAt'])

export type QuotationContentBlockScalarFieldEnum = z.infer<typeof QuotationContentBlockScalarFieldEnumSchema>;

// File: FinanceInvoiceScalarFieldEnum.schema.ts

export const FinanceInvoiceScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'invoiceNo', 'invoiceType', 'clientId', 'clientName', 'clientCompany', 'clientPhone', 'clientEmail', 'clientAddress', 'clientTaxNumber', 'projectId', 'quotationId', 'status', 'issueDate', 'dueDate', 'subtotal', 'discountPercent', 'discountAmount', 'vatPercent', 'vatAmount', 'totalAmount', 'paidAmount', 'sellerName', 'sellerAddress', 'sellerPhone', 'relatedInvoiceId', 'issuedAt', 'sellerTaxNumber', 'qrCode', 'zatcaUuid', 'zatcaHash', 'zatcaSignature', 'zatcaInvoiceType', 'zatcaSubmissionStatus', 'zatcaCounterValue', 'zatcaPreviousHash', 'zatcaXml', 'zatcaClearedXml', 'zatcaSubmittedAt', 'zatcaClearedAt', 'paymentTerms', 'notes', 'templateId', 'viewedAt', 'sentAt', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceInvoiceScalarFieldEnum = z.infer<typeof FinanceInvoiceScalarFieldEnumSchema>;

// File: FinanceInvoiceItemScalarFieldEnum.schema.ts

export const FinanceInvoiceItemScalarFieldEnumSchema = z.enum(['id', 'invoiceId', 'description', 'quantity', 'unit', 'unitPrice', 'totalPrice', 'sortOrder', 'createdAt', 'updatedAt'])

export type FinanceInvoiceItemScalarFieldEnum = z.infer<typeof FinanceInvoiceItemScalarFieldEnumSchema>;

// File: FinanceInvoicePaymentScalarFieldEnum.schema.ts

export const FinanceInvoicePaymentScalarFieldEnumSchema = z.enum(['id', 'invoiceId', 'amount', 'paymentDate', 'paymentMethod', 'referenceNo', 'notes', 'sourceAccountId', 'createdById', 'createdAt'])

export type FinanceInvoicePaymentScalarFieldEnum = z.infer<typeof FinanceInvoicePaymentScalarFieldEnumSchema>;

// File: OpenDocumentScalarFieldEnum.schema.ts

export const OpenDocumentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'documentNo', 'documentType', 'title', 'content', 'clientId', 'projectId', 'recipientName', 'recipientCompany', 'recipientAddress', 'templateId', 'createdById', 'createdAt', 'updatedAt'])

export type OpenDocumentScalarFieldEnum = z.infer<typeof OpenDocumentScalarFieldEnumSchema>;

// File: FinanceTemplateScalarFieldEnum.schema.ts

export const FinanceTemplateScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'description', 'templateType', 'isDefault', 'content', 'settings', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceTemplateScalarFieldEnum = z.infer<typeof FinanceTemplateScalarFieldEnumSchema>;

// File: OrganizationBankScalarFieldEnum.schema.ts

export const OrganizationBankScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'accountNumber', 'bankName', 'iban', 'accountType', 'openingBalance', 'balance', 'currency', 'isActive', 'isDefault', 'notes', 'createdById', 'createdAt', 'updatedAt', 'chartAccountId'])

export type OrganizationBankScalarFieldEnum = z.infer<typeof OrganizationBankScalarFieldEnumSchema>;

// File: FinanceExpenseScalarFieldEnum.schema.ts

export const FinanceExpenseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'expenseNo', 'category', 'customCategory', 'categoryId', 'subcategoryId', 'description', 'amount', 'date', 'sourceAccountId', 'vendorName', 'vendorTaxNumber', 'projectId', 'invoiceRef', 'paymentMethod', 'referenceNo', 'status', 'sourceType', 'sourceId', 'paidAmount', 'dueDate', 'notes', 'voucherNo', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceExpenseScalarFieldEnum = z.infer<typeof FinanceExpenseScalarFieldEnumSchema>;

// File: FinancePaymentScalarFieldEnum.schema.ts

export const FinancePaymentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'paymentNo', 'amount', 'date', 'destinationAccountId', 'clientId', 'clientName', 'projectId', 'invoiceId', 'contractTermId', 'paymentMethod', 'referenceNo', 'status', 'description', 'notes', 'createdById', 'createdAt', 'updatedAt'])

export type FinancePaymentScalarFieldEnum = z.infer<typeof FinancePaymentScalarFieldEnumSchema>;

// File: FinanceTransferScalarFieldEnum.schema.ts

export const FinanceTransferScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'transferNo', 'amount', 'date', 'fromAccountId', 'toAccountId', 'status', 'description', 'notes', 'referenceNo', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceTransferScalarFieldEnum = z.infer<typeof FinanceTransferScalarFieldEnumSchema>;

// File: CompanyExpenseScalarFieldEnum.schema.ts

export const CompanyExpenseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'category', 'description', 'categoryId', 'subcategoryId', 'amount', 'recurrence', 'vendor', 'contractNumber', 'startDate', 'endDate', 'reminderDays', 'isActive', 'notes', 'createdAt', 'updatedAt'])

export type CompanyExpenseScalarFieldEnum = z.infer<typeof CompanyExpenseScalarFieldEnumSchema>;

// File: CompanyExpensePaymentScalarFieldEnum.schema.ts

export const CompanyExpensePaymentScalarFieldEnumSchema = z.enum(['id', 'expenseId', 'periodStart', 'periodEnd', 'amount', 'isPaid', 'paidAt', 'dueDate', 'bankAccountId', 'referenceNo', 'notes', 'financeExpenseId', 'createdAt', 'updatedAt'])

export type CompanyExpensePaymentScalarFieldEnum = z.infer<typeof CompanyExpensePaymentScalarFieldEnumSchema>;

// File: CompanyExpenseAllocationScalarFieldEnum.schema.ts

export const CompanyExpenseAllocationScalarFieldEnumSchema = z.enum(['id', 'expenseId', 'projectId', 'percentage', 'notes', 'createdAt', 'updatedAt'])

export type CompanyExpenseAllocationScalarFieldEnum = z.infer<typeof CompanyExpenseAllocationScalarFieldEnumSchema>;

// File: EmployeeScalarFieldEnum.schema.ts

export const EmployeeScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'linkedUserId', 'name', 'employeeNo', 'type', 'phone', 'email', 'nationalId', 'salaryType', 'baseSalary', 'housingAllowance', 'transportAllowance', 'otherAllowances', 'gosiSubscription', 'joinDate', 'endDate', 'status', 'notes', 'createdAt', 'updatedAt'])

export type EmployeeScalarFieldEnum = z.infer<typeof EmployeeScalarFieldEnumSchema>;

// File: EmployeeChangeLogScalarFieldEnum.schema.ts

export const EmployeeChangeLogScalarFieldEnumSchema = z.enum(['id', 'employeeId', 'organizationId', 'changedBy', 'changeType', 'fieldName', 'oldValue', 'newValue', 'notes', 'createdAt'])

export type EmployeeChangeLogScalarFieldEnum = z.infer<typeof EmployeeChangeLogScalarFieldEnumSchema>;

// File: LeaveTypeScalarFieldEnum.schema.ts

export const LeaveTypeScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'nameEn', 'daysPerYear', 'isPaid', 'requiresApproval', 'color', 'createdAt', 'updatedAt'])

export type LeaveTypeScalarFieldEnum = z.infer<typeof LeaveTypeScalarFieldEnumSchema>;

// File: LeaveBalanceScalarFieldEnum.schema.ts

export const LeaveBalanceScalarFieldEnumSchema = z.enum(['id', 'employeeId', 'leaveTypeId', 'year', 'totalDays', 'usedDays', 'remainingDays'])

export type LeaveBalanceScalarFieldEnum = z.infer<typeof LeaveBalanceScalarFieldEnumSchema>;

// File: LeaveRequestScalarFieldEnum.schema.ts

export const LeaveRequestScalarFieldEnumSchema = z.enum(['id', 'employeeId', 'organizationId', 'leaveTypeId', 'startDate', 'endDate', 'totalDays', 'reason', 'status', 'approvedBy', 'approvedAt', 'rejectionReason', 'createdAt', 'updatedAt'])

export type LeaveRequestScalarFieldEnum = z.infer<typeof LeaveRequestScalarFieldEnumSchema>;

// File: EmployeeProjectAssignmentScalarFieldEnum.schema.ts

export const EmployeeProjectAssignmentScalarFieldEnumSchema = z.enum(['id', 'employeeId', 'projectId', 'percentage', 'startDate', 'endDate', 'isActive', 'notes', 'createdAt', 'updatedAt'])

export type EmployeeProjectAssignmentScalarFieldEnum = z.infer<typeof EmployeeProjectAssignmentScalarFieldEnumSchema>;

// File: CompanyAssetScalarFieldEnum.schema.ts

export const CompanyAssetScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'assetNo', 'category', 'type', 'status', 'brand', 'model', 'serialNumber', 'year', 'description', 'purchasePrice', 'monthlyRent', 'currentValue', 'purchaseDate', 'warrantyExpiry', 'insuranceExpiry', 'currentProjectId', 'assignedAt', 'notes', 'createdAt', 'updatedAt'])

export type CompanyAssetScalarFieldEnum = z.infer<typeof CompanyAssetScalarFieldEnumSchema>;

// File: PayrollRunScalarFieldEnum.schema.ts

export const PayrollRunScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'runNo', 'month', 'year', 'totalBaseSalary', 'totalAllowances', 'totalDeductions', 'totalNetSalary', 'employeeCount', 'status', 'approvedById', 'approvedAt', 'sourceAccountId', 'createdById', 'notes', 'createdAt', 'updatedAt'])

export type PayrollRunScalarFieldEnum = z.infer<typeof PayrollRunScalarFieldEnumSchema>;

// File: PayrollRunItemScalarFieldEnum.schema.ts

export const PayrollRunItemScalarFieldEnumSchema = z.enum(['id', 'payrollRunId', 'employeeId', 'baseSalary', 'housingAllowance', 'transportAllowance', 'otherAllowances', 'gosiDeduction', 'otherDeductions', 'netSalary', 'financeExpenseId', 'notes', 'createdAt', 'updatedAt'])

export type PayrollRunItemScalarFieldEnum = z.infer<typeof PayrollRunItemScalarFieldEnumSchema>;

// File: CompanyExpenseRunScalarFieldEnum.schema.ts

export const CompanyExpenseRunScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'runNo', 'month', 'year', 'totalAmount', 'itemCount', 'status', 'postedById', 'postedAt', 'createdById', 'notes', 'createdAt', 'updatedAt'])

export type CompanyExpenseRunScalarFieldEnum = z.infer<typeof CompanyExpenseRunScalarFieldEnumSchema>;

// File: CompanyExpenseRunItemScalarFieldEnum.schema.ts

export const CompanyExpenseRunItemScalarFieldEnumSchema = z.enum(['id', 'expenseRunId', 'companyExpenseId', 'name', 'category', 'vendor', 'originalAmount', 'amount', 'financeExpenseId', 'notes', 'createdAt', 'updatedAt'])

export type CompanyExpenseRunItemScalarFieldEnum = z.infer<typeof CompanyExpenseRunItemScalarFieldEnumSchema>;

// File: OrganizationAuditLogScalarFieldEnum.schema.ts

export const OrganizationAuditLogScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'actorId', 'action', 'entityType', 'entityId', 'metadata', 'ipAddress', 'createdAt'])

export type OrganizationAuditLogScalarFieldEnum = z.infer<typeof OrganizationAuditLogScalarFieldEnumSchema>;

// File: OrganizationSequenceScalarFieldEnum.schema.ts

export const OrganizationSequenceScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'sequenceKey', 'currentValue', 'updatedAt'])

export type OrganizationSequenceScalarFieldEnum = z.infer<typeof OrganizationSequenceScalarFieldEnumSchema>;

// File: AiChatUsageScalarFieldEnum.schema.ts

export const AiChatUsageScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'totalChats', 'updatedAt'])

export type AiChatUsageScalarFieldEnum = z.infer<typeof AiChatUsageScalarFieldEnumSchema>;

// File: OnboardingProgressScalarFieldEnum.schema.ts

export const OnboardingProgressScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'companyInfoDone', 'logoDone', 'templateDone', 'firstProjectDone', 'teamInviteDone', 'wizardCompleted', 'wizardCompletedAt', 'wizardSkippedSteps', 'firstQuantityAdded', 'firstInvoiceCreated', 'firstExpenseRecorded', 'zatcaInfoComplete', 'checklistDismissed', 'checklistDismissedAt', 'createdAt', 'updatedAt'])

export type OnboardingProgressScalarFieldEnum = z.infer<typeof OnboardingProgressScalarFieldEnumSchema>;

// File: LeadScalarFieldEnum.schema.ts

export const LeadScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'createdById', 'name', 'phone', 'email', 'company', 'clientType', 'projectType', 'projectLocation', 'estimatedArea', 'estimatedValue', 'status', 'source', 'priority', 'assignedToId', 'expectedCloseDate', 'lostReason', 'notes', 'costStudyId', 'quotationId', 'convertedProjectId', 'createdAt', 'updatedAt'])

export type LeadScalarFieldEnum = z.infer<typeof LeadScalarFieldEnumSchema>;

// File: LeadFileScalarFieldEnum.schema.ts

export const LeadFileScalarFieldEnumSchema = z.enum(['id', 'leadId', 'organizationId', 'createdById', 'name', 'fileUrl', 'storagePath', 'fileSize', 'mimeType', 'category', 'description', 'createdAt'])

export type LeadFileScalarFieldEnum = z.infer<typeof LeadFileScalarFieldEnumSchema>;

// File: LeadActivityScalarFieldEnum.schema.ts

export const LeadActivityScalarFieldEnumSchema = z.enum(['id', 'leadId', 'organizationId', 'createdById', 'type', 'content', 'metadata', 'createdAt'])

export type LeadActivityScalarFieldEnum = z.infer<typeof LeadActivityScalarFieldEnumSchema>;

// File: ActivationCodeScalarFieldEnum.schema.ts

export const ActivationCodeScalarFieldEnumSchema = z.enum(['id', 'code', 'description', 'planType', 'durationDays', 'maxUsers', 'maxProjects', 'maxStorageGB', 'isActive', 'maxUses', 'usedCount', 'createdById', 'createdAt', 'updatedAt', 'expiresAt'])

export type ActivationCodeScalarFieldEnum = z.infer<typeof ActivationCodeScalarFieldEnumSchema>;

// File: ActivationCodeUsageScalarFieldEnum.schema.ts

export const ActivationCodeUsageScalarFieldEnumSchema = z.enum(['id', 'codeId', 'organizationId', 'activatedById', 'activatedAt', 'planExpiresAt'])

export type ActivationCodeUsageScalarFieldEnum = z.infer<typeof ActivationCodeUsageScalarFieldEnumSchema>;

// File: CostingItemScalarFieldEnum.schema.ts

export const CostingItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'organizationId', 'section', 'sourceItemId', 'sourceItemType', 'description', 'unit', 'quantity', 'materialUnitCost', 'materialTotal', 'laborType', 'laborUnitCost', 'laborQuantity', 'laborWorkers', 'laborSalary', 'laborMonths', 'laborTotal', 'storageCostPercent', 'storageCostFixed', 'storageTotal', 'otherCosts', 'totalCost', 'sortOrder', 'createdAt', 'updatedAt'])

export type CostingItemScalarFieldEnum = z.infer<typeof CostingItemScalarFieldEnumSchema>;

// File: ManualItemScalarFieldEnum.schema.ts

export const ManualItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'organizationId', 'description', 'unit', 'quantity', 'section', 'notes', 'sortOrder', 'createdAt', 'updatedAt'])

export type ManualItemScalarFieldEnum = z.infer<typeof ManualItemScalarFieldEnumSchema>;

// File: SectionMarkupScalarFieldEnum.schema.ts

export const SectionMarkupScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'organizationId', 'section', 'markupPercent'])

export type SectionMarkupScalarFieldEnum = z.infer<typeof SectionMarkupScalarFieldEnumSchema>;

// File: ChartAccountScalarFieldEnum.schema.ts

export const ChartAccountScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'code', 'nameAr', 'nameEn', 'description', 'type', 'normalBalance', 'level', 'parentId', 'isSystem', 'isActive', 'isPostable', 'createdAt', 'updatedAt'])

export type ChartAccountScalarFieldEnum = z.infer<typeof ChartAccountScalarFieldEnumSchema>;

// File: JournalEntryScalarFieldEnum.schema.ts

export const JournalEntryScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'entryNo', 'date', 'description', 'referenceType', 'referenceId', 'referenceNo', 'isAutoGenerated', 'status', 'totalAmount', 'isReversed', 'reversedById', 'reversalId', 'notes', 'adjustmentType', 'periodId', 'createdById', 'postedById', 'postedAt', 'createdAt', 'updatedAt'])

export type JournalEntryScalarFieldEnum = z.infer<typeof JournalEntryScalarFieldEnumSchema>;

// File: JournalEntryLineScalarFieldEnum.schema.ts

export const JournalEntryLineScalarFieldEnumSchema = z.enum(['id', 'journalEntryId', 'accountId', 'description', 'debit', 'credit', 'projectId', 'createdAt'])

export type JournalEntryLineScalarFieldEnum = z.infer<typeof JournalEntryLineScalarFieldEnumSchema>;

// File: OrganizationOwnerScalarFieldEnum.schema.ts

export const OrganizationOwnerScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'nameEn', 'ownershipPercent', 'nationalId', 'phone', 'email', 'drawingsAccountId', 'isActive', 'notes', 'createdById', 'createdAt', 'updatedAt'])

export type OrganizationOwnerScalarFieldEnum = z.infer<typeof OrganizationOwnerScalarFieldEnumSchema>;

// File: CapitalContributionScalarFieldEnum.schema.ts

export const CapitalContributionScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'ownerId', 'contributionNo', 'date', 'amount', 'type', 'bankAccountId', 'description', 'notes', 'journalEntryId', 'status', 'cancelledAt', 'cancelReason', 'createdById', 'createdAt', 'updatedAt'])

export type CapitalContributionScalarFieldEnum = z.infer<typeof CapitalContributionScalarFieldEnumSchema>;

// File: OwnerDrawingScalarFieldEnum.schema.ts

export const OwnerDrawingScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'drawingNo', 'date', 'amount', 'currency', 'ownerId', 'bankAccountId', 'projectId', 'type', 'description', 'notes', 'status', 'journalEntryId', 'hasOverdrawWarning', 'overdrawAmount', 'overdrawAcknowledgedBy', 'overdrawAcknowledgedAt', 'approvedById', 'approvedAt', 'cancelledAt', 'cancelReason', 'createdById', 'createdAt', 'updatedAt'])

export type OwnerDrawingScalarFieldEnum = z.infer<typeof OwnerDrawingScalarFieldEnumSchema>;

// File: YearEndClosingScalarFieldEnum.schema.ts

export const YearEndClosingScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'fiscalYear', 'closingDate', 'totalRevenue', 'totalExpenses', 'netProfit', 'totalDrawings', 'retainedEarningsTransfer', 'closingJournalEntryId', 'drawingsClosingEntryId', 'distributionDetails', 'status', 'reversedAt', 'reversedById', 'createdById', 'createdAt', 'updatedAt'])

export type YearEndClosingScalarFieldEnum = z.infer<typeof YearEndClosingScalarFieldEnumSchema>;

// File: AccountingPeriodScalarFieldEnum.schema.ts

export const AccountingPeriodScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'periodType', 'startDate', 'endDate', 'isClosed', 'closedAt', 'closedById', 'closingEntryId', 'notes', 'createdAt', 'updatedAt'])

export type AccountingPeriodScalarFieldEnum = z.infer<typeof AccountingPeriodScalarFieldEnumSchema>;

// File: RecurringJournalTemplateScalarFieldEnum.schema.ts

export const RecurringJournalTemplateScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'description', 'lines', 'totalAmount', 'frequency', 'dayOfMonth', 'isActive', 'startDate', 'endDate', 'lastGeneratedDate', 'nextDueDate', 'createdById', 'createdAt', 'updatedAt'])

export type RecurringJournalTemplateScalarFieldEnum = z.infer<typeof RecurringJournalTemplateScalarFieldEnumSchema>;

// File: BankReconciliationScalarFieldEnum.schema.ts

export const BankReconciliationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'bankAccountId', 'reconciliationDate', 'statementBalance', 'bookBalance', 'difference', 'status', 'notes', 'completedAt', 'completedById', 'createdById', 'createdAt', 'updatedAt'])

export type BankReconciliationScalarFieldEnum = z.infer<typeof BankReconciliationScalarFieldEnumSchema>;

// File: BankReconciliationItemScalarFieldEnum.schema.ts

export const BankReconciliationItemScalarFieldEnumSchema = z.enum(['id', 'reconciliationId', 'journalEntryLineId', 'isMatched', 'notes', 'createdAt'])

export type BankReconciliationItemScalarFieldEnum = z.infer<typeof BankReconciliationItemScalarFieldEnumSchema>;

// File: ReceiptVoucherScalarFieldEnum.schema.ts

export const ReceiptVoucherScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'voucherNo', 'paymentId', 'invoicePaymentId', 'projectPaymentId', 'projectId', 'clientId', 'date', 'amount', 'currency', 'amountInWords', 'receivedFrom', 'paymentMethod', 'checkNumber', 'checkDate', 'checkBank', 'bankName', 'transferRef', 'destinationAccountId', 'description', 'notes', 'status', 'printCount', 'lastPrintedAt', 'cancelledAt', 'cancelReason', 'createdById', 'createdAt', 'updatedAt'])

export type ReceiptVoucherScalarFieldEnum = z.infer<typeof ReceiptVoucherScalarFieldEnumSchema>;

// File: PaymentVoucherScalarFieldEnum.schema.ts

export const PaymentVoucherScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'voucherNo', 'expenseId', 'subcontractPaymentId', 'projectId', 'subcontractContractId', 'date', 'amount', 'currency', 'amountInWords', 'payeeName', 'payeeType', 'paymentMethod', 'checkNumber', 'checkDate', 'checkBank', 'bankName', 'transferRef', 'sourceAccountId', 'description', 'notes', 'preparedById', 'approvedById', 'approvedAt', 'rejectionReason', 'status', 'printCount', 'lastPrintedAt', 'cancelledAt', 'cancelReason', 'createdAt', 'updatedAt'])

export type PaymentVoucherScalarFieldEnum = z.infer<typeof PaymentVoucherScalarFieldEnumSchema>;

// File: HandoverProtocolScalarFieldEnum.schema.ts

export const HandoverProtocolScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'protocolNo', 'type', 'projectId', 'subcontractContractId', 'date', 'location', 'title', 'description', 'parties', 'observations', 'exceptions', 'conditions', 'warrantyStartDate', 'warrantyEndDate', 'warrantyMonths', 'retentionReleaseAmount', 'retentionReleaseDate', 'attachments', 'status', 'completedAt', 'createdById', 'createdAt', 'updatedAt'])

export type HandoverProtocolScalarFieldEnum = z.infer<typeof HandoverProtocolScalarFieldEnumSchema>;

// File: HandoverProtocolItemScalarFieldEnum.schema.ts

export const HandoverProtocolItemScalarFieldEnumSchema = z.enum(['id', 'protocolId', 'subcontractItemId', 'boqItemId', 'description', 'unit', 'contractQty', 'executedQty', 'acceptedQty', 'qualityRating', 'remarks', 'defects', 'sortOrder'])

export type HandoverProtocolItemScalarFieldEnum = z.infer<typeof HandoverProtocolItemScalarFieldEnumSchema>;

// File: ZatcaDeviceScalarFieldEnum.schema.ts

export const ZatcaDeviceScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'deviceName', 'invoiceType', 'csidCertificate', 'csidSecret', 'csidRequestId', 'csidExpiresAt', 'privateKey', 'publicKey', 'complianceCsid', 'complianceSecret', 'invoiceCounter', 'previousInvoiceHash', 'status', 'lastError', 'onboardedAt', 'createdAt', 'updatedAt'])

export type ZatcaDeviceScalarFieldEnum = z.infer<typeof ZatcaDeviceScalarFieldEnumSchema>;

// File: ZatcaSubmissionScalarFieldEnum.schema.ts

export const ZatcaSubmissionScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'invoiceId', 'deviceId', 'submissionType', 'invoiceHash', 'xmlContent', 'signedXmlContent', 'status', 'zatcaResponse', 'clearedXml', 'zatcaWarnings', 'zatcaErrors', 'attempts', 'lastAttemptAt', 'createdAt', 'updatedAt'])

export type ZatcaSubmissionScalarFieldEnum = z.infer<typeof ZatcaSubmissionScalarFieldEnumSchema>;

// File: OrgCategoryScalarFieldEnum.schema.ts

export const OrgCategoryScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'group', 'systemId', 'nameAr', 'nameEn', 'accountCode', 'isVatExempt', 'isSystem', 'isActive', 'sortOrder', 'createdAt', 'updatedAt', 'createdById'])

export type OrgCategoryScalarFieldEnum = z.infer<typeof OrgCategoryScalarFieldEnumSchema>;

// File: OrgSubcategoryScalarFieldEnum.schema.ts

export const OrgSubcategoryScalarFieldEnumSchema = z.enum(['id', 'categoryId', 'organizationId', 'systemId', 'nameAr', 'nameEn', 'isLabor', 'isSystem', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'])

export type OrgSubcategoryScalarFieldEnum = z.infer<typeof OrgSubcategoryScalarFieldEnumSchema>;

// File: QuantityItemScalarFieldEnum.schema.ts

export const QuantityItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'organizationId', 'domain', 'categoryKey', 'catalogItemKey', 'displayName', 'sortOrder', 'isEnabled', 'primaryValue', 'secondaryValue', 'tertiaryValue', 'calculationMethod', 'unit', 'computedQuantity', 'wastagePercent', 'effectiveQuantity', 'contextSpaceId', 'contextScope', 'deductOpenings', 'openingsArea', 'polygonPoints', 'linkedFromItemId', 'linkQuantityFormula', 'linkPercentValue', 'specMaterialName', 'specMaterialBrand', 'specMaterialGrade', 'specColor', 'specSource', 'specNotes', 'materialUnitPrice', 'laborUnitPrice', 'materialCost', 'laborCost', 'totalCost', 'markupMethod', 'markupPercent', 'markupFixedAmount', 'manualUnitPrice', 'sellUnitPrice', 'sellTotalAmount', 'profitAmount', 'profitPercent', 'hasCustomMarkup', 'notes', 'createdAt', 'updatedAt', 'createdById', 'updatedById'])

export type QuantityItemScalarFieldEnum = z.infer<typeof QuantityItemScalarFieldEnumSchema>;

// File: QuantityItemContextScalarFieldEnum.schema.ts

export const QuantityItemContextScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'organizationId', 'totalFloorArea', 'totalWallArea', 'totalExteriorWallArea', 'totalRoofArea', 'totalPerimeter', 'averageFloorHeight', 'hasBasement', 'hasRoof', 'hasYard', 'yardArea', 'fenceLength', 'generalNotes', 'createdAt', 'updatedAt'])

export type QuantityItemContextScalarFieldEnum = z.infer<typeof QuantityItemContextScalarFieldEnumSchema>;

// File: QuantityContextSpaceScalarFieldEnum.schema.ts

export const QuantityContextSpaceScalarFieldEnumSchema = z.enum(['id', 'contextId', 'organizationId', 'name', 'spaceType', 'floorLabel', 'length', 'width', 'height', 'floorArea', 'wallPerimeter', 'polygonPoints', 'computedFloorArea', 'computedWallArea', 'isWetArea', 'isExterior', 'sortOrder', 'createdAt', 'updatedAt'])

export type QuantityContextSpaceScalarFieldEnum = z.infer<typeof QuantityContextSpaceScalarFieldEnumSchema>;

// File: QuantityContextOpeningScalarFieldEnum.schema.ts

export const QuantityContextOpeningScalarFieldEnumSchema = z.enum(['id', 'contextId', 'organizationId', 'name', 'openingType', 'width', 'height', 'computedArea', 'count', 'isExterior', 'deductFromInteriorFinishes', 'spaceId', 'createdAt', 'updatedAt'])

export type QuantityContextOpeningScalarFieldEnum = z.infer<typeof QuantityContextOpeningScalarFieldEnumSchema>;

// File: ItemCatalogEntryScalarFieldEnum.schema.ts

export const ItemCatalogEntryScalarFieldEnumSchema = z.enum(['id', 'itemKey', 'domain', 'categoryKey', 'subcategoryKey', 'nameAr', 'nameEn', 'descriptionAr', 'descriptionEn', 'icon', 'color', 'unit', 'defaultWastagePercent', 'defaultCalculationMethod', 'requiredFields', 'defaultMaterialUnitPrice', 'defaultLaborUnitPrice', 'commonMaterials', 'commonColors', 'linkableFrom', 'legacyDerivationType', 'legacyScope', 'displayOrder', 'isActive', 'createdAt', 'updatedAt'])

export type ItemCatalogEntryScalarFieldEnum = z.infer<typeof ItemCatalogEntryScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

// File: NullableJsonNullValueInput.schema.ts

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull'])

export type NullableJsonNullValueInput = z.infer<typeof NullableJsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: PlanType.schema.ts

export const PlanTypeSchema = z.enum(['FREE', 'PRO'])

export type PlanType = z.infer<typeof PlanTypeSchema>;

// File: AccountType.schema.ts

export const AccountTypeSchema = z.enum(['OWNER', 'EMPLOYEE', 'PROJECT_CLIENT'])

export type AccountType = z.infer<typeof AccountTypeSchema>;

// File: OrgStatus.schema.ts

export const OrgStatusSchema = z.enum(['ACTIVE', 'TRIALING', 'SUSPENDED', 'CANCELLED', 'PAST_DUE'])

export type OrgStatus = z.infer<typeof OrgStatusSchema>;

// File: SubscriptionStatus.schema.ts

export const SubscriptionStatusSchema = z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'PAUSED'])

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

// File: RoleType.schema.ts

export const RoleTypeSchema = z.enum(['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT', 'ENGINEER', 'SUPERVISOR', 'CUSTOM'])

export type RoleType = z.infer<typeof RoleTypeSchema>;

// File: InvitationStatus.schema.ts

export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'])

export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

// File: StudyType.schema.ts

export const StudyTypeSchema = z.enum(['FULL_PROJECT', 'CUSTOM_ITEMS', 'LUMP_SUM_ANALYSIS', 'FULL_STUDY', 'COST_PRICING', 'QUICK_PRICING'])

export type StudyType = z.infer<typeof StudyTypeSchema>;

// File: StudyEntryPoint.schema.ts

export const StudyEntryPointSchema = z.enum(['FROM_SCRATCH', 'HAS_QUANTITIES', 'HAS_SPECS', 'QUOTATION_ONLY', 'LUMP_SUM_ANALYSIS', 'CUSTOM_ITEMS'])

export type StudyEntryPoint = z.infer<typeof StudyEntryPointSchema>;

// File: StageStatus.schema.ts

export const StageStatusSchema = z.enum(['NOT_STARTED', 'DRAFT', 'IN_REVIEW', 'APPROVED'])

export type StageStatus = z.infer<typeof StageStatusSchema>;

// File: StageType.schema.ts

export const StageTypeSchema = z.enum(['QUANTITIES', 'SPECIFICATIONS', 'COSTING', 'PRICING', 'QUOTATION', 'CONVERSION'])

export type StageType = z.infer<typeof StageTypeSchema>;

// File: BOQSectionType.schema.ts

export const BOQSectionTypeSchema = z.enum(['STRUCTURAL', 'FINISHING', 'MEP', 'LABOR', 'MANUAL', 'GENERAL'])

export type BOQSectionType = z.infer<typeof BOQSectionTypeSchema>;

// File: LaborMethod.schema.ts

export const LaborMethodSchema = z.enum(['PER_UNIT', 'PER_SQM', 'LUMP_SUM', 'MONTHLY_SALARY', 'SUBCONTRACTOR_INCLUSIVE'])

export type LaborMethod = z.infer<typeof LaborMethodSchema>;

// File: ProjectStatus.schema.ts

export const ProjectStatusSchema = z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'])

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

// File: ProjectType.schema.ts

export const ProjectTypeSchema = z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'MIXED'])

export type ProjectType = z.infer<typeof ProjectTypeSchema>;

// File: ProjectRole.schema.ts

export const ProjectRoleSchema = z.enum(['MANAGER', 'ENGINEER', 'SUPERVISOR', 'ACCOUNTANT', 'VIEWER'])

export type ProjectRole = z.infer<typeof ProjectRoleSchema>;

// File: WeatherCondition.schema.ts

export const WeatherConditionSchema = z.enum(['SUNNY', 'CLOUDY', 'RAINY', 'WINDY', 'DUSTY', 'HOT', 'COLD'])

export type WeatherCondition = z.infer<typeof WeatherConditionSchema>;

// File: PhotoCategory.schema.ts

export const PhotoCategorySchema = z.enum(['PROGRESS', 'ISSUE', 'EQUIPMENT', 'MATERIAL', 'SAFETY', 'OTHER'])

export type PhotoCategory = z.infer<typeof PhotoCategorySchema>;

// File: IssueSeverity.schema.ts

export const IssueSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export type IssueSeverity = z.infer<typeof IssueSeveritySchema>;

// File: IssueStatus.schema.ts

export const IssueStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])

export type IssueStatus = z.infer<typeof IssueStatusSchema>;

// File: ExpenseCategory.schema.ts

export const ExpenseCategorySchema = z.enum(['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR', 'TRANSPORT', 'MISC'])

export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

// File: ClaimStatus.schema.ts

export const ClaimStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED'])

export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

// File: ContractorType.schema.ts

export const ContractorTypeSchema = z.enum(['COMPANY', 'INDIVIDUAL'])

export type ContractorType = z.infer<typeof ContractorTypeSchema>;

// File: SubcontractStatus.schema.ts

export const SubcontractStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'TERMINATED'])

export type SubcontractStatus = z.infer<typeof SubcontractStatusSchema>;

// File: PaymentMethod.schema.ts

export const PaymentMethodSchema = z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'OTHER'])

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// File: PaymentTermType.schema.ts

export const PaymentTermTypeSchema = z.enum(['ADVANCE', 'MILESTONE', 'MONTHLY', 'COMPLETION', 'CUSTOM'])

export type PaymentTermType = z.infer<typeof PaymentTermTypeSchema>;

// File: SubcontractCOStatus.schema.ts

export const SubcontractCOStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])

export type SubcontractCOStatus = z.infer<typeof SubcontractCOStatusSchema>;

// File: FinanceTransactionStatus.schema.ts

export const FinanceTransactionStatusSchema = z.enum(['PENDING', 'COMPLETED', 'CANCELLED'])

export type FinanceTransactionStatus = z.infer<typeof FinanceTransactionStatusSchema>;

// File: SubcontractClaimType.schema.ts

export const SubcontractClaimTypeSchema = z.enum(['INTERIM', 'FINAL', 'RETENTION'])

export type SubcontractClaimType = z.infer<typeof SubcontractClaimTypeSchema>;

// File: SubcontractClaimStatus.schema.ts

export const SubcontractClaimStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'])

export type SubcontractClaimStatus = z.infer<typeof SubcontractClaimStatusSchema>;

// File: ContractStatus.schema.ts

export const ContractStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'CLOSED'])

export type ContractStatus = z.infer<typeof ContractStatusSchema>;

// File: PaymentTermStatus.schema.ts

export const PaymentTermStatusSchema = z.enum(['PENDING', 'PARTIALLY_PAID', 'FULLY_PAID'])

export type PaymentTermStatus = z.infer<typeof PaymentTermStatusSchema>;

// File: DocumentFolder.schema.ts

export const DocumentFolderSchema = z.enum(['CONTRACT', 'DRAWINGS', 'CLAIMS', 'LETTERS', 'PHOTOS', 'OTHER'])

export type DocumentFolder = z.infer<typeof DocumentFolderSchema>;

// File: DocumentUploadType.schema.ts

export const DocumentUploadTypeSchema = z.enum(['FILE', 'URL'])

export type DocumentUploadType = z.infer<typeof DocumentUploadTypeSchema>;

// File: ApprovalStatus.schema.ts

export const ApprovalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])

export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

// File: ApproverStatus.schema.ts

export const ApproverStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export type ApproverStatus = z.infer<typeof ApproverStatusSchema>;

// File: AuditAction.schema.ts

export const AuditActionSchema = z.enum(['DOC_CREATED', 'DOC_DELETED', 'APPROVAL_REQUESTED', 'APPROVAL_DECIDED', 'MESSAGE_SENT', 'TOKEN_CREATED', 'TOKEN_REVOKED', 'CLAIM_STATUS_CHANGED', 'EXPENSE_CREATED', 'ATTACHMENT_CREATED', 'CO_CREATED', 'CO_SUBMITTED', 'CO_APPROVED', 'CO_REJECTED', 'CO_IMPLEMENTED', 'SUBCONTRACT_CREATED', 'SUBCONTRACT_UPDATED', 'SUBCONTRACT_DELETED', 'SUBCONTRACT_CO_CREATED', 'SUBCONTRACT_CO_UPDATED', 'SUBCONTRACT_CO_DELETED', 'SUBCONTRACT_PAYMENT_CREATED', 'SUBCONTRACT_ITEM_CREATED', 'SUBCONTRACT_ITEM_UPDATED', 'SUBCONTRACT_ITEM_DELETED', 'SUBCONTRACT_ITEMS_COPIED', 'SUBCONTRACT_CLAIM_CREATED', 'SUBCONTRACT_CLAIM_UPDATED', 'SUBCONTRACT_CLAIM_DELETED', 'SUBCONTRACT_CLAIM_STATUS_CHANGED', 'SUBCONTRACT_CLAIM_PAYMENT_ADDED', 'CONTRACT_CREATED', 'CONTRACT_UPDATED', 'PROJECT_PAYMENT_CREATED', 'PROJECT_PAYMENT_UPDATED', 'PROJECT_PAYMENT_DELETED'])

export type AuditAction = z.infer<typeof AuditActionSchema>;

// File: MessageChannel.schema.ts

export const MessageChannelSchema = z.enum(['TEAM', 'OWNER'])

export type MessageChannel = z.infer<typeof MessageChannelSchema>;

// File: NotificationType.schema.ts

export const NotificationTypeSchema = z.enum(['APPROVAL_REQUESTED', 'APPROVAL_DECIDED', 'DOCUMENT_CREATED', 'DAILY_REPORT_CREATED', 'ISSUE_CREATED', 'ISSUE_CRITICAL', 'EXPENSE_CREATED', 'CLAIM_CREATED', 'CLAIM_STATUS_CHANGED', 'CHANGE_ORDER_CREATED', 'CHANGE_ORDER_APPROVED', 'CHANGE_ORDER_REJECTED', 'OWNER_MESSAGE', 'TEAM_MEMBER_ADDED', 'TEAM_MEMBER_REMOVED', 'SYSTEM'])

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// File: NotificationChannel.schema.ts

export const NotificationChannelSchema = z.enum(['IN_APP', 'EMAIL'])

export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

// File: DeliveryStatus.schema.ts

export const DeliveryStatusSchema = z.enum(['PENDING', 'SENT', 'FAILED'])

export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

// File: ActivityStatus.schema.ts

export const ActivityStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'ON_HOLD', 'CANCELLED'])

export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;

// File: DependencyType.schema.ts

export const DependencyTypeSchema = z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH'])

export type DependencyType = z.infer<typeof DependencyTypeSchema>;

// File: MilestoneStatus.schema.ts

export const MilestoneStatusSchema = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'])

export type MilestoneStatus = z.infer<typeof MilestoneStatusSchema>;

// File: ProgressMethod.schema.ts

export const ProgressMethodSchema = z.enum(['MANUAL', 'CHECKLIST', 'ACTIVITIES'])

export type ProgressMethod = z.infer<typeof ProgressMethodSchema>;

// File: AttachmentOwnerType.schema.ts

export const AttachmentOwnerTypeSchema = z.enum(['DOCUMENT', 'PHOTO', 'EXPENSE', 'ISSUE', 'MESSAGE', 'CLAIM', 'CHANGE_ORDER', 'CLIENT'])

export type AttachmentOwnerType = z.infer<typeof AttachmentOwnerTypeSchema>;

// File: TemplateItemType.schema.ts

export const TemplateItemTypeSchema = z.enum(['MILESTONE', 'CHECKLIST'])

export type TemplateItemType = z.infer<typeof TemplateItemTypeSchema>;

// File: AlertType.schema.ts

export const AlertTypeSchema = z.enum(['MISSING_DAILY_REPORT', 'STALE_PROGRESS', 'OVERDUE_PAYMENT', 'COST_OVERRUN_RISK', 'TOO_MANY_OPEN_ISSUES'])

export type AlertType = z.infer<typeof AlertTypeSchema>;

// File: AlertSeverity.schema.ts

export const AlertSeveritySchema = z.enum(['INFO', 'WARN', 'CRITICAL'])

export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

// File: DigestFrequency.schema.ts

export const DigestFrequencySchema = z.enum(['WEEKLY'])

export type DigestFrequency = z.infer<typeof DigestFrequencySchema>;

// File: MessagingChannel.schema.ts

export const MessagingChannelSchema = z.enum(['EMAIL', 'WHATSAPP', 'SMS'])

export type MessagingChannel = z.infer<typeof MessagingChannelSchema>;

// File: MessageDeliveryStatus.schema.ts

export const MessageDeliveryStatusSchema = z.enum(['PENDING', 'SENT', 'FAILED', 'SKIPPED'])

export type MessageDeliveryStatus = z.infer<typeof MessageDeliveryStatusSchema>;

// File: ShareResourceType.schema.ts

export const ShareResourceTypeSchema = z.enum(['UPDATE_PDF', 'CLAIM_PDF', 'DOCUMENT', 'PHOTO_ALBUM', 'ICS', 'WEEKLY_REPORT'])

export type ShareResourceType = z.infer<typeof ShareResourceTypeSchema>;

// File: ChangeOrderCategory.schema.ts

export const ChangeOrderCategorySchema = z.enum(['SCOPE_CHANGE', 'CLIENT_REQUEST', 'SITE_CONDITION', 'DESIGN_CHANGE', 'MATERIAL_CHANGE', 'REGULATORY', 'OTHER'])

export type ChangeOrderCategory = z.infer<typeof ChangeOrderCategorySchema>;

// File: ChangeOrderStatus.schema.ts

export const ChangeOrderStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IMPLEMENTED'])

export type ChangeOrderStatus = z.infer<typeof ChangeOrderStatusSchema>;

// File: BOQSourceType.schema.ts

export const BOQSourceTypeSchema = z.enum(['MANUAL', 'COST_STUDY', 'IMPORTED', 'CONTRACT', 'QUOTATION'])

export type BOQSourceType = z.infer<typeof BOQSourceTypeSchema>;

// File: BOQSection.schema.ts

export const BOQSectionSchema = z.enum(['STRUCTURAL', 'FINISHING', 'MEP', 'LABOR', 'MANUAL', 'GENERAL'])

export type BOQSection = z.infer<typeof BOQSectionSchema>;

// File: ClientType.schema.ts

export const ClientTypeSchema = z.enum(['INDIVIDUAL', 'COMMERCIAL'])

export type ClientType = z.infer<typeof ClientTypeSchema>;

// File: QuotationStatus.schema.ts

export const QuotationStatusSchema = z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'])

export type QuotationStatus = z.infer<typeof QuotationStatusSchema>;

// File: QuotationFormat.schema.ts

export const QuotationFormatSchema = z.enum(['DETAILED_BOQ', 'PER_SQM', 'LUMP_SUM', 'CUSTOM'])

export type QuotationFormat = z.infer<typeof QuotationFormatSchema>;

// File: QuotationGrouping.schema.ts

export const QuotationGroupingSchema = z.enum(['BY_SECTION', 'BY_FLOOR', 'BY_ITEM', 'FLAT'])

export type QuotationGrouping = z.infer<typeof QuotationGroupingSchema>;

// File: QuotationBlockPosition.schema.ts

export const QuotationBlockPositionSchema = z.enum(['BEFORE_TABLE', 'AFTER_TABLE'])

export type QuotationBlockPosition = z.infer<typeof QuotationBlockPositionSchema>;

// File: InvoiceType.schema.ts

export const InvoiceTypeSchema = z.enum(['STANDARD', 'TAX', 'SIMPLIFIED', 'CREDIT_NOTE', 'DEBIT_NOTE'])

export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;

// File: FinanceInvoiceStatus.schema.ts

export const FinanceInvoiceStatusSchema = z.enum(['DRAFT', 'ISSUED', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'])

export type FinanceInvoiceStatus = z.infer<typeof FinanceInvoiceStatusSchema>;

// File: ZatcaInvoiceType.schema.ts

export const ZatcaInvoiceTypeSchema = z.enum(['STANDARD', 'SIMPLIFIED'])

export type ZatcaInvoiceType = z.infer<typeof ZatcaInvoiceTypeSchema>;

// File: ZatcaSubmissionStatus.schema.ts

export const ZatcaSubmissionStatusSchema = z.enum(['NOT_APPLICABLE', 'PENDING', 'SUBMITTED', 'CLEARED', 'REPORTED', 'REJECTED', 'FAILED'])

export type ZatcaSubmissionStatus = z.infer<typeof ZatcaSubmissionStatusSchema>;

// File: OpenDocumentType.schema.ts

export const OpenDocumentTypeSchema = z.enum(['LETTER', 'AGREEMENT', 'CERTIFICATE', 'MEMO', 'OTHER'])

export type OpenDocumentType = z.infer<typeof OpenDocumentTypeSchema>;

// File: FinanceTemplateType.schema.ts

export const FinanceTemplateTypeSchema = z.enum(['QUOTATION', 'INVOICE', 'LETTER'])

export type FinanceTemplateType = z.infer<typeof FinanceTemplateTypeSchema>;

// File: FinanceAccountType.schema.ts

export const FinanceAccountTypeSchema = z.enum(['BANK', 'CASH_BOX'])

export type FinanceAccountType = z.infer<typeof FinanceAccountTypeSchema>;

// File: OrgExpenseCategory.schema.ts

export const OrgExpenseCategorySchema = z.enum(['MATERIALS', 'LABOR', 'EQUIPMENT_RENTAL', 'EQUIPMENT_PURCHASE', 'SUBCONTRACTOR', 'TRANSPORT', 'SALARIES', 'RENT', 'UTILITIES', 'COMMUNICATIONS', 'INSURANCE', 'LICENSES', 'BANK_FEES', 'FUEL', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'TRAINING', 'TRAVEL', 'HOSPITALITY', 'LOAN_PAYMENT', 'TAXES', 'ZAKAT', 'REFUND', 'MISC', 'CUSTOM'])

export type OrgExpenseCategory = z.infer<typeof OrgExpenseCategorySchema>;

// File: ExpenseSourceType.schema.ts

export const ExpenseSourceTypeSchema = z.enum(['MANUAL', 'FACILITY_PAYROLL', 'FACILITY_RECURRING', 'FACILITY_ASSET', 'PROJECT'])

export type ExpenseSourceType = z.infer<typeof ExpenseSourceTypeSchema>;

// File: CompanyExpenseCategory.schema.ts

export const CompanyExpenseCategorySchema = z.enum(['RENT', 'UTILITIES', 'COMMUNICATIONS', 'INSURANCE', 'LICENSES', 'SUBSCRIPTIONS', 'MAINTENANCE', 'BANK_FEES', 'MARKETING', 'TRANSPORT', 'HOSPITALITY', 'OTHER'])

export type CompanyExpenseCategory = z.infer<typeof CompanyExpenseCategorySchema>;

// File: RecurrenceType.schema.ts

export const RecurrenceTypeSchema = z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'ONE_TIME'])

export type RecurrenceType = z.infer<typeof RecurrenceTypeSchema>;

// File: EmployeeType.schema.ts

export const EmployeeTypeSchema = z.enum(['PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT', 'ADMIN', 'DRIVER', 'TECHNICIAN', 'LABORER', 'SECURITY', 'OTHER'])

export type EmployeeType = z.infer<typeof EmployeeTypeSchema>;

// File: SalaryType.schema.ts

export const SalaryTypeSchema = z.enum(['MONTHLY', 'DAILY'])

export type SalaryType = z.infer<typeof SalaryTypeSchema>;

// File: EmployeeStatus.schema.ts

export const EmployeeStatusSchema = z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED'])

export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;

// File: EmployeeChangeType.schema.ts

export const EmployeeChangeTypeSchema = z.enum(['SALARY_CHANGE', 'STATUS_CHANGE', 'POSITION_CHANGE', 'ASSIGNMENT_CHANGE', 'INFO_UPDATE'])

export type EmployeeChangeType = z.infer<typeof EmployeeChangeTypeSchema>;

// File: LeaveStatus.schema.ts

export const LeaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])

export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;

// File: AssetCategory.schema.ts

export const AssetCategorySchema = z.enum(['HEAVY_EQUIPMENT', 'LIGHT_EQUIPMENT', 'VEHICLES', 'TOOLS', 'IT_EQUIPMENT', 'FURNITURE', 'SAFETY_EQUIPMENT', 'SURVEYING', 'OTHER'])

export type AssetCategory = z.infer<typeof AssetCategorySchema>;

// File: AssetType.schema.ts

export const AssetTypeSchema = z.enum(['OWNED', 'RENTED', 'LEASED'])

export type AssetType = z.infer<typeof AssetTypeSchema>;

// File: AssetStatus.schema.ts

export const AssetStatusSchema = z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'])

export type AssetStatus = z.infer<typeof AssetStatusSchema>;

// File: PayrollRunStatus.schema.ts

export const PayrollRunStatusSchema = z.enum(['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'])

export type PayrollRunStatus = z.infer<typeof PayrollRunStatusSchema>;

// File: ExpenseRunStatus.schema.ts

export const ExpenseRunStatusSchema = z.enum(['DRAFT', 'POSTED', 'CANCELLED'])

export type ExpenseRunStatus = z.infer<typeof ExpenseRunStatusSchema>;

// File: OrgAuditAction.schema.ts

export const OrgAuditActionSchema = z.enum(['EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_PAID', 'EXPENSE_CANCELLED', 'EXPENSE_DELETED', 'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_DELETED', 'TRANSFER_CREATED', 'TRANSFER_CANCELLED', 'BANK_ACCOUNT_CREATED', 'BANK_ACCOUNT_UPDATED', 'BANK_ACCOUNT_SET_DEFAULT', 'BANK_ACCOUNT_DELETED', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_ITEMS_UPDATED', 'INVOICE_STATUS_CHANGED', 'INVOICE_CONVERTED_TO_TAX', 'INVOICE_PAYMENT_ADDED', 'INVOICE_PAYMENT_DELETED', 'INVOICE_DELETED', 'INVOICE_ISSUED', 'INVOICE_DUPLICATED', 'INVOICE_CREDIT_NOTE_CREATED', 'QUOTATION_CREATED', 'QUOTATION_UPDATED', 'QUOTATION_ITEMS_UPDATED', 'QUOTATION_STATUS_CHANGED', 'QUOTATION_DELETED', 'QUOTATION_CONVERTED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED', 'PAYROLL_RUN_APPROVED', 'PAYROLL_RUN_CANCELLED', 'JOURNAL_ENTRY_SKIPPED', 'JOURNAL_ENTRY_FAILED', 'PROJECT_CREATED', 'PROJECT_ARCHIVED', 'PROJECT_RESTORED', 'SETTINGS_UPDATED', 'ZATCA_INVOICE_SUBMITTED', 'ZATCA_INVOICE_CLEARED', 'ZATCA_INVOICE_REJECTED', 'RECEIPT_VOUCHER_CREATED', 'RECEIPT_VOUCHER_UPDATED', 'RECEIPT_VOUCHER_ISSUED', 'RECEIPT_VOUCHER_CANCELLED', 'PAYMENT_VOUCHER_CREATED', 'PAYMENT_VOUCHER_UPDATED', 'PAYMENT_VOUCHER_SUBMITTED', 'PAYMENT_VOUCHER_APPROVED', 'PAYMENT_VOUCHER_REJECTED', 'PAYMENT_VOUCHER_CANCELLED', 'HANDOVER_CREATED', 'HANDOVER_UPDATED', 'HANDOVER_DELETED', 'HANDOVER_SUBMITTED', 'HANDOVER_SIGNED', 'HANDOVER_COMPLETED', 'HANDOVER_ITEM_ADDED', 'HANDOVER_ITEM_UPDATED', 'HANDOVER_ITEM_DELETED', 'HANDOVER_ITEMS_IMPORTED', 'AI_CHAT_CREATED', 'AI_MESSAGE_SENT', 'OWNER_CREATED', 'OWNER_UPDATED', 'OWNER_DEACTIVATED', 'OWNER_DRAWING_CREATED', 'OWNER_DRAWING_APPROVED', 'OWNER_DRAWING_CANCELLED', 'OWNER_DRAWING_OVERDRAW_ACKNOWLEDGED', 'CAPITAL_CONTRIBUTION_CREATED', 'CAPITAL_CONTRIBUTION_CANCELLED', 'YEAR_END_CLOSING_EXECUTED', 'YEAR_END_CLOSING_REVERSED'])

export type OrgAuditAction = z.infer<typeof OrgAuditActionSchema>;

// File: LeadStatus.schema.ts

export const LeadStatusSchema = z.enum(['NEW', 'STUDYING', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST'])

export type LeadStatus = z.infer<typeof LeadStatusSchema>;

// File: LeadSource.schema.ts

export const LeadSourceSchema = z.enum(['REFERRAL', 'SOCIAL_MEDIA', 'WEBSITE', 'DIRECT', 'EXHIBITION', 'OTHER'])

export type LeadSource = z.infer<typeof LeadSourceSchema>;

// File: LeadPriority.schema.ts

export const LeadPrioritySchema = z.enum(['NORMAL', 'HIGH', 'URGENT'])

export type LeadPriority = z.infer<typeof LeadPrioritySchema>;

// File: LeadFileCategory.schema.ts

export const LeadFileCategorySchema = z.enum(['BLUEPRINT', 'STRUCTURE', 'SITE_PHOTO', 'SCOPE', 'OTHER'])

export type LeadFileCategory = z.infer<typeof LeadFileCategorySchema>;

// File: LeadActivityType.schema.ts

export const LeadActivityTypeSchema = z.enum(['COMMENT', 'STATUS_CHANGE', 'FILE_UPLOADED', 'FILE_DELETED', 'COST_STUDY_LINKED', 'COST_STUDY_UNLINKED', 'QUOTATION_LINKED', 'QUOTATION_UNLINKED', 'ASSIGNED', 'CONVERTED'])

export type LeadActivityType = z.infer<typeof LeadActivityTypeSchema>;

// File: LaborCostType.schema.ts

export const LaborCostTypeSchema = z.enum(['PER_SQM', 'PER_CBM', 'PER_UNIT', 'PER_LM', 'LUMP_SUM', 'SALARY'])

export type LaborCostType = z.infer<typeof LaborCostTypeSchema>;

// File: ChartAccountType.schema.ts

export const ChartAccountTypeSchema = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])

export type ChartAccountType = z.infer<typeof ChartAccountTypeSchema>;

// File: NormalBalance.schema.ts

export const NormalBalanceSchema = z.enum(['DEBIT', 'CREDIT'])

export type NormalBalance = z.infer<typeof NormalBalanceSchema>;

// File: JournalEntryStatus.schema.ts

export const JournalEntryStatusSchema = z.enum(['DRAFT', 'POSTED', 'REVERSED'])

export type JournalEntryStatus = z.infer<typeof JournalEntryStatusSchema>;

// File: CapitalContributionType.schema.ts

export const CapitalContributionTypeSchema = z.enum(['INITIAL', 'ADDITIONAL', 'IN_KIND'])

export type CapitalContributionType = z.infer<typeof CapitalContributionTypeSchema>;

// File: OwnerDrawingType.schema.ts

export const OwnerDrawingTypeSchema = z.enum(['COMPANY_LEVEL', 'PROJECT_SPECIFIC'])

export type OwnerDrawingType = z.infer<typeof OwnerDrawingTypeSchema>;

// File: OwnerDrawingStatus.schema.ts

export const OwnerDrawingStatusSchema = z.enum(['APPROVED', 'CANCELLED'])

export type OwnerDrawingStatus = z.infer<typeof OwnerDrawingStatusSchema>;

// File: VoucherStatus.schema.ts

export const VoucherStatusSchema = z.enum(['DRAFT', 'PENDING_APPROVAL', 'ISSUED', 'CANCELLED'])

export type VoucherStatus = z.infer<typeof VoucherStatusSchema>;

// File: PayeeType.schema.ts

export const PayeeTypeSchema = z.enum(['SUBCONTRACTOR', 'SUPPLIER', 'EMPLOYEE', 'OTHER'])

export type PayeeType = z.infer<typeof PayeeTypeSchema>;

// File: HandoverType.schema.ts

export const HandoverTypeSchema = z.enum(['ITEM_ACCEPTANCE', 'PRELIMINARY', 'FINAL', 'DELIVERY'])

export type HandoverType = z.infer<typeof HandoverTypeSchema>;

// File: HandoverStatus.schema.ts

export const HandoverStatusSchema = z.enum(['DRAFT', 'PENDING_SIGNATURES', 'PARTIALLY_SIGNED', 'COMPLETED', 'ARCHIVED'])

export type HandoverStatus = z.infer<typeof HandoverStatusSchema>;

// File: QualityRating.schema.ts

export const QualityRatingSchema = z.enum(['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'NEEDS_REWORK', 'REJECTED'])

export type QualityRating = z.infer<typeof QualityRatingSchema>;

// File: ZatcaIntegrationStatus.schema.ts

export const ZatcaIntegrationStatusSchema = z.enum(['DISABLED', 'ONBOARDING', 'COMPLIANCE', 'ACTIVE', 'EXPIRED', 'REVOKED'])

export type ZatcaIntegrationStatus = z.infer<typeof ZatcaIntegrationStatusSchema>;

// File: CategoryGroup.schema.ts

export const CategoryGroupSchema = z.enum(['EXPENSE'])

export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;

// File: PlanConfig.schema.ts

export const PlanConfigSchema = z.object({
  id: z.string(),
  plan: PlanTypeSchema,
  name: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  maxUsers: z.number().int(),
  maxProjects: z.number().int(),
  maxStorageGB: z.number().int(),
  monthlyPrice: z.number().int(),
  yearlyPrice: z.number().int(),
  features: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  isActive: z.boolean().default(true),
  updatedAt: z.date(),
  createdAt: z.date(),
});

export type PlanConfigType = z.infer<typeof PlanConfigSchema>;


// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  displayUsername: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
  accountType: AccountTypeSchema.default("EMPLOYEE"),
  isActive: z.boolean().default(true),
  mustChangePassword: z.boolean(),
  lastLoginAt: z.date().nullish(),
  organizationRoleId: z.string().nullish(),
  customPermissions: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdById: z.string().nullish(),
  organizationId: z.string().nullish(),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  activeOrganizationId: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionType = z.infer<typeof SessionSchema>;


// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountModel = z.infer<typeof AccountSchema>;

// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  aaguid: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  userId: z.string(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Organization.schema.ts

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullish(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
  paymentsCustomerId: z.string().nullish(),
  ownerId: z.string().nullish(),
  commercialRegister: z.string().nullish(),
  taxNumber: z.string().nullish(),
  contractorClass: z.string().nullish(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  currency: z.string().default("SAR"),
  timezone: z.string().default("Asia/Riyadh"),
  status: OrgStatusSchema.default("TRIALING"),
  plan: PlanTypeSchema.default("FREE"),
  planName: z.string().nullish(),
  stripeSubscriptionId: z.string().nullish(),
  stripeProductId: z.string().nullish(),
  stripePriceId: z.string().nullish(),
  subscriptionStatus: SubscriptionStatusSchema.default("TRIALING"),
  maxUsers: z.number().int().default(3),
  maxProjects: z.number().int().default(2),
  maxStorage: z.number().int().default(1),
  currentPeriodStart: z.date().nullish(),
  currentPeriodEnd: z.date().nullish(),
  trialEndsAt: z.date().nullish(),
  cancelAtPeriodEnd: z.boolean(),
  lastPaymentAt: z.date().nullish(),
  lastPaymentAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'lastPaymentAmount' must be a Decimal. Location: ['Models', 'Organization']",
}).nullish(),
  billingEmail: z.string().nullish(),
  isFreeOverride: z.boolean(),
  overrideReason: z.string().nullish(),
  overrideBy: z.string().nullish(),
  overrideAt: z.date().nullish(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;


// File: Member.schema.ts

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type MemberType = z.infer<typeof MemberSchema>;


// File: Invitation.schema.ts

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullish(),
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
  createdAt: z.date(),
});

export type InvitationType = z.infer<typeof InvitationSchema>;


// File: Role.schema.ts

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullish(),
  description: z.string().nullish(),
  type: RoleTypeSchema.default("CUSTOM"),
  isSystem: z.boolean(),
  permissions: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  organizationId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RoleModel = z.infer<typeof RoleSchema>;

// File: UserInvitation.schema.ts

export const UserInvitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullish(),
  roleId: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  status: InvitationStatusSchema.default("PENDING"),
  organizationId: z.string(),
  invitedById: z.string(),
  createdAt: z.date(),
  acceptedAt: z.date().nullish(),
});

export type UserInvitationType = z.infer<typeof UserInvitationSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  productId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseModel = z.infer<typeof PurchaseSchema>;

// File: SubscriptionEvent.schema.ts

export const SubscriptionEventSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  eventType: z.string(),
  stripeEventId: z.string(),
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  processedAt: z.date(),
});

export type SubscriptionEventType = z.infer<typeof SubscriptionEventSchema>;


// File: SuperAdminLog.schema.ts

export const SuperAdminLogSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  targetOrgId: z.string().nullish(),
  details: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  ipAddress: z.string().nullish(),
  createdAt: z.date(),
});

export type SuperAdminLogType = z.infer<typeof SuperAdminLogSchema>;


// File: AiChat.schema.ts

export const AiChatSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  title: z.string().nullish(),
  type: z.string().default("CHATBOT"),
  messages: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AiChatType = z.infer<typeof AiChatSchema>;


// File: CostStudy.schema.ts

export const CostStudySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  createdById: z.string(),
  name: z.string().nullish(),
  customerName: z.string().nullish(),
  customerId: z.string().nullish(),
  projectType: z.string(),
  landArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'landArea' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  buildingArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'buildingArea' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  numberOfFloors: z.number().int(),
  hasBasement: z.boolean(),
  finishingLevel: z.string(),
  structuralCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'structuralCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  finishingCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'finishingCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  mepCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'mepCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  laborCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  overheadPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'overheadPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).default(new Prisma.Decimal(5)),
  profitPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'profitPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).default(new Prisma.Decimal(10)),
  contingencyPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'contingencyPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).default(new Prisma.Decimal(3)),
  vatIncluded: z.boolean().default(true),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  buildingConfig: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  status: z.string().default("draft"),
  notes: z.string().nullish(),
  projectId: z.string().nullish(),
  studyType: StudyTypeSchema.default("FULL_PROJECT"),
  entryPoint: StudyEntryPointSchema.default("FROM_SCRATCH"),
  workScopes: z.array(z.string()),
  quantitiesStatus: StageStatusSchema.default("DRAFT"),
  specsStatus: StageStatusSchema.default("NOT_STARTED"),
  costingStatus: StageStatusSchema.default("NOT_STARTED"),
  pricingStatus: StageStatusSchema.default("NOT_STARTED"),
  quotationStatus: StageStatusSchema.default("NOT_STARTED"),
  quantitiesAssigneeId: z.string().nullish(),
  specsAssigneeId: z.string().nullish(),
  costingAssigneeId: z.string().nullish(),
  pricingAssigneeId: z.string().nullish(),
  contractValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'contractValue' must be a Decimal. Location: ['Models', 'CostStudy']",
}).nullish(),
  generatedQuotationId: z.string().nullish(),
  convertedProjectId: z.string().nullish(),
  structuralSpecs: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  laborBreakdown: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  costingMethod: z.string().nullish(),
  overheadCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'overheadCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}).nullish(),
  adminCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'adminCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}).nullish(),
  adminPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'adminPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).nullish(),
  storageCostPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'storageCostPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).nullish(),
  markupMethod: z.string().nullish(),
  uniformMarkupPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'uniformMarkupPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).nullish(),
  globalMarkupPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'globalMarkupPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).default(new Prisma.Decimal(30)),
  globalMarkupMethod: z.string().default("percentage"),
  vatPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}).default(new Prisma.Decimal(15)),
  vatIncludedInPrices: z.boolean(),
  totalMaterialCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalMaterialCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  totalLaborCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalLaborCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  totalGrossCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalGrossCost' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  totalSellAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalSellAmount' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  totalProfitAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalProfitAmount' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  totalProfitPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalProfitPercent' must be a Decimal. Location: ['Models', 'CostStudy']",
}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CostStudyType = z.infer<typeof CostStudySchema>;


// File: StudyStage.schema.ts

export const StudyStageSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  stage: StageTypeSchema,
  status: StageStatusSchema.default("NOT_STARTED"),
  assigneeId: z.string().nullish(),
  approvedById: z.string().nullish(),
  approvedAt: z.date().nullish(),
  notes: z.string().nullish(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StudyStageType = z.infer<typeof StudyStageSchema>;


// File: MaterialBOM.schema.ts

export const MaterialBOMSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  parentItemId: z.string(),
  parentItemType: BOQSectionTypeSchema,
  parentCategory: z.string().nullish(),
  materialName: z.string(),
  materialNameEn: z.string().nullish(),
  materialCode: z.string().nullish(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'MaterialBOM']",
}),
  unit: z.string(),
  consumptionRate: z.instanceof(Prisma.Decimal, {
  message: "Field 'consumptionRate' must be a Decimal. Location: ['Models', 'MaterialBOM']",
}).nullish(),
  wastagePercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'wastagePercent' must be a Decimal. Location: ['Models', 'MaterialBOM']",
}),
  effectiveQuantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'effectiveQuantity' must be a Decimal. Location: ['Models', 'MaterialBOM']",
}),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'MaterialBOM']",
}).nullish(),
  totalPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalPrice' must be a Decimal. Location: ['Models', 'MaterialBOM']",
}).nullish(),
  floorId: z.string().nullish(),
  floorName: z.string().nullish(),
  roomId: z.string().nullish(),
  roomName: z.string().nullish(),
  sortOrder: z.number().int(),
  isEnabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MaterialBOMType = z.infer<typeof MaterialBOMSchema>;


// File: CostingLabor.schema.ts

export const CostingLaborSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  section: BOQSectionTypeSchema,
  subSection: z.string().nullish(),
  laborMethod: LaborMethodSchema,
  description: z.string(),
  unit: z.string(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'CostingLabor']",
}),
  rate: z.instanceof(Prisma.Decimal, {
  message: "Field 'rate' must be a Decimal. Location: ['Models', 'CostingLabor']",
}),
  durationMonths: z.number().int().nullish(),
  insuranceCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'insuranceCost' must be a Decimal. Location: ['Models', 'CostingLabor']",
}).nullish(),
  housingCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'housingCost' must be a Decimal. Location: ['Models', 'CostingLabor']",
}).nullish(),
  transportCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'transportCost' must be a Decimal. Location: ['Models', 'CostingLabor']",
}).nullish(),
  otherCosts: z.instanceof(Prisma.Decimal, {
  message: "Field 'otherCosts' must be a Decimal. Location: ['Models', 'CostingLabor']",
}).nullish(),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'CostingLabor']",
}),
  sortOrder: z.number().int(),
  isEnabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CostingLaborType = z.infer<typeof CostingLaborSchema>;


// File: StructuralItem.schema.ts

export const StructuralItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  category: z.string(),
  subCategory: z.string().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  dimensions: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'StructuralItem']",
}),
  unit: z.string(),
  concreteVolume: z.instanceof(Prisma.Decimal, {
  message: "Field 'concreteVolume' must be a Decimal. Location: ['Models', 'StructuralItem']",
}).nullish(),
  concreteType: z.string().nullish(),
  steelWeight: z.instanceof(Prisma.Decimal, {
  message: "Field 'steelWeight' must be a Decimal. Location: ['Models', 'StructuralItem']",
}).nullish(),
  steelRatio: z.instanceof(Prisma.Decimal, {
  message: "Field 'steelRatio' must be a Decimal. Location: ['Models', 'StructuralItem']",
}).nullish(),
  wastagePercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'wastagePercent' must be a Decimal. Location: ['Models', 'StructuralItem']",
}).default(new Prisma.Decimal(10)),
  materialCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialCost' must be a Decimal. Location: ['Models', 'StructuralItem']",
}),
  laborCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborCost' must be a Decimal. Location: ['Models', 'StructuralItem']",
}),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'StructuralItem']",
}),
  projectPhaseId: z.string().nullish(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StructuralItemType = z.infer<typeof StructuralItemSchema>;


// File: FinishingItem.schema.ts

export const FinishingItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  category: z.string(),
  subCategory: z.string().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  floorId: z.string().nullish(),
  floorName: z.string().nullish(),
  area: z.instanceof(Prisma.Decimal, {
  message: "Field 'area' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  length: z.instanceof(Prisma.Decimal, {
  message: "Field 'length' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  height: z.instanceof(Prisma.Decimal, {
  message: "Field 'height' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  width: z.instanceof(Prisma.Decimal, {
  message: "Field 'width' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  perimeter: z.instanceof(Prisma.Decimal, {
  message: "Field 'perimeter' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  unit: z.string().default("m2"),
  calculationMethod: z.string().nullish(),
  calculationData: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  dataSource: z.string().nullish(),
  sourceItemId: z.string().nullish(),
  sourceFormula: z.string().nullish(),
  isEnabled: z.boolean().default(true),
  groupKey: z.string().nullish(),
  scope: z.string().nullish(),
  qualityLevel: z.string().nullish(),
  brand: z.string().nullish(),
  specifications: z.string().nullish(),
  specData: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  wastagePercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'wastagePercent' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  materialPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialPrice' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  laborPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborPrice' must be a Decimal. Location: ['Models', 'FinishingItem']",
}).nullish(),
  materialCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialCost' must be a Decimal. Location: ['Models', 'FinishingItem']",
}),
  laborCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborCost' must be a Decimal. Location: ['Models', 'FinishingItem']",
}),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'FinishingItem']",
}),
  projectPhaseId: z.string().nullish(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinishingItemType = z.infer<typeof FinishingItemSchema>;


// File: SpecificationTemplate.schema.ts

export const SpecificationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullish(),
  description: z.string().nullish(),
  organizationId: z.string(),
  createdById: z.string(),
  isDefault: z.boolean(),
  isSystem: z.boolean(),
  specs: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SpecificationTemplateType = z.infer<typeof SpecificationTemplateSchema>;


// File: MEPItem.schema.ts

export const MEPItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  category: z.string(),
  subCategory: z.string().default("general"),
  itemType: z.string().nullish(),
  name: z.string(),
  floorId: z.string().nullish(),
  floorName: z.string().nullish(),
  roomId: z.string().nullish(),
  roomName: z.string().nullish(),
  scope: z.string().default("per_room"),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'MEPItem']",
}),
  unit: z.string().default("عدد"),
  length: z.instanceof(Prisma.Decimal, {
  message: "Field 'length' must be a Decimal. Location: ['Models', 'MEPItem']",
}).nullish(),
  area: z.instanceof(Prisma.Decimal, {
  message: "Field 'area' must be a Decimal. Location: ['Models', 'MEPItem']",
}).nullish(),
  calculationMethod: z.string().default("manual"),
  calculationData: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  dataSource: z.string().default("manual"),
  sourceFormula: z.string().nullish(),
  groupKey: z.string().nullish(),
  specifications: z.string().nullish(),
  specData: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  qualityLevel: z.string().nullish(),
  materialPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialPrice' must be a Decimal. Location: ['Models', 'MEPItem']",
}),
  laborPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborPrice' must be a Decimal. Location: ['Models', 'MEPItem']",
}),
  wastagePercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'wastagePercent' must be a Decimal. Location: ['Models', 'MEPItem']",
}).default(new Prisma.Decimal(10)),
  materialCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialCost' must be a Decimal. Location: ['Models', 'MEPItem']",
}),
  laborCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborCost' must be a Decimal. Location: ['Models', 'MEPItem']",
}),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'MEPItem']",
}),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'MEPItem']",
}),
  projectPhaseId: z.string().nullish(),
  sortOrder: z.number().int(),
  isEnabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MEPItemType = z.infer<typeof MEPItemSchema>;


// File: LaborItem.schema.ts

export const LaborItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  laborType: z.string(),
  workerType: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  dailyRate: z.instanceof(Prisma.Decimal, {
  message: "Field 'dailyRate' must be a Decimal. Location: ['Models', 'LaborItem']",
}),
  durationDays: z.number().int(),
  insuranceCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'insuranceCost' must be a Decimal. Location: ['Models', 'LaborItem']",
}),
  housingCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'housingCost' must be a Decimal. Location: ['Models', 'LaborItem']",
}),
  otherCosts: z.instanceof(Prisma.Decimal, {
  message: "Field 'otherCosts' must be a Decimal. Location: ['Models', 'LaborItem']",
}),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'LaborItem']",
}),
  projectPhaseId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LaborItemType = z.infer<typeof LaborItemSchema>;


// File: Quote.schema.ts

export const QuoteSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  quoteNumber: z.string(),
  quoteType: z.string(),
  clientName: z.string(),
  clientCompany: z.string().nullish(),
  clientPhone: z.string().nullish(),
  clientEmail: z.string().nullish(),
  clientAddress: z.string().nullish(),
  subtotal: z.instanceof(Prisma.Decimal, {
  message: "Field 'subtotal' must be a Decimal. Location: ['Models', 'Quote']",
}),
  overheadAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'overheadAmount' must be a Decimal. Location: ['Models', 'Quote']",
}),
  profitAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'profitAmount' must be a Decimal. Location: ['Models', 'Quote']",
}),
  vatAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatAmount' must be a Decimal. Location: ['Models', 'Quote']",
}),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'Quote']",
}),
  validUntil: z.date(),
  paymentTerms: z.string().nullish(),
  deliveryTerms: z.string().nullish(),
  showUnitPrices: z.boolean().default(true),
  showQuantities: z.boolean().default(true),
  showItemDescriptions: z.boolean().default(true),
  includeTerms: z.boolean().default(true),
  includeCoverPage: z.boolean().default(true),
  selectedCategories: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  termsAndConditions: z.string().nullish(),
  notes: z.string().nullish(),
  pdfUrl: z.string().nullish(),
  status: z.string().default("draft"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuoteType = z.infer<typeof QuoteSchema>;


// File: Project.schema.ts

export const ProjectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  slug: z.string(),
  projectNo: z.string().nullish(),
  description: z.string().nullish(),
  status: ProjectStatusSchema.default("ACTIVE"),
  type: ProjectTypeSchema.nullish(),
  clientName: z.string().nullish(),
  clientId: z.string().nullish(),
  location: z.string().nullish(),
  contractValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'contractValue' must be a Decimal. Location: ['Models', 'Project']",
}).nullish(),
  progress: z.instanceof(Prisma.Decimal, {
  message: "Field 'progress' must be a Decimal. Location: ['Models', 'Project']",
}),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectModel = z.infer<typeof ProjectSchema>;

// File: ProjectMember.schema.ts

export const ProjectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  role: ProjectRoleSchema.default("VIEWER"),
  assignedAt: z.date(),
  assignedById: z.string(),
});

export type ProjectMemberType = z.infer<typeof ProjectMemberSchema>;


// File: ProjectDailyReport.schema.ts

export const ProjectDailyReportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  reportDate: z.date(),
  manpower: z.number().int(),
  equipment: z.string().nullish(),
  workDone: z.string(),
  blockers: z.string().nullish(),
  weather: WeatherConditionSchema.default("SUNNY"),
  createdById: z.string(),
  createdAt: z.date(),
});

export type ProjectDailyReportType = z.infer<typeof ProjectDailyReportSchema>;


// File: ProjectPhoto.schema.ts

export const ProjectPhotoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  url: z.string(),
  caption: z.string().nullish(),
  category: PhotoCategorySchema.default("PROGRESS"),
  takenAt: z.date(),
  uploadedById: z.string(),
  createdAt: z.date(),
});

export type ProjectPhotoType = z.infer<typeof ProjectPhotoSchema>;


// File: ProjectIssue.schema.ts

export const ProjectIssueSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string(),
  severity: IssueSeveritySchema.default("MEDIUM"),
  status: IssueStatusSchema.default("OPEN"),
  dueDate: z.date().nullish(),
  assigneeId: z.string().nullish(),
  createdById: z.string(),
  resolvedAt: z.date().nullish(),
  createdAt: z.date(),
});

export type ProjectIssueType = z.infer<typeof ProjectIssueSchema>;


// File: ProjectProgressUpdate.schema.ts

export const ProjectProgressUpdateSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  progress: z.instanceof(Prisma.Decimal, {
  message: "Field 'progress' must be a Decimal. Location: ['Models', 'ProjectProgressUpdate']",
}),
  phaseLabel: z.string().nullish(),
  note: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
});

export type ProjectProgressUpdateType = z.infer<typeof ProjectProgressUpdateSchema>;


// File: ProjectExpense.schema.ts

export const ProjectExpenseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  date: z.date(),
  category: ExpenseCategorySchema,
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'ProjectExpense']",
}),
  vendorName: z.string().nullish(),
  note: z.string().nullish(),
  attachmentUrl: z.string().nullish(),
  subcontractContractId: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectExpenseType = z.infer<typeof ProjectExpenseSchema>;


// File: ProjectClaim.schema.ts

export const ProjectClaimSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  claimNo: z.number().int(),
  periodStart: z.date().nullish(),
  periodEnd: z.date().nullish(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'ProjectClaim']",
}),
  dueDate: z.date().nullish(),
  status: ClaimStatusSchema.default("DRAFT"),
  note: z.string().nullish(),
  createdById: z.string(),
  approvedAt: z.date().nullish(),
  paidAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectClaimType = z.infer<typeof ProjectClaimSchema>;


// File: SubcontractContract.schema.ts

export const SubcontractContractSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  contractNo: z.string().nullish(),
  name: z.string(),
  contractorType: ContractorTypeSchema.default("COMPANY"),
  companyName: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  taxNumber: z.string().nullish(),
  crNumber: z.string().nullish(),
  status: SubcontractStatusSchema.default("DRAFT"),
  value: z.instanceof(Prisma.Decimal, {
  message: "Field 'value' must be a Decimal. Location: ['Models', 'SubcontractContract']",
}),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
  signedDate: z.date().nullish(),
  scopeOfWork: z.string().nullish(),
  notes: z.string().nullish(),
  includesVat: z.boolean(),
  vatPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatPercent' must be a Decimal. Location: ['Models', 'SubcontractContract']",
}).nullish(),
  retentionPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'retentionPercent' must be a Decimal. Location: ['Models', 'SubcontractContract']",
}).nullish(),
  retentionCapPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'retentionCapPercent' must be a Decimal. Location: ['Models', 'SubcontractContract']",
}).nullish(),
  advancePaymentPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'advancePaymentPercent' must be a Decimal. Location: ['Models', 'SubcontractContract']",
}).nullish(),
  advancePaymentAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'advancePaymentAmount' must be a Decimal. Location: ['Models', 'SubcontractContract']",
}).nullish(),
  paymentMethod: PaymentMethodSchema.nullish(),
  attachmentUrl: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubcontractContractType = z.infer<typeof SubcontractContractSchema>;


// File: SubcontractPaymentTerm.schema.ts

export const SubcontractPaymentTermSchema = z.object({
  id: z.string(),
  contractId: z.string(),
  type: PaymentTermTypeSchema.default("MILESTONE"),
  label: z.string().nullish(),
  percent: z.instanceof(Prisma.Decimal, {
  message: "Field 'percent' must be a Decimal. Location: ['Models', 'SubcontractPaymentTerm']",
}).nullish(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'SubcontractPaymentTerm']",
}).nullish(),
  dueDate: z.date().nullish(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubcontractPaymentTermType = z.infer<typeof SubcontractPaymentTermSchema>;


// File: SubcontractChangeOrder.schema.ts

export const SubcontractChangeOrderSchema = z.object({
  id: z.string(),
  contractId: z.string(),
  orderNo: z.number().int(),
  description: z.string(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'SubcontractChangeOrder']",
}),
  status: SubcontractCOStatusSchema.default("DRAFT"),
  approvedDate: z.date().nullish(),
  attachmentUrl: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubcontractChangeOrderType = z.infer<typeof SubcontractChangeOrderSchema>;


// File: SubcontractPayment.schema.ts

export const SubcontractPaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  contractId: z.string(),
  termId: z.string().nullish(),
  claimId: z.string().nullish(),
  paymentNo: z.string(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'SubcontractPayment']",
}),
  date: z.date(),
  paymentMethod: PaymentMethodSchema.nullish(),
  referenceNo: z.string().nullish(),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  status: FinanceTransactionStatusSchema.default("COMPLETED"),
  voucherNo: z.string().nullish(),
  sourceAccountId: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubcontractPaymentType = z.infer<typeof SubcontractPaymentSchema>;


// File: SubcontractItem.schema.ts

export const SubcontractItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  contractId: z.string(),
  itemCode: z.string().nullish(),
  description: z.string(),
  descriptionEn: z.string().nullish(),
  unit: z.string(),
  contractQty: z.instanceof(Prisma.Decimal, {
  message: "Field 'contractQty' must be a Decimal. Location: ['Models', 'SubcontractItem']",
}),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'SubcontractItem']",
}),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'SubcontractItem']",
}),
  sortOrder: z.number().int(),
  category: z.string().nullish(),
  isLumpSum: z.boolean(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubcontractItemType = z.infer<typeof SubcontractItemSchema>;


// File: SubcontractClaim.schema.ts

export const SubcontractClaimSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  contractId: z.string(),
  claimNo: z.number().int(),
  title: z.string(),
  claimType: SubcontractClaimTypeSchema.default("INTERIM"),
  status: SubcontractClaimStatusSchema.default("DRAFT"),
  periodStart: z.date(),
  periodEnd: z.date(),
  grossAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'grossAmount' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  retentionAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'retentionAmount' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  advanceDeduction: z.instanceof(Prisma.Decimal, {
  message: "Field 'advanceDeduction' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  vatAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatAmount' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  netAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'netAmount' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  paidAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'paidAmount' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  penaltyAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'penaltyAmount' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  otherDeductions: z.instanceof(Prisma.Decimal, {
  message: "Field 'otherDeductions' must be a Decimal. Location: ['Models', 'SubcontractClaim']",
}),
  otherDeductionsNote: z.string().nullish(),
  notes: z.string().nullish(),
  rejectionReason: z.string().nullish(),
  printedAt: z.date().nullish(),
  submittedAt: z.date().nullish(),
  approvedAt: z.date().nullish(),
  approvedById: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubcontractClaimModel = z.infer<typeof SubcontractClaimSchema>;

// File: SubcontractClaimItem.schema.ts

export const SubcontractClaimItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  claimId: z.string(),
  contractItemId: z.string(),
  contractQty: z.instanceof(Prisma.Decimal, {
  message: "Field 'contractQty' must be a Decimal. Location: ['Models', 'SubcontractClaimItem']",
}),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'SubcontractClaimItem']",
}),
  prevCumulativeQty: z.instanceof(Prisma.Decimal, {
  message: "Field 'prevCumulativeQty' must be a Decimal. Location: ['Models', 'SubcontractClaimItem']",
}),
  thisQty: z.instanceof(Prisma.Decimal, {
  message: "Field 'thisQty' must be a Decimal. Location: ['Models', 'SubcontractClaimItem']",
}),
  thisAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'thisAmount' must be a Decimal. Location: ['Models', 'SubcontractClaimItem']",
}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubcontractClaimItemType = z.infer<typeof SubcontractClaimItemSchema>;


// File: ProjectContract.schema.ts

export const ProjectContractSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  contractNo: z.string().nullish(),
  title: z.string().nullish(),
  clientName: z.string().nullish(),
  description: z.string().nullish(),
  status: ContractStatusSchema.default("DRAFT"),
  value: z.instanceof(Prisma.Decimal, {
  message: "Field 'value' must be a Decimal. Location: ['Models', 'ProjectContract']",
}),
  currency: z.string().default("SAR"),
  signedDate: z.date().nullish(),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
  retentionPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'retentionPercent' must be a Decimal. Location: ['Models', 'ProjectContract']",
}).nullish(),
  retentionCap: z.instanceof(Prisma.Decimal, {
  message: "Field 'retentionCap' must be a Decimal. Location: ['Models', 'ProjectContract']",
}).nullish(),
  retentionReleaseDays: z.number().int().nullish(),
  includesVat: z.boolean(),
  vatPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatPercent' must be a Decimal. Location: ['Models', 'ProjectContract']",
}).nullish(),
  paymentMethod: PaymentMethodSchema.nullish(),
  performanceBondPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'performanceBondPercent' must be a Decimal. Location: ['Models', 'ProjectContract']",
}).nullish(),
  performanceBondAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'performanceBondAmount' must be a Decimal. Location: ['Models', 'ProjectContract']",
}).nullish(),
  insuranceRequired: z.boolean(),
  insuranceDetails: z.string().nullish(),
  scopeOfWork: z.string().nullish(),
  penaltyPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'penaltyPercent' must be a Decimal. Location: ['Models', 'ProjectContract']",
}).nullish(),
  penaltyCapPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'penaltyCapPercent' must be a Decimal. Location: ['Models', 'ProjectContract']",
}).nullish(),
  notes: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectContractType = z.infer<typeof ProjectContractSchema>;


// File: ContractPaymentTerm.schema.ts

export const ContractPaymentTermSchema = z.object({
  id: z.string(),
  contractId: z.string(),
  type: PaymentTermTypeSchema,
  label: z.string().nullish(),
  percent: z.instanceof(Prisma.Decimal, {
  message: "Field 'percent' must be a Decimal. Location: ['Models', 'ContractPaymentTerm']",
}).nullish(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'ContractPaymentTerm']",
}).nullish(),
  dueDate: z.date().nullish(),
  milestoneId: z.string().nullish(),
  sortOrder: z.number().int(),
  status: PaymentTermStatusSchema.default("PENDING"),
  paidAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'paidAmount' must be a Decimal. Location: ['Models', 'ContractPaymentTerm']",
}),
  note: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContractPaymentTermType = z.infer<typeof ContractPaymentTermSchema>;


// File: ProjectPayment.schema.ts

export const ProjectPaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  contractTermId: z.string().nullish(),
  paymentNo: z.string(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'ProjectPayment']",
}),
  date: z.date(),
  paymentMethod: PaymentMethodSchema.default("CASH"),
  referenceNo: z.string().nullish(),
  description: z.string().nullish(),
  note: z.string().nullish(),
  destinationAccountId: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectPaymentType = z.infer<typeof ProjectPaymentSchema>;


// File: ProjectDocument.schema.ts

export const ProjectDocumentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  folder: DocumentFolderSchema,
  title: z.string(),
  description: z.string().nullish(),
  fileUrl: z.string().nullish(),
  version: z.number().int().default(1),
  fileName: z.string().nullish(),
  fileSize: z.number().int().nullish(),
  mimeType: z.string().nullish(),
  storagePath: z.string().nullish(),
  thumbnailPath: z.string().nullish(),
  uploadType: DocumentUploadTypeSchema.default("FILE"),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectDocumentType = z.infer<typeof ProjectDocumentSchema>;


// File: DocumentVersion.schema.ts

export const DocumentVersionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  versionNumber: z.number().int(),
  fileName: z.string(),
  fileSize: z.number().int(),
  fileType: z.string(),
  storagePath: z.string(),
  uploadedBy: z.string(),
  changeNotes: z.string().nullish(),
  createdAt: z.date(),
});

export type DocumentVersionType = z.infer<typeof DocumentVersionSchema>;


// File: ProjectApproval.schema.ts

export const ProjectApprovalSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  documentId: z.string(),
  status: ApprovalStatusSchema.default("PENDING"),
  note: z.string().nullish(),
  requestedById: z.string(),
  requestedAt: z.date(),
  decidedAt: z.date().nullish(),
  decisionNote: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectApprovalType = z.infer<typeof ProjectApprovalSchema>;


// File: ProjectApprovalApprover.schema.ts

export const ProjectApprovalApproverSchema = z.object({
  id: z.string(),
  approvalId: z.string(),
  userId: z.string(),
  status: ApproverStatusSchema.default("PENDING"),
  decidedAt: z.date().nullish(),
  note: z.string().nullish(),
});

export type ProjectApprovalApproverType = z.infer<typeof ProjectApprovalApproverSchema>;


// File: ProjectAuditLog.schema.ts

export const ProjectAuditLogSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  actorId: z.string(),
  action: AuditActionSchema,
  entityType: z.string(),
  entityId: z.string(),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
});

export type ProjectAuditLogType = z.infer<typeof ProjectAuditLogSchema>;


// File: ProjectMessage.schema.ts

export const ProjectMessageSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  channel: MessageChannelSchema,
  senderId: z.string(),
  content: z.string(),
  isUpdate: z.boolean(),
  createdAt: z.date(),
});

export type ProjectMessageType = z.infer<typeof ProjectMessageSchema>;


// File: ChatLastRead.schema.ts

export const ChatLastReadSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  userId: z.string(),
  channel: MessageChannelSchema,
  lastReadAt: z.date(),
});

export type ChatLastReadType = z.infer<typeof ChatLastReadSchema>;


// File: Notification.schema.ts

export const NotificationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string().nullish(),
  projectId: z.string().nullish(),
  entityType: z.string().nullish(),
  entityId: z.string().nullish(),
  channel: NotificationChannelSchema.default("IN_APP"),
  deliveryStatus: DeliveryStatusSchema.default("PENDING"),
  dedupeKey: z.string().nullish(),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
  readAt: z.date().nullish(),
  sentAt: z.date().nullish(),
});

export type NotificationModel = z.infer<typeof NotificationSchema>;

// File: NotificationPreference.schema.ts

export const NotificationPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  approvalRequested: z.array(NotificationChannelSchema),
  approvalDecided: z.array(NotificationChannelSchema),
  documentCreated: z.array(NotificationChannelSchema),
  dailyReportCreated: z.array(NotificationChannelSchema),
  issueCreated: z.array(NotificationChannelSchema),
  issueCritical: z.array(NotificationChannelSchema),
  expenseCreated: z.array(NotificationChannelSchema),
  claimCreated: z.array(NotificationChannelSchema),
  claimStatusChanged: z.array(NotificationChannelSchema),
  changeOrderCreated: z.array(NotificationChannelSchema),
  ownerMessage: z.array(NotificationChannelSchema),
  teamMemberAdded: z.array(NotificationChannelSchema),
  emailDigest: z.boolean(),
  muteAll: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationPreferenceType = z.infer<typeof NotificationPreferenceSchema>;


// File: ProjectOwnerAccess.schema.ts

export const ProjectOwnerAccessSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  token: z.string(),
  label: z.string().nullish(),
  expiresAt: z.date().nullish(),
  isRevoked: z.boolean(),
  createdById: z.string(),
  createdAt: z.date(),
});

export type ProjectOwnerAccessType = z.infer<typeof ProjectOwnerAccessSchema>;


// File: OwnerPortalSession.schema.ts

export const OwnerPortalSessionSchema = z.object({
  id: z.string(),
  sessionToken: z.string(),
  portalAccessId: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  lastAccessedAt: z.date(),
  createdAt: z.date(),
});

export type OwnerPortalSessionType = z.infer<typeof OwnerPortalSessionSchema>;


// File: ProjectCalendar.schema.ts

export const ProjectCalendarSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  name: z.string(),
  workDays: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  holidays: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
  defaultHoursPerDay: z.instanceof(Prisma.Decimal, {
  message: "Field 'defaultHoursPerDay' must be a Decimal. Location: ['Models', 'ProjectCalendar']",
}).default(new Prisma.Decimal(8)),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectCalendarType = z.infer<typeof ProjectCalendarSchema>;


// File: ProjectActivity.schema.ts

export const ProjectActivitySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  milestoneId: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  wbsCode: z.string().nullish(),
  plannedStart: z.date().nullish(),
  plannedEnd: z.date().nullish(),
  duration: z.number().int().nullish(),
  actualStart: z.date().nullish(),
  actualEnd: z.date().nullish(),
  status: ActivityStatusSchema.default("NOT_STARTED"),
  progress: z.instanceof(Prisma.Decimal, {
  message: "Field 'progress' must be a Decimal. Location: ['Models', 'ProjectActivity']",
}),
  isCritical: z.boolean(),
  weight: z.instanceof(Prisma.Decimal, {
  message: "Field 'weight' must be a Decimal. Location: ['Models', 'ProjectActivity']",
}).nullish(),
  assigneeId: z.string().nullish(),
  calendarId: z.string().nullish(),
  orderIndex: z.number().int(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectActivityType = z.infer<typeof ProjectActivitySchema>;


// File: ActivityDependency.schema.ts

export const ActivityDependencySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  predecessorId: z.string(),
  successorId: z.string(),
  dependencyType: DependencyTypeSchema.default("FINISH_TO_START"),
  lagDays: z.number().int(),
  createdAt: z.date(),
});

export type ActivityDependencyType = z.infer<typeof ActivityDependencySchema>;


// File: ActivityChecklist.schema.ts

export const ActivityChecklistSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  activityId: z.string(),
  title: z.string(),
  isCompleted: z.boolean(),
  completedAt: z.date().nullish(),
  completedById: z.string().nullish(),
  orderIndex: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ActivityChecklistType = z.infer<typeof ActivityChecklistSchema>;


// File: ProjectBaseline.schema.ts

export const ProjectBaselineSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  snapshotDate: z.date(),
  snapshotData: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  isActive: z.boolean(),
  createdById: z.string(),
  createdAt: z.date(),
});

export type ProjectBaselineType = z.infer<typeof ProjectBaselineSchema>;


// File: ProjectMilestone.schema.ts

export const ProjectMilestoneSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  orderIndex: z.number().int(),
  plannedStart: z.date().nullish(),
  plannedEnd: z.date().nullish(),
  actualStart: z.date().nullish(),
  actualEnd: z.date().nullish(),
  status: MilestoneStatusSchema.default("PLANNED"),
  progress: z.instanceof(Prisma.Decimal, {
  message: "Field 'progress' must be a Decimal. Location: ['Models', 'ProjectMilestone']",
}),
  isCritical: z.boolean(),
  weight: z.instanceof(Prisma.Decimal, {
  message: "Field 'weight' must be a Decimal. Location: ['Models', 'ProjectMilestone']",
}).nullish(),
  color: z.string().nullish(),
  progressMethod: ProgressMethodSchema.default("MANUAL"),
  baselineStartDate: z.date().nullish(),
  baselineEndDate: z.date().nullish(),
  calendarId: z.string().nullish(),
  plannedDate: z.date().nullish(),
  actualDate: z.date().nullish(),
  isCompleted: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectMilestoneType = z.infer<typeof ProjectMilestoneSchema>;


// File: Attachment.schema.ts

export const AttachmentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().nullish(),
  ownerType: AttachmentOwnerTypeSchema,
  ownerId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  storagePath: z.string(),
  uploadId: z.string().nullish(),
  uploadedById: z.string(),
  createdAt: z.date(),
});

export type AttachmentType = z.infer<typeof AttachmentSchema>;


// File: ProjectTemplate.schema.ts

export const ProjectTemplateSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  sourceProjectId: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectTemplateType = z.infer<typeof ProjectTemplateSchema>;


// File: ProjectTemplateItem.schema.ts

export const ProjectTemplateItemSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  type: TemplateItemTypeSchema,
  title: z.string(),
  description: z.string().nullish(),
  sortOrder: z.number().int(),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
});

export type ProjectTemplateItemType = z.infer<typeof ProjectTemplateItemSchema>;


// File: ProjectAlert.schema.ts

export const ProjectAlertSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  title: z.string(),
  description: z.string().nullish(),
  dedupeKey: z.string(),
  acknowledgedAt: z.date().nullish(),
  acknowledgedById: z.string().nullish(),
  createdAt: z.date(),
});

export type ProjectAlertType = z.infer<typeof ProjectAlertSchema>;


// File: DigestSubscription.schema.ts

export const DigestSubscriptionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  projectId: z.string().nullish(),
  frequency: DigestFrequencySchema.default("WEEKLY"),
  channel: NotificationChannelSchema.default("IN_APP"),
  isEnabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DigestSubscriptionType = z.infer<typeof DigestSubscriptionSchema>;


// File: OrganizationIntegrationSettings.schema.ts

export const OrganizationIntegrationSettingsSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  emailEnabled: z.boolean().default(true),
  whatsappEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  defaultChannel: MessagingChannelSchema.default("EMAIL"),
  ownerNotifyOnOfficialUpdate: z.boolean().default(true),
  ownerNotifyOnPaymentDue: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrganizationIntegrationSettingsType = z.infer<typeof OrganizationIntegrationSettingsSchema>;


// File: OrganizationFinanceSettings.schema.ts

export const OrganizationFinanceSettingsSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  companyNameAr: z.string().nullish(),
  companyNameEn: z.string().nullish(),
  logo: z.string().nullish(),
  address: z.string().nullish(),
  addressEn: z.string().nullish(),
  buildingNumber: z.string().nullish(),
  street: z.string().nullish(),
  secondaryNumber: z.string().nullish(),
  postalCode: z.string().nullish(),
  city: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  website: z.string().nullish(),
  taxNumber: z.string().nullish(),
  commercialReg: z.string().nullish(),
  bankName: z.string().nullish(),
  bankNameEn: z.string().nullish(),
  accountName: z.string().nullish(),
  iban: z.string().nullish(),
  accountNumber: z.string().nullish(),
  swiftCode: z.string().nullish(),
  headerText: z.string().nullish(),
  footerText: z.string().nullish(),
  thankYouMessage: z.string().nullish(),
  defaultVatPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'defaultVatPercent' must be a Decimal. Location: ['Models', 'OrganizationFinanceSettings']",
}).default(new Prisma.Decimal(15)),
  defaultCurrency: z.string().default("SAR"),
  defaultPaymentTerms: z.string().nullish(),
  defaultDeliveryTerms: z.string().nullish(),
  defaultWarrantyTerms: z.string().nullish(),
  quotationValidityDays: z.number().int().default(30),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrganizationFinanceSettingsType = z.infer<typeof OrganizationFinanceSettingsSchema>;


// File: MessageDeliveryLog.schema.ts

export const MessageDeliveryLogSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().nullish(),
  channel: MessagingChannelSchema,
  recipient: z.string(),
  subject: z.string().nullish(),
  content: z.string().nullish(),
  status: MessageDeliveryStatusSchema.default("PENDING"),
  provider: z.string().nullish(),
  errorMessage: z.string().nullish(),
  sentById: z.string().nullish(),
  createdAt: z.date(),
});

export type MessageDeliveryLogType = z.infer<typeof MessageDeliveryLogSchema>;


// File: ShareLink.schema.ts

export const ShareLinkSchema = z.object({
  id: z.string(),
  token: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  resourceType: ShareResourceTypeSchema,
  resourceId: z.string().nullish(),
  expiresAt: z.date().nullish(),
  isRevoked: z.boolean(),
  createdById: z.string(),
  createdAt: z.date(),
});

export type ShareLinkType = z.infer<typeof ShareLinkSchema>;


// File: ProjectChangeOrder.schema.ts

export const ProjectChangeOrderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  coNo: z.number().int(),
  title: z.string(),
  description: z.string().nullish(),
  category: ChangeOrderCategorySchema.default("OTHER"),
  status: ChangeOrderStatusSchema.default("DRAFT"),
  costImpact: z.instanceof(Prisma.Decimal, {
  message: "Field 'costImpact' must be a Decimal. Location: ['Models', 'ProjectChangeOrder']",
}).nullish(),
  currency: z.string().default("SAR").nullish(),
  timeImpactDays: z.number().int().nullish(),
  milestoneId: z.string().nullish(),
  claimId: z.string().nullish(),
  contractId: z.string().nullish(),
  requestedById: z.string(),
  requestedAt: z.date().nullish(),
  decidedById: z.string().nullish(),
  decidedAt: z.date().nullish(),
  decisionNote: z.string().nullish(),
  implementedAt: z.date().nullish(),
  implementedById: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectChangeOrderType = z.infer<typeof ProjectChangeOrderSchema>;


// File: ProjectBOQItem.schema.ts

export const ProjectBOQItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  organizationId: z.string(),
  sourceType: BOQSourceTypeSchema.default("MANUAL"),
  costStudyId: z.string().nullish(),
  sourceItemId: z.string().nullish(),
  quotationId: z.string().nullish(),
  sortOrder: z.number().int(),
  section: BOQSectionSchema.default("GENERAL"),
  category: z.string().nullish(),
  code: z.string().nullish(),
  description: z.string(),
  specifications: z.string().nullish(),
  unit: z.string(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'ProjectBOQItem']",
}),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'ProjectBOQItem']",
}).nullish(),
  totalPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalPrice' must be a Decimal. Location: ['Models', 'ProjectBOQItem']",
}).nullish(),
  projectPhaseId: z.string().nullish(),
  notes: z.string().nullish(),
  createdById: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectBOQItemType = z.infer<typeof ProjectBOQItemSchema>;


// File: Client.schema.ts

export const ClientSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  clientType: ClientTypeSchema.default("INDIVIDUAL"),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  businessName: z.string().nullish(),
  name: z.string(),
  company: z.string().nullish(),
  phone: z.string().nullish(),
  mobile: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
  streetAddress1: z.string().nullish(),
  streetAddress2: z.string().nullish(),
  city: z.string().nullish(),
  region: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().default("SA"),
  secondaryAddress: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  code: z.string().nullish(),
  currency: z.string().default("SAR"),
  displayLanguage: z.string().default("ar"),
  classification: z.array(z.string()),
  taxNumber: z.string().nullish(),
  crNumber: z.string().nullish(),
  notes: z.string().nullish(),
  isActive: z.boolean().default(true),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClientModel = z.infer<typeof ClientSchema>;

// File: ClientContact.schema.ts

export const ClientContactSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
  position: z.string().nullish(),
  phone: z.string().nullish(),
  mobile: z.string().nullish(),
  email: z.string().nullish(),
  isPrimary: z.boolean(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClientContactType = z.infer<typeof ClientContactSchema>;


// File: Quotation.schema.ts

export const QuotationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  quotationNo: z.string(),
  clientId: z.string().nullish(),
  clientName: z.string(),
  clientCompany: z.string().nullish(),
  clientPhone: z.string().nullish(),
  clientEmail: z.string().nullish(),
  clientAddress: z.string().nullish(),
  clientTaxNumber: z.string().nullish(),
  projectId: z.string().nullish(),
  status: QuotationStatusSchema.default("DRAFT"),
  subtotal: z.instanceof(Prisma.Decimal, {
  message: "Field 'subtotal' must be a Decimal. Location: ['Models', 'Quotation']",
}),
  discountPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'discountPercent' must be a Decimal. Location: ['Models', 'Quotation']",
}),
  discountAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'discountAmount' must be a Decimal. Location: ['Models', 'Quotation']",
}),
  vatPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatPercent' must be a Decimal. Location: ['Models', 'Quotation']",
}).default(new Prisma.Decimal(15)),
  vatAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatAmount' must be a Decimal. Location: ['Models', 'Quotation']",
}),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'Quotation']",
}),
  validUntil: z.date(),
  paymentTerms: z.string().nullish(),
  deliveryTerms: z.string().nullish(),
  warrantyTerms: z.string().nullish(),
  notes: z.string().nullish(),
  introduction: z.string().nullish(),
  termsAndConditions: z.string().nullish(),
  templateId: z.string().nullish(),
  viewedAt: z.date().nullish(),
  sentAt: z.date().nullish(),
  acceptedAt: z.date().nullish(),
  rejectedAt: z.date().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  costStudyId: z.string().nullish(),
});

export type QuotationType = z.infer<typeof QuotationSchema>;


// File: QuotationItem.schema.ts

export const QuotationItemSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  description: z.string(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'QuotationItem']",
}).default(new Prisma.Decimal(1)),
  unit: z.string().nullish(),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'QuotationItem']",
}),
  totalPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalPrice' must be a Decimal. Location: ['Models', 'QuotationItem']",
}),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuotationItemType = z.infer<typeof QuotationItemSchema>;


// File: QuotationDisplayConfig.schema.ts

export const QuotationDisplayConfigSchema = z.object({
  id: z.string(),
  quotationId: z.string().nullish(),
  quoteId: z.string().nullish(),
  format: QuotationFormatSchema.default("DETAILED_BOQ"),
  grouping: QuotationGroupingSchema.default("BY_SECTION"),
  showItemNumber: z.boolean().default(true),
  showDescription: z.boolean().default(true),
  showSpecifications: z.boolean().default(true),
  showQuantity: z.boolean().default(true),
  showUnit: z.boolean().default(true),
  showUnitPrice: z.boolean().default(true),
  showItemTotal: z.boolean().default(true),
  showStructural: z.boolean().default(true),
  showFinishing: z.boolean().default(true),
  showMEP: z.boolean().default(true),
  showManualItems: z.boolean().default(true),
  showMaterialDetails: z.boolean(),
  showSectionSubtotal: z.boolean().default(true),
  showSubtotal: z.boolean().default(true),
  showDiscount: z.boolean().default(true),
  showVAT: z.boolean().default(true),
  showGrandTotal: z.boolean().default(true),
  showPricePerSqm: z.boolean(),
  totalArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalArea' must be a Decimal. Location: ['Models', 'QuotationDisplayConfig']",
}).nullish(),
  pricePerSqm: z.instanceof(Prisma.Decimal, {
  message: "Field 'pricePerSqm' must be a Decimal. Location: ['Models', 'QuotationDisplayConfig']",
}).nullish(),
  lumpSumAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'lumpSumAmount' must be a Decimal. Location: ['Models', 'QuotationDisplayConfig']",
}).nullish(),
  lumpSumDescription: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuotationDisplayConfigType = z.infer<typeof QuotationDisplayConfigSchema>;


// File: QuotationContentBlock.schema.ts

export const QuotationContentBlockSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  title: z.string(),
  content: z.string(),
  position: QuotationBlockPositionSchema.default("BEFORE_TABLE"),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuotationContentBlockType = z.infer<typeof QuotationContentBlockSchema>;


// File: FinanceInvoice.schema.ts

export const FinanceInvoiceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceNo: z.string(),
  invoiceType: InvoiceTypeSchema.default("STANDARD"),
  clientId: z.string().nullish(),
  clientName: z.string(),
  clientCompany: z.string().nullish(),
  clientPhone: z.string().nullish(),
  clientEmail: z.string().nullish(),
  clientAddress: z.string().nullish(),
  clientTaxNumber: z.string().nullish(),
  projectId: z.string().nullish(),
  quotationId: z.string().nullish(),
  status: FinanceInvoiceStatusSchema.default("DRAFT"),
  issueDate: z.date(),
  dueDate: z.date(),
  subtotal: z.instanceof(Prisma.Decimal, {
  message: "Field 'subtotal' must be a Decimal. Location: ['Models', 'FinanceInvoice']",
}),
  discountPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'discountPercent' must be a Decimal. Location: ['Models', 'FinanceInvoice']",
}),
  discountAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'discountAmount' must be a Decimal. Location: ['Models', 'FinanceInvoice']",
}),
  vatPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatPercent' must be a Decimal. Location: ['Models', 'FinanceInvoice']",
}).default(new Prisma.Decimal(15)),
  vatAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'vatAmount' must be a Decimal. Location: ['Models', 'FinanceInvoice']",
}),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'FinanceInvoice']",
}),
  paidAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'paidAmount' must be a Decimal. Location: ['Models', 'FinanceInvoice']",
}),
  sellerName: z.string().nullish(),
  sellerAddress: z.string().nullish(),
  sellerPhone: z.string().nullish(),
  relatedInvoiceId: z.string().nullish(),
  issuedAt: z.date().nullish(),
  sellerTaxNumber: z.string().nullish(),
  qrCode: z.string().nullish(),
  zatcaUuid: z.string().nullish(),
  zatcaHash: z.string().nullish(),
  zatcaSignature: z.string().nullish(),
  zatcaInvoiceType: ZatcaInvoiceTypeSchema.nullish(),
  zatcaSubmissionStatus: ZatcaSubmissionStatusSchema.default("NOT_APPLICABLE"),
  zatcaCounterValue: z.number().int().nullish(),
  zatcaPreviousHash: z.string().nullish(),
  zatcaXml: z.string().nullish(),
  zatcaClearedXml: z.string().nullish(),
  zatcaSubmittedAt: z.date().nullish(),
  zatcaClearedAt: z.date().nullish(),
  paymentTerms: z.string().nullish(),
  notes: z.string().nullish(),
  templateId: z.string().nullish(),
  viewedAt: z.date().nullish(),
  sentAt: z.date().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinanceInvoiceType = z.infer<typeof FinanceInvoiceSchema>;


// File: FinanceInvoiceItem.schema.ts

export const FinanceInvoiceItemSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  description: z.string(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'FinanceInvoiceItem']",
}).default(new Prisma.Decimal(1)),
  unit: z.string().nullish(),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'FinanceInvoiceItem']",
}),
  totalPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalPrice' must be a Decimal. Location: ['Models', 'FinanceInvoiceItem']",
}),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinanceInvoiceItemType = z.infer<typeof FinanceInvoiceItemSchema>;


// File: FinanceInvoicePayment.schema.ts

export const FinanceInvoicePaymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'FinanceInvoicePayment']",
}),
  paymentDate: z.date(),
  paymentMethod: z.string().nullish(),
  referenceNo: z.string().nullish(),
  notes: z.string().nullish(),
  sourceAccountId: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
});

export type FinanceInvoicePaymentType = z.infer<typeof FinanceInvoicePaymentSchema>;


// File: OpenDocument.schema.ts

export const OpenDocumentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  documentNo: z.string(),
  documentType: OpenDocumentTypeSchema.default("OTHER"),
  title: z.string(),
  content: z.string(),
  clientId: z.string().nullish(),
  projectId: z.string().nullish(),
  recipientName: z.string().nullish(),
  recipientCompany: z.string().nullish(),
  recipientAddress: z.string().nullish(),
  templateId: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OpenDocumentModel = z.infer<typeof OpenDocumentSchema>;

// File: FinanceTemplate.schema.ts

export const FinanceTemplateSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  templateType: FinanceTemplateTypeSchema,
  isDefault: z.boolean(),
  content: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{}"),
  settings: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{}"),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinanceTemplateModel = z.infer<typeof FinanceTemplateSchema>;

// File: OrganizationBank.schema.ts

export const OrganizationBankSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  accountNumber: z.string().nullish(),
  bankName: z.string().nullish(),
  iban: z.string().nullish(),
  accountType: FinanceAccountTypeSchema.default("BANK"),
  openingBalance: z.instanceof(Prisma.Decimal, {
  message: "Field 'openingBalance' must be a Decimal. Location: ['Models', 'OrganizationBank']",
}),
  balance: z.instanceof(Prisma.Decimal, {
  message: "Field 'balance' must be a Decimal. Location: ['Models', 'OrganizationBank']",
}),
  currency: z.string().default("SAR"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean(),
  notes: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  chartAccountId: z.string().nullish(),
});

export type OrganizationBankType = z.infer<typeof OrganizationBankSchema>;


// File: FinanceExpense.schema.ts

export const FinanceExpenseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  expenseNo: z.string(),
  category: OrgExpenseCategorySchema,
  customCategory: z.string().nullish(),
  categoryId: z.string().nullish(),
  subcategoryId: z.string().nullish(),
  description: z.string().nullish(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'FinanceExpense']",
}),
  date: z.date(),
  sourceAccountId: z.string().nullish(),
  vendorName: z.string().nullish(),
  vendorTaxNumber: z.string().nullish(),
  projectId: z.string().nullish(),
  invoiceRef: z.string().nullish(),
  paymentMethod: PaymentMethodSchema.default("BANK_TRANSFER"),
  referenceNo: z.string().nullish(),
  status: FinanceTransactionStatusSchema.default("COMPLETED"),
  sourceType: ExpenseSourceTypeSchema.default("MANUAL"),
  sourceId: z.string().nullish(),
  paidAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'paidAmount' must be a Decimal. Location: ['Models', 'FinanceExpense']",
}),
  dueDate: z.date().nullish(),
  notes: z.string().nullish(),
  voucherNo: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinanceExpenseType = z.infer<typeof FinanceExpenseSchema>;


// File: FinancePayment.schema.ts

export const FinancePaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  paymentNo: z.string(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'FinancePayment']",
}),
  date: z.date(),
  destinationAccountId: z.string(),
  clientId: z.string().nullish(),
  clientName: z.string().nullish(),
  projectId: z.string().nullish(),
  invoiceId: z.string().nullish(),
  contractTermId: z.string().nullish(),
  paymentMethod: PaymentMethodSchema.default("CASH"),
  referenceNo: z.string().nullish(),
  status: FinanceTransactionStatusSchema.default("COMPLETED"),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinancePaymentType = z.infer<typeof FinancePaymentSchema>;


// File: FinanceTransfer.schema.ts

export const FinanceTransferSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  transferNo: z.string(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'FinanceTransfer']",
}),
  date: z.date(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  status: FinanceTransactionStatusSchema.default("COMPLETED"),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  referenceNo: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinanceTransferType = z.infer<typeof FinanceTransferSchema>;


// File: CompanyExpense.schema.ts

export const CompanyExpenseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  category: CompanyExpenseCategorySchema,
  description: z.string().nullish(),
  categoryId: z.string().nullish(),
  subcategoryId: z.string().nullish(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'CompanyExpense']",
}),
  recurrence: RecurrenceTypeSchema.default("MONTHLY"),
  vendor: z.string().nullish(),
  contractNumber: z.string().nullish(),
  startDate: z.date(),
  endDate: z.date().nullish(),
  reminderDays: z.number().int().default(5),
  isActive: z.boolean().default(true),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyExpenseType = z.infer<typeof CompanyExpenseSchema>;


// File: CompanyExpensePayment.schema.ts

export const CompanyExpensePaymentSchema = z.object({
  id: z.string(),
  expenseId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'CompanyExpensePayment']",
}),
  isPaid: z.boolean(),
  paidAt: z.date().nullish(),
  dueDate: z.date(),
  bankAccountId: z.string().nullish(),
  referenceNo: z.string().nullish(),
  notes: z.string().nullish(),
  financeExpenseId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyExpensePaymentType = z.infer<typeof CompanyExpensePaymentSchema>;


// File: CompanyExpenseAllocation.schema.ts

export const CompanyExpenseAllocationSchema = z.object({
  id: z.string(),
  expenseId: z.string(),
  projectId: z.string(),
  percentage: z.instanceof(Prisma.Decimal, {
  message: "Field 'percentage' must be a Decimal. Location: ['Models', 'CompanyExpenseAllocation']",
}),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyExpenseAllocationType = z.infer<typeof CompanyExpenseAllocationSchema>;


// File: Employee.schema.ts

export const EmployeeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  linkedUserId: z.string().nullish(),
  name: z.string(),
  employeeNo: z.string().nullish(),
  type: EmployeeTypeSchema,
  phone: z.string().nullish(),
  email: z.string().nullish(),
  nationalId: z.string().nullish(),
  salaryType: SalaryTypeSchema.default("MONTHLY"),
  baseSalary: z.instanceof(Prisma.Decimal, {
  message: "Field 'baseSalary' must be a Decimal. Location: ['Models', 'Employee']",
}),
  housingAllowance: z.instanceof(Prisma.Decimal, {
  message: "Field 'housingAllowance' must be a Decimal. Location: ['Models', 'Employee']",
}),
  transportAllowance: z.instanceof(Prisma.Decimal, {
  message: "Field 'transportAllowance' must be a Decimal. Location: ['Models', 'Employee']",
}),
  otherAllowances: z.instanceof(Prisma.Decimal, {
  message: "Field 'otherAllowances' must be a Decimal. Location: ['Models', 'Employee']",
}),
  gosiSubscription: z.instanceof(Prisma.Decimal, {
  message: "Field 'gosiSubscription' must be a Decimal. Location: ['Models', 'Employee']",
}),
  joinDate: z.date(),
  endDate: z.date().nullish(),
  status: EmployeeStatusSchema.default("ACTIVE"),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmployeeModel = z.infer<typeof EmployeeSchema>;

// File: EmployeeChangeLog.schema.ts

export const EmployeeChangeLogSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  organizationId: z.string(),
  changedBy: z.string(),
  changeType: EmployeeChangeTypeSchema,
  fieldName: z.string(),
  oldValue: z.string().nullish(),
  newValue: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.date(),
});

export type EmployeeChangeLogType = z.infer<typeof EmployeeChangeLogSchema>;


// File: LeaveType.schema.ts

export const LeaveTypeSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  nameEn: z.string().nullish(),
  daysPerYear: z.number().int(),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  color: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LeaveTypeType = z.infer<typeof LeaveTypeSchema>;


// File: LeaveBalance.schema.ts

export const LeaveBalanceSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  leaveTypeId: z.string(),
  year: z.number().int(),
  totalDays: z.number().int(),
  usedDays: z.number().int(),
  remainingDays: z.number().int(),
});

export type LeaveBalanceType = z.infer<typeof LeaveBalanceSchema>;


// File: LeaveRequest.schema.ts

export const LeaveRequestSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  organizationId: z.string(),
  leaveTypeId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  totalDays: z.number().int(),
  reason: z.string().nullish(),
  status: LeaveStatusSchema.default("PENDING"),
  approvedBy: z.string().nullish(),
  approvedAt: z.date().nullish(),
  rejectionReason: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LeaveRequestType = z.infer<typeof LeaveRequestSchema>;


// File: EmployeeProjectAssignment.schema.ts

export const EmployeeProjectAssignmentSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  projectId: z.string(),
  percentage: z.instanceof(Prisma.Decimal, {
  message: "Field 'percentage' must be a Decimal. Location: ['Models', 'EmployeeProjectAssignment']",
}),
  startDate: z.date(),
  endDate: z.date().nullish(),
  isActive: z.boolean().default(true),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmployeeProjectAssignmentType = z.infer<typeof EmployeeProjectAssignmentSchema>;


// File: CompanyAsset.schema.ts

export const CompanyAssetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  assetNo: z.string().nullish(),
  category: AssetCategorySchema,
  type: AssetTypeSchema.default("OWNED"),
  status: AssetStatusSchema.default("AVAILABLE"),
  brand: z.string().nullish(),
  model: z.string().nullish(),
  serialNumber: z.string().nullish(),
  year: z.number().int().nullish(),
  description: z.string().nullish(),
  purchasePrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'purchasePrice' must be a Decimal. Location: ['Models', 'CompanyAsset']",
}).nullish(),
  monthlyRent: z.instanceof(Prisma.Decimal, {
  message: "Field 'monthlyRent' must be a Decimal. Location: ['Models', 'CompanyAsset']",
}).nullish(),
  currentValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'currentValue' must be a Decimal. Location: ['Models', 'CompanyAsset']",
}).nullish(),
  purchaseDate: z.date().nullish(),
  warrantyExpiry: z.date().nullish(),
  insuranceExpiry: z.date().nullish(),
  currentProjectId: z.string().nullish(),
  assignedAt: z.date().nullish(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyAssetType = z.infer<typeof CompanyAssetSchema>;


// File: PayrollRun.schema.ts

export const PayrollRunSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  runNo: z.string(),
  month: z.number().int(),
  year: z.number().int(),
  totalBaseSalary: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalBaseSalary' must be a Decimal. Location: ['Models', 'PayrollRun']",
}),
  totalAllowances: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAllowances' must be a Decimal. Location: ['Models', 'PayrollRun']",
}),
  totalDeductions: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalDeductions' must be a Decimal. Location: ['Models', 'PayrollRun']",
}),
  totalNetSalary: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalNetSalary' must be a Decimal. Location: ['Models', 'PayrollRun']",
}),
  employeeCount: z.number().int(),
  status: PayrollRunStatusSchema.default("DRAFT"),
  approvedById: z.string().nullish(),
  approvedAt: z.date().nullish(),
  sourceAccountId: z.string().nullish(),
  createdById: z.string(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayrollRunType = z.infer<typeof PayrollRunSchema>;


// File: PayrollRunItem.schema.ts

export const PayrollRunItemSchema = z.object({
  id: z.string(),
  payrollRunId: z.string(),
  employeeId: z.string(),
  baseSalary: z.instanceof(Prisma.Decimal, {
  message: "Field 'baseSalary' must be a Decimal. Location: ['Models', 'PayrollRunItem']",
}),
  housingAllowance: z.instanceof(Prisma.Decimal, {
  message: "Field 'housingAllowance' must be a Decimal. Location: ['Models', 'PayrollRunItem']",
}),
  transportAllowance: z.instanceof(Prisma.Decimal, {
  message: "Field 'transportAllowance' must be a Decimal. Location: ['Models', 'PayrollRunItem']",
}),
  otherAllowances: z.instanceof(Prisma.Decimal, {
  message: "Field 'otherAllowances' must be a Decimal. Location: ['Models', 'PayrollRunItem']",
}),
  gosiDeduction: z.instanceof(Prisma.Decimal, {
  message: "Field 'gosiDeduction' must be a Decimal. Location: ['Models', 'PayrollRunItem']",
}),
  otherDeductions: z.instanceof(Prisma.Decimal, {
  message: "Field 'otherDeductions' must be a Decimal. Location: ['Models', 'PayrollRunItem']",
}),
  netSalary: z.instanceof(Prisma.Decimal, {
  message: "Field 'netSalary' must be a Decimal. Location: ['Models', 'PayrollRunItem']",
}),
  financeExpenseId: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayrollRunItemType = z.infer<typeof PayrollRunItemSchema>;


// File: CompanyExpenseRun.schema.ts

export const CompanyExpenseRunSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  runNo: z.string(),
  month: z.number().int(),
  year: z.number().int(),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'CompanyExpenseRun']",
}),
  itemCount: z.number().int(),
  status: ExpenseRunStatusSchema.default("DRAFT"),
  postedById: z.string().nullish(),
  postedAt: z.date().nullish(),
  createdById: z.string(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyExpenseRunType = z.infer<typeof CompanyExpenseRunSchema>;


// File: CompanyExpenseRunItem.schema.ts

export const CompanyExpenseRunItemSchema = z.object({
  id: z.string(),
  expenseRunId: z.string(),
  companyExpenseId: z.string(),
  name: z.string(),
  category: z.string(),
  vendor: z.string().nullish(),
  originalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'originalAmount' must be a Decimal. Location: ['Models', 'CompanyExpenseRunItem']",
}),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'CompanyExpenseRunItem']",
}),
  financeExpenseId: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyExpenseRunItemType = z.infer<typeof CompanyExpenseRunItemSchema>;


// File: OrganizationAuditLog.schema.ts

export const OrganizationAuditLogSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  actorId: z.string(),
  action: OrgAuditActionSchema,
  entityType: z.string(),
  entityId: z.string(),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  ipAddress: z.string().nullish(),
  createdAt: z.date(),
});

export type OrganizationAuditLogType = z.infer<typeof OrganizationAuditLogSchema>;


// File: OrganizationSequence.schema.ts

export const OrganizationSequenceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  sequenceKey: z.string(),
  currentValue: z.number().int(),
  updatedAt: z.date(),
});

export type OrganizationSequenceType = z.infer<typeof OrganizationSequenceSchema>;


// File: AiChatUsage.schema.ts

export const AiChatUsageSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  totalChats: z.number().int(),
  updatedAt: z.date(),
});

export type AiChatUsageType = z.infer<typeof AiChatUsageSchema>;


// File: OnboardingProgress.schema.ts

export const OnboardingProgressSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  companyInfoDone: z.boolean(),
  logoDone: z.boolean(),
  templateDone: z.boolean(),
  firstProjectDone: z.boolean(),
  teamInviteDone: z.boolean(),
  wizardCompleted: z.boolean(),
  wizardCompletedAt: z.date().nullish(),
  wizardSkippedSteps: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  firstQuantityAdded: z.boolean(),
  firstInvoiceCreated: z.boolean(),
  firstExpenseRecorded: z.boolean(),
  zatcaInfoComplete: z.boolean(),
  checklistDismissed: z.boolean(),
  checklistDismissedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OnboardingProgressType = z.infer<typeof OnboardingProgressSchema>;


// File: Lead.schema.ts

export const LeadSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  createdById: z.string(),
  name: z.string(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  company: z.string().nullish(),
  clientType: ClientTypeSchema.default("INDIVIDUAL"),
  projectType: ProjectTypeSchema.nullish(),
  projectLocation: z.string().nullish(),
  estimatedArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'estimatedArea' must be a Decimal. Location: ['Models', 'Lead']",
}).nullish(),
  estimatedValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'estimatedValue' must be a Decimal. Location: ['Models', 'Lead']",
}).nullish(),
  status: LeadStatusSchema.default("NEW"),
  source: LeadSourceSchema.default("DIRECT"),
  priority: LeadPrioritySchema.default("NORMAL"),
  assignedToId: z.string().nullish(),
  expectedCloseDate: z.date().nullish(),
  lostReason: z.string().nullish(),
  notes: z.string().nullish(),
  costStudyId: z.string().nullish(),
  quotationId: z.string().nullish(),
  convertedProjectId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LeadType = z.infer<typeof LeadSchema>;


// File: LeadFile.schema.ts

export const LeadFileSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  organizationId: z.string(),
  createdById: z.string(),
  name: z.string(),
  fileUrl: z.string(),
  storagePath: z.string(),
  fileSize: z.number().int().nullish(),
  mimeType: z.string().nullish(),
  category: LeadFileCategorySchema.default("OTHER"),
  description: z.string().nullish(),
  createdAt: z.date(),
});

export type LeadFileType = z.infer<typeof LeadFileSchema>;


// File: LeadActivity.schema.ts

export const LeadActivitySchema = z.object({
  id: z.string(),
  leadId: z.string(),
  organizationId: z.string(),
  createdById: z.string(),
  type: LeadActivityTypeSchema.default("COMMENT"),
  content: z.string().nullish(),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
});

export type LeadActivityModel = z.infer<typeof LeadActivitySchema>;

// File: ActivationCode.schema.ts

export const ActivationCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string().nullish(),
  planType: PlanTypeSchema.default("PRO"),
  durationDays: z.number().int().default(90),
  maxUsers: z.number().int().default(50),
  maxProjects: z.number().int().default(100),
  maxStorageGB: z.number().int().default(50),
  isActive: z.boolean().default(true),
  maxUses: z.number().int().default(1),
  usedCount: z.number().int(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().nullish(),
});

export type ActivationCodeType = z.infer<typeof ActivationCodeSchema>;


// File: ActivationCodeUsage.schema.ts

export const ActivationCodeUsageSchema = z.object({
  id: z.string(),
  codeId: z.string(),
  organizationId: z.string(),
  activatedById: z.string(),
  activatedAt: z.date(),
  planExpiresAt: z.date(),
});

export type ActivationCodeUsageType = z.infer<typeof ActivationCodeUsageSchema>;


// File: CostingItem.schema.ts

export const CostingItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  organizationId: z.string(),
  section: z.string(),
  sourceItemId: z.string().nullish(),
  sourceItemType: z.string().nullish(),
  description: z.string(),
  unit: z.string(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'CostingItem']",
}),
  materialUnitCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialUnitCost' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  materialTotal: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialTotal' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  laborType: LaborCostTypeSchema.nullish(),
  laborUnitCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborUnitCost' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  laborQuantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborQuantity' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  laborWorkers: z.number().int().nullish(),
  laborSalary: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborSalary' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  laborMonths: z.number().int().nullish(),
  laborTotal: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborTotal' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  storageCostPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'storageCostPercent' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  storageCostFixed: z.instanceof(Prisma.Decimal, {
  message: "Field 'storageCostFixed' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  storageTotal: z.instanceof(Prisma.Decimal, {
  message: "Field 'storageTotal' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  otherCosts: z.instanceof(Prisma.Decimal, {
  message: "Field 'otherCosts' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'CostingItem']",
}).nullish(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CostingItemType = z.infer<typeof CostingItemSchema>;


// File: ManualItem.schema.ts

export const ManualItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  organizationId: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'quantity' must be a Decimal. Location: ['Models', 'ManualItem']",
}),
  section: z.string().nullish(),
  notes: z.string().nullish(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ManualItemType = z.infer<typeof ManualItemSchema>;


// File: SectionMarkup.schema.ts

export const SectionMarkupSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  organizationId: z.string(),
  section: z.string(),
  markupPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'markupPercent' must be a Decimal. Location: ['Models', 'SectionMarkup']",
}),
});

export type SectionMarkupType = z.infer<typeof SectionMarkupSchema>;


// File: ChartAccount.schema.ts

export const ChartAccountSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  nameAr: z.string(),
  nameEn: z.string(),
  description: z.string().nullish(),
  type: ChartAccountTypeSchema,
  normalBalance: NormalBalanceSchema,
  level: z.number().int(),
  parentId: z.string().nullish(),
  isSystem: z.boolean(),
  isActive: z.boolean().default(true),
  isPostable: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChartAccountModel = z.infer<typeof ChartAccountSchema>;

// File: JournalEntry.schema.ts

export const JournalEntrySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  entryNo: z.string(),
  date: z.date(),
  description: z.string(),
  referenceType: z.string().nullish(),
  referenceId: z.string().nullish(),
  referenceNo: z.string().nullish(),
  isAutoGenerated: z.boolean().default(true),
  status: JournalEntryStatusSchema.default("DRAFT"),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'JournalEntry']",
}),
  isReversed: z.boolean(),
  reversedById: z.string().nullish(),
  reversalId: z.string().nullish(),
  notes: z.string().nullish(),
  adjustmentType: z.string().nullish(),
  periodId: z.string().nullish(),
  createdById: z.string().nullish(),
  postedById: z.string().nullish(),
  postedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type JournalEntryType = z.infer<typeof JournalEntrySchema>;


// File: JournalEntryLine.schema.ts

export const JournalEntryLineSchema = z.object({
  id: z.string(),
  journalEntryId: z.string(),
  accountId: z.string(),
  description: z.string().nullish(),
  debit: z.instanceof(Prisma.Decimal, {
  message: "Field 'debit' must be a Decimal. Location: ['Models', 'JournalEntryLine']",
}),
  credit: z.instanceof(Prisma.Decimal, {
  message: "Field 'credit' must be a Decimal. Location: ['Models', 'JournalEntryLine']",
}),
  projectId: z.string().nullish(),
  createdAt: z.date(),
});

export type JournalEntryLineType = z.infer<typeof JournalEntryLineSchema>;


// File: OrganizationOwner.schema.ts

export const OrganizationOwnerSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  nameEn: z.string().nullish(),
  ownershipPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'ownershipPercent' must be a Decimal. Location: ['Models', 'OrganizationOwner']",
}),
  nationalId: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  drawingsAccountId: z.string().nullish(),
  isActive: z.boolean().default(true),
  notes: z.string().nullish(),
  createdById: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrganizationOwnerType = z.infer<typeof OrganizationOwnerSchema>;


// File: CapitalContribution.schema.ts

export const CapitalContributionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ownerId: z.string(),
  contributionNo: z.string(),
  date: z.date(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'CapitalContribution']",
}),
  type: CapitalContributionTypeSchema.default("INITIAL"),
  bankAccountId: z.string().nullish(),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  journalEntryId: z.string().nullish(),
  status: z.string().default("ACTIVE"),
  cancelledAt: z.date().nullish(),
  cancelReason: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CapitalContributionModel = z.infer<typeof CapitalContributionSchema>;

// File: OwnerDrawing.schema.ts

export const OwnerDrawingSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  drawingNo: z.string(),
  date: z.date(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'OwnerDrawing']",
}),
  currency: z.string().default("SAR"),
  ownerId: z.string(),
  bankAccountId: z.string().nullish(),
  projectId: z.string().nullish(),
  type: OwnerDrawingTypeSchema.default("COMPANY_LEVEL"),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  status: OwnerDrawingStatusSchema.default("APPROVED"),
  journalEntryId: z.string().nullish(),
  hasOverdrawWarning: z.boolean(),
  overdrawAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'overdrawAmount' must be a Decimal. Location: ['Models', 'OwnerDrawing']",
}).nullish(),
  overdrawAcknowledgedBy: z.string().nullish(),
  overdrawAcknowledgedAt: z.date().nullish(),
  approvedById: z.string().nullish(),
  approvedAt: z.date().nullish(),
  cancelledAt: z.date().nullish(),
  cancelReason: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OwnerDrawingModel = z.infer<typeof OwnerDrawingSchema>;

// File: YearEndClosing.schema.ts

export const YearEndClosingSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  fiscalYear: z.number().int(),
  closingDate: z.date(),
  totalRevenue: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalRevenue' must be a Decimal. Location: ['Models', 'YearEndClosing']",
}),
  totalExpenses: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalExpenses' must be a Decimal. Location: ['Models', 'YearEndClosing']",
}),
  netProfit: z.instanceof(Prisma.Decimal, {
  message: "Field 'netProfit' must be a Decimal. Location: ['Models', 'YearEndClosing']",
}),
  totalDrawings: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalDrawings' must be a Decimal. Location: ['Models', 'YearEndClosing']",
}),
  retainedEarningsTransfer: z.instanceof(Prisma.Decimal, {
  message: "Field 'retainedEarningsTransfer' must be a Decimal. Location: ['Models', 'YearEndClosing']",
}),
  closingJournalEntryId: z.string().nullish(),
  drawingsClosingEntryId: z.string().nullish(),
  distributionDetails: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  status: z.string().default("COMPLETED"),
  reversedAt: z.date().nullish(),
  reversedById: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type YearEndClosingType = z.infer<typeof YearEndClosingSchema>;


// File: AccountingPeriod.schema.ts

export const AccountingPeriodSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  periodType: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  isClosed: z.boolean(),
  closedAt: z.date().nullish(),
  closedById: z.string().nullish(),
  closingEntryId: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountingPeriodType = z.infer<typeof AccountingPeriodSchema>;


// File: RecurringJournalTemplate.schema.ts

export const RecurringJournalTemplateSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  description: z.string(),
  lines: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'RecurringJournalTemplate']",
}),
  frequency: z.string(),
  dayOfMonth: z.number().int().default(1),
  isActive: z.boolean().default(true),
  startDate: z.date(),
  endDate: z.date().nullish(),
  lastGeneratedDate: z.date().nullish(),
  nextDueDate: z.date().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RecurringJournalTemplateType = z.infer<typeof RecurringJournalTemplateSchema>;


// File: BankReconciliation.schema.ts

export const BankReconciliationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  bankAccountId: z.string(),
  reconciliationDate: z.date(),
  statementBalance: z.instanceof(Prisma.Decimal, {
  message: "Field 'statementBalance' must be a Decimal. Location: ['Models', 'BankReconciliation']",
}),
  bookBalance: z.instanceof(Prisma.Decimal, {
  message: "Field 'bookBalance' must be a Decimal. Location: ['Models', 'BankReconciliation']",
}),
  difference: z.instanceof(Prisma.Decimal, {
  message: "Field 'difference' must be a Decimal. Location: ['Models', 'BankReconciliation']",
}),
  status: z.string().default("DRAFT"),
  notes: z.string().nullish(),
  completedAt: z.date().nullish(),
  completedById: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BankReconciliationType = z.infer<typeof BankReconciliationSchema>;


// File: BankReconciliationItem.schema.ts

export const BankReconciliationItemSchema = z.object({
  id: z.string(),
  reconciliationId: z.string(),
  journalEntryLineId: z.string(),
  isMatched: z.boolean(),
  notes: z.string().nullish(),
  createdAt: z.date(),
});

export type BankReconciliationItemType = z.infer<typeof BankReconciliationItemSchema>;


// File: ReceiptVoucher.schema.ts

export const ReceiptVoucherSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  voucherNo: z.string(),
  paymentId: z.string().nullish(),
  invoicePaymentId: z.string().nullish(),
  projectPaymentId: z.string().nullish(),
  projectId: z.string().nullish(),
  clientId: z.string().nullish(),
  date: z.date(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'ReceiptVoucher']",
}),
  currency: z.string().default("SAR"),
  amountInWords: z.string().nullish(),
  receivedFrom: z.string(),
  paymentMethod: PaymentMethodSchema.default("BANK_TRANSFER"),
  checkNumber: z.string().nullish(),
  checkDate: z.date().nullish(),
  checkBank: z.string().nullish(),
  bankName: z.string().nullish(),
  transferRef: z.string().nullish(),
  destinationAccountId: z.string().nullish(),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  status: VoucherStatusSchema.default("DRAFT"),
  printCount: z.number().int(),
  lastPrintedAt: z.date().nullish(),
  cancelledAt: z.date().nullish(),
  cancelReason: z.string().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ReceiptVoucherType = z.infer<typeof ReceiptVoucherSchema>;


// File: PaymentVoucher.schema.ts

export const PaymentVoucherSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  voucherNo: z.string(),
  expenseId: z.string().nullish(),
  subcontractPaymentId: z.string().nullish(),
  projectId: z.string().nullish(),
  subcontractContractId: z.string().nullish(),
  date: z.date(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'PaymentVoucher']",
}),
  currency: z.string().default("SAR"),
  amountInWords: z.string().nullish(),
  payeeName: z.string(),
  payeeType: PayeeTypeSchema.default("OTHER"),
  paymentMethod: PaymentMethodSchema.default("BANK_TRANSFER"),
  checkNumber: z.string().nullish(),
  checkDate: z.date().nullish(),
  checkBank: z.string().nullish(),
  bankName: z.string().nullish(),
  transferRef: z.string().nullish(),
  sourceAccountId: z.string().nullish(),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  preparedById: z.string(),
  approvedById: z.string().nullish(),
  approvedAt: z.date().nullish(),
  rejectionReason: z.string().nullish(),
  status: VoucherStatusSchema.default("DRAFT"),
  printCount: z.number().int(),
  lastPrintedAt: z.date().nullish(),
  cancelledAt: z.date().nullish(),
  cancelReason: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentVoucherType = z.infer<typeof PaymentVoucherSchema>;


// File: HandoverProtocol.schema.ts

export const HandoverProtocolSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  protocolNo: z.string(),
  type: HandoverTypeSchema,
  projectId: z.string(),
  subcontractContractId: z.string().nullish(),
  date: z.date(),
  location: z.string().nullish(),
  title: z.string(),
  description: z.string().nullish(),
  parties: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
  observations: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  exceptions: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  conditions: z.string().nullish(),
  warrantyStartDate: z.date().nullish(),
  warrantyEndDate: z.date().nullish(),
  warrantyMonths: z.number().int().default(12).nullish(),
  retentionReleaseAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'retentionReleaseAmount' must be a Decimal. Location: ['Models', 'HandoverProtocol']",
}).nullish(),
  retentionReleaseDate: z.date().nullish(),
  attachments: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  status: HandoverStatusSchema.default("DRAFT"),
  completedAt: z.date().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HandoverProtocolType = z.infer<typeof HandoverProtocolSchema>;


// File: HandoverProtocolItem.schema.ts

export const HandoverProtocolItemSchema = z.object({
  id: z.string(),
  protocolId: z.string(),
  subcontractItemId: z.string().nullish(),
  boqItemId: z.string().nullish(),
  description: z.string(),
  unit: z.string().nullish(),
  contractQty: z.instanceof(Prisma.Decimal, {
  message: "Field 'contractQty' must be a Decimal. Location: ['Models', 'HandoverProtocolItem']",
}).nullish(),
  executedQty: z.instanceof(Prisma.Decimal, {
  message: "Field 'executedQty' must be a Decimal. Location: ['Models', 'HandoverProtocolItem']",
}).nullish(),
  acceptedQty: z.instanceof(Prisma.Decimal, {
  message: "Field 'acceptedQty' must be a Decimal. Location: ['Models', 'HandoverProtocolItem']",
}).nullish(),
  qualityRating: QualityRatingSchema.nullish(),
  remarks: z.string().nullish(),
  defects: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  sortOrder: z.number().int(),
});

export type HandoverProtocolItemType = z.infer<typeof HandoverProtocolItemSchema>;


// File: ZatcaDevice.schema.ts

export const ZatcaDeviceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  deviceName: z.string().default("MASAR-EGS-001"),
  invoiceType: ZatcaInvoiceTypeSchema,
  csidCertificate: z.string().nullish(),
  csidSecret: z.string().nullish(),
  csidRequestId: z.string().nullish(),
  csidExpiresAt: z.date().nullish(),
  privateKey: z.string().nullish(),
  publicKey: z.string().nullish(),
  complianceCsid: z.string().nullish(),
  complianceSecret: z.string().nullish(),
  invoiceCounter: z.number().int(),
  previousInvoiceHash: z.string().default("NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYmUxYjE3ZTExNzA5"),
  status: ZatcaIntegrationStatusSchema.default("DISABLED"),
  lastError: z.string().nullish(),
  onboardedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ZatcaDeviceType = z.infer<typeof ZatcaDeviceSchema>;


// File: ZatcaSubmission.schema.ts

export const ZatcaSubmissionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceId: z.string(),
  deviceId: z.string(),
  submissionType: z.string(),
  invoiceHash: z.string(),
  xmlContent: z.string().nullish(),
  signedXmlContent: z.string().nullish(),
  status: ZatcaSubmissionStatusSchema.default("PENDING"),
  zatcaResponse: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  clearedXml: z.string().nullish(),
  zatcaWarnings: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  zatcaErrors: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  attempts: z.number().int().default(1),
  lastAttemptAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ZatcaSubmissionType = z.infer<typeof ZatcaSubmissionSchema>;


// File: OrgCategory.schema.ts

export const OrgCategorySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  group: CategoryGroupSchema,
  systemId: z.string().nullish(),
  nameAr: z.string(),
  nameEn: z.string(),
  accountCode: z.string().nullish(),
  isVatExempt: z.boolean(),
  isSystem: z.boolean(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().nullish(),
});

export type OrgCategoryType = z.infer<typeof OrgCategorySchema>;


// File: OrgSubcategory.schema.ts

export const OrgSubcategorySchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  organizationId: z.string(),
  systemId: z.string().nullish(),
  nameAr: z.string(),
  nameEn: z.string(),
  isLabor: z.boolean(),
  isSystem: z.boolean(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrgSubcategoryType = z.infer<typeof OrgSubcategorySchema>;


// File: QuantityItem.schema.ts

export const QuantityItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  organizationId: z.string(),
  domain: z.string(),
  categoryKey: z.string(),
  catalogItemKey: z.string(),
  displayName: z.string(),
  sortOrder: z.number().int(),
  isEnabled: z.boolean().default(true),
  primaryValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'primaryValue' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  secondaryValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'secondaryValue' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  tertiaryValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'tertiaryValue' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  calculationMethod: z.string(),
  unit: z.string(),
  computedQuantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'computedQuantity' must be a Decimal. Location: ['Models', 'QuantityItem']",
}),
  wastagePercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'wastagePercent' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).default(new Prisma.Decimal(10)),
  effectiveQuantity: z.instanceof(Prisma.Decimal, {
  message: "Field 'effectiveQuantity' must be a Decimal. Location: ['Models', 'QuantityItem']",
}),
  contextSpaceId: z.string().nullish(),
  contextScope: z.string().nullish(),
  deductOpenings: z.boolean(),
  openingsArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'openingsArea' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  polygonPoints: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  linkedFromItemId: z.string().nullish(),
  linkQuantityFormula: z.string().nullish(),
  linkPercentValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'linkPercentValue' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  specMaterialName: z.string().nullish(),
  specMaterialBrand: z.string().nullish(),
  specMaterialGrade: z.string().nullish(),
  specColor: z.string().nullish(),
  specSource: z.string().nullish(),
  specNotes: z.string().nullish(),
  materialUnitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialUnitPrice' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  laborUnitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborUnitPrice' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  materialCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'materialCost' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  laborCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'laborCost' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  totalCost: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalCost' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  markupMethod: z.string().default("percentage"),
  markupPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'markupPercent' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  markupFixedAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'markupFixedAmount' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  manualUnitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'manualUnitPrice' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  sellUnitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'sellUnitPrice' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  sellTotalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'sellTotalAmount' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  profitAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'profitAmount' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  profitPercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'profitPercent' must be a Decimal. Location: ['Models', 'QuantityItem']",
}).nullish(),
  hasCustomMarkup: z.boolean(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().nullish(),
  updatedById: z.string().nullish(),
});

export type QuantityItemType = z.infer<typeof QuantityItemSchema>;


// File: QuantityItemContext.schema.ts

export const QuantityItemContextSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  organizationId: z.string(),
  totalFloorArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalFloorArea' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  totalWallArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalWallArea' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  totalExteriorWallArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalExteriorWallArea' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  totalRoofArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalRoofArea' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  totalPerimeter: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalPerimeter' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  averageFloorHeight: z.instanceof(Prisma.Decimal, {
  message: "Field 'averageFloorHeight' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  hasBasement: z.boolean(),
  hasRoof: z.boolean().default(true),
  hasYard: z.boolean(),
  yardArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'yardArea' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  fenceLength: z.instanceof(Prisma.Decimal, {
  message: "Field 'fenceLength' must be a Decimal. Location: ['Models', 'QuantityItemContext']",
}).nullish(),
  generalNotes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuantityItemContextType = z.infer<typeof QuantityItemContextSchema>;


// File: QuantityContextSpace.schema.ts

export const QuantityContextSpaceSchema = z.object({
  id: z.string(),
  contextId: z.string(),
  organizationId: z.string(),
  name: z.string(),
  spaceType: z.string(),
  floorLabel: z.string().nullish(),
  length: z.instanceof(Prisma.Decimal, {
  message: "Field 'length' must be a Decimal. Location: ['Models', 'QuantityContextSpace']",
}).nullish(),
  width: z.instanceof(Prisma.Decimal, {
  message: "Field 'width' must be a Decimal. Location: ['Models', 'QuantityContextSpace']",
}).nullish(),
  height: z.instanceof(Prisma.Decimal, {
  message: "Field 'height' must be a Decimal. Location: ['Models', 'QuantityContextSpace']",
}).nullish(),
  floorArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'floorArea' must be a Decimal. Location: ['Models', 'QuantityContextSpace']",
}).nullish(),
  wallPerimeter: z.instanceof(Prisma.Decimal, {
  message: "Field 'wallPerimeter' must be a Decimal. Location: ['Models', 'QuantityContextSpace']",
}).nullish(),
  polygonPoints: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  computedFloorArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'computedFloorArea' must be a Decimal. Location: ['Models', 'QuantityContextSpace']",
}).nullish(),
  computedWallArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'computedWallArea' must be a Decimal. Location: ['Models', 'QuantityContextSpace']",
}).nullish(),
  isWetArea: z.boolean(),
  isExterior: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuantityContextSpaceType = z.infer<typeof QuantityContextSpaceSchema>;


// File: QuantityContextOpening.schema.ts

export const QuantityContextOpeningSchema = z.object({
  id: z.string(),
  contextId: z.string(),
  organizationId: z.string(),
  name: z.string(),
  openingType: z.string(),
  width: z.instanceof(Prisma.Decimal, {
  message: "Field 'width' must be a Decimal. Location: ['Models', 'QuantityContextOpening']",
}),
  height: z.instanceof(Prisma.Decimal, {
  message: "Field 'height' must be a Decimal. Location: ['Models', 'QuantityContextOpening']",
}),
  computedArea: z.instanceof(Prisma.Decimal, {
  message: "Field 'computedArea' must be a Decimal. Location: ['Models', 'QuantityContextOpening']",
}),
  count: z.number().int().default(1),
  isExterior: z.boolean(),
  deductFromInteriorFinishes: z.boolean().default(true),
  spaceId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QuantityContextOpeningType = z.infer<typeof QuantityContextOpeningSchema>;


// File: ItemCatalogEntry.schema.ts

export const ItemCatalogEntrySchema = z.object({
  id: z.string(),
  itemKey: z.string(),
  domain: z.string(),
  categoryKey: z.string(),
  subcategoryKey: z.string().nullish(),
  nameAr: z.string(),
  nameEn: z.string(),
  descriptionAr: z.string().nullish(),
  descriptionEn: z.string().nullish(),
  icon: z.string(),
  color: z.string().nullish(),
  unit: z.string(),
  defaultWastagePercent: z.instanceof(Prisma.Decimal, {
  message: "Field 'defaultWastagePercent' must be a Decimal. Location: ['Models', 'ItemCatalogEntry']",
}).default(new Prisma.Decimal(10)),
  defaultCalculationMethod: z.string(),
  requiredFields: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  defaultMaterialUnitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'defaultMaterialUnitPrice' must be a Decimal. Location: ['Models', 'ItemCatalogEntry']",
}).nullish(),
  defaultLaborUnitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'defaultLaborUnitPrice' must be a Decimal. Location: ['Models', 'ItemCatalogEntry']",
}).nullish(),
  commonMaterials: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  commonColors: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  linkableFrom: z.array(z.string()),
  legacyDerivationType: z.string().nullish(),
  legacyScope: z.string().nullish(),
  displayOrder: z.number().int(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ItemCatalogEntryType = z.infer<typeof ItemCatalogEntrySchema>;

