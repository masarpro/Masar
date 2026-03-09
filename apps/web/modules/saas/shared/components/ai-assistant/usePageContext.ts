"use client";

import { useParams, usePathname } from "next/navigation";
import type { AssistantSection, PageContext } from "./types";

const PROJECT_SECTION_MAP: Record<string, AssistantSection> = {
  execution: "project-execution",
  finance: "project-finance",
  timeline: "project-timeline",
  documents: "project-documents",
  chat: "project-chat",
  field: "project-field",
  changes: "project-changes",
  team: "project-team",
  insights: "project-insights",
  owner: "project-owner",
};

const ORG_SECTION_MAP: Record<string, AssistantSection> = {
  projects: "projects",
  finance: "finance",
  quantities: "quantities",
  pricing: "pricing",
  company: "company",
  settings: "settings",
  notifications: "notifications",
  chatbot: "chatbot",
  leads: "leads",
};

export function usePageContext(): PageContext {
  const pathname = usePathname();
  const params = useParams<{
    organizationSlug?: string;
    projectId?: string;
  }>();

  const organizationSlug = params.organizationSlug ?? "";
  const projectId = params.projectId;

  // Split path: /app/[org]/...
  const segments = pathname.split("/").filter(Boolean);

  // Find org index
  const orgIndex = segments.indexOf(organizationSlug);
  const afterOrg = orgIndex >= 0 ? segments.slice(orgIndex + 1) : [];

  let section: AssistantSection = "dashboard";

  if (afterOrg.length === 0) {
    section = "dashboard";
  } else if (afterOrg[0] === "projects" && projectId) {
    // Inside a project: /[org]/projects/[pid]/[sub?]
    const subSection = afterOrg[2]; // after projectId
    if (subSection && PROJECT_SECTION_MAP[subSection]) {
      section = PROJECT_SECTION_MAP[subSection];
    } else {
      section = "project-overview";
    }
  } else if (afterOrg[0] && ORG_SECTION_MAP[afterOrg[0]]) {
    section = ORG_SECTION_MAP[afterOrg[0]];
  } else {
    section = "unknown";
  }

  return {
    route: pathname,
    section,
    projectId,
  };
}
