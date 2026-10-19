# Haven Frontend Engineering Skill

## 1. Purpose

Build Haven's frontend as a polished, accessible, responsive interface connected to real backend functionality.

The frontend must feel like a trustworthy digital safety and forensic-analysis product—not a generic AI dashboard. Follow `docs/UI_UX_SPEC.md`, `docs/DESIGN_SYSTEM.md`, and `docs/ACCESSIBILITY.md` for visual and interaction requirements.

## 2. Required Workflow

Before changing code:

1. Read the root `AGENTS.md`.
2. Read the current task in `docs/IMPLEMENTATION_PLAN.md`.
3. Read the relevant product and interface specifications.
4. Read `docs/API_SPEC.md` for any affected endpoint.
5. Read this skill.
6. Inspect the existing implementation before creating or modifying files.

Implement the smallest complete vertical slice. Do not build every page before integrating the backend.

For a feature involving image upload, for example, connect the upload interface to the real API, display actual processing states, handle the API response, and test the entire flow before starting another feature.

## 3. Technology and Code Quality

- Use React, TypeScript, and Vite as specified in `docs/TECH_STACK.md`.
- Use TypeScript types for component props, API responses, and application state.
- Avoid `any` unless genuinely necessary and explicitly justified.
- Keep components focused and reusable where reuse is justified.
- Separate presentation, API communication, and feature-specific logic.
- Keep API requests in the established service layer rather than scattering raw `fetch` calls throughout components.
- Follow existing project conventions instead of creating competing patterns.
- Use the router and state-management approach already selected for the project.
- Do not introduce unnecessary libraries or duplicate dependencies.
- Never suppress TypeScript errors merely to make a build pass.

## 4. Visual Direction

Haven should feel calm, credible, discreet, and professional.

Follow these principles:

- Use the design tokens defined in `docs/DESIGN_SYSTEM.md`.
- Maintain clear typography, intentional spacing, restrained colors, and consistent alignment.
- Give important actions clear visual priority.
- Use whitespace to make potentially stressful information easier to understand.
- Make forensic findings, limitations, and next steps easy to distinguish.
- Use restrained borders, shadows, and surfaces only where they improve hierarchy.
- Keep navigation predictable and page layouts coherent.
- Make the interface look deliberately designed rather than assembled from unrelated templates.

Avoid:

- Neon gradients and excessive purple-blue AI styling.
- Unnecessary glassmorphism, glowing cards, and decorative animations.
- Excessive rounded cards around every section.
- Random icons, emojis, and decorative graphics used in place of meaningful interface design.
- Fake charts, fake statistics, fabricated user activity, and invented success messages.
- Dense technical dashboards that overwhelm ordinary users.
- Generic hero sections copied across every page.

Do not redesign the visual system independently of the approved specifications.

## 5. Real Application Behavior

Every interactive element must perform its stated action.

- Buttons must trigger their intended operation.
- Forms must validate input and handle submission correctly.
- Upload controls must send actual files to the configured backend.
- Analysis screens must display actual API results.
- Saved reports must come from persisted application data.
- Loading indicators must correspond to real asynchronous operations.
- Error messages must explain what happened and what the user can do next.
- Empty states must reflect actual empty data, not fabricated examples.
- Navigation links must lead to implemented routes or clearly identified external destinations.

Do not use mock data, hardcoded analysis results, artificial progress timers, or simulated backend responses as production functionality.

If an endpoint is not implemented yet, make the dependency explicit during development. Do not present the feature as operational.

## 6. API Integration

- Follow the request methods, paths, schemas, and response formats in `docs/API_SPEC.md`.
- Use the configured API base URL and environment configuration.
- Do not hardcode machine-specific addresses throughout the application.
- Handle unsuccessful HTTP responses, network failures, invalid responses, and unexpected errors.
- Display server-provided messages only when appropriate and safe for users.
- Keep sensitive technical details out of user-facing errors.
- Prevent repeated submissions when an operation is already in progress.
- Avoid accidental duplicate uploads or analysis requests.
- Ensure that displayed data comes from the actual response or persisted records.

Do not silently change the frontend's expected response structure. If the API specification or implementation needs to change, update the relevant contract and coordinate the backend change.

## 7. Required UI States

Every data-driven feature must handle the states relevant to its behavior:

1. Initial state.
2. Loading or processing state.
3. Successful result state.
4. Empty state, where applicable.
5. Validation error state.
6. API or network failure state.
7. Retry or recovery state, where appropriate.

Do not leave the user staring at a permanent spinner when a request fails.

Do not display success before the backend confirms success. If processing continues asynchronously, communicate that accurately and use the actual processing status.

## 8. Image Upload Interface

For image upload features:

- Clearly communicate accepted formats and actual file-size limits.
- Validate file size and basic client-side constraints before sending.
- Treat client-side checks as convenience, not security enforcement.
- Provide an understandable way to select a file and review the selected filename.
- Prevent accidental duplicate submissions.
- Show meaningful upload and analysis status.
- Explain why a file is rejected when that information is safe to disclose.
- Never expose server storage paths or internal filenames.
- Do not place uploaded evidence in publicly accessible frontend assets.
- Do not upload evidence to third-party services unless the approved architecture explicitly allows it and users receive the required disclosure.

The backend remains responsible for authoritative file validation and access control.

## 9. Forensic Result Presentation

Present AI-assisted findings carefully and without overstating certainty.

- Distinguish observed technical properties from model predictions and interpretations.
- Display confidence values only when the actual model or analysis method provides a meaningful, documented value.
- Explain relevant limitations in understandable language.
- Never label an image definitively authentic or manipulated solely because a model produces a high score.
- Do not invent explanations for a prediction.
- Make it clear that an AI result is not proof of authenticity, intent, or wrongdoing.
- Keep warnings and uncertainty visible rather than hiding them in small print.
- Avoid language that blames or shames the person seeking help.

A hash match indicates matching bytes against the recorded hash; it does not prove origin, authenticity, or creation time.

## 10. Accessibility and Responsive Design

Follow `docs/ACCESSIBILITY.md`.

- Use semantic HTML elements.
- Provide accessible names for form controls and icon-only buttons.
- Ensure keyboard navigation and visible focus indicators.
- Associate validation messages with their relevant inputs.
- Maintain readable text contrast and sensible font sizes.
- Do not communicate important information through color alone.
- Respect reduced-motion preferences.
- Support narrow mobile screens, tablets, and desktop layouts.
- Prevent horizontal overflow and clipped essential content.
- Ensure dialogs, menus, and interactive controls can be operated accessibly.

Do not remove focus outlines without providing an equally visible alternative.

## 11. Privacy and Sensitive Data

- Never log uploaded image contents, secrets, tokens, or sensitive personal information in browser logs.
- Do not put private evidence or credentials in URL query parameters.
- Do not store sensitive evidence in browser storage unless the approved architecture explicitly requires it and documents the risks.
- Do not include evidence in analytics, telemetry, or external requests.
- Handle authentication and session behavior according to the approved architecture; do not invent a security mechanism.
- Clear temporary UI references when appropriate, without claiming that this securely erases data from memory, storage, or the device.
- Do not claim deletion from the server unless the backend confirms the operation.

## 12. Testing

Use the test tools specified in `docs/TECH_STACK.md` and `docs/TEST_PLAN.md`.

Add or update tests for:

- Component rendering and user interactions.
- Form validation.
- API loading, success, and failure behavior.
- Empty states and retry behavior.
- Upload restrictions and duplicate-submission prevention.
- Accurate rendering of real analysis results.
- Responsive layouts and accessibility where practical.

Use mocks only in isolated tests where appropriate. Do not mistake a mocked test for end-to-end verification against the actual backend.

Run relevant tests, linting, type checks, and build commands available in the project. Report the actual results and any checks that could not be run.

## 13. Definition of Done

A frontend task is complete only when:

- The implementation follows the approved design and API contracts.
- Interactive elements work as intended.
- Relevant states and errors are handled.
- Accessibility and responsive behavior have been considered.
- Real backend integration is present wherever required.
- Relevant tests and available checks have been run.
- No fabricated production data or unsupported forensic claims remain.
- Documentation has been updated if the implementation changes a contract or established behavior.

Report what changed, which checks were run, their actual outcomes, and any known limitations.