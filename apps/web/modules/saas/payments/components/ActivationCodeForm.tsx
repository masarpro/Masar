"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { CheckCircle2Icon, LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function ActivationCodeForm() {
	const t = useTranslations();
	const router = useRouter();
	const [code, setCode] = useState("");
	const [validatedData, setValidatedData] = useState<{
		planType: string;
		durationDays: number;
		maxUsers: number;
		maxProjects: number;
		maxStorageGB: number;
	} | null>(null);

	const validateMutation = useMutation({
		mutationFn: (codeValue: string) =>
			orpc.activationCodes.validate.call({ code: codeValue }),
		onSuccess: (data) => {
			setValidatedData(data);
		},
		onError: (error: any) => {
			setValidatedData(null);
			toast.error(error?.message ?? t("choosePlan.activateFailed"));
		},
	});

	const activateMutation = useMutation({
		mutationFn: (codeValue: string) =>
			orpc.activationCodes.activate.call({ code: codeValue }),
		onSuccess: (data) => {
			toast.success(t("choosePlan.activateSuccess"));
			router.push(data.orgSlug ? `/app/${data.orgSlug}` : "/app");
		},
		onError: (error: any) => {
			toast.error(error?.message ?? t("choosePlan.activateFailed"));
		},
	});

	const handleVerify = () => {
		if (!code.trim()) return;
		validateMutation.mutate(code.trim());
	};

	const handleActivate = () => {
		if (!code.trim()) return;
		activateMutation.mutate(code.trim());
	};

	return (
		<div className="space-y-4">
			<h3 className="font-semibold text-lg text-center">
				{t("choosePlan.haveCode")}
			</h3>

			<div className="flex gap-2">
				<Input
					placeholder={t("choosePlan.codePlaceholder")}
					value={code}
					onChange={(e) => {
						setCode(e.target.value.toUpperCase());
						setValidatedData(null);
					}}
					className="font-mono text-center tracking-wider"
					dir="ltr"
				/>
				<Button
					onClick={handleVerify}
					disabled={!code.trim() || validateMutation.isPending}
					variant="outline"
				>
					{validateMutation.isPending ? (
						<>
							<LoaderIcon className="me-2 size-4 animate-spin" />
							{t("choosePlan.verifying")}
						</>
					) : (
						t("choosePlan.verify")
					)}
				</Button>
			</div>

			{validatedData && (
				<div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 space-y-3">
					<div className="flex items-center gap-2 text-green-700 dark:text-green-400">
						<CheckCircle2Icon className="size-5" />
						<span className="font-semibold">
							{t("choosePlan.codeValid")}
						</span>
					</div>

					<div className="grid grid-cols-2 gap-2 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("choosePlan.plan")}:
							</span>{" "}
							<span className="font-medium">
								{validatedData.planType}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("choosePlan.duration")}:
							</span>{" "}
							<span className="font-medium">
								{validatedData.durationDays}{" "}
								{t("choosePlan.daysUnit")}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("admin.activationCodes.maxUsers")}:
							</span>{" "}
							<span className="font-medium">
								{validatedData.maxUsers}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("admin.activationCodes.maxProjects")}:
							</span>{" "}
							<span className="font-medium">
								{validatedData.maxProjects}
							</span>
						</div>
					</div>

					<Button
						onClick={handleActivate}
						disabled={activateMutation.isPending}
						className="w-full"
					>
						{activateMutation.isPending ? (
							<>
								<LoaderIcon className="me-2 size-4 animate-spin" />
								{t("choosePlan.activating")}
							</>
						) : (
							t("choosePlan.activateCode")
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
