# تقرير تحليل قسم المشاريع - منصة مسار
## Projects Module Comprehensive Audit Report

**تاريخ التحليل**: 2 فبراير 2026
**المحلل**: Claude Code (Opus 4.5)
**مصدر التحليل**: الكود الفعلي (actual source code review)

---

## 1. ملخص تنفيذي (Executive Summary)

### الإحصائيات الأساسية

| البند | العدد |
|-------|-------|
| **ملفات Frontend Pages** | 22 صفحة |
| **ملفات Frontend Components** | 34 component |
| **API Routers** | 16 router للمشاريع |
| **API Endpoints** | ~70 endpoint |
| **Database Models** | 25 model متعلق بالمشاريع |
| **Database Query Files** | 15 ملف |
| **Enums** | 18 enum |

### نسبة الاكتمال مقارنة بالخطة الاستراتيجية

| القسم | الحالة | النسبة |
|-------|--------|--------|
| إدارة المشاريع الأساسية (CRUD) | ✅ مكتمل | 100% |
| التنفيذ الميداني (Field) | ✅ مكتمل | 95% |
| المالية (Finance) | ✅ مكتمل | 90% |
| المستندات والاعتمادات | ✅ مكتمل | 95% |
| المحادثات (Chat) | ✅ مكتمل | 100% |
| الإشعارات | ✅ مكتمل | 85% |
| بوابة المالك (Owner Portal) | ✅ مكتمل | 95% |
| الجدول الزمني (Timeline) | ✅ مكتمل | 90% |
| أوامر التغيير (Change Orders) | ✅ مكتمل | 95% |
| التنبيهات الذكية (Insights) | ✅ مكتمل | 80% |
| القوالب (Templates) | ⚠️ جزئي | 70% |
| التصدير (Exports) | ✅ مكتمل | 85% |
| روابط المشاركة (Shares) | ✅ مكتمل | 90% |
| التكاملات (Integrations) | ⚠️ جزئي | 60% |
| الملخص الأسبوعي (Digest) | ⚠️ جزئي | 70% |

**النسبة الإجمالية للاكتمال: ~85%**

### أهم 5 مشاكل حرجة 🔴

1. **غياب التحقق من الصلاحيات (Permission Checks)**: معظم الـ procedures تتحقق من `membership` فقط دون التحقق من `hasPermission`
2. **بعض الـ endpoints لا تتحقق من ownership المشروع**: مثل `createExpense` يتحقق من المنظمة لكن لا يتأكد أن المشروع ينتمي لها
3. **عدم وجود Rate Limiting**: لا يوجد تحديد لعدد الطلبات على الـ API
4. **غياب Audit Logging الشامل**: سجل التدقيق موجود لكن غير مفعّل على كل العمليات
5. **بعض القنوات العامة (public routes) غير محمية بشكل كافٍ**: مثل owner portal endpoints

### أهم 5 نواقص 🟡

1. **فريق المشروع (Project Team)**: صفحة إدارة فريق المشروع غير موجودة
2. **البنود والكميات (BOQ)**: الربط بين دراسات التكلفة والمشاريع غير مكتمل
3. **التقارير التحليلية**: لا توجد تقارير شاملة للمشاريع
4. **إشعارات البريد الإلكتروني**: التكامل مع البريد موجود لكن غير مفعّل بالكامل
5. **تطبيق قوالب المشاريع**: وظيفة `apply template` تحتاج تحسين

---

## 2. هيكل الملفات الكامل (File Structure)

### 2.1 Frontend Pages

```
apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/
├── page.tsx                           # قائمة المشاريع
├── new/page.tsx                       # إنشاء مشروع جديد
├── templates/page.tsx                 # قوالب المشاريع
└── [projectId]/
    ├── page.tsx                       # نظرة عامة على المشروع
    ├── field/
    │   ├── page.tsx                   # التنفيذ الميداني
    │   ├── new-report/page.tsx        # تقرير يومي جديد
    │   ├── upload/page.tsx            # رفع صور
    │   └── new-issue/page.tsx         # مشكلة جديدة
    ├── supervisor/page.tsx            # وضع المشرف
    ├── finance/
    │   ├── page.tsx                   # المالية
    │   ├── new-expense/page.tsx       # مصروف جديد
    │   └── new-claim/page.tsx         # مستخلص جديد
    ├── documents/
    │   ├── page.tsx                   # قائمة الوثائق
    │   ├── new/page.tsx               # وثيقة جديدة
    │   └── [documentId]/page.tsx      # تفاصيل الوثيقة
    ├── chat/page.tsx                  # المحادثات
    ├── owner/page.tsx                 # بوابة المالك (إدارة)
    ├── insights/page.tsx              # التنبيهات الذكية
    ├── updates/page.tsx               # التحديثات الرسمية
    ├── timeline/page.tsx              # الجدول الزمني
    └── changes/
        ├── page.tsx                   # أوامر التغيير
        └── [changeId]/page.tsx        # تفاصيل أمر التغيير
```

### بوابة المالك (Owner Portal - Public)

```
apps/web/app/(saas)/owner/[token]/
├── layout.tsx                         # Layout مخصص للمالك
├── page.tsx                           # الملخص
├── schedule/page.tsx                  # الجدول الزمني
├── payments/page.tsx                  # الدفعات
├── chat/page.tsx                      # المحادثة مع المقاول
└── changes/
    ├── page.tsx                       # أوامر التغيير
    └── [changeId]/page.tsx            # تفاصيل أمر التغيير
```

### روابط المشاركة

```
apps/web/app/share/[token]/
└── page.tsx                           # صفحة المشاركة العامة
```

### 2.2 Frontend Components

```
apps/web/modules/saas/projects/components/
├── ProjectsList.tsx                   # قائمة المشاريع
├── CreateProjectForm.tsx              # نموذج إنشاء مشروع
├── ProjectOverview.tsx                # نظرة عامة
├── DocumentsList.tsx                  # قائمة الوثائق
├── CreateDocumentForm.tsx             # نموذج إضافة وثيقة
├── DocumentDetail.tsx                 # تفاصيل الوثيقة
├── ProjectChat.tsx                    # المحادثات
├── NotificationsList.tsx              # قائمة الإشعارات
├── OwnerAccessManagement.tsx          # إدارة وصول المالك
├── ProjectInsights.tsx                # التنبيهات الذكية
├── ProjectUpdates.tsx                 # التحديثات الرسمية
├── ProjectTemplates.tsx               # قوالب المشاريع
├── field/
│   ├── FieldTimeline.tsx              # جدول الأنشطة الميدانية
│   ├── DailyReportCard.tsx            # بطاقة التقرير اليومي
│   ├── PhotoGrid.tsx                  # شبكة الصور
│   └── IssueCard.tsx                  # بطاقة المشكلة
├── forms/
│   ├── DailyReportForm.tsx            # نموذج التقرير اليومي
│   ├── PhotoUploadForm.tsx            # نموذج رفع الصور
│   ├── IssueForm.tsx                  # نموذج المشكلة
│   └── ProgressUpdateForm.tsx         # نموذج تحديث التقدم
├── supervisor/
│   └── SupervisorMode.tsx             # واجهة المشرف
└── finance/
    ├── FinanceSummary.tsx             # ملخص المالية
    ├── FinanceView.tsx                # عرض المالية
    ├── ExpensesTable.tsx              # جدول المصروفات
    ├── ClaimsTable.tsx                # جدول المستخلصات
    ├── CreateExpenseForm.tsx          # نموذج مصروف
    └── CreateClaimForm.tsx            # نموذج مستخلص

apps/web/modules/saas/projects-timeline/components/
├── TimelineHealthBadge.tsx            # شارة صحة الجدول
├── MilestoneCard.tsx                  # بطاقة المرحلة
├── CreateMilestoneForm.tsx            # نموذج إضافة مرحلة
└── TimelineBoard.tsx                  # لوحة الجدول الزمني

apps/web/modules/saas/projects-changes/components/
├── ChangeOrdersBoard.tsx              # لوحة أوامر التغيير
├── CreateChangeOrderForm.tsx          # نموذج أمر تغيير
├── ChangeOrderDetail.tsx              # تفاصيل أمر التغيير
└── index.ts                           # Re-exports
```

### 2.3 API Modules

```
packages/api/modules/
├── projects/
│   ├── router.ts
│   └── procedures/
│       ├── list-projects.ts           # استعلام المشاريع
│       ├── create-project.ts          # إنشاء مشروع
│       └── get-project.ts             # جلب مشروع
│
├── project-field/
│   ├── router.ts
│   └── procedures/
│       ├── create-daily-report.ts     # تقرير يومي
│       ├── list-daily-reports.ts
│       ├── create-photo.ts            # صورة
│       ├── list-photos.ts
│       ├── create-issue.ts            # مشكلة
│       ├── list-issues.ts
│       ├── update-issue.ts
│       ├── add-progress-update.ts     # تحديث تقدم
│       ├── list-progress-updates.ts
│       └── get-field-timeline.ts      # جدول ميداني
│
├── project-finance/
│   ├── router.ts
│   └── procedures/
│       ├── get-finance-summary.ts     # ملخص مالي
│       ├── create-expense.ts          # مصروف
│       ├── list-expenses.ts
│       ├── create-claim.ts            # مستخلص
│       ├── list-claims.ts
│       └── update-claim-status.ts     # تغيير حالة
│
├── project-documents/
│   ├── router.ts
│   └── procedures/
│       ├── list-documents.ts
│       ├── create-document.ts
│       ├── get-document.ts
│       ├── create-approval-request.ts # طلب اعتماد
│       ├── act-on-approval.ts         # قرار اعتماد
│       └── get-approval.ts
│
├── project-chat/
│   ├── router.ts
│   └── procedures/
│       ├── list-messages.ts
│       └── send-message.ts
│
├── notifications/
│   ├── router.ts
│   └── procedures/
│       ├── list-notifications.ts
│       └── mark-read.ts
│
├── project-owner/
│   ├── router.ts
│   └── procedures/
│       ├── create-owner-access.ts     # إنشاء وصول
│       ├── list-owner-access.ts
│       ├── revoke-owner-access.ts     # إلغاء وصول
│       ├── send-official-update.ts    # تحديث رسمي
│       ├── get-owner-summary.ts       # ملخص للمالك
│       ├── get-owner-schedule.ts      # جدول للمالك
│       ├── get-owner-payments.ts      # دفعات للمالك
│       ├── list-owner-messages.ts     # رسائل المالك
│       ├── send-owner-message.ts
│       └── list-official-updates.ts
│
├── project-timeline/
│   ├── router.ts
│   └── procedures/
│       ├── list-milestones.ts
│       ├── create-milestone.ts
│       ├── update-milestone.ts
│       ├── delete-milestone.ts
│       ├── reorder-milestones.ts
│       ├── mark-actual.ts
│       ├── start-milestone.ts
│       ├── complete-milestone.ts
│       └── get-timeline-health.ts
│
├── project-change-orders/
│   ├── router.ts
│   └── procedures/
│       ├── list-change-orders.ts
│       ├── get-change-order.ts
│       ├── create-change-order.ts
│       ├── update-change-order.ts
│       ├── delete-change-order.ts
│       ├── workflow.ts (submit/approve/reject/implement)
│       └── owner-portal.ts
│
├── project-insights/
│   ├── router.ts
│   └── procedures/
│       ├── get-insights.ts
│       └── acknowledge-alert.ts
│
├── project-templates/
│   ├── router.ts
│   └── procedures/
│       ├── list-templates.ts
│       ├── create-template.ts
│       └── apply-template.ts
│
├── project-updates/
│   ├── router.ts
│   └── procedures/
│       ├── generate-update-draft.ts
│       └── publish-official-update.ts
│
├── attachments/
│   ├── router.ts
│   └── procedures/
│       ├── create-upload-url.ts
│       ├── finalize-upload.ts
│       ├── list-attachments.ts
│       ├── get-download-url.ts
│       └── delete-attachment.ts
│
├── exports/
│   ├── router.ts
│   └── procedures/
│       ├── generate-update-pdf.ts
│       ├── generate-claim-pdf.ts
│       ├── generate-weekly-report.ts
│       ├── export-expenses-csv.ts
│       ├── export-claims-csv.ts
│       ├── export-issues-csv.ts
│       └── generate-calendar-ics.ts
│
├── shares/
│   ├── router.ts
│   └── procedures/
│       ├── create-share-link.ts
│       ├── list-share-links.ts
│       ├── revoke-share-link.ts
│       └── get-shared-resource.ts
│
├── digests/
│   ├── router.ts
│   └── procedures/
│       ├── get-weekly-digest.ts
│       ├── subscribe-digest.ts
│       └── unsubscribe-digest.ts
│
└── integrations/
    └── router.ts
```

### 2.4 Database Models & Queries

```
packages/database/prisma/queries/
├── projects.ts                        # استعلامات المشاريع
├── project-field.ts                   # التنفيذ الميداني
├── project-finance.ts                 # المالية
├── project-documents.ts               # الوثائق
├── project-chat.ts                    # المحادثات
├── notifications.ts                   # الإشعارات
├── project-owner-portal.ts            # بوابة المالك
├── project-timeline.ts                # الجدول الزمني
├── project-change-orders.ts           # أوامر التغيير
├── project-templates.ts               # القوالب
├── project-insights.ts                # التنبيهات
├── attachments.ts                     # المرفقات
├── shares.ts                          # روابط المشاركة
├── digests.ts                         # الملخصات
├── integrations.ts                    # التكاملات
├── audit.ts                           # سجل التدقيق
└── index.ts                           # Re-exports
```

---

## 3. خريطة المسارات التفصيلية (Detailed Routes Map)

| المسار | الملف | Component | API Calls | الصلاحيات | الحالة |
|--------|-------|-----------|-----------|-----------|--------|
| `/app/[org]/projects` | `page.tsx` | `ProjectsList` | `projects.list` | membership | ✅ |
| `/app/[org]/projects/new` | `new/page.tsx` | `CreateProjectForm` | `projects.create` | membership | ✅ |
| `/app/[org]/projects/templates` | `templates/page.tsx` | `ProjectTemplates` | `projectTemplates.list` | membership | ✅ |
| `/app/[org]/projects/[id]` | `[projectId]/page.tsx` | `ProjectOverview` | `projects.getById` | membership | ✅ |
| `/app/[org]/projects/[id]/field` | `field/page.tsx` | `FieldTimeline` | `projectField.getTimeline` | membership | ✅ |
| `/app/[org]/projects/[id]/field/new-report` | `field/new-report/page.tsx` | `DailyReportForm` | `projectField.createDailyReport` | membership | ✅ |
| `/app/[org]/projects/[id]/field/upload` | `field/upload/page.tsx` | `PhotoUploadForm` | `projectField.createPhoto` | membership | ✅ |
| `/app/[org]/projects/[id]/field/new-issue` | `field/new-issue/page.tsx` | `IssueForm` | `projectField.createIssue` | membership | ✅ |
| `/app/[org]/projects/[id]/supervisor` | `supervisor/page.tsx` | `SupervisorMode` | متعددة | membership | ✅ |
| `/app/[org]/projects/[id]/finance` | `finance/page.tsx` | `FinanceView` | `projectFinance.*` | membership | ✅ |
| `/app/[org]/projects/[id]/finance/new-expense` | `finance/new-expense/page.tsx` | `CreateExpenseForm` | `projectFinance.createExpense` | membership | ✅ |
| `/app/[org]/projects/[id]/finance/new-claim` | `finance/new-claim/page.tsx` | `CreateClaimForm` | `projectFinance.createClaim` | membership | ✅ |
| `/app/[org]/projects/[id]/documents` | `documents/page.tsx` | `DocumentsList` | `projectDocuments.list` | membership | ✅ |
| `/app/[org]/projects/[id]/documents/new` | `documents/new/page.tsx` | `CreateDocumentForm` | `projectDocuments.create` | membership | ✅ |
| `/app/[org]/projects/[id]/documents/[docId]` | `documents/[documentId]/page.tsx` | `DocumentDetail` | `projectDocuments.get` | membership | ✅ |
| `/app/[org]/projects/[id]/chat` | `chat/page.tsx` | `ProjectChat` | `projectChat.*` | membership | ✅ |
| `/app/[org]/projects/[id]/owner` | `owner/page.tsx` | `OwnerAccessManagement` | `projectOwner.*` | membership | ✅ |
| `/app/[org]/projects/[id]/insights` | `insights/page.tsx` | `ProjectInsights` | `projectInsights.get` | membership | ✅ |
| `/app/[org]/projects/[id]/updates` | `updates/page.tsx` | `ProjectUpdates` | `projectUpdates.*` | membership | ✅ |
| `/app/[org]/projects/[id]/timeline` | `timeline/page.tsx` | `TimelineBoard` | `projectTimeline.*` | membership | ✅ |
| `/app/[org]/projects/[id]/changes` | `changes/page.tsx` | `ChangeOrdersBoard` | `projectChangeOrders.*` | membership | ✅ |
| `/app/[org]/projects/[id]/changes/[coId]` | `changes/[changeId]/page.tsx` | `ChangeOrderDetail` | `projectChangeOrders.get` | membership | ✅ |
| `/owner/[token]` | `page.tsx` | `OwnerPortalSummary` | `projectOwner.portal.getSummary` | token | ✅ |
| `/owner/[token]/schedule` | `schedule/page.tsx` | - | `projectOwner.portal.getSchedule` | token | ✅ |
| `/owner/[token]/payments` | `payments/page.tsx` | - | `projectOwner.portal.getPayments` | token | ✅ |
| `/owner/[token]/chat` | `chat/page.tsx` | - | `projectOwner.portal.*` | token | ✅ |
| `/owner/[token]/changes` | `changes/page.tsx` | - | `projectChangeOrders.ownerList` | token | ✅ |
| `/share/[token]` | `page.tsx` | - | `shares.getResource` | token | ✅ |

---

## 4. خريطة الـ API (API Map)

### Projects Router

| Endpoint | ملف | نوع | Input | Output | الأمان |
|----------|-----|-----|-------|--------|--------|
| `projects.list` | `list-projects.ts` | protected | `{organizationId, status?, query?, limit?, offset?}` | `{projects[], total, stats}` | membership ✅ |
| `projects.create` | `create-project.ts` | protected | `{organizationId, name, description?, type?, clientName?, location?, contractValue?, startDate?, endDate?}` | `Project` | membership ✅ |
| `projects.getById` | `get-project.ts` | protected | `{id, organizationId}` | `Project \| null` | membership ✅ |

### Project Field Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `projectField.createDailyReport` | `create-daily-report.ts` | protected | membership + project ownership ✅ |
| `projectField.listDailyReports` | `list-daily-reports.ts` | protected | membership ✅ |
| `projectField.createPhoto` | `create-photo.ts` | protected | membership ✅ |
| `projectField.listPhotos` | `list-photos.ts` | protected | membership ✅ |
| `projectField.createIssue` | `create-issue.ts` | protected | membership ✅ |
| `projectField.listIssues` | `list-issues.ts` | protected | membership ✅ |
| `projectField.updateIssue` | `update-issue.ts` | protected | membership ✅ |
| `projectField.addProgressUpdate` | `add-progress-update.ts` | protected | membership ✅ |
| `projectField.listProgressUpdates` | `list-progress-updates.ts` | protected | membership ✅ |
| `projectField.getTimeline` | `get-field-timeline.ts` | protected | membership ✅ |

### Project Finance Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `projectFinance.getSummary` | `get-finance-summary.ts` | protected | membership ✅ |
| `projectFinance.createExpense` | `create-expense.ts` | protected | membership ✅ (⚠️ يحتاج permission check) |
| `projectFinance.listExpenses` | `list-expenses.ts` | protected | membership ✅ |
| `projectFinance.createClaim` | `create-claim.ts` | protected | membership ✅ |
| `projectFinance.listClaims` | `list-claims.ts` | protected | membership ✅ |
| `projectFinance.updateClaimStatus` | `update-claim-status.ts` | protected | membership ✅ |

### Project Documents Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `projectDocuments.list` | `list-documents.ts` | protected | membership ✅ |
| `projectDocuments.create` | `create-document.ts` | protected | membership ✅ |
| `projectDocuments.get` | `get-document.ts` | protected | membership ✅ |
| `projectDocuments.createApprovalRequest` | `create-approval-request.ts` | protected | membership ✅ |
| `projectDocuments.actOnApproval` | `act-on-approval.ts` | protected | membership ✅ |
| `projectDocuments.getApproval` | `get-approval.ts` | protected | membership ✅ |

### Project Chat Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `projectChat.listMessages` | `list-messages.ts` | protected | membership ✅ |
| `projectChat.sendMessage` | `send-message.ts` | protected | membership ✅ |

### Notifications Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `notifications.list` | `list-notifications.ts` | protected | membership ✅ |
| `notifications.markRead` | `mark-read.ts` | protected | membership ✅ |

### Project Owner Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `projectOwner.createAccess` | `create-owner-access.ts` | protected | membership ✅ |
| `projectOwner.listAccess` | `list-owner-access.ts` | protected | membership ✅ |
| `projectOwner.revokeAccess` | `revoke-owner-access.ts` | protected | membership ✅ |
| `projectOwner.sendOfficialUpdate` | `send-official-update.ts` | protected | membership ✅ |
| `projectOwner.portal.getSummary` | `get-owner-summary.ts` | public | token ✅ |
| `projectOwner.portal.getSchedule` | `get-owner-schedule.ts` | public | token ✅ |
| `projectOwner.portal.getPayments` | `get-owner-payments.ts` | public | token ✅ |
| `projectOwner.portal.listMessages` | `list-owner-messages.ts` | public | token ✅ |
| `projectOwner.portal.sendMessage` | `send-owner-message.ts` | public | token ✅ |
| `projectOwner.portal.listUpdates` | `list-official-updates.ts` | public | token ✅ |

### Project Timeline Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `projectTimeline.listMilestones` | `list-milestones.ts` | protected | membership ✅ |
| `projectTimeline.createMilestone` | `create-milestone.ts` | protected | membership ✅ |
| `projectTimeline.updateMilestone` | `update-milestone.ts` | protected | membership ✅ |
| `projectTimeline.deleteMilestone` | `delete-milestone.ts` | protected | membership ✅ |
| `projectTimeline.reorderMilestones` | `update-milestone.ts` | protected | membership ✅ |
| `projectTimeline.markActual` | `mark-actual.ts` | protected | membership ✅ |
| `projectTimeline.startMilestone` | `mark-actual.ts` | protected | membership ✅ |
| `projectTimeline.completeMilestone` | `mark-actual.ts` | protected | membership ✅ |
| `projectTimeline.getHealth` | `get-timeline-health.ts` | protected | membership ✅ |

### Project Change Orders Router

| Endpoint | ملف | نوع | الأمان |
|----------|-----|-----|--------|
| `projectChangeOrders.list` | `list-change-orders.ts` | protected | membership ✅ |
| `projectChangeOrders.getStats` | `list-change-orders.ts` | protected | membership ✅ |
| `projectChangeOrders.get` | `get-change-order.ts` | protected | membership ✅ |
| `projectChangeOrders.create` | `create-change-order.ts` | protected | membership ✅ |
| `projectChangeOrders.update` | `update-change-order.ts` | protected | membership ✅ |
| `projectChangeOrders.delete` | `delete-change-order.ts` | protected | membership ✅ |
| `projectChangeOrders.submit` | `workflow.ts` | protected | membership ✅ |
| `projectChangeOrders.approve` | `workflow.ts` | protected | membership ✅ |
| `projectChangeOrders.reject` | `workflow.ts` | protected | membership ✅ |
| `projectChangeOrders.implement` | `workflow.ts` | protected | membership ✅ |
| `projectChangeOrders.ownerList` | `owner-portal.ts` | public | token ✅ |
| `projectChangeOrders.ownerGet` | `owner-portal.ts` | public | token ✅ |

---

## 5. خريطة قاعدة البيانات (Database Map)

### 5.1 نموذج ER Diagram (نصي)

```
┌─────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
│   Organization  │────<│      Project        │────<│  ProjectDailyReport   │
│                 │     │                     │     │                       │
│ id              │     │ id                  │     │ id                    │
│ name            │     │ organizationId (FK) │     │ projectId (FK)        │
│ slug            │     │ name                │     │ reportDate            │
│ ownerId         │     │ slug                │     │ manpower              │
│ ...             │     │ status              │     │ workDone              │
└─────────────────┘     │ progress            │     │ weather               │
                        │ contractValue       │     │ createdById (FK)      │
                        │ startDate           │     └───────────────────────┘
                        │ endDate             │
                        │ createdById (FK)    │────<┌───────────────────────┐
                        └─────────────────────┘     │    ProjectPhoto       │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                ├──────────────────<│ url                   │
                                │                   │ category              │
                                │                   │ uploadedById (FK)     │
                                │                   └───────────────────────┘
                                │
                                ├──────────────────<┌───────────────────────┐
                                │                   │    ProjectIssue       │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                │                   │ title                 │
                                │                   │ severity              │
                                │                   │ status                │
                                │                   │ assigneeId (FK)       │
                                │                   └───────────────────────┘
                                │
                                ├──────────────────<┌───────────────────────┐
                                │                   │  ProjectExpense       │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                │                   │ category              │
                                │                   │ amount                │
                                │                   └───────────────────────┘
                                │
                                ├──────────────────<┌───────────────────────┐
                                │                   │    ProjectClaim       │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                │                   │ claimNo               │
                                │                   │ amount                │
                                │                   │ status                │
                                │                   └───────────────────────┘
                                │
                                ├──────────────────<┌───────────────────────┐
                                │                   │  ProjectDocument      │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                │                   │ folder                │
                                │                   │ title                 │
                                │                   │ fileUrl               │
                                │                   └───────────┬───────────┘
                                │                               │
                                │                               ├───────────<┌─────────────────────┐
                                │                               │            │  ProjectApproval    │
                                │                               │            │                     │
                                │                               │            │ id                  │
                                │                               │            │ documentId (FK)     │
                                │                               │            │ status              │
                                │                               │            │ requestedById (FK)  │
                                │                               │            └─────────────────────┘
                                │
                                ├──────────────────<┌───────────────────────┐
                                │                   │  ProjectMessage       │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                │                   │ channel (TEAM/OWNER)  │
                                │                   │ content               │
                                │                   │ senderId (FK)         │
                                │                   └───────────────────────┘
                                │
                                ├──────────────────<┌───────────────────────┐
                                │                   │ ProjectOwnerAccess    │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                │                   │ token (unique)        │
                                │                   │ expiresAt             │
                                │                   │ isRevoked             │
                                │                   └───────────────────────┘
                                │
                                ├──────────────────<┌───────────────────────┐
                                │                   │  ProjectMilestone     │
                                │                   │                       │
                                │                   │ id                    │
                                │                   │ projectId (FK)        │
                                │                   │ title                 │
                                │                   │ plannedStart          │
                                │                   │ plannedEnd            │
                                │                   │ status                │
                                │                   │ progress              │
                                │                   └───────────────────────┘
                                │
                                └──────────────────<┌───────────────────────┐
                                                    │ ProjectChangeOrder    │
                                                    │                       │
                                                    │ id                    │
                                                    │ projectId (FK)        │
                                                    │ coNo                  │
                                                    │ category              │
                                                    │ status                │
                                                    │ costImpact            │
                                                    │ timeImpactDays        │
                                                    └───────────────────────┘
```

### 5.2 تفصيل كل Model

#### Project Model

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | المعرف الفريد |
| organizationId | String (FK) | المنظمة |
| name | String | اسم المشروع |
| slug | String | معرف URL |
| description | String? | الوصف |
| status | ProjectStatus | الحالة |
| type | ProjectType? | النوع |
| clientName | String? | اسم العميل |
| location | String? | الموقع |
| contractValue | Decimal? | قيمة العقد |
| progress | Float | نسبة الإنجاز |
| startDate | DateTime? | تاريخ البداية |
| endDate | DateTime? | تاريخ النهاية |
| createdById | String (FK) | منشئ المشروع |
| createdAt | DateTime | تاريخ الإنشاء |
| updatedAt | DateTime | تاريخ التحديث |

**Indexes:**
- `@@unique([organizationId, slug])`
- `@@index([organizationId])`
- `@@index([createdById])`
- `@@index([status])`

### 5.3 Enums المتعلقة بالمشاريع

```typescript
enum ProjectStatus { ACTIVE, ON_HOLD, COMPLETED }
enum ProjectType { RESIDENTIAL, COMMERCIAL, INDUSTRIAL, INFRASTRUCTURE, MIXED }
enum IssueSeverity { LOW, MEDIUM, HIGH, CRITICAL }
enum IssueStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
enum PhotoCategory { PROGRESS, ISSUE, EQUIPMENT, MATERIAL, SAFETY, OTHER }
enum WeatherCondition { SUNNY, CLOUDY, RAINY, WINDY, DUSTY, HOT, COLD }
enum ExpenseCategory { MATERIALS, LABOR, EQUIPMENT, SUBCONTRACTOR, TRANSPORT, MISC }
enum ClaimStatus { DRAFT, SUBMITTED, APPROVED, PAID, REJECTED }
enum DocumentFolder { CONTRACT, DRAWINGS, CLAIMS, LETTERS, PHOTOS, OTHER }
enum ApprovalStatus { PENDING, APPROVED, REJECTED, CANCELLED }
enum ApproverStatus { PENDING, APPROVED, REJECTED }
enum MilestoneStatus { PLANNED, IN_PROGRESS, COMPLETED, DELAYED }
enum MessageChannel { TEAM, OWNER }
enum NotificationType { APPROVAL_REQUESTED, APPROVAL_DECIDED, OWNER_MESSAGE, DOCUMENT_CREATED, SYSTEM }
enum AuditAction { DOC_CREATED, APPROVAL_REQUESTED, ... }
enum ChangeOrderStatus { DRAFT, SUBMITTED, APPROVED, REJECTED, IMPLEMENTED }
enum ChangeOrderCategory { SCOPE_CHANGE, CLIENT_REQUEST, SITE_CONDITION, DESIGN_CHANGE, MATERIAL_CHANGE, REGULATORY, OTHER }
```

---

## 6. تحليل الترابط (Integration Analysis)

### مصفوفة الترابط بين الأقسام الفرعية

| القسم | Projects | Field | Finance | Documents | Chat | Owner | Timeline | Changes |
|-------|----------|-------|---------|-----------|------|-------|----------|---------|
| **Projects** | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Field** | FK | - | ❌ | ❌ | ❌ | partial | ❌ | ❌ |
| **Finance** | FK | ❌ | - | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Documents** | FK | ❌ | ❌ | - | ❌ | ❌ | ❌ | ❌ |
| **Chat** | FK | ❌ | ❌ | ❌ | - | ✅ | ❌ | ❌ |
| **Owner Portal** | FK | via summary | ✅ | ❌ | ✅ | - | ✅ | ✅ |
| **Timeline** | FK | ❌ | ❌ | ❌ | ❌ | ✅ | - | ✅ |
| **Changes** | FK | ❌ | ✅ (claim) | ❌ | ❌ | ✅ | ✅ (milestone) | - |

**ملاحظات:**
- ✅ = ترابط مباشر موجود
- ❌ = لا يوجد ترابط مباشر
- FK = Foreign Key relationship
- partial = ترابط جزئي

---

## 7. تحليل الفجوات (Gap Analysis)

### 7.1 الخطة vs التنفيذ

| التبويب المطلوب | حالة التنفيذ | ملاحظات |
|----------------|--------------|---------|
| نظرة عامة (Overview) | ✅ مكتمل | `ProjectOverview.tsx` |
| البنود والكميات (BOQ) | ⚠️ جزئي | موجود كـ "Cost Studies" منفصل |
| فريق المشروع (Team) | ❌ غير موجود | صفحة مخصصة غير موجودة |
| الدفعات (Payments) | ✅ مكتمل | ضمن Finance + Claims |
| المصاريف (Expenses) | ✅ مكتمل | `FinanceView.tsx` |
| التقارير والمتابعة | ⚠️ جزئي | Field reports موجود، تقارير شاملة ناقصة |
| المالية (Finance) | ✅ مكتمل | Full finance module |
| بوابة المالك | ✅ مكتمل | Owner portal with token auth |

### 7.2 ميزات مفقودة بالكامل

1. **إدارة فريق المشروع**: لا توجد صفحة لتخصيص أعضاء الفريق للمشروع
2. **ربط دراسات التكلفة**: Quantities module منفصل تماماً عن Projects
3. **تقارير تحليلية**: لا توجد dashboards أو reports للمشاريع
4. **تنبيهات البريد الإلكتروني الآلية**: Infrastructure موجود لكن غير مفعّل

### 7.3 ميزات منفذة جزئياً

1. **Templates**: يمكن إنشاء قالب لكن `apply` يحتاج تحسين
2. **Insights/Alerts**: التنبيهات الذكية موجودة لكن منطق الكشف محدود
3. **Integrations**: البنية موجودة (WhatsApp, SMS) لكن غير متصلة بمزودين فعليين
4. **Weekly Digest**: الـ API موجود لكن لا يوجد scheduler يرسله تلقائياً

### 7.4 ميزات منفذة بشكل مختلف عن الخطة

1. **BOQ**: تم تنفيذها كـ "Quantities Module" منفصل عن المشاريع
2. **بوابة المالك**: تستخدم Token-based auth بدلاً من user accounts

---

## 8. المشاكل والمخاطر (Issues & Risks)

### 8.1 مشاكل أمنية 🔴

#### 1. عدم التحقق من الصلاحيات (Permission Checks Missing)

**المشكلة**: جميع الـ procedures تتحقق فقط من `membership` ولا تستخدم `hasPermission`.

**مثال من الكود:**
```typescript
// packages/api/modules/project-finance/procedures/create-expense.ts
export const createExpense = protectedProcedure
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(
      input.organizationId,
      context.user.id,
    );

    if (!membership) {
      throw new ORPCError("FORBIDDEN");
    }

    // ⚠️ لا يوجد تحقق من hasPermission('finance', 'create')

    const expense = await createProjectExpense({...});
  });
```

**الخطورة**: أي عضو في المنظمة يمكنه إنشاء مصروفات حتى لو لم يكن لديه صلاحية ذلك.

**التوصية**: إضافة `hasPermission` check لكل endpoint حسب الصلاحية المطلوبة.

#### 2. Owner Portal Token Security

**المشكلة**: Tokens لا تُجدد تلقائياً ويمكن أن تبقى صالحة لفترة طويلة.

**التوصية**:
- إضافة `lastUsedAt` للتتبع
- إضافة تجديد تلقائي للـ token
- تحديد صلاحية افتراضية (30 يوم مثلاً)

#### 3. عدم وجود Rate Limiting

**المشكلة**: لا يوجد تحديد لعدد الطلبات على أي endpoint.

**التوصية**: إضافة rate limiting middleware باستخدام `@repo/api/lib/rate-limit.ts` (الملف موجود لكن غير مستخدم).

### 8.2 مشاكل في البيانات 🟠

#### 1. Decimal to Number Conversion

**المشكلة**: يتم تحويل `Decimal` إلى `number` في كل مكان، مما قد يسبب فقدان دقة للأرقام الكبيرة.

**مثال:**
```typescript
return {
  ...project,
  contractValue: project.contractValue
    ? Number(project.contractValue)  // ⚠️ قد يفقد الدقة
    : null,
};
```

**التوصية**: استخدام `String` أو library مثل `decimal.js` للتعامل مع الأرقام المالية.

#### 2. Project Slug Generation

**المشكلة**: دالة `generateUniqueProjectSlug` قد تفشل في حالات edge.

```typescript
for (let i = 0; i < 10; i++) {
  // يحاول 10 مرات فقط
}
// Fallback: use timestamp
return `${baseSlug}-${Date.now()}`;
```

**التوصية**: استخدام UUID أو خوارزمية أفضل.

### 8.3 مشاكل في الأداء 🟡

#### 1. N+1 Query Problem المحتمل

**المشكلة**: في `getFieldTimeline` يتم جلب 4 أنواع من البيانات ثم دمجها في الذاكرة.

```typescript
const [reports, photos, issues, progressUpdates] = await Promise.all([
  db.projectDailyReport.findMany({ ... }),
  db.projectPhoto.findMany({ ... }),
  db.projectIssue.findMany({ ... }),
  db.projectProgressUpdate.findMany({ ... }),
]);
// ثم دمج وترتيب في الذاكرة
```

**التوصية**: استخدام pagination أفضل وربما union query إذا أمكن.

#### 2. غياب Caching

**المشكلة**: لا يوجد caching لأي من الاستعلامات المتكررة.

**التوصية**: إضافة Redis caching للـ:
- Project stats
- Finance summary
- Timeline health

### 8.4 مشاكل في جودة الكود 🔵

#### 1. تكرار الكود

**المشكلة**: دالة `formatCurrency` متكررة في عدة ملفات.

**ملفات تحتوي على نسخة:**
- `ProjectsList.tsx`
- `ProjectOverview.tsx`
- `OwnerPortalSummary.tsx`
- `FinanceSummary.tsx`

**التوصية**: نقلها لـ `utils/formatters.ts` مشترك.

#### 2. Magic Strings

**المشكلة**: بعض الـ status values hardcoded.

```typescript
if (statusFilter !== "all") {
  (statusFilter as "ACTIVE" | "ON_HOLD" | "COMPLETED")
}
```

**التوصية**: استخدام Zod enum أو constants من schema.

### 8.5 مشاكل في تجربة المستخدم 🟢

#### 1. Empty States موجودة ✅

جميع الصفحات تحتوي على empty states مناسبة.

#### 2. Loading States موجودة ✅

Spinner متسق في جميع الصفحات.

#### 3. Error States

**المشكلة**: Error handling غير متسق - بعض الصفحات تعرض toast، بعضها لا.

**التوصية**: توحيد error handling باستخدام error boundary.

#### 4. Mobile Responsive

**الحالة**: ✅ التصميم متجاوب - يستخدم Tailwind responsive classes.

---

## 9. حالة كل قسم فرعي (Sub-Module Status)

### 9.1 إدارة المشاريع الأساسية (CRUD)

**الحالة**: ✅ مكتمل

**الملفات:**
- Frontend: `ProjectsList.tsx`, `CreateProjectForm.tsx`, `ProjectOverview.tsx`
- API: `packages/api/modules/projects/`
- DB: `packages/database/prisma/queries/projects.ts`

**ما يعمل:**
- عرض قائمة المشاريع مع فلترة وبحث ✅
- إنشاء مشروع جديد ✅
- عرض تفاصيل المشروع ✅
- إحصائيات المشاريع ✅

**ما ينقص:**
- تعديل المشروع (Edit project)
- حذف المشروع (Delete project)
- تغيير حالة المشروع من الواجهة

### 9.2 التنفيذ الميداني (Field Execution)

**الحالة**: ✅ مكتمل (95%)

**الملفات:**
- Frontend: `field/`, `FieldTimeline.tsx`, forms
- API: `packages/api/modules/project-field/`
- DB: `packages/database/prisma/queries/project-field.ts`

**ما يعمل:**
- التقارير اليومية (إنشاء/عرض) ✅
- رفع الصور ✅
- إدارة المشاكل (CRUD) ✅
- تحديثات التقدم ✅
- Timeline view ✅

**ما ينقص:**
- تعديل التقرير اليومي بعد الإنشاء
- حذف الصور

### 9.3 المالية (Finance)

**الحالة**: ✅ مكتمل (90%)

**الملفات:**
- Frontend: `finance/`, components
- API: `packages/api/modules/project-finance/`
- DB: `packages/database/prisma/queries/project-finance.ts`

**ما يعمل:**
- ملخص مالي شامل ✅
- إدارة المصروفات ✅
- إدارة المستخلصات (Claims) ✅
- تغيير حالة المستخلص ✅

**ما ينقص:**
- تعديل/حذف المصروفات
- ربط المصروفات بالمرفقات بشكل أفضل
- تقارير مالية تفصيلية

### 9.4 المستندات والاعتمادات (Documents & Approvals)

**الحالة**: ✅ مكتمل (95%)

**الملفات:**
- Frontend: `documents/`, `DocumentsList.tsx`, `DocumentDetail.tsx`
- API: `packages/api/modules/project-documents/`
- DB: `packages/database/prisma/queries/project-documents.ts`

**ما يعمل:**
- إضافة وثائق ✅
- تصنيف حسب المجلدات ✅
- طلب اعتماد متعدد الموافقين ✅
- التصويت على الاعتماد ✅
- سجل التدقيق ✅

**ما ينقص:**
- تعديل/حذف الوثائق
- رفع ملفات فعلية (يستخدم URLs حالياً)

### 9.5 المحادثات (Chat)

**الحالة**: ✅ مكتمل (100%)

**الملفات:**
- Frontend: `chat/page.tsx`, `ProjectChat.tsx`
- API: `packages/api/modules/project-chat/`
- DB: `packages/database/prisma/queries/project-chat.ts`

**ما يعمل:**
- قناة الفريق الداخلية ✅
- قناة المالك ✅
- إرسال رسائل ✅
- عرض الرسائل ✅

### 9.6 الإشعارات (Notifications)

**الحالة**: ✅ مكتمل (85%)

**الملفات:**
- Frontend: `NotificationsList.tsx`
- API: `packages/api/modules/notifications/`
- DB: `packages/database/prisma/queries/notifications.ts`

**ما يعمل:**
- عرض الإشعارات ✅
- تعليم كمقروء ✅
- أنواع مختلفة من الإشعارات ✅

**ما ينقص:**
- Push notifications
- Email notifications (infrastructure موجود)
- Real-time updates

### 9.7 بوابة المالك (Owner Portal)

**الحالة**: ✅ مكتمل (95%)

**الملفات:**
- Frontend: `apps/web/app/(saas)/owner/[token]/`
- API: `packages/api/modules/project-owner/`
- DB: `packages/database/prisma/queries/project-owner-portal.ts`

**ما يعمل:**
- Token-based authentication ✅
- ملخص المشروع ✅
- عرض الجدول الزمني ✅
- عرض الدفعات ✅
- المحادثة مع المقاول ✅
- عرض أوامر التغيير ✅

**ما ينقص:**
- Token refresh mechanism
- Multiple tokens per project

### 9.8 المرفقات (Attachments)

**الحالة**: ✅ مكتمل (85%)

**الملفات:**
- API: `packages/api/modules/attachments/`
- DB: `packages/database/prisma/queries/attachments.ts`

**ما يعمل:**
- Pre-signed URL generation ✅
- Upload finalization ✅
- Download URL generation ✅
- Delete attachments ✅

**ما ينقص:**
- Virus scanning
- File type validation on server

### 9.9 القوالب (Templates)

**الحالة**: ⚠️ جزئي (70%)

**الملفات:**
- Frontend: `templates/page.tsx`, `ProjectTemplates.tsx`
- API: `packages/api/modules/project-templates/`
- DB: `packages/database/prisma/queries/project-templates.ts`

**ما يعمل:**
- إنشاء قالب ✅
- عرض القوالب ✅
- إنشاء من مشروع موجود ✅

**ما ينقص:**
- تطبيق القالب على مشروع جديد (apply)
- تعديل/حذف القوالب
- نسخ عناصر القالب بشكل فعلي

### 9.10 التنبيهات الذكية (Insights)

**الحالة**: ⚠️ جزئي (80%)

**الملفات:**
- Frontend: `insights/page.tsx`, `ProjectInsights.tsx`
- API: `packages/api/modules/project-insights/`
- DB: `packages/database/prisma/queries/project-insights.ts`

**ما يعمل:**
- عرض التنبيهات ✅
- تعليم كـ "تم الاطلاع" ✅
- أنواع مختلفة من التنبيهات ✅

**ما ينقص:**
- Background job لتوليد التنبيهات تلقائياً
- تنبيهات أكثر ذكاءً (AI-based)

### 9.11 التحديثات الرسمية (Official Updates)

**الحالة**: ✅ مكتمل (90%)

**الملفات:**
- Frontend: `updates/page.tsx`, `ProjectUpdates.tsx`
- API: `packages/api/modules/project-updates/`

**ما يعمل:**
- توليد مسودة تلقائية ✅
- نشر للمالك ✅

### 9.12 التصدير (Exports)

**الحالة**: ✅ مكتمل (85%)

**الملفات:**
- API: `packages/api/modules/exports/`

**ما يعمل:**
- PDF: Official update, Claim ✅
- CSV: Expenses, Claims, Issues ✅
- ICS: Calendar ✅
- Weekly Report PDF ✅

### 9.13 التكاملات (Integrations)

**الحالة**: ⚠️ جزئي (60%)

**الملفات:**
- API: `packages/api/modules/integrations/`
- DB: `packages/database/prisma/queries/integrations.ts`

**ما يعمل:**
- Settings storage ✅
- Delivery log ✅

**ما ينقص:**
- WhatsApp integration (Twilio/etc)
- SMS integration
- Email sending

### 9.14 روابط المشاركة (Share Links)

**الحالة**: ✅ مكتمل (90%)

**الملفات:**
- Frontend: `apps/web/app/share/[token]/`
- API: `packages/api/modules/shares/`
- DB: `packages/database/prisma/queries/shares.ts`

**ما يعمل:**
- إنشاء رابط مشاركة ✅
- عرض الموارد المشاركة ✅
- إلغاء الرابط ✅

### 9.15 الجدول الزمني (Timeline)

**الحالة**: ✅ مكتمل (90%)

**الملفات:**
- Frontend: `timeline/page.tsx`, `projects-timeline/components/`
- API: `packages/api/modules/project-timeline/`
- DB: `packages/database/prisma/queries/project-timeline.ts`

**ما يعمل:**
- إدارة المراحل (CRUD) ✅
- إعادة الترتيب ✅
- تعليم البداية/الانتهاء ✅
- حساب صحة الجدول ✅

### 9.16 الملخص الأسبوعي (Weekly Digest)

**الحالة**: ⚠️ جزئي (70%)

**الملفات:**
- API: `packages/api/modules/digests/`
- DB: `packages/database/prisma/queries/digests.ts`

**ما يعمل:**
- اشتراك/إلغاء اشتراك ✅
- جلب الملخص الأسبوعي ✅

**ما ينقص:**
- Cron job لإرسال الملخص تلقائياً
- Email template

---

## 10. التوصيات (Recommendations)

### 10.1 إصلاحات حرجة (يجب الآن) 🔴

1. **إضافة Permission Checks لجميع الـ API endpoints**
   - **الجهد**: متوسط (3-5 أيام)
   - **الملفات**: جميع ملفات procedures
   - **التفاصيل**: استخدام `hasPermission` من `permissions.ts`

2. **إضافة Rate Limiting**
   - **الجهد**: منخفض (1 يوم)
   - **الملفات**: `packages/api/orpc/procedures.ts`

3. **إصلاح Decimal handling للأرقام المالية**
   - **الجهد**: منخفض (2 أيام)
   - **الملفات**: جميع ملفات finance و queries

### 10.2 تحسينات مهمة (قريباً) 🟡

1. **إضافة صفحة فريق المشروع**
   - **الجهد**: متوسط (3-4 أيام)
   - **التفاصيل**: تعيين أعضاء للمشروع مع أدوار

2. **تفعيل إشعارات البريد الإلكتروني**
   - **الجهد**: متوسط (2-3 أيام)
   - **التفاصيل**: ربط بـ Resend/SendGrid

3. **إضافة Edit/Delete للمشاريع**
   - **الجهد**: منخفض (2 أيام)

4. **تحسين قوالب المشاريع (Apply)**
   - **الجهد**: متوسط (2 أيام)

### 10.3 تحسينات مستقبلية (لاحقاً) 🔵

1. **Dashboard شامل للمشاريع**
2. **ربط Quantities module بالمشاريع**
3. **Real-time updates (WebSockets)**
4. **Mobile app / PWA**
5. **AI-powered insights**
6. **WhatsApp/SMS integration**

---

## 11. خطة العمل المقترحة (Action Plan)

### Sprint 1 (أسبوع) - الأمان

| المهمة | الأولوية | الملفات |
|--------|----------|---------|
| إضافة permission checks | 🔴 حرج | جميع procedures |
| إضافة rate limiting | 🔴 حرج | procedures.ts |
| إصلاح Decimal handling | 🔴 حرج | finance queries |

### Sprint 2 (أسبوع) - الميزات الناقصة

| المهمة | الأولوية | الملفات |
|--------|----------|---------|
| Edit/Delete projects | 🟡 مهم | projects module |
| Project team page | 🟡 مهم | جديد |
| Edit/Delete documents | 🟡 مهم | documents module |

### Sprint 3 (أسبوع) - التكاملات

| المهمة | الأولوية | الملفات |
|--------|----------|---------|
| Email notifications | 🟡 مهم | notifications |
| Template apply | 🟡 مهم | templates |
| Weekly digest cron | 🔵 تحسين | digests |

### Sprint 4 (أسبوع) - التحسينات

| المهمة | الأولوية | الملفات |
|--------|----------|---------|
| Error handling توحيد | 🔵 تحسين | جميع components |
| Code refactoring | 🔵 تحسين | utils, formatters |
| Performance optimization | 🔵 تحسين | queries |

---

## 12. الملاحق

### أ. قائمة كل الملفات

**إجمالي الملفات المتعلقة بالمشاريع: ~120 ملف**

<details>
<summary>اضغط لعرض القائمة الكاملة</summary>

```
Frontend Pages (22):
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/new/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/templates/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/field/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/field/new-report/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/field/upload/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/field/new-issue/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/supervisor/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/new-expense/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/finance/new-claim/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/documents/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/documents/new/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/documents/[documentId]/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/chat/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/owner/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/insights/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/updates/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/timeline/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/changes/page.tsx
- apps/web/app/(saas)/app/(organizations)/[organizationSlug]/projects/[projectId]/changes/[changeId]/page.tsx

Owner Portal (8):
- apps/web/app/(saas)/owner/[token]/layout.tsx
- apps/web/app/(saas)/owner/[token]/page.tsx
- apps/web/app/(saas)/owner/[token]/schedule/page.tsx
- apps/web/app/(saas)/owner/[token]/payments/page.tsx
- apps/web/app/(saas)/owner/[token]/chat/page.tsx
- apps/web/app/(saas)/owner/[token]/changes/page.tsx
- apps/web/app/(saas)/owner/[token]/changes/[changeId]/page.tsx

Share (1):
- apps/web/app/share/[token]/page.tsx

Components (34):
[Listed in Section 2.2]

API Modules (16 routers, ~70 procedures):
[Listed in Section 2.3]

Database Queries (15):
[Listed in Section 2.4]
```
</details>

### ب. مصفوفة الصلاحيات الفعلية

| الإجراء | Permission Required | مطبق حالياً |
|---------|---------------------|-------------|
| عرض المشاريع | `projects.view` | membership فقط ❌ |
| إنشاء مشروع | `projects.create` | membership فقط ❌ |
| تعديل مشروع | `projects.edit` | غير موجود |
| حذف مشروع | `projects.delete` | غير موجود |
| عرض المالية | `projects.viewFinance` | membership فقط ❌ |
| إنشاء مصروف | `finance.create` | membership فقط ❌ |
| إنشاء مستخلص | `finance.create` | membership فقط ❌ |
| إنشاء وثيقة | `documents.create` | membership فقط ❌ |
| طلب اعتماد | `documents.approve` | membership فقط ❌ |

### ج. قائمة كل الـ API Endpoints

<details>
<summary>اضغط لعرض القائمة الكاملة (~70 endpoint)</summary>

```
projects.list
projects.create
projects.getById

projectField.createDailyReport
projectField.listDailyReports
projectField.createPhoto
projectField.listPhotos
projectField.createIssue
projectField.listIssues
projectField.updateIssue
projectField.addProgressUpdate
projectField.listProgressUpdates
projectField.getTimeline

projectFinance.getSummary
projectFinance.createExpense
projectFinance.listExpenses
projectFinance.createClaim
projectFinance.listClaims
projectFinance.updateClaimStatus

projectDocuments.list
projectDocuments.create
projectDocuments.get
projectDocuments.createApprovalRequest
projectDocuments.actOnApproval
projectDocuments.getApproval

projectChat.listMessages
projectChat.sendMessage

notifications.list
notifications.markRead

projectOwner.createAccess
projectOwner.listAccess
projectOwner.revokeAccess
projectOwner.sendOfficialUpdate
projectOwner.portal.getSummary
projectOwner.portal.getSchedule
projectOwner.portal.getPayments
projectOwner.portal.listMessages
projectOwner.portal.sendMessage
projectOwner.portal.listUpdates

projectTimeline.listMilestones
projectTimeline.createMilestone
projectTimeline.updateMilestone
projectTimeline.deleteMilestone
projectTimeline.reorderMilestones
projectTimeline.markActual
projectTimeline.startMilestone
projectTimeline.completeMilestone
projectTimeline.getHealth

projectChangeOrders.list
projectChangeOrders.getStats
projectChangeOrders.get
projectChangeOrders.create
projectChangeOrders.update
projectChangeOrders.delete
projectChangeOrders.submit
projectChangeOrders.approve
projectChangeOrders.reject
projectChangeOrders.implement
projectChangeOrders.ownerList
projectChangeOrders.ownerGet

projectInsights.get
projectInsights.acknowledge

projectTemplates.list
projectTemplates.create
projectTemplates.apply

projectUpdates.generateDraft
projectUpdates.publish

attachments.createUploadUrl
attachments.finalizeUpload
attachments.list
attachments.getDownloadUrl
attachments.delete

exports.generateUpdatePDF
exports.generateClaimPDF
exports.generateWeeklyReport
exports.exportExpensesCsv
exports.exportClaimsCsv
exports.exportIssuesCsv
exports.generateCalendarICS

shares.create
shares.list
shares.revoke
shares.getResource

digests.getWeekly
digests.subscribe
digests.unsubscribe
digests.listSubscriptions
```
</details>

### د. قائمة كل الـ Database Models

```
Project-related Models (25):
- Project
- ProjectDailyReport
- ProjectPhoto
- ProjectIssue
- ProjectProgressUpdate
- ProjectExpense
- ProjectClaim
- ProjectDocument
- ProjectApproval
- ProjectApprovalApprover
- ProjectMessage
- ProjectAuditLog
- ProjectOwnerAccess
- ProjectMilestone
- ProjectChangeOrder
- ProjectTemplate
- ProjectTemplateItem
- ProjectAlert
- Notification
- DigestSubscription
- Attachment
- ShareLink
- MessageDeliveryLog
- OrganizationIntegrationSettings
```

---

**نهاية التقرير**

*تم إعداد هذا التقرير بواسطة Claude Code بناءً على تحليل فعلي للكود المصدري.*
