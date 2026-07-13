"use client";

import {
	eventLeafName,
	type NotificationEventChannel,
	type NotificationEventDef,
} from "@repo/database/prisma/notification-registry";
import { Switch } from "@ui/components/switch";
import { useTranslations } from "next-intl";

interface NotificationEventRowProps {
	event: NotificationEventDef;
	channels: NotificationEventChannel[];
	disabled: boolean;
	onToggleChannel: (channel: NotificationEventChannel) => void;
}

export function NotificationEventRow({
	event,
	channels,
	disabled,
	onToggleChannel,
}: NotificationEventRowProps) {
	const t = useTranslations();
	const leaf = eventLeafName(event.key);

	return (
		<div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2 border-b border-border py-3 last:border-0">
			<div className="min-w-0">
				<p className="text-sm font-medium text-foreground">
					{t(`notifications.events.${event.module}.${leaf}.title`)}
				</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{t(
						`notifications.events.${event.module}.${leaf}.description`,
					)}
				</p>
			</div>
			<div className="flex justify-center">
				<Switch
					checked={channels.includes("IN_APP")}
					onCheckedChange={() => onToggleChannel("IN_APP")}
					disabled={disabled}
					aria-label={t("settings.notifications.inApp")}
				/>
			</div>
			<div className="flex justify-center">
				<Switch
					checked={channels.includes("EMAIL")}
					onCheckedChange={() => onToggleChannel("EMAIL")}
					disabled={disabled}
					aria-label={t("settings.notifications.email")}
				/>
			</div>
		</div>
	);
}
