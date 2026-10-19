# Haven — Design System

## 1. Purpose

This document defines Haven's visual identity and reusable interface rules. All pages and components must follow this system to maintain a consistent, polished, accessible experience.

The design should feel calm, credible, private, and professional. Haven deals with sensitive situations, so the interface must prioritize clarity and reassurance over decoration.

## 2. Visual Direction

Haven uses a restrained editorial style combined with a focused digital-forensics workspace.

The visual identity should communicate:
- **Trust:** Clear language, predictable interactions, and transparent results.
- **Calm:** Muted colors, generous whitespace, and minimal visual noise.
- **Precision:** Structured layouts, readable measurements, and clear evidence details.
- **Human support:** Respectful wording and nonjudgmental guidance.
- **Professionalism:** Consistent typography, alignment, spacing, and component behavior.

### Avoid

- Neon gradients and excessive purple-blue AI styling.
- Glassmorphism, excessive blur, and decorative glowing effects.
- Excessive rounded cards and pill-shaped elements everywhere.
- Unnecessary animations and floating decorative shapes.
- Emoji used as substitutes for interface icons.
- Fake charts, fabricated statistics, sample incidents presented as real, and simulated AI results.
- Excessive borders, shadows, and nested cards.
- Color as the only way to communicate meaning.

## 3. Color Palette

Define all colors as CSS custom properties in a central stylesheet. Components must use design tokens rather than repeatedly introducing arbitrary color values.

The following palette is the initial design direction. Verify contrast ratios during implementation and adjust individual values when necessary.

### Core colors

| Token | Initial value | Purpose |
|---|---|---|
| `--color-brand` | `#245B4F` | Primary Haven identity |
| `--color-brand-hover` | `#1B483F` | Hover and active primary actions |
| `--color-brand-soft` | `#E7F1ED` | Subtle brand backgrounds |
| `--color-background` | `#F7F8F6` | Main application background |
| `--color-surface` | `#FFFFFF` | Cards, dialogs, and panels |
| `--color-surface-muted` | `#F0F2EF` | Secondary surface areas |
| `--color-text` | `#202923` | Primary text |
| `--color-text-secondary` | `#58635D` | Supporting text |
| `--color-text-muted` | `#68736D` | Metadata and less prominent text |
| `--color-border` | `#DCE2DC` | Borders and separators |
| `--color-border-strong` | `#B9C5BC` | Stronger boundaries |
| `--color-focus` | `#1769AA` | Keyboard focus indicator |

### Semantic colors

| Token | Initial value | Purpose |
|---|---|---|
| `--color-success` | `#256B45` | Successful operations |
| `--color-success-soft` | `#E8F4EC` | Success backgrounds |
| `--color-warning` | `#875900` | Caution and incomplete checks |
| `--color-warning-soft` | `#FFF3D6` | Warning backgrounds |
| `--color-danger` | `#B4232D` | Destructive actions and serious errors |
| `--color-danger-soft` | `#FCEBEC` | Error backgrounds |
| `--color-info` | `#245D8F` | Informational messages |
| `--color-info-soft` | `#EAF2FA` | Informational backgrounds |

Semantic colors must be used consistently. Do not use danger styling merely to make an ordinary warning more noticeable.

For forensic results, labels must explain what a status actually means. A warning or risk category must not imply that an image is definitively fake or authentic.

## 4. Typography

Use a clean, highly readable sans-serif typeface.

Preferred stack:

`Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

Use a locally available system fallback when Inter is unavailable. Do not make the application dependent on a remote font service.

### Type scale

| Token | Size | Typical use |
|---|---:|---|
| `--font-size-xs` | `0.75rem` | Small metadata |
| `--font-size-sm` | `0.875rem` | Secondary information |
| `--font-size-base` | `1rem` | Body text and form controls |
| `--font-size-lg` | `1.125rem` | Emphasized body text |
| `--font-size-xl` | `1.375rem` | Section headings |
| `--font-size-2xl` | `1.75rem` | Page headings |
| `--font-size-3xl` | `2.25rem` | Landing-page headline |

Use a body line-height of approximately `1.5` and a heading line-height of approximately `1.2`.

Typography rules:
- Use sentence case for page titles, buttons, labels, and navigation.
- Keep paragraph widths comfortable for reading.
- Use bold weight selectively.
- Avoid tiny text for important warnings, limitations, or evidence details.
- Use tabular numerals for hashes, measurements, and aligned numeric values where appropriate.
- Preserve long hashes and technical identifiers without causing horizontal page overflow.

## 5. Spacing System

Use a consistent spacing scale based on multiples of four pixels.

| Token | Value |
|---|---:|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

Use spacing to establish hierarchy instead of adding more borders or decorative elements.

Page content should have comfortable horizontal padding. Reduce that padding on smaller screens without allowing content to touch the viewport edges.

## 6. Layout and Sizing

- Use a consistent application shell across authenticated or workspace pages.
- On desktop, use a restrained sidebar and a flexible main content area.
- Keep the main content readable instead of stretching every page across the entire screen.
- Use CSS Grid and Flexbox for layouts.
- Allow cards and content sections to resize naturally.
- Prevent horizontal overflow at mobile widths.
- Use a consistent maximum width for long-form content.
- Use a clear hierarchy: page heading, brief explanation, primary task, then supporting details.

Suggested desktop shell:
- Sidebar: approximately `240px` wide.
- Main content maximum width: approximately `1200px`.
- Standard content gap: `24px`.
- Main page padding: `32px`.

These are starting values, not rigid requirements. Adapt layouts when a page needs a different structure.

## 7. Borders, Radius, and Shadows

Use subtle boundaries and restrained elevation.

Suggested tokens:

| Token | Value |
|---|---|
| `--radius-sm` | `6px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `14px` |
| `--radius-pill` | `999px` |
| `--shadow-sm` | `0 1px 3px rgba(20, 35, 27, 0.06)` |
| `--shadow-md` | `0 4px 12px rgba(20, 35, 27, 0.08)` |

Guidelines:
- Use small or medium radii for most interface elements.
- Reserve pill shapes for compact status labels or controls that genuinely benefit from them.
- Prefer borders over shadows for ordinary cards.
- Use stronger elevation only for dialogs, popovers, or floating elements.
- Do not place every piece of content inside a separate card.

## 8. Buttons

Implement reusable button variants rather than styling each button independently.

### Primary button
- Brand background with readable foreground text.
- Used for the main action in a section.
- Example: **Analyze image**.

### Secondary button
- Neutral surface with a clear border.
- Used for supporting actions.
- Example: **View report**.

### Tertiary button
- Text-only or low-emphasis treatment.
- Used for less important actions.

### Destructive button
- Danger styling.
- Used for irreversible or destructive actions.
- Requires clear wording and confirmation when appropriate.

### Button behavior
- Provide visible hover, focus, active, disabled, and loading states.
- Keep button heights and horizontal padding consistent.
- Use meaningful action labels.
- Do not show a loading spinner indefinitely.
- Prevent duplicate submissions when an operation is already running.
- A disabled button must have a clear reason when the reason is not obvious.
- Never make a button appear functional if it has no implemented action.

## 9. Form Controls

Inputs, textareas, selects, checkboxes, and file-upload controls must share consistent styling.

Requirements:
- Every control must have an accessible label.
- Use placeholders only as supplementary examples, never as the sole label.
- Show clear focus and invalid states.
- Put validation messages close to the relevant field.
- Explain file restrictions before or during upload.
- Preserve entered values after recoverable validation errors.
- Do not erase user input unexpectedly.
- Ensure controls are usable with a keyboard.
- Avoid showing errors before the user has had a reasonable opportunity to interact, unless immediate validation is necessary for safety.

## 10. Cards, Panels, and Data Presentation

Use cards for genuinely separate content groups, not as the default wrapper for every element.

A card may contain:
- A clear title.
- Optional concise supporting text.
- Related data or controls.
- An optional contextual action.

For technical information:
- Use aligned labels and values.
- Keep units visible.
- Make long identifiers readable and copyable.
- Distinguish measured values from model predictions and user-provided information.
- Explain unfamiliar technical terms with short supporting text where useful.

For empty states:
- Explain what is currently absent.
- Tell the user what they can do next.
- Do not fabricate records to make a page look populated.

## 11. Status Labels and Alerts

Create reusable status components for:
- Success.
- Information.
- Warning.
- Error.
- Processing.
- Unavailable.
- Incomplete.

Each status must include text or an accessible equivalent. Never communicate a status through color alone.

For forensic findings, use precise labels such as:
- `Analysis completed`
- `Potential anomaly detected`
- `No anomaly detected by this method`
- `Inconclusive`
- `Analysis unavailable`

Do not replace these with absolute claims such as `Fake`, `Real`, `Safe`, or `Authentic` unless a specific, validated capability genuinely supports that exact conclusion. In general, image analysis cannot establish authenticity with certainty.

## 12. Icons and Imagery

- Use one consistent icon library throughout the application.
- Prefer simple, recognizable line icons.
- Keep icon size and stroke weight consistent.
- Give icon-only buttons accessible names and tooltips where useful.
- Do not use emojis as the main navigation icon system.
- Do not add stock images merely to fill empty space.
- Any image used in the interface must serve a clear purpose.
- Display user-uploaded evidence only where necessary and with appropriate privacy considerations.

## 13. Motion and Interaction

Motion should be subtle and purposeful.

- Use short transitions for hover, focus, and state changes.
- Avoid animated backgrounds and decorative movement.
- Never simulate analysis progress with invented percentages or staged results.
- Show progress only when it reflects real work or a genuine operation state.
- Respect the user's reduced-motion preference.
- Keep essential information visible without requiring animation.

## 14. Responsive Behavior

Support at least these viewport widths during development:
- `320px`
- `375px`
- `768px`
- `1024px`
- `1440px`

Responsive requirements:
- Convert the desktop sidebar into a compact mobile navigation pattern.
- Stack multi-column layouts when there is insufficient space.
- Keep primary actions visible and easy to tap.
- Allow tables and long technical content to adapt without breaking the page.
- Avoid fixed-width panels that overflow on mobile.
- Ensure dialogs fit within the available viewport.
- Do not hide critical warnings, privacy disclosures, or evidence limitations on small screens.

## 15. Accessibility Requirements

Follow WCAG 2.2 AA as the target standard.

- Use sufficient text and non-text contrast.
- Provide a visible keyboard focus indicator.
- Maintain semantic heading order.
- Ensure interactive targets are sufficiently large and spaced.
- Support keyboard navigation.
- Associate form labels and error messages correctly.
- Provide meaningful accessible names for controls.
- Avoid color-only status communication.
- Respect reduced-motion settings.
- Test at browser zoom and narrow viewport widths.

Detailed requirements and verification steps belong in `ACCESSIBILITY.md`.

## 16. Dark Mode

Dark mode is not required for the initial release unless it can be implemented and tested without delaying core functionality.

Do not add a nonfunctional theme toggle.

If dark mode is introduced later:
- Define a complete semantic dark palette.
- Preserve readable contrast.
- Verify every status color and focus indicator.
- Persist the user's preference only through an explicitly designed, privacy-appropriate settings mechanism.
- Test all pages and controls in both themes.

## 17. CSS Architecture

Keep design tokens centralized, for example in:

`frontend/src/styles/tokens.css`

Use separate stylesheets or clearly scoped component styles where appropriate.

Rules:
- Avoid scattering arbitrary color values throughout components.
- Avoid global selectors that unintentionally affect unrelated components.
- Do not use `!important` as a routine styling strategy.
- Do not create duplicate components for slightly different visual treatments when a reusable variant is appropriate.
- Keep responsive breakpoints consistent.
- Remove obsolete styling when components change.
- Avoid adding a large UI framework unless the existing stack genuinely needs it.

## 18. Implementation Verification

Before considering the design system implemented:

- [ ] All core colors and spacing values are centralized as tokens.
- [ ] Typography follows the defined scale.
- [ ] Buttons have consistent variants and interaction states.
- [ ] Form controls share consistent styling.
- [ ] Alerts and status labels include meaningful text.
- [ ] Loading, empty, error, and unavailable states are styled.
- [ ] Desktop and mobile layouts have been checked.
- [ ] Keyboard focus is visible.
- [ ] Contrast has been verified for important text and controls.
- [ ] No fabricated data or fake analysis progress is displayed.
- [ ] No visible control is knowingly left nonfunctional.
- [ ] The interface remains consistent across all implemented pages.

## 19. Final Rule

When a visual decision is unclear, prioritize readability, accessibility, privacy, consistency, and truthful communication over decoration.

Haven should look like a carefully designed digital-safety and forensics product—not a generic AI dashboard.
