export function getSettingsKnowledge(locale: string): string {
  return `
## إعدادات المنظمة
المسار: /[org]/settings

### الإعدادات العامة (/settings/general)
- اسم المنظمة، الشعار، الوصف
- الـ slug (الرابط المختصر)

### الأعضاء (/settings/members)
- إضافة أعضاء جدد (دعوة بالإيميل)
- تعديل أدوار الأعضاء
- إزالة أعضاء

### الأدوار (/settings/roles)
- أدوار النظام الافتراضية: OWNER, PROJECT_MANAGER, ACCOUNTANT, ENGINEER, SUPERVISOR
- إنشاء أدوار مخصصة مع صلاحيات محددة
- حماية أدوار النظام من الحذف

### الفوترة (/settings/billing)
- إدارة الاشتراك (FREE أو PRO)
- FREE: عرض فقط (demo)
- PRO: كل المميزات

### التكاملات (/settings/integrations)
- إعدادات البريد الإلكتروني
- إعدادات WhatsApp
- إعدادات SMS

### نظام الصلاحيات
8 أقسام: projects, quantities, pricing, finance, employees, company, settings, reports
كل قسم فيه صلاحيات فرعية (view, create, edit, delete, ...)

| الدور | الصلاحيات |
|---|---|
| OWNER | كل الصلاحيات |
| PROJECT_MANAGER | المشاريع + الكميات + جزء من المالية |
| ACCOUNTANT | المالية + الموظفين + الرواتب |
| ENGINEER | المشاريع + الكميات (بدون حذف) |
| SUPERVISOR | مشاهدة المشاريع + الكميات |
`;
}
