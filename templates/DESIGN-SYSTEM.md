# [Project Name] Design System - Linear-Inspired Foundations

This design system codifies the visual and interaction principles for [Project Name].

It is the default source of truth for app shell layout, navigation, lists, controls, and page chrome in this repository.

All colors, typography families, and radii must be consumed through semantic tokens in `[theme stylesheet path, e.g. src/styles.css]` or a dedicated theme stylesheet imported there. Components must not hardcode literal color values or font family names.

## 1) Surface And Color

### Philosophy

The interface is a single continuous canvas. Separation comes from spacing, typography, and occasional structural seams, not stacked containers.

### Token Roles

Define semantic CSS custom properties and map them to the project's theme tokens:

- `--background`: app canvas
- `--foreground`: primary text
- `--muted-foreground`: secondary/meta text
- `--border`: structural seams
- `--card`: elevated container for dialogs/popovers only
- `--popover`: overlay surfaces
- `--accent`: subtle hover/active in content areas
- `--sidebar`: sidebar canvas
- `--sidebar-accent`: hover/active in sidebar
- `--primary`: brand and primary CTA
- `--destructive`: danger actions
- `--ring`: focus ring

### Rules

- No layered cards for routine content.
- No decorative gradients on product surfaces.
- Use one accent color, `--primary`, for brand and primary actions.
- Prefer spacing over background differentiation.
- Keep all colors tokenized and theme-ready for light and dark modes.

## 2) Typography

### Families

- Interface text: `font-sans` backed by `--font-sans`.
- Code, IDs, and timestamps: `font-mono` backed by `--font-mono`.

Do not reference literal font families in component files.

### Scale

- Page heading: `text-xl`, `font-semibold`
- Section heading: `text-base`, `font-semibold`
- Body / row label: `text-xs`, `font-normal` to `font-medium`
- Meta / secondary: `text-[11px]`, `font-normal`
- Nav section label: `text-[11px] uppercase tracking-wide`, `font-medium`
- Tiny helper: `text-[10px]`, `font-normal`

### Rules

- Headlines are quiet and utilitarian.
- Keep line height tight with `leading-tight` or `leading-snug` for dense UI.
- Reserve uppercase for nav labels and compact metadata.

## 3) Navigation

### Structure

1. Header row: identity, search, and create action.
2. Primary links.
3. Collapsible grouped links.
4. Lightweight footer affordance for help or docs.

### Item Styling

- Default: `text-xs`, muted foreground.
- Hover: subtle `sidebar-accent` background.
- Active: full-width pill, medium weight.
- Icon size: 12px.
- Nav pill baseline: `rounded-full h-7 px-2.5`.

### Collapse Behavior

- Expanded width: `15rem` or 240px.
- Collapsed width: `3rem` or 48px, icon-only with tooltip.
- Mobile: sheet/drawer using expanded width.
- Keyboard shortcut: support the project's standard sidebar toggle shortcut, e.g. `Cmd+B`.

## 4) Layout Regions

### App Shell

- Sidebar: fixed left, full viewport height, right seam border.
- Content: `flex-1 min-w-0`, same background canvas.
- Optional inspector: right panel, `22rem` to `28rem`, collapsible.

### Common Page Patterns

- List workspace: toolbar plus scrollable list.
- Detail view: breadcrumbs/title plus body and optional inspector.
- Editor split: left rail plus center editor.
- Settings split: nav plus forms.

### Toolbar Strip

- Height: `h-10` to `h-12`.
- Bottom seam: `border-b border-border/50`.
- No separate background block.

## 5) Interactive Elements

### Buttons

- Primary: solid `primary`.
- Secondary: neutral fill.
- Ghost: transparent with subtle hover fill.
- Destructive: `destructive` only for dangerous confirms.
- Icon-only: `size-8`, ghost, tooltip.

Rules:

- Default radius uses the tokenized radius scale.
- No shadows on standard buttons.
- Primary buttons are intentionally sparse.

### Inputs

- Compact defaults: `h-8`; dense contexts: `h-7`.
- Tokenized input background and border.
- Visible focus ring: `ring-2 ring-ring`.
- Labels above fields. Do not use floating labels by default.

### Menus / Popovers / Dialogs

- Tokenized `popover` surface and subtle border.
- Tight typography: `text-xs`.
- Compact spacing.
- Dialog actions align right: secondary then primary.

## 6) Lists And Data

### Row Anatomy

- Compact, single-line by default.
- Hover uses subtle accent fill.
- Selected row uses stronger accent fill and medium weight.
- Avoid per-row borders; separate by spacing and padding rhythm.

### Grouping And Tables

- Group labels are muted; children are indented.
- Table headers use uppercase compact meta style.
- No zebra striping or heavy gridlines.

## 7) Status And Feedback

- Status: small dots or icons with semantic meaning.
- Loading: skeletons for content, spinners only for inline actions.
- Toasts: non-intrusive, auto-dismiss.
- Empty states: icon, short message, and optional single CTA.

## 8) Motion

- Motion confirms state changes; it is never decorative.
- Micro interactions: about 150ms.
- Layout shifts: about 200-250ms.
- Preferred easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Respect `prefers-reduced-motion` with near-instant transitions.

## 9) Spacing System

Base unit is 4px, using the project's spacing scale.

- `p-1` or 4px: tight internals.
- `p-2` or 8px: compact section padding.
- `p-3` or 12px: dense content blocks.
- `p-4` or 16px: page-level rhythm.

Density guidelines:

- Sidebar: dense, `h-7` rows.
- Content: moderate, `h-8` to `h-10` rows.
- Forms/settings: relaxed, `h-10` to `h-12` rows.

## 10) Accessibility

- Full keyboard navigation for all controls.
- Consistent visible focus styles.
- Semantic landmarks such as `nav` and `main`.
- Collapsibles expose `aria-expanded`.
- Ensure WCAG AA contrast in both themes.

## 11) Anti-Patterns

- Do not wrap normal content in elevated cards.
- Do not introduce multiple accent colors.
- Do not add decorative gradients behind core product surfaces.
- Do not stack multiple competing toolbars.
- Do not color-code nav icons.
- Do not hardcode colors or font families in components.

## 12) Applying This System

### Where Values Live

- Theme tokens and base layer: `[theme stylesheet path, e.g. src/styles.css]`.
- App shell composition: `[route/layout path, e.g. src/routes or app]`.
- Reusable UI primitives: `[components path, e.g. src/components/ui]`.

### New Component Checklist

1. Sits on canvas, not card-first?
2. Uses 2-3 text hierarchy levels max?
3. Has subtle hover and clear active states?
4. Uses primary color only where needed?
5. Uses spacing rhythm in 4px increments?
6. Has complete keyboard and focus behavior?
7. Uses token-driven colors and fonts?
8. Works in light and dark themes?

### For Coding Agents

- Read this file before changing UI, layout, navigation, styling, or components.
- Prefer existing UI primitives and local layout patterns.
- Do not introduce new visual language without documenting the reason in the implementation brief or PR.
- Before handoff, check responsive behavior, focus states, text overflow, loading states, empty states, and token usage.

### Working Rule

Default to these principles unless a deliberate exception is documented in a feature-specific spec.
