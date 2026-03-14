import { motion, useInView } from 'framer-motion';
import { Bot, Briefcase, FileText, Sparkles, UserCheck, Mic, ArrowRight, Activity, BrainCircuit } from 'lucide-react';
import { useRef } from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const FadeIn = ({ children, delay = 0, y = 30 }: { children: React.ReactNode; delay?: number; y?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, cubicBezier: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export function LandingPage(props: LandingPageProps) {
  return (
    <div className="lp-premium">
      <div className="bg-noise"></div>
      <div className="lp-orb premium-orb-a" />
      <div className="lp-orb premium-orb-b" />
      <div className="lp-orb premium-orb-c" />
      
      {/* Nav */}
      <nav className="lp-nav-premium">
        <motion.div 
          className="lp-brand-premium"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="brand-dot-glow"></div>
          Agentic Intervier
        </motion.div>
        <motion.div 
          className="lp-nav-actions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button className="btn-clean" onClick={props.onLogin}>Sign In</button>
          <button className="btn-glow" onClick={props.onRegister}>Get Started Free</button>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="lp-hero-premium">
        <FadeIn delay={0.1} y={40}>
          <div className="pill-badge">
            <Sparkles className="pill-icon" size={14} />
            <span>Next-Generation Career Copilot</span>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2} y={50}>
          <h1 className="hero-title">
            Master your narrative.<br />
            <span className="text-gradient">Dominate the interview.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3} y={40}>
          <p className="hero-subtitle">
            Agentic Intervier powers real-time mock interviews with precise turn-by-turn scoring, dynamic resume intelligence, ATS evaluation, and elite job matching.
          </p>
        </FadeIn>

        <FadeIn delay={0.4} y={30}>
          <div className="hero-cta-group">
            <button className="btn-glow-large" onClick={props.onRegister}>
              Start Prep Now <ArrowRight size={18} />
            </button>
            <button className="btn-outline-large" onClick={props.onLogin}>
              Enter Live Studio
            </button>
          </div>
        </FadeIn>

        <FadeIn delay={0.6} y={60}>
          <div className="hero-stats-glass">
            <div className="stat-glass">
              <span className="stat-val">98%</span>
              <span className="stat-lbl">Realism Matched</span>
            </div>
            <div className="stat-glass">
              <span className="stat-val">5+</span>
              <span className="stat-lbl">Role Contexts</span>
            </div>
            <div className="stat-glass">
              <span className="stat-val">4</span>
              <span className="stat-lbl">Eval Dimensions</span>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* 3D Dashboard Preview */}
      <section className="preview-section">
        <FadeIn delay={0.2}>
          <div className="dashboard-3d-wrapper">
             <div className="dashboard-3d-frame">
               <div className="dash-mock-sidebar">
                  <div className="mock-dot"></div>
                  <div className="mock-line"></div>
                  <div className="mock-line short"></div>
               </div>
               <div className="dash-mock-body">
                 <div className="dash-mock-top"></div>
                 <div className="dash-mock-grid">
                   <div className="dash-mock-card large"></div>
                   <div className="dash-mock-card thin"></div>
                   <div className="dash-mock-card"></div>
                   <div className="dash-mock-card"></div>
                 </div>
               </div>
             </div>
          </div>
        </FadeIn>
      </section>

      {/* Feature Bento Box */}
      <section className="bento-section">
        <FadeIn>
          <div className="section-header">
            <h2>The ultimate career intelligence suite</h2>
            <p>Everything you need from initial resume tuning to final behavioral rounds.</p>
          </div>
        </FadeIn>

        <div className="bento-grid">
          <FadeIn delay={0.1}>
            <div className="bento-card bento-wide bento-glass">
              <div className="bento-icon-wrapper"><FileText size={24} /></div>
              <h3>Deep Resume Scan</h3>
              <p>Upload your resume. AI extracts skills, assesses missing signals, and prepares your conversational memory context.</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <div className="bento-card bento-glass">
              <div className="bento-icon-wrapper"><Bot size={24} /></div>
              <h3>Multi-Agent Grading</h3>
              <p>Orchestrator, Evaluator, and Coach agents analyze your turns in real time.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="bento-card bento-glass">
              <div className="bento-icon-wrapper"><Mic size={24} /></div>
              <h3>Native Voice</h3>
              <p>Speak naturally, get auditory follow-ups, emulate live stress.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="bento-card bento-tall bento-glass highlight-card">
               <div className="glow-bg"></div>
              <div className="bento-icon-wrapper"><Briefcase size={28} /></div>
              <h3>ATS & Job Matches</h3>
              <p>Input a target Job Description to instantly calculate match percent, reveal missing competencies, and generate robust cover letters alongside targeted LinkedIn optimization tips.</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.5}>
            <div className="bento-card bento-glass">
              <div className="bento-icon-wrapper"><BrainCircuit size={24} /></div>
              <h3>Adaptive Engine</h3>
              <p>The system adapts dynamically based on your performance trajectory.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.6}>
            <div className="bento-card bento-glass">
              <div className="bento-icon-wrapper"><Activity size={24} /></div>
              <h3>Evidence-Backed</h3>
              <p>Feedback sites exactly which sentences cost you points in Technical Accuracy.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="lp-footer-premium">
        <p>© 2026 Agentic Intervier. Transforming technical recruitment preparation.</p>
      </div>
    </div>
  );
}
