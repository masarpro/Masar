"use client";

import { RolesListPage } from "@saas/settings/roles/components/RolesListPage";
import { UsersListPage } from "@saas/settings/users/components/UsersListPage";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { useState } from "react";
import { OrganizationInvitationsList } from "./OrganizationInvitationsList";
import { OrganizationMembersList } from "./OrganizationMembersList";

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
						<OrganizationMembersList
							organizationId={organizationId}
						/>
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
