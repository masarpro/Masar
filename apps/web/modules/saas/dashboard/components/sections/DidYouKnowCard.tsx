"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

const TIPS = [
	{ key: "quantitySmart", href: "/pricing/studies" },
	{ key: "aiAssistant", href: "/chatbot" },
	{ key: "ownerPortal", href: "/projects" },
	{ key: "invoiceTemplates", href: "/finance/invoices" },
	{ key: "zatcaQr", href: "/finance/invoices" },
	{ key: "ganttChart", href: "/projects" },
	{ key: "subcontractors", href: "/projects" },
	{ key: "dailyReports", href: "/projects" },
	{ key: "criticalPath", href: "/projects" },
	{ key: "leadsTracking", href: "/pricing/leads" },
	{ key: "payrollSystem", href: "/company/payroll" },
	{ key: "documentVersions", href: "/projects" },
	{ key: "approvalWorkflow", href: "/projects" },
	{ key: "cashFlow", href: "/finance/reports" },
	{ key: "changeOrders", href: "/projects" },
	{ key: "buildingConfig", href: "/pricing/studies" },
	{ key: "mepEngine", href: "/pricing/studies" },
	{ key: "finishingCalc", href: "/pricing/studies" },
	{ key: "profitability", href: "/projects" },
	{ key: "quotationGen", href: "/pricing/quotations" },
	{ key: "employeeLeaves", href: "/company/leaves" },
	{ key: "assetTracking", href: "/company/assets" },
	{ key: "bankTransfers", href: "/finance/banks" },
	{ key: "multiLanguage", href: "/settings/general" },
	{ key: "darkMode", href: "/settings/general" },
	{ key: "rolePermissions", href: "/settings/roles" },
	{ key: "claimsWorkflow", href: "/projects" },
	{ key: "boqSummary", href: "/pricing/studies" },
	{ key: "heightDerivation", href: "/pricing/studies" },
	{ key: "teamChat", href: "/projects" },
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
		<div className={`${glassCard} flex flex-col p-4 h-full`}>
			{/* Header */}
			<div className="flex items-center gap-2 mb-3">
				<div className="p-1.5 rounded-lg bg-primary/10">
					<Sparkles className="h-4 w-4 text-primary" />
				</div>
				<span className="text-sm font-bold text-primary">
					{t("didYouKnow.title")}
				</span>
				<span className="text-xs text-muted-foreground ms-auto tabular-nums">
					{tipIndex + 1}/{TIPS.length}
				</span>
			</div>

			{/* Content */}
			<p className="text-sm text-foreground/80 leading-relaxed flex-1">
				{t(`didYouKnow.tips.${tip.key}`)}
			</p>

			{/* Link */}
			<Link
				href={fullHref}
				className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mt-3"
			>
				<span>{t("didYouKnow.tryIt")}</span>
				<ArrowLeft className="h-3.5 w-3.5" />
			</Link>
		</div>
	);
}
