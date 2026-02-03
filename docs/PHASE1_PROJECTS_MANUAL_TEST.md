# Projects Module Phase 1 - Manual Test Checklist

## Prerequisites
1. Run database migration: `pnpm db:push`
2. Start dev server: `pnpm dev`
3. Login as a user with organization access

## Test Cases

### 1. Navigation
- [ ] Projects link appears in sidebar when organization is active
- [ ] Clicking Projects navigates to `/app/{org-slug}/projects`
- [ ] Projects menu item is highlighted when on projects pages

### 2. Projects List Page (`/app/{org-slug}/projects`)
- [ ] Page loads with header "المشاريع" (Arabic) or "Projects" (English)
- [ ] Statistics cards show: Total, Active, Completed, Total Value
- [ ] Search input filters projects by name/client/location
- [ ] Status dropdown filters by ACTIVE/ON_HOLD/COMPLETED
- [ ] Empty state shows when no projects exist
- [ ] "مشروع جديد" / "New Project" button visible and links to create page

### 3. Create Project Page (`/app/{org-slug}/projects/new`)
- [ ] Form displays with all fields
- [ ] Name field is required (shows validation error if empty)
- [ ] Optional fields work: clientName, location, contractValue, dates, type
- [ ] Submit creates project and redirects to overview
- [ ] Back button returns to list
- [ ] Error toast shows on API failure

### 4. Project Overview Page (`/app/{org-slug}/projects/{id}`)
- [ ] Header shows project name and status badge
- [ ] Client name and location display (if provided)
- [ ] Progress bar shows correct percentage (0% for new projects)
- [ ] KPI cards display:
  - Progress percentage
  - Contract Value (or "-" if not set)
  - Days Remaining (calculated from endDate, or "-" if not set)
  - Status
- [ ] Quick Actions section shows "Coming Soon" placeholders:
  - Official Owner Update
  - Upload Photos
  - Create Extract
- [ ] Placeholder sections show "Coming Soon":
  - Documents
  - Cost Studies
  - Team
  - Reports
- [ ] Back button returns to projects list

### 5. RTL Support
- [ ] All text aligns correctly in Arabic mode
- [ ] Icons position correctly (chevron direction for back buttons)
- [ ] Date inputs work in both directions
- [ ] Currency displays correctly (ر.س)

### 6. Multi-Tenant Isolation
- [ ] User from Org A cannot access Org B's projects via direct URL
- [ ] API returns FORBIDDEN without organization membership
- [ ] Projects list only shows projects from current organization

### 7. Database Verification
- [ ] New project has correct organizationId
- [ ] New project has correct createdById
- [ ] Slug is unique within organization
- [ ] All indexed fields are properly indexed

## API Endpoints to Test

### List Projects
```bash
# Should return projects for the organization
GET /api/rpc/projects.list
Input: { organizationId: "..." }
```

### Create Project
```bash
# Should create a new project
POST /api/rpc/projects.create
Input: {
  organizationId: "...",
  name: "Test Project",
  clientName: "Test Client",
  location: "Riyadh",
  contractValue: 1000000,
  startDate: "2026-01-01",
  endDate: "2026-12-31"
}
```

### Get Project
```bash
# Should return project details
GET /api/rpc/projects.getById
Input: { id: "...", organizationId: "..." }
```

## Known Limitations (Phase 1)

1. **Permissions**: Permission checks (projects.view, projects.create) are prepared but not enforced yet. Current implementation only checks organization membership.

2. **Quick Actions**: All quick action buttons are disabled with "Coming Soon" badge. Full functionality will be added in Phase 2.

3. **Project Members**: ProjectMember model is not implemented in Phase 1.

4. **Progress Updates**: Project progress can only be updated via direct database access. UI for progress updates will come in Phase 2.

## Files Created/Modified

### Created
- `packages/database/prisma/queries/projects.ts`
- `packages/api/modules/projects/router.ts`
- `packages/api/modules/projects/procedures/list-projects.ts`
- `packages/api/modules/projects/procedures/create-project.ts`
- `packages/api/modules/projects/procedures/get-project.ts`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/page.tsx`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/new/page.tsx`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/page.tsx`
- `apps/web/modules/saas/projects/components/ProjectsList.tsx`
- `apps/web/modules/saas/projects/components/CreateProjectForm.tsx`
- `apps/web/modules/saas/projects/components/ProjectOverview.tsx`

### Modified
- `packages/database/prisma/schema.prisma` (added Project model + enums)
- `packages/database/prisma/queries/index.ts` (export projects)
- `packages/api/orpc/router.ts` (mounted projects router)
- `apps/web/modules/saas/shared/components/AppWrapper.tsx` (added nav link)
- `packages/i18n/translations/ar.json` (added projects translations)
- `packages/i18n/translations/en.json` (added projects translations)
