"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface CommentBoxProps {
	leadId: string;
	organizationId: string;
}

export function CommentBox({ leadId, organizationId }: CommentBoxProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [content, setContent] = useState("");

	const mutation = useMutation(
		orpc.pricing.leads.addActivity.mutationOptions({
			onSuccess: () => {
				setContent("");
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.leads.getById.queryOptions({ input: { organizationId, leadId } }).queryKey,
				});
			},
			onError: () => {
				toast.error(t("pricing.leads.detail.commentError"));
			},
		}),
	);

	const handleSubmit = () => {
		const trimmed = content.trim();
		if (!trimmed) return;
		mutation.mutate({ organizationId, leadId, content: trimmed });
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="space-y-2">
			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={t("pricing.leads.detail.commentPlaceholder")}
				className="rounded-xl"
				rows={3}
			/>
			<div className="flex items-center justify-between">
				<p className="text-xs text-muted-foreground">
					{t("pricing.leads.detail.commentHint")}
				</p>
				<Button
					size="sm"
					className="rounded-xl"
					onClick={handleSubmit}
					disabled={mutation.isPending || !content.trim()}
				>
					{mutation.isPending ? (
						<Loader2 className="me-2 h-4 w-4 animate-spin" />
					) : (
						<Send className="me-2 h-4 w-4" />
					)}
					{t("pricing.leads.detail.addComment")}
				</Button>
			</div>
		</div>
	);
}
