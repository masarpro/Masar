"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Plus, Search, Zap, FileEdit, CheckSquare, Send, Filter, X, Download } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting } from "./formatters";
import Link from "next/link";
import { toast } from "sonner";
import { exportJournalEntriesToExcel } from "../../lib/accounting-excel-export";

interface JournalEntriesPageProps {
	organizationId: string;
	organizationSlug: string;
}

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
	DRAFT: { variant: "secondary", label: "مسودة" },
	POSTED: { variant: "default", label: "مرحّل" },
	REVERSED: { variant: "outline", label: "معكوس" },
};

const REF_TYPE_BADGE: Record<string, string> = {
	INVOICE: "فاتورة",
	INVOICE_PAYMENT: "تحصيل",
	EXPENSE: "مصروف",
	TRANSFER: "تحويل",
	SUBCONTRACT_PAYMENT: "مقاول باطن",
	PAYROLL: "رواتب",
	ORG_PAYMENT: "مقبوضات",
	CREDIT_NOTE: "إشعار دائن",
	ADJUSTMENT: "تسوية",
	REVERSAL: "عكس",
	MANUAL: "يدوي",
};

export function JournalEntriesPage({
	organizationId,
	organizationSlug,
}: JournalEntriesPageProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<string>("");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [showFilters, setShowFilters] = useState(false);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [amountFrom, setAmountFrom] = useState("");
	const [amountTo, setAmountTo] = useState("");
	const [accountId, setAccountId] = useState("");
	const [referenceType, setReferenceType] = useState("");
	const basePath = `/app/${organizationSlug}/finance/journal-entries`;

	const { data: accountsList } = useQuery(
		orpc.accounting.accounts.list.queryOptions({
			input: { organizationId },
		}),
	);

	const { data, isLoading } = useQuery(
		orpc.accounting.journal.list.queryOptions({
			input: {
				organizationId,
				status: status as any || undefined,
				search: search || undefined,
				dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
				dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
				amountFrom: amountFrom ? Number(amountFrom) : undefined,
				amountTo: amountTo ? Number(amountTo) : undefined,
				accountId: accountId || undefined,
				referenceType: referenceType || undefined,
				limit: 50,
			},
		}),
	);

	const bulkPostMutation = useMutation(
		orpc.accounting.journal.bulkPost.mutationOptions({
			onSuccess: (result) => {
				queryClient.invalidateQueries({ queryKey: ["orpc", "accounting"] });
				setSelectedIds(new Set());
				if (result.errors.length === 0) {
					toast.success(`تم ترحيل ${result.posted} قيد بنجاح`);
				} else {
					toast.warning(`تم ترحيل ${result.posted} قيد، فشل ${result.errors.length}`);
				}
			},
			onError: () => toast.error("حدث خطأ أثناء الترحيل"),
		}),
	);

	const postAllMutation = useMutation(
		orpc.accounting.journal.postAllDrafts.mutationOptions({
			onSuccess: (result) => {
				queryClient.invalidateQueries({ queryKey: ["orpc", "accounting"] });
				setSelectedIds(new Set());
				if (result.posted === 0) {
					toast.info("لا توجد قيود مسودة للترحيل");
				} else if (result.errors.length === 0) {
					toast.success(`تم ترحيل ${result.posted} قيد بنجاح`);
				} else {
					toast.warning(`تم ترحيل ${result.posted} قيد، فشل ${result.errors.length}`);
				}
			},
			onError: () => toast.error("حدث خطأ أثناء الترحيل"),
		}),
	);

	const entries = data?.entries ?? [];
	const draftEntries = entries.filter((e) => e.status === "DRAFT");

	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const toggleSelectAll = useCallback(() => {
		setSelectedIds((prev) => {
			if (prev.size === draftEntries.length && draftEntries.length > 0) {
				return new Set();
			}
			return new Set(draftEntries.map((e) => e.id));
		});
	}, [draftEntries]);

	if (isLoading) return <DashboardSkeleton />;

	return (
		<div className="space-y-4">
			{/* Filters + Actions */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<div className="relative">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder={t("finance.accounting.search")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="ps-9 rounded-xl w-64"
						/>
					</div>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value)}
						className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm"
					>
						<option value="">{t("finance.accounting.draft")} / {t("finance.accounting.posted")} / {t("finance.accounting.reversed")}</option>
						<option value="DRAFT">{t("finance.accounting.draft")}</option>
						<option value="POSTED">{t("finance.accounting.posted")}</option>
						<option value="REVERSED">{t("finance.accounting.reversed")}</option>
					</select>
					<Button
						variant={showFilters ? "secondary" : "outline"}
						size="sm"
						className="rounded-xl"
						onClick={() => setShowFilters((v) => !v)}
					>
						<Filter className="h-4 w-4 me-1" />
						{t("finance.accounting.advancedFilters")}
					</Button>
				</div>
				<div className="flex gap-2">
					{entries.length > 0 && (
						<Button variant="outline" size="sm" className="rounded-xl" onClick={() => exportJournalEntriesToExcel(entries)}>
							<Download className="h-4 w-4 me-1" />
							Excel
						</Button>
					)}
					{draftEntries.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl text-emerald-600 border-emerald-300 hover:bg-emerald-50"
							onClick={() => postAllMutation.mutate({ organizationId })}
							disabled={postAllMutation.isPending}
						>
							<Send className="h-4 w-4 me-1" />
							{t("finance.accounting.postAllDrafts")}
						</Button>
					)}
					<Link href={`${basePath}/new-adjustment`}>
						<Button size="sm" className="rounded-xl">
							<Plus className="h-4 w-4 me-1" />
							{t("finance.accounting.newEntry")}
						</Button>
					</Link>
					<Link href={`${basePath}/new-adjustment`}>
						<Button variant="outline" size="sm" className="rounded-xl">
							<FileEdit className="h-4 w-4 me-1" />
							{t("finance.accounting.adjustments.newAdjustment")}
						</Button>
					</Link>
				</div>
			</div>

			{/* Advanced Filters */}
			{showFilters && (
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							<div>
								<label className="text-xs text-slate-500 mb-1 block">{t("finance.accounting.ledger.dateFrom")}</label>
								<Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl h-8 text-sm" />
							</div>
							<div>
								<label className="text-xs text-slate-500 mb-1 block">{t("finance.accounting.ledger.dateTo")}</label>
								<Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl h-8 text-sm" />
							</div>
							<div>
								<label className="text-xs text-slate-500 mb-1 block">{t("finance.accounting.amountFrom")}</label>
								<Input type="number" min={0} step={0.01} value={amountFrom} onChange={(e) => setAmountFrom(e.target.value)} className="rounded-xl h-8 text-sm" placeholder="0" />
							</div>
							<div>
								<label className="text-xs text-slate-500 mb-1 block">{t("finance.accounting.amountTo")}</label>
								<Input type="number" min={0} step={0.01} value={amountTo} onChange={(e) => setAmountTo(e.target.value)} className="rounded-xl h-8 text-sm" placeholder="0" />
							</div>
							<div>
								<label className="text-xs text-slate-500 mb-1 block">{t("finance.accounting.selectAccount")}</label>
								<select
									value={accountId}
									onChange={(e) => setAccountId(e.target.value)}
									className="h-8 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 text-sm"
								>
									<option value="">{t("finance.accounting.selectAccount")}</option>
									{(accountsList ?? [])
										.filter((a: any) => a.isPostable)
										.map((a: any) => (
											<option key={a.id} value={a.id}>{a.code} — {a.nameAr}</option>
										))}
								</select>
							</div>
							<div>
								<label className="text-xs text-slate-500 mb-1 block">{t("finance.accounting.reference")}</label>
								<select
									value={referenceType}
									onChange={(e) => setReferenceType(e.target.value)}
									className="h-8 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 text-sm"
								>
									<option value="">الكل</option>
									{Object.entries(REF_TYPE_BADGE).map(([key, label]) => (
										<option key={key} value={key}>{label}</option>
									))}
								</select>
							</div>
							<div className="flex items-end">
								<Button
									variant="ghost"
									size="sm"
									className="rounded-xl text-slate-500"
									onClick={() => {
										setDateFrom(""); setDateTo(""); setAmountFrom(""); setAmountTo("");
										setAccountId(""); setReferenceType(""); setSearch(""); setStatus("");
									}}
								>
									<X className="h-3 w-3 me-1" />
									{t("common.clear")}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Bulk action bar */}
			{selectedIds.size > 0 && (
				<div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
					<CheckSquare className="h-4 w-4 text-emerald-600" />
					<span className="text-sm text-emerald-700 dark:text-emerald-300">
						{selectedIds.size} {t("finance.accounting.selected")}
					</span>
					<Button
						size="sm"
						className="rounded-xl ms-auto"
						onClick={() => bulkPostMutation.mutate({ organizationId, entryIds: Array.from(selectedIds) })}
						disabled={bulkPostMutation.isPending}
					>
						<Send className="h-4 w-4 me-1" />
						{t("finance.accounting.bulkPost")}
					</Button>
				</div>
			)}

			{/* Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{entries.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							{t("finance.accounting.noEntries")}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<input
											type="checkbox"
											checked={selectedIds.size === draftEntries.length && draftEntries.length > 0}
											onChange={toggleSelectAll}
											className="rounded"
										/>
									</TableHead>
									<TableHead>{t("finance.accounting.entryNo")}</TableHead>
									<TableHead>{t("finance.accounting.entryDate")}</TableHead>
									<TableHead>{t("finance.accounting.description")}</TableHead>
									<TableHead>{t("finance.accounting.reference")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.amount")}</TableHead>
									<TableHead className="text-center">{t("finance.accounting.posted")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{entries.map((entry) => {
									const statusInfo = STATUS_BADGE[entry.status] ?? STATUS_BADGE.DRAFT;
									const isDraft = entry.status === "DRAFT";
									return (
										<TableRow key={entry.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
											<TableCell>
												{isDraft ? (
													<input
														type="checkbox"
														checked={selectedIds.has(entry.id)}
														onChange={() => toggleSelect(entry.id)}
														className="rounded"
													/>
												) : (
													<span className="block w-4" />
												)}
											</TableCell>
											<TableCell>
												<Link href={`${basePath}/${entry.id}`} className="font-mono text-sm text-primary hover:underline">
													{entry.entryNo}
												</Link>
											</TableCell>
											<TableCell className="text-sm text-slate-500">
												{new Date(entry.date).toLocaleDateString("en-SA")}
											</TableCell>
											<TableCell className="text-sm max-w-[250px] truncate">
												{entry.isAutoGenerated && (
													<Zap className="h-3 w-3 text-amber-500 inline me-1" />
												)}
												{entry.description}
											</TableCell>
											<TableCell>
												{entry.referenceType && (
													<Badge variant="outline" className="text-[10px]">
														{REF_TYPE_BADGE[entry.referenceType] ?? entry.referenceType}
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-end font-medium">
												{formatAccounting(entry.totalAmount)}
											</TableCell>
											<TableCell className="text-center">
												<Badge variant={statusInfo.variant} className="text-[10px]">
													{statusInfo.label}
												</Badge>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
