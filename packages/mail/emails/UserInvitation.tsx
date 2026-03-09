import { Heading, Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../src/components/PrimaryButton";
import Wrapper from "../src/components/Wrapper";
import { defaultLocale, defaultTranslations } from "../src/util/translations";
import type { BaseMailProps } from "../types";

export function UserInvitation({
	url,
	organizationName,
	inviterName,
	roleName,
	locale,
	translations,
}: {
	url: string;
	organizationName: string;
	inviterName: string;
	roleName: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Heading className="text-xl">
				{t.markup("mail.userInvitation.headline", {
					organizationName,
					strong: (chunks) => `<strong>${chunks}</strong>`,
				})}
			</Heading>
			<Text>
				{t("mail.userInvitation.body", {
					inviterName,
					organizationName,
					roleName,
				})}
			</Text>

			<PrimaryButton href={url}>
				{t("mail.userInvitation.accept")}
			</PrimaryButton>

			<Text className="mt-4 text-muted-foreground text-sm">
				{t("mail.userInvitation.expiry")}
			</Text>

			<Text className="mt-2 text-muted-foreground text-sm">
				{t("mail.common.openLinkInBrowser")}
				<Link href={url}>{url}</Link>
			</Text>
		</Wrapper>
	);
}

UserInvitation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "#",
	organizationName: "مسار للمقاولات",
	inviterName: "أحمد",
	roleName: "محاسب",
};

export default UserInvitation;
