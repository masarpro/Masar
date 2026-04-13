"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Button } from "@ui/components/button";
import { Save, Loader2, Receipt, FileSignature, User } from "lucide-react";
import {
	GeneralExpenseTab,
	type GeneralExpenseTabHandle,
} from "./tabs/GeneralExpenseTab";
import {
	SubcontractPaymentTab,
	type SubcontractPaymentTabHandle,
} from "./tabs/SubcontractPaymentTab";
import {
	OwnerDrawingTab,
	type OwnerDrawingTabHandle,
} from "./tabs/OwnerDrawingTab";

type TabValue = "general" | "subcontract" | "owner-drawing";

interface AddExpenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	organizationSlug?: string;
	expenseId?: string | null;
	/**
	 * Fixed project context.
	 * - General tab: hides project selector, always uses this projectId.
	 * - Subcontract / Owner-drawing tabs: pre-selects this project (user can still change).
	 */
	projectId?: string;
	/** Pre-fills source account in General tab (user can still change) */
	initialSourceAccountId?: string;
}

export function AddExpenseDialog({
	open,
	onOpenChange,
	organizationId,
	expenseId,
	projectId,
	initialSourceAccountId,
}: AddExpenseDialogProps) {
	const isEditMode = !!expenseId;
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState<TabValue>("general");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const generalRef = useRef<GeneralExpenseTabHandle>(null);
	const subcontractRef = useRef<SubcontractPaymentTabHandle>(null);
	const ownerDrawingRef = useRef<OwnerDrawingTabHandle>(null);

	// Reset state when dialog opens
	useEffect(() => {
		if (open) {
			setIsSubmitting(false);
			if (isEditMode) {
				setActiveTab("general");
			}
		}
	}, [open, isEditMode]);

	const getActiveRef = useCallback(() => {
		switch (activeTab) {
			case "general":
				return generalRef.current;
			case "subcontract":
				return subcontractRef.current;
			case "owner-drawing":
				return ownerDrawingRef.current;
		}
	}, [activeTab]);

	const handleSubmit = () => {
		setIsSubmitting(true);
		getActiveRef()?.submit();
	};

	const handleClose = () => {
		setIsSubmitting(false);
		generalRef.current?.resetForm();
		subcontractRef.current?.resetForm();
		ownerDrawingRef.current?.resetForm();
		setActiveTab("general");
		onOpenChange(false);
	};

	const handleSuccess = () => {
		setIsSubmitting(false);
		handleClose();
	};

	const handleError = () => {
		setIsSubmitting(false);
	};

	const getSubmitLabel = () => {
		switch (activeTab) {
			case "general":
				return isEditMode
					? t("common.save")
					: t("finance.expenses.create");
			case "subcontract":
				return t("finance.expenses.subcontractPayment.recordPayment");
			case "owner-drawing":
				return t("finance.expenses.ownerDrawingPayment.recordDrawing");
		}
	};

	const getDialogTitle = () => {
		if (isEditMode) return t("finance.expenses.edit");
		switch (activeTab) {
			case "general":
				return t("finance.expenses.new");
			case "subcontract":
				return t("finance.expenses.subcontractPayment.recordPayment");
			case "owner-drawing":
				return t("finance.expenses.ownerDrawingPayment.recordDrawing");
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(val: any) => {
				if (!val) handleClose();
				else onOpenChange(val);
			}}
		>
			<DialogContent
				className="sm:max-w-4xl p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col w-full"
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as TabValue)}
					className="flex flex-col overflow-hidden flex-1"
				>
					{/* Header */}
					<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-3 sm:py-4 shrink-0">
						<DialogTitle className="text-sm sm:text-base font-semibold">
							{getDialogTitle()}
						</DialogTitle>

						{/* Tab triggers — hidden in edit mode */}
						{!isEditMode && (
							<TabsList className="rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mt-2 sm:mt-3 grid grid-cols-3 w-full">
								<TabsTrigger
									value="general"
									className="rounded-lg text-[11px] sm:text-xs px-1 sm:px-3"
								>
									<Receipt className="h-3 w-3 sm:h-3.5 sm:w-3.5 me-1 sm:me-1.5 shrink-0" />
									<span className="truncate">{t("finance.expenses.tabs.general")}</span>
								</TabsTrigger>
								<TabsTrigger
									value="subcontract"
									className="rounded-lg text-[11px] sm:text-xs px-1 sm:px-3"
								>
									<FileSignature className="h-3 w-3 sm:h-3.5 sm:w-3.5 me-1 sm:me-1.5 shrink-0" />
									<span className="truncate">{t("finance.expenses.tabs.subcontract")}</span>
								</TabsTrigger>
								<TabsTrigger
									value="owner-drawing"
									className="rounded-lg text-[11px] sm:text-xs px-1 sm:px-3"
								>
									<User className="h-3 w-3 sm:h-3.5 sm:w-3.5 me-1 sm:me-1.5 shrink-0" />
									<span className="truncate">{t("finance.expenses.tabs.ownerDrawing")}</span>
								</TabsTrigger>
							</TabsList>
						)}
					</DialogHeader>

					{/* Body — scrollable */}
					<div className="p-3 sm:p-5 space-y-4 overflow-y-auto flex-1">
						<TabsContent value="general" className="mt-0">
							<GeneralExpenseTab
								ref={generalRef}
								organizationId={organizationId}
								expenseId={expenseId}
								projectId={projectId}
								initialSourceAccountId={initialSourceAccountId}
								onSuccess={handleSuccess}
								onError={handleError}
							/>
						</TabsContent>
						{!isEditMode && (
							<>
								<TabsContent value="subcontract" className="mt-0">
									<SubcontractPaymentTab
										ref={subcontractRef}
										organizationId={organizationId}
										projectId={projectId}
										onSuccess={handleSuccess}
										onError={handleError}
									/>
								</TabsContent>
								<TabsContent value="owner-drawing" className="mt-0">
									<OwnerDrawingTab
										ref={ownerDrawingRef}
										organizationId={organizationId}
										projectId={projectId}
										onSuccess={handleSuccess}
										onError={handleError}
									/>
								</TabsContent>
							</>
						)}
					</div>

					{/* Footer */}
					<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-3 flex gap-2 sm:gap-3 shrink-0">
						<Button
							type="button"
							variant="outline"
							className="flex-1 rounded-xl h-10"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="button"
							className="flex-1 rounded-xl h-10"
							onClick={handleSubmit}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("common.saving")}
								</>
							) : (
								<>
									<Save className="h-4 w-4 me-2" />
									{getSubmitLabel()}
								</>
							)}
						</Button>
					</div>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
