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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
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
import { toast } from "sonner";
import {
	Search,
	Plus,
	MoreVertical,
	Eye,
	Pencil,
	Trash2,
	Building2,
	Phone,
	Mail,
} from "lucide-react";

interface VendorListProps {
	organizationId: string;
	organizationSlug: string;
}

const VENDOR_TYPE_COLORS: Record<string, string> = {
	SUPPLIER: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	SUBCONTRACTOR_VENDOR: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400",
	EQUIPMENT_VENDOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	SERVICE_VENDOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
};

export function VendorList({ organizationId, organizationSlug }: VendorListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
	const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);

	const basePath = `/app/${organizationSlug}/procurement/vendors`;

	const { data, isLoading } = useQuery(
		orpc.procurement.vendors.list.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				type: typeFilter as any,
			},
		}),
	);

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.procurement.vendors.delete({ organizationId, vendorId: id });
		},
		onSuccess: () => {
			toast.success(t("procurement.vendorDeleted"));
			setDeleteVendorId(null);
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	const vendors = data ?? [];

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative flex-1 max-w-xs">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("procurement.search")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="ps-10 rounded-xl"
						/>
					</div>
					<Select
						value={typeFilter || "all"}
						onValueChange={(v) => setTypeFilter(v === "all" ? undefined : v)}
					>
						<SelectTrigger className="w-48 rounded-xl">
							<SelectValue placeholder={t("procurement.vendorType")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("procurement.allStatuses")}</SelectItem>
							<SelectItem value="SUPPLIER">{t("procurement.vendorTypes.SUPPLIER")}</SelectItem>
							<SelectItem value="SUBCONTRACTOR_VENDOR">{t("procurement.vendorTypes.SUBCONTRACTOR_VENDOR")}</SelectItem>
							<SelectItem value="EQUIPMENT_VENDOR">{t("procurement.vendorTypes.EQUIPMENT_VENDOR")}</SelectItem>
							<SelectItem value="SERVICE_VENDOR">{t("procurement.vendorTypes.SERVICE_VENDOR")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button className="rounded-xl" onClick={() => router.push(`${basePath}/new`)}>
					<Plus className="me-2 h-4 w-4" />
					{t("procurement.addVendor")}
				</Button>
			</div>

			{/* Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="relative">
								<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
								<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						</div>
					) : vendors.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 rounded-2xl bg-muted p-4">
								<Building2 className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="mb-4 text-muted-foreground">{t("procurement.noVendors")}</p>
							<Button className="rounded-xl" onClick={() => router.push(`${basePath}/new`)}>
								<Plus className="me-2 h-4 w-4" />
								{t("procurement.addVendor")}
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("procurement.vendorCode")}</TableHead>
									<TableHead>{t("procurement.vendorName")}</TableHead>
									<TableHead>{t("procurement.vendorType")}</TableHead>
									<TableHead>{t("procurement.contactPerson")}</TableHead>
									<TableHead>{t("procurement.phone")}</TableHead>
									<TableHead>{t("procurement.rating")}</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{vendors.map((vendor) => (
									<TableRow
										key={vendor.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => router.push(`${basePath}/${vendor.id}`)}
									>
										<TableCell>
											<Badge variant="outline" className="rounded-lg font-mono">
												{vendor.code}
											</Badge>
										</TableCell>
										<TableCell className="font-medium">{vendor.name}</TableCell>
										<TableCell>
											<Badge className={`rounded-lg border-0 ${VENDOR_TYPE_COLORS[vendor.type] ?? ""}`}>
												{t(`procurement.vendorTypes.${vendor.type}`)}
											</Badge>
										</TableCell>
										<TableCell>{vendor.contactPerson ?? "-"}</TableCell>
										<TableCell>
											{vendor.phone ? (
												<span className="flex items-center gap-1 text-sm">
													<Phone className="h-3 w-3" />
													<span dir="ltr">{vendor.phone}</span>
												</span>
											) : "-"}
										</TableCell>
										<TableCell>
											{vendor.rating ? `${Number(vendor.rating)}/5` : "-"}
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="rounded-xl">
													<DropdownMenuItem onClick={() => router.push(`${basePath}/${vendor.id}`)}>
														<Eye className="h-4 w-4 me-2" />
														{t("common.view")}
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => router.push(`${basePath}/${vendor.id}/edit`)}>
														<Pencil className="h-4 w-4 me-2" />
														{t("common.edit")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => setDeleteVendorId(vendor.id)}
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

			{/* Delete confirmation */}
			<AlertDialog open={!!deleteVendorId} onOpenChange={() => setDeleteVendorId(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
						<AlertDialogDescription>{t("procurement.actions.confirmCancel")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteVendorId && deleteMutation.mutate(deleteVendorId)}
							disabled={deleteMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
