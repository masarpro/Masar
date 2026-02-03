"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Plus,
	Search,
	FileText,
	MoreHorizontal,
	Eye,
	Edit,
	Trash2,
	ArrowRightLeft,
	Send,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate } from "../../lib/utils";
import { Currency } from "../shared/Currency";
import { StatusBadge } from "../shared/StatusBadge";

interface QuotationsListProps {
	organizationId: string;
	organizationSlug: string;
}

export function QuotationsList({ organizationId, organizationSlug }: QuotationsListProps) {
	const t = useTranslations();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const basePath = `/app/${organizationSlug}/finance/quotations`;

	const { data, isLoading, refetch } = useQuery(
		orpc.finance.quotations.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? statusFilter as any : undefined,
				query: searchTerm || undefined,
			},
		}),
	);

	const quotations = data?.quotations ?? [];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with gradient */}
			<div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-l from-blue-500/10 via-blue-500/5 to-transparent border border-border/50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
						<FileText className="h-5 w-5 text-blue-500" />
					</div>
					<div>
						<h1 className="text-lg font-bold">{t("finance.quotations.title")}</h1>
						<p className="text-xs text-muted-foreground">{t("finance.quotations.subtitle")}</p>
					</div>
				</div>
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/new`}>
						<Plus className="h-4 w-4 me-2" />
						{t("finance.quotations.create")}
					</Link>
				</Button>
			</div>

			{/* Search and Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t("finance.quotations.searchPlaceholder")}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pr-10 bg-muted/50 border-border rounded-xl"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] bg-muted/50 border-border rounded-xl">
							<SelectValue placeholder={t("finance.quotations.allStatuses")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("finance.quotations.allStatuses")}</SelectItem>
							<SelectItem value="DRAFT">{t("finance.quotations.status.draft")}</SelectItem>
							<SelectItem value="SENT">{t("finance.quotations.status.sent")}</SelectItem>
							<SelectItem value="VIEWED">{t("finance.quotations.status.viewed")}</SelectItem>
							<SelectItem value="ACCEPTED">{t("finance.quotations.status.accepted")}</SelectItem>
							<SelectItem value="REJECTED">{t("finance.quotations.status.rejected")}</SelectItem>
							<SelectItem value="EXPIRED">{t("finance.quotations.status.expired")}</SelectItem>
							<SelectItem value="CONVERTED">{t("finance.quotations.status.converted")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Quotations Table */}
			{quotations.length > 0 ? (
				<div className="rounded-2xl border border-border overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/30">
								<TableHead className="font-medium">{t("finance.quotations.columns.number")}</TableHead>
								<TableHead className="font-medium">{t("finance.quotations.columns.client")}</TableHead>
								<TableHead className="font-medium">{t("finance.quotations.columns.date")}</TableHead>
								<TableHead className="font-medium">{t("finance.quotations.columns.validUntil")}</TableHead>
								<TableHead className="font-medium">{t("finance.quotations.columns.amount")}</TableHead>
								<TableHead className="font-medium">{t("finance.quotations.columns.status")}</TableHead>
								<TableHead className="w-[50px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{quotations.map((quotation) => (
								<TableRow key={quotation.id} className="hover:bg-muted/20">
									<TableCell className="font-medium">
										<Link
											href={`${basePath}/${quotation.id}`}
											className="text-primary hover:underline"
										>
											{quotation.quotationNo}
										</Link>
									</TableCell>
									<TableCell>
										<div>
											<p className="font-medium text-foreground">
												{quotation.clientName}
											</p>
											{quotation.clientCompany && (
												<p className="text-sm text-muted-foreground">
													{quotation.clientCompany}
												</p>
											)}
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(quotation.createdAt)}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(quotation.validUntil)}
									</TableCell>
									<TableCell className="font-semibold">
										<Currency amount={quotation.totalAmount} />
									</TableCell>
									<TableCell>
										<StatusBadge
											status={quotation.status}
											type="quotation"
										/>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="rounded-xl">
												<DropdownMenuItem asChild>
													<Link href={`${basePath}/${quotation.id}/preview`}>
														<Eye className="h-4 w-4 me-2" />
														{t("finance.actions.preview")}
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link href={`${basePath}/${quotation.id}`}>
														<Edit className="h-4 w-4 me-2" />
														{t("finance.actions.edit")}
													</Link>
												</DropdownMenuItem>
												{quotation.status === "DRAFT" && (
													<DropdownMenuItem>
														<Send className="h-4 w-4 me-2" />
														{t("finance.actions.send")}
													</DropdownMenuItem>
												)}
												{(quotation.status === "ACCEPTED" || quotation.status === "SENT") && (
													<DropdownMenuItem>
														<ArrowRightLeft className="h-4 w-4 me-2" />
														{t("finance.actions.convertToInvoice")}
													</DropdownMenuItem>
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem className="text-destructive">
													<Trash2 className="h-4 w-4 me-2" />
													{t("finance.actions.delete")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="p-5 rounded-2xl bg-muted/50 mb-5">
						<FileText className="h-12 w-12 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-medium text-foreground">
						{t("finance.quotations.empty")}
					</h3>
					<p className="text-muted-foreground mt-2 max-w-sm text-sm">
						{t("finance.quotations.emptyDescription")}
					</p>
					<Button asChild className="mt-5 rounded-xl">
						<Link href={`${basePath}/new`}>
							<Plus className="h-4 w-4 me-2" />
							{t("finance.quotations.create")}
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
