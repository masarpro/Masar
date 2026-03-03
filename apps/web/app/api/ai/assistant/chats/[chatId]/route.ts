import { auth } from "@repo/auth";
import {
  db,
  getAssistantChat,
  updateAssistantChat,
  deleteAssistantChat,
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const { searchParams } = new URL(request.url);
  const organizationSlug = searchParams.get("organizationSlug");
  if (!organizationSlug) {
    return Response.json({ error: "Missing organizationSlug" }, { status: 400 });
  }

  const access = await verifyMembership(request, organizationSlug);
  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chat = await getAssistantChat({
    id: chatId,
    organizationId: access.organizationId,
    userId: access.userId,
  });

  if (!chat) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ chat });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const body = await request.json();
  const { messages, title, metadata, organizationSlug } = body;

  if (!organizationSlug) {
    return Response.json({ error: "Missing organizationSlug" }, { status: 400 });
  }

  const access = await verifyMembership(request, organizationSlug);
  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await updateAssistantChat({
    id: chatId,
    organizationId: access.organizationId,
    userId: access.userId,
    messages,
    title,
    metadata,
  });

  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const body = await request.json();
  const { organizationSlug } = body;

  if (!organizationSlug) {
    return Response.json({ error: "Missing organizationSlug" }, { status: 400 });
  }

  const access = await verifyMembership(request, organizationSlug);
  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteAssistantChat({
    id: chatId,
    organizationId: access.organizationId,
    userId: access.userId,
  });

  return Response.json({ success: true });
}
