# ترقية مساعد مسار الذكي — النظام المعرفي الشامل + حقن سياق الصفحة

## الهدف
ترقية مساعد مسار الذكي ليصبح "واعياً" بكل أقسام المنصة — القديمة والجديدة — وقادراً على "رؤية" ما يراه المستخدم في الصفحة الحالية. النتيجة: مساعد يفهم السياق الكامل ويقدر يجاوب بدقة على أي سؤال متعلق بأي قسم.

## المشكلة الحالية
المساعد يعرف 9 وحدات معرفية فقط (projects, finance, execution, quantities, company, subcontracts, settings, owner-portal, navigation). أي قسم جديد مثل "العملاء المحتملين" أو أي إضافة مستقبلية — المساعد أعمى عنها تماماً. كذلك المساعد لا يعرف ما يراه المستخدم حالياً في الصفحة.

## الخطة: 5 مراحل

---

## المرحلة 1: بنية Module Registry القابلة للتوسع

### المفهوم
بدلاً من hardcoded modules في system prompt، ننشئ **سجل وحدات (Module Registry)** يقرأ تلقائياً كل الوحدات المعرفية المتاحة. إضافة قسم جديد = إضافة ملف واحد فقط.

### الملفات المطلوبة

#### 1. `packages/ai/modules/registry.ts`
```typescript
/**
 * AI Module Registry
 * كل ملف في مجلد definitions/ يُسجّل تلقائياً كوحدة معرفية
 */

export interface AIModuleDefinition {
  /** معرّف فريد للوحدة — يطابق route segment */
  id: string;
  
  /** الاسم بالعربي */
  nameAr: string;
  
  /** الاسم بالإنجليزي */
  nameEn: string;
  
  /** وصف مختصر لما يفعله القسم */
  description: string;
  
  /** الـ route patterns التي تنتمي لهذا القسم */
  routePatterns: string[];
  
  /** System prompt المخصص لهذا القسم */
  systemPrompt: string;
  
  /** أمثلة أسئلة يمكن للمستخدم طرحها */
  exampleQuestions: string[];
  
  /** أسماء الـ tools المرتبطة بهذا القسم */
  relatedTools: string[];
  
  /** الكيانات (entities) الرئيسية في هذا القسم */
  entities: {
    name: string;
    nameAr: string;
    fields: string[];
  }[];
}

// تصدير كل الوحدات
export { default as projectsModule } from './definitions/projects';
export { default as financeModule } from './definitions/finance';
export { default as executionModule } from './definitions/execution';
export { default as quantitiesModule } from './definitions/quantities';
export { default as companyModule } from './definitions/company';
export { default as subcontractsModule } from './definitions/subcontracts';
export { default as settingsModule } from './definitions/settings';
export { default as ownerPortalModule } from './definitions/owner-portal';
export { default as navigationModule } from './definitions/navigation';
export { default as leadsModule } from './definitions/leads'; // جديد
// ← أضف أي module جديد هنا

import * as allModules from './definitions';

/** جلب كل الوحدات المسجّلة */
export function getAllModules(): AIModuleDefinition[] {
  return Object.values(allModules);
}

/** جلب الوحدة المطابقة لـ route معيّن */
export function getModuleByRoute(pathname: string): AIModuleDefinition | undefined {
  return getAllModules().find(mod =>
    mod.routePatterns.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(pathname);
    })
  );
}

/** جلب الوحدة بالمعرّف */
export function getModuleById(id: string): AIModuleDefinition | undefined {
  return getAllModules().find(mod => mod.id === id);
}
```

#### 2. مجلد `packages/ai/modules/definitions/` — ملف لكل قسم

مثال على الوحدة الجديدة — العملاء المحتملين:

#### `packages/ai/modules/definitions/leads.ts`
```typescript
import type { AIModuleDefinition } from '../registry';

const leadsModule: AIModuleDefinition = {
  id: 'leads',
  nameAr: 'العملاء المحتملين',
  nameEn: 'Leads',
  description: 'إدارة العملاء المحتملين وتتبع فرص المشاريع من أول تواصل حتى التعاقد',
  
  routePatterns: [
    '/[orgSlug]/leads',
    '/[orgSlug]/leads/.*',
  ],
  
  systemPrompt: `
أنت مساعد مسار الذكي — متخصص في قسم العملاء المحتملين.

## ما هو قسم العملاء المحتملين؟
هذا القسم يساعد المقاول على تتبع الفرص التجارية من لحظة التواصل الأولى مع العميل المحتمل حتى التحويل لمشروع فعلي أو الإغلاق.

## المراحل (Pipeline):
- جديد (NEW) — عميل تم إضافته للتو
- تم التواصل (CONTACTED) — تم التواصل الأولي
- مؤهل (QUALIFIED) — تم التأكد من جدية العميل
- عرض سعر (PROPOSAL) — تم إرسال عرض سعر
- تفاوض (NEGOTIATION) — في مرحلة التفاوض
- تم الفوز (WON) — تحوّل لمشروع
- خسارة (LOST) — لم يتحول

## العمليات المتاحة:
- إضافة عميل محتمل جديد (اسم، هاتف، إيميل، مصدر، ملاحظات)
- نقل العميل بين المراحل
- إضافة ملاحظات ومتابعات
- تحويل العميل المحتمل لمشروع فعلي
- تصفية وبحث حسب المرحلة، المصدر، التاريخ

## كيف تساعد المستخدم:
- اشرح كيف يضيف عميل جديد
- ساعده يفهم أي مرحلة مناسبة للعميل
- اقترح متابعات مناسبة
- اشرح كيف يحوّل عميل محتمل لمشروع
- ساعده يفهم إحصائيات العملاء المحتملين
  `.trim(),
  
  exampleQuestions: [
    'كيف أضيف عميل محتمل جديد؟',
    'كم عميل محتمل عندي هالشهر؟',
    'كيف أحوّل عميل محتمل لمشروع؟',
    'وش المرحلة المناسبة لعميل أرسلت له عرض سعر؟',
    'أبي أشوف العملاء اللي ما تواصلت معاهم من أسبوع',
  ],
  
  relatedTools: ['queryLeads', 'getLeadsSummary', 'getLeadsPipeline'],
  
  entities: [
    {
      name: 'Lead',
      nameAr: 'عميل محتمل',
      fields: ['name', 'phone', 'email', 'source', 'stage', 'notes', 'expectedValue', 'assignedTo'],
    },
    {
      name: 'LeadActivity',
      nameAr: 'نشاط/متابعة',
      fields: ['type', 'notes', 'date', 'nextFollowUp'],
    },
  ],
};

export default leadsModule;
```

### تعليمات التنفيذ — المرحلة 1:
1. أنشئ مجلد `packages/ai/modules/definitions/`
2. انقل كل system prompt موجود من `packages/ai/prompts/` إلى ملف definition مستقل بنفس البنية أعلاه
3. أنشئ `registry.ts` مع الدوال المذكورة
4. تأكد أن كل الـ 9 وحدات القديمة + الوحدة الجديدة (leads) مسجّلة
5. أضف barrel export في `packages/ai/modules/definitions/index.ts`

### معايير النجاح — المرحلة 1:
- `getAllModules()` يرجع 10 وحدات (9 قديمة + leads)
- `getModuleByRoute('/org-slug/leads')` يرجع وحدة العملاء المحتملين
- `getModuleByRoute('/org-slug/projects/123/finance')` يرجع وحدة المالية
- لا يوجد أي system prompt مكتوب مباشرة في كود الـ API endpoint

---

## المرحلة 2: أدوات AI جديدة وقابلة للتسجيل

### المفهوم
بدلاً من tools ثابتة في ملف واحد، ننشئ نظام أدوات modular — كل module يسجّل أدواته الخاصة.

### الملفات المطلوبة

#### 1. `packages/ai/tools/registry.ts`
```typescript
import { tool } from 'ai';
import { z } from 'zod';

export interface AIToolRegistration {
  /** اسم الأداة */
  name: string;
  /** وصف بالعربي لماذا تُستخدم */
  description: string;
  /** الـ module المرتبط */
  moduleId: string;
  /** Zod schema للمدخلات */
  parameters: z.ZodType<any>;
  /** الدالة المنفّذة */
  execute: (params: any, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
  organizationId: string;
  userId: string;
  projectId?: string;
  locale: string;
}

// سجل الأدوات
const toolRegistry: Map<string, AIToolRegistration> = new Map();

export function registerTool(registration: AIToolRegistration) {
  toolRegistry.set(registration.name, registration);
}

export function getToolsForModule(moduleId: string): AIToolRegistration[] {
  return Array.from(toolRegistry.values()).filter(t => t.moduleId === moduleId);
}

export function getAllTools(): AIToolRegistration[] {
  return Array.from(toolRegistry.values());
}

/** تحويل الأدوات المسجّلة لصيغة Vercel AI SDK */
export function getAISDKTools(context: ToolContext, moduleId?: string) {
  const registrations = moduleId ? getToolsForModule(moduleId) : getAllTools();
  
  const tools: Record<string, any> = {};
  for (const reg of registrations) {
    tools[reg.name] = tool({
      description: reg.description,
      parameters: reg.parameters,
      execute: async (params) => reg.execute(params, context),
    });
  }
  return tools;
}
```

#### 2. `packages/ai/tools/modules/leads-tools.ts` — مثال أدوات العملاء المحتملين
```typescript
import { z } from 'zod';
import { registerTool } from '../registry';
import { prisma } from '@masar/database';

registerTool({
  name: 'queryLeads',
  description: 'البحث في العملاء المحتملين وعرض قائمتهم مع إمكانية التصفية حسب المرحلة أو المصدر أو التاريخ',
  moduleId: 'leads',
  parameters: z.object({
    stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
    search: z.string().optional(),
    limit: z.number().default(10),
  }),
  execute: async (params, context) => {
    const leads = await prisma.lead.findMany({
      where: {
        organizationId: context.organizationId,
        ...(params.stage && { stage: params.stage }),
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
            { phone: { contains: params.search } },
          ],
        }),
      },
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        stage: true,
        source: true,
        expectedValue: true,
        createdAt: true,
        _count: { select: { activities: true } },
      },
    });
    return { leads, total: leads.length };
  },
});

registerTool({
  name: 'getLeadsSummary',
  description: 'إحصائيات العملاء المحتملين — عدد كل مرحلة، القيمة المتوقعة الإجمالية، معدل التحويل',
  moduleId: 'leads',
  parameters: z.object({}),
  execute: async (_params, context) => {
    const [stageCounts, totalValue, wonCount, totalCount] = await Promise.all([
      prisma.lead.groupBy({
        by: ['stage'],
        where: { organizationId: context.organizationId },
        _count: { id: true },
      }),
      prisma.lead.aggregate({
        where: { organizationId: context.organizationId, stage: { not: 'LOST' } },
        _sum: { expectedValue: true },
      }),
      prisma.lead.count({
        where: { organizationId: context.organizationId, stage: 'WON' },
      }),
      prisma.lead.count({
        where: { organizationId: context.organizationId },
      }),
    ]);
    
    return {
      byStage: stageCounts.reduce((acc, s) => ({ ...acc, [s.stage]: s._count.id }), {}),
      totalExpectedValue: totalValue._sum.expectedValue?.toString() ?? '0',
      conversionRate: totalCount > 0 ? ((wonCount / totalCount) * 100).toFixed(1) + '%' : '0%',
      totalLeads: totalCount,
    };
  },
});

registerTool({
  name: 'getLeadsPipeline',
  description: 'عرض Pipeline العملاء المحتملين — توزيع العملاء على المراحل مع القيم المتوقعة لكل مرحلة',
  moduleId: 'leads',
  parameters: z.object({}),
  execute: async (_params, context) => {
    const pipeline = await prisma.lead.groupBy({
      by: ['stage'],
      where: { organizationId: context.organizationId },
      _count: { id: true },
      _sum: { expectedValue: true },
    });
    
    const stageOrder = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    return {
      stages: stageOrder.map(stage => {
        const found = pipeline.find(p => p.stage === stage);
        return {
          stage,
          count: found?._count.id ?? 0,
          totalValue: found?._sum.expectedValue?.toString() ?? '0',
        };
      }),
    };
  },
});
```

#### 3. `packages/ai/tools/modules/quantities-tools.ts` — أدوات دراسات الكميات والمواد والأسعار
```typescript
import { z } from 'zod';
import { registerTool } from '../registry';
import { prisma } from '@masar/database';

// ──────────────────────────────────────────
// 1. قائمة دراسات التكلفة
// ──────────────────────────────────────────
registerTool({
  name: 'queryCostStudies',
  description: 'عرض قائمة دراسات التكلفة/الكميات في المنظمة أو لمشروع محدد — مع الموقع والمساحة وإجمالي التكلفة',
  moduleId: 'quantities',
  parameters: z.object({
    projectId: z.string().optional().describe('معرّف المشروع — لو تبي دراسات مشروع معيّن'),
    search: z.string().optional().describe('بحث بالاسم أو الموقع'),
    limit: z.number().default(10),
  }),
  execute: async (params, context) => {
    const studies = await prisma.costStudy.findMany({
      where: {
        organizationId: context.organizationId,
        ...(params.projectId && { projectId: params.projectId }),
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { location: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
      },
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        location: true,
        floors: true,
        area: true,
        overheadPercent: true,
        profitPercent: true,
        vatPercent: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
        _count: {
          select: {
            structuralItems: true,
            finishingItems: true,
            mepItems: true,
            laborItems: true,
            quotes: true,
          },
        },
      },
    });
    return { studies, total: studies.length };
  },
});

// ──────────────────────────────────────────
// 2. تفاصيل دراسة تكلفة واحدة مع كل البنود
// ──────────────────────────────────────────
registerTool({
  name: 'getCostStudyDetails',
  description: 'تفاصيل دراسة تكلفة كاملة — بنود إنشائية وتشطيبات و MEP وعمالة مع الكميات والأسعار. استخدمها لما المستخدم يسأل "كم طن حديد" أو "كم تكلفة البلاط" أو أي سؤال عن مواد وكميات',
  moduleId: 'quantities',
  parameters: z.object({
    studyId: z.string().describe('معرّف دراسة التكلفة'),
  }),
  execute: async (params, context) => {
    const study = await prisma.costStudy.findFirst({
      where: {
        id: params.studyId,
        organizationId: context.organizationId,
      },
      include: {
        project: { select: { id: true, name: true } },
        structuralItems: {
          select: {
            id: true, category: true, description: true,
            unit: true, quantity: true, unitPrice: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        finishingItems: {
          select: {
            id: true, room: true, item: true,
            area: true, unitPrice: true, specData: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        mepItems: {
          select: {
            id: true, system: true, description: true,
            quantity: true, unitPrice: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        laborItems: {
          select: {
            id: true, title: true, quantity: true,
            dailyRate: true, duration: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        quotes: {
          select: {
            id: true, name: true, markupPercent: true, notes: true,
          },
        },
      },
    });

    if (!study) return { error: 'دراسة التكلفة غير موجودة' };

    // حساب الإجماليات
    const structuralTotal = study.structuralItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0
    );
    const finishingTotal = study.finishingItems.reduce(
      (sum, item) => sum + Number(item.area) * Number(item.unitPrice), 0
    );
    const mepTotal = study.mepItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0
    );
    const laborTotal = study.laborItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.dailyRate) * Number(item.duration), 0
    );
    const subtotal = structuralTotal + finishingTotal + mepTotal + laborTotal;
    const overhead = subtotal * Number(study.overheadPercent) / 100;
    const profit = (subtotal + overhead) * Number(study.profitPercent) / 100;
    const beforeVat = subtotal + overhead + profit;
    const vat = beforeVat * Number(study.vatPercent) / 100;

    return {
      study: {
        name: study.name,
        location: study.location,
        floors: study.floors,
        area: study.area?.toString(),
        project: study.project,
        overheadPercent: study.overheadPercent?.toString(),
        profitPercent: study.profitPercent?.toString(),
        vatPercent: study.vatPercent?.toString(),
      },
      structuralItems: study.structuralItems.map(i => ({
        ...i,
        quantity: i.quantity?.toString(),
        unitPrice: i.unitPrice?.toString(),
        total: (Number(i.quantity) * Number(i.unitPrice)).toFixed(2),
      })),
      finishingItems: study.finishingItems.map(i => ({
        ...i,
        area: i.area?.toString(),
        unitPrice: i.unitPrice?.toString(),
        total: (Number(i.area) * Number(i.unitPrice)).toFixed(2),
      })),
      mepItems: study.mepItems.map(i => ({
        ...i,
        quantity: i.quantity?.toString(),
        unitPrice: i.unitPrice?.toString(),
        total: (Number(i.quantity) * Number(i.unitPrice)).toFixed(2),
      })),
      laborItems: study.laborItems.map(i => ({
        ...i,
        quantity: i.quantity?.toString(),
        dailyRate: i.dailyRate?.toString(),
        duration: i.duration?.toString(),
        total: (Number(i.quantity) * Number(i.dailyRate) * Number(i.duration)).toFixed(2),
      })),
      quotes: study.quotes,
      totals: {
        structural: structuralTotal.toFixed(2),
        finishing: finishingTotal.toFixed(2),
        mep: mepTotal.toFixed(2),
        labor: laborTotal.toFixed(2),
        subtotal: subtotal.toFixed(2),
        overhead: overhead.toFixed(2),
        profit: profit.toFixed(2),
        beforeVat: beforeVat.toFixed(2),
        vat: vat.toFixed(2),
        grandTotal: (beforeVat + vat).toFixed(2),
      },
    };
  },
});

// ──────────────────────────────────────────
// 3. البحث في المواد والكميات عبر كل الدراسات
// ──────────────────────────────────────────
registerTool({
  name: 'searchMaterials',
  description: 'البحث في المواد والبنود عبر كل دراسات الكميات — مثلاً "حديد" أو "بلاط" أو "كهرباء". يبحث في البنود الإنشائية والتشطيبات والـ MEP',
  moduleId: 'quantities',
  parameters: z.object({
    search: z.string().describe('اسم المادة أو البند — مثل: حديد، خرسانة، بلاط، سباكة'),
    projectId: z.string().optional().describe('تقييد البحث بمشروع محدد'),
    section: z.enum(['structural', 'finishing', 'mep', 'labor', 'all']).default('all').describe('القسم المطلوب'),
  }),
  execute: async (params, context) => {
    const orgFilter = { costStudy: { organizationId: context.organizationId } };
    const projectFilter = params.projectId
      ? { costStudy: { ...orgFilter.costStudy, projectId: params.projectId } }
      : orgFilter;

    const results: any = {};

    if (params.section === 'all' || params.section === 'structural') {
      results.structural = await prisma.structuralItem.findMany({
        where: {
          ...projectFilter,
          OR: [
            { description: { contains: params.search, mode: 'insensitive' } },
            { category: { contains: params.search, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, category: true, description: true,
          unit: true, quantity: true, unitPrice: true,
          costStudy: { select: { name: true, project: { select: { name: true } } } },
        },
        take: 20,
      });
    }

    if (params.section === 'all' || params.section === 'finishing') {
      results.finishing = await prisma.finishingItem.findMany({
        where: {
          ...projectFilter,
          OR: [
            { item: { contains: params.search, mode: 'insensitive' } },
            { room: { contains: params.search, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, room: true, item: true,
          area: true, unitPrice: true,
          costStudy: { select: { name: true, project: { select: { name: true } } } },
        },
        take: 20,
      });
    }

    if (params.section === 'all' || params.section === 'mep') {
      results.mep = await prisma.mEPItem.findMany({
        where: {
          ...projectFilter,
          OR: [
            { description: { contains: params.search, mode: 'insensitive' } },
            { system: { contains: params.search, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, system: true, description: true,
          quantity: true, unitPrice: true,
          costStudy: { select: { name: true, project: { select: { name: true } } } },
        },
        take: 20,
      });
    }

    if (params.section === 'all' || params.section === 'labor') {
      results.labor = await prisma.laborItem.findMany({
        where: {
          ...projectFilter,
          title: { contains: params.search, mode: 'insensitive' },
        },
        select: {
          id: true, title: true, quantity: true,
          dailyRate: true, duration: true,
          costStudy: { select: { name: true, project: { select: { name: true } } } },
        },
        take: 20,
      });
    }

    // حساب إجمالي الكميات لكل مادة
    const totalQuantity = [
      ...(results.structural?.map((i: any) => Number(i.quantity)) ?? []),
      ...(results.mep?.map((i: any) => Number(i.quantity)) ?? []),
      ...(results.labor?.map((i: any) => Number(i.quantity)) ?? []),
    ].reduce((sum, q) => sum + q, 0);

    return {
      searchTerm: params.search,
      results,
      summary: {
        structuralCount: results.structural?.length ?? 0,
        finishingCount: results.finishing?.length ?? 0,
        mepCount: results.mep?.length ?? 0,
        laborCount: results.labor?.length ?? 0,
        totalQuantityFound: totalQuantity,
      },
    };
  },
});
```

#### 4. `packages/ai/tools/modules/projects-tools.ts` — أدوات المشاريع (تفاصيل + مراحل + تأخير)
```typescript
import { z } from 'zod';
import { registerTool } from '../registry';
import { prisma } from '@masar/database';

// ──────────────────────────────────────────
// 1. قائمة المشاريع مع حالتها
// ──────────────────────────────────────────
registerTool({
  name: 'queryProjects',
  description: 'عرض قائمة المشاريع مع الحالة ونسبة التقدم وقيمة العقد — يجيب على أسئلة مثل "كم مشروع عندي" أو "وش المشاريع النشطة"',
  moduleId: 'projects',
  parameters: z.object({
    status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'DRAFT']).optional(),
    search: z.string().optional().describe('بحث بالاسم أو الموقع'),
    limit: z.number().default(10),
  }),
  execute: async (params, context) => {
    const projects = await prisma.project.findMany({
      where: {
        organizationId: context.organizationId,
        ...(params.status && { status: params.status }),
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { location: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
      },
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        location: true,
        contractValue: true,
        progress: true,
        startDate: true,
        expectedEndDate: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            expenses: true,
            claims: true,
            activities: true,
          },
        },
      },
    });
    return {
      projects: projects.map(p => ({
        ...p,
        contractValue: p.contractValue?.toString(),
        progress: p.progress?.toString(),
      })),
      total: projects.length,
    };
  },
});

// ──────────────────────────────────────────
// 2. تفاصيل مشروع واحد شاملة
// ──────────────────────────────────────────
registerTool({
  name: 'getProjectDetails',
  description: 'تفاصيل مشروع كاملة — العقد، الفريق، التقدم، المالية، المشاكل الميدانية. استخدمها لما المستخدم يسأل عن مشروع محدد',
  moduleId: 'projects',
  parameters: z.object({
    projectId: z.string().describe('معرّف المشروع'),
  }),
  execute: async (params, context) => {
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        organizationId: context.organizationId,
      },
      include: {
        contract: {
          select: {
            contractNo: true, value: true, startDate: true,
            endDate: true, retentionPercent: true, vatPercent: true, status: true,
          },
        },
        members: {
          select: {
            role: true,
            user: { select: { name: true, email: true } },
          },
        },
        _count: {
          select: {
            expenses: true,
            claims: true,
            documents: true,
            activities: true,
            milestones: true,
            issues: true,
            photos: true,
            dailyReports: true,
            subcontracts: true,
          },
        },
      },
    });

    if (!project) return { error: 'المشروع غير موجود' };

    // جلب آخر تحديث تقدم
    const latestProgress = await prisma.projectProgressUpdate.findFirst({
      where: { projectId: params.projectId },
      orderBy: { createdAt: 'desc' },
      select: { progress: true, summary: true, createdAt: true },
    });

    // جلب المشاكل المفتوحة
    const openIssues = await prisma.projectIssue.findMany({
      where: {
        projectId: params.projectId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      select: { title: true, severity: true, status: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      project: {
        name: project.name,
        type: project.type,
        status: project.status,
        location: project.location,
        progress: project.progress?.toString() + '%',
        contractValue: project.contractValue?.toString(),
        startDate: project.startDate,
        expectedEndDate: project.expectedEndDate,
      },
      contract: project.contract ? {
        ...project.contract,
        value: project.contract.value?.toString(),
        retentionPercent: project.contract.retentionPercent?.toString(),
      } : null,
      team: project.members.map(m => ({
        name: m.user.name,
        role: m.role,
      })),
      counts: project._count,
      latestProgress: latestProgress ? {
        progress: latestProgress.progress?.toString() + '%',
        summary: latestProgress.summary,
        date: latestProgress.createdAt,
      } : null,
      openIssues,
    };
  },
});

// ──────────────────────────────────────────
// 3. ملخص مالي للمشروع
// ──────────────────────────────────────────
registerTool({
  name: 'getProjectFinanceSummary',
  description: 'ملخص مالي لمشروع — إجمالي المصروفات، المطالبات، المدفوعات، عقود الباطن. يجيب على "كم صرفنا على المشروع" أو "كم ربحنا"',
  moduleId: 'projects',
  parameters: z.object({
    projectId: z.string().describe('معرّف المشروع'),
  }),
  execute: async (params, context) => {
    const [expenses, claims, payments, contract] = await Promise.all([
      prisma.projectExpense.aggregate({
        where: { projectId: params.projectId, project: { organizationId: context.organizationId } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.projectClaim.aggregate({
        where: { projectId: params.projectId, project: { organizationId: context.organizationId } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.projectPayment.aggregate({
        where: { projectId: params.projectId, project: { organizationId: context.organizationId } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.projectContract.findFirst({
        where: { projectId: params.projectId, project: { organizationId: context.organizationId } },
        select: { value: true },
      }),
    ]);

    const contractValue = Number(contract?.value ?? 0);
    const totalExpenses = Number(expenses._sum.amount ?? 0);
    const totalClaims = Number(claims._sum.amount ?? 0);
    const totalPayments = Number(payments._sum.amount ?? 0);

    return {
      contractValue: contractValue.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      totalClaims: totalClaims.toFixed(2),
      totalPayments: totalPayments.toFixed(2),
      profit: (totalPayments - totalExpenses).toFixed(2),
      profitMargin: contractValue > 0
        ? (((totalPayments - totalExpenses) / contractValue) * 100).toFixed(1) + '%'
        : 'N/A',
      expensesCount: expenses._count.id,
      claimsCount: claims._count.id,
      paymentsCount: payments._count.id,
    };
  },
});
```

#### 5. `packages/ai/tools/modules/execution-tools.ts` — أدوات التنفيذ والجدول الزمني
```typescript
import { z } from 'zod';
import { registerTool } from '../registry';
import { prisma } from '@masar/database';

// ──────────────────────────────────────────
// 1. أنشطة المشروع ونسب التقدم
// ──────────────────────────────────────────
registerTool({
  name: 'getProjectActivities',
  description: 'أنشطة المشروع التنفيذية مع نسب التقدم والمدة — يجيب على "في أي مرحلة المشروع" أو "وش الأنشطة المتأخرة"',
  moduleId: 'execution',
  parameters: z.object({
    projectId: z.string().describe('معرّف المشروع'),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'ON_HOLD', 'CANCELLED']).optional(),
    onlyCritical: z.boolean().default(false).describe('عرض أنشطة المسار الحرج فقط'),
  }),
  execute: async (params, context) => {
    const activities = await prisma.projectActivity.findMany({
      where: {
        projectId: params.projectId,
        project: { organizationId: context.organizationId },
        ...(params.status && { status: params.status }),
        ...(params.onlyCritical && { isCritical: true }),
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        actualStartDate: true,
        actualEndDate: true,
        duration: true,
        isCritical: true,
        _count: { select: { checklists: true, dependencies: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    // حساب الأنشطة المتأخرة
    const now = new Date();
    const delayed = activities.filter(a =>
      a.status !== 'COMPLETED' && a.status !== 'CANCELLED' &&
      a.endDate && new Date(a.endDate) < now
    );

    const completed = activities.filter(a => a.status === 'COMPLETED');
    const inProgress = activities.filter(a => a.status === 'IN_PROGRESS');
    const overallProgress = activities.length > 0
      ? (activities.reduce((sum, a) => sum + Number(a.progress ?? 0), 0) / activities.length).toFixed(1)
      : '0';

    return {
      activities: activities.map(a => ({
        ...a,
        progress: a.progress?.toString() + '%',
        isDelayed: delayed.some(d => d.id === a.id),
      })),
      summary: {
        total: activities.length,
        completed: completed.length,
        inProgress: inProgress.length,
        delayed: delayed.length,
        notStarted: activities.filter(a => a.status === 'NOT_STARTED').length,
        overallProgress: overallProgress + '%',
        criticalCount: activities.filter(a => a.isCritical).length,
      },
    };
  },
});

// ──────────────────────────────────────────
// 2. معالم المشروع (Milestones)
// ──────────────────────────────────────────
registerTool({
  name: 'getProjectMilestones',
  description: 'معالم المشروع الزمنية — المخطط مقابل الفعلي، التأخيرات. يجيب على "هل المشروع متأخر" أو "متى موعد التسليم"',
  moduleId: 'execution',
  parameters: z.object({
    projectId: z.string().describe('معرّف المشروع'),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED']).optional(),
  }),
  execute: async (params, context) => {
    const milestones = await prisma.projectMilestone.findMany({
      where: {
        projectId: params.projectId,
        project: { organizationId: context.organizationId },
        ...(params.status && { status: params.status }),
      },
      select: {
        id: true,
        title: true,
        status: true,
        plannedDate: true,
        actualDate: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    });

    const now = new Date();
    return {
      milestones: milestones.map(m => {
        const planned = m.plannedDate ? new Date(m.plannedDate) : null;
        const actual = m.actualDate ? new Date(m.actualDate) : null;
        let delayDays = 0;

        if (planned && actual) {
          delayDays = Math.ceil((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
        } else if (planned && !actual && m.status !== 'COMPLETED' && planned < now) {
          delayDays = Math.ceil((now.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          ...m,
          delayDays,
          isDelayed: delayDays > 0,
        };
      }),
      summary: {
        total: milestones.length,
        completed: milestones.filter(m => m.status === 'COMPLETED').length,
        delayed: milestones.filter(m => m.status === 'DELAYED').length,
        upcoming: milestones.filter(m =>
          m.status === 'PLANNED' && m.plannedDate && new Date(m.plannedDate) > now
        ).length,
      },
    };
  },
});

// ──────────────────────────────────────────
// 3. تحليل التأخير
// ──────────────────────────────────────────
registerTool({
  name: 'getDelayAnalysis',
  description: 'تحليل تأخيرات المشروع — الأنشطة المتأخرة، أيام التأخير، التأثير على المسار الحرج. يجيب على "هل يوجد تأخير" أو "كم يوم متأخرين"',
  moduleId: 'execution',
  parameters: z.object({
    projectId: z.string().describe('معرّف المشروع'),
  }),
  execute: async (params, context) => {
    const now = new Date();

    // الأنشطة المتأخرة
    const delayedActivities = await prisma.projectActivity.findMany({
      where: {
        projectId: params.projectId,
        project: { organizationId: context.organizationId },
        status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'DELAYED'] },
        endDate: { lt: now },
      },
      select: {
        name: true, status: true, progress: true,
        startDate: true, endDate: true, isCritical: true,
      },
      orderBy: { endDate: 'asc' },
    });

    // المشاكل الميدانية المفتوحة
    const openIssues = await prisma.projectIssue.findMany({
      where: {
        projectId: params.projectId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      select: { title: true, severity: true, status: true, createdAt: true },
      orderBy: { severity: 'desc' },
      take: 10,
    });

    // صحة الجدول الزمني
    const allActivities = await prisma.projectActivity.count({
      where: { projectId: params.projectId },
    });
    const completedActivities = await prisma.projectActivity.count({
      where: { projectId: params.projectId, status: 'COMPLETED' },
    });

    const maxDelay = delayedActivities.reduce((max, a) => {
      const days = a.endDate
        ? Math.ceil((now.getTime() - new Date(a.endDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return Math.max(max, days);
    }, 0);

    return {
      delayedActivities: delayedActivities.map(a => ({
        ...a,
        progress: a.progress?.toString() + '%',
        delayDays: a.endDate
          ? Math.ceil((now.getTime() - new Date(a.endDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      })),
      openIssues,
      summary: {
        totalActivities: allActivities,
        completedActivities,
        delayedCount: delayedActivities.length,
        criticalDelayed: delayedActivities.filter(a => a.isCritical).length,
        maxDelayDays: maxDelay,
        openIssuesCount: openIssues.length,
        criticalIssues: openIssues.filter(i => i.severity === 'CRITICAL').length,
        healthStatus: delayedActivities.filter(a => a.isCritical).length > 0
          ? 'AT_RISK'
          : delayedActivities.length > 0
            ? 'WARNING'
            : 'ON_TRACK',
      },
    };
  },
});
```

#### 6. `packages/ai/tools/modules/quotations-tools.ts` — أدوات عروض الأسعار
```typescript
import { z } from 'zod';
import { registerTool } from '../registry';
import { prisma } from '@masar/database';

// ──────────────────────────────────────────
// 1. قائمة عروض الأسعار
// ──────────────────────────────────────────
registerTool({
  name: 'queryQuotations',
  description: 'البحث في عروض الأسعار — بالعميل أو الحالة أو الرقم. يجيب على "هل يوجد عرض سعر لشركة x" أو "كم عرض سعر أرسلنا هالشهر"',
  moduleId: 'finance',
  parameters: z.object({
    search: z.string().optional().describe('بحث باسم العميل أو رقم العرض'),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
    clientId: z.string().optional(),
    limit: z.number().default(10),
  }),
  execute: async (params, context) => {
    const quotations = await prisma.quotation.findMany({
      where: {
        organizationId: context.organizationId,
        ...(params.status && { status: params.status }),
        ...(params.clientId && { clientId: params.clientId }),
        ...(params.search && {
          OR: [
            { quotationNo: { contains: params.search, mode: 'insensitive' } },
            { client: { name: { contains: params.search, mode: 'insensitive' } } },
          ],
        }),
      },
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        quotationNo: true,
        status: true,
        validUntil: true,
        subtotal: true,
        vatAmount: true,
        total: true,
        createdAt: true,
        client: { select: { id: true, name: true, type: true } },
        _count: { select: { items: true } },
      },
    });

    return {
      quotations: quotations.map(q => ({
        ...q,
        subtotal: q.subtotal?.toString(),
        vatAmount: q.vatAmount?.toString(),
        total: q.total?.toString(),
      })),
      total: quotations.length,
    };
  },
});

// ──────────────────────────────────────────
// 2. تفاصيل عرض سعر واحد مع البنود
// ──────────────────────────────────────────
registerTool({
  name: 'getQuotationDetails',
  description: 'تفاصيل عرض سعر كاملة مع كل البنود والأسعار والإجمالي — يجيب على "كم إجمالي عرض سعر رقم X" أو "وش بنود العرض"',
  moduleId: 'finance',
  parameters: z.object({
    quotationId: z.string().optional().describe('معرّف عرض السعر'),
    quotationNo: z.string().optional().describe('رقم عرض السعر — مثل QT-0001'),
  }),
  execute: async (params, context) => {
    const quotation = await prisma.quotation.findFirst({
      where: {
        organizationId: context.organizationId,
        ...(params.quotationId && { id: params.quotationId }),
        ...(params.quotationNo && { quotationNo: params.quotationNo }),
      },
      include: {
        client: {
          select: { name: true, type: true, phone: true, email: true },
        },
        items: {
          select: {
            id: true, description: true,
            quantity: true, unitPrice: true, amount: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!quotation) return { error: 'عرض السعر غير موجود' };

    return {
      quotation: {
        quotationNo: quotation.quotationNo,
        status: quotation.status,
        validUntil: quotation.validUntil,
        terms: quotation.terms,
        createdAt: quotation.createdAt,
      },
      client: quotation.client,
      items: quotation.items.map(i => ({
        ...i,
        quantity: i.quantity?.toString(),
        unitPrice: i.unitPrice?.toString(),
        amount: i.amount?.toString(),
      })),
      totals: {
        subtotal: quotation.subtotal?.toString(),
        vatAmount: quotation.vatAmount?.toString(),
        total: quotation.total?.toString(),
        itemsCount: quotation.items.length,
      },
    };
  },
});

// ──────────────────────────────────────────
// 3. ملخص عروض الأسعار
// ──────────────────────────────────────────
registerTool({
  name: 'getQuotationsSummary',
  description: 'إحصائيات عروض الأسعار — عدد كل حالة، إجمالي القيم، معدل القبول',
  moduleId: 'finance',
  parameters: z.object({
    period: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  }),
  execute: async (params, context) => {
    const now = new Date();
    let dateFilter: any = {};

    if (params.period !== 'all') {
      const start = new Date(now);
      if (params.period === 'week') start.setDate(start.getDate() - 7);
      else if (params.period === 'month') start.setMonth(start.getMonth() - 1);
      else if (params.period === 'quarter') start.setMonth(start.getMonth() - 3);
      else if (params.period === 'year') start.setFullYear(start.getFullYear() - 1);
      dateFilter = { createdAt: { gte: start } };
    }

    const [statusCounts, totalValues, acceptedCount, totalCount] = await Promise.all([
      prisma.quotation.groupBy({
        by: ['status'],
        where: { organizationId: context.organizationId, ...dateFilter },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.quotation.aggregate({
        where: { organizationId: context.organizationId, ...dateFilter },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.quotation.count({
        where: { organizationId: context.organizationId, status: 'ACCEPTED', ...dateFilter },
      }),
      prisma.quotation.count({
        where: { organizationId: context.organizationId, ...dateFilter },
      }),
    ]);

    return {
      period: params.period,
      byStatus: statusCounts.reduce((acc, s) => ({
        ...acc,
        [s.status]: { count: s._count.id, total: s._sum.total?.toString() ?? '0' },
      }), {}),
      totalValue: totalValues._sum.total?.toString() ?? '0',
      totalCount,
      acceptanceRate: totalCount > 0
        ? ((acceptedCount / totalCount) * 100).toFixed(1) + '%'
        : '0%',
    };
  },
});
```

#### 7. `packages/ai/tools/modules/index.ts` — تسجيل كل الأدوات
```typescript
// استيراد كل ملفات الأدوات — الاستيراد نفسه يُشغّل registerTool
import './projects-tools';
import './finance-tools';
import './execution-tools';
import './quantities-tools';
import './quotations-tools';  // عروض الأسعار
import './company-tools';
import './subcontracts-tools';
import './leads-tools';
// ← أضف أي tools جديدة هنا
```

### تعليمات التنفيذ — المرحلة 2:
1. أنشئ مجلد `packages/ai/tools/modules/`
2. أنشئ `registry.ts` مع نظام التسجيل
3. انقل كل الأدوات الموجودة من `packages/ai/tools.ts` إلى ملفات modules منفصلة
4. أنشئ أدوات العملاء المحتملين (عدّل الـ Prisma queries حسب الـ schema الفعلي)
5. أنشئ `index.ts` الذي يستورد كل الملفات
6. عدّل `packages/ai/tools.ts` الأصلي ليستخدم `getAISDKTools()` من registry

### معايير النجاح — المرحلة 2:
- `getAllTools()` يرجع كل الأدوات بما فيها الجديدة (leads: 3 + quantities: 3 + projects: 3 + execution: 3 + quotations: 3 = **15 أداة جديدة**)
- `getToolsForModule('leads')` يرجع 3 أدوات
- `getToolsForModule('quantities')` يرجع 3 أدوات (queryCostStudies, getCostStudyDetails, searchMaterials)
- `getToolsForModule('projects')` يرجع 3 أدوات (queryProjects, getProjectDetails, getProjectFinanceSummary)
- `getToolsForModule('execution')` يرجع 3 أدوات (getProjectActivities, getProjectMilestones, getDelayAnalysis)
- `getToolsForModule('finance')` يشمل 3 أدوات عروض أسعار (queryQuotations, getQuotationDetails, getQuotationsSummary)
- المساعد يقدر يجاوب على: "كم طن حديد يحتاج مشروع X؟" ← `searchMaterials` + `getCostStudyDetails`
- المساعد يقدر يجاوب على: "في أي مرحلة مشروع X؟" ← `getProjectActivities` + `getProjectMilestones`
- المساعد يقدر يجاوب على: "هل يوجد عرض سعر لشركة Y؟" ← `queryQuotations`
- المساعد يقدر يجاوب على: "هل المشروع متأخر؟" ← `getDelayAnalysis`
- الأدوات القديمة تعمل بنفس الطريقة (لا regression)

### أمثلة أسئلة يجاوب عليها المساعد بعد هذه المرحلة:

| السؤال | الأداة المستخدمة |
|--------|-----------------|
| "كم طن حديد يحتاج مشروع فيلا الرياض؟" | `searchMaterials(search: "حديد", projectId)` |
| "كم تكلفة البلاط في دراسة التكلفة؟" | `getCostStudyDetails(studyId)` → finishingItems |
| "وش أغلى بند في المشروع؟" | `getCostStudyDetails(studyId)` → sort by total |
| "كم مشروع نشط عندي؟" | `queryProjects(status: "ACTIVE")` |
| "في أي مرحلة مشروع المدارس؟" | `getProjectActivities(projectId)` |
| "هل مشروع X متأخر؟" | `getDelayAnalysis(projectId)` |
| "كم يوم تأخير في المشروع؟" | `getDelayAnalysis(projectId)` → maxDelayDays |
| "هل يوجد عرض سعر لشركة الراجحي؟" | `queryQuotations(search: "الراجحي")` |
| "كم إجمالي عرض سعر QT-0015؟" | `getQuotationDetails(quotationNo: "QT-0015")` |
| "كم عرض سعر تم قبوله هالشهر؟" | `getQuotationsSummary(period: "month")` |
| "ملخص مالي لمشروع الجسر" | `getProjectFinanceSummary(projectId)` |
| "كم صرفنا على مشروع X؟" | `getProjectFinanceSummary(projectId)` → totalExpenses |

---

## المرحلة 3: Page Context Injection — حقن سياق الصفحة

### المفهوم
هذا الأهم. عندما المستخدم يفتح المساعد من أي صفحة، نرسل **snapshot من حالة الصفحة** مع رسالته. المساعد يشوف نفس اللي يشوفه المستخدم.

### البنية

#### 1. `apps/web/modules/saas/ai/hooks/use-page-context.ts`
```typescript
/**
 * Hook يجمع سياق الصفحة الحالية لإرساله مع رسائل AI
 * 
 * كل صفحة تقدر تسجّل سياقها عبر PageContextProvider
 * المساعد يستقبل هذا السياق تلقائياً مع كل رسالة
 */

import { create } from 'zustand';

export interface PageContext {
  /** اسم الصفحة الحالية */
  pageName: string;
  
  /** اسم الصفحة بالعربي */
  pageNameAr: string;
  
  /** معرّف الـ module */
  moduleId: string;
  
  /** الـ route الحالي */
  currentRoute: string;
  
  /** وصف مختصر لما يراه المستخدم */
  pageDescription: string;
  
  /** البيانات الرئيسية المعروضة حالياً */
  visibleData: Record<string, any>;
  
  /** الفلاتر المطبقة حالياً */
  activeFilters: Record<string, any>;
  
  /** عدد العناصر المعروضة */
  itemCount?: number;
  
  /** أي إحصائيات مرئية في الصفحة */
  visibleStats?: Record<string, string | number>;
  
  /** الأعمدة المعروضة في الجدول (إن وجد) */
  tableColumns?: string[];
  
  /** حالة النموذج (إن كان مفتوح) */
  formState?: {
    isOpen: boolean;
    formType: 'create' | 'edit' | 'view';
    entityName: string;
    currentValues?: Record<string, any>;
  };
}

interface PageContextStore {
  context: PageContext | null;
  setContext: (context: PageContext) => void;
  updateContext: (partial: Partial<PageContext>) => void;
  clearContext: () => void;
}

export const usePageContextStore = create<PageContextStore>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
  updateContext: (partial) => set((state) => ({
    context: state.context ? { ...state.context, ...partial } : null,
  })),
  clearContext: () => set({ context: null }),
}));
```

#### 2. `apps/web/modules/saas/ai/components/PageContextProvider.tsx`
```tsx
/**
 * كل صفحة تلف محتواها بهذا الـ Provider لتسجيل سياقها
 * 
 * الاستخدام:
 * <PageContextProvider
 *   moduleId="leads"
 *   pageName="Leads List"
 *   pageNameAr="قائمة العملاء المحتملين"
 *   pageDescription="يعرض جميع العملاء المحتملين مع إمكانية التصفية"
 *   visibleData={{ leads: leadsData, totalCount }}
 *   activeFilters={currentFilters}
 *   visibleStats={{ total: 45, newThisMonth: 12, conversionRate: '23%' }}
 * >
 *   {children}
 * </PageContextProvider>
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePageContextStore, type PageContext } from '../hooks/use-page-context';

interface PageContextProviderProps {
  children: React.ReactNode;
  moduleId: string;
  pageName: string;
  pageNameAr: string;
  pageDescription: string;
  visibleData?: Record<string, any>;
  activeFilters?: Record<string, any>;
  itemCount?: number;
  visibleStats?: Record<string, string | number>;
  tableColumns?: string[];
  formState?: PageContext['formState'];
}

export function PageContextProvider({
  children,
  moduleId,
  pageName,
  pageNameAr,
  pageDescription,
  visibleData = {},
  activeFilters = {},
  itemCount,
  visibleStats,
  tableColumns,
  formState,
}: PageContextProviderProps) {
  const pathname = usePathname();
  const { setContext, clearContext } = usePageContextStore();
  
  useEffect(() => {
    setContext({
      pageName,
      pageNameAr,
      moduleId,
      currentRoute: pathname,
      pageDescription,
      visibleData: sanitizeForAI(visibleData),
      activeFilters,
      itemCount,
      visibleStats,
      tableColumns,
      formState,
    });
    
    return () => clearContext();
  }, [
    pathname,
    pageName,
    moduleId,
    // لا نضع visibleData في deps لأنها object — نستخدم JSON.stringify لو لزم
    JSON.stringify(visibleStats),
    JSON.stringify(activeFilters),
    itemCount,
  ]);
  
  return <>{children}</>;
}

/**
 * تنظيف البيانات قبل إرسالها للـ AI
 * - حذف الحقول الحساسة
 * - تقليص البيانات الكبيرة (أول 5 عناصر + العدد الكلي)
 * - تحويل Decimal لـ string
 */
function sanitizeForAI(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // تخطي الحقول الحساسة
    if (['password', 'token', 'secret', 'apiKey'].some(s => key.toLowerCase().includes(s))) {
      continue;
    }
    
    // تقليص المصفوفات الكبيرة
    if (Array.isArray(value) && value.length > 5) {
      sanitized[key] = {
        _summary: true,
        first5: value.slice(0, 5),
        totalCount: value.length,
      };
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

### تعليمات التنفيذ — المرحلة 3:
1. أنشئ `use-page-context.ts` مع Zustand store
2. أنشئ `PageContextProvider.tsx`
3. أضف `PageContextProvider` في **3 صفحات كمثال أولي**:
   - صفحة قائمة العملاء المحتملين (leads list)
   - صفحة قائمة المشاريع (projects list) — لإثبات أنها تعمل مع الأقسام القديمة
   - صفحة Dashboard الرئيسية
4. لا تضفها على كل الصفحات الآن — فقط الـ 3 كإثبات مفهوم

### معايير النجاح — المرحلة 3:
- عند فتح صفحة العملاء المحتملين، `usePageContextStore().context?.moduleId` = `'leads'`
- عند الانتقال لصفحة المشاريع، السياق يتحدث تلقائياً
- عند مغادرة صفحة مسجّلة لصفحة غير مسجّلة، `context` = `null`

---

## المرحلة 4: ربط كل شيء في API endpoint

### المفهوم
تعديل `apps/web/app/api/ai/assistant/route.ts` ليستخدم Module Registry + Tool Registry + Page Context.

### التعديلات المطلوبة

#### 1. تعديل Frontend — إرسال Page Context مع كل رسالة

في `apps/web/modules/saas/ai/components/AiChat.tsx` (أو المكون المسؤول عن إرسال الرسائل):

```typescript
// عند إرسال رسالة، نضيف page context في body
import { usePageContextStore } from '../hooks/use-page-context';

// داخل المكون:
const pageContext = usePageContextStore((s) => s.context);

// عند إرسال الرسالة عبر useChat أو fetch:
const requestBody = {
  messages,
  // إضافة سياق الصفحة
  pageContext: pageContext ? {
    moduleId: pageContext.moduleId,
    pageName: pageContext.pageNameAr,
    currentRoute: pageContext.currentRoute,
    pageDescription: pageContext.pageDescription,
    visibleStats: pageContext.visibleStats,
    activeFilters: pageContext.activeFilters,
    itemCount: pageContext.itemCount,
    tableColumns: pageContext.tableColumns,
    formState: pageContext.formState,
    // نرسل ملخص البيانات فقط — ليس البيانات الكاملة
    dataSummary: summarizeVisibleData(pageContext.visibleData),
  } : null,
};
```

دالة تلخيص البيانات:
```typescript
function summarizeVisibleData(data: Record<string, any>): string {
  if (!data || Object.keys(data).length === 0) return 'لا توجد بيانات معروضة';
  
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value?._summary) {
      parts.push(`${key}: ${value.totalCount} عنصر (يعرض أول ${value.first5.length})`);
    } else if (Array.isArray(value)) {
      parts.push(`${key}: ${value.length} عنصر`);
    } else if (typeof value === 'object' && value !== null) {
      parts.push(`${key}: ${Object.keys(value).length} حقل`);
    } else {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.join(' | ');
}
```

#### 2. تعديل API Route — بناء System Prompt الديناميكي

```typescript
// في apps/web/app/api/ai/assistant/route.ts

import { getModuleByRoute, getModuleById, getAllModules } from '@masar/ai/modules/registry';
import { getAISDKTools } from '@masar/ai/tools/registry';
import '@masar/ai/tools/modules'; // تسجيل كل الأدوات

export async function POST(req: Request) {
  const { messages, pageContext } = await req.json();
  
  // 1. تحديد الوحدة المعرفية
  const activeModule = pageContext?.moduleId
    ? getModuleById(pageContext.moduleId)
    : null;
  
  // 2. بناء System Prompt
  const systemPrompt = buildSystemPrompt(activeModule, pageContext);
  
  // 3. جمع الأدوات
  const toolContext = { organizationId, userId, projectId, locale };
  
  // أدوات الوحدة الحالية + أدوات مرتبطة + أدوات عامة
  // مهم: نحمّل أدوات أكثر من module واحد لأن المستخدم قد يسأل
  // عن كميات وهو في صفحة المشاريع مثلاً
  const tools = {
    // أدوات القسم الحالي (لو موجود)
    ...(activeModule ? getAISDKTools(toolContext, activeModule.id) : {}),
    // أدوات أساسية دائماً متاحة (المشاريع + المالية + التنفيذ + الكميات)
    ...getAISDKTools(toolContext, 'projects'),
    ...getAISDKTools(toolContext, 'execution'),
    ...getAISDKTools(toolContext, 'quantities'),
    ...getAISDKTools(toolContext, 'finance'),     // يشمل عروض الأسعار
    ...getAISDKTools(toolContext, 'navigation'),   // تنقل
    ...getAISDKTools(toolContext, 'general'),      // أدوات عامة
  };
  
  // 4. استدعاء AI
  const result = await streamText({
    model: claude,
    system: systemPrompt,
    messages,
    tools,
  });
  
  return result.toDataStreamResponse();
}

function buildSystemPrompt(
  activeModule: AIModuleDefinition | null,
  pageContext: any
): string {
  const allModules = getAllModules();
  
  let prompt = `أنت مساعد مسار الذكي — مساعد ذكي لمنصة إدارة المشاريع الإنشائية "مسار".
  
أنت تساعد مقاولين سعوديين في إدارة مشاريعهم. تحدث بالعربية (لهجة سعودية مهنية). كن مختصراً ومفيداً.

## أقسام المنصة المتاحة:
${allModules.map(m => `- **${m.nameAr}** (${m.nameEn}): ${m.description}`).join('\n')}
`;

  // إضافة سياق الوحدة الحالية
  if (activeModule) {
    prompt += `

## القسم الحالي: ${activeModule.nameAr}
${activeModule.systemPrompt}

### أمثلة أسئلة يمكنك مساعدة المستخدم فيها:
${activeModule.exampleQuestions.map(q => `- ${q}`).join('\n')}
`;
  }

  // إضافة سياق الصفحة
  if (pageContext) {
    prompt += `

## ما يراه المستخدم حالياً:
- **الصفحة:** ${pageContext.pageName}
- **الوصف:** ${pageContext.pageDescription}
- **المسار:** ${pageContext.currentRoute}
`;

    if (pageContext.visibleStats && Object.keys(pageContext.visibleStats).length > 0) {
      prompt += `- **إحصائيات معروضة:** ${JSON.stringify(pageContext.visibleStats, null, 0)}\n`;
    }
    
    if (pageContext.activeFilters && Object.keys(pageContext.activeFilters).length > 0) {
      prompt += `- **فلاتر مطبقة:** ${JSON.stringify(pageContext.activeFilters, null, 0)}\n`;
    }
    
    if (pageContext.itemCount !== undefined) {
      prompt += `- **عدد العناصر المعروضة:** ${pageContext.itemCount}\n`;
    }
    
    if (pageContext.dataSummary) {
      prompt += `- **ملخص البيانات:** ${pageContext.dataSummary}\n`;
    }
    
    if (pageContext.formState?.isOpen) {
      prompt += `- **نموذج مفتوح:** ${pageContext.formState.entityName} (${pageContext.formState.formType})\n`;
    }

    prompt += `
استخدم هذا السياق لتقديم إجابات دقيقة ومرتبطة بما يراه المستخدم. إذا سأل "كم عندي" أو "وش هالأرقام" — ارجع للإحصائيات المعروضة.
`;
  }

  return prompt;
}
```

### تعليمات التنفيذ — المرحلة 4:
1. عدّل `AiChat.tsx` (أو المكون المناظر) لقراءة page context وإرساله
2. عدّل API route لاستقبال `pageContext` من body
3. عدّل بناء system prompt ليستخدم Module Registry
4. عدّل جلب الأدوات ليستخدم Tool Registry
5. تأكد أن الـ tools القديمة والجديدة تعمل

### معايير النجاح — المرحلة 4:
- المساعد يعرف إنه في صفحة العملاء المحتملين لما المستخدم يفتحه من هناك
- المساعد يقدر يرد "عندك 45 عميل محتمل" لو الصفحة تعرض هالرقم
- المساعد يقدر يستخدم tool `queryLeads` لجلب بيانات إضافية
- الأدوات القديمة (queryProjects, getFinanceSummary) لا تزال تعمل

---

## المرحلة 5: التحقق وإضافة PageContext على الصفحات الرئيسية

### الملفات المطلوب إضافة PageContextProvider عليها

أضف `PageContextProvider` على هذه الصفحات (الأولوية من الأعلى):

| الأولوية | الصفحة | moduleId | visibleStats مثال |
|----------|--------|----------|-------------------|
| 1 | قائمة العملاء المحتملين | `leads` | `{ total, newThisMonth, won, lost }` |
| 2 | Dashboard الرئيسي | `dashboard` | `{ projectsCount, totalRevenue, ... }` |
| 3 | قائمة المشاريع | `projects` | `{ total, active, completed }` |
| 4 | مالية المشروع | `finance` | `{ invoicesTotal, expensesTotal, profit }` |
| 5 | التنفيذ الميداني | `execution` | `{ activitiesCount, completionRate }` |
| 6 | إدارة الشركة | `company` | `{ employeesCount, totalPayroll }` |
| 7 | دراسات الكميات | `quantities` | `{ studiesCount }` |
| 8 | عقود الباطن | `subcontracts` | `{ contractsCount, totalValue }` |
| 9 | الإعدادات | `settings` | `{}` |

### نمط الإضافة — مثال عملي

```tsx
// مثال: apps/web/app/[locale]/(saas)/[orgSlug]/leads/page.tsx

export default function LeadsPage() {
  const { data: leads } = useLeadsList(filters);
  const { data: stats } = useLeadsStats();
  
  return (
    <PageContextProvider
      moduleId="leads"
      pageName="Leads List"
      pageNameAr="قائمة العملاء المحتملين"
      pageDescription="عرض جميع العملاء المحتملين مع إمكانية التصفية حسب المرحلة والمصدر"
      visibleData={{ leads: leads?.items }}
      activeFilters={filters}
      itemCount={leads?.total}
      visibleStats={{
        total: stats?.totalLeads ?? 0,
        newThisMonth: stats?.newThisMonth ?? 0,
        conversionRate: stats?.conversionRate ?? '0%',
      }}
      tableColumns={['الاسم', 'الهاتف', 'المرحلة', 'المصدر', 'القيمة المتوقعة', 'التاريخ']}
    >
      {/* محتوى الصفحة الأصلي */}
    </PageContextProvider>
  );
}
```

### تعليمات التنفيذ — المرحلة 5:
1. ابدأ بالصفحات ذات الأولوية 1-3
2. لكل صفحة: حدد الـ data hooks الموجودة واسحب منها البيانات المناسبة
3. لا تعدّل أي منطق موجود — فقط لف المحتوى بـ `PageContextProvider`
4. الإحصائيات (`visibleStats`) تكون القيم المعروضة فعلياً في الصفحة (cards, counters, etc.)
5. `visibleData` يكون البيانات المعروضة في الجدول الرئيسي

### معايير النجاح — المرحلة 5:
- فتح المساعد من صفحة العملاء المحتملين → يقول "أنت في قائمة العملاء المحتملين" أو يتصرف وكأنه يعرف
- سؤال "كم عميل عندي؟" من صفحة العملاء → يجاوب بالرقم الظاهر
- سؤال "وش الفلاتر المطبقة؟" → يعرض الفلاتر الحالية
- الانتقال بين الصفحات → السياق يتحدث تلقائياً
- صفحات بدون PageContextProvider → المساعد يعمل عادي بدون page context

---

## ملاحظات مهمة للتنفيذ

### 1. الأمان
- **لا ترسل بيانات حساسة في pageContext** — الدالة `sanitizeForAI` تحذف passwords, tokens, secrets
- **لا ترسل البيانات الكاملة** — ملخص فقط (أول 5 عناصر + العدد الكلي)
- **organizationId isolation** يجب يظل في كل tool query

### 2. الأداء
- `pageContext` يُحسب مرة واحدة عند render الصفحة ولا يتحدث كل ثانية
- لا تضع `visibleData` في useEffect dependencies لأنها object reference يتغير كل render — استخدم `JSON.stringify(visibleStats)` فقط
- حجم pageContext في الـ request يجب أن لا يتجاوز ~2KB — لهذا نلخص ولا نرسل كل شيء

### 2.5. التكلفة وتحسينها
- الأدوات الأساسية (projects + execution + quantities + finance) تُحمّل دائماً ≈ 15 أداة ≈ ~1,500 token إضافية في كل request
- هذا يكلّف تقريباً **$13-20/شهر إضافية** لـ 100 مستخدم نشط
- **تحسين مستقبلي:** لو التكلفة عالية، ممكن تحمّل فقط أدوات القسم الحالي + المشاريع. لكن للبيتا الأفضل تحمّل الكل لأن تجربة المستخدم أهم
- الأدوات ترجع بيانات ملخصة (أول 10-20 عنصر + إجماليات) وليس كل البيانات — هذا يحافظ على output tokens منخفضة

### 3. التوافق مع الكود الموجود
- **لا تحذف** الـ system prompts القديمة في `packages/ai/prompts/` حتى تتأكد أن النظام الجديد يعمل
- **لا تعدّل** أي component موجود — فقط لفّه بـ `PageContextProvider`
- **لا تغيّر** API route signature — أضف `pageContext` كحقل اختياري في body

### 4. نمط إضافة قسم جديد مستقبلاً
إضافة أي قسم جديد = 3 خطوات فقط:
1. ملف definition في `packages/ai/modules/definitions/new-section.ts`
2. ملف tools في `packages/ai/tools/modules/new-section-tools.ts`
3. إضافة `PageContextProvider` في صفحات القسم

### 5. i18n
- كل `pageNameAr` و `pageDescription` يكونوا بالعربي
- system prompts بالعربي
- أسماء الأدوات (tool names) بالإنجليزي (camelCase) لأنها identifiers تقنية
- وصف الأدوات (description) بالعربي لأن Claude يقرأها

---

## ملخص الملفات

### ملفات جديدة:
```
packages/ai/modules/
├── registry.ts                          # Module Registry
└── definitions/
    ├── index.ts                         # barrel export
    ├── projects.ts                      # وحدة المشاريع (نقل من prompts/)
    ├── finance.ts                       # وحدة المالية (نقل من prompts/)
    ├── execution.ts                     # وحدة التنفيذ (نقل من prompts/)
    ├── quantities.ts                    # وحدة الكميات (نقل من prompts/)
    ├── company.ts                       # وحدة الشركة (نقل من prompts/)
    ├── subcontracts.ts                  # وحدة عقود الباطن (نقل من prompts/)
    ├── settings.ts                      # وحدة الإعدادات (نقل من prompts/)
    ├── owner-portal.ts                  # وحدة بوابة المالك (نقل من prompts/)
    ├── navigation.ts                    # وحدة التنقل (نقل من prompts/)
    └── leads.ts                         # وحدة العملاء المحتملين (جديد)

packages/ai/tools/
├── registry.ts                          # Tool Registry
└── modules/
    ├── index.ts                         # تسجيل كل الأدوات
    ├── projects-tools.ts                # أدوات المشاريع (قائمة + تفاصيل + ملخص مالي)
    ├── finance-tools.ts                 # أدوات المالية (نقل)
    ├── execution-tools.ts               # أدوات التنفيذ (أنشطة + معالم + تحليل تأخير)
    ├── quantities-tools.ts              # أدوات الكميات (دراسات + بنود + بحث مواد)
    ├── quotations-tools.ts              # أدوات عروض الأسعار (قائمة + تفاصيل + ملخص)
    ├── company-tools.ts                 # أدوات الشركة (نقل)
    ├── subcontracts-tools.ts            # أدوات عقود الباطن (نقل)
    ├── general-tools.ts                 # أدوات عامة (نقل)
    └── leads-tools.ts                   # أدوات العملاء المحتملين (جديد)

apps/web/modules/saas/ai/
├── hooks/
│   └── use-page-context.ts              # Zustand store لسياق الصفحة
└── components/
    └── PageContextProvider.tsx           # Provider لتسجيل سياق الصفحة
```

### ملفات تحتاج تعديل:
```
apps/web/app/api/ai/assistant/route.ts   # استخدام Registry + Page Context
apps/web/modules/saas/ai/.../AiChat.tsx  # إرسال pageContext مع الرسائل
+ 3-9 صفحات لإضافة PageContextProvider
```

### ملاحظة عن سلسلة الأدوات (Tool Chaining):
المساعد يقدر يستدعي أكثر من أداة للإجابة على سؤال واحد. مثلاً:

**سؤال:** "كم طن حديد يحتاج مشروع فيلا الرياض؟"
**سلسلة الاستدعاءات:**
1. `queryProjects(search: "فيلا الرياض")` → يحصل على `projectId`
2. `searchMaterials(search: "حديد", projectId: "...")` → يجد كل بنود الحديد
3. يجمع الكميات ويعرض النتيجة

**سؤال:** "هل مشروع المدارس متأخر وكم تكلفته؟"
**سلسلة الاستدعاءات:**
1. `queryProjects(search: "المدارس")` → يحصل على `projectId`
2. `getDelayAnalysis(projectId)` → تحليل التأخير
3. `getProjectFinanceSummary(projectId)` → الملخص المالي
4. يدمج النتائج في إجابة واحدة شاملة

هذا يعمل تلقائياً لأن Claude يدعم multi-step tool use — يستدعي أداة، يقرأ النتيجة، ويقرر إذا يحتاج أداة ثانية.

---

## ترتيب التنفيذ الموصى

1. **المرحلة 1** أولاً — لأنها أساس كل شيء (Module Registry)
2. **المرحلة 2** — لأنها تعتمد على المرحلة 1 (Tool Registry)
3. **المرحلة 4** — ربط الـ API (يعتمد على 1 + 2)
4. **المرحلة 3** — إنشاء Page Context system
5. **المرحلة 5** — التطبيق على الصفحات (يعتمد على 3 + 4)

**شغّل Plan Mode أولاً** لكل مرحلة قبل التنفيذ — اقرأ الملفات الموجودة في `packages/ai/` و `apps/web/modules/saas/ai/` و `apps/web/app/api/ai/assistant/` أولاً لفهم البنية الحالية قبل أي تعديل.
