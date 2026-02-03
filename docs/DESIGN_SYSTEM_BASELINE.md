# Design System Baseline

This document defines the design tokens, color system, typography, and visual specifications. It includes both the current supastarter-nextjs-3 tokens and the extended Masar (supastarter-nextjs-1) tokens for reference.

---

## Color System

### Current Project (supastarter-nextjs-3)

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f2f1ed` | Page background (warm off-white) |
| `--foreground` | `#1c1e1e` | Primary text |
| `--card` | `#f9f8f6` | Card backgrounds |
| `--card-foreground` | `#1d1f1f` | Card text |
| `--popover` | `#ffffff` | Popover/dropdown backgrounds |
| `--popover-foreground` | `#1d1f1f` | Popover text |
| `--primary` | `#3875c8` | Primary actions, links |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#292b35` | Secondary actions |
| `--secondary-foreground` | `#ffffff` | Text on secondary |
| `--muted` | `#e8e7e3` | Muted backgrounds |
| `--muted-foreground` | `#1d1f1f` | Muted text |
| `--accent` | `#e8e7f0` | Accent backgrounds |
| `--accent-foreground` | `#1d1f1f` | Accent text |
| `--destructive` | `#ef4444` | Error/delete actions |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--success` | `#39a561` | Success states |
| `--success-foreground` | `#ffffff` | Text on success |
| `--border` | `#e0e3e0` | Borders |
| `--input` | `#d0d4d0` | Input borders |
| `--ring` | `#3875c8` | Focus rings |

#### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#161818` | Page background (near black) |
| `--foreground` | `#eae9e5` | Primary text |
| `--card` | `#1c1e1e` | Card backgrounds |
| `--card-foreground` | `#eae9e5` | Card text |
| `--popover` | `#161818` | Popover backgrounds |
| `--popover-foreground` | `#eae9e5` | Popover text |
| `--primary` | `#3875c8` | Primary actions |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#eae9e5` | Secondary actions |
| `--secondary-foreground` | `#191b1b` | Text on secondary |
| `--muted` | `#191a1a` | Muted backgrounds |
| `--muted-foreground` | `#94a3b8` | Muted text |
| `--accent` | `#1e293b` | Accent backgrounds |
| `--accent-foreground` | `#f8fafc` | Accent text |
| `--destructive` | `#ef4444` | Error/delete |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--success` | `#39a561` | Success states |
| `--success-foreground` | `#ffffff` | Text on success |
| `--border` | `#262929` | Borders |
| `--input` | `#333737` | Input borders |
| `--ring` | `#3875c8` | Focus rings |

---

### Masar Extended Colors (supastarter-nextjs-1)

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#fafafe` | Page background |
| `--foreground` | `#292b35` | Primary text |
| `--primary` | `#2563eb` | Primary (blue-600) |
| `--primary-dark` | `#1d4ed8` | Primary hover |
| `--primary-light` | `#3b82f6` | Primary light |
| `--secondary` | `#0ea5e9` | Secondary (sky-500) |
| `--success` | `#10b981` | Success (emerald-500) |
| `--warning` | `#f59e0b` | Warning (amber-500) |
| `--danger` | `#ef4444` | Danger (red-500) |
| `--info` | `#06b6d4` | Info (cyan-500) |
| `--highlight` | `#f59e0b` | Highlight (amber) |
| `--card` | `#ffffff` | Card background |
| `--muted` | `#f8fafc` | Muted background |
| `--accent` | `#f59e0b` | Accent (amber) |

#### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#070d12` | Page background |
| `--foreground` | `#e9eef3` | Primary text |
| `--primary` | `#3b82f6` | Primary (blue-500) |
| `--secondary` | `#10b981` | Secondary (emerald) |
| `--card` | `#0d1116` | Card background |
| `--popover` | `#0d1116` | Popover background |

#### Primary Color Scale (Masar)

```css
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
```

#### Background Tiers (Masar)

```css
/* Light */
--bg-primary: #f8fafc;
--bg-secondary: #ffffff;
--bg-tertiary: #f1f5f9;

/* Dark */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--bg-tertiary: #334155;
```

#### Text Hierarchy (Masar)

```css
/* Light */
--text-primary: #0f172a;
--text-secondary: #475569;
--text-muted: #94a3b8;

/* Dark */
--text-primary: #f1f5f9;
--text-secondary: #cbd5e1;
--text-muted: #64748b;
```

#### Shadow Scale (Masar)

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-glow: 0 0 20px rgb(37 99 235 / 0.15);
```

#### Glass Effect (Masar)

```css
/* Light */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-blur: blur(10px);

/* Dark */
--glass-bg: rgba(30, 41, 59, 0.7);
```

#### Transitions (Masar)

```css
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
--transition-slow: 500ms ease;
```

---

## Typography

### Font Families

#### Current (supastarter-nextjs-3)

| Variable | Font | Usage |
|----------|------|-------|
| `--font-sans` | Inter | Primary UI font (Latin) |
| `--font-serif` | Libre Baskerville | Headings, marketing |
| `--font-arabic-sans` | Noto Sans Arabic | Arabic text |

#### Masar (supastarter-nextjs-1)

| Variable | Font | Usage |
|----------|------|-------|
| `--font-family-cairo` | Cairo | Arabic headings |
| `--font-family-ibm-arabic` | IBM Plex Arabic | Arabic body text |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text |
| Medium | 500 | Emphasis |
| Semibold | 600 | Subheadings |
| Bold | 700 | Headings, active states |

### Font Loading (Current - Document.tsx)

```tsx
const sansFont = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const serifFont = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const arabicSansFont = Noto_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic-sans",
});
```

### Letter Spacing

| Context | Value | Purpose |
|---------|-------|---------|
| Latin text | `-0.02em` | Tighter spacing for modern look |
| Arabic text | `0` | Natural spacing for Arabic script |

```css
body {
  letter-spacing: -0.02em;
}

[dir="rtl"] body {
  font-family: var(--font-arabic-sans), var(--font-sans), ui-sans-serif;
  letter-spacing: 0;
}
```

### Typography Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem (12px) | Captions, badges |
| `text-sm` | 0.875rem (14px) | Secondary text, menu items |
| `text-base` | 1rem (16px) | Body text |
| `text-lg` | 1.125rem (18px) | Lead paragraphs |
| `text-xl` | 1.25rem (20px) | Section titles |
| `text-2xl` | 1.5rem (24px) | Page titles |
| `text-3xl` | 1.875rem (30px) | Hero text |
| `text-4xl` | 2.25rem (36px) | Large headings |

---

## Spacing & Sizing

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.75rem` (12px) | Base radius |
| `--radius-lg` | `var(--radius)` | Large elements |
| `--radius-md` | `calc(var(--radius) - 2px)` | Medium elements (10px) |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Small elements (8px) |

### Radius Classes

```css
rounded-3xl  /* 24px - Main content cards */
rounded-2xl  /* 16px - Masar uses for cards */
rounded-lg   /* 12px - Cards, modals */
rounded-md   /* 10px - Buttons, inputs */
rounded-sm   /* 8px  - Small elements */
```

### Container

#### Current
```css
@utility container {
  margin-inline: auto;
  padding-inline: 1.5rem;  /* 24px */
  width: 100%;
  max-width: var(--container-6xl);
}
```

#### Masar
```css
@utility container {
  margin-inline: auto;
  padding-inline: 1.5rem;
  width: 100%;
  max-width: var(--container-7xl);  /* Wider */
}
```

### Common Spacing Values

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` | 0.25rem (4px) | Tight grouping |
| `gap-2` | 0.5rem (8px) | Related items |
| `gap-3` | 0.75rem (12px) | Menu items |
| `gap-4` | 1rem (16px) | Standard spacing |
| `gap-6` | 1.5rem (24px) | Section spacing |
| `gap-8` | 2rem (32px) | Large spacing |
| `p-3` | 0.75rem (12px) | Compact padding |
| `p-4` | 1rem (16px) | Standard padding |
| `p-6` | 1.5rem (24px) | Card padding |
| `p-8` | 2rem (32px) | Large padding |

---

## RTL/LTR Support

### Logical Properties (Current - Recommended)

| Physical (Avoid) | Logical (Use) | Purpose |
|------------------|---------------|---------|
| `left` | `start` | Inline start |
| `right` | `end` | Inline end |
| `ml-*` | `ms-*` | Margin inline-start |
| `mr-*` | `me-*` | Margin inline-end |
| `pl-*` | `ps-*` | Padding inline-start |
| `pr-*` | `pe-*` | Padding inline-end |
| `border-l-*` | `border-s-*` | Border inline-start |
| `border-r-*` | `border-e-*` | Border inline-end |
| `text-left` | `text-start` | Text alignment |
| `text-right` | `text-end` | Text alignment |

### RTL Locales

```tsx
const RTL_LOCALES = ["ar", "he", "fa", "ur"];
```

### Icon Flipping

```css
/* Current */
[dir="rtl"] .rtl-flip {
  transform: scaleX(-1);
}

/* Masar */
[dir="rtl"] .flip-rtl {
  transform: scaleX(-1);
}
```

---

## Animation System

### Current (tailwind-animate.css)

| Animation | Usage |
|-----------|-------|
| `animate-in` | Enter animation |
| `animate-out` | Exit animation |
| `fade-in` / `fade-out` | Opacity transitions |
| `zoom-in-*` / `zoom-out-*` | Scale transitions |
| `slide-in-from-*` | Slide from direction |
| `slide-out-to-*` | Slide to direction |
| `spin-in-*` / `spin-out-*` | Rotation |

### Masar Custom Animations

```css
/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease forwards;
}

/* Slide Animations */
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
.animate-slide-down {
  animation: slideDown 0.3s ease-out;
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scaleY(0.5);
  }
  to {
    opacity: 1;
    transform: scaleY(1);
  }
}
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

/* Shimmer */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}

/* Pulse Glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 102, 255, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(0, 102, 255, 0); }
}
.animate-pulse-glow {
  animation: pulse-glow 2s infinite;
}
```

### Stagger Animation (Masar)

```css
.stagger-children > * {
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.4s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.5s; }
.stagger-children > *:nth-child(6) { animation-delay: 0.6s; }
.stagger-children > *:nth-child(7) { animation-delay: 0.7s; }
.stagger-children > *:nth-child(8) { animation-delay: 0.8s; }
```

### Animation Duration & Timing

```css
/* Base */
--animate-in: var(--tw-duration, 150ms) var(--tw-ease, ease) enter;
--animate-out: var(--tw-duration, 150ms) var(--tw-ease, ease) exit;
```

### Delay Values

| Class | Value |
|-------|-------|
| `delay-0` | 0s |
| `delay-75` | 75ms |
| `delay-100` | 100ms |
| `delay-150` | 150ms |
| `delay-200` | 200ms |
| `delay-300` | 300ms |
| `delay-500` | 500ms |
| `delay-700` | 700ms |
| `delay-1000` | 1000ms |

---

## Visual Effects (Masar)

### Glass Morphism

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

.header-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dark .header-glass {
  background: rgba(15, 23, 42, 0.8);
}
```

### Card Hover Effect

```css
.card-hover {
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}
```

### Gradient Background

```css
/* Masar AppWrapper gradient */
.bg-gradient-masar {
  background: radial-gradient(
    farthest-corner at 0% 0%,
    color-mix(in oklch, var(--color-primary), transparent 95%) 0%,
    var(--color-background) 50%
  );
}

.dark .bg-gradient-masar {
  background: radial-gradient(
    farthest-corner at 0% 0%,
    color-mix(in oklch, var(--color-primary), transparent 90%) 0%,
    var(--color-background) 50%
  );
}
```

---

## Accessibility

### Reduced Motion (Masar)

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .animate-fade-in,
  .animate-fade-in-up,
  .animate-slide-up,
  .animate-slide-down,
  .animate-scale-in,
  .animate-shimmer,
  .animate-pulse-glow {
    animation: none !important;
  }

  .stagger-children > * {
    animation: none !important;
    opacity: 1 !important;
  }
}
```

---

## Print Styles (Masar)

```css
@media print {
  /* Hide non-printable elements */
  .print\:hidden,
  header,
  footer,
  button,
  .no-print {
    display: none !important;
  }

  /* Show print-only elements */
  .print-only {
    display: block !important;
  }

  /* Page settings */
  @page {
    size: A4;
    margin: 15mm;
  }

  body {
    font-family: 'Tahoma', 'Arial', sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000;
    background: #fff;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #333;
    padding: 6px 8px;
  }

  th {
    background-color: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Page breaks */
  h1, h2, h3 {
    page-break-after: avoid;
  }

  section {
    page-break-inside: avoid;
  }

  .page-break-inside-avoid {
    page-break-inside: avoid;
  }

  .page-break-before {
    page-break-before: always;
  }
}
```

---

## Theme Configuration

### Theme Switching

```typescript
// config/index.ts
ui: {
  enabledThemes: ["light", "dark"],
  defaultTheme: "light",
}
```

### Dark Mode Variant

```css
@variant dark (&:where(.dark, .dark *));
```

---

## Source Files

| Purpose | Current (v3) | Masar (v1) |
|---------|--------------|------------|
| Color Tokens | `tooling/tailwind/theme.css` | `tooling/tailwind/theme.css` |
| Animations | `tooling/tailwind/tailwind-animate.css` | Same + `globals.css` |
| Global CSS | `apps/web/app/globals.css` | `apps/web/app/globals.css` |
| Font Config | `Document.tsx` | Root layout |
| UI Config | `config/index.ts` | `config/index.ts` |

---

## Quick Reference

### Essential Current Variables

```css
/* Colors */
--background: #f2f1ed;
--foreground: #1c1e1e;
--primary: #3875c8;
--card: #f9f8f6;
--success: #39a561;
--destructive: #ef4444;

/* Radius */
--radius: 0.75rem;  /* 12px */

/* Spacing */
container padding: 1.5rem;  /* 24px */
```

### Essential Masar Variables (to consider adding)

```css
/* Extended Status Colors */
--warning: #f59e0b;
--info: #06b6d4;
--highlight: #f59e0b;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* Glass */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-blur: blur(10px);

/* Transitions */
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
```

### Essential Classes

```tsx
// Page background
className="bg-background text-foreground"

// Card container
className="rounded-3xl bg-card"

// Primary button
className="bg-primary text-primary-foreground"

// Container
className="container max-w-6xl"

// Glass effect (Masar)
className="glass"  // or "header-glass"

// Card hover (Masar)
className="card-hover"

// Stagger animation (Masar)
className="stagger-children"
```
