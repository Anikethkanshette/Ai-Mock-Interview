import type {
  AnalyticsOverview,
  CompanyInterviewIntelligence,
  InterviewLevel,
  InterviewResult,
  InterviewRole,
  InterviewSession,
  InterviewQuestion,
  ResumeScanResult,
  ScoreBreakdown,
  SessionSummary
} from '../types/interview';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api';

interface StartInterviewPayload {
  candidateName: string;
  role: InterviewRole;
  level: InterviewLevel;
  resumeText: string;
  targetCompany?: string;
  interviewerName?: string;
}

interface StartInterviewResponse {
  sessionId: string;
  role: InterviewRole;
  level: InterviewLevel;
  targetCompany?: string;
  interviewerName?: string;
  resumeAnalysis: ResumeScanResult;
  resumeHighlights: string[];
  knownFacts: string[];
  intelligence?: CompanyInterviewIntelligence;
  agentState?: import('../types/interview').InterviewAgentState;
  currentQuestion: InterviewQuestion;
}

interface SubmitAnswerResponse {
  score: number;
  feedback: string;
  scoreBreakdown: ScoreBreakdown;
  nextQuestion?: InterviewQuestion;
  completed: boolean;
  summary?: InterviewResult;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options?.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? 'Request failed');
  }

  return data as T;
}

export async function startInterview(payload: StartInterviewPayload) {
  return request<StartInterviewResponse>('/interviews/start', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function scanResume(file?: File, resumeText?: string) {
  const formData = new FormData();

  if (file) {
    formData.append('resume', file);
  }

  if (resumeText) {
    formData.append('resumeText', resumeText);
  }

  return request<ResumeScanResult>('/interviews/resume/scan', {
    method: 'POST',
    body: formData
  });
}

export async function predictCompanyQuestions(payload: {
  targetCompany?: string;
  interviewerName?: string;
  role: InterviewRole;
  level: InterviewLevel;
  resumeText?: string;
}) {
  return request<CompanyInterviewIntelligence>('/interviews/intelligence/predict', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function submitInterviewAnswer(sessionId: string, answer: string) {
  return request<SubmitAnswerResponse>(`/interviews/${sessionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer })
  });
}

export async function getInterviewSession(sessionId: string) {
  return request<InterviewSession>(`/interviews/${sessionId}`);
}

export async function getInterviewResult(sessionId: string) {
  return request<InterviewResult>(`/interviews/${sessionId}/result`);
}

export async function terminateInterview(sessionId: string) {
  return request<{ message: string; session: SessionSummary }>(`/interviews/${sessionId}/terminate`, {
    method: 'POST'
  });
}

export async function listSessions(params?: {
  role?: string;
  status?: string;
  candidateName?: string;
}) {
  const query = new URLSearchParams();

  if (params?.role) {
    query.set('role', params.role);
  }

  if (params?.status) {
    query.set('status', params.status);
  }

  if (params?.candidateName) {
    query.set('candidateName', params.candidateName);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<{ count: number; sessions: SessionSummary[] }>(`/interviews${suffix}`);
}

export async function getAnalyticsOverview() {
  return request<AnalyticsOverview>('/interviews/analytics/overview');
}
