"use client";

import { cn } from "@ui/lib";
import { Card } from "@ui/components/card";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface CompanyInfoProps {
	organizationSlug: string;
	commercialReg?: string | null;
	taxNumber?: string | null;
	city?: string | null;
	contractorClass?: string | null;
}

export function CompanyInfo({
	organizationSlug,
	commercialReg,
	taxNumber,
	city,
	contractorClass,
}: CompanyInfoProps) {
	const t = useTranslations();

	const fields = [
		{
			label: t("dashboard.companyInfo.cr"),
			value: commercialReg || "—",
		},
		{
			label: t("dashboard.companyInfo.vat"),
			value: taxNumber || "—",
		},
		{
			label: t("dashboard.companyInfo.city"),
			value: city || "—",
		},
		{
			label: t("dashboard.companyInfo.class"),
			value: contractorClass || "—",
		},
		{
			label: t("dashboard.companyInfo.status"),
			value: t("dashboard.companyInfo.active"),
			badge: true,
		},
	];

	return (
		<Card className="p-5 dark:border-gray-800 dark:bg-gray-900">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
					{t("dashboard.companyInfo.title")}
				</h3>
				<Link href={`/app/${organizationSlug}/settings/general`}>
					<Pencil className="h-3.5 w-3.5 text-gray-400 transition-colors hover:text-gray-600" />
				</Link>
			</div>

			<div className="space-y-3 text-sm">
				{fields.map((item) => (
					<div
						key={item.label}
						className="flex items-center justify-between"
					>
						<span className="text-gray-500 dark:text-gray-400">
							{item.label}
						</span>
						{item.badge ? (
							<span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
								{item.value}
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
							</span>
						) : (
							<span className="font-medium text-gray-900 dark:text-gray-200">
								{item.value}
							</span>
						)}
					</div>
				))}
			</div>

			<Link
				href={`/app/${organizationSlug}/settings/general`}
				className={cn(
					"mt-5 block w-full rounded-xl py-2.5 text-center text-sm font-bold",
					"bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200",
					"dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
				)}
			>
				{t("dashboard.companyInfo.details")}
			</Link>
		</Card>
	);
}
