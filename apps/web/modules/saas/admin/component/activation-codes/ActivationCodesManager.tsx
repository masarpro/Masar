"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import { Skeleton } from "@ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	BanIcon,
	ClipboardCopyIcon,
	EyeIcon,
	LoaderIcon,
	PlusIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function ActivationCodesManager() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [usageCodeId, setUsageCodeId] = useState<string | null>(null);

	const { data, isLoading } = useQuery(
		orpc.superAdmin.activationCodes.admin.list.queryOptions({
			input: { limit: 50, offset: 0 },
		}),
	);

	const codes = data?.codes ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-2xl">
					{t("admin.activationCodes.title")}
				</h2>
				<CreateCodeDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
				/>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-14 rounded-lg" />
					))}
				</div>
			) : codes.length === 0 ? (
				<p className="text-muted-foreground text-center py-12">
					{t("admin.activationCodes.noCodes")}
				</p>
			) : (
				<div className="overflow-x-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("admin.activationCodes.code")}
								</TableHead>
								<TableHead>
									{t("admin.activationCodes.description")}
								</TableHead>
								<TableHead>
									{t("admin.activationCodes.durationDays")}
								</TableHead>
								<TableHead>
									{t("admin.activationCodes.uses")}
								</TableHead>
								<TableHead>
									{t("admin.activationCodes.validity")}
								</TableHead>
								<TableHead>
									{t("admin.activationCodes.status")}
								</TableHead>
								<TableHead>
									{t("admin.activationCodes.createdAt")}
								</TableHead>
								<TableHead>
									{t("admin.activationCodes.actions")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{codes.map((code: any) => (
								<CodeRow
									key={code.id}
									code={code}
									onViewUsages={() =>
										setUsageCodeId(code.id)
									}
								/>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{usageCodeId && (
				<UsageSheet
					codeId={usageCodeId}
					open={!!usageCodeId}
					onOpenChange={(open) => !open && setUsageCodeId(null)}
				/>
			)}
		</div>
	);
}

function CodeRow({
	code,
	onViewUsages,
}: {
	code: any;
	onViewUsages: () => void;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const deactivateMutation = useMutation({
		mutationFn: () =>
			orpc.superAdmin.activationCodes.admin.deactivate.call({
				id: code.id,
			}),
		onSuccess: () => {
			toast.success(t("admin.activationCodes.deactivated"));
			queryClient.invalidateQueries({
				queryKey: ["superAdmin", "activationCodes"],
			});
		},
		onError: () => {
			toast.error(t("admin.activationCodes.deactivateFailed"));
		},
	});

	const isExpired =
		code.expiresAt && new Date(code.expiresAt) < new Date();
	const statusLabel = !code.isActive
		? t("admin.activationCodes.inactive")
		: isExpired
			? t("admin.activationCodes.expired")
			: t("admin.activationCodes.active");
	const statusVariant: "success" | "error" | "warning" = !code.isActive
		? "error"
		: isExpired
			? "warning"
			: "success";

	return (
		<TableRow>
			<TableCell className="font-mono text-xs" dir="ltr">
				{code.code}
			</TableCell>
			<TableCell className="max-w-[200px] truncate">
				{code.description || "—"}
			</TableCell>
			<TableCell>
				{code.durationDays} {t("admin.activationCodes.days")}
			</TableCell>
			<TableCell>
				{code.usedCount}/{code.maxUses}
			</TableCell>
			<TableCell>
				{code.expiresAt
					? new Date(code.expiresAt).toLocaleDateString("ar-SA")
					: t("admin.activationCodes.noExpiry")}
			</TableCell>
			<TableCell>
				<Badge status={statusVariant}>{statusLabel}</Badge>
			</TableCell>
			<TableCell>
				{new Date(code.createdAt).toLocaleDateString("ar-SA")}
			</TableCell>
			<TableCell>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={() => {
							navigator.clipboard.writeText(code.code);
							toast.success(
								t("admin.activationCodes.copied"),
							);
						}}
						title={t("admin.activationCodes.copyCode")}
						aria-label={t("admin.activationCodes.copyCode")}
					>
						<ClipboardCopyIcon className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={onViewUsages}
						title={t("admin.activationCodes.usageDetails")}
						aria-label={t("admin.activationCodes.usageDetails")}
					>
						<EyeIcon className="size-4" />
					</Button>
					{code.isActive && !isExpired && (
						<Button
							variant="ghost"
							size="icon"
							className="size-8 text-destructive"
							onClick={() => deactivateMutation.mutate()}
							disabled={deactivateMutation.isPending}
							title={t("admin.activationCodes.deactivate")}
							aria-label={t("admin.activationCodes.deactivate")}
						>
							<BanIcon className="size-4" />
						</Button>
					)}
				</div>
			</TableCell>
		</TableRow>
	);
}

function CreateCodeDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [description, setDescription] = useState("");
	const [durationDays, setDurationDays] = useState("90");
	const [maxUses, setMaxUses] = useState("1");
	const [maxUsers, setMaxUsers] = useState("50");
	const [maxProjects, setMaxProjects] = useState("100");
	const [maxStorageGB] = useState("50");
	const [expiresAt, setExpiresAt] = useState("");

	const createMutation = useMutation({
		mutationFn: () =>
			orpc.superAdmin.activationCodes.admin.create.call({
				description: description || undefined,
				durationDays: Number(durationDays),
				maxUses: Number(maxUses),
				maxUsers: Number(maxUsers),
				maxProjects: Number(maxProjects),
				maxStorageGB: Number(maxStorageGB),
				expiresAt: expiresAt
					? new Date(expiresAt).toISOString()
					: undefined,
			}),
		onSuccess: (data) => {
			toast.success(t("admin.activationCodes.created"));
			navigator.clipboard.writeText(data.code);
			toast.success(t("admin.activationCodes.copied"));
			queryClient.invalidateQueries({
				queryKey: ["superAdmin", "activationCodes"],
			});
			onOpenChange(false);
			// Reset form
			setDescription("");
			setDurationDays("90");
			setMaxUses("1");
			setMaxUsers("50");
			setMaxProjects("100");
			setExpiresAt("");
		},
		onError: () => {
			toast.error(t("admin.activationCodes.createFailed"));
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button onClick={() => onOpenChange(true)}>
					<PlusIcon className="me-2 size-4" />
					{t("admin.activationCodes.createCode")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("admin.activationCodes.createCode")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>
							{t("admin.activationCodes.description")}
						</Label>
						<Input
							value={description}
							onChange={(e: any) => setDescription(e.target.value)}
							placeholder={t(
								"admin.activationCodes.descriptionPlaceholder",
							)}
						/>
					</div>

					<div className="space-y-2">
						<Label>
							{t("admin.activationCodes.durationDays")}
						</Label>
						<Select
							value={durationDays}
							onValueChange={setDurationDays}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="30">
									{t("admin.activationCodes.duration30")}
								</SelectItem>
								<SelectItem value="90">
									{t("admin.activationCodes.duration90")}
								</SelectItem>
								<SelectItem value="180">
									{t("admin.activationCodes.duration180")}
								</SelectItem>
								<SelectItem value="365">
									{t("admin.activationCodes.duration365")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>
								{t("admin.activationCodes.maxUses")}
							</Label>
							<Input
								type="number"
								min={1}
								value={maxUses}
								onChange={(e: any) => setMaxUses(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>
								{t("admin.activationCodes.maxUsers")}
							</Label>
							<Input
								type="number"
								min={1}
								value={maxUsers}
								onChange={(e: any) => setMaxUsers(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>
							{t("admin.activationCodes.maxProjects")}
						</Label>
						<Input
							type="number"
							min={1}
							value={maxProjects}
							onChange={(e: any) => setMaxProjects(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>
							{t("admin.activationCodes.expiresAt")}
						</Label>
						<Input
							type="date"
							value={expiresAt}
							onChange={(e: any) => setExpiresAt(e.target.value)}
							dir="ltr"
						/>
					</div>

					<Button
						className="w-full"
						onClick={() => createMutation.mutate()}
						disabled={createMutation.isPending}
					>
						{createMutation.isPending ? (
							<>
								<LoaderIcon className="me-2 size-4 animate-spin" />
								{t("admin.activationCodes.creating")}
							</>
						) : (
							t("admin.activationCodes.create")
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function UsageSheet({
	codeId,
	open,
	onOpenChange,
}: {
	codeId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.superAdmin.activationCodes.admin.getUsages.queryOptions({
			input: { id: codeId },
		}),
	);

	const usages = data?.usages ?? [];

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>
						{t("admin.activationCodes.usageDetails")}
					</SheetTitle>
				</SheetHeader>

				{data && (
					<p className="font-mono text-sm text-muted-foreground mt-2 mb-4" dir="ltr">
						{data.code}
					</p>
				)}

				{isLoading ? (
					<div className="space-y-2 mt-4">
						<Skeleton className="h-16 rounded-lg" />
						<Skeleton className="h-16 rounded-lg" />
					</div>
				) : usages.length === 0 ? (
					<p className="text-muted-foreground text-center py-8">
						{t("admin.activationCodes.noUsages")}
					</p>
				) : (
					<div className="space-y-3 mt-4">
						{usages.map((usage: any) => (
							<div
								key={usage.id}
								className="rounded-lg border p-3 space-y-1 text-sm"
							>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t(
											"admin.activationCodes.organization",
										)}
									</span>
									<span className="font-medium">
										{usage.organization?.name}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t(
											"admin.activationCodes.activatedBy",
										)}
									</span>
									<span>
										{usage.activatedBy?.name}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t(
											"admin.activationCodes.activatedAt",
										)}
									</span>
									<span>
										{new Date(
											usage.activatedAt,
										).toLocaleDateString("ar-SA")}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{t(
											"admin.activationCodes.planExpiresAt",
										)}
									</span>
									<span>
										{new Date(
											usage.planExpiresAt,
										).toLocaleDateString("ar-SA")}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
