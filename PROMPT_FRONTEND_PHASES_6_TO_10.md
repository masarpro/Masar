# 🎨 برومبت بناء الواجهة الكاملة — Unified Quantities Workspace (المراحل 6-10)

> **الشرط المسبق:** Phases 1-5 (الخلفية) **مكتملة 100%** على branch `feat/unified-quantities-backend` (913 test passing).
>
> **الهدف:** بناء الواجهة الكاملة التي تستهلك الـ 20 endpoint وتعرض كل شيء في **بطاقة موحَّدة بـ 4 أقسام قابلة للطي**.
>
> **النتيجة النهائية:** المستخدم يفتح صفحة الكميات، يضيف بنداً، يُدخل كل شيء في مكان واحد، يرى السعر الحي يتحدّث، يضغط زراً واحداً ويحصل على PDF عرض سعر.
>
> **الوقت المتوقع:** 8-10 ساعات على 2-3 جلسات.
>
> **Branch:** اعمل checkout على `feat/unified-quantities-backend` (نفس branch الخلفية) — لا تنشئ branch جديد.

---

## 📚 السياق

### المشروع
**مسار** (Masar) — SaaS عربي للمقاولين السعوديين.
**التقنيات:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, oRPC client, BetterAuth, react-hook-form, Zod 4, lucide-react, sonner (toasts), use-debounce.
**الموقع:** `D:\Masar\Masar` (Windows).
**اللغة:** عربية أولاً (RTL)، إنجليزية ثانوياً.

### الفلسفة الجوهرية للواجهة

**Progressive Disclosure** — ما يراه المستخدم بشكل افتراضي = ما يكفي للمقاول السريع. ما يحتاج تفاصيل أكثر = نقرة واحدة.

**3 سيناريوهات تستهدف الواجهة دعمها:**
1. **المقاول السريع** (3 دقائق): يضيف بنداً واحداً، يكتب الكمية، يحصل على السعر
2. **المهندس التفصيلي** (15 دقيقة): يطبّق Preset، يضبط Context، يفتح كل قسم بدقة
3. **المقتبس** (30 ثانية): ينسخ دراسة سابقة، يغيّر قيمة، يصدر PDF

---

## 🚨 القائمة الحمراء (لا تُلمس أبداً)

```
apps/web/modules/saas/pricing/lib/derivation-engine.ts          ← قراءة فقط
apps/web/modules/saas/pricing/lib/mep-derivation-engine.ts      ← قراءة فقط
apps/web/modules/saas/pricing/lib/structural-calculations.ts
apps/web/modules/saas/pricing/components/studies/sections/*
apps/web/modules/saas/pricing/components/studies/StructuralBuildingWizard.tsx
apps/web/modules/saas/pricing/components/studies/StructuralAccordion.tsx
apps/web/modules/saas/pricing/components/studies/BOQSummaryTable.tsx
apps/web/modules/saas/pricing/components/studies/PaintItemDialog.tsx     ← قراءة فقط
apps/web/modules/saas/pricing/components/studies/PlasterItemDialog.tsx   ← قراءة فقط
apps/web/modules/saas/pricing/components/studies/FinishingItemsEditor.tsx
apps/web/modules/saas/pricing/components/studies/MEPItemsEditor.tsx
apps/web/modules/saas/pricing/components/specifications/*
apps/web/modules/saas/pricing/components/costing-v2/*
apps/web/modules/saas/pricing/components/pricing-v2/*
packages/database/prisma/schema.prisma                          ← لا تعديلات schema
packages/api/modules/unified-quantities/**                      ← الخلفية مكتملة، لا تعدّل
```

**يحق لك إنشاء/تعديل:**
- `apps/web/modules/saas/pricing/components/unified-quantities/**` (الجزء الأكبر)
- `apps/web/modules/saas/pricing/hooks/useStudyConfig.ts` (Phase 10 فقط)
- `apps/web/modules/saas/pricing/components/studies/QuantitiesSubTabs.tsx` (Phase 10 فقط)

---

## ⚙️ قواعد البيئة الصارمة

### Windows PowerShell
```powershell
$env:VAR = "value"            # لا export
;                             # فاصل أوامر، لا &&
Remove-Item -Recurse -Force   # لا rm -rf
```

### Tailwind RTL — صارم بدون استثناء
✅ مسموح: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`, `border-s-`, `border-e-`
❌ ممنوع: `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, `border-l-`, `border-r-`

### الأرقام
- `tabular-nums` على كل عرض رقمي للمحاذاة المثالية
- العملة: `ر.س` (لا تستخدم U+FDFC ﷼ — يُعرض "ریال" في Chromium)
- التنسيق: `1,250.00` (Number.toLocaleString("en-US", {...}))

### بعد كل مكون رئيسي
```powershell
npx tsc --noEmit
```

### الاختبار اليدوي بعد كل مرحلة
```powershell
pnpm dev
# افتح http://localhost:3000 → دراسة → كميات → التبويب الجديد
```

### الـ Stack الجاهز
- shadcn (Card, Collapsible, Dialog, Drawer, Sheet, Tabs, Form, Button, Input, Select, Slider, Switch, Checkbox, Radio, AlertDialog, Tooltip, DropdownMenu, Popover, Command)
- لو احتجت component غير موجود، استخدم `pnpm dlx shadcn@latest add <name>`
- `react-hook-form` + `@hookform/resolvers/zod/v4`
- `use-debounce`
- `sonner` (toasts)
- `lucide-react`

### oRPC Client
```typescript
import { orpc } from "@/lib/orpc-client";

// Query
const { data, isLoading } = orpc.unifiedQuantities.getItems.useQuery({
  costStudyId, organizationId
});

// Mutation
const mutation = orpc.unifiedQuantities.upsertItem.useMutation({
  onSuccess: () => { ... },
  onError: (err) => toast.error(err.message),
});
```

### Optimistic Updates Pattern (مهم)
```typescript
const mutation = orpc.unifiedQuantities.upsertItem.useMutation({
  onMutate: async (newData) => {
    // 1. ألغِ أي queries قيد التنفيذ
    await queryClient.cancelQueries(...);
    
    // 2. احفظ snapshot للـ rollback
    const previous = queryClient.getQueryData(...);
    
    // 3. حدِّث UI فوراً
    queryClient.setQueryData(..., newData);
    
    return { previous };
  },
  onError: (err, _, context) => {
    // Rollback
    queryClient.setQueryData(..., context.previous);
    toast.error(err.message);
  },
  onSettled: () => {
    // Sync نهائي
    queryClient.invalidateQueries(...);
  },
});
```

### Debouncing للحقول الرقمية
```typescript
import { useDebouncedCallback } from "use-debounce";

const debouncedUpdate = useDebouncedCallback((value) => {
  mutation.mutate(value);
}, 400);  // 400ms — sweet spot
```

---

## 🎬 إعلان البدء

اكتب أول رد بهذه الصيغة:

```
✅ قرأت برومبت بناء الواجهة الكامل (المراحل 6-10).

الخلفية جاهزة على branch feat/unified-quantities-backend (913 test passing).

سأنشئ TodoWrite بـ 6 مهام:
0. التحقق من جاهزية الخلفية وأدوات الواجهة
6. UI Foundation + Workspace + Catalog Picker
7. البطاقة الموحَّدة + 4 أقسام (Bi-directional)
8. Mini Dashboard + Global Markup + Context Drawer
9. Quote Drawer + PDF Generation
10. Feature Flag + Integration + Manual Testing

سأبدأ بـ Phase 0.5 (التحقق) قبل أي تنفيذ.
الوقت المتوقع: 8-10 ساعات.
سأتوقف بعد كل مرحلة لتأكيد جودت.
```

---

# 📍 Phase 0.5 — التحقق من جاهزية البيئة

**الهدف:** قبل بناء الواجهة، تأكد من وجود الخلفية والـ stack.

## 0.5.1 — تأكد من Branch

```powershell
git branch --show-current
# يجب: feat/unified-quantities-backend

git log --oneline | Select-Object -First 6
# يجب يظهر 5 commits لـ Phase 1-5
```

لو الـ branch مختلف:
```powershell
git checkout feat/unified-quantities-backend
```

## 0.5.2 — تحقق من Backend ready

```powershell
# تحقق من وجود جدول QuantityItem في schema
Select-String -Path packages\database\prisma\schema.prisma -Pattern "model QuantityItem"

# تحقق من وجود router
Get-ChildItem packages\api\modules\unified-quantities -Filter "router.ts"

# تحقق من تسجيل في appRouter
Select-String -Path packages\api\router.ts -Pattern "unifiedQuantities"
```

كل واحد يجب يرجع نتيجة. لو فيه ناقص، **توقف** وأبلغ جودت.

## 0.5.3 — تحقق من orpc client types

```powershell
# اختبر أن الـ types مولَّدة
$content = @"
import { orpc } from '@/lib/orpc-client';
type Test = Parameters<typeof orpc.unifiedQuantities.getItems.useQuery>[0];
"@

$content | Out-File -FilePath apps/web/test-orpc-types.ts -Encoding utf8
npx tsc --noEmit --skipLibCheck apps/web/test-orpc-types.ts 2>&1
Remove-Item apps/web/test-orpc-types.ts -ErrorAction SilentlyContinue
```

## 0.5.4 — تحقق من الـ Stack

```powershell
$pkg = Get-Content apps\web\package.json -Raw | ConvertFrom-Json
$deps = $pkg.dependencies.PSObject.Properties.Name + $pkg.devDependencies.PSObject.Properties.Name

@(
  "react-hook-form",
  "@hookform/resolvers",
  "use-debounce",
  "sonner",
  "lucide-react",
  "tailwindcss"
) | ForEach-Object {
  if ($deps -contains $_) {
    Write-Host "✓ $_"
  } else {
    Write-Host "✗ MISSING: $_"
  }
}
```

لو `use-debounce` مفقود:
```powershell
pnpm --filter web add use-debounce
```

## 0.5.5 — تأكد من shadcn components الجاهزة

```powershell
Get-ChildItem apps\web\components\ui -Filter "*.tsx" | Select-Object -ExpandProperty Name
```

يجب يحوي على الأقل: button, card, dialog, drawer, sheet, tabs, input, select, slider, switch, checkbox, radio-group, accordion, collapsible, dropdown-menu, popover, command, alert-dialog, label, form, skeleton, tooltip.

أي مكون مفقود:
```powershell
pnpm dlx shadcn@latest add <component-name>
```

## ✅ معيار اجتياز Phase 0.5

```
✅ Phase 0.5 Complete — Backend & Stack Ready:

Backend:
- Branch: feat/unified-quantities-backend ✓
- 5 phase commits visible ✓
- QuantityItem model exists ✓
- unifiedQuantities router registered ✓
- Types generate successfully ✓

Frontend Stack:
- react-hook-form + zod resolvers ✓
- use-debounce ✓
- sonner ✓
- lucide-react ✓
- shadcn components: [list of available]

⏸ في انتظار تأكيدك للبدء بـ Phase 6.
```

---

# 📍 Phase 6 — UI Foundation

**الهدف:** بناء الهيكل الأساسي + Catalog Picker + الـ hooks الرئيسية.
**المدة:** 2.5-3 ساعات.

## 6.1 — البنية الكاملة

```
apps/web/modules/saas/pricing/components/unified-quantities/
├── UnifiedItemsWorkspace.tsx              (~180 سطر — Container الرئيسي)
├── types.ts                               (~80 سطر)
│
├── catalog-picker/
│   ├── CatalogPickerDrawer.tsx            (~180 سطر)
│   ├── CatalogSearch.tsx                  (~70 سطر)
│   ├── CatalogCategoryTree.tsx            (~150 سطر)
│   ├── CatalogItemCard.tsx                (~90 سطر)
│   ├── PresetsCarousel.tsx                (~120 سطر)
│   └── index.ts
│
├── items-list/
│   ├── ItemsList.tsx                      (~100 سطر — placeholder حتى Phase 7)
│   ├── EmptyState.tsx                     (~80 سطر)
│   └── index.ts
│
├── shared/
│   ├── DomainBadge.tsx                    (~60 سطر)
│   ├── LoadingSkeleton.tsx                (~70 سطر)
│   ├── ErrorState.tsx                     (~50 سطر)
│   └── index.ts
│
└── hooks/
    ├── useUnifiedQuantities.ts            (~200 سطر — central hub)
    ├── useCatalog.ts                      (~80 سطر)
    ├── usePresets.ts                      (~50 سطر)
    └── index.ts
```

## 6.2 — `types.ts` (الأساس)

```typescript
import type { QuantityItem, ItemCatalogEntry } from "@prisma/client";

export type Domain = "FINISHING" | "MEP" | "EXTERIOR" | "SPECIAL";

export type CalculationMethod =
  | "direct_area" | "length_x_height" | "length_only"
  | "per_unit" | "per_room" | "polygon" | "manual" | "lump_sum";

export type MarkupMethod = "percentage" | "fixed_amount" | "manual_price";

export type PricingField =
  | "markup_percent" | "markup_fixed_amount" | "manual_unit_price"
  | "sell_unit_price" | "sell_total_amount"
  | "material_unit_price" | "labor_unit_price";

// حالة الأقسام (مفتوح/مطوي)
export interface SectionState {
  quantity: boolean;
  specifications: boolean;
  cost: boolean;
  pricing: boolean;
}

export const DEFAULT_SECTION_STATE: SectionState = {
  quantity: true,        // مفتوح
  specifications: false, // مطوي
  cost: true,            // مفتوح
  pricing: true,         // مفتوح
};

// Domain styling
export const DOMAIN_STYLES: Record<Domain, { color: string; bgColor: string; label: string; icon: string }> = {
  FINISHING:  { color: "#0ea5e9", bgColor: "#0ea5e920", label: "تشطيبات",     icon: "Palette" },
  MEP:        { color: "#f59e0b", bgColor: "#f59e0b20", label: "كهروميكانيكا", icon: "Zap" },
  EXTERIOR:   { color: "#10b981", bgColor: "#10b98120", label: "خارجي",       icon: "Home" },
  SPECIAL:    { color: "#8b5cf6", bgColor: "#8b5cf620", label: "خاص",         icon: "Sparkles" },
};

// Re-exports
export type { QuantityItem, ItemCatalogEntry };
```

## 6.3 — `hooks/useUnifiedQuantities.ts` (المركز)

```typescript
"use client";

import { orpc } from "@/lib/orpc-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Options {
  costStudyId: string;
  organizationId: string;
}

export function useUnifiedQuantities({ costStudyId, organizationId }: Options) {
  const queryClient = useQueryClient();

  // === Queries ===
  const itemsQuery = orpc.unifiedQuantities.getItems.useQuery(
    { costStudyId, organizationId },
    { enabled: Boolean(costStudyId && organizationId) }
  );

  // Helper for invalidation
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["unifiedQuantities.getItems"] });
    queryClient.invalidateQueries({ queryKey: ["unifiedQuantities.pricing.getStudyTotals"] });
  };

  // === Mutations ===
  const upsertItem = orpc.unifiedQuantities.upsertItem.useMutation({
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: ["unifiedQuantities.getItems", { costStudyId, organizationId }],
      });

      const previous = queryClient.getQueryData([
        "unifiedQuantities.getItems",
        { costStudyId, organizationId },
      ]);

      // Optimistic update لو فيه id
      if (newData.id) {
        queryClient.setQueryData(
          ["unifiedQuantities.getItems", { costStudyId, organizationId }],
          (old: any) => ({
            ...old,
            items: old?.items?.map((i: any) =>
              i.id === newData.id ? { ...i, ...newData } : i
            ),
          })
        );
      }

      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["unifiedQuantities.getItems", { costStudyId, organizationId }],
          context.previous
        );
      }
      toast.error("فشل حفظ البند: " + err.message);
    },
    onSettled: invalidateAll,
  });

  const deleteItem = orpc.unifiedQuantities.deleteItem.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("تم حذف البند");
    },
    onError: (err) => toast.error("فشل الحذف: " + err.message),
  });

  const duplicateItem = orpc.unifiedQuantities.duplicateItem.useMutation({
    onSuccess: () => {
      invalidateAll();
      toast.success("تم نسخ البند");
    },
    onError: (err) => toast.error("فشل النسخ: " + err.message),
  });

  const reorderItems = orpc.unifiedQuantities.reorderItems.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unifiedQuantities.getItems"] });
    },
  });

  const applyPreset = orpc.unifiedQuantities.applyPreset.useMutation({
    onSuccess: (result: any) => {
      invalidateAll();
      toast.success(`تمت إضافة ${result.itemsCreated ?? 0} بند من الباقة`);
    },
    onError: (err) => toast.error("فشل تطبيق الباقة: " + err.message),
  });

  return {
    items: itemsQuery.data?.items ?? [],
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error,

    upsertItem: upsertItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    duplicateItem: duplicateItem.mutateAsync,
    reorderItems: reorderItems.mutateAsync,
    applyPreset: applyPreset.mutateAsync,

    isUpserting: upsertItem.isPending,
    isDeleting: deleteItem.isPending,
  };
}
```

## 6.4 — `hooks/useCatalog.ts`

```typescript
"use client";

import { orpc } from "@/lib/orpc-client";
import { useMemo } from "react";

export function useCatalog(organizationId: string) {
  const query = orpc.unifiedQuantities.getCatalog.useQuery(
    { organizationId },
    {
      staleTime: 1000 * 60 * 60,        // 1 ساعة - الكتالوج ثابت
      gcTime: 1000 * 60 * 60 * 24,      // 24 ساعة
    }
  );

  // تجميع حسب domain → category للعرض
  const groupedByCategory = useMemo(() => {
    if (!query.data?.entries) return null;

    const result: Record<string, Record<string, typeof query.data.entries>> = {};
    for (const entry of query.data.entries) {
      if (!result[entry.domain]) result[entry.domain] = {};
      if (!result[entry.domain][entry.categoryKey]) {
        result[entry.domain][entry.categoryKey] = [];
      }
      result[entry.domain][entry.categoryKey].push(entry);
    }

    // Sort داخل كل category
    for (const domain in result) {
      for (const cat in result[domain]) {
        result[domain][cat].sort((a, b) => a.displayOrder - b.displayOrder);
      }
    }

    return result;
  }, [query.data]);

  return {
    entries: query.data?.entries ?? [],
    groupedByCategory,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

## 6.5 — `hooks/usePresets.ts`

```typescript
"use client";

import { orpc } from "@/lib/orpc-client";

export function usePresets(organizationId: string) {
  const query = orpc.unifiedQuantities.getPresets.useQuery(
    { organizationId },
    { staleTime: 1000 * 60 * 60 }
  );

  return {
    presets: query.data?.presets ?? [],
    isLoading: query.isLoading,
  };
}
```

## 6.6 — `UnifiedItemsWorkspace.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { useUnifiedQuantities } from "./hooks/useUnifiedQuantities";
import { ItemsList } from "./items-list/ItemsList";
import { EmptyState } from "./items-list/EmptyState";
import { CatalogPickerDrawer } from "./catalog-picker/CatalogPickerDrawer";
import { LoadingSkeleton } from "./shared/LoadingSkeleton";
import { ErrorState } from "./shared/ErrorState";
import type { ItemCatalogEntry } from "./types";

interface Props {
  costStudyId: string;
  organizationId: string;
}

export function UnifiedItemsWorkspace({ costStudyId, organizationId }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"items" | "presets">("items");

  const {
    items,
    isLoading,
    error,
    upsertItem,
    deleteItem,
    duplicateItem,
    reorderItems,
    applyPreset,
  } = useUnifiedQuantities({ costStudyId, organizationId });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  const handleAddItem = (entry: ItemCatalogEntry) => {
    return upsertItem({
      costStudyId,
      organizationId,
      domain: entry.domain as any,
      categoryKey: entry.categoryKey,
      catalogItemKey: entry.itemKey,
      displayName: entry.nameAr,
      calculationMethod: entry.defaultCalculationMethod as any,
      unit: entry.unit,
      wastagePercent: Number(entry.defaultWastagePercent),
      materialUnitPrice: entry.defaultMaterialUnitPrice
        ? Number(entry.defaultMaterialUnitPrice)
        : undefined,
      laborUnitPrice: entry.defaultLaborUnitPrice
        ? Number(entry.defaultLaborUnitPrice)
        : undefined,
      sortOrder: items.length,
      markupMethod: "percentage",
      hasCustomMarkup: false,
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Header مؤقت — سيُستبدل بـ StudyHeader في Phase 8 */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl font-semibold">التشطيبات والكهروميكانيكا</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPickerMode("presets");
              setPickerOpen(true);
            }}
          >
            <Package className="me-2 h-4 w-4" />
            باقات جاهزة
          </Button>
          <Button
            onClick={() => {
              setPickerMode("items");
              setPickerOpen(true);
            }}
          >
            <Plus className="me-2 h-4 w-4" />
            بند جديد
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          onAddItem={() => {
            setPickerMode("items");
            setPickerOpen(true);
          }}
          onApplyPreset={() => {
            setPickerMode("presets");
            setPickerOpen(true);
          }}
        />
      ) : (
        <ItemsList
          items={items}
          costStudyId={costStudyId}
          organizationId={organizationId}
          onUpsert={upsertItem}
          onDelete={deleteItem}
          onDuplicate={duplicateItem}
          onReorder={reorderItems}
        />
      )}

      <CatalogPickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={pickerMode}
        organizationId={organizationId}
        onItemSelect={async (entry) => {
          await handleAddItem(entry);
          setPickerOpen(false);
        }}
        onPresetSelect={async (presetKey) => {
          await applyPreset({ costStudyId, organizationId, presetKey });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
```

## 6.7 — `catalog-picker/CatalogPickerDrawer.tsx`

```tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CatalogSearch } from "./CatalogSearch";
import { CatalogCategoryTree } from "./CatalogCategoryTree";
import { PresetsCarousel } from "./PresetsCarousel";
import { useCatalog } from "../hooks/useCatalog";
import { usePresets } from "../hooks/usePresets";
import type { ItemCatalogEntry } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "items" | "presets";
  organizationId: string;
  onItemSelect: (entry: ItemCatalogEntry) => Promise<void>;
  onPresetSelect: (presetKey: string) => Promise<void>;
}

export function CatalogPickerDrawer({
  open,
  onOpenChange,
  mode,
  organizationId,
  onItemSelect,
  onPresetSelect,
}: Props) {
  const { groupedByCategory, isLoading } = useCatalog(organizationId);
  const { presets, isLoading: presetsLoading } = usePresets(organizationId);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="end"
        className="flex w-full flex-col gap-4 sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "items" ? "اختر بنداً من الكتالوج" : "اختر باقة جاهزة"}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={mode} className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="items" className="flex-1">
              بنود فردية
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex-1">
              باقات جاهزة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="flex flex-1 flex-col gap-3 overflow-hidden">
            <CatalogSearch value={searchQuery} onChange={setSearchQuery} />
            <div className="flex-1 overflow-y-auto pe-2">
              <CatalogCategoryTree
                groupedByCategory={groupedByCategory}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onItemSelect={onItemSelect}
              />
            </div>
          </TabsContent>

          <TabsContent value="presets" className="flex-1 overflow-y-auto">
            <PresetsCarousel
              presets={presets}
              isLoading={presetsLoading}
              onSelect={onPresetSelect}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

## 6.8 — `catalog-picker/CatalogSearch.tsx`

```tsx
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function CatalogSearch({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="ابحث... (دهان، سيراميك، كهرباء، إلخ)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pe-10"
      />
    </div>
  );
}
```

## 6.9 — `catalog-picker/CatalogCategoryTree.tsx`

```tsx
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogItemCard } from "./CatalogItemCard";
import { DOMAIN_STYLES } from "../types";
import type { ItemCatalogEntry, Domain } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  paint: "دهانات",
  plaster: "لياسة",
  flooring: "أرضيات",
  walls: "جدران",
  ceiling: "أسقف",
  doors: "أبواب",
  windows: "نوافذ",
  insulation: "عزل",
  cladding: "تكسيات",
  trim: "وزرات وأفاريز",
  kitchen: "مطابخ",
  electrical: "كهرباء",
  plumbing: "سباكة",
  hvac: "تكييف",
  firefighting: "إطفاء حريق",
  low_current: "تيار خفيف",
};

interface Props {
  groupedByCategory: Record<string, Record<string, ItemCatalogEntry[]>> | null;
  isLoading: boolean;
  searchQuery: string;
  onItemSelect: (entry: ItemCatalogEntry) => Promise<void>;
}

export function CatalogCategoryTree({ groupedByCategory, isLoading, searchQuery, onItemSelect }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!groupedByCategory) return null;

  const filtered = filterBySearch(groupedByCategory, searchQuery);

  return (
    <Accordion type="multiple" defaultValue={["FINISHING"]} className="space-y-2">
      {(Object.keys(filtered) as Domain[]).map((domain) => {
        const categories = filtered[domain];
        const totalCount = Object.values(categories).reduce((sum, items) => sum + items.length, 0);
        if (totalCount === 0) return null;

        const style = DOMAIN_STYLES[domain];
        return (
          <AccordionItem key={domain} value={domain} className="rounded-lg border">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <span style={{ color: style.color }} className="font-semibold">{style.label}</span>
                <span className="text-xs text-muted-foreground">({totalCount} بند)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 px-2 pb-3">
              {Object.entries(categories).map(([catKey, entries]) => (
                <div key={catKey}>
                  <h4 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
                    {CATEGORY_LABELS[catKey] ?? catKey}
                  </h4>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {entries.map((entry) => (
                      <CatalogItemCard
                        key={entry.itemKey}
                        entry={entry}
                        onSelect={() => onItemSelect(entry)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function filterBySearch(
  grouped: Record<string, Record<string, ItemCatalogEntry[]>>,
  query: string
): Record<string, Record<string, ItemCatalogEntry[]>> {
  if (!query.trim()) return grouped;
  const q = query.trim().toLowerCase();

  const result: typeof grouped = {};
  for (const [domain, categories] of Object.entries(grouped)) {
    result[domain] = {};
    for (const [catKey, items] of Object.entries(categories)) {
      const matches = items.filter(
        (e) =>
          e.nameAr.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q) ||
          e.itemKey.toLowerCase().includes(q)
      );
      if (matches.length > 0) result[domain][catKey] = matches;
    }
  }
  return result;
}
```

## 6.10 — `catalog-picker/CatalogItemCard.tsx`

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import type { ItemCatalogEntry } from "../types";

interface Props {
  entry: ItemCatalogEntry;
  onSelect: () => void;
}

export function CatalogItemCard({ entry, onSelect }: Props) {
  const Icon = (Icons as any)[entry.icon] ?? Icons.Package;
  const matPrice = Number(entry.defaultMaterialUnitPrice ?? 0);
  const labPrice = Number(entry.defaultLaborUnitPrice ?? 0);
  const totalPrice = matPrice + labPrice;

  return (
    <Card
      onClick={onSelect}
      className="group cursor-pointer p-3 transition-all hover:border-primary hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: (entry.color ?? "#94a3b8") + "20",
            color: entry.color ?? "#64748b",
          }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h5 className="truncate text-sm font-medium">{entry.nameAr}</h5>
          <p className="truncate text-xs text-muted-foreground">
            {entry.unit} · هدر {Number(entry.defaultWastagePercent)}%
          </p>
          {totalPrice > 0 && (
            <p className="mt-1 text-xs tabular-nums text-emerald-600">
              {totalPrice.toFixed(2)} ر.س / {entry.unit}
            </p>
          )}
        </div>

        <Button size="sm" variant="ghost" className="opacity-0 transition-opacity group-hover:opacity-100">
          <Icons.Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
```

## 6.11 — `catalog-picker/PresetsCarousel.tsx`

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";

interface Preset {
  key: string;
  nameAr: string;
  descriptionAr?: string;
  icon: string;
  itemKeys: string[];
}

interface Props {
  presets: Preset[];
  isLoading: boolean;
  onSelect: (presetKey: string) => Promise<void>;
}

export function PresetsCarousel({ presets, isLoading, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {presets.map((preset) => {
        const Icon = (Icons as any)[preset.icon] ?? Icons.Package;
        return (
          <Card key={preset.key} className="p-4 transition-all hover:border-primary">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold">{preset.nameAr}</h4>
                {preset.descriptionAr && (
                  <p className="mt-1 text-xs text-muted-foreground">{preset.descriptionAr}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {preset.itemKeys.length} بند
                </p>
              </div>
            </div>

            <Button
              onClick={() => onSelect(preset.key)}
              className="mt-3 w-full"
              size="sm"
            >
              تطبيق الباقة
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
```

## 6.12 — `items-list/EmptyState.tsx`

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, FileText } from "lucide-react";

interface Props {
  onAddItem: () => void;
  onApplyPreset: () => void;
}

export function EmptyState({ onAddItem, onApplyPreset }: Props) {
  return (
    <Card className="flex flex-col items-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      <div>
        <h3 className="text-lg font-semibold">لا توجد بنود بعد</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          أضف بنداً واحداً أو طبّق باقة جاهزة للبدء
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onAddItem}>
          <Plus className="me-2 h-4 w-4" />
          أضف بنداً جديداً
        </Button>
        <Button variant="outline" onClick={onApplyPreset}>
          <Package className="me-2 h-4 w-4" />
          استخدم باقة جاهزة
        </Button>
      </div>
    </Card>
  );
}
```

## 6.13 — `items-list/ItemsList.tsx` (placeholder حتى Phase 7)

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import type { QuantityItem } from "../types";

interface Props {
  items: QuantityItem[];
  costStudyId: string;
  organizationId: string;
  onUpsert: (data: any) => Promise<any>;
  onDelete: (data: any) => Promise<any>;
  onDuplicate: (data: any) => Promise<any>;
  onReorder: (data: any) => Promise<any>;
}

export function ItemsList({ items, costStudyId, organizationId, onDelete, onDuplicate }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Phase 7: سيُستبدل هذا بـ ItemCard موحَّدة فيها 4 أقسام قابلة للطي
      </p>
      {items.map((item) => (
        <Card key={item.id} className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{item.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {Number(item.effectiveQuantity).toFixed(2)} {item.unit} ·
              تكلفة: {Number(item.totalCost ?? 0).toFixed(2)} ر.س ·
              بيع: {Number(item.sellTotalAmount ?? 0).toFixed(2)} ر.س
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicate({ id: item.id, costStudyId, organizationId })}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete({ id: item.id, costStudyId, organizationId })}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

## 6.14 — `shared/LoadingSkeleton.tsx` و `shared/ErrorState.tsx`

```tsx
// LoadingSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
```

```tsx
// ErrorState.tsx
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface Props {
  error: { message?: string } | null;
}

export function ErrorState({ error }: Props) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h3 className="text-lg font-semibold">حدث خطأ في تحميل البيانات</h3>
      <p className="text-sm text-muted-foreground">{error?.message ?? "خطأ غير معروف"}</p>
    </Card>
  );
}
```

## 6.15 — التكامل المؤقت في QuantitiesSubTabs

افتح `apps/web/modules/saas/pricing/components/studies/QuantitiesSubTabs.tsx` بحذر شديد.

أضف tab جديد conditional على feature flag (لا تلمس المنطق القديم):

```tsx
const isUnifiedEnabled = process.env.NEXT_PUBLIC_FEATURE_UNIFIED_QUANTITIES === "1";

// في TabsList الموجودة:
{isUnifiedEnabled && (
  <TabsTrigger value="unified">تشطيبات + MEP (موحَّد) ✨</TabsTrigger>
)}

// في الـ Tabs:
{isUnifiedEnabled && (
  <TabsContent value="unified">
    <UnifiedItemsWorkspace
      costStudyId={studyId}
      organizationId={organizationId}
    />
  </TabsContent>
)}
```

## 6.16 — تشغيل واختبار يدوي

```powershell
# .env.local
echo NEXT_PUBLIC_FEATURE_UNIFIED_QUANTITIES=1 >> apps\web\.env.local

pnpm dev
```

افتح المتصفح:
1. ✅ التبويب الجديد يظهر في الـ tabs
2. ✅ EmptyState يظهر لو لا بنود
3. ✅ "بند جديد" يفتح Drawer من اليمين
4. ✅ Drawer فيه 102 بند منظَّمة (4 domains)
5. ✅ البحث يفلتر فعلياً
6. ✅ النقر على بند يضيفه (placeholder list يظهره)
7. ✅ "باقات جاهزة" يعرض 8 presets
8. ✅ تطبيق preset يضيف 18+ بند (للفيلا)
9. ✅ Toast نجاح يظهر
10. ✅ زر حذف يحذف البند

## ✅ معيار اجتياز Phase 6

```
✅ Phase 6 Complete — UI Foundation:

📁 Files (~14 ملف):
- UnifiedItemsWorkspace.tsx ✓
- catalog-picker/ (5 ملفات) ✓
- items-list/ (2 placeholder) ✓
- shared/ (3 ملفات) ✓
- hooks/ (3 ملفات) ✓
- types.ts ✓

🧪 Manual Testing (10 سيناريوهات):
- التبويب يفتح ✓
- EmptyState ✓
- Drawer الكتالوج ✓
- 102 بند منظَّمة ✓
- البحث يفلتر ✓
- إضافة بند ✓
- 8 presets ✓
- تطبيق preset ✓
- Toast نجاح ✓
- حذف بند ✓

🔧 Build:
- tsc: ✓ zero errors
- Console: لا أخطاء

📦 Git: feat(unified-quantities): Phase 6 - UI foundation

⏸ في انتظار تأكيدك للبدء بـ Phase 7 (البطاقة الموحَّدة).
```

---

# 📍 Phase 7 — البطاقة الموحَّدة بأقسامها الـ 4

**الهدف:** قلب الواجهة — البطاقة الذكية مع Bi-directional binding.
**المدة:** 3 ساعات (الأصعب).

## 7.1 — البنية

```
apps/web/modules/saas/pricing/components/unified-quantities/
├── item-card/
│   ├── ItemCard.tsx                       (~250 سطر)
│   ├── ItemCardHeader.tsx                 (~180 سطر)
│   ├── ItemCardActions.tsx                (~80 سطر)
│   └── index.ts
│
├── sections/
│   ├── QuantitySection.tsx                (~220 سطر)
│   ├── SpecificationsSection.tsx          (~180 سطر)
│   ├── CostSection.tsx                    (~180 سطر)
│   ├── PricingSection.tsx                 (~280 سطر — الأذكى)
│   └── index.ts
│
├── inputs/
│   ├── BiDirectionalPriceInput.tsx        (~150 سطر)
│   ├── DimensionInput.tsx                 (~100 سطر)
│   ├── WastageSlider.tsx                  (~80 سطر)
│   ├── MarkupMethodSelector.tsx           (~100 سطر)
│   ├── MaterialPicker.tsx                 (~180 سطر)
│   └── index.ts
│
└── hooks/
    ├── useBiDirectionalPricing.ts         (~180 سطر)
    └── useItemUpdate.ts                   (~120 سطر)
```

## 7.2 — `hooks/useBiDirectionalPricing.ts` (المركز الذكي)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { orpc } from "@/lib/orpc-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { QuantityItem, PricingField, MarkupMethod } from "../types";

export function useBiDirectionalPricing(item: QuantityItem) {
  const queryClient = useQueryClient();

  const [local, setLocal] = useState({
    materialUnitPrice: Number(item.materialUnitPrice ?? 0),
    laborUnitPrice: Number(item.laborUnitPrice ?? 0),
    markupMethod: item.markupMethod as MarkupMethod,
    markupPercent: Number(item.markupPercent ?? 30),
    markupFixedAmount: Number(item.markupFixedAmount ?? 0),
    manualUnitPrice: Number(item.manualUnitPrice ?? 0),
    sellUnitPrice: Number(item.sellUnitPrice ?? 0),
    sellTotalAmount: Number(item.sellTotalAmount ?? 0),
    profitAmount: Number(item.profitAmount ?? 0),
    profitPercent: Number(item.profitPercent ?? 0),
    hasCustomMarkup: item.hasCustomMarkup,
  });

  // Sync مع item عند تغيره من الخارج
  useEffect(() => {
    setLocal({
      materialUnitPrice: Number(item.materialUnitPrice ?? 0),
      laborUnitPrice: Number(item.laborUnitPrice ?? 0),
      markupMethod: item.markupMethod as MarkupMethod,
      markupPercent: Number(item.markupPercent ?? 30),
      markupFixedAmount: Number(item.markupFixedAmount ?? 0),
      manualUnitPrice: Number(item.manualUnitPrice ?? 0),
      sellUnitPrice: Number(item.sellUnitPrice ?? 0),
      sellTotalAmount: Number(item.sellTotalAmount ?? 0),
      profitAmount: Number(item.profitAmount ?? 0),
      profitPercent: Number(item.profitPercent ?? 0),
      hasCustomMarkup: item.hasCustomMarkup,
    });
  }, [item.id, item.updatedAt]);

  const mutation = orpc.unifiedQuantities.pricing.updatePricing.useMutation({
    onSuccess: (result: any) => {
      // حدِّث local من السيرفر (الحقيقة المطلقة)
      setLocal({
        materialUnitPrice: Number(result.item.materialUnitPrice ?? 0),
        laborUnitPrice: Number(result.item.laborUnitPrice ?? 0),
        markupMethod: result.item.markupMethod,
        markupPercent: Number(result.item.markupPercent ?? 0),
        markupFixedAmount: Number(result.item.markupFixedAmount ?? 0),
        manualUnitPrice: Number(result.item.manualUnitPrice ?? 0),
        sellUnitPrice: Number(result.item.sellUnitPrice ?? 0),
        sellTotalAmount: Number(result.item.sellTotalAmount ?? 0),
        profitAmount: Number(result.item.profitAmount ?? 0),
        profitPercent: Number(result.item.profitPercent ?? 0),
        hasCustomMarkup: result.item.hasCustomMarkup,
      });

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["unifiedQuantities.getItems"] });
      queryClient.invalidateQueries({ queryKey: ["unifiedQuantities.pricing.getStudyTotals"] });
    },
    onError: (err) => {
      toast.error("فشل تحديث السعر: " + err.message);
      // local سيُعاد sync عبر useEffect
    },
  });

  const debouncedUpdate = useDebouncedCallback((field: PricingField, value: number) => {
    mutation.mutate({
      id: item.id,
      costStudyId: item.costStudyId,
      organizationId: item.organizationId,
      changedField: field,
      newValue: value,
    });
  }, 400);

  // Optimistic local update + debounced API call
  const updateField = (field: PricingField, value: number) => {
    setLocal((prev) => {
      const next = { ...prev };
      const effectiveQty = Number(item.effectiveQuantity);

      switch (field) {
        case "material_unit_price":
          next.materialUnitPrice = value;
          // حساب السعر فوراً بنفس الـ markup الحالي
          const newUnitCost1 = next.materialUnitPrice + next.laborUnitPrice;
          if (next.markupMethod === "percentage") {
            next.sellUnitPrice = newUnitCost1 * (1 + next.markupPercent / 100);
          } else if (next.markupMethod === "fixed_amount") {
            next.sellUnitPrice = newUnitCost1 + next.markupFixedAmount;
          }
          // manual_price: السعر اليدوي ثابت، فقط الربح يتغير
          break;

        case "labor_unit_price":
          next.laborUnitPrice = value;
          const newUnitCost2 = next.materialUnitPrice + next.laborUnitPrice;
          if (next.markupMethod === "percentage") {
            next.sellUnitPrice = newUnitCost2 * (1 + next.markupPercent / 100);
          } else if (next.markupMethod === "fixed_amount") {
            next.sellUnitPrice = newUnitCost2 + next.markupFixedAmount;
          }
          break;

        case "markup_percent":
          next.markupMethod = "percentage";
          next.markupPercent = value;
          next.hasCustomMarkup = true;
          next.sellUnitPrice = (next.materialUnitPrice + next.laborUnitPrice) * (1 + value / 100);
          break;

        case "markup_fixed_amount":
          next.markupMethod = "fixed_amount";
          next.markupFixedAmount = value;
          next.hasCustomMarkup = true;
          next.sellUnitPrice = (next.materialUnitPrice + next.laborUnitPrice) + value;
          break;

        case "manual_unit_price":
          next.markupMethod = "manual_price";
          next.manualUnitPrice = value;
          next.sellUnitPrice = value;
          next.hasCustomMarkup = true;
          break;

        case "sell_unit_price":
          // Single-source rule: تعديل السعر يقفل الـ markup كـ manual
          next.markupMethod = "manual_price";
          next.manualUnitPrice = value;
          next.sellUnitPrice = value;
          next.hasCustomMarkup = true;
          // احسب implied markup % للعرض
          const cost1 = next.materialUnitPrice + next.laborUnitPrice;
          if (cost1 > 0) {
            next.markupPercent = ((value - cost1) / cost1) * 100;
          }
          break;

        case "sell_total_amount":
          if (effectiveQty > 0) {
            const newUnitPrice = value / effectiveQty;
            next.markupMethod = "manual_price";
            next.manualUnitPrice = newUnitPrice;
            next.sellUnitPrice = newUnitPrice;
            next.sellTotalAmount = value;
            next.hasCustomMarkup = true;
            const cost2 = next.materialUnitPrice + next.laborUnitPrice;
            if (cost2 > 0) {
              next.markupPercent = ((newUnitPrice - cost2) / cost2) * 100;
            }
          }
          break;
      }

      // إعادة حساب الإجماليات والربح محلياً
      next.sellTotalAmount = next.sellUnitPrice * effectiveQty;
      const totalCost = (next.materialUnitPrice + next.laborUnitPrice) * effectiveQty;
      next.profitAmount = next.sellTotalAmount - totalCost;
      next.profitPercent = next.sellTotalAmount > 0
        ? (next.profitAmount / next.sellTotalAmount) * 100
        : 0;

      return next;
    });

    debouncedUpdate(field, value);
  };

  return {
    ...local,
    updateField,
    isLoading: mutation.isPending,
  };
}
```

## 7.3 — `inputs/BiDirectionalPriceInput.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  isLoading?: boolean;
  precision?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function BiDirectionalPriceInput({
  label, value, unit, onChange, isLoading, precision = 2, min = 0, max, disabled,
}: Props) {
  const [local, setLocal] = useState(value.toFixed(precision));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(value.toFixed(precision));
  }, [value, precision, focused]);

  const commit = () => {
    setFocused(false);
    const parsed = Number.parseFloat(local.replace(/,/g, ""));
    if (Number.isFinite(parsed) && parsed !== value) {
      let clamped = parsed;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className={`pe-12 tabular-nums ${isLoading ? "opacity-50" : ""}`}
          disabled={disabled || isLoading}
        />
        {unit && (
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
```

## 7.4 — `sections/PricingSection.tsx` (الأذكى)

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { useBiDirectionalPricing } from "../hooks/useBiDirectionalPricing";
import { BiDirectionalPriceInput } from "../inputs/BiDirectionalPriceInput";
import { MarkupMethodSelector } from "../inputs/MarkupMethodSelector";
import type { QuantityItem, MarkupMethod } from "../types";

interface Props {
  item: QuantityItem;
  globalMarkupPercent: number;
}

export function PricingSection({ item, globalMarkupPercent }: Props) {
  const pricing = useBiDirectionalPricing(item);
  const effectiveQty = Number(item.effectiveQuantity);
  const totalCost = (pricing.materialUnitPrice + pricing.laborUnitPrice) * effectiveQty;
  const isProfit = pricing.profitAmount >= 0;

  const handleToggleCustomMarkup = (custom: boolean) => {
    if (custom) {
      // تفعيل: اجعل المستخدم يحدد قيمة فعلية
      pricing.updateField("markup_percent", pricing.markupPercent || globalMarkupPercent);
    } else {
      // عودة للعام: استخدم Global
      pricing.updateField("markup_percent", globalMarkupPercent);
      // ملاحظة: hasCustomMarkup سيصبح true بسبب التعديل الصريح
      // للعودة الكاملة لـ Global، نحتاج endpoint منفصل (لاحقاً)
    }
  };

  return (
    <Card className="border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            📊 الربح والسعر النهائي
          </h4>
          <div className="flex items-center gap-2">
            <Switch
              id={`custom-markup-${item.id}`}
              checked={pricing.hasCustomMarkup}
              onCheckedChange={handleToggleCustomMarkup}
            />
            <Label htmlFor={`custom-markup-${item.id}`} className="text-xs">
              هامش خاص
              {!pricing.hasCustomMarkup && (
                <span className="ms-1 text-muted-foreground">
                  (الآن يتبع العام {globalMarkupPercent.toFixed(0)}%)
                </span>
              )}
            </Label>
          </div>
        </div>

        {/* Markup Method (إذا custom) */}
        {pricing.hasCustomMarkup && (
          <MarkupMethodSelector
            value={pricing.markupMethod}
            onChange={(method) => {
              if (method === "percentage") {
                pricing.updateField("markup_percent", pricing.markupPercent || 30);
              } else if (method === "fixed_amount") {
                pricing.updateField("markup_fixed_amount", pricing.markupFixedAmount || 5);
              } else if (method === "manual_price") {
                pricing.updateField("manual_unit_price", pricing.sellUnitPrice);
              }
            }}
          />
        )}

        {/* Inputs - 3 حقول bi-directional */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Markup field حسب method */}
          {pricing.markupMethod === "percentage" && (
            <BiDirectionalPriceInput
              label="نسبة الربح"
              value={pricing.markupPercent}
              unit="%"
              onChange={(v) => pricing.updateField("markup_percent", v)}
              isLoading={pricing.isLoading}
              precision={1}
              min={-50}
              max={1000}
            />
          )}

          {pricing.markupMethod === "fixed_amount" && (
            <BiDirectionalPriceInput
              label="ربح ثابت/وحدة"
              value={pricing.markupFixedAmount}
              unit="ر.س"
              onChange={(v) => pricing.updateField("markup_fixed_amount", v)}
              isLoading={pricing.isLoading}
            />
          )}

          {pricing.markupMethod === "manual_price" && (
            <div className="md:col-span-1 flex items-center text-xs text-muted-foreground">
              <Info className="me-2 h-4 w-4" />
              <span>السعر اليدوي يتجاوز الحساب</span>
            </div>
          )}

          <BiDirectionalPriceInput
            label="سعر الوحدة"
            value={pricing.sellUnitPrice}
            unit={`ر.س/${item.unit}`}
            onChange={(v) => pricing.updateField("sell_unit_price", v)}
            isLoading={pricing.isLoading}
          />

          <BiDirectionalPriceInput
            label="إجمالي البيع"
            value={pricing.sellTotalAmount}
            unit="ر.س"
            onChange={(v) => pricing.updateField("sell_total_amount", v)}
            isLoading={pricing.isLoading}
          />
        </div>

        {/* النتيجة */}
        <div className="rounded-lg border border-violet-200 bg-white p-3 dark:border-violet-800 dark:bg-violet-950/40">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">إجمالي التكلفة</p>
              <p className="font-medium tabular-nums">{totalCost.toFixed(2)} ر.س</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي البيع</p>
              <p className="font-medium tabular-nums">{pricing.sellTotalAmount.toFixed(2)} ر.س</p>
            </div>
            <div className="col-span-2 border-t pt-2">
              <div className="flex items-center gap-2">
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isProfit ? "صافي الربح" : "خسارة"}
                </span>
              </div>
              <p className={`mt-1 text-lg font-bold tabular-nums ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                {pricing.profitAmount.toFixed(2)} ر.س
                <span className="ms-2 text-sm font-normal">
                  ({pricing.profitPercent.toFixed(1)}% من البيع)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* تحذير الخسارة */}
        {!isProfit && pricing.sellTotalAmount > 0 && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            ⚠️ السعر الحالي أقل من التكلفة. تحقق من الأرقام أو ارفع السعر.
          </div>
        )}
      </div>
    </Card>
  );
}
```

## 7.5 — Sections الباقية (Quantity, Cost, Specifications)

اتبع نفس النمط:
- `QuantitySection`: حقول حسب `calculationMethod`، خصم فتحات، slider هدر
- `CostSection`: حقلين `materialUnitPrice` + `laborUnitPrice` فقط
- `SpecificationsSection`: `MaterialPicker` + 4 حقول نصية

استخدم `useDebouncedCallback` مع `onUpdate` (المرسل من ItemCard) — لا تستدعِ `useBiDirectionalPricing` فيها (هذا فقط في PricingSection).

## 7.6 — `item-card/ItemCard.tsx` (الـ Container)

البنية:
- `ItemCardHeader` يعرض الإجمالي الحي (دائم الظهور)
- زر تبديل expand/collapse
- إذا `isExpanded`: 4 أقسام كل واحد `Collapsible`
- localStorage يحفظ `{ expanded, sections }` per-item

استخدم `localStorage` key = `unified-item-${item.id}`.

## 7.7 — اختبار يدوي شامل

افتح التبويب الجديد:
1. ✅ أضف بند "دهان داخلي"
2. ✅ افتح البطاقة (ينبسط 4 أقسام)
3. ✅ أدخل الكمية 10×3 → الإجمالي 30 م² يظهر
4. ✅ فعّل خصم الفتحات → warning يظهر
5. ✅ أدخل تكلفة 18+7 → 25 ر.س/م²
6. ✅ Global Markup 30% → السعر 32.5 ر.س
7. ✅ فعّل "هامش خاص" → غيّر النسبة 40% → السعر 35
8. ✅ غيّر سعر الوحدة لـ 50 → النسبة تصير ~100%
9. ✅ غيّر الإجمالي لـ 1500 → كل شيء يتحدّث
10. ✅ **لا infinite loops** — الأهم!

## ✅ معيار اجتياز Phase 7

```
✅ Phase 7 Complete — Unified Card:

📁 (~14 ملف):
- item-card/ (3) ✓
- sections/ (4) ✓
- inputs/ (5) ✓
- hooks/ (2) ✓

🧪 Manual Testing (10):
- البطاقة تنبسط ✓
- 4 أقسام collapsible ✓
- Bi-directional binding ✓
- لا infinite loops ✓
- Optimistic updates سريعة ✓
- localStorage يحفظ الحالة ✓

🔧 Build:
- tsc: ✓
- pnpm dev: ✓

📦 Git: feat(unified-quantities): Phase 7 - Unified card

⏸ في انتظار تأكيدك للبدء بـ Phase 8.
```

---

# 📍 Phase 8 — Mini Dashboard + Global Markup + Context Drawer

**الهدف:** Header الذكي + إدارة السياق المشترك.
**المدة:** 2-2.5 ساعة.

## 8.1 — البنية

```
unified-quantities/
├── workspace-header/
│   ├── StudyHeader.tsx               (~200 سطر)
│   ├── MiniPnLCard.tsx               (~150 سطر)
│   └── GlobalMarkupControl.tsx       (~180 سطر)
│
├── context-drawer/
│   ├── ContextDrawer.tsx             (~150 سطر)
│   ├── GeneralContextForm.tsx        (~180 سطر)
│   ├── SpacesManager.tsx             (~180 سطر)
│   ├── SpaceFormDialog.tsx           (~180 سطر)
│   ├── OpeningsManager.tsx           (~180 سطر)
│   └── OpeningFormDialog.tsx         (~150 سطر)
│
└── hooks/
    ├── useStudyTotals.ts             (~50 سطر)
    └── useGlobalMarkup.ts            (~80 سطر)
```

## 8.2 — `MiniPnLCard.tsx`

3 بطاقات جنباً إلى جنب:
- 💰 إجمالي التكلفة (مع تقسيم مادة/عمالة بـ %)
- 💵 إجمالي البيع
- 📈 صافي الربح + النسبة (أخضر إيجابي / أحمر سالب)

`tabular-nums` على كل الأرقام.
استخدم `Number.toLocaleString("en-US", { minimumFractionDigits: 2 })`.

## 8.3 — `GlobalMarkupControl.tsx`

- Slider 0-100% مع debounce 600ms
- زر "📌 طبّق على الكل" — `AlertDialog` بتأكيد قوي
  - يعرض عدد البنود المخصصة التي ستُمسح
  - "نعم، طبّق على الكل" يستدعي `applyMode: "all_items"`
- العرض المباشر: Slider يُطبّق `non_custom_only` تلقائياً
- عداد "X بند مخصص" بـ amber warning لو > 0

## 8.4 — `StudyHeader.tsx`

```tsx
<div className="space-y-3">
  <MiniPnLCard ... />
  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
    <div className="md:col-span-2">
      <GlobalMarkupControl ... />
    </div>
    <Card className="flex flex-col gap-2 p-4">
      <Button onClick={onGenerateQuote} size="lg" variant="default">
        <FileText className="me-2 h-5 w-5" />
        إنشاء عرض سعر
      </Button>
      <Button onClick={onOpenContext} variant="outline" size="sm">
        <Settings2 className="me-2 h-4 w-4" />
        السياق المشترك
      </Button>
    </Card>
  </div>
</div>
```

استبدل الـ Header المؤقت في `UnifiedItemsWorkspace` بـ `StudyHeader`.

## 8.5 — Context Drawer

`ContextDrawer` بـ Sheet من الأسفل (`side="bottom"`)، فيه `Tabs`:
1. **عام** — `GeneralContextForm`: مساحات كلية + flags + حوش
2. **الغرف** — `SpacesManager`: قائمة + Dialog
3. **الفتحات** — `OpeningsManager`: قائمة + Dialog

كل form يستخدم `useDebouncedCallback` + `orpc.unifiedQuantities.context.update`.

## 8.6 — `SpaceFormDialog.tsx` و `OpeningFormDialog.tsx`

- `react-hook-form` + `zodResolver`
- حقول: name, type, dimensions, isWetArea, isExterior
- زر حفظ + إلغاء
- بعد الحفظ: `queryClient.invalidateQueries(["unifiedQuantities.context.get"])`

## ✅ معيار اجتياز Phase 8

```
✅ Phase 8 Complete:

📁 (~10 ملفات):
- workspace-header/ (3) ✓
- context-drawer/ (6) ✓
- hooks/ (2) ✓

🧪 Manual Testing:
- Mini PnL يتحدّث مع كل تعديل ✓
- Global Markup slider يعمل (debounced) ✓
- "طبّق على الكل" يعرض confirmation ✓
- Context Drawer يفتح بسلاسة ✓
- إضافة غرفة → SpaceFormDialog ✓
- إضافة فتحة → OpeningFormDialog ✓
- خصم الفتحات في البنود يعمل ✓

📦 Git: feat(unified-quantities): Phase 8 - Dashboard & Context

⏸ في انتظار تأكيدك للبدء بـ Phase 9 (Quote PDF).
```

---

# 📍 Phase 9 — Quote Drawer + PDF Generation

**الهدف:** زر "إنشاء عرض سعر" → Drawer → PDF احترافي.
**المدة:** 2-2.5 ساعة.

## 9.1 — البنية

```
unified-quantities/
├── quote/
│   ├── QuoteDrawer.tsx                (~250 سطر)
│   ├── QuoteSettingsForm.tsx          (~180 سطر)
│   ├── QuoteTermsEditor.tsx           (~120 سطر)
│   ├── QuotePreview.tsx               (~250 سطر — للمعاينة + PDF)
│   └── pdf-styles.ts                  (~100 سطر — print CSS)
│
└── hooks/
    └── useQuoteGeneration.ts          (~100 سطر)
```

## 9.2 — `QuoteDrawer.tsx`

Sheet من اليمين (60% width)، فيه:

```tsx
<Sheet>
  <SheetContent side="end" className="w-full sm:max-w-3xl">
    <SheetHeader>
      <SheetTitle>إنشاء عرض سعر</SheetTitle>
    </SheetHeader>
    <Tabs defaultValue="settings">
      <TabsList>
        <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        <TabsTrigger value="terms">الشروط</TabsTrigger>
        <TabsTrigger value="preview">معاينة</TabsTrigger>
      </TabsList>
      <TabsContent value="settings">
        <QuoteSettingsForm ... />
      </TabsContent>
      <TabsContent value="terms">
        <QuoteTermsEditor ... />
      </TabsContent>
      <TabsContent value="preview">
        <QuotePreview ... />
      </TabsContent>
    </Tabs>
    <div className="flex gap-2 border-t p-4">
      <Button variant="outline" onClick={handleSaveDraft}>حفظ كمسودة</Button>
      <Button onClick={handleGeneratePDF} className="bg-emerald-600">
        <Download className="me-2 h-4 w-4" />
        توليد PDF
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

## 9.3 — `QuoteSettingsForm.tsx`

`react-hook-form` + Zod schema:
- معلومات العميل: name, address, phone, email
- العرض: quoteNumber (auto)، issueDate (today)، validUntil (today + 30)
- المشروع: name, address
- VAT: includeVAT (checkbox)

## 9.4 — `QuoteTermsEditor.tsx`

Textareas:
- شروط الدفع (مثل: "30% مقدم، 60% أثناء التنفيذ، 10% عند التسليم")
- مدة التنفيذ (مثل: "60 يوم عمل")
- شروط الضمان (مثل: "ضمان سنة على التشطيبات")
- ملاحظات إضافية

## 9.5 — `QuotePreview.tsx` (الأهم — PDF rules)

⚠️ **قواعد PDF الحرجة من memory:**

```css
@media print {
  /* Footer ثابت على كل الصفحات */
  [data-pdf-footer] {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 10;
  }

  /* الـ body padding يُحجز للـ footer */
  [data-pdf-body] {
    padding-bottom: var(--pdf-footer-reserve, 45mm);
  }

  /* دفاعات حاسمة — أي ancestor بـ transform/filter/contain يكسر position:fixed */
  #quote-print-area,
  #quote-print-area * {
    transform: none !important;
    filter: none !important;
    contain: none !important;
    will-change: auto !important;
  }

  #quote-print-area {
    overflow: visible !important;
  }

  /* Page setup */
  @page {
    size: A4;
    margin: 15mm 12mm;
  }
}
```

```tsx
// QuotePreview.tsx
useEffect(() => {
  // قياس footer height ديناميكياً
  const footer = document.querySelector("[data-pdf-footer]");
  if (footer) {
    const height = footer.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--pdf-footer-reserve", `${height + 10}mm`);
  }
}, []);
```

**ممنوع:**
- استخدام U+FDFC (﷼) — استخدم "ر.س"
- `display: none` على tfoot — يحذف position:fixed children
- transform/filter على ancestors

**موصى:**
- `@page { size: A4 }`
- `tabular-nums` على كل الأرقام
- Save فحص الإجماليات (subtotal + VAT = total)
- فاتورة كاملة بـ logo, client info, items table, totals, terms, signature line

## 9.6 — توليد PDF

استخدم `window.print()` كأبسط حل. لو احتجت Puppeteer لاحقاً:
- API endpoint جديد على الخلفية يستقبل HTML
- يستخدم Puppeteer لتوليد PDF
- يُرجع Buffer → frontend ينزّله

في Phase 9 نبدأ بـ `window.print()` مع CSS print rules صحيحة.

## ✅ معيار اجتياز Phase 9

```
✅ Phase 9 Complete — Quote & PDF:

📁 (5 ملفات):
- QuoteDrawer.tsx ✓
- QuoteSettingsForm.tsx ✓
- QuoteTermsEditor.tsx ✓
- QuotePreview.tsx (مع print CSS) ✓
- useQuoteGeneration.ts ✓

🧪 PDF Testing:
- Drawer يفتح ✓
- النموذج يحفظ بياناته (RHF) ✓
- المعاينة تعرض البنود ✓
- زر توليد PDF يستدعي window.print() ✓
- Footer ثابت على كل الصفحات ✓
- لا transform issues ✓
- "ر.س" تظهر صحيحة (لا ﷼ مكسور) ✓
- VAT صحيح ✓
- الأرقام محاذاة (tabular-nums) ✓

📦 Git: feat(unified-quantities): Phase 9 - Quote PDF

⏸ في انتظار تأكيدك للبدء بـ Phase 10 (التكامل النهائي).
```

---

# 📍 Phase 10 — Feature Flag + Integration + Testing

**الهدف:** ربط النظام الجديد مع pipeline الدراسات + اختبار شامل.
**المدة:** 1-1.5 ساعة.

## 10.1 — Feature Flag على مستوى المنظمة

أضف لـ `Organization` model (أو settings):
```prisma
useUnifiedQuantitiesEngine Boolean @default(false)
```

(أو استخدم metadata field موجود)

## 10.2 — تعديل `useStudyConfig.ts`

```typescript
export function useStudyConfig(study: CostStudy) {
  // فحص feature flag
  const isUnifiedEnabled = useUnifiedFlag(study.organizationId);

  const useUnifiedWorkspace = isUnifiedEnabled &&
    (study.workScopes?.includes("FINISHING") || study.workScopes?.includes("MEP"));

  const enabledStages = useMemo(() => {
    if (useUnifiedWorkspace) {
      // النظام الجديد: stages مدمجة
      return ["QUANTITIES"];  // كل شيء في الكميات
    }
    // النظام القديم
    return ["QUANTITIES", "SPECIFICATIONS", "COSTING", "PRICING"];
  }, [useUnifiedWorkspace]);

  return { ..., useUnifiedWorkspace, enabledStages };
}
```

## 10.3 — تعديل `StudyPipelineStepper`

```tsx
{useUnifiedWorkspace ? (
  <StepperItem icon={Layers} label="الدراسة الكاملة" status="active" />
) : (
  <>
    <StepperItem icon={Calculator} label="الكميات" />
    <StepperItem icon={FileText} label="المواصفات" />
    <StepperItem icon={DollarSign} label="التكلفة" />
    <StepperItem icon={Tag} label="التسعير" />
  </>
)}
```

## 10.4 — تعديل StudySidebar (إن وُجد)

إذا `useUnifiedWorkspace`، أخفِ روابط:
- `/specifications`
- `/costing`
- `/pricing`

## 10.5 — Routes إعادة التوجيه

في صفحة `/specifications` (و الأخريات):
```tsx
useEffect(() => {
  if (useUnifiedWorkspace) {
    router.replace(`/pricing/studies/${studyId}/quantities`);
  }
}, [useUnifiedWorkspace]);
```

## 10.6 — اختبار شامل (3 سيناريوهات حقيقية)

### السيناريو 1: المقاول السريع
1. أنشئ دراسة جديدة (FULL_STUDY، workScopes=[FINISHING])
2. افتح الكميات
3. أضف "دهان داخلي"
4. أدخل 300 م²
5. تأكد: السعر النهائي = 25 × 1.30 = 32.5 ر.س × 300 = 9,750
6. اضغط "إنشاء عرض سعر"
7. أكمل النموذج
8. توليد PDF
9. **معايير النجاح:** كل شيء في صفحة واحدة. PDF احترافي. < 3 دقائق.

### السيناريو 2: المهندس التفصيلي
1. أنشئ دراسة (workScopes=[FINISHING, MEP])
2. طبّق Preset "فيلا" → 18 بند
3. افتح Context Drawer → أدخل 5 غرف، 12 فتحة
4. افتح كل بند، اضبط الكمية والتكلفة
5. عدّل Global Markup إلى 25%
6. عدّل بند "رخام" يدوياً إلى 45%
7. تحقق: Mini PnL يتحدّث، البند المخصص لم يتأثر
8. توليد عرض سعر مع شروط دفع كاملة

### السيناريو 3: Bi-directional Stress Test
1. بند بـ تكلفة 25 ر.س/م²، كمية 100 م²
2. عدّل markup_percent إلى 30 → sell_unit_price = 32.5
3. عدّل sell_unit_price إلى 50 → markup_percent = 100%
4. عدّل sell_total_amount إلى 6000 → sell_unit_price = 60، markup = 140%
5. عدّل markup_percent إلى 30 → كل شيء يرجع
6. **معايير النجاح:** لا infinite loops، لا قفزات في الأرقام، الإجماليات صحيحة دائماً

## 10.7 — Performance Check

```powershell
# في dev:
pnpm dev

# في المتصفح، افتح DevTools:
# - Network tab: تأكد لا spam requests (debounce يعمل)
# - Performance tab: record session كاملة
# - تأكد: التحديثات < 200ms response time
```

## 10.8 — Memory Update

أضف لـ memory جودت:
```
- New Unified Quantities System launched in production-ready state
- Branch: feat/unified-quantities-backend (merged or pending)
- 102 catalog items, 8 presets, 8 calc methods, 3 markup methods
- 913+ tests on backend, 100% on critical engines
- Migrated 5-page pricing pipeline to single-page workspace
- Bi-directional pricing with round-trip integrity
```

## ✅ معيار اجتياز Phase 10 (والمشروع كله)

```
✅ Phase 10 Complete — Integration & Testing:

🎯 Feature Flag:
- Organization-level toggle ✓
- useStudyConfig respects flag ✓
- Old/new system coexist ✓
- Routes redirect correctly ✓

🧪 Manual Testing (3 سيناريوهات):
- المقاول السريع (3 دقائق): ✓
- المهندس التفصيلي (15 دقيقة): ✓
- Bi-directional stress test: ✓

⚡ Performance:
- لا spam requests (debounce 400ms) ✓
- تحديثات UI < 200ms ✓
- لا infinite loops ✓
- تحميل صفحة < 2s ✓

🔧 Final Build:
- tsc: ✓ zero errors
- pnpm test: ✓ all passing
- pnpm build: ✓ ينجح

📦 Git: feat(unified-quantities): Phase 10 - Integration

═══════════════════════════════════════════════════════════════
  🎉 المشروع كامل 100% — جاهز لـ PR إلى main
═══════════════════════════════════════════════════════════════

📊 إحصائيات نهائية:
- Phases: 10/10 ✓
- Backend: 913 tests
- Frontend: 14 mini components, 4 sections, 5 inputs
- Catalog: 102 items + 8 presets
- Coverage: 94-100% on critical engines
- Files created: ~50
- Lines of code: ~8,000

⏸ جاهز لـ PR review و merge إلى main.
```

---

# 🆘 إذا واجهت مشكلة

### مشكلة: Infinite loop في Bi-directional
- تأكد `useEffect` يستخدم `[item.id, item.updatedAt]` فقط
- Local state لا يُحدَّث إلا عبر `updateField` أو `useEffect`
- لا تحدّث local state في render

### مشكلة: Optimistic update لا يعمل
- تأكد `onMutate` يلغي queries قبل setQueryData
- استخدم `cancelQueries` ثم `getQueryData` ثم `setQueryData`
- أرجع `previous` من `onMutate`

### مشكلة: PDF footer ينقطع
- تحقق من absence of `transform`, `filter`, `contain` على ancestors
- استخدم Chrome's print preview (لا Firefox — أخطاء معروفة)
- جرّب `@page { size: A4 portrait }` مع margins

### مشكلة: tsc errors بعد إضافة hook
- تأكد `orpc.unifiedQuantities.X.useQuery` exists
- شغّل `pnpm --filter database generate` لإعادة توليد types
- restart TypeScript server في VS Code

---

# ⏰ التوقفات الإلزامية

```
✋ بعد Phase 0.5 (التحقق)
✋ بعد Phase 6 (UI Foundation)
✋ بعد Phase 7 (البطاقة الموحَّدة)
✋ بعد Phase 8 (Dashboard)
✋ بعد Phase 9 (Quote PDF)
✋ بعد Phase 10 (Integration)
```

في كل توقف: اكتب `✅ Phase X Complete` ملخص شامل، ثم انتظر تأكيد جودت.

---

🚀 **ابدأ الآن بـ Phase 0.5.**
