# Architecture Notes

## Overview

This project follows a monorepo structure:

- `apps/web` handles candidate-facing UI
- `apps/api` handles business logic and AI orchestration
- `packages/shared` contains contracts shared between apps

## Core Modules (Planned)

### API

- `routes/`: API route definitions
- `controllers/`: request/response handling
- `services/`: interview generation, evaluation, transcript processing
- `middleware/`: auth, validation, error handling
- `config/`: environment and service configuration

### Web

- `pages/`: page-level views
- `components/`: reusable UI components
- `hooks/`: custom state/data hooks
- `services/`: API clients

### Shared

- `types/`: interview session, question, response models
- `constants/`: static enums and defaults

## AI Integration Direction

- Prompt templates per role and seniority
- Interview question generation per round
- Transcript-based evaluation and rubric scoring
- Structured feedback objects returned to web app
