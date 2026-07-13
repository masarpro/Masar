import { localeRedirect } from "@i18n/routing";
import { PostContent } from "@marketing/blog/components/PostContent";
import {
	getActivePathFromUrlParam,
	getLocalizedDocumentWithFallback,
} from "@shared/lib/content";
import { allLegalPages } from "content-collections";
import { getLocale } from "next-intl/server";

type Params = {
	path: string;
	locale: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const params = await props.params;

	const { path } = params;

	const locale = await getLocale();
	const activePath = getActivePathFromUrlParam(path);
	const page = getLocalizedDocumentWithFallback(
		allLegalPages,
		activePath,
		locale,
	);

	return {
		title: page?.title,
		openGraph: {
			title: page?.title,
		},
	};
}

export default async function BlogPostPage(props: { params: Promise<Params> }) {
	const params = await props.params;

	const { path } = params;

	const locale = await getLocale();
	const activePath = getActivePathFromUrlParam(path);
	const page = getLocalizedDocumentWithFallback(
		allLegalPages,
		activePath,
		locale,
	);

	if (!page) {
		localeRedirect({ href: "/", locale });
	}

	const { title, body } = page;

	return (
		<div className="container max-w-4xl pt-32 pb-24">
			<div className="mx-auto mb-10 max-w-2xl text-center">
				<h1 className="font-extrabold text-4xl sm:text-5xl">{title}</h1>
			</div>

			{/* Botly widget card around the document body */}
			<div className="rounded-[var(--botly-radius-card)] border-2 bg-card p-6 md:p-10">
				<PostContent content={body} />
			</div>
		</div>
	);
}
