"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { AddPaymentDialog } from "./AddPaymentDialog";

interface PaymentsHeaderActionsProps {
	organizationSlug: string;
}

export function PaymentsHeaderActions({ organizationSlug }: PaymentsHeaderActionsProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<>
			<Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
				<Plus className="h-4 w-4 me-2" />
				{t("finance.payments.new")}
			</Button>

			<AddPaymentDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
			/>
		</>
	);
}
