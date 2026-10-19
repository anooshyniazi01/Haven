# Haven — Deployment Specification

## 1. Purpose

This document defines how to configure, run, test, and prepare Haven for deployment.

The initial priority is a reliable local development environment. Production deployment must only happen after the core workflows, security controls, and privacy requirements have been implemented and verified.

Deployment instructions must match the actual repository and implemented configuration. Do not document commands, services, or features that do not exist.

## 2. Deployment Principles

- Prefer a simple, reproducible setup over unnecessary infrastructure.
- Keep frontend and backend responsibilities clearly separated.
- Store configuration outside source code.
- Never commit secrets, private evidence, or local database files.
- Do not expose uploaded evidence through public frontend directories.
- Use dependency lockfiles for reproducible installations.
- Do not claim production readiness before the required checks pass.
- Document known limitations and incomplete security controls honestly.

## 3. Application Components

The intended application stack is:

### Frontend
- React
- TypeScript
- Vite
- npm for package management
- Production build generated through Vite

### Backend
- Python
- FastAPI
- Pydantic for request and response validation
- SQLAlchemy for database access
- Alembic for database migrations
- Uvicorn for local development serving

### Database
- SQLite for the initial development and small-scale deployment configuration.
- A future database migration must be planned if actual concurrency, operational, or deployment requirements exceed SQLite's suitability.

### AI and file processing
- Python-based image inspection and evaluated model inference where supported.
- SHA-256 hashing using Python's standard library.
- Local evidence storage outside the publicly served frontend directory.

Do not add Docker, cloud services, background queues, or other infrastructure unless an identified requirement justifies the additional complexity.

## 4. Repository Layout

The following locations describe the intended structure. The final implementation must follow `REPO_STRUCTURE.md` once it is created.

- `frontend/`: React application.
- `backend/`: FastAPI application.
- `backend/app/`: API, services, models, schemas, and configuration.
- `backend/tests/`: Backend tests.
- `frontend/src/`: Frontend source code.
- `frontend/tests/` or colocated test files: Frontend tests, according to the chosen convention.
- `docs/`: Product, architecture, security, and implementation documentation.
- `data/`: Local runtime data only, if required.

Generated uploads, evidence files, databases, logs, caches, and model artifacts must not be committed accidentally.

## 5. Prerequisites

Document and verify the supported versions when the initial project configuration is established.

Required tools:
- Git.
- A supported Node.js LTS version.
- npm compatible with the selected Node.js version.
- A supported Python version compatible with the chosen dependencies.
- A Python virtual environment.
- A terminal capable of running the documented commands.

Do not invent version requirements. Record the selected versions in the repository's setup documentation and configuration files.

## 6. Local Environment Configuration

Provide example environment files containing safe placeholders, such as `.env.example`, when environment variables are needed.

Typical configuration may include:

- `APP_ENV`: development or production.
- `API_HOST`: backend bind address.
- `API_PORT`: backend port.
- `DATABASE_URL`: database connection.
- `STORAGE_ROOT`: private evidence storage directory.
- `MAX_UPLOAD_SIZE_MB`: upload size limit.
- `FRONTEND_ORIGIN`: permitted frontend origin.
- `LOG_LEVEL`: application logging level.

These are examples of configuration names, not permission to introduce unnecessary variables. Use the actual names chosen in the implementation consistently across code and documentation.

Rules:
- Never commit real secrets.
- Never place private credentials in frontend environment variables.
- Treat frontend variables embedded by Vite as publicly visible.
- Do not put evidence contents, personal data, or API secrets in environment files unnecessarily.
- Validate required configuration during backend startup.
- Fail with a clear, non-sensitive error when required configuration is missing.
- Keep `.env` files out of version control.

## 7. Local Development Setup

The following commands are an initial setup pattern. Adjust them to match the actual project configuration.

### Step 1: Open the repository

```bash
git clone <repository-url>
cd Haven
```

If the repository already exists locally, use the existing directory instead of cloning it again.

### Step 2: Install frontend dependencies

```bash
cd frontend
npm ci
```

Use `npm ci` when a valid npm lockfile exists. If the project has not yet generated a lockfile, install dependencies using the project's chosen initial setup process and commit the resulting lockfile.

### Step 3: Create the Python environment

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Windows Command Prompt:

```bat
.venv\Scripts\activate.bat
```

macOS or Linux:

```bash
source .venv/bin/activate
```

Install backend dependencies using the dependency manager and lockfile selected for the project. If using a `requirements.txt` workflow, a corresponding installation command is:

```bash
python -m pip install -r requirements.txt
```

Do not maintain conflicting dependency sources without a clear reason.

### Step 4: Configure the environment

Create local environment files from the documented examples where required. Set the private storage path and database location to appropriate local directories.

Do not copy real secrets into example files or commit local evidence.

### Step 5: Initialize the database

Use the migration command supported by the implemented Alembic configuration:

```bash
alembic upgrade head
```

Run this from the directory where the project's Alembic configuration is available.

If migrations have not been configured yet, implement and test them before relying on this command.

### Step 6: Start the backend

A typical local development command is:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

This assumes `app.main:app` is the actual application import path and that the command is run from the appropriate backend directory. Update it if the repository uses another entry point.

Bind development services to localhost unless access from another device is explicitly needed.

### Step 7: Start the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

Use the local URL printed by Vite. Do not assume a port if the tool reports a different one.

### Step 8: Verify startup

Confirm that:
- The frontend loads.
- The backend health endpoint responds.
- The database can be accessed.
- The frontend can reach the backend.
- No required environment variables are missing.
- No evidence or database files are being served publicly.

A successful startup does not by itself establish that every feature works.

## 8. Health Checks

Implement a lightweight health endpoint, such as:

`GET /api/health`

The response should indicate whether the application is running and may include a simple application version.

Keep the public health response minimal. Do not expose:
- Environment variables.
- Secrets.
- Full filesystem paths.
- Uploaded filenames or evidence contents.
- Internal exception details.
- Sensitive database information.

If a separate readiness check is implemented, it may verify essential dependencies without disclosing internal configuration.

Document the actual endpoint and response schema in `API_SPEC.md`.

## 9. Database and Runtime Storage

The database and evidence storage must use explicit, predictable paths.

Requirements:
- Keep runtime data separate from source code where practical.
- Ensure required directories exist and have appropriate permissions.
- Apply database migrations during controlled setup or deployment.
- Avoid automatically deleting or replacing an existing database.
- Back up data before destructive migrations or maintenance.
- Keep generated files out of Git.
- Ensure development resets cannot accidentally target a production database.

SQLite database files must not be placed inside a publicly served frontend directory.

Evidence files must remain in private storage and must never be exposed through a static file mount.

## 10. File Upload and Resource Limits

Configure and enforce upload limits in the backend.

- Validate file size before expensive processing.
- Validate supported formats using more than the filename extension alone.
- Treat MIME types and client-supplied filenames as untrusted.
- Generate safe internal filenames.
- Restrict upload directories and filesystem permissions.
- Reject unsupported or malformed files safely.
- Apply appropriate processing time and memory limits.
- Prevent concurrent requests from exhausting available resources.
- Return controlled errors when limits are exceeded.

Do not log evidence contents, raw image data, secrets, or unnecessary personal information.

## 11. CORS and Network Exposure

During local development, allow only the actual frontend origins required by the application.

In production:
- Configure explicit permitted origins.
- Avoid wildcard origins when credentials are enabled.
- Do not treat CORS as authentication or authorization.
- Keep debug mode and automatic reload disabled.
- Use HTTPS through a properly configured deployment or reverse-proxy layer.
- Do not expose internal database or evidence-storage directories.
- Restrict administrative and maintenance endpoints.

Do not bind the backend to all network interfaces by default merely for convenience.

## 12. Production Build

Before building the frontend:

```bash
cd frontend
npm run build
```

Use the actual build script configured in `package.json`.

Verify that:
- The build completes successfully.
- TypeScript errors are addressed.
- No development-only configuration is exposed.
- API URLs are configured appropriately.
- No secrets are embedded in frontend assets.
- The production output contains no private evidence or local database files.

Serve the frontend using a suitable production web server or static hosting service after evaluating the security and routing requirements.

Do not use the Vite development server as the production hosting solution.

## 13. Production Backend

A production backend must:
- Use supported, pinned dependencies.
- Run with debug features disabled.
- Validate configuration at startup.
- Use controlled exception handling.
- Apply authentication and authorization if the deployed features require them.
- Protect private evidence and database access.
- Enforce upload and processing limits.
- Use appropriate HTTPS and network configuration.
- Avoid sensitive logging.
- Have tested database migration and recovery procedures.

Do not assume that changing `--host` or removing `--reload` alone makes a deployment production-ready.

## 14. AI Model Deployment

If Haven uses a pretrained model, document:
- Model name and source.
- License and usage restrictions.
- Required model files.
- Dependency versions.
- Hardware and memory expectations.
- Download or initialization behavior.
- Inference timeout and resource limits.
- Known evaluation limitations.

Do not download arbitrary executable model code at runtime without a reviewed and justified need.

Do not silently send uploaded evidence to a third-party inference service. Any external processing requires an explicit privacy and security decision, suitable disclosure, and appropriate safeguards.

If the model is unavailable, Haven must communicate the limitation honestly. It may offer implemented technical inspection or hashing if those functions remain available, but it must not invent AI findings.

## 15. Logging and Monitoring

Logs should support troubleshooting without creating an additional evidence repository.

Permitted logging may include:
- Application startup and shutdown.
- Request method and route, subject to privacy controls.
- Operation status and duration.
- Sanitized error categories.
- Model availability and version information.

Avoid logging:
- Image contents.
- Sensitive incident descriptions.
- Raw request bodies containing personal information.
- Authentication tokens or secrets.
- Unnecessary original filenames.
- Private evidence paths.

Production monitoring must not introduce undisclosed collection of sensitive user activity.

## 16. Backup and Recovery

Document backup procedures before storing real user evidence in a deployed environment.

Consider:
- Database backup consistency.
- Evidence-file backup requirements.
- Access controls and encryption for backups.
- Retention and deletion policies.
- Restoration testing.
- Recovery after interrupted writes or failed deployments.

A database backup without its associated evidence files may be incomplete. If the application promises to preserve both, the backup process must account for their relationship.

Do not claim that backups are encrypted, recoverable, or automatically deleted unless those behaviors have been implemented and verified.

## 17. Deployment Verification Checklist

Before a release:

- [ ] Frontend production build succeeds.
- [ ] Backend starts using production configuration.
- [ ] Required database migrations complete successfully.
- [ ] Health checks work without disclosing sensitive details.
- [ ] Core API and frontend integration tests pass.
- [ ] File upload restrictions are enforced by the backend.
- [ ] Evidence files are not publicly accessible.
- [ ] CORS and network binding are configured correctly.
- [ ] Secrets and environment files are excluded from Git.
- [ ] No private evidence or database files are included in build artifacts.
- [ ] AI behavior and model limitations are documented.
- [ ] Logging has been reviewed for sensitive information.
- [ ] Error responses do not expose internal stack traces.
- [ ] Backup and recovery expectations are documented.
- [ ] Accessibility and responsive checks have been completed.
- [ ] Known limitations are recorded.

Do not mark a checklist item complete without evidence that the relevant check was performed.

## 18. Initial Deployment Scope

The initial milestone is a reproducible local development setup with a working frontend, backend, database, and verified core workflows.

Public deployment is a separate milestone. Select a hosting provider only after evaluating:
- File-storage privacy.
- Persistent disk availability.
- Request and upload limits.
- Model memory and CPU requirements.
- Database persistence.
- HTTPS support.
- Cost and maintenance.
- Applicable privacy obligations.

Do not select infrastructure solely because it offers a free tier if it cannot safely support Haven's evidence-handling requirements.

## 19. Final Rule

Deployment must preserve the same honesty and privacy principles as the application itself.

A service that starts successfully is not automatically secure, production-ready, or suitable for sensitive evidence. Verify the actual behavior, document the remaining limitations, and never claim a control exists when it has not been implemented.
