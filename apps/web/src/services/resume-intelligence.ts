import type {
  ResumeIntelligenceReport,
  ResumeImprovementTip,
  JobMatchSuggestion,
  InterviewRole,
  ResumeScanResult,
  LinkedInOptimization,
  CoverLetterDraft
} from '../types/interview';

interface ResumeIntelligenceInput {
  resumeText: string;
  jobDescription: string;
  targetRole: InterviewRole;
  resumeScan?: ResumeScanResult | null;
  candidateName?: string;
  profile?: {
    headline?: string;
    targetRole?: string;
    yearsExperience?: number;
    primarySkills?: string[];
    bio?: string;
  };
}

const ROLE_KEYWORDS: Record<InterviewRole, string[]> = {
  frontend: ['react', 'typescript', 'javascript', 'ui', 'css', 'performance', 'accessibility'],
  backend: ['node', 'api', 'database', 'microservices', 'scalability', 'sql', 'caching'],
  fullstack: ['react', 'node', 'api', 'database', 'typescript', 'architecture', 'deployment'],
  data: ['python', 'sql', 'analytics', 'pipeline', 'etl', 'modeling', 'visualization'],
  devops: ['aws', 'kubernetes', 'docker', 'ci/cd', 'monitoring', 'terraform', 'automation']
};

const JOB_LIBRARY: Array<{ title: string; companyType: string; role: InterviewRole; skills: string[] }> = [
  {
    title: 'Backend Engineer (Platform)',
    companyType: 'Product Company',
    role: 'backend',
    skills: ['node', 'api', 'database', 'scalability', 'microservices', 'aws']
  },
  {
    title: 'Frontend Engineer (React)',
    companyType: 'SaaS Startup',
    role: 'frontend',
    skills: ['react', 'typescript', 'ui', 'performance', 'accessibility']
  },
  {
    title: 'Fullstack Engineer',
    companyType: 'Scale-up',
    role: 'fullstack',
    skills: ['react', 'node', 'api', 'database', 'typescript', 'deployment']
  },
  {
    title: 'Data Engineer',
    companyType: 'Data Platform',
    role: 'data',
    skills: ['python', 'sql', 'pipeline', 'etl', 'modeling']
  },
  {
    title: 'DevOps Engineer',
    companyType: 'Cloud Infra',
    role: 'devops',
    skills: ['aws', 'kubernetes', 'docker', 'ci/cd', 'monitoring', 'terraform']
  },
  {
    title: 'Backend Engineer (Fintech)',
    companyType: 'Fintech',
    role: 'backend',
    skills: ['node', 'sql', 'api', 'security', 'scalability', 'testing']
  },
  {
    title: 'SRE / Platform Engineer',
    companyType: 'Enterprise',
    role: 'devops',
    skills: ['kubernetes', 'monitoring', 'automation', 'incident', 'aws', 'linux']
  }
];

function normalize(text: string): string {
  return text.toLowerCase();
}

function extractKeywords(text: string): string[] {
  const tokens = normalize(text)
    .replace(/[^a-z0-9+.#\s/-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

  return Array.from(new Set(tokens));
}

function scoreKeywordAlignment(resumeText: string, jobDescription: string, role: InterviewRole): {
  score: number;
  matched: string[];
  missing: string[];
} {
  const resumeKeywords = new Set(extractKeywords(resumeText));
  const jdKeywords = extractKeywords(jobDescription);
  const roleKeywords = ROLE_KEYWORDS[role];
  const important = Array.from(new Set([...jdKeywords.filter((kw) => kw.length > 3), ...roleKeywords])).slice(0, 40);

  const matched = important.filter((keyword) => resumeKeywords.has(keyword));
  const missing = important.filter((keyword) => !resumeKeywords.has(keyword));

  const score = important.length === 0 ? 5 : Math.round((matched.length / important.length) * 10);

  return { score: Math.min(10, Math.max(1, score)), matched: matched.slice(0, 18), missing: missing.slice(0, 18) };
}

function readYears(resumeText: string, profileYears?: number): number {
  if (typeof profileYears === 'number' && profileYears >= 0) {
    return profileYears;
  }

  const match = normalize(resumeText).match(/(\d{1,2})\+?\s*(years|yrs)/);
  if (!match) {
    return 0;
  }

  return Number(match[1]);
}

function scoreExperienceMatch(resumeText: string, jobDescription: string, profileYears?: number): number {
  const resumeYears = readYears(resumeText, profileYears);
  const jdMatch = normalize(jobDescription).match(/(\d{1,2})\+?\s*(years|yrs)/);
  const jdYears = jdMatch ? Number(jdMatch[1]) : 0;

  if (jdYears === 0) {
    return resumeYears > 0 ? 8 : 6;
  }

  if (resumeYears >= jdYears) {
    return 10;
  }

  const ratio = resumeYears / jdYears;
  return Math.max(2, Math.round(ratio * 10));
}

function scoreImpactEvidence(resumeText: string, scan?: ResumeScanResult | null): number {
  const quantified = scan?.extractedProfile.quantifiedAchievements.length ?? 0;
  const metricsCount = (resumeText.match(/\b\d+%|\b\d+x|\b\d+ms|\b\d+\b/g) ?? []).length;

  const raw = quantified * 2 + Math.min(metricsCount, 8);
  return Math.min(10, Math.max(1, Math.round(raw / 2)));
}

function scoreStructure(scan?: ResumeScanResult | null): number {
  if (!scan) {
    return 5;
  }

  const sectionCount = Object.values(scan.sections).filter((lines) => lines.length > 0).length;
  const coverageScore = Math.round(scan.coverage.coveragePercent / 10);
  return Math.min(10, Math.max(2, Math.round((sectionCount + coverageScore) / 2)));
}

function buildAtsReport(resumeText: string, keywordMissing: string[], scan?: ResumeScanResult | null) {
  const issues: Array<{ severity: 'high' | 'medium' | 'low'; message: string; suggestion: string }> = [];

  if ((scan?.coverage.coveragePercent ?? 0) < 65) {
    issues.push({
      severity: 'high',
      message: 'Resume coverage is low for structured parsing.',
      suggestion: 'Add explicit section headers: Summary, Experience, Projects, Skills, Education.'
    });
  }

  if ((scan?.sections.experience.length ?? 0) < 2) {
    issues.push({
      severity: 'high',
      message: 'Experience section has limited detail.',
      suggestion: 'Add 3-5 bullet points per role with measurable impact and ownership.'
    });
  }

  if ((scan?.extractedProfile.quantifiedAchievements.length ?? 0) < 2) {
    issues.push({
      severity: 'medium',
      message: 'Few quantified achievements detected.',
      suggestion: 'Include metrics like latency %, revenue, uptime, cost reduction, or delivery speed.'
    });
  }

  if (keywordMissing.length > 8) {
    issues.push({
      severity: 'medium',
      message: 'Keyword gap against target job description is high.',
      suggestion: 'Embed missing keywords naturally into project and experience bullets.'
    });
  }

  const suspiciousFormatting = /\t|\u2022|\|\s*\|/.test(resumeText) && resumeText.length > 1200;
  if (suspiciousFormatting) {
    issues.push({
      severity: 'low',
      message: 'Complex formatting may reduce ATS parsing quality.',
      suggestion: 'Prefer plain text bullets and standard headings over table-like layouts.'
    });
  }

  const severityPenalty = issues.reduce((penalty, issue) => {
    if (issue.severity === 'high') {
      return penalty + 18;
    }
    if (issue.severity === 'medium') {
      return penalty + 10;
    }
    return penalty + 5;
  }, 0);

  const passScore = Math.max(5, 100 - severityPenalty);

  return {
    passScore,
    issues,
    passLikely: passScore >= 65
  };
}

function buildJobMatches(resumeText: string, targetRole: InterviewRole, scan?: ResumeScanResult | null): JobMatchSuggestion[] {
  const keywords = new Set(extractKeywords(resumeText));
  const strongestSkills = new Set((scan?.extractedProfile.strongestSkills ?? []).map((skill) => skill.toLowerCase()));

  const ranked = JOB_LIBRARY.map((job) => {
    const roleBoost = job.role === targetRole ? 2 : 0;
    const matched = job.skills.filter((skill) => keywords.has(skill) || strongestSkills.has(skill));
    const missing = job.skills.filter((skill) => !matched.includes(skill));
    const matchScore = Math.min(100, Math.round((matched.length / job.skills.length) * 90 + roleBoost * 5));

    return {
      title: job.title,
      companyType: job.companyType,
      matchScore,
      reasons: [
        `${matched.length}/${job.skills.length} core skills aligned`,
        job.role === targetRole ? `Aligned with selected ${targetRole} track` : `Cross-track potential from ${job.role}`
      ],
      missingSkills: missing.slice(0, 4)
    };
  });

  return ranked.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

function buildImprovementTips(params: {
  missingKeywords: string[];
  atsIssues: Array<{ severity: 'high' | 'medium' | 'low'; message: string; suggestion: string }>;
  scan?: ResumeScanResult | null;
}): ResumeImprovementTip[] {
  const tips: ResumeImprovementTip[] = [];

  if (params.missingKeywords.length > 0) {
    tips.push({
      title: 'Close Keyword Gap',
      action: `Add these high-priority terms where relevant: ${params.missingKeywords.slice(0, 6).join(', ')}.`,
      priority: 'high'
    });
  }

  params.atsIssues.slice(0, 3).forEach((issue) => {
    tips.push({
      title: issue.message,
      action: issue.suggestion,
      priority: issue.severity
    });
  });

  if ((params.scan?.extractedProfile.quantifiedAchievements.length ?? 0) < 3) {
    tips.push({
      title: 'Increase Quantified Proof',
      action: 'Rewrite at least three bullets with before/after metrics, scale, and business impact.',
      priority: 'medium'
    });
  }

  if ((params.scan?.sections.projects.length ?? 0) < 2) {
    tips.push({
      title: 'Strengthen Project Section',
      action: 'Add project bullets with tech stack, architecture decisions, and measurable outcomes.',
      priority: 'medium'
    });
  }

  return tips.slice(0, 8);
}

function buildLinkedInOptimization(input: ResumeIntelligenceInput): LinkedInOptimization {
  const strongestSkills = input.resumeScan?.extractedProfile.strongestSkills ?? [];
  const role = input.targetRole;
  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

  const headline = `${roleTitle} Engineer | ${strongestSkills.slice(0, 3).join(' · ') || 'Scalable Systems'} | agentic intervier Candidate`;

  const about = [
    `I build ${role} solutions with a focus on measurable impact, clean architecture, and delivery reliability.`,
    `My recent work highlights ${input.resumeScan?.extractedProfile.quantifiedAchievements.slice(0, 2).join('; ') || 'strong performance and ownership outcomes'}.`,
    `I am actively preparing for high-bar interviews through agentic intervier's evidence-based coaching loop.`
  ].join(' ');

  const featuredBullets = [
    'Add 3 featured projects with architecture + metric outcomes.',
    'Pin a post describing a technical trade-off decision and impact.',
    'Align skills section with target job keywords and endorsements.'
  ];

  return { headline, about, featuredBullets };
}

function buildCoverLetter(input: ResumeIntelligenceInput): CoverLetterDraft {
  const name = input.candidateName || 'Hiring Manager';
  const roleLabel = input.targetRole.charAt(0).toUpperCase() + input.targetRole.slice(1);
  const strengths = input.resumeScan?.extractedProfile.strongestSkills.slice(0, 3).join(', ') || 'modern engineering practices';
  const impact = input.resumeScan?.extractedProfile.quantifiedAchievements.slice(0, 2).join(' and ') || 'delivery, quality, and measurable outcomes';

  return {
    greeting: `Dear ${name},`,
    opening: `I am excited to apply for a ${roleLabel} Engineer opportunity. My background aligns strongly with your requirements, especially in ${strengths}.`,
    body: [
      `Across recent roles, I have delivered outcomes such as ${impact}. I focus on building reliable systems and communicating trade-offs clearly with cross-functional teams.`,
      `I am confident I can contribute quickly by combining technical depth, ownership, and data-backed decision making. I would value the chance to discuss how my experience maps to your team's goals.`
    ],
    closing: 'Thank you for your time and consideration. I look forward to connecting with you.'
  };
}

export function buildResumeIntelligenceReport(input: ResumeIntelligenceInput): ResumeIntelligenceReport {
  const keywordResult = scoreKeywordAlignment(input.resumeText, input.jobDescription, input.targetRole);
  const experienceScore = scoreExperienceMatch(input.resumeText, input.jobDescription, input.profile?.yearsExperience);
  const impactScore = scoreImpactEvidence(input.resumeText, input.resumeScan);
  const structureScore = scoreStructure(input.resumeScan);

  const score = Math.round(
    keywordResult.score * 0.35 +
      experienceScore * 0.25 +
      impactScore * 0.2 +
      structureScore * 0.2
  );

  const atsReport = buildAtsReport(input.resumeText, keywordResult.missing, input.resumeScan);
  const jobMatches = buildJobMatches(input.resumeText, input.targetRole, input.resumeScan);
  const improvementTips = buildImprovementTips({
    missingKeywords: keywordResult.missing,
    atsIssues: atsReport.issues,
    scan: input.resumeScan
  });

  const linkedinOptimization = buildLinkedInOptimization(input);
  const coverLetterDraft = buildCoverLetter(input);

  return {
    scoreReport: {
      score,
      breakdown: {
        keywordAlignment: keywordResult.score,
        experienceMatch: experienceScore,
        impactEvidence: impactScore,
        structureQuality: structureScore
      },
      matchedKeywords: keywordResult.matched,
      missingKeywords: keywordResult.missing
    },
    atsReport,
    jobMatches,
    improvementTips,
    linkedinOptimization,
    coverLetterDraft,
    advancedInsights: {
      strongestNarrative:
        input.resumeScan?.extractedProfile.quantifiedAchievements[0] ||
        'Strong ownership and execution across engineering tasks.',
      quantifiedImpactSignals: input.resumeScan?.extractedProfile.quantifiedAchievements.slice(0, 5) || [],
      roleReadinessSummary:
        score >= 8
          ? 'High readiness for target roles. Focus on interview storytelling and role-specific depth.'
          : score >= 6
            ? 'Moderate readiness. Improve keyword alignment and project impact articulation.'
            : 'Foundational readiness. Prioritize resume structure and measurable outcomes before applying broadly.',
      priorityActions: improvementTips.slice(0, 4).map((tip) => `${tip.title}: ${tip.action}`)
    }
  };
}
