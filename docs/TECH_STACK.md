# Haven — Technology Stack

**Document version:** 1.0  
**Status:** Proposed baseline  
**Purpose:** Define the approved technology choices for the MVP.

## 1. Technology Principles

Haven must use a maintainable, practical stack that supports genuine AI inference, secure file handling, reliable persistence, and end-to-end testing.

Technology choices must be based on product requirements rather than novelty.

- Prefer mature, well-supported libraries.
- Avoid unnecessary dependencies and infrastructure.
- Pin or lock dependency versions using the appropriate package manager.
- Verify compatibility before adding packages.
- Do not replace an approved technology without documenting the reason.
- Do not introduce a cloud service when local processing is sufficient.
- Keep AI inference separate from the frontend.
- Treat privacy and security as architectural requirements.

## 2. Frontend

### Framework: React

React will provide the component-based user interface.

Use reusable components and feature-oriented organization rather than placing the entire application in a single component.

### Language: TypeScript

TypeScript will provide static type checking for frontend logic and API data.

Avoid using `any` as a shortcut. Define types for important requests, responses, records, and UI states.

### Build tool: Vite

Vite will run the development server and build the production frontend.

### Styling: CSS

Use CSS with a consistent design-token system for colors, typography, spacing, borders, and responsive behavior.

CSS Modules or a similarly scoped styling approach may be used where appropriate.

Do not add a large UI framework or styling dependency without a clear benefit.

### Routing: React Router

Use React Router if the application has multiple navigable pages and route-level layouts.

### API communication

Use the browser's Fetch API or a small, justified HTTP client abstraction.

Create a shared API layer for:

- Base URL configuration.
- Request and response handling.
- Error normalization.
- JSON requests.
- Multipart file uploads.
- Timeouts where appropriate.

Do not hardcode the backend URL throughout individual components.

### Frontend validation

Validate inputs in the frontend for usability, but never rely on frontend validation as the security boundary.

The backend must independently validate incoming requests and uploaded files.

### Frontend testing

Use:

- Vitest for unit and component tests.
- React Testing Library for user-focused component tests.
- A browser-based end-to-end testing tool such as Playwright for critical workflows.

Install the end-to-end testing dependency when the project reaches the stage where it can run meaningful application workflows.

## 3. Backend

### Language: Python

Python will support the API, data processing, media analysis, and report generation.

### API framework: FastAPI

FastAPI will expose the application's HTTP API.

Use typed request and response schemas, appropriate status codes, and structured error handling.

### Schema validation: Pydantic

Use Pydantic for request validation, configuration models where appropriate, and structured API responses.

### Database: SQLite

SQLite will be the initial MVP database.

It is suitable for a local development application and avoids unnecessary database infrastructure during the early slices.

If the intended deployment later requires concurrent multi-user access, stronger operational guarantees, or remote database access, reassess the database through a documented decision.

### ORM: SQLAlchemy

Use SQLAlchemy for database models and controlled database access.

Keep database operations separate from API route handlers and business logic.

### Schema migrations: Alembic

Use Alembic to manage schema changes.

Do not rely on manually editing a database file as the only way to update the schema.

### Backend testing

Use pytest for unit and integration tests.

Use FastAPI's testing utilities and an isolated test database to verify API behavior and persistence.

### Backend development server

Use Uvicorn to run the FastAPI application during development.

## 4. AI and Media Analysis

### Language and environment

Use Python for the analysis pipeline.

Keep model dependencies and inference code isolated from unrelated API logic.

### Model selection

Select an actual pretrained model or documented analysis method suitable for the chosen media-forensics task.

Before adoption, investigate:

- Intended task and supported inputs.
- Model architecture and output meaning.
- License and permitted use.
- Model availability and download requirements.
- Hardware and memory requirements.
- Inference latency.
- Evaluation dataset and reported performance.
- Known limitations and failure modes.
- Suitability for the types of media Haven expects to receive.

Do not select a model merely because its name includes "deepfake" or because it produces an impressive-looking score.

### Inference implementation

The analysis service must:

- Validate its input.
- Apply the documented preprocessing pipeline.
- Load the configured model or analysis implementation.
- Perform real inference.
- Validate the returned output.
- Handle model-loading and inference failures.
- Record available model and method metadata.
- Return structured results to the backend.

Do not put model inference directly inside frontend code.

### Model dependencies

Use the framework required by the selected model, such as PyTorch, only after model selection and compatibility checks.

Do not install several large AI frameworks speculatively.

### Model files

Do not commit large model weights or sensitive uploaded evidence to Git.

Document how required model files are obtained, verified, and configured.

Do not download or execute an untrusted model artifact without evaluating its source and loading requirements.

### AI result interpretation

The application must distinguish a model prediction from verified fact.

A confidence score is not automatically a calibrated probability that media is fake.

Do not claim that an image is authentic or manipulated with certainty based solely on model output.

## 5. File Storage

Use a dedicated local storage directory for uploaded media during development.

The storage layer must:

- Generate safe internal file identifiers.
- Avoid using untrusted filenames as storage paths.
- Keep uploaded files outside the public frontend directory.
- Validate file content and format.
- Enforce configured size limits.
- Store file metadata and storage references in the database.
- Restrict file retrieval through backend operations.
- Handle missing files and failed storage operations.
- Follow the documented deletion policy.

Keep storage configuration separate from business logic so a different storage backend can be considered later without rewriting the entire application.

## 6. File Integrity

Use Python's standard `hashlib` library to calculate SHA-256 hashes when the integrity feature is implemented.

Record the hashing procedure and the file version to which a hash applies.

A hash can help detect changes to file contents after the hash was recorded. It does not prove that the file was authentic before ingestion or establish its creation time.

## 7. PDF Generation

Choose a maintained Python PDF library once the PDF export slice is ready.

Evaluate the library against:

- Valid PDF generation.
- Text layout and pagination.
- Long incident timelines.
- Unicode text support.
- Error handling.
- Maintainability and licensing.

Use the same report-generation service for consistent formatting where appropriate.

Generate PDFs from saved records rather than fabricated frontend state.

Do not add a PDF library before it is needed by the implementation plan.

## 8. Configuration and Secrets

Use environment variables for environment-specific configuration.

Provide example environment files containing placeholder values only.

Do not commit real credentials, tokens, private keys, or production secrets.

Configuration must cover relevant settings such as:

- API environment and base URL.
- Database location.
- Upload directory.
- Maximum upload size.
- Allowed file formats.
- Model location and configuration.
- Logging level.

Validate required configuration at startup and provide clear errors when configuration is missing or invalid.

## 9. Dependency Management

### Frontend

Use npm and the project's `package.json` and `package-lock.json`.

Install only the dependencies required by implemented or immediately planned functionality.

### Backend

Use a Python virtual environment and a Python dependency manager such as uv.

Maintain the project's dependency declarations and lockfile consistently.

Do not fabricate or manually invent lockfile contents.

### Dependency policy

- Check package maintenance and compatibility.
- Avoid unnecessary overlapping libraries.
- Review security advisories when practical.
- Document significant dependency additions.
- Do not update unrelated packages without a reason.
- Keep model-specific dependencies separate when doing so improves installation and maintenance.

## 10. Developer Tools

The expected development environment includes:

- Visual Studio Code.
- Git for version control.
- Node.js with npm.
- Python.
- A Python virtual environment.
- Terminal access for development and testing.
- Antigravity for AI-assisted coding.
- A supported web browser for testing the application.

Provide reproducible setup instructions once the repository structure and dependency configuration have been established.

## 11. Deployment Direction

The initial development target is local execution.

Do not introduce Docker, a cloud database, cloud file storage, or a production authentication provider simply to make the architecture appear more advanced.

Evaluate deployment infrastructure after the MVP's core workflows work reliably.

Before exposing Haven to external users, review authentication, authorization, HTTPS, file retention, access controls, secret management, dependency security, and operational monitoring.

A locally running MVP must not automatically be considered safe for public deployment.

## 12. Technologies Not Approved by Default

The following are not automatic requirements:

- Next.js or another frontend framework.
- A large component library.
- A global state-management library.
- Redis or a task queue.
- PostgreSQL for the initial local MVP.
- Kubernetes.
- Cloud storage.
- Paid AI APIs.
- A custom-trained deepfake model.
- Microservices.
- A complex authentication system before the deployment model is decided.

Any of these may be introduced if a real requirement justifies the additional complexity.

## 13. Compatibility and Change Control

Before adding a dependency or changing the stack:

1. Identify the requirement that cannot be met adequately with the existing stack.
2. Check compatibility with the current environment.
3. Consider installation size, complexity, licensing, maintenance, and security.
4. Explain the alternatives.
5. Document significant decisions in `DECISIONS.md`.
6. Update the relevant technical documentation.

Do not silently switch frameworks or introduce duplicate libraries.

## 14. Final Technology Direction

The initial Haven stack is:

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend language | TypeScript |
| Build tool | Vite |
| Styling | CSS with design tokens |
| Routing | React Router, when needed |
| Backend | Python |
| API | FastAPI |
| Validation | Pydantic |
| Database | SQLite |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| AI inference | Python and the selected model's framework |
| File hashing | Python `hashlib` |
| Backend testing | pytest |
| Frontend testing | Vitest and React Testing Library |
| End-to-end testing | Playwright, when introduced |
| Version control | Git |

The stack may be refined through documented technical decisions, but the application must remain simple enough to implement, test, and maintain reliably.