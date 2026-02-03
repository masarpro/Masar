import { IntegrationsSettingsForm } from "@saas/integrations/components/IntegrationsSettingsForm";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("integrations.settings.title"),
	};
}

export default function IntegrationsSettingsPage() {
	return (
		<SettingsList>
			<IntegrationsSettingsForm />
		</SettingsList>
	);
}
