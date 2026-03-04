"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { CheckCircle, Plus, Trash2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface InviteRow {
	id: string;
	email: string;
	role: "member" | "admin";
	status?: "sent" | "failed";
}

interface InviteTeamStepProps {
	organizationId: string;
	onNext: () => void;
	onSkip: () => void;
	onInvitesSent: (count: number) => void;
}

export function InviteTeamStep({
	organizationId,
	onNext,
	onSkip,
	onInvitesSent,
}: InviteTeamStepProps) {
	const t = useTranslations();
	const [invites, setInvites] = useState<InviteRow[]>([
		{ id: "1", email: "", role: "member" },
	]);
	const [results, setResults] = useState<
		Array<{ email: string; status: "sent" | "failed" }>
	>([]);
	const [submitted, setSubmitted] = useState(false);

	const inviteMutation = useMutation(
		orpc.onboarding.inviteTeamMembers.mutationOptions(),
	);

	const addRow = () => {
		if (invites.length >= 5) return;
		setInvites((prev) => [
			...prev,
			{ id: String(Date.now()), email: "", role: "member" },
		]);
	};

	const removeRow = (id: string) => {
		if (invites.length <= 1) return;
		setInvites((prev) => prev.filter((inv) => inv.id !== id));
	};

	const updateRow = (
		id: string,
		field: "email" | "role",
		value: string,
	) => {
		setInvites((prev) =>
			prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv)),
		);
	};

	const handleInvite = async () => {
		const validInvites = invites.filter((inv) => inv.email.includes("@"));
		if (validInvites.length === 0) {
			toast.error("أدخل بريد إلكتروني واحد على الأقل");
			return;
		}

		try {
			const result = await inviteMutation.mutateAsync({
				organizationId,
				invitations: validInvites.map((inv) => ({
					email: inv.email,
					role: inv.role,
				})),
			});

			setResults(result.results);
			setSubmitted(true);
			onInvitesSent(result.successCount);

			// Auto-advance after showing results
			setTimeout(() => {
				onNext();
			}, 2000);
		} catch {
			toast.error("فشل إرسال الدعوات");
		}
	};

	if (submitted && results.length > 0) {
		return (
			<div>
				<h2 className="text-2xl font-bold">
					{t("onboarding.wizard.inviteTeam.title")}
				</h2>
				<div className="mt-6 space-y-3">
					{results.map((result) => (
						<div
							key={result.email}
							className="flex items-center gap-3 rounded-lg border p-3"
						>
							{result.status === "sent" ? (
								<CheckCircle className="h-5 w-5 text-green-500" />
							) : (
								<XCircle className="h-5 w-5 text-red-500" />
							)}
							<span className="flex-1" dir="ltr">
								{result.email}
							</span>
							<span
								className={`text-sm ${result.status === "sent" ? "text-green-600" : "text-red-600"}`}
							>
								{result.status === "sent"
									? t("onboarding.wizard.inviteTeam.sent")
									: t("onboarding.wizard.inviteTeam.failed")}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div>
			<h2 className="text-2xl font-bold">
				{t("onboarding.wizard.inviteTeam.title")}
			</h2>
			<p className="mt-1 text-muted-foreground">
				{t("onboarding.wizard.inviteTeam.subtitle")}
			</p>

			<div className="mt-6 space-y-3">
				{invites.map((invite) => (
					<div key={invite.id} className="flex items-center gap-2">
						<Input
							type="email"
							value={invite.email}
							onChange={(e) =>
								updateRow(invite.id, "email", e.target.value)
							}
							placeholder={t(
								"onboarding.wizard.inviteTeam.emailPlaceholder",
							)}
							dir="ltr"
							className="flex-1"
						/>
						<Select
							value={invite.role}
							onValueChange={(value) =>
								updateRow(invite.id, "role", value)
							}
						>
							<SelectTrigger className="w-28">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="member">
									{t("onboarding.wizard.inviteTeam.member")}
								</SelectItem>
								<SelectItem value="admin">
									{t("onboarding.wizard.inviteTeam.admin")}
								</SelectItem>
							</SelectContent>
						</Select>
						{invites.length > 1 && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => removeRow(invite.id)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				))}

				{invites.length < 5 && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addRow}
						className="w-full"
					>
						<Plus className="mr-1 h-4 w-4" />
						{t("onboarding.wizard.inviteTeam.addAnother")}
					</Button>
				)}
			</div>

			<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
				<Button variant="ghost" onClick={onSkip}>
					{t("onboarding.wizard.inviteTeam.skip")}
				</Button>
				<Button
					size="lg"
					onClick={handleInvite}
					loading={inviteMutation.isPending}
				>
					{t("onboarding.wizard.inviteTeam.invite")}
				</Button>
			</div>
		</div>
	);
}
