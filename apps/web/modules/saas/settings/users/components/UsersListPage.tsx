"use client";

import { useSession } from "@saas/auth/hooks/use-session";
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
	KeyRoundIcon,
	MailIcon,
	ShieldCheckIcon,
	ShieldOffIcon,
	Trash2Icon,
	UserPlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UpgradeGate } from "@saas/shared/components/UpgradeGate";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";
import { AddUserDialog } from "./AddUserDialog";
import { PermissionsEditorDialog } from "./permissions-editor/PermissionsEditorDialog";

export function UsersListPage() {
	const { activeOrganization } = useActiveOrganization();
	const { user: currentUser } = useSession();
	const queryClient = useQueryClient();
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [permissionsUser, setPermissionsUser] = useState<any>(null);

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

	const resendInvitationMutation = useMutation(
		orpc.orgUsers.resendInvitation.mutationOptions(),
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

	const handleResendInvitation = async (userId: string) => {
		try {
			await resendInvitationMutation.mutateAsync({
				id: userId,
				organizationId,
			});
			toast.success("تم إعادة إرسال الدعوة");
		} catch (e) {
			toast.error(
				e && typeof e === "object" && "message" in e
					? (e.message as string)
					: "تعذّر إعادة إرسال الدعوة",
			);
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

	// أزرار إجراءات الصف — مشتركة بين الجدول (ديسكتوب) وبطاقات الجوال
	const renderRowActions = (user: any) =>
		user.accountType !== "OWNER" ? (
			<div className="flex gap-2">
				{user.id !== currentUser?.id && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setPermissionsUser(user)}
						title="تحرير الصلاحيات"
					>
						<KeyRoundIcon className="size-4" />
					</Button>
				)}
				{!user.isActive && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleResendInvitation(user.id)}
						disabled={resendInvitationMutation.isPending}
						title="إعادة إرسال الدعوة"
					>
						<MailIcon className="size-4" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="sm"
					onClick={() => handleToggleActive(user.id)}
					disabled={toggleActiveMutation.isPending}
					title={user.isActive ? "تعطيل" : "تفعيل"}
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
					onClick={() => handleDeleteUser(user.id)}
					disabled={deleteUserMutation.isPending}
					title="حذف"
				>
					<Trash2Icon className="size-4 text-destructive" />
				</Button>
			</div>
		) : null;

	if (!activeOrganization) return null;

	return (
		<div dir="rtl">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-bold text-lg">المستخدمين</h2>
				<UpgradeGate feature="members.invite">
					<Button onClick={() => setShowAddDialog(true)} size="sm">
						<UserPlusIcon className="me-2 size-4" />
						إضافة مستخدم
					</Button>
				</UpgradeGate>
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
					<>
					{/* الجوال: صفوف بسطرين بدل الجدول متعدد الأعمدة */}
					<MobileDocList className="sm:hidden rounded-none border-0 bg-transparent">
						{users.map((user: any) => (
							<MobileDocRow
								key={user.id}
								title={user.name}
								subtitle={
									<>
										{user.email}
										{" · "}
										{user.organizationRole?.name ??
											(user.accountType === "OWNER"
												? "مالك"
												: "-")}
									</>
								}
								badge={
									<Badge
										status={
											user.isActive
												? "success"
												: "error"
										}
									>
										{user.isActive ? "نشط" : "معطل"}
									</Badge>
								}
								actions={renderRowActions(user)}
							/>
						))}
					</MobileDocList>
					{/* الجدول (الديسكتوب كما هو) */}
					<div className="hidden sm:block">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-start">
									الاسم
								</TableHead>
								<TableHead className="text-start">
									البريد الإلكتروني
								</TableHead>
								<TableHead className="text-start">
									الدور
								</TableHead>
								<TableHead className="text-start">
									الحالة
								</TableHead>
								<TableHead className="text-start">
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
										{renderRowActions(user)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					</div>
					</>
				)}
			</Card>

			<AddUserDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				organizationId={organizationId}
				roles={roles}
			/>

			<PermissionsEditorDialog
				open={!!permissionsUser}
				onOpenChange={(open) => {
					if (!open) setPermissionsUser(null);
				}}
				organizationId={organizationId}
				user={permissionsUser}
				roles={roles}
			/>
		</div>
	);
}
