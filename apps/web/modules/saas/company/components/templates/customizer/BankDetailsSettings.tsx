"use client";

import { useMemo } from "react";
import type { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Building } from "lucide-react";

export interface BankDetailsSettingsProps {
	selectedBankId: string;
	organizationId: string;
	onUpdate: (settings: Record<string, unknown>) => void;
	t: ReturnType<typeof useTranslations>;
}

export function BankDetailsSettings({
	selectedBankId,
	organizationId,
	onUpdate,
	t,
}: BankDetailsSettingsProps) {
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const bankAccounts = useMemo(
		() => (accountsData?.accounts ?? []).filter((a: any) => a.accountType === "BANK"),
		[accountsData],
	);

	return (
		<div className="space-y-1.5">
			<Label className="text-xs">
				{t("finance.templates.editor.settings.selectBank")}
			</Label>
			<Select
				value={selectedBankId || "default"}
				onValueChange={(v) => onUpdate({ selectedBankId: v === "default" ? "" : v })}
			>
				<SelectTrigger className="h-8 text-xs rounded-lg">
					<SelectValue placeholder={t("finance.templates.editor.settings.selectBankPlaceholder")} />
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					<SelectItem value="default">
						{t("finance.templates.editor.settings.defaultBank")}
					</SelectItem>
					{bankAccounts.map((account: any) => (
						<SelectItem key={account.id} value={account.id}>
							<div className="flex items-center gap-2">
								<Building className="h-3.5 w-3.5 text-blue-500" />
								<span>{account.name}</span>
								{account.bankName && (
									<span className="text-muted-foreground">({account.bankName})</span>
								)}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
