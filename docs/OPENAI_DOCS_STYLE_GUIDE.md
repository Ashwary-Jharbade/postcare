# OpenAI Docs Style Guide Adoption

Date: 2026-04-25

## Source References
- OpenAI developer docs landing page: https://developers.openai.com/api/docs
- OpenAI API docs redirect entry point: https://platform.openai.com/docs

## Notes on Analysis
The OpenAI docs site uses app-shell rendering, so exact CSS variables are not directly exposed in static HTML extraction. The palette and typography below were derived from live UI visual analysis and mapped into reusable project tokens.

## Extracted Visual Direction
- Clean, light documentation canvas with neutral surfaces.
- Subtle borders and low-contrast shadows rather than heavy gradients.
- Compact, readable typography with strong hierarchy and muted secondary text.
- Blue action accent and green success accent.

## Color Swatches
- `#f7f8fa` page background
- `#ffffff` surface background
- `#f3f4f6` muted surface background
- `#eef2f7` hover background
- `#111827` primary text
- `#4b5563` secondary text
- `#6b7280` muted text
- `#e5e7eb` default border
- `#d1d5db` strong border
- `#2563eb` primary action
- `#1d4ed8` primary hover action
- `#10a37f` success accent
- `#fef2f2` danger background
- `#fecaca` danger border
- `#b91c1c` danger text

## Typography Scale
- Base body: `14px` with `1.55` line-height
- Eyebrow/meta labels: `0.78rem`
- Field labels: `0.82rem`
- Body/support text: `0.9rem` to `1rem`
- Hero title: `clamp(2rem, 5vw, 2.8rem)`

Font stacks:
- Sans: `Inter, Segoe UI, SF Pro Text, Helvetica Neue, Arial, sans-serif`
- Mono: `IBM Plex Mono, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace`

## Effects
- Radius scale: `8px`, `12px`, `16px`
- Border-first component framing
- Subtle shadows:
  - `0 1px 2px rgba(15, 23, 42, 0.06)`
  - `0 6px 20px rgba(15, 23, 42, 0.08)`
- Focus ring: `0 0 0 3px rgba(37, 99, 235, 0.14)`

## Implemented Tokens
Global tokens were implemented in `src/styles.css` under `:root` and consumed across existing component styles via CSS custom properties:
- `--bg-*`, `--text-*`, `--border-*`
- `--primary-*`, `--success-color`
- `--radius-*`, `--shadow-*`
- `--font-sans`, `--font-mono`

## Implementation Scope
- Global shell and layout restyled to docs-like neutral palette.
- Sidebars, cards, buttons, fields, chips, and composer surfaces aligned to shared tokens.
- Help Center updated to match the same design direction for visual consistency.
