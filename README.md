# AI Mock Interview Project

Initial monorepo scaffold for an AI-powered mock interview platform.

## Project Structure

- `apps/web`: Frontend app (React + Vite)
- `apps/api`: Backend API (Express + TypeScript)
- `packages/shared`: Shared types/constants used by web and api
- `docs`: Architecture and product notes
- `scripts`: Utility scripts for setup/deployment later

## Getting Started

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Run frontend and backend in separate terminals:

   ```bash
   npm run dev:web
   npm run dev:api
   ```

3. Check API health endpoint:

   - `GET http://localhost:5000/api/health`

## Suggested Next Steps

- Add auth flow and user profiles
- Add interview session creation endpoint
- Integrate AI question generation service
- Add answer scoring and feedback pipeline
- Add interview history dashboard
