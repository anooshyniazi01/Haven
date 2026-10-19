# Haven — Privacy Requirements

## 1. Purpose

This document defines how Haven collects, processes, stores, displays, and deletes information.

Haven may be used by people dealing with sensitive images, harassment, or blackmail. Privacy must therefore influence product design, storage decisions, AI integration, logging, and user-facing explanations.

This document is an engineering specification, not a claim that Haven already complies with every applicable privacy law.

## 2. Privacy Principles

Haven must follow these principles:

- Data minimization: collect only what the application needs.
- Local-first processing: prefer local analysis when technically feasible.
- Transparency: explain what happens to uploaded files.
- User control: provide clear information about saving, exporting, and deleting data.
- Purpose limitation: do not reuse evidence for unrelated purposes.
- Safe defaults: do not expose uploaded files publicly.
- Honest communication: never promise confidentiality, anonymity, or deletion beyond what has been verified.

## 3. Information Haven May Handle

### Uploaded images

May include:
- Original image bytes.
- Original filename.
- File size and detected format.
- SHA-256 hash.
- Technical image properties.
- Model outputs and analysis reports.

### Evidence Vault records

May include:
- Preserved files.
- File hashes.
- Descriptions.
- Associated analysis references.
- Record timestamps.

### Incident records

May include:
- Incident title.
- User-provided notes.
- Reported incident date.
- Tracking status.
- References to related evidence.

### Technical application data

May include:
- Application error categories.
- Processing status.
- Model and software versions.
- Non-sensitive operational diagnostics.

Do not collect identity information, contacts, location, or other personal details unless a clearly defined feature requires them.

## 4. Data Collection Rules

- Do not require users to provide their real name to analyze an image.
- Do not collect phone numbers, email addresses, or social-media accounts by default.
- Do not request passwords or account credentials belonging to other services.
- Do not collect device location.
- Do not scrape social-media profiles or contact lists.
- Do not automatically search a user's device for images.
- Do not upload files without a deliberate user action.
- Do not add analytics or telemetry that transmits sensitive information by default.

Any future feature that requires additional data must document why the data is needed and whether a less intrusive alternative exists.

## 5. Local Processing and External Services

The preferred initial design is local processing on the machine running Haven.

Before integrating an external AI API, storage provider, analytics service, or other third-party service, document:

- The service and provider.
- The exact data sent.
- The purpose of transmission.
- Whether the transmission is optional.
- Relevant retention and training policies, where known.
- The service's applicable privacy terms.
- The failure behavior if the service is unavailable.

Users must receive clear disclosure before sensitive evidence is sent to an external service.

Do not claim that an external provider never retains or trains on submitted data without verified documentation supporting that claim.

## 6. File Storage and Access

- Keep uploaded images outside publicly served frontend directories.
- Store files using backend-managed identifiers.
- Avoid publicly accessible image URLs.
- Do not expose absolute filesystem paths.
- Do not place sensitive files in frontend assets, source control, or public demo repositories.
- Avoid unnecessary duplicate copies of uploaded evidence.
- Restrict file access to intended application workflows.

For the initial local prototype, explain where files are stored and whether other users of the same machine could access them through operating-system permissions.

Local storage does not automatically provide confidentiality against other people with access to the machine.

## 7. Analysis and Model Data

Haven must distinguish between the original image and information derived from it.

Derived information may include:
- Image dimensions and format.
- Extracted metadata.
- File hashes.
- Model classifications and scores.
- Explanations and limitations.
- Generated PDF reports.

Requirements:
- Do not use uploaded images to train or fine-tune models by default.
- Do not transmit images to model providers without documented disclosure.
- Do not retain intermediate copies unnecessarily.
- Do not include image bytes in ordinary logs.
- Document whether generated reports contain sensitive metadata.
- Preserve the original separately when creating transformed analysis inputs.

A model result must not be reused for an unrelated purpose without an explicit product and privacy decision.

## 8. Evidence Vault Privacy

The Evidence Vault is intended to preserve files the user chooses to save.

Requirements:
- Explain the difference between an uploaded analysis and saved evidence.
- Do not silently save every upload to the vault.
- Clearly indicate when a file is being saved.
- Do not expose saved evidence through public URLs.
- Do not reuse evidence as a public demo example.
- Do not include evidence in bug reports or analytics by default.
- Preserve the relationship between an evidence item and its associated analysis where applicable.

If evidence is saved automatically as part of a future workflow, explain that behavior before the user activates it.

## 9. Incident Tracker Privacy

Incident descriptions may contain sensitive information about people and events.

Requirements:
- Keep incident notes private to the intended application context.
- Do not send notes to an external AI service without disclosure.
- Do not infer or store allegations as verified facts.
- Do not collect unnecessary personal details about alleged perpetrators or victims.
- Do not publish incident records.
- Do not automatically contact authorities, platforms, or other people.

The application should allow users to record relevant information without pressuring them to disclose more than necessary.

## 10. Logging and Diagnostics

Logs must not become an accidental copy of a user's evidence.

Do not log by default:
- Raw uploaded files.
- Full incident descriptions.
- Image contents or thumbnails.
- Credentials and secrets.
- Unnecessary personally identifying information.
- Sensitive model inputs or outputs.

Use non-sensitive error codes and request identifiers where possible.

If detailed diagnostics are needed, redact sensitive information and document the retention behavior.

Development logs should be reviewed before being shared in public issue trackers or included in a repository.

## 11. Retention and Deletion

Haven must not imply that information is deleted everywhere merely because a database row disappears.

Before implementing deletion, document:
- Which database records are removed.
- Which files are removed.
- Whether derived reports or temporary files remain.
- Whether logs or backups retain copies.
- How interrupted deletion is handled.
- What deletion guarantees can actually be made.

Provide clear user-facing descriptions of implemented deletion behavior.

Do not claim secure erasure unless it has been technically verified for the relevant storage system and copies.

A future deployed service must establish a documented retention policy appropriate to its purpose and applicable obligations.

## 12. Exported Reports

PDF reports may contain sensitive information.

Requirements:
- Generate reports only from the intended saved analysis.
- Include only information needed for the report's purpose.
- Avoid including unrelated incident notes or personal details.
- Do not transmit reports to external services without disclosure.
- Use safe filenames.
- Tell users that downloaded reports may remain on their devices.
- Do not claim that deleting the server-side record removes previously downloaded copies.

## 13. User Interface and Privacy Notices

The interface should explain, in plain language:

- Whether an uploaded image is processed locally.
- Whether it is saved after analysis.
- Whether it is preserved in the Evidence Vault.
- Where application data is stored.
- Whether an external service receives any data.
- What information a generated report contains.
- What deletion does and does not remove.

Avoid vague statements such as "Your data is 100% secure" or "Everything is permanently deleted" unless the relevant guarantees have been established.

## 14. Public Demonstrations and Repositories

- Use synthetic, licensed, or otherwise appropriate public sample images for demonstrations.
- Never commit private evidence to Git.
- Exclude uploaded files, generated reports, databases, logs, and temporary evidence from version control where appropriate.
- Review screenshots and screen recordings before publishing them.
- Do not use real victims' images in a public demo without an appropriate lawful basis and explicit authorization.
- Avoid displaying real names or sensitive incident details in sample data.

Use obviously fictional sample records when demonstrating the Incident Tracker.

## 15. Authentication and Multiple Users

The initial local prototype may not include accounts.

However, if Haven is deployed for multiple users:
- Define authentication.
- Associate each record with the appropriate owner or access scope.
- Enforce authorization on every protected resource.
- Prevent users from accessing other users' files, analyses, reports, and incidents.
- Define account deletion and data export behavior.
- Reassess backups, logging, and retention.

Do not present a shared or publicly reachable instance as private merely because its routes are difficult to guess.

## 16. Privacy Testing

Tests must verify that:
- Uploads are not exposed through public frontend paths.
- Evidence is not sent to undocumented external services.
- Logs do not contain file bytes or unnecessary sensitive fields.
- API responses do not reveal internal storage paths.
- Incident descriptions are not accidentally exposed in unrelated responses.
- Saved evidence is only returned through intended application workflows.
- PDF exports contain only approved fields.
- Temporary files are handled according to the documented policy.
- Deletion behavior matches the actual implementation.
- Multi-user authorization works before a multi-user release.

## 17. Future Legal and Deployment Review

Before public deployment, review applicable privacy and data-protection obligations for the intended jurisdictions, user population, hosting location, and data-processing arrangements.

Do not claim legal compliance based solely on this document.

If Haven becomes a hosted service, establish a clear privacy notice and retention policy that accurately describes the implemented system and its third-party providers.

## 18. Acceptance Criteria

Privacy requirements are not satisfied if:
- Sensitive uploads are publicly accessible.
- Files are transmitted to an undisclosed external service.
- Evidence is reused for training without a documented decision and appropriate disclosure.
- Logs routinely contain sensitive image or incident content.
- The interface makes unsupported confidentiality or deletion promises.
- A deployed multi-user system lacks effective access controls.
- Public demonstrations expose private evidence.
- Data collection exceeds the documented feature requirements without justification.

## 19. Maintenance

Update this document whenever:
- A new external service is integrated.
- Storage behavior changes.
- The application begins collecting additional information.
- Authentication or multiple-user support is added.
- Retention or deletion behavior changes.
- Analytics or telemetry is introduced.
- A new report or evidence-sharing feature is implemented.

Privacy claims must describe the actual application behavior, not intended future behavior.
