# Phase 7 - Differentiation & Intelligence Layer - Manual Test Checklist

## Overview
Phase 7 adds the following features:
1. **Project Templates** - Copy project structure for quick starts
2. **Official Updates Generator** - Structured updates from field + finance data
3. **Smart Alerts** - Rule-based insights (delay risk, cashflow risk, missing reports)
4. **Weekly Digest** - Automated summary (on-demand)

---

## Pre-requisites
- User logged in with organization membership
- At least one active project with:
  - Some daily reports
  - Some progress updates
  - Some claims/payments
  - Some issues

---

## 1. Project Templates

### 1.1 View Templates List
- [ ] Navigate to `/app/[organizationSlug]/projects/templates`
- [ ] Page loads without errors
- [ ] Empty state shown if no templates exist

### 1.2 Create Template from Scratch
- [ ] Click "قالب جديد" (New Template)
- [ ] Fill in template name (required)
- [ ] Fill in description (optional)
- [ ] Click "إنشاء القالب"
- [ ] Template appears in list
- [ ] Toast notification shows success

### 1.3 Create Template from Project (API only in Phase 7)
- [ ] Via API call: `projectTemplates.create` with `sourceProjectId`
- [ ] Template is created with milestones from source project

### 1.4 Apply Template to Project (API only in Phase 7)
- [ ] Via API call: `projectTemplates.apply` with `templateId` and `projectId`
- [ ] Milestones are created in target project
- [ ] Idempotent: running again doesn't duplicate milestones

---

## 2. Project Insights (Smart Alerts)

### 2.1 View Insights Page
- [ ] Navigate to `/app/[organizationSlug]/projects/[projectId]/insights`
- [ ] Page loads without errors
- [ ] Project name shown in header

### 2.2 Stats Cards Display
- [ ] Critical alerts count displayed
- [ ] Warnings count displayed
- [ ] Info count displayed

### 2.3 Alert Computation
Test the following scenarios:

#### Missing Daily Report Alert
- [ ] Remove all daily reports from last 2 days
- [ ] Refresh insights page
- [ ] "تقرير يومي مفقود" alert appears with WARN severity

#### Stale Progress Alert
- [ ] Ensure no progress updates in last 7 days
- [ ] Refresh insights page
- [ ] "تقدم قديم" alert appears with INFO severity

#### Overdue Payment Alert
- [ ] Create a claim with APPROVED status and past dueDate
- [ ] Refresh insights page
- [ ] "دفعة متأخرة" alert appears with CRITICAL severity

#### Cost Overrun Risk Alert
- [ ] Set project contractValue to 100,000
- [ ] Add expenses totaling > 80,000
- [ ] Keep progress < 70%
- [ ] Refresh insights page
- [ ] "خطر تجاوز التكلفة" alert appears with CRITICAL severity

#### Too Many Open Issues Alert
- [ ] Create > 10 open issues
- [ ] Refresh insights page
- [ ] "مشاكل مفتوحة كثيرة" alert appears with WARN severity

### 2.4 Acknowledge Alert
- [ ] Click "تم الاطلاع" on an alert
- [ ] Alert moves to acknowledged section
- [ ] Toast notification shows success

### 2.5 Acknowledged Alerts Display
- [ ] Previously acknowledged alerts shown in separate section
- [ ] Shows acknowledger name and date

---

## 3. Official Updates Generator

### 3.1 View Updates Page
- [ ] Navigate to `/app/[organizationSlug]/projects/[projectId]/updates`
- [ ] Page loads without errors
- [ ] Project name shown in header

### 3.2 Generate Draft
- [ ] Click "إنشاء مسودة" (Generate Draft)
- [ ] Draft preview appears with:
  - [ ] Auto-generated headline
  - [ ] Current progress percentage
  - [ ] Phase label (if available)
  - [ ] Work done summary (from latest report)
  - [ ] Next payment info (if available)
  - [ ] Photo thumbnails (if available)

### 3.3 Edit Draft
- [ ] Click "إنشاء مسودة" to enter edit mode
- [ ] Modify headline
- [ ] Modify work done summary
- [ ] Modify blockers (optional)
- [ ] Modify next steps
- [ ] Progress percentage displayed (read-only)

### 3.4 Publish Update
- [ ] Click "نشر للمالك" (Publish to Owner)
- [ ] Toast notification shows success
- [ ] Message appears in Owner Chat channel (check /chat page)
- [ ] Message has `isUpdate: true` flag
- [ ] Audit log entry created

### 3.5 Validation
- [ ] Cannot publish without headline
- [ ] Error toast shown if headline is empty

---

## 4. Weekly Digest (API Only)

### 4.1 Subscribe to Digest
- [ ] Via API call: `digests.subscribe` with `organizationId`
- [ ] Subscription created successfully

### 4.2 Get Weekly Digest
- [ ] Via API call: `digests.getWeekly` with `organizationId`
- [ ] Response includes:
  - [ ] Summary stats (total projects, missing reports, etc.)
  - [ ] Projects missing reports list
  - [ ] Upcoming payments list
  - [ ] New issues list
  - [ ] Progress updates list

### 4.3 Project-specific Digest
- [ ] Via API call: `digests.getWeekly` with `organizationId` and `projectId`
- [ ] Response scoped to single project

### 4.4 Unsubscribe
- [ ] Via API call: `digests.unsubscribe`
- [ ] Subscription disabled

---

## 5. Security & Multi-tenancy

### 5.1 Organization Isolation
- [ ] User from org A cannot see templates from org B
- [ ] User from org A cannot access insights for project in org B
- [ ] User from org A cannot generate updates for project in org B

### 5.2 Permission Checks
- [ ] Users without projects.view cannot access insights
- [ ] Users without projects.edit cannot publish updates

---

## 6. Integration Points

### 6.1 Project Overview Integration
- [ ] "التنبيهات الذكية" (Insights) button visible
- [ ] "التحديثات الرسمية" (Updates) button visible
- [ ] Both buttons link to correct pages

### 6.2 Translation Support
- [ ] Arabic translations display correctly
- [ ] English translations display correctly (switch locale)

---

## Known Limitations (Phase 7)

1. Templates page is basic - no inline editing of template items
2. Apply template is API-only (no UI button yet)
3. Weekly digest is on-demand only (no scheduled jobs)
4. Alerts are computed on-demand (no background refresh)
5. No email delivery for digests yet

---

## Files Created/Modified

### New Files - Database
- `packages/database/prisma/queries/project-templates.ts`
- `packages/database/prisma/queries/project-insights.ts`
- `packages/database/prisma/queries/digests.ts`

### New Files - API
- `packages/api/modules/project-templates/*`
- `packages/api/modules/project-insights/*`
- `packages/api/modules/project-updates/*`
- `packages/api/modules/digests/*`

### New Files - Frontend
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/templates/page.tsx`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/insights/page.tsx`
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/updates/page.tsx`
- `apps/web/modules/saas/projects/components/ProjectTemplates.tsx`
- `apps/web/modules/saas/projects/components/ProjectInsights.tsx`
- `apps/web/modules/saas/projects/components/ProjectUpdates.tsx`

### Modified Files
- `packages/database/prisma/schema.prisma` - Added Phase 7 models
- `packages/database/prisma/queries/index.ts` - Export new queries
- `packages/api/orpc/router.ts` - Mount new routers
- `apps/web/modules/saas/projects/components/ProjectOverview.tsx` - Added insights/updates links
- `packages/i18n/translations/en.json` - Added Phase 7 translations
- `packages/i18n/translations/ar.json` - Added Phase 7 translations

---

## Next Steps (Phase 8)
- Saudi-friendly integrations (WhatsApp/SMS/Email)
- PDF exports (Update PDF, Claim PDF, Weekly Report PDF)
- CSV/Excel data export
- Calendar integration (ICS)
- Share links for documents/updates
