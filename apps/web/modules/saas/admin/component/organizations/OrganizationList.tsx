"use client";

import { authClient } from "@repo/auth/client";
import { getAdminPath } from "@saas/admin/lib/links";
import { OrganizationLogo } from "@saas/organizations/components/OrganizationLogo";
import { useConfirmationAlert } from "@saas/shared/components/ConfirmationAlertProvider";
import { Pagination } from "@saas/shared/components/Pagination";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Skeleton } from "@ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	BanIcon,
	CheckCircleIcon,
	CrownIcon,
	EditIcon,
	GaugeIcon,
	MoreVerticalIcon,
	PlusIcon,
	RefreshCwIcon,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { withQuery } from "ufo";
import { useDebounceValue } from "usehooks-ts";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { FreeOverrideDialog } from "./FreeOverrideDialog";
import { SuspendOrgDialog } from "./SuspendOrgDialog";
import { UpdateLimitsDialog } from "./UpdateLimitsDialog";

const ITEMS_PER_PAGE = 10;

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "info"> = {
	ACTIVE: "success",
	TRIALING: "info",
	SUSPENDED: "error",
	CANCELLED: "error",
	PAST_DUE: "warning",
};

const PLAN_BADGE: Record<string, "success" | "warning" | "error" | "info"> = {
	FREE: "info",
	PRO: "success",
};

export function OrganizationList() {
	const t = useTranslations();
	const { confirm } = useConfirmationAlert();
	const queryClient = useQueryClient();
	const [currentPage, setCurrentPage] = useQueryState(
		"currentPage",
		parseAsInteger.withDefault(1),
	);
	const [searchTerm, setSearchTerm] = useQueryState(
		"query",
		parseAsString.withDefault(""),
	);
	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsString.withDefault(""),
	);
	const [planFilter, setPlanFilter] = useQueryState(
		"plan",
		parseAsString.withDefault(""),
	);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounceValue(
		searchTerm,
		300,
		{ leading: true, trailing: false },
	);

	// Dialog states
	const [changePlanOrg, setChangePlanOrg] = useState<{
		id: string;
		plan: string;
	} | null>(null);
	const [suspendOrg, setSuspendOrg] = useState<string | null>(null);
	const [freeOverrideOrg, setFreeOverrideOrg] = useState<{
		id: string;
		isFreeOverride: boolean;
	} | null>(null);
	const [updateLimitsOrg, setUpdateLimitsOrg] = useState<{
		id: string;
		maxUsers: number;
		maxProjects: number;
		maxStorage: number;
	} | null>(null);

	const previousSearchTermRef = useRef(debouncedSearchTerm);

	const getPathWithBackToParemeter = (path: string) => {
		const searchParams = new URLSearchParams(window.location.search);
		return withQuery(path, {
			backTo: `${window.location.pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`,
		});
	};

	const getOrganizationEditPath = (id: string) => {
		return getPathWithBackToParemeter(getAdminPath(`/organizations/${id}`));
	};

	useEffect(() => {
		setDebouncedSearchTerm(searchTerm);
	}, [searchTerm]);

	const { data, isLoading } = useQuery(
		orpc.superAdmin.organizations.list.queryOptions({
			input: {
				limit: ITEMS_PER_PAGE,
				offset: (currentPage - 1) * ITEMS_PER_PAGE,
				query: debouncedSearchTerm || undefined,
				status: (statusFilter as any) || undefined,
				plan: (planFilter as any) || undefined,
			},
		}),
	);

	useEffect(() => {
		if (
			previousSearchTermRef.current !== debouncedSearchTerm &&
			previousSearchTermRef.current !== undefined
		) {
			setCurrentPage(1);
		}
		previousSearchTermRef.current = debouncedSearchTerm;
	}, [debouncedSearchTerm, setCurrentPage]);

	const deleteOrganization = async (id: string) => {
		toast.promise(
			async () => {
				const { error } = await authClient.organization.delete({
					organizationId: id,
				});
				if (error) throw error;
			},
			{
				loading: t("admin.organizations.deleteOrganization.deleting"),
				success: () => {
					queryClient.invalidateQueries({
						queryKey:
							orpc.superAdmin.organizations.list.key(),
					});
					return t(
						"admin.organizations.deleteOrganization.deleted",
					);
				},
				error: t(
					"admin.organizations.deleteOrganization.notDeleted",
				),
			},
		);
	};

	const activateOrganization = async (id: string) => {
		toast.promise(
			orpc.superAdmin.organizations.activate.call({
				organizationId: id,
			}),
			{
				loading: t("admin.organizations.activating"),
				success: () => {
					queryClient.invalidateQueries({
						queryKey:
							orpc.superAdmin.organizations.list.key(),
					});
					return t("admin.organizations.activated");
				},
				error: t("admin.organizations.activateFailed"),
			},
		);
	};

	type OrgRow = NonNullable<typeof data>["organizations"][number];

	const columns: ColumnDef<OrgRow>[] = useMemo(
		() => [
			{
				accessorKey: "name",
				header: t("admin.organizations.name"),
				cell: ({
					row: {
						original: { id, name, logo, _count },
					},
				}) => (
					<div className="flex items-center gap-2">
						<OrganizationLogo name={name} logoUrl={logo} />
						<div className="leading-tight">
							<Link
								href={getOrganizationEditPath(id)}
								className="block font-bold"
							>
								{name}
							</Link>
							<small className="text-muted-foreground">
								{_count.members}{" "}
								{t("admin.organizations.members")} &middot;{" "}
								{_count.projects}{" "}
								{t("admin.organizations.projects")}
							</small>
						</div>
					</div>
				),
			},
			{
				accessorKey: "owner",
				header: t("admin.organizations.owner"),
				cell: ({
					row: {
						original: { owner },
					},
				}) =>
					owner ? (
						<div className="text-sm">
							<p className="font-medium">{owner.name}</p>
							<p className="text-muted-foreground text-xs">
								{owner.email}
							</p>
						</div>
					) : (
						<span className="text-muted-foreground">-</span>
					),
			},
			{
				accessorKey: "createdAt",
				header: t("admin.organizations.createdAt"),
				cell: ({
					row: {
						original: { createdAt },
					},
				}) => (
					<span className="text-sm">
						{new Date(createdAt).toLocaleDateString()}
					</span>
				),
			},
			{
				accessorKey: "plan",
				header: t("admin.organizations.planCol"),
				cell: ({
					row: {
						original: { plan, isFreeOverride },
					},
				}) => (
					<div className="flex items-center gap-1">
						<Badge status={PLAN_BADGE[plan] ?? "info"}>
							{plan}
						</Badge>
						{isFreeOverride && (
							<CrownIcon className="size-3 text-amber-500" />
						)}
					</div>
				),
			},
			{
				accessorKey: "status",
				header: t("admin.organizations.statusCol"),
				cell: ({
					row: {
						original: { status },
					},
				}) => (
					<Badge status={STATUS_BADGE[status] ?? "info"}>
						{status}
					</Badge>
				),
			},
			{
				accessorKey: "lastPaymentAmount",
				header: t("admin.organizations.lastPayment"),
				cell: ({
					row: {
						original: { lastPaymentAmount, lastPaymentAt },
					},
				}) =>
					lastPaymentAmount ? (
						<div className="text-sm">
							<p>{Number(lastPaymentAmount).toLocaleString("en-US")} SAR</p>
							{lastPaymentAt && (
								<p className="text-muted-foreground text-xs">
									{new Date(
										lastPaymentAt,
									).toLocaleDateString()}
								</p>
							)}
						</div>
					) : (
						<span className="text-muted-foreground">-</span>
					),
			},
			{
				accessorKey: "actions",
				header: "",
				cell: ({ row: { original: org } }) => {
					return (
						<div className="flex flex-row justify-end gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="ghost">
										<MoreVerticalIcon className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem asChild>
										<Link
											href={getOrganizationEditPath(
												org.id,
											)}
											className="flex items-center"
										>
											<EditIcon className="me-2 size-4" />
											{t("admin.organizations.edit")}
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											setChangePlanOrg({
												id: org.id,
												plan: org.plan,
											})
										}
									>
										<RefreshCwIcon className="me-2 size-4" />
										{t("admin.organizations.changePlan")}
									</DropdownMenuItem>
									{org.status !== "SUSPENDED" ? (
										<DropdownMenuItem
											onClick={() =>
												setSuspendOrg(org.id)
											}
										>
											<BanIcon className="me-2 size-4" />
											{t("admin.organizations.suspend")}
										</DropdownMenuItem>
									) : (
										<DropdownMenuItem
											onClick={() =>
												activateOrganization(org.id)
											}
										>
											<CheckCircleIcon className="me-2 size-4" />
											{t("admin.organizations.activate")}
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										onClick={() =>
											setFreeOverrideOrg({
												id: org.id,
												isFreeOverride:
													org.isFreeOverride,
											})
										}
									>
										<CrownIcon className="me-2 size-4" />
										{t(
											"admin.organizations.freeOverride",
										)}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											setUpdateLimitsOrg({
												id: org.id,
												maxUsers: org.maxUsers,
												maxProjects: org.maxProjects,
												maxStorage: 1,
											})
										}
									>
										<GaugeIcon className="me-2 size-4" />
										{t(
											"admin.organizations.updateLimits",
										)}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											confirm({
												title: t(
													"admin.organizations.confirmDelete.title",
												),
												message: t(
													"admin.organizations.confirmDelete.message",
												),
												confirmLabel: t(
													"admin.organizations.confirmDelete.confirm",
												),
												destructive: true,
												onConfirm: () =>
													deleteOrganization(
														org.id,
													),
											})
										}
									>
										<span className="flex items-center text-destructive hover:text-destructive">
											<TrashIcon className="me-2 size-4" />
											{t("admin.organizations.delete")}
										</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[],
	);

	const organizations = useMemo(
		() => data?.organizations ?? [],
		[data?.organizations],
	);

	const table = useReactTable({
		data: organizations,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
	});

	return (
		<>
			<Card className="p-6">
				<div className="mb-4 flex items-center justify-between gap-6">
					<h2 className="font-semibold text-2xl">
						{t("admin.organizations.title")}
					</h2>
					<Button asChild>
						<Link href={getAdminPath("/organizations/new")}>
							<PlusIcon className="me-1.5 size-4" />
							{t("admin.organizations.create")}
						</Link>
					</Button>
				</div>

				<div className="mb-4 flex flex-wrap gap-2">
					<Input
						type="search"
						placeholder={t("admin.organizations.search")}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-xs"
					/>
					<Select
						value={statusFilter || "all"}
						onValueChange={(v) =>
							setStatusFilter(v === "all" ? "" : v)
						}
					>
						<SelectTrigger className="w-40">
							<SelectValue
								placeholder={t(
									"admin.organizations.filterStatus",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("admin.organizations.allStatuses")}
							</SelectItem>
							<SelectItem value="ACTIVE">Active</SelectItem>
							<SelectItem value="TRIALING">Trialing</SelectItem>
							<SelectItem value="SUSPENDED">
								Suspended
							</SelectItem>
							<SelectItem value="PAST_DUE">Past Due</SelectItem>
							<SelectItem value="CANCELLED">
								Cancelled
							</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={planFilter || "all"}
						onValueChange={(v) =>
							setPlanFilter(v === "all" ? "" : v)
						}
					>
						<SelectTrigger className="w-40">
							<SelectValue
								placeholder={t(
									"admin.organizations.filterPlan",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("admin.organizations.allPlans")}
							</SelectItem>
							<SelectItem value="FREE">Free</SelectItem>
							<SelectItem value="PRO">Pro</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								{table
									.getHeaderGroups()
									.map((headerGroup) =>
										headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
												{flexRender(
													header.column.columnDef
														.header,
													header.getContext(),
												)}
											</TableHead>
										)),
									)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: ITEMS_PER_PAGE }).map(
									(_, index) => (
										<TableRow key={`skeleton-${index}`}>
											<TableCell className="py-2">
												<div className="flex items-center gap-2">
													<Skeleton className="size-10 rounded-md" />
													<div className="flex-1 space-y-2">
														<Skeleton className="h-4 w-32" />
														<Skeleton className="h-3 w-24" />
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Skeleton className="h-5 w-16" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-5 w-16" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-4 w-20" />
											</TableCell>
											<TableCell>
												<Skeleton className="size-9 rounded-md" />
											</TableCell>
										</TableRow>
									),
								)
							) : table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id} className="group">
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className="py-2"
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										<p>No results.</p>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{!!data?.total && data.total > ITEMS_PER_PAGE && (
					<Pagination
						className="mt-4"
						totalItems={data.total}
						itemsPerPage={ITEMS_PER_PAGE}
						currentPage={currentPage}
						onChangeCurrentPage={setCurrentPage}
					/>
				)}
			</Card>

			{changePlanOrg && (
				<ChangePlanDialog
					open={!!changePlanOrg}
					onOpenChange={(open) => !open && setChangePlanOrg(null)}
					organizationId={changePlanOrg.id}
					currentPlan={changePlanOrg.plan}
				/>
			)}
			{suspendOrg && (
				<SuspendOrgDialog
					open={!!suspendOrg}
					onOpenChange={(open) => !open && setSuspendOrg(null)}
					organizationId={suspendOrg}
				/>
			)}
			{freeOverrideOrg && (
				<FreeOverrideDialog
					open={!!freeOverrideOrg}
					onOpenChange={(open) =>
						!open && setFreeOverrideOrg(null)
					}
					organizationId={freeOverrideOrg.id}
					currentOverride={freeOverrideOrg.isFreeOverride}
				/>
			)}
			{updateLimitsOrg && (
				<UpdateLimitsDialog
					open={!!updateLimitsOrg}
					onOpenChange={(open) =>
						!open && setUpdateLimitsOrg(null)
					}
					organizationId={updateLimitsOrg.id}
					currentLimits={updateLimitsOrg}
				/>
			)}
		</>
	);
}
