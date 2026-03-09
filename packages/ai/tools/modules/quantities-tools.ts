import { z } from "zod";
import { registerTool } from "../registry";
import { db } from "@repo/database";

function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && "toNumber" in (val as object)) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

// ──────────────────────────────────────────
// 1. قائمة دراسات التكلفة
// ──────────────────────────────────────────
registerTool({
  name: "queryCostStudies",
  description:
    "عرض قائمة دراسات التكلفة/الكميات في المنظمة أو لمشروع محدد — مع الموقع والمساحة وإجمالي التكلفة",
  moduleId: "quantities",
  parameters: z.object({
    projectId: z
      .string()
      .optional()
      .describe("معرّف المشروع — لو تبي دراسات مشروع معيّن"),
    search: z.string().optional().describe("بحث بالاسم أو اسم العميل"),
    limit: z.number().default(10),
  }),
  execute: async (params, context) => {
    try {
      const studies = await db.costStudy.findMany({
        where: {
          organizationId: context.organizationId,
          ...(params.projectId && { projectId: params.projectId }),
          ...(params.search && {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              {
                customerName: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        take: params.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          customerName: true,
          projectType: true,
          landArea: true,
          buildingArea: true,
          numberOfFloors: true,
          totalCost: true,
          overheadPercent: true,
          profitPercent: true,
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
      return {
        studies: studies.map((s) => ({
          ...s,
          landArea: s.landArea?.toString(),
          buildingArea: s.buildingArea?.toString(),
          totalCost: s.totalCost?.toString(),
          overheadPercent: s.overheadPercent?.toString(),
          profitPercent: s.profitPercent?.toString(),
        })),
        total: studies.length,
      };
    } catch (e) {
      return {
        error: `فشل استعلام دراسات التكلفة: ${(e as Error).message}`,
      };
    }
  },
});

// ──────────────────────────────────────────
// 2. تفاصيل دراسة تكلفة واحدة مع كل البنود
// ──────────────────────────────────────────
registerTool({
  name: "getCostStudyDetails",
  description:
    'تفاصيل دراسة تكلفة كاملة — بنود إنشائية وتشطيبات و MEP وعمالة مع الكميات والأسعار. استخدمها لما المستخدم يسأل "كم طن حديد" أو "كم تكلفة البلاط" أو أي سؤال عن مواد وكميات',
  moduleId: "quantities",
  parameters: z.object({
    studyId: z.string().describe("معرّف دراسة التكلفة"),
  }),
  execute: async (params, context) => {
    try {
      const study = await db.costStudy.findFirst({
        where: {
          id: params.studyId,
          organizationId: context.organizationId,
        },
        include: {
          project: { select: { id: true, name: true } },
          structuralItems: {
            select: {
              id: true,
              category: true,
              name: true,
              description: true,
              unit: true,
              quantity: true,
              materialCost: true,
              laborCost: true,
              totalCost: true,
            },
            orderBy: { createdAt: "asc" },
          },
          finishingItems: {
            select: {
              id: true,
              category: true,
              name: true,
              floorName: true,
              area: true,
              materialPrice: true,
              laborPrice: true,
              totalCost: true,
            },
            orderBy: { createdAt: "asc" },
          },
          mepItems: {
            select: {
              id: true,
              category: true,
              name: true,
              quantity: true,
              unit: true,
              materialCost: true,
              laborCost: true,
              totalCost: true,
            },
            orderBy: { createdAt: "asc" },
          },
          laborItems: {
            select: {
              id: true,
              name: true,
              workerType: true,
              quantity: true,
              dailyRate: true,
              durationDays: true,
              totalCost: true,
            },
            orderBy: { createdAt: "asc" },
          },
          quotes: {
            select: {
              id: true,
              quoteNumber: true,
              totalAmount: true,
              notes: true,
            },
          },
        },
      });

      if (!study) return { error: "دراسة التكلفة غير موجودة" };

      // Cast to any because include adds relations not in the base type
      const s = study as any;

      const structuralTotal = (s.structuralItems ?? []).reduce(
        (sum: number, item: any) => sum + toNum(item.totalCost),
        0,
      );
      const finishingTotal = (s.finishingItems ?? []).reduce(
        (sum: number, item: any) => sum + toNum(item.totalCost),
        0,
      );
      const mepTotal = (s.mepItems ?? []).reduce(
        (sum: number, item: any) => sum + toNum(item.totalCost),
        0,
      );
      const laborTotal = (s.laborItems ?? []).reduce(
        (sum: number, item: any) => sum + toNum(item.totalCost),
        0,
      );
      const subtotal = structuralTotal + finishingTotal + mepTotal + laborTotal;
      const overhead =
        (subtotal * toNum(s.overheadPercent)) / 100;
      const profit =
        ((subtotal + overhead) * toNum(s.profitPercent)) / 100;
      const beforeVat = subtotal + overhead + profit;

      return {
        study: {
          name: s.name,
          customerName: s.customerName,
          projectType: s.projectType,
          landArea: s.landArea?.toString(),
          buildingArea: s.buildingArea?.toString(),
          numberOfFloors: s.numberOfFloors,
          project: s.project,
          overheadPercent: s.overheadPercent?.toString(),
          profitPercent: s.profitPercent?.toString(),
        },
        structuralItems: (s.structuralItems ?? []).map((i: any) => ({
          ...i,
          quantity: i.quantity?.toString(),
          materialCost: i.materialCost?.toString(),
          laborCost: i.laborCost?.toString(),
          totalCost: i.totalCost?.toString(),
        })),
        finishingItems: (s.finishingItems ?? []).map((i: any) => ({
          ...i,
          area: i.area?.toString(),
          materialPrice: i.materialPrice?.toString(),
          laborPrice: i.laborPrice?.toString(),
          totalCost: i.totalCost?.toString(),
        })),
        mepItems: (s.mepItems ?? []).map((i: any) => ({
          ...i,
          quantity: i.quantity?.toString(),
          materialCost: i.materialCost?.toString(),
          laborCost: i.laborCost?.toString(),
          totalCost: i.totalCost?.toString(),
        })),
        laborItems: (s.laborItems ?? []).map((i: any) => ({
          ...i,
          quantity: i.quantity?.toString(),
          dailyRate: i.dailyRate?.toString(),
          durationDays: i.durationDays?.toString(),
          totalCost: i.totalCost?.toString(),
        })),
        quotes: (s.quotes ?? []).map((q: any) => ({
          ...q,
          totalAmount: q.totalAmount?.toString(),
        })),
        totals: {
          structural: structuralTotal.toFixed(2),
          finishing: finishingTotal.toFixed(2),
          mep: mepTotal.toFixed(2),
          labor: laborTotal.toFixed(2),
          subtotal: subtotal.toFixed(2),
          overhead: overhead.toFixed(2),
          profit: profit.toFixed(2),
          grandTotal: beforeVat.toFixed(2),
        },
      };
    } catch (e) {
      return {
        error: `فشل جلب تفاصيل الدراسة: ${(e as Error).message}`,
      };
    }
  },
});

// ──────────────────────────────────────────
// 3. البحث في المواد والكميات عبر كل الدراسات
// ──────────────────────────────────────────
registerTool({
  name: "searchMaterials",
  description:
    'البحث في المواد والبنود عبر كل دراسات الكميات — مثلاً "حديد" أو "بلاط" أو "كهرباء". يبحث في البنود الإنشائية والتشطيبات والـ MEP',
  moduleId: "quantities",
  parameters: z.object({
    search: z
      .string()
      .describe("اسم المادة أو البند — مثل: حديد، خرسانة، بلاط، سباكة"),
    projectId: z
      .string()
      .optional()
      .describe("تقييد البحث بمشروع محدد"),
    section: z
      .enum(["structural", "finishing", "mep", "labor", "all"])
      .default("all")
      .describe("القسم المطلوب"),
  }),
  execute: async (params, context) => {
    try {
      const orgFilter = {
        costStudy: { organizationId: context.organizationId },
      };
      const projectFilter = params.projectId
        ? {
            costStudy: {
              ...orgFilter.costStudy,
              projectId: params.projectId,
            },
          }
        : orgFilter;

      const results: any = {};

      if (params.section === "all" || params.section === "structural") {
        results.structural = await db.structuralItem.findMany({
          where: {
            ...projectFilter,
            OR: [
              {
                description: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
              {
                category: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
              {
                name: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          },
          select: {
            id: true,
            category: true,
            name: true,
            description: true,
            unit: true,
            quantity: true,
            totalCost: true,
            costStudy: {
              select: {
                name: true,
                project: { select: { name: true } },
              },
            },
          },
          take: 20,
        });
      }

      if (params.section === "all" || params.section === "finishing") {
        results.finishing = await db.finishingItem.findMany({
          where: {
            ...projectFilter,
            OR: [
              {
                name: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
              {
                category: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          },
          select: {
            id: true,
            category: true,
            name: true,
            floorName: true,
            area: true,
            totalCost: true,
            costStudy: {
              select: {
                name: true,
                project: { select: { name: true } },
              },
            },
          },
          take: 20,
        });
      }

      if (params.section === "all" || params.section === "mep") {
        results.mep = await db.mEPItem.findMany({
          where: {
            ...projectFilter,
            OR: [
              {
                name: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
              {
                category: {
                  contains: params.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          },
          select: {
            id: true,
            category: true,
            name: true,
            quantity: true,
            totalCost: true,
            costStudy: {
              select: {
                name: true,
                project: { select: { name: true } },
              },
            },
          },
          take: 20,
        });
      }

      if (params.section === "all" || params.section === "labor") {
        results.labor = await db.laborItem.findMany({
          where: {
            ...projectFilter,
            name: { contains: params.search, mode: "insensitive" as const },
          },
          select: {
            id: true,
            name: true,
            workerType: true,
            quantity: true,
            dailyRate: true,
            durationDays: true,
            totalCost: true,
            costStudy: {
              select: {
                name: true,
                project: { select: { name: true } },
              },
            },
          },
          take: 20,
        });
      }

      return {
        searchTerm: params.search,
        results: {
          structural: results.structural?.map((i: any) => ({
            ...i,
            quantity: i.quantity?.toString(),
            totalCost: i.totalCost?.toString(),
          })),
          finishing: results.finishing?.map((i: any) => ({
            ...i,
            area: i.area?.toString(),
            totalCost: i.totalCost?.toString(),
          })),
          mep: results.mep?.map((i: any) => ({
            ...i,
            quantity: i.quantity?.toString(),
            totalCost: i.totalCost?.toString(),
          })),
          labor: results.labor?.map((i: any) => ({
            ...i,
            quantity: i.quantity?.toString(),
            dailyRate: i.dailyRate?.toString(),
            totalCost: i.totalCost?.toString(),
          })),
        },
        summary: {
          structuralCount: results.structural?.length ?? 0,
          finishingCount: results.finishing?.length ?? 0,
          mepCount: results.mep?.length ?? 0,
          laborCount: results.labor?.length ?? 0,
        },
      };
    } catch (e) {
      return { error: `فشل البحث في المواد: ${(e as Error).message}` };
    }
  },
});
