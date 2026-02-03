"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
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
	ShieldCheckIcon,
	ShieldOffIcon,
	Trash2Icon,
	UserPlusIcon,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddUserDialog } from "./AddUserDialog";

export function UsersListPage() {
	const { activeOrganization } = useActiveOrganization();
	const queryClient = useQueryClient();
	const [showAddDialog, setShowAddDialog] = useState(false);

	const organizationId = activeOrganization?.id ?? "";

	const { data: usersData, isLoading: usersLoading } = useQuery(
		orpc.orgUsers.list.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: rolesData } = useQuery(
		orpc.roles.list.queryOptions({
			input: { organizationId },
		}),
	);

	const toggleActiveMutation = useMutation(
		orpc.orgUsers.toggleActive.mutationOptions(),
	);

	const deleteUserMutation = useMutation(
		orpc.orgUsers.delete.mutationOptions(),
	);

	const users = usersData?.users ?? [];
	const roles = rolesData?.roles ?? [];

	const handleToggleActive = async (userId: string) => {
		try {
			await toggleActiveMutation.mutateAsync({
				id: userId,
				organizationId,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.orgUsers.list.key(),
			});
		} catch {
			// handled silently
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

		try {
			await deleteUserMutation.mutateAsync({
				id: userId,
				organizationId,
			});
			queryClient.invalidateQueries({
				queryKey: orpc.orgUsers.list.key(),
			});
		} catch {
			// handled silently
		}
	};

	if (!activeOrganization) return null;

	return (
		<div dir="rtl">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-bold text-lg">المستخدمين</h2>
				<Button onClick={() => setShowAddDialog(true)} size="sm">
					<UserPlusIcon className="ml-2 size-4" />
					إضافة مستخدم
				</Button>
			</div>

			<Card>
				{usersLoading ? (
					<div className="p-8 text-center text-foreground/60">
						جارٍ التحميل...
					</div>
				) : users.length === 0 ? (
					<div className="p-8 text-center text-foreground/60">
						لا يوجد مستخدمين
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">
									الاسم
								</TableHead>
								<TableHead className="text-right">
									البريد الإلكتروني
								</TableHead>
								<TableHead className="text-right">
									الدور
								</TableHead>
								<TableHead className="text-right">
									الحالة
								</TableHead>
								<TableHead className="text-right">
									إجراءات
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user: any) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">
										{user.name}
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										{user.organizationRole?.name ??
											(user.accountType === "OWNER"
												? "مالك"
												: "-")}
									</TableCell>
									<TableCell>
										<Badge
											status={
												user.isActive
													? "success"
													: "error"
											}
										>
											{user.isActive ? "نشط" : "معطل"}
										</Badge>
									</TableCell>
									<TableCell>
										{user.accountType !== "OWNER" && (
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleToggleActive(
															user.id,
														)
													}
													disabled={
														toggleActiveMutation.isPending
													}
													title={
														user.isActive
															? "تعطيل"
															: "تفعيل"
													}
												>
													{user.isActive ? (
														<ShieldOffIcon className="size-4" />
													) : (
														<ShieldCheckIcon className="size-4" />
													)}
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleDeleteUser(
															user.id,
														)
													}
													disabled={
														deleteUserMutation.isPending
													}
													title="حذف"
												>
													<Trash2Icon className="size-4 text-destructive" />
												</Button>
											</div>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>

			<AddUserDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				organizationId={organizationId}
				roles={roles}
			/>
		</div>
	);
}
