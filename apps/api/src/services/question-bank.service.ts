import type { InterviewLevel, InterviewQuestion, InterviewRole } from '../types/interview.types.js';

function baseRoleQuestions(role: InterviewRole): InterviewQuestion[] {
  const bank: Record<InterviewRole, InterviewQuestion[]> = {
    frontend: [
      {
        id: 'fe-1',
        category: 'Frontend Fundamentals',
        prompt: 'Explain how React re-rendering works and how you prevent unnecessary re-renders in a production app.',
        expectedTopics: ['react', 'memoization', 'state', 'performance'],
        phase: 'technical',
        difficulty: 3
      },
      {
        id: 'fe-2',
        category: 'Web Performance',
        prompt: 'You observe slow initial page load in your SPA. Walk me through your debugging and optimization approach.',
        expectedTopics: ['bundle', 'lazy loading', 'caching', 'metrics'],
        phase: 'technical',
        difficulty: 4
      },
      {
        id: 'fe-3',
        category: 'Testing',
        prompt: 'How do you structure frontend testing across unit, integration, and end-to-end layers?',
        expectedTopics: ['unit test', 'integration', 'e2e', 'confidence'],
        phase: 'technical',
        difficulty: 3
      }
    ],
    backend: [
      {
        id: 'be-1',
        category: 'API Design',
        prompt: 'Design a resilient API endpoint for high traffic reads and explain versioning and backward compatibility.',
        expectedTopics: ['rest api', 'versioning', 'latency', 'backward compatibility'],
        phase: 'technical',
        difficulty: 3
      },
      {
        id: 'be-2',
        category: 'Data Consistency',
        prompt: 'How do you handle transactional consistency and failure recovery in distributed backend systems?',
        expectedTopics: ['transactions', 'idempotency', 'retry', 'consistency'],
        phase: 'technical',
        difficulty: 4
      },
      {
        id: 'be-3',
        category: 'Scalability',
        prompt: 'Your service latency spikes at peak traffic. What investigation path and mitigations would you apply?',
        expectedTopics: ['profiling', 'caching', 'database', 'horizontal scaling'],
        phase: 'system',
        difficulty: 4
      }
    ],
    fullstack: [
      {
        id: 'fs-1',
        category: 'Architecture',
        prompt: 'Describe how you design a fullstack feature from UI interaction to database schema changes.',
        expectedTopics: ['ui', 'api', 'schema', 'trade-offs'],
        phase: 'technical',
        difficulty: 3
      },
      {
        id: 'fs-2',
        category: 'Reliability',
        prompt: 'How do you keep frontend and backend contracts stable while teams ship independently?',
        expectedTopics: ['contract', 'versioning', 'testing', 'communication'],
        phase: 'system',
        difficulty: 4
      },
      {
        id: 'fs-3',
        category: 'Debugging',
        prompt: 'Walk me through debugging a bug that appears only in production across frontend and backend layers.',
        expectedTopics: ['logs', 'observability', 'reproduction', 'rollback'],
        phase: 'technical',
        difficulty: 3
      }
    ],
    data: [
      {
        id: 'de-1',
        category: 'Data Modeling',
        prompt: 'How do you model data pipelines for analytics with changing business requirements?',
        expectedTopics: ['schema', 'lineage', 'evolution', 'quality'],
        phase: 'technical',
        difficulty: 3
      },
      {
        id: 'de-2',
        category: 'Scalability',
        prompt: 'What strategy do you use to optimize large ETL jobs that miss SLA consistently?',
        expectedTopics: ['partitioning', 'parallelism', 'cost', 'monitoring'],
        phase: 'system',
        difficulty: 4
      },
      {
        id: 'de-3',
        category: 'Data Reliability',
        prompt: 'How do you detect and recover from bad upstream data before it reaches downstream users?',
        expectedTopics: ['validation', 'alerts', 'quarantine', 'backfill'],
        phase: 'technical',
        difficulty: 4
      }
    ],
    devops: [
      {
        id: 'do-1',
        category: 'Infrastructure',
        prompt: 'How would you design deployment pipelines for frequent releases with minimal downtime?',
        expectedTopics: ['ci/cd', 'blue-green', 'canary', 'rollback'],
        phase: 'technical',
        difficulty: 3
      },
      {
        id: 'do-2',
        category: 'Reliability Engineering',
        prompt: 'What SLO/SLI strategy would you define for a critical customer-facing service?',
        expectedTopics: ['sli', 'slo', 'error budget', 'alerting'],
        phase: 'system',
        difficulty: 4
      },
      {
        id: 'do-3',
        category: 'Incident Response',
        prompt: 'Explain your process during a high-severity production incident from detection to postmortem.',
        expectedTopics: ['triage', 'communication', 'root cause', 'postmortem'],
        phase: 'behavioral',
        difficulty: 3
      }
    ]
  };

  return bank[role];
}

export function buildInterviewQuestionSet(input: {
  role: InterviewRole;
  level: InterviewLevel;
  candidateName: string;
  resumeHighlights: string[];
}): InterviewQuestion[] {
  const { role, level, candidateName, resumeHighlights } = input;

  const introQuestion: InterviewQuestion = {
    id: 'intro-1',
    category: 'Introduction',
    prompt: `Hi ${candidateName}, give me a concise overview of your recent experience and the impact you created.`,
    expectedTopics: ['impact', 'ownership', 'communication'],
    phase: 'intro',
    difficulty: 2
  };

  const resumeDeepDive: InterviewQuestion[] = resumeHighlights.slice(0, 2).map((highlight, index) => ({
    id: `resume-${index + 1}`,
    category: 'Resume Deep Dive',
    prompt: `You mentioned ${highlight} in your resume. Describe one real project where you used it and explain your specific contribution.`,
    expectedTopics: [highlight, 'project', 'trade-off', 'result'],
    phase: 'resume',
    difficulty: 3
  }));

  const seniorStretch: InterviewQuestion[] =
    level === 'senior'
      ? [
          {
            id: 'senior-1',
            category: 'Leadership',
            prompt: 'Tell me about a technical disagreement you resolved across teams and what decision framework you used.',
            expectedTopics: ['alignment', 'trade-off', 'leadership', 'decision'],
            phase: 'behavioral',
            difficulty: 4
          }
        ]
      : [];

  const behavioralQuestion: InterviewQuestion = {
    id: 'behavior-1',
    category: 'Behavioral',
    prompt: 'Describe a challenging production issue you handled, including communication and follow-up actions.',
    expectedTopics: ['incident', 'ownership', 'communication', 'learning'],
    phase: 'behavioral',
    difficulty: 3
  };

  const seniorSystemDesignQuestion: InterviewQuestion[] =
    level === 'senior'
      ? [
          {
            id: 'system-1',
            category: 'System Design',
            prompt:
              'Design an interview platform that supports 100k daily candidates with low latency feedback generation. Walk through architecture, scaling, and reliability trade-offs.',
            expectedTopics: ['scaling', 'queue', 'cache', 'trade-off'],
            phase: 'system',
            difficulty: 5
          }
        ]
      : [];

  return [
    introQuestion,
    ...resumeDeepDive,
    ...baseRoleQuestions(role),
    ...seniorSystemDesignQuestion,
    ...seniorStretch,
    behavioralQuestion
  ];
}
