"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Card } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@ui/components/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { FreeOverrideDialog } from "./FreeOverrideDialog";
import { SuspendOrgDialog } from "./SuspendOrgDialog";
import { UpdateLimitsDialog } from "./UpdateLimitsDialog";
import { Button } from "@ui/components/button";

const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "info"> = {
	ACTIVE: "success",
	TRIALING: "info",
	SUSPENDED: "error",
	CANCELLED: "error",
	PAST_DUE: "warning",
};

export function OrganizationDetail({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const [changePlanOpen, setChangePlanOpen] = useState(false);
	const [suspendOpen, setSuspendOpen] = useState(false);
	const [freeOverrideOpen, setFreeOverrideOpen] = useState(false);
	const [updateLimitsOpen, setUpdateLimitsOpen] = useState(false);

	const { data: org, isLoading } = useQuery(
		orpc.superAdmin.organizations.getById.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: paymentHistory } = useQuery(
		orpc.superAdmin.organizations.getPaymentHistory.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: members } = useQuery(
		orpc.superAdmin.organizations.getMembers.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: projects } = useQuery(
		orpc.superAdmin.organizations.getProjects.queryOptions({
			input: { organizationId },
		}),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-40 rounded-lg" />
				<Skeleton className="h-60 rounded-lg" />
			</div>
		);
	}

	if (!org) {
		return <p>{t("admin.organizations.notFound")}</p>;
	}

	const membersCount = org._count.members;
	const projectsCount = org._count.projects;
	const membersPercent = org.maxUsers > 0 ? Math.min(100, (membersCount / org.maxUsers) * 100) : 0;
	const projectsPercent = org.maxProjects > 0 ? Math.min(100, (projectsCount / org.maxProjects) * 100) : 0;

	return (
		<div className="space-y-6">
			{/* Header Card */}
			<Card className="p-6">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="font-bold text-2xl">{org.name}</h2>
						<p className="text-muted-foreground">
							{org.slug} &middot;{" "}
							{org.owner?.email ?? t("admin.organizations.noOwner")}
						</p>
						<div className="mt-2 flex gap-2">
							<Badge status={STATUS_BADGE[org.status] ?? "info"}>
								{org.status}
							</Badge>
							<Badge variant="outline">{org.plan}</Badge>
							{org.isFreeOverride && (
								<Badge status="warning">
									{t("admin.organizations.freeOverride")}
								</Badge>
							)}
						</div>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setChangePlanOpen(true)}
						>
							{t("admin.organizations.changePlan")}
						</Button>
						{org.status !== "SUSPENDED" ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSuspendOpen(true)}
							>
								{t("admin.organizations.suspend")}
							</Button>
						) : null}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setUpdateLimitsOpen(true)}
						>
							{t("admin.organizations.updateLimits")}
						</Button>
					</div>
				</div>
			</Card>

			{/* Tabs */}
			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">
						{t("admin.organizations.overview")}
					</TabsTrigger>
					<TabsTrigger value="members">
						{t("admin.organizations.membersTab")}
					</TabsTrigger>
					<TabsTrigger value="projects">
						{t("admin.organizations.projectsTab")}
					</TabsTrigger>
					<TabsTrigger value="subscription">
						{t("admin.organizations.subscriptionHistory")}
					</TabsTrigger>
					<TabsTrigger value="logs">
						{t("admin.organizations.activityLog")}
					</TabsTrigger>
				</TabsList>

				{/* Tab 1: Overview */}
				<TabsContent value="overview">
					<div className="grid gap-6 md:grid-cols-2">
						{/* Company Info */}
						<Card className="p-6">
							<h3 className="font-semibold text-lg mb-4">
								{t("admin.organizations.companyInfo")}
							</h3>
							<div className="space-y-3 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">{t("admin.organizations.name")}</span>
									<span className="font-medium">{org.name}</span>
								</div>
								{org.owner && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">{t("admin.organizations.owner")}</span>
										<span className="font-medium">{org.owner.name} ({org.owner.email})</span>
									</div>
								)}
								<div className="flex justify-between">
									<span className="text-muted-foreground">{t("admin.organizations.createdAt")}</span>
									<span className="font-medium">{new Date(org.createdAt).toLocaleDateString()}</span>
								</div>
							</div>
						</Card>

						{/* Subscription Info */}
						<Card className="p-6">
							<h3 className="font-semibold text-lg mb-4">
								{t("admin.organizations.subscriptionInfo")}
							</h3>
							<div className="space-y-3 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">{t("admin.organizations.planCol")}</span>
									<Badge status={org.plan === "PRO" ? "success" : "info"}>{org.plan}</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">{t("admin.organizations.statusCol")}</span>
									<Badge status={STATUS_BADGE[org.status] ?? "info"}>{org.status}</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">{t("admin.organizations.lastPayment")}</span>
									<span className="font-medium">
										{org.lastPaymentAmount
											? `${Number(org.lastPaymentAmount).toLocaleString("en-US")} SAR`
											: "-"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">{t("admin.organizations.periodEnd")}</span>
									<span className="font-medium">
										{org.currentPeriodEnd
											? new Date(org.currentPeriodEnd).toLocaleDateString()
											: "-"}
									</span>
								</div>
							</div>
						</Card>

						{/* Usage */}
						<Card className="p-6 md:col-span-2">
							<h3 className="font-semibold text-lg mb-4">
								{t("admin.organizations.usage")}
							</h3>
							<div className="grid gap-6 md:grid-cols-2">
								<div>
									<div className="flex justify-between text-sm mb-1">
										<span>{t("admin.organizations.members")}</span>
										<span>{membersCount} / {org.maxUsers}</span>
									</div>
									<div className="h-2 rounded-full bg-muted overflow-hidden">
										<div className="h-full rounded-full bg-primary transition-all" style={{ width: `${membersPercent}%` }} />
									</div>
								</div>
								<div>
									<div className="flex justify-between text-sm mb-1">
										<span>{t("admin.organizations.projects")}</span>
										<span>{projectsCount} / {org.maxProjects}</span>
									</div>
									<div className="h-2 rounded-full bg-muted overflow-hidden">
										<div className="h-full rounded-full bg-primary transition-all" style={{ width: `${projectsPercent}%` }} />
									</div>
								</div>
							</div>
						</Card>
					</div>
				</TabsContent>

				{/* Tab 2: Members */}
				<TabsContent value="members">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("admin.organizations.name")}</TableHead>
									<TableHead>{t("admin.organizations.role")}</TableHead>
									<TableHead>{t("admin.organizations.joinedDate")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{members?.length ? (
									members.map((member) => (
										<TableRow key={member.id}>
											<TableCell>
												<div>
													<p className="font-medium">{member.user.name}</p>
													<p className="text-muted-foreground text-xs">{member.user.email}</p>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline">{member.role}</Badge>
											</TableCell>
											<TableCell className="text-sm">
												{new Date(member.createdAt).toLocaleDateString()}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={3} className="h-20 text-center">
											{t("admin.organizations.noMembers")}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>

				{/* Tab 3: Projects */}
				<TabsContent value="projects">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("admin.organizations.projectName")}</TableHead>
									<TableHead>{t("admin.organizations.projectStatus")}</TableHead>
									<TableHead>{t("admin.organizations.teamSize")}</TableHead>
									<TableHead>{t("admin.organizations.createdAt")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{projects?.length ? (
									projects.map((project) => (
										<TableRow key={project.id}>
											<TableCell className="font-medium">
												{project.name}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{project.status}</Badge>
											</TableCell>
											<TableCell>{project._count.members}</TableCell>
											<TableCell className="text-sm">
												{new Date(project.createdAt).toLocaleDateString()}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={4} className="h-20 text-center">
											{t("admin.organizations.noProjects")}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>

				{/* Tab 4: Subscription History */}
				<TabsContent value="subscription">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.organizations.eventDate")}
									</TableHead>
									<TableHead>
										{t("admin.organizations.eventType")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paymentHistory?.length ? (
									paymentHistory.map((event) => (
										<TableRow key={event.id}>
											<TableCell>
												{new Date(
													event.processedAt,
												).toLocaleString("en-US")}
											</TableCell>
											<TableCell>
												<code className="rounded bg-muted px-1.5 py-0.5 text-xs">
													{event.eventType}
												</code>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={2}
											className="h-20 text-center"
										>
											{t(
												"admin.organizations.noPaymentHistory",
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>

				{/* Tab 5: Activity Log */}
				<TabsContent value="logs">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t("admin.logs.date")}
									</TableHead>
									<TableHead>
										{t("admin.logs.admin")}
									</TableHead>
									<TableHead>
										{t("admin.logs.action")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{org.superAdminLogs?.length ? (
									org.superAdminLogs.map((log) => (
										<TableRow key={log.id}>
											<TableCell>
												{new Date(
													log.createdAt,
												).toLocaleString("en-US")}
											</TableCell>
											<TableCell>
												{log.admin.name}
											</TableCell>
											<TableCell>
												<code className="rounded bg-muted px-1.5 py-0.5 text-xs">
													{log.action}
												</code>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={3}
											className="h-20 text-center"
										>
											{t("admin.logs.noResults")}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>
			</Tabs>

			<ChangePlanDialog
				open={changePlanOpen}
				onOpenChange={setChangePlanOpen}
				organizationId={org.id}
				currentPlan={org.plan}
			/>
			<SuspendOrgDialog
				open={suspendOpen}
				onOpenChange={setSuspendOpen}
				organizationId={org.id}
			/>
			<FreeOverrideDialog
				open={freeOverrideOpen}
				onOpenChange={setFreeOverrideOpen}
				organizationId={org.id}
				currentOverride={org.isFreeOverride}
			/>
			<UpdateLimitsDialog
				open={updateLimitsOpen}
				onOpenChange={setUpdateLimitsOpen}
				organizationId={org.id}
				currentLimits={{
					maxUsers: org.maxUsers,
					maxProjects: org.maxProjects,
					maxStorage: org.maxStorage,
				}}
			/>
		</div>
	);
}
