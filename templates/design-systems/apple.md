# [Project Name] Design System - Apple-Inspired Foundations

This design system codifies the visual and interaction principles for [Project Name].

It is the default source of truth for app shell layout, navigation, lists, controls, and page chrome in this repository.

All colors, typography families, and radii must be consumed through semantic tokens in `[theme stylesheet path, e.g. src/styles.css]` or a dedicated theme stylesheet imported there. Components must not hardcode literal color values or font family names.

## 1) Surface And Color

### Philosophy

The interface reads as a calm, spacious canvas. Separation comes from spacing, typography, subtle grouped inset surfaces when grouping controls, and structural seams—not stacked decorative containers.

### Token Roles

Define semantic CSS custom properties and map them to the project's theme tokens:

- `--background`: app canvas
- `--foreground`: primary text
- `--muted-foreground`: secondary/meta text
- `--border`: structural seams
- `--card`: grouped inset surfaces (forms, settings groups, grouped lists) and dialogs/popovers
- `--popover`: overlay surfaces
- `--accent`: subtle hover/active in content areas
- `--sidebar`: sidebar canvas
- `--sidebar-accent`: hover/active in sidebar
- `--primary`: brand and primary CTA (system blue)
- `--destructive`: danger actions
- `--ring`: focus ring

### Rules

- Canvas-first for browsing and routine reading; use grouped inset surfaces only where controls belong together (forms, settings, grouped lists).
- No decorative gradients on product surfaces.
- Use one accent color, `--primary`, for brand and primary actions. Map `--primary` to system blue (for example `#007AFF` in light, `#0A84FF` in dark), expressed via tokens—not literals in components.
- Prefer spacing and typographic hierarchy over extra backgrounds.
- Keep all colors tokenized and theme-ready for light and dark modes.

## 2) Typography

### Families

- Interface text: `font-sans` backed by `--font-sans` (map theme to `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif`).
- Code, IDs, and timestamps: `font-mono` backed by `--font-mono` (map theme to `"SF Mono", ui-monospace, "JetBrains Mono", monospace`).

Do not reference literal font families in component files.

### Scale

- Page heading: `text-2xl`, `font-semibold`
- Section heading: `text-lg`, `font-semibold`
- Body / row label: `text-sm`, `font-normal` to `font-medium`
- Meta / secondary: `text-xs`, `font-normal`
- Nav section label: `text-xs uppercase tracking-wide`, `font-medium`
- Tiny helper: `text-[11px]`, `font-normal`

### Rules

- Headlines are clear and restrained; prefer slightly tighter tracking on large display sizes (`tracking-tight` where appropriate).
- Use comfortable line height for body (`leading-normal` or `leading-relaxed`).
- Reserve uppercase for nav section labels and compact metadata.

## 3) Navigation

### Structure

1. Header row: identity, search, and create action.
2. Primary links.
3. Collapsible grouped links.
4. Lightweight footer affordance for help or docs.

### Item Styling

- Default: `text-sm`, muted foreground.
- Hover: subtle `sidebar-accent` background.
- Active: full-width rounded rectangle, medium weight.
- Icon size: 14px to 16px.
- Nav row baseline: `rounded-lg h-9 px-3`.

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
- Settings split: nav plus forms inside grouped inset surfaces.

### Toolbar Strip

- Height: `h-12`.
- Bottom seam: `border-b border-border/50`.
- No separate heavy background block.

### Page padding

- Content padding: `p-4` to `p-6` (16px to 24px) for comfortable reading rhythm.

## 5) Interactive Elements

### Buttons

- Primary: solid `primary` (system blue).
- Secondary: neutral fill.
- Ghost: transparent with subtle hover fill.
- Destructive: `destructive` only for dangerous confirms.
- Icon-only: `size-9` or `size-10`, ghost, tooltip.

Rules:

- Default radius: `rounded-lg` using the tokenized radius scale.
- Sparse shadows; prefer borders for separation on web.
- Primary buttons are intentional—do not pepper every row with a primary.

### Inputs

- Default height: `h-9`; relaxed contexts: `h-10` to `h-12`.
- Tokenized input background and border.
- Visible focus ring: `ring-2 ring-ring` with comfortable offset.
- Labels above fields. Do not use floating labels by default.

### Menus / Popovers / Dialogs

- Tokenized `popover` surface and subtle border.
- Typography: `text-sm` for menus; `text-sm` to `text-base` for dialogs as needed.
- Comfortable spacing.
- Dialog actions align right: secondary then primary.

## 6) Lists And Data

### Row Anatomy

- Relaxed, single-line by default where possible.
- Hover uses subtle accent fill.
- Selected row uses tinted fill derived from `--primary` (for example ~12% opacity in light, ~24% in dark) plus medium weight.
- Avoid per-row borders; separate by spacing and padding rhythm.

### Grouping And Tables

- Group labels are muted; children are indented or wrapped in grouped inset surfaces.
- Table headers: compact meta style; avoid heavy uppercase unless it aids scanability.
- No zebra striping or heavy gridlines.

## 7) Status And Feedback

- Status: small dots or SF-symbol-style glyphs with semantic meaning (optional).
- Loading: skeletons for content, spinners only for inline actions.
- Toasts: soft shadow, corner-pinned or non-intrusive, auto-dismiss.
- Empty states: icon, short message, and optional single CTA.

## 8) Motion

- Motion confirms state changes; it is never decorative.
- Micro interactions: about 200ms.
- Layout shifts: about 300ms to 350ms.
- Preferred easing: `cubic-bezier(0.25, 0.1, 0.25, 1)`.
- Sheets and popovers may use a subtle spring-like overshoot when it aids affordance; keep amplitude low on web.
- Respect `prefers-reduced-motion` with near-instant transitions.

## 9) Spacing System

Base unit is 4px, using the project's spacing scale.

- `p-1` or 4px: tight internals.
- `p-2` or 8px: compact section padding.
- `p-3` or 12px: dense content blocks.
- `p-4` or 16px: page-level rhythm.
- `p-6` or 24px: relaxed sections when the layout calls for breathing room.

Density guidelines:

- Sidebar: relaxed, `h-9` rows.
- Content: moderate, `h-10` to `h-12` rows.
- Forms/settings: relaxed, `h-12` to `h-14` rows.

## 10) Accessibility

- Full keyboard navigation for all controls.
- Consistent visible focus styles.
- Semantic landmarks such as `nav` and `main`.
- Collapsibles expose `aria-expanded`.
- Ensure WCAG AA contrast in both themes.

## 11) Anti-Patterns

- Do not wrap routine browsing content in grouped inset surfaces.
- Do not introduce multiple accent colors.
- Do not add decorative gradients behind core product surfaces.
- Do not stack multiple competing toolbars.
- Do not color-code nav icons.
- Do not use heavy drop shadows for everyday chrome.
- Do not hardcode colors or font families in components.

## 12) Applying This System

### Where Values Live

- Theme tokens and base layer: `[theme stylesheet path, e.g. src/styles.css]`.
- App shell composition: `[route/layout path, e.g. src/routes or app]`.
- Reusable UI primitives: `[components path, e.g. src/components/ui]`.

### New Component Checklist

1. Canvas-first or justified grouped inset for grouped controls—not card-first for everything?
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
