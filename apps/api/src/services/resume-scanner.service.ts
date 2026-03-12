import { extractResumeHighlights } from './resume-parser.service.js';
import type {
  InterviewLevel,
  InterviewRole,
  ResumeExtractedProfile,
  ResumeScanResult,
  ResumeSectionCoverage
} from '../types/interview.types.js';

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function cleanLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function detectSection(line: string): keyof ResumeSectionCoverage | undefined {
  const normalized = line.toLowerCase();

  if (/^(summary|profile|professional summary)\b/.test(normalized)) return 'summary';
  if (/^(experience|work experience|professional experience|employment)\b/.test(normalized)) return 'experience';
  if (/^(projects|project experience)\b/.test(normalized)) return 'projects';
  if (/^(skills|technical skills|core skills|tech stack)\b/.test(normalized)) return 'skills';
  if (/^(education|academic)\b/.test(normalized)) return 'education';
  if (/^(certifications|certification|licenses)\b/.test(normalized)) return 'certifications';
  if (/^(achievements|awards|accomplishments)\b/.test(normalized)) return 'achievements';

  return undefined;
}

function classifyLineByKeywords(line: string): keyof ResumeSectionCoverage | undefined {
  const normalized = line.toLowerCase();

  if (/\bb\.?tech|\bm\.?tech|bachelor|master|university|college|cgpa|gpa/.test(normalized)) return 'education';
  if (/certified|certification|certificate|aws certified|azure certified/.test(normalized)) return 'certifications';
  if (/project|built|developed|implemented|launched/.test(normalized)) return 'projects';
  if (/experience|engineer|developer|lead|architect|intern/.test(normalized)) return 'experience';
  if (/javascript|typescript|react|node|python|java|docker|kubernetes|aws|azure|gcp|sql|mongodb/.test(normalized)) {
    return 'skills';
  }
  if (/award|winner|achiev|recognition|top performer|hackathon/.test(normalized)) return 'achievements';

  return undefined;
}

function parseResumeSections(text: string): ResumeSectionCoverage {
  const sections: ResumeSectionCoverage = {
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    education: [],
    certifications: [],
    achievements: []
  };

  const normalizedText = text.replace(
    /(summary:|profile:|experience:|work experience:|projects:|skills:|technical skills:|education:|certifications:|achievements:)/gi,
    '\n$1'
  );

  const lines = normalizedText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length > 0);

  let activeSection: keyof ResumeSectionCoverage | undefined;

  for (const line of lines) {
    const headingSection = detectSection(line);

    if (headingSection) {
      activeSection = headingSection;

      const inlineContent = cleanLine(line.replace(/^[^:]+:\s*/i, ''));

      if (inlineContent.length > 0 && inlineContent.toLowerCase() !== line.toLowerCase()) {
        sections[headingSection].push(inlineContent);
      }

      continue;
    }

    const section = activeSection ?? classifyLineByKeywords(line);

    if (section) {
      sections[section].push(line);
      continue;
    }

    if (sections.summary.length < 5) {
      sections.summary.push(line);
    }
  }

  return {
    summary: unique(sections.summary).slice(0, 10),
    experience: unique(sections.experience).slice(0, 16),
    projects: unique(sections.projects).slice(0, 16),
    skills: unique(sections.skills).slice(0, 20),
    education: unique(sections.education).slice(0, 10),
    certifications: unique(sections.certifications).slice(0, 10),
    achievements: unique(sections.achievements).slice(0, 10)
  };
}

function extractProfile(text: string, highlights: string[], sections: ResumeSectionCoverage): ResumeExtractedProfile {
  const lower = text.toLowerCase();
  const yearPatterns = [/(\d+)\+?\s+years?/i, /experience\s+of\s+(\d+)\+?\s+years?/i, /(\d+)\+?\s+yrs?/i];
  const yearsExperience = yearPatterns
    .map((pattern) => {
      const match = lower.match(pattern);
      return match?.[1] ? Number(match[1]) : undefined;
    })
    .find((value) => typeof value === 'number');

  const quantifiedFromSections = [...sections.achievements, ...sections.projects, ...sections.experience].filter((line) =>
    /\b\d+(%|x|k|m|ms|sec|seconds|days|weeks|months)?\b/i.test(line)
  );
  const quantifiedFromText = text
    .split(/[.!?\n]+/)
    .map(cleanLine)
    .filter((line) => /\b\d+(%|x|k|m|ms|sec|seconds|days|weeks|months)?\b/i.test(line));

  const quantifiedAchievements = unique([...quantifiedFromSections, ...quantifiedFromText]).slice(0, 8);

  const domainCandidates = [
    { token: 'frontend', label: 'frontend engineering' },
    { token: 'backend', label: 'backend engineering' },
    { token: 'fullstack', label: 'full-stack development' },
    { token: 'data', label: 'data engineering' },
    { token: 'devops', label: 'devops' },
    { token: 'machine learning', label: 'machine learning' },
    { token: 'cloud', label: 'cloud architecture' },
    { token: 'mobile', label: 'mobile development' }
  ];

  const domains = domainCandidates.filter((item) => lower.includes(item.token)).map((item) => item.label);

  return {
    yearsExperience,
    strongestSkills: unique(highlights).slice(0, 10),
    domains: unique(domains),
    quantifiedAchievements
  };
}

function buildMissingSignals(sections: ResumeSectionCoverage, profile: ResumeExtractedProfile): string[] {
  const missing: string[] = [];

  if (sections.experience.length === 0) {
    missing.push('Work experience bullets are missing or unclear.');
  }

  if (sections.projects.length === 0) {
    missing.push('Project details are missing; add at least 2 impact-focused projects.');
  }

  if (sections.skills.length === 0) {
    missing.push('Technical skills section is missing.');
  }

  if (profile.quantifiedAchievements.length === 0) {
    missing.push('No measurable outcomes detected (%, latency, cost, scale, throughput, etc.).');
  }

  if (!profile.yearsExperience) {
    missing.push('Total years of experience not clearly stated.');
  }

  return missing;
}

export function extractFactsFromText(text: string): string[] {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 18);

  const factCandidates = sentences.filter((sentence) => {
    const lower = sentence.toLowerCase();

    return (
      /\b(i|my|we)\b/.test(lower) &&
      /(built|designed|implemented|optimized|led|improved|deployed|scaled|reduced|increased)/.test(lower)
    );
  });

  const metricFacts = sentences.filter((sentence) => /\b\d+(%|ms|x|k|m)?\b/i.test(sentence));

  return unique([...factCandidates, ...metricFacts]).slice(0, 12);
}

function inferRole(text: string): InterviewRole {
  const lower = text.toLowerCase();

  const scores: Record<InterviewRole, number> = {
    frontend: 0,
    backend: 0,
    fullstack: 0,
    data: 0,
    devops: 0
  };

  if (/react|vue|angular|frontend|ui|css|html/.test(lower)) scores.frontend += 2;
  if (/node|java|spring|api|microservice|backend|database|express/.test(lower)) scores.backend += 2;
  if (/fullstack|full stack/.test(lower)) scores.fullstack += 3;
  if (/etl|pipeline|spark|warehouse|data engineer|analytics/.test(lower)) scores.data += 3;
  if (/docker|kubernetes|devops|ci\/cd|terraform|sre|monitoring/.test(lower)) scores.devops += 3;

  if (scores.frontend > 0 && scores.backend > 0) {
    scores.fullstack += 2;
  }

  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] as InterviewRole) || 'backend';
}

function inferLevel(text: string): InterviewLevel {
  const lower = text.toLowerCase();
  const yearsMatch = lower.match(/(\d+)\+?\s+years?/);
  const years = yearsMatch ? Number(yearsMatch[1]) : 0;

  if (years >= 6 || /senior|lead|architect|principal/.test(lower)) {
    return 'senior';
  }

  if (years >= 3 || /mid|intermediate/.test(lower)) {
    return 'mid';
  }

  return 'junior';
}

export function scanResumeContent(input: { text: string; fileName?: string }): ResumeScanResult {
  const originalText = input.text.replace(/\r\n/g, '\n').trim();
  const cleanedText = originalText.replace(/\s+/g, ' ').trim();
  const highlights = extractResumeHighlights(cleanedText);
  const facts = extractFactsFromText(originalText);
  const sections = parseResumeSections(originalText);
  const extractedProfile = extractProfile(originalText, highlights, sections);
  const normalizedForCoverage = originalText.replace(
    /(summary:|profile:|experience:|work experience:|projects:|skills:|technical skills:|education:|certifications:|achievements:)/gi,
    '\n$1'
  );
  const allLines = normalizedForCoverage
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length > 0);
  const capturedLines = unique(
    [
      ...sections.summary,
      ...sections.experience,
      ...sections.projects,
      ...sections.skills,
      ...sections.education,
      ...sections.certifications,
      ...sections.achievements
    ].map(cleanLine)
  );

  const coverage = {
    totalLines: allLines.length,
    capturedLines: capturedLines.length,
    coveragePercent: allLines.length === 0 ? 0 : Number(((capturedLines.length / allLines.length) * 100).toFixed(2))
  };
  const missingSignals = buildMissingSignals(sections, extractedProfile);

  return {
    fileName: input.fileName,
    extractedText: cleanedText,
    highlights,
    facts,
    sections,
    extractedProfile,
    coverage,
    missingSignals,
    recommendedRole: inferRole(cleanedText),
    recommendedLevel: inferLevel(cleanedText)
  };
}
