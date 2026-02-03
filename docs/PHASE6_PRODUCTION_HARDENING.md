# Phase 6: Production Hardening - Documentation

## Overview
Phase 6 focuses on production readiness by implementing:
- Real file attachments (replacing URL-only approach)
- Enhanced notifications with channels and deduplication
- Extended audit trail
- Rate limiting for API endpoints
- Performance optimizations (indexes, pagination)

---

## What Changed

### 1. Database Schema Changes

#### New Models

**Attachment Model**
```prisma
model Attachment {
  id              String              @id @default(cuid())
  organizationId  String
  projectId       String?
  ownerType       AttachmentOwnerType // DOCUMENT, PHOTO, EXPENSE, ISSUE, MESSAGE, CLAIM
  ownerId         String
  fileName        String
  fileSize        Int                 // bytes
  mimeType        String
  storagePath     String              // S3 path
  uploadId        String?             @unique // idempotency key
  uploadedById    String
  createdAt       DateTime
}
```

#### New Enums

- `NotificationChannel`: IN_APP, EMAIL
- `DeliveryStatus`: PENDING, SENT, FAILED
- `AttachmentOwnerType`: DOCUMENT, PHOTO, EXPENSE, ISSUE, MESSAGE, CLAIM

#### Extended Enums

**AuditAction** (new values):
- TOKEN_CREATED
- TOKEN_REVOKED
- CLAIM_STATUS_CHANGED
- EXPENSE_CREATED
- ATTACHMENT_CREATED

#### Modified Models

**Notification** (new fields):
- `channel` - NotificationChannel (default: IN_APP)
- `deliveryStatus` - DeliveryStatus (default: PENDING for EMAIL, SENT for IN_APP)
- `dedupeKey` - unique string for duplicate prevention
- `metadata` - JSON for additional routing data
- `sentAt` - timestamp for email delivery

---

### 2. New API Endpoints

#### Attachments Router (`/api/attachments`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload-url` | POST | Generate signed upload URL |
| `/finalize` | POST | Finalize upload and create record |
| `/list` | GET | List attachments for an entity |
| `/download-url` | GET | Get signed download URL |
| `/delete` | POST | Delete an attachment |

---

### 3. Rate Limiting

**Configuration** (`packages/api/lib/rate-limit.ts`)

| Preset | Window | Max Requests | Use Case |
|--------|--------|--------------|----------|
| READ | 60s | 60 | Standard read operations |
| WRITE | 60s | 20 | Standard write operations |
| TOKEN | 60s | 30 | Auth/token operations |
| UPLOAD | 60s | 10 | File uploads |
| MESSAGE | 60s | 30 | Message sending |
| STRICT | 60s | 5 | Sensitive operations |

**Implementation Notes:**
- Simple in-memory LRU store
- Key format: `{userId}:{procedureName}`
- For multi-instance deployments, consider Redis-based solution
- Automatic cleanup of old entries every minute

---

### 4. Audit Trail v2

**Enhanced Audit Helper** (`packages/database/prisma/queries/audit.ts`)

```typescript
// Fire-and-forget audit logging
await auditLog({
  organizationId,
  projectId,
  actorId: user.id,
  action: "ATTACHMENT_CREATED",
  entityType: "attachment",
  entityId: attachment.id,
  metadata: { fileName, fileSize }
});
```

**Audited Actions:**
- Document create
- Approval request/decision
- Owner portal token create/revoke
- Claim status changes
- Expense create
- Message sent in OWNER channel
- File uploaded (Attachment created)

---

### 5. Notifications v2

**Features:**
- Deduplication via `dedupeKey`
- Channel support (IN_APP, EMAIL)
- Delivery status tracking
- Email queue functions

**Key Functions:**
```typescript
// Create with deduplication
createNotification(orgId, userId, {
  type: "APPROVAL_REQUESTED",
  title: "طلب اعتماد جديد",
  dedupeKey: generateDedupeKey(type, entityType, entityId)
});

// Email notifications
createEmailNotification(orgId, userId, data);

// Get pending emails
getPendingEmailNotifications(limit);

// Mark delivery status
markEmailSent(notificationId);
markEmailFailed(notificationId, error);
```

---

### 6. Frontend Components

**UploadButton** (`apps/web/modules/saas/shared/components/UploadButton.tsx`)
- One-click file upload
- Progress indicator
- Validation (size, type)
- Idempotent uploads

**AttachmentList** (`apps/web/modules/saas/shared/components/AttachmentList.tsx`)
- Display uploaded files
- Download via signed URLs
- Delete capability
- File type icons

---

## Migration Notes

### URL Fields (Deprecated)

The following URL-only fields should be migrated to use Attachment model:

| Model | Field | Status |
|-------|-------|--------|
| ProjectDocument | fileUrl | Migrate to Attachment |
| ProjectPhoto | url | Migrate to Attachment |
| ProjectExpense | attachmentUrl | Migrate to Attachment |

**Migration Strategy:**
1. Add `attachmentId` field to existing models
2. Create migration script to create Attachment records from existing URLs
3. Update UI to use UploadButton component
4. Deprecate URL fields after migration

### Database Migration

Run Prisma migration:
```bash
cd packages/database
pnpm prisma migrate dev --name phase6_production_hardening
```

### Environment Variables

Add if using attachments:
```env
S3_ATTACHMENTS_BUCKET=your-attachments-bucket
```

---

## Operational Notes

### Rate Limiting Caveats

1. **In-Memory Store**: Rate limit state is lost on server restart
2. **Single Instance**: Current implementation is per-instance; multi-instance deployments need shared storage (Redis)
3. **Key Cleanup**: Old entries are cleaned every 60 seconds
4. **Store Size**: Maximum 10,000 entries before eviction

### Monitoring

Consider adding:
- Rate limit hit metrics
- Upload success/failure rates
- Notification delivery status dashboard
- Audit log retention policy

---

## Manual Test Checklist

### 1. Attachments

#### Create Upload URL
- [ ] Request upload URL for document
- [ ] Request upload URL for photo
- [ ] Verify rate limiting (10 requests/min)
- [ ] Verify file type validation
- [ ] Verify file size validation

#### Upload Flow
- [ ] Upload file to signed URL
- [ ] Finalize upload
- [ ] Verify attachment record created
- [ ] Verify audit log entry created

#### Download Flow
- [ ] Request download URL
- [ ] Verify URL works
- [ ] Verify URL expires after 1 hour

#### Delete
- [ ] Delete attachment
- [ ] Verify record removed
- [ ] Verify non-owner cannot delete

### 2. Rate Limiting

#### Write Endpoints
- [ ] Exceed 20 requests/min on write endpoint
- [ ] Verify 429 response
- [ ] Verify retry-after header

#### Upload Endpoints
- [ ] Exceed 10 requests/min on upload
- [ ] Verify stricter limit applies

#### Token Endpoints
- [ ] Verify 30 requests/min limit

### 3. Notifications

#### Deduplication
- [ ] Create notification with dedupeKey
- [ ] Attempt duplicate creation
- [ ] Verify only one notification exists

#### Email Channel
- [ ] Create email notification
- [ ] Verify deliveryStatus = PENDING
- [ ] Process email (if email service configured)
- [ ] Verify status updates to SENT

### 4. Audit Trail

#### Logging
- [ ] Create document -> audit log exists
- [ ] Create attachment -> audit log exists
- [ ] Create expense -> audit log exists

#### Viewing
- [ ] View project audit logs
- [ ] Filter by entity type
- [ ] Pagination works

### 5. Multi-Tenancy

#### Organization Isolation
- [ ] User A in Org A uploads attachment
- [ ] User B in Org B cannot access attachment
- [ ] List only returns org-scoped attachments

---

## Files Created/Modified

### Created
- `packages/database/prisma/queries/attachments.ts`
- `packages/api/lib/rate-limit.ts`
- `packages/api/modules/attachments/router.ts`
- `packages/api/modules/attachments/procedures/create-upload-url.ts`
- `packages/api/modules/attachments/procedures/finalize-upload.ts`
- `packages/api/modules/attachments/procedures/list-attachments.ts`
- `packages/api/modules/attachments/procedures/get-download-url.ts`
- `packages/api/modules/attachments/procedures/delete-attachment.ts`
- `apps/web/modules/saas/shared/components/UploadButton.tsx`
- `apps/web/modules/saas/shared/components/AttachmentList.tsx`
- `docs/PHASE6_PRODUCTION_HARDENING.md`

### Modified
- `packages/database/prisma/schema.prisma` (Attachment model, enums, indexes)
- `packages/database/prisma/queries/audit.ts` (auditLog helper)
- `packages/database/prisma/queries/notifications.ts` (deduplication, channels)
- `packages/database/prisma/queries/index.ts` (export attachments)
- `packages/api/orpc/router.ts` (attachments router)
- `packages/i18n/translations/en.json` (upload translations)
- `packages/i18n/translations/ar.json` (upload translations)

---

## Next Steps (Post Phase 6)

1. Implement email sending job/cron for notification delivery
2. Add Redis-based rate limiting for multi-instance deployments
3. Implement storage cleanup job for orphaned attachments
4. Add notification preferences per user
5. Implement push notification support (future)
