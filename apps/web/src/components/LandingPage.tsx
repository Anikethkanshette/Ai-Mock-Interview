interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingPage(props: LandingPageProps) {
  return (
    <div className="landing-shell">
      <div className="ambient ambient-top" />
      <div className="ambient ambient-bottom" />

      <header className="landing-topbar">
        <div className="brand-mark">AI Mock Interview</div>
        <div className="landing-actions">
          <button className="btn btn-ghost" onClick={props.onLogin}>
            Login
          </button>
          <button className="btn btn-primary" onClick={props.onRegister}>
            Get Started
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-copy">
          <p className="eyebrow">Professional Interview Intelligence</p>
          <h1 className="landing-title">Build interview confidence with a premium AI interviewer experience.</h1>
          <p className="landing-subtitle">
            Practice real engineering interviews with adaptive questioning, voice conversation, and performance insights
            designed for top-tier software roles.
          </p>
          <div className="landing-cta">
            <button className="btn btn-primary" onClick={props.onRegister}>
              Create Free Account
            </button>
            <button className="btn btn-ghost" onClick={props.onLogin}>
              I Already Have an Account
            </button>
          </div>
          <div className="stat-strip">
            <article className="stat-chip">
              <strong>Role-Based</strong>
              <span>Questions tuned to engineering tracks</span>
            </article>
            <article className="stat-chip">
              <strong>Voice Enabled</strong>
              <span>Speak naturally like a live interview</span>
            </article>
            <article className="stat-chip">
              <strong>Actionable Feedback</strong>
              <span>Rubric scoring with growth directions</span>
            </article>
          </div>
        </section>

        <section className="landing-visual">
          <article className="feature-card">
            <p className="feature-label">AI INTERVIEW FLOW</p>
            <h3>System Design Round</h3>
            <p>
              "Design a low-latency feedback engine for 100k daily interview sessions. Explain architecture, scaling,
              and trade-offs."
            </p>
          </article>
          <article className="feature-card">
            <p className="feature-label">LIVE SCORING</p>
            <h3>Professional Rubric</h3>
            <ul>
              <li>Technical Accuracy</li>
              <li>Communication Clarity</li>
              <li>Problem Solving</li>
              <li>Impact Orientation</li>
            </ul>
          </article>
        </section>
      </main>

      <section className="landing-process">
        <article className="process-card">
          <span>01</span>
          <h3>Upload Resume</h3>
          <p>Import PDF or text resume and let AI extract skill signals, facts, and likely interview direction.</p>
        </article>
        <article className="process-card">
          <span>02</span>
          <h3>Live 1:1 Interview</h3>
          <p>Talk to the interviewer in a conversational flow where each question adapts to your previous answer.</p>
        </article>
        <article className="process-card">
          <span>03</span>
          <h3>Actionable Review</h3>
          <p>Get practical strengths and improvement signals with technical, communication, and impact scoring.</p>
        </article>
      </section>

      <section className="landing-roles">
        <p className="eyebrow">Supported Engineering Tracks</p>
        <div>
          <span>Frontend Engineering</span>
          <span>Backend Engineering</span>
          <span>Fullstack Engineering</span>
          <span>Data Engineering</span>
          <span>DevOps / SRE</span>
        </div>
      </section>

      <section className="landing-final-cta">
        <h2>Ready to simulate your next real interview?</h2>
        <p>Build confidence with an interviewer that remembers context and challenges your decisions like a real panel.</p>
        <button className="btn btn-primary" onClick={props.onRegister}>
          Start Interview Practice
        </button>
      </section>
    </div>
  );
}
