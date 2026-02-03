# Phase 8: Saudi-Friendly Integrations - Manual Test Guide

## Overview
Phase 8 adds Saudi-friendly integrations including multi-channel messaging (WhatsApp/SMS/Email), PDF exports, CSV data exports, calendar ICS integration, and signed share links.

## Prerequisites
- Phase 1-7 completed and tested
- Database migrations applied (`pnpm generate && pnpm push`)
- At least one project with sample data (updates, claims, expenses, issues)

---

## 1. Messaging Provider Interface

### 1.1 Provider Status Check
**Location**: Settings → Integrations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to organization settings | Settings page loads |
| 2 | Click on "Integrations" menu item | Integrations settings page displays |
| 3 | View Provider Status section | Shows configuration status for Email, WhatsApp, SMS |
| 4 | Verify email shows "Configured" if RESEND_API_KEY is set | Badge shows correct status |

### 1.2 Channel Settings
**Location**: Settings → Integrations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle Email channel switch | Switch toggles (disabled if not configured) |
| 2 | Toggle WhatsApp channel switch | Switch toggles (disabled if not configured) |
| 3 | Toggle SMS channel switch | Switch toggles (disabled if not configured) |
| 4 | Select different default channel | Dropdown value changes |
| 5 | Click Save | Success toast appears |
| 6 | Refresh page | Settings persist |

### 1.3 Owner Notifications
**Location**: Settings → Integrations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle "Notify on official updates" | Switch toggles |
| 2 | Toggle "Notify on payment due" | Switch toggles |
| 3 | Click Save | Success toast appears |

---

## 2. PDF Generation APIs

### 2.1 Weekly Report PDF
**Location**: Project page → Export dropdown

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open a project with updates/expenses/issues | Project page loads |
| 2 | Click Export button | Dropdown menu opens |
| 3 | Click "Weekly Report" | HTML file downloads |
| 4 | Open downloaded file | Report shows project summary, updates, expenses, issues |

### 2.2 Claim PDF
**API Test** - Use browser console or API client

```javascript
// Test claim PDF generation
await apiClient.exports.generateClaimPDF({
  organizationId: "org_xxx",
  projectId: "proj_xxx",
  claimId: "claim_xxx",
  language: "ar"
});
```

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call generateClaimPDF with valid IDs | Returns base64 content |
| 2 | Decode and open content | PDF shows claim details |

### 2.3 Update PDF
**API Test**

```javascript
await apiClient.exports.generateUpdatePDF({
  organizationId: "org_xxx",
  projectId: "proj_xxx",
  updateId: "update_xxx",
  language: "ar"
});
```

---

## 3. CSV Export APIs

### 3.1 Expenses CSV
**Location**: Project page → Export dropdown

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Export → "Expenses (CSV)" | CSV file downloads |
| 2 | Open CSV in Excel/Numbers | Columns: Date, Category, Amount, Vendor, Note, Created By |
| 3 | Verify Arabic headers if language is AR | Headers in Arabic |
| 4 | Verify data matches project expenses | Data accurate |

### 3.2 Claims CSV
**Location**: Project page → Export dropdown

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Export → "Claims (CSV)" | CSV file downloads |
| 2 | Open CSV | Columns: Claim #, Period Start, Period End, Amount, Status, Due Date, Note |
| 3 | Verify data matches project claims | Data accurate |

### 3.3 Issues CSV
**Location**: Project page → Export dropdown

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Export → "Issues (CSV)" | CSV file downloads |
| 2 | Open CSV | Columns: Title, Description, Priority, Status, Category, Dates, Reporter |
| 3 | Verify data matches project issues | Data accurate |

---

## 4. Calendar ICS Export

### 4.1 Project Calendar
**Location**: Project page → Export dropdown

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Export → "Calendar (ICS)" | ICS file downloads |
| 2 | Import into calendar app (Google/Apple/Outlook) | Events appear |
| 3 | Verify milestones are included | Milestone events visible |
| 4 | Verify payment due dates are included | Payment events visible |
| 5 | Verify claim due dates are included | Claim events visible |

### 4.2 ICS Event Verification

| Event Type | Expected Properties |
|------------|---------------------|
| Milestone | Title with "مرحلة:" prefix, all-day event, target date |
| Claim | Title with claim number, all-day event, due date |
| Payment | Title with payment description, all-day event, due date |

---

## 5. Share Links

### 5.1 Create Share Link
**Location**: Project page → Share Links Manager

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Link" button | Dialog opens |
| 2 | Select resource type (Weekly Report) | Type selected |
| 3 | Select expiry (7 days) | Expiry selected |
| 4 | Click Create | Link created, copied to clipboard |
| 5 | Toast shows "Link copied" | Toast appears |

### 5.2 View Share Link List
**Location**: Project page → Share Links Manager

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View share links table | Table shows existing links |
| 2 | Verify columns: Type, Created, Expires, Views | All columns visible |
| 3 | Click copy icon | Link copied to clipboard |

### 5.3 Access Shared Resource
**Location**: /share/[token]

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open share link in new browser/incognito | Public share page loads |
| 2 | Verify project name displays | Project name visible |
| 3 | Verify resource type badge displays | Badge visible |
| 4 | Verify content loads based on type | Content appropriate for type |

### 5.4 Revoke Share Link
**Location**: Project page → Share Links Manager

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click trash icon on a share link | Link revoked |
| 2 | Toast shows "Share link revoked" | Toast appears |
| 3 | Link removed from list | Link no longer visible |
| 4 | Try accessing revoked link | Shows "Link not found" page |

### 5.5 Expired Link
**Location**: /share/[token]

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create link with 1-day expiry | Link created |
| 2 | Wait for expiry (or modify DB for testing) | Link expired |
| 3 | Access expired link | Shows "Link not found" page |

---

## 6. Message Delivery Logs

### 6.1 View Logs
**Location**: Settings → Integrations → Logs tab (or via API)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to message logs | Logs table displays |
| 2 | Verify columns: Channel, Recipient, Subject, Status, Date | All columns visible |
| 3 | Filter by channel (Email) | Only email logs shown |
| 4 | Filter by status (Sent) | Only sent logs shown |
| 5 | Pagination works | Navigate between pages |

---

## 7. Integration with Owner Portal

### 7.1 Notification Delivery
**Scenario**: Official update published with owner notification enabled

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable "Notify on official updates" in settings | Setting saved |
| 2 | Publish an official update | Update created |
| 3 | Check message delivery logs | Log entry for notification |
| 4 | Verify status (SENT or NOOP) | Status appropriate |

---

## 8. Error Handling

### 8.1 Invalid Share Token
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /share/invalid-token | Error page displays |
| 2 | Verify error message | "Link not found" message |
| 3 | Verify no crash/500 error | Graceful error handling |

### 8.2 Unconfigured Provider
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to enable WhatsApp without provider configured | Error message |
| 2 | Try to send via unconfigured channel | Error message |

---

## 9. RTL Support

### 9.1 Arabic Language Support
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to Arabic language | Interface in Arabic |
| 2 | Export CSV with Arabic language | Headers in Arabic |
| 3 | Generate PDF with Arabic language | Content in Arabic, RTL |
| 4 | View share page in Arabic | Content RTL |

---

## API Endpoints Created

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| integrations | /integrations/settings | GET | Get organization integration settings |
| integrations | /integrations/settings | POST | Update integration settings |
| integrations | /integrations/logs | GET | Get message delivery logs |
| integrations | /integrations/send | POST | Send a message |
| integrations | /integrations/send-bulk | POST | Send bulk messages |
| exports | /exports/update-pdf | POST | Generate update PDF |
| exports | /exports/claim-pdf | POST | Generate claim PDF |
| exports | /exports/weekly-report | POST | Generate weekly report PDF |
| exports | /exports/expenses-csv | POST | Export expenses to CSV |
| exports | /exports/claims-csv | POST | Export claims to CSV |
| exports | /exports/issues-csv | POST | Export issues to CSV |
| exports | /exports/calendar-ics | POST | Generate calendar ICS |
| shares | /shares/create | POST | Create share link |
| shares | /shares/list | GET | List share links |
| shares | /shares/revoke | POST | Revoke share link |
| shares | /shares/resource/{token} | GET | Get shared resource (public) |

---

## Database Models Added

| Model | Description |
|-------|-------------|
| OrganizationIntegrationSettings | Channel preferences and notification settings |
| MessageDeliveryLog | Audit log of sent messages |
| ShareLink | Token-based share links with expiry |

---

## Files Created

### API Layer
- `packages/api/lib/messaging/types.ts` - Messaging type definitions
- `packages/api/lib/messaging/providers/noop.ts` - NOOP fallback provider
- `packages/api/lib/messaging/providers/email.ts` - Email provider
- `packages/api/lib/messaging/providers/whatsapp.ts` - WhatsApp stub
- `packages/api/lib/messaging/providers/sms.ts` - SMS stub
- `packages/api/lib/messaging/send.ts` - Unified send function
- `packages/api/modules/integrations/` - Integration settings API
- `packages/api/modules/exports/` - PDF, CSV, ICS exports API
- `packages/api/modules/shares/` - Share links API

### Frontend
- `apps/web/app/share/[token]/page.tsx` - Public share page
- `apps/web/app/(saas)/app/.../settings/integrations/page.tsx` - Settings page
- `apps/web/modules/saas/integrations/` - Integration components

### Database
- `packages/database/prisma/queries/integrations.ts` - Integration queries
- `packages/database/prisma/queries/shares.ts` - Share link queries

---

## Sign-off

| Tester | Date | Result |
|--------|------|--------|
| | | |

---

## Notes
- WhatsApp and SMS providers are stubs - require actual provider integration for production
- PDF generation uses HTML format - can be upgraded to actual PDF with puppeteer/jspdf
- Share links use cuid2 for secure token generation
- All exports support Arabic and English languages
