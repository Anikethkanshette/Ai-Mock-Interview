import { useEffect, useState } from 'react';
import { loginUser, registerUser } from '../services/auth';
import type { UserProfile } from '../types/auth';

interface AuthPageProps {
  onAuthenticated: (user: UserProfile) => void;
  initialMode?: AuthMode;
  onBack?: () => void;
}

type AuthMode = 'login' | 'register';

export function AuthPage(props: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(props.initialMode ?? 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (props.initialMode) {
      setMode(props.initialMode);
    }
  }, [props.initialMode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim() || (mode === 'register' && !fullName.trim())) {
      setErrorMessage('Please fill all required fields.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage('Password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user =
        mode === 'login'
          ? await loginUser({ email, password })
          : await registerUser({ fullName, email, password });

      props.onAuthenticated(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-ambient auth-ambient-left" />
      <div className="auth-ambient auth-ambient-right" />

      <div className="auth-grid">
        <section className="auth-brand-panel">
          <p className="eyebrow">AI Mock Interview Platform</p>
          <h1>Interview Like a Top-Tier Engineering Candidate</h1>
          <p>
            Enter a simulation-grade environment with realistic technical questioning, adaptive follow-ups, and
            performance analytics that mirror high-signal interviews.
          </p>

          <div className="brand-badges">
            <span>Role-aware questioning</span>
            <span>Voice-enabled responses</span>
            <span>Rubric-based scoring</span>
          </div>
        </section>

        <section className="auth-form-panel">
          {props.onBack && (
            <button className="btn btn-ghost auth-back" type="button" onClick={props.onBack}>
              ← Back to Home
            </button>
          )}

          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              type="button"
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              type="button"
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label>
                Full Name
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="John Doe" />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="john@company.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>

            {mode === 'register' && (
              <label>
                Confirm Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </label>
            )}

            {errorMessage && <p className="error">{errorMessage}</p>}

            <button className="btn btn-primary full-width" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Processing...' : mode === 'login' ? 'Access Dashboard' : 'Create Account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
