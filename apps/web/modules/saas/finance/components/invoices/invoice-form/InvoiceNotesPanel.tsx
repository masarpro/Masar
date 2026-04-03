"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { StickyNote, FileText, Paperclip } from "lucide-react";

interface InvoiceNotesPanelProps {
	notes: string;
	paymentTerms: string;
	onNotesChange: (value: string) => void;
	onPaymentTermsChange: (value: string) => void;
}

export function InvoiceNotesPanel({
	notes,
	paymentTerms,
	onNotesChange,
	onPaymentTermsChange,
}: InvoiceNotesPanelProps) {
	const t = useTranslations();

	return (
		<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
			<Tabs defaultValue="notes">
				<div className="flex border-b border-slate-100 dark:border-slate-800/60 px-5">
					<TabsList className="bg-transparent h-auto p-0 gap-0">
						<TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
							<StickyNote className="h-3.5 w-3.5" />
							{t("finance.invoices.notes")}
						</TabsTrigger>
						<TabsTrigger value="terms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
							<FileText className="h-3.5 w-3.5" />
							{t("finance.invoices.paymentTerms")}
						</TabsTrigger>
						<TabsTrigger value="attachments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent px-4 py-3.5 text-[13px] font-medium gap-1.5">
							<Paperclip className="h-3.5 w-3.5" />
							{t("finance.invoices.attachments")}
						</TabsTrigger>
					</TabsList>
				</div>
				<div className="p-5">
					<TabsContent value="notes" className="mt-0">
						<Textarea value={notes} onChange={(e: any) => onNotesChange(e.target.value)} placeholder={t("finance.invoices.notesPlaceholder")} rows={4} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
					</TabsContent>
					<TabsContent value="terms" className="mt-0">
						<Textarea value={paymentTerms} onChange={(e: any) => onPaymentTermsChange(e.target.value)} placeholder={t("finance.invoices.paymentTermsPlaceholder")} rows={4} className="rounded-xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background" />
					</TabsContent>
					<TabsContent value="attachments" className="mt-0">
						<div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
							<Paperclip className="h-8 w-8 text-muted-foreground/50 mb-2" />
							{t("finance.invoices.attachmentsComingSoon")}
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
