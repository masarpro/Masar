"use client";

import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Skeleton } from "@ui/components/skeleton";
import {
	FileCheck,
	QrCode,
	Zap,
	ExternalLink,
	Shield,
	AlertCircle,
	CheckCircle2,
	XCircle,
	Clock,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ZatcaSettingsPageProps {
	organizationId: string;
	organizationSlug: string;
}

/** Local type — matches getStatus return shape (Prisma client may be stale) */
interface ZatcaStatusData {
	phase: "1" | "2";
	environment: "sandbox" | "simulation" | "production";
	devices: Array<{
		id: string;
		deviceName: string;
		invoiceType: string;
		status: string;
		onboardedAt: string | null;
		csidExpiresAt: string | null;
		lastError: string | null;
		invoiceCounter: number;
		createdAt: string;
		updatedAt: string;
	}>;
	stats: {
		total: number;
		cleared: number;
		reported: number;
		rejected: number;
		pending: number;
		failed: number;
	};
}

const STATUS_COLORS: Record<string, string> = {
	DISABLED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	ONBOARDING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	COMPLIANCE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	REVOKED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ZatcaSettingsPage({ organizationId, organizationSlug }: ZatcaSettingsPageProps) {
	const t = useTranslations("zatca");
	const queryClient = useQueryClient();
	const [onboardingOpen, setOnboardingOpen] = useState(false);
	const [otp, setOtp] = useState("");
	const [invoiceType, setInvoiceType] = useState<"STANDARD" | "SIMPLIFIED">("STANDARD");
	const [revokeDeviceId, setRevokeDeviceId] = useState<string | null>(null);

	// ─── Query ──────────────────────────────────────────────────────
	const { data: rawData, isLoading } = useQuery(
		orpc.zatca.getStatus.queryOptions({
			input: { organizationId },
		}),
	);
	const data = rawData as ZatcaStatusData | undefined;

	// ─── Mutations ──────────────────────────────────────────────────
	const onboardMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.zatca.startOnboarding({
				organizationId,
				otp,
				invoiceType,
			});
		},
		onSuccess: (result) => {
			toast.success(t("onboarding.success"));
			setOnboardingOpen(false);
			setOtp("");
			queryClient.invalidateQueries({ queryKey: ["zatca"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("onboarding.error"));
		},
	});

	const revokeMutation = useMutation({
		mutationFn: async (deviceId: string) => {
			return orpcClient.zatca.revokeDevice({
				organizationId,
				deviceId,
			});
		},
		onSuccess: () => {
			toast.success(t("device.revoke"));
			setRevokeDeviceId(null);
			queryClient.invalidateQueries({ queryKey: ["zatca"] });
		},
		onError: (error: any) => {
			toast.error(error.message);
		},
	});

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-5 w-96" />
				<Skeleton className="h-40 w-full rounded-2xl" />
			</div>
		);
	}

	const phase = data?.phase ?? "1";
	const devices = data?.devices ?? [];
	const stats = data?.stats;
	const environment = data?.environment ?? "simulation";
	const isSandbox = environment === "sandbox";
	const envLabel =
		environment === "production"
			? "إنتاج (Production)"
			: environment === "simulation"
				? "محاكاة (Simulation)"
				: "تجريبي (Sandbox)";
	const fatooraPortalUrl =
		environment === "production"
			? "https://fatoora.zatca.gov.sa"
			: "https://fatoora.zatca.gov.sa/Onboarding/PreProduction";

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			{/* Phase Cards */}
			<div className="grid gap-4 sm:grid-cols-2">
				{/* Phase 1 */}
				<div className={`relative rounded-2xl border-2 p-5 transition-colors ${
					phase === "1"
						? "border-primary bg-primary/5"
						: "border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
				}`}>
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
							<QrCode className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<h3 className="font-semibold text-foreground">{t("phase1.title")}</h3>
								{phase === "1" && (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
										<CheckCircle2 className="h-3 w-3" />
										{t("phase1.active")}
									</span>
								)}
							</div>
							<p className="text-sm text-muted-foreground mt-1">{t("phase1.description")}</p>
						</div>
					</div>
				</div>

				{/* Phase 2 */}
				<div className={`relative rounded-2xl border-2 p-5 transition-colors ${
					phase === "2"
						? "border-primary bg-primary/5"
						: "border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80"
				}`}>
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
							<Zap className="h-5 w-5 text-primary" />
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<h3 className="font-semibold text-foreground">{t("phase2.title")}</h3>
								{phase === "2" && (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
										<CheckCircle2 className="h-3 w-3" />
										{t("phase2.active")}
									</span>
								)}
							</div>
							<p className="text-sm text-muted-foreground mt-1">{t("phase2.description")}</p>
							{phase === "1" && (
								<Button
									variant="primary"
									size="sm"
									className="mt-3"
									onClick={() => setOnboardingOpen(true)}
								>
									<Zap className="h-4 w-4 me-2" />
									{t("phase2.activate")}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Devices Table */}
			{devices.length > 0 && (
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-sm overflow-hidden">
					<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
						<Shield className="h-4 w-4 text-primary" />
						<span className="text-sm font-semibold text-foreground">{t("device.title")}</span>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-slate-100 dark:border-slate-800/40">
									<th className="p-3 text-start text-xs font-semibold text-muted-foreground">{t("device.name")}</th>
									<th className="p-3 text-start text-xs font-semibold text-muted-foreground">{t("device.type")}</th>
									<th className="p-3 text-start text-xs font-semibold text-muted-foreground">{t("device.counter")}</th>
									<th className="p-3 text-start text-xs font-semibold text-muted-foreground">{t("status.ACTIVE")}</th>
									<th className="p-3 w-10" />
								</tr>
							</thead>
							<tbody>
								{devices.map((device) => (
									<Fragment key={device.id}>
										<tr className="border-b border-slate-50 dark:border-slate-800/30 last:border-0">
											<td className="p-3 font-medium text-sm">{device.deviceName}</td>
											<td className="p-3 text-sm text-muted-foreground">
												{device.invoiceType === "STANDARD" ? t("device.standard") : t("device.simplified")}
											</td>
											<td className="p-3 text-sm font-mono">{device.invoiceCounter}</td>
											<td className="p-3">
												<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[device.status] ?? STATUS_COLORS.DISABLED}`}>
													{t(`status.${device.status}`)}
												</span>
											</td>
											<td className="p-3">
												{device.status === "ACTIVE" && (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
														onClick={() => setRevokeDeviceId(device.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												)}
											</td>
										</tr>
										{device.lastError && device.status !== "ACTIVE" && (
											<tr className="border-b border-slate-50 dark:border-slate-800/30">
												<td colSpan={5} className="px-3 pb-3">
													<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
														<AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
														<span className="font-mono break-all">{device.lastError}</span>
													</div>
												</td>
											</tr>
										)}
									</Fragment>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Stats */}
			{stats && stats.total > 0 && (
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-sm overflow-hidden">
					<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
						<FileCheck className="h-4 w-4 text-primary" />
						<span className="text-sm font-semibold text-foreground">{t("stats.title")}</span>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-5">
						<StatCard label={t("stats.total")} value={stats.total} icon={<FileCheck className="h-4 w-4" />} color="text-slate-600" />
						<StatCard label={t("stats.cleared")} value={stats.cleared} icon={<CheckCircle2 className="h-4 w-4" />} color="text-green-600" />
						<StatCard label={t("stats.reported")} value={stats.reported} icon={<CheckCircle2 className="h-4 w-4" />} color="text-blue-600" />
						<StatCard label={t("stats.rejected")} value={stats.rejected} icon={<XCircle className="h-4 w-4" />} color="text-red-600" />
						<StatCard label={t("stats.pending")} value={stats.pending} icon={<Clock className="h-4 w-4" />} color="text-amber-600" />
					</div>
				</div>
			)}

			{/* ─── Onboarding Dialog ───────────────────────────────────── */}
			<Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("onboarding.title")}</DialogTitle>
						<DialogDescription>{t("subtitle")}</DialogDescription>
					</DialogHeader>

					{/* Environment indicator */}
					<div
						className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
							isSandbox
								? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
								: environment === "production"
									? "border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-200"
									: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
						}`}
					>
						<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
						<div className="flex-1">
							<p className="font-semibold">البيئة الحالية: {envLabel}</p>
							{isSandbox ? (
								<p className="mt-0.5">
									بيئة sandbox محجوبة من ZATCA. غيّر متغيّر <code className="font-mono">ZATCA_ENVIRONMENT</code> إلى
									<code className="font-mono"> simulation</code> أو
									<code className="font-mono"> production</code> ثم أعد المحاولة.
								</p>
							) : (
								<p className="mt-0.5">
									تأكّد أن رمز OTP من بوابة Fatoora <strong>{environment === "production" ? "الإنتاج" : "Simulation"}</strong>{" "}
									(صلاحية ~ساعة، يُستخدم مرة واحدة).
								</p>
							)}
						</div>
					</div>

					<div className="space-y-6 py-4">
						{/* Step 1 */}
						<div className="flex gap-3">
							<div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</div>
							<div>
								<p className="font-medium text-sm">{t("onboarding.step1Title")}</p>
								<p className="text-sm text-muted-foreground mt-0.5">{t("onboarding.step1Description")}</p>
								<a
									href={fatooraPortalUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1.5"
								>
									{t("onboarding.fatooraLink")}
									<ExternalLink className="h-3 w-3" />
								</a>
							</div>
						</div>

						{/* Step 2 */}
						<div className="flex gap-3">
							<div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</div>
							<div>
								<p className="font-medium text-sm">{t("onboarding.step2Title")}</p>
								<p className="text-sm text-muted-foreground mt-0.5">{t("onboarding.step2Description")}</p>
							</div>
						</div>

						{/* Step 3 — OTP Input */}
						<div className="flex gap-3">
							<div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</div>
							<div className="flex-1 space-y-3">
								<p className="font-medium text-sm">{t("onboarding.step3Title")}</p>
								<div>
									<Label htmlFor="otp">{t("onboarding.otpLabel")}</Label>
									<Input
										id="otp"
										value={otp}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
										placeholder={t("onboarding.otpPlaceholder")}
										maxLength={6}
										className="mt-1 font-mono tracking-widest text-center text-lg"
										dir="ltr"
									/>
									<p className="text-xs text-muted-foreground mt-1">{t("onboarding.otpHelp")}</p>
								</div>

								<div>
									<Label>{t("onboarding.invoiceTypeLabel")}</Label>
									<Select
										value={invoiceType}
										onValueChange={(v: string) => setInvoiceType(v as "STANDARD" | "SIMPLIFIED")}
									>
										<SelectTrigger className="mt-1">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="STANDARD">{t("onboarding.invoiceTypeStandard")}</SelectItem>
											<SelectItem value="SIMPLIFIED">{t("onboarding.invoiceTypeSimplified")}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>

					<Button
						className="w-full"
						disabled={otp.length !== 6 || onboardMutation.isPending}
						onClick={() => onboardMutation.mutate()}
					>
						{onboardMutation.isPending ? (
							<>
								<span className="animate-spin me-2">&#9696;</span>
								{t("onboarding.activating")}
							</>
						) : (
							<>
								<Zap className="h-4 w-4 me-2" />
								{t("onboarding.activateButton")}
							</>
						)}
					</Button>
				</DialogContent>
			</Dialog>

			{/* ─── Revoke Confirmation Dialog ─────────────────────────── */}
			<Dialog open={!!revokeDeviceId} onOpenChange={() => setRevokeDeviceId(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<AlertCircle className="h-5 w-5" />
							{t("device.revoke")}
						</DialogTitle>
						<DialogDescription>{t("device.revokeConfirm")}</DialogDescription>
					</DialogHeader>
					<div className="flex gap-3 justify-end pt-4">
						<Button variant="outline" onClick={() => setRevokeDeviceId(null)}>
							{t("onboarding.error") /* Cancel — reuse */}
						</Button>
						<Button
							variant="error"
							disabled={revokeMutation.isPending}
							onClick={() => revokeDeviceId && revokeMutation.mutate(revokeDeviceId)}
						>
							{t("device.revoke")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Stat Card ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
	return (
		<div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
			<div className={`flex items-center justify-center mb-1 ${color}`}>{icon}</div>
			<div className="text-2xl font-bold text-foreground">{value}</div>
			<div className="text-xs text-muted-foreground">{label}</div>
		</div>
	);
}
