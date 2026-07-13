"use client";

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
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useSidebarMenu } from "../sidebar/use-sidebar-menu";

/**
 * Botly top-bar search (69:1786): rounded-12 icon button that opens a
 * command palette to jump to any navigable section. Powered by the same
 * permission-filtered menu the sidebar uses, so results respect RBAC.
 */
export function HeaderSearch() {
	const t = useTranslations();
	const router = useRouter();
	const { items } = useSidebarMenu();
	const [open, setOpen] = useState(false);

	// Flatten menu (top-level + children) into a single searchable list.
	const entries = useMemo(() => {
		const flat: Array<{ id: string; label: string; href: string; icon: any }> =
			[];
		for (const item of items) {
			if (item.href) {
				flat.push({
					id: item.id,
					label: item.label,
					href: item.href,
					icon: item.icon,
				});
			}
			for (const child of item.children ?? []) {
				flat.push({
					id: child.id,
					label: child.label,
					href: child.href,
					icon: child.icon,
				});
			}
		}
		// De-dupe by href (a parent and its dashboard child can share a route).
		const seen = new Set<string>();
		return flat.filter((e) => {
			if (seen.has(e.href)) return false;
			seen.add(e.href);
			return true;
		});
	}, [items]);

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

	const onSelect = (href: string) => {
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
					<Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
						<CommandInput placeholder={t("globalHeader.searchPlaceholder")} />
						<CommandList>
							<CommandEmpty>{t("globalHeader.searchEmpty")}</CommandEmpty>
							<CommandGroup>
								{entries.map((entry) => {
									const Icon = entry.icon;
									return (
										<CommandItem
											key={entry.id}
											value={`${entry.label} ${entry.href}`}
											onSelect={() => onSelect(entry.href)}
											className="gap-2.5"
										>
											<Icon className="size-4 shrink-0 text-muted-foreground" />
											<span>{entry.label}</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>
		</>
	);
}
