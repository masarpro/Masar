"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface QuickDocumentsCardProps {
	organizationId: string;
	projectId: string;
	basePath: string;
}

export function QuickDocumentsCard({
	organizationId,
	projectId,
	basePath,
}: QuickDocumentsCardProps) {
	const t = useTranslations();

	// Only the 2 most recent documents are shown — don't pull a full page.
	const { data: documentsData } = useQuery(
		orpc.projectDocuments.list.queryOptions({
			input: { organizationId, projectId, pageSize: 2 },
		}),
	);

	const documents = (documentsData as any)?.documents?.slice(0, 2) ?? (Array.isArray(documentsData) ? documentsData.slice(0, 2) : []);

	return (
		<div className="rounded-2xl border-2 bg-card p-4 flex flex-col">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="flex size-8 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<FolderOpen className="h-4 w-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("projects.commandCenter.quickDocuments")}
					</h3>
				</div>
				<Link
					href={`${basePath}/documents/new`}
					className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
				>
					<Plus className="h-3 w-3" />
					{t("projects.commandCenter.addDocument")}
				</Link>
			</div>

			{documents.length > 0 ? (
				<div className="flex-1 space-y-2">
					{documents.map((doc: any) => (
						<div key={doc.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
							<FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
							<span className="text-xs text-muted-foreground truncate">
								{doc.title || doc.name || doc.fileName}
							</span>
						</div>
					))}
				</div>
			) : (
				<div className="flex-1 flex items-center justify-center py-4">
					<p className="text-xs text-muted-foreground">
						{t("projects.commandCenter.noDocumentsYet")}
					</p>
				</div>
			)}
		</div>
	);
}
