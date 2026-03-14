import type {
  AgentDecision,
  EvidenceBackedObservation,
  InterviewAgentName,
  InterviewAgentState,
  InterviewQuestion,
  InterviewSession,
  ScoreBreakdown
} from '../types/interview.types.js';

export interface AgentEvaluation {
  score: number;
  feedback: string;
  scoreBreakdown: ScoreBreakdown;
  missingTopics: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createAgentState(): InterviewAgentState {
  return {
    decisions: [
      {
        agent: 'orchestrator-agent',
        summary: 'Multi-agent interview orchestration initialized.',
        confidence: 0.98,
        evidence: ['Resume agent', 'Interviewer agent', 'Evaluator agent', 'Coach agent'],
        timestamp: nowIso()
      }
    ],
    lastUpdated: nowIso()
  };
}

export function pushAgentDecision(
  session: InterviewSession,
  agent: InterviewAgentName,
  summary: string,
  confidence: number,
  evidence: string[]
): AgentDecision {
  const decision: AgentDecision = {
    agent,
    summary,
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
    evidence: evidence.slice(0, 6),
    timestamp: nowIso()
  };

  session.agentState.decisions.push(decision);
  session.agentState.lastUpdated = decision.timestamp;
  return decision;
}

export function evaluateAnswerWithEvaluatorAgent(question: InterviewQuestion, answer: string): AgentEvaluation {
  const cleanedAnswer = answer.toLowerCase();
  const wordCount = cleanedAnswer.split(/\s+/).filter(Boolean).length;

  const matchedTopics = question.expectedTopics.filter((topic) => cleanedAnswer.includes(topic.toLowerCase())).length;
  const coverageRatio = question.expectedTopics.length > 0 ? matchedTopics / question.expectedTopics.length : 0;

  const hasStructureCue = /because|therefore|trade-?off|result|impact|metric|so that/.test(cleanedAnswer);
  const mentionsProcess = /approach|step|pipeline|flow|debug|investigate|design/.test(cleanedAnswer);
  const mentionsImpact = /impact|result|metric|latency|throughput|cost|conversion|reliab|uptime|error rate/.test(
    cleanedAnswer
  );

  const baselineScore = wordCount >= 40 ? 4 : wordCount >= 20 ? 3 : 2;
  const depthBonus = wordCount > 140 ? 2 : wordCount > 80 ? 1 : 0;
  const structureBonus = hasStructureCue ? 1 : 0;
  const processBonus = mentionsProcess ? 1 : 0;
  const impactBonus = mentionsImpact ? 1 : 0;

  const rawScore =
    baselineScore +
    Math.round(coverageRatio * 4) +
    depthBonus +
    structureBonus +
    processBonus +
    impactBonus;

  const difficultyAdjustment = question.difficulty >= 4 ? -1 : question.difficulty <= 2 ? 1 : 0;
  const normalizedScore = Math.max(1, Math.min(10, rawScore + difficultyAdjustment));

  const technicalAccuracy = Math.max(1, Math.min(10, Math.round(coverageRatio * 8) + (question.difficulty >= 4 ? 1 : 0)));
  const communication = Math.max(
    1,
    Math.min(10, (wordCount > 80 ? 8 : wordCount > 40 ? 7 : 5) + (hasStructureCue ? 1 : 0))
  );
  const problemSolving = Math.max(1, Math.min(10, (mentionsProcess ? 8 : 5) + (question.difficulty >= 4 ? 1 : 0)));
  const impactOrientation = Math.max(1, Math.min(10, (mentionsImpact ? 8 : 5)));

  const scoreBreakdown: ScoreBreakdown = {
    technicalAccuracy,
    communication,
    problemSolving,
    impactOrientation,
    overall: normalizedScore
  };

  const missingTopics = question.expectedTopics.filter((topic) => !cleanedAnswer.includes(topic.toLowerCase()));

  const feedbackParts: string[] = [];

  if (normalizedScore >= 8) {
    feedbackParts.push('Strong answer with clear structure and good technical depth.');
  } else if (normalizedScore >= 5) {
    feedbackParts.push('Decent direction. Add more concrete implementation details and measurable outcomes.');
  } else {
    feedbackParts.push('Answer feels shallow. Include architecture decisions, trade-offs, and specific impact.');
  }

  if (technicalAccuracy < 7) {
    feedbackParts.push('Cover more of the core technical concepts the question expects.');
  }

  if (communication < 7) {
    feedbackParts.push('Use a clearer story: context → approach → decision → result.');
  }

  if (problemSolving < 7) {
    feedbackParts.push('Talk through alternatives, constraints, and why you chose this solution.');
  }

  if (impactOrientation < 7) {
    feedbackParts.push('Mention concrete impact using numbers when possible (latency, cost, reliability, etc.).');
  }

  if (missingTopics.length > 0) {
    feedbackParts.push(`You missed: ${missingTopics.slice(0, 4).join(', ')}.`);
  }

  const feedback = feedbackParts.join(' ');

  return {
    score: normalizedScore,
    feedback,
    scoreBreakdown,
    missingTopics
  };
}

export function summarizeCoachingFromEvidence(turns: InterviewSession['turns']): {
  observedLacking: EvidenceBackedObservation[];
  improvementPlan: EvidenceBackedObservation[];
} {
  const observations: EvidenceBackedObservation[] = [];

  for (const turn of turns) {
    if (!turn.answer || !turn.scoreBreakdown) {
      continue;
    }

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
  }

  if (observations.length === 0) {
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
  type AggregatedObservation = EvidenceBackedObservation & { count: number };

  const deduped = new Map<string, AggregatedObservation>();

  for (const observation of observations) {
    const existing = deduped.get(observation.area);

    if (!existing) {
      deduped.set(observation.area, { ...observation, count: 1 });
    } else {
      const priorityOrder: Record<EvidenceBackedObservation['priority'], number> = { high: 0, medium: 1, low: 2 };
      const nextPriority =
        priorityOrder[observation.priority] < priorityOrder[existing.priority]
          ? observation.priority
          : existing.priority;

      deduped.set(observation.area, {
        area: observation.area,
        evidence: existing.evidence,
        recommendation: observation.recommendation,
        priority: nextPriority,
        count: existing.count + 1
      });
    }
  }

  const observedLacking = Array.from(deduped.values())
    .map((item) => ({
      area: item.area,
      evidence:
        item.count > 1
          ? `${item.evidence} (pattern seen in ${item.count} answers)`
          : item.evidence,
      recommendation: item.recommendation,
      priority: item.priority
    }))
    .slice(0, 4);

  const improvementPlan = observedLacking
    .map((item) => ({
      ...item,
      recommendation: `Practice plan: ${item.recommendation}`
    }))
    .sort((left, right) => {
      const order: Record<EvidenceBackedObservation['priority'], number> = { high: 0, medium: 1, low: 2 };
      return order[left.priority] - order[right.priority];
    });

  return {
    observedLacking,
    improvementPlan
  };
}
