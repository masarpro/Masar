# Phase 10: Project Timeline - Manual Test Guide

## Overview
Phase 10 adds a project timeline system with milestones, planned vs actual tracking, progress updates, and timeline health indicators (ON_TRACK, AT_RISK, DELAYED).

## Prerequisites
- Phase 1-8 completed and tested
- Database migrations applied (`pnpm generate && pnpm push`)
- At least one project created

---

## 1. Database Model

### 1.1 ProjectMilestone Model Verification
**Check via Prisma Studio or direct DB query**

| Field | Type | Description |
|-------|------|-------------|
| id | cuid | Primary key |
| organizationId | String | Multi-tenancy |
| projectId | String | Parent project |
| title | String | Milestone name |
| description | String? | Optional details |
| orderIndex | Int | For ordering |
| plannedStart | DateTime? | Planned start date |
| plannedEnd | DateTime? | Planned end date |
| actualStart | DateTime? | Actual start date |
| actualEnd | DateTime? | Actual end date |
| status | MilestoneStatus | PLANNED/IN_PROGRESS/COMPLETED/DELAYED |
| progress | Float | 0-100 |
| isCritical | Boolean | Critical path flag |

---

## 2. Timeline Page Access

### 2.1 Access Timeline from Project Overview
**Location**: Project Overview → Timeline Card

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to a project overview page | Project overview displays |
| 2 | Find "الجدول الزمني" (Timeline) card | Card visible in sections grid |
| 3 | Click on Timeline card | Navigates to /projects/[id]/timeline |
| 4 | Verify page header | Shows "الجدول الزمني" title |

---

## 3. Empty State

### 3.1 Empty Timeline View
**Location**: /projects/[projectId]/timeline (new project)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open timeline for project with no milestones | Empty state displays |
| 2 | Verify empty state message | Shows "لا توجد مراحل" |
| 3 | Verify "إضافة مرحلة" button | Button is visible and clickable |

---

## 4. Create Milestone

### 4.1 Create Basic Milestone
**Location**: Timeline page → Add Milestone

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "إضافة مرحلة" button | Dialog opens |
| 2 | Enter title: "أعمال القواعد" | Title field populated |
| 3 | Enter description (optional) | Description field populated |
| 4 | Set planned start date | Date picker works |
| 5 | Set planned end date | Date picker works |
| 6 | Click "إنشاء المرحلة" | Dialog closes, milestone appears |
| 7 | Toast notification | Shows success message |

### 4.2 Create Critical Milestone
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new milestone | Dialog opens |
| 2 | Toggle "مرحلة حرجة" on | Switch activated |
| 3 | Submit | Milestone created with orange border/indicator |

### 4.3 Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to submit without title | Validation error |
| 2 | Title longer than 200 chars | Validation error |

---

## 5. Milestone Card Display

### 5.1 Card Elements
| Element | Expected Display |
|---------|------------------|
| Title | Bold, visible |
| Critical indicator | Orange triangle icon if isCritical |
| Status badge | PLANNED/IN_PROGRESS/COMPLETED/DELAYED |
| Health badge | ON_TRACK (green) / AT_RISK (orange) / DELAYED (red) |
| Planned dates | Format: DD MMM YYYY - DD MMM YYYY |
| Actual dates | Shows when started/completed |
| Progress bar | 0-100% visual |
| Progress percentage | Displayed numerically |

---

## 6. Milestone Actions

### 6.1 Start Milestone
**Condition**: Status = PLANNED

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find milestone with PLANNED status | "بدء" button visible |
| 2 | Click "بدء" | Status changes to IN_PROGRESS |
| 3 | Verify actualStart | Set to today's date |
| 4 | Toast notification | "تم بدء المرحلة" |

### 6.2 Complete Milestone
**Condition**: Status = IN_PROGRESS or DELAYED

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find milestone in progress | "إنهاء" button visible |
| 2 | Click "إنهاء" | Status changes to COMPLETED |
| 3 | Verify actualEnd | Set to today's date |
| 4 | Verify progress | Set to 100% |
| 5 | Toast notification | "تم إنهاء المرحلة" |

### 6.3 Update Progress
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click dropdown menu (⋮) | Menu opens |
| 2 | Select "تحديث التقدم" | Prompt appears |
| 3 | Enter value (e.g., 50) | Input accepted |
| 4 | Confirm | Progress bar updates |

### 6.4 Edit Milestone
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click dropdown menu (⋮) | Menu opens |
| 2 | Select "تعديل" | Edit dialog opens |
| 3 | Change title | Title field editable |
| 4 | Save | Changes persisted |

### 6.5 Delete Milestone
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click dropdown menu (⋮) | Menu opens |
| 2 | Select "حذف" | Confirmation prompt |
| 3 | Confirm deletion | Milestone removed from list |
| 4 | Toast notification | "تم حذف المرحلة" |

---

## 7. Timeline Health Logic

### 7.1 Health Status Calculation

| Condition | Expected Status |
|-----------|-----------------|
| actualEnd exists OR status=COMPLETED | ON_TRACK |
| plannedEnd >= today | ON_TRACK |
| plannedEnd within 7 days AND progress < 80% | AT_RISK |
| plannedEnd < today AND NOT completed | DELAYED |

### 7.2 Test AT_RISK Detection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create milestone with plannedEnd = today + 5 days | Milestone created |
| 2 | Set progress to 30% | Progress updated |
| 3 | Check health badge | Shows AT_RISK (orange) |

### 7.3 Test DELAYED Detection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create milestone with plannedEnd = yesterday | Milestone created |
| 2 | Don't set actualEnd | Status is DELAYED |
| 3 | Check health badge | Shows DELAYED (red) |
| 4 | Check warning card | Yellow warning appears with count |

---

## 8. Health Summary Bar

### 8.1 Summary Display
**Location**: Top of timeline page (when milestones exist)

| Element | Expected |
|---------|----------|
| Health summary label | "ملخص الصحة" |
| ON_TRACK count | Green badge with count |
| AT_RISK count | Orange badge with count (if any) |
| DELAYED count | Red badge with count (if any) |
| Completed ratio | X/Y format |
| Overall progress | Percentage + progress bar |

### 8.2 Delayed Warning Card
**Condition**: At least one delayed milestone

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Have delayed milestones | Warning card appears |
| 2 | Check warning text | Shows count of delayed |
| 3 | Warning styling | Red/orange background |

---

## 9. Multi-Tenant Isolation

### 9.1 Organization Isolation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create milestones in Org A | Milestones visible in Org A |
| 2 | Switch to Org B | Org A milestones NOT visible |
| 3 | Create milestones in Org B | Only Org B milestones visible |

### 9.2 Project Isolation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create milestones in Project 1 | Visible in Project 1 |
| 2 | Navigate to Project 2 | Project 1 milestones NOT visible |

---

## 10. API Endpoints

### 10.1 List Milestones
```
GET /api/project-timeline/milestones
Input: { organizationId, projectId }
Output: { milestones: [...] }
```

### 10.2 Create Milestone
```
POST /api/project-timeline/milestones
Input: { organizationId, projectId, title, description?, plannedStart?, plannedEnd?, isCritical? }
Output: { milestone }
```

### 10.3 Update Milestone
```
PUT /api/project-timeline/milestones/{milestoneId}
Input: { organizationId, projectId, milestoneId, ...updates }
Output: { milestone }
```

### 10.4 Mark Actual
```
POST /api/project-timeline/milestones/{milestoneId}/actual
Input: { organizationId, projectId, milestoneId, actualStart?, actualEnd?, progress? }
Output: { milestone }
```

### 10.5 Start Milestone
```
POST /api/project-timeline/milestones/{milestoneId}/start
Input: { organizationId, projectId, milestoneId }
Output: { milestone }
```

### 10.6 Complete Milestone
```
POST /api/project-timeline/milestones/{milestoneId}/complete
Input: { organizationId, projectId, milestoneId }
Output: { milestone }
```

### 10.7 Get Timeline Health
```
GET /api/project-timeline/health
Input: { organizationId, projectId }
Output: { health: { total, completed, delayed, atRisk, onTrack, inProgress, overallProgress } }
```

---

## 11. RTL Support

### 11.1 Arabic Layout
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set language to Arabic | Interface in Arabic |
| 2 | Check text alignment | Right-to-left |
| 3 | Check date formats | Arabic locale |
| 4 | Check progress bars | Correct direction |

---

## 12. Mobile Responsiveness

### 12.1 Mobile View
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View on mobile device | Cards stack vertically |
| 2 | No horizontal scroll | Content fits screen |
| 3 | Touch interactions | Buttons accessible |
| 4 | Dialogs | Full-width on mobile |

---

## Files Created

### Database
- `packages/database/prisma/schema.prisma` - MilestoneStatus enum + updated ProjectMilestone model
- `packages/database/prisma/queries/project-timeline.ts` - Timeline queries

### API
- `packages/api/modules/project-timeline/router.ts`
- `packages/api/modules/project-timeline/procedures/list-milestones.ts`
- `packages/api/modules/project-timeline/procedures/create-milestone.ts`
- `packages/api/modules/project-timeline/procedures/update-milestone.ts`
- `packages/api/modules/project-timeline/procedures/mark-actual.ts`
- `packages/api/modules/project-timeline/procedures/get-timeline-health.ts`

### Frontend
- `apps/web/app/(saas)/.../projects/[projectId]/timeline/page.tsx`
- `apps/web/modules/saas/projects-timeline/components/TimelineBoard.tsx`
- `apps/web/modules/saas/projects-timeline/components/MilestoneCard.tsx`
- `apps/web/modules/saas/projects-timeline/components/TimelineHealthBadge.tsx`
- `apps/web/modules/saas/projects-timeline/components/CreateMilestoneForm.tsx`

---

## Sign-off

| Tester | Date | Result |
|--------|------|--------|
| | | |

---

## Notes
- Timeline is designed for simplicity - no complex dependencies or Gantt charts
- Health indicators are calculated dynamically, not stored in database
- Progress can be updated independently of status
- Completing a milestone automatically sets progress to 100%
- Starting a milestone sets actualStart to today's date
