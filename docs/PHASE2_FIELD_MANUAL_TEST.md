# Phase 2: Field Execution + Supervisor Mode - Manual Testing Checklist

## Prerequisites
1. Run `pnpm prisma generate` and `pnpm prisma db push` from the database package
2. Have a test organization and project created
3. Be logged in as a user with organization membership

## Test Cases

### 1. Database Schema
- [ ] Run `pnpm prisma db push` - schema should apply without errors
- [ ] Verify enums are created: `IssueSeverity`, `IssueStatus`, `PhotoCategory`, `WeatherCondition`
- [ ] Verify models are created: `ProjectDailyReport`, `ProjectPhoto`, `ProjectIssue`, `ProjectProgressUpdate`

### 2. Project Overview
- [ ] Navigate to a project overview page
- [ ] Verify "التنفيذ الميداني" (Field Execution) button is visible and enabled
- [ ] Verify "وضع المشرف" (Supervisor Mode) button is visible and enabled
- [ ] Click "التنفيذ الميداني" -> navigates to `/field`
- [ ] Click "وضع المشرف" -> navigates to `/supervisor`

### 3. Field Timeline Page (`/field`)
- [ ] Page loads without errors
- [ ] Shows 4 quick action buttons (Daily Report, Upload Photo, New Issue, Update Progress)
- [ ] Timeline section shows "لا توجد أنشطة" when empty
- [ ] Back button returns to project overview

### 4. Daily Report Form (`/field/new-report`)
- [ ] Form loads with today's date pre-filled
- [ ] Can select weather condition
- [ ] Can enter manpower count
- [ ] Can enter equipment used
- [ ] Work done field is required (validation works)
- [ ] Can enter blockers (optional)
- [ ] Submit creates report successfully
- [ ] Success toast appears
- [ ] Redirects to field timeline
- [ ] New report appears in timeline

### 5. Photo Upload Form (`/field/upload`)
- [ ] Form loads correctly
- [ ] URL field validates for valid URLs
- [ ] Preview shows when valid URL is entered
- [ ] Can select photo category
- [ ] Can enter caption (optional)
- [ ] Submit creates photo entry successfully
- [ ] Success toast appears
- [ ] Redirects to field timeline
- [ ] Photo appears in timeline

### 6. Issue Form (`/field/new-issue`)
- [ ] Form loads correctly
- [ ] Title field is required
- [ ] Description field is required
- [ ] Can select severity level (LOW, MEDIUM, HIGH, CRITICAL)
- [ ] Can select due date (optional)
- [ ] Submit creates issue successfully
- [ ] Success toast appears
- [ ] Redirects to field timeline
- [ ] Issue appears in timeline with correct status badges

### 7. Supervisor Mode (`/supervisor`)
- [ ] Page loads with mobile-friendly layout
- [ ] Current progress percentage is displayed
- [ ] 4 large action buttons are visible
- [ ] "تقرير يومي" navigates to new report form
- [ ] "رفع صورة" navigates to photo upload
- [ ] "الإبلاغ عن مشكلة" navigates to issue form
- [ ] "تحديث التقدم" opens inline progress form
- [ ] Progress slider works (0-100)
- [ ] Can enter phase label
- [ ] Can enter note
- [ ] Saving progress updates both progress update log and project progress
- [ ] "العودة للمشروع" returns to project overview
- [ ] "عرض الجدول الزمني" link navigates to field timeline

### 8. Multi-tenant Security
- [ ] User A creates project in Org A
- [ ] User B (different org) cannot access project field pages via direct URL
- [ ] API returns FORBIDDEN for cross-org requests

### 9. Permission Checks
- [ ] User with 'view' permission can see field timeline
- [ ] User without organization membership gets redirected/error

### 10. Arabic RTL Layout
- [ ] All pages display correctly in RTL mode
- [ ] Text alignment is correct
- [ ] Icons/buttons are positioned correctly

## Known Limitations (Phase 2)
- Photo upload uses URL only (actual file upload in Phase 6)
- No real-time chat (Phase 4)
- No issue assignment UI (simplified in this phase)

## Notes
- All timestamps should display in Arabic format
- Progress updates should reflect immediately on project overview
- Weather icons should match selected weather condition
