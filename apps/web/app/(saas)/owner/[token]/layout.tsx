"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Building2,
	Calendar,
	CreditCard,
	Home,
	MessageSquare,
	AlertTriangle,
	FileDiff,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function OwnerPortalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams();
	const pathname = usePathname();
	const token = params.token as string;
	const t = useTranslations();
	const basePath = `/owner/${token}`;

	// Validate token and get basic info
	const { data: summary, isLoading, error } = useQuery(
		orpc.projectOwner.portal.getSummary.queryOptions({
			input: { token },
		}),
	);

	const navItems = [
		{
			href: basePath,
			label: t("ownerPortal.tabs.summary"),
			icon: Home,
			active: pathname === basePath,
		},
		{
			href: `${basePath}/schedule`,
			label: t("ownerPortal.tabs.schedule"),
			icon: Calendar,
			active: pathname === `${basePath}/schedule`,
		},
		{
			href: `${basePath}/payments`,
			label: t("ownerPortal.tabs.payments"),
			icon: CreditCard,
			active: pathname === `${basePath}/payments`,
		},
		{
			href: `${basePath}/changes`,
			label: t("ownerPortal.tabs.changeOrders"),
			icon: FileDiff,
			active: pathname.startsWith(`${basePath}/changes`),
		},
		{
			href: `${basePath}/chat`,
			label: t("ownerPortal.tabs.chat"),
			icon: MessageSquare,
			active: pathname === `${basePath}/chat`,
		},
	];

	// Show error state
	if (error || (!isLoading && !summary)) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
				<div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-slate-900">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
						<AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
					</div>
					<h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("ownerPortal.invalidLink")}
					</h1>
					<p className="text-slate-500">
						{t("ownerPortal.invalidLinkDescription")}
					</p>
				</div>
			</div>
		);
	}

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
				<div className="mx-auto max-w-5xl px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{summary?.organization?.logo ? (
								<img
									src={summary.organization.logo}
									alt={summary.organization.name}
									className="h-10 w-10 rounded-xl object-cover"
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
									<Building2 className="h-5 w-5 text-primary" />
								</div>
							)}
							<div>
								<h1 className="font-semibold text-slate-900 dark:text-slate-100">
									{summary?.project?.name}
								</h1>
								<p className="text-xs text-slate-500">
									{summary?.organization?.name}
								</p>
							</div>
						</div>
					</div>

					{/* Navigation */}
					<nav className="mt-4 flex gap-1 overflow-x-auto pb-1">
						{navItems.map((item) => (
							<Link key={item.href} href={item.href}>
								<Button
									variant={item.active ? "primary" : "ghost"}
									size="sm"
									className={`rounded-xl whitespace-nowrap ${
										item.active
											? ""
											: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
									}`}
								>
									<item.icon className="h-4 w-4 me-2" />
									{item.label}
								</Button>
							</Link>
						))}
					</nav>
				</div>
			</header>

			{/* Main Content */}
			<main className="mx-auto max-w-5xl px-4 py-6">
				{children}
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
				<div className="mx-auto max-w-5xl px-4 text-center">
					<p className="text-sm text-slate-500">
						{t("ownerPortal.footer")}
					</p>
				</div>
			</footer>
		</div>
	);
}
