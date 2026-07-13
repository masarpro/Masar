"use client";

import { resolveImageSrc } from "@saas/shared/lib/image-src";
import { formatDateNumeric, formatSARArabic } from "@shared/lib/formatters";
import { Progress } from "@ui/components/progress";
import {
	Calendar,
	ChevronLeft,
	CreditCard,
	FileDiff,
	Image as ImageIcon,
	MessageSquare,
	Play,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** Snapshot shape returned by getOwnerSummary().sections */
export interface OwnerSummarySections {
	schedule: {
		total: number;
		completed: number;
		current: { title: string; progress: number; status: string } | null;
	};
	payments: {
		collectionPercent: number;
		paidAmount: number;
		remaining: number;
		contractValue: number;
		nextPayment: {
			claimNo: string;
			amount: number;
			dueDate: string | Date;
		} | null;
	};
	photos: {
		count: number;
		recent: Array<{
			id: string;
			url: string;
			caption: string | null;
			mediaType: string | null;
		}>;
	};
	changeOrders: {
		count: number;
		totalCostImpact: number;
	};
	chat: {
		lastMessage: {
			content: string;
			senderName: string | null;
			createdAt: string | Date;
			isOwner: boolean;
		} | null;
	};
}

/** A clickable section card with a colored icon, title and a live snapshot body. */
function SectionCard({
	href,
	icon,
	iconClass,
	title,
	children,
	className,
}: {
	href: string;
	icon: ReactNode;
	iconClass: string;
	title: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<Link
			href={href}
			className={`group flex flex-col rounded-2xl border-2 bg-card p-4 transition-all hover:border-primary/40 active:scale-[0.99] sm:p-5 ${className ?? ""}`}
		>
			<div className="mb-3 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2.5">
					<div className={`rounded-xl p-2 ${iconClass}`}>{icon}</div>
					<h3 className="font-semibold text-card-foreground">
						{title}
					</h3>
				</div>
				<ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
			</div>
			<div className="flex-1">{children}</div>
		</Link>
	);
}

export function OwnerSummarySectionCards({
	sections,
	basePath,
}: {
	sections: OwnerSummarySections;
	basePath: string;
}) {
	const t = useTranslations();
	const { schedule, payments, photos, changeOrders, chat } = sections;

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
			{/* Schedule */}
			<SectionCard
				href={`${basePath}/schedule`}
				icon={<Calendar className="h-5 w-5 text-chart-4" />}
				iconClass="bg-chart-4/15"
				title={t("ownerPortal.tabs.schedule")}
			>
				{schedule.total > 0 ? (
					<div className="space-y-2">
						<div className="flex items-baseline justify-between">
							<span className="text-sm text-muted-foreground">
								{t("ownerPortal.summary.stageOf", {
									current: Math.min(schedule.completed + 1, schedule.total),
									total: schedule.total,
								})}
							</span>
							{schedule.current && (
								<span className="text-sm font-semibold text-chart-4">
									{schedule.current.progress}%
								</span>
							)}
						</div>
						{schedule.current && (
							<p className="truncate text-sm font-medium text-card-foreground">
								{schedule.current.title}
							</p>
						)}
						<Progress
							value={schedule.current?.progress ?? 0}
							className="h-1.5"
						/>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						{t("ownerPortal.schedule.noMilestones")}
					</p>
				)}
			</SectionCard>

			{/* Payments */}
			<SectionCard
				href={`${basePath}/payments`}
				icon={
					<CreditCard className="h-5 w-5 text-success" />
				}
				iconClass="bg-success/15"
				title={t("ownerPortal.tabs.payments")}
			>
				<div className="space-y-2">
					<div className="flex items-baseline justify-between">
						<span className="text-sm text-muted-foreground">
							{t("ownerPortal.summary.collected")}
						</span>
						<span className="text-sm font-semibold text-success">
							{payments.collectionPercent}%
						</span>
					</div>
					<Progress value={payments.collectionPercent} className="h-1.5" />
					{payments.nextPayment ? (
						<p className="text-xs text-muted-foreground">
							{t("ownerPortal.summary.nextPaymentShort")}:{" "}
							<span className="font-medium text-chart-1">
								{formatSARArabic(payments.nextPayment.amount)}
							</span>
						</p>
					) : (
						<p className="text-xs text-muted-foreground">
							{t("ownerPortal.summary.remainingShort")}:{" "}
							<span className="font-medium text-card-foreground">
								{formatSARArabic(payments.remaining)}
							</span>
						</p>
					)}
				</div>
			</SectionCard>

			{/* Photos */}
			<SectionCard
				href={`${basePath}/photos`}
				icon={
					<ImageIcon className="h-5 w-5 text-chart-4" />
				}
				iconClass="bg-chart-4/15"
				title={t("ownerPortal.tabs.photos")}
			>
				{photos.count > 0 ? (
					<div className="space-y-2.5">
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("ownerPortal.summary.photosCount", { count: photos.count })}
						</p>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
							{photos.recent.map((photo) => {
								const src = resolveImageSrc(photo.url);
								return (
									<div
										key={photo.id}
										className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
									>
										{src && (
											<Image
												src={src}
												alt={photo.caption ?? ""}
												fill
												sizes="80px"
												className="object-cover"
												unoptimized
											/>
										)}
										{photo.mediaType === "VIDEO" && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/30">
												<Play className="h-4 w-4 fill-white text-white" />
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				) : (
					<p className="text-sm text-slate-400">
						{t("ownerPortal.photos.emptyHint")}
					</p>
				)}
			</SectionCard>

			{/* Change Orders */}
			<SectionCard
				href={`${basePath}/changes`}
				icon={
					<FileDiff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
				}
				iconClass="bg-amber-100 dark:bg-amber-900/40"
				title={t("ownerPortal.tabs.changeOrders")}
			>
				{changeOrders.count > 0 ? (
					<div className="space-y-1">
						<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
							{changeOrders.count}
						</p>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("ownerPortal.summary.approvedCount")}
						</p>
						{changeOrders.totalCostImpact !== 0 && (
							<p className="text-xs font-medium text-amber-600 dark:text-amber-400">
								{changeOrders.totalCostImpact > 0 ? "+" : ""}
								{formatSARArabic(changeOrders.totalCostImpact)}
							</p>
						)}
					</div>
				) : (
					<p className="text-sm text-slate-400">
						{t("ownerPortal.summary.noChangeOrders")}
					</p>
				)}
			</SectionCard>

			{/* Chat — full width */}
			<SectionCard
				href={`${basePath}/chat`}
				icon={
					<MessageSquare className="h-5 w-5 text-primary" />
				}
				iconClass="bg-primary/10"
				title={t("ownerPortal.tabs.chat")}
				className="sm:col-span-2"
			>
				{chat.lastMessage ? (
					<div className="space-y-1">
						<p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
							{chat.lastMessage.content}
						</p>
						<p className="text-xs text-slate-400">
							{chat.lastMessage.isOwner
								? t("ownerPortal.chat.owner")
								: (chat.lastMessage.senderName ?? "")}
							{" • "}
							{formatDateNumeric(chat.lastMessage.createdAt)}
						</p>
					</div>
				) : (
					<p className="text-sm text-slate-400">
						{t("ownerPortal.chat.startConversation")}
					</p>
				)}
			</SectionCard>
		</div>
	);
}
