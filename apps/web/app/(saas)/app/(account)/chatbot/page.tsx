import { AiChat } from "@saas/ai/components/AiChat";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcServer, orpcServerClient } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";

export const dynamic = 'force-dynamic';

export default async function AiDemoPage() {
	const queryClient = getServerQueryClient();

	const chats = await (async () => {
		const { chats } = await orpcServerClient.ai.chats.list();

		return chats;
	})();

	await queryClient.prefetchQuery({
		queryKey: orpc.ai.chats.list.queryKey({
			input: {},
		}),
		queryFn: async () => ({ chats }),
	});

	if (chats.length > 0) {
		await queryClient.prefetchQuery(
			orpcServer.ai.chats.find.queryOptions({
				input: {
					id: chats[0].id,
				},
			}),
		);
	}

	return (
		<>
			<PageHeader
				title="AI Chatbot"
				subtitle="This is an example chatbot built with the OpenAI API"
			/>

			<AiChat />
		</>
	);
}
