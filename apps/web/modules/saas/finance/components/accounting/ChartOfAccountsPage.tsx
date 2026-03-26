"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
	BookOpen,
	ChevronDown,
	ChevronLeft,
	FileText,
	Folder,
	Plus,
	Search,
} from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { ACCOUNT_TYPE_COLORS } from "./formatters";
import Link from "next/link";

interface ChartOfAccountsPageProps {
	organizationId: string;
	organizationSlug: string;
}

interface TreeNode {
	id: string;
	code: string;
	nameAr: string;
	nameEn: string;
	type: string;
	level: number;
	parentId: string | null;
	isSystem: boolean;
	isActive: boolean;
	isPostable: boolean;
	children: TreeNode[];
}

export function ChartOfAccountsPage({ organizationId, organizationSlug }: ChartOfAccountsPageProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [expanded, setExpanded] = useState<Set<string>>(new Set(["1000", "2000", "3000", "4000", "5000", "6000"]));

	const { data: accounts, isLoading } = useQuery(
		orpc.accounting.accounts.list.queryOptions({
			input: { organizationId },
		}),
	);

	const seedMutation = useMutation({
		...orpc.accounting.accounts.seed.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounting"] });
		},
	});

	// Auto-seed chart of accounts if empty (rare edge case — normally seeded at org creation)
	const autoSeeded = useRef(false);
	useEffect(() => {
		if (!isLoading && accounts && accounts.length === 0 && !seedMutation.isPending && !autoSeeded.current) {
			autoSeeded.current = true;
			seedMutation.mutate({ organizationId });
		}
	}, [isLoading, accounts, seedMutation.isPending, organizationId]);

	// Build tree from flat list
	const tree = useMemo(() => {
		if (!accounts || accounts.length === 0) return [];
		const map = new Map<string, TreeNode>();
		const roots: TreeNode[] = [];

		for (const acc of accounts) {
			map.set(acc.id, { ...acc, children: [] });
		}

		for (const acc of accounts) {
			const node = map.get(acc.id)!;
			if (acc.parentId && map.has(acc.parentId)) {
				map.get(acc.parentId)!.children.push(node);
			} else {
				roots.push(node);
			}
		}

		return roots;
	}, [accounts]);

	// Filter tree by search
	const filteredTree = useMemo(() => {
		if (!search.trim()) return tree;
		const q = search.toLowerCase();

		function matches(node: TreeNode): boolean {
			return (
				node.code.includes(q) ||
				node.nameAr.includes(q) ||
				node.nameEn.toLowerCase().includes(q) ||
				node.children.some(matches)
			);
		}

		function filter(nodes: TreeNode[]): TreeNode[] {
			return nodes
				.filter(matches)
				.map((n) => ({ ...n, children: filter(n.children) }));
		}

		return filter(tree);
	}, [tree, search]);

	const toggleExpand = (code: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(code)) next.delete(code);
			else next.add(code);
			return next;
		});
	};

	if (isLoading) return <DashboardSkeleton />;

	// No accounts — auto-seeding in progress, show skeleton
	if (!accounts || accounts.length === 0) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						placeholder={t("finance.accounting.search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="ps-9 rounded-xl"
					/>
				</div>
			</div>

			{/* Tree */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					<div className="divide-y divide-slate-100 dark:divide-slate-800">
						{filteredTree.map((node) => (
							<AccountTreeNode
								key={node.id}
								node={node}
								expanded={expanded}
								onToggle={toggleExpand}
								organizationSlug={organizationSlug}
								t={t}
							/>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function AccountTreeNode({
	node,
	expanded,
	onToggle,
	organizationSlug,
	t,
	depth = 0,
}: {
	node: TreeNode;
	expanded: Set<string>;
	onToggle: (code: string) => void;
	organizationSlug: string;
	t: ReturnType<typeof useTranslations>;
	depth?: number;
}) {
	const isExpanded = expanded.has(node.code);
	const hasChildren = node.children.length > 0;
	const colors = ACCOUNT_TYPE_COLORS[node.type] ?? ACCOUNT_TYPE_COLORS.ASSET;
	const isLevel1 = node.level === 1;
	const ledgerHref = `/app/${organizationSlug}/finance/chart-of-accounts/${node.id}/ledger`;

	return (
		<>
			<div
				className={`flex items-center gap-2 py-2.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
					isLevel1 ? `${colors.bg} font-semibold` : ""
				} ${!node.isActive ? "opacity-50" : ""}`}
				style={{ paddingInlineStart: `${depth * 1.5 + 1}rem` }}
				onClick={() => hasChildren && onToggle(node.code)}
			>
				{/* Expand icon */}
				<span className="w-5 flex-shrink-0">
					{hasChildren ? (
						isExpanded ? (
							<ChevronDown className="h-4 w-4 text-slate-400" />
						) : (
							<ChevronLeft className="h-4 w-4 text-slate-400" />
						)
					) : null}
				</span>

				{/* Icon */}
				{node.isPostable ? (
					<FileText className={`h-4 w-4 flex-shrink-0 ${colors.text}`} />
				) : (
					<Folder className={`h-4 w-4 flex-shrink-0 ${colors.text}`} />
				)}

				{/* Code */}
				<span className="text-xs font-mono text-slate-400 w-12 flex-shrink-0">
					{node.code}
				</span>

				{/* Name — clickable to ledger if postable */}
				{node.isPostable ? (
					<Link
						href={ledgerHref}
						className="flex-1 text-sm text-primary hover:underline"
						onClick={(e) => e.stopPropagation()}
					>
						{node.nameAr}
					</Link>
				) : (
					<span className={`flex-1 text-sm ${isLevel1 ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
						{node.nameAr}
					</span>
				)}

				{/* Badges */}
				{node.isSystem && (
					<Badge variant="outline" className="text-[10px] px-1.5 py-0">
						{t("finance.accounting.systemAccount")}
					</Badge>
				)}

				{/* Ledger icon for postable accounts */}
				{node.isPostable && (
					<Link
						href={ledgerHref}
						className="text-slate-400 hover:text-primary"
						onClick={(e) => e.stopPropagation()}
						title={t("finance.accounting.viewLedger")}
					>
						<BookOpen className="h-3.5 w-3.5" />
					</Link>
				)}
			</div>

			{/* Children */}
			{isExpanded &&
				node.children.map((child) => (
					<AccountTreeNode
						key={child.id}
						node={child}
						expanded={expanded}
						onToggle={onToggle}
						organizationSlug={organizationSlug}
						t={t}
						depth={depth + 1}
					/>
				))}
		</>
	);
}
