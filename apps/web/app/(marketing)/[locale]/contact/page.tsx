import { ContactForm } from "@marketing/home/components/ContactForm";
import { config } from "@repo/config";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("contact.title"),
	};
}

export default async function ContactPage() {
	if (!config.contactForm.enabled) {
		redirect("/");
	}

	const t = await getTranslations();
	return (
		<div className="container max-w-xl pt-32 pb-20">
			<div className="mb-10 pt-8 text-center">
				<h1 className="mb-3 font-extrabold text-4xl sm:text-5xl">
					{t("contact.title")}
				</h1>
				<p className="text-balance text-muted-foreground">
					{t("contact.description")}
				</p>
			</div>

			{/* Botly widget card around the form */}
			<div className="rounded-[var(--botly-radius-card)] border-2 bg-card p-6 md:p-8">
				<ContactForm />
			</div>
		</div>
	);
}
