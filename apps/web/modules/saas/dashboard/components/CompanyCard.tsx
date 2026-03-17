"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

interface CompanyCardProps {
	totalBalance: number;
	orgName: string;
	commercialReg?: string | null;
}

export function CompanyCard({
	totalBalance,
	orgName,
	commercialReg,
}: CompanyCardProps) {
	const t = useTranslations();
	const lastFour = commercialReg?.slice(-4) || "0000";

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-2xl p-5 shadow-xl",
				"bg-gradient-to-bl from-amber-600 via-orange-500 to-rose-500",
				"dark:from-gray-800 dark:via-gray-700 dark:to-gray-600",
				"text-white",
			)}
		>
			{/* Decorative circles */}
			<div className="pointer-events-none absolute -top-8 -end-8 h-32 w-32 rounded-full bg-white/10" />
			<div className="pointer-events-none absolute -bottom-10 -start-10 h-28 w-28 rounded-full bg-white/5" />

			{/* Balance */}
			<p className="mb-1 text-xs font-medium opacity-70">
				{t("dashboard.companyCard.totalBalance")}
			</p>
			<p className="mb-5 text-3xl font-black tracking-tight">
				<Currency
					amount={totalBalance}
					className="text-white"
					symbolClassName="text-white/70"
				/>
			</p>

			{/* Org name */}
			<p className="text-sm font-bold leading-snug">{orgName}</p>

			{/* CR number (masked) + Masar brand */}
			<div className="mt-4 flex items-center justify-between">
				<p className="font-mono text-xs tracking-widest opacity-60">
					{"•••• •••• •••• "}
					{lastFour}
				</p>
				<span className="text-lg font-black opacity-80">مسار</span>
			</div>
		</div>
	);
}
