"use client";

import { cn } from "@ui/lib";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * نمط «صف المستند» للجوال — بديل الجداول متعددة الأعمدة على الشاشات
 * الصغيرة (نفس نمط تطبيقات المصارف وStripe):
 *
 *   ┌──────────────────────────────────────────┐
 *   │ اسم العميل (سطر واحد مقتطع)      المبلغ  │
 *   │ INV-2026-0044 · 12 يونيو        [الحالة] │
 *   └──────────────────────────────────────────┘
 *
 * الصف كله رابط للتفاصيل، وزر الإجراءات (إن وُجد) خارج الرابط حتى
 * لا يتداخل النقر. كل المحاذاة بخصائص منطقية تحترم RTL.
 */

interface MobileDocRowProps {
	/** رابط التفاصيل — الصف كاملاً قابل للنقر */
	href?: string;
	/** السطر الأول: الاسم الأساسي (يُقتطع على سطر واحد) */
	title: ReactNode;
	/** السطر الثاني: رقم المستند · التاريخ (يُقتطع على سطر واحد) */
	subtitle?: ReactNode;
	/** المبلغ — الطرف المقابل من السطر الأول */
	amount?: ReactNode;
	/** شارة الحالة — الطرف المقابل من السطر الثاني */
	badge?: ReactNode;
	/** زر إجراءات (Dropdown) يُعرض بطرف الصف دون تفعيل الرابط */
	actions?: ReactNode;
	className?: string;
}

export function MobileDocRow({
	href,
	title,
	subtitle,
	amount,
	badge,
	actions,
	className,
}: MobileDocRowProps) {
	const body = (
		<>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold text-foreground">
					{title}
				</p>
				{subtitle && (
					<p className="mt-0.5 truncate text-xs text-muted-foreground">
						{subtitle}
					</p>
				)}
			</div>
			<div className="flex shrink-0 flex-col items-end gap-1">
				{amount && (
					<span className="text-sm font-semibold tabular-nums text-foreground">
						{amount}
					</span>
				)}
				{badge}
			</div>
		</>
	);

	return (
		<div
			className={cn(
				"flex items-center gap-2 px-4 py-3 transition-colors active:bg-accent/50",
				className,
			)}
		>
			{href ? (
				<Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
					{body}
				</Link>
			) : (
				<div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
			)}
			{actions && <div className="shrink-0">{actions}</div>}
		</div>
	);
}

/** حاوية الصفوف: فواصل رفيعة داخل إطار البطاقة الموحد */
export function MobileDocList({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card",
				className,
			)}
		>
			{children}
		</div>
	);
}
