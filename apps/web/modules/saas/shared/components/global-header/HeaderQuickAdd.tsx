"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { usePermission } from "@saas/permissions/hooks/use-permission";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import {
	Banknote,
	FileSpreadsheet,
	FileText,
	FolderPlus,
	SquarePlus,
	UserPlus,
	Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Botly top-bar quick-add (69:1786): rounded-12 "+" icon button that opens a
 * curated create menu. Every route is a verified `/new` page; entries are
 * gated by the same section permissions the dashboard widgets use.
 */
export function HeaderQuickAdd() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { isOwner, permissions } = usePermission();

	const slug = activeOrganization?.slug;
	if (!slug) {
		return null;
	}

	const canProjects =
		isOwner || Object.values(permissions?.projects ?? {}).some(Boolean);
	const canFinance = isOwner || (permissions?.finance?.view ?? false);
	const canPricing = isOwner || (permissions?.pricing?.view ?? false);

	const groups: Array<{
		key: string;
		show: boolean;
		items: Array<{ label: string; href: string; icon: LucideIcon }>;
	}> = [
		{
			key: "projects",
			show: canProjects,
			items: [
				{
					label: t("globalHeader.quickAdd.project"),
					href: `/app/${slug}/projects/new`,
					icon: FolderPlus,
				},
			],
		},
		{
			key: "finance",
			show: canFinance,
			items: [
				{
					label: t("globalHeader.quickAdd.invoice"),
					href: `/app/${slug}/finance/invoices/new`,
					icon: FileText,
				},
				{
					label: t("globalHeader.quickAdd.payment"),
					href: `/app/${slug}/finance/payments/new`,
					icon: Banknote,
				},
				{
					label: t("globalHeader.quickAdd.client"),
					href: `/app/${slug}/finance/clients/new`,
					icon: Users,
				},
			],
		},
		{
			key: "pricing",
			show: canPricing,
			items: [
				{
					label: t("globalHeader.quickAdd.quotation"),
					href: `/app/${slug}/pricing/quotations/new`,
					icon: FileSpreadsheet,
				},
				{
					label: t("globalHeader.quickAdd.lead"),
					href: `/app/${slug}/pricing/leads/new`,
					icon: UserPlus,
				},
			],
		},
	];

	const visibleGroups = groups.filter((g) => g.show);
	if (visibleGroups.length === 0) {
		return null;
	}

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={t("globalHeader.quickAdd.title")}
					className={cn(
						// Botly 69:1786: plain rounded-12 hit area; the square is part
						// of the SquarePlus glyph itself (no CSS border box).
						"flex size-11 items-center justify-center rounded-xl text-foreground transition-colors",
						"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					)}
				>
					<SquarePlus className="size-5" />
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>{t("globalHeader.quickAdd.title")}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{visibleGroups.map((group, gi) => (
					<div key={group.key}>
						{gi > 0 && <DropdownMenuSeparator />}
						{group.items.map((item) => (
							<DropdownMenuItem key={item.href} asChild>
								<Link href={item.href}>
									<item.icon className="me-2 size-4" />
									{item.label}
								</Link>
							</DropdownMenuItem>
						))}
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
