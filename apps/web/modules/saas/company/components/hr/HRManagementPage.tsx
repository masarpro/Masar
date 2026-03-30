"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Users, Banknote, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { EmployeeList } from "@saas/company/components/employees/EmployeeList";
import { PayrollRunList } from "@saas/company/components/payroll/PayrollRunList";
import { LeavesMiniSection } from "./LeavesMiniSection";

interface HRManagementPageProps {
	organizationId: string;
	organizationSlug: string;
}

export function HRManagementPage({ organizationId, organizationSlug }: HRManagementPageProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const currentTab = searchParams.get("tab") || "employees";

	const handleTabChange = useCallback(
		(tab: string) => {
			const url = new URL(window.location.href);
			url.searchParams.set("tab", tab);
			router.replace(url.pathname + url.search, { scroll: false });
		},
		[router],
	);

	return (
		<div className="space-y-6">
			<Tabs value={currentTab} onValueChange={handleTabChange}>
				<TabsList className="w-full justify-start">
					<TabsTrigger value="employees" className="gap-1.5">
						<Users className="h-3.5 w-3.5" />
						{t("company.hr.tabs.employees")}
					</TabsTrigger>
					<TabsTrigger value="payroll" className="gap-1.5">
						<Banknote className="h-3.5 w-3.5" />
						{t("company.hr.tabs.payroll")}
					</TabsTrigger>
					<TabsTrigger value="leaves" className="gap-1.5">
						<CalendarDays className="h-3.5 w-3.5" />
						{t("company.hr.tabs.leaves")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="employees" className="mt-4">
					<EmployeeList organizationId={organizationId} organizationSlug={organizationSlug} />
				</TabsContent>

				<TabsContent value="payroll" className="mt-4">
					<PayrollRunList organizationId={organizationId} organizationSlug={organizationSlug} />
				</TabsContent>

				<TabsContent value="leaves" className="mt-4">
					<LeavesMiniSection organizationId={organizationId} organizationSlug={organizationSlug} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
