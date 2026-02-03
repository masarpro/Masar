# Phase 5: Owner Portal - Manual Testing Guide

## Overview
Phase 5 implements a **token-based Owner Portal** that allows project owners to view project information without requiring login. This document provides step-by-step instructions for testing all features.

---

## Prerequisites

1. Ensure the database is migrated with the latest schema
2. Have at least one project with:
   - Financial data (claims)
   - Milestones (optional)
   - Messages in the OWNER channel (optional)

---

## Test Cases

### 1. Access Link Management (Internal)

**Location:** `/app/[organizationSlug]/projects/[projectId]/owner`

#### 1.1 Create Access Link
- [ ] Navigate to a project's owner access page
- [ ] Click "Create Access Link" button
- [ ] Enter an optional label (e.g., "Owner - Ahmed")
- [ ] Click "Create"
- [ ] Verify success dialog appears with the portal URL
- [ ] Copy the URL

#### 1.2 View Access Links
- [ ] Verify the new link appears in the list
- [ ] Check that status badge shows "Active"
- [ ] Verify creation date and creator name are displayed

#### 1.3 Copy Link
- [ ] Click "Copy" button on an active link
- [ ] Verify toast notification "Link copied to clipboard"
- [ ] Paste and verify the URL format: `/owner/[token]`

#### 1.4 Open Portal
- [ ] Click "Open" button
- [ ] Verify it opens in a new tab
- [ ] Verify the portal loads correctly

#### 1.5 Revoke Access
- [ ] Click the trash icon on an active link
- [ ] Verify confirmation dialog appears
- [ ] Click "Revoke"
- [ ] Verify link status changes to "Revoked"
- [ ] Verify action buttons are hidden for revoked links

---

### 2. Owner Portal - Summary Page

**Location:** `/owner/[token]`

#### 2.1 Valid Token Access
- [ ] Navigate to a valid portal URL
- [ ] Verify loading spinner appears initially
- [ ] Verify header shows:
  - Organization logo (or placeholder icon)
  - Project name
  - Organization name
- [ ] Verify navigation tabs are visible:
  - Summary (active)
  - Schedule
  - Payments
  - Chat

#### 2.2 Project Information
- [ ] Verify project name is displayed
- [ ] Verify status badge (ACTIVE/ON_HOLD/COMPLETED)
- [ ] Verify client name if available
- [ ] Verify location if available
- [ ] Verify current phase badge if available

#### 2.3 Progress Section
- [ ] Verify progress percentage is displayed
- [ ] Verify progress bar matches the percentage

#### 2.4 KPI Cards
- [ ] Verify Progress card shows correct percentage
- [ ] Verify Contract Value card shows formatted currency (SAR)
- [ ] Verify Days Remaining card shows correct count
- [ ] Verify Delivery Date card shows formatted date

#### 2.5 Latest Update
- [ ] If official update exists, verify it's displayed with:
  - Update content
  - Sender name
  - Date

#### 2.6 Upcoming Payment
- [ ] If upcoming payment exists, verify it shows:
  - Claim number
  - Amount in SAR
  - Due date

#### 2.7 Invalid Token Access
- [ ] Navigate to `/owner/invalid-token-here`
- [ ] Verify error page appears with:
  - Warning icon
  - "Invalid Link" message
  - Description text

---

### 3. Owner Portal - Schedule Page

**Location:** `/owner/[token]/schedule`

#### 3.1 Navigation
- [ ] Click "Schedule" tab
- [ ] Verify URL changes to `/owner/[token]/schedule`
- [ ] Verify Schedule tab is now active

#### 3.2 Header Section
- [ ] Verify "Project Schedule" title
- [ ] Verify Start Date if available
- [ ] Verify End Date if available

#### 3.3 Milestones Timeline
- [ ] If no milestones, verify empty state message

#### 3.4 Milestone Display (if milestones exist)
- [ ] Verify timeline line is visible
- [ ] For each milestone:
  - [ ] Check status icon (checkmark/warning/circle)
  - [ ] Verify title and description
  - [ ] Check status badge (Completed/Delayed/Pending)
  - [ ] Verify planned date if set
  - [ ] Verify actual date if set
  - [ ] For delayed items, verify delay days shown

---

### 4. Owner Portal - Payments Page

**Location:** `/owner/[token]/payments`

#### 4.1 Navigation
- [ ] Click "Payments" tab
- [ ] Verify URL changes to `/owner/[token]/payments`

#### 4.2 Summary Cards
- [ ] Verify Contract Value card
- [ ] Verify Total Paid card
- [ ] Verify Remaining card
- [ ] Verify Paid Percentage card
- [ ] Verify all amounts are formatted correctly

#### 4.3 Claims Table
- [ ] If no claims, verify empty state message
- [ ] If claims exist, verify table headers:
  - Claim No.
  - Description
  - Amount
  - Due Date
  - Paid Date
  - Status

#### 4.4 Claim Rows
- [ ] Verify claim number format (#1, #2, etc.)
- [ ] Verify amount is formatted as SAR currency
- [ ] Verify dates are formatted correctly
- [ ] Verify status badges with correct colors:
  - Draft (gray)
  - Submitted (blue)
  - Approved (amber)
  - Paid (green)
  - Rejected (red)

---

### 5. Owner Portal - Chat Page

**Location:** `/owner/[token]/chat`

#### 5.1 Navigation
- [ ] Click "Chat" tab
- [ ] Verify URL changes to `/owner/[token]/chat`

#### 5.2 Chat Header
- [ ] Verify "Chat" title with icon
- [ ] Verify "Refresh" button is visible

#### 5.3 Empty State
- [ ] If no messages, verify empty state shows:
  - Message icon
  - "No messages yet"
  - "Start a conversation..."

#### 5.4 Sending Messages
- [ ] Type a message in the input area
- [ ] Press Enter (or click send button)
- [ ] Verify message appears in the chat
- [ ] Verify owner messages are styled differently (right-aligned, primary color)
- [ ] Verify "[من المالك]" prefix is stripped from display

#### 5.5 Receiving Messages
- [ ] Click "Refresh" button
- [ ] Verify refresh icon animates while fetching
- [ ] Verify new messages from team appear (left-aligned, gray)
- [ ] Verify sender name and timestamp are shown

#### 5.6 Message Input
- [ ] Verify placeholder text
- [ ] Verify hint text about Enter key
- [ ] Verify message clears after sending
- [ ] Verify input is disabled while sending

---

### 6. RTL Support (Arabic)

#### 6.1 Layout Direction
- [ ] Verify all content respects RTL layout
- [ ] Verify icons and text are properly aligned
- [ ] Verify navigation items are in correct order

#### 6.2 Date Formatting
- [ ] Verify dates use Arabic format (ar-SA)
- [ ] Verify currency uses Arabic format

#### 6.3 Translations
- [ ] Verify all labels are in Arabic
- [ ] Check for any untranslated strings

---

### 7. Responsive Design

#### 7.1 Mobile View
- [ ] Test summary page on mobile
- [ ] Verify KPI cards stack properly
- [ ] Verify navigation tabs scroll horizontally
- [ ] Verify chat is usable on mobile

#### 7.2 Tablet View
- [ ] Verify 2-column layout for KPI cards
- [ ] Verify tables scroll horizontally if needed

---

## API Endpoints

### Internal (Authenticated)
- `POST /api/project-owner/createAccess` - Create access link
- `GET /api/project-owner/listAccess` - List access links
- `POST /api/project-owner/revokeAccess` - Revoke access link
- `POST /api/project-owner/sendOfficialUpdate` - Send official update

### Portal (Token-Based, Public)
- `GET /api/owner-portal/summary` - Get project summary
- `GET /api/owner-portal/schedule` - Get milestones
- `GET /api/owner-portal/payments` - Get payment info
- `GET /api/owner-portal/messages` - List messages
- `POST /api/owner-portal/messages` - Send message
- `GET /api/owner-portal/updates` - List official updates

---

## Database Models

### ProjectOwnerAccess
- Stores token-based access links
- Fields: token, label, expiresAt, isRevoked, createdById

### ProjectMilestone
- Stores project milestones for schedule
- Fields: title, description, plannedDate, actualDate, isCompleted, sortOrder

---

## Known Limitations

1. Tokens are generated server-side and cannot be regenerated
2. Expired tokens automatically become invalid
3. Messages from portal are prefixed with "[من المالك]" for identification
4. Only OWNER channel messages are visible in the portal

---

## Troubleshooting

### Portal shows "Invalid Link"
1. Check if the token exists in the database
2. Check if the access has been revoked
3. Check if the access has expired
4. Check if the project still exists

### Messages not appearing
1. Ensure messages are in the OWNER channel
2. Click the Refresh button
3. Check browser console for errors

### Payments not showing
1. Ensure claims exist for the project
2. Check that organizationId matches

---

## Sign-off

| Test Area | Tester | Date | Status |
|-----------|--------|------|--------|
| Access Management | | | |
| Summary Page | | | |
| Schedule Page | | | |
| Payments Page | | | |
| Chat Page | | | |
| RTL Support | | | |
| Responsive Design | | | |
