# Projects Module UI/UX Rebuild - QA Checklist

## Overview
This document covers the QA verification for the Projects Module UI/UX rebuild.
The rebuild focused on frontend-only changes to reduce cognitive load from 11+ same-level tabs to 4 grouped navigation sections.

## Files Created (7 files)

### Shell Components
- `apps/web/modules/saas/projects/components/shell/constants.ts` - Navigation groups config, context actions per route
- `apps/web/modules/saas/projects/components/shell/ProjectHeader.tsx` - Header with project info
- `apps/web/modules/saas/projects/components/shell/ProjectNavigation.tsx` - Grouped horizontal navigation
- `apps/web/modules/saas/projects/components/shell/ProjectContextToolbar.tsx` - Route-specific action buttons
- `apps/web/modules/saas/projects/components/shell/ProjectShell.tsx` - Main shell wrapper
- `apps/web/modules/saas/projects/components/shell/index.ts` - Barrel export

### Layout
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/layout.tsx` - Server layout for project routes

## Files Modified (14 files)

### Page Components (headers removed)
- `apps/web/modules/saas/projects/components/ProjectOverview.tsx` - Redesigned as Daily Command Center
- `apps/web/modules/saas/projects-timeline/components/FieldTimeline.tsx` - Removed duplicate header
- `apps/web/modules/saas/projects/components/FinanceView.tsx` - Removed duplicate header
- `apps/web/modules/saas/projects/components/DocumentsList.tsx` - Removed duplicate header
- `apps/web/modules/saas/projects/components/ProjectChat.tsx` - Removed duplicate header
- `apps/web/modules/saas/projects/components/ProjectUpdates.tsx` - Removed duplicate header
- `apps/web/modules/saas/projects/components/ProjectInsights.tsx` - Removed duplicate header
- `apps/web/modules/saas/projects/components/SupervisorMode.tsx` - Removed duplicate header
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/timeline/page.tsx` - Removed PageHeader
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/changes/page.tsx` - Removed PageHeader

### Translation Files
- `packages/i18n/translations/ar.json` - Added shell and commandCenter keys
- `packages/i18n/translations/en.json` - Added shell and commandCenter keys

---

## Route Smoke Tests

| Route | Test | Status |
|-------|------|--------|
| `/projects` | List page loads with stats, filters, and project cards | ☐ |
| `/projects/new` | Create form loads | ☐ |
| `/projects/templates` | Templates page loads | ☐ |
| `/projects/[id]` | Overview loads with shell (Daily Command Center) | ☐ |
| `/projects/[id]/field` | Field timeline loads with shell wrapper | ☐ |
| `/projects/[id]/field/new-issue` | Issue form loads | ☐ |
| `/projects/[id]/field/new-report` | Report form loads | ☐ |
| `/projects/[id]/field/upload` | Upload form loads | ☐ |
| `/projects/[id]/finance` | Finance view loads with shell wrapper | ☐ |
| `/projects/[id]/finance/new-expense` | Expense form loads | ☐ |
| `/projects/[id]/finance/new-claim` | Claim form loads | ☐ |
| `/projects/[id]/documents` | Documents list loads with shell wrapper | ☐ |
| `/projects/[id]/documents/new` | Document form loads | ☐ |
| `/projects/[id]/chat` | Chat loads with shell wrapper | ☐ |
| `/projects/[id]/timeline` | Timeline board loads with shell wrapper | ☐ |
| `/projects/[id]/changes` | Change orders loads with shell wrapper | ☐ |
| `/projects/[id]/updates` | Updates loads with shell wrapper | ☐ |
| `/projects/[id]/owner` | Owner access loads with shell wrapper | ☐ |
| `/projects/[id]/insights` | Insights loads with shell wrapper | ☐ |
| `/projects/[id]/supervisor` | Supervisor mode loads with shell wrapper | ☐ |
| `/projects/[id]/team` | Team management loads with shell wrapper | ☐ |

---

## Visual Checks

### RTL Layout
| Item | Status |
|------|--------|
| Arabic text is right-aligned | ☐ |
| Navigation pills display RTL order | ☐ |
| Dropdowns open in correct direction (left for RTL) | ☐ |
| Icons with directional meaning are flipped | ☐ |
| Progress bars fill from right to left | ☐ |
| Back arrow points right (RTL direction) | ☐ |

### Navigation Shell
| Item | Status |
|------|--------|
| Project header displays name, status, progress | ☐ |
| Navigation groups visible: التنفيذ, المالية, التخطيط, التواصل, المزيد | ☐ |
| Active group is highlighted | ☐ |
| Dropdown menus show sub-routes | ☐ |
| Context toolbar shows route-specific actions | ☐ |
| Back to projects link works | ☐ |

### Dark Mode
| Item | Status |
|------|--------|
| All shell components render correctly in dark mode | ☐ |
| Text contrast is readable | ☐ |
| Borders and backgrounds use dark variants | ☐ |
| Status badges have correct dark mode colors | ☐ |

### Mobile Responsiveness
| Item | Status |
|------|--------|
| Navigation pills scroll horizontally on mobile | ☐ |
| Project header stacks on small screens | ☐ |
| Context toolbar icons show without labels on mobile | ☐ |
| Quick actions grid is 2 columns on mobile | ☐ |
| Project cards stack vertically on mobile | ☐ |

---

## Backend Verification (CRITICAL)

**STRICT REQUIREMENT: No backend files were modified in this rebuild.**

| Verification | Status |
|--------------|--------|
| No files modified in `packages/api/**` | ☐ |
| No files modified in `packages/database/**` | ☐ |
| No Prisma schema changes | ☐ |
| No ORPC route changes | ☐ |

### Verification Command
```bash
git diff --name-only packages/api packages/database | grep -v ".md"
```

---

## Build Verification

| Check | Status | Notes |
|-------|--------|-------|
| `pnpm type-check` passes for web package | ☐ | Pre-existing errors in database package are unrelated |
| `pnpm build` succeeds | ☐ | |
| `pnpm dev` runs without errors | ☐ | |

---

## New Translation Keys Added

### Arabic (`packages/i18n/translations/ar.json`)
```json
{
  "projects.shell.backToProjects": "العودة للمشاريع",
  "projects.shell.daysRemaining": "{count} يوم متبقي",
  "projects.shell.navigation.execution": "التنفيذ",
  "projects.shell.navigation.finance": "المالية",
  "projects.shell.navigation.planning": "التخطيط",
  "projects.shell.navigation.communication": "التواصل",
  "projects.shell.navigation.more": "المزيد",
  "projects.shell.navigation.overview": "نظرة عامة",
  "projects.shell.subnav.field": "التقارير الميدانية",
  "projects.shell.subnav.supervisor": "وضع المشرف",
  "projects.shell.subnav.finance": "المالية",
  "projects.shell.subnav.timeline": "الجدول الزمني",
  "projects.shell.subnav.changes": "أوامر التغيير",
  "projects.shell.subnav.documents": "المستندات",
  "projects.shell.subnav.chat": "المحادثة",
  "projects.shell.subnav.updates": "التحديثات",
  "projects.shell.subnav.owner": "بوابة المالك",
  "projects.shell.subnav.insights": "التحليلات",
  "projects.shell.subnav.team": "فريق العمل"
}
```

### English (`packages/i18n/translations/en.json`)
```json
{
  "projects.shell.backToProjects": "Back to Projects",
  "projects.shell.daysRemaining": "{count} days remaining",
  "projects.shell.navigation.execution": "Execution",
  "projects.shell.navigation.finance": "Finance",
  "projects.shell.navigation.planning": "Planning",
  "projects.shell.navigation.communication": "Communication",
  "projects.shell.navigation.more": "More",
  "projects.shell.navigation.overview": "Overview",
  "projects.shell.subnav.field": "Field Reports",
  "projects.shell.subnav.supervisor": "Supervisor Mode",
  "projects.shell.subnav.finance": "Finance",
  "projects.shell.subnav.timeline": "Timeline",
  "projects.shell.subnav.changes": "Change Orders",
  "projects.shell.subnav.documents": "Documents",
  "projects.shell.subnav.chat": "Chat",
  "projects.shell.subnav.updates": "Updates",
  "projects.shell.subnav.owner": "Owner Portal",
  "projects.shell.subnav.insights": "Insights",
  "projects.shell.subnav.team": "Team"
}
```

---

## Architecture Summary

### New Information Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT HEADER                                               │
│ [Name] [Status Badge] [Progress %] [Days Remaining]          │
│ [Client] [Location] [Contract Value]                         │
├─────────────────────────────────────────────────────────────┤
│ GROUPED NAVIGATION                                           │
│                                                              │
│ [نظرة عامة] [التنفيذ ▾] [المالية] [التخطيط ▾] [التواصل ▾] [المزيد ▾] │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ CONTEXT ACTIONS BAR (route-specific)                         │
│ [+ تقرير يومي] [📷 رفع صور] ...                              │
├─────────────────────────────────────────────────────────────┤
│ PAGE CONTENT                                                 │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Groups
| Group ID | Arabic | English | Sub-routes |
|----------|--------|---------|------------|
| execution | التنفيذ | Execution | field, supervisor |
| finance | المالية | Finance | (direct link) |
| planning | التخطيط | Planning | timeline, changes |
| communication | التواصل | Communication | documents, chat, updates |
| more | المزيد | More | owner, insights, team |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |
