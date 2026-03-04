"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { toast } from "sonner";
import { Calendar, Trophy } from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";
import { formatDate } from "@shared/lib/formatters";

interface RFQDetailProps {
	organizationId: string;
	organizationSlug: string;
	rfqId: string;
}

const RFQ_STATUS_COLORS: Record<string, string> = {
	RFQ_DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	RESPONSES_RECEIVED: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
	EVALUATED: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	AWARDED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	RFQ_CANCELLED: "bg-red-100 text-red-500 dark:bg-red-900/50 dark:text-red-400",
};

export function RFQDetail({ organizationId, organizationSlug, rfqId }: RFQDetailProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const { data: rfq, isLoading } = useQuery(
		orpc.procurement.rfq.getById.queryOptions({
			input: { organizationId, rfqId },
		}),
	);

	const awardMutation = useMutation({
		mutationFn: (vendorId: string) =>
			orpcClient.procurement.rfq.award({ organizationId, rfqId, vendorId }),
		onSuccess: () => {
			toast.success(t("procurement.actions.approved"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
		},
		onError: (e: any) => toast.error(e.message),
	});

	if (isLoading || !rfq) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	const canAward = ["RESPONSES_RECEIVED", "EVALUATED"].includes(rfq.status);

	return (
		<div className="space-y-6">
			{/* Header */}
			<Card className="rounded-2xl">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<Badge variant="outline" className="rounded-lg font-mono text-base">{rfq.rfqNumber}</Badge>
								<Badge className={`rounded-lg border-0 ${RFQ_STATUS_COLORS[rfq.status] ?? ""}`}>
									{t(`procurement.rfqStatuses.${rfq.status}`)}
								</Badge>
							</div>
							<CardTitle className="text-xl">{rfq.title}</CardTitle>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.project")}</p>
							<p className="font-medium">{rfq.project?.name ?? "-"}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.responseDeadline")}</p>
							<p className="font-medium flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								{rfq.responseDeadline ? formatDate(new Date(rfq.responseDeadline)) : "-"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.date")}</p>
							<p className="font-medium">{formatDate(new Date(rfq.createdAt))}</p>
						</div>
					</div>
					{rfq.description && (
						<div className="mt-4 p-3 bg-muted rounded-xl text-sm">{rfq.description}</div>
					)}
				</CardContent>
			</Card>

			{/* Items */}
			<Card className="rounded-2xl">
				<CardHeader><CardTitle>{t("procurement.items")}</CardTitle></CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>#</TableHead>
								<TableHead>{t("procurement.itemName")}</TableHead>
								<TableHead>{t("procurement.unit")}</TableHead>
								<TableHead className="text-end">{t("procurement.quantity")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rfq.items?.map((item, index) => (
								<TableRow key={item.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>{item.unit}</TableCell>
									<TableCell className="text-end" dir="ltr">{Number(item.quantity)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Vendor Responses */}
			{rfq.vendorResponses && rfq.vendorResponses.length > 0 && (
				<Card className="rounded-2xl">
					<CardHeader><CardTitle>{t("procurement.vendorResponse")}</CardTitle></CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("procurement.vendor")}</TableHead>
									<TableHead className="text-end">{t("procurement.grandTotal")}</TableHead>
									<TableHead className="text-end">{t("procurement.technicalScore")}</TableHead>
									<TableHead className="text-end">{t("procurement.priceScore")}</TableHead>
									<TableHead>{t("procurement.deliveryDays")}</TableHead>
									<TableHead>{t("procurement.paymentTerms")}</TableHead>
									{canAward && <TableHead className="w-[100px]" />}
								</TableRow>
							</TableHeader>
							<TableBody>
								{rfq.vendorResponses.map((resp) => (
									<TableRow key={resp.id} className={resp.isWinner ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												{resp.isWinner && <Trophy className="h-4 w-4 text-amber-500" />}
												{resp.vendor?.name ?? "-"}
											</div>
										</TableCell>
										<TableCell className="text-end font-semibold">
											<Currency amount={Number(resp.totalPrice)} />
										</TableCell>
										<TableCell className="text-end">{resp.technicalScore ?? "-"}</TableCell>
										<TableCell className="text-end">{resp.priceScore ?? "-"}</TableCell>
										<TableCell>{resp.deliveryDays ?? "-"}</TableCell>
										<TableCell>{resp.paymentTerms ?? "-"}</TableCell>
										{canAward && (
											<TableCell>
												{!resp.isWinner && (
													<Button
														size="sm"
														variant="outline"
														className="rounded-xl text-xs"
														onClick={() => awardMutation.mutate(resp.vendorId)}
														disabled={awardMutation.isPending}
													>
														<Trophy className="me-1 h-3 w-3" />
														{t("procurement.awardVendor")}
													</Button>
												)}
											</TableCell>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
