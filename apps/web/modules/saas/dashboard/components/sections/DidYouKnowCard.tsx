"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const TIPS = [
	{ key: "quantitySmart", href: "/pricing/studies", gradient: "from-chart-4/10 to-chart-4/10" },
	{ key: "aiAssistant", href: "/chatbot", gradient: "from-purple-500/10 to-pink-500/10" },
	{ key: "ownerPortal", href: "/projects", gradient: "from-emerald-500/10 to-teal-500/10" },
	{ key: "invoiceTemplates", href: "/finance/invoices", gradient: "from-amber-500/10 to-orange-500/10" },
	{ key: "zatcaQr", href: "/finance/invoices", gradient: "from-green-500/10 to-emerald-500/10" },
	{ key: "ganttChart", href: "/projects", gradient: "from-indigo-500/10 to-chart-4/10" },
	{ key: "subcontractors", href: "/projects", gradient: "from-rose-500/10 to-pink-500/10" },
	{ key: "dailyReports", href: "/projects", gradient: "from-chart-4/10 to-chart-4/10" },
	{ key: "criticalPath", href: "/projects", gradient: "from-red-500/10 to-orange-500/10" },
	{ key: "leadsTracking", href: "/pricing/leads", gradient: "from-violet-500/10 to-purple-500/10" },
	{ key: "payrollSystem", href: "/company/payroll", gradient: "from-teal-500/10 to-chart-4/10" },
	{ key: "documentVersions", href: "/projects", gradient: "from-chart-4/10 to-indigo-500/10" },
	{ key: "approvalWorkflow", href: "/projects", gradient: "from-green-500/10 to-lime-500/10" },
	{ key: "cashFlow", href: "/finance/reports", gradient: "from-chart-4/10 to-chart-4/10" },
	{ key: "changeOrders", href: "/projects", gradient: "from-amber-500/10 to-yellow-500/10" },
	{ key: "buildingConfig", href: "/pricing/studies", gradient: "from-muted to-muted" },
	{ key: "mepEngine", href: "/pricing/studies", gradient: "from-yellow-500/10 to-amber-500/10" },
	{ key: "finishingCalc", href: "/pricing/studies", gradient: "from-pink-500/10 to-rose-500/10" },
	{ key: "profitability", href: "/projects", gradient: "from-emerald-500/10 to-green-500/10" },
	{ key: "quotationGen", href: "/pricing/quotations", gradient: "from-chart-4/10 to-chart-4/10" },
	{ key: "employeeLeaves", href: "/company/leaves", gradient: "from-indigo-500/10 to-violet-500/10" },
	{ key: "assetTracking", href: "/company/assets", gradient: "from-orange-500/10 to-red-500/10" },
	{ key: "bankTransfers", href: "/finance/banks", gradient: "from-teal-500/10 to-emerald-500/10" },
	{ key: "multiLanguage", href: "/settings/general", gradient: "from-purple-500/10 to-indigo-500/10" },
	{ key: "darkMode", href: "/settings/general", gradient: "from-muted to-muted" },
	{ key: "rolePermissions", href: "/settings/roles", gradient: "from-red-500/10 to-rose-500/10" },
	{ key: "claimsWorkflow", href: "/projects", gradient: "from-chart-4/10 to-chart-4/10" },
	{ key: "boqSummary", href: "/pricing/studies", gradient: "from-lime-500/10 to-green-500/10" },
	{ key: "heightDerivation", href: "/pricing/studies", gradient: "from-chart-4/10 to-purple-500/10" },
	{ key: "teamChat", href: "/projects", gradient: "from-pink-500/10 to-purple-500/10" },
];

interface DidYouKnowCardProps {
	organizationSlug: string;
}

export function DidYouKnowCard({ organizationSlug }: DidYouKnowCardProps) {
	const t = useTranslations("dashboard");
	const [tipIndex, setTipIndex] = useState(0);

	useEffect(() => {
		try {
			const stored = localStorage.getItem("masar-tip-index");
			const idx = stored ? (parseInt(stored, 10) + 1) % TIPS.length : 0;
			setTipIndex(idx);
			localStorage.setItem("masar-tip-index", String(idx));
		} catch {
			// localStorage not available
		}
	}, []);

	const tip = TIPS[tipIndex];
	if (!tip) return null;
	const fullHref = `/app/${organizationSlug}${tip.href}`;

	return (
		<div
			className="relative overflow-hidden rounded-2xl border border-chart-4/40 dark:border-chart-4/20 bg-gradient-to-br from-chart-4/15 via-chart-4/15 to-chart-4/15 dark:from-chart-4/20 dark:via-chart-4/20 dark:to-chart-4/20 shadow-lg shadow-chart-4/5 p-2.5 flex flex-col flex-1"
		>
			{/* Header */}
			<div className="flex items-center gap-1.5 mb-1 relative z-10">
				<Sparkles className="h-3.5 w-3.5 text-chart-4 dark:text-chart-4" />
				<span className="text-xs font-bold text-chart-4 dark:text-chart-4">
					{t("didYouKnow.title")}
				</span>
				<span className="text-[10px] text-muted-foreground ms-auto">
					{tipIndex + 1}/{TIPS.length}
				</span>
			</div>

			{/* Content */}
			<p className="text-xs text-foreground/90 leading-relaxed mb-1.5 line-clamp-2 relative z-10">
				{t(`didYouKnow.tips.${tip.key}`)}
			</p>

			{/* Link */}
			<Link
				href={fullHref}
				className="flex items-center gap-1 text-xs font-semibold text-chart-4 dark:text-chart-4 hover:underline relative z-10 mt-auto ms-auto"
			>
				<span>{t("didYouKnow.tryIt")}</span>
				<ArrowLeft className="h-3 w-3" />
			</Link>
		</div>
	);
}
