"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import {
	FileText,
	List,
	ClipboardCheck,
	Banknote,
	BarChart3,
} from "lucide-react";

interface SubcontractTabsProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
}

export function SubcontractTabs({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
}: SubcontractTabsProps) {
	const t = useTranslations();
	const pathname = usePathname();

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	// Fetch item count
	const { data: items } = useQuery(
		orpc.subcontracts.listItems.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Fetch claim count
	const { data: claims } = useQuery(
		orpc.subcontracts.listClaims.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	const tabs = [
		{
			key: "details",
			label: t("subcontracts.contractDetails"),
			href: basePath,
			icon: FileText,
			exact: true,
		},
		{
			key: "items",
			label: t("subcontractItems.title"),
			href: `${basePath}/items`,
			icon: List,
			count: items?.length,
		},
		{
			key: "claims",
			label: t("claims.subcontractClaims"),
			href: `${basePath}/claims`,
			icon: ClipboardCheck,
			count: claims?.length,
		},
	];

	function isActive(tab: { href: string; exact?: boolean }) {
		if (tab.exact) {
			return pathname === tab.href || pathname.endsWith(tab.href);
		}
		return pathname.includes(tab.href);
	}

	return (
		<div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1">
			{tabs.map((tab) => {
				const active = isActive(tab);
				const Icon = tab.icon;
				return (
					<Link
						key={tab.key}
						href={tab.href}
						className={`
							flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap
							${active
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground hover:bg-background/50"
							}
						`}
					>
						<Icon className="h-4 w-4" />
						{tab.label}
						{tab.count !== undefined && tab.count > 0 && (
							<Badge
								variant="secondary"
								className="h-5 min-w-5 px-1.5 text-xs"
							>
								{tab.count}
							</Badge>
						)}
					</Link>
				);
			})}
		</div>
	);
}
