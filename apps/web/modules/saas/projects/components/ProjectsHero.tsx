"use client";

import { UpgradeGate } from "@saas/shared/components/UpgradeGate";
import { formatSAR } from "@shared/lib/formatters";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * ProjectsHero — بطاقة ملوّنة واحدة تجمع مؤشرات المشاريع الأربعة، على غرار
 * بطاقة الداشبورد (BotlyHero / Figma 45:4531): نفس التدرّج الفاتح ونفس شريط
 * الإحصائيات الزجاجي (glass strip). تحل محل شبكة البطاقات الأربع المنفصلة.
 *
 * الخلايا الأربع: إجمالي المشاريع | النشطة | المكتملة | إجمالي قيمة العقود.
 */
export function ProjectsHero({
	newProjectHref,
	stats,
}: {
	newProjectHref: string;
	stats: {
		total: number;
		active: number;
		completed: number;
		totalValue: number;
	};
}) {
	const t = useTranslations();

	const cells: { label: string; value: React.ReactNode }[] = [
		{ label: t("projects.stats.total"), value: stats.total },
		{ label: t("projects.stats.active"), value: stats.active },
		{ label: t("projects.stats.completed"), value: stats.completed },
		{
			label: t("projects.stats.totalValue"),
			value: formatSAR(stats.totalValue),
		},
	];

	return (
		<div
			className="relative overflow-hidden rounded-[28px] p-4 sm:rounded-[32px] sm:p-6 xl:p-8"
			style={{
				backgroundImage:
					"linear-gradient(235.49deg, rgb(214, 220, 209) 57.337%, rgb(255, 221, 180) 81.642%, rgb(199, 180, 255) 105.59%)",
			}}
		>
			{/* العنوان + زر مشروع جديد */}
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h2 className="truncate text-lg font-bold leading-tight text-[#1d1d1d] sm:text-xl xl:text-2xl">
						{t("projects.title")}
					</h2>
					<p className="mt-0.5 truncate text-xs font-medium text-[#1d1d1d]/60 sm:text-sm">
						{t("projects.subtitle")}
					</p>
				</div>
				<UpgradeGate feature="projects.create">
					<Link
						href={newProjectHref}
						className="flex shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#1d1d1d] px-3 py-2.5 text-xs font-semibold leading-none text-white transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
					>
						<Plus className="size-4" />
						<span className="hidden sm:inline">{t("projects.newProject")}</span>
						<ChevronLeft className="rtl-flip hidden size-4 sm:inline" />
					</Link>
				</UpgradeGate>
			</div>

			{/* شريط الإحصائيات الزجاجي — 4 خلايا */}
			<div className="mt-4 grid grid-cols-2 gap-3 rounded-[20px] border border-[rgba(255,255,255,0.7)] bg-gradient-to-b from-[rgba(255,255,255,0.69)] to-white px-4 py-4 backdrop-blur-[24px] sm:mt-5 sm:gap-6 sm:rounded-[24px] sm:px-8 sm:py-5 lg:grid-cols-4">
				{cells.map((cell) => (
					<div key={cell.label} className="flex min-w-0 flex-col gap-1">
						<p className="truncate text-xs font-semibold text-[#1d1d1d]/70 sm:text-sm">
							{cell.label}
						</p>
						<p className="truncate text-xl font-bold tabular-nums leading-none tracking-[-0.5px] text-[#1d1d1d] sm:text-2xl xl:text-3xl">
							{cell.value}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
