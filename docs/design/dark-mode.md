# Design: Dark Mode

> **Last updated:** 2026-04-07
> **Feature requirements:** [requirements/features/dark-mode.md](../requirements/features/dark-mode.md)
> **Technical module:** [technical/modules/dark-mode-module.md](../technical/modules/dark-mode-module.md)

---

## Overview

Dark mode is implemented by overriding CSS custom properties when a `[data-theme="dark"]` attribute is present on `<html>`. No new styling framework is introduced — the existing `:root` token system is extended with dark-mode overrides.

---

## Design Tokens — Dark Mode Values

### Core tokens

The existing `:root` block defines all light-mode tokens. Dark mode overrides are applied via `[data-theme="dark"]`.

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `--primary` | `#2563eb` | `#3b82f6` | Slightly brighter for legibility on dark bg |
| `--primary-hover` | `#1d4ed8` | `#2563eb` | |
| `--primary-active` | `#1e40af` | `#1d4ed8` | |
| `--danger` | `#dc2626` | `#ef4444` | Slightly brighter |
| `--danger-hover` | `#b91c1c` | `#dc2626` | |
| `--text` | `#111827` | `#f9fafb` | |
| `--text-2` | `#374151` | `#e5e7eb` | |
| `--text-3` | `#6b7280` | `#9ca3af` | |
| `--text-4` | `#9ca3af` | `#6b7280` | |
| `--border` | `#e5e7eb` | `#374151` | |
| `--border-input` | `#d1d5db` | `#4b5563` | |
| `--surface` | `#ffffff` | `#1f2937` | Card/form/dialog backgrounds |
| `--bg` | `#f3f4f6` | `#111827` | Page background |
| `--focus` | `rgba(37,99,235,0.22)` | `rgba(59,130,246,0.35)` | Slightly stronger alpha for visibility |

### Shadow tokens

Shadows need more opacity on dark backgrounds to remain visible.

| Token | Dark value |
|-------|------------|
| `--s-xs` | `0 1px 2px rgba(0,0,0,0.25)` |
| `--s-sm` | `0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)` |
| `--s-md` | `0 4px 16px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.25)` |
| `--s-lg` | `0 12px 40px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)` |

---

## New Semantic Tokens

The following tokens are added to `:root` with light-mode values, then overridden in `[data-theme="dark"]`. They replace previously hard-coded colour values throughout `index.css`.

| Token | Light value | Dark value | Used by |
|-------|-------------|------------|---------|
| `--error-bg` | `#fef2f2` | `#2d0b0b` | `.page-error`, `.error-message`, `.artifact-item__remove:hover`, `.kebab-menu__item--danger:hover` bg |
| `--error-border` | `#fecaca` | `#7f1d1d` | `.page-error`, `.error-message` border |
| `--error-text` | `#991b1b` | `#fca5a5` | `.page-error`, `.error-message` text |
| `--surface-subtle` | `#f9fafb` | `#374151` | `.artifact-item` bg, `.btn-secondary:hover` bg, `.artifact-check__box` bg (unchecked) |
| `--surface-hover` | `#f3f4f6` | `#2d3748` | `.kebab-menu__item:hover/focus` bg |

---

## Urgency Band Colours — Dark Mode

The light pastels currently hard-coded on `.card--*` classes are overridden via `[data-theme="dark"]`.

| Class | Light bg | Dark bg | Rationale |
|-------|----------|---------|-----------|
| `.card--urgent` | `#fde8e8` | `#3b0f0f` | Deep red — readable, not alarming |
| `.card--soon` | `#fef9c3` | `#3b2508` | Deep amber |
| `.card--future` | `#dcfce7` | `#052e16` | Deep green |
| `.card--past` | `#f0f0f0` | `#1e2939` | Muted dark, distinct from `--bg` |

### `.app-card` scoped `--text-3` override

The `.app-card` rule scopes `--text-3: #4b5563` to ensure secondary text passes 4.5:1 on every light urgency band. In dark mode this is overridden to `--text-3: #d1d5db` within `.app-card` under `[data-theme="dark"]`. This passes 4.5:1 on all four dark urgency band backgrounds.

---

## Urgency Badge Colours — Dark Mode

Badge colours invert in dark mode (background and text swap) to maintain contrast on dark surfaces.

| Element | Light bg / text | Dark bg / text |
|---------|----------------|----------------|
| `.urgency-badge--urgent` | `#fca5a5` / `#7f1d1d` | `#7f1d1d` / `#fca5a5` |
| `.urgency-badge--soon` | `#fde68a` / `#78350f` | `#78350f` / `#fde68a` |
| `.urgency-badge--future` | `#86efac` / `#14532d` | `#14532d` / `#86efac` |
| `.urgency-badge--past` | `#d1d5db` / `#374151` | `#374151` / `#d1d5db` |

---

## Card Border — Dark Mode

| Element | Light | Dark |
|---------|-------|------|
| `.app-card` border | `rgba(0,0,0,0.07)` | `rgba(255,255,255,0.07)` |
| `.app-card--offer-accepted` border | `3px solid #000` | `3px solid rgba(255,255,255,0.75)` |

No new token is needed — these one-off overrides are handled directly in the `[data-theme="dark"]` selector.

---

## Third-Party Component Theming

### `react-day-picker` (v9)

The calendar widget ships with its own CSS custom properties. These must be overridden explicitly inside `[data-theme="dark"]` in `index.css`.

| Variable | Light (default) | Dark override |
|----------|----------------|---------------|
| `--rdp-accent-color` | blue | `var(--primary)` |
| `--rdp-accent-color-dark` | darker blue | `var(--primary-hover)` |
| `--rdp-background-color` | light grey hover | `var(--surface-hover)` |
| `--rdp-selected-color` | white | `#ffffff` |

Disabled/past dates use an `opacity` modifier on the day cell and adapt automatically — no override needed.

---

## Toggle UI

### Applications list page — `⋮` page menu

A second menu item is added above "Logout". The label reflects the action (what clicking does), not the current state — consistent with the existing "Logout" item.

```
┌──────────────┐
│  Dark Mode   │   ← when currently in light mode
│  Logout      │
└──────────────┘
```

```
┌──────────────┐
│  Light Mode  │   ← when currently in dark mode
│  Logout      │
└──────────────┘
```

No icons are required, but a sun/moon icon may be added during implementation if it improves scannability.

### Login page — floating icon button

An icon-only toggle button sits in the top-right corner of the login page, absolutely positioned relative to the `.login-page` container.

```
┌────────────────────────────────────────────────┐
│                                           [☾]  │  ← dark mode toggle (top-right)
│                                                │
│              Application Status               │
│                   Tracker                     │
│  ...                                           │
└────────────────────────────────────────────────┘
```

Button spec:

| Property | Value |
|----------|-------|
| `aria-label` | `"Switch to dark mode"` / `"Switch to light mode"` (dynamic) |
| `aria-pressed` | `true` when dark mode is active |
| Minimum touch target | 44 × 44 px |
| Position | `position: absolute; top: 1rem; right: 1rem` |
| Icon | Moon (☾) in light mode; Sun (☀) in dark mode |

---

## Excluded Elements

| Element | Rationale |
|---------|-----------|
| `.dev-banner` | Amber `#f59e0b` / `#1c1917` — dev-only banner; not worth theming |

---

## Accessibility

- All text/background colour pairs must meet WCAG AA (4.5:1 for body text, 3:1 for large text) in dark mode — see token tables above
- The login page toggle button must be keyboard-operable (Enter/Space) and have a descriptive `aria-label`
- `prefers-reduced-motion` handling already exists in `index.css`; no additional work required
- Focus ring colours (`--focus`) are updated for dark mode to maintain visibility
- Native form controls must render in dark mode styling via `color-scheme: dark` on `<html>` in dark mode
- Placeholder text must remain readable but clearly distinct from entered text in dark mode

---

## Resolved Design Decisions

1. **Card border colour** — `.app-card` border changes from `rgba(0,0,0,0.07)` to `rgba(255,255,255,0.07)` in dark mode. No new token needed.

2. **Offer Accepted bold border** — In dark mode this becomes `3px solid rgba(255,255,255,0.75)` — strong but slightly softened white, visually distinct from the default card border without being harsh.

3. **`dialog::backdrop`** — `rgba(0,0,0,0.45)` with blur works in both modes. No change needed.

4. **Toggle label wording** — The applications list page menu uses text labels: "Dark Mode" (when in light mode) and "Light Mode" (when in dark mode). The login page uses an icon-only button with a descriptive `aria-label`.
