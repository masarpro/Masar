"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePermission } from "../hooks/use-permission";
import {
	COMPANY_ROUTE_PERMISSIONS,
	FINANCE_ROUTE_PERMISSIONS,
	findRouteRule,
	PRICING_ROUTE_PERMISSIONS,
	type RoutePermissionRule,
} from "../lib/permission-map";
import { AccessDenied } from "./AccessDenied";

const SECTION_RULES: Record<string, RoutePermissionRule[]> = {
	finance: FINANCE_ROUTE_PERMISSIONS,
	company: COMPANY_ROUTE_PERMISSIONS,
	pricing: PRICING_ROUTE_PERMISSIONS,
};

/**
 * Per-route gate rendered from a section layout (finance/company/pricing).
 * The section layout's server guard already ensures the member may enter the
 * section at all; this maps the current sub-route to its specific permission
 * so a member allowed into part of a section can't open forbidden pages via
 * direct URL (e.g. a PM inside finance opening /finance/invoices).
 */
export function SectionRouteGate({
	sectionRoot,
	children,
}: {
	sectionRoot: "finance" | "company" | "pricing";
	children: ReactNode;
}) {
	const pathname = usePathname();
	const { can, isOwner, permissions, isLoading } = usePermission();

	if (isOwner) {
		return <>{children}</>;
	}

	// Permissions not resolved yet — brief blank instead of a wrong flash.
	if (!permissions && isLoading) {
		return null;
	}

	const rule = findRouteRule(pathname, sectionRoot, SECTION_RULES[sectionRoot]);

	if (rule?.public) {
		return <>{children}</>;
	}

	if (rule?.section && rule.action && !can(rule.section, rule.action)) {
		return <AccessDenied />;
	}

	return <>{children}</>;
}
