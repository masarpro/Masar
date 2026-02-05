"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { toast } from "sonner";
import {
	Search,
	MoreVertical,
	Pencil,
	Trash2,
	Users,
	User,
	Building2,
	Phone,
	Smartphone,
	Mail,
	CheckCircle,
	XCircle,
	Eye,
} from "lucide-react";

interface ClientsListProps {
	organizationId: string;
	organizationSlug: string;
}

export function ClientsList({
	organizationId,
	organizationSlug,
}: ClientsListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// State
	const [searchQuery, setSearchQuery] = useState("");
	const [showActiveOnly, setShowActiveOnly] = useState<boolean | undefined>(undefined);
	const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

	// Fetch clients
	const { data, isLoading } = useQuery(
		orpc.finance.clients.list.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				isActive: showActiveOnly,
			},
		}),
	);

	const clients = data?.clients ?? [];

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.clients.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.deleteSuccess"));
			setDeleteClientId(null);
			queryClient.invalidateQueries({
				queryKey: ["finance", "clients"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.deleteError"));
		},
	});

	// Toggle active status mutation
	const toggleActiveMutation = useMutation({
		mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
			return orpcClient.finance.clients.update({
				organizationId,
				id,
				isActive,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.clients.statusUpdateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "clients"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.clients.statusUpdateError"));
		},
	});

	return (
		<div className="space-y-6">
			{/* Filters */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder={t("finance.clients.searchPlaceholder")}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="ps-10 rounded-xl"
							/>
						</div>
						<div className="flex gap-2">
							<Button
								variant={showActiveOnly === undefined ? "primary" : "outline"}
								size="sm"
								onClick={() => setShowActiveOnly(undefined)}
								className="rounded-xl"
							>
								{t("common.all")}
							</Button>
							<Button
								variant={showActiveOnly === true ? "primary" : "outline"}
								size="sm"
								onClick={() => setShowActiveOnly(true)}
								className="rounded-xl"
							>
								{t("finance.clients.active")}
							</Button>
							<Button
								variant={showActiveOnly === false ? "primary" : "outline"}
								size="sm"
								onClick={() => setShowActiveOnly(false)}
								className="rounded-xl"
							>
								{t("finance.clients.inactive")}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Clients Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="relative">
								<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
								<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						</div>
					) : clients.length === 0 ? (
						<div className="text-center py-20">
							<Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
							<p className="text-slate-500 dark:text-slate-400">
								{searchQuery
									? t("finance.clients.noSearchResults")
									: t("finance.clients.noClients")}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.clients.code")}</TableHead>
									<TableHead>{t("finance.clients.name")}</TableHead>
									<TableHead>{t("finance.clients.clientType")}</TableHead>
									<TableHead>{t("finance.clients.contact")}</TableHead>
									<TableHead className="text-center">
										{t("finance.clients.status")}
									</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{clients.map((client) => (
									<TableRow
										key={client.id}
										className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
										onClick={() =>
											router.push(
												`/app/${organizationSlug}/finance/clients/${client.id}`,
											)
										}
									>
										<TableCell onClick={(e) => e.stopPropagation()}>
											{client.code ? (
												<Badge variant="outline" className="rounded-lg font-mono">
													{client.code}
												</Badge>
											) : (
												<span className="text-slate-400">-</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
													{client.clientType === "COMMERCIAL" ? (
														<Building2 className="h-4 w-4 text-slate-500" />
													) : (
														<User className="h-4 w-4 text-slate-500" />
													)}
												</div>
												<div>
													<div className="font-medium text-slate-900 dark:text-slate-100">
														{client.name}
													</div>
													{client.businessName && client.clientType === "COMMERCIAL" && (
														<div className="text-xs text-slate-500">
															{client.businessName}
														</div>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													client.clientType === "COMMERCIAL"
														? "secondary"
														: "outline"
												}
												className="rounded-lg"
											>
												{client.clientType === "COMMERCIAL"
													? t("finance.clients.types.commercial")
													: t("finance.clients.types.individual")}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												{client.mobile && (
													<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
														<Smartphone className="h-3 w-3" />
														<span dir="ltr">{client.mobile}</span>
													</div>
												)}
												{client.phone && !client.mobile && (
													<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
														<Phone className="h-3 w-3" />
														<span dir="ltr">{client.phone}</span>
													</div>
												)}
												{client.email && (
													<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
														<Mail className="h-3 w-3" />
														<span dir="ltr">{client.email}</span>
													</div>
												)}
												{!client.phone && !client.mobile && !client.email && (
													<span className="text-slate-400">-</span>
												)}
											</div>
										</TableCell>
										<TableCell className="text-center">
											{client.isActive ? (
												<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
													<CheckCircle className="h-3 w-3" />
													{t("finance.clients.active")}
												</span>
											) : (
												<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
													<XCircle className="h-3 w-3" />
													{t("finance.clients.inactive")}
												</span>
											)}
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="rounded-xl">
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/clients/${client.id}`,
															)
														}
													>
														<Eye className="h-4 w-4 me-2" />
														{t("common.view")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/clients/${client.id}/edit`,
															)
														}
													>
														<Pencil className="h-4 w-4 me-2" />
														{t("common.edit")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() =>
															toggleActiveMutation.mutate({
																id: client.id,
																isActive: !client.isActive,
															})
														}
													>
														{client.isActive ? (
															<>
																<XCircle className="h-4 w-4 me-2" />
																{t("finance.clients.deactivate")}
															</>
														) : (
															<>
																<CheckCircle className="h-4 w-4 me-2" />
																{t("finance.clients.activate")}
															</>
														)}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => setDeleteClientId(client.id)}
														className="text-red-600"
													>
														<Trash2 className="h-4 w-4 me-2" />
														{t("common.delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteClientId}
				onOpenChange={() => setDeleteClientId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.clients.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.clients.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteClientId && deleteMutation.mutate(deleteClientId)}
							disabled={deleteMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending
								? t("common.deleting")
								: t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
