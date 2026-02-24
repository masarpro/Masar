"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import {
	MessageSquare,
	RefreshCw,
	Send,
	User,
	Building2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";

export default function OwnerPortalChat() {
	const params = useParams();
	const token = params.token as string;
	const t = useTranslations();
	const queryClient = useQueryClient();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [message, setMessage] = useState("");

	const { data, isLoading, refetch, isFetching } = useQuery(
		orpc.projectOwner.portal.listMessages.queryOptions({
			input: { token },
		}),
	);

	const sendMutation = useMutation({
		...orpc.projectOwner.portal.sendMessage.mutationOptions(),
		onSuccess: () => {
			setMessage("");
			refetch();
		},
	});

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [data?.items]);

	const handleSend = () => {
		if (!message.trim()) return;
		sendMutation.mutate({ token, content: message.trim() });
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	const messages = data?.items || [];

	return (
		<div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
				<div className="flex items-center gap-3">
					<MessageSquare className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
						{t("ownerPortal.chat.title")}
					</h2>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isFetching}
					className="rounded-xl"
				>
					<RefreshCw className={`h-4 w-4 me-2 ${isFetching ? "animate-spin" : ""}`} />
					{t("ownerPortal.chat.refresh")}
				</Button>
			</div>

			{/* Messages Area */}
			<div className="h-[400px] overflow-y-auto p-6 space-y-4">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-slate-500">
						<MessageSquare className="h-12 w-12 mb-3 text-slate-300" />
						<p>{t("ownerPortal.chat.noMessages")}</p>
						<p className="text-sm mt-1">{t("ownerPortal.chat.startConversation")}</p>
					</div>
				) : (
					<>
						{messages.map((msg) => {
							const isFromOwner = msg.content.startsWith("[من المالك]");
							return (
								<div
									key={msg.id}
									className={`flex gap-3 ${isFromOwner ? "flex-row-reverse" : ""}`}
								>
									{/* Avatar */}
									<div
										className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
											isFromOwner
												? "bg-primary/10"
												: "bg-slate-100 dark:bg-slate-800"
										}`}
									>
										{isFromOwner ? (
											<User className="h-4 w-4 text-primary" />
										) : (
											<Building2 className="h-4 w-4 text-slate-500" />
										)}
									</div>

									{/* Message Bubble */}
									<div
										className={`max-w-[70%] rounded-2xl px-4 py-3 ${
											isFromOwner
												? "bg-primary text-primary-foreground"
												: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
										}`}
									>
										<p className="text-sm whitespace-pre-wrap">
											{isFromOwner ? msg.content.replace("[من المالك] ", "") : msg.content}
										</p>
										<div
											className={`mt-1 flex items-center gap-2 text-xs ${
												isFromOwner
													? "text-primary-foreground/70"
													: "text-slate-500"
											}`}
										>
											<span>{msg.sender?.name || t("ownerPortal.chat.owner")}</span>
											<span>•</span>
											<span>
												{new Date(msg.createdAt).toLocaleString("ar-SA", {
													dateStyle: "short",
													timeStyle: "short",
												})}
											</span>
										</div>
									</div>
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Input Area */}
			<div className="border-t border-slate-200 dark:border-slate-700 p-4">
				<div className="flex gap-3">
					<Textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("ownerPortal.chat.placeholder")}
						className="min-h-[60px] resize-none rounded-xl"
						disabled={sendMutation.isPending}
					/>
					<Button
						onClick={handleSend}
						disabled={!message.trim() || sendMutation.isPending}
						className="h-auto rounded-xl px-6"
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
				<p className="mt-2 text-xs text-slate-500">
					{t("ownerPortal.chat.hint")}
				</p>
			</div>
		</div>
	);
}
