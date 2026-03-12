import type { Request, Response } from 'express';
import {
  getInterviewAnalytics,
  getInterviewResult,
  getSession,
  listSessions,
  startInterview,
  submitAnswer,
  terminateInterview
} from '../services/interview-engine.service.js';
import { scanResumeContent } from '../services/resume-scanner.service.js';
import { buildCompanyInterviewIntelligence } from '../services/company-intelligence.service.js';
import type {
  InterviewLevel,
  PredictQuestionsRequest,
  InterviewRole,
  StartInterviewRequest
} from '../types/interview.types.js';
import pdfParse from 'pdf-parse';

const VALID_ROLES: InterviewRole[] = ['frontend', 'backend', 'fullstack', 'data', 'devops'];
const VALID_LEVELS: InterviewLevel[] = ['junior', 'mid', 'senior'];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function readSessionId(param: string | string[] | undefined): string | null {
  if (typeof param === 'string' && param.trim().length > 0) {
    return param;
  }

  return null;
}

function readQueryString(param: unknown): string | undefined {
  return typeof param === 'string' && param.trim().length > 0 ? param : undefined;
}

export async function startInterviewController(req: Request, res: Response) {
  const { candidateName, role, level, resumeText, targetCompany, interviewerName } = req.body as Partial<StartInterviewRequest>;

  if (!isNonEmptyString(candidateName) || !isNonEmptyString(resumeText)) {
    return res.status(400).json({ message: 'candidateName and resumeText are required' });
  }

  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  if (!level || !VALID_LEVELS.includes(level)) {
    return res.status(400).json({ message: `level must be one of: ${VALID_LEVELS.join(', ')}` });
  }

  const { session, currentQuestion } = await startInterview({
    candidateName,
    role,
    level,
    resumeText,
    targetCompany,
    interviewerName
  });

  return res.status(201).json({
    sessionId: session.sessionId,
    role: session.role,
    level: session.level,
    targetCompany: session.targetCompany,
    interviewerName: session.interviewerName,
    resumeAnalysis: session.resumeAnalysis,
    resumeHighlights: session.resumeHighlights,
    knownFacts: session.knownFacts,
    intelligence: session.intelligence,
    currentQuestion
  });
}

export async function predictQuestionsController(req: Request, res: Response) {
  const { targetCompany, interviewerName, role, level, resumeText } = req.body as Partial<PredictQuestionsRequest>;

  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  if (!level || !VALID_LEVELS.includes(level)) {
    return res.status(400).json({ message: `level must be one of: ${VALID_LEVELS.join(', ')}` });
  }

  const intelligence = await buildCompanyInterviewIntelligence({
    targetCompany,
    interviewerName,
    role,
    level,
    resumeText
  });

  return res.status(200).json(intelligence);
}

export async function scanResumeController(req: Request, res: Response) {
  const uploadedFile = req.file;
  const bodyResumeText = typeof req.body.resumeText === 'string' ? req.body.resumeText : '';

  let extractedText = bodyResumeText;

  if (uploadedFile) {
    if (uploadedFile.mimetype.includes('pdf')) {
      try {
        const parsed = await pdfParse(uploadedFile.buffer);
        extractedText = `${bodyResumeText}\n${parsed.text || ''}`.trim();
      } catch {
        return res.status(400).json({ message: 'Unable to parse PDF resume. Try a text-based resume.' });
      }
    } else {
      extractedText = `${bodyResumeText}\n${uploadedFile.buffer.toString('utf-8')}`.trim();
    }
  }

  if (!isNonEmptyString(extractedText)) {
    return res.status(400).json({ message: 'Resume text or file is required for scanning.' });
  }

  const scanResult = scanResumeContent({
    text: extractedText,
    fileName: uploadedFile?.originalname
  });

  return res.status(200).json(scanResult);
}

export function submitAnswerController(req: Request, res: Response) {
  const sessionId = readSessionId(req.params.sessionId);
  const { answer } = req.body as { answer?: string };

  if (!sessionId) {
    return res.status(400).json({ message: 'sessionId is required' });
  }

  if (!isNonEmptyString(answer)) {
    return res.status(400).json({ message: 'answer is required' });
  }

  try {
    const response = submitAnswer({
      sessionId,
      answer
    });

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit answer';
    const status = message === 'Session not found' ? 404 : 400;
    return res.status(status).json({ message });
  }
}

export function getSessionController(req: Request, res: Response) {
  const sessionId = readSessionId(req.params.sessionId);

  if (!sessionId) {
    return res.status(400).json({ message: 'sessionId is required' });
  }

  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  return res.status(200).json(session);
}

export function getResultController(req: Request, res: Response) {
  const sessionId = readSessionId(req.params.sessionId);

  if (!sessionId) {
    return res.status(400).json({ message: 'sessionId is required' });
  }

  try {
    const result = getInterviewResult(sessionId);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch result';
    return res.status(404).json({ message });
  }
}

export function listSessionsController(req: Request, res: Response) {
  const role = readQueryString(req.query.role);
  const status = readQueryString(req.query.status);
  const candidateName = readQueryString(req.query.candidateName);

  const sessions = listSessions({
    role,
    status,
    candidateName
  });

  return res.status(200).json({
    count: sessions.length,
    sessions
  });
}

export function terminateInterviewController(req: Request, res: Response) {
  const sessionId = readSessionId(req.params.sessionId);

  if (!sessionId) {
    return res.status(400).json({ message: 'sessionId is required' });
  }

  try {
    const session = terminateInterview(sessionId);
    return res.status(200).json({
      message: 'Interview terminated',
      session
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to terminate interview';
    const status = message === 'Session not found' ? 404 : 400;
    return res.status(status).json({ message });
  }
}

export function interviewAnalyticsController(_req: Request, res: Response) {
  const analytics = getInterviewAnalytics();
  return res.status(200).json(analytics);
}
