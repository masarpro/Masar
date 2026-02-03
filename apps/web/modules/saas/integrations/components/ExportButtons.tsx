"use client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	DownloadIcon,
	FileTextIcon,
	TableIcon,
	CalendarIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ExportButtonsProps {
	projectId: string;
}

export function ExportButtons({ projectId }: ExportButtonsProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();

	const downloadFile = (
		content: string,
		filename: string,
		mimeType: string,
	) => {
		const decoded = atob(content);
		const blob = new Blob([decoded], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const exportExpensesCsv = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.exports.exportExpensesCsv({
				organizationId: activeOrganization.id,
				projectId,
			});
		},
		onSuccess: (result) => {
			downloadFile(result.content, result.filename, result.mimeType);
			toast.success(t("exports.downloaded", { count: result.rowCount }));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const exportClaimsCsv = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.exports.exportClaimsCsv({
				organizationId: activeOrganization.id,
				projectId,
			});
		},
		onSuccess: (result) => {
			downloadFile(result.content, result.filename, result.mimeType);
			toast.success(t("exports.downloaded", { count: result.rowCount }));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const exportIssuesCsv = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.exports.exportIssuesCsv({
				organizationId: activeOrganization.id,
				projectId,
			});
		},
		onSuccess: (result) => {
			downloadFile(result.content, result.filename, result.mimeType);
			toast.success(t("exports.downloaded", { count: result.rowCount }));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const exportCalendarIcs = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.exports.generateCalendarICS({
				organizationId: activeOrganization.id,
				projectId,
				includePayments: true,
				includeMilestones: true,
				includeClaims: true,
			});
		},
		onSuccess: (result) => {
			downloadFile(result.content, result.filename, result.mimeType);
			toast.success(t("exports.calendarDownloaded", { count: result.eventCount }));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const exportWeeklyReport = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			const now = new Date();
			const weekStart = new Date(now);
			weekStart.setDate(now.getDate() - now.getDay());
			weekStart.setHours(0, 0, 0, 0);
			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekStart.getDate() + 6);
			weekEnd.setHours(23, 59, 59, 999);

			return apiClient.exports.generateWeeklyReport({
				organizationId: activeOrganization.id,
				projectId,
				weekStart: weekStart.toISOString(),
				weekEnd: weekEnd.toISOString(),
			});
		},
		onSuccess: (result) => {
			downloadFile(result.content, result.filename, result.mimeType);
			toast.success(t("exports.reportDownloaded"));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const isLoading =
		exportExpensesCsv.isPending ||
		exportClaimsCsv.isPending ||
		exportIssuesCsv.isPending ||
		exportCalendarIcs.isPending ||
		exportWeeklyReport.isPending;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" disabled={isLoading}>
					<DownloadIcon className="h-4 w-4 mr-2" />
					{t("exports.title")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem onClick={() => exportWeeklyReport.mutate()}>
					<FileTextIcon className="h-4 w-4 mr-2" />
					{t("exports.weeklyReport")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => exportExpensesCsv.mutate()}>
					<TableIcon className="h-4 w-4 mr-2" />
					{t("exports.expensesCsv")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => exportClaimsCsv.mutate()}>
					<TableIcon className="h-4 w-4 mr-2" />
					{t("exports.claimsCsv")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => exportIssuesCsv.mutate()}>
					<TableIcon className="h-4 w-4 mr-2" />
					{t("exports.issuesCsv")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => exportCalendarIcs.mutate()}>
					<CalendarIcon className="h-4 w-4 mr-2" />
					{t("exports.calendarIcs")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
