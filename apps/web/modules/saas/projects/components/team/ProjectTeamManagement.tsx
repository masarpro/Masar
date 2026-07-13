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
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	HardHat,
	Plus,
	Trash2,
	UserCircle,
	Users,
	Calculator,
	Eye,
	Briefcase,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface ProjectTeamManagementProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

type ProjectRole = "MANAGER" | "ENGINEER" | "SUPERVISOR" | "ACCOUNTANT" | "VIEWER";

const roleIcons: Record<ProjectRole, typeof UserCircle> = {
	MANAGER: Briefcase,
	ENGINEER: UserCircle,
	SUPERVISOR: HardHat,
	ACCOUNTANT: Calculator,
	VIEWER: Eye,
};

const roleColors: Record<ProjectRole, string> = {
	MANAGER: "bg-chart-4/15 text-chart-4",
	ENGINEER: "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4",
	SUPERVISOR: "bg-chart-1/15 text-chart-1",
	ACCOUNTANT: "bg-success/15 text-success",
	VIEWER: "bg-muted text-muted-foreground",
};

export function ProjectTeamManagement({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectTeamManagementProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [selectedRole, setSelectedRole] = useState<ProjectRole>("VIEWER");
	const [removeTarget, setRemoveTarget] = useState<string | null>(null);
	const [editTarget, setEditTarget] = useState<{ userId: string; currentRole: ProjectRole } | null>(null);
	const [newRole, setNewRole] = useState<ProjectRole>("VIEWER");

	// Fetch team members
	const { data: teamData, isLoading } = useQuery(
		orpc.projectTeam.list.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch organization users for selection
	const { data: orgUsersData } = useQuery(
		orpc.orgUsers.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Filter out users who are already team members
	const availableUsers = orgUsersData?.users.filter(
		(user: any) => !teamData?.members.some((member: any) => member.user.id === user.id)
	) ?? [];

	const addMutation = useMutation({
		...orpc.projectTeam.add.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.team.memberAdded"));
			setIsAddDialogOpen(false);
			setSelectedUserId("");
			setSelectedRole("VIEWER");
			queryClient.invalidateQueries({
				queryKey: orpc.projectTeam.list.queryOptions({
					input: { organizationId, projectId },
				}).queryKey,
			});
		},
		onError: (error) => {
			toast.error(error.message || t("common.error"));
		},
	});

	const updateRoleMutation = useMutation({
		...orpc.projectTeam.updateRole.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.team.roleUpdated"));
			setEditTarget(null);
			queryClient.invalidateQueries({
				queryKey: orpc.projectTeam.list.queryOptions({
					input: { organizationId, projectId },
				}).queryKey,
			});
		},
		onError: (error) => {
			toast.error(error.message || t("common.error"));
		},
	});

	const removeMutation = useMutation({
		...orpc.projectTeam.remove.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projects.team.memberRemoved"));
			setRemoveTarget(null);
			queryClient.invalidateQueries({
				queryKey: orpc.projectTeam.list.queryOptions({
					input: { organizationId, projectId },
				}).queryKey,
			});
		},
		onError: (error) => {
			toast.error(error.message || t("common.error"));
		},
	});

	const handleAddMember = () => {
		if (!selectedUserId) return;
		addMutation.mutate({
			organizationId,
			projectId,
			userId: selectedUserId,
			role: selectedRole,
		});
	};

	const handleUpdateRole = () => {
		if (!editTarget) return;
		updateRoleMutation.mutate({
			organizationId,
			projectId,
			userId: editTarget.userId,
			role: newRole,
		});
	};

	const handleRemoveMember = (userId: string) => {
		removeMutation.mutate({
			organizationId,
			projectId,
			userId,
		});
	};

	const roles: ProjectRole[] = ["MANAGER", "ENGINEER", "SUPERVISOR", "ACCOUNTANT", "VIEWER"];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold text-foreground">
						{t("projects.team.title")}
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{t("projects.team.description")}
					</p>
				</div>
				<Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl">
					<Plus className="h-4 w-4 me-2" />
					{t("projects.team.addMember")}
				</Button>
			</div>

			{/* Team Members List */}
			<div className="rounded-2xl border-2 bg-card">
				{isLoading ? <ListTableSkeleton /> : !teamData?.members.length ? (
					<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
						<Users className="h-12 w-12 mb-3 text-muted-foreground/40" />
						<p className="font-medium">{t("projects.team.noMembers")}</p>
						<p className="text-sm mt-1">{t("projects.team.addFirstMember")}</p>
					</div>
				) : (
					<div className="divide-y-2 divide-border">
						{teamData.members.map((member: any) => {
							const RoleIcon = roleIcons[member.role as ProjectRole];
							return (
								<div
									key={member.id}
									className="flex items-center justify-between p-4"
								>
									<div className="flex items-center gap-4">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
											{member.user.image ? (
												<Image
													src={member.user.image}
													alt={member.user.name || ""}
													width={40}
													height={40}
													className="rounded-full object-cover"
													unoptimized
												/>
											) : (
												<UserCircle className="h-5 w-5 text-primary" />
											)}
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-medium text-foreground">
													{member.user.name}
												</span>
												<Badge className={`border-0 ${roleColors[member.role as ProjectRole]}`}>
													<RoleIcon className="h-3 w-3 me-1" />
													{t(`projects.team.roles.${member.role}`)}
												</Badge>
											</div>
											<div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
												<span>{member.user.email}</span>
												<span>•</span>
												<span>
													{t("projects.team.assignedAt")}: {new Date(member.assignedAt).toLocaleDateString("ar-SA")}
												</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setEditTarget({ userId: member.user.id, currentRole: member.role as ProjectRole });
												setNewRole(member.role as ProjectRole);
											}}
											className="rounded-lg"
										>
											{t("projects.team.updateRole")}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setRemoveTarget(member.user.id)}
											className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Add Member Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("projects.team.addMember")}</DialogTitle>
						<DialogDescription>
							{t("projects.team.description")}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>{t("projects.team.selectUser")}</Label>
							<Select value={selectedUserId} onValueChange={setSelectedUserId}>
								<SelectTrigger>
									<SelectValue placeholder={t("projects.team.selectUser")} />
								</SelectTrigger>
								<SelectContent>
									{availableUsers.map((user: any) => (
										<SelectItem key={user.id} value={user.id}>
											{user.name} ({user.email})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>{t("projects.team.selectRole")}</Label>
							<Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v as ProjectRole)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{roles.map((role) => (
										<SelectItem key={role} value={role}>
											<div className="flex items-center gap-2">
												<span>{t(`projects.team.roles.${role}`)}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{t(`projects.team.roleDescriptions.${selectedRole}`)}
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAddDialogOpen(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={handleAddMember}
							disabled={!selectedUserId || addMutation.isPending}
						>
							{addMutation.isPending ? t("common.loading") : t("projects.team.addMember")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Role Dialog */}
			<Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("projects.team.updateRole")}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>{t("projects.team.selectRole")}</Label>
							<Select value={newRole} onValueChange={(v: any) => setNewRole(v as ProjectRole)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{roles.map((role) => (
										<SelectItem key={role} value={role}>
											<div className="flex items-center gap-2">
												<span>{t(`projects.team.roles.${role}`)}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{t(`projects.team.roleDescriptions.${newRole}`)}
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEditTarget(null)}
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={handleUpdateRole}
							disabled={updateRoleMutation.isPending || (editTarget?.currentRole === newRole)}
						>
							{updateRoleMutation.isPending ? t("common.loading") : t("common.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Remove Confirmation Dialog */}
			<AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("projects.team.removeMember")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("projects.team.memberRemoved")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => removeTarget && handleRemoveMember(removeTarget)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("projects.team.removeMember")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
