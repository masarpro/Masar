"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Checkbox } from "@ui/components/checkbox";
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
import { Plus, Pencil, Trash2, Sparkles, Settings } from "lucide-react";
import { toast } from "sonner";

interface LeaveTypeListProps {
	organizationId: string;
	organizationSlug: string;
}

interface LeaveTypeForm {
	name: string;
	nameEn: string;
	daysPerYear: number;
	isPaid: boolean;
	requiresApproval: boolean;
	color: string;
}

const defaultForm: LeaveTypeForm = {
	name: "",
	nameEn: "",
	daysPerYear: 0,
	isPaid: true,
	requiresApproval: true,
	color: "#3b82f6",
};

export function LeaveTypeList({ organizationId, organizationSlug }: LeaveTypeListProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [showDialog, setShowDialog] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<LeaveTypeForm>(defaultForm);

	const { data: leaveTypes, isLoading } = useQuery(
		orpc.company.leaves.types.list.queryOptions({
			input: { organizationId },
		}),
	);

	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: orpc.company.leaves.types.list.queryOptions({ input: { organizationId } }).queryKey });
	};

	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.leaves.types.create({
				organizationId,
				...form,
			});
		},
		onSuccess: () => {
			toast.success(t("company.leaves.types.createSuccess"));
			invalidateAll();
			setShowDialog(false);
			setForm(defaultForm);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!editingId) return;
			return orpcClient.company.leaves.types.update({
				organizationId,
				id: editingId,
				...form,
			});
		},
		onSuccess: () => {
			toast.success(t("company.leaves.types.updateSuccess"));
			invalidateAll();
			setShowDialog(false);
			setEditingId(null);
			setForm(defaultForm);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.company.leaves.types.delete({ organizationId, id });
		},
		onSuccess: () => {
			toast.success(t("company.leaves.types.deleteSuccess"));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const seedMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.leaves.types.seedDefaults({ organizationId });
		},
		onSuccess: (data) => {
			toast.success(t("company.leaves.types.seedSuccess", { count: (data as { created: number }).created }));
			invalidateAll();
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const openCreate = () => {
		setEditingId(null);
		setForm(defaultForm);
		setShowDialog(true);
	};

	const openEdit = (lt: { id: string; name: string; nameEn: string | null; daysPerYear: number; isPaid: boolean; requiresApproval: boolean; color: string | null }) => {
		setEditingId(lt.id);
		setForm({
			name: lt.name,
			nameEn: lt.nameEn || "",
			daysPerYear: lt.daysPerYear,
			isPaid: lt.isPaid,
			requiresApproval: lt.requiresApproval,
			color: lt.color || "#3b82f6",
		});
		setShowDialog(true);
	};

	const types = (leaveTypes as Array<{ id: string; name: string; nameEn: string | null; daysPerYear: number; isPaid: boolean; requiresApproval: boolean; color: string | null }>) ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					{types.length === 0 && (
						<Button
							variant="outline"
							className="rounded-xl"
							onClick={() => seedMutation.mutate()}
							disabled={seedMutation.isPending}
						>
							<Sparkles className="ms-2 h-4 w-4" />
							{t("company.leaves.types.seedDefaults")}
						</Button>
					)}
				</div>
				<Button
					onClick={openCreate}
					className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					<Plus className="ms-2 h-4 w-4" />
					{t("company.leaves.types.create")}
				</Button>
			</div>

			{/* Table */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.leaves.types.name")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.leaves.types.nameEn")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.leaves.types.daysPerYear")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.leaves.types.isPaid")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.leaves.types.requiresApproval")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-white/10 dark:border-slate-700/30">
									{[...Array(6)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : types.length ? (
							types.map((lt, index) => (
								<TableRow
									key={lt.id}
									className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
								>
									<TableCell className="text-end">
										<div className="flex items-center gap-2">
											{lt.color && (
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
											)}
											<span className="font-medium text-slate-900 dark:text-slate-100">{lt.name}</span>
										</div>
									</TableCell>
									<TableCell className="text-end text-sm text-slate-600 dark:text-slate-300">
										{lt.nameEn || "-"}
									</TableCell>
									<TableCell className="text-end text-sm font-semibold text-slate-700 dark:text-slate-300">
										{lt.daysPerYear}
									</TableCell>
									<TableCell className="text-end">
										<Badge className={`border-0 text-[10px] px-2 py-0.5 ${lt.isPaid ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
											{lt.isPaid ? t("company.leaves.types.paid") : t("company.leaves.types.unpaid")}
										</Badge>
									</TableCell>
									<TableCell className="text-end">
										<Badge className={`border-0 text-[10px] px-2 py-0.5 ${lt.requiresApproval ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"}`}>
											{lt.requiresApproval ? t("company.leaves.types.yes") : t("company.leaves.types.no")}
										</Badge>
									</TableCell>
									<TableCell className="text-end">
										<div className="flex items-center gap-1 justify-end">
											<Button
												variant="ghost"
												size="icon"
												className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 h-8 w-8"
												onClick={() => openEdit(lt)}
											>
												<Pencil className="h-4 w-4 text-slate-500" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8"
												onClick={() => {
													if (confirm(t("company.leaves.types.confirmDelete"))) {
														deleteMutation.mutate(lt.id);
													}
												}}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl p-5">
											<Settings className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
											{t("company.leaves.types.noTypes")}
										</p>
										<Button
											variant="outline"
											className="rounded-xl"
											onClick={() => seedMutation.mutate()}
											disabled={seedMutation.isPending}
										>
											<Sparkles className="ms-2 h-4 w-4" />
											{t("company.leaves.types.seedDefaults")}
										</Button>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Create/Edit Dialog */}
			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent className="rounded-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingId ? t("company.leaves.types.edit") : t("company.leaves.types.create")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>{t("company.leaves.types.name")}</Label>
							<Input
								className="rounded-xl mt-1"
								value={form.name}
								onChange={(e: any) => setForm((p) => ({ ...p, name: e.target.value }))}
								placeholder={t("company.leaves.types.namePlaceholder")}
							/>
						</div>
						<div>
							<Label>{t("company.leaves.types.nameEn")}</Label>
							<Input
								className="rounded-xl mt-1"
								value={form.nameEn}
								onChange={(e: any) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
								placeholder={t("company.leaves.types.nameEnPlaceholder")}
								dir="ltr"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>{t("company.leaves.types.daysPerYear")}</Label>
								<Input
									type="number"
									className="rounded-xl mt-1"
									min={0}
									value={form.daysPerYear}
									onChange={(e: any) => setForm((p) => ({ ...p, daysPerYear: Number(e.target.value) }))}
								/>
							</div>
							<div>
								<Label>{t("company.leaves.types.color")}</Label>
								<Input
									type="color"
									className="rounded-xl mt-1 h-10"
									value={form.color}
									onChange={(e: any) => setForm((p) => ({ ...p, color: e.target.value }))}
								/>
							</div>
						</div>
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-2">
								<Checkbox
									id="isPaid"
									checked={form.isPaid}
									onCheckedChange={(checked: any) => setForm((p) => ({ ...p, isPaid: !!checked }))}
								/>
								<Label htmlFor="isPaid">{t("company.leaves.types.isPaid")}</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="requiresApproval"
									checked={form.requiresApproval}
									onCheckedChange={(checked: any) => setForm((p) => ({ ...p, requiresApproval: !!checked }))}
								/>
								<Label htmlFor="requiresApproval">{t("company.leaves.types.requiresApproval")}</Label>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-xl" onClick={() => setShowDialog(false)}>
							{t("common.cancel")}
						</Button>
						<Button
							className="rounded-xl"
							onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
							disabled={!form.name || createMutation.isPending || updateMutation.isPending}
						>
							{editingId ? t("common.save") : t("company.leaves.types.create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
