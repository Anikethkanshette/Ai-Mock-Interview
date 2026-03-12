# AI Mock Interview Platform

Production-style monorepo for a realistic AI interview simulator with **resume intelligence**, **live adaptive questioning**, **voice-assisted conversation**, and **evidence-based coaching**.

## Why this project stands out

- 🎯 **Real resume scanning** with section detection, role/level recommendation, coverage stats, and missing-signal analysis.
- 🧠 **Live 1:1 interview flow** that remembers candidate facts and adapts the next question in real time.
- 🛰️ **Evidence-backed interviewer/company intelligence** (with verification confidence and source links).
- 📊 **No-fake feedback model**: weaknesses and improvement plans are generated only from observable answer scores.
- ✨ **Animated premium UI experience**: ambient gradients, progress motion, chat-flow transitions, and polished dashboard cards.

## Animated Product Experience

The web app is designed to feel modern and interactive:

- Animated ambient backgrounds for depth and focus
- Dynamic interview progress bar during live rounds
- Real-time chat transcript flow (AI interviewer ↔ candidate)
- Voice input + speech output support for natural interview simulation
- Professional visual hierarchy across landing, auth, profile, and dashboard

## Monorepo Structure

- `apps/web` — React + Vite + TypeScript frontend
- `apps/api` — Express + TypeScript backend
- `packages/shared` — shared package space for reusable contracts
- `docs` — architecture and design notes

## Quick Start

1. Install dependencies:

    ```bash
    npm install
    ```

2. Start frontend + backend:

    ```bash
    npm run dev:web
    npm run dev:api
    ```

    or run both from one command:

    ```bash
    npm run dev
    ```

3. Build check:

    ```bash
    npm run build
    ```

4. Health check:

    - `GET http://localhost:5000/api/health`

## Core Workflow

1. Candidate uploads/pastes resume
2. API scans and extracts resume intelligence
3. Candidate starts a role/level/company-targeted interview
4. AI asks adaptive questions based on answers and known resume facts
5. Session produces evidence-based strengths, lacking areas, and improvement plan

## API Reference

Base URL: `http://localhost:5000/api`

### Resume & Intelligence

- `POST /interviews/resume/scan`
   - Supports text + file upload (`pdf`, `txt`, etc.)
   - Returns: extracted text, highlights, facts, section mapping, coverage %, missing signals, recommended role/level

- `POST /interviews/intelligence/predict`
   - Predicts likely question themes using company/interviewer/role inputs
   - Returns verification confidence and evidence links when available

### Interview Lifecycle

- `POST /interviews/start`
   - Starts a live session and returns first question + session intelligence

- `POST /interviews/:sessionId/answer`
   - Scores answer and returns feedback + next question (or final summary)

- `GET /interviews/:sessionId`
   - Full session snapshot (conversation, turns, facts, status)

- `GET /interviews/:sessionId/result`
   - Final aggregate result with evidence-based lacking/improvement lists

- `POST /interviews/:sessionId/terminate`
   - Ends an active interview safely

### Insights & History

- `GET /interviews`
   - Session summaries (supports `role`, `status`, `candidateName` filters)

- `GET /interviews/analytics/overview`
   - Platform metrics (total sessions, active/completed split, average score, role distribution)

## Current Capabilities

- Role-based rounds: `frontend`, `backend`, `fullstack`, `data`, `devops`
- Level-aware difficulty: `junior`, `mid`, `senior`
- Phase-based interviews: `intro`, `resume`, `technical`, `system`, `behavioral`, `follow-up`
- Rubric scoring:
   - Technical Accuracy
   - Communication
   - Problem Solving
   - Impact Orientation
- Professional profile management from dashboard
- Resume reality-check panel in user profile

## Tech Stack

- **Frontend:** React, Vite, TypeScript
- **Backend:** Node.js, Express, TypeScript, Multer, pdf-parse
- **Runtime Model:** In-memory session engine (current)

## Roadmap

- Database persistence for users and interview sessions
- Provider-backed LLM orchestration for richer natural follow-ups
- Replay mode with timeline visualization of answer quality over time
- Optional downloadable PDF performance report

---

If you want, I can also add a **README hero image / GIF section** so the animated UI feel is visible directly on the repository landing page.
