"use client";

import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../lib/error-handler";

/**
 * Options for the useApiMutation hook
 */
export interface UseApiMutationOptions<TData, TError, TVariables, TContext>
	extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "onError" | "onSuccess"> {
	/**
	 * Success message to show in toast (Arabic)
	 */
	successMessage?: string;
	/**
	 * Error message to show in toast (Arabic). If not provided, uses getErrorMessage
	 */
	errorMessage?: string;
	/**
	 * Whether to show success toast (default: true if successMessage is provided)
	 */
	showSuccessToast?: boolean;
	/**
	 * Whether to show error toast (default: true)
	 */
	showErrorToast?: boolean;
	/**
	 * Custom success handler (runs after toast)
	 */
	onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
	/**
	 * Custom error handler (runs after toast)
	 */
	onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
}

/**
 * A wrapper around useMutation that provides consistent toast handling
 *
 * @example
 * ```tsx
 * const createProject = useApiMutation({
 *   mutationFn: (data) => api.projects.create(data),
 *   successMessage: "تم إنشاء المشروع بنجاح",
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: ['projects'] });
 *     router.push('/projects');
 *   },
 * });
 * ```
 */
export function useApiMutation<
	TData = unknown,
	TError = Error,
	TVariables = void,
	TContext = unknown,
>(
	options: UseApiMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
	const {
		successMessage,
		errorMessage,
		showSuccessToast = !!successMessage,
		showErrorToast = true,
		onSuccess: customOnSuccess,
		onError: customOnError,
		...mutationOptions
	} = options;

	return useMutation({
		...mutationOptions,
		onSuccess: (data, variables, context) => {
			if (showSuccessToast && successMessage) {
				toast.success(successMessage);
			}
			customOnSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			if (showErrorToast) {
				const message = errorMessage || getErrorMessage(error);
				toast.error(message);
			}
			customOnError?.(error, variables, context);
		},
	});
}

/**
 * Options for mutations with loading toast
 */
export interface UseApiMutationWithLoadingOptions<TData, TError, TVariables, TContext>
	extends UseApiMutationOptions<TData, TError, TVariables, TContext> {
	/**
	 * Loading message to show in toast (Arabic)
	 */
	loadingMessage: string;
	/**
	 * The mutation function (required for loading variant)
	 */
	mutationFn: (variables: TVariables) => Promise<TData>;
}

/**
 * A wrapper around useMutation that shows a loading toast during the mutation
 *
 * @example
 * ```tsx
 * const deleteProject = useApiMutationWithLoading({
 *   mutationFn: (id) => api.projects.delete({ id }),
 *   loadingMessage: "جاري حذف المشروع...",
 *   successMessage: "تم حذف المشروع بنجاح",
 * });
 * ```
 */
export function useApiMutationWithLoading<
	TData = unknown,
	TError = Error,
	TVariables = void,
	TContext = unknown,
>(
	options: UseApiMutationWithLoadingOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
	const {
		loadingMessage,
		successMessage,
		errorMessage,
		showSuccessToast = !!successMessage,
		showErrorToast = true,
		onSuccess: customOnSuccess,
		onError: customOnError,
		mutationFn: originalMutationFn,
		...restOptions
	} = options;

	const wrappedMutationFn = async (variables: TVariables): Promise<TData> => {
		const toastId = toast.loading(loadingMessage);
		try {
			const result = await originalMutationFn(variables);
			if (showSuccessToast && successMessage) {
				toast.success(successMessage, { id: toastId });
			} else {
				toast.dismiss(toastId);
			}
			return result;
		} catch (error) {
			if (showErrorToast) {
				const message = errorMessage || getErrorMessage(error);
				toast.error(message, { id: toastId });
			} else {
				toast.dismiss(toastId);
			}
			throw error;
		}
	};

	return useMutation({
		...restOptions,
		mutationFn: wrappedMutationFn,
		onSuccess: (data, variables, context) => {
			customOnSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			customOnError?.(error, variables, context);
		},
	});
}

/**
 * Common mutation messages in Arabic
 */
export const MUTATION_MESSAGES = {
	// Generic
	saving: "جاري الحفظ...",
	saved: "تم الحفظ بنجاح",
	deleting: "جاري الحذف...",
	deleted: "تم الحذف بنجاح",
	updating: "جاري التحديث...",
	updated: "تم التحديث بنجاح",
	creating: "جاري الإنشاء...",
	created: "تم الإنشاء بنجاح",

	// Projects
	projectCreating: "جاري إنشاء المشروع...",
	projectCreated: "تم إنشاء المشروع بنجاح",
	projectUpdating: "جاري تحديث المشروع...",
	projectUpdated: "تم تحديث المشروع بنجاح",
	projectDeleting: "جاري حذف المشروع...",
	projectDeleted: "تم حذف المشروع بنجاح",

	// Team
	memberAdding: "جاري إضافة العضو...",
	memberAdded: "تم إضافة العضو بنجاح",
	memberRemoving: "جاري إزالة العضو...",
	memberRemoved: "تم إزالة العضو بنجاح",
	roleUpdating: "جاري تحديث الدور...",
	roleUpdated: "تم تحديث الدور بنجاح",

	// Documents
	documentUploading: "جاري رفع المستند...",
	documentUploaded: "تم رفع المستند بنجاح",
	documentDeleting: "جاري حذف المستند...",
	documentDeleted: "تم حذف المستند بنجاح",

	// Finance
	expenseCreating: "جاري إضافة المصروف...",
	expenseCreated: "تم إضافة المصروف بنجاح",
	claimCreating: "جاري إنشاء المستخلص...",
	claimCreated: "تم إنشاء المستخلص بنجاح",
} as const;
