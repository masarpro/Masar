import { Document } from "@shared/components/Document";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";

export default async function OwnerLayout({ children }: PropsWithChildren) {
	const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

	return (
		<Document locale={locale}>
			<NextIntlClientProvider messages={messages}>
				{children}
			</NextIntlClientProvider>
		</Document>
	);
}
