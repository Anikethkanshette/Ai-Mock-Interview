  function handleLogout() {
    props.onLogout();
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
      ? 'Run the full real-time interview loop with adaptive questioning and scoring.'
      : activeWorkspace === 'resume-lab'
        ? 'Tune resume impact, ATS readiness, and job targeting before interview rounds.'
        : 'Track outcomes, drill into history, and review performance trends.';

  return (
    <div className={`ds-root ds-theme-${dashboardTheme}`}>
      <aside className={`ds-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="ds-logo">
          <span className="ds-logo-dot" />
          agentic intervier
        </div>

        <button
          className={`ds-nav-item ${activeWorkspace === 'studio' ? 'active' : ''}`}
          onClick={() => {
            setActiveWorkspace('studio');
            setSidebarOpen(false);
          }}
        >
          <span className="ds-nav-icon">🎯</span>
          Interview Studio
        </button>

        <button
          className={`ds-nav-item ${activeWorkspace === 'resume-lab' ? 'active' : ''}`}
          onClick={() => {
            setActiveWorkspace('resume-lab');
            setSidebarOpen(false);
          }}
        >
          <span className="ds-nav-icon">🧠</span>
          Resume Lab
        </button>

        <button
          className={`ds-nav-item ${activeWorkspace === 'analytics' ? 'active' : ''}`}
          onClick={() => {
            setActiveWorkspace('analytics');
            setSidebarOpen(false);
          }}
        >
          <span className="ds-nav-icon">📊</span>
          Analytics Hub
        </button>

        <button
          className="ds-nav-item"
          onClick={() => {
            setSidebarOpen(false);
            props.onOpenProfile();
          }}
        >
          <span className="ds-nav-icon">👤</span>
          Profile
        </button>

        <button
          className="ds-nav-item"
          onClick={async () => {
            setSidebarOpen(false);
            await refreshInsights();
          }}
        >
          <span className="ds-nav-icon">🔄</span>
          Refresh
        </button>

        <div className="ds-sidebar-bottom">
          <div className="ds-user-row">
            <div className="ds-avatar">{props.user.fullName.slice(0, 1).toUpperCase()}</div>
            <div>
              <p className="ds-user-name">{props.user.fullName}</p>
              <p className="ds-user-sub">{props.user.email}</p>
            </div>
          </div>
          <button
            className="ds-nav-item"
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
          >
            <span className="ds-nav-icon">↪</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="ds-body">
        <header className="ds-topbar">
          <div className="ds-topbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen((prev) => !prev)} type="button">
              ☰
            </button>
            <h2>agentic intervier · {workspaceTitle}</h2>
            <p>{workspaceSubtitle}</p>
            <p className="ds-topbar-note">{statusMessage}</p>
          </div>
          <div className="ds-topbar-right">
            <div className="theme-picker" role="group" aria-label="Dashboard style variation">
              <button
                className={`theme-chip ${dashboardTheme === 'aurora' ? 'active' : ''}`}
                onClick={() => setDashboardTheme('aurora')}
                type="button"
              >
                Aurora
              </button>
              <button
                className={`theme-chip ${dashboardTheme === 'neon' ? 'active' : ''}`}
                onClick={() => setDashboardTheme('neon')}
                type="button"
              >
                Neon
              </button>
              <button
                className={`theme-chip ${dashboardTheme === 'glass' ? 'active' : ''}`}
                onClick={() => setDashboardTheme('glass')}
                type="button"
              >
                Glass
              </button>
            </div>
            <span className={toStatusBadge(session?.status ?? 'all')}>
              {session?.status ?? 'idle'}
            </span>
            {session && (
              <span className="badge badge-intro">
                {answeredCount}/{session.maxTurns} turns
              </span>
            )}
          </div>
        </header>

        <main className="ds-content">
          {(activeWorkspace === 'studio' || activeWorkspace === 'resume-lab') && (
          <section className="setup-grid reveal stair-1">
            <div className="setup-form-card reveal stair-2">
              <h2>Session Setup</h2>
              <p className="card-sub">Align your payload with backend contracts before starting live interview mode.</p>

              <p className="setup-section-title">Candidate Context</p>
              <div className="field-row">
                <div>
                  <label>Candidate Name</label>
                  <input
                    value={form.candidateName}
                    onChange={(event) => setForm((prev) => ({ ...prev, candidateName: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Target Company</label>
                  <input
                    value={form.targetCompany}
                    onChange={(event) => setForm((prev) => ({ ...prev, targetCompany: event.target.value }))}
                    placeholder="Google, Amazon, Microsoft..."
                  />
                </div>
              </div>

              <div className="field-row">
                <div>
                  <label>Role</label>
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
                </div>
                <div>
                  <label>Level</label>
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
                </div>
              </div>

              <div className="field">
                <label>Interviewer Name</label>
                <input
                  value={form.interviewerName}
                  onChange={(event) => setForm((prev) => ({ ...prev, interviewerName: event.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <p className="setup-section-title">Resume Input</p>
              <div className="field">
                <label>Resume Context</label>
                <textarea
                  value={form.resumeText}
                  onChange={(event) => setForm((prev) => ({ ...prev, resumeText: event.target.value }))}
                  rows={7}
                  placeholder="Paste resume text including projects, stack, impact and outcomes."
                />
              </div>

              <div className="field">
                <label>Resume File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.doc,.docx"
                  onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                />
              </div>

              <div className="scan-actions">
                <button className="btn btn-ghost" onClick={handleScanResume} disabled={isScanningResume}>
                  {isScanningResume ? 'Scanning...' : 'Scan Resume'}
                </button>
                <button className="btn btn-ghost" onClick={handlePredictQuestions} disabled={isPredicting}>
                  {isPredicting ? 'Predicting...' : 'Predict Questions'}
                </button>
                <button className="btn btn-ghost" onClick={handleRunResumeIntelligence} disabled={isGeneratingIntelligence}>
                  {isGeneratingIntelligence ? 'Analyzing...' : 'Run Resume Intelligence'}
                </button>
                <button className="btn btn-primary" onClick={handleStartInterview} disabled={isLoading}>
                  {isLoading ? 'Starting...' : 'Start Interview'}
                </button>
              </div>

              <p className="setup-section-title">Resume Intelligence Studio</p>
              <div className="field">
                <label>Target Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={5}
                  placeholder="Paste the job description to compute resume score, ATS compatibility, and match suggestions."
                />
              </div>

              {resumeIntelligenceReport && (
                <div className="info-box" style={{ marginTop: '.45rem' }}>
                  <div className="info-box-header">
                    <p className="info-box-title">Resume Score</p>
                    <span className="badge badge-technical">{resumeIntelligenceReport.scoreReport.score}/10</span>
                  </div>
                  <div className="info-list">
                    <p className="info-list-item">
                      Keyword Alignment: {resumeIntelligenceReport.scoreReport.breakdown.keywordAlignment}/10
                    </p>
                    <p className="info-list-item">
                      Experience Match: {resumeIntelligenceReport.scoreReport.breakdown.experienceMatch}/10
                    </p>
                    <p className="info-list-item">
                      Impact Evidence: {resumeIntelligenceReport.scoreReport.breakdown.impactEvidence}/10
                    </p>
                    <p className="info-list-item">
                      Structure Quality: {resumeIntelligenceReport.scoreReport.breakdown.structureQuality}/10
                    </p>
                  </div>

                  <div style={{ marginTop: '.55rem' }}>
                    <p className="info-box-title">ATS Compatibility</p>
                    <p className="dim" style={{ marginTop: '.2rem' }}>
                      Score: {resumeIntelligenceReport.atsReport.passScore}/100 ·
                      {resumeIntelligenceReport.atsReport.passLikely ? ' Likely pass' : ' Risk of rejection'}
                    </p>
                    <div className="info-list" style={{ marginTop: '.35rem' }}>
                      {resumeIntelligenceReport.atsReport.issues.slice(0, 3).map((issue, index) => (
                        <p className="info-list-item" key={index}>
                          {issue.severity.toUpperCase()}: {issue.message} — {issue.suggestion}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '.65rem' }}>
                    <p className="info-box-title">Job Match Suggestions</p>
                    <div className="info-list" style={{ marginTop: '.25rem' }}>
                      {resumeIntelligenceReport.jobMatches.slice(0, 3).map((match) => (
                        <p className="info-list-item" key={match.title}>
                          {match.title} ({match.companyType}) · Match {match.matchScore}% · Missing {match.missingSkills.join(', ') || 'none'}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '.65rem' }}>
                    <p className="info-box-title">Improvement Tips</p>
                    <div className="info-list" style={{ marginTop: '.25rem' }}>
                      {resumeIntelligenceReport.improvementTips.slice(0, 4).map((tip) => (
                        <p className="info-list-item" key={`${tip.title}-${tip.priority}`}>
                          {tip.priority.toUpperCase()}: {tip.title} — {tip.action}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '.65rem' }}>
                    <p className="info-box-title">Premium: LinkedIn Optimization</p>
                    <div className="info-list" style={{ marginTop: '.25rem' }}>
                      <p className="info-list-item">Headline: {resumeIntelligenceReport.linkedinOptimization.headline}</p>
                      <p className="info-list-item">About: {resumeIntelligenceReport.linkedinOptimization.about}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '.65rem' }}>
                    <p className="info-box-title">Premium: Cover Letter Generator</p>
                    <div className="info-list" style={{ marginTop: '.25rem' }}>
                      <p className="info-list-item">{resumeIntelligenceReport.coverLetterDraft.greeting}</p>
                      <p className="info-list-item">{resumeIntelligenceReport.coverLetterDraft.opening}</p>
                      {resumeIntelligenceReport.coverLetterDraft.body.slice(0, 2).map((paragraph, index) => (
                        <p className="info-list-item" key={index}>{paragraph}</p>
                      ))}
                      <p className="info-list-item">{resumeIntelligenceReport.coverLetterDraft.closing}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '.65rem' }}>
                    <p className="info-box-title">Premium: Advanced Insights</p>
                    <div className="info-list" style={{ marginTop: '.25rem' }}>
                      <p className="info-list-item">Narrative: {resumeIntelligenceReport.advancedInsights.strongestNarrative}</p>
                      <p className="info-list-item">Readiness: {resumeIntelligenceReport.advancedInsights.roleReadinessSummary}</p>
                      {resumeIntelligenceReport.advancedInsights.priorityActions.slice(0, 3).map((action) => (
                        <p className="info-list-item" key={action}>{action}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && <p className="msg-error">{errorMessage}</p>}
              {!errorMessage && <p className="msg-ok">Ready for backend orchestration flow.</p>}
            </div>

            <div className="setup-sidebar reveal stair-3">
              {resumeScanResult && (
                <div className="resume-coverage-card">
                  <div className="resume-coverage-header">
                    <p className="info-box-title">Resume Coverage</p>
                    <p className="resume-cov-pct">{resumeScanResult.coverage.coveragePercent}%</p>
                  </div>
                  <div className="resume-section-row">
                    <p className="resume-section-label">Experience</p>
                    <div className="resume-section-bar prog-bar">
                      <div className="prog-bar-fill prog-bar-green" style={{ width: `${Math.min(100, resumeScanResult.sections.experience.length * 10)}%` }} />
                    </div>
                    <p className="resume-section-count">{resumeScanResult.sections.experience.length}</p>
                  </div>
                  <div className="resume-section-row">
                    <p className="resume-section-label">Projects</p>
                    <div className="resume-section-bar prog-bar">
                      <div className="prog-bar-fill prog-bar-blue" style={{ width: `${Math.min(100, resumeScanResult.sections.projects.length * 14)}%` }} />
                    </div>
                    <p className="resume-section-count">{resumeScanResult.sections.projects.length}</p>
                  </div>
                  <div className="resume-section-row">
                    <p className="resume-section-label">Skills</p>
                    <div className="resume-section-bar prog-bar">
                      <div className="prog-bar-fill prog-bar-amber" style={{ width: `${Math.min(100, resumeScanResult.sections.skills.length * 12)}%` }} />
                    </div>
                    <p className="resume-section-count">{resumeScanResult.sections.skills.length}</p>
                  </div>
                  {resumeScanResult.missingSignals.length > 0 && (
                    <div className="info-list" style={{ marginTop: '.55rem' }}>
                      {resumeScanResult.missingSignals.slice(0, 4).map((signal) => (
                        <p key={signal} className="info-list-item">
                          Missing: {signal}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {intelligencePreview && (
                <div className="intel-card">
                  <div className="intel-header">
                    <p className="intel-title">Company Intelligence</p>
                    <p className="intel-conf">
                      {Math.round((intelligencePreview.interviewerResearch?.confidence ?? 0.72) * 100)}%
                    </p>
                  </div>
                  {intelligencePreview.predictedQuestions.slice(0, 4).map((item) => (
                    <div key={item.question.id} className="intel-q-item">
                      <span className="intel-q-dot" />
                      <p className="intel-q-text">{item.question.prompt}</p>
                    </div>
                  ))}
                  {intelligencePreview.evidence.length > 0 && (
                    <div className="intel-evidence-links">
                      {intelligencePreview.evidence.slice(0, 3).map((source) => (
                        <a className="intel-evidence-link" key={source.url} href={source.url} target="_blank" rel="noreferrer">
                          {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {session && (
                <div className="info-box">
                  <div className="info-box-header">
                    <p className="info-box-title">Session Memory</p>
                    <span className={toStatusBadge(session.status)}>{session.status}</span>
                  </div>
                  <div className="info-list">
                    <p className="info-list-item">Known facts: {session.knownFacts.length}</p>
                    <p className="info-list-item">Covered facts: {session.coveredFacts.length}</p>
                    <p className="info-list-item">Messages: {session.conversation.length}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
          )}

          {activeWorkspace === 'studio' && (
          <section className="room-layout reveal stair-2" style={{ marginTop: '1.25rem' }}>
            <div className="room-main">
              <div className="q-card reveal stair-3">
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

              <div className="convo-card reveal stair-4">
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

              {session && (
                <div className="turns-card reveal stair-5">
                  <div className="turns-card-header">
                    <p className="info-box-title">Turn Review</p>
                    <span className="badge badge-technical">{answeredCount} answered</span>
                  </div>
                  {session.turns
                    .filter((turn) => Boolean(turn.answer))
                    .slice()
                    .reverse()
                    .map((turn) => (
                      <div className="turn-row" key={turn.question.id + (turn.askedAt ?? '')}>
                        <div className="turn-body">
                          <p className="turn-question">{turn.question.prompt}</p>
                          <p className="turn-answer">{turn.answer}</p>
                          {turn.scoreBreakdown && (
                            <div className="turn-breakdown">
                              <span className="turn-bd-item">Tech {turn.scoreBreakdown.technicalAccuracy}</span>
                              <span className="turn-bd-item">Comm {turn.scoreBreakdown.communication}</span>
                              <span className="turn-bd-item">Problem {turn.scoreBreakdown.problemSolving}</span>
                              <span className="turn-bd-item">Impact {turn.scoreBreakdown.impactOrientation}</span>
                            </div>
                          )}
                        </div>
                        <span className="badge badge-intro">{turn.score ?? '-'}</span>
                      </div>
                    ))}
                  {answeredCount === 0 && <p className="dim" style={{ padding: '1rem' }}>No answered turns yet.</p>}
                </div>
              )}
            </div>

            <div className="room-sidebar reveal stair-4">
              {session && (
                <div className="progress-card reveal stair-5">
                  <div className="progress-card-header">
                    <p className="progress-card-title">Progress</p>
                    <p className="dim">{progressPercent}%</p>
                  </div>
                  <div className="prog-bar">
                    <div className="prog-bar-fill prog-bar-blue" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="progress-stats">
                    <div className="progress-stat">
                      <p className="progress-stat-val">{answeredCount}</p>
                      <p className="progress-stat-label">Answered</p>
                    </div>
                    <div className="progress-stat">
                      <p className="progress-stat-val">{session.maxTurns}</p>
                      <p className="progress-stat-label">Max turns</p>
                    </div>
                  </div>
                </div>
              )}

              {session?.agentState && session.agentState.decisions.length > 0 && (
                <div className="agent-timeline-card reveal stair-6">
                  <div className="agent-timeline-header" onClick={() => setAgentPanelOpen((prev) => !prev)}>
                    <p className="agent-timeline-title">Agent Timeline</p>
                    <p className="agent-timeline-icon">{agentPanelOpen ? '▲' : '▼'}</p>
                  </div>

                  {agentPanelOpen && (
                    <div className="agent-timeline-body">
                      {session.agentState.decisions.slice().reverse().map((decision, index) => (
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
                            {decision.evidence.length > 0 && (
                              <div className="agent-tl-evidence">
                                {decision.evidence.slice(0, 4).map((item) => (
                                  <span className="agent-tl-evid-chip" key={item}>
                                    {item}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
          )}

          {activeWorkspace === 'resume-lab' && (
            <section className="results-grid reveal stair-3" style={{ marginTop: '1.25rem' }}>
              <div className="results-section-card reveal stair-4">
                <h3>Resume Lab Focus</h3>
                <div className="strength-item">
                  <span className="strength-dot green" />
                  <p>Run resume scan first to populate coverage and missing signal diagnostics.</p>
                </div>
                <div className="strength-item">
                  <span className="strength-dot green" />
                  <p>Add target job description to activate score, ATS check, and match recommendation.</p>
                </div>
                <div className="strength-item">
                  <span className="strength-dot green" />
                  <p>Use generated cover letter and LinkedIn narrative to align your external profile.</p>
                </div>
              </div>
              <div className="results-section-card reveal stair-5">
                <h3>Current Lab Status</h3>
                <div className="obs-item">
                  <div className="obs-header">
                    <span className={`obs-priority ${resumeIntelligenceReport ? 'high' : 'medium'}`}>
                      {resumeIntelligenceReport ? 'ready' : 'pending'}
                    </span>
                    <p className="obs-area">Resume Intelligence</p>
                  </div>
                  <p className="obs-rec">
                    {resumeIntelligenceReport
                      ? `Report generated with score ${resumeIntelligenceReport.scoreReport.score}/10 and ATS ${resumeIntelligenceReport.atsReport.passScore}/100.`
                      : 'Run Resume Intelligence after filling resume content and target job description.'}
                  </p>
                </div>
                <div className="obs-item">
                  <div className="obs-header">
                    <span className={`obs-priority ${resumeScanResult ? 'high' : 'medium'}`}>
                      {resumeScanResult ? 'ready' : 'pending'}
                    </span>
                    <p className="obs-area">Resume Coverage Scan</p>
                  </div>
                  <p className="obs-rec">
                    {resumeScanResult
                      ? `${resumeScanResult.coverage.coveragePercent}% coverage with ${resumeScanResult.missingSignals.length} missing signals detected.`
                      : 'Upload a resume file or text and run Scan Resume to populate section-level diagnostics.'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeWorkspace === 'analytics' && result && (
            <section className="reveal stair-3" style={{ marginTop: '1.25rem' }}>
              <div className="results-hero reveal stair-4">
                <div className="results-score-block">
                  <div className="score-ring score-ring-lg" style={{ background: `conic-gradient(var(--blue) ${result.averageScore * 10}%, rgba(255,255,255,.07) 0%)` }}>
                    <p className="score-ring-val">{result.averageScore}</p>
                  </div>
                  <p className="results-score-label">Average Score</p>
                </div>

                <div className="results-summary">
                  <h2>Interview Summary</h2>
                  <p>Evidence-backed report generated from your completed turns and evaluator feedback.</p>
                  <div className="results-meta">
                    <p className="results-meta-item">
                      Answered: <strong>{result.answeredQuestions}</strong>
                    </p>
                    <p className="results-meta-item">
                      Total: <strong>{result.totalQuestions}</strong>
                    </p>
                    <p className="results-meta-item">
                      Status: <strong>{result.completed ? 'Completed' : 'In progress'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="breakdown-card reveal stair-5">
                <div className="breakdown-row">
                  <p className="breakdown-label">Technical Accuracy</p>
                  <div className="breakdown-bar prog-bar">
                    <div className="prog-bar-fill prog-bar-blue" style={{ width: `${breakdown.technicalAccuracy * 10}%` }} />
                  </div>
                  <p className="breakdown-val">{breakdown.technicalAccuracy}</p>
                </div>
                <div className="breakdown-row">
                  <p className="breakdown-label">Communication</p>
                  <div className="breakdown-bar prog-bar">
                    <div className="prog-bar-fill prog-bar-green" style={{ width: `${breakdown.communication * 10}%` }} />
                  </div>
                  <p className="breakdown-val">{breakdown.communication}</p>
                </div>
                <div className="breakdown-row">
                  <p className="breakdown-label">Problem Solving</p>
                  <div className="breakdown-bar prog-bar">
                    <div className="prog-bar-fill prog-bar-amber" style={{ width: `${breakdown.problemSolving * 10}%` }} />
                  </div>
                  <p className="breakdown-val">{breakdown.problemSolving}</p>
                </div>
                <div className="breakdown-row">
                  <p className="breakdown-label">Impact Orientation</p>
                  <div className="breakdown-bar prog-bar">
                    <div className="prog-bar-fill prog-bar-red" style={{ width: `${breakdown.impactOrientation * 10}%` }} />
                  </div>
                  <p className="breakdown-val">{breakdown.impactOrientation}</p>
                </div>
              </div>

              <div className="results-grid">
                <div className="results-section-card reveal stair-5">
                  <h3>Strengths</h3>
                  {result.strengths.map((item) => (
                    <div className="strength-item" key={item}>
                      <span className="strength-dot green" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>

                <div className="results-section-card reveal stair-6">
                  <h3>Improvements</h3>
                  {result.improvements.map((item) => (
                    <div className="strength-item" key={item}>
                      <span className="strength-dot amber" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="results-grid">
                <div className="results-section-card reveal stair-5">
                  <h3>Observed Lacking</h3>
                  {result.observedLacking.map((item) => (
                    <div className="obs-item" key={`${item.area}-${item.evidence}`}>
                      <div className="obs-header">
                        <span className={`obs-priority ${item.priority}`}>{item.priority}</span>
                        <p className="obs-area">{item.area}</p>
                      </div>
                      <p className="obs-evidence">{item.evidence}</p>
                    </div>
                  ))}
                </div>

                <div className="results-section-card reveal stair-6">
                  <h3>Improvement Plan</h3>
                  {result.improvementPlan.map((item) => (
                    <div className="obs-item" key={`${item.area}-${item.recommendation}`}>
                      <div className="obs-header">
                        <span className={`obs-priority ${item.priority}`}>{item.priority}</span>
                        <p className="obs-area">{item.area}</p>
                      </div>
                      <p className="obs-rec">{item.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeWorkspace === 'analytics' && (
          <section className="reveal stair-4" style={{ marginTop: '1.25rem' }}>
            <div className="analytics-stats">
              <div className="analytics-stat reveal stair-5">
                <p className="analytics-stat-val">{analytics?.totalSessions ?? 0}</p>
                <p className="analytics-stat-label">Total Sessions</p>
              </div>
              <div className="analytics-stat reveal stair-6">
                <p className="analytics-stat-val">{analytics?.activeSessions ?? 0}</p>
                <p className="analytics-stat-label">Active Sessions</p>
              </div>
              <div className="analytics-stat reveal stair-5">
                <p className="analytics-stat-val">{analytics?.completedSessions ?? 0}</p>
                <p className="analytics-stat-label">Completed Sessions</p>
              </div>
              <div className="analytics-stat reveal stair-6">
                <p className="analytics-stat-val">{analytics?.averageScoreAcrossSessions ?? 0}</p>
                <p className="analytics-stat-label">Average Score</p>
              </div>
            </div>

            <div className="hist-filters">
              <input
                className="hist-filter-input"
                value={historyNameFilter}
                onChange={(event) => setHistoryNameFilter(event.target.value)}
                placeholder="Filter candidate"
              />
              <select
                value={historyStatusFilter}
                onChange={(event) => setHistoryStatusFilter(event.target.value as HistoryStatus)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div className="hist-table-card reveal stair-6">
              <table className="hist-table">
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
                      <td className="td-name">{item.candidateName}</td>
                      <td>{item.role} / {item.level}</td>
                      <td>
                        <span className={toStatusBadge(item.status)}>{item.status}</span>
                      </td>
                      <td>
                        {item.answeredQuestions}/{item.totalQuestions}
                      </td>
                      <td className={item.averageScore < 5 ? 'td-score td-score-low' : 'td-score'}>{item.averageScore}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleLoadSession(item.sessionId)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sessionHistory.length === 0 && <p className="hist-empty">No sessions found for current filters.</p>}
            </div>
          </section>
          )}
        </main>
      </div>
    </div>
  );
}
