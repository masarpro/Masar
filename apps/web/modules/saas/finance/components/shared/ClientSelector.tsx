"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import { Check, ChevronsUpDown, User, Plus } from "lucide-react";
import { cn } from "@ui/lib";

export interface Client {
	id: string;
	name: string;
	company?: string | null;
	phone?: string | null;
	email?: string | null;
	address?: string | null;
	taxNumber?: string | null;
}

interface ClientSelectorProps {
	organizationId: string;
	selectedClientId?: string;
	onSelect: (client: Client | null) => void;
	disabled?: boolean;
}

export function ClientSelector({
	organizationId,
	selectedClientId,
	onSelect,
	disabled = false,
}: ClientSelectorProps) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const { data, isLoading } = useQuery(
		orpc.finance.clients.list.queryOptions({
			input: {
				organizationId,
				query: search || undefined,
				isActive: true,
			},
		}),
	);

	const clients = data?.clients ?? [];
	const selectedClient = clients.find((c) => c.id === selectedClientId);

	return (
		<div className="space-y-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className="w-full justify-between rounded-xl"
					>
						{selectedClient ? (
							<div className="flex items-center gap-2 text-start">
								<User className="h-4 w-4 text-slate-400" />
								<span>{selectedClient.name}</span>
								{selectedClient.company && (
									<span className="text-slate-500">
										- {selectedClient.company}
									</span>
								)}
							</div>
						) : (
							<span className="text-slate-500">
								{t("finance.clients.selectOrEnter")}
							</span>
						)}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[400px] p-0 rounded-xl" align="start">
					<Command>
						<CommandInput
							placeholder={t("finance.clients.searchPlaceholder")}
							value={search}
							onValueChange={setSearch}
						/>
						<CommandList>
							<CommandEmpty>
								<div className="py-4 text-center">
									<p className="text-sm text-slate-500">
										{t("finance.clients.noResults")}
									</p>
									<Button
										variant="link"
										className="mt-2"
										onClick={() => {
											onSelect(null);
											setOpen(false);
										}}
									>
										<Plus className="h-4 w-4 me-2" />
										{t("finance.clients.enterManually")}
									</Button>
								</div>
							</CommandEmpty>
							<CommandGroup>
								{clients.map((client) => (
									<CommandItem
										key={client.id}
										value={client.id}
										onSelect={() => {
											onSelect({
												id: client.id,
												name: client.name,
												company: client.company,
												phone: client.phone,
												email: client.email,
												address: client.address,
												taxNumber: client.taxNumber,
											});
											setOpen(false);
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												selectedClientId === client.id
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										<div className="flex-1">
											<p className="font-medium">{client.name}</p>
											{client.company && (
												<p className="text-sm text-slate-500">
													{client.company}
												</p>
											)}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selectedClientId && (
				<Button
					type="button"
					variant="link"
					size="sm"
					className="text-slate-500"
					onClick={() => onSelect(null)}
				>
					{t("finance.clients.clearSelection")}
				</Button>
			)}
		</div>
	);
}
