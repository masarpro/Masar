import { auth } from "@repo/auth";
import {
  db,
  listAssistantChats,
  createAssistantChat,
} from "@repo/database";

async function verifyMembership(request: Request, organizationSlug: string) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;

  const organization = await db.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true },
  });
  if (!organization) return null;

  const membership = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });
  if (!membership) return null;

  return { userId: session.user.id, organizationId: organization.id };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationSlug = searchParams.get("organizationSlug");
  if (!organizationSlug) {
    return Response.json({ error: "Missing organizationSlug" }, { status: 400 });
  }

  const access = await verifyMembership(request, organizationSlug);
  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chats = await listAssistantChats({
    organizationId: access.organizationId,
    userId: access.userId,
    limit: 30,
  });

  return Response.json({ chats });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { messages, title, metadata, organizationSlug } = body;

  if (!organizationSlug || !messages?.length) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const access = await verifyMembership(request, organizationSlug);
  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chat = await createAssistantChat({
    organizationId: access.organizationId,
    userId: access.userId,
    messages,
    title,
    metadata,
  });

  return Response.json({
    chat: { id: chat.id, title: chat.title, createdAt: chat.createdAt },
  });
}
