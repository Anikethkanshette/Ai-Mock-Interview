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

  const deduped = new Map<string, EvidenceBackedObservation>();

  for (const observation of observations) {
    if (!deduped.has(observation.area)) {
      deduped.set(observation.area, observation);
    }
  }

  const observedLacking = Array.from(deduped.values()).slice(0, 4);
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
