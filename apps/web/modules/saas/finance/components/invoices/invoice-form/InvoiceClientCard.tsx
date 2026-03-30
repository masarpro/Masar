"use client";

import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import { User, Plus } from "lucide-react";
import { ClientSelector, type Client } from "../../shared/ClientSelector";

interface InvoiceClientCardProps {
	organizationId: string;
	clientId?: string;
	clientName: string;
	clientCompany: string;
	clientPhone: string;
	clientEmail: string;
	clientAddress: string;
	clientTaxNumber: string;
	clientDetailsOpen: boolean;
	onClientSelect: (client: Client | null) => void;
	onClientDetailsToggle: () => void;
	onShowNewClientDialog: () => void;
	onClientNameChange: (value: string) => void;
	onClientCompanyChange: (value: string) => void;
	onClientPhoneChange: (value: string) => void;
	onClientEmailChange: (value: string) => void;
	onClientAddressChange: (value: string) => void;
	onClientTaxNumberChange: (value: string) => void;
}

export function InvoiceClientCard({
	organizationId,
	clientId,
	clientName,
	clientCompany,
	clientPhone,
	clientEmail,
	clientAddress,
	clientTaxNumber,
	clientDetailsOpen,
	onClientSelect,
	onClientDetailsToggle,
	onShowNewClientDialog,
	onClientNameChange,
	onClientCompanyChange,
	onClientPhoneChange,
	onClientEmailChange,
	onClientAddressChange,
	onClientTaxNumberChange,
}: InvoiceClientCardProps) {
	const t = useTranslations();

	return (
		<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
				<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center">
					<User className="h-[15px] w-[15px] text-blue-500" />
				</div>
				<span className="text-sm font-semibold text-foreground">{t("finance.invoices.clientInfo")}</span>
				<Button type="button" variant="ghost" size="sm" onClick={onShowNewClientDialog} className="ms-auto rounded-lg h-7 text-xs border border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 px-3">
					<Plus className="h-3 w-3 me-1" />
					{t("finance.clients.addClient")}
				</Button>
			</div>
			<div className="p-5 space-y-3">
				<ClientSelector organizationId={organizationId} onSelect={onClientSelect} selectedClientId={clientId} />

				{clientName && (
					<div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/15 px-4 py-3 space-y-1.5">
						<div className="flex items-center justify-between">
							<span className="font-medium text-sm">{clientName}</span>
							{clientTaxNumber && (
								<Badge variant="outline" className="text-[10px] font-mono h-5">{clientTaxNumber}</Badge>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
							{clientCompany && <span>{clientCompany}</span>}
							{clientPhone && <span dir="ltr">{clientPhone}</span>}
							{clientEmail && <span dir="ltr">{clientEmail}</span>}
						</div>
						<button type="button" onClick={onClientDetailsToggle} className="text-xs text-primary hover:underline mt-0.5">
							{clientDetailsOpen ? t("common.close") : t("common.edit")}
						</button>
					</div>
				)}

				{clientDetailsOpen && (
					<div className="grid gap-3 sm:grid-cols-2 pt-1">
						<div>
							<Label className="text-xs">{t("finance.invoices.clientName")} *</Label>
							<Input value={clientName} onChange={(e) => onClientNameChange(e.target.value)} placeholder={t("finance.invoices.clientNamePlaceholder")} required className="rounded-xl mt-1 h-9" />
						</div>
						<div>
							<Label className="text-xs">{t("finance.invoices.clientCompany")}</Label>
							<Input value={clientCompany} onChange={(e) => onClientCompanyChange(e.target.value)} placeholder={t("finance.invoices.clientCompanyPlaceholder")} className="rounded-xl mt-1 h-9" />
						</div>
						<div>
							<Label className="text-xs">{t("finance.invoices.clientPhone")}</Label>
							<Input value={clientPhone} onChange={(e) => onClientPhoneChange(e.target.value)} placeholder="05xxxxxxxx" className="rounded-xl mt-1 h-9" />
						</div>
						<div>
							<Label className="text-xs">{t("finance.invoices.clientEmail")}</Label>
							<Input type="email" value={clientEmail} onChange={(e) => onClientEmailChange(e.target.value)} placeholder="email@example.com" className="rounded-xl mt-1 h-9" />
						</div>
						<div>
							<Label className="text-xs">{t("finance.invoices.clientTaxNumber")} *</Label>
							<Input value={clientTaxNumber} onChange={(e) => onClientTaxNumberChange(e.target.value)} placeholder={t("finance.invoices.taxNumberPlaceholder")} required className="rounded-xl mt-1 h-9" />
						</div>
						<div>
							<Label className="text-xs">{t("finance.invoices.clientAddress")}</Label>
							<Input value={clientAddress} onChange={(e) => onClientAddressChange(e.target.value)} placeholder={t("finance.invoices.addressPlaceholder")} className="rounded-xl mt-1 h-9" />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
