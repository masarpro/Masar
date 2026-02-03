"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Textarea } from "@ui/components/textarea";
import {
	MessageSquare,
	Send,
	Users,
	User,
	Shield,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface ProjectChatProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

type MessageChannel = "TEAM" | "OWNER";

export function ProjectChat({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectChatProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const [activeChannel, setActiveChannel] = useState<MessageChannel>("TEAM");
	const [newMessage, setNewMessage] = useState("");
	const [isUpdate, setIsUpdate] = useState(false);

	const { data: messages, isLoading, refetch } = useQuery(
		orpc.projectChat.listMessages.queryOptions({
			input: {
				organizationId,
				projectId,
				channel: activeChannel,
			},
		}),
	);

	const sendMessageMutation = useMutation(
		orpc.projectChat.sendMessage.mutationOptions({
			onSuccess: () => {
				setNewMessage("");
				setIsUpdate(false);
				queryClient.invalidateQueries({
					queryKey: [["projectChat", "listMessages"]],
				});
			},
			onError: (error) => {
				toast.error(error.message || t("projects.chat.sendError"));
			},
		}),
	);

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();

		if (!newMessage.trim()) return;

		sendMessageMutation.mutate({
			organizationId,
			projectId,
			channel: activeChannel,
			content: newMessage.trim(),
			isUpdate: activeChannel === "OWNER" ? isUpdate : false,
		});
	};

	const channels = [
		{
			key: "TEAM" as MessageChannel,
			label: t("projects.chat.teamChannel"),
			icon: Users,
			description: t("projects.chat.teamChannelDescription"),
		},
		{
			key: "OWNER" as MessageChannel,
			label: t("projects.chat.ownerChannel"),
			icon: Shield,
			description: t("projects.chat.ownerChannelDescription"),
		},
	];

	return (
		<div className="flex h-[calc(100vh-16rem)] flex-col space-y-4">
			{/* Channel Tabs */}
			<div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-900">
				{channels.map((channel) => (
					<button
						key={channel.key}
						onClick={() => setActiveChannel(channel.key)}
						className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
							activeChannel === channel.key
								? "bg-white text-primary shadow-sm dark:bg-slate-800"
								: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
						}`}
					>
						<channel.icon className="h-4 w-4" />
						{channel.label}
					</button>
				))}
			</div>

			{/* Channel Description */}
			<div className={`rounded-xl p-3 text-sm ${
				activeChannel === "OWNER"
					? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
					: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
			}`}>
				{activeChannel === "OWNER" && (
					<>
						<Shield className="inline h-4 w-4 me-1" />
						{t("projects.chat.ownerChannelNote")}
					</>
				)}
				{activeChannel === "TEAM" && (
					<>
						<Users className="inline h-4 w-4 me-1" />
						{t("projects.chat.teamChannelNote")}
					</>
				)}
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
				{isLoading ? (
					<div className="flex h-full items-center justify-center">
						<div className="relative">
							<div className="h-10 w-10 rounded-full border-4 border-primary/20" />
							<div className="absolute left-0 top-0 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					</div>
				) : !messages?.items?.length ? (
					<div className="flex h-full flex-col items-center justify-center text-center">
						<div className="mb-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
							<MessageSquare className="h-10 w-10 text-slate-400" />
						</div>
						<p className="text-slate-500">{t("projects.chat.noMessages")}</p>
					</div>
				) : (
					<div className="space-y-4">
						{messages.items.map((message) => (
							<div
								key={message.id}
								className="group flex gap-3"
							>
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
									{message.sender.image ? (
										<img
											src={message.sender.image}
											alt={message.sender.name}
											className="h-9 w-9 rounded-full object-cover"
										/>
									) : (
										<User className="h-4 w-4 text-slate-500" />
									)}
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium text-slate-900 dark:text-slate-100">
											{message.sender.name}
										</span>
										{message.isUpdate && (
											<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
												تحديث رسمي
											</Badge>
										)}
										<span className="text-xs text-slate-400">
											{new Date(message.createdAt).toLocaleString("ar-SA", {
												hour: "2-digit",
												minute: "2-digit",
												day: "numeric",
												month: "short",
											})}
										</span>
									</div>
									<p className="mt-1 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
										{message.content}
									</p>
								</div>
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* Message Input */}
			<form onSubmit={handleSendMessage} className="space-y-3">
				{activeChannel === "OWNER" && (
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={isUpdate}
							onChange={(e) => setIsUpdate(e.target.checked)}
							className="h-4 w-4 rounded border-slate-300"
						/>
						<span className="text-slate-600 dark:text-slate-400">
							{t("projects.chat.markAsOfficialUpdate")}
						</span>
					</label>
				)}
				<div className="flex gap-3">
					<Textarea
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						placeholder={t("projects.chat.messagePlaceholder")}
						className="min-h-12 flex-1 resize-none rounded-xl"
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSendMessage(e);
							}
						}}
					/>
					<Button
						type="submit"
						className="rounded-xl px-6"
						disabled={sendMessageMutation.isPending || !newMessage.trim()}
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</form>
		</div>
	);
}
