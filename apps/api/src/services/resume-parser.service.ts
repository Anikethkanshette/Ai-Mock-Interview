const KNOWN_SKILLS = [
  'javascript',
  'typescript',
  'react',
  'next.js',
  'node.js',
  'express',
  'mongodb',
  'postgresql',
  'mysql',
  'redis',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'python',
  'java',
  'spring boot',
  'graphql',
  'rest api',
  'microservices',
  'system design',
  'ci/cd',
  'testing',
  'jest',
  'playwright'
];

export function extractResumeHighlights(resumeText: string): string[] {
  const loweredResume = resumeText.toLowerCase();

  const matchedSkills = KNOWN_SKILLS.filter((skill) => loweredResume.includes(skill));

  if (matchedSkills.length > 0) {
    return matchedSkills.slice(0, 6);
  }

  const tokenCandidates = loweredResume
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 4)
    .slice(0, 6);

  return tokenCandidates.length > 0 ? tokenCandidates : ['problem solving', 'communication'];
}
