"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Skeleton } from "@ui/components/skeleton";
import {
	Building2,
	Calendar,
	CreditCard,
	Home,
	Image as ImageIcon,
	MessageSquare,
	AlertTriangle,
	Clock,
	FileDiff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
	OwnerSessionContext,
	getSessionFromCookie,
	setSessionCookie,
	clearSessionCookie,
} from "@saas/projects-owner/hooks/use-owner-session";
import { OWNER_QUERY_FRESHNESS } from "@saas/projects-owner/lib/query-freshness";
import { resolveImageSrc } from "@saas/shared/lib/image-src";

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

	// Session token state: try this token's cookie first, then exchange.
	// The cookie is scoped per URL token so a stale session from another link
	// can never leak in and falsely render this (valid) link as invalid.
	const [sessionToken, setSessionToken] = useState<string | null>(() =>
		getSessionFromCookie(token),
	);

	// Exchange URL token for a session token on first visit
	const exchangeMutation = useMutation(
		orpc.projectOwner.portal.exchangeToken.mutationOptions() as any,
	);

	useEffect(() => {
		if (sessionToken) return; // Already have a session
		(exchangeMutation as any).mutate(
			{ token },
			{
				onSuccess: (data: any) => {
					setSessionCookie(token, data.sessionToken, data.expiresAt);
					setSessionToken(data.sessionToken);
				},
			},
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, sessionToken]);

	// Use session token for API calls when available, fall back to URL token
	const authInput = sessionToken
		? { sessionToken }
		: { token };

	// Validate token and get basic info
	const { data: summary, isLoading, error } = useQuery(
		orpc.projectOwner.portal.getSummary.queryOptions({
			input: authInput,
			...OWNER_QUERY_FRESHNESS,
		}),
	) as { data: any; isLoading: boolean; error: any };

	// If a session-based request fails (expired/revoked/mismatched session),
	// drop the session and fall back to re-exchanging the still-valid URL token
	// instead of showing an error. The exchange effect re-runs once cleared.
	useEffect(() => {
		if (error && sessionToken) {
			clearSessionCookie(token);
			setSessionToken(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [error, sessionToken, token]);

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
			href: `${basePath}/photos`,
			label: t("ownerPortal.tabs.photos"),
			icon: ImageIcon,
			active: pathname === `${basePath}/photos`,
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

	// Detect token expired vs invalid from error message
	const isTokenExpired = error?.message?.includes("TOKEN_EXPIRED");

	// Show expired token page
	if (isTokenExpired) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950" dir="rtl">
				<div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center dark:border-amber-900 dark:bg-slate-900">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
						<Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
					</div>
					<h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("ownerPortal.tokenExpired")}
					</h1>
					<p className="text-slate-500">
						{t("ownerPortal.tokenExpiredDescription")}
					</p>
				</div>
			</div>
		);
	}

	// Show error state (invalid/revoked)
	if (error || (!isLoading && !summary)) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950" dir="rtl">
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
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
				<header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
					<div className="mx-auto max-w-5xl px-4 py-4">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-xl" />
							<div className="space-y-1.5">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
						<div className="mt-4 flex gap-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-8 w-20 rounded-xl" />
							))}
						</div>
					</div>
				</header>
				<main className="mx-auto max-w-5xl px-4 py-6">
					<div className="space-y-6">
						<Skeleton className="h-40 w-full rounded-2xl" />
						<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-24 rounded-2xl" />
							))}
						</div>
						<Skeleton className="h-48 w-full rounded-2xl" />
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80 print:hidden">
				<div className="mx-auto max-w-6xl px-4 py-3 sm:py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{summary?.project?.coverPhoto?.url ? (
								<Image
									src={resolveImageSrc(summary.project.coverPhoto.url) as string}
									alt={summary.project.name}
									width={48}
									height={48}
									className="h-12 w-12 rounded-xl object-cover ring-2 ring-primary/20"
									unoptimized
								/>
							) : resolveImageSrc(summary?.organization?.logo) ? (
								<Image
									src={resolveImageSrc(summary.organization.logo) as string}
									alt={summary.organization.name}
									width={40}
									height={40}
									className="rounded-xl object-cover"
									unoptimized
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
									<Building2 className="h-5 w-5 text-primary" />
								</div>
							)}
							<div className="min-w-0">
								<h1 className="truncate font-semibold text-slate-900 dark:text-slate-100">
									{summary?.project?.name}
								</h1>
								<p className="truncate text-xs text-slate-500">
									{summary?.organization?.name}
								</p>
							</div>
						</div>
					</div>

					{/* Desktop navigation */}
					<nav className="mt-4 hidden gap-1 overflow-x-auto pb-1 md:flex">
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
			<main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-10">
				<OwnerSessionContext.Provider value={sessionToken}>
					{children}
				</OwnerSessionContext.Provider>
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-200 bg-white py-6 pb-24 md:pb-6 dark:border-slate-800 dark:bg-slate-900 print:hidden">
				<div className="mx-auto max-w-6xl px-4 text-center">
					<a
						href="https://app-masar.com/ar"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-slate-500 transition-colors hover:text-primary"
					>
						{t("ownerPortal.footer")}
					</a>
				</div>
			</footer>

			{/* Mobile bottom navigation */}
			<nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95 md:hidden print:hidden pb-[env(safe-area-inset-bottom)]">
				<div className="mx-auto flex max-w-6xl items-stretch justify-around">
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
								item.active
									? "text-primary"
									: "text-slate-500 dark:text-slate-400"
							}`}
						>
							<item.icon className="h-5 w-5" />
							<span className="truncate px-0.5">{item.label}</span>
						</Link>
					))}
				</div>
			</nav>
		</div>
	);
}
