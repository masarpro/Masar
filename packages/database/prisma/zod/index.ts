/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
import { Prisma } from '../generated/client';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

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

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId', 'ownerId', 'commercialRegister', 'taxNumber', 'contractorClass', 'phone', 'address', 'city', 'currency', 'timezone'])

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

// File: AiChatScalarFieldEnum.schema.ts

export const AiChatScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'title', 'messages', 'createdAt', 'updatedAt'])

export type AiChatScalarFieldEnum = z.infer<typeof AiChatScalarFieldEnumSchema>;

// File: CostStudyScalarFieldEnum.schema.ts

export const CostStudyScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'createdById', 'name', 'customerName', 'customerId', 'projectType', 'landArea', 'buildingArea', 'numberOfFloors', 'hasBasement', 'finishingLevel', 'structuralCost', 'finishingCost', 'mepCost', 'laborCost', 'overheadPercent', 'profitPercent', 'contingencyPercent', 'vatIncluded', 'totalCost', 'status', 'notes', 'createdAt', 'updatedAt'])

export type CostStudyScalarFieldEnum = z.infer<typeof CostStudyScalarFieldEnumSchema>;

// File: StructuralItemScalarFieldEnum.schema.ts

export const StructuralItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'category', 'subCategory', 'name', 'description', 'dimensions', 'quantity', 'unit', 'concreteVolume', 'concreteType', 'steelWeight', 'steelRatio', 'wastagePercent', 'materialCost', 'laborCost', 'totalCost', 'sortOrder', 'createdAt', 'updatedAt'])

export type StructuralItemScalarFieldEnum = z.infer<typeof StructuralItemScalarFieldEnumSchema>;

// File: FinishingItemScalarFieldEnum.schema.ts

export const FinishingItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'category', 'subCategory', 'name', 'description', 'area', 'unit', 'wastagePercent', 'qualityLevel', 'materialPrice', 'laborPrice', 'materialCost', 'laborCost', 'totalCost', 'sortOrder', 'createdAt', 'updatedAt'])

export type FinishingItemScalarFieldEnum = z.infer<typeof FinishingItemScalarFieldEnumSchema>;

// File: MEPItemScalarFieldEnum.schema.ts

export const MEPItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'category', 'itemType', 'name', 'description', 'quantity', 'unit', 'unitPrice', 'totalCost', 'sortOrder', 'createdAt', 'updatedAt'])

export type MEPItemScalarFieldEnum = z.infer<typeof MEPItemScalarFieldEnumSchema>;

// File: LaborItemScalarFieldEnum.schema.ts

export const LaborItemScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'laborType', 'workerType', 'name', 'quantity', 'dailyRate', 'durationDays', 'insuranceCost', 'housingCost', 'otherCosts', 'totalCost', 'createdAt', 'updatedAt'])

export type LaborItemScalarFieldEnum = z.infer<typeof LaborItemScalarFieldEnumSchema>;

// File: QuoteScalarFieldEnum.schema.ts

export const QuoteScalarFieldEnumSchema = z.enum(['id', 'costStudyId', 'quoteNumber', 'quoteType', 'clientName', 'clientCompany', 'clientPhone', 'clientEmail', 'clientAddress', 'subtotal', 'overheadAmount', 'profitAmount', 'vatAmount', 'totalAmount', 'validUntil', 'paymentTerms', 'deliveryTerms', 'showUnitPrices', 'showQuantities', 'showItemDescriptions', 'includeTerms', 'includeCoverPage', 'selectedCategories', 'termsAndConditions', 'notes', 'pdfUrl', 'status', 'createdAt', 'updatedAt'])

export type QuoteScalarFieldEnum = z.infer<typeof QuoteScalarFieldEnumSchema>;

// File: ProjectScalarFieldEnum.schema.ts

export const ProjectScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'slug', 'description', 'status', 'type', 'clientName', 'location', 'contractValue', 'progress', 'startDate', 'endDate', 'createdById', 'createdAt', 'updatedAt'])

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

export const ProjectExpenseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'date', 'category', 'amount', 'vendorName', 'note', 'attachmentUrl', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectExpenseScalarFieldEnum = z.infer<typeof ProjectExpenseScalarFieldEnumSchema>;

// File: ProjectClaimScalarFieldEnum.schema.ts

export const ProjectClaimScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'claimNo', 'periodStart', 'periodEnd', 'amount', 'dueDate', 'status', 'note', 'createdById', 'approvedAt', 'paidAt', 'createdAt', 'updatedAt'])

export type ProjectClaimScalarFieldEnum = z.infer<typeof ProjectClaimScalarFieldEnumSchema>;

// File: ProjectDocumentScalarFieldEnum.schema.ts

export const ProjectDocumentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'folder', 'title', 'description', 'fileUrl', 'version', 'createdById', 'createdAt', 'updatedAt'])

export type ProjectDocumentScalarFieldEnum = z.infer<typeof ProjectDocumentScalarFieldEnumSchema>;

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

// File: NotificationScalarFieldEnum.schema.ts

export const NotificationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'title', 'body', 'projectId', 'entityType', 'entityId', 'channel', 'deliveryStatus', 'dedupeKey', 'metadata', 'createdAt', 'readAt', 'sentAt'])

export type NotificationScalarFieldEnum = z.infer<typeof NotificationScalarFieldEnumSchema>;

// File: ProjectOwnerAccessScalarFieldEnum.schema.ts

export const ProjectOwnerAccessScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'token', 'label', 'expiresAt', 'isRevoked', 'createdById', 'createdAt'])

export type ProjectOwnerAccessScalarFieldEnum = z.infer<typeof ProjectOwnerAccessScalarFieldEnumSchema>;

// File: ProjectMilestoneScalarFieldEnum.schema.ts

export const ProjectMilestoneScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'title', 'description', 'orderIndex', 'plannedStart', 'plannedEnd', 'actualStart', 'actualEnd', 'status', 'progress', 'isCritical', 'plannedDate', 'actualDate', 'isCompleted', 'sortOrder', 'createdAt', 'updatedAt'])

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

export const OrganizationFinanceSettingsScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'companyNameAr', 'companyNameEn', 'logo', 'address', 'addressEn', 'phone', 'email', 'website', 'taxNumber', 'commercialReg', 'bankName', 'bankNameEn', 'accountName', 'iban', 'accountNumber', 'swiftCode', 'headerText', 'footerText', 'thankYouMessage', 'defaultVatPercent', 'defaultCurrency', 'defaultPaymentTerms', 'defaultDeliveryTerms', 'defaultWarrantyTerms', 'quotationValidityDays', 'createdAt', 'updatedAt'])

export type OrganizationFinanceSettingsScalarFieldEnum = z.infer<typeof OrganizationFinanceSettingsScalarFieldEnumSchema>;

// File: MessageDeliveryLogScalarFieldEnum.schema.ts

export const MessageDeliveryLogScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'channel', 'recipient', 'subject', 'content', 'status', 'provider', 'errorMessage', 'sentById', 'createdAt'])

export type MessageDeliveryLogScalarFieldEnum = z.infer<typeof MessageDeliveryLogScalarFieldEnumSchema>;

// File: ShareLinkScalarFieldEnum.schema.ts

export const ShareLinkScalarFieldEnumSchema = z.enum(['id', 'token', 'organizationId', 'projectId', 'resourceType', 'resourceId', 'expiresAt', 'isRevoked', 'createdById', 'createdAt'])

export type ShareLinkScalarFieldEnum = z.infer<typeof ShareLinkScalarFieldEnumSchema>;

// File: ProjectChangeOrderScalarFieldEnum.schema.ts

export const ProjectChangeOrderScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectId', 'coNo', 'title', 'description', 'category', 'status', 'costImpact', 'currency', 'timeImpactDays', 'milestoneId', 'claimId', 'requestedById', 'requestedAt', 'decidedById', 'decidedAt', 'decisionNote', 'implementedAt', 'implementedById', 'createdAt', 'updatedAt'])

export type ProjectChangeOrderScalarFieldEnum = z.infer<typeof ProjectChangeOrderScalarFieldEnumSchema>;

// File: ClientScalarFieldEnum.schema.ts

export const ClientScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'clientType', 'firstName', 'lastName', 'businessName', 'name', 'company', 'phone', 'mobile', 'email', 'address', 'streetAddress1', 'streetAddress2', 'city', 'region', 'postalCode', 'country', 'secondaryAddress', 'code', 'currency', 'displayLanguage', 'classification', 'taxNumber', 'crNumber', 'notes', 'isActive', 'createdById', 'createdAt', 'updatedAt'])

export type ClientScalarFieldEnum = z.infer<typeof ClientScalarFieldEnumSchema>;

// File: ClientContactScalarFieldEnum.schema.ts

export const ClientContactScalarFieldEnumSchema = z.enum(['id', 'clientId', 'name', 'position', 'phone', 'mobile', 'email', 'isPrimary', 'notes', 'createdAt', 'updatedAt'])

export type ClientContactScalarFieldEnum = z.infer<typeof ClientContactScalarFieldEnumSchema>;

// File: QuotationScalarFieldEnum.schema.ts

export const QuotationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'quotationNo', 'clientId', 'clientName', 'clientCompany', 'clientPhone', 'clientEmail', 'clientAddress', 'clientTaxNumber', 'projectId', 'status', 'subtotal', 'discountPercent', 'discountAmount', 'vatPercent', 'vatAmount', 'totalAmount', 'validUntil', 'paymentTerms', 'deliveryTerms', 'warrantyTerms', 'notes', 'templateId', 'viewedAt', 'sentAt', 'acceptedAt', 'rejectedAt', 'createdById', 'createdAt', 'updatedAt'])

export type QuotationScalarFieldEnum = z.infer<typeof QuotationScalarFieldEnumSchema>;

// File: QuotationItemScalarFieldEnum.schema.ts

export const QuotationItemScalarFieldEnumSchema = z.enum(['id', 'quotationId', 'description', 'quantity', 'unit', 'unitPrice', 'totalPrice', 'sortOrder', 'createdAt', 'updatedAt'])

export type QuotationItemScalarFieldEnum = z.infer<typeof QuotationItemScalarFieldEnumSchema>;

// File: FinanceInvoiceScalarFieldEnum.schema.ts

export const FinanceInvoiceScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'invoiceNo', 'invoiceType', 'clientId', 'clientName', 'clientCompany', 'clientPhone', 'clientEmail', 'clientAddress', 'clientTaxNumber', 'projectId', 'quotationId', 'status', 'issueDate', 'dueDate', 'subtotal', 'discountPercent', 'discountAmount', 'vatPercent', 'vatAmount', 'totalAmount', 'paidAmount', 'sellerTaxNumber', 'qrCode', 'zatcaUuid', 'zatcaHash', 'zatcaSignature', 'paymentTerms', 'notes', 'templateId', 'viewedAt', 'sentAt', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceInvoiceScalarFieldEnum = z.infer<typeof FinanceInvoiceScalarFieldEnumSchema>;

// File: FinanceInvoiceItemScalarFieldEnum.schema.ts

export const FinanceInvoiceItemScalarFieldEnumSchema = z.enum(['id', 'invoiceId', 'description', 'quantity', 'unit', 'unitPrice', 'totalPrice', 'sortOrder', 'createdAt', 'updatedAt'])

export type FinanceInvoiceItemScalarFieldEnum = z.infer<typeof FinanceInvoiceItemScalarFieldEnumSchema>;

// File: FinanceInvoicePaymentScalarFieldEnum.schema.ts

export const FinanceInvoicePaymentScalarFieldEnumSchema = z.enum(['id', 'invoiceId', 'amount', 'paymentDate', 'paymentMethod', 'referenceNo', 'notes', 'createdById', 'createdAt'])

export type FinanceInvoicePaymentScalarFieldEnum = z.infer<typeof FinanceInvoicePaymentScalarFieldEnumSchema>;

// File: OpenDocumentScalarFieldEnum.schema.ts

export const OpenDocumentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'documentNo', 'documentType', 'title', 'content', 'clientId', 'projectId', 'recipientName', 'recipientCompany', 'recipientAddress', 'templateId', 'createdById', 'createdAt', 'updatedAt'])

export type OpenDocumentScalarFieldEnum = z.infer<typeof OpenDocumentScalarFieldEnumSchema>;

// File: FinanceTemplateScalarFieldEnum.schema.ts

export const FinanceTemplateScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'description', 'templateType', 'isDefault', 'content', 'settings', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceTemplateScalarFieldEnum = z.infer<typeof FinanceTemplateScalarFieldEnumSchema>;

// File: OrganizationBankScalarFieldEnum.schema.ts

export const OrganizationBankScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'name', 'accountNumber', 'bankName', 'iban', 'accountType', 'balance', 'currency', 'isActive', 'isDefault', 'notes', 'createdById', 'createdAt', 'updatedAt'])

export type OrganizationBankScalarFieldEnum = z.infer<typeof OrganizationBankScalarFieldEnumSchema>;

// File: FinanceExpenseScalarFieldEnum.schema.ts

export const FinanceExpenseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'expenseNo', 'category', 'customCategory', 'description', 'amount', 'date', 'sourceAccountId', 'vendorName', 'vendorTaxNumber', 'projectId', 'invoiceRef', 'paymentMethod', 'referenceNo', 'status', 'notes', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceExpenseScalarFieldEnum = z.infer<typeof FinanceExpenseScalarFieldEnumSchema>;

// File: FinancePaymentScalarFieldEnum.schema.ts

export const FinancePaymentScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'paymentNo', 'amount', 'date', 'destinationAccountId', 'clientId', 'clientName', 'projectId', 'invoiceId', 'paymentMethod', 'referenceNo', 'status', 'description', 'notes', 'createdById', 'createdAt', 'updatedAt'])

export type FinancePaymentScalarFieldEnum = z.infer<typeof FinancePaymentScalarFieldEnumSchema>;

// File: FinanceTransferScalarFieldEnum.schema.ts

export const FinanceTransferScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'transferNo', 'amount', 'date', 'fromAccountId', 'toAccountId', 'status', 'description', 'notes', 'referenceNo', 'createdById', 'createdAt', 'updatedAt'])

export type FinanceTransferScalarFieldEnum = z.infer<typeof FinanceTransferScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: NullableJsonNullValueInput.schema.ts

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull'])

export type NullableJsonNullValueInput = z.infer<typeof NullableJsonNullValueInputSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: AccountType.schema.ts

export const AccountTypeSchema = z.enum(['OWNER', 'EMPLOYEE', 'PROJECT_CLIENT'])

export type AccountType = z.infer<typeof AccountTypeSchema>;

// File: RoleType.schema.ts

export const RoleTypeSchema = z.enum(['OWNER', 'PROJECT_MANAGER', 'ACCOUNTANT', 'ENGINEER', 'SUPERVISOR', 'CUSTOM'])

export type RoleType = z.infer<typeof RoleTypeSchema>;

// File: InvitationStatus.schema.ts

export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'])

export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

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

// File: DocumentFolder.schema.ts

export const DocumentFolderSchema = z.enum(['CONTRACT', 'DRAWINGS', 'CLAIMS', 'LETTERS', 'PHOTOS', 'OTHER'])

export type DocumentFolder = z.infer<typeof DocumentFolderSchema>;

// File: ApprovalStatus.schema.ts

export const ApprovalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])

export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

// File: ApproverStatus.schema.ts

export const ApproverStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export type ApproverStatus = z.infer<typeof ApproverStatusSchema>;

// File: AuditAction.schema.ts

export const AuditActionSchema = z.enum(['DOC_CREATED', 'APPROVAL_REQUESTED', 'APPROVAL_DECIDED', 'MESSAGE_SENT', 'TOKEN_CREATED', 'TOKEN_REVOKED', 'CLAIM_STATUS_CHANGED', 'EXPENSE_CREATED', 'ATTACHMENT_CREATED', 'CO_CREATED', 'CO_SUBMITTED', 'CO_APPROVED', 'CO_REJECTED', 'CO_IMPLEMENTED'])

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

// File: MilestoneStatus.schema.ts

export const MilestoneStatusSchema = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'])

export type MilestoneStatus = z.infer<typeof MilestoneStatusSchema>;

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

// File: ClientType.schema.ts

export const ClientTypeSchema = z.enum(['INDIVIDUAL', 'COMMERCIAL'])

export type ClientType = z.infer<typeof ClientTypeSchema>;

// File: QuotationStatus.schema.ts

export const QuotationStatusSchema = z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'])

export type QuotationStatus = z.infer<typeof QuotationStatusSchema>;

// File: InvoiceType.schema.ts

export const InvoiceTypeSchema = z.enum(['STANDARD', 'TAX', 'SIMPLIFIED'])

export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;

// File: FinanceInvoiceStatus.schema.ts

export const FinanceInvoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'])

export type FinanceInvoiceStatus = z.infer<typeof FinanceInvoiceStatusSchema>;

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

// File: PaymentMethod.schema.ts

export const PaymentMethodSchema = z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'OTHER'])

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// File: FinanceTransactionStatus.schema.ts

export const FinanceTransactionStatusSchema = z.enum(['PENDING', 'COMPLETED', 'CANCELLED'])

export type FinanceTransactionStatus = z.infer<typeof FinanceTransactionStatusSchema>;

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

// File: AiChat.schema.ts

export const AiChatSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  title: z.string().nullish(),
  messages: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
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
  landArea: z.number(),
  buildingArea: z.number(),
  numberOfFloors: z.number().int(),
  hasBasement: z.boolean(),
  finishingLevel: z.string(),
  structuralCost: z.number(),
  finishingCost: z.number(),
  mepCost: z.number(),
  laborCost: z.number(),
  overheadPercent: z.number().default(5.0),
  profitPercent: z.number().default(10.0),
  contingencyPercent: z.number().default(3.0),
  vatIncluded: z.boolean().default(true),
  totalCost: z.number(),
  status: z.string().default("draft"),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CostStudyType = z.infer<typeof CostStudySchema>;


// File: StructuralItem.schema.ts

export const StructuralItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  category: z.string(),
  subCategory: z.string().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  dimensions: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  quantity: z.number(),
  unit: z.string(),
  concreteVolume: z.number().nullish(),
  concreteType: z.string().nullish(),
  steelWeight: z.number().nullish(),
  steelRatio: z.number().nullish(),
  wastagePercent: z.number().default(10.0),
  materialCost: z.number(),
  laborCost: z.number(),
  totalCost: z.number(),
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
  area: z.number(),
  unit: z.string(),
  wastagePercent: z.number().default(8.0),
  qualityLevel: z.string().default("medium"),
  materialPrice: z.number(),
  laborPrice: z.number(),
  materialCost: z.number(),
  laborCost: z.number(),
  totalCost: z.number(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinishingItemType = z.infer<typeof FinishingItemSchema>;


// File: MEPItem.schema.ts

export const MEPItemSchema = z.object({
  id: z.string(),
  costStudyId: z.string(),
  category: z.string(),
  itemType: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  quantity: z.number(),
  unit: z.string(),
  unitPrice: z.number(),
  totalCost: z.number(),
  sortOrder: z.number().int(),
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
  dailyRate: z.number(),
  durationDays: z.number().int(),
  insuranceCost: z.number(),
  housingCost: z.number(),
  otherCosts: z.number(),
  totalCost: z.number(),
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
  subtotal: z.number(),
  overheadAmount: z.number(),
  profitAmount: z.number(),
  vatAmount: z.number(),
  totalAmount: z.number(),
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
  description: z.string().nullish(),
  status: ProjectStatusSchema.default("ACTIVE"),
  type: ProjectTypeSchema.nullish(),
  clientName: z.string().nullish(),
  location: z.string().nullish(),
  contractValue: z.instanceof(Prisma.Decimal, {
  message: "Field 'contractValue' must be a Decimal. Location: ['Models', 'Project']",
}).nullish(),
  progress: z.number(),
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
  progress: z.number(),
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


// File: ProjectDocument.schema.ts

export const ProjectDocumentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  folder: DocumentFolderSchema,
  title: z.string(),
  description: z.string().nullish(),
  fileUrl: z.string(),
  version: z.number().int().default(1),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectDocumentType = z.infer<typeof ProjectDocumentSchema>;


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
  progress: z.number(),
  isCritical: z.boolean(),
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
  templateId: z.string().nullish(),
  viewedAt: z.date().nullish(),
  sentAt: z.date().nullish(),
  acceptedAt: z.date().nullish(),
  rejectedAt: z.date().nullish(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
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
  sellerTaxNumber: z.string().nullish(),
  qrCode: z.string().nullish(),
  zatcaUuid: z.string().nullish(),
  zatcaHash: z.string().nullish(),
  zatcaSignature: z.string().nullish(),
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
});

export type OrganizationBankType = z.infer<typeof OrganizationBankSchema>;


// File: FinanceExpense.schema.ts

export const FinanceExpenseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  expenseNo: z.string(),
  category: OrgExpenseCategorySchema,
  customCategory: z.string().nullish(),
  description: z.string().nullish(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'FinanceExpense']",
}),
  date: z.date(),
  sourceAccountId: z.string(),
  vendorName: z.string().nullish(),
  vendorTaxNumber: z.string().nullish(),
  projectId: z.string().nullish(),
  invoiceRef: z.string().nullish(),
  paymentMethod: PaymentMethodSchema.default("BANK_TRANSFER"),
  referenceNo: z.string().nullish(),
  status: FinanceTransactionStatusSchema.default("COMPLETED"),
  notes: z.string().nullish(),
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

