# Module: Dark Mode

> **Last updated:** 2026-04-07
> **Feature requirements:** [requirements/features/dark-mode.md](../../requirements/features/dark-mode.md)
> **Design:** [design/dark-mode.md](../../design/dark-mode.md)

---

## Overview

Dark mode is implemented entirely on the frontend using CSS custom properties and a small React hook. No backend changes are required and no new npm packages are introduced.

The active theme is stored as a `data-theme="light" | "dark"` attribute on `<html>`. All colour switching is handled by CSS rules that override the `:root` token values when `[data-theme="dark"]` is present.

---

## Implementation Approach

### 1 — CSS (`client/src/index.css`)

Four changes to `index.css`:

1. **Add new semantic tokens** (`--error-bg`, `--error-border`, `--error-text`, `--surface-subtle`, `--surface-hover`) to `:root` with light-mode values.
2. **Add a `[data-theme="dark"]` block** after the `:root` token section that overrides all tokens listed in the [design/dark-mode.md](../../design/dark-mode.md) token tables.
3. **Replace hard-coded colours** throughout the file with the new semantic tokens.
4. **Declare `color-scheme`** — add `color-scheme: light` to `:root` and `color-scheme: dark` inside `[data-theme="dark"]`. This causes the browser to apply dark-mode styling to native controls (scrollbars, `<select>`, `<input>`, `<textarea>`).
5. **Override `::placeholder` colour** — add `::placeholder { color: var(--text-4); opacity: 1; }` inside `[data-theme="dark"]` to ensure placeholder text is readable but clearly distinct from entered text.

No new CSS files are needed.

### 2 — Theme hook (`client/src/lib/useTheme.js`)

A new hook manages the theme lifecycle:

```
useTheme()
  → reads localStorage('theme')
  → falls back to window.matchMedia('prefers-color-scheme: dark')
  → sets document.documentElement.dataset.theme = 'light' | 'dark'
  → listens to the prefers-color-scheme media query (only when no saved preference exists)
  → exposes { theme, toggleTheme }
```

The media query listener is registered only when no `localStorage` entry exists, and is torn down when the user sets an explicit preference.

### 3 — Inline script in `index.html`

A short script placed immediately inside `<head>` reads `localStorage` and sets `document.documentElement.dataset.theme` before the page paints, preventing a flash of the wrong theme:

```html
<script>
  (function() {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
  })();
</script>
```

### 4 — ThemeContext (`client/src/lib/ThemeContext.js`)

`App.jsx` calls `useTheme()` once at the root. Because `LoginPage` and `ApplicationsListPage` are separate routes with no shared ancestor below `App`, prop-threading will not reach both — context is the correct solution.

```
ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} })
```

`App.jsx` wraps router output in `<ThemeContext.Provider value={{ theme, toggleTheme }}>`. Both pages call `useContext(ThemeContext)` to access the toggle.

---

## Files to Change

| File | Change |
|------|--------|
| `client/index.html` | Add inline script to `<head>` for flash-free init |
| `client/src/index.css` | Add new semantic tokens to `:root`; add `[data-theme="dark"]` override block; replace hard-coded colours with tokens |
| `client/src/lib/useTheme.js` | **New** — theme hook with `localStorage` read/write and `matchMedia` listener |
| `client/src/lib/ThemeContext.js` | **New** — `ThemeContext` and `ThemeProvider` |
| `client/src/App.jsx` | Wrap router output in `ThemeContext.Provider` |
| `client/src/pages/ApplicationsListPage.jsx` | Add theme toggle item to page-level `⋮` menu |
| `client/src/pages/LoginPage.jsx` | Add floating theme toggle icon button |

No backend changes. No new npm packages.
