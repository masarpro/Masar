"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Key, Copy, Settings } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface OwnerAccessCardProps {
	organizationId: string;
	projectId: string;
	basePath: string;
	enabled: boolean;
}

export function OwnerAccessCard({
	organizationId,
	projectId,
	basePath,
	enabled,
}: OwnerAccessCardProps) {
	const t = useTranslations();

	const { data: accessList } = useQuery({
		...orpc.projectOwner.listAccess.queryOptions({
			input: { organizationId, projectId },
		}),
		enabled,
	});

	const links = Array.isArray(accessList) ? accessList : [];
	const activeLinks = links.length;
	const firstToken = links[0]?.token;

	const handleCopyLink = () => {
		if (!firstToken) return;
		const url = `${window.location.origin}/owner/${firstToken}`;
		navigator.clipboard.writeText(url);
		toast.success(t("ownerAccess.linkCopied"));
	};

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex flex-col">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="rounded-xl bg-amber-100 dark:bg-amber-900/50 p-2">
						<Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
						{t("projects.commandCenter.ownerPortal")}
					</h3>
				</div>
				<span
					className={`text-xs font-medium px-2 py-1 rounded-full ${
						activeLinks > 0
							? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
							: "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
					}`}
				>
					{activeLinks > 0
						? t("projects.commandCenter.enabled")
						: t("projects.commandCenter.disabled")}
				</span>
			</div>

			<div className="flex-1 flex items-center mb-3">
				{activeLinks > 0 ? (
					<p className="text-xs text-slate-500">
						{t("projects.commandCenter.activeLinks", { count: activeLinks })}
					</p>
				) : (
					<p className="text-xs text-slate-400">-</p>
				)}
			</div>

			<div className="flex items-center gap-2">
				{firstToken && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopyLink}
						className="h-8 text-xs rounded-xl flex-1"
					>
						<Copy className="h-3.5 w-3.5 me-1.5" />
						{t("projects.commandCenter.copyLink")}
					</Button>
				)}
				<Button variant="outline" size="sm" asChild className="h-8 text-xs rounded-xl flex-1">
					<Link href={`${basePath}/owner`}>
						<Settings className="h-3.5 w-3.5 me-1.5" />
						{t("projects.commandCenter.manage")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
