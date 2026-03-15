export function getNavigationKnowledge(locale: string, organizationSlug: string): string {
  const org = organizationSlug;

  return `
## خريطة التنقل الكاملة
كل المسارات تبدأ بـ /app/ قبل slug المنظمة.

### لوحة التحكم
- الرئيسية: /app/${org}

### المشاريع
- قائمة المشاريع: /app/${org}/projects
- مشروع جديد: /app/${org}/projects/new
- قوالب المشاريع: /app/${org}/projects/templates
- تفاصيل مشروع: /app/${org}/projects/[projectId]
- التنفيذ: /app/${org}/projects/[projectId]/execution
- العمل الميداني:
  - التقارير اليومية: /app/${org}/projects/[projectId]/field/daily-reports
  - الصور: /app/${org}/projects/[projectId]/field/photos
  - المشاكل: /app/${org}/projects/[projectId]/field/issues
  - تحديثات التقدم: /app/${org}/projects/[projectId]/field/progress
- المالية: /app/${org}/projects/[projectId]/finance
- الجدول الزمني: /app/${org}/projects/[projectId]/timeline
- المستندات: /app/${org}/projects/[projectId]/documents
- المحادثات: /app/${org}/projects/[projectId]/chat
- أوامر التغيير: /app/${org}/projects/[projectId]/changes
- الفريق: /app/${org}/projects/[projectId]/team
- التحليلات: /app/${org}/projects/[projectId]/insights
- بوابة المالك: /app/${org}/projects/[projectId]/owner
- عقود الباطن: /app/${org}/projects/[projectId]/finance/subcontracts

### المالية
- لوحة المالية: /app/${org}/finance
- الفواتير: /app/${org}/finance/invoices
- فاتورة جديدة: /app/${org}/finance/invoices/new
- المقبوضات: /app/${org}/finance/payments
- المصروفات: /app/${org}/finance/expenses
- الحسابات البنكية: /app/${org}/finance/banks
- العملاء: /app/${org}/finance/clients
- التقارير: /app/${org}/finance/reports
- الإعدادات المالية: /app/${org}/finance/settings

### التسعير
- عروض الأسعار: /app/${org}/pricing/quotations
- دراسات التكلفة: /app/${org}/pricing/studies

### إدارة المنشأة
- الرئيسية: /app/${org}/company
- الموظفون: /app/${org}/company/employees
- الأصول: /app/${org}/company/assets
- مصروفات المنشأة: /app/${org}/company/expenses
- الرواتب: /app/${org}/company/payroll
- ترحيل المصروفات: /app/${org}/company/expense-runs
- القوالب: /app/${org}/company/templates
- تقارير المنشأة: /app/${org}/company/reports

### الإعدادات
- عام: /app/${org}/settings/general
- الأعضاء: /app/${org}/settings/members
- الأدوار: /app/${org}/settings/roles
- الفوترة: /app/${org}/settings/billing
- التكاملات: /app/${org}/settings/integrations

### أخرى
- الإشعارات: /app/${org}/notifications
- المحادثة الذكية: /app/${org}/chatbot

### ملاحظات التنقل
- إذا المستخدم في مشروع محدد، استخدم projectId الحالي من السياق بدل [projectId]
- عند اقتراح رابط، استخدم المسار الكامل مع /app/
`;
}
