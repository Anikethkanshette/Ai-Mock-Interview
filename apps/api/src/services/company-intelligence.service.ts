import { randomUUID } from 'node:crypto';
import { extractResumeHighlights } from './resume-parser.service.js';
import type {
  CompanyInterviewIntelligence,
  EvidenceSource,
  InterviewLevel,
  InterviewQuestion,
  InterviewRole,
  InterviewerResearchProfile,
  PredictQuestionsRequest,
  QuestionPrediction
} from '../types/interview.types.js';

const COMPANY_PATTERNS: Record<string, { signals: string[]; prompts: string[] }> = {
  google: {
    signals: ['structured problem solving', 'scalability reasoning', 'clarity under ambiguity'],
    prompts: [
      'Design a globally distributed service and explain consistency trade-offs.',
      'Given an ambiguous product requirement, how would you break it down technically?',
      'How do you optimize a critical path that serves billions of requests daily?'
    ]
  },
  amazon: {
    signals: ['ownership depth', 'leadership principles alignment', 'metrics-driven decisions'],
    prompts: [
      'Tell me about a time you disagreed with a technical direction and what you did next.',
      'How did you reduce operational cost while maintaining customer experience?',
      'Describe a high-severity incident and your ownership from detection to follow-up.'
    ]
  },
  microsoft: {
    signals: ['collaboration across teams', 'platform thinking', 'engineering quality'],
    prompts: [
      'How do you design APIs so multiple teams can evolve independently?',
      'Describe your strategy for balancing feature speed and reliability.',
      'How do you mentor engineers while maintaining delivery velocity?'
    ]
  },
  meta: {
    signals: ['execution speed', 'data-informed optimization', 'large-scale systems'],
    prompts: [
      'How would you improve engagement for a product with massive traffic?',
      'Describe a performance bottleneck you fixed and what metrics improved.',
      'How do you design experiments safely in production systems?'
    ]
  },
  netflix: {
    signals: ['resilience focus', 'distributed systems maturity', 'observability excellence'],
    prompts: [
      'How would you design failure-tolerant playback infrastructure?',
      'What is your observability stack for low-latency systems?',
      'How do you validate capacity before expected traffic spikes?'
    ]
  }
};

const SPECIALTY_KEYWORDS = [
  'system design',
  'distributed systems',
  'api',
  'backend',
  'frontend',
  'data engineering',
  'machine learning',
  'cloud',
  'aws',
  'kubernetes',
  'performance',
  'scalability',
  'security',
  'microservices',
  'architecture'
];

function normalizeCompanyKey(company?: string): string {
  return (company || '').trim().toLowerCase();
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWikipedia(name: string): Promise<EvidenceSource[]> {
  const encoded = encodeURIComponent(name);
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&utf8=&format=json`;
  const json = await fetchJsonWithTimeout<{
    query?: { search?: Array<{ title: string; snippet: string }> };
  }>(url, 5000);

  const items = json?.query?.search ?? [];

  return items.slice(0, 3).map((item) => ({
    title: item.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
    snippet: item.snippet.replace(/<[^>]+>/g, '')
  }));
}

async function searchDuckDuckGo(query: string): Promise<EvidenceSource[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_redirect=1&no_html=1`;
  const json = await fetchJsonWithTimeout<{
    AbstractText?: string;
    AbstractURL?: string;
    Heading?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string } | { Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
  }>(url, 5000);

  const sources: EvidenceSource[] = [];

  if (json?.AbstractText && json?.AbstractURL) {
    sources.push({
      title: json.Heading || query,
      url: json.AbstractURL,
      snippet: json.AbstractText
    });
  }

  for (const topic of json?.RelatedTopics ?? []) {
    if ('Text' in topic && topic.Text && topic.FirstURL) {
      sources.push({ title: query, url: topic.FirstURL, snippet: topic.Text });
      continue;
    }

    if ('Topics' in topic) {
      for (const nested of topic.Topics ?? []) {
        if (nested.Text && nested.FirstURL) {
          sources.push({ title: query, url: nested.FirstURL, snippet: nested.Text });
        }
      }
    }
  }

  return sources.slice(0, 4);
}

function detectSpecialties(evidence: EvidenceSource[]): string[] {
  const combinedText = evidence
    .map((item) => `${item.title} ${item.snippet || ''}`.toLowerCase())
    .join(' ');

  return SPECIALTY_KEYWORDS.filter((keyword) => combinedText.includes(keyword));
}

async function researchInterviewer(interviewerName?: string, targetCompany?: string): Promise<InterviewerResearchProfile | undefined> {
  if (!interviewerName || interviewerName.trim().length < 3) {
    return undefined;
  }

  const baseQuery = `${interviewerName} ${targetCompany || ''} software engineer interviewer`;
  const [wiki, ddg] = await Promise.all([searchWikipedia(interviewerName), searchDuckDuckGo(baseQuery)]);

  const evidence = [...wiki, ...ddg].filter((item) => Boolean(item.url));
  const specialties = detectSpecialties(evidence);
  const verified = evidence.length >= 2;
  const confidence = Math.min(0.92, Number((0.35 + evidence.length * 0.12 + specialties.length * 0.06).toFixed(2)));

  const note = verified
    ? 'Interviewer research has multi-source evidence. Predictions are grounded but still probabilistic.'
    : 'Insufficient evidence to verify interviewer profile strongly. Falling back to role/company trends.';

  return {
    interviewerName,
    verified,
    confidence,
    specialties: specialties.slice(0, 5),
    evidence: evidence.slice(0, 6),
    note
  };
}

function roleTrendPrompt(role: InterviewRole, level: InterviewLevel, highlight?: string): InterviewQuestion {
  const rolePrompts: Record<InterviewRole, string> = {
    frontend: 'How do you architect frontend systems for performance, accessibility, and maintainability?',
    backend: 'Design a backend service for high throughput and explain reliability trade-offs.',
    fullstack: 'Walk through building a feature from UI to persistence including API contract decisions.',
    data: 'How do you design robust data pipelines with quality checks and SLA guarantees?',
    devops: 'How do you build deployment pipelines with fast recovery and strong reliability controls?'
  };

  const levelSuffix =
    level === 'senior'
      ? 'Include leadership-level trade-offs and organizational impact.'
      : level === 'mid'
        ? 'Focus on implementation choices and measurable outcomes.'
        : 'Focus on fundamentals and practical delivery steps.';

  const highlightSuffix = highlight ? ` Also connect your answer to ${highlight}.` : '';

  return {
    id: `trend-${randomUUID()}`,
    category: 'Role Trend Prediction',
    prompt: `${rolePrompts[role]} ${levelSuffix}${highlightSuffix}`,
    expectedTopics: ['trade-off', 'impact', 'decision'],
    phase: 'technical',
    difficulty: level === 'senior' ? 5 : level === 'mid' ? 4 : 3
  };
}

function toPrediction(input: {
  prompt: string;
  source: QuestionPrediction['source'];
  confidence: number;
  rationale: string;
  role: InterviewRole;
  level: InterviewLevel;
}): QuestionPrediction {
  const { prompt, source, confidence, rationale, role, level } = input;

  const question: InterviewQuestion = {
    id: `pred-${randomUUID()}`,
    category: 'Predicted Question',
    prompt,
    expectedTopics: ['trade-off', 'metrics', role],
    phase: source === 'interviewer-pattern' ? 'behavioral' : 'system',
    difficulty: level === 'senior' ? 5 : level === 'mid' ? 4 : 3
  };

  return {
    source,
    confidence,
    rationale,
    question
  };
}

export async function buildCompanyInterviewIntelligence(input: PredictQuestionsRequest): Promise<CompanyInterviewIntelligence> {
  const companyKey = normalizeCompanyKey(input.targetCompany);
  const companyPattern = COMPANY_PATTERNS[companyKey];
  const highlights = extractResumeHighlights(input.resumeText || '');
  const interviewerResearch = await researchInterviewer(input.interviewerName, input.targetCompany);

  const companySignals = companyPattern?.signals ?? ['role depth', 'system thinking', 'measurable impact'];
  const interviewerSignals = interviewerResearch?.verified
    ? [
        `${interviewerResearch.interviewerName} appears to focus on ${interviewerResearch.specialties.slice(0, 2).join(' and ') || 'technical depth'}`,
        'Expect deeper probing on prior project decisions'
      ]
    : ['No strongly verified interviewer profile found; using company and role trend signals'];

  const predictions: QuestionPrediction[] = [];

  for (const prompt of (companyPattern?.prompts ?? []).slice(0, 2)) {
    predictions.push(
      toPrediction({
        prompt,
        source: 'company-pattern',
        confidence: 0.82,
        rationale: `Common themes reported for ${input.targetCompany || 'similar companies'}`,
        role: input.role,
        level: input.level
      })
    );
  }

  if (interviewerResearch?.verified && interviewerResearch.specialties.length > 0) {
    const specialty = interviewerResearch.specialties[0];
    predictions.push(
      toPrediction({
        prompt: `${input.interviewerName} is likely to probe ${specialty}. Explain one project where your ${specialty} decisions changed outcomes.`,
        source: 'interviewer-pattern',
        confidence: Math.max(0.65, interviewerResearch.confidence),
        rationale: 'Derived from web-backed interviewer specialty signals',
        role: input.role,
        level: input.level
      })
    );
  }

  predictions.push({
    source: 'role-trend',
    confidence: 0.7,
    rationale: 'Role and market trend based prediction',
    question: roleTrendPrompt(input.role, input.level, highlights[0])
  });

  return {
    targetCompany: input.targetCompany,
    interviewerName: input.interviewerName,
    companySignals,
    interviewerSignals,
    interviewerResearch,
    evidence: interviewerResearch?.evidence ?? [],
    predictedQuestions: predictions.slice(0, 4)
  };
}
