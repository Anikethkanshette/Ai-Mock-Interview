import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { logoutUser } from '../services/auth';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { UserProfile } from '../types/auth';
import type {
  AnalyticsOverview,
  CompanyInterviewIntelligence,
  InterviewLevel,
  InterviewQuestion,
  InterviewResult,
  InterviewRole,
  InterviewSession,
  ResumeScanResult,
  SessionSummary
} from '../types/interview';

const ROLE_OPTIONS: InterviewRole[] = ['frontend', 'backend', 'fullstack', 'data', 'devops'];
const LEVEL_OPTIONS: InterviewLevel[] = ['junior', 'mid', 'senior'];

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
  const [historyNameFilter, setHistoryNameFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'active' | 'completed' | 'terminated'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningResume, setIsScanningResume] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Configure your profile and launch interview mode.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appendTranscript = useCallback((transcript: string) => {
    setAnswerDraft(transcript);
  }, []);

  const voice = useVoiceInput(appendTranscript);

  const answeredCount = useMemo(() => session?.turns.filter((turn) => Boolean(turn.answer)).length ?? 0, [session]);

  const totalCount = session?.turns.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  async function refreshInsights() {
    const [sessionsPayload, analyticsPayload] = await Promise.all([
      listSessions({
        candidateName: historyNameFilter || undefined,
        status: historyStatusFilter === 'all' ? undefined : historyStatusFilter
      }),
      getAnalyticsOverview()
    ]);
    setSessionHistory(sessionsPayload.sessions.slice(0, 8));
    setAnalytics(analyticsPayload);
  }

  useEffect(() => {
    refreshInsights();
  }, [historyNameFilter, historyStatusFilter]);

  async function syncCurrentSession(sessionId: string) {
    const latestSession = await getInterviewSession(sessionId);
    setSession(latestSession);

    const pendingTurn = latestSession.turns.find((turn) => !turn.answer);
    setCurrentQuestion(pendingTurn?.question ?? null);

    if (!pendingTurn) {
      const latestResult = await getInterviewResult(sessionId);
      setResult(latestResult);
      setStatusMessage('Interview completed. Deep insights are available in the intelligence panel.');
    }
  }

  async function handleScanResume() {
    if (!resumeFile && !form.resumeText.trim()) {
      setErrorMessage('Upload a resume file or paste resume text before scanning.');
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
        `Resume scanned with ${scanResult.coverage.coveragePercent}% coverage. Suggested track: ${scanResult.recommendedRole} / ${scanResult.recommendedLevel}.`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to scan resume.');
    } finally {
      setIsScanningResume(false);
    }
  }

  async function handlePredictQuestions() {
    if (!form.targetCompany.trim() && !form.interviewerName.trim()) {
      setErrorMessage('Enter company or interviewer to predict likely questions.');
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
      setStatusMessage(
        prediction.interviewerResearch?.verified
          ? 'Predictions generated with verified interviewer evidence.'
          : 'Predictions generated using company/role trends due to limited verified interviewer evidence.'
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to predict questions.');
    } finally {
      setIsPredicting(false);
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
      await syncCurrentSession(response.sessionId);
      await refreshInsights();
      setResumeScanResult(response.resumeAnalysis);
      props.onResumeScanned(response.resumeAnalysis);
      setIntelligencePreview(response.intelligence ?? intelligencePreview);
      setStatusMessage(`Live session started for ${response.role} / ${response.level}.`);
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
      setStatusMessage(`Answer scored ${response.score}/10 · ${response.feedback}`);
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

    setIsSubmitting(true);

    try {
      await terminateInterview(session.sessionId);
      await syncCurrentSession(session.sessionId);
      await refreshInsights();
      setStatusMessage('Session terminated successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to terminate interview.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReadQuestion() {
    if (currentQuestion) {
      voice.speak(currentQuestion.prompt);
    }
  }

  function handleLogout() {
    logoutUser();
    props.onLogout();
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-top" />
      <div className="ambient ambient-bottom" />

      <header className="hero-panel">
        <div>
          <p className="eyebrow">Live 1:1 Interview Room</p>
          <h1>Welcome, {props.user.fullName}</h1>
          <p className="hero-copy">
            Real-time conversational interview where AI remembers your resume and prior answers while adapting each
            next question.
          </p>
        </div>

        <div className="hero-actions">
          <button className="btn btn-ghost" onClick={props.onOpenProfile}>
            My Profile
          </button>
          <button className="btn btn-ghost" onClick={refreshInsights}>
            Refresh Data
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="grid-layout">
        <section className="card start-card">
          <h2>Candidate Setup</h2>
          <p className="subtle">Upload or paste resume, scan it, then start a dedicated interview session.</p>

          <div className="form-grid">
            <label>
              Candidate Name
              <input
                value={form.candidateName}
                onChange={(event) => setForm((prev) => ({ ...prev, candidateName: event.target.value }))}
              />
            </label>

            <label>
              Role
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as InterviewRole }))}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Level
              <select
                value={form.level}
                onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value as InterviewLevel }))}
              >
                {LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              Target Company
              <input
                value={form.targetCompany}
                onChange={(event) => setForm((prev) => ({ ...prev, targetCompany: event.target.value }))}
                placeholder="e.g. Google"
              />
            </label>

            <label>
              Interviewer Name (optional)
              <input
                value={form.interviewerName}
                onChange={(event) => setForm((prev) => ({ ...prev, interviewerName: event.target.value }))}
                placeholder="e.g. Priya S"
              />
            </label>
          </div>

          <label>
            Resume Context
            <textarea
              value={form.resumeText}
              onChange={(event) => setForm((prev) => ({ ...prev, resumeText: event.target.value }))}
              rows={6}
              placeholder="Include projects, stack, outcomes, impact metrics..."
            />
          </label>

          <label>
            Resume File Upload
            <input
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="button-row">
            <button className="btn btn-ghost" onClick={handleScanResume} disabled={isScanningResume}>
              {isScanningResume ? 'Scanning Resume...' : 'Scan Resume'}
            </button>
            <button className="btn btn-ghost" onClick={handlePredictQuestions} disabled={isPredicting}>
              {isPredicting ? 'Predicting...' : 'Predict Company Questions'}
            </button>
            <button className="btn btn-primary" onClick={handleStartInterview} disabled={isLoading}>
              {isLoading ? 'Initializing...' : 'Start Live Interview'}
            </button>
          </div>

          {intelligencePreview && (
            <div className="knowledge-box">
              <p className="subtle">Company/Interviewer Prediction</p>
              {intelligencePreview.interviewerResearch && (
                <p className="subtle">
                  Verification: {intelligencePreview.interviewerResearch.verified ? 'Verified' : 'Limited evidence'} ·
                  Confidence {Math.round(intelligencePreview.interviewerResearch.confidence * 100)}%
                </p>
              )}
              <ul>
                {intelligencePreview.predictedQuestions.slice(0, 3).map((item) => (
                  <li key={item.question.id}>{item.question.prompt}</li>
                ))}
              </ul>
              {intelligencePreview.interviewerResearch?.specialties?.length ? (
                <p className="subtle">
                  Detected specialties: {intelligencePreview.interviewerResearch.specialties.slice(0, 3).join(', ')}
                </p>
              ) : null}
              {intelligencePreview.evidence.length > 0 && (
                <div className="evidence-links">
                  {intelligencePreview.evidence.slice(0, 3).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {session?.knownFacts && session.knownFacts.length > 0 && (
            <div className="knowledge-box">
              <p className="subtle">AI remembered facts</p>
              <ul>
                {session.knownFacts.slice(0, 5).map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          )}

          {resumeScanResult && (
            <div className="knowledge-box">
              <p className="subtle">Resume analysis (evidence-based)</p>
              <ul>
                <li>
                  Resume coverage: {resumeScanResult.coverage.coveragePercent}% ({resumeScanResult.coverage.capturedLines}/
                  {resumeScanResult.coverage.totalLines} lines)
                </li>
                <li>Detected skills: {resumeScanResult.extractedProfile.strongestSkills.slice(0, 6).join(', ') || 'N/A'}</li>
                <li>Quantified achievements: {resumeScanResult.extractedProfile.quantifiedAchievements.length}</li>
              </ul>
              {resumeScanResult.missingSignals.length > 0 && (
                <>
                  <p className="subtle">Missing signals detected from resume content</p>
                  <ul>
                    {resumeScanResult.missingSignals.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {session && (
            <div className="knowledge-box">
              <p className="subtle">Session intelligence</p>
              <ul>
                <li>Turns used: {answeredCount}/{session.maxTurns}</li>
                <li>Known facts captured: {session.knownFacts.length}</li>
                <li>Facts already covered: {session.coveredFacts.length}</li>
              </ul>
            </div>
          )}

          <p className="status">{statusMessage}</p>
          {errorMessage && <p className="error">{errorMessage}</p>}
        </section>

        <section className="card live-card">
          <div className="live-head">
            <h2>Live Conversation</h2>
            <span className="badge">{session?.status ?? 'idle'}</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="subtle">
            Progress {answeredCount}/{totalCount || 0}
          </p>

          <article className="question-box">
            {currentQuestion ? (
              <>
                <div className="question-meta">
                  <span>{currentQuestion.category}</span>
                  <span>Phase: {currentQuestion.phase}</span>
                  <span>Difficulty: {currentQuestion.difficulty}/5</span>
                </div>
                <p>{currentQuestion.prompt}</p>
              </>
            ) : (
              <p>Current question will appear here once the session starts.</p>
            )}
          </article>

          <section className="chat-feed">
            {(session?.conversation ?? []).map((message) => (
              <article
                key={message.id}
                className={`chat-bubble ${message.speaker === 'interviewer' ? 'chat-interviewer' : 'chat-candidate'}`}
              >
                <p className="chat-role">{message.speaker === 'interviewer' ? 'AI Interviewer' : 'You'}</p>
                <p>{message.text}</p>
              </article>
            ))}
            {(session?.conversation?.length ?? 0) === 0 && (
              <p className="subtle">Conversation transcript will appear here in real-time.</p>
            )}
          </section>

          <div className="button-row">
            <button className="btn btn-ghost" onClick={handleReadQuestion} disabled={!currentQuestion}>
              Read Question Aloud
            </button>
            {voice.isSupported ? (
              voice.isListening ? (
                <button className="btn btn-ghost" onClick={voice.stopListening}>
                  Stop Voice Input
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={voice.startListening}>
                  Start Voice Input
                </button>
              )
            ) : (
              <span className="subtle">Voice input unavailable on this browser</span>
            )}
          </div>

          {voice.voiceError && <p className="error">{voice.voiceError}</p>}

          <label>
            Your Answer
            <textarea
              value={answerDraft}
              onChange={(event) => setAnswerDraft(event.target.value)}
              rows={6}
              placeholder="Voice transcript or manual answer appears here..."
              disabled={session?.status !== 'active'}
            />
          </label>

          <div className="button-row">
            <button
              className="btn btn-primary"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answerDraft.trim() || session?.status !== 'active'}
            >
              {isSubmitting ? 'Evaluating...' : 'Submit Answer'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleTerminateInterview}
              disabled={isSubmitting || !session || session.status !== 'active'}
            >
              Terminate Session
            </button>
          </div>
        </section>

        <aside className="card insights-card">
          <h2>Professional Insights</h2>

          <div className="metrics-row">
            <Metric title="Total Sessions" value={analytics?.totalSessions ?? 0} />
            <Metric title="Active" value={analytics?.activeSessions ?? 0} />
            <Metric title="Avg Score" value={analytics?.averageScoreAcrossSessions ?? 0} />
          </div>

          {result ? (
            <div className="result-block">
              <p className="big-score">{result.averageScore}</p>
              <p className="subtle">Average Interview Score</p>
              <h3>Strengths</h3>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>Improve</h3>
              <ul>
                {result.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <h3>Observed Lacking (No Fake Inference)</h3>
              <ul>
                {result.observedLacking.map((item) => (
                  <li key={`${item.area}-${item.evidence}`}>
                    <strong>{item.area}</strong>: {item.evidence}
                  </li>
                ))}
              </ul>

              <h3>Improvement Plan</h3>
              <ul>
                {result.improvementPlan.map((item) => (
                  <li key={`${item.area}-${item.recommendation}`}>
                    <strong>{item.priority.toUpperCase()}</strong>: {item.recommendation}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="subtle">Complete a full session to unlock improvement analysis.</p>
          )}

          <h3>Recent Sessions</h3>
          <div className="history-controls">
            <input
              value={historyNameFilter}
              onChange={(event) => setHistoryNameFilter(event.target.value)}
              placeholder="Search candidate name"
            />
            <select
              value={historyStatusFilter}
              onChange={(event) =>
                setHistoryStatusFilter(event.target.value as 'all' | 'active' | 'completed' | 'terminated')
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div className="history-list">
            {sessionHistory.map((item) => (
              <article key={item.sessionId} className="history-item">
                <p>
                  <strong>{item.candidateName}</strong>
                </p>
                <p>
                  {item.role} · {item.level} · {item.status}
                </p>
                <p>Score: {item.averageScore}</p>
              </article>
            ))}
            {sessionHistory.length === 0 && <p className="subtle">No sessions yet.</p>}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Metric(props: { title: string; value: number }) {
  return (
    <article className="metric-card">
      <p>{props.title}</p>
      <strong>{props.value}</strong>
    </article>
  );
}
