"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Copy,
	ExternalLink,
	Key,
	Link2,
	Plus,
	Trash2,
	UserCircle,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface OwnerAccessManagementProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function OwnerAccessManagement({
	organizationId,
	organizationSlug,
	projectId,
}: OwnerAccessManagementProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newLinkLabel, setNewLinkLabel] = useState("");
	const [createdToken, setCreatedToken] = useState<string | null>(null);
	const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

	const { data: accessList, isLoading } = useQuery(
		orpc.projectOwner.listAccess.queryOptions({ input: { organizationId, projectId } }),
	);

	const createMutation = useMutation({
		...orpc.projectOwner.createAccess.mutationOptions(),
		onSuccess: (data) => {
			setCreatedToken(data.token);
			setNewLinkLabel("");
			queryClient.invalidateQueries({
				queryKey: orpc.projectOwner.listAccess.queryOptions({ input: { organizationId, projectId } }).queryKey,
			});
		},
		onError: (error) => {
			toast.error(t("ownerAccess.createError"));
		},
	});

	const revokeMutation = useMutation({
		...orpc.projectOwner.revokeAccess.mutationOptions(),
		onSuccess: () => {
			toast.success(t("ownerAccess.revokeSuccess"));
			setRevokeTarget(null);
			queryClient.invalidateQueries({
				queryKey: orpc.projectOwner.listAccess.queryOptions({ input: { organizationId, projectId } }).queryKey,
			});
		},
		onError: (error) => {
			toast.error(t("ownerAccess.revokeError"));
		},
	});

	const handleCreate = () => {
		createMutation.mutate({
			organizationId,
			projectId,
			label: newLinkLabel || undefined,
		});
	};

	const handleCopyLink = (token: string) => {
		const url = `${window.location.origin}/owner/${token}`;
		navigator.clipboard.writeText(url);
		toast.success(t("ownerAccess.linkCopied"));
	};

	const handleOpenPortal = (token: string) => {
		const url = `${window.location.origin}/owner/${token}`;
		window.open(url, "_blank");
	};

	const handleRevoke = (id: string) => {
		revokeMutation.mutate({ organizationId, projectId, accessId: id });
	};

	const portalUrl = createdToken
		? `${typeof window !== "undefined" ? window.location.origin : ""}/owner/${createdToken}`
		: "";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("ownerAccess.title")}
					</h2>
					<p className="text-sm text-slate-500 mt-1">
						{t("ownerAccess.description")}
					</p>
				</div>
				<Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-xl">
					<Plus className="h-4 w-4 me-2" />
					{t("ownerAccess.createLink")}
				</Button>
			</div>

			{/* Access Links List */}
			<div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="relative">
							<div className="h-10 w-10 rounded-full border-4 border-primary/20" />
							<div className="absolute left-0 top-0 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					</div>
				) : !accessList?.length ? (
					<div className="flex flex-col items-center justify-center py-12 text-slate-500">
						<Users className="h-12 w-12 mb-3 text-slate-300" />
						<p className="font-medium">{t("ownerAccess.noLinks")}</p>
						<p className="text-sm mt-1">{t("ownerAccess.noLinksDescription")}</p>
					</div>
				) : (
					<div className="divide-y divide-slate-100 dark:divide-slate-800">
						{accessList.map((access) => (
							<div
								key={access.id}
								className="flex items-center justify-between p-4"
							>
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
										<Key className="h-5 w-5 text-primary" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-medium text-slate-900 dark:text-slate-100">
												{access.label || t("ownerAccess.defaultLabel")}
											</span>
											{access.isRevoked ? (
												<Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
													{t("ownerAccess.revoked")}
												</Badge>
											) : (
												<Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
													{t("ownerAccess.active")}
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
											<span>
												{t("ownerAccess.createdAt")}: {new Date(access.createdAt).toLocaleDateString("ar-SA")}
											</span>
											<span>•</span>
											<span>
												{t("ownerAccess.createdBy")}: {access.createdBy.name}
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2">
									{!access.isRevoked && (
										<>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleCopyLink(access.token)}
												className="rounded-lg"
											>
												<Copy className="h-4 w-4 me-1" />
												{t("ownerAccess.copyLink")}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleOpenPortal(access.token)}
												className="rounded-lg"
											>
												<ExternalLink className="h-4 w-4 me-1" />
												{t("ownerAccess.openPortal")}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setRevokeTarget(access.id)}
												className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Create Dialog */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("ownerAccess.createDialogTitle")}</DialogTitle>
						<DialogDescription>
							{t("ownerAccess.createDialogDescription")}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="label">{t("ownerAccess.labelField")}</Label>
							<Input
								id="label"
								value={newLinkLabel}
								onChange={(e) => setNewLinkLabel(e.target.value)}
								placeholder={t("ownerAccess.labelPlaceholder")}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateDialogOpen(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={handleCreate}
							disabled={createMutation.isPending}
						>
							{createMutation.isPending ? t("common.loading") : t("ownerAccess.create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Success Dialog with Link */}
			<Dialog open={!!createdToken} onOpenChange={() => setCreatedToken(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("ownerAccess.successTitle")}</DialogTitle>
						<DialogDescription>
							{t("ownerAccess.successDescription")}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
							<Link2 className="h-4 w-4 text-slate-500 shrink-0" />
							<code className="text-sm flex-1 truncate text-slate-700 dark:text-slate-300">
								{portalUrl}
							</code>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									navigator.clipboard.writeText(portalUrl);
									toast.success(t("ownerAccess.linkCopied"));
								}}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
						<p className="text-sm text-amber-600 dark:text-amber-400">
							{t("ownerAccess.warningCopyNow")}
						</p>
					</div>

					<DialogFooter>
						<Button onClick={() => setCreatedToken(null)}>
							{t("common.close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Revoke Confirmation Dialog */}
			<AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("ownerAccess.revokeTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("ownerAccess.revokeDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => revokeTarget && handleRevoke(revokeTarget)}
							className="bg-red-600 hover:bg-red-700"
						>
							{t("ownerAccess.confirmRevoke")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
