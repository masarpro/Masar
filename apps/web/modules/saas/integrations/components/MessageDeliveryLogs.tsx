"use client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Card } from "@ui/components/card";
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
import { Button } from "@ui/components/button";
import {
	MailIcon,
	MessageSquareIcon,
	PhoneIcon,
	CheckCircleIcon,
	XCircleIcon,
	ClockIcon,
	AlertCircleIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface MessageDeliveryLogsProps {
	projectId?: string;
}

export function MessageDeliveryLogs({ projectId }: MessageDeliveryLogsProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const [channel, setChannel] = useState<string>("ALL");
	const [status, setStatus] = useState<string>("ALL");
	const [page, setPage] = useState(0);
	const limit = 20;

	const { data, isLoading } = useQuery({
		queryKey: [
			"delivery-logs",
			activeOrganization?.id,
			projectId,
			channel,
			status,
			page,
		],
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.integrations.getDeliveryLogs({
				organizationId: activeOrganization.id,
				projectId,
				channel: channel !== "ALL" ? (channel as "EMAIL" | "WHATSAPP" | "SMS") : undefined,
				status: status !== "ALL" ? (status as "PENDING" | "SENT" | "FAILED" | "SKIPPED") : undefined,
				limit,
				offset: page * limit,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	const getChannelIcon = (ch: string) => {
		switch (ch) {
			case "EMAIL":
				return <MailIcon className="h-4 w-4" />;
			case "WHATSAPP":
				return <MessageSquareIcon className="h-4 w-4" />;
			case "SMS":
				return <PhoneIcon className="h-4 w-4" />;
			default:
				return null;
		}
	};

	const getStatusIcon = (st: string) => {
		switch (st) {
			case "SENT":
				return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
			case "FAILED":
				return <XCircleIcon className="h-4 w-4 text-red-500" />;
			case "PENDING":
				return <ClockIcon className="h-4 w-4 text-yellow-500" />;
			case "SKIPPED":
				return <AlertCircleIcon className="h-4 w-4 text-gray-500" />;
			default:
				return null;
		}
	};

	const getStatusVariant = (st: string) => {
		switch (st) {
			case "SENT":
				return "default" as const;
			case "FAILED":
				return "destructive" as const;
			case "PENDING":
				return "secondary" as const;
			case "SKIPPED":
				return "outline" as const;
			default:
				return "secondary" as const;
		}
	};

	if (isLoading) {
		return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
	}

	const logs = data?.logs || [];
	const total = data?.total || 0;
	const totalPages = Math.ceil(total / limit);

	return (
		<Card className="p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold">
					{t("integrations.logs.title")}
				</h3>
				<div className="flex gap-2">
					<Select value={channel} onValueChange={setChannel}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder={t("integrations.logs.allChannels")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">
								{t("integrations.logs.allChannels")}
							</SelectItem>
							<SelectItem value="EMAIL">
								{t("integrations.channels.email")}
							</SelectItem>
							<SelectItem value="WHATSAPP">
								{t("integrations.channels.whatsapp")}
							</SelectItem>
							<SelectItem value="SMS">
								{t("integrations.channels.sms")}
							</SelectItem>
						</SelectContent>
					</Select>

					<Select value={status} onValueChange={setStatus}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder={t("integrations.logs.allStatuses")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">
								{t("integrations.logs.allStatuses")}
							</SelectItem>
							<SelectItem value="SENT">
								{t("integrations.logs.statuses.sent")}
							</SelectItem>
							<SelectItem value="FAILED">
								{t("integrations.logs.statuses.failed")}
							</SelectItem>
							<SelectItem value="PENDING">
								{t("integrations.logs.statuses.pending")}
							</SelectItem>
							<SelectItem value="SKIPPED">
								{t("integrations.logs.statuses.skipped")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{logs.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					{t("integrations.logs.empty")}
				</div>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("integrations.logs.channel")}</TableHead>
								<TableHead>{t("integrations.logs.recipient")}</TableHead>
								<TableHead>{t("integrations.logs.subject")}</TableHead>
								<TableHead>{t("integrations.logs.status")}</TableHead>
								<TableHead>{t("integrations.logs.date")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{logs.map((log) => (
								<TableRow key={log.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											{getChannelIcon(log.channel)}
											<span>{t(`integrations.channels.${log.channel.toLowerCase()}`)}</span>
										</div>
									</TableCell>
									<TableCell className="font-mono text-sm">
										{log.recipient}
									</TableCell>
									<TableCell className="max-w-[200px] truncate">
										{log.subject || "-"}
									</TableCell>
									<TableCell>
										<Badge
											variant={getStatusVariant(log.status)}
											className="flex items-center gap-1 w-fit"
										>
											{getStatusIcon(log.status)}
											{t(`integrations.logs.statuses.${log.status.toLowerCase()}`)}
										</Badge>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{new Date(log.createdAt).toLocaleString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{/* Pagination */}
					<div className="flex items-center justify-between mt-4">
						<div className="text-sm text-muted-foreground">
							{t("integrations.logs.showing", {
								from: page * limit + 1,
								to: Math.min((page + 1) * limit, total),
								total,
							})}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page - 1)}
								disabled={page === 0}
							>
								<ChevronLeftIcon className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage(page + 1)}
								disabled={page >= totalPages - 1}
							>
								<ChevronRightIcon className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</>
			)}
		</Card>
	);
}
