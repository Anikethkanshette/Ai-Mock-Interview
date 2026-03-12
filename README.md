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

## Backend APIs (Implemented)

### Start Interview

- `POST /api/interviews/start`

Request body:

```json
{
   "candidateName": "Aniketh",
   "role": "backend",
   "level": "mid",
   "resumeText": "Backend engineer with Node.js, Express, PostgreSQL and AWS experience."
}
```

Returns `sessionId`, extracted `resumeHighlights`, and first interviewer question.

### Submit Answer

- `POST /api/interviews/:sessionId/answer`

Request body:

```json
{
   "answer": "Your answer to the current interviewer question"
}
```

Returns score, feedback, and next question (or final summary when completed).

### Session Details

- `GET /api/interviews/:sessionId`

Returns complete interview state with all questions and answers so far.

### List Sessions

- `GET /api/interviews`
- Optional query params: `role`, `status`, `candidateName`

Returns interview history summaries for dashboard and filtering.

### Interview Result

- `GET /api/interviews/:sessionId/result`

Returns aggregate stats including average score, total/answered questions, and completion status.

### Terminate Interview

- `POST /api/interviews/:sessionId/terminate`

Marks an active interview as terminated and returns updated session summary.

### Platform Analytics

- `GET /api/interviews/analytics/overview`

Returns platform-level metrics: total sessions, status split, average score, role distribution.

## Current Interview Behavior

- Generates role-based technical questions for `frontend`, `backend`, `fullstack`, `data`, `devops`
- Extracts resume highlights and asks resume-deep-dive questions
- Uses phase-based interview rounds (`intro`, `resume`, `technical`, `system`, `behavioral`)
- Evaluates answers with rubric scoring (technical accuracy, communication, problem-solving, impact)
- Inserts adaptive follow-up probing questions for weak and exceptional answers
- Produces strengths/improvement insights in result summary

## Suggested Next Steps

- Add auth flow and user profiles
- Integrate LLM provider for dynamic conversational follow-up
- Persist sessions in database instead of in-memory storage
- Add interview history dashboard
