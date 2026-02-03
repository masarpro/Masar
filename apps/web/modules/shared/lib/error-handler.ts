/**
 * Error handling utilities for the Masar application
 * Provides consistent Arabic error messages for API errors
 */

import { ORPCError } from "@orpc/client";

/**
 * Common error codes and their Arabic translations
 */
const ERROR_MESSAGES: Record<string, string> = {
	// Authentication & Authorization
	UNAUTHORIZED: "غير مصرح لك بالوصول. يرجى تسجيل الدخول.",
	FORBIDDEN: "ليس لديك صلاحية للقيام بهذا الإجراء.",
	NOT_FOUND: "العنصر المطلوب غير موجود.",
	CONFLICT: "يوجد تعارض مع البيانات الحالية.",

	// Validation
	BAD_REQUEST: "البيانات المدخلة غير صحيحة.",
	VALIDATION_ERROR: "يرجى التحقق من البيانات المدخلة.",

	// Server errors
	INTERNAL_SERVER_ERROR: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً.",
	SERVICE_UNAVAILABLE: "الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.",
	TIMEOUT: "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.",

	// Network
	NETWORK_ERROR: "حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.",

	// Rate limiting
	TOO_MANY_REQUESTS: "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً.",

	// Default
	UNKNOWN: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
};

/**
 * Domain-specific error messages
 */
const DOMAIN_ERROR_MESSAGES: Record<string, string> = {
	// Projects
	"Project not found": "المشروع غير موجود.",
	"Project already exists": "المشروع موجود بالفعل.",
	"Cannot delete project with active data": "لا يمكن حذف مشروع يحتوي على بيانات نشطة.",

	// Team
	"User is already a team member": "المستخدم عضو بالفعل في الفريق.",
	"User not found in team": "المستخدم غير موجود في الفريق.",
	"Cannot remove yourself from the project": "لا يمكنك إزالة نفسك من المشروع.",
	"عضو بالفعل": "هذا المستخدم عضو بالفعل في الفريق.",

	// Finance
	"Expense not found": "المصروف غير موجود.",
	"Claim not found": "المستخلص غير موجود.",
	"Invalid amount": "المبلغ غير صحيح.",

	// Documents
	"Document not found": "المستند غير موجود.",
	"Cannot delete document with pending approvals": "لا يمكن حذف مستند له طلبات موافقة معلقة.",

	// Organization
	"Organization not found": "المؤسسة غير موجودة.",
	"Not a member of this organization": "لست عضواً في هذه المؤسسة.",

	// Permissions
	"ليس لديك صلاحية": "ليس لديك صلاحية للقيام بهذا الإجراء.",
	"Insufficient permissions": "صلاحيات غير كافية.",
};

/**
 * Get a user-friendly Arabic error message from an error object
 * @param error - The error object (can be any type)
 * @returns Arabic error message string
 */
export function getErrorMessage(error: unknown): string {
	// Handle null/undefined
	if (!error) {
		return ERROR_MESSAGES.UNKNOWN;
	}

	// Handle ORPC errors
	if (error instanceof ORPCError) {
		// Check for custom message first
		if (error.message) {
			// Check if it's a domain-specific message
			const domainMessage = DOMAIN_ERROR_MESSAGES[error.message];
			if (domainMessage) {
				return domainMessage;
			}
			// Check if message already looks like Arabic
			if (/[\u0600-\u06FF]/.test(error.message)) {
				return error.message;
			}
		}

		// Fall back to error code
		const code = error.code?.toString() || "UNKNOWN";
		return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
	}

	// Handle standard Error objects
	if (error instanceof Error) {
		// Check for domain-specific messages
		const domainMessage = DOMAIN_ERROR_MESSAGES[error.message];
		if (domainMessage) {
			return domainMessage;
		}

		// Check if message already looks like Arabic
		if (/[\u0600-\u06FF]/.test(error.message)) {
			return error.message;
		}

		// Check for network errors
		if (
			error.message.includes("fetch") ||
			error.message.includes("network") ||
			error.message.includes("Network")
		) {
			return ERROR_MESSAGES.NETWORK_ERROR;
		}

		// Check for timeout
		if (error.message.includes("timeout") || error.message.includes("Timeout")) {
			return ERROR_MESSAGES.TIMEOUT;
		}

		return ERROR_MESSAGES.UNKNOWN;
	}

	// Handle string errors
	if (typeof error === "string") {
		const domainMessage = DOMAIN_ERROR_MESSAGES[error];
		if (domainMessage) {
			return domainMessage;
		}

		// Check if message already looks like Arabic
		if (/[\u0600-\u06FF]/.test(error)) {
			return error;
		}

		return ERROR_MESSAGES.UNKNOWN;
	}

	// Handle objects with message property
	if (typeof error === "object" && "message" in error) {
		const message = (error as { message: string }).message;
		return getErrorMessage(message);
	}

	return ERROR_MESSAGES.UNKNOWN;
}

/**
 * Check if an error is a specific type
 * @param error - The error object
 * @param code - The error code to check for
 * @returns True if the error matches the code
 */
export function isErrorCode(error: unknown, code: string): boolean {
	if (error instanceof ORPCError) {
		return error.code?.toString() === code;
	}
	return false;
}

/**
 * Check if an error is an authentication error
 * @param error - The error object
 * @returns True if the error is an auth error
 */
export function isAuthError(error: unknown): boolean {
	return isErrorCode(error, "UNAUTHORIZED") || isErrorCode(error, "FORBIDDEN");
}

/**
 * Check if an error is a not found error
 * @param error - The error object
 * @returns True if the error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
	return isErrorCode(error, "NOT_FOUND");
}

/**
 * Check if an error is a validation error
 * @param error - The error object
 * @returns True if the error is a validation error
 */
export function isValidationError(error: unknown): boolean {
	return isErrorCode(error, "BAD_REQUEST") || isErrorCode(error, "VALIDATION_ERROR");
}

/**
 * Check if an error is a network error
 * @param error - The error object
 * @returns True if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
	if (error instanceof Error) {
		return (
			error.message.includes("fetch") ||
			error.message.includes("network") ||
			error.message.includes("Network")
		);
	}
	return false;
}
