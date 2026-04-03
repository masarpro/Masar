"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Skeleton } from "@ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Pagination } from "@saas/shared/components/Pagination";

const ITEMS_PER_PAGE = 20;

export function AdminLogs() {
	const t = useTranslations();

	const [currentPage, setCurrentPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1),
	);
	const [actionFilter, setActionFilter] = useQueryState(
		"action",
		parseAsString.withDefault(""),
	);

	const { data, isLoading } = useQuery(
		orpc.superAdmin.logs.list.queryOptions({
			input: {
				limit: ITEMS_PER_PAGE,
				offset: (currentPage - 1) * ITEMS_PER_PAGE,
				action: actionFilter || undefined,
			},
		}),
	);

	return (
		<div className="space-y-6">
			<h2 className="font-semibold text-2xl">
				{t("admin.logs.title")}
			</h2>

			<Input
				type="search"
				placeholder={t("admin.logs.filterByAction")}
				value={actionFilter}
				onChange={(e: any) => setActionFilter(e.target.value)}
			/>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("admin.logs.date")}</TableHead>
							<TableHead>{t("admin.logs.admin")}</TableHead>
							<TableHead>{t("admin.logs.action")}</TableHead>
							<TableHead>{t("admin.logs.target")}</TableHead>
							<TableHead>{t("admin.logs.organization")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 5 }).map((_, j) => (
										<TableCell key={j}>
											<Skeleton className="h-4 w-24" />
										</TableCell>
									))}
								</TableRow>
							))
						) : data?.logs.length ? (
							data.logs.map((log: any) => (
								<TableRow key={log.id}>
									<TableCell className="text-sm">
										{new Date(
											log.createdAt,
										).toLocaleString("en-US")}
									</TableCell>
									<TableCell>{log.admin.name}</TableCell>
									<TableCell>
										<code className="rounded bg-muted px-1.5 py-0.5 text-xs">
											{log.action}
										</code>
									</TableCell>
									<TableCell className="text-sm">
										{log.targetType}:{log.targetId.slice(0, 8)}
									</TableCell>
									<TableCell>
										{log.targetOrg?.name ?? "-"}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center"
								>
									{t("admin.logs.noResults")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</Card>

			{!!data?.total && data.total > ITEMS_PER_PAGE && (
				<Pagination
					totalItems={data.total}
					itemsPerPage={ITEMS_PER_PAGE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}
		</div>
	);
}
