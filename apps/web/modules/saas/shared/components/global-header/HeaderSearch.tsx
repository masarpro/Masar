"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/command";
import { Dialog, DialogContent, DialogTitle } from "@ui/components/dialog";
import { cn } from "@ui/lib";
import {
	Banknote,
	Calculator,
	FileSpreadsheet,
	FileText,
	FolderKanban,
	Loader2Icon,
	SearchIcon,
	UserPlus,
	UserRound,
	Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useSidebarMenu } from "../sidebar/use-sidebar-menu";

type ResultType =
	| "project"
	| "client"
	| "invoice"
	| "quotation"
	| "study"
	| "payment"
	| "employee"
	| "lead";

interface SearchResult {
	type: ResultType;
	id: string;
	title: string;
	subtitle: string | null;
}

/** Per-type presentation + route builder. Order = display order of groups. */
const TYPE_CONFIG: Record<
	ResultType,
	{ icon: LucideIcon; groupKey: string; href: (slug: string, id: string) => string }
> = {
	project: {
		icon: FolderKanban,
		groupKey: "projects",
		href: (s, id) => `/app/${s}/projects/${id}`,
	},
	invoice: {
		icon: FileText,
		groupKey: "invoices",
		href: (s, id) => `/app/${s}/finance/invoices/${id}`,
	},
	payment: {
		icon: Banknote,
		groupKey: "payments",
		href: (s, id) => `/app/${s}/finance/payments/${id}`,
	},
	client: {
		icon: Users,
		groupKey: "clients",
		href: (s, id) => `/app/${s}/finance/clients/${id}`,
	},
	study: {
		icon: Calculator,
		groupKey: "studies",
		href: (s, id) => `/app/${s}/pricing/studies/${id}`,
	},
	quotation: {
		icon: FileSpreadsheet,
		groupKey: "quotations",
		href: (s, id) => `/app/${s}/pricing/quotations/${id}`,
	},
	lead: {
		icon: UserPlus,
		groupKey: "leads",
		href: (s, id) => `/app/${s}/pricing/leads/${id}`,
	},
	employee: {
		icon: UserRound,
		groupKey: "employees",
		href: (s, id) => `/app/${s}/company/employees/${id}`,
	},
};

const GROUP_ORDER: ResultType[] = [
	"project",
	"invoice",
	"payment",
	"client",
	"study",
	"quotation",
	"lead",
	"employee",
];

/**
 * Botly top-bar search (69:1786): rounded-12 icon button opening a command
 * palette. Empty → quick-jump to any nav section; typing → full organization
 * search across projects, clients, invoices, quotations, studies, payments,
 * employees and leads (server-side, permission-scoped, debounced).
 */
export function HeaderSearch() {
	const t = useTranslations();
	const router = useRouter();
	const { activeOrganization } = useActiveOrganization();
	const { items } = useSidebarMenu();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [debounced, setDebounced] = useState("");

	const slug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";

	// Debounce the typed query to avoid a request per keystroke.
	useEffect(() => {
		const id = setTimeout(() => setDebounced(query.trim()), 250);
		return () => clearTimeout(id);
	}, [query]);

	// Reset state when the palette closes.
	useEffect(() => {
		if (!open) {
			setQuery("");
			setDebounced("");
		}
	}, [open]);

	// Cmd/Ctrl+K toggles the palette.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((v) => !v);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	const isSearching = debounced.length >= 2;

	const { data, isFetching } = useQuery({
		...orpc.search.global.queryOptions({
			input: { organizationId, query: debounced },
		}),
		enabled: open && isSearching && !!organizationId,
		staleTime: STALE_TIMES.NOTIFICATIONS,
	});

	const results = (data?.results ?? []) as SearchResult[];

	// Group results by type, preserving GROUP_ORDER.
	const grouped = useMemo(() => {
		const map = new Map<ResultType, SearchResult[]>();
		for (const r of results) {
			const list = map.get(r.type) ?? [];
			list.push(r);
			map.set(r.type, list);
		}
		return GROUP_ORDER.filter((type) => map.has(type)).map((type) => ({
			type,
			items: map.get(type) as SearchResult[],
		}));
	}, [results]);

	// Nav quick-jump entries (shown before the user types).
	const navEntries = useMemo(() => {
		const flat: Array<{ id: string; label: string; href: string; icon: LucideIcon }> =
			[];
		const seen = new Set<string>();
		for (const item of items) {
			if (item.href && !seen.has(item.href)) {
				seen.add(item.href);
				flat.push({
					id: item.id,
					label: item.label,
					href: item.href,
					icon: item.icon,
				});
			}
			for (const child of item.children ?? []) {
				if (!seen.has(child.href)) {
					seen.add(child.href);
					flat.push({
						id: child.id,
						label: child.label,
						href: child.href,
						icon: child.icon,
					});
				}
			}
		}
		return flat;
	}, [items]);

	const go = (href: string) => {
		setOpen(false);
		router.push(href);
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label={t("globalHeader.search")}
				className={cn(
					"flex size-11 items-center justify-center rounded-xl text-foreground transition-colors",
					"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				)}
			>
				<SearchIcon className="size-5" />
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="overflow-hidden p-0">
					<DialogTitle className="sr-only">
						{t("globalHeader.search")}
					</DialogTitle>
					<Command
						shouldFilter={false}
						className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
					>
						<CommandInput
							value={query}
							onValueChange={setQuery}
							placeholder={t("globalHeader.searchPlaceholder")}
						/>
						<CommandList>
							{/* Before typing: quick nav jump list */}
							{!isSearching &&
								navEntries.map((entry) => {
									const Icon = entry.icon;
									return (
										<CommandItem
											key={`nav-${entry.id}`}
											value={entry.href}
											onSelect={() => go(entry.href)}
											className="gap-2.5"
										>
											<Icon className="size-4 shrink-0 text-muted-foreground" />
											<span>{entry.label}</span>
										</CommandItem>
									);
								})}

							{/* While typing: loading / empty / grouped DB results */}
							{isSearching && isFetching && results.length === 0 && (
								<div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
									<Loader2Icon className="size-4 animate-spin" />
									{t("globalHeader.searching")}
								</div>
							)}

							{isSearching && !isFetching && results.length === 0 && (
								<CommandEmpty>{t("globalHeader.searchEmpty")}</CommandEmpty>
							)}

							{isSearching &&
								grouped.map((group) => {
									const config = TYPE_CONFIG[group.type];
									const Icon = config.icon;
									return (
										<CommandGroup
											key={group.type}
											heading={t(
												`globalHeader.searchGroups.${config.groupKey}`,
											)}
										>
											{group.items.map((item) => (
												<CommandItem
													key={`${group.type}-${item.id}`}
													value={`${group.type}-${item.id}`}
													onSelect={() => go(config.href(slug, item.id))}
													className="gap-2.5"
												>
													<Icon className="size-4 shrink-0 text-muted-foreground" />
													<span className="flex min-w-0 flex-col">
														<span className="truncate">{item.title}</span>
														{item.subtitle && (
															<span className="truncate text-xs text-muted-foreground">
																{item.subtitle}
															</span>
														)}
													</span>
												</CommandItem>
											))}
										</CommandGroup>
									);
								})}
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>
		</>
	);
}
