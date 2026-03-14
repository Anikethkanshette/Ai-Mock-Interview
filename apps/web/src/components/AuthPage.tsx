import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/auth';
import type { UserProfile } from '../types/auth';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBack: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

export function AuthPage(props: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(props.initialMode ?? 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user =
        mode === 'login'
          ? await loginUser({ email, password })
          : await registerUser({ fullName, email, password });

      props.onAuthenticated(user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-premium-root">
      <div className="auth-premium-bg">
        <div className="auth-orb auth-orb-blue" />
        <div className="auth-orb auth-orb-purple" />
      </div>

      <motion.button 
        className="auth-back-float"
        onClick={props.onBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft size={18} />
        <span>Return to Home</span>
      </motion.button>

      <div className="auth-premium-container">
        {/* Left Side: Brand Panel */}
        <motion.div 
          className="auth-premium-brand"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-brand-logo">
            <div className="brand-dot-glow"></div>
            Agentic Intervier
          </div>
          
          <h2 className="auth-brand-title">
            The platform for<br/>
            <span className="text-gradient">elite engineers.</span>
          </h2>
          
          <p className="auth-brand-subtitle">
            Unlock interview simulation, resume scoring, ATS checks, and agentic coaching in one elite workspace.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feat">
              <CheckCircle2 size={18} className="feat-icon" />
              <span>Resume coverage & missing signals</span>
            </div>
            <div className="auth-feat">
              <CheckCircle2 size={18} className="feat-icon" />
              <span>Predicted questions via company intel</span>
            </div>
            <div className="auth-feat">
              <CheckCircle2 size={18} className="feat-icon" />
              <span>Live scoring & conversational voice</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form Panel */}
        <motion.div 
          className="auth-premium-form-side"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-form-glass">
            <div className="auth-form-header">
               <h3>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h3>
               <p>{mode === 'login' ? 'Enter your details to access your dashboard.' : 'Start your prep journey right now.'}</p>
            </div>

            <div className="auth-tabs-premium">
              <button 
                className={`auth-tab-premium ${mode === 'login' ? 'active' : ''}`} 
                onClick={() => setMode('login')}
              >
                Log in
              </button>
              <button 
                className={`auth-tab-premium ${mode === 'register' ? 'active' : ''}`} 
                onClick={() => setMode('register')}
              >
                Sign up
              </button>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.form 
                key={mode}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="auth-form-body"
              >
                {mode === 'register' && (
                  <div className="field-group">
                    <label>Full name</label>
                    <input
                      className="input-premium"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                )}

                <div className="field-group">
                  <label>Email address</label>
                  <input
                    className="input-premium"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="jane@example.com"
                    required
                  />
                </div>

                <div className="field-group">
                  <label>Password</label>
                  <input
                    className="input-premium"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      className="auth-error-alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button className="btn-glow-large btn-full" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="flex-center gap-2"><Sparkles size={16} className="spin-anim" /> Processing...</span>
                  ) : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
