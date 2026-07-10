import { SIDEBAR_COLLAPSED_COOKIE } from "@saas/shared/components/sidebar/sidebar-context";
import { AppWrapper } from "@saas/shared/components/AppWrapper";
import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";

export default async function UserLayout({ children }: PropsWithChildren) {
	// Seed the sidebar width from the cookie so it renders correctly on the
	// server's first paint (matches the organization layout — no snap/fade).
	const cookieStore = await cookies();
	const sidebarCollapsed =
		cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "1";

	return (
		<AppWrapper defaultSidebarCollapsed={sidebarCollapsed}>
			{children}
		</AppWrapper>
	);
}
