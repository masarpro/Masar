# UI Rules & Guidelines

This document defines the practical rules for building UI components and pages. It includes patterns from both the current project (supastarter-nextjs-3) and Masar (supastarter-nextjs-1).

---

## Sidebar Layout Rules

### Current Project (supastarter-nextjs-3)

#### Configuration

```typescript
// config/index.ts
ui: {
  saas: {
    useSidebarLayout: true,  // Enable/disable sidebar
  }
}
```

#### Desktop Layout

```
Width: 280px fixed
Position: fixed, top-0, start-0 (left for LTR, right for RTL)
Height: 100vh (full viewport)

+------------------+--------------------------------+
|     NavBar       |                                |
|    (280px)       |     Main Content Area          |
|                  |        (ms-[280px])            |
|  Logo            |                                |
|  OrgSelect       |    rounded-3xl bg-card         |
|  Menu Items      |    min-h-full w-full           |
|  ...             |    py-6 px-4 md:p-8            |
|  User Menu       |                                |
+------------------+--------------------------------+
```

#### Mobile Layout

```
NavBar: Full width, stacked vertically
Menu: Horizontal scrollable (overflow-x-auto)
User Menu: Hidden in sidebar, shown in header

+--------------------------------------------+
|  Logo        [User Menu]                   |
+--------------------------------------------+
| [Start] [Chatbot] [Settings] [Admin] →→    |
+--------------------------------------------+
|                                            |
|            Main Content                    |
|                                            |
+--------------------------------------------+
```

#### Implementation (NavBar.tsx)

```tsx
<nav className={cn("w-full", {
  "w-full md:fixed md:top-0 md:start-0 md:h-full md:w-[280px]": useSidebarLayout,
})}>
```

---

### Masar Layout (supastarter-nextjs-1)

#### Architecture

```
+------------------+--------------------------------+
|     Header       |   (Sticky, glass blur, h-16)   |
+------------------+--------------------------------+
|                  |                                |
|   MasarSidebar   |        Main Content            |
|   (280px/80px)   |   (Gradient background)        |
|   Right-aligned  |   p-4 md:p-6 lg:p-8            |
|   Collapsible    |                                |
|                  |                                |
+------------------+--------------------------------+
```

#### Sidebar Widths

| State | Width | Tailwind Class |
|-------|-------|----------------|
| Expanded | 280px | `w-72` |
| Collapsed | 80px | `w-20` |

#### Gradient Background

```tsx
className="bg-[radial-gradient(farthest-corner_at_0%_0%,color-mix(in_oklch,var(--color-primary),transparent_95%)_0%,var(--color-background)_50%)]"
```

#### Collapsible State Management

```tsx
// MasarSidebar.tsx
const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

// Persist to localStorage
useEffect(() => {
  localStorage.setItem("masar-sidebar-collapsed", JSON.stringify(isCollapsed));
  window.dispatchEvent(new CustomEvent("masar-sidebar-toggle"));
}, [isCollapsed]);

// Listen in AppWrapper
useEffect(() => {
  const handleSidebarToggle = () => {
    const saved = localStorage.getItem("masar-sidebar-collapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  };
  window.addEventListener("masar-sidebar-toggle", handleSidebarToggle);
  return () => window.removeEventListener("masar-sidebar-toggle", handleSidebarToggle);
}, []);
```

---

## Menu Item Rules

### Current Project

#### Structure

```tsx
<Link
  href={menuItem.href}
  className={cn(
    "flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3",
    [menuItem.isActive ? "border-primary font-bold" : "border-transparent"],
    { "md:-mx-6 md:border-b-0 md:border-s-2 md:px-6 md:py-2": useSidebarLayout }
  )}
>
  <menuItem.icon className={`size-4 shrink-0 ${menuItem.isActive ? "text-primary" : "opacity-50"}`} />
  <span>{menuItem.label}</span>
</Link>
```

#### States

| State | Desktop (Sidebar) | Mobile (Horizontal) |
|-------|-------------------|---------------------|
| Default | `border-s-2 border-transparent` | `border-b-2 border-transparent` |
| Active | `border-s-2 border-primary font-bold` | `border-b-2 border-primary font-bold` |
| Icon Default | `opacity-50` | `opacity-50` |
| Icon Active | `text-primary` | `text-primary` |

### Masar Sidebar Items

#### Structure

```tsx
<Link
  href={item.path}
  className={cn(
    "flex items-center justify-between p-3 rounded-lg transition-all duration-200 relative",
    "hover:bg-slate-100 dark:hover:bg-slate-800",
    isActive(item.path) && "bg-primary/10 dark:bg-primary/20 text-primary font-medium",
  )}
>
  <div className="flex items-center gap-3">
    <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
    {!isCollapsed && <span className="text-sm">{item.title}</span>}
  </div>
  {!isCollapsed && renderBadge(item.badge)}
</Link>
```

#### CSS Classes

```css
.sidebar-item {
  @apply flex items-center gap-3 p-3 rounded-lg transition-all duration-200;
}

.sidebar-item:hover {
  @apply bg-slate-100 dark:bg-slate-800;
}

.sidebar-item.active {
  @apply bg-primary/10 dark:bg-primary/20 text-primary font-medium;
}

.sidebar-item.active::before {
  content: "";
  @apply absolute right-0 w-1 h-8 bg-primary rounded-l-full;
  animation: scaleIn 0.2s ease;
}
```

#### Badge Support

```tsx
const renderBadge = (badge?: { count: number; color: string }) => {
  if (!badge) return null;
  const colors = {
    primary: "bg-primary text-white",
    success: "bg-success text-white",
    warning: "bg-warning text-white",
    danger: "bg-danger text-white",
  };
  return (
    <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", colors[badge.color])}>
      {badge.count}
    </span>
  );
};
```

---

## Page Structure Rules

### Current SaaS Page Layout

```tsx
<AppWrapper>
  <PageHeader />
  <ContentArea>
    <Cards / Tables / Forms>
  </ContentArea>
</AppWrapper>
```

### AppWrapper Structure (Current)

```tsx
<div>
  <NavBar />
  <div className={cn("md:pe-4 py-4 flex", [
    config.ui.saas.useSidebarLayout ? "min-h-[calc(100vh)] md:ms-[280px]" : "",
  ])}>
    <main className="py-6 rounded-3xl bg-card px-4 md:p-8 min-h-full w-full">
      <div className="container px-0">{children}</div>
    </main>
  </div>
</div>
```

### AppWrapper Structure (Masar)

```tsx
<div className="bg-gradient-masar min-h-screen">
  <MasarSidebar defaultCollapsed={sidebarCollapsed} />
  <div className={cn(
    "transition-all duration-300 ease-in-out min-h-screen",
    "mr-0 lg:mr-72",
    sidebarCollapsed && "lg:mr-20",
  )}>
    <MasarHeader onMenuToggle={handleMenuToggle} />
    <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto max-w-7xl">{children}</div>
    </main>
  </div>
</div>
```

### Main Content Card

```css
/* Current */
rounded-3xl      /* 24px radius */
bg-card          /* Card background color */
px-4 md:p-8      /* Mobile: 16px, Desktop: 32px padding */
min-h-full       /* Minimum full height */
w-full           /* Full width */

/* Masar */
p-4 md:p-6 lg:p-8  /* Progressive padding */
min-h-[calc(100vh-4rem)]  /* Full height minus header */
```

---

## Header Rules (Masar)

### MasarHeader Structure

```tsx
<header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
  <div className="flex h-full items-center justify-between px-4 lg:px-6">
    {/* Right: Menu toggle, Search */}
    {/* Left: Notifications, Messages, Theme, User */}
  </div>
</header>
```

### Features

- **Height:** 64px (`h-16`)
- **Position:** Sticky
- **Glass effect:** `bg-white/80 backdrop-blur-md`
- **Search:** Ctrl+K keyboard shortcut
- **Notifications:** Badge with count
- **Theme toggle:** Sun/Moon icons

### Search Bar

```tsx
<div className="relative">
  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <input
    type="text"
    placeholder="ابحث في المشاريع..."
    className="w-80 lg:w-96 h-10 pr-10 pl-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary"
  />
  <kbd className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-slate-400 bg-slate-100 rounded border">
    Ctrl K
  </kbd>
</div>
```

---

## Dashboard Page Rules

### Container Queries

Use `@container` for responsive grids instead of viewport queries:

```tsx
<div className="@container">
  <div className="grid @2xl:grid-cols-3 gap-4">
    {/* Grid items */}
  </div>
</div>
```

### Stats Tiles (Current)

```tsx
<StatsTile
  title="Metric Name"
  value={123}
  valueFormat="number" | "currency" | "percentage"
  trend={0.12}  // Positive = green, Negative = red
>
  <StatsTileChart
    data={chartData}
    dataKey="metricKey"
    chartConfig={chartConfig}
    gradientId="uniqueGradientId"
  />
</StatsTile>
```

### Grid Breakpoints

| Container Size | Columns |
|----------------|---------|
| Default | 1 |
| `@2xl` (672px+) | 3 |

---

## Card Rules

### Basic Card

```tsx
<Card className="mt-6">
  <div className="p-8">
    {/* Content */}
  </div>
</Card>
```

### Card with Hover (Masar)

```tsx
<Card className="card-hover">
  {/* Content */}
</Card>
```

```css
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}
```

### Card with Header

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

---

## Form Rules

### Form Layout

```tsx
<form className="space-y-6">
  <FormField>
    <Label>Field Label</Label>
    <Input />
    <FormMessage />
  </FormField>

  <Button type="submit">Submit</Button>
</form>
```

### Input Styling

```tsx
<Input className="focus-visible:ring-ring" />
```

### Masar Search Input

```tsx
<input
  className="w-full h-12 pr-10 pl-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
/>
```

---

## Button Rules

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary actions |
| `secondary` | Secondary actions |
| `destructive` | Delete/danger actions |
| `outline` | Tertiary actions |
| `ghost` | Subtle actions |
| `link` | Text links |

### Sizes

| Size | Usage |
|------|-------|
| `sm` | Compact UI |
| `default` | Standard |
| `lg` | Hero sections |
| `icon` | Icon-only buttons |

---

## RTL Rules

### Always Use Logical Properties (Current)

```tsx
// Correct
className="ms-4 me-2 ps-6 pe-4 text-start border-s-2"

// Incorrect
className="ml-4 mr-2 pl-6 pr-4 text-left border-l-2"
```

### Masar Uses Physical (with flip)

```tsx
// Masar approach
className="mr-0 lg:mr-72"  // Physical properties

// RTL flip class
[dir="rtl"] .flip-rtl { transform: scaleX(-1); }
```

### Directional Icons

```tsx
// Current
<ChevronRightIcon className="size-4 rtl-flip" />

// Masar
<ChevronLeft className="w-5 h-5 flip-rtl" />
```

### Text Direction

Handled automatically by `Document.tsx`:

```tsx
<html lang={locale} dir={isRtl ? "rtl" : "ltr"}>
```

---

## Responsive Rules

### Breakpoint Usage

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | 0+ | Mobile first |
| `sm:` | 640px+ | Small tablets |
| `md:` | 768px+ | Tablets/sidebar shows |
| `lg:` | 1024px+ | Desktops |
| `xl:` | 1280px+ | Large desktops |
| `2xl:` | 1536px+ | Extra large |

### Mobile First Pattern

```tsx
// Mobile → Desktop
className="flex flex-col md:flex-row"
className="px-4 md:px-8"
className="hidden md:block"
```

### Container Queries Pattern

```tsx
// For component-level responsive
<div className="@container">
  <div className="@md:grid-cols-2 @2xl:grid-cols-3">
```

### Masar Progressive Padding

```tsx
className="p-4 md:p-6 lg:p-8"
```

---

## Color Usage Rules

### Backgrounds

| Element | Class |
|---------|-------|
| Page | `bg-background` |
| Main content | `bg-card` |
| Popovers | `bg-popover` |
| Muted sections | `bg-muted` |
| Accent areas | `bg-accent` |
| Glass (Masar) | `bg-white/80 backdrop-blur-md` |

### Text Colors

| Element | Class |
|---------|-------|
| Primary text | `text-foreground` |
| On card | `text-card-foreground` |
| Muted text | `text-muted-foreground` |
| On popover | `text-popover-foreground` |

### Interactive States

| State | Class |
|-------|-------|
| Primary | `bg-primary text-primary-foreground` |
| Secondary | `bg-secondary text-secondary-foreground` |
| Destructive | `bg-destructive text-destructive-foreground` |
| Success | `bg-success text-success-foreground` |
| Warning (Masar) | `bg-warning text-white` |
| Danger (Masar) | `bg-danger text-white` |

### Active States (Masar)

```css
bg-primary/10 dark:bg-primary/20 text-primary font-medium
```

---

## Spacing Rules

### Component Spacing

| Context | Value |
|---------|-------|
| Between related elements | `gap-2` (8px) |
| Menu items (Masar) | `gap-3` (12px) |
| Between sections | `gap-4` (16px) or `gap-6` (24px) |
| Page sections | `mt-6` (24px) or `mt-8` (32px) |

### Padding

| Context | Value |
|---------|-------|
| Mobile card | `px-4` (16px) |
| Desktop card | `p-8` (32px) |
| Container | `px-6` (24px) via `padding-inline: 1.5rem` |
| Masar progressive | `p-4 md:p-6 lg:p-8` |

---

## Animation Rules

### Entry Animations

```tsx
// Current (tailwind-animate)
className="animate-in fade-in"
className="animate-in slide-in-from-bottom"
className="animate-in fade-in slide-in-from-bottom duration-200"

// Masar
className="animate-fade-in-up"
className="animate-slide-up"
className="animate-scale-in"
```

### Exit Animations

```tsx
className="animate-out fade-out"
className="animate-out slide-out-to-top"
```

### Stagger Animation (Masar)

```tsx
<div className="stagger-children">
  <div>First (0.1s delay)</div>
  <div>Second (0.2s delay)</div>
  <div>Third (0.3s delay)</div>
</div>
```

### Duration

```tsx
className="duration-150"  // Fast (default)
className="duration-200"  // Normal
className="duration-300"  // Slow
```

### Transitions (Masar)

```css
transition: transform var(--transition-base), box-shadow var(--transition-base);
/* --transition-base: 300ms ease */
```

---

## Scrollbar Rules

### Hide Scrollbar

```css
@utility no-scrollbar {
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

Usage:
```tsx
<ul className="no-scrollbar overflow-x-auto">
<nav className="overflow-y-auto h-[calc(100vh-8rem)] no-scrollbar">
```

---

## z-index Layers

| Layer | z-index | Usage |
|-------|---------|-------|
| Content | auto | Default content |
| Sticky | 10 | Sticky headers |
| Sidebar | 50 | MasarSidebar |
| Header | 40 | MasarHeader |
| Mobile Overlay | 40 | Sidebar backdrop |
| Modal Overlay | 50 | Modal backgrounds |
| Modal | 50 | Modal content |
| Popover | 55 | Dropdowns, tooltips |
| Mobile Search | 60 | Masar search modal |
| Toast | 100 | Toast notifications |

---

## Bilingual Menu (Masar)

### Menu Item Structure

```tsx
interface MenuItem {
  id: string;
  title: string;      // Arabic
  titleEn: string;    // English
  icon: string;
  path?: string;
  action?: string;
  badge?: { count: number; color: string };
  children?: MenuItem[];
}
```

### Example Menu

```tsx
const menuItems = [
  {
    id: "dashboard",
    title: "الرئيسية",
    titleEn: "Dashboard",
    icon: "LayoutDashboard",
    path: "/app",
  },
  {
    id: "projects",
    title: "المشاريع",
    titleEn: "Projects",
    icon: "FolderKanban",
    path: "/app/projects",
    badge: { count: 12, color: "primary" },
    children: [
      { id: "projects-list", title: "قائمة المشاريع", ... },
      { id: "cost-study", title: "دراسة التكاليف", ... },
    ],
  },
];
```

---

## Quick Reference

### New Page Checklist

1. Wrap with `AppWrapper`
2. Use `@container` for responsive grids
3. Apply `rounded-3xl bg-card` to content cards
4. Use logical properties (`ms-`, `me-`, `start`, `end`)
5. Test in both LTR and RTL modes
6. Test mobile and desktop layouts

### New Component Checklist

1. Use design tokens (colors, spacing, radius)
2. Support dark mode
3. Use logical properties for RTL
4. Follow existing component patterns
5. Add appropriate animations
6. Consider reduced motion preferences

### Masar-Specific Checklist

1. Include bilingual labels (title, titleEn)
2. Support collapsed sidebar state
3. Add hover effects (`.card-hover`)
4. Use glass morphism for headers
5. Include badge support for counts
6. Add stagger animations for lists
