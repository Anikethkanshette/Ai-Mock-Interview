import type {
  InterviewResult,
  InterviewSession,
  InterviewTurn,
  ScoreBreakdown,
  InterviewQuestion
} from '../types/interview.types.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type GeminiContentPart = { text?: string };

type GeminiContent = {
  role?: string;
  parts?: GeminiContentPart[];
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: GeminiContent;
  }>;
};

async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      return null;
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return text && text.length > 0 ? text : null;
  } catch (error) {
    console.error('Gemini API request failed:', error);
    return null;
  }
}

export async function generateGeminiFeedbackForAnswer(input: {
  question: InterviewQuestion;
  answer: string;
  scoreBreakdown: ScoreBreakdown;
  missingTopics: string[];
}): Promise<string | null> {
  const { question, answer, scoreBreakdown, missingTopics } = input;

  const missingTopicsText =
    missingTopics.length > 0 ? missingTopics.slice(0, 6).join(', ') : 'none explicitly detected from heuristics';

  const prompt = [
    'You are an experienced technical interviewer and career coach.',
    'Given the question, the candidate answer, and a heuristic rubric score breakdown,',
    'write a concise, actionable feedback paragraph (6-10 sentences) that:',
    '- Acknowledges what the candidate did well.',
    '- Explains gaps in technical accuracy, communication, problem-solving, and impact orientation.',
    '- Suggests exactly how to improve future answers.',
    '- Uses friendly, direct language (second person: "you").',
    '',
    'Do not restate the rubric numbers. Focus on coaching.',
    '',
    `Question category: ${question.category}`,
    `Question prompt: ${question.prompt}`,
    `Difficulty: ${question.difficulty}`,
    `Phase: ${question.phase}`,
    '',
    'Heuristic rubric (1-10):',
    `- Technical accuracy: ${scoreBreakdown.technicalAccuracy}`,
    `- Communication: ${scoreBreakdown.communication}`,
    `- Problem solving: ${scoreBreakdown.problemSolving}`,
    `- Impact orientation: ${scoreBreakdown.impactOrientation}`,
    `- Overall: ${scoreBreakdown.overall}`,
    '',
    `Missing topics from heuristics: ${missingTopicsText}`,
    '',
    'Candidate answer:',
    answer.trim()
  ].join('\n');

  return callGemini(prompt);
}

export async function generateGeminiSummaryForSession(input: {
  session: InterviewSession;
  result: InterviewResult;
}): Promise<string | null> {
  const { session, result } = input;

  const answeredTurns: InterviewTurn[] = session.turns.filter((turn) => Boolean(turn.answer && turn.scoreBreakdown));

  const recentSnippets = answeredTurns.slice(-4).map((turn, index) => {
    const label = `Answer ${answeredTurns.length - answeredTurns.length + index + 1}`;
    return [
      `${label} — question category: ${turn.question.category}, phase: ${turn.question.phase}, difficulty: ${turn.question.difficulty}`,
      `Prompt: ${turn.question.prompt}`,
      `Score breakdown: tech=${turn.scoreBreakdown?.technicalAccuracy}, comm=${turn.scoreBreakdown?.communication}, problem-solving=${turn.scoreBreakdown?.problemSolving}, impact=${turn.scoreBreakdown?.impactOrientation}, overall=${turn.scoreBreakdown?.overall}`,
      `Candidate answer: ${turn.answer}`
    ].join('\n');
  });

  const strengthsText = result.strengths.length > 0 ? result.strengths.join('; ') : 'none explicitly summarized yet';
  const improvementsText =
    result.improvements.length > 0 ? result.improvements.join('; ') : 'none explicitly summarized yet';

  const observedLackingText =
    result.observedLacking.length > 0
      ? result.observedLacking
          .slice(0, 6)
          .map((item) => `- ${item.area}: ${item.evidence} | Recommendation: ${item.recommendation}`)
          .join('\n')
      : 'No major gaps detected by heuristics.';

  const prompt = [
    'You are an expert interview coach. Based on the structured rubric summary and a few sample answers,',
    'write a short narrative coaching summary for the entire interview session (8-14 sentences).',
    '',
    'Goals for the summary:',
    '- Start with an overall read of performance.',
    '- Highlight 2-3 key strengths in specific, concrete language.',
    '- Highlight 2-4 growth areas with practical suggestions.',
    '- Mention how the candidate can improve for the next 2–3 weeks of practice.',
    '- Use friendly and direct language in second person ("you").',
    '- Do not restate raw scores; use natural language descriptions instead.',
    '',
    `Candidate: ${session.candidateName}`,
    `Role: ${session.role}, Level: ${session.level}`,
    session.targetCompany ? `Target company: ${session.targetCompany}` : '',
    '',
    'Aggregate heuristic result:',
    `- Average score (1-10): ${result.averageScore.toFixed(1)}`,
    `- Strength summaries: ${strengthsText}`,
    `- Improvement summaries: ${improvementsText}`,
    '',
    'Evidence-backed gaps from rubric:',
    observedLackingText,
    '',
    'Recent answer snippets (for flavor, not for quoting):',
    recentSnippets.join('\n\n')
  ]
    .filter(Boolean)
    .join('\n');

  return callGemini(prompt);
}
