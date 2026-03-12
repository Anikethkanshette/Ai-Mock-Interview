import { useMemo, useState } from 'react';
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
      const updated = updateCurrentUserProfile({
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
    <div className="app-shell">
      <div className="ambient ambient-top" />
      <div className="ambient ambient-bottom" />

      <header className="hero-panel">
        <div>
          <p className="eyebrow">Candidate Profile</p>
          <h1>{props.user.fullName}</h1>
          <p className="hero-copy">Keep your profile accurate so interview coaching reflects your real background.</p>
        </div>

        <div className="hero-actions">
          <button className="btn btn-ghost" onClick={props.onBackToDashboard}>
            Back to Dashboard
          </button>
          <button className="btn btn-danger" onClick={props.onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="profile-layout">
        <section className="card">
          <h2>Professional Profile</h2>
          <p className="subtle">Profile completeness: {completeness}%</p>

          <form onSubmit={handleSave}>
            <label>
              Full Name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>

            <label>
              Headline
              <input
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Senior Backend Engineer"
              />
            </label>

            <div className="form-grid profile-grid">
              <label>
                Target Role
                <input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Fullstack" />
              </label>

              <label>
                Years of Experience
                <input
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(event) => setYearsExperience(event.target.value)}
                  placeholder="5"
                />
              </label>
            </div>

            <label>
              Primary Skills (comma-separated)
              <input
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                placeholder="React, Node.js, AWS"
              />
            </label>

            <label>
              Bio
              <textarea
                rows={5}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Write a concise summary of your experience, strengths, and impact."
              />
            </label>

            {statusMessage && <p className="status">{statusMessage}</p>}
            {errorMessage && <p className="error">{errorMessage}</p>}

            <button className="btn btn-primary" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Resume Reality Check</h2>
          {props.latestResumeScan ? (
            <>
              <p className="subtle">
                Coverage: {props.latestResumeScan.coverage.coveragePercent}% ({props.latestResumeScan.coverage.capturedLines}/
                {props.latestResumeScan.coverage.totalLines} lines parsed)
              </p>
              <ul>
                <li>Recommended track: {props.latestResumeScan.recommendedRole} / {props.latestResumeScan.recommendedLevel}</li>
                <li>Strongest skills: {props.latestResumeScan.extractedProfile.strongestSkills.slice(0, 5).join(', ') || 'N/A'}</li>
                <li>
                  Quantified achievements detected: {props.latestResumeScan.extractedProfile.quantifiedAchievements.length}
                </li>
              </ul>

              {props.latestResumeScan.missingSignals.length > 0 && (
                <>
                  <h3>Missing Signals</h3>
                  <ul>
                    {props.latestResumeScan.missingSignals.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="subtle">Scan a resume from dashboard to see profile-backed validation here.</p>
          )}
        </section>
      </main>
    </div>
  );
}
