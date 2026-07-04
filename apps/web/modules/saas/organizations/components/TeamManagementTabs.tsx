"use client";

import { RolesListPage } from "@saas/settings/roles/components/RolesListPage";
import { UsersListPage } from "@saas/settings/users/components/UsersListPage";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useState } from "react";
import { OrganizationInvitationsList } from "./OrganizationInvitationsList";

export function TeamManagementTabs({
	organizationId,
	isAdmin,
}: {
	organizationId: string;
	isAdmin: boolean;
}) {
	const [activeTab, setActiveTab] = useState("members");

	return (
		<SettingsItem
			title="إدارة الفريق"
			description="عرض وإدارة أعضاء الفريق والأدوار والصلاحيات."
		>
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-4">
					<TabsTrigger value="members">
						الأعضاء والمستخدمين
					</TabsTrigger>
					{isAdmin && (
						<TabsTrigger value="roles">
							الأدوار والصلاحيات
						</TabsTrigger>
					)}
				</TabsList>

				<TabsContent value="members">
					<div className="space-y-6">
						{/*
						  OrganizationMembersList (قائمة BetterAuth) أُخفيت عمداً:
						  كانت تعدّل Member.role المجمّد الذي لا يؤثر على الصلاحيات
						  إطلاقاً — ما يوهم المستخدم أنه غيّر الصلاحيات. الجدول
						  الحقيقي الوحيد هو "المستخدمين" (UsersListPage) المبني على
						  orgUsers + Role/customPermissions.
						*/}
						<OrganizationInvitationsList
							organizationId={organizationId}
						/>
						{isAdmin && <UsersListPage />}
					</div>
				</TabsContent>

				{isAdmin && (
					<TabsContent value="roles">
						<RolesListPage />
					</TabsContent>
				)}
			</Tabs>
		</SettingsItem>
	);
}
