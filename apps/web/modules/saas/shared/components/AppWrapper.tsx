"use client";

import { config } from "@repo/config";
import { OrganzationSelect } from "@saas/organizations/components/OrganizationSelect";
import {
	AppSidebar,
	SidebarInset,
	SidebarProvider,
} from "@saas/shared/components/sidebar";
import { SkipNavTarget } from "@ui/components/skip-nav";
import type { PropsWithChildren } from "react";

export function AppWrapper({
	children,
	defaultSidebarCollapsed = false,
}: PropsWithChildren<{ defaultSidebarCollapsed?: boolean }>) {
	const headerExtra =
		config.organizations.enable &&
		!config.organizations.hideOrganization ? (
			<OrganzationSelect />
		) : undefined;

	return (
		<SidebarProvider defaultCollapsed={defaultSidebarCollapsed}>
			<div className="flex h-screen">
				<AppSidebar headerExtra={headerExtra} />
				<SidebarInset>
					<SkipNavTarget />
					{children}
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
