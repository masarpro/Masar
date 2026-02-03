"use client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	LinkIcon,
	CopyIcon,
	TrashIcon,
	PlusIcon,
	FileTextIcon,
	CalendarIcon,
	ImageIcon,
	FileIcon,
	CheckIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface ShareLinksManagerProps {
	projectId: string;
}

type ResourceType =
	| "UPDATE_PDF"
	| "CLAIM_PDF"
	| "DOCUMENT"
	| "PHOTO_ALBUM"
	| "ICS"
	| "WEEKLY_REPORT";

export function ShareLinksManager({ projectId }: ShareLinksManagerProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [copiedToken, setCopiedToken] = useState<string | null>(null);
	const [newLink, setNewLink] = useState<{
		resourceType: ResourceType;
		resourceId?: string;
		expiresInDays?: number;
	}>({
		resourceType: "WEEKLY_REPORT",
	});

	const { data, isLoading } = useQuery({
		queryKey: ["share-links", activeOrganization?.id, projectId],
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.shares.list({
				organizationId: activeOrganization.id,
				projectId,
				includeRevoked: false,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.shares.create({
				organizationId: activeOrganization.id,
				projectId,
				...newLink,
			});
		},
		onSuccess: (result) => {
			toast.success(t("shares.created"));
			queryClient.invalidateQueries({ queryKey: ["share-links"] });
			setIsCreateOpen(false);

			// Copy to clipboard
			navigator.clipboard.writeText(result.shareUrl);
			toast.success(t("shares.copiedToClipboard"));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const revokeMutation = useMutation({
		mutationFn: async (token: string) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.shares.revoke({
				organizationId: activeOrganization.id,
				projectId,
				token,
			});
		},
		onSuccess: () => {
			toast.success(t("shares.revoked"));
			queryClient.invalidateQueries({ queryKey: ["share-links"] });
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const getResourceIcon = (type: string) => {
		switch (type) {
			case "UPDATE_PDF":
			case "CLAIM_PDF":
			case "WEEKLY_REPORT":
				return <FileTextIcon className="h-4 w-4" />;
			case "ICS":
				return <CalendarIcon className="h-4 w-4" />;
			case "PHOTO_ALBUM":
				return <ImageIcon className="h-4 w-4" />;
			case "DOCUMENT":
				return <FileIcon className="h-4 w-4" />;
			default:
				return <LinkIcon className="h-4 w-4" />;
		}
	};

	const copyToClipboard = (url: string, token: string) => {
		navigator.clipboard.writeText(url);
		setCopiedToken(token);
		toast.success(t("shares.copiedToClipboard"));
		setTimeout(() => setCopiedToken(null), 2000);
	};

	if (isLoading) {
		return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
	}

	const links = data?.links || [];

	return (
		<Card className="p-6">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<LinkIcon className="h-5 w-5" />
					<h3 className="text-lg font-semibold">{t("shares.title")}</h3>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<PlusIcon className="h-4 w-4 mr-2" />
							{t("shares.create")}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t("shares.createTitle")}</DialogTitle>
							<DialogDescription>
								{t("shares.createDescription")}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label>{t("shares.resourceType")}</Label>
								<Select
									value={newLink.resourceType}
									onValueChange={(value) =>
										setNewLink({ ...newLink, resourceType: value as ResourceType })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="WEEKLY_REPORT">
											{t("share.resourceTypes.weeklyReport")}
										</SelectItem>
										<SelectItem value="ICS">
											{t("share.resourceTypes.calendar")}
										</SelectItem>
										<SelectItem value="PHOTO_ALBUM">
											{t("share.resourceTypes.photoAlbum")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>{t("shares.expiresIn")}</Label>
								<Select
									value={newLink.expiresInDays?.toString() || "none"}
									onValueChange={(value) =>
										setNewLink({
											...newLink,
											expiresInDays:
												value === "none" ? undefined : parseInt(value),
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("shares.neverExpires")}</SelectItem>
										<SelectItem value="7">{t("shares.expires7Days")}</SelectItem>
										<SelectItem value="30">{t("shares.expires30Days")}</SelectItem>
										<SelectItem value="90">{t("shares.expires90Days")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
								{t("common.cancel")}
							</Button>
							<Button
								onClick={() => createMutation.mutate()}
								loading={createMutation.isPending}
							>
								{t("shares.create")}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{links.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					{t("shares.empty")}
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("shares.type")}</TableHead>
							<TableHead>{t("shares.createdAt")}</TableHead>
							<TableHead>{t("shares.expires")}</TableHead>
							<TableHead className="text-right">{t("shares.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{links.map((link) => (
							<TableRow key={link.token}>
								<TableCell>
									<div className="flex items-center gap-2">
										{getResourceIcon(link.resourceType)}
										<span>
											{t(`share.resourceTypes.${link.resourceType.toLowerCase().replace(/_/g, "")}`)}
										</span>
									</div>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{new Date(link.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									{link.expiresAt ? (
										<Badge variant="secondary">
											{new Date(link.expiresAt).toLocaleDateString()}
										</Badge>
									) : (
										<Badge variant="outline">{t("shares.neverExpires")}</Badge>
									)}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => copyToClipboard(link.shareUrl, link.token)}
										>
											{copiedToken === link.token ? (
												<CheckIcon className="h-4 w-4 text-green-500" />
											) : (
												<CopyIcon className="h-4 w-4" />
											)}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => revokeMutation.mutate(link.token)}
										>
											<TrashIcon className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</Card>
	);
}
