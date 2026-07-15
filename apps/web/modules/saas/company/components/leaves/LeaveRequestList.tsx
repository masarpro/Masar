"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { EmptyState } from "@ui/components/empty-state";
import { Plus, Check, X, Ban, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@saas/shared/components/Pagination";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";

interface LeaveRequestListProps {
	organizationId: string;
	organizationSlug: string;
}

export function LeaveRequestList({ organizationId, organizationSlug }: LeaveRequestListProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");

	// Create form state
	const [newRequest, setNewRequest] = useState({
		employeeId: "",
		leaveTypeId: "",
		startDate: "",
		endDate: "",
		reason: "",
	});

	const PAGE_SIZE = 20;

	const { data, isLoading } = useQuery(
		orpc.company.leaves.requests.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? (statusFilter as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED") : undefined,
				limit: PAGE_SIZE,
				offset: (currentPage - 1) * PAGE_SIZE,
			},
		}),
	);

	const { data: employees } = useQuery(
		orpc.company.employees.list.queryOptions({
			input: { organizationId, status: "ACTIVE", limit: 200, offset: 0 },
		}),
	);

	const { data: leaveTypes } = useQuery(
		orpc.company.leaves.types.list.queryOptions({
			input: { organizationId },
		}),
	);

	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: orpc.company.leaves.requests.list.queryOptions({ input: { organizationId } }).queryKey });
		queryClient.invalidateQueries({ queryKey: orpc.company.leaves.dashboard.queryOptions({ input: { organizationId } }).queryKey });
	};

	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.leaves.requests.create({
				organizationId,
				...newRequest,
			});
		},
		onSuccess: () => {
			toast.success(t("company.leaves.requests.createSuccess"));
			invalidateAll();
			setShowCreateDialog(false);
			setNewRequest({ employeeId: "", leaveTypeId: "", startDate: "", endDate: "", reason: "" });
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.leaves.requests.createError"));
		},
	});

	const approveMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.company.leaves.requests.approve({ organizationId, id });
		},
		onSuccess: () => {
			toast.success(t("company.leaves.requests.approveSuccess"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const rejectMutation = useMutation({
		mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
			return orpcClient.company.leaves.requests.reject({ organizationId, id, rejectionReason: reason });
		},
		onSuccess: () => {
			toast.success(t("company.leaves.requests.rejectSuccess"));
			invalidateAll();
			setShowRejectDialog(null);
			setRejectionReason("");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.company.leaves.requests.cancel({ organizationId, id });
		},
		onSuccess: () => {
			toast.success(t("company.leaves.requests.cancelSuccess"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return <Badge className="bg-chart-1/15 text-chart-1 border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusPending")}</Badge>;
			case "APPROVED":
				return <Badge className="bg-success/15 text-success border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusApproved")}</Badge>;
			case "REJECTED":
				return <Badge className="bg-destructive/15 text-destructive border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusRejected")}</Badge>;
			case "CANCELLED":
				return <Badge className="bg-muted text-muted-foreground border-0 text-[10px] px-2 py-0.5">{t("company.leaves.statusCancelled")}</Badge>;
			default:
				return null;
		}
	};

	// قائمة إجراءات الصف — مشتركة بين الجدول (ديسكتوب) وبطاقات الجوال
	const renderRowMenu = (req: any) => (
		<div className="flex items-center gap-1 justify-end">
			{req.status === "PENDING" && (
				<>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-xl hover:bg-success/10 h-8 w-8"
						onClick={() => approveMutation.mutate(req.id)}
						title={t("company.leaves.requests.approve")}
					>
						<Check className="h-4 w-4 text-success" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-xl hover:bg-destructive/10 h-8 w-8"
						onClick={() => { setShowRejectDialog(req.id); setRejectionReason(""); }}
						title={t("company.leaves.requests.reject")}
					>
						<X className="h-4 w-4 text-destructive" />
					</Button>
				</>
			)}
			{(req.status === "PENDING" || req.status === "APPROVED") && (
				<Button
					variant="ghost"
					size="icon"
					className="rounded-lg hover:bg-accent h-8 w-8"
					onClick={() => {
						if (confirm(t("company.leaves.requests.confirmCancel"))) {
							cancelMutation.mutate(req.id);
						}
					}}
					title={t("company.leaves.requests.cancel")}
				>
					<Ban className="h-4 w-4 text-muted-foreground" />
				</Button>
			)}
		</div>
	);

	return (
		<div className="space-y-6">
			{/* الجوال: ورقة فلاتر + زر إنشاء مضغوط في صف واحد */}
			<div className="flex items-center justify-between gap-2 sm:hidden">
				<MobileFilterSheet activeCount={statusFilter !== "all" ? 1 : 0}>
					<Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue placeholder={t("company.leaves.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							<SelectItem value="PENDING">{t("company.leaves.statusPending")}</SelectItem>
							<SelectItem value="APPROVED">{t("company.leaves.statusApproved")}</SelectItem>
							<SelectItem value="REJECTED">{t("company.leaves.statusRejected")}</SelectItem>
							<SelectItem value="CANCELLED">{t("company.leaves.statusCancelled")}</SelectItem>
						</SelectContent>
					</Select>
				</MobileFilterSheet>
				<Button
					size="icon"
					aria-label={t("company.leaves.requests.create")}
					onClick={() => setShowCreateDialog(true)}
					className="h-10 w-10 shrink-0 rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="h-5 w-5" />
				</Button>
			</div>

			{/* Header (الديسكتوب كما هو) */}
			<div className="hidden gap-4 sm:flex sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-[160px] rounded-lg border border-input bg-card">
							<SelectValue placeholder={t("company.leaves.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							<SelectItem value="PENDING">{t("company.leaves.statusPending")}</SelectItem>
							<SelectItem value="APPROVED">{t("company.leaves.statusApproved")}</SelectItem>
							<SelectItem value="REJECTED">{t("company.leaves.statusRejected")}</SelectItem>
							<SelectItem value="CANCELLED">{t("company.leaves.statusCancelled")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={() => setShowCreateDialog(true)}
					className="rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="ms-2 h-4 w-4" />
					{t("company.leaves.requests.create")}
				</Button>
			</div>

			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			{(data?.requests?.length ?? 0) > 0 && (
				<MobileDocList className="sm:hidden">
					{data?.requests?.map((req: any) => (
						<MobileDocRow
							key={req.id}
							title={req.employee.name}
							subtitle={
								<>
									{req.leaveType.name}
									{" · "}
									{new Date(req.startDate).toLocaleDateString("ar-SA")}
									{" - "}
									{new Date(req.endDate).toLocaleDateString("ar-SA")}
								</>
							}
							amount={`${req.totalDays} ${t("company.leaves.days")}`}
							badge={getStatusBadge(req.status)}
							actions={renderRowMenu(req)}
						/>
					))}
				</MobileDocList>
			)}

			{/* Table */}
			<div className="hidden sm:block bg-card border-2 rounded-2xl overflow-x-auto">
				<Table className="table-fixed w-full min-w-[800px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.requests.employee")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.requests.leaveType")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.requests.startDate")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.requests.endDate")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.requests.totalDays")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.requests.status")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-b-2">
									{[...Array(7)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : data?.requests?.length ? (
							data.requests.map((req: any, index: any) => (
								<TableRow
									key={req.id}
									className="border-b-2 hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
								>
									<TableCell className="text-end">
										<div>
											<p className="font-medium text-card-foreground">{req.employee.name}</p>
											{req.employee.employeeNo && <p className="text-xs text-muted-foreground">{req.employee.employeeNo}</p>}
										</div>
									</TableCell>
									<TableCell className="text-end">
										<div className="flex items-center gap-2">
											{req.leaveType.color && (
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: req.leaveType.color }} />
											)}
											<span className="text-sm text-card-foreground">{req.leaveType.name}</span>
										</div>
									</TableCell>
									<TableCell className="text-end text-sm text-muted-foreground">
										{new Date(req.startDate).toLocaleDateString("ar-SA")}
									</TableCell>
									<TableCell className="text-end text-sm text-muted-foreground">
										{new Date(req.endDate).toLocaleDateString("ar-SA")}
									</TableCell>
									<TableCell className="text-end text-sm font-semibold text-card-foreground">
										{req.totalDays}
									</TableCell>
									<TableCell className="text-end">{getStatusBadge(req.status)}</TableCell>
									<TableCell className="text-end">
										{renderRowMenu(req)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={7}>
									<EmptyState
										icon={<ClipboardList className="h-10 w-10" />}
										description={t("company.leaves.requests.noRequests")}
									/>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{(data?.total ?? 0) > PAGE_SIZE && (
				<Pagination
					totalItems={data?.total ?? 0}
					itemsPerPage={PAGE_SIZE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}

			{/* Create Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("company.leaves.requests.create")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>{t("company.leaves.requests.employee")}</Label>
							<Select value={newRequest.employeeId} onValueChange={(v: any) => setNewRequest((p) => ({ ...p, employeeId: v }))}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("company.leaves.requests.selectEmployee")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{employees?.employees?.map((emp: any) => (
										<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("company.leaves.requests.leaveType")}</Label>
							<Select value={newRequest.leaveTypeId} onValueChange={(v: any) => setNewRequest((p) => ({ ...p, leaveTypeId: v }))}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("company.leaves.requests.selectLeaveType")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{(leaveTypes as Array<{ id: string; name: string }> | undefined)?.map((lt) => (
										<SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>{t("company.leaves.requests.startDate")}</Label>
								<Input
									type="date"
									className="rounded-xl mt-1"
									value={newRequest.startDate}
									onChange={(e: any) => setNewRequest((p) => ({ ...p, startDate: e.target.value }))}
								/>
							</div>
							<div>
								<Label>{t("company.leaves.requests.endDate")}</Label>
								<Input
									type="date"
									className="rounded-xl mt-1"
									value={newRequest.endDate}
									onChange={(e: any) => setNewRequest((p) => ({ ...p, endDate: e.target.value }))}
								/>
							</div>
						</div>
						<div>
							<Label>{t("company.leaves.requests.reason")}</Label>
							<Textarea
								className="rounded-xl mt-1"
								value={newRequest.reason}
								onChange={(e: any) => setNewRequest((p) => ({ ...p, reason: e.target.value }))}
								placeholder={t("company.leaves.requests.reasonPlaceholder")}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-xl" onClick={() => setShowCreateDialog(false)}>
							{t("common.cancel")}
						</Button>
						<Button
							className="rounded-xl"
							onClick={() => createMutation.mutate()}
							disabled={!newRequest.employeeId || !newRequest.leaveTypeId || !newRequest.startDate || !newRequest.endDate || createMutation.isPending}
						>
							{t("company.leaves.requests.submit")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={!!showRejectDialog} onOpenChange={(open: any) => { if (!open) setShowRejectDialog(null); }}>
				<DialogContent className="rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("company.leaves.requests.rejectTitle")}</DialogTitle>
					</DialogHeader>
					<div>
						<Label>{t("company.leaves.requests.rejectionReason")}</Label>
						<Textarea
							className="rounded-xl mt-1"
							value={rejectionReason}
							onChange={(e: any) => setRejectionReason(e.target.value)}
							placeholder={t("company.leaves.requests.rejectionReasonPlaceholder")}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-xl" onClick={() => setShowRejectDialog(null)}>
							{t("common.cancel")}
						</Button>
						<Button
							variant="error"
							className="rounded-xl"
							onClick={() => {
								if (showRejectDialog) {
									rejectMutation.mutate({ id: showRejectDialog, reason: rejectionReason });
								}
							}}
							disabled={!rejectionReason.trim() || rejectMutation.isPending}
						>
							{t("company.leaves.requests.reject")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
