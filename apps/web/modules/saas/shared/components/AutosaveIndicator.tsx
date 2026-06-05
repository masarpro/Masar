"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CircleAlert, CircleDashed, Hourglass, Loader2 } from "lucide-react";
import { cn } from "@ui/lib";
import type { AutosaveState } from "@saas/shared/hooks/use-autosave";

interface AutosaveIndicatorProps {
	state: AutosaveState;
	onRetry?: () => void;
	className?: string;
	/** "draft" يبدّل النصوص لتوضّح أن الحفظ التلقائي يكتب على مسودة (مختلف عن زر "حفظ") */
	mode?: "default" | "draft";
}

function formatRelativeTime(date: Date, t: (key: string) => string): string {
	const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
	if (seconds < 5) return t("autosave.justNow");
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h`;
}

export function AutosaveIndicator({ state, onRetry, className, mode = "default" }: AutosaveIndicatorProps) {
	const t = useTranslations();
	const [, forceTick] = useState(0);
	const isDraft = mode === "draft";

	// تحديث "saved X ago" بصرياً كل 15 ثانية
	useEffect(() => {
		if (state.status !== "idle" && state.status !== "saved") return;
		if (!state.lastSavedAt) return;
		const interval = setInterval(() => forceTick((n) => n + 1), 15_000);
		return () => clearInterval(interval);
	}, [state.status, state.lastSavedAt]);

	const baseClasses =
		"inline-flex items-center gap-1.5 text-[11px] font-medium rounded-md px-2 py-1 transition-colors";

	if (state.status === "waiting") {
		return (
			<span
				className={cn(
					baseClasses,
					"text-muted-foreground bg-muted/40",
					className,
				)}
				title={t("autosave.waiting")}
			>
				<Hourglass className="h-3 w-3" />
				<span className="hidden sm:inline">{t("autosave.waiting")}</span>
			</span>
		);
	}

	if (state.status === "saving") {
		return (
			<span
				className={cn(
					baseClasses,
					"text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
					className,
				)}
			>
				<Loader2 className="h-3 w-3 animate-spin" />
				<span>{t(isDraft ? "autosave.draftSaving" : "autosave.saving")}</span>
			</span>
		);
	}

	if (state.status === "saved") {
		return (
			<span
				className={cn(
					baseClasses,
					"text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30",
					className,
				)}
			>
				<Check className="h-3 w-3" />
				<span>{t(isDraft ? "autosave.draftSaved" : "autosave.saved")}</span>
			</span>
		);
	}

	if (state.status === "error") {
		return (
			<button
				type="button"
				onClick={onRetry}
				className={cn(
					baseClasses,
					"text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer",
					className,
				)}
				title={state.errorMessage ?? undefined}
			>
				<CircleAlert className="h-3 w-3" />
				<span>{t("autosave.errorRetry")}</span>
			</button>
		);
	}

	if (state.status === "conflict") {
		return (
			<span
				className={cn(
					baseClasses,
					"text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
					className,
				)}
			>
				<CircleAlert className="h-3 w-3" />
				<span>{t("autosave.conflictTitle")}</span>
			</span>
		);
	}

	// idle / dirty — أظهر آخر وقت حفظ إن وُجد
	if (state.lastSavedAt) {
		const relative = formatRelativeTime(state.lastSavedAt, t);
		const label =
			relative === t("autosave.justNow")
				? t(isDraft ? "autosave.draftSaved" : "autosave.saved")
				: t(isDraft ? "autosave.draftSavedAgo" : "autosave.savedAgo").replace("{time}", relative);
		return (
			<span
				className={cn(
					baseClasses,
					"text-muted-foreground bg-transparent",
					className,
				)}
			>
				<CircleDashed className="h-3 w-3" />
				<span>{label}</span>
			</span>
		);
	}

	// idle بدون حفظ سابق — لا تظهر شيئاً
	return null;
}
