"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useState } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
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
	AlertTriangle,
	CalendarCheck,
	TrendingUp,
	TrendingDown,
	DollarSign,
	RotateCcw,
	Loader2,
	Eye,
	Play,
	History,
} from "lucide-react";
import { formatAccounting } from "./formatters";

interface YearEndClosingPageProps {
	organizationId: string;
	organizationSlug: string;
}

export function YearEndClosingPage({
	organizationId,
	organizationSlug,
}: YearEndClosingPageProps) {
	const t = useTranslations("finance.yearEnd");
	const tCommon = useTranslations();
	const queryClient = useQueryClient();

	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState<number>(currentYear);
	const [showExecuteDialog, setShowExecuteDialog] = useState(false);
	const [showReverseDialog, setShowReverseDialog] = useState(false);
	const [reverseYear, setReverseYear] = useState<number | null>(null);
	// تأكيد مكتوب (نمط GitHub): يجب كتابة رقم السنة لتفعيل زر الإقفال
	const [executeConfirmText, setExecuteConfirmText] = useState("");
	const executeConfirmed = executeConfirmText.trim() === String(selectedYear);

	// Years range: current year - 5 to current year
	const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i).reverse();

	// Preview query — manual trigger via refetch
	const previewQuery = useQuery({
		...orpc.accounting.yearEnd.preview.queryOptions({
			input: { organizationId, fiscalYear: selectedYear },
		}),
		enabled: false,
	});

	// History query — auto-fetch
	const historyQuery = useQuery(
		orpc.accounting.yearEnd.history.queryOptions({
			input: { organizationId },
		}),
	);

	// Execute mutation
	const executeMutation = useMutation({
		...orpc.accounting.yearEnd.execute.mutationOptions(),
		onSuccess: () => {
			toast.success(t("executeSuccess"));
			setShowExecuteDialog(false);
			queryClient.invalidateQueries({ queryKey: orpc.accounting.key() });
			previewQuery.refetch();
			historyQuery.refetch();
		},
		onError: (error: Error) => {
			toast.error(error.message || t("executeFailed"));
		},
	});

	// Reverse mutation
	const reverseMutation = useMutation({
		...orpc.accounting.yearEnd.reverse.mutationOptions(),
		onSuccess: () => {
			toast.success(t("reverseSuccess"));
			setShowReverseDialog(false);
			setReverseYear(null);
			queryClient.invalidateQueries({ queryKey: orpc.accounting.key() });
			historyQuery.refetch();
		},
		onError: (error: Error) => {
			toast.error(error.message || t("reverseFailed"));
		},
	});

	const preview = previewQuery.data;

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">
					{t("title")}
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					{t("subtitle")}
				</p>
			</div>

			{/* Year Selector + Preview Button */}
			<Card className="rounded-2xl border-2 shadow-none">
				<CardContent className="p-4">
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-foreground">
								{t("fiscalYear")}
							</label>
							<Select
								value={String(selectedYear)}
								onValueChange={(val) => setSelectedYear(Number(val))}
							>
								<SelectTrigger className="w-[140px] rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{years.map((year) => (
										<SelectItem key={year} value={String(year)}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl"
							onClick={() => previewQuery.refetch()}
							disabled={previewQuery.isFetching}
						>
							{previewQuery.isFetching ? (
								<Loader2 className="h-4 w-4 me-1 animate-spin" />
							) : (
								<Eye className="h-4 w-4 me-1" />
							)}
							{t("preview")}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Preview Results */}
			{preview && (
				<>
					{/* KPI Cards */}
					<div className="grid gap-3 sm:grid-cols-3">
						{/* Total Revenue */}
						<Card className="rounded-2xl border-2 shadow-none">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs text-muted-foreground">{t("totalRevenue")}</p>
										<p className="text-lg font-bold text-success mt-1">
											{formatAccounting(preview.totalRevenue)}
										</p>
									</div>
									<div className="p-2.5 bg-success/15 rounded-xl">
										<TrendingUp className="h-5 w-5 text-success" />
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Total Expenses */}
						<Card className="rounded-2xl border-2 shadow-none">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs text-muted-foreground">{t("totalExpenses")}</p>
										<p className="text-lg font-bold text-destructive mt-1">
											{formatAccounting(preview.totalExpenses)}
										</p>
									</div>
									<div className="p-2.5 bg-destructive/15 rounded-xl">
										<TrendingDown className="h-5 w-5 text-destructive" />
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Net Profit */}
						<Card className="rounded-2xl border-2 shadow-none">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs text-muted-foreground">{t("netProfit")}</p>
										<p
											className={`text-lg font-bold mt-1 ${
												preview.netProfit >= 0
													? "text-success"
													: "text-destructive"
											}`}
										>
											{formatAccounting(preview.netProfit)}
										</p>
									</div>
									<div
										className={`p-2.5 rounded-xl ${
											preview.netProfit >= 0
												? "bg-success/15"
												: "bg-destructive/15"
										}`}
									>
										<DollarSign
											className={`h-5 w-5 ${
												preview.netProfit >= 0
													? "text-success"
													: "text-destructive"
											}`}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Profit Distribution Table */}
					{preview.profitDistribution.length > 0 && (
						<Card className="rounded-2xl border-2 shadow-none">
							<CardHeader className="pb-3">
								<CardTitle className="text-base">
									{t("profitDistribution")}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-start">{t("ownerName")}</TableHead>
												<TableHead className="text-end">{t("ownershipPercent")}</TableHead>
												<TableHead className="text-end">{t("shareOfProfit")}</TableHead>
												<TableHead className="text-end">{t("drawings")}</TableHead>
												<TableHead className="text-end">{t("netToRetained")}</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{preview.profitDistribution.map((row) => (
												<TableRow key={row.ownerId}>
													<TableCell className="font-medium text-start">
														{row.ownerName}
													</TableCell>
													<TableCell className="text-end">
														{row.ownershipPercent}%
													</TableCell>
													<TableCell className="text-end">
														{formatAccounting(row.shareOfProfit)}
													</TableCell>
													<TableCell className="text-end text-destructive">
														{formatAccounting(row.drawings)}
													</TableCell>
													<TableCell
														className={`text-end font-medium ${
															row.netToRetained >= 0
																? "text-success"
																: "text-destructive"
														}`}
													>
														{formatAccounting(row.netToRetained)}
													</TableCell>
												</TableRow>
											))}
											{/* Total Drawings Row */}
											<TableRow className="border-t-2 font-semibold">
												<TableCell colSpan={3} className="text-start">
													{t("totalDrawings")}
												</TableCell>
												<TableCell className="text-end text-destructive">
													{formatAccounting(preview.totalDrawings)}
												</TableCell>
												<TableCell />
											</TableRow>
											{/* Retained Earnings Transfer */}
											<TableRow className="font-semibold bg-muted">
												<TableCell colSpan={4} className="text-start">
													{t("retainedEarningsTransfer")}
												</TableCell>
												<TableCell
													className={`text-end ${
														preview.retainedEarningsTransfer >= 0
															? "text-success"
															: "text-destructive"
													}`}
												>
													{formatAccounting(preview.retainedEarningsTransfer)}
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Warnings */}
					{preview.warnings.length > 0 && (
						<div className="space-y-2">
							{preview.warnings.map((warning: any, idx: number) => {
								const severity: string = typeof warning === "string" ? "WARNING" : warning.severity;
								const message = typeof warning === "string" ? warning : warning.message;
								const colorMap: Record<string, string> = {
									INFO: "bg-chart-4/10 border-chart-4/30 text-chart-4",
									WARNING: "bg-chart-1/10 border-chart-1/30 text-chart-1",
									ERROR: "bg-destructive/10 border-destructive/30 text-destructive",
								};
								const colors = colorMap[severity] ?? "bg-chart-1/10 border-chart-1/30 text-chart-1";
								return (
									<div
										key={idx}
										className={`flex items-center gap-2 p-3 rounded-xl border ${colors}`}
									>
										<AlertTriangle className="h-4 w-4 flex-shrink-0" />
										<span className="text-sm">{message}</span>
									</div>
								);
							})}
						</div>
					)}

					{/* Execute Button */}
					{!preview.isAlreadyClosed && (
						<div className="flex justify-end">
							<Button
								variant="error"
								className="rounded-xl"
								onClick={() => setShowExecuteDialog(true)}
								disabled={executeMutation.isPending}
							>
								{executeMutation.isPending ? (
									<Loader2 className="h-4 w-4 me-1 animate-spin" />
								) : (
									<Play className="h-4 w-4 me-1" />
								)}
								{t("executeClosing")}
							</Button>
						</div>
					)}

					{preview.isAlreadyClosed && (
						<div className="flex items-center gap-2 p-3 bg-success/10 rounded-xl border border-success/30">
							<CalendarCheck className="h-4 w-4 text-success flex-shrink-0" />
							<span className="text-sm text-success">
								{t("alreadyClosed")}
							</span>
						</div>
					)}
				</>
			)}

			{/* History Section */}
			<Card className="rounded-2xl border-2 shadow-none">
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center gap-2">
						<History className="h-5 w-5" />
						{t("history")}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{historyQuery.isLoading ? (
						<div className="p-6 text-center text-sm text-muted-foreground">
							<Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
						</div>
					) : !historyQuery.data || historyQuery.data.length === 0 ? (
						<div className="p-6 text-center text-sm text-muted-foreground">
							{t("noHistory")}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-start">{t("fiscalYear")}</TableHead>
										<TableHead className="text-start">{t("closingDate")}</TableHead>
										<TableHead className="text-end">{t("netProfit")}</TableHead>
										<TableHead className="text-end">{t("totalDrawings")}</TableHead>
										<TableHead className="text-end">{t("retainedEarningsTransfer")}</TableHead>
										<TableHead className="text-start">{t("status")}</TableHead>
										<TableHead className="text-start">{t("createdBy")}</TableHead>
										<TableHead className="text-start">{t("actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{historyQuery.data.map((closing) => (
										<TableRow key={closing.id}>
											<TableCell className="text-start font-medium">
												{closing.fiscalYear}
											</TableCell>
											<TableCell className="text-start">
												{new Date(closing.closingDate).toLocaleDateString("en-SA")}
											</TableCell>
											<TableCell
												className={`text-end ${
													closing.netProfit >= 0
														? "text-success"
														: "text-destructive"
												}`}
											>
												{formatAccounting(closing.netProfit)}
											</TableCell>
											<TableCell className="text-end text-destructive">
												{formatAccounting(closing.totalDrawings)}
											</TableCell>
											<TableCell
												className={`text-end ${
													closing.retainedEarningsTransfer >= 0
														? "text-success"
														: "text-destructive"
												}`}
											>
												{formatAccounting(closing.retainedEarningsTransfer)}
											</TableCell>
											<TableCell className="text-start">
												<Badge
													variant={
														closing.status === "COMPLETED"
															? "default"
															: "destructive"
													}
													className={
														closing.status === "COMPLETED"
															? "bg-success/15 text-success hover:bg-success/15"
															: ""
													}
												>
													{closing.status === "COMPLETED"
														? t("statusCompleted")
														: t("statusReversed")}
												</Badge>
											</TableCell>
											<TableCell className="text-start">
												{closing.createdBy?.name ?? "-"}
											</TableCell>
											<TableCell className="text-start">
												{closing.status === "COMPLETED" && (
													<Button
														variant="ghost"
														size="sm"
														className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
														onClick={() => {
															setReverseYear(closing.fiscalYear);
															setShowReverseDialog(true);
														}}
														disabled={reverseMutation.isPending}
													>
														<RotateCcw className="h-4 w-4 me-1" />
														{t("reverse")}
													</Button>
												)}
												{closing.status === "REVERSED" && closing.reversedBy && (
													<span className="text-xs text-muted-foreground">
														{t("reversedBy")}: {closing.reversedBy.name}
													</span>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Execute Confirmation Dialog */}
			<AlertDialog
				open={showExecuteDialog}
				onOpenChange={(open) => {
					setShowExecuteDialog(open);
					if (!open) setExecuteConfirmText("");
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("executeDialogTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("executeDialogDescription", { year: selectedYear })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">
							{t("typeYearToConfirm", { year: selectedYear })}
						</p>
						<Input
							value={executeConfirmText}
							onChange={(e) => setExecuteConfirmText(e.target.value)}
							placeholder={String(selectedYear)}
							dir="ltr"
							className="rounded-xl tabular-nums"
							autoComplete="off"
						/>
					</div>
					<AlertDialogFooter className="flex gap-2">
						<AlertDialogCancel className="rounded-xl">
							{tCommon("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
							onClick={() =>
								executeMutation.mutate({
									organizationId,
									fiscalYear: selectedYear,
								})
							}
							disabled={executeMutation.isPending || !executeConfirmed}
						>
							{executeMutation.isPending ? (
								<Loader2 className="h-4 w-4 me-1 animate-spin" />
							) : (
								<Play className="h-4 w-4 me-1" />
							)}
							{t("confirmExecute")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reverse Confirmation Dialog */}
			<AlertDialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("reverseDialogTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("reverseDialogDescription", { year: reverseYear ?? 0 })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex gap-2">
						<AlertDialogCancel className="rounded-xl">
							{tCommon("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
							onClick={() => {
								if (reverseYear) {
									reverseMutation.mutate({
										organizationId,
										fiscalYear: reverseYear,
									});
								}
							}}
							disabled={reverseMutation.isPending}
						>
							{reverseMutation.isPending ? (
								<Loader2 className="h-4 w-4 me-1 animate-spin" />
							) : (
								<RotateCcw className="h-4 w-4 me-1" />
							)}
							{t("confirmReverse")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
