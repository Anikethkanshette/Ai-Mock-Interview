import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Target, Briefcase, FileText, BarChart3, Bot, CheckCircle2, UserCircle, LogOut, Code, PlayCircle, ShieldCheck, Activity, Target as Bullseye, Trophy, Zap, MapPin, Eye, RefreshCw, Sparkles, BrainCircuit, FileSearch, Mic, AlertTriangle, Clipboard, Download } from 'lucide-react';
import {
  getAnalyticsOverview,
  getInterviewResult,
  getInterviewSession,
  listSessions,
  predictCompanyQuestions,
  scanResume,
  startInterview,
  submitInterviewAnswer,
  terminateInterview
} from '../services/api';
import { buildResumeIntelligenceReport } from '../services/resume-intelligence';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { UserProfile } from '../types/auth';
import type {
  AgentDecision,
  AnalyticsOverview,
  CompanyInterviewIntelligence,
  InterviewLevel,
  InterviewQuestion,
  InterviewResult,
  InterviewRole,
  InterviewSession,
  ResumeScanResult,
  ResumeIntelligenceReport,
  SessionSummary,
  ScoreBreakdown
} from '../types/interview';

const ROLE_OPTIONS: InterviewRole[] = ['frontend', 'backend', 'fullstack', 'data', 'devops'];
const LEVEL_OPTIONS: InterviewLevel[] = ['junior', 'mid', 'senior'];

type HistoryStatus = 'all' | 'active' | 'completed' | 'terminated';
type DashboardTheme = 'aurora' | 'neon' | 'glass';
type DashboardWorkspace = 'studio' | 'resume-lab' | 'analytics';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenProfile: () => void;
  onResumeScanned: (scan: ResumeScanResult) => void;
}

interface StartForm {
  candidateName: string;
  role: InterviewRole;
  level: InterviewLevel;
  resumeText: string;
  targetCompany: string;
  interviewerName: string;
}

interface ResumeBuilderForm {
  summary: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  achievements: string;
}

function toPhaseBadge(phase: InterviewQuestion['phase']): string {
  if (phase === 'intro') {
    return 'badge badge-intro';
  }

  if (phase === 'resume') {
    return 'badge badge-resume';
  }

  if (phase === 'technical') {
    return 'badge badge-technical';
  }

  if (phase === 'system') {
    return 'badge badge-system';
  }

  if (phase === 'behavioral') {
    return 'badge badge-behavioral';
  }

  return 'badge badge-follow-up';
}

function toStatusBadge(status: InterviewSession['status'] | HistoryStatus): string {
  if (status === 'active') {
    return 'badge badge-active';
  }

  if (status === 'completed') {
    return 'badge badge-completed';
  }

  if (status === 'terminated') {
    return 'badge badge-terminated';
  }

  return 'badge';
}

function formatAgentName(agent: AgentDecision['agent']): string {
  return agent.replace('-agent', '').replace('-', ' ');
}

function shortAgent(agent: AgentDecision['agent']): string {
  if (agent === 'resume-agent') {
    return 'R';
  }

  if (agent === 'interviewer-agent') {
    return 'I';
  }

  if (agent === 'evaluator-agent') {
    return 'E';
  }

  if (agent === 'coach-agent') {
    return 'C';
  }

  return 'O';
}

function averageBreakdown(turns: InterviewSession['turns']): ScoreBreakdown {
  const answered = turns.filter((turn) => Boolean(turn.scoreBreakdown));

  if (answered.length === 0) {
    return {
      technicalAccuracy: 0,
      communication: 0,
      problemSolving: 0,
      impactOrientation: 0,
      overall: 0
    };
  }

  const total = answered.reduce(
    (acc, turn) => {
      const breakdown = turn.scoreBreakdown!;
      acc.technicalAccuracy += breakdown.technicalAccuracy;
      acc.communication += breakdown.communication;
      acc.problemSolving += breakdown.problemSolving;
      acc.impactOrientation += breakdown.impactOrientation;
      acc.overall += breakdown.overall;
      return acc;
    },
    {
      technicalAccuracy: 0,
      communication: 0,
      problemSolving: 0,
      impactOrientation: 0,
      overall: 0
    }
  );

  return {
    technicalAccuracy: Math.round(total.technicalAccuracy / answered.length),
    communication: Math.round(total.communication / answered.length),
    problemSolving: Math.round(total.problemSolving / answered.length),
    impactOrientation: Math.round(total.impactOrientation / answered.length),
    overall: Math.round(total.overall / answered.length)
  };
}

export function InterviewDashboard(props: DashboardProps) {
  const [form, setForm] = useState<StartForm>({
    candidateName: props.user.fullName,
    role: 'backend',
    level: 'mid',
    resumeText: '',
    targetCompany: '',
    interviewerName: ''
  });

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [intelligencePreview, setIntelligencePreview] = useState<CompanyInterviewIntelligence | null>(null);
  const [resumeScanResult, setResumeScanResult] = useState<ResumeScanResult | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeIntelligenceReport, setResumeIntelligenceReport] = useState<ResumeIntelligenceReport | null>(null);
  const [historyNameFilter, setHistoryNameFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatus>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningResume, setIsScanningResume] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isGeneratingIntelligence, setIsGeneratingIntelligence] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardTheme, setDashboardTheme] = useState<DashboardTheme>('aurora');
  const [activeWorkspace, setActiveWorkspace] = useState<DashboardWorkspace>('studio');
  const [statusMessage, setStatusMessage] = useState('Prepare resume context and start a live interview session.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [atsDraft, setAtsDraft] = useState('');
  const [builderMode, setBuilderMode] = useState<'fresher' | 'experienced'>(
    typeof props.user.yearsExperience === 'number' && props.user.yearsExperience >= 1 ? 'experienced' : 'fresher'
  );
  const [builderForm, setBuilderForm] = useState<ResumeBuilderForm>({
    summary: '',
    skills: '',
    experience: '',
    projects: '',
    education: '',
    achievements: ''
  });

  const appendTranscript = useCallback((transcript: string) => {
    setAnswerDraft(transcript);
  }, []);

  const voice = useVoiceInput(appendTranscript);

  const answeredCount = useMemo(() => session?.turns.filter((turn) => Boolean(turn.answer)).length ?? 0, [session]);
  const turnsCount = session?.turns.length ?? 0;
  const progressPercent = turnsCount > 0 ? Math.round((answeredCount / turnsCount) * 100) : 0;

  const breakdown = useMemo(() => {
    if (!session) {
      return {
        technicalAccuracy: 0,
        communication: 0,
        problemSolving: 0,
        impactOrientation: 0,
        overall: 0
      } satisfies ScoreBreakdown;
    }

    return averageBreakdown(session.turns);
  }, [session]);

  const atsResumeBlueprint = useMemo(() => {
    if (!resumeIntelligenceReport && !resumeScanResult) {
      return '';
    }

    const lines: string[] = [];
    const displayName = (form.candidateName || props.user.fullName || '').toUpperCase();
    const headline = props.user.headline || `${form.role} candidate`;
    const targetRole = props.user.targetRole || form.role;
    const years = typeof props.user.yearsExperience === 'number' ? props.user.yearsExperience : undefined;

    lines.push(displayName);
    lines.push(headline);
    lines.push('');
    lines.push(`${targetRole}${years !== undefined ? ` · ${years}+ years experience` : ''}`);
    lines.push('');

    lines.push('SUMMARY');
    const readinessSummary = resumeIntelligenceReport?.advancedInsights?.roleReadinessSummary;
    if (readinessSummary) {
      lines.push(`- ${readinessSummary}`);
    } else {
      lines.push('- 2–3 lines summarising your stack, impact and domains.');
    }
    lines.push('');

    lines.push('CORE SKILLS');
    const strongestSkills = resumeScanResult?.extractedProfile.strongestSkills?.slice(0, 8) ?? props.user.primarySkills ?? [];
    if (strongestSkills.length > 0) {
      lines.push(`- ${strongestSkills.join(' · ')}`);
    } else {
      lines.push('- Add 6–10 skills that match the job description and your real experience.');
    }
    lines.push('');

    lines.push('EXPERIENCE HIGHLIGHTS');
    if (resumeScanResult?.highlights?.length) {
      resumeScanResult.highlights.slice(0, 4).forEach((item) => {
        lines.push(`- ${item}`);
      });
    } else {
      lines.push('- Role · Company · YYYY–YYYY — measurable impact, tech stack, and ownership.');
    }
    lines.push('');

    lines.push('PROJECTS');
    if (resumeScanResult?.sections.projects?.length) {
      lines.push('- 2–3 projects that showcase system design, architecture, or end-to-end ownership.');
    } else {
      lines.push('- Add 2–3 projects with metrics (users, revenue, latency, reliability).');
    }
    lines.push('');

    lines.push('ACHIEVEMENTS');
    if (resumeIntelligenceReport?.advancedInsights?.priorityActions?.length) {
      resumeIntelligenceReport.advancedInsights.priorityActions.slice(0, 3).forEach((action) => {
        lines.push(`- ${action}`);
      });
    } else {
      lines.push('- Certifications, awards, promotions, or public speaking that reinforce your positioning.');
    }
    lines.push('');

    lines.push('ATS KEYWORDS & DOMAIN TERMS');
    if (resumeIntelligenceReport?.atsReport?.issues?.length) {
      const missingKeywordIssues = resumeIntelligenceReport.atsReport.issues
        .filter((issue) => issue.message.toLowerCase().includes('keyword'))
        .slice(0, 5)
        .map((issue) => issue.suggestion || issue.message);
      if (missingKeywordIssues.length > 0) {
        missingKeywordIssues.forEach((item) => {
          lines.push(`- ${item}`);
        });
      } else {
        lines.push('- Mirror terminology from the job description where it truly matches your experience.');
      }
    } else {
      lines.push('- Ensure your wording mirrors genuine skills and the target JD phrasing.');
    }

    return lines.join('\n');
  }, [resumeIntelligenceReport, resumeScanResult, form.candidateName, form.role, props.user]);

  async function refreshInsights() {
    const [sessionsPayload, analyticsPayload] = await Promise.all([
      listSessions({
        candidateName: historyNameFilter || undefined,
        status: historyStatusFilter === 'all' ? undefined : historyStatusFilter
      }),
      getAnalyticsOverview()
    ]);

    setSessionHistory(sessionsPayload.sessions.slice(0, 12));
    setAnalytics(analyticsPayload);
  }

  useEffect(() => {
    refreshInsights();
  }, [historyNameFilter, historyStatusFilter]);

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll('.ds-root .reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );

    revealTargets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [session?.sessionId, result?.completed]);

  async function syncCurrentSession(sessionId: string) {
    const latestSession = await getInterviewSession(sessionId);
    setSession(latestSession);

    const pendingTurn = latestSession.turns.find((turn) => !turn.answer);
    setCurrentQuestion(pendingTurn?.question ?? null);

    if (!pendingTurn) {
      const latestResult = await getInterviewResult(sessionId);
      setResult(latestResult);
      setStatusMessage('Interview completed. Review strengths and evidence-backed improvement plan below.');
    }
  }

  async function handleScanResume() {
    if (!resumeFile && !form.resumeText.trim()) {
      setErrorMessage('Upload a resume file or paste resume text first.');
      return;
    }

    setErrorMessage(null);
    setIsScanningResume(true);

    try {
      const scanResult = await scanResume(resumeFile ?? undefined, form.resumeText);
      setForm((prev) => ({
        ...prev,
        role: scanResult.recommendedRole,
        level: scanResult.recommendedLevel,
        resumeText: scanResult.extractedText
      }));
      setResumeScanResult(scanResult);
      props.onResumeScanned(scanResult);
      setStatusMessage(
        `Resume parsed successfully (${scanResult.coverage.coveragePercent}% coverage). Suggested: ${scanResult.recommendedRole}/${scanResult.recommendedLevel}.`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to scan resume.');
    } finally {
      setIsScanningResume(false);
    }
  }

  async function handlePredictQuestions() {
    if (!form.targetCompany.trim() && !form.interviewerName.trim()) {
      setErrorMessage('Enter target company or interviewer for prediction.');
      return;
    }

    setErrorMessage(null);
    setIsPredicting(true);

    try {
      const prediction = await predictCompanyQuestions({
        targetCompany: form.targetCompany || undefined,
        interviewerName: form.interviewerName || undefined,
        role: form.role,
        level: form.level,
        resumeText: form.resumeText
      });

      setIntelligencePreview(prediction);
      setStatusMessage('Company intelligence generated from backend research signals.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to predict questions.');
    } finally {
      setIsPredicting(false);
    }
  }

  async function handleRunResumeIntelligence() {
    if (!form.resumeText.trim()) {
      setErrorMessage('Resume text is required for intelligence features.');
      return;
    }

    if (!jobDescription.trim()) {
      setErrorMessage('Job description is required to compute match and ATS insights.');
      return;
    }

    setErrorMessage(null);
    setIsGeneratingIntelligence(true);

    try {
      const report = buildResumeIntelligenceReport({
        resumeText: form.resumeText,
        jobDescription,
        targetRole: form.role,
        resumeScan: resumeScanResult,
        candidateName: form.candidateName,
        profile: {
          headline: props.user.headline,
          targetRole: props.user.targetRole,
          yearsExperience: props.user.yearsExperience,
          primarySkills: props.user.primarySkills,
          bio: props.user.bio
        }
      });

      setResumeIntelligenceReport(report);
      setStatusMessage('Resume Intelligence Studio generated scoring, ATS, job matches, tips, LinkedIn optimization, and cover letter.');
    } finally {
      setIsGeneratingIntelligence(false);
    }
  }

  async function handleStartInterview() {
    if (!form.candidateName.trim() || !form.resumeText.trim()) {
      setErrorMessage('Candidate name and resume context are required.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setResult(null);
    setAnswerDraft('');

    try {
      const response = await startInterview(form);
      setCurrentQuestion(response.currentQuestion);
      setResumeScanResult(response.resumeAnalysis);
      props.onResumeScanned(response.resumeAnalysis);
      setIntelligencePreview(response.intelligence ?? intelligencePreview);
      await syncCurrentSession(response.sessionId);
      await refreshInsights();
      setStatusMessage(`Interview started: ${response.role}/${response.level} track is now active.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to start interview.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!session?.sessionId || !answerDraft.trim() || session.status !== 'active') {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await submitInterviewAnswer(session.sessionId, answerDraft);
      setStatusMessage(`Answer evaluated ${response.score}/10 · ${response.feedback}`);
      setAnswerDraft('');
      await syncCurrentSession(session.sessionId);
      await refreshInsights();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit answer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTerminateInterview() {
    if (!session?.sessionId) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await terminateInterview(session.sessionId);
      await syncCurrentSession(session.sessionId);
      await refreshInsights();
      setStatusMessage('Session terminated and persisted successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to terminate interview.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLoadSession(sessionId: string) {
    setErrorMessage(null);

    try {
      await syncCurrentSession(sessionId);
      setStatusMessage('Historical session loaded from backend state.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load this session.');
    }
  }

  function handleReadQuestion() {
    if (currentQuestion) {
      voice.speak(currentQuestion.prompt);
    }
  }

  function handleLogout() {
    props.onLogout();
  }

  function handleCopyAtsBlueprint() {
    if (!atsResumeBlueprint) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(atsResumeBlueprint).then(
        () => {
          setStatusMessage('Copied ATS resume outline to clipboard.');
        },
        () => {
          setStatusMessage('Unable to access clipboard in this browser.');
        }
      );
    } else {
      setStatusMessage('Clipboard API not available in this environment.');
    }
  }

  function handleDownloadAtsBlueprint() {
    if (!atsResumeBlueprint) {
      return;
    }

    const blob = new Blob([atsResumeBlueprint], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ats-resume-blueprint.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('Downloaded ATS resume outline as .txt file.');
  }

  function handleCreateAtsDraft() {
    const displayName = (form.candidateName || props.user.fullName || '').toUpperCase();
    const headline = props.user.headline || `${form.role} candidate`;
    const targetRole = props.user.targetRole || form.role;
    const years = typeof props.user.yearsExperience === 'number' ? props.user.yearsExperience : undefined;

    const lines: string[] = [];
    lines.push(displayName);
    lines.push(headline);
    lines.push('');
    lines.push(`${targetRole}${years !== undefined ? ` · ${years}+ years experience` : ''}`);
    lines.push('');
    lines.push('SUMMARY');
    lines.push('- 2–3 lines that position you for your target roles.');
    lines.push('');
    lines.push('CORE SKILLS');
    lines.push('- List 8–12 skills that genuinely match your experience and the roles you want.');
    lines.push('');
    lines.push('EXPERIENCE');
    lines.push('- Job Title · Company · YYYY–YYYY — impact, tech stack, ownership.');
    lines.push('- Repeat for 2–4 roles, focusing on measurable outcomes.');
    lines.push('');
    lines.push('PROJECTS');
    lines.push('- Project name — what it does, tech used, and impact/scale.');
    lines.push('- 2–3 projects that showcase architecture, systems, or end-to-end work.');
    lines.push('');
    lines.push('EDUCATION & CERTIFICATIONS');
    lines.push('- Degree / Program — School, YYYY.');
    lines.push('- Relevant certifications or formal training.');
    lines.push('');
    lines.push('ACHIEVEMENTS');
    lines.push('- Promotions, awards, speaking, OSS, or other credibility signals.');

    const baseTemplate = atsResumeBlueprint || lines.join('\n');

    setAtsDraft(baseTemplate);
    setStatusMessage(
      atsResumeBlueprint
        ? 'Editable ATS resume draft created below.'
        : 'Started a blank ATS resume template you can fill out.'
    );
  }

  function handleCopyAtsDraft() {
    if (!atsDraft.trim()) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(atsDraft).then(
        () => {
          setStatusMessage('Copied editable resume draft to clipboard.');
        },
        () => {
          setStatusMessage('Unable to access clipboard in this browser.');
        }
      );
    } else {
      setStatusMessage('Clipboard API not available in this environment.');
    }
  }

  function handleDownloadAtsDraft() {
    if (!atsDraft.trim()) {
      return;
    }

    const blob = new Blob([atsDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ats-resume-draft.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('Downloaded editable resume draft as .txt file.');
  }

  function handleGenerateResumeFromBuilder() {
    const lines: string[] = [];

    const displayName = (form.candidateName || props.user.fullName || '').toUpperCase();
    const headline = props.user.headline || `${form.role} candidate`;
    const targetRole = props.user.targetRole || form.role;
    const years = typeof props.user.yearsExperience === 'number' ? props.user.yearsExperience : undefined;

    lines.push(displayName);
    lines.push(headline);
    lines.push('');
    lines.push(`${targetRole}${years !== undefined ? ` · ${years}+ years experience` : ''}`);
    lines.push('');

    // Order and copy are slightly different for freshers vs experienced profiles.
    if (builderMode === 'fresher') {
      lines.push('SUMMARY');
      if (builderForm.summary.trim()) {
        lines.push(builderForm.summary.trim());
      } else {
        lines.push('- Final-year student / recent graduate interested in your target roles.');
      }
      lines.push('');

      lines.push('CORE SKILLS');
      if (builderForm.skills.trim()) {
        lines.push(builderForm.skills.trim());
      } else {
        lines.push('- Programming languages, frameworks, tools and soft skills separated by commas.');
      }
      lines.push('');

      lines.push('EDUCATION');
      if (builderForm.education.trim()) {
        lines.push(builderForm.education.trim());
      } else {
        lines.push('- Degree / Program — School, YYYY (CGPA / key coursework if relevant).');
      }
      lines.push('');

      lines.push('PROJECTS');
      if (builderForm.projects.trim()) {
        lines.push(builderForm.projects.trim());
      } else {
        lines.push('- Academic or personal projects — what you built, tech used, and impact/learning.');
      }
      lines.push('');

      lines.push('INTERNSHIPS & TRAINING');
      if (builderForm.experience.trim()) {
        lines.push(builderForm.experience.trim());
      } else {
        lines.push('- Any internships, part-time work, or training with 1–2 bullet points each.');
      }
      lines.push('');

      lines.push('ACHIEVEMENTS');
      if (builderForm.achievements.trim()) {
        lines.push(builderForm.achievements.trim());
      } else {
        lines.push('- Hackathons, competitions, scholarships, clubs, open source, or notable wins.');
      }
    } else {
      lines.push('SUMMARY');
      if (builderForm.summary.trim()) {
        lines.push(builderForm.summary.trim());
      } else {
        lines.push('- 2–3 lines that position you for your target roles.');
      }
      lines.push('');

      lines.push('CORE SKILLS');
      if (builderForm.skills.trim()) {
        lines.push(builderForm.skills.trim());
      } else {
        lines.push('- List 8–12 skills separated by commas.');
      }
      lines.push('');

      lines.push('EXPERIENCE');
      if (builderForm.experience.trim()) {
        lines.push(builderForm.experience.trim());
      } else {
        lines.push('- Job Title · Company · YYYY–YYYY — impact, tech stack, ownership.');
      }
      lines.push('');

      lines.push('PROJECTS');
      if (builderForm.projects.trim()) {
        lines.push(builderForm.projects.trim());
      } else {
        lines.push('- Project name — what it does, tech used, and impact/scale.');
      }
      lines.push('');

      lines.push('EDUCATION & CERTIFICATIONS');
      if (builderForm.education.trim()) {
        lines.push(builderForm.education.trim());
      } else {
        lines.push('- Degree / Program — School, YYYY.');
      }
      lines.push('');

      lines.push('ACHIEVEMENTS');
      if (builderForm.achievements.trim()) {
        lines.push(builderForm.achievements.trim());
      } else {
        lines.push('- Promotions, awards, speaking, OSS, or other credibility signals.');
      }
    }

    const draft = lines.join('\n');
    setAtsDraft(draft);
    setStatusMessage('Generated resume draft from guided fields below.');
  }

  const latestTurn = [...(session?.turns ?? [])].reverse().find((turn) => Boolean(turn.answer));

  const workspaceTitle =
    activeWorkspace === 'studio'
      ? 'Interview Studio'
      : activeWorkspace === 'resume-lab'
        ? 'Resume Intelligence Lab'
        : 'Analytics Hub';

  const workspaceSubtitle =
    activeWorkspace === 'studio'
      ? 'Run the live interview loop with adaptive questioning and scoring.'
      : activeWorkspace === 'resume-lab'
        ? 'Upgrade resume impact, ATS readiness and job targeting.'
        : 'Track outcomes, drill into history, and review performance trends.';

  return (
    <div className="mi-dashboard-root">
      <aside className={`mi-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="mi-sidebar-brand">
          <div className="mi-brand-icon">
            <LayoutDashboard size={18} />
          </div>
          <div className="mi-brand-text">agentic interviewer</div>
        </div>

        <div className="mi-sidebar-nav">
          <p className="mi-nav-group-title">Workspace</p>
          <button
            className={`mi-nav-btn ${activeWorkspace === 'studio' ? 'active' : ''}`}
            onClick={() => {
              setActiveWorkspace('studio');
              setSidebarOpen(false);
            }}
            type="button"
          >
            <motion.span layout className="stat-icon blue">
              <Target size={16} />
            </motion.span>
            <span>Interview Studio</span>
            {activeWorkspace === 'studio' && (
              <motion.div layoutId="nav-pill" className="mi-nav-active-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
            )}
          </button>

          <button
            className={`mi-nav-btn ${activeWorkspace === 'resume-lab' ? 'active' : ''}`}
            onClick={() => {
              setActiveWorkspace('resume-lab');
              setSidebarOpen(false);
            }}
            type="button"
          >
            <motion.span layout className="stat-icon purple">
              <FileText size={16} />
            </motion.span>
            <span>Resume Lab</span>
            {activeWorkspace === 'resume-lab' && (
              <motion.div layoutId="nav-pill" className="mi-nav-active-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
            )}
          </button>

          <button
            className={`mi-nav-btn ${activeWorkspace === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveWorkspace('analytics');
              setSidebarOpen(false);
            }}
            type="button"
          >
            <motion.span layout className="stat-icon green">
              <BarChart3 size={16} />
            </motion.span>
            <span>Analytics Hub</span>
            {activeWorkspace === 'analytics' && (
              <motion.div layoutId="nav-pill" className="mi-nav-active-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
            )}
          </button>

          <p className="mi-nav-group-title" style={{ marginTop: '16px' }}>Account</p>
          <button
            className="mi-nav-btn"
            type="button"
            onClick={() => {
              props.onOpenProfile();
              setSidebarOpen(false);
            }}
          >
            <UserCircle size={16} />
            <span>Profile</span>
          </button>
          <button
            className="mi-nav-btn"
            type="button"
            onClick={async () => {
              await refreshInsights();
              setSidebarOpen(false);
            }}
          >
            <RefreshCw size={16} />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className="mi-sidebar-user">
          <div className="stat-icon">
            <span>{props.user.fullName.slice(0, 1).toUpperCase()}</span>
          </div>
          <div className="mi-user-details">
            <span className="mi-user-name">{props.user.fullName}</span>
            <span className="mi-user-plan">{props.user.email}</span>
          </div>
          <button className="mi-logout-btn" type="button" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="mi-main-canvas">
        <header className="mi-top-header">
          <div className="mi-header-breadcrumbs">
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <span className="mi-crumb">Workspace</span>
            <span className="mi-crumb">/</span>
            <span className="mi-crumb active">{workspaceTitle}</span>
          </div>
          <div className="mi-status-badge">
            <span className="pulse-dot" />
            <span>{statusMessage}</span>
            {session && (
              <span>
                · {session.status} · {answeredCount}/{session.maxTurns} turns
              </span>
            )}
          </div>
        </header>

        <main className="mi-content-area">
          {activeWorkspace === 'studio' && (
            <div className="mi-bento-grid">
              <div className="mi-bento-card col-span-2">
                <div className="mi-card-header">
                  <div className="stat-icon blue">
                    <PlayCircle size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Live Interview Setup</h3>
                    <p>{workspaceSubtitle}</p>
                  </div>
                </div>

                <div className="mi-form-grid">
                  <div className="mi-input-wrap">
                    <label>Candidate Name</label>
                    <input
                      className="mi-input"
                      value={form.candidateName}
                      onChange={(event) => setForm((prev) => ({ ...prev, candidateName: event.target.value }))}
                    />
                  </div>
                  <div className="mi-input-wrap">
                    <label>Target Company</label>
                    <input
                      className="mi-input"
                      value={form.targetCompany}
                      onChange={(event) => setForm((prev) => ({ ...prev, targetCompany: event.target.value }))}
                      placeholder="Google, Amazon, Microsoft..."
                    />
                  </div>
                  <div className="mi-input-wrap">
                    <label>Interviewer Name</label>
                    <input
                      className="mi-input"
                      value={form.interviewerName}
                      onChange={(event) => setForm((prev) => ({ ...prev, interviewerName: event.target.value }))}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="mi-input-wrap">
                    <label>Role</label>
                    <select
                      className="mi-select"
                      value={form.role}
                      onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as InterviewRole }))}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mi-input-wrap">
                    <label>Level</label>
                    <select
                      className="mi-select"
                      value={form.level}
                      onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value as InterviewLevel }))}
                    >
                      {LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mi-input-wrap">
                    <label>Resume File</label>
                    <input
                      className="mi-input"
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx"
                      onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  <div className="mi-input-wrap col-span-3">
                    <label>Resume Context</label>
                    <textarea
                      className="mi-textarea"
                      value={form.resumeText}
                      onChange={(event) => setForm((prev) => ({ ...prev, resumeText: event.target.value }))}
                      rows={6}
                      placeholder="Paste resume text including projects, stack, impact and outcomes."
                    />
                  </div>

                  <div className="mi-input-wrap col-span-3">
                    <label>Target Job Description</label>
                    <textarea
                      className="mi-textarea"
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      rows={5}
                      placeholder="Paste the job description to compute resume score, ATS compatibility, and match suggestions."
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="mi-btn" type="button" onClick={handleScanResume} disabled={isScanningResume}>
                    <FileSearch size={16} />
                    <span>{isScanningResume ? 'Scanning…' : 'Scan Resume'}</span>
                  </button>
                  <button className="mi-btn" type="button" onClick={handlePredictQuestions} disabled={isPredicting}>
                    <BrainCircuit size={16} />
                    <span>{isPredicting ? 'Predicting…' : 'Predict Questions'}</span>
                  </button>
                  <button className="mi-btn" type="button" onClick={handleRunResumeIntelligence} disabled={isGeneratingIntelligence}>
                    <Sparkles size={16} />
                    <span>{isGeneratingIntelligence ? 'Analyzing…' : 'Run Resume Intelligence'}</span>
                  </button>
                  <button className="mi-btn primary" type="button" onClick={handleStartInterview} disabled={isLoading}>
                    <PlayCircle size={16} />
                    <span>{isLoading ? 'Starting…' : 'Start Interview'}</span>
                  </button>
                </div>

                {errorMessage && <p className="msg-error" style={{ marginTop: '8px' }}>{errorMessage}</p>}
                {!errorMessage && <p className="msg-ok" style={{ marginTop: '8px' }}>Ready for backend orchestration flow.</p>}
              </div>

              <div className="mi-bento-card col-span-1">
                <div className="mi-card-header">
                  <div className="stat-icon green">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Resume Coverage & Intelligence</h3>
                    <p>Scan coverage, missing signals, and company intelligence.</p>
                  </div>
                </div>

                {resumeScanResult && (
                  <div className="mi-stat-block">
                    <p className="mi-stat-label">Coverage</p>
                    <p className="mi-stat-value">{resumeScanResult.coverage.coveragePercent}%</p>
                    <div className="mi-pills-list" style={{ marginTop: '8px' }}>
                      <span className="mi-pill">Experience · {resumeScanResult.sections.experience.length}</span>
                      <span className="mi-pill">Projects · {resumeScanResult.sections.projects.length}</span>
                      <span className="mi-pill">Skills · {resumeScanResult.sections.skills.length}</span>
                    </div>
                  </div>
                )}

                {intelligencePreview && (
                  <div className="mi-stat-block">
                    <p className="mi-stat-label">Predicted Questions</p>
                    <div className="mi-pills-list">
                      {intelligencePreview.predictedQuestions.slice(0, 4).map((item) => (
                        <span key={item.question.id} className="mi-pill">
                          <Zap size={12} /> {item.question.category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {session && (
                  <div className="mi-stat-block">
                    <p className="mi-stat-label">Session Memory</p>
                    <div className="mi-pills-list">
                      <span className="mi-pill">Known facts · {session.knownFacts.length}</span>
                      <span className="mi-pill">Covered facts · {session.coveredFacts.length}</span>
                      <span className="mi-pill">Messages · {session.conversation.length}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mi-bento-card col-span-2">
                <div className="mi-card-header">
                  <div className="stat-icon blue">
                    <Activity size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Current Question & Transcript</h3>
                    <p>Stay in flow with the active question and conversation.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 2fr)', gap: '20px' }}>
                  <div>
                    {currentQuestion ? (
                      <>
                        <div className="q-card-meta">
                          <span className={toPhaseBadge(currentQuestion.phase)}>{currentQuestion.phase}</span>
                          <span className="badge badge-intro">{currentQuestion.category}</span>
                          <div className="q-diff">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <span key={value} className={`q-diff-dot ${value <= currentQuestion.difficulty ? 'lit' : ''}`} />
                            ))}
                          </div>
                        </div>
                        <p className="q-prompt">{currentQuestion.prompt}</p>
                        <div className="q-topics">
                          {currentQuestion.expectedTopics.slice(0, 6).map((topic) => (
                            <span key={topic} className="q-topic">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="dim">Start or load a session to display the current interview question.</p>
                    )}
                  </div>

                  <div className="convo-card">
                    <div className="convo-feed">
                      {(session?.conversation ?? []).length === 0 && <p className="dim">Conversation transcript appears here in real-time.</p>}
                      {(session?.conversation ?? []).map((message) => (
                        <div key={message.id} className={`convo-msg ${message.speaker === 'candidate' ? 'candidate' : 'interviewer'}`}>
                          <div className="convo-bubble-avatar">{message.speaker === 'candidate' ? 'YOU' : 'AI'}</div>
                          <div className="convo-bubble-body">
                            <p className="convo-bubble-name">{message.speaker === 'candidate' ? 'Candidate' : 'Interviewer'}</p>
                            <p className="convo-bubble-text">{message.text}</p>
                            <p className="convo-bubble-time">{new Date(message.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="answer-input-area">
                      <textarea
                        className="answer-textarea"
                        value={answerDraft}
                        onChange={(event) => setAnswerDraft(event.target.value)}
                        placeholder="Speak or type your answer..."
                        disabled={session?.status !== 'active'}
                      />
                      <div className="answer-actions">
                        <button className="btn btn-ghost" onClick={handleReadQuestion} disabled={!currentQuestion}>
                          Read Question
                        </button>
                        {voice.isSupported ? (
                          voice.isListening ? (
                            <button className="voice-btn recording" onClick={voice.stopListening}>
                              Stop Voice Input
                            </button>
                          ) : (
                            <button className="voice-btn" onClick={voice.startListening}>
                              Start Voice Input
                            </button>
                          )
                        ) : (
                          <span className="dim">Voice input unavailable</span>
                        )}
                        <button
                          className="btn btn-primary"
                          onClick={handleSubmitAnswer}
                          disabled={isSubmitting || !answerDraft.trim() || session?.status !== 'active'}
                        >
                          {isSubmitting ? 'Evaluating...' : 'Submit'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={handleTerminateInterview}
                          disabled={isSubmitting || !session || session.status !== 'active'}
                        >
                          Terminate
                        </button>
                      </div>
                      {voice.voiceError && <p className="msg-error">{voice.voiceError}</p>}
                      {latestTurn?.feedback && <p className="dim">Latest feedback: {latestTurn.feedback}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {session && (
                <div className="mi-bento-card col-span-1">
                  <div className="mi-card-header">
                    <div className="stat-icon blue">
                      <Activity size={18} />
                    </div>
                    <div className="mi-card-title-group">
                      <h3>Progress & Agent Timeline</h3>
                      <p>Track completion and orchestration decisions.</p>
                    </div>
                  </div>

                  <div className="mi-stat-block">
                    <p className="mi-stat-label">Progress</p>
                    <p className="mi-stat-value">{progressPercent}%</p>
                    <div className="prog-bar" style={{ marginTop: '8px' }}>
                      <div className="prog-bar-fill prog-bar-blue" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="mi-pills-list" style={{ marginTop: '8px' }}>
                      <span className="mi-pill">Answered · {answeredCount}</span>
                      <span className="mi-pill">Max turns · {session.maxTurns}</span>
                    </div>
                  </div>

                  {session.agentState && session.agentState.decisions.length > 0 && (
                    <div className="mi-stat-block">
                      <p className="mi-stat-label">Agent Decisions</p>
                      <div className="agent-timeline-body">
                        {session.agentState.decisions.slice().reverse().slice(0, 4).map((decision, index) => (
                          <div key={`${decision.agent}-${index}`} className="agent-tl-item">
                            <div className={`agent-tl-icon ${decision.agent}`}>{shortAgent(decision.agent)}</div>
                            <div className="agent-tl-content">
                              <p className="agent-tl-name">{formatAgentName(decision.agent)}</p>
                              <p className="agent-tl-summary">{decision.summary}</p>
                              <div className="agent-tl-conf">
                                <div className="agent-tl-conf-track">
                                  <div className="agent-tl-conf-fill" style={{ width: `${Math.round(decision.confidence * 100)}%` }} />
                                </div>
                                <p className="agent-tl-conf-pct">{Math.round(decision.confidence * 100)}%</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeWorkspace === 'resume-lab' && (
            <div className="mi-bento-grid">
              <div className="mi-bento-card col-span-2">
                <div className="mi-card-header">
                  <div className="stat-icon purple">
                    <Briefcase size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Resume Intelligence Studio</h3>
                    <p>Score, ATS, match suggestions, and premium guidance.</p>
                  </div>
                </div>

                {resumeIntelligenceReport ? (
                  <div className="mi-form-grid">
                    <div className="stat-card">
                      <div className="stat-icon green">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="stat-val">{resumeIntelligenceReport.scoreReport.score}/10</div>
                      <div className="stat-lbl">Resume Score</div>
                      <p className="dim">Keyword, experience, impact and structure quality.</p>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon blue">
                        <Activity size={20} />
                      </div>
                      <div className="stat-val">{resumeIntelligenceReport.atsReport.passScore}</div>
                      <div className="stat-lbl">ATS Score</div>
                      <p className="dim">{resumeIntelligenceReport.atsReport.passLikely ? 'Likely to pass screening.' : 'At risk of rejection.'}</p>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon purple">
                        <Target size={20} />
                      </div>
                      <div className="stat-val">{resumeIntelligenceReport.jobMatches[0]?.matchScore ?? 0}%</div>
                      <div className="stat-lbl">Best Match</div>
                      <p className="dim">{resumeIntelligenceReport.jobMatches[0]?.title ?? 'Run intelligence to see matches.'}</p>
                    </div>

                    <div className="mi-input-wrap col-span-3" style={{ marginTop: '16px' }}>
                      <label>Top Improvement Tips</label>
                      <div className="mi-pills-list">
                        {resumeIntelligenceReport.improvementTips.slice(0, 4).map((tip) => (
                          <span key={`${tip.title}-${tip.priority}`} className="mi-pill">
                            {tip.priority.toUpperCase()} · {tip.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="dim">Run Resume Intelligence from the Studio workspace to populate this view.</p>
                )}
              </div>

              <div className="mi-bento-card col-span-1">
                <div className="mi-card-header">
                  <div className="stat-icon green">
                    <MapPin size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Guided Checklist</h3>
                    <p>Systematic steps before sending your resume.</p>
                  </div>
                </div>
                <div className="mi-pills-list">
                  <span className="mi-pill">Scan resume for coverage & missing signals.</span>
                  <span className="mi-pill">Add target job description and run intelligence.</span>
                  <span className="mi-pill">Export LinkedIn headline and "About" copy.</span>
                  <span className="mi-pill">Use generated cover letter for outreach.</span>
                </div>
              </div>

              <div className="mi-bento-card col-span-3">
                <div className="mi-card-header">
                  <div className="stat-icon purple">
                    <Sparkles size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Guided Resume Builder</h3>
                    <p>Pick fresher or experienced and fill simple fields; we assemble the resume text.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <p className="dim" style={{ margin: 0 }}>Profile type</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="mi-btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        background: builderMode === 'fresher' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                        borderColor: builderMode === 'fresher' ? 'rgba(129, 140, 248, 0.7)' : 'rgba(148, 163, 184, 0.4)'
                      }}
                      onClick={() => setBuilderMode('fresher')}
                    >
                      Beginner / Fresher
                    </button>
                    <button
                      type="button"
                      className="mi-btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        background: builderMode === 'experienced' ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                        borderColor: builderMode === 'experienced' ? 'rgba(52, 211, 153, 0.7)' : 'rgba(148, 163, 184, 0.4)'
                      }}
                      onClick={() => setBuilderMode('experienced')}
                    >
                      1+ year experience
                    </button>
                  </div>
                </div>

                <div className="mi-form-grid">
                  <div className="mi-input-wrap col-span-3">
                    <label>Summary</label>
                    <textarea
                      className="mi-textarea"
                      value={builderForm.summary}
                      onChange={(event) => setBuilderForm((prev) => ({ ...prev, summary: event.target.value }))}
                      rows={3}
                      placeholder={
                        builderMode === 'fresher'
                          ? 'Eg: Final-year B.Tech student with strong fundamentals in JavaScript and React, looking for frontend internships or entry-level roles.'
                          : 'Short 2–3 line intro about your experience, domain, and what you want next.'
                      }
                    />
                  </div>

                  <div className="mi-input-wrap col-span-3">
                    <label>Skills (comma separated)</label>
                    <textarea
                      className="mi-textarea"
                      value={builderForm.skills}
                      onChange={(event) => setBuilderForm((prev) => ({ ...prev, skills: event.target.value }))}
                      rows={2}
                      placeholder="React, TypeScript, Node.js, REST APIs, SQL, AWS, ..."
                    />
                  </div>

                  <div className="mi-input-wrap col-span-3">
                    <label>Experience Highlights</label>
                    <textarea
                      className="mi-textarea"
                      value={builderForm.experience}
                      onChange={(event) => setBuilderForm((prev) => ({ ...prev, experience: event.target.value }))}
                      rows={4}
                      placeholder={
                        builderMode === 'fresher'
                          ? '- Frontend Intern · Company · Jun–Aug 2025 — built feature X in React, fixed Y bugs.\n- Campus ambassador / part-time work ...'
                          : '- Senior Developer · Company · 2021–Now — shipped X, improved Y by Z%\n- Previous role ...'
                      }
                    />
                  </div>

                  <div className="mi-input-wrap col-span-3">
                    <label>Projects</label>
                    <textarea
                      className="mi-textarea"
                      value={builderForm.projects}
                      onChange={(event) => setBuilderForm((prev) => ({ ...prev, projects: event.target.value }))}
                      rows={3}
                      placeholder={
                        builderMode === 'fresher'
                          ? '- Portfolio website — React, Tailwind; deployed on Vercel, 500+ visits.\n- College mini-project — what you built and what you learned.'
                          : '- Project name — tech stack, what you built, and numbers if you have them.'
                      }
                    />
                  </div>

                  <div className="mi-input-wrap col-span-3">
                    <label>Education & Certifications</label>
                    <textarea
                      className="mi-textarea"
                      value={builderForm.education}
                      onChange={(event) => setBuilderForm((prev) => ({ ...prev, education: event.target.value }))}
                      rows={2}
                      placeholder={
                        builderMode === 'fresher'
                          ? 'B.Tech in CSE — College Name, 2026 (expected). CGPA / key coursework if helpful.'
                          : 'B.Tech in CSE — University, 2023. AWS Certified Cloud Practitioner, 2024.'
                      }
                    />
                  </div>

                  <div className="mi-input-wrap col-span-3">
                    <label>Achievements</label>
                    <textarea
                      className="mi-textarea"
                      value={builderForm.achievements}
                      onChange={(event) => setBuilderForm((prev) => ({ ...prev, achievements: event.target.value }))}
                      rows={3}
                      placeholder={
                        builderMode === 'fresher'
                          ? 'Hackathons, coding contests, student clubs, positions of responsibility, scholarships, etc.'
                          : 'Promotions, awards, hackathon wins, open source, speaking, etc.'
                      }
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="mi-btn" type="button" onClick={handleGenerateResumeFromBuilder}>
                    <Sparkles size={14} />
                    <span>Generate resume draft</span>
                  </button>
                </div>
              </div>

              <div className="mi-bento-card col-span-3">
                <div className="mi-card-header">
                  <div className="stat-icon blue">
                    <FileText size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>ATS-Friendly Resume Blueprint</h3>
                    <p>Create an ATS-aligned resume/CV structure you can copy out.</p>
                  </div>
                </div>
                {atsResumeBlueprint ? (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="mi-btn" type="button" onClick={handleCopyAtsBlueprint}>
                        <Clipboard size={14} />
                        <span>Copy outline</span>
                      </button>
                      <button className="mi-btn" type="button" onClick={handleCreateAtsDraft}>
                        <Sparkles size={14} />
                        <span>Create editable resume</span>
                      </button>
                      <button className="mi-btn" type="button" onClick={handleDownloadAtsBlueprint}>
                        <Download size={14} />
                        <span>Download .txt</span>
                      </button>
                    </div>

                    <textarea
                      className="mi-textarea"
                      value={atsResumeBlueprint}
                      readOnly
                      rows={14}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </>
                ) : (
                  <div>
                    <p className="dim">
                      Run a resume scan and Resume Intelligence to generate an ATS-ready outline, or start from a blank ATS template.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="mi-btn" type="button" onClick={handleCreateAtsDraft}>
                        <Sparkles size={14} />
                        <span>Start blank ATS template</span>
                      </button>
                    </div>
                  </div>
                )}

                {atsDraft && (
                  <div style={{ marginTop: '16px' }}>
                    <div className="mi-card-header" style={{ paddingLeft: 0, paddingRight: 0, marginBottom: '8px' }}>
                      <div className="stat-icon purple">
                        <FileText size={16} />
                      </div>
                      <div className="mi-card-title-group">
                        <h3>Editable Resume Draft</h3>
                        <p>Tweak the outline into a ready-to-send resume.</p>
                      </div>
                    </div>

                    <textarea
                      className="mi-textarea"
                      value={atsDraft}
                      onChange={(event) => setAtsDraft(event.target.value)}
                      rows={16}
                      style={{ width: '100%', resize: 'vertical' }}
                    />

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="mi-btn" type="button" onClick={handleCopyAtsDraft}>
                        <Clipboard size={14} />
                        <span>Copy resume</span>
                      </button>
                      <button className="mi-btn" type="button" onClick={handleDownloadAtsDraft}>
                        <Download size={14} />
                        <span>Download resume .txt</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeWorkspace === 'analytics' && (
            <div className="mi-bento-grid">
              <div className="mi-bento-card col-span-1">
                <div className="mi-card-header">
                  <div className="stat-icon blue">
                    <BarChart3 size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Session Metrics</h3>
                    <p>High-level view across all interviews.</p>
                  </div>
                </div>
                <div className="mi-stat-block">
                  <p className="mi-stat-label">Total Sessions</p>
                  <p className="mi-stat-value">{analytics?.totalSessions ?? 0}</p>
                  <p className="mi-stat-label" style={{ marginTop: '12px' }}>Completed</p>
                  <p className="mi-stat-value">{analytics?.completedSessions ?? 0}</p>
                </div>
              </div>

              <div className="mi-bento-card col-span-1">
                <div className="mi-card-header">
                  <div className="stat-icon green">
                    <Trophy size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Score Quality</h3>
                    <p>How strong your average performance is.</p>
                  </div>
                </div>
                <div className="mi-stat-block">
                  <p className="mi-stat-label">Average Score</p>
                  <p className="mi-stat-value">{analytics?.averageScoreAcrossSessions ?? 0}</p>
                </div>
              </div>

              <div className="mi-bento-card col-span-1">
                <div className="mi-card-header">
                  <div className="stat-icon purple">
                    <Bot size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Active Sessions</h3>
                    <p>Live sessions running with orchestration.</p>
                  </div>
                </div>
                <div className="mi-stat-block">
                  <p className="mi-stat-label">Active</p>
                  <p className="mi-stat-value">{analytics?.activeSessions ?? 0}</p>
                </div>
              </div>

              {result && (
                <div className="mi-bento-card col-span-2">
                  <div className="mi-card-header">
                    <div className="stat-icon blue">
                      <Activity size={18} />
                    </div>
                    <div className="mi-card-title-group">
                      <h3>Latest Interview Debrief</h3>
                      <p>Evidence-backed breakdown for your most recent session.</p>
                    </div>
                  </div>
                  <div className="mi-form-grid">
                    <div className="stat-card">
                      <div className="stat-val">{breakdown.technicalAccuracy}</div>
                      <div className="stat-lbl">Technical</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-val">{breakdown.communication}</div>
                      <div className="stat-lbl">Communication</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-val">{breakdown.problemSolving}</div>
                      <div className="stat-lbl">Problem Solving</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-val">{breakdown.impactOrientation}</div>
                      <div className="stat-lbl">Impact Orientation</div>
                    </div>
                    {result.llmSummary && (
                      <div className="mi-input-wrap col-span-3" style={{ marginTop: '12px' }}>
                        <label>Coaching Summary</label>
                        <p className="dim" style={{ whiteSpace: 'pre-line' }}>{result.llmSummary}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mi-bento-card col-span-3">
                <div className="mi-card-header">
                  <div className="stat-icon blue">
                    <FileText size={18} />
                  </div>
                  <div className="mi-card-title-group">
                    <h3>Session History</h3>
                    <p>Systematic log of all interview runs.</p>
                  </div>
                </div>

                <div className="hist-filters" style={{ marginBottom: '12px' }}>
                  <input
                    className="mi-input"
                    value={historyNameFilter}
                    onChange={(event) => setHistoryNameFilter(event.target.value)}
                    placeholder="Filter candidate"
                  />
                  <select
                    className="mi-select"
                    value={historyStatusFilter}
                    onChange={(event) => setHistoryStatusFilter(event.target.value as HistoryStatus)}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <table className="mi-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Answered</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionHistory.map((item) => (
                      <tr key={item.sessionId}>
                        <td>{item.candidateName}</td>
                        <td>{item.role} / {item.level}</td>
                        <td>
                          <span className={toStatusBadge(item.status)}>{item.status}</span>
                        </td>
                        <td>
                          {item.answeredQuestions}/{item.totalQuestions}
                        </td>
                        <td>{item.averageScore}</td>
                        <td>
                          <button className="mi-btn" type="button" onClick={() => handleLoadSession(item.sessionId)}>
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sessionHistory.length === 0 && <p className="hist-empty">No sessions found for current filters.</p>}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
