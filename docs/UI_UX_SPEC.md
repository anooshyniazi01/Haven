# Haven — UI/UX Specification

## 1. Purpose

This document defines the user interface and user experience requirements for Haven.

Haven is an AI-assisted image analysis and evidence management application designed for users who may be dealing with sensitive or distressing situations. The interface must communicate trust, clarity, privacy, and control.

The application must feel like a carefully designed digital safety and forensic workspace—not a generic AI chatbot, an ordinary administration dashboard, or a flashy AI-generated template.

The design should prioritize understandable information, calm interactions, useful feedback, and easy access to essential actions.

## 2. Design Direction

### 2.1 Product personality

Haven should feel:

- Calm rather than alarming.
- Professional rather than corporate.
- Private rather than intrusive.
- Technical where necessary, but understandable to nontechnical users.
- Modern without relying on fashionable visual effects.
- Supportive without being overly emotional.
- Trustworthy without claiming absolute security or forensic certainty.

### 2.2 Visual direction

Use a restrained, editorial visual style with a clean layout, thoughtful typography, subtle borders, and a limited color palette.

The preferred direction is a **hybrid of a quiet editorial interface and a focused forensic workspace**.

The public-facing introduction can feel light, welcoming, and spacious. The evidence-analysis workspace can use stronger contrast and more structured information layouts while maintaining visual consistency.

Avoid:
- Generic purple-blue AI gradients.
- Excessive glassmorphism.
- Neon outlines and glowing cards.
- Excessive rounded cards on every element.
- Decorative charts with no real data.
- Unnecessary animated backgrounds.
- Fake activity indicators.
- Stock dashboard metrics that have no functional meaning.
- Emoji-heavy navigation.
- Artificially generated-looking illustrations that do not support a real user task.

## 3. Target Users and Context

Haven should support people who need to inspect suspicious images, organize evidence, document incidents, or understand available safety resources.

Users may be:
- Unfamiliar with digital forensics.
- Working on a small laptop or mobile screen.
- Uncertain about what an analysis result means.
- Handling sensitive files.
- Experiencing stress or time pressure.

The interface must not require users to understand machine learning, cryptography, or file formats before they can complete basic tasks.

Important actions should be obvious, terminology should be explained, and errors should not blame the user.

## 4. Information Architecture

The main navigation should expose these core areas:

1. **Overview** — A summary of actual saved records and available actions.
2. **Analyze Image** — Upload an image and request supported analysis.
3. **Evidence Vault** — Browse, open, verify, and manage stored evidence.
4. **Incident Tracker** — Create and manage incident records.
5. **Safety Guide** — Access practical guidance and relevant support resources.
6. **Settings** — Configure supported application preferences and review relevant privacy information.

The exact routes and navigation structure must remain consistent with the API specification, database schema, and implementation plan.

Do not show navigation items for features that have not been implemented unless they are explicitly marked as unavailable or planned.

## 5. Application Shell

### 5.1 Desktop layout

Use a persistent, compact sidebar for primary navigation and a main content area for the current task.

The sidebar should include:
- Haven wordmark or logo.
- Primary navigation.
- A clear action to analyze an image.
- Access to settings and privacy information.

The main content area should have:
- A clear page title.
- A concise description where helpful.
- Contextual actions near the content they affect.
- Adequate spacing between sections.

The layout must remain useful at narrower desktop widths. Avoid making the sidebar so wide that the main workspace feels cramped.

### 5.2 Mobile layout

On narrow screens:
- Collapse the desktop sidebar into an appropriate mobile navigation pattern.
- Keep the current page title visible.
- Make important actions easy to reach.
- Prevent horizontal scrolling for ordinary content.
- Stack complex panels vertically.
- Ensure forms and action controls fit within the viewport.
- Preserve access to privacy and safety information.

The interface must remain functional rather than simply shrinking desktop elements.

### 5.3 Navigation behavior

- Use clear active states.
- Preserve context when navigating between related evidence and incident records.
- Avoid unnecessary navigation resets.
- Provide a clear route back from detail views.
- Use meaningful page titles and browser history behavior.
- Do not create dead links or buttons without working actions.

## 6. Overview Page

### Purpose

The overview provides an entry point to Haven and directs users toward their next task.

### Required content

- A concise welcome or introduction.
- A primary action to analyze an image.
- Access to the Evidence Vault.
- Access to the Incident Tracker.
- A small summary of actual saved records, where supported.
- A recent activity or recent records section only if real data is available.
- A discreet link to the Safety Guide.

### Data behavior

The overview must use real backend data.

It must not display fabricated counts, sample incidents presented as real records, or fake recent activity.

For a new installation with no records, show an intentional empty state that explains what the user can do next.

### Empty-state example

**Your workspace is ready.**

Your saved evidence and incident records will appear here when you add them.

Primary action: **Analyze an image**

Secondary action: **Learn how Haven handles evidence**

The exact copy may be refined during implementation, but the meaning must remain honest and useful.

## 7. Analyze Image Page

### Purpose

Allow users to upload a supported image and access the analysis functionality actually implemented by Haven.

### Layout

The page should contain:

- A clear title and short explanation.
- A prominent upload area.
- Supported format and size information.
- A visible privacy notice explaining where the file is processed.
- A clear analysis action.
- Validation and processing feedback.
- A result area that appears only when an actual result exists.

### Upload interaction

The upload area should support the file-selection method implemented by the application. Drag-and-drop may be included if it works reliably.

The interface must:
- Display the selected filename safely.
- Show relevant validation errors.
- Allow users to remove or replace the selected file before submission.
- Prevent accidental duplicate submissions.
- Show progress or processing state when supported.
- Preserve the distinction between a selected file and a successfully stored file.

Do not imply that choosing a file automatically uploads it unless that behavior is explicitly implemented and disclosed.

### Privacy notice

Explain, in concise language, whether processing occurs locally or on the configured backend and whether an external service receives the image.

Do not claim local-only processing if the image is transmitted to a remote backend. Do not claim that evidence never leaves the device unless that statement is accurate for the actual architecture.

### Analysis results

Results must display actual backend output.

The result layout may include:
- Analysis status.
- The model or method used.
- The returned assessment.
- Relevant technical findings.
- Uncertainty or limitations.
- A link to the saved evidence record, if one exists.
- An option to retry or return to the workspace when appropriate.

Clearly distinguish technical measurements from AI predictions.

Do not display a definitive "authentic" or "fake" verdict unless the claim is technically justified and appropriately supported. The default language should describe an assessment and its limitations rather than assert certainty.

## 8. Analysis Result Presentation

The analysis result should be organized so that users can understand it without needing to interpret raw model output.

Use the following information hierarchy where the available implementation supports it:

1. **Result summary:** A concise explanation of the actual assessment.
2. **Supporting information:** Relevant technical measurements or model outputs.
3. **Method information:** The model or technique used.
4. **Limitations:** What the result cannot establish.
5. **Next actions:** Save, verify, view related evidence, or consult relevant guidance.

Only render sections supported by actual data.

Do not:
- Invent confidence percentages.
- Present unsupported scores as probabilities.
- Use a decorative chart to make weak results appear scientific.
- Hide failed analysis behind an apparently completed report.
- Treat the absence of a manipulation signal as proof that an image is genuine.

If analysis fails, display the failure state rather than a partial success layout containing fabricated findings.

## 9. Evidence Vault

### Purpose

Provide a clear, organized view of the evidence actually stored in Haven.

### List view

Display relevant information such as:
- Original filename, if available.
- Evidence identifier.
- File type and size.
- Upload or record-creation time.
- Current analysis status, if applicable.
- Integrity verification status, if available.

The list must be populated from actual stored records.

### Interactions

Users should be able to:
- Open an evidence detail view.
- View available technical metadata.
- Review associated analysis results.
- Request integrity verification.
- Access supported export actions.
- Delete evidence according to the documented deletion workflow.

Destructive actions must be clearly distinguished from ordinary navigation.

### Evidence detail view

Present file information, hash information, analysis history, and associated records in separate, clearly labeled sections.

Explain hash verification in understandable language. A matching hash means the compared file bytes match the recorded baseline; it does not prove that the image is authentic or was never edited before that baseline was created.

Do not display private filesystem paths.

## 10. Incident Tracker

### Purpose

Help users organize incident-related notes and associate evidence with a documented incident.

### Incident list

Display actual incident records with useful information such as:
- User-provided title.
- Creation or update date.
- Current status, if the application implements status tracking.
- Number of associated evidence items, when available.

Do not invent incident severity levels, risk scores, or statuses.

### Incident creation and editing

Forms should:
- Use clear field labels.
- Explain optional versus required fields.
- Validate input.
- Preserve entered information when safe after validation errors.
- Provide confirmation when a record is saved.
- Display failures accurately.

Incident descriptions must be treated as user-provided information, not independently verified facts.

### Evidence association

Allow users to associate evidence with incidents according to the supported database relationships.

Clearly show which evidence is associated with a record. Do not imply that the association establishes a factual connection between an image and an alleged event.

## 11. Safety Guide

### Purpose

Provide practical, accessible guidance for users who may be dealing with image-based abuse, blackmail, or related privacy concerns.

### Content organization

Use short sections with clear headings, such as:
- Immediate personal safety.
- Preserving relevant information.
- Protecting accounts and devices.
- Considering reporting options.
- Finding trusted support.
- Understanding Haven's limitations.

The final content and external resources must be reviewed for accuracy before release.

### UX requirements

- Use calm, nonjudgmental language.
- Avoid victim-blaming.
- Avoid instructions to confront or threaten another person.
- Make urgent safety information easy to locate.
- Use descriptive links.
- Do not present general guidance as individualized legal advice.
- Do not imply that using Haven guarantees protection or a particular outcome.

## 12. Settings and Privacy Information

Settings should expose only preferences and controls that actually work.

Potential sections include:
- Application preferences.
- Evidence retention information.
- Privacy and data handling.
- Supported model or analysis information.
- Application version and configuration details.

Do not display nonfunctional toggles.

If deletion, local-only processing, or retention controls are not implemented, explain the current behavior instead of presenting an inactive control as functional.

## 13. Design of States

Every major feature must have appropriate states.

### Empty

Explain what is missing and offer a useful next action.

### Loading

Communicate that work is in progress without implying success.

### Success

Confirm the action that actually completed.

### Warning

Explain a meaningful limitation, uncertain result, or potentially destructive action.

### Error

Describe the problem and provide an appropriate next step.

### Unavailable

Explain when a feature or service cannot currently be used.

States must be based on actual application conditions. Do not use fake loading delays or simulated success messages to conceal missing functionality.

## 14. Interaction and Feedback

- Buttons must have clear labels describing their actions.
- Forms must provide useful validation feedback.
- Destructive actions should require confirmation where appropriate.
- Repeated submissions should not create unintended duplicate operations.
- Long-running work should provide suitable progress feedback.
- Notifications should be concise and should not obscure essential content.
- Disabled controls should communicate their state accessibly.
- Keyboard interaction must remain functional.
- Users must be able to recover from common errors without restarting the entire application.

Avoid unnecessary animations. Motion should communicate a meaningful transition and respect reduced-motion preferences.

## 15. Typography and Content

Use a readable, consistent typographic hierarchy.

Suggested hierarchy:
- Page title: prominent but not oversized.
- Section title: clear and compact.
- Body text: comfortable for extended reading.
- Metadata: smaller, but still readable.
- Technical identifiers: visually distinct and selectable.

Content must be direct, specific, and understandable.

Prefer:
- "Verify file integrity"
- "Analysis couldn't be completed"
- "View saved evidence"
- "This result does not prove authenticity"

Avoid vague or exaggerated phrases such as:
- "100% protected"
- "Guaranteed forensic proof"
- "AI has confirmed the truth"
- "Your evidence is completely untouchable"

## 16. Responsive Design

Support:
- Desktop layouts.
- Laptop layouts.
- Tablet-sized layouts.
- Narrow mobile layouts.

At smaller widths:
- Stack multi-column sections.
- Keep primary actions visible.
- Allow long identifiers and filenames to wrap or scroll within their intended container.
- Ensure tables or dense metadata sections have an appropriate responsive presentation.
- Avoid clipped dialogs and off-screen controls.
- Preserve readable line lengths and spacing.

Responsive behavior must be tested in a real browser at representative viewport sizes.

## 17. Visual Consistency

The interface should use a shared design system for:
- Color tokens.
- Typography.
- Spacing.
- Borders.
- Surface treatments.
- Buttons.
- Form controls.
- Cards and panels.
- Status indicators.
- Dialogs.
- Notifications.
- Loading and empty states.

Avoid implementing each screen with unrelated styles.

The design system will define the final token values and reusable component rules in `DESIGN_SYSTEM.md`.

## 18. Performance and Perceived Responsiveness

- Avoid loading large evidence files unnecessarily.
- Use thumbnails or derived previews when implemented and appropriate.
- Keep long-running analysis off the main UI thread where the architecture allows.
- Avoid blocking the entire interface during unrelated operations.
- Provide clear feedback during uploads and analysis.
- Handle slow or unavailable backend responses.
- Avoid expensive re-rendering for large evidence lists.

Do not display fake progress percentages when the backend cannot report meaningful progress. An indeterminate loading state is preferable to invented progress.

## 19. Accessibility

The interface must:
- Use semantic HTML elements.
- Provide labels for form controls.
- Support keyboard navigation.
- Maintain visible focus indicators.
- Use sufficient text and control contrast.
- Provide accessible names for icon-only controls.
- Announce important asynchronous status changes where appropriate.
- Avoid relying on color alone.
- Support browser zoom and text resizing.
- Respect reduced-motion preferences.

Detailed accessibility requirements are defined in `ACCESSIBILITY.md`.

## 20. Implementation Requirements

- Use React and TypeScript as defined in the technical stack.
- Use reusable components where repetition genuinely exists.
- Use the actual API and database for functional content.
- Keep interface state consistent with backend results.
- Handle loading, success, empty, and error states explicitly.
- Avoid duplicated business logic in the frontend.
- Keep styling organized and consistent with the design system.
- Use React Router where needed for the agreed route structure.
- Do not introduce unnecessary UI libraries without a practical reason.
- Ensure that all visible controls perform their advertised actions.

## 21. Acceptance Criteria

The UI/UX implementation is ready for verification when:

- [ ] The main navigation exposes the implemented core areas.
- [ ] The overview uses real saved data and honest empty states.
- [ ] Image upload clearly communicates supported inputs and processing behavior.
- [ ] Analysis results reflect actual backend outputs.
- [ ] Evidence records can be opened and reviewed through the intended workflow.
- [ ] Hash verification displays accurate results and limitations.
- [ ] Incident records use real persisted data.
- [ ] Safety guidance is accessible and nonjudgmental.
- [ ] Errors and loading states are implemented for major workflows.
- [ ] Destructive actions behave according to the documented rules.
- [ ] The interface works at supported screen sizes.
- [ ] Keyboard navigation and basic accessibility requirements are satisfied.
- [ ] There are no dead buttons, fake statistics, or fabricated results.
- [ ] The visual style is consistent with Haven's identity.
- [ ] Important user journeys pass end-to-end tests.

## 22. Final Principle

Haven's interface should help users understand what they can do, what the application has actually done, and what remains uncertain.

Every visual choice should support clarity, privacy, user control, or usability. A calm and professional interface is not just an aesthetic decision; it is part of making sensitive work easier to understand and manage.