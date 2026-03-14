# AI Mock Interview Platform

Production-style monorepo for a realistic AI interview simulator with **resume intelligence**, **live adaptive questioning**, **voice-assisted conversation**, and **evidence-based coaching** powered by multi-agent logic and Google Gemini.

## Why this project stands out

- 🎯 **Real resume scanning** with section detection, role/level recommendation, coverage stats, and missing-signal analysis.
- 🧠 **Live 1:1 interview flow** that remembers candidate facts and adapts the next question in real time.
- 🤖 **Agentic evaluation & coaching**: interviewer, evaluator, coach, and orchestrator agents cooperate to score answers, detect gaps, and plan improvements.
- 🛰️ **Evidence-backed interviewer/company intelligence** (with verification confidence and source links).
- 📊 **No-fake feedback model**: weaknesses and improvement plans are generated only from observable answer scores and session evidence.
- 🔮 **Gemini-enhanced feedback**: per-answer coaching plus an optional final narrative summary of the whole interview.
- ✨ **Animated premium UI experience**: ambient gradients, micro-interactions, and smooth motion across the entire dashboard.

## Animated Product Experience

The web app is designed to feel modern and interactive, with motion used to communicate state and focus:

- **Landing hero motion** – Framer Motion–driven hero, headline, and CTA entrance animations.
- **3D dashboard preview** – layered, animated dashboard mock giving a sense of depth.
- **Interview Studio flow** – animated progress bar, question/answer transitions, and live conversation stream.
- **Agent timeline** – subtle timeline motion as new multi-agent decisions arrive.
- **Resume Lab transitions** – smooth card, stat, and builder-field animations when intelligence and ATS scores update.
- **Micro-interactions** – hover states, pressed states, and glass-morphism panels that respond to user input.

> Tip: for a more visual README on GitHub, you can capture short screen recordings of the Interview Studio, Resume Lab, and Analytics Hub and embed them as GIFs or MP4 links here.

## Feature Overview

### Interview Studio (Live Agentic Interview)

- Start interviews targeted by **role** (`frontend`, `backend`, `fullstack`, `data`, `devops`) and **level** (`junior`, `mid`, `senior`).
- Uses a **phase-based flow**: `intro`, `resume`, `technical`, `system`, `behavioral`, `follow-up`.
- Maintains **session memory** of known resume facts and conversation history.
- Evaluator agent scores each answer on:
   - Technical Accuracy
   - Communication
   - Problem Solving
   - Impact Orientation
- Gemini-backed coaching can refine feedback per answer and provide a final coaching narrative.

### Resume Intelligence Lab

- Upload or paste a resume and parse:
   - Extracted text, highlights, and structured sections (experience, projects, skills, education, etc.).
   - Coverage metrics and missing signals.
   - Recommended role/level based on content.
- Add a job description and generate:
   - Resume score and ATS compatibility report.
   - Job match suggestions with reasons and missing skills.
   - Improvement tips, LinkedIn headline/about suggestions, and a cover-letter draft.
- ATS-friendly **resume blueprint** and **guided builder** (fresher vs experienced) help users create a ready-to-send resume even from scratch.

### Analytics Hub

- High-level metrics for all sessions (totals, active/completed/terminated, average score, role distribution).
- Session history table with filters by candidate, status, and role.
- "Latest Interview Debrief" card combining:
   - Aggregated rubric scores.
   - Evidence-backed strengths and gaps.
   - Optional Gemini `llmSummary` coaching narrative (when available).

### Agents, Scoring & LLM

- **Multi-agent engine**:
   - *Resume agent* – analyses resume and surfaces known facts and missing signals.
   - *Interviewer agent* – selects the next best question based on phase, difficulty, and coverage.
   - *Evaluator agent* – scores answers with detailed score breakdowns and topic coverage.
   - *Coach agent* – aggregates evidence-backed observations and builds an improvement plan.
   - *Orchestrator agent* – coordinates phases, session completion, and summary decisions.
- **Gemini integration** (server-side):
   - Per-answer coaching text enriching heuristic scores.
   - Optional final narrative `llmSummary` summarizing strengths, growth areas, and a short practice plan.

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

   - `GET http://localhost:5001/api/health`

## Core Workflow

1. Candidate uploads/pastes resume
2. API scans and extracts resume intelligence
3. Candidate starts a role/level/company-targeted interview
4. AI asks adaptive questions based on answers and known resume facts
5. Session produces evidence-based strengths, lacking areas, and improvement plan

## API Reference

Base URL: `http://localhost:5001/api`

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
