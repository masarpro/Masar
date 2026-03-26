"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ui/components/table";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { Progress } from "@ui/components/progress";
import { toast } from "sonner";
import {
	ArrowRight, Send, CheckCircle, Printer, Trash2, Pencil, Plus,
	Download, Calendar, MapPin, User, Shield, FileText, Clock,
} from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "@saas/finance/components/shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { HandoverItemDialog } from "./HandoverItemDialog";

interface HandoverProtocolDetailProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	protocolId: string;
}

const TYPE_COLORS: Record<string, string> = {
	ITEM_ACCEPTANCE: "bg-blue-100 text-blue-700",
	PRELIMINARY: "bg-purple-100 text-purple-700",
	FINAL: "bg-green-100 text-green-700",
	DELIVERY: "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-700",
	PENDING_SIGNATURES: "bg-amber-100 text-amber-700",
	PARTIALLY_SIGNED: "bg-orange-100 text-orange-700",
	COMPLETED: "bg-green-100 text-green-700",
	ARCHIVED: "bg-gray-200 text-gray-600",
};

const QUALITY_COLORS: Record<string, string> = {
	EXCELLENT: "bg-green-100 text-green-700",
	GOOD: "bg-blue-100 text-blue-700",
	ACCEPTABLE: "bg-amber-100 text-amber-700",
	NEEDS_REWORK: "bg-orange-100 text-orange-700",
	REJECTED: "bg-red-100 text-red-700",
};

export function HandoverProtocolDetail({
	organizationId,
	organizationSlug,
	projectId,
	protocolId,
}: HandoverProtocolDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [showCompleteDialog, setShowCompleteDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showItemDialog, setShowItemDialog] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);

	const basePath = `/app/${organizationSlug}/projects/${projectId}/handover`;

	const { data: rawProtocol, isLoading } = useQuery(
		orpc.handover.getById.queryOptions({
			input: { organizationId, id: protocolId },
		}),
	);
	const protocol = rawProtocol as any;

	const invalidate = () => queryClient.invalidateQueries({ queryKey: ["handover"] });

	const submitMutation = useMutation({
		mutationFn: () => orpcClient.handover.submit({ organizationId, id: protocolId }),
		onSuccess: () => { invalidate(); toast.success(t("handover.actions.submit")); setShowSubmitDialog(false); },
		onError: (e: any) => toast.error(e.message || t("common.error")),
	});

	const completeMutation = useMutation({
		mutationFn: () => orpcClient.handover.complete({ organizationId, id: protocolId }),
		onSuccess: () => { invalidate(); toast.success(t("handover.actions.complete")); setShowCompleteDialog(false); },
		onError: () => toast.error(t("common.error")),
	});

	const deleteMutation = useMutation({
		mutationFn: () => orpcClient.handover.delete({ organizationId, id: protocolId }),
		onSuccess: () => { invalidate(); toast.success(t("handover.actions.delete")); router.push(basePath); },
		onError: () => toast.error(t("common.error")),
	});

	const signMutation = useMutation({
		mutationFn: (partyIndex: number) => orpcClient.handover.sign({ organizationId, id: protocolId, partyIndex }),
		onSuccess: () => { invalidate(); toast.success(t("handover.parties.sign")); },
		onError: () => toast.error(t("common.error")),
	});

	const importContractMutation = useMutation({
		mutationFn: () => orpcClient.handover.items.importFromContract({ organizationId, protocolId }),
		onSuccess: (data) => { invalidate(); toast.success(t("handover.items.importedCount", { count: (data as any).importedCount })); },
		onError: () => toast.error(t("common.error")),
	});

	const importBOQMutation = useMutation({
		mutationFn: () => orpcClient.handover.items.importFromBOQ({ organizationId, protocolId }),
		onSuccess: (data) => { invalidate(); toast.success(t("handover.items.importedCount", { count: (data as any).importedCount })); },
		onError: () => toast.error(t("common.error")),
	});

	const deleteItemMutation = useMutation({
		mutationFn: (itemId: string) => orpcClient.handover.items.delete({ organizationId, protocolId, itemId }),
		onSuccess: () => { invalidate(); },
	});

	if (isLoading || !protocol) return <ListTableSkeleton rows={8} cols={2} />;

	const parties = (protocol.parties as any[]) ?? [];
	const canEdit = protocol.status === "DRAFT";
	const canSign = ["PENDING_SIGNATURES", "PARTIALLY_SIGNED"].includes(protocol.status);
	const canAddItems = ["DRAFT", "PENDING_SIGNATURES"].includes(protocol.status);

	// Warranty calculation for PRELIMINARY
	let warrantyProgress = 0;
	let daysRemaining = 0;
	if (protocol.type === "PRELIMINARY" && protocol.warrantyStartDate && protocol.warrantyEndDate) {
		const now = new Date();
		const start = new Date(protocol.warrantyStartDate);
		const end = new Date(protocol.warrantyEndDate);
		const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
		const elapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
		warrantyProgress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
		daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
						<ArrowRight className="h-4 w-4" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold font-mono">{protocol.protocolNo}</h1>
							<Badge className={TYPE_COLORS[protocol.type] ?? ""}>{t(`handover.types.${protocol.type}`)}</Badge>
							<Badge className={STATUS_COLORS[protocol.status] ?? ""}>{t(`handover.statuses.${protocol.status}`)}</Badge>
						</div>
						<p className="text-sm text-muted-foreground">{protocol.title}</p>
					</div>
				</div>
				<div className="flex gap-2">
					{canEdit && (
						<>
							<Button onClick={() => setShowSubmitDialog(true)}>
								<Send className="me-2 h-4 w-4" />{t("handover.actions.submit")}
							</Button>
							<Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
								<Trash2 className="h-4 w-4" />
							</Button>
						</>
					)}
					{canSign && (
						<Button onClick={() => setShowCompleteDialog(true)}>
							<CheckCircle className="me-2 h-4 w-4" />{t("handover.actions.complete")}
						</Button>
					)}
					{protocol.status === "COMPLETED" && (
						<Button variant="outline" onClick={() => window.print()}>
							<Printer className="me-2 h-4 w-4" />{t("handover.actions.print")}
						</Button>
					)}
				</div>
			</div>

			{/* Info Cards */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Card>
					<CardHeader><CardTitle>{t("handover.protocol")}</CardTitle></CardHeader>
					<CardContent className="space-y-3">
						<InfoRow icon={<Calendar className="h-4 w-4" />} label={t("handover.date")} value={formatDate(protocol.date)} />
						{protocol.location && <InfoRow icon={<MapPin className="h-4 w-4" />} label={t("handover.location")} value={protocol.location} />}
						{protocol.project && <InfoRow label={t("common.project")} value={protocol.project.name} />}
						{protocol.subcontractContract && <InfoRow label={t("handover.subcontractRequired")} value={protocol.subcontractContract.name} />}
						{protocol.description && <InfoRow label={t("handover.description")} value={protocol.description} />}
						{protocol.conditions && <InfoRow label={t("handover.conditions")} value={protocol.conditions} />}
						<InfoRow icon={<User className="h-4 w-4" />} label={t("common.createdBy")} value={protocol.createdBy?.name ?? "-"} />
					</CardContent>
				</Card>

				{/* Warranty Card (PRELIMINARY) */}
				{protocol.type === "PRELIMINARY" && protocol.warrantyEndDate && (
					<Card>
						<CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />{t("handover.warranty.title")}</CardTitle></CardHeader>
						<CardContent className="space-y-4">
							<InfoRow label={t("handover.warranty.months")} value={`${protocol.warrantyMonths ?? 12} ${t("handover.warranty.months")}`} />
							{protocol.warrantyStartDate && <InfoRow label={t("handover.warranty.startDate")} value={formatDate(protocol.warrantyStartDate)} />}
							<InfoRow label={t("handover.warranty.endDate")} value={formatDate(protocol.warrantyEndDate)} />
							<div>
								<div className="flex justify-between text-sm mb-1">
									<span>{t("handover.warranty.daysRemaining")}</span>
									<span className={daysRemaining <= 30 ? "text-red-600 font-medium" : ""}>{daysRemaining}</span>
								</div>
								<Progress value={warrantyProgress} className="h-2" />
							</div>
						</CardContent>
					</Card>
				)}

				{/* Retention Card (FINAL) */}
				{protocol.type === "FINAL" && protocol.retentionReleaseAmount && (
					<Card>
						<CardHeader><CardTitle>{t("handover.retention.title")}</CardTitle></CardHeader>
						<CardContent className="space-y-3">
							<InfoRow label={t("handover.retention.amount")} value={<Currency amount={Number(protocol.retentionReleaseAmount)} />} />
							{protocol.status === "COMPLETED" && (
								<div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
									{t("handover.retention.title")} — {t("handover.statuses.COMPLETED")}
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Parties & Signatures */}
			<Card>
				<CardHeader><CardTitle>{t("handover.parties.title")}</CardTitle></CardHeader>
				<CardContent>
					{parties.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-4">{t("handover.parties.addParty")}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("handover.parties.name")}</TableHead>
									<TableHead>{t("handover.parties.role")}</TableHead>
									<TableHead>{t("handover.parties.organization")}</TableHead>
									<TableHead>{t("handover.parties.signed")}</TableHead>
									<TableHead className="w-20" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{parties.map((party: any, index: number) => (
									<TableRow key={index}>
										<TableCell className="font-medium">{party.name}</TableCell>
										<TableCell>{party.role}</TableCell>
										<TableCell>{party.organization || "-"}</TableCell>
										<TableCell>
											{party.signed ? (
												<Badge className="bg-green-100 text-green-700">
													{t("handover.parties.signed")} — {party.signedAt ? formatDate(party.signedAt) : ""}
												</Badge>
											) : (
												<Badge className="bg-gray-100 text-gray-700">{t("handover.parties.notSigned")}</Badge>
											)}
										</TableCell>
										<TableCell>
											{canSign && !party.signed && (
												<Button size="sm" onClick={() => signMutation.mutate(index)} disabled={signMutation.isPending}>
													{t("handover.parties.sign")}
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Items */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>{t("handover.items.title")} ({protocol.items?.length ?? 0})</CardTitle>
						{canAddItems && (
							<div className="flex gap-2">
								{protocol.subcontractContractId && (
									<Button variant="outline" size="sm" onClick={() => importContractMutation.mutate()} disabled={importContractMutation.isPending}>
										<Download className="me-2 h-4 w-4" />{t("handover.items.importFromContract")}
									</Button>
								)}
								<Button variant="outline" size="sm" onClick={() => importBOQMutation.mutate()} disabled={importBOQMutation.isPending}>
									<Download className="me-2 h-4 w-4" />{t("handover.items.importFromBOQ")}
								</Button>
								<Button size="sm" onClick={() => { setEditingItem(null); setShowItemDialog(true); }}>
									<Plus className="me-2 h-4 w-4" />{t("handover.items.addItem")}
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{(protocol.items?.length ?? 0) === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-4">{t("handover.items.addItem")}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>#</TableHead>
									<TableHead>{t("handover.items.description")}</TableHead>
									<TableHead>{t("handover.items.unit")}</TableHead>
									<TableHead>{t("handover.items.contractQty")}</TableHead>
									<TableHead>{t("handover.items.executedQty")}</TableHead>
									<TableHead>{t("handover.items.acceptedQty")}</TableHead>
									<TableHead>{t("handover.items.qualityRating")}</TableHead>
									{canAddItems && <TableHead className="w-20" />}
								</TableRow>
							</TableHeader>
							<TableBody>
								{protocol.items?.map((item: any, idx: number) => (
									<TableRow key={item.id}>
										<TableCell>{idx + 1}</TableCell>
										<TableCell className="max-w-[200px]">{item.description}</TableCell>
										<TableCell>{item.unit || "-"}</TableCell>
										<TableCell>{item.contractQty ? Number(item.contractQty) : "-"}</TableCell>
										<TableCell>{item.executedQty ? Number(item.executedQty) : "-"}</TableCell>
										<TableCell>{item.acceptedQty ? Number(item.acceptedQty) : "-"}</TableCell>
										<TableCell>
											{item.qualityRating ? (
												<Badge className={QUALITY_COLORS[item.qualityRating] ?? ""}>
													{t(`handover.qualityRatings.${item.qualityRating}`)}
												</Badge>
											) : "-"}
										</TableCell>
										{canAddItems && (
											<TableCell>
												<div className="flex gap-1">
													<Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setShowItemDialog(true); }}>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button variant="ghost" size="icon" onClick={() => deleteItemMutation.mutate(item.id)}>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</div>
											</TableCell>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Item Dialog */}
			<HandoverItemDialog
				open={showItemDialog}
				onOpenChange={setShowItemDialog}
				organizationId={organizationId}
				protocolId={protocolId}
				editItem={editingItem}
				onSuccess={() => { invalidate(); setShowItemDialog(false); setEditingItem(null); }}
			/>

			{/* Submit Dialog */}
			<AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("handover.actions.submit")}</AlertDialogTitle>
						<AlertDialogDescription>{t("handover.submitConfirm")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
							{t("handover.actions.submit")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Complete Dialog */}
			<AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("handover.actions.complete")}</AlertDialogTitle>
						<AlertDialogDescription>{t("handover.completeConfirm")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
							{t("handover.actions.complete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("handover.actions.delete")}</AlertDialogTitle>
						<AlertDialogDescription>{t("handover.deleteConfirm")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							{t("handover.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-2">
			<span className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</span>
			<span className="text-sm font-medium text-end">{value}</span>
		</div>
	);
}
