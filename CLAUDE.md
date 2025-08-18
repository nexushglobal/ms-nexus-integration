# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS microservice called `ms-nexus-integration` that provides integration services for document validation, email sending, and file management via AWS S3. The service communicates over NATS messaging.

## Development Commands

Uses `pnpm` as the package manager.

### Setup
```bash
pnpm install
```

### Running the Application
```bash
pnpm run start:dev    # Development with watch mode
pnpm run start        # Standard development
pnpm run start:prod   # Production mode
```

### Code Quality
```bash
pnpm run lint         # ESLint with auto-fix
pnpm run format       # Prettier formatting
pnpm run build        # Compile TypeScript
```

### Testing
```bash
pnpm run test         # Unit tests
pnpm run test:watch   # Unit tests in watch mode
pnpm run test:cov     # Test coverage
pnpm run test:e2e     # End-to-end tests
pnpm run test:debug   # Debug mode for tests
```

## Architecture

### Microservice Structure
- **Transport**: NATS messaging system
- **Service Name**: `mx-nexus-integration` (defined in `src/config/constants.ts`)
- **Modules**: Document validation, Email sending, File management (AWS S3)

### Core Modules

1. **DocumentModule** (`src/document/`)
   - Validates documents using PeruAPIs service
   - Message pattern: `integration.document.validateDocument`

2. **EmailModule** (`src/email/`)
   - Sends emails via AWS SES
   - Message patterns: `integration.email.send`, `integration.email.verify`, `integration.email.health`

3. **FilesModule** (`src/files/`)
   - Manages file uploads to AWS S3
   - Supports general files and image validation
   - Message patterns: `integration.files.upload`, `integration.files.uploadImage`, `integration.files.delete`, etc.

4. **CommonModule** (`src/common/`)
   - Shared utilities including validation exception factory and service identifier interceptor

### Configuration
- Environment variables configured in `src/config/envs.ts` with Joi validation
- Copy `.env.example` to `.env` and fill required values
- Required services: NATS, AWS SES, AWS S3, PeruAPIs token

### Message Patterns
All controllers use NATS message patterns with the prefix `integration.{module}.{action}`:
- Document: `integration.document.validateDocument`
- Email: `integration.email.send`, `integration.email.verify`, `integration.email.health`
- Files: `integration.files.upload`, `integration.files.uploadImage`, `integration.files.delete`, `integration.files.getSignedUrl`, `integration.files.exists`, `integration.files.bucketInfo`, `integration.files.health`

## Environment Setup

Required environment variables (see `.env.example`):
- NATS connection: `NATS_SERVERS`
- AWS credentials: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`
- AWS SES: `AWS_SES_SMTP_USERNAME`, `AWS_SES_SMTP_PASSWORD`, `EMAIL_FROM`
- External APIs: `PA_TOKEN_PERUAPIS`
- Server: `PORT` (default: 3002)

## Key Features

- Global validation pipes with custom exception factory
- Service identifier interceptor for tracking requests
- AWS S3 file operations with signed URLs
- AWS SES email sending with SMTP verification
- Document validation via external API integration
- Health check endpoints for each module