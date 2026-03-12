import { randomUUID } from 'node:crypto';
import { buildInterviewQuestionSet } from './question-bank.service.js';
import { extractFactsFromText, scanResumeContent } from './resume-scanner.service.js';
import { buildCompanyInterviewIntelligence } from './company-intelligence.service.js';
import type {
  ConversationMessage,
  EvidenceBackedObservation,
  InterviewResult,
  InterviewQuestion,
  InterviewSession,
  ScoreBreakdown,
  SessionSummary,
  InterviewTurn,
  StartInterviewRequest
} from '../types/interview.types.js';

const sessions = new Map<string, InterviewSession>();

function shuffle<T>(values: T[]): T[] {
  const cloned = [...values];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }

  return cloned;
}

function createMessage(speaker: 'interviewer' | 'candidate', text: string): ConversationMessage {
  return {
    id: randomUUID(),
    speaker,
    text,
    timestamp: new Date().toISOString()
  };
}

function evaluateAnswer(question: InterviewQuestion, answer: string): {
  score: number;
  feedback: string;
  scoreBreakdown: ScoreBreakdown;
  missingTopics: string[];
} {
  const cleanedAnswer = answer.toLowerCase();
  const wordCount = cleanedAnswer.split(/\s+/).filter(Boolean).length;

  const matchedTopics = question.expectedTopics.filter((topic) => cleanedAnswer.includes(topic.toLowerCase())).length;
  const coverageRatio = question.expectedTopics.length > 0 ? matchedTopics / question.expectedTopics.length : 0;

  const baselineScore = wordCount >= 25 ? 4 : wordCount >= 12 ? 3 : 2;
  const depthBonus = wordCount > 110 ? 2 : wordCount > 60 ? 1 : 0;
  const structureBonus = /because|therefore|trade-?off|result|impact|metric/.test(cleanedAnswer) ? 1 : 0;
  const baseScore = baselineScore + Math.round(coverageRatio * 4) + depthBonus + structureBonus;
  const normalizedScore = Math.max(1, Math.min(10, baseScore));

  const technicalAccuracy = Math.max(1, Math.min(10, Math.round(coverageRatio * 8) + 2));
  const communication = Math.max(1, Math.min(10, (wordCount > 60 ? 8 : wordCount > 30 ? 7 : 5) + structureBonus));
  const problemSolving = Math.max(
    1,
    Math.min(10, /approach|step|debug|investigate|solution|optimi[sz]e/.test(cleanedAnswer) ? 8 : 5)
  );
  const impactOrientation = Math.max(
    1,
    Math.min(10, /impact|result|metric|latency|throughput|cost|conversion/.test(cleanedAnswer) ? 8 : 5)
  );

  const scoreBreakdown: ScoreBreakdown = {
    technicalAccuracy,
    communication,
    problemSolving,
    impactOrientation,
    overall: normalizedScore
  };

  const missingTopics = question.expectedTopics.filter((topic) => !cleanedAnswer.includes(topic.toLowerCase()));

  if (normalizedScore >= 8) {
    return {
      score: normalizedScore,
      feedback: 'Strong answer with clear structure and good technical depth.',
      scoreBreakdown,
      missingTopics
    };
  }

  if (normalizedScore >= 5) {
    return {
      score: normalizedScore,
      feedback: 'Decent direction. Add more concrete implementation details and measurable outcomes.',
      scoreBreakdown,
      missingTopics
    };
  }

  return {
    score: normalizedScore,
    feedback: 'Answer feels shallow. Include architecture decisions, trade-offs, and specific impact.',
    scoreBreakdown,
    missingTopics
  };
}

function buildTurnObservations(turn: InterviewSession['turns'][number]): EvidenceBackedObservation[] {
  if (!turn.answer || !turn.scoreBreakdown) {
    return [];
  }

  const observations: EvidenceBackedObservation[] = [];

  if (turn.scoreBreakdown.technicalAccuracy < 7) {
    observations.push({
      area: 'Technical accuracy',
      evidence: `Score ${turn.scoreBreakdown.technicalAccuracy}/10 on "${turn.question.category}" question.`,
      recommendation: 'Explain architecture choices with concrete implementation details and APIs used.',
      priority: turn.scoreBreakdown.technicalAccuracy <= 5 ? 'high' : 'medium'
    });
  }

  if (turn.scoreBreakdown.communication < 7) {
    observations.push({
      area: 'Communication clarity',
      evidence: `Score ${turn.scoreBreakdown.communication}/10 with limited structured narrative in answer.`,
      recommendation: 'Use a clear flow: context, action, decision, result.',
      priority: 'medium'
    });
  }

  if (turn.scoreBreakdown.impactOrientation < 7) {
    observations.push({
      area: 'Impact orientation',
      evidence: `Score ${turn.scoreBreakdown.impactOrientation}/10 and weak quantified impact language.`,
      recommendation: 'Add measurable outcomes such as latency, cost, conversion, reliability, or throughput gains.',
      priority: 'high'
    });
  }

  if (turn.scoreBreakdown.problemSolving < 7) {
    observations.push({
      area: 'Problem-solving depth',
      evidence: `Score ${turn.scoreBreakdown.problemSolving}/10 with limited constraints/trade-off reasoning.`,
      recommendation: 'Describe constraints, alternatives considered, and why final approach was selected.',
      priority: 'medium'
    });
  }

  return observations;
}

function summarizeEvidenceObservations(session: InterviewSession): {
  observedLacking: EvidenceBackedObservation[];
  improvementPlan: EvidenceBackedObservation[];
} {
  const allObservations = session.turns.flatMap(buildTurnObservations);

  if (allObservations.length === 0) {
    return {
      observedLacking: [
        {
          area: 'Insufficient evidence',
          evidence: 'Not enough answered turns to evaluate gaps reliably.',
          recommendation: 'Complete more interview turns to unlock high-confidence coaching.',
          priority: 'low'
        }
      ],
      improvementPlan: []
    };
  }

  const deduped = new Map<string, EvidenceBackedObservation>();

  for (const observation of allObservations) {
    if (!deduped.has(observation.area)) {
      deduped.set(observation.area, observation);
    }
  }

  const observedLacking = Array.from(deduped.values()).slice(0, 4);
  const improvementPlan = observedLacking
    .map((observation) => ({
      ...observation,
      recommendation: `Practice plan: ${observation.recommendation}`
    }))
    .sort((left, right) => {
      const priorities: Record<EvidenceBackedObservation['priority'], number> = { high: 0, medium: 1, low: 2 };
      return priorities[left.priority] - priorities[right.priority];
    });

  return {
    observedLacking,
    improvementPlan
  };
}

function buildFollowUpQuestion(previousQuestion: InterviewQuestion, direction: 'improve' | 'deepen'): InterviewQuestion {
  if (direction === 'deepen') {
    return {
      id: `${previousQuestion.id}-advanced-followup`,
      category: `Advanced Follow-up: ${previousQuestion.category}`,
      prompt:
        'Strong answer. Now go one level deeper: what constraints did you optimize for, and what would you redesign if scale grew 10x?',
      expectedTopics: ['constraints', 'trade-off', 'scalability', 'redesign'],
      phase: 'follow-up',
      difficulty: 5
    };
  }

  return {
    id: `${previousQuestion.id}-followup`,
    category: `Follow-up: ${previousQuestion.category}`,
    prompt: `I want to go deeper: in your previous response, what trade-offs did you consider and what metrics proved your approach worked?`,
    expectedTopics: ['trade-off', 'metrics', 'impact'],
    phase: 'follow-up',
    difficulty: 3
  };
}

function buildFactBasedQuestion(session: InterviewSession): InterviewQuestion | undefined {
  const uncoveredFact = session.knownFacts.find((fact) => !session.coveredFacts.includes(fact));

  if (!uncoveredFact) {
    return undefined;
  }

  session.coveredFacts.push(uncoveredFact);

  return {
    id: `fact-${randomUUID()}`,
    category: 'Resume Fact Deep Dive',
    prompt: `You mentioned: "${uncoveredFact}". Walk me through your exact decision process, constraints, and measurable impact in this situation.`,
    expectedTopics: ['decision', 'constraints', 'impact', 'trade-off'],
    phase: 'resume',
    difficulty: 4
  };
}

function pickNextQuestion(session: InterviewSession): InterviewQuestion | undefined {
  if (session.turns.filter((turn) => Boolean(turn.answer)).length >= session.maxTurns) {
    return undefined;
  }

  const candidateQuestions = session.questionPool.filter((question) => !session.askedQuestionIds.includes(question.id));

  if (candidateQuestions.length === 0) {
    return undefined;
  }

  const memoryQuestion = Math.random() > 0.45 ? buildFactBasedQuestion(session) : undefined;

  if (memoryQuestion) {
    return memoryQuestion;
  }

  const weighted = shuffle(candidateQuestions).sort((left, right) => right.difficulty - left.difficulty);
  const chosen = weighted[Math.floor(Math.random() * Math.min(weighted.length, 3))] || weighted[0];

  if (!chosen) {
    return undefined;
  }

  session.askedQuestionIds.push(chosen.id);
  return chosen;
}

function calculateAverageScore(session: InterviewSession): number {
  const scoredTurns = session.turns.filter((turn) => typeof turn.score === 'number');
  const totalScore = scoredTurns.reduce((sum, turn) => sum + (turn.score || 0), 0);
  return scoredTurns.length > 0 ? Number((totalScore / scoredTurns.length).toFixed(2)) : 0;
}

function summarizeFeedback(session: InterviewSession): { strengths: string[]; improvements: string[] } {
  const scoredTurns = session.turns.filter((turn) => typeof turn.score === 'number' && turn.scoreBreakdown);

  if (scoredTurns.length === 0) {
    return {
      strengths: ['Interview started'],
      improvements: ['Provide more detailed answers to unlock richer feedback.']
    };
  }

  const aggregate = scoredTurns.reduce(
    (acc, turn) => {
      if (!turn.scoreBreakdown) {
        return acc;
      }

      acc.technicalAccuracy += turn.scoreBreakdown.technicalAccuracy;
      acc.communication += turn.scoreBreakdown.communication;
      acc.problemSolving += turn.scoreBreakdown.problemSolving;
      acc.impactOrientation += turn.scoreBreakdown.impactOrientation;
      return acc;
    },
    {
      technicalAccuracy: 0,
      communication: 0,
      problemSolving: 0,
      impactOrientation: 0
    }
  );

  const count = scoredTurns.length;
  const metrics = [
    { name: 'technical accuracy', value: aggregate.technicalAccuracy / count },
    { name: 'communication clarity', value: aggregate.communication / count },
    { name: 'problem-solving approach', value: aggregate.problemSolving / count },
    { name: 'impact orientation', value: aggregate.impactOrientation / count }
  ];

  const strengths = metrics
    .filter((metric) => metric.value >= 7)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((metric) => `Strong ${metric.name}`);

  const improvements = metrics
    .filter((metric) => metric.value < 7)
    .sort((a, b) => a.value - b.value)
    .slice(0, 2)
    .map((metric) => `Improve ${metric.name} with clearer examples and measurable outcomes`);

  return {
    strengths: strengths.length > 0 ? strengths : ['Consistent participation and progression through interview rounds'],
    improvements: improvements.length > 0 ? improvements : ['Keep answers concise while preserving concrete technical depth']
  };
}

function toSessionSummary(session: InterviewSession): SessionSummary {
  const answeredQuestions = session.turns.filter((turn) => Boolean(turn.answer)).length;

  return {
    sessionId: session.sessionId,
    candidateName: session.candidateName,
    role: session.role,
    level: session.level,
    status: session.status,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    answeredQuestions,
    totalQuestions: session.turns.length,
    averageScore: calculateAverageScore(session)
  };
}

export async function startInterview(payload: StartInterviewRequest): Promise<{
  session: InterviewSession;
  currentQuestion: InterviewQuestion;
}> {
  const resumeAnalysis = scanResumeContent({ text: payload.resumeText });
  const resumeHighlights = resumeAnalysis.highlights;
  const resumeFacts = resumeAnalysis.facts;
  const questionSet = buildInterviewQuestionSet({
    role: payload.role,
    level: payload.level,
    candidateName: payload.candidateName,
    resumeHighlights
  });
  const intelligence = await buildCompanyInterviewIntelligence({
    targetCompany: payload.targetCompany,
    interviewerName: payload.interviewerName,
    role: payload.role,
    level: payload.level,
    resumeText: payload.resumeText
  });

  const predictedQuestions = intelligence.predictedQuestions.map((prediction) => prediction.question);
  const mergedQuestionSet = [...questionSet, ...predictedQuestions];
  const questionPool = shuffle(mergedQuestionSet);
  const firstQuestion = mergedQuestionSet.find((question) => question.phase === 'intro') ?? questionPool[0];

  if (!firstQuestion) {
    throw new Error('Unable to build interview question set');
  }

  const turns: InterviewTurn[] = [{ question: firstQuestion }];

  const session: InterviewSession = {
    sessionId: randomUUID(),
    candidateName: payload.candidateName,
    role: payload.role,
    level: payload.level,
    targetCompany: payload.targetCompany,
    interviewerName: payload.interviewerName,
    resumeText: payload.resumeText,
    resumeAnalysis,
    resumeHighlights,
    knownFacts: [...resumeHighlights, ...resumeFacts].slice(0, 16),
    coveredFacts: [],
    questionPool,
    askedQuestionIds: [firstQuestion.id],
    conversation: [createMessage('interviewer', firstQuestion.prompt)],
    intelligence,
    maxTurns: payload.level === 'senior' ? 10 : payload.level === 'mid' ? 8 : 6,
    turns,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  if (session.turns[0]) {
    session.turns[0].askedAt = new Date().toISOString();
  }

  sessions.set(session.sessionId, session);

  return {
    session,
    currentQuestion: firstQuestion
  };
}

export function submitAnswer(input: {
  sessionId: string;
  answer: string;
}): {
  score: number;
  feedback: string;
  scoreBreakdown: ScoreBreakdown;
  nextQuestion?: InterviewQuestion;
  completed: boolean;
  summary?: InterviewResult;
} {
  const session = sessions.get(input.sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'active') {
    throw new Error('Interview is not active');
  }

  const currentTurn = session.turns.find((turn) => !turn.answer);

  if (!currentTurn) {
    throw new Error('Interview already completed');
  }

  const evaluation = evaluateAnswer(currentTurn.question, input.answer);
  currentTurn.answer = input.answer;
  currentTurn.score = evaluation.score;
  currentTurn.feedback = evaluation.feedback;
  currentTurn.scoreBreakdown = evaluation.scoreBreakdown;
  currentTurn.answeredAt = new Date().toISOString();
  session.conversation.push(createMessage('candidate', input.answer));

  const extractedFacts = extractFactsFromText(input.answer);

  for (const fact of extractedFacts) {
    if (!session.knownFacts.includes(fact)) {
      session.knownFacts.push(fact);
    }
  }

  let nextQuestion: InterviewQuestion | undefined;

  if (evaluation.score <= 4 || evaluation.score >= 9) {
    const followUpQuestion = buildFollowUpQuestion(currentTurn.question, evaluation.score >= 9 ? 'deepen' : 'improve');
    nextQuestion = followUpQuestion;
  } else {
    nextQuestion = pickNextQuestion(session);
  }

  if (nextQuestion) {
    const turn: InterviewTurn = {
      question: nextQuestion,
      askedAt: new Date().toISOString()
    };
    session.turns.push(turn);
    session.conversation.push(createMessage('interviewer', nextQuestion.prompt));
  }

  const nextTurn = session.turns.find((turn) => !turn.answer);

  if (!nextTurn) {
    session.completedAt = new Date().toISOString();
    session.status = 'completed';

    const averageScore = calculateAverageScore(session);
    const feedbackSummary = summarizeFeedback(session);
    const evidenceSummary = summarizeEvidenceObservations(session);

    return {
      score: evaluation.score,
      feedback: evaluation.feedback,
      scoreBreakdown: evaluation.scoreBreakdown,
      completed: true,
      summary: {
        averageScore,
        totalQuestions: session.turns.length,
        answeredQuestions: session.turns.filter((turn) => Boolean(turn.answer)).length,
        completed: true,
        strengths: feedbackSummary.strengths,
        improvements: feedbackSummary.improvements,
        observedLacking: evidenceSummary.observedLacking,
        improvementPlan: evidenceSummary.improvementPlan
      }
    };
  }

  return {
    score: evaluation.score,
    feedback: evaluation.feedback,
    scoreBreakdown: evaluation.scoreBreakdown,
    nextQuestion: nextTurn.question,
    completed: false
  };
}

export function getSession(sessionId: string): InterviewSession | undefined {
  return sessions.get(sessionId);
}

export function getInterviewResult(sessionId: string): InterviewResult {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  const answeredTurns = session.turns.filter((turn) => Boolean(turn.answer));
  const averageScore = calculateAverageScore(session);
  const feedbackSummary = summarizeFeedback(session);
  const evidenceSummary = summarizeEvidenceObservations(session);

  return {
    averageScore,
    totalQuestions: session.turns.length,
    answeredQuestions: answeredTurns.length,
    completed: session.status !== 'active',
    strengths: feedbackSummary.strengths,
    improvements: feedbackSummary.improvements,
    observedLacking: evidenceSummary.observedLacking,
    improvementPlan: evidenceSummary.improvementPlan
  };
}

export function listSessions(filters?: { role?: string; status?: string; candidateName?: string }): SessionSummary[] {
  const summaries = Array.from(sessions.values()).map(toSessionSummary);

  return summaries
    .filter((item) => {
      if (filters?.role && item.role !== filters.role) {
        return false;
      }

      if (filters?.status && item.status !== filters.status) {
        return false;
      }

      if (filters?.candidateName) {
        return item.candidateName.toLowerCase().includes(filters.candidateName.toLowerCase());
      }

      return true;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function terminateInterview(sessionId: string): SessionSummary {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'active') {
    throw new Error('Interview is not active');
  }

  session.status = 'terminated';
  session.terminatedAt = new Date().toISOString();
  session.completedAt = session.terminatedAt;

  return toSessionSummary(session);
}

export function getInterviewAnalytics(): {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  terminatedSessions: number;
  averageScoreAcrossSessions: number;
  roleDistribution: Record<string, number>;
} {
  const allSessions = Array.from(sessions.values());
  const completedOrTerminated = allSessions.filter((session) => session.status !== 'active');

  const averageScoreAcrossSessions =
    completedOrTerminated.length > 0
      ? Number(
          (
            completedOrTerminated.reduce((sum, session) => sum + calculateAverageScore(session), 0) /
            completedOrTerminated.length
          ).toFixed(2)
        )
      : 0;

  const roleDistribution = allSessions.reduce<Record<string, number>>((accumulator, session) => {
    accumulator[session.role] = (accumulator[session.role] || 0) + 1;
    return accumulator;
  }, {});

  return {
    totalSessions: allSessions.length,
    activeSessions: allSessions.filter((session) => session.status === 'active').length,
    completedSessions: allSessions.filter((session) => session.status === 'completed').length,
    terminatedSessions: allSessions.filter((session) => session.status === 'terminated').length,
    averageScoreAcrossSessions,
    roleDistribution
  };
}
