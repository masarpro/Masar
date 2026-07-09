import { cn } from "@ui/lib";
import type * as React from "react";

/**
 * StatusChip — the platform-wide status badge.
 *
 * One canonical tone → classes map (with dark-mode variants baked in) plus a
 * semantic dictionary of common workflow statuses, so the same status is
 * colored identically in every module. Labels stay with the callers (i18n).
 *
 * Canonical decisions (previously inconsistent across modules):
 *   DRAFT → neutral · APPROVED/COMPLETED/PAID/ACTIVE/POSTED → success
 *   PARTIALLY_PAID/PENDING → warning · OVERDUE/REJECTED → danger
 *   CANCELLED → muted (+line-through)
 */

export type StatusTone =
	| "neutral"
	| "muted"
	| "info"
	| "success"
	| "warning"
	| "danger"
	| "purple"
	| "teal"
	| "pink";

const TONE_CLASSES: Record<StatusTone, string> = {
	neutral:
		"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	muted: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
	info: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
	success:
		"bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
	warning:
		"bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
	danger: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
	purple:
		"bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
	teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400",
	pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400",
};

/** Semantic dictionary: workflow status → tone. Extend here, never inline. */
export const STATUS_TONES: Record<string, StatusTone> = {
	// Drafting / neutral
	DRAFT: "neutral",
	NOT_STARTED: "neutral",
	ARCHIVED: "muted",
	CANCELLED: "muted",
	CLOSED: "muted",
	INACTIVE: "muted",
	// In-flight / informational
	SENT: "info",
	IN_PROGRESS: "info",
	PROCESSING: "info",
	SUBMITTED: "info",
	ISSUED: "teal",
	CONVERTED: "teal",
	VIEWED: "purple",
	// Awaiting / partial
	PENDING: "warning",
	UNDER_REVIEW: "warning",
	PENDING_APPROVAL: "warning",
	PENDING_SIGNATURES: "warning",
	PARTIALLY_PAID: "warning",
	PARTIALLY_SIGNED: "warning",
	PARTIAL: "warning",
	ON_HOLD: "warning",
	SUSPENDED: "warning",
	EXPIRED: "warning",
	// Positive terminal
	APPROVED: "success",
	ACCEPTED: "success",
	ACTIVE: "success",
	PAID: "success",
	COMPLETED: "success",
	IMPLEMENTED: "success",
	POSTED: "success",
	SIGNED: "success",
	DELIVERED: "success",
	// Negative terminal
	REJECTED: "danger",
	TERMINATED: "danger",
	OVERDUE: "danger",
	FAILED: "danger",
	REVERSED: "danger",
	CREDIT_NOTE: "pink",
};

/** Raw classes for call sites that can't render the component (e.g. table cell tinting). */
export function statusToneClasses(toneOrStatus: StatusTone | string): string {
	const tone: StatusTone =
		(toneOrStatus in TONE_CLASSES
			? (toneOrStatus as StatusTone)
			: STATUS_TONES[toneOrStatus]) ?? "neutral";
	return TONE_CLASSES[tone];
}

interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
	/** Workflow status key (e.g. "APPROVED") — resolves tone via STATUS_TONES. */
	status?: string;
	/** Explicit tone override; wins over `status`. */
	tone?: StatusTone;
	/** Renders the label struck through (defaults to true for CANCELLED). */
	strikethrough?: boolean;
	children: React.ReactNode;
}

export function StatusChip({
	status,
	tone,
	strikethrough,
	className,
	children,
	...props
}: StatusChipProps) {
	const struck = strikethrough ?? status === "CANCELLED";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs",
				statusToneClasses(tone ?? status ?? "neutral"),
				struck && "line-through",
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
