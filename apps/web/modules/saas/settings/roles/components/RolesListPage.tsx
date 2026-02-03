"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	LockIcon,
	PlusIcon,
	SettingsIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function RolesListPage() {
	const { activeOrganization } = useActiveOrganization();
	const queryClient = useQueryClient();
	const [selectedRole, setSelectedRole] = useState<string | null>(null);

	const organizationId = activeOrganization?.id ?? "";

	const { data: rolesData, isLoading } = useQuery(
		orpc.roles.list.queryOptions({
			input: { organizationId },
		}),
	);

	const deleteRoleMutation = useMutation(
		orpc.roles.delete.mutationOptions(),
	);

	const roles = rolesData?.roles ?? [];

	const handleDeleteRole = async (roleId: string) => {
		if (!confirm("هل أنت متأكد من حذف هذا الدور؟")) return;

		try {
			await deleteRoleMutation.mutateAsync({
				id: roleId,
				organizationId,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.roles.list.key(),
			});
			if (selectedRole === roleId) {
				setSelectedRole(null);
			}
		} catch {
			// handled silently
		}
	};

	if (!activeOrganization) return null;

	return (
		<div dir="rtl">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-bold text-lg">
						الأدوار والصلاحيات
					</h2>
					<p className="text-sm text-foreground/60">
						إدارة أدوار وصلاحيات الموظفين
					</p>
				</div>
				<Button size="sm">
					<PlusIcon className="ml-2 size-4" />
					دور مخصص
				</Button>
			</div>

			{isLoading ? (
				<div className="p-8 text-center text-foreground/60">
					جارٍ التحميل...
				</div>
			) : roles.length === 0 ? (
				<div className="p-8 text-center text-foreground/60">
					لا توجد أدوار
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{roles.map((role: any) => (
						<Card
							key={role.id}
							className={`cursor-pointer transition-colors ${
								selectedRole === role.id
									? "ring-2 ring-primary"
									: ""
							}`}
							onClick={() => setSelectedRole(role.id)}
						>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">
										{role.name}
									</CardTitle>
									<div className="flex items-center gap-2">
										{role.isSystem && (
											<LockIcon className="size-4 text-foreground/40" />
										)}
										{!role.isSystem && (
											<Badge status="info">مخصص</Badge>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-sm text-foreground/60">
										<UsersIcon className="size-4" />
										{role._count?.users ?? 0} مستخدم
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
											}}
										>
											<SettingsIcon className="ml-1 size-4" />
											الصلاحيات
										</Button>
										{!role.isSystem && (
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteRole(role.id);
												}}
												disabled={
													deleteRoleMutation.isPending
												}
											>
												<Trash2Icon className="size-4 text-destructive" />
											</Button>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
