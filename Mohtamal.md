دراسة كاملة: إضافة "العملاء المحتملون" لقسم التسعير
أولاً: لماذا قسم التسعير هو المكان الصحيح؟
قسم التسعير الحالي يضم:

CostStudy — دراسة التكلفة (تحليل داخلي)
Quote — عرض سعر من دراسة التكلفة (للعميل)
Quotation — عرض سعر مستقل (يدوي)

الغائب الوحيد هو من هو العميل الذي من أجله تصنع كل هذا؟ Lead هو الغلاف الخارجي الذي يجمع كل هذه العمليات تحت اسم شخص وفرصة واحدة. المنطق التسلسلي يصبح:
Lead (فرصة جديدة)
  └── CostStudy (ندرس التكلفة داخلياً)
        └── Quote (نولّد عرض سعر للعميل)
              └── Quotation (عرض سعر رسمي بعنوان ورقم)
                    └── [تحويل لمشروع عند الموافقة]

ثانياً: خريطة التغييرات الكاملة
1. قاعدة البيانات — 3 Models جديدة
prisma// packages/database/prisma/schema.prisma

enum LeadStatus {
  NEW           // جديد
  STUDYING      // قيد الدراسة
  QUOTED        // تم تقديم العرض
  NEGOTIATING   // تفاوض
  WON           // ربحنا
  LOST          // خسرنا
}

enum LeadSource {
  REFERRAL      // توصية
  SOCIAL_MEDIA  // وسائل تواصل
  WEBSITE       // الموقع
  DIRECT        // مباشر
  EXHIBITION    // معرض
  OTHER         // أخرى
}

enum LeadFileCategory {
  BLUEPRINT     // مخطط معماري
  STRUCTURE     // مخطط إنشائي
  SITE          // صورة موقع
  SCOPE         // نطاق العمل
  OTHER         // أخرى
}

enum LeadActivityType {
  COMMENT             // تعليق
  STATUS_CHANGE       // تغيير حالة
  FILE_UPLOADED       // رُفع ملف
  COST_STUDY_LINKED   // ربط دراسة تكلفة
  QUOTATION_LINKED    // ربط عرض سعر
  CONVERTED           // تحويل لمشروع
}

model Lead {
  id              String     @id @default(cuid())
  organizationId  String
  createdById     String

  // البيانات الأساسية
  name            String                      // اسم العميل المحتمل
  phone           String?
  email           String?
  company         String?                     // اسم الشركة (إن وُجدت)
  clientType      ClientType @default(INDIVIDUAL)

  // تفاصيل المشروع المتوقع
  projectType     ProjectType?
  projectLocation String?
  estimatedArea   Decimal?
  estimatedValue  Decimal?                   // القيمة التقديرية SAR

  // إدارة الفرصة
  status          LeadStatus  @default(NEW)
  source          LeadSource  @default(DIRECT)
  priority        Int         @default(0)    // 0=عادي 1=مهم 2=عاجل
  assignedToId    String?                    // المسؤول عن الفرصة
  expectedCloseDate DateTime?               // التاريخ المتوقع للإغلاق
  lostReason      String?                   // سبب الخسارة

  // الربط بالكيانات الأخرى
  costStudyId     String?    @unique        // دراسة التكلفة المرتبطة
  quotationId     String?    @unique        // عرض السعر الرسمي
  convertedProjectId String? @unique       // المشروع بعد التحويل

  // العلاقات
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy       User         @relation("LeadCreatedBy", fields: [createdById], references: [id])
  assignedTo      User?        @relation("LeadAssignedTo", fields: [assignedToId], references: [id])
  costStudy       CostStudy?   @relation(fields: [costStudyId], references: [id])
  quotation       Quotation?   @relation(fields: [quotationId], references: [id])

  files           LeadFile[]
  activities      LeadActivity[]
  
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([assignedToId])
}

model LeadFile {
  id             String          @id @default(cuid())
  leadId         String
  organizationId String
  createdById    String

  name           String
  fileUrl        String
  fileSize       Int?
  fileType       String?         // image/pdf/dwg...
  category       LeadFileCategory @default(OTHER)
  description    String?

  lead           Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdBy      User @relation(fields: [createdById], references: [id])

  createdAt      DateTime @default(now())

  @@index([leadId])
  @@index([organizationId])
}

model LeadActivity {
  id             String           @id @default(cuid())
  leadId         String
  organizationId String
  createdById    String

  type           LeadActivityType @default(COMMENT)
  content        String?          // نص التعليق
  metadata       Json?            // { oldStatus, newStatus, fileId, ... }

  lead           Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdBy      User @relation(fields: [createdById], references: [id])

  createdAt      DateTime @default(now())

  @@index([leadId])
  @@index([organizationId])
}
تعديلات على Models الحالية:
prisma// إضافة علاقة عكسية على CostStudy
model CostStudy {
  // ... الحقول الحالية
  lead  Lead?   // ← إضافة
}

// إضافة علاقة عكسية على Quotation
model Quotation {
  // ... الحقول الحالية  
  lead  Lead?   // ← إضافة
}
```

---

### 2. الـ API — Router جديد ضمن pricing
```
packages/api/modules/pricing/
├── router.ts                    ← تعديل: إضافة leads
└── procedures/
    └── leads/
        ├── list.ts
        ├── get-by-id.ts
        ├── create.ts
        ├── update.ts
        ├── delete.ts
        ├── update-status.ts
        ├── link-cost-study.ts      ← ربط دراسة تكلفة
        ├── link-quotation.ts       ← ربط عرض سعر
        ├── convert-to-project.ts   ← التحويل للمشروع
        ├── add-activity.ts         ← تعليق جديد
        └── files/
            ├── create-upload-url.ts
            ├── save-file.ts
            └── delete-file.ts
```

**الـ Endpoints:**

| Endpoint | الوصف |
|----------|-------|
| `pricing.leads.list` | قائمة العملاء مع فلاتر (status, assignee, search) |
| `pricing.leads.getById` | تفاصيل كاملة + ملفات + أنشطة |
| `pricing.leads.create` | إنشاء عميل محتمل |
| `pricing.leads.update` | تحديث البيانات |
| `pricing.leads.delete` | حذف |
| `pricing.leads.updateStatus` | تغيير الحالة (مع تسجيل نشاط تلقائي) |
| `pricing.leads.linkCostStudy` | ربط/فك دراسة تكلفة |
| `pricing.leads.linkQuotation` | ربط/فك عرض سعر |
| `pricing.leads.convertToProject` | تحويل لمشروع فعلي |
| `pricing.leads.addActivity` | إضافة تعليق |
| `pricing.leads.files.getUploadUrl` | رفع ملف |
| `pricing.leads.files.save` | حفظ بعد الرفع |
| `pricing.leads.files.delete` | حذف ملف |
| `pricing.leads.getStats` | إحصائيات (للوحة) |

---

### 3. المسارات والصفحات — 5 صفحات جديدة
```
[organizationSlug]/pricing/
├── layout.tsx          ← تعديل: إضافة "العملاء المحتملون" للشريط الجانبي
├── leads/
│   ├── page.tsx        ← قائمة + فلاتر + إحصائيات
│   ├── new/
│   │   └── page.tsx    ← نموذج إنشاء
│   └── [leadId]/
│       ├── page.tsx    ← الصفحة الرئيسية للعميل
│       └── edit/
│           └── page.tsx ← تعديل البيانات
```

---

### 4. المكونات — وحدة pricing الحالية
```
apps/web/modules/saas/pricing/
└── components/
    └── leads/
        ├── LeadsList.tsx           ← الجدول الرئيسي
        ├── LeadStatusBadge.tsx     ← Badge ملوّن بالحالة
        ├── LeadPriorityIcon.tsx    ← أيقونة الأولوية
        ├── LeadStats.tsx           ← بطاقات الإحصائيات
        ├── LeadFilters.tsx         ← فلاتر (حالة، مصدر، مسؤول)
        ├── CreateLeadForm.tsx      ← نموذج الإنشاء
        ├── EditLeadForm.tsx        ← نموذج التعديل
        ├── LeadDetail/
        │   ├── LeadDetailPage.tsx  ← الصفحة الكاملة
        │   ├── LeadHeader.tsx      ← الرأس (اسم + حالة + أزرار)
        │   ├── LeadInfoTab.tsx     ← تبويب البيانات
        │   ├── LeadFilesTab.tsx    ← تبويب الملفات
        │   ├── LeadActivityTab.tsx ← تبويب النشاط والتعليقات
        │   ├── LeadLinkedTab.tsx   ← تبويب الربط (دراسة + عرض)
        │   ├── ActivityFeed.tsx    ← عرض الأنشطة chronologically
        │   ├── CommentBox.tsx      ← صندوق التعليق
        │   ├── FileUploadZone.tsx  ← منطقة رفع الملفات
        │   ├── LinkCostStudyDialog.tsx  ← ربط دراسة تكلفة
        │   ├── LinkQuotationDialog.tsx  ← ربط عرض سعر
        │   └── ConvertToProjectDialog.tsx ← التحويل لمشروع
        └── LeadKanban.tsx          ← (اختياري) عرض Kanban

5. تعديل الشريط الجانبي للتسعير
typescript// pricing/layout.tsx — إضافة عنصر واحد فقط
{
  href: `/${slug}/pricing/leads`,
  label: t("leads"),           // العملاء المحتملون
  icon: UserSearch,
  permission: "pricing.leads"  // صلاحية جديدة
}

6. الصلاحيات الجديدة
typescript// إضافة في مصفوفة الصلاحيات
"pricing.leads"  // عرض وإدارة العملاء المحتملين
```

| الصلاحية | OWNER | PM | ACCT | ENG | SUP |
|----------|:-----:|:--:|:----:|:---:|:---:|
| `pricing.leads` | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## ثالثاً: تدفق واجهة المستخدم

### صفحة القائمة (`/pricing/leads`)
```
┌─────────────────────────────────────────────────────┐
│  العملاء المحتملون              [+ عميل محتمل جديد] │
├─────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │  12  │  │  5   │  │  8   │  │  3   │  │  2M  │  │
│  │ الكل │  │جديد  │  │دراسة │  │عروض  │  │ SAR  │  │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │
│                                         قيمة تقديرية │
├─────────────────────────────────────────────────────┤
│  [🔍 بحث...]  [الحالة ▼]  [المصدر ▼]  [المسؤول ▼] │
├─────────────────────────────────────────────────────┤
│  الاسم      │ النوع  │ القيمة │ الحالة  │ المسؤول │  │
│  ─────────────────────────────────────────────────  │
│  محمد الأحمدي│ فيلا  │ 1.2M  │●جديد   │ خالد   │⋯ │
│  شركة النهضة │تجاري  │ 8M    │●دراسة  │ أنت    │⋯ │
│  سعد العتيبي │ دوبلكس│ 2.5M  │●عرض   │ فهد    │⋯ │
└─────────────────────────────────────────────────────┘
```

### صفحة تفاصيل Lead (`/pricing/leads/[id]`)
```
┌─────────────────────────────────────────────────────────┐
│ ← عملاء محتملون                                         │
│                                                         │
│  محمد بن عبدالله الأحمدي          ● قيد الدراسة  [···] │
│  📞 0501234567  |  📍 الرياض - حي النرجس               │
│  نوع: فيلا سكنية  |  المساحة: 600م²  |  قيمة: ~1.2M   │
│  المسؤول: خالد  |  المصدر: توصية  |  أُضيف: 3 يناير   │
│                                                         │
│  [إنشاء دراسة تكلفة]  [ربط عرض سعر]  [تحويل لمشروع]  │
├─────────────────────────────────────────────────────────┤
│  [البيانات]  [الملفات (3)]  [النشاط (7)]  [المرتبطات] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  تبويب النشاط:                                          │
│  ──────────────────────────────────                    │
│  🔵 اليوم، 2:30م — خالد                               │
│     "تواصلت مع العميل، مهتم بتفاصيل التشطيب"          │
│                                                         │
│  🔄 أمس — النظام                                       │
│     تغيير الحالة: جديد → قيد الدراسة                  │
│                                                         │
│  📎 3 يناير — أنت                                      │
│     رُفع ملف: "مخطط الطابق الأرضي.pdf"                │
│  ──────────────────────────────────                    │
│  ✍️  اكتب تعليقاً...                       [إرسال]    │
└─────────────────────────────────────────────────────────┘
```

### تبويب "المرتبطات" — القلب التقني
```
┌─────────────────────────────────┐
│  دراسة التكلفة                  │
│  ┌────────────────────────────┐ │
│  │ فيلا الأحمدي - دراسة 2025 │ │
│  │ التكلفة الإجمالية: 980,000 │ │
│  │ [عرض الدراسة]  [فك الربط] │ │
│  └────────────────────────────┘ │
│  أو [+ إنشاء دراسة جديدة]      │
│  أو [ربط دراسة موجودة]          │
├─────────────────────────────────┤
│  عرض السعر الرسمي              │
│  ┌────────────────────────────┐ │
│  │ QTN-2025-047               │ │
│  │ الإجمالي: 1,150,000 SAR   │ │
│  │ الصلاحية: 15 يناير 2026   │ │
│  │ [عرض العرض]  [فك الربط]  │ │
│  └────────────────────────────┘ │
│  أو [+ إنشاء عرض سعر]          │
└─────────────────────────────────┘

رابعاً: منطق "تحويل لمشروع"
typescript// convert-to-project.ts
// عند النقر على "تحويل لمشروع":

1. إنشاء Project جديد تلقائياً بـ:
   - name:    Lead.name + " - مشروع"
   - type:    Lead.projectType
   - client:  Lead.name, Lead.phone, Lead.email
   
2. إذا كان هناك Quotation مرتبط:
   - ربط quotationId بالمشروع الجديد
   
3. تحديث Lead:
   - status → WON
   - convertedProjectId → Project.id
   
4. تسجيل نشاط:
   - type: CONVERTED
   - metadata: { projectId, projectName }

5. Redirect للمشروع الجديد

خامساً: الترجمات المطلوبة (i18n)
json// ar.json — إضافات في قسم pricing
{
  "pricing": {
    "leads": {
      "title": "العملاء المحتملون",
      "new": "عميل محتمل جديد",
      "empty": "لا يوجد عملاء محتملون بعد",
      "stats": {
        "total": "الإجمالي",
        "new": "جديد",
        "studying": "قيد الدراسة", 
        "quoted": "بعرض سعر",
        "estimatedValue": "قيمة تقديرية"
      },
      "fields": {
        "name": "اسم العميل",
        "phone": "الجوال",
        "email": "البريد الإلكتروني",
        "company": "الشركة",
        "clientType": "نوع العميل",
        "projectType": "نوع المشروع",
        "projectLocation": "الموقع",
        "estimatedArea": "المساحة التقديرية (م²)",
        "estimatedValue": "القيمة التقديرية (ريال)",
        "status": "الحالة",
        "source": "مصدر الفرصة",
        "priority": "الأولوية",
        "assignedTo": "المسؤول",
        "expectedCloseDate": "التاريخ المتوقع للإغلاق",
        "lostReason": "سبب الخسارة",
        "notes": "ملاحظات"
      },
      "status": {
        "NEW": "جديد",
        "STUDYING": "قيد الدراسة",
        "QUOTED": "تم تقديم العرض",
        "NEGOTIATING": "تفاوض",
        "WON": "ربحنا العقد",
        "LOST": "خسرنا العقد"
      },
      "source": {
        "REFERRAL": "توصية",
        "SOCIAL_MEDIA": "وسائل تواصل",
        "WEBSITE": "الموقع الإلكتروني",
        "DIRECT": "تواصل مباشر",
        "EXHIBITION": "معرض",
        "OTHER": "أخرى"
      },
      "actions": {
        "createCostStudy": "إنشاء دراسة تكلفة",
        "linkCostStudy": "ربط دراسة موجودة",
        "linkQuotation": "ربط عرض سعر",
        "convertToProject": "تحويل لمشروع",
        "markAsLost": "تحديد كخسارة",
        "addComment": "أضف تعليقاً",
        "uploadFile": "رفع ملف"
      },
      "activity": {
        "COMMENT": "تعليق",
        "STATUS_CHANGE": "تغيير الحالة",
        "FILE_UPLOADED": "رُفع ملف",
        "COST_STUDY_LINKED": "ربط دراسة تكلفة",
        "QUOTATION_LINKED": "ربط عرض سعر",
        "CONVERTED": "تحويل لمشروع"
      },
      "tabs": {
        "info": "البيانات",
        "files": "الملفات",
        "activity": "النشاط",
        "linked": "المرتبطات"
      }
    }
  }
}

سادساً: التحديثات على الوحدات الأخرى
الوحدةالتعديلCostStudyList.tsxإضافة badge "مرتبط بعميل محتمل" عند وجود علاقةCostStudyDetail.tsxرابط للعودة للـ Lead المرتبطQuotationList.tsxإضافة badge "مرتبط بعميل محتمل"Dashboardإضافة بطاقة "فرص مفتوحة" في لوحة التحكمSidebar Orgشارة عدد للفرص الجديدة غير المعالجة

سابعاً: تقدير التنفيذ لـ Claude Code
المرحلةالمحتوىتقدير الوقتPhase 1DB Schema (3 models + enums) + pnpm generate + pnpm pushprompt واحدPhase 2API Router كامل (13 procedure)prompt واحدPhase 3صفحات Next.js (5 صفحات) + layout تعديلprompt واحدPhase 4مكونات القائمة + فلاتر + إحصائياتprompt واحدPhase 5صفحة التفاصيل الكاملة (4 تبويبات + أنشطة + ملفات)prompt واحد أو اثنانPhase 6Dialogs (ربط + تحويل) + ترجماتprompt واحد

ثامناً: أولوية التنفيذ
الترتيب المنطقي المقترح هو البدء بـ Phase 1 و 2 أولاً (البنية التحتية)، ثم 4 و 5 (الواجهة الرئيسية) قبل 3 (لأن الصفحات تعتمد على المكونات)، وأخيراً 6.
