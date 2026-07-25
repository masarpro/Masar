"use client";

import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { Button } from "@ui/components/button";
import { SquareUserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function ImpersonationBanner() {
	const t = useTranslations();
	const { session, user } = useSession();
	const [isStopping, setIsStopping] = useState(false);

	const impersonatedBy = (
		session as { impersonatedBy?: string | null } | null
	)?.impersonatedBy;

	if (!impersonatedBy) {
		return null;
	}

	const stopImpersonating = async () => {
		setIsStopping(true);
		const { error } = await authClient.admin.stopImpersonating();

		if (error) {
			toast.error(
				error.message ||
					t("admin.users.impersonation.banner.stopError"),
			);
			setIsStopping(false);
			return;
		}

		window.location.href = new URL(
			"/app/admin/users",
			window.location.origin,
		).toString();
	};

	return (
		<div className="fixed bottom-4 inset-x-0 z-[60] flex justify-center px-4 print:hidden">
			<div className="flex items-center gap-3 rounded-full border border-amber-300 bg-amber-50 py-1.5 ps-4 pe-1.5 shadow-lg dark:border-amber-700 dark:bg-amber-950">
				<SquareUserRoundIcon className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
				<span className="text-sm font-medium text-amber-900 dark:text-amber-200">
					{t("admin.users.impersonation.banner.browsingAs", {
						name: user?.name ?? user?.email ?? "",
					})}
				</span>
				<Button
					size="sm"
					className="h-7 rounded-full bg-amber-600 text-white hover:bg-amber-700"
					loading={isStopping}
					onClick={stopImpersonating}
				>
					{t("admin.users.impersonation.banner.stop")}
				</Button>
			</div>
		</div>
	);
}
