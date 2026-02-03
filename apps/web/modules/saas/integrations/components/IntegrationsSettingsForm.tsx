"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { useRouter } from "@shared/hooks/router";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Switch } from "@ui/components/switch";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Badge } from "@ui/components/badge";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MailIcon, MessageSquareIcon, PhoneIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

const formSchema = z.object({
	emailEnabled: z.boolean(),
	whatsappEnabled: z.boolean(),
	smsEnabled: z.boolean(),
	defaultChannel: z.enum(["EMAIL", "WHATSAPP", "SMS"]),
	ownerNotifyOnOfficialUpdate: z.boolean(),
	ownerNotifyOnPaymentDue: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

export function IntegrationsSettingsForm() {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();

	const { data, isLoading } = useQuery({
		queryKey: ["integrations-settings", activeOrganization?.id],
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.integrations.getSettings({
				organizationId: activeOrganization.id,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		values: data?.settings
			? {
					emailEnabled: data.settings.emailEnabled,
					whatsappEnabled: data.settings.whatsappEnabled,
					smsEnabled: data.settings.smsEnabled,
					defaultChannel: data.settings.defaultChannel,
					ownerNotifyOnOfficialUpdate:
						data.settings.ownerNotifyOnOfficialUpdate,
					ownerNotifyOnPaymentDue: data.settings.ownerNotifyOnPaymentDue,
				}
			: undefined,
	});

	const updateMutation = useMutation({
		mutationFn: async (values: FormSchema) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.integrations.updateSettings({
				organizationId: activeOrganization.id,
				...values,
			});
		},
		onSuccess: () => {
			toast.success(t("integrations.settings.saved"));
			queryClient.invalidateQueries({
				queryKey: ["integrations-settings"],
			});
			router.refresh();
		},
		onError: (error: Error) => {
			toast.error(error.message || t("integrations.settings.error"));
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		updateMutation.mutate(values);
	});

	if (isLoading) {
		return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
	}

	const providersStatus = data?.providersStatus || {
		email: false,
		whatsapp: false,
		sms: false,
	};

	return (
		<div className="space-y-6">
			{/* Provider Status */}
			<SettingsItem
				title={t("integrations.settings.providersStatus.title")}
				description={t("integrations.settings.providersStatus.description")}
			>
				<div className="flex flex-wrap gap-4">
					<div className="flex items-center gap-2">
						<MailIcon className="h-4 w-4" />
						<span>{t("integrations.channels.email")}</span>
						{providersStatus.email ? (
							<Badge variant="default" className="flex items-center gap-1">
								<CheckCircleIcon className="h-3 w-3" />
								{t("integrations.settings.configured")}
							</Badge>
						) : (
							<Badge variant="secondary" className="flex items-center gap-1">
								<XCircleIcon className="h-3 w-3" />
								{t("integrations.settings.notConfigured")}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2">
						<MessageSquareIcon className="h-4 w-4" />
						<span>{t("integrations.channels.whatsapp")}</span>
						{providersStatus.whatsapp ? (
							<Badge variant="default" className="flex items-center gap-1">
								<CheckCircleIcon className="h-3 w-3" />
								{t("integrations.settings.configured")}
							</Badge>
						) : (
							<Badge variant="secondary" className="flex items-center gap-1">
								<XCircleIcon className="h-3 w-3" />
								{t("integrations.settings.notConfigured")}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2">
						<PhoneIcon className="h-4 w-4" />
						<span>{t("integrations.channels.sms")}</span>
						{providersStatus.sms ? (
							<Badge variant="default" className="flex items-center gap-1">
								<CheckCircleIcon className="h-3 w-3" />
								{t("integrations.settings.configured")}
							</Badge>
						) : (
							<Badge variant="secondary" className="flex items-center gap-1">
								<XCircleIcon className="h-3 w-3" />
								{t("integrations.settings.notConfigured")}
							</Badge>
						)}
					</div>
				</div>
			</SettingsItem>

			{/* Channel Settings */}
			<SettingsItem
				title={t("integrations.settings.channels.title")}
				description={t("integrations.settings.channels.description")}
			>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="emailEnabled" className="flex items-center gap-2">
								<MailIcon className="h-4 w-4" />
								{t("integrations.channels.email")}
							</Label>
							<Switch
								id="emailEnabled"
								checked={form.watch("emailEnabled")}
								onCheckedChange={(checked) =>
									form.setValue("emailEnabled", checked, { shouldDirty: true })
								}
								disabled={!providersStatus.email}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label
								htmlFor="whatsappEnabled"
								className="flex items-center gap-2"
							>
								<MessageSquareIcon className="h-4 w-4" />
								{t("integrations.channels.whatsapp")}
							</Label>
							<Switch
								id="whatsappEnabled"
								checked={form.watch("whatsappEnabled")}
								onCheckedChange={(checked) =>
									form.setValue("whatsappEnabled", checked, {
										shouldDirty: true,
									})
								}
								disabled={!providersStatus.whatsapp}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="smsEnabled" className="flex items-center gap-2">
								<PhoneIcon className="h-4 w-4" />
								{t("integrations.channels.sms")}
							</Label>
							<Switch
								id="smsEnabled"
								checked={form.watch("smsEnabled")}
								onCheckedChange={(checked) =>
									form.setValue("smsEnabled", checked, { shouldDirty: true })
								}
								disabled={!providersStatus.sms}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="defaultChannel">
								{t("integrations.settings.defaultChannel")}
							</Label>
							<Select
								value={form.watch("defaultChannel")}
								onValueChange={(value) =>
									form.setValue(
										"defaultChannel",
										value as "EMAIL" | "WHATSAPP" | "SMS",
										{ shouldDirty: true },
									)
								}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="EMAIL">
										{t("integrations.channels.email")}
									</SelectItem>
									<SelectItem value="WHATSAPP">
										{t("integrations.channels.whatsapp")}
									</SelectItem>
									<SelectItem value="SMS">
										{t("integrations.channels.sms")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={!form.formState.isDirty}
							loading={updateMutation.isPending}
						>
							{t("settings.save")}
						</Button>
					</div>
				</form>
			</SettingsItem>

			{/* Owner Notifications */}
			<SettingsItem
				title={t("integrations.settings.ownerNotifications.title")}
				description={t("integrations.settings.ownerNotifications.description")}
			>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label
								htmlFor="ownerNotifyOnOfficialUpdate"
								className="flex flex-col"
							>
								<span>
									{t("integrations.settings.ownerNotifications.officialUpdate")}
								</span>
								<span className="text-xs text-muted-foreground">
									{t(
										"integrations.settings.ownerNotifications.officialUpdateDesc",
									)}
								</span>
							</Label>
							<Switch
								id="ownerNotifyOnOfficialUpdate"
								checked={form.watch("ownerNotifyOnOfficialUpdate")}
								onCheckedChange={(checked) =>
									form.setValue("ownerNotifyOnOfficialUpdate", checked, {
										shouldDirty: true,
									})
								}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label
								htmlFor="ownerNotifyOnPaymentDue"
								className="flex flex-col"
							>
								<span>
									{t("integrations.settings.ownerNotifications.paymentDue")}
								</span>
								<span className="text-xs text-muted-foreground">
									{t(
										"integrations.settings.ownerNotifications.paymentDueDesc",
									)}
								</span>
							</Label>
							<Switch
								id="ownerNotifyOnPaymentDue"
								checked={form.watch("ownerNotifyOnPaymentDue")}
								onCheckedChange={(checked) =>
									form.setValue("ownerNotifyOnPaymentDue", checked, {
										shouldDirty: true,
									})
								}
							/>
						</div>
					</div>

					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={!form.formState.isDirty}
							loading={updateMutation.isPending}
						>
							{t("settings.save")}
						</Button>
					</div>
				</form>
			</SettingsItem>
		</div>
	);
}
