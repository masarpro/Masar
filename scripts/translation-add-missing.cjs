/**
 * Adds 126 missing translation keys to ar.json + en.json.
 * Handles 4 string→object conflicts by promoting the existing string into a `.title` (or `.label`)
 * sub-key, then sets the new sub-keys.
 *
 * Conflicts requiring code updates (handled separately):
 *   - claims.empty (string → object): SubcontractClaimsSection.tsx uses t("claims.empty")
 *   - ownerPortal.payments.status (object): page.tsx uses t("ownerPortal.payments.status") as label AND t(".status.draft") as enum
 *   - projectQuantities.materials (string → object): page.tsx uses as metadata title
 *   - projectQuantities.summary (string → object): no direct consumer
 */

const fs = require('fs');

const AR_PATH = 'packages/i18n/translations/ar.json';
const EN_PATH = 'packages/i18n/translations/en.json';

const ar = JSON.parse(fs.readFileSync(AR_PATH, 'utf8'));
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

function setPath(obj, path, value, opts = {}) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] === undefined) {
      cur[k] = {};
    } else if (typeof cur[k] === 'string') {
      // String→object conflict: preserve original under .title unless told otherwise
      const promoted = opts.promoteTo || 'title';
      cur[k] = { [promoted]: cur[k] };
    }
    cur = cur[k];
  }
  const leaf = parts[parts.length - 1];
  if (cur[leaf] === undefined || opts.overwrite) {
    cur[leaf] = value;
  }
}

// ============================================================
//  Pre-step: handle the structural conflicts BEFORE adding keys
// ============================================================

// 1. claims.empty: string → { title, description } — keep existing as title
for (const data of [ar, en]) {
  if (typeof data.claims?.empty === 'string') {
    data.claims.empty = { title: data.claims.empty };
  }
}

// 2. ownerPortal.payments.status: keep as object (statuses inside),
//    and add ownerPortal.payments.status as a string column header by RENAMING object → "statuses"
//    Then add "status" as the column-header string.
for (const data of [ar, en]) {
  const payments = data.ownerPortal?.payments;
  if (payments && payments.status && typeof payments.status === 'object') {
    payments.statuses = payments.status;
    delete payments.status;
  }
}

// 3. projectQuantities.materials: string → object with .title
// 4. projectQuantities.summary: string → object with .title
for (const data of [ar, en]) {
  const pq = data.projectQuantities;
  if (pq) {
    if (typeof pq.materials === 'string') pq.materials = { title: pq.materials };
    if (typeof pq.summary === 'string') pq.summary = { title: pq.summary };
  }
}

// ============================================================
//  Additions: [path, ar, en]
// ============================================================
const additions = [
  // claims.* (top-level — used by SubcontractClaims*.tsx via useTranslations("claims"))
  ['claims.claimNo',                   'رقم المستخلص',           'Claim No.'],
  ['claims.empty.description',         'ابدأ بإنشاء أول مستخلص لهذا العقد', 'Create your first claim for this contract'],
  ['claims.status',                    'الحالة',                 'Status'],
  ['claims.summary.totalClaimed',      'إجمالي المطالبات',       'Total Claimed'],
  ['claims.summary.totalOutstanding',  'المتبقي',                'Outstanding'],
  ['claims.summary.totalPaid',         'المدفوع',                'Paid'],

  // common.*
  ['common.createdBy',  'بواسطة',         'Created by'],
  ['common.deleted',    'محذوف',          'Deleted'],
  ['common.none',       'لا يوجد',        'None'],
  ['common.notFound',   'غير موجود',       'Not found'],
  ['common.print',      'طباعة',          'Print'],
  ['common.saved',      'تم الحفظ',       'Saved'],
  ['common.total',      'الإجمالي',       'Total'],

  // company.assets.*
  ['company.assets.nameRequired', 'اسم الأصل مطلوب', 'Asset name is required'],

  // company.employees.*
  ['company.employees.terminate',                       'إنهاء الخدمة',                'Terminate'],
  ['company.employees.validation.invalidEmail',         'البريد الإلكتروني غير صالح',   'Invalid email address'],
  ['company.employees.validation.joinDateRequired',     'تاريخ الالتحاق مطلوب',         'Join date is required'],
  ['company.employees.validation.nameRequired',         'اسم الموظف مطلوب',             'Employee name is required'],

  // company.expenses.*
  ['company.expenses.deactivate',                       'إيقاف المصروف',                'Deactivate'],
  ['company.expenses.deleteItem',                       'حذف المصروف',                  'Delete expense'],
  ['company.expenses.validation.amountPositive',        'المبلغ يجب أن يكون أكبر من صفر', 'Amount must be greater than zero'],
  ['company.expenses.validation.nameRequired',          'اسم المصروف مطلوب',            'Expense name is required'],
  ['company.expenses.validation.startDateRequired',     'تاريخ البداية مطلوب',           'Start date is required'],

  // company.payroll.*
  ['company.payroll.viewDetails', 'عرض التفاصيل', 'View details'],

  // finance.capitalContributions.*
  ['finance.capitalContributions.bankAccount', 'الحساب البنكي', 'Bank account'],
  ['finance.capitalContributions.basicInfo',   'المعلومات الأساسية', 'Basic information'],

  // finance.expenses.errors.*
  ['finance.expenses.errors.amountExceedsRemaining', 'المبلغ يتجاوز المتبقي للسداد', 'Amount exceeds the remaining balance'],

  // finance.payments.methods.* (UPPERCASE — alongside existing lowercase)
  ['finance.payments.methods.BANK_TRANSFER', 'تحويل بنكي', 'Bank transfer'],
  ['finance.payments.methods.CASH',          'نقدي',       'Cash'],
  ['finance.payments.methods.CHEQUE',        'شيك',        'Cheque'],
  ['finance.payments.methods.CREDIT_CARD',   'بطاقة ائتمان', 'Credit card'],
  ['finance.payments.methods.OTHER',         'أخرى',       'Other'],

  // finance.reports.*
  ['finance.reports.client',           'العميل',                'Client'],
  ['finance.reports.conversionRate',   'نسبة التحويل',           'Conversion rate'],
  ['finance.reports.invoiceCount',     'عدد الفواتير',           'Invoice count'],
  ['finance.reports.invoiceStats',     'إحصائيات الفواتير',      'Invoice statistics'],
  ['finance.reports.monthlyRevenue',   'الإيرادات الشهرية',       'Monthly revenue'],
  ['finance.reports.noProject',        'بدون مشروع',             'No project'],
  ['finance.reports.paidAmount',       'المبلغ المدفوع',          'Paid amount'],
  ['finance.reports.project',          'المشروع',                'Project'],
  ['finance.reports.projectRevenue',   'إيرادات المشاريع',        'Project revenue'],
  ['finance.reports.quotationStats',   'إحصائيات عروض الأسعار',   'Quotation statistics'],
  ['finance.reports.statusStats',      'إحصائيات الحالات',        'Status statistics'],
  ['finance.reports.topClients',       'أعلى العملاء',           'Top clients'],
  ['finance.reports.totalInvoiced',    'إجمالي المفوتر',          'Total invoiced'],
  ['finance.reports.totalInvoices',    'إجمالي الفواتير',         'Total invoices'],
  ['finance.reports.totalQuotations',  'إجمالي عروض الأسعار',     'Total quotations'],
  ['finance.reports.totalRevenue',     'إجمالي الإيرادات',        'Total revenue'],
  ['finance.reports.unknown',          'غير معروف',               'Unknown'],

  // finance.summary.title
  ['finance.summary.title', 'الملخص المالي', 'Financial summary'],

  // ownerPortal.payments.* (status moved to statuses; status now string column)
  ['ownerPortal.payments.paidAmount', 'المبلغ المدفوع', 'Paid amount'],
  ['ownerPortal.payments.period',     'الفترة',         'Period'],
  ['ownerPortal.payments.status',     'الحالة',         'Status'],

  // pricing.* (subscription/marketing labels — used by PricingTable.tsx, ActivePlan.tsx)
  ['pricing.choosePlan',     'اختر الخطة',                            'Choose plan'],
  ['pricing.contactSales',   'تواصل مع المبيعات',                      'Contact sales'],
  ['pricing.getStarted',     'ابدأ الآن',                              'Get started'],
  ['pricing.month',          '{count, plural, one {شهرياً} other {كل # أشهر}}', '{count, plural, one {per month} other {per # months}}'],
  ['pricing.monthly',        'شهري',                                   'Monthly'],
  ['pricing.perSeat',        'لكل مستخدم',                             'per seat'],
  ['pricing.recommended',    'موصى به',                                'Recommended'],
  ['pricing.trialPeriod',    '{count} يوم تجربة مجانية',               '{count}-day free trial'],
  ['pricing.year',           '{count, plural, one {سنوياً} other {كل # سنوات}}', '{count, plural, one {per year} other {per # years}}'],
  ['pricing.yearly',         'سنوي',                                   'Yearly'],

  // pricing.studies.finishing.specs.noItems
  ['pricing.studies.finishing.specs.noItems', 'لا توجد بنود لتحديد مواصفاتها', 'No items to specify'],

  // projectQuantities.* (many — promoted materials/summary to objects above)
  ['projectQuantities.actions.linkExisting',                        'ربط بدراسة موجودة',                  'Link existing study'],
  ['projectQuantities.createDialog.areaSqm',                        'المساحة (م²)',                       'Area (m²)'],
  ['projectQuantities.createDialog.buildingArea',                   'مساحة البناء',                       'Building area'],
  ['projectQuantities.createDialog.finishingLevelPlaceholder',      'اختر مستوى التشطيب',                  'Select finishing level'],
  ['projectQuantities.createDialog.landArea',                       'مساحة الأرض',                        'Land area'],
  ['projectQuantities.createDialog.numberOfFloors',                 'عدد الأدوار',                        'Number of floors'],
  ['projectQuantities.createDialog.projectTypePlaceholder',         'اختر نوع المشروع',                    'Select project type'],
  ['projectQuantities.createDialog.submit',                         'إنشاء الدراسة',                       'Create study'],
  ['projectQuantities.createDialog.toast.createError',              'تعذّر إنشاء الدراسة',                 'Failed to create study'],
  ['projectQuantities.createDialog.toast.studyCreated',             'تم إنشاء الدراسة بنجاح',              'Study created successfully'],
  ['projectQuantities.createDialog.vatIncluded',                    'يشمل ضريبة القيمة المضافة',           'VAT included'],
  ['projectQuantities.empty.description',                           'لا توجد بنود كميات بعد. ابدأ بربط دراسة أو إنشاء واحدة جديدة.', 'No quantity items yet. Link an existing study or create a new one.'],
  ['projectQuantities.empty.noFinishingItems',                      'لا توجد بنود تشطيبات',                'No finishing items'],
  ['projectQuantities.empty.noLaborItems',                          'لا توجد بنود عمالة',                  'No labor items'],
  ['projectQuantities.empty.noMEPItems',                            'لا توجد بنود كهروميكانيكية',          'No MEP items'],
  ['projectQuantities.empty.noStructuralItems',                     'لا توجد بنود إنشائية',                'No structural items'],
  ['projectQuantities.empty.title',                                 'لا توجد كميات',                       'No quantities yet'],
  ['projectQuantities.linkDialog.buildingArea',                     'مساحة البناء',                       'Building area'],
  ['projectQuantities.linkDialog.emptyState.description',           'لا توجد دراسات متاحة للربط بهذا المشروع', 'No studies available to link to this project'],
  ['projectQuantities.linkDialog.emptyState.title',                 'لا توجد دراسات',                      'No studies'],
  ['projectQuantities.linkDialog.items',                            'بنود',                               'items'],
  ['projectQuantities.linkDialog.linkButton',                       'ربط الدراسة',                        'Link study'],
  ['projectQuantities.linkDialog.searchPlaceholder',                'ابحث في الدراسات...',                 'Search studies...'],
  ['projectQuantities.linkDialog.sqm',                              'م²',                                 'm²'],
  ['projectQuantities.linkDialog.toast.linkError',                  'تعذّر ربط الدراسة',                   'Failed to link study'],
  ['projectQuantities.linkDialog.toast.studyLinked',                'تم ربط الدراسة بنجاح',                'Study linked successfully'],
  ['projectQuantities.materials.empty',                             'لا توجد مواد',                        'No materials'],
  ['projectQuantities.materials.groupBy.category',                  'حسب الفئة',                          'By category'],
  ['projectQuantities.materials.groupBy.phase',                     'حسب المرحلة',                        'By phase'],
  ['projectQuantities.materials.groupBy.study',                     'حسب الدراسة',                        'By study'],
  ['projectQuantities.materials.summary.grandTotal',                'الإجمالي الكلي',                      'Grand total'],
  ['projectQuantities.materials.summary.itemCount',                 'عدد البنود',                          'Item count'],
  ['projectQuantities.materials.table.description',                 'الوصف',                              'Description'],
  ['projectQuantities.materials.table.quantity',                    'الكمية',                             'Quantity'],
  ['projectQuantities.materials.table.section',                     'القسم',                              'Section'],
  ['projectQuantities.materials.table.totalCost',                   'إجمالي التكلفة',                      'Total cost'],
  ['projectQuantities.materials.table.unit',                        'الوحدة',                             'Unit'],
  ['projectQuantities.materials.table.unitPrice',                   'سعر الوحدة',                         'Unit price'],
  ['projectQuantities.studies.actions.open',                        'فتح',                                'Open'],
  ['projectQuantities.studies.actions.unlink',                      'فك الربط',                           'Unlink'],
  ['projectQuantities.studies.itemCount',                           'عدد البنود',                          'Item count'],
  ['projectQuantities.studies.name',                                'اسم الدراسة',                         'Study name'],
  ['projectQuantities.studies.title',                               'الدراسات المرتبطة',                   'Linked studies'],
  ['projectQuantities.studies.total',                               'الإجمالي',                            'Total'],
  ['projectQuantities.summary.finishing',                           'التشطيبات',                          'Finishing'],
  ['projectQuantities.summary.grandTotal',                          'الإجمالي الكلي',                      'Grand total'],
  ['projectQuantities.summary.labor',                               'العمالة',                            'Labor'],
  ['projectQuantities.summary.mep',                                 'الكهروميكانيكية',                    'MEP'],
  ['projectQuantities.summary.structural',                          'الإنشائية',                          'Structural'],
  ['projectQuantities.table.grandTotal',                            'الإجمالي الكلي',                      'Grand total'],
  ['projectQuantities.table.subCategory',                           'الفئة الفرعية',                      'Sub-category'],
  ['projectQuantities.table.totalCost',                             'إجمالي التكلفة',                      'Total cost'],
  ['projectQuantities.toast.phaseAssignError',                      'تعذّر تعيين البند للمرحلة',           'Failed to assign item to phase'],

  // structural.flatSlab.* (entirely new — used by FlatSlabFields.tsx)
  ['structural.flatSlab.actualCalculation',         'الحساب الفعلي',                                          'Actual calculation'],
  ['structural.flatSlab.dropPanelRecommendation',   'يُنصح بإضافة لوحات سقوط (Drop Panels) عند الأعمدة لتقليل الإجهادات', 'Drop panels at columns are recommended to reduce stresses'],
  ['structural.flatSlab.estimatedCalculation',      'الحساب التقديري',                                        'Estimated calculation'],
  ['structural.flatSlab.minThicknessWarning',       'السماكة المدخلة ({entered} سم) أقل من الحد الأدنى الموصى به ({recommended} سم) وفق SBC 304', 'Entered thickness ({entered} cm) is below SBC 304 recommended minimum ({recommended} cm)'],
  ['structural.flatSlab.noTopMeshWarning',          'يُنصح بإضافة شبكة حديد علوية لمقاومة العزوم السالبة عند الأعمدة', 'Top mesh recommended to resist negative moments at columns'],

  // ownerPortal.payments.paidAmount/period/status added above

  // zatca.*
  ['zatca.badge',       'فوترة إلكترونية',     'E-invoicing'],
  ['zatca.description', 'فاتورة متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك', 'Invoice compliant with ZATCA requirements'],
];

let added = 0;
let skipped = 0;
const arErrors = [];
const enErrors = [];

for (const [path, arVal, enVal] of additions) {
  try {
    const before = JSON.stringify(getValue(ar, path));
    setPath(ar, path, arVal);
    const after = JSON.stringify(getValue(ar, path));
    if (before !== after) added++; else skipped++;
  } catch (e) {
    arErrors.push({ path, error: e.message });
  }
  try {
    setPath(en, path, enVal);
  } catch (e) {
    enErrors.push({ path, error: e.message });
  }
}

function getValue(obj, path) {
  return path.split('.').reduce((cur, k) => (cur == null ? undefined : cur[k]), obj);
}

console.log(`Added: ${added}, already-present skipped: ${skipped}`);
if (arErrors.length) { console.log('AR errors:'); console.log(JSON.stringify(arErrors, null, 2)); }
if (enErrors.length) { console.log('EN errors:'); console.log(JSON.stringify(enErrors, null, 2)); }

// Write back with CRLF preserved
function writeJson(filePath, data) {
  const text = JSON.stringify(data, null, 2).replace(/\n/g, '\r\n') + '\r\n';
  fs.writeFileSync(filePath, text, 'utf8');
}
writeJson(AR_PATH, ar);
writeJson(EN_PATH, en);
console.log('✅ wrote ar.json and en.json');
