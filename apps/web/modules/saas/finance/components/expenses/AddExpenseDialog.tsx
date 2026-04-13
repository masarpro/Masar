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
	organizationSlug: string;
	expenseId?: string | null;
}

export function AddExpenseDialog({
	open,
	onOpenChange,
	organizationId,
	expenseId,
}: AddExpenseDialogProps) {
	const isEditMode = !!expenseId;
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState<TabValue>("general");

	const generalRef = useRef<GeneralExpenseTabHandle>(null);
	const subcontractRef = useRef<SubcontractPaymentTabHandle>(null);
	const ownerDrawingRef = useRef<OwnerDrawingTabHandle>(null);

	// Reset to general tab when dialog opens in edit mode
	useEffect(() => {
		if (open && isEditMode) {
			setActiveTab("general");
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
		getActiveRef()?.submit();
	};

	const handleClose = () => {
		generalRef.current?.resetForm();
		subcontractRef.current?.resetForm();
		ownerDrawingRef.current?.resetForm();
		setActiveTab("general");
		onOpenChange(false);
	};

	const handleSuccess = () => {
		handleClose();
	};

	const isSubmitting = (() => {
		const ref = getActiveRef();
		return ref?.isSubmitting ?? false;
	})();

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
				className="sm:max-w-4xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
			>
				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as TabValue)}
					className="flex flex-col overflow-hidden flex-1"
				>
					{/* Header */}
					<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4 shrink-0">
						<DialogTitle className="text-base font-semibold">
							{getDialogTitle()}
						</DialogTitle>

						{/* Tab triggers — hidden in edit mode */}
						{!isEditMode && (
							<TabsList className="rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mt-3 grid grid-cols-3 w-full">
								<TabsTrigger
									value="general"
									className="rounded-lg text-xs"
								>
									<Receipt className="h-3.5 w-3.5 me-1.5" />
									{t("finance.expenses.tabs.general")}
								</TabsTrigger>
								<TabsTrigger
									value="subcontract"
									className="rounded-lg text-xs"
								>
									<FileSignature className="h-3.5 w-3.5 me-1.5" />
									{t("finance.expenses.tabs.subcontract")}
								</TabsTrigger>
								<TabsTrigger
									value="owner-drawing"
									className="rounded-lg text-xs"
								>
									<User className="h-3.5 w-3.5 me-1.5" />
									{t("finance.expenses.tabs.ownerDrawing")}
								</TabsTrigger>
							</TabsList>
						)}
					</DialogHeader>

					{/* Body — scrollable */}
					<div className="p-5 space-y-4 overflow-y-auto flex-1">
						<TabsContent value="general" className="mt-0">
							<GeneralExpenseTab
								ref={generalRef}
								organizationId={organizationId}
								expenseId={expenseId}
								onSuccess={handleSuccess}
							/>
						</TabsContent>
						{!isEditMode && (
							<>
								<TabsContent value="subcontract" className="mt-0">
									<SubcontractPaymentTab
										ref={subcontractRef}
										organizationId={organizationId}
										onSuccess={handleSuccess}
									/>
								</TabsContent>
								<TabsContent value="owner-drawing" className="mt-0">
									<OwnerDrawingTab
										ref={ownerDrawingRef}
										organizationId={organizationId}
										onSuccess={handleSuccess}
									/>
								</TabsContent>
							</>
						)}
					</div>

					{/* Footer */}
					<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex gap-3 shrink-0">
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
