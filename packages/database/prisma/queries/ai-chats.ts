import { db } from "../client";

export async function getAiChatsByUserId({
	limit,
	offset,
	userId,
}: {
	limit: number;
	offset: number;
	userId: string;
}) {
	return await db.aiChat.findMany({
		where: {
			userId,
		},
		take: limit,
		skip: offset,
	});
}

export async function getAiChatsByOrganizationId({
	limit,
	offset,
	organizationId,
}: {
	limit: number;
	offset: number;
	organizationId: string;
}) {
	return await db.aiChat.findMany({
		where: {
			organizationId,
		},
		take: limit,
		skip: offset,
	});
}

export async function getAiChatById(id: string) {
	return await db.aiChat.findUnique({
		where: {
			id,
		},
	});
}

export async function createAiChat({
	organizationId,
	userId,
	title,
}: {
	organizationId?: string;
	userId: string;
	title?: string;
}) {
	return await db.aiChat.create({
		data: {
			organizationId,
			userId,
			title,
		},
	});
}

export async function updateAiChat({
	id,
	title,
	messages,
}: {
	id: string;
	title?: string;
	messages?: Array<object>;
}) {
	return await db.aiChat.update({
		where: {
			id,
		},
		data: {
			title,
			messages,
		},
	});
}

export async function deleteAiChat(id: string) {
	return await db.aiChat.delete({
		where: {
			id,
		},
	});
}

// ─── Assistant Chat Functions ───

function extractTitle(messages: Array<{ role?: string; content?: string }>): string {
	const firstUser = messages.find((m) => m.role === "user");
	if (!firstUser?.content) return "محادثة جديدة";
	return firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? "..." : "");
}

export async function listAssistantChats(params: {
	organizationId: string;
	userId: string;
	limit?: number;
	offset?: number;
}) {
	return db.aiChat.findMany({
		where: {
			organizationId: params.organizationId,
			userId: params.userId,
			type: "ASSISTANT",
		},
		select: {
			id: true,
			title: true,
			createdAt: true,
			updatedAt: true,
			metadata: true,
		},
		orderBy: { updatedAt: "desc" },
		take: params.limit ?? 20,
		skip: params.offset ?? 0,
	});
}

export async function getAssistantChat(params: {
	id: string;
	organizationId: string;
	userId: string;
}) {
	return db.aiChat.findFirst({
		where: {
			id: params.id,
			organizationId: params.organizationId,
			userId: params.userId,
			type: "ASSISTANT",
		},
	});
}

export async function createAssistantChat(params: {
	organizationId: string;
	userId: string;
	title?: string;
	messages: Array<object>;
	metadata?: Record<string, unknown>;
}) {
	// Enforce limit: delete oldest if >= 50
	const count = await countAssistantChats({
		organizationId: params.organizationId,
		userId: params.userId,
	});
	if (count >= 50) {
		const oldest = await db.aiChat.findFirst({
			where: {
				organizationId: params.organizationId,
				userId: params.userId,
				type: "ASSISTANT",
			},
			orderBy: { updatedAt: "asc" },
			select: { id: true },
		});
		if (oldest) {
			await db.aiChat.delete({ where: { id: oldest.id } });
		}
	}

	return db.aiChat.create({
		data: {
			organizationId: params.organizationId,
			userId: params.userId,
			type: "ASSISTANT",
			title: params.title || extractTitle(params.messages as Array<{ role?: string; content?: string }>),
			messages: params.messages as object,
			metadata: params.metadata as object | undefined,
		},
	});
}

export async function updateAssistantChat(params: {
	id: string;
	organizationId: string;
	userId: string;
	messages: Array<object>;
	title?: string;
	metadata?: Record<string, unknown>;
}) {
	return db.aiChat.updateMany({
		where: {
			id: params.id,
			organizationId: params.organizationId,
			userId: params.userId,
			type: "ASSISTANT",
		},
		data: {
			messages: params.messages as object,
			...(params.title && { title: params.title }),
			...(params.metadata && { metadata: params.metadata as object }),
		},
	});
}

export async function deleteAssistantChat(params: {
	id: string;
	organizationId: string;
	userId: string;
}) {
	return db.aiChat.deleteMany({
		where: {
			id: params.id,
			organizationId: params.organizationId,
			userId: params.userId,
			type: "ASSISTANT",
		},
	});
}

export async function countAssistantChats(params: {
	organizationId: string;
	userId: string;
}) {
	return db.aiChat.count({
		where: {
			organizationId: params.organizationId,
			userId: params.userId,
			type: "ASSISTANT",
		},
	});
}
