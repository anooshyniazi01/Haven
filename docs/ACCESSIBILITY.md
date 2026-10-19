# Haven — Accessibility Specification

## 1. Purpose

This document defines accessibility requirements for Haven's frontend.

Haven must be usable by people with different abilities, input methods, devices, and assistive technologies. Accessibility is a core implementation requirement, not a visual improvement to postpone until the end.

The target is **WCAG 2.2 Level AA**.

## 2. Core Principles

Every implemented feature must aim to be:

- **Perceivable:** Information and interface states can be perceived through appropriate sensory methods.
- **Operable:** Users can navigate and interact without relying exclusively on a mouse.
- **Understandable:** Labels, instructions, errors, and workflows are clear.
- **Robust:** Semantic markup works with modern browsers and assistive technologies.

Accessibility requirements apply to every vertical slice, not just the final integration phase.

## 3. Semantic HTML

Use native HTML elements according to their intended purpose.

- Use `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>` where appropriate.
- Provide one clear primary page heading.
- Maintain a logical heading hierarchy.
- Use actual buttons for actions and links for navigation.
- Use lists for groups of related items.
- Use tables only for genuinely tabular information.
- Do not use generic `<div>` elements as interactive controls when native elements are appropriate.
- Avoid unnecessary ARIA attributes when native HTML already provides the required semantics.

The application must have a clear main-content landmark and a predictable document structure.

## 4. Keyboard Navigation

All functionality must be available using a keyboard unless the underlying task inherently requires a different input method.

Test navigation using:
- `Tab` and `Shift + Tab` to move between controls.
- `Enter` to activate links and appropriate controls.
- `Space` to activate buttons and toggle controls where expected.
- Arrow keys where required by native controls or a custom widget's established keyboard pattern.
- `Escape` to dismiss dialogs or popovers when appropriate.

Requirements:
- Maintain a logical focus order.
- Never create keyboard traps.
- Show a visible focus indicator.
- Do not remove the browser's focus outline without providing an equally visible replacement.
- Ensure menus, dialogs, file controls, and confirmation flows are keyboard accessible.
- When an item is removed or a dialog closes, return focus to a sensible location.
- Do not require hover to discover an essential action or instruction.

## 5. Screen Reader Support

Use accessible names and semantic relationships to explain the purpose and state of controls.

Requirements:
- Give every form control an associated label.
- Give icon-only buttons an accessible name.
- Ensure links describe their destination or purpose.
- Associate validation messages and relevant instructions with their controls.
- Use accessible names for navigation and repeated action groups when needed.
- Provide useful alternative text for meaningful images.
- Use empty alternative text for purely decorative images.
- Do not expose technical implementation details that do not help users understand the interface.

Use ARIA live regions sparingly for important dynamic updates, such as:
- Upload completion or failure.
- Analysis completion or failure.
- Successful evidence-record creation.
- Important validation messages.

Routine interface changes must not generate excessive announcements.

## 6. Color and Contrast

Follow WCAG 2.2 AA contrast requirements.

At minimum:
- Normal text should have a contrast ratio of at least `4.5:1`.
- Large text should have a contrast ratio of at least `3:1`.
- Relevant non-text interface components and graphical indicators should meet the applicable `3:1` contrast requirement.

Check actual foreground and background combinations, including:
- Primary and secondary buttons.
- Disabled and enabled states.
- Form borders and focus indicators.
- Warning, error, success, and informational messages.
- Navigation states.
- Links within body text.

Do not assume that the design-system palette automatically meets every contrast requirement.

Never communicate meaning through color alone. Pair status colors with text, icons where useful, or another clear indicator.

## 7. Forms and Validation

Forms must remain understandable before, during, and after submission.

Requirements:
- Provide persistent labels.
- Identify required fields programmatically and visually.
- Explain expected formats and file restrictions.
- Show errors near the relevant controls.
- Describe what went wrong and how to correct it when possible.
- Preserve valid user input after recoverable errors.
- Move focus appropriately when submission reveals important validation errors.
- Do not depend solely on color to identify invalid fields.
- Avoid repeatedly announcing the same error.
- Ensure validation messages remain available to screen readers.

For file uploads, explain accepted file types, size limits, and relevant privacy information before the user submits a file.

## 8. Image Upload and Analysis Accessibility

The image-analysis workflow must not depend on drag-and-drop alone.

Provide:
- A keyboard-accessible file-selection button.
- Clear supported-file information.
- Accessible upload progress when real progress is available.
- A meaningful success or failure announcement.
- A clear distinction between technical inspection and model-generated findings.
- Readable analysis results without requiring users to interpret a chart or color alone.
- Text equivalents for important visual measurements.
- Explanations of inconclusive or unavailable results.

If an uploaded image preview is meaningful to the task, provide appropriate alternative text or an accessible description. Do not automatically expose sensitive image details through verbose announcements.

Never use animation, color, or a visual indicator as the only way to communicate that analysis has finished.

## 9. Dialogs, Menus, and Notifications

For modal dialogs:
- Provide an accessible title.
- Move focus into the dialog when it opens.
- Keep keyboard focus within the modal while it is active.
- Support dismissal with `Escape` when appropriate.
- Return focus to the invoking control when it closes.
- Ensure background content cannot be interacted with while a true modal is active.

For non-modal notifications:
- Use an appropriate live-region behavior when an announcement is necessary.
- Avoid interrupting screen-reader users with low-priority updates.
- Keep important messages visible long enough to read.
- Do not automatically dismiss critical safety or error information without a reliable way to access it again.

Destructive actions should have understandable labels and confirmation when appropriate.

## 10. Motion and Animation

Respect the operating system's reduced-motion preference.

Use CSS media queries such as `prefers-reduced-motion: reduce` to minimize or remove nonessential transitions and animations.

Requirements:
- Avoid flashing content.
- Do not use motion as the only way to communicate a change.
- Do not create unnecessary parallax, looping animations, or moving backgrounds.
- Do not simulate analysis activity using decorative progress animations.
- Keep loading indicators subtle and understandable.
- Ensure the interface remains usable when animations are disabled.

## 11. Responsive Accessibility

Test the interface at:
- `320px`
- `375px`
- `768px`
- `1024px`
- `1440px`

Also test browser zoom up to `200%` and reflow at narrow viewport widths.

Requirements:
- Avoid horizontal scrolling for ordinary page content at narrow widths.
- Keep essential actions accessible.
- Ensure menus and dialogs fit within the viewport.
- Do not clip labels, errors, warnings, or technical findings.
- Use readable font sizes and adequate spacing.
- Ensure controls have sufficiently large targets and spacing in accordance with WCAG 2.2 AA, including the applicable minimum target-size criterion.
- Allow long hashes and technical identifiers to wrap or scroll within a clearly bounded region without breaking the whole page.

## 12. Tables, Charts, and Technical Data

Any important information shown visually must also be available in a usable textual form.

- Provide clear column headers for data tables.
- Associate headers with their corresponding cells where necessary.
- Avoid using color as the only indicator in charts.
- Provide a textual summary of important chart findings.
- Keep units beside numerical measurements.
- Explain technical terms when users need that explanation to interpret a result.
- Ensure long hashes can be copied and read without forcing the entire page to overflow.
- Preserve meaningful reading order on mobile layouts.

If a chart is unnecessary for a small amount of data, prefer a simple accessible table or text presentation.

## 13. Language and Safety Content

Haven's content may be read by users experiencing stress or coercion. Accessibility includes clear, respectful communication.

- Use short, direct sentences where possible.
- Explain technical terms without unnecessary jargon.
- Avoid blaming or shaming language.
- Do not rely on vague labels such as “failed” when a more specific explanation is possible.
- Make privacy disclosures and evidence limitations easy to find.
- Do not present model predictions as certainty.
- Make urgent safety information accessible without requiring users to complete an analysis first.

## 14. Testing Requirements

Accessibility testing must include automated checks and manual interaction.

### Automated checks

Use an appropriate accessibility testing tool, such as axe, alongside the existing frontend test setup.

Automated checks should cover representative pages and interactive states.

### Manual checks

Verify that:
- [ ] All interactive features work with a keyboard.
- [ ] Focus indicators are visible.
- [ ] Focus order is logical.
- [ ] Screen readers can identify page headings, landmarks, labels, and controls.
- [ ] Form errors are understandable and associated with the relevant fields.
- [ ] Upload and analysis updates are announced appropriately.
- [ ] Dialogs manage focus correctly.
- [ ] Text and interface contrast meet applicable requirements.
- [ ] The interface works at narrow widths and increased zoom.
- [ ] Reduced-motion preferences are respected.
- [ ] Statuses and important findings are not communicated through color alone.
- [ ] No critical action depends on hover or drag-and-drop.
- [ ] No serious accessibility issue remains unresolved in a core workflow.

Automated tools cannot prove full accessibility. Manual testing remains necessary.

## 15. Implementation Rule

Every new component or feature must be tested for accessibility as part of its vertical slice.

Do not postpone labels, keyboard support, focus behavior, semantic markup, or accessible error handling until the end of development.

If a custom interaction creates unnecessary accessibility complexity, prefer a simpler native HTML control.
