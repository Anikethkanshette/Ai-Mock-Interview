export type InterviewRole = 'frontend' | 'backend' | 'fullstack' | 'data' | 'devops';

export interface InterviewSession {
  id: string;
  role: InterviewRole;
  level: 'junior' | 'mid' | 'senior';
  startedAt: string;
  endedAt?: string;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  prompt: string;
  expectedTopics: string[];
}
