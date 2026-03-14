import { useMemo, useState } from 'react';
import { LayoutDashboard, UserCircle, LogOut, FileText, Activity, Target } from 'lucide-react';
import { updateCurrentUserProfile } from '../services/auth';
import type { UserProfile } from '../types/auth';
import type { ResumeScanResult } from '../types/interview';

interface ProfilePageProps {
  user: UserProfile;
  latestResumeScan: ResumeScanResult | null;
  onBackToDashboard: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onLogout: () => void;
}

export function ProfilePage(props: ProfilePageProps) {
  const [fullName, setFullName] = useState(props.user.fullName);
  const [headline, setHeadline] = useState(props.user.headline ?? '');
  const [targetRole, setTargetRole] = useState(props.user.targetRole ?? '');
  const [yearsExperience, setYearsExperience] = useState(
    typeof props.user.yearsExperience === 'number' ? String(props.user.yearsExperience) : ''
  );
  const [bio, setBio] = useState(props.user.bio ?? '');
  const [skillsText, setSkillsText] = useState((props.user.primarySkills ?? []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const completeness = useMemo(() => {
    const checks = [
      fullName.trim().length > 1,
      headline.trim().length > 2,
      targetRole.trim().length > 1,
      bio.trim().length > 15,
      skillsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean).length >= 3
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [fullName, headline, targetRole, bio, skillsText]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);

    try {
      const updated = await updateCurrentUserProfile({
        fullName,
        headline,
        targetRole,
        yearsExperience: yearsExperience.trim() ? Number(yearsExperience) : undefined,
        bio,
        primarySkills: skillsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      });

      props.onUserUpdated(updated);
      setStatusMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mi-dashboard-root">
      <aside className="mi-sidebar">
        <div className="mi-sidebar-brand">
          <div className="mi-brand-icon">
            <LayoutDashboard size={18} />
          </div>
          <div className="mi-brand-text">agentic interviewer</div>
        </div>
        <div className="mi-sidebar-nav">
          <p className="mi-nav-group-title">Account</p>
          <button className="mi-nav-btn" type="button" onClick={props.onBackToDashboard}>
            <UserCircle size={16} />
            <span>Back to Dashboard</span>
          </button>
          <button className="mi-nav-btn" type="button" onClick={props.onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
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
        </div>
      </aside>

      <div className="mi-main-canvas">
        <header className="mi-top-header">
          <div className="mi-header-breadcrumbs">
            <span className="mi-crumb">Account</span>
            <span className="mi-crumb">/</span>
            <span className="mi-crumb active">Profile Studio</span>
          </div>
          <div className="mi-status-badge">
            <span className="pulse-dot" />
            <span>Profile completeness {completeness}%</span>
          </div>
        </header>

        <main className="mi-content-area">
          <div className="mi-bento-grid">
            <div className="mi-bento-card col-span-2">
              <div className="mi-card-header">
                <div className="stat-icon blue">
                  <UserCircle size={18} />
                </div>
                <div className="mi-card-title-group">
                  <h3>Candidate Metadata</h3>
                  <p>Keep your profile aligned with how the interview and resume engines see you.</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="mi-form-grid">
                <div className="mi-input-wrap col-span-3">
                  <label>Full Name</label>
                  <input className="mi-input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>

                <div className="mi-input-wrap col-span-3">
                  <label>Headline</label>
                  <input
                    className="mi-input"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder="Senior Backend Engineer"
                  />
                </div>

                <div className="mi-input-wrap">
                  <label>Target Role</label>
                  <input
                    className="mi-input"
                    value={targetRole}
                    onChange={(event) => setTargetRole(event.target.value)}
                    placeholder="Fullstack"
                  />
                </div>

                <div className="mi-input-wrap">
                  <label>Years of Experience</label>
                  <input
                    className="mi-input"
                    type="number"
                    min={0}
                    value={yearsExperience}
                    onChange={(event) => setYearsExperience(event.target.value)}
                    placeholder="5"
                  />
                </div>

                <div className="mi-input-wrap col-span-3">
                  <label>Primary Skills (comma-separated)</label>
                  <input
                    className="mi-input"
                    value={skillsText}
                    onChange={(event) => setSkillsText(event.target.value)}
                    placeholder="React, Node.js, AWS"
                  />
                </div>

                <div className="mi-input-wrap col-span-3">
                  <label>Bio</label>
                  <textarea
                    className="mi-textarea"
                    rows={5}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="Write a concise summary of your experience, strengths, and impact."
                  />
                </div>

                <div className="mi-input-wrap col-span-3">
                  {statusMessage && <p className="status">{statusMessage}</p>}
                  {errorMessage && <p className="error">{errorMessage}</p>}
                  <button className="mi-btn primary" disabled={isSaving} type="submit">
                    {isSaving ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>

            <div className="mi-bento-card col-span-1">
              <div className="mi-card-header">
                <div className="stat-icon green">
                  <FileText size={18} />
                </div>
                <div className="mi-card-title-group">
                  <h3>Resume Intelligence Readiness</h3>
                  <p>Quick view of your latest scan and missing signals.</p>
                </div>
              </div>

              {props.latestResumeScan ? (
                <>
                  <p className="card-sub">
                    Coverage: {props.latestResumeScan.coverage.coveragePercent}% ({props.latestResumeScan.coverage.capturedLines}/
                    {props.latestResumeScan.coverage.totalLines} lines parsed)
                  </p>
                  <div className="info-list">
                    <p className="info-list-item">Recommended track: {props.latestResumeScan.recommendedRole} / {props.latestResumeScan.recommendedLevel}</p>
                    <p className="info-list-item">Strongest skills: {props.latestResumeScan.extractedProfile.strongestSkills.slice(0, 5).join(', ') || 'N/A'}</p>
                    <p className="info-list-item">Quantified achievements: {props.latestResumeScan.extractedProfile.quantifiedAchievements.length}</p>
                    <p className="info-list-item">Highlights extracted: {props.latestResumeScan.highlights.length}</p>
                    <p className="info-list-item">Facts extracted: {props.latestResumeScan.facts.length}</p>
                  </div>

                  {props.latestResumeScan.missingSignals.length > 0 && (
                    <div style={{ marginTop: '0.7rem' }}>
                      <p className="info-box-title">Missing Signals</p>
                      <div className="info-list" style={{ marginTop: '.25rem' }}>
                        {props.latestResumeScan.missingSignals.map((item) => (
                          <p className="info-list-item" key={item}>{item}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="dim">Scan a resume from the dashboard to see profile-backed validation here.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
